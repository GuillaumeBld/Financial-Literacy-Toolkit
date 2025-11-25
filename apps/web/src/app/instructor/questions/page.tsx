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
};

type FilterOptions = {
  domain: string;
  type: string;
  difficulty: string;
  searchTerm: string;
};

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

  const parseCsvQuestions = (fileText: string) => {
    const lines = fileText.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    return lines.slice(1).map((line) => {
      const values = line.split(',').map((value) => value.trim());
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

      return {
        question_text: row.question_text || row.question || '',
        type: (row.type as Question['type']) || 'multiple-choice',
        domain: row.domain || 'General',
        subdomain: row.subdomain || '',
        difficulty: Number(row.difficulty || 1),
        options,
        key: row.key || row.answer || undefined,
        explanation: row.explanation || '',
      };
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-loyola-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-loyola-gray-800">
                  {editingQuestion ? 'Edit Question' : 'Add New Question'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingQuestion(null);
                  }}
                  className="text-loyola-gray-400 hover:text-loyola-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-loyola-gray-600 mb-6">
                Question management form will be implemented here. This would include:
              </p>
              <ul className="list-disc list-inside text-loyola-gray-600 space-y-2">
                <li>Question text input</li>
                <li>Question type selection</li>
                <li>Domain and subdomain assignment</li>
                <li>Difficulty level setting</li>
                <li>Answer options (for multiple choice)</li>
                <li>Explanation text</li>
                <li>Save and cancel actions</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
