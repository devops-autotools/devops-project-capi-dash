# Security Policy

## Supported Versions

We currently support the following versions of CAPI Dashboard with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

We take the security of this project seriously. If you believe you have found a security vulnerability, please report it to us responsibly.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please send an email to [security@example.com](mailto:security@example.com) (replace with your actual security contact email) with a description of the issue. We will acknowledge your email within 48 hours and provide a timeline for a fix.

### What to include in your report:

-   A detailed description of the vulnerability.
-   Steps to reproduce the issue (PoC scripts or screenshots are helpful).
-   Potential impact of the vulnerability.
-   Any suggested mitigations.

## Disclosure Policy

When a vulnerability is reported, we will:

1.  Acknowledge the report and begin an investigation.
2.  Work on a fix or mitigation.
3.  Once a fix is verified, we will release a new version.
4.  Publicly disclose the vulnerability after a reasonable period (usually 30-90 days) or once users have had sufficient time to update.

## Security Best Practices for CAPI Dashboard

Since this tool interacts with Kubernetes clusters and Infrastructure Providers (like OpenStack), please ensure:

-   **RBAC:** Use the provided RBAC manifests (`deployments/rbac.yaml`) and follow the principle of least privilege.
-   **Secrets:** Never commit sensitive credentials (like OpenStack clouds.yaml or Kubernetes Kubeconfigs) to the repository. Use Kubernetes Secrets.
-   **Network:** Ensure the dashboard is deployed within a secure network perimeter and use TLS for all communications.
