// chatState.js
let currentChatId = null;
let skip = 0;

// For infinite scroll on chat list
let chatListSkip = 0;

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
  return { currentChatId, skip };
}

export function resetChatListSkip() {
  chatListSkip = 0;
}

export function incrementChatListSkip(n) {
  chatListSkip += n;
}

export function getChatListSkip() {
  return chatListSkip;
}

// //chatState.js
// let currentChatId = null;
// let skip = 0;

// export function setChatId(id) {
//     currentChatId = id;
//     skip = 0;
// }

// export function resetSkip() {
//     skip = 0;
// }

// export function incrementSkip(n) {
//     skip += n;
// }

// export function getChatState() {
//     return {
//         currentChatId,
//         skip
//     };
// }
