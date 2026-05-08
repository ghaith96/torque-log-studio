# Torque Log Studio

Local-only web app for exploring **Torque Pro** (Android) CSV logs as synced time-series charts. Built with [Gea](https://github.com/geajs/gea), TypeScript, Vite, and [uPlot](https://github.com/leeoniya/uPlot).

## Run

```bash
npm install
npm run dev
```

Open the printed URL and import a `.csv` export.

### Install as an app (PWA)

After **`npm run build`**, serve the **`dist/`** folder over **HTTPS** (or run **`npm run preview`** locally). In Chromium-based browsers, use **Install app** (or the menu equivalent); Safari on iOS: **Share → Add to Home Screen**. Install prompts require a production build — the dev server does not register the offline service worker (`vite-plugin-pwa` dev mode is disabled).

## Supported Torque CSV assumptions

- **Delimiter:** comma, semicolon, or tab — inferred from the header row.
- **Header row:** first non-empty line is treated as column names.
- **Time column:** prefers headers containing `time`, `timestamp`, `gps`, `epoch`, etc.; otherwise picks the column that best parses as time/numbers on sample rows.
- **Time values:** numeric (seconds, milliseconds, or Unix-like), ISO-ish date strings, or `HH:MM:SS(.fraction)`.
- **Channels:** columns where ≥ ~65% of rows parse as numbers are treated as plottable signals (excluding the chosen time column).
- **Encoding:** UTF-8 text after export; unusual encodings may mis-parse — re-export UTF-8 from Torque if needed.

## Known limitations

- Very large files are downsampled for drawing (stride) so the UI stays responsive; fine detail may be thinned.
- Canvas charts are visual-first; screen-reader-friendly tabular export is not implemented in v1.
- Multi-byte row filtering: rows without a parsable timestamp are skipped so channels stay aligned.

## Privacy

No telemetry and no upload: parsing runs in your browser (including a dedicated worker thread). Data does not leave your machine unless you share the file yourself.
