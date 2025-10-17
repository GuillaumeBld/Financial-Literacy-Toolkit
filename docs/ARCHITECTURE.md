# Architecture

- Next.js web app renders items and reports.
- API issues items, records answers, finalizes attempts.
- Python worker scores short text and runs analytics.
- Postgres stores users, items, attempts, responses, scores, audit logs.
- Storage for exports and logs.
- RLS by course.

Sequence
1. Student authenticates and starts attempt.
2. Web requests next item, displays, captures answer and confidence.
3. On submit, worker scores and writes scores.
4. Student and instructor view reports.
