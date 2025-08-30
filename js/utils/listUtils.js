// utils/listUtils.js
export function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
  
  export function filterItems(items, { keyword = "", category = null, extraFilters = [] }) {
    return items.filter(item => {
      const matchesKeyword = keyword
        ? (item.name || item.title || "").toLowerCase().includes(keyword.toLowerCase())
        : true;
      const matchesCategory = category ? item.category === category : true;
      const matchesExtras = extraFilters.every(f => f(item));
      return matchesKeyword && matchesCategory && matchesExtras;
    });
  }
  
  export function sortItems(items, sortBy) {
    return [...items].sort((a, b) => {
      if (sortBy === "date" || sortBy === "createdAt") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "title" || sortBy === "name") return (a.title || a.name || "").localeCompare(b.title || b.name || "");
      if (sortBy === "views") return (b.views || 0) - (a.views || 0);
      if (sortBy === "capacity") return (a.capacity || 0) - (b.capacity || 0);
      return 0;
    });
  }
  
  export function paginate(items, page, pageSize) {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }
  
  export function attachInfiniteScroll(target, callback, options = { threshold: 1.0 }) {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) callback();
    }, options);
    observer.observe(target);
    return observer;
  }
  