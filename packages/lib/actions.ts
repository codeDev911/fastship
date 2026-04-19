'use server'
import { cookies } from 'next/headers'

export async function setSessionCookie(key: string, data: string) {
  const cookieStore = await cookies() // Await required in Next.js 15+
  cookieStore.set(key, data, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}
