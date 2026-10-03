import { create } from "zustand";
import type { SortOpt, Trip } from "./lib/tripsStore";
import { DEFAULT_CATS, DEFAULT_TRIPS, loadStore, saveStore } from "./lib/tripsStore";

type State = {
  categories: string[];
  trips: Trip[];
  filter: string;
  sort: SortOpt;
  search: string;
  identity: string | null;
  loaded: boolean;
  init: () => Promise<void>;
  setFilter: (f: string) => void;
  setSort: (s: SortOpt) => void;
  setSearch: (q: string) => void;
  setIdentity: (v: string | null) => void;
  addCategory: (name: string) => { ok: boolean; msg: string };
  addTrip: (trip: Trip) => void;
  removeTrip: (id: string) => void;
};

function persist(s: State) {
  saveStore(s.categories, s.trips, s.filter, s.sort);
}

export const useTripsStore = create<State>((set, get) => ({
  categories: [...DEFAULT_CATS],
  trips: [...DEFAULT_TRIPS],
  filter: "all",
  sort: "modified_desc",
  search: "",
  identity: null,
  loaded: false,
  init: async () => {
    const data = await loadStore();
    set({ categories: data.categories, trips: data.trips, filter: data.filter, sort: data.sort, loaded: true });
  },
  setFilter: (f) => {
    set({ filter: f });
    persist(get());
  },
  setSort: (s) => {
    set({ sort: s });
    persist(get());
  },
  setSearch: (q) => set({ search: q }),
  setIdentity: (v) => set({ identity: v }),
  addCategory: (name) => {
    const v = name.trim();
    if (!v) return { ok: false, msg: "Enter folder name" };
    if (v.length > 20) return { ok: false, msg: "Max 20 chars" };
    if (get().categories.includes(v) || v === "All" || v === "Uncategorized") return { ok: false, msg: "Folder exists" };
    const next = [...get().categories, v];
    set({ categories: next });
    persist(get());
    return { ok: true, msg: "Folder added: " + v };
  },
  addTrip: (trip) => {
    const next = [trip, ...get().trips];
    set({ trips: next });
    persist(get());
  },
  removeTrip: (id) => {
    const next = get().trips.filter(t => t.id !== id);
    set({ trips: next });
    persist(get());
  },
}));

export function selectFilteredTrips(s: State) {
  let list = [...s.trips];
  if (s.filter !== "all") list = list.filter(t => t.category === s.filter);
  if (s.search.trim()) {
    const q = s.search.trim().toLowerCase();
    list = list.filter(t => t.title.toLowerCase().includes(q) || (t.preview||"").toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || (t.blocks||[]).some((b: any) => (b.context||"").toLowerCase().includes(q)));
  }
  list.sort((a,b) => {
    const aC = new Date(a.created).getTime();
    const bC = new Date(b.created).getTime();
    const aM = new Date(a.modified).getTime();
    const bM = new Date(b.modified).getTime();
    if (s.sort === "modified_desc") return bM - aM;
    if (s.sort === "modified_asc") return aM - bM;
    if (s.sort === "created_desc") return bC - aC;
    if (s.sort === "created_asc") return aC - bC;
    return 0;
  });
  return list;
}
