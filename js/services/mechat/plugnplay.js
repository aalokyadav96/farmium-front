import { apiFetch } from "../../api/api";
import { navigate } from "../../routes/index.js";
import { getState } from "../../state/state";
// import { openChat } from "../../mechat/chatHandlers.js";


export async function meChat(otherId, container, entityType, entityId) {
    const userId = getState("user");
    if (!userId || !otherId) return;

    const participants = [userId, otherId];

    const chat = await apiFetch("/merechats/start", "POST", {
        participants,
        entityType,
        entityId
    });

    navigate(`/merechats/${chat.id}`);
}

// export async function meChat(farmerId, container) {
//     const userId = getState("user");
//     if (!userId || !farmerId) return;

//     const participants = [userId, farmerId];
//     const entityType = "farm"; // example entityType
//     const entityId = farmerId; // assuming each farmer is the entity

//     const chat = await apiFetch("/merechats/start", "POST", {
//         participants,
//         entityType,
//         entityId
//     });

//     navigate(`/merechats/${chat.id}`);
// }
