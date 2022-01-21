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
        var score;

        if (game.in_checkmate()) {
            return (10000 * (game.turn().equals('b') ? -1 : 1))
        }

        fen.array.forEach(element => {
            score += this.getPieceValue(element.toLowerCase()) * (checkCase(element))
        });

    }

    getPieceValue(piece) {

        if (piece === null) {
            return 0;
        }

        if (piece.type === 'p') {
            return 1;
        } else if (piece.type === 'r') {
            return 5;
        } else if (piece.type === 'n') {
            return 3;
        } else if (piece.type === 'b') {
            return 3;
        } else if (piece.type === 'q') {
            return 9;
        } else if (piece.type === 'k') {
            return 20;
        }
        throw "Unknown piece type: " + piece.type;
    }

}

function checkCase(c){
    var u = c.toUpperCase();
    return (c.toLowerCase() === u ? 0 : (c === u ? 1 : -1));
};