#!/usr/bin/env python3

import argparse
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from typing import Any, Dict, List, Optional, Tuple

try:
    import psycopg2
    from psycopg2.extras import Json
except ImportError:
    print('Error: psycopg2 is required. Install with: pip install psycopg2-binary')
    sys.exit(1)

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'


def _normalize_text(s: str) -> str:
    return re.sub(r'\s+', ' ', (s or '').strip())


def _col_letters(col_idx: int) -> str:
    # 1-indexed: 1->A
    result = ''
    n = col_idx
    while n > 0:
        n, rem = divmod(n - 1, 26)
        result = chr(65 + rem) + result
    return result


def _parse_cell_value(c: ET.Element) -> str:
    t = c.attrib.get('t')
    if t == 'inlineStr':
        is_el = c.find(NS + 'is')
        if is_el is None:
            return ''
        ts = [(n.text or '') for n in is_el.iter(NS + 't')]
        return ''.join(ts)

    # Shared strings are not present in this workbook currently.
    v = c.find(NS + 'v')
    if v is None or v.text is None:
        return ''
    return v.text


def read_xlsx_sheet_rows(xlsx_path: str, sheet_index: int = 1) -> List[List[str]]:
    """Return a rectangular grid (list of rows, list of strings per col) for the given sheet."""
    with zipfile.ZipFile(xlsx_path) as z:
        sheet_path = f'xl/worksheets/sheet{sheet_index}.xml'
        if sheet_path not in z.namelist():
            raise RuntimeError(f'Missing {sheet_path} in workbook')

        sheet = ET.fromstring(z.read(sheet_path))

        # Determine max column we need by reading row 1 header up to last <c> ref.
        max_col = 0
        for row in sheet.iter(NS + 'row'):
            r = int(row.attrib.get('r', '0') or '0')
            if r != 1:
                continue
            for c in row.findall(NS + 'c'):
                ref = c.attrib.get('r', '')
                m = re.match(r'^([A-Z]+)(\d+)$', ref)
                if not m:
                    continue
                letters = m.group(1)
                col_num = 0
                for ch in letters:
                    col_num = col_num * 26 + (ord(ch) - 64)
                max_col = max(max_col, col_num)
            break

        if max_col == 0:
            max_col = 40

        rows_out: List[List[str]] = []
        for row in sheet.iter(NS + 'row'):
            r = int(row.attrib.get('r', '0') or '0')
            row_vals = [''] * max_col
            for c in row.findall(NS + 'c'):
                ref = c.attrib.get('r', '')
                m = re.match(r'^([A-Z]+)(\d+)$', ref)
                if not m:
                    continue
                letters = m.group(1)
                col_num = 0
                for ch in letters:
                    col_num = col_num * 26 + (ord(ch) - 64)
                if 1 <= col_num <= max_col:
                    row_vals[col_num - 1] = _parse_cell_value(c)
            # keep only non-empty rows
            if any(v.strip() for v in row_vals):
                rows_out.append(row_vals)

        return rows_out


def map_variant_type_to_item_type(variant_type: str) -> str:
    vt = (variant_type or '').lower()
    if 'open' in vt:
        return 'short_answer'
    return 'multiple_choice'


def build_options(row: Dict[str, str]) -> Optional[List[Dict[str, str]]]:
    opts: List[Tuple[str, str]] = []
    for idx, key in enumerate(['Option_A', 'Option_B', 'Option_C', 'Option_D']):
        txt = (row.get(key) or '').strip()
        if txt:
            opts.append((chr(97 + idx), txt))
    if not opts:
        return None
    return [{'id': oid, 'text': text} for oid, text in opts]


def extract_key(row: Dict[str, str], options: Optional[List[Dict[str, str]]]) -> Optional[str]:
    raw = (row.get('Correct_Answer') or '').strip()
    if not raw:
        return None

    # Letter A-D
    m = re.match(r'^([A-D])$', raw, re.IGNORECASE)
    if m:
        return m.group(1).lower()

    # True/False mapping
    if options:
        for opt in options:
            if opt['text'].strip().lower() == raw.strip().lower():
                return opt['id']

    return None


def build_rubric(row: Dict[str, str]) -> Optional[Dict[str, Any]]:
    accept = (row.get('Rubric_Accept') or '').strip()
    partial = (row.get('Rubric_Partial') or '').strip()
    reject = (row.get('Rubric_Reject') or '').strip()
    misc = (row.get('Misconception_Tags') or '').strip()

    if not (accept or partial or reject or misc):
        return None

    rubric: Dict[str, Any] = {}
    if accept:
        rubric['accept'] = accept
    if partial:
        rubric['partial'] = partial
    if reject:
        rubric['reject'] = reject
    if misc:
        rubric['misconception_tags'] = misc
    return rubric


def get_db_connection():
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print('Error: DATABASE_URL environment variable is not set')
        sys.exit(1)
    return psycopg2.connect(database_url)


def check_items_columns(cur) -> List[str]:
    cur.execute(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'items'
        """
    )
    return [r[0] for r in cur.fetchall()]


def main():
    parser = argparse.ArgumentParser(description='Import SDM variants from SDM10_Item_Bank.xlsx into items table')
    parser.add_argument('--xlsx', default='scripts/main_docs/SDM10_Item_Bank.xlsx', help='Path to SDM10_Item_Bank.xlsx')
    parser.add_argument('--dry-run', action='store_true', help='Parse and report counts, do not write to DB')
    parser.add_argument('--activate', action='store_true', help='Set imported SDM items is_active=true')
    args = parser.parse_args()

    xlsx_path = args.xlsx
    if not os.path.exists(xlsx_path):
        print(f'Error: file not found: {xlsx_path}')
        sys.exit(1)

    rows = read_xlsx_sheet_rows(xlsx_path, sheet_index=1)
    if not rows or len(rows) < 2:
        print('No data rows found')
        sys.exit(1)

    header = [h.strip() for h in rows[0]]
    header_map = {name: idx for idx, name in enumerate(header) if name}

    required = ['Variant_ID', 'Variant_Type', 'Trigger_Condition', 'Question_Text', 'Domain', 'Subcategory', 'Anchor_Text']
    missing = [k for k in required if k not in header_map]
    if missing:
        print('Error: missing required columns in sheet header:', ', '.join(missing))
        print('Found columns:', [h for h in header if h])
        sys.exit(1)

    parsed: List[Dict[str, str]] = []
    for raw in rows[1:]:
        row_dict: Dict[str, str] = {}
        for k, idx in header_map.items():
            if idx < len(raw):
                row_dict[k] = (raw[idx] or '').strip()
        if not row_dict.get('Variant_ID') or not row_dict.get('Question_Text'):
            continue
        parsed.append(row_dict)

    print(f'Parsed SDM rows: {len(parsed)}')

    if args.dry_run:
        kinds = {}
        for r in parsed:
            vt = r.get('Variant_Type', '')
            kinds[vt] = kinds.get(vt, 0) + 1
        print('Variant types:', kinds)
        return

    conn = get_db_connection()
    cur = conn.cursor()

    cols = check_items_columns(cur)
    required_db_cols = ['is_active', 'is_sdm', 'anchor_item_id', 'variant_type', 'trigger_condition', 'external_id']
    missing_db = [c for c in required_db_cols if c not in cols]
    if missing_db:
        print('Error: items table is missing required SDM columns:', ', '.join(missing_db))
        print('Apply migration infra/migration-add-sdm-variants.sql first.')
        sys.exit(1)

    # Build anchor stem -> item_id map for linking.
    cur.execute('SELECT item_id, stem FROM items WHERE COALESCE(is_anchor, false) = true')
    anchors = cur.fetchall()
    anchor_by_stem = {_normalize_text(stem): item_id for (item_id, stem) in anchors if stem}
    print(f'Loaded anchors: {len(anchor_by_stem)}')

    inserted = 0
    for r in parsed:
        stem = r.get('Question_Text', '').strip()
        domain = r.get('Domain', '').strip() or 'SDM'
        subdomain = r.get('Subcategory', '').strip() or ''

        external_id = r.get('Variant_ID', '').strip() or None
        variant_type = r.get('Variant_Type', '').strip() or None
        trigger = r.get('Trigger_Condition', '').strip() or None

        anchor_text = _normalize_text(r.get('Anchor_Text', ''))
        anchor_item_id = anchor_by_stem.get(anchor_text)

        item_type = map_variant_type_to_item_type(variant_type or '')
        options = build_options(r)
        key = extract_key(r, options)
        rubric = build_rubric(r)

        # basic difficulty: keep in-range; variants don't ship a numeric difficulty.
        difficulty = 0.5

        # is_active defaults to false unless --activate is passed
        is_active = True if args.activate else False

        cur.execute(
            """
            INSERT INTO items (
              domain, subdomain, difficulty, type, stem, options, key, rubric,
              is_anchor, is_active,
              is_sdm, anchor_item_id, variant_type, trigger_condition, external_id
            )
            VALUES (
              %s, %s, %s, %s, %s, %s::jsonb, %s, %s::jsonb,
              false, %s,
              true, %s, %s, %s, %s
            )
            """,
            [
                domain,
                subdomain,
                difficulty,
                item_type,
                stem,
                None if options is None else Json(options),
                key,
                None if rubric is None else Json(rubric),
                is_active,
                anchor_item_id,
                variant_type,
                trigger,
                external_id,
            ],
        )
        inserted += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f'Inserted SDM items: {inserted}')


if __name__ == '__main__':
    main()
