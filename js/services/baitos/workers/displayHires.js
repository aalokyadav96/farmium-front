import { createElement } from "../../../components/createElement.js";
import { Button } from "../../../components/base/Button.js";
import { displayListingPage } from "../../../utils/displayListingPage.js";
import { navigate } from "../../../routes/index.js";
import { renderWorkerList } from "./WorkerList.js";
import { HireWorkerCard } from "./WorkerCard.js";
import Datex from "../../../components/base/Datex.js";

export function displayHireWorkers(isLoggedIn, container) {
  container.replaceChildren();

  displayListingPage(container, {
    title: "Find Skilled Workers",
    apiEndpoint: "/baitos/workers?page=1&limit=3",
    // cardBuilder: createWorkerCard,
    cardBuilder: HireWorkerCard,
    type: "workers",
    pageSize: 3,
    sidebarActions: aside => {
      aside.appendChild(createElement("h3", {}, ["Actions"]));
      aside.append(
        Button(
          "Create Worker Profile",
          "",
          { click: () => navigate("/baitos/create-profile") },
          "buttonx"
        )
      );
    },
    onDataRender: (listContainer, data) => {
      // Render using grid/list preference
      const isGridView = localStorage.getItem("workerView") !== "list";
      renderWorkerList(listContainer, data, isGridView, isLoggedIn);
    }
  });
}

function createWorkerCard(worker) {
  const info = createElement("div", { class: "worker-info" }, [
    createElement("h3", {}, [worker.name || "Unnamed"]),
    createElement("p", {}, [
      createElement("strong", {}, ["Bio: "]),
      worker.bio || "-"
    ]),
    createElement("p", {}, [
      createElement("strong", {}, ["Photo: "]),
      worker.photo || "-"
    ]),
    createElement("p", {}, [
      createElement("strong", {}, ["Joined: "]),
      // new Date(worker.created_at).toLocaleString()
      Datex(worker.created_at)
    ]), 
    Button("View Profile"),
  ]);

  return createElement("div", { class: "worker-card" }, [info]);
}
