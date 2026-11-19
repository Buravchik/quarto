import fs from "node:fs";
import path from "node:path";
import dns from "node:dns";
import pg from "pg";

dns.setDefaultResultOrder("verbatim");

function loadEnv() {
  const raw = fs.readFileSync(path.resolve(".env"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i);
    const v = line.slice(i + 1);
    if (!process.env[k]) process.env[k] = v;
  }
}

async function main() {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const sql = fs.readFileSync(path.resolve("db/migrations/0001_init.sql"), "utf8");

  // Prefer direct host; Windows/Node sometimes fails IPv6-only db.* hosts — try resolved address.
  const u = new URL(url);
  let host = u.hostname;
  try {
    const v6 = await dns.promises.resolve6(host);
    if (v6[0]) {
      console.log("using IPv6", v6[0]);
      const client = new pg.Client({
        host: v6[0],
        port: Number(u.port || 5432),
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: u.pathname.replace(/^\//, "") || "postgres",
        ssl: { rejectUnauthorized: false },
      });
      await client.connect();
      await client.query(sql);
      const tables = await client.query(
        "select table_name from information_schema.tables where table_schema='public' order by 1",
      );
      console.log(
        "tables:",
        tables.rows.map((r) => r.table_name).join(", "),
      );
      await client.end();
      return;
    }
  } catch (err) {
    console.log("IPv6 path failed, falling back to connectionString", String(err));
  }

  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(sql);
  const tables = await client.query(
    "select table_name from information_schema.tables where table_schema='public' order by 1",
  );
  console.log(
    "tables:",
    tables.rows.map((r) => r.table_name).join(", "),
  );
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
