
String.prototype.matches = function(string) {
    return this.substring(0, string.length) == string;
}

function parseCoordinates(input) {
    // Helper function to convert column letter to index
    function colToIndex(col) {
        return col.charCodeAt(0) - 'a'.charCodeAt(0);
    }
    
    // Helper function to convert row number to index
    function rowToIndex(row) {
        return rows - (row.charCodeAt(0) - '0'.charCodeAt(0)) - 1;
    }
    
    // Extract start and end columns and rows
    const startCol = colToIndex(input.charAt(0));
    const startRow = rowToIndex(input.charAt(1));
    const endCol = colToIndex(input.charAt(2));
    const endRow = rowToIndex(input.charAt(3));
    
    return [startCol, startRow, endCol, endRow];
}

function getCoordinates(fromCol, fromRow, toCol, toRow) {
    const code0 = '0'.charCodeAt(0);
    const codea = 'a'.charCodeAt(0);
    return String.fromCharCode(codea + fromCol) +
        String.fromCharCode(code0 + rows - fromRow - 1) +
        String.fromCharCode(codea + toCol) +
        String.fromCharCode(code0 + rows - toRow - 1);
}

function getPieceSrcUrl(letter) {
    // let theme = "icy_sea";
    let theme = "neo";
    let side = letter.toUpperCase() == letter ? "w" : "b";
    return `https://images.chesscomfiles.com/chess-themes/pieces/${theme}/150/${side + letter.toLowerCase()}.png`;
}

function setMainCursor(cursor) {
    document.body.style.cursor = cursor;
}

function reflow(elt) {
    elt.offsetHeight; // Reading offsetHeight triggers a reflow
}

function playSound(audioFile) {
    const soundObject = audioObjects[audioFile];
    if (soundObject) soundObject.play();
}

function setCopyButton(buttonElem, inputElem) {
    buttonElem.addEventListener("click", function() {
        var textToCopy = inputElem.value;
        navigator.clipboard.writeText(textToCopy).then(function() {
            Notification.show("Copied to clipboard!");
        }, function(err) {
            console.error('Could not copy text: ', err);
        });
    });
}

function randomString(len) {
    // Generate a random stringth of the given length
    let s = "";
    for (let i = 0; i < len; i++) {
        s += Math.floor(Math.random() * 10).toString();
    }
    return s;
}

function isMobileDevice() {
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return mobileRegex.test(navigator.userAgent);
}
