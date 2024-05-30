
(function main() {
    setGridElementSize(8, 8);
    
    game = new ChessGame();
    game.loadFen(defaultFen);
    game.getLegalMoves();
    events = new BoardActions(game);

    updatePieces(game);
    requestAnimationFrame(loop);
})();

function loop() {
    events.updateBoardActions();
    requestAnimationFrame(loop);
}
