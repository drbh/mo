// @ts-ignore ts-ignore-next-line
import RuleEngine, { Rule } from "./rules.ts";
// @ts-ignore ts-ignore-next-line
import PushService from "./push.ts";

type Notification = {
  id?: number;
  type: string;
  value: string;
  sent: boolean;
  ack: boolean;
};

class NotificationService {
  private sub: any;

  constructor(private pushService: PushService, sub: any) {
    this.sub = sub;
  }

  checkAndNotify(checkIns: any[], rules: Rule[], pending: Notification[]) {
    const engine = new RuleEngine(rules);
    const checkInGroups = this.groupByTopic(checkIns);
    // iterate over each rule and check if it matches
    for (const rule of rules) {
      // @ts-ignore ts-ignore-next-line
      const mostRecentCheckIn = checkInGroups[rule.topic]?.at?.(-1) ?? null;
      const lastCheckInIfExists = mostRecentCheckIn?.checkIn_time;
      console.log(lastCheckInIfExists);
      const lastCheckInTime = lastCheckInIfExists
        ? new Date(lastCheckInIfExists + "Z")
        : new Date(0);
      const nowWithOffset = new Date();
      // first check rules fire conditional
      if (engine.checkRule(rule, nowWithOffset, lastCheckInTime)) {
        // check if notification already exists
        const existing = pending.find((notification) => {
          return (
            notification.type === rule.type && notification.value === rule.value
          );
        });
        // here we only care about adding new notifications
        if (!existing || rule.type == "duration") {
          pending.push({
            id: undefined, // will be set by the database
            type: rule.type,
            value: rule.value,
            sent: false,
            ack: false,
          });
        }
        // we need to handle notifications that require an ack
        if (rule.type == "deadline") {
          console.log("dl ex", existing);
        }
      }
    }
    const mutatedNotifications: Notification[] = [];
    for (const notification of pending) {
      console.log("Notification: ", notification);
      // one-way (don't care about ack)
      if (!notification.sent) {
        this.pushService.sendPost(this.sub);
        mutatedNotifications.push({
          ...notification,
          sent: true,
        });
      }
      // if sent but not acked:
      if (
        notification.sent &&
        !notification.ack &&
        notification.type == "deadline"
      ) {
        console.log("Should send a followup");
        this.pushService.sendPost(this.sub);
        mutatedNotifications.push({
          ...notification,
          sent: true,
        });
      }
    }
    return mutatedNotifications;
  }

  groupByTopic(checkIns: any[]): Record<string, any[]> {
    return checkIns.reduce((groups, checkIn) => {
      console.log(checkIn);
      const { topic_id, ...rest } = checkIn;
      if (!groups[topic_id]) {
        groups[topic_id] = [];
      }
      groups[topic_id].push(checkIn);
      return groups;
    }, {});
  }
}

export default NotificationService;
