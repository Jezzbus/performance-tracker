const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTFxMhXLR6U8OesXQdRPTpDJ9kFuY1DP6DlWqmvW9wj3w_a6LIp34ssknkkQgDb0RlcnnJpl1BV1nI6/pub?output=csv";

const CYAN = "rgba(0, 180, 200, 0.8)";
let charts = {};
let allRows = [];
let headers = [];

function parseNumber(v) {
  return parseFloat((v || "0").toString().replace(/,/g, "")) || 0;
}

fetch(sheetURL)
  .then(r => r.text())
  .then(csv => {
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
    headers = parsed.meta.fields;
    allRows = parsed.data;
    renderTable(allRows);
    updateCharts(allRows);
    enableSearch();
  });

/* ---------- TABLE ---------- */

function renderTable(rows) {
  let html = "<table><thead><tr><th>Select</th>";

  headers.forEach(h => html += `<th>${h}</th>`);
  html += "</tr></thead><tbody>";

  rows.forEach((row, i) => {
    html += `<tr data-index="${i}">
      <td class="checkbox-cell">
        <input type="checkbox" class="rowCheck" checked>
      </td>`;

    headers.forEach((h, idx) => {
      let val = row[h] || "";

      if ([3, 8, 9, 12].includes(idx)) {
        val = parseNumber(val).toLocaleString();
      }

      if (idx === 17) {
        val = parseNumber(val).toFixed(0) + "%";
      }

      html += `<td>${val}</td>`;
    });

    html += "</tr>";
  });

  html += "</tbody></table>";
  document.getElementById("tableContainer").innerHTML = html;

  document.querySelectorAll(".rowCheck").forEach(cb =>
    cb.addEventListener("change", updateFromSelection)
  );
}

/* ---------- SELECTION ---------- */

function getSelectedRows() {
  return [...document.querySelectorAll("tbody tr")]
    .filter(r => r.querySelector(".rowCheck").checked)
    .map(r => allRows[r.dataset.index]);
}

function updateFromSelection() {
  const selected = getSelectedRows();
  updateCharts(selected.length ? selected : []);
}

/* ---------- SEARCH ---------- */

function enableSearch() {
  const input = document.getElementById("searchInput");

  input.addEventListener("keyup", () => {
    const term = input.value.toLowerCase();

    document.querySelectorAll("tbody tr").forEach(tr => {
      const match = tr.innerText.toLowerCase().includes(term);
      tr.style.display = match ? "" : "none";
      tr.querySelector(".rowCheck").checked = match;
    });

    updateFromSelection();
  });
}

/* ---------- CHARTS ---------- */

function sum(rows) {
  return {
    startingPower: rows.reduce((a, r) => a + parseNumber(Object.values(r)[3]), 0),
    kills: rows.reduce((a, r) => a + parseNumber(Object.values(r)[8]), 0),
    killPoints: rows.reduce((a, r) => a + parseNumber(Object.values(r)[9]), 0),
    deads: rows.reduce((a, r) => a + parseNumber(Object.values(r)[12]), 0),
    requirements:
      rows.length
        ? rows.reduce((a, r) => a + parseNumber(Object.values(r)[17]), 0) / rows.length
        : 0
  };
}

function draw(id, label, value, percent = false) {
  if (charts[id]) charts[id].destroy();

  charts[id] = new Chart(document.getElementById(id), {
    type: "bar",
    data: {
      labels: ["KVK 15"],
      datasets: [{
        label,
        data: [value],
        backgroundColor: CYAN
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: v => percent ? `${v}%` : v.toLocaleString()
          }
        }
      }
    }
  });
}

function updateCharts(rows) {
  const t = sum(rows);

  draw("startingPowerChart", "Starting Power", t.startingPower);
  draw("killsChart", "Total Kills", t.kills);
  draw("killPointsChart", "Kill Points", t.killPoints);
  draw("deadsChart", "Total Deads", t.deads);
  draw("requirementsChart", "% Requirements Met", t.requirements, true);
}
