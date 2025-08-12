import { getState } from "../../state/state.js";
import { formatDate } from "./profileHelpers.js";
import { logout } from "../auth/authService.js";
import { reportPost } from "../reporting/reporting.js";
import Button from "../../components/base/Button.js";
import { userChatInit } from "../userchat/chatPage.js";
// import Snackbar from "../../components/ui/Snackbar.mjs";
// import { createElement } from "../../components/createElement.js";
// import { capitalize } from "./profileHelpers.js";
import { toggleFollow } from "./toggleFollow.js";

// Reuse appendChildren from profileImages.js or redefine here if needed
function appendChildren(parent, ...children) {
    children.forEach(child => {
        if (child instanceof Node) {
            parent.appendChild(child);
        } else {
            console.error("Invalid child passed to appendChildren:", child);
        }
    });
}

function createProfileDetails(profile, isLoggedIn) {
    const profileDetails = document.createElement("div");
    profileDetails.className = "profile-details";

    const username = document.createElement("strong");
    username.className = "username";
    username.textContent = `@${profile.username}`;

    const name = document.createElement("p");
    name.className = "name";
    name.textContent = profile.name || "";

    const bio = document.createElement("p");
    bio.className = "bio";
    bio.textContent = profile.bio || "";

    const profileActions = createProfileActions(profile, isLoggedIn);
    const profileInfo = createProfileInfo(profile);

    appendChildren(profileDetails, profileActions, name, username, bio, profileInfo);
    return profileDetails;
}

function createProfileActions(profile, isLoggedIn) {
    const profileActions = document.createElement("div");
    profileActions.className = "profile-actions";

    if (profile.userid === getState("user")) {
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

    if (isLoggedIn && profile.userid !== getState("user")) {
        const followButton = Button("Follow", "follow-btn", {
            click: () => toggleFollow(profile.userid, followButton, profile)
        }, "btn follow-button", { backgroundColor: "lightgreen" });
        followButton.dataset.action = "toggle-follow";
        followButton.dataset.userid = profile.userid;
        followButton.textContent = profile.is_following ? "Unfollow" : "Follow";
        profileActions.appendChild(followButton);

        const sendMessagebtn = Button("Send Message", 'send-msg', {
            click: () => userChatInit(profile.userid),
        }, "buttonx");
        profileActions.appendChild(sendMessagebtn);

        const reportButton = Button("Report", "report-btn", {
            click: () => { reportPost(profile.userid, "user") }
        }, "report-btn", { backgroundColor: "#ee9090" });
        profileActions.appendChild(reportButton);
    }

    return profileActions;
}

function createProfileInfo(profile) {
    const profileInfo = document.createElement("div");
    profileInfo.className = "profile-info";

    const infoItems = [
        { label: "Last Login", value: formatDate(profile.last_login) || "Never logged in" },
        { label: "Status", value: profile.online ? "Active" : "Inactive" },
        { label: "Verification Status", value: profile.is_verified ? "Verified" : "Not Verified" },
    ];

    infoItems.forEach(({ label, value }) => {
        const infoItem = document.createElement("div");
        infoItem.className = "info-item";
        infoItem.innerHTML = `<strong>${label}:</strong> ${value}`;
        profileInfo.appendChild(infoItem);
    });

    return profileInfo;
}

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

export {
    createProfileDetails,
    createProfileActions,
    createProfileInfo,
    createStatistics,
    appendChildren
};
