export type ServiceCategory = 
  | 'Branding & Packaging'
  | 'Creative Design'
  | 'Performance Marketing Creatives'
  | 'Video Production & Editing'
  | 'Digital Marketing & Social Media Management'
  | 'Website & UI/UX Design'
  | 'E-commerce & Marketplace Creative Design'
  | 'Motion Graphics & Animation'
  | 'Print & Marketing Collateral'
  | 'Presentation & Pitch Deck Design'
  | string;

export type EnquiryStatus = 'New' | 'Contacted' | 'Quotation Sent' | 'In Progress' | 'Converted' | 'Completed' | 'Archived';

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  service: ServiceCategory | string;
  budget?: string;
  deadline?: string;
  details: string;
  consent: boolean;
  status: EnquiryStatus;
  internalNotes?: string;
  convertedProjectId?: string;
  createdAt: string;
}

export type ProjectStatus = 'Discovery' | 'In Progress' | 'Review & Revisions' | 'Awaiting Final Payment' | 'Completed' | 'Archived';
export type ProjectPaymentStatus = 'Unpaid' | 'Partially Paid' | 'Fully Paid';

export interface ProjectDeliverableItem {
  id: string;
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
}

export interface ProjectAdjustment {
  id: string;
  type: 'discount' | 'addition' | 'waiver';
  amount: number;
  reason: string;
  createdAt: string;
  createdBy?: string;
}

export interface ProjectAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface Project {
  id: string;
  clientName: string;
  contactEmail: string;
  contactPhone: string;
  projectName: string;
  services: string[];
  agreedAmount: number;
  advanceAmountAgreed?: number;
  startDate: string;
  deadline: string;
  status: ProjectStatus;
  internalNotes?: string;
  clientPaymentToken: string;
  enquiryId?: string;
  deliverables?: ProjectDeliverableItem[];
  adjustments?: ProjectAdjustment[];
  auditLog?: ProjectAuditEntry[];
  completedAt?: string;
  completedBy?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PaymentVerificationStatus = 'Pending Verification' | 'Verified' | 'Rejected';

export interface PaymentTransaction {
  id: string;
  projectId: string;
  clientName: string;
  amount: number;
  utr: string;
  upiId: string;
  paymentMethod?: string;
  paymentDate: string;
  status: PaymentVerificationStatus;
  proofUrl?: string;
  proofFileName?: string;
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  receiptId?: string;
  duplicateWarningAcknowledged?: boolean;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountType: 'Current' | 'Savings';
  internalLabel: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceBankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountType: string;
}

export interface Invoice {
  id: string;
  projectId: string;
  clientName: string;
  contactEmail: string;
  contactPhone: string;
  projectName: string;
  amount: number;
  lineItems: Array<{ description: string; amount: number }>;
  issueDate: string;
  dueDate: string;
  status: 'Issued' | 'Partially Paid' | 'Paid' | 'Cancelled';
  notes?: string;
  upiId: string;
  bankAccountId?: string;
  bankDetails?: InvoiceBankDetails;
  createdAt: string;
}

export interface Receipt {
  id: string;
  paymentId: string;
  projectId: string;
  invoiceId?: string;
  clientName: string;
  amountReceived: number;
  utr: string;
  verifiedDate: string;
  agreedProjectAmount: number;
  totalVerifiedPaid: number;
  remainingBalance: number;
  isFinalReceipt: boolean;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin';
}

export interface AdminStats {
  totalEnquiries: number;
  newEnquiries: number;
  activeProjects: number;
  completedProjects: number;
  totalPaymentsReceived: number;
  outstandingBalances: number;
  pendingVerificationCount: number;
  recentActivity: Array<{
    id: string;
    type: 'enquiry' | 'payment' | 'project' | 'receipt';
    description: string;
    timestamp: string;
    status?: string;
  }>;
}

// -------------------------------------------------------------
// CMS Interfaces for Dynamic Content Management
// -------------------------------------------------------------

export interface ProjectVideoItem {
  id: string;
  url: string;
  title?: string;
  caption?: string;
  poster?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface PortfolioMediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  posterUrl?: string;
  caption?: string;
  altText?: string;
  title?: string;
  order: number;
}

export interface CaseStudySection {
  id: string;
  title: string;
  content: string;
  image?: string;
  order: number;
}

export interface PortfolioColorSwatch {
  id?: string;
  name: string;
  hex: string;
}

export interface CMSPortfolioItem {
  id: string;
  title: string;
  category: string;
  tagline: string;
  image: string;
  gallery?: PortfolioMediaItem[];
  videoUrl?: string;
  videoPoster?: string;
  videoTitle?: string;
  videoCaption?: string;
  videos?: ProjectVideoItem[];
  caseStudySections?: CaseStudySection[];
  associatedServices?: string[];
  brandStrategy?: string;
  strategyHeading?: string;
  strategyDescription?: string;
  executionHeading?: string;
  executionDescription?: string;
  paletteHeading?: string;
  paletteSubtitle?: string;
  paletteSwatches?: PortfolioColorSwatch[];
  colorPalette?: string[];
  deliverablesHeading?: string;
  deliverables: string[];
  specs: {
    format: string;
    timeline: string;
    tools: string;
  };
  clientName?: string;
  projectYear?: string;
  isConcept: boolean;
  brief: string;
  approach: string;
  ctaText?: string;
  ctaPrompt?: string;
  typographyNotes?: string;
  tags?: string[];
  published: boolean;
  isDraft?: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CMSPortfolioProject = CMSPortfolioItem;
export type CMSService = CMSServiceItem;

export interface CMSTestimonial {
  id: string;
  clientName: string;
  company: string;
  designation?: string;
  photoUrl?: string;
  rating: number; // 1 to 5
  text: string;
  category?: string;
  published: boolean;
  order: number;
  isPlaceholder: boolean;
  createdAt?: string;
}

export interface CMSTrustedBrand {
  id: string;
  name: string;
  logoUrl?: string;
  order: number;
  active: boolean;
}

export interface CMSProcessStep {
  id: string;
  number: string;
  title: string;
  subtitle?: string;
  desc: string;
  iconName?: string;
  badge?: string;
  details?: string[];
}

export interface CMSHeroSlide {
  id: string;
  category: string;
  title: string;
  imageUrl: string;
  targetPath: string;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  altText?: string;
  focalPoint?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  fit?: 'cover' | 'contain';
  uploadedAt: string;
  inUseCount?: number;
}

export interface CMSSectionCard {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  image?: string;
  badge?: string;
  link?: string;
  ctaText?: string;
}

export interface CMSCustomSection {
  id: string;
  page: 'home' | 'about' | 'services' | 'contact' | 'global';
  serviceSlug?: string;
  title: string; // Internal admin identifier
  displayHeading?: string; // Public display heading (optional - separates admin title from public heading)
  subtitle?: string;
  badge?: string;
  description?: string;
  layout: 'cards' | 'features' | 'banner' | 'grid' | 'text-split';
  order: number;
  published: boolean;
  cards: CMSSectionCard[];
  bannerImage?: string;
  ctaText?: string;
  ctaLink?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CMSServiceConcept {
  id: string;
  serviceId: string; // 'branding' | 'creative' | 'performance' | 'video' | 'digital' | custom
  title: string;
  category: string;
  tagline: string;
  description: string;
  image: string;
  deliverables: string[];
  clientName?: string;
  order: number;
  published: boolean;
  featured?: boolean;
  createdAt?: string;
}

export interface CMSImageSlot {
  id: string;
  page: 'home' | 'services' | 'portfolio' | 'about' | 'contact' | 'global' | 'legal';
  section: string;
  title: string;
  currentUrl: string;
  desktopUrl?: string;
  mobileUrl?: string;
  tabletUrl?: string;
  actualDimensions?: string;
  recommendedDimensions: string;
  aspectRatio: string;
  maxSize: string;
  formats: string[];
  focalPoint?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  altText: string;
  previousUrl?: string;
  updatedAt?: string;
}

export interface CMSServiceItem {
  id: string;
  slug: string;
  number: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  image: string;
  bannerImage?: string;
  deliverables: string[];
  keyHighlights: string[];
  ctaText?: string;
  ctaDestination?: string;
  order: number;
  published: boolean;
}

export interface CMSContentVersion {
  id: string;
  timestamp: string;
  label: string;
  siteContent: CMSSiteContent;
}

export interface CMSSiteContent {
  logoUrl?: string;
  logoText: string;
  logoSubtitle: string;
  heroHeadline: string;
  heroSubheadline: string;
  aboutHeadline: string;
  aboutTagline: string;
  aboutStory: string;
  aboutApproach: string;
  contactEmail: string;
  contactPhone: string; // The displayed mobile number: 0000000
  functionalPhoneDestination?: string; // The functional dialer/whatsapp destination: +91 9817961412
  contactWhatsapp: string;
  contactInstagram: string;
  contactHeadline?: string;
  contactSubheadline?: string;
  ctaHeadline: string;
  ctaSubheadline: string;
  portfolioCategories: string[];
  processSteps?: CMSProcessStep[];
  heroSlides?: CMSHeroSlide[];
  websiteImages?: CMSImageSlot[];
  services?: CMSServiceItem[];
  // Hero Brand Video (15-second cinematic brand film)
  heroVideoUrl?: string;
  heroVideoPoster?: string;
  heroVideoEnabled?: boolean;
  heroVideoHeading?: string;
  // Visual & Brand Customizations (7 Global Brand Theme & Colors)
  primaryColor?: string; // 1. Primary Brand Color (#173B75)
  secondaryColor?: string; // 2. Secondary Brand Color (#2458A6)
  brightBlueColor?: string; // Secondary color alias
  accentColor?: string; // 3. Accent / CTA Color (#F07822)
  backgroundColor?: string; // 4. Page Background Color (#FFF9F1)
  headingColor?: string; // 5. Heading Text Color (#173B75)
  bodyColor?: string; // 6. Body Text Color (#252A34)
  surfaceColor?: string; // 7. Border / Surface Color (#E4D8C8)
  charcoalColor?: string; // Body color alias
  brandProportions?: {
    navy: number;
    softCream: number;
    warmOrange: number;
    brightBlue: number;
    charcoal: number;
  };
  headerLogoUrl?: string;
  footerLogoUrl?: string;
  logoHeight?: number;
  logoWidth?: number;
  ctaAnimationType?: 'static' | 'animated' | 'wavy' | 'gaming' | 'white_particles_focus' | 'white_particles' | 'particles' | 'none';
  aboutSectionOrder?: string[];
  // Services Page Creative Banner (Editable from Admin Console)
  servicesBanner?: CMSServicesBanner;
  // Custom Page Banners (Desktop & Mobile uploads with independent CTA) for Home, Services, Portfolio, About, Contact
  pageBanners?: Partial<Record<WebsitePageKey, PageBannerConfig>>;
  // Page-Specific Footer CTA Banners (Home, Services, Portfolio, About, Contact)
  footerCtas?: Partial<Record<WebsitePageKey, PageFooterCtaConfig>>;
  // Home Page Editable Copy
  heroBadge?: string;
  heroPrimaryCtaText?: string;
  heroPrimaryCtaLink?: string;
  heroSecondaryCtaText?: string;
  heroSecondaryCtaLink?: string;
  // Services Page Editable Copy
  servicesBadge?: string;
  servicesHeroHeadline?: string;
  servicesHeroSubheadline?: string;
  servicesCapabilitiesEyebrow?: string;
  servicesCapabilitiesHeading?: string;
  servicesCapabilitiesSubtitle?: string;
  // Methodology Editable Copy
  methodologyBadge?: string;
  methodologyHeading?: string;
  methodologySubtitle?: string;
  methodologyAssuranceTitle?: string;
  methodologyAssuranceDesc?: string;
  servicesMethodologySteps?: Array<{
    id: string;
    number: string;
    title: string;
    subtitle?: string;
    desc: string;
    details?: string[];
  }>;
  // About Page Editable Copy
  aboutStoryTitle?: string;
  aboutApproachTitle?: string;
  aboutStandardsBadge?: string;
  aboutStandardsHeadline?: string;
  aboutStandardsSubtitle?: string;
  aboutStandardsCards?: Array<{
    id: string;
    badge: string;
    title: string;
    subtitle?: string;
    desc: string;
    iconName?: string;
  }>;
  aboutPrinciplesEyebrow?: string;
  aboutPrinciplesHeading?: string;
  aboutPrinciplesSubtitle?: string;
  aboutPrinciplesCards?: Array<{
    id: string;
    title: string;
    desc: string;
    iconName?: string;
  }>;
  // Contact Page Next Steps Copy
  contactNextHeading?: string;
  contactNextSteps?: Array<{
    id: string;
    number: string;
    title: string;
    desc: string;
  }>;
  // Portfolio Page Editable Copy
  portfolioBadge?: string;
  portfolioHeadline?: string;
  portfolioSubheadline?: string;
  // Contact Page Editable Copy
  contactBadge?: string;
  contactAddress?: string;
  contactHours?: string;
  contactFormTitle?: string;
  contactFormSubtitle?: string;
  contactFormButtonLabel?: string;
  contactFormNotice?: string;
  contactFaqBadge?: string;
  contactFaqTitle?: string;
  contactFaqSubtitle?: string;
  faqs?: CMSFaqItem[];
  // Homepage granular section copy
  homeAboutBadge?: string;
  homeAboutHeadline?: string;
  homeAboutText?: string;
  homeAboutButtonText?: string;
  homeAboutButtonLink?: string;
  homeStat1Value?: string;
  homeStat1Label?: string;
  homeStat2Value?: string;
  homeStat2Label?: string;
  homeStat3Value?: string;
  homeStat3Label?: string;
  homeStat4Value?: string;
  homeStat4Label?: string;
  homeServicesBadge?: string;
  homeServicesHeadline?: string;
  homeServicesSubheadline?: string;
  homeServicesCtaBadge?: string;
  homeServicesCtaTitle?: string;
  homeServicesCtaDesc?: string;
  homeServicesCtaBtn?: string;
  homeServicesAllText?: string;
  homeWhyBadge?: string;
  homeWhyHeadline?: string;
  homeWhySubtitle?: string;
  homeWhyCard1Title?: string;
  homeWhyCard1Desc?: string;
  homeWhyCard2Title?: string;
  homeWhyCard2Desc?: string;
  homeWhyCard3Title?: string;
  homeWhyCard3Desc?: string;
  homeWhyCard4Title?: string;
  homeWhyCard4Desc?: string;
  homePortfolioBadge?: string;
  homePortfolioHeadline?: string;
  homePortfolioSubtitle?: string;
  homePortfolioAllBtn?: string;
  homeBrandsBadge?: string;
  homeBrandsHeadline?: string;
  homeBrandsSubtitle?: string;
  homeReviewsBadge?: string;
  homeReviewsHeadline?: string;
  // About Page granular section copy
  aboutHeroBadge?: string;
  aboutStoryQuote?: string;
  aboutPillar1Title?: string;
  aboutPillar1Desc?: string;
  aboutPillar2Title?: string;
  aboutPillar2Desc?: string;
  aboutPillar3Title?: string;
  aboutPillar3Desc?: string;
  aboutPrinciplesBadge?: string;
  aboutPrinciplesHeadline?: string;
  aboutPartnershipBadge?: string;
  aboutPartnershipHeadline?: string;
  // Shared Footer granular copy
  footerDescription?: string;
  footerCopyright?: string;
  footerUpiNotice?: string;
  // Section Visibility Toggles
  sectionVisibility?: SectionVisibilitySettings;
  // Drafts & Versioning
  isDraft?: boolean;
  lastPublishedAt?: string;
}

export interface CMSFaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  published: boolean;
  active?: boolean;
}

export interface SectionVisibilitySettings {
  // Homepage
  homeHero?: boolean;
  homeAbout?: boolean;
  homeServicesPreview?: boolean;
  homeWhyGoodfolk?: boolean;
  homePortfolioPreview?: boolean;
  homeTrustedBy?: boolean;
  homeTestimonials?: boolean;
  homeFooterCta?: boolean;
  // Services Page
  servicesHero?: boolean;
  servicesCreativeBanner?: boolean;
  servicesCarousel?: boolean;
  servicesList?: boolean;
  servicesMethodology?: boolean;
  servicesFooterCta?: boolean;
  // Portfolio Page
  portfolioHero?: boolean;
  portfolioFilters?: boolean;
  portfolioGrid?: boolean;
  portfolioFooterCta?: boolean;
  // About Us Page
  aboutHero?: boolean;
  aboutStory?: boolean;
  aboutApproach?: boolean;
  aboutPrinciples?: boolean;
  aboutStandards?: boolean;
  aboutPartnerships?: boolean;
  aboutFooterCta?: boolean;
  // Contact Page
  contactHero?: boolean;
  contactForm?: boolean;
  contactChannels?: boolean;
  contactFaqs?: boolean;
  contactFooterCta?: boolean;
}

export type WebsitePageKey = 'home' | 'services' | 'portfolio' | 'about' | 'contact';

export interface PageFooterCtaConfig {
  enabled: boolean;
  heading: string;
  description: string;
  buttonText: string;
  buttonUrl?: string;
  backgroundColor: string;
  textColor: string;
}

export type BannerCtaDestination = 'enquiry' | 'call' | 'whatsapp' | 'url' | 'none';

export interface PageBannerConfig {
  desktopImageUrl?: string;
  mobileImageUrl?: string;
  ctaType?: BannerCtaDestination;
  ctaUrl?: string;
  mobileCtaType?: BannerCtaDestination;
  mobileCtaUrl?: string;
  enabled?: boolean;
  updatedAt?: string;
}

export interface CMSServicesBanner {
  enabled: boolean;
  imageUrl?: string;
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
  ctaDestination?: string;
  focalPoint?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  badge?: string;
  isDraft?: boolean;
  updatedAt?: string;
}


