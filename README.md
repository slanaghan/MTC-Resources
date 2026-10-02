# CSUDH Math Teachers’ Circle Session Library

A complete static website for GitHub Pages, with the supplied CSUDH MTC logo, 134 sessions, 148 documented offerings, and 586 resource files. “Collaborative Lesson Planning and Sharing” and its nine offerings are excluded.

## What is included

- Search session titles, descriptions, tags, presenters, and linked resource titles.
- Combine mathematical-focus, year, program, and presenter filters. Multiple focus areas use OR; the other filters use AND. Year, program, and presenter must match the same offering.
- Sort by most recent, title, or earliest date. Results are paginated.
- Open a session for all its documented dates, presenters, date notes, files, and each offering’s Google Drive folder.
- Search the full resource archive by file name, folder, or linked session topic; filter by file type and archive year.
- Share a search or session by copying its URL. Search state is retained in the query string.
- Use the spreadsheet converter at `update.html` to generate a replacement `data/sessions.json` entirely in the browser.
- Responsive layouts, keyboard navigation, labeled controls, a native accessible details dialog, and reduced-motion support.

## Put the site on GitHub Pages

1. Extract this ZIP on your computer.
2. Create a GitHub repository for the website, or open the repository you intend to use. GitHub Free supports Pages for public repositories; private-repository availability depends on your plan.
3. Upload the **contents** of this folder to the repository’s root. `index.html` should be at the top level, beside `assets`, `data`, and `downloads`—not inside an extra `mtc-website` folder.
4. Open **Settings → Pages**. Under **Build and deployment**, select **Deploy from a branch**, then your branch (usually `main`) and **/(root)**. Save.
5. Wait for GitHub Pages to finish publishing. The Pages settings screen displays the website address.

No application build, database server, API key, or paid hosting service is required. The `.nojekyll` file tells Pages to serve the files as-is; if your upload method omits hidden files, create an empty `.nojekyll` file in the repository root. All website URLs are relative, so repository subpaths work.

Official GitHub instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Your ongoing update process

1. Keep one saved master copy of `MTC_Session_Database.xlsx`.
2. Edit the **Sessions** and **Offerings** tabs. Update **Resources** when adding individual files.
3. Open **Update the library** in the site footer. Choose your saved workbook and click **Check spreadsheet**.
4. Correct any reported issues, then download `sessions.json`.
5. In your GitHub repository, open the `data` folder and upload the new `sessions.json`, replacing the old file. Commit the change.
6. Once Pages has published, reload the site. The application requests the current data file when it loads. An already-open page does not update until reloaded.
7. If you want the downloadable workbook on the site to stay current, replace `downloads/MTC_Session_Database.xlsx` with your saved master too.

The converter does **not** publish changes, upload the workbook, or modify the original spreadsheet. It works with a local copy in the visitor’s browser. Only people with write access to your GitHub repository can publish an update. The website’s built-in workbook download is a snapshot; it is not a synchronized editing copy.

### Which tab owns which information?

| Tab | Fields to maintain |
| --- | --- |
| Sessions | Session ID, title, description, focus areas, tags, primary source URL. The folder field is a fallback for a session with no offering. |
| Offerings | Offering ID, matching Session ID, start/end dates, date status, program, presenter, review flag, notes, source URLs, resource folder URL. |
| Resources | File title, type, archive path, resource URL, Drive ID, and optional session/offering IDs. |

During export, session dates, program lists, offering counts, review flags, and folders are rebuilt from **Offerings**. Cached spreadsheet formulas and the Sessions date summary do not control those exported values. When an offering exists, edit its folder in **Offerings**.

Keep IDs stable. A new session needs an unused Session ID and at least one matching offering, unless it is an undated resource with a folder link on Sessions. A repeat of an existing session needs a new Offering ID and the existing Session ID. The converter displays the next available IDs after a successful check. Do not fill a deleted ID gap with a different session.

Enter dates as actual spreadsheet dates. For one day, use the same start and end. For a known month without a day, leave Start/End blank and enter a Date label beginning with `YYYY-MM`, with Date status `Month only`. For a date without a known year, use Date status `Unknown` and explain it in notes. The website retains uncertainty labels and source notes.

To remove a session, remove its Sessions row and its associated Offerings rows. The converter drops resource references to deleted IDs while keeping the file inventory.

## Files

| File or folder | Purpose |
| --- | --- |
| `index.html` | Searchable session library and session details. |
| `resources.html` | Full resource inventory. |
| `update.html` | Spreadsheet validation and JSON export. |
| `assets/styles.css` | Site colors, typography, and responsive layout. |
| `assets/app.js`, `assets/core.js` | Search, filtering, navigation, and session rendering. |
| `assets/converter.js`, `assets/update.js` | Spreadsheet reading, validation, and export. |
| `assets/logo.png` | Supplied logo, unchanged. |
| `assets/vendor` | Bundled SheetJS reader and its Apache 2.0 license. |
| `data/sessions.json` | Published data read by the public website. |
| `downloads/MTC_Session_Database.xlsx` | Downloadable starting workbook. |
| `tests` | Data, filter, and exporter checks. |

## Local preview and checks

Opening `index.html` by double-clicking is not sufficient because the app reads a separate JSON file and uses JavaScript modules. Serve the folder over HTTP.

With Python installed, run `python -m http.server 8000` from this folder and open `http://localhost:8000`. Alternatively, with Node 20.19+ or 22.12+, run `npm ci`, then `npm run dev` and open the URL printed by Vite. Vite is for local preview only; it is not needed on GitHub Pages.

Run `npm test` with Node installed to check search behavior, the current catalog, spreadsheet conversion, and malformed input. The tests use the included workbook and bundled SheetJS library; no dependency install is needed to run these tests.

## Later move to Modern Campus

The public site is ordinary HTML, CSS, JavaScript, and JSON, with no GitHub-specific runtime features. CSUDH’s web team can place the search interface inside the approved page template, include its CSS/JavaScript, and publish `data/sessions.json` alongside it. Paths may need adjustment to the campus template. Keep the spreadsheet converter separate from the public display if preferred. Campus-specific permissions and template integration have not been tested.

## Data and access

The database summarizes the supplied archive; it is not proof of attendance or that an advertised event occurred. Some dates identify an institute window or have a source conflict. These are labeled in session details. Source documents remain in Google Drive, and their sharing permissions are unchanged.

The site has no analytics, external font requests, login service, or automatic connection to private Drive files. Search runs locally after the public JSON file loads. Files are fetched from the same website; external Drive pages open only when a visitor follows a resource link.

SheetJS Community Edition 0.20.3 is bundled from its official distribution: https://docs.sheetjs.com/docs/getting-started/installation/standalone/

The logo and archive content retain their existing ownership. The included SheetJS license applies only to that third-party library.

## Verification notes

Seven automated checks pass, including workbook round-trip preservation, edited dates, combined filters, and malformed input. Browser checks covered keyword search, co-presenter filtering, pagination, folder links, resource filters, spreadsheet validation, and a 390px-wide layout with no horizontal overflow. The automated browser could not capture the generated download; JSON generation and the download link were verified. The optional WebMCP search registration is feature-detected; this preview browser did not expose a supported registry, so agent-tool execution could not be validated.
