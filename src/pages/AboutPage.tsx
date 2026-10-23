import React, { useRef } from 'react';
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, FileCheck, TrendingUp, Users } from 'lucide-react';
import { useSiteContent } from '../context/SiteContentContext';
import { FocusCardGroup, FocusCardItem } from '../components/FocusCardGroup';
import { HeroBrandVideo } from '../components/HeroBrandVideo';
import { CtaMotionGraphic } from '../components/CtaMotionGraphic';
import { PageCustomBanner } from '../components/PageCustomBanner';
import { PageFooterCTA } from '../components/PageFooterCTA';
import { DynamicCustomSections } from '../components/DynamicCustomSections';

interface AboutPageProps {
  onOpenLetsTalk: () => void;
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onOpenLetsTalk, onNavigate }) => {
  const { siteContent, customSections } = useSiteContent();
  const ctaButtonRef = useRef<HTMLButtonElement | null>(null);

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

  const principles = (siteContent?.aboutPrinciplesCards && siteContent.aboutPrinciplesCards.length > 0)
    ? siteContent.aboutPrinciplesCards
    : defaultPrinciples;

  // Section 5: Exact 7 Client / Partnership categories moving continuously from Left to Right
  const partnershipHeadings = [
    'Startups & Emerging Brands',
    'Consumer Product Businesses',
    'E-commerce Brands',
    'Established Businesses',
    'FMCG & Food Brands',
    'Beauty & Personal Care Brands',
    'D2C Brands'
  ];

  // Enterprise Quality Standards (Moved from Homepage to About Us)
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

  const standardsCards = (siteContent?.aboutStandardsCards && siteContent.aboutStandardsCards.length > 0)
    ? siteContent.aboutStandardsCards
    : defaultStandardsCards;

  const getStandardIcon = (idx: number, badge: string) => {
    const b = badge.toLowerCase();
    if (b.includes('print')) return FileCheck;
    if (b.includes('conversion') || b.includes('data')) return TrendingUp;
    return Users;
  };

  // Published custom sections for about page (excluding any duplicate standards section if already rendered)
  const aboutCustomSections = (customSections || []).filter(
    s => s.page === 'about' && s.published && s.id !== 'sec-standards'
  );

  return (
    <div className="pt-24 pb-0 overflow-x-hidden">
      {/* 1. HERO SECTION (Custom Banner or Default Hero) */}
      <PageCustomBanner
        pageKey="about"
        onOpenLetsTalk={onOpenLetsTalk}
        onNavigate={onNavigate}
        fallbackHero={
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 text-center relative">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EEF2F9] text-[#173B75] text-xs font-semibold mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F07822]" />
              About Goodfolk Solution
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#173B75] tracking-tight max-w-4xl mx-auto leading-[1.14]">
              {siteContent.aboutHeadline || 'Good Ideas Deserve Good Folks.'}
            </h1>

            <p className="mt-4 text-base sm:text-lg text-[#252A34]/85 max-w-2xl mx-auto leading-relaxed">
              {siteContent.aboutTagline || 'Goodfolk Solution brings strategy, creativity and thoughtful design together to help brands communicate clearly and grow with purpose.'}
            </p>
          </section>
        }
      />

      {/* 2. FULL-WIDTH 15-SECOND BRAND VIDEO (Edge-to-Edge Banner) */}
      <section className="w-full relative overflow-hidden bg-black shadow-xl">
        <HeroBrandVideo
          videoUrl={siteContent.heroVideoUrl}
          posterUrl={siteContent.heroVideoPoster}
          headline={siteContent.heroHeadline || 'Good Ideas Deserve Good Folks.'}
          isFullWidth={true}
          onOpenLetsTalk={onOpenLetsTalk}
        />
      </section>

      {/* 3. OUR STORY & APPROACH */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-3xl overflow-hidden border border-[#E6E8ED] shadow-xl bg-white">
              <img
                src="https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1000&q=80"
                alt="Creative agency strategic planning and collaboration"
                className="w-full h-72 sm:h-[420px] object-cover"
              />
            </div>
          </div>

          {/* Story & Approach Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#F7F7F5] rounded-3xl p-7 sm:p-8 border border-[#E6E8ED]">
              <span className="text-xs font-mono font-bold uppercase text-[#F07822] tracking-wider">
                Our Story
              </span>
              <h2 className="text-2xl font-bold text-[#173B75] mt-1 mb-2">
                {siteContent.aboutStoryTitle || 'Built Around Purposeful Craft'}
              </h2>
              <p className="text-sm sm:text-base text-[#252A34]/85 leading-relaxed">
                {siteContent.aboutStory || 'Goodfolk Solution was built around a simple belief: thoughtful creative work can make a meaningful difference to a business. We bring branding, design and digital communication together to help businesses express their identity and connect with their audience.'}
              </p>
            </div>

            <div className="bg-[#EEF2F9]/50 rounded-3xl p-7 sm:p-8 border border-[#173B75]/10">
              <span className="text-xs font-mono font-bold uppercase text-[#173B75] tracking-wider">
                Our Approach
              </span>
              <h2 className="text-2xl font-bold text-[#173B75] mt-1 mb-2">
                {siteContent.aboutApproachTitle || 'Understand, Calibrate, Execute'}
              </h2>
              <p className="text-sm sm:text-base text-[#252A34]/85 leading-relaxed">
                {siteContent.aboutApproach || 'We begin by understanding the business, the audience and the objective. From there, we develop creative solutions that are relevant, consistent and purposeful.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ENTERPRISE QUALITY STANDARDS (Moved from Homepage to About Us) */}
      <section className="bg-[#FFF9F1] py-14 lg:py-20 border-y border-[#E4D8C8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#173B75]/10 text-[#173B75] text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F07822]" />
              {siteContent.aboutStandardsBadge || 'Enterprise Quality Standards'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#173B75] tracking-tight">
              {siteContent.aboutStandardsHeadline || 'Built For Real Business Growth'}
            </h2>
            <div className="text-xs font-bold uppercase tracking-wider text-[#F07822] mt-1">
              Our Commitments
            </div>
            <p className="mt-3 text-sm sm:text-base text-[#252A34]/85 max-w-2xl mx-auto leading-relaxed">
              {siteContent.aboutStandardsSubtitle || 'From tactile print tolerances to performance creative variation architecture, every asset is rigorously engineered for lasting commercial impact.'}
            </p>
          </div>

          <FocusCardGroup className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {standardsCards.map((card, idx) => {
              const IconComp = getStandardIcon(idx, card.badge || '');
              return (
                <FocusCardItem key={card.id || idx} index={idx} className="h-full">
                  <div className="bg-white rounded-3xl p-7 border border-[#E4D8C8] shadow-sm hover:border-[#173B75]/30 transition-all flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-[#173B75] text-white flex items-center justify-center shadow-md">
                          <IconComp className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-[#EEF2F9] text-[#173B75]">
                          {card.badge}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#173B75]">{card.title}</h3>
                      <div className="text-xs font-semibold text-[#F07822] mt-0.5">{card.subtitle}</div>
                      <p className="mt-2.5 text-xs sm:text-sm text-[#252A34]/80 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                </FocusCardItem>
              );
            })}
          </FocusCardGroup>
        </div>
      </section>

      {/* 5. FOUNDATIONAL VALUES — OUR PRINCIPLES */}
      <section className="py-14 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F07822]">
            {siteContent.aboutPrinciplesEyebrow || 'Foundational Values'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#173B75] mt-1 tracking-tight">
            {siteContent.aboutPrinciplesHeading || 'Our Principles'}
          </h2>
          <p className="text-sm text-[#242832]/75 mt-2">
            {siteContent.aboutPrinciplesSubtitle || 'The core standards guiding every client engagement and creative execution.'}
          </p>
        </div>

        <FocusCardGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {principles.map((p, idx) => (
            <FocusCardItem key={p.id} index={idx} className="h-full">
              <div className="h-full bg-white rounded-3xl p-6 border border-[#E6E8ED] shadow-sm flex flex-col justify-between hover:border-[#173B75]/30 transition-all">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-[#173B75]/10 text-[#173B75] flex items-center justify-center font-bold text-xs mb-3">
                    <Sparkles className="w-4 h-4 text-[#F07822]" />
                  </div>
                  <h3 className="text-base font-bold text-[#173B75]">{p.title}</h3>
                  <p className="mt-2 text-xs text-[#252A34]/80 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            </FocusCardItem>
          ))}
        </FocusCardGroup>
      </section>

      {/* 7. PARTNERSHIPS MARQUEE (Continuous Right-to-Left Full-Width Marquee) */}
      <section className="w-full bg-[#173B75] py-8 border-y border-white/10 overflow-hidden relative">
        {/* Subtle fading masks on left and right for seamless entrance/exit */}
        <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[#173B75] to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[#173B75] to-transparent z-10 pointer-events-none" />

        <div className="relative w-full overflow-hidden marquee-pause">
          {/* Continuous Right-to-Left Marquee Track (Smooth right-to-left flow, pause on hover) */}
          <div className="animate-marquee-infinite flex items-center gap-6 sm:gap-10 py-1">
            {[...partnershipHeadings, ...partnershipHeadings].map((heading, idx) => (
              <div
                key={`${heading}-${idx}`}
                className="flex items-center gap-4 sm:gap-6 shrink-0 select-none"
              >
                <span className="text-base sm:text-xl lg:text-2xl font-extrabold text-white tracking-wide hover:text-[#F07822] transition-colors whitespace-nowrap">
                  {heading}
                </span>
                <span className="w-2 h-2 rounded-full bg-[#F07822] shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. DYNAMIC CUSTOM SECTIONS (If configured in CMS) */}
      {aboutCustomSections && aboutCustomSections.length > 0 && (
        <DynamicCustomSections
          sections={aboutCustomSections}
          onNavigate={onNavigate}
          onOpenLetsTalk={onOpenLetsTalk}
        />
      )}

      {/* 9. ABOUT US CTA BANNER */}
      <PageFooterCTA
        pageKey="about"
        onOpenLetsTalk={onOpenLetsTalk}
        onNavigate={onNavigate}
      />
    </div>
  );
};
