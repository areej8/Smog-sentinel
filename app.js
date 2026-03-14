const STORAGE_PROFILE = 'smogSentinel_healthProfile';
const STORAGE_HISTORY = 'smogSentinel_history';

const citySearch = document.getElementById('citySearch');
const suggestions = document.getElementById('suggestions');
const cityName = document.getElementById('cityName');
const aqiValue = document.getElementById('aqiValue');
const aqiLevel = document.getElementById('aqiLevel');
const guideline = document.getElementById('guideline');
const pollutantsContainer = document.getElementById('pollutants');
const trendList = document.getElementById('trendList');
const doComparisonButton = document.getElementById('compareButton');
const sourceBadge = document.getElementById('sourceBadge');
const safeWindowsList = document.getElementById('safeWindowsList');
const historyStats = document.getElementById('historyStats');
const chartCanvas = document.getElementById('aqiChart');
const alertBanner = document.getElementById('alertBanner');
const healthModal = document.getElementById('healthModal');
const profileBadge = document.getElementById('profileBadge');
const compareCityA = document.getElementById('compareCityA');
const compareCityB = document.getElementById('compareCityB');
const runCompare = document.getElementById('runCompare');
const compareTable = document.getElementById('compareTable');
const compareRadarCanvas = document.getElementById('compareRadar');
const compareWinner = document.getElementById('compareWinner');
const historyChartCanvas = document.getElementById('historyChart');
const chatHistory = document.getElementById('chatHistory');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const typingIndicator = document.getElementById('typingIndicator');
const quickButtons = Array.from(document.getElementsByClassName('quick-btn'));
const profileOptions = Array.from(document.getElementsByClassName('profile-choice'));
const closeHealthModalButton = document.getElementById('closeHealthModal');

let historyChart = null;
let latestStats = {
  city: '', aqi: 0, category: 'Unknown',
  pm25: 0, pm10: 0, no2: 0, so2: 0, o3: 0, co: 0,
  trend: 'stable', season: 'other',
  healthProfile: 'Healthy Adult', time: ''
};

// ── SUGGESTIONS ──
function renderSuggestions(items) {
  if (!suggestions) return;
  suggestions.innerHTML = '';
  items.slice(0, 6).forEach((city) => {
    const li = document.createElement('li');
    li.textContent = `${city.name}, ${city.country || city.admin1 || ''}`.trim();
    li.addEventListener('click', () => {
      citySearch.value = city.name;
      setCityChoice(city);
      clearSuggestions();
    });
    suggestions.appendChild(li);
  });
}

function clearSuggestions() {
  if (!suggestions) return;
  suggestions.innerHTML = '';
}

// ── DATE HELPERS ──
function formatHour(timeString) {
  const d = new Date(timeString);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDateLabel(timeString) {
  const d = new Date(timeString);
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
}

// ── TREND & SEASON ──
function inferTrend(aqiHourly) {
  if (!aqiHourly?.length) return 'stable';
  const startAvg = aqiHourly.slice(0, 4).reduce((a, b) => a + b, 0) / Math.min(4, aqiHourly.length);
  const endAvg = aqiHourly.slice(-4).reduce((a, b) => a + b, 0) / Math.min(4, aqiHourly.length);
  const delta = endAvg - startAvg;
  if (delta <= -10) return 'improving';
  if (delta >= 10) return 'worsening';
  return 'stable';
}

function getSeason(city) {
  const month = new Date().getMonth() + 1;
  if ([10, 11, 12, 1].includes(month) && ['Lahore', 'Multan', 'Faisalabad'].includes(city)) return 'crop burning season';
  if ([10, 11, 12, 1].includes(month)) return 'winter';
  return 'other';
}

// ── MAIN CITY LOAD ──
async function setCity(city) {
  try {
    const name = city.name || city;
    const latitude = city.latitude || city.lat;
    const longitude = city.longitude || city.lon;
    const timezone = city.timezone || 'UTC';

    cityName.textContent = name;
    showAlert(alertBanner, 'Loading', 'Fetching latest air quality data...');

    const data = await fetchAirQuality(latitude, longitude, timezone);

    const pm25 = data.hourly.pm2_5[0] ?? 0;
    const pm10 = data.hourly.pm10[0] ?? 0;
    const no2 = data.hourly.nitrogen_dioxide[0] ?? 0;
    const so2 = data.hourly.sulphur_dioxide[0] ?? 0;
    const o3 = data.hourly.ozone[0] ?? 0;
    const co = data.hourly.carbon_monoxide[0] ?? 0;
    const usAqi = data.hourly.us_aqi[0] ?? calculateOverallAQI({ pm2_5: pm25, pm10 }).aqi;

    const pollutantData = { pm2_5: pm25, pm10, nitrogen_dioxide: no2, sulphur_dioxide: so2, ozone: o3, carbon_monoxide: co };
    renderPollutantCards(pollutantsContainer, pollutantData);

    const { aqi, primary } = calculateOverallAQI(pollutantData);
    const effectiveAQI = Math.max(usAqi, aqi);
    const level = getAQILevel(effectiveAQI);

    aqiValue.textContent = effectiveAQI;
    aqiValue.style.color = level.color;
    aqiLevel.textContent = `${level.label} (primary: ${primary})`;
    aqiLevel.style.color = level.color;

    latestStats = {
      city: name,
      aqi: effectiveAQI,
      category: level.label,
      pm25, pm10, no2, so2, o3, co,
      trend: inferTrend(data.hourly.us_aqi.slice(0, 48)),
      season: getSeason(name),
      healthProfile: getHealthProfile(),
      time: new Date().toLocaleString('en-US'),
    };

    guideline.textContent = getHealthGuideline(effectiveAQI);
    applyHealthWarnings(effectiveAQI);

    const pollSource = detectPollutionSource(pm25, pm10, co, no2, so2, o3, new Date().getHours(), new Date().getMonth() + 1, name);
    sourceBadge.textContent = `${pollSource.source} · ${pollSource.confidence}%`;
    sourceBadge.style.borderColor = pollSource.confidence > 85 ? 'var(--good)' : 'var(--moderate)';

    setGauge(effectiveAQI, level.color);

    const labels = data.hourly.time.slice(0, 24).map((t) => formatHour(t));
    const lineData = data.hourly.us_aqi.slice(0, 24).map((val) => val ?? 0);
    renderAQIChart(chartCanvas, labels, lineData);

    const safeWindows = findSafeWindows(data.hourly.us_aqi.slice(0, 48), data.hourly.time.slice(0, 48));
    renderSafeWindowCards(safeWindows);

    // 5-day trend
    const dailyAQI = {};
    data.hourly.time.forEach((time, i) => {
      const dateKey = new Date(time).toISOString().slice(0, 10);
      const value = data.hourly.us_aqi[i] ?? 0;
      if (!dailyAQI[dateKey]) dailyAQI[dateKey] = { total: 0, count: 0 };
      dailyAQI[dateKey].total += value;
      dailyAQI[dateKey].count += 1;
    });

    trendList.innerHTML = '';
    Object.keys(dailyAQI).slice(0, 5).forEach((day) => {
      const avgDay = Math.round(dailyAQI[day].total / dailyAQI[day].count);
      const level = getAQILevel(avgDay);
      const li = document.createElement('li');
      li.innerHTML = `<span style="color:${level.color}; font-weight:600;">${avgDay}</span> — ${day} <span style="color:var(--muted); font-size:12px;">(${level.label})</span>`;
      trendList.appendChild(li);
    });

    addHistory(name, effectiveAQI);
    hideAlert(alertBanner);
  } catch (error) {
    console.error(error);
    showAlert(alertBanner, 'Error', error.message || 'Unable to load city data.');
  }
}

// ── POLLUTION SOURCE DETECTION ──
function detectPollutionSource(pm25, pm10, co, no2, so2, o3, hour, month, city) {
  let source = 'Mixed Urban Sources';
  let confidence = 45;

  if (pm10 && pm25 && pm10 / pm25 > 3 && so2 < 5) {
    source = 'Dust / Construction'; confidence = 84;
  } else if (co > 800 && no2 > 40) {
    source = 'Heavy Traffic'; confidence = 86;
  } else if (so2 > 20) {
    source = 'Industrial / Brick Kilns'; confidence = 88;
  } else if (pm25 > 60 && [10, 11, 12, 1].includes(month) && ['Lahore', 'Multan', 'Faisalabad'].includes(city)) {
    source = 'Crop Burning (Stubble)'; confidence = 91;
  } else if (no2 > 30 && ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20))) {
    source = 'Rush Hour Traffic'; confidence = 83;
  } else if (o3 > 100 && hour >= 12 && hour <= 16) {
    source = 'Secondary Photochemical Smog'; confidence = 79;
  }

  return { source, confidence };
}

// ── SAFE WINDOW FINDER ──
function findSafeWindows(hourlyAQI, hourlyTimes) {
  const windows = [];
  let current = null;

  for (let i = 0; i < hourlyAQI.length; i++) {
    const aqi = hourlyAQI[i] || 0;
    if (aqi < 100) {
      if (!current) current = { start: hourlyTimes[i], end: hourlyTimes[i], values: [aqi] };
      else { current.end = hourlyTimes[i]; current.values.push(aqi); }
    } else {
      if (current && current.values.length >= 2) windows.push(current);
      current = null;
    }
  }
  if (current && current.values.length >= 2) windows.push(current);

  if (windows.length === 0 && hourlyAQI.length >= 2) {
    let best = { start: hourlyTimes[0], end: hourlyTimes[1], avg: (hourlyAQI[0] + hourlyAQI[1]) / 2 };
    for (let i = 0; i < hourlyAQI.length - 1; i++) {
      const avg = (hourlyAQI[i] + hourlyAQI[i + 1]) / 2;
      if (avg < best.avg) best = { start: hourlyTimes[i], end: hourlyTimes[i + 1], avg };
    }
    return [best];
  }

  return windows
    .map((w) => ({ start: w.start, end: w.end, avg: w.values.reduce((a, b) => a + b, 0) / w.values.length }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3);
}

// ── GAUGE ──
function setGauge(aqi, color) {
  const gaugeArc = document.getElementById('gaugeArc');
  if (!gaugeArc) return;
  const maxDash = 251;
  const offset = maxDash - Math.min(500, Math.max(0, aqi)) / 500 * maxDash;
  gaugeArc.style.strokeDashoffset = String(offset);
  gaugeArc.style.stroke = color;
}

// ── HEALTH PROFILE ──
function getHealthProfile() {
  return localStorage.getItem(STORAGE_PROFILE) || 'Healthy Adult';
}

function setHealthProfile(profile) {
  localStorage.setItem(STORAGE_PROFILE, profile);
  profileBadge.textContent = profile;
  latestStats.healthProfile = profile;
}

function applyHealthWarnings(aqi) {
  const profile = getHealthProfile();
  let message = '';
  if (profile === 'Asthma/Respiratory' && aqi > 100) message = 'High risk for you specifically. Keep inhaler accessible.';
  else if (profile === 'Pregnant' && aqi > 150) message = 'Avoid all outdoor exposure. Keep windows closed.';
  else if (profile === 'Child' && aqi > 100) message = 'Outdoor recess not recommended.';
  if (message) guideline.textContent = message;
}

// ── HISTORY ──
function addHistory(city, aqi) {
  const history = JSON.parse(localStorage.getItem(STORAGE_HISTORY) || '[]');
  history.unshift({ city, aqi, timestamp: new Date().toISOString() });
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history.slice(0, 30)));
  renderHistory(JSON.parse(localStorage.getItem(STORAGE_HISTORY) || '[]'));
}

function renderHistory(history) {
  if (!historyChartCanvas) return;
  if (historyChart) { historyChart.destroy(); historyChart = null; }

  if (!history || history.length === 0) {
    if (historyStats) historyStats.textContent = 'No history yet';
    return;
  }

  const sparse = history.slice().reverse();
  const labels = sparse.map((h) => new Date(h.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
  const values = sparse.map((h) => h.aqi);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = Math.round(values.reduce((s, v) => s + v, 0) / values.length);

  if (historyStats) historyStats.textContent = `Min ${min} · Max ${max} · Avg ${avg}`;

  const ctx = historyChartCanvas.getContext('2d');
  historyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'AQI',
        data: values,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: '#94a3b8', maxTicksLimit: 8 }, grid: { display: false } },
        y: { min: 0, max: 500, ticks: { color: '#94a3b8', stepSize: 100 }, grid: { color: '#f1f5f9' } },
      },
      plugins: { legend: { display: false } },
    },
  });
}

// ── GROQ CHATBOT — SCOPED TO AIR QUALITY ONLY ──
function buildGroqPrompt(message) {
  return `You are an air quality assistant embedded in the Smog Sentinel dashboard for Pakistan. Your ONLY purpose is to answer questions related to air quality, pollution, AQI levels, health effects of air pollution, and outdoor activity recommendations.

Current real-time data:
City: ${latestStats.city}
AQI: ${latestStats.aqi} (${latestStats.category})
PM2.5: ${latestStats.pm25} µg/m³, PM10: ${latestStats.pm10} µg/m³
NO2: ${latestStats.no2} ppb, SO2: ${latestStats.so2} ppb, O3: ${latestStats.o3} ppb, CO: ${latestStats.co} ppm
24h trend: ${latestStats.trend}
Season: ${latestStats.season}
User health profile: ${latestStats.healthProfile}
Time: ${latestStats.time}

STRICT RULES:
- If the question is NOT about air quality, pollution, AQI, outdoor safety, or health effects of pollution, respond ONLY with exactly: "I can only help with air quality questions. Try asking about today's AQI, safe outdoor times, or health advice for current conditions."
- Never answer coding, general knowledge, entertainment, weather (non-pollution), or unrelated questions
- Always reference the actual numbers in your answer
- Be specific to Pakistan context — mention crop burning, brick kilns, traffic patterns when relevant
- Keep answers under 3 sentences unless the user asks for more detail
- Do not start with "I" — vary your sentence openings`;
}

function appendChat(role, text) {
  const messageEl = document.createElement('div');
  messageEl.className = `chat-message ${role}`;
  const timestamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  messageEl.innerHTML = `<div>${text}</div><div class="timestamp">${timestamp}</div>`;
  chatHistory.appendChild(messageEl);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function sendChat(message) {
  if (!message?.trim()) return;
  appendChat('user', message);
  if (chatInput) chatInput.value = '';
  if (typingIndicator) typingIndicator.classList.remove('hidden');

  if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
    appendChat('assistant', 'Groq API key not configured. Please set your key in config.js.');
    if (typingIndicator) typingIndicator.classList.add('hidden');
    return;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: buildGroqPrompt(message) },
          { role: 'user', content: message }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const payload = await response.json();
    const assistantText = payload?.choices?.[0]?.message?.content || 'Unable to fetch answer.';
    appendChat('assistant', assistantText.trim());
  } catch (error) {
    appendChat('assistant', `Chat error: ${error.message}`);
  } finally {
    if (typingIndicator) typingIndicator.classList.add('hidden');
  }
}

// ── SAFE WINDOW CARDS ──
function renderSafeWindowCards(windows) {
  if (!safeWindowsList) return;
  safeWindowsList.innerHTML = '';
  if (!windows?.length) {
    safeWindowsList.textContent = 'No safe window found in the next 48 hours.';
    return;
  }
  windows.forEach((w) => {
    const card = document.createElement('div');
    card.className = 'window-card';
    const avgRounded = Math.round(w.avg);
    const label = avgRounded < 50 ? 'Good' : avgRounded < 100 ? 'Moderate' : 'Unhealthy';
    card.textContent = `${formatHour(w.start)} – ${formatHour(w.end)} · Avg AQI ${avgRounded} · ${label}`;
    safeWindowsList.appendChild(card);
  });
}

// ── CITY COMPARISON ──
function getLatestPollutantValues(apiData) {
  return {
    pm2_5: apiData.hourly.pm2_5[0] ?? 0,
    pm10: apiData.hourly.pm10[0] ?? 0,
    nitrogen_dioxide: apiData.hourly.nitrogen_dioxide[0] ?? 0,
    sulphur_dioxide: apiData.hourly.sulphur_dioxide[0] ?? 0,
    ozone: apiData.hourly.ozone[0] ?? 0,
    carbon_monoxide: apiData.hourly.carbon_monoxide[0] ?? 0,
  };
}

function renderCompareTable(cityA, cityB, a, b) {
  compareTable.innerHTML = `
    <tr><th>Pollutant</th><th>${cityA}</th><th>${cityB}</th></tr>
    <tr><td>PM2.5</td><td>${a.pm2_5.toFixed(1)}</td><td>${b.pm2_5.toFixed(1)}</td></tr>
    <tr><td>PM10</td><td>${a.pm10.toFixed(1)}</td><td>${b.pm10.toFixed(1)}</td></tr>
    <tr><td>NO2</td><td>${a.nitrogen_dioxide.toFixed(1)}</td><td>${b.nitrogen_dioxide.toFixed(1)}</td></tr>
    <tr><td>SO2</td><td>${a.sulphur_dioxide.toFixed(1)}</td><td>${b.sulphur_dioxide.toFixed(1)}</td></tr>
    <tr><td>O3</td><td>${a.ozone.toFixed(1)}</td><td>${b.ozone.toFixed(1)}</td></tr>
    <tr><td>CO</td><td>${a.carbon_monoxide.toFixed(2)}</td><td>${b.carbon_monoxide.toFixed(2)}</td></tr>
  `;

  compareTable.querySelectorAll('tr').forEach((row, idx) => {
    if (idx === 0) return;
    const cells = row.querySelectorAll('td');
    const aVal = Number(cells[1].textContent);
    const bVal = Number(cells[2].textContent);
    if (aVal > bVal) {
      cells[1].style.background = 'rgba(220,38,38,0.08)';
      cells[2].style.background = 'rgba(22,163,74,0.08)';
    } else if (bVal > aVal) {
      cells[2].style.background = 'rgba(220,38,38,0.08)';
      cells[1].style.background = 'rgba(22,163,74,0.08)';
    }
  });
}

async function compareCities() {
  try {
    const cityA = JSON.parse(compareCityA.value);
    const cityB = JSON.parse(compareCityB.value);
    if (!cityA || !cityB) return;

    const [dataA, dataB] = await Promise.all([
      fetchAirQuality(cityA.latitude, cityA.longitude, cityA.timezone || 'UTC'),
      fetchAirQuality(cityB.latitude, cityB.longitude, cityB.timezone || 'UTC'),
    ]);

    const metricsA = getLatestPollutantValues(dataA);
    const metricsB = getLatestPollutantValues(dataB);
    renderCompareTable(cityA.name, cityB.name, metricsA, metricsB);

    renderRadarComparison(
      compareRadarCanvas,
      ['PM2.5', 'PM10', 'NO2', 'SO2', 'O3', 'CO'],
      [metricsA.pm2_5, metricsA.pm10, metricsA.nitrogen_dioxide, metricsA.sulphur_dioxide, metricsA.ozone, metricsA.carbon_monoxide],
      cityA.name,
      [metricsB.pm2_5, metricsB.pm10, metricsB.nitrogen_dioxide, metricsB.sulphur_dioxide, metricsB.ozone, metricsB.carbon_monoxide],
      cityB.name
    );

    const aAQI = Math.max(dataA.hourly.us_aqi[0] || 0, calculateOverallAQI(metricsA).aqi);
    const bAQI = Math.max(dataB.hourly.us_aqi[0] || 0, calculateOverallAQI(metricsB).aqi);
    const diff = ((Math.abs(aAQI - bAQI) / Math.max(aAQI, bAQI)) * 100).toFixed(0);
    const cleaner = aAQI < bAQI ? cityA.name : cityB.name;
    const worse   = aAQI < bAQI ? cityB.name : cityA.name;
    compareWinner.textContent = `${cleaner} air is ${diff}% cleaner than ${worse} today`;
    compareWinner.style.display = 'block';
  } catch (error) {
    showAlert(alertBanner, 'Compare Error', error.message || 'Compare failed');
  }
}

// ── HEALTH MODAL ──
function showHealthModal() { healthModal.classList.remove('hidden'); }
function hideHealthModal() { healthModal.classList.add('hidden'); }

function initHealthProfile() {
  const existing = localStorage.getItem(STORAGE_PROFILE);
  if (existing) {
    setHealthProfile(existing);
  } else {
    showHealthModal();
  }

  profileOptions.forEach((opt) => {
    opt.addEventListener('click', () => {
      profileOptions.forEach((b) => b.classList.remove('active'));
      opt.classList.add('active');
      setHealthProfile(opt.dataset.profile);
    });
  });

  closeHealthModalButton.addEventListener('click', () => hideHealthModal());
  profileBadge.addEventListener('click', () => showHealthModal());
}

// ── COMPARE SELECTORS ──
function initCompareSelectors() {
  compareCityA.innerHTML = '';
  compareCityB.innerHTML = '';
  pakistanCities.forEach((city, i) => {
    const optA = document.createElement('option');
    optA.value = JSON.stringify(city);
    optA.textContent = city.name;
    compareCityA.appendChild(optA);

    const optB = document.createElement('option');
    optB.value = JSON.stringify(city);
    optB.textContent = city.name;
    if (i === 1) optB.selected = true;
    compareCityB.appendChild(optB);
  });
}

// ── EVENTS ──
function setupEvents() {
  // Compare Cities button scrolls to compare section
  doComparisonButton.addEventListener('click', () => {
    document.getElementById('comparePanel').scrollIntoView({ behavior: 'smooth' });
  });

  runCompare.addEventListener('click', compareCities);

  chatSend.addEventListener('click', () => sendChat(chatInput.value));
  chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChat(chatInput.value); });

  quickButtons.forEach((btn) => {
    btn.addEventListener('click', () => sendChat(btn.innerText));
  });
}

// ── CITY CHOICE ──
function setCityChoice(city) {
  if (!city) return;
  setCity(city);
}

// ── SEARCH INPUT ──
citySearch.addEventListener('input', async (e) => {
  const query = e.target.value.trim();
  if (!query) { clearSuggestions(); return; }
  if (query.length < 2) return;
  try {
    const items = await searchCity(query, 5, 'en');
    renderSuggestions(items);
  } catch (err) {
    console.error('Search error', err);
    clearSuggestions();
  }
});

window.addEventListener('click', (e) => {
  if (e.target !== suggestions && e.target !== citySearch) clearSuggestions();
});

// ── INIT ──
function init() {
  initHealthProfile();
  initCompareSelectors();
  setupEvents();

  // Load default city
  const defaultCity = pakistanCities[0];
  if (defaultCity) setCity(defaultCity);

  renderHistory(JSON.parse(localStorage.getItem(STORAGE_HISTORY) || '[]'));
}

init();