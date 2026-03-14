async function fetchAirQuality(latitude, longitude, timezone = 'UTC') {
  const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
  url.searchParams.set('latitude', latitude);
  url.searchParams.set('longitude', longitude);
  url.searchParams.set('hourly', 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi');
  url.searchParams.set('timezone', timezone);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Air quality API error: ' + response.status);
  }
  return response.json();
}
