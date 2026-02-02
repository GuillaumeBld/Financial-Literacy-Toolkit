/**
 * Google Forms Plan B — Generator Script
 *
 * Reads the 40 anchor items from the CSV source of truth and outputs a
 * structured document for copy-paste into Google Forms.
 *
 * Each question becomes a section with:
 *   - The MCQ question + options
 *   - A confidence rating (1-Low, 2-Medium, 3-High)
 *
 * Run: npx tsx scripts/generate-google-form.ts
 * Output: stdout (pipe to file if needed: npx tsx scripts/generate-google-form.ts > google-form-questions.txt)
 *
 * Limitations (Plan B):
 *   - No SDM adaptive questions (10 follow-ups lost)
 *   - No auto-save, no resume
 *   - No anti-cheating metadata
 *   - FERPA risk: raw student IDs in Google Sheets (must delete after import within 24h)
 *   - No duplicate prevention beyond Google Forms "limit to 1 response"
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface CsvQuestion {
  questionId: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  section: string;
}

function parseCsv(csvContent: string): CsvQuestion[] {
  const lines = csvContent.split('\n').filter(l => l.trim());
  // Skip header
  const questions: CsvQuestion[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Parse CSV with quoted fields
    const fields = parseCsvLine(line);
    if (fields.length < 8) continue;

    const [section, , , questionId, questionText, , optionsStr, correctAnswer] = fields;

    // Only include assessment items (numeric question IDs 1-40), skip baseline covariates (B1-B13)
    if (!questionId || questionId.startsWith('B')) continue;
    const qNum = parseInt(questionId);
    if (isNaN(qNum) || qNum < 1 || qNum > 40) continue;

    const options = optionsStr
      .split('|')
      .map(o => o.trim())
      .filter(o => o.length > 0);

    questions.push({
      questionId,
      questionText: questionText.trim(),
      options,
      correctAnswer: correctAnswer.trim(),
      section: section.trim(),
    });
  }

  return questions.sort((a, b) => parseInt(a.questionId) - parseInt(b.questionId));
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function main() {
  const csvPath = join(__dirname, '..', '_project', 'source_of_truth', 'baseline+40_Questions.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');
  const questions = parseCsv(csvContent);

  if (questions.length !== 40) {
    console.error(`WARNING: Expected 40 questions, found ${questions.length}`);
  }

  console.log('='.repeat(72));
  console.log('FINANCIAL LITERACY ASSESSMENT — GOOGLE FORMS PLAN B');
  console.log('='.repeat(72));
  console.log();
  console.log('INSTRUCTIONS FOR FORM CREATOR:');
  console.log('1. Create a new Google Form');
  console.log('2. Title: "Financial Literacy Pre-Course Assessment"');
  console.log('3. First field: "Student ID" (Short answer, Required)');
  console.log('4. Settings > Responses > "Limit to 1 response" = ON');
  console.log('5. Settings > Responses > "Collect email addresses" = OFF');
  console.log('6. For each question below, create a new Section with:');
  console.log('   a) A Multiple Choice question (Required)');
  console.log('   b) A Multiple Choice confidence question (Required)');
  console.log('7. Total: 40 questions + 40 confidence ratings = 80 form fields');
  console.log();
  console.log('FERPA WARNING:');
  console.log('Raw student IDs will be in Google Sheets. Must delete within');
  console.log('24 hours of running the import script.');
  console.log();
  console.log('-'.repeat(72));

  let currentSection = '';

  for (const q of questions) {
    if (q.section !== currentSection) {
      currentSection = q.section;
      console.log();
      console.log('='.repeat(72));
      console.log(`SECTION: ${currentSection}`);
      console.log('='.repeat(72));
    }

    const qNum = parseInt(q.questionId);
    const isPreference = qNum >= 15 && qNum <= 28;

    console.log();
    console.log(`--- Q${q.questionId} ${isPreference ? '[PREFERENCE - Not Scored]' : '[KNOWLEDGE - Scored]'} ---`);
    console.log();
    console.log(`Question: ${q.questionText}`);
    console.log(`Type: Multiple Choice (Required)`);
    console.log();
    console.log('Options:');
    for (const opt of q.options) {
      console.log(`  ${opt}`);
    }
    if (!isPreference && q.correctAnswer) {
      console.log(`\n  [Answer Key: ${q.correctAnswer}]`);
    }
    console.log();
    console.log(`Confidence for Q${q.questionId}:`);
    console.log(`  "How confident are you in your answer to Q${q.questionId}?"`);
    console.log('  Type: Multiple Choice (Required)');
    console.log('  Options:');
    console.log('    1 - Low');
    console.log('    2 - Medium');
    console.log('    3 - High');
  }

  console.log();
  console.log('='.repeat(72));
  console.log(`Total: ${questions.length} questions generated`);
  console.log(`Knowledge items (scored): ${questions.filter(q => { const n = parseInt(q.questionId); return n <= 14 || n >= 29; }).length}`);
  console.log(`Preference items (not scored): ${questions.filter(q => { const n = parseInt(q.questionId); return n >= 15 && n <= 28; }).length}`);
  console.log('='.repeat(72));
}

main();
