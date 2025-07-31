import { createClient } from "@supabase/supabase-js";

// This assumes you have your keys as env vars or use your existing setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function logPageview({ userId, pagePath, referrer }) {
  // Simple device & browser detection (improve as needed)
  let device = "unknown";
  if (typeof window !== "undefined") {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua)) {
      device = "mobile";
    } else {
      device = "desktop";
    }
  }
  let browser = "unknown";
  if (typeof window !== "undefined") {
    if (navigator.userAgent.indexOf("Chrome") !== -1) browser = "Chrome";
    else if (navigator.userAgent.indexOf("Safari") !== -1) browser = "Safari";
    else if (navigator.userAgent.indexOf("Firefox") !== -1) browser = "Firefox";
    else if (navigator.userAgent.indexOf("MSIE") !== -1 || !!document.documentMode) browser = "IE";
    else browser = "Other";
  }

  // Default pagePath if not given
  if (!pagePath && typeof window !== "undefined") {
    pagePath = window.location.pathname;
  }
  // Default referrer if not given
  if (!referrer && typeof document !== "undefined") {
    referrer = document.referrer || null;
  }

  await supabase.from("pageviews").insert({
    user_id: userId || null,
    page_path: pagePath,
    referrer,
    device,
    browser,
    timestamp: new Date().toISOString(),
  });
}
