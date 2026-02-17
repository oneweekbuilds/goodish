# Beehiiv Welcome Email Draft

## Email Settings

**Subject Line:**
`You're on the list for AlgorithmLens`

**Preheader Text:**
`We'll let you know when we launch. Thanks for your interest.`

---

## HTML Version

**Note for Beehiiv Editor:**
- Add your AlgorithmLens logo image using Beehiiv's image block at the top (optional)
- If you have a hosted logo URL (e.g., `https://algorithmlens.com/logo-full.png` after deployment), you can use that
- The HTML below uses simple, reliable formatting that works across all email clients

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to AlgorithmLens</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Logo Section (Optional) -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <!--
                            OPTIONAL: Add logo image in Beehiiv editor
                            Or use: <img src="https://algorithmlens.com/logo-full.png" alt="AlgorithmLens" style="max-width: 200px; height: auto;">
                            -->
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 20px 40px 40px; color: #1f2937;">
                            <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #111827;">Thanks for signing up</h1>

                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                You're on the early access list for <strong>AlgorithmLens</strong>.
                            </p>

                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                We're putting the finishing touches on the platform and will email you as soon as we're ready to launch.
                            </p>

                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                In the meantime, you can stay updated by following us on social media.
                            </p>

                            <!-- Social Links -->
                            <table role="presentation" style="margin: 24px 0;">
                                <tr>
                                    <td style="padding-right: 16px;">
                                        <a href="https://www.linkedin.com/company/algorithmlens" style="color: #2563eb; text-decoration: none; font-weight: 500;">LinkedIn</a>
                                    </td>
                                    <td style="padding-right: 16px;">
                                        <a href="https://x.com/algorithmlens" style="color: #2563eb; text-decoration: none; font-weight: 500;">X (Twitter)</a>
                                    </td>
                                    <td>
                                        <a href="https://algorithmlens.com" style="color: #2563eb; text-decoration: none; font-weight: 500;">Website</a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 24px 0 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                Talk soon,<br>
                                <strong style="color: #111827;">The AlgorithmLens Team</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #6b7280; text-align: center;">
                                You received this email because you signed up for early access to AlgorithmLens.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## Plain Text Version

```
ALGORITHMLENS

Thanks for signing up
────────────────────

You're on the early access list for AlgorithmLens.

We're putting the finishing touches on the platform and will email you as soon as we're ready to launch.

In the meantime, you can stay updated by following us on social media:

• LinkedIn: https://www.linkedin.com/company/algorithmlens
• X (Twitter): https://x.com/algorithmlens
• Website: https://algorithmlens.com

Talk soon,
The AlgorithmLens Team

────────────────────
You received this email because you signed up for early access to AlgorithmLens.
```

---

## Instructions for Using in Beehiiv

### Setting Up the Email

1. Log in to your Beehiiv account
2. Navigate to **Automations** or **Email Campaigns**
3. Create a new automation or email
4. Set the trigger to "New subscriber" (for welcome emails)

### Adding Content

**Option 1 - Use Beehiiv's Visual Editor (Recommended):**
1. Use Beehiiv's drag-and-drop blocks
2. Add an image block for the logo (optional)
3. Add text blocks for each paragraph
4. Add button or link blocks for social media
5. Style using Beehiiv's built-in styling options

**Option 2 - Paste HTML:**
1. Switch to HTML editor mode in Beehiiv
2. Copy and paste the HTML version above
3. Replace the logo placeholder comment with your actual logo URL if desired
4. Preview and test before activating

### Testing Before Sending

1. Send a test email to yourself
2. Check how it looks on:
   - Gmail (web and mobile app)
   - Apple Mail (iPhone/Mac)
   - Outlook
3. Verify all links work
4. Ensure the unsubscribe link is visible (Beehiiv adds this automatically)

### Launch Checklist

Before activating the welcome email automation:

- [ ] Subject line and preheader are set correctly
- [ ] Logo displays properly (if using)
- [ ] All social media links are correct and working
- [ ] Website link points to `https://algorithmlens.com`
- [ ] Email renders correctly on mobile devices
- [ ] Test email received successfully
- [ ] Plain text version is enabled as fallback
- [ ] Automation trigger is set to "New subscriber"
- [ ] Email is set to send immediately after subscription

---

## Customization Notes

**If you want to add more personality:**
- You could mention what problem AlgorithmLens solves in one sentence
- Add a specific launch timeframe if you have one (e.g., "launching in early 2026")
- Include a teaser about a key feature

**Keep it simple:**
- Resist the urge to oversell or overpromise
- The goal is to acknowledge their interest and set expectations
- Save detailed feature announcements for the launch email

**Tone:**
- Professional but friendly
- Grateful without being overly enthusiastic
- Clear and concise
- Sets expectations without creating urgency
