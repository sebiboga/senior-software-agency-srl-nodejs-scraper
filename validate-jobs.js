import fetch from "node-fetch";
import fs from "fs";

const JOBS_FILE = "tmp/jobs.json";
const USER_AGENT = "job_seeker_ro_spider";

async function validateJobs() {
  if (!fs.existsSync(JOBS_FILE)) {
    console.log("No jobs.json found. Run the scraper first.");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8"));
  const jobs = data.jobs || [];

  if (jobs.length === 0) {
    console.log("No jobs to validate.");
    return;
  }

  console.log(`Validating ${jobs.length} job URLs...\n`);

  let valid = 0;
  let invalid = 0;

  for (const job of jobs.slice(0, 5)) {
    try {
      const res = await fetch(job.url, {
        method: "HEAD",
        headers: { "User-Agent": USER_AGENT }
      });
      if (res.ok) {
        console.log(`  ✓ ${job.title}: ${job.url}`);
        valid++;
      } else {
        console.log(`  ✗ ${job.title}: ${job.url} (HTTP ${res.status})`);
        invalid++;
      }
    } catch (err) {
      console.log(`  ✗ ${job.title}: ${job.url} (${err.message})`);
      invalid++;
    }
  }

  console.log(`\nValid: ${valid}, Invalid: ${invalid}`);
}

validateJobs();
