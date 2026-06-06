# Instructions

## Project Purpose

This scraper extracts job listings from Senior Software's careers page and imports them to peviitor.ro.

Target: https://seniorsoftware.ro/cariere/

## Model Schemas

The job and company models are defined in:
- `job-model.md` - Job model schema
- `company-model.md` - Company model schema

## Important

These models are **dynamic** and can change over time. They are based on the official Peviitor Core schemas which may be updated.

## How to Keep Models Updated

When working on this scraper:

1. **Check for updates** in the Peviitor Core repository
2. Compare with current job-model.md and company-model.md
3. Update local files if there are differences
4. Update index.js mapping logic if field requirements changed

## Technologies

- **Node.js & JavaScript** - For scraping and data extraction
- **Apache SOLR** - For data storage and indexing
- **OpenCode + Big Pickle** - For development

## Workflow Steps

1. **Start with brand** - We know the brand (e.g., "Senior Software")
2. **Search in DemoANAF** - Find company by brand, get CIF from search results
3. **Get company details from ANAF** - Using CIF, fetch full company data from ANAF
4. **Validate with Peviitor** - Verify company exists in Peviitor, get group/brand info
5. **Check existing jobs in SOLR** - Query SOLR by CIF to see what jobs already exist
6. **Check company status** - If ANAF status = "inactive" → DELETE existing jobs from SOLR and STOP
7. **Save company.json** - Save all ANAF + Peviitor data for backup
8. **Scrape new jobs** - Extract jobs from HTML careers page
9. **Transform for SOLR** - Validate and fix job data
10. **Upsert to SOLR** - Import/update jobs in SOLR
11. **Verify URLs** - Check existing job URLs still work, delete 404s

## Running the Scraper

```bash
export SOLR_AUTH=your-solr-credentials
node index.js
```

## Full Workflow (automatic)

When running `node index.js`:
1. Check existing jobs count in SOLR
2. Validate company via ANAF
3. Scrape jobs from HTML careers page
4. Transform for SOLR (filter Romanian locations, normalize fields)
5. Upsert to SOLR (SOLR handles duplicates by URL)
6. Show Summary

## API Endpoints

- **DemoANAF Search**: `https://demoanaf.ro/api/search?q=BRAND`
- **DemoANAF Company**: `https://demoanaf.ro/api/company/:cui`
- **Peviitor API**: `https://api.peviitor.ro/v1/company/`
- **Senior Software Careers**: `https://seniorsoftware.ro/cariere/`
- **Solr**: `https://solr.peviitor.ro/solr/job`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SOLR_AUTH` | SOLR credentials in format `user:password` |

## Standalone Commands

```bash
node solr.js <CIF>
node solr.js extract <CIF>
node solr.js company <search_term>
node demoanaf.js <CIF>
node demoanaf.js search <brand>
```

## Testing

1. **Unit Tests** - Test individual modules in isolation
2. **Integration Tests** - Test API interactions (ANAF, Peviitor, SOLR)
3. **E2E Tests** - Test full workflow

Run tests: `npm test`

## Temporary Files

All temporary/scratch files must be placed in `tmp/` inside the project root.
