import { NextResponse } from 'next/server';
import { listCards, createCard } from '@/data/cards/card-store';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  try {
    const res = NextResponse.json(listCards());
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.html) {
      return NextResponse.json({ error: 'Missing card HTML' }, { status: 400, headers: corsHeaders });
    }
    const card = createCard({ title: body.title, html: body.html });
    const baseUrl = `http://localhost:${process.env.PORT || 3461}`;
    const res = NextResponse.json({
      id: card.id,
      url: `${baseUrl}/cards/${card.id}`,
      createdAt: card.createdAt,
    }, { status: 201 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
