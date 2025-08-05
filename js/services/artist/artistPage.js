import {
    renderPostsTab,
    renderMerchTab,
    renderEventsTab
  } from "./artistTabs.js";
  import { renderSongsTab } from "./artistSongsTab.js";
  import { SRC_URL, apiFetch } from "../../api/api.js";
  import { createTabs } from "../../components/ui/createTabs.js";
  import { editArtistForm, deleteArtistForm } from "./editArtist.js";
  import { createElement } from "../../components/createElement.js";
  import { reportPost } from "../reporting/reporting.js";
  import Button from "../../components/base/Button.js";
  import { toggleAction } from "../beats/toggleFollows.js";
  import { getState } from "../../state/state.js";
  import { persistTabs } from "../../utils/persistTabs.js";
  import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";

  // async wrapper
  export async function displayArtist(content, artistID, isLoggedIn) {
    content.innerHTML = "";
  
    const contentContainer = createElement("div", { class: "artistpage" });
    content.appendChild(contentContainer);
  
    try {
      const artist = await apiFetch(`/artists/${artistID}`);
      if (!artist) {
        contentContainer.appendChild(
          createElement("p", {}, ["Artist not found."])
        );
        return;
      }
  
      const user = getState("user");
      const isCreator = isLoggedIn && artist.createdBy === user?.userid;
      const isSubscribed = artist.subscribed === true;
  
      // -- PHOTO & BANNER SECTION --
// -- PHOTO & BANNER SECTION --
const photoBannerRow = createElement("div", { class: "hflex-sb photocon" });

if (artist.photo) {
  const photoSrc = resolveImagePath(EntityType.ARTIST, PictureType.PHOTO, artist.photo);
  const photoImg = createElement("img", {
    src: photoSrc,
    alt: `${artist.name || "Artist"}'s photo`,
    class: "artist-photo"
  });
  photoBannerRow.appendChild(createElement("div", { class: "hflex" }, [photoImg]));
}

if (artist.banner) {
  const bannerSrc = resolveImagePath(EntityType.ARTIST, PictureType.BANNER, artist.banner);
  const bannerImg = createElement("img", {
    src: bannerSrc,
    alt: `${artist.name || "Artist"}'s banner`,
    class: "artist-banner"
  });
  photoBannerRow.appendChild(createElement("div", { class: "hflex" }, [bannerImg]));
}

contentContainer.appendChild(photoBannerRow);

  
      // -- BUTTON SECTION --
      const subscribeButton = Button(
        isSubscribed ? "Unsubscribe" : "Subscribe",
        "",
        {
          click: () => {
            SubscribeToArtist(subscribeButton, user, artistID);
          }
        },
        "buttonx"
      );
  
      const reportButton = Button("Report", "report-btn", {
        click: () => reportPost(artistID, "artist")
      }, "buttonx");
      // }, "report-btn");
  
      const buttonRow = createElement("div", { class: "hflex hcen" }, [
        subscribeButton,
        reportButton,
        createElement("div", { class: "editdiv", id: "editevent" })
      ]);
  
      contentContainer.appendChild(buttonRow);
  
      // -- TABS SECTION --
      const tabs = [
        {
          title: "Overview",
          id: "overview",
          render: (container) =>
            renderOverviewTab(container, artist, isCreator, isLoggedIn)
        },
        {
          title: "Events",
          id: "events",
          render: (container) => renderEventsTab(container, artistID)
        },
        {
          title: "Posts",
          id: "posts",
          render: (container) => renderPostsTab(container, artistID, isLoggedIn)
        },
        {
          title: "Merch",
          id: "merch",
          render: (container) =>
            renderMerchTab(container, artistID, isCreator, isLoggedIn)
        }
      ];
  
      const songCategories = ["singer", "band", "musician", "rapper", "composer"];
      const category = artist.category?.toLowerCase();
  
      if (songCategories.includes(category)) {
        tabs.push({
          title: "Songs",
          id: "songs",
          render: (container) => renderSongsTab(container, artistID, isCreator)
        });
      }
  
      persistTabs(contentContainer, tabs, `artist-tabs:${artistID}`);
  
    } catch (error) {
      contentContainer.innerHTML = "";
      contentContainer.appendChild(
        createElement("p", {}, [`Error loading artist profile: ${error.message}`])
      );
    }
  }
  

function getSocialIcon(platform) {
    const lc = platform.toLowerCase();

    const icons = {
        instagram: "📸",
        twitter: "🐦",  // or use 'X' if you want to follow branding
        youtube: "▶️",
        facebook: "📘",
        tiktok: "🎵",
        spotify: "🎧",
        soundcloud: "☁️",
        website: "🌐",
        link: "🔗"
    };

    for (const key in icons) {
        if (lc.includes(key)) return icons[key];
    }

    return icons.link;
}

function SubscribeToArtist(followBtn, userid, artist) {
    toggleAction({
        entityId: userid,
        button: followBtn,
        targetObject: artist,
        apiPath: "/subscribe/",
        property: "isSubscribed",
        labels: { on: "Unsubscribe", off: "Subscribe" },
        actionName: "followed",
    });
}

function renderOverviewTab(container, artist, isCreator, isLoggedIn) {
    const artistDiv = createElement("div", { class: "artist-container" });

    // Artist Header
    const header = createElement("h2", { class: "artist-name" }, [artist.name]);
    artistDiv.appendChild(header);

    // Artist Detail Fields
    const detailFields = [
        { label: "🎨 Artist Type", value: artist.category },
        { label: "📖 Biography", value: artist.bio },
        { label: "🎂 Date of Birth", value: artist.dob },
        { label: "📍 Place", value: `${artist.place}, ${artist.country}` },
        { label: "🎶 Genres", value: artist.genres.join(", ") }
    ];

    const detailsDiv = createElement("div", { class: "artist-details" });
    detailFields.forEach(({ label, value }) => {
        detailsDiv.appendChild(
            createElement("p", {}, [
                createElement("strong", {}, [`${label}:`]),
                ` ${value}`
            ])
        );
    });
    artistDiv.appendChild(detailsDiv);

    // Band Members
    if (artist.members?.length > 0) {
        const memberItems = artist.members.map(member => {
            const img = createElement("img", {
                src: `${SRC_URL}/artistpic/members/${member.image}` || "default-profile.png",
                alt: member.name,
                class: "member-photo"
            });

            const text = createElement("div", { class: "member-text" }, [
                createElement("span", {}, [
                    `${member.name}${member.role ? " - " + member.role : ""}${member.dob ? " (DOB: " + member.dob + ")" : ""}`
                ])
            ]);

            return createElement("li", { class: "member-item" }, [img, text]);
        });

        const membersDiv = createElement("div", { class: "band-members" }, [
            createElement("p", {}, [createElement("strong", {}, ["👥 Band Members:"])]),
            createElement("ul", {}, memberItems)
        ]);

        artistDiv.appendChild(membersDiv);
    }

    if (artist.socials) {
        const socialLinks = Object.entries(artist.socials).map(([platform, url]) =>
            createElement("a", {
                href: url,
                target: "_blank",
                class: "social-link",
                rel: "noopener noreferrer"
            }, [`${getSocialIcon(platform)} ${platform}`])
        );

        const socialsDiv = createElement("div", { class: "socials" }, [
            createElement("p", {}, [createElement("strong", {}, ["🔗 Socials:"])]),
            ...socialLinks
        ]);

        artistDiv.appendChild(socialsDiv);
    }

    // Creator Actions
    if (isCreator) {
        const editButton = Button("✏️ Edit Artist", "", { click: () => { editArtistForm(isLoggedIn, artist.artistid, isCreator) } }, "edit-artist-btn buttonx"
        );

        const deleteButton = Button("🗑️ Request Deletion", "", {
            click: () => {
                deleteArtistForm(isLoggedIn, artist.artistid, isCreator)
            }
        }, "del-artist-btn buttonx");

        artistDiv.appendChild(editButton);
        artistDiv.appendChild(deleteButton);
    }

    container.appendChild(artistDiv);
    // container.appendChild(createContainer(["editform"], "editartist", "div"));
    container.appendChild(createElement("div", { class: "editform", id: "editartist" }));
}


// import {
//     renderPostsTab,
//     renderMerchTab,
//     renderEventsTab
// } from "./artistTabs.js";
// import {
//     renderSongsTab,
// } from "./artistSongsTab.js";
// import { SRC_URL, apiFetch } from "../../api/api.js";
// import { createTabs } from "../../components/ui/createTabs.js";
// import { editArtistForm, deleteArtistForm } from "./editArtist.js";
// import { createElement } from "../../components/createElement.js";
// import { reportPost } from "../reporting/reporting.js";
// import Button from "../../components/base/Button.js";
// import { toggleAction } from "../beats/toggleFollows.js";
// import { getState } from "../../state/state.js";
// import { persistTabs } from "../../utils/persistTabs.js";

// // import { SubscribeToArtist } from "../../services/subscription.js";

// export async function displayArtist(content, artistID, isLoggedIn) {
//     content.innerHTML = "";
//     const contentContainer = createElement('div', { class: "artispage" }, []);
//     content.appendChild(contentContainer);

//     try {
//         const artist = await apiFetch(`/artists/${artistID}`);
//         if (!artist) {
//             contentContainer.appendChild(
//                 createElement("p", {}, ["Artist not found."])
//             );
//             return;
//         }

//         const user = getState("user");
//         const isCreator = isLoggedIn && artist.createdBy === user?.userid;
//         const isSubscribed = artist.subscribed === true;

//         const artistPics = createElement("div", { class: "hflex-sb photocon" });

//         if (artist.photo) {
//             const photo = createElement("img", {
//                 src: `${SRC_URL}/artistpic/photo/${artist.photo}`,
//                 alt: artist.name ? `${artist.name}'s photo` : "Artist photo",
//                 class: "artist-photo"
//             });
//             artistPics.appendChild(createElement("div", { class: "hflex" }, [photo]));
//         }

//         if (artist.banner) {
//             const banner = createElement("img", {
//                 src: `${SRC_URL}/artistpic/banner/${artist.banner}`,
//                 alt: artist.name ? `${artist.name}'s banner` : "Artist banner",
//                 class: "artist-banner"
//             });
//             artistPics.appendChild(createElement("div", { class: "hflex" }, [banner]));
//         }

//         contentContainer.appendChild(artistPics);

//         const reportButton = Button("Report", "report-btn", {
//             click: () => reportPost(artistID, "artist")
//         }, "report-btn");

//         const subscribeButton = Button(
//             isSubscribed ? "Unsubscribe" : "Subscribe",
//             "",
//             {
//                 click: () => {
//                     SubscribeToArtist(subscribeButton, user, artistID);
//                 }
//             },
//             "buttonx"
//         );

//         const buttonContainer = createElement("div", { class: "hflex hcen" }, [
//             subscribeButton,
//             reportButton,
//             createElement("div", { class: "editdiv", id: "editevent" })
//         ]);
//         contentContainer.appendChild(buttonContainer);

//         const tabs = [
//             {
//                 title: "Overview",
//                 id: "overview",
//                 render: (container) =>
//                     renderOverviewTab(container, artist, isCreator, isLoggedIn),
//             },
//             {
//                 title: "Events",
//                 id: "events",
//                 render: (container) => renderEventsTab(container, artistID),
//             },
//             {
//                 title: "Posts",
//                 id: "posts",
//                 render: (container) => renderPostsTab(container, artistID, isLoggedIn),
//             },
//             {
//                 title: "Merch",
//                 id: "merch",
//                 render: (container) =>
//                     renderMerchTab(container, artistID, isCreator, isLoggedIn),
//             }
//         ];

//         const categoriesWithSongs = ["singer", "band", "musician", "rapper", "composer"];
//         if (categoriesWithSongs.includes(artist.category?.toLowerCase())) {
//             tabs.push({
//                 title: "Songs",
//                 id: "songs",
//                 render: (container) => renderSongsTab(container, artistID, isCreator),
//             });
//         }

//         persistTabs(contentContainer, tabs, `artist-tabs:${artistID}`);

//         // const tabStorageKey = `artist-tabs:${artistID}`;
//         // const activeTabId = localStorage.getItem(tabStorageKey) || "overview";

//         // const tabsUI = createTabs(tabs, tabStorageKey, activeTabId, (newTabId) => {
//         //     localStorage.setItem(tabStorageKey, newTabId);
//         // });

//         // contentContainer.appendChild(tabsUI);

//     } catch (error) {
//         contentContainer.innerHTML = "";
//         contentContainer.appendChild(
//             createElement("p", {}, [`Error loading artist profile: ${error.message}`])
//         );
//     }
// }


// // export async function displayArtist(content, artistID, isLoggedIn) {
// //     content.innerHTML = "";
// //     let contentContainer = createElement('div',{"class":"artispage"},[]);

// //     content.innerHTML = "";
// //     content.appendChild(contentContainer);

// //     try {
// //         const artist = await apiFetch(`/artists/${artistID}`);
// //         if (!artist) {
// //             contentContainer.appendChild(
// //                 createElement("p", {}, ["Artist not found."])
// //             );
// //             return;
// //         }

// //         const user = getState("user");
// //         const isCreator = isLoggedIn && artist.createdBy === user?.userid;
// //         const isSubscribed = artist.subscribed === true;

// //         const artistPics = createElement("div", { class: "hflex-sb photocon" });

// //         if (artist.photo) {
// //             const photo = createElement("img", {
// //                 src: `${SRC_URL}/artistpic/photo/${artist.photo}`,
// //                 alt: artist.name ? `${artist.name}'s photo` : "Artist photo",
// //                 class: "artist-photo"
// //             });
// //             const artistPhoto = createElement("div", { class: "hflex" }, [photo]);
// //             artistPics.appendChild(artistPhoto);
// //         }

// //         if (artist.banner) {
// //             const banner = createElement("img", {
// //                 src: `${SRC_URL}/artistpic/banner/${artist.banner}`,
// //                 alt: artist.name ? `${artist.name}'s banner` : "Artist banner",
// //                 class: "artist-banner"
// //             });
// //             const artistBanner = createElement("div", { class: "hflex" }, [banner]);
// //             artistPics.appendChild(artistBanner);
// //         }

// //         contentContainer.appendChild(artistPics);

// //         const reportButton = Button("Report", "report-btn", {
// //             click: () => reportPost(artistID, "artist")
// //         }, "report-btn");

// //         const subscribeButton = Button(
// //             isSubscribed ? "Unsubscribe" : "Subscribe",
// //             "",
// //             {
// //                 click: () => {
// //                     SubscribeToArtist(subscribeButton, user, artistID);
// //                 }
// //             },
// //             "buttonx"
// //         );

// //         const buttonContainer = createElement("div", { class: "hflex hcen" }, [
// //             subscribeButton,
// //             reportButton,
// //             createElement("div", { class: "editdiv", id: "editevent" })
// //         ]);

// //         contentContainer.appendChild(buttonContainer);

// //         const tabs = [
// //             {
// //                 title: "Overview",
// //                 id: "overview",
// //                 render: (container) =>
// //                     renderOverviewTab(container, artist, isCreator, isLoggedIn),
// //             },
// //             {
// //                 title: "Events",
// //                 id: "events",
// //                 render: (container) => renderEventsTab(container, artistID),
// //             },
// //             {
// //                 title: "Posts",
// //                 id: "posts",
// //                 render: (container) => renderPostsTab(container, artistID, isLoggedIn),
// //             },
// //             {
// //                 title: "Merch",
// //                 id: "merch",
// //                 render: (container) =>
// //                     renderMerchTab(container, artistID, isCreator, isLoggedIn),
// //             },
// //             // {
// //             //     title: "Songs",
// //             //     id: "songs",
// //             //     render: (container) =>
// //             //         renderSongsTab(container, artistID, isCreator),
// //             // },
// //         ];

// //         // Only add Songs tab if artist.category is allowed
// //         const categoriesWithSongs = ["singer", "band", "musician", "rapper", "composer"];
// //         if (categoriesWithSongs.includes(artist.category?.toLowerCase())) {
// //             tabs.push({
// //                 title: "Songs",
// //                 id: "songs",
// //                 render: (container) =>
// //                     renderSongsTab(container, artistID, isCreator),
// //             });
// //         }
// //         contentContainer.appendChild(createTabs(tabs));

// //     } catch (error) {
// //         contentContainer.innerHTML = "";
// //         contentContainer.appendChild(
// //             createElement("p", {}, [`Error loading artist profile: ${error.message}`])
// //         );
// //     }
// // }



// function getSocialIcon(platform) {
//     const lc = platform.toLowerCase();

//     const icons = {
//         instagram: "📸",
//         twitter: "🐦",  // or use 'X' if you want to follow branding
//         youtube: "▶️",
//         facebook: "📘",
//         tiktok: "🎵",
//         spotify: "🎧",
//         soundcloud: "☁️",
//         website: "🌐",
//         link: "🔗"
//     };

//     for (const key in icons) {
//         if (lc.includes(key)) return icons[key];
//     }

//     return icons.link;
// }

// function SubscribeToArtist(followBtn, userid, artist) {
//     toggleAction({
//         entityId: userid,
//         button: followBtn,
//         targetObject: artist,
//         apiPath: "/subscribe/",
//         property: "isSubscribed",
//         labels: { on: "Unsubscribe", off: "Subscribe" },
//         actionName: "followed",
//     });
// }

// function renderOverviewTab(container, artist, isCreator, isLoggedIn) {
//     const artistDiv = createElement("div", { class: "artist-container" });

//     // Artist Header
//     const header = createElement("h2", { class: "artist-name" }, [artist.name]);
//     artistDiv.appendChild(header);

//     // Artist Detail Fields
//     const detailFields = [
//         { label: "🎨 Artist Type", value: artist.category },
//         { label: "📖 Biography", value: artist.bio },
//         { label: "🎂 Date of Birth", value: artist.dob },
//         { label: "📍 Place", value: `${artist.place}, ${artist.country}` },
//         { label: "🎶 Genres", value: artist.genres.join(", ") }
//     ];

//     const detailsDiv = createElement("div", { class: "artist-details" });
//     detailFields.forEach(({ label, value }) => {
//         detailsDiv.appendChild(
//             createElement("p", {}, [
//                 createElement("strong", {}, [`${label}:`]),
//                 ` ${value}`
//             ])
//         );
//     });
//     artistDiv.appendChild(detailsDiv);

//     // Band Members
//     if (artist.members?.length > 0) {
//         const memberItems = artist.members.map(member => {
//             const img = createElement("img", {
//                 src: `${SRC_URL}/artistpic/members/${member.image}` || "default-profile.png",
//                 alt: member.name,
//                 class: "member-photo"
//             });

//             const text = createElement("div", { class: "member-text" }, [
//                 createElement("span", {}, [
//                     `${member.name}${member.role ? " - " + member.role : ""}${member.dob ? " (DOB: " + member.dob + ")" : ""}`
//                 ])
//             ]);

//             return createElement("li", { class: "member-item" }, [img, text]);
//         });

//         const membersDiv = createElement("div", { class: "band-members" }, [
//             createElement("p", {}, [createElement("strong", {}, ["👥 Band Members:"])]),
//             createElement("ul", {}, memberItems)
//         ]);

//         artistDiv.appendChild(membersDiv);
//     }

//     if (artist.socials) {
//         const socialLinks = Object.entries(artist.socials).map(([platform, url]) =>
//             createElement("a", {
//                 href: url,
//                 target: "_blank",
//                 class: "social-link",
//                 rel: "noopener noreferrer"
//             }, [`${getSocialIcon(platform)} ${platform}`])
//         );

//         const socialsDiv = createElement("div", { class: "socials" }, [
//             createElement("p", {}, [createElement("strong", {}, ["🔗 Socials:"])]),
//             ...socialLinks
//         ]);

//         artistDiv.appendChild(socialsDiv);
//     }

//     // Creator Actions
//     if (isCreator) {
//         const editButton = Button("✏️ Edit Artist", "", { click: () => { editArtistForm(isLoggedIn, artist.artistid, isCreator) } }, "edit-artist-btn"
//         );

//         const deleteButton = Button("🗑️ Request Deletion", "", {
//             click: () => {
//                 deleteArtistForm(isLoggedIn, artist.artistid, isCreator)
//             }
//         }, "del-artist-btn");

//         artistDiv.appendChild(editButton);
//         artistDiv.appendChild(deleteButton);
//     }

//     container.appendChild(artistDiv);
//     // container.appendChild(createContainer(["editform"], "editartist", "div"));
//     container.appendChild(createElement("div", { class: "editform", id: "editartist" }));
// }

