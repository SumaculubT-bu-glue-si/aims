import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string; planId: string } }
) {
  try {
    const { token, planId } = params
    
    // Call the backend API to get audit plan assets
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/employee-audits/plan/${token}/${planId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
        { message: errorData.message || "Failed to fetch audit plan data" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Employee audit plan access error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
