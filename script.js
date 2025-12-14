const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTFxMhXLR6U8OesXQdRPTpDJ9kFuY1DP6DlWqmvW9wj3w_a6LIp34ssknkkQgDb0RlcnnJpl1BV1nI6/pub?output=csv";

let charts = {};

/* ---------- Utilities ---------- */

function parseNumber(val) {
  if (!val) return 0;
  return parseFloat(val.toString().replace(/,/g, "")) || 0;
}

/* ---------- Fetch Data ---------- */

async function fetchSheetData() {
  const res = await fetch(sheetURL);
  const csv = await res.text();
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });

  const headers = parsed.meta.fields;
  const rows = parsed.data;

  renderTable(headers, rows);
  updateCharts(rows);
  enableSearch(headers, rows);
}

/* ---------- Table ---------- */

function renderTable(headers, rows) {
  let html = "<table><thead><tr>";

  headers.forEach(h => {
    html += `<th>${h}</th>`;
  });

  html += "</tr></thead><tbody>";

  rows.forEach(row => {
    html += "<tr>";
    headers.forEach((h, index) => {
      let value = row[h] || "";

      // numeric columns
      if ([3, 8, 9, 12].includes(index)) {
        value = parseNumber(value).toLocaleString();
      }

      // % requirements (detected by name)
      if (h.toLowerCase().includes("require")) {
        value = parseNumber(value).toFixed(0) + "%";
      }

      html += `<td>${value}</td>`;
    });
    html += "</tr>";
  });

  html += "</tbody></table>";
  document.getElementById("tableContainer").innerHTML = html;
}

/* ---------- Chart Logic ---------- */

function sumRows(rows) {
  return {
    startingPower: rows.reduce((a, r) => a + parseNumber(Object.values(r)[3]), 0),
    kills: rows.reduce((a, r) => a + parseNumber(Object.values(r)[8]), 0),
    killPoints: rows.reduce((a, r) => a + parseNumber(Object.values(r)[9]), 0),
    deads: rows.reduce((a, r) => a + parseNumber(Object.values(r)[12]), 0),
    requirements:
      rows.length > 0
        ? rows.reduce((a, r) => a + parseNumber(Object.values(r)[17]), 0) / rows.length
        : 0
  };
}

function drawChart(id, label, value, color, isPercent = false) {
  if (charts[id]) charts[id].destroy();

  charts[id] = new Chart(document.getElementById(id), {
    type: "bar",
    data: {
      labels: ["KVK 15"],
      datasets: [
        {
          label,
          data: [value],
          backgroundColor: color
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: v =>
              isPercent ? `${v}%` : v.toLocaleString()
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx =>
              isPercent
                ? `${ctx.raw.toFixed(0)}%`
                : ctx.raw.toLocaleString()
          }
        }
      }
    }
  });
}

function updateCharts(rows) {
  const totals = sumRows(rows);

  drawChart("startingPowerChart", "Starting Power", totals.startingPower, "purple");
  drawChart("killsChart", "Total Kills", totals.kills, "green");
  drawChart("deadsChart", "Total Deads", totals.deads, "red");
  drawChart("killPointsChart", "Kill Points", totals.killPoints, "blue");
  drawChart("requirementsChart", "% Requirements Met", totals.requirements, "orange", true);
}

/* ---------- Search ---------- */

function enableSearch(headers, allRows) {
  const input = document.getElementById("searchInput");

  input.addEventListener("keyup", () => {
    const filter = input.value.toLowerCase();
    const tableRows = document.querySelectorAll("tbody tr");
    let visibleRows = [];

    tableRows.forEach((tr, index) => {
      const match = tr.innerText.toLowerCase().includes(filter);
      tr.style.display = match ? "" : "none";
      if (match) visibleRows.push(allRows[index]);
    });

    updateCharts(visibleRows.length ? visibleRows : allRows);
  });
}

/* ---------- Init ---------- */

fetchSheetData();
