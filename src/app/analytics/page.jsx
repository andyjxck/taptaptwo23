"use client";
import React, { useState, useEffect } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import AdBanner from "@/components/AdBanner";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const TABS = [
  { id: "overview", label: "Overview", emoji: "📊" },
  { id: "trends", label: "Trends", emoji: "📈" },
  { id: "users", label: "Users", emoji: "🧑‍🤝‍🧑" },
  { id: "devices", label: "Devices", emoji: "💻" },
  { id: "log", label: "Activity Log", emoji: "📜" },
];

const GlassCard = ({ children, className = "" }) => (
  <div className={`rounded-3xl shadow-2xl bg-white/20 backdrop-blur-xl border border-white/40 px-4 py-5 mb-3 ${className}`}>
    {children}
  </div>
);

function AnalyticsPage() {
  const [tab, setTab] = useState("overview");
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const response = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getFullMetrics" }),
      });
      const data = await response.json();
      setMetrics(data);
      setLoading(false);
    };
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center fade-gradient-bg">
        <div className="text-white text-2xl">Loading analytics…</div>
      </div>
    );
  }

  // Helpers
  const n = (val) => new Intl.NumberFormat().format(val ?? 0);
  const d = (date) => new Date(date).toLocaleString();

  // Chart Data
  const dailyLabels = metrics.daily?.map((d) => d.day) || [];
  const dauData = metrics.daily?.map((d) => d.active_users) || [];
  const pvData = metrics.daily?.map((d) => d.pageviews) || [];
  const nuData = metrics.daily?.map((d) => d.new_users) || [];
  const retentionData = metrics.retention?.map((d) => d.retained) || [];

  // Device breakdown
  const devices = metrics.deviceBreakdown || [];
  const browsers = metrics.browserBreakdown || [];

  // Sidebar nav
  return (
    <div className="min-h-screen fade-gradient-bg flex flex-col md:flex-row relative">
      {/* Blurred pastel background (reuse your Notice Board style) */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/4 top-12 w-56 h-56 bg-pink-300 rounded-full opacity-20 blur-3xl" />
        <div className="absolute right-8 bottom-12 w-60 h-60 bg-purple-400 rounded-full opacity-15 blur-2xl" />
        <div className="absolute left-4 bottom-24 w-32 h-32 bg-blue-200 rounded-full opacity-20 blur-2xl" />
      </div>
      {/* Sidebar */}
      <aside className="z-10 w-full md:w-64 bg-white/10 backdrop-blur-2xl border-r border-white/20 md:min-h-screen px-2 py-8 flex flex-row md:flex-col gap-2 md:gap-3 sticky top-0">
        <ul className="flex flex-row md:flex-col gap-2 w-full">
          {TABS.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center px-4 py-3 rounded-xl font-semibold text-lg transition-colors duration-200 
                  ${tab === t.id
                    ? "bg-white/70 text-purple-900 shadow"
                    : "text-gray-700 hover:bg-white/30"}`}
              >
                <span className="text-xl mr-3">{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main content area */}
      <main className="flex-1 max-w-6xl mx-auto px-2 md:px-8 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6" style={{fontFamily: "Crimson Text, serif"}}>
          Analytics Dashboard
        </h1>
        <AdBanner />
        {/* Tabs */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard>
              <h2 className="text-2xl font-bold mb-2 text-purple-900">Overview</h2>
              <div className="text-white space-y-2">
                <div className="flex justify-between items-center"><span>Total Pageviews</span><span className="font-bold">{n(metrics.totalPageviews)}</span></div>
                <div className="flex justify-between items-center"><span>Unique Visitors</span><span className="font-bold">{n(metrics.uniqueVisitors)}</span></div>
                <div className="flex justify-between items-center"><span>All-Time High DAU</span><span className="font-bold">{n(metrics.peakDAU)}</span></div>
                <div className="flex justify-between items-center"><span>Most Visited Page</span><span className="font-bold">{metrics.mostVisitedPage?.path ?? "-"} ({n(metrics.mostVisitedPage?.views)})</span></div>
                <div className="flex justify-between items-center"><span>Most Active User (Today)</span><span className="font-bold">{metrics.mostActiveUser?.user_id ?? "-"} ({n(metrics.mostActiveUser?.views)} views)</span></div>
                <div className="flex justify-between items-center"><span>New Users Today</span><span className="font-bold">{n(metrics.newUsersToday)}</span></div>
              </div>
            </GlassCard>
            <GlassCard>
              <h2 className="text-2xl font-bold mb-2 text-purple-900">Popular Pages</h2>
              <ul className="text-white space-y-1">
                {metrics.popularPages?.map((page, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{page.path}</span>
                    <span>{n(page.views)} views</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
            <div className="md:col-span-2">
              <GlassCard>
                <h2 className="text-2xl font-bold mb-2 text-purple-900">Recent Activity</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="text-white/90 text-left">
                        <th className="pb-3">Time</th>
                        <th className="pb-3">Page</th>
                        <th className="pb-3">User ID</th>
                        <th className="pb-3">Referrer</th>
                      </tr>
                    </thead>
                    <tbody className="text-white/80">
                      {(metrics.recentVisits ?? []).map((visit, index) => (
                        <tr key={index} className="border-t border-white/10">
                          <td className="py-2">{d(visit.timestamp)}</td>
                          <td className="py-2">{visit.page_path}</td>
                          <td className="py-2">{visit.user_id}</td>
                          <td className="py-2">{visit.referrer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {tab === "trends" && (
          <div className="grid grid-cols-1 gap-6">
            <GlassCard>
              <h2 className="text-2xl font-bold mb-2 text-purple-900">Daily Stats</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Line
                    data={{
                      labels: dailyLabels,
                      datasets: [
                        { label: "Daily Active Users", data: dauData, borderWidth: 2 },
                        { label: "Pageviews", data: pvData, borderWidth: 2 },
                      ]
                    }}
                    options={{ responsive: true, plugins: { legend: { display: true } } }}
                  />
                </div>
                <div>
                  <Bar
                    data={{
                      labels: dailyLabels,
                      datasets: [
                        { label: "New Users", data: nuData, borderWidth: 2 },
                        { label: "Retention", data: retentionData, borderWidth: 2 },
                      ]
                    }}
                    options={{ responsive: true, plugins: { legend: { display: true } } }}
                  />
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {tab === "users" && (
          <GlassCard>
            <h2 className="text-2xl font-bold mb-2 text-purple-900">Users</h2>
            <table className="w-full text-white">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Views</th>
                  <th>First Visit</th>
                  <th>Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {(metrics.userStats ?? []).map((u, i) => (
                  <tr key={i} className="border-t border-white/10">
                    <td>{u.user_id}</td>
                    <td>{n(u.views)}</td>
                    <td>{d(u.first_visit)}</td>
                    <td>{d(u.last_visit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}

        {tab === "devices" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard>
              <h2 className="text-2xl font-bold mb-2 text-purple-900">Device Breakdown</h2>
              <Pie
                data={{
                  labels: devices.map(d => d.device),
                  datasets: [{ data: devices.map(d => d.count), borderWidth: 2 }]
                }}
                options={{ responsive: true, plugins: { legend: { display: true } } }}
              />
            </GlassCard>
            <GlassCard>
              <h2 className="text-2xl font-bold mb-2 text-purple-900">Browser Breakdown</h2>
              <Pie
                data={{
                  labels: browsers.map(b => b.browser),
                  datasets: [{ data: browsers.map(b => b.count), borderWidth: 2 }]
                }}
                options={{ responsive: true, plugins: { legend: { display: true } } }}
              />
            </GlassCard>
          </div>
        )}

        {tab === "log" && (
          <GlassCard>
            <h2 className="text-2xl font-bold mb-2 text-purple-900">Full Activity Log</h2>
            <div className="overflow-x-auto max-h-[450px]">
              <table className="w-full text-white">
                <thead>
                  <tr className="text-white/90 text-left">
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Page</th>
                    <th className="pb-3">User ID</th>
                    <th className="pb-3">Referrer</th>
                    <th className="pb-3">Device</th>
                    <th className="pb-3">Browser</th>
                  </tr>
                </thead>
                <tbody className="text-white/80">
                  {(metrics.fullLog ?? []).map((visit, index) => (
                    <tr key={index} className="border-t border-white/10">
                      <td className="py-2">{d(visit.timestamp)}</td>
                      <td className="py-2">{visit.page_path}</td>
                      <td className="py-2">{visit.user_id}</td>
                      <td className="py-2">{visit.referrer}</td>
                      <td className="py-2">{visit.device ?? "-"}</td>
                      <td className="py-2">{visit.browser ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </main>
      {/* Fade background styling */}
      <style>{`
        .fade-gradient-bg {
          position: relative;
          min-height: 100vh;
          width: 100%;
          background: linear-gradient(135deg, #7c3aed, #4c1d95, #a21caf);
          animation: pastel-cycle 40s ease-in-out infinite;
          background-size: 400% 400%;
        }
        @keyframes pastel-cycle {
          0% { background: linear-gradient(135deg, #7c3aed, #4c1d95, #a21caf);}
          16%{ background:linear-gradient(120deg,#2563eb,#a21caf,#ca8a04);}
          33%{ background:linear-gradient(120deg,#f59e42,#78350f,#2563eb);}
          50%{ background:linear-gradient(135deg,#c026d3,#52525b,#0ea5e9);}
          66%{ background:linear-gradient(120deg,#7c3aed,#0ea5e9,#be185d);}
          83%{ background:linear-gradient(120deg,#a21caf,#ca8a04,#2563eb);}
          100%{ background:linear-gradient(135deg,#7c3aed,#4c1d95,#a21caf);}
        }
      `}</style>
    </div>
  );
}
export default AnalyticsPage;
