#!/usr/bin/env python3
"""
Import questions from the source of truth (Archive.zip/Questions.csv).

This script imports the 40 anchor questions with correct settings:
- Q1-Q14: Knowledge items (is_scored=true)
- Q15-Q28: Preference items (is_scored=false) - Financial Attitudes and Preferences
- Q29-Q40: Knowledge items (is_scored=true)

All questions have:
- is_anchor=true
- is_active=true
- external_item_id matching the question number (1-40)
"""

import csv
import os
import sys
import json
import re
from typing import Dict, List, Optional, Tuple

try:
    import psycopg2
except ImportError:
    print("Error: psycopg2 is required. Install with: pip install psycopg2-binary")
    sys.exit(1)


def parse_options(options_str: str) -> List[Dict[str, str]]:
    """Parse options from pipe-separated format to JSON format."""
    if not options_str or not options_str.strip():
        return None

    options = []
    parts = options_str.split(' | ')

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


def extract_answer_key(correct_answer: str) -> Optional[str]:
    """Extract the answer key letter from correct answer."""
    if not correct_answer or not correct_answer.strip():
        return None

    answer = correct_answer.strip()

    # Handle "B or C" type answers - just take the first option
    if ' or ' in answer.lower():
        answer = answer.split(' or ')[0].strip()

    # Remove trailing period if present (e.g., "B.")
    if answer.endswith('.'):
        answer = answer[:-1]

    # Single letter
    if len(answer) == 1:
        return answer.lower()

    return None


def get_db_connection():
    """Get database connection from DATABASE_URL environment variable."""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("Error: DATABASE_URL environment variable is not set")
        sys.exit(1)

    try:
        conn = psycopg2.connect(database_url)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)


def import_questions(csv_path: str):
    """Import questions from source of truth CSV."""
    conn = get_db_connection()
    cur = conn.cursor()

    imported = 0
    skipped = 0

    # First, deactivate all existing anchor questions
    cur.execute("UPDATE items SET is_active = false WHERE is_anchor = true")
    print(f"Deactivated existing anchor questions")

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            section = row.get('section', '').strip()
            subsection = row.get('subsection', '').strip()
            question_id = row.get('question_id', '').strip()
            question_text = row.get('question_text', '').strip()
            tags = row.get('tags', '').strip()
            options_str = row.get('options', '').strip()
            correct_answer = row.get('correct_answer', '').strip()

            # Skip baseline covariates (B1-B12) - they're collected in onboarding
            if section == 'Baseline Covariates (Not Scored)':
                skipped += 1
                continue

            # Skip if no question text or question_id
            if not question_text or not question_id:
                continue

            # Skip baseline items (B prefix)
            if question_id.startswith('B'):
                skipped += 1
                continue

            # Parse external_item_id (numeric question ID: 1-40)
            try:
                external_item_id = str(int(question_id))
            except ValueError:
                print(f"Warning: Invalid question_id '{question_id}' - skipping")
                continue

            # Determine domain based on section
            if 'Borrowing' in section:
                domain = 'Borrowing, Interest Rates, and Financial Numeracy Knowledge'
            elif 'Behavioral' in section:
                domain = 'Behavioral and Risk Management Knowledge'
            elif 'Risk and Return' in section:
                domain = 'Risk and Return Knowledge'
            else:
                domain = section

            # Subdomain from tags
            subdomain = tags if tags else ''

            # Parse options
            options = parse_options(options_str)

            # Extract answer key
            key = extract_answer_key(correct_answer)

            # Determine is_scored based on question number
            # Q15-Q28 are "Financial Attitudes and Preferences" - NOT scored
            q_num = int(question_id)
            is_scored = not (15 <= q_num <= 28)

            # All anchor questions should be active and marked as anchor
            is_active = True
            is_anchor = True

            # Determine question type
            q_type = 'multiple_choice' if options else 'short_answer'

            # Check if question already exists
            cur.execute(
                "SELECT item_id FROM items WHERE external_item_id = %s AND is_anchor = true",
                (external_item_id,)
            )
            existing = cur.fetchone()

            options_json = json.dumps(options) if options else None

            if existing:
                # Update existing question
                cur.execute(
                    """UPDATE items
                       SET stem = %s, type = %s, domain = %s, subdomain = %s,
                           options = %s, key = %s, is_active = %s, is_scored = %s
                       WHERE item_id = %s""",
                    (question_text, q_type, domain, subdomain, options_json, key,
                     is_active, is_scored, existing[0])
                )
            else:
                # Insert new question
                cur.execute(
                    """INSERT INTO items (external_item_id, stem, type, domain, subdomain,
                                          difficulty, options, key, is_anchor, is_active, is_scored)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (external_item_id, question_text, q_type, domain, subdomain,
                     0.5, options_json, key, is_anchor, is_active, is_scored)
                )

            imported += 1
            scored_status = "SCORED" if is_scored else "NOT SCORED (preference)"
            print(f"Q{external_item_id}: {scored_status} - {domain[:30]}...")

    conn.commit()

    # Verify import
    cur.execute("SELECT COUNT(*) FROM items WHERE is_anchor = true AND is_active = true")
    active_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM items WHERE is_anchor = true AND is_active = true AND is_scored = false")
    unscored_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM items WHERE is_anchor = true AND is_active = true AND is_scored = true")
    scored_count = cur.fetchone()[0]

    print(f"\n=== Import Summary ===")
    print(f"Imported/Updated: {imported} questions")
    print(f"Skipped (baseline): {skipped}")
    print(f"Active anchor questions: {active_count}")
    print(f"  - Scored (knowledge items): {scored_count}")
    print(f"  - Unscored (preference items Q15-Q28): {unscored_count}")

    cur.close()
    conn.close()


def main():
    """Main function."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)

    # Path to source of truth
    source_of_truth_path = os.path.join(project_root, 'archive_source_of_truth', 'Questions.csv')

    if not os.path.exists(source_of_truth_path):
        print(f"Error: Source of truth not found at {source_of_truth_path}")
        print("Please ensure Archive.zip has been extracted to archive_source_of_truth/")
        sys.exit(1)

    print(f"Importing questions from: {source_of_truth_path}")
    import_questions(source_of_truth_path)
    print("\nDone!")


if __name__ == '__main__':
    main()
