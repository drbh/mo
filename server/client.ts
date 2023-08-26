// @ts-ignore ts-ignore-next-line
import APIClient from "../common/api.ts";

// @ts-ignore ts-ignore-next-line
const main = async () => {
  const client = new APIClient();
  const user = await client.createUser("John Doe");
  const topic = await client.createCheckinTopic(user.id, "Daily Workout");
  await client.createDailyCheckin(topic.id);
  await client.getUserCheckins(user.id);

  // async createRule(type: string, value: string, topic: string)
  // async getRules()
  // async updateRule(ruleId: number, type: string, value: string, topic: string)
  // async deleteRule(ruleId: number)
  // async getPendingNotifications()

  await client.createRule("time", "11am", "Daily Workout");
  const rules = await client.getRules();
  console.log(rules);

  // await client.updateRule(rules[0].id, "time", "10am", "Daily Workout");
  // await client.deleteRule(rules[0].id);

  const pending = await client.getPendingNotifications();
  console.log(pending);
};

main().catch((err) => {
  console.error(err);
});
