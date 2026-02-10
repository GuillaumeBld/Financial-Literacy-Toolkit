'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Info, CheckCircle, ChevronRight, ArrowLeft, BookOpen, Check, Play } from 'lucide-react';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseCode = searchParams.get('courseCode') || 'QUIN 102';

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStudent, setIsCheckingStudent] = useState(false);
  const [error, setError] = useState('');

  // Video state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasWatchedVideo, setHasWatchedVideo] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoConfirmed, setVideoConfirmed] = useState(false);

  // Form state
  const [studentId, setStudentId] = useState('');
  const [confirmStudentId, setConfirmStudentId] = useState('');
  // B1-B5: Demographics
  const [gender, setGender] = useState(''); // B1
  const [raceEthnicity, setRaceEthnicity] = useState(''); // B2
  const [ageRange, setAgeRange] = useState(''); // B3
  const [firstLanguage, setFirstLanguage] = useState(''); // B4
  const [firstLanguageOther, setFirstLanguageOther] = useState(''); // B4: Other
  const [workExperience, setWorkExperience] = useState(''); // B5
  // B6-B12: Financial Background
  const [priorFinancialProducts, setPriorFinancialProducts] = useState<string[]>([]); // B6
  const [selfRatedFinancialKnowledge, setSelfRatedFinancialKnowledge] = useState(''); // B7
  const [financialStressFrequency, setFinancialStressFrequency] = useState(''); // B8
  const [parentalEducation, setParentalEducation] = useState(''); // B9
  const [firstGenerationCollege, setFirstGenerationCollege] = useState(''); // B10
  const [hasStudentLoanDebt, setHasStudentLoanDebt] = useState(''); // B11
  const [studentLoanInterestRate, setStudentLoanInterestRate] = useState(''); // B12
  const [studentLoanMaturity, setStudentLoanMaturity] = useState(''); // B13
  // Consent & acknowledgments
  const [courseRequirementAcknowledged, setCourseRequirementAcknowledged] = useState(false);
  const [researchConsent, setResearchConsent] = useState<boolean | null>(null);
  // Plan B fallback
  const [planBRedirect, setPlanBRedirect] = useState<string | null>(null);

  // Check Plan B status
  useEffect(() => {
    if (!courseCode) return;
    fetch(`/api/plan-b/status?courseCode=${encodeURIComponent(courseCode)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.active && data.redirectUrl) {
          setPlanBRedirect(data.redirectUrl);
        }
      })
      .catch(() => {});
  }, [courseCode]);

  const totalSteps = 5;

  const handleNext = async () => {
    // Step 0: Intro Video - no validation needed
    if (currentStep === 1) {
      // Step 1: Consent and Data Use
      if (!courseRequirementAcknowledged) {
        setError('Please acknowledge the course requirement to continue');
        return;
      }
      if (researchConsent === null) {
        setError('Please select whether you consent to research participation');
        return;
      }
    } else if (currentStep === 2) {
      // Step 2: Access and Identity
      if (!studentId.trim()) {
        setError('Please enter your Student ID');
        return;
      }
      if (!/^\d+$/.test(studentId.trim())) {
        setError('Student ID must contain only numbers');
        return;
      }
      if (studentId.trim() !== confirmStudentId.trim()) {
        setError('Student IDs do not match. Please re-enter your Student ID.');
        return;
      }

      // Check if student already completed onboarding for this course
      setIsCheckingStudent(true);
      setError('');

      try {
        const response = await fetch('/api/onboarding/check-student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseCode: courseCode.trim(),
            studentId: studentId.trim(),
          }),
        });

        const data = await response.json();

        if (data.exists) {
          // Student already registered - show error with link to login
          setError(`DUPLICATE_STUDENT:${encodeURIComponent(courseCode)}`);
          setIsCheckingStudent(false);
          return;
        }

        // Not registered - proceed to next step
        setCurrentStep(currentStep + 1);
        setIsCheckingStudent(false);
        return;
      } catch (err) {
        // On error, allow to continue (fail open for UX)
        console.error('Check student error:', err);
        setIsCheckingStudent(false);
      }
    } else if (currentStep === 3) {
      // Step 3: Demographics (B1-B5) - all required
      if (!gender) {
        setError('Please select your gender (B1)');
        return;
      }
      if (!raceEthnicity) {
        setError('Please select your racial or ethnic background (B2)');
        return;
      }
      if (!ageRange) {
        setError('Please select your age range (B3)');
        return;
      }
      if (!firstLanguage) {
        setError('Please select your first language (B4)');
        return;
      }
      if (firstLanguage === 'other' && !firstLanguageOther.trim()) {
        setError('Please specify your first language (B4)');
        return;
      }
      if (!workExperience) {
        setError('Please select your work experience (B5)');
        return;
      }
    } else if (currentStep === 4) {
      // Step 4: Financial Background (B6-B13) - all required
      if (!priorFinancialProducts || priorFinancialProducts.length === 0) {
        setError('Please select at least one option for prior financial products (B6)');
        return;
      }
      if (!selfRatedFinancialKnowledge) {
        setError('Please rate your financial knowledge (B7)');
        return;
      }
      if (!financialStressFrequency) {
        setError('Please select how often you feel financially stressed (B8)');
        return;
      }
      if (!parentalEducation) {
        setError('Please select the highest level of parental education (B9)');
        return;
      }
      if (!firstGenerationCollege) {
        setError('Please indicate if you are a first-generation college student (B10)');
        return;
      }
      if (!hasStudentLoanDebt) {
        setError('Please indicate if you have student loan debt (B11)');
        return;
      }
      if (hasStudentLoanDebt === 'yes' && !studentLoanInterestRate) {
        setError('Please select an interest rate option for your student loan debt (B12)');
        return;
      }
      if (hasStudentLoanDebt === 'yes' && !studentLoanMaturity) {
        setError('Please select the loan maturity for your student loan debt (B13)');
        return;
      }
    }
    setError('');
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError('');
    if (currentStep === 0) {
      // Go back to login page
      router.push('/login');
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Final validation (student ID and course requirement already validated)
    if (!studentId.trim() || !courseCode.trim()) {
      setError('Student ID and Course ID are required');
      return;
    }

    // Validate all financial background fields are required
    if (priorFinancialProducts.length === 0 || !selfRatedFinancialKnowledge || !financialStressFrequency || !parentalEducation || !firstGenerationCollege || !hasStudentLoanDebt) {
      setError('Please complete all required fields');
      return;
    }
    if (hasStudentLoanDebt === 'yes' && !studentLoanInterestRate) {
      setError('Please select an interest rate option for your student loan debt (B12)');
      return;
    }
    if (hasStudentLoanDebt === 'yes' && !studentLoanMaturity) {
      setError('Please select the loan maturity for your student loan debt (B13)');
      return;
    }

    setIsSubmitting(true);

    try {
      const consentTimestamp = new Date().toISOString();
      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseCode: courseCode.trim(),
          studentId: studentId.trim(),
          research_consent: researchConsent,
          research_consent_timestamp: consentTimestamp,
          research_consent_version: '1.0',
          demographic: {
            gender: gender || null, // B1
            race_ethnicity: raceEthnicity || null, // B2
            age_range: ageRange || null, // B3
            first_language: firstLanguage || null, // B4
            first_language_other: firstLanguage === 'other' ? firstLanguageOther : null, // B4
            work_experience: workExperience || null, // B5
          },
          financial_background: {
            prior_financial_products: priorFinancialProducts, // B6
            self_rated_financial_knowledge: selfRatedFinancialKnowledge || null, // B7
            financial_stress_frequency: financialStressFrequency || null, // B8
          },
          financial_background_extended: {
            parental_education: parentalEducation || null, // B9
            first_generation_college: firstGenerationCollege || null, // B10
            has_student_loan_debt: hasStudentLoanDebt || null, // B11
            student_loan_interest_rate: hasStudentLoanDebt === 'yes' ? (studentLoanInterestRate || null) : null, // B12
            student_loan_maturity: hasStudentLoanDebt === 'yes' ? (studentLoanMaturity || null) : null, // B13
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save onboarding data');
      }

      // Check if this is the test user
      const normalizedStudentId = studentId.trim().toLowerCase();
      const isTestUser = normalizedStudentId === '123456789';

      // Store session data
      const sessionData = {
        courseCode: courseCode.trim(),
        studentId: studentId.trim(),
        userId: data.data.userId,
        courseId: data.data.courseId,
        hasCompletedOnboarding: true,
        loginTime: new Date().toISOString(),
        isTestUser,
      };

      // Also store assessment session for the assessment page
      const assessmentSession = {
        courseCode: courseCode.trim(),
        studentId: studentId.trim(),
        userId: data.data.userId,
        courseId: data.data.courseId,
        attemptType: 'pre' as const,
        startedAt: new Date().toISOString(),
        isTestUser,
        attemptId: null,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('student-session', JSON.stringify(sessionData));
        localStorage.setItem('assessment-session', JSON.stringify(assessmentSession));
        // Clear any orphaned global progress key (legacy cleanup)
        localStorage.removeItem('assessment-progress');
      }

      // After completing onboarding, go to start page to select assessment
      router.push('/start');
    } catch (err: any) {
      console.error('Error submitting onboarding:', err);
      setError(err.message || 'Unable to save your information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-loyola-maroon" />
            <span className="text-xl font-bold gradient-text">Financial Literacy Toolkit</span>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-loyola-maroon/10 flex items-center justify-center">
              <User className="w-5 h-5 text-loyola-maroon" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 lg:py-12 max-w-3xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-loyola-maroon to-loyola-gold h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {planBRedirect && (
            <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl">
              <p className="text-sm font-medium mb-2">Your instructor has enabled an alternative assessment.</p>
              <a
                href={planBRedirect}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition"
              >
                Go to Google Form
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              {error.startsWith('DUPLICATE_STUDENT:') ? (
                <span>
                  You have already completed onboarding for this course.{' '}
                  <Link
                    href={`/login?courseCode=${error.replace('DUPLICATE_STUDENT:', '')}`}
                    className="font-semibold underline hover:text-red-800"
                  >
                    Click here to go to the login page
                  </Link>
                </span>
              ) : (
                <span>{error}</span>
              )}
            </div>
          )}

          {/* Step 0: Intro Video */}
          {currentStep === 0 && (
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to the Financial Literacy Assessment</h1>
                <p className="text-gray-600">
                  Please watch this short video to learn about the assessment before you begin.
                </p>
              </div>

              {/* Video Container */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
                <div className="relative aspect-video bg-gray-900">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    controls
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                    onEnded={() => { setHasWatchedVideo(true); setIsVideoPlaying(false); }}
                  >
                    <source src="/intro-video.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                  {/* Play overlay */}
                  {!isVideoPlaying && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
                      onClick={() => {
                        const video = videoRef.current;
                        if (video) {
                          video.play();
                          if (video.requestFullscreen) {
                            video.requestFullscreen();
                          } else if ((video as any).webkitEnterFullscreen) {
                            (video as any).webkitEnterFullscreen();
                          }
                        }
                      }}
                    >
                      <div className="text-center text-white">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-3 hover:bg-white/30 transition-colors">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                        <p className="text-base font-medium">Click to play introduction video</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Video info bar */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    {hasWatchedVideo ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Video completed</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-600">Watch the video to continue</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Confirmation checkbox */}
              <div
                onClick={() => hasWatchedVideo && setVideoConfirmed(!videoConfirmed)}
                className={`flex items-start gap-3 mb-6 p-4 border rounded-xl transition-all ${
                  hasWatchedVideo ? 'cursor-pointer border-gray-200 bg-gray-50/50' : 'cursor-not-allowed border-gray-100 bg-gray-50/30 opacity-50'
                }`}
              >
                <div className={`h-5 w-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  videoConfirmed
                    ? 'bg-loyola-maroon border-loyola-maroon'
                    : 'border-gray-300 bg-white'
                }`}>
                  {videoConfirmed && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </div>
                <span className="text-sm text-gray-700">
                  I have watched the introduction video and I am ready to proceed.
                </span>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-6 rounded-xl transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!hasWatchedVideo || !videoConfirmed}
                  className={`font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2 ${
                    hasWatchedVideo && videoConfirmed
                      ? 'bg-loyola-maroon hover:bg-loyola-maroon-dark text-white shadow-lg shadow-loyola-maroon/20'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Consent and Data Use */}
          {currentStep === 1 && (
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Consent and Data Use</h1>
                <p className="text-gray-600">
                  Please review the course requirement and choose whether to allow research use of your responses.
                </p>
              </div>

              <div className="space-y-6">
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                  <p className="text-sm font-semibold text-gray-800 mb-2">Course requirement (no choice)</p>
                  <p className="text-sm text-gray-700">
                    This assessment is a required course assignment in {courseCode}. Completion affects course credit,
                    but your answers are not graded for correctness.
                  </p>
                  <div
                    onClick={() => setCourseRequirementAcknowledged(!courseRequirementAcknowledged)}
                    className="flex items-start gap-3 mt-3 cursor-pointer"
                  >
                    <div className={`h-5 w-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      courseRequirementAcknowledged
                        ? 'bg-loyola-maroon border-loyola-maroon'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {courseRequirementAcknowledged && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-sm text-gray-700">
                      I understand this assessment is required for the course. <span className="text-red-500">*</span>
                    </span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                  <p className="text-sm font-semibold text-gray-800 mb-2">Research consent (choice)</p>
                  <p className="text-sm text-gray-700 mb-3">
                    You may choose whether your responses are used for research evaluating course learning outcomes.
                    Declining has no impact on grades.
                  </p>
                  <div className="flex gap-2 flex-shrink-0">
                    {[
                      { value: true, label: 'Yes, I consent' },
                      { value: false, label: 'No, I do not consent' },
                    ].map((option) => (
                      <button
                        key={String(option.value)}
                        type="button"
                        onClick={() => setResearchConsent(option.value)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                          researchConsent === option.value
                            ? 'border-loyola-maroon bg-loyola-maroon text-white'
                            : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-6 rounded-xl transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-loyola-maroon/20"
                >
                  Continue to assessment
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Access and Identity */}
          {currentStep === 2 && (
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Access and Identity</h1>
                <p className="text-gray-600">
                  We use your Student ID and course code to link your pre- and post-assessments. No password required.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="course-code" className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code
                  </label>
                  <input
                    type="text"
                    id="course-code"
                    value={courseCode}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label htmlFor="student-id" className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      id="student-id"
                      value={studentId}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setStudentId(val);
                      }}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-loyola-maroon/20 focus:border-loyola-maroon transition-all"
                      placeholder="Enter your student ID (numbers only)"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-student-id" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Student ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      id="confirm-student-id"
                      value={confirmStudentId}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setConfirmStudentId(val);
                      }}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-loyola-maroon/20 focus:border-loyola-maroon transition-all ${
                        confirmStudentId && confirmStudentId !== studentId
                          ? 'border-red-300 bg-red-50/50'
                          : confirmStudentId && confirmStudentId === studentId
                            ? 'border-green-300 bg-green-50/50'
                            : 'border-gray-200'
                      }`}
                      placeholder="Re-enter your student ID"
                      required
                    />
                  </div>
                  {confirmStudentId && confirmStudentId !== studentId && (
                    <p className="mt-1.5 text-sm text-red-600">Student IDs do not match</p>
                  )}
                  {confirmStudentId && confirmStudentId === studentId && (
                    <p className="mt-1.5 text-sm text-green-600">Student IDs match</p>
                  )}
                </div>

                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                  <p className="text-sm font-medium text-gray-700 mb-2">Privacy notice</p>
                  <p className="text-sm text-gray-600">
                    Your Student ID is converted to a coded identifier before storage. Identifiable information, if
                    collected for course administration, is stored separately from the research dataset and access is
                    restricted. Research analysis uses de-identified data and is governed by your consent choice.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isCheckingStudent}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-6 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isCheckingStudent}
                  className="bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-loyola-maroon/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingStudent ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Checking...
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Demographics (B1-B5) */}
          {currentStep === 3 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Demographic Information</h2>
                <p className="text-gray-600">
                  These questions help us understand our student population. All items are required. You may select &quot;Prefer not to answer&quot; for any question.
                </p>
              </div>

              <div className="space-y-6">
                {/* B1: Gender */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    B1: What is your gender? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-loyola-maroon/20 focus:border-loyola-maroon transition-all"
                  >
                    <option value="">Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="prefer-not-to-say">Prefer not to answer</option>
                  </select>
                </div>

                {/* B2: Race/Ethnicity */}
                <div>
                  <label htmlFor="race-ethnicity" className="block text-sm font-medium text-gray-700 mb-2">
                    B2: Which category best describes your racial or ethnic background? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="race-ethnicity"
                    value={raceEthnicity}
                    onChange={(e) => setRaceEthnicity(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-loyola-maroon/20 focus:border-loyola-maroon transition-all"
                  >
                    <option value="">Select race/ethnicity</option>
                    <option value="White or Caucasian">White or Caucasian</option>
                    <option value="Asian">Asian</option>
                    <option value="Black or African American">Black or African American</option>
                    <option value="Hispanic or Latino">Hispanic or Latino</option>
                    <option value="Native Hawaiian or Pacific Islander">Native Hawaiian or Pacific Islander</option>
                    <option value="Native American or Alaska Native">Native American or Alaska Native</option>
                    <option value="Two or more racial or ethnic backgrounds">Two or more racial or ethnic backgrounds</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to answer</option>
                  </select>
                </div>

                {/* B3: Age Range */}
                <div>
                  <label htmlFor="age-range" className="block text-sm font-medium text-gray-700 mb-2">
                    B3: What is your age range? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="age-range"
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-loyola-maroon/20 focus:border-loyola-maroon transition-all"
                  >
                    <option value="">Select age range</option>
                    <option value="20-or-under">20 or under</option>
                    <option value="above-20">Above 20</option>
                    <option value="prefer-not-to-answer">Prefer not to answer</option>
                  </select>
                </div>

                {/* B4: First Language */}
                <div>
                  <label htmlFor="first-language" className="block text-sm font-medium text-gray-700 mb-2">
                    B4: What is your first language? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="first-language"
                    value={firstLanguage}
                    onChange={(e) => setFirstLanguage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-loyola-maroon/20 focus:border-loyola-maroon transition-all"
                  >
                    <option value="">Select first language</option>
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="chinese">Chinese (any dialect)</option>
                    <option value="french">French</option>
                    <option value="russian">Russian</option>
                    <option value="dutch">Dutch</option>
                    <option value="other">Other (please specify)</option>
                    <option value="prefer-not-to-answer">Prefer not to answer</option>
                  </select>
                  {firstLanguage === 'other' && (
                    <input
                      type="text"
                      value={firstLanguageOther}
                      onChange={(e) => setFirstLanguageOther(e.target.value)}
                      className="w-full mt-3 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-loyola-maroon/20 focus:border-loyola-maroon transition-all"
                      placeholder="Please specify your first language"
                      required={firstLanguage === 'other'}
                    />
                  )}
                </div>

                {/* B5: Work Experience */}
                <div>
                  <label htmlFor="work-experience" className="block text-sm font-medium text-gray-700 mb-2">
                    B5: Do you have work experience? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="work-experience"
                    value={workExperience}
                    onChange={(e) => setWorkExperience(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-loyola-maroon/20 focus:border-loyola-maroon transition-all"
                  >
                    <option value="">Select work experience</option>
                    <option value="no-work-experience">No work experience</option>
                    <option value="part-time">Part-time employment</option>
                    <option value="full-time">Full-time employment</option>
                    <option value="prefer-not-to-answer">Prefer not to answer</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-6 rounded-xl transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-loyola-maroon/20"
                >
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Financial Background (B6-B12) & Consent */}
          {currentStep === 4 && (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Financial Background and Context</h2>
                <p className="text-gray-600">
                  Please complete the financial background and socio-economic context items. All items are required. You may select &quot;Prefer not to answer&quot; for any question.
                </p>
              </div>

              <div className="space-y-6">
                <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">A) Financial background</div>

                {/* B6: Prior Financial Products */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    B6: Prior to enrolling in this course, had you personally used any of the following financial products? <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
                  <div className="space-y-2 border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                    {[
                      { value: 'credit-card', label: 'Credit card' },
                      { value: 'student-loan', label: 'Student loan' },
                      { value: 'auto-loan', label: 'Auto loan' },
                      { value: 'investment-account', label: 'Investment account (stocks, ETFs, mutual funds)' },
                      { value: 'insurance', label: 'Insurance policy in your own name' },
                      { value: 'none', label: 'None of the above' },
                      { value: 'prefer-not-to-answer', label: 'Prefer not to answer' },
                    ].map((product) => {
                      const isChecked = priorFinancialProducts.includes(product.value);
                      return (
                        <div
                          key={product.value}
                          onClick={() => {
                            if (isChecked) {
                              setPriorFinancialProducts(priorFinancialProducts.filter((p) => p !== product.value));
                            } else {
                              setPriorFinancialProducts([...priorFinancialProducts, product.value]);
                            }
                          }}
                          className="flex items-center p-2 hover:bg-white rounded-lg transition-colors cursor-pointer"
                        >
                          <div className={`mr-3 h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                            isChecked
                              ? 'bg-loyola-maroon border-loyola-maroon'
                              : 'border-gray-300 bg-white'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                          </div>
                          <span className="text-gray-700">{product.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* B7: Self-Rated Financial Knowledge */}
                <div>
                  <label htmlFor="self-rated-knowledge" className="block text-sm font-medium text-gray-700 mb-2">
                    B7: Before enrolling in this course, how would you rate your overall financial knowledge? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="self-rated-knowledge"
                    value={selfRatedFinancialKnowledge}
                    onChange={(e) => setSelfRatedFinancialKnowledge(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-loyola-maroon/20 focus:border-loyola-maroon transition-all"
                    required
                  >
                    <option value="">Select rating</option>
                    <option value="very-low">Very low</option>
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                    <option value="very-high">Very high</option>
                    <option value="prefer-not-to-answer">Prefer not to answer</option>
                  </select>
                </div>

                {/* B8: Financial Stress Frequency */}
                <div>
                  <label htmlFor="financial-stress" className="block text-sm font-medium text-gray-700 mb-2">
                    B8: How often do you feel financially stressed? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="financial-stress"
                    value={financialStressFrequency}
                    onChange={(e) => setFinancialStressFrequency(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-loyola-maroon/20 focus:border-loyola-maroon transition-all"
                  >
                    <option value="">Select frequency</option>
                    <option value="never">Never</option>
                    <option value="rarely">Rarely</option>
                    <option value="sometimes">Sometimes</option>
                    <option value="often">Often</option>
                    <option value="always">Always</option>
                    <option value="prefer-not-to-answer">Prefer not to answer</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-gray-200"></div>
                <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">B) Socio-economic context</div>

                {/* B9: Highest Level of Parental Education */}
                <div>
                  <label htmlFor="parental-education" className="block text-sm font-medium text-gray-700 mb-2">
                    B9: Highest level of parental education <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="parental-education"
                    value={parentalEducation}
                    onChange={(e) => setParentalEducation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-loyola-maroon/20 focus:border-loyola-maroon transition-all"
                  >
                    <option value="">Select education level</option>
                    <option value="less-than-high-school">Less than high school</option>
                    <option value="high-school-diploma-or-ged">High school diploma or GED</option>
                    <option value="some-college-no-degree">Some college, no degree</option>
                    <option value="associate-degree">Associate degree (AA/AS)</option>
                    <option value="bachelors-degree">Bachelor&apos;s degree (BA/BS)</option>
                    <option value="graduate-or-professional-degree">Graduate or professional degree (MA/MS/MBA/PhD/MD/JD, etc.)</option>
                    <option value="dont-know">Don&apos;t know</option>
                    <option value="prefer-not-to-answer">Prefer not to answer</option>
                  </select>
                </div>

                {/* B10: First-Generation College Student */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    B10: Are you a first-generation college student? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' },
                      { value: 'prefer-not-to-say', label: 'Prefer not to answer' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center px-4 py-2.5 border rounded-xl cursor-pointer transition-all ${
                          firstGenerationCollege === option.value
                            ? 'border-loyola-maroon bg-loyola-maroon/5 text-loyola-maroon'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="first-generation"
                          value={option.value}
                          checked={firstGenerationCollege === option.value}
                          onChange={() => setFirstGenerationCollege(option.value)}
                          className="sr-only"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* B11: Student Loan Debt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    B11: Do you currently have any student loan debt? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' },
                      { value: 'prefer-not-to-say', label: 'Prefer not to answer' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center px-4 py-2.5 border rounded-xl cursor-pointer transition-all ${
                          hasStudentLoanDebt === option.value
                            ? 'border-loyola-maroon bg-loyola-maroon/5 text-loyola-maroon'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="student-loan-debt"
                          value={option.value}
                          checked={hasStudentLoanDebt === option.value}
                          onChange={() => {
                            setHasStudentLoanDebt(option.value);
                            if (option.value !== 'yes') {
                              setStudentLoanInterestRate('');
                              setStudentLoanMaturity('');
                            }
                          }}
                          className="sr-only"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* B12: Student Loan Interest Rate (conditional) */}
                {hasStudentLoanDebt === 'yes' && (
                  <div className="ml-4 pl-4 border-l-2 border-loyola-maroon/20">
                    <label htmlFor="student-loan-interest-rate" className="block text-sm font-medium text-gray-700 mb-2">
                      B12: What is the interest rate on your student loan debt (best estimate)? <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="student-loan-interest-rate"
                      value={studentLoanInterestRate}
                      onChange={(e) => setStudentLoanInterestRate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-loyola-maroon/20 focus:border-loyola-maroon transition-all"
                      required
                    >
                      <option value="">Select an option</option>
                      <option value="less-than-5">Less than 5%</option>
                      <option value="between-5-and-10">Between 5% and 10%</option>
                      <option value="above-10">Above 10%</option>
                      <option value="do-not-know">I do not know</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                )}

                {/* B13: Student Loan Maturity (conditional) */}
                {hasStudentLoanDebt === 'yes' && (
                  <div className="ml-4 pl-4 border-l-2 border-loyola-maroon/20">
                    <label htmlFor="student-loan-maturity" className="block text-sm font-medium text-gray-700 mb-2">
                      B13: What is the current maturity (length of loan time)? <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="student-loan-maturity"
                      value={studentLoanMaturity}
                      onChange={(e) => setStudentLoanMaturity(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-loyola-maroon/20 focus:border-loyola-maroon transition-all"
                      required
                    >
                      <option value="">Select an option</option>
                      <option value="less-or-equal-3-years">Less or equal to 3 years</option>
                      <option value="between-3-to-5-years">Between 3 to 5 years</option>
                      <option value="above-5-years">Above 5 years</option>
                      <option value="do-not-know">I do not know</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                )}

              </div>

              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-6 rounded-xl transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-loyola-maroon/20"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Complete & Start Assessment
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; 2025 by Dr. Abol Jalilvand and Guillaume Bolivard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-loyola-maroon border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
