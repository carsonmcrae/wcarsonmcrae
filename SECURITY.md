# Security

This repository is a static personal website. It has no server, database, accounts, forms, or
analytics, and it stores nothing about visitors outside their own browser.

## Reporting a problem

If you find a security issue (for example, a way to run script on the site, a leaked credential in the
history, or private information that should not be public), please report it privately through
GitHub's **Report a vulnerability** button on this repository's Security tab, or send Carson a message
on [LinkedIn](https://www.linkedin.com/in/carsonmcrae/). Please do not open a public issue for it.

## What is in place

- A strict Content-Security-Policy on every page, with hashed scripts and styles and no third-party
  requests.
- Exactly pinned dependencies with a 14-day adoption cooldown, no install scripts, `npm audit` and
  registry-signature checks, CodeQL, dependency review on pull requests, and gitleaks secret scanning.
- GitHub Actions pinned to full commit SHAs, with read-only default permissions.
