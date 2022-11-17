var gameTable = undefined;
var gameStats = undefined;

init = function() {
    gameTable = new GameTable($('#game_table'));
    gameStats = new GameStatistics($('#stat_table'));
}

$(document).ready(function() {
    let is_game_ended = 0;
    let directionKeys = {
        "ArrowUp": "up", "ArrowLeft": "left", "ArrowRight": "right", "ArrowDown": "down",
        "KeyW": "up", "KeyS": "down", "KeyA":"left", "KeyD":"right"
    };

    init();

    document.addEventListener("keydown", function(e) {
        if (48 < e.keyCode && e.keyCode < 55) gameTable.insertValue(e.keyCode - 48);
        if (96 < e.keyCode && e.keyCode < 103) gameTable.insertValue(e.keyCode - 96);
        if (e.code == "Enter") gameTable.startNewGame();
        if (e.code == "Escape") gameTable.exitModes();
        if (e.code == "Backspace") gameTable.removeValue();
        if (e.code == "KeyI") gameTable.switchInsertMode();
        if (e.code == "KeyE") gameTable.switchEditMode();
        if (e.code == "KeyS" && (e.ctrlKey || e.metaKey) && e.shiftKey) { console.log("A"); gameTable.saveHistoryToNewFile(); e.preventDefault(); }
        if (e.code == "KeyO" || (e.code == "KeyS" && (e.ctrlKey || e.metaKey) && !e.shiftKey)) { gameTable.saveHistoryToCurrentFile(); e.preventDefault(); }
        if (e.code == "KeyL") {gameTable.importHistory(); return; }
        if (e.code in directionKeys) gameTable.moveEditedCell(directionKeys[e.code]);

        gameTable.renderTable();
        gameStats.renderStatistics(gameTable.getHistory());

    }, false);

    // QoL: show statistics immediately
    gameStats.renderStatistics(gameTable.getHistory());
});
