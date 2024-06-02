
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
    let side = letter.toUpperCase() == letter ? "w" : "b";
    return `https://images.chesscomfiles.com/chess-themes/pieces/icy_sea/150/${side + letter.toLowerCase()}.png`;
}

function setMainCursor(cursor) {
    document.body.style.cursor = cursor;
}

function reflow(elt) {
    elt.offsetHeight; // Reading offsetHeight triggers a reflow
}
