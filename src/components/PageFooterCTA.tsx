import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useSiteContent } from '../context/SiteContentContext';
import { CtaMotionGraphic } from './CtaMotionGraphic';
import type { WebsitePageKey, PageFooterCtaConfig } from '../types';

interface PageFooterCTAProps {
  pageKey: WebsitePageKey;
  onOpenLetsTalk?: () => void;
  onNavigate?: (path: string) => void;
  className?: string;
}

const DEFAULT_CONFIGS: Record<WebsitePageKey, PageFooterCtaConfig> = {
  home: {
    enabled: true,
    heading: 'Ready to Build Something Great?',
    description: "Have a project in mind? Let's turn your ideas into impactful creative work.",
    buttonText: "Let's Talk",
    buttonUrl: '#letstalk',
    backgroundColor: '#173B75',
    textColor: '#FFFFFF'
  },
  services: {
    enabled: true,
    heading: 'Ready to Discuss Your Project Requirements?',
    description: 'Connect directly with our team to explore timelines, deliverables, and customized scope.',
    buttonText: "Let's Talk",
    buttonUrl: '#letstalk',
    backgroundColor: '#173B75',
    textColor: '#FFFFFF'
  },
  portfolio: {
    enabled: true,
    heading: "Have a project in mind? Let's create something meaningful.",
    description: 'Whether launching a new consumer brand or refreshing existing packaging, we are ready to partner with you.',
    buttonText: 'Start a Project',
    buttonUrl: '/contact',
    backgroundColor: '#173B75',
    textColor: '#FFFFFF'
  },
  about: {
    enabled: true,
    heading: "Let's Build Something Meaningful.",
    description: 'We look forward to understanding your brand goals and bringing thoughtful creative execution to life.',
    buttonText: 'Talk to Our Team',
    buttonUrl: '#letstalk',
    backgroundColor: '#173B75',
    textColor: '#FFFFFF'
  },
  contact: {
    enabled: true,
    heading: 'Ready to Bring Your Vision to Life?',
    description: 'Connect directly with our creative team to explore timelines, deliverables, and customized project scope.',
    buttonText: "Let's Talk",
    buttonUrl: '#letstalk',
    backgroundColor: '#173B75',
    textColor: '#FFFFFF'
  }
};

export const PageFooterCTA: React.FC<PageFooterCTAProps> = ({
  pageKey,
  onOpenLetsTalk,
  onNavigate,
  className = ''
}) => {
  const { siteContent } = useSiteContent();

  const customConfig = siteContent?.footerCtas?.[pageKey];
  const defaults = DEFAULT_CONFIGS[pageKey] || DEFAULT_CONFIGS.home;

  const enabled = customConfig?.enabled !== undefined ? customConfig.enabled : defaults.enabled;

  if (!enabled) {
    return null;
  }

  const heading = customConfig?.heading || (pageKey === 'home' && siteContent?.ctaHeadline ? siteContent.ctaHeadline : defaults.heading);
  const description = customConfig?.description || (pageKey === 'home' && siteContent?.ctaSubheadline ? siteContent.ctaSubheadline : defaults.description);
  const buttonText = customConfig?.buttonText || defaults.buttonText;
  const buttonUrl = customConfig?.buttonUrl !== undefined ? customConfig.buttonUrl : defaults.buttonUrl;
  const backgroundColor = customConfig?.backgroundColor || defaults.backgroundColor;
  const textColor = customConfig?.textColor || defaults.textColor;

  const handleButtonClick = () => {
    if (!buttonUrl || buttonUrl === '#letstalk') {
      if (onOpenLetsTalk) {
        onOpenLetsTalk();
      }
    } else if (buttonUrl.startsWith('/')) {
      if (onNavigate) {
        onNavigate(buttonUrl);
      } else {
        window.location.href = buttonUrl;
      }
    } else if (buttonUrl.startsWith('#')) {
      const el = document.getElementById(buttonUrl.replace('#', ''));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (buttonUrl.startsWith('http')) {
      window.open(buttonUrl, '_blank', 'noopener,noreferrer');
    } else if (onNavigate) {
      onNavigate(buttonUrl);
    }
  };

  return (
    <section
      style={{ backgroundColor }}
      className={`w-full relative overflow-hidden py-14 sm:py-18 mt-10 sm:mt-14 ${className}`}
    >
      <CtaMotionGraphic className="opacity-75" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-4">
        <span className="text-xs font-bold uppercase tracking-widest text-[#F07822]">
          Start Your Next Chapter
        </span>

        <h2
          style={{ color: textColor }}
          className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight"
        >
          {heading}
        </h2>

        <p
          style={{ color: textColor, opacity: 0.88 }}
          className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed"
        >
          {description}
        </p>

        <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={handleButtonClick}
            className="bg-[#F07822] hover:bg-[#d65805] text-white px-8 py-3.5 rounded-full font-bold text-sm shadow-xl shadow-[#F07822]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>{buttonText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
