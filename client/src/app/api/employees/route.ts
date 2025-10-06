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
    
    // Use GraphQL to get employees
    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8000/api/graphql'
    const query = `
      query GetEmployees($location: String) {
        employees(location: $location) {
          id
          name
          email
          location
          department
          position
          status
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
        variables: { location }
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to fetch employees" },
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

    const data = result.data.employees
    return NextResponse.json({ employees: data })
  } catch (error) {
    console.error("Employee fetch error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
