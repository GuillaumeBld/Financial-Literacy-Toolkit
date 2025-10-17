# Data model

Core tables
- users(user_id, hashed_student_key, sso_provider, created_at)
- courses(course_id, name, term, pepper)
- enrollments(user_id, course_id, role)
- instruments(instrument_id, name, version, status)
- items(item_id, domain, subdomain, difficulty, type, stem, options, key, rubric, is_anchor)
- attempts(attempt_id, user_id, course_id, instrument_id, attempt_type, started_at, submitted_at, duration_s)
- responses(response_id, attempt_id, item_id, raw_answer, score, confidence, ai_confidence, ai_flags)
- scores(attempt_id, overall, by_domain, se_overall, overconfidence_index)

See migrations in infra for types and constraints.
