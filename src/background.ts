import browser from "webextension-polyfill";

console.log("Hello from the background!");

browser.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details);
  
  // Clear any existing timer data on install
  browser.storage.local.remove(['timerEndTime', 'commitment']);
});

// Listen for messages from content script
browser.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type === 'CLOSE_TAB' && sender.tab?.id) {
    await browser.tabs.remove(sender.tab.id);
    return true;
  }
  
  if (message.type === 'TIMER_STARTED' && message.data?.endTime) {
    // Set an alarm to notify when timer completes
    const delayInMinutes = (message.data.endTime - Date.now()) / (1000 * 60);
    browser.alarms.create('timerComplete', { delayInMinutes });
    return true;
  }
  
  return false;
});

// Listen for alarm to fire
browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'timerComplete') {
    // Get all tabs and send timer complete message to relevant ones
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url) {
        try {
          browser.tabs.sendMessage(tab.id, { type: 'TIMER_COMPLETE' });
        } catch (error) {
          console.error(`Error sending message to tab ${tab.id}:`, error);
        }
      }
    }
  }
});
