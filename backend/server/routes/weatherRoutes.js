import express from 'express';

const router = express.Router();

// ─── GET weather ──────────────────────────────────────────────────────────────
// Public — kiosk needs it
router.get('/', async (req, res) => {
    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        const city = 'Dasmariñas';
        const country = 'PH';
        const units = 'metric';

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=14.3294&lon=120.9367&units=${units}&appid=${apiKey}`
        );

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch weather.' });
        }

        const data = await response.json();

        res.json({
            temp: Math.round(data.main.temp),
            feels_like: Math.round(data.main.feels_like),
            condition: data.weather[0].main,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            humidity: data.main.humidity,
            city: data.name
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;