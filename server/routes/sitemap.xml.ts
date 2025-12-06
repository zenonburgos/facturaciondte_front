export default defineEventHandler(async (event) => {
  // Detecta el dominio actual automáticamente (sirve para los 2 dominios)
  const protocol = event.node.req.headers['x-forwarded-proto'] || 'http'
  const host = event.node.req.headers.host
  const baseUrl = `${protocol}://${host}`

  // Tus rutas públicas
  const routes = ['/', '/login', '/register']

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${routes.map(route => `
        <url>
          <loc>${baseUrl}${route}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>${route === '/' ? '1.0' : '0.8'}</priority>
        </url>
      `).join('')}
    </urlset>`

  setResponseHeader(event, 'Content-Type', 'application/xml')
  return sitemap
})