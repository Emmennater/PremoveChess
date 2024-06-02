
(function main() {
    ChessElements.setGridSize(8, 8);
    
    const game = new PremoveChessGame();
    game.loadFen(defaultFen);
    game.getLegalPremoves(true);

    ChessBoard.setActiveGame(game);
    ChessBoard.updatePieces(game);
    ChessActions.setBoardEvents(game);

    requestAnimationFrame(loop);
})();

function loop() {
    ChessActions.update();
    requestAnimationFrame(loop);
}
