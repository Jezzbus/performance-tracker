const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTFxMhXLR6U8OesXQdRPTpDJ9kFuY1DP6DlWqmvW9wj3w_a6LIp34ssknkkQgDb0RlcnnJpl1BV1nI6/pub?output=csv";

const CYAN = "rgba(0, 180, 200, 0.85)";
let charts = {};
let allRows = [];
let headers = [];

/* ---------- Utilities ---------- */

function parseNumber(v) {
  if (!v) return 0;
  return parseFloat(v.toString().replace(/,/g, "").replace("%", "")) || 0;
}

/* ---------- Fetch ---------- */

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

    headers.forEach(h => {
      let val = row[h] || "";

      if (typeof val === "string" && val.includes("%")) {
        val = parseNumber(val).toFixed(0) + "%";
      } else if (!isNaN(parseNumber(val)) && val !== "") {
        val = parseNumber(val).toLocaleString();
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

/* ---------- Selection ---------- */

function getSelectedRows() {
  return [...document.querySelectorAll("tbody tr")]
    .filter(r => r.querySelector(".rowCheck").checked)
    .map(r => allRows[r.dataset.index]);
}

function updateFromSelection() {
  const selected = getSelectedRows();
  updateCharts(selected.length ? selected : []);
}

/* ---------- Search ---------- */

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

/* ---------- Aggregation (BY COLUMN NAME) ---------- */

function aggregate(rows) {
  const sum = (col) =>
    rows.reduce((a, r) => a + parseNumber(r[col]), 0);

  const avgPercent = (col) => {
    if (!rows.length) return 0;
    const total = rows.reduce((a, r) => {
      let v = parseNumber(r[col]);
      return a + (v > 1 ? v : v * 100);
    }, 0);
    return total / rows.length;
  };

  return {
    startingPower: sum("Starting Power"),
    kills: sum("Total Kills"),
    killPoints: sum("Kill Points gained (T4 + T5 only)"),
    deads: sum("Total Deads"),
    requirements: avgPercent("% of Requirements Complete")
  };
}

/* ---------- Charts ---------- */

function drawChart(id, label, value, percent = false) {
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
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: v =>
              percent ? `${v.toFixed(0)}%` : v.toLocaleString()
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx =>
              percent
                ? `${ctx.raw.toFixed(0)}%`
                : ctx.raw.toLocaleString()
          }
        }
      }
    }
  });
}

function updateCharts(rows) {
  const t = aggregate(rows);

  drawChart("startingPowerChart", "Starting Power", t.startingPower);
  drawChart("killsChart", "Total Kills", t.kills);
  drawChart("killPointsChart", "Kill Points Gained", t.killPoints);
  drawChart("deadsChart", "Total Deads", t.deads);
  drawChart("requirementsChart", "% Requirements Met", t.requirements, true);
}
