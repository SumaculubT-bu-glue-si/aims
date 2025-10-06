import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const updateAssetSchema = z.object({
  token: z.string(),
  assetId: z.string(),
  status: z.enum(["Found", "In Storage", "Broken", "Missing", "Scheduled for Disposal"]),
  notes: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log("Update asset request received:", { body })
    
    // Simple validation without Zod for now
    const { token, assetId, status, notes } = body
    
    if (!token || !assetId || !status) {
      console.error("Missing required fields:", { token: !!token, assetId: !!assetId, status: !!status })
      return NextResponse.json(
        { message: "Missing required fields: token, assetId, and status are required" },
        { status: 400 }
      )
    }

    if (!token) {
      return NextResponse.json(
        { message: "Access token is required" },
        { status: 400 }
      )
    }

    // Use GraphQL to update asset status
    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8000/api/graphql'
    const mutation = `
      mutation UpdateAssetStatus($token: String!, $assetId: ID!, $status: String!, $notes: String) {
        updateAssetStatus(token: $token, assetId: $assetId, status: $status, notes: $notes) {
          success
          message
          asset {
            id
            audit_status
            current_status
            notes
            audited_at
            audited_by
            location_changed
            user_changed
            user_assigned
          }
          main_asset_updated
          user_assignment {
            old_user_id
            new_user_id
            new_user_name
          }
          changes_detected {
            location
            user
          }
        }
      }
    `

    console.log("Using GraphQL mutation for asset update:", { token, assetId, status, notes })
    
    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: mutation,
        variables: { token, assetId, status, notes }
      }),
    })
    
    console.log("GraphQL response status:", response.status)
    console.log("GraphQL response ok:", response.ok)

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to update asset status" },
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

    const data = result.data.updateAssetStatus
    
    if (!data.success) {
      if (data.message.includes('expired') || data.message.includes('invalid')) {
        return NextResponse.json(
          { message: "Access token expired or invalid" },
          { status: 401 }
        )
      }
      
      if (data.message.includes('already been resolved')) {
        return NextResponse.json(
          { 
            message: "This asset has already been resolved and cannot be updated. Please contact your administrator if you need to make changes.",
            errorType: "asset_already_resolved"
          },
          { status: 409 } // Conflict status for already resolved assets
        )
      }
      
      return NextResponse.json(
        { message: data.message || "Failed to update asset status" },
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 }
      )
    }

    console.error("Employee asset update error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
