import fetch from "node-fetch";
import fs from "fs";
import { loadEnvFile } from "node:process";

const SOLR_URL = "https://solr.peviitor.ro/solr/job/select";
const SOLR_UPDATE_URL = "https://solr.peviitor.ro/solr/job/update";
const SOLR_COMPANY_URL = "https://solr.peviitor.ro/solr/company/update";
const USER_AGENT = "job_seeker_ro_spider";

try { loadEnvFile(".env.local"); } catch { }

export function getSolrAuth() {
  return process.env.SOLR_AUTH;
}

function getAuthHeaders() {
  const auth = getSolrAuth();
  if (!auth) return {};
  const encoded = Buffer.from(auth).toString("base64");
  return { Authorization: `Basic ${encoded}` };
}

export async function querySOLR(cif) {
  const auth = getSolrAuth();
  if (!auth) {
    console.log("SOLR_AUTH not set — skipping SOLR query");
    return { numFound: 0, docs: [] };
  }
  const params = new URLSearchParams({
    q: `cif:${cif}`,
    rows: "0",
    wt: "json"
  });
  const res = await fetch(`${SOLR_URL}?${params}`, {
    headers: { "User-Agent": USER_AGENT, ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error(`SOLR query error: ${res.status}`);
  const data = await res.json();
  return { numFound: data.response?.numFound || 0, docs: data.response?.docs || [] };
}

export async function queryCompanySOLR(query) {
  const auth = getSolrAuth();
  if (!auth) {
    console.log("SOLR_AUTH not set — skipping SOLR company query");
    return { numFound: 0, docs: [] };
  }
  const params = new URLSearchParams({
    q: query,
    rows: "1",
    wt: "json"
  });
  const res = await fetch(`https://solr.peviitor.ro/solr/company/select?${params}`, {
    headers: { "User-Agent": USER_AGENT, ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error(`SOLR company query error: ${res.status}`);
  const data = await res.json();
  return { numFound: data.response?.numFound || 0, docs: data.response?.docs || [] };
}

export async function deleteJobsByCIF(cif) {
  const auth = getSolrAuth();
  if (!auth) throw new Error("SOLR_AUTH not set");
  const body = JSON.stringify({ delete: { query: `cif:${cif}` } });
  const params = new URLSearchParams({ commit: "true", wt: "json" });
  const res = await fetch(`${SOLR_UPDATE_URL}?${params}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
      ...getAuthHeaders()
    },
    body
  });
  if (!res.ok) throw new Error(`SOLR delete error: ${res.status}`);
  const data = await res.json();
  console.log(`Deleted ${data.response?.numFound || 0} jobs for CIF ${cif}`);
  return data;
}

export async function upsertJobs(jobs) {
  const auth = getSolrAuth();
  if (!auth) throw new Error("SOLR_AUTH not set");
  const body = JSON.stringify(jobs);
  const params = new URLSearchParams({ commit: "true", overwrite: "true", wt: "json" });
  const res = await fetch(`${SOLR_UPDATE_URL}?${params}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
      ...getAuthHeaders()
    },
    body
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`SOLR upsert error: ${res.status} - ${errText.substring(0, 1000)}`);
  }
  const data = await res.json();
  console.log(`Upserted ${jobs.length} jobs to SOLR.`);
  return data;
}

export async function upsertCompany(companyData) {
  const auth = getSolrAuth();
  if (!auth) throw new Error("SOLR_AUTH not set");
  const body = JSON.stringify([{ ...companyData, id: companyData.id }]);
  const params = new URLSearchParams({ commit: "true", overwrite: "true", wt: "json" });
  const res = await fetch(`${SOLR_COMPANY_URL}?${params}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
      ...getAuthHeaders()
    },
    body
  });
  if (!res.ok) throw new Error(`SOLR company upsert error: ${res.status}`);
  const data = await res.json();
  console.log("Company upserted to SOLR company core.");
  return data;
}
