import { ChessInstance, Chess } from "chess.js";
import {
  BoardConfig,
  Callback,
  ChessBoard,
  ChessBoardInstance,
} from "chessboardjs";
import { MonteCarloTreeSearch } from "./monteBot";

const ChessReq: any = require("chess.js");
const ChessboardReq: any = require("chessboardjs");

const config: BoardConfig = {
  draggable: true,
  position: "start",
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
  pieceTheme: "./img/chesspieces/wikipedia/{piece}.png",
};

var board: ChessBoardInstance = ChessboardReq("myBoard", config);
var game: ChessInstance = new ChessReq();
var whiteSquareGrey = "#a9a9a9";
var blackSquareGrey = "#696969";
var bot = new MonteCarloTreeSearch();
var start : Date;

function removeGreySquares() {
  $("#myBoard .square-55d63").css("background", "");
}

function greySquare(square) {
  var $square = $("#myBoard .square-" + square);

  var background = whiteSquareGrey;
  if ($square.hasClass("black-3c85d")) {
    background = blackSquareGrey;
  }

  $square.css("background", background);
}

function onDragStart(source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false;

  // only pick up pieces for White
  if (piece.search(/^b/) !== -1) return false;
}

async function onDrop(source, target) {
  removeGreySquares();

  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: "q", // NOTE: always promote to a queen for example simplicity
  });

  // illegal move
  if (move === null) return "snapback";

  // make random legal move for black
  start = new Date()
  setInterval(gameLoop, 200);
  //window.setTimeout(makeRandomMove, 250)
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd() {
  board.position(game.fen());
}

function onMouseoverSquare(square: string, piece: string) {
  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true,
  });

  // exit if there are no moves available for this square
  if (moves.length === 0) return;

  // highlight the square they moused over
  greySquare(square);

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to);
  }
}

function onMouseoutSquare(square, piece) {
  removeGreySquares();
}

async function fetchOpeningMove() {
  const url =
    "https://explorer.lichess.ovh/lichess?variant=standard&speeds=blitz,rapid,classical&fen=".concat(
      game.fen()
    );

  const options = {};

  fetch(url, options)
    .then((res) => res.json())
    .then((data) => {
      if (data["moves"].length != 0) {
        game.move(data["moves"][0]["san"]);
      } else {
        let gameState = bot.findNextMove(game, "b");
        console.log(bot.tree);
        game.load(gameState);
      }
    })
    .then(() => board.position(game.fen()));
}

async function gameLoop() {
  if (game.turn() == "b") {
    await fetchOpeningMove();
  } else {
    game.move(game.moves()[(Math.random() * game.moves().length) >> 0]);
    board.position(game.fen());
  }

  $("timer").html(timeSince(start))
}

const intervals = [
  { label: 'year', seconds: 31536000 },
  { label: 'month', seconds: 2592000 },
  { label: 'day', seconds: 86400 },
  { label: 'hour', seconds: 3600 },
  { label: 'minute', seconds: 60 },
  { label: 'second', seconds: 1 }
];

function timeSince(date : Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const interval = intervals.find(i => i.seconds < seconds);
  const count = Math.floor(seconds / interval.seconds);
  return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
}
