import {
  renderPostsTab,
  renderMerchTab,
  renderEventsTab
} from "./artistTabs.js";
import { renderSongsTab } from "./artistSongsTab.js";
import { SRC_URL, apiFetch } from "../../api/api.js";
import { editArtist, deleteArtistForm } from "./createOrEditArtist.js";
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
  // if (!artist.photo) return null;

  const photoSection = createElement("div", { class: "artist-photo" });
  const photoSrc = resolveImagePath(EntityType.ARTIST, PictureType.THUMB, artist.photo);

  const photoImg = createElement("img", {
    id: "artist-avatar-img",
    src: photoSrc,
    alt: `${artist.name || "Artist"}'s photo`,
    class: "artist-photo"
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
  content.innerHTML = "";
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
      click: () => SubscribeToArtist(subscribeButton, user, artistID)
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
      { title: "Overview", id: "overview", render: (c) => renderOverviewTab(c, artist, isCreator, isLoggedIn) },
      { title: "Events", id: "events", render: (c) => renderEventsTab(c, artistID, isCreator) },
      { title: "Posts", id: "posts", render: (c) => renderPostsTab(c, artistID, isLoggedIn) },
      { title: "Merch", id: "merch", render: (c) => renderMerchTab(c, artistID, isCreator, isLoggedIn) }
    ];

    const songCategories = ["singer", "band", "musician", "rapper", "composer"];
    if (songCategories.includes(artist.category?.toLowerCase())) {
      tabs.push({ title: "Songs", id: "songs", render: (c) => renderSongsTab(c, artistID, isCreator) });
    }

    persistTabs(contentContainer, tabs, `artist-tabs:${artistID}`);

  } catch (error) {
    contentContainer.innerHTML = "";
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

function SubscribeToArtist(followBtn, userid, artist) {
  toggleAction({
    entityId: userid,
    button: followBtn,
    targetObject: artist,
    apiPath: "/subscribe/",
    property: "isSubscribed",
    labels: { on: "Unsubscribe", off: "Subscribe" },
    actionName: "followed"
  });
}

// --- OVERVIEW TAB ---
function renderOverviewTab(container, artist, isCreator, isLoggedIn) {
  const artistDiv = createElement("div", { class: "artist-container" });
  artistDiv.appendChild(createElement("h2", { class: "artist-name" }, [artist.name]));

  const detailsDiv = createElement("div", { class: "artist-details" });
  [
    { label: "🎨 Artist Type", value: artist.category },
    { label: "📖 Biography", value: artist.bio },
    { label: "🎂 Date of Birth", value: artist.dob },
    { label: "📍 Place", value: `${artist.place}, ${artist.country}` },
    { label: "🎶 Genres", value: artist.genres.join(", ") }
  ].forEach(({ label, value }) =>
    detailsDiv.appendChild(createElement("p", {}, [createElement("strong", {}, [`${label}:`]), ` ${value}`]))
  );
  artistDiv.appendChild(detailsDiv);

  // // Band Members
  // if (artist.members?.length > 0) {
  //   const memberItems = artist.members.map(member => {
  //     const photoSrc = resolveImagePath(EntityType.ARTIST, PictureType.THUMB, member.image);
  //     const img = createElement("img", { src: photoSrc, alt: member.name, class: "member-photo" });
  //     const text = createElement("div", { class: "member-text" }, [
  //       createElement("span", {}, [
  //         `${member.name}${member.role ? " - " + member.role : ""}${member.dob ? " (DOB: " + member.dob + ")" : ""}`
  //       ])
  //     ]);
  //     return createElement("li", { class: "member-item" }, [img, text]);
  //   });
  //   artistDiv.appendChild(
  //     createElement("div", { class: "band-members" }, [
  //       createElement("p", {}, [createElement("strong", {}, ["👥 Band Members:"])]),
  //       createElement("ul", {}, memberItems)
  //     ])
  //   );
  // }

  // Band Members
if (artist.members?.length > 0) {
  const memberItems = artist.members.map(member => {
    const photoSrc = resolveImagePath(EntityType.ARTIST, PictureType.THUMB, member.image);
    const img = createElement("img", { src: photoSrc, alt: member.name, class: "member-photo" });

    // // Add creator-only edit button per member
    // if (isCreator) {
    //   const editBtn = createElement("button", { class: "edit-member-pic" }, ["Edit Photo"]);
    //   editBtn.addEventListener("click", () => {
    //     updateImageWithCrop({
    //       entityType: EntityType.ARTIST,
    //       imageType: "member",
    //       stateKey: "image",
    //       stateEntityKey: "member",
    //       previewElementId: img.id || null,
    //       pictureType: PictureType.MEMBER,
    //       entityId: member.memberid // must exist in member object
    //     });
    //   });
    //   const wrapper = createElement("div", { class: "member-photo-wrapper" }, [img, editBtn]);
    //   const text = createElement("div", { class: "member-text" }, [
    //     createElement("span", {}, [
    //       `${member.name}${member.role ? " - " + member.role : ""}${member.dob ? " (DOB: " + member.dob + ")" : ""}`
    //     ])
    //   ]);
    //   return createElement("li", { class: "member-item" }, [wrapper, text]);
    // }

    const text = createElement("div", { class: "member-text" }, [
      createElement("span", {}, [
        `${member.name}${member.role ? " - " + member.role : ""}${member.dob ? " (DOB: " + member.dob + ")" : ""}`
      ])
    ]);
    return createElement("li", { class: "member-item" }, [img, text]);
  });

  artistDiv.appendChild(
    createElement("div", { class: "band-members" }, [
      createElement("p", {}, [createElement("strong", {}, ["👥 Band Members:"])]),
      createElement("ul", {}, memberItems)
    ])
  );
}

  // Social Links
  if (artist.socials) {
    const socialLinks = Object.entries(artist.socials).map(([platform, url]) =>
      createElement("a", { href: url, target: "_blank", class: "social-link", rel: "noopener noreferrer" }, [`${getSocialIcon(platform)} ${platform}`])
    );
    artistDiv.appendChild(
      createElement("div", { class: "socials" }, [
        createElement("p", {}, [createElement("strong", {}, ["🔗 Socials:"])]),
        ...socialLinks
      ])
    );
  }

// Creator-only actions
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

  // Ensure edit form container exists
  if (!document.getElementById("editartist")) {
      container.appendChild(createElement("div", { class: "editform", id: "editartist" }));
  }
}

  container.appendChild(artistDiv);
}
