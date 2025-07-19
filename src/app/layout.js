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
    <>
      {/* This fixes Quirks Mode */}
      <Script id="doctype-fix" strategy="beforeInteractive">
        {`<!DOCTYPE html>`}
      </Script>

      <html lang="en">
        <head>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          />
        </head>
        <body className={inter.className}>
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9540548227467393"
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
          {children}
        </body>
      </html>
    </>
  )
}
