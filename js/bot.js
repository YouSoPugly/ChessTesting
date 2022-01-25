class Bot {

    game;
    weights = [1];
    depth = 2;

    constructor(game) {
        this.game = game;
    }

    generateMoves() {

        let moves = this.game.moves();

        let gameClone = jQuery.extend(true, {}, this.game);

        return moves;
    }


    rateMove(move, game) {

        game.move(move)

    }

    evaluateBoard(game) {
        var fen = game.fen()
        var score = 0;

        if (game.in_checkmate()) {
            return (10000 * (game.turn() === 'b' ? -1 : 1))
        }

        let i = 0;
        while (fen.charAt(i) != ' ') {
            score += this.getPieceValue(fen.charAt(i).toLowerCase()) * (checkCase(fen.charAt(i)))
            i++
        }

        return score;

    }

    getPieceValue(piece) {

        if (piece === null) {
            return 0;
        }

        if (piece === 'p') {
            return 1;
        } else if (piece === 'r') {
            return 5;
        } else if (piece === 'n') {
            return 3;
        } else if (piece === 'b') {
            return 3;
        } else if (piece === 'q') {
            return 9;
        }

        return 0;
    }

}

function checkCase(c){
    var u = c.toUpperCase();
    return (c.toLowerCase() === u ? 0 : (c === u ? 1 : -1));
};