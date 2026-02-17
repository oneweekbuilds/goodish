# AlgorithmLens — Custom Supabase Email Templates

## How to Apply These Templates

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your AlgorithmLens project
3. Navigate to **Authentication** → **Email Templates**
4. For each template below, paste the HTML into the corresponding template section
5. Update the **Subject** line as shown
6. Click **Save**

Note: Supabase uses `{{ .ConfirmationURL }}` as the variable for the action link in all templates. Do not change these variables.

---

## 1. Confirm Signup

**Subject:** Welcome to AlgorithmLens — Confirm your email

```html
<div style="max-width: 520px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; padding: 32px 20px;">

  <!-- Header -->
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="display: inline-block; width: 48px; height: 48px; background-color: #2563EB; border-radius: 14px; line-height: 48px; text-align: center; margin-bottom: 16px;">
      <span style="color: #FFFFFF; font-size: 22px;">👁</span>
    </div>
    <h1 style="font-size: 22px; font-weight: 700; color: #1E293B; margin: 0 0 4px 0;">AlgorithmLens</h1>
    <p style="font-size: 13px; color: #64748B; margin: 0;">See what shapes your feed</p>
  </div>

  <!-- Body -->
  <div style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 28px; margin-bottom: 24px;">
    <h2 style="font-size: 18px; font-weight: 600; color: #1E293B; margin: 0 0 12px 0;">Welcome aboard</h2>
    <p style="font-size: 15px; color: #4B5563; line-height: 1.6; margin: 0 0 20px 0;">
      Thanks for signing up for AlgorithmLens. Confirm your email address to get started with your first feed scan.
    </p>
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; font-size: 15px; font-weight: 600; padding: 12px 28px; border-radius: 8px; text-decoration: none;">
      Confirm Email Address
    </a>
  </div>

  <!-- Footer -->
  <div style="text-align: center;">
    <p style="font-size: 12px; color: #94A3B8; line-height: 1.5; margin: 0;">
      Part of <strong>Goodish</strong> — building tools that increase human agency.
    </p>
    <p style="font-size: 11px; color: #CBD5E1; margin: 8px 0 0 0;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  </div>
</div>
```

---

## 2. Magic Link

**Subject:** Your AlgorithmLens sign-in link

```html
<div style="max-width: 520px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; padding: 32px 20px;">

  <!-- Header -->
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="display: inline-block; width: 48px; height: 48px; background-color: #2563EB; border-radius: 14px; line-height: 48px; text-align: center; margin-bottom: 16px;">
      <span style="color: #FFFFFF; font-size: 22px;">👁</span>
    </div>
    <h1 style="font-size: 22px; font-weight: 700; color: #1E293B; margin: 0 0 4px 0;">AlgorithmLens</h1>
    <p style="font-size: 13px; color: #64748B; margin: 0;">See what shapes your feed</p>
  </div>

  <!-- Body -->
  <div style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 28px; margin-bottom: 24px;">
    <h2 style="font-size: 18px; font-weight: 600; color: #1E293B; margin: 0 0 12px 0;">Sign in to AlgorithmLens</h2>
    <p style="font-size: 15px; color: #4B5563; line-height: 1.6; margin: 0 0 20px 0;">
      Tap the button below to sign in. This link expires in 24 hours.
    </p>
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; font-size: 15px; font-weight: 600; padding: 12px 28px; border-radius: 8px; text-decoration: none;">
      Sign In
    </a>
  </div>

  <!-- Footer -->
  <div style="text-align: center;">
    <p style="font-size: 12px; color: #94A3B8; line-height: 1.5; margin: 0;">
      Part of <strong>Goodish</strong> — building tools that increase human agency.
    </p>
    <p style="font-size: 11px; color: #CBD5E1; margin: 8px 0 0 0;">
      If you didn't request this link, you can safely ignore this email.
    </p>
  </div>
</div>
```

---

## 3. Change Email Address

**Subject:** Confirm your new email for AlgorithmLens

```html
<div style="max-width: 520px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; padding: 32px 20px;">

  <!-- Header -->
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="display: inline-block; width: 48px; height: 48px; background-color: #2563EB; border-radius: 14px; line-height: 48px; text-align: center; margin-bottom: 16px;">
      <span style="color: #FFFFFF; font-size: 22px;">👁</span>
    </div>
    <h1 style="font-size: 22px; font-weight: 700; color: #1E293B; margin: 0 0 4px 0;">AlgorithmLens</h1>
    <p style="font-size: 13px; color: #64748B; margin: 0;">See what shapes your feed</p>
  </div>

  <!-- Body -->
  <div style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 28px; margin-bottom: 24px;">
    <h2 style="font-size: 18px; font-weight: 600; color: #1E293B; margin: 0 0 12px 0;">Confirm your new email</h2>
    <p style="font-size: 15px; color: #4B5563; line-height: 1.6; margin: 0 0 20px 0;">
      You requested to change your email address on AlgorithmLens. Tap the button below to confirm.
    </p>
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; font-size: 15px; font-weight: 600; padding: 12px 28px; border-radius: 8px; text-decoration: none;">
      Confirm New Email
    </a>
  </div>

  <!-- Footer -->
  <div style="text-align: center;">
    <p style="font-size: 12px; color: #94A3B8; line-height: 1.5; margin: 0;">
      Part of <strong>Goodish</strong> — building tools that increase human agency.
    </p>
    <p style="font-size: 11px; color: #CBD5E1; margin: 8px 0 0 0;">
      If you didn't request this change, please sign in and update your password immediately.
    </p>
  </div>
</div>
```

---

## 4. Reset Password

**Subject:** Reset your AlgorithmLens password

```html
<div style="max-width: 520px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; padding: 32px 20px;">

  <!-- Header -->
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="display: inline-block; width: 48px; height: 48px; background-color: #2563EB; border-radius: 14px; line-height: 48px; text-align: center; margin-bottom: 16px;">
      <span style="color: #FFFFFF; font-size: 22px;">👁</span>
    </div>
    <h1 style="font-size: 22px; font-weight: 700; color: #1E293B; margin: 0 0 4px 0;">AlgorithmLens</h1>
    <p style="font-size: 13px; color: #64748B; margin: 0;">See what shapes your feed</p>
  </div>

  <!-- Body -->
  <div style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 28px; margin-bottom: 24px;">
    <h2 style="font-size: 18px; font-weight: 600; color: #1E293B; margin: 0 0 12px 0;">Reset your password</h2>
    <p style="font-size: 15px; color: #4B5563; line-height: 1.6; margin: 0 0 20px 0;">
      Someone requested a password reset for your AlgorithmLens account. Tap the button below to choose a new password. This link expires in 24 hours.
    </p>
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; font-size: 15px; font-weight: 600; padding: 12px 28px; border-radius: 8px; text-decoration: none;">
      Reset Password
    </a>
  </div>

  <!-- Footer -->
  <div style="text-align: center;">
    <p style="font-size: 12px; color: #94A3B8; line-height: 1.5; margin: 0;">
      Part of <strong>Goodish</strong> — building tools that increase human agency.
    </p>
    <p style="font-size: 11px; color: #CBD5E1; margin: 8px 0 0 0;">
      If you didn't request a password reset, you can safely ignore this email.
    </p>
  </div>
</div>
```
