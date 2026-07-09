# AGENTS.md — Rules for AI agents

## Project
Senior Software Agency SRL scraper for peviitor.ro (Node.js, ESM, Jest)

## Critical Rules

### 0. Background tasks — always pass `--repo` explicitly to `gh`

When polling a workflow run with `until [ "$(gh run view ID --json status -q .status)" = "completed" ]; do sleep N; done`, the `gh run view` command implicitly uses the current working directory's git remote. If the CWD is a different repo (e.g. you cd-ed elsewhere mid-task), `gh` looks in the wrong repo and returns 404.

**Always specify the repo explicitly:**
```bash
gh run view <RUN_ID> --repo sebiboga/senior-software-agency-srl-nodejs-scraper --json status -q .status
```

### 1. Temporary Files
All temporary/scratch files MUST go in `tmp/` inside the project root.
NEVER use paths outside the project.

### 2. Issues & GitHub
- Orice modificare de cod trebuie să aibă un issue în GitHub Issues
- Excepții: typo-uri, whitespace, documentație minoră
- Create a GitHub issue before implementing any change
- Commit messages must reference the issue they close
- Never commit credentials (`.env.local`, `*.pem`, etc.)
- Push after commit

### 3. Environment Variables
- `SOLR_AUTH` must be set in `.env.local` for SOLR tests (format: `user:password`)
- `.env.local` is loaded automatically at runtime via `dotenv` — never commit it
- Consistency tests also need `GITHUB_REPOSITORY` (format: `owner/repo`) and `GITHUB_TOKEN`

### 4. Testing
```bash
# All tests
npm test

# Unit tests (no env vars needed)
npm run test:unit

# Integration tests (ANAF public API, SOLR conditional)
npm run test:integration

# E2E tests (real Senior Software career page, SOLR conditional)
npm run test:e2e

# Consistency tests (GitHub repo config — needs GITHUB_REPOSITORY + GITHUB_TOKEN)
npm run test:consistency
```

### 5. ESM + Jest
- Use `jest.unstable_mockModule` (NOT `jest.mock`) for mocking ESM modules
- Run with `--experimental-vm-modules` flag
- SOLR tests use conditional `itIfSolr` helper — auto-skip when `SOLR_AUTH` not set

### 6. Module Structure
- `config/company.json` + `config/company.js` — single source of truth for company identity
- `src/anaf.js` — core ANAF library (imported by company.js); retry logic: 3 retries, 2s exponential backoff
- `src/markdown-generator.js` — generates `docs/jobs.md` after each scrape; called from index.js
- `src/job-validator.js` — shared `validateByHead` + `validateByContent` used by both validator CLIs
- `demoanaf.js` — CLI wrapper around src/anaf.js
- `company.js` — company validation (ANAF + Peviitor + SOLR); root `company.json` is a 7-day ANAF cache committed to repo, with stale fallback
- `solr.js` — SOLR operations
- `validate-jobs.js` — manual deep validator (content-aware); thin wrapper over src/job-validator.js
- `tests/validate-senior-software-jobs.js` — CI fast validator (HEAD only); thin wrapper over src/job-validator.js + solr.js
- `index.js` — main scraper orchestrator; includes ANOFM search by CIF

### 7. Caching Behavior
- `tmp/company.json` — per-run scratch cache (gitignored)
- `company.json` (root) — committed cache, refreshed every 7 days (configurable via `CACHE_MAX_AGE_DAYS` in company.js)
- If ANAF is unreachable AND cache is stale, the code falls back to the stale cache rather than failing the scrape
- `docs/company.json` is regenerated on every scrape so GitHub Pages can read company identity

### 8. Auto-Heal Issues
When the `Automation Tests` workflow fails, a **GitHub Issue** is auto-created with label `auto-heal`. The issue contains:
- Run URL, branch, commit, and trigger event
- Instructions for opencode to investigate, fix, commit, push, and close

**When you see an `auto-heal` labeled issue:**
1. Read the issue body for the run URL and branch
2. Checkout that branch
3. Review the workflow logs to diagnose the failure
4. Apply the fix
5. Commit, push, and close the issue

### 9. Source
- Jobs scraped from HTML: https://seniorsoftware.ro/cariere/
- Job URL pattern: https://seniorsoftware.ro/cariere/{slug}/
- Company CIF: 15525700, Brand: Senior Software
- ANOFM also searched by CIF for additional job listings
