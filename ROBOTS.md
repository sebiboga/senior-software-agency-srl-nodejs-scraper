# Robots.txt Analysis — Senior Software

Sursa: https://seniorsoftware.ro/robots.txt

## Reguli

Site-ul nu blochează accesul la `/cariere/` în robots.txt.

## Interpretare pentru scraper

| Cale | Accesibil? | Ce conține |
|------|-----------|------------|
| `/cariere/` | ✅ Da | Pagina cu listarea joburilor |
| `/wp-content/` | ⚠️ Parțial | Imagini și resurse (nu sunt necesare pentru scraper) |

## Concluzie

Scraperul face o singură cerere HTTP GET către `/cariere/` pentru a extrage toate joburile. Comportament rezonabil, nu agresiv.
