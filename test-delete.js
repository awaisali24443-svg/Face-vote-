async function run() {
  const res = await fetch('http://localhost:3000/api/admin/voters/1', { method: 'DELETE' });
  console.log(res.status, await res.text());
}
run();
