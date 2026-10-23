// Client-side Offline Storage and Biometric Matching Engine
import { Voter, Candidate, PublicElectionResults } from '../types';
import { adminHeaders } from './adminAuth';

const VOTERS_STORAGE_KEY = 'facevote_local_voters_v2';
const CANDIDATES_STORAGE_KEY = 'facevote_local_candidates_v2';
const OFFLINE_VOTES_KEY = 'facevote_pending_offline_votes_v2';
const RESULTS_STORAGE_KEY = 'facevote_local_results_v1';
const LAST_SYNC_KEY = 'facevote_last_sync_timestamp';

export interface OfflinePreparationResult {
  candidates: number;
  voters: number;
  registryAuthorized: boolean;
}

export interface OfflineVoteRecord {
  id: string;
  voterId: number;
  candidateName: string;
  timestamp: string;
  synced: boolean;
}

/**
 * Calculates Cosine Similarity between two 128-D biometric float vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculates Euclidean Distance between two 128-D biometric vectors.
 */
export function euclideanDistance(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 999;
  }
  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    const d = vecA[i] - vecB[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

class OfflineStorageService {
  /**
   * Caches voters locally in browser storage.
   */
  public saveVotersLocally(voters: Voter[]): void {
    try {
      localStorage.setItem(VOTERS_STORAGE_KEY, JSON.stringify(voters));
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (err) {
      console.warn('Could not save voters to localStorage:', err);
    }
  }

  /**
   * Retrieves all cached voters.
   */
  public getLocalVoters(): Voter[] {
    try {
      const data = localStorage.getItem(VOTERS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.warn('Error reading local voters:', err);
    }
    return [];
  }

  /**
   * Adds or updates a single voter in local storage (e.g. upon new enrollment).
   */
  public saveEnrolledVoterLocally(voter: Voter): void {
    try {
      const voters = this.getLocalVoters();
      const idx = voters.findIndex((v) => v.id === voter.id || (voter.cnic && v.cnic === voter.cnic));
      if (idx >= 0) {
        voters[idx] = { ...voters[idx], ...voter };
      } else {
        voters.unshift(voter);
      }
      this.saveVotersLocally(voters);
    } catch (err) {
      console.warn('Error saving enrolled voter locally:', err);
    }
  }

  /**
   * Performs strictly mathematical 128-D Biometric Matching against locally cached voters.
   * NEVER falls back to a random person or first voter.
   * If similarity is below threshold, returns match: false.
   */
  public matchLocalVoter(
    probeEmbedding: number[],
    threshold = 0.78
  ): { match: boolean; voter: Voter | null; similarity: number; distance: number; reason?: string } {
    const voters = this.getLocalVoters();

    if (!Array.isArray(probeEmbedding) || probeEmbedding.length !== 128) {
      return { match: false, voter: null, similarity: 0, distance: 999, reason: 'invalid_embedding' };
    }

    if (voters.length === 0) {
      return { match: false, voter: null, similarity: 0, distance: 999, reason: 'no_voters_cached' };
    }

    let bestVoter: Voter | null = null;
    let maxSimilarity = -1;
    let secondSimilarity = -1;
    let minDistance = 999;

    for (const voter of voters) {
      if (!voter.embedding || !Array.isArray(voter.embedding) || voter.embedding.length !== 128) {
        continue;
      }

      const sim = cosineSimilarity(probeEmbedding, voter.embedding);
      const dist = euclideanDistance(probeEmbedding, voter.embedding);

      if (sim > maxSimilarity) {
        secondSimilarity = maxSimilarity;
        maxSimilarity = sim;
        minDistance = dist;
        bestVoter = voter;
      } else if (sim > secondSimilarity) {
        secondSimilarity = sim;
      }
    }

    // Ambiguity guard: another enrolled voter is almost as similar — the
    // identification is not trustworthy enough to hand out a ballot.
    if (
      bestVoter !== null &&
      maxSimilarity >= threshold &&
      secondSimilarity >= threshold &&
      maxSimilarity - secondSimilarity < 0.03
    ) {
      return {
        match: false,
        voter: null,
        similarity: Number(maxSimilarity.toFixed(4)),
        distance: Number(minDistance.toFixed(4)),
        reason: 'ambiguous_match',
      };
    }

    // Strict biometric verification: must meet threshold (default 0.78 cosine / <= 0.60 euclidean)
    const isStrictMatch = bestVoter !== null && maxSimilarity >= threshold;

    if (isStrictMatch && bestVoter) {
      return {
        match: true,
        voter: bestVoter,
        similarity: Number(maxSimilarity.toFixed(4)),
        distance: Number(minDistance.toFixed(4)),
      };
    }

    return {
      match: false,
      voter: null,
      similarity: Number(Math.max(0, maxSimilarity).toFixed(4)),
      distance: Number(minDistance.toFixed(4)),
      reason: 'not_registered',
    };
  }

  /**
   * Caches candidates locally.
   */
  public saveCandidatesLocally(candidates: Candidate[]): void {
    try {
      localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify(candidates));
    } catch (err) {
      console.warn('Could not save candidates to localStorage:', err);
    }
  }

  /**
   * Retrieves cached candidates.
   */
  public getLocalCandidates(): Candidate[] {
    try {
      const data = localStorage.getItem(CANDIDATES_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.warn('Error reading local candidates:', err);
    }
    return [];
  }

  /**
   * Saves the last public results response so the Results screen can still
   * open offline. The UI labels this as a saved copy, never as a live feed.
   */
  public saveResultsLocally(results: PublicElectionResults): void {
    try {
      localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(results));
    } catch (err) {
      console.warn('Could not save results to localStorage:', err);
    }
  }

  public getLocalResults(): PublicElectionResults | null {
    try {
      const data = localStorage.getItem(RESULTS_STORAGE_KEY);
      return data ? (JSON.parse(data) as PublicElectionResults) : null;
    } catch (err) {
      console.warn('Error reading local results:', err);
      return null;
    }
  }

  public getLastSyncTime(): string | null {
    try {
      return localStorage.getItem(LAST_SYNC_KEY);
    } catch {
      return null;
    }
  }

  /**
   * One-tap device preparation while online:
   * - downloads and saves the ballot/candidate list for every user;
   * - downloads the voter registry ONLY when this browser already has an
   *   officer PIN session, because biometric records must not become public
   *   just to make the app work offline.
   * Face models and app files are handled by the service worker / model
   * loader, not localStorage.
   */
  public async prepareOfflineData(): Promise<OfflinePreparationResult> {
    let candidates = this.getLocalCandidates().length;
    let voters = this.getLocalVoters().length;
    let registryAuthorized = false;

    const [candidatesResult, votersResult] = await Promise.allSettled([
      fetch('/api/candidates'),
      fetch('/api/voters', { headers: { ...adminHeaders() } }),
    ]);

    if (candidatesResult.status === 'fulfilled' && candidatesResult.value.ok) {
      const data = await candidatesResult.value.json().catch(() => null);
      const list = Array.isArray(data) ? data : data?.candidates;
      if (Array.isArray(list)) {
        this.saveCandidatesLocally(list);
        candidates = list.length;
      }
    }

    if (votersResult.status === 'fulfilled') {
      registryAuthorized = votersResult.value.ok;
      if (votersResult.value.ok) {
        const data = await votersResult.value.json().catch(() => null);
        const list = Array.isArray(data) ? data : data?.voters;
        if (Array.isArray(list)) {
          this.saveVotersLocally(list);
          voters = list.length;
        }
      }
    }

    if (candidates > 0 || voters > 0) {
      try {
        localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      } catch {}
    }

    return { candidates, voters, registryAuthorized };
  }

  /**
   * Marks a voter as has_voted = true in local storage immediately.
   */
  public markVoterAsVotedLocally(voterId: number): void {
    try {
      const voters = this.getLocalVoters();
      const voter = voters.find((v) => v.id === voterId);
      if (voter) {
        voter.has_voted = true;
        this.saveVotersLocally(voters);
      }
    } catch (err) {
      console.warn('Error marking voter as voted locally:', err);
    }
  }

  /**
   * Records an offline ballot securely in local storage audit ledger.
   */
  public recordOfflineVote(voterId: number, candidateName: string): OfflineVoteRecord {
    const newVote: OfflineVoteRecord = {
      id: 'offline-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      voterId,
      candidateName,
      timestamp: new Date().toISOString(),
      synced: false,
    };

    try {
      const votes = this.getPendingOfflineVotes();
      const existing = votes.find((v) => v.voterId === voterId);
      if (existing) {
        return existing; // one pending offline vote per voter — no duplicates
      }
      votes.push(newVote);
      localStorage.setItem(OFFLINE_VOTES_KEY, JSON.stringify(votes));
      this.markVoterAsVotedLocally(voterId);
    } catch (err) {
      console.warn('Error recording offline vote:', err);
    }

    return newVote;
  }

  /**
   * Gets pending unsynced offline votes.
   */
  public getPendingOfflineVotes(): OfflineVoteRecord[] {
    try {
      const data = localStorage.getItem(OFFLINE_VOTES_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.warn('Error reading offline votes:', err);
    }
    return [];
  }

  /**
   * Synchronizes pending offline votes to the backend server.
   */
  public async syncPendingVotesToServer(): Promise<{ syncedCount: number; errors: number }> {
    const pending = this.getPendingOfflineVotes();
    if (pending.length === 0) {
      return { syncedCount: 0, errors: 0 };
    }

    let syncedCount = 0;
    let errors = 0;
    const remainingVotes: OfflineVoteRecord[] = [];

    for (const vote of pending) {
      try {
        const res = await fetch('/api/ballots/cast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voterId: vote.voterId,
            candidateName: vote.candidateName,
          }),
        });

        if (res.ok) {
          syncedCount++;
        } else {
          // Any server rejection (already voted, missing ballot token,
          // not approved) keeps the vote in the pending queue and counts
          // as an error for officer review — it is never silently dropped.
          errors++;
          remainingVotes.push(vote);
        }
      } catch {
        errors++;
        remainingVotes.push(vote);
      }
    }

    try {
      localStorage.setItem(OFFLINE_VOTES_KEY, JSON.stringify(remainingVotes));
    } catch {}

    return { syncedCount, errors };
  }

  /**
   * Syncs latest voters & candidates from server to local storage cache.
   */
  public async syncRegistryFromServer(): Promise<boolean> {
    try {
      const [votersRes, candidatesRes] = await Promise.all([
        fetch('/api/voters', { headers: { ...adminHeaders() } }),
        fetch('/api/candidates'),
      ]);

      if (votersRes.ok) {
        const vData = await votersRes.json();
        const votersList = vData.voters || (Array.isArray(vData) ? vData : []);
        if (Array.isArray(votersList) && votersList.length > 0) {
          this.saveVotersLocally(votersList);
        }
      }

      if (candidatesRes.ok) {
        const cData = await candidatesRes.json();
        const candList = cData.candidates || (Array.isArray(cData) ? cData : []);
        if (Array.isArray(candList) && candList.length > 0) {
          this.saveCandidatesLocally(candList);
        }
      }

      // Also sync any pending offline votes
      await this.syncPendingVotesToServer();
      return votersRes.ok; // honest status: false when the registry could not be fetched
    } catch {
      return false;
    }
  }
}

export const offlineStorage = new OfflineStorageService();
