'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, X, ChevronLeft, ChevronRight, Shield, AlertTriangle, Maximize2 } from 'lucide-react';

type Question = {
  id: string;
  type: 'multiple_choice' | 'short_answer';
  text: string;
  options?: Array<{ id: string; text: string }>;
  domain: string;
  subdomain?: string | null; // Subcategory for SDM selection
  correct_answer?: string;
  is_sdm?: boolean | null;
  is_scored?: boolean | null; // false for preference items Q15-Q28 (don't trigger SDM)
  external_item_id?: string | null; // Original question ID (1-40)
  anchor_item_id?: string | null;
  variant_type?: string | null;
  trigger_condition?: string | null;
};

// ============================================================================
// SDM-10 IMPLEMENTATION - Based on Source of Truth (sdm.md)
// ============================================================================

// SDM Configuration Constants
const SDM_SIZE = 10;           // Total items in SDM-10
const DOMAIN_MINIMUM = 2;      // Minimum items per domain
const SUBCATEGORY_CAP = 2;     // Maximum items per subcategory
const OPEN_ENDED_CAP = 3;      // Maximum open-ended items

// T/F anchors have 50% guess rate (from source of truth Section 3.1)
// These get elevated Need score for Correct + Mid (2 instead of 1)
const TF_ANCHORS = new Set(['Q2', 'Q3', 'Q11', 'Q30', 'Q35', 'Q36', 'Q39']);

// Domain order for tiebreaking (from source of truth Section 8.1)
const DOMAIN_ORDER = ['Borrowing & Credit', 'Risk Management', 'Investment & Risk'];

// Response types
type ResponseType = 'correct' | 'incorrect' | 'do_not_know';

// Scored anchor data structure
type ScoredAnchor = {
  anchorId: string;
  needScore: number;
  responseType: ResponseType;
  confidence: number | null;  // null for Do Not Know
  primaryVariant: string;
  domain: string;
  subcategory: string;
  anchorFormat: 'MCQ' | 'TF';
  assignedVariant?: string;
  isOpenEnded?: boolean;
};

// Get anchor format based on external_item_id (Q1-Q40)
const getAnchorFormat = (externalItemId: string | null | undefined): 'MCQ' | 'TF' => {
  if (!externalItemId) return 'MCQ';
  const normalized = normalizeAnchorId(externalItemId);
  return TF_ANCHORS.has(normalized) ? 'TF' : 'MCQ';
};

// Normalize anchor ID by removing "#" suffix and standardizing format
// SDM item bank uses "Q1#" for anchors, but we need to match with "Q1" or "1"
const normalizeAnchorId = (id: string | null | undefined): string => {
  if (!id) return '';
  // Remove "#" suffix, spaces, and normalize to uppercase
  let normalized = id.trim().toUpperCase().replace(/#$/, '');
  // If it's just a number, prefix with "Q"
  if (/^\d+$/.test(normalized)) {
    normalized = `Q${normalized}`;
  }
  return normalized;
};

// Check if two anchor IDs match (handles "Q1#", "Q1", "1" as equivalent)
const anchorIdsMatch = (id1: string | null | undefined, id2: string | null | undefined): boolean => {
  return normalizeAnchorId(id1) === normalizeAnchorId(id2);
};

// ============================================================================
// NEED SCORE CALCULATION (Source of Truth Table 4)
// ============================================================================
// | Response    | Confidence | MCQ Need | T/F Need | Signal Status |
// |-------------|------------|----------|----------|---------------|
// | Incorrect   | High (3)   | 5        | 5        | Conflict      |
// | Correct     | Low (1)    | 5        | 5        | Conflict      |
// | Do Not Know | N/A        | 4        | 4        | Absent        |
// | Incorrect   | Mid (2)    | 3        | 3        | Partial       |
// | Correct     | Mid (2)    | 1        | 2        | T/F elevated  |
// | Incorrect   | Low (1)    | 2        | 2        | Aligned       |
// | Correct     | High (3)   | 0        | 0        | Aligned       |
// ============================================================================
const calculateNeedScore = (
  responseType: ResponseType,
  confidence: number | null,
  anchorFormat: 'MCQ' | 'TF'
): number => {
  // DO NOT KNOW: Signal absent, no reasoning to elicit
  if (responseType === 'do_not_know') {
    return 4;
  }

  // INCORRECT responses
  if (responseType === 'incorrect') {
    if (confidence === 3) return 5;  // Confident misconception (signal conflict)
    if (confidence === 2) return 3;  // Uncertain error (partial)
    return 2;                         // Acknowledged gap (aligned) - confidence === 1
  }

  // CORRECT responses
  if (responseType === 'correct') {
    if (confidence === 1) return 5;  // Possible guess (signal conflict)
    if (confidence === 2) {
      // FORMAT-AWARE: T/F gets elevated Need due to 50% guess rate
      return anchorFormat === 'TF' ? 2 : 1;
    }
    return 0;                         // Demonstrated mastery (aligned) - confidence === 3
  }

  return 0;
};

// ============================================================================
// VARIANT TYPE ASSIGNMENT (Source of Truth Table 11)
// ============================================================================
// | Need | Response Pattern            | Primary Variant | Fallback        |
// |------|----------------------------|-----------------|-----------------|
// | 5    | Incorrect + High           | Open_Diagnose   | Lower_MCQ       |
// | 5    | Correct + Low              | Open_Confirm    | Same_MCQ        |
// | 4    | Do Not Know                | Lower_MCQ       | -               |
// | 3    | Incorrect + Mid            | Lower_MCQ       | -               |
// | 2    | Incorrect + Low / TF C+Mid | Lower_TF        | -               |
// | 1    | MCQ Correct + Mid          | Same_MCQ        | -               |
// | 0    | Correct + High             | Higher_MCQ      | -               |
// ============================================================================
const getPrimaryVariant = (
  responseType: ResponseType,
  confidence: number | null,
  needScore: number
): string => {
  // Need = 5: Two different variants based on pattern
  if (needScore === 5) {
    if (responseType === 'incorrect') {
      return 'open_diagnose';  // Identify misconception
    }
    return 'open_confirm';      // Verify reasoning (correct + low)
  }

  // Need = 4: Do Not Know
  if (needScore === 4) return 'lower_mcq';

  // Need = 3: Incorrect + Mid
  if (needScore === 3) return 'lower_mcq';

  // Need = 2: Incorrect + Low OR T/F Correct + Mid
  if (needScore === 2) return 'lower_tf';

  // Need = 1: MCQ Correct + Mid
  if (needScore === 1) return 'same_mcq';

  // Need = 0: Correct + High
  return 'higher_mcq';
};

// Fallback variants when open-ended cap is reached (Source of Truth Table 12)
const FALLBACK_VARIANTS: Record<string, string> = {
  'open_diagnose': 'lower_mcq',
  'open_confirm': 'same_mcq',
};

// Check if variant is open-ended
const isOpenEndedVariant = (variant: string): boolean => {
  const v = variant.toLowerCase();
  return v.includes('open_diagnose') || v.includes('open_confirm');
};

// Presentation order for SDM-10 (Source of Truth Section 11)
// Open_Diagnose first (confident misconceptions need full attention)
// Open_Confirm last (verification after reflection)
const VARIANT_PRESENTATION_ORDER: Record<string, number> = {
  'open_diagnose': 0,
  'lower_mcq': 1,
  'lower_tf': 2,
  'same_mcq': 3,
  'higher_mcq': 4,
  'open_confirm': 5,
};

type SessionData = {
  courseCode: string;
  studentId: string;
  attemptType: 'pre' | 'post';
  startedAt: string;
  isTestUser?: boolean;
  attemptId?: string | null;
  userId?: string;
  courseId?: string;
};

type SubmittedResponse = {
  itemId: string;
  answer: string;
  confidence: number;
};

const mockQuestions: Question[] = [
  {
    id: 'q1',
    type: 'multiple_choice',
    text: 'If inflation increases while your income stays the same, your purchasing power will:',
    options: [
      { id: 'a', text: 'Increase' },
      { id: 'b', text: 'Stay the same' },
      { id: 'c', text: 'Decrease' },
      { id: 'd', text: 'Become unpredictable' },
    ],
    domain: 'Financial Planning',
    correct_answer: 'c',
  },
  {
    id: 'q2',
    type: 'multiple_choice',
    text: 'What is the primary purpose of a budget?',
    options: [
      { id: 'a', text: 'To track income and expenses' },
      { id: 'b', text: 'To limit spending' },
      { id: 'c', text: 'To save money on taxes' },
      { id: 'd', text: 'To get approved for loans' },
    ],
    domain: 'Budgeting',
    correct_answer: 'a',
  },
  {
    id: 'q3',
    type: 'short_answer',
    text: 'Explain the difference between a debit card and a credit card.',
    domain: 'Credit Management',
    correct_answer: 'Debit cards withdraw money directly from your bank account, while credit cards allow you to borrow money that you must pay back later.',
  },
];

const shuffleQuestions = (questions: Question[]) => {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

type ConfidenceBucket = 'low' | 'mid' | 'high';

// Confidence scale is 1-3: 1=Low, 2=Mid, 3=High
const getConfidenceBucket = (confidence: number): ConfidenceBucket => {
  if (confidence === 1) return 'low';
  if (confidence === 2) return 'mid';
  return 'high'; // confidence === 3
};

// Presentation order weight for sorting
const getVariantPresentationWeight = (variantType: string | null | undefined): number => {
  const vt = (variantType || '').toLowerCase();
  return VARIANT_PRESENTATION_ORDER[vt] ?? 99;
};

// Shuffle answer options for multiple choice questions (while preserving correct answer)
const shuffleOptions = (options: Array<{id: string, text: string}>): Array<{id: string, text: string}> => {
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function AssessmentPage() {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confidenceRatings, setConfidenceRatings] = useState<Record<string, number>>({});
  const [answerCorrectness, setAnswerCorrectness] = useState<Record<string, boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState(90 * 60); // 90 minutes for 30 questions (3 min/question)
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sdmBank, setSdmBank] = useState<Question[]>([]);
  const [sdmAppended, setSdmAppended] = useState(false);
  // Track scored anchors for SDM-10 selection (updated as student answers each anchor)
  const [scoredAnchors, setScoredAnchors] = useState<Map<string, ScoredAnchor>>(new Map());
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAcknowledgedHonorCode, setHasAcknowledgedHonorCode] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestUser, setIsTestUser] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const router = useRouter();

  // Calculate real-time scores for test user
  const calculateScores = useCallback(() => {
    const domainScores: Record<string, { correct: number; total: number }> = {};

    questions.forEach((q) => {
      if (q.is_scored !== false && answers[q.id] && q.correct_answer) {
        const domain = q.domain || 'General';
        if (!domainScores[domain]) {
          domainScores[domain] = { correct: 0, total: 0 };
        }
        domainScores[domain].total++;

        const isCorrect = answers[q.id]?.toLowerCase() === q.correct_answer?.toLowerCase();
        if (isCorrect) {
          domainScores[domain].correct++;
        }
      }
    });

    const newScores: Record<string, number> = {};
    Object.entries(domainScores).forEach(([domain, data]) => {
      newScores[domain] = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    });

    // Calculate overall mastery
    const totalCorrect = Object.values(domainScores).reduce((sum, d) => sum + d.correct, 0);
    const totalAnswered = Object.values(domainScores).reduce((sum, d) => sum + d.total, 0);
    newScores['Overall Mastery'] = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    newScores['Needs Improvement'] = 100 - newScores['Overall Mastery'];

    setScores(newScores);
  }, [questions, answers]);

  // Update scores when answers change (for test user)
  useEffect(() => {
    if (isTestUser && Object.keys(answers).length > 0) {
      calculateScores();
    }
  }, [isTestUser, answers, calculateScores]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const session = localStorage.getItem('assessment-session');

    if (!session) {
      router.replace('/start');
      return;
    }

    // Fetch real questions from API
    const loadQuestions = async () => {
      try {
        const [anchorResponse, sdmResponse] = await Promise.all([
          fetch('/api/items?kind=anchor'),
          fetch('/api/items?kind=sdm'),
        ]);

        const anchorData = await anchorResponse.json();
        const sdmData = await sdmResponse.json();

        const toQuestion = (item: any): Question => {
          return {
            id: item.item_id,
            type: item.type,
            text: item.stem,
            options: item.options, // Keep options in original order
            domain: item.domain,
            subdomain: item.subdomain ?? null, // Subcategory for SDM selection
            correct_answer: item.key || item.correct_answer,
            is_sdm: item.is_sdm ?? null,
            is_scored: item.is_scored ?? true, // Default true, false for preference items Q15-Q28
            external_item_id: item.external_item_id ?? null,
            anchor_item_id: item.anchor_item_id ?? null,
            variant_type: item.variant_type ?? null,
            trigger_condition: item.trigger_condition ?? null,
          };
        };

        const anchors: Question[] = Array.isArray(anchorData?.items)
          ? anchorData.items.map(toQuestion)
          : [];

        const sdmItems: Question[] = Array.isArray(sdmData?.items)
          ? sdmData.items.map(toQuestion)
          : [];

        // Keep questions in original order (source of truth order)
        if (anchors.length === 0) {
          const response = await fetch('/api/items');
          const data = await response.json();
          if (data.success && Array.isArray(data.items)) {
            setQuestions(data.items.map(toQuestion));
          } else {
            setQuestions(mockQuestions);
          }
        } else {
          setQuestions(anchors);
        }

        setSdmBank(sdmItems);
        setSdmAppended(false);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load questions:', error);
        // Fallback to mock questions
        setQuestions(mockQuestions);
        setIsLoading(false);
      }
    };

    try {
      const parsedSession = JSON.parse(session) as SessionData;

      if (
        parsedSession?.courseCode &&
        parsedSession?.studentId &&
        parsedSession?.attemptType &&
        parsedSession?.startedAt
      ) {
        setSessionData(parsedSession);
        setIsTestUser(parsedSession.isTestUser || false);
        setTimeRemaining(90 * 60); // 90 minutes for 30 questions

        // Load questions first, then check for saved responses
        const loadAndResume = async () => {
          await loadQuestions();

          // Check for saved responses to resume
          if (parsedSession.attemptId || (parsedSession.userId && parsedSession.courseId)) {
            try {
              const params = new URLSearchParams();
              if (parsedSession.attemptId) {
                params.set('attemptId', parsedSession.attemptId);
              } else {
                params.set('userId', parsedSession.userId || '');
                params.set('courseId', parsedSession.courseId || '');
              }

              const resumeResponse = await fetch(`/api/assessment/resume?${params}`);
              const resumeData = await resumeResponse.json();

              if (resumeData.success && resumeData.hasAttempt && resumeData.responses.length > 0) {
                // Restore saved answers and confidence ratings
                const savedAnswers: Record<string, string> = {};
                const savedConfidence: Record<string, number> = {};

                resumeData.responses.forEach((r: any) => {
                  if (r.answer) savedAnswers[r.itemId] = r.answer;
                  if (r.confidence) savedConfidence[r.itemId] = r.confidence;
                });

                setAnswers(savedAnswers);
                setConfidenceRatings(savedConfidence);
                setHasStarted(true); // Auto-start if resuming
              }
            } catch (resumeError) {
              console.error('Error loading saved responses:', resumeError);
            }
          }
        };

        void loadAndResume();
      } else {
        throw new Error('Session data missing required fields');
      }
    } catch (error) {
      console.error('Error parsing session data:', error);
      localStorage.removeItem('assessment-session');
      router.replace('/start');
    }
  }, [router]);

  // Tab detection and warning
  useEffect(() => {
    if (!sessionData || !hasAcknowledgedHonorCode) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs/windows or minimized browser
        setTabSwitches((prev) => {
          const newCount = prev + 1;
          if (newCount > 0) {
            setShowTabWarning(true);
            // Log tab switch (could send to API for tracking)
            console.warn(`Tab switch detected. Total switches: ${newCount}`);
          }
          return newCount;
        });
      } else {
        // User returned to tab
        setShowTabWarning(false);
      }
    };

    // Disable common keyboard shortcuts that could be used for cheating
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12 (dev tools), Ctrl+Shift+I (dev tools), Ctrl+Shift+C (inspect)
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C')) ||
          (e.ctrlKey && e.shiftKey && e.key === 'J')) {
        e.preventDefault();
        return false;
      }
      // Prevent Ctrl+C, Ctrl+V, Ctrl+A (copy, paste, select all)
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a')) {
        // Allow within text inputs, but show warning
        const target = e.target as HTMLElement;
        if (target.tagName !== 'TEXTAREA' && target.tagName !== 'INPUT') {
          e.preventDefault();
          return false;
        }
      }
    };

    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Allow right-click in text inputs for normal editing
      if (target.tagName !== 'TEXTAREA' && target.tagName !== 'INPUT') {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [sessionData, hasAcknowledgedHonorCode]);

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Timer
  useEffect(() => {
    if (!sessionData || !hasAcknowledgedHonorCode) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionData, hasAcknowledgedHonorCode]);

  const handleSubmit = useCallback(async () => {
    if (!sessionData || isSubmitting) {
      return;
    }

    if (questions.length === 0) {
      alert('No assessment questions are available. Please refresh and try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const sessionStart = sessionData.startedAt ? new Date(sessionData.startedAt) : null;
      const timeSpent = sessionStart
        ? Math.max(0, Math.floor((Date.now() - sessionStart.getTime()) / 1000))
        : undefined;

      const formattedResponses = Object.entries(answers).reduce<SubmittedResponse[]>((acc, [questionId, answer]) => {
        const question = questions.find((q) => q.id === questionId);

        if (!question) {
          return acc;
        }

        acc.push({
          itemId: question.id,
          answer,
          confidence: confidenceRatings[question.id] ?? 3,
        });

        return acc;
      }, []);

      const response = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseCode: sessionData.courseCode,
          studentId: sessionData.studentId,
          attemptType: sessionData.attemptType,
          responses: formattedResponses,
          timeSpent,
          metadata: {
            tabSwitches,
            isFullscreen
          }
        }),
      });

      console.log('API response status:', response.status);
      console.log('API response ok:', response.ok);

      if (!response.ok) {
        const result = await response.json();
        console.error('API returned error:', result);
        throw new Error(result?.error ?? 'Submission failed');
      }

      const result = await response.json();
      console.log('API success response:', result);

      if (typeof window !== 'undefined') {
        localStorage.removeItem('assessment-session');
      }

      router.push('/results');
    } catch (error) {
      console.error('Submission error:', error);
      const message =
        error instanceof Error
          ? `An error occurred while submitting your assessment: ${error.message}`
          : 'An error occurred while submitting your assessment. Please try again.';
      alert(message);
      setIsSubmitting(false);
    }
  }, [answers, confidenceRatings, isSubmitting, questions, router, sessionData]);

  useEffect(() => {
    if (!sessionData || timeRemaining > 0) {
      return;
    }

    void handleSubmit();
  }, [handleSubmit, sessionData, timeRemaining]);

  const isLoadingQuestions = questions.length === 0;
  const currentQuestion = !isLoadingQuestions ? questions[currentIndex] : null;
  const TOTAL_QUESTIONS = 50; // 40 anchor + 10 SDM
  const progress = !isLoadingQuestions ? ((currentIndex + 1) / TOTAL_QUESTIONS) * 100 : 0;
  const currentConfidence = currentQuestion ? confidenceRatings[currentQuestion.id] ?? 0 : 0;
  const hasSelectedConfidence = currentConfidence > 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const checkAnswerCorrectness = (questionId: string, answer: string): boolean => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !question.correct_answer) return false;
    
    if (question.type === 'multiple_choice') {
      return answer === question.correct_answer;
    } else {
      // For short answers, do a simple text comparison (case insensitive)
      return answer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
    
    // Check if the answer is correct and update correctness state
    const isCorrect = checkAnswerCorrectness(questionId, answer);
    setAnswerCorrectness((prev) => ({
      ...prev,
      [questionId]: isCorrect,
    }));
  };

  // ============================================================================
  // SDM-10 SELECTION ALGORITHM (Source of Truth sdm.md Section 10)
  // ============================================================================
  // Phase 1: Domain Minimum Enforcement (2 items per domain)
  // Phase 2: Need-Based Slot Filling (remaining 4 slots by Need priority)
  // Phase 3: Fallback for Underfilled Slots (use mastery items if needed)
  // ============================================================================
  const selectSdmQuestions = useCallback((): Question[] => {
    if (sdmBank.length === 0) return [];

    // Use pre-computed scored anchors from state (updated incrementally)
    const anchors = Array.from(scoredAnchors.values());

    if (isTestUser) {
      console.log('SDM: Using pre-computed anchor scores:', anchors.map(a => ({
        id: a.anchorId,
        need: a.needScore,
        variant: a.primaryVariant,
        domain: a.domain
      })));
    }

    // Generate seeded random values for reproducible tiebreaking
    const seed = 42;
    const randomValues: Record<string, number> = {};
    let rngState = seed;
    anchors.forEach(a => {
      rngState = (rngState * 1103515245 + 12345) & 0x7fffffff;
      randomValues[a.anchorId] = rngState / 0x7fffffff;
    });

    // Tiebreaker sort key (Source of Truth Section 8.1)
    // 1. Domain deficit (below minimum first)
    // 2. Format priority (T/F before MCQ)
    // 3. Subcategory spread (fewer items selected first)
    // 4. Domain order (B&C → RM → I&R)
    // 5. Seeded random
    const createSortKey = (
      anchor: ScoredAnchor,
      domainCounts: Record<string, number>,
      subcategoryCounts: Record<string, number>
    ): [number, number, number, number, number, number] => {
      const domainDeficit = (domainCounts[anchor.domain] || 0) < DOMAIN_MINIMUM ? 0 : 1;
      const formatPriority = anchor.anchorFormat === 'TF' ? 0 : 1;
      const subcategoryCount = subcategoryCounts[anchor.subcategory] || 0;
      const domainOrder = DOMAIN_ORDER.indexOf(anchor.domain);
      const randomValue = randomValues[anchor.anchorId] || 0.5;

      return [
        -anchor.needScore,  // Higher Need first (negative for ascending sort)
        domainDeficit,
        formatPriority,
        subcategoryCount,
        domainOrder >= 0 ? domainOrder : 99,
        randomValue
      ];
    };

    // Helper: Find SDM variant for an anchor with fallback logic
    const findVariantForAnchor = (
      anchor: ScoredAnchor,
      openEndedCount: number
    ): { variant: Question | null; variantType: string; isOpenEnded: boolean } => {
      // Find SDM variants for this anchor (handles Q1# vs Q1 vs 1 format differences)
      const candidates = sdmBank.filter(q => anchorIdsMatch(q.anchor_item_id, anchor.anchorId));
      if (candidates.length === 0) {
        return { variant: null, variantType: '', isOpenEnded: false };
      }

      let variantType = anchor.primaryVariant;
      let isOpenEnded = isOpenEndedVariant(variantType);

      // Apply fallback if open-ended cap reached (Source of Truth Table 12)
      if (isOpenEnded && openEndedCount >= OPEN_ENDED_CAP) {
        const fallback = FALLBACK_VARIANTS[variantType];
        if (fallback) {
          variantType = fallback;
          isOpenEnded = false;
        }
      }

      // Find matching variant
      const match = candidates.find(q =>
        q.variant_type?.toLowerCase().includes(variantType)
      );

      if (match) {
        return { variant: match, variantType, isOpenEnded };
      }

      // Fallback: return any available variant (respecting open-ended cap)
      for (const candidate of candidates) {
        const candidateIsOpenEnded = isOpenEndedVariant(candidate.variant_type || '');
        if (candidateIsOpenEnded && openEndedCount >= OPEN_ENDED_CAP) {
          continue;
        }
        return {
          variant: candidate,
          variantType: candidate.variant_type || '',
          isOpenEnded: candidateIsOpenEnded
        };
      }

      return { variant: null, variantType: '', isOpenEnded: false };
    };

    // Selection state
    const selectedItems: Array<{ anchor: ScoredAnchor; variant: Question; variantType: string; isOpenEnded: boolean }> = [];
    const selectedAnchorIds = new Set<string>();
    const domainCounts: Record<string, number> = {};
    const subcategoryCounts: Record<string, number> = {};
    let openEndedCount = 0;

    // PHASE 1: Domain Minimum Enforcement (2 items per domain)
    for (const domain of DOMAIN_ORDER) {
      // Sort anchors in this domain by priority
      const domainAnchors = anchors
        .filter(a => a.domain === domain && !selectedAnchorIds.has(a.anchorId))
        .sort((a, b) => {
          const keyA = createSortKey(a, domainCounts, subcategoryCounts);
          const keyB = createSortKey(b, domainCounts, subcategoryCounts);
          for (let i = 0; i < keyA.length; i++) {
            if (keyA[i] !== keyB[i]) return keyA[i] - keyB[i];
          }
          return 0;
        });

      let domainItemsSelected = 0;
      for (const anchor of domainAnchors) {
        if (domainItemsSelected >= DOMAIN_MINIMUM) break;
        if (selectedItems.length >= SDM_SIZE) break;
        if ((subcategoryCounts[anchor.subcategory] || 0) >= SUBCATEGORY_CAP) continue;

        const { variant, variantType, isOpenEnded } = findVariantForAnchor(anchor, openEndedCount);
        if (variant && !selectedAnchorIds.has(anchor.anchorId)) {
          selectedItems.push({ anchor, variant, variantType, isOpenEnded });
          selectedAnchorIds.add(anchor.anchorId);
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
          subcategoryCounts[anchor.subcategory] = (subcategoryCounts[anchor.subcategory] || 0) + 1;
          if (isOpenEnded) openEndedCount++;
          domainItemsSelected++;
        }
      }
    }

    // PHASE 2: Need-Based Slot Filling (fill remaining slots by priority)
    if (selectedItems.length < SDM_SIZE) {
      // Re-sort all unselected anchors with updated counts
      const remainingAnchors = anchors
        .filter(a => !selectedAnchorIds.has(a.anchorId))
        .sort((a, b) => {
          const keyA = createSortKey(a, domainCounts, subcategoryCounts);
          const keyB = createSortKey(b, domainCounts, subcategoryCounts);
          for (let i = 0; i < keyA.length; i++) {
            if (keyA[i] !== keyB[i]) return keyA[i] - keyB[i];
          }
          return 0;
        });

      for (const anchor of remainingAnchors) {
        if (selectedItems.length >= SDM_SIZE) break;
        if ((subcategoryCounts[anchor.subcategory] || 0) >= SUBCATEGORY_CAP) continue;

        const { variant, variantType, isOpenEnded } = findVariantForAnchor(anchor, openEndedCount);
        if (variant && !selectedAnchorIds.has(anchor.anchorId)) {
          selectedItems.push({ anchor, variant, variantType, isOpenEnded });
          selectedAnchorIds.add(anchor.anchorId);
          domainCounts[anchor.domain] = (domainCounts[anchor.domain] || 0) + 1;
          subcategoryCounts[anchor.subcategory] = (subcategoryCounts[anchor.subcategory] || 0) + 1;
          if (isOpenEnded) openEndedCount++;
        }
      }
    }

    // PHASE 3: Fallback for Underfilled Slots (use Need=0 mastery items)
    if (selectedItems.length < SDM_SIZE) {
      const masteryAnchors = anchors
        .filter(a => a.needScore === 0 && !selectedAnchorIds.has(a.anchorId))
        .sort(() => randomValues[anchors[0]?.anchorId] - 0.5); // Shuffle with seed

      for (const anchor of masteryAnchors) {
        if (selectedItems.length >= SDM_SIZE) break;
        if ((subcategoryCounts[anchor.subcategory] || 0) >= SUBCATEGORY_CAP) continue;

        const { variant, variantType, isOpenEnded } = findVariantForAnchor(anchor, openEndedCount);
        if (variant) {
          selectedItems.push({ anchor, variant, variantType, isOpenEnded });
          selectedAnchorIds.add(anchor.anchorId);
          subcategoryCounts[anchor.subcategory] = (subcategoryCounts[anchor.subcategory] || 0) + 1;
        }
      }
    }

    // ORDER FOR PRESENTATION (Source of Truth Section 11)
    // Open_Diagnose first, then Lower_MCQ, Lower_TF, Same_MCQ, Higher_MCQ, Open_Confirm last
    const orderedItems = [...selectedItems].sort((a, b) => {
      const orderA = getVariantPresentationWeight(a.variantType);
      const orderB = getVariantPresentationWeight(b.variantType);
      if (orderA !== orderB) return orderA - orderB;
      // Within same variant type, sort by Need score (higher first)
      return b.anchor.needScore - a.anchor.needScore;
    });

    if (isTestUser) {
      console.log('SDM: Selected items (presentation order):', orderedItems.map(item => ({
        anchorId: item.anchor.anchorId,
        need: item.anchor.needScore,
        variant: item.variantType,
        domain: item.anchor.domain,
        isOpenEnded: item.isOpenEnded
      })));
      console.log('SDM: Domain counts:', domainCounts);
      console.log('SDM: Subcategory counts:', subcategoryCounts);
      console.log('SDM: Open-ended count:', openEndedCount);

      // Validation
      const errors: string[] = [];
      if (orderedItems.length !== SDM_SIZE && orderedItems.length > 0) {
        errors.push(`Size is ${orderedItems.length}, expected ${SDM_SIZE}`);
      }
      for (const domain of DOMAIN_ORDER) {
        if ((domainCounts[domain] || 0) < DOMAIN_MINIMUM) {
          errors.push(`Domain '${domain}' has ${domainCounts[domain] || 0} items, minimum is ${DOMAIN_MINIMUM}`);
        }
      }
      for (const [subcat, count] of Object.entries(subcategoryCounts)) {
        if (count > SUBCATEGORY_CAP) {
          errors.push(`Subcategory '${subcat}' has ${count} items, cap is ${SUBCATEGORY_CAP}`);
        }
      }
      if (openEndedCount > OPEN_ENDED_CAP) {
        errors.push(`Open-ended count is ${openEndedCount}, cap is ${OPEN_ENDED_CAP}`);
      }
      if (errors.length > 0) {
        console.warn('SDM: Validation errors:', errors);
      } else {
        console.log('SDM: Validation passed');
      }
    }

    return orderedItems.map(item => item.variant);
  }, [scoredAnchors, sdmBank, isTestUser]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      const current = questions[currentIndex];
      const atEndOfAnchors = !sdmAppended && !current?.is_sdm;
      if (atEndOfAnchors) {
        // Select SDM questions using the proper algorithm from source of truth
        // Items are already ordered for presentation (Open_Diagnose first, Open_Confirm last)
        const selectedSdm = selectSdmQuestions();

        if (selectedSdm.length > 0) {
          if (isTestUser) {
            console.log(`SDM: Appending ${selectedSdm.length} SDM questions (Q41-Q${40 + selectedSdm.length})`);
          }

          setSdmAppended(true);
          setQuestions((prev) => [...prev, ...selectedSdm]);
          setCurrentIndex((prev) => prev + 1);
          return;
        }
      }

      void handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleConfidenceSelect = (value: number) => {
    if (!currentQuestion) {
      return;
    }

    setConfidenceRatings((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));

    // Update scored anchors incrementally for SDM-10 selection (Source of Truth Section 9)
    // This spreads computation across answers for seamless Q40→Q41 transition
    const isAnchorQuestion = !currentQuestion.is_sdm;
    const isScoredItem = currentQuestion.is_scored !== false;
    const answer = answers[currentQuestion.id];

    if (isAnchorQuestion && isScoredItem && answer) {
      const isCorrect = checkAnswerCorrectness(currentQuestion.id, answer);

      // Determine response type
      let responseType: ResponseType = isCorrect ? 'correct' : 'incorrect';
      // Note: "Do Not Know" would be detected from the answer value itself
      // For now, we treat unanswered or explicit DNK selection as do_not_know

      // Get anchor format (T/F vs MCQ) based on external_item_id or item id
      const anchorFormat = getAnchorFormat(currentQuestion.external_item_id || currentQuestion.id);

      // Calculate Need score using source of truth Table 4
      const needScore = calculateNeedScore(responseType, value, anchorFormat);

      // Get primary variant type using source of truth Table 11
      const primaryVariant = getPrimaryVariant(responseType, value, needScore);

      const subcategory = currentQuestion.subdomain || currentQuestion.domain || 'General';
      const domain = currentQuestion.domain || 'General';

      setScoredAnchors((prev) => {
        const newMap = new Map(prev);

        // Create or update scored anchor
        const scoredAnchor: ScoredAnchor = {
          anchorId: currentQuestion.id,
          needScore,
          responseType,
          confidence: value,
          primaryVariant,
          domain,
          subcategory,
          anchorFormat,
        };

        newMap.set(currentQuestion.id, scoredAnchor);

        if (isTestUser) {
          console.log(`SDM: Scored anchor ${currentQuestion.external_item_id || currentQuestion.id} - Need: ${needScore}, Variant: ${primaryVariant}, Format: ${anchorFormat} (${isCorrect ? 'correct' : 'incorrect'} + conf ${value})`);
        }

        return newMap;
      });
    }
  };

  // Honor code acknowledgment modal
  if (!hasAcknowledgedHonorCode && sessionData && questions.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg border-2 border-loyola-gray-200 max-w-2xl w-full p-8">
          <div className="text-center mb-6">
            <Shield className="w-16 h-16 text-loyola-maroon mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-loyola-gray-900 mb-2">Academic Integrity Agreement</h2>
            <p className="text-loyola-gray-600">To assess your financial knowledge, you must answer these questions without assistance.</p>
          </div>

          <div className="bg-loyola-gold/10 border-2 border-loyola-gold/30 rounded-lg p-6 mb-6">
            <div className="space-y-4 text-sm text-loyola-gray-700">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-loyola-maroon flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-2">Independent Work Required</p>
                  <p>You must complete this assessment independently, without assistance from:</p>
                  <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
                    <li>External websites (Google, ChatGPT, Wikipedia, etc.)</li>
                    <li>Other people (classmates, tutors, family members)</li>
                    <li>AI tools or chatbots</li>
                    <li>Study materials, notes, or textbooks</li>
                    <li>Communication tools (messaging, phone calls, etc.)</li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-loyola-gray-200 pt-4">
                <p className="font-semibold mb-2">Time requirement:</p>
                <p>Normally, it should take you 90 minutes to complete this assessment. The timer starts when you begin.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                localStorage.removeItem('assessment-session');
                router.push('/start');
              }}
              className="flex-1 border-2 border-loyola-gray-300 text-loyola-gray-700 hover:bg-loyola-gray-50 font-medium py-3 px-6 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setHasAcknowledgedHonorCode(true);
                // Try to enter fullscreen (will fail if user doesn't allow, but that's OK)
                if (document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen().catch(() => {
                    // User declined or browser doesn't support - continue anyway
                  });
                }
              }}
              className="flex-1 bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-medium py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              I Acknowledge and Agree - Start Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionData || !currentQuestion || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-loyola-gray-600">
          <p className="text-lg font-medium">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Fullscreen toggle handler
  const handleFullscreenToggle = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.warn('Fullscreen request failed:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.warn('Fullscreen exit failed:', err);
      }
    }
  };

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-loyola-maroon border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Show start screen before assessment begins
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-loyola-maroon">Financial Literacy Assessment</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 bg-loyola-maroon/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-loyola-maroon" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Begin?</h2>
            <p className="text-gray-600 text-lg mb-8">
              You are about to start your Financial Literacy Assessment. Please read the instructions below before proceeding.
            </p>

            <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 mb-4">Instructions:</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-loyola-maroon flex-shrink-0 mt-0.5" />
                  <span>You will have <strong>90 minutes</strong> to complete the assessment</span>
                </li>
                <li className="flex items-start gap-3">
                  <ChevronRight className="w-5 h-5 text-loyola-maroon flex-shrink-0 mt-0.5" />
                  <span>There are <strong>50 questions</strong> in total</span>
                </li>
                <li className="flex items-start gap-3">
                  <ChevronRight className="w-5 h-5 text-loyola-maroon flex-shrink-0 mt-0.5" />
                  <span>For each question, select your answer and rate your confidence</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-loyola-maroon flex-shrink-0 mt-0.5" />
                  <span>Your responses are anonymous and securely stored</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setHasStarted(true)}
              className="bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-semibold py-4 px-8 rounded-xl transition-all text-lg shadow-lg shadow-loyola-maroon/20 hover:shadow-xl"
            >
              Start the Assessment
            </button>
          </div>
        </main>

        <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
          <div className="container mx-auto px-4 text-center text-sm text-gray-500">
            <p>&copy; 2025 by Dr. Abol Jalilvand and Guillaume Bolivard. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab switch warning banner */}
      {showTabWarning && (
        <div className="bg-red-600 text-white px-4 py-3 text-center sticky top-0 z-50">
          <div className="container mx-auto flex items-center justify-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-semibold">
              Warning: You switched tabs/windows. This behavior is being monitored. Please focus on the assessment.
            </p>
            <button
              onClick={() => setShowTabWarning(false)}
              className="ml-auto hover:bg-red-700 rounded px-2 py-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-loyola-maroon">Financial Literacy Assessment</h1>
            <div className="flex items-center gap-4">
              {tabSwitches > 0 && (
                <div className="flex items-center text-xs bg-red-100 text-red-700 px-2 py-1 rounded gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Tab switches: {tabSwitches}</span>
                </div>
              )}
              <div className="flex items-center text-sm bg-loyola-gold/20 text-loyola-maroon px-3 py-2 rounded-full gap-1.5">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{formatTime(timeRemaining)}</span>
              </div>
              <button
                onClick={handleFullscreenToggle}
                className="text-loyola-gray-600 hover:text-loyola-maroon transition"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                <Maximize2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to exit? Your progress will be saved.')) {
                    router.push('/start');
                  }
                }}
                className="text-loyola-gray-600 hover:text-loyola-maroon transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={`container mx-auto px-4 py-8 max-w-3xl ${isTestUser ? 'pb-32' : ''}`}>
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              Question {currentIndex + 1} of 50
            </span>
            <span>{currentQuestion.domain}</span>
          </div>
          <div className="w-full bg-loyola-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-loyola-maroon to-loyola-gold h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-6">{currentQuestion.text}</h2>

          {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.id] === option.id;
                const isCorrect = currentQuestion.correct_answer === option.id;
                const isIncorrect = isSelected && !isCorrect;
                const showFeedback = isSelected && currentQuestion.correct_answer && hasSelectedConfidence;
                
                return (
                  <div
                    key={option.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      showFeedback
                        ? isCorrect
                          ? 'border-green-500 bg-green-50'
                          : isIncorrect
                          ? 'border-red-500 bg-red-50'
                          : 'border-loyola-gray-200'
                        : isSelected
                        ? 'border-loyola-maroon bg-loyola-maroon/5'
                        : 'border-loyola-gray-200 hover:border-loyola-maroon/30 hover:bg-loyola-gray-50'
                    }`}
                    onClick={() => handleAnswer(currentQuestion.id, option.id)}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => handleAnswer(currentQuestion.id, option.id)}
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
                      <label className={`ml-3 text-lg cursor-pointer ${
                        showFeedback
                          ? isCorrect
                            ? 'text-green-800 font-semibold'
                            : isIncorrect
                            ? 'text-red-800 font-semibold'
                            : 'text-loyola-gray-800'
                          : 'text-loyola-gray-800'
                      }`}>
                        {option.text}
                        {showFeedback && isCorrect && (
                          <span className="ml-2 text-green-600 font-bold">✓ Correct!</span>
                        )}
                        {showFeedback && isIncorrect && (
                          <span className="ml-2 text-red-600 font-bold">✗ Incorrect</span>
                        )}
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'short_answer' && (
            <div className="mb-8">
              <textarea
                className={`w-full p-4 border-2 rounded-lg focus:ring-2 focus:ring-loyola-maroon transition ${
                  answers[currentQuestion.id] && currentQuestion.correct_answer
                    ? answerCorrectness[currentQuestion.id]
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : 'border-loyola-gray-300 focus:border-loyola-maroon'
                }`}
                rows={6}
                value={answers[currentQuestion.id] || ''}
                onChange={(event) => handleAnswer(currentQuestion.id, event.target.value)}
                placeholder="Type your answer here..."
              />
              {answers[currentQuestion.id] && currentQuestion.correct_answer && hasSelectedConfidence && (
                <div className={`mt-2 p-3 rounded-lg ${
                  answerCorrectness[currentQuestion.id]
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className={`font-semibold ${
                    answerCorrectness[currentQuestion.id]
                      ? 'text-green-800'
                      : 'text-red-800'
                  }`}>
                    {answerCorrectness[currentQuestion.id] ? '✓ Correct!' : '✗ Incorrect'}
                  </div>
                  {!answerCorrectness[currentQuestion.id] && (
                    <div className="text-sm text-gray-600 mt-1">
                      <strong>Correct answer:</strong> {currentQuestion.correct_answer}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="border-t border-loyola-gray-200 pt-6">
            <label className="block text-sm font-semibold text-loyola-gray-700 mb-3">
              How confident are you in your answer?
            </label>
            <div className="flex items-center justify-center gap-4">
              {[
                { value: 1, label: 'Low', description: 'Not confident' },
                { value: 2, label: 'Medium', description: 'Somewhat confident' },
                { value: 3, label: 'High', description: 'Very confident' },
              ].map((option) => (
                <button
                  key={option.value}
                  className={`flex flex-col items-center px-6 py-4 rounded-lg border-2 transition-all ${
                    currentConfidence === option.value
                      ? 'border-loyola-maroon bg-loyola-maroon/10 scale-105 shadow-md'
                      : 'border-loyola-gray-200 bg-white hover:border-loyola-maroon/30 hover:bg-loyola-gray-50'
                  }`}
                  onClick={() => handleConfidenceSelect(option.value)}
                  type="button"
                >
                  <span className={`text-2xl font-bold ${
                    currentConfidence === option.value ? 'text-loyola-maroon' : 'text-loyola-gray-700'
                  }`}>
                    {option.value}
                  </span>
                  <span className={`text-sm font-medium ${
                    currentConfidence === option.value ? 'text-loyola-maroon' : 'text-loyola-gray-600'
                  }`}>
                    {option.label}
                  </span>
                  <span className="text-xs text-loyola-gray-500 mt-1">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Test User: Question Debug Info */}
        {isTestUser && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-xs">
            <p className="font-semibold text-blue-700 mb-2">Debug Info (Test Mode Only)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-blue-600">
              <div>
                <span className="font-medium">Type:</span>{' '}
                {currentQuestion.is_sdm ? 'SDM Variant' : 'Anchor'}
              </div>
              <div>
                <span className="font-medium">Scored:</span>{' '}
                {currentQuestion.is_scored !== false ? 'Yes' : 'No (Preference)'}
              </div>
              <div>
                <span className="font-medium">Correct:</span>{' '}
                {currentQuestion.correct_answer || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Domain:</span>{' '}
                {currentQuestion.domain}
              </div>
              {currentQuestion.is_sdm && (
                <>
                  <div>
                    <span className="font-medium">Variant Type:</span>{' '}
                    {currentQuestion.variant_type || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Trigger:</span>{' '}
                    {currentQuestion.trigger_condition || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Anchor ID:</span>{' '}
                    {currentQuestion.anchor_item_id?.substring(0, 8) || 'N/A'}...
                  </div>
                </>
              )}
              {!currentQuestion.is_sdm && answers[currentQuestion.id] && (
                <div className="col-span-2">
                  <span className="font-medium">SDM Trigger Status:</span>{' '}
                  {currentQuestion.is_scored === false
                    ? 'N/A (Preference item)'
                    : answerCorrectness[currentQuestion.id]
                    ? `Correct + ${getConfidenceBucket(confidenceRatings[currentQuestion.id] || 0)}`
                    : `Incorrect + ${getConfidenceBucket(confidenceRatings[currentQuestion.id] || 0)}`}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={!isTestUser && currentIndex === 0}
            className="px-6 py-3 border-2 border-loyola-gray-300 rounded-lg text-loyola-gray-700 hover:bg-loyola-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            type="button"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <div className="text-sm text-loyola-gray-600 font-medium">
            {Object.keys(answers).length} of 50 answered
          </div>

          <button
            onClick={handleNext}
            disabled={!isTestUser && (!answers[currentQuestion.id] || !hasSelectedConfidence || isSubmitting)}
            className="px-6 py-3 bg-loyola-maroon text-white rounded-lg hover:bg-loyola-maroon-dark disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            type="button"
          >
            {isSubmitting ? (
              <>Submitting...</>
            ) : currentIndex === questions.length - 1 ? (
              <>
                Submit <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Next <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Test User: Question Navigation */}
        {isTestUser && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-yellow-700 font-semibold">TEST MODE: Quick Navigation</p>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-yellow-700">
                  Tracked: <span className="font-bold">{scoredAnchors.size} anchors</span>
                </span>
                <span className="text-yellow-700">
                  SDM Bank: <span className="font-bold">{sdmBank.length}</span>
                </span>
                {sdmAppended && (
                  <span className="text-green-600 font-semibold">
                    SDM Added: {questions.filter(q => q.is_sdm).length}/10
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  title={`${q.is_sdm ? 'SDM: ' : 'Q'}${idx + 1} - ${q.domain}${q.is_sdm ? ` (${q.variant_type})` : ''}`}
                  className={`w-8 h-8 text-xs rounded-full transition-all ${
                    idx === currentIndex
                      ? 'bg-loyola-maroon text-white ring-2 ring-offset-1 ring-loyola-maroon'
                      : answers[q.id]
                      ? q.is_sdm
                        ? 'bg-purple-500 text-white'
                        : 'bg-green-500 text-white'
                      : q.is_sdm
                      ? 'bg-purple-200 text-purple-700 hover:bg-purple-300'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {q.is_sdm ? 'S' : idx + 1}
                </button>
              ))}
            </div>
            <div className="flex gap-4 mt-2 text-xs text-yellow-700">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-gray-200 rounded-full"></span> Anchor
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-purple-200 rounded-full"></span> SDM
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span> Answered
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Test User: Real-time Scores Panel */}
      {isTestUser && Object.keys(scores).length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-loyola-maroon to-loyola-maroon-dark text-white p-4 shadow-lg z-50">
          <div className="container mx-auto max-w-3xl">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="font-semibold text-sm">TEST MODE - Live Scores:</span>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-300">{scores['Overall Mastery'] || 0}%</div>
                  <div className="text-xs text-white/80">Mastery</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-300">{scores['Needs Improvement'] || 0}%</div>
                  <div className="text-xs text-white/80">Needs Work</div>
                </div>
                <div className="h-8 w-px bg-white/30"></div>
                {Object.entries(scores)
                  .filter(([key]) => key !== 'Overall Mastery' && key !== 'Needs Improvement')
                  .slice(0, 4)
                  .map(([domain, score]) => (
                    <div key={domain} className="text-center">
                      <div className="text-lg font-semibold">{score}%</div>
                      <div className="text-xs text-white/80 truncate max-w-[80px]">{domain}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
