import fetch from "node-fetch";

const ANAF_API_URL = "https://demoanaf.ro/api/company/";
const ANAF_SEARCH_URL = "https://demoanaf.ro/api/search";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function searchCompany(brandName) {
  const url = `${ANAF_SEARCH_URL}?q=${encodeURIComponent(brandName)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "job_seeker_ro_spider" }
  });
  if (!res.ok) throw new Error(`ANAF search error: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

export async function getCompanyFromANAF(cui) {
  const url = `${ANAF_API_URL}${cui}`;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "job_seeker_ro_spider" }
      });
      if (!res.ok) throw new Error(`ANAF API error: ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
      throw new Error("Invalid ANAF response");
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      await sleep(RETRY_DELAY_MS);
    }
  }
}
