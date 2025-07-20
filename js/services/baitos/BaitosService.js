import { createElement } from "../../components/createElement.js";
import { SRC_URL, apiFetch } from "../../api/api.js";
import { navigate } from "../../routes/index.js";
import Button from "../../components/base/Button.js";
import { formatRelativeTime } from "../../utils/dateUtils.js";
import { baitoEmployerDash } from "./baitoEmployerDash.js";
import { baitoApplicantDash } from "./baitoApplicantDash.js";

const categoryMap = {
    Food: ["Waiter", "Cook", "Delivery", "Cleaning"],
    Health: ["Reception", "Cleaner", "Helper"],
    Retail: ["Cashier", "Stock", "Floor Staff"],
    Hospitality: ["Housekeeping", "Front Desk", "Server"],
    Other: ["Manual Labor", "Seasonal Work", "Event Help"]
};

export async function displayBaitos(content, isLoggedIn) {
    content.innerHTML = "";

    const contentContainer = createElement("div", { class: "baitospage" });
    content.appendChild(contentContainer);

    const header = createElement("div", { class: "baito-header" }, [
        createElement("h2", {}, ["📋 Browse Baitos"]),
        Button("See Dashboard", "", { click: () => navigate("/baitos/dash") }, "btn btn-secondary")
    ]);
    contentContainer.appendChild(header);

    const filterBar = createElement("div", { class: "baito-filter-bar" });

    const categorySelect = createElement("select", {}, [
        createElement("option", { value: "" }, ["All Categories"]),
        ...Object.keys(categoryMap).map(cat => createElement("option", { value: cat }, [cat]))
    ]);

    const subcategorySelect = createElement("select", {}, [
        createElement("option", { value: "" }, ["All Roles"])
    ]);

    const locationInput = createElement("input", {
        type: "text",
        placeholder: "📍 Location"
    });

    const wageInput = createElement("input", {
        type: "number",
        placeholder: "Min Wage (¥)",
        min: 0
    });

    const sortSelect = createElement("select", {}, [
        createElement("option", { value: "date" }, ["Sort: Newest"]),
        createElement("option", { value: "wage" }, ["Sort: Wage (high → low)"])
    ]);

    const clearBtn = Button("Clear Filters", "clear-filters", {
        click: () => {
            categorySelect.value = "";
            subcategorySelect.value = "";
            locationInput.value = "";
            wageInput.value = "";
            sortSelect.value = "date";
            currentPage = 1;
            applyFilters();
        }
    }, "btn btn-secondary");

    filterBar.append(categorySelect, subcategorySelect, locationInput, wageInput, sortSelect, clearBtn);
    contentContainer.appendChild(filterBar);

    const section = createElement("div", { class: "baito-list" });
    contentContainer.appendChild(section);

    const pagination = createElement("div", { class: "baito-pagination" });
    const prevBtn = Button("← Prev", "prev-btn", { click: () => changePage(-1) });
    const nextBtn = Button("Next →", "next-btn", { click: () => changePage(1) });
    pagination.append(prevBtn, nextBtn);
    contentContainer.appendChild(pagination);

    // State
    let baitos = [];
    let filtered = [];
    let currentPage = 1;
    const pageSize = 10;

    try {
        baitos = await apiFetch("/baitos/latest");
        applyFilters();
    } catch (e) {
        section.appendChild(createElement("p", { class: "error-msg" }, ["⚠️ Failed to load baitos. Please try again later."]));
        console.error("Failed to fetch baitos:", e);
        return;
    }

    categorySelect.addEventListener("change", () => {
        const selected = categorySelect.value;
        subcategorySelect.innerHTML = "";
        subcategorySelect.appendChild(createElement("option", { value: "" }, ["All Roles"]));
        (categoryMap[selected] || []).forEach(sub =>
            subcategorySelect.appendChild(createElement("option", { value: sub }, [sub]))
        );
        currentPage = 1;
        applyFilters();
    });

    [subcategorySelect, locationInput, wageInput, sortSelect].forEach(input =>
        input.addEventListener("input", () => {
            currentPage = 1;
            applyFilters();
        })
    );

    function applyFilters() {
        const category = categorySelect.value;
        const subcategory = subcategorySelect.value;
        const loc = locationInput.value.toLowerCase();
        const minWage = parseInt(wageInput.value || "0", 10);
        const sort = sortSelect.value;

        filtered = baitos.filter(job =>
            (!category || job.category === category) &&
            (!subcategory || job.subcategory === subcategory) &&
            (!loc || job.location?.toLowerCase().includes(loc)) &&
            (!minWage || Number(job.wage || 0) >= minWage)
        );

        if (sort === "wage") {
            filtered.sort((a, b) => (b.wage || 0) - (a.wage || 0));
        } else {
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        renderPage();
    }

    function renderPage() {
        section.innerHTML = "";

        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const pageData = filtered.slice(start, end);

        if (pageData.length === 0) {
            section.appendChild(createElement("p", {}, ["😢 No matching jobs. Try changing your filters."]));
            return;
        }

        pageData.forEach(job => {
            const card = createElement("div", { class: "baito-card" });

            card.appendChild(createElement("img", {
                src: job.banner ? `${SRC_URL}/${job.banner}` : "/fallback.jpg",
                alt: job.title || "baito banner",
                class: "baito-banner-thumb",
                loading: "lazy"
            }));

            card.appendChild(createElement("h3", {}, [job.title || "Untitled"]));

            const wageText = job.wage ? `💴 ¥${Number(job.wage).toLocaleString()}/hr` : "💴 Not specified";
            const meta = `📁 ${job.category || "?"} › ${job.subcategory || "?"} | ${wageText}`;
            card.appendChild(createElement("p", { class: "baito-meta" }, [meta]));

            const shortDesc = job.description ? job.description.slice(0, 100) + "…" : "No description.";
            card.appendChild(createElement("p", { class: "baito-snippet" }, [shortDesc]));

            const loc = job.location || "Unknown";
            const time = formatRelativeTime(job.createdAt);
            card.appendChild(createElement("p", { class: "baito-loc-time" }, [`📍 ${loc} • ${time}`]));

            if (Array.isArray(job.tags) && job.tags.length > 0) {
                const tagWrap = createElement("div", { class: "baito-tags" });
                job.tags.forEach(tag =>
                    tagWrap.appendChild(createElement("span", { class: "baito-tag" }, [`#${tag}`]))
                );
                card.appendChild(tagWrap);
            }

            card.appendChild(
                Button("🔎 View Details", `view-${job._id}`, {
                    click: () => navigate(`/baito/${job._id}`)
                }, "btn btn-secondary")
            );

            section.appendChild(card);
        });

        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage * pageSize >= filtered.length;
    }

    function changePage(delta) {
        currentPage += delta;
        renderPage();
    }
}

export async function displayBaitoDash(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = "<h2>🏢 Baito Dashboard</h2>";

    if (!isLoggedIn) {
        contentContainer.appendChild(createElement("p", {}, ["🔒 Please log in to access your dashboard."]));
        return;
    }

    contentContainer.appendChild(Button("Employer Dashboard", "baito-dash-emp", {
        click: () => { baitoEmployerDash(contentContainer) }
    }));

    contentContainer.appendChild(Button("Applicant Dashboard", "baito-dash-apc", {
        click: () => { baitoApplicantDash(contentContainer) }
    }));

}
