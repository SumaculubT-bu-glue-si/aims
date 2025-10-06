import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const updateAssetSchema = z.object({
  assetId: z.union([z.string(), z.number()]), // Accept both string and number for assetId
  status: z.string(), // Allow any status string to match backend validation
  notes: z.string().optional(),
  reassignUserId: z.union([z.string(), z.number()]).optional(), // Optional user reassignment
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token
    const body = await request.json()
    
    console.log("Update asset request received:", { token, body })
    
    const { assetId, status, notes, reassignUserId } = updateAssetSchema.parse(body)

    if (!token) {
      return NextResponse.json(
        { message: "Access token is required" },
        { status: 400 }
      )
    }

    // Call the backend API to update asset status
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    console.log("Environment variables:", {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NODE_ENV: process.env.NODE_ENV,
      backendUrl: backendUrl
    })
    console.log("Full request URL:", `${backendUrl}/api/employee-audits/update-asset/${token}`)
    
    const response = await fetch(`${backendUrl}/api/employee-audits/update-asset/${token}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ assetId, status, notes, reassignUserId }),
    })

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { message: "Access token expired or invalid" },
          { status: 401 }
        )
      }
      
      const errorData = await response.json()
      return NextResponse.json(
        { message: errorData.message || "Failed to update asset status" },
        { status: response.status }
      )
    }

    const data = await response.json()
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
