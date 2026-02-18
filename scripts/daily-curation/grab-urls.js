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

// Load .env.local from project root for DATABASE_URL
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') })

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

// Load config from prompts.json
const PROMPTS_PATH = path.join(__dirname, 'prompts.json')
if (!fs.existsSync(PROMPTS_PATH)) {
  console.error('Error: prompts.json not found in', __dirname)
  process.exit(1)
}
const PROMPTS = JSON.parse(fs.readFileSync(PROMPTS_PATH, 'utf8'))
const CATEGORIES = Object.keys(PROMPTS.categories)

console.log(`Loaded ${CATEGORIES.length} categories from prompts.json`)

const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })

// Load queries and URLs from all previous JSON files to avoid repeats
function loadPastData() {
  const pastQueries = {} // { category: [query, query, ...] }
  const pastUrls = new Set()
  const dir = path.join(__dirname)
  const files = fs.readdirSync(dir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f !== `${DATE}.json`)
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
      for (const [cat, videos] of Object.entries(data.categories || {})) {
        if (!pastQueries[cat]) pastQueries[cat] = new Set()
        for (const v of videos) {
          if (v.query) pastQueries[cat].add(v.query)
          if (v.url) pastUrls.add(v.url)
        }
      }
    } catch (_) { /* skip broken files */ }
  }
  for (const cat of Object.keys(pastQueries)) {
    pastQueries[cat] = [...pastQueries[cat]]
  }
  return { pastQueries, pastUrls }
}

const { pastQueries, pastUrls } = loadPastData()
console.log(`Loaded ${pastUrls.size} previously fetched URLs to deduplicate`)

// Load rejection feedback from Neon DB
let rejectionFeedback = {} // { category: { titles: [...], count: N } }
async function loadRejectionFeedback() {
  const dbUrl = process.env.POSTGRES_URL
  if (!dbUrl) {
    console.log('No POSTGRES_URL found, skipping rejection feedback')
    return
  }

  const { Pool } = require('pg')
  const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })

  try {
    // Get rejected video titles grouped by category (last 90 days)
    const result = await pool.query(`
      SELECT category, youtube_title
      FROM rejected_videos
      WHERE rejected_at > NOW() - INTERVAL '90 days'
        AND youtube_title IS NOT NULL AND youtube_title != ''
      ORDER BY rejected_at DESC
    `)

    // Also load rejected URLs to skip
    const urlResult = await pool.query(`SELECT video_link FROM rejected_videos`)
    for (const row of urlResult.rows) {
      pastUrls.add(row.video_link)
    }

    // Group titles by category
    for (const row of result.rows) {
      if (!rejectionFeedback[row.category]) {
        rejectionFeedback[row.category] = { titles: [], count: 0 }
      }
      rejectionFeedback[row.category].count++
      if (rejectionFeedback[row.category].titles.length < 20) {
        rejectionFeedback[row.category].titles.push(row.youtube_title)
      }
    }

    await pool.end()

    const totalRejected = Object.values(rejectionFeedback).reduce((sum, f) => sum + f.count, 0)
    console.log(`Loaded ${totalRejected} rejection patterns from DB (${urlResult.rows.length} rejected URLs)`)
  } catch (err) {
    console.error('Error loading rejection feedback:', err.message)
  }
}

async function generateQueriesForCategory(category) {
  const config = PROMPTS.categories[category]
  const description = config.description
  const avoidRules = config.avoid ? ` ${config.avoid}.` : ''
  const past = pastQueries[category] || []
  const avoidBlock = past.length > 0
    ? `\nPreviously used queries (DO NOT reuse or rephrase these):\n${past.map(q => `- "${q}"`).join('\n')}\n`
    : ''

  // Add rejection feedback from finalized batches
  const feedback = rejectionFeedback[category]
  const rejectionBlock = feedback && feedback.titles.length > 0
    ? `\nVideos like these were REJECTED by our curator (avoid similar content):\n${feedback.titles.map(t => `- "${t}"`).join('\n')}\n`
    : ''

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Generate 3 YouTube search queries to find short, embeddable, awe-inspiring videos about: ${description}.${avoidRules}

Category: ${category}
Today's date: ${DATE}
${avoidBlock}${rejectionBlock}
Rules:
- Each query should be specific enough to return high-quality, genuine videos (not clickbait)
- Prefer queries that find real moments over AI-generated or fictional content
- Keep queries under 8 words each
- Come up with FRESH, CREATIVE angles — explore different sub-topics within this category
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

// Parse ISO 8601 duration (PT1M30S) to seconds
function parseDuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0)
}

// Fetch actual durations for a list of video IDs, returns { videoId: seconds }
async function getVideoDurations(videoIds) {
  if (videoIds.length === 0) return {}
  const params = new URLSearchParams({
    part: 'contentDetails',
    id: videoIds.join(','),
    key: YOUTUBE_KEY
  })
  const url = `https://www.googleapis.com/youtube/v3/videos?${params}`
  const data = await fetchJSON(url)
  if (data.error) throw new Error(`YouTube API error: ${data.error.message}`)
  const durations = {}
  for (const item of (data.items || [])) {
    durations[item.id] = parseDuration(item.contentDetails.duration)
  }
  return durations
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
          if (!seenUrls.has(video.url) && !pastUrls.has(video.url)) {
            seenUrls.add(video.url)
            videos.push({ ...video, query })
          }
        }
        await new Promise(r => setTimeout(r, 300))
      } catch (err) {
        console.error(`  YouTube error for "${query}": ${err.message}`)
      }
    }

    // Step 3: Filter by minimum duration if configured
    const minDur = PROMPTS.categories[category]?.minDurationSeconds || 0
    if (minDur > 0 && videos.length > 0) {
      const ids = videos.map(v => v.url.match(/v=([^&]+)/)?.[1]).filter(Boolean)
      try {
        const durations = await getVideoDurations(ids)
        const before = videos.length
        const filtered = videos.filter(v => {
          const id = v.url.match(/v=([^&]+)/)?.[1]
          const dur = durations[id]
          return dur && dur >= minDur
        })
        videos.length = 0
        videos.push(...filtered)
        console.log(`  Duration filter (>=${Math.floor(minDur/60)}:${String(minDur%60).padStart(2,'0')}): kept ${videos.length}/${before}`)
      } catch (err) {
        console.error(`  Duration check error: ${err.message}`)
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

  // Load rejection feedback from DB before generating queries
  await loadRejectionFeedback()

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
