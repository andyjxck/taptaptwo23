"use client";
import { useEffect, useState } from "react";

export default function GlobalLeaderboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getMetrics" })
    })
      .then(res => res.json())
      .then(setData)
      .catch(() => setData({ error: "Failed to load data" }));
  }, []);

  if (!data) return <div>Loading...</div>;
  if (data.error) return <div>{data.error}</div>;

  return (
    <div>
      <div>Total Pageviews: {data.totalPageviews}</div>
      <div>Unique Visitors: {data.uniqueVisitors}</div>
      <h3>Popular Pages</h3>
      <ul>
        {data.popularPages.map((page, i) => (
          <li key={i}>{page.path}: {page.views}</li>
        ))}
      </ul>
      <h3>Recent Visits</h3>
      <ul>
        {data.recentVisits.map((visit, i) => (
          <li key={i}>
            {visit.timestamp} - {visit.page_path} - {visit.user_id} ({visit.referrer})
          </li>
        ))}
      </ul>
    </div>
  );
}