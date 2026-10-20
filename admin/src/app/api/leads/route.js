import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();

    const { services, material, gauge, width, quantity, timeline, details, name, company, email, phone } = body;

    if (!name || !email || !services || services.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const lead = {
      services,
      material,
      gauge,
      width,
      quantity,
      timeline,
      details,
      name,
      company,
      email,
      phone,
      status: 'new',
      source: 'website',
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase.from('leads').insert([lead]).select();
      if (error) {
        console.error('Supabase insert error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      return NextResponse.json({ success: true, id: data[0]?.id }, { status: 201 });
    }

    // Fallback: log to console if Supabase not configured
    console.log('Lead received (no Supabase configured):', lead);
    return NextResponse.json({ success: true, stored: 'log-only' }, { status: 201 });

  } catch (err) {
    console.error('Lead API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
