import { apixFetch } from "../../api/api.js";

export async function displayHome(contentcontainer, isloggedin) {
    contentcontainer.textContent = ""; // clear container

    const sections = [
        { id: "recommended_events", title: "Recommended Events" },
        { id: "recommended_places", title: "Recommended Places" },
        { id: "followed_posts", title: "Followed Posts" },
        { id: "ads", title: "Sponsored Ads" },
    ];

    const user_id = "user123"; // Replace with actual session user ID if available

    for (const section of sections) {
        const data = await apixFetch(`http://localhost:4000/agi/home_feed_section`, "POST", JSON.stringify({
            user_id,
            section: section.id,
            page: 1,
        }));

        if (!Array.isArray(data) || data.length === 0) continue;

        const sectionWrapper = document.createElement("div");
        sectionWrapper.className = "home-section";

        const heading = document.createElement("h2");
        heading.textContent = section.title;
        sectionWrapper.appendChild(heading);

        const list = document.createElement("div");
        list.className = "home-list";

        for (const item of data) {
            const card = document.createElement("div");
            card.className = "home-card";

            switch (section.id) {
                case "recommended_events":
                    createText(card, item.title, "b");
                    createText(card, `${item.date} at ${item.time}`);
                    createText(card, `📍 ${item.location}`);
                    createText(card, item.description);
                    createText(card, `Organized by ${item.organizer}`);
                    createText(card, `Price: ${item.price}`);
                    if (item.image_url) {
                        const img = document.createElement("img");
                        img.src = item.image_url;
                        img.alt = item.title;
                        img.style.maxWidth = "100%";
                        card.appendChild(img);
                    }
                    break;

                case "recommended_places":
                    createText(card, item.name, "b");
                    createText(card, `${item.type} | ${item.rating}⭐ | ${item.price_range}`);
                    createText(card, `📍 ${item.location}`);
                    createText(card, item.description);
                    createText(card, `Open: ${item.open_hours}`);
                    break;

                case "followed_posts":
                    createText(card, `${item.user} said:`, "b");
                    createText(card, `"${item.content}"`);
                    createText(card, `🕒 ${new Date(item.timestamp).toLocaleString()}`);
                    createText(card, `❤️ ${item.likes}   💬 ${item.comments}`);
                    break;

                case "ads":
                    createText(card, item.title, "b");
                    createText(card, item.description);
                    createText(card, `📍 ${item.location}`);
                    createText(card, `Valid until: ${item.valid_until}`);
                    createText(card, `Sponsored by: ${item.sponsor}`);
                    break;
            }

            list.appendChild(card);
        }

        sectionWrapper.appendChild(list);
        contentcontainer.appendChild(sectionWrapper);
    }
}

function createText(parent, text, tag = "p") {
    const el = document.createElement(tag);
    el.textContent = text;
    parent.appendChild(el);
}
