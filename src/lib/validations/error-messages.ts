// Human-readable, bilingual error messages for user-facing surfaces.
// Never show raw error codes (RATE_LIMITED, P2002, CONFLICT, ...) to users.
// Usage: getFriendlyErrorMessage(data?.code ?? data?.message, lang)

export type FriendlyLang = 'ar' | 'en'

interface Entry {
  en: string
  ar: string
}

const MAP: Array<{ match: RegExp; entry: Entry }> = [
  {
    match: /RATE_LIMITED|Too many attempts|Too many requests|429/i,
    entry: {
      ar: 'لقد تجاوزت الحد المسموح به. حاول مرة أخرى بعد قليل',
      en: 'Too many attempts. Please wait a moment.',
    },
  },
  {
    match: /UNAUTHORIZED|Not signed in|Please log in|401/i,
    entry: {
      ar: 'يجب تسجيل الدخول أولاً',
      en: 'Please log in first',
    },
  },
  {
    match: /INVALID_CREDENTIALS|Invalid email or password/i,
    entry: {
      ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      en: 'Invalid email or password',
    },
  },
  {
    match: /CONFLICT|already (taken|registered|exists)|already have a pending|P2002|409|This email is already/i,
    entry: {
      ar: 'هذا البريد الإلكتروني مستخدم بالفعل',
      en: 'This email is already registered',
    },
  },
  {
    match: /VALIDATION_ERROR|Invalid input|Invalid request|validation/i,
    entry: {
      ar: 'تحقق من البيانات المدخلة',
      en: 'Please check your input',
    },
  },
  {
    match: /ACCOUNT_SUSPENDED|suspended/i,
    entry: {
      ar: 'تم إيقاف هذا الحساب. تواصل مع الدعم',
      en: 'This account is suspended. Please contact support.',
    },
  },
  {
    match: /FORBIDDEN|Forbidden|403/i,
    entry: {
      ar: 'ليس لديك صلاحية لتنفيذ هذا الإجراء',
      en: "You don't have permission to do that",
    },
  },
  {
    match: /CSRF/i,
    entry: {
      ar: 'انتهت الجلسة. حدّث الصفحة وحاول مجددًا',
      en: 'Session expired. Refresh the page and try again.',
    },
  },
  {
    match: /Failed to save|Failed to publish|Failed to create|Failed to delete|Failed to update|INTERNAL_ERROR|Internal server|Something went wrong|unexpected/i,
    entry: {
      ar: 'حدث خطأ. حاول مرة أخرى',
      en: 'Something went wrong. Please try again.',
    },
  },
]

const GENERIC: Entry = {
  ar: 'حدث خطأ. حاول مرة أخرى',
  en: 'Something went wrong. Please try again.',
}

/** Map a raw API code/message to a clear human-readable string. */
export function getFriendlyErrorMessage(raw: unknown, lang: FriendlyLang = 'ar'): string {
  const text = typeof raw === 'string' ? raw : raw == null ? '' : String(raw)
  const trimmed = text.trim()
  if (!trimmed) return lang === 'ar' ? GENERIC.ar : GENERIC.en
  // Raw JSON blob leaked to the client — never show it verbatim.
  if (/^\s*[{[]/.test(trimmed)) {
    try {
      const parsed = JSON.parse(trimmed) as { code?: unknown; message?: unknown }
      const nested = [parsed.code, parsed.message].filter(Boolean).join(' ')
      if (nested) return getFriendlyErrorMessage(nested, lang)
    } catch {
      return lang === 'ar' ? GENERIC.ar : GENERIC.en
    }
  }
  for (const { match, entry } of MAP) {
    if (match.test(trimmed)) return lang === 'ar' ? entry.ar : entry.en
  }
  // If the message already looks human (contains spaces, no SCREAMING code),
  // pass it through; otherwise fall back to generic.
  if (/^[A-Z_]{4,}$/.test(trimmed)) return lang === 'ar' ? GENERIC.ar : GENERIC.en
  return trimmed
}
