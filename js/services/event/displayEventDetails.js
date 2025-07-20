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

// // --- Config ---
// const fieldConfig = [
//     { key: 'status', tag: 'p', classes: ['event-status'] },
// ];

// // --- Utility Functions ---
// const createTags = (tags) => {
//     const container = createContainer(['event-tags']);
//     tags.forEach(tag => {
//         container.appendChild(
//             createElement('span', { class: 'event-tag' }, [`#${tag}`])
//         );
//     });
//     return container;
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

// const createCustomFields = (fields) => {
//     const container = createContainer(['event-custom-fields']);
//     Object.entries(fields).forEach(([field, value]) => {
//         container.appendChild(
//             createHeading('p', `${field}: ${value}`, ['custom-field'])
//         );
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

// // --- Main Display Function ---
// async function displayEventDetails(content, eventData, isCreator, isLoggedIn) {
//     content.replaceChildren();

//     const wrapper = createContainer(['event-wrapper', getEventColorClass(eventData.category)]);
//     wrapper.append(
//         createBannerSection(eventData),
//         createBodySection(eventData, isCreator, isLoggedIn)
//     );

//     const footer = createFooterActions(eventData, isCreator, isLoggedIn);
//     if (footer) wrapper.append(footer);

//     content.append(wrapper);
// }

// // --- Banner Section ---
// function createBannerSection(eventData) {
//     const section = createContainer(['event-banner']);
//     section.style = `background-image: url(${SRC_URL}/eventpic/banner/${eventData.eventid}.jpg)`;

//     const overlay = createContainer(['banner-overlay']);
//     const title = createHeading('h1', eventData.title, ['event-title']);
//     const date = createHeading('p', new Date(eventData.date).toLocaleString(), ['event-date']);

//     overlay.append(title, date);
//     section.append(overlay);
//     return section;
// }

// // --- Body Section ---
// function createBodySection(eventData, isCreator, isLoggedIn) {
//     const body = createContainer(['event-body']);

//     const meta = createContainer(['event-meta']);
//     fieldConfig.forEach(({ key, tag, classes }) => {
//         const value = eventData[key];
//         if (value) meta.appendChild(createHeading(tag, value, classes));
//     });

//     if (eventData.tags?.length) meta.append(createTags(eventData.tags));
//     if (eventData.placename && eventData.placeid) meta.append(createPlaceLink(eventData.placename, eventData.placeid));
//     if (eventData.social_links) meta.append(createSocialLinks(eventData.social_links));

//     const description = createContainer(['event-description']);
//     if (eventData.description) {
//         description.append(createHeading('p', eventData.description, ['event-desc']));
//     }
//     if (eventData.custom_fields) {
//         description.append(createCustomFields(eventData.custom_fields));
//     }

//     const actions = createActionSection(eventData, isCreator, isLoggedIn);
//     if (actions.length) {
//         const mobileActions = createActionButtons(actions);
//         mobileActions.classList.add('actions-mobile');
//         description.append(mobileActions);
//     }

//     body.append(meta, description, createEditPlaceholder());
//     return body;
// }

// // --- Footer Actions (desktop) ---
// function createFooterActions(eventData, isCreator, isLoggedIn) {
//     const actions = createActionSection(eventData, isCreator, isLoggedIn);
//     if (!actions.length) return null;

//     const container = createContainer(['event-footer-actions']);
//     container.append(createActionButtons(actions));
//     return container;
// }

// // --- Action Section Logic ---
// function createActionSection(eventData, isCreator, isLoggedIn) {
//     const actions = [];

//     if (isLoggedIn && isCreator) {
//         actions.push(
//             { text: '✏ Edit Event', onClick: () => editEventForm(isLoggedIn, eventData.eventid) },
//             { text: '🗑 Delete Event', onClick: () => deleteEvent(isLoggedIn, eventData.eventid), classes: ['delete-btn'] },
//             { text: '📊 View Analytics', onClick: () => viewEventAnalytics(isLoggedIn, eventData.eventid), classes: ['analytics-btn'] }
//         );
//     } else if (isLoggedIn) {
//         actions.push(
//             { text: 'Report Event', onClick: () => reportPost(eventData.eventid, 'event') }
//         );
//     }

//     return actions;
// }

// // --- Placeholder for Edit Form ---
// function createEditPlaceholder() {
//     const container = createContainer(['eventedit']);
//     container.id = 'editevent';
//     return container;
// }

// export { displayEventDetails };

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
    const details = createContainer(['eventpage-details']);
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
