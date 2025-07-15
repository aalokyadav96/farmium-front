import VideoPlayer from '../../components/ui/VideoPlayer.mjs';
import { DEFAULT_IMAGE, SRC_URL } from "../../state/state.js";

async function RenderVideoPost(mediaContainer, media, media_url="", resolution) {
    media.forEach(videoSrc => {
        const videox = VideoPlayer({
            src: `${videoSrc}`,
            className: 'post-video',
            muted: true,
            poster: `${SRC_URL}/postpic/${media_url}/${media_url}.jpg`,
            // poster: DEFAULT_IMAGE,
            controls: false,
        }, media_url[0], resolution);
        mediaContainer.appendChild(videox);
    });
}

export { RenderVideoPost };


// // Fallback logic (if thumbnail might not exist):

// const posterPath = `${SRC_URL}${videoSrc.replace(/-\d{3,4}p\.mp4$/, ".jpg")}`;
// const poster = await checkIfImageExists(posterPath) ? posterPath : DEFAULT_IMAGE;

// // You’d need a checkIfImageExists function like:

// async function checkIfImageExists(url) {
//     try {
//       const res = await fetch(url, { method: "HEAD" });
//       return res.ok;
//     } catch {
//       return false;
//     }
//   }
  