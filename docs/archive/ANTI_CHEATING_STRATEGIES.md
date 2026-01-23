# Anti-Cheating Strategies for Online Assessments

## Overview

This document outlines practical strategies to prevent cheating during online financial literacy assessments, specifically addressing concerns about students using external websites (ChatGPT, Google, etc.) to find answers.

---

## Current Assessment Context

Based on the research study design:
- **Assessment Type**: Pre-course and post-course assessments
- **Administration**: Digital platform (web-based)
- **Timing**: Pre-course (second week of class), Post-course (last day of class)
- **Purpose**: Measure learning outcomes (research + pedagogical)
- **Context**: Required course assignment

---

## Multi-Layered Approach (Recommended)

### Strategy 1: **Time Limits** ⏱️ (Recommended - High Impact, Easy to Implement)

**Implementation**:
- Set reasonable time limits per question or total assessment time
- Prevents extensive time for searching external sources
- Creates pressure that makes cheating less practical

**Recommended Settings**:
- **Per Question**: 2-3 minutes (forces quick responses)
- **Total Assessment**: 60-90 minutes for 30 questions (prevents extensive research)

**Pros**:
- ✅ Easy to implement
- ✅ Effective deterrent
- ✅ Standard practice
- ✅ No privacy concerns
- ✅ Doesn't require special software

**Cons**:
- ⚠️ May stress some students
- ⚠️ Need to balance fairness vs. anti-cheating

**Current Status**: Check if timer exists; if not, implement.

---

### Strategy 2: **Browser Restrictions / Lockdown Mode** 🔒 (Recommended for High-Stakes)

**Implementation Options**:

#### Option A: **Fullscreen + Tab Blocker** (Browser-based)
- JavaScript to detect tab switches
- Fullscreen API to lock browser
- Warn/flag when user switches tabs or loses focus

#### Option B: **Respondus LockDown Browser** (Third-party)
- Professional lockdown browser solution
- Blocks all other applications
- Prevents copying, printing, access to other websites
- **Cost**: Licensing required (check if your institution has access)

#### Option C: **Institutional Exam Software** (e.g., Examity, ProctorU)
- Full proctoring solution
- Screen recording, identity verification
- **Cost**: Can be expensive
- **Privacy**: More invasive

**Recommendation**: Start with Option A (browser-based), consider Respondus if budget allows.

**Pros**:
- ✅ More effective than timer alone
- ✅ Standard in online education
- ✅ Respondus is widely used in higher ed

**Cons**:
- ⚠️ Requires additional software/setup
- ⚠️ Privacy concerns (especially full proctoring)
- ⚠️ Can be circumvented by tech-savvy students

---

### Strategy 3: **Question Randomization** 🔀 (Easy to Implement)

**Implementation**:
- Randomize question order for each student
- Multiple versions of questions (different wordings)
- Randomize answer options (multiple choice)
- Shuffle question bank if you have more questions than displayed

**Pros**:
- ✅ Makes sharing answers harder
- ✅ Easy to implement
- ✅ Standard practice
- ✅ No privacy concerns

**Cons**:
- ⚠️ Doesn't prevent external searching (just makes coordination harder)

**Current Status**: Check if randomization exists; implement if not.

---

### Strategy 4: **Question Design** 📝 (Long-term Strategy)

**Design Principles**:
- **Application-based questions**: Scenario-based, require reasoning
- **Context-specific**: Questions that can't be easily Googled
- **Multiple steps**: Require combining concepts
- **Personalized scenarios**: Based on student demographics (with permission)

**Example Transformation**:
- ❌ **Easy to Google**: "What is compound interest?"
- ✅ **Harder to Google**: "Sarah invests $5,000 at 4% annual compound interest for 8 years. She withdraws $2,000 after 4 years. How much will she have after 8 years?"

**Pros**:
- ✅ Most effective long-term solution
- ✅ Better assessment of understanding
- ✅ Reduces value of cheating

**Cons**:
- ⚠️ Requires question redesign
- ⚠️ Time-consuming
- ⚠️ Not immediate solution

---

### Strategy 5: **Honor Code + Acknowledgment** ✅ (Easy, Low Cost)

**Implementation**:
- Explicit acknowledgment before assessment starts
- Clear statement about academic integrity
- Warning about consequences
- Research shows honor codes reduce cheating

**Language Example**:
```
"I acknowledge that this assessment must be completed independently, without assistance from external sources, other people, or AI tools. I understand that academic dishonesty may result in course failure."
```

**Pros**:
- ✅ Easy to implement
- ✅ Shows seriousness
- ✅ Some students respect it
- ✅ Creates psychological deterrent

**Cons**:
- ⚠️ Less effective for determined cheaters
- ⚠️ Not enforceable without monitoring

**Current Status**: Add to assessment start page.

---

### Strategy 6: **In-Person Administration** 🏫 (Most Effective, Not Always Practical)

**Implementation**:
- Conduct assessments in computer lab with supervision
- Instructor/supervisor present
- Controlled environment

**Pros**:
- ✅ Most effective at preventing cheating
- ✅ Standard for high-stakes assessments
- ✅ No technology needed

**Cons**:
- ⚠️ Requires scheduling and space
- ⚠️ May not be feasible for large classes
- ⚠️ Less flexible for students

**Consideration**: For post-course assessment, could be combined with final exam session.

---

### Strategy 7: **Assessment Analytics / Anomaly Detection** 📊 (Detection, Not Prevention)

**Implementation**:
- Flag unusually fast completion times
- Detect perfect scores (suspicious patterns)
- Compare pre/post patterns for inconsistencies
- Flag responses that match known answer sources

**Pros**:
- ✅ Can detect cheating after the fact
- ✅ Helps identify problem cases
- ✅ No student burden

**Cons**:
- ⚠️ Doesn't prevent cheating (only detects)
- ⚠️ Requires manual review
- ⚠️ False positives possible

---

## Recommended Implementation Plan

### **Phase 1: Immediate (Easy Wins)** ⚡

1. **Add Timer** (if not present)
   - Total assessment time limit
   - Per-question warning (optional)
   - Visual countdown

2. **Add Honor Code Acknowledgment**
   - Before assessment starts
   - Clear language about academic integrity

3. **Question Randomization** (if not present)
   - Randomize question order
   - Randomize answer options

### **Phase 2: Short-term (1-2 months)** 📅

4. **Browser Tab Detection**
   - JavaScript to detect tab switches
   - Warning system (not blocking - just warning/flagging)
   - Log suspicious behavior

5. **Fullscreen Mode**
   - Encourage fullscreen
   - Lock browser focus

6. **Assessment Analytics**
   - Flag fast completions
   - Detect perfect scores
   - Review suspicious patterns

### **Phase 3: Long-term (Future)** 🔮

7. **Respondus LockDown Browser** (if budget allows)
   - Professional solution
   - Institution-wide license

8. **Question Redesign**
   - Application-based questions
   - Scenario-based assessments
   - Context-specific questions

9. **In-Person Option** (if feasible)
   - For high-stakes assessments
   - Controlled environment

---

## Practical Recommendation for Your Context

### **Best Balance: Practical + Effective**

**Recommended Combination**:

1. ✅ **Time Limit**: 90 minutes total (3 minutes per question average)
2. ✅ **Honor Code**: Acknowledgment before assessment starts
3. ✅ **Randomization**: Random question order, randomized answers
4. ✅ **Tab Detection**: JavaScript warning (logs but doesn't block)
5. ✅ **Fullscreen Encouragement**: Suggest fullscreen mode
6. ✅ **Analytics**: Flag suspicious patterns for review

**Why This Combination**:
- **Effective**: Multiple layers make cheating harder
- **Practical**: No expensive software required
- **Fair**: Balances anti-cheating with student experience
- **Legal/Privacy**: Minimal privacy concerns
- **Implementable**: Can be done quickly

---

## Implementation Priority

### **High Priority** (Implement First):
1. ⭐ **Timer** - High impact, easy
2. ⭐ **Honor Code** - Low effort, some impact
3. ⭐ **Randomization** - Easy, makes coordination harder

### **Medium Priority** (Consider Next):
4. ⭐⭐ **Tab Detection** - Moderate effort, good deterrent
5. ⭐⭐ **Fullscreen Mode** - Easy, adds layer
6. ⭐⭐ **Analytics** - Moderate effort, helps detection

### **Lower Priority** (Future Consideration):
7. ⭐⭐⭐ **Respondus LockDown Browser** - Requires budget/licensing
8. ⭐⭐⭐ **Question Redesign** - Long-term improvement
9. ⭐⭐⭐ **In-Person Administration** - If feasible

---

## Legal and Ethical Considerations

### **Privacy**:
- ⚠️ Browser monitoring (tab detection) should be disclosed
- ⚠️ Screen recording (proctoring) requires consent
- ⚠️ Balance security with privacy

### **Accessibility**:
- ⚠️ Time limits may disadvantage some students
- ⚠️ Fullscreen/lockdown may cause issues for assistive technologies
- ⚠️ Provide accommodations as needed

### **Academic Integrity**:
- ✅ Clear policies and consequences
- ✅ Consistent enforcement
- ✅ Fair process for appeals

---

## Code Implementation Examples

### Timer Implementation:
```typescript
// Add timer state
const [timeRemaining, setTimeRemaining] = useState(5400); // 90 minutes in seconds

useEffect(() => {
  const timer = setInterval(() => {
    setTimeRemaining(prev => {
      if (prev <= 0) {
        // Auto-submit when time expires
        handleSubmit();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

### Tab Detection:
```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // User switched tabs/windows
      setTabSwitches(prev => prev + 1);
      // Log or warn user
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

---

## Summary

### **Quick Answer**: 

**Most Practical Approach**:
1. ✅ **Time limits** (90 minutes total)
2. ✅ **Honor code acknowledgment**
3. ✅ **Question randomization**
4. ✅ **Tab detection warnings** (logs, doesn't block)
5. ✅ **Analytics for flagging suspicious patterns**

**Why This Works**:
- Multiple layers make cheating harder
- No expensive software required
- Balances effectiveness with practicality
- Minimal privacy concerns
- Can be implemented quickly

**Consider Adding Later**:
- Respondus LockDown Browser (if budget allows)
- Question redesign (application-based)
- In-person administration (if feasible)

---

**Last Updated**: January 2025  
**Status**: Guidance document  
**Recommendation**: Start with Phase 1 (Timer, Honor Code, Randomization), then add Phase 2 features as needed
