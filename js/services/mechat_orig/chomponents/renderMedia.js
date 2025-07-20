import { createElement } from "../../../components/createElement.js";
import { SRC_URL } from "../../../state/state.js";

export function renderMedia(msg) {
    if (!msg.media?.url || !msg.media?.type) return [msg.content];

    const mediaURL = `${SRC_URL}/uploads/farmchat/${msg.media.url}`;
    const type = msg.media.type;

    if (type.startsWith("image/")) {
        return [createElement("img", {
            src: mediaURL,
            class: "msg-image",
            alt: "Image message"
        })];
    }

    if (type.startsWith("audio/")) {
        return [createElement("audio", {
            controls: true,
            src: mediaURL,
            class: "msg-audio"
        })];
    }

    if (type.startsWith("video/")) {
        return [createElement("video", {
            controls: true,
            src: mediaURL,
            class: "msg-video"
        })];
    }

    const filename = msg.media.url.split("/").pop();
    return [createElement("a", {
        href: mediaURL,
        download: filename,
        class: "msg-file"
    }, [filename])];
}
