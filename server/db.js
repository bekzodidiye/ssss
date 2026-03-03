require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const initDb = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Check if there's an initial row
        const res = await client.query('SELECT COUNT(*) FROM app_state');
        if (parseInt(res.rows[0].count) === 0) {
            await client.query('INSERT INTO app_state (data) VALUES ($1)', [JSON.stringify({})]);
        }
    } finally {
        client.release();
    }
};

module.exports = { pool, initDb };
