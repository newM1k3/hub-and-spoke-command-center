/* ============================================================
   useUrlFilters.ts
   Syncs Agent / Status / Language filter state to URL query params.
   Reading on mount initialises from the URL so bookmarks/shares work.
   Writing on change keeps the URL in sync without a full navigation.

   Usage:
     const { agent, status, lang, setAgent, setStatus, setLang, clearAll }
       = useUrlFilters();
   ============================================================ */
import { useState, useEffect, useCallback } from "react";
import type { AgentName, StatusName } from "@/lib/store";

type FilterAgent    = AgentName  | "All";
type FilterStatus   = StatusName | "All";
type FilterLanguage = string     | "All";

interface UrlFilters {
  agent:    FilterAgent;
  status:   FilterStatus;
  lang:     FilterLanguage;
  setAgent:  (v: FilterAgent)    => void;
  setStatus: (v: FilterStatus)   => void;
  setLang:   (v: FilterLanguage) => void;
  clearAll:  () => void;
  hasActive: boolean;
}

function readParam(key: string, fallback: string): string {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeParams(updates: Record<string, string>) {
  try {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(updates)) {
      if (value === "All") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    const newUrl = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  } catch {
    // non-browser env — no-op
  }
}

export function useUrlFilters(): UrlFilters {
  const [agent,  setAgentState]  = useState<FilterAgent>(() =>
    readParam("agent", "All") as FilterAgent
  );
  const [status, setStatusState] = useState<FilterStatus>(() =>
    readParam("status", "All") as FilterStatus
  );
  const [lang,   setLangState]   = useState<FilterLanguage>(() =>
    readParam("lang", "All")
  );

  // Keep URL in sync whenever state changes
  useEffect(() => {
    writeParams({ agent, status, lang });
  }, [agent, status, lang]);

  const setAgent = useCallback((v: FilterAgent) => {
    setAgentState(v);
  }, []);

  const setStatus = useCallback((v: FilterStatus) => {
    setStatusState(v);
  }, []);

  const setLang = useCallback((v: FilterLanguage) => {
    setLangState(v);
  }, []);

  const clearAll = useCallback(() => {
    setAgentState("All");
    setStatusState("All");
    setLangState("All");
  }, []);

  const hasActive = agent !== "All" || status !== "All" || lang !== "All";

  return { agent, status, lang, setAgent, setStatus, setLang, clearAll, hasActive };
}
