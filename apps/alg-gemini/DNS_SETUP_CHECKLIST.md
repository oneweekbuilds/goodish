# DNS Setup Checklist for AlgorithmLens

This guide walks you through connecting your custom domain `algorithmlens.com` to your Vercel deployment.

## Prerequisites

- [ ] Vercel project successfully deployed
- [ ] Access to your GoDaddy account (domain registrar)
- [ ] Domain `algorithmlens.com` purchased and active in GoDaddy

## Step 1: Add Domain in Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings** tab
3. Click on **Domains** in the left sidebar
4. In the "Add Domain" input field, type: `algorithmlens.com`
5. Click **Add**
6. Vercel will detect that you also want `www.algorithmlens.com`
7. Click **Add** again to include the `www` subdomain
8. Vercel will show you DNS records that need to be configured

You should now see both domains listed:
- `algorithmlens.com` (root/apex domain)
- `www.algorithmlens.com` (www subdomain)

## Step 2: Copy DNS Records from Vercel

Vercel will display the DNS records you need to add. They will look similar to this:

**For algorithmlens.com (root domain):**
- **Type:** A
- **Name:** @ (or leave blank, depending on your DNS provider)
- **Value:** `76.76.21.21` (Vercel's IP - exact value shown in your Vercel dashboard)

**For www.algorithmlens.com (www subdomain):**
- **Type:** CNAME
- **Name:** www
- **Value:** `cname.vercel-dns.com` (exact value shown in your Vercel dashboard)

**Important:** Write down or screenshot the exact values Vercel shows you. The IP address and CNAME target above are examples and may differ.

## Step 3: Log in to GoDaddy

1. Go to [godaddy.com](https://www.godaddy.com)
2. Sign in to your account
3. Click on your profile icon (top right)
4. Select **My Products**
5. Find `algorithmlens.com` in your domains list
6. Click **DNS** next to the domain name

You are now viewing your DNS Management page for algorithmlens.com.

## Step 4: Add DNS Records in GoDaddy

### For the Root Domain (algorithmlens.com)

1. Scroll to the **DNS Records** section
2. Look for an existing A record with Name `@`
   - If one exists pointing to a different IP, click the pencil icon to edit it
   - If none exists, click **Add New Record**
3. Configure the A record:
   - **Type:** A
   - **Name:** @ (this represents the root domain)
   - **Value:** Paste the IP address from Vercel (e.g., `76.76.21.21`)
   - **TTL:** 600 seconds (default) or 1 hour
4. Click **Save**

### For the WWW Subdomain (www.algorithmlens.com)

1. Scroll to the **DNS Records** section
2. Look for an existing CNAME record with Name `www`
   - If one exists pointing elsewhere, click the pencil icon to edit it
   - If none exists, click **Add New Record**
3. Configure the CNAME record:
   - **Type:** CNAME
   - **Name:** www
   - **Value:** Paste the CNAME target from Vercel (e.g., `cname.vercel-dns.com`)
   - **TTL:** 1 Hour (3600 seconds)
4. Click **Save**

### Important Warnings

- **Do NOT delete** other DNS records unless you know what they do (MX records for email, TXT records for domain verification, etc.)
- **Only add/modify** the A record for `@` and CNAME record for `www`
- If you have an existing website on this domain, the A record change will point the domain to your new Vercel site

## Step 5: Wait for DNS Propagation

**What is propagation?**
DNS propagation is the time it takes for DNS changes to spread across the internet (typically 5 minutes to 48 hours, but often much faster).

**During propagation:**
- Your domain might be unreachable intermittently
- Some people might see the old site, others the new site
- This is normal and will resolve itself

**Typical timeframes:**
- GoDaddy DNS updates: 5-30 minutes (usually fast)
- Full global propagation: Up to 48 hours (worst case)
- Most users will see changes within 1-2 hours

## Step 6: Verify the Setup

### In Vercel

1. Return to your Vercel project > Settings > Domains
2. Wait for the status indicators next to your domains to turn green with a checkmark
3. If there are errors, Vercel will show specific instructions

### In Your Browser

1. Wait at least 15-30 minutes after saving DNS changes
2. Open a new incognito/private window (to avoid cache issues)
3. Visit `https://algorithmlens.com`
   - Should load your Vercel-deployed site
   - Should show Coming Soon overlay (if `VITE_COMING_SOON_MODE=true`)
   - Should have a valid SSL certificate (green padlock in browser)
4. Visit `https://www.algorithmlens.com`
   - Should redirect or load the same site
5. Check browser console (F12) for any errors

### Testing Checklist

- [ ] `https://algorithmlens.com` loads successfully
- [ ] `https://www.algorithmlens.com` works (Vercel handles www redirect)
- [ ] SSL certificate is valid (green padlock icon)
- [ ] No browser console errors
- [ ] Coming Soon overlay appears (if env var is set)
- [ ] Site loads on mobile devices
- [ ] Images and assets load correctly

## Troubleshooting

### Domain Shows "Invalid Configuration" in Vercel

**Cause:** DNS records haven't propagated yet or are incorrect.

**Solutions:**
1. Double-check the DNS records in GoDaddy match exactly what Vercel shows
2. Wait 15-30 more minutes and refresh the Vercel Domains page
3. Use [whatsmydns.net](https://www.whatsmydns.net) to check if DNS changes are visible globally

### "This site can't be reached" Error

**Cause:** DNS hasn't propagated or A record is incorrect.

**Solutions:**
1. Verify the A record in GoDaddy points to the exact IP Vercel provided
2. Wait longer for propagation
3. Flush your computer's DNS cache:
   - Windows: `ipconfig /flushdns` in Command Prompt
   - Mac: `sudo dscacheutil -flushcache` in Terminal
   - Linux: `sudo systemd-resolve --flush-caches`

### SSL Certificate Warning

**Cause:** Vercel is still provisioning the SSL certificate.

**Solutions:**
1. Wait 5-10 minutes after DNS propagates
2. Vercel automatically provisions SSL via Let's Encrypt
3. If it persists after 1 hour, remove and re-add the domain in Vercel

### WWW Subdomain Not Working

**Cause:** CNAME record is missing or incorrect.

**Solutions:**
1. Verify CNAME record in GoDaddy: Name=`www`, Value=`cname.vercel-dns.com` (or the value Vercel provided)
2. Ensure there's no conflicting A record for `www`
3. Wait for DNS propagation

### Old Website Still Showing

**Cause:** DNS cache or propagation delay.

**Solutions:**
1. Clear browser cache or use incognito mode
2. Flush DNS cache (see commands above)
3. Wait 1-2 more hours for full propagation
4. Check DNS propagation status at [whatsmydns.net](https://www.whatsmydns.net)

## DNS Record Reference

After setup is complete, your GoDaddy DNS should have these records:

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A | @ | (Vercel IP) | Points root domain to Vercel |
| CNAME | www | cname.vercel-dns.com | Points www subdomain to Vercel |

**Keep existing records for:**
- Email (MX records)
- Domain verification (TXT records)
- Other subdomains (any other CNAMEs or A records you're actively using)

## After Successful Setup

Once your domain is working:

1. **Update any links:** If you have promotional materials, social media, etc., update them to use `algorithmlens.com`
2. **Test thoroughly:** Check all pages, navigation, and features on the live domain
3. **Monitor:** Keep an eye on your Vercel deployment logs for any issues
4. **Plan for launch:** When ready to disable Coming Soon mode, update the `VITE_COMING_SOON_MODE` environment variable in Vercel

## Need Help?

- [Vercel Custom Domains Documentation](https://vercel.com/docs/concepts/projects/domains)
- [GoDaddy DNS Management Guide](https://www.godaddy.com/help/manage-dns-records-680)
- Check DNS propagation: [whatsmydns.net](https://www.whatsmydns.net)
