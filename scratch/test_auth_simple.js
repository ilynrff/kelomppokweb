const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    const whatsapp = "+628111111111"; // Apiipp
    const passwordAttempt = "user123";

    const res = await pool.query('SELECT * FROM "User" WHERE whatsapp = $1', [whatsapp]);
    const user = res.rows[0];

    if (!user) {
      console.log("User not found!");
      return;
    }

    console.log("User found:", user.name);
    console.log("Hash in DB:", user.password);

    const isValid = await bcrypt.compare(passwordAttempt, user.password);
    console.log("Password Valid:", isValid);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

test();
