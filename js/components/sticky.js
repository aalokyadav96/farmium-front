import { createElement } from "./createElement.js";
import { plusCircleSVG, notifSVG, cartSVG, chatSVG, arrowLeftSVG } from "./svgs.js";
import { navigate } from "../routes/index.js";

export const sticky = createElement("div", {}, []);

const plypzstp = createElement("p", { class: "plypzstp" }, [
    createIconButton("pause", arrowLeftSVG, () => history.back()),
    createIconButton("play", chatSVG, () => navigate("/chats")),
    // createIconButton("dld", plusCircleSVG, () => navigate("/create-post")),
    createIconButton("stop", notifSVG, () => navigate("/notifications")),
    createIconButton("edit", cartSVG, () => navigate("/cart")),
]);

function createIconButton(classSuffix, svgMarkup, onClick) {
    const iconWrapper = createElement("span", {}, []);
    iconWrapper.insertAdjacentHTML("beforeend", svgMarkup);

    const button = createElement("button", {
        class: `logoicon ${classSuffix}`,
    }, [iconWrapper]);

    button.addEventListener("click", (e) => {
        e.preventDefault();
        onClick?.();
    });

    return button;
}

let stickyStyle = createElement("style", {}, [`
.plypzstp {
    border-top: 1px solid #ddd;
    bottom: 0;
    position: fixed;
    z-index: 10;
    width: 100%;
    background-color: var(--color-bg);
    text-align: center;
}
.logoicon {
    margin: 0 0.3rem;
    align-items: center;
    background: none;
}
.play, .pause, .stop, .dld, .edit {
    border: none;
    cursor: pointer;
    height: 48px;
    outline: none;
    padding: 0;
    width: 48px;
    margin: 0 0.4rem;
}`]);

sticky.appendChild(plypzstp);
sticky.appendChild(stickyStyle);
