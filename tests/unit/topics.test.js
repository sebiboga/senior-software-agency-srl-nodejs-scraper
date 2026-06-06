import { jest } from '@jest/globals';

const REQUIRED_TOPICS = ['job-seeker-ro-spider', 'peviitor-ro'];

describe('Repository Topics', () => {
  const REPO = process.env.GITHUB_REPOSITORY || 'sebiboga/senior-software-agency-srl-nodejs-scraper';

  it('must have EXACTLY the 2 required topics', async () => {
    if (!process.env.GITHUB_REPOSITORY) {
      console.log('GITHUB_REPOSITORY not set — running locally, skipping API check');
      return;
    }

    const { default: fetch } = await import('node-fetch');
    const res = await fetch(`https://api.github.com/repos/${REPO}/topics`, {
      headers: {
        'User-Agent': 'job_seeker_ro_spider',
        'Accept': 'application/vnd.github.mercy-preview+json'
      }
    });
    const data = await res.json();
    const topics = data.names || [];

    for (const topic of REQUIRED_TOPICS) {
      expect(topics).toContain(topic);
    }
  });

  it('must NOT have extra topics', async () => {
    if (!process.env.GITHUB_REPOSITORY) {
      console.log('GITHUB_REPOSITORY not set — running locally, skipping API check');
      return;
    }

    const { default: fetch } = await import('node-fetch');
    const res = await fetch(`https://api.github.com/repos/${REPO}/topics`, {
      headers: {
        'User-Agent': 'job_seeker_ro_spider',
        'Accept': 'application/vnd.github.mercy-preview+json'
      }
    });
    const data = await res.json();
    const topics = data.names || [];
    expect(topics.length).toBe(2);
  });
});
