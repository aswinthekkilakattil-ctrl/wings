import type { IncomingMessage, ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

import leadsHandler from './api/leads.js'

type DevApiRequest = IncomingMessage & {
  query?: Record<string, string | string[]>
  body?: string
}

type DevApiResponse = ServerResponse & {
  status: (code: number) => DevApiResponse
  json: (payload: unknown) => void
}

function parseQuery(urlText: string | undefined) {
  const url = new URL(urlText ?? '/', 'http://localhost')
  const query: Record<string, string | string[]> = {}

  for (const [key, value] of url.searchParams.entries()) {
    const current = query[key]
    if (typeof current === 'undefined') {
      query[key] = value
      continue
    }
    query[key] = Array.isArray(current) ? [...current, value] : [current, value]
  }

  return query
}

async function readBody(req: IncomingMessage) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return ''
  }

  return await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []

    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function augmentResponse(res: ServerResponse): DevApiResponse {
  const apiResponse = res as DevApiResponse

  apiResponse.status = (code: number) => {
    res.statusCode = code
    return apiResponse
  }
  apiResponse.json = (payload: unknown) => {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
    }
    res.end(JSON.stringify(payload))
  }

  return apiResponse
}

function mongoApiDevPlugin(): Plugin {
  return {
    name: 'mongo-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/leads', async (req, res, next) => {
        try {
          const apiRequest = req as DevApiRequest
          apiRequest.query = parseQuery(req.url)

          const body = await readBody(req)
          if (body) {
            apiRequest.body = body
          }

          await leadsHandler(apiRequest as never, augmentResponse(res) as never)
        } catch (error) {
          next(error as Error)
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const serverEnvKeys = [
    'MONGODB_URI',
    'SUBMISSION_ALERT_EMAIL_USER',
    'SUBMISSION_ALERT_EMAIL_PASS',
    'SUBMISSION_ALERT_EMAIL_TO',
  ]

  for (const key of serverEnvKeys) {
    if (env[key] && !process.env[key]) {
      process.env[key] = env[key]
    }
  }

  return {
    plugins: [react(), mongoApiDevPlugin()],
    build: {
      outDir: 'dist',
    },
  }
})
