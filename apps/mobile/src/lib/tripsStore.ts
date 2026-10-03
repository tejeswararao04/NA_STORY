import AsyncStorage from "@react-native-async-storage/async-storage";

export type TripBlock = { image: string | null; context: string };
export type Trip = {
  id: string;
  title: string;
  preview: string;
  category: string;
  dateLabel: string;
  created: string;
  modified: string;
  blocks: TripBlock[];
};

export const DEFAULT_CATS = ["Family", "Frnds", "Partner"];
export const DEFAULT_TRIPS: Trip[] = [
  { id:"1", title:"Bangalore 2026", preview:"Sunrise at Ulsoor, coffee and family stories", category:"Family", dateLabel:"September 26", created:"2026-09-26T10:00:00", modified:"2026-09-26T10:00:00", blocks:[{image:null, context:"Sunrise at Ulsoor, coffee and family stories - the city that felt like home."}] },
  { id:"2", title:"Manali 2024", preview:"Snow trails, maggi and friends forever", category:"Frnds", dateLabel:"September 25", created:"2024-09-25T10:00:00", modified:"2024-09-25T10:00:00", blocks:[{image:null, context:"Snow trails, maggi and friends forever - Manali with my squad."}] },
  { id:"3", title:"First date with my love", preview:"Oct 7 - the day everything changed", category:"Partner", dateLabel:"September 21", created:"2024-10-07T10:00:00", modified:"2024-09-21T10:00:00", blocks:[{image:null, context:"Oct 7 - the day everything changed. First coffee, first walk."}] },
  { id:"4", title:"Family trip 2025", preview:"Temples, beaches and home food in South India", category:"Family", dateLabel:"September 21", created:"2025-09-21T10:00:00", modified:"2025-09-21T10:00:00", blocks:[{image:null, context:"Temples, beaches and home food - family trip across South India."}] },
  { id:"5", title:"Frnds trip 2027", preview:"Late nights, startups and Silicon dreams", category:"Frnds", dateLabel:"September 15", created:"2027-09-15T10:00:00", modified:"2027-09-15T10:00:00", blocks:[{image:null, context:"Late nights, startups and Silicon dreams with friends."}] },
  { id:"6", title:"South India Trip 2024", preview:"Kerala backwaters, filter coffee and sunsets", category:"Family", dateLabel:"September 20", created:"2024-09-20T10:00:00", modified:"2024-09-20T10:00:00", blocks:[{image:null, context:"Kerala backwaters, filter coffee and sunsets - South India at its best."}] },
  { id:"7", title:"Goa Gateway 2025", preview:"Bakul mess, sunsets and old friends", category:"Frnds", dateLabel:"September 21", created:"2025-09-21T09:00:00", modified:"2025-09-21T09:00:00", blocks:[{image:null, context:"Bakul mess, sunsets and old friends - Goa that we will never forget."}] },
  { id:"8", title:"Kerala Backwaters 2023", preview:"Houseboat, calm waters and family laughter", category:"Family", dateLabel:"September 18", created:"2023-09-18T10:00:00", modified:"2023-09-18T10:00:00", blocks:[{image:null, context:"Houseboat, calm waters and family laughter - Kerala 2023."}] },
];

const K_TRIPS = "nastory_trips_v1";
const K_CATS = "nastory_cats_v1";
const K_FILTER = "nastory_filter_v1";
const K_SORT = "nastory_sort_v1";
const K_IDENTITY = "nastory_identity_v1";

export type SortOpt = "modified_desc" | "modified_asc" | "created_desc" | "created_asc";

function normalizeTrip(t: any): Trip {
  if (!t.blocks || !Array.isArray(t.blocks) || t.blocks.length === 0) {
    t.blocks = [{ image: null, context: t.preview || "" }];
  }
  t.blocks = t.blocks.map((b: any) => ({ image: b.image || null, context: b.context || "" }));
  if (!t.preview) {
    const first = t.blocks.find((b: TripBlock) => b.context && b.context.trim()) || t.blocks[0];
    t.preview = first?.context || "";
  }
  return t as Trip;
}

export async function loadStore() {
  try {
    const [c, tr, f, s] = await Promise.all([
      AsyncStorage.getItem(K_CATS),
      AsyncStorage.getItem(K_TRIPS),
      AsyncStorage.getItem(K_FILTER),
      AsyncStorage.getItem(K_SORT),
    ]);
    const cats = c ? JSON.parse(c) : null;
    const tripsRaw = tr ? JSON.parse(tr) : null;
    let trips: Trip[];
    if (Array.isArray(tripsRaw) && tripsRaw.length) {
      const bad = new Set(["tpo","9i","501684"]);
      let filtered = tripsRaw.filter((x: any) => !bad.has(String(x.title).toLowerCase()));
      if (filtered.length < 5) filtered = DEFAULT_TRIPS;
      trips = filtered.map(normalizeTrip);
    } else {
      trips = DEFAULT_TRIPS.map(normalizeTrip);
    }
    return {
      categories: Array.isArray(cats) && cats.length ? cats : [...DEFAULT_CATS],
      trips,
      filter: f || "all",
      sort: (s as SortOpt) || "modified_desc",
    };
  } catch {
    return { categories: [...DEFAULT_CATS], trips: [...DEFAULT_TRIPS].map(normalizeTrip), filter: "all", sort: "modified_desc" as SortOpt };
  }
}

export async function saveStore(categories: string[], trips: Trip[], filter: string, sort: SortOpt) {
  await Promise.all([
    AsyncStorage.setItem(K_CATS, JSON.stringify(categories)),
    AsyncStorage.setItem(K_TRIPS, JSON.stringify(trips)),
    AsyncStorage.setItem(K_FILTER, filter),
    AsyncStorage.setItem(K_SORT, sort),
  ]);
}

export async function getIdentity() {
  return AsyncStorage.getItem(K_IDENTITY);
}
export async function setIdentity(v: string) {
  return AsyncStorage.setItem(K_IDENTITY, v);
}
export async function clearIdentity() {
  return AsyncStorage.removeItem(K_IDENTITY);
}

export function getValidation() {
  return {
    getEmailError(v: string) {
      v = v.trim();
      if (!v) return "Enter your email.";
      if (!v.includes("@")) return "Email must contain @ (e.g. name@gmail.com).";
      if (v.startsWith("@") || v.endsWith("@")) return "Enter a valid email (e.g. name@gmail.com).";
      if (v.includes("..")) return "Email can't contain ..";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email (e.g. name@gmail.com).";
      const domain = v.split("@")[1] || "";
      if (!domain.includes(".")) return "Email domain must contain . (e.g. gmail.com).";
      if (/\s/.test(v)) return "Email can't contain spaces.";
      return null;
    },
    getPhoneError(v: string) {
      v = v.trim();
      if (!v) return "Enter your phone number.";
      if (/[a-zA-Z]/.test(v)) return "Phone can't contain letters - 10 digits only.";
      const digits = v.replace(/\D/g, "");
      if (digits.length === 0) return "Enter 10 digits (e.g. 9876543210).";
      if (digits.length < 10) return `Too short - need 10 digits, you entered ${digits.length}.`;
      if (digits.length > 10) {
        if (digits.length === 12 && digits.startsWith("91")) return "Enter 10 digits without +91 (e.g. 9876543210).";
        if (digits.length === 11 && digits.startsWith("0")) return "Enter 10 digits without leading 0.";
        return `Too long - need exactly 10 digits, you entered ${digits.length}.`;
      }
      if (!/^[6-9]\d{9}$/.test(digits)) return "Enter a valid 10-digit Indian mobile (starts with 6-9).";
      return null;
    },
  };
}

export function tripPreview(t: Trip) {
  if (Array.isArray(t.blocks) && t.blocks.length) {
    const first = t.blocks.find(b => b.context && b.context.trim()) || t.blocks[0];
    return first.context || t.preview || "";
  }
  return t.preview || "";
}
