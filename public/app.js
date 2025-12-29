const loadButton = document.getElementById('load');
const badgesContainer = document.getElementById('badges-container');
const output = document.getElementById('output');

const eventNames = {
  '222': '2x2',
  '333': '3x3',
  '444': '4x4',
  '555': '5x5',
  '666': '6x6',
  '777': '7x7',
  '333oh': '3x3 One-Handed',
  '333bf': '3x3 Blindfolded',
  '444bf': '4x4 Blindfolded',
  '555bf': '5x5 Blindfolded',
  '333mbf': '3x3 Multi-Blind',
  '333fm': 'Fewest Moves',
  'sq1': 'Square-1',
  'minx': 'Megaminx',
  'skewb': 'Skewb',
  'clock': 'Clock',
  'pyram': 'Pyraminx'
};

// Fixed: WCA times are in centiseconds (1/100 second)
function formatTime(centiseconds) {
  if (typeof centiseconds !== 'number' || centiseconds <= 0) return '-';
  const totalSeconds = Math.floor(centiseconds / 100);
  const remainingCentis = centiseconds % 100;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2,'0')}.${remainingCentis.toString().padStart(2,'0')}`;
  } else {
    return `${seconds}.${remainingCentis.toString().padStart(2,'0')}`;
  }
}

loadButton.addEventListener('click', async () => {
  output.innerHTML = 'Laden...';
  badgesContainer.innerHTML = '';

  try {
    const res = await fetch('/data/prs.json');
    const data = await res.json();

    // Badges
    Object.entries(data).forEach(([wcaId, info]) => {
      const badge = document.createElement('div');
      badge.className = 'person-badge';
      badge.innerHTML = `${info.name.toUpperCase()} <span class="pr-count">${info.prs.length}</span>`;
      badge.onclick = () => document.getElementById(`person-${wcaId}`)?.scrollIntoView({ behavior: 'smooth' });
      badgesContainer.appendChild(badge);
    });

    // PR cards
    output.innerHTML = '';
    Object.entries(data).forEach(([wcaId, info]) => {
      const group = document.createElement('div');
      group.className = 'person-group';
      group.id = `person-${wcaId}`;

      info.prs.forEach(pr => {
        const card = document.createElement('a');
        card.className = 'match-card';
        card.href = `https://live.worldcubeassociation.org/competitions/${pr.competitionId}/competitors/${pr.personIntId}`;
        card.target = '_blank';
        card.innerHTML = `
          <div class="match-text">
            <div class="match-header">${info.name} - ${eventNames[pr.event] ?? pr.event} ${formatTime(pr.time)} ${pr.type === 'single' ? 'Single' : 'Average'}</div>
            <div class="match-info">WR: ${pr.wr} · CR: ${pr.cr} · NR: ${pr.nr}</div>
          </div>
          <span class="cubing-icon event-${pr.event} event-icon"></span>
        `;
        group.appendChild(card);
      });

      output.appendChild(group);
    });

  } catch (err) {
    console.error('Fehler beim Laden der PR-Daten:', err);
    output.innerHTML = 'Fehler beim Laden der PR-Daten.';
  }
});
