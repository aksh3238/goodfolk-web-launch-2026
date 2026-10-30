import React, { useState } from 'react';
import {
  ChevronDown, ChevronUp, Save, Eye, EyeOff, Upload, Trash2, Plus,
  Sparkles, Layers, Image as ImageIcon, Star, Compass, ArrowUp, ArrowDown,
  Video as VideoIcon, CheckCircle2, RefreshCw
} from 'lucide-react';
import type {
  CMSSiteContent,
  CMSTrustedBrand,
  CMSTestimonial,
  CMSHeroSlide,
  PageBannerConfig,
  CMSServiceItem
} from '../../types';
import { AssetUploadField } from './AssetUploadField';
import { DEFAULT_HERO_SLIDES } from '../HeroShowcaseCarousel';
import { SERVICES_DATA } from '../../data/services';

export interface HomepageTabProps {
  token: string;
  siteContent: CMSSiteContent;
  onUpdateSiteContent: (updated: CMSSiteContent) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  uploadImageFile: (file: File) => Promise<string | null>;
  trustedBrands: CMSTrustedBrand[];
  setTrustedBrands: React.Dispatch<React.SetStateAction<CMSTrustedBrand[]>>;
  testimonials: CMSTestimonial[];
  setTestimonials: React.Dispatch<React.SetStateAction<CMSTestimonial[]>>;
  onSaveDraft: () => Promise<void>;
  onPublishLive: () => Promise<void>;
  saving: boolean;
}

export const HomepageTab: React.FC<HomepageTabProps> = ({
  token,
  siteContent,
  onUpdateSiteContent,
  showToast,
  uploadImageFile,
  trustedBrands,
  setTrustedBrands,
  testimonials,
  setTestimonials,
  onSaveDraft,
  onPublishLive,
  saving
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    hero: true,
    showcase: false,
    servicesPreview: false,
    whyGoodfolk: false,
    trustedBy: false,
    testimonials: false,
    footerCta: false,
    visibility: false
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const currentBanner: PageBannerConfig = siteContent.pageBanners?.home || {
    desktopImageUrl: '',
    mobileImageUrl: '',
    ctaType: 'enquiry',
    ctaUrl: '',
    enabled: true
  };

  const handleBannerChange = (updates: Partial<PageBannerConfig>) => {
    const updated = {
      ...currentBanner,
      ...updates
    };
    onUpdateSiteContent({
      ...siteContent,
      pageBanners: {
        ...(siteContent.pageBanners || {}),
        home: updated
      }
    });
  };

  // Slides State
  const slides: CMSHeroSlide[] = (siteContent.heroSlides && siteContent.heroSlides.length > 0)
    ? siteContent.heroSlides
    : DEFAULT_HERO_SLIDES;

  // Services State for Homepage Service Tiles Image Management
  const allServices: CMSServiceItem[] = (siteContent.services && siteContent.services.length > 0)
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

  const [expandedHomepageServices, setExpandedHomepageServices] = useState<Record<string, boolean>>({
    [allServices[0]?.id || 'branding']: true
  });

  const toggleHomepageServiceExpand = (serviceId: string) => {
    setExpandedHomepageServices(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }));
  };

  const handleUpdateServiceHomepageImage = (serviceIndex: number, updates: Partial<CMSServiceItem>) => {
    const updated = [...allServices];
    updated[serviceIndex] = { ...updated[serviceIndex], ...updates };
    onUpdateSiteContent({
      ...siteContent,
      services: updated
    });
  };

  const handleUpdateSlide = (index: number, updates: Partial<CMSHeroSlide>) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], ...updates };
    onUpdateSiteContent({
      ...siteContent,
      heroSlides: updated
    });
  };

  const handleSlideImageUpload = async (index: number, file: File) => {
    showToast(`Uploading slide ${index + 1} artwork...`);
    const url = await uploadImageFile(file);
    if (url) {
      handleUpdateSlide(index, { imageUrl: url });
      showToast(`Slide ${index + 1} image updated!`, 'success');
    }
  };

  // Brands CRUD
  const handleAddBrand = () => {
    const newBrand: CMSTrustedBrand = {
      id: `tb-${Date.now()}`,
      name: 'New Client Brand',
      logoUrl: '',
      order: trustedBrands.length + 1,
      active: true
    };
    const updated = [...trustedBrands, newBrand];
    setTrustedBrands(updated);
    fetch('/api/admin/content/brands', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ brands: updated })
    }).catch(console.error);
    showToast('New client brand added to marquee');
  };

  const handleUpdateBrand = (index: number, updates: Partial<CMSTrustedBrand>) => {
    const updated = [...trustedBrands];
    updated[index] = { ...updated[index], ...updates };
    setTrustedBrands(updated);
    fetch('/api/admin/content/brands', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ brands: updated })
    }).catch(console.error);
  };

  const handleDeleteBrand = (index: number) => {
    const updated = trustedBrands.filter((_, i) => i !== index);
    setTrustedBrands(updated);
    fetch('/api/admin/content/brands', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ brands: updated })
    }).catch(console.error);
    showToast('Brand removed from marquee');
  };

  const handleBrandLogoUpload = async (index: number, file: File) => {
    showToast(`Uploading logo for ${trustedBrands[index]?.name || 'brand'}...`);
    const url = await uploadImageFile(file);
    if (url) {
      handleUpdateBrand(index, { logoUrl: url });
      showToast('Brand logo updated!', 'success');
    }
  };

  // Testimonials CRUD
  const handleAddTestimonial = () => {
    const newTestimonial: CMSTestimonial = {
      id: `test-${Date.now()}`,
      clientName: 'Client Full Name',
      company: 'Brand / Enterprise',
      designation: 'Founder / Marketing Lead',
      photoUrl: '',
      rating: 5,
      text: 'Goodfolk Solution transformed our brand presence with stunning packaging dielines and conversion-focused creative direction.',
      category: 'Branding & Packaging',
      published: true,
      order: testimonials.length + 1,
      isPlaceholder: false
    };
    const updated = [...testimonials, newTestimonial];
    setTestimonials(updated);
    fetch('/api/admin/content/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newTestimonial)
    }).catch(console.error);
    showToast('New client review created');
  };

  const handleUpdateTestimonial = (index: number, updates: Partial<CMSTestimonial>) => {
    const updated = [...testimonials];
    updated[index] = { ...updated[index], ...updates };
    setTestimonials(updated);
    const item = updated[index];
    fetch(`/api/admin/content/testimonials/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(item)
    }).catch(console.error);
  };

  const handleDeleteTestimonial = (index: number) => {
    const item = testimonials[index];
    const updated = testimonials.filter((_, i) => i !== index);
    setTestimonials(updated);
    if (item?.id) {
      fetch(`/api/admin/content/testimonials/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(console.error);
    }
    showToast('Testimonial removed');
  };

  const handleTestimonialPhotoUpload = async (index: number, file: File) => {
    showToast('Uploading client avatar photo...');
    const url = await uploadImageFile(file);
    if (url) {
      handleUpdateTestimonial(index, { photoUrl: url });
      showToast('Client photo updated!', 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#E4D8C8] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#173B75]" />
            <h2 className="text-xl font-black text-[#173B75]">Homepage Manager</h2>
            <span className="text-xs bg-[#E8EFF8] text-[#173B75] px-2.5 py-0.5 rounded-full font-bold">Public Route: /</span>
          </div>
          <p className="text-xs text-[#252A34]/70 mt-1">
            Manage all 8 homepage sections in exact public-page order. Every element includes real-time previews and asset dimensions directly beside each upload field.
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
              <p className="text-[11px] text-[#252A34]/70">Hero badge, headline, subheadline, CTAs and optional full-width custom graphic banner</p>
            </div>
          </div>
          {openSections.hero ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.hero && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">Hero Badge Text</label>
                <input
                  type="text"
                  value={siteContent.heroBadge || ''}
                  placeholder="Creative Advertising · Branding · Digital Marketing"
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, heroBadge: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#173B75] mb-1">Hero Main Headline</label>
                <input
                  type="text"
                  value={siteContent.heroHeadline || ''}
                  placeholder="Good Ideas Deserve Good Folks."
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, heroHeadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#173B75] mb-1">Hero Subheadline Paragraph</label>
              <textarea
                rows={3}
                value={siteContent.heroSubheadline || ''}
                placeholder="We combine strategy, creative design, branding, and digital marketing to help businesses stand out, connect with the right audience, and grow."
                onChange={(e) => onUpdateSiteContent({ ...siteContent, heroSubheadline: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs focus:ring-2 focus:ring-[#173B75] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-3">
                <span className="text-xs font-bold text-[#173B75] block">Primary Button (Orange Pill)</span>
                <div>
                  <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={siteContent.heroPrimaryCtaText || "Let's Talk"}
                    onChange={(e) => onUpdateSiteContent({ ...siteContent, heroPrimaryCtaText: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Destination URL / Action</label>
                  <input
                    type="text"
                    value={siteContent.heroPrimaryCtaLink || '/contact'}
                    placeholder="/contact or #letstalk"
                    onChange={(e) => onUpdateSiteContent({ ...siteContent, heroPrimaryCtaLink: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              <div className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-3">
                <span className="text-xs font-bold text-[#173B75] block">Secondary Button (White Outline Pill)</span>
                <div>
                  <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={siteContent.heroSecondaryCtaText || 'Explore Our Work'}
                    onChange={(e) => onUpdateSiteContent({ ...siteContent, heroSecondaryCtaText: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Destination URL</label>
                  <input
                    type="text"
                    value={siteContent.heroSecondaryCtaLink || '/portfolio'}
                    placeholder="/portfolio or /services"
                    onChange={(e) => onUpdateSiteContent({ ...siteContent, heroSecondaryCtaLink: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Custom Graphic Banner with Mandatory Side-by-Side Dimension Specs */}
            <div className="pt-4 border-t border-[#E4D8C8] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#173B75]">Custom Hero Graphic Artwork (Optional)</h4>
                  <p className="text-[11px] text-[#252A34]/70">When uploaded, this custom graphic banner replaces the default text hero on the public homepage.</p>
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
                  label="Desktop Hero Banner Artwork"
                  sectionName="Homepage Hero (Desktop)"
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
                  helpText="Displayed on laptops and widescreen desktop monitors across the top of the homepage."
                />

                <AssetUploadField
                  label="Mobile Hero Banner Artwork"
                  sectionName="Homepage Hero (Mobile)"
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
                  helpText="Automatically served to mobile smartphones for razor-sharp visual balance without horizontal cropping."
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: HERO SHOWCASE SLIDES & BRAND FILM */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('showcase')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">2</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 2: Hero Showcase Slides & Brand Film Video</h3>
              <p className="text-[11px] text-[#252A34]/70">Manage the 5 rotating service slides and the 15-second cinematic brand film</p>
            </div>
          </div>
          {openSections.showcase ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.showcase && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#173B75]">5 Hero Showcase Cards (Cycling Carousel)</h4>
              <span className="text-[11px] text-[#252A34]/60">Shown in the hero visual slot with smooth hover acceleration</span>
            </div>

            <div className="space-y-4">
              {slides.map((slide, idx) => (
                <div key={slide.id || idx} className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E4D8C8] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#173B75]">Slide {idx + 1}: {slide.category}</span>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E4D8C8]">
                      Link: {slide.targetPath}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Slide Title</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => handleUpdateSlide(idx, { title: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Service Category Tag</label>
                      <input
                        type="text"
                        value={slide.category}
                        onChange={(e) => handleUpdateSlide(idx, { category: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                      />
                    </div>
                  </div>

                  <AssetUploadField
                    label={`Slide ${idx + 1} Visual Asset`}
                    sectionName="Hero Showcase Carousel"
                    currentUrl={slide.imageUrl}
                    onUpload={(file) => handleSlideImageUpload(idx, file)}
                    onClear={() => handleUpdateSlide(idx, { imageUrl: '' })}
                    recommendedDimensions="1200 × 1000 px (Recommended)"
                    aspectRatio="6:5 Portrait to Square"
                    supportedFormats="JPG, PNG, WebP"
                    maxFileSize="10 MB"
                    helpText="Appears as the primary visual card inside the homepage hero with smooth crossfade animations."
                  />
                </div>
              ))}
            </div>

            {/* Brand Film Video Section */}
            <div className="pt-6 border-t border-[#E4D8C8] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#173B75]">15-Second Cinematic Brand Film (Embedded Video)</h4>
                  <p className="text-[11px] text-[#252A34]/70">Upload a custom high-definition brand reel with audio control and video poster</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={siteContent.heroVideoEnabled !== false}
                    onChange={(e) => onUpdateSiteContent({ ...siteContent, heroVideoEnabled: e.target.checked })}
                    className="w-4 h-4 text-[#F07822] rounded"
                  />
                  <span className="text-xs font-bold text-[#173B75]">Video Active</span>
                </label>
              </div>

              <div className="space-y-4">
                <AssetUploadField
                  label="Brand Film Video File (MP4/WebM)"
                  sectionName="Hero Brand Film"
                  mediaType="video"
                  currentUrl={siteContent.heroVideoUrl}
                  onUpload={async (file) => {
                    const url = await uploadImageFile(file);
                    if (url) onUpdateSiteContent({ ...siteContent, heroVideoUrl: url });
                  }}
                  onClear={() => onUpdateSiteContent({ ...siteContent, heroVideoUrl: '' })}
                  recommendedDimensions="1920 × 1080 px Full HD (Recommended)"
                  aspectRatio="16:9 Widescreen"
                  supportedFormats="MP4, WebM (H.264 / AAC)"
                  maxFileSize="100 MB"
                  helpText="Loops smoothly with ambient audio controls and client pause/play interaction."
                />

                <AssetUploadField
                  label="Brand Film Video Poster Frame"
                  sectionName="Hero Brand Film Poster"
                  currentUrl={siteContent.heroVideoPoster}
                  onUpload={async (file) => {
                    const url = await uploadImageFile(file);
                    if (url) onUpdateSiteContent({ ...siteContent, heroVideoPoster: url });
                  }}
                  onClear={() => onUpdateSiteContent({ ...siteContent, heroVideoPoster: '' })}
                  recommendedDimensions="1920 × 1080 px (Recommended)"
                  aspectRatio="16:9 Widescreen"
                  supportedFormats="JPG, WebP, PNG"
                  maxFileSize="10 MB"
                  helpText="Displayed immediately while the video buffer loads or when low-power mode is enabled."
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: OUR SERVICES PREVIEW */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('servicesPreview')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">3</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 3: Our Services Preview</h3>
              <p className="text-[11px] text-[#252A34]/70">Section badge, headings, 5 preview cards, and the tailored engagement card</p>
            </div>
          </div>
          {openSections.servicesPreview ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.servicesPreview && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">Section Badge</label>
                <input
                  type="text"
                  value={siteContent.homeServicesBadge || 'What We Do'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, homeServicesBadge: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#173B75] mb-1">Section Title</label>
                <input
                  type="text"
                  value={siteContent.homeServicesHeadline || 'Our Services'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, homeServicesHeadline: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#173B75] mb-1">Section Subtitle</label>
              <input
                type="text"
                value={siteContent.homeServicesSubheadline || 'Creative solutions designed to build brands, capture attention, and support business growth.'}
                onChange={(e) => onUpdateSiteContent({ ...siteContent, homeServicesSubheadline: e.target.value })}
                className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
              />
            </div>

            <div className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-3">
              <span className="text-xs font-bold text-[#173B75] block">Tailored Engagement (Navy Consultation Card)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Card Heading</label>
                  <input
                    type="text"
                    value={siteContent.homeServicesCtaTitle || 'Need a custom creative combination?'}
                    onChange={(e) => onUpdateSiteContent({ ...siteContent, homeServicesCtaTitle: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Button Label</label>
                  <input
                    type="text"
                    value={siteContent.homeServicesCtaBtn || 'Discuss Scope'}
                    onChange={(e) => onUpdateSiteContent({ ...siteContent, homeServicesCtaBtn: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Card Description</label>
                <textarea
                  rows={2}
                  value={siteContent.homeServicesCtaDesc || 'We bundle visual identity, packaging dielines, and performance ad creative into seamless single-partner retainer or milestone workflows.'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, homeServicesCtaDesc: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                />
              </div>
            </div>

            {/* HOMEPAGE SERVICE TILES INDEPENDENT IMAGE MANAGEMENT */}
            <div className="pt-4 border-t border-[#E4D8C8] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#F07822]" />
                    <h4 className="text-xs font-bold text-[#173B75]">
                      Homepage Service Tile Images ({allServices.length} Total Disciplines)
                    </h4>
                  </div>
                  <p className="text-[11px] text-[#252A34]/70 mt-0.5">
                    Independent image uploads for every service tile on the homepage. Replacing or removing an image here only affects the Homepage tile and never modifies Services listing cards or individual detail pages.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const allOpen: Record<string, boolean> = {};
                      allServices.forEach(s => { allOpen[s.id] = true; });
                      setExpandedHomepageServices(allOpen);
                    }}
                    className="px-2.5 py-1 bg-white border border-[#E4D8C8] hover:bg-[#EEF2F9] text-[#173B75] rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedHomepageServices({})}
                    className="px-2.5 py-1 bg-white border border-[#E4D8C8] hover:bg-[#EEF2F9] text-[#173B75] rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {allServices.map((service, idx) => {
                  const isExpanded = Boolean(expandedHomepageServices[service.id]);
                  const hasCustomDesktop = Boolean(service.homepageImageDesktop);
                  const hasCustomMobile = Boolean(service.homepageImageMobile);

                  return (
                    <div
                      key={service.id || idx}
                      className="p-5 rounded-2xl bg-[#F7F7F5] border border-[#E4D8C8] space-y-4 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-xl bg-[#173B75] text-white flex items-center justify-center text-xs font-mono font-bold">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-bold text-[#173B75]">
                                {service.title.replace(/^\d+[\.\-\s]+/, '')}
                              </h5>
                              <span className="text-[10px] text-[#252A34]/50 font-mono">
                                #{service.id}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono ${
                                  hasCustomDesktop
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : service.image
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                Desktop: {hasCustomDesktop ? 'Custom Upload' : service.image ? 'Default Asset' : 'None'}
                              </span>

                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono ${
                                  hasCustomMobile
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                Mobile: {hasCustomMobile ? 'Custom Upload' : 'Desktop Fallback'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleHomepageServiceExpand(service.id)}
                          className="px-3 py-1.5 bg-[#173B75] text-white text-xs font-semibold rounded-xl hover:bg-[#123163] cursor-pointer flex items-center gap-1.5 self-start sm:self-auto transition-colors"
                        >
                          <span>{isExpanded ? 'Done Editing' : 'Edit Tile Images'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="pt-4 border-t border-[#E4D8C8] space-y-4 animate-in fade-in duration-200">
                          <p className="text-[11px] text-[#252A34]/75">
                            Upload independent artwork for this service tile on the homepage. Desktop container is 3-column (~384 × 208 px); mobile container is single-column (~343 × 192 px).
                          </p>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Desktop Homepage Tile Image */}
                            <AssetUploadField
                              label="Homepage Tile Image (Desktop)"
                              sectionName={`Homepage Services #${idx + 1} (${service.title})`}
                              currentUrl={service.homepageImageDesktop !== undefined ? service.homepageImageDesktop : (service.image || '')}
                              onUpload={async (file) => {
                                const url = await uploadImageFile(file);
                                if (url) {
                                  handleUpdateServiceHomepageImage(idx, { homepageImageDesktop: url });
                                  showToast(`Homepage desktop image updated for ${service.title}`, 'success');
                                }
                              }}
                              onClear={() => {
                                handleUpdateServiceHomepageImage(idx, { homepageImageDesktop: '' });
                                showToast(`Homepage desktop image removed for ${service.title}`);
                              }}
                              recommendedDimensions="800 × 440 px (Recommended)"
                              aspectRatio="16:9 / 1.85:1 Landscape"
                              supportedFormats="JPG, PNG, WebP"
                              maxFileSize="5 MB"
                              helpText="Exact dimensions calculated from the Homepage 3-column card container (384 × 208 px rendered). Shown on laptops and desktop viewports."
                            />

                            {/* Mobile Homepage Tile Image */}
                            <AssetUploadField
                              label="Homepage Tile Image (Mobile Optional)"
                              sectionName={`Homepage Services Mobile #${idx + 1} (${service.title})`}
                              currentUrl={service.homepageImageMobile || ''}
                              onUpload={async (file) => {
                                const url = await uploadImageFile(file);
                                if (url) {
                                  handleUpdateServiceHomepageImage(idx, { homepageImageMobile: url });
                                  showToast(`Homepage mobile image updated for ${service.title}`, 'success');
                                }
                              }}
                              onClear={() => {
                                handleUpdateServiceHomepageImage(idx, { homepageImageMobile: '' });
                                showToast(`Homepage mobile image removed for ${service.title}`);
                              }}
                              recommendedDimensions="720 × 400 px (Recommended)"
                              aspectRatio="16:9 Landscape"
                              supportedFormats="JPG, PNG, WebP"
                              maxFileSize="5 MB"
                              isOptional={true}
                              helpText="Exact dimensions calculated from the mobile card container (343 × 192 px rendered). If omitted, desktop homepage image scales responsively."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: WHY GOOD FOLK */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('whyGoodfolk')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">4</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 4: Why Good Folk? (Core Advantage Cards)</h3>
              <p className="text-[11px] text-[#252A34]/70">Section badge, title, subtitle and all 3 foundational advantage pillars</p>
            </div>
          </div>
          {openSections.whyGoodfolk ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.whyGoodfolk && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">Badge</label>
                <input
                  type="text"
                  value={siteContent.homeWhyBadge || 'Core Advantage'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, homeWhyBadge: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#173B75] mb-1">Heading</label>
                <input
                  type="text"
                  value={siteContent.homeWhyHeadline || 'Why Good Folk?'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, homeWhyHeadline: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#173B75] mb-1">Subtitle</label>
              <input
                type="text"
                value={siteContent.homeWhySubtitle || 'More than creative work. We build ideas that move businesses forward.'}
                onChange={(e) => onUpdateSiteContent({ ...siteContent, homeWhySubtitle: e.target.value })}
                className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-2">
                <span className="text-xs font-bold text-[#F07822]">Pillar 01</span>
                <input
                  type="text"
                  value={siteContent.homeWhyCard1Title || 'Creative That Stands Out'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, homeWhyCard1Title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs font-bold bg-white"
                />
                <textarea
                  rows={3}
                  value={siteContent.homeWhyCard1Desc || 'Designs that capture attention. In a saturated market, generic creative gets overlooked. We design distinctive visual systems and packaging that stop thumbs and earn shelf space.'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, homeWhyCard1Desc: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                />
              </div>

              <div className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-2">
                <span className="text-xs font-bold text-[#F07822]">Pillar 02</span>
                <input
                  type="text"
                  value={siteContent.homeWhyCard2Title || 'Strategy With Purpose'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, homeWhyCard2Title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs font-bold bg-white"
                />
                <textarea
                  rows={3}
                  value={siteContent.homeWhyCard2Desc || 'Every idea has a clear goal. Aesthetics without commercial purpose are decorative. Every font choice, color ratio, and video hook is rooted in your business and audience objectives.'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, homeWhyCard2Desc: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                />
              </div>

              <div className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-2">
                <span className="text-xs font-bold text-[#F07822]">Pillar 03</span>
                <input
                  type="text"
                  value={siteContent.homeWhyCard3Title || 'One Creative Partner'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, homeWhyCard3Title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs font-bold bg-white"
                />
                <textarea
                  rows={3}
                  value={siteContent.homeWhyCard3Desc || 'Multiple creative services under one roof. No juggling five disconnected freelancers. Brand identity, packaging, e-commerce, video, and social campaigns remain tightly cohesive.'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, homeWhyCard3Desc: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: TRUSTED BY MARQUEE */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('trustedBy')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">5</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 5: Trusted By Marquee ({trustedBrands.length} Brands)</h3>
              <p className="text-[11px] text-[#252A34]/70">Add, edit, toggle and upload transparent client logos for the infinite marquee</p>
            </div>
          </div>
          {openSections.trustedBy ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.trustedBy && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4D8C8]">
              <span className="text-xs font-bold text-[#173B75]">Client Logos & Brand Names</span>
              <button
                type="button"
                onClick={handleAddBrand}
                className="px-3 py-1.5 bg-[#173B75] text-white text-xs font-bold rounded-lg hover:bg-[#123163] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#F07822]" />
                <span>Add Client Brand</span>
              </button>
            </div>

            <div className="space-y-4">
              {trustedBrands.map((brand, idx) => (
                <div key={brand.id || idx} className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E4D8C8] space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#173B75] text-white flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={brand.name}
                      placeholder="Brand Name"
                      onChange={(e) => handleUpdateBrand(idx, { name: e.target.value })}
                      className="flex-1 px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs font-bold bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateBrand(idx, { active: !brand.active })}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        brand.active ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {brand.active ? 'Active' : 'Hidden'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBrand(idx)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <AssetUploadField
                    label={`${brand.name || 'Brand'} Logo Artwork`}
                    sectionName="Homepage Trusted By Marquee"
                    currentUrl={brand.logoUrl}
                    onUpload={(file) => handleBrandLogoUpload(idx, file)}
                    onClear={() => handleUpdateBrand(idx, { logoUrl: '' })}
                    recommendedDimensions="300 × 100 px (Recommended)"
                    aspectRatio="3:1 Horizontal"
                    supportedFormats="SVG (Preferred), PNG, WebP"
                    maxFileSize="2 MB"
                    helpText="Transparent SVG or PNG logo works best inside the light background marquee."
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 6: CLIENT TESTIMONIALS */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('testimonials')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">6</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 6: Client Testimonials ({testimonials.length} Reviews)</h3>
              <p className="text-[11px] text-[#252A34]/70">Add, edit, manage star ratings, client photos and testimonial quotes</p>
            </div>
          </div>
          {openSections.testimonials ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.testimonials && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4D8C8]">
              <span className="text-xs font-bold text-[#173B75]">Published Reviews</span>
              <button
                type="button"
                onClick={handleAddTestimonial}
                className="px-3 py-1.5 bg-[#173B75] text-white text-xs font-bold rounded-lg hover:bg-[#123163] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#F07822]" />
                <span>Add Review</span>
              </button>
            </div>

            <div className="space-y-4">
              {testimonials.map((test, idx) => (
                <div key={test.id || idx} className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E4D8C8] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#173B75]">Review #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTestimonial(idx)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Client Name</label>
                      <input
                        type="text"
                        value={test.clientName}
                        onChange={(e) => handleUpdateTestimonial(idx, { clientName: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Company / Brand</label>
                      <input
                        type="text"
                        value={test.company}
                        onChange={(e) => handleUpdateTestimonial(idx, { company: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Designation</label>
                      <input
                        type="text"
                        value={test.designation || ''}
                        placeholder="Founder, Head of Design..."
                        onChange={(e) => handleUpdateTestimonial(idx, { designation: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Review Quote</label>
                    <textarea
                      rows={3}
                      value={test.text}
                      onChange={(e) => handleUpdateTestimonial(idx, { text: e.target.value })}
                      className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                    />
                  </div>

                  <AssetUploadField
                    label="Client Avatar Photo"
                    sectionName="Homepage Testimonials Grid"
                    currentUrl={test.photoUrl}
                    onUpload={(file) => handleTestimonialPhotoUpload(idx, file)}
                    onClear={() => handleUpdateTestimonial(idx, { photoUrl: '' })}
                    recommendedDimensions="200 × 200 px (Recommended)"
                    aspectRatio="1:1 Square"
                    supportedFormats="JPG, PNG, WebP"
                    maxFileSize="2 MB"
                    helpText="Displayed in the circular avatar bubble beside the client quote."
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 7: FOOTER CTA BANNER */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('footerCta')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">7</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 7: Homepage Footer CTA Banner</h3>
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
                  value={siteContent.footerCtas?.home?.heading || 'Ready to Build Something Great?'}
                  onChange={(e) => {
                    const current = siteContent.footerCtas?.home || {
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
                        home: { ...current, heading: e.target.value }
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
                  value={siteContent.footerCtas?.home?.buttonText || "Let's Talk"}
                  onChange={(e) => {
                    const current = siteContent.footerCtas?.home || {
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
                        home: { ...current, buttonText: e.target.value }
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
                value={siteContent.footerCtas?.home?.description || "Have a project in mind? Let's turn your ideas into impactful creative work."}
                onChange={(e) => {
                  const current = siteContent.footerCtas?.home || {
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
                      home: { ...current, description: e.target.value }
                    }
                  });
                }}
                className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 8: HOMEPAGE VISIBILITY TOGGLES */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('visibility')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">8</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 8: Homepage Section Visibility Toggles</h3>
              <p className="text-[11px] text-[#252A34]/70">Instantly hide or show entire homepage sections on the public site</p>
            </div>
          </div>
          {openSections.visibility ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.visibility && (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'homeHero', label: 'Hero / Banner Section' },
                { key: 'homeServicesPreview', label: 'Services Preview Cards' },
                { key: 'homeWhyGoodfolk', label: 'Why Good Folk Advantage' },
                { key: 'homeTrustedBy', label: 'Trusted By Marquee' },
                { key: 'homeTestimonials', label: 'Client Testimonials' },
                { key: 'homeFooterCta', label: 'Footer CTA Banner' }
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
                        {isVisible ? 'Visible on Homepage' : 'Hidden from Homepage'}
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
