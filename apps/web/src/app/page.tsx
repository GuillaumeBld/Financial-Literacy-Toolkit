'use client';

import Link from 'next/link';
import { ChevronRight, Shield, BarChart3, Brain, CheckCircle2, TrendingUp, DollarSign, PieChart } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50 text-gray-900 relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32">
          <DollarSign className="w-full h-full text-loyola-maroon" />
        </div>
        <div className="absolute top-40 right-20 w-24 h-24">
          <TrendingUp className="w-full h-full text-loyola-gold" />
        </div>
        <div className="absolute bottom-40 left-20 w-28 h-28">
          <PieChart className="w-full h-full text-loyola-maroon" />
        </div>
        <div className="absolute bottom-20 right-10 w-20 h-20">
          <BarChart3 className="w-full h-full text-loyola-gold" />
        </div>
      </div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-loyola-maroon/5 via-transparent to-loyola-gold/5 pointer-events-none"></div>
      
      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12 relative z-10">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12 md:mb-16">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Financial Literacy Toolkit</h1>
          </div>
          <nav>
            <Link href="/start" className="bg-loyola-maroon text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-loyola-maroon-dark transition flex items-center gap-2 text-sm sm:text-base">
              Get Started <ChevronRight className="w-4 h-4" />
            </Link>
          </nav>
        </header>

        <main className="mb-12 sm:mb-16 md:mb-20">
          <div className="text-center mb-8 sm:mb-12 relative">
            {/* Decorative icons around hero content */}
            <div className="hidden md:block absolute -left-8 top-1/2 -translate-y-1/2 w-16 h-16 text-loyola-maroon/20">
              <TrendingUp className="w-full h-full" />
            </div>
            <div className="hidden md:block absolute -right-8 top-1/2 -translate-y-1/2 w-16 h-16 text-loyola-gold/20">
              <PieChart className="w-full h-full" />
            </div>
            
            <div className="flex justify-center items-center gap-4 mb-6 sm:mb-8">
              <div className="hidden sm:flex items-center gap-2 text-loyola-maroon/30">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl text-gray-700 max-w-3xl font-medium">
                Pre and post assessment platform for finance students to measure financial literacy growth.
              </p>
              <div className="hidden sm:flex items-center gap-2 text-loyola-gold/30">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 sm:mb-12">
              <Link href="/start" className="bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-medium py-3 px-6 sm:px-8 rounded-lg text-center transition flex items-center justify-center gap-2">
                Start Assessment <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="flex items-center justify-center gap-3 p-4 rounded-xl border border-loyola-gray-200 bg-white max-w-md mx-auto">
              <Shield className="w-5 h-5 text-loyola-maroon flex-shrink-0" />
              <p className="text-xs sm:text-sm text-loyola-gray-700">
                FERPA compliant with secure, hashed student identifiers
              </p>
            </div>
          </div>

          <section id="features" className="mt-12 sm:mt-16 md:mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2 sm:mb-4 text-loyola-gray-900">Key Features</h2>
            <p className="text-center text-sm sm:text-base text-loyola-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
              Comprehensive assessment tools designed for the modern financial literacy classroom
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {featureCards.map(({ title, description, icon: Icon, iconColor, gradient }) => (
                <div
                  key={title}
                  className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-loyola-gray-100 hover:border-loyola-maroon/30"
                >
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-3 sm:mb-4`}
                  >
                    <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${iconColor}`} />
                  </div>
                  <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 text-loyola-gray-900">{title}</h3>
                  <p className="text-sm sm:text-base text-loyola-gray-600 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      <footer className="bg-loyola-maroon text-white py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-white/80">© 2025 by Dr. Abol Jalilvand and Guillaume Bolivard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
