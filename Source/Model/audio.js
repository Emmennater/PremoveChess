 // Define audio files
 const audioFiles = [
    "Assets/capture.mp3",
    "Assets/castle.mp3",
    "Assets/game-end.mp3",
    "Assets/game-start.mp3",
    "Assets/illegal.mp3",
    "Assets/move-check.mp3",
    "Assets/move-opponent.mp3",
    "Assets/move-self.mp3",
    "Assets/notify.mp3",
    "Assets/premove.mp3",
    "Assets/promote.mp3",
    "Assets/tenseconds.mp3",
    "Assets/button-click.m4a"
];

// Object to hold audio instances
const audioObjects = {};

// Function to initialize audio
function initializeAudio() {
    const volume = MenuSettings.get("volume") / 100;

    audioFiles.forEach(file => {
        const audio = new Audio(file);
        audioObjects[file] = audio;
        audio.volume = volume;
    });

    // Remove the event listener after the first click
    document.removeEventListener('click', initializeAudio);
}

function changeAudioVolume(volume) {
    for (const audio in audioObjects) {
        audioObjects[audio].volume = volume;
    }
}

function playSound(audioFile) {
    const soundObject = audioObjects[audioFile];
    if (soundObject) {
        soundObject.currentTime = 0;
        soundObject.play();
    }
}

// Add event listener for the first click
document.addEventListener('click', initializeAudio);
