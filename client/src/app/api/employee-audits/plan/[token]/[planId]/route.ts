import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string; planId: string } }
) {
  try {
    const { token, planId } = params
    
    // Use GraphQL to get audit plan assets
    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8000/api/graphql'
    const query = `
      query GetAuditPlanAssets($token: String!, $planId: ID!) {
        auditPlanAssets(token: $token, planId: $planId) {
          success
          message
          auditPlan {
            id
            name
            start_date
            due_date
            status
          }
          auditAssets {
            id
            asset_id
            asset_type
            model
            original_user
            original_location
            current_user
            current_location
            status
            audit_status
            notes
            audited_at
            resolved
          }
          progress {
            total_assets
            audited_assets
            percentage
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
        variables: { token, planId }
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to fetch audit plan data" },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    if (result.errors) {
      return NextResponse.json(
        { message: result.errors[0]?.message || "GraphQL error" },
        { status: 400 }
      )
    }

    const data = result.data.auditPlanAssets
    
    if (!data.success) {
      if (data.message.includes('expired') || data.message.includes('invalid')) {
        return NextResponse.json(
          { message: "Access token expired or invalid" },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { message: data.message || "Failed to fetch audit plan data" },
        { status: 400 }
      )
    }

    // Transform the GraphQL response to match the expected format
    return NextResponse.json({
      success: data.success,
      auditPlan: data.auditPlan,
      auditAssets: data.auditAssets,
      progress: data.progress
    })
  } catch (error) {
    console.error("Employee audit plan access error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
