async function NotFound(isLoggedIn, contentContainer) {
    contentContainer.replaceChildren(createElement("h1", {}, [isLoggedIn]));
}

export { NotFound };
