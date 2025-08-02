import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import { createLoginForm } from "../../pages/auth/auth.js";

const WIDGETS = [
  {
    id: "news",
    title: "📰 Top News",
    endpoint: "/home/news",
    render: data => data.map(item => listLink(item.title, item.link))
  },
  {
    id: "trends",
    title: "🔥 Trending",
    endpoint: "/home/trends",
    render: data => data.map(tag => listText(tag))
  },
  {
    id: "events",
    title: "📅 Events",
    endpoint: "/home/events",
    render: data => data.map(event => listLink(event.title, event.link))
  }
];

const listLink = (text, href) => createElement("li", {}, [
  createElement("a", { href: href || "#", target: "_blank" }, [text])
]);

const listText = text => createElement("li", {}, [text]);

export function NewHome(isLoggedIn, container) {
  const root = createElement("div", { class: "superapp-mobile" }, [
    topBar(),
    searchSection(),
    appIcons(),
    bannerAd(),
    weatherInfo(),
    feedContent(isLoggedIn)
  ]);

  container.replaceChildren(root);
}

function topBar() {
  return createElement("div", { class: "top-icons" }, [
    createElement("button", {}, ["☰"]),
    createElement("div", { class: "icon-group" }, [
      circleIcon("💰"),
      circleIcon("🛒"),
      circleIcon("💬"),
      circleIcon("🔔"),
      circleIcon("👤")
    ])
  ]);
}

function searchSection() {
  return createElement("div", { class: "search-bar" }, [
    createElement("span", { class: "logo-n" }, ["N"]),
    createElement("input", { type: "text", placeholder: "검색어를 입력해주세요." }),
    createElement("button", {}, ["🔍"])
  ]);
}

function appIcons() {
  const apps = [
    ["뉴스판", "📄"],
    ["스토어", "🛍️"],
    ["경제판", "📈"],
    ["클립판", "🎞️"],
    ["메일", "📧", "35"],
    ["카페", "☕"],
    ["블로그", "📝"],
    ["더보기", "➕"]
  ];

  return createElement("div", { class: "app-grid" }, apps.map(([label, icon, badge]) =>
    createElement("div", { class: "app-icon" }, [
      circleIcon(icon, badge),
      createElement("div", { class: "app-label" }, [label])
    ])
  ));
}

function bannerAd() {
  return createElement("div", { class: "ad-banner" }, [
    createElement("img", {
      src: "https://via.placeholder.com/350x120",
      alt: "Car Ad",
      loading: "lazy"
    }),
    createElement("div", { class: "ad-text" }, [
      createElement("strong", {}, ["rethink electric, 르노 세닉"]),
      createElement("p", {}, ["[사전예약 오픈] 지금 신청해보세요"])
    ])
  ]);
}

function weatherInfo() {
  return createElement("div", { class: "weather" }, [
    createElement("div", { class: "weather-icon" }, ["☀️"]),
    createElement("div", { class: "weather-text" }, ["31.4° 울릉/독도"])
  ]);
}

function circleIcon(icon, badge = "") {
  const wrapper = createElement("div", { class: "circle-icon" }, [icon]);
  if (badge) {
    wrapper.appendChild(createElement("span", { class: "badge" }, [badge]));
  }
  return wrapper;
}

function feedContent(isLoggedIn) {
  const feed = createElement("div", { class: "feed" });

  feed.appendChild(authSection(isLoggedIn));
  WIDGETS.forEach(widget => feed.appendChild(widgetSection(widget)));

  return feed;
}

function authSection(isLoggedIn) {
  const section = createElement("section", { class: "widget", "data-id": "auth" }, [
    createElement("h3", {}, [isLoggedIn ? "👋 Welcome Back" : "🔐 Login"])
  ]);

  const action = isLoggedIn
    ? createElement("button", {
        onclick: () => location.hash = "#/dashboard"
      }, ["Go to Dashboard"])
    : createLoginForm();

  section.appendChild(action);
  return section;
}

function widgetSection({ id, title, endpoint, render }) {
  const body = createElement("div", { class: "widget-body" }, [
    createElement("p", {}, ["Loading..."])
  ]);

  const section = createElement("section", { class: "widget", "data-id": id }, [
    createElement("h3", {}, [title]),
    body
  ]);

  requestIdleCallback(() => {
    apiFetch(endpoint)
      .then(data => {
        const items = Array.isArray(data) && data.length ? render(data) : [
          createElement("p", {}, ["Nothing to show."])
        ];
        body.replaceChildren(...items);
      })
      .catch(err => {
        console.error(`[${id}] failed to load`, err);
        body.replaceChildren(createElement("p", {}, ["Failed to load."]));
      });
  });

  return section;
}
