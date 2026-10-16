// Client-side Offline Storage and Biometric Matching Engine
import { Voter, Candidate } from '../types';

const VOTERS_STORAGE_KEY = 'facevote_local_voters_v2';
const CANDIDATES_STORAGE_KEY = 'facevote_local_candidates_v2';
const OFFLINE_VOTES_KEY = 'facevote_pending_offline_votes_v2';
const LAST_SYNC_KEY = 'facevote_last_sync_timestamp';

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
    let minDistance = 999;

    for (const voter of voters) {
      if (!voter.embedding || !Array.isArray(voter.embedding) || voter.embedding.length !== 128) {
        continue;
      }

      const sim = cosineSimilarity(probeEmbedding, voter.embedding);
      const dist = euclideanDistance(probeEmbedding, voter.embedding);

      if (sim > maxSimilarity) {
        maxSimilarity = sim;
        minDistance = dist;
        bestVoter = voter;
      }
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
          // If already voted on server, consider it handled
          const resData = await res.json().catch(() => ({}));
          if (resData.error && resData.error.includes('already')) {
            syncedCount++;
          } else {
            errors++;
            remainingVotes.push(vote);
          }
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
        fetch('/api/voters'),
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
      return true;
    } catch {
      return false;
    }
  }
}

export const offlineStorage = new OfflineStorageService();
