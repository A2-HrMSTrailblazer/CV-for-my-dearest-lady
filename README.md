# Ei Ei Mon — personal CV site (Vue 3 + Vite, hosted on Vercel)

A personal showcase page in a dashboard layout (sidebar, profile card, experience list, education timeline,
language meters, skills, certificates). It has a hidden, password-protected owner menu for editing on the
live site, publishing changes for everyone, and downloading a PDF CV or a one-page resume.

## How editing and publishing work

```
edit on the live site ──► Publish ──► /api/publish (Vercel function)
                                       │  checks the password on the server
                                       ▼
                              commit to GitHub: src/data/profile.json + public/content/*.jpg
                                       │
                                       ▼
                              Vercel rebuilds automatically (about 1 minute) ──► everyone sees it
```

- No database, nothing that pauses or expires from lack of use. GitHub keeps the full history, so any bad edit can be undone.
- Until she taps **Publish**, edits stay in that browser only.

## Owner menu

- **Phone or mouse:** press and hold the name on the profile card for about one second.
- **Keyboard:** type `owner` anywhere on the page, outside a text field.

Then enter the owner password. The menu offers: **Download CV**, **Download resume**, **Edit page**,
**Publish changes**, **Export data** (backup file), **Lock**. The password is kept in memory only, so reloading the
page locks the menu again.

While editing, a pink bar at the bottom has **Publish** and **Finish editing**.

## Deploy (first time, about 15 minutes)

1. **Set the real password** (long, private):
   ```bash
   npm run set-password -- "a long passphrase only she knows"
   ```
   This writes a salted hash to `src/config.js`. The website and the server both check against it.

2. **Put the project on GitHub.** Create a new repository (private is fine), then:
   ```bash
   git init
   git add .
   git commit -m "First version"
   git branch -M main
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```

3. **Import it into Vercel.** vercel.com → Add New → Project → pick the repository.
   Vercel detects Vite automatically (build `npm run build`, output `dist`). Click Deploy.
   The site is now live, but Publish won't work until step 5.

4. **Make a GitHub token for publishing.** GitHub → Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token.
   - Repository access: **Only select repositories** → this repository
   - Permissions → Repository permissions → **Contents: Read and write**
   - Expiration: the longest offered. Put the date in a calendar. When it expires, the site keeps working and only
     Publish stops, with a message saying to renew the token.

5. **Add environment variables in Vercel.** Project → Settings → Environment Variables:

   | Name | Value |
   | --- | --- |
   | `GITHUB_TOKEN` | the token from step 4 |
   | `GITHUB_REPO` | `<user>/<repo>` |
   | `GITHUB_BRANCH` | `main` (optional) |
   | `SITE_URL` | optional: a custom domain such as `https://eieimon.com`. Without it, the Vercel address is used for link previews. |

   Then Deployments → the latest one → **Redeploy**, so the function picks them up.

6. **Test it:** open the live site, hold the name, unlock, Edit page, change one word, Publish.
   About a minute later, reload: the change is there for everyone, and GitHub shows a commit
   "Update profile from the website".

## Local development

```bash
npm install
npm run dev          # site only; Publish shows "only works on the deployed site"
npx vercel dev       # site + /api/publish locally (needs the Vercel CLI and the env variables)
npm run build        # production build in dist/
```

## Content

Everything lives in `src/data/profile.json` (the website edits this file for you when publishing).

- **Photo:** upload one in edit mode. Uploaded images are stored in `public/content/`.
- **Phone:** always printed in the PDFs; shown on the page only when `showPhone` is true (tick box in edit mode).
  The number is in the site's code either way, because the PDFs are made in the browser. Remove it from the file if it must stay fully private.
- **Language meters:** `score` 1–6 per language. Levels from different tests are only roughly comparable.
- **Certificates:** every experience and education entry can hold a certificate image. They appear in the Certificates
  section and in the CV appendix.

## Security, honestly

- Publishing is protected on the server: without the password, nothing can be written to GitHub.
- The GitHub token lives only in Vercel's settings, never in the website code.
- The password hash is in the public code (`src/config.js`), so a weak password could be guessed offline.
  Use a long passphrase (four or more random words).
- The hidden menu and PDF downloads are client-side conveniences, not secrets.

## Where things live

```
api/publish.js               server function: checks password, commits to GitHub
src/
  data/profile.json          all content
  config.js                  salted hash of the owner password (npm run set-password)
  App.vue                    page layout and sections
  styles.css                 colours, borders, buttons, chips
  components/
    SideNav.vue              sidebar (wide screens) / sticky tab bar (phones)
    ProfileCard.vue          yellow profile card: photo, name (long-press target), stats, bio
    PhotoSlot.vue            photo or initials, upload in edit mode
    ExperienceList.vue       experience cards (tap the icon in edit mode to change it)
    EducationTimeline.vue    "degrees in progress" card with a timeline drawn from the dates
    CertTools.vue            edit-mode certificate tools
    CertificateViewer.vue    full-size certificate pop-up
    ChipList.vue             editable chip lists
    EditableText.vue         text that becomes an inline field in edit mode
    OwnerSheet.vue           the hidden owner menu
    PasswordGate.vue         password prompt
    Icon.vue                 icon set
  composables/
    useStore.js              shared state, local drafts, publish
    useOwnerGesture.js       long-press and typed-word triggers
  lib/
    publish.js               sends edits and new images to /api/publish
    pdf.js                   CV and resume PDF layouts (jsPDF)
    image.js                 shrinks uploads; turns image paths back into data for the PDF
    auth.js                  password check and lockout
    saveFile.js              file download helper
public/
  favicon.svg, apple-touch-icon.png, og-image.png   tab icon and link preview
  content/                   uploaded photos and certificates
scripts/set-password.mjs     changes the owner password
```

## Known limits

- PDFs use Courier for headings and Helvetica for text; neither has Burmese or Thai characters.
- Each publish request is kept under Vercel's 4.5 MB limit; several new images are sent in batches automatically.
- Vercel's free Hobby plan is for personal, non-commercial sites, which fits a personal CV.
