
(function main() {
    
    setGridElementSize(8, 8);
    
    game = makeGame(8, 8);
    loadFen(game, defaultFen);
    
    updatePieces(game);
    setBoardEvents(game);
    initEvents();

    requestAnimationFrame(loop);
})();

function loop() {
    updateBoardActions();
    requestAnimationFrame(loop);
}
