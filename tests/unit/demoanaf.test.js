import { jest } from '@jest/globals';

jest.unstable_mockModule('node-fetch', () => ({
  default: jest.fn()
}));

const { default: fetch } = await import('node-fetch');

describe('src/anaf.js', () => {
  let anaf;

  beforeAll(async () => {
    anaf = await import('../../src/anaf.js');
  });

  describe('searchCompany', () => {
    it('should return array of companies for valid brand', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ name: 'SENIOR SOFTWARE AGENCY SRL', cui: 15525700 }] })
      });
      const results = await anaf.searchCompany('Senior Software');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent brand', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] })
      });
      const results = await anaf.searchCompany('NonexistentBrandXYZ');
      expect(results).toEqual([]);
    });
  });

  describe('getCompanyFromANAF', () => {
    it('should return company data for valid CIF', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { cui: 15525700, name: 'SENIOR SOFTWARE AGENCY SRL' } })
      });
      const data = await anaf.getCompanyFromANAF(15525700);
      expect(data.cui).toBe(15525700);
      expect(data.name).toBe('SENIOR SOFTWARE AGENCY SRL');
    });
  });
});
