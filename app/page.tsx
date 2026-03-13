'use client'

import { useState } from 'react'
import { useCheckout } from '@moneydevkit/nextjs'
import { Zap, Globe, Lock, ScanSearch } from 'lucide-react'
import Link from 'next/link'
import { PhotoUpload } from '@/components/PhotoUpload'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  const { createCheckout, isLoading } = useCheckout()
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImageReady = (base64: string, mimeType: string, preview: string) => {
    setImageBase64(base64)
    setImageMimeType(mimeType)
    setImagePreview(preview)
    setError(null)
  }

  const handleClear = () => {
    setImageBase64(null)
    setImageMimeType('image/jpeg')
    setImagePreview(null)
    setError(null)
    sessionStorage.removeItem('pending_image')
    sessionStorage.removeItem('pending_mime_type')
  }

  const handleAnalyze = async () => {
    if (!imageBase64) {
      setError('Please upload a photo first.')
      return
    }

    setError(null)

    // Store image in sessionStorage so it survives the checkout redirect
    try {
      sessionStorage.setItem('pending_image', imageBase64)
      sessionStorage.setItem('pending_mime_type', imageMimeType)
    } catch {
      setError('Your photo is too large to process. Please try a smaller image.')
      return
    }

    const result = await createCheckout({
      type: 'AMOUNT',
      title: 'GeoLocator — AI Photo Analysis',
      description: 'AI-powered geolocation analysis of your photo using Gemini 3.1 Flash Lite Preview',
      amount: 100,
      currency: 'SAT',
      successUrl: '/checkout/success',
    })

    if (result.error) {
      sessionStorage.removeItem('pending_image')
      sessionStorage.removeItem('pending_mime_type')
      setError(result.error.message)
      return
    }

    window.location.href = result.data.checkoutUrl
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-primary" />
            <span className="font-semibold text-base">GeoLocator</span>
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">AI</Badge>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>100 sats per analysis</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Globe className="h-4 w-4" />
            Geospatial Intelligence
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Where was this photo taken?
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Upload any photo and our AI analyst identifies the top 3 most likely locations using
            architecture, vegetation, infrastructure, text, and climate cues.
          </p>
        </div>

        {/* Upload */}
        <PhotoUpload
          onImageReady={handleImageReady}
          onClear={handleClear}
          preview={imagePreview}
          disabled={isLoading}
        />

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* CTA */}
        <Button
          onClick={handleAnalyze}
          disabled={!imageBase64 || isLoading}
          size="lg"
          className="w-full gap-2 text-base"
        >
          <Zap className="h-5 w-5" />
          {isLoading ? 'Creating invoice…' : 'Analyze for 100 sats'}
        </Button>

        {/* Trust row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: Lock, title: 'Private', desc: 'Images never stored on our servers' },
            { icon: Zap, title: 'Lightning fast', desc: 'Instant payment, instant results' },
            { icon: Globe, title: 'Powered by Gemini', desc: 'Google Gemini 3.1 Flash Lite Preview' },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="bg-muted/30">
              <CardContent className="p-4 space-y-1">
                <Icon className="h-5 w-5 mx-auto text-muted-foreground" />
                <p className="text-xs font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-8">
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-center">
          <a
            href="https://github.com/paulosacramento/Geolocator-Paywall"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            View on GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
