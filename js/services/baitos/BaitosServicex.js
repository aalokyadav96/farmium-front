import { createElement } from "../../components/createElement.js";
import { SRC_URL, apiFetch } from "../../api/api.js";
import { navigate } from "../../routes/index.js";
import Button from "../../components/base/Button.js";
import { formatRelativeTime } from "../../utils/dateUtils.js";

export async function displayBaitos(content, isLoggedIn) {
  content.innerHTML = "";
  let baitoContainer = createElement("div", { class: "baito-container" });

  // Dummy Data
  const jobs = [
    {
      id: "1",
      title: "Convenience Store Staff",
      category: "Retail",
      location: "Shibuya, Tokyo",
      salary: "¥1,100/hour",
      company: "FamilyMart",
      createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    },
    {
      id: "2",
      title: "Café Barista",
      category: "Food & Beverage",
      location: "Sakae, Nagoya",
      salary: "¥1,000/hour",
      company: "StarBeans",
      createdAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
    },
    {
      id: "3",
      title: "English Conversation Tutor",
      category: "Education",
      location: "Umeda, Osaka",
      salary: "¥2,500/hour",
      company: "SpeakUp Inc.",
      createdAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
    },
    {
      id: "4",
      title: "Warehouse Picker",
      category: "Logistics",
      location: "Kawasaki, Kanagawa",
      salary: "¥1,200/hour",
      company: "Nippon Express",
      createdAt: new Date(Date.now() - 86400000 * 7), // 7 days ago
    },
  ];

  // State
  let searchTerm = "";
  let category = "All";
  let sort = "newest";

  // Header
  const header = createElement("div", { class: "baito-header" });

  const search = createElement("input", {
    type: "text",
    placeholder: "🔍 Search by title or location...",
    class: "baito-search",
  });
  search.addEventListener("input", (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    renderJobs();
  });

  const sortSelect = createElement("select", {});
  [
    ["newest", "📅 Newest"],
    ["oldest", "📆 Oldest"],
    ["title", "🔤 Title A-Z"],
  ].forEach(([val, label]) => {
    const opt = createElement("option", { value: val }, [label]);
    sortSelect.appendChild(opt);
  });
  sortSelect.addEventListener("change", (e) => {
    sort = e.target.value;
    renderJobs();
  });

  header.append(search, sortSelect);
  baitoContainer.appendChild(header);

  // Categories
  const categories = ["All", ...new Set(jobs.map((j) => j.category))];
  const catBar = createElement("div", { class: "baito-cat-bar" });

  categories.forEach((cat) => {
    const btn = createElement("button", { class: category === cat ? "active" : "" }, [cat]);
    btn.addEventListener("click", () => {
      category = cat;
      catBar.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderJobs();
    });
    catBar.appendChild(btn);
  });
  baitoContainer.appendChild(catBar);

  const jobList = createElement("div", { class: "baito-list" });
  baitoContainer.appendChild(jobList);

  // Render Jobs
  function renderJobs() {
    jobList.innerHTML = "";
    let filtered = jobs.filter((j) => {
      if (category !== "All" && j.category !== category) return false;
      if (searchTerm) {
        const combined = `${j.title} ${j.location} ${j.company}`.toLowerCase();
        if (!combined.includes(searchTerm)) return false;
      }
      return true;
    });

    // Sort
    if (sort === "title") filtered.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "oldest") filtered.sort((a, b) => a.createdAt - b.createdAt);
    else filtered.sort((a, b) => b.createdAt - a.createdAt);

    if (!filtered.length) {
      jobList.appendChild(createElement("p", {}, ["📭 No part-time jobs found."]));
      return;
    }

    filtered.forEach((job) => {
      const card = createElement("div", { class: "baito-card" });

      card.appendChild(createElement("h3", {}, [job.title]));
      card.appendChild(createElement("p", {}, [`📍 ${job.location}`]));
      card.appendChild(createElement("p", {}, [`🏢 ${job.company}`]));
      card.appendChild(createElement("p", {}, [`💴 ${job.salary}`]));
      card.appendChild(createElement("p", { class: "baito-time" }, [
        `🕒 ${formatRelativeTime(job.createdAt)}`,
      ]));

      card.appendChild(
        Button("🔎 View", `view-${job.id}`, {
          click: () => navigate(`/baito/${job.id}`),
        }, "btn btn-secondary")
      );

      jobList.appendChild(card);
    });
  }

  renderJobs();
  content.appendChild(baitoContainer);
}
