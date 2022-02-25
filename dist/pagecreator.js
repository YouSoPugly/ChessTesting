import { chessPlayer } from "./chessPlayer";
var homePage = /** @class */ (function () {
    function homePage() {
        $("#pageContainer").empty();
        $("#pageContainer").append("<div id=\"myBoard\" style=\"width: 800px\"> </div>");
        var homePlayer = new chessPlayer("myBoard", false);
        homePlayer.startGameLoop();
    }
    return homePage;
}());
export { homePage };
