'use client'

import { useCallback, useState } from 'react'
import { Upload, ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PhotoUploadProps {
  onImageReady: (base64: string, mimeType: string, preview: string) => void
  onClear: () => void
  preview: string | null
  disabled?: boolean
}

export function PhotoUpload({ onImageReady, onClear, preview, disabled }: PhotoUploadProps) {
  const [dragging, setDragging] = useState(false)

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return
      const src = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        const MAX = 1024
        let w = img.naturalWidth
        let h = img.naturalHeight
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round((h * MAX) / w); w = MAX }
          else       { w = Math.round((w * MAX) / h); h = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(src)
        canvas.toBlob(
          (blob) => {
            if (!blob) return
            const reader = new FileReader()
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string
              const [meta, base64] = dataUrl.split(',')
              const mimeType = meta.replace('data:', '').replace(';base64', '')
              onImageReady(base64, mimeType, dataUrl)
            }
            reader.readAsDataURL(blob)
          },
          'image/jpeg',
          0.82
        )
      }
      img.src = src
    },
    [onImageReady]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  if (preview) {
    return (
      <div className="relative rounded-xl overflow-hidden border bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview}
          alt="Uploaded photo"
          className="w-full max-h-96 object-contain bg-black/5"
        />
        {!disabled && (
          <button
            onClick={onClear}
            className="absolute top-2 right-2 bg-background/80 hover:bg-background rounded-full p-1 shadow transition-colors"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer',
        dragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/30'
      )}
      onClick={() => document.getElementById('photo-input')?.click()}
    >
      <input
        id="photo-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        {dragging ? (
          <ImageIcon className="h-8 w-8 text-primary" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div>
        <p className="text-base font-medium">
          {dragging ? 'Drop your photo here' : 'Upload a photo'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Drag & drop or click to browse · JPG, PNG, WEBP
        </p>
      </div>
      <Button variant="outline" size="sm" type="button" tabIndex={-1}>
        Choose file
      </Button>
      <Badge variant="secondary" className="font-normal text-muted-foreground">
        Best results with outdoor photos showing buildings, street signs, landscapes, or infrastructure.
      </Badge>
    </div>
  )
}
