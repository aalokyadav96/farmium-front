
import Notify from "../../components/ui/Notify.mjs";
import { renderAnalyticsPage } from "../analytics/analyticsService";

// View Analytics (placeholder)
export async function viewEventAnalytics(anacon, isLoggedIn, eventId) {
    if (!isLoggedIn) {
        Notify("Please log in to view your event analytics.", { type: "warning", duration: 3000, dismissible: true });
        return;
    }

    // For a specific event
    renderAnalyticsPage({ container: anacon, isLoggedIn: true, entityType: "events", entityId: eventId });
}