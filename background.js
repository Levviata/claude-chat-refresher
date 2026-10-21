const ALARM = "claude-reset";

async function scheduleReset(resetAt) {
  if (!resetAt || resetAt <= Date.now()) return;
  await chrome.alarms.clear(ALARM);
  chrome.alarms.create(ALARM, { when: resetAt });
}

async function notifyClaudeTabs() {
  const tabs = await chrome.tabs.query({ url: ["https://claude.ai/*"] });
  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "reset-time-reached" });
    } catch (_) {
      // The tab may not currently have a content script (e.g. a special page).
    }
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "schedule-reset") {
    scheduleReset(Number(message.resetAt));
  }
});

chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name !== ALARM) return;

  await notifyClaudeTabs();

  // Ask the content script to discover the next reset time if the current
  // page still shows a limit after the first attempt.
  setTimeout(notifyClaudeTabs, 5000);
});