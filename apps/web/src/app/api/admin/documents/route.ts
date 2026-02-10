import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat, readFile } from 'fs/promises';
import { join, extname, resolve, relative } from 'path';

// In Docker: mounted at /app/shared-documents
// In dev: ../../exports relative to apps/web (process.cwd())
const DOCUMENTS_DIR =
  process.env.DOCUMENTS_DIR ||
  (process.env.NODE_ENV === 'production'
    ? '/app/shared-documents'
    : join(process.cwd(), '..', '..', 'exports'));

const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.csv': 'text/csv',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.zip': 'application/zip',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.py': 'text/plain',
  '.js': 'text/plain',
  '.json': 'application/json',
};

// Recursively list files in a directory
async function listFiles(
  dir: string,
  base: string = ''
): Promise<Array<{ name: string; path: string; size: number; modified: string }>> {
  const results: Array<{ name: string; path: string; size: number; modified: string }> = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = join(dir, entry.name);
      const relativePath = base ? `${base}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        const subFiles = await listFiles(fullPath, relativePath);
        results.push(...subFiles);
      } else {
        const fileStat = await stat(fullPath);
        if (fileStat.size > 0) {
          results.push({
            name: entry.name,
            path: relativePath,
            size: fileStat.size,
            modified: fileStat.mtime.toISOString(),
          });
        }
      }
    }
  } catch {
    // Directory might not exist
  }

  return results;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileParam = searchParams.get('file');

    // If file param provided, serve the file for download
    if (fileParam) {
      // Block path traversal
      if (fileParam.includes('..') || fileParam.startsWith('/')) {
        return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
      }

      const filePath = resolve(DOCUMENTS_DIR, fileParam);
      // Double-check resolved path is within DOCUMENTS_DIR
      const resolvedBase = resolve(DOCUMENTS_DIR);
      if (!filePath.startsWith(resolvedBase)) {
        return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
      }

      try {
        const fileBuffer = await readFile(filePath);
        const ext = extname(fileParam).toLowerCase();
        const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
        const fileName = fileParam.split('/').pop() || fileParam;

        return new Response(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': String(fileBuffer.length),
          },
        });
      } catch {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
    }

    // List all files
    const files = await listFiles(DOCUMENTS_DIR);
    files.sort((a, b) => b.modified.localeCompare(a.modified));

    return NextResponse.json({ success: true, files });
  } catch (error: any) {
    console.error('Error in documents API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
