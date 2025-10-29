import {
  renderMerchTab,
  renderEventsTab
} from "./artistTabs.js";
import { renderSongsTab } from "./artistSongsTab.js";
import { SRC_URL, apiFetch } from "../../api/api.js";
import { editArtist, deleteArtistForm, manageBandMembers } from "./createOrEditArtist.js"; // ← added manageBandMembers
import { createOrEditArtist } from "./createOrEditArtist.js";
import { createElement } from "../../components/createElement.js";
import { reportPost } from "../reporting/reporting.js";
import Button from "../../components/base/Button.js";
import { toggleAction } from "../beats/toggleFollows.js";
import { getState } from "../../state/state.js";
import { persistTabs } from "../../utils/persistTabs.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import { updateImageWithCrop } from "../../utils/bannerEditor.js";
import Imagex from "../../components/base/Imagex.js";
import { renderPostsTab, renderLiveTab } from "./moretabs.js";
import { uploadFile } from "../media/api/mediaApi.js";
import { uid } from "../media/ui/mediaUploadForm.js";
import { displayNotices } from "../notices/notices.js";


// --- CREATOR-ONLY BANNER SECTION ---
function createArtistBannerSection(artist, isCreator) {
  const bannerSection = createElement("div", { class: "artist-banner" });
  const bannerSrc = resolveImagePath(EntityType.ARTIST, PictureType.BANNER, artist.banner);

  const bannerImage = Imagex({
    id: "artist-banner-img",
    src: bannerSrc,
    alt: `Banner for ${artist.name || "Artist"}`,
    classes: "artist-banner"
  });

  bannerSection.appendChild(bannerImage);

  if (isCreator) {
    const bannerEditButton = createElement("button", { class: "edit-banner-pic" }, ["Edit Banner"]);
    bannerEditButton.addEventListener("click", () => {
      updateImageWithCrop({
        entityType: EntityType.ARTIST,
        imageType: "banner",
        stateKey: "banner",
        stateEntityKey: "artist",
        previewElementId: "artist-banner-img",
        pictureType: PictureType.BANNER,
        entityId: artist.artistid
      });
    });
    bannerSection.appendChild(bannerEditButton);
  }

  return bannerSection;
}

// --- CREATOR-ONLY PHOTO SECTION ---
function createArtistPhotoSection(artist, isCreator) {
  const photoSection = createElement("div", { class: "artist-photo" });
  const photoSrc = resolveImagePath(EntityType.ARTIST, PictureType.THUMB, artist.photo);

  const photoImg = Imagex({
    id: "artist-avatar-img",
    src: photoSrc,
    alt: `${artist.name || "Artist"}'s photo`,
    classes: "artist-photo"
  });

  photoSection.appendChild(photoImg);

  if (isCreator) {
    const photoEditButton = createElement("button", { class: "edit-banner-pic" }, ["Edit Photo"]);
    photoEditButton.addEventListener("click", () => {
      updateImageWithCrop({
        entityType: EntityType.ARTIST,
        imageType: "photo",
        stateKey: "photo",
        stateEntityKey: "artist",
        previewElementId: "artist-avatar-img",
        pictureType: PictureType.PHOTO,
        entityId: artist.artistid
      });
    });
    photoSection.appendChild(photoEditButton);
  }

  return photoSection;
}


// --- MAIN DISPLAY ---
export async function displayArtist(content, artistID, isLoggedIn) {
  content.replaceChildren();
  const contentContainer = createElement("div", { class: "artistpage" });
  content.appendChild(contentContainer);

  try {
    const artist = await apiFetch(`/artists/${artistID}`);
    if (!artist) {
      contentContainer.appendChild(createElement("p", {}, ["Artist not found."]));
      return;
    }

    const user = getState("user");
    const isCreator = isLoggedIn && artist.creatorid === user;
    const isSubscribed = artist.subscribed === true;

    // --- PHOTO & BANNER ROW ---
    const photoBannerRow = createElement("div", { class: "hflex-sb photocon" });
    const photoSection = createArtistPhotoSection(artist, isCreator);
    if (photoSection) photoBannerRow.appendChild(photoSection);
    photoBannerRow.appendChild(createArtistBannerSection(artist, isCreator));
    contentContainer.appendChild(photoBannerRow);

    // --- BUTTONS ---
    const buttonRow = createElement("div", { class: "hflex hcen" });

    const subscribeButton = Button(isSubscribed ? "Unsubscribe" : "Subscribe", "", {
      click: () => SubscribeToArtist(subscribeButton, artist.artistid)
    }, "buttonx");
    buttonRow.appendChild(subscribeButton);

    const reportButton = Button("Report", "report-btn", {
      click: () => reportPost(artistID, "artist")
    }, "buttonx");
    buttonRow.appendChild(reportButton);

    if (isCreator) {
      const editDiv = createElement("div", { class: "editdiv", id: "editevent" });
      buttonRow.appendChild(editDiv);
    }

    contentContainer.appendChild(buttonRow);

    // --- TABS ---
    const tabs = [
      { title: "Overview", id: "artist-overview", render: (c) => renderOverviewTab(c, artist, isCreator, isLoggedIn) },
      { title: "Events", id: "artist-events", render: (c) => renderEventsTab(c, artistID, isCreator) },
      { title: "Posts", id: "artist-posts", render: (c) => renderPostsTab(c, artistID, isLoggedIn) },
      { title: "Live", id: "artist-live", render: (c) => renderLiveTab(c, artistID, isLoggedIn, isCreator) },
      { title: "Merch", id: "artist-merch", render: (c) => renderMerchTab(c, artistID, isCreator, isLoggedIn) },
      { title: "Notices", id: "notices-tab", render: (tabContainer) => { displayNotices("artist", artistID, tabContainer, isCreator); } },
    ];

    const songCategories = ["singer", "band", "musician", "rapper", "composer"];
    if (songCategories.includes(artist.category?.toLowerCase())) {
      tabs.push({ title: "Songs", id: "songs", render: (c) => renderSongsTab(c, artistID, isCreator) });
    }

    persistTabs(contentContainer, tabs, `artist-tabs:${artistID}`);

  } catch (error) {
    contentContainer.replaceChildren();
    contentContainer.appendChild(
      createElement("p", {}, [`Error loading artist profile: ${error.message}`])
    );
  }
}


// --- SUPPORT ---
function getSocialIcon(platform) {
  const lc = platform.toLowerCase();
  const icons = {
    instagram: "📸",
    twitter: "🐦",
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


/**
 * Subscribe to an artist
 */
function SubscribeToArtist(followBtn, artistId) {
  toggleAction({
    entityId: artistId,
    entityType: "artist",
    button: followBtn,
    apiPath: "/subscribes/",
    labels: { on: "Unsubscribe", off: "Subscribe" },
    actionName: "subscribed"
  });
}

function renderOverviewTab(container, artist, isCreator, isLoggedIn) {
  const artistDiv = createElement("div", { class: "artist-container" });
  artistDiv.appendChild(createElement("h2", { class: "artist-name" }, [artist.name || "Unknown Artist"]));

  const detailsDiv = createElement("div", { class: "artist-details" });
  [
    { label: "🎨 Artist Type", value: artist.category || "Unknown" },
    { label: "📖 Biography", value: artist.bio || "No biography available" },
    { label: "🎂 Date of Birth", value: artist.dob || "" },
    { label: "📍 Place", value: [artist.place, artist.country].filter(Boolean).join(", ") },
    { label: "🎶 Genres", value: Array.isArray(artist.genres) && artist.genres.length > 0 ? artist.genres.join(", ") : "None" }
  ].forEach(({ label, value }) =>
    detailsDiv.appendChild(createElement("p", {}, [createElement("strong", {}, [`${label}:`]), ` ${value}`]))
  );
  artistDiv.appendChild(detailsDiv);

  // --- BAND MEMBERS ---
  if (artist.members?.length > 0) {
    const memberItems = artist.members.map(member => {
      const photoSrc = resolveImagePath(EntityType.ARTIST, PictureType.THUMB, member.image);
      const img = Imagex({ src: photoSrc, alt: member.name, classes: "member-photo" });

      let uploadBtn, fileInput;

      if (isCreator) {
        fileInput = createElement("input", {
          type: "file",
          accept: "image/*",
          style: "display:none"
        });

        uploadBtn = Button("📸 Upload New Photo", "", {
          click: () => fileInput.click()
        }, "upload-member-btn buttonx secondary");

        fileInput.addEventListener("change", async () => {
          const file = fileInput.files[0];
          if (!file) return;

          try {
            const uploadConfig = {
              mediaEntity: "artist",
              fileType: "member",
              id: uid(),
              file
            };

            const uploaded = await uploadFile(uploadConfig);
            if (!uploaded?.filename) {
              throw new Error("Invalid upload response");
            }

            // Update backend with new member image
            const updatedMembers = artist.members.map(m =>
              m.artistid === member.artistid ? { ...m, image: uploaded.filename } : m
            );

            await apiFetch(`/artists/${artist.artistid}/members`, "PUT", { members: updatedMembers });

            // --- LIVE IMAGE REFRESH ---
            const newSrc = resolveImagePath(EntityType.ARTIST, PictureType.THUMB, uploaded.filename);
            img.src = newSrc + `?t=${Date.now()}`; // cache-buster
            Notify(`${member.name}'s photo updated`, { type: "success", duration: 2500 });
          } catch (err) {
            Notify(`Failed to upload photo: ${err.message}`, { type: "error", duration: 2500 });
          }
        });
      }

      const text = createElement("div", { class: "member-text" }, [
        createElement("span", {}, [
          `${member.name}${member.role ? " - " + member.role : ""}${member.dob ? " (DOB: " + member.dob + ")" : ""}`
        ])
      ]);

      return createElement("li", { class: "member-item" }, [
        img,
        text,
        ...(isCreator ? [uploadBtn, fileInput] : [])
      ]);
    });

    artistDiv.appendChild(
      createElement("div", { class: "band-members" }, [
        createElement("p", {}, [createElement("strong", {}, ["👥 Band Members:"])]),
        createElement("ul", {}, memberItems)
      ])
    );
  }

  // --- MANAGE MEMBERS BUTTON ---
  if (isCreator && artist.category?.toLowerCase() === "band") {
    artistDiv.appendChild(Button("👥 Manage Band Members", "", {
      click: () => {
        const container = document.getElementById("editartist") || container;
        manageBandMembers(artist.artistid, container);
      }
    }, "manage-members-btn buttonx secondary"));
  }

  // --- SOCIAL LINKS ---
  if (artist.socials && typeof artist.socials === "object") {
    const socialLinks = Object.entries(artist.socials).map(([platform, url]) =>
      createElement("a", { href: url, target: "_blank", class: "social-link", rel: "noopener noreferrer" },
        [`${getSocialIcon(platform)} ${platform}`])
    );
    artistDiv.appendChild(
      createElement("div", { class: "socials" }, [
        createElement("p", {}, [createElement("strong", {}, ["🔗 Socials:"])]),
        ...socialLinks
      ])
    );
  }

  // --- CREATOR-ONLY ACTIONS ---
  if (isCreator) {
    artistDiv.appendChild(Button("✏️ Edit Artist", "", {
      click: async () => {
        const existingArtist = await apiFetch(`/artists/${artist.artistid}`);
        const editContainer = document.getElementById("editartist") || container;
        createOrEditArtist({
          isLoggedIn,
          content: editContainer,
          mode: "edit",
          artistID: artist.artistid,
          existingArtist,
          isCreator
        });
      }
    }, "edit-artist-btn buttonx"));

    artistDiv.appendChild(Button("🗑️ Request Deletion", "", {
      click: () => deleteArtistForm(isLoggedIn, artist.artistid, isCreator)
    }, "del-artist-btn buttonx"));

    if (!document.getElementById("editartist")) {
      container.appendChild(createElement("div", { class: "editform", id: "editartist" }));
    }
  }

  container.appendChild(artistDiv);
}

// function renderOverviewTab(container, artist, isCreator, isLoggedIn) {
//   const artistDiv = createElement("div", { class: "artist-container" });
//   artistDiv.appendChild(createElement("h2", { class: "artist-name" }, [artist.name || "Unknown Artist"]));

//   const detailsDiv = createElement("div", { class: "artist-details" });
//   [
//     { label: "🎨 Artist Type", value: artist.category || "Unknown" },
//     { label: "📖 Biography", value: artist.bio || "No biography available" },
//     { label: "🎂 Date of Birth", value: artist.dob || "" },
//     { label: "📍 Place", value: [artist.place, artist.country].filter(Boolean).join(", ") },
//     { label: "🎶 Genres", value: Array.isArray(artist.genres) && artist.genres.length > 0 ? artist.genres.join(", ") : "None" }
//   ].forEach(({ label, value }) =>
//     detailsDiv.appendChild(createElement("p", {}, [createElement("strong", {}, [`${label}:`]), ` ${value}`]))
//   );
//   artistDiv.appendChild(detailsDiv);

//   // --- BAND MEMBERS ---
//   if (artist.members?.length > 0) {
//     const memberItems = artist.members.map(member => {
//       const photoSrc = resolveImagePath(EntityType.ARTIST, PictureType.THUMB, member.image);
//       const img = Imagex({ src: photoSrc, alt: member.name, classes: "member-photo" });

//       let uploadBtn, fileInput;

//       if (isCreator) {
//         // hidden file input
//         fileInput = createElement("input", {
//           type: "file",
//           accept: "image/*",
//           style: "display:none"
//         });

//         uploadBtn = Button(`📸 Upload New Photo`, "", {
//           click: () => fileInput.click()
//         }, "upload-member-btn buttonx secondary");

//         fileInput.addEventListener("change", async () => {
//           const file = fileInput.files[0];
//           if (!file) return;

//           try {
//             const uploadConfig = {
//               mediaEntity: "artist",
//               fileType: "member",
//               id: uid(),
//               file
//             };

//             const uploaded = await uploadFile(uploadConfig);
//             if (!uploaded?.filename) {
//               throw new Error("Invalid upload response");
//             }

//             // Update member's image in backend
//             const updatedMembers = artist.members.map(m =>
//               m.artistid === member.artistid ? { ...m, image: uploaded.filename } : m
//             );

//             await apiFetch(`/artists/${artist.artistid}/members`, "PUT", { members: updatedMembers });

//             Notify(`${member.name}'s photo updated successfully`, { type: "success", duration: 2500 });
//           } catch (err) {
//             Notify(`Failed to upload photo: ${err.message}`, { type: "error", duration: 2500 });
//           }
//         });
//       }

//       const text = createElement("div", { class: "member-text" }, [
//         createElement("span", {}, [
//           `${member.name}${member.role ? " - " + member.role : ""}${member.dob ? " (DOB: " + member.dob + ")" : ""}`
//         ])
//       ]);

//       return createElement("li", { class: "member-item" }, [
//         img,
//         text,
//         ...(isCreator ? [uploadBtn, fileInput] : [])
//       ]);
//     });

//     artistDiv.appendChild(
//       createElement("div", { class: "band-members" }, [
//         createElement("p", {}, [createElement("strong", {}, ["👥 Band Members:"])]),
//         createElement("ul", {}, memberItems)
//       ])
//     );
//   }

//   // --- MANAGE MEMBERS BUTTON ---
//   if (isCreator && artist.category?.toLowerCase() === "band") {
//     artistDiv.appendChild(Button("👥 Manage Band Members", "", {
//       click: () => {
//         const container = document.getElementById("editartist") || container;
//         manageBandMembers(artist.artistid, container);
//       }
//     }, "manage-members-btn buttonx secondary"));
//   }

//   // --- SOCIALS ---
//   if (artist.socials && typeof artist.socials === "object") {
//     const socialLinks = Object.entries(artist.socials).map(([platform, url]) =>
//       createElement("a", { href: url, target: "_blank", class: "social-link", rel: "noopener noreferrer" },
//         [`${getSocialIcon(platform)} ${platform}`])
//     );
//     artistDiv.appendChild(
//       createElement("div", { class: "socials" }, [
//         createElement("p", {}, [createElement("strong", {}, ["🔗 Socials:"])]),
//         ...socialLinks
//       ])
//     );
//   }

//   // --- CREATOR-ONLY ACTIONS ---
//   if (isCreator) {
//     artistDiv.appendChild(Button("✏️ Edit Artist", "", {
//       click: async () => {
//         const existingArtist = await apiFetch(`/artists/${artist.artistid}`);
//         const editContainer = document.getElementById("editartist") || container;
//         createOrEditArtist({
//           isLoggedIn,
//           content: editContainer,
//           mode: "edit",
//           artistID: artist.artistid,
//           existingArtist,
//           isCreator
//         });
//       }
//     }, "edit-artist-btn buttonx"));

//     artistDiv.appendChild(Button("🗑️ Request Deletion", "", {
//       click: () => deleteArtistForm(isLoggedIn, artist.artistid, isCreator)
//     }, "del-artist-btn buttonx"));

//     if (!document.getElementById("editartist")) {
//       container.appendChild(createElement("div", { class: "editform", id: "editartist" }));
//     }
//   }

//   container.appendChild(artistDiv);
// }


// // --- OVERVIEW TAB ---
// function renderOverviewTab(container, artist, isCreator, isLoggedIn) {
//   const artistDiv = createElement("div", { class: "artist-container" });
//   artistDiv.appendChild(createElement("h2", { class: "artist-name" }, [artist.name || "Unknown Artist"]));

//   const detailsDiv = createElement("div", { class: "artist-details" });
//   [
//     { label: "🎨 Artist Type", value: artist.category || "Unknown" },
//     { label: "📖 Biography", value: artist.bio || "No biography available" },
//     { label: "🎂 Date of Birth", value: artist.dob || "" },
//     { label: "📍 Place", value: [artist.place, artist.country].filter(Boolean).join(", ") },
//     { label: "🎶 Genres", value: Array.isArray(artist.genres) && artist.genres.length > 0 ? artist.genres.join(", ") : "None" }
//   ].forEach(({ label, value }) =>
//     detailsDiv.appendChild(createElement("p", {}, [createElement("strong", {}, [`${label}:`]), ` ${value}`]))
//   );
//   artistDiv.appendChild(detailsDiv);

//   // Band Members
//   if (artist.members?.length > 0) {
//     const memberItems = artist.members.map(member => {
//       let photoEditButton;
//       let file; // add a file upload here
//       if (isCreator) {
//         photoEditButton = Button(`Edit ${member.name}'s photo`, "button", {
//           click: () => { uploadMemberImage(file); }
//         }, "edit-member-pic buttonx secondary");
//       }
//       const photoSrc = resolveImagePath(EntityType.ARTIST, PictureType.THUMB, member.image);
//       const img = Imagex({ src: photoSrc, alt: member.name, classes: "member-photo" });

//       const text = createElement("div", { class: "member-text" }, [
//         createElement("span", {}, [
//           `${member.name}${member.role ? " - " + member.role : ""}${member.dob ? " (DOB: " + member.dob + ")" : ""}`
//         ])
//       ]);
//       return createElement("li", { class: "member-item" }, [photoEditButton, img, text]);
//     });

//     artistDiv.appendChild(
//       createElement("div", { class: "band-members" }, [
//         createElement("p", {}, [createElement("strong", {}, ["👥 Band Members:"])]),
//         createElement("ul", {}, memberItems)
//       ])
//     );
//   }

//   // Add "Manage Members" button if creator & artist is a band
//   if (isCreator && artist.category?.toLowerCase() === "band") {
//     artistDiv.appendChild(Button("👥 Manage Band Members", "", {
//       click: () => {
//         const container = document.getElementById("editartist") || container;
//         manageBandMembers(artist.artistid, container);
//       }
//     }, "manage-members-btn buttonx secondary"));
//   }

//   // Social Links
//   if (artist.socials && typeof artist.socials === "object") {
//     const socialLinks = Object.entries(artist.socials).map(([platform, url]) =>
//       createElement("a", { href: url, target: "_blank", class: "social-link", rel: "noopener noreferrer" }, [`${getSocialIcon(platform)} ${platform}`])
//     );
//     artistDiv.appendChild(
//       createElement("div", { class: "socials" }, [
//         createElement("p", {}, [createElement("strong", {}, ["🔗 Socials:"])]),
//         ...socialLinks
//       ])
//     );
//   }

//   // Creator-only actions
//   if (isCreator) {
//     artistDiv.appendChild(Button("✏️ Edit Artist", "", {
//       click: async () => {
//         const existingArtist = await apiFetch(`/artists/${artist.artistid}`);
//         const editContainer = document.getElementById("editartist") || container;
//         createOrEditArtist({
//           isLoggedIn,
//           content: editContainer,
//           mode: "edit",
//           artistID: artist.artistid,
//           existingArtist,
//           isCreator
//         });
//       }
//     }, "edit-artist-btn buttonx"));

//     artistDiv.appendChild(Button("🗑️ Request Deletion", "", {
//       click: () => deleteArtistForm(isLoggedIn, artist.artistid, isCreator)
//     }, "del-artist-btn buttonx"));

//     if (!document.getElementById("editartist")) {
//       container.appendChild(createElement("div", { class: "editform", id: "editartist" }));
//     }
//   }

//   container.appendChild(artistDiv);
// }

function uploadMemberImage(imageFile) {
  u.mediaEntity = "artist";
  u.fileType = "member";
  u.id = uid();
  u.file = imageFile;
  uploadFile(u);
}

// import {
//   renderMerchTab,
//   renderEventsTab
// } from "./artistTabs.js";
// import { renderSongsTab } from "./artistSongsTab.js";
// import { SRC_URL, apiFetch } from "../../api/api.js";
// import { editArtist, deleteArtistForm } from "./createOrEditArtist.js";
// import { createOrEditArtist } from "./createOrEditArtist.js";
// import { createElement } from "../../components/createElement.js";
// import { reportPost } from "../reporting/reporting.js";
// import Button from "../../components/base/Button.js";
// import { toggleAction } from "../beats/toggleFollows.js";
// import { getState } from "../../state/state.js";
// import { persistTabs } from "../../utils/persistTabs.js";
// import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
// import { updateImageWithCrop } from "../../utils/bannerEditor.js";
// import Imagex from "../../components/base/Imagex.js";
// import { renderPostsTab } from "./moretabs.js";
// import { renderLiveTab } from "./moretabs.js";

// // --- CREATOR-ONLY BANNER SECTION ---
// function createArtistBannerSection(artist, isCreator) {
//   const bannerSection = createElement("div", { class: "artist-banner" });
//   const bannerSrc = resolveImagePath(EntityType.ARTIST, PictureType.BANNER, artist.banner);

//   const bannerImage = Imagex({
//     id: "artist-banner-img",
//     src: bannerSrc,
//     alt: `Banner for ${artist.name || "Artist"}`,
//     classes: "artist-banner"
//   });

//   bannerSection.appendChild(bannerImage);

//   if (isCreator) {
//     const bannerEditButton = createElement("button", { class: "edit-banner-pic" }, ["Edit Banner"]);
//     bannerEditButton.addEventListener("click", () => {
//       updateImageWithCrop({
//         entityType: EntityType.ARTIST,
//         imageType: "banner",
//         stateKey: "banner",
//         stateEntityKey: "artist",
//         previewElementId: "artist-banner-img",
//         pictureType: PictureType.BANNER,
//         entityId: artist.artistid
//       });
//     });
//     bannerSection.appendChild(bannerEditButton);
//   }

//   return bannerSection;
// }

// // --- CREATOR-ONLY PHOTO SECTION ---
// function createArtistPhotoSection(artist, isCreator) {
//   const photoSection = createElement("div", { class: "artist-photo" });
//   const photoSrc = resolveImagePath(EntityType.ARTIST, PictureType.THUMB, artist.photo);

//   const photoImg = Imagex({
//     id: "artist-avatar-img",
//     src: photoSrc,
//     alt: `${artist.name || "Artist"}'s photo`,
//     classes: "artist-photo"
//   });

//   photoSection.appendChild(photoImg);

//   if (isCreator) {
//     const photoEditButton = createElement("button", { class: "edit-banner-pic" }, ["Edit Photo"]);
//     photoEditButton.addEventListener("click", () => {
//       updateImageWithCrop({
//         entityType: EntityType.ARTIST,
//         imageType: "photo",
//         stateKey: "photo",
//         stateEntityKey: "artist",
//         previewElementId: "artist-avatar-img",
//         pictureType: PictureType.PHOTO,
//         entityId: artist.artistid
//       });
//     });
//     photoSection.appendChild(photoEditButton);
//   }

//   return photoSection;
// }

// // --- MAIN DISPLAY ---
// export async function displayArtist(content, artistID, isLoggedIn) {
//   content.replaceChildren();
//   const contentContainer = createElement("div", { class: "artistpage" });
//   content.appendChild(contentContainer);

//   try {
//     const artist = await apiFetch(`/artists/${artistID}`);
//     if (!artist) {
//       contentContainer.appendChild(createElement("p", {}, ["Artist not found."]));
//       return;
//     }

//     const user = getState("user");
//     const isCreator = isLoggedIn && artist.creatorid === user;
//     const isSubscribed = artist.subscribed === true;

//     // --- PHOTO & BANNER ROW ---
//     const photoBannerRow = createElement("div", { class: "hflex-sb photocon" });
//     const photoSection = createArtistPhotoSection(artist, isCreator);
//     if (photoSection) photoBannerRow.appendChild(photoSection);
//     photoBannerRow.appendChild(createArtistBannerSection(artist, isCreator));
//     contentContainer.appendChild(photoBannerRow);

//     // --- BUTTONS ---
//     const buttonRow = createElement("div", { class: "hflex hcen" });

//     const subscribeButton = Button(isSubscribed ? "Unsubscribe" : "Subscribe", "", {
//       click: () => SubscribeToArtist(subscribeButton, artist.artistid)
//     }, "buttonx");
//     buttonRow.appendChild(subscribeButton);

//     const reportButton = Button("Report", "report-btn", {
//       click: () => reportPost(artistID, "artist")
//     }, "buttonx");
//     buttonRow.appendChild(reportButton);

//     if (isCreator) {
//       const editDiv = createElement("div", { class: "editdiv", id: "editevent" });
//       buttonRow.appendChild(editDiv);
//     }

//     contentContainer.appendChild(buttonRow);

//     // --- TABS ---
//     const tabs = [
//       { title: "Overview", id: "artist-overview", render: (c) => renderOverviewTab(c, artist, isCreator, isLoggedIn) },
//       { title: "Events", id: "artist-events", render: (c) => renderEventsTab(c, artistID, isCreator) },
//       { title: "Posts", id: "artist-posts", render: (c) => renderPostsTab(c, artistID, isLoggedIn) },
//       { title: "Live", id: "artist-live", render: (c) => renderLiveTab(c, artistID, isLoggedIn, isCreator) },
//       { title: "Merch", id: "artist-merch", render: (c) => renderMerchTab(c, artistID, isCreator, isLoggedIn) }
//     ];

//     const songCategories = ["singer", "band", "musician", "rapper", "composer"];
//     if (songCategories.includes(artist.category?.toLowerCase())) {
//       tabs.push({ title: "Songs", id: "songs", render: (c) => renderSongsTab(c, artistID, isCreator) });
//     }

//     persistTabs(contentContainer, tabs, `artist-tabs:${artistID}`);

//   } catch (error) {
//     contentContainer.replaceChildren();
//     contentContainer.appendChild(
//       createElement("p", {}, [`Error loading artist profile: ${error.message}`])
//     );
//   }
// }

// // --- SUPPORT ---
// function getSocialIcon(platform) {
//   const lc = platform.toLowerCase();
//   const icons = {
//     instagram: "📸",
//     twitter: "🐦",
//     youtube: "▶️",
//     facebook: "📘",
//     tiktok: "🎵",
//     spotify: "🎧",
//     soundcloud: "☁️",
//     website: "🌐",
//     link: "🔗"
//   };
//   for (const key in icons) {
//     if (lc.includes(key)) return icons[key];
//   }
//   return icons.link;
// }


// /**
//  * Subscribe to an artist
//  */
// function SubscribeToArtist(followBtn, artistId) {
//   toggleAction({
//     entityId: artistId,
//     entityType: "artist",
//     button: followBtn,
//     apiPath: "/subscribes/",
//     labels: { on: "Unsubscribe", off: "Subscribe" },
//     actionName: "subscribed"
//   });
// }


// // --- OVERVIEW TAB ---
// function renderOverviewTab(container, artist, isCreator, isLoggedIn) {
//   const artistDiv = createElement("div", { class: "artist-container" });
//   artistDiv.appendChild(createElement("h2", { class: "artist-name" }, [artist.name || "Unknown Artist"]));

//   const detailsDiv = createElement("div", { class: "artist-details" });
//   [
//     { label: "🎨 Artist Type", value: artist.category || "Unknown" },
//     { label: "📖 Biography", value: artist.bio || "No biography available" },
//     { label: "🎂 Date of Birth", value: artist.dob || "" },
//     { label: "📍 Place", value: [artist.place, artist.country].filter(Boolean).join(", ") },
//     { label: "🎶 Genres", value: Array.isArray(artist.genres) && artist.genres.length > 0 ? artist.genres.join(", ") : "None" }
//   ].forEach(({ label, value }) =>
//     detailsDiv.appendChild(createElement("p", {}, [createElement("strong", {}, [`${label}:`]), ` ${value}`]))
//   );
//   artistDiv.appendChild(detailsDiv);

//   // Band Members
//   if (artist.members?.length > 0) {
//     const memberItems = artist.members.map(member => {
//       let photoEditButton;

//       if (isCreator) {
//         photoEditButton = Button(`Edit ${member.name}'s photo`, "button", {}, "edit-member-pic buttonx secondary");
//         photoEditButton.addEventListener("click", () => {
//           updateImageWithCrop({
//             entityType: EntityType.MEMBER,
//             imageType: "photo",
//             stateKey: "photo",
//             stateEntityKey: "member",
//             previewElementId: "member-avatar-img",
//             pictureType: PictureType.PHOTO,
//             entityId: member.artistid
//           });
//         });
//       }
//       const photoSrc = resolveImagePath(EntityType.ARTIST, PictureType.THUMB, member.image);
//       const img = Imagex({ src: photoSrc, alt: member.name, classes: "member-photo" });

//       const text = createElement("div", { class: "member-text" }, [
//         createElement("span", {}, [
//           `${member.name}${member.role ? " - " + member.role : ""}${member.dob ? " (DOB: " + member.dob + ")" : ""}`
//         ])
//       ]);
//       return createElement("li", { class: "member-item" }, [photoEditButton, img, text]);
//     });

//     artistDiv.appendChild(
//       createElement("div", { class: "band-members" }, [
//         createElement("p", {}, [createElement("strong", {}, ["👥 Band Members:"])]),
//         createElement("ul", {}, memberItems)
//       ])
//     );
//   }

//   // Social Links
//   if (artist.socials && typeof artist.socials === "object") {
//     const socialLinks = Object.entries(artist.socials).map(([platform, url]) =>
//       createElement("a", { href: url, target: "_blank", class: "social-link", rel: "noopener noreferrer" }, [`${getSocialIcon(platform)} ${platform}`])
//     );
//     artistDiv.appendChild(
//       createElement("div", { class: "socials" }, [
//         createElement("p", {}, [createElement("strong", {}, ["🔗 Socials:"])]),
//         ...socialLinks
//       ])
//     );
//   }

//   // Creator-only actions
//   if (isCreator) {
//     artistDiv.appendChild(Button("✏️ Edit Artist", "", {
//       click: async () => {
//         const existingArtist = await apiFetch(`/artists/${artist.artistid}`);
//         const editContainer = document.getElementById("editartist") || container;
//         createOrEditArtist({
//           isLoggedIn,
//           content: editContainer,
//           mode: "edit",
//           artistID: artist.artistid,
//           existingArtist,
//           isCreator
//         });
//       }
//     }, "edit-artist-btn buttonx"));

//     artistDiv.appendChild(Button("🗑️ Request Deletion", "", {
//       click: () => deleteArtistForm(isLoggedIn, artist.artistid, isCreator)
//     }, "del-artist-btn buttonx"));

//     if (!document.getElementById("editartist")) {
//       container.appendChild(createElement("div", { class: "editform", id: "editartist" }));
//     }
//   }

//   container.appendChild(artistDiv);
// }
