// @ts-ignore ts-ignore-next-line
import { Rule } from "./rules.ts";

const BASE_URL = "http://localhost:3000";

type User = {
  id: number;
  name: string;
};

type CheckinTopic = {
  id: number;
  user_id: number;
  topic_name: string;
};

type Checkin = {
  id: number;
  topic_id: number;
  topic_name: string;
};

class APIClient {
  private static async fetchJson(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return data;
  }

  async createUser(name: string) {
    const data = await APIClient.fetchJson("/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });
    const user: User = {
      id: data[0][0],
      name: data[0][1],
    };
    return user;
  }

  async createCheckinTopic(userId: number, topicName: string) {
    const data = await APIClient.fetchJson(`/checkin-topic/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic_name: topicName }),
    });
    const checkinTopic: CheckinTopic = {
      id: data[0][0],
      user_id: data[0][1],
      topic_name: data[0][2],
    };
    return checkinTopic;
  }

  async createDailyCheckin(topicId: number) {
    const data = await APIClient.fetchJson(`/daily-checkin/${topicId}`, {
      method: "POST",
    });
    return data;
  }

  async getUser(userId: number) {
    const data = await APIClient.fetchJson(`/users/${userId}`);
    const user: User = {
      id: data[0][0],
      name: data[0][1],
    };
    return user;
  }

  async getUserTopics(userId: number) {
    const data = await APIClient.fetchJson(`/users/${userId}/checkin-topics`);
    const checkinTopics: Array<CheckinTopic> = data.map((row: any) => ({
      id: row[0],
      user_id: row[1],
      topic_name: row[2],
    }));
    return checkinTopics;
  }

  async getUserCheckins(userId: number) {
    const data = await APIClient.fetchJson(`/users/${userId}/checkins`);
    const checkins: Array<Checkin> = data.map((row: any) => ({
      id: row[0],
      topic_id: row[1],
      checkin_time: row[2],
    }));
    return checkins;
  }

  async createRule(type: string, value: string, topic: string) {
    const data = await APIClient.fetchJson(`/rules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, value, topic }),
    });
    return data;
  }

  async getRules() {
    const data = await APIClient.fetchJson(`/rules`);
    const rules: Rule[] = data.map((row: any) => ({
      id: row[0],
      type: row[1],
      value: row[2],
      topic: row[3],
    }));
    return rules;
  }

  async updateRule(ruleId: number, type: string, value: string, topic: string) {
    const data = await APIClient.fetchJson(`/rules/${ruleId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, value, topic }),
    });
    return data;
  }

  async deleteRule(ruleId: number) {
    const data = await APIClient.fetchJson(`/rules/${ruleId}`, {
      method: "DELETE",
    });
    return data;
  }

  async getPendingNotifications() {
    const data = await APIClient.fetchJson(`/pending-notifications`);
    const notifications: any[] = data.map((row: any) => ({
      id: row[0],
      type: row[1],
      value: row[2],
      sent: row[3],
      ack: row[4],
    }));
    return notifications;
  }

  async deletePendingNotification(notificationId: number) {
    const data = await APIClient.fetchJson(
      `/pending-notifications/${notificationId}`,
      {
        method: "DELETE",
      }
    );
    return data;
  }

  async updatePendingNotification(
    notificationId: number,
    sent: boolean,
    ack: boolean
  ) {
    const data = await APIClient.fetchJson(
      `/pending-notifications/${notificationId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sent, ack }),
      }
    );
    return data;
  }
}

export default APIClient;
