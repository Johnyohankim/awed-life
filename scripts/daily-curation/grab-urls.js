#!/usr/bin/env node
/**
 * Daily YouTube URL Grabber for Awed.life Curation
 *
 * Flow:
 *  1. Claude API generates fresh search queries for each awe category
 *  2. YouTube Data API searches for embeddable videos using those queries
 *  3. Results saved to YYYY-MM-DD.json and YYYY-MM-DD.txt
 *
 * Usage: YOUTUBE_API_KEY=... ANTHROPIC_API_KEY=... node grab-urls.js [YYYY-MM-DD]
 */

const https = require('https')
const fs = require('fs')
const path = require('path')
const Anthropic = require('@anthropic-ai/sdk')

const YOUTUBE_KEY = process.env.YOUTUBE_API_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

if (!YOUTUBE_KEY) {
  console.error('Error: YOUTUBE_API_KEY environment variable is required')
  process.exit(1)
}
if (!ANTHROPIC_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is required')
  process.exit(1)
}

const DATE = process.argv[2] || new Date().toISOString().split('T')[0]

const CATEGORIES = [
  'moral-beauty',
  'collective-effervescence',
  'nature',
  'music',
  'visual-design',
  'spirituality',
  'life-death',
  'epiphany'
]

const CATEGORY_DESCRIPTIONS = {
  'moral-beauty': 'acts of kindness, courage, virtue, compassion, selflessness, people helping others',
  'collective-effervescence': 'crowds singing together, flash mobs, group celebrations, shared joy, community gatherings, sports fans uniting',
  'nature': 'stunning landscapes, wildlife, aurora borealis, ocean, mountains, timelapse of nature, breathtaking scenery',
  'music': 'live performances that move audiences to tears, unexpected musical talent, orchestras, street musicians, awe-inspiring concerts',
  'visual-design': 'mesmerizing art installations, incredible architecture, optical illusions, stunning visual art, mind-bending design',
  'spirituality': 'sacred rituals, meditation, religious ceremonies, moments of transcendence, spiritual experiences across world religions',
  'life-death': 'birth moments, hospice care, life cycles in nature, metamorphosis, the miracle of life beginning and ending',
  'epiphany': 'eureka moments, mind-expanding thought experiments, perspective-shifting realizations, scientific discoveries explained simply'
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })

async function generateQueriesForCategory(category) {
  const description = CATEGORY_DESCRIPTIONS[category]
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Generate 3 YouTube search queries to find short, embeddable, awe-inspiring videos about: ${description}

Category: ${category}
Today's date: ${DATE}

Rules:
- Each query should be specific enough to return high-quality, genuine videos (not clickbait)
- Prefer queries that find real moments over AI-generated or fictional content
- Keep queries under 8 words each
- Return ONLY the 3 queries, one per line, no numbering or explanation`
    }]
  })

  const text = message.content[0].text.trim()
  return text.split('\n').map(q => q.trim()).filter(q => q.length > 0).slice(0, 3)
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error('Failed to parse JSON: ' + data.slice(0, 200))) }
      })
    }).on('error', reject)
  })
}

async function searchYouTube(query, maxResults = 5) {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    videoEmbeddable: 'true',
    videoDuration: 'short',
    order: 'relevance',
    maxResults: String(maxResults),
    key: YOUTUBE_KEY
  })
  const url = `https://www.googleapis.com/youtube/v3/search?${params}`
  const data = await fetchJSON(url)

  if (data.error) {
    throw new Error(`YouTube API error: ${data.error.message}`)
  }

  return (data.items || []).map(item => ({
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    description: item.snippet.description?.slice(0, 100)
  }))
}

async function grabAllCategories() {
  const results = {
    date: DATE,
    generated_at: new Date().toISOString(),
    categories: {}
  }

  for (const category of CATEGORIES) {
    console.log(`\nFetching: ${category}`)

    // Step 1: Claude generates search queries
    let queries = []
    try {
      console.log('  Asking Claude for search queries...')
      queries = await generateQueriesForCategory(category)
      console.log(`  Queries: ${queries.map(q => `"${q}"`).join(', ')}`)
    } catch (err) {
      console.error(`  Claude error: ${err.message}`)
      queries = [category.replace(/-/g, ' ') + ' inspiring video']
    }

    // Step 2: YouTube search with those queries
    const videos = []
    const seenUrls = new Set()

    for (const query of queries) {
      try {
        const found = await searchYouTube(query, 5)
        for (const video of found) {
          if (!seenUrls.has(video.url)) {
            seenUrls.add(video.url)
            videos.push({ ...video, query })
          }
        }
        await new Promise(r => setTimeout(r, 300))
      } catch (err) {
        console.error(`  YouTube error for "${query}": ${err.message}`)
      }
    }

    results.categories[category] = videos
    console.log(`  Found ${videos.length} unique videos`)
  }

  return results
}

async function main() {
  console.log(`Daily YouTube URL Grab — ${DATE}`)
  console.log('='.repeat(40))

  const results = await grabAllCategories()

  const outputDir = path.join(__dirname)
  const outputPath = path.join(outputDir, `${DATE}.json`)
  const txtPath = path.join(outputDir, `${DATE}.txt`)

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))

  // Plain .txt with one URL per line, grouped by category
  const txtLines = []
  for (const [cat, videos] of Object.entries(results.categories)) {
    if (videos.length === 0) continue
    txtLines.push(`# ${cat}`)
    for (const v of videos) {
      txtLines.push(v.url)
    }
    txtLines.push('')
  }
  fs.writeFileSync(txtPath, txtLines.join('\n'))

  console.log('\n' + '='.repeat(40))
  console.log(`Saved JSON: ${outputPath}`)
  console.log(`Saved TXT:  ${txtPath}`)

  let totalVideos = 0
  for (const [cat, videos] of Object.entries(results.categories)) {
    console.log(`  ${cat}: ${videos.length} videos`)
    totalVideos += videos.length
  }
  console.log(`Total: ${totalVideos} videos`)
  console.log('\nDone! Review the TXT file and submit URLs via admin bulk-submit.')
}

main().catch(err => {
  console.error('Fatal error:', err.message)
  process.exit(1)
})
