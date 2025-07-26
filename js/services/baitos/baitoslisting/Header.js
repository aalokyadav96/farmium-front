import { createElement } from "../../../components/createElement";


export function buildHeader() {
    return createElement("div", { class: "baito-header" }, [
      createElement("h2", {}, ["📋 Browse Baitos"])
    ]);
  }
  