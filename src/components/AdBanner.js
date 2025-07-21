// src/components/AdBanner.js
import Script from 'next/script'
import { useEffect } from 'react'

export default function AdBanner() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('Adsbygoogle push failed', e);
    }
  }, []);

  return (
    <>
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-9540548227467393"
           data-ad-slot="9852599351"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9540548227467393"
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
    </>
  );
}
