import { getCandidates } from './server/db.js';
async function run() {
  const cands = await getCandidates();
  console.log(JSON.stringify(cands, null, 2));
}
run();
