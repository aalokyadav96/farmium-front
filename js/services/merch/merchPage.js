import { createElement } from "../../components/createElement.js";
import { SRC_URL, apiFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { handlePurchase } from '../payment/paymentService.js';

export async function displayMerch(contentContainer, merchID, isLoggedIn) {
  // Clear existing content
  contentContainer.innerHTML = "";

  if (!isLoggedIn) {
    contentContainer.textContent = "Please log in to view merch details.";
    return;
  }

  // Create outer container resembling a product page
  const merchContainer = createElement(
    "div",
    {
      class: "merch-details-container product-page",
      style: `
        max-width: 800px;
        margin: 0 auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      `,
    },
    []
  );

  // Loading indicator
  const loadingText = createElement("p", {}, ["Loading merch details..."]);
  merchContainer.appendChild(loadingText);
  contentContainer.appendChild(merchContainer);

  try {
    // Fetch merch data
    const data = await apiFetch(`/merch/${encodeURIComponent(merchID)}`, "GET");

    if (!data.id) {
      merchContainer.innerHTML = "";
      const errorText = createElement(
        "p",
        { style: "color: red;" },
        [`Failed to fetch merch details (invalid ID).`]
      );
      merchContainer.appendChild(errorText);
      return;
    }

    // Clear loading placeholder
    merchContainer.innerHTML = "";

    // Top section: Image + Details side by side (stacked on mobile)
    const topSection = createElement(
      "div",
      {
        class: "product-top-section",
        style: `
          display: flex;
          flex-direction: row;
          gap: 24px;
          flex-wrap: wrap;
        `,
      },
      []
    );

    // Image container
    const imgContainer = createElement(
      "div",
      {
        class: "product-image-container",
        style: "flex: 1 1 300px; text-align: center;",
      },
      []
    );
    if (data.merch_pic) {
      const img = createElement("img", {
        src: `${SRC_URL}/merchpic/${data.merch_pic}`,
        alt: data.name || "Merch Image",
        style: "max-width: 100%; border-radius: 4px;",
      });
      imgContainer.appendChild(img);
    } else {
      const placeholder = createElement(
        "div",
        {
          style: `
            width: 100%;
            padding-top: 75%;
            background-color: #f0f0f0;
            border-radius: 4px;
            position: relative;
          `,
        },
        []
      );
      imgContainer.appendChild(placeholder);
    }

    // Details container
    const detailsContainer = createElement(
      "div",
      {
        class: "product-details-container",
        style: "flex: 1 1 300px; display: flex; flex-direction: column; gap: 8px;",
      },
      []
    );

    // Product title
    if (data.name) {
      const title = createElement(
        "h1",
        {
          style: "margin: 0; font-size: 1.75em; line-height: 1.2;",
        },
        [data.name]
      );
      detailsContainer.appendChild(title);
    }

    // Price
    if (data.price !== undefined) {
      const priceNumber =
        typeof data.price === "number" ? data.price : Number(data.price);
      const priceText = isNaN(priceNumber)
        ? data.price
        : priceNumber.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      const priceEl = createElement(
        "p",
        {
          style: "font-size: 1.5em; font-weight: bold; margin: 0; color: #E53935;",
        },
        [`$${priceText}`]
      );
      detailsContainer.appendChild(priceEl);
    }

    // Stock / Availability
    if (data.stock !== undefined) {
      const inStock = data.stock > 0;
      const stockEl = createElement(
        "p",
        {
          style: `
            margin: 0;
            font-size: 0.95em;
            color: ${inStock ? "#388E3C" : "#D32F2F"};
          `,
        },
        [inStock ? `In Stock (${data.stock} available)` : "Out of Stock"]
      );
      detailsContainer.appendChild(stockEl);
    }

    // Quantity selector + Add to Cart button
    const actionRow = createElement(
      "div",
      {
        class: "action-row",
        style: "display: flex; gap: 8px; align-items: center; margin-top: 12px;",
      },
      []
    );

    const qtyLabel = createElement(
      "label",
      { for: "qtyInput", style: "font-size: 0.95em;" },
      ["Qty:"]
    );
    const qtyInput = createElement("input", {
      type: "number",
      id: "qtyInput",
      value: "1",
      min: "1",
      max: data.stock !== undefined ? String(data.stock) : "999",
      style: `
        width: 60px;
        padding: 4px;
        font-size: 1em;
        border: 1px solid #ccc;
        border-radius: 4px;
      `,
    });

    const addToCartBtn = Button("Add to Cart", 'add-to-cart', {}, "action-btn", { color: "white", background: "#1976D2", opacity: `${data.stock > 0 ? "1" : "0.6"}` });

    // Placeholder click handler (wire up to real cart logic later)
    addToCartBtn.addEventListener("click", () => {
      const qty = parseInt(qtyInput.value, 10);
      if (isNaN(qty) || qty < 1) return;
      // TODO: integrate with cart API
      alert(`Added ${qty} × "${data.name}" to cart.`);
      handlePurchase(data.entity_type, "merch", merchID, data.entity_id, qty);
    });

    actionRow.append(qtyLabel, qtyInput, addToCartBtn);
    detailsContainer.appendChild(actionRow);

    // Short description (if provided)
    if (data.description) {
      const shortDesc = createElement(
        "p",
        {
          style: "margin-top: 12px; font-size: 1em; line-height: 1.4;",
        },
        [data.description]
      );
      detailsContainer.appendChild(shortDesc);
    }

    topSection.append(imgContainer, detailsContainer);
    merchContainer.appendChild(topSection);

    // Below section: Tabs (e.g., Details, Reviews, Shipping)
    const tabsContainer = createElement(
      "div",
      {
        class: "product-tabs",
        style: "margin-top: 24px;",
      },
      []
    );

    // Tab buttons
    const tabButtons = createElement(
      "div",
      {
        class: "tab-buttons",
        style: "display: flex; border-bottom: 1px solid #ddd;",
      },
      []
    );
    const detailsTabBtn = createElement(
      "button",
      {
        class: "tab-btn active",
        style: `
          background: none;
          border: none;
          padding: 12px 16px;
          font-size: 1em;
          cursor: pointer;
          border-bottom: 2px solid #1976D2;
          color: #1976D2;
        `,
      },
      ["Details"]
    );
    const reviewsTabBtn = createElement(
      "button",
      {
        class: "tab-btn",
        style: `
          background: none;
          border: none;
          padding: 12px 16px;
          font-size: 1em;
          cursor: pointer;
          color: #555;
        `,
      },
      ["Reviews"]
    );
    tabButtons.append(detailsTabBtn, reviewsTabBtn);

    // Tab contents
    const detailsContent = createElement(
      "div",
      {
        class: "tab-content",
        style: "padding: 16px 0;",
      },
      []
    );
    // Full description (could be richer HTML or markdown)
    if (data.description) {
      const fullDesc = createElement(
        "div",
        { style: "font-size: 0.95em; line-height: 1.6;" },
        [data.description]
      );
      detailsContent.appendChild(fullDesc);
    } else {
      const noDesc = createElement(
        "p",
        { style: "font-size: 0.95em; color: #777;" },
        ["No additional details available."]
      );
      detailsContent.appendChild(noDesc);
    }

    const reviewsContent = createElement(
      "div",
      {
        class: "tab-content",
        style: "display: none; padding: 16px 0;",
      },
      []
    );
    // Placeholder for reviews (to be populated later)
    const noReviews = createElement(
      "p",
      { style: "font-size: 0.95em; color: #777;" },
      ["No reviews yet."]
    );
    reviewsContent.appendChild(noReviews);

    tabsContainer.append(tabButtons, detailsContent, reviewsContent);
    merchContainer.appendChild(tabsContainer);

    // Tab switching logic
    detailsTabBtn.addEventListener("click", () => {
      detailsTabBtn.classList.add("active");
      reviewsTabBtn.classList.remove("active");
      detailsTabBtn.style.borderBottom = "2px solid #1976D2";
      reviewsTabBtn.style.borderBottom = "none";
      detailsTabBtn.style.color = "#1976D2";
      reviewsTabBtn.style.color = "#555";
      detailsContent.style.display = "block";
      reviewsContent.style.display = "none";
    });

    reviewsTabBtn.addEventListener("click", () => {
      reviewsTabBtn.classList.add("active");
      detailsTabBtn.classList.remove("active");
      reviewsTabBtn.style.borderBottom = "2px solid #1976D2";
      detailsTabBtn.style.borderBottom = "none";
      reviewsTabBtn.style.color = "#1976D2";
      detailsTabBtn.style.color = "#555";
      reviewsContent.style.display = "block";
      detailsContent.style.display = "none";
    });

    // Additional info: entity link, timestamps, IDs
    const metaInfo = createElement(
      "div",
      {
        class: "product-meta-info",
        style: "font-size: 0.85em; color: #555; margin-top: 24px; display: flex; flex-direction: column; gap: 4px;",
      },
      []
    );

    if (data.entity_type && data.entity_id) {
      const entityLink = createElement(
        "a",
        {
          href: `/${data.entity_type}/${data.entity_id}`,
          style: "color: #1976D2; text-decoration: none;",
        },
        [`View related ${data.entity_type}`]
      );
      entityLink.onmouseover = () => (entityLink.style.textDecoration = "underline");
      entityLink.onmouseout = () => (entityLink.style.textDecoration = "none");
      metaInfo.appendChild(entityLink);
    }

    if (data.created_at) {
      const createdEl = createElement(
        "p",
        {},
        [`Created At: ${new Date(data.created_at).toLocaleString()}`]
      );
      metaInfo.appendChild(createdEl);
    }
    if (data.updatedAt) {
      const updatedEl = createElement(
        "p",
        {},
        [`Last Updated: ${new Date(data.updatedAt).toLocaleString()}`]
      );
      metaInfo.appendChild(updatedEl);
    }
    if (data.merchid) {
      const merchidEl = createElement("p", {}, [`Merch ID: ${data.merchid}`]);
      metaInfo.appendChild(merchidEl);
    }

    merchContainer.appendChild(metaInfo);
  } catch (error) {
    merchContainer.innerHTML = "";
    const errorText = createElement(
      "p",
      { style: "color: red;" },
      ["An error occurred while fetching merch details."]
    );
    merchContainer.appendChild(errorText);
    console.error("Error fetching merch details:", error);
  }
}
