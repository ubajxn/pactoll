import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'cards', 'cards.json');

function readStore() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { cards: {} };
  }
}

function writeStore(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function listCards() {
  const store = readStore();
  return Object.values(store.cards)
    .map(({ html, ...meta }) => ({
      ...meta,
      viewCount: meta.views?.length || 0,
      shareCount: meta.shares?.length || 0,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getCard(id) {
  const store = readStore();
  return store.cards[id] || null;
}

export function createCard({ title, html }) {
  const store = readStore();
  const id = generateId();
  store.cards[id] = {
    id,
    title: title || 'Holiday Card',
    html,
    createdAt: new Date().toISOString(),
    views: [],
    shares: [],
  };
  writeStore(store);
  return store.cards[id];
}

export function trackView(id, { ua, ref, ip }) {
  const store = readStore();
  const card = store.cards[id];
  if (!card) return null;
  card.views.push({
    ts: new Date().toISOString(),
    ua: ua || '',
    ref: ref || 'direct',
    ip: ip || '',
  });
  writeStore(store);
  return { viewCount: card.views.length };
}

export function trackShare(id, { method }) {
  const store = readStore();
  const card = store.cards[id];
  if (!card) return null;
  card.shares.push({
    ts: new Date().toISOString(),
    method: method || 'link_copy',
  });
  writeStore(store);
  return { shareCount: card.shares.length };
}

export function deleteCard(id) {
  const store = readStore();
  if (!store.cards[id]) return false;
  delete store.cards[id];
  writeStore(store);
  return true;
}
