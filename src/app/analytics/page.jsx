"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utilities/supabaseClient";
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
  <div className={`rounded-3xl shadow-2xl bg-white/10 backdrop-blur-2xl border border-purple-700/30 px-5 py-6 mb-4 transition-all duration-200 ${className}`}>
    {children}
  </div>
);

function Tapalytics() {
  const [tab, setTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch metrics
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getFullMetrics" }),
      });
      const data = await response.json();
      setMetrics(data);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics(); // Initial fetch

    // Realtime subscription for new pageviews
    const channel = supabase
      .channel("realtime:public:pageviews")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pageviews" },
        (payload) => fetchAnalytics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Helpers
  const n = (val) => new Intl.NumberFormat().format(val ?? 0);
  const d = (date) => new Date(date).toLocaleString();

  // Chart Data
  const dailyLabels = metrics?.daily?.map((d) => d.day) || [];
  const dauData = metrics?.daily?.map((d) => d.active_users) || [];
  const pvData = metrics?.daily?.map((d) => d.pageviews) || [];
  const nuData = metrics?.daily?.map((d) => d.new_users) || [];
  const retentionData = metrics?.retention?.map((d) => d.retained) || [];

  const devices = metrics?.deviceBreakdown || [];
  const browsers = metrics?.browserBreakdown || [];

  // Loading
  if (loading || !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center fade-gradient-bg">
        <div className="text-white text-2xl">Loading Tapalytics…</div>
      </div>
    );
  }

  // UI
  return (
    <div className="min-h-screen fade-gradient-bg flex flex-col md:flex-row relative transition-all">
      {/* Blurred pastel, purple & black glassy background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/4 top-12 w-56 h-56 bg-purple-700 rounded-full opacity-30 blur-3xl" />
        <div className="absolute right-8 bottom-12 w-60 h-60 bg-purple-900 rounded-full opacity-20 blur-2xl" />
        <div className="absolute left-4 bottom-24 w-32 h-32 bg-purple-400 rounded-full opacity-20 blur-2xl" />
        <div className="absolute right-24 top-2 w-24 h-24 bg-black rounded-full opacity-10 blur-xl" />
      </div>

      {/* Collapsible Sidebar */}
      <aside className={`
        z-20 md:w-72 w-full md:relative fixed md:sticky top-0 left-0 h-full
        ${sidebarOpen ? "block" : "hidden md:block"}
        bg-gradient-to-br from-purple-900/60 to-black/50 backdrop-blur-2xl border-r border-purple-800/30 shadow-2xl
        transition-all duration-300 ease-in-out
      `}>
        <div className="flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start p-6 gap-3">
          <button
            className="block md:hidden text-purple-200 bg-purple-900/30 rounded-xl px-3 py-2 mb-4 shadow"
            onClick={() => setSidebarOpen(false)}
          >✖</button>
          <h2 className="text-3xl font-bold text-purple-200 tracking-tight mb-5 drop-shadow-xl"
              style={{ fontFamily: "Crimson Text, serif" }}>
            <span className="text-white">Tap</span>alytics
          </h2>
          <ul className="flex flex-row md:flex-col gap-2 w-full">
            {TABS.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => { setTab(t.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center px-4 py-3 rounded-xl font-semibold text-lg transition-colors duration-200
                    ${tab === t.id
                      ? "bg-purple-700/80 text-white shadow"
                      : "text-purple-200 hover:bg-purple-600/40 hover:text-white"}`}
                >
                  <span className="text-xl mr-3">{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      {/* Open Sidebar FAB */}
      <button
        className="fixed top-4 left-4 z-30 bg-purple-800/90 hover:bg-purple-700/90 text-white rounded-full shadow-xl p-3 md:hidden transition-all"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open Sidebar"
        style={{ backdropFilter: "blur(8px)" }}
      >☰</button>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-2 md:px-10 py-10">
        <h1 className="text-[2.3rem] md:text-5xl font-bold mb-8 text-white drop-shadow-xl"
          style={{ fontFamily: "Crimson Text, serif" }}>
          <span className="text-purple-400">Tapalytics</span> <span className="text-white/80 font-normal text-xl md:text-2xl">— Real-Time Analytics</span>
        </h1>
        <AdBanner />
        {/* Tabs */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GlassCard>
              <h2 className="text-2xl font-bold mb-2 text-purple-300">Overview</h2>
              <div className="text-purple-100 space-y-3 text-lg">
                <div className="flex justify-between items-center"><span>Total Pageviews</span><span className="font-bold text-white">{n(metrics.totalPageviews)}</span></div>
                <div className="flex justify-between items-center"><span>Unique Visitors</span><span className="font-bold text-white">{n(metrics.uniqueVisitors)}</span></div>
                <div className="flex justify-between items-center"><span>All-Time High DAU</span><span className="font-bold text-white">{n(metrics.peakDAU)}</span></div>
                <div className="flex justify-between items-center"><span>Most Visited Page</span><span className="font-bold text-white">{metrics.mostVisitedPage?.path ?? "-"} ({n(metrics.mostVisitedPage?.views)})</span></div>
                <div className="flex justify-between items-center"><span>Most Active User (Today)</span><span className="font-bold text-white">{metrics.mostActiveUser?.user_id ?? "-"} ({n(metrics.mostActiveUser?.views)} views)</span></div>
                <div className="flex justify-between items-center"><span>New Users Today</span><span className="font-bold text-white">{n(metrics.newUsersToday)}</span></div>
              </div>
            </GlassCard>
            <GlassCard>
              <h2 className="text-2xl font-bold mb-2 text-purple-300">Popular Pages</h2>
              <ul className="text-purple-100 space-y-2 text-lg">
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
                <h2 className="text-2xl font-bold mb-2 text-purple-300">Recent Activity</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-purple-100">
                    <thead>
                      <tr className="text-purple-200 text-left bg-purple-700/30">
                        <th className="pb-3 px-2">Time</th>
                        <th className="pb-3 px-2">Page</th>
                        <th className="pb-3 px-2">User ID</th>
                        <th className="pb-3 px-2">Referrer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(metrics.recentVisits ?? []).map((visit, index) => (
                        <tr key={index} className="border-t border-purple-800/20 hover:bg-purple-800/20">
                          <td className="py-2 px-2">{d(visit.timestamp)}</td>
                          <td className="py-2 px-2">{visit.page_path}</td>
                          <td className="py-2 px-2">{visit.user_id}</td>
                          <td className="py-2 px-2">{visit.referrer}</td>
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
          <div className="grid grid-cols-1 gap-8">
            <GlassCard>
              <h2 className="text-2xl font-bold mb-2 text-purple-300">Daily Stats</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <Line
                    data={{
                      labels: dailyLabels,
                      datasets: [
                        { label: "Daily Active Users", data: dauData, borderWidth: 2, tension: 0.25 },
                        { label: "Pageviews", data: pvData, borderWidth: 2, tension: 0.25 },
                      ]
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: true, labels: { color: "#fff" } } },
                      scales: { x: { ticks: { color: "#c4b5fd" } }, y: { ticks: { color: "#c4b5fd" } } }
                    }}
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
                    options={{
                      responsive: true,
                      plugins: { legend: { display: true, labels: { color: "#fff" } } },
                      scales: { x: { ticks: { color: "#c4b5fd" } }, y: { ticks: { color: "#c4b5fd" } } }
                    }}
                  />
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {tab === "users" && (
          <GlassCard>
            <h2 className="text-2xl font-bold mb-2 text-purple-300">Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-purple-100">
                <thead>
                  <tr className="text-purple-200 bg-purple-700/30">
                    <th className="pb-3 px-2">User ID</th>
                    <th className="pb-3 px-2">Views</th>
                    <th className="pb-3 px-2">First Visit</th>
                    <th className="pb-3 px-2">Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {(metrics.userStats ?? []).map((u, i) => (
                    <tr key={i} className="border-t border-purple-800/20 hover:bg-purple-800/20">
                      <td className="py-2 px-2">{u.user_id}</td>
                      <td className="py-2 px-2">{n(u.views)}</td>
                      <td className="py-2 px-2">{d(u.first_visit)}</td>
                      <td className="py-2 px-2">{d(u.last_visit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {tab === "devices" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GlassCard>
              <h2 className="text-2xl font-bold mb-2 text-purple-300">Device Breakdown</h2>
              <Pie
                data={{
                  labels: devices.map(d => d.device),
                  datasets: [{ data: devices.map(d => d.count), borderWidth: 2 }]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: true, labels: { color: "#fff" } } }
                }}
              />
            </GlassCard>
            <GlassCard>
              <h2 className="text-2xl font-bold mb-2 text-purple-300">Browser Breakdown</h2>
              <Pie
                data={{
                  labels: browsers.map(b => b.browser),
                  datasets: [{ data: browsers.map(b => b.count), borderWidth: 2 }]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: true, labels: { color: "#fff" } } }
                }}
              />
            </GlassCard>
          </div>
        )}

        {tab === "log" && (
          <GlassCard>
            <h2 className="text-2xl font-bold mb-2 text-purple-300">Full Activity Log</h2>
            <div className="overflow-x-auto max-h-[450px]">
              <table className="w-full text-purple-100">
                <thead>
                  <tr className="text-purple-200 bg-purple-700/30">
                    <th className="pb-3 px-2">Time</th>
                    <th className="pb-3 px-2">Page</th>
                    <th className="pb-3 px-2">User ID</th>
                    <th className="pb-3 px-2">Referrer</th>
                    <th className="pb-3 px-2">Device</th>
                    <th className="pb-3 px-2">Browser</th>
                  </tr>
                </thead>
                <tbody>
                  {(metrics.fullLog ?? []).map((visit, index) => (
                    <tr key={index} className="border-t border-purple-800/20 hover:bg-purple-800/20">
                      <td className="py-2 px-2">{d(visit.timestamp)}</td>
                      <td className="py-2 px-2">{visit.page_path}</td>
                      <td className="py-2 px-2">{visit.user_id}</td>
                      <td className="py-2 px-2">{visit.referrer}</td>
                      <td className="py-2 px-2">{visit.device ?? "-"}</td>
                      <td className="py-2 px-2">{visit.browser ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </main>

      {/* Styles: deep glass, purple/black, smooth */}
      <style>{`
        .fade-gradient-bg {
          position: relative;
          min-height: 100vh;
          width: 100%;
          background: linear-gradient(135deg, #25143a, #350057 60%, #100018);
          animation: pastel-cycle 45s ease-in-out infinite;
          background-size: 400% 400%;
        }
        @keyframes pastel-cycle {
          0%   { background: linear-gradient(135deg,#25143a,#350057 60%,#100018);}
          16%  { background: linear-gradient(120deg,#3b0764,#a21caf,#000);}
          33%  { background: linear-gradient(120deg,#4c1d95,#000,#be185d);}
          50%  { background: linear-gradient(135deg,#312e81,#0a0036,#be185d);}
          66%  { background: linear-gradient(120deg,#581c87,#1e293b,#000);}
          83%  { background: linear-gradient(120deg,#350057,#000,#a21caf);}
          100% { background: linear-gradient(135deg,#25143a,#350057 60%,#100018);}
        }
        html, body {
          background: #181024 !important;
        }
      `}</style>
    </div>
  );
}
export default Tapalytics;
