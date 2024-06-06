
class ChessNetwork {
    static recipientID = null;
    static myTurn = true;
    static gameFen = null;

    static host(fenString, side) {
        // Initialize new game
        ChessBoard.resetBoard(fenString);

        Network.on("message", msg => {
            // Incoming join request
            if (msg.startsWith("join")) {
                this.recipientID = msg.split(" ")[1];

                // Start game
                this.myTurn = side === "random" ? Math.random() > 0.5 : side === "white";
                this.gameFen = fenString;
                
                // Send recipient their turn
                const gameData = "turn " + !this.myTurn + " " + fenString;
                Network.send(this.recipientID, gameData);
                
                // Start game
                this.syncComplete();
            }
        });
    }

    static join(hostID, callback) {
        const loadingIcon = document.getElementById("join-loading");
        loadingIcon.classList.remove("hide");
        let interupted = false;

        setTimeout(() => {
            if (interupted) return;
            loadingIcon.classList.add("hide");
            callback(false);
        }, 10000);

        Network.send(hostID, "join " + Network.id);
        Network.on("message", msg => {
            const parts = msg.split(" ");
            interupted = true;
            loadingIcon.classList.add("hide");
            if (!parts[0] === "turn") return callback(false);

            this.recipientID = hostID;
            this.myTurn = parts[1] === "true";
            this.gameFen = "";
            for (let i = 2; i < parts.length; i++) this.gameFen += parts[i] + " ";
            this.gameFen = this.gameFen.substring(0, this.gameFen.length - 1);

            callback(true);
        });
    }

    static syncComplete() {
        if (!this.myTurn) ChessElements.flipBoard();
        
        // Initialize game
        ChessBoard.resetBoard(this.gameFen, false, !this.myTurn);

        // New game sound effect
        playSound("Assets/game-start.mp3");

        Notification.show("Game started", 5, false);

        Network.on("message", msg => {
            const parts = msg.split(" ");

            if (parts[0] === "move") {
                const move = [parseInt(parts[1], 10), parseInt(parts[2], 10), parseInt(parts[3], 10), parseInt(parts[4], 10)];
                const promotionPiece = parts[5] === "null" ? null : parts[5];
                ChessBoard.makePremove(move[0], move[1], move[2], move[3], promotionPiece, false);
            }
        });
    }

    static relayMove(fromCol, fromRow, toCol, toRow, promotionPiece) {
        const moveData = "move " + fromCol + " " + fromRow + " " + toCol + " " + toRow + " " + promotionPiece;
        Network.send(this.recipientID, moveData);
    }
}
