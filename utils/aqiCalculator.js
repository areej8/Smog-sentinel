function calcAQI(Cp, ih, il, BPh, BPl) {
  return Math.round(((ih - il) / (BPh - BPl)) * (Cp - BPl) + il);
}

function pm25ToAQI(pm25) {
  const breakpoints = [
    [0, 12.0, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 500.4, 301, 500],
  ];
  for (const [BPl, BPh, il, ih] of breakpoints) {
    if (pm25 >= BPl && pm25 <= BPh) {
      return calcAQI(pm25, ih, il, BPh, BPl);
    }
  }
  return 500;
}

function pm10ToAQI(pm10) {
  const breakpoints = [
    [0, 54, 0, 50],
    [55, 154, 51, 100],
    [155, 254, 101, 150],
    [255, 354, 151, 200],
    [355, 424, 201, 300],
    [425, 504, 301, 400],
    [505, 604, 401, 500],
  ];
  for (const [BPl, BPh, il, ih] of breakpoints) {
    if (pm10 >= BPl && pm10 <= BPh) {
      return calcAQI(pm10, ih, il, BPh, BPl);
    }
  }
  return 500;
}

function getAQILevel(aqi) {
  if (aqi <= 50) return { label: 'Good', color: '#00e400' };
  if (aqi <= 100) return { label: 'Moderate', color: '#ffb400' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive Groups', color: '#ff7e00' };
  if (aqi <= 200) return { label: 'Unhealthy', color: '#ff0000' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: '#8f3f97' };
  return { label: 'Hazardous', color: '#7e0023' };
}

function calculateOverallAQI(pollutants) {
  const pm25 = pollutants.pm2_5;
  const pm10 = pollutants.pm10;
  const no2 = pollutants.nitrogen_dioxide || 0;
  const co = pollutants.carbon_monoxide || 0;

  const candidates = [];
  if (typeof pm25 === 'number') candidates.push({ pollutant: 'PM2.5', aqi: pm25ToAQI(pm25) });
  if (typeof pm10 === 'number') candidates.push({ pollutant: 'PM10', aqi: pm10ToAQI(pm10) });
  if (candidates.length === 0) return { aqi: 0, primary: 'N/A' };

  const worst = candidates.reduce((acc, item) => (item.aqi > acc.aqi ? item : acc), candidates[0]);
  return { aqi: worst.aqi, primary: worst.pollutant };
}
