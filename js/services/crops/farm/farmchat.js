import { meChat } from "../../mechat/plugnplay";

export async function farmChat(farmerId, container, farmId) {
    meChat(farmerId, container, "farm", farmId);
}


// import { apiFetch } from "../../../api/api";
// import { navigate } from "../../../routes/index.js";
// import { getState } from "../../../state/state";
// // import { loadChatList, openChat } from "../../mechat/chatService";
// import { openChat } from "../../mechat/chatHandlers.js";

// export async function farmChat(farmerId, container) {
//     const userId = getState("user");
//     if (!userId || !farmerId) return;

//     const participants = [userId, farmerId];

//     const chat = await apiFetch("/merechats/start", "POST", { participants });

//     // await loadChatList(
//     // 	document.querySelector(".chat-list"),
//     // 	document.querySelector(".chat-view")
//     // );
//     navigate(`/merechats/${chat.id}`);
//     // openChat(chat.id, document.querySelector(".chat-view"));
//     // openChat(chat.id, container);
// }
