
class ChessActions {
    static mouse = { x: 0, y: 0 };
    static selectedTile = { selected: false, col: 0, row: 0 };
    static pickedUpPiece = "";
    static startCol = 0;
    static startRow = 0;
    static activeGame = null;
    static wasSelected = false;

    static doIgnoreInput() {
        return ChessBoard.pieceAnimating || PromotionGUI.isPromoting;
    }

    // Window events
    static handleMouseMove(event) {
        event = event || window.event; // IE-ism
        if (event.pageX == null && event.clientX != null) {
            const eventDoc = (event.target && event.target.ownerDocument) || document;
            const doc = eventDoc.documentElement;
            const body = eventDoc.body;

            event.pageX = event.clientX +
                (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                (doc && doc.clientLeft || body && body.clientLeft || 0);
            event.pageY = event.clientY +
                (doc && doc.scrollTop || body && body.scrollTop || 0) -
                (doc && doc.clientTop || body && body.clientTop || 0);
        }

        ChessActions.mouse.x = event.pageX;
        ChessActions.mouse.y = event.pageY;
    }

    static setWindowEvents() {
        window.addEventListener('dragstart', e => e.preventDefault());
        document.addEventListener('mousemove', ChessActions.handleMouseMove);

        document.body.addEventListener("mousedown", e => {
            if (ChessActions.doIgnoreInput()) return;
            if (!e.target.classList.contains("piece")) {
                ChessActions.deselectSquare();
            }
        });

        document.body.addEventListener("mouseup", e => {
            if (ChessActions.doIgnoreInput()) return;
            if (!e.target.classList.contains("square")) {
                // Put piece back
                ChessActions.dropPiece(ChessActions.startCol, ChessActions.startRow);
                ChessActions.deselectSquare();
            }
        });
    }

    // Board events
    static setBoardEvents(game) {
        ChessActions.activeGame = game;

        ChessElements.squareMouseDown((square, col, row) => {
            if (ChessActions.doIgnoreInput()) return;
            ChessActions.squarePressed(col, row);
        });

        ChessElements.squareMouseUp((square, col, row) => {
            if (ChessActions.doIgnoreInput()) return;
            ChessActions.squareReleased(col, row);
        });

        ChessActions.setWindowEvents();
    }

    static squarePressed(col, row) {
        const tileSelected = ChessActions.selectedTile.selected;
        const moveIsLegal = ChessActions.activeGame.isLegalPremove(ChessActions.startCol, ChessActions.startRow, col, row);

        if (tileSelected && moveIsLegal) {
            ChessActions.moveMade(ChessActions.selectedTile.col, ChessActions.selectedTile.row, col, row, true);
            ChessActions.deselectSquare();
        } else {
            ChessActions.startCol = col;
            ChessActions.startRow = row;
            ChessActions.pickUpPiece(col, row);
        }
    }

    static squareReleased(col, row) {
        const moveWasMade = ChessActions.dropPiece(col, row);
        const clickedOffSquare = col !== ChessActions.startCol || row !== ChessActions.startRow;

        if (moveWasMade || ChessActions.wasSelected || clickedOffSquare) {
            ChessActions.deselectSquare();
        }
    }

    static pickUpPiece(col, row) {
        const pieceImage = ChessElements.getPieceImage(col, row);
        
        // Empty square
        if (pieceImage === "") {
            ChessActions.deselectSquare();
            return;
        }

        const sameSquare = col === ChessActions.selectedTile.col && row === ChessActions.selectedTile.row;
        ChessActions.wasSelected = ChessActions.selectedTile.selected && sameSquare;
        
        setMainCursor("grabbing");
        ChessElements.hidePiece(col, row);
        ChessActions.selectSquare(col, row);
        ChessActions.setPickedUpPiece(pieceImage);
    }

    static dropPiece(col, row) {
        const game = ChessActions.activeGame;
        const startCol = ChessActions.startCol;
        const startRow = ChessActions.startRow;
        const piece = ChessActions.pickedUpPiece;

        // Nothing picked up
        if (piece === "") return false;

        // Put piece back
        ChessElements.setPieceImage(startCol, startRow, piece);
        ChessActions.setPickedUpPiece("");
        setMainCursor("default");

        // Legal move
        if (game.isLegalPremove(startCol, startRow, col, row)) {
            ChessActions.moveMade(startCol, startRow, col, row, false);
            return true;
        }

        return false;
    }

    static moveMade(fromCol, fromRow, toCol, toRow, animate) {
        const move = ChessBoard.activeGame.findPremove(fromCol, fromRow, toCol, toRow);

        const makeMove = promotionPiece => {
            const success = ChessBoard.makePremove(fromCol, fromRow, toCol, toRow, promotionPiece, true);
            if (!success) console.log("Failed to make move");
        };

        if (move.isPromotion) {
            PromotionGUI.requestPromotion(toCol, toRow, ChessBoard.whitesMove, makeMove);
        } else {
            makeMove(null);
        }
    }

    // Board GUI
    static deselectSquare() {
        ChessElements.setSquareState(ChessActions.selectedTile.col, ChessActions.selectedTile.row, "selected", false);
        ChessActions.selectedTile.selected = false;
        ChessBoard.hideAvailablePremoves();
    }

    static selectSquare(col, row) {
        ChessActions.deselectSquare();
        ChessActions.selectedTile.selected = true;
        ChessActions.selectedTile.col = col;
        ChessActions.selectedTile.row = row;
        ChessElements.setSquareState(col, row, "selected", true);
        ChessBoard.showAvailablePremoves(col, row);
    }

    static setPickedUpPiece(img) {
        const pickedUpElem = document.getElementById("picked-up-piece");
        pickedUpElem.style.backgroundImage = img;
        ChessActions.pickedUpPiece = img;
    }

    // Update loop
    static update() {
        if (ChessActions.pickedUpPiece) {
            const pickedUpElem = document.getElementById("picked-up-piece");
            pickedUpElem.style.left = `${ChessActions.mouse.x}px`;
            pickedUpElem.style.top = `${ChessActions.mouse.y}px`;
        }
    };
}
