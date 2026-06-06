import { jest } from '@jest/globals';

const HTML_FIXTURE = `<!DOCTYPE html>
<html><body>
<div class="elementor-element e-con-full">
  <img src="https://cdn.net/job-consultant-implementare-xrp.jpg" alt="Consultant Implementare XRP">
  <div class="elementor-widget-text-editor">
    <p><strong>Departament:</strong> Implementare & Suport<br><strong>Locatii:</strong> Bucuresti <br><strong>Tip:</strong> Full-time</p>
  </div>
  <a href="/cariere/consultant-implementare-xrp-senior/" class="elementor-button"><span class="elementor-button-text">Vezi detalii</span></a>
</div>
<div class="elementor-element e-con-full">
  <img src="https://cdn.net/job-sales-account-manager_1.jpg" alt="Account Manager">
  <div class="elementor-widget-text-editor">
    <p><strong>Departament:</strong> Vanzari<br><strong>Locatii:</strong> Cluj <br><strong>Tip:</strong> Full-time</p>
  </div>
  <a href="/cariere/account-manager/" class="elementor-button"><span class="elementor-button-text">Vezi detalii</span></a>
</div>
</body></html>`;

describe('index.js Component Tests', () => {
  let index;

  beforeAll(async () => {
    jest.unstable_mockModule('node-fetch', () => ({
      default: jest.fn()
    }));
    index = await import('../../index.js');
  });

  describe('parseJobsFromHTML', () => {
    it('should parse jobs from HTML fixture', () => {
      const jobs = index.parseJobsFromHTML(HTML_FIXTURE);
      expect(jobs.length).toBe(2);
    });

    it('should extract job titles from image alt text', () => {
      const jobs = index.parseJobsFromHTML(HTML_FIXTURE);
      expect(jobs[0].title).toContain('Consultant Implementare');
      expect(jobs[1].title).toContain('Account');
    });

    it('should extract URLs from Vezi detalii links', () => {
      const jobs = index.parseJobsFromHTML(HTML_FIXTURE);
      expect(jobs[0].url).toContain('consultant-implementare-xrp-senior');
      expect(jobs[1].url).toContain('account-manager');
    });

    it('should extract locations from text-editor', () => {
      const jobs = index.parseJobsFromHTML(HTML_FIXTURE);
      expect(jobs[0].location).toContain('București');
      expect(jobs[1].location).toContain('Cluj-Napoca');
    });

    it('should set workmode from job type', () => {
      const jobs = index.parseJobsFromHTML(HTML_FIXTURE);
      expect(jobs[0].workmode).toBe('on-site');
      expect(jobs[1].workmode).toBe('on-site');
    });

    it('should return empty array for empty HTML', () => {
      const jobs = index.parseJobsFromHTML('<html></html>');
      expect(jobs).toEqual([]);
    });
  });

  describe('mapToJobModel', () => {
    it('should map raw job to job model format', () => {
      const raw = {
        url: 'https://seniorsoftware.ro/cariere/test/',
        title: 'Test Job',
        workmode: 'on-site',
        location: ['București'],
        tags: ['it']
      };
      const result = index.mapToJobModel(raw, '15525700', 'SENIOR SOFTWARE AGENCY SRL');
      expect(result.url).toBe(raw.url);
      expect(result.title).toBe(raw.title);
      expect(result.company).toBe('SENIOR SOFTWARE AGENCY SRL');
      expect(result.cif).toBe('15525700');
      expect(result.status).toBe('scraped');
      expect(result.location).toEqual(['București']);
    });

    it('should remove undefined fields', () => {
      const raw = {
        url: 'https://seniorsoftware.ro/cariere/test/',
        title: 'Test Job',
        workmode: undefined,
        location: ['București'],
        tags: undefined
      };
      const result = index.mapToJobModel(raw, '15525700', 'TEST');
      expect(result.workmode).toBeUndefined();
      expect(result.tags).toBeUndefined();
    });
  });

  describe('transformJobsForSOLR', () => {
    it('should keep company uppercase', () => {
      const payload = {
        company: 'senior software agency srl',
        jobs: [{
          url: 'https://seniorsoftware.ro/cariere/test/',
          title: 'Test',
          location: ['București'],
          workmode: 'on-site'
        }]
      };
      const result = index.transformJobsForSOLR(payload);
      expect(result.company).toBe('SENIOR SOFTWARE AGENCY SRL');
    });

    it('should normalize workmode values', () => {
      const payload = {
        company: 'TEST',
        jobs: [
          { url: 'https://ex.com/1', title: 'Remote', location: ['București'], workmode: 'remote' },
          { url: 'https://ex.com/2', title: 'On-site', location: ['București'], workmode: 'on-site' },
          { url: 'https://ex.com/3', title: 'Hybrid', location: ['București'], workmode: 'hybrid' }
        ]
      };
      const result = index.transformJobsForSOLR(payload);
      expect(result.jobs[0].workmode).toBe('remote');
      expect(result.jobs[1].workmode).toBe('on-site');
      expect(result.jobs[2].workmode).toBe('hybrid');
    });

    it('should handle empty jobs array', () => {
      const result = index.transformJobsForSOLR({ company: 'TEST', jobs: [] });
      expect(result.jobs).toEqual([]);
    });
  });
});
