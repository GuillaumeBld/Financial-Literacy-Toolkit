#!/usr/bin/env python3
"""
Import the 40 anchor questions from Questions.csv (source of truth from Archive.zip).

This script:
1. Reads Questions.csv from archive_extracted/
2. Imports only the 40 anchor questions (Q1-Q40), NOT the baseline questions (B1-B12)
3. Marks Q15-Q28 as preference items (is_scored=false) - they don't contribute to learning gains
4. Sets is_anchor=true for all 40 questions
5. Uses external_item_id to store the original question number (1-40)

Source of Truth Structure:
- B1-B12: Baseline covariates (handled in onboarding, NOT imported here)
- Q1-Q10: Borrowing, Interest Rates, and Financial Numeracy Knowledge (SCORED)
- Q11-Q14: Behavioral and Risk Management Knowledge - Factual (SCORED)
- Q15-Q28: Behavioral and Risk Management Knowledge - Preferences (NOT SCORED)
- Q29-Q40: Risk and Return Knowledge (SCORED)
"""

import csv
import json
import os
import re
import sys
from typing import Dict, List, Optional, Tuple

try:
    import psycopg2
    from psycopg2.extras import Json
except ImportError:
    print("Error: psycopg2 is required. Install with: pip install psycopg2-binary")
    sys.exit(1)


def parse_options(options_str: str) -> Optional[List[Dict[str, str]]]:
    """Parse options from CSV format: 'A) Option 1 | B) Option 2 | ...'"""
    if not options_str or not options_str.strip():
        return None

    options = []
    parts = options_str.split('|')

    for part in parts:
        part = part.strip()
        if not part:
            continue

        # Match pattern like "A) Option text"
        match = re.match(r'^([A-Z])\)\s*(.+)$', part)
        if match:
            option_id = match.group(1).lower()
            option_text = match.group(2).strip()
            options.append({"id": option_id, "text": option_text})

    return options if options else None


def extract_correct_key(correct_answer: str) -> Optional[str]:
    """Extract the answer key (e.g., 'a', 'b') from correct answer."""
    if not correct_answer or not correct_answer.strip():
        return None

    clean = correct_answer.strip()

    # Handle "B." format (with trailing period)
    if clean.endswith('.'):
        clean = clean[:-1]

    # Handle "B or C" format - take first option
    if ' or ' in clean.lower():
        clean = clean.split(' or ')[0].strip()

    # Extract just the letter if it's like "A) More than $102"
    match = re.match(r'^([A-Z])\)', clean, re.IGNORECASE)
    if match:
        return match.group(1).lower()

    # If it's just a single letter
    if len(clean) == 1 and clean.upper() in 'ABCDEFGHI':
        return clean.lower()

    return None


def is_preference_item(question_id: str) -> bool:
    """Check if this is a preference item (Q15-Q28) that should not be scored."""
    try:
        q_num = int(question_id)
        return 15 <= q_num <= 28
    except (ValueError, TypeError):
        return False


def get_db_connection():
    """Get database connection from DATABASE_URL environment variable."""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("Error: DATABASE_URL environment variable is not set")
        sys.exit(1)

    try:
        return psycopg2.connect(database_url)
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)


def main():
    # Path to Questions.csv (source of truth)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    csv_path = os.path.join(project_root, 'archive_extracted', 'Questions.csv')

    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found")
        print("Make sure Archive.zip has been extracted to archive_extracted/")
        sys.exit(1)

    print(f"Reading questions from {csv_path}...")

    # Read and parse questions
    questions = []
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)

        for row in reader:
            question_id = row.get('question_id', '').strip()

            # Skip baseline questions (B1-B12) - they're handled in onboarding
            if question_id.startswith('B'):
                continue

            # Skip if no question_id or question_text
            question_text = row.get('question_text', '').strip()
            if not question_id or not question_text:
                continue

            # Parse data
            section = row.get('section', '').strip()
            subsection = row.get('subsection', '').strip()
            tags = row.get('tags', '').strip()
            options_str = row.get('options', '').strip()
            correct_answer = row.get('correct_answer', '').strip()

            # Parse options and extract correct key
            options = parse_options(options_str)
            key = extract_correct_key(correct_answer)

            # Determine if this is a preference item (Q15-Q28)
            is_scored = not is_preference_item(question_id)

            # Determine question type
            q_type = 'multiple_choice' if options else 'short_answer'

            questions.append({
                'external_item_id': question_id,
                'domain': section,
                'subdomain': subsection or tags,
                'stem': question_text,
                'options': options,
                'key': key,
                'type': q_type,
                'is_scored': is_scored,
                'is_anchor': True,
                'is_active': True,
                'difficulty': 0.5,  # Default difficulty
            })

    print(f"Found {len(questions)} anchor questions (Q1-Q40)")

    # Count scored vs preference items
    scored_count = sum(1 for q in questions if q['is_scored'])
    preference_count = len(questions) - scored_count
    print(f"  - Scored knowledge items: {scored_count} (Q1-Q14, Q29-Q40)")
    print(f"  - Preference items (not scored): {preference_count} (Q15-Q28)")

    # Connect to database and import
    print("\nConnecting to database...")
    conn = get_db_connection()
    cur = conn.cursor()

    # Check if is_scored column exists
    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'items' AND column_name = 'is_scored'
    """)
    if not cur.fetchone():
        print("Warning: is_scored column not found. Run migration first:")
        print("  psql $DATABASE_URL -f infra/migration-confidence-1-3-and-preference.sql")
        cur.close()
        conn.close()
        sys.exit(1)

    print("Importing questions...")

    inserted = 0
    updated = 0

    for q in questions:
        # Check if question already exists by external_item_id
        cur.execute(
            "SELECT item_id FROM items WHERE external_item_id = %s",
            (q['external_item_id'],)
        )
        existing = cur.fetchone()

        options_json = Json(q['options']) if q['options'] else None

        if existing:
            # Update existing question
            cur.execute("""
                UPDATE items SET
                    domain = %s,
                    subdomain = %s,
                    stem = %s,
                    options = %s,
                    key = %s,
                    type = %s,
                    is_scored = %s,
                    is_anchor = %s,
                    is_active = %s,
                    difficulty = %s
                WHERE external_item_id = %s
            """, (
                q['domain'],
                q['subdomain'],
                q['stem'],
                options_json,
                q['key'],
                q['type'],
                q['is_scored'],
                q['is_anchor'],
                q['is_active'],
                q['difficulty'],
                q['external_item_id'],
            ))
            updated += 1
        else:
            # Insert new question
            cur.execute("""
                INSERT INTO items (
                    external_item_id, domain, subdomain, stem, options, key,
                    type, is_scored, is_anchor, is_active, difficulty
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                q['external_item_id'],
                q['domain'],
                q['subdomain'],
                q['stem'],
                options_json,
                q['key'],
                q['type'],
                q['is_scored'],
                q['is_anchor'],
                q['is_active'],
                q['difficulty'],
            ))
            inserted += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"\nImport complete:")
    print(f"  - Inserted: {inserted}")
    print(f"  - Updated: {updated}")
    print(f"  - Total: {inserted + updated}")


if __name__ == '__main__':
    main()
