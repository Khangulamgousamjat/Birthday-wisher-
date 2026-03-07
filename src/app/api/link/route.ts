import { NextResponse } from 'next/server';
import { saveSurpriseData } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, message } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const id = await saveSurpriseData({ name, message: message || '' });

    return NextResponse.json({ id });
  } catch (error) {
    console.error('Error saving link:', error);
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
  }
}
