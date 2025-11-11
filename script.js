const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ9YnXKGt3I1uXjQprT1UfhVFL7tXW_pWwsJI0CfQdE-vAGVxl8vtaKcK1WMvtl4-RUu9gurcs8p8m1/pub?gid=0&single=true&output=csv';

let charts = {};

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
    enableSearch(headers, rows);
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

// Render summary using proper Kill Points column (7th column)
function renderSummary(rows, headers) {
  const killsCol = headers.find(h => /total kills/i.test(h));
  const deadsCol = headers.find(h => /total deads/i.test(h));
  const kpCol = headers[6]; // 7th column, 0-based index

  let totalKills = 0, totalDeads = 0, totalKP = 0;

  rows.forEach(r => {
    totalKills += parseNumber(r[killsCol]);
    totalDeads += parseNumber(r[deadsCol]);
    totalKP += parseNumber(r[kpCol]);
  });

  document.getElementById('totalKills').innerText = totalKills.toLocaleString();
  document.getElementById('totalDeads').innerText = totalDeads.toLocaleString();
  document.getElementById('totalKP').innerText = totalKP.toLocaleString();
}

function renderTable(headers, rows) {
  const colsToShow = [...Array(14).keys()].concat([17]); // 1–14 + column 18 (%)

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
      // Column 18 (% Requirements) – format with 2 decimals
      if (i === 17) {
        cell = parseNumber(cell).toFixed(2) + '%';
      } else {
        // Only numeric columns get commas; text and IDs remain raw
        const numericCols = [6, /* Kill Points */ 9, 10, 11, 12, 13]; // example numeric columns
        if (numericCols.includes(i)) cell = parseNumber(cell).toLocaleString();
      }
      html += `<td>${cell}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  document.getElementById('tableContainer').innerHTML = html;
}

// Render charts dynamically filtered by player search
function renderCharts(headers, rows, playerFilter = '') {
  const filteredRows = playerFilter
    ? rows.filter(r => r[headers[1]] && r[headers[1]].toLowerCase().includes(playerFilter.toLowerCase()))
    : rows;

  const labels = filteredRows.map(r => r[headers[0]] || ''); // e.g., date or entry
  const requirementsData = filteredRows.map(r => parseNumber(r[headers[17]])); // % Requirements
  const startingPowerData = filteredRows.map(r => parseNumber(r[headers[5]])); // Starting Power column index
  const killsData = filteredRows.map(r => parseNumber(r[headers.findIndex(h => /total kills/i.test(h))]));
  const deadsData = filteredRows.map(r => parseNumber(r[headers.findIndex(h => /total deads/i.test(h))]));

  // Chart helper
  function createOrUpdateChart(id, label, data, type='line', color='blue') {
    if (charts[id]) charts[id].destroy();
    const ctx = document.getElementById(id).getContext('2d');
    charts[id] = new Chart(ctx, {
      type,
      data: { labels, datasets: [{ label, data, backgroundColor: color, borderColor: color }] },
      options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: true } } }
    });
  }

  createOrUpdateChart('requirementsChart', '% Requirements Met', requirementsData, 'line', 'orange');
  createOrUpdateChart('startingPowerChart', 'Starting Power', startingPowerData, 'line', 'purple');
  createOrUpdateChart('killsChart', 'Total Kills', killsData, 'bar', 'green');
  createOrUpdateChart('deadsChart', 'Total Deads', deadsData, 'bar', 'red');
}

// Search box filters table AND updates charts
function enableSearch(headers, rows) {
  const input = document.getElementById('searchInput');
  input.addEventListener('keyup', () => {
    const filter = input.value.toLowerCase();
    const tableRows = document.querySelectorAll('tbody tr');

    tableRows.forEach(row => {
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(filter) ? '' : 'none';
    });

    renderCharts(headers, rows, filter);
  });
}

fetchSheetData();
