import { apiFetch } from "../../api/api";
import { navigate } from "../../routes/index.js";
import { getState } from "../../state/state";
import { userNewChatInit } from "../chats/newchat/newchats.js";


export async function meChat(otherUserId, entityType, entityId) {
    const userId = getState("user");
    if (!userId || !otherUserId) return;

    const participants = [userId, otherUserId];

    const chat = await apiFetch("/merechats/start", "POST", {
        participants,
        entityType,
        entityId
    });

    if (entityType == "user") {
        userNewChatInit(otherUserId);
    }

    navigate(`/merechats/${chat.id}`);
}
