import { NextResponse } from 'next/server';
import { getTarget, updateTarget, deleteTarget } from '@/data/targets/target-store';

export async function GET(request, { params }) {
  const { slug } = await params;
  const target = getTarget(slug);
  if (!target) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(target);
}

export async function PUT(request, { params }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const updated = updateTarget(slug, body);
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { slug } = await params;
  const deleted = deleteTarget(slug);
  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
