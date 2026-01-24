'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Info, CheckCircle, ChevronRight, ArrowLeft, BookOpen } from 'lucide-react';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseCode = searchParams.get('courseCode') || 'QUIN 102';

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [studentId, setStudentId] = useState('');
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
  const [researchConsent, setResearchConsent] = useState(true);
  // Socioeconomic context (B9-B13 are in this section)

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep === 0) {
      if (!courseRequirementAcknowledged) {
        setError('Please acknowledge the course requirement to continue');
        return;
      }
    } else if (currentStep === 1) {
      if (!studentId.trim()) {
        setError('Please enter your Student ID');
        return;
      }
    } else if (currentStep === 2) {
      // Demographics (B1-B5) - optional, except "Other" requires text
      if (firstLanguage === 'other' && !firstLanguageOther.trim()) {
        setError('Please specify your first language (B4)');
        return;
      }
    } else if (currentStep === 3) {
      // Financial Background (B6-B8) - only B6/B7 required
      if (!priorFinancialProducts || priorFinancialProducts.length === 0) {
        setError('Please select at least one option for prior financial products (B6)');
        return;
      }
      if (!selfRatedFinancialKnowledge) {
        setError('Please rate your financial knowledge (B7)');
        return;
      }
      if (!courseRequirementAcknowledged) {
        setError('Please confirm the course requirement to continue');
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
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Final validation (student ID and course requirement already validated)
    if (!studentId.trim() || !courseCode.trim()) {
      setError('Student ID and Course ID are required');
      return;
    }

    // Validate financial background (B6-B8) - only B6/B7 required
    if (priorFinancialProducts.length === 0 || !selfRatedFinancialKnowledge) {
      setError('Please complete the required financial background fields (B6-B7)');
      return;
    }
    if (!courseRequirementAcknowledged) {
      setError('Please confirm the course requirement to continue');
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
      }

      router.push('/assessment');
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
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 0: Consent and Data Use */}
          {currentStep === 0 && (
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
                  <label className="flex items-start gap-3 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={courseRequirementAcknowledged}
                      onChange={(e) => setCourseRequirementAcknowledged(e.target.checked)}
                      className="h-4 w-4 mt-0.5 text-loyola-maroon accent-loyola-maroon border-gray-300 rounded focus:ring-loyola-maroon"
                    />
                    <span className="text-sm text-gray-700">
                      I understand this assessment is required for the course. <span className="text-red-500">*</span>
                    </span>
                  </label>
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

          {/* Step 1: Access and Identity */}
          {currentStep === 1 && (
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
                      id="student-id"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-loyola-maroon/20 focus:border-loyola-maroon transition-all"
                      placeholder="Enter your student ID"
                      required
                    />
                  </div>
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

              <div className="flex justify-end mt-6">
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

          {/* Step 2: Demographics (B1-B5) */}
          {currentStep === 2 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Demographic Information</h2>
                <p className="text-gray-600">
                  These questions help us understand our student population. All items are optional.
                </p>
              </div>

              <div className="space-y-6">
                {/* B1: Gender */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    B1: What is your gender?
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
                    B2: Which category best describes your racial or ethnic background?
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
                    B3: What is your age range?
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
                    B4: What is your first language?
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
                    B5: Do you have work experience?
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

          {/* Step 3: Financial Background (B6-B12) & Consent */}
          {currentStep === 3 && (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Financial Background and Context</h2>
                <p className="text-gray-600">
                  Please complete the required financial background items. Socio-economic items are optional.
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
                    ].map((product) => (
                      <label key={product.value} className="flex items-center p-2 hover:bg-white rounded-lg transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={priorFinancialProducts.includes(product.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPriorFinancialProducts([...priorFinancialProducts, product.value]);
                            } else {
                              setPriorFinancialProducts(priorFinancialProducts.filter((p) => p !== product.value));
                            }
                          }}
                          className="mr-3 h-5 w-5 text-loyola-maroon accent-loyola-maroon rounded"
                        />
                        <span className="text-gray-700">{product.label}</span>
                      </label>
                    ))}
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
                  </select>
                </div>

                {/* B8: Financial Stress Frequency */}
                <div>
                  <label htmlFor="financial-stress" className="block text-sm font-medium text-gray-700 mb-2">
                    B8: How often do you feel financially stressed? <span className="text-gray-400 font-normal">(Optional)</span>
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
                  </select>
                </div>

                <div className="pt-2 border-t border-gray-200"></div>
                <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">B) Socio-economic context</div>

                {/* B9: Highest Level of Parental Education */}
                <div>
                  <label htmlFor="parental-education" className="block text-sm font-medium text-gray-700 mb-2">
                    B9: Highest level of parental education
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
                    <option value="bachelors-degree">Bachelor's degree (BA/BS)</option>
                    <option value="graduate-or-professional-degree">Graduate or professional degree (MA/MS/MBA/PhD/MD/JD, etc.)</option>
                    <option value="dont-know">Don't know</option>
                    <option value="prefer-not-to-answer">Prefer not to answer</option>
                  </select>
                </div>

                {/* B10: First-Generation College Student */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    B10: Are you a first-generation college student?
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
                    B11: Do you currently have any student loan debt?
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

                <div className="pt-2 border-t border-gray-200"></div>
                <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">C) Data use confirmation</div>
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4">
                  <p className="text-sm text-gray-600">
                    Completion is required for course credit. Your answers are used for instructional improvement. If
                    you consented to research use, a de-identified version of your responses will also be used for
                    research analysis. Declining research consent does not affect your grade.
                  </p>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={courseRequirementAcknowledged}
                      onChange={(e) => setCourseRequirementAcknowledged(e.target.checked)}
                      className="h-4 w-4 mt-0.5 text-loyola-maroon accent-loyola-maroon border-gray-300 rounded focus:ring-loyola-maroon"
                    />
                    <span className="text-sm text-gray-700">
                      I understand this assessment is required for the course. <span className="text-red-500">*</span>
                    </span>
                  </label>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">My research participation choice is:</p>
                    <div className="flex gap-2">
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
