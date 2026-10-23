import React, { useState } from 'react';
import {
  ChevronDown, ChevronUp, Save, Eye, EyeOff, Upload, Trash2, Plus,
  Sparkles, Layers, Image as ImageIcon, Phone, Mail, Instagram,
  HelpCircle, CheckCircle2, ArrowUp, ArrowDown, Edit, RefreshCw, MessageSquare
} from 'lucide-react';
import type {
  CMSSiteContent,
  CMSFaqItem,
  PageBannerConfig
} from '../../types';
import { AssetUploadField } from './AssetUploadField';

export interface ContactTabProps {
  token: string;
  siteContent: CMSSiteContent;
  onUpdateSiteContent: (updated: CMSSiteContent) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  uploadImageFile: (file: File) => Promise<string | null>;
  onSaveDraft: () => Promise<void>;
  onPublishLive: () => Promise<void>;
  saving: boolean;
}

export const ContactTab: React.FC<ContactTabProps> = ({
  token,
  siteContent,
  onUpdateSiteContent,
  showToast,
  uploadImageFile,
  onSaveDraft,
  onPublishLive,
  saving
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    hero: true,
    channels: false,
    formText: false,
    process: false,
    faqManager: true, // Clearly open and visible as requested
    footerCta: false,
    visibility: false
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const currentBanner: PageBannerConfig = siteContent.pageBanners?.contact || {
    desktopImageUrl: '',
    mobileImageUrl: '',
    ctaType: 'enquiry',
    ctaUrl: '',
    enabled: true
  };

  const handleBannerChange = (updates: Partial<PageBannerConfig>) => {
    onUpdateSiteContent({
      ...siteContent,
      pageBanners: {
        ...(siteContent.pageBanners || {}),
        contact: {
          ...currentBanner,
          ...updates
        }
      }
    });
  };

  // Actual Existing FAQs
  const defaultFaqs: CMSFaqItem[] = [
    {
      id: 'faq-1',
      question: 'What information should I include in my enquiry?',
      answer: 'Helpful details include your current brand stage, core products or services, key deliverables required (such as packaging dielines, logo, or ad creatives), preferred timeline, and any existing brand assets or reference styles you admire.',
      order: 1,
      published: true,
      active: true
    },
    {
      id: 'faq-2',
      question: 'How do you determine project pricing?',
      answer: 'Pricing is customized based on project scope, number of SKUs or creative variations, complexity, and timeline. After reviewing your brief, we provide an itemized formal quotation with transparent milestone terms.',
      order: 2,
      published: true,
      active: true
    },
    {
      id: 'faq-3',
      question: 'Do you require an advance payment?',
      answer: 'Yes, standard industry practice for creative production is an initial milestone advance (typically 50% before work commences), with the balance due upon final review and approval before master print-ready assets are transferred. All payments are verified via direct UPI.',
      order: 3,
      published: true,
      active: true
    },
    {
      id: 'faq-4',
      question: 'Can I discuss multiple services in one enquiry?',
      answer: 'Absolutely. Many of our clients combine branding, packaging, Amazon A+ content, and paid advertising creatives into a unified project. Simply outline your multi-disciplinary needs in the project details field.',
      order: 4,
      published: true,
      active: true
    },
    {
      id: 'faq-5',
      question: 'Do you work with international clients?',
      answer: 'Yes! We collaborate with brands across the globe. We coordinate via video calls, email, and WhatsApp, and handle international timezones with structured project management.',
      order: 5,
      published: true,
      active: true
    }
  ];

  const faqsList: CMSFaqItem[] = (siteContent.faqs && siteContent.faqs.length > 0)
    ? siteContent.faqs
    : defaultFaqs;

  // FAQ CRUD Handlers
  const handleAddFaq = () => {
    const newFaq: CMSFaqItem = {
      id: `faq-${Date.now()}`,
      question: 'New Question Title',
      answer: 'Clear, concise explanation for your clients regarding deliverables, timeline, or scope.',
      order: faqsList.length + 1,
      published: true,
      active: true
    };
    onUpdateSiteContent({
      ...siteContent,
      faqs: [...faqsList, newFaq]
    });
    showToast('New FAQ question added');
  };

  const handleUpdateFaq = (index: number, updates: Partial<CMSFaqItem>) => {
    const updated = [...faqsList];
    updated[index] = { ...updated[index], ...updates };
    onUpdateSiteContent({
      ...siteContent,
      faqs: updated
    });
  };

  const handleDeleteFaq = (index: number) => {
    const updated = faqsList.filter((_, i) => i !== index);
    onUpdateSiteContent({
      ...siteContent,
      faqs: updated
    });
    showToast('FAQ deleted');
  };

  const handleMoveFaq = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === faqsList.length - 1)) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    const updated = [...faqsList];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    onUpdateSiteContent({
      ...siteContent,
      faqs: updated
    });
  };

  // What Happens Next Steps (Section 4)
  const defaultNextSteps = [
    {
      id: 'step-1',
      number: '1',
      title: 'We review your enquiry',
      desc: 'Our creative leads review your brand context, products, and objectives.'
    },
    {
      id: 'step-2',
      number: '2',
      title: 'We clarify project requirements',
      desc: 'We reach out via email or phone to confirm deliverable quantities and specifics.'
    },
    {
      id: 'step-3',
      number: '3',
      title: 'We prepare a quotation and timeline',
      desc: 'Itemized breakdown covering research, design, revisions, and final dielines.'
    },
    {
      id: 'step-4',
      number: '4',
      title: 'Work begins',
      desc: 'After scope, deliverables and transparent UPI payment terms are agreed, work kicks off immediately.'
    }
  ];

  const nextSteps = (siteContent.contactNextSteps && siteContent.contactNextSteps.length > 0)
    ? siteContent.contactNextSteps
    : defaultNextSteps;

  const handleUpdateNextStep = (idx: number, updates: Partial<{ id: string; number: string; title: string; desc: string }>) => {
    const updated = [...nextSteps];
    updated[idx] = { ...updated[idx], ...updates };
    onUpdateSiteContent({ ...siteContent, contactNextSteps: updated });
  };

  const handleMoveNextStep = (idx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === nextSteps.length - 1)) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...nextSteps];
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    onUpdateSiteContent({ ...siteContent, contactNextSteps: updated });
  };

  const handleAddNextStep = () => {
    const newStep = {
      id: `step-${Date.now()}`,
      number: String(nextSteps.length + 1),
      title: 'New Collaboration Milestone',
      desc: 'Next step description for prospective clients.'
    };
    onUpdateSiteContent({ ...siteContent, contactNextSteps: [...nextSteps, newStep] });
  };

  const handleDeleteNextStep = (idx: number) => {
    const updated = nextSteps.filter((_, i) => i !== idx);
    onUpdateSiteContent({ ...siteContent, contactNextSteps: updated });
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#E4D8C8] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#173B75]" />
            <h2 className="text-xl font-black text-[#173B75]">Contact Us Page Manager</h2>
            <span className="text-xs bg-[#E8EFF8] text-[#173B75] px-2.5 py-0.5 rounded-full font-bold">Public Route: /contact</span>
          </div>
          <p className="text-xs text-[#252A34]/70 mt-1">
            Manage inquiry channels, displayed vs functional phone numbers, WhatsApp routing, project brief form labels, FAQ Manager, and custom banners.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onSaveDraft}
            disabled={saving}
            className="flex-1 sm:flex-none px-4 py-2.5 border border-[#173B75] text-[#173B75] hover:bg-[#E8EFF8] text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>
          <button
            onClick={onPublishLive}
            disabled={saving}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-[#F07822] hover:bg-[#d65805] text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Publish Live</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: HERO SECTION & CUSTOM PAGE BANNER */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('hero')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">1</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 1: Hero Section & Custom Graphic Banner</h3>
              <p className="text-[11px] text-[#252A34]/70">Contact badge, headline, subheadline and optional custom graphic hero banner</p>
            </div>
          </div>
          {openSections.hero ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.hero && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">Badge Text</label>
                <input
                  type="text"
                  value={siteContent.contactBadge || 'Project Inquiries'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, contactBadge: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#173B75] mb-1">Hero Main Headline</label>
                <input
                  type="text"
                  value={siteContent.contactHeadline || "Let's Start a Conversation."}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, contactHeadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#173B75] mb-1">Introduction Paragraph</label>
              <textarea
                rows={3}
                value={siteContent.contactSubheadline || "Tell us about your project, your goals and what you need help creating. We'll use the details to understand your requirements and plan the next step."}
                onChange={(e) => onUpdateSiteContent({ ...siteContent, contactSubheadline: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs focus:ring-2 focus:ring-[#173B75] focus:outline-none"
              />
            </div>

            {/* Custom Banner Artwork Box */}
            <div className="pt-4 border-t border-[#E4D8C8] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#173B75]">Contact Custom Graphic Banner (Optional)</h4>
                  <p className="text-[11px] text-[#252A34]/70">Replaces text hero when desktop or mobile artwork is uploaded</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentBanner.enabled !== false}
                    onChange={(e) => handleBannerChange({ enabled: e.target.checked })}
                    className="w-4 h-4 text-[#F07822] rounded"
                  />
                  <span className="text-xs font-bold text-[#173B75]">Banner Active</span>
                </label>
              </div>

              <div className="space-y-4">
                <AssetUploadField
                  label="Desktop Contact Hero Artwork"
                  sectionName="Contact Hero (Desktop)"
                  currentUrl={currentBanner.desktopImageUrl}
                  onUpload={async (file) => {
                    const url = await uploadImageFile(file);
                    if (url) handleBannerChange({ desktopImageUrl: url });
                  }}
                  onClear={() => handleBannerChange({ desktopImageUrl: '' })}
                  recommendedDimensions="1920 × 600 px (Recommended)"
                  aspectRatio="16:5 Widescreen"
                  supportedFormats="WebP, PNG, JPG"
                  maxFileSize="10 MB"
                  helpText="Hero header banner displayed to desktop and tablet visitors on /contact."
                />

                <AssetUploadField
                  label="Mobile Contact Hero Artwork"
                  sectionName="Contact Hero (Mobile)"
                  currentUrl={currentBanner.mobileImageUrl}
                  onUpload={async (file) => {
                    const url = await uploadImageFile(file);
                    if (url) handleBannerChange({ mobileImageUrl: url });
                  }}
                  onClear={() => handleBannerChange({ mobileImageUrl: '' })}
                  recommendedDimensions="750 × 800 px (Recommended)"
                  aspectRatio="15:16 Portrait"
                  supportedFormats="WebP, PNG, JPG"
                  maxFileSize="10 MB"
                  helpText="Optimized mobile banner displayed on smartphone viewports."
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: DIRECT CONTACT CHANNELS */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('channels')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">2</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 2: Direct Contact Channels Card</h3>
              <p className="text-[11px] text-[#252A34]/70">Displayed mobile, functional WhatsApp destination, email and Instagram profile</p>
            </div>
          </div>
          {openSections.channels ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.channels && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">
                  Business Inquiries Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#252A34]/40 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={siteContent.contactEmail || ''}
                    placeholder="akshay@goodfolksolution.in"
                    onChange={(e) => onUpdateSiteContent({ ...siteContent, contactEmail: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-[#E4D8C8] rounded-xl text-xs focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">
                  Displayed Phone Number (Visually shown on website)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#252A34]/40 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={siteContent.contactPhone || ''}
                    placeholder="0000000"
                    onChange={(e) => onUpdateSiteContent({ ...siteContent, contactPhone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-[#E4D8C8] rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-[#252A34]/60 mt-1">
                  Owner requirement specifies <strong>0000000</strong> as the visible label.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">
                  Functional Phone / WhatsApp Destination (Actual dialed/opened number)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#25D366] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={siteContent.functionalPhoneDestination || siteContent.contactWhatsapp || ''}
                    placeholder="+91 9817961412"
                    onChange={(e) => onUpdateSiteContent({
                      ...siteContent,
                      functionalPhoneDestination: e.target.value,
                      contactWhatsapp: e.target.value
                    })}
                    className="w-full pl-9 pr-3 py-2 border border-[#E4D8C8] rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-[#252A34]/60 mt-1">
                  When visitors click WhatsApp/call, they are routed to this real destination.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">
                  Instagram Studio Profile URL
                </label>
                <div className="relative">
                  <Instagram className="w-4 h-4 text-[#E1306C] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={siteContent.contactInstagram || ''}
                    placeholder="https://www.instagram.com/goodfolksolution/"
                    onChange={(e) => onUpdateSiteContent({ ...siteContent, contactInstagram: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-[#E4D8C8] rounded-xl text-xs focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: PROJECT BRIEF FORM LABELS */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('formText')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">3</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 3: Project Brief Form Labels</h3>
              <p className="text-[11px] text-[#252A34]/70">Form section title, helper instructions, submit button label, and privacy notice</p>
            </div>
          </div>
          {openSections.formText ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.formText && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">Form Section Title</label>
                <input
                  type="text"
                  value={siteContent.contactFormTitle || 'Project Brief Submission'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, contactFormTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">Submit Button Label</label>
                <input
                  type="text"
                  value={siteContent.contactFormButtonLabel || 'Submit Project Brief'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, contactFormButtonLabel: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#173B75] mb-1">Form Subtitle / Helper Instruction</label>
              <textarea
                rows={2}
                value={siteContent.contactFormSubtitle || 'Fill in the details below. Both mobile number and email are verified to prepare your quotation.'}
                onChange={(e) => onUpdateSiteContent({ ...siteContent, contactFormSubtitle: e.target.value })}
                className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: COLLABORATION PROCESS ("WHAT HAPPENS NEXT?") */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('process')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">4</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 4: What Happens Next? ({nextSteps.length} Steps)</h3>
              <p className="text-[11px] text-[#252A34]/70">Step-by-step collaboration process shown to prospective clients beside enquiry channels</p>
            </div>
          </div>
          {openSections.process ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.process && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#173B75] mb-1">Section Title</label>
              <input
                type="text"
                value={siteContent.contactNextHeading || 'What Happens Next?'}
                onChange={(e) => onUpdateSiteContent({ ...siteContent, contactNextHeading: e.target.value })}
                className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs font-bold"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#173B75]">Collaboration Steps ({nextSteps.length})</span>
                <button
                  type="button"
                  onClick={handleAddNextStep}
                  className="px-3 py-1 bg-[#173B75] text-white text-xs font-bold rounded-lg hover:bg-[#123163] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#F07822]" />
                  <span>Add Step</span>
                </button>
              </div>

              {nextSteps.map((step, idx) => (
                <div key={step.id || idx} className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#173B75] text-white flex items-center justify-center text-xs font-mono font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="Step Number (e.g. 1)"
                      value={step.number}
                      onChange={(e) => handleUpdateNextStep(idx, { number: e.target.value })}
                      className="w-16 px-2.5 py-1.5 border border-[#E4D8C8] rounded-lg text-xs font-mono font-bold text-[#173B75] bg-white text-center"
                    />
                    <input
                      type="text"
                      placeholder="Step Title (e.g. We review your enquiry)"
                      value={step.title}
                      onChange={(e) => handleUpdateNextStep(idx, { title: e.target.value })}
                      className="flex-1 px-3 py-1.5 border border-[#E4D8C8] rounded-lg text-xs font-bold text-[#173B75] bg-white"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveNextStep(idx, 'up')}
                        className="p-1 hover:bg-[#E8EFF8] rounded text-[#173B75] disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === nextSteps.length - 1}
                        onClick={() => handleMoveNextStep(idx, 'down')}
                        className="p-1 hover:bg-[#E8EFF8] rounded text-[#173B75] disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNextStep(idx)}
                        className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                        title="Delete Step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-0.5">Step Details</label>
                    <textarea
                      rows={2}
                      placeholder="Details of this collaboration phase..."
                      value={step.desc}
                      onChange={(e) => handleUpdateNextStep(idx, { desc: e.target.value })}
                      className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-lg text-xs bg-white leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: FAQ MANAGER (EXPLICITLY LABELLED & SEPARATED) */}
      <div className="bg-white rounded-3xl border-2 border-[#173B75]/20 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('faqManager')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#EEF2F9]/50 hover:bg-[#EEF2F9] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">5</div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-[#173B75]">FAQ Manager (Inquiry Guide)</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#173B75] text-white">
                  {faqsList.length} Questions
                </span>
              </div>
              <p className="text-[11px] text-[#252A34]/70">Add new FAQ questions & answers, edit individually, delete, reorder, and toggle visibility</p>
            </div>
          </div>
          {openSections.faqManager ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.faqManager && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-3 border-b border-[#E4D8C8]">
              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">FAQ Section Badge</label>
                <input
                  type="text"
                  value={siteContent.contactFaqBadge || 'Inquiry Guide'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, contactFaqBadge: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#173B75] mb-1">FAQ Section Title</label>
                <input
                  type="text"
                  value={siteContent.contactFaqTitle || 'Frequently Asked Questions'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, contactFaqTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-bold text-[#173B75]">All FAQs ({faqsList.length})</span>
              <button
                type="button"
                onClick={handleAddFaq}
                className="px-3.5 py-1.5 bg-[#173B75] text-white text-xs font-bold rounded-xl hover:bg-[#123163] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#F07822]" />
                <span>Add New FAQ</span>
              </button>
            </div>

            <div className="space-y-3">
              {faqsList.map((faq, idx) => (
                <div
                  key={faq.id || idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    faq.active !== false && faq.published !== false
                      ? 'bg-white border-[#E4D8C8] shadow-xs'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="w-6 h-6 rounded-full bg-[#173B75] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={faq.question}
                      placeholder="FAQ Question..."
                      onChange={(e) => handleUpdateFaq(idx, { question: e.target.value })}
                      className="flex-1 px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs font-bold text-[#173B75] bg-white"
                    />

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveFaq(idx, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1.5 hover:bg-[#E8EFF8] rounded-lg text-[#173B75] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveFaq(idx, 'down')}
                        disabled={idx === faqsList.length - 1}
                        title="Move Down"
                        className="p-1.5 hover:bg-[#E8EFF8] rounded-lg text-[#173B75] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateFaq(idx, {
                          active: faq.active === false ? true : false,
                          published: faq.active === false ? true : false
                        })}
                        title={faq.active !== false ? 'Hide Question' : 'Show Question'}
                        className="p-1.5 hover:bg-[#E8EFF8] rounded-lg text-[#173B75] cursor-pointer"
                      >
                        {faq.active !== false ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-gray-400" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(idx)}
                        title="Delete Question"
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={faq.answer}
                    placeholder="Clear answer explanation..."
                    onChange={(e) => handleUpdateFaq(idx, { answer: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs bg-white leading-relaxed"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 6: FOOTER CTA BANNER */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('footerCta')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">6</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 6: Contact Footer CTA Banner</h3>
              <p className="text-[11px] text-[#252A34]/70">Full-width bottom banner headline, description, button text, and link</p>
            </div>
          </div>
          {openSections.footerCta ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.footerCta && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">Banner Heading</label>
                <input
                  type="text"
                  value={siteContent.footerCtas?.contact?.heading || 'Ready to Bring Your Vision to Life?'}
                  onChange={(e) => {
                    const current = siteContent.footerCtas?.contact || {
                      heading: '',
                      description: '',
                      buttonText: "Let's Talk",
                      buttonUrl: '#letstalk',
                      backgroundColor: '#173B75',
                      textColor: '#FFFFFF',
                      enabled: true
                    };
                    onUpdateSiteContent({
                      ...siteContent,
                      footerCtas: {
                        ...(siteContent.footerCtas || {}),
                        contact: { ...current, heading: e.target.value }
                      }
                    });
                  }}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">Button Text</label>
                <input
                  type="text"
                  value={siteContent.footerCtas?.contact?.buttonText || "Let's Talk"}
                  onChange={(e) => {
                    const current = siteContent.footerCtas?.contact || {
                      heading: '',
                      description: '',
                      buttonText: "Let's Talk",
                      buttonUrl: '#letstalk',
                      backgroundColor: '#173B75',
                      textColor: '#FFFFFF',
                      enabled: true
                    };
                    onUpdateSiteContent({
                      ...siteContent,
                      footerCtas: {
                        ...(siteContent.footerCtas || {}),
                        contact: { ...current, buttonText: e.target.value }
                      }
                    });
                  }}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#173B75] mb-1">Banner Description</label>
              <textarea
                rows={2}
                value={siteContent.footerCtas?.contact?.description || 'Connect directly with our creative team to explore timelines, deliverables, and customized project scope.'}
                onChange={(e) => {
                  const current = siteContent.footerCtas?.contact || {
                    heading: '',
                    description: '',
                    buttonText: "Let's Talk",
                    buttonUrl: '#letstalk',
                    backgroundColor: '#173B75',
                    textColor: '#FFFFFF',
                    enabled: true
                  };
                  onUpdateSiteContent({
                    ...siteContent,
                    footerCtas: {
                      ...(siteContent.footerCtas || {}),
                      contact: { ...current, description: e.target.value }
                    }
                  });
                }}
                className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 7: SECTION VISIBILITY TOGGLES */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('visibility')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">7</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 7: Contact Page Section Visibility Toggles</h3>
              <p className="text-[11px] text-[#252A34]/70">Hide or show entire sections on the public /contact page</p>
            </div>
          </div>
          {openSections.visibility ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.visibility && (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'contactHero', label: 'Hero / Banner Section' },
                { key: 'contactForm', label: 'Project Brief Form' },
                { key: 'contactChannels', label: 'Direct Channels Card' },
                { key: 'contactProcess', label: 'Process ("What Happens Next?")' },
                { key: 'contactFaqs', label: 'Frequently Asked Questions' },
                { key: 'contactFooterCta', label: 'Footer CTA Banner' }
              ].map(({ key, label }) => {
                const isVisible = siteContent.sectionVisibility?.[key as keyof typeof siteContent.sectionVisibility] !== false;
                return (
                  <div
                    key={key}
                    onClick={() => {
                      const current = siteContent.sectionVisibility || {};
                      onUpdateSiteContent({
                        ...siteContent,
                        sectionVisibility: {
                          ...current,
                          [key]: !isVisible
                        }
                      });
                    }}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isVisible ? 'bg-[#FFF9F1] border-[#E4D8C8]' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#173B75]">{label}</div>
                      <div className="text-[10px] text-[#252A34]/60">
                        {isVisible ? 'Visible on /contact' : 'Hidden from /contact'}
                      </div>
                    </div>
                    {isVisible ? <Eye className="w-4 h-4 text-[#173B75]" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
