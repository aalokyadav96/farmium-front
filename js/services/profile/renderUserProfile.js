// import { state } from "../../state/state.js";
import Button from "../../components/base/Button.js";
import { getState } from "../../state/state.js";
import { displayUserProfileData } from "./otherUserProfileService.js";
// import { displayFollowSuggestions } from "./displayFollowSugg.js";
import { createBanner, createBannerEditButton, createProfilePicture, createProfileDetails, createStatistics } from "./profileGenHelpers.js";
import { othusrdata } from "./otheruserdata.js";
import { createElement } from "../../components/createElement.js";

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


function profilGen(profile, isLoggedIn) {
    const profileContainer = document.createElement("div");
    profileContainer.className = "profile-container hflex";

    const section = document.createElement("section");
    section.className = "channel vflex";

    const suggs = document.createElement("section");
    suggs.className = "followcon hflex";
    // displayFollowSuggestions(profile.userid, suggs);

    appendChildren(
        section,
        createBanner(profile),
        createProfilePicture(profile),
        createProfileDetails(profile, isLoggedIn),
        createStatistics(profile),
        suggs
    );

    if (profile.userid === getState("user")) {
        // Load User Data Button
        const udata = document.createElement("div");
        udata.className = "udata-info";
        const loadUserDataButton = Button("Load UserData", "load-user-data", {
            click: () => displayUserProfileData(isLoggedIn, udata, profile.userid),
        });

        appendChildren(section, loadUserDataButton, udata);

    } else {
        let kc = createElement('div');
        othusrdata(kc, profile.userid);
        appendChildren(section, kc);
    }

    profileContainer.appendChild(section);
    return profileContainer;
}

// export { displayFollowSuggestions };

export default profilGen;
