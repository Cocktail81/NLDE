import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const MAX_FAILED_ATTEMPTS = 5
const WINDOW_SECONDS = 10 * 60
const MAX_EMAIL_LENGTH = 254
const MAX_PASSWORD_LENGTH = 256
const MAX_USER_AGENT_LENGTH = 512

function getClientIp(request: NextRequest) {
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  const realIp = request.headers.get('x-real-ip')
  const forwardedFor = request.headers.get('x-forwarded-for')

  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }

  if (realIp) {
    return realIp.trim()
  }

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  return 'unknown'
}

async function countFailedAttempts(params: {
  email: string
  ipAddress: string
  since: string
}) {
  const adminSupabase = createAdminClient()

  const { count: emailCount, error: emailError } = await adminSupabase
    .from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('email', params.email)
    .eq('success', false)
    .gte('created_at', params.since)

  if (emailError) {
    throw emailError
  }

  let ipCount = 0

  if (params.ipAddress !== 'unknown') {
    const { count, error } = await adminSupabase
      .from('login_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', params.ipAddress)
      .eq('success', false)
      .gte('created_at', params.since)

    if (error) {
      throw error
    }

    ipCount = count || 0
  }

  return Math.max(emailCount || 0, ipCount)
}

async function recordLoginAttempt(params: {
  email: string
  ipAddress: string
  success: boolean
  reason: string
  userAgent: string
}) {
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase.from('login_attempts').insert({
    email: params.email,
    ip_address: params.ipAddress,
    success: params.success,
    reason: params.reason,
    user_agent: params.userAgent,
  })

  if (error) {
    throw error
  }
}

async function clearFailedAttempts(params: {
  email: string
  ipAddress: string
}) {
  const adminSupabase = createAdminClient()

  const { error: emailDeleteError } = await adminSupabase
    .from('login_attempts')
    .delete()
    .eq('email', params.email)
    .eq('success', false)

  if (emailDeleteError) {
    throw emailDeleteError
  }

  if (params.ipAddress !== 'unknown') {
    const { error: ipDeleteError } = await adminSupabase
      .from('login_attempts')
      .delete()
      .eq('ip_address', params.ipAddress)
      .eq('success', false)

    if (ipDeleteError) {
      throw ipDeleteError
    }
  }
}

async function parseLoginRequest(request: NextRequest) {
  try {
    return (await request.json()) as {
      email?: string
      password?: string
    }
  } catch {
    return null
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseLoginRequest(request)

    if (!body) {
      return NextResponse.json(
        { error: 'Invalid login request.' },
        { status: 400 }
      )
    }

    const email = body.email?.trim().toLowerCase()
    const password = body.password || ''
    const ipAddress = getClientIp(request)
    const userAgent =
      request.headers.get('user-agent')?.slice(0, MAX_USER_AGENT_LENGTH) ||
      'unknown'

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please enter both email address and password.' },
        { status: 400 }
      )
    }

    if (email.length > MAX_EMAIL_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 400 }
      )
    }
    
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    const since = new Date(
      Date.now() - WINDOW_SECONDS * 1000
    ).toISOString()

    const failedAttempts = await countFailedAttempts({
      email,
      ipAddress,
      since,
    })

    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Please try again in ${WINDOW_SECONDS / 60} minutes.`,
          retryAfterSeconds: WINDOW_SECONDS,
        },
        { status: 429 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user || !data.session) {
      const nextFailedAttempts = failedAttempts + 1
      const remainingAttempts = Math.max(
        0,
        MAX_FAILED_ATTEMPTS - nextFailedAttempts
      )

      await recordLoginAttempt({
        email,
        ipAddress,
        success: false,
        reason: 'invalid_credentials',
        userAgent,
      })

      if (nextFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        return NextResponse.json(
          {
            error: `Too many failed attempts. Please try again in ${WINDOW_SECONDS / 60} minutes.`,
            retryAfterSeconds: WINDOW_SECONDS,
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          error: 'Invalid email or password.',
          remainingAttempts,
        },
        { status: 401 }
      )
    }

    try {
      await recordLoginAttempt({
        email,
        ipAddress,
        success: true,
        reason: 'login_success',
        userAgent,
      })
    
      await clearFailedAttempts({
        email,
        ipAddress,
      })
    } catch (auditError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Login audit cleanup error]', auditError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Login route error]', error)
    }

    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}