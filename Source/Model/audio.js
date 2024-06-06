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
];

// Object to hold audio instances
const audioObjects = {};

// Function to initialize audio
function initializeAudio() {
    audioFiles.forEach(file => {
        const audio = new Audio(file);
        audioObjects[file] = audio;
    });

    // Remove the event listener after the first click
    document.removeEventListener('click', initializeAudio);
}

// Add event listener for the first click
document.addEventListener('click', initializeAudio);