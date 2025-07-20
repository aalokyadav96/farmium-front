import { createElement } from "../../components/createElement.js";
import { reportPost } from "../reporting/reporting.js";

export function displayHashtag(contentContainer, hashtag, isLoggedIn) {
    let hashcon = createElement("div", { 'id': "hashcon" }, [hashtag, isLoggedIn]);
    contentContainer.appendChild(hashcon);


    // Report button
    const reportButton = document.createElement("button");
    reportButton.className = "report-btn";
    reportButton.textContent = "Report";
    reportButton.addEventListener("click", () => {
        reportPost(hashtag);
    });

}