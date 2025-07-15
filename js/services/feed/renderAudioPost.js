import { DEFAULT_IMAGE } from "../../state/state.js";
import AudioPlayer from '../../components/ui/AudioPlayer.mjs';

const lyrics = [
    { time: 2, text: "First line of lyrics..." },
    { time: 5, text: "Second line of lyrics..." },
    { time: 8, text: "Third line of lyrics..." },
    { time: 13, text: "Fourth line of lyrics..." },
    { time: 20, text: "First line of lyrics..." },
    { time: 25, text: "Second line of lyrics..." },
    { time: 28, text: "Third line of lyrics..." },
    { time: 33, text: "Fourth line of lyrics..." }
  ];

async function RenderAudioPost(mediaContainer, media, media_url="", resolution) {
    console.log(media_url);
    media.forEach(audioSrc => {
        const audiox = AudioPlayer({
            src: `${audioSrc}`,
            className: 'post-audio',
            muted: false,
            poster: DEFAULT_IMAGE,
            lyricsData: lyrics,
            controls: true,
        }, media_url[0], resolution);
        mediaContainer.appendChild(audiox);
    });
}

export { RenderAudioPost };