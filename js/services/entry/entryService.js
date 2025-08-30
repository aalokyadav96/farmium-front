import { navigate } from "../../routes/index.js";
import LoadingSpinner from "../../components/ui/LoadingSpinner.mjs";

export async function displayEntryPage(contentContainer, isLoggedIn) {
    contentContainer.textContent = '';

    if (!isLoggedIn) {
        return navigate("/login");
    }

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

    const spinner = LoadingSpinner();

    wrapper.appendChild(welcomeText);
    wrapper.appendChild(spinner);
    contentContainer.appendChild(wrapper);

    // Brief pause before redirect
    navigate("/home")
    // setTimeout(() => navigate("/home"), 1000);
}
