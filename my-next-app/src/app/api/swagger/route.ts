/**
 * @swagger
 * /api/swagger:
 *   get:
 *     tags: [Documentation]
 *     summary: Get OpenAPI specification
 *     description: Returns the complete OpenAPI 3.0 specification for the MakeItSo Finance API
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: OpenAPI 3.0 specification document
 */

import { NextRequest, NextResponse } from 'next/server'
import { swaggerSpec } from '@/lib/swagger'

export async function GET(request: NextRequest) {
  try {
    // Return the generated swagger specification
    return NextResponse.json(swaggerSpec)
  } catch (error) {
    console.error('Error generating Swagger spec:', error)
    return NextResponse.json(
      { error: 'Failed to generate API specification' },
      { status: 500 }
    )
  }
}