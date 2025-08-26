import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Simple demo authentication
    if (email === 'admin@makeitso.finance' && password === 'SecurePass123!') {
      // Create JWT token
      const token = jwt.sign(
        { 
          id: '1', 
          email: 'admin@makeitso.finance', 
          name: 'Admin User' 
        },
        JWT_SECRET,
        { expiresIn: '1d' }
      )

      // Create response
      const response = NextResponse.json({
        success: true,
        user: {
          id: '1',
          email: 'admin@makeitso.finance',
          name: 'Admin User'
        }
      })

      // Set HTTP-only cookie
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400 // 1 day
      })

      return response
    }

    return NextResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    )
  }
}