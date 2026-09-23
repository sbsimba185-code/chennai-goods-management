import Database from "better-sqlite3";
import path from "path";

const databasePath = path.join(process.cwd(), "data", "delivery.db");

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export default db;
