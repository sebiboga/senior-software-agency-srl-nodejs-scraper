import { jest } from '@jest/globals';

describe('Repository Visibility', () => {
  const REPO = process.env.GITHUB_REPOSITORY || 'sebiboga/senior-software-agency-srl-nodejs-scraper';

  it('must be PUBLIC (not private)', async () => {
    if (!process.env.GITHUB_REPOSITORY) {
      console.log('GITHUB_REPOSITORY not set — running locally, skipping API check');
      return;
    }

    const { default: fetch } = await import('node-fetch');
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { 'User-Agent': 'job_seeker_ro_spider', 'Accept': 'application/vnd.github.v3+json' }
    });
    const data = await res.json();
    expect(data.visibility).toBe('public');
  });
});
