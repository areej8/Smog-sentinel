const chartMap = new WeakMap();

function destroyChartForCanvas(canvas) {
  const existing = chartMap.get(canvas);
  if (existing) {
    existing.destroy();
    chartMap.delete(canvas);
  }
}

function renderAQIChart(canvas, labels, aqiValues) {
  if (!canvas) return;
  destroyChartForCanvas(canvas);
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'AQI (US EPA)',
          data: aqiValues,
          tension: 0.3,
          borderColor: '#00d4aa',
          backgroundColor: 'rgba(0, 212, 170, 0.25)',
          fill: true,
          pointRadius: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 500,
          ticks: { stepSize: 50, color: '#9da4bd' },
          title: { display: true, text: 'AQI', color: '#9da4bd' },
          grid: { color: 'rgba(255,255,255,0.08)' },
        },
        x: { ticks: { color: '#9da4bd' }, grid: { color: 'rgba(255,255,255,0.08)' } },
      },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: 'rgba(10,10,16,0.95)' },
      },
    },
  });
  chartMap.set(canvas, chart);
}

function renderRadarComparison(canvas, labels, dataA, labelA, dataB, labelB) {
  if (!canvas) return;
  destroyChartForCanvas(canvas);
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [
        {
          label: labelA,
          data: dataA,
          backgroundColor: 'rgba(0,212,170,0.2)',
          borderColor: '#00d4aa',
          borderWidth: 1.5,
        },
        {
          label: labelB,
          data: dataB,
          backgroundColor: 'rgba(255,95,123,0.2)',
          borderColor: '#ff5f7b',
          borderWidth: 1.5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: 'rgba(255,255,255,0.08)' },
          grid: { color: 'rgba(255,255,255,0.08)' },
          pointLabels: { color: '#9da4bd' },
          ticks: { display: false },
        },
      },
      plugins: { legend: { position: 'top', labels: { color: '#e6e8f1' } } },
    },
  });
  chartMap.set(canvas, chart);
}

