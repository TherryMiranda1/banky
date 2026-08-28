# Security Policy

Banky handles sensitive banking metadata and personal financial information. Security and confidentiality are our highest priorities.

---

## 🛡️ Reporting a Vulnerability

If you discover a security vulnerability within Banky, please do **NOT** open a public issue.

Instead, please send an email or submit a private security advisory on GitHub with details about:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any proposed remediation

We will acknowledge receipt of your vulnerability report within 48 hours and work with you to remediate and publish a fix.

---

## 🔒 Security Architecture Highlights

Banky is engineered with defense-in-depth principles:

1. **AISP Read-Only**: Enable Banking integration is strictly read-only (Account Information Service Provider). Banky never has transfer or transaction execution permissions.
2. **At-Rest Encryption**: Sensitive bank session identifiers and tokens are encrypted at rest using **AES-256-GCM** with unique initialization vectors (IVs) and authentication tags.
3. **Password Security**: Passwords are never stored in plaintext; they are hashed using **PBKDF2-HMAC-SHA256** with 100,000 iterations and a cryptographically secure random salt via Web Crypto API.
4. **Stateless OAuth Anti-CSRF**: OAuth `state` parameters are cryptographically signed using HMAC-SHA256, allowing stateless verification in edge worker environments without shared memory leaks.
5. **Strict Multi-Tenant Scoping**: All database queries strictly scope user data to the verified `userId` extracted from the JWT token.
