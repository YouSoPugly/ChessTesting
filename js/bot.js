
class Bot {

    game;
    weights = [1];
    depth = 2;

    constructor(game, depth) {
        this.game = game;
        this.depth = depth;
    }

    generateMoves() {

        let moves = []

        let legalMoves = this.game.moves();

        let gameClone = new Chess(this.game.fen());

        for (let i = 0; i < legalMoves.length; i++) {
            gameClone.move(legalMoves[i])
            let score = this.evaluateBoard(gameClone);

            moves.push(new Move(legalMoves[i], score))

            gameClone.undo()
        }

        return moves;
    }

    getMove(moveNum) {

        if (moveNum == undefined)
            moveNum = 0

        let moves = this.generateMoves()
        
        if (moveNum == 0) {
            return this.bestMoveFromMap(moves, this.game.turn()).move;
        }
        
        return this.bestMoveFromMap(moves, this.game.turn())

    }

    bestMoveFromMap(movesArr, side) {

        let bestScore = movesArr[0].score
        let bestMove = movesArr[0]

        for (let i = 0; i < movesArr.length; i++) {
            console.log(bestScore)
            console.log(bestMove)
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

class Move {

    move;
    score;

    constructor(move, score) {
        this.move = move;
        this.score = score;
    }
}