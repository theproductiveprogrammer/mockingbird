import { create } from 'zustand';
import { TrafficEntry, ServiceRules, Config, Stats } from '../types/api';
import { api } from '../utils/api';

type View = 'traffic' | 'rules' | 'config' | 'stats';

interface AppState {
  // View state
  currentView: View;
  setCurrentView: (view: View) => void;

  // Traffic
  traffic: TrafficEntry[];
  totalAvailable: number;
  addTraffic: (entry: TrafficEntry) => void;
  setTraffic: (traffic: TrafficEntry[], total?: number) => void;
  loadMoreTraffic: () => Promise<void>;
  clearTraffic: () => void;
  selectedTrafficId: string | null;
  setSelectedTrafficId: (id: string | null) => void;

  // Filters
  filters: string[];
  addFilter: (filter: string) => void;
  removeFilter: (filter: string) => void;
  clearFilters: () => void;

  // Service selection (for filtering by service)
  selectedServices: Set<string>;
  toggleService: (service: string) => void;

  // Rules
  serviceRules: Record<string, ServiceRules>;
  setServiceRules: (rules: Record<string, ServiceRules>) => void;
  highlightedRule: { service: string; index: number } | null;
  setHighlightedRule: (rule: { service: string; index: number } | null) => void;

  // Config
  config: Config | null;
  setConfig: (config: Config) => void;

  // Stats
  stats: Stats | null;
  setStats: (stats: Stats) => void;

  // Connection status
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'traffic',
  setCurrentView: (view) => set({ currentView: view }),

  traffic: [],
  totalAvailable: 0,
  addTraffic: (entry) =>
    set((state) => {
      // Check if entry already exists by ID to prevent duplicates
      const exists = state.traffic.some((e) => e.id === entry.id);
      if (exists) {
        console.log('[addTraffic] DUPLICATE detected, skipping:', entry.id);
        return state; // Don't add duplicate
      }
      const newTraffic = [entry, ...state.traffic];
      console.log('[addTraffic] Adding entry:', entry.id, '| Total after:', newTraffic.length);
      return {
        traffic: newTraffic,
        totalAvailable: state.totalAvailable + 1, // Increment total when new entry arrives
      };
    }),
  setTraffic: (traffic, total) => {
    console.log('[setTraffic] Loading traffic - received:', traffic.length, '| Total available:', total);
    return set({
      traffic,
      totalAvailable: total !== undefined ? total : traffic.length,
    });
  },
  loadMoreTraffic: async () => {
    const state = get();
    const currentLength = state.traffic.length;
    console.log('[loadMoreTraffic] Current traffic:', currentLength, '| Loading 100 more...');

    // Fetch more traffic (we want the next 100, starting from where we are)
    const result = await api.getTraffic(currentLength + 100);

    // The API returns the most recent N entries, so we just replace our traffic with the new longer list
    set({
      traffic: result.entries,
      totalAvailable: result.total,
    });
    console.log('[loadMoreTraffic] Updated traffic:', result.entries.length, '| Total:', result.total);
  },
  clearTraffic: () => {
    console.log('[clearTraffic] Clearing all traffic');
    return set({ traffic: [], totalAvailable: 0 });
  },
  selectedTrafficId: null,
  setSelectedTrafficId: (id) => set({ selectedTrafficId: id }),

  filters: [],
  addFilter: (filter) =>
    set((state) => ({
      filters: state.filters.includes(filter)
        ? state.filters
        : [...state.filters, filter],
    })),
  removeFilter: (filter) =>
    set((state) => ({
      filters: state.filters.filter((f) => f !== filter),
    })),
  clearFilters: () => set({ filters: [] }),

  selectedServices: new Set<string>(),
  toggleService: (service) =>
    set((state) => {
      const newSelected = new Set(state.selectedServices);
      if (newSelected.has(service)) {
        newSelected.delete(service);
      } else {
        newSelected.add(service);
      }
      return { selectedServices: newSelected };
    }),

  serviceRules: {},
  setServiceRules: (rules) => set({ serviceRules: rules }),
  highlightedRule: null,
  setHighlightedRule: (rule) => set({ highlightedRule: rule }),

  config: null,
  setConfig: (config) => set({ config }),

  stats: null,
  setStats: (stats) => set({ stats }),

  isConnected: false,
  setIsConnected: (connected) => set({ isConnected: connected }),
}));
