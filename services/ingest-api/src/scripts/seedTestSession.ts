/**
 * Seed a test AlgorithmLens session via ingest API
 * 
 * This script creates a fake capture session for accountId "test_user"
 * so it appears in the Connected Sessions page.
 */

const API_BASE_URL = 'http://localhost:5050';

interface RegisterResponse {
  deviceId: string;
  deviceToken: string;
  expiresAt: number;
}

async function seedTestSession(): Promise<void> {
  const accountId = 'test_user';
  const sessionId = 'seed_session_1';

  try {
    // Step 1: Register device
    console.log('Step 1: Registering device...');
    const registerResponse = await fetch(`${API_BASE_URL}/v1/devices/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accountId }),
    });

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      throw new Error(`Failed to register device: ${registerResponse.status} ${errorText}`);
    }

    const registerData = (await registerResponse.json()) as RegisterResponse;
    const { deviceId, deviceToken } = registerData;
    console.log(`✓ Device registered: deviceId=${deviceId}`);

    // Step 2: Start session
    console.log('Step 2: Starting session...');
    const startResponse = await fetch(`${API_BASE_URL}/v1/sessions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deviceToken}`,
      },
      body: JSON.stringify({
        accountId,
        deviceId,
        sessionId,
      }),
    });

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      throw new Error(`Failed to start session: ${startResponse.status} ${errorText}`);
    }

    console.log(`✓ Session started: sessionId=${sessionId}`);

    // Step 3: Send events batch
    console.log('Step 3: Sending events batch...');
    const eventsResponse = await fetch(`${API_BASE_URL}/v1/events/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deviceToken}`,
      },
      body: JSON.stringify({
        accountId,
        deviceId,
        sessionId,
        events: [
          {
            id: 'seed_event_1',
            seenAt: 1730000000000,
            payload: {
              id: 'seed_event_1',
              sessionId: 'seed_session_1',
              platformGuess: 'x',
              seenAt: 1730000000000,
              block: {
                text: 'This is a seeded AlgorithmLens test post.',
                lines: [
                  { t: 'This is a seeded AlgorithmLens test post.', conf: 0.99 },
                ],
              },
              features: {
                author: 'seed_account',
                hashtags: ['#algorithm', '#test'],
              },
              quality: { frameQuality: 'high' },
              source: 'dom_capture',
              schema: 2,
            },
          },
        ],
      }),
    });

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      throw new Error(`Failed to send events: ${eventsResponse.status} ${errorText}`);
    }

    const eventsData = await eventsResponse.json();
    console.log(`✓ Events sent: accepted=${eventsData.accepted}, skipped=${eventsData.skipped}`);

    // Step 4: Finish session
    console.log('Step 4: Finishing session...');
    const finishResponse = await fetch(`${API_BASE_URL}/v1/sessions/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deviceToken}`,
      },
      body: JSON.stringify({
        accountId,
        deviceId,
        sessionId,
      }),
    });

    if (!finishResponse.ok) {
      const errorText = await finishResponse.text();
      throw new Error(`Failed to finish session: ${finishResponse.status} ${errorText}`);
    }

    console.log(`✓ Session finished: sessionId=${sessionId}`);

    console.log('\n✓ All steps completed successfully!');
    console.log(`Seeded test session 'seed_session_1' for accountId 'test_user'. You can now click Refresh on the Connected Sessions page.`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error seeding test session:', error);
    process.exit(1);
  }
}

// Run the script
seedTestSession();




