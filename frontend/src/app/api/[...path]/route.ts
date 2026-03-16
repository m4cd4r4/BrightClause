import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://45.77.233.102:8002'
const BACKEND_API_KEY = process.env.BACKEND_API_KEY || ''
const PROXY_SECRET = process.env.PROXY_SECRET || ''

async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Verify client is authorized to use the proxy
  if (PROXY_SECRET) {
    const clientToken = request.headers.get('x-proxy-token')
    if (clientToken !== PROXY_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const { path } = await params
  const target = new URL(`/${path.join('/')}`, BACKEND_URL)

  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value)
  })

  const headers: Record<string, string> = {}
  if (BACKEND_API_KEY) {
    headers['X-API-Key'] = BACKEND_API_KEY
  }

  const contentType = request.headers.get('content-type')
  if (contentType) {
    headers['content-type'] = contentType
  }

  const init: RequestInit = { method: request.method, headers }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer()
  }

  try {
    const upstream = await fetch(target.toString(), init)

    const responseHeaders = new Headers()
    upstream.headers.forEach((value, key) => {
      if (!['transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value)
      }
    })

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    })
  } catch {
    return NextResponse.json(
      { error: 'Backend unavailable' },
      { status: 502 }
    )
  }
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const DELETE = proxy
export const PATCH = proxy
