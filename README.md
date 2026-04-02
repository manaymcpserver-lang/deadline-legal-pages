# DeadLine Legal Pages (GitHub Pages)

This folder is ready to be deployed as a static site for:

- `https://deadline.codeconductor.pro/`

It already includes:

- `CNAME` set to `deadline.codeconductor.pro`
- `privacy/`
- `support/`
- `data-deletion/`
- `terms/`

## Deploy Option A (recommended): separate repo

1. Create a new GitHub repo, for example `deadline-legal-pages`.
2. Copy the contents of this folder into that repo root.
3. Push to `main`.
4. In GitHub repo: `Settings -> Pages`
5. Source: `Deploy from branch`, branch `main`, folder `/ (root)`.
6. In `Custom domain`, set `deadline.codeconductor.pro`.
7. Enable HTTPS after DNS is live.

## DNS (Hostinger)

For `codeconductor.pro` zone:

- Type: `CNAME`
- Name: `deadline`
- Target: `manaymcpserver-lang.github.io`
- TTL: Auto (or 300)

If any existing `A`, `AAAA`, or `CNAME` for host `deadline` exists, remove it first.

## Verify

```bash
dig +short deadline.codeconductor.pro
curl -I https://deadline.codeconductor.pro
```

Expected:

- `dig` resolves to `manaymcpserver-lang.github.io.`
- `curl` returns HTTP 200/301 over HTTPS after certificate provisioning.
