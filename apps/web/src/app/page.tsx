'use client';

import Link from 'next/link';
import {
  BarChart3,
  Brain,
  Shield,
  Clock,
  ChevronRight,
  Star,
  PlayCircle,
  CheckCircle2,
  Target,
  ClipboardList,
  Users,
  ShieldCheck,
  Sparkles,
  CheckSquare,
  FileText,
  ToggleLeft,
  Upload
} from 'lucide-react';
import { useState } from 'react';

export default function HomePage() {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('Multiple choice');

  const impactStats = [
    { label: 'Average score lift', value: '+18%', detail: 'between pre and post assessments' },
    { label: 'Instructor time saved', value: '12 hrs', detail: 'per cohort through automation' },
    { label: 'Student completion rate', value: '94%', detail: 'with mobile-friendly delivery' }
  ];

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

  const trustMarkers = [
    {
      title: 'Instructor-ready',
      description: 'Templates mapped to your syllabus with optional timing controls and completion nudges.',
      icon: ClipboardList
    },
    {
      title: 'Student-friendly',
      description: 'Mobile-first flows with saved progress, guidance after each attempt, and clear scoring.',
      icon: Users
    },
    {
      title: 'Secure by design',
      description: 'Row-level security, hashed identifiers, and audit trails keep institutional data safe.',
      icon: ShieldCheck
    }
  ];

  const educatorActions = [
    {
      label: 'Launch a pre-assessment',
      description: 'Spin up a class-ready set of questions with pre-set timing and completion reminders.',
      href: '/start',
      icon: PlayCircle
    },
    {
      label: 'Review learning signals',
      description: 'See gaps by topic, compare sections, and export insights for accreditation reporting.',
      href: '/results',
      icon: Target
    }
  ];

  const uploadMethods = [
    {
      title: 'Multiple choice banks',
      description: 'Upload CSV, XLSX, or QTI exports with options and answer keys mapped to learning objectives.',
      formats: 'CSV • XLSX • QTI',
      icon: CheckSquare,
      value: 'Multiple choice'
    },
    {
      title: 'Short answer prompts',
      description: 'Import DOCX or Google Sheets prompts with rubric bands. AI assists with scorer guidance.',
      formats: 'DOCX • Google Sheet',
      icon: FileText,
      value: 'Short answer'
    },
    {
      title: 'True/False pulses',
      description: 'Drop quick checks for pre-class pulses or exit tickets, then auto-generate remediation tasks.',
      formats: 'CSV • XLSX • Form export',
      icon: ToggleLeft,
      value: 'True or false'
    }
  ];

  const formatGuidance: Record<
    string,
    { summary: string; steps: string[]; note: string; cta: string }
  > = {
    'Multiple choice': {
      summary: 'Bulk upload item banks with answer keys and auto-aligned learning objectives.',
      steps: [
        'Upload CSV/XLSX with columns for Question, Option A-D, Correct Answer, and Objective code.',
        'Map objectives to your course outcomes; the toolkit auto-builds the item bank and scoring keys.',
        'Preview student view and enable randomized order or timed sections before publishing.'
      ],
      note: 'Tip: You can import QTI packages exported from Canvas or Blackboard without reformatting.',
      cta: 'Upload a CSV bank'
    },
    'Short answer': {
      summary: 'Bring in free-response prompts with scoring rubrics that leverage AI-assisted evaluation.',
      steps: [
        'Drop a DOCX or Google Sheet with columns for Prompt, Rubric Levels, and Anchor Responses.',
        'Choose AI-assisted scoring with human-in-the-loop review queues for edge cases.',
        'Publish with plagiarism flags and optional word-count guidance for students.'
      ],
      note: 'Tip: Keep rubric level names consistent; the platform mirrors them for graders and moderators.',
      cta: 'Import rubric prompts'
    },
    'True or false': {
      summary: 'Upload quick binary checks to deploy exit tickets or readiness pulses in seconds.',
      steps: [
        'Paste or upload a CSV with Question and Correct Answer (True/False) columns.',
        'Enable retry rules and instant feedback so students learn from each attempt.',
        'Schedule reminders and auto-generate follow-up tasks for incorrect answers.'
      ],
      note: 'Tip: Pair true/false pulses with micro-lessons for rapid reinforcement.',
      cta: 'Add true/false set'
    }
  };

  const workflowSteps = [
    {
      title: 'Launch assessments in minutes',
      description:
        'Use pre-built question banks or import your own items to tailor assessments by class or learning objective.'
    },
    {
      title: 'Monitor learning in real time',
      description: 'Track completion, timing, and topic-level performance as students progress through the course.'
    },
    {
      title: 'Close the loop with feedback',
      description: 'Send targeted study guidance and remediation tasks based on individual strengths and gaps.'
    }
  ];
  
  const sampleQuestion = {
    text: "If inflation increases while your income stays the same, your purchasing power will:",
    options: ['Increase', 'Stay the same', 'Decrease', 'Become unpredictable'],
    correctAnswer: 'Decrease'
  };

  const faqs = [
    {
      question: 'Can I import my own questions and scoring rubrics?',
      answer:
        'Yes. Upload questions in bulk, map them to learning objectives, and apply AI-assisted scoring rubrics for open responses.'
    },
    {
      question: 'How do students receive feedback?',
      answer: 'Students see inline feedback after each response and receive targeted study tasks when assessments are submitted.'
    },
    {
      question: 'Is the data secure for academic programs?',
      answer:
        'We use Supabase row-level security, hashed identifiers, and role-based access controls to keep student data protected.'
    }
  ];

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

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
              <li>
                <a href="#about" className="text-loyola-gray-700 hover:text-loyola-maroon transition">
                  About
                </a>
              </li>
              <li>
                <a href="#features" className="text-loyola-gray-700 hover:text-loyola-maroon transition">
                  Features
                </a>
              </li>
              <li>
                <a href="#upload" className="text-loyola-gray-700 hover:text-loyola-maroon transition">
                  Upload formats
                </a>
              </li>
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
                <p className="text-lg mb-4 text-loyola-gray-800 font-medium">{sampleQuestion.text}</p>
                <div className="space-y-3">
                  {sampleQuestion.options.map((option, idx) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrect = option === sampleQuestion.correctAnswer;
                    const isIncorrect = isSelected && !isCorrect;
                    const showFeedback = selectedAnswer !== null;
                    
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          showFeedback
                            ? isCorrect
                              ? 'border-green-500 bg-green-50'
                              : isIncorrect
                              ? 'border-red-500 bg-red-50'
                              : 'border-loyola-gray-200'
                            : 'border-loyola-gray-200 hover:border-loyola-maroon hover:bg-loyola-maroon/5'
                        }`}
                        onClick={() => handleAnswerSelect(option)}
                      >
                        <input 
                          type="radio" 
                          name="sample" 
                          checked={isSelected}
                          onChange={() => handleAnswerSelect(option)}
                          className={`h-5 w-5 ${
                            showFeedback
                              ? isCorrect
                                ? 'text-green-600 accent-green-600'
                                : isIncorrect
                                ? 'text-red-600 accent-red-600'
                                : 'text-loyola-maroon accent-loyola-maroon'
                              : 'text-loyola-maroon accent-loyola-maroon'
                          }`}
                        />
                        <label className={`ml-3 cursor-pointer ${
                          showFeedback
                            ? isCorrect
                              ? 'text-green-800 font-semibold'
                              : isIncorrect
                              ? 'text-red-800 font-semibold'
                              : 'text-loyola-gray-700'
                            : 'text-loyola-gray-700'
                        }`}>
                          {option}
                          {showFeedback && isCorrect && (
                            <span className="ml-2 text-green-600 font-bold">✓ Correct!</span>
                          )}
                          {showFeedback && isIncorrect && (
                            <span className="ml-2 text-red-600 font-bold">✗ Incorrect</span>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
                {selectedAnswer && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Try the full assessment</strong> to see more questions and get detailed feedback on your financial literacy knowledge!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <section id="about" className="mt-24 mb-16">
          <div className="bg-white border border-loyola-gray-100 rounded-2xl shadow-lg p-8 md:p-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              <div className="lg:w-2/3">
                <p className="text-loyola-maroon font-semibold text-sm uppercase tracking-wider">About</p>
                <h2 className="text-3xl font-bold text-loyola-gray-900 mt-2">Built with educators and assessment experts</h2>
                <p className="text-loyola-gray-700 leading-relaxed mt-3">
                  The Financial Literacy Toolkit streamlines pre/post assessments, short-response scoring, and learning signal
                  follow-up. It blends faculty-friendly workflows with the compliance controls required for academic programs.
                </p>
                <div className="mt-6 grid md:grid-cols-3 gap-4">
                  {trustMarkers.map(({ title, description, icon: Icon }) => (
                    <div key={title} className="p-4 rounded-xl border border-loyola-gray-100 bg-loyola-maroon/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5 text-loyola-maroon" />
                        <p className="text-sm font-semibold text-loyola-gray-900">{title}</p>
                      </div>
                      <p className="text-sm text-loyola-gray-700 leading-relaxed">{description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:w-1/3 bg-gradient-to-br from-loyola-maroon to-loyola-maroon-dark text-white rounded-2xl p-6 shadow-md">
                <div className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase mb-2 text-loyola-gold">
                  <Sparkles className="w-4 h-4" />
                  Why now
                </div>
                <h3 className="text-2xl font-bold mb-3">Evidence-backed outcomes</h3>
                <p className="text-white/90 leading-relaxed">
                  Cohorts using the toolkit see stronger performance on budgeting, credit, and investing outcomes while saving
                  hours of instructor time each term. Early alerts reduce drop-off and keep accreditation reporting simple.
                </p>
                <div className="mt-4 flex items-center gap-3 bg-white/10 rounded-xl p-3 text-white/90">
                  <Shield className="w-5 h-5" />
                  <p className="text-sm">Built with Supabase RLS and role-based controls to keep learning data secure.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-24 mb-16">
          <h2 className="text-3xl font-bold text-center mb-4 text-loyola-gray-900">Key Features</h2>
          <p className="text-center text-loyola-gray-600 mb-12 max-w-2xl mx-auto">Comprehensive assessment tools designed for the modern financial literacy classroom</p>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {featureCards.map(({ title, description, icon: Icon, iconColor, gradient }) => (
              <div
                key={title}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-loyola-gray-100 hover:border-loyola-maroon/30"
              >
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-4`}
                >
                  <Icon className={`w-7 h-7 ${iconColor}`} />
                </div>
                <h3 className="font-bold text-xl mb-3 text-loyola-gray-900">{title}</h3>
                <p className="text-loyola-gray-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="upload" className="mb-16">
          <div className="bg-white rounded-2xl shadow-lg border border-loyola-gray-100 p-8 md:p-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 mb-8">
              <div>
                <p className="text-loyola-maroon font-semibold text-sm uppercase tracking-wider">Upload</p>
                <h3 className="text-3xl font-bold text-loyola-gray-900 mt-1">Bring your question sets in any format</h3>
                <p className="text-loyola-gray-700 mt-2 leading-relaxed">
                  Mix multiple choice, short answer, or true/false items. The toolkit maps each format to objectives, scoring,
                  and feedback so instructors can launch assessments faster.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-loyola-gold/20 text-loyola-maroon px-4 py-2 rounded-full font-semibold">
                <Upload className="w-5 h-5" />
                Bulk import ready
              </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-4">
                {uploadMethods.map(({ title, description, formats, icon: Icon, value }) => {
                  const isSelected = selectedFormat === value;

                  return (
                    <button
                      type="button"
                      key={title}
                      onClick={() => setSelectedFormat(value)}
                      className={`w-full text-left p-5 rounded-xl border transition-all shadow-sm hover:shadow-md ${
                        isSelected ? 'border-loyola-maroon bg-loyola-maroon/5' : 'border-loyola-gray-100 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? 'bg-gradient-to-br from-loyola-maroon to-loyola-maroon-dark text-white'
                              : 'bg-loyola-maroon/10 text-loyola-maroon'
                          }`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-loyola-gray-900">{title}</p>
                            <p className="text-sm text-loyola-gray-700 leading-relaxed">{description}</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-loyola-maroon bg-loyola-gold/30 px-3 py-1 rounded-full">
                          {formats}
                        </span>
                      </div>
                      <p className="text-sm text-loyola-gray-600">
                        {isSelected ? 'Selected format' : 'Click to view steps and tips'}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-2 bg-gradient-to-b from-loyola-maroon to-loyola-maroon-dark text-white rounded-2xl p-6 shadow-md">
                <div className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase mb-3 text-loyola-gold">
                  <ClipboardList className="w-4 h-4" />
                  Upload steps
                </div>
                <h4 className="text-2xl font-bold mb-2">{selectedFormat} workflow</h4>
                <p className="text-white/90 mb-4 leading-relaxed">{formatGuidance[selectedFormat].summary}</p>
                <ol className="list-decimal list-inside space-y-2 text-white/90">
                  {formatGuidance[selectedFormat].steps.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
                <div className="mt-4 p-3 rounded-xl bg-white/10 text-sm text-white/90">
                  {formatGuidance[selectedFormat].note}
                </div>
                <Link
                  href="/start"
                  className="inline-flex items-center gap-2 mt-5 bg-white text-loyola-maroon px-4 py-2.5 rounded-lg font-semibold hover:bg-loyola-gold transition"
                >
                  {formatGuidance[selectedFormat].cta}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="impact" className="mb-16">
          <div className="bg-white rounded-2xl shadow-lg border border-loyola-gray-100 p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
              <div>
                <p className="text-loyola-maroon font-semibold text-sm uppercase tracking-wider">Program impact</p>
                <h3 className="text-2xl md:text-3xl font-bold text-loyola-gray-900 mt-1">Evidence of learning growth and operational efficiency</h3>
              </div>
              <Link
                href="/results"
                className="inline-flex items-center gap-2 bg-loyola-maroon text-white px-5 py-3 rounded-lg hover:bg-loyola-maroon-dark transition"
              >
                See Results
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {impactStats.map((stat) => (
                <div
                  key={stat.label}
                  className="p-5 rounded-xl border border-loyola-gray-100 bg-gradient-to-br from-white to-loyola-gold/10"
                >
                  <p className="text-sm text-loyola-gray-600 font-medium">{stat.label}</p>
                  <p className="text-3xl font-extrabold text-loyola-maroon mt-2">{stat.value}</p>
                  <p className="text-loyola-gray-700 mt-2 leading-relaxed">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="mb-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-loyola-maroon font-semibold text-sm uppercase tracking-wider">Instructor workflow</p>
              <h3 className="text-3xl font-bold text-loyola-gray-900 mt-2">Designed for faster setup and richer feedback</h3>
              <p className="text-loyola-gray-700 mt-4 leading-relaxed">
                Each step is built to reduce friction for faculty while keeping students engaged. Automations help manage
                reminders, while dashboards surface where to intervene before exams.
              </p>
              <div className="mt-6 space-y-4">
                {workflowSteps.map((step, index) => (
                  <div key={step.title} className="flex items-start gap-4 p-4 rounded-xl bg-white shadow-sm border border-loyola-gray-100">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-loyola-maroon to-loyola-gold text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-loyola-gray-900">{step.title}</h4>
                      <p className="text-loyola-gray-700 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-loyola-gray-100 rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-loyola-maroon to-loyola-maroon-dark flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-loyola-maroon font-semibold">Live snapshot</p>
                  <h4 className="text-xl font-bold text-loyola-gray-900">Learning signal monitor</h4>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-loyola-maroon/5 border border-loyola-maroon/20 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-loyola-gray-600">Completion</p>
                    <p className="text-2xl font-bold text-loyola-gray-900">78%</p>
                  </div>
                  <div className="w-32 bg-loyola-gray-200 h-2.5 rounded-full">
                    <div className="h-2.5 bg-gradient-to-r from-loyola-maroon to-loyola-gold rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border border-loyola-gray-100 rounded-lg bg-loyola-gold/10">
                    <p className="text-sm text-loyola-gray-700">Top strength</p>
                    <p className="text-lg font-semibold text-loyola-maroon">Budgeting & cash flow</p>
                    <p className="text-sm text-loyola-gray-700 mt-1">+12% vs. baseline</p>
                  </div>
                  <div className="p-4 border border-loyola-gray-100 rounded-lg bg-loyola-maroon/5">
                    <p className="text-sm text-loyola-gray-700">Needs attention</p>
                    <p className="text-lg font-semibold text-loyola-maroon">Credit management</p>
                    <p className="text-sm text-loyola-gray-700 mt-1">High variance across sections</p>
                  </div>
                </div>
                <div className="p-4 border border-loyola-gray-100 rounded-lg bg-white">
                  <p className="text-sm text-loyola-gray-600">Suggested next action</p>
                  <p className="text-loyola-gray-900 font-semibold">Schedule a 10-minute review for Section B</p>
                  <p className="text-sm text-loyola-gray-700 mt-1">Auto-drafted reminder will go out Friday at 9am.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-24">
          <div className="bg-white border border-loyola-gray-100 rounded-2xl shadow-lg p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <p className="text-loyola-maroon font-semibold text-sm uppercase tracking-wider">Get started quickly</p>
                <h3 className="text-2xl md:text-3xl font-bold text-loyola-gray-900 mt-1">Choose the next action for your cohort</h3>
                <p className="text-loyola-gray-700 mt-2">Launch assessments or jump straight into insights without leaving the landing page.</p>
              </div>
              <Link
                href="/start"
                className="inline-flex items-center gap-2 bg-loyola-maroon text-white px-5 py-3 rounded-lg hover:bg-loyola-maroon-dark transition"
              >
                Start now
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {educatorActions.map(({ label, description, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-start gap-4 p-5 rounded-xl border border-loyola-gray-100 hover:border-loyola-maroon/40 hover:shadow-lg transition bg-gradient-to-br from-white to-loyola-gold/10"
                >
                  <div className="h-12 w-12 rounded-xl bg-loyola-maroon/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-loyola-maroon" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-loyola-gray-900">{label}</h4>
                    <p className="text-loyola-gray-700 leading-relaxed">{description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="mb-24">
          <div className="bg-white border border-loyola-gray-100 rounded-2xl shadow-lg p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <p className="text-loyola-maroon font-semibold text-sm uppercase tracking-wider">FAQ</p>
                <h3 className="text-2xl md:text-3xl font-bold text-loyola-gray-900 mt-1">Answers for instructors and admins</h3>
                <p className="text-loyola-gray-700 mt-2">Common setup, scoring, and security questions in one place.</p>
              </div>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 text-loyola-maroon font-semibold hover:text-loyola-maroon-dark transition"
              >
                Explore documentation
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {faqs.map(({ question, answer }) => (
                <div key={question} className="p-4 rounded-xl border border-loyola-gray-100 bg-loyola-gold/10">
                  <p className="font-semibold text-loyola-gray-900">{question}</p>
                  <p className="text-sm text-loyola-gray-700 mt-2 leading-relaxed">{answer}</p>
                </div>
              ))}
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
