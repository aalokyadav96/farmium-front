import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
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

async function RenderAudioPost(mediaContainer, media_url = "", resolution) {
    const audioSrc = resolveImagePath(EntityType.FEED, PictureType.AUDIO, `${media_url}.mp3`);
    const posterPath = resolveImagePath(EntityType.FEED, PictureType.THUMB, `${media_url}.jpg`);

    const audiox = AudioPlayer({
        src: audioSrc,
        className: 'post-audio',
        muted: false,
        poster: posterPath,
        lyricsData: lyrics,
        controls: true,
        resolutions: resolution,
    });

    mediaContainer.appendChild(audiox);
}

export { RenderAudioPost };

// import { DEFAULT_IMAGE, SRC_URL } from "../../state/state.js";
// import AudioPlayer from '../../components/ui/AudioPlayer.mjs';

// const lyrics = [
//     { time: 2, text: "First line of lyrics..." },
//     { time: 5, text: "Second line of lyrics..." },
//     { time: 8, text: "Third line of lyrics..." },
//     { time: 13, text: "Fourth line of lyrics..." },
//     { time: 20, text: "First line of lyrics..." },
//     { time: 25, text: "Second line of lyrics..." },
//     { time: 28, text: "Third line of lyrics..." },
//     { time: 33, text: "Fourth line of lyrics..." }
//   ];

// async function RenderAudioPost(mediaContainer, media_url="", resolution) {
//         const audiox = AudioPlayer({
//             src: `${SRC_URL}/postpic/${media_url}/${media_url}.mp3`,
//             className: 'post-audio',
//             muted: false,
//             poster: DEFAULT_IMAGE,
//             lyricsData: lyrics,
//             controls: true,
//             resolutions: resolution,
//         });
//         mediaContainer.appendChild(audiox);
// }

// export { RenderAudioPost };