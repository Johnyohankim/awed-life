export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/signup', '/login', '/about', '/terms', '/privacy'],
        disallow: ['/admin', '/api/', '/cards', '/collection', '/journey', '/submit', '/profile', '/upload-video'],
      },
    ],
    sitemap: 'https://awed.life/sitemap.xml',
  }
}