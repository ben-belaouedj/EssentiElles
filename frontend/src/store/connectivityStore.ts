import { create } from 'zustand';

interface ConnectivityState {
  /** Browser online flag (web) or "last call reached the API" (native) */
  online: boolean;
  /** Timestamp of the last successful API round-trip */
  lastSuccessAt: number | null;
  /** True when we are serving cached data after a failed request */
  usingCache: boolean;
  setOnline: (online: boolean) => void;
  reportSuccess: () => void;
  setUsingCache: (usingCache: boolean) => void;
}

/**
 * Lightweight connectivity signal shared by the offline banner and screens.
 * The API client reports every success/failure here, so screens can show
 * "mode hors connexion" without extra polling.
 */
export const useConnectivityStore = create<ConnectivityState>((set) => ({
  online: true,
  lastSuccessAt: null,
  usingCache: false,
  setOnline: (online) => set({ online }),
  reportSuccess: () => set({ online: true, lastSuccessAt: Date.now(), usingCache: false }),
  setUsingCache: (usingCache) => set({ usingCache }),
}));

export function reportNetworkFailure() {
  const { online } = useConnectivityStore.getState();
  if (online) useConnectivityStore.setState({ online: false });
}
