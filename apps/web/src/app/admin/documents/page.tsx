'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Download,
  RefreshCw,
  ArrowLeft,
  LogOut,
  Loader2,
  ImageIcon,
  Database,
  Code,
  BookOpen,
  ClipboardList,
} from 'lucide-react';

const ADMIN_USERS = ['gbolivard', 'ajalilv'];

type FileEntry = {
  name: string;
  path: string;
  description?: string;
};

type Section = {
  id: string;
  title: string;
  icon: React.ReactNode;
  files: FileEntry[];
  layout?: 'grid' | 'list';
};

const SECTIONS: Section[] = [
  {
    id: 'paper',
    title: 'Paper',
    icon: <FileText className="w-5 h-5" />,
    files: [
      {
        name: 'Bolivard_QUIN102_Paper1.docx',
        path: 'Bolivard_QUIN102_Paper1.docx',
        description: 'Primary deliverable',
      },
    ],
  },
  {
    id: 'pretest-report',
    title: 'Pre-Test Results Report',
    icon: <ClipboardList className="w-5 h-5" />,
    files: [
      {
        name: 'QUIN102_Pretest_Results_Report.docx',
        path: 'QUIN102_Pretest_Results_Report.docx',
        description: 'Instructor-facing pre-test report with teaching guidance',
      },
      {
        name: 'QUIN102_Pretest_Report_BuildNote.md',
        path: 'QUIN102_Pretest_Report_BuildNote.md',
        description: 'Build note - sources, traceability, verification checklist',
      },
    ],
  },
  {
    id: 'figures',
    title: 'Figures',
    icon: <ImageIcon className="w-5 h-5" />,
    layout: 'grid',
    files: [
      { name: 'Fig 1 -Score Distribution', path: 'figures/fig1_score_distribution.png' },
      { name: 'Fig 2 -Domain Performance', path: 'figures/fig2_domain_performance.png' },
      { name: 'Fig 3 -Enrollment Timeline', path: 'figures/fig3_enrollment_timeline.png' },
      { name: 'Fig 4 -Submission Time', path: 'figures/fig4_submission_time.png' },
      { name: 'Fig 5 -Confidence Calibration', path: 'figures/fig5_confidence_calibration.png' },
      { name: 'Fig 6 -Item Difficulty', path: 'figures/fig6_item_difficulty.png' },
      { name: 'Fig 7 -Demographics', path: 'figures/fig7_demographics.png' },
      { name: 'Fig 8 -Financial Background', path: 'figures/fig8_financial_background.png' },
    ],
  },
  {
    id: 'data',
    title: 'Data Files',
    icon: <Database className="w-5 h-5" />,
    files: [
      { name: 'all_responses_421_students.csv', path: 'all_responses_421_students.csv', description: 'Full response data (421 students)' },
      { name: 'consented_responses_354.csv', path: 'consented_responses_354.csv', description: 'Research-consented responses (n = 354)' },
      { name: 'question_bank_40items.csv', path: 'question_bank_40items.csv', description: '40-item anchor question bank' },
      { name: 'sdm10_item_bank.xlsx', path: 'sdm10_item_bank.xlsx', description: 'SDM-10 adaptive item bank' },
      { name: 'confirm_by_item.csv', path: 'confirm_by_item.csv', description: 'Confirmation items by question' },
      { name: 'diagnose_by_item.csv', path: 'diagnose_by_item.csv', description: 'Diagnostic items by question' },
      { name: 'misconception_taxonomy_observed.csv', path: 'misconception_taxonomy_observed.csv', description: 'Observed misconception taxonomy' },
      { name: 'model_selection_concordance.csv', path: 'model_selection_concordance.csv', description: 'Model selection concordance' },
      { name: 'sdm_open_answers.csv', path: 'sdm_open_answers.csv', description: 'SDM open-ended responses' },
    ],
  },
  {
    id: 'scripts',
    title: 'Build & Verification',
    icon: <Code className="w-5 h-5" />,
    files: [
      { name: 'generate_charts.py', path: 'generate_charts.py', description: 'Generates all 8 figure PNGs' },
      { name: 'generate_paper.js', path: 'generate_paper.js', description: 'Builds DOCX from paper.md' },
      { name: 'verify_paper_tables.py', path: 'verify_paper_tables.py', description: 'Runs 28+ verification checks' },
    ],
  },
  {
    id: 'docs',
    title: 'Supporting Documents',
    icon: <BookOpen className="w-5 h-5" />,
    files: [
      { name: 'Change_Summary_Professor.md', path: 'Change_Summary_Professor.md', description: 'Summary of changes for professor' },
      { name: 'QA_Checklist_Final.md', path: 'QA_Checklist_Final.md', description: 'Final QA checklist' },
    ],
  },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatModified(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getFileBadgeColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'docx': case 'doc': return 'bg-blue-100 text-blue-700';
    case 'csv': return 'bg-emerald-100 text-emerald-700';
    case 'xlsx': return 'bg-green-100 text-green-700';
    case 'png': return 'bg-purple-100 text-purple-700';
    case 'py': return 'bg-sky-100 text-sky-700';
    case 'js': return 'bg-amber-100 text-amber-700';
    case 'md': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getFileTag(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'docx': return 'DOCX';
    case 'csv': return 'CSV';
    case 'xlsx': return 'XLSX';
    case 'png': return 'PNG';
    case 'py': return 'PY';
    case 'js': return 'JS';
    case 'md': return 'MD';
    default: return 'FILE';
  }
}

export default function DocumentsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [fileSizes, setFileSizes] = useState<Record<string, number>>({});
  const [fileModified, setFileModified] = useState<Record<string, string>>({});
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem('instructor-token');
    const name = localStorage.getItem('instructor-name');

    if (!t) {
      router.push('/instructor');
      return;
    }

    if (!name || !ADMIN_USERS.includes(name)) {
      router.push('/instructor/dashboard');
      return;
    }

    setToken(t);
    loadFileSizes(t);
  }, [router]);

  const loadFileSizes = async (t: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/documents', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await response.json();
      if (data.success) {
        const sizes: Record<string, number> = {};
        const modified: Record<string, string> = {};
        for (const file of data.files) {
          sizes[file.path] = file.size;
          if (file.modified) modified[file.path] = file.modified;
        }
        setFileSizes(sizes);
        setFileModified(modified);
      }
    } catch (error) {
      console.error('Error loading file sizes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    if (!token) return;

    setDownloadingFile(filePath);
    try {
      const response = await fetch(
        `/api/admin/documents?file=${encodeURIComponent(filePath)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('instructor-token');
    localStorage.removeItem('instructor-name');
    localStorage.removeItem('active-portal');
    router.push('/instructor');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-ink animate-spin mx-auto mb-4" />
          <p className="text-loyola-gray-600">Loading deliverables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-loyola-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 text-loyola-gray-600 hover:text-ink transition"
                title="Back to Admin Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-ink">Paper 1 Submission Package</h1>
                <p className="text-sm text-loyola-gray-600">
                  QUIN 102 -Bolivard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => loadFileSizes(token!)}
                className="p-2 text-loyola-gray-600 hover:text-ink transition"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-loyola-gray-700 hover:text-ink transition"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {SECTIONS.map((section) => (
          <div
            key={section.id}
            className="bg-white rounded-xl shadow-sm border border-loyola-gray-200 overflow-hidden mb-6"
          >
            <div className="px-6 py-4 border-b border-loyola-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-loyola-gray-800 flex items-center gap-2">
                {section.icon}
                {section.title}
              </h2>
              <span className="text-sm text-loyola-gray-500">
                {section.files.length} file{section.files.length !== 1 ? 's' : ''}
              </span>
            </div>

            {section.id === 'paper' ? (
              <div className="p-6">
                {section.files.map((file) => (
                  <div key={file.path} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-100 text-blue-700">
                        DOCX
                      </span>
                      <div>
                        <p className="text-base font-semibold text-loyola-gray-900">{file.name}</p>
                        <p className="text-sm text-loyola-gray-500">
                          {file.description}
                          {fileSizes[file.path] && ` · ${formatFileSize(fileSizes[file.path])}`}
                        </p>
                        {fileModified[file.path] && (
                          <p className="text-xs text-loyola-gray-400 mt-0.5">
                            Last updated: {formatModified(fileModified[file.path])}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(file.path, file.name)}
                      disabled={downloadingFile === file.path}
                      className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-loyola-maroon hover:bg-loyola-maroon-dark rounded-lg transition disabled:opacity-50"
                    >
                      {downloadingFile === file.path ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {downloadingFile === file.path ? 'Downloading...' : 'Download'}
                    </button>
                  </div>
                ))}
              </div>
            ) : section.layout === 'grid' ? (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {section.files.map((file) => (
                  <FigureCard
                    key={file.path}
                    file={file}
                    token={token}
                    size={fileSizes[file.path]}
                    modified={fileModified[file.path]}
                    isDownloading={downloadingFile === file.path}
                    onDownload={() => handleDownload(file.path, file.path.split('/').pop()!)}
                  />
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-loyola-gray-100">
                {section.files.map((file) => (
                  <li key={file.path} className="px-6 py-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <span
                          className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded ${getFileBadgeColor(file.name)}`}
                        >
                          {getFileTag(file.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-loyola-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-loyola-gray-500">
                            {file.description}
                            {fileSizes[file.path] && ` · ${formatFileSize(fileSizes[file.path])}`}
                            {fileModified[file.path] && ` · ${formatModified(fileModified[file.path])}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(file.path, file.name)}
                        disabled={downloadingFile === file.path}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-loyola-maroon hover:bg-loyola-maroon-dark rounded-lg transition disabled:opacity-50"
                      >
                        {downloadingFile === file.path ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        {downloadingFile === file.path ? 'Downloading...' : 'Download'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}

function FigureCard({
  file,
  token,
  size,
  modified,
  isDownloading,
  onDownload,
}: {
  file: FileEntry;
  token: string | null;
  size?: number;
  modified?: string;
  isDownloading: boolean;
  onDownload: () => void;
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(
          `/api/admin/documents?file=${encodeURIComponent(file.path)}&inline=true`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        if (cancelled) return;
        setImgSrc(URL.createObjectURL(blob));
      } catch {
        // ignore
      }
    };
    load();

    return () => {
      cancelled = true;
      if (imgSrc) URL.revokeObjectURL(imgSrc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, file.path]);

  return (
    <div className="border border-loyola-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
      <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgSrc} alt={file.name} className="w-full h-full object-contain" />
        ) : (
          <ImageIcon className="w-8 h-8 text-loyola-gray-300" />
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-medium text-loyola-gray-800 truncate">{file.name}</p>
        {(size || modified) && (
          <p className="text-xs text-loyola-gray-500">
            {size ? formatFileSize(size) : ''}
            {size && modified ? ' · ' : ''}
            {modified ? formatModified(modified) : ''}
          </p>
        )}
        <button
          onClick={onDownload}
          disabled={isDownloading}
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-loyola-maroon hover:bg-loyola-maroon-dark rounded transition disabled:opacity-50"
        >
          {isDownloading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Download className="w-3 h-3" />
          )}
          {isDownloading ? 'Downloading...' : 'Download'}
        </button>
      </div>
    </div>
  );
}
