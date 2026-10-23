// ============================================================
// Test voters for the expo demo (Device Mode).
//
// Six clearly-fake demo citizens. Their face embeddings are
// computed ON THIS DEVICE at first launch from the bundled
// portrait photos (public/sample-voters/) using the same
// face-api models as live enrollment — so a test voter can be
// checked in by holding their photo up to the camera, exactly
// like a real voter. CNIC numbers use 000000x serials: test
// data only, never real citizens.
// ============================================================

import { extractDescriptorFromImageSource } from './faceApi';
import { TEST_VOTER_PHOTOS } from './testVoterPhotos';
import { localAdd, localGetAll, localMetaGet, localMetaSet, localPut } from './localDb';
import { offlineStorage } from './offlineStorage';
import type { Voter } from '../types';

interface TestVoterDef {
  name: string;
  cnic: string;
  father_name: string;
  gender: 'Male' | 'Female';
  dob: string;
  photoFile: string;
  approval_status: 'approved' | 'pending';
  votedFor?: string; // candidate name this test voter has already voted for
}

export const TEST_VOTERS: TestVoterDef[] = [
  {
    name: 'Ahmed Raza (Test)',
    cnic: '35202-0000001-1',
    father_name: 'Muhammad Raza',
    gender: 'Male',
    dob: '1998-04-12',
    photoFile: TEST_VOTER_PHOTOS['voter-1'],
    approval_status: 'approved',
  },
  {
    name: 'Fatima Noor (Test)',
    cnic: '35202-0000002-2',
    father_name: 'Noor Muhammad',
    gender: 'Female',
    dob: '2000-09-03',
    photoFile: TEST_VOTER_PHOTOS['voter-2'],
    approval_status: 'approved',
  },
  {
    name: 'Bilal Hussain (Test)',
    cnic: '35202-0000003-3',
    father_name: 'Ghulam Hussain',
    gender: 'Male',
    dob: '1995-01-25',
    photoFile: TEST_VOTER_PHOTOS['voter-3'],
    approval_status: 'approved',
  },
  {
    name: 'Hassan Sheikh (Test)',
    cnic: '35202-0000004-4',
    father_name: 'Sheikh Rafique',
    gender: 'Male',
    dob: '1992-07-19',
    photoFile: TEST_VOTER_PHOTOS['voter-4'],
    approval_status: 'approved',
    votedFor: 'Mian Tariq Mehmood Sharif',
  },
  {
    name: 'Ayesha Siddiqui (Test)',
    cnic: '35202-0000005-5',
    father_name: 'Muhammad Siddique',
    gender: 'Female',
    dob: '2001-12-08',
    photoFile: TEST_VOTER_PHOTOS['voter-5'],
    approval_status: 'approved',
  },
  {
    name: 'Usman Tariq (Test)',
    cnic: '35202-0000006-6',
    father_name: 'Tariq Mehmood',
    gender: 'Male',
    dob: '1999-05-30',
    photoFile: TEST_VOTER_PHOTOS['voter-6'],
    approval_status: 'pending',
  },
];

let seedInFlight: Promise<{ seeded: number; skipped: number }> | null = null;

export function ensureTestVotersSeeded(): Promise<{ seeded: number; skipped: number }> {
  if (seedInFlight) return seedInFlight;
  seedInFlight = (async () => {
    try {
      const already = await localMetaGet('testVotersSeeded');
      if (already) return { seeded: 0, skipped: 0 };

      const existing = await localGetAll<any>('voters');
      const existingCnics = new Set(
        existing.map((v) => (v.cnic || '').replace(/\D/g, '')).filter(Boolean)
      );

      let seeded = 0;
      let skipped = 0;
      const seededVoters: Voter[] = [];

      for (const def of TEST_VOTERS) {
        if (existingCnics.has(def.cnic.replace(/\D/g, ''))) {
          skipped++;
          continue;
        }
        try {
          const result = await extractDescriptorFromImageSource(def.photoFile);
          if (!result.faceDetected || !Array.isArray(result.embedding) || result.embedding.length !== 128) {
            console.warn(`[TestVoters] No face detected in ${def.photoFile} — skipped ${def.name}`);
            skipped++;
            continue;
          }

          const now = new Date().toISOString();
          const voter: any = {
            name: def.name,
            cnic: def.cnic,
            father_name: def.father_name,
            gender: def.gender,
            dob: def.dob,
            province: 'Punjab',
            district: 'Lahore',
            constituency: 'NA-127 (Lahore-XI)',
            polling_station: 'Polling Station #42, Govt. Model High School',
            electoral_block_code: '042-127-001',
            family_tree_no: 'TEST-001',
            nadra_verified: false,
            embedding: result.embedding,
            photo: result.photo || def.photoFile,
            approval_status: def.approval_status,
            has_voted: false,
            enrolled_at: now,
            approved_at: def.approval_status === 'approved' ? now : null,
          };
          const id = await localAdd('voters', voter);
          voter.id = id;

          if (def.votedFor) {
            const castAt = new Date().toISOString();
            await localAdd('ballots', { choice: def.votedFor, cast_at: castAt });
            voter.has_voted = true;
            await localPut('voters', voter);
          }

          seededVoters.push(voter as Voter);
          seeded++;
        } catch (err) {
          console.warn(`[TestVoters] Failed to seed ${def.name}:`, err);
          skipped++;
        }
      }

      if (seeded > 0) {
        // Mirror into the offline cache so the home-screen counts and the
        // airplane-mode face match see the test voters immediately.
        const all = await localGetAll<any>('voters');
        offlineStorage.saveVotersLocally(all as Voter[]);
        await localMetaSet('testVotersSeeded', true);
      }
      return { seeded, skipped };
    } finally {
      seedInFlight = null;
    }
  })();
  return seedInFlight;
}

/** Clear the seeded flag so the test voters can be loaded again (e.g. after a full reset). */
export async function allowTestVoterReseed(): Promise<void> {
  await localMetaSet('testVotersSeeded', false);
}
