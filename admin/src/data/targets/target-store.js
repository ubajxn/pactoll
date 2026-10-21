import fs from 'fs';
import path from 'path';
import { TARGET_ACCOUNTS as SEED_DATA } from './target-data';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'targets', 'targets.json');

function readStore() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    const seeded = { accounts: {} };
    for (const acct of SEED_DATA) {
      const slug = acct.slug || slugify(acct.n);
      seeded.accounts[slug] = { ...acct, slug };
    }
    writeStore(seeded);
    return seeded;
  }
}

function writeStore(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function listTargets() {
  const store = readStore();
  return Object.values(store.accounts).sort((a, b) => {
    const priOrder = { critical: 0, high: 1, med: 2, low: 3 };
    return (priOrder[a.pri] ?? 4) - (priOrder[b.pri] ?? 4);
  });
}

export function getTarget(slug) {
  const store = readStore();
  return store.accounts[slug] || null;
}

export function createTarget(data) {
  const store = readStore();
  const slug = data.slug || slugify(data.n);
  if (store.accounts[slug]) {
    throw new Error(`Account with slug "${slug}" already exists`);
  }
  store.accounts[slug] = {
    ...data,
    slug,
    contacts: data.contacts || [],
    touchLog: data.touchLog || [],
    notes: data.notes || [],
    news: data.news || [],
    socialLinks: data.socialLinks || {},
    createdAt: new Date().toISOString(),
  };
  writeStore(store);
  return store.accounts[slug];
}

export function updateTarget(slug, data) {
  const store = readStore();
  if (!store.accounts[slug]) return null;
  store.accounts[slug] = {
    ...store.accounts[slug],
    ...data,
    slug,
    updatedAt: new Date().toISOString(),
  };
  writeStore(store);
  return store.accounts[slug];
}

export function deleteTarget(slug) {
  const store = readStore();
  if (!store.accounts[slug]) return false;
  delete store.accounts[slug];
  writeStore(store);
  return true;
}
