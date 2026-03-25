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

This project has no backend. Right now:

- Student entries are stored in the browser `localStorage`.
- Leads can be reviewed in `/admin` and exported as `CSV`, which opens in Excel.
- If you want shared real campaign submissions from ads, set a sheet or form endpoint in `src/main.tsx` using `SHEET_ENDPOINT`.

## cPanel

If you later need cPanel hosting instead of Vercel, upload the built `dist` folder contents to `public_html` and configure route fallback to `index.html`.
