import { NextRequest, NextResponse } from 'next/server';
import { verifyInstructorToken } from '@/lib/instructor-auth';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

// Docker compose mounts ./exports -> /app/shared-documents
const REPORT_PATH = '/app/shared-documents/QUIN102_Pretest_Results_Report.docx';
const REPORT_FILENAME = 'QUIN102_Pretest_Results_Report.docx';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const instructorId = await verifyInstructorToken(token);
    if (!instructorId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const fileBuffer = await readFile(REPORT_PATH);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${REPORT_FILENAME}"`,
        'Content-Length': String(fileBuffer.length),
      },
    });
  } catch (err) {
    console.error('Report download error:', err);
    return NextResponse.json({ error: 'Report file not available' }, { status: 404 });
  }
}
