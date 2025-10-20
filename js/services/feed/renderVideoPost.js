import VideoPlayer from '../../components/ui/VideoPlayer.mjs';

async function RenderVideoPost(mediaContainer, media, media_url = "", resolutions, subtits, posterPath) {
    // console.log(mediaContainer, media, media_url, resolutions, subtits, posterPath);
    media.forEach(videoSrc => {
        const videox = VideoPlayer({
            src: videoSrc,
            className: 'post-video',
            muted: true,
            poster: posterPath,
            loop: true,
            controls: false,
            subtitles: subtits,
            availableResolutions: resolutions
        }, media_url);

        mediaContainer.appendChild(videox);
    });
}

export { RenderVideoPost };
