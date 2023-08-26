// @ts-nocheck

// @ts-ignore
import express, { NextFunction, Request, Response } from "npm:express@4.18.2";
import PushService from "../common/push.ts";
import NotificationService from "../common/notifications.ts";
import DatabaseService from "../common/database.ts";

// @ts-ignore-next-line
import { CronJob } from "npm:cron@2.4.1";
// @ts-ignore-next-line
import { config } from "npm:dotenv@8.2.0";

config();

// @ts-ignore-next-line
const subscription = JSON.parse(Deno.env.get("PUSH_SUBSCRIPTION") || "{}");

const pushService = new PushService((e) => {
  /* unused */
});
const notificationService = new NotificationService(pushService, subscription);
const dbService = new DatabaseService();

const job = new CronJob(
  "* * * * *",
  function () {
    console.log("Job started", new Date());

    const checkins = dbService
      .query(DatabaseService.SQL.SELECT_DAILY_CHECKINS_BY_USER, [1])
      .map((row: any) => ({
        id: row[0],
        topic_id: row[1],
        checkin_time: row[2],
      }));

    const rules = dbService
      .query(DatabaseService.SQL.SELECT_ALL_RULES)
      .map((row: any) => ({
        id: row[0],
        type: row[1],
        value: row[2],
        topic: row[3],
      }));

    const pending = dbService
      .query(DatabaseService.SQL.SELECT_PENDING_NOTIFICATIONS)
      .map((row: any) => ({
        id: row[0],
        type: row[1],
        value: row[2],
        sent: row[3],
        ack: row[4],
      }));

    console.log(checkins, rules, pending);
    const updatedPending = notificationService.checkAndNotify(
      checkins,
      rules,
      pending
    );

    // update pending notifications
    updatedPending.forEach((notification) => {
      // if no id, insert
      if (!notification.id) {
        const inserted = dbService.query(
          DatabaseService.SQL.INSERT_PENDING_NOTIFICATION,
          [
            notification.type,
            notification.value,
            notification.sent,
            notification.ack,
          ]
        );
        notification.id = inserted.id;
      } else {
        dbService.query(DatabaseService.SQL.UPDATE_PENDING_NOTIFICATION, [
          notification.sent,
          notification.ack,
          notification.id,
        ]);
      }
      console.log("Updated notification", notification);
    });

    this.onComplete();
  },
  () => {
    console.log("Job stopped", new Date());
    return;
  },
  false,
  "America/Los_Angeles"
);

const app = express();
// @ts-ignore-next-line
const port = Number(Deno.env.get("PORT")) || 3000;

// Request Logger Middleware
const reqLogger = function (req: Request, _res: Response, next: NextFunction) {
  console.info(`${req.method} request to "${req.url}" by ${req.hostname}`);
  next();
};

app.use(reqLogger);
app.use(express.json()); // Support for parsing JSON body

const allowedOrigins = Deno.env.get("ALLOW_ORIGIN");

console.log("Allowed origins", allowedOrigins);

app.use(function (_req, res, next) {
  res.header("Access-Control-Allow-Origin", allowedOrigins);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  // methods to allow
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  next();
});

// Endpoints
app.post("/users", (req: Request, res: Response) => {
  const { name } = req.body;
  const user = dbService.query(DatabaseService.SQL.INSERT_USER, [name]);
  res.status(201).json(user);
});

app.get("/users/:id", (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  const user = dbService.query(DatabaseService.SQL.SELECT_USER_BY_ID, [userId]);
  res.status(200).json(user);
});

app.get("/users/:id/checkin-topics", (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  const checkinTopics = dbService.query(
    DatabaseService.SQL.SELECT_CHECKIN_TOPICS_BY_USER,
    [userId]
  );
  res.status(200).json(checkinTopics);
});

app.post("/checkin-topic/:userId", (req: Request, res: Response) => {
  const userId = Number(req.params.userId);
  const { topic_name } = req.body;
  const topic = dbService.query(DatabaseService.SQL.INSERT_CHECKIN_TOPIC, [
    userId,
    topic_name,
  ]);

  res.status(201).json(topic);
});

app.post("/daily-checkin/:topicId", (req: Request, res: Response) => {
  const topicId = Number(req.params.topicId);
  dbService.query(DatabaseService.SQL.INSERT_DAILY_CHECKIN, [topicId]);
  res.status(201).json({ message: "Check-in successful" });
});

app.get("/users/:id/checkins", (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  const checkins = dbService.query(
    DatabaseService.SQL.SELECT_DAILY_CHECKINS_BY_USER,
    [userId]
  );
  res.status(200).json(checkins);
});

// Create a new rule
app.post("/rules", (req: Request, res: Response) => {
  const { type, value, topic } = req.body;
  const rule = dbService.query(DatabaseService.SQL.INSERT_RULE, [
    type,
    value,
    topic,
  ]);
  res.status(201).json(rule);
});

// Get all rules
app.get("/rules", (req: Request, res: Response) => {
  const rules = dbService.query(DatabaseService.SQL.SELECT_ALL_RULES);
  res.status(200).json(rules);
});

// Update a rule by ID
app.put("/rules/:id", (req: Request, res: Response) => {
  const ruleId = Number(req.params.id);
  const { type, value, topic } = req.body;
  dbService.query(DatabaseService.SQL.UPDATE_RULE, [
    type,
    value,
    topic,
    ruleId,
  ]);
  res.status(200).json({ message: "Rule updated successfully" });
});

// Delete a rule by ID
app.delete("/rules/:id", (req: Request, res: Response) => {
  const ruleId = Number(req.params.id);
  dbService.query(DatabaseService.SQL.DELETE_RULE, [ruleId]);
  res.status(200).json({ message: "Rule deleted successfully" });
});

// Get all pending notifications
app.get("/pending-notifications", (req: Request, res: Response) => {
  const pendingNotifications = dbService.query(
    DatabaseService.SQL.SELECT_PENDING_NOTIFICATIONS
  );
  res.status(200).json(pendingNotifications);
});

// Delete a pending notification by ID
app.delete("/pending-notifications/:id", (req: Request, res: Response) => {
  const notificationId = Number(req.params.id);
  dbService.query(DatabaseService.SQL.DELETE_PENDING_NOTIFICATION, [
    notificationId,
  ]);
  res
    .status(200)
    .json({ message: "Pending notification deleted successfully" });
});

// Ack a pending notification by ID
app.put("/pending-notifications/:id", (req: Request, res: Response) => {
  const notificationId = Number(req.params.id);
  const { sent, ack } = req.body;
  dbService.query(DatabaseService.SQL.UPDATE_PENDING_NOTIFICATION, [
    sent,
    ack,
    notificationId,
  ]);
  res
    .status(200)
    .json({ message: "Pending notification updated successfully" });
});

app.listen(port, () => {
  // start the cron job
  job.start();

  console.log(`Listening on ${port} ...`);
});
