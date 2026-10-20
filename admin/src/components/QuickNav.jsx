"use client"
import { useState, useEffect, useRef } from 'react';

export default function QuickNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const links = [
    { href: '/deck/', label: 'Intro Deck', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> },
    { href: '/site/', label: 'Website', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2"/></svg> },
    { divider: true },
    { href: '/dashboard', label: 'Admin', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg> },
    { href: '/proposal.html', label: 'Proposal', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> },
  ];

  return (
    <div ref={ref} style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9000, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{
        position: 'absolute', bottom: 56, right: 0,
        background: '#1a1a1a', border: '1px solid rgba(255,255,255,.1)',
        borderRadius: 12, padding: '8px 0', minWidth: 180,
        boxShadow: '0 8px 32px rgba(0,0,0,.4)',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0) scale(1)' : 'translateY(8px) scale(.95)',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity .2s, transform .2s',
      }}>
        {links.map((item, i) =>
          item.divider
            ? <div key={i} style={{ height: 1, background: 'rgba(255,255,255,.08)', margin: '4px 12px' }} />
            : <a key={i} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 18px', color: 'rgba(255,255,255,.75)',
                textDecoration: 'none', fontSize: '.82rem', fontWeight: 500,
                letterSpacing: '.02em', transition: 'background .15s, color .15s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'rgba(255,255,255,.75)'; }}
            >
              <span style={{ opacity: .6, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </a>
        )}
      </div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 44, height: 44, borderRadius: '50%',
          background: '#4A7FA5', color: '#fff', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,.3)',
          transition: 'transform .2s, background .2s',
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseOut={e => e.currentTarget.style.transform = ''}
        aria-label="Quick navigation"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ width: 20, height: 20, transition: 'transform .3s', transform: open ? 'rotate(45deg)' : '' }}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}
