import { NextRequest, NextResponse } from 'next/server';

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://assetwise.glue-si.com/api/graphql';

export async function POST(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const authToken = request.cookies.get('auth_token')?.value;

    if (authToken) {
      // Call GraphQL logout mutation
      const logoutMutation = `
        mutation Logout {
          logout
        }
      `;

      try {
        await fetch(GRAPHQL_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            query: logoutMutation,
          }),
        });
      } catch (error) {
        console.log('Logout mutation failed, but continuing with cookie cleanup');
      }
    }

    // Clear all authentication cookies
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    // Clear auth_token cookie
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    // Clear user_info cookie
    response.cookies.set('user_info', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
