// chomponents/renderAvatar.js
import { createElement } from "../../../components/createElement";
import { SRC_URL } from "../../../state/state";

export function renderAvatar(msg, { isMine }) {
  if (isMine) return null;
  return createElement("img", {
    class: "avatar",
    src: `${SRC_URL}/userpic/thumb/${msg.sender}.jpg`,
    alt: `${msg.sender}'s avatar`
  }, []);
}

// // chomponents/renderAvatar.js
// import { createElement } from "../../../components/createElement.js";
// import { SRC_URL } from "../../../state/state.js";

// export function renderAvatar(msg, { isMine }) {
//     if (isMine) return null;
//     return createElement("img", {
//         class: "avatar",
//         src: `${SRC_URL}/userpic/thumb/${msg.sender}.jpg`,
//         alt: `${msg.sender}'s avatar`
//     }, []);
// }
