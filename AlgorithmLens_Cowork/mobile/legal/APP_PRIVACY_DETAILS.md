# AlgorithmLens — Apple App Store Privacy Details

**Last Updated:** February 22, 2026

This document specifies exactly what to select in App Store Connect's App Privacy section. Use this as a reference when filling out the privacy questionnaire.

---

## Overview

**Does your app collect data?** YES

**Does your app track users?** NO — We do not track users across other companies' apps or websites for advertising or advertising measurement purposes. (Note: We do send screen data to Google Gemini for AI analysis, but this is for app functionality, not tracking. Consult Apple's latest guidance on whether this requires an ATT prompt.)

**Does your app use third-party SDKs or APIs that collect data?** YES — Google Gemini API, Supabase, Stripe, Sentry

---

## Data Types Collected

For each Apple privacy category, here is whether AlgorithmLens collects it and the details.

---

### Contact Info

| Data Type | Collected? | Details |
|-----------|-----------|---------|
| Name | **NO** | We do not collect names. |
| Email Address | **YES** | Collected via OAuth (Google/Apple Sign-In) or email registration. |
| Phone Number | **NO** | |
| Physical Address | **NO** | |
| Other User Contact Info | **NO** | |

**Email Address Details:**
- **Linked to User Identity:** YES
- **Used for Tracking:** NO
- **Purpose:** App Functionality (authentication)
- **Collection is required:** YES (needed to create an account)

---

### Health & Fitness

| Data Type | Collected? |
|-----------|-----------|
| Health | **NO** |
| Fitness | **NO** |

---

### Financial Info

| Data Type | Collected? | Details |
|-----------|-----------|---------|
| Payment Info | **NO** | Stripe handles payment in a separate browser session. We never receive or store card numbers, bank details, or billing addresses. |
| Credit Info | **NO** | |
| Other Financial Info | **NO** | |

**Note:** While users can purchase a subscription, the payment is processed entirely by Stripe in the system browser. The App itself does not collect or process any financial information.

---

### Location

| Data Type | Collected? |
|-----------|-----------|
| Precise Location | **NO** |
| Coarse Location | **NO** |

---

### Sensitive Info

| Data Type | Collected? |
|-----------|-----------|
| Sensitive Info | **NO** |

**Note:** Screen recordings may incidentally capture sensitive content visible on the user's screen (banking, messages, etc.), but we do not intentionally collect or store sensitive categories. Images are processed and deleted; only text-based analysis results are retained.

---

### Contacts

| Data Type | Collected? |
|-----------|-----------|
| Contacts | **NO** |

---

### User Content

| Data Type | Collected? | Details |
|-----------|-----------|---------|
| Emails or Text Messages | **NO** | |
| Photos or Videos | **YES** | Screen recording frames captured during scan sessions. |
| Audio Data | **NO** | Microphone permission is required by iOS for ReplayKit but audio is never recorded. |
| Gameplay Content | **NO** | |
| Customer Support | **NO** | |
| Other User Content | **YES** | Social media feed content extracted via AI analysis (post text, creator names, content categories). |

**Photos or Videos Details:**
- **Linked to User Identity:** YES (captured during a user-initiated scan session)
- **Used for Tracking:** NO
- **Purpose:** App Functionality (the frames are analyzed by AI to produce feed insights)
- **Collection is required:** YES (this is the core functionality of the app)
- **Note for Apple:** Frames are captured using ReplayKit broadcast extension, sent to Google Gemini API for analysis over HTTPS, and then immediately deleted from the device. We do not retain the images. Only the text-based analysis results are stored.

**Other User Content Details:**
- **Linked to User Identity:** YES (scan results are linked to the user's account)
- **Used for Tracking:** NO
- **Purpose:** App Functionality (showing users their feed analysis)
- **Collection is required:** YES

---

### Browsing History

| Data Type | Collected? | Details |
|-----------|-----------|---------|
| Browsing History | **YES** | Indirectly — the App analyzes social media feed content, which reveals what content the user was viewing. This is stored as scan results (feed item metadata), not as URL browsing history. |

**Browsing History Details:**
- **Linked to User Identity:** YES
- **Used for Tracking:** NO
- **Purpose:** App Functionality (feed analysis results)
- **Collection is required:** YES (this is the core output of the analysis)

---

### Search History

| Data Type | Collected? |
|-----------|-----------|
| Search History | **NO** |

---

### Identifiers

| Data Type | Collected? | Details |
|-----------|-----------|---------|
| User ID | **YES** | Supabase-generated UUID. |
| Device ID | **NO** | We do not collect IDFA, IDFV, or any device identifiers. |

**User ID Details:**
- **Linked to User Identity:** YES
- **Used for Tracking:** NO
- **Purpose:** App Functionality (account management, linking scans to user)

---

### Purchases

| Data Type | Collected? | Details |
|-----------|-----------|---------|
| Purchase History | **YES** | We store subscription status (Free/Plus, active/canceled/trial). We do not store transaction details, amounts, or payment methods. |

**Purchase History Details:**
- **Linked to User Identity:** YES
- **Used for Tracking:** NO
- **Purpose:** App Functionality (determining feature access based on subscription tier)

---

### Usage Data

| Data Type | Collected? | Details |
|-----------|-----------|---------|
| Product Interaction | **YES** | Via Sentry breadcrumbs: navigation events, scan starts/completions, auth events. Used for error diagnosis, not behavioral analytics. |
| Advertising Data | **NO** | |
| Other Usage Data | **NO** | |

**Product Interaction Details:**
- **Linked to User Identity:** YES (Sentry tags events with user ID and tier; email is stripped)
- **Used for Tracking:** NO
- **Purpose:** Analytics (error diagnosis and crash monitoring)

---

### Diagnostics

| Data Type | Collected? | Details |
|-----------|-----------|---------|
| Crash Data | **YES** | Collected by Sentry. Includes stack traces, device model, OS version, app version. |
| Performance Data | **YES** | Sampled at 10% by Sentry. Page load times, API response durations. |
| Other Diagnostic Data | **NO** | |

**Crash Data Details:**
- **Linked to User Identity:** YES (user ID is included; email and name are stripped)
- **Used for Tracking:** NO
- **Purpose:** App Functionality (identifying and fixing bugs)

**Performance Data Details:**
- **Linked to User Identity:** YES (same as crash data)
- **Used for Tracking:** NO
- **Purpose:** App Functionality (monitoring and improving performance)

---

## Summary Table for App Store Connect

| Apple Category | Data Type | Collected | Linked to Identity | Used for Tracking | Purpose |
|---------------|-----------|-----------|-------------------|-------------------|---------|
| Contact Info | Email Address | YES | YES | NO | App Functionality |
| User Content | Photos or Videos | YES | YES | NO | App Functionality |
| User Content | Other User Content | YES | YES | NO | App Functionality |
| Browsing History | Browsing History | YES | YES | NO | App Functionality |
| Identifiers | User ID | YES | YES | NO | App Functionality |
| Purchases | Purchase History | YES | YES | NO | App Functionality |
| Usage Data | Product Interaction | YES | YES | NO | Analytics |
| Diagnostics | Crash Data | YES | YES | NO | App Functionality |
| Diagnostics | Performance Data | YES | YES | NO | App Functionality |

**Categories NOT collected (select "No" for all of these):**
- Contact Info: Name, Phone Number, Physical Address, Other Contact Info
- Health & Fitness: Health, Fitness
- Financial Info: Payment Info, Credit Info, Other Financial Info
- Location: Precise Location, Coarse Location
- Sensitive Info
- Contacts
- User Content: Emails or Text Messages, Audio Data, Gameplay Content, Customer Support
- Search History
- Identifiers: Device ID
- Usage Data: Advertising Data, Other Usage Data
- Diagnostics: Other Diagnostic Data

---

## Data Use Purposes

For each purpose Apple asks about, here is our answer:

| Purpose | Used? | Details |
|---------|-------|---------|
| **Third-Party Advertising** | **NO** | We do not display third-party ads or share data for advertising. |
| **Developer's Advertising or Marketing** | **NO** | We do not use collected data for our own advertising or marketing. |
| **Analytics** | **YES** | Sentry error tracking and performance monitoring (Product Interaction, Crash Data, Performance Data). |
| **Product Personalization** | **NO** | Analysis results are objective; we do not personalize the feed analysis based on user behavior. |
| **App Functionality** | **YES** | Email (auth), User ID (account), Photos/Videos (screen capture for analysis), Other User Content (feed analysis results), Browsing History (feed content analysis), Purchase History (subscription gating), Crash Data (bug fixing), Performance Data (monitoring). |
| **Other Purposes** | **NO** | |

---

## Third-Party SDK Disclosures

When Apple asks about third-party SDKs, disclose:

| SDK / Service | Data Collected | Purpose |
|---------------|---------------|---------|
| **Google Gemini API** | Photos/Videos (screen frames sent as base64 JPEG), Other User Content (OCR text) | App Functionality — AI analysis of social media feed content |
| **Supabase** | Email Address, User ID, Other User Content (scan results), Purchase History | App Functionality — Authentication, database storage |
| **Stripe** | Purchase History (subscription status only; payment details handled by Stripe directly) | App Functionality — Payment processing |
| **Sentry** | User ID, Product Interaction, Crash Data, Performance Data | Analytics — Error monitoring and performance tracking |
| **Expo** | None directly (framework-level; no data sent to Expo servers in production) | App Functionality — Development framework |

---

## Privacy Nutrition Label Preview

What users will see on the App Store:

**Data Used to Track You:** None

**Data Linked to You:**
- Email Address
- User ID
- Photos or Videos
- Other User Content
- Browsing History
- Purchase History
- Product Interaction
- Crash Data
- Performance Data

**Data Not Linked to You:** None (all collected data is linked to the user's account)

**Data Not Collected:**
- Name, Phone Number, Physical Address
- Health, Fitness
- Payment Info, Credit Info
- Location
- Sensitive Info
- Contacts
- Emails, Text Messages, Audio
- Search History
- Device ID
- Advertising Data

---

## Additional Permissions Explained

The following permissions are declared but do NOT involve data collection:

- **Siri / Shortcuts (NSSiriUsageDescription):** The App supports Siri Shortcuts to let users quickly start feed scans via voice commands. No user data is shared with Siri beyond the action trigger. Siri does not receive scan results or account data.
- **Background Modes (processing, fetch):** Used for background task scheduling (e.g., frame cleanup). No data is collected or transmitted in the background beyond completing in-progress operations.

---

## Notes for the App Review Team

When submitting to Apple, consider including these notes in the App Review notes field:

1. **Screen recording disclosure:** AlgorithmLens uses ReplayKit broadcast extension to capture screen frames for AI analysis of social media feeds. Users must explicitly start the broadcast via the system dialog. Frames are processed by Google Gemini API and immediately deleted. Only text-based analysis results are retained.

2. **Camera and microphone:** The App requests camera and microphone permissions because they are required by iOS for ReplayKit broadcast functionality. The App never accesses the camera or records audio. The permission descriptions clearly state this.

3. **Third-party cookies in WebView:** The in-app WebView allows third-party cookies so users can remain logged into their social media accounts during scanning. This is necessary for the App's core functionality.

4. **No advertising or tracking:** The App does not display ads, does not use IDFA, and does not track users across apps or websites.

---

*This document should be reviewed and updated whenever new data collection is added to the App or when Apple updates its privacy questionnaire requirements.*
