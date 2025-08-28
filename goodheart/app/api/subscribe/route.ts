import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, utm_source, utm_medium, utm_campaign } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Read required environment variables
    const API_KEY = process.env.BEEHIIV_API_KEY;
    const PUB_ID = process.env.BEEHIIV_PUBLICATION_ID;

    if (!API_KEY || !PUB_ID) {
      console.error('[API /subscribe] Missing environment variables:', { 
        hasApiKey: !!API_KEY, 
        hasPubId: !!PUB_ID 
      });
      return NextResponse.json(
        { error: 'Server configuration error: missing Beehiiv credentials' },
        { status: 500 }
      );
    }

    // Build JSON payload for Beehiiv API v2
    const payload = {
      email,
      utm_source: utm_source ?? '',
      utm_medium: utm_medium ?? '',
      utm_campaign: utm_campaign ?? '',
      referring_site: request.headers.get('referer') ?? 'https://goodheart.goodish.org',
      reactivate_existing: true
    };

    // Call Beehiiv API v2
    const response = await fetch(`https://api.beehiiv.com/v2/publications/${PUB_ID}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.info('Beehiiv subscribe OK', { email });
      return NextResponse.json({ ok: true });
    } else {
      const errorText = await response.text();
      console.error('[API /subscribe] Beehiiv API error:', response.status, errorText);
      return NextResponse.json(
        { ok: false, status: response.status, error: errorText },
        { status: response.status }
      );
    }

  } catch (error) {
    console.error('[API /subscribe] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  // CORS headers
  const isDev = process.env.NODE_ENV === 'development';
  const allowedOrigin = isDev ? 'http://localhost:3000' : 'https://goodheart.goodish.org';

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}