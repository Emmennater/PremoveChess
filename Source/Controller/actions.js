
class ChessActions {
    static mouse = { x: 0, y: 0 };
    static selectedTile = { selected: false, col: 0, row: 0 };
    static pickedUpPiece = "";
    static startCol = 0;
    static startRow = 0;
    static activeGame = null;
    static wasSelected = false;
    static opponentsTurn = false;
    static isSoloGame = true;
    static gameOver = false;
    static showSoloPremoves = true;
    static moveConfirmation = false;

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
            if (!e.target.classList.contains("square") && !e.target.classList.contains("piece")) {
                ChessActions.deselectSquare();
            }
        });

        document.body.addEventListener("mouseup", e => {
            if (ChessActions.doIgnoreInput()) return;
            if (!e.target.classList.contains("square") && !e.target.classList.contains("piece")) {
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

        if (tileSelected && moveIsLegal && !ChessActions.opponentsTurn) {
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
        ChessElements.getPieceAt(col, row).classList.add("ghost");
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
        ChessElements.getPieceAt(startCol, startRow).classList.remove("ghost");
        ChessActions.setPickedUpPiece("");
        setMainCursor("default");

        // Legal move
        if (game.isLegalPremove(startCol, startRow, col, row) && !ChessActions.opponentsTurn) {
            ChessActions.moveMade(startCol, startRow, col, row, false);
            return true;
        }

        return false;
    }

    static confirmMove(fromCol, fromRow, toCol, toRow, callback) {
        // Indicate move being confirmed
        ChessElements.setSquareState(fromCol, fromRow, "premove", true);
        ChessElements.setSquareState(toCol, toRow, "premove", true);
        
        Notification.ask("Confirm move?", confirmed => {
            // Revert premove style changes
            ChessElements.setSquareState(fromCol, fromRow, "premove", false);
            ChessElements.setSquareState(toCol, toRow, "premove", false);

            callback(confirmed);
        });
    }

    static moveMade(fromCol, fromRow, toCol, toRow, animate) {
        const move = ChessBoard.activeGame.findPremove(fromCol, fromRow, toCol, toRow);

        const makeMove = promotionPiece => {
            move.promotionPiece = promotionPiece;
            console.log(move);
            const showPremove = !ChessActions.isSoloGame || ChessActions.showSoloPremoves;
            const success = ChessBoard.makePremove(move, showPremove);

            // Relay move to opponent if not solo
            if (!ChessActions.isSoloGame) {
                ChessNetwork.relayMove(move);
            }
        };

        const confirmAndMakeMove = promotionPiece => {
            if (ChessActions.moveConfirmation) {
                ChessActions.confirmMove(fromCol, fromRow, toCol, toRow, accepted => {
                    if (accepted) {
                        makeMove(promotionPiece);
                    }
                })
            } else {
                makeMove(promotionPiece);
            }
        };

        if (move.isPromotion) {
            PromotionGUI.requestPromotion(toCol, toRow, ChessBoard.whitesMove, confirmAndMakeMove);
        } else {
            confirmAndMakeMove(null);
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

        // Show available premoves
        if (!ChessActions.opponentsTurn) {
            ChessBoard.showAvailablePremoves(col, row);
        }
    }

    static setPickedUpPiece(img) {
        const squareSize = ChessElements.getSquareAt(0, 0).getBoundingClientRect();
        const pickedUpElem = document.getElementById("picked-up-piece");
        pickedUpElem.style.backgroundImage = img;
        pickedUpElem.style.width = `${squareSize.width}px`;
        pickedUpElem.style.height = `${squareSize.height}px`;
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
