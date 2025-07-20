import Button from "../../components/base/Button";
import { createElement } from "../../components/createElement";
import { SRC_URL, getState } from "../../state/state";

export function buildMessageElement(msg, { isInline = false } = {}) {
    const isMine = msg.sender === getState("user");
    const showAvatar = !isMine;

    const isImage = /^image\//.test(msg.media?.type);
    const isAudio = /^audio\//.test(msg.media?.type);
    const isVideo = /^video\//.test(msg.media?.type);

    const bubbleClasses = ["message", isMine ? "mine" : "theirs"];
    if (msg.deleted) bubbleClasses.push("deleted");
    if (msg.media) bubbleClasses.push("attachment");

    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const avatar = showAvatar
        ? createElement("img", {
            class: "avatar",
            src: `${SRC_URL}/userpic/thumb/${msg.sender}.jpg`,
            alt: `${msg.sender}'s avatar`
        }, [])
        : null;

    const sender = createElement("span", {
        class: "msg-sender",
        "aria-label": `Sender: ${msg.sender}`
    }, [msg.sender]);

    const timestamp = createElement("span", {
        class: "msg-time",
        "aria-label": `Sent at ${time}`
    }, [time]);

    const status = isMine
        ? createElement("span", { class: "msg-status" }, ["✓"])
        : null;

    const menu = createElement("div", { class: "msg-menu" }, [
        Button("⋮", "menu-btn", {
            click: (e) => {
                e.stopPropagation();
                const allMenus = e.currentTarget
                    .closest(".message")
                    .querySelectorAll(".dropdown");
                allMenus.forEach(drop => drop.classList.toggle("open"));
            }
        }, "menu-btn"),
        createElement("div", { class: "dropdown" }, [
            Button("Edit", "edit-btn-chat", { click: () => handleEdit(msg.id) }),
            Button("Delete", "del-btn-chat", { click: () => handleDelete(msg.id) }),
            Button("Copy", "cpy-btn", { click: () => copyToClipboard(msg.content || msg.media?.url) })
        ])
    ]);

    let contentNode;
    if (msg.deleted) {
        contentNode = ["[deleted]"];
    } else if (msg.media?.url && msg.media?.type) {
        const mediaURL = `${SRC_URL}/uploads/farmchat/${msg.media.url}`;
        if (isImage) {
            contentNode = [
                createElement("img", {
                    src: mediaURL,
                    class: "msg-image",
                    alt: "Image message"
                })
            ];
        } else if (isAudio) {
            contentNode = [
                createElement("audio", {
                    controls: true,
                    src: mediaURL,
                    class: "msg-audio"
                })
            ];
        } else if (isVideo) {
            contentNode = [
                createElement("video", {
                    controls: true,
                    src: mediaURL,
                    class: "msg-video"
                })
            ];
        } else {
            const filename = msg.media.url.split("/").pop();
            contentNode = [
                createElement("a", {
                    href: mediaURL,
                    download: filename,
                    class: "msg-file"
                }, [filename])
            ];
        }
    } else {
        contentNode = [msg.content];
    }

    const edited = msg.editedAt
        ? createElement("span", { class: "msg-edited" }, [" (edited)"])
        : null;

    const header = createElement("div", { class: "msg-header" }, [
        sender,
        timestamp,
        edited,
        status,
        menu
    ]);

    const body = createElement("div", { class: "msg-content" }, contentNode);

    const contentWrapper = createElement("div", { class: "msg-body" }, [body]);

    return createElement("div", {
        class: bubbleClasses.join(" "),
        dataset: { id: msg.id },
        role: "article",
        "aria-label": `Message from ${msg.sender} at ${time}`
    }, [
        avatar,
        createElement("div", { class: "msg-meta" }, [
            header,
            contentWrapper
        ])
    ]);
}

document.addEventListener("click", (e) => {
    const isMenuBtn = e.target.closest(".menu-btn");
    if (!isMenuBtn) {
        document.querySelectorAll(".dropdown.open").forEach(drop => drop.classList.remove("open"));
    }
});

// import Button from "../../components/base/Button";
// import { createElement } from "../../components/createElement";
// import { SRC_URL, getState } from "../../state/state";



// export function buildMessageElement(msg, { isInline = false } = {}) {
//     const isMine = msg.sender === getState("user");
//     const isImage = msg.media?.type?.startsWith("image/");
//     const showAvatar = !isMine; // hide own avatar
//     // const showAvatar = Boolean(isMine);

//     const bubbleClasses = ["message", isMine ? "mine" : "theirs"];
//     if (msg.deleted) bubbleClasses.push("deleted");
//     if (msg.media) bubbleClasses.push("attachment");

//     const avatar = showAvatar
//         ? createElement("img", { class: "avatar", src: `${SRC_URL}/userpic/thumb/${msg.sender}.jpg`, alt: msg.sender },[])
//         : null;

//     const sender = createElement("span", { class: "msg-sender" }, [msg.sender]);
//     const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
//     const timestamp = createElement("span", { class: "msg-time" }, [time]);

//     const status = isMine
//         ? createElement("span", { class: "msg-status" }, ["✓"])
//         : null;

//     const menu = createElement("div", { class: "msg-menu" }, [
//         Button("⋮", "menu-btn", {
//             click: (e) => {
//                 e.stopPropagation();
//                 e.currentTarget.nextElementSibling.classList.toggle("open");
//             }
//         }, "menu-btn"),
//         createElement("div", { class: "dropdown" }, [
//             Button("Edit", "edit-btn-chat", { click: () => handleEdit(msg.id) }),
//             Button("Delete", "del-btn-chat", { click: () => handleDelete(msg.id) }),
//             Button("Copy", "cpy-btn", { click: () => copyToClipboard(msg.content || msg.media?.url) })
//         ])
//     ]);

//     let contentNode;
//     if (msg.deleted) {
//         contentNode = ["[deleted]"];
//     } else if (msg.media?.url && msg.media?.type) {
//         if (isImage) {
//             contentNode = [
//                 createElement("img", {
//                     src: `${SRC_URL}/uploads/farmchat/${msg.media.url}`,
//                     class: "msg-image",
//                     alt: ""
//                 })
//             ];
//         } else {
//             contentNode = [
//                 createElement("a", {
//                     href: `${SRC_URL}/uploads/farmchat/${msg.media.url}`,
//                     download: "",
//                     class: "msg-file"
//                 }, [msg.media.url.split("/").pop()])
//             ];
//         }
//     } else {
//         contentNode = [msg.content];
//     }

//     const edited = msg.editedAt
//         ? createElement("span", { class: "msg-edited" }, [" (edited)"])
//         : null;

//     const header = createElement("div", { class: "msg-header" }, [
//         sender,
//         timestamp,
//         edited,
//         status,
//         menu
//     ]);

//     const body = createElement("div", { class: "msg-content" }, contentNode);

//     return createElement("div", {
//         class: bubbleClasses.join(" "),
//         dataset: { id: msg.id }
//     }, [
//         avatar,
//         header,
//         body
//     ]);
// }

// document.addEventListener("click", (e) => {
//     const isMenuBtn = e.target.closest(".menu-btn");
//     const allDropdowns = document.querySelectorAll(".onechatcon .dropdown");

//     allDropdowns.forEach(drop => drop.classList.remove("open"));

//     if (isMenuBtn) {
//         const dropdown = isMenuBtn.nextElementSibling;
//         if (dropdown) dropdown.classList.add("open");
//         e.stopPropagation();
//     }
// });
