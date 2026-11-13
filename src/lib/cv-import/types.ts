export type CvLanguage = 'en' | 'ar'

export type CvDetectedLanguage = CvLanguage | 'mixed' | 'unknown'

export type CvWarningCode =
  | 'TEXT_TRUNCATED'
  | 'DATES_NEED_REVIEW'
  | 'PARTIAL_EXTRACTION'
  | 'AI_OUTPUT_FILTERED'
  | 'PROJECTS_NOT_SUPPORTED'
  | 'AMBIGUOUS_CONTENT_OMITTED'

export const MAX_SKILL_GROUPS = 10
export const MAX_SKILLS_PER_GROUP = 50
export const MAX_TOTAL_SKILLS = 50
export const GENERAL_SKILL_GROUP_EN = 'Other Skills'
export const GENERAL_SKILL_GROUP_AR = 'مهارات أخرى'

export interface CvScalarSuggestion {
  value: string
  language: CvLanguage
}

export interface CvSkillGroupSuggestion {
  name: string
  skills: string[]
}

export interface CvExperienceSuggestion {
  jobTitle: string
  companyName: string
  location: string
  startDate: string
  endDate: string
  isCurrent: boolean
  description: string
}

export interface CvEducationSuggestion {
  title: string
  institution: string
  date: string
  description: string
}

export interface CvSuggestions {
  displayName: CvScalarSuggestion | null
  professionalTitle: CvScalarSuggestion | null
  location: CvScalarSuggestion | null
  bio: CvScalarSuggestion | null
  skillGroups: CvSkillGroupSuggestion[]
  experience: CvExperienceSuggestion[]
  education: CvEducationSuggestion[]
  language: CvDetectedLanguage
  warnings: CvWarningCode[]
}

export interface CvAiFields {
  displayName?: string
  professionalTitle?: string
  location?: string
  bio?: string
  skillGroups?: CvSkillGroupSuggestion[]
  experience?: CvExperienceSuggestion[]
  education?: CvEducationSuggestion[]
}

export type CvFileKind = 'pdf' | 'docx'

export type CvFileErrorCode =
  | 'FILE_EMPTY'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'LEGACY_DOC'
  | 'MALFORMED_FILE'
  | 'MACRO_DOCUMENT'
  | 'DOCX_TOO_LARGE'

export interface CvFileValidationFailure {
  ok: false
  code: CvFileErrorCode
}

export type CvFileValidationResult =
  | { ok: true; kind: CvFileKind }
  | CvFileValidationFailure
