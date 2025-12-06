export default defineEventHandler(async (event) => {
  const protocol = event.node.req.headers['x-forwarded-proto'] || 'http'
  const host = event.node.req.headers.host
  const baseUrl = `${protocol}://${host}`

  // Agregamos la referencia al Sitemap
  const robots = `
User-agent: *
Allow: /
Disallow: /historial
Disallow: /emitir
Disallow: /gestion
Disallow: /admin
Disallow: /api

# ESTA LÍNEA ES VITAL PARA GOOGLE:
Sitemap: ${baseUrl}/sitemap.xml
  `.trim()

  setResponseHeader(event, 'Content-Type', 'text/plain')
  return robots
})