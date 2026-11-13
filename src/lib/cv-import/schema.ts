import { z } from 'zod'
import {
  MAX_SKILLS_PER_GROUP,
  MAX_SKILL_GROUPS,
  MAX_TOTAL_SKILLS,
} from './types'

const plainText = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !/[<>]/.test(value), 'Plain text only')

const optionalPlainText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => !/[<>]/.test(value), 'Plain text only')
    .optional()
    .default('')

const cvScalarSchema = (max: number) =>
  z
    .object({
      lang: z.enum(['en', 'ar']),
      value: plainText(max),
      overwrite: z.boolean().optional(),
    })
    .strict()

const cvExperienceSchema = z
  .object({
    jobTitle: plainText(120),
    companyName: optionalPlainText(120),
    location: optionalPlainText(120),
    startDate: optionalPlainText(30),
    endDate: optionalPlainText(30),
    isCurrent: z.boolean().optional().default(false),
    description: optionalPlainText(1000),
  })
  .strict()

const cvEducationSchema = z
  .object({
    title: plainText(120),
    institution: optionalPlainText(120),
    date: optionalPlainText(60),
    description: optionalPlainText(1000),
  })
  .strict()

const cvSkillGroupSchema = z
  .object({
    name: plainText(60),
    skills: z.array(plainText(60)).min(1).max(MAX_SKILLS_PER_GROUP),
  })
  .strict()

const skillGroupsTotalCheck = (groups: { skills: string[] }[]) =>
  groups.reduce((total, group) => total + group.skills.length, 0) <= MAX_TOTAL_SKILLS

export const cvApprovedPayloadSchema = z
  .object({
    expectedVersion: z.number().int().min(1),
    approved: z
      .object({
        displayName: cvScalarSchema(120).optional(),
        professionalTitle: cvScalarSchema(120).optional(),
        location: cvScalarSchema(120).optional(),
        bio: cvScalarSchema(2000).optional(),
        skillGroups: z
          .object({
            groups: z
              .array(cvSkillGroupSchema)
              .min(1)
              .max(MAX_SKILL_GROUPS)
              .refine(skillGroupsTotalCheck, `At most ${MAX_TOTAL_SKILLS} skills total`),
          })
          .strict()
          .optional(),
        experience: z
          .object({
            items: z.array(cvExperienceSchema).min(1).max(30),
          })
          .strict()
          .optional(),
        education: z
          .object({
            items: z.array(cvEducationSchema).min(1).max(30),
          })
          .strict()
          .optional(),
      })
      .strict()
      .refine((value) => Object.keys(value).length > 0, 'Select at least one field'),
  })
  .strict()

export type CvApprovedPayload = z.infer<typeof cvApprovedPayloadSchema>
export type CvApprovedExperience = z.infer<typeof cvExperienceSchema>
export type CvApprovedEducation = z.infer<typeof cvEducationSchema>
export type CvApprovedSkillGroup = z.infer<typeof cvSkillGroupSchema>

// AI output is deliberately validated separately from the apply payload:
// unknown keys are stripped, null/empty fields are dropped, and every known
// field is capped before it can reach the local suggestion merge.
const aiOptionalString = (max: number) =>
  z
    .string()
    .max(max)
    .refine((value) => !/[<>]/.test(value), 'Plain text only')
    .nullable()
    .optional()

const aiExperienceSchema = z
  .object({
    jobTitle: aiOptionalString(120),
    companyName: aiOptionalString(120),
    location: aiOptionalString(120),
    startDate: aiOptionalString(30),
    endDate: aiOptionalString(30),
    isCurrent: z.boolean().nullable().optional(),
    description: aiOptionalString(1000),
  })
  .strict()

const aiEducationSchema = z
  .object({
    title: aiOptionalString(120),
    institution: aiOptionalString(120),
    date: aiOptionalString(60),
    description: aiOptionalString(1000),
  })
  .strict()

const aiSkillGroupSchema = z
  .object({
    name: aiOptionalString(60),
    skills: z.array(z.string().max(60)).max(MAX_SKILLS_PER_GROUP).nullable().optional(),
  })
  .strict()

const aiSkillGroupsSchema = z
  .array(aiSkillGroupSchema)
  .max(MAX_SKILL_GROUPS)
  .refine(
    (groups) => groups.reduce((total, group) => total + (group.skills?.length || 0), 0) <= MAX_TOTAL_SKILLS,
    `At most ${MAX_TOTAL_SKILLS} skills total`,
  )

export const cvAiOutputSchema = z
  .object({
    displayName: aiOptionalString(120),
    professionalTitle: aiOptionalString(120),
    location: aiOptionalString(120),
    bio: aiOptionalString(2000),
    skillGroups: aiSkillGroupsSchema.nullable().optional(),
    experience: z.array(aiExperienceSchema).max(40).nullable().optional(),
    education: z.array(aiEducationSchema).max(40).nullable().optional(),
  })
  // Unknown top-level keys (for example a "projects" block) invalidate the whole
  // AI payload: it is discarded and the local extraction is used instead.
  .strict()

export type CvAiOutput = z.infer<typeof cvAiOutputSchema>
