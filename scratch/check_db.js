const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  try {
    const res = await pool.query('SELECT name, whatsapp, password FROM "User"');
    console.log("USERS IN DB:");
    res.rows.forEach(u => {
      console.log(`- ${u.name} (${u.whatsapp}): Hash starts with ${u.password.substring(0, 10)}... Length: ${u.password.length}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
