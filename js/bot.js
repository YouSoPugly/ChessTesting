
class Bot {

    game;
    weights = [1];
    depth = 2;

    constructor(game, depth) {
        this.game = game;
        this.depth = depth;
    }

    generateMoves(game) {

        let moves = []

        let legalMoves = game.moves();

        for (let i = 0; i < legalMoves.length; i++) {
            game.move(legalMoves[i])
            let score = this.evaluateBoard(game);

            moves.push(new Move(legalMoves[i], score))
            game.undo()
        }

        return moves;
    }

    getMove(game, moveNum) {

        if (moveNum == undefined)
            moveNum = this.depth

        let moves = this.generateMoves(game)
        
        console.log(moves)

        if (moveNum == 0 || game.turn == 'w') {
            return this.bestMoveFromMap(moves, game.turn());
        }

        for (let i = 0; i < moves.length; i++) {
            game.move(moves[i])
            moves[i].score = this.getMove(game, moveNum - 1).score
            game.undo()
        }
        
        return this.bestMoveFromMap(moves, game.turn());

    }

    bestMoveFromMap(movesArr, side) {

        let bestScore = movesArr[0].score
        let bestMove = movesArr[0]

        for (let i = 0; i < movesArr.length; i++) {
            if (movesArr[i].score * (side === 'b' ? 1 : -1) < bestScore) {
                bestScore = movesArr[i].score
                bestMove = movesArr[i]
            }
        }

        return bestMove;

    }

    getRandomMove() {
        var possibleMoves = generateMoves()

        // game over
        if (possibleMoves.length === 0) return

        var randomIdx = Math.floor(Math.random() * possibleMoves.length)

        return possibleMoves[randomIdx]
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

        switch (piece) {
            case 'p':
                return 1
            case 'r':
                return 5
            case 'n':
                return 3
            case 'b':
                return 3
            case 'q':
                return 9
            case 'k':
                return 20
            default:
                return 0
        }

        return 0;
    }

}

function checkCase(c){
    var u = c.toUpperCase();
    return (c.toLowerCase() === u ? 0 : (c === u ? 1 : -1));
};

class Move {

    move;
    score;

    constructor(move, score) {
        this.move = move;
        this.score = score;
    }
}