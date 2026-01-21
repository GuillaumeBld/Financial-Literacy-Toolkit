import csv
import json
import psycopg2
import os

# Database connection parameters
DB_HOST = "localhost"
DB_PORT = "5435"
DB_NAME = "financial_literacy"
DB_USER = "finlit_user"
DB_PASSWORD = "change_me_in_production"

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

def parse_options(option_str):
    """
    Parses options from a string like "A) Option 1 | B) Option 2" into a JSONB-ready list.
    """
    if not option_str:
        return []
    
    options = []
    # Split by pipe
    parts = option_str.split('|')
    for part in parts:
        part = part.strip()
        if not part:
            continue
            
        # Extract ID (e.g., "A") and text
        if ')' in part:
            opt_id, opt_text = part.split(')', 1)
            options.append({
                "id": opt_id.strip(),
                "text": opt_text.strip()
            })
        else:
            # Fallback if no "A)" format
            options.append({
                "id": str(len(options) + 1),
                "text": part
            })
    return options

def get_correct_key(correct_answer_str):
    """
    Extracts the key (e.g., "A") from "A" or "A) Option Text"
    """
    if not correct_answer_str:
        return None
    
    clean = correct_answer_str.strip()
    # If it starts with "A)", return "A"
    if ')' in clean:
        return clean.split(')', 1)[0].strip()
    
    # If it's just "A" or "True", return it
    return clean

def import_core_questions(cursor):
    print("Importing Core Questions...")
    
    # Map CSV headers to logic
    # Expected headers based on file reading:
    # section,subsection,range,question_id,question_text,tags,options,correct_answer
    
    with open('/root/Financial-Literacy-Toolkit/archive_extracted/Questions.csv', 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            # Skip if no question ID or text
            if not row.get('question_id'):
                continue
                
            item_id = row['question_id']
            
            # Determine type
            options_raw = row.get('options', '')
            if 'True' in options_raw and 'False' in options_raw:
                q_type = 'multiple_choice' # Treated as MC in schema usually, or boolean
            elif options_raw:
                q_type = 'multiple_choice'
            else:
                q_type = 'short_answer'
            
            options = parse_options(options_raw)
            correct_key = get_correct_key(row.get('correct_answer'))
            
            # Map domain/subdomain
            domain = row.get('section', 'General')
            subdomain = row.get('subsection', 'General')
            
            # Determine is_active (default True for core)
            is_active = True
            
            # Insert
            cursor.execute("""
                INSERT INTO items (
                    item_id, type, domain, subdomain, stem, options, key, is_active, is_anchor, difficulty
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) ON CONFLICT (item_id) DO UPDATE SET
                    type = EXCLUDED.type,
                    domain = EXCLUDED.domain,
                    subdomain = EXCLUDED.subdomain,
                    stem = EXCLUDED.stem,
                    options = EXCLUDED.options,
                    key = EXCLUDED.key,
                    is_active = EXCLUDED.is_active,
                    is_anchor = EXCLUDED.is_anchor;
            """, (
                item_id,
                q_type,
                domain,
                subdomain,
                row['question_text'],
                json.dumps(options),
                correct_key,
                is_active,
                True, # is_anchor
                0.5   # Default difficulty
            ))
            
    print("Core Questions Imported.")

def import_sdm_variants(cursor):
    print("Importing SDM Variants...")
    
    # Expected headers:
    # Anchor_ID,Domain,Subcategory,Anchor_Text,Anchor_Correct,Variant_ID,Variant_Type,Trigger_Condition,Question_Text,Option_A,Option_B,Option_C,Option_D,Correct_Answer,Rubric_Accept,Rubric_Partial,Rubric_Reject,Misconception_Tags

    with open('/root/Financial-Literacy-Toolkit/archive_extracted/SDM10_Item_Bank.csv', 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            if not row.get('Variant_ID'):
                continue
                
            item_id = row['Variant_ID']
            anchor_id = row.get('Anchor_ID')
            
            # Construct options list from A,B,C,D columns
            options = []
            if row.get('Option_A'): options.append({"id": "A", "text": row['Option_A']})
            if row.get('Option_B'): options.append({"id": "B", "text": row['Option_B']})
            if row.get('Option_C'): options.append({"id": "C", "text": row['Option_C']})
            if row.get('Option_D'): options.append({"id": "D", "text": row['Option_D']})
            
            # Determine type
            variant_type = row.get('Variant_Type', '').lower()
            if 'open' in variant_type:
                q_type = 'short_answer'
            else:
                q_type = 'multiple_choice'
                
            # Rubric construction for open-ended
            rubric = {}
            if q_type == 'short_answer':
                rubric = {
                    "accept": row.get('Rubric_Accept'),
                    "partial": row.get('Rubric_Partial'),
                    "reject": row.get('Rubric_Reject'),
                    "misconceptions": row.get('Misconception_Tags')
                }
            
            cursor.execute("""
                INSERT INTO items (
                    item_id, type, domain, subdomain, stem, options, key, 
                    is_active, is_anchor, anchor_item_id, variant_type, 
                    trigger_condition, rubric, difficulty
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, 
                    %s, %s, %s, %s, 
                    %s, %s, %s
                ) ON CONFLICT (item_id) DO UPDATE SET
                    type = EXCLUDED.type,
                    domain = EXCLUDED.domain,
                    subdomain = EXCLUDED.subdomain,
                    stem = EXCLUDED.stem,
                    options = EXCLUDED.options,
                    key = EXCLUDED.key,
                    is_active = EXCLUDED.is_active,
                    anchor_item_id = EXCLUDED.anchor_item_id,
                    variant_type = EXCLUDED.variant_type,
                    trigger_condition = EXCLUDED.trigger_condition,
                    rubric = EXCLUDED.rubric;
            """, (
                item_id,
                q_type,
                row.get('Domain', 'General'),
                row.get('Subcategory', 'General'),
                row.get('Question_Text'),
                json.dumps(options),
                row.get('Correct_Answer'),
                True, # is_active
                False, # is_anchor (these are variants)
                anchor_id,
                row.get('Variant_Type'),
                row.get('Trigger_Condition'),
                json.dumps(rubric),
                0.5
            ))

    print("SDM Variants Imported.")

def main():
    try:
        conn = get_db_connection()
        conn.autocommit = True
        cur = conn.cursor()
        
        import_core_questions(cur)
        import_sdm_variants(cur)
        
        cur.close()
        conn.close()
        print("Import completed successfully.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
