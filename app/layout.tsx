import type { Metadata } from 'next'
import '@moneydevkit/nextjs/mdk-styles.css'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'GeoLocator — AI Photo Geolocation',
  description:
    'Upload a photo and AI identifies the top 3 most likely locations it was taken. Powered by Google Gemini 3.1 Flash Lite Preview. Pay 100 sats via Lightning.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark');})();`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
