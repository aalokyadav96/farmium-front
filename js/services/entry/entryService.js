import { navigate } from "../../routes/index.js";

export async function displayEntryPage(contentContainer, isLoggedIn) {
    // Clear existing content
    contentContainer.textContent = '';

    if (!isLoggedIn) {
        const message = document.createElement('p');
        message.textContent = 'Please log in to view chats.';
        message.style.margin = '2rem';
        message.style.fontSize = '1.2rem';
        contentContainer.appendChild(message);
        return;
    }

    // Minimalistic Entry Page
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.height = '100vh';
    wrapper.style.backgroundColor = '#f9f9f9';

    const welcomeText = document.createElement('h2');
    welcomeText.textContent = 'Welcome back';
    welcomeText.style.marginBottom = '1rem';
    welcomeText.style.fontWeight = 'normal';

    const loading = document.createElement('div');
    loading.style.width = '24px';
    loading.style.height = '24px';
    loading.style.border = '3px solid #ccc';
    loading.style.borderTop = '3px solid #333';
    loading.style.borderRadius = '50%';
    loading.style.animation = 'spin 1s linear infinite';

    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;

    document.head.appendChild(style);
    wrapper.appendChild(welcomeText);
    wrapper.appendChild(loading);
    contentContainer.appendChild(wrapper);

    // Simulate short loading then redirect
    setTimeout(() => {
        navigate("/home");
    }, 1000);
}

// import {navigate} from "../../routes/index.js";
// export async function displayEntryPage(contentContainer, isLoggedIn) {
//     contentContainer.textContent = '';
//     if (!isLoggedIn) {
//         contentContainer.textContent = 'Please log in to view chats.';
//         return;
//     } else {
//         navigate("/home");
//     }
// }

// Welcome | Entry | Gateway | Splash how to decide
// Great question! The best choice depends on the purpose of the page and the impression you want to make. Here’s a breakdown:

// Welcome Page → Warm and inviting, best for introductory experiences or community-based platforms.

// Entry Page → Neutral and functional, good for login/signup gateways or restricted access sections.

// Gateway Page → Suggests transition or access control, ideal for directing users into a specific experience or section.

// Splash Page → Bold and attention-grabbing, best for promotions, branding, or immersive first impressions.

// If you're building something like Twitter's public homepage, "Welcome" or "Entry" could work best, since it softly encourages users to explore while offering a transition to login.