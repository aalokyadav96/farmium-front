let currentChatId = null;
let skip = 0;

export function setChatId(id) {
    currentChatId = id;
    skip = 0;
}

export function resetSkip() {
    skip = 0;
}

export function incrementSkip(n) {
    skip += n;
}

export function getChatState() {
    return {
        currentChatId,
        skip
    };
}
