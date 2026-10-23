import React, { useState, useEffect } from 'react';
import {
  Globe,
  Home,
  Briefcase,
  Layers,
  Users,
  Mail,
  Layout,
  Save,
  Send,
  Eye,
  History,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  RotateCcw
} from 'lucide-react';
import type {
  CMSSiteContent,
  CMSPortfolioItem,
  CMSTrustedBrand,
  CMSTestimonial
} from '../../types';
import { useSiteContent } from '../../context/SiteContentContext';
import { HomepageTab } from './HomepageTab';
import { ServicesTab } from './ServicesTab';
import { PortfolioTab } from './PortfolioTab';
import { AboutTab } from './AboutTab';
import { ContactTab } from './ContactTab';
import { FooterTab } from './FooterTab';

interface WebsiteContentManagerProps {
  token: string;
}

export type WebsiteTabId = 'homepage' | 'services' | 'portfolio' | 'about' | 'contact' | 'footer';

export const WebsiteContentManager: React.FC<WebsiteContentManagerProps> = ({ token }) => {
  const { siteContent: initialContent, refreshContent } = useSiteContent();

  const [activeTab, setActiveTab] = useState<WebsiteTabId>('homepage');
  const [content, setContent] = useState<CMSSiteContent>(initialContent);
  const [portfolioProjects, setPortfolioProjects] = useState<CMSPortfolioItem[]>([]);
  const [trustedBrands, setTrustedBrands] = useState<CMSTrustedBrand[]>([]);
  const [testimonials, setTestimonials] = useState<CMSTestimonial[]>([]);

  // Draft & publish state
  const [isDirty, setIsDirty] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Version history modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [versions, setVersions] = useState<Array<{ id: string; timestamp: string; label: string; author: string }>>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Helper to upload image files to backend base64 endpoint
  const uploadImageFile = async (file: File): Promise<string | null> => {
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          dataUrl,
          filename: file.name
        })
      });

      const data = await res.json();
      if (res.ok && data.url) {
        return data.url;
      }
      throw new Error(data.error || 'Failed to upload image.');
    } catch (err: any) {
      showToast(err.message || 'Image upload failed.', 'error');
      return null;
    }
  };

  // Fetch full CMS content on mount
  const loadFullCMS = async () => {
    try {
      const res = await fetch('/api/admin/content', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.siteContent) setContent(data.siteContent);
        if (data.portfolioProjects) setPortfolioProjects(data.portfolioProjects);
        if (data.trustedBrands) setTrustedBrands(data.trustedBrands);
        if (data.testimonials) setTestimonials(data.testimonials);
      }
    } catch (err) {
      console.warn('Fallback to context siteContent:', err);
    }
  };

  useEffect(() => {
    loadFullCMS();
  }, [token]);

  // Sync when initial context content changes
  useEffect(() => {
    if (!isDirty && initialContent && initialContent.heroHeadline) {
      setContent(initialContent);
    }
  }, [initialContent, isDirty]);

  const handleUpdateSiteContent = (updated: CMSSiteContent) => {
    setContent(updated);
    setIsDirty(true);
  };

  // 1. SAVE DRAFT
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const res = await fetch('/api/admin/content/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(content)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Draft successfully saved! You can continue editing or publish when ready.', 'success');
        setIsDirty(false);
      } else {
        throw new Error(data.error || 'Failed to save draft.');
      }
    } catch (err: any) {
      showToast(err.message || 'Error occurred while saving draft.', 'error');
    } finally {
      setSavingDraft(false);
    }
  };

  // 2. PUBLISH TO LIVE WEBSITE
  const handlePublishLive = async () => {
    setPublishing(true);
    try {
      const res = await fetch('/api/admin/content/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          siteContent: content,
          label: `Published by Admin on ${new Date().toLocaleDateString('en-IN')}`
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('🎉 Content published live successfully! All public pages are now updated.', 'success');
        setIsDirty(false);
        // Force refresh public context
        await refreshContent();
      } else {
        throw new Error(data.error || 'Failed to publish live content.');
      }
    } catch (err: any) {
      showToast(err.message || 'Error publishing content to live website.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  // 3. LOAD VERSIONS
  const handleOpenVersions = async () => {
    setShowHistoryModal(true);
    setLoadingVersions(true);
    try {
      const res = await fetch('/api/admin/content/versions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (err) {
      console.error('Failed to load version history:', err);
    } finally {
      setLoadingVersions(false);
    }
  };

  // 4. RESTORE VERSION
  const handleRestoreVersion = async (versionId: string) => {
    if (!window.confirm('Restore this published snapshot? Your current unsaved changes will be replaced.')) return;
    try {
      const res = await fetch(`/api/admin/content/restore/${versionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setContent(data.siteContent);
        setIsDirty(false);
        setShowHistoryModal(false);
        showToast('Historical version restored and published successfully.', 'success');
        await refreshContent();
      }
    } catch (err) {
      console.error('Failed to restore version:', err);
    }
  };

  // Mandatory 6 tabs in exact requested order:
  const tabs: Array<{
    id: WebsiteTabId;
    label: string;
    number: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }> = [
    {
      id: 'homepage',
      label: 'Homepage',
      number: '1',
      icon: Home,
      description: 'Hero, brand reel, services preview, why us, marquee, testimonials & visibility'
    },
    {
      id: 'services',
      label: 'Services',
      number: '2',
      icon: Briefcase,
      description: 'Hero banner, agency creative banner, 10 services CRUD, 4-step methodology'
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      number: '3',
      icon: Layers,
      description: 'Hero, categories filter manager, case studies & projects CRUD modal, video reels'
    },
    {
      id: 'about',
      label: 'About Us',
      number: '4',
      icon: Users,
      description: 'Hero, brand film reel, story & approach, enterprise metrics, core principles'
    },
    {
      id: 'contact',
      label: 'Contact',
      number: '5',
      icon: Mail,
      description: 'Hero, direct channels (0000000 vs WA), form labels, dedicated FAQ Manager'
    },
    {
      id: 'footer',
      label: 'Footer',
      number: '6',
      icon: Layout,
      description: 'Global brand theme & colors, header/footer logos, footer animation, Instagram, copyright & UPI'
    }
  ];

  const commonTabProps = {
    token,
    siteContent: content,
    onUpdateSiteContent: handleUpdateSiteContent,
    showToast,
    uploadImageFile,
    onSaveDraft: handleSaveDraft,
    onPublishLive: handlePublishLive,
    saving: savingDraft || publishing
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Persistent Control Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E8ED] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 sticky top-20 z-30 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#173B75] text-white flex items-center justify-center font-bold shadow-sm">
            <Globe className="w-5 h-5 text-[#F07822]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#173B75]">Website Content CMS</h2>
              {isDirty ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                  Unsaved Draft Changes
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Synced with Live Site
                </span>
              )}
            </div>
            <p className="text-xs text-[#252A34]/60">
              Manage every public element across all 5 pages & footer with real-time preview and instant live publishing.
            </p>
          </div>
        </div>

        {/* Global CMS Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl border border-[#E6E8ED] hover:bg-[#EEF2F9] text-xs font-bold text-[#173B75] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Preview live public website in new tab"
          >
            <Eye className="w-3.5 h-3.5 text-[#F07822]" />
            <span>View Live Site</span>
          </a>

          <button
            type="button"
            onClick={handleOpenVersions}
            className="px-3.5 py-2 rounded-xl border border-[#E6E8ED] hover:bg-[#EEF2F9] text-xs font-bold text-[#173B75] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="View published rollback history"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>History</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft || publishing}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#173B75] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingDraft ? 'Saving Draft...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={handlePublishLive}
            disabled={publishing || savingDraft}
            className="px-5 py-2 rounded-xl bg-[#F07822] hover:bg-[#d65805] text-white text-xs font-extrabold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{publishing ? 'Publishing Live...' : 'Publish Live to Website'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 transition-all shadow-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* 6 Clearly Separated Page Manager Navigation Tabs in Exact Order */}
      <div className="bg-white p-2 rounded-2xl border border-[#E6E8ED] shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#173B75] text-white shadow-md'
                    : 'text-[#252A34]/70 hover:text-[#173B75] hover:bg-[#EEF2F9]/60'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isActive ? 'bg-[#F07822] text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.number}
                </span>
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#F07822]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Manager View */}
      <div className="pt-2">
        {activeTab === 'homepage' && (
          <HomepageTab
            {...commonTabProps}
            trustedBrands={trustedBrands}
            setTrustedBrands={setTrustedBrands}
            testimonials={testimonials}
            setTestimonials={setTestimonials}
          />
        )}

        {activeTab === 'services' && (
          <ServicesTab
            {...commonTabProps}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioTab
            {...commonTabProps}
            portfolioProjects={portfolioProjects}
            setPortfolioProjects={setPortfolioProjects}
          />
        )}

        {activeTab === 'about' && (
          <AboutTab
            {...commonTabProps}
          />
        )}

        {activeTab === 'contact' && (
          <ContactTab
            {...commonTabProps}
          />
        )}

        {activeTab === 'footer' && (
          <FooterTab
            {...commonTabProps}
          />
        )}
      </div>

      {/* Bottom Save & Publish Bar */}
      <div className="p-4 bg-white rounded-2xl border border-[#E6E8ED] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2 text-[#252A34]/70">
          <Clock className="w-4 h-4 text-[#F07822]" />
          <span>
            {isDirty ? 'You have unsaved changes in this session.' : 'All changes are stored persistently in backend database.'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft || publishing}
            className="px-4 py-2 rounded-xl border border-[#E6E8ED] bg-[#F7F7F5] hover:bg-slate-200 font-bold text-[#173B75] transition-colors cursor-pointer"
          >
            {savingDraft ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={handlePublishLive}
            disabled={publishing || savingDraft}
            className="px-5 py-2 rounded-xl bg-[#F07822] hover:bg-[#d65805] text-white font-bold transition-all shadow-md cursor-pointer"
          >
            {publishing ? 'Publishing...' : 'Publish Live Now'}
          </button>
        </div>
      </div>

      {/* VERSION HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 border border-[#E6E8ED] shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#E6E8ED] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#173B75]/10 text-[#173B75] flex items-center justify-center font-bold">
                  <History className="w-5 h-5 text-[#F07822]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#173B75]">Published Version History</h3>
                  <p className="text-xs text-[#252A34]/60">Review and restore previous published website snapshots.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-[#F7F7F5] flex items-center justify-center text-slate-500 hover:text-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingVersions ? (
              <div className="py-10 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-[#173B75] mx-auto" />
                <span className="text-xs text-slate-500 mt-2 block">Loading snapshot history...</span>
              </div>
            ) : versions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No past versions archived yet. Every time you click "Publish Live", a snapshot is created here.
              </div>
            ) : (
              <div className="divide-y divide-[#E6E8ED] max-h-80 overflow-y-auto pr-1">
                {versions.map(v => (
                  <div key={v.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-[#173B75] block">{v.label || 'Published Snapshot'}</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(v.timestamp).toLocaleString('en-IN')} · Author: {v.author || 'Admin'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestoreVersion(v.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#EEF2F9] hover:bg-[#173B75] hover:text-white text-[#173B75] font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 rounded-xl bg-[#173B75] text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
