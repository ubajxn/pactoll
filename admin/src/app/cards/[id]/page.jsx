'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

export default function CardViewer() {
  const { id } = useParams();
  const [card, setCard] = useState(null);
  const [error, setError] = useState(null);
  const [shared, setShared] = useState(false);
  const iframeRef = useRef(null);
  const tracked = useRef(false);

  useEffect(() => {
    fetch(`/api/cards/${id}`)
      .then(r => { if (!r.ok) throw new Error('Card not found'); return r.json(); })
      .then(setCard)
      .catch(e => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (card && !tracked.current) {
      tracked.current = true;
      fetch(`/api/cards/${id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'view', referrer: document.referrer || 'direct' }),
      });
    }
  }, [card, id]);

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: card.title, url }).then(() => {
        trackShareEvent('native_share');
      });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        trackShareEvent('link_copy');
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      });
    }
  }

  function trackShareEvent(method) {
    fetch(`/api/cards/${id}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'share', method }),
    });
  }

  if (error) return (
    <div style={styles.center}>
      <h1 style={styles.errorTitle}>Card Not Found</h1>
      <p style={styles.errorText}>This card may have been removed or the link is incorrect.</p>
    </div>
  );

  if (!card) return (
    <div style={styles.center}>
      <div style={styles.loader} />
    </div>
  );

  const cardHtml = card.html
    .replace(/<button class="editor-toggle"[\s\S]*?<\/button>/, '')
    .replace(/<input type="file"[^>]*>/, '')
    .replace(/<div class="editor-panel"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, '')
    .replace(/<div class="controls"[\s\S]*?<\/div>/, '')
    .replace(/<script[\s\S]*?<\/script>/g, '');

  return (
    <div style={styles.page}>
      <div style={styles.cardFrame}>
        <iframe
          ref={iframeRef}
          srcDoc={cardHtml}
          style={styles.iframe}
          title={card.title}
          sandbox="allow-same-origin"
        />
      </div>
      <div style={styles.footer}>
        <div style={styles.brand}>
          <span style={styles.brandName}>Pacific Toll Processing</span>
          <span style={styles.brandSub}>Holiday 2026</span>
        </div>
        <button onClick={handleShare} style={styles.shareBtn}>
          {shared ? 'Link Copied!' : 'Share This Card'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f0eeeb',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  center: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  errorTitle: { fontSize: '1.5rem', color: '#1a1f25', marginBottom: 8 },
  errorText: { color: '#666' },
  loader: {
    width: 40,
    height: 40,
    border: '3px solid #e2e5ea',
    borderTopColor: '#4A7FA5',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  cardFrame: {
    width: '100%',
    maxWidth: 720,
    aspectRatio: '7/5',
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,.15)',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 720,
    marginTop: 20,
    padding: '12px 0',
  },
  brand: { display: 'flex', flexDirection: 'column', gap: 2 },
  brandName: { fontWeight: 600, fontSize: '.85rem', color: '#1a1f25' },
  brandSub: { fontSize: '.7rem', color: '#999' },
  shareBtn: {
    background: '#4A7FA5',
    color: '#fff',
    border: 'none',
    padding: '10px 24px',
    borderRadius: 6,
    fontWeight: 600,
    fontSize: '.85rem',
    cursor: 'pointer',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
};
