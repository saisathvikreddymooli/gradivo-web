# Curated opportunities (optional, hand-verified only)

Drop real, manually verified entries here as JSON files. Each file holds an
array (or `{ "opportunities": [...] }`) using the same field names as
`public/data/opportunities.json`. Every entry MUST have real `sourceName`,
`sourceUrl`, and `applicationUrl` values — entries without them are dropped
by the sync, never published.

Example (`hackathon-example.json` — replace with a real listing):

```json
[
  {
    "id": "unstop-abc123",
    "type": "hackathon",
    "title": "Real Hackathon Name",
    "organization": "Real Organizer",
    "location": "Bangalore, Karnataka",
    "city": "Bangalore",
    "state": "Karnataka",
    "mode": "Hybrid",
    "deadline": "2026-11-01",
    "eventDate": "2026-11-08",
    "sourceName": "Unstop",
    "sourceUrl": "https://unstop.com/real-event-page",
    "applicationUrl": "https://unstop.com/real-event-page",
    "isActive": true
  }
]
```

Hackathon sources with no stable public API (Devpost, MLH, Unstop,
official organizer pages) can only be added this way: a human verifies
the page and commits the link. Never commit unverified or invented links.
