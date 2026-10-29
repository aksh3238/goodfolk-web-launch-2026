import React, { useState } from 'react';
import {
  ChevronDown, ChevronUp, Save, Eye, EyeOff, Upload, Trash2, Plus,
  Sparkles, Layers, Image as ImageIcon, ArrowUp, ArrowDown, Edit,
  RefreshCw, CheckCircle2, Tag, Video as VideoIcon, X, Star, Check,
  Palette, RotateCcw
} from 'lucide-react';
import type {
  CMSSiteContent,
  CMSPortfolioItem,
  PageBannerConfig,
  PortfolioMediaItem,
  PortfolioColorSwatch
} from '../../types';
import { AssetUploadField } from './AssetUploadField';
import { PORTFOLIO_ITEMS, PORTFOLIO_CATEGORIES } from '../../data/portfolio';

export interface PortfolioTabProps {
  token: string;
  siteContent: CMSSiteContent;
  onUpdateSiteContent: (updated: CMSSiteContent) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  uploadImageFile: (file: File) => Promise<string | null>;
  portfolioProjects: CMSPortfolioItem[];
  setPortfolioProjects: React.Dispatch<React.SetStateAction<CMSPortfolioItem[]>>;
  onSaveDraft: () => Promise<void>;
  onPublishLive: () => Promise<void>;
  saving: boolean;
}

export const PortfolioTab: React.FC<PortfolioTabProps> = ({
  token,
  siteContent,
  onUpdateSiteContent,
  showToast,
  uploadImageFile,
  portfolioProjects,
  setPortfolioProjects,
  onSaveDraft,
  onPublishLive,
  saving
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    hero: true,
    categories: false,
    projects: true,
    footerCta: false,
    visibility: false
  });

  const [editingProject, setEditingProject] = useState<CMSPortfolioItem | null>(null);
  const [isNewProject, setIsNewProject] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('All');
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [newGalleryUrlInput, setNewGalleryUrlInput] = useState('');
  const [newDeliverableInput, setNewDeliverableInput] = useState('');

  const handleBatchGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !editingProject) return;
    setGalleryUploading(true);
    showToast(`Uploading ${files.length} project image(s)...`);
    const currentGallery = editingProject.gallery || [];
    const newItems: PortfolioMediaItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const url = await uploadImageFile(file);
        if (url) {
          newItems.push({
            id: `media-${Date.now()}-${i}`,
            type: 'image',
            url,
            title: file.name.replace(/\.[^/.]+$/, ''),
            caption: `${editingProject.title} — Asset View ${currentGallery.length + newItems.length + 1}`,
            altText: `${editingProject.title} detail`,
            order: currentGallery.length + newItems.length + 1
          });
        }
      } catch (err) {
        console.error('Failed to upload file', file.name, err);
      }
    }

    const updatedGallery = [...currentGallery, ...newItems];
    const updatedProject = {
      ...editingProject,
      gallery: updatedGallery,
      image: editingProject.image || (newItems[0]?.url || '')
    };
    setEditingProject(updatedProject);
    setGalleryUploading(false);
    showToast(`${newItems.length} image(s) added to gallery!`, 'success');
  };

  const handleRemoveGalleryItem = (gIdx: number) => {
    if (!editingProject) return;
    const currentGallery = editingProject.gallery || [];
    const updated = currentGallery.filter((_, i) => i !== gIdx);
    setEditingProject({ ...editingProject, gallery: updated });
  };

  const handleMoveGalleryItem = (gIdx: number, dir: 'up' | 'down') => {
    if (!editingProject) return;
    const currentGallery = [...(editingProject.gallery || [])];
    if ((dir === 'up' && gIdx === 0) || (dir === 'down' && gIdx === currentGallery.length - 1)) return;
    const targetIdx = dir === 'up' ? gIdx - 1 : gIdx + 1;
    const temp = currentGallery[gIdx];
    currentGallery[gIdx] = currentGallery[targetIdx];
    currentGallery[targetIdx] = temp;
    setEditingProject({ ...editingProject, gallery: currentGallery });
  };

  const handleSetGalleryAsCover = (url: string) => {
    if (!editingProject) return;
    setEditingProject({ ...editingProject, image: url });
    showToast('Cover image updated!', 'success');
  };

  const handleUpdateGalleryItemCaption = (gIdx: number, caption: string) => {
    if (!editingProject) return;
    const currentGallery = [...(editingProject.gallery || [])];
    currentGallery[gIdx] = { ...currentGallery[gIdx], caption };
    setEditingProject({ ...editingProject, gallery: currentGallery });
  };

  const handleAddGalleryUrl = () => {
    if (!editingProject || !newGalleryUrlInput.trim()) return;
    const currentGallery = editingProject.gallery || [];
    const newItem: PortfolioMediaItem = {
      id: `media-${Date.now()}`,
      type: 'image',
      url: newGalleryUrlInput.trim(),
      caption: `${editingProject.title} — Detail View ${currentGallery.length + 1}`,
      altText: editingProject.title,
      order: currentGallery.length + 1
    };
    setEditingProject({
      ...editingProject,
      gallery: [...currentGallery, newItem],
      image: editingProject.image || newItem.url
    });
    setNewGalleryUrlInput('');
    showToast('Image URL added to gallery');
  };

  // Color Swatches Manager handlers
  const handleAddColorSwatch = () => {
    if (!editingProject) return;
    const currentSwatches = editingProject.paletteSwatches || [];
    const newSwatch: PortfolioColorSwatch = {
      id: `swatch-${Date.now()}`,
      name: `Color Token 0${currentSwatches.length + 1}`,
      hex: '#F07822'
    };
    const updatedSwatches = [...currentSwatches, newSwatch];
    setEditingProject({
      ...editingProject,
      paletteSwatches: updatedSwatches,
      colorPalette: updatedSwatches.map(s => s.hex)
    });
  };

  const handleUpdateColorSwatch = (sIdx: number, updates: Partial<PortfolioColorSwatch>) => {
    if (!editingProject) return;
    const currentSwatches = [...(editingProject.paletteSwatches || [])];
    currentSwatches[sIdx] = { ...currentSwatches[sIdx], ...updates };
    setEditingProject({
      ...editingProject,
      paletteSwatches: currentSwatches,
      colorPalette: currentSwatches.map(s => s.hex)
    });
  };

  const handleMoveColorSwatch = (sIdx: number, dir: 'up' | 'down') => {
    if (!editingProject) return;
    const currentSwatches = [...(editingProject.paletteSwatches || [])];
    if ((dir === 'up' && sIdx === 0) || (dir === 'down' && sIdx === currentSwatches.length - 1)) return;
    const targetIdx = dir === 'up' ? sIdx - 1 : sIdx + 1;
    const temp = currentSwatches[sIdx];
    currentSwatches[sIdx] = currentSwatches[targetIdx];
    currentSwatches[targetIdx] = temp;
    setEditingProject({
      ...editingProject,
      paletteSwatches: currentSwatches,
      colorPalette: currentSwatches.map(s => s.hex)
    });
  };

  const handleDeleteColorSwatch = (sIdx: number) => {
    if (!editingProject) return;
    const currentSwatches = (editingProject.paletteSwatches || []).filter((_, i) => i !== sIdx);
    setEditingProject({
      ...editingProject,
      paletteSwatches: currentSwatches,
      colorPalette: currentSwatches.map(s => s.hex)
    });
  };

  // Deliverables Manager handlers
  const handleAddDeliverable = () => {
    if (!editingProject || !newDeliverableInput.trim()) return;
    const currentDeliverables = editingProject.deliverables || [];
    setEditingProject({
      ...editingProject,
      deliverables: [...currentDeliverables, newDeliverableInput.trim()]
    });
    setNewDeliverableInput('');
  };

  const handleUpdateDeliverable = (dIdx: number, val: string) => {
    if (!editingProject) return;
    const currentDeliverables = [...(editingProject.deliverables || [])];
    currentDeliverables[dIdx] = val;
    setEditingProject({
      ...editingProject,
      deliverables: currentDeliverables
    });
  };

  const handleMoveDeliverable = (dIdx: number, dir: 'up' | 'down') => {
    if (!editingProject) return;
    const currentDeliverables = [...(editingProject.deliverables || [])];
    if ((dir === 'up' && dIdx === 0) || (dir === 'down' && dIdx === currentDeliverables.length - 1)) return;
    const targetIdx = dir === 'up' ? dIdx - 1 : dIdx + 1;
    const temp = currentDeliverables[dIdx];
    currentDeliverables[dIdx] = currentDeliverables[targetIdx];
    currentDeliverables[targetIdx] = temp;
    setEditingProject({
      ...editingProject,
      deliverables: currentDeliverables
    });
  };

  const handleDeleteDeliverable = (dIdx: number) => {
    if (!editingProject) return;
    const currentDeliverables = (editingProject.deliverables || []).filter((_, i) => i !== dIdx);
    setEditingProject({
      ...editingProject,
      deliverables: currentDeliverables
    });
  };

  const handleRestoreCaseStudyDefaults = () => {
    if (!editingProject) return;
    setEditingProject({
      ...editingProject,
      strategyHeading: 'Brand Strategy & Commercial Problem',
      executionHeading: 'Visual Architecture & Creative Execution',
      paletteHeading: 'Color Palette & Identity Tokens',
      paletteSubtitle: 'Approved tonal hierarchy engineered for print dielines and high-contrast digital displays.',
      deliverablesHeading: 'Deliverables & Master Assets Produced',
      ctaPrompt: 'Looking for a complete branding case study or packaging suite tailored to your business?',
      ctaText: 'Discuss Scope Like This'
    });
    showToast('Default case study headings restored.');
  };

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const currentBanner: PageBannerConfig = siteContent.pageBanners?.portfolio || {
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
        portfolio: {
          ...currentBanner,
          ...updates
        }
      }
    });
  };

  // Categories
  const categories: string[] = (siteContent.portfolioCategories && siteContent.portfolioCategories.length > 0)
    ? siteContent.portfolioCategories
    : ['All', 'Branding', 'Packaging', 'Creative Design', 'E-commerce', 'Performance Marketing', 'Video & Social'];

  const handleAddCategory = () => {
    if (!newCategoryInput.trim()) return;
    const clean = newCategoryInput.trim();
    if (!categories.includes(clean)) {
      const updated = [...categories, clean];
      onUpdateSiteContent({
        ...siteContent,
        portfolioCategories: updated
      });
      fetch('/api/admin/content/portfolio/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category: clean })
      }).catch(console.error);
      showToast(`Category "${clean}" added!`);
    }
    setNewCategoryInput('');
  };

  const handleDeleteCategory = (cat: string) => {
    if (cat === 'All') return;
    const updated = categories.filter(c => c !== cat);
    onUpdateSiteContent({
      ...siteContent,
      portfolioCategories: updated
    });
    showToast(`Category "${cat}" removed.`);
  };

  // Projects CRUD
  const initialProjects: CMSPortfolioItem[] = (portfolioProjects && portfolioProjects.length > 0)
    ? portfolioProjects
    : PORTFOLIO_ITEMS.map((item, idx) => ({
        id: item.id,
        title: item.title,
        category: item.category as string,
        tagline: item.tagline,
        image: item.image,
        gallery: item.gallery || [],
        videoUrl: item.videoUrl,
        videoPoster: item.videoPoster,
        clientName: item.clientName,
        projectYear: item.projectYear,
        isConcept: item.isConcept || false,
        brief: item.brief || '',
        approach: item.approach || '',
        deliverables: item.deliverables || [],
        specs: item.specs || { format: 'Vector AI + 3D Render', timeline: '2-4 Weeks', tools: 'Figma, Illustrator' },
        tags: item.associatedServices || [],
        order: idx + 1,
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

  const projectsList = portfolioProjects && portfolioProjects.length > 0 ? portfolioProjects : initialProjects;

  const handleOpenAddProject = () => {
    setEditingProject({
      id: `prj-${Date.now()}`,
      title: 'New Case Study Project',
      category: PORTFOLIO_CATEGORIES[0] || 'Packaging',
      tagline: 'Brand Direction, Visual Identity & Packaging',
      image: '',
      gallery: [],
      clientName: 'Client Brand Name',
      projectYear: '2026',
      isConcept: false,
      brief: 'Project objectives and brand challenge summary.',
      approach: 'Strategic creative execution, visual system, and packaging dielines.',
      strategyHeading: 'Brand Strategy & Commercial Problem',
      strategyDescription: 'Target audience analysis, market positioning, and distinctive creative direction designed to elevate shelf presence and organic brand recall.',
      executionHeading: 'Visual Architecture & Creative Execution',
      executionDescription: 'Bespoke typographic rhythm, custom vector icons, packaging dieline engineering, and cohesive cross-platform visual systems.',
      paletteHeading: 'Color Palette & Identity Tokens',
      paletteSubtitle: 'Approved tonal hierarchy engineered for print dielines and high-contrast digital displays.',
      paletteSwatches: [
        { id: 'swatch-1', name: 'Primary Navy', hex: '#173B75' },
        { id: 'swatch-2', name: 'Soft Cream', hex: '#FFF9F1' },
        { id: 'swatch-3', name: 'Bright Blue', hex: '#2458A6' },
        { id: 'swatch-4', name: 'Charcoal Noir', hex: '#252A34' },
        { id: 'swatch-5', name: 'Vibrant Orange', hex: '#F07822' }
      ],
      colorPalette: ['#173B75', '#FFF9F1', '#2458A6', '#252A34', '#F07822'],
      deliverablesHeading: 'Deliverables & Master Assets Produced',
      deliverables: [
        'Comprehensive Logo Suite',
        'Dropper Bottle & Jar Packaging',
        'Unboxing Experience & Tissue Paper',
        'Digital Brand Guidelines (42-page PDF)',
        'Retail Display Counter Visuals'
      ],
      specs: { format: 'Vector Master, Dielines, MP4 Reels', timeline: '3–4 Weeks Collaborative Sprints', tools: 'Illustrator, Figma, Premiere Pro, After Effects' },
      ctaPrompt: 'Looking for a complete branding case study or packaging suite tailored to your business?',
      ctaText: 'Discuss Scope Like This',
      tags: ['Branding & Packaging'],
      order: projectsList.length + 1,
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsNewProject(true);
  };

  const handleSaveEditingProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editingProject.title) {
      showToast('Project title is required', 'error');
      return;
    }

    try {
      if (isNewProject) {
        const res = await fetch('/api/admin/content/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(editingProject)
        });
        const data = await res.json();
        if (data.success && data.project) {
          setPortfolioProjects([...projectsList, data.project]);
          showToast(`Case study "${data.project.title}" created successfully!`);
        } else {
          setPortfolioProjects([...projectsList, editingProject]);
          showToast(`Case study "${editingProject.title}" saved!`);
        }
      } else {
        await fetch(`/api/admin/content/portfolio/${editingProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(editingProject)
        });
        setPortfolioProjects(projectsList.map(p => p.id === editingProject.id ? editingProject : p));
        showToast(`Case study "${editingProject.title}" updated successfully!`);
      }
      setEditingProject(null);
    } catch (err: any) {
      showToast(err.message || 'Error saving project', 'error');
    }
  };

  const handleDeleteProject = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await fetch(`/api/admin/content/portfolio/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setPortfolioProjects(projectsList.filter(p => p.id !== id));
      showToast(`Case study "${title}" removed.`);
    } catch (err) {
      showToast('Failed to delete project', 'error');
    }
  };

  const handleReorderProject = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= projectsList.length) return;
    const reordered = [...projectsList];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setPortfolioProjects(reordered);

    fetch('/api/admin/content/portfolio/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderedIds: reordered.map(p => p.id) })
    }).catch(console.error);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#E4D8C8] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#173B75]" />
            <h2 className="text-xl font-black text-[#173B75]">Portfolio Page Manager</h2>
            <span className="text-xs bg-[#E8EFF8] text-[#173B75] px-2.5 py-0.5 rounded-full font-bold">Public Route: /portfolio</span>
          </div>
          <p className="text-xs text-[#252A34]/70 mt-1">
            Manage all case studies, project galleries, video reels, category filters, and editorial showcase artwork with side-by-side dimension requirements.
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
              <p className="text-[11px] text-[#252A34]/70">Portfolio badge, headline, subheadline and optional custom graphic hero banner</p>
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
                  value={siteContent.portfolioBadge || 'Visual Direction & Craft'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, portfolioBadge: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#173B75] mb-1">Main Headline</label>
                <input
                  type="text"
                  value={siteContent.portfolioHeadline || 'Selected Work'}
                  onChange={(e) => onUpdateSiteContent({ ...siteContent, portfolioHeadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#173B75] mb-1">Introduction Paragraph</label>
              <textarea
                rows={3}
                value={siteContent.portfolioSubheadline || 'Explore strategic creative concepts across packaging dielines, brand identities, e-commerce storefronts, and conversion marketing.'}
                onChange={(e) => onUpdateSiteContent({ ...siteContent, portfolioSubheadline: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#E4D8C8] rounded-xl text-xs focus:ring-2 focus:ring-[#173B75] focus:outline-none"
              />
            </div>

            {/* Custom Banner Artwork Box */}
            <div className="pt-4 border-t border-[#E4D8C8] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#173B75]">Portfolio Custom Graphic Banner (Optional)</h4>
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
                  label="Desktop Portfolio Hero Artwork"
                  sectionName="Portfolio Hero (Desktop)"
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
                  helpText="Hero header banner displayed to desktop and tablet visitors on /portfolio."
                />

                <AssetUploadField
                  label="Mobile Portfolio Hero Artwork"
                  sectionName="Portfolio Hero (Mobile)"
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

      {/* SECTION 2: CATEGORY FILTERS */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('categories')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">2</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 2: Category Filter Bar ({categories.length} Categories)</h3>
              <p className="text-[11px] text-[#252A34]/70">Add and remove categories that organize case studies on the public portfolio</p>
            </div>
          </div>
          {openSections.categories ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.categories && (
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="px-3.5 py-1.5 rounded-full bg-[#F7F7F5] border border-[#E4D8C8] text-xs font-semibold text-[#173B75] flex items-center gap-2"
                >
                  <span>{cat}</span>
                  {cat !== 'All' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="text-[#252A34]/40 hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Enter new category name (e.g. 3D Animation, FMCG Packaging)..."
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="flex-1 px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs bg-white"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2 bg-[#173B75] text-white text-xs font-bold rounded-xl hover:bg-[#123163] cursor-pointer"
              >
                Add Category
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: CASE STUDIES & PROJECTS LIST */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('projects')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">3</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 3: Portfolio Case Studies ({projectsList.length} Total)</h3>
              <p className="text-[11px] text-[#252A34]/70">Add, edit, reorder, and manage case study visual assets, gallery images and video reels</p>
            </div>
          </div>
          {openSections.projects ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.projects && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4D8C8]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#173B75]">Filter by Category:</span>
                <select
                  value={selectedFilterCategory}
                  onChange={(e) => setSelectedFilterCategory(e.target.value)}
                  className="px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                >
                  <option value="All">All Categories</option>
                  {PORTFOLIO_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {/* Safely handle filtering for any legacy or custom category outside standard 9 */}
                  {projectsList
                    .map(p => p.category)
                    .filter(c => c && !PORTFOLIO_CATEGORIES.includes(c) && c !== 'All')
                    .filter((c, idx, arr) => arr.indexOf(c) === idx)
                    .map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleOpenAddProject}
                className="px-4 py-2 bg-[#F07822] hover:bg-[#d65805] text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Case Study</span>
              </button>
            </div>

            <div className="space-y-4">
              {projectsList
                .filter(p => selectedFilterCategory === 'All' || p.category === selectedFilterCategory)
                .map((project, idx) => (
                  <div
                    key={project.id || idx}
                    className="p-5 rounded-2xl bg-[#F7F7F5] border border-[#E4D8C8] flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      {project.image ? (
                        <img
                          src={project.image}
                          alt={project.title}
                          className="w-20 h-16 rounded-xl object-cover border border-[#E4D8C8] shrink-0 bg-white"
                        />
                      ) : (
                        <div className="w-20 h-16 rounded-xl bg-[#173B75]/10 text-[#173B75] flex items-center justify-center shrink-0">
                          <ImageIcon className="w-6 h-6 text-[#F07822]" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#173B75] text-white">
                            {project.category}
                          </span>
                          <span className="text-[10px] text-[#252A34]/60 font-mono">
                            Client: {project.clientName || 'Confidential'} · Year: {project.projectYear || '2026'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#173B75]">{project.title}</h4>
                        <p className="text-xs text-[#252A34]/75 line-clamp-1">{project.tagline}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleReorderProject(idx, 'up')}
                          className="p-1.5 bg-white border border-[#E4D8C8] hover:bg-[#EEF2F9] rounded-lg disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5 text-[#173B75]" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === projectsList.length - 1}
                          onClick={() => handleReorderProject(idx, 'down')}
                          className="p-1.5 bg-white border border-[#E4D8C8] hover:bg-[#EEF2F9] rounded-lg disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5 text-[#173B75]" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const currentSwatches = (project.paletteSwatches && project.paletteSwatches.length > 0)
                            ? project.paletteSwatches
                            : (project.colorPalette && project.colorPalette.length > 0)
                                ? project.colorPalette.map((hex, i) => ({ id: `swatch-${i}`, name: `Token 0${i + 1}`, hex }))
                                : [
                                    { id: 'swatch-1', name: 'Primary Navy', hex: '#173B75' },
                                    { id: 'swatch-2', name: 'Soft Cream', hex: '#FFF9F1' },
                                    { id: 'swatch-3', name: 'Bright Blue', hex: '#2458A6' },
                                    { id: 'swatch-4', name: 'Charcoal Noir', hex: '#252A34' },
                                    { id: 'swatch-5', name: 'Vibrant Orange', hex: '#F07822' }
                                  ];

                          const currentDeliverables = (project.deliverables && project.deliverables.length > 0)
                            ? project.deliverables
                            : [
                                'Comprehensive Logo Suite',
                                'Dropper Bottle & Jar Packaging',
                                'Unboxing Experience & Tissue Paper',
                                'Digital Brand Guidelines (42-page PDF)',
                                'Retail Display Counter Visuals'
                              ];

                          setEditingProject({
                            ...project,
                            strategyHeading: project.strategyHeading || 'Brand Strategy & Commercial Problem',
                            strategyDescription: project.strategyDescription || project.brief || '',
                            executionHeading: project.executionHeading || 'Visual Architecture & Creative Execution',
                            executionDescription: project.executionDescription || project.approach || '',
                            paletteHeading: project.paletteHeading || 'Color Palette & Identity Tokens',
                            paletteSubtitle: project.paletteSubtitle || 'Approved tonal hierarchy engineered for print dielines and high-contrast digital displays.',
                            paletteSwatches: currentSwatches,
                            colorPalette: currentSwatches.map(s => s.hex),
                            deliverablesHeading: project.deliverablesHeading || 'Deliverables & Master Assets Produced',
                            deliverables: currentDeliverables,
                            specs: project.specs || {
                              format: 'Vector Master, Dielines, MP4 Reels',
                              timeline: '3–4 Weeks Collaborative Sprints',
                              tools: 'Illustrator, Figma, Premiere Pro, After Effects'
                            },
                            ctaPrompt: project.ctaPrompt || 'Looking for a complete branding case study or packaging suite tailored to your business?',
                            ctaText: project.ctaText || 'Discuss Scope Like This'
                          });
                          setIsNewProject(false);
                        }}
                        className="px-3 py-1.5 bg-[#173B75] text-white text-xs font-bold rounded-lg hover:bg-[#123163] flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#F07822]" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProject(project.id, project.title)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: EDIT / ADD CASE STUDY */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E4D8C8]">
            <div className="flex items-center justify-between border-b border-[#E4D8C8] pb-4">
              <div>
                <h3 className="text-lg font-black text-[#173B75]">
                  {isNewProject ? 'Add New Case Study' : `Edit: ${editingProject.title}`}
                </h3>
                <p className="text-xs text-[#252A34]/70">Configure project brief, deliverables, specs and high-resolution visual artwork</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="p-2 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditingProject} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#173B75] mb-1">Project Title</label>
                  <input
                    type="text"
                    required
                    value={editingProject.title}
                    onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#173B75] mb-1">Category</label>
                  <select
                    value={editingProject.category}
                    onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                  >
                    {/* Safely preserve existing project category if outside standard 9 */}
                    {editingProject.category && !PORTFOLIO_CATEGORIES.includes(editingProject.category) && (
                      <option value={editingProject.category}>{editingProject.category} (Current)</option>
                    )}
                    {PORTFOLIO_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#173B75] mb-1">Tagline / Short Summary</label>
                <input
                  type="text"
                  value={editingProject.tagline}
                  onChange={(e) => setEditingProject({ ...editingProject, tagline: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#173B75] mb-1">Client Name</label>
                  <input
                    type="text"
                    value={editingProject.clientName || ''}
                    placeholder="Zenith Organics"
                    onChange={(e) => setEditingProject({ ...editingProject, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#173B75] mb-1">Project Year</label>
                  <input
                    type="text"
                    value={editingProject.projectYear || '2026'}
                    onChange={(e) => setEditingProject({ ...editingProject, projectYear: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Section A: Brand Strategy & Commercial Problem */}
              <div className="p-4 bg-[#FFF9F1] rounded-2xl border border-[#E4D8C8] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#173B75] uppercase tracking-wider">
                    Part A: Brand Strategy & Commercial Problem
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#F07822]">Section 01</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#173B75] mb-1">Strategy Section Heading</label>
                  <input
                    type="text"
                    value={editingProject.strategyHeading || 'Brand Strategy & Commercial Problem'}
                    placeholder="Brand Strategy & Commercial Problem"
                    onChange={(e) => setEditingProject({ ...editingProject, strategyHeading: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#173B75] mb-1">Strategy Narrative & Problem Definition</label>
                  <textarea
                    rows={2}
                    value={editingProject.strategyDescription || editingProject.brief || ''}
                    placeholder="Target audience analysis, market positioning, and distinctive creative direction..."
                    onChange={(e) => setEditingProject({
                      ...editingProject,
                      strategyDescription: e.target.value,
                      brief: e.target.value
                    })}
                    className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              {/* Section B: Visual Architecture & Creative Execution */}
              <div className="p-4 bg-[#FFF9F1] rounded-2xl border border-[#E4D8C8] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#173B75] uppercase tracking-wider">
                    Part B: Visual Architecture & Creative Execution
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#F07822]">Section 02</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#173B75] mb-1">Execution Section Heading</label>
                  <input
                    type="text"
                    value={editingProject.executionHeading || 'Visual Architecture & Creative Execution'}
                    placeholder="Visual Architecture & Creative Execution"
                    onChange={(e) => setEditingProject({ ...editingProject, executionHeading: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#173B75] mb-1">Creative Execution & System Dielines</label>
                  <textarea
                    rows={2}
                    value={editingProject.executionDescription || editingProject.approach || ''}
                    placeholder="Bespoke typographic rhythm, custom vector icons, packaging dieline engineering..."
                    onChange={(e) => setEditingProject({
                      ...editingProject,
                      executionDescription: e.target.value,
                      approach: e.target.value
                    })}
                    className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              {/* Primary Case Study Image with Side-by-Side Dimension Specs */}
              <AssetUploadField
                label="Primary Case Study Feature Image"
                sectionName="Portfolio Grid & Detail Modal Hero"
                currentUrl={editingProject.image}
                onUpload={async (file) => {
                  const url = await uploadImageFile(file);
                  if (url) setEditingProject({ ...editingProject, image: url });
                }}
                onClear={() => setEditingProject({ ...editingProject, image: '' })}
                recommendedDimensions="1200 × 900 px (Recommended)"
                aspectRatio="4:3 Landscape"
                supportedFormats="WebP, JPG, PNG"
                maxFileSize="10 MB"
                helpText="Featured as the main project card image and hero banner in the project detail modal."
              />

              {/* Multi-Image Project Gallery Section (10+ Images Supported) */}
              <div className="p-5 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4D8C8]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#173B75]">Project Multi-Image Gallery</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#173B75] text-white">
                        {editingProject.gallery?.length || 0} Images
                      </span>
                    </div>
                    <p className="text-[11px] text-[#252A34]/70">
                      Upload 10+ showcase images, dielines, packaging angles, reorder, and assign cover.
                    </p>
                  </div>

                  {/* Multi-file batch upload trigger */}
                  <div className="flex items-center gap-2">
                    <label className={`px-3 py-1.5 bg-[#173B75] hover:bg-[#123163] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs ${galleryUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Upload className="w-3.5 h-3.5 text-[#F07822]" />
                      <span>{galleryUploading ? 'Uploading...' : 'Batch Upload (10+ Images)'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        disabled={galleryUploading}
                        onChange={(e) => {
                          handleBatchGalleryUpload(e.target.files);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Side-by-side asset specs notice */}
                <div className="p-3 bg-white rounded-xl border border-[#E4D8C8] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#252A34]/60 block font-mono text-[10px]">RECOMMENDED DIMENSIONS</span>
                    <span className="font-bold text-[#173B75]">1200 × 900 px or 1920 × 1080 px</span>
                  </div>
                  <div>
                    <span className="text-[#252A34]/60 block font-mono text-[10px]">ASPECT RATIO</span>
                    <span className="font-bold text-[#173B75]">4:3 or 16:9</span>
                  </div>
                  <div>
                    <span className="text-[#252A34]/60 block font-mono text-[10px]">FORMATS</span>
                    <span className="font-bold text-[#173B75]">WebP, JPG, PNG</span>
                  </div>
                  <div>
                    <span className="text-[#252A34]/60 block font-mono text-[10px]">CAPACITY</span>
                    <span className="font-bold text-[#F07822]">10+ Assets per Project</span>
                  </div>
                </div>

                {/* Add Image by direct URL */}
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="Or paste external high-res image URL..."
                    value={newGalleryUrlInput}
                    onChange={(e) => setNewGalleryUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGalleryUrl())}
                    className="flex-1 px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddGalleryUrl}
                    className="px-3 py-1.5 border border-[#173B75] text-[#173B75] hover:bg-[#EEF2F9] text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>

                {/* Gallery Items Grid */}
                {editingProject.gallery && editingProject.gallery.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    {editingProject.gallery.map((item, gIdx) => {
                      const isCover = editingProject.image === item.url;
                      return (
                        <div
                          key={item.id || gIdx}
                          className={`p-2.5 rounded-xl border bg-white flex flex-col justify-between gap-2 transition-all ${
                            isCover ? 'border-[#F07822] ring-2 ring-[#F07822]/20 shadow-xs' : 'border-[#E4D8C8]'
                          }`}
                        >
                          <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-[#F7F7F5] border border-[#E4D8C8]">
                            <img
                              src={item.url}
                              alt={item.altText || `Gallery image ${gIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                              <span className="w-5 h-5 rounded-full bg-[#173B75]/90 text-white flex items-center justify-center text-[10px] font-mono font-bold">
                                {gIdx + 1}
                              </span>
                              {isCover && (
                                <span className="px-1.5 py-0.5 rounded bg-[#F07822] text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-current" /> Cover
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={item.caption || ''}
                              placeholder="Image caption / specification..."
                              onChange={(e) => handleUpdateGalleryItemCaption(gIdx, e.target.value)}
                              className="w-full px-2 py-1 border border-[#E4D8C8] rounded text-[11px]"
                            />

                            <div className="flex items-center justify-between pt-1 border-t border-[#E4D8C8]">
                              {!isCover ? (
                                <button
                                  type="button"
                                  onClick={() => handleSetGalleryAsCover(item.url)}
                                  className="text-[10px] font-bold text-[#F07822] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Star className="w-3 h-3" /> Set Cover
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> Primary Cover
                                </span>
                              )}

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={gIdx === 0}
                                  onClick={() => handleMoveGalleryItem(gIdx, 'up')}
                                  className="p-1 hover:bg-[#EEF2F9] rounded text-[#173B75] disabled:opacity-30 cursor-pointer"
                                  title="Move Left/Up"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={gIdx === (editingProject.gallery?.length || 1) - 1}
                                  onClick={() => handleMoveGalleryItem(gIdx, 'down')}
                                  className="p-1 hover:bg-[#EEF2F9] rounded text-[#173B75] disabled:opacity-30 cursor-pointer"
                                  title="Move Right/Down"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGalleryItem(gIdx)}
                                  className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                                  title="Delete Image"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center border border-dashed border-[#E4D8C8] rounded-xl bg-white text-xs text-[#252A34]/60">
                    No gallery images added yet. Click <strong>Batch Upload (10+ Images)</strong> to upload project visual deliverables.
                  </div>
                )}
              </div>

              {/* Optional Video Reel File */}
              <AssetUploadField
                label="Optional Video Showcase Reel"
                sectionName="Portfolio Project Video Reel"
                mediaType="video"
                isOptional={true}
                currentUrl={editingProject.videoUrl}
                onUpload={async (file) => {
                  const url = await uploadImageFile(file);
                  if (url) setEditingProject({ ...editingProject, videoUrl: url });
                }}
                onClear={() => setEditingProject({ ...editingProject, videoUrl: '' })}
                recommendedDimensions="1920 × 1080 px Full HD (Recommended)"
                aspectRatio="16:9 Widescreen"
                supportedFormats="MP4, WebM"
                maxFileSize="100 MB"
                helpText="Plays inside the project case study detail modal with full audio & fullscreen controls."
              />

              {/* PART C: DYNAMIC COLOR PALETTE MANAGER */}
              <div className="p-5 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E4D8C8]">
                  <div>
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-[#F07822]" />
                      <h4 className="text-xs font-bold text-[#173B75] uppercase tracking-wider">
                        Part C: Dynamic Color Palette & Identity Tokens
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#173B75] text-white">
                        {editingProject.paletteSwatches?.length || 0} Swatches
                      </span>
                    </div>
                    <p className="text-[11px] text-[#252A34]/70">
                      Independent color swatches for this specific case study. Edit names, pick colors, enter HEX, reorder and preview.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddColorSwatch}
                    className="px-3 py-1.5 bg-[#173B75] hover:bg-[#123163] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#F07822]" />
                    <span>Add Color Swatch</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#173B75] mb-1">Palette Section Heading</label>
                    <input
                      type="text"
                      value={editingProject.paletteHeading || 'Color Palette & Identity Tokens'}
                      placeholder="Color Palette & Identity Tokens"
                      onChange={(e) => setEditingProject({ ...editingProject, paletteHeading: e.target.value })}
                      className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#173B75] mb-1">Palette Subtitle / Description</label>
                    <input
                      type="text"
                      value={editingProject.paletteSubtitle || 'Approved tonal hierarchy engineered for print dielines and high-contrast digital displays.'}
                      placeholder="Approved tonal hierarchy..."
                      onChange={(e) => setEditingProject({ ...editingProject, paletteSubtitle: e.target.value })}
                      className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>

                {/* Swatches List */}
                <div className="space-y-2.5">
                  {(editingProject.paletteSwatches || []).map((swatch, sIdx) => (
                    <div
                      key={swatch.id || sIdx}
                      className="p-3 bg-white rounded-xl border border-[#E4D8C8] flex flex-wrap items-center gap-3 shadow-2xs"
                    >
                      {/* Color Box */}
                      <div
                        className="w-9 h-9 rounded-xl border border-black/15 shadow-inner shrink-0"
                        style={{ backgroundColor: swatch.hex }}
                      />

                      {/* Native Picker */}
                      <input
                        type="color"
                        value={swatch.hex.startsWith('#') && swatch.hex.length === 7 ? swatch.hex : '#173B75'}
                        onChange={(e) => handleUpdateColorSwatch(sIdx, { hex: e.target.value.toUpperCase() })}
                        className="w-9 h-9 p-0.5 rounded-lg border border-[#E4D8C8] cursor-pointer shrink-0 bg-transparent"
                        title="Pick Color"
                      />

                      {/* HEX Input */}
                      <div className="w-28 shrink-0">
                        <input
                          type="text"
                          value={swatch.hex}
                          onChange={(e) => handleUpdateColorSwatch(sIdx, { hex: e.target.value.toUpperCase() })}
                          placeholder="#173B75"
                          className="w-full px-2.5 py-1.5 font-mono text-xs font-bold border border-[#E4D8C8] rounded-lg uppercase"
                        />
                      </div>

                      {/* Name Input */}
                      <div className="flex-1 min-w-[140px]">
                        <input
                          type="text"
                          value={swatch.name || ''}
                          onChange={(e) => handleUpdateColorSwatch(sIdx, { name: e.target.value })}
                          placeholder="Token Name (e.g. Primary Navy, Matte Black)"
                          className="w-full px-3 py-1.5 text-xs border border-[#E4D8C8] rounded-lg"
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={sIdx === 0}
                          onClick={() => handleMoveColorSwatch(sIdx, 'up')}
                          className="p-1 hover:bg-[#EEF2F9] rounded text-[#173B75] disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={sIdx === (editingProject.paletteSwatches?.length || 1) - 1}
                          onClick={() => handleMoveColorSwatch(sIdx, 'down')}
                          className="p-1 hover:bg-[#EEF2F9] rounded text-[#173B75] disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteColorSwatch(sIdx)}
                          className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                          title="Delete Swatch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Swatches Preview */}
                <div className="p-3 bg-white rounded-xl border border-[#E4D8C8] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#173B75]">
                    <span>Case Study Live Swatch Preview:</span>
                    <span className="text-[10px] text-[#252A34]/60 font-mono">Displays on Public Case Study Modal</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {(editingProject.paletteSwatches || []).map((swatch, i) => (
                      <div key={i} className="flex items-center gap-2 bg-[#F7F7F5] px-2.5 py-1.5 rounded-lg border border-[#E4D8C8]">
                        <span
                          className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <div className="flex flex-col text-[10px]">
                          <span className="font-bold text-[#252A34] leading-tight">{swatch.name || `Token ${i+1}`}</span>
                          <span className="font-mono text-[9px] text-[#173B75] font-semibold uppercase">{swatch.hex}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PART D: DELIVERABLES & MASTER ASSETS MANAGER */}
              <div className="p-5 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E4D8C8]">
                  <div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#F07822]" />
                      <h4 className="text-xs font-bold text-[#173B75] uppercase tracking-wider">
                        Part D: Deliverables & Master Assets Produced
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#173B75] text-white">
                        {editingProject.deliverables?.length || 0} Items
                      </span>
                    </div>
                    <p className="text-[11px] text-[#252A34]/70">
                      Independent deliverables list for this case study. Add, edit, delete, and reorder master production assets.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#173B75] mb-1">Deliverables Section Heading</label>
                  <input
                    type="text"
                    value={editingProject.deliverablesHeading || 'Deliverables & Master Assets Produced'}
                    placeholder="Deliverables & Master Assets Produced"
                    onChange={(e) => setEditingProject({ ...editingProject, deliverablesHeading: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs font-bold bg-white"
                  />
                </div>

                {/* Add deliverable item input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter new deliverable (e.g. Digital Brand Guidelines, Retail Shelf Display)..."
                    value={newDeliverableInput}
                    onChange={(e) => setNewDeliverableInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDeliverable())}
                    className="flex-1 px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddDeliverable}
                    className="px-4 py-1.5 bg-[#173B75] text-white text-xs font-bold rounded-xl hover:bg-[#123163] cursor-pointer"
                  >
                    Add Item
                  </button>
                </div>

                {/* Deliverables List */}
                <div className="space-y-2">
                  {(editingProject.deliverables || []).map((item, dIdx) => (
                    <div
                      key={dIdx}
                      className="p-2.5 bg-white rounded-xl border border-[#E4D8C8] flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 flex-1">
                        <div className="w-5 h-5 rounded-full bg-[#F07822]/10 text-[#F07822] flex items-center justify-center shrink-0 text-[10px] font-bold">
                          ✓
                        </div>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleUpdateDeliverable(dIdx, e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs border border-transparent hover:border-[#E4D8C8] focus:border-[#173B75] rounded-lg"
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={dIdx === 0}
                          onClick={() => handleMoveDeliverable(dIdx, 'up')}
                          className="p-1 hover:bg-[#EEF2F9] rounded text-[#173B75] disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={dIdx === (editingProject.deliverables?.length || 1) - 1}
                          onClick={() => handleMoveDeliverable(dIdx, 'down')}
                          className="p-1 hover:bg-[#EEF2F9] rounded text-[#173B75] disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDeliverable(dIdx)}
                          className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                          title="Delete Deliverable"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PART E: SPECIFICATIONS & PRODUCTION METRICS */}
              <div className="p-4 bg-white rounded-2xl border border-[#E4D8C8] space-y-3">
                <span className="text-xs font-bold text-[#173B75] uppercase tracking-wider block">
                  Part E: Specifications & Production Metrics
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#173B75] mb-1">Format & Assets</label>
                    <input
                      type="text"
                      value={editingProject.specs?.format || ''}
                      placeholder="Vector Master, Dielines, MP4 Reels"
                      onChange={(e) => setEditingProject({
                        ...editingProject,
                        specs: { ...(editingProject.specs || { timeline: '', tools: '', format: '' }), format: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#173B75] mb-1">Production Timeline</label>
                    <input
                      type="text"
                      value={editingProject.specs?.timeline || ''}
                      placeholder="3–4 Weeks Collaborative Sprints"
                      onChange={(e) => setEditingProject({
                        ...editingProject,
                        specs: { ...(editingProject.specs || { timeline: '', tools: '', format: '' }), timeline: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#173B75] mb-1">Creative Stack</label>
                    <input
                      type="text"
                      value={editingProject.specs?.tools || ''}
                      placeholder="Illustrator, Figma, Premiere Pro, After Effects"
                      onChange={(e) => setEditingProject({
                        ...editingProject,
                        specs: { ...(editingProject.specs || { timeline: '', tools: '', format: '' }), tools: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* PART F: CASE STUDY MODAL CTA */}
              <div className="p-4 bg-[#FFF9F1] rounded-2xl border border-[#E4D8C8] space-y-3">
                <span className="text-xs font-bold text-[#173B75] uppercase tracking-wider block">
                  Part F: Modal Footer CTA Settings
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#173B75] mb-1">CTA Prompt Message</label>
                    <input
                      type="text"
                      value={editingProject.ctaPrompt || ''}
                      placeholder="Looking for a complete branding case study or packaging suite tailored to your business?"
                      onChange={(e) => setEditingProject({ ...editingProject, ctaPrompt: e.target.value })}
                      className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#173B75] mb-1">CTA Button Label</label>
                    <input
                      type="text"
                      value={editingProject.ctaText || ''}
                      placeholder="Discuss Scope Like This"
                      onChange={(e) => setEditingProject({ ...editingProject, ctaText: e.target.value })}
                      className="w-full px-3 py-1.5 border border-[#E4D8C8] rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E4D8C8]">
                <button
                  type="button"
                  onClick={handleRestoreCaseStudyDefaults}
                  className="px-3.5 py-2 text-xs font-semibold text-[#173B75] hover:bg-[#EEF2F9] rounded-xl border border-[#173B75]/20 flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#F07822]" />
                  <span>Restore Section Defaults</span>
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingProject(null)}
                    className="px-4 py-2 border border-[#E4D8C8] text-xs font-semibold rounded-xl text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#F07822] hover:bg-[#d65805] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Save Case Study
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 4: FOOTER CTA BANNER */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('footerCta')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">4</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 4: Portfolio Footer CTA Banner</h3>
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
                  value={siteContent.footerCtas?.portfolio?.heading || "Have a project in mind? Let's create something meaningful."}
                  onChange={(e) => {
                    const current = siteContent.footerCtas?.portfolio || {
                      heading: '',
                      description: '',
                      buttonText: 'Start a Project',
                      buttonUrl: '/contact',
                      backgroundColor: '#173B75',
                      textColor: '#FFFFFF',
                      enabled: true
                    };
                    onUpdateSiteContent({
                      ...siteContent,
                      footerCtas: {
                        ...(siteContent.footerCtas || {}),
                        portfolio: { ...current, heading: e.target.value }
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
                  value={siteContent.footerCtas?.portfolio?.buttonText || 'Start a Project'}
                  onChange={(e) => {
                    const current = siteContent.footerCtas?.portfolio || {
                      heading: '',
                      description: '',
                      buttonText: 'Start a Project',
                      buttonUrl: '/contact',
                      backgroundColor: '#173B75',
                      textColor: '#FFFFFF',
                      enabled: true
                    };
                    onUpdateSiteContent({
                      ...siteContent,
                      footerCtas: {
                        ...(siteContent.footerCtas || {}),
                        portfolio: { ...current, buttonText: e.target.value }
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
                value={siteContent.footerCtas?.portfolio?.description || 'Whether launching a new consumer brand or refreshing existing packaging, we are ready to partner with you.'}
                onChange={(e) => {
                  const current = siteContent.footerCtas?.portfolio || {
                    heading: '',
                    description: '',
                    buttonText: 'Start a Project',
                    buttonUrl: '/contact',
                    backgroundColor: '#173B75',
                    textColor: '#FFFFFF',
                    enabled: true
                  };
                  onUpdateSiteContent({
                    ...siteContent,
                    footerCtas: {
                      ...(siteContent.footerCtas || {}),
                      portfolio: { ...current, description: e.target.value }
                    }
                  });
                }}
                className="w-full px-3 py-2 border border-[#E4D8C8] rounded-xl text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: SECTION VISIBILITY TOGGLES */}
      <div className="bg-white rounded-3xl border border-[#E4D8C8] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('visibility')}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#FFF9F1] hover:bg-[#F8EFE3] transition-colors border-b border-[#E4D8C8] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#173B75] text-white flex items-center justify-center font-bold text-xs">5</div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-[#173B75]">Section 5: Portfolio Section Visibility Toggles</h3>
              <p className="text-[11px] text-[#252A34]/70">Hide or show entire sections on the public /portfolio page</p>
            </div>
          </div>
          {openSections.visibility ? <ChevronUp className="w-5 h-5 text-[#173B75]" /> : <ChevronDown className="w-5 h-5 text-[#173B75]" />}
        </button>

        {openSections.visibility && (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'portfolioHero', label: 'Hero / Banner Section' },
                { key: 'portfolioFilters', label: 'Category Filter Bar' },
                { key: 'portfolioGrid', label: 'Case Studies Grid' },
                { key: 'portfolioFooterCta', label: 'Footer CTA Banner' }
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
                        {isVisible ? 'Visible on /portfolio' : 'Hidden from /portfolio'}
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
