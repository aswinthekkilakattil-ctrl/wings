import { createSecureContext } from 'node:tls'
import { MongoClient } from 'mongodb'

function getMongoClientOptions() {
  const nodeMajor = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10)

  // Node 24/OpenSSL 3.5 can fail Atlas handshakes locally with SSL alert 80.
  // Lowering the OpenSSL security level for this client restores the Atlas TLS handshake.
  if (Number.isNaN(nodeMajor) || nodeMajor < 24) {
    return {}
  }

  return {
    secureContext: createSecureContext({
      ciphers: 'DEFAULT@SECLEVEL=1',
    }),
  }
}

function getClientPromise() {
  if (!globalThis.__mongoClientPromise) {
    const uri = process.env.MONGODB_URI
    if (!uri) {
      throw new Error('Missing MONGODB_URI in environment.')
    }
    const client = new MongoClient(uri, getMongoClientOptions())
    globalThis.__mongoClientPromise = client.connect()
  }
  return globalThis.__mongoClientPromise
}

function setNoStoreHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('Surrogate-Control', 'no-store')
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function getQueryParam(req, key) {
  const value = Array.isArray(req.query?.[key]) ? req.query[key][0] : req.query?.[key]
  return normalizeString(value)
}

function getDeleteId(req) {
  const queryId = getQueryParam(req, 'id')
  if (queryId) return queryId

  const body = typeof req.body === 'string'
    ? JSON.parse(req.body || '{}')
    : req.body

  return normalizeString(body?.id)
}

export default async function handler(req, res) {
  setNoStoreHeaders(res)

  if (req.method === 'GET') {
    try {
      const client = await getClientPromise()
      const db = client.db('wings')
      const collection = db.collection('leads')
      const docs = await collection.find({}).sort({ submittedAt: -1 }).toArray()
      const sanitized = docs.map(({ _id, ...rest }) => rest)
      return res.status(200).json({ documents: sanitized })
    } catch (error) {
      console.error('Failed to fetch leads', error)
      const message = process.env.NODE_ENV !== 'production' && error instanceof Error
        ? error.message
        : 'INTERNAL_ERROR'
      return res.status(500).json({ error: message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const client = await getClientPromise()
      const db = client.db('wings')
      const collection = db.collection('leads')
      const id = getDeleteId(req)

      if (id) {
        const result = await collection.deleteOne({ id })
        if (!result.deletedCount) {
          return res.status(404).json({ error: 'LEAD_NOT_FOUND' })
        }
        return res.status(200).json({ success: true, deletedCount: result.deletedCount })
      }

      const result = await collection.deleteMany({})
      return res.status(200).json({ success: true, deletedCount: result.deletedCount })
    } catch (error) {
      console.error('Failed to clear leads', error)
      const message = process.env.NODE_ENV !== 'production' && error instanceof Error
        ? error.message
        : 'INTERNAL_ERROR'
      return res.status(500).json({ error: message })
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const studentName = typeof body?.studentName === 'string'
      ? body.studentName.trim()
      : (typeof body?.name === 'string' ? body.name.trim() : '')
    const guardianName = typeof body?.guardianName === 'string' ? body.guardianName.trim() : ''
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
    const school = typeof body?.school === 'string' ? body.school.trim() : ''
    const standard = typeof body?.standard === 'string' ? body.standard.trim() : ''
    const place = typeof body?.place === 'string' ? body.place.trim() : ''
    const consent = typeof body?.consent === 'boolean'
      ? body.consent
      : body?.consent === 'true'
    const submittedAt = typeof body?.submittedAt === 'string' ? body.submittedAt : ''
    const id = typeof body?.id === 'string' ? body.id : ''

    if (!studentName || !guardianName || !phone || !school || !standard || !place) {
      return res.status(400).json({ error: 'MISSING_FIELDS' })
    }

    const client = await getClientPromise()
    const db = client.db('wings')
    const collection = db.collection('leads')

    const existing = await collection.findOne({ phone })
    if (existing) {
      return res.status(409).json({ error: 'DUPLICATE_PHONE' })
    }

    await collection.insertOne({
      id: id || undefined,
      submittedAt: submittedAt || new Date().toISOString(),
      studentName,
      guardianName,
      phone,
      school,
      standard,
      place,
      consent,
      createdAt: new Date(),
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Failed to insert lead', error)
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return res.status(409).json({ error: 'DUPLICATE_PHONE' })
    }
    const message = process.env.NODE_ENV !== 'production' && error instanceof Error
      ? error.message
      : 'INTERNAL_ERROR'
    return res.status(500).json({ error: message })
  }
}
