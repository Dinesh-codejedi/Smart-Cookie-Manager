import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

type Preference = "accept_all" | "reject_all" | "necessary";
type ChromeApi = {
  storage: { sync: { get: (keys: object, cb: (value: { cookiePreference?: Preference; cookieManagerEnabled?: boolean }) => void) => void; set: (value: object, cb: () => void) => void } };
  tabs: { query: (query: object, cb: (tabs: Array<{ url?: string }>) => void) => void };
  cookies?: { getAll: (details: { url: string }, cb: (cookies: Array<{ name: string; value: string }>) => void) => void };
  runtime: { lastError?: { message?: string } };
};
declare const chrome: ChromeApi;

function App() {
  const [enabled, setEnabled] = useState(true);
  const [preference, setPreference] = useState<Preference>("necessary");
  const [storage, setStorage] = useState("Loading…");
  const [message, setMessage] = useState("");

  useEffect(() => {
    chrome.storage.sync.get({ cookiePreference: "necessary", cookieManagerEnabled: true }, (settings) => {
      if (settings.cookiePreference) setPreference(settings.cookiePreference);
      setEnabled(settings.cookieManagerEnabled !== false);
    });

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.url || !/^https?:/.test(tab.url)) {
        setStorage("Unavailable on this page");
        return;
      }
      const getAllCookies = chrome.cookies?.getAll;
      if (!getAllCookies) {
        setStorage("Cookie access unavailable");
        return;
      }
      getAllCookies({ url: tab.url }, (cookies) => {
        if (chrome.runtime.lastError) {
          setStorage("Unavailable");
          return;
        }
        if (!cookies.length) {
          setStorage("0 cookies · 0 Bytes");
          return;
        }
        const bytes = cookies.reduce((total, cookie) => total + cookie.name.length + cookie.value.length, 0);
        const size = bytes >= 1024 ** 2 ? `${(bytes / 1024 ** 2).toFixed(2)} MB`
          : bytes >= 1024 ? `${(bytes / 1024).toFixed(2)} KB` : `${bytes} Bytes`;
        setStorage(`${cookies.length} ${cookies.length === 1 ? "cookie" : "cookies"} · ${size}`);
      });
    });
  }, []);

  function updateSetting(value: object, onSaved: () => void) {
    chrome.storage.sync.set(value, () => {
      if (chrome.runtime.lastError) {
        setMessage("Could not save setting");
        return;
      }
      onSaved();
      setMessage("");
    });
  }

  function toggleEnabled() {
    const next = !enabled;
    setEnabled(next);
    updateSetting({ cookieManagerEnabled: next }, () => {});
  }

  function changePreference(value: Preference) {
    setPreference(value);
    updateSetting({ cookiePreference: value }, () => {});
  }

  return (
    <main className="popup">
      <header className="topbar">
        <h1>Cookie Manager</h1>
        <button className={`switch ${enabled ? "is-on" : ""}`} type="button" role="switch" aria-checked={enabled} aria-label="Enable Cookie Manager" onClick={toggleEnabled}>
          <span className="switch-thumb" />
        </button>
      </header>
      <label className="field-label" htmlFor="preference">Preference</label>
      <select id="preference" value={preference} onChange={(event) => changePreference(event.target.value as Preference)} disabled={!enabled}>
        <option value="necessary">Only necessary</option>
        <option value="reject_all">Reject all optional</option>
        <option value="accept_all">Accept all</option>
      </select>
      <section className="storage-row" aria-live="polite">
        <span>Storage</span>
        <strong title={storage}>{storage}</strong>
      </section>
      <p className="status" aria-live="polite">{message || (enabled ? "Extension is on" : "Extension is off")}</p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
