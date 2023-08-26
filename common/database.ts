// @ts-ignore ts-ignore-next-line
import { DB } from "https://deno.land/x/sqlite@v3.7.0/mod.ts";

class DatabaseService {
  static readonly SQL = {
    // Users
    INSERT_USER: "INSERT INTO users (name) VALUES (?) RETURNING *",
    SELECT_USER_BY_ID: "SELECT * FROM users WHERE id = ?",

    // Checkin Topics
    INSERT_CHECKIN_TOPIC:
      "INSERT INTO checkin_topics (user_id, topic_name) VALUES (?, ?) RETURNING *",
    SELECT_CHECKIN_TOPICS_BY_USER:
      "SELECT * FROM checkin_topics WHERE user_id = ?",

    // Daily Checkins
    INSERT_DAILY_CHECKIN: "INSERT INTO daily_checkins (topic_id) VALUES (?)",
    SELECT_DAILY_CHECKINS_BY_USER: `SELECT dc.id, ct.topic_name, dc.checkin_time 
                                   FROM daily_checkins dc JOIN checkin_topics ct 
                                   ON dc.topic_id = ct.id 
                                   WHERE ct.user_id = ?`,

    // Rules
    INSERT_RULE:
      "INSERT INTO rules (type, value, topic) VALUES (?, ?, ?) RETURNING *",
    SELECT_ALL_RULES: "SELECT * FROM rules",
    UPDATE_RULE: "UPDATE rules SET type = ?, value = ?, topic = ? WHERE id = ?",
    DELETE_RULE: "DELETE FROM rules WHERE id = ?",

    // Notifications
    SELECT_PENDING_NOTIFICATIONS: "SELECT * FROM pending_notifications",
    INSERT_PENDING_NOTIFICATION: `INSERT INTO pending_notifications (type, value, sent, ack)
                                  VALUES (?, ?, ?, ?) RETURNING *`,
    UPDATE_PENDING_NOTIFICATION:
      "UPDATE pending_notifications SET sent = ?, ack = ? WHERE id = ?",
    DELETE_PENDING_NOTIFICATION:
      "DELETE FROM pending_notifications WHERE id = ?",
  };

  db: any;

  constructor() {
    // Open a database to be held in memory (or change to file.db for file-based database)
    // const db = new DB(":memory:");
    const db = new DB("tmp.db");

    // Initialize the database tables
    db.transaction(() => {
      db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
      )`);

      db.execute(`
      CREATE TABLE IF NOT EXISTS checkin_topics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        topic_name TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      db.execute(`
      CREATE TABLE IF NOT EXISTS daily_checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic_id INTEGER,
        checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(topic_id) REFERENCES checkin_topics(id)
      )`);

      db.execute(`
      CREATE TABLE IF NOT EXISTS rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        value TEXT,
        topic TEXT
      )`);

      db.execute(`
      CREATE TABLE IF NOT EXISTS pending_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        value TEXT,
        sent BOOLEAN DEFAULT 0,
        ack BOOLEAN DEFAULT 0
      )`);
    });

    this.db = db;
  }

  query(sql: string, params?: any[]) {
    return this.db.query(sql, params);
  }
}

export default DatabaseService;
