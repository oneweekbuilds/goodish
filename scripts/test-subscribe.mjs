#!/usr/bin/env node

/**
 * Test script for GoodHeart Beehiiv subscription
 * Tests the same endpoint and payload that the modal uses
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Same configuration as SubscribeFormGoodHeart.tsx
const config = {
  formId: "b8677a39-0139-4404-84df-df3b8e1d5c2f",
  action: "https://subscribe-forms.beehiiv.com/api/submit"
};

// Generate unique test email
const timestamp = Date.now();
const testEmail = `jwjwin0+gh_cli_${timestamp}@gmail.com`;

console.log('🧪 Testing GoodHeart Beehiiv subscription...');
console.log(`📧 Test email: ${testEmail}`);
console.log(`🎯 Endpoint: ${config.action}`);
console.log(`🆔 Form ID: ${config.formId}`);
console.log('');

async function testSubscription() {
  try {
    // Create FormData exactly like the app does
    const formData = new FormData();
    formData.append("form[email]", testEmail);
    formData.append("form_id", config.formId);
    formData.append("utm_source", "");
    formData.append("utm_medium", "");
    formData.append("utm_campaign", "");
    formData.append("referrer", `file://${__filename}`); // Script path as referrer

    console.log('📤 Submitting form data...');
    console.log('   form[email]:', testEmail);
    console.log('   form_id:', config.formId);
    console.log('   utm_source: ""');
    console.log('   utm_medium: ""');
    console.log('   utm_campaign: ""');
    console.log('   referrer:', `file://${__filename}`);
    console.log('');

    // Make the same fetch call as the app (production mode)
    const res = await fetch(config.action, {
      method: "POST",
      body: formData,
    });

    console.log(`📊 Response Status: ${res.status} ${res.statusText}`);
    console.log('📋 Response Headers:');
    for (const [key, value] of res.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }
    console.log('');

    if (res.ok) {
      console.log('✅ SUCCESS: Subscription request completed');
      try {
        const jsonResponse = await res.json();
        console.log('📄 JSON Response:');
        console.log(JSON.stringify(jsonResponse, null, 2));
      } catch (e) {
        const textResponse = await res.text();
        console.log('📄 Text Response:');
        console.log(textResponse);
      }
    } else {
      console.log('❌ FAILED: Non-200 response');
      try {
        const errorText = await res.text();
        console.log('📄 Error Response:');
        console.log(errorText);
      } catch (e) {
        console.log('📄 Could not read error response');
      }
    }

  } catch (error) {
    console.log('💥 EXCEPTION:', error.message);
    console.log('📄 Error Details:');
    console.log(error);
  }
}

testSubscription();