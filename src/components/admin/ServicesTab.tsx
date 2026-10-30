import React, { useState, useEffect } from 'react';
import {
  ChevronDown, ChevronUp, Save, Eye, EyeOff, Upload, Trash2, Plus,
  Sparkles, Layers, Image as ImageIcon, Briefcase, Check, ArrowUp, ArrowDown,
  Edit, RefreshCw, CheckCircle2, Copy, ExternalLink, Film, Tag, X
} from 'lucide-react';
import type {
  CMSSiteContent,
  CMSServiceItem,
  PageBannerConfig,
  CMSServicesBanner,
  CMSServiceConcept
} from '../../types';
import { AssetUploadField } from './AssetUploadField';
import { SERVICES_DATA } from '../../data/services';
import { useSiteContent } from '../../context/SiteContentContext';

export const SERVICE_OPTIONS = [
  { id: 'branding', title: '01 · Branding & Packaging' },
  { id: 'creative', title: '02 · Creative Design' },
  { id: 'performance', title: '03 · Performance Marketing & Paid Media' },
  { id: 'video', title: '04 · Commercial Video & Motion' },
  { id: 'digital', title: '05 · Digital Marketing & Social Media Management' },
  { id: 'uiux', title: '06 · Website & UI/UX Design' },
  { id: 'ecommerce', title: '07 · E-Commerce Solutions' },
  { id: 'motion', title: '08 · Motion Graphics & 3D' },
  { id: 'print', title: '09 · Print & Production' },
  { id: 'presentation', title: '10 · Presentation & Pitch Decks' }
];

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
  const { serviceConcepts: contextConcepts, refreshContent } = useSiteContent();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    hero: true,
    creativeBanner: false,
    servicesList: false,
    conceptsManager: true, // Opened by default for immediate discoverability
    methodology: false,
    footerCta: false,
    visibility: false
  });

  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);

  // Concepts Manager State
  const [concepts, setConcepts] = useState<CMSServiceConcept[]>(contextConcepts || []);
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');
  const [editingConcept, setEditingConcept] = useState<CMSServiceConcept | null>(null);
  const [isCreatingConcept, setIsCreatingConcept] = useState<boolean>(false);
  const [conceptFormData, setConceptFormData] = useState<Partial<CMSServiceConcept>>({
    serviceId: 'branding',
    title: '',
    clientName: '',
    category: 'Brand Identity',
    tagline: '',
    description: '',
    image: '',
    videoUrl: '',
    deliverables: [],
    order: 1,
    published: true
  });
  const [deliverablesInput, setDeliverablesInput] = useState<string>('');
  const [savingConcept, setSavingConcept] = useState<boolean>(false);

  // Sync concepts when context updates
  useEffect(() => {
    if (contextConcepts && contextConcepts.length > 0) {
      setConcepts(contextConcepts);
    }
  }, [contextConcepts]);

  // Load concepts from REST API
  const loadConcepts = async () => {
    try {
      const res = await fetch('/api/admin/service-concepts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.serviceConcepts) {
          setConcepts(data.serviceConcepts);
        }
      }
    } catch (err) {
      console.warn('Failed to load service concepts:', err);
    }
  };

  useEffect(() => {
    loadConcepts();
  }, [token]);

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

  const dynamicServiceOptions = services.map((s, idx) => ({
    id: s.id,
    title: `${String(idx + 1).padStart(2, '0')} · ${s.title.replace(/^\d+[\.\-\s]+/, '')}`
  }));

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

  // Supporting Points Handlers (Bullet highlights below deliverables)
  const handleAddSupportingPoint = (serviceIndex: number) => {
    const targetService = services[serviceIndex];
    const currentHighlights = Array.isArray(targetService.keyHighlights) ? targetService.keyHighlights : [];
    const updatedHighlights = [...currentHighlights, 'New supporting point'];
    handleUpdateService(serviceIndex, { keyHighlights: updatedHighlights });
  };

  const handleUpdateSupportingPoint = (serviceIndex: number, pIdx: number, val: string) => {
    const targetService = services[serviceIndex];
    const currentHighlights = Array.isArray(targetService.keyHighlights) ? [...targetService.keyHighlights] : [];
    currentHighlights[pIdx] = val;
    handleUpdateService(serviceIndex, { keyHighlights: currentHighlights });
  };

  const handleDeleteSupportingPoint = (serviceIndex: number, pIdx: number) => {
    const targetService = services[serviceIndex];
    const currentHighlights = Array.isArray(targetService.keyHighlights) ? targetService.keyHighlights : [];
    const updatedHighlights = currentHighlights.filter((_, i) => i !== pIdx);
    handleUpdateService(serviceIndex, { keyHighlights: updatedHighlights });
  };

  const handleMoveSupportingPoint = (serviceIndex: number, pIdx: number, direction: 'up' | 'down') => {
    const targetService = services[serviceIndex];
    const currentHighlights = Array.isArray(targetService.keyHighlights) ? [...targetService.keyHighlights] : [];
    if (direction === 'up' && pIdx === 0) return;
    if (direction === 'down' && pIdx === currentHighlights.length - 1) return;
    const targetIdx = direction === 'up' ? pIdx - 1 : pIdx + 1;
    const temp = currentHighlights[pIdx];
    currentHighlights[pIdx] = currentHighlights[targetIdx];
    currentHighlights[targetIdx] = temp;
    handleUpdateService(serviceIndex, { keyHighlights: currentHighlights });
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

  // Concept Action Handlers
  const handleOpenCreateConcept = (preferredServiceId?: string) => {
    const sId = preferredServiceId || (selectedServiceFilter !== 'all' ? selectedServiceFilter : 'branding');
    const existing = concepts.filter(c => c.serviceId.toLowerCase() === sId.toLowerCase());
    setConceptFormData({
      serviceId: sId,
      title: '',
      clientName: '',
      category: 'Brand Identity',
      tagline: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80',
      videoUrl: '',
      deliverables: ['Custom Brand Mark', 'Guidelines Book', 'Packaging Specs'],
      order: existing.length + 1,
      published: true
    });
    setDeliverablesInput('Custom Brand Mark, Guidelines Book, Packaging Specs');
    setEditingConcept(null);
    setIsCreatingConcept(true);
  };

  const handleOpenEditConcept = (concept: CMSServiceConcept) => {
    setConceptFormData({ ...concept });
    setDeliverablesInput((concept.deliverables || []).join(', '));
    setEditingConcept(concept);
    setIsCreatingConcept(true);
  };

  const handleSaveConceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conceptFormData.title?.trim() || !conceptFormData.serviceId) {
      showToast('Please provide a concept title and select an associated service.', 'error');
      return;
    }
    setSavingConcept(true);
    try {
      const isEdit = Boolean(editingConcept?.id);
      const url = isEdit
        ? `/api/admin/service-concepts/${editingConcept!.id}`
        : '/api/admin/service-concepts';
      const method = isEdit ? 'PUT' : 'POST';

      const deliverables = deliverablesInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        ...conceptFormData,
        title: conceptFormData.title.trim(),
        clientName: conceptFormData.clientName?.trim() || '',
        category: conceptFormData.category?.trim() || 'Creative Concept',
        tagline: conceptFormData.tagline?.trim() || conceptFormData.description?.trim() || '',
        description: conceptFormData.description?.trim() || '',
        image: conceptFormData.image?.trim() || 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80',
        videoUrl: conceptFormData.videoUrl?.trim() || '',
        deliverables,
        order: Number(conceptFormData.order) || 1,
        published: conceptFormData.published !== false
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(isEdit ? 'Concept case study updated successfully!' : 'New concept case study created!', 'success');
        await loadConcepts();
        await refreshContent();
        setIsCreatingConcept(false);
        setEditingConcept(null);
      } else {
        throw new Error(data.error || 'Failed to save concept.');
      }
    } catch (err: any) {
      showToast(err.message || 'Error occurred while saving concept.', 'error');
    } finally {
      setSavingConcept(false);
    }
  };

  const handleDeleteConcept = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the concept "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/service-concepts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Deleted concept "${title}".`, 'success');
        await loadConcepts();
        await refreshContent();
      } else {
        throw new Error(data.error || 'Failed to delete concept.');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting concept.', 'error');
    }
  };

  const handleDuplicateConcept = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/service-concepts/${id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Concept duplicated successfully.', 'success');
        await loadConcepts();
        await refreshContent();
      } else {
        throw new Error(data.error || 'Failed to duplicate concept.');
      }
    } catch (err: any) {
      showToast(err.message || 'Error duplicating concept.', 'error');
    }
  };

  const handleToggleConceptPublish = async (concept: CMSServiceConcept) => {
    try {
      const newStatus = !concept.published;
      const res = await fetch(`/api/admin/service-concepts/${concept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ published: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Concept "${concept.title}" is now ${newStatus ? 'Live' : 'Draft'}.`, 'success');
        await loadConcepts();
        await refreshContent();
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating status.', 'error');
    }
  };

  const handleMoveConcept = async (concept: CMSServiceConcept, direction: 'up' | 'down') => {
    const list = concepts.filter(c => c.serviceId.toLowerCase() === concept.serviceId.toLowerCase());
    const idx = list.findIndex(c => c.id === concept.id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === list.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const target = list[targetIdx];

    const currentOrder = concept.order;
    const targetOrder = target.order;

    await fetch(`/api/admin/service-concepts/${concept.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ order: targetOrder })
    });
    await fetch(`/api/admin/service-concepts/${target.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ order: currentOrder })
    });

    await loadConcepts();
    await refreshContent();
    showToast('Concept order updated.', 'success');
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

      {/* SECTION 2: SERVICES PAGE BANNER */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('creativeBanner')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">2</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 2: Services Page Banner (Complete Artwork & Content)</h3>
              <p className="text-[11px] text-[#252A34]/70">Upload complete full-bleed banner artwork for desktop & mobile, manage overlay text, and set CTA destination</p>
            </div>
          </div>
          {openSections.creativeBanner ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.creativeBanner && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4D8C8]">
              <div>
                <span className="text-xs font-bold text-[#173B75] block">Services Page Banner Display Status</span>
                <span className="text-[11px] text-[#252A34]/60">Controls visibility of the mid-page banner on /services</span>
              </div>
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

            {/* Complete Banner Artwork Uploads */}
            <div className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[#173B75] flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#F07822]" />
                  <span>Complete Banner Artwork (Full Artwork Replacement)</span>
                </h4>
                <p className="text-[11px] text-[#252A34]/70 mt-0.5">
                  Uploading complete banner artwork replaces the default dark blue grid background, ambient glow, and decorative specimen cards with your finished design.
                </p>
              </div>

              <div className="space-y-4">
                <AssetUploadField
                  label="Desktop Complete Banner Artwork"
                  sectionName="Services Banner (Desktop Artwork)"
                  currentUrl={creativeBanner.desktopArtworkUrl}
                  onUpload={async (file) => {
                    const url = await uploadImageFile(file);
                    if (url) handleCreativeBannerChange({ desktopArtworkUrl: url });
                  }}
                  onClear={() => handleCreativeBannerChange({ desktopArtworkUrl: '' })}
                  recommendedDimensions="1920 × 640 px (Recommended)"
                  aspectRatio="3:1 / 16:5.3 Widescreen Banner"
                  supportedFormats="JPG, PNG, WebP"
                  maxFileSize="5 MB"
                  helpText="Full-bleed complete artwork rendered on desktop and laptop screens."
                />

                <AssetUploadField
                  label="Mobile Complete Banner Artwork"
                  sectionName="Services Banner (Mobile Artwork)"
                  currentUrl={creativeBanner.mobileArtworkUrl}
                  onUpload={async (file) => {
                    const url = await uploadImageFile(file);
                    if (url) handleCreativeBannerChange({ mobileArtworkUrl: url });
                  }}
                  onClear={() => handleCreativeBannerChange({ mobileArtworkUrl: '' })}
                  recommendedDimensions="800 × 800 px (Recommended)"
                  aspectRatio="1:1 Square / 4:5 Portrait"
                  supportedFormats="JPG, PNG, WebP"
                  maxFileSize="5 MB"
                  helpText="Optimized square or portrait artwork rendered on smartphones."
                />
              </div>

              {/* Text Duplication & Overlay Control */}
              <div className="pt-3 border-t border-[#E4D8C8]">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={creativeBanner.hideOverlayText === true}
                    onChange={(e) => handleCreativeBannerChange({ hideOverlayText: e.target.checked })}
                    className="w-4 h-4 text-[#F07822] rounded mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#173B75] block">Hide Overlaid Text & Badges</span>
                    <span className="text-[11px] text-[#252A34]/70 block">
                      Enable this if your uploaded artwork already includes its own embedded headline, copy, and badges to avoid duplicate overlaid text.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Banner Copy & CTA Settings */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-[#173B75] block">Banner Content & CTA (Rendered when text overlay is active)</span>
              
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

              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">CTA Destination</label>
                <input
                  type="text"
                  value={creativeBanner.ctaDestination || 'lets-talk'}
                  onChange={(e) => handleCreativeBannerChange({ ctaDestination: e.target.value })}
                  placeholder="lets-talk or /contact or #branding"
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            {/* Optional Inner Image (Fallback for default background) */}
            <div className="pt-2 border-t border-[#E4D8C8]">
              <AssetUploadField
                label="Inner Craft Image (Default Banner Layout Only)"
                sectionName="Services Creative Banner Inner Image"
                currentUrl={creativeBanner.imageUrl}
                focalPoint={creativeBanner.focalPoint}
                onFocalPointChange={(fp) => handleCreativeBannerChange({ focalPoint: fp })}
                onUpload={async (file) => {
                  const url = await uploadImageFile(file);
                  if (url) handleCreativeBannerChange({ imageUrl: url });
                }}
                onClear={() => handleCreativeBannerChange({ imageUrl: '' })}
                recommendedDimensions="1200 × 750 px (Recommended)"
                aspectRatio="16:10 Landscape"
                supportedFormats="PNG, JPG, WebP"
                maxFileSize="5 MB"
                helpText="Optional inner imagery used when complete banner artwork is not provided."
              />
            </div>
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
              <h3 className="text-sm font-bold text-[#173B75]">Section 3: Creative Services ({services.length} Total)</h3>
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
                    value={siteContent.servicesCapabilitiesHeading ?? 'Specialized Creative Services'}
                    onChange={(e) => onUpdateSiteContent({ ...siteContent, servicesCapabilitiesHeading: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#252A34]/70 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={siteContent.servicesCapabilitiesSubtitle ?? 'Explore our complete suite of specialized creative capabilities.'}
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
                          <span className="text-[10px] text-[#252A34]/60 font-mono">ID: #{service.id} · Deliverables: {service.deliverables.length} · Points: {(service.keyHighlights || []).length} · Listing: {service.listingImageDesktop ? 'Custom' : 'Default'} · Detail: {service.detailImageDesktop ? 'Custom' : 'Default'}</span>
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

                        {/* Supporting Points Manager (Bullet highlights below deliverables) */}
                        <div className="p-4 bg-white rounded-xl border border-[#E4D8C8] space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#173B75]" />
                                <span className="text-xs font-bold text-[#173B75]">
                                  Supporting Points (Public Bullet Highlights)
                                </span>
                                <span className="text-[10px] font-mono bg-[#EEF2F9] text-[#173B75] px-2 py-0.5 rounded-full font-bold">
                                  {(service.keyHighlights || []).length} { (service.keyHighlights || []).length === 1 ? 'Point' : 'Points' }
                                </span>
                              </div>
                              <p className="text-[11px] text-[#252A34]/65 mt-0.5">
                                Bullet points displayed directly below the Scope & Deliverables cards on the public Services page.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddSupportingPoint(idx)}
                              className="px-2.5 py-1 bg-[#EEF2F9] text-[#173B75] hover:bg-[#173B75] hover:text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Point</span>
                            </button>
                          </div>

                          {(!service.keyHighlights || service.keyHighlights.length === 0) ? (
                            <div className="p-3 text-center text-xs text-[#252A34]/50 border border-dashed border-[#E4D8C8] rounded-lg">
                              No supporting points added. Click &quot;Add Point&quot; to create one.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {service.keyHighlights.map((hl, hIdx) => (
                                <div key={hIdx} className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#173B75] shrink-0" />
                                  <input
                                    type="text"
                                    value={hl}
                                    onChange={(e) => handleUpdateSupportingPoint(idx, hIdx, e.target.value)}
                                    placeholder="Enter supporting point text..."
                                    className="flex-1 px-3 py-1.5 border border-[#E4D8C8] rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#173B75]"
                                  />
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveSupportingPoint(idx, hIdx, 'up')}
                                      disabled={hIdx === 0}
                                      title="Move point up"
                                      aria-label="Move point up"
                                      className="p-1 text-[#173B75] hover:bg-[#EEF2F9] rounded cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveSupportingPoint(idx, hIdx, 'down')}
                                      disabled={hIdx === service.keyHighlights.length - 1}
                                      title="Move point down"
                                      aria-label="Move point down"
                                      className="p-1 text-[#173B75] hover:bg-[#EEF2F9] rounded cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSupportingPoint(idx, hIdx)}
                                      title="Delete supporting point"
                                      aria-label="Delete supporting point"
                                      className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer ml-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* LOCATION 2: Services Listing Images (Creative Disciplines Swipeable Listing) */}
                        <div className="p-4 bg-white rounded-xl border border-[#E4D8C8] space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#173B75]" />
                            <h5 className="text-xs font-bold text-[#173B75]">
                              Services Listing Image (Creative Disciplines Carousel)
                            </h5>
                          </div>
                          <p className="text-[11px] text-[#252A34]/70">
                            Independent image uploads for the service card in the swipeable listing. Desktop container is 5-column (227 × 192 px); mobile container is single-column (343 × 176 px). Replacing or removing this image never modifies Homepage tile images or Individual Detail images.
                          </p>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                            {/* Desktop Listing Card Image */}
                            <AssetUploadField
                              label="Services Listing Image (Desktop)"
                              sectionName={`Services Listing #${idx + 1} (${service.title})`}
                              currentUrl={service.listingImageDesktop !== undefined ? service.listingImageDesktop : (service.image || '')}
                              onUpload={async (file) => {
                                const url = await uploadImageFile(file);
                                if (url) {
                                  handleUpdateService(idx, { listingImageDesktop: url });
                                  showToast(`Listing desktop image updated for ${service.title}`, 'success');
                                }
                              }}
                              onClear={() => {
                                handleUpdateService(idx, { listingImageDesktop: '' });
                                showToast(`Listing desktop image removed for ${service.title}`);
                              }}
                              recommendedDimensions="500 × 420 px (Recommended)"
                              aspectRatio="6:5 / 5:4 Compact Card"
                              supportedFormats="JPG, PNG, WebP"
                              maxFileSize="5 MB"
                              helpText="Exact dimensions calculated from the Services swipeable card container (227 × 192 px rendered). Rendered on laptops and desktop viewports."
                            />

                            {/* Mobile Listing Card Image */}
                            <AssetUploadField
                              label="Services Listing Image (Mobile Optional)"
                              sectionName={`Services Listing Mobile #${idx + 1} (${service.title})`}
                              currentUrl={service.listingImageMobile || ''}
                              onUpload={async (file) => {
                                const url = await uploadImageFile(file);
                                if (url) {
                                  handleUpdateService(idx, { listingImageMobile: url });
                                  showToast(`Listing mobile image updated for ${service.title}`, 'success');
                                }
                              }}
                              onClear={() => {
                                handleUpdateService(idx, { listingImageMobile: '' });
                                showToast(`Listing mobile image removed for ${service.title}`);
                              }}
                              recommendedDimensions="700 × 360 px (Recommended)"
                              aspectRatio="2:1 / 16:9 Widescreen"
                              supportedFormats="JPG, PNG, WebP"
                              maxFileSize="5 MB"
                              isOptional={true}
                              helpText="Exact dimensions calculated from the mobile card container (343 × 176 px rendered). If omitted, desktop listing image scales responsively."
                            />
                          </div>
                        </div>

                        {/* LOCATION 3: Individual Service Detail Image (Discipline Showcase Main Visual) */}
                        <div className="p-4 bg-white rounded-xl border border-[#E4D8C8] space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#F07822]" />
                            <h5 className="text-xs font-bold text-[#173B75]">
                              Individual Service Detail Image (Discipline Showcase Main Visual)
                            </h5>
                          </div>
                          <p className="text-[11px] text-[#252A34]/70">
                            Independent image uploads for the full-width in-depth discipline section and service detail modal. Desktop container is 6-column (584 × 460 px); mobile container is single-column (343 × 256 px). Replacing or removing this image never modifies Homepage tile images or Services listing images.
                          </p>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                            {/* Desktop Detail Main Visual */}
                            <AssetUploadField
                              label="Individual Service Detail Image (Desktop)"
                              sectionName={`Service Detail #${idx + 1} (${service.title})`}
                              currentUrl={service.detailImageDesktop !== undefined ? service.detailImageDesktop : (service.image || '')}
                              onUpload={async (file) => {
                                const url = await uploadImageFile(file);
                                if (url) {
                                  handleUpdateService(idx, { detailImageDesktop: url, image: url });
                                  showToast(`Detail desktop image updated for ${service.title}`, 'success');
                                }
                              }}
                              onClear={() => {
                                handleUpdateService(idx, { detailImageDesktop: '' });
                                showToast(`Detail desktop image removed for ${service.title}`);
                              }}
                              recommendedDimensions="1200 × 920 px (Recommended)"
                              aspectRatio="4:3 Large Landscape"
                              supportedFormats="JPG, PNG, WebP"
                              maxFileSize="10 MB"
                              helpText="Exact dimensions calculated from the in-depth service detail container (584 × 460 px rendered). Rendered on desktop viewports and in the detail modal."
                            />

                            {/* Mobile Detail Main Visual */}
                            <AssetUploadField
                              label="Individual Service Detail Image (Mobile Optional)"
                              sectionName={`Service Detail Mobile #${idx + 1} (${service.title})`}
                              currentUrl={service.detailImageMobile || ''}
                              onUpload={async (file) => {
                                const url = await uploadImageFile(file);
                                if (url) {
                                  handleUpdateService(idx, { detailImageMobile: url });
                                  showToast(`Detail mobile image updated for ${service.title}`, 'success');
                                }
                              }}
                              onClear={() => {
                                handleUpdateService(idx, { detailImageMobile: '' });
                                showToast(`Detail mobile image removed for ${service.title}`);
                              }}
                              recommendedDimensions="750 × 560 px (Recommended)"
                              aspectRatio="4:3 Responsive Visual"
                              supportedFormats="JPG, PNG, WebP"
                              maxFileSize="10 MB"
                              isOptional={true}
                              helpText="Exact dimensions calculated from the mobile detail container (343 × 256 px rendered). If omitted, desktop detail visual scales responsively."
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: RELEVANT CONCEPTS / CASE STUDIES MANAGER */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('conceptsManager')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">4</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 4: Relevant Concepts & Case Studies Manager ({concepts.length} Total)</h3>
              <p className="text-[11px] text-[#252A34]/70">Curate showcase case studies and concept mockups displayed under "View Relevant Concepts" on the public /services page</p>
            </div>
          </div>
          {openSections.conceptsManager ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.conceptsManager && (
          <div className="p-6 space-y-6">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4D8C8]">
              <div>
                <span className="text-xs font-bold text-[#173B75] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#F07822]" />
                  <span>Curated Service Concepts & Tactical Deliverables</span>
                </span>
                <p className="text-[11px] text-[#252A34]/70 mt-0.5">
                  Organized by service discipline. Each published concept appears when visitors click "View Relevant Concepts" on the public Services page.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenCreateConcept()}
                className="px-4 py-2.5 bg-[#F07822] hover:bg-[#d65805] text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Concept</span>
              </button>
            </div>

            {/* Discipline Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedServiceFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedServiceFilter === 'all'
                    ? 'bg-[#173B75] text-white shadow-xs'
                    : 'bg-[#F7F7F5] text-[#252A34]/80 hover:bg-[#EEF2F9] border border-[#E4D8C8]'
                }`}
              >
                <span>All Disciplines</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  selectedServiceFilter === 'all' ? 'bg-white/20 text-white' : 'bg-black/5 text-[#252A34]'
                }`}>
                  {concepts.length}
                </span>
              </button>

              {dynamicServiceOptions.map((srv) => {
                const count = concepts.filter(c => c.serviceId.toLowerCase() === srv.id.toLowerCase()).length;
                const isSelected = selectedServiceFilter === srv.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setSelectedServiceFilter(srv.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#173B75] text-white shadow-xs'
                        : 'bg-[#F7F7F5] text-[#252A34]/80 hover:bg-[#EEF2F9] border border-[#E4D8C8]'
                    }`}
                  >
                    <span>{srv.title.split('·')[1]?.trim() || srv.title}</span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                      isSelected ? 'bg-[#F07822] text-white' : 'bg-black/5 text-[#252A34]'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Concepts Grid / List */}
            {(() => {
              const filtered = selectedServiceFilter === 'all'
                ? concepts
                : concepts.filter(c => c.serviceId.toLowerCase() === selectedServiceFilter.toLowerCase());

              const sorted = [...filtered].sort((a, b) => (a.order || 0) - (b.order || 0));

              if (sorted.length === 0) {
                return (
                  <div className="p-8 text-center bg-[#F7F7F5] rounded-2xl border border-dashed border-[#E4D8C8] space-y-3">
                    <Sparkles className="w-8 h-8 text-[#F07822]/60 mx-auto" />
                    <div>
                      <h5 className="text-sm font-bold text-[#173B75]">No Concepts Added Yet</h5>
                      <p className="text-xs text-[#252A34]/70 mt-1 max-w-md mx-auto">
                        {selectedServiceFilter === 'all'
                          ? 'Add your first real concept or case study to display under the "View Relevant Concepts" button on /services.'
                          : `No concepts created yet for this discipline. Click the button below to add one.`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenCreateConcept(selectedServiceFilter !== 'all' ? selectedServiceFilter : 'branding')}
                      className="px-4 py-2 bg-[#173B75] hover:bg-[#123163] text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create First Concept</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sorted.map((concept) => {
                    const srv = dynamicServiceOptions.find(s => s.id.toLowerCase() === concept.serviceId.toLowerCase());
                    const serviceTitle = srv?.title || concept.serviceId;

                    return (
                      <div
                        key={concept.id}
                        className="bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
                      >
                        <div>
                          {/* Image Thumbnail with Overlay Badges */}
                          <div className="relative h-44 overflow-hidden bg-[#EEF2F9]">
                            <img
                              src={concept.image}
                              alt={concept.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80';
                              }}
                            />
                            {/* Service Discipline Badge */}
                            <div className="absolute top-2.5 left-2.5 bg-[#173B75]/95 text-white backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold shadow-xs">
                              {serviceTitle}
                            </div>
                            {/* Published / Draft Pill */}
                            <button
                              type="button"
                              onClick={() => handleToggleConceptPublish(concept)}
                              className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md text-[10px] font-bold backdrop-blur-md shadow-xs cursor-pointer transition-colors ${
                                concept.published
                                  ? 'bg-emerald-600/90 hover:bg-emerald-700 text-white'
                                  : 'bg-amber-600/90 hover:bg-amber-700 text-white'
                              }`}
                            >
                              {concept.published ? 'Live' : 'Draft'}
                            </button>
                            {/* Video Pill if present */}
                            {concept.videoUrl && (
                              <div className="absolute bottom-2.5 right-2.5 bg-black/80 text-white px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1">
                                <Film className="w-3 h-3 text-[#F07822]" />
                                <span>Video</span>
                              </div>
                            )}
                          </div>

                          {/* Body Content */}
                          <div className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-[#252A34]/70">
                              <span className="font-semibold text-[#F07822]">{concept.clientName || 'Studio Concept'}</span>
                              <span className="px-2 py-0.5 rounded bg-white border border-[#E4D8C8] text-[10px] font-mono">
                                {concept.category || 'Creative Concept'}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-[#173B75] leading-snug line-clamp-1">
                              {concept.title}
                            </h4>

                            <p className="text-xs text-[#252A34]/75 line-clamp-2 leading-relaxed">
                              {concept.description || concept.tagline}
                            </p>

                            {/* Deliverables tags */}
                            {concept.deliverables && concept.deliverables.length > 0 && (
                              <div className="pt-1 flex flex-wrap gap-1.5">
                                {concept.deliverables.slice(0, 3).map((d, dIdx) => (
                                  <span
                                    key={dIdx}
                                    className="px-2 py-0.5 bg-white rounded-md border border-[#E4D8C8] text-[10px] text-[#252A34]/80 flex items-center gap-1"
                                  >
                                    <Check className="w-2.5 h-2.5 text-[#F07822]" />
                                    <span>{d}</span>
                                  </span>
                                ))}
                                {concept.deliverables.length > 3 && (
                                  <span className="px-1.5 py-0.5 text-[10px] text-[#252A34]/60 font-semibold">
                                    +{concept.deliverables.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Footer Controls */}
                        <div className="px-4 py-3 bg-white border-t border-[#E4D8C8] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono text-[#252A34]/60 mr-1">
                              Order #{concept.order}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleMoveConcept(concept, 'up')}
                              className="p-1 hover:bg-[#EEF2F9] rounded text-[#173B75] transition-colors cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveConcept(concept, 'down')}
                              className="p-1 hover:bg-[#EEF2F9] rounded text-[#173B75] transition-colors cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDuplicateConcept(concept.id)}
                              className="p-1.5 hover:bg-[#EEF2F9] text-[#173B75] rounded-lg transition-colors cursor-pointer"
                              title="Duplicate Concept"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditConcept(concept)}
                              className="px-2.5 py-1.5 bg-[#173B75] hover:bg-[#123163] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteConcept(concept.id, concept.title)}
                              className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete Concept"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* MODAL: CREATE / EDIT CONCEPT */}
            {isCreatingConcept && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E4D8C8] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
                  {/* Modal Header */}
                  <div className="p-6 bg-[#FFF9F1] border-b border-[#E4D8C8] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">
                        <Sparkles className="w-4 h-4 text-[#F07822]" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-[#173B75]">
                          {editingConcept ? 'Edit Relevant Concept' : 'Add New Relevant Concept'}
                        </h4>
                        <p className="text-[11px] text-[#252A34]/70">
                          Configure case study details shown when visitors click "View Relevant Concepts" on /services.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingConcept(false);
                        setEditingConcept(null);
                      }}
                      className="p-2 text-[#252A34]/60 hover:text-[#173B75] rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Form */}
                  <form onSubmit={handleSaveConceptSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-[#173B75] mb-1">
                          Concept Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Minimalist Skincare Visual Identity & Dielines"
                          value={conceptFormData.title || ''}
                          onChange={(e) => setConceptFormData({ ...conceptFormData, title: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#173B75] mb-1">
                          Associated Service Discipline <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={conceptFormData.serviceId || 'branding'}
                          onChange={(e) => setConceptFormData({ ...conceptFormData, serviceId: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                        >
                          {dynamicServiceOptions.map((srv) => (
                            <option key={srv.id} value={srv.id}>
                              {srv.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#173B75] mb-1">
                          Client / Brand Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Lumina Organics or Goodfolk Craft Lab"
                          value={conceptFormData.clientName || ''}
                          onChange={(e) => setConceptFormData({ ...conceptFormData, clientName: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#173B75] mb-1">
                          Category / Badge
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Brand Identity, Packaging Dieline, Motion Ad"
                          value={conceptFormData.category || ''}
                          onChange={(e) => setConceptFormData({ ...conceptFormData, category: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#173B75] mb-1">
                          Display Order
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={conceptFormData.order || 1}
                          onChange={(e) => setConceptFormData({ ...conceptFormData, order: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#173B75] mb-1">
                        Short Description / Tagline
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Brief summary of creative objectives, materials, or strategic commercial impact..."
                        value={conceptFormData.description || ''}
                        onChange={(e) => setConceptFormData({ ...conceptFormData, description: e.target.value, tagline: e.target.value })}
                        className="w-full px-3.5 py-2 border border-[#E4D8C8] rounded-xl text-xs focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                      />
                    </div>

                    {/* Media Upload */}
                    <div className="p-4 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-4">
                      <AssetUploadField
                        label="Concept Showcase Image"
                        sectionName="Service Concept Showcase Image"
                        currentUrl={conceptFormData.image}
                        onUpload={async (file) => {
                          const url = await uploadImageFile(file);
                          if (url) setConceptFormData({ ...conceptFormData, image: url });
                        }}
                        onClear={() => setConceptFormData({ ...conceptFormData, image: '' })}
                        recommendedDimensions="1200 × 800 px (Recommended)"
                        aspectRatio="3:2 / 16:10 Landscape"
                        supportedFormats="JPG, PNG, WebP"
                        maxFileSize="5 MB"
                        helpText="Primary card visual rendered in the concept showcase grid."
                      />

                      <div>
                        <label className="block text-xs font-bold text-[#173B75] mb-1">
                          Optional Video Showcase URL (MP4 / WebM / Embed)
                        </label>
                        <input
                          type="text"
                          placeholder="https://example.com/concept-motion.mp4"
                          value={conceptFormData.videoUrl || ''}
                          onChange={(e) => setConceptFormData({ ...conceptFormData, videoUrl: e.target.value })}
                          className="w-full px-3.5 py-2 border border-[#E4D8C8] rounded-xl text-xs font-mono bg-white focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Deliverables List (Comma-Separated) */}
                    <div>
                      <label className="block text-xs font-bold text-[#173B75] mb-1">
                        Scope & Deliverables (Comma-separated list)
                      </label>
                      <input
                        type="text"
                        placeholder="Logo Suite, Brand Guidelines, Retail Dielines, FSC Packaging Spec"
                        value={deliverablesInput}
                        onChange={(e) => setDeliverablesInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                      />
                      <div className="pt-2 flex flex-wrap gap-1.5">
                        {deliverablesInput
                          .split(',')
                          .map(s => s.trim())
                          .filter(Boolean)
                          .map((item, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-[#EEF2F9] text-[#173B75] text-[10px] font-semibold flex items-center gap-1 border border-[#173B75]/15"
                            >
                              <Check className="w-2.5 h-2.5 text-[#F07822]" />
                              <span>{item}</span>
                            </span>
                          ))}
                      </div>
                    </div>

                    {/* Published Toggle */}
                    <div className="pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={conceptFormData.published !== false}
                          onChange={(e) => setConceptFormData({ ...conceptFormData, published: e.target.checked })}
                          className="w-4 h-4 text-[#F07822] rounded"
                        />
                        <span className="text-xs font-bold text-[#173B75]">
                          Publish this concept live on the public Services page
                        </span>
                      </label>
                    </div>

                    {/* Modal Actions */}
                    <div className="pt-4 border-t border-[#E4D8C8] flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingConcept(false);
                          setEditingConcept(null);
                        }}
                        className="px-4 py-2 rounded-xl border border-[#E4D8C8] text-xs font-bold text-[#252A34] hover:bg-black/5 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingConcept}
                        className="px-5 py-2 rounded-xl bg-[#F07822] hover:bg-[#d65805] text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {savingConcept ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>{editingConcept ? 'Update Concept' : 'Create Concept'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 5: FROM BRIEF TO DELIVERY METHODOLOGY */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('methodology')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">5</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 5: Four-Step Collaboration Methodology</h3>
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

      {/* SECTION 6: FOOTER CTA BANNER */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('footerCta')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">6</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 6: Services Footer CTA Banner</h3>
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

      {/* SECTION 7: SECTION VISIBILITY TOGGLES */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('visibility')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">7</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 7: Services Page Section Visibility Toggles</h3>
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
