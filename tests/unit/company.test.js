import { jest } from '@jest/globals';

const MOCK_ANAF_DATA = {
  cui: 15525700,
  name: 'SENIOR SOFTWARE AGENCY SRL',
  inactive: false,
  address: 'B-dul TUDOR VLADIMIRESCU, 45, Sectorul 5, Bucureşti',
  registrationNumber: 'J2003008341409',
  caenCode: '5829',
  vatRegistered: true,
  eFacturaRegistered: true
};

jest.unstable_mockModule('node-fetch', () => ({
  default: jest.fn()
}));

jest.unstable_mockModule('../../src/anaf.js', () => ({
  getCompanyFromANAF: jest.fn()
}));

jest.unstable_mockModule('../../solr.js', () => ({
  querySOLR: jest.fn().mockResolvedValue({ numFound: 0, docs: [] }),
  deleteJobsByCIF: jest.fn()
}));

const { default: fetch } = await import('node-fetch');
const { getCompanyFromANAF } = await import('../../src/anaf.js');

describe('company.js', () => {
  let company;

  beforeAll(async () => {
    company = await import('../../company.js');
  });

  describe('getCompanyBrand', () => {
    it('should return the company brand', () => {
      expect(company.getCompanyBrand()).toBe('Senior Software');
    });
  });

  describe('getCompanyData (no cache)', () => {
    it('should fetch and return company data', async () => {
      getCompanyFromANAF.mockResolvedValue(MOCK_ANAF_DATA);

      const result = await company.getCompanyData();
      expect(result.company).toBe('SENIOR SOFTWARE AGENCY SRL');
      expect(result.cif).toBe('15525700');
      expect(result.active).toBe(true);
    });
  });
});
