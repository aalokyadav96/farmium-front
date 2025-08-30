import { createElement } from "../../components/createElement.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";

export function userProfileCard(profile = {
    username: "Anonymous",
    bio: "This user hasn't added a bio yet.",
    avatarUrl: "default-avatar.png",
    postCount: 0,
    isFollowing: false
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

    const followBtn = createElement("button", {
        class: "btn btn-outline",
        onclick: () => {
            profile.isFollowing = !profile.isFollowing;
            followBtn.textContent = profile.isFollowing ? "Unfollow" : "Follow";
            // TODO: sync follow state with backend API
        }
    }, [profile.isFollowing ? "Unfollow" : "Follow"]);

    card.append(avatar, name, bio, count, followBtn);
    return card;
}
