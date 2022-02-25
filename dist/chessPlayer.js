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
import { timeSince } from "./timer";
var ChessReq = require("chess.js");
var ChessboardReq = require("chessboardjs");
var whiteSquareGrey = "#a9a9a9";
var blackSquareGrey = "#696969";
import { MonteCarloTreeSearch } from "./monteBot";
var chessPlayer = /** @class */ (function () {
    function chessPlayer(div, useBot) {
        var _this = this;
        this.game = new ChessReq();
        this.onMouseoverSquare = function (square, piece) {
            //get list of possible moves for this square
            var moves = _this.game.moves({
                square: square,
                verbose: true,
            });
            // exit if there are no moves available for this square
            if (moves.length === 0)
                return;
            // highlight the square they moused over
            _this.greySquare(square);
            // highlight the possible squares for this piece
            for (var i = 0; i < moves.length; i++) {
                _this.greySquare(moves[i].to);
            }
        };
        this.removeGreySquares = function () {
            $("#" + _this.div + " .square-55d63").css("background", "");
        };
        this.greySquare = function (square) {
            var $square = $("#" + _this.div + " .square-" + square);
            var background = whiteSquareGrey;
            if ($square.hasClass("black-3c85d")) {
                background = blackSquareGrey;
            }
            $square.css("background", background);
        };
        this.onDragStart = function (source, piece, position, orientation) {
            // do not pick up pieces if the game is over
            if (_this.game.game_over())
                return false;
            // only pick up pieces for White
            if (piece.search(/^b/) !== -1)
                return false;
        };
        this.onDrop = function (source, target) { return __awaiter(_this, void 0, void 0, function () {
            var move;
            return __generator(this, function (_a) {
                this.removeGreySquares();
                move = this.game.move({
                    from: source,
                    to: target,
                    promotion: "q", // NOTE: always promote to a queen for example simplicity
                });
                // illegal move
                if (move === null)
                    return [2 /*return*/, "snapback"];
                return [2 /*return*/];
            });
        }); };
        // update the board position after the piece snap
        // for castling, en passant, pawn promotion
        this.onSnapEnd = function () {
            _this.board.position(_this.game.fen());
        };
        this.onMouseoutSquare = function (square, piece) {
            _this.removeGreySquares();
        };
        this.fetchOpeningMove = function () { return __awaiter(_this, void 0, void 0, function () {
            var url, options;
            var _this = this;
            return __generator(this, function (_a) {
                url = "https://explorer.lichess.ovh/lichess?variant=standard&speeds=blitz,rapid,classical&fen=".concat(this.game.fen());
                options = {};
                fetch(url, options)
                    .then(function (res) { return res.json(); })
                    .then(function (data) {
                    if (data["moves"].length != 0) {
                        _this.game.move(data["moves"][0]["san"]);
                    }
                    else if (_this.useBot) {
                        var gameState = _this.bot.findNextMove(_this.game, "b");
                        _this.game.load(gameState);
                    }
                })
                    .then(function () { return _this.board.position(_this.game.fen()); });
                return [2 /*return*/];
            });
        }); };
        this.gameLoop = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.game.turn() == "b")) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.fetchOpeningMove()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        this.game.move(this.game.moves()[(Math.random() * this.game.moves().length) >> 0]);
                        this.board.position(this.game.fen());
                        _a.label = 3;
                    case 3:
                        $("timer").html(timeSince(this.start));
                        return [2 /*return*/];
                }
            });
        }); };
        this.useBot = useBot;
        if (useBot)
            this.bot = new MonteCarloTreeSearch();
        var onMouseoutSquare = this.onMouseoutSquare, onMouseoverSquare = this.onMouseoverSquare, onDragStart = this.onDragStart, onDrop = this.onDrop, onSnapEnd = this.onSnapEnd;
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
        this.board = ChessboardReq(div, config);
        this.div = div;
        this.start = new Date();
    }
    chessPlayer.prototype.startGameLoop = function () {
        this.start = new Date();
        setInterval(this.gameLoop, 200);
    };
    return chessPlayer;
}());
export { chessPlayer };
