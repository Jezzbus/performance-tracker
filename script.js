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
  const kpCol = headers[6]; // 7th column

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
      if (i === 17) {
        cell = parseNumber(cell).toFixed(0) + '%'; // 0 decimals
      } else {
        // only numeric columns formatted
        const numericCols = [6, 9, 10, 11, 12, 13]; 
        if (numericCols.includes(i)) cell = parseNumber(cell).toLocaleString();
      }
      html += `<td>${cell}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  document.getElementById('tableContainer').innerHTML = html;
}

// Render charts initially based on entire dataset
function renderCharts(headers, rows) {
  const labels = rows.map(r => r[headers[0]] || '');
  const requirementsData = rows.map(r => parseNumber(r[headers[17]]));
  const startingPowerData = rows.map(r => parseNumber(r[headers[5]]));
  const killsData = rows.map(r => parseNumber(r[headers.findIndex(h => /total kills/i.test(h))]));
  const deadsData = rows.map(r => parseNumber(r[headers.findIndex(h => /total deads/i.test(h))]));

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

// Search filters table AND updates all charts dynamically
function enableSearch(headers, rows) {
  const input = document.getElementById('searchInput');
  input.addEventListener('keyup', () => {
    const filter = input.value.toLowerCase();
    const tableRows = document.querySelectorAll('tbody tr');

    let filteredData = [];

    tableRows.forEach(row => {
      const text = row.innerText.toLowerCase();
      const isVisible = text.includes(filter);
      row.style.display = isVisible ? '' : 'none';

      if (isVisible) {
        const cells = row.querySelectorAll('td');
        filteredData.push(Array.from(cells).map(td => td.innerText));
      }
    });

    // Update charts based on filteredData
    if (filteredData.length === 0) return;

    const labels = filteredData.map(r => r[0]);
    const requirementsData = filteredData.map(r => parseNumber(r[r.length - 1])); // last column (%)
    const startingPowerData = filteredData.map(r => parseNumber(r[5])); // Starting Power
    const killsData = filteredData.map(r => parseNumber(r[6])); // Total Kills
    const deadsData = filteredData.map(r => parseNumber(r[7])); // Total Deads

    charts['requirementsChart'].data.labels = labels;
    charts['requirementsChart'].data.datasets[0].data = requirementsData;
    charts['requirementsChart'].update();

    charts['startingPowerChart'].data.labels = labels;
    charts['startingPowerChart'].data.datasets[0].data = startingPowerData;
    charts['startingPowerChart'].update();

    charts['killsChart'].data.labels = labels;
    charts['killsChart'].data.datasets[0].data = killsData;
    charts['killsChart'].update();

    charts['deadsChart'].data.labels = labels;
    charts['deadsChart'].data.datasets[0].data = deadsData;
    charts['deadsChart'].update();
  });
}

fetchSheetData();
