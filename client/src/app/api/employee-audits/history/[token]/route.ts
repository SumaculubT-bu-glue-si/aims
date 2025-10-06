import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      )
    }

    // Use GraphQL to get audit history
    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8000/api/graphql'
    const query = `
      query GetAuditHistory($token: String!) {
        auditHistory(token: $token) {
          success
          message
          auditHistory {
            id
            asset_type
            model
            status
            notes
            audited_at
            audit_plan_name
            location
            user
          }
        }
      }
    `

    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { token }
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch audit history" },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    if (result.errors) {
      return NextResponse.json(
        { success: false, message: result.errors[0]?.message || "GraphQL error" },
        { status: 400 }
      )
    }

    const data = result.data.auditHistory
    
    if (!data.success) {
      if (data.message.includes('expired') || data.message.includes('invalid')) {
        return NextResponse.json(
          { success: false, message: "Access token expired or invalid" },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { success: false, message: data.message || "Failed to fetch audit history" },
        { status: 400 }
      )
    }

    // Transform the GraphQL response to match the expected format
    return NextResponse.json({
      success: data.success,
      auditHistory: data.auditHistory
    })
  } catch (error) {
    console.error('Error fetching audit history:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
