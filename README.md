# job_seeker_ro_spider — Senior Software Agency SRL Scraper

[![WebScraper Senior Software to Peviitor](https://github.com/sebiboga/senior-software-agency-srl-nodejs-scraper/actions/workflows/scrape.yml/badge.svg)](https://github.com/sebiboga/senior-software-agency-srl-nodejs-scraper/actions/workflows/scrape.yml)
[![Automation Tests](https://github.com/sebiboga/senior-software-agency-srl-nodejs-scraper/actions/workflows/test.yml/badge.svg)](https://github.com/sebiboga/senior-software-agency-srl-nodejs-scraper/actions/workflows/test.yml)
[![JavaScript](https://img.shields.io/badge/javascript-ESM-F7DF1E?logo=javascript&logoColor=black)](https://ecma-international.org/)
[![Node.js](https://img.shields.io/badge/node-24-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

**job_seeker_ro_spider** — un scraper pentru job-urile Senior Software din România. Extrage anunțurile de pe pagina de cariere și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul SOLR.

## Features

- Extrage job-uri din pagina HTML de cariere: https://seniorsoftware.ro/cariere/
- Validează compania via ANAF (CIF 15525700, status activ/inactiv)
- Cross-validează cu Peviitor API
- Stochează în SOLR (job core + company core)
- GitHub Actions: scrape zilnic + testare automată (unit, integration, e2e)
- Teste SOLR condiționale — auto-skip când `SOLR_AUTH` nu e setat

## Project Structure

```
├── index.js           # Main scraper entry point
├── company.js         # Company validation via ANAF + Peviitor + SOLR
├── demoanaf.js        # CLI wrapper for src/anaf.js
├── src/anaf.js        # ANAF API core module (search + company details)
├── solr.js            # SOLR operations (query, upsert, delete, company)
├── validate-jobs.js   # Job URL validator CLI
├── tests/             # Test suite
│   ├── unit/          # Unit tests (mocked APIs)
│   ├── integration/   # Integration tests (ANAF + SOLR live)
│   └── e2e/           # E2E tests (full pipeline, real career page)
├── .github/workflows/
│   ├── scrape.yml     # Daily scraping at 6 AM UTC
│   ├── test.yml       # Automation Tests on push/PR
│   └── deploy.yml     # GitHub Pages deployment
└── docs/index.html    # Live job board (GitHub Pages)
```

## Setup

```bash
npm install
export SOLR_AUTH="username:password"
```

## Usage

```bash
npm run scrape
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
```

## Source

- **Careers page**: https://seniorsoftware.ro/cariere/
- **Companie**: SENIOR SOFTWARE AGENCY SRL (CIF 15525700)
- **Brand**: Senior Software
- **User-Agent**: `job_seeker_ro_spider`

## License

Copyright (c) 2024-2026 BOGA SEBASTIAN-NICOLAE
Licensed under the [MIT License](LICENSE).

## Managed By

This project is managed by [ASOCIATIA OPORTUNITATI SI CARIERE](https://oportunitatisicariere.ro) and used as a web scraper for the [peviitor.ro](https://peviitor.ro) job board project.
