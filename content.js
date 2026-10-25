const buttonLabels = {
  accept_all: /^(accept|agree|allow)( all)?( cookies)?$/i,
  reject_all: /^(reject|decline)( all)?( cookies)?$/i,
  necessary: /^(only )?(necessary|essential)( cookies)?( only)?$/i
};

let preference = 'necessary';
let enabled = true;
let finished = false;
let observerTimeout;
const clickedButtons = new WeakSet();

function scanForConsentButton() {
  if (finished || !enabled) return;

  const pattern = buttonLabels[preference];
  if (!pattern) return;

  for (const element of document.querySelectorAll('button, [role="button"]')) {
    const label = (element.innerText || element.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ');
    if (!label || !pattern.test(label)) continue;
    if (!element.isConnected || element.disabled || element.getClientRects().length === 0 || clickedButtons.has(element)) continue;

    clickedButtons.add(element);
    element.click();
    finished = true;
    observer.disconnect();
    clearTimeout(observerTimeout);
    return;
  }
}

const observer = new MutationObserver(scanForConsentButton);

function startConsentManager() {
  chrome.storage.sync.get({ cookiePreference: 'necessary', cookieManagerEnabled: true }, (settings) => {
    preference = settings.cookiePreference || 'necessary';
    enabled = settings.cookieManagerEnabled !== false;
    finished = false;
    observer.disconnect();
    clearTimeout(observerTimeout);
    if (!enabled) return;

    scanForConsentButton();
    if (!finished) {
      observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
      observerTimeout = setTimeout(() => observer.disconnect(), 30000);
    }
  });
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && (changes.cookieManagerEnabled || changes.cookiePreference)) {
    startConsentManager();
  }
});

startConsentManager();
