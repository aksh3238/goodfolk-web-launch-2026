import React from 'react';
import type { WebsitePageKey, BannerCtaDestination, PageBannerConfig } from '../types';
import { useSiteContent } from '../context/SiteContentContext';
import { CtaMotionGraphic } from './CtaMotionGraphic';

interface PageCustomBannerProps {
  pageKey: WebsitePageKey;
  fallbackHero?: React.ReactNode;
  onOpenLetsTalk?: () => void;
  onNavigate?: (path: string) => void;
  className?: string;
}

export const PageCustomBanner: React.FC<PageCustomBannerProps> = ({
  pageKey,
  fallbackHero,
  onOpenLetsTalk,
  onNavigate,
  className = ''
}) => {
  const { siteContent } = useSiteContent();

  const bannerConfig: PageBannerConfig | undefined = siteContent.pageBanners?.[pageKey];

  // If no custom banner image is uploaded or banner is disabled, render original fallback hero
  const hasCustomBanner =
    bannerConfig &&
    bannerConfig.enabled !== false &&
    Boolean(bannerConfig.desktopImageUrl || bannerConfig.mobileImageUrl);

  if (!hasCustomBanner) {
    return <>{fallbackHero || null}</>;
  }

  const desktopImage = bannerConfig.desktopImageUrl || bannerConfig.mobileImageUrl || '';
  const mobileImage = bannerConfig.mobileImageUrl || bannerConfig.desktopImageUrl || '';

  const rawPhone =
    siteContent.functionalPhoneDestination || siteContent.contactPhone || '9817961412';
  const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');

  const rawWa =
    siteContent.contactWhatsapp || siteContent.functionalPhoneDestination || '919817961412';
  const cleanWaNumber = rawWa.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(
    'Hi Goodfolk Solution! I saw your banner and would love to discuss a project.'
  )}`;

  const handleClick = (e: React.MouseEvent) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const activeCtaType: BannerCtaDestination =
      (isMobile && bannerConfig.mobileCtaType) ? bannerConfig.mobileCtaType : (bannerConfig.ctaType || 'enquiry');
    const activeCtaUrl =
      (isMobile && bannerConfig.mobileCtaUrl) ? bannerConfig.mobileCtaUrl : (bannerConfig.ctaUrl || '');

    if (activeCtaType === 'none') {
      return;
    }

    e.preventDefault();

    switch (activeCtaType) {
      case 'enquiry':
        if (onOpenLetsTalk) {
          onOpenLetsTalk();
        } else if (onNavigate) {
          onNavigate('/contact');
        }
        break;

      case 'call':
        if (typeof window !== 'undefined') {
          window.location.href = `tel:${cleanPhone}`;
        }
        break;

      case 'whatsapp':
        if (typeof window !== 'undefined') {
          window.open(waUrl, '_blank', 'noopener,noreferrer');
        }
        break;

      case 'url':
        if (!activeCtaUrl) {
          if (onOpenLetsTalk) onOpenLetsTalk();
          return;
        }
        if (activeCtaUrl.startsWith('/') && onNavigate) {
          onNavigate(activeCtaUrl);
        } else if (typeof window !== 'undefined') {
          window.open(activeCtaUrl, '_blank', 'noopener,noreferrer');
        }
        break;

      default:
        break;
    }
  };

  const isClickable = bannerConfig.ctaType !== 'none';

  return (
    <section className={`w-full relative overflow-hidden bg-[#0A1628] ${className}`}>
      <div
        onClick={handleClick}
        className={`w-full relative block select-none ${
          isClickable ? 'cursor-pointer group' : 'cursor-default'
        }`}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={e => {
          if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleClick(e as any);
          }
        }}
        aria-label={`${pageKey} custom banner`}
      >
        {/* Responsive Picture: Desktop vs Mobile Art Direction */}
        <picture className="w-full block">
          {bannerConfig.mobileImageUrl && (
            <source media="(max-width: 767px)" srcSet={bannerConfig.mobileImageUrl} />
          )}
          <img
            src={desktopImage}
            alt=""
            className="w-full h-auto object-cover block mx-auto transition-transform duration-500 group-hover:scale-[1.008]"
            loading="eager"
            onError={e => {
              // If an image fails to load, gracefully fall back
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </picture>

        {/* Global Banner Animation (White Particles -> CTA Focus) Overlay */}
        {siteContent.ctaAnimationType !== 'none' && (
          <CtaMotionGraphic className="opacity-80 pointer-events-none" />
        )}
      </div>
    </section>
  );
};
