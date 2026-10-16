const initSqlJs = require('sql.js');
async function run() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run("CREATE TABLE t (id INTEGER)");
  db.run("INSERT INTO t VALUES (1)");
  
  const res1 = db.exec("SELECT id FROM t WHERE id = 1");
  console.log("res1", res1);
  
  try {
    const res2 = db.exec("SELECT id FROM t WHERE id = ?", [1]);
    console.log("res2", res2);
  } catch(e) {
    console.error("error", e.message);
  }
}
run();
