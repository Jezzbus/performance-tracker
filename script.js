const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ9YnXKGt3I1uXjQprT1UfhVFL7tXW_pWwsJI0CfQdE-vAGVxl8vtaKcK1WMvtl4-RUu9gurcs8p8m1/pub?gid=0&single=true&output=csv';

let kpChartInstance = null;
let killsChartInstance = null;

async function fetchSheetData() {
  try {
    const res = await fetch(sheetURL);
    const csv = await res.text();
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
    const headers = parsed.meta.fields;
    const rows = parsed.data;

    renderSummary(rows, headers);
    renderTable(headers, rows);
    renderCharts(headers, rows);
    enableSearch();
  } catch (err) {
    console.error("Error loading sheet:", err);
    document.getElementById('tableContainer').innerHTML =
      `<p style="color:red">⚠️ Failed to load data. Check your sheet link.</p>`;
  }
}

function parseNumber(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/,/g, '').trim()) || 0;
}

function renderSummary(rows, headers) {
  const killsCol = headers.find(h => /total kills/i.test(h));
  const deadsCol = headers.find(h => /total deads/i.test(h));
  const t4Col = headers.find(h => /T4/i.test(h));
  const t5Col = headers.find(h => /T5/i.test(h));

  let totalKills = 0, totalDeads = 0, totalKP = 0;

  rows.forEach(r => {
    totalKills += parseNumber(r[killsCol]);
    totalDeads += parseNumber(r[deadsCol]);
    totalKP += parseNumber(r[t4Col]) + parseNumber(r[t5Col]);
  });

  document.getElementById('totalKills').innerText = totalKills.toLocaleString();
  document.getElementById('totalDeads').innerText = totalDeads.toLocaleString();
  document.getElementById('totalKP').innerText = totalKP.toLocaleString();
}

function renderTable(headers, rows) {
  const colsToShow = [...Array(14).keys()].concat([17]); // cols 1–14 + 18

  let html = '<table><thead><tr>';
  colsToShow.forEach(i => {
    let header = headers[i];
    if (i === 17) header += ' (%)';
    html += `<th>${header}</th>`;
  });
  html += '</tr></thead><tbody>';

  rows.forEach(r => {
    html += '<tr>';
    colsToShow.forEach(i => {
      let cell = r[headers[i]] || '';
      if (i === 17) {
        const num = parseNumber(cell);
        cell = (num * 100).toFixed(2) + '%';
      } else {
        const num = parseNumber(cell);
        if (!isNaN(num)) cell = num.toLocaleString();
      }
      html += `<td>${cell}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  document.getElementById('tableContainer').innerHTML = html;
}

function renderCharts(headers, rows) {
  const dateCol = headers[0];
  const t4Col = headers.find(h => /T4/i.test(h));
  const t5Col = headers.find(h => /T5/i.test(h));
  const killsCol = headers.find(h => /total kills/i.test(h));

  const labels = rows.map(r => r[dateCol]);
  const kpData = rows.map(r => parseNumber(r[t4Col]) + parseNumber(r[t5Col]));
  const killsData = rows.map(r => parseNumber(r[killsCol]));

  if (kpChartInstance) kpChartInstance.destroy();
  const ctxKP = document.getElementById('kpChart').getContext('2d');
  kpChartInstance = new Chart(ctxKP, {
    type: 'line',
    data: { labels, datasets: [{ label: 'KP gained (T4+T5)', data: kpData, borderColor: 'blue', backgroundColor: 'rgba(0,0,255,0.1)', tension: 0.3 }] },
    options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { title: { display: true, text: 'KP gained over time' } } }
  });

  if (killsChartInstance) killsChartInstance.destroy();
  const ctxKills = document.getElementById('killsChart').getContext('2d');
  killsChartInstance = new Chart(ctxKills, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Total Kills', data: killsData, backgroundColor: 'green' }] },
    options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { title: { display: true, text: 'Total Kills per entry' } } }
  });
}

function enableSearch() {
  const input = document.getElementById('searchInput');
  input.addEventListener('keyup', () => {
    const filter = input.value.toLowerCase();
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(row => row.style.display = row.innerText.toLowerCase().includes(filter) ? '' : 'none');
  });
}

fetchSheetData();
