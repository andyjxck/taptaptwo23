import { Inter } from 'next/font/google'
import './globals.css'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'The Andysocial Zone',
  description:
    'Explore Game Void, Social Void, Zen Void, and more — creations by Andrew Blewett.',
  openGraph: {
    title: 'The Andysocial Zone',
    description:
      'Explore Game Void, Social Void, Zen Void, and more — creations by Andrew Blewett.',
    url: 'https://theandysocialzone.com', // ← replace with your actual domain
    siteName: 'The Andysocial Zone',
    images: [
      {
        url: '/social-preview.png', // put this image in your /public folder
        width: 1200,
        height: 630,
        alt: 'The Andysocial Zone preview',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Andysocial Zone',
    description:
      'Explore Game Void, Social Void, Zen Void, and more — creations by Andrew Blewett.',
    images: ['/social-preview.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />

        {/* Ezoic script */}
        <Script
          async
          src="//www.ezojs.com/ezoic/sa.min.js"
          strategy="afterInteractive"
        />
        <Script id="ezstandalone-init" strategy="afterInteractive">
          {`
            window.ezstandalone = window.ezstandalone || {};
            ezstandalone.cmd = ezstandalone.cmd || [];
          `}
        </Script>
      </head>

      <body className={inter.className}>{children}</body>
    </html>
  )
}
