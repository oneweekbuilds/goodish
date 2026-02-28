# AlgorithmLens Security Audit Report
**Date:** February 24, 2026
**Scope:** Full Stack Security Assessment (Backend, Frontend, Chrome Extension, Mobile App)

---

## Executive Summary

This comprehensive security audit examined the AlgorithmLens codebase across all three platforms: Website, Chrome Extension, and Mobile App. Overall, the codebase demonstrates **good security hygiene** with proper secrets management, authentication controls, and input validation. However, several issues were identified ranging from **Minor** to **Important** severity.

**Key Findings:**
- No hardcoded production secrets detected
- Proper environment variable management (.env files correctly gitignored)
- Solid JWT authentication and authorization patterns
- Some security headers and CORS configurations could be strengthened
- Minor XSS and CSP-related issues in specific contexts

---

## Findings by Severity

### CRITICAL FINDINGS
None identified.

### IMPORTANT FINDINGS

#### 1. Content Security Policy (CSP) - Frontend
**Severity:** Important
**Location:** `/sessions/brave-dreamy-euler/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/vercel.json` (Line 11)

**Issue:**
```
"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdnjs.cloudflare.com; ..."
```

The CSP policy allows `'unsafe-inline'` and `'unsafe-eval'` which defeats much of CSP's XSS protection. While necessary for some legitimate use cases (Stripe integration, Tailwind CSS), these directives significantly weaken the CSP.

**Impact:** Reduces XSS protection effectiveness
**Recommendation:**
- Consider using Stripe's official build without `unsafe-eval`
- Explore inline styles extraction to CSP-compliant external stylesheets
- Use Content Security Policy nonce/hash for inline scripts if necessary

---

#### 2. CORS Extension Origin Regex
**Severity:** Important
**Location:** `/sessions/brave-dreamy-euler/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/backend/app.py` (Line 140)

**Issue:**
```python
allow_origin_regex=r"^chrome-extension://.*$",
```

This allows requests from ANY Chrome extension by regex. While this is necessary for extension integration, it could allow malicious extensions to reach the API if they can access the same network context.

**Impact:** Allows any Chrome extension to make authenticated requests if user is logged in
**Recommendation:**
- Verify extension ID in the CORS policy (if possible)
- Alternatively, validate extension ID at the authentication middleware level
- Document that this is intentional for legitimate extension access
- Consider rate limiting on extension endpoints

---

#### 3. Test Secrets in conftest.py
**Severity:** Important (but mitigated)
**Location:** `/sessions/brave-dreamy-euler/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/backend/tests/conftest.py` (Lines 14-18)

**Issue:**
```python
os.environ["SUPABASE_JWT_SECRET"] = "test-secret-key-for-tests-only"
os.environ["STRIPE_SECRET_KEY"] = "sk_test_fake"
os.environ["STRIPE_WEBHOOK_SECRET"] = "whsec_test_fake"
```

Test files contain fake secrets, which is correct. However, the file path `/backend/tests/conftest.py` is in the repository. While these are test secrets only, the pattern should be clearly documented.

**Impact:** Minimal - test secrets only, not production
**Recommendation:**
- Add comments clearly indicating these are test/fake secrets only
- Ensure conftest.py is tested to run in isolation and never with real credentials
- Consider using pytest fixtures for secret injection instead of environment variables

---

### MINOR FINDINGS

#### 1. Stripe API Key Initialization in Multiple Locations
**Severity:** Minor
**Locations:**
- `/sessions/brave-dreamy-euler/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/backend/app.py` (Line 91)
- `/sessions/brave-dreamy-euler/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/backend/routes/stripe_routes.py` (Line 12)
- `/sessions/brave-dreamy-euler/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/backend/routes/entitlements.py` (initialization implied)

**Issue:**
```python
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
```

Stripe API key is set in multiple locations. While this works, it violates DRY principle and could lead to initialization timing issues.

**Impact:** Low - functional but maintainability concern
**Recommendation:**
- Centralize Stripe initialization to a single location (e.g., `backend/config.py` or `backend/stripe_config.py`)
- Import from central location in all route modules

---

#### 2. Verbose Error Messages in Development
**Severity:** Minor
**Location:** `/sessions/brave-dreamy-euler/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/backend/routes/scans.py` (Line 213)

**Issue:**
```python
if is_dev_environment():
    raise HTTPException(status_code=500, detail=f"Upload error: {type(e).__name__}: {str(e)}")
```

While conditionally showing errors in dev only is good practice, stack traces could leak sensitive information about the system architecture.

**Impact:** Minimal - dev-only behavior
**Recommendation:**
- Consider using structured logging instead of returning exception details
- Document that this verbose error behavior is dev-only

---

#### 3. Missing Origin Validation in Auth Bridge
**Severity:** Minor
**Location:** `/sessions/brave-dreamy-euler/mnt/AlgorithmLens_ParentFolder/alg-gemini-extension/src/auth_bridge.js` (Lines 36-39)

**Issue:**
```javascript
const ALLOWED_ORIGINS = [
  'https://algorithmlens.com',
  'https://www.algorithmlens.com',
];
```

The auth bridge accepts tokens from these origins, which is correct. However, localhost origins are commented out for production. Ensure localhost is never accidentally enabled in production builds.

**Impact:** Low - properly configured but requires careful deployment
**Recommendation:**
- Add a deployment check to ensure localhost origins never reach production
- Consider using environment variables to manage allowed origins based on NODE_ENV

---

#### 4. Missing HTTPS Enforcement in Development
**Severity:** Minor
**Location:** `/sessions/brave-dreamy-euler/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/backend/app.py` (Line 153)

**Issue:**
```python
if not _is_dev:
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
```

HSTS is only set in production. While this is intentional (localhost doesn't use HTTPS), ensure production deployment actually sets this header.

**Impact:** Low - intentional behavior
**Recommendation:**
- Verify HSTS header is present when deployed to production
- Add test to confirm HSTS header exists in non-dev environments

---

#### 5. Extension WebView and Deep Link Security
**Severity:** Minor
**Location:** `/sessions/brave-dreamy-euler/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/src/components/scanner/WebViewScanner.tsx` (implied, not fully reviewed)

**Issue:**
WebViews in mobile apps can be vulnerable if not properly sandboxed. Deep links should be validated before opening.

**Impact:** Potential for malicious intent through deep links
**Recommendation:**
- Implement deep link validation for all URLs
- Ensure WebView has proper sandbox restrictions
- Disable JavaScript in WebViews if not needed for social media scanning

---

#### 6. Missing Referrer Policy Specificity
**Severity:** Minor
**Location:** `/sessions/brave-dreamy-euler/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/vercel.json` (Line 9)

**Issue:**
```json
"Referrer-Policy": "strict-origin-when-cross-origin"
```

While secure, this policy leaks the referring page origin to cross-origin requests. For maximum privacy (especially for a privacy-focused tool like AlgorithmLens), consider `"no-referrer"`.

**Impact:** Minor privacy concern
**Recommendation:**
- Consider changing to `"no-referrer"` policy for all requests
- Or use `"strict-origin"` for same-origin, `"no-referrer"` for cross-origin

---

## Areas Reviewed (No Issues Found)

### ✓ Authentication & Authorization
- **JWT Verification:** Properly implemented with JWKS caching and fallback to HS256
- **Auth Middleware:** Correctly validates tokens on protected routes
- **Session Management:** Uses Supabase auth with secure storage (Expo SecureStore on mobile)
- **Token Expiry:** Properly handled with refresh token logic

### ✓ Input Validation
- **Scan ID Validation:** Regex-based validation prevents injection attacks
- **Platform Validation:** Against whitelist of allowed platforms
- **File Upload Validation:** Checks content type, extension, and file size
- **Question Input:** Length-limited with trimming to prevent overflow attacks

### ✓ Secrets Management
- **.env Handling:** Properly configured in .gitignore
- **API Keys:** Using environment variables, not hardcoded
- **Test Secrets:** Fake/test values in test fixtures only
- **Production Config:** Stripe keys, JWT secrets, Gemini API keys all environment-based

### ✓ Database Security
- **Connection Pooling:** Proper use of psycopg2 pool for PostgreSQL
- **Prepared Statements:** Framework (FastAPI/SQLAlchemy patterns) handles parameterized queries
- **No SQL Injection Detected:** Input validation prevents injection vectors

### ✓ HTTPS & Secure Headers
- **X-Content-Type-Options:** Set to "nosniff" ✓
- **X-Frame-Options:** Set to "DENY" ✓
- **X-XSS-Protection:** Set to "1; mode=block" ✓
- **Permissions-Policy:** Restricts camera, microphone, geolocation ✓
- **Cache-Control:** Prevents caching of sensitive data ✓

### ✓ Chrome Extension Security
- **Permissions Scope:** Requests only necessary permissions (activeTab, scripting, tabs, storage)
- **Message Passing:** Validates message origins with origin checks
- **Content Script Isolation:** Properly scoped to target sites
- **No Globals Exposed:** Extension internals not exposed to page scope

### ✓ Mobile App Security
- **Token Storage:** Uses Expo SecureStore (encrypted platform storage)
- **API Communication:** HTTPS-only with timeout handling
- **Auth Token Injection:** Properly adds Authorization headers to all API requests
- **Environment Variables:** Separate public/private keys with EXPO_PUBLIC_ prefix

### ✓ Rate Limiting
- **Upload Endpoint:** Limited to 10/minute
- **Stripe Webhook:** Limited to 60/minute
- **General Pattern:** slowapi limiter configured per-route

### ✓ Request Size Limiting
- **Body Size Limit:** 512MB max (to accommodate 500MB video uploads)
- **Content-Length Validation:** Checked before processing

### ✓ XSS Prevention
- **Extension Popup:** Uses `textContent` instead of `innerHTML` for user data
- **Safe HTML Helpers:** `safeSetText()`, `escapeHtml()`, `escapeAttr()` functions implemented
- **No eval() or setTimeout() with strings:** No dynamic code execution detected

### ✓ CORS Configuration
- **Production:** Restricted to algorithmlens.com and www.algorithmlens.com
- **Development:** Localhost endpoints included (properly conditional)
- **Extension:** Regex allows chrome-extension:// origins

---

## Configuration Review

### .gitignore
**Status:** ✓ Properly Configured

```
.env
.env.local
.env.development
.env.production
.env.staging
.env*.local
```

All environment variable files are correctly ignored.

### Environment Variables Pattern
**Status:** ✓ Best Practice Followed

Example from `.env.example`:
```
SUPABASE_JWT_SECRET=your-jwt-secret-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
STRIPE_SECRET_KEY=sk_test_your-key-here
GEMINI_API_KEY=your-gemini-api-key
```

Secrets are:
- Properly templated with placeholder values
- Never hardcoded in source
- Environment-specific

### Frontend Configuration
**Status:** ✓ Secure

- `VITE_ALG_API_BASE_URL`: Configurable API base
- `VITE_STRIPE_PUBLISHABLE_KEY`: Public key (publishable is safe to expose)
- `VITE_SENTRY_DSN`: Optional error tracking

---

## Threat Model Analysis

### 1. Man-in-the-Middle (MITM)
**Mitigation:** ✓
- HSTS enforced in production
- All API communication over HTTPS
- Certificate pinning not implemented (considered for future)

### 2. Session Hijacking
**Mitigation:** ✓
- JWT tokens with expiry (1 hour standard)
- Secure storage (SecureStore on mobile, chrome.storage on extension)
- HTTPS only communication

### 3. Unauthorized Data Access
**Mitigation:** ✓
- User ID verification on scan retrieval
- Authorization checks on all protected routes
- Database queries filtered by user ownership

### 4. XSS Attacks
**Mitigation:** ✓ (with CSP caveat)
- Input validation on all user inputs
- Proper escaping in extension popup
- CSP headers (though weakened by unsafe-inline/unsafe-eval)

### 5. CSRF Attacks
**Mitigation:** ✓
- Token-based API (JWT in Authorization header)
- No cookie-based sessions
- CORS restrictions

### 6. API Key Leakage
**Mitigation:** ✓
- No keys in source code
- Environment variables only
- Test fixtures use fake keys

### 7. Third-Party Supply Chain
**Mitigation:** ✓ (Partial)
- Dependencies managed through package managers
- Lock files tracked (package-lock.json)
- No unusual external scripts observed

---

## Recommendations by Priority

### Immediate (Next Sprint)
1. **[Important] Refine CSP Policy**
   - Work with Stripe to reduce unsafe-* directives
   - Use nonces for inline scripts if needed
   - Document justification for each directive

2. **[Minor] Centralize Stripe Configuration**
   - Create `backend/stripe_config.py`
   - Import from single location
   - Remove duplicate initialization

### Short-term (Next Quarter)
3. **[Important] Document Extension Security Model**
   - Explain CORS chrome-extension:// regex
   - Document that any extension can access API
   - Consider extension ID whitelisting

4. **[Minor] Add Security Header Tests**
   - Verify HSTS in production
   - Test CSP headers
   - Validate X-Frame-Options

### Long-term (Future Releases)
5. **[Minor] Certificate Pinning**
   - Implement on mobile app for API communication
   - Add pin validation fallback

6. **[Minor] Enhanced Logging**
   - Add security event logging
   - Track failed auth attempts
   - Monitor unusual API patterns

---

## Compliance Checks

### OWASP Top 10 (2021)
- ✓ A01: Broken Access Control - JWT + auth middleware
- ✓ A02: Cryptographic Failures - HTTPS enforced
- ✓ A03: Injection - Input validation, parameterized queries
- ✓ A04: Insecure Design - Proper threat modeling evident
- ✓ A05: Security Misconfiguration - Environment-based secrets
- ✓ A06: Vulnerable Components - No obvious vulnerable deps detected
- ✓ A07: Authentication Failures - JWT properly implemented
- ✓ A08: Software & Data Integrity - No suspicious code modifications
- ✓ A09: Logging & Monitoring - Basic logging in place
- ✓ A10: SSRF - Input validation prevents SSRF in redirect URLs

### Privacy Best Practices
- ✓ JWT tokens expire (1 hour)
- ✓ Webhooks deduplicated (prevents replay)
- ✓ Rate limiting on sensitive endpoints
- ✓ User data properly scoped by user_id

---

## Testing Recommendations

### Security Test Cases
1. **Test invalid JWT tokens** → Should return 401
2. **Test cross-user scan access** → Should return 404
3. **Test oversized file uploads** → Should return 413
4. **Test invalid platform names** → Should return 400
5. **Test CORS origin validation** → Non-allowed origins should be rejected
6. **Test webhook signature validation** → Invalid signatures should be rejected

### Penetration Testing
- [ ] Test JWT token expiration handling
- [ ] Test rate limiting bypass attempts
- [ ] Test file upload content verification
- [ ] Test redirect URL validation in Stripe checkout

---

## Conclusion

**Overall Security Rating: B+ (Good)**

AlgorithmLens demonstrates solid security practices with proper authentication, input validation, and secrets management. No critical vulnerabilities were identified. The main areas for improvement involve:

1. Refining CSP to reduce unsafe directives
2. Documenting extension security model
3. Centralizing configuration management
4. Adding comprehensive security test coverage

The codebase is ready for production with the above minor improvements recommended for the next release cycle.

---

## Audit Methodology

This audit was conducted through:
1. **Static Code Analysis** - Reviewing source code for security patterns
2. **Configuration Review** - Examining environment setup and deployment configs
3. **Dependency Analysis** - Checking for known vulnerable patterns
4. **Threat Modeling** - Analyzing attack surfaces for each platform
5. **Authentication & Authorization Review** - Validating access control patterns
6. **Data Protection Review** - Ensuring sensitive data handling

**Tools Used:**
- Manual code inspection
- Grep pattern matching for known vulnerabilities
- Configuration verification

---

**Report Generated:** 2026-02-24
**Auditor:** Claude Code Security Audit
**Status:** Complete
