import { SRC_URL } from "../../state/state.js";
import VideoPlayer from '../../../components/ui/VideoPlayer.mjs';

async function RenderVideoPost(mediaContainer, media, media_url="", resolution) {
    console.log(media_url);
    media.forEach(videoSrc => {
        const videox = VideoPlayer({
            src: `${videoSrc}`,
            className: 'post-video',
            muted: true,
            // poster: `${SRC_URL}${videoSrc.replaceAll("-720p.mp4", ".webp")}`,
            poster: "#",
            controls: false,
        }, media_url[0], resolution);
        mediaContainer.appendChild(videox);
    });
}

export { RenderVideoPost };