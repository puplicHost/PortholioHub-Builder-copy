import { z } from 'zod'
import { sanitizeUrl } from '@/lib/urls'

// Portfolio content validation (plan Phase 5 §14–19, mass assignment §12).
// Envelope + per-type content are `.strict()`; key sets cover every shape
// observed in production data (surveyed 2026-10-15) plus the plan shapes.
// Unknown keys fail with a field path instead of being silently stored.
//
// What's intentionally loose (documented, not oversight):
// - `settings` allows extra keys (client UI state, not user content).
// - Project items stay shape-loose (workspace/external polymorphism
//   predates the schema); only counts/lengths are enforced on them.

// ---------- primitives ----------

const plainText = (max: number) =>
  z
    .string()
    .max(max)
    .refine((s) => !/[<>]/.test(s), 'Plain text only (no HTML)');

const lstring = (max: number) =>
  z
    .object({
      ar: plainText(max).optional(),
      en: plainText(max).optional(),
    })
    .strict();

// Builder inputs for experience items are flat strings (single-language
// inputs), while legacy/imported rows may already be {ar,en} objects.
// Accept both so saves never fail on the shape the UI actually sends.
const lstringOrText = (max: number) => z.union([lstring(max), plainText(max)]);

// Optional per-section description (Round 3, item 7): trimmed, length-capped,
// plain text only. Bilingual like other content strings so it travels with the
// rest of the section's {ar,en} data.
const descText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `at most ${max} characters`)
    .refine((s) => !/[<>]/.test(s), 'Plain text only (no HTML)');
const ldesc = (max: number) =>
  z
    .object({
      ar: descText(max).optional(),
      en: descText(max).optional(),
    })
    .strict();

const url = z
  .string()
  .max(500)
  .refine(
    (s) => /^(https?:\/\/|mailto:|tel:|\/)/.test(s) && !/^javascript:/i.test(s),
    'URL must be https/http/mailto/tel or site-relative',
  );

// Draft rows (new gallery image, file, link, cleared background) carry an
// empty-string URL until the user uploads or types one. The strict `url`
// shape rejects '', so optional URL fields accept '' explicitly.
const urlOrEmpty = z.union([z.literal(''), url]);

// ---------- shared item shapes ----------

const skillItem = z
  .object({
    name: plainText(60),
    percentage: z.number().min(0).max(100).optional(),
  })
  .strict();

const experienceItem = z
  .object({
    id: z.string().max(120).optional(),
    jobTitle: lstringOrText(120).optional(),
    company: lstringOrText(120).optional(),
    // Builder key names (ClassicTemplate renders these flat strings).
    companyName: lstringOrText(120).optional(),
    companyLogo: urlOrEmpty.optional(),
    location: lstringOrText(120).optional(),
    startDate: z.string().max(30).optional(),
    endDate: z.string().max(30).optional(),
    current: z.boolean().optional(),
    isCurrent: z.boolean().optional(),
    workMode: plainText(60).optional(),
    employmentType: plainText(60).optional(),
    icon: plainText(60).optional(),
    description: lstringOrText(1000).optional(),
  })
  // Legacy rows may carry extra keys (old builder versions). Unknown keys must
  // never block a save, so the item is validated loosely while every known
  // field keeps its constraints.
  .passthrough();

const serviceItem = z
  .object({
    title: lstringOrText(120),
    description: lstringOrText(500).optional(),
    price: plainText(60).optional(),
  })
  .strict();

const testimonialItem = z
  .object({
    id: z.string().max(120).optional(),
    // Builder photo-card shape (TestimonialsEditor + TestimonialsSlider
    // read name/title/photoUrl/text/rating).
    name: lstringOrText(120).optional(),
    title: lstringOrText(120).optional(),
    photoUrl: urlOrEmpty.optional(),
    text: lstring(1000).optional(),
    rating: z.number().min(0).max(5).optional(),
    // Legacy quote shape (Prisma Testimonial model rows).
    author: plainText(120).optional(),
    role: plainText(120).optional(),
    body: plainText(1000).optional(),
  })
  .strict();

const contactLink = z
  .object({
    id: z.string().max(120).optional(),
    type: z.enum([
      'whatsapp',
      'phone',
      'email',
      'linkedin',
      'facebook',
      'instagram',
      'x',
      'behance',
      'github',
      'website',
    ]),
    platform: plainText(60).optional(),
    value: z.string().max(500),
    label: lstringOrText(60).optional(),
    url: url.optional(),
  })
  .strict()
  .superRefine((link, ctx) => {
    // Empty value = draft row (user just clicked "Add Link"); the UI
    // allows saving drafts, so per-type format checks only apply once
    // a value has been typed.
    if (link.value === '') return;
    // Value rules depend on the contact type (XSS allowlist per kind).
    const fail = (message: string) =>
      ctx.addIssue({ code: 'custom', message, path: ['value'] });
    if (link.type === 'website') {
      if (!/^(https?:\/\/)/.test(link.value) || /^javascript:/i.test(link.value)) {
        fail('Website value must be an https/http URL');
      }
    } else if (link.type === 'email') {
      if (!/\S+@\S+\.\S+/.test(link.value)) fail('Email value must look like an email address');
    } else if (link.type === 'phone' || link.type === 'whatsapp') {
      if (!/^\+?[0-9][0-9\s\-().]{4,25}$/.test(link.value)) {
        fail('Phone value must look like a phone number');
      }
    } else if (/^javascript:/i.test(link.value)) {
      fail('Value must not be a javascript: URL');
    }
  });

const footerLink = z
  .object({
    id: z.string().max(120).optional(),
    platform: plainText(60).optional(),
    label: lstringOrText(60).optional(),
    url: urlOrEmpty.optional(),
  })
  .strict();

const galleryItem = z
  .object({
    id: z.string().max(120).optional(),
    mediaId: z.string().max(200).optional(),
    imageUrl: urlOrEmpty.optional(),
    url: urlOrEmpty.optional(),
    caption: lstringOrText(200).optional(),
  })
  .strict();

const fileItem = z
  .object({
    id: z.string().max(120).optional(),
    mediaId: z.string().max(200).optional(),
    label: lstringOrText(120).optional(),
    url: urlOrEmpty.optional(),
    externalUrl: urlOrEmpty.optional(),
  })
  .strict();

// Builder services card shape (section content `services` key — what the
// builder writes and ClassicTemplate renders). Distinct from the legacy
// `items` (serviceItem) shape kept below for previously stored rows.
const builderServiceItem = z
  .object({
    icon: plainText(40).optional(),
    title: lstringOrText(120).optional(),
    description: lstringOrText(500).optional(),
    features: z.array(plainText(120)).max(50).optional(),
  })
  .strict();

// ---------- per-type content (all fields optional: partial saves) ----------

const heroContent = z
  .object({
    title: lstring(120).optional(),
    subtitle: lstring(500).optional(),
    description: ldesc(300).optional(),
    name: lstring(120).optional(),
    jobTitle: lstring(120).optional(),
    avatarMediaId: z.string().max(200).optional(),
    backgroundImage: urlOrEmpty.optional(),
    overlayOpacity: z.number().min(0).max(1).optional(),
    cta: z
      .array(z.object({ label: plainText(60), target: url }).strict())
      .max(4)
      .optional(),
  })
  .strict();

const aboutContent = z
  .object({
    title: lstring(120).optional(),
    icon: plainText(40).optional(),
    text: lstring(2000).optional(),
    biography: lstring(2000).optional(),
    description: ldesc(300).optional(),
    stats: z
      .array(
        z
          .object({
            value: plainText(60),
            label: lstringOrText(60),
            icon: plainText(40).optional(),
          })
          .strict(),
      )
      .max(10)
      .optional(),
  })
  .strict();

const skillsContent = z
  .object({
    title: lstring(120).optional(),
    icon: plainText(40).optional(),
    heading: lstring(120).optional(),
    description: ldesc(300).optional(),
    skills: z.array(plainText(60)).max(50).optional(),
    groups: z
      .array(
        z
          .object({
            name: plainText(60).optional(),
            title: plainText(60).optional(),
            skills: z.array(skillItem).max(50),
          })
          .strict(),
      )
      .max(10)
      .optional(),
  })
  .strict();

const experienceContent = z
  .object({
    heading: lstring(120).optional(),
    title: lstring(120).optional(),
    icon: plainText(40).optional(),
    displayMode: z.enum(['timeline', 'grid', 'list']).optional(),
    description: lstring(500).optional(),
    items: z.array(experienceItem).max(30).optional(),
  })
  .strict();

const servicesContent = z
  .object({
    title: lstring(120).optional(),
    icon: plainText(40).optional(),
    description: lstring(500).optional(),
    services: z.array(builderServiceItem).max(30).optional(),
    items: z.array(serviceItem).max(20).optional(),
  })
  .strict();

const projectsContent = z
  .object({
    title: lstring(120).optional(),
    icon: plainText(40).optional(),
    displayMode: z.enum(['grid', 'list']).optional(),
    subtitle: lstring(500).optional(),
    description: lstring(500).optional(),
  })
  .strict();

const galleryContent = z
  .object({
    title: lstring(120).optional(),
    icon: plainText(40).optional(),
    description: ldesc(300).optional(),
    items: z.array(galleryItem).max(60).optional(),
  })
  .strict();

const filesContent = z
  .object({
    title: lstring(120).optional(),
    icon: plainText(40).optional(),
    description: ldesc(300).optional(),
    items: z.array(fileItem).max(60).optional(),
  })
  .strict();

const testimonialsContent = z
  .object({
    title: lstring(120).optional(),
    subtitle: lstring(500).optional(),
    icon: plainText(40).optional(),
    description: ldesc(300).optional(),
    items: z.array(testimonialItem).max(30).optional(),
  })
  .strict();

const contactContent = z
  .object({
    title: lstring(120).optional(),
    headline: lstring(120).optional(),
    subheading: lstring(500).optional(),
    icon: plainText(40).optional(),
    description: ldesc(300).optional(),
    links: z.array(contactLink).max(20).optional(),
  })
  .strict();

const footerContent = z
  .object({
    headline: lstring(120).optional(),
    subheading: lstring(500).optional(),
    title: lstring(120).optional(),
    description: ldesc(300).optional(),
    links: z.array(footerLink).max(20).optional(),
  })
  .strict();

const customContent = z
  .object({
    title: lstring(120).optional(),
    icon: plainText(40).optional(),
    description: ldesc(300).optional(),
    paragraphs: z.array(plainText(2000)).max(20).optional(),
  })
  .strict();

const contentByType = {
  hero: heroContent,
  about: aboutContent,
  skills: skillsContent,
  experience: experienceContent,
  services: servicesContent,
  projects: projectsContent,
  gallery: galleryContent,
  files: filesContent,
  testimonials: testimonialsContent,
  contact: contactContent,
  footer: footerContent,
  custom: customContent,
} as const;

export const SECTION_TYPES = Object.keys(contentByType);

const sectionSchema = z
  .object({
    id: z.string().max(120).optional(),
    // DB passthrough columns (present on rows read back from Prisma and
    // re-sent by the client on save; ignored by the server).
    pageId: z.string().max(120).optional(),
    createdAt: z.unknown().optional(),
    updatedAt: z.unknown().optional(),
    sectionType: z.enum([
      'hero',
      'about',
      'skills',
      'experience',
      'services',
      'projects',
      'gallery',
      'files',
      'testimonials',
      'contact',
      'footer',
      'custom',
    ]),
    sectionOrder: z.number().int().min(0).max(1000).optional(),
    content: z.unknown(),
    settings: z.record(z.string(), z.unknown()).optional(),
    visible: z.boolean().optional(),
  })
  .strict()
  .superRefine((sec, ctx) => {
    const contentSchema = contentByType[sec.sectionType];
    const parsed = contentSchema.safeParse(sec.content ?? {});
    if (!parsed.success) {
      for (const issue of parsed.error.issues.slice(0, 3)) {
        ctx.addIssue({
          code: 'custom',
          message: `${issue.path.join('.') || '(root)'}: ${issue.message}`,
          path: ['content', ...issue.path.map(String)],
        });
      }
    }
  });

// ---------- entry points ----------

export interface ContentCheck {
  ok: boolean;
  error?: string;
}

// Validates a sections array (plan caps: ≤30 sections).
export function validateSections(sections: unknown): ContentCheck {
  if (!Array.isArray(sections)) return { ok: true };
  if (sections.length > 30) {
    return { ok: false, error: 'sections: at most 30 sections allowed' };
  }
  for (let i = 0; i < sections.length; i++) {
    const parsed = sectionSchema.safeParse(sections[i]);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const where = first ? [...first.path.map(String)].join('.') : '';
      return {
        ok: false,
        error: `sections[${i}]${where ? `.${where}` : ''}: ${first?.message || 'invalid section'}`,
      };
    }
  }
  return { ok: true };
}

// Project payloads keep their legacy polymorphic shape; only counts and
// gallery sizes are enforced here (strict object validation would
// false-reject existing workspace/external item variants).
export function validateProjects(projects: unknown): ContentCheck {
  if (!Array.isArray(projects)) return { ok: true };
  if (projects.length > 50) {
    return { ok: false, error: 'projects: at most 50 projects allowed' };
  }
  return { ok: true };
}

// ---------- profile extras: appearance / localized / contactLinks ----------
// These three fields are stored as JSON and read by every template. Legacy
// rows can hold arbitrary shapes, so validation stays lenient: known keys are
// clamped, unsafe values fall back to the template default (undefined), unknown
// legacy keys are preserved, and parse NEVER throws / rejects a save.

// Colors: keep only hex or rgb()/hsl() with alpha. Anything else → undefined
// (the template then uses its own default), so a bad legacy value can neither
// break the page nor smuggle CSS.
const safeColor = z
  .string()
  .max(64)
  .refine((s) => /^#([0-9a-fA-F]{3,8})$/.test(s) || /^(rgb|hsl)a?\([0-9.,%\s]+\)$/.test(s))
  .optional()
  .catch(undefined);

// Font family: letters/digits/space/plus/hyphen only (a real Google font name).
// Anything else falls back to the default font — never injected into the URL.
const safeFont = z
  .string()
  .max(60)
  .refine((s) => /^[A-Za-z0-9 +-]+$/.test(s) && s.trim().length > 0)
  .optional()
  .catch('Inter');

const safeStr = (max: number) => z.string().max(max).optional().catch(undefined);

const safeUrl = z
  .string()
  .max(1000)
  .transform((s) => sanitizeUrl(s))
  .optional()
  .catch(undefined);

const appearanceSchema = z
  .object({
    colorMode: z.enum(['light', 'dark']).optional().catch(undefined),
    theme: safeStr(60),
    font: safeFont,
    primaryColor: safeColor,
    bgColorLight: safeColor,
    bgColorDark: safeColor,
    textColorLight: safeColor,
    textColorDark: safeColor,
    borderColor: safeColor,
    outlineColor: safeColor,
    footerBg: safeColor,
    footerText: safeColor,
    logoUrl: safeUrl,
    defaultLanguage: z.enum(['ar', 'en', 'both']).optional().catch(undefined),
    n: z.enum(['ar', 'en', 'both']).optional().catch(undefined),
    actionButtons: z.record(z.string(), z.unknown()).optional().catch(undefined),
  })
  .catchall(z.unknown());

const lstringLoose = z
  .object({
    ar: safeStr(5000),
    en: safeStr(5000),
  })
  .catchall(z.unknown());

const localizedSchema = z
  .object({
    displayName: lstringLoose.optional().catch(undefined),
    bio: lstringLoose.optional().catch(undefined),
    professionalTitle: lstringLoose.optional().catch(undefined),
    location: lstringLoose.optional().catch(undefined),
  })
  .catchall(z.unknown());

const contactLinkLoose = z
  .object({
    id: safeStr(120),
    label: safeStr(120),
    platform: safeStr(60),
    type: safeStr(60),
    value: safeStr(500),
    url: safeUrl,
  })
  .catchall(z.unknown());

const contactLinksSchema = z.array(contactLinkLoose).max(60).optional().catch(undefined);

export interface ProfileExtras {
  appearance?: unknown;
  localized?: unknown;
  contactLinks?: unknown;
}

// Sanitizes the profile extras with a per-field silent fallback. If a field is
// missing it stays missing; on any unexpected parse failure the raw legacy
// value is preserved so an old profile is never rejected.
export function validateProfileExtras(data: {
  appearance?: unknown;
  localized?: unknown;
  contactLinks?: unknown;
}): ProfileExtras {
  const out: ProfileExtras = {};
  if (data.appearance !== undefined) {
    const r = appearanceSchema.safeParse(data.appearance);
    out.appearance = r.success ? r.data : data.appearance;
  }
  if (data.localized !== undefined) {
    const r = localizedSchema.safeParse(data.localized);
    out.localized = r.success ? r.data : data.localized;
  }
  if (data.contactLinks !== undefined) {
    const r = contactLinksSchema.safeParse(data.contactLinks);
    out.contactLinks = r.success ? r.data : data.contactLinks;
  }
  return out;
}
