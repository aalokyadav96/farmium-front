const Vidplayer = () => {
    // Utility to select elements
    var QS = function (el) {
        return document.querySelector(el);
    };

    // Video element
    var video = QS('#mainVid');
    var durationBar = QS('.play-duration-bar');
    var angle = 0;
    var flip = false;
    var hotkeysEnabled = true;

    function resetSpeed() {
        video.playbackRate = 1;
    }

    function mute() {
        video.muted = !video.muted;
        QS('#mute').innerHTML = video.muted ? '&#128263;' : '&#128266;';
    }

    // Seek video when clicking the progress bar
    QS('.play-duration').addEventListener('mousedown', function (e) {
        var rect = e.currentTarget.getBoundingClientRect();
        var fraction = (e.clientX - rect.left) / e.currentTarget.clientWidth;
        video.currentTime = video.duration * fraction;
    });

    // Update progress bar as video plays
    video.addEventListener('timeupdate', function () {
        var total = (video.currentTime / video.duration) * 100;
        durationBar.style.width = total + '%';
    });

    // Keyboard shortcuts
    window.addEventListener('keypress', function (e) {
        if (!hotkeysEnabled) return;

        switch (e.key) {
            case ',':
                video.currentTime -= 1 / 12;
                break;
            case '.':
                video.currentTime += 1 / 12;
                break;
            case 'c':
                faster();
                break;
            case 'x':
                resetSpeed();
                break;
            case 'z':
                slower();
                break;
            case 'b':
                setVolume(-0.1);
                break;
            case 'n':
                setVolume(0.1);
                break;
            case 'm':
                mute();
                break;
            case 'r':
                rotateVideo();
                break;
            case 'h':
                flipVideo();
                break;
            case 'v':
                video.paused ? video.play() : video.pause();
                break;
        }
    });

    // Adjust volume
    function setVolume(value) {
        video.volume = Math.min(1, Math.max(0, video.volume + value));
    }

    // Rotate video
    function rotateVideo() {
        angle = (angle + 90) % 360;
        video.style.transform = `rotate(${angle}deg)`;
    }

    // Flip video horizontally
    function flipVideo() {
        flip = !flip;
        video.style.transform = flip ? 'scaleX(-1)' : 'scaleX(1)';
    }

    // Mute button
    QS('#mute').addEventListener('click', mute);

    // Ensure initial mute state
    video.muted = true;
    QS('#mute').innerHTML = '&#128263;';
}

export default Vidplayer ;
export { Vidplayer };