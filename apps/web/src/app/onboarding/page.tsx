'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Info, CheckCircle, ChevronRight, ArrowLeft } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseCode = searchParams.get('courseCode') || 'QUINN 102';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageRange, setAgeRange] = useState(''); // B3: 20 or under, Above 20
  const [gender, setGender] = useState(''); // B1: Female, Male, Prefer not to say
  const [raceEthnicity, setRaceEthnicity] = useState(''); // B2
  const [firstLanguage, setFirstLanguage] = useState(''); // B4
  const [firstLanguageOther, setFirstLanguageOther] = useState(''); // B4: Other specification
  const [workExperience, setWorkExperience] = useState(''); // B5: No work experience, Part-time, Full-time
  const [priorFinancialProducts, setPriorFinancialProducts] = useState<string[]>([]); // B6: Multi-select
  const [selfRatedFinancialKnowledge, setSelfRatedFinancialKnowledge] = useState(''); // B7
  const [financialStressFrequency, setFinancialStressFrequency] = useState(''); // B8
  const [householdIncome, setHouseholdIncome] = useState('');
  const [parentalEducation, setParentalEducation] = useState('');
  const [firstGenerationCollege, setFirstGenerationCollege] = useState<boolean | null>(null);
  const [financialAidRecipient, setFinancialAidRecipient] = useState<boolean | null>(null);
  const [livingSituation, setLivingSituation] = useState('');
  const [workStudy, setWorkStudy] = useState<boolean | null>(null);
  const [consent, setConsent] = useState(false);

  const totalSteps = 3;

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate step 1: Student ID and Password
      if (!studentId.trim()) {
        setError('Please enter your Student ID');
        return;
      }
      if (!courseCode.trim()) {
        setError('Course code is required');
        return;
      }
      if (!email.trim()) {
        setError('Please enter your email address');
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address');
        return;
      }
      if (!password.trim()) {
        setError('Please create a password');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    } else if (currentStep === 2) {
      // Validate step 2: Demographics (Baseline B1-B5)
      if (!ageRange || !gender || !raceEthnicity || !firstLanguage || !workExperience) {
        setError('Please complete all demographic fields');
        return;
      }
      if (firstLanguage === 'other' && !firstLanguageOther.trim()) {
        setError('Please specify your first language');
        return;
      }
    } else if (currentStep === 3) {
      // Validate step 3: Financial Background (Baseline B6-B8)
      if (priorFinancialProducts.length === 0 || !selfRatedFinancialKnowledge || !financialStressFrequency) {
        setError('Please complete all financial background fields');
        return;
      }
    }
    setError('');
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Final validation
    if (!consent) {
      setError('Please provide consent to continue');
      return;
    }

    if (!studentId.trim() || !courseCode.trim()) {
      setError('Student ID and Course Code are required');
      return;
    }

    // Validate financial background
    if (priorFinancialProducts.length === 0 || !selfRatedFinancialKnowledge || !financialStressFrequency) {
      setError('Please complete all financial background fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseCode: courseCode.trim(),
          studentId: studentId.trim(),
          email: email.trim(),
          password: password.trim(),
          demographic: {
            age_range: ageRange || null, // B3
            gender: gender || null, // B1
            race_ethnicity: raceEthnicity || null, // B2
            first_language: firstLanguage || null, // B4
            first_language_other: firstLanguage === 'other' ? firstLanguageOther : null, // B4
            work_experience: workExperience || null, // B5
          },
          financial_background: {
            prior_financial_products: priorFinancialProducts, // B6: Array
            self_rated_financial_knowledge: selfRatedFinancialKnowledge || null, // B7
            financial_stress_frequency: financialStressFrequency || null, // B8
          },
          socioeconomic: {
            household_income: householdIncome || null,
            parental_education: parentalEducation || null,
            first_generation_college: firstGenerationCollege,
            financial_aid_recipient: financialAidRecipient,
            living_situation: livingSituation || null,
            work_study: workStudy,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save onboarding data');
      }

      // Store session data
      const sessionData = {
        courseCode: courseCode.trim(),
        studentId: studentId.trim(),
        userId: data.data.userId,
        courseId: data.data.courseId,
        hasCompletedOnboarding: true,
        loginTime: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('student-session', JSON.stringify(sessionData));
      }

      // Redirect to assessment (user can choose pre or post)
      router.push('/assessment');
    } catch (err: any) {
      console.error('Error submitting onboarding:', err);
      setError(err.message || 'Unable to save your information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm border-b border-loyola-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold gradient-text">Financial Literacy Toolkit</span>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-loyola-maroon/10 flex items-center justify-center">
              <User className="w-5 h-5 text-loyola-maroon" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-loyola-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-loyola-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-loyola-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-loyola-maroon to-loyola-gold h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 border border-loyola-gray-200">
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Student ID */}
          {currentStep === 1 && (
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-loyola-gray-900 mb-2">Welcome!</h1>
                <p className="text-loyola-gray-600">
                  Let's get started by collecting some basic information. This will help us personalize your experience and ensure accurate assessment results.
                </p>
              </div>

              <div className="mb-6">
                <label htmlFor="course-code" className="block text-sm font-medium text-gray-700 mb-2">
                  Course Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="course-code"
                  value={courseCode}
                  readOnly
                  className="w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg bg-loyola-gray-50 text-loyola-gray-600"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="student-id" className="block text-sm font-medium text-gray-700 mb-2">
                  Student ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="student-id"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                  placeholder="Enter your student ID"
                  required
                />
                <p className="mt-1 text-sm text-loyola-gray-500">
                  Your student ID will be securely hashed and never stored in plain text.
                </p>
              </div>

              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                  placeholder="Enter your email address"
                  required
                />
                <p className="mt-1 text-sm text-loyola-gray-500">
                  We'll use this email to send you password reset links if needed.
                </p>
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Create Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                  placeholder="Create a password (minimum 8 characters)"
                  required
                />
                <p className="mt-1 text-sm text-loyola-gray-500">
                  You'll use this password along with your Student ID to log in for both pre and post assessments.
                </p>
              </div>

              <div className="mb-6">
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <div className="bg-loyola-gold/10 border-2 border-loyola-gold/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-loyola-maroon flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-loyola-gray-700">
                      <strong>Privacy Notice:</strong> All information you provide is confidential and will be used only for research and educational purposes. Your student ID is hashed using industry-standard encryption.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-medium py-3 px-6 rounded-lg transition flex items-center gap-2"
                >
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Demographics (Baseline B1-B5) */}
          {currentStep === 2 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-loyola-gray-900 mb-2">Demographic Information</h2>
                <p className="text-loyola-gray-600">
                  This information helps us understand the diversity of our student population and ensures fair assessment practices.
                </p>
              </div>

              <div className="space-y-6">
                {/* B1: Gender */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    What is your gender? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                {/* B2: Race/Ethnicity */}
                <div>
                  <label htmlFor="race-ethnicity" className="block text-sm font-medium text-gray-700 mb-2">
                    Which category best describes your racial or ethnic background? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="race-ethnicity"
                    value={raceEthnicity}
                    onChange={(e) => setRaceEthnicity(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                    required
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
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* B3: Age Range */}
                <div>
                  <label htmlFor="age-range" className="block text-sm font-medium text-gray-700 mb-2">
                    What is your age range? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="age-range"
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                    required
                  >
                    <option value="">Select age range</option>
                    <option value="20-or-under">20 or under</option>
                    <option value="above-20">Above 20</option>
                  </select>
                </div>

                {/* B4: First Language */}
                <div>
                  <label htmlFor="first-language" className="block text-sm font-medium text-gray-700 mb-2">
                    What is your first language? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="first-language"
                    value={firstLanguage}
                    onChange={(e) => setFirstLanguage(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                    required
                  >
                    <option value="">Select first language</option>
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="chinese">Chinese (any dialect)</option>
                    <option value="french">French</option>
                    <option value="russian">Russian</option>
                    <option value="dutch">Dutch</option>
                    <option value="other">Other (please specify)</option>
                  </select>
                  {firstLanguage === 'other' && (
                    <input
                      type="text"
                      value={firstLanguageOther}
                      onChange={(e) => setFirstLanguageOther(e.target.value)}
                      className="w-full mt-2 px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                      placeholder="Please specify your first language"
                      required={firstLanguage === 'other'}
                    />
                  )}
                </div>

                {/* B5: Work Experience */}
                <div>
                  <label htmlFor="work-experience" className="block text-sm font-medium text-gray-700 mb-2">
                    Do you have work experience? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="work-experience"
                    value={workExperience}
                    onChange={(e) => setWorkExperience(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                    required
                  >
                    <option value="">Select work experience</option>
                    <option value="no-work-experience">No work experience</option>
                    <option value="part-time">Part-time employment</option>
                    <option value="full-time">Full-time employment</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={handleBack}
                  className="border-2 border-loyola-gray-300 text-loyola-gray-700 hover:bg-loyola-gray-50 font-medium py-3 px-6 rounded-lg transition flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-medium py-3 px-6 rounded-lg transition flex items-center gap-2"
                >
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Financial Background & Socio-economic */}
          {currentStep === 3 && (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-loyola-gray-900 mb-2">Financial Background & Context</h2>
                <p className="text-loyola-gray-600">
                  This information helps us understand your financial background and context for the assessment.
                </p>
              </div>

              <div className="space-y-6">
                {/* B6: Prior Financial Products */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prior to enrolling in this course, had you personally used any of the following financial products? (Select all that apply) <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2 border-2 border-loyola-gray-300 rounded-lg p-4">
                    {[
                      { value: 'credit-card', label: 'Credit card' },
                      { value: 'student-loan', label: 'Student loan' },
                      { value: 'auto-loan', label: 'Auto loan' },
                      { value: 'investment-account', label: 'Investment account (stocks, ETFs, mutual funds)' },
                      { value: 'insurance', label: 'Insurance policy in your own name' },
                      { value: 'none', label: 'None of the above' },
                    ].map((product) => (
                      <label key={product.value} className="flex items-center">
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
                          className="mr-2 text-loyola-maroon accent-loyola-maroon"
                        />
                        <span>{product.label}</span>
                      </label>
                    ))}
                  </div>
                  {priorFinancialProducts.length === 0 && (
                    <p className="mt-1 text-sm text-red-600">Please select at least one option</p>
                  )}
                </div>

                {/* B7: Self-Rated Financial Knowledge */}
                <div>
                  <label htmlFor="self-rated-knowledge" className="block text-sm font-medium text-gray-700 mb-2">
                    Before enrolling in this course, how would you rate your overall financial knowledge? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="self-rated-knowledge"
                    value={selfRatedFinancialKnowledge}
                    onChange={(e) => setSelfRatedFinancialKnowledge(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
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
                    How often do you feel financially stressed? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="financial-stress"
                    value={financialStressFrequency}
                    onChange={(e) => setFinancialStressFrequency(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                    required
                  >
                    <option value="">Select frequency</option>
                    <option value="never">Never</option>
                    <option value="rarely">Rarely</option>
                    <option value="sometimes">Sometimes</option>
                    <option value="often">Often</option>
                    <option value="always">Always</option>
                  </select>
                </div>

                <div className="border-t border-loyola-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-loyola-gray-900 mb-4">Additional Socio-Economic Information (Optional)</h3>
                </div>

                <div>
                  <label htmlFor="household-income" className="block text-sm font-medium text-gray-700 mb-2">
                    Household Income
                  </label>
                  <select
                    id="household-income"
                    value={householdIncome}
                    onChange={(e) => setHouseholdIncome(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                  >
                    <option value="">Select household income</option>
                    <option value="under-25000">Under $25,000</option>
                    <option value="25000-49999">$25,000 - $49,999</option>
                    <option value="50000-74999">$50,000 - $74,999</option>
                    <option value="75000-99999">$75,000 - $99,999</option>
                    <option value="100000-149999">$100,000 - $149,999</option>
                    <option value="150000-199999">$150,000 - $199,999</option>
                    <option value="200000-plus">$200,000 or more</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="parental-education" className="block text-sm font-medium text-gray-700 mb-2">
                    Highest Level of Parental Education
                  </label>
                  <select
                    id="parental-education"
                    value={parentalEducation}
                    onChange={(e) => setParentalEducation(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                  >
                    <option value="">Select education level</option>
                    <option value="high-school-or-less">High school or less</option>
                    <option value="some-college">Some college</option>
                    <option value="bachelors">Bachelor's degree</option>
                    <option value="masters">Master's degree</option>
                    <option value="doctorate">Doctorate or professional degree</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Are you a first-generation college student?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="first-generation"
                        value="yes"
                        checked={firstGenerationCollege === true}
                        onChange={() => setFirstGenerationCollege(true)}
                        className="mr-2 text-loyola-maroon accent-loyola-maroon"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="first-generation"
                        value="no"
                        checked={firstGenerationCollege === false}
                        onChange={() => setFirstGenerationCollege(false)}
                        className="mr-2 text-loyola-maroon accent-loyola-maroon"
                      />
                      No
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="first-generation"
                        value="prefer-not-to-say"
                        checked={firstGenerationCollege === null}
                        onChange={() => setFirstGenerationCollege(null)}
                        className="mr-2 text-loyola-maroon accent-loyola-maroon"
                      />
                      Prefer not to say
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you receive financial aid?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="financial-aid"
                        value="yes"
                        checked={financialAidRecipient === true}
                        onChange={() => setFinancialAidRecipient(true)}
                        className="mr-2 text-loyola-maroon accent-loyola-maroon"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="financial-aid"
                        value="no"
                        checked={financialAidRecipient === false}
                        onChange={() => setFinancialAidRecipient(false)}
                        className="mr-2 text-loyola-maroon accent-loyola-maroon"
                      />
                      No
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="financial-aid"
                        value="prefer-not-to-say"
                        checked={financialAidRecipient === null}
                        onChange={() => setFinancialAidRecipient(null)}
                        className="mr-2 text-loyola-maroon accent-loyola-maroon"
                      />
                      Prefer not to say
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="living-situation" className="block text-sm font-medium text-gray-700 mb-2">
                    Living Situation
                  </label>
                  <select
                    id="living-situation"
                    value={livingSituation}
                    onChange={(e) => setLivingSituation(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon transition"
                  >
                    <option value="">Select living situation</option>
                    <option value="on-campus">On-campus housing</option>
                    <option value="off-campus">Off-campus housing</option>
                    <option value="with-family">Living with family</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you participate in a work-study program?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="work-study"
                        value="yes"
                        checked={workStudy === true}
                        onChange={() => setWorkStudy(true)}
                        className="mr-2 text-loyola-maroon accent-loyola-maroon"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="work-study"
                        value="no"
                        checked={workStudy === false}
                        onChange={() => setWorkStudy(false)}
                        className="mr-2 text-loyola-maroon accent-loyola-maroon"
                      />
                      No
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="work-study"
                        value="prefer-not-to-say"
                        checked={workStudy === null}
                        onChange={() => setWorkStudy(null)}
                        className="mr-2 text-loyola-maroon accent-loyola-maroon"
                      />
                      Prefer not to say
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="consent"
                        name="consent"
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="focus:ring-loyola-maroon h-5 w-5 text-loyola-maroon accent-loyola-maroon border-loyola-gray-300 rounded"
                        required
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="consent" className="font-medium text-gray-700">
                        I consent to participate and understand how my data will be used <span className="text-red-500">*</span>
                      </label>
                      <p className="text-gray-500 mt-1">
                        Your assessment data will be anonymized and used for learning improvement purposes. All information is confidential and protected under FERPA guidelines.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Validation for B6 */}
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={handleBack}
                  className="border-2 border-loyola-gray-300 text-loyola-gray-700 hover:bg-loyola-gray-50 font-medium py-3 px-6 rounded-lg transition flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-loyola-maroon hover:bg-loyola-maroon-dark text-white font-medium py-3 px-6 rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-5 h-5" />
                  {isSubmitting ? 'Saving...' : 'Complete & Start Assessment'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-loyola-gray-200 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-loyola-gray-600">
          <p>© 2025 by Dr. Abol Jalilvand and Guillaume Bolivard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

