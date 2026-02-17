/**
 * Vercel Serverless Function: /api/subscribe
 *
 * Proxies waitlist email submissions to Beehiiv API v2.
 * Prevents CORS issues and keeps API keys secure server-side.
 *
 * Required environment variables (set in Vercel):
 * - BEEHIIV_API_KEY: Your Beehiiv API key
 * - BEEHIIV_PUBLICATION_ID: Your Beehiiv publication ID
 */

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Extract email from request body
  const { email } = req.body;

  // Basic validation
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ ok: false, error: 'Email is required' });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ ok: false, error: 'Invalid email format' });
  }

  // Get Beehiiv credentials from environment
  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

  if (!apiKey || !publicationId) {
    console.error('Missing required environment variables: BEEHIIV_API_KEY or BEEHIIV_PUBLICATION_ID');
    return res.status(500).json({ ok: false, error: 'Server configuration error' });
  }

  // Redact email for logging (first 3 chars + domain)
  const redactedEmail = trimmedEmail.length > 3
    ? trimmedEmail.substring(0, 3) + '***@' + trimmedEmail.split('@')[1]
    : '***@' + trimmedEmail.split('@')[1];

  try {
    // Call Beehiiv API v2 subscriptions endpoint
    const beehiivUrl = `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`;

    const beehiivResponse = await fetch(beehiivUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email: trimmedEmail,
        reactivate_existing: true,
        send_welcome_email: true,
        utm_source: 'algorithmlens',
        utm_medium: 'waitlist',
        utm_campaign: 'coming_soon',
        referring_site: 'https://www.algorithmlens.com',
      }),
    });

    const beehiivStatus = beehiivResponse.status;
    let beehiivBody;

    // Parse response body
    try {
      beehiivBody = await beehiivResponse.json();
    } catch (parseError) {
      // If JSON parsing fails, get text
      beehiivBody = await beehiivResponse.text();
    }

    // Log status for debugging (never log response body — may contain PII)
    console.log('Beehiiv API response:', { status: beehiivStatus, email: redactedEmail });

    // Handle Beehiiv response
    if (!beehiivResponse.ok) {
      console.error('Beehiiv API error:', beehiivStatus);
      return res.status(502).json({
        ok: false,
        error: 'beehiiv_error',
      });
    }

    // Success — only return status, never upstream response body
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
