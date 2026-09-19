// Vercel entry point. TanStack Start builds a Web-standard fetch handler; this
// hands every non-static request to it. Routing lives in vercel.json.
import server from '../dist/server/server.js'

export default (request) => server.fetch(request)
