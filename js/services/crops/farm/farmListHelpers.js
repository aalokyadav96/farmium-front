
import { createElement } from "../../../components/createElement.js";
import { SRC_URL, apiFetch } from "../../../api/api.js";
import { navigate } from "../../../routes/index.js";
import Button from "../../../components/base/Button.js";



function renderFarmCards(farms, grid, isLoggedIn) {
    grid.textContent = "";
    for (const farm of farms) {
        grid.appendChild(FarmCard(farm, isLoggedIn));
    }
}

function FarmCard(farm, isLoggedIn) {
    const card = createElement("div", { class: "farm__card" });

    const badgeWrap = createFarmBadges(farm);
    const header = createElement("div", { class: "farm__header" }, [
        createElement("h3", {}, [farm.name]),
        createElement("p", { class: "farm__location" }, [farm.location])
    ]);

    const meta = createElement("div", { class: "farm__meta" }, [
        createElement("p", {}, [`Owner: ${farm.owner || "N/A"}`]),
        createElement("p", {}, [farm.description || "No description"])
    ]);

    const cropsSection = createElement("div", { class: "farm__crops-preview" }, [
        createElement("h4", {}, ["Crops"]),
        createCropList(farm.crops)
    ]);

    const actions = createElement("div", { class: "farm__actions" }, [
        Button("View", `farm-${farm.id}`, {
            click: () => navigate(`/farm/${farm.id}`)
        }, "farm__button")
    ]);

    card.append(header, badgeWrap, meta, cropsSection, actions);
    return card;
}

function createCropList(crops) {
    const cropList = createElement("div", { class: "crop__list" });
    const items = Array.isArray(crops) ? crops.slice(0, 4) : [];

    for (const crop of items) {
        const cropCard = createElement("div", { class: "crop__card" });

        const img = crop.imageUrl
            ? createElement("img", {
                src: SRC_URL + crop.imageUrl,
                alt: crop.name,
                class: "crop__image"
            })
            : createElement("div", { class: "crop__image placeholder" }, ["No Image"]);

        const badge = crop.outOfStock ? "Out of Stock" : crop.featured ? "Featured" : "";
        const badgeClass = crop.outOfStock ? "out" : crop.featured ? "featured" : "";

        const cropInfo = createElement("div", { class: "crop__info" }, [
            createElement("strong", {}, [crop.name]),
            badge && createElement("span", { class: `crop__badge ${badgeClass}` }, [badge])
        ]);

        cropCard.append(img, cropInfo);
        cropList.appendChild(cropCard);
    }

    return cropList;
}

function createFarmBadges(farm) {
    const badgeWrap = createElement("div", { class: "farm__badges" });

    const traits = [
        farm.organic && "Organic",
        farm.delivers && "Delivers",
        farm.hydroponic && "Hydroponic"
    ].filter(Boolean);

    for (const trait of traits) {
        badgeWrap.appendChild(createElement("span", { class: "farm__badge" }, [trait]));
    }

    return badgeWrap;
}

function renderFeaturedFarm(container, farm) {
    if (!farm) return;

    const section = createElement("section", { class: "farm__featured" }, [
        createElement("h3", {}, ["🌟 Featured Farm"]),
        farm.photo ? createElement("img", {
            src: SRC_URL + farm.photo,
            alt: farm.name,
            class: "farm__featured-photo"
        }) : "",
        createElement("h4", {}, [farm.name]),
        createElement("p", {}, [farm.location]),
        createElement("p", {}, [farm.description || "No description provided."]),
        createElement("p", { class: "farm__featured-rating" }, [
            `⭐ ${farm.avgRating?.toFixed(1) || "N/A"} (${farm.reviewCount || 0} reviews)`
        ]),
        Button("View", `featured-${farm.id}`, {
            click: () => navigate(`/farm/${farm.id}`)
        }, "farm__button")
    ]);

    replaceOrAppend(container, ".farm__featured", section);
}

function renderCTAFarm(container) {
    const section = createElement("section", { class: "farm__Cta" }, [
        Button("Buy Tools","buytools-crp-btn",{
            click: () => {navigate('/tools')}
        }, "buttonx"),
        Button("Chats","chatss-frm-btn",{
            click: () => {navigate('/merechats')}
        }, "buttonx"),
        Button("Create Farm","crt-frm-btn",{
            click: () => {navigate('/create-farm')}
        }, "buttonx"),
    ]);

    replaceOrAppend(container, ".farm__Cta", section);
}

function renderWeatherWidget(container) {
    const section = createElement("section", { class: "farm__weather" }, [
        createElement("h3", {}, ["🌤 Weather"]),
        createElement("p", {}, ["Today: Sunny, 28°C"]),
        createElement("p", {}, ["Tomorrow: Light rain, 26°C"])
    ]);

    replaceOrAppend(container, ".farm__weather", section);
}

function renderFarmStats(container, farms) {
    const uniqueLocations = new Set(farms.map(f => f.location));
    const uniqueCrops = new Set();
    farms.forEach(f => (f.crops || []).forEach(c => uniqueCrops.add(c.name)));

    const section = createElement("section", { class: "farm__stats" }, [
        createElement("h3", {}, ["📊 Farm Stats"]),
        createElement("p", {}, [`Total Farms: ${farms.length}`]),
        createElement("p", {}, [`Locations: ${uniqueLocations.size}`]),
        createElement("p", {}, [`Unique Crops: ${uniqueCrops.size}`])
    ]);

    replaceOrAppend(container, ".farm__stats", section);
}

function replaceOrAppend(parent, selector, newNode) {
    const old = parent.querySelector(selector);
    if (old) old.replaceWith(newNode);
    else parent.appendChild(newNode);
}

export {
    renderFarmCards,
    FarmCard,
    createCropList,
    createFarmBadges,
    renderFeaturedFarm,
    renderCTAFarm,
    renderWeatherWidget,
    renderFarmStats,
    replaceOrAppend
}