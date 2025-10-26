'use client';

import Link from 'next/link';
import { BarChart3, Brain, Shield, Clock, ChevronRight, Star } from 'lucide-react';

export default function HomePage() {

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="container mx-auto px-4 py-12">
        <header className="flex justify-between items-center mb-16">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Financial Literacy Toolkit</h1>
            <p className="text-sm text-loyola-gray-600">L. University - Q School of Business</p>
          </div>
          <nav>
            <ul className="flex space-x-6 items-center">
              <li><a href="#" className="text-loyola-gray-700 hover:text-loyola-maroon transition">About</a></li>
              <li><a href="#" className="text-loyola-gray-700 hover:text-loyola-maroon transition">Features</a></li>
              <li><Link href="/start" className="bg-loyola-maroon text-white px-6 py-2.5 rounded-lg hover:bg-loyola-maroon-dark transition flex items-center gap-2">Get Started <ChevronRight className="w-4 h-4" /></Link></li>
            </ul>
          </nav>
        </header>

        <main className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Transform Financial Literacy Into <span className="gradient-text">Learning Success</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Comprehensive pre and post assessment platform that measures financial literacy growth and provides actionable insights for educators and students.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/start" className="bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-medium py-3 px-8 rounded-lg text-center transition flex items-center justify-center gap-2">
                Start Assessment <ChevronRight className="w-5 h-5" />
              </Link>
              <a href="#features" className="border-2 border-loyola-maroon text-loyola-maroon hover:bg-loyola-maroon hover:text-white font-medium py-3 px-8 rounded-lg text-center transition">
                Learn More
              </a>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm font-medium text-loyola-gray-700">Trusted by Q School of Business</p>
                <div className="flex items-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-loyola-gold text-loyola-gold" />
                  ))}
                  <span className="ml-2 text-sm text-loyola-gray-600">Finance Department</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 relative">
            <div className="glass-card rounded-2xl p-6 shadow-xl bg-white border border-loyola-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-loyola-gray-900">Sample Assessment Preview</h3>
                <div className="flex items-center text-sm bg-loyola-gold/20 text-loyola-maroon px-3 py-1.5 rounded-full gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">20 min</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="w-full bg-loyola-gray-200 rounded-full h-2.5">
                  <div className="bg-gradient-to-r from-loyola-maroon to-loyola-gold h-2.5 rounded-full transition-all" style={{ width: '45%' }}></div>
                </div>
                <p className="text-right text-sm text-loyola-gray-500 mt-2 font-medium">Sample Progress</p>
              </div>

              <div className="mb-6">
                <p className="text-lg mb-4 text-loyola-gray-800 font-medium">If inflation increases while your income stays the same, your purchasing power will:</p>
                <div className="space-y-3">
                  {['Increase', 'Stay the same', 'Decrease', 'Become unpredictable'].map((option, idx) => (
                    <div key={idx} className="flex items-center p-3 border-2 border-loyola-gray-200 rounded-lg hover:border-loyola-maroon hover:bg-loyola-maroon/5 cursor-pointer transition-all">
                      <input type="radio" name="sample" className="h-5 w-5 text-loyola-maroon accent-loyola-maroon" />
                      <label className="ml-3 cursor-pointer text-loyola-gray-700">{option}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        <section id="features" className="mt-24 mb-16">
          <h2 className="text-3xl font-bold text-center mb-4 text-loyola-gray-900">Key Features</h2>
          <p className="text-center text-loyola-gray-600 mb-12 max-w-2xl mx-auto">Comprehensive assessment tools designed for the modern financial literacy classroom</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-loyola-gray-100 hover:border-loyola-maroon/30">
              <div className="w-14 h-14 bg-gradient-to-br from-loyola-maroon to-loyola-maroon-dark rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-loyola-gray-900">Pre & Post Assessment</h3>
              <p className="text-loyola-gray-600 leading-relaxed">Measure financial literacy growth over time with carefully designed instruments and anchor items.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-loyola-gray-100 hover:border-loyola-maroon/30">
              <div className="w-14 h-14 bg-gradient-to-br from-loyola-gold to-loyola-gold-dark rounded-xl flex items-center justify-center mb-4">
                <Brain className="w-7 h-7 text-loyola-maroon" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-loyola-gray-900">AI-Powered Scoring</h3>
              <p className="text-loyola-gray-600 leading-relaxed">Advanced NLP for analyzing short text responses with confidence tracking and human review queuing.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-loyola-gray-100 hover:border-loyola-maroon/30">
              <div className="w-14 h-14 bg-gradient-to-br from-loyola-maroon to-loyola-maroon-dark rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-loyola-gray-900">FERPA Compliant</h3>
              <p className="text-loyola-gray-600 leading-relaxed">Privacy-first design with hashed student keys, no raw IDs stored, and row-level security.</p>
            </div>
          </div>
        </section>
      </div>

      <footer className="bg-loyola-maroon text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-loyola-gold font-bold text-lg mb-4">Financial Literacy Toolkit</h3>
              <p className="text-white/80">Empowering financial education at L. University.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/80 hover:text-loyola-gold transition">Features</a></li>
                <li><a href="#" className="text-white/80 hover:text-loyola-gold transition">Documentation</a></li>
                <li><a href="#" className="text-white/80 hover:text-loyola-gold transition">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/80 hover:text-loyola-gold transition">User Guide</a></li>
                <li><a href="#" className="text-white/80 hover:text-loyola-gold transition">API Docs</a></li>
                <li><a href="#" className="text-white/80 hover:text-loyola-gold transition">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <p className="text-white/80">Q School of Business<br />L. University</p>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-sm">
            <p className="text-white/80">© 2025 L. University. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
