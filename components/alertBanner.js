function showAlert(container, levelLabel, message) {
  if (!container) return;
  container.classList.remove('hidden');
  const colorMap = {
    Good: '#d4f8d4',
    Moderate: '#fff8cc',
    'Unhealthy for Sensitive Groups': '#ffe8b2',
    Unhealthy: '#ffd6d6',
    'Very Unhealthy': '#f0d4ff',
    Hazardous: '#f4c5d5',
  };
  container.style.backgroundColor = colorMap[levelLabel] || '#f5f5f5';
  container.textContent = `${levelLabel} : ${message}`;
}

function hideAlert(container) {
  if (!container) return;
  container.classList.add('hidden');
  container.textContent = '';
}
