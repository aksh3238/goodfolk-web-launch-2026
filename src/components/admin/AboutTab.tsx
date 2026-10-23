import React, { useState } from 'react';
import {
  ChevronDown, ChevronUp, Save, Eye, EyeOff, Upload, Trash2, Plus,
  Sparkles, Layers, Image as ImageIcon, Video as VideoIcon, ShieldCheck,
  CheckCircle2, RefreshCw, BookOpen, Compass, ArrowUp, ArrowDown
} from 'lucide-react';
import type {
  CMSSiteContent,
  PageBannerConfig
} from '../../types';
import { AssetUploadField } from './AssetUploadField';

export interface AboutTabProps {
  token: string;
  siteContent: CMSSiteContent;
  onUpdateSiteContent: (updated: CMSSiteContent) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  uploadImageFile: (file: File) => Promise<string | null>;
  onSaveDraft: () => Promise<void>;
  onPublishLive: () => Promise<void>;
  saving: boolean;
}

export const AboutTab: React.FC<AboutTabProps> = ({
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
    brandFilm: false,
    storyApproach: true,
    standards: false,
    principles: false,
    footerCta: false,
    visibility: false
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const currentBanner: PageBannerConfig = siteContent.pageBanners?.about || {
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
        about: {
          ...currentBanner,
          ...updates
        }
      }
    });
  };

  // Standards Cards (Section 4)
  const defaultStandardsCards = [
    {
      id: 'sc-1',
      badge: 'Print Production',
      title: 'Manufacturer Certified Files',
      subtitle: 'Zero Print Guesswork',
      desc: 'Every dieline is built to manufacturer specifications with exact bleed lines, Pantone swatches, and foil/emboss separation plates.'
    },
    {
      id: 'sc-2',
      badge: 'Conversion Rate',
      title: 'Data-Backed Visual Psychology',
      subtitle: 'Tested Ad Variations',
      desc: 'Performance ads are designed around high-retention hooks and value proposition hierarchy proven across Meta and Google.'
    },
    {
      id: 'sc-3',
      badge: 'Client Assurance',
      title: 'Transparent Collaboration',
      subtitle: 'Direct Partner Access',
      desc: 'Direct communication with seasoned design leads, milestone-based UPI billing, and complete vector asset ownership upon delivery.'
    }
  ];

  const standardsCards = (siteContent.aboutStandardsCards && siteContent.aboutStandardsCards.length > 0)
    ? siteContent.aboutStandardsCards
    : defaultStandardsCards;

  const handleUpdateStandardCard = (idx: number, updates: Partial<{ id: string; badge: string; title: string; subtitle: string; desc: string }>) => {
    const updated = [...standardsCards];
    updated[idx] = { ...updated[idx], ...updates };
    onUpdateSiteContent({ ...siteContent, aboutStandardsCards: updated });
  };

  const handleMoveStandardCard = (idx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === standardsCards.length - 1)) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...standardsCards];
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    onUpdateSiteContent({ ...siteContent, aboutStandardsCards: updated });
  };

  const handleAddStandardCard = () => {
    const newCard = {
      id: `sc-${Date.now()}`,
      badge: 'Quality Standard',
      title: 'New Standard Title',
      subtitle: 'Standard Subtitle',
      desc: 'Detailed quality benchmark description.'
    };
    onUpdateSiteContent({ ...siteContent, aboutStandardsCards: [...standardsCards, newCard] });
  };

  const handleDeleteStandardCard = (idx: number) => {
    const updated = standardsCards.filter((_, i) => i !== idx);
    onUpdateSiteContent({ ...siteContent, aboutStandardsCards: updated });
  };

  // Principles Cards (Section 5)
  const defaultPrinciples = [
    {
      id: 'p1',
      title: 'Clarity Before Creativity',
      desc: 'Every project starts with understanding the problem and the goal. Before sketches or palettes, we ground our work in strategic commercial objectives.'
    },
    {
      id: 'p2',
      title: 'Thoughtful Execution',
      desc: 'We pay attention to the details that make a brand feel consistent and considered. From microscopic kerning to packaging dieline tolerances, precision matters.'
    },
    {
      id: 'p3',
      title: 'Collaboration',
      desc: 'We work with clients through clear communication, review and feedback. You are an essential co-creator in evaluating how the brand communicates.'
    },
    {
      id: 'p4',
      title: 'Purposeful Design',
      desc: 'Creative decisions should support the brand and its objectives. Aesthetics without commercial utility are mere ornament; our work drives business forward.'
    }
  ];

  const principlesCards = (siteContent.aboutPrinciplesCards && siteContent.aboutPrinciplesCards.length > 0)
    ? siteContent.aboutPrinciplesCards
    : defaultPrinciples;

  const handleUpdatePrincipleCard = (idx: number, updates: Partial<{ id: string; title: string; desc: string }>) => {
    const updated = [...principlesCards];
    updated[idx] = { ...updated[idx], ...updates };
    onUpdateSiteContent({ ...siteContent, aboutPrinciplesCards: updated });
  };

  const handleMovePrincipleCard = (idx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === principlesCards.length - 1)) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...principlesCards];
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    onUpdateSiteContent({ ...siteContent, aboutPrinciplesCards: updated });
  };

  const handleAddPrincipleCard = () => {
    const newPrinciple = {
      id: `p-${Date.now()}`,
      title: 'New Foundational Principle',
      desc: 'Description of the principle and how it drives creative decisions.'
    };
    onUpdateSiteContent({ ...siteContent, aboutPrinciplesCards: [...principlesCards, newPrinciple] });
  };

  const handleDeletePrincipleCard = (idx: number) => {
    const updated = principlesCards.filter((_, i) => i !== idx);
    onUpdateSiteContent({ ...siteContent, aboutPrinciplesCards: updated });
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#E4D8C8] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#173B75]" />
            <h2 className="text-xl font-black text-[#173B75]">About Us Page Manager</h2>
            <span className="text-xs bg-[#E8EFF8] text-[#173B75] px-2.5 py-0.5 rounded-full font-bold">Public Route: /about</span>
          </div>
          <p className="text-xs text-[#252A34]/70 mt-1">
            Manage agency narrative, brand film reel, founding story, operational approach, enterprise standards, and core principles with side-by-side asset specifications.
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
              <p className="text-[11px] text-[#252A34]/70">About badge, main headline, narrative tagline and optional custom graphic banner</p>
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
                  value={siteContent.aboutHeroBadge || 'About Goodfolk Solution'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, aboutHeroBadge: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#173B75] mb-1">Main Headline</label>
                <input
                  type="text"
                  value={siteContent.aboutHeadline || 'Good Ideas Deserve Good Folks.'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, aboutHeadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#173B75] mb-1">Narrative Tagline</label>
              <textarea
                rows={3}
                value={siteContent.aboutTagline || 'Goodfolk Solution brings strategy, creativity and thoughtful design together to help brands communicate clearly and grow with purpose.'}
                onChange={(e) => onUpdateSiteContent({ ...siteContent, aboutTagline: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs focus:ring-2 focus:ring-[#173B75] focus:outline-none"
              />
            </div>

            {/* Custom Banner Artwork Box */}
            <div className="pt-4 border-t border-[#E4D8C8] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#173B75]">About Custom Graphic Banner (Optional)</h4>
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
                  label="Desktop About Hero Artwork"
                  sectionName="About Hero (Desktop)"
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
                  helpText="Hero header banner displayed to desktop and tablet visitors on /about."
                />

                <AssetUploadField
                  label="Mobile About Hero Artwork"
                  sectionName="About Hero (Mobile)"
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

      {/* SECTION 2: BRAND FILM VIDEO */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('brandFilm')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">2</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 2: 15-Second Edge-to-Edge Brand Video</h3>
              <p className="text-[11px] text-[#252A34]/70">Full-width cinematic brand film embedded between hero and story sections</p>
            </div>
          </div>
          {openSections.brandFilm ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.brandFilm && (
          <div className="p-6 space-y-4">
            <div className="space-y-4">
              <AssetUploadField
                label="Brand Reel Video Asset (MP4/WebM)"
                sectionName="About Us Full-Width Video"
                mediaType="video"
                currentUrl={siteContent.heroVideoUrl}
                onUpload={async (file) => {
                  const url = await uploadImageFile(file);
                  if (url) onUpdateSiteContent({ ...siteContent, heroVideoUrl: url });
                }}
                onClear={() => onUpdateSiteContent({ ...siteContent, heroVideoUrl: '' })}
                recommendedDimensions="1920 × 1080 px Full HD (Recommended)"
                aspectRatio="16:9 Widescreen"
                supportedFormats="MP4, WebM"
                maxFileSize="100 MB"
                helpText="Renders edge-to-edge on /about with interactive play/pause and sound toggles."
              />

              <AssetUploadField
                label="Brand Film Video Poster Frame"
                sectionName="About Us Video Poster"
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
                helpText="High-resolution poster image shown before playback begins."
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: OUR STORY & APPROACH */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('storyApproach')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">3</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 3: Our Story & Our Approach</h3>
              <p className="text-[11px] text-[#252A34]/70">Founding mission, operational approach and studio collaboration visual asset</p>
            </div>
          </div>
          {openSections.storyApproach ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.storyApproach && (
          <div className="p-6 space-y-6">
            <div className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-3">
              <span className="text-xs font-bold text-[#F07822]">Our Story</span>
              <div>
                <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Story Block Heading</label>
                <input
                  type="text"
                  value={siteContent.aboutStoryTitle || 'Built Around Purposeful Craft'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, aboutStoryTitle: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Story Narrative Description</label>
                <textarea
                  rows={3}
                  value={siteContent.aboutStory || 'Goodfolk Solution was built around a simple belief: thoughtful creative work can make a meaningful difference to a business. We bring branding, design and digital communication together to help businesses express their identity and connect with their audience.'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, aboutStory: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs bg-white leading-relaxed"
                />
              </div>
            </div>

            <div className="p-4 bg-[#EEF2F9]/50 rounded-2xl border border-[#173B75]/10 space-y-3">
              <span className="text-xs font-bold text-[#173B75]">Our Approach</span>
              <div>
                <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Approach Block Heading</label>
                <input
                  type="text"
                  value={siteContent.aboutApproachTitle || 'Understand, Calibrate, Execute'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, aboutApproachTitle: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Approach Narrative Description</label>
                <textarea
                  rows={3}
                  value={siteContent.aboutApproach || 'We begin by understanding the business, the audience and the objective. From there, we develop creative solutions that are relevant, consistent and purposeful.'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, aboutApproach: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs bg-white leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: ENTERPRISE QUALITY STANDARDS */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('standards')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">4</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 4: Enterprise Quality Standards ({standardsCards.length} Cards)</h3>
              <p className="text-[11px] text-[#252A34]/70">Print Production, Conversion Rate visual psychology, and Client Assurance</p>
            </div>
          </div>
          {openSections.standards ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.standards && (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">Section Badge</label>
                <input
                  type="text"
                  value={siteContent.aboutStandardsBadge || 'Enterprise Quality Standards'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, aboutStandardsBadge: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">Section Headline</label>
                <input
                  type="text"
                  value={siteContent.aboutStandardsHeadline || 'Built For Real Business Growth'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, aboutStandardsHeadline: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#173B75] mb-1">Section Subtitle</label>
              <textarea
                rows={2}
                value={siteContent.aboutStandardsSubtitle || 'From tactile print tolerances to performance creative variation architecture, every asset is rigorously engineered for lasting commercial impact.'}
                onChange={(e) => onUpdateSiteContent({ ...siteContent, aboutStandardsSubtitle: e.target.value })}
                className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
              />
            </div>

            {/* Standards Cards List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#173B75]">Quality Standards Cards ({standardsCards.length})</span>
                <button
                  type="button"
                  onClick={handleAddStandardCard}
                  className="px-3 py-1 bg-[#173B75] text-white text-xs font-bold rounded-lg hover:bg-[#123163] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#F07822]" />
                  <span>Add Standard</span>
                </button>
              </div>

              {standardsCards.map((card, idx) => (
                <div key={card.id || idx} className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#173B75] text-white flex items-center justify-center text-xs font-mono font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="Badge (e.g. Print Production)"
                      value={card.badge}
                      onChange={(e) => handleUpdateStandardCard(idx, { badge: e.target.value })}
                      className="w-36 px-2.5 py-1.5 border border-[#E4D8C8] rounded-lg text-xs font-mono font-bold text-[#173B75] bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Card Title (e.g. Manufacturer Certified Files)"
                      value={card.title}
                      onChange={(e) => handleUpdateStandardCard(idx, { title: e.target.value })}
                      className="flex-1 px-3 py-1.5 border border-[#E4D8C8] rounded-lg text-xs font-bold text-[#173B75] bg-white"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveStandardCard(idx, 'up')}
                        className="p-1 hover:bg-[#E8EFF8] rounded text-[#173B75] disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === standardsCards.length - 1}
                        onClick={() => handleMoveStandardCard(idx, 'down')}
                        className="p-1 hover:bg-[#E8EFF8] rounded text-[#173B75] disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStandardCard(idx)}
                        className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                        title="Delete Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-0.5">Subtitle / Subhead</label>
                    <input
                      type="text"
                      placeholder="Card Subtitle (e.g. Zero Print Guesswork)"
                      value={card.subtitle}
                      onChange={(e) => handleUpdateStandardCard(idx, { subtitle: e.target.value })}
                      className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-lg text-xs font-semibold text-[#F07822] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-0.5">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Detailed quality description..."
                      value={card.desc}
                      onChange={(e) => handleUpdateStandardCard(idx, { desc: e.target.value })}
                      className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-lg text-xs bg-white leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: FOUNDATIONAL VALUES — OUR PRINCIPLES */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('principles')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">5</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 5: Foundational Values — Our Principles ({principlesCards.length} Principles)</h3>
              <p className="text-[11px] text-[#252A34]/70">Core standards guiding every client engagement and creative execution</p>
            </div>
          </div>
          {openSections.principles ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.principles && (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">Eyebrow</label>
                <input
                  type="text"
                  value={siteContent.aboutPrinciplesEyebrow || 'Foundational Values'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, aboutPrinciplesEyebrow: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs uppercase font-bold text-[#F07822]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#173B75] mb-1">Section Heading</label>
                <input
                  type="text"
                  value={siteContent.aboutPrinciplesHeading || 'Our Principles'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, aboutPrinciplesHeading: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#173B75] mb-1">Section Subtitle</label>
              <textarea
                rows={2}
                value={siteContent.aboutPrinciplesSubtitle || 'The core standards guiding every client engagement and creative execution.'}
                onChange={(e) => onUpdateSiteContent({ ...siteContent, aboutPrinciplesSubtitle: e.target.value })}
                className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
              />
            </div>

            {/* Principles Cards List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#173B75]">Principles Cards ({principlesCards.length})</span>
                <button
                  type="button"
                  onClick={handleAddPrincipleCard}
                  className="px-3 py-1 bg-[#173B75] text-white text-xs font-bold rounded-lg hover:bg-[#123163] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#F07822]" />
                  <span>Add Principle</span>
                </button>
              </div>

              {principlesCards.map((card, idx) => (
                <div key={card.id || idx} className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#173B75] text-white flex items-center justify-center text-xs font-mono font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="Principle Title (e.g. Clarity Before Creativity)"
                      value={card.title}
                      onChange={(e) => handleUpdatePrincipleCard(idx, { title: e.target.value })}
                      className="flex-1 px-3 py-1.5 border border-[#E4D8C8] rounded-lg text-xs font-bold text-[#173B75] bg-white"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMovePrincipleCard(idx, 'up')}
                        className="p-1 hover:bg-[#E8EFF8] rounded text-[#173B75] disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === principlesCards.length - 1}
                        onClick={() => handleMovePrincipleCard(idx, 'down')}
                        className="p-1 hover:bg-[#E8EFF8] rounded text-[#173B75] disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePrincipleCard(idx)}
                        className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                        title="Delete Principle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-0.5">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Principle details..."
                      value={card.desc}
                      onChange={(e) => handleUpdatePrincipleCard(idx, { desc: e.target.value })}
                      className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-lg text-xs bg-white leading-relaxed"
                    />
                  </div>
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
              <h3 className="text-sm font-bold text-[#173B75]">Section 6: About Us Footer CTA Banner</h3>
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
                  value={siteContent.footerCtas?.about?.heading || "Let's Build Something Meaningful."}
                  onChange={(e) => {
                    const current = siteContent.footerCtas?.about || {
                      heading: '',
                      description: '',
                      buttonText: 'Talk to Our Team',
                      buttonUrl: '#letstalk',
                      backgroundColor: '#173B75',
                      textColor: '#FFFFFF',
                      enabled: true
                    };
                    onUpdateSiteContent({
                      ...siteContent,
                      footerCtas: {
                        ...(siteContent.footerCtas || {}),
                        about: { ...current, heading: e.target.value }
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
                  value={siteContent.footerCtas?.about?.buttonText || 'Talk to Our Team'}
                  onChange={(e) => {
                    const current = siteContent.footerCtas?.about || {
                      heading: '',
                      description: '',
                      buttonText: 'Talk to Our Team',
                      buttonUrl: '#letstalk',
                      backgroundColor: '#173B75',
                      textColor: '#FFFFFF',
                      enabled: true
                    };
                    onUpdateSiteContent({
                      ...siteContent,
                      footerCtas: {
                        ...(siteContent.footerCtas || {}),
                        about: { ...current, buttonText: e.target.value }
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
                value={siteContent.footerCtas?.about?.description || 'We look forward to understanding your brand goals and bringing thoughtful creative execution to life.'}
                onChange={(e) => {
                  const current = siteContent.footerCtas?.about || {
                    heading: '',
                    description: '',
                    buttonText: 'Talk to Our Team',
                    buttonUrl: '#letstalk',
                    backgroundColor: '#173B75',
                    textColor: '#FFFFFF',
                    enabled: true
                  };
                  onUpdateSiteContent({
                    ...siteContent,
                    footerCtas: {
                      ...(siteContent.footerCtas || {}),
                      about: { ...current, description: e.target.value }
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
              <h3 className="text-sm font-bold text-[#173B75]">Section 7: About Us Section Visibility Toggles</h3>
              <p className="text-[11px] text-[#252A34]/70">Hide or show entire sections on the public /about page</p>
            </div>
          </div>
          {openSections.visibility ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.visibility && (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'aboutHero', label: 'Hero / Banner Section' },
                { key: 'aboutStory', label: 'Our Story & Mission' },
                { key: 'aboutApproach', label: 'Our Approach' },
                { key: 'aboutStandards', label: 'Enterprise Quality Standards' },
                { key: 'aboutPrinciples', label: 'Foundational Principles' },
                { key: 'aboutFooterCta', label: 'Footer CTA Banner' }
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
                        {isVisible ? 'Visible on /about' : 'Hidden from /about'}
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
