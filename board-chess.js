/* Required functions:
  - loadFen / getFen
  - getLegalMoves
  - isLegalMove
  - makeMove
*/

const defaultFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

class ChessGame {
    constructor() {
        this.cols = 8;
        this.rows = 8;
        this.chess = new Chess.Chess();
        this.moves = [];
    }

    loadFen(fen) {
        this.chess.load(fen);
    }

    getFen() {
        return this.chess.fen();
    }

    getPieceAt(col, row) {
        let coords = this.getCoords(col, row);
        let pieceData = this.chess.get(coords);
        if (!pieceData) return "";
        let piece = pieceData.color === "w" ? pieceData.type.toUpperCase() : pieceData.type;
        return piece;
    }

    isWhitesTurn() {
        return this.chess.turn() === "w";
    }

    inCheck() {
        return this.chess.inCheck();
    }

    getKings() {
        const blackKingCol = this.chess._kings.b % 16;
        const blackKingRow = this.chess._kings.b >> 4;
        const whiteKingCol = this.chess._kings.w % 16;
        const whiteKingRow = this.chess._kings.w >> 4;
        return { b: [blackKingCol, blackKingRow], w: [whiteKingCol, whiteKingRow] };
    }

    getEndgameState() {
        if (!this.chess.isGameOver()) return false;
        if (this.chess.isDraw()) return "draw";
        else if (this.chess.isCheckmate()) return "checkmate";
        else if (this.chess.isInsufficientMaterial()) return "insufficient";
        else if (this.chess.isStalemate()) return "stalemate";
        else if (this.chess.isThreefoldRepetition()) return "threefold";
        throw Error("Undefined endgame state");
    }

    getLegalMoves() {
        let moves = this.chess.moves({ verbose: true });
        this.moves.length = moves.length;

        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            this.moves[i] = {
                move: this.parseCoordinates(move.lan),
                san: move.san,
                captured: move.captured,
                promotion: move.promotion
            };
        }
    }

    getLegalMovesAt(col, row) {
        let moves = [];

        for (let move of this.moves) {
            if (col == move.move[0] && row == move.move[1]) {
                // Move found
                moves.push(move);
            }
        }
        
        return moves;
    }

    findMove(fromCol, fromRow, toCol, toRow, promotionPiece = null) {
        for (let move of this.moves) {
            if (fromCol == move.move[0] && fromRow == move.move[1] &&
                toCol == move.move[2] && toRow == move.move[3] &&
                (!promotionPiece || move.promotion == promotionPiece)) {
                return move;
            }
        }

        return null;
    }

    isLegalMove(fromCol, fromRow, toCol, toRow) {
        for (let move of this.moves) {
            if (fromCol == move.move[0] && fromRow == move.move[1] &&
                toCol == move.move[2] && toRow == move.move[3]) {
                return true;
            }
        }

        return false;
    }

    makeMove(fromCol, fromRow, toCol, toRow, promotionPiece = null) {
        const move = this.findMove(fromCol, fromRow, toCol, toRow, promotionPiece);
        if (!move) return false;
        this.chess.move(move.san);
        return move;
    }

    undoMove() {
        this.chess.undo();
    }

    getCoords(col, row) {
        const code1 = '1'.charCodeAt(0);
        const codea = 'a'.charCodeAt(0);
        return String.fromCharCode(codea + col) +
            String.fromCharCode(code1 + this.rows - row - 1);
    }

    parseCoordinates(input) {
        // Helper function to convert column letter to index
        const colToIndex = (col) => {
            return col.charCodeAt(0) - 'a'.charCodeAt(0);
        }
        
        // Helper function to convert row number to index
        const rowToIndex = (row) => {
            return this.rows - (row.charCodeAt(0) - '1'.charCodeAt(0)) - 1;
        }
        
        // Extract start and end columns and rows
        const startCol = colToIndex(input.charAt(0));
        const startRow = rowToIndex(input.charAt(1));
        const endCol = colToIndex(input.charAt(2));
        const endRow = rowToIndex(input.charAt(3));
        
        return [startCol, startRow, endCol, endRow];
    }
}
