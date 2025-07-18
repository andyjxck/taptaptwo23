import { sql } from '../auth-handler/db';

async function handler(req) {
  const { userId, feedback } = req;

  if (!userId || !feedback) {
    return {
      success: false,
      error: "Missing fields",
    };
  }

  try {
    // First verify the user exists
    const userQuery = await sql`
      SELECT user_id FROM users WHERE user_id = ${userId}
    `;

    if (userQuery.length === 0) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Insert the feedback
    const result = await sql`
      INSERT INTO feedback (userid, feedback)
      VALUES (${userId}, ${feedback})
      RETURNING userid, feedback
    `;

    if (!result || result.length === 0) {
      return {
        success: false,
        error: "Failed to save feedback",
      };
    }

    return {
      success: true,
      data: result[0],
    };
  } catch (error) {
    console.error("DB Error:", error);
    return {
      success: false,
      error: "Database error",
      details: error.message,
    };
  }
}

function MainComponent() {
  const [metrics, setMetrics] = useState({
    totalPageviews: 0,
    uniqueVisitors: 0,
    popularPages: [],
    recentVisits: [],
    lastUpdated: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPath = (path) => {
    if (!path) return "unknown";
    return path.replace(/^\//, "").replace(/-/g, " ") || "home";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#c084fc] via-[#a78bfa] to-[#7c3aed] flex items-center justify-center">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#c084fc] via-[#a78bfa] to-[#7c3aed] flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#c084fc] via-[#a78bfa] to-[#7c3aed] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-crimson-text text-white">
            Analytics Dashboard
          </h1>
          <div className="text-white/80 text-sm">
            Last updated: {formatDate(metrics.lastUpdated)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30">
            <h2 className="text-2xl font-crimson-text text-white mb-4">
              Overview
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/90">Total Pageviews</span>
                <span className="text-white font-bold text-xl">
                  {formatNumber(metrics.totalPageviews)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/90">Unique Visitors</span>
                <span className="text-white font-bold text-xl">
                  {formatNumber(metrics.uniqueVisitors)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30">
            <h2 className="text-2xl font-crimson-text text-white mb-4">
              Popular Pages
            </h2>
            <div className="space-y-3">
              {metrics.popularPages.map((page, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-white/90 capitalize">
                    {formatPath(page.page_path)}
                  </span>
                  <span className="text-white">
                    {formatNumber(page.views)} views
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-white/30 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30">
            <h2 className="text-2xl font-crimson-text text-white mb-4">
              Recent Activity
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-white/90 text-left">
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Page</th>
                    <th className="pb-3">User ID</th>
                    <th className="pb-3">Referrer</th>
                  </tr>
                </thead>
                <tbody className="text-white/80">
                  {metrics.recentVisits.map((visit, index) => (
                    <tr key={index} className="border-t border-white/10">
                      <td className="py-2">{formatDate(visit.timestamp)}</td>
                      <td className="py-2 capitalize">
                        {formatPath(visit.page_path)}
                      </td>
                      <td className="py-2">{visit.user_id || "Anonymous"}</td>
                      <td className="py-2">{visit.referrer || "Direct"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export async function POST(request) {
  try {
    const result = await handler(await request.json());
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("API error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Server error", details: err.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
}
