# Deploying to GitHub Pages and wcarsonmcrae.com

The site is built and published by GitHub Actions (`.github/workflows/deploy.yml`) whenever `main`
changes. Nothing is published from any other branch. The DNS values below come from GitHub's own
documentation ([managing a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site),
checked November 2026). Re-check that page before changing DNS in case the values have changed.

## How the address is chosen

`actions/configure-pages` reports the address GitHub Pages will serve, and the build uses it for every
link, canonical tag, sitemap entry, and social image:

| Stage                   | Address                                       |
| ----------------------- | --------------------------------------------- |
| Before a custom domain  | `https://carsonmcrae.github.io/wcarsonmcrae/` |
| After the domain is set | `https://wcarsonmcrae.com/`                   |

No code change is needed when the domain switches over. `npm run test:build:subpath` proves the project
path works on every change.

This is a **project site**, separate from the `carsonmcrae.github.io` portfolio repository, which has no
custom domain. Adding a custom domain to this repository does not change the portfolio. (If the
portfolio ever gets a custom domain, project sites without their own domain would move under it; this
one has its own, so it would not.)

## 1. Enable Pages (once)

1. In **carsonmcrae/wcarsonmcrae → Settings → Pages**, set **Source** to **GitHub Actions**.
2. Merge to `main` (or run the **Deploy** workflow from the Actions tab). The quality gate runs first;
   the site deploys only if every check passes.
3. Open `https://carsonmcrae.github.io/wcarsonmcrae/` and check the site.

## 2. Verify the domain (recommended, protects against takeovers)

1. Open your **profile** settings (not the repository's): **Settings → Pages → Add a domain**, and
   enter `wcarsonmcrae.com`.
2. Add the TXT record GitHub shows you at your DNS provider. Its name has the form
   `_github-pages-challenge-carsonmcrae.wcarsonmcrae.com`.
3. Confirm it has propagated, then click **Verify**. Keep the TXT record afterwards.

```bash
dig _github-pages-challenge-carsonmcrae.wcarsonmcrae.com +nostats +nocomments +nocmd TXT
```

## 3. Add the custom domain

1. In **Settings → Pages → Custom domain**, enter `wcarsonmcrae.com` and save. With a custom Actions
   workflow, GitHub creates no `CNAME` file and ignores one if it exists, so this repository has none.
2. At your DNS provider, remove any default parking records for the apex, then add:

| Type    | Name  | Value                                                                                      |
| ------- | ----- | ------------------------------------------------------------------------------------------ |
| `A`     | `@`   | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`                 |
| `AAAA`  | `@`   | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| `CNAME` | `www` | `carsonmcrae.github.io` (your user domain, without the repository name)                    |

If your provider supports `ALIAS` or `ANAME` records, one pointing `@` at `carsonmcrae.github.io` can
replace the `A` and `AAAA` records. Do not use wildcard records such as `*.wcarsonmcrae.com`.

With both the apex and `www` configured, GitHub redirects `www.wcarsonmcrae.com` to
`wcarsonmcrae.com` automatically, because the custom domain is the apex.

## 4. Check DNS and turn on HTTPS

```bash
dig wcarsonmcrae.com +noall +answer -t A
```

```bash
dig wcarsonmcrae.com +noall +answer -t AAAA
```

```bash
dig www.wcarsonmcrae.com +nostats +nocomments +nocmd
```

The apex should list the four GitHub addresses; `www` should be a CNAME to `carsonmcrae.github.io`.
DNS changes can take up to 24 hours. Then select **Enforce HTTPS** in **Settings → Pages** (it can take
up to 24 hours to become available while GitHub issues the certificate). If the certificate stalls,
remove the custom domain, save it again, and wait.

## 5. Verify the live site

- `https://wcarsonmcrae.com/` loads over HTTPS, and `http://` and `www.` redirect to it.
- `https://wcarsonmcrae.com/about/`, `/work/`, `/life/`, `/contact/`, and `/accessibility/` load directly.
- `https://wcarsonmcrae.com/sitemap-index.xml` and `/robots.txt` use the custom domain.
- A missing page such as `/nope/` shows the site's 404 page.
- Share the homepage link in a messaging app to check the preview image and text.

## Rolling back

Revert the commit on `main`; the Deploy workflow republishes the previous version. To take the site
offline, set **Settings → Pages → Source** to none (or unpublish the site from that page).
