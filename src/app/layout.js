import { Inter } from 'next/font/google'
import './globals.css'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Tap Tap: Two',
  description: 'an andysocial game',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-3535780178030938" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3535780178030938"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className}>
        {/* AdSense Banner */}
        <ins className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-3535780178030938"
          data-ad-slot="1313217052"
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
        <Script id="ads-init" strategy="afterInteractive">
          {(adsbygoogle = window.adsbygoogle || []).push({})}
        </Script>

        {children}
      </body>
    </html>
  )
}
