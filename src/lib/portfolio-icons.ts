/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  // Existing 24 icons + aliases
  Trophy,
  Star,
  Users,
  Briefcase,
  Heart,
  Zap,
  Target,
  Award,
  Clock,
  TrendingUp,
  Globe,
  Code,
  Layers,
  CheckCircle,
  Rocket,
  Mail,
  Phone,
  ExternalLink,
  ArrowRight,
  Layout,
  Palette,
  Database,
  PenTool,
  User as UserIcon,
  MessageCircle,
  // Development & Tech
  Terminal,
  Cpu,
  HardDrive,
  Server,
  Laptop,
  Monitor,
  Smartphone,
  Tablet,
  Wifi,
  Cloud,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Binary,
  Bug,
  Box,
  Braces,
  Key,
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  Flame,
  // Design & Creative
  Brush,
  Camera,
  Video,
  Film,
  Music,
  Mic,
  Headphones,
  Scissors,
  Wand2,
  Crop,
  Eye,
  Compass,
  Sparkles,
  Contrast,
  Shapes,
  // Business, Marketing & Finance
  DollarSign,
  CreditCard,
  Banknote,
  Landmark,
  Wallet,
  PiggyBank,
  BarChart,
  BarChart2,
  BarChart3,
  LineChart,
  PieChart,
  Presentation,
  Megaphone,
  Lightbulb,
  Crown,
  Medal,
  TrendingDown,
  Activity,
  Percent,
  ShoppingCart,
  ShoppingBag,
  Store,
  Tag,
  Bookmark,
  Flag,
  // Work, Education & Achievements
  GraduationCap,
  BookOpen,
  Book,
  Library,
  Newspaper,
  Scroll,
  Building,
  Building2,
  Factory,
  CheckCheck,
  ListCheck,
  ClipboardList,
  Calendar,
  CalendarDays,
  Milestone,
  FileText,
  FileCode,
  Folder,
  FolderOpen,
  // Social, Communication & Web
  AtSign,
  Hash,
  MessageSquare,
  MessagesSquare,
  PhoneCall,
  Radio,
  Podcast,
  Rss,
  Share2,
  Send,
  Bell,
  ThumbsUp,
  Smile,
  Link as LinkIcon,
  Download,
  Upload,
  Search,
  MapPin,
  Map,
  Navigation,
  // Tools & System
  Wrench,
  Settings,
  Cog,
  Sliders,
  Power,
  RefreshCw,
  // Lifestyle & Nature
  Sun,
  Moon,
  Coffee,
  Plane,
  Car,
  Bike,
  Utensils,
  Gem,
  Check,
  HelpCircle,
  Info,
  AlertTriangle,
  Feather,
  Filter,
  Play,
  Languages,
  BadgePercent,
  UserCheck,
  Handshake,
} from 'lucide-react'

export interface IconDefinition {
  key: string
  name: string
  nameAr: string
  icon: LucideIcon
  category: 'general' | 'tech' | 'design' | 'business' | 'education' | 'social' | 'tools'
}

export const RAW_PORTFOLIO_ICONS: IconDefinition[] = [
  // 1. General & Highlights (Canonical top icons + lifestyle)
  { key: 'trophy', name: 'Trophy', nameAr: 'كأس وإنجاز', icon: Trophy, category: 'general' },
  { key: 'star', name: 'Star', nameAr: 'نجمة وتميز', icon: Star, category: 'general' },
  { key: 'users', name: 'Users', nameAr: 'فريق ومستخدمين', icon: Users, category: 'general' },
  { key: 'user', name: 'User', nameAr: 'مستخدم وشخصي', icon: UserIcon, category: 'general' },
  { key: 'usercheck', name: 'User Check', nameAr: 'مستخدم موثق ومعتمد', icon: UserCheck, category: 'general' },
  { key: 'heart', name: 'Heart', nameAr: 'قلب وشغف', icon: Heart, category: 'general' },
  { key: 'zap', name: 'Zap', nameAr: 'برق وطاقة وسرعة', icon: Zap, category: 'general' },
  { key: 'award', name: 'Award', nameAr: 'وسام وجائزة', icon: Award, category: 'general' },
  { key: 'clock', name: 'Clock', nameAr: 'ساعة ووقت', icon: Clock, category: 'general' },
  { key: 'calendar', name: 'Calendar', nameAr: 'تقويم ومواعيد وتاريخ', icon: Calendar, category: 'general' },
  { key: 'calendardays', name: 'Calendar Days', nameAr: 'أيام وتقويم شهري', icon: CalendarDays, category: 'general' },
  { key: 'globe', name: 'Globe', nameAr: 'كرة أرضية وويب', icon: Globe, category: 'general' },
  { key: 'rocket', name: 'Rocket', nameAr: 'صاروخ وإطلاق', icon: Rocket, category: 'general' },
  { key: 'externalink', name: 'External Link', nameAr: 'رابط خارجي', icon: ExternalLink, category: 'general' },
  { key: 'arrowright', name: 'Arrow Right', nameAr: 'سهم يمين', icon: ArrowRight, category: 'general' },
  { key: 'check', name: 'Check', nameAr: 'علامة صح', icon: Check, category: 'general' },
  { key: 'checkcircle', name: 'Check Circle', nameAr: 'علامة صح دائرية', icon: CheckCircle, category: 'general' },
  { key: 'checkcheck', name: 'Check Check', nameAr: 'تم بنجاح ومقروء', icon: CheckCheck, category: 'general' },
  { key: 'bookmark', name: 'Bookmark', nameAr: 'إشارة مرجعية', icon: Bookmark, category: 'general' },
  { key: 'flag', name: 'Flag', nameAr: 'علم ومحطة', icon: Flag, category: 'general' },
  { key: 'flame', name: 'Flame', nameAr: 'شعلة ونشاط عالي', icon: Flame, category: 'general' },
  { key: 'sun', name: 'Sun', nameAr: 'شمس ونهار', icon: Sun, category: 'general' },
  { key: 'moon', name: 'Moon', nameAr: 'قمر وليل', icon: Moon, category: 'general' },
  { key: 'coffee', name: 'Coffee', nameAr: 'قهوة واستراحة', icon: Coffee, category: 'general' },
  { key: 'plane', name: 'Plane', nameAr: 'طائرة وسفر', icon: Plane, category: 'general' },
  { key: 'car', name: 'Car', nameAr: 'سيارة ونقل', icon: Car, category: 'general' },
  { key: 'bike', name: 'Bike', nameAr: 'دراجة ورياضة', icon: Bike, category: 'general' },
  { key: 'utensils', name: 'Utensils', nameAr: 'طعام ومطاعم', icon: Utensils, category: 'general' },
  { key: 'gem', name: 'Gem', nameAr: 'جوهرة وألماس', icon: Gem, category: 'general' },
  { key: 'helpcircle', name: 'Help', nameAr: 'مساعدة واستفسار', icon: HelpCircle, category: 'general' },
  { key: 'info', name: 'Info', nameAr: 'معلومات وتنبيه', icon: Info, category: 'general' },
  { key: 'alerttriangle', name: 'Alert', nameAr: 'تحذير وخطر', icon: AlertTriangle, category: 'general' },
  { key: 'mappin', name: 'Map Pin', nameAr: 'موقع جغرافي', icon: MapPin, category: 'general' },
  { key: 'map', name: 'Map', nameAr: 'خريطة', icon: Map, category: 'general' },
  { key: 'navigation', name: 'Navigation', nameAr: 'ملاحة وتوجيه', icon: Navigation, category: 'general' },
  { key: 'compass', name: 'Compass', nameAr: 'بوصلة واستكشاف', icon: Compass, category: 'general' },
  { key: 'languages', name: 'Languages', nameAr: 'لغات وترجمة وثقافات', icon: Languages, category: 'general' },

  // 2. Tech & Development
  { key: 'code', name: 'Code', nameAr: 'كود برمجة برمجية تطوير', icon: Code, category: 'tech' },
  { key: 'layers', name: 'Layers', nameAr: 'طبقات وهيكلية', icon: Layers, category: 'tech' },
  { key: 'database', name: 'Database', nameAr: 'قاعدة بيانات', icon: Database, category: 'tech' },
  { key: 'terminal', name: 'Terminal', nameAr: 'سطر أوامر وطرفية', icon: Terminal, category: 'tech' },
  { key: 'cpu', name: 'CPU / Processor', nameAr: 'معالج وهاردوير', icon: Cpu, category: 'tech' },
  { key: 'harddrive', name: 'Hard Drive', nameAr: 'قرص تخزين', icon: HardDrive, category: 'tech' },
  { key: 'server', name: 'Server', nameAr: 'سيرفر وخادم', icon: Server, category: 'tech' },
  { key: 'laptop', name: 'Laptop', nameAr: 'حاسوب محمول', icon: Laptop, category: 'tech' },
  { key: 'monitor', name: 'Monitor', nameAr: 'شاشة حاسوب', icon: Monitor, category: 'tech' },
  { key: 'smartphone', name: 'Smartphone', nameAr: 'هاتف ذكي وتطبيقات', icon: Smartphone, category: 'tech' },
  { key: 'tablet', name: 'Tablet', nameAr: 'جهاز لوحي', icon: Tablet, category: 'tech' },
  { key: 'wifi', name: 'WiFi', nameAr: 'شبكات واتصال', icon: Wifi, category: 'tech' },
  { key: 'cloud', name: 'Cloud', nameAr: 'سحابة وتخزين سحابي', icon: Cloud, category: 'tech' },
  { key: 'gitbranch', name: 'Git Branch', nameAr: 'فرع غيت وإصدارات', icon: GitBranch, category: 'tech' },
  { key: 'gitcommit', name: 'Git Commit', nameAr: 'نقطة حفظ غيت', icon: GitCommit, category: 'tech' },
  { key: 'gitpullrequest', name: 'Pull Request', nameAr: 'دمج كود', icon: GitPullRequest, category: 'tech' },
  { key: 'binary', name: 'Binary', nameAr: 'أرقام ثنائية', icon: Binary, category: 'tech' },
  { key: 'bug', name: 'Bug', nameAr: 'إصلاح الأخطاء البرمجية', icon: Bug, category: 'tech' },
  { key: 'box', name: 'Box / Package', nameAr: 'حزمة ومكتبة', icon: Box, category: 'tech' },
  { key: 'braces', name: 'Braces', nameAr: 'أقواس برمجة', icon: Braces, category: 'tech' },
  { key: 'filecode', name: 'File Code', nameAr: 'ملف برمجيات', icon: FileCode, category: 'tech' },
  { key: 'key', name: 'Key', nameAr: 'مفتاح أمان', icon: Key, category: 'tech' },
  { key: 'lock', name: 'Lock', nameAr: 'قفل وحماية', icon: Lock, category: 'tech' },
  { key: 'unlock', name: 'Unlock', nameAr: 'فتح قفل', icon: Unlock, category: 'tech' },
  { key: 'shield', name: 'Shield', nameAr: 'درع حماية', icon: Shield, category: 'tech' },
  { key: 'shieldcheck', name: 'Shield Check', nameAr: 'أمان موثق', icon: ShieldCheck, category: 'tech' },

  // 3. Design & Creative
  { key: 'layout', name: 'Layout', nameAr: 'واجهة وتصميم', icon: Layout, category: 'design' },
  { key: 'palette', name: 'Palette', nameAr: 'ألوان وفنون', icon: Palette, category: 'design' },
  { key: 'pen', name: 'Pen', nameAr: 'قلم رسم وتصميم', icon: PenTool, category: 'design' },
  { key: 'brush', name: 'Brush', nameAr: 'فرشاة تلوين', icon: Brush, category: 'design' },
  { key: 'camera', name: 'Camera', nameAr: 'كاميرا وتصوير', icon: Camera, category: 'design' },
  { key: 'video', name: 'Video', nameAr: 'فيديو ومونتاج', icon: Video, category: 'design' },
  { key: 'film', name: 'Film', nameAr: 'فيلم وسينما', icon: Film, category: 'design' },
  { key: 'music', name: 'Music', nameAr: 'موسيقى وصوتيات', icon: Music, category: 'design' },
  { key: 'mic', name: 'Mic', nameAr: 'ميكروفون وتسجيل', icon: Mic, category: 'design' },
  { key: 'headphones', name: 'Headphones', nameAr: 'سماعات رأس', icon: Headphones, category: 'design' },
  { key: 'scissors', name: 'Scissors', nameAr: 'مقص وتعديل', icon: Scissors, category: 'design' },
  { key: 'wand2', name: 'Magic Wand', nameAr: 'عصا سحرية وذكاء اصطناعي', icon: Wand2, category: 'design' },
  { key: 'crop', name: 'Crop', nameAr: 'قص واقتصاص', icon: Crop, category: 'design' },
  { key: 'eye', name: 'Eye', nameAr: 'عين ورؤية ومشاهدة', icon: Eye, category: 'design' },
  { key: 'contrast', name: 'Contrast', nameAr: 'تباين وإضاءة', icon: Contrast, category: 'design' },
  { key: 'shapes', name: 'Shapes', nameAr: 'أشكال هندسية', icon: Shapes, category: 'design' },
  { key: 'feather', name: 'Feather', nameAr: 'ريشة وكتابة وتدوين', icon: Feather, category: 'design' },
  { key: 'sparkles', name: 'Sparkles', nameAr: 'بريق وتألق وإبداع', icon: Sparkles, category: 'design' },
  { key: 'play', name: 'Play', nameAr: 'تشغيل وفيديو وصوتيات', icon: Play, category: 'design' },

  // 4. Business & Finance
  { key: 'briefcase', name: 'Briefcase', nameAr: 'حقيبة عمل ووظيفة', icon: Briefcase, category: 'business' },
  { key: 'target', name: 'Target', nameAr: 'هدف ودقة', icon: Target, category: 'business' },
  { key: 'trendingup', name: 'Trending Up', nameAr: 'نمو وصعود', icon: TrendingUp, category: 'business' },
  { key: 'trendingdown', name: 'Trending Down', nameAr: 'هبوط ومخاطر', icon: TrendingDown, category: 'business' },
  { key: 'dollarsign', name: 'Dollar', nameAr: 'عملة ومال', icon: DollarSign, category: 'business' },
  { key: 'creditcard', name: 'Credit Card', nameAr: 'بطاقة ائتمانية ودفع', icon: CreditCard, category: 'business' },
  { key: 'banknote', name: 'Banknote', nameAr: 'نقود نقدية', icon: Banknote, category: 'business' },
  { key: 'landmark', name: 'Landmark / Bank', nameAr: 'بنك ومؤسسة', icon: Landmark, category: 'business' },
  { key: 'wallet', name: 'Wallet', nameAr: 'محفظة مالية', icon: Wallet, category: 'business' },
  { key: 'piggybank', name: 'Piggy Bank', nameAr: 'حصالة توفير', icon: PiggyBank, category: 'business' },
  { key: 'barchart', name: 'Bar Chart', nameAr: 'رسم بياني أعمدة', icon: BarChart, category: 'business' },
  { key: 'barchart2', name: 'Bar Chart 2', nameAr: 'مخطط إحصائي', icon: BarChart2, category: 'business' },
  { key: 'barchart3', name: 'Bar Chart 3', nameAr: 'إحصائيات متقدمة', icon: BarChart3, category: 'business' },
  { key: 'linechart', name: 'Line Chart', nameAr: 'مخطط خطي للنمو', icon: LineChart, category: 'business' },
  { key: 'piechart', name: 'Pie Chart', nameAr: 'مخطط دائري', icon: PieChart, category: 'business' },
  { key: 'presentation', name: 'Presentation', nameAr: 'عرض تقديمي', icon: Presentation, category: 'business' },
  { key: 'megaphone', name: 'Megaphone', nameAr: 'مكبر صوت وتسويق', icon: Megaphone, category: 'business' },
  { key: 'lightbulb', name: 'Lightbulb', nameAr: 'مصباح وأفكار', icon: Lightbulb, category: 'business' },
  { key: 'crown', name: 'Crown', nameAr: 'تاج وريادة', icon: Crown, category: 'business' },
  { key: 'medal', name: 'Medal', nameAr: 'ميدالية شرف', icon: Medal, category: 'business' },
  { key: 'activity', name: 'Activity', nameAr: 'نشاط وحيوية', icon: Activity, category: 'business' },
  { key: 'percent', name: 'Percent', nameAr: 'نسبة مئوية وخصم', icon: Percent, category: 'business' },
  { key: 'badgepercent', name: 'Discount', nameAr: 'خصم وعروض ونسبة مئوية', icon: BadgePercent, category: 'business' },
  { key: 'shoppingcart', name: 'Shopping Cart', nameAr: 'عربة تسوق', icon: ShoppingCart, category: 'business' },
  { key: 'shoppingbag', name: 'Shopping Bag', nameAr: 'حقيبة تسوق ومتاجر', icon: ShoppingBag, category: 'business' },
  { key: 'store', name: 'Store', nameAr: 'متجر ومحل', icon: Store, category: 'business' },
  { key: 'tag', name: 'Tag', nameAr: 'وسم وعلامة', icon: Tag, category: 'business' },
  { key: 'building', name: 'Building', nameAr: 'مبنى وشركة', icon: Building, category: 'business' },
  { key: 'building2', name: 'Building 2', nameAr: 'ناطحة سحاب ومقر شركة', icon: Building2, category: 'business' },
  { key: 'factory', name: 'Factory', nameAr: 'مصنع وإنتاج وصناعة', icon: Factory, category: 'business' },
  { key: 'milestone', name: 'Milestone', nameAr: 'محطة رئيسية وإنجاز فارق', icon: Milestone, category: 'business' },
  { key: 'handshake', name: 'Handshake', nameAr: 'شراكة واتفاق وتعاون', icon: Handshake, category: 'business' },

  // 5. Education & Documents
  { key: 'graduationcap', name: 'Graduation Cap', nameAr: 'قبعة تخرج وتعليم', icon: GraduationCap, category: 'education' },
  { key: 'bookopen', name: 'Open Book', nameAr: 'كتاب مفتوح وقراءة', icon: BookOpen, category: 'education' },
  { key: 'book', name: 'Book', nameAr: 'كتاب ومقرر', icon: Book, category: 'education' },
  { key: 'library', name: 'Library', nameAr: 'مكتبة ومراجع', icon: Library, category: 'education' },
  { key: 'newspaper', name: 'Newspaper', nameAr: 'جريدة وصحافة وأخبار', icon: Newspaper, category: 'education' },
  { key: 'scroll', name: 'Scroll', nameAr: 'مخطوطة وشهادة وتاريخ', icon: Scroll, category: 'education' },
  { key: 'filetext', name: 'Document', nameAr: 'مستند نصي وملف', icon: FileText, category: 'education' },
  { key: 'folder', name: 'Folder', nameAr: 'مجلد وملفات', icon: Folder, category: 'education' },
  { key: 'folderopen', name: 'Folder Open', nameAr: 'مجلد مفتوح', icon: FolderOpen, category: 'education' },

  // 6. Social & Communication
  { key: 'mail', name: 'Mail', nameAr: 'بريد إلكتروني', icon: Mail, category: 'social' },
  { key: 'phone', name: 'Phone', nameAr: 'هاتف', icon: Phone, category: 'social' },
  { key: 'phonecall', name: 'Phone Call', nameAr: 'مكالمة هاتفية', icon: PhoneCall, category: 'social' },
  { key: 'message', name: 'Message', nameAr: 'محادثة ورسائل', icon: MessageCircle, category: 'social' },
  { key: 'messagesquare', name: 'Message Square', nameAr: 'رسالة مربعة', icon: MessageSquare, category: 'social' },
  { key: 'messagessquare', name: 'Messages', nameAr: 'محادثات متعددة', icon: MessagesSquare, category: 'social' },
  { key: 'atsign', name: 'At Sign', nameAr: 'رمز آت وتواصل اجتماعي', icon: AtSign, category: 'social' },
  { key: 'hash', name: 'Hash', nameAr: 'هاشتاغ وعلامة تصنيف', icon: Hash, category: 'social' },
  { key: 'radio', name: 'Radio', nameAr: 'راديو وبث', icon: Radio, category: 'social' },
  { key: 'podcast', name: 'Podcast', nameAr: 'بودكاست وصوتيات', icon: Podcast, category: 'social' },
  { key: 'rss', name: 'RSS', nameAr: 'تغذية ومقالات', icon: Rss, category: 'social' },
  { key: 'share2', name: 'Share', nameAr: 'مشاركة ونشر', icon: Share2, category: 'social' },
  { key: 'send', name: 'Send', nameAr: 'إرسال وتلغرام', icon: Send, category: 'social' },
  { key: 'bell', name: 'Bell', nameAr: 'جرس وتنبيهات', icon: Bell, category: 'social' },
  { key: 'thumbsup', name: 'Thumbs Up', nameAr: 'إعجاب وتأييد', icon: ThumbsUp, category: 'social' },
  { key: 'smile', name: 'Smile', nameAr: 'ابتسامة وسعادة', icon: Smile, category: 'social' },
  { key: 'link', name: 'Link', nameAr: 'رابط تشعبي', icon: LinkIcon, category: 'social' },

  // 7. Tools & Utilities
  { key: 'download', name: 'Download', nameAr: 'تنزيل وتحميل', icon: Download, category: 'tools' },
  { key: 'upload', name: 'Upload', nameAr: 'رفع ملفات', icon: Upload, category: 'tools' },
  { key: 'search', name: 'Search', nameAr: 'بحث واستكشاف', icon: Search, category: 'tools' },
  { key: 'wrench', name: 'Wrench', nameAr: 'مفتاح صيانة وأدوات', icon: Wrench, category: 'tools' },
  { key: 'settings', name: 'Settings', nameAr: 'إعدادات وتروس', icon: Settings, category: 'tools' },
  { key: 'cog', name: 'Cog', nameAr: 'ترس تحكم', icon: Cog, category: 'tools' },
  { key: 'sliders', name: 'Sliders', nameAr: 'مؤشرات تعديل', icon: Sliders, category: 'tools' },
  { key: 'power', name: 'Power', nameAr: 'تشغيل وطاقة', icon: Power, category: 'tools' },
  { key: 'refreshcw', name: 'Refresh', nameAr: 'تحديث ومزامنة', icon: RefreshCw, category: 'tools' },
  { key: 'listcheck', name: 'List Check', nameAr: 'قائمة مهام مكتملة', icon: ListCheck, category: 'tools' },
  { key: 'clipboardlist', name: 'Clipboard', nameAr: 'لوحة مهام وتدقيق', icon: ClipboardList, category: 'tools' },
  { key: 'filter', name: 'Filter', nameAr: 'تصفية وفلترة', icon: Filter, category: 'tools' },
]

// Deduplicate canonical keys: each icon must appear exactly once in its single most relevant category
const seenKeys = new Set<string>()
export const PORTFOLIO_ICONS: IconDefinition[] = []
for (const item of RAW_PORTFOLIO_ICONS) {
  const normKey = item.key.toLowerCase().trim()
  if (!seenKeys.has(normKey)) {
    seenKeys.add(normKey)
    PORTFOLIO_ICONS.push(item)
  }
}

export const PORTFOLIO_ICON_LIST = PORTFOLIO_ICONS

/** Map of key -> Lucide component for O(1) lookup. Includes aliases. */
export const PORTFOLIO_ICON_MAP: Record<string, React.ComponentType<any>> = {}

for (const item of PORTFOLIO_ICONS) {
  PORTFOLIO_ICON_MAP[item.key.toLowerCase()] = item.icon
  // Also register alphanumeric-only normalized key
  PORTFOLIO_ICON_MAP[item.key.toLowerCase().replace(/[^a-z0-9]/g, '')] = item.icon
}

// Explicit legacy alias mappings
PORTFOLIO_ICON_MAP['pen'] = PenTool
PORTFOLIO_ICON_MAP['pentool'] = PenTool
PORTFOLIO_ICON_MAP['feather'] = Feather
PORTFOLIO_ICON_MAP['externalink'] = ExternalLink
PORTFOLIO_ICON_MAP['externallink'] = ExternalLink
PORTFOLIO_ICON_MAP['user'] = UserIcon
PORTFOLIO_ICON_MAP['message'] = MessageCircle
PORTFOLIO_ICON_MAP['messagecircle'] = MessageCircle
PORTFOLIO_ICON_MAP['document'] = FileText
PORTFOLIO_ICON_MAP['doc'] = FileText
PORTFOLIO_ICON_MAP['file'] = FileText

function normalizeArabic(text: string): string {
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .trim()
}

export function searchPortfolioIcons(query: string) {
  const q = normalizeArabic(query)
  if (!q) return PORTFOLIO_ICONS
  return PORTFOLIO_ICONS.filter((item) => {
    const key = item.key.toLowerCase()
    const name = item.name.toLowerCase()
    const nameAr = normalizeArabic(item.nameAr)
    return key.includes(q) || name.includes(q) || nameAr.includes(q)
  })
}

export function getPortfolioIcon(name?: string | null, className?: string) {
  if (!name) return null
  const clean = name.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
  const Icon = PORTFOLIO_ICON_MAP[clean] || PORTFOLIO_ICON_MAP[name.toLowerCase().trim()]
  return Icon ? React.createElement(Icon, { className, 'aria-hidden': 'true' }) : null
}
