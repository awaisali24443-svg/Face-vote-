async function run() {
  const res = await fetch('http://localhost:3000/api/voters');
  console.log(res.status, await res.text());
}
run();
