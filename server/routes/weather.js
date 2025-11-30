const express = require('express');
const router = express.Router();

// Get weather data (proxy to OpenWeather API)
router.get('/', async (req, res) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const lat = 14.3294;
    const lon = 120.9367;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      res.status(200).json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;