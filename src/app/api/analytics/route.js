import { sql } from "../auth-handler/db";

async function handler({ action }) {
  try {
    switch (action) {
      case "getFullMetrics": {
        // Helper: Always return an array, even if .rows or direct array
        const arr = (val) =>
          Array.isArray(val) ? val : (val?.rows ? val.rows : []);

        // Daily users & pageviews (last 30 days)
        const dailyRaw = await sql`
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
        const daily = arr(dailyRaw);

        // Retention: Users who came back the next day (simple)
        const retentionRaw = await sql`
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
        const retention = arr(retentionRaw);

        // All-Time High DAU
        const peakDAUResult = arr(await sql`
          SELECT COUNT(DISTINCT user_id) as peak_dau, to_char(date_trunc('day', timestamp), 'YYYY-MM-DD') as day
          FROM pageviews
          GROUP BY day
          ORDER BY peak_dau DESC
          LIMIT 1
        `);
        const peakDAU = peakDAUResult[0]?.peak_dau ?? 0;

        // Most Visited Page
        const mostVisitedPageResult = arr(await sql`
          SELECT page_path as path, COUNT(*) as views
          FROM pageviews
          GROUP BY page_path
          ORDER BY views DESC
          LIMIT 1
        `);
        const mostVisitedPage = mostVisitedPageResult[0] || {};

        // Most Active User Today
        const mostActiveUserResult = arr(await sql`
          SELECT user_id, COUNT(*) as views
          FROM pageviews
          WHERE date_trunc('day', timestamp) = date_trunc('day', now())
          GROUP BY user_id
          ORDER BY views DESC
          LIMIT 1
        `);
        const mostActiveUser = mostActiveUserResult[0] || {};

        // New Users Today
        const newUsersTodayResult = arr(await sql`
          SELECT COUNT(DISTINCT user_id) as new_users_today
          FROM (
            SELECT user_id, MIN(timestamp) as first_visit
            FROM pageviews
            GROUP BY user_id
          ) as firsts
          WHERE date_trunc('day', first_visit) = date_trunc('day', now())
        `);
        const newUsersToday = newUsersTodayResult[0]?.new_users_today ?? 0;

        // Device breakdown
        const deviceBreakdown = arr(await sql`
          SELECT COALESCE(device, 'Unknown') as device, COUNT(*) as count
          FROM pageviews
          GROUP BY device
        `);

        // Browser breakdown
        const browserBreakdown = arr(await sql`
          SELECT COALESCE(browser, 'Unknown') as browser, COUNT(*) as count
          FROM pageviews
          GROUP BY browser
        `);

        // Popular Pages
        const popularPages = arr(await sql`
          SELECT page_path as path, COUNT(*) as views 
          FROM pageviews 
          GROUP BY page_path 
          ORDER BY views DESC 
          LIMIT 10
        `);

        // Recent Visits (for log)
        const recentVisits = arr(await sql`
          SELECT 
            timestamp, 
            page_path, 
            CASE 
              WHEN user_id IS NULL THEN 'Anonymous'
              ELSE user_id::text
            END as user_id,
            COALESCE(referrer, 'Direct') as referrer
          FROM pageviews 
          ORDER BY timestamp DESC 
          LIMIT 30
        `);

        // User stats
        const userStats = arr(await sql`
          SELECT user_id, COUNT(*) as views,
            MIN(timestamp) as first_visit,
            MAX(timestamp) as last_visit
          FROM pageviews
          GROUP BY user_id
          ORDER BY views DESC
          LIMIT 30
        `);

        // Full log for activity log (truncate if too long)
        const fullLog = arr(await sql`
          SELECT 
            timestamp, page_path, user_id, referrer, device, browser
          FROM pageviews
          ORDER BY timestamp DESC
          LIMIT 300
        `);

        // Overall
        const totalResult = arr(await sql`
          SELECT COUNT(*) as total FROM pageviews
        `);
        const totalPageviews = totalResult[0]?.total ?? 0;

        const uniqueResult = arr(await sql`
          SELECT COUNT(DISTINCT user_id) as unique_visitors 
          FROM pageviews
        `);
        const uniqueVisitors = uniqueResult[0]?.unique_visitors ?? 0;

        return {
          daily,
          retention,
          peakDAU,
          mostVisitedPage,
          mostActiveUser,
          newUsersToday,
          deviceBreakdown,
          browserBreakdown,
          popularPages,
          recentVisits,
          userStats,
          fullLog,
          totalPageviews,
          uniqueVisitors
        };
      }
      default:
        return { error: "Invalid action" };
    }
  } catch (error) {
    console.error("Analytics error:", error);
    return { error: "Failed to get analytics", details: error.message };
  }
}

// --- Next.js API route POST ---
export async function POST(request) {
  try {
    const result = await handler(await request.json());
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
