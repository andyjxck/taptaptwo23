import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Remove or change if your DB does not require SSL
});

export async function sql(queryStrings, ...values) {
  const client = await pool.connect();
  try {
    let text = "";
    queryStrings.forEach((str, i) => {
      text += str + (values[i] !== undefined ? values[i] : "");
    });
    const result = await client.query(text);
    return result.rows;
  } finally {
    client.release();
  }
}
