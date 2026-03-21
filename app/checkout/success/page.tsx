'use client'

import { useEffect, useRef, useState } from 'react'
import { useCheckoutSuccess } from '@moneydevkit/nextjs'
import { useRouter } from 'next/navigation'
import { ScanSearch, Loader2, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AnalysisResults, type Location } from '@/components/AnalysisResults'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

type PageState =
  | { status: 'verifying' }
  | { status: 'analyzing' }
  | { status: 'done'; locations: Location[]; preview: string | null }
  | { status: 'error'; message: string }
  | { status: 'unpaid' }

type ProgressStage = {
  upTo: number      // seconds
  progress: number  // 0-100
  message: string
}

const PROGRESS_STAGES: ProgressStage[] = [
  { upTo: 3,   progress: 5,  message: 'Uploading image…' },
  { upTo: 10,  progress: 20, message: 'Scanning visual cues…' },
  { upTo: 20,  progress: 40, message: 'Analyzing architecture & infrastructure…' },
  { upTo: 35,  progress: 60, message: 'Synthesizing geographic evidence…' },
  { upTo: 50,  progress: 80, message: 'Calibrating confidence levels…' },
  { upTo: 60,  progress: 92, message: 'Finalizing results…' },
  { upTo: Infinity, progress: 95, message: 'This is taking longer than expected…' },
]

function getStage(elapsed: number): ProgressStage {
  return PROGRESS_STAGES.find((s) => elapsed < s.upTo) ?? PROGRESS_STAGES[PROGRESS_STAGES.length - 1]
}

export default function SuccessPage() {
  const { isCheckoutPaidLoading, isCheckoutPaid } = useCheckoutSuccess()
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>({ status: 'verifying' })
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Start/stop elapsed timer based on analysis state
  useEffect(() => {
    if (pageState.status === 'analyzing') {
      setElapsedSeconds(0)
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [pageState.status])

  useEffect(() => {
    // Wait until payment verification resolves
    if (isCheckoutPaidLoading || isCheckoutPaid === null) return

    if (!isCheckoutPaid) {
      setPageState({ status: 'unpaid' })
      return
    }

    // Payment confirmed — run analysis once
    if (hasAnalyzed) return
    setHasAnalyzed(true)

    const imageBase64 = sessionStorage.getItem('pending_image')
    const mimeType = sessionStorage.getItem('pending_mime_type') ?? 'image/jpeg'
    const preview = imageBase64 ? `data:${mimeType};base64,${imageBase64}` : null

    if (!imageBase64) {
      setPageState({ status: 'error', message: 'Image data not found. Please go back and try again.' })
      return
    }

    setPageState({ status: 'analyzing' })

    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64, mimeType }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Analysis failed')
        return data
      })
      .then((data) => {
        // Clear image from sessionStorage after successful analysis
        sessionStorage.removeItem('pending_image')
        sessionStorage.removeItem('pending_mime_type')
        setPageState({ status: 'done', locations: data.locations, preview })
      })
      .catch((err: Error) => {
        setPageState({ status: 'error', message: err.message })
      })
  }, [isCheckoutPaidLoading, isCheckoutPaid, hasAnalyzed])

  const currentStage = getStage(elapsedSeconds)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-primary" />
            <span className="font-semibold text-base">GeoLocator</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {pageState.status === 'verifying' && (
          <CenteredMessage>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-base font-medium">Verifying payment…</p>
          </CenteredMessage>
        )}

        {pageState.status === 'analyzing' && (
          <CenteredMessage>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-base font-medium">{currentStage.message}</p>
            <Progress value={currentStage.progress} className="w-64" />
            <p className="text-sm text-muted-foreground">
              {elapsedSeconds}s elapsed
              {elapsedSeconds < 60 && ' · up to 60 seconds'}
            </p>
          </CenteredMessage>
        )}

        {pageState.status === 'done' && (
          <div className="space-y-8">
            <AnalysisResults
              locations={pageState.locations}
              imagePreview={pageState.preview}
            />
            <Button
              variant="outline"
              className="w-full gap-2 no-print"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-4 w-4" />
              Analyze another photo
            </Button>
          </div>
        )}

        {pageState.status === 'error' && (
          <CenteredMessage>
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-6 py-4 text-sm text-destructive text-center max-w-sm">
              <p className="font-medium mb-1">Something went wrong</p>
              <p>{pageState.message}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Go back
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setHasAnalyzed(false)
                  setElapsedSeconds(0)
                  setPageState({ status: 'verifying' })
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </CenteredMessage>
        )}

        {pageState.status === 'unpaid' && (
          <CenteredMessage>
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-6 py-4 text-sm text-amber-700 dark:text-amber-400 text-center max-w-sm">
              <p className="font-medium mb-1">Payment not confirmed</p>
              <p>If you completed the payment, please wait a moment and retry.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Go back
            </Button>
          </CenteredMessage>
        )}
      </main>
    </div>
  )
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      {children}
    </div>
  )
}
