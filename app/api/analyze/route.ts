import { NextRequest, NextResponse } from 'next/server'
import { getGeminiClient, SYSTEM_PROMPT } from '@/lib/gemini'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json()

    if (!image || !mimeType) {
      return NextResponse.json({ error: 'Missing image or mimeType' }, { status: 400 })
    }

    // Validate that image is a non-empty string
    if (typeof image !== 'string' || image.length === 0) {
      return NextResponse.json({ error: 'Image must be a non-empty string' }, { status: 400 })
    }

    // Validate base64 string length (~5MB limit)
    const MAX_BASE64_LENGTH = 7_000_000
    if (image.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        { error: `Image exceeds maximum size (${MAX_BASE64_LENGTH} characters)` },
        { status: 400 },
      )
    }

    // Validate MIME type against allowlist
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported MIME type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 },
      )
    }

    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite-preview',
      systemInstruction: SYSTEM_PROMPT,
    })

    const result = await model.generateContent([
      {
        inlineData: {
          data: image,
          mimeType,
        },
      },
      'Analyze this photograph and return the JSON as instructed.',
    ])

    const text = result.response.text().trim()

    // Strip markdown code fences if present
    const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (err: unknown) {
    console.error('[analyze]', err)
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
