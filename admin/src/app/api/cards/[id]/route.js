import { NextResponse } from 'next/server';
import { getCard, deleteCard } from '@/data/cards/card-store';

export async function GET(request, { params }) {
  const { id } = await params;
  const card = getCard(id);
  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }
  return NextResponse.json(card);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const ok = deleteCard(id);
  if (!ok) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
