import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get user info from secure cookie
    const userInfoCookie = request.cookies.get('user_info');
    
    if (!userInfoCookie) {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      );
    }

    try {
      const userInfo = JSON.parse(userInfoCookie.value);
      return NextResponse.json({ user: userInfo });
    } catch (error) {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Me API error:', error);
    return NextResponse.json(
      { user: null },
      { status: 401 }
    );
  }
}
