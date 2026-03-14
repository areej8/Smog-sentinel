function renderPollutantCards(container, data) {
  if (!container) return;
  container.innerHTML = '';
  const mapping = [
    { key: 'pm2_5', label: 'PM2.5', unit: 'µg/m³', max: 200 },
    { key: 'pm10', label: 'PM10', unit: 'µg/m³', max: 300 },
    { key: 'ozone', label: 'Ozone (O3)', unit: 'ppb', max: 150 },
    { key: 'nitrogen_dioxide', label: 'NO2', unit: 'ppb', max: 200 },
    { key: 'sulphur_dioxide', label: 'SO2', unit: 'ppb', max: 100 },
    { key: 'carbon_monoxide', label: 'CO', unit: 'ppm', max: 20 },
  ];

  for (const pollutant of mapping) {
    const value = data[pollutant.key];
    const normalized = typeof value === 'number' ? Math.min(100, (value / pollutant.max) * 100) : 0;
    const node = document.createElement('div');
    node.className = 'pollutant-card';
    node.innerHTML = `
      <h4>${pollutant.label}</h4>
      <p class="level">${typeof value === 'number' ? Number(value.toFixed(2)) : '--'} ${pollutant.unit}</p>
      <div class="bar"><div class="bar-fill" style="width: ${normalized}%;"></div></div>
    `;
    container.appendChild(node);
  }
}

