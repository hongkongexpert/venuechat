import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'VenueChat — Find the perfect space in Hong Kong',
  description:
    'VenueChat is an AI-powered platform to discover and book unique venues in Hong Kong — from rooftop cocktail bars to intimate wedding banquet halls.',
  generator: 'v0.app',
  metadataBase: new URL('https://venuechat.hk'),
  openGraph: {
    title: 'VenueChat — Find the perfect space in Hong Kong',
    description: 'AI-powered venue discovery for Hong Kong.',
    locale: 'en_HK',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#9e0000',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} bg-[#f9f9f9]`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
