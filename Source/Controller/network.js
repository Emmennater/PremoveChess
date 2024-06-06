
class ChessNetwork {
    static recipientID = null;
    static myTurn = true;
    static gameFen = null;
    static interruptJoinRequest = null;
    static rematch = { myVote: false, recipientVote: false };
    static isRunning = false;

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

        // Interrupt if called again before timeout
        ChessNetwork.abortJoin();

        setTimeout(() => {
            if (interupted) return;
            loadingIcon.classList.add("hide");
            callback(false);
        }, 10000);

        // Create new interrupt
        ChessNetwork.interruptJoinRequest = () => {
            interupted = true;
        };

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

    static abortJoin() {
        // Stop existing join request
        if (ChessNetwork.interruptJoinRequest) {
            ChessNetwork.interruptJoinRequest();
            ChessNetwork.interruptJoinRequest = null;
        }
    }

    static leave() {
        Network.send(this.recipientID, "leave");
        this.isRunning = false;
    }

    static syncComplete() {
        this.isRunning = true;

        // Flip board if necessary
        if (this.myTurn === ChessElements.flipped) ChessElements.flipBoard();

        // Initialize game
        ChessBoard.resetBoard(this.gameFen, false, !this.myTurn);

        // Reset rematch conditions
        this.rematch.myVote = false;
        this.rematch.recipientVote = false;

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

            // Opponent leaving the game
            if (parts[0] === "leave") {
                if (!ChessBoard.gameOver) {
                    ChessBoard.gameOver = "opponent left";
                    ChessBoard.whiteWins = this.myTurn;
                    ChessBoard.updateGameOverMessage();
                    playSound("Assets/game-end.mp3");
                }

                Notification.show("Opponent left");
                this.isRunning = false;
            }

            // Rematch
            if (parts[0] === "rematch") {
                this.rematch.recipientVote = true;
                if (this.rematch.myVote) this.startRematch();
                else Notification.show("Opponent wants a rematch");
            }

            // No rematch
            if (parts[0] === "nomatch") {
                this.rematch.recipientVote = false;
                Notification.show("Opponent declines rematch");
            }
        });
    }

    static relayMove(fromCol, fromRow, toCol, toRow, promotionPiece) {
        const moveData = "move " + fromCol + " " + fromRow + " " + toCol + " " + toRow + " " + promotionPiece;
        Network.send(this.recipientID, moveData);
    }

    static voteRematch(accepted) {
        this.rematch.myVote = accepted;
        Network.send(this.recipientID, accepted ? "rematch" : "nomatch");
        if (accepted && this.rematch.recipientVote) this.startRematch();
    }

    static startRematch() {
        // Ensure both players have voted
        if (!this.rematch.myVote || !this.rematch.recipientVote) throw Error("Rematch conditions not met");

        // Switch sides
        this.myTurn = !this.myTurn;
        this.syncComplete();
    }
}
