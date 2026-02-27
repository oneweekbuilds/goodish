---
description: Check codebase for security vulnerabilities
allowed-tools: Read, Grep, Glob, Write, Bash(git:*), Task
---

Perform a comprehensive security audit of the AlgorithmLens project. The goal is to find any security vulnerabilities, exposed secrets, or missing protections.

First, read the code quality skill at `${CLAUDE_PLUGIN_ROOT}/skills/code-quality/SKILL.md` for baseline standards on secrets management.

Then check the codebase for each of the following categories:

**1. Exposed Secrets and Credentials**
- Search all files for hardcoded API keys, tokens, passwords, or secrets
- Look for patterns like: `sk_live_`, `sk_test_`, `api_key =`, `secret =`, `password =`, `token =`, `Bearer `, connection strings with credentials
- Check if `.env` files have been committed to version control (check git history too with `git log --all --diff-filter=A -- "*.env"`)
- Verify `.gitignore` includes `.env`, `.env.local`, `.env.production`, and similar
- Check for secrets in configuration files, Docker files, or deployment scripts

**2. Missing Environment Variables**
- Identify all places where environment variables are expected
- Check that a `.env.example` file exists documenting required variables
- Verify no environment variable access falls back to hardcoded defaults that contain real values

**3. Input Validation**
- Check all API endpoints for input validation
- Look for endpoints that accept user input without sanitization
- Check for SQL injection vulnerabilities (if applicable)
- Check for XSS vulnerabilities in rendered content
- Verify the Chrome extension data is validated before processing

**4. Authentication and Authorization**
- Check that protected endpoints require authentication
- Verify that premium endpoints check `is_user_plus`
- Look for endpoints that should be protected but aren't
- Check for broken access control patterns

**5. API Security**
- Verify CORS configuration
- Check rate limiting on sensitive endpoints
- Verify Stripe webhook signature validation
- Check that error responses don't leak internal information

**6. Dependency Security**
- Check for known vulnerable dependencies (if package.json or requirements.txt are present)
- Flag any dependencies that are significantly outdated

**7. Data Handling**
- Check what user data is stored and whether it's minimized
- Verify sensitive data isn't logged
- Check that API responses don't include more data than necessary

For each finding, document:
1. **File path and location** where the issue exists
2. **What the vulnerability is** — explained in plain language
3. **What could happen** — the real-world risk
4. **How to fix it** — plain-language remediation steps
5. **Severity** — critical, important, or minor

Save the results as `SECURITY_AUDIT.md` in the project root directory. Include a summary at the top with counts by severity and a clear list of any immediately dangerous items (like exposed production secrets).
