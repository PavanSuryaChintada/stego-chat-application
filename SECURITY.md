# Security Policy

## Supported Versions

Currently supported versions for security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of StegoChat seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Where to Report

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please send an email to the repository owner or create a private security advisory on GitHub.

### What to Include

Please include the following information in your report:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- The location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- We will acknowledge receipt of your vulnerability report within 48 hours
- We will provide a detailed response indicating next steps within 5 business days
- We will work on a fix and keep you informed of the progress
- Once fixed, we will publicly disclose the vulnerability (crediting you if you wish)

## Security Best Practices

### For Users

1. **Never share your Supabase credentials** publicly
2. **Use strong passwords** for your account
3. **Keep your dependencies updated** regularly
4. **Use passcode protection** for sensitive messages
5. **Verify message integrity** by checking checksums

### For Developers

1. **Never commit `.env` files** to the repository
2. **Use environment variables** for all sensitive data
3. **Keep dependencies updated** to patch known vulnerabilities
4. **Follow secure coding practices** as outlined in CONTRIBUTING.md
5. **Enable Row Level Security (RLS)** in Supabase
6. **Validate all user inputs** on both client and server
7. **Use prepared statements** for database queries

## Security Features

StegoChat implements several security measures:

- **End-to-End Encryption** using AES-GCM
- **Key Derivation** using PBKDF2 with random salts
- **Initialization Vectors (IV)** for each encrypted message
- **Checksum Verification** to detect tampering
- **Row Level Security** in Supabase database
- **Secure Authentication** via Supabase Auth
- **HTTPS-only communication** in production
- **Content Security Policy** headers
- **Input validation** and sanitization

## Known Limitations

1. **Client-side encryption**: Encryption happens in the browser, which assumes the client environment is secure
2. **Image format restrictions**: Some image formats may lose steganographic data due to compression
3. **Browser compatibility**: Requires modern browsers with Web Crypto API support

## Disclosure Policy

When a security vulnerability is discovered and fixed:

1. A patch will be released as soon as possible
2. A security advisory will be published on GitHub
3. The CHANGELOG will be updated with security fix details
4. Credit will be given to the reporter (if they wish)

## Security Updates

To stay informed about security updates:

- Watch this repository for security advisories
- Check the CHANGELOG.md regularly
- Follow the repository for important announcements

## Compliance

This project aims to follow:

- OWASP Top 10 security guidelines
- Industry-standard encryption practices
- Secure authentication patterns
- Data privacy principles

Thank you for helping keep StegoChat and its users safe!
