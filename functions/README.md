# Gradivo Functions (server-side)

Scheduled jobs for Gradivo. Secrets stay here, never in the web app.

## Implemented: daily Greenhouse internship sync

`src/sync.ts` (pure logic) + `src/index.ts` (`syncOpportunities`,
`onSchedule("every 24 hours")`):

- Reads board tokens from Firestore doc `config/opportunitySources`
  (`{ greenhouseTokens: ["acme", ...] }`). Empty/missing → honest no-op.
- Fetches each board's published jobs (`?content=true`, public, no key).
- Keeps ONLY genuine internships (standalone "intern", never "internal";
  normal jobs are never converted).
- Keeps India-linked and explicit remote-India roles; real company name
  from the board endpoint; real `absolute_url` as source + application URL;
  real `application_deadline` when the board provides one.
- Writes normalized records to `opportunities/{greenhouse:<token>:<id>}`
  and marks previously synced records that vanished as `isActive: false`.
- Failures per board/job are logged and skipped — never fake data.

The web app (`src/services/opportunityService.ts`) already reads the
`opportunities` collection, so synced internships appear on the
Opportunities page and Home alert with zero UI changes.

## Deploy

```bash
cd functions && npm install
firebase deploy --only functions,firestore:rules
```

## Configure sources (no redeploy needed)

In the Firebase console, create document `config/opportunitySources`:

```json
{ "greenhouseTokens": ["stripe", "project44", "graphcore-early-careers", "groww"] }
```

Tokens are the `<token>` in `boards.greenhouse.io/<token>` career pages.

## Suggested future sources (verify current terms before use)

- **Adzuna API** — needs `ADZUNA_APP_ID` + `ADZUNA_APP_KEY`; store as
  Secret Manager secrets (`defineSecret`) in a new scheduled job here.
- **Lever / Ashby public postings** — same no-key pattern as Greenhouse.
- **Remotive** — remote-only, only if current terms cover your use.
- **Hackathons (Devpost / MLH / Unstop / organizer pages)** — no stable
  public JSON API; add curated entries linking to official registration.

Forbidden: LinkedIn/Internshala/Naukri scraping, bypassing auth /
CAPTCHA / rate limits / robots rules, inventing listings.
