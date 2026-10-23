import React, { useState } from 'react';
import {
  ChevronDown, ChevronUp, Save, Eye, EyeOff, Upload, Trash2, Plus,
  Sparkles, Layers, Image as ImageIcon, Briefcase, Check, ArrowUp, ArrowDown,
  Edit, RefreshCw, CheckCircle2
} from 'lucide-react';
import type {
  CMSSiteContent,
  CMSServiceItem,
  PageBannerConfig,
  CMSServicesBanner
} from '../../types';
import { AssetUploadField } from './AssetUploadField';
import { SERVICES_DATA } from '../../data/services';

export interface ServicesTabProps {
  token: string;
  siteContent: CMSSiteContent;
  onUpdateSiteContent: (updated: CMSSiteContent) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  uploadImageFile: (file: File) => Promise<string | null>;
  onSaveDraft: () => Promise<void>;
  onPublishLive: () => Promise<void>;
  saving: boolean;
}

export const ServicesTab: React.FC<ServicesTabProps> = ({
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
    creativeBanner: false,
    servicesList: true,
    methodology: false,
    footerCta: false,
    visibility: false
  });

  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const currentBanner: PageBannerConfig = siteContent.pageBanners?.services || {
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
        services: {
          ...currentBanner,
          ...updates
        }
      }
    });
  };

  const creativeBanner: CMSServicesBanner = siteContent.servicesBanner || {
    enabled: true,
    heading: 'Where Bold Strategy Meets Relentless Creative Craft.',
    subheading: 'Branding, packaging dielines, and performance ad creative engineered for commercial resonance.',
    ctaLabel: 'Discuss Your Brief',
    ctaDestination: 'lets-talk',
    badge: 'Creative Direction & Campaign Art',
    imageUrl: '',
    focalPoint: 'center'
  };

  const handleCreativeBannerChange = (updates: Partial<CMSServicesBanner>) => {
    onUpdateSiteContent({
      ...siteContent,
      servicesBanner: {
        ...creativeBanner,
        ...updates
      }
    });
  };

  // 10 Services List
  const initialServices: CMSServiceItem[] = (siteContent.services && siteContent.services.length >= 10)
    ? siteContent.services
    : SERVICES_DATA.map((s, idx) => ({
        id: s.id,
        slug: (s as any).slug || s.id,
        number: String(idx + 1).padStart(2, '0'),
        title: s.title,
        shortDesc: s.shortDesc,
        fullDesc: s.fullDesc,
        image: s.image,
        deliverables: s.deliverables,
        keyHighlights: s.keyHighlights,
        order: idx + 1,
        published: true
      }));

  const services: CMSServiceItem[] = siteContent.services && siteContent.services.length > 0
    ? siteContent.services
    : initialServices;

  const handleUpdateService = (index: number, updates: Partial<CMSServiceItem>) => {
    const updated = [...services];
    updated[index] = { ...updated[index], ...updates };
    onUpdateSiteContent({
      ...siteContent,
      services: updated
    });
  };

  const handleServiceImageUpload = async (index: number, file: File) => {
    showToast(`Uploading primary artwork for service ${index + 1}...`);
    const url = await uploadImageFile(file);
    if (url) {
      handleUpdateService(index, { image: url });
      showToast(`Service visual updated!`, 'success');
    }
  };

  const handleAddDeliverable = (serviceIndex: number) => {
    const targetService = services[serviceIndex];
    const updatedDeliverables = [...targetService.deliverables, 'New Deliverable Spec'];
    handleUpdateService(serviceIndex, { deliverables: updatedDeliverables });
  };

  const handleUpdateDeliverable = (serviceIndex: number, dIdx: number, val: string) => {
    const targetService = services[serviceIndex];
    const updatedDeliverables = [...targetService.deliverables];
    updatedDeliverables[dIdx] = val;
    handleUpdateService(serviceIndex, { deliverables: updatedDeliverables });
  };

  const handleDeleteDeliverable = (serviceIndex: number, dIdx: number) => {
    const targetService = services[serviceIndex];
    const updatedDeliverables = targetService.deliverables.filter((_, i) => i !== dIdx);
    handleUpdateService(serviceIndex, { deliverables: updatedDeliverables });
  };

  // Methodology Steps (Section 4)
  const defaultMethodologySteps = [
    {
      id: 'step-1',
      number: '01 · BRIEF',
      title: 'Discover & Align',
      subtitle: 'Deep-dive brief analysis & strategic alignment',
      desc: 'We deep dive into your business model, competitive landscape, product formulations, and specific goals.'
    },
    {
      id: 'step-2',
      number: '02 · CREATE',
      title: 'Concept & Explore',
      subtitle: 'Multiple distinct visual directions & high-craft drafts',
      desc: 'Crafting distinct concept directions, packaging dielines, typography, and high-retention video cuts.'
    },
    {
      id: 'step-3',
      number: '03 · REVIEW',
      title: 'Refine & Perfect',
      subtitle: 'Collaborative feedback cycles & precision tuning',
      desc: 'Structured feedback cycles to calibrate aesthetic nuances and verify manufacturing compliance.'
    },
    {
      id: 'step-4',
      number: '04 · DELIVER',
      title: 'Finalize & Deliver',
      subtitle: 'Production-ready asset packages & verified handover',
      desc: 'Production-ready files released upon milestone payment to 9817961412@ibl and verified receipt issued.'
    }
  ];

  const methodologySteps = (siteContent.servicesMethodologySteps && siteContent.servicesMethodologySteps.length > 0)
    ? siteContent.servicesMethodologySteps
    : defaultMethodologySteps;

  const handleUpdateMethodologyStep = (idx: number, updates: Partial<{ id: string; number: string; title: string; subtitle?: string; desc: string }>) => {
    const updated = [...methodologySteps];
    updated[idx] = { ...updated[idx], ...updates };
    onUpdateSiteContent({ ...siteContent, servicesMethodologySteps: updated });
  };

  const handleMoveMethodologyStep = (idx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === methodologySteps.length - 1)) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...methodologySteps];
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    onUpdateSiteContent({ ...siteContent, servicesMethodologySteps: updated });
  };

  const handleAddMethodologyStep = () => {
    const newStep = {
      id: `step-${Date.now()}`,
      number: `0${methodologySteps.length + 1} · PHASE`,
      title: 'New Methodology Phase',
      subtitle: 'Collaborative Milestone',
      desc: 'Description of scope, milestones, and deliverables.'
    };
    onUpdateSiteContent({ ...siteContent, servicesMethodologySteps: [...methodologySteps, newStep] });
  };

  const handleDeleteMethodologyStep = (idx: number) => {
    const updated = methodologySteps.filter((_, i) => i !== idx);
    onUpdateSiteContent({ ...siteContent, servicesMethodologySteps: updated });
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#E4D8C8] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#173B75]" />
            <h2 className="text-xl font-black text-[#173B75]">Services Page Manager</h2>
            <span className="text-xs bg-[#E8EFF8] text-[#173B75] px-2.5 py-0.5 rounded-full font-bold">Public Route: /services</span>
          </div>
          <p className="text-xs text-[#252A34]/70 mt-1">
            Manage all 10 creative capabilities, advertising creative banner, methodology workflow, and service visuals with exact dimension specs beside each upload.
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
              <p className="text-[11px] text-[#252A34]/70">Services badge, headline, subheadline and optional custom graphic hero banner</p>
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
                  value={siteContent.servicesBadge || 'Comprehensive Creative Capabilities'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, servicesBadge: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#173B75] mb-1">Main Headline</label>
                <input
                  type="text"
                  value={siteContent.servicesHeroHeadline || 'Creative Solutions for Ambitious Brands.'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, servicesHeroHeadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#173B75] mb-1">Introduction Paragraph</label>
              <textarea
                rows={3}
                value={siteContent.servicesHeroSubheadline || 'From brand identity to digital campaigns, we create thoughtful creative solutions that help businesses stand out and grow.'}
                onChange={(e) => onUpdateSiteContent({ ...siteContent, servicesHeroSubheadline: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs focus:ring-2 focus:ring-[#173B75] focus:outline-none"
              />
            </div>

            {/* Custom Banner Artwork Box */}
            <div className="pt-4 border-t border-[#E4D8C8] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#173B75]">Services Custom Graphic Banner (Optional)</h4>
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
                  label="Desktop Services Hero Artwork"
                  sectionName="Services Hero (Desktop)"
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
                  helpText="Hero header banner displayed to desktop and tablet visitors on /services."
                />

                <AssetUploadField
                  label="Mobile Services Hero Artwork"
                  sectionName="Services Hero (Mobile)"
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

      {/* SECTION 2: ADVERTISING AGENCY CREATIVE BANNER */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('creativeBanner')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">2</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 2: Agency Creative Banner</h3>
              <p className="text-[11px] text-[#252A34]/70">Mid-page promotional banner headline, subheading, CTA button and high-res artwork</p>
            </div>
          </div>
          {openSections.creativeBanner ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.creativeBanner && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4D8C8]">
              <span className="text-xs font-bold text-[#173B75]">Creative Banner Display Status</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={creativeBanner.enabled !== false}
                  onChange={(e) => handleCreativeBannerChange({ enabled: e.target.checked })}
                  className="w-4 h-4 text-[#F07822] rounded"
                />
                <span className="text-xs font-bold text-[#173B75]">Display Banner</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">Badge</label>
                <input
                  type="text"
                  value={creativeBanner.badge || 'Creative Direction & Campaign Art'}
                  onChange={(e) => handleCreativeBannerChange({ badge: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">Button Label</label>
                <input
                  type="text"
                  value={creativeBanner.ctaLabel || 'Discuss Your Brief'}
                  onChange={(e) => handleCreativeBannerChange({ ctaLabel: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#173B75] mb-1">Heading</label>
              <input
                type="text"
                value={creativeBanner.heading || 'Where Bold Strategy Meets Relentless Creative Craft.'}
                onChange={(e) => handleCreativeBannerChange({ heading: e.target.value })}
                className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#173B75] mb-1">Subheading</label>
              <textarea
                rows={2}
                value={creativeBanner.subheading || 'Branding, packaging dielines, and performance ad creative engineered for commercial resonance.'}
                onChange={(e) => handleCreativeBannerChange({ subheading: e.target.value })}
                className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
              />
            </div>

            <AssetUploadField
              label="Agency Creative Banner Artwork"
              sectionName="Services Creative Banner"
              currentUrl={creativeBanner.imageUrl}
              focalPoint={creativeBanner.focalPoint}
              onFocalPointChange={(fp) => handleCreativeBannerChange({ focalPoint: fp })}
              onUpload={async (file) => {
                const url = await uploadImageFile(file);
                if (url) handleCreativeBannerChange({ imageUrl: url });
              }}
              onClear={() => handleCreativeBannerChange({ imageUrl: '' })}
              recommendedDimensions="1920 × 800 px (Recommended)"
              aspectRatio="12:5 Widescreen Banner"
              supportedFormats="PNG, JPG, WebP"
              maxFileSize="10 MB"
              helpText="Embedded in the high-contrast navy/orange advertising craft banner."
            />
          </div>
        )}
      </div>

      {/* SECTION 3: ALL 10 SERVICES */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('servicesList')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">3</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 3: All 10 Creative Services ({services.length} Total)</h3>
              <p className="text-[11px] text-[#252A34]/70">Edit headlines, descriptions, deliverables, and primary visual assets for each discipline</p>
            </div>
          </div>
          {openSections.servicesList ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.servicesList && (
          <div className="p-6 space-y-6">
            {/* Section Header Controls: Creative Capabilities */}
            <div className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-3">
              <span className="text-xs font-bold text-[#173B75] block">Creative Capabilities Section Header</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Eyebrow</label>
                  <input
                    type="text"
                    value={siteContent.servicesCapabilitiesEyebrow ?? 'CREATIVE CAPABILITIES'}
                    onChange={(e) => onUpdateSiteContent({ ...siteContent, servicesCapabilitiesEyebrow: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Heading</label>
                  <input
                    type="text"
                    value={siteContent.servicesCapabilitiesHeading ?? 'All 10 Specialized Creative Services'}
                    onChange={(e) => onUpdateSiteContent({ ...siteContent, servicesCapabilitiesHeading: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={siteContent.servicesCapabilitiesSubtitle ?? 'Explore our complete suite of 10 specialized creative capabilities.'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, servicesCapabilitiesSubtitle: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              {services.map((service, idx) => {
                const isExpanded = editingServiceIndex === idx;
                return (
                  <div
                    key={service.id || idx}
                    className="p-5 rounded-2xl bg-[#F7F7F5] border border-[#E4D8C8] space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-[#173B75] text-white flex items-center justify-center text-xs font-mono font-bold">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-[#173B75]">{service.title}</h4>
                          <span className="text-[10px] text-[#252A34]/60 font-mono">ID: #{service.id} · Deliverables: {service.deliverables.length}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateService(idx, { published: service.published !== false ? false : true })}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                            service.published !== false ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {service.published !== false ? 'Published' : 'Hidden'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingServiceIndex(isExpanded ? null : idx)}
                          className="px-3 py-1 bg-[#173B75] text-white text-xs font-semibold rounded-lg hover:bg-[#123163] cursor-pointer flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'Done' : 'Edit Service'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Detailed Editor (shown when expanded) */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-[#E4D8C8] space-y-4 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-[#173B75] mb-1">Service Display Title</label>
                            <input
                              type="text"
                              value={service.title}
                              onChange={(e) => handleUpdateService(idx, { title: e.target.value })}
                              className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs bg-white font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#173B75] mb-1">Short Preview Description (Homepage)</label>
                            <input
                              type="text"
                              value={service.shortDesc}
                              onChange={(e) => handleUpdateService(idx, { shortDesc: e.target.value })}
                              className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#173B75] mb-1">In-Depth Discipline Description (Services Page)</label>
                          <textarea
                            rows={3}
                            value={service.fullDesc}
                            onChange={(e) => handleUpdateService(idx, { fullDesc: e.target.value })}
                            className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs bg-white leading-relaxed"
                          />
                        </div>

                        {/* Deliverables List Management */}
                        <div className="p-4 bg-white rounded-xl border border-[#E4D8C8] space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#173B75]">Scope & Deliverables List</span>
                            <button
                              type="button"
                              onClick={() => handleAddDeliverable(idx)}
                              className="px-2.5 py-1 bg-[#EEF2F9] text-[#173B75] hover:bg-[#173B75] hover:text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Deliverable</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {service.deliverables.map((del, dIdx) => (
                              <div key={dIdx} className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-[#F07822] shrink-0" />
                                <input
                                  type="text"
                                  value={del}
                                  onChange={(e) => handleUpdateDeliverable(idx, dIdx, e.target.value)}
                                  className="flex-1 px-3 py-1.5 border border-[#E4D8C8] rounded-lg text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDeliverable(idx, dIdx)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Service Visual Asset Upload with Side-by-Side Dimension Specs */}
                        <AssetUploadField
                          label={`${service.title} Feature Artwork`}
                          sectionName={`Services Page Section #${idx + 1}`}
                          currentUrl={service.image}
                          onUpload={(file) => handleServiceImageUpload(idx, file)}
                          onClear={() => handleUpdateService(idx, { image: '' })}
                          recommendedDimensions="1000 × 750 px (Recommended)"
                          aspectRatio="4:3 Landscape"
                          supportedFormats="JPG, PNG, WebP"
                          maxFileSize="5 MB"
                          helpText="Primary visual feature artwork displayed alongside the deliverables list."
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: FROM BRIEF TO DELIVERY METHODOLOGY */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('methodology')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">4</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 4: Four-Step Collaboration Methodology</h3>
              <p className="text-[11px] text-[#252A34]/70">01. Brief & Plan, 02. Explore & Create, 03. Review & Refine, 04. Delivery & Receipt</p>
            </div>
          </div>
          {openSections.methodology ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.methodology && (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">Section Heading</label>
                <input
                  type="text"
                  value={siteContent.methodologyHeading || 'From Brief to Delivery'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, methodologyHeading: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">Section Subtitle</label>
                <input
                  type="text"
                  value={siteContent.methodologySubtitle || 'Every project follows our verified four-step collaboration cycle.'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, methodologySubtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
                />
              </div>
            </div>

            {/* 4-Step Methodology Cards Editor */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#173B75]">Methodology Steps ({methodologySteps.length})</span>
                <button
                  type="button"
                  onClick={handleAddMethodologyStep}
                  className="px-3 py-1 bg-[#173B75] text-white text-xs font-bold rounded-lg hover:bg-[#123163] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#F07822]" />
                  <span>Add Step</span>
                </button>
              </div>

              {methodologySteps.map((step, idx) => (
                <div key={step.id || idx} className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#173B75] text-white flex items-center justify-center text-xs font-mono font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="Step Badge (e.g. 01 · BRIEF)"
                      value={step.number}
                      onChange={(e) => handleUpdateMethodologyStep(idx, { number: e.target.value })}
                      className="w-32 px-2.5 py-1.5 border border-[#E4D8C8] rounded-lg text-xs font-mono font-bold text-[#F07822] bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Step Title (e.g. Discover & Align)"
                      value={step.title}
                      onChange={(e) => handleUpdateMethodologyStep(idx, { title: e.target.value })}
                      className="flex-1 px-3 py-1.5 border border-[#E4D8C8] rounded-lg text-xs font-bold text-[#173B75] bg-white"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveMethodologyStep(idx, 'up')}
                        className="p-1 hover:bg-[#E8EFF8] rounded text-[#173B75] disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === methodologySteps.length - 1}
                        onClick={() => handleMoveMethodologyStep(idx, 'down')}
                        className="p-1 hover:bg-[#E8EFF8] rounded text-[#173B75] disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMethodologyStep(idx)}
                        className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                        title="Delete Step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-0.5">Subtitle / Tagline</label>
                    <input
                      type="text"
                      placeholder="Subtitle or tagline..."
                      value={step.subtitle || ''}
                      onChange={(e) => handleUpdateMethodologyStep(idx, { subtitle: e.target.value })}
                      className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-0.5">Detailed Description</label>
                    <textarea
                      rows={2}
                      placeholder="Step description..."
                      value={step.desc}
                      onChange={(e) => handleUpdateMethodologyStep(idx, { desc: e.target.value })}
                      className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-lg text-xs bg-white leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-3">
              <span className="text-xs font-bold text-[#173B75] block">Delivery & Payment Assurance Note</span>
              <div>
                <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Assurance Title</label>
                <input
                  type="text"
                  value={siteContent.methodologyAssuranceTitle || 'Production-Ready Asset Handover'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, methodologyAssuranceTitle: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Assurance Description</label>
                <textarea
                  rows={2}
                  value={siteContent.methodologyAssuranceDesc || 'Production-ready files released upon milestone payment to 9817961412@ibl and verified receipt issued.'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, methodologyAssuranceDesc: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: FOOTER CTA BANNER */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('footerCta')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">5</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 5: Services Footer CTA Banner</h3>
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
                  value={siteContent.footerCtas?.services?.heading || 'Ready to Discuss Your Project Requirements?'}
                  onChange={(e) => {
                    const current = siteContent.footerCtas?.services || {
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
                        services: { ...current, heading: e.target.value }
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
                  value={siteContent.footerCtas?.services?.buttonText || "Let's Talk"}
                  onChange={(e) => {
                    const current = siteContent.footerCtas?.services || {
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
                        services: { ...current, buttonText: e.target.value }
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
                value={siteContent.footerCtas?.services?.description || 'Connect directly with our team to explore timelines, deliverables, and customized scope.'}
                onChange={(e) => {
                  const current = siteContent.footerCtas?.services || {
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
                      services: { ...current, description: e.target.value }
                    }
                  });
                }}
                className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 6: SECTION VISIBILITY TOGGLES */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('visibility')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">6</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 6: Services Page Section Visibility Toggles</h3>
              <p className="text-[11px] text-[#252A34]/70">Hide or show entire sections on the public /services page</p>
            </div>
          </div>
          {openSections.visibility ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.visibility && (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'servicesHero', label: 'Hero / Banner Section' },
                { key: 'servicesCreativeBanner', label: 'Agency Creative Banner' },
                { key: 'servicesCarousel', label: 'Swipeable Carousel (10 Services)' },
                { key: 'servicesList', label: 'Detailed Service Breakdowns' },
                { key: 'servicesMethodology', label: 'Methodology 4-Step Cycle' },
                { key: 'servicesFooterCta', label: 'Footer CTA Banner' }
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
                        {isVisible ? 'Visible on /services' : 'Hidden from /services'}
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
