import { sql } from "../auth-handler/db";

async function handler({ action }) {
  try {
    switch (action) {
      case "getFullMetrics": {
        // Daily users & pageviews (last 30 days)
        const daily = await sql`
          SELECT 
            to_char(date_trunc('day', timestamp), 'YYYY-MM-DD') AS day,
            COUNT(*) as pageviews,
            COUNT(DISTINCT user_id) as active_users,
            SUM(CASE WHEN row_number() OVER (PARTITION BY user_id ORDER BY timestamp) = 1 THEN 1 ELSE 0 END) as new_users
          FROM pageviews
          GROUP BY day
          ORDER BY day DESC
          LIMIT 30
        `;

        // Retention: Users who came back the next day (simple)
        const retention = await sql`
          SELECT 
            day,
            COUNT(DISTINCT user_id) FILTER (
              WHERE user_id IN (
                SELECT user_id FROM pageviews 
                WHERE date_trunc('day', timestamp) = day::date - INTERVAL '1 day'
              )
            ) as retained
          FROM (
            SELECT 
              date_trunc('day', timestamp) as day, user_id
            FROM pageviews
          ) x
          GROUP BY day
          ORDER BY day DESC
          LIMIT 30
        `;

