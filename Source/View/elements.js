
class ChessElements {
    static gridCols = 0;
    static gridRows = 0;
    static flipped = false;

    static inGrid(col, row) {
        return col >= 0 && col < ChessElements.gridCols && row >= 0 && row < ChessElements.gridRows;
    }

    static setGridSize(cols, rows) {
        ChessElements.gridCols = cols;
        ChessElements.gridRows = rows;
        
        const board = document.getElementById("board");
        board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        board.innerHTML = "";
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const square = document.createElement("div");
                square.classList.add("square");
                square.setAttribute("draggable", "false");
                square.style.gridRow = r + 1;

                if (c % 2 ^ r % 2) square.classList.add("odd-square");
                else square.classList.add("even-square");

                const piece = document.createElement("div");
                piece.classList.add("piece");
                
                square.appendChild(piece);
                board.appendChild(square);
            }
        }
    }

    static getSquareAt(col, row) {
        const board = document.getElementById("board");
        const squareElem = board.children[col + row * ChessElements.gridCols];
        return squareElem;
    }

    static getPieceAt(col, row) {
        return ChessElements.getSquareAt(col, row).children[0];
    }

    static getPieceImage(col, row) {
        const pieceElem = ChessElements.getPieceAt(col, row);

        if (pieceElem.style.visibility == "hidden") return "";
        return pieceElem.style.backgroundImage;
    }

    static getColRowFromSquare(squareElem) {
        const board = document.getElementById("board");
        const idx = Array.from(board.children).indexOf(squareElem);
        return { col: idx % ChessElements.gridCols, row: Math.floor(idx / ChessElements.gridCols) };
    }

    static setPieceImage(col, row, img) {
        const pieceElem = ChessElements.getPieceAt(col, row);

        if (img == "") {
            pieceElem.style.visibility = "hidden";
        } else {
            pieceElem.style.visibility = "visible";
            pieceElem.style.backgroundImage = img;
        }
    }

    static setSquareState(col, row, state, active) {
        const squareElem = ChessElements.getSquareAt(col, row);
    
        if (active) {
            squareElem.classList.add(state);
        } else {
            squareElem.classList.remove(state);
        }
    }

    static hidePiece(col, row) {
        const pieceElem = ChessElements.getPieceAt(col, row);
        pieceElem.style.visibility = "hidden";
    }

    static showPiece(col, row) {
        const pieceElem = ChessElements.getPieceAt(col, row);
        pieceElem.style.visibility = "visible";
    }

    static squareMouseDown(callback) {
        const board = document.getElementById("board");
        
        board.addEventListener("mousedown", (e) => {
            let target = e.target.classList.contains("piece") ? e.target.parentNode : e.target;
            if (target.classList.contains("square")) {
                const { col, row } = ChessElements.getColRowFromSquare(target);
                callback(target, col, row);
            }
        });
    }

    static squareMouseUp(callback) {
        const board = document.getElementById("board");
        
        board.addEventListener("mouseup", (e) => {
            let target = e.target.classList.contains("piece") ? e.target.parentNode : e.target;
            if (target.classList.contains("square")) {
                const { col, row } = ChessElements.getColRowFromSquare(target);
                callback(target, col, row);
            }
        });
    }

    static flipBoard() {
        ChessElements.flipped = !ChessElements.flipped;
        for (let r = 0; r < ChessElements.gridRows; r++) {
            for (let c = 0; c < ChessElements.gridCols; c++) {
                const square = ChessElements.getSquareAt(c, r);
                square.style.gridRow = ChessElements.flipped ? ChessElements.gridRows - r : r + 1;
            }
        }
    }

    static resetStates() {
        const squares = document.getElementsByClassName("square");
        Array.from(squares).forEach(square => {
            const classList = square.classList;
            for (let i = classList.length - 1; i >= 0; i--) {
                const className = classList.item(i);
                if (!["square", "odd-square", "even-square"].includes(className)) {
                    classList.remove(className);
                }
            }
        });
    }
}

class PromotionGUI {
    static isPromoting = false;

    static hidePromotionElements() {
        const promotionElements = document.getElementsByClassName("promotion-wrapper");
        Array.from(promotionElements).forEach(promotion => promotion.setAttribute("style", "display:none"));
    }

    static requestPromotion(column, row, isWhite, callback) {
        PromotionGUI.isPromoting = true;

        // Dim board
        ChessBoard.dimBoard(true);

        // Promotion GUI position
        const square = ChessElements.getSquareAt(column, row);
        const startRect = square.getClientRects()[0];
        const startX = startRect.left;
        const startY = startRect.top;
        const elemWidth = startRect.width;
        const elemHeight = startRect.height;

        const direction = isWhite ? 1 : -1;
        const promotionPieces = isWhite ? "QRNB" : "qnrb";
        const promotionElements = document.getElementsByClassName("promotion-wrapper");
        
        for (let i = 0; i < promotionPieces.length; i++) {
            const piece = promotionPieces[i];
            const promotionWrapper = promotionElements[i];
            const promotionPiece = promotionWrapper.children[0];
            const yOffset = elemHeight * i * direction;
            
            promotionWrapper.setAttribute("style", `
                display: block;
                left: ${startX}px;
                top: ${startY + yOffset}px;
                width: ${elemWidth}px;
                height: ${elemHeight}px;
            `);

            promotionPiece.setAttribute("style", `
                background-image: url(${getPieceSrcUrl(piece)});
            `);

            promotionWrapper.onclick = () => {
                ChessBoard.dimBoard(false);
                PromotionGUI.isPromoting = false;
                PromotionGUI.hidePromotionElements();
                callback(piece);
            };
        }
    }
}
