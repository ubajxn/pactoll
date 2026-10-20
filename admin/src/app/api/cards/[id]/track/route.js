import { NextResponse } from 'next/server';
import { trackView, trackShare } from '@/data/cards/card-store';

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const type = body.type || 'view';

  if (type === 'view') {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'local';
    const result = trackView(id, {
      ua: request.headers.get('user-agent') || '',
      ref: body.referrer || 'direct',
      ip,
    });
    if (!result) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    return NextResponse.json(result);
  }

  if (type === 'share') {
    const result = trackShare(id, { method: body.method || 'link_copy' });
    if (!result) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
