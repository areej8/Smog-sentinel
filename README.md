# Smog Sentinel

Live air quality dashboard for Pakistan (Lahore, Karachi, Islamabad, etc.) using Open-Meteo API (no API key required).

## Features

- Current AQI for selected city (US EPA AQI categories)
- 24h AQI line chart + 5-day trend summary
- Pollutant breakdown: PM2.5, PM10, O3, NO2, SO2, CO
- AQI calculation using EPA breakpoint algorithm (from raw concentrations)
- City autocomplete and geo-location search (Open-Meteo geocoding)
- Vision: Pakistan city coverage with special seasonal context in winter
- Health profile selector (Healthy Adult, Child, Elderly, Asthma, Heart, Pregnant)
- Health warnings based on AQI and selected profile
- Safe Window Finder (next 48h lowest-AQI window)
- Compare Cities mode with side-by-side pollutant and radar charts
- Chat assistant powered by Groq AI (context-aware air quality advice)
- Alert banner for status messages and errors
- PWA manifest for installable experience

## Tech stack

- HTML/CSS/JS + module imports
- Open-Meteo Air Quality API
- Open-Meteo Geocoding API
- Chart.js (via CDN)

## Run

### Option 1: Local web server (recommended)
1. Open terminal in project folder (`c:\Users\Pc Planet\Desktop\Proj1`).
2. Run:
   - Windows / macOS / Linux (Python 3):
     ```bash
     python -m http.server 8000
     ```
   - Or if `python` maps to Python 2, use:
     ```bash
     python3 -m http.server 8000
     ```
3. Open browser at `http://localhost:8000`.
4. Use city search and try 24h chart, compare and chat.

### Option 2: Open file directly (quick test)
1. Open `index.html` in browser.
2. Search city in the top field.

> ⚠️ For full fetch behavior (CORS, chart updates), local server mode is recommended.
## Folder structure

```
smog-sentinel/
├── index.html
├── style.css
├── app.js
├── api/
│   ├── airQuality.js
│   └── geocoding.js
├── utils/
│   ├── aqiCalculator.js
│   ├── healthGuidelines.js
│   └── pakistanCities.js
├── components/
│   ├── chart.js
│   ├── pollutantCards.js
│   └── alertBanner.js
├── manifest.json
└── README.md
```

## Features (continued)

- Local history of AQI checks with stats (min/max/avg) and chart.
- Toggleable chat window with expand/collapse styling.
- Gauge indicator with color-coded level, primary pollutant, and data source.
- Responsive layout for desktop/tablet/mobile.

## Screenshots

