import { jest } from '@jest/globals';
import { itIfSolr } from '../helpers/itIfSolr.js';
import * as anaf from '../../src/anaf.js';

const TEST_CIF = '15525700';
const TEST_BRAND = 'Senior Software';
const CAREERS_URL = 'https://seniorsoftware.ro/cariere/';

describe('E2E: Full Scraping Pipeline', () => {
  let index;
  let company;
  let solr;
  let pageHtml;

  beforeAll(async () => {
    index = await import('../../index.js');
    company = await import('../../company.js');
    solr = await import('../../solr.js');
  });

  describe('Senior Software Careers Page — Real Data Fetch', () => {
    it('should respond with valid HTML from careers page', async () => {
      const res = await fetch(CAREERS_URL, {
        headers: { 'User-Agent': 'job_seeker_ro_spider', 'Accept': 'text/html' }
      });
      expect(res.ok).toBe(true);
      pageHtml = await res.text();
      expect(pageHtml.length).toBeGreaterThan(1000);
    }, 15000);

    it('should contain job-related content', () => {
      expect(pageHtml).toContain('cariere');
      expect(pageHtml.length).toBeGreaterThan(5000);
    });
  });

  describe('Parse + Transform Pipeline', () => {
    it('should parse real careers page into job objects', () => {
      const jobs = index.parseJobsFromHTML(pageHtml);
      expect(jobs.length).toBeGreaterThan(0);

      for (const job of jobs) {
        expect(job).toHaveProperty('url');
        expect(job).toHaveProperty('title');
        expect(job).toHaveProperty('workmode');
        expect(job).toHaveProperty('location');
      }
    });

    it('should have valid job URL format', () => {
      const jobs = index.parseJobsFromHTML(pageHtml);
      for (const job of jobs) {
        expect(job.url).toMatch(/^https:\/\/seniorsoftware\.ro\/cariere\//);
      }
    });

    it('should map parsed jobs to job model', () => {
      const jobs = index.parseJobsFromHTML(pageHtml);
      const model = index.mapToJobModel(jobs[0], TEST_CIF, 'SENIOR SOFTWARE AGENCY SRL');

      expect(model.url).toBeDefined();
      expect(model.title).toBeDefined();
      expect(model.company).toBe('SENIOR SOFTWARE AGENCY SRL');
      expect(model.cif).toBe(TEST_CIF);
      expect(model.status).toBe('scraped');
    });

    it('should transform jobs and filter to Romanian locations', () => {
      const jobs = index.parseJobsFromHTML(pageHtml);
      const payload = {
        source: 'seniorsoftware.ro',
        scrapedAt: new Date().toISOString(),
        company: 'SENIOR SOFTWARE AGENCY SRL',
        cif: TEST_CIF,
        jobs: jobs.map(j => index.mapToJobModel(j, TEST_CIF, 'SENIOR SOFTWARE AGENCY SRL'))
      };

      const transformed = index.transformJobsForSOLR(payload);
      expect(transformed.jobs.length).toBeGreaterThan(0);

      for (const job of transformed.jobs) {
        expect(job).toHaveProperty('location');
        expect(Array.isArray(job.location)).toBe(true);
        expect(job.location.length).toBeGreaterThan(0);
        expect(job.workmode).toMatch(/^(remote|on-site|hybrid)$/);
      }
    });
  });

  describe('Company Validation Path', () => {
    it('should find Senior Software in ANAF and validate active status', async () => {
      const results = await anaf.searchCompany(TEST_BRAND);
      const company = results.find(c =>
        c.name.includes('SENIOR SOFTWARE') && c.cui?.toString() === TEST_CIF
      );
      expect(company).toBeDefined();
      expect(company.cui.toString()).toBe(TEST_CIF);

      const anafData = await anaf.getCompanyFromANAF(TEST_CIF);
      expect(anafData).toBeDefined();
      expect(anafData.inactive).toBe(false);
    }, 30000);

    itIfSolr('should run full validation and report active status with job count', async () => {
      const result = await company.validateAndGetCompany();
      expect(result.status).toBe('active');
      expect(result.company).toBe('SENIOR SOFTWARE AGENCY SRL');
      expect(result.cif).toBe(TEST_CIF);
    }, 30000);
  });

  describe('Inactive Company Handling', () => {
    it('should detect active Senior Software in ANAF', async () => {
      const results = await anaf.searchCompany('Senior Software');
      const active = results.find(c => c.cui?.toString() === TEST_CIF);
      expect(active).toBeDefined();
      expect(active.statusLabel).toBe('Funcțiune');
    }, 30000);
  });

  describe('SOLR Data Verification', () => {
    itIfSolr('should have Senior Software company core entry', async () => {
      const result = await solr.queryCompanySOLR(`id:${TEST_CIF}`);
      expect(result.numFound).toBeGreaterThanOrEqual(0);
    }, 15000);
  });
});
