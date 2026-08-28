const musicPlayer = document.getElementById("musicPlayer");
const bgMusic = document.getElementById("bgMusic");

let playing = false;

if (musicPlayer && bgMusic) {
    musicPlayer.addEventListener("click", () => {
        if (playing) {
            bgMusic.pause();
            musicPlayer.classList.remove("playing");
        } else {
            bgMusic.play().catch(() => {});
            musicPlayer.classList.add("playing");
        }
        playing = !playing;
    });
}