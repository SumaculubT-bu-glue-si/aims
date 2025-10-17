import { NextRequest, NextResponse } from 'next/server';

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://assetwise.glue-si.com/api/graphql';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Execute GraphQL login mutation
    const loginMutation = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          access_token
          token_type
          expires_in
          user {
            id
            name
            email
            email_verified_at
            created_at
            updated_at
          }
        }
      }
    `;

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include', // Important for cookie handling
      body: JSON.stringify({
        query: loginMutation,
        variables: { email, password },
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      return NextResponse.json(
        { error: result.errors[0].message },
        { status: 401 }
      );
    }

    if (!result.data?.login) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const { access_token, user } = result.data.login;

    // Create secure HttpOnly cookie with JWT token
    const cookieResponse = NextResponse.json(
      { 
        success: true, 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      },
      { status: 200 }
    );

    // Set secure HttpOnly cookie
    cookieResponse.cookies.set('auth_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    // Also set a non-HttpOnly cookie for user info (for display purposes)
    cookieResponse.cookies.set('user_info', JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600,
      path: '/',
    });

    return cookieResponse;

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
