'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Download,
  RefreshCw,
  ArrowLeft,
  LogOut,
  FolderOpen,
  Loader2,
} from 'lucide-react';

type DocumentFile = {
  name: string;
  path: string;
  size: number;
  modified: string;
};

const ADMIN_USER = 'gbolivard';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'PDF';
    case 'docx': case 'doc': return 'DOC';
    case 'xlsx': case 'xls': return 'XLS';
    case 'csv': return 'CSV';
    case 'zip': return 'ZIP';
    case 'png': case 'jpg': case 'jpeg': return 'IMG';
    case 'py': return 'PY';
    case 'js': return 'JS';
    case 'md': return 'MD';
    default: return 'FILE';
  }
}

function getFileBadgeColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'bg-red-100 text-red-700';
    case 'docx': case 'doc': return 'bg-blue-100 text-blue-700';
    case 'xlsx': case 'xls': return 'bg-green-100 text-green-700';
    case 'csv': return 'bg-emerald-100 text-emerald-700';
    case 'zip': return 'bg-yellow-100 text-yellow-700';
    case 'png': case 'jpg': case 'jpeg': return 'bg-purple-100 text-purple-700';
    case 'py': return 'bg-sky-100 text-sky-700';
    case 'js': return 'bg-amber-100 text-amber-700';
    case 'md': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function DocumentsPage() {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('instructor-token');
    const name = localStorage.getItem('instructor-name');

    if (!token) {
      router.push('/instructor');
      return;
    }

    if (name !== ADMIN_USER) {
      router.push('/instructor/dashboard');
      return;
    }

    loadDocuments(token);
  }, [router]);

  const loadDocuments = async (token?: string) => {
    const t = token || localStorage.getItem('instructor-token');
    if (!t) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/documents', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await response.json();
      if (data.success) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (file: DocumentFile) => {
    const token = localStorage.getItem('instructor-token');
    if (!token) return;

    setDownloadingFile(file.path);
    try {
      const response = await fetch(
        `/api/admin/documents?file=${encodeURIComponent(file.path)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
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

  // Group files: top-level vs subdirectories
  const topLevelFiles = files.filter((f) => !f.path.includes('/'));
  const groupedFiles: Record<string, DocumentFile[]> = {};
  files
    .filter((f) => f.path.includes('/'))
    .forEach((f) => {
      const folder = f.path.split('/')[0];
      if (!groupedFiles[folder]) groupedFiles[folder] = [];
      groupedFiles[folder].push(f);
    });

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
                <h1 className="text-2xl font-bold text-ink">Documents</h1>
                <p className="text-sm text-loyola-gray-600">
                  Live files from exports directory
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => loadDocuments()}
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {isLoading ? (
          <div className="text-center py-16">
            <RefreshCw className="w-10 h-10 text-ink animate-spin mx-auto mb-4" />
            <p className="text-loyola-gray-600">Loading documents...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-loyola-gray-200">
            <FolderOpen className="w-16 h-16 text-loyola-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-loyola-gray-700 mb-2">No documents yet</h2>
            <p className="text-sm text-loyola-gray-500">
              Place files in the <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">exports/</code> directory to make them available here.
            </p>
          </div>
        ) : (
          <>
            {/* Top-level files */}
            <div className="bg-white rounded-xl shadow-sm border border-loyola-gray-200 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-loyola-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-loyola-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-ink" />
                  Files
                </h2>
                <span className="text-sm text-loyola-gray-500">
                  {files.length} file{files.length !== 1 ? 's' : ''} total
                </span>
              </div>
              {topLevelFiles.length > 0 && (
                <ul className="divide-y divide-loyola-gray-100">
                  {topLevelFiles.map((file) => (
                    <FileRow
                      key={file.path}
                      file={file}
                      isDownloading={downloadingFile === file.path}
                      onDownload={handleDownload}
                    />
                  ))}
                </ul>
              )}
            </div>

            {/* Grouped files by subfolder */}
            {Object.entries(groupedFiles).map(([folder, folderFiles]) => (
              <div
                key={folder}
                className="bg-white rounded-xl shadow-sm border border-loyola-gray-200 overflow-hidden mb-6"
              >
                <div className="px-6 py-3 border-b border-loyola-gray-200 bg-gray-50">
                  <h3 className="text-sm font-semibold text-loyola-gray-700 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-loyola-gray-500" />
                    {folder}/
                    <span className="font-normal text-loyola-gray-500">
                      ({folderFiles.length} file{folderFiles.length !== 1 ? 's' : ''})
                    </span>
                  </h3>
                </div>
                <ul className="divide-y divide-loyola-gray-100">
                  {folderFiles.map((file) => (
                    <FileRow
                      key={file.path}
                      file={file}
                      isDownloading={downloadingFile === file.path}
                      onDownload={handleDownload}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}

function FileRow({
  file,
  isDownloading,
  onDownload,
}: {
  file: DocumentFile;
  isDownloading: boolean;
  onDownload: (file: DocumentFile) => void;
}) {
  return (
    <li className="px-6 py-4 hover:bg-gray-50 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <span
            className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded ${getFileBadgeColor(file.name)}`}
          >
            {getFileIcon(file.name)}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-loyola-gray-900 truncate">{file.name}</p>
            <p className="text-xs text-loyola-gray-500">
              {formatFileSize(file.size)} &middot;{' '}
              {new Date(file.modified).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <button
          onClick={() => onDownload(file)}
          disabled={isDownloading}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-loyola-maroon hover:bg-loyola-maroon-dark rounded-lg transition disabled:opacity-50"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isDownloading ? 'Downloading...' : 'Download'}
        </button>
      </div>
    </li>
  );
}
