import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    return NextResponse.json({
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name
      }
    })
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}