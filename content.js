(() => {
  "use strict";

  const DEFAULTS = { enabled: true, intervalMs: 5000, cooldownMs: 60000 };
  let settings = { ...DEFAULTS }, lastClick = 0, timer = null, observer = null, mutationTimer = null;

  function visible(el) {
    if (!(el instanceof HTMLElement)) return false;
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return s.display !== "none" && s.visibility !== "hidden" &&
           s.opacity !== "0" && r.width > 0 && r.height > 0;
  }

  function setState(state, detail="", extra={}) {
    chrome.storage.local.set({
      claudeRefresherState: { state, detail, timestamp: Date.now(), ...extra }
    });
  }

  function findContinuar() {
    const buttons = [...document.querySelectorAll("button")];
    return buttons.find(button => {
      if (!visible(button)) return false;
      const text = (button.innerText || button.textContent || "")
        .replace(/\s+/g, " ").trim();
      return /^Continuar$/i.test(text);
    }) || null;
  }

  function isEnabled(button) {
    return !button.disabled &&
      button.getAttribute("aria-disabled") !== "true" &&
      button.getAttribute("data-disabled") !== "true";
  }

  function limitText() {
    return (document.body?.innerText || "").replace(/\s+/g, " ").trim();
  }

  function isLimitContext() {
    const text = limitText();
    return /Te quedaste sin mensajes gratuitos/i.test(text) ||
           /límite de mensajes de 5 horas/i.test(text) ||
           /Alcanzaste el límite de mensajes/i.test(text) ||
           /reached your.*message limit/i.test(text) ||
           /usage limit/i.test(text) ||
           /message limit/i.test(text);
  }

  // Parses the reset clock Claude visibly displays, e.g.:
  // "Te quedaste sin mensajes gratuitos hasta 6:10 a.m."
  // "Your free messages reset until 6:10 AM."
  function parseResetTime() {
    const text = limitText();

    const match = text.match(
      /(?:hasta|until|reset(?:s)?(?: at)?|available(?: again)?(?: at)?)\s+(\d{1,2})(?::(\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)\b/i
    );

    if (!match) return null;

    let hour = Number(match[1]);
    const minute = Number(match[2] || 0);
    const meridiem = match[3].replace(/\s|\./g, "").toLowerCase();

    if (hour < 1 || hour > 12 || minute > 59) return null;

    if (meridiem === "pm" && hour !== 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;

    const now = new Date();
    let reset = new Date(now);
    reset.setHours(hour, minute, 0, 0);

    // If that clock time has already passed today, the next occurrence is tomorrow.
    if (reset.getTime() <= now.getTime()) {
      reset.setDate(reset.getDate() + 1);
    }

    return {
      timestamp: reset.getTime(),
      display: reset.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    };
  }

  function updateResetSchedule() {
    if (!isLimitContext()) return;

    const parsed = parseResetTime();
    if (!parsed) {
      setState("found-disabled", "Continuar is present, but Claude's reset time could not be parsed.");
      return;
    }

    chrome.storage.local.set({
      claudeResetAt: parsed.timestamp,
      claudeResetDisplay: parsed.display
    });

    // The service worker owns the alarm so it can fire even when this tab is backgrounded.
    chrome.runtime.sendMessage({
      type: "schedule-reset",
      resetAt: parsed.timestamp
    }).catch(() => {});
  }

  function attempt() {
    if (!settings.enabled) return setState("disabled");

    updateResetSchedule();

    const button = findContinuar();

    if (!button) {
      return setState("waiting", "No visible Continuar button found.");
    }

    if (!isEnabled(button)) {
      const parsed = parseResetTime();
      return setState(
        "found-disabled",
        parsed
          ? `Continuar is disabled. Claude shows the reset at ${parsed.display}.`
          : "Continuar is present, but Claude currently marks it disabled.",
        {
          ariaDisabled: button.getAttribute("aria-disabled"),
          nativeDisabled: !!button.disabled,
          resetAt: parsed?.timestamp || null
        }
      );
    }

    if (!isLimitContext()) {
      return setState("available", "Continuar is enabled.");
    }

    if (Date.now() - lastClick < settings.cooldownMs) {
      return setState("cooldown");
    }

    lastClick = Date.now();
    setState("clicking", "Clicking Claude's enabled Continuar button.");
    button.click();
    setTimeout(() => setState("checking"), 1500);
  }

  async function load() {
    settings = { ...DEFAULTS, ...(await chrome.storage.local.get(DEFAULTS)) };
  }

  function restart() {
    if (timer) clearInterval(timer);
    if (observer) observer.disconnect();

    timer = setInterval(attempt, settings.intervalMs);

    observer = new MutationObserver(() => {
      clearTimeout(mutationTimer);
      mutationTimer = setTimeout(attempt, 250);
    });

    observer.observe(document.documentElement, {
      subtree: true, childList: true, attributes: true,
      attributeFilter: ["disabled", "aria-disabled", "data-disabled", "class"]
    });

    attempt();
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "reset-time-reached") {
      attempt();
      sendResponse?.({ ok: true });
    }
    return true;
  });

  chrome.storage.onChanged.addListener(changes => {
    if (changes.enabled) settings.enabled = changes.enabled.newValue;
    if (changes.intervalMs) settings.intervalMs = changes.intervalMs.newValue;
    restart();
  });

  load().then(restart);
})();