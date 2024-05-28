gridCols = 0;
gridRows = 0;

function setBoardColumns(cols) {
    const board = document.getElementById("board");
    board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
}

function setGridElementSize(cols, rows) {
    gridCols = cols;
    gridRows = rows;

    setBoardColumns(cols);
    
    const board = document.getElementById("board");
    board.children = [];
    
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            const square = document.createElement("div");
            square.classList.add("square");
            square.setAttribute("draggable", "false");

            if (c % 2 ^ r % 2) square.classList.add("odd-square");
            else square.classList.add("even-square");

            const piece = document.createElement("div");
            piece.classList.add("piece");
            
            square.appendChild(piece);
            board.appendChild(square);
        }
    }
}

function getPieceSrcUrl(letter) {
    let side = letter.toUpperCase() == letter ? "w" : "b";
    return `https://images.chesscomfiles.com/chess-themes/pieces/icy_sea/150/${side + letter.toLowerCase()}.png`;
}

function setPieceIcon(col, row, type) {
    const squareElem = getSquareElemAt(col, row);
    const pieceElem = squareElem.children[0];

    if (type == "") {
        pieceElem.style.visibility = "hidden";
    } else {
        pieceElem.style.visibility = "visible";
        pieceElem.style.backgroundImage = `url(${getPieceSrcUrl(type)})`;
    }
}

function setPieceIconImage(col, row, img) {
    const squareElem = getSquareElemAt(col, row);
    const pieceElem = squareElem.children[0];

    if (img == "") {
        pieceElem.style.visibility = "hidden";
    } else {
        pieceElem.style.visibility = "visible";
        pieceElem.style.backgroundImage = img;
    }
}

function setSelectedSquare(col, row, selected) {
    const squareElem = getSquareElemAt(col, row);
    
    if (selected) {
        squareElem.classList.add("selected");
    } else {
        squareElem.classList.remove("selected");
    }
}

function getPieceIconImage(col, row) {
    const squareElem = getSquareElemAt(col, row);
    const pieceElem = squareElem.children[0];

    if (pieceElem.style.visibility == "hidden") return "";
    return pieceElem.style.backgroundImage;
}

function getSquareElemAt(col, row) {
    const board = document.getElementById("board");
    return board.children[col + row * gridCols];
}

function validateSquare(col, row) {
    return col >= 0 && row >= 0 && col < gridCols && row < gridRows;
}

function updatePieces(game) {
    const board = document.getElementById("board");
    for (let c = 0; c < gridCols; c++) {
        for (let r = 0; r < gridRows; r++) {
            const type = getPieceAt(game, c, r);
            setPieceIcon(c, r, type);
        }
    }
}
