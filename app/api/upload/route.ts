import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { authenticate } from '@/lib/auth';

export async function POST(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;

  try {
    const data = await request.formData();
    const fileEntry = data.get('file');
    const file: File | null = fileEntry instanceof File ? fileEntry : null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.name.split('.').pop();
    const filename = `${file.name.replace(`.${ext}`, '')}-${uniqueSuffix}.${ext}`;

    // Ensure the uploads directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      console.error('Error creating uploads directory:', e);
    }

    const path = join(uploadDir, filename);
    await writeFile(path, buffer);
    console.log(`Uploaded file saved at ${path}`);

    // Return the URL to access the file (relative to public directory)
    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Error handling upload:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload file' }, { status: 500 });
  }
}
