import { Chess } from "chess.js";
var ChessNode = /** @class */ (function () {
    function ChessNode(state) {
        var _this = this;
        this.state = new State(state.board);
        this.state.score = state.score;
        this.state.visitCount = state.visitCount;
        this.state.getAllPossibleStates().forEach(function (element) {
            _this.children.push(new ChessNode(element));
        });
    }
    ChessNode.prototype.clone = function () {
        var tempNode = new ChessNode(this.state);
        tempNode.parent = this.parent;
        tempNode.children = this.children;
        return tempNode;
    };
    ChessNode.prototype.getRandomChildNode = function () {
        return this.children[(Math.random() * this.children.length) >> 0];
    };
    ChessNode.prototype.getChildWithMaxScore = function () {
        return this.children.reduce(function (prev, current) {
            return prev.state.score > current.state.score ? prev : current;
        });
    };
    return ChessNode;
}());
var Tree = /** @class */ (function () {
    function Tree(board) {
        this.rootNode = new ChessNode(new State(board));
    }
    return Tree;
}());
var State = /** @class */ (function () {
    function State(board) {
        this.player = "";
        this.visitCount = 0;
        this.score = 0;
        this.board = board;
        this.player = board.turn();
    }
    State.prototype.getAllPossibleStates = function () {
        var _this = this;
        // constructs a list of all possible states from current state
        var states;
        this.board.moves().forEach(function (element) {
            _this.board.move(element);
            states.push(new State(new Chess(_this.board.fen())));
            _this.board.undo();
        });
        return states;
    };
    State.prototype.incrementVisit = function () {
        this.visitCount++;
    };
    State.prototype.togglePlayer = function () {
        this.player = this.getOpponent();
    };
    State.prototype.randomPlay = function () {
        /* get a list of all possible positions on the board and
               play a random move */
    };
    State.prototype.getOpponent = function () {
        return this.player === "b" ? "b" : "w";
    };
    State.prototype.evaluateBoard = function () {
        var fen = this.board.fen();
        var score = 0;
        if (this.board.in_checkmate()) {
            return 100000 * (this.board.turn() === "b" ? -1 : 1);
        }
        var i = 0;
        while (fen.charAt(i) != " ") {
            score +=
                this.getPieceValue(fen.charAt(i).toLowerCase()) *
                    this.checkCase(fen.charAt(i));
            i++;
        }
        return score;
    };
    State.prototype.getPieceValue = function (piece) {
        switch (piece) {
            case "p":
                return 1;
            case "r":
                return 5;
            case "n":
                return 3;
            case "b":
                return 3;
            case "q":
                return 9;
            case "k":
                return 20;
            default:
                return 0;
        }
    };
    State.prototype.checkCase = function (c) {
        var u = c.toUpperCase();
        return c.toLowerCase() === u ? 0 : c === u ? 1 : -1;
    };
    return State;
}());
var UCT = /** @class */ (function () {
    function UCT() {
    }
    UCT.uctValue = function (totalVisit, nodeWinScore, nodeVisit) {
        if (nodeVisit == 0) {
            return Number.MAX_VALUE;
        }
        return (nodeWinScore / nodeVisit +
            1.41 * Math.sqrt(Math.log(totalVisit) / nodeVisit));
    };
    UCT.findBestNodeWithUCT = function (node) {
        var parentVisit = node.state.visitCount;
        return node.children.reduce(function (prev, current) {
            return this.uctValue(parentVisit, prev.state.score, prev.state.visitCount) >
                this.uctValue(parentVisit, current.state.score, current.state.visitCount)
                ? prev
                : current;
        });
    };
    return UCT;
}());
var MonteCarloTreeSearch = /** @class */ (function () {
    function MonteCarloTreeSearch() {
        this.WIN_SCORE = 10;
        this.level = 0;
        this.opponent = "";
    }
    MonteCarloTreeSearch.prototype.findNextMove = function (board, player) {
        // define an end time which will act as a terminating condition
        var end = new Date().getTime() + 3000;
        var opponent = player === "b" ? "b" : "w";
        var tree = new Tree(board);
        var rootNode = tree.rootNode;
        rootNode.state.board = board;
        rootNode.state.player = player;
        while (new Date().getTime() < end) {
            var promisingNode = this.selectPromisingNode(rootNode);
            if (!promisingNode.state.board.game_over()) {
                this.expandNode(promisingNode);
            }
            var nodeToExplore = promisingNode;
            if (promisingNode.children.length > 0) {
                nodeToExplore = promisingNode.getRandomChildNode();
            }
            var playoutResult = this.simulateRandomPlayout(nodeToExplore);
            this.backPropagation(nodeToExplore, playoutResult);
        }
        var winnerNode = rootNode.getChildWithMaxScore();
        tree.rootNode = winnerNode;
        return winnerNode.state.board;
    };
    MonteCarloTreeSearch.prototype.selectPromisingNode = function (rootNode) {
        var node = rootNode;
        while (node.children.length != 0) {
            node = UCT.findBestNodeWithUCT(node);
        }
        return node;
    };
    MonteCarloTreeSearch.prototype.expandNode = function (node) {
        var possibleStates = node.state.getAllPossibleStates();
        possibleStates.forEach(function (state) {
            var newNode = new ChessNode(state);
            newNode.parent = node;
            newNode.state.player = node.state.getOpponent();
            node.children.push(newNode);
        });
    };
    MonteCarloTreeSearch.prototype.backPropagation = function (nodeToExplore, player) {
        var tempNode = nodeToExplore;
        while (tempNode != null) {
            tempNode.state.incrementVisit();
            tempNode.state.evaluateBoard();
            tempNode = tempNode.parent;
        }
    };
    MonteCarloTreeSearch.prototype.simulateRandomPlayout = function (node) {
        var tempNode = node.clone();
        var tempState = tempNode.state;
        var boardStatus = tempState.board.turn();
        if (tempState.board.game_over() &&
            tempState.board.turn() == node.state.getOpponent()) {
            tempNode.parent.state.score = Number.MIN_VALUE;
            return boardStatus;
        }
        while (!tempState.board.game_over()) {
            tempState.togglePlayer();
            tempState.randomPlay();
            boardStatus = tempState.board.turn();
        }
        return boardStatus;
    };
    return MonteCarloTreeSearch;
}());
export { MonteCarloTreeSearch };
