import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get location from query parameters
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    
    if (!location) {
      return NextResponse.json(
        { message: "Location parameter is required" },
        { status: 400 }
      )
    }
    
    // Call the backend API to get available employees for this location
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    const response = await fetch(`${backendUrl}/api/employees?location=${encodeURIComponent(location)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to fetch employees" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Employee fetch error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
