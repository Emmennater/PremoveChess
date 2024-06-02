
class PremoveChessGame extends ChessGame {
    constructor() {
        super();
        this.premoves = [];
    }

    createMove(fromCol, fromRow, toCol, toRow, isPromotion = false) {
        return { move: [fromCol, fromRow, toCol, toRow], isPromotion };
    }

    findPremove(fromCol, fromRow, toCol, toRow) {
        for (let move of this.premoves) {
            if (fromCol == move.move[0] && fromRow == move.move[1] &&
                toCol == move.move[2] && toRow == move.move[3]) {
                return move;
            }
        }

        return null;
    }

    getLegalPremoves(whitesTurn) {
        const moves = [];

        const raycast = (startCol, startRow, dc, dr, white, dist = Infinity) => {
            let c = startCol + dc;
            let r = startRow + dr;
            let d = 0;
            
            while (d++ < dist && this.isValidSquare(c, r)) {
                moves.push(this.createMove(startCol, startRow, c, r));
                c += dc;
                r += dr;
            }
        }

        for (let c = 0; c < this.cols; c++) {
            for (let r = 0; r < this.rows; r++) {
                const piece = this.getPieceAt(c, r);
                if (!piece) continue;

                const white = this.isWhitePiece(piece);
                if (white !== whitesTurn) continue;

                const type = piece.toLowerCase();

                switch (type) {
                case "k":
                    raycast(c, r, -1, -1, white, 1);
                    raycast(c, r, -1,  0, white, 1);
                    raycast(c, r, -1,  1, white, 1);
                    raycast(c, r,  0, -1, white, 1);
                    raycast(c, r,  0,  1, white, 1);
                    raycast(c, r,  1, -1, white, 1);
                    raycast(c, r,  1,  0, white, 1);
                    raycast(c, r,  1,  1, white, 1);
                    break;
                case "q":
                    raycast(c, r, -1, -1, white, Infinity);
                    raycast(c, r, -1,  0, white, Infinity);
                    raycast(c, r, -1,  1, white, Infinity);
                    raycast(c, r,  0, -1, white, Infinity);
                    raycast(c, r,  0,  1, white, Infinity);
                    raycast(c, r,  1, -1, white, Infinity);
                    raycast(c, r,  1,  0, white, Infinity);
                    raycast(c, r,  1,  1, white, Infinity);
                    break;
                case "b":
                    raycast(c, r, -1, -1, white, Infinity);
                    raycast(c, r, -1,  1, white, Infinity);
                    raycast(c, r,  1, -1, white, Infinity);
                    raycast(c, r,  1,  1, white, Infinity);
                    break;
                case "r":
                    raycast(c, r, -1,  0, white, Infinity);
                    raycast(c, r,  0, -1, white, Infinity);
                    raycast(c, r,  0,  1, white, Infinity);
                    raycast(c, r,  1,  0, white, Infinity);
                    break;
                case "n":
                    raycast(c, r, -1, -2, white, 1);
                    raycast(c, r,  1, -2, white, 1);
                    raycast(c, r, -2, -1, white, 1);
                    raycast(c, r,  2, -1, white, 1);
                    raycast(c, r, -1,  2, white, 1);
                    raycast(c, r,  1,  2, white, 1);
                    raycast(c, r, -2,  1, white, 1);
                    raycast(c, r,  2,  1, white, 1);
                    break;
                case "p":
                    const moveDir = white ? -1 : 1;
                    const initialRank = white ? this.rows - 2 : 1;
                    const promoteRank = white ? 0 : this.rows - 1;
                    const isPromotion = (r + moveDir) === promoteRank;

                    // Double push
                    if (r == initialRank) moves.push(this.createMove(c, r, c, r + moveDir * 2, isPromotion));

                    // Single push
                    moves.push(this.createMove(c, r, c, r + moveDir, isPromotion));

                    // Capture left
                    moves.push(this.createMove(c, r, c - 1, r + moveDir, isPromotion));

                    // Capture right
                    moves.push(this.createMove(c, r, c + 1, r + moveDir, isPromotion));

                    break;
                }
            }
        }

        // Castling
        if (whitesTurn) {
            const castling = this.chess.getCastlingRights("w");
            if (castling.k) moves.push(this.createMove(4, this.rows - 1, 6, this.rows - 1, false));
            if (castling.q) moves.push(this.createMove(4, this.rows - 1, 2, this.rows - 1, false));
        } else {
            const castling = this.chess.getCastlingRights("b");
            if (castling.k) moves.push(this.createMove(4, 0, 6, 0, false));
            if (castling.q) moves.push(this.createMove(4, 0, 2, 0, false));
        }

        this.premoves = moves;
        return moves;
    }

    getLegalPremovesAt(col, row) {
        let moves = [];

        if (ChessBoard.gameOver) return moves;

        for (let move of this.premoves) {
            if (col == move.move[0] && row == move.move[1]) {
                // Move found
                moves.push(move);
            }
        }
        
        return moves;
    }

    isLegalPremove(fromCol, fromRow, toCol, toRow) {
        if (ChessBoard.gameOver) return false;
        return this.findPremove(fromCol, fromRow, toCol, toRow) !== null;
    }
}
