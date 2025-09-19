import { createElement } from "../../components/createElement.js";
import { Button } from "../../components/base/Button.js";
import { showPaymentModal } from "../pay/pay.js";

export function userProfileCard(profile = {
    username: "Anonymous",
    bio: "This user hasn't added a bio yet.",
    avatarUrl: "default-avatar.png",
    postCount: 0,
    isFollowing: false,
    entityType: "user",    // "user" | "post"
    entityId: null,        // userId or postId
    entityName: "Anonymous" // username or post title
}) {
    const card = createElement("div", { class: "user-profile-card" });

    const avatar = createElement("img", {
        src: profile.avatarUrl,
        alt: `${profile.username}'s avatar`,
        class: "avatar",
        loading: "lazy"
    });

    const name = createElement("h3", {}, [profile.username]);
    const bio = createElement("p", { class: "bio" }, [profile.bio]);
    const count = createElement("p", { class: "post-count" }, [`📝 Posts: ${profile.postCount}`]);

    // Funding button (works for both users and posts)
    const fundButton = Button("Fund", "fund-btn", {
        click: async () => {
            if (!profile.entityId) {
                alert("Funding not available.");
                return;
            }

            const result = await showPaymentModal({
                entityType: profile.entityType || "user",
                entityId: profile.entityId,         // use entityId here
                entityName: profile.entityName || profile.username
            });

            if (result?.success) {
                const target = profile.entityType === "post" ? "post" : "user";
                alert(`You successfully funded this ${target} using ${result.method}`);
            } else {
                console.log("Funding cancelled or failed");
            }
        }
    });

    // Follow button (only if profile is a user)
    let followBtn = null;
    if (profile.entityType === "user") {
        followBtn = createElement("button", {
            class: "btn btn-outline",
            onclick: () => {
                profile.isFollowing = !profile.isFollowing;
                followBtn.textContent = profile.isFollowing ? "Unfollow" : "Follow";
                // TODO: sync follow state with backend API
            }
        }, [profile.isFollowing ? "Unfollow" : "Follow"]);
    }

    // Append elements
    const elements = [avatar, name, bio, count, fundButton];
    if (followBtn) elements.push(followBtn);

    card.append(...elements);
    return card;
}
