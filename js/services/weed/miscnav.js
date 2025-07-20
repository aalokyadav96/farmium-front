import Button from "../../components/base/Button";
import { createElement } from "../../components/createElement";
import { navigate } from "../../routes";
import { getState } from "../../state/state";
import { displayChats } from "../chats/chats";

export function miscnav() {
    let div = createElement('div',{"class":"miscnavcon"},[
        createElement('h2',{},["Other"]),
        createElement("ul",{},[
            // createElement("li",{},[
            //     Button("Blogs","blogs-btn-feed",{
            //         click: () => {
            //             navigate('/posts');
            //         }
            //     }, "buttonx"),
            // ]),
            createElement("li",{},[
                Button("Messages","feed-msg-btn",{
                    click: () => {
                        // navigate("/livechat");
                        displayChats(document.getElementById('feed-column'), Boolean(getState("token")));
                    }
                }),
            ]),
        ]),
    ]);
    return div;
}