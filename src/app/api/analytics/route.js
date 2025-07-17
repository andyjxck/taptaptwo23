import { sql } from "../auth-handler/db"; // Adjust path if needed

async function handler({ action }) {
  try {
    switch (action) {
      case "getMetrics": {
        // Your database code here (unchanged)
        const totalResult = await sql`
          SELECT COUNT(*) as total FROM pageviews
        `;
        const totalPageviews = totalResult[0].total;

        const uniqueResult = await sql`
          SELECT COUNT(DISTINCT COALESCE(user_id, 0)) as unique_visitors 
          FROM pageviews
        `;
        const uniqueVisitors = uniqueResult[0].unique_visitors;

        const popularPages = await sql`
          SELECT page_path as path, COUNT(*) as views 
          FROM pageviews 
          GROUP BY page_path 
          ORDER BY views DESC 
          LIMIT 5
        `;

        const recentVisits = await sql`
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
          LIMIT 10
        `;

        return {
          totalPageviews,
          uniqueVisitors,
          popularPages,
          recentVisits,
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
  const result = await handler(await request.json());
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}
