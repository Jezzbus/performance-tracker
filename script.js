// Google Sheet CSV link
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ9YnXKGt3I1uXjQprT1UfhVFL7tXW_pWwsJI0CfQdE-vAGVxl8vtaKcK1WMvtl4-RUu9gurcs8p8m1/pub?gid=0&single=true&output=csv';

async function fetchSheetData() {
  try {
    const res = await fetch(sheetURL);
    const csv = await res.text();
    const rows = csv.trim().split('\n').map(r => r.split(','));
    const headers = rows.shift();

    renderSummary(rows, headers);
    renderTable(headers, rows);
    enableSearch();

  } catch (err) {
    console.error("Error loading sheet:", err);
    document.getElementById('tableContainer').innerHTML =
      `<p style="color:red">⚠️ Failed to load data. Check your sheet link.</p>`;
  }
}

function renderSummary(rows, headers) {
  const killsIndex = headers.findIndex(h => /total kills/i.test(h));
  const deadsIndex = headers.findIndex(h => /total deads/i.test(h));
  const t4Index = headers.findIndex(h => /T4/i.test(h));
  const t5Index = headers.findIndex(h => /T5/i.test(h));

  let totalKills = 0;
  let totalDeads = 0;
  let totalKP = 0;

  rows.forEach(r => {
    totalKills += parseFloat(r[killsIndex]) || 0;
    totalDeads += parseFloat(r[deadsIndex]) || 0;
    totalKP += (parseFloat(r[t4Index]) || 0) + (parseFloat(r[t5Index]) || 0);
  });

  document.getElementById('totalKills').innerText = totalKills;
  document.getElementById('totalDeads').innerText = totalDeads;
  document.getElementById('totalKP').innerText = totalKP;
}

function renderTable(headers, rows) {
  let html = '<table><thead><tr>';
  headers.forEach(h => html += `<th>${h}</th>`);
  html += '</tr></thead><tbody>';

  rows.forEach(r => {
    html += '<tr>';
    r.forEach(cell => html += `<td>${cell}</td>`);
    html += '</tr>';
  });

  html += '</tbody></table>';
  document.getElementById('tableContainer').innerHTML = html;
}

function enableSearch() {
  const input = document.getElementById('searchInput');
  input.addEventListener('keyup', () => {
    const filter = input.value.toLowerCase();
    const rows = document.querySelectorAll('tbody tr');

    rows.forEach(row => {
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(filter) ? '' : 'none';
    });
  });
}

// Run
fetchSheetData();
