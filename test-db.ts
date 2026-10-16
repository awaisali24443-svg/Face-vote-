import { deleteVoter, getAllVoters } from './server/db.js';
async function run() {
  const voters = await getAllVoters();
  console.log("Voters:", voters.map(v => v.id));
  try {
    await deleteVoter(1);
    console.log("Deleted 1");
  } catch(e) {
    console.error("Error deleting 1:", e.message);
  }
}
run();
