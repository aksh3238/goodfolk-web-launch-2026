import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, Layers } from 'lucide-react';
import { SERVICES_DATA, ServiceItem } from '../data/services';
import { useSiteContent } from '../context/SiteContentContext';

interface ServicesSwipeableCarouselProps {
  onSelectService?: (service: ServiceItem | any) => void;
  onNavigate?: (path: string) => void;
  className?: string;
  isCompact?: boolean;
}

export const ServicesSwipeableCarousel: React.FC<ServicesSwipeableCarouselProps> = ({
  onSelectService,
  onNavigate,
  className = '',
  isCompact = false
}) => {
  const { siteContent } = useSiteContent();
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allServices = (siteContent?.services && siteContent.services.length >= 10)
    ? siteContent.services
    : SERVICES_DATA;

  const slide1 = allServices.slice(0, 5);
  const slide2 = allServices.slice(5, 10);
  const slides = [
    { id: 'slide-1', label: 'Slide 1', services: slide1 },
    { id: 'slide-2', label: 'Slide 2', services: slide2 }
  ];

  const currentGroup = slides[activeGroupIndex];

  // Touch handlers for mobile swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Next slide
      setActiveGroupIndex((prev) => (prev === 0 ? 1 : 0));
    }
    if (isRightSwipe) {
      // Prev slide
      setActiveGroupIndex((prev) => (prev === 1 ? 0 : 1));
    }
  };

  // Keyboard navigation when container has focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement && containerRef.current?.contains(document.activeElement)) {
        if (e.key === 'ArrowRight') {
          setActiveGroupIndex((prev) => (prev === 0 ? 1 : 0));
        } else if (e.key === 'ArrowLeft') {
          setActiveGroupIndex((prev) => (prev === 1 ? 0 : 1));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCardClick = (service: ServiceItem) => {
    if (onSelectService) {
      onSelectService(service);
    } else if (onNavigate) {
      onNavigate(`/services#${service.id}`);
    } else {
      const el = document.getElementById(service.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`space-y-6 ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      tabIndex={0}
      aria-label="All 10 Creative Services Carousel"
    >
      {/* Navigation Header Bar: Clean Previous and Next Navigation */}
      <div className="flex items-center justify-between gap-4 border-b border-[#E6E8ED] pb-4">
        {/* Slide status counter */}
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-bold text-[#173B75] tracking-wide">
            Showing Slide {activeGroupIndex + 1} of 2 ({currentGroup.services.length} Services)
          </span>
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveGroupIndex(idx)}
                aria-label={`Switch to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  activeGroupIndex === idx ? 'w-6 bg-[#F07822]' : 'w-2 bg-[#173B75]/25 hover:bg-[#173B75]/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Previous and Next Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveGroupIndex((prev) => (prev === 1 ? 0 : 1))}
            aria-label="Previous slide"
            className="px-3 py-1.5 rounded-xl bg-white border border-[#E6E8ED] hover:border-[#173B75] text-[#173B75] flex items-center gap-1.5 text-xs font-bold transition-all hover:bg-[#EEF2F9] cursor-pointer shadow-xs active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 text-[#F07822]" />
            <span>Previous</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveGroupIndex((prev) => (prev === 0 ? 1 : 0))}
            aria-label="Next slide"
            className="px-3 py-1.5 rounded-xl bg-white border border-[#E6E8ED] hover:border-[#173B75] text-[#173B75] flex items-center gap-1.5 text-xs font-bold transition-all hover:bg-[#EEF2F9] cursor-pointer shadow-xs active:scale-95"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4 text-[#F07822]" />
          </button>
        </div>
      </div>

      {/* 5 Equal-Sized Compact Cards Grid for Current Active Slide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5 animate-in fade-in duration-300">
        {currentGroup.services.map((service) => (
          <div
            key={service.id}
            onClick={() => handleCardClick(service)}
            className="group bg-white rounded-2xl border border-[#E6E8ED] hover:border-[#F07822] overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer h-full"
          >
            {/* Image Header (without numbered label) */}
            <div className="relative h-44 sm:h-48 overflow-hidden bg-[#EEF2F9]">
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1589365278144-c9e705f843ba?auto=format&fit=crop&w=1200&q=80';
                }}
              />
            </div>

            {/* Card Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#173B75] group-hover:text-[#F07822] transition-colors line-clamp-2 leading-snug">
                  {service.title}
                </h3>
                <p className="mt-2 text-xs text-[#242832]/75 leading-relaxed line-clamp-3">
                  {service.shortDesc}
                </p>
              </div>

              {/* Explore Service CTA */}
              <div className="pt-3 border-t border-[#E6E8ED] flex items-center justify-between text-xs font-bold text-[#173B75] group-hover:text-[#F07822] transition-colors">
                <span>Explore Service</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#F07822] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Navigation Progress Dots / Indicators */}
      <div className="flex items-center justify-center gap-2 pt-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveGroupIndex(idx)}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              activeGroupIndex === idx
                ? 'w-8 bg-[#F07822]'
                : 'w-2 bg-[#E6E8ED] hover:bg-[#173B75]/40'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
