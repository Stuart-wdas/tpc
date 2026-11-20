import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User, type Event } from '../types';
import { api } from '../api/client';

export type InstallPrompt = globalThis.Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export type AppState = {
  user: User | null;
  loading: boolean;
  savedIds: string[];
  installAvailable: boolean;
  install: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshSaved: () => Promise<void>;
  notify: (s: string) => void;
};

export const AppContext = createContext<AppState>({
  user: null,
  loading: true,
  savedIds: [],
  installAvailable: false,
  install: async () => {},
  refresh: async () => {},
  refreshSaved: async () => {},
  notify: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  useEffect(() => {
    const capture = (event: globalThis.Event) => {
      event.preventDefault();
      setPrompt(event as unknown as InstallPrompt);
    };
    const installed = () => setPrompt(null);
    window.addEventListener('beforeinstallprompt', capture);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', capture);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);
  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  }
  const refreshSaved = useCallback(async () => {
    try {
      setSavedIds((await api<Event[]>('/saved')).map((e) => e.id));
    } catch {
      setSavedIds([]);
    }
  }, []);
  const refresh = useCallback(async () => {
    try {
      setUser(await api<User>('/me'));
      await refreshSaved();
    } catch {
      setUser(null);
      setSavedIds([]);
    } finally {
      setLoading(false);
    }
  }, [refreshSaved]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(''), 6000);
      return () => clearTimeout(t);
    }
  }, [notice]);
  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        savedIds,
        installAvailable: !!prompt,
        install,
        refresh,
        refreshSaved,
        notify: setNotice,
      }}
    >
      {children}
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button aria-label="Dismiss notification" onClick={() => setNotice('')}>
            ×
          </button>
        </div>
      )}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
