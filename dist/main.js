var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { MonteCarloTreeSearch } from "./monteBot";
var ChessReq = require("chess.js");
var ChessboardReq = require("chessboardjs");
var config = {
    draggable: true,
    position: "start",
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: "./img/chesspieces/wikipedia/{piece}.png",
};
var board = ChessboardReq("myBoard", config);
var game = new ChessReq();
var whiteSquareGrey = "#a9a9a9";
var blackSquareGrey = "#696969";
var bot = new MonteCarloTreeSearch();
var start;
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
    if (game.game_over())
        return false;
    // only pick up pieces for White
    if (piece.search(/^b/) !== -1)
        return false;
}
function onDrop(source, target) {
    return __awaiter(this, void 0, void 0, function () {
        var move;
        return __generator(this, function (_a) {
            removeGreySquares();
            move = game.move({
                from: source,
                to: target,
                promotion: "q", // NOTE: always promote to a queen for example simplicity
            });
            // illegal move
            if (move === null)
                return [2 /*return*/, "snapback"];
            // make random legal move for black
            start = new Date();
            setInterval(gameLoop, 200);
            return [2 /*return*/];
        });
    });
}
// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd() {
    board.position(game.fen());
}
function onMouseoverSquare(square, piece) {
    // get list of possible moves for this square
    var moves = game.moves({
        square: square,
        verbose: true,
    });
    // exit if there are no moves available for this square
    if (moves.length === 0)
        return;
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
function fetchOpeningMove() {
    return __awaiter(this, void 0, void 0, function () {
        var url, options;
        return __generator(this, function (_a) {
            url = "https://explorer.lichess.ovh/lichess?variant=standard&speeds=blitz,rapid,classical&fen=".concat(game.fen());
            options = {};
            fetch(url, options)
                .then(function (res) { return res.json(); })
                .then(function (data) {
                if (data["moves"].length != 0) {
                    game.move(data["moves"][0]["san"]);
                }
                else {
                    var gameState = bot.findNextMove(game, "b");
                    console.log(bot.tree);
                    game.load(gameState);
                }
            })
                .then(function () { return board.position(game.fen()); });
            return [2 /*return*/];
        });
    });
}
function gameLoop() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(game.turn() == "b")) return [3 /*break*/, 2];
                    return [4 /*yield*/, fetchOpeningMove()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    game.move(game.moves()[(Math.random() * game.moves().length) >> 0]);
                    board.position(game.fen());
                    _a.label = 3;
                case 3:
                    $("timer").html(timeSince(start));
                    return [2 /*return*/];
            }
        });
    });
}
var intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
];
function timeSince(date) {
    var seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    var interval = intervals.find(function (i) { return i.seconds < seconds; });
    var count = Math.floor(seconds / interval.seconds);
    return "".concat(count, " ").concat(interval.label).concat(count !== 1 ? 's' : '', " ago");
}
