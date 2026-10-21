import { NextResponse } from 'next/server';
import { listTargets, createTarget } from '@/data/targets/target-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(listTargets());
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.n) {
      return NextResponse.json({ error: 'Company name (n) is required' }, { status: 400 });
    }
    const target = createTarget(body);
    return NextResponse.json(target, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
