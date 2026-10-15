export interface Workspace {
  id: string
  name: string
  owner_id: string
  logo_url: string | null
  description: string | null
  theme_color: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at: string | null
  suspended_at: string | null
  archived_at: string | null
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Content {
  id: string
  workspace_id: string
  title: string
  caption: string
  platform: 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'x' | 'threads'
  platforms: ('instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'x' | 'threads')[]
  status: 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'ready'
  campaign_id: string | null
  media_urls: string[]
  scheduled_at: string | null
  planned_at: string | null
  published_at: string | null
  assigned_to: string | null
  reviewer_id: string | null
  review_notes: string | null
  submitted_for_review_at: string | null
  approved_by: string | null
  approved_at: string | null
  /** Resolved display name of the approver (enriched server-side, not a DB column) */
  approver_name?: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// ---------------------------------------------------------------------------
// Content Library (Phase 09)
// ---------------------------------------------------------------------------

export type ContentItemType = 'post' | 'strategy' | 'content_plan' | 'calendar' | 'case_study' | 'document'

export const CONTENT_ITEM_TYPES: readonly ContentItemType[] = [
  'post',
  'strategy',
  'content_plan',
  'calendar',
  'case_study',
  'document',
] as const

export function isContentItemType(value: string | null | undefined): value is ContentItemType {
  return CONTENT_ITEM_TYPES.includes(value as ContentItemType)
}

export type ContentItemStatus = 'draft' | 'published' | 'archived'

export const CONTENT_ITEM_STATUSES: readonly ContentItemStatus[] = ['draft', 'published', 'archived'] as const

export function isContentItemStatus(value: string | null | undefined): value is ContentItemStatus {
  return CONTENT_ITEM_STATUSES.includes(value as ContentItemStatus)
}

/**
 * Source of a library row:
 * - `library` — a generic ContentItem record managed by the Content Library.
 * - `legacy_post` — an existing social-post `Content` record surfaced read-only
 *   in the library (never edited/deleted from here).
 */
export type ContentItemSource = 'library' | 'legacy_post'

export interface ContentItem {
  id: string
  workspace_id: string
  title: string
  type: ContentItemType
  description: string | null
  status: ContentItemStatus
  created_by_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  source: ContentItemSource
  /** Present when source === 'legacy_post': the underlying Content row id. */
  legacy_id: string | null
}

export interface SharedLink {
  id: string
  workspace_id: string
  slug: string
  is_active: boolean
  created_at: string
}

export interface Plan {
  id: string
  name: string
  price_egp: number
  price_egp_annual?: number | null
  workspace_limit: number
  posts_per_month: number
  storage_mb: number
  is_active: boolean
  trial_days: number
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  features?: Record<string, unknown>
}

export interface Subscription {
  id: string
  user_id: string
  workspace_id: string | null
  plan_id: string
  status: 'active' | 'trial' | 'canceled' | 'expired' | 'pending'
  started_at: string
  expires_at: string | null
  canceled_at: string | null
  trial_started_at: string | null
  trial_ends_at: string | null
  grace_period_ends_at: string | null
  payment_provider: string | null
  payment_id: string | null
  amount_egp: number | null
  deleted_at: string | null
}

export interface PlanFeature {
  id?: string
  plan_id: string
  feature_key: string
  feature_value: unknown
}

export interface SubscriptionEvent {
  id: string
  subscription_id: string
  event_type: string
  from_status: string | null
  to_status: string | null
  from_plan_id: string | null
  to_plan_id: string | null
  metadata: Record<string, unknown>
  created_by: string
  created_at: string
}

export interface PaymentRecord {
  id: string
  subscription_id: string
  user_id: string
  provider: string
  order_id: string | null
  amount_egp: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  metadata: Record<string, unknown>
  created_at: string
  completed_at: string | null
}

export interface SystemSetting {
  id: string
  key: string
  value: unknown
  type: string
  description: string | null
}

export interface Lead {
  id: string
  email: string
  plan_name: string
  created_at: string
}

export interface Campaign {
  id: string
  workspace_id: string
  name: string
  goal: string
  start_date: string | null
  end_date: string | null
  priority: string
  status: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface MediaItem {
  id: string
  workspace_id: string
  cloudinary_id: string
  url: string
  filename: string
  mime_type: string
  size_bytes: number
  width: number | null
  height: number | null
  alt_text: string
  created_at: string
  deleted_at: string | null
}

export interface Strategy {
  id: string
  workspace_id: string
  title: string
  brand_name: string
  industry: string
  description: string
  website: string
  logo_url: string
  goals: Record<string, unknown>
  audience: Record<string, unknown>
  brand_voice: Record<string, unknown>
  content_pillars: Record<string, unknown>[]
  content: Record<string, unknown> | null
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  emoji: string
  cover_url: string | null
  is_complete: boolean
  created_by: string | null
  created_by_name: string
  created_at: string
  updated_at: string
  published_at: string | null
  archived_at: string | null
  campaign: string
  objective: string
  target_audience: string
  primary_persona: string
  pain_points: string
  goals_text: string
  kpis: string
  duration: string
  competitors: string[]
  channels: string[]
  publishing_frequency: string
  tone_of_voice: string
  brand_personality: string
  writing_style: string
  cta_style: string
  language: string
  collaborators: string[]
}

export interface StrategyVersion {
  id: string
  strategy_id: string
  version: number
  title: string
  content: Record<string, unknown> | null
  status: string
  created_at: string
  created_by: string | null
}

export interface StrategyTemplate {
  id: string
  workspace_id: string | null
  name: string
  category: string
  emoji: string
  description: string
  content: Record<string, unknown> | null
  metadata: Record<string, unknown>
  is_favorite: boolean
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface StrategyShare {
  id: string
  strategy_id: string
  public_id: string
  created_at: string
  created_by: string | null
  revoked_at: string | null
}

export interface ContentShare {
  id: string
  content_id: string
  public_id: string
  created_at: string
  created_by: string | null
  revoked_at: string | null
}

export interface StrategyComment {
  id: string
  strategy_id: string
  user_id: string
  parent_id: string | null
  text: string
  selection: Record<string, unknown> | null
  resolved_at: string | null
  created_at: string
}

export type PlanningStatus = 'planning' | 'draft' | 'writing' | 'review' | 'approved' | 'scheduled' | 'published'

export type ContentType = 'post' | 'reel' | 'story' | 'video' | 'carousel' | 'article' | 'email' | 'other'

export type Platform = 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'x' | 'threads' | 'youtube' | 'email' | 'blog'

export interface PlanningItem {
  id: string
  workspace_id: string
  document_id: string
  week: string
  planned_date: string | null
  platform: Platform
  content_type: ContentType
  topic: string
  goal: string
  content_pillar: string
  campaign: string | null
  cta: string | null
  status: PlanningStatus
  notes: string | null
  content_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PlanningDocument {
  id: string
  workspace_id: string
  name: string
  brand: string
  month: number | null
  year: number | null
  description: string
  color: string
  template: string
  status: 'draft' | 'published'
  owner_name: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type SwotCategory = 'strengths' | 'weaknesses' | 'opportunities' | 'threats'

export type SwotPriority = 'low' | 'medium' | 'high'

export interface SwotCard {
  id: string
  workspace_id: string
  category: SwotCategory
  title: string
  description: string
  priority: SwotPriority
  owner_id: string | null
  tags: string[]
  notes: string
  order_num: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PlanningShare {
  id: string
  document_id: string
  public_id: string
  created_at: string
  created_by: string | null
  revoked_at: string | null
}
