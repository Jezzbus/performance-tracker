const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTFxMhXLR6U8OesXQdRPTpDJ9kFuY1DP6DlWqmvW9wj3w_a6LIp34ssknkkQgDb0RlcnnJpl1BV1nI6/pub?output=csv";


let charts = {};

async function fetchSheetData() {
  try {
    const res = await fetch(sheetURL);
    const csv = await res.text();
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
    const headers = parsed.meta.fields;
    const rows = parsed.data;

    renderTable(headers, rows);
    renderCharts(rows);
    enableSearch(rows);
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

// Render table
function renderTable(headers, rows) {
  const colsToShow = [...Array(14).keys()].concat([17]); // columns 0-13 + % Requirements

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
        cell = parseNumber(cell).toFixed(0) + '%';
      } else {
        const numericCols = [3, 8, 9, 12]; // Starting Power, Total Kills, Kill Points, Deads
        if (numericCols.includes(i)) cell = parseNumber(cell).toLocaleString();
      }
      html += `<td>${cell}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  document.getElementById('tableContainer').innerHTML = html;
}

// Create charts
function createOrUpdateChart(id, label, data, type='bar', color='blue', isPercent=false) {
  if (charts[id]) charts[id].destroy();
  const ctx = document.getElementById(id).getContext('2d');
  charts[id] = new Chart(ctx, {
    type,
    data: {
      labels: ['Dataset 1'],
      datasets: [{
        label,
        data,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
        fill: type === 'line'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: function(context) {
              let value = context.raw;
              return isPercent ? value.toFixed(0) + '%' : value.toLocaleString();
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return isPercent ? value.toFixed(0) + '%' : value.toLocaleString();
            }
          }
        }
      }
    }
  });
}

// Render initial charts
function renderCharts(rows) {
  const firstRow = rows[0] || {};
  createOrUpdateChart('startingPowerChart', 'Starting Power', [parseNumber(firstRow[3])], 'line', 'purple');
  createOrUpdateChart('killsChart', 'Total Kills', [parseNumber(firstRow[8])], 'bar', 'green');
  createOrUpdateChart('deadsChart', 'Total Deads', [parseNumber(firstRow[12])], 'bar', 'red');
  createOrUpdateChart('killPointsChart', 'Total Kill Points', [parseNumber(firstRow[9])], 'bar', 'blue');
  createOrUpdateChart('requirementsChart', '% Requirements Met', [parseNumber(firstRow[17])], 'line', 'orange', true);
}

// Search and update charts dynamically
function enableSearch(rows) {
  const input = document.getElementById('searchInput');
  input.addEventListener('keyup', () => {
    const filter = input.value.toLowerCase();
    const tableRows = document.querySelectorAll('tbody tr');

    let filteredRows = [];

    tableRows.forEach(row => {
      const text = row.innerText.toLowerCase();
      const isVisible = text.includes(filter);
      row.style.display = isVisible ? '' : 'none';

      if (isVisible) {
        const cells = row.querySelectorAll('td');
        filteredRows.push(Array.from(cells).map(td => td.innerText));
      }
    });

    if (filteredRows.length === 0) return;

    // Use first filtered row for charts
    const row = filteredRows[0];
    charts['startingPowerChart'].data.datasets[0].data = [parseNumber(row[3])];
    charts['startingPowerChart'].update();

    charts['killsChart'].data.datasets[0].data = [parseNumber(row[8])];
    charts['killsChart'].update();

    charts['deadsChart'].data.datasets[0].data = [parseNumber(row[12])];
    charts['deadsChart'].update();

    charts['killPointsChart'].data.datasets[0].data = [parseNumber(row[9])];
    charts['killPointsChart'].update();

    charts['requirementsChart'].data.datasets[0].data = [parseNumber(row[17])];
    charts['requirementsChart'].update();
  });
}

fetchSheetData();

