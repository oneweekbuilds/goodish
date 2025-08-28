import { NextResponse } from 'next/server';

export async function OPTIONS() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  return new Response(null, { status: 204, headers });
}

export async function POST(req: Request) {
  try {
    // Parse the request body (expecting form data)
    const formData = await req.formData();
    
    // Debug logging before proxying
    console.log("[GoodHeart API] Proxying subscription to Beehiiv", {
      email: formData.get('form[email]'),
      formId: formData.get('form_id')
    });

    // Forward the request to Beehiiv's actual endpoint
    // Try minimal headers to avoid Cloudflare detection
    const beehiivResponse = await fetch('https://subscribe-forms.beehiiv.com/api/submit', {
      method: 'POST',
      body: formData,
      headers: {
        'Origin': 'https://goodheart.goodish.org',
        'Referer': 'https://goodheart.goodish.org/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Debug logging after proxying
    console.log("[GoodHeart API] Beehiiv response", beehiivResponse.status);

    if (!beehiivResponse.ok) {
      const errorText = await beehiivResponse.text().catch(() => null);
      console.error("[GoodHeart API] Beehiiv error", errorText);
      return NextResponse.json(
        { ok: false, error: 'Subscription failed' }, 
        { 
          status: beehiivResponse.status,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    // Return success
    return NextResponse.json({ ok: true }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    console.error("[GoodHeart API] Exception", e);
    return NextResponse.json({ ok: false, error: (e as Error).message }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}