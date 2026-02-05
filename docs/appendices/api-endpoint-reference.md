# Appendix A: API Endpoint Reference

## Overview

All API endpoints are located under `/api/` and follow RESTful conventions. Authentication is required for protected endpoints.

---

## Student Endpoints

### POST `/api/student/login`

Authenticate student and create/resume assessment session.

**Request Body**:
```json
{
  "courseCode": "QUINN102",
  "studentId": "123456789"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "userId": "uuid",
    "hashedKey": "sha256_hash"
  },
  "attempt": {
    "attemptId": "uuid",
    "status": "in_progress" | "completed",
    "currentQuestion": 15
  },
  "needsOnboarding": true | false
}
```

**Rate Limit**: 10 requests per IP per 5 minutes

---

### POST `/api/onboarding/submit`

Submit baseline demographic questionnaire (B1-B13).

**Request Body**:
```json
{
  "userId": "uuid",
  "courseId": "uuid",
  "responses": {
    "gender": "female",
    "raceEthnicity": "asian",
    "ageRange": "20-or-under",
    "firstLanguage": "english",
    "workExperience": "part-time",
    "priorFinancialProducts": ["credit-card", "student-loan"],
    "selfRatedFinancialKnowledge": "moderate",
    "financialStressFrequency": "sometimes",
    "parentalEducation": "bachelors-degree",
    "firstGenerationCollege": "no",
    "hasStudentLoanDebt": "yes",
    "studentLoanInterestRate": "between-5-and-10",
    "studentLoanMaturity": "above-5-years"
  }
}
```

**Response**:
```json
{
  "success": true,
  "profileId": "uuid"
}
```

---

### POST `/api/assessment/save`

Save response to a single question (auto-save).

**Request Body**:
```json
{
  "attemptId": "uuid",
  "sessionToken": "uuid",
  "itemId": "uuid",
  "response": {
    "selectedOption": "a",
    "confidence": 2
  }
}
```

**Response**:
```json
{
  "success": true,
  "responseId": "uuid",
  "nextQuestion": 16
}
```

---

### POST `/api/assessment/submit`

Submit completed assessment for scoring.

**Request Body**:
```json
{
  "attemptId": "uuid",
  "sessionToken": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "scores": {
    "overall": 68.5,
    "byDomain": {
      "borrowing_credit": 72.0,
      "risk_management": 55.0,
      "investment_risk": 70.0
    },
    "standardError": 3.2,
    "overconfidenceIndex": 0.15
  }
}
```

---

### GET `/api/assessment/resume`

Resume an in-progress assessment.

**Query Parameters**:
- `attemptId` (required): UUID of the attempt
- `sessionToken` (required): Session token for validation

**Response**:
```json
{
  "success": true,
  "attempt": {
    "attemptId": "uuid",
    "currentQuestion": 25,
    "responses": [
      {"itemId": "uuid", "response": {...}, "confidence": 2}
    ]
  }
}
```

---

### GET `/api/plan-b/status`

Get SDM-10 selection status (after Q40).

**Query Parameters**:
- `attemptId` (required): UUID of the attempt

**Response**:
```json
{
  "success": true,
  "sdmItems": [
    {
      "itemId": "uuid",
      "variantType": "Open_Diagnose",
      "anchorItemId": "Q6",
      "needScore": 5
    }
  ],
  "totalItems": 10
}
```

---

### GET `/api/items`

Retrieve question bank items.

**Query Parameters**:
- `instrumentId` (required): UUID of the instrument
- `active` (optional): Filter by is_active status

**Response**:
```json
{
  "items": [
    {
      "itemId": "uuid",
      "externalItemId": "1",
      "domain": "Borrowing, Interest Rates, and Financial Numeracy Knowledge",
      "subdomain": "Compound Interest",
      "stem": "Suppose you had $100...",
      "options": [
        {"id": "a", "text": "More than $102"},
        {"id": "b", "text": "Exactly $102"},
        {"id": "c", "text": "Less than $102"},
        {"id": "d", "text": "Do not know"}
      ],
      "isScored": true
    }
  ]
}
```

---

## Instructor Endpoints

### POST `/api/instructor/login`

Authenticate instructor and create session.

**Request Body**:
```json
{
  "email": "instructor@university.edu",
  "password": "secure_password"
}
```

**Response**:
```json
{
  "success": true,
  "token": "session_token",
  "instructor": {
    "instructorId": "uuid",
    "fullName": "Dr. Smith",
    "email": "instructor@university.edu"
  },
  "courses": [
    {"courseId": "uuid", "name": "Quinn 102", "term": "Spring 2026"}
  ]
}
```

---

### GET `/api/instructor/dashboard`

Get course dashboard summary.

**Headers**:
- `Authorization`: `Bearer <session_token>`

**Query Parameters**:
- `courseId` (required): UUID of the course

**Response**:
```json
{
  "success": true,
  "summary": {
    "totalEnrolled": 197,
    "totalStarted": 186,
    "totalCompleted": 171,
    "inProgress": 15,
    "averageScore": 65.73,
    "averageDuration": 1847
  },
  "recentSubmissions": [...],
  "scoreDistribution": [
    {"range": "0-10", "count": 0},
    {"range": "10-20", "count": 0},
    ...
  ]
}
```

---

### GET `/api/instructor/analytics`

Get detailed analytics data.

**Headers**:
- `Authorization`: `Bearer <session_token>`

**Query Parameters**:
- `courseId` (required): UUID of the course

**Response**:
```json
{
  "success": true,
  "performanceMetrics": {...},
  "baselineCovariates": {...},
  "riskProfiles": {...},
  "learningGains": {
    "overall": {...},
    "byDomain": [...],
    "cronbachAlpha": {...},
    "efa": {...},
    "sur": {...}
  }
}
```

---

### GET `/api/instructor/questions`

Get question bank with response statistics.

**Headers**:
- `Authorization`: `Bearer <session_token>`

**Query Parameters**:
- `courseId` (required): UUID of the course

**Response**:
```json
{
  "questions": [
    {
      "itemId": "uuid",
      "externalItemId": "1",
      "stem": "...",
      "correctAnswer": "a",
      "statistics": {
        "totalResponses": 171,
        "correctCount": 142,
        "correctRate": 0.83,
        "averageConfidence": 2.4
      }
    }
  ]
}
```

---

## Health Check Endpoints

### GET `/api/healthz`

Liveness check (no database dependency).

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-05T12:00:00Z"
}
```

---

### GET `/api/readyz`

Readiness check (full dependency verification).

**Response**:
```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "redis": "ok"
  },
  "timestamp": "2026-02-05T12:00:00Z"
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_SESSION",
    "message": "Session token is invalid or expired"
  }
}
```

**Common Error Codes**:
- `INVALID_CREDENTIALS`: Invalid course code or student ID
- `INVALID_SESSION`: Session token expired or invalid
- `RATE_LIMITED`: Too many requests
- `ALREADY_SUBMITTED`: Assessment already completed
- `CONCURRENT_ACCESS`: Multi-tab access detected
- `INTERNAL_ERROR`: Server-side error
