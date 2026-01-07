'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  ArrowLeft,
  LogOut,
  RefreshCw,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

type Question = {
  item_id: string;
  type: 'multiple-choice' | 'short-answer';
  domain: string;
  subdomain: string;
  difficulty: number;
  question_text: string;
  options?: string[];
  key?: string;
  explanation?: string;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
};

type FilterOptions = {
  domain: string;
  type: string;
  difficulty: string;
  searchTerm: string;
};

type EditQuestionModalProps = {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  domains: string[];
  subdomains: string[];
};

function EditQuestionModal({
  question,
  isOpen,
  onClose,
  onSave,
  domains,
  subdomains
}: EditQuestionModalProps) {
  const [formData, setFormData] = useState({
    question_text: question?.question_text || '',
    type: (question?.type || 'multiple-choice') as 'multiple-choice' | 'short-answer',
    domain: question?.domain || '',
    subdomain: question?.subdomain || '',
    difficulty: question?.difficulty || 1,
    options: question?.options || ['', '', '', ''],
    key: question?.key || '',
    explanation: typeof question?.explanation === 'string' 
      ? question.explanation 
      : (question?.explanation as any)?.explanation || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (question) {
      setFormData({
        question_text: question.question_text || '',
        type: question.type || 'multiple-choice',
        domain: question.domain || '',
        subdomain: question.subdomain || '',
        difficulty: question.difficulty || 1,
        options: question.options || ['', '', '', ''],
        key: question.key || '',
        explanation: typeof question.explanation === 'string' 
          ? question.explanation 
          : (question.explanation as any)?.explanation || ''
      });
    } else {
      setFormData({
        question_text: '',
        type: 'multiple-choice',
        domain: '',
        subdomain: '',
        difficulty: 1,
        options: ['', '', '', ''],
        key: '',
        explanation: ''
      });
    }
    setError('');
  }, [question]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, '']
    });
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({ ...formData, options: newOptions });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('instructor-token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Validate required fields
      if (!formData.question_text.trim()) {
        throw new Error('Question text is required');
      }
      if (!formData.domain) {
        throw new Error('Domain is required');
      }
      if (formData.type === 'multiple-choice') {
        const validOptions = formData.options.filter(opt => opt.trim());
        if (validOptions.length < 2) {
          throw new Error('Multiple choice questions require at least 2 options');
        }
        if (!formData.key.trim()) {
          throw new Error('Correct answer key is required for multiple choice questions');
        }
        // Validate that the key corresponds to a valid option
        const keyIndex = formData.key.toUpperCase().charCodeAt(0) - 65; // A=0, B=1, etc.
        if (keyIndex < 0 || keyIndex >= validOptions.length) {
          throw new Error(`Answer key must be a letter between A and ${String.fromCharCode(65 + validOptions.length - 1)}`);
        }
      }

      const payload = {
        type: formData.type,
        domain: formData.domain,
        subdomain: formData.subdomain || '',
        difficulty: formData.difficulty,
        question_text: formData.question_text.trim(),
        options: formData.type === 'multiple-choice' 
          ? formData.options.filter(opt => opt.trim())
          : null,
        key: formData.type === 'multiple-choice' ? formData.key.trim() : null,
        explanation: formData.explanation.trim() || null
      };

      const url = question 
        ? `/api/instructor/questions/${question.item_id}`
        : '/api/instructor/questions';
      
      const method = question ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save question');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-loyola-gray-200 sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-loyola-gray-800">
              {question ? 'Edit Question' : 'Add New Question'}
            </h2>
            <button
              onClick={onClose}
              className="text-loyola-gray-400 hover:text-loyola-gray-600 text-2xl leading-none"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Question Text */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-loyola-gray-700 mb-2">
              Question Text <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              className="w-full px-3 py-2 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon"
              rows={4}
              required
              disabled={isSubmitting}
              placeholder="Enter the question text..."
            />
          </div>

          {/* Question Type */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-loyola-gray-700 mb-2">
              Question Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value as 'multiple-choice' | 'short-answer';
                setFormData({ 
                  ...formData, 
                  type: newType,
                  // Reset options and key when switching to short-answer
                  // Preserve options when switching to multiple-choice if they exist
                  options: newType === 'multiple-choice' 
                    ? (formData.options.length > 0 ? formData.options : ['', '', '', ''])
                    : [],
                  key: newType === 'short-answer' ? '' : formData.key
                });
              }}
              className="w-full px-3 py-2 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon"
              required
              disabled={isSubmitting}
            >
              <option value="multiple-choice">Multiple Choice</option>
              <option value="short-answer">Short Answer</option>
            </select>
          </div>

          {/* Domain and Subdomain */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-loyola-gray-700 mb-2">
                Domain <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="domains-list"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="w-full px-3 py-2 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon"
                placeholder="Enter domain (e.g., Numeracy, Borrowing)"
                required
                disabled={isSubmitting}
              />
              <datalist id="domains-list">
                {domains.map((domain) => (
                  <option key={domain} value={domain} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-semibold text-loyola-gray-700 mb-2">
                Subdomain
              </label>
              <input
                type="text"
                list="subdomains-list"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                className="w-full px-3 py-2 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon"
                placeholder="Enter subdomain (optional)"
                disabled={isSubmitting}
              />
              <datalist id="subdomains-list">
                {subdomains.filter(sub => sub).map((subdomain) => (
                  <option key={subdomain} value={subdomain} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Difficulty */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-loyola-gray-700 mb-2">
              Difficulty Level <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon"
              required
              disabled={isSubmitting}
            >
              <option value={1}>Easy (1)</option>
              <option value={2}>Medium (2)</option>
              <option value={3}>Hard (3)</option>
            </select>
          </div>

          {/* Answer Options (for multiple choice) */}
          {formData.type === 'multiple-choice' && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-loyola-gray-700">
                  Answer Options <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addOption}
                  className="text-sm text-loyola-maroon hover:text-loyola-maroon-dark font-medium"
                  disabled={isSubmitting}
                >
                  + Add Option
                </button>
              </div>
              <div className="space-y-2">
                {formData.options.map((option, index) => {
                  const optionLetter = String.fromCharCode(65 + index);
                  const isCorrectAnswer = formData.key.toUpperCase() === optionLetter;
                  return (
                    <div 
                      key={index} 
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        isCorrectAnswer ? 'bg-green-50 border-2 border-green-300' : 'bg-loyola-gray-50'
                      }`}
                    >
                      <span className={`text-sm font-medium w-6 ${
                        isCorrectAnswer ? 'text-green-700 font-bold' : 'text-loyola-gray-600'
                      }`}>
                        {optionLetter}.
                      </span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className={`flex-1 px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon ${
                          isCorrectAnswer 
                            ? 'border-green-300 bg-white' 
                            : 'border-loyola-gray-300'
                        }`}
                        placeholder={`Option ${optionLetter}`}
                        disabled={isSubmitting}
                      />
                      {isCorrectAnswer && (
                        <span className="text-xs text-green-600 font-medium px-2">
                          ✓ Correct
                        </span>
                      )}
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            // If removing the correct answer, clear the key
                            if (isCorrectAnswer) {
                              setFormData({ ...formData, key: '' });
                            }
                            removeOption(index);
                          }}
                          className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                          disabled={isSubmitting}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Correct Answer Key (for multiple choice) */}
          {formData.type === 'multiple-choice' && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-loyola-gray-700 mb-2">
                Correct Answer Key <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-loyola-gray-500 ml-2">
                  Select the letter of the correct answer
                </span>
              </label>
              <select
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                className="w-full px-3 py-2 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon"
                required
                disabled={isSubmitting}
              >
                <option value="">Select correct answer...</option>
                {formData.options
                  .map((opt, index) => ({ letter: String.fromCharCode(65 + index), text: opt.trim(), index }))
                  .filter(({ text }) => text)
                  .map(({ letter, text }) => (
                    <option key={letter} value={letter}>
                      {letter} - {text.substring(0, 50)}{text.length > 50 ? '...' : ''}
                    </option>
                  ))}
              </select>
              {formData.key && (() => {
                const keyIndex = formData.key.charCodeAt(0) - 65;
                const optionText = formData.options[keyIndex]?.trim() || 'No option text';
                return (
                  <p className="mt-2 text-sm text-loyola-gray-600">
                    Selected: <span className="font-medium text-green-600">{formData.key}</span> - {optionText}
                  </p>
                );
              })()}
            </div>
          )}

          {/* Explanation */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-loyola-gray-700 mb-2">
              Explanation
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              className="w-full px-3 py-2 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon"
              rows={3}
              disabled={isSubmitting}
              placeholder="Enter explanation or feedback for this question..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-loyola-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-loyola-gray-700 hover:text-loyola-gray-900 border border-loyola-gray-300 rounded-lg hover:bg-loyola-gray-50 transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-loyola-maroon text-white rounded-lg hover:bg-loyola-maroon-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : question ? 'Update Question' : 'Create Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InstructorQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [instructorName, setInstructorName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    domain: '',
    type: '',
    difficulty: '',
    searchTerm: ''
  });
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('instructor-token');
    const name = localStorage.getItem('instructor-name');

    if (!token) {
      router.push('/instructor');
      return;
    }

    setInstructorName(name || 'Instructor');
    loadQuestions(token);
  }, [router]);

  const loadQuestions = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/instructor/questions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('instructor-token');
          router.push('/instructor');
          return;
        }
        throw new Error('Failed to load questions');
      }

      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Failed to load questions data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Parse CSV line handling quoted fields properly
   * Handles commas and quotes within field values
   */
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote (double quote)
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator (only when not in quotes)
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add last field
    result.push(current.trim());
    return result;
  };

  type CsvQuestion = {
    question_text: string;
    type: 'multiple-choice' | 'short-answer';
    domain: string;
    subdomain: string;
    difficulty: number;
    options?: string[];
    key?: string;
    explanation: string;
  };

  const parseCsvQuestions = (fileText: string): CsvQuestion[] => {
    const lines = fileText.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];

    // Parse header line
    const headers = parseCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase());

    const parsed: (CsvQuestion | null)[] = lines.slice(1).map((line, lineIndex) => {
      try {
        const values = parseCsvLine(line).map((value) => {
          // Remove surrounding quotes if present
          return value.replace(/^"|"$/g, '').trim();
        });
        
        const row: Record<string, string> = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        const optionsField = row.options || row.choices || '';
        const options = optionsField
          ? optionsField
              .split('|')
              .map((option) => option.trim())
              .filter(Boolean)
          : undefined;

        // Normalize type: convert multiple_choice to multiple-choice
        const rawType = (row.type || '').toLowerCase().trim();
        const normalizedType = rawType === 'multiple_choice' || rawType === 'multiple-choice' 
          ? 'multiple-choice' 
          : (rawType === 'short_answer' || rawType === 'short-answer' 
            ? 'short-answer' 
            : 'multiple-choice');

        const question: CsvQuestion = {
          question_text: row.question_text || row.question || '',
          type: normalizedType,
          domain: row.domain || 'General',
          subdomain: row.subdomain || '',
          difficulty: Number(row.difficulty || 1),
          options,
          key: row.key || row.answer || undefined,
          explanation: row.explanation || '',
        };

        return question;
      } catch (error) {
        console.error(`Error parsing CSV line ${lineIndex + 2}:`, error);
        return null;
      }
    });

    // Filter out null values and invalid questions, with proper type narrowing
    return parsed.filter((q): q is CsvQuestion => {
      return q !== null && q.question_text !== '' && q.domain !== '';
    });
  };

  const handleFileUpload = async (file: File) => {
    const token = localStorage.getItem('instructor-token');
    if (!token) {
      router.push('/instructor');
      return;
    }

    setIsUploading(true);
    setUploadMessage('');

    try {
      const fileText = await file.text();
      const parsedQuestions = parseCsvQuestions(fileText).filter(
        (question) => question.question_text && question.domain
      );

      if (parsedQuestions.length === 0) {
        setUploadMessage('No valid rows found in the upload.');
        return;
      }

      const response = await fetch('/api/instructor/questions/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions: parsedQuestions,
          source: file.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload questionnaire');
      }

      setUploadMessage(`Uploaded ${data.insertedCount || parsedQuestions.length} questions.`);
      loadQuestions(token);
    } catch (error) {
      console.error('Error uploading questionnaire:', error);
      setUploadMessage('Upload failed. Please verify the file format and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('instructor-token');
    localStorage.removeItem('instructor-name');
    router.push('/instructor');
  };

  const handleRefresh = () => {
    const token = localStorage.getItem('instructor-token');
    if (token) {
      loadQuestions(token);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('instructor-token');
      const response = await fetch(`/api/instructor/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete question');
      }

      // Reload questions
      if (token) {
        loadQuestions(token);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  };

  const filteredQuestions = questions.filter(question => {
    if (filters.domain && question.domain !== filters.domain) return false;
    if (filters.type && question.type !== filters.type) return false;
    if (filters.difficulty && question.difficulty.toString() !== filters.difficulty) return false;
    if (filters.searchTerm && !question.question_text.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;
    return true;
  });

  const domains = [...new Set(questions.map(q => q.domain))];
  const subdomains = [...new Set(questions.map(q => q.subdomain))];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-loyola-maroon animate-spin mx-auto mb-4" />
          <p className="text-loyola-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-loyola-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/instructor/dashboard')}
                className="flex items-center gap-2 text-loyola-gray-600 hover:text-loyola-maroon transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-loyola-maroon">
                  Question Bank Management
                </h1>
                <p className="text-sm text-loyola-gray-600">
                  Manage assessment questions and items
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-loyola-maroon text-white rounded-lg hover:bg-loyola-maroon-dark transition"
              >
                <Plus className="w-5 h-5" />
                <span>Add Question</span>
              </button>
              <button
                onClick={handleRefresh}
                className="p-2 text-loyola-gray-600 hover:text-loyola-maroon transition"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-loyola-gray-700 hover:text-loyola-maroon transition"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Upload */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-loyola-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-semibold text-loyola-maroon uppercase tracking-wide">Questionnaire upload</p>
              <h2 className="text-xl font-bold text-loyola-gray-900">Import multiple choice and short answer sets</h2>
              <p className="text-loyola-gray-700 mt-1">
                Upload a CSV with columns for question_text, type, domain, subdomain, difficulty, options (pipe-separated), key, and explanation.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-loyola-maroon text-white rounded-lg cursor-pointer hover:bg-loyola-maroon-dark transition">
                <FileText className="w-5 h-5" />
                <span>{isUploading ? 'Uploading...' : 'Upload CSV'}</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                      event.target.value = '';
                    }
                  }}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm text-loyola-gray-700">
            <div className="bg-loyola-gold/10 border border-loyola-gold/50 rounded-lg p-3">
              <p className="font-semibold text-loyola-maroon mb-2">Expected headers</p>
              <p className="font-mono text-xs break-all">question_text,type,domain,subdomain,difficulty,options,key,explanation</p>
              <p className="mt-2">Use <strong>|</strong> to separate multiple options inside the <em>options</em> column.</p>
            </div>
            <div className="bg-loyola-gray-50 border border-loyola-gray-200 rounded-lg p-3">
              <p className="font-semibold text-loyola-gray-900 mb-2">Upload status</p>
              {uploadMessage ? (
                <p className="text-loyola-gray-800">{uploadMessage}</p>
              ) : (
                <p className="text-loyola-gray-600">No upload yet. New rows will appear in the table below after a successful import.</p>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Domain Filter */}
            <div>
              <label className="block text-sm font-semibold text-loyola-gray-700 mb-2">
                Domain
              </label>
              <select
                value={filters.domain}
                onChange={(e) => setFilters(prev => ({ ...prev, domain: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon"
              >
                <option value="">All Domains</option>
                {domains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-loyola-gray-700 mb-2">
                Question Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon"
              >
                <option value="">All Types</option>
                <option value="multiple-choice">Multiple Choice</option>
                <option value="short-answer">Short Answer</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-semibold text-loyola-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon"
              >
                <option value="">All Levels</option>
                <option value="1">Easy (1)</option>
                <option value="2">Medium (2)</option>
                <option value="3">Hard (3)</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-loyola-gray-700 mb-2">
                Search Questions
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-loyola-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search question text..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border-2 border-loyola-gray-300 rounded-lg focus:ring-2 focus:ring-loyola-maroon focus:border-loyola-maroon"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-loyola-gray-600">
            Showing {filteredQuestions.length} of {questions.length} questions
          </p>
        </div>

        {/* Questions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuestions.map((question) => (
            <div key={question.item_id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  {question.type === 'multiple-choice' ? (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-green-600" />
                  )}
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    question.type === 'multiple-choice' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {question.type === 'multiple-choice' ? 'MC' : 'SA'}
                  </span>
                  {question.is_active !== undefined && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      question.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {question.is_active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedQuestion(question)}
                    className="p-1 text-loyola-gray-400 hover:text-loyola-maroon transition"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingQuestion(question)}
                    className="p-1 text-loyola-gray-400 hover:text-blue-600 transition"
                    title="Edit question"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.item_id)}
                    className="p-1 text-loyola-gray-400 hover:text-red-600 transition"
                    title="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-loyola-gray-800 mb-2 line-clamp-3">
                  {question.question_text}
                </h3>
                <div className="flex items-center gap-4 text-sm text-loyola-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Domain:</span>
                    {question.domain}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Difficulty:</span>
                    {question.difficulty}
                  </span>
                </div>
              </div>

              {question.type === 'multiple-choice' && question.options && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-loyola-gray-700 mb-2">Options:</p>
                  <div className="space-y-1">
                    {question.options.map((option, index) => (
                      <div key={index} className="text-sm text-loyola-gray-600">
                        {String.fromCharCode(65 + index)}. {option}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-loyola-gray-500">
                Created: {new Date(question.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-loyola-gray-400 mx-auto mb-4" />
            <p className="text-loyola-gray-600">No questions found matching your criteria</p>
          </div>
        )}
      </main>

      {/* Question Detail Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-loyola-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-loyola-gray-800">
                  Question Details
                </h2>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="text-loyola-gray-400 hover:text-loyola-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-loyola-gray-700 mb-2">Question Information</h3>
                  <p className="text-sm text-loyola-gray-600 mb-2">
                    <span className="font-medium">Type:</span> {selectedQuestion.type}
                  </p>
                  <p className="text-sm text-loyola-gray-600 mb-2">
                    <span className="font-medium">Domain:</span> {selectedQuestion.domain}
                  </p>
                  <p className="text-sm text-loyola-gray-600 mb-2">
                    <span className="font-medium">Subdomain:</span> {selectedQuestion.subdomain}
                  </p>
                  <p className="text-sm text-loyola-gray-600">
                    <span className="font-medium">Difficulty:</span> {selectedQuestion.difficulty}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-loyola-gray-700 mb-2">Metadata</h3>
                  {selectedQuestion.is_active !== undefined && (
                    <p className="text-sm text-loyola-gray-600 mb-2">
                      <span className="font-medium">Status:</span>{' '}
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedQuestion.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {selectedQuestion.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  )}
                  <p className="text-sm text-loyola-gray-600 mb-2">
                    <span className="font-medium">Created:</span> {new Date(selectedQuestion.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-loyola-gray-600">
                    <span className="font-medium">Updated:</span> {new Date(selectedQuestion.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-loyola-gray-700 mb-2">Question Text</h3>
                <p className="text-loyola-gray-800 bg-loyola-gray-50 p-4 rounded-lg">
                  {selectedQuestion.question_text}
                </p>
              </div>

              {selectedQuestion.type === 'multiple-choice' && selectedQuestion.options && (
                <div className="mb-6">
                  <h3 className="font-semibold text-loyola-gray-700 mb-2">Answer Options</h3>
                  <div className="space-y-2">
                    {selectedQuestion.options.map((option, index) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        index === 0 ? 'bg-green-50 border border-green-200' : 'bg-loyola-gray-50'
                      }`}>
                        <span className="font-medium text-loyola-gray-700">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className="ml-2 text-loyola-gray-800">{option}</span>
                        {index === 0 && (
                          <span className="ml-2 text-xs text-green-600 font-medium">(Correct Answer)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedQuestion.explanation && (
                <div>
                  <h3 className="font-semibold text-loyola-gray-700 mb-2">Explanation</h3>
                  <p className="text-loyola-gray-800 bg-loyola-gray-50 p-4 rounded-lg">
                    {selectedQuestion.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Question Modal */}
      {(showAddForm || editingQuestion) && (
        <EditQuestionModal
          question={editingQuestion}
          isOpen={showAddForm || !!editingQuestion}
          onClose={() => {
            setShowAddForm(false);
            setEditingQuestion(null);
          }}
          onSave={() => {
            const token = localStorage.getItem('instructor-token');
            if (token) {
              loadQuestions(token);
            }
            setShowAddForm(false);
            setEditingQuestion(null);
          }}
          domains={domains}
          subdomains={subdomains}
        />
      )}
    </div>
  );
}
