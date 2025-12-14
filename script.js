// same fetch, parsing, table, search, selection code as before

/* ---------- Charts ---------- */
function drawChart(id, label, value) {
  if (charts[id]) charts[id].destroy();

  charts[id] = new Chart(document.getElementById(id), {
    type: "bar",
    data: {
      labels: ["KVK 15"],        // single horizontal point
      datasets: [{
        label,
        data: [value],
        backgroundColor: "rgba(0,180,200,0.85)"
      }]
    },
    options: {
      responsive: false,          // revert to fixed size charts
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => v.toLocaleString() } }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => ctx.raw.toLocaleString()
          }
        }
      }
    }
  });
}
