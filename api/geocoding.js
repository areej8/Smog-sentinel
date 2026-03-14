async function searchCity(query, count = 5, language = 'en') {
  if (!query || query.trim().length < 1) return [];
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query);
  url.searchParams.set('count', String(count));
  url.searchParams.set('language', language);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Geocoding API error: ' + response.status);
  }
  const data = await response.json();
  return data.results || [];
}
