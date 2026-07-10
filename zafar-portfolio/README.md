# Zafar Sheikh — Portfolio + Admin CMS

A premium, animated one-page portfolio site with a full admin panel behind it. Everything visible on the
public site — photo, headline, stats, timeline, skills, projects, contact info, even the color theme and
fonts — is editable from `/admin`, no code required after setup.

---

## 1. What's included

- **Public site** (`/`) — the animated portfolio, now fully data-driven (nothing is hardcoded).
- **Admin panel** (`/admin`) — login-protected dashboard to manage every section:
  - Hero & Identity (photo, headline, subtext, buttons, floating stat badge)
  - About & Results (your story, the "currently working on" line, 4 result stat cards)
  - Journey (add/edit/remove work history entries and their bullet points)
  - Craft & Skills (add/edit/remove skill categories and tool chips)
  - **Projects** (new section — add/edit/remove project cards with image, tags, link)
  - Education & Languages
  - Contact Info (email, phone, location)
  - **Theme & Style** — 4 preset color palettes, a full custom color picker, 4 font pairings, 3 text-size options — applied live as you pick
  - **Messages** — every contact-form submission lands here, with mark read/unread and delete
  - **Account** — change your admin email or password
- **Contact form** on the public site that emails you and saves a copy in the admin Messages tab.
- **Forgot-password flow** — email yourself a reset link if you ever forget your password.
- Zero external database required — content lives in a single `data/db.json` file on your server.

---

## 2. Project structure

```
zafar-portfolio/
├── server.js              # entry point
├── config/db.js           # tiny JSON-file datastore
├── middleware/auth.js      # JWT auth guard for admin routes
├── routes/                 # auth, content, contact, messages APIs
├── utils/                  # mailer, tokens, theme/typography presets
├── data/seed.json          # the starting content (used to create data/db.json on first run)
├── public/
│   ├── index.html           # the public site
│   ├── assets/theme.js      # shared theme-applying logic
│   └── admin/                # login, forgot/reset password, dashboard
├── .env.example
└── package.json
```

---

## 3. Local setup

**Requirements:** Node.js 18+ installed on your computer.

```bash
# 1. Install dependencies
npm install

# 2. Create your own .env file
cp .env.example .env
```

Now open `.env` and fill in these values:

| Variable | What it's for |
|---|---|
| `ADMIN_EMAIL` | The email you'll log in with. Only read the *first time* the server ever starts. |
| `ADMIN_INITIAL_PASSWORD` | Your starting password. Also only read on first boot — **change it from Account settings after logging in once.** |
| `JWT_SECRET` | Any long random string, used to sign login sessions. Generate one with:<br>`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `EMAIL_USER` / `EMAIL_PASS` | A Gmail address + [App Password](https://myaccount.google.com/apppasswords) (not your normal password). Powers the contact form email and password-reset emails. Optional to start — the site works fine without it, messages just won't email you (they'll still be saved in the Messages tab). |
| `PUBLIC_URL` | Leave as `http://localhost:3000` for local use. Set to your real domain once deployed (used to build the password-reset link). |

```bash
# 3. Start the server
npm start
```

You'll see:

```
✔ Admin account created for you@example.com. You can log in at /admin now.
Zafar Sheikh portfolio server running → http://localhost:3000
Admin panel                          → http://localhost:3000/admin
```

- Public site: **http://localhost:3000**
- Admin login: **http://localhost:3000/admin**

**Your admin login is whatever you set `ADMIN_EMAIL` / `ADMIN_INITIAL_PASSWORD` to in `.env`.** That's it — there's no separate hardcoded password anywhere in the code. The very first server start reads those two values, creates your account, and never reads them again (so it's safe to leave them in `.env` — editing them later does nothing until you delete `data/db.json`, which you should never need to do).

**Forgot your password?** Click "Forgot your password?" on the login page. If email is configured, a reset link arrives in your inbox. If you haven't set up email yet and get locked out during local development, just delete `data/db.json` and restart the server — it'll recreate your account from `.env` again. (Don't do this in production — it wipes all your content too. Use the emailed reset link instead.)

---

## 4. Using the admin panel

Every tab works the same way: edit the fields, click **Save changes** at the bottom. Changes appear on
the live site immediately (no rebuild/redeploy needed).

- **Journey / Craft / Projects** are list editors — "+ Add" makes a new blank card, the ✕/Remove buttons
  delete one, and Save writes the whole list back.
- **Images** (hero photo, project images) — click the file picker, choose an image, you'll see a preview
  immediately. It's only actually saved when you click Save changes.
- **Theme & Style** — clicking any preset or color previews it across the whole admin panel instantly, so
  you can see exactly what visitors will see. Nothing is public until you click Save changes.
- **Messages** — anyone who submits your contact form shows up here. A small badge on the sidebar shows
  how many are unread.

---

## 5. Deploying it live

You need a host that can run a persistent Node.js process (not a "serverless functions only" platform)
**and** give you a small amount of persistent disk space, since your content is stored in one JSON file.
Two good, current (2026) options:

### Option A — Railway (easiest)

1. Push this project to a GitHub repository (see step 6 below if you're not on GitHub yet).
2. Go to [railway.com/new](https://railway.com/new), sign in with GitHub, and pick **Deploy from GitHub repo** → your repo. Railway detects Node.js automatically.
3. Open the service → **Variables** tab → add every variable from your `.env` file (same names, your real values). Set `PUBLIC_URL` to the `*.up.railway.app` domain Railway gives you (or your custom domain, if you attach one under **Settings → Domains**).
4. Open **Volumes** (right-click the project canvas, or ⌘K → "New Volume") and mount a volume at `/app/data`. This is the persistent disk that keeps your `db.json` safe across deploys — **don't skip this step**, or your content resets every time you redeploy.
5. Deploy. Railway builds and starts your app automatically (it runs `npm start`), and gives you a live URL.

### Option B — A basic VPS (Hostinger, DigitalOcean, etc.)

If you already manage a VPS for your e-commerce project, this is the most familiar path:

1. SSH in, install Node.js 18+, clone/upload this project.
2. `npm install`, create `.env` with your real values (`PUBLIC_URL` = your domain).
3. Install `pm2` to keep it running: `npm install -g pm2` then `pm2 start server.js --name portfolio` and `pm2 save && pm2 startup`.
4. Point your domain at the server and put Nginx (or Caddy) in front of it as a reverse proxy to `localhost:3000`, with a free SSL cert via Certbot/Let's Encrypt.

Either way, once live: visit `https://yourdomain.com/admin`, log in, and everything you set locally carries over automatically if your `.env` values match — but note **production starts fresh** unless you copy your local `data/db.json` over too. Easiest path: just re-enter your content once through the live admin panel, or `scp`/upload your local `data/db.json` into the server's `data/` folder before first boot.

---

## 6. Pushing to GitHub (if needed)

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

`.env` and `data/db.json` are already in `.gitignore` — your password and live content never get committed.

---

## 7. Security notes

- Passwords are hashed with bcrypt, never stored in plain text.
- Admin sessions use an httpOnly JWT cookie (not readable by page JavaScript).
- Login and password-reset requests are rate-limited to block brute-force attempts.
- Password-reset links expire after 30 minutes and are single-use.
- The contact form has a honeypot field plus rate-limiting against spam bots.

---

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| "No admin account exists yet" warning on boot | Set `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD` in `.env`, restart. |
| Contact form / reset emails never arrive | Check `EMAIL_USER`/`EMAIL_PASS` in `.env` — must be a Gmail **App Password**, not your login password. Check the server logs for `[mailer]` errors. |
| Changes in admin don't show on the live site | Hard refresh (Ctrl/Cmd+Shift+R) — content is fetched fresh on every page load, so this is almost always a browser cache issue. |
| Content resets after redeploying | Your host doesn't have a persistent volume mounted at the `data/` folder — see the Railway steps above (step 4) or your host's equivalent. |
| Locked out of admin | Use "Forgot your password?" on the login page (needs email configured). |

---

Built with Node.js, Express, and vanilla JS — no build step, no framework lock-in.
