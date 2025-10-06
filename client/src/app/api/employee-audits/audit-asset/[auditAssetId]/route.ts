import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { auditAssetId: string } }
) {
  try {
    const auditAssetId = params.auditAssetId
    
    if (!auditAssetId) {
      return NextResponse.json(
        { success: false, message: 'Audit Asset ID is required' },
        { status: 400 }
      )
    }

    // Use GraphQL to get audit asset details
    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8000/api/graphql'
    const query = `
      query GetAuditAssetDetails($auditAssetId: ID!) {
        auditAssetDetails(auditAssetId: $auditAssetId) {
          success
          message
          audit_asset {
            id
            asset_id
            asset_type
            model
            original_location
            original_user
            current_status
            current_location
            current_user
            auditor_notes
            audited_at
            resolved
            audit_status
            audit_summary {
              summary
              findings
              recommendations
            }
            status_history {
              from_status
              to_status
              changed_at
              changed_by
              reason
            }
            corrective_actions {
              id
              issue
              action
              priority
              status
              due_date
              completed_date
              notes
              assigned_to
            }
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
        variables: { auditAssetId }
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch audit asset details" },
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

    const data = result.data.auditAssetDetails
    
    if (!data.success) {
      if (data.message.includes('not found')) {
        return NextResponse.json(
          { success: false, message: "Audit asset not found" },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { success: false, message: data.message || "Failed to fetch audit asset details" },
        { status: 400 }
      )
    }

    // Transform the GraphQL response to match the expected format
    return NextResponse.json({
      success: data.success,
      audit_asset: data.audit_asset
    })
  } catch (error) {
    console.error('Error fetching audit asset details:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
