#!/usr/bin/env python3
"""
Import all questions from All_Questions.csv and activate only shortlisted questions.

This script:
1. Reads all questions from All_Questions.csv
2. Reads shortlisted questions from Final_Shortlist_30+8.csv
3. Imports all questions to the database
4. Sets is_active=true for shortlisted questions only
5. Sets is_active=false for all other questions
"""

import csv
import os
import sys
import json
import re
from typing import Dict, List, Set, Tuple, Optional

try:
    import psycopg2
    from psycopg2.extras import execute_values
    from psycopg2 import sql
except ImportError:
    print("Error: psycopg2 is required. Install with: pip install psycopg2-binary")
    sys.exit(1)

def parse_answer_options(options_str: str) -> List[Dict[str, str]]:
    """Parse answer options from CSV format to JSON format."""
    if not options_str or not options_str.strip():
        return None
    
    options = []
    lines = options_str.strip().split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Match pattern like "A) Option text" or "A) Option text, additional text"
        match = re.match(r'^([A-Z])\)\s*(.+)$', line)
        if match:
            option_id = match.group(1).lower()
            option_text = match.group(2).strip()
            options.append({"id": option_id, "text": option_text})
        else:
            # If no match, try to extract first letter and rest as text
            if len(line) > 2 and line[1] == ')':
                option_id = line[0].lower()
                option_text = line[2:].strip()
                options.append({"id": option_id, "text": option_text})
    
    return options if options else None

def extract_correct_answer_key(correct_answer: str) -> Optional[str]:
    """Extract the answer key (e.g., 'a', 'b', 'c') from correct answer text."""
    if not correct_answer or not correct_answer.strip():
        return None
    
    # Match patterns like "A) More than $102" or "A)" or just "a"
    match = re.match(r'^([A-Z])\)', correct_answer.strip(), re.IGNORECASE)
    if match:
        return match.group(1).lower()
    
    # Try to match just a single letter
    if len(correct_answer.strip()) == 1:
        return correct_answer.strip().lower()
    
    # Try to extract from patterns like "$200" or other specific answers
    # For now, return None if we can't extract a simple key
    return None

def map_classification_to_domain_subdomain(classification: str) -> Tuple[str, str]:
    """Map classification to domain and subdomain."""
    if not classification:
        return "General", ""
    
    # Common mappings
    mappings = {
        "Compound Interest": ("Borrowing, Interest Rates, and Financial Numeracy Knowledge", "Compound Interest"),
        "Inflation": ("Borrowing, Interest Rates, and Financial Numeracy Knowledge", "Inflation"),
        "Risk Diversification": ("Behavioral and Risk Management Knowledge", "Risk Diversification"),
        "Investing": ("Risk and Return Knowledge", "Investing/Risk-Return"),
        "Borrowing/Mortgages": ("Borrowing, Interest Rates, and Financial Numeracy Knowledge", "Borrowing/Mortgages"),
        "Borrowing/Interest": ("Borrowing, Interest Rates, and Financial Numeracy Knowledge", "Borrowing/Interest"),
        "Borrowing": ("Borrowing, Interest Rates, and Financial Numeracy Knowledge", "Borrowing"),
        "Borrowing/Credit": ("Borrowing, Interest Rates, and Financial Numeracy Knowledge", "Borrowing/Credit"),
        "Saving": ("Borrowing, Interest Rates, and Financial Numeracy Knowledge", "Saving"),
        "Saving/Budgeting": ("Borrowing, Interest Rates, and Financial Numeracy Knowledge", "Saving/Budgeting"),
        "Earning": ("Borrowing, Interest Rates, and Financial Numeracy Knowledge", "Earning"),
        "Numeracy": ("Borrowing, Interest Rates, and Financial Numeracy Knowledge", "Numeracy"),
        "Insurance": ("Behavioral and Risk Management Knowledge", "Insurance"),
        "Retirement/Annuities": ("Behavioral and Risk Management Knowledge", "Retirement/Annuities"),
        "Retirement/Social Security": ("Behavioral and Risk Management Knowledge", "Retirement/Social Security"),
        "Retirement/Medicare": ("Behavioral and Risk Management Knowledge", "Retirement/Medicare"),
        "Behavioral Financial Literacy": ("Behavioral and Risk Management Knowledge", "Behavioral Financial Literacy"),
        "Crisis/Systemic Risk": ("Risk and Return Knowledge", "Crisis/Systemic Risk"),
        "Statistical Numeracy - Conditional Probability": ("Risk and Return Knowledge", "Conditional Probability"),
        "Statistical Numeracy - Probability": ("Risk and Return Knowledge", "Statistical Numeracy"),
        "Statistical Numeracy - Weighted Probability": ("Risk and Return Knowledge", "Statistical Numeracy"),
        "Statistical Numeracy - Bayes' Theorem": ("Risk and Return Knowledge", "Base Rate/Bayes"),
        "Basic Probability - Chance": ("Risk and Return Knowledge", "Basic Probability"),
        "Basic Probability - Percentage to Frequency": ("Risk and Return Knowledge", "Basic Probability"),
        "Basic Probability - Frequency to Percentage": ("Risk and Return Knowledge", "Basic Probability"),
        "Risk Comparison - Magnitude": ("Risk and Return Knowledge", "Risk Comparison"),
        "Risk Comparison - Percentages": ("Risk and Return Knowledge", "Risk Comparison"),
        "Risk Calculation - Percentage Application": ("Risk and Return Knowledge", "Risk Calculation"),
        "Risk Calculation - Scaling": ("Risk and Return Knowledge", "Risk Calculation"),
        "Risk Conversion - Frequency to Percentage": ("Risk and Return Knowledge", "Risk Conversion"),
        "Expected Value - Financial Risk Assessment": ("Risk and Return Knowledge", "Expected Value"),
        "Expected Value - Lottery vs. Certain Outcome": ("Risk and Return Knowledge", "Expected Value"),
        "Expected Value - Investment Comparison": ("Risk and Return Knowledge", "Expected Value"),
        "Probability Comparison - Multiple Formats": ("Risk and Return Knowledge", "Probability Comparison"),
        "Probability - Independence": ("Risk and Return Knowledge", "Probability"),
        "Investment Risk - Risk-Return Tradeoff": ("Risk and Return Knowledge", "Investing/Risk-Return"),
        "Investment Risk - Diversification": ("Risk and Return Knowledge", "Investing/Risk-Return"),
        "Investment Risk - Diversification Effect": ("Risk and Return Knowledge", "Investing/Risk-Return"),
        "Investment Risk - Risk-Return Relationship": ("Risk and Return Knowledge", "Investing/Risk-Return"),
        "Investment Risk - Interest Rate Risk": ("Risk and Return Knowledge", "Investing/Risk-Return"),
        "Investment Risk - Inflation Risk": ("Risk and Return Knowledge", "Investing/Risk-Return"),
        "Investment Risk - Risk Types": ("Risk and Return Knowledge", "Investing/Risk-Return"),
        "Investment Risk - Asset Class Risk": ("Risk and Return Knowledge", "Investing/Risk-Return"),
        "Risk Management - Diversification Principle": ("Behavioral and Risk Management Knowledge", "Risk Management"),
        "Risk Management - Insurance": ("Behavioral and Risk Management Knowledge", "Insurance"),
        "Risk Management - Health Insurance": ("Behavioral and Risk Management Knowledge", "Insurance"),
        "Longevity Risk - Retirement Planning": ("Risk and Return Knowledge", "Longevity Risk"),
    }
    
    return mappings.get(classification, ("General", classification))

def read_all_questions(csv_path: str) -> List[Dict]:
    """Read all questions from All_Questions.csv."""
    questions = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            global_id = row.get('Global ID', '').strip()
            bank = row.get('Bank', '').strip()
            bank_num = row.get('#', '').strip()
            original_question = row.get('Original Question', '').strip()
            simplified_question = row.get('Simplified Question', '').strip()
            answer_options = row.get('Answer Options', '').strip()
            correct_answer = row.get('Correct Answer', '').strip()
            classification = row.get('Classification', '').strip()
            why_matters = row.get('Why This Matters (Plain Language)', '').strip()
            source = row.get('Source', '').strip()
            
            # Use simplified question if available, otherwise original
            question_text = simplified_question if simplified_question else original_question
            
            # Allow questions even if global_id is empty (some rows might not have it)
            if not question_text:
                continue
            
            # Parse options
            options = parse_answer_options(answer_options)
            
            # Extract correct answer key
            key = extract_correct_answer_key(correct_answer)
            
            # Map classification to domain/subdomain
            domain, subdomain = map_classification_to_domain_subdomain(classification)
            
            # Create rubric with explanation
            rubric = None
            if why_matters:
                rubric = {"explanation": why_matters}
            
            questions.append({
                'global_id': global_id,
                'bank': bank,
                'bank_num': bank_num,
                'question_text': question_text,
                'original_question': original_question,
                'options': options,
                'key': key,
                'domain': domain,
                'subdomain': subdomain,
                'classification': classification,
                'rubric': rubric,
                'source': source
            })
    
    return questions

def read_shortlist(csv_path: str) -> Tuple[Set[Tuple[str, str]], Dict[Tuple[str, str], Dict[str, str]]]:
    """Read shortlisted questions and return:
    - Set of (Bank, Bank Q#) tuples for shortlisted questions
    - Dict mapping (Bank, Bank Q#) to category/subcategory info
    """
    shortlisted = set()
    shortlist_info = {}
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            bank = row.get('Bank', '').strip()
            bank_q = row.get('Bank Q#', '').strip()
            
            # Skip baseline questions (not scored)
            section = row.get('Section', '').strip()
            if section == 'Baseline (Not Scored)':
                continue
            
            if bank and bank_q:
                key = (bank, bank_q)
                shortlisted.add(key)
                # Store category and subcategory for better mapping
                shortlist_info[key] = {
                    'category': row.get('Category', '').strip(),
                    'subcategory': row.get('Subcategory', '').strip()
                }
    
    return shortlisted, shortlist_info

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

def import_questions(questions: List[Dict], shortlisted: Set[Tuple[str, str]], shortlist_info: Dict[Tuple[str, str], Dict[str, str]]):
    """Import all questions to database and set is_active based on shortlist."""
    
    def is_shortlisted(question: Dict) -> bool:
        """Check if question is in shortlist."""
        bank = question['bank']
        bank_num = question['bank_num']
        return (bank, bank_num) in shortlisted
    
    def get_shortlist_domain_subdomain(question: Dict) -> Tuple[str, str]:
        """Get domain and subdomain from shortlist if available, otherwise use question's existing domain/subdomain."""
        bank = question['bank']
        bank_num = question['bank_num']
        key = (bank, bank_num)
        
        if key in shortlist_info:
            info = shortlist_info[key]
            category = info.get('category', '').strip()
            subcategory = info.get('subcategory', '').strip()
            if category:
                return category, subcategory
        
        # Fallback to question's existing domain/subdomain (from classification mapping)
        return question['domain'], question['subdomain']
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    inserted_count = 0
    updated_count = 0
    activated_count = 0
    deactivated_count = 0
    
    try:
        for question in questions:
            should_be_active = is_shortlisted(question)
            
            # Use shortlist domain/subdomain if available, otherwise use classification mapping
            domain, subdomain = get_shortlist_domain_subdomain(question)
            
            options_json = json.dumps(question['options']) if question['options'] else None
            rubric_json = json.dumps(question['rubric']) if question['rubric'] else None
            
            # Check if question already exists (by matching question text and domain)
            cur.execute(
                "SELECT item_id, is_active FROM items WHERE stem = %s AND domain = %s LIMIT 1",
                (question['question_text'], domain)
            )
            existing = cur.fetchone()
            
            if existing:
                # Update existing question
                item_id, current_active = existing
                
                cur.execute(
                    """UPDATE items 
                       SET type = %s, subdomain = %s, difficulty = %s, options = %s, key = %s, rubric = %s, is_active = %s
                       WHERE item_id = %s
                       RETURNING item_id""",
                    (
                        'multiple_choice',  # Default type
                        subdomain,
                        0.5,  # Default difficulty
                        options_json,
                        question['key'],
                        rubric_json,
                        should_be_active,
                        item_id
                    )
                )
                updated_count += 1
                
                if should_be_active and not current_active:
                    activated_count += 1
                elif not should_be_active and current_active:
                    deactivated_count += 1
            else:
                # Insert new question
                cur.execute(
                    """INSERT INTO items (type, domain, subdomain, difficulty, stem, options, key, rubric, is_active)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                       RETURNING item_id""",
                    (
                        'multiple_choice',  # Default type
                        domain,
                        subdomain,
                        0.5,  # Default difficulty
                        question['question_text'],
                        options_json,
                        question['key'],
                        rubric_json,
                        should_be_active
                    )
                )
                inserted_count += 1
                
                if should_be_active:
                    activated_count += 1
                else:
                    deactivated_count += 1
        
        conn.commit()
        
        print(f"Import complete:")
        print(f"  - Inserted: {inserted_count} questions")
        print(f"  - Updated: {updated_count} questions")
        print(f"  - Activated: {activated_count} questions")
        print(f"  - Deactivated: {deactivated_count} questions")
        
    except Exception as e:
        conn.rollback()
        print(f"Error importing questions: {e}")
        raise
    finally:
        cur.close()
        conn.close()

def main():
    """Main function."""
    # Get paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    all_questions_path = os.path.join(project_root, 'questions', 'All_Questions.csv')
    shortlist_path = os.path.join(project_root, 'questions', 'Final_Shortlist_30+8.csv')
    
    if not os.path.exists(all_questions_path):
        print(f"Error: {all_questions_path} not found")
        sys.exit(1)
    
    if not os.path.exists(shortlist_path):
        print(f"Error: {shortlist_path} not found")
        sys.exit(1)
    
    print("Reading all questions...")
    questions = read_all_questions(all_questions_path)
    print(f"Found {len(questions)} questions")
    
    print("Reading shortlist...")
    shortlisted, shortlist_info = read_shortlist(shortlist_path)
    print(f"Found {len(shortlisted)} shortlisted questions")
    
    print("Importing questions to database...")
    import_questions(questions, shortlisted, shortlist_info)
    
    print("Done!")

if __name__ == '__main__':
    main()

