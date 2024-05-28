const defaultFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

function makeGame(cols, rows) {
    let squares = Array(cols * rows);
    for (let i = 0; i < cols * rows; i++)
        squares[i] = "";
    return { cols, rows, squares };
}

function copyGame(game) {
    return { cols: game.cols, rows: game.rows, squares: game.squares };
}

function getPieceAt(game, col, row) {
    return game.squares[col + row * game.cols];
}

function setPieceAt(game, col, row, piece) {
    game.squares[col + row * game.cols] = piece;
}

function loadFen(game, fen) {
    let row = 0;
    let col = 0;
    let idx = 0;

    while (idx < fen.length) {
        let ch = fen[idx];
        let digit = parseFloat(ch);

        if (ch == ' ') {
            // Only set up position
            break;
        } else if (!isNaN(digit)) {
            col += digit;
        } else if (ch === '/') {
            row++;
            col = 0;
        } else {
            // Set piece
            setPieceAt(game, col, row, ch);
            col++;
        }

        idx++;
    }
}

function gameIterator(game, fun) {
    let i = 0;
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            fun(c, r, i);
        }
    }
}

function isLegalMove(game, fromCol, fromRow, toCol, toRow) {
    return fromCol !== toCol || fromRow !== toRow;
}
