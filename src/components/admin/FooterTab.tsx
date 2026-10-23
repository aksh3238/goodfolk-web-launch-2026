import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Layout,
  Mail,
  Phone,
  Instagram,
  FileText,
  Shield,
  CreditCard,
  Info,
  Sparkles,
  Sliders,
  Image as ImageIcon,
  Palette,
  Save,
  UploadCloud,
  RotateCcw,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import type { CMSSiteContent } from '../../types';
import { AssetUploadField } from './AssetUploadField';
import { useSiteContent } from '../../context/SiteContentContext';

export interface FooterTabProps {
  token: string;
  siteContent: CMSSiteContent;
  onUpdateSiteContent: (updated: CMSSiteContent) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  uploadImageFile: (file: File) => Promise<string | null>;
  onSaveDraft: () => Promise<void>;
  onPublishLive: () => Promise<void>;
  saving: boolean;
}

const DEFAULT_BRAND_COLORS = {
  primaryColor: '#173B75',
  secondaryColor: '#2458A6',
  accentColor: '#F07822',
  backgroundColor: '#FFF9F1',
  headingColor: '#173B75',
  bodyColor: '#252A34',
  surfaceColor: '#E4D8C8'
};

export const FooterTab: React.FC<FooterTabProps> = ({
  siteContent,
  onUpdateSiteContent,
  showToast,
  uploadImageFile,
  onSaveDraft,
  onPublishLive,
  saving
}) => {
  const { previewThemeColors } = useSiteContent();
  const [isPreviewing, setIsPreviewing] = useState(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    logos: true,
    brandColors: true,
    globalAnimation: true,
    brand: false,
    contactChannels: false,
    social: false,
    copyright: false
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateField = <K extends keyof CMSSiteContent>(field: K, val: CMSSiteContent[K]) => {
    onUpdateSiteContent({
      ...siteContent,
      [field]: val
    });
  };

  const currentAnim = (siteContent.ctaAnimationType || 'animated').toLowerCase();
  // Standardize active animation value
  const normalizedAnim =
    currentAnim === 'static' || currentAnim === 'none'
      ? 'static'
      : currentAnim === 'wavy' || currentAnim === 'aurora'
      ? 'wavy'
      : currentAnim === 'gaming' || currentAnim === 'game' || currentAnim === 'cyber'
      ? 'gaming'
      : 'animated';

  const activePrimary = siteContent.primaryColor || DEFAULT_BRAND_COLORS.primaryColor;
  const activeSecondary = siteContent.secondaryColor || DEFAULT_BRAND_COLORS.secondaryColor;
  const activeAccent = siteContent.accentColor || DEFAULT_BRAND_COLORS.accentColor;
  const activeBg = siteContent.backgroundColor || DEFAULT_BRAND_COLORS.backgroundColor;
  const activeHeading = siteContent.headingColor || DEFAULT_BRAND_COLORS.headingColor;
  const activeBody = siteContent.bodyColor || DEFAULT_BRAND_COLORS.bodyColor;
  const activeSurface = siteContent.surfaceColor || DEFAULT_BRAND_COLORS.surfaceColor;

  const handleColorChange = (key: keyof typeof DEFAULT_BRAND_COLORS, hex: string) => {
    const formatted = hex.toUpperCase();
    updateField(key, formatted);
    if (isPreviewing) {
      previewThemeColors({
        primaryColor: key === 'primaryColor' ? formatted : activePrimary,
        secondaryColor: key === 'secondaryColor' ? formatted : activeSecondary,
        accentColor: key === 'accentColor' ? formatted : activeAccent,
        backgroundColor: key === 'backgroundColor' ? formatted : activeBg,
        headingColor: key === 'headingColor' ? formatted : activeHeading,
        bodyColor: key === 'bodyColor' ? formatted : activeBody,
        surfaceColor: key === 'surfaceColor' ? formatted : activeSurface
      });
    }
  };

  const handleTogglePreview = () => {
    if (isPreviewing) {
      previewThemeColors(null);
      setIsPreviewing(false);
      showToast('Theme preview cleared. Displaying published live colors.');
    } else {
      previewThemeColors({
        primaryColor: activePrimary,
        secondaryColor: activeSecondary,
        accentColor: activeAccent,
        backgroundColor: activeBg,
        headingColor: activeHeading,
        bodyColor: activeBody,
        surfaceColor: activeSurface
      });
      setIsPreviewing(true);
      showToast('Live theme preview active in your browser! Check out any page or click Publish Theme to save.');
    }
  };

  const handleRestoreDefaultColors = () => {
    if (confirm('Are you sure you want to restore original default brand colors (#173B75, #2458A6, #F07822, #FFF9F1, #173B75, #252A34, #E4D8C8)?')) {
      onUpdateSiteContent({
        ...siteContent,
        ...DEFAULT_BRAND_COLORS
      });
      previewThemeColors(null);
      setIsPreviewing(false);
      showToast('Brand colors restored to original defaults. Click Publish Theme to apply live!', 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E8ED] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#173B75] uppercase tracking-wider mb-1">
            <Layout className="w-4 h-4 text-[#F07822]" />
            <span>Global Footer & Brand Manager</span>
          </div>
          <h2 className="text-xl font-black text-[#173B75]">Website Footer, Logos & Global Brand Colors</h2>
          <p className="text-xs text-[#252A34]/70 mt-1 max-w-2xl">
            Manage header and footer logos, global brand theme & colors, footer banner animation dropdown, official contact coordinates, Instagram profile link, and copyright disclosures across all public pages.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onSaveDraft}
            disabled={saving}
            className="flex-1 md:flex-none px-4 py-2.5 border border-[#173B75] text-[#173B75] hover:bg-[#EEF2F9] text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>
          <button
            onClick={onPublishLive}
            disabled={saving}
            className="flex-1 md:flex-none px-5 py-2.5 bg-[#F07822] hover:bg-[#d65805] text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : 'Publish Theme'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: BRAND & LOGO SETTINGS (HEADER & FOOTER LOGOS) */}
      <div className="bg-white rounded-3xl border border-[#E6E8ED] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('logos')}
          className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-[#EEF2F9]/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#173B75]/10 text-[#173B75] flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="text-base font-bold text-[#173B75]">Brand & Logo Settings</h3>
              <p className="text-xs text-[#252A34]/60">Header logo, footer logo, display sizing, and format requirements.</p>
            </div>
          </div>
          {openSections.logos ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {openSections.logos && (
          <div className="p-6 pt-0 space-y-6 border-t border-[#E6E8ED]/60">
            <div className="p-4 bg-[#EEF2F9]/60 rounded-2xl border border-[#173B75]/10 text-xs flex items-start gap-3">
              <Info className="w-4 h-4 text-[#173B75] shrink-0 mt-0.5" />
              <div className="space-y-1 text-[#252A34]">
                <strong className="block text-[#173B75]">Shared Asset Relationship</strong>
                <p>
                  By default, both header and footer use the primary brand emblem and typography. You can upload an independent Header Logo (dark/colored background friendly) or Footer Logo (white/transparent recommended for dark navy background), or leave one shared logo.
                </p>
              </div>
            </div>

            {/* Header Logo Upload */}
            <AssetUploadField
              label="Header Navigation Logo (Public Top Navbar)"
              sectionName="Header Navbar"
              recommendedDimensions="320 × 90 px"
              aspectRatio="~3.5:1 (Horizontal)"
              maxFileSize="2 MB"
              supportedFormats="PNG, SVG, WebP"
              currentUrl={siteContent.headerLogoUrl || siteContent.logoUrl || ''}
              onUpload={async (file) => {
                const url = await uploadImageFile(file);
                if (url) {
                  updateField('headerLogoUrl', url);
                  showToast('Header logo uploaded and assigned!', 'success');
                }
              }}
              onClear={() => {
                updateField('headerLogoUrl', '');
                showToast('Header logo reset to default brand mark.', 'success');
              }}
              helpText="Renders in the top navigation bar across all 5 public pages (Home, Services, Portfolio, About, Contact)."
            />

            {/* Footer Logo Upload */}
            <AssetUploadField
              label="Footer Logo (Global Website Footer)"
              sectionName="Footer Column 1"
              recommendedDimensions="320 × 90 px"
              aspectRatio="~3.5:1 (Horizontal)"
              maxFileSize="2 MB"
              supportedFormats="PNG, SVG, WebP"
              currentUrl={siteContent.footerLogoUrl || siteContent.logoUrl || ''}
              onUpload={async (file) => {
                const url = await uploadImageFile(file);
                if (url) {
                  updateField('footerLogoUrl', url);
                  showToast('Footer logo uploaded and assigned!', 'success');
                }
              }}
              onClear={() => {
                updateField('footerLogoUrl', '');
                showToast('Footer logo reset to default brand mark.', 'success');
              }}
              helpText="Renders in the brand column of the global website footer on dark navy background."
            />

            {/* Display Height Slider / Setting */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F7F7F5] rounded-2xl border border-[#E6E8ED]">
              <div>
                <label className="block text-xs font-bold text-[#173B75] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#F07822]" />
                  <span>Max Display Height ({siteContent.logoHeight || 52}px)</span>
                </label>
                <input
                  type="range"
                  min={36}
                  max={88}
                  step={2}
                  value={siteContent.logoHeight || 52}
                  onChange={(e) => updateField('logoHeight', Number(e.target.value))}
                  className="w-full accent-[#F07822] cursor-pointer"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Calibrate visual footprint across responsive desktop and mobile viewports.
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl border border-[#E6E8ED] flex items-center gap-2">
                  <span className="text-xs font-bold text-[#173B75]">Header Preview:</span>
                  <div className="h-10 flex items-center justify-center px-3 bg-[#F7F7F5] rounded-lg">
                    {siteContent.headerLogoUrl || siteContent.logoUrl ? (
                      <img
                        src={siteContent.headerLogoUrl || siteContent.logoUrl}
                        alt="Logo"
                        style={{ maxHeight: `${siteContent.logoHeight || 52}px` }}
                        className="object-contain"
                      />
                    ) : (
                      <span className="font-extrabold text-[#173B75] text-xs">GOOD FOLK</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-[#173B75] rounded-xl text-white flex items-center gap-2">
                  <span className="text-xs font-bold">Footer:</span>
                  <div className="h-10 flex items-center justify-center px-3 bg-white/10 rounded-lg">
                    {siteContent.footerLogoUrl || siteContent.logoUrl ? (
                      <img
                        src={siteContent.footerLogoUrl || siteContent.logoUrl}
                        alt="Logo"
                        style={{ maxHeight: `${siteContent.logoHeight || 52}px` }}
                        className="object-contain brightness-125"
                      />
                    ) : (
                      <span className="font-extrabold text-white text-xs">GOOD FOLK</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: GLOBAL BRAND THEME & COLORS */}
      <div className="bg-white rounded-3xl border border-[#E6E8ED] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('brandColors')}
          className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-[#EEF2F9]/40 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#173B75]">Global Brand Theme & Colors</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#173B75] text-white">
                  7 Design Tokens
                </span>
                {isPreviewing && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 animate-pulse">
                    Live Preview Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[#252A34]/60">
                Centralized design-token system controlling colors across navigation, buttons, cards, headings, and surfaces on all 5 public pages.
              </p>
            </div>
          </div>
          {openSections.brandColors ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {openSections.brandColors && (
          <div className="p-6 pt-0 space-y-6 border-t border-[#E6E8ED]/60">
            {/* Info Notice */}
            <div className="p-4 bg-[#EEF2F9]/60 rounded-2xl border border-[#173B75]/10 text-xs flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-[#F07822] shrink-0 mt-0.5" />
              <div className="space-y-1 text-[#252A34]">
                <strong className="block text-[#173B75]">Centralized CSS Design Tokens</strong>
                <p>
                  Changes here map directly to CSS variables across <span className="font-semibold text-[#173B75]">/</span>, <span className="font-semibold text-[#173B75]">/services</span>, <span className="font-semibold text-[#173B75]">/portfolio</span>, <span className="font-semibold text-[#173B75]">/about</span>, and <span className="font-semibold text-[#173B75]">/contact</span>. Individual case study palettes remain independently editable and are not overwritten.
                </p>
              </div>
            </div>

            {/* Live Theme Preview Component */}
            <div className="p-4 rounded-2xl border border-[#E6E8ED] bg-[#F7F7F5] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#F07822]" />
                  <span className="text-xs font-bold text-[#173B75] uppercase tracking-wider">
                    Website Theme Live Preview
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#252A34]/60">Interactive Sample Card</span>
              </div>

              {/* Mini mock website container */}
              <div
                className="rounded-xl overflow-hidden border shadow-sm transition-all"
                style={{
                  backgroundColor: activeBg,
                  borderColor: activeSurface
                }}
              >
                {/* Mock Header */}
                <div
                  className="px-4 py-2.5 flex items-center justify-between"
                  style={{ backgroundColor: activePrimary }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeAccent }} />
                    <span className="text-xs font-black tracking-wider text-white">GOOD FOLK</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/80 font-medium hidden sm:inline">Services</span>
                    <span className="text-[10px] text-white/80 font-medium hidden sm:inline">Portfolio</span>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: activeAccent }}
                    >
                      Let's Talk
                    </button>
                  </div>
                </div>

                {/* Mock Content Hero */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: `${activeSecondary}1A`,
                      color: activeSecondary
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeAccent }} />
                    <span>Selected Brand Direction</span>
                  </div>

                  <h4
                    className="text-base sm:text-lg font-black tracking-tight"
                    style={{ color: activeHeading }}
                  >
                    Strategic Brand Architecture & Creative Design
                  </h4>

                  <p
                    className="text-xs leading-relaxed max-w-lg"
                    style={{ color: activeBody }}
                  >
                    High-contrast typography, tailored packaging dielines, and conversion creatives engineered for ambitious modern consumer brands.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer"
                      style={{ backgroundColor: activeAccent }}
                    >
                      Primary Action
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer"
                      style={{
                        borderColor: activeSurface,
                        color: activePrimary,
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      Secondary Scope
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid of 7 Editable Brand Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. Primary Brand Color */}
              <div className="p-4 bg-white rounded-2xl border border-[#E6E8ED] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#173B75]">1. Primary Brand Color</span>
                  <span className="text-[10px] font-mono text-[#252A34]/50">primaryColor</span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl border border-black/15 shadow-inner shrink-0"
                    style={{ backgroundColor: activePrimary }}
                  />
                  <input
                    type="color"
                    value={activePrimary.startsWith('#') && activePrimary.length === 7 ? activePrimary : '#173B75'}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className="w-10 h-10 p-0.5 rounded-lg border border-[#E6E8ED] cursor-pointer shrink-0 bg-transparent"
                    title="Choose primary color"
                  />
                  <input
                    type="text"
                    value={activePrimary}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    placeholder="#173B75"
                    className="flex-1 px-3 py-2 font-mono text-xs font-bold border border-[#E6E8ED] rounded-xl uppercase"
                  />
                </div>
                <p className="text-[11px] text-[#252A34]/70">
                  Navigation bar, primary dark headings, hero badges, and core brand accents.
                </p>
              </div>

              {/* 2. Secondary Brand Color */}
              <div className="p-4 bg-white rounded-2xl border border-[#E6E8ED] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#173B75]">2. Secondary Brand Color</span>
                  <span className="text-[10px] font-mono text-[#252A34]/50">secondaryColor</span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl border border-black/15 shadow-inner shrink-0"
                    style={{ backgroundColor: activeSecondary }}
                  />
                  <input
                    type="color"
                    value={activeSecondary.startsWith('#') && activeSecondary.length === 7 ? activeSecondary : '#2458A6'}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    className="w-10 h-10 p-0.5 rounded-lg border border-[#E6E8ED] cursor-pointer shrink-0 bg-transparent"
                    title="Choose secondary color"
                  />
                  <input
                    type="text"
                    value={activeSecondary}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    placeholder="#2458A6"
                    className="flex-1 px-3 py-2 font-mono text-xs font-bold border border-[#E6E8ED] rounded-xl uppercase"
                  />
                </div>
                <p className="text-[11px] text-[#252A34]/70">
                  Royal blue highlights, links, secondary badges, and interactive gradient tones.
                </p>
              </div>

              {/* 3. Accent / CTA Color */}
              <div className="p-4 bg-white rounded-2xl border border-[#E6E8ED] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#173B75]">3. Accent / CTA Color</span>
                  <span className="text-[10px] font-mono text-[#252A34]/50">accentColor</span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl border border-black/15 shadow-inner shrink-0"
                    style={{ backgroundColor: activeAccent }}
                  />
                  <input
                    type="color"
                    value={activeAccent.startsWith('#') && activeAccent.length === 7 ? activeAccent : '#F07822'}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                    className="w-10 h-10 p-0.5 rounded-lg border border-[#E6E8ED] cursor-pointer shrink-0 bg-transparent"
                    title="Choose accent color"
                  />
                  <input
                    type="text"
                    value={activeAccent}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                    placeholder="#F07822"
                    className="flex-1 px-3 py-2 font-mono text-xs font-bold border border-[#E6E8ED] rounded-xl uppercase"
                  />
                </div>
                <p className="text-[11px] text-[#252A34]/70">
                  Primary call-to-action buttons, key focal badges, active tabs, and hover states.
                </p>
              </div>

              {/* 4. Page Background Color */}
              <div className="p-4 bg-white rounded-2xl border border-[#E6E8ED] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#173B75]">4. Page Background Color</span>
                  <span className="text-[10px] font-mono text-[#252A34]/50">backgroundColor</span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl border border-black/15 shadow-inner shrink-0"
                    style={{ backgroundColor: activeBg }}
                  />
                  <input
                    type="color"
                    value={activeBg.startsWith('#') && activeBg.length === 7 ? activeBg : '#FFF9F1'}
                    onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                    className="w-10 h-10 p-0.5 rounded-lg border border-[#E6E8ED] cursor-pointer shrink-0 bg-transparent"
                    title="Choose background color"
                  />
                  <input
                    type="text"
                    value={activeBg}
                    onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                    placeholder="#FFF9F1"
                    className="flex-1 px-3 py-2 font-mono text-xs font-bold border border-[#E6E8ED] rounded-xl uppercase"
                  />
                </div>
                <p className="text-[11px] text-[#252A34]/70">
                  Public page canvas background tone (warm soft cream default).
                </p>
              </div>

              {/* 5. Heading Text Color */}
              <div className="p-4 bg-white rounded-2xl border border-[#E6E8ED] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#173B75]">5. Heading Text Color</span>
                  <span className="text-[10px] font-mono text-[#252A34]/50">headingColor</span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl border border-black/15 shadow-inner shrink-0"
                    style={{ backgroundColor: activeHeading }}
                  />
                  <input
                    type="color"
                    value={activeHeading.startsWith('#') && activeHeading.length === 7 ? activeHeading : '#173B75'}
                    onChange={(e) => handleColorChange('headingColor', e.target.value)}
                    className="w-10 h-10 p-0.5 rounded-lg border border-[#E6E8ED] cursor-pointer shrink-0 bg-transparent"
                    title="Choose heading color"
                  />
                  <input
                    type="text"
                    value={activeHeading}
                    onChange={(e) => handleColorChange('headingColor', e.target.value)}
                    placeholder="#173B75"
                    className="flex-1 px-3 py-2 font-mono text-xs font-bold border border-[#E6E8ED] rounded-xl uppercase"
                  />
                </div>
                <p className="text-[11px] text-[#252A34]/70">
                  Primary heading typographic color for H1-H4 titles and prominent headlines.
                </p>
              </div>

              {/* 6. Body Text Color */}
              <div className="p-4 bg-white rounded-2xl border border-[#E6E8ED] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#173B75]">6. Body Text Color</span>
                  <span className="text-[10px] font-mono text-[#252A34]/50">bodyColor</span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl border border-black/15 shadow-inner shrink-0"
                    style={{ backgroundColor: activeBody }}
                  />
                  <input
                    type="color"
                    value={activeBody.startsWith('#') && activeBody.length === 7 ? activeBody : '#252A34'}
                    onChange={(e) => handleColorChange('bodyColor', e.target.value)}
                    className="w-10 h-10 p-0.5 rounded-lg border border-[#E6E8ED] cursor-pointer shrink-0 bg-transparent"
                    title="Choose body color"
                  />
                  <input
                    type="text"
                    value={activeBody}
                    onChange={(e) => handleColorChange('bodyColor', e.target.value)}
                    placeholder="#252A34"
                    className="flex-1 px-3 py-2 font-mono text-xs font-bold border border-[#E6E8ED] rounded-xl uppercase"
                  />
                </div>
                <p className="text-[11px] text-[#252A34]/70">
                  High-contrast body text for paragraphs, descriptions, and long-form copy.
                </p>
              </div>

              {/* 7. Border / Surface Color */}
              <div className="p-4 bg-white rounded-2xl border border-[#E6E8ED] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#173B75]">7. Border / Surface Color</span>
                  <span className="text-[10px] font-mono text-[#252A34]/50">surfaceColor</span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl border border-black/15 shadow-inner shrink-0"
                    style={{ backgroundColor: activeSurface }}
                  />
                  <input
                    type="color"
                    value={activeSurface.startsWith('#') && activeSurface.length === 7 ? activeSurface : '#E4D8C8'}
                    onChange={(e) => handleColorChange('surfaceColor', e.target.value)}
                    className="w-10 h-10 p-0.5 rounded-lg border border-[#E6E8ED] cursor-pointer shrink-0 bg-transparent"
                    title="Choose surface border color"
                  />
                  <input
                    type="text"
                    value={activeSurface}
                    onChange={(e) => handleColorChange('surfaceColor', e.target.value)}
                    placeholder="#E4D8C8"
                    className="flex-1 px-3 py-2 font-mono text-xs font-bold border border-[#E6E8ED] rounded-xl uppercase"
                  />
                </div>
                <p className="text-[11px] text-[#252A34]/70">
                  Subtle dividers, card borders, form outlines, and elevated frame edges.
                </p>
              </div>
            </div>

            {/* Functional Controls: Save Draft, Preview Theme, Publish Theme, Restore Defaults */}
            <div className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E6E8ED] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRestoreDefaultColors}
                className="px-4 py-2 border border-[#173B75]/25 text-[#173B75] hover:bg-[#EEF2F9] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#F07822]" />
                <span>Restore Default Brand Colors</span>
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleTogglePreview}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    isPreviewing
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'border border-[#173B75] text-[#173B75] hover:bg-[#EEF2F9]'
                  }`}
                >
                  {isPreviewing ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{isPreviewing ? 'Exit Live Preview' : 'Preview Theme'}</span>
                </button>

                <button
                  type="button"
                  onClick={onSaveDraft}
                  disabled={saving}
                  className="px-4 py-2 border border-[#173B75] text-[#173B75] hover:bg-[#EEF2F9] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  onClick={onPublishLive}
                  disabled={saving}
                  className="px-5 py-2 bg-[#F07822] hover:bg-[#d65805] text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{saving ? 'Publishing...' : 'Publish Theme'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: GLOBAL FOOTER BANNER ANIMATION (CRITICAL EXISTING FEATURE) */}
      <div className="bg-white rounded-3xl border border-[#E6E8ED] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('globalAnimation')}
          className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-[#EEF2F9]/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#173B75]/10 text-[#173B75] flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#173B75]">Global Footer Banner Animation</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#F07822]/15 text-[#F07822]">
                  Active: {normalizedAnim.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-[#252A34]/60">Single global dropdown controlling footer CTA animations on all 5 public pages.</p>
            </div>
          </div>
          {openSections.globalAnimation ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {openSections.globalAnimation && (
          <div className="p-6 pt-0 space-y-5 border-t border-[#E6E8ED]/60">
            <div className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E6E8ED] text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#173B75] font-bold">
                <Sparkles className="w-4 h-4 text-[#F07822]" />
                <span>Single Global Animation Controller:</span>
              </div>
              <p className="text-[#252A34]/80 leading-relaxed">
                Selecting an animation mode here applies immediately to every footer CTA banner across <strong>Homepage</strong>, <strong>Services</strong>, <strong>Portfolio</strong>, <strong>About Us</strong>, and <strong>Contact</strong>.
              </p>
            </div>

            {/* THE GLOBAL DROPDOWN */}
            <div className="space-y-2 max-w-md">
              <label className="block text-xs font-bold text-[#173B75] uppercase tracking-wider">
                Select Footer Banner Animation Mode
              </label>
              <select
                value={normalizedAnim}
                onChange={(e) => {
                  const val = e.target.value as 'static' | 'animated' | 'wavy' | 'gaming';
                  updateField('ctaAnimationType', val);
                  showToast(`Global footer animation set to "${val.toUpperCase()}". Publish to update live website!`);
                }}
                className="w-full px-4 py-3 rounded-xl border border-[#173B75] text-xs font-bold text-[#173B75] bg-[#EEF2F9] focus:outline-none focus:ring-2 focus:ring-[#F07822] cursor-pointer"
              >
                <option value="static">Static (Disables animation across all footer banners)</option>
                <option value="animated">Animated (White particles assembling toward CTA button)</option>
                <option value="wavy">Wavy (Flowing kinetic aurora ribbons & wave crests)</option>
                <option value="gaming">Gaming (Retro-cyber wireframe grid, laser scanlines & neon radar pulse)</option>
              </select>
            </div>

            {/* Mode Explanations & Visual Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className={`p-4 rounded-2xl border transition-all ${
                normalizedAnim === 'static' ? 'border-[#173B75] bg-[#EEF2F9] shadow-sm' : 'border-[#E6E8ED] bg-white'
              }`}>
                <div className="font-bold text-[#173B75] flex items-center justify-between mb-1">
                  <span>Static</span>
                  {normalizedAnim === 'static' && <span className="w-2 h-2 rounded-full bg-[#173B75]" />}
                </div>
                <p className="text-[11px] text-[#252A34]/70">
                  Clean, minimalist solid presentation. Disables canvas motion graphics across all 5 page footer banners.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border transition-all ${
                normalizedAnim === 'animated' ? 'border-[#173B75] bg-[#EEF2F9] shadow-sm' : 'border-[#E6E8ED] bg-white'
              }`}>
                <div className="font-bold text-[#173B75] flex items-center justify-between mb-1">
                  <span>Animated</span>
                  {normalizedAnim === 'animated' && <span className="w-2 h-2 rounded-full bg-[#F07822]" />}
                </div>
                <p className="text-[11px] text-[#252A34]/70">
                  Standard dynamic mode. Delicate white particles float, assemble around CTA, trigger subtle prominence, and scatter.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border transition-all ${
                normalizedAnim === 'wavy' ? 'border-[#173B75] bg-[#EEF2F9] shadow-sm' : 'border-[#E6E8ED] bg-white'
              }`}>
                <div className="font-bold text-[#173B75] flex items-center justify-between mb-1">
                  <span>Wavy</span>
                  {normalizedAnim === 'wavy' && <span className="w-2 h-2 rounded-full bg-[#2458A6]" />}
                </div>
                <p className="text-[11px] text-[#252A34]/70">
                  Kinetic flowing ribbons. Smooth sine-wave vectors undulating horizontally with warm orange and bright blue crests.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border transition-all ${
                normalizedAnim === 'gaming' ? 'border-[#173B75] bg-[#EEF2F9] shadow-sm' : 'border-[#E6E8ED] bg-white'
              }`}>
                <div className="font-bold text-[#173B75] flex items-center justify-between mb-1">
                  <span>Gaming</span>
                  {normalizedAnim === 'gaming' && <span className="w-2 h-2 rounded-full bg-[#F07822]" />}
                </div>
                <p className="text-[11px] text-[#252A34]/70">
                  Cyber retro wireframe ground plane, animated perspective depth, horizontal laser scanlines, and neon radar pulse rings.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: BRAND WORDMARK & STATEMENT */}
      <div className="bg-white rounded-3xl border border-[#E6E8ED] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('brand')}
          className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-[#EEF2F9]/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#173B75]/10 text-[#173B75] flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <h3 className="text-base font-bold text-[#173B75]">Brand Wordmark & Mission Statement</h3>
              <p className="text-xs text-[#252A34]/60">Logo text, subtitle descriptor, and brand mission summary.</p>
            </div>
          </div>
          {openSections.brand ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {openSections.brand && (
          <div className="p-6 pt-0 space-y-4 border-t border-[#E6E8ED]/60">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#173B75] uppercase tracking-wider mb-1.5">
                  Brand Name / Wordmark Text
                </label>
                <input
                  type="text"
                  value={siteContent.logoText || 'GOOD FOLK'}
                  onChange={e => updateField('logoText', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E8ED] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#173B75]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#173B75] uppercase tracking-wider mb-1.5">
                  Logo Subtitle / Descriptor
                </label>
                <input
                  type="text"
                  value={siteContent.logoSubtitle || 'SOLUTION'}
                  onChange={e => updateField('logoSubtitle', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E8ED] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#173B75]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#173B75] uppercase tracking-wider mb-1.5">
                Brand Summary Paragraph
              </label>
              <textarea
                rows={3}
                value={siteContent.footerDescription || ''}
                placeholder="We build brands that move businesses forward. Combining strategy, creative design, branding, and digital marketing to help ambitious businesses stand out and grow."
                onChange={e => updateField('footerDescription', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#E6E8ED] text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#173B75]/20"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Displayed directly beneath the logo in the left brand column of the footer.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: OFFICIAL CONTACT CHANNELS */}
      <div className="bg-white rounded-3xl border border-[#E6E8ED] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('contactChannels')}
          className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-[#EEF2F9]/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#173B75]/10 text-[#173B75] flex items-center justify-center font-bold">
              5
            </div>
            <div>
              <h3 className="text-base font-bold text-[#173B75]">Official Contact Channels</h3>
              <p className="text-xs text-[#252A34]/60">Public contact email, displayed phone string, and functional WhatsApp target.</p>
            </div>
          </div>
          {openSections.contactChannels ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {openSections.contactChannels && (
          <div className="p-6 pt-0 space-y-4 border-t border-[#E6E8ED]/60">
            <div className="p-4 bg-[#EEF2F9]/60 rounded-2xl border border-[#173B75]/10 text-xs flex items-start gap-3">
              <Info className="w-4 h-4 text-[#173B75] shrink-0 mt-0.5" />
              <div className="space-y-1 text-[#252A34]">
                <strong className="block text-[#173B75]">Direct Display vs Functional Routing</strong>
                <p>
                  As standardized across the agency, the phone text displays as <span className="font-mono font-bold text-[#173B75]">0000000</span> for aesthetic client privacy, while clicking immediately routes to the operational agency WhatsApp number (<span className="font-mono text-[#F07822]">9817961412</span>).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#173B75] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#F07822]" />
                  <span>Public Contact Email</span>
                </label>
                <input
                  type="email"
                  value={siteContent.contactEmail || ''}
                  onChange={e => updateField('contactEmail', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E8ED] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#173B75]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#173B75] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#F07822]" />
                  <span>Displayed Phone String</span>
                </label>
                <input
                  type="text"
                  value={siteContent.contactPhone || '0000000'}
                  onChange={e => updateField('contactPhone', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E8ED] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#173B75]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#173B75] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="text-[#25D366] font-bold">WA</span>
                  <span>Functional WhatsApp Target</span>
                </label>
                <input
                  type="text"
                  value={siteContent.functionalPhoneDestination || siteContent.contactWhatsapp || '919817961412'}
                  onChange={e => {
                    updateField('functionalPhoneDestination', e.target.value);
                    updateField('contactWhatsapp', e.target.value);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E8ED] text-xs font-mono text-[#F07822] font-bold focus:outline-none focus:ring-2 focus:ring-[#173B75]/20"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 6: SOCIAL & CONNECT COORDINATES */}
      <div className="bg-white rounded-3xl border border-[#E6E8ED] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('social')}
          className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-[#EEF2F9]/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#173B75]/10 text-[#173B75] flex items-center justify-center font-bold">
              6
            </div>
            <div>
              <h3 className="text-base font-bold text-[#173B75]">Social Coordinates & Navigation Columns</h3>
              <p className="text-xs text-[#252A34]/60">External social profile URLs and quick navigation columns.</p>
            </div>
          </div>
          {openSections.social ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {openSections.social && (
          <div className="p-6 pt-0 space-y-4 border-t border-[#E6E8ED]/60">
            <div>
              <label className="block text-xs font-bold text-[#173B75] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-[#F07822]" />
                <span>Official Instagram URL</span>
              </label>
              <input
                type="url"
                value={siteContent.contactInstagram || 'https://www.instagram.com/goodfolksolution/'}
                onChange={e => updateField('contactInstagram', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E6E8ED] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#173B75]/20"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Opens directly in a new tab when clicked by clients in the footer.
              </span>
            </div>

            <div className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E6E8ED] space-y-2 text-xs">
              <strong className="block text-[#173B75]">Structured Navigation Columns:</strong>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600">
                <div className="p-3 bg-white rounded-xl border border-[#E6E8ED]">
                  <span className="font-bold text-[#173B75] block mb-1">Explore Column</span>
                  <span>Home, About Us, Our Work, Contact, Let's Talk CTA.</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#E6E8ED]">
                  <span className="font-bold text-[#173B75] block mb-1">All 10 Services Column</span>
                  <span>Synchronized automatically with the 10 services managed in the Services Manager.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 7: COPYRIGHT, UPI DISCLOSURE & LEGAL */}
      <div className="bg-white rounded-3xl border border-[#E6E8ED] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('copyright')}
          className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-[#EEF2F9]/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#173B75]/10 text-[#173B75] flex items-center justify-center font-bold">
              7
            </div>
            <div>
              <h3 className="text-base font-bold text-[#173B75]">Copyright, UPI Notice & Bottom Bar</h3>
              <p className="text-xs text-[#252A34]/60">Legal policy links, copyright label, and UPI payment notice.</p>
            </div>
          </div>
          {openSections.copyright ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {openSections.copyright && (
          <div className="p-6 pt-0 space-y-4 border-t border-[#E6E8ED]/60">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#173B75] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#173B75]" />
                  <span>Copyright Notice</span>
                </label>
                <input
                  type="text"
                  value={siteContent.footerCopyright || '© 2026 Good Folk Solution. All rights reserved.'}
                  onChange={e => updateField('footerCopyright', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E8ED] text-xs focus:outline-none focus:ring-2 focus:ring-[#173B75]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#173B75] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#F07822]" />
                  <span>UPI Payment Notice</span>
                </label>
                <input
                  type="text"
                  value={siteContent.footerUpiNotice || 'Direct UPI: 9817961412@ibl'}
                  onChange={e => updateField('footerUpiNotice', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E8ED] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#173B75]/20"
                />
              </div>
            </div>

            <div className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E6E8ED] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#173B75]" />
                <span className="font-semibold text-[#173B75]">Legal Policy Pages:</span>
                <span className="text-slate-600">Privacy Policy (/privacy) & Terms & Conditions (/terms)</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Active in Bottom Bar
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
