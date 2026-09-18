import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) return NextResponse.redirect(`${origin}/login`)

  // exchange code for session — need to propagate cookies to redirect response
  const redirectRes = NextResponse.redirect(`${origin}${next}`)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // parse from request Cookie header
          const cookieHeader = request.headers.get('cookie') ?? ''
          return cookieHeader.split(';').filter(Boolean).map((c) => {
            const [name, ...rest] = c.trim().split('=')
            return { name, value: rest.join('=') }
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => redirectRes.cookies.set(name, value, options))
        },
      },
    }
  )
  await supabase.auth.exchangeCodeForSession(code)
  return redirectRes
}
