import fetch from "node-fetch";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { validateAndGetCompany } from "./company.js";
import { querySOLR, upsertJobs, upsertCompany } from "./solr.js";

const COMPANY_CIF = "15525700";
const CAREERS_URL = "https://seniorsoftware.ro/cariere/";
const USER_AGENT = "job_seeker_ro_spider";

let COMPANY_NAME = null;

function numericId(url) {
  const hash = crypto.createHash("md5").update(url).digest("hex");
  return parseInt(hash.slice(0, 12), 16);
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
        brand: "Senior Software",
        status: "activ",
        location: address ? [address] : ["București"],
        website: ["https://seniorsoftware.ro"],
        career: ["https://seniorsoftware.ro/cariere/"],
        lastScraped: new Date().toISOString().split('T')[0],
        scraperFile: "https://raw.githubusercontent.com/sebiboga/senior-software-agency-srl-nodejs-scraper/main/.github/workflows/scrape.yml"
      });
    } catch (err) {
      console.log(`Note: Could not upsert company to SOLR core: ${err.message}`);
    }

    console.log(`Fetching jobs from ${CAREERS_URL}...`);
    const html = await fetchPage();
    const rawJobs = parseJobsFromHTML(html);
    const scrapedCount = rawJobs.length;
    console.log(`Jobs scraped from Senior Software: ${scrapedCount}`);

    if (scrapedCount === 0) {
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
