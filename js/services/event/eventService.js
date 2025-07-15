// --- Imports ---
import { state } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import { navigate } from "../../routes/index.js";
import SnackBar from "../../components/ui/Snackbar.mjs";
import { createElement } from "../../components/createElement.js";
import { createTabs } from "../../components/ui/createTabs.js";

import { displayEventDetails } from "./displayEventDetails.js";
import { displayEventVenue, displayEventFAQ, displayEventReviews, displayLostAndFound, displayContactDetails } from "./eventTabs.js";
import { updateEvent, editEventForm } from "./editEvent.js";
import { displayTickets } from "../tickets/ticketService.js";
import { displayMerchandise } from "../merch/merchService.js";
import { displayMedia } from "../media/mediaService.js";


// --- Helpers ---

const confirmAndExecute = async (message, action, successMessage, errorMessage) => {
    if (confirm(message)) {
        try {
            await action();
            SnackBar(successMessage, 3000);
        } catch (error) {
            SnackBar(`${errorMessage}: ${error.message}`, 3000);
        }
    }
};

const getEventStatus = (eventDate) => new Date(eventDate) <= new Date() ? "ongoing" : "active";

const createSection = (parent) => {
    const section = createElement("section", { class: "event-section" });
    parent.appendChild(section);
    return section;
};

const createVenue = async (container, eventId, isLoggedIn) => {
    const venueContainer = createElement('div', { id: 'event-venue', class: 'venue-container' });
    await displayEventVenue(venueContainer, isLoggedIn, eventId);
    container.appendChild(venueContainer);
};

// --- Core Functions ---

// Delete Event
async function deleteEvent(isLoggedIn, eventId) {
    if (!isLoggedIn) return SnackBar("Please log in to delete your event.", 3000);

    await confirmAndExecute(
        "Are you sure you want to delete this event?",
        () => apiFetch(`/events/event/${eventId}`, "DELETE").then(() => navigate("/events")),
        "Event deleted successfully.",
        "Error deleting event"
    );
}

// View Analytics (placeholder)
async function viewEventAnalytics(isLoggedIn) {
    if (!isLoggedIn) return SnackBar("Please log in to view your event analytics.", 3000);
    confirm("Do you want to view event analytics?");
}

// Fetch Event Data
async function fetchEventData(eventId) {
    const eventData = await apiFetch(`/events/event/${eventId}`);
    if (!eventData || !Array.isArray(eventData.tickets)) {
        throw new Error("Invalid event data received.");
    }
    return eventData;
}

// Setup Event Tabs
const setupTabs = (eventData, eventId, isCreator, isLoggedIn) => {
    const tabs = [];
    const status = getEventStatus(eventData.date);

    if (status === "active") {
        tabs.push(
            { title: "FAQ", id: "faq-tab", render: (c) => displayEventFAQ(c, isCreator, eventId, eventData.faqs) },
            { title: "Tickets", id: "tickets-tab", render: (c) => displayTickets(c, eventData.tickets, eventId, isCreator, isLoggedIn) },
            { title: "Merchandise", id: "merch-tab", render: (c) => displayMerchandise(c, eventData.merch, "event", eventId, isCreator, isLoggedIn) },
        );
    } else {
        tabs.push(
            { title: "Reviews", id: "reviews-tab", render: (c) => displayEventReviews(c, eventId, isCreator, isLoggedIn) },
            { title: "Media", id: "media-tab", render: (c) => displayMedia(c, "event", eventId, isLoggedIn) },
            { title: "Lost & Found", id: "lnf-tab", render: (c) => displayLostAndFound(c, eventData.lostandfound) },
            { title: "Contact", id: "contact-tab", render: (c) => displayContactDetails(c, eventData.contactInfo) }
        );
    }

    return tabs;
};

// Display Full Event
async function displayEvent(isLoggedIn, eventId, content) {
    content.innerHTML = "";
    let container = createElement('div',{"class":"eventpage"},[]);

    content.innerHTML = "";
    content.appendChild(container);
    try {
        container.innerHTML = "";
        const eventData = await fetchEventData(eventId);
        const isCreator = isLoggedIn && state.user === eventData.creatorid;

        await displayEventDetails(container, eventData, isCreator, isLoggedIn);

        container.appendChild(createElement('div', {id:"edittabs"}));

        const tabs = setupTabs(eventData, eventId, isCreator, isLoggedIn);
        container.appendChild(createTabs(tabs));

        if (eventData.seatingplan) {
            await createVenue(container, eventData.eventid, isLoggedIn);
        }

    } catch (error) {
        container.innerHTML = "";
        container.appendChild(
            createElement("h1", { textContent: `Error loading event details: ${error.message}` })
        );
        SnackBar("Failed to load event details. Please try again later.", 3000);
    }
}

// Display Sections (direct sections instead of tabs)
async function displayEventSections(wrapper, eventData, isCreator, isLoggedIn) {
    wrapper.innerHTML = "";

    await displayEventDetails(wrapper, eventData, isCreator, isLoggedIn);

    const tabsContainer = createElement("div", { class: "tabs-container" });
    wrapper.appendChild(tabsContainer);

    const sections = [
        { check: eventData.tickets?.length, render: () => displayTickets(createSection(tabsContainer), eventData.tickets, eventData.eventid, isCreator, isLoggedIn) },
        { check: eventData.faqs?.length, render: () => displayEventFAQ(createSection(tabsContainer), isCreator, eventData.eventid, eventData.faqs) },
        { check: eventData.merch?.length, render: () => displayMerchandise(createSection(tabsContainer), eventData.merch, eventData.eventid, isCreator, isLoggedIn) },
        { check: eventData.reviews?.length, render: () => displayEventReviews(createSection(tabsContainer), eventData.eventid, isCreator, isLoggedIn) },
        { check: eventData.media?.length, render: () => displayMedia(createSection(tabsContainer), "event", eventData.eventid, isLoggedIn) },
        { check: eventData.lostandfound?.length, render: () => displayLostAndFound(createSection(tabsContainer), eventData.lostandfound) },
        { check: eventData.contactInfo, render: () => displayContactDetails(createSection(tabsContainer), eventData.contactInfo) }
    ];

    sections.forEach(({ check, render }) => check && render());
}

// --- Exports ---
export {
    updateEvent,
    editEventForm,
    fetchEventData,
    displayEvent,
    displayEventSections,
    deleteEvent,
    viewEventAnalytics
};


// // import { state } from "../../state/state.js";
// // import { apiFetch } from "../../api/api.js";
// // import { navigate } from "../../routes/index.js";
// // import SnackBar from "../../components/ui/Snackbar.mjs";
// // import { createElement } from "../../components/createElement.js";
// // import { createTabs } from "../../components/ui/createTabs.js";

// // import { displayEventDetails } from "./displayEventDetails.js";
// // import { displayEventVenue } from "./eventTabs.js";
// // import { updateEvent, editEventForm } from "./editEvent.js";
// // import { displayTickets } from "../tickets/ticketService.js";
// // import { displayMerchandise } from "../merch/merchService.js";
// // import { displayMedia } from "../media/mediaService.js";

// // import {
// //     displayEventFAQ,
// //     displayEventReviews,
// //     // displayEventSchedule,
// //     // displayLivestream,
// //     displayLostAndFound,
// //     displayContactDetails
// // } from "./eventTabs.js";

// // // 🗑 Delete Event
// // async function deleteEvent(isLoggedIn, eventId) {
// //     if (!isLoggedIn) return SnackBar("Please log in to delete your event.", 3000);

// //     if (confirm("Are you sure you want to delete this event?")) {
// //         try {
// //             await apiFetch(`/events/event/${eventId}`, 'DELETE');
// //             SnackBar("Event deleted successfully.", 3000);
// //             navigate('/events');
// //         } catch (error) {
// //             SnackBar(`Error deleting event: ${error.message}`, 3000);
// //         }
// //     }
// // }

// // // 📊 Analytics (Placeholder for now)
// // async function viewEventAnalytics(isLoggedIn, eventId) {
// //     if (!isLoggedIn) return SnackBar("Please log in to view your event analytics.", 3000);
// //     if (confirm("Do you want to view event analytics?")) {
// //         // TODO: Implement logic
// //     }
// // }

// // // 📥 Fetch Event Data
// // async function fetchEventData(eventId) {
// //     const eventData = await apiFetch(`/events/event/${eventId}`);
// //     if (!eventData || !Array.isArray(eventData.tickets)) {
// //         throw new Error("Invalid event data received.");
// //     }
// //     return eventData;
// // }

// // // 📄 Main Event Display
// // // async function displayEvent(isLoggedIn, eventId, container) {
// // //     try {
// // //         const eventData = await fetchEventData(eventId);
// // //         const isCreator = isLoggedIn && state.user === eventData.creatorid;

// // //         container.innerHTML = '';

// // //         const wrapper = createElement('div');
// // //         await displayEventSections(wrapper, eventData, isCreator, isLoggedIn);

// // //         container.appendChild(wrapper);
// // //     } catch (error) {
// // //         container.innerHTML = '';
// // //         container.appendChild(
// // //             createElement('h1', { textContent: `Error loading event details: ${error.message}` })
// // //         );
// // //         SnackBar("Failed to load event details. Please try again later.", 3000);
// // //     }
// // // }


// // async function displayEvent(isLoggedIn, eventId, contentContainer) {
// //     try {
// //         const eventData = await fetchEventData(eventId);
// //         const isCreator = isLoggedIn && state.user === eventData.creatorid;

// //         contentContainer.innerHTML = '';
// //         await displayEventDetails(contentContainer, eventData, isCreator, isLoggedIn);

// //         // let container = document.createElement('div');
// //         // contentContainer.appendChild(container);

// //         const tabs = [
// //             // { title: 'Reviews', id: 'reviews-tab', render: (container) => displayEventReviews(container, eventId, isCreator, isLoggedIn) },
// //             // { title: 'Media', id: 'media-tab', render: (container) => displayMedia(container, 'event', eventId, isLoggedIn) },
// //         ];

// //         // let estatus = eventData.status;
// //         // let estatus = "ongoing";

// //         const then = new Date(eventData.date)
// //         const now = new Date();
// //         let timediff = then - now;
// //         let estatus = timediff <= 0 ? "ongoing" : "active";

// //         // Dynamically add tabs based on event status
// //         if (estatus === "active") {
// //             tabs.push(
// //                 { title: 'Tickets', id: 'tickets-tab', render: (container) => displayTickets(container, eventData.tickets, eventId, isCreator, isLoggedIn) },
// //                 { title: 'Merchandise', id: 'merch-tab', render: (container) => displayMerchandise(container, eventData.merch, "event", eventId, isCreator, isLoggedIn) },
// //                 { title: 'FAQ', id: 'faq-tab', render: (container) => displayEventFAQ(container, isCreator, eventId, eventData.faqs) },
// //                 // { title: 'Schedule', id: 'schedule-tab', render: (container) => displayEventSchedule(container, isCreator, eventData.schedule) },
// //             );
// //         } else if (estatus === "ongoing") {
// //             tabs.push(
// //                 // { title: 'Livestream', id: 'livestream-tab', render: (container) => displayLivestream(container, eventId, isLoggedIn) },
// //                 { title: 'Reviews', id: 'reviews-tab', render: (container) => displayEventReviews(container, eventId, isCreator, isLoggedIn) },
// //                 { title: 'Media', id: 'media-tab', render: (container) => displayMedia(container, 'event', eventId, isLoggedIn) },
// //                 { title: 'Lost & Found', id: 'lnf-tab', render: (container) => displayLostAndFound(container, eventData.lostandfound) },
// //                 { title: 'Contact', id: 'contact-tab', render: (container) => displayContactDetails(container, eventData.contactInfo) }
// //             );
// //         }

// //         const tabContainer = createTabs(tabs);
// //         contentContainer.appendChild(tabContainer);

// //         // const tabContainer = createTabs(tabs, 'tickets-tab');

// //     if (eventData.seatingplan) {
// //         // Venue Details
// //         const eventVenue = createElement('div',{id:'event-venue', "class":'tabs-container'},[]);
// //         await displayEventVenue(eventVenue, isLoggedIn, eventData.eventid);

// //         contentContainer.appendChild(eventVenue);
// //     }

// //         // contentContainer.appendChild(tabContainer);
// //     } catch (error) {
// //         contentContainer.innerHTML = '';
// //         contentContainer.appendChild(createElement('h1', { textContent: `Error loading event details: ${error.message}` }));
// //         SnackBar("Failed to load event details. Please try again later.", 3000);
// //     }
// // }



// // // 🧱 Display All Sections
// // async function displayEventSections(wrapper, eventData, isCreator, isLoggedIn) {
// //     console.log(eventData);
// //     wrapper.innerHTML = '';

// //     // 1. Main Event Overview
// //     await displayEventDetails(wrapper, eventData, isCreator, isLoggedIn);

// //     // 2. Tabs Container
// //     const tabsContainer = createElement('div', { class: 'tabs-container' });
// //     wrapper.appendChild(tabsContainer);

// //     // 3. Dynamically add sections
// //     const sections = [
// //         {
// //             condition: eventData.tickets?.length,
// //             renderer: () => displayTickets(section(), eventData.tickets, eventData.eventid, isCreator, isLoggedIn)
// //         },
// //         {
// //             condition: eventData.faqs?.length,
// //             renderer: () => displayEventFAQ(section(), isCreator, eventData.eventid, eventData.faqs)
// //         },
// //         {
// //             condition: eventData.merch?.length,
// //             renderer: () => displayMerchandise(section(), eventData.merch, eventData.eventid, isCreator, isLoggedIn)
// //         },
// //         // {
// //         //     condition: eventData.schedule?.length,
// //         //     renderer: () => displayEventSchedule(section(), isCreator, eventData.schedule)
// //         // },
// //         // {
// //         //     condition: eventData.livestreamLink,
// //         //     renderer: () => displayLivestream(section(), eventData.eventid, isLoggedIn)
// //         // },
// //         {
// //             condition: eventData.reviews?.length,
// //             renderer: () => displayEventReviews(section(), eventData.eventid, isCreator, isLoggedIn)
// //         },
// //         {
// //             condition: eventData.media?.length,
// //             renderer: () => displayMedia(section(), "event", eventData.eventid, isLoggedIn)
// //         },
// //         {
// //             condition: eventData.lostandfound?.length,
// //             renderer: () => displayLostAndFound(section(), eventData.lostandfound)
// //         },
// //         {
// //             condition: eventData.contactInfo,
// //             renderer: () => displayContactDetails(section(), eventData.contactInfo)
// //         }
// //     ];

// //     sections.forEach(({ condition, renderer }) => {
// //         // if (condition) renderer();
// //         renderer();
// //     });

// //     function section() {
// //         const el = createElement("section", { class: "event-section" });
// //         tabsContainer.appendChild(el);
// //         return el;
// //     }
// // }

// // export {
// //     updateEvent,
// //     editEventForm,
// //     fetchEventData,
// //     displayEvent,
// //     displayEventSections,
// //     deleteEvent,
// //     viewEventAnalytics
// // };
