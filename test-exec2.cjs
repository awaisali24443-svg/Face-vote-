const initSqlJs = require('sql.js');
async function run() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run("CREATE TABLE t (id INTEGER)");
  db.run("INSERT INTO t VALUES (1), (2)");
  
  const res2 = db.exec("SELECT id FROM t WHERE id = ?", [2]);
  console.log(JSON.stringify(res2));
}
run();
