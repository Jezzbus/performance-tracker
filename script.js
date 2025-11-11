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
    const kills = parseFloat((r[killsIndex] || '0').replace(/,/g, '').trim()) || 0;
    const deads = parseFloat((r[deadsIndex] || '0').replace(/,/g, '').trim()) || 0;
    const t4 = parseFloat((r[t4Index] || '0').replace(/,/g, '').trim()) || 0;
    const t5 = parseFloat((r[t5Index] || '0').replace(/,/g, '').trim()) || 0;

    totalKills += kills;
    totalDeads += deads;
    totalKP += t4 + t5;
  });

  document.getElementById('totalKills').innerText = totalKills;
  document.getElementById('totalDeads').innerText = totalDeads;
  document.getElementById('totalKP').innerText = totalKP;
}

function renderTable(headers, rows) {
  // Indices of columns to show
  const colsToShow = [...Array(14).keys()] // 0–13
    .concat([17]); // column 18 (0-based index)

  let html = '<table><thead><tr>';
  colsToShow.forEach(i => {
    let header = headers[i];
    if (i === 17) header += ' (%)'; // rename column 18
    html += `<th>${header}</th>`;
  });
  html += '</tr></thead><tbody>';

  rows.forEach(r => {
    html += '<tr>';
    colsToShow.forEach(i => {
      let cell = r[i] || '';
      if (i === 17) { // format as percentage
        const num = parseFloat(cell.replace(/,/g, '').trim()) || 0;
        cell = num.toFixed(2) + '%';
      } else { // format numeric columns nicely
        const n = parseFloat(cell.replace(/,/g, '').trim());
        if (!isNaN(n)) cell = n;
      }
      html += `<td>${cell}</td>`;
    });
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
