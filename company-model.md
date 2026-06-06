# Company Model

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | CIF (CUI) as string |
| `company` | string | ✅ | Company legal name |
| `brand` | string | ❌ | Brand name |
| `group` | string | ❌ | Group name |
| `status` | string | ❌ | `activ`, `suspendat`, `inactiv`, or `radiat` |
| `location` | array | ❌ | Array of location strings |
| `website` | array | ❌ | Array of website URLs |
| `career` | array | ❌ | Array of career page URLs |
| `lastScraped` | string | ❌ | ISO date string |
| `scraperFile` | string | ❌ | URL to the workflow file |

## Example

```json
{
  "id": "15525700",
  "company": "SENIOR SOFTWARE AGENCY SRL",
  "brand": "Senior Software",
  "status": "activ",
  "location": ["București Sectorul 5, Bucureşti"],
  "website": ["https://seniorsoftware.ro"],
  "career": ["https://seniorsoftware.ro/cariere/"],
  "lastScraped": "2026-06-06",
  "scraperFile": "https://raw.githubusercontent.com/sebiboga/senior-software-agency-srl-nodejs-scraper/main/.github/workflows/scrape.yml"
}
```
