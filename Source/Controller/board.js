
class ChessBoard {
    static animationDelay = 0.2;
    static pieceAnimating = 0;
    static activeGame = null;
    static lastPremove = null;
    static whitesMove = true;
    static gameOver = false;

    static setActiveGame(game) {
        ChessBoard.activeGame = game;
    }

    static resetBoard(fen = defaultFen, isSolo = true, opponentsTurn) {
        if (isSolo && ChessElements.flipped) {
            ChessElements.flipBoard();
        }
        
        ChessBoard.gameOver = false;
        ChessBoard.lastPremove = null;
        ChessBoard.activeGame.loadFen(fen);
        ChessBoard.activeGame.getLegalPremoves(true);
        ChessBoard.whitesMove = ChessBoard.activeGame.isWhitesTurn();
        ChessBoard.updatePieces(ChessBoard.activeGame);
        ChessActions.isSoloGame = isSolo;
        ChessActions.opponentsTurn = opponentsTurn;
        ChessElements.resetStates();

        const turnText = document.getElementById("turn-text");
        
        ChessBoard.updateGameOver();
    }

    static movePiece(fromCol, fromRow, toCol, toRow, animate = false) {
        ChessBoard.pieceAnimating++;

        const boardRect = ChessElements.getBoardRect();
        const fromSquare = ChessElements.getSquareAt(fromCol, fromRow);
        const toSquare = ChessElements.getSquareAt(toCol, toRow);
        const fromPos = fromSquare.getBoundingClientRect();
        const toPos = toSquare.getBoundingClientRect();
        const fromPiece = fromSquare.children[0];

        const complete = () => {
            // Move the piece
            ChessElements.setPieceImage(toCol, toRow, ChessElements.getPieceImage(fromCol, fromRow));
            ChessElements.setPieceImage(fromCol, fromRow, "");
            
            // Reset transformations
            fromPiece.style.position = "";
            fromPiece.style.transition = "";
            fromPiece.style.left = "0px";
            fromPiece.style.top = "0px";

            ChessBoard.pieceAnimating--;
        };

        if (!animate) return complete();

        // Set initial piece position
        fromPiece.style.position = "absolute";
        fromPiece.style.left = `${fromPos.x - boardRect.x}px`;
        fromPiece.style.top = `${fromPos.y - boardRect.y}px`;

        // Force reflow
        reflow(fromPiece);
        
        // Set final piece position
        fromPiece.style.transition = `${ChessBoard.animationDelay}s linear`;
        fromPiece.style.left = `${toPos.x - boardRect.x}px`;
        fromPiece.style.top = `${toPos.y - boardRect.y}px`;

        // Moving the piece image
        setTimeout(complete, ChessBoard.animationDelay * 1000);
    }

    static moveUpdateGUI(move, animate, promotionPiece, callback) {
        const game = ChessBoard.activeGame;
        const gridCols = ChessElements.gridCols;
        const fromCol = move.move[0];
        const fromRow = move.move[1];
        const toCol = move.move[2];
        const toRow = move.move[3];
        const toPiece = game.getPieceAt(toCol, toRow);
        const whiteMoved = game.isWhitesTurn();
        const kings = game.getKings();

        // Move the piece
        ChessBoard.movePiece(fromCol, fromRow, toCol, toRow, animate);

        // King side castling
        if (move.san === "O-O") {
            const row = whiteMoved ? gridCols - 1 : 0;
            ChessBoard.movePiece(gridCols - 1, row, gridCols - 3, row, animate);
        }

        // Queen side castling
        if (move.san === "O-O-O") {
            const row = whiteMoved ? gridCols - 1 : 0;
            ChessBoard.movePiece(0, row, 3, row, animate);
        }

        const updateElements = () => {
            // En passant
            if (move.captured && !toPiece) {
                const moveDir = whiteMoved ? -1 : 1;
                ChessBoard.removePiece(toCol, toRow - moveDir);
            }

            // Promotion
            if (move.promotion) {
                ChessBoard.setPiece(toCol, toRow, promotionPiece);
            }

            callback();
        };

        if (animate) setTimeout(updateElements, ChessBoard.animationDelay * 1000);
        else updateElements();
    }

    static makeMove(fromCol, fromRow, toCol, toRow, promotionPiece, animate = false) {
        const game = ChessBoard.activeGame;
        const move = game.findMove(fromCol, fromRow, toCol, toRow);
        if (!move) return false;

        ChessBoard.moveUpdateGUI(move, animate, promotionPiece, () => {
            const type = promotionPiece ? promotionPiece.toLowerCase() : null;
            game.makeMove(fromCol, fromRow, toCol, toRow, type);
            ChessBoard.activeGame.getLegalPremoves(ChessBoard.whitesMove);
            ChessBoard.highlightChecks();
        });
        
        return true;
    }

    static makePremove(fromCol, fromRow, toCol, toRow, promotionPiece, show = false) {
        const premove = ChessBoard.lastPremove;
        let moveIsLegal = true;

        // Play last premove
        if (ChessBoard.lastPremove) {
            ChessBoard.setWhitesTurn(!ChessBoard.whitesMove);
            ChessBoard.activeGame.getLegalMoves();
            moveIsLegal = ChessBoard.makeMove(...premove.move, premove.promotionPiece, true);
            ChessElements.setSquareState(premove.move[0], premove.move[1], "premove", false);
            ChessElements.setSquareState(premove.move[2], premove.move[3], "premove", false);
        } else {
            // Generate initial moves for second player
            ChessBoard.activeGame.getLegalPremoves(!ChessBoard.whitesMove);
            if (ChessBoard.activeGame.premoves.length === 0) {
                if (ChessBoard.activeGame.inCheck()) {
                    ChessBoard.gameOver = "checkmate";
                } else {
                    ChessBoard.gameOver = "stalemate";
                }
            }
        }

        // Highlight illegal move
        if (!moveIsLegal) {
            ChessBoard.gameOver = "illegal move";
            ChessElements.setSquareState(premove.move[0], premove.move[1], "illegal-piece", true);
            ChessElements.setSquareState(premove.move[2], premove.move[3], "illegal-move", true);
        }

        // Highlight premove
        if (show) {
            ChessElements.setSquareState(fromCol, fromRow, "premove", true);
            ChessElements.setSquareState(toCol, toRow, "premove", true);
        }

        // Update last premove
        ChessBoard.lastPremove = { move:[fromCol, fromRow, toCol, toRow], promotionPiece };
        ChessBoard.whitesMove = !ChessBoard.whitesMove;

        if (!ChessActions.isSoloGame) {
            ChessActions.opponentsTurn = !ChessActions.opponentsTurn;
        }

        // Update text
        ChessBoard.updateGameOver();

        return moveIsLegal;
    }

    static setWhitesTurn(isWhitesTurn) {
        if (ChessBoard.activeGame.isWhitesTurn() !== isWhitesTurn) ChessBoard.activeGame.skipTurn();
    }

    static setPiece(c, r, type) {
        if (type === "") ChessElements.setPieceImage(c, r, "");
        else ChessElements.setPieceImage(c, r, `url(${getPieceSrcUrl(type)})`);
    }

    static removePiece(c, r) {
        ChessElements.setPieceImage(c, r, "");
    }

    static updatePieces(game) {
        for (let c = 0; c < game.cols; c++) {
            for (let r = 0; r < game.rows; r++) {
                const type = game.getPieceAt(c, r);
                ChessBoard.setPiece(c, r, type);
            }
        }
    }

    static highlightChecks() {
        // Remove all current checks
        const checkTiles = document.getElementsByClassName("check");
        Array.from(checkTiles).forEach(e => e.classList.remove("check"));

        // Check
        if (ChessBoard.activeGame.inCheck()) {
            const kings = ChessBoard.activeGame.getKings();
            const kingPos = ChessBoard.activeGame.isWhitesTurn() ? kings.w : kings.b;
            ChessElements.setSquareState(kingPos[0], kingPos[1], "check", true);
        }
    }

    static showAvailablePremoves(col, row) { 
        const moves = ChessBoard.activeGame.getLegalPremovesAt(col, row);

        for (const move of moves) {
            const isCapture = ChessBoard.activeGame.getPieceAt(move.move[2], move.move[3]);
            ChessElements.setSquareState(move.move[2], move.move[3], "premove-dest", true);
            if (isCapture) ChessElements.setSquareState(move.move[2], move.move[3], "oc", true);
        }
    }

    static showAvailableMoves(col, row) { 
        const moves = ChessBoard.activeGame.getLegalMovesAt(col, row);

        for (const move of moves) {
            ChessElements.setSquareState(move.move[2], move.move[3], "move-dest", true);
            if (move.captured) ChessElements.setSquareState(move.move[2], move.move[3], "oc", true);
        }
    }

    static hideAvailableMoves() {
        const moveTiles = document.getElementsByClassName("move-dest");
        const captureTiles = document.getElementsByClassName("oc");
        Array.from(moveTiles).forEach(e => e.classList.remove("move-dest"));
        Array.from(captureTiles).forEach(e => e.classList.remove("oc"));
    }

    static hideAvailablePremoves() {
        const moveTiles = document.getElementsByClassName("premove-dest");
        const captureTiles = document.getElementsByClassName("oc");
        Array.from(moveTiles).forEach(e => e.classList.remove("premove-dest"));
        Array.from(captureTiles).forEach(e => e.classList.remove("oc"));
    }

    static updateGameOver() {
        const turnText = document.getElementById("turn-text");

        if (ChessActions.isSoloGame) {
            turnText.innerHTML = ChessBoard.whitesMove ? "White's Turn" : "Black's Turn";
        } else {
            if (ChessActions.opponentsTurn) {
                turnText.innerHTML = "Opponents Turn";
            } else {
                turnText.innerHTML = "Your Turn";
            }
        }

        if (ChessBoard.gameOver) {
            switch (ChessBoard.gameOver) {
                case "checkmate":
                    turnText.textContent = "Checkmate - " + (ChessBoard.whitesMove ? "White" : "Black") + " wins!";
                    break;
                case "stalemate":
                    turnText.textContent = "Stalemate";
                    break;
                case "illegal move":
                    turnText.textContent = "Illegal move - " + (ChessBoard.whitesMove ? "Black" : "White") + " wins!";
                    break;
            }
        }
    }
}
