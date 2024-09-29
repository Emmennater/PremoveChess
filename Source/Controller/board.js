
class ChessBoard {
    static animationDelay = 0.2;
    static pieceAnimating = 0;
    static activeGame = null;
    static lastPremove = null;
    static whitesMove = true;
    static gameOver = false;
    static whiteWins = false;

    static setActiveGame(game) {
        ChessBoard.activeGame = game;
    }

    static resetBoard(fen = defaultFen, isSolo = true, opponentsTurn = false) {
        if (isSolo && ChessElements.flipped) {
            ChessElements.flipBoard();
        }
        
        ChessBoard.gameOver = false;
        ChessBoard.whiteWins = false;
        ChessBoard.lastPremove = null;
        ChessBoard.activeGame.loadFen(fen);
        ChessBoard.whitesMove = ChessBoard.activeGame.isWhitesTurn();
        ChessBoard.activeGame.getLegalPremoves(ChessBoard.whitesMove);
        ChessBoard.updatePieces(ChessBoard.activeGame);
        ChessActions.isSoloGame = isSolo;
        ChessActions.opponentsTurn = opponentsTurn ^ (!ChessBoard.whitesMove && !isSolo);
        ChessElements.resetStates();

        const turnText = document.getElementById("turn-text");
        
        ChessBoard.updateTurnMessage();
        ChessBoard.updateGameOverMessage();
    }

    static movePiece(fromCol, fromRow, toCol, toRow, animate = false) {
        // Prevent moving to same square
        if (fromCol === toCol && fromRow === toRow) return;
        
        ChessBoard.pieceAnimating++;

        const boardRect = ChessElements.getBoardRect();
        const fromSquare = ChessElements.getSquareAt(fromCol, fromRow);
        const toSquare = ChessElements.getSquareAt(toCol, toRow);
        const fromPos = fromSquare.getBoundingClientRect();
        const toPos = toSquare.getBoundingClientRect();
        const fromPiece = fromSquare.children[0];
        const imgBefore = ChessElements.getPieceImage(fromCol, fromRow);

        const complete = () => {
            // Move the piece
            const imgNow = ChessElements.getPieceImage(fromCol, fromRow);
            ChessElements.setPieceImage(toCol, toRow, imgBefore);

            if (imgNow === imgBefore) {
                ChessElements.setPieceImage(fromCol, fromRow, "");
            }
            
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

    static moveUpdateGUI(move, animate, callback) {
        const game = ChessBoard.activeGame;
        const gridCols = ChessElements.gridCols;
        const fromCol = move.move[0];
        const fromRow = move.move[1];
        const toCol = move.move[2];
        const toRow = move.move[3];
        const toPiece = game.getPieceAt(toCol, toRow);
        const whiteMoved = game.isWhitesTurn();
        const us = whiteMoved ? "w" : "b";
        const kings = game.getKings();
        const rooks = game.getRookStarts();
        const promotionPiece = move.promotion ? whiteMoved ? move.promotion.toUpperCase() : move.promotion : null;

        // Move the piece
        ChessBoard.movePiece(fromCol, fromRow, toCol, toRow, animate);

        // King side castling
        if (move.san === "O-O") {
            const row = whiteMoved ? gridCols - 1 : 0;
            ChessBoard.movePiece(rooks[us][1].col, row, gridCols - 3, row, animate);
        }
        
        // Queen side castling
        if (move.san === "O-O-O") {
            const row = whiteMoved ? gridCols - 1 : 0;
            ChessBoard.movePiece(rooks[us][0].col, row, 3, row, animate);
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

    static makeMove(moveData, animate = false) {
        const game = ChessBoard.activeGame;
        const move = game.findMove(moveData);
        const whitesTurn = game.isWhitesTurn();

        if (!move) {
            ChessBoard.gameOver = "illegal move";
            ChessBoard.whiteWins = !whitesTurn;
            ChessBoard.updateGameOverMessage();
            playSound("Assets/game-end.mp3");
            return false;
        }

        // Play move sound
        if (move.san === "O-O" || move.san === "O-O-O") {
            playSound("Assets/castle.mp3");
        } else if (move.promotion) {
            playSound("Assets/promote.mp3");
        } else if (move.san.includes("+")) {
            playSound("Assets/move-check.mp3");
        } else if (move.captured) {
            playSound("Assets/capture.mp3");
        } else if (ChessActions.opponentsTurn) {
            playSound("Assets/move-opponent.mp3");
        } else {
            playSound("Assets/move-self.mp3");
        }

        ChessBoard.moveUpdateGUI(move, animate, () => {
            game.makeMove(move);
            game.getLegalPremoves(whitesTurn);
            ChessBoard.highlightChecks();

            // Game over
            const endGameState = game.getEndgameState();
            if (endGameState) {
                ChessBoard.gameOver = endGameState;
                ChessBoard.whiteWins = whitesTurn;
                ChessBoard.updateGameOverMessage();
                playSound("Assets/game-end.mp3");
            } else {
                ChessBoard.updateTurnMessage();
            }

            // Check if playing the next premove is legal
            ChessBoard.checkIfNextPremoveLegal();
        });
        
        return true;
    }

    static makePremove(move, show = false, sound = true) {
        const premove = ChessBoard.lastPremove;
        const nextPremove = move;
        let moveIsLegal = true;

        // Change turn
        ChessBoard.whitesMove = !ChessBoard.whitesMove;

        if (!ChessActions.isSoloGame) {
            ChessActions.opponentsTurn = !ChessActions.opponentsTurn;
        }

        // Update last premove
        ChessBoard.lastPremove = nextPremove;

        // Play last premove
        if (premove) {
            ChessBoard.setWhitesTurn(ChessBoard.whitesMove);
            // ChessBoard.activeGame.getLegalMoves();
            moveIsLegal = ChessBoard.makeMove(premove, true);
            ChessElements.setSquareState(premove.move[0], premove.move[1], "premove", false);
            ChessElements.setSquareState(premove.move[2], premove.move[3], "premove", false);
        } else {
            // Generate initial moves for second player
            ChessBoard.activeGame.getLegalPremoves(ChessBoard.whitesMove);
            ChessBoard.updateTurnMessage();
            if (sound) playSound("Assets/premove.mp3");

            // Check if playing the next premove is legal
            ChessBoard.checkIfNextPremoveLegal();
        }

        // Highlight illegal move
        if (!moveIsLegal) {
            ChessElements.setSquareState(premove.move[0], premove.move[1], "illegal-piece", true);
            ChessElements.setSquareState(premove.move[2], premove.move[3], "illegal-move", true);
        }

        // Highlight premove
        if (show) {
            ChessElements.setSquareState(nextPremove.move[0], nextPremove.move[1], "premove", true);
            ChessElements.setSquareState(nextPremove.move[2], nextPremove.move[3], "premove", true);
        }

        return moveIsLegal;
    }

    static checkIfNextPremoveLegal() {
        // Skip if game is already over
        if (ChessBoard.gameOver) return;
        
        const premove = ChessBoard.lastPremove;
        if (!ChessBoard.isLegalPremove(premove)) {
            // Premature game over
            ChessBoard.gameOver = "illegal move";
            ChessBoard.whiteWins = ChessBoard.whitesMove;
            ChessBoard.updateGameOverMessage();
            playSound("Assets/game-end.mp3");

            // Show illegal move
            ChessElements.setSquareState(premove.move[0], premove.move[1], "illegal-piece", true);
            ChessElements.setSquareState(premove.move[2], premove.move[3], "illegal-move", true);
        }
    }

    static isLegalPremove(moveData) {
        let promotionPiece = moveData.promotionPiece;
        if (promotionPiece) promotionPiece = promotionPiece.toLowerCase();
        ChessBoard.activeGame.getLegalMoves();
        const move = ChessBoard.activeGame.findMove(moveData);
        return move ? true : false;
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
        if (!game) return;
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

    static isOpponentWhite() {
        // Turn started out on
        return !ChessNetwork.myTurn;
    }

    static updateTurnMessage() {
        if (ChessBoard.gameOver) return;

        const boardMsg = document.getElementById("board-message");

        if (ChessActions.isSoloGame) {
            boardMsg.innerHTML = ChessBoard.whitesMove ? "White's Turn" : "Black's Turn";
        } else {
            if (ChessActions.opponentsTurn) {
                boardMsg.innerHTML = "Opponents Turn";
            } else {
                boardMsg.innerHTML = "Your Turn";
            }
        }
    }

    static updateGameOverMessage() {
        const boardMsg = document.getElementById("board-message");

        if (ChessBoard.gameOver) {
            switch (ChessBoard.gameOver) {
                case "checkmate":
                    boardMsg.textContent = "Checkmate - " + (ChessBoard.whiteWins ? "White" : "Black") + " Wins!";
                    break;
                case "stalemate":
                    boardMsg.textContent = "Stalemate";
                    break;
                case "insufficient":
                    boardMsg.textContent = "Insufficient Material";
                    break;
                case "threefold":
                    boardMsg.textContent = "Threefold Repetition";
                    break;
                case "illegal move":
                    boardMsg.textContent = "Illegal Move - " + (ChessBoard.whiteWins ? "White" : "Black") + " Wins!";
                    break;
                case "opponent left":
                    boardMsg.textContent = "Opponent Left - " + (ChessBoard.isOpponentWhite() ? "Black" : "White") + " Wins!";
                    break;
            }

            // Game over
            if (ChessBoard.gameOver && ChessNetwork.isRunning && ChessBoard.gameOver !== "opponent left") {
                MenuEvents.askForRematch();
            }
        }
    }
}
