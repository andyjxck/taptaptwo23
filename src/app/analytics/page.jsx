"use client";
import React, { useState, useEffect, useRef } from "react";
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
  <div className={`rounded-3xl shadow-2xl bg-white/10 backdrop-blur-xl border border-purple-600/30 px-6 py-7 mb-7 transition-all duration-200 hover:scale-[1.02] ${className}`}>
    {children}
  </div>
);

function Tapalytics() {
  const [tab, setTab] = useState("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const drawerRef = useRef();

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
        () => fetchAnalytics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Focus trap for drawer
  useEffect(() => {
    if (drawerOpen && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [drawerOpen]);

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

  // Chart palette
  const mainColors = [
    "#b993ff", "#7e60e8", "#fee4fa", "#fa8eea", "#dbd4ff",
    "#a855f7", "#f6d365", "#fd6585", "#00c9ff", "#60a5fa",
    "#f472b6", "#fbbf24", "#818cf8"
  ];

  // Chart.js base options for readability
  const chartBase = {
    responsive: true,
    plugins: {
      legend: { display: true, labels: { color: "#eee", font: { size: 16, family: "inherit" } } },
      title: { display: false },
      tooltip: { enabled: true, backgroundColor: "#231937ee", titleFont: { size: 18 }, bodyFont: { size: 16 }, padding: 12, borderColor: "#fff", borderWidth: 1 }
    },
    scales: {
      x: { grid: { color: "#fff3", lineWidth: 1 }, ticks: { color: "#d1aafc", font: { size: 15 } } },
      y: { grid: { color: "#fff1", lineWidth: 1 }, ticks: { color: "#f3e8ff", font: { size: 15 } } }
    }
  };

  // Loading
  if (loading || !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center fade-gradient-bg">
        <div className="text-white text-3xl font-bold">Loading Tapalytics…</div>
      </div>
    );
  }

  // Drawer/Sidebar content
  const drawer = (
    <aside
      ref={drawerRef}
      tabIndex={0}
      className={`
        fixed top-0 right-0 z-40 h-full bg-gradient-to-bl from-[#2c1a47e0] via-[#a385f680] to-[#1b1033f8]
        border-l border-purple-500/40 shadow-2xl backdrop-blur-2xl
        w-full sm:w-[70vw] md:w-[420px]
        transition-transform duration-300
        ${drawerOpen ? "translate-x-0" : "translate-x-full"}
        flex flex-col
      `}
      style={{ outline: "none" }}
      onKeyDown={e => e.key === "Escape" && setDrawerOpen(false)}
      aria-modal="true"
      role="dialog"
    >
      <div className="flex flex-col items-end p-6 gap-3">
        <button
          className="text-purple-200 hover:text-white bg-purple-900/30 rounded-xl px-4 py-2 mb-4 shadow-lg text-xl"
          onClick={() => setDrawerOpen(false)}
          tabIndex={0}
        >✖</button>
        <h2 className="text-4xl font-black text-purple-200 tracking-tight mb-7 drop-shadow-xl"
            style={{ fontFamily: "Crimson Text, serif" }}>
          <span className="text-white">Tap</span>alytics
        </h2>
        <ul className="w-full flex flex-col gap-3">
          {TABS.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => { setTab(t.id); setDrawerOpen(false); }}
                className={`
                  w-full flex items-center px-4 py-4 rounded-2xl font-semibold text-xl transition-all
                  ${tab === t.id
                    ? "bg-gradient-to-r from-purple-500 via-purple-700 to-fuchsia-500 text-white shadow-xl scale-105"
                    : "bg-white/5 text-purple-100 hover:bg-fuchsia-500/30 hover:text-white"}
                `}
              >
                <span className="text-2xl mr-4">{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );

  // Overlay/backdrop for closing drawer
  const overlay = (
    <div
      className={`
        fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity
        ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
      `}
      onClick={() => setDrawerOpen(false)}
    />
  );

  // UI
  return (
    <div className="min-h-screen fade-gradient-bg flex flex-col relative transition-all">
      {/* Blurred glassy purple/blue background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/4 top-16 w-80 h-80 bg-purple-600 rounded-full opacity-25 blur-3xl" />
        <div className="absolute right-12 bottom-16 w-96 h-96 bg-fuchsia-500 rounded-full opacity-15 blur-2xl" />
        <div className="absolute left-8 bottom-36 w-44 h-44 bg-blue-400 rounded-full opacity-20 blur-2xl" />
        <div className="absolute right-32 top-6 w-32 h-32 bg-black rounded-full opacity-10 blur-xl" />
      </div>

      {/* Drawer button (right) */}
      <button
        className="fixed top-4 right-4 z-50 bg-gradient-to-tr from-purple-800 via-purple-600 to-fuchsia-600 text-white rounded-full shadow-2xl p-4 focus:ring-4 focus:ring-fuchsia-400 transition-all active:scale-95"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open Navigation Drawer"
        style={{ backdropFilter: "blur(8px)" }}
      >☰</button>

      {drawer}
      {overlay}

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-2 sm:px-6 md:px-10 py-10 z-10">
        <h1 className="text-[2.5rem] md:text-5xl font-black mb-10 text-white drop-shadow-xl tracking-tight"
          style={{ fontFamily: "Crimson Text, serif", letterSpacing: "-0.03em" }}>
          <span className="text-fuchsia-400">Tapalytics</span>
          <span className="text-white/70 font-semibold text-lg md:text-2xl ml-4">Real-Time Analytics</span>
        </h1>
        <AdBanner />

        {/* Tabs */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GlassCard>
              <h2 className="text-2xl font-extrabold mb-2 text-fuchsia-300">Overview</h2>
              <div className="text-purple-100 space-y-4 text-lg">
                <div className="flex justify-between items-center"><span>Total Pageviews</span><span className="font-black text-white">{n(metrics.totalPageviews)}</span></div>
                <div className="flex justify-between items-center"><span>Unique Visitors</span><span className="font-black text-white">{n(metrics.uniqueVisitors)}</span></div>
                <div className="flex justify-between items-center"><span>All-Time High DAU</span><span className="font-black text-white">{n(metrics.peakDAU)}</span></div>
                <div className="flex justify-between items-center"><span>Most Visited Page</span><span className="font-black text-white">{metrics.mostVisitedPage?.path ?? "-"} ({n(metrics.mostVisitedPage?.views)})</span></div>
                <div className="flex justify-between items-center"><span>Most Active User (Today)</span><span className="font-black text-white">{metrics.mostActiveUser?.user_id ?? "-"} ({n(metrics.mostActiveUser?.views)} views)</span></div>
                <div className="flex justify-between items-center"><span>New Users Today</span><span className="font-black text-white">{n(metrics.newUsersToday)}</span></div>
              </div>
            </GlassCard>
            <GlassCard>
              <h2 className="text-2xl font-extrabold mb-2 text-fuchsia-300">Popular Pages</h2>
              <ul className="text-purple-100 space-y-3 text-lg">
                {metrics.popularPages?.map((page, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{page.path}</span>
                    <span className="font-semibold">{n(page.views)} views</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
            <div className="md:col-span-2">
              <GlassCard>
                <h2 className="text-2xl font-extrabold mb-2 text-fuchsia-300">Recent Activity</h2>
                <div className="overflow-x-auto rounded-lg">
                  <table className="w-full text-purple-100 bg-white/5 rounded-xl">
                    <thead>
                      <tr className="text-fuchsia-200 text-left bg-purple-700/30">
                        <th className="pb-3 px-2">Time</th>
                        <th className="pb-3 px-2">Page</th>
                        <th className="pb-3 px-2">User ID</th>
                        <th className="pb-3 px-2">Referrer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(metrics.recentVisits ?? []).map((visit, index) => (
                        <tr key={index} className="border-t border-purple-800/20 hover:bg-fuchsia-700/15 transition-all">
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
              <h2 className="text-2xl font-extrabold mb-2 text-fuchsia-300">Daily Stats</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/10 rounded-2xl p-2 pb-4 shadow">
                  <Line
                    data={{
                      labels: dailyLabels,
                      datasets: [
                        { label: "Daily Active Users", data: dauData, borderWidth: 3, borderColor: mainColors[1], backgroundColor: "#a78bfa55", tension: 0.25, pointRadius: 6, pointBackgroundColor: mainColors[1], fill: true },
                        { label: "Pageviews", data: pvData, borderWidth: 3, borderColor: mainColors[3], backgroundColor: "#f472b633", tension: 0.25, pointRadius: 6, pointBackgroundColor: mainColors[3], fill: true },
                      ]
                    }}
                    options={{
                      ...chartBase,
                      plugins: { ...chartBase.plugins, legend: { ...chartBase.plugins.legend, labels: { color: "#fff", font: { weight: "bold", size: 17 } } } },
                      scales: { ...chartBase.scales, x: { ...chartBase.scales.x, ticks: { ...chartBase.scales.x.ticks, maxRotation: 0, minRotation: 0 } } }
                    }}
                  />
                </div>
                <div className="bg-white/10 rounded-2xl p-2 pb-4 shadow">
                  <Bar
                    data={{
                      labels: dailyLabels,
                      datasets: [
                        { label: "New Users", data: nuData, borderWidth: 2, backgroundColor: mainColors[7] },
                        { label: "Retention", data: retentionData, borderWidth: 2, backgroundColor: mainColors[2] },
                      ]
                    }}
                    options={{
                      ...chartBase,
                      plugins: { ...chartBase.plugins, legend: { ...chartBase.plugins.legend, labels: { color: "#fff", font: { weight: "bold", size: 17 } } } }
                    }}
                  />
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {tab === "users" && (
          <GlassCard>
            <h2 className="text-2xl font-extrabold mb-2 text-fuchsia-300">Users</h2>
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full text-purple-100 bg-white/5 rounded-xl">
                <thead>
                  <tr className="text-fuchsia-200 bg-purple-700/30">
                    <th className="pb-3 px-2">User ID</th>
                    <th className="pb-3 px-2">Views</th>
                    <th className="pb-3 px-2">First Visit</th>
                    <th className="pb-3 px-2">Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {(metrics.userStats ?? []).map((u, i) => (
                    <tr key={i} className="border-t border-purple-800/20 hover:bg-fuchsia-700/15 transition-all">
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
              <h2 className="text-2xl font-extrabold mb-2 text-fuchsia-300">Device Breakdown</h2>
              <div className="bg-white/10 rounded-2xl p-2 shadow flex items-center justify-center min-h-[300px]">
                <Pie
                  data={{
                    labels: devices.map(d => d.device),
                    datasets: [{ data: devices.map(d => d.count), backgroundColor: mainColors, borderWidth: 2 }]
                  }}
                  options={{
                    plugins: {
                      legend: { display: true, position: "right", labels: { color: "#fff", font: { size: 18 } } },
                      tooltip: { ...chartBase.plugins.tooltip, titleFont: { size: 20 }, bodyFont: { size: 17 } }
                    }
                  }}
                />
              </div>
            </GlassCard>
            <GlassCard>
              <h2 className="text-2xl font-extrabold mb-2 text-fuchsia-300">Browser Breakdown</h2>
              <div className="bg-white/10 rounded-2xl p-2 shadow flex items-center justify-center min-h-[300px]">
                <Pie
                  data={{
                    labels: browsers.map(b => b.browser),
                    datasets: [{ data: browsers.map(b => b.count), backgroundColor: mainColors, borderWidth: 2 }]
                  }}
                  options={{
                    plugins: {
                      legend: { display: true, position: "right", labels: { color: "#fff", font: { size: 18 } } },
                      tooltip: { ...chartBase.plugins.tooltip, titleFont: { size: 20 }, bodyFont: { size: 17 } }
                    }
                  }}
                />
              </div>
            </GlassCard>
          </div>
        )}

        {tab === "log" && (
          <GlassCard>
            <h2 className="text-2xl font-extrabold mb-2 text-fuchsia-300">Full Activity Log</h2>
            <div className="overflow-x-auto max-h-[500px] rounded-lg">
              <table className="w-full text-purple-100 bg-white/5 rounded-xl">
                <thead>
                  <tr className="text-fuchsia-200 bg-purple-700/30">
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
                    <tr key={index} className="border-t border-purple-800/20 hover:bg-fuchsia-700/15 transition-all">
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

      {/* Styles: deep glass, purple/black, smooth, overlay */}
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
        /* Hide scrollbar but keep scrolling smooth */
        ::-webkit-scrollbar { width: 10px; background: #232043;}
        ::-webkit-scrollbar-thumb { background: #7c3aedbb; border-radius: 5px;}
        ::selection { background: #a21caf88; }
      `}</style>
    </div>
  );
}
export default Tapalytics;
