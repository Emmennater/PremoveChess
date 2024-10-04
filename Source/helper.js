
activePieceStyle = "neo";

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
    let theme = activePieceStyle; // neo, icy_sea
    let side = letter.toUpperCase() == letter ? "w" : "b";
    return `https://images.chesscomfiles.com/chess-themes/pieces/${theme}/150/${side + letter.toLowerCase()}.png`;
}

function changePieceStyle(style) {
    activePieceStyle = style;
}

function setMainCursor(cursor) {
    document.body.style.cursor = cursor;
}

function reflow(elt) {
    elt.offsetHeight; // Reading offsetHeight triggers a reflow
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

function getWindowUrl() {
    return window.location.origin + window.location.pathname;
}

function getSearchParameters() {
    const parameters = {};

    const query = window.location.search.substring(1);
    const parametersArray = query.split("&");
    for (const parameter of parametersArray) {
        const pair = parameter.split("=");
        parameters[pair[0]] = pair[1];
    }

    return parameters;
}

function shuffleArray(array) {
    let currentIndex = array.length;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}

function getRandom960Position() {
    // Generate random piece order
    const pieces = ["r", "n", "b", "q", "k", "b", "n", "r"];
    let pieceOrder = "";

    while (true) {
        shuffleArray(pieces);
        pieceOrder = pieces.join("");

        // Check if king is between rooks
        const kingIndex = pieceOrder.indexOf("k");
        const rookIndex1 = pieceOrder.indexOf("r");
        const rookIndex2 = pieceOrder.lastIndexOf("r");
        if (rookIndex1 < kingIndex && kingIndex < rookIndex2) {
            // Check if bishops are on opposite colors
            const bishopIndex1 = pieceOrder.indexOf("b");
            const bishopIndex2 = pieceOrder.lastIndexOf("b");
            if (bishopIndex1 % 2 !== bishopIndex2 % 2) break;
        }
    }

    // Testing
    // pieceOrder = "rqkrnnbb";

    let fen = pieceOrder + "/pppppppp/8/8/8/8/PPPPPPPP/" + pieceOrder.toUpperCase() + " w KQkq - 0 1";

    return fen;
}

