import { apiFetch } from "../../api/api";
import { navigate } from "../../routes/index.js";
import { getState } from "../../state/state";


export async function meChat(otherId, entityType, entityId) {
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
