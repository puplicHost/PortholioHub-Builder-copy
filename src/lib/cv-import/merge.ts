import { detectTextLanguage } from './normalize'
import type { CvAiFields, CvScalarSuggestion, CvSuggestions } from './types'

function aiScalar(value: string | undefined, local: CvScalarSuggestion | null, language: CvSuggestions['language']): CvScalarSuggestion | null {
  if (!value) return local
  const cleaned = value.trim()
  if (!cleaned) return local
  return { value: cleaned, language: detectTextLanguage(cleaned, language) }
}

/**
 * AI is the primary suggestion source when it returns a valid partial result;
 * local rules fill every missing field/list. The result is still only a
 * suggestion and must pass the review/apply flow.
 */
export function mergeCvSuggestions(local: CvSuggestions, ai: CvAiFields | null): CvSuggestions {
  if (!ai) return local
  const language = local.language

  return {
    displayName: aiScalar(ai.displayName, local.displayName, language),
    professionalTitle: aiScalar(ai.professionalTitle, local.professionalTitle, language),
    location: aiScalar(ai.location, local.location, language),
    bio: aiScalar(ai.bio, local.bio, language),
    skillGroups: ai.skillGroups && ai.skillGroups.length > 0 ? ai.skillGroups : local.skillGroups,
    experience: ai.experience && ai.experience.length > 0 ? ai.experience : local.experience,
    education: ai.education && ai.education.length > 0 ? ai.education : local.education,
    language,
    warnings: local.warnings,
  }
}
