'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowLeft,
  LogOut,
  RefreshCw,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Layers,
  Target,
  HelpCircle,
  BookOpen
} from 'lucide-react';

type Question = {
  item_id: string;
  type: 'multiple-choice' | 'short-answer';
  domain: string;
  subdomain: string;
  difficulty: number;
  question_text: string;
  options?: string[];
  key?: string;
  explanation?: string;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
  is_anchor?: boolean | null;
  is_sdm?: boolean | null;
  is_scored?: boolean | null;
  external_item_id?: string | null;
  anchor_item_id?: string | null;
  variant_type?: string | null;
  trigger_condition?: string | null;
  external_id?: string | null;
};

type FilterOptions = {
  domain: string;
  searchTerm: string;
  showPreference: boolean;
};

// Variant type display configuration
const VARIANT_CONFIG: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
  'lower_tf': {
    label: 'Lower T/F',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    description: 'Basic recognition (True/False)'
  },
  'lower_mcq': {
    label: 'Lower MCQ',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50 border-indigo-200',
    description: 'Foundation check (Multiple Choice)'
  },
  'same_mcq': {
    label: 'Same MCQ',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    description: 'Parallel difficulty check'
  },
  'higher_mcq': {
    label: 'Higher MCQ',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    description: 'Transfer/application'
  },
  'open_confirm': {
    label: 'Open Confirm',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 border-purple-200',
    description: 'Verify reasoning (open-ended)'
  },
  'open_diagnose': {
    label: 'Open Diagnose',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    description: 'Identify misconception (open-ended)'
  },
};

// Domain colors (matching database values)
const DOMAIN_COLORS: Record<string, string> = {
  'Borrowing, Interest Rates, and Financial Numeracy Knowledge': 'border-l-blue-500',
  'Behavioral and Risk Management Knowledge': 'border-l-amber-500',
  'Risk and Return Knowledge': 'border-l-green-500',
};

export default function InstructorQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedAnchor, setExpandedAnchor] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Question | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    domain: '',
    searchTerm: '',
    showPreference: false,
  });
  const router = useRouter();

  const normalizeQuestion = (raw: any): Question => {
    const rawType = (raw?.type || '').toString().toLowerCase().trim();
    const type: Question['type'] =
      rawType === 'multiple_choice' || rawType === 'multiple-choice'
        ? 'multiple-choice'
        : 'short-answer';

    const rawOptions = raw?.options;
    const options = Array.isArray(rawOptions)
      ? rawOptions
          .map((opt: any) => {
            if (typeof opt === 'string') return opt;
            if (opt && typeof opt === 'object' && typeof opt.text === 'string') return opt.text;
            return '';
          })
          .filter((opt: string) => opt.trim())
      : undefined;

    return { ...raw, type, options } as Question;
  };

  useEffect(() => {
    const token = localStorage.getItem('instructor-token');
    if (!token) {
      router.push('/instructor');
      return;
    }
    loadQuestions(token);
  }, [router]);

  const loadQuestions = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/instructor/questions', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('instructor-token');
          router.push('/instructor');
          return;
        }
        throw new Error('Failed to load questions');
      }

      const data = await response.json();
      const incoming = Array.isArray(data.questions) ? data.questions : [];
      setQuestions(incoming.map(normalizeQuestion));
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Failed to load questions data');
    } finally {
      setIsLoading(false);
    }
  };

  // Group questions: anchors with their variants
  const { anchorQuestions, variantsByAnchor, preferenceQuestions, domains, stats } = useMemo(() => {
    const anchors: Question[] = [];
    const variants: Record<string, Question[]> = {};
    const preferences: Question[] = [];
    const domainSet = new Set<string>();

    questions.forEach(q => {
      domainSet.add(q.domain);

      if (q.is_scored === false) {
        preferences.push(q);
      } else if (q.is_anchor) {
        anchors.push(q);
      } else if (q.anchor_item_id) {
        // SDM variant - identified by having anchor_item_id (or is_sdm=true)
        if (!variants[q.anchor_item_id]) {
          variants[q.anchor_item_id] = [];
        }
        variants[q.anchor_item_id].push(q);
      }
    });

    // Sort anchors by external_item_id or item_id (Q1, Q2, ... Q40)
    anchors.sort((a, b) => {
      const idA = a.external_item_id || a.item_id || '';
      const idB = b.external_item_id || b.item_id || '';
      const numA = parseInt(idA.replace(/\D/g, '') || '0');
      const numB = parseInt(idB.replace(/\D/g, '') || '0');
      return numA - numB;
    });

    // Sort variants by variant_type
    const variantOrder = ['lower_tf', 'lower_mcq', 'same_mcq', 'higher_mcq', 'open_confirm', 'open_diagnose'];
    Object.keys(variants).forEach(anchorId => {
      variants[anchorId].sort((a, b) => {
        const indexA = variantOrder.indexOf(a.variant_type?.toLowerCase() || '');
        const indexB = variantOrder.indexOf(b.variant_type?.toLowerCase() || '');
        return indexA - indexB;
      });
    });

    return {
      anchorQuestions: anchors,
      variantsByAnchor: variants,
      preferenceQuestions: preferences,
      domains: Array.from(domainSet),
      stats: {
        totalAnchors: anchors.length,
        totalVariants: Object.values(variants).flat().length,
        totalPreference: preferences.length,
      }
    };
  }, [questions]);

  // Filter anchors
  const filteredAnchors = useMemo(() => {
    return anchorQuestions.filter(q => {
      if (filters.domain && q.domain !== filters.domain) return false;
      if (filters.searchTerm && !q.question_text.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [anchorQuestions, filters]);

  const handleLogout = () => {
    localStorage.removeItem('instructor-token');
    localStorage.removeItem('instructor-name');
    router.push('/instructor');
  };

  const handleRefresh = () => {
    const token = localStorage.getItem('instructor-token');
    if (token) loadQuestions(token);
  };

  const toggleAnchor = (anchorId: string) => {
    setExpandedAnchor(expandedAnchor === anchorId ? null : anchorId);
  };

  const getVariantConfig = (variantType: string | null | undefined) => {
    const key = (variantType || '').toLowerCase();
    return VARIANT_CONFIG[key] || {
      label: variantType || 'Unknown',
      color: 'text-gray-700',
      bgColor: 'bg-gray-50 border-gray-200',
      description: ''
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-ink animate-spin mx-auto mb-4" />
          <p className="text-loyola-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-loyola-gray-200 sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/instructor/dashboard')}
                className="flex items-center gap-2 text-loyola-gray-600 hover:text-ink transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-ink">Question Bank</h1>
                <p className="text-sm text-loyola-gray-600">
                  {stats.totalAnchors} anchors · {stats.totalVariants} variants · {stats.totalPreference} preference
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="p-2 text-loyola-gray-600 hover:text-ink transition rounded-lg hover:bg-gray-100"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-loyola-gray-700 hover:text-ink transition"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ink/20 focus:border-ink"
                />
              </div>
            </div>
            <select
              value={filters.domain}
              onChange={(e) => setFilters(f => ({ ...f, domain: e.target.value }))}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ink/20 focus:border-ink"
            >
              <option value="">All Domains</option>
              {domains.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showPreference}
                onChange={(e) => setFilters(f => ({ ...f, showPreference: e.target.checked }))}
                className="w-4 h-4 text-ink rounded focus:ring-ink"
              />
              <span className="text-sm text-gray-600">Show Preference Items (Q15-Q28)</span>
            </label>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            SDM Variant Types
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {Object.entries(VARIANT_CONFIG).map(([key, config]) => (
              <div key={key} className={`px-3 py-2 rounded-lg border ${config.bgColor}`}>
                <div className={`text-sm font-medium ${config.color}`}>{config.label}</div>
                <div className="text-xs text-gray-500">{config.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Anchor Questions List */}
        <div className="space-y-3">
          {filteredAnchors.map((anchor) => {
            const variants = variantsByAnchor[anchor.item_id] || [];
            const isExpanded = expandedAnchor === anchor.item_id;
            const domainColor = DOMAIN_COLORS[anchor.domain] || 'border-l-gray-400';

            return (
              <div key={anchor.item_id} className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden border-l-4 ${domainColor}`}>
                {/* Anchor Header */}
                <button
                  onClick={() => toggleAnchor(anchor.item_id)}
                  className="w-full px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition text-left"
                >
                  <div className="flex-shrink-0 mt-1">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-ink" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="px-2 py-0.5 bg-ink text-white text-xs font-bold rounded">
                        {(anchor.external_item_id || anchor.item_id || '').replace(/^Q?/, 'Q')}
                      </span>
                      <span className="text-xs text-gray-500">{anchor.domain}</span>
                      {anchor.subdomain && (
                        <span className="text-xs text-gray-400">· {anchor.subdomain}</span>
                      )}
                    </div>
                    <p className="text-gray-800 line-clamp-2">{anchor.question_text}</p>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      anchor.type === 'multiple-choice'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {anchor.type === 'multiple-choice' ? 'MCQ' : 'T/F'}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      {variants.length} variant{variants.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>

                {/* Expanded Variants */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    {/* Anchor Details */}
                    <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-ink" />
                        Anchor Question
                      </h4>
                      <p className="text-gray-800 mb-3">{anchor.question_text}</p>
                      {anchor.type === 'multiple-choice' && anchor.options && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {anchor.options.map((opt, idx) => (
                            <div key={idx} className={`px-3 py-2 rounded text-sm ${
                              anchor.key?.toUpperCase() === String.fromCharCode(65 + idx)
                                ? 'bg-green-50 border border-green-200 text-green-800'
                                : 'bg-gray-50 border border-gray-200 text-gray-700'
                            }`}>
                              <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {opt}
                              {anchor.key?.toUpperCase() === String.fromCharCode(65 + idx) && (
                                <span className="ml-2 text-xs text-green-600">✓ Correct</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Variants Grid */}
                    {variants.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-ink" />
                          SDM Variants ({variants.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {variants.map((variant) => {
                            const config = getVariantConfig(variant.variant_type);
                            return (
                              <button
                                key={variant.item_id}
                                onClick={() => setSelectedVariant(variant)}
                                className={`p-4 rounded-lg border-2 text-left hover:shadow-md transition ${config.bgColor}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-sm font-semibold ${config.color}`}>
                                    {config.label}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-xs ${
                                    variant.type === 'multiple-choice'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {variant.type === 'multiple-choice' ? 'MCQ' : 'Open'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 line-clamp-3">
                                  {variant.question_text}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No SDM variants found for this anchor</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Preference Questions Section */}
        {filters.showPreference && preferenceQuestions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              Preference Items (Q15-Q28) - Not Scored
            </h2>
            <div className="space-y-2">
              {preferenceQuestions.map((q) => (
                <div key={q.item_id} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded">
                      {(q.external_item_id || q.item_id || '').replace(/^Q?/, 'Q')}
                    </span>
                    <span className="text-xs text-amber-700">{q.domain}</span>
                  </div>
                  <p className="text-gray-800 mb-3">{q.question_text}</p>
                  {q.type === 'multiple-choice' && q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {q.options.map((opt, idx) => (
                        <div key={idx} className="px-3 py-2 rounded text-sm bg-white border border-amber-200 text-gray-700">
                          <span className="font-medium text-amber-700 mr-2">{String.fromCharCode(65 + idx)}.</span>
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredAnchors.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No questions found matching your criteria</p>
          </div>
        )}
      </main>

      {/* Variant Detail Modal */}
      {selectedVariant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedVariant(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getVariantConfig(selectedVariant.variant_type).color} ${getVariantConfig(selectedVariant.variant_type).bgColor}`}>
                  {getVariantConfig(selectedVariant.variant_type).label}
                </span>
              </div>
              <button
                onClick={() => setSelectedVariant(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <span className="text-2xl text-gray-400 hover:text-gray-600">&times;</span>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Linked to Anchor</p>
                <p className="text-sm text-ink font-medium">Q{selectedVariant.anchor_item_id?.replace(/\D/g, '')}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Question</h3>
                <p className="text-gray-800 text-lg leading-relaxed">{selectedVariant.question_text}</p>
              </div>

              {selectedVariant.type === 'multiple-choice' && selectedVariant.options && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Answer Options</h3>
                  <div className="space-y-2">
                    {selectedVariant.options.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isCorrect = selectedVariant.key?.toUpperCase() === letter;
                      return (
                        <div key={idx} className={`px-4 py-3 rounded-lg border-2 ${
                          isCorrect
                            ? 'bg-green-50 border-green-300'
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <span className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-gray-600'}`}>
                            {letter}.
                          </span>
                          <span className={`ml-2 ${isCorrect ? 'text-green-800' : 'text-gray-700'}`}>
                            {opt}
                          </span>
                          {isCorrect && (
                            <span className="ml-3 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                              Correct Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedVariant.type === 'short-answer' && (
                <div className="mb-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-700">
                      <span className="font-semibold">Open-ended question:</span> Student provides a free-text response that is scored using AI rubrics.
                    </p>
                  </div>
                </div>
              )}

              {selectedVariant.trigger_condition && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Trigger Condition</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    {selectedVariant.trigger_condition}
                  </p>
                </div>
              )}

              {selectedVariant.explanation && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Explanation / Rubric</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg">
                    {selectedVariant.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
