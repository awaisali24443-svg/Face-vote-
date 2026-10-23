import express, { type Request, type Response } from 'express';
import crypto from 'crypto';
import {
  enrollVoter,
  findClosestVoter,
  matchVoterByImageOrEmbedding,
  castBallot,
  getAdminStats,
  resetDemo,
  getAllVoters,
  approveVoter,
  deleteVoter,
  bulkApprovePending,
  getCandidates,
  saveCandidate,
  deleteCandidate,
  reorderCandidates,
  getElectionConfig,
  updateElectionConfig,
  getPublicResults,
} from './db.ts';
import { extractCandidateFromImage, extractCNICFromImage } from './geminiService.ts';

const router = express.Router();

// Expose matching threshold as an easy-to-tune parameter calibrated for face-api 128-D normalized vectors
let matchingThreshold = 0.82;

router.use(express.json({ limit: '15mb' }));

// ============================================================
// ADMIN AUTHORIZATION — the officer PIN is verified on the SERVER
// against the election config. The PIN is never sent back in any
// API response. Clients send it as the `x-admin-pin` header.
// ============================================================
async function isAdminPinValid(pin: string): Promise<boolean> {
  try {
    if (!pin) return false;
    const config = await getElectionConfig();
    const expected = Buffer.from(config.adminPin || '');
    const given = Buffer.from(pin);
    if (expected.length === 0 || expected.length !== given.length) return false;
    return crypto.timingSafeEqual(given, expected);
  } catch {
    return false;
  }
}

async function requireAdmin(req: Request, res: Response, next: () => void) {
  if (await isAdminPinValid(req.header('x-admin-pin') || '')) {
    next();
    return;
  }
  res.status(401).json({
    error: 'Admin authorization required: officer PIN missing or invalid',
  });
}

// Verify an officer PIN (used by the Admin lock screen). Returns no config data.
router.post('/admin/verify', async (req: Request, res: Response) => {
  const pin = typeof req.body?.pin === 'string' ? req.body.pin.trim() : '';
  if (!(await isAdminPinValid(pin))) {
    res.status(401).json({ error: 'Invalid officer PIN' });
    return;
  }
  res.json({ success: true });
});

// Every /admin/* route registered after this line requires the officer PIN.
router.use('/admin', requireAdmin);

// ============================================================
// ONE-TIME BALLOT TOKENS — a successful biometric match issues a
// single-use token bound to that voter (5-minute validity).
// Casting a ballot requires presenting it: a bare voterId is no
// longer enough to vote as someone else.
// ============================================================
const ballotTokens = new Map<string, { voterId: number; expires: number }>();

function issueBallotToken(voterId: number): string {
  const token = crypto.randomBytes(32).toString('hex');
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

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * Real AI OCR CNIC Extraction from scanned photo/card image
 */
router.post('/cnic/extract', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({ error: 'imageBase64 string is required' });
      return;
    }

    const extracted = await extractCNICFromImage(imageBase64, mimeType || 'image/jpeg');
    res.json({
      success: true,
      data: extracted,
    });
  } catch (err: any) {
    console.error('CNIC extraction error:', err);
    res.status(500).json({ error: err.message || 'Failed to extract CNIC data' });
  }
});

// Config & Threshold API
router.get('/config', async (_req: Request, res: Response) => {
  try {
    const electionConfig = await getElectionConfig();
    const { adminPin: _adminPin, ...publicConfig } = electionConfig;
    res.json({
      threshold: matchingThreshold,
      ...publicConfig,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch config' });
  }
});

// Update threshold
router.post('/admin/threshold', (req: Request, res: Response) => {
  const { threshold } = req.body;
  if (typeof threshold !== 'number' || threshold < 0.1 || threshold > 0.99) {
    res.status(400).json({ error: 'Threshold must be a number between 0.1 and 0.99' });
    return;
  }
  matchingThreshold = Number(threshold.toFixed(2));
  res.json({ success: true, threshold: matchingThreshold });
});

// Update election settings (title, ballot lock, auto-approve, pin)
router.post('/admin/config', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const updates: Record<string, unknown> = {};
    if (typeof body.title === 'string') updates.title = body.title;
    if (typeof body.subtitle === 'string') updates.subtitle = body.subtitle;
    if (typeof body.isBallotLocked === 'boolean') updates.isBallotLocked = body.isBallotLocked;
    if (typeof body.autoApprove === 'boolean') updates.autoApprove = body.autoApprove;
    if (typeof body.adminPin === 'string' && body.adminPin.trim().length >= 4) {
      updates.adminPin = body.adminPin;
    }
    const updated = await updateElectionConfig(updates as any);
    const { adminPin: _pin, ...safeConfig } = updated;
    res.json({ success: true, config: safeConfig });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update election config' });
  }
});

// ============================================================
// CANDIDATES & BALLOT PAPER API
// ============================================================
router.get('/candidates', async (_req: Request, res: Response) => {
  try {
    const candidates = await getCandidates();
    res.json({ candidates });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load candidates' });
  }
});

router.post('/admin/candidates', async (req: Request, res: Response) => {
  try {
    const { id, name, party, tagline, sign_name, sign_icon, photo_url, display_order, education, profession, age, hometown, experience } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Candidate name is required' });
      return;
    }

    if (!sign_name || typeof sign_name !== 'string' || !sign_name.trim()) {
      res.status(400).json({ error: 'Electoral symbol/sign name is required' });
      return;
    }

    const candidateId = id || `cand-${Date.now()}`;
    const saved = await saveCandidate({
      id: candidateId,
      name: name.trim(),
      party: (party || 'Independent').trim(),
      tagline: (tagline || '').trim(),
      sign_name: sign_name.trim(),
      sign_icon: sign_icon || 'scale',
      photo_url: photo_url || '',
      display_order: Number(display_order || 0),
      education: typeof education === 'string' && education.trim() ? education.trim() : undefined,
      profession: typeof profession === 'string' && profession.trim() ? profession.trim() : undefined,
      age: typeof age === 'number' && age >= 18 && age <= 120 ? age : undefined,
      hometown: typeof hometown === 'string' && hometown.trim() ? hometown.trim() : undefined,
      experience: typeof experience === 'string' && experience.trim() ? experience.trim() : undefined,
    });

    res.json({ success: true, candidate: saved });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to save candidate' });
  }
});

router.delete('/admin/candidates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteCandidate(id);
    res.json({ success: true, deletedId: id });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete candidate' });
  }
});

router.post('/admin/candidates/reorder', async (req: Request, res: Response) => {
  try {
    const { candidateIds } = req.body;
    if (!Array.isArray(candidateIds)) {
      res.status(400).json({ error: 'candidateIds array required' });
      return;
    }
    await reorderCandidates(candidateIds);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to reorder candidates' });
  }
});

/**
 * AI Candidate Extraction from Image / Poster / Campaign Flyer
 */
router.post('/admin/candidates/extract-from-image', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({ error: 'imageBase64 string is required' });
      return;
    }

    const extracted = await extractCandidateFromImage(imageBase64, mimeType || 'image/jpeg');
    res.json({
      success: true,
      candidate: extracted,
    });
  } catch (err: any) {
    console.error('Candidate image extraction failed:', err);
    res.status(500).json({ error: err.message || 'Failed to extract candidate from image' });
  }
});

// ============================================================
// VOTER ENROLLMENT & APPROVAL DESK API
// ============================================================
router.post('/voters/enroll', requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      name,
      cnic,
      father_name,
      gender,
      dob,
      province,
      district,
      constituency,
      polling_station,
      electoral_block_code,
      family_tree_no,
      nadra_verified,
      photo,
      embedding,
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Voter name is required' });
      return;
    }

    // If a biometric embedding is supplied it must be a real 128-D vector of
    // finite numbers (an empty array is allowed only for CNIC-first records,
    // which then cannot face-match or vote until a face is enrolled).
    if (
      embedding !== undefined &&
      (!Array.isArray(embedding) ||
        (embedding.length > 0 &&
          (embedding.length !== 128 ||
            !embedding.every((v: unknown) => typeof v === 'number' && Number.isFinite(v)))))
    ) {
      res.status(400).json({ error: 'Biometric embedding must be exactly 128 finite numbers' });
      return;
    }

    // If CNIC is supplied, check for duplicate CNIC registration to prevent corruption
    if (cnic && typeof cnic === 'string' && cnic.trim().length > 0) {
      const all = await getAllVoters();
      const existingCnic = all.find(
        (v) => v.cnic && v.cnic.replace(/\D/g, '') === cnic.replace(/\D/g, '')
      );
      if (existingCnic) {
        res.status(409).json({
          error: `CNIC ${cnic} is already registered under "${existingCnic.name}" (ID #${existingCnic.id}). Duplicate registration blocked.`,
          existingVoter: {
            id: existingCnic.id,
            name: existingCnic.name,
            photo: existingCnic.photo,
          },
          similarity: 1.0,
          canOverride: false,
        });
        return;
      }
    }

    // Optional facial vector duplicate check if provided
    if (Array.isArray(embedding) && embedding.length > 0) {
      const DUPLICATE_THRESHOLD = 0.94;
      const existingMatch = await findClosestVoter(embedding, DUPLICATE_THRESHOLD);
      if (existingMatch.match && existingMatch.voter) {
        res.status(409).json({
          error: `Facial signature is ${(existingMatch.similarity * 100).toFixed(1)}% similar to an already registered voter: "${existingMatch.voter.name}" (ID #${existingMatch.voter.id}).`,
          existingVoter: {
            id: existingMatch.voter.id,
            name: existingMatch.voter.name,
            photo: existingMatch.voter.photo,
          },
          similarity: Number(existingMatch.similarity.toFixed(4)),
          distance: Number(existingMatch.distance.toFixed(4)),
          canOverride: false,
        });
        return;
      }
    }

    const voter = await enrollVoter(name, embedding || [], photo, cnic, {
      father_name,
      gender,
      dob,
      province,
      district,
      constituency,
      polling_station,
      electoral_block_code,
      family_tree_no,
      nadra_verified: nadra_verified === true,
    });

    res.status(201).json({
      success: true,
      voter: {
        id: voter.id,
        name: voter.name,
        cnic: voter.cnic,
        father_name: voter.father_name,
        gender: voter.gender,
        dob: voter.dob,
        province: voter.province,
        district: voter.district,
        constituency: voter.constituency,
        polling_station: voter.polling_station,
        electoral_block_code: voter.electoral_block_code,
        family_tree_no: voter.family_tree_no,
        nadra_verified: voter.nadra_verified,
        photo: voter.photo,
        approval_status: voter.approval_status,
        has_voted: voter.has_voted,
        enrolled_at: voter.enrolled_at,
        approved_at: voter.approved_at,
      },
    });
  } catch (err: any) {
    console.error('Enrollment error:', err);
    res.status(500).json({ error: err.message || 'Internal server error during enrollment' });
  }
});

// Direct Voter Deletion & Listing (convenient from Enrollment Station)
router.delete('/voters/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await deleteVoter(id);
    res.json({ success: true, deletedId: id });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete voter' });
  }
});

router.get('/voters', requireAdmin, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const voters = await getAllVoters(status);
    res.json({ voters });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch voters list' });
  }
});

// Admin Voter Approval Actions
router.post('/admin/voters/:id/approve', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body; // 'approved' | 'rejected' | 'pending'
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      res.status(400).json({ error: "status must be 'approved', 'rejected', or 'pending'" });
      return;
    }

    const updated = await approveVoter(id, status);
    res.json({ success: true, voter: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update voter approval status' });
  }
});

router.post('/admin/voters/bulk-approve', async (_req: Request, res: Response) => {
  try {
    await bulkApprovePending();
    res.json({ success: true, message: 'All pending voters have been approved' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to bulk approve voters' });
  }
});

router.delete('/admin/voters/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await deleteVoter(id);
    res.json({ success: true, deletedId: id });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete voter' });
  }
});

router.get('/admin/voters', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const voters = await getAllVoters(status);
    res.json({ voters });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch voters list' });
  }
});

// ============================================================
// CHECK-IN BIOMETRIC MATCHING API
// ============================================================
const handleBiometricMatch = async (req: Request, res: Response) => {
  try {
    const rawEmbedding =
      req.body.embedding ||
      req.body.descriptor?.embedding ||
      (Array.isArray(req.body.descriptor) ? req.body.descriptor : undefined);

    const { image } = req.body;

    if (!image && (!Array.isArray(rawEmbedding) || rawEmbedding.length === 0)) {
      res.status(400).json({
        error: 'Live facial sensor feed snapshot or biometric signature is required for verification.',
      });
      return;
    }

    // The threshold is set by the election officer only. A caller-supplied
    // threshold is ignored — otherwise anyone could lower it to ~0 and match any face.
    const threshold = matchingThreshold;
    const result = await matchVoterByImageOrEmbedding(image, rawEmbedding, threshold);

    if (!result.match || !result.voter) {
      res.json({
        match: false,
        reason: 'not_registered',
        similarity: Number((result.similarity || 0).toFixed(4)),
        threshold,
      });
      return;
    }

    res.json({
      match: true,
      voter: {
        id: result.voter.id,
        name: result.voter.name,
        photo: result.voter.photo,
        approval_status: result.voter.approval_status,
        has_voted: result.voter.has_voted,
        enrolled_at: result.voter.enrolled_at,
        approved_at: result.voter.approved_at,
      },
      similarity: Number(result.similarity.toFixed(4)),
      threshold,
      // Single-use ballot token — only for approved voters who have not voted.
      ballotToken:
        result.voter.approval_status === 'approved' && !result.voter.has_voted
          ? issueBallotToken(result.voter.id)
          : undefined,
    });
  } catch (err: any) {
    console.error('Matching error:', err);
    res.status(500).json({ error: err.message || 'Internal server error during face match' });
  }
};

router.post('/voters/match', handleBiometricMatch);
router.post('/match', handleBiometricMatch);

// ============================================================
// CAST BALLOT API (Supports both /ballots/vote and /ballots/cast)
// ============================================================
const handleVoteSubmission = async (req: Request, res: Response) => {
  try {
    const { voterId, choice, candidateName, ballotToken } = req.body;
    const rawChoice = choice || candidateName || '';
    const finalChoice = typeof rawChoice === 'string' ? rawChoice.trim() : '';

    if (!voterId) {
      res.status(400).json({ error: 'voterId is required' });
      return;
    }

    if (!finalChoice || finalChoice.length === 0) {
      res.status(400).json({ error: 'Valid candidate or ballot choice is required' });
      return;
    }

    // A ballot can only be cast with the single-use token issued by a
    // successful biometric check-in for this exact voter.
    if (typeof ballotToken !== 'string' || !consumeBallotToken(ballotToken, Number(voterId))) {
      res.status(401).json({
        error: 'A valid one-time ballot token from biometric check-in is required to cast a vote',
      });
      return;
    }

    const ballot = await castBallot(Number(voterId), finalChoice);

    res.json({
      success: true,
      message: 'Ballot recorded anonymously. The receipt hash is a SHA-256 hash of the ballot record.',
      receiptHash: ballot.receipt_hash,
      ballot: {
        id: ballot.id,
        choice: ballot.choice,
        cast_at: ballot.cast_at,
      },
    });
  } catch (err: any) {
    console.error('Voting error:', err);
    let status = 400;
    if (err.message?.includes('already voted')) status = 403;
    if (err.message?.includes('pending')) status = 403;
    if (err.message?.includes('rejected')) status = 403;
    res.status(status).json({ error: err.message || 'Failed to record vote' });
  }
};

router.post('/ballots/vote', handleVoteSubmission);
router.post('/ballots/cast', handleVoteSubmission);

// ============================================================
// ADMIN TELEMETRY & STATISTICS API
// ============================================================
router.get('/admin/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getAdminStats();
    const { adminPin: _pin, ...safeStatsConfig } = stats.config;
    res.json({
      ...stats,
      config: safeStatsConfig,
      threshold: matchingThreshold,
    });
  } catch (err: any) {
    console.error('Stats error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch admin stats' });
  }
});

// Admin reset endpoint
router.post('/admin/reset', async (req: Request, res: Response) => {
  try {
    const clearAll = req.body?.clearAll === true;
    await resetDemo(clearAll);
    res.json({
      success: true,
      message: clearAll
        ? 'All voter and ballot data wiped clean.'
        : 'Ballots cleared and voter statuses reset to not-voted.',
    });
  } catch (err: any) {
    console.error('Reset error:', err);
    res.status(500).json({ error: err.message || 'Failed to reset demo data' });
  }
});

// ============================================================
// PUBLIC ELECTION RESULTS (BALLOT PAPER LIVE SCREEN)
// Strictly Read-Only for Public Integrity & Anti-Tampering
// ============================================================
router.get('/public/results', async (_req: Request, res: Response) => {
  try {
    const results = await getPublicResults();
    res.json(results);
  } catch (err: any) {
    console.error('Public results error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch public election results' });
  }
});

export default router;
