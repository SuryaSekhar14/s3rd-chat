import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { AuthenticatedEdgeRequest } from '@/lib/AuthenticatedEdgeRequest';

export const POST = AuthenticatedEdgeRequest(async (request: NextRequest, { userId }: { userId: string }) => {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    if (!request.body) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    const uniqueFilename = `${userId}/${Date.now()}-${filename}`;

    const blob = await put(uniqueFilename, request.body, {
      access: 'public',
    });

    return NextResponse.json({
      url: blob.url,
      filename: blob.pathname,
    });
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}); 