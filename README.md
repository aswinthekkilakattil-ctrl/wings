# Wings Campus Landing Pages

Mobile-first React campaign site with three separate pages:

- `/students` for the student landing page
- `/seo-cpanel` for SEO and hosting operations
- `/admin` for local lead review and Excel-compatible export

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy on Vercel

1. Push this folder to GitHub.
2. Import the repo in Vercel.
3. Framework preset: `Vite`.
4. Build command: `npm run build`.
5. Output directory: `dist`.

## Lead Collection Note

Lead submissions are now Mongo-backed only.

- `npm run dev` serves `/api/leads` through the Vite dev server and uses `MONGODB_URI`.
- Vercel uses the serverless function in `api/leads.js`.
- Optional `VITE_MONGO_*` values can still be used as a fallback direct connection path when needed.

## cPanel

If you later need cPanel hosting instead of Vercel, upload the built `dist` folder contents to `public_html` and configure route fallback to `index.html`.
