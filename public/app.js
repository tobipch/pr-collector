const loadButton = document.getElementById('load');
const badgesContainer = document.getElementById('badges-container');
const output = document.getElementById('output');

loadButton.addEventListener('click', async () => {
  output.innerHTML = 'Laden...';
  badgesContainer.innerHTML = '';

  let competitions = [];
  try {
    const res = await fetch('/api/competitions');
    competitions = await res.json();
  } catch (e) {
    console.warn('Fehler beim Laden der Competitions', e);
    output.innerHTML = 'Fehler beim Laden der Daten.';
    return;
  }

  const wcaIds = new Set();
  competitions.forEach(c => c.results.forEach(r => wcaIds.add(r.wca_id)));

  const persons = {};
  competitions.forEach(c => {
    c.results.forEach(r => {
      persons[r.wca_id] = {
        person: { name: r.name ?? r.wca_id },
        personal_records: r.personal_records ?? {}
      };
    });
  });

  const personPRs = {};

  competitions.forEach(c => {
    c.results.forEach(r => {
      const person = persons[r.wca_id];
      if (!person) return;
      const prEvent = r.personal_records?.[r.event_id] ?? {};

      const prevAvg = prEvent?.average?.best ?? Infinity;
      if (r.average && r.average > 0 && r.average <= prevAvg) {
        if (!personPRs[r.wca_id]) personPRs[r.wca_id] = [];
        personPRs[r.wca_id].push({
          type: 'average',
          event: r.event_id,
          time: r.average,
          competitionId: c.competitionId,
          personIntId: r.personIntId,
          wr: prEvent?.average?.world_rank ?? '-',
          cr: prEvent?.average?.continent_rank ?? '-',
          nr: prEvent?.average?.country_rank ?? '-'
        });
      }

      const prevSingle = prEvent?.single?.best ?? Infinity;
      if (r.best && r.best > 0 && r.best <= prevSingle) {
        if (!personPRs[r.wca_id]) personPRs[r.wca_id] = [];
        personPRs[r.wca_id].push({
          type: 'single',
          event: r.event_id,
          time: r.best,
          competitionId: c.competitionId,
          personIntId: r.personIntId,
          wr: prEvent?.single?.world_rank ?? '-',
          cr: prEvent?.single?.continent_rank ?? '-',
          nr: prEvent?.single?.country_rank ?? '-'
        });
      }
    });
  });

  // Badges
  Object.entries(personPRs).forEach(([wcaId, prs]) => {
    const badge = document.createElement('div');
    badge.className = 'person-badge';
    badge.innerHTML = `${persons[wcaId].person.name.toUpperCase()} <span class="pr-count">${prs.length}</span>`;
    badge.onclick = () => document.getElementById(`person-${wcaId}`)?.scrollIntoView({ behavior: 'smooth' });
    badgesContainer.appendChild(badge);
  });

  output.innerHTML = '';

  // PR Cards
  Object.entries(personPRs).forEach(([wcaId, prs]) => {
    const group = document.createElement('div');
    group.className = 'person-group';
    group.id = `person-${wcaId}`;

    prs.forEach(pr => {
      const card = document.createElement('a');
      card.className = 'match-card';
      card.href = `https://live.worldcubeassociation.org/competitions/${pr.competitionId}/competitors/${pr.personIntId}`;
      card.target = '_blank';
      card.innerHTML = `
        <div class="match-text">
          <div class="match-header">${persons[wcaId].person.name} - ${eventNames[pr.event] ?? pr.event} ${formatTime(pr.time)} ${pr.type === 'single' ? 'Single' : 'Average'}</div>
          <div class="match-info">WR: ${pr.wr} · CR: ${pr.cr} · NR: ${pr.nr}</div>
        </div>
        <span class="cubing-icon event-${pr.event} event-icon"></span>`;
      group.appendChild(card);
    });

    output.appendChild(group);
  });
});
