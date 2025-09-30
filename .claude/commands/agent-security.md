---
description: Launch security-compliance-officer for security audit
---

Launch security-compliance-officer agent for comprehensive security audit:

Focus areas:
- Clerk authentication implementation and JWT validation
- JWT claim validation (o.id, o.rol, o.slg from Clerk Organizations)
- Multi-tenant data isolation (Prisma middleware + PostgreSQL RLS)
- Field-level encryption for sensitive data (PII, credentials)
- Audit trail completeness and immutability
- API authorization (ClerkAuthGuard usage)
- SQL injection prevention (Prisma parameterization)
- XSS prevention (React auto-escaping, CSP headers)
- CSRF protection
- SOC 2 Type II compliance requirements
- Zero-trust architecture principles

The agent will:
1. Audit authentication and authorization flows
2. Test multi-tenant isolation boundaries
3. Review encryption implementations
4. Validate audit trail immutability
5. Check for common security vulnerabilities
6. Assess SOC 2 compliance readiness

Report findings with severity levels (Critical, High, Medium, Low) and remediation steps.