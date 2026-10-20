'use client';

import { useState, useEffect } from 'react';

const statusColors = {
  new: { bg: '#e8f4fd', text: '#1a73e8' },
  contacted: { bg: '#fff3e0', text: '#e65100' },
  quoted: { bg: '#f3e5f5', text: '#7b1fa2' },
  won: { bg: '#e8f5e9', text: '#2e7d32' },
  lost: { bg: '#fce4ec', text: '#c62828' },
};

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetch('/api/leads')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLeads(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? leads : leads.filter((l) => l.status === filter);
  const counts = leads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: '32px', maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Leads</h1>
          <p style={{ color: '#666', fontSize: '.9rem', marginTop: 4 }}>
            {leads.length} total lead{leads.length !== 1 ? 's' : ''} from website quote requests
          </p>
        </div>
      </div>

      {/* Status filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['all', 'new', 'contacted', 'quoted', 'won', 'lost'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: filter === s ? '2px solid #4A7FA5' : '1px solid #ddd',
              background: filter === s ? 'rgba(74,127,165,.08)' : '#fff',
              color: filter === s ? '#4A7FA5' : '#666',
              fontWeight: filter === s ? 600 : 400,
              fontSize: '.85rem',
              cursor: 'pointer',
            }}
          >
            {s === 'all' ? `All (${leads.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${counts[s] || 0})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>Loading leads...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
          <p style={{ fontSize: '1.1rem' }}>No leads yet</p>
          <p style={{ fontSize: '.85rem', marginTop: 8 }}>
            {leads.length === 0
              ? 'Leads from the website quote wizard will appear here.'
              : 'No leads match this filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((lead) => (
            <div
              key={lead.id}
              style={{
                background: '#fff',
                border: '1px solid #e8e5df',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              {/* Lead row */}
              <div
                onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                style={{
                  padding: '16px 20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 200px 120px 140px',
                  alignItems: 'center',
                  cursor: 'pointer',
                  gap: 16,
                }}
              >
                <div>
                  <strong style={{ fontSize: '.95rem' }}>{lead.name}</strong>
                  {lead.company && (
                    <span style={{ color: '#999', marginLeft: 8, fontSize: '.85rem' }}>{lead.company}</span>
                  )}
                </div>
                <div style={{ fontSize: '.85rem', color: '#666' }}>
                  {Array.isArray(lead.services) ? lead.services.join(', ') : lead.services}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontSize: '.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    background: (statusColors[lead.status] || statusColors.new).bg,
                    color: (statusColors[lead.status] || statusColors.new).text,
                  }}
                >
                  {lead.status}
                </span>
                <div style={{ fontSize: '.8rem', color: '#999', textAlign: 'right' }}>
                  {new Date(lead.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>

              {/* Expanded detail */}
              {expandedId === lead.id && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f0f0f0' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: 16,
                      paddingTop: 16,
                    }}
                  >
                    <Field label="Email" value={lead.email} />
                    <Field label="Phone" value={lead.phone} />
                    <Field label="Material" value={lead.material} />
                    <Field label="Gauge" value={lead.gauge} />
                    <Field label="Width" value={lead.width} />
                    <Field label="Quantity" value={lead.quantity} />
                    <Field label="Timeline" value={lead.timeline} />
                    <Field label="Source" value={lead.source} />
                  </div>
                  {lead.details && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: '.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
                        Additional Details
                      </div>
                      <p style={{ fontSize: '.9rem', color: '#333', lineHeight: 1.5 }}>{lead.details}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: '.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: '.9rem', color: '#333' }}>{value}</div>
    </div>
  );
}
