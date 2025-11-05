import { create } from 'zustand';
import { TrafficEntry, ServiceRules, Config, Stats } from '../types/api';

type View = 'traffic' | 'rules' | 'config' | 'stats';

interface AppState {
  // View state
  currentView: View;
  setCurrentView: (view: View) => void;

  // Traffic
  traffic: TrafficEntry[];
  addTraffic: (entry: TrafficEntry) => void;
  setTraffic: (traffic: TrafficEntry[]) => void;
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

export const useAppStore = create<AppState>((set) => ({
  currentView: 'traffic',
  setCurrentView: (view) => set({ currentView: view }),

  traffic: [],
  addTraffic: (entry) =>
    set((state) => {
      // Check if entry already exists by ID to prevent duplicates
      const exists = state.traffic.some((e) => e.id === entry.id);
      if (exists) {
        console.log('[addTraffic] DUPLICATE detected, skipping:', entry.id);
        return state; // Don't add duplicate
      }
      const newTraffic = [entry, ...state.traffic].slice(0, 100);
      console.log('[addTraffic] Adding entry:', entry.id, '| Total after:', newTraffic.length);
      return {
        traffic: newTraffic, // Keep last 100
      };
    }),
  setTraffic: (traffic) => {
    console.log('[setTraffic] Loading traffic - received:', traffic.length);
    return set({ traffic });
  },
  clearTraffic: () => {
    console.log('[clearTraffic] Clearing all traffic');
    return set({ traffic: [] });
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
