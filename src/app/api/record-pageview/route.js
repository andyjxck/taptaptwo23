import { sql } from '../auth-handler/db';

async function handler({ page_path, user_id, user_agent, referrer }) {
  try {
    // Validate and sanitize page_path
    if (!page_path) {
      console.error("Received undefined or empty page_path");
      return { error: "Page path is required" };
    }

    // Ensure page_path is a string and starts with /
    const sanitizedPath = page_path.toString().startsWith("/")
      ? page_path.toString()
      : `/${page_path.toString()}`;

    // Record the pageview with sanitized path
    await sql`
      INSERT INTO pageviews (page_path, user_id, user_agent, referrer)
      VALUES (${sanitizedPath}, ${user_id || null}, ${user_agent || null}, ${
      referrer || null
    })
    `;

    return { success: true };
  } catch (error) {
    console.error("Error recording pageview:", error, {
      page_path,
      user_id,
      user_agent,
      referrer,
    });
    return { error: "Failed to record pageview" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}