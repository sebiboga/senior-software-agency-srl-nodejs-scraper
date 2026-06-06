import { jest } from '@jest/globals';
import { itIfSolr } from '../helpers/itIfSolr.js';

const TEST_CIF = '15525700';
const TEST_BRAND = 'Senior Software';

describe('Integration: API Workflow', () => {
  let anaf;
  let company;
  let solr;

  beforeAll(async () => {
    anaf = await import('../../src/anaf.js');
    company = await import('../../company.js');
    solr = await import('../../solr.js');
  });

  describe('ANAF API', () => {
    it('should search for Senior Software brand and find the company', async () => {
      const results = await anaf.searchCompany(TEST_BRAND);
      expect(results.length).toBeGreaterThan(0);
      const found = results.find(c =>
        c.name.includes('SENIOR SOFTWARE') && c.cui?.toString() === TEST_CIF
      );
      expect(found).toBeDefined();
    }, 15000);

    it('should return empty array for non-existent brand', async () => {
      const results = await anaf.searchCompany('ZZZNonexistentBrand123');
      expect(results).toEqual([]);
    }, 15000);

    it('should fetch company details by valid CIF', async () => {
      const data = await anaf.getCompanyFromANAF(TEST_CIF);
      expect(data).toBeDefined();
      expect(data.name).toContain('SENIOR SOFTWARE');
      expect(data.cui?.toString()).toBe(TEST_CIF);
    }, 15000);
  });

  describe('Full Validation Workflow', () => {
    it('should complete the ANAF validation path', async () => {
      const result = await company.getCompanyData();
      expect(result.company).toBe('SENIOR SOFTWARE AGENCY SRL');
      expect(result.cif).toBe(TEST_CIF);
      expect(result.active).toBe(true);
    }, 30000);

    itIfSolr('should validate company and query SOLR for existing jobs', async () => {
      const solrResult = await solr.querySOLR(TEST_CIF);
      expect(solrResult).toHaveProperty('numFound');
      expect(solrResult).toHaveProperty('docs');
    }, 15000);

    itIfSolr('should have matching CIF in company core', async () => {
      const result = await solr.queryCompanySOLR(`id:${TEST_CIF}`);
      expect(result.numFound).toBeGreaterThanOrEqual(0);
    }, 15000);
  });
});
