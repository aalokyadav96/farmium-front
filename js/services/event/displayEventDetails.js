import { SRC_URL } from "../../state/state.js";
import { createElement } from "../../components/createElement.js";
import { Button } from "../../components/base/Button.js";
import { editEventForm } from "./editEvent.js";
import { deleteEvent, viewEventAnalytics } from "./eventService.js";
import { reportPost } from "../reporting/reporting.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";

// --- Config ---
const fieldConfig = [
    { key: 'title', tag: 'h1', classes: ['event-title'] },
    { key: 'status', tag: 'p', classes: ['event-status'] },
    { key: 'date', tag: 'p', classes: ['event-date'], formatter: (d) => new Date(d).toLocaleString() },
    { key: 'description', label: 'Description', tag: 'p', classes: ['event-description'] },
];

// --- Utility Functions ---
const createDetailItems = (config, data) => {
    const details = createElement("div", { class: "eventpage-details" });
    config.forEach(({ key, label, tag, classes, formatter }) => {
        let value = data[key];
        if (!value) return;
        if (formatter) value = formatter(value);
        details.appendChild(createElement(tag, { class: classes.join(" ") }, [label ? `${label}: ${value}` : value]));
    });
    return details;
};

const createSocialLinks = (links) => {
    const container = createElement("div", { class: "event-social-links" });
    Object.entries(links).forEach(([platform, url]) => {
        const link = createElement("a", { href: url, class: "social-link" }, [platform]);
        container.appendChild(link);
    });
    return container;
};

const createTags = (tags) => {
    const container = createElement("div", { class: "event-tags" });
    tags.forEach(tag => {
        container.appendChild(createElement('span', { class: 'event-tag' }, [`#${tag}`]));
    });
    return container;
};

const createCustomFields = (fields) => {
    const container = createElement("div", { class: "event-custom-fields" });
    Object.entries(fields).forEach(([field, value]) => {
        container.appendChild(createElement('p', { class: 'custom-field' }, [`${field}: ${value}`]));
    });
    return container;
};

const createActionButtons = (actions) => {
    const container = createElement("div", { class: "event-actions" });
    actions.forEach(({ text, onClick, classes = [] }) => {
        container.appendChild(Button(text, "", { click: onClick }, classes.join(" ")));
    });
    return container;
};

const createPlaceLink = (placename, placeid) => {
    return createElement('p', {}, [
        createElement('a', { href: `/place/${placeid}` }, [
            createElement('strong', {}, [`Place: ${placename}`])
        ])
    ]);
};

const getEventColorClass = (type = '') => {
    switch (type.toLowerCase()) {
        case 'concert': return 'color-concert';
        case 'workshop': return 'color-workshop';
        case 'sports': return 'color-sports';
        case 'meetup': return 'color-meetup';
        case 'festival': return 'color-festival';
        default: return 'color-default';
    }
};

// --- Save Button ---
const getSavedEvents = () => {
    try {
        return JSON.parse(localStorage.getItem("saved_events") || "[]");
    } catch {
        return [];
    }
};

const toggleSaveEvent = (id) => {
    let saved = getSavedEvents();
    if (saved.includes(id)) {
        saved = saved.filter(eid => eid !== id);
    } else {
        saved.push(id);
    }
    localStorage.setItem("saved_events", JSON.stringify(saved));
};

const createSaveButton = (eventid) => {
    const isSaved = getSavedEvents().includes(eventid);
    const icon = createElement("span", {
        style: `cursor:pointer;font-size:20px;color:${isSaved ? "gold" : "gray"}`,
        title: "Save Event"
    }, [isSaved ? "★" : "☆"]);

    icon.addEventListener("click", () => {
        toggleSaveEvent(eventid);
        const nowSaved = getSavedEvents().includes(eventid);
        icon.replaceChildren(nowSaved ? "★" : "☆");
        icon.setAttribute("style", `cursor:pointer;font-size:20px;color:${nowSaved ? "gold" : "gray"}`);
    });

    return icon;
};

// --- Share Button ---
const createShareButton = (eventid) => {
    const btn = Button("Share", "", {
        click: () => {
            navigator.clipboard.writeText(location.origin + `/event/${eventid}`);
            btn.replaceChildren("Link Copied");
            setTimeout(() => btn.replaceChildren("Share"), 1500);
        }
    }, "share-btn");
    return btn;
};

// --- Status Badge ---
const createStatusBadge = (eventDate) => {
    const now = Date.now();
    const time = new Date(eventDate).getTime();
    const isPast = time < now;
    const label = isPast ? "Past" : "Upcoming";
    const bg = isPast ? "#999" : "#28a745";
    return createElement("span", {
        style: `font-size:0.75rem;padding:2px 6px;border-radius:4px;background:${bg};color:white;margin-left:8px;`
    }, [label]);
};

// --- Countdown ---
const createCountdown = (eventDate) => {
    const now = Date.now();
    const msLeft = new Date(eventDate).getTime() - now;
    if (msLeft <= 0) return null;

    const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(msLeft / (1000 * 60 * 60)) % 24;
    const label = days > 0 ? `${days} day(s)` : `${hours} hour(s)`;
    return createElement("p", { class: "event-countdown" }, [`Starts in ${label}`]);
};

// --- Main Function ---
async function displayEventDetails(content, eventData, isCreator, isLoggedIn) {
    content.replaceChildren();

    const eventWrapper = createElement("div", { class: `event-wrapper ${getEventColorClass(eventData.category)}` });
    const eventCard = createElement("div", { class: "event-card hvflex" });

    eventCard.append(
        createBannerSection(eventData),
        createInfoSection(eventData, isCreator, isLoggedIn)
    );

    eventWrapper.appendChild(eventCard);
    content.appendChild(eventWrapper);
}


function createBannerSection(eventData) {
    const bannerSection = createElement("div", { class: "banner-section" });

    const bannerSrc = resolveImagePath(EntityType.EVENT, PictureType.BANNER, `${eventData.banner_image}`);

    const bannerImage = createElement("img", {
        src: bannerSrc,
        alt: `Banner for ${eventData.title || "Event"}`,
        class: "event-banner-image"
    });

    bannerImage.onerror = () => {
        bannerImage.src = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, "banner.jpg");
    };

    bannerSection.appendChild(bannerImage);
    return bannerSection;
}

// --- Banner Section ---
// function createBannerSection(eventData) {
//     const bannerSection = createElement("div", { class: "banner-section" });

//     const bannerImage = createElement("img", {
//         src: `${SRC_URL}/eventpic/banner/${eventData.eventid}.jpg`,
//         alt: `Banner for ${eventData.title}`,
//         class: "event-banner-image"
//     });

//     // bannerImage.onerror = () => {
//     //     bannerImage.src = `${SRC_URL}/default/banner.jpg`;
//     // };

//     bannerSection.appendChild(bannerImage);
//     return bannerSection;
// }

// --- Info Section ---
function createInfoSection(eventData, isCreator, isLoggedIn) {
    const eventInfo = createElement("div", { class: "event-info" });

    const topRow = createElement("div", { class: "event-header-row" });
    const detailBlock = createDetailItems(fieldConfig, eventData);
    const statusBadge = createStatusBadge(eventData.date);
    const countdown = createCountdown(eventData.date);

    const saveBtn = createSaveButton(eventData.eventid);
    const shareBtn = createShareButton(eventData.eventid);

    topRow.append(detailBlock, statusBadge, saveBtn);

    eventInfo.append(
        topRow,
        ...(countdown ? [countdown] : []),
        ...(eventData.tags?.length ? [createTags(eventData.tags)] : []),
        ...(eventData.social_links ? [createSocialLinks(eventData.social_links)] : []),
        ...(eventData.custom_fields ? [createCustomFields(eventData.custom_fields)] : []),
        ...(eventData.placename && eventData.placeid ? [createPlaceLink(eventData.placename, eventData.placeid)] : []),
        createElement("div", { class: "event-actions" }, [shareBtn]),
        ...createActionSection(eventData, isCreator, isLoggedIn),
        createEditPlaceholder()
    );

    return eventInfo;
}

// --- Action Buttons ---
function createActionSection(eventData, isCreator, isLoggedIn) {
    const actions = [];

    if (isLoggedIn && isCreator) {
        actions.push(
            { text: '✏ Edit Event', onClick: () => editEventForm(isLoggedIn, eventData.eventid) },
            { text: '🗑 Delete Event', onClick: () => deleteEvent(isLoggedIn, eventData.eventid), classes: ['delete-btn'] },
            { text: '📊 View Analytics', onClick: () => viewEventAnalytics(isLoggedIn, eventData.eventid), classes: ['analytics-btn'] }
        );
    } else if (isLoggedIn) {
        actions.push({ text: 'Report Event', onClick: () => reportPost(eventData.eventid, 'event') });
    }

    return actions.length ? [createActionButtons(actions)] : [];
}

function createEditPlaceholder() {
    return createElement("div", { class: "eventedit", id: "editevent" });
}

export { displayEventDetails };

// import { SRC_URL } from "../../state/state.js";
// import { createElement } from "../../components/createElement.js";
// import { editEventForm } from "./editEvent.js";
// import { deleteEvent, viewEventAnalytics } from "./eventService.js";
// import { reportPost } from "../reporting/reporting.js";

// // --- Config ---
// const fieldConfig = [
//     { key: 'title', tag: 'h1', classes: ['event-title'] },
//     { key: 'status', tag: 'p', classes: ['event-status'] },
//     { key: 'date', tag: 'p', classes: ['event-date'], formatter: (d) => new Date(d).toLocaleString() },
//     { key: 'description', label: 'Description', tag: 'p', classes: ['event-description'] },
// ];

// // --- Utility Functions ---
// const createDetailItems = (config, data) => {
//     const details = createElement("div", { class: "eventpage-details" });
//     config.forEach(({ key, label, tag, classes, formatter }) => {
//         let value = data[key];
//         if (!value) return;
//         if (formatter) value = formatter(value);
//         details.appendChild(createElement(tag, { class: classes.join(" ") }, [label ? `${label}: ${value}` : value]));
//     });
//     return details;
// };

// const createSocialLinks = (links) => {
//     const container = createElement("div", { class: "event-social-links" });
//     Object.entries(links).forEach(([platform, url]) => {
//         const link = createElement("a", { href: url, class: "social-link" }, [platform]);
//         container.appendChild(link);
//     });
//     return container;
// };

// const createTags = (tags) => {
//     const container = createElement("div", { class: "event-tags" });
//     tags.forEach(tag => {
//         container.appendChild(createElement('span', { class: 'event-tag' }, [`#${tag}`]));
//     });
//     return container;
// };

// const createCustomFields = (fields) => {
//     const container = createElement("div", { class: "event-custom-fields" });
//     Object.entries(fields).forEach(([field, value]) => {
//         container.appendChild(createElement('p', { class: 'custom-field' }, [`${field}: ${value}`]));
//     });
//     return container;
// };

// const createActionButtons = (actions) => {
//     const container = createElement("div", { class: "event-actions" });
//     actions.forEach(({ text, onClick, classes = [] }) => {
//         const btn = createElement("button", {
//             class: ["action-btn", ...classes].join(" "),
//             click: onClick
//         }, [text]);
//         container.appendChild(btn);
//     });
//     return container;
// };

// const createPlaceLink = (placename, placeid) => {
//     return createElement('p', {}, [
//         createElement('a', { href: `/place/${placeid}` }, [
//             createElement('strong', {}, [`Place: ${placename}`])
//         ])
//     ]);
// };

// const getEventColorClass = (type = '') => {
//     switch (type.toLowerCase()) {
//         case 'concert': return 'color-concert';
//         case 'workshop': return 'color-workshop';
//         case 'sports': return 'color-sports';
//         case 'meetup': return 'color-meetup';
//         case 'festival': return 'color-festival';
//         default: return 'color-default';
//     }
// };

// // --- New Helper Features ---
// const getSavedEvents = () => {
//     try {
//         return JSON.parse(localStorage.getItem("saved_events") || "[]");
//     } catch {
//         return [];
//     }
// };

// const toggleSaveEvent = (id) => {
//     let saved = getSavedEvents();
//     if (saved.includes(id)) {
//         saved = saved.filter(eid => eid !== id);
//     } else {
//         saved.push(id);
//     }
//     localStorage.setItem("saved_events", JSON.stringify(saved));
// };

// const createSaveButton = (eventid) => {
//     const isSaved = getSavedEvents().includes(eventid);
//     const icon = createElement("span", {
//         style: `cursor:pointer;font-size:20px;color:${isSaved ? "gold" : "gray"}`,
//         title: "Save Event"
//     }, [isSaved ? "★" : "☆"]);

//     icon.addEventListener("click", () => {
//         toggleSaveEvent(eventid);
//         const nowSaved = getSavedEvents().includes(eventid);
//         icon.textContent = nowSaved ? "★" : "☆";
//         icon.style.color = nowSaved ? "gold" : "gray";
//     });

//     return icon;
// };

// const createShareButton = (eventid) => {
//     const btn = createElement("button", {
//         class: "share-btn",
//         click: () => {
//             navigator.clipboard.writeText(location.origin + `/event/${eventid}`);
//             btn.textContent = "Link Copied";
//             setTimeout(() => btn.textContent = "Share", 1500);
//         }
//     }, ["Share"]);
//     return btn;
// };

// const createStatusBadge = (eventDate) => {
//     const now = Date.now();
//     const time = new Date(eventDate).getTime();
//     const isPast = time < now;
//     const label = isPast ? "Past" : "Upcoming";
//     const bg = isPast ? "#999" : "#28a745";
//     return createElement("span", {
//         style: `font-size:0.75rem;padding:2px 6px;border-radius:4px;background:${bg};color:white;margin-left:8px;`
//     }, [label]);
// };

// const createCountdown = (eventDate) => {
//     const now = Date.now();
//     const msLeft = new Date(eventDate).getTime() - now;
//     if (msLeft <= 0) return null;

//     const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
//     const hours = Math.floor(msLeft / (1000 * 60 * 60)) % 24;
//     const label = days > 0 ? `${days} day(s)` : `${hours} hour(s)`;
//     return createElement("p", { class: "event-countdown" }, [`Starts in ${label}`]);
// };

// // --- Main Function ---
// async function displayEventDetails(content, eventData, isCreator, isLoggedIn) {
//     content.replaceChildren();

//     const eventWrapper = createElement("div", { class: `event-wrapper ${getEventColorClass(eventData.category)}` });
//     const eventCard = createElement("div", { class: "event-card hvflex" });

//     eventCard.append(
//         createBannerSection(eventData),
//         createInfoSection(eventData, isCreator, isLoggedIn)
//     );

//     eventWrapper.appendChild(eventCard);
//     content.appendChild(eventWrapper);
// }

// // Banner Section
// function createBannerSection(eventData) {
//     const bannerSection = createElement("div", { class: "banner-section" });
//     const bannerImage = createElement("img", {
//         src: `${SRC_URL}/eventpic/banner/${eventData.eventid}.jpg`,
//         alt: `Banner for ${eventData.title}`,
//         class: "event-banner-image",
//         error: () => {
//             bannerImage.src = `${SRC_URL}/default/banner.jpg`;
//         }
//     });

//     bannerSection.appendChild(bannerImage);
//     return bannerSection;
// }

// // Info Section
// function createInfoSection(eventData, isCreator, isLoggedIn) {
//     const eventInfo = createElement("div", { class: "event-info" });

//     const topRow = createElement("div", { class: "event-header-row" });
//     const detailBlock = createDetailItems(fieldConfig, eventData);
//     const statusBadge = createStatusBadge(eventData.date);
//     const countdown = createCountdown(eventData.date);

//     const saveBtn = createSaveButton(eventData.eventid);
//     const shareBtn = createShareButton(eventData.eventid);

//     topRow.append(detailBlock, statusBadge, saveBtn);

//     eventInfo.append(
//         topRow,
//         ...(countdown ? [countdown] : []),
//         ...(eventData.tags?.length ? [createTags(eventData.tags)] : []),
//         ...(eventData.social_links ? [createSocialLinks(eventData.social_links)] : []),
//         ...(eventData.custom_fields ? [createCustomFields(eventData.custom_fields)] : []),
//         ...(eventData.placename && eventData.placeid ? [createPlaceLink(eventData.placename, eventData.placeid)] : []),
//         createElement("div", { class: "event-actions" }, [shareBtn]),
//         ...createActionSection(eventData, isCreator, isLoggedIn),
//         createEditPlaceholder()
//     );

//     return eventInfo;
// }

// // Action Buttons
// function createActionSection(eventData, isCreator, isLoggedIn) {
//     const actions = [];

//     if (isLoggedIn && isCreator) {
//         actions.push(
//             { text: '✏ Edit Event', onClick: () => editEventForm(isLoggedIn, eventData.eventid) },
//             { text: '🗑 Delete Event', onClick: () => deleteEvent(isLoggedIn, eventData.eventid), classes: ['delete-btn'] },
//             { text: '📊 View Analytics', onClick: () => viewEventAnalytics(isLoggedIn, eventData.eventid), classes: ['analytics-btn'] }
//         );
//     } else if (isLoggedIn) {
//         actions.push({ text: 'Report Event', onClick: () => reportPost(eventData.eventid, 'event') });
//     }

//     return actions.length ? [createActionButtons(actions)] : [];
// }

// function createEditPlaceholder() {
//     return createElement("div", { class: "eventedit", id: "editevent" });
// }

// export { displayEventDetails };

// // // // // --- Imports ---
// // // // import { SRC_URL } from "../../state/state.js";
// // // // import {
// // // //     createButton,
// // // //     createHeading,
// // // //     createContainer,
// // // //     createImage,
// // // //     createLink
// // // // } from "../../components/eventHelper.js";
// // // // import { createElement } from "../../components/createElement.js";
// // // // import { editEventForm } from "./editEvent.js";
// // // // import { deleteEvent, viewEventAnalytics } from "./eventService.js";
// // // // import { reportPost } from "../reporting/reporting.js";

// // // // // --- Config ---
// // // // const fieldConfig = [
// // // //     { key: 'status', tag: 'p', classes: ['event-status'] },
// // // // ];

// // // // // --- Utility Functions ---
// // // // const createTags = (tags) => {
// // // //     const container = createContainer(['event-tags']);
// // // //     tags.forEach(tag => {
// // // //         container.appendChild(
// // // //             createElement('span', { class: 'event-tag' }, [`#${tag}`])
// // // //         );
// // // //     });
// // // //     return container;
// // // // };

// // // // const createSocialLinks = (links) => {
// // // //     const container = createContainer(['event-social-links']);
// // // //     Object.entries(links).forEach(([platform, url]) => {
// // // //         container.appendChild(
// // // //             createLink({ href: url, children: [platform], classes: ['social-link'] })
// // // //         );
// // // //     });
// // // //     return container;
// // // // };

// // // // const createCustomFields = (fields) => {
// // // //     const container = createContainer(['event-custom-fields']);
// // // //     Object.entries(fields).forEach(([field, value]) => {
// // // //         container.appendChild(
// // // //             createHeading('p', `${field}: ${value}`, ['custom-field'])
// // // //         );
// // // //     });
// // // //     return container;
// // // // };

// // // // const createPlaceLink = (placename, placeid) => {
// // // //     return createElement('p', {}, [
// // // //         createElement('a', { href: `/place/${placeid}` }, [
// // // //             createElement('strong', {}, [`Place: ${placename}`])
// // // //         ])
// // // //     ]);
// // // // };

// // // // const createActionButtons = (actions) => {
// // // //     const container = createContainer(['event-actions']);
// // // //     actions.forEach(({ text, onClick, classes = [] }) => {
// // // //         container.appendChild(
// // // //             createButton({
// // // //                 text,
// // // //                 classes: ['action-btn', ...classes],
// // // //                 events: { click: onClick }
// // // //             })
// // // //         );
// // // //     });
// // // //     return container;
// // // // };

// // // // const getEventColorClass = (type = '') => {
// // // //     switch (type.toLowerCase()) {
// // // //         case 'concert': return 'color-concert';
// // // //         case 'workshop': return 'color-workshop';
// // // //         case 'sports': return 'color-sports';
// // // //         case 'meetup': return 'color-meetup';
// // // //         case 'festival': return 'color-festival';
// // // //         default: return 'color-default';
// // // //     }
// // // // };

// // // // // --- Main Display Function ---
// // // // async function displayEventDetails(content, eventData, isCreator, isLoggedIn) {
// // // //     content.replaceChildren();

// // // //     const wrapper = createContainer(['event-wrapper', getEventColorClass(eventData.category)]);
// // // //     wrapper.append(
// // // //         createBannerSection(eventData),
// // // //         createBodySection(eventData, isCreator, isLoggedIn)
// // // //     );

// // // //     const footer = createFooterActions(eventData, isCreator, isLoggedIn);
// // // //     if (footer) wrapper.append(footer);

// // // //     content.append(wrapper);
// // // // }

// // // // // --- Banner Section ---
// // // // function createBannerSection(eventData) {
// // // //     const section = createContainer(['event-banner']);
// // // //     section.style = `background-image: url(${SRC_URL}/eventpic/banner/${eventData.eventid}.jpg)`;

// // // //     const overlay = createContainer(['banner-overlay']);
// // // //     const title = createHeading('h1', eventData.title, ['event-title']);
// // // //     const date = createHeading('p', new Date(eventData.date).toLocaleString(), ['event-date']);

// // // //     overlay.append(title, date);
// // // //     section.append(overlay);
// // // //     return section;
// // // // }

// // // // // --- Body Section ---
// // // // function createBodySection(eventData, isCreator, isLoggedIn) {
// // // //     const body = createContainer(['event-body']);

// // // //     const meta = createContainer(['event-meta']);
// // // //     fieldConfig.forEach(({ key, tag, classes }) => {
// // // //         const value = eventData[key];
// // // //         if (value) meta.appendChild(createHeading(tag, value, classes));
// // // //     });

// // // //     if (eventData.tags?.length) meta.append(createTags(eventData.tags));
// // // //     if (eventData.placename && eventData.placeid) meta.append(createPlaceLink(eventData.placename, eventData.placeid));
// // // //     if (eventData.social_links) meta.append(createSocialLinks(eventData.social_links));

// // // //     const description = createContainer(['event-description']);
// // // //     if (eventData.description) {
// // // //         description.append(createHeading('p', eventData.description, ['event-desc']));
// // // //     }
// // // //     if (eventData.custom_fields) {
// // // //         description.append(createCustomFields(eventData.custom_fields));
// // // //     }

// // // //     const actions = createActionSection(eventData, isCreator, isLoggedIn);
// // // //     if (actions.length) {
// // // //         const mobileActions = createActionButtons(actions);
// // // //         mobileActions.classList.add('actions-mobile');
// // // //         description.append(mobileActions);
// // // //     }

// // // //     body.append(meta, description, createEditPlaceholder());
// // // //     return body;
// // // // }

// // // // // --- Footer Actions (desktop) ---
// // // // function createFooterActions(eventData, isCreator, isLoggedIn) {
// // // //     const actions = createActionSection(eventData, isCreator, isLoggedIn);
// // // //     if (!actions.length) return null;

// // // //     const container = createContainer(['event-footer-actions']);
// // // //     container.append(createActionButtons(actions));
// // // //     return container;
// // // // }

// // // // // --- Action Section Logic ---
// // // // function createActionSection(eventData, isCreator, isLoggedIn) {
// // // //     const actions = [];

// // // //     if (isLoggedIn && isCreator) {
// // // //         actions.push(
// // // //             { text: '✏ Edit Event', onClick: () => editEventForm(isLoggedIn, eventData.eventid) },
// // // //             { text: '🗑 Delete Event', onClick: () => deleteEvent(isLoggedIn, eventData.eventid), classes: ['delete-btn'] },
// // // //             { text: '📊 View Analytics', onClick: () => viewEventAnalytics(isLoggedIn, eventData.eventid), classes: ['analytics-btn'] }
// // // //         );
// // // //     } else if (isLoggedIn) {
// // // //         actions.push(
// // // //             { text: 'Report Event', onClick: () => reportPost(eventData.eventid, 'event') }
// // // //         );
// // // //     }

// // // //     return actions;
// // // // }

// // // // // --- Placeholder for Edit Form ---
// // // // function createEditPlaceholder() {
// // // //     const container = createContainer(['eventedit']);
// // // //     container.id = 'editevent';
// // // //     return container;
// // // // }

// // // // export { displayEventDetails };

// // // // --- Imports ---
// // // import { SRC_URL } from "../../state/state.js";
// // // import {
// // //     createButton,
// // //     createHeading,
// // //     createContainer,
// // //     createImage,
// // //     createLink
// // // } from "../../components/eventHelper.js";
// // // import { createElement } from "../../components/createElement.js";
// // // import { editEventForm } from "./editEvent.js";
// // // import { deleteEvent, viewEventAnalytics } from "./eventService.js";
// // // import { reportPost } from "../reporting/reporting.js";

// // // // --- Config ---
// // // const fieldConfig = [
// // //     { key: 'title', tag: 'h1', classes: ['event-title'] },
// // //     { key: 'status', tag: 'p', classes: ['event-status'] },
// // //     { key: 'date', tag: 'p', classes: ['event-date'], formatter: (d) => new Date(d).toLocaleString() },
// // //     { key: 'description', label: 'Description', tag: 'p', classes: ['event-description'] },
// // // ];

// // // // --- Utility Functions ---
// // // const createDetailItems = (config, data) => {
// // //     const details = createContainer(['eventpage-details']);
// // //     config.forEach(({ key, label, tag, classes, formatter }) => {
// // //         let value = data[key];
// // //         if (!value) return;
// // //         if (formatter) value = formatter(value);
// // //         details.appendChild(createHeading(tag, label ? `${label}: ${value}` : value, classes));
// // //     });
// // //     return details;
// // // };

// // // const createSocialLinks = (links) => {
// // //     const container = createContainer(['event-social-links']);
// // //     Object.entries(links).forEach(([platform, url]) => {
// // //         container.appendChild(
// // //             createLink({ href: url, children: [platform], classes: ['social-link'] })
// // //         );
// // //     });
// // //     return container;
// // // };

// // // const createTags = (tags) => {
// // //     const container = createContainer(['event-tags']);
// // //     tags.forEach(tag => {
// // //         container.appendChild(
// // //             createElement('span', { class: 'event-tag' }, [`#${tag}`])
// // //         );
// // //     });
// // //     return container;
// // // };

// // // const createCustomFields = (fields) => {
// // //     const container = createContainer(['event-custom-fields']);
// // //     Object.entries(fields).forEach(([field, value]) => {
// // //         container.appendChild(
// // //             createHeading('p', `${field}: ${value}`, ['custom-field'])
// // //         );
// // //     });
// // //     return container;
// // // };

// // // const createActionButtons = (actions) => {
// // //     const container = createContainer(['event-actions']);
// // //     actions.forEach(({ text, onClick, classes = [] }) => {
// // //         container.appendChild(
// // //             createButton({
// // //                 text,
// // //                 classes: ['action-btn', ...classes],
// // //                 events: { click: onClick }
// // //             })
// // //         );
// // //     });
// // //     return container;
// // // };

// // // const createPlaceLink = (placename, placeid) => {
// // //     return createElement('p', {}, [createElement('a', {href: `/place/${placeid}`}, [createElement('strong', {}, [`Place: ${placename}`])]),]);
// // // };

// // // const getEventColorClass = (type = '') => {
// // //     switch (type.toLowerCase()) {
// // //         case 'concert': return 'color-concert';
// // //         case 'workshop': return 'color-workshop';
// // //         case 'sports': return 'color-sports';
// // //         case 'meetup': return 'color-meetup';
// // //         case 'festival': return 'color-festival';
// // //         default: return 'color-default';
// // //     }
// // // };

// // // // --- Main Function ---

// // // async function displayEventDetails(content, eventData, isCreator, isLoggedIn) {
// // //     content.replaceChildren(); // More efficient than innerHTML = ''

// // //     const eventWrapper = createContainer(['event-wrapper', getEventColorClass(eventData.category)]);
// // //     const eventCard = createContainer(['event-card', 'hvflex']);

// // //     eventCard.append(
// // //         createBannerSection(eventData),
// // //         createInfoSection(eventData, isCreator, isLoggedIn)
// // //     );

// // //     eventWrapper.append(eventCard);
// // //     content.append(eventWrapper);
// // // }

// // // // Banner Section
// // // function createBannerSection(eventData) {
// // //     const bannerSection = createContainer(['banner-section']);
// // //     const bannerImage = createImage({
// // //         src: `${SRC_URL}/eventpic/banner/${eventData.eventid}.jpg`,
// // //         alt: `Banner for ${eventData.title}`,
// // //         classes: ['event-banner-image']
// // //     });
// // //     bannerSection.append(bannerImage);
// // //     return bannerSection;
// // // }

// // // // Info Section
// // // function createInfoSection(eventData, isCreator, isLoggedIn) {
// // //     const eventInfo = createContainer(['event-info']);

// // //     eventInfo.append(
// // //         createDetailItems(fieldConfig, eventData),
// // //         ...(eventData.tags?.length ? [createTags(eventData.tags)] : []),
// // //         ...(eventData.social_links ? [createSocialLinks(eventData.social_links)] : []),
// // //         ...(eventData.custom_fields ? [createCustomFields(eventData.custom_fields)] : []),
// // //         ...(eventData.placename && eventData.placeid ? [createPlaceLink(eventData.placename, eventData.placeid)] : []),
// // //         ...(createActionSection(eventData, isCreator, isLoggedIn)),
// // //         createEditPlaceholder()
// // //     );

// // //     return eventInfo;
// // // }

// // // // Action Buttons Section
// // // function createActionSection(eventData, isCreator, isLoggedIn) {
// // //     const actions = [];

// // //     if (isLoggedIn && isCreator) {
// // //         actions.push(
// // //             { text: '✏ Edit Event', onClick: () => editEventForm(isLoggedIn, eventData.eventid) },
// // //             { text: '🗑 Delete Event', onClick: () => deleteEvent(isLoggedIn, eventData.eventid), classes: ['delete-btn'] },
// // //             { text: '📊 View Analytics', onClick: () => viewEventAnalytics(isLoggedIn, eventData.eventid), classes: ['analytics-btn'] }
// // //         );
// // //     } else if (isLoggedIn) {
// // //         actions.push(
// // //             { text: 'Report Event', onClick: () => reportPost(eventData.eventid, 'event') }
// // //         );
// // //     }

// // //     return actions.length ? [createActionButtons(actions)] : [];
// // // }

// // // // Edit placeholder div
// // // function createEditPlaceholder() {
// // //     const editContainer = createContainer(['eventedit']);
// // //     editContainer.id = 'editevent';
// // //     return editContainer;
// // // }

// // // export { displayEventDetails };

// // import { SRC_URL } from "../../state/state.js";
// // import {
// //     createButton,
// //     createHeading,
// //     createContainer,
// //     createImage,
// //     createLink
// // } from "../../components/eventHelper.js";
// // import { createElement } from "../../components/createElement.js";
// // import { editEventForm } from "./editEvent.js";
// // import { deleteEvent, viewEventAnalytics } from "./eventService.js";
// // import { reportPost } from "../reporting/reporting.js";

// // // --- Config ---
// // const fieldConfig = [
// //     { key: 'title', tag: 'h1', classes: ['event-title'] },
// //     { key: 'status', tag: 'p', classes: ['event-status'] },
// //     { key: 'date', tag: 'p', classes: ['event-date'], formatter: (d) => new Date(d).toLocaleString() },
// //     { key: 'description', label: 'Description', tag: 'p', classes: ['event-description'] },
// // ];

// // // --- Utility Functions ---
// // const createDetailItems = (config, data) => {
// //     const details = createContainer(['eventpage-details']);
// //     config.forEach(({ key, label, tag, classes, formatter }) => {
// //         let value = data[key];
// //         if (!value) return;
// //         if (formatter) value = formatter(value);
// //         details.appendChild(createHeading(tag, label ? `${label}: ${value}` : value, classes));
// //     });
// //     return details;
// // };

// // const createSocialLinks = (links) => {
// //     const container = createContainer(['event-social-links']);
// //     Object.entries(links).forEach(([platform, url]) => {
// //         container.appendChild(
// //             createLink({ href: url, children: [platform], classes: ['social-link'] })
// //         );
// //     });
// //     return container;
// // };

// // const createTags = (tags) => {
// //     const container = createContainer(['event-tags']);
// //     tags.forEach(tag => {
// //         container.appendChild(createElement('span', { class: 'event-tag' }, [`#${tag}`]));
// //     });
// //     return container;
// // };

// // const createCustomFields = (fields) => {
// //     const container = createContainer(['event-custom-fields']);
// //     Object.entries(fields).forEach(([field, value]) => {
// //         container.appendChild(
// //             createHeading('p', `${field}: ${value}`, ['custom-field'])
// //         );
// //     });
// //     return container;
// // };

// // const createActionButtons = (actions) => {
// //     const container = createContainer(['event-actions']);
// //     actions.forEach(({ text, onClick, classes = [] }) => {
// //         container.appendChild(
// //             createButton({
// //                 text,
// //                 classes: ['action-btn', ...classes],
// //                 events: { click: onClick }
// //             })
// //         );
// //     });
// //     return container;
// // };

// // const createPlaceLink = (placename, placeid) => {
// //     return createElement('p', {}, [
// //         createElement('a', { href: `/place/${placeid}` }, [
// //             createElement('strong', {}, [`Place: ${placename}`])
// //         ])
// //     ]);
// // };

// // const getEventColorClass = (type = '') => {
// //     switch (type.toLowerCase()) {
// //         case 'concert': return 'color-concert';
// //         case 'workshop': return 'color-workshop';
// //         case 'sports': return 'color-sports';
// //         case 'meetup': return 'color-meetup';
// //         case 'festival': return 'color-festival';
// //         default: return 'color-default';
// //     }
// // };

// // // --- New Helper Features ---
// // const getSavedEvents = () => {
// //     try {
// //         return JSON.parse(localStorage.getItem("saved_events") || "[]");
// //     } catch {
// //         return [];
// //     }
// // };

// // const toggleSaveEvent = (id) => {
// //     let saved = getSavedEvents();
// //     if (saved.includes(id)) {
// //         saved = saved.filter(eid => eid !== id);
// //     } else {
// //         saved.push(id);
// //     }
// //     localStorage.setItem("saved_events", JSON.stringify(saved));
// // };

// // const createSaveButton = (eventid) => {
// //     const isSaved = getSavedEvents().includes(eventid);
// //     const icon = createElement("span", {
// //         style: `cursor:pointer;font-size:20px;color:${isSaved ? "gold" : "gray"}`,
// //         title: "Save Event"
// //     }, [isSaved ? "★" : "☆"]);

// //     icon.addEventListener("click", () => {
// //         toggleSaveEvent(eventid);
// //         const nowSaved = getSavedEvents().includes(eventid);
// //         icon.textContent = nowSaved ? "★" : "☆";
// //         icon.style.color = nowSaved ? "gold" : "gray";
// //     });

// //     return icon;
// // };

// // const createShareButton = (eventid) => {
// //     const btn = createButton({
// //         text: "Share",
// //         classes: ["share-btn"],
// //         events: {
// //             click: () => {
// //                 navigator.clipboard.writeText(location.origin + `/event/${eventid}`);
// //                 btn.textContent = "Link Copied";
// //                 setTimeout(() => btn.textContent = "Share", 1500);
// //             }
// //         }
// //     });
// //     return btn;
// // };

// // const createStatusBadge = (eventDate) => {
// //     const now = Date.now();
// //     const time = new Date(eventDate).getTime();
// //     const isPast = time < now;
// //     const label = isPast ? "Past" : "Upcoming";
// //     const bg = isPast ? "#999" : "#28a745";
// //     return createElement("span", {
// //         style: `font-size:0.75rem;padding:2px 6px;border-radius:4px;background:${bg};color:white;margin-left:8px;`
// //     }, [label]);
// // };

// // const createCountdown = (eventDate) => {
// //     const now = Date.now();
// //     const msLeft = new Date(eventDate).getTime() - now;
// //     if (msLeft <= 0) return null;

// //     const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
// //     const hours = Math.floor(msLeft / (1000 * 60 * 60)) % 24;
// //     const label = days > 0 ? `${days} day(s)` : `${hours} hour(s)`;
// //     return createElement("p", { class: "event-countdown" }, [`Starts in ${label}`]);
// // };

// // // --- Main Function ---
// // async function displayEventDetails(content, eventData, isCreator, isLoggedIn) {
// //     content.replaceChildren();

// //     const eventWrapper = createContainer(['event-wrapper', getEventColorClass(eventData.category)]);
// //     const eventCard = createContainer(['event-card', 'hvflex']);

// //     eventCard.append(
// //         createBannerSection(eventData),
// //         createInfoSection(eventData, isCreator, isLoggedIn)
// //     );

// //     eventWrapper.append(eventCard);
// //     content.append(eventWrapper);
// // }

// // // Banner Section
// // function createBannerSection(eventData) {
// //     const bannerSection = createContainer(['banner-section']);
// //     const bannerImage = createImage({
// //         src: `${SRC_URL}/eventpic/banner/${eventData.eventid}.jpg`,
// //         alt: `Banner for ${eventData.title}`,
// //         classes: ['event-banner-image']
// //     });

// //     bannerImage.onerror = () => {
// //         bannerImage.src = `${SRC_URL}/default/banner.jpg`;
// //     };

// //     bannerSection.append(bannerImage);
// //     return bannerSection;
// // }

// // // Info Section
// // function createInfoSection(eventData, isCreator, isLoggedIn) {
// //     const eventInfo = createContainer(['event-info']);

// //     const topRow = createContainer(['event-header-row']);
// //     const detailBlock = createDetailItems(fieldConfig, eventData);
// //     const statusBadge = createStatusBadge(eventData.date);
// //     const countdown = createCountdown(eventData.date);

// //     const saveBtn = createSaveButton(eventData.eventid);
// //     const shareBtn = createShareButton(eventData.eventid);

// //     topRow.append(detailBlock, statusBadge, saveBtn);

// //     eventInfo.append(
// //         topRow,
// //         ...(countdown ? [countdown] : []),
// //         ...(eventData.tags?.length ? [createTags(eventData.tags)] : []),
// //         ...(eventData.social_links ? [createSocialLinks(eventData.social_links)] : []),
// //         ...(eventData.custom_fields ? [createCustomFields(eventData.custom_fields)] : []),
// //         ...(eventData.placename && eventData.placeid ? [createPlaceLink(eventData.placename, eventData.placeid)] : []),
// //         createElement("div", { class: "event-actions" }, [shareBtn]),
// //         ...(createActionSection(eventData, isCreator, isLoggedIn)),
// //         createEditPlaceholder()
// //     );

// //     return eventInfo;
// // }

// // // Action Buttons
// // function createActionSection(eventData, isCreator, isLoggedIn) {
// //     const actions = [];

// //     if (isLoggedIn && isCreator) {
// //         actions.push(
// //             { text: '✏ Edit Event', onClick: () => editEventForm(isLoggedIn, eventData.eventid) },
// //             { text: '🗑 Delete Event', onClick: () => deleteEvent(isLoggedIn, eventData.eventid), classes: ['delete-btn'] },
// //             { text: '📊 View Analytics', onClick: () => viewEventAnalytics(isLoggedIn, eventData.eventid), classes: ['analytics-btn'] }
// //         );
// //     } else if (isLoggedIn) {
// //         actions.push(
// //             { text: 'Report Event', onClick: () => reportPost(eventData.eventid, 'event') }
// //         );
// //     }

// //     return actions.length ? [createActionButtons(actions)] : [];
// // }

// // function createEditPlaceholder() {
// //     const editContainer = createContainer(['eventedit']);
// //     editContainer.id = 'editevent';
// //     return editContainer;
// // }

// // export { displayEventDetails };
