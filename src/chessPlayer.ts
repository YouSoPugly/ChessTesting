import { ChessInstance, Chess } from "chess.js";
import { ChessBoardInstance } from "chessboardjs";

import { timeSince } from "./timer";

const ChessReq: any = require("chess.js");
const ChessboardReq: any = require("chessboardjs");

const whiteSquareGrey = "#a9a9a9";
const blackSquareGrey = "#696969";

import { MonteCarloTreeSearch } from "./monteBot";

export class chessPlayer {
    useBot: boolean;
    board: ChessBoardInstance;
    game: ChessInstance = new ChessReq();
    bot: MonteCarloTreeSearch;
    start: Date;
    div: String;

    constructor(div: String, useBot: boolean) {
        this.useBot = useBot;
        if (useBot) this.bot = new MonteCarloTreeSearch();

        let onMouseoutSquare = this.onMouseoutSquare,
            onMouseoverSquare = this.onMouseoverSquare,
            onDragStart = this.onDragStart,
            onDrop = this.onDrop,
            onSnapEnd = this.onSnapEnd;

        let config = {
            draggable: true,
            position: "start",
            onMouseoutSquare: onMouseoutSquare,
            onMouseoverSquare: onMouseoverSquare,
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd,
            pieceTheme: "./img/chesspieces/wikipedia/{piece}.png",
        };

        this.board = ChessboardReq(div, config);
        this.div = div;
        this.start = new Date();
    }

    onMouseoverSquare = (square: string, piece: string) => {
        //get list of possible moves for this square
        var moves = this.game.moves({
            square: square,
            verbose: true,
        });

        // exit if there are no moves available for this square
        if (moves.length === 0) return;

        // highlight the square they moused over
        this.greySquare(square);

        // highlight the possible squares for this piece
        for (var i = 0; i < moves.length; i++) {
            this.greySquare(moves[i].to);
        }
    };

    removeGreySquares = () => {
        $("#" + this.div + " .square-55d63").css("background", "");
    };

    greySquare = (square) => {
        var $square = $("#" + this.div + " .square-" + square);

        var background = whiteSquareGrey;
        if ($square.hasClass("black-3c85d")) {
            background = blackSquareGrey;
        }

        $square.css("background", background);
    };

    onDragStart = (source, piece, position, orientation) => {
        // do not pick up pieces if the game is over
        if (this.game.game_over()) return false;

        // only pick up pieces for White
        if (piece.search(/^b/) !== -1) return false;
    };

    onDrop = async (source, target) => {
        this.removeGreySquares();

        // see if the move is legal
        var move = this.game.move({
            from: source,
            to: target,
            promotion: "q", // NOTE: always promote to a queen for example simplicity
        });

        // illegal move
        if (move === null) return "snapback";

        // make random legal move for black

        //window.setTimeout(makeRandomMove, 250)
    };

    // update the board position after the piece snap
    // for castling, en passant, pawn promotion
    onSnapEnd = () => {
        this.board.position(this.game.fen());
    };

    onMouseoutSquare = (square, piece) => {
        this.removeGreySquares();
    };

    fetchOpeningMove = async () => {
        const url =
            "https://explorer.lichess.ovh/lichess?variant=standard&speeds=blitz,rapid,classical&fen=".concat(
                this.game.fen()
            );

        const options = {};

        fetch(url, options)
            .then((res) => res.json())
            .then((data) => {
                if (data["moves"].length != 0) {
                    this.game.move(data["moves"][0]["san"]);
                } else if (this.useBot) {
                    let gameState = this.bot.findNextMove(this.game, "b");
                    this.game.load(gameState);
                }
            })
            .then(() => this.board.position(this.game.fen()));
    };

    gameLoop = async () => {
        if (this.game.turn() == "b") {
            await this.fetchOpeningMove();
        } else {
            this.game.move(
                this.game.moves()[(Math.random() * this.game.moves().length) >> 0]
            );
            this.board.position(this.game.fen());
        }

        $("timer").html(timeSince(this.start));
    };

    startGameLoop() {
        this.start = new Date();
        setInterval(this.gameLoop, 200);
    }
}
