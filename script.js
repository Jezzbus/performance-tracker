const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ9YnXKGt3I1uXjQprT1UfhVFL7tXW_pWwsJI0CfQdE-vAGVxl8vtaKcK1WMvtl4-RUu9gurcs8p8m1/pub?gid=0&single=true&output=csv';

async function fetchData() {
  const response = await fetch(sheetURL);
  const text = await response.text();

  const rows = text.split('\n').map(r => r.split(','));
  const headers = rows.shift();

  const dates = rows.map(r => r[0]);
  const progress = rows.map(r => parseFloat(r[3]));

  renderChart(dates, progress);
}

function renderChart(labels, data) {
  new Chart(document.getElementById('progressChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Progress (%)',
        data,
        borderColor: 'blue',
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}

fetchData();
