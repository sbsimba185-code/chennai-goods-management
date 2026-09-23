import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dataDirectory = path.join(
  process.cwd(),
  "data"
);

const databasePath = path.join(
  dataDirectory,
  "delivery.db"
);

// Create data folder if it does not exist.
if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, {
    recursive: true
  });
}

// Open SQLite database.
const db = new Database(
  databasePath
);

// Enable SQLite features.
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Load and create database tables.
const schemaPath = path.join(
  process.cwd(),
  "lib",
  "schema.sql"
);

const schema = fs.readFileSync(
  schemaPath,
  "utf8"
);

db.exec(schema);

export default db;
