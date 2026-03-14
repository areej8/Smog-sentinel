function getHealthGuideline(aqi) {
  if (aqi <= 50) {
    return 'Air quality is considered satisfactory, and air pollution poses little or no risk.';
  }
  if (aqi <= 100) {
    return 'Air quality is acceptable. Sensitive individuals should limit prolonged outdoor exertion.';
  }
  if (aqi <= 150) {
    return 'Sensitive groups may experience health effects. Reduce prolonged outdoor exertion.';
  }
  if (aqi <= 200) {
    return 'Everyone may begin to experience health effects. Avoid outdoor activities.';
  }
  if (aqi <= 300) {
    return 'Health alert: everyone may experience more serious health effects. Stay indoors.';
  }
  return 'Health warnings of emergency conditions. Avoid all outdoor exertion.';
}
