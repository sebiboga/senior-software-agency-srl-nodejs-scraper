# Files

## Core Source Files

| File | Purpose |
|------|---------|
| `index.js` | Main scraper entry point — orchestrates the full pipeline |
| `company.js` | Company validation (ANAF + Peviitor + SOLR) |
| `demoanaf.js` | CLI wrapper for ANAF module |
| `solr.js` | SOLR operations (query, upsert, delete, company) |
| `src/anaf.js` | Core ANAF API module (search + company details) |
| `validate-jobs.js` | CLI tool to validate job URLs |

## Test Files

| File | Purpose |
|------|---------|
| `tests/unit/` | Unit tests with mocked APIs |
| `tests/integration/` | Integration tests (live ANAF, conditional SOLR) |
| `tests/e2e/` | End-to-end tests (full pipeline, real career page) |
| `tests/helpers/` | Test helpers (e.g., `itIfSolr`) |

## Configuration

| File | Purpose |
|------|---------|
| `package.json` | Node.js project config, scripts, dependencies |
| `.gitignore` | Files excluded from version control |
| `.github/workflows/scrape.yml` | Daily scraping workflow |
| `.github/workflows/test.yml` | Test automation on push/PR |
| `.github/workflows/deploy.yml` | GitHub Pages deployment |

## Documentation

| File | Purpose |
|------|---------|
| `README.md` | Project overview and usage |
| `AGENTS.md` | Rules for AI agents |
| `BRANCH.md` | Branch naming conventions |
| `CHANGELOG.md` | Version history |
| `CONTRIBUTING.md` | How to contribute |
| `ISSUES.md` | Issue tracking |
| `PUBLIC.md` | Repository visibility policy |
| `SECURITY.md` | Security policy |
| `TOPICS.md` | GitHub topics policy |
| `UPDATE-REPO-ABOUT.md` | Repo description and topics |
| `instructions.md` | Detailed workflow instructions |
| `ROBOTS.md` | Robots.txt analysis |
| `company-model.md` | Company model schema |
| `job-model.md` | Job model schema |
| `files.md` | This file |
