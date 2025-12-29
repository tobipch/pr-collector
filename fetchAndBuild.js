import fs from 'fs/promises';

const API = 'https://www.worldcubeassociation.org/api/v0';

const DAYS = 31;

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url}`);
  return res.json();
}

(async function run() {
  const end = formatDate(new Date());
  const start = formatDate(new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000));

  // 1. competitions
  let page = 1;
  let competitions = [];

  while (true) {
    const data = await fetchJson(
      `${API}/competitions?sort=start_date&start=${start}&end=${end}&page=${page}`
    );
    if (!data.length) break;
    competitions.push(...data.filter(c => c.results_posted_at));
    page++;
  }

  // 2. results (CH only)
  const compResults = {};
  const wcaIds = new Set();

  for (const comp of competitions) {
    const results = await fetchJson(`${API}/competitions/${comp.id}/results`);
    const ch = results.filter(r => r.country_iso2 === 'CH');
    compResults[comp.id] = ch;
    ch.forEach(r => wcaIds.add(r.wca_id));
  }

  // 3. persons
  const persons = {};
  for (const wcaId of wcaIds) {
    persons[wcaId] = await fetchJson(`${API}/persons/${wcaId}`);
  }

  // 4. detect PRs
  const personPRs = {};

  for (const compId in compResults) {
    for (const r of compResults[compId]) {
      const person = persons[r.wca_id];
      if (!person) continue;

      const prEvent = person.personal_records?.[r.event_id];

      // Average PR
      const prevAvg = prEvent?.average?.best ?? Infinity;
      if (r.average > 0 && r.average <= prevAvg) {
        personPRs[r.wca_id] ??= { name: person.person.name, prs: [] };
        personPRs[r.wca_id].prs.push({
          type: 'average',
          event: r.event_id,
          time: r.average,
          competitionId: compId,
          personIntId: r.id,
          wr: prEvent?.average?.world_rank ?? '-',
          cr: prEvent?.average?.continent_rank ?? '-',
          nr: prEvent?.average?.country_rank ?? '-'
        });
      }

      // Single PR
      const prevSingle = prEvent?.single?.best ?? Infinity;
      if (r.best > 0 && r.best <= prevSingle) {
        personPRs[r.wca_id] ??= { name: person.person.name, prs: [] };
        personPRs[r.wca_id].prs.push({
          type: 'single',
          event: r.event_id,
          time: r.best,
          competitionId: compId,
          personIntId: r.id,
          wr: prEvent?.single?.world_rank ?? '-',
          cr: prEvent?.single?.continent_rank ?? '-',
          nr: prEvent?.single?.country_rank ?? '-'
        });
      }
    }
  }

  await fs.mkdir('data', { recursive: true });
  await fs.writeFile('data/prs.json', JSON.stringify(personPRs, null, 2));

  console.log('✅ PR data updated');
})();
