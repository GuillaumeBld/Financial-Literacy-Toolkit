'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';

type Question = {
  id: string;
  type: string;
  text: string;
  options?: Array<{ id: string; text: string }>;
  domain: string;
};

// Mock questions - in production, these would come from the API
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
  },
  {
    id: 'q3',
    type: 'short_answer',
    text: 'Explain the difference between a debit card and a credit card.',
    domain: 'Credit Management',
  },
];

export default function AssessmentPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [confidence, setConfidence] = useState(3);
  const [timeRemaining, setTimeRemaining] = useState(20 * 60); // 20 minutes in seconds
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionData, setSessionData] = useState<{
    courseCode: string;
    studentId: string;
    attemptType: string;
    startedAt: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Shuffle array function
  const shuffleArray = (array: Question[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    // Load session data
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('assessment-session');
      if (session) {
        try {
          const parsedSession = JSON.parse(session);
          const normalizedSession = {
            courseCode: parsedSession.courseCode,
            studentId: parsedSession.studentId,
            attemptType: parsedSession.attemptType,
            startedAt: parsedSession.startedAt ?? new Date().toISOString()
          };
          setSessionData(normalizedSession);
        } catch (error) {
          console.error('Error parsing session data:', error);
          router.push('/start'); // Redirect if session is invalid
          return;
        }
      } else {
        router.push('/start'); // Redirect if no session
        return;
      }
    }

    // Shuffle questions when component mounts (simulating new questions on app restart)
    setQuestions(shuffleArray(mockQuestions));

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isLoadingQuestions = questions.length === 0;
  const currentQuestion = !isLoadingQuestions ? questions[currentIndex] : null;
  const progress = !isLoadingQuestions ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (answer: any) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setConfidence(3); // Reset confidence for next question
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!sessionData || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Calculate time spent (from session start to now)
      const sessionStart = sessionData.startedAt ? new Date(sessionData.startedAt) : null;
      const timeSpent = sessionStart ? Math.floor((Date.now() - sessionStart.getTime()) / 1000) : null;

      // Format responses for API
      const formattedResponses = Object.entries(answers).map(([questionId, answer]) => {
        // Find the question to get the item ID
        const question = questions.find(q => q.id === questionId);
        if (!question) return null;

        return {
          itemId: question.id, // Using question ID as item ID for now
          answer: answer,
          confidence: confidence // Using the last confidence rating
        };
      }).filter(Boolean);

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
          timeSpent: timeSpent ?? undefined
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Clear session data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('assessment-session');
        }

        // Redirect to results
        router.push('/results');
      } else {
        alert(`Submission failed: ${result.error}`);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('An error occurred while submitting your assessment. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 mx-auto border-4 border-loyola-maroon border-t-transparent rounded-full animate-spin" aria-hidden />
          <p className="text-loyola-gray-700">Loading assessment questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-loyola-maroon">Financial Literacy Assessment</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center text-sm bg-loyola-gold/20 text-loyola-maroon px-3 py-2 rounded-full gap-1.5">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{formatTime(timeRemaining)}</span>
              </div>
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
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{currentQuestion.domain}</span>
          </div>
          <div className="w-full bg-loyola-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-loyola-maroon to-loyola-gold h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-6">{currentQuestion.text}</h2>

          {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option) => (
                <div
                  key={option.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    answers[currentQuestion.id] === option.id
                      ? 'border-loyola-maroon bg-loyola-maroon/5'
                      : 'border-loyola-gray-200 hover:border-loyola-maroon/30 hover:bg-loyola-gray-50'
                  }`}
                  onClick={() => handleAnswer(option.id)}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={answers[currentQuestion.id] === option.id}
                      onChange={() => handleAnswer(option.id)}
                      className="h-5 w-5 text-loyola-maroon accent-loyola-maroon"
                    />
                    <label className="ml-3 text-lg cursor-pointer text-loyola-gray-800">{option.text}</label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentQuestion.type === 'short_answer' && (
            <textarea
              className="w-full p-4 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon mb-8 transition"
              rows={6}
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              placeholder="Type your answer here..."
            ></textarea>
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
                      confidence === num
                        ? 'bg-loyola-maroon text-white scale-110 shadow-lg'
                        : 'bg-loyola-gray-100 text-loyola-gray-700 hover:bg-loyola-gray-200'
                    }`}
                    onClick={() => setConfidence(num)}
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
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <div className="text-sm text-loyola-gray-600 font-medium">
            {Object.keys(answers).length} of {questions.length} answered
          </div>

          <button
            onClick={handleNext}
            disabled={!answers[currentQuestion.id] || isSubmitting}
            className="px-6 py-3 bg-loyola-maroon text-white rounded-lg hover:bg-loyola-maroon-dark disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>Submitting...</>
            ) : currentIndex === questions.length - 1 ? (
              <>Submit <ChevronRight className="w-4 h-4" /></>
            ) : (
              <>Next <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
