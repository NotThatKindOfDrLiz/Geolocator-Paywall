const ALLOWED_CONFIDENCE = ['Very High', 'High', 'Medium', 'Low', 'Very Low'] as const

export type ValidationResult =
  | { valid: true; data: { locations: unknown[] } }
  | { valid: false; error: string }

export function validateAnalysisResponse(parsed: unknown): ValidationResult {
  if (parsed === null || typeof parsed !== 'object') {
    return { valid: false, error: 'Response is not an object' }
  }

  const obj = parsed as Record<string, unknown>

  if (!Array.isArray(obj.locations)) {
    return { valid: false, error: 'Response missing "locations" array' }
  }

  if (obj.locations.length !== 3) {
    return { valid: false, error: `Expected 3 locations, got ${obj.locations.length}` }
  }

  for (let i = 0; i < obj.locations.length; i++) {
    const loc = obj.locations[i] as Record<string, unknown>
    const prefix = `locations[${i}]`

    if (loc === null || typeof loc !== 'object') {
      return { valid: false, error: `${prefix} is not an object` }
    }

    if (typeof loc.location !== 'string' || loc.location.length === 0) {
      return { valid: false, error: `${prefix}.location must be a non-empty string` }
    }

    if (
      typeof loc.confidence !== 'string' ||
      !(ALLOWED_CONFIDENCE as readonly string[]).includes(loc.confidence)
    ) {
      return {
        valid: false,
        error: `${prefix}.confidence must be one of: ${ALLOWED_CONFIDENCE.join(', ')}`,
      }
    }

    if (loc.clues === null || typeof loc.clues !== 'object') {
      return { valid: false, error: `${prefix}.clues must be an object` }
    }

    const clues = loc.clues as Record<string, unknown>

    if (!Array.isArray(clues.numbered)) {
      return { valid: false, error: `${prefix}.clues.numbered must be an array` }
    }

    if (clues.numbered.length < 2 || clues.numbered.length > 4) {
      return {
        valid: false,
        error: `${prefix}.clues.numbered must have 2-4 items, got ${clues.numbered.length}`,
      }
    }

    for (let j = 0; j < clues.numbered.length; j++) {
      if (typeof clues.numbered[j] !== 'string') {
        return { valid: false, error: `${prefix}.clues.numbered[${j}] must be a string` }
      }
    }

    if (typeof clues.summary !== 'string' || clues.summary.length === 0) {
      return { valid: false, error: `${prefix}.clues.summary must be a non-empty string` }
    }
  }

  return { valid: true, data: obj as { locations: unknown[] } }
}
