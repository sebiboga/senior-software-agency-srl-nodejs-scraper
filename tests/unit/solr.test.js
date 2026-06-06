import { jest } from '@jest/globals';

describe('solr.js', () => {
  let solr;

  beforeAll(async () => {
    solr = await import('../../solr.js');
  });

  describe('getSolrAuth', () => {
    const ORIGINAL = process.env.SOLR_AUTH;

    afterEach(() => {
      process.env.SOLR_AUTH = ORIGINAL;
    });

    it('should return SOLR_AUTH from environment', () => {
      process.env.SOLR_AUTH = 'test:password';
      expect(solr.getSolrAuth()).toBe('test:password');
    });

    it('should return undefined when not set', () => {
      delete process.env.SOLR_AUTH;
      expect(solr.getSolrAuth()).toBeUndefined();
    });
  });

  describe('querySOLR', () => {
    it('should return empty result when SOLR_AUTH is missing', async () => {
      delete process.env.SOLR_AUTH;
      const result = await solr.querySOLR('15525700');
      expect(result.numFound).toBe(0);
    });
  });
});
