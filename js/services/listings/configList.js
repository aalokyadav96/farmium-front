// ---- Base Helpers ----
const baseSearchable = fields => item =>
  fields
    .map(f => {
      const val = f.split(".").reduce((acc, key) => acc?.[key], item);
      return Array.isArray(val) ? val.join(" ") : val;
    })
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const baseCategories = key => items =>
  [...new Set(items.map(i => i[key]).filter(Boolean))];

const baseLocations = items =>
  [...new Set(items.map(i => i.location?.city || i.location?.region).filter(Boolean))];

const baseSorters = {
  date: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  title: (a, b) => (a.title || "").localeCompare(b.title || ""),
  views: (a, b) => (b.views || 0) - (a.views || 0)
};

// ---- Centralized Type Configuration ----
export const LIST_CONFIG = {
  events: {
    searchable: baseSearchable([
      "title", "placename", "tags", "location.city", "location.region"
    ]),
    categories: baseCategories("category"),
    locations: baseLocations,
    sorters: { ...baseSorters, price: (a, b) => Math.min(...(a.prices || [0])) - Math.min(...(b.prices || [0])) },
    radius: 10 // km
  },

  places: {
    searchable: baseSearchable(["name", "type", "location.city", "location.region"]),
    categories: baseCategories("type"),
    locations: baseLocations,
    sorters: { ...baseSorters, capacity: (a, b) => (a.capacity || 0) - (b.capacity || 0) },
    radius: 5
  },

  posts: {
    searchable: baseSearchable(["title", "category", "subcategory", "createdBy", "location.city"]),
    categories: baseCategories("category"),
    locations: baseLocations,
    sorters: { ...baseSorters, subcategory: (a, b) => (a.subcategory || "").localeCompare(b.subcategory || "") },
    radius: 15
  },

  recipes: {
    searchable: item =>
      [item.title, ...(item.ingredients || []).map(i => i.name)]
        .join(" ")
        .toLowerCase(),
    categories: baseCategories("category"),
    locations: baseLocations,
    sorters: baseSorters,
    radius: 8
  },

  baitos: {
    searchable: baseSearchable(["title", "company", "category", "location.city", "location.region"]),
    categories: baseCategories("category"),
    locations: baseLocations,
    sorters: { ...baseSorters, pay: (a, b) => (b.pay || 0) - (a.pay || 0) },
    radius: 20
  },

  workers: {
    searchable: baseSearchable(["name", "skills", "profession", "location.city", "location.region"]),
    categories: baseCategories("profession"),
    locations: baseLocations,
    sorters: { ...baseSorters, experience: (a, b) => (b.yearsExperience || 0) - (a.yearsExperience || 0) },
    radius: 25
  },

  artists: {
    searchable: baseSearchable(["name", "genre", "skills", "location.city", "location.region"]),
    categories: baseCategories("genre"),
    locations: baseLocations,
    sorters: { ...baseSorters, followers: (a, b) => (b.followers || 0) - (a.followers || 0) },
    radius: 15
  },

  farms: {
    searchable: baseSearchable(["name", "products", "category", "location.city", "location.region"]),
    categories: baseCategories("category"),
    locations: baseLocations,
    sorters: { ...baseSorters, size: (a, b) => (b.areaSize || 0) - (a.areaSize || 0) },
    radius: 30
  },

  default: {
    searchable: baseSearchable(["title", "name", "description", "location.city", "location.region"]),
    categories: baseCategories("category"),
    locations: baseLocations,
    sorters: baseSorters,
    radius: 10
  }
};