type RuleType = "time" | "duration" | "deadline";

interface BaseRule {
  value: string;
  sent: boolean;
  ack: boolean;
  topic: string;
}

interface TimeRule extends BaseRule {
  type: "time";
}

interface DurationRule extends BaseRule {
  type: "duration";
}

interface DeadlineRule extends BaseRule {
  type: "deadline";
}

type Rule = TimeRule | DurationRule | DeadlineRule;

class RuleEngine {
  private rules: Array<Rule>;

  constructor(rules: Array<Rule>) {
    this.rules = rules;
  }

  checkRules(nowWithOffset: Date, lastCheckin: Date): boolean {
    return this.rules.some((rule: Rule) => {
      console.log("Checking rule", rule);
      switch (rule.type) {
        case "time":
          return this.timeRule(rule, nowWithOffset);
        case "duration":
          return this.durationRule(rule, lastCheckin, nowWithOffset);
        case "deadline":
          return this.deadlineRule(rule, lastCheckin, nowWithOffset);
        default:
          return false;
      }
    });
  }

  checkRule(rule: Rule, nowWithOffset: Date, lastCheckin: Date): boolean {
    console.log("Checking rule", rule);
    switch (rule.type) {
      case "time":
        return this.timeRule(rule, nowWithOffset);
      case "duration":
        return this.durationRule(rule, lastCheckin, nowWithOffset);
      case "deadline":
        return this.deadlineRule(rule, lastCheckin, nowWithOffset);
      default:
        return false;
    }
  }

  timeRule(rule: TimeRule, nowWithOffset: Date): boolean {
    // remove am or pm
    const text = rule.value.slice(0, -2);

    const timeParts = text.split(":");
    const hours = Number(timeParts[0]);
    const minutes = Number(timeParts[1]);
    console.log("Now with offset", nowWithOffset);
    console.log("Hours", hours);
    const result = nowWithOffset.getHours() === hours;
    console.log("\tTime rule", rule.type, rule.value, result);
    return result;
  }

  durationRule(
    rule: DurationRule,
    lastCheckin: Date,
    nowWithOffset: Date
  ): boolean {
    const diff = nowWithOffset.getTime() - lastCheckin.getTime();
    const valueInMs = Number(rule.value.slice(0, -2)) * 3600 * 1000; // Assuming value is always in 'hr'
    const result = diff >= valueInMs;
    console.log(
      "\tDuration rule",
      rule.type,
      rule.value,
      diff,
      valueInMs,
      result
    );
    return result;
  }

  deadlineRule(
    rule: DeadlineRule,
    lastCheckin: Date,
    nowWithOffset: Date
  ): boolean {
    console.log(lastCheckin);
    console.log(nowWithOffset);
    const diff = nowWithOffset.getTime() - lastCheckin.getTime();
    const valueInMs = Number(rule.value.slice(0, -2)) * 3600 * 1000; // Assuming value is always in 'hr'
    const result = diff >= valueInMs;
    console.log(
      "\tDeadline rule",
      rule.type,
      rule.value,
      diff,
      valueInMs,
      result
    );
    return result;
  }
}

export default RuleEngine;
