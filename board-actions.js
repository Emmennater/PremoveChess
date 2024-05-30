

function BoardActions(game) {
    const mouse = { x: 0, y: 0 };
    const selectedTile = { selected: false, col: 0, row: 0 };
    const animationDelay = 0.2;
    let pickedUpPiece = "";
    let startCol = 0;
    let startRow = 0;
    let activeGame = null;
    let pieceAnimating = false;
    let wasSelected = false;
    let busy = false;

    function setBoardEvents(game) {
        const board = document.getElementById("board");
        activeGame = game;

        board.addEventListener("mousedown", (e) => {
            if (pieceAnimating || busy) return;
            let target = e.target.classList.contains("piece") ? e.target.parentNode : e.target;
            if (target.classList.contains("square")) {
                const { col, row } = getColRowFromElement(target);
                squarePressed(target, col, row);
            }
        });

        board.addEventListener("mouseup", (e) => {
            if (pieceAnimating || busy) return;
            let target = e.target.classList.contains("piece") ? e.target.parentNode : e.target;
            if (target.classList.contains("square")) {
                const { col, row } = getColRowFromElement(target);
                squareReleased(target, col, row);
            }
        });

        setWindowEvents();
    }

    function setWindowEvents() {
        window.addEventListener('dragstart', e => e.preventDefault());
        document.addEventListener('mousemove', handleMouseMove);

        document.body.addEventListener("mousedown", e => {
            if (pieceAnimating || busy) return;
            if (!e.target.classList.contains("piece")) {
                selectedTile.selected = false;
            }
        });

        document.body.addEventListener("mouseup", e => {
            if (pieceAnimating || busy) return;
            if (!e.target.classList.contains("square")) {
                dropPiece(startCol, startRow);
                deselectSquare();
            }
        });
    }

    function squarePressed(element, col, row) {
        if (selectedTile.selected && activeGame.isLegalMove(startCol, startRow, col, row)) {
            moveMade(selectedTile.col, selectedTile.row, col, row, true);
            movePiece(selectedTile.col, selectedTile.row, col, row, true);
            deselectSquare();
        } else {
            startCol = col;
            startRow = row;
            pickUpPiece(col, row);
        }
    }

    function squareReleased(element, col, row) {
        if (dropPiece(col, row)) {
            deselectSquare();
        } else if (wasSelected || col !== startCol || row !== startRow) {
            deselectSquare();
        }
    }

    function pickUpPiece(col, row) {
        pickedUpPiece = getPieceIconImage(col, row);
        if (pickedUpPiece === "") {
            deselectSquare();
            return;
        }

        wasSelected = selectedTile.selected && col === selectedTile.col && row === selectedTile.row;
        selectSquare(col, row);
        setPieceIcon(col, row, "");
        setMainCursor("grabbing");

        const pickedUpElem = document.getElementById("picked-up-piece");
        pickedUpElem.style.backgroundImage = pickedUpPiece;
    }

    function dropPiece(col, row) {
        if (pickedUpPiece === "") return false;

        setMainCursor("default");
        setPickedUpImage("");

        if (activeGame.isLegalMove(startCol, startRow, col, row)) {
            moveMade(startCol, startRow, col, row, false);
            setPieceIconImage(col, row, pickedUpPiece);
            pickedUpPiece = "";
            return true;
        } else {
            setPieceIconImage(startCol, startRow, pickedUpPiece);
            pickedUpPiece = "";
            return false;
        }
    }

    function setPickedUpImage(img) {
        const pickedUpElem = document.getElementById("picked-up-piece");
        pickedUpElem.style.backgroundImage = img;
    }

    function movePiece(fromCol, fromRow, toCol, toRow, animate = false) {
        pieceAnimating++;

        const board = document.getElementById("board");
        const boardPos = board.getBoundingClientRect();
        const fromSquare = getSquareElemAt(fromCol, fromRow);
        const toSquare = getSquareElemAt(toCol, toRow);
        const fromPiece = fromSquare.children[0];
        const toPiece = toSquare.children[0];
        const fromPos = fromSquare.getBoundingClientRect();
        const toPos = toSquare.getBoundingClientRect();

        const complete = () => {
            const pickedUp = getPieceIconImage(fromCol, fromRow);
            setPieceIcon(fromCol, fromRow, "");
            setPieceIconImage(toCol, toRow, pickedUp);
            fromPiece.style.position = "";
            fromPiece.style.transition = "";
            fromPiece.style.backgroundImage = "";
            fromPiece.style.left = "0px";
            fromPiece.style.top = "0px";
            pieceAnimating--;
        };

        if (!animate) return complete();

        // Set initial piece position
        fromPiece.style.position = "absolute";
        fromPiece.style.left = `${fromPos.x - boardPos.x}px`;
        fromPiece.style.top = `${fromPos.y - boardPos.y}px`;

        // Set final piece position
        setTimeout(() => {
            fromPiece.style.transition = `${animationDelay}s linear`;
            fromPiece.style.left = `${toPos.x - boardPos.x}px`;
            fromPiece.style.top = `${toPos.y - boardPos.y}px`;
        }, 1);

        // Moving the piece image
        setTimeout(complete, animationDelay * 1000);

        // // Remove image from old square
        // pieceAnimating = true;
        // const pickedUp = getPieceIconImage(fromCol, fromRow);
        // setPieceIcon(fromCol, fromRow, "");

        // // Set dummy piece image
        // const pickedUpElem = document.getElementById("picked-up-piece");
        // pickedUpElem.style.backgroundImage = pickedUp;

        // // Set initial dummy position
        // const startPos = getSquareElemAt(fromCol, fromRow).getClientRects()[0];
        // pickedUpElem.style.left = `${startPos.x + startPos.width / 2}px`;
        // pickedUpElem.style.top = `${startPos.y + startPos.height / 2}px`;

        // // Set final dummy position
        // setTimeout(() => {
        //     pickedUpElem.style.transition = "0.2s linear";
        //     const endPos = getSquareElemAt(toCol, toRow).getClientRects()[0];
        //     pickedUpElem.style.left = `${endPos.x + endPos.width / 2}px`;
        //     pickedUpElem.style.top = `${endPos.y + endPos.height / 2}px`;
        // }, 1);

        // // Set piece image to new square
        // setTimeout(() => {
        //     setPieceIconImage(toCol, toRow, pickedUp);
        //     pickedUpElem.style.transition = "";
        //     pickedUpElem.style.backgroundImage = "";
        //     pieceAnimating = false;
        // }, 200);
    }

    function removePiece(col, row) {
        setPieceIcon(col, row, "");
    }

    function handleMouseMove(event) {
        event = event || window.event; // IE-ism
        if (event.pageX == null && event.clientX != null) {
            const eventDoc = (event.target && event.target.ownerDocument) || document;
            const doc = eventDoc.documentElement;
            const body = eventDoc.body;

            event.pageX = event.clientX +
                (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                (doc && doc.clientLeft || body && body.clientLeft || 0);
            event.pageY = event.clientY +
                (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
                (doc && doc.clientTop  || body && body.clientTop  || 0 );
        }

        mouse.x = event.pageX;
        mouse.y = event.pageY;
    }

    function setMainCursor(cursor) {
        document.body.style.cursor = cursor;
    }

    function deselectSquare() {
        setSquareState(selectedTile.col, selectedTile.row, "selected", false);
        selectedTile.selected = false;

        // Hide available moves
        const captureTiles = document.getElementsByClassName("possible-capture");
        const moveTiles = document.getElementsByClassName("possible-move");
        Array.from(captureTiles).forEach(e => e.classList.remove("possible-capture"));
        Array.from(moveTiles).forEach(e => e.classList.remove("possible-move"));
    }

    function selectSquare(col, row) {
        deselectSquare();
        selectedTile.selected = true;
        selectedTile.col = col;
        selectedTile.row = row;
        setSquareState(col, row, "selected", true);

        // Show available moves
        const moves = activeGame.getLegalMovesAt(col, row);

        for (const move of moves) {
            setSquareState(move.move[2], move.move[3], move.captured ? "possible-capture" : "possible-move", true);
        }
    }

    function getColRowFromElement(element) {
        const board = document.getElementById("board");
        const idx = Array.from(board.children).indexOf(element);
        return { col: idx % gridCols, row: Math.floor(idx / gridCols) };
    }

    function getSquareElemAt(col, row) {
        const board = document.getElementById("board");
        return board.children[col + row * gridCols];
    }

    function requestPromotion(col, row, isWhite, callback) {
        busy = true;

        // Get square
        const square = getSquareElemAt(col, row);
        
        
        // Dim the board
        const boardElem = document.getElementById("board");
        boardElem.classList.add("dim");
        
        let rect = square.getClientRects()[0];
        let promoteElems = document.getElementsByClassName("promotion-wrapper");

        const promoPieces = "qnrb";
        for (let i = 0; i < promoPieces.length; i++) {
            let promotePiece = promoPieces[i];
            let promoteElem = promoteElems[0];
            let promoteWrapper = promoteElem;
    
            // Black or white promotion
            let promoteName = isWhite ? promotePiece.toUpperCase() : promotePiece;
            let listDirection = isWhite ? 1 : -1;
    
            promoteWrapper.setAttribute("class", "promotion-wrapper");
            promoteWrapper.setAttribute("style", `
            display: block;
            width: ${rect.width}px;
            height: ${rect.height}px;
            left: ${rect.left}px;
            top: ${rect.top + rect.height * i * listDirection}px;
            `);
    
            let promoteTile = promoteElem.children[0];
            promoteTile.setAttribute("class", "promotion");
            promoteTile.setAttribute("style", `
            background-image: url(${getPieceSrcUrl(promoteName)});
            `);
    
            // Select promotion option (dont add more than one of these!)
            promoteWrapper.onclick = () => {
                for (let promoElem of promoteElems) {
                    promoElem.setAttribute("style", "display:none");
                }
                boardElem.classList.remove("dim");
                busy = false;
                callback(promotePiece);
            };
    
            promoteWrapper.appendChild(promoteTile);
            document.body.appendChild(promoteWrapper);
        }
    }

    function moveUpdateGUI(move, animate, callback) {
        const toCol = move.move[2];
        const toRow = move.move[3];
        const toPiece = activeGame.getPieceAt(toCol, toRow);
        const whiteMoved = activeGame.isWhitesTurn();
        const kings = activeGame.getKings();

        // King side castling
        if (move.san === "O-O") {
            const row = whiteMoved ? gridCols - 1 : 0;
            movePiece(gridCols - 1, row, gridCols - 3, row, animate);
        }

        // Queen side castling
        if (move.san === "O-O-O") {
            const row = whiteMoved ? gridCols - 1 : 0;
            movePiece(0, row, 3, row, animate);
        }

        const updateElements = () => {
            // En passant
            if (move.captured && !toPiece) {
                const moveDir = whiteMoved ? -1 : 1;
                removePiece(toCol, toRow - moveDir);
            }

            // Remove all current checks
            const checkTiles = document.getElementsByClassName("check");
            Array.from(checkTiles).forEach(e => e.classList.remove("check"));

            // Check
            if (move.san.includes("+")) {
                const kingPos = whiteMoved ? kings.b : kings.w;
                setSquareState(kingPos[0], kingPos[1], "check", true);
            }

            // Promotion
            if (move.promotion) {
                requestPromotion(toCol, toRow, whiteMoved, promotionPiece => {
                    const piece = whiteMoved ? promotionPiece.toUpperCase() : promotionPiece;
                    setPieceIcon(toCol, toRow, piece);
                    callback(promotionPiece);
                });
            } else {
                callback();
            }
        }

        if (animate) setTimeout(updateElements, animationDelay * 1000)
        else updateElements();
    }

    function moveMade(fromCol, fromRow, toCol, toRow, animate = false) {
        const move = activeGame.findMove(fromCol, fromRow, toCol, toRow);
        moveUpdateGUI(move, animate, promotionPiece => {
            activeGame.makeMove(fromCol, fromRow, toCol, toRow, promotionPiece);
            activeGame.getLegalMoves();
        });
    }

    this.updateBoardActions = function() {
        if (pickedUpPiece) {
            const pickedUpElem = document.getElementById("picked-up-piece");
            pickedUpElem.style.left = `${mouse.x}px`;
            pickedUpElem.style.top = `${mouse.y}px`;
        }
    }

    setBoardEvents(game);
}
