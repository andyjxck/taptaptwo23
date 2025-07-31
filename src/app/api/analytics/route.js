import { sql } from "../auth-handler/db";

async function handler({ action, page = 1, perPage = 50 }) {
  try {
    switch (action) {
      case "getMetrics": {
        // Overview
        const [{ total }] = await sql`SELECT COUNT(*) as total FROM pageviews`;
        const [{ unique_visitors }] = await sql`
          SELECT COUNT(DISTINCT COALESCE(user_id, 0)) as unique_visitors FROM pageviews
        `;
        // Popular Pages
        const popularPages = await sql`
          SELECT page_path as path, COUNT(*) as views 
          FROM pageviews 
          GROUP BY page_path 
          ORDER BY views DESC 
          LIMIT 10
        `;
        // Recent Activity (Paginated)
        const recentVisits = await sql`
          SELECT 
            timestamp, 
            page_path, 
            CASE WHEN user_id IS NULL THEN 'Anonymous' ELSE user_id::text END as user_id,
            COALESCE(referrer, 'Direct') as referrer,
            user_agent
          FROM pageviews 
          ORDER BY timestamp DESC 
          LIMIT ${perPage} OFFSET ${(page - 1) * perPage}
        `;
        // Daily Active Users (last 60 days)
        const dau = await sql`
          SELECT 
            to_char(timestamp, 'YYYY-MM-DD') as date, 
            COUNT(DISTINCT COALESCE(user_id, 0)) as users 
          FROM pageviews 
          GROUP BY date 
          ORDER BY date DESC 
          LIMIT 60
        `;
        // Pageviews Per Day (last 60 days)
        const pageviewsPerDay = await sql`
          SELECT 
            to_char(timestamp, 'YYYY-MM-DD') as date, 
            COUNT(*) as pageviews 
          FROM pageviews 
          GROUP BY date 
          ORDER BY date DESC 
          LIMIT 60
        `;
        // New Users Per Day (last 60 days)
        const newUsersPerDay = await sql`
          SELECT 
            first_date as date, 
            COUNT(user_id) as new_users
          FROM (
            SELECT user_id, MIN(timestamp::date) as first_date
            FROM pageviews
            WHERE user_id IS NOT NULL
            GROUP BY user_id
          ) as first_visits
          WHERE first_date >= CURRENT_DATE - INTERVAL '60 days'
          GROUP BY first_date
          ORDER BY first_date DESC
          LIMIT 60
        `;
        // Retention: users returning the next day
        const retention = await sql`
          WITH days AS (
            SELECT user_id, timestamp::date as date
            FROM pageviews
            WHERE user_id IS NOT NULL
            GROUP BY user_id, date
          )
          SELECT 
            d1.date as date,
            COUNT(DISTINCT d1.user_id) as users,
            COUNT(DISTINCT d2.user_id) as retained
          FROM days d1
          LEFT JOIN days d2
            ON d1.user_id = d2.user_id
           AND d2.date = d1.date + INTERVAL '1 day'
          GROUP BY d1.date
          ORDER BY d1.date DESC
          LIMIT 60
        `;
        // Most Active Users at Once (per hour)
        const mostActive = await sql`
          SELECT 
            to_char(timestamp, 'YYYY-MM-DD HH24:00') as hour,
            COUNT(DISTINCT COALESCE(user_id, 0)) as users
          FROM pageviews
          GROUP BY hour
          ORDER BY users DESC
          LIMIT 1
        `;
        // Device/Browser Breakdown (last 60 days, if user_agent stored)
        const devices = await sql`
          SELECT user_agent, COUNT(*) as views
          FROM pageviews
          WHERE user_agent IS NOT NULL
          GROUP BY user_agent
          ORDER BY views DESC
          LIMIT 15
        `;

        return {
          totalPageviews: total,
          uniqueVisitors: unique_visitors,
          popularPages,
          recentVisits,
          dailyActiveUsers: dau,
          pageviewsPerDay,
          newUsersPerDay,
          retention,
          mostActive,
          devices,
        };
      }
      default:
        return { error: "Invalid action" };
    }
  } catch (error) {
    console.error("Analytics error:", error);
    return { error: "Failed to get analytics" };
  }
}

export async function POST(request) {
  try {
    const params = await request.json();
    const result = await handler(params);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}
