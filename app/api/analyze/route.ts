import { NextRequest, NextResponse } from 'next/server'
import { getGeminiClient, SYSTEM_PROMPT } from '@/lib/gemini'
import { validateAnalysisResponse } from '@/lib/validate'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json()

    if (!image || !mimeType) {
      return NextResponse.json({ error: 'Missing image or mimeType' }, { status: 400 })
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

    const result2 = validateAnalysisResponse(parsed)
    if (!result2.valid) {
      return NextResponse.json(
        { error: `Invalid AI response: ${result2.error}` },
        { status: 502 },
      )
    }

    return NextResponse.json(result2.data)
  } catch (err: unknown) {
    console.error('[analyze]', err)
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
