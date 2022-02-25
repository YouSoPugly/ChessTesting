import { chessPlayer } from "./chessPlayer";

export class homePage {
    constructor () {
        $("#pageContainer").empty()

        $("#pageContainer").append("<div id=\"myBoard\" style=\"width: 800px\"> </div>")

        const homePlayer = new chessPlayer("myBoard", false);
        homePlayer.startGameLoop()
    }
}