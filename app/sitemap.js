export default function sitemap() {
  const base = 'https://awed.life'

  return [
    { url: base,                 lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/signup`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/login`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/about`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/terms`,      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/privacy`,    lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ]
}