require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { pool, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/api/state', async (req, res) => {
    try {
        const result = await pool.query('SELECT data FROM app_state ORDER BY id DESC LIMIT 1');
        if (result.rows.length > 0) {
            res.json(result.rows[0].data);
        } else {
            res.json({});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch state' });
    }
});

app.post('/api/state', async (req, res) => {
    try {
        const { data } = req.body;
        // We update the existing single row to keep it simple as a KV store for now
        await pool.query('UPDATE app_state SET data = $1, updated_at = NOW() WHERE id = (SELECT id FROM app_state ORDER BY id DESC LIMIT 1)', [data]);
        res.json({ success: true });
    } catch (err) {
        console.error('Database Save Error:', err);
        res.status(500).json({ error: 'Failed to save state' });
    }
});

initDb().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database', err);
});
