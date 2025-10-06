import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Use GraphQL to send scheduled reminders
    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8000/api/graphql'
    const mutation = `
      mutation SendScheduledReminders {
        sendScheduledReminders {
          success
          message
          reminders_sent
          actions_processed
          details {
            pending_reminders
            in_progress_reminders
            overdue_reminders
            employees_notified
            errors
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
        query: mutation
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to send scheduled reminders" },
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

    const data = result.data.sendScheduledReminders
    
    if (!data.success) {
      return NextResponse.json(
        { success: false, message: data.message || "Failed to send scheduled reminders" },
        { status: 400 }
      )
    }

    // Transform the GraphQL response to match the expected format
    return NextResponse.json({
      success: data.success,
      message: data.message,
      reminders_sent: data.reminders_sent,
      actions_processed: data.actions_processed,
      details: data.details
    })
  } catch (error) {
    console.error('Error sending scheduled reminders:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
