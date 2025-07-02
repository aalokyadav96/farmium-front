// src/ui/pages/farms/items/displayItems.js
import { apiFetch } from "../../../api/api.js";
import { createElement } from "../../../components/createElement.js";
import Button from "../../../components/base/Button.js";
import { renderItemForm } from "./createOrEdit.js";

export async function displayItems(
  type,
  container,
  isLoggedIn,
  { limit = 10, offset = 0, search = "", category = "" } = {}
) {
  container.replaceChildren();

  // – If not logged in, prompt
  if (!isLoggedIn) {
    container.appendChild(
      createElement("p", {}, ["Please log in to view items."])
    );
    return;
  }

  // --- Top Bar ---
  const topBar = createElement(
    "div",
    { className: "items-topbar" },
    [
      Button(
        `Create ${type}`,
        `create-${type}-btn`,
        {
          click: () => {
            renderItemForm(container, "create", null, type, () =>
              displayItems(type, container, isLoggedIn, { limit, offset, search, category })
            );
          },
        },
        "primary-button"
      ),
      createElement("input", {
        type: "text",
        placeholder: `Search ${type}s…`,
        value: search,
        oninput: (e) =>
          displayItems(type, container, isLoggedIn, {
            limit,
            offset: 0,
            search: e.target.value,
            category,
          }),
      }),
      // (Optional) Category filter:
      // createElement("select", { onchange: ... }, [...])
    ]
  );
  container.appendChild(topBar);

  // --- Fetch Data ---
  let result;
  try {
    const qs = new URLSearchParams({ type, limit, offset, search, category });
    result = await apiFetch(`/farm/items?${qs.toString()}`);
  } catch (err) {
    return container.appendChild(
      createElement("p", {}, [`Failed to load ${type}s.`])
    );
  }

  const { items = [], total = items.length } = result;

  // --- Heading + Grid ---
  container.appendChild(
    createElement("h2", {}, [
      `${type.charAt(0).toUpperCase() + type.slice(1)}s (${total})`,
    ])
  );

  const grid = createElement("div", { className: `${type}-grid` });
  items.forEach((item) => {
    const card = createElement(
      "div",
      { className: `${type}-card` },
      [
        createElement("img", { src: item.imageUrl, alt: item.name }),
        createElement("h3", {}, [item.name]),
        createElement("p", {}, [`₹${item.price.toFixed(2)}`]),
        createElement("p", {}, [item.description]),
        Button(
          "Edit",
          `edit-${type}-btn`,
          {
            click: () => {
              renderItemForm(container, "edit", item, type, () =>
                displayItems(type, container, isLoggedIn, {
                  limit,
                  offset,
                  search,
                  category,
                })
              );
            },
          },
          "secondary-button"
        ),
      ]
    );
    grid.appendChild(card);
  });
  container.appendChild(grid);

  // --- Pagination Controls ---
  const pageCount = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const pagination = createElement(
    "div",
    { className: "pagination" },
    [
      Button(
        "Prev",
        "page-prev-btn",
        {
          disabled: offset === 0,
          click: () =>
            displayItems(type, container, isLoggedIn, {
              limit,
              offset: Math.max(0, offset - limit),
              search,
              category,
            }),
        },
        "secondary-button"
      ),
      createElement("span", {}, [
        `Page ${currentPage} of ${pageCount}`,
      ]),
      Button(
        "Next",
        "page-next-btn",
        {
          disabled: offset + limit >= total,
          click: () =>
            displayItems(type, container, isLoggedIn, {
              limit,
              offset: offset + limit,
              search,
              category,
            }),
        },
        "secondary-button"
      ),
    ]
  );
  container.appendChild(pagination);
}
