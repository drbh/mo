<script lang="ts">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import APIClient from "$common/api.ts";
  import PushService from "$common/push.ts";

  const checkinsList = writable([]); // Store to hold checkins
  const topicsList = writable([]); // Store to hold available topics
  const rulesList = writable([]); // Store to hold available rules
  const pendingNotificationsList = writable([]); // Store to hold pending notifications
  let selectedTopic = writable(null); // For tracking the selected topic
  let newRuleValue = ""; // For tracking a new rule entry
  let newTopicValue = ""; // For tracking a new topic entry
  let subInfo = ""; //
  let currentUser; // For tracking the current user

  onMount(async () => {
    const client = new APIClient();
    currentUser = await client.getUser(1);
    loadCheckins(currentUser.id);
    loadTopics(); // Fetch existing topics
    loadRulesAndNotifications(); // Fetch existing rules
  });

  async function loadCheckins(userId: number) {
    const client = new APIClient();
    const checkins = await client.getUserCheckins(userId);
    // Group the checkins by topic_id
    let groupedCheckins = checkins.reduce((acc, checkin) => {
      if (!acc[checkin.topic_id]) {
        acc[checkin.topic_id] = {
          topic_id: checkin.topic_id,
          checkins: [],
        };
      }
      acc[checkin.topic_id].checkins.push(checkin);
      return acc;
    }, {});
    // Convert the object to an array of the values
    checkinsList.set(Object.values(groupedCheckins));
  }

  async function loadTopics() {
    const client = new APIClient();
    const topics = await client.getUserTopics(1);
    console.log({ topics });
    topicsList.set(topics);
  }

  async function loadRulesAndNotifications() {
    const client = new APIClient();
    const rules = await client.getRules();
    const pendingNotifications = await client.getPendingNotifications();
    console.log({ rules });
    rulesList.set(rules);
    console.log({ pendingNotifications });
    pendingNotificationsList.set(pendingNotifications);
  }

  async function addCheckin() {
    const client = new APIClient();
    let topic;
    if ($selectedTopic === "new") {
      topic = await client.createCheckinTopic(currentUser.id, newTopicValue);
    } else {
      topic = { id: $selectedTopic };
    }
    await client.createDailyCheckin(topic.id);
    loadCheckins(currentUser.id); // Refresh checkins
  }

  async function addRule() {
    const client = new APIClient();
    const [_type, time, topic] = newRuleValue.split(",");
    if (!_type || !time || !topic) {
      alert("Please enter a valid rule");
      return;
    }
    await client.createRule(_type, time, topic);
    loadRulesAndNotifications(); // Refresh rules and notifications
  }

  async function removeRule(rule) {
    const client = new APIClient();
    await client.deleteRule(rule.id);
    loadRulesAndNotifications(); // Refresh rules and notifications
  }

  async function removePendingNotification(notification) {
    const client = new APIClient();
    await client.deletePendingNotification(notification.id);
    loadRulesAndNotifications(); // Refresh rules and notifications
  }

  async function updatePendingNotification(notification) {
    const client = new APIClient();
    await client.updatePendingNotification(
      notification.id,
      notification.sent,
      !notification.ack
    );
    loadRulesAndNotifications(); // Refresh rules and notifications
  }

  async function subscribe() {
    const pushService = new PushService((sub: string) => {
      subInfo = JSON.stringify(sub, null, 2);
    });
    pushService.subscribeUser();
  }

  async function push() {
    const _subInfo = JSON.parse(subInfo);
    console.log({ _subInfo });
  }
</script>

<main>
  <div class="card">
    <!-- Add Checkin Dropdown and Input -->
    <div class="input-container">
      <select bind:value={$selectedTopic} class="modern-input">
        {#each $topicsList as topic}
          <option value={topic.id}>{topic.topic_name}</option>
        {/each}
        <option value="new">Add new topic...</option>
      </select>

      {#if $selectedTopic === "new"}
        <input
          class="modern-input"
          type="text"
          bind:value={newTopicValue}
          placeholder="Enter the new topic..."
        />
      {/if}

      <button class="modern-button" on:click={addCheckin}>+ Add Checkin</button>
    </div>

    {#if $checkinsList && $checkinsList.length}
      {#each $checkinsList as topicCheckins}
        <div class="topic-row">
          <h4>{topicCheckins.topic_id}</h4>
          <!-- Adjust to show topic name when integrated with topic details -->
          <div class="activity-chart">
            {#each topicCheckins.checkins as checkin}
              <div
                class="day"
                style="background-color: {checkin.checkin_time
                  ? '#44cc44'
                  : '#eee'};"
                title="Checkin Date: {checkin.checkin_time || 'No checkin'}"
              />
            {/each}
          </div>
        </div>
      {/each}
    {:else}
      <p>No checkins available</p>
    {/if}

    <h3>Rules</h3>

    <!-- Add Checkin Dropdown and Input -->
    <div class="input-container">
      <input
        class="modern-input"
        type="text"
        bind:value={newRuleValue}
        placeholder="Enter the new comma separated rule..."
      />

      <button class="modern-button" on:click={addRule}>+ Add Rule</button>
    </div>

    <div class="input-container">
      <button class="modern-button" on:click={subscribe}>Subscribe</button>
      <br />
      <button class="modern-button" on:click={push}>Push</button>
      <br />
      <textarea
        class="modern-input"
        rows="16"
        cols="50"
        placeholder="Enter the new comma separated rule..."
        bind:value={subInfo}
      />
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Type</th>
          <th>Value</th>
          <th>Topic</th>
          <th>Remove</th>
        </tr>
      </thead>
      <tbody>
        {#each $rulesList as rule}
          <tr>
            <td>{rule.id}</td>
            <td>{rule.type}</td>
            <td>{rule.value}</td>
            <td>{rule.topic}</td>
            <td><button on:click={() => removeRule(rule)}>remove</button></td>
          </tr>
        {/each}
      </tbody>
    </table>

    <h3>Pending Notifications</h3>
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Type</th>
          <th>Value</th>
          <th>Sent</th>
          <th>Acknowledged</th>
          <th>Remove</th>
          <th>Ack</th>
        </tr>
      </thead>
      <tbody>
        {#each $pendingNotificationsList as notification}
          <tr>
            <td>{notification.id}</td>
            <td>{notification.type}</td>
            <td>{notification.value}</td>
            <td>{notification.sent}</td>
            <td>{notification.ack}</td>
            <td
              ><button on:click={() => removePendingNotification(notification)}
                >remove</button
              ></td
            >
            <td
              ><button on:click={() => updatePendingNotification(notification)}
                >ack</button
              ></td
            >
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</main>

<style>
  .input-container {
    display: flex;
    align-items: center;
    gap: 12px; /* Adds spacing between child elements */
    margin-bottom: 16px;
  }

  .modern-input {
    flex: 1; /* Allow input to take available width */
    padding: 8px 12px;
    border: 1px solid #e1e1e1;
    border-radius: 4px;
    transition: border 0.3s;
    font-size: 14px;
  }

  .modern-input:focus {
    border-color: #44cc44;
    outline: none;
  }

  .modern-button {
    padding: 8px 16px;
    border: none;
    background-color: #44cc44;
    color: rgb(29, 29, 29);
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.3s;
  }

  .modern-button:hover {
    background-color: #339933;
  }

  .activity-chart {
    display: flex;
    flex-wrap: wrap;
  }

  .day {
    width: 15px;
    height: 15px;
    margin: 2px;
    border-radius: 2px;
    position: relative;
    cursor: pointer;
  }

  .day:hover::before {
    content: attr(title);
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateY(-80%) translateX(-50%);
    z-index: 10;
    background-color: #333;
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
  }

  .table th,
  .table td {
    border: 1px solid #ddd;
    padding: 8px;
  }

  .table th {
    padding-top: 12px;
    padding-bottom: 12px;
    text-align: left;
    background-color: #4caf50;
    color: white;
  }
</style>
