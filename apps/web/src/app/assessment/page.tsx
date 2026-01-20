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
  correct_answer?: string;
  is_sdm?: boolean | null;
  anchor_item_id?: string | null;
  variant_type?: string | null;
  trigger_condition?: string | null;
};

type SessionData = {
  courseCode: string;
  studentId: string;
  attemptType: 'pre' | 'post';
  startedAt: string;
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

const getConfidenceBucket = (confidence: number): ConfidenceBucket => {
  if (confidence <= 2) return 'low';
  if (confidence === 3) return 'mid';
  return 'high';
};

const matchesTrigger = (trigger: string | null | undefined, isCorrect: boolean, bucket: ConfidenceBucket): boolean => {
  if (!trigger) return false;
  const normalized = trigger.toLowerCase().replace(/\s+/g, ' ').trim();

  const expectedCorrectness = isCorrect ? 'correct' : 'incorrect';
  if (!normalized.startsWith(expectedCorrectness)) return false;

  if (normalized.includes('any')) return true;
  if (normalized.includes('low/mid')) return bucket === 'low' || bucket === 'mid';
  if (normalized.includes('low')) return bucket === 'low';
  if (normalized.includes('mid')) return bucket === 'mid';
  if (normalized.includes('high')) return bucket === 'high';

  return false;
};

const variantTypeWeight = (variantType: string | null | undefined): number => {
  const vt = (variantType || '').toLowerCase();
  if (vt.includes('same_mcq')) return 0;
  if (vt.includes('same')) return 1;
  if (vt.includes('lower_mcq')) return 2;
  if (vt.includes('lower_tf')) return 3;
  if (vt.includes('open_confirm')) return 4;
  if (vt.includes('open_diagnose')) return 5;
  return 10;
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confidenceRatings, setConfidenceRatings] = useState<Record<string, number>>({});
  const [answerCorrectness, setAnswerCorrectness] = useState<Record<string, boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState(90 * 60); // 90 minutes for 30 questions (3 min/question)
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sdmBank, setSdmBank] = useState<Question[]>([]);
  const [selectedSdmIds, setSelectedSdmIds] = useState<Record<string, boolean>>({});
  const [sdmAppended, setSdmAppended] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAcknowledgedHonorCode, setHasAcknowledgedHonorCode] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const router = useRouter();

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
          const shuffledOptions = item.type === 'multiple_choice' && item.options
            ? shuffleOptions(item.options)
            : item.options;

          return {
            id: item.item_id,
            type: item.type,
            text: item.stem,
            options: shuffledOptions,
            domain: item.domain,
            correct_answer: item.key || item.correct_answer,
            is_sdm: item.is_sdm ?? null,
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

        // If anchors endpoint returns nothing (e.g., is_anchor not set), fall back to all items.
        if (anchors.length === 0) {
          const response = await fetch('/api/items');
          const data = await response.json();
          if (data.success && Array.isArray(data.items)) {
            setQuestions(shuffleQuestions(data.items.map(toQuestion)));
          } else {
            setQuestions(shuffleQuestions(mockQuestions));
          }
        } else {
          setQuestions(shuffleQuestions(anchors));
        }

        setSdmBank(sdmItems);
        setSelectedSdmIds({});
        setSdmAppended(false);
      } catch (error) {
        console.error('Failed to load questions:', error);
        // Fallback to mock questions
        setQuestions(shuffleQuestions(mockQuestions));
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
        setTimeRemaining(90 * 60); // 90 minutes for 30 questions
        void loadQuestions();
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
  const progress = !isLoadingQuestions ? ((currentIndex + 1) / questions.length) * 100 : 0;
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

  const maybeSelectSdmVariant = (anchorId: string, isCorrect: boolean, confidence: number) => {
    if (sdmBank.length === 0) return;
    if (sdmAppended) return;

    const bucket = getConfidenceBucket(confidence);
    const candidates = sdmBank
      .filter((q) => q.anchor_item_id === anchorId)
      .filter((q) => matchesTrigger(q.trigger_condition, isCorrect, bucket))
      .sort((a, b) => variantTypeWeight(a.variant_type) - variantTypeWeight(b.variant_type));

    if (candidates.length === 0) return;

    setSelectedSdmIds((prev) => {
      const alreadySelectedCount = Object.keys(prev).length;
      if (alreadySelectedCount >= 10) return prev;

      for (const candidate of candidates) {
        if (!prev[candidate.id]) {
          return {
            ...prev,
            [candidate.id]: true,
          };
        }
      }

      return prev;
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      const current = questions[currentIndex];
      const atEndOfAnchors = !sdmAppended && !current?.is_sdm;
      if (atEndOfAnchors) {
        const selectedIds = Object.keys(selectedSdmIds);
        const selected = sdmBank.filter((q) => selectedSdmIds[q.id]);
        if (selectedIds.length > 0 && selected.length > 0) {
          setSdmAppended(true);
          setQuestions((prev) => [...prev, ...shuffleQuestions(selected)]);
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

    const isAnchorQuestion = !currentQuestion.is_sdm;
    const answer = answers[currentQuestion.id];
    if (isAnchorQuestion && answer) {
      const isCorrect = checkAnswerCorrectness(currentQuestion.id, answer);
      maybeSelectSdmVariant(currentQuestion.id, isCorrect, value);
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
            <p className="text-loyola-gray-600">Before starting your assessment, please read and acknowledge the following:</p>
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

              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-loyola-maroon flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-2">Monitoring</p>
                  <p>Your assessment activity is being monitored, including:</p>
                  <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
                    <li>Time spent on each question</li>
                    <li>Tab switches and window focus changes</li>
                    <li>Completion patterns</li>
                  </ul>
                  <p className="mt-2 text-xs text-loyola-gray-600">
                    Suspicious behavior may result in review of your assessment and potential academic consequences.
                  </p>
                </div>
              </div>

              <div className="border-t border-loyola-gray-200 pt-4">
                <p className="font-semibold mb-2">Time Limit</p>
                <p>You have <strong>90 minutes</strong> to complete this assessment. The timer starts when you begin.</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Maximize2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Recommended: Use Fullscreen Mode</p>
                <p>For the best experience and to avoid accidental tab switches, we recommend using fullscreen mode. You can enter fullscreen after starting the assessment.</p>
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

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              Question {currentIndex + 1} of {questions.length}
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
            <div className="flex items-center justify-between">
              <span className="text-sm text-loyola-gray-500 font-medium">Not confident</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      currentConfidence === num
                        ? 'bg-loyola-maroon text-white scale-110 shadow-lg'
                        : 'bg-loyola-gray-100 text-loyola-gray-700 hover:bg-loyola-gray-200'
                    }`}
                    onClick={() => handleConfidenceSelect(num)}
                    type="button"
                  >
                    {num}
                  </button>
                ))}
              </div>
              <span className="text-sm text-loyola-gray-500 font-medium">Very confident</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-6 py-3 border-2 border-loyola-gray-300 rounded-lg text-loyola-gray-700 hover:bg-loyola-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            type="button"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <div className="text-sm text-loyola-gray-600 font-medium">
            {Object.keys(answers).length} of {questions.length} answered
          </div>

          <button
            onClick={handleNext}
            disabled={!answers[currentQuestion.id] || !hasSelectedConfidence || isSubmitting}
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
      </main>
    </div>
  );
}
