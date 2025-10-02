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

    // Call the backend API to update asset status
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    console.log("Environment variables:", {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NODE_ENV: process.env.NODE_ENV,
      backendUrl: backendUrl
    })
    console.log("Full request URL:", `${backendUrl}/api/employee-audits/update-asset/${token}`)
    console.log("Sending to Laravel:", { assetId, status, notes })
    
    const response = await fetch(`${backendUrl}/api/employee-audits/update-asset/${token}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ assetId, status, notes }),
    })
    
    console.log("Laravel response status:", response.status)
    console.log("Laravel response ok:", response.ok)

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
