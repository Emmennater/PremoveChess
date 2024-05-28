pickedUp = "";
startCol = 0;
startRow = 0;
activeGame = null;
mouse = { x: 0, y: 0 };
selectedTile = { selected: false, col: 0, row: 0 };
pieceAnimating = false;
wasSelected = false;

function initEvents() {
    window.addEventListener('dragstart', e => {
        // Stop dragging events
        e.preventDefault();
    });
    
    document.onmousemove = handleMouseMove;
    
    document.body.addEventListener("mousedown", e => {
        if (e.target.classList.contains("square")) {
            // Clicked off the grid
            selectedTile.selected = false;
        }
    });
    
    document.body.addEventListener("mouseup", e => {
        if (!e.target.classList.contains("square")) {
            // Clicked off the grid
            dropPiece(startCol, startRow);
            deselectSquare();
        }
    });
}

function setBoardEvents(game) {
    const board = document.getElementById("board");
    activeGame = game;

    for (let c = 0; c < gridCols; c++) {
        for (let r = 0; r < gridRows; r++) {
            const squareElem = board.children[c + r * gridCols];
            
            squareElem.addEventListener("mousedown", () => {
                squarePressed(squareElem, c, r);
            });

            squareElem.addEventListener("mouseup", () => {
                squareReleased(squareElem, c, r);
            });
        }
    }
}

function squarePressed(element, col, row) {
    if (pieceAnimating) return;

    if (selectedTile.selected && isLegalMove(activeGame, startCol, startRow, col, row)) {
        // Move piece
        movePieceAnimate(selectedTile.col, selectedTile.row, col, row);
        deselectSquare();
        return;
    }
    
    startCol = col;
    startRow = row;
    pickUpPiece(col, row);
}

function squareReleased(element, col, row) {
    if (dropPiece(col, row)) {
        // Piece moved
        deselectSquare(); 
    } else if (wasSelected || (col !== startCol || row !== startRow)) {
        deselectSquare();
    }
}

function pickUpPiece(col, row) {
    pickedUp = getPieceIconImage(col, row);
    
    if (pickedUp == "") {
        // No piece selected
        deselectSquare();
        return;
    }
    
    wasSelected = selectedTile.selected && col === selectedTile.col && row === selectedTile.col;

    selectSquare(col, row);
    setPieceIcon(col, row, "");
    setMainCursor("grabbing");
    const pickedUpElem = document.getElementById("picked-up-piece");
    pickedUpElem.style.backgroundImage = pickedUp;
}

function dropPiece(col, row) {
    if (pickedUp == "") return;

    setMainCursor("default");
    setPickedUpImage("");

    if (isLegalMove(activeGame, startCol, startRow, col, row)) {
        setPieceIconImage(col, row, pickedUp);
        pickedUp = "";
        return true;
    } else {
        setPieceIconImage(startCol, startRow, pickedUp);
        pickedUp = "";
        return false;
    }
}

function setPickedUpImage(img) {
    const pickedUpElem = document.getElementById("picked-up-piece");
    pickedUpElem.style.backgroundImage = img;
}

function movePieceAnimate(fromCol, fromRow, toCol, toRow) {
    pieceAnimating = true;
    const pickedUp = getPieceIconImage(fromCol, fromRow);
    setPieceIcon(fromCol, fromRow, "");
    const pickedUpElem = document.getElementById("picked-up-piece");
    pickedUpElem.style.backgroundImage = pickedUp;
    
    // Start position
    const startPos = getSquareElemAt(fromCol, fromRow).getClientRects()[0];
    pickedUpElem.style.left = `${startPos.x + startPos.width / 2}px`;
    pickedUpElem.style.top = `${startPos.y + startPos.height / 2}px`;

    setTimeout(() => {
        // Set to transition
        pickedUpElem.style.transition = "0.2s linear";
        
        // End position
        const endPos = getSquareElemAt(toCol, toRow).getClientRects()[0];
        pickedUpElem.style.left = `${endPos.x + endPos.width / 2}px`;
        pickedUpElem.style.top = `${endPos.y + endPos.height / 2}px`;
    }, 1);

    setTimeout(() => {
        setPieceIconImage(toCol, toRow, pickedUp);
        pickedUpElem.style.transition = "";
        pickedUpElem.style.backgroundImage = "";
        pieceAnimating = false;
    }, 200);
}

function handleMouseMove(event) {
    let eventDoc, doc, body;

    event = event || window.event; // IE-ism

    // If pageX/Y aren't available and clientX/Y are,
    // calculate pageX/Y - logic taken from jQuery.
    // (This is to support old IE)
    if (event.pageX == null && event.clientX != null) {
        eventDoc = (event.target && event.target.ownerDocument) || document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;

        event.pageX = event.clientX +
            (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
            (doc && doc.clientLeft || body && body.clientLeft || 0);
        event.pageY = event.clientY +
            (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
            (doc && doc.clientTop  || body && body.clientTop  || 0 );
    }

    // Use event.pageX / event.pageY here
    mouse.x = event.pageX;
    mouse.y = event.pageY;
}

function updateBoardActions() {
    if (pickedUp) {
        const pickedUpElem = document.getElementById("picked-up-piece");
        pickedUpElem.style.left = `${mouse.x}px`;
        pickedUpElem.style.top = `${mouse.y}px`;
    }
}

function setMainCursor(cursor) {
    document.body.style.cursor = cursor;
}

function deselectSquare() {
    setSelectedSquare(selectedTile.col, selectedTile.row, false);
    selectedTile.selected = false;
}

function selectSquare(col, row) {
    deselectSquare();
    selectedTile.selected = true;
    selectedTile.col = col;
    selectedTile.row = row;
    setSelectedSquare(col, row, true);
}
