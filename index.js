import fetch from "node-fetch";
import fs from "fs";
import { fileURLToPath } from "url";
import { validateAndGetCompany } from "./company.js";
import { querySOLR, upsertJobs, upsertCompany } from "./solr.js";
import { generateJobsMarkdown } from "./src/markdown-generator.js";
import companyConfig from "./config/company.js";

const COMPANY_CIF = companyConfig.cif;
const CAREERS_URL = "https://seniorsoftware.ro/cariere/";
const USER_AGENT = "job_seeker_ro_spider";
const TIMEOUT = 10000;

let COMPANY_NAME = null;

async function searchANOFM(cif) {
  const jobs = [];
  try {
    console.log(`Searching ANOFM by CIF: ${cif}`);
    const payload = {
      current: 1,
      rowCount: 250,
      sort: { created_at: "desc" },
      employer_tax_code: cif
    };
    const res = await fetch("https://mediere.anofm.ro/api/entity/vw_public_job_posting", {
      method: "POST",
      timeout: TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.log(`  ANOFM returned ${res.status}`);
      return jobs;
    }
    const data = await res.json();
    for (const row of data.rows || []) {
      const locationParts = (row.address_locality_name || '').split('>').map(s => s.trim());
      const location = locationParts.length > 1 ? locationParts[locationParts.length - 1] : locationParts[0];
      jobs.push({
        url: `https://mediere.anofm.ro/app/module/mediere/job/${row.id}`,
        title: row.occupation,
        location: location ? [location] : undefined,
        source: "ANOFM"
      });
    }
    console.log(`  Found ${jobs.length} jobs on ANOFM`);
  } catch (err) {
    console.log(`  ANOFM error: ${err.message}`);
  }
  return jobs;
}

async function fetchPage() {
  const res = await fetch(CAREERS_URL, {
    headers: { "User-Agent": USER_AGENT, "Accept": "text/html" }
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return await res.text();
}

function parseJobsFromHTML(html) {
  const jobs = [];
  const imgRe = /<img[^>]*src="[^"]*\/(job-[^"]+\.jpg)"[^>]*alt="([^"]*)"[^>]*>/gi;
  const linkRe = /<a[^>]*href="(\/cariere\/[^"]+)"[^>]*>[\s\S]*?Vezi[\s]*detalii[\s\S]*?<\/a>/gi;
  const deptRe = /Departament:<\/strong>\s*([^<]+)/gi;
  const locRe = /Locatii:<\/strong>\s*([^<]+)/gi;
  const tipRe = /Tip:<\/strong>\s*([^<]+)/gi;

  const images = [];
  let m;
  while ((m = imgRe.exec(html)) !== null) {
    const alt = m[2].trim();
    if (alt && !alt.toLowerCase().includes("logo")) images.push(alt);
  }

  const links = [];
  while ((m = linkRe.exec(html)) !== null) {
    links.push(m[1].replace(/\/$/, ''));
  }

  const depts = [];
  while ((m = deptRe.exec(html)) !== null) depts.push(m[1].trim());
  const locs = [];
  while ((m = locRe.exec(html)) !== null) locs.push(m[1].trim());
  const tips = [];
  while ((m = tipRe.exec(html)) !== null) tips.push(m[1].trim());

  const count = Math.min(images.length, links.length, depts.length, locs.length, tips.length);

  for (let i = 0; i < count; i++) {
    const title = images[i];
    const urlPath = links[i];
    const url = urlPath.startsWith("http") ? urlPath : `https://seniorsoftware.ro${urlPath}`;
    const locText = locs[i];
    const department = depts[i];
    const type = tips[i];

    const location = [];
    if (locText.toLowerCase().includes("bucuresti") || locText.toLowerCase().includes("bucureşti")) {
      location.push("București");
    } else if (locText.toLowerCase().includes("cluj")) {
      location.push("Cluj-Napoca");
    } else if (locText) {
      location.push(locText);
    }

    const typeLower = type.toLowerCase();
    let workmode = "on-site";
    if (typeLower.includes("remote")) workmode = "remote";
    else if (typeLower.includes("hybrid")) workmode = "hybrid";

    const deptLower = department.toLowerCase();
    const tags = [];
    if (deptLower) tags.push(deptLower);
    if (typeLower) tags.push(typeLower);

    jobs.push({ url, title, workmode, location, tags });
  }

  return jobs;
}

function mapToJobModel(rawJob, cif, companyName = COMPANY_NAME) {
  const now = new Date().toISOString();
  const job = {
    url: rawJob.url,
    title: rawJob.title,
    company: companyName,
    cif: cif,
    location: rawJob.location?.length ? rawJob.location : ["România"],
    tags: rawJob.tags?.length ? rawJob.tags : undefined,
    workmode: rawJob.workmode || undefined,
    date: now,
    status: "scraped"
  };
  Object.keys(job).forEach(k => job[k] === undefined && delete job[k]);
  return job;
}

function transformJobsForSOLR(payload) {
  const romanianCities = [
    'Bucharest', 'București', 'Cluj-Napoca', 'Cluj Napoca',
    'Timișoara', 'Timisoara', 'Iași', 'Iasi', 'Brașov', 'Brasov',
    'Constanța', 'Constanta', 'Craiova', 'Bacău', 'Sibiu',
    'Târgu Mureș', 'Targu Mures', 'Oradea', 'Baia Mare', 'Satu Mare',
    'Ploiești', 'Ploiesti', 'Pitești', 'Pitesti', 'Arad', 'Galați', 'Galati',
    'Brăila', 'Braila', 'Drobeta-Turnu Severin', 'Râmnicu Vâlcea', 'Ramnicu Valcea',
    'Buzău', 'Buzau', 'Botoșani', 'Botosani', 'Zalău', 'Zalau', 'Hunedoara', 'Deva',
    'Suceava', 'Bistrița', 'Bistrita', 'Tulcea', 'Călărași', 'Calarasi',
    'Giurgiu', 'Alba Iulia', 'Slatina', 'Piatra Neamț', 'Piatra Neamt', 'Roman',
    'Dumbrăvița', 'Dumbravita', 'Voluntari', 'Popești-Leordeni', 'Popesti-Leordeni',
    'Chitila', 'Mogoșoaia', 'Mogosoaia', 'Otopeni'
  ];
  const citySet = new Set(romanianCities.map(c => c.toLowerCase()));

  const normalizeWorkmode = (wm) => {
    if (!wm) return undefined;
    const lower = wm.toLowerCase();
    if (lower.includes('remote')) return 'remote';
    if (lower.includes('office') || lower.includes('on-site') || lower.includes('site')) return 'on-site';
    return 'hybrid';
  };

  const transformed = {
    ...payload,
    company: payload.company?.toUpperCase(),
    jobs: payload.jobs.map(job => {
      const validLocations = (job.location || []).filter(loc => {
        const lower = loc.toLowerCase().trim();
        if (lower === 'romania' || lower === 'românia') return true;
        return citySet.has(lower);
      }).map(loc => loc.toLowerCase() === 'romania' ? 'România' : loc);

      return {
        ...job,
        location: validLocations.length > 0 ? validLocations : ['România'],
        workmode: normalizeWorkmode(job.workmode)
      };
    })
  };

  return transformed;
}

async function main() {
  try {
    console.log("=== Step 1: Get existing jobs count ===");
    const existingResult = await querySOLR(COMPANY_CIF);
    const existingCount = existingResult.numFound;
    console.log(`Found ${existingCount} existing jobs in SOLR`);

    console.log("=== Step 2: Validate company via ANAF ===");
    const { company, cif, address } = await validateAndGetCompany();
    COMPANY_NAME = company;
    const localCif = cif;

    try {
      await upsertCompany({
        id: cif,
        company,
        brand: companyConfig.brand,
        status: "activ",
        location: address ? [address] : [companyConfig.defaultLocation],
        website: [companyConfig.website],
        career: [companyConfig.careerUrl],
        lastScraped: new Date().toISOString().split('T')[0],
        scraperFile: companyConfig.scraperFile
      });
    } catch (err) {
      console.log(`Note: Could not upsert company to SOLR core: ${err.message}`);
    }

    console.log(`Fetching jobs from ${CAREERS_URL}...`);
    const html = await fetchPage();
    const rawJobs = parseJobsFromHTML(html);
    const scrapedCount = rawJobs.length;
    console.log(`Jobs scraped from Senior Software: ${scrapedCount}`);

    const anofmJobs = await searchANOFM(localCif);
    const anofmCount = anofmJobs.length;
    for (const job of anofmJobs) {
      if (!rawJobs.find(j => j.url === job.url)) {
        rawJobs.push(job);
      }
    }
    console.log(`Jobs added from ANOFM: ${anofmCount}`);

    const totalCount = rawJobs.length;
    if (totalCount === 0) {
      console.log("No jobs found — nothing to upsert.");
      return;
    }

    const jobs = rawJobs.map(job => mapToJobModel(job, localCif));

    const payload = {
      source: "seniorsoftware.ro",
      scrapedAt: new Date().toISOString(),
      company: COMPANY_NAME,
      cif: localCif,
      jobs
    };

    console.log("Transforming jobs for SOLR...");
    const transformedPayload = transformJobsForSOLR(payload);
    const validCount = transformedPayload.jobs.filter(j => j.location).length;
    console.log(`Jobs with valid Romanian locations: ${validCount}`);

    fs.mkdirSync("tmp", { recursive: true });
    fs.writeFileSync("tmp/jobs.json", JSON.stringify(transformedPayload, null, 2), "utf-8");
    console.log("Saved tmp/jobs.json");

    const companyData = {
      id: localCif,
      company: transformedPayload.company,
      brand: companyConfig.brand,
      status: "activ",
      location: address ? [address] : [companyConfig.defaultLocation],
      website: [companyConfig.website],
      career: [companyConfig.careerUrl],
      lastScraped: new Date().toISOString().split('T')[0]
    };
    const markdown = generateJobsMarkdown(companyData, transformedPayload.jobs);
    fs.mkdirSync("docs", { recursive: true });
    fs.writeFileSync("docs/jobs.md", markdown, "utf-8");
    console.log("Saved docs/jobs.md");

    fs.writeFileSync("docs/company.json", JSON.stringify(companyConfig, null, 2), "utf-8");
    console.log("Saved docs/company.json");

    console.log("\n=== Step 3: Upsert jobs to SOLR ===");
    await upsertJobs(transformedPayload.jobs);

    const finalResult = await querySOLR(COMPANY_CIF);
    console.log(`\n=== SUMMARY ===`);
    console.log(`Jobs existing in SOLR before scrape: ${existingCount}`);
    console.log(`Jobs scraped from Senior Software: ${scrapedCount}`);
    console.log(`Jobs in SOLR after scrape: ${finalResult.numFound}`);
    console.log(`================`);

    console.log("\n=== DONE ===");
    console.log("Scraper completed successfully!");

  } catch (err) {
    console.error("Scraper failed:", err);
    process.exit(1);
  }
}

export { parseJobsFromHTML, mapToJobModel, transformJobsForSOLR };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
