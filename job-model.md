# Job Model

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | ✅ | Unique job URL (used as SOLR `id`) |
| `title` | string | ✅ | Job title |
| `company` | string | ✅ | Company legal name (uppercase) |
| `cif` | string | ✅ | Company CIF |
| `location` | array | ✅ | Array of Romanian city names |
| `tags` | array | ❌ | Array of tag strings |
| `workmode` | string | ❌ | `remote`, `on-site`, or `hybrid` |
| `date` | string | ✅ | ISO 8601 date when scraped |
| `status` | string | ❌ | `scraped` |

## Example

```json
{
  "url": "https://seniorsoftware.ro/cariere/consultant-implementare-xrp-senior/",
  "title": "Consultant Implementare XRP",
  "company": "SENIOR SOFTWARE AGENCY SRL",
  "cif": "15525700",
  "location": ["București"],
  "tags": ["implementare & suport", "full-time"],
  "workmode": "on-site",
  "date": "2026-06-06T10:30:00.000Z",
  "status": "scraped"
}
```
