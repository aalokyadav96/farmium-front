import { SRC_URL, state } from "../../state/state.js";
import Sightbox from "../../components/ui/SightBox.mjs";
import { toggleFollow } from "./toggleFollow.js";
import Modal from "../../components/ui/Modal.mjs";
import { formatDate } from "./profileHelpers.js";
import { generateBannerForm, generateAvatarForm } from "./generators.js";
import { logout } from "../auth/authService.js";
import { reportPost } from "../reporting/reporting.js";
import Button from "../../components/base/Button.js";
// import { userChatInit } from "../userchat/chatPage.js";

// /* Utility function to append multiple children */
// function appendChildren(parent, ...children) {
//     children.forEach(child => parent.appendChild(child));
// }

function appendChildren(parent, ...children) {
    children.forEach(child => {
        if (child instanceof Node) {
            parent.appendChild(child);
        } else {
            console.error("Invalid child passed to appendChildren:", child);
        }
    });
}


/* Creates the banner image */
function createBanner(profile) {
    const bgImg = document.createElement("span");
    bgImg.className = "bg_img";

    const banncon = document.createElement("span");
    banncon.style.position = "relative";

    // Use user's banner picture if available; otherwise, use default banner
    const bannerPicture = profile.banner_picture
        ? `${SRC_URL}/userpic/banner/${profile.banner_picture}`
        : `${SRC_URL}/userpic/banner/default.webp`;

    bgImg.style.backgroundImage = `url(${bannerPicture})`;
    bgImg.addEventListener("click", () => Sightbox(bannerPicture, "image"));

    banncon.appendChild(createBannerEditButton(profile));
    banncon.appendChild(bgImg);

    return banncon;
}


function createBannerEditButton(profile) {
    if (profile.userid !== state.user) return document.createDocumentFragment();

    const editButton = document.createElement("button");
    editButton.className = "edit-banner-pic";
    editButton.textContent = "B";
    editButton.addEventListener("click", () => {
        const content = document.createElement("div");
        const contentx = document.createElement("div");
        content.appendChild(generateBannerForm(contentx, profile.banner_picture));

        const modal = Modal({
            title: "Edit Banner",
            content,
            onClose: () => modal.remove(),
        });
    });

    return editButton;
}

/* Creates the profile picture area */
/* Creates the profile picture area */
function createProfilePicture(profile) {
    const profileArea = document.createElement("div");
    profileArea.className = "profile_area";

    const thumb = document.createElement("span");
    thumb.className = "thumb";

    // Use default profile picture if none is available
    const profilexPic = profile.profile_picture ? `${SRC_URL}/userpic/${profile.profile_picture}` : `${SRC_URL}/userpic/default-profile.png`;

    const profilePic = profile.userid
        ? `${SRC_URL}/userpic/thumb/${profile.userid}.jpg`
        : `${SRC_URL}/userpic/thumb/thumb.jpg`;

    const img = document.createElement("img");
    img.src = profilePic;
    img.loading = "lazy";
    img.alt = "Profile Picture";
    img.className = "imgful";
    thumb.appendChild(img);

    // Add click event to open full image if available
    if (profile.profile_picture) {
        thumb.addEventListener("click", () => Sightbox(profilexPic, "image"));
    }

    profileArea.appendChild(thumb);

    // Add Edit Profile Pic button if user owns the profile
    if (profile.userid === state.user) {
        const editProfileButton = document.createElement("button");
        editProfileButton.className = "edit-profile-pic";
        editProfileButton.textContent = "P";
        editProfileButton.addEventListener("click", () => {
            const content = document.createElement("div");
            const contentx = document.createElement("div");
            content.id = "hfgfy";
            contentx.id = "g54365";
            content.appendChild(generateAvatarForm(contentx, profile.profile_picture || "default-profile.png"));

            const modal = Modal({
                title: "Edit Profile Picture",
                content,
                onClose: () => modal.remove(),
            });
        });
        profileArea.appendChild(editProfileButton);

    }

    return profileArea;
}

/* Creates the profile details section */
function createProfileDetails(profile, isLoggedIn) {
    const profileDetails = document.createElement("div");
    profileDetails.className = "profile-details";

    const username = document.createElement("strong");
    username.className = "username";
    // username.textContent = profile.username || "Not provided";
    username.textContent = `@${profile.username}`;

    const name = document.createElement("p");
    name.className = "name";
    name.textContent = profile.name || "";

    // const email = document.createElement("p");
    // email.className = "email";
    // email.textContent = profile.email || "";

    const bio = document.createElement("p");
    bio.className = "bio";
    bio.textContent = profile.bio || "";

    const profileActions = createProfileActions(profile, isLoggedIn);

    const profileInfo = createProfileInfo(profile);

    appendChildren(profileDetails, profileActions, name, username, bio, profileInfo);
    return profileDetails;
}

/* Creates the profile actions (Edit, Follow, Delete) */
function createProfileActions(profile, isLoggedIn) {
    const profileActions = document.createElement("div");
    profileActions.className = "profile-actions";

    // if (isLoggedIn) {
    // }

    if (profile.userid === state.user) {
        // Logout Button
        const logoutButton = document.createElement("button");
        logoutButton.className = "dropdown-item logout-btn";
        logoutButton.textContent = "Logout";
        logoutButton.addEventListener("click", async () => await logout());
        profileActions.appendChild(logoutButton);

        const editButton = document.createElement("button");
        editButton.className = "btn edit-btn";
        editButton.dataset.action = "edit-profile";
        editButton.textContent = "Edit Profile";
        profileActions.appendChild(editButton);
    }

    if (isLoggedIn && profile.userid !== state.user) {
        const followButton = Button("Follow", "follow-btn", {
            click: () => toggleFollow(profile.userid, followButton, profile)
        }, "btn follow-button", { backgroundColor: "lightgreen" });
        followButton.dataset.action = "toggle-follow";
        followButton.dataset.userid = profile.userid;
        followButton.textContent = profile.is_following ? "Unfollow" : "Follow";
        profileActions.appendChild(followButton);

        // const sendMessagebtn = Button("Send Message", 'send-msg', {
        //     click: () => userChatInit(profile.userid),
        // }, "buttonx");
        // profileActions.appendChild(sendMessagebtn);

        // // Report button
        // const reportButton = document.createElement("button");
        // reportButton.className = "report-btn";
        // reportButton.textContent = "Report";
        // reportButton.addEventListener("click", () => {
        //     reportPost(profile.userid, "user");
        // });
        // profileActions.appendChild(reportButton);

        const reportButton = Button("Report", "report-btn", {
            click: () => { reportPost(profile.userid, "user") }
        }, "report-btn", { backgroundColor: "#ee9090" });

        profileActions.appendChild(reportButton);

    }

    return profileActions;
}

/* Creates the profile information section */
function createProfileInfo(profile) {
    const profileInfo = document.createElement("div");
    profileInfo.className = "profile-info";

    const infoItems = [
        { label: "Last Login", value: formatDate(profile.last_login) || "Never logged in" },
        { label: "Status", value: profile.online ? "Active" : "Inactive" },
        // { label: "Verification Status", value: profile.is_verified ? "Verified" : "Not Verified" },
    ];

    infoItems.forEach(({ label, value }) => {
        const infoItem = document.createElement("div");
        infoItem.className = "info-item";
        infoItem.innerHTML = `<strong>${label}:</strong> ${value}`;
        profileInfo.appendChild(infoItem);
    });

    return profileInfo;
}

/* Creates the statistics section */
function createStatistics(profile) {
    const statistics = document.createElement("div");
    statistics.className = "statistics";

    const stats = [
        { label: "Posts", value: profile.profile_views || 0 },
        { label: "Followers", value: profile.followerscount || 0 },
        { label: "Following", value: profile.followscount || 0 },
    ];

    stats.forEach(({ label, value }) => {
        const statItem = document.createElement("p");
        statItem.className = "hflex";
        statItem.innerHTML = `<strong>${value}</strong> ${label}`;
        statistics.appendChild(statItem);
    });

    return statistics;
}


export { createBanner, createBannerEditButton, createProfilePicture, createProfileDetails, createStatistics };
