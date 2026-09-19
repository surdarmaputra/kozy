// Vercel entry point. Vercel invokes this with Node's (req, res); TanStack Start
// builds a Web-standard fetch handler, so translate between the two. Routing
// lives in vercel.json.
import server from '../dist/server/server.js'

function toRequest(req) {
  const url = new URL(req.url, `https://${req.headers.host}`)
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) for (const v of value) headers.append(key, v)
    else if (value !== undefined) headers.set(key, value)
  }
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  return new Request(url, {
    method: req.method,
    headers,
    body: hasBody ? req : undefined,
    duplex: hasBody ? 'half' : undefined,
  })
}

export default async function handler(req, res) {
  const response = await server.fetch(toRequest(req))

  res.statusCode = response.status
  for (const [key, value] of response.headers) {
    if (key !== 'set-cookie') res.setHeader(key, value)
  }
  const cookies = response.headers.getSetCookie?.() ?? []
  if (cookies.length > 0) res.setHeader('set-cookie', cookies)

  if (!response.body) return res.end()
  for await (const chunk of response.body) res.write(chunk)
  res.end()
}
