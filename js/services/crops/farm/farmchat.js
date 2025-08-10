import { meChat } from "../../mechat/plugnplay";

export async function farmChat(farmerId, container, farmId) {
    meChat(farmerId, container, "farm", farmId);
}
