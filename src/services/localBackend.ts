// ============================================================
// Local backend for Device Mode — the whole election runs on
// this device. Implements the same /api/* contract as the
// Express server (same routes, same response shapes, same
// safety rules), backed by IndexedDB instead of SQLite:
//
//  - officer PIN checked against a salted SHA-256 hash stored
//    on the device; the PIN itself is never stored or returned
//  - duplicate CNIC and duplicate face blocked at enrollment
//  - a vote can only be cast with the single-use token issued
//    by a successful face match (5-minute validity, voter-bound)
//  - casting checks approval status + exact candidate name
//  - receipts are real SHA-256 hashes of the ballot record
//
// Honest limit: this is a single-device demo/kiosk store. It is
// not a distributed election system — whoever controls the
// device controls the data.
// ============================================================

import {
  localAdd,
  localClear,
  localDelete,
  localGetAll,
  localMetaGet,
  localMetaSet,
  localPut,
} from './localDb';
import { PORTRAIT_1, PORTRAIT_2, PORTRAIT_3, PORTRAIT_4, PORTRAIT_5, CANDIDATE_PHOTOS } from './candidatePhotos';

export interface LocalApiResult {
  status: number;
  data: any;
}

const ok = (data: any, status = 200): LocalApiResult => ({ status, data });
const fail = (status: number, error: string, extra: any = {}): LocalApiResult => ({
  status,
  data: { error, ...extra },
});

// ---------- defaults (mirroring the server seeds) ----------
const DEFAULT_CONFIG = {
  title: 'ELECTION COMMISSION OF PAKISTAN // GENERAL ELECTION 2026',
  subtitle: 'Constituency NA-127 (Lahore-XI) // Biometric Polling Station #42',
  isBallotLocked: false,
  autoApprove: false,
};
const DEFAULT_PIN = '2026';
const DEFAULT_THRESHOLD = 0.82;

const DEFAULT_CANDIDATES = [
  { id: 'cand-1', name: 'Barrister Muhammad Ali Khan', party: 'Pakistan Tehreek-e-Insaf (PTI)', tagline: 'Empowering youth, judicial transparency, anti-corruption reforms, and citizen digital governance.', sign_name: 'Cricket Bat (بلہ)', sign_icon: 'bat', photo_url: PORTRAIT_1, display_order: 1, base_votes: 0, education: 'LLB (Hons), University of the Punjab', profession: 'Advocate — Barrister-at-Law', age: 47, hometown: 'Lahore, Punjab', experience: 'Former MNA (2018–2023); chaired the Standing Committee on Law & Justice' },
  { id: 'cand-2', name: 'Mian Tariq Mehmood Sharif', party: 'Pakistan Muslim League - Nawaz (PML-N)', tagline: 'Economic growth corridors, national motorways, power infrastructure, and industrial revitalization.', sign_name: 'Tiger (شیر)', sign_icon: 'tiger', photo_url: PORTRAIT_2, display_order: 2, base_votes: 0, education: 'MBA, Lahore University of Management Sciences', profession: 'Industrialist / Businessman', age: 55, hometown: 'Lahore, Punjab', experience: 'Two-time MPA; former Provincial Minister for Industries & Trade' },
  { id: 'cand-3', name: 'Syeda Fatima Zahra Gilani', party: 'Pakistan Peoples Party Parliamentarians (PPPP)', tagline: 'Social security nets, Benazir Income Support, healthcare access for rural communities, and labor rights.', sign_name: 'Arrow (تیر)', sign_icon: 'arrow', photo_url: PORTRAIT_3, display_order: 3, base_votes: 0, education: 'MBBS, King Edward Medical University', profession: 'Medical Doctor & Social Worker', age: 44, hometown: 'Multan, Punjab', experience: 'Director, Fatima Zahra Welfare Hospital; former Senator' },
  { id: 'cand-4', name: 'Hafiz Asad Qureshi', party: 'Jamaat-e-Islami (JI)', tagline: 'Honest municipal leadership, clean drinking water filtration, and youth IT training programs.', sign_name: 'Scale of Justice (ترازو)', sign_icon: 'scale', photo_url: PORTRAIT_4, display_order: 4, base_votes: 0, education: 'MA Islamic Studies, University of Karachi', profession: 'Religious Scholar & Educationist', age: 52, hometown: 'Lahore, Punjab', experience: 'Runs a network of schools and free IT training centres' },
  { id: 'cand-5', name: 'Mr. Awais Ali', party: 'Independent Candidate (آزاد امیدوار)', tagline: 'Grassroots constituency representation, IT innovation hubs, and community welfare in NA-127.', sign_name: 'Eagle of Iqbal (شاہین)', sign_icon: 'eagle', photo_url: PORTRAIT_5, display_order: 5, base_votes: 0, education: 'BS Computer Science, GCMS Shabqadar', profession: 'Student & Software Developer', hometown: 'Shabqadar, Khyber Pakhtunkhwa', experience: 'Built the FuelRun expo demo and the WAIS Player app' },
];

// ---------- crypto helpers ----------
async function sha256Hex(text: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {}
  // Fallback for non-secure contexts (still deterministic, not a receipt-grade hash)
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

function randomHex(bytes: number): string {
  try {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
  }
}

async function hashPin(pin: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}:${pin}`);
}

async function isPinValid(pin: string): Promise<boolean> {
  if (!pin) return false;
  const salt = (await localMetaGet('pinSalt')) as string | undefined;
  const expected = (await localMetaGet('pinHash')) as string | undefined;
  if (!salt || !expected) return false;
  const given = await hashPin(pin, salt);
  if (given.length !== expected.length) return false;
  // constant-time-ish comparison
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

// ---------- face math (mirrors server/db.ts) ----------
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ---------- one-time removal of the previously seeded dummy voters ----------
// Awais decided voters must only be people the officer enrolls manually.
// Early demo builds seeded six records with CNIC serials 0000001–0000006 and
// names ending in "(Test)". Remove exactly those records, plus the single
// anonymous ballot that belonged to the pre-voted dummy voter.
const DUMMY_VOTER_CNICS = new Set([
  '3520200000011',
  '3520200000022',
  '3520200000033',
  '3520200000044',
  '3520200000055',
  '3520200000066',
]);

async function removeDummyVotersOnce(): Promise<void> {
  if (await localMetaGet('dummyVotersRemoved')) return;
  const voters = await localGetAll<any>('voters');
  const ballots = await localGetAll<any>('ballots');
  for (const voter of voters) {
    const cnicDigits = String(voter.cnic || '').replace(/\D/g, '');
    const isDummy =
      DUMMY_VOTER_CNICS.has(cnicDigits) &&
      typeof voter.name === 'string' &&
      voter.name.trim().endsWith('(Test)');
    if (!isDummy) continue;

    if (voter.has_voted) {
      const enrolledMs = Date.parse(voter.enrolled_at || '');
      const seededBallot = ballots.find((ballot) => {
        const castMs = Date.parse(ballot.cast_at || '');
        return (
          ballot.choice === 'Mian Tariq Mehmood Sharif' &&
          Number.isFinite(enrolledMs) &&
          Number.isFinite(castMs) &&
          Math.abs(castMs - enrolledMs) <= 120000
        );
      });
      if (seededBallot) await localDelete('ballots', seededBallot.id);
    }
    await localDelete('voters', voter.id);
  }
  await localMetaSet('dummyVotersRemoved', true);
}

// ---------- seeding ----------
let seedPromise: Promise<void> | null = null;

export function ensureLocalSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const seeded = await localMetaGet('seeded');
      if (!seeded) {
        await localMetaSet('config', { ...DEFAULT_CONFIG });
        await localMetaSet('threshold', DEFAULT_THRESHOLD);
        const salt = randomHex(16);
        await localMetaSet('pinSalt', salt);
        await localMetaSet('pinHash', await hashPin(DEFAULT_PIN, salt));
        const existingCandidates = await localGetAll('candidates');
        if (existingCandidates.length === 0) {
          for (const cand of DEFAULT_CANDIDATES) await localPut('candidates', { ...cand });
        }
        await localMetaSet('seeded', true);
      }
      await removeDummyVotersOnce();
      await localizeSeedCandidatePhotosOnce();
    })();
  }
  return seedPromise;
}

// Older installs seeded candidate photos as remote CDN links, which break
// with no internet. Swap the 5 prebuilt candidates' photos for the bundled
// portraits exactly once; officer-edited photos are never touched.
async function localizeSeedCandidatePhotosOnce(): Promise<void> {
  if (await localMetaGet('candidatePhotosLocalized')) return;
  const candidates = await localGetAll<any>('candidates');
  for (const cand of candidates) {
    const bundled = CANDIDATE_PHOTOS[cand.id];
    if (bundled && typeof cand.photo_url === 'string' && cand.photo_url.startsWith('https://images.unsplash.com')) {
      cand.photo_url = bundled;
      await localPut('candidates', cand);
    }
  }
  await localMetaSet('candidatePhotosLocalized', true);
}

async function getConfig(): Promise<any> {
  await ensureLocalSeeded();
  return (await localMetaGet('config')) || { ...DEFAULT_CONFIG };
}

async function getThreshold(): Promise<number> {
  await ensureLocalSeeded();
  const t = await localMetaGet('threshold');
  return typeof t === 'number' ? t : DEFAULT_THRESHOLD;
}

// ---------- ballot tokens (single-use, voter-bound, 5 minutes) ----------
const ballotTokens = new Map<string, { voterId: number; expires: number }>();

function issueBallotToken(voterId: number): string {
  const token = randomHex(32);
  ballotTokens.set(token, { voterId, expires: Date.now() + 5 * 60 * 1000 });
  return token;
}

function consumeBallotToken(token: string, voterId: number): boolean {
  const entry = ballotTokens.get(token);
  if (!entry) return false;
  ballotTokens.delete(token); // single-use, even on failure
  if (entry.voterId !== voterId) return false;
  if (Date.now() > entry.expires) return false;
  return true;
}

async function getVoters(): Promise<any[]> {
  const voters = await localGetAll<any>('voters');
  return voters.sort((a, b) => (a.id || 0) - (b.id || 0));
}

async function getCandidatesSorted(): Promise<any[]> {
  const candidates = await localGetAll<any>('candidates');
  return candidates.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
}

function publicVoter(v: any): any {
  const { embedding: _embedding, ...rest } = v;
  return rest;
}

// ============================================================
// Route handler — mirrors server/api.ts
// path: pathname without the /api prefix is NOT assumed; pass
// the full pathname starting with /api.
// ============================================================
export async function handleLocalApi(
  pathname: string,
  method: string,
  body: any,
  headers: Record<string, string>
): Promise<LocalApiResult> {
  await ensureLocalSeeded();
  const path = pathname.replace(/^\/api/, '') || '/';
  const pin = headers['x-admin-pin'] || '';

  try {
    // ---- public health/config/candidates/results ----
    if (method === 'GET' && path === '/health') {
      return ok({ status: 'ok', time: new Date().toISOString(), mode: 'device' });
    }
    if (method === 'GET' && path === '/config') {
      const config = await getConfig();
      // Public roll counts (numbers only) — same contract as the server,
      // so the kiosk can warn before opening a camera that cannot match.
      const voters = await getVoters();
      return ok({
        threshold: await getThreshold(),
        ...config,
        registered_voters: voters.length,
        approved_voters: voters.filter((v) => v.approval_status === 'approved').length,
      });
    }
    if (method === 'GET' && path === '/candidates') {
      return ok({ candidates: await getCandidatesSorted() });
    }
    if (method === 'GET' && path === '/public/results') {
      return ok(await computePublicResults());
    }

    // ---- PIN verify (before the admin gate) ----
    if (method === 'POST' && path === '/admin/verify') {
      const candidate = typeof body?.pin === 'string' ? body.pin.trim() : '';
      if (!(await isPinValid(candidate))) return fail(401, 'Invalid officer PIN');
      return ok({ success: true });
    }

    // ---- AI extraction needs the server (Gemini). Honest refusal. ----
    if (path === '/cnic/extract' || path === '/admin/candidates/extract-from-image') {
      return fail(
        501,
        'AI photo scanning needs the online server. In Device Mode, please type the details manually.'
      );
    }

    // ---- admin gate: everything under /admin + voter registry writes ----
    const needsAdmin =
      path.startsWith('/admin') ||
      (method === 'GET' && path === '/voters') ||
      (method === 'POST' && path === '/voters/enroll') ||
      (method === 'DELETE' && path.startsWith('/voters/'));
    if (needsAdmin && !(await isPinValid(pin))) {
      return fail(401, 'Admin authorization required: officer PIN missing or invalid');
    }

    // ---- admin config / threshold ----
    if (method === 'POST' && path === '/admin/threshold') {
      const threshold = body?.threshold;
      if (typeof threshold !== 'number' || threshold < 0.1 || threshold > 0.99) {
        return fail(400, 'Threshold must be a number between 0.1 and 0.99');
      }
      const rounded = Number(threshold.toFixed(2));
      await localMetaSet('threshold', rounded);
      return ok({ success: true, threshold: rounded });
    }
    if (method === 'POST' && path === '/admin/config') {
      const config = await getConfig();
      const b = body || {};
      if (typeof b.title === 'string') config.title = b.title;
      if (typeof b.subtitle === 'string') config.subtitle = b.subtitle;
      if (typeof b.isBallotLocked === 'boolean') config.isBallotLocked = b.isBallotLocked;
      if (typeof b.autoApprove === 'boolean') config.autoApprove = b.autoApprove;
      if (typeof b.adminPin === 'string' && b.adminPin.trim().length >= 4) {
        const salt = randomHex(16);
        await localMetaSet('pinSalt', salt);
        await localMetaSet('pinHash', await hashPin(b.adminPin.trim(), salt));
      }
      await localMetaSet('config', config);
      return ok({ success: true, config });
    }

    // ---- candidates admin ----
    if (method === 'POST' && path === '/admin/candidates') {
      const { id, name, party, tagline, sign_name, sign_icon, photo_url, display_order, education, profession, age, hometown, experience } = body || {};
      if (!name || typeof name !== 'string' || !name.trim()) return fail(400, 'Candidate name is required');
      if (!sign_name || typeof sign_name !== 'string' || !sign_name.trim())
        return fail(400, 'Electoral symbol/sign name is required');
      const candidate = {
        id: id || `cand-${Date.now()}`,
        name: name.trim(),
        party: (party || 'Independent').trim(),
        tagline: (tagline || '').trim(),
        sign_name: sign_name.trim(),
        sign_icon: sign_icon || 'scale',
        photo_url: photo_url || '',
        display_order: Number(display_order || 0),
        base_votes: 0,
        education: typeof education === 'string' && education.trim() ? education.trim() : undefined,
        profession: typeof profession === 'string' && profession.trim() ? profession.trim() : undefined,
        age: typeof age === 'number' && age >= 18 && age <= 120 ? age : undefined,
        hometown: typeof hometown === 'string' && hometown.trim() ? hometown.trim() : undefined,
        experience: typeof experience === 'string' && experience.trim() ? experience.trim() : undefined,
      };
      await localPut('candidates', candidate);
      return ok({ success: true, candidate });
    }
    const candDelete = path.match(/^\/admin\/candidates\/(.+)$/);
    if (method === 'DELETE' && candDelete) {
      await localDelete('candidates', decodeURIComponent(candDelete[1]));
      return ok({ success: true, deletedId: decodeURIComponent(candDelete[1]) });
    }
    if (method === 'POST' && path === '/admin/candidates/reorder') {
      const ids = body?.candidateIds;
      if (!Array.isArray(ids)) return fail(400, 'candidateIds array required');
      const candidates = await getCandidatesSorted();
      for (let i = 0; i < ids.length; i++) {
        const cand = candidates.find((c) => c.id === ids[i]);
        if (cand) await localPut('candidates', { ...cand, display_order: i + 1 });
      }
      return ok({ success: true });
    }

    // ---- voter registry ----
    if (method === 'GET' && (path === '/voters' || path === '/admin/voters')) {
      const voters = await getVoters();
      return ok({ voters });
    }
    if (method === 'POST' && path === '/voters/enroll') {
      return await enroll(body || {});
    }
    const voterDelete = path.match(/^\/(?:admin\/)?voters\/(\d+)$/);
    if (method === 'DELETE' && voterDelete) {
      await localDelete('voters', Number(voterDelete[1]));
      return ok({ success: true, deletedId: Number(voterDelete[1]) });
    }
    const approveMatch = path.match(/^\/admin\/voters\/(\d+)\/approve$/);
    if (method === 'POST' && approveMatch) {
      const status = body?.status;
      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return fail(400, "status must be 'approved', 'rejected', or 'pending'");
      }
      const voters = await getVoters();
      const voter = voters.find((v) => v.id === Number(approveMatch[1]));
      if (!voter) return fail(400, 'Voter not found');
      voter.approval_status = status;
      voter.approved_at = status === 'approved' ? new Date().toISOString() : null;
      await localPut('voters', voter);
      return ok({ success: true, voter: publicVoter(voter) });
    }
    if (method === 'POST' && path === '/admin/voters/bulk-approve') {
      const voters = await getVoters();
      for (const voter of voters) {
        if (voter.approval_status === 'pending') {
          voter.approval_status = 'approved';
          voter.approved_at = new Date().toISOString();
          await localPut('voters', voter);
        }
      }
      return ok({ success: true, message: 'All pending voters have been approved' });
    }

    // ---- biometric match ----
    if (method === 'POST' && (path === '/voters/match' || path === '/match')) {
      return await match(body || {});
    }

    // ---- cast ballot ----
    if (method === 'POST' && (path === '/ballots/vote' || path === '/ballots/cast')) {
      return await cast(body || {});
    }

    // ---- admin stats ----
    if (method === 'GET' && path === '/admin/stats') {
      return ok(await computeAdminStats());
    }

    // ---- admin reset ----
    if (method === 'POST' && path === '/admin/reset') {
      const clearAll = body?.clearAll === true;
      await localClear('ballots');
      if (clearAll) {
        await localClear('voters');
      } else {
        const voters = await getVoters();
        for (const voter of voters) {
          if (voter.has_voted) await localPut('voters', { ...voter, has_voted: false });
        }
      }
      return ok({
        success: true,
        message: clearAll
          ? 'All voter and ballot data wiped clean.'
          : 'Ballots cleared and voter statuses reset to not-voted.',
      });
    }

    // ---- data export / import (Device Mode only) ----
    if (method === 'GET' && path === '/admin/export') {
      return ok({
        success: true,
        backup: {
          exportedAt: new Date().toISOString(),
          config: await getConfig(),
          threshold: await getThreshold(),
          candidates: await getCandidatesSorted(),
          voters: await getVoters(),
          ballots: await localGetAll('ballots'),
        },
      });
    }
    if (method === 'POST' && path === '/admin/import') {
      const backup = body?.backup;
      if (!backup || !Array.isArray(backup.voters) || !Array.isArray(backup.candidates)) {
        return fail(400, 'Invalid backup file');
      }
      await localClear('voters');
      await localClear('candidates');
      await localClear('ballots');
      for (const c of backup.candidates) await localPut('candidates', c);
      for (const v of backup.voters) await localPut('voters', v);
      for (const b of backup.ballots || []) await localPut('ballots', b);
      if (backup.config) await localMetaSet('config', backup.config);
      if (typeof backup.threshold === 'number') await localMetaSet('threshold', backup.threshold);
      return ok({ success: true, message: 'Backup restored on this device.' });
    }

    return fail(404, `No local route for ${method} ${pathname}`);
  } catch (err: any) {
    return fail(500, err?.message || 'Local device error');
  }
}

// ---------- enrollment (mirrors server duplicate rules) ----------
async function enroll(b: any): Promise<LocalApiResult> {
  const { name, cnic, photo, embedding } = b;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return fail(400, 'Voter name is required');
  }
  if (
    embedding !== undefined &&
    (!Array.isArray(embedding) ||
      (embedding.length > 0 &&
        (embedding.length !== 128 || !embedding.every((v: any) => typeof v === 'number' && Number.isFinite(v)))))
  ) {
    return fail(400, 'Biometric embedding must be exactly 128 finite numbers');
  }

  const voters = await getVoters();

  if (cnic && typeof cnic === 'string' && cnic.trim().length > 0) {
    const existing = voters.find(
      (v) => v.cnic && v.cnic.replace(/\D/g, '') === cnic.replace(/\D/g, '')
    );
    if (existing) {
      return fail(
        409,
        `CNIC ${cnic} is already registered under "${existing.name}" (ID #${existing.id}). Duplicate registration blocked.`,
        {
          existingVoter: { id: existing.id, name: existing.name, photo: existing.photo },
          similarity: 1.0,
          canOverride: false,
        }
      );
    }
  }

  if (Array.isArray(embedding) && embedding.length === 128) {
    const DUPLICATE_THRESHOLD = 0.94;
    let best: any = null;
    let bestSim = -1;
    for (const voter of voters) {
      if (Array.isArray(voter.embedding) && voter.embedding.length === 128) {
        const sim = cosineSimilarity(embedding, voter.embedding);
        if (sim > bestSim) {
          bestSim = sim;
          best = voter;
        }
      }
    }
    if (best && bestSim >= DUPLICATE_THRESHOLD) {
      return fail(
        409,
        `Facial signature is ${(bestSim * 100).toFixed(1)}% similar to an already registered voter: "${best.name}" (ID #${best.id}).`,
        {
          existingVoter: { id: best.id, name: best.name, photo: best.photo },
          similarity: Number(bestSim.toFixed(4)),
          canOverride: false,
        }
      );
    }
  }

  const config = await getConfig();
  const now = new Date().toISOString();
  const voter: any = {
    name: name.trim(),
    cnic: cnic ? String(cnic).trim() : undefined,
    father_name: b.father_name || undefined,
    gender: b.gender || undefined,
    dob: b.dob || undefined,
    province: b.province || undefined,
    district: b.district || undefined,
    constituency: b.constituency || undefined,
    polling_station: b.polling_station || undefined,
    electoral_block_code: b.electoral_block_code || undefined,
    family_tree_no: b.family_tree_no || undefined,
    nadra_verified: b.nadra_verified === true,
    embedding: Array.isArray(embedding) ? embedding : [],
    photo: photo || undefined,
    approval_status: config.autoApprove ? 'approved' : 'pending',
    has_voted: false,
    enrolled_at: now,
    approved_at: config.autoApprove ? now : null,
  };
  const id = await localAdd('voters', voter);
  voter.id = id;
  return ok({ success: true, voter: publicVoter(voter) }, 201);
}

// ---------- biometric match (mirrors server behaviour) ----------
async function match(b: any): Promise<LocalApiResult> {
  const rawEmbedding =
    b.embedding || b.descriptor?.embedding || (Array.isArray(b.descriptor) ? b.descriptor : undefined);
  if (!Array.isArray(rawEmbedding) || rawEmbedding.length !== 128) {
    return fail(400, 'Live facial sensor feed snapshot or biometric signature is required for verification.');
  }
  const threshold = await getThreshold();
  const voters = await getVoters();

  let best: any = null;
  let bestSim = -1;
  let secondSim = -1;
  for (const voter of voters) {
    if (Array.isArray(voter.embedding) && voter.embedding.length === 128) {
      const sim = cosineSimilarity(rawEmbedding, voter.embedding);
      if (sim > bestSim) {
        secondSim = bestSim;
        bestSim = sim;
        best = voter;
      } else if (sim > secondSim) {
        secondSim = sim;
      }
    }
  }

  if (!best || bestSim < threshold) {
    return ok({
      match: false,
      reason: 'not_registered',
      similarity: Number(Math.max(0, bestSim).toFixed(4)),
      threshold,
    });
  }

  // Ambiguity guard: if a DIFFERENT enrolled voter is almost as similar to
  // this face as the best match, the identification is not trustworthy —
  // refuse rather than risk handing a ballot to the wrong person.
  if (secondSim >= threshold && bestSim - secondSim < 0.03) {
    return ok({
      match: false,
      reason: 'ambiguous_match',
      similarity: Number(bestSim.toFixed(4)),
      threshold,
    });
  }

  return ok({
    match: true,
    voter: {
      id: best.id,
      name: best.name,
      photo: best.photo,
      approval_status: best.approval_status,
      has_voted: best.has_voted,
      enrolled_at: best.enrolled_at,
      approved_at: best.approved_at,
    },
    similarity: Number(bestSim.toFixed(4)),
    threshold,
    ballotToken:
      best.approval_status === 'approved' && !best.has_voted ? issueBallotToken(best.id) : undefined,
  });
}

// ---------- cast ballot (mirrors server checks + receipt) ----------
async function cast(b: any): Promise<LocalApiResult> {
  const { voterId, choice, candidateName, ballotToken } = b;
  const finalChoice = typeof (choice || candidateName) === 'string' ? (choice || candidateName).trim() : '';
  if (!voterId) return fail(400, 'voterId is required');
  if (!finalChoice) return fail(400, 'Valid candidate or ballot choice is required');

  if (typeof ballotToken !== 'string' || !consumeBallotToken(ballotToken, Number(voterId))) {
    return fail(401, 'A valid one-time ballot token from biometric check-in is required to cast a vote');
  }

  const voters = await getVoters();
  const voter = voters.find((v) => v.id === Number(voterId));
  if (!voter) return fail(400, 'Voter not found in official registry');
  if (voter.has_voted) return fail(403, 'This voter has already voted');
  if (voter.approval_status === 'pending')
    return fail(403, 'Voter approval is pending — an officer must approve this registration before voting');
  if (voter.approval_status === 'rejected')
    return fail(403, 'Voter registration was rejected — this citizen is not eligible to vote');
  if (voter.approval_status !== 'approved') return fail(403, 'Voter is not approved to vote');

  const candidates = await getCandidatesSorted();
  const matched = candidates.find((c) => c.name.toLowerCase() === finalChoice.toLowerCase());
  if (!matched) return fail(400, 'Invalid ballot choice: not a candidate on the ballot paper');

  const castAt = new Date().toISOString();
  const ballotId = await localAdd('ballots', { choice: matched.name, cast_at: castAt });
  const receiptHash = await sha256Hex(`${ballotId}:${matched.name}:${castAt}`);
  await localPut('ballots', { id: ballotId, choice: matched.name, cast_at: castAt, receipt_hash: receiptHash });
  await localPut('voters', { ...voter, has_voted: true });

  return ok({
    success: true,
    message: 'Ballot recorded anonymously. The receipt hash is a SHA-256 hash of the ballot record.',
    receiptHash,
    ballot: { id: ballotId, choice: matched.name, cast_at: castAt },
  });
}

// ---------- stats + public results (mirror server formulas) ----------
async function computeAdminStats(): Promise<any> {
  const voters = await getVoters();
  const ballots = await localGetAll<any>('ballots');
  const totalEnrolled = voters.length;
  const totalPending = voters.filter((v) => v.approval_status === 'pending').length;
  const totalApproved = voters.filter((v) => v.approval_status === 'approved').length;
  const totalRejected = voters.filter((v) => v.approval_status === 'rejected').length;
  const totalVoted = voters.filter((v) => v.has_voted).length;
  const turnoutPercentage =
    totalApproved > 0 ? Number(((totalVoted / totalApproved) * 100).toFixed(1)) : 0;

  const counts = new Map<string, number>();
  for (const ballot of ballots) counts.set(ballot.choice, (counts.get(ballot.choice) || 0) + 1);
  const ballotsByChoice = Array.from(counts.entries())
    .map(([choice, count]) => ({ choice, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalEnrolled,
    totalPending,
    totalApproved,
    totalRejected,
    totalVoted,
    turnoutPercentage,
    ballotsByChoice,
    votersList: [...voters].reverse().map((v) => ({
      id: v.id,
      name: v.name,
      photo: v.photo,
      approval_status: v.approval_status || 'pending',
      has_voted: Boolean(v.has_voted),
      enrolled_at: v.enrolled_at,
      approved_at: v.approved_at || null,
    })),
    config: await getConfig(),
    candidates: await getCandidatesSorted(),
    threshold: await getThreshold(),
  };
}

async function computePublicResults(): Promise<any> {
  const config = await getConfig();
  const candidates = await getCandidatesSorted();
  const ballots = await localGetAll<any>('ballots');
  const voters = await getVoters();

  const counts = new Map<string, number>();
  for (const ballot of ballots) {
    const choice = String(ballot.choice || '').trim();
    counts.set(choice, (counts.get(choice) || 0) + 1);
  }

  let totalVotesCast = 0;
  const raw = candidates.map((cand) => {
    let votes = 0;
    for (const [choice, count] of counts.entries()) {
      if (choice.toLowerCase() === cand.name.toLowerCase()) votes += count;
    }
    totalVotesCast += votes;
    return { cand, votes };
  });
  const maxVotes = raw.reduce((m, r) => Math.max(m, r.votes), -1);

  return {
    title: config.title || DEFAULT_CONFIG.title,
    subtitle: config.subtitle || DEFAULT_CONFIG.subtitle,
    constituency: 'NA-127 (Lahore-XI)',
    pollingStation: 'Polling Station #42, Govt. Model High School',
    totalVotesCast,
    totalRegistered: voters.length,
    turnoutPercentage:
      voters.length > 0 ? Number(((totalVotesCast / voters.length) * 100).toFixed(1)) : 0,
    candidates: raw.map(({ cand, votes }) => ({
      id: cand.id,
      name: cand.name,
      party: cand.party,
      tagline: cand.tagline,
      sign_name: cand.sign_name,
      sign_icon: cand.sign_icon,
      photo_url: cand.photo_url,
      display_order: cand.display_order,
      votes,
      percentage: totalVotesCast > 0 ? Number(((votes / totalVotesCast) * 100).toFixed(1)) : 0,
      isLeading: votes === maxVotes && votes > 0,
      education: cand.education,
      profession: cand.profession,
      age: cand.age,
      hometown: cand.hometown,
      experience: cand.experience,
    })),
    lastUpdated: new Date().toISOString(),
  };
}
