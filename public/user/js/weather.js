document.addEventListener('DOMContentLoaded', () => {
    fetch('https://api.openweathermap.org/data/2.5/weather?q=Dasmarinas,PH&appid=7e2f1538e6abf5b08339d02cc1af4b15&units=metric')
        .then(response => response.json())
        .then(data => {
            const temp = (data.main.temp).toFixed(1);
            const weather = data.weather[0].description;
            const iconCode = data.weather[0].icon;

            document.getElementById('weather-temp').innerHTML = `${temp}°C<br><small>Dasmarinas, Cavite</small>`;
            document.getElementById('weather-quote').innerText = getWeatherDescription(weather);

            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
            document.getElementById('weather-icon').src = iconUrl;
        })
        .catch(error => console.error('Error fetching weather data:', error));

    function getWeatherDescription(weatherDescription) {
        if (weatherDescription.includes('clear sky')) {
            return "Clear skies with no clouds in sight.";
        } else if (weatherDescription.includes('few clouds')) {
            return "A few clouds scattered across the sky.";
        } else if (weatherDescription.includes('scattered clouds')) {
            return "Scattered clouds with some breaks of blue sky.";
        } else if (weatherDescription.includes('overcast clouds')) {
            return "Broken clouds, but the sky is still visible in places.";
        } else if (weatherDescription.includes('shower rain')) {
            return "Light rain showers are occurring.";
        } else if (weatherDescription.includes('rain')) {
            return "Moderate to heavy rain with overcast skies.";
        } else if (weatherDescription.includes('thunderstorm')) {
            return "Thunderstorms with heavy rain and lightning.";
        } else if (weatherDescription.includes('snow')) {
            return "Snowfall with cold temperatures.";
        } else if (weatherDescription.includes('mist')) {
            return "Misty conditions, reducing visibility.";
        } else {
            return "The weather is currently clear.";
        }
    }
});