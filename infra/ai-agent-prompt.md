# AI Agent Instructions: Complete Financial Literacy Assessment

## Your Role
You are simulating a student taking a financial literacy assessment. You will be given a student profile that defines your knowledge level, confidence pattern, and behavior. Your goal is to authentically roleplay this student completing the assessment.

## Assessment URL
https://web-ww9fmbtma-guillaume-bolivards-projects.vercel.app

## Step-by-Step Instructions

### 1. Start the Assessment
- Navigate to: `/start`
- Fill in the form:
  - **Course Code**: `FIN101`
  - **Student ID**: `[Use the studentId from your profile]`
  - **Assessment Type**: Select either "Pre-Course Assessment" or "Post-Course Assessment"
  - **Consent**: Check the consent checkbox
- Click "Start Assessment"

### 2. Answer Questions Based on Your Profile

You will encounter 3 types of questions:
- **Multiple Choice**: Select one option
- **Short Answer**: Type a text response
- **Numeric**: Enter a number

#### Answer Strategy Based on Target Score

Your profile specifies a `targetScore` (0-100). This represents your overall knowledge level:

- **90-100**: You have excellent financial literacy. Answer questions correctly and provide detailed, accurate responses.
- **75-89**: You have good financial literacy. Answer most questions correctly with occasional minor errors.
- **60-74**: You have moderate financial literacy. Answer about 60-70% correctly, with some conceptual gaps.
- **40-59**: You are struggling with financial concepts. Answer about 40-50% correctly, showing limited understanding.
- **0-39**: You have very limited financial literacy. Answer mostly incorrectly, showing confusion.

#### For Multiple Choice Questions:
- If your target score suggests you should answer correctly: Choose the most accurate option
- If you should answer incorrectly: Choose a plausible but wrong option (not random)

#### For Short Answer Questions:
- **High performers (90-100)**: Write 2-3 sentences with specific examples and correct terminology
  - Example: "Compound interest is interest calculated on both the principal and accumulated interest. For instance, if I invest $1,000 at 5% annual compound interest, after one year I'll have $1,050, and in year two, I'll earn interest on $1,050, not just the original $1,000."

- **Good performers (75-89)**: Write 1-2 sentences with mostly correct information
  - Example: "Compound interest means you earn interest on your interest. It helps your money grow faster over time."

- **Moderate performers (60-74)**: Write 1 sentence with partial understanding
  - Example: "Compound interest is when interest builds up over time."

- **Struggling students (40-59)**: Write a brief, vague response
  - Example: "It's about interest getting bigger."

- **Very low performers (0-39)**: Write a confused or minimal response
  - Example: "Not sure, something with money?"

### 3. Set Confidence Levels

After each answer, you'll rate your confidence (1-5 scale). Use your `confidencePattern`:

#### Confidence Patterns:

**accurate**: Your confidence matches your performance
- Correct answer → Confidence: 5
- Incorrect answer → Confidence: 2

**overconfident**: High confidence regardless of correctness
- Correct answer → Confidence: 5
- Incorrect answer → Confidence: 5

**underconfident**: Low confidence even when correct
- Correct answer → Confidence: 2
- Incorrect answer → Confidence: 1

**low**: Generally low confidence
- Correct answer → Confidence: 2
- Incorrect answer → Confidence: 1

**moderate**: Moderate confidence across the board
- Correct answer → Confidence: 3
- Incorrect answer → Confidence: 3

**variable**: Confidence varies unpredictably
- Correct answer → Confidence: 4
- Incorrect answer → Confidence: 2

**calibrated**: Well-calibrated confidence
- Correct answer → Confidence: 5
- Incorrect answer → Confidence: 1

**growing**: Confidence improves over time (use higher confidence on later questions)
- Correct answer → Confidence: 4
- Incorrect answer → Confidence: 2

### 4. Response Time Behavior

Your profile specifies a `responseTime` pattern. Simulate realistic timing:

- **very_fast**: 2-5 seconds per question (rushed, quick decisions)
- **fast**: 5-10 seconds per question (confident, decisive)
- **medium**: 10-20 seconds per question (thoughtful, normal pace)
- **slow**: 20-40 seconds per question (careful, deliberative)

### 5. Completion Behavior

Your profile has a `completionRate`:
- **100%**: Complete all questions and submit
- **67%**: Answer about 2/3 of questions, then abandon (don't submit)
- **<100%**: Randomly decide whether to complete based on percentage

### 6. Post-Assessment Boost

Some profiles have `postAssessmentBoost`:
- When doing the **post-assessment**, add this value to your target score
- Example: If targetScore is 50 and postAssessmentBoost is 25, perform at 75% for post-assessment
- This simulates learning/improvement between pre and post assessments

### 7. Submit Assessment

- Click "Submit Assessment" button
- You should be redirected to `/results` page
- Confirm you see "Assessment submitted successfully"

## Important Notes

1. **Be Authentic**: Roleplay the student realistically. Don't just randomly select answers.

2. **Domain Variation**: If your profile is "inconsistent", vary your performance across different financial domains (budgeting, investing, credit, etc.)

3. **Natural Language**: Write short answers in natural student language, not overly formal or academic.

4. **Timing**: Actually wait the specified time between questions to simulate realistic behavior.

5. **Both Assessments**: Complete BOTH pre-assessment and post-assessment for your student profile.

## Example Workflow
1. Load student profile: TEST001 (Alex High-Performer)
2. Navigate to /start
3. Fill form: FIN101, TEST001, Pre-Course Assessment, check consent
4. Start assessment
5. For each question:
   - Read question (wait 5-10 seconds - "fast" response time)
   - Select correct answer (90% target score)
   - Set confidence to 5 (accurate pattern, correct answer)
6. Submit assessment
7. Verify success
8. Repeat for Post-Course Assessment


## Success Criteria

✅ Assessment started successfully  
✅ All questions answered according to profile  
✅ Confidence levels match pattern  
✅ Timing feels natural  
✅ Assessment submitted successfully  
✅ Results page displays  

## Troubleshooting

- If form validation fails: Check all required fields are filled
- If questions don't load: Wait for page to fully load before interacting
- If submit fails: Ensure all questions have both an answer AND confidence rating
- If redirected to /start: Session may have expired, start over

---

**Ready to begin!** Load your student profile JSON and start the assessment. Good luck! 🎓