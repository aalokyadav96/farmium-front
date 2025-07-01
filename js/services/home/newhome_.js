import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";

// Helper to build a widget section
function createWidget({ title, endpoint, renderItem }) {
    const section = createElement("section", { class: "widget" }, [
        createElement("h2", {}, [title]),
        createElement("div", { class: "widget-body" }, [createElement("p", {}, ["Loading..."])])
    ]);

    const content = section.querySelector(".widget-body");

    apiFetch(endpoint)
        .then(data => {
            if (!Array.isArray(data) || !data.length) {
                content.textContent = "Nothing to display.";
                return;
            }
            const items = renderItem(data);
            content.replaceChildren(...items);
        })
        .catch(err => {
            content.textContent = "Failed to load content.";
            console.error(`❌ ${title} fetch error:`, err);
        });

    return section;
}

// Individual widgets
const createNewsWidget = () =>
    createWidget({
        title: "📰 Top News",
        endpoint: "/home/news",
        renderItem: data =>
            data.map(item =>
                createElement("li", {}, [
                    createElement("a", { href: item.link || "#", target: "_blank" }, [item.title])
                ])
            )
    });

const createTrendsWidget = () =>
    createWidget({
        title: "🔥 Trending",
        endpoint: "/home/trends",
        renderItem: data =>
            data.map(tag =>
                createElement("li", {}, [tag])
            )
    });

const createEventsWidget = () =>
    createWidget({
        title: "📅 Upcoming Events",
        endpoint: "/home/events",
        renderItem: data =>
            data.map(ev =>
                createElement("li", {}, [
                    createElement("a", { href: ev.link || "#", target: "_blank" }, [ev.title])
                ])
            )
    });

const createPlacesWidget = () =>
    createWidget({
        title: "🏙️ Top Places",
        endpoint: "/home/places",
        renderItem: data =>
            data.map(place =>
                createElement("li", {}, [
                    createElement("a", { href: place.link || "#", target: "_blank" }, [place.name])
                ])
            )
    });

const createCommunityWidget = () =>
    createWidget({
        title: "💬 From the Community",
        endpoint: "/home/posts",
        renderItem: data =>
            data.map(post =>
                createElement("li", {}, [
                    createElement("a", { href: post.link || "#", target: "_blank" }, [post.title])
                ])
            )
    });

const createMediaWidget = () =>
    createWidget({
        title: "📸 Explore Media",
        endpoint: "/home/media",
        renderItem: data =>
            data.map(item =>
                createElement("img", {
                    src: item.url,
                    alt: item.alt || "thumbnail",
                    loading: "lazy"
                })
            )
    });

const createNoticeWidget = () =>
    createWidget({
        title: "📢 Announcements",
        endpoint: "/home/notices",
        renderItem: data =>
            data.map(note =>
                createElement("p", {}, [note.text])
            )
    });

function createAuthWidget(isLoggedIn) {
    const section = createElement("section", { class: "widget auth-widget" });

    if (isLoggedIn) {
        section.append(
            createElement("h2", {}, ["👋 Welcome back!"]),
            createElement("button", {
                id: "go-dashboard",
                onclick: () => location.hash = "#/dashboard"
            }, ["Go to Dashboard"])
        );
    } else {
        section.append(
            createElement("h2", {}, ["🔐 Login"]),
            createElement("input", { type: "text", placeholder: "Username" }),
            createElement("input", { type: "password", placeholder: "Password" }),
            createElement("button", {
                id: "login-btn",
                onclick: () => location.hash = "#/auth"
            }, ["Login"])
        );
    }

    return section;
}

function createSearchWidget() {
    return createElement("section", { class: "widget search-widget" }, [
        createElement("h2", {}, ["🔎 Search"]),
        createElement("input", { type: "text", placeholder: "Search..." }),
        createElement("button", {}, ["Go"])
    ]);
}

export function NewHome(isLoggedIn, container) {
    container.textContent = "";

    const layout = createElement("div", { class: "portal-layout" });

    const leftCol = createElement("div", { class: "portal-left" });
    const rightCol = createElement("div", { class: "portal-right" });

    leftCol.append(
        createNewsWidget(),
        createTrendsWidget(),
        createEventsWidget(),
        createPlacesWidget(),
        createCommunityWidget()
    );

    rightCol.append(
        createAuthWidget(isLoggedIn),
        createSearchWidget(),
        createMediaWidget(),
        createNoticeWidget()
    );

    layout.append(leftCol, rightCol);
    container.appendChild(layout);
}

// import { apiFetch } from "../../api/api.js";
// import {createElement} from "../../components/createElement.js";

// function createNewsWidget() {
//     const section = createElement('section', { class: 'widget news-widget' }, [
//         createElement('h2', {}, ['Top News']),
//         createElement('p', {}, ['Loading...'])
//     ]);

//     apiFetch('/home/news')
//         .then(data => {
//             section.replaceChildren(
//                 createElement('h2', {}, ['Top News']),
//                 createElement('ul', {}, data.map(item =>
//                     createElement('li', {}, [createElement('a', { href: item.link || '#' }, [item.title])])
//                 ))
//             );
//         });

//     return section;
// }

// function createTrendsWidget() {
//     const section = createElement('section', { class: 'widget trends-widget' }, [
//         createElement('h2', {}, ['Trending']),
//         createElement('p', {}, ['Loading...'])
//     ]);

//     apiFetch('/home/trends')
//         .then(data => {
//             section.replaceChildren(
//                 createElement('h2', {}, ['Trending']),
//                 createElement('ol', {}, data.map(tag =>
//                     createElement('li', {}, [tag])
//                 ))
//             );
//         });

//     return section;
// }

// function createEventsWidget() {
//     const section = createElement('section', { class: 'widget events-widget' }, [
//         createElement('h2', {}, ['Upcoming Events']),
//         createElement('p', {}, ['Loading...'])
//     ]);

//     apiFetch('/home/events')
//         .then(data => {
//             section.replaceChildren(
//                 createElement('h2', {}, ['Upcoming Events']),
//                 createElement('ul', {}, data.map(ev =>
//                     createElement('li', {}, [createElement('a', { href: ev.link || '#' }, [ev.title])])
//                 ))
//             );
//         });

//     return section;
// }

// function createPlacesWidget() {
//     const section = createElement('section', { class: 'widget places-widget' }, [
//         createElement('h2', {}, ['Top Places']),
//         createElement('p', {}, ['Loading...'])
//     ]);

//     apiFetch('/home/places')
//         .then(data => {
//             section.replaceChildren(
//                 createElement('h2', {}, ['Top Places']),
//                 createElement('ul', {}, data.map(place =>
//                     createElement('li', {}, [createElement('a', { href: place.link || '#' }, [place.name])])
//                 ))
//             );
//         });

//     return section;
// }

// function createCommunityWidget() {
//     const section = createElement('section', { class: 'widget community-widget' }, [
//         createElement('h2', {}, ['From the Community']),
//         createElement('p', {}, ['Loading...'])
//     ]);

//     apiFetch('/home/posts')
//         .then(data => {
//             section.replaceChildren(
//                 createElement('h2', {}, ['From the Community']),
//                 createElement('ul', {}, data.map(post =>
//                     createElement('li', {}, [createElement('a', { href: post.link || '#' }, [post.title])])
//                 ))
//             );
//         });

//     return section;
// }
// function createAuthWidget(isLoggedIn) {
//   const section = createElement('section', { class: 'widget auth-widget' });

//   if (isLoggedIn) {
//       section.appendChild(createElement('h2', {}, ['Welcome back!']));
//       const btn = createElement('button', { id: 'go-dashboard' }, ['Go to Dashboard']);
//       btn.addEventListener('click', () => location.hash = '#/dashboard');
//       section.appendChild(btn);
//   } else {
//       section.appendChild(createElement('h2', {}, ['Login']));
//       const usernameInput = createElement('input', { type: 'text', placeholder: 'Username' });
//       const passwordInput = createElement('input', { type: 'password', placeholder: 'Password' });
//       const loginBtn = createElement('button', { id: 'login-btn' }, ['Login']);
//       loginBtn.addEventListener('click', () => location.hash = '#/auth');
//       section.append(usernameInput, passwordInput, loginBtn);
//   }

//   return section;
// }

// function createSearchWidget() {
//   return createElement('section', { class: 'widget search-widget' }, [
//       createElement('input', { type: 'text', placeholder: 'Search...' }),
//       createElement('button', {}, ['🔍'])
//   ]);
// }

// function createMediaWidget() {
//   const section = createElement('section', { class: 'widget media-widget' }, [
//       createElement('h2', {}, ['Explore Media']),
//       createElement('p', {}, ['Loading...'])
//   ]);

//   apiFetch('/home/media')
//       .then(data => {
//           section.replaceChildren(
//               createElement('h2', {}, ['Explore Media']),
//               ...data.map(item =>
//                   createElement('img', { src: item.url, alt: item.alt || 'thumb' })
//               )
//           );
//       });

//   return section;
// }

// function createNoticeWidget() {
//   const section = createElement('section', { class: 'widget notice-widget' }, [
//       createElement('h2', {}, ['Announcements']),
//       createElement('p', {}, ['Loading...'])
//   ]);

//   apiFetch('/home/notices')
//       .then(data => {
//           section.replaceChildren(
//               createElement('h2', {}, ['Announcements']),
//               ...data.map(note =>
//                   createElement('p', {}, [note.text])
//               )
//           );
//       });

//   return section;
// }

// export function NewHome(isLoggedIn, container) {
//   container.textContent = '';
//   const layout = createElement('div', { class: 'portal-layout' });

//   const leftCol = createElement('div', { class: 'portal-left' });
//   const rightCol = createElement('div', { class: 'portal-right' });

//   // Append widget placeholders
//   leftCol.append(
//       createNewsWidget(),
//       createTrendsWidget(),
//       createEventsWidget(),
//       createPlacesWidget(),
//       createCommunityWidget()
//   );

//   rightCol.append(
//       createAuthWidget(isLoggedIn),
//       createSearchWidget(),
//       createMediaWidget(),
//       createNoticeWidget()
//   );

//   layout.append(leftCol, rightCol);
//   container.appendChild(layout);
// }
