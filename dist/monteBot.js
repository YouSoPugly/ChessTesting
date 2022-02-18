var ChessReq = require("chess.js");
var ChessboardReq = require("chessboardjs");
var movesChecked = 0;
var depth = 100;
var thinkTime = 10000;
// node for monte carlo tree | contains a state, parent and children
var ChessNode = /** @class */ (function () {
    function ChessNode(state, parent) {
        this.children = [];
        this.parent = parent;
        this.state = new State(state.board);
        this.state.score = state.score;
        this.state.visitCount = state.visitCount;
    }
    ChessNode.prototype.clone = function () {
        var tempNode = new ChessNode(this.state, this.parent);
        this.generateChildren();
        tempNode.children = this.children;
        return tempNode;
    };
    ChessNode.prototype.generateChildren = function () {
        var _this = this;
        if (this.children.length === 0) {
            this.state.getAllPossibleStates().forEach(function (element) {
                _this.children.push(new ChessNode(element, _this));
            });
        }
    };
    ChessNode.prototype.getRandomChildNode = function () {
        this.generateChildren();
        return this.children[(Math.random() * this.children.length) >> 0];
    };
    // returns the child with the highest board scoring
    ChessNode.prototype.getChildWithMaxScore = function (player) {
        var mult = (player == "b") ? -1 : 1;
        this.generateChildren();
        return this.children.reduce(function (prev, current) {
            return mult * prev.state.score > mult * current.state.score ? prev : current;
        });
    };
    return ChessNode;
}());
// very simple class to contain the root node
var Tree = /** @class */ (function () {
    function Tree(board) {
        this.rootNode = new ChessNode(new State(board), undefined);
    }
    return Tree;
}());
// class to store a state for the nodes
var State = /** @class */ (function () {
    function State(board) {
        this.player = "";
        this.visitCount = 0;
        this.score = 0;
        this.board = board;
        this.player = board.turn();
    }
    // returns all possible states branching off this one
    State.prototype.getAllPossibleStates = function () {
        var _this = this;
        // constructs a list of all possible states from current state
        var states = [];
        this.board.moves().forEach(function (element) {
            _this.board.move(element);
            states.push(new State(new ChessReq(_this.board.fen())));
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
        var move = this.board.moves()[(Math.random() * this.board.moves().length) >> 0];
        this.board.move(move);
        movesChecked++;
    };
    State.prototype.getOpponent = function () {
        return this.player === "b" ? "b" : "w";
    };
    State.prototype.evaluateBoard = function () {
        var fen = this.board.fen();
        var score = 0;
        if (this.board.in_checkmate()) {
            this.score = 100000 * (this.board.turn() === "b" ? -1 : 1);
        }
        var i = 0;
        while (fen.charAt(i) != " ") {
            score +=
                this.getPieceValue(fen.charAt(i).toLowerCase()) *
                    this.checkCase(fen.charAt(i));
            i++;
        }
        this.score = score;
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
        node.generateChildren();
        return node.children.reduce(function (prev, current) {
            return UCT.uctValue(parentVisit, prev.state.score, prev.state.visitCount) >
                UCT.uctValue(parentVisit, current.state.score, current.state.visitCount)
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
        var end = new Date().getTime() + thinkTime;
        movesChecked = 0;
        var opponent = player === "b" ? "b" : "w";
        this.tree = new Tree(board);
        var rootNode = this.tree.rootNode;
        rootNode.state.board = board;
        rootNode.state.player = player;
        while (new Date().getTime() < end) {
            var promisingNode = this.selectPromisingNode(rootNode);
            var nodeToExplore = promisingNode;
            if (!promisingNode.state.board.game_over()) {
                this.expandNode(promisingNode);
            }
            if (promisingNode.children.length > 0) {
                nodeToExplore = promisingNode.getRandomChildNode();
            }
            this.backPropagation(this.simulateRandomPlayout(nodeToExplore));
        }
        var winnerNode = UCT.findBestNodeWithUCT(rootNode);
        this.tree.rootNode = winnerNode;
        console.log("Moves Checked: " + movesChecked);
        return winnerNode.state.board;
    };
    MonteCarloTreeSearch.prototype.selectPromisingNode = function (rootNode) {
        return UCT.findBestNodeWithUCT(rootNode);
    };
    MonteCarloTreeSearch.prototype.expandNode = function (node) {
        node.generateChildren();
    };
    MonteCarloTreeSearch.prototype.backPropagation = function (nodeToExplore) {
        var tempNode = nodeToExplore;
        while (tempNode != null) {
            console.log(tempNode);
            tempNode.state.incrementVisit();
            tempNode.state.evaluateBoard();
            tempNode = tempNode.parent;
        }
    };
    MonteCarloTreeSearch.prototype.simulateRandomPlayout = function (node) {
        var tempNode = node.clone();
        var boardStatus = tempNode.state;
        var i = 0;
        while (!boardStatus.board.game_over() && i < depth) {
            tempNode.generateChildren();
            tempNode = tempNode.getRandomChildNode();
            boardStatus = tempNode.state;
            movesChecked++;
            i++;
        }
        return tempNode;
    };
    return MonteCarloTreeSearch;
}());
export { MonteCarloTreeSearch };
