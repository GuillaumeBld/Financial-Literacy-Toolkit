'use client';

import Link from 'next/link';
import { ChevronRight, Shield, BarChart3, Brain, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const featureCards = [
    {
      title: 'Pre & Post Assessment',
      description: 'Measure financial literacy growth over time with carefully designed instruments and anchor items.',
      icon: BarChart3,
      iconColor: 'text-white',
      gradient: 'from-loyola-maroon to-loyola-maroon-dark'
    },
    {
      title: 'AI-Powered Scoring',
      description: 'Advanced NLP for analyzing short text responses with confidence tracking and human review queuing.',
      icon: Brain,
      iconColor: 'text-loyola-maroon',
      gradient: 'from-loyola-gold to-loyola-gold-dark'
    },
    {
      title: 'FERPA Compliant',
      description: 'Privacy-first design with hashed student keys, no raw IDs stored, and row-level security.',
      icon: Shield,
      iconColor: 'text-white',
      gradient: 'from-loyola-maroon to-loyola-maroon-dark'
    },
    {
      title: 'Actionable Next Steps',
      description: 'Share remediation tasks, micro-lessons, and calendar invites directly from progress alerts.',
      icon: CheckCircle2,
      iconColor: 'text-loyola-maroon',
      gradient: 'from-loyola-gold to-loyola-gold-dark'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 lg:py-12">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8 md:mb-12 lg:mb-16">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text leading-tight">Financial Literacy Toolkit</h1>
            <p className="text-xs sm:text-sm text-loyola-gray-600 mt-1.5 sm:mt-2">by Dr. Abol Jalilvand and Guillaume Bolivard</p>
          </div>
          <nav className="w-full sm:w-auto">
            <Link href="/start" className="bg-loyola-maroon text-white px-5 sm:px-6 py-3 sm:py-2.5 rounded-lg hover:bg-loyola-maroon-dark active:bg-loyola-maroon-dark transition flex items-center justify-center gap-2 text-sm sm:text-base font-medium min-h-[44px] touch-manipulation">
              Get Started <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </nav>
        </header>

        <main className="mb-8 sm:mb-12 md:mb-16 lg:mb-20">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-800 max-w-3xl mx-auto font-medium leading-relaxed px-2 sm:px-4 mb-6 sm:mb-8">
              Pre and post assessment platform for finance students to measure financial literacy growth.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 sm:mb-8 md:mb-12 px-4">
              <Link href="/start" className="bg-loyola-maroon hover:bg-loyola-maroon-dark active:bg-loyola-maroon-dark text-white font-medium py-4 sm:py-3 px-8 sm:px-8 rounded-lg text-center transition flex items-center justify-center gap-2 text-base sm:text-lg min-h-[48px] touch-manipulation shadow-md hover:shadow-lg">
                Start Assessment <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
            </div>

            <div className="flex items-start sm:items-center justify-center gap-3 p-4 sm:p-5 rounded-lg border border-loyola-gray-200 bg-white max-w-md mx-auto shadow-sm mx-4 sm:mx-auto">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-loyola-maroon flex-shrink-0 mt-0.5 sm:mt-0" />
              <p className="text-xs sm:text-sm text-loyola-gray-700 leading-relaxed text-left sm:text-center">
                FERPA compliant with secure, hashed student identifiers
              </p>
            </div>
          </div>

          <section id="features" className="mt-8 sm:mt-12 md:mt-16 lg:mt-24">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-2 sm:mb-3 md:mb-4 text-loyola-gray-900 px-4">Key Features</h2>
            <p className="text-center text-xs sm:text-sm md:text-base text-loyola-gray-600 mb-6 sm:mb-8 md:mb-12 max-w-2xl mx-auto px-4 sm:px-6">
              Comprehensive assessment tools designed for the modern financial literacy classroom
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              {featureCards.map(({ title, description, icon: Icon, iconColor, gradient }) => (
                <div
                  key={title}
                  className="bg-white p-5 sm:p-6 rounded-xl shadow-sm hover:shadow-md active:shadow-md transition-all border border-loyola-gray-200 hover:border-loyola-maroon/40"
                >
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-4 sm:mb-4`}
                  >
                    <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${iconColor}`} />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg md:text-xl mb-2 sm:mb-3 text-loyola-gray-900 leading-tight">{title}</h3>
                  <p className="text-xs sm:text-sm md:text-base text-loyola-gray-600 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      <footer className="bg-loyola-maroon text-white py-5 sm:py-6 md:py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">© 2025 by Dr. Abol Jalilvand and Guillaume Bolivard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
