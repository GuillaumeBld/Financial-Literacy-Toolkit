# Test Assessment Submission

## Test Data
```json
{
  "courseCode": "Financial Literacy",
  "studentId": "TEST12345",
  "attemptType": "pre",
  "responses": [
    {
      "itemId": "550e8400-e29b-41d4-a716-446655440010",
      "answer": "c",
      "confidence": 5
    },
    {
      "itemId": "550e8400-e29b-41d4-a716-446655440011",
      "answer": "a",
      "confidence": 4
    },
    {
      "itemId": "550e8400-e29b-41d4-a716-446655440012",
      "answer": "A debit card withdraws money directly from your bank account, while a credit card allows you to borrow money that you must repay later.",
      "confidence": 3
    }
  ],
  "timeSpent": 850
}
```

## Expected Behavior
1. User created with hashed student key
2. Attempt created and submitted
3. 3 responses saved
4. Scores calculated (multiple choice: 100% each, short answer: 50% placeholder)
5. Success message returned with attempt ID

## Manual Test URL
http://localhost:3000/start

