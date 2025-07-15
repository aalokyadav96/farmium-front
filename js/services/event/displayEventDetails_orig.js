// --- Imports ---
import { SRC_URL } from "../../state/state.js";
import {
    createButton,
    createHeading,
    createContainer,
    createImage,
    createLink
} from "../../components/eventHelper.js";
import { createElement } from "../../components/createElement.js";
import { editEventForm } from "./editEvent.js";
import { deleteEvent, viewEventAnalytics } from "./eventService.js";
import { reportPost } from "../reporting/reporting.js";

// --- Config ---
const fieldConfig = [
    { key: 'title', tag: 'h1', classes: ['event-title'] },
    { key: 'status', tag: 'p', classes: ['event-status'] },
    { key: 'date', tag: 'p', classes: ['event-date'], formatter: (d) => new Date(d).toLocaleString() },
    { key: 'description', label: 'Description', tag: 'p', classes: ['event-description'] },
];

// --- Utility Functions ---
const createDetailItems = (config, data) => {
    const details = createContainer(['event-details']);
    config.forEach(({ key, label, tag, classes, formatter }) => {
        let value = data[key];
        if (!value) return;
        if (formatter) value = formatter(value);
        details.appendChild(createHeading(tag, label ? `${label}: ${value}` : value, classes));
    });
    return details;
};

const createSocialLinks = (links) => {
    const container = createContainer(['event-social-links']);
    Object.entries(links).forEach(([platform, url]) => {
        container.appendChild(
            createLink({ href: url, children: [platform], classes: ['social-link'] })
        );
    });
    return container;
};

const createTags = (tags) => {
    const container = createContainer(['event-tags']);
    tags.forEach(tag => {
        container.appendChild(
            createElement('span', { class: 'event-tag' }, [`#${tag}`])
        );
    });
    return container;
};

const createCustomFields = (fields) => {
    const container = createContainer(['event-custom-fields']);
    Object.entries(fields).forEach(([field, value]) => {
        container.appendChild(
            createHeading('p', `${field}: ${value}`, ['custom-field'])
        );
    });
    return container;
};

const createActionButtons = (actions) => {
    const container = createContainer(['event-actions']);
    actions.forEach(({ text, onClick, classes = [] }) => {
        container.appendChild(
            createButton({
                text,
                classes: ['action-btn', ...classes],
                events: { click: onClick }
            })
        );
    });
    return container;
};

// const createPlaceLink = (placename, placeid) => {
//     return createElement('p', {}, [
//         createElement('strong', {}, [`Place: ${placename}`]),
//         createElement('a', {href: `/place/${placeid}`}, [`Place: ${placename}`]),
//         // createLink({ href: `/place/${placeid}`, children: [placename] })
//     ]);
// };

const createPlaceLink = (placename, placeid) => {
    return createElement('p', {}, [createElement('a', {href: `/place/${placeid}`}, [createElement('strong', {}, [`Place: ${placename}`])]),]);
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

// --- Main Function ---

// async function displayEventDetails(content, eventData, isCreator, isLoggedIn) {
//     content.innerHTML = '';

//     const eventWrapper = createContainer(['event-wrapper', getEventColorClass(eventData.category)]);
//     const eventCard = createContainer(['event-card', 'hvflex']);

//     // --- Banner Section ---
//     const bannerSection = createContainer(['banner-section']);
//     const bannerImage = createImage({
//         src: `${SRC_URL}/eventpic/banner/${eventData.eventid}.jpg`,
//         alt: `Banner for ${eventData.title}`,
//         classes: ['event-banner-image'],
//     });
//     bannerSection.appendChild(bannerImage);

//     // --- Event Info Section ---
//     const eventInfo = createContainer(['event-info']);
//     eventInfo.appendChild(createDetailItems(fieldConfig, eventData));

//     if (eventData.tags?.length) eventInfo.appendChild(createTags(eventData.tags));
//     if (eventData.social_links) eventInfo.appendChild(createSocialLinks(eventData.social_links));
//     if (eventData.custom_fields) eventInfo.appendChild(createCustomFields(eventData.custom_fields));

//     if (eventData.placename && eventData.placeid) {
//         eventInfo.appendChild(createPlaceLink(eventData.placename, eventData.placeid));
//     }

//     // --- Actions ---
//     const actions = [];
//     if (isLoggedIn && isCreator) {
//         actions.push(
//             { text: '✏ Edit Event', onClick: () => editEventForm(isLoggedIn, eventData.eventid) },
//             { text: '🗑 Delete Event', onClick: () => deleteEvent(isLoggedIn, eventData.eventid), classes: ['delete-btn'] },
//             { text: '📊 View Analytics', onClick: () => viewEventAnalytics(isLoggedIn, eventData.eventid), classes: ['analytics-btn'] }
//         );
//     } else if (isLoggedIn) {
//         actions.push(
//             { text: 'Report Event', onClick: () => reportPost(eventData.eventid, "event") }
//         );
//     }

//     if (actions.length) eventInfo.appendChild(createActionButtons(actions));

//     // --- Edit Placeholder (for injected editor UI) ---
//     const editContainer = createContainer(['eventedit']);
//     editContainer.id = "editevent";
//     eventInfo.appendChild(editContainer);

//     // --- Final Assembly ---
//     eventCard.appendChild(bannerSection);
//     eventCard.appendChild(eventInfo);
//     eventWrapper.appendChild(eventCard);
//     // content.append(bannerSection, eventWrapper);
//     content.append(eventWrapper);
// }

async function displayEventDetails(content, eventData, isCreator, isLoggedIn) {
    content.replaceChildren(); // More efficient than innerHTML = ''

    const eventWrapper = createContainer(['event-wrapper', getEventColorClass(eventData.category)]);
    const eventCard = createContainer(['event-card', 'hvflex']);

    eventCard.append(
        createBannerSection(eventData),
        createInfoSection(eventData, isCreator, isLoggedIn)
    );

    eventWrapper.append(eventCard);
    content.append(eventWrapper);
}

// Banner Section
function createBannerSection(eventData) {
    const bannerSection = createContainer(['banner-section']);
    const bannerImage = createImage({
        src: `${SRC_URL}/eventpic/banner/${eventData.eventid}.jpg`,
        alt: `Banner for ${eventData.title}`,
        classes: ['event-banner-image']
    });
    bannerSection.append(bannerImage);
    return bannerSection;
}

// Info Section
function createInfoSection(eventData, isCreator, isLoggedIn) {
    const eventInfo = createContainer(['event-info']);

    eventInfo.append(
        createDetailItems(fieldConfig, eventData),
        ...(eventData.tags?.length ? [createTags(eventData.tags)] : []),
        ...(eventData.social_links ? [createSocialLinks(eventData.social_links)] : []),
        ...(eventData.custom_fields ? [createCustomFields(eventData.custom_fields)] : []),
        ...(eventData.placename && eventData.placeid ? [createPlaceLink(eventData.placename, eventData.placeid)] : []),
        ...(createActionSection(eventData, isCreator, isLoggedIn)),
        createEditPlaceholder()
    );

    return eventInfo;
}

// Action Buttons Section
function createActionSection(eventData, isCreator, isLoggedIn) {
    const actions = [];

    if (isLoggedIn && isCreator) {
        actions.push(
            { text: '✏ Edit Event', onClick: () => editEventForm(isLoggedIn, eventData.eventid) },
            { text: '🗑 Delete Event', onClick: () => deleteEvent(isLoggedIn, eventData.eventid), classes: ['delete-btn'] },
            { text: '📊 View Analytics', onClick: () => viewEventAnalytics(isLoggedIn, eventData.eventid), classes: ['analytics-btn'] }
        );
    } else if (isLoggedIn) {
        actions.push(
            { text: 'Report Event', onClick: () => reportPost(eventData.eventid, 'event') }
        );
    }

    return actions.length ? [createActionButtons(actions)] : [];
}

// Edit placeholder div
function createEditPlaceholder() {
    const editContainer = createContainer(['eventedit']);
    editContainer.id = 'editevent';
    return editContainer;
}

export { displayEventDetails };

// // --- Imports ---
// import { SRC_URL } from "../../state/state.js";
// import {
//     createButton,
//     createHeading,
//     createContainer,
//     createImage,
//     createLink
// } from "../../components/eventHelper.js";
// import { createElement } from "../../components/createElement.js";
// import { editEventForm } from "./editEvent.js";
// import { deleteEvent, viewEventAnalytics } from "./eventService.js";
// import { reportPost } from "../reporting/reporting.js";

// // --- Config for Display Fields ---
// const fieldConfig = [
//     { key: 'title', tag: 'h1', classes: ['event-title'] },
//     { key: 'description', label: 'Description', tag: 'p', classes: ['event-description'] },
//     { key: 'status', tag: 'p', classes: ['event-status'] },
//     { key: 'date', tag: 'p', classes: ['event-date'], formatter: (d) => new Date(d).toLocaleString() },
// ];

// // --- Helper Functions ---

// const createDetailItems = (config, data, parent) => {
//     config.forEach(({ key, label, tag, classes, formatter }) => {
//         let value = data[key];
//         if (!value) return;
//         if (formatter) value = formatter(value);
//         parent.appendChild(createHeading(tag, label ? `${label}: ${value}` : value, classes));
//     });
// };

// const createSocialLinks = (links) => {
//     const container = createContainer(['event-social-links']);
//     Object.entries(links).forEach(([platform, url]) => {
//         container.appendChild(
//             createLink({ href: url, children: [platform], classes: ['social-link'] })
//         );
//     });
//     return container;
// };

// const createTags = (tags) => {
//     const container = createContainer(['event-tags']);
//     tags.forEach(tag => {
//         container.appendChild(
//             createElement('span', { class: 'event-tag' }, [`#${tag}`])
//         );
//     });
//     return container;
// };

// const createCustomFields = (fields) => {
//     const container = createContainer(['event-custom-fields']);
//     Object.entries(fields).forEach(([field, value]) => {
//         container.appendChild(
//             createHeading('p', `${field}: ${value}`, ['custom-field'])
//         );
//     });
//     return container;
// };

// const createActionButtons = (actions) => {
//     const container = createContainer(['event-actions']);
//     actions.forEach(({ text, onClick, classes = [] }) => {
//         container.appendChild(
//             createButton({
//                 text,
//                 classes: ['action-btn', ...classes],
//                 events: { click: onClick }
//             })
//         );
//     });
//     return container;
// };

// // --- Main Display Function ---

// async function displayEventDetails(content, eventData, isCreator, isLoggedIn) {
//     content.innerHTML = '';
//     // content.setAttribute("class", getEventColorClass(eventData.category));

//     // Main Wrapper
//     // const eventWrapper = createContainer(['event-wrapper']);
//     // const eventCard = createContainer(['event-card', 'hvflex']);
//     // const eventWrapper = createContainer(['event-wrapper', getEventColorClass(eventData.category)]); // ✨ Added auto-color class
//     const eventWrapper = createContainer(['event-wrapper']); // ✨ Added auto-color class
//     const eventCard = createContainer(['event-card', 'hvflex']);

//     // Banner
//     const bannerSection = createContainer(['banner-section']);
//     const bannerImage = createImage({
//         src: `${SRC_URL}/eventpic/banner/${eventData.eventid}.jpg`,
//         alt: `Banner for ${eventData.title}`,
//         classes: ['event-banner-image'],
//     });
//     bannerSection.appendChild(bannerImage);

//     // Event Info
//     const eventInfo = createContainer(['event-info']);
//     createDetailItems(fieldConfig, eventData, eventInfo);

//     // Optional Sections
//     if (eventData.social_links) eventInfo.appendChild(createSocialLinks(eventData.social_links));
//     if (eventData.tags?.length) eventInfo.appendChild(createTags(eventData.tags));
//     if (eventData.custom_fields) eventInfo.appendChild(createCustomFields(eventData.custom_fields));

//     if (isLoggedIn && !isCreator) {
//         const actions = [
//             { text: 'Report Event', onClick: () => reportPost(eventData.eventid, "event") },
//         ];
//         eventInfo.appendChild(createActionButtons(actions));
//     }

//     // Action Buttons (for creator)
//     if (isLoggedIn && isCreator) {
//         const actions = [
//             { text: '✏ Edit Event', onClick: () => editEventForm(isLoggedIn, eventData.eventid) },
//             { text: '🗑 Delete Event', onClick: () => deleteEvent(isLoggedIn, eventData.eventid), classes: ['delete-btn'] },
//             { text: '📊 View Analytics', onClick: () => viewEventAnalytics(isLoggedIn, eventData.eventid), classes: ['analytics-btn'] },
//         ];
//         eventInfo.appendChild(createActionButtons(actions));
//     }

//     // Place Link
//     if (eventData.placename && eventData.placeid) {
//         eventInfo.appendChild(
//             createElement('p', {}, [
//                 createElement('strong', {}, [`Place: ${eventData.placename}`]),
//                 createLink({ href: `/place/${eventData.placeid}`, children: [eventData.placename] })
//             ])
//         );
//     }

//     // Edit Placeholder
//     const editContainer = createContainer(['eventedit']);
//     editContainer.id = "editevent";
//     eventInfo.appendChild(editContainer);

//     // Assemble Card
//     eventCard.append(bannerSection, eventInfo);
//     eventWrapper.appendChild(eventCard);

//     // Final Append
//     content.appendChild(eventWrapper);
// }

// // --- New: Event Color Helper ---
// const getEventColorClass = (eventType = '') => {
//     const type = eventType.toLowerCase();
//     switch (type) {
//         case 'concert': return 'color-concert';
//         case 'workshop': return 'color-workshop';
//         case 'sports': return 'color-sports';
//         case 'meetup': return 'color-meetup';
//         case 'festival': return 'color-festival';
//         default: return 'color-default'; // fallback
//     }
// };

// export { displayEventDetails };
