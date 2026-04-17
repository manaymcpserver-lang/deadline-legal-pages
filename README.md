# Nonlate Legal Pages (GitHub Pages)

This folder is ready to be deployed as a static site for:

- `https://nonlate.app/`

It already includes:

- `CNAME` set to `nonlate.app`
- `.well-known/assetlinks.json`
- `deadline/oauth/callback/`
- `privacy/`
- `support/`
- `data-deletion/`
- `terms/`

## Deploy Option A (recommended): separate repo

1. Create a new GitHub repo, for example `nonlate-legal-pages`.
2. Copy the contents of this folder into that repo root.
3. Push to `main`.
4. In GitHub repo: `Settings -> Pages`
5. Source: `Deploy from branch`, branch `main`, folder `/ (root)`.
6. In `Custom domain`, set `nonlate.app`.
7. Enable HTTPS after DNS is live.

## DNS (Hostinger)

For your DNS zone:

- Type: `A`
- Name: `@`
- Target: `185.199.108.153`

- Type: `A`
- Name: `@`
- Target: `185.199.109.153`

- Type: `A`
- Name: `@`
- Target: `185.199.110.153`

- Type: `A`
- Name: `@`
- Target: `185.199.111.153`

- Type: `AAAA`
- Name: `@`
- Target: `2606:50c0:8000::153`

- Type: `AAAA`
- Name: `@`
- Target: `2606:50c0:8001::153`

- Type: `AAAA`
- Name: `@`
- Target: `2606:50c0:8002::153`

- Type: `AAAA`
- Name: `@`
- Target: `2606:50c0:8003::153`

- Optional `www` record:
  Type: `CNAME`
  Name: `www`
  Target: `manaymcpserver-lang.github.io`

If any existing conflicting `A`, `AAAA`, or `CNAME` for the root host exists, remove it first.

## Verify

```bash
dig +short nonlate.app
curl -I https://nonlate.app
```

Expected:

- `dig` resolves to GitHub Pages IPs
- `curl` returns HTTP 200/301 over HTTPS after certificate provisioning.
