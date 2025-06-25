import { displayProfile  } from "../../services/profile/userProfileService";
import { displayUserProfile  } from "../../services/profile/otherUserProfileService";

async function MyProfile(isLoggedIn, contentContainer) {
    const content = document.createElement("div");
    content.classList = "profilepage";
    contentContainer.appendChild(content);
    displayProfile(isLoggedIn, content);
}

async function UserProfile(isLoggedIn, contentContainer, username) {
    const content = document.createElement("div");
    content.classList = "profilepage";
    contentContainer.appendChild(content);
    displayUserProfile(isLoggedIn, content, username);
}

export { MyProfile, UserProfile  };
