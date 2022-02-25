var ChessReq = require("chess.js");
var ChessboardReq = require("chessboardjs");
var movesChecked = 0;
var depth = 17;
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
        var mult = player == "b" ? -1 : 1;
        this.generateChildren();
        return this.children.reduce(function (prev, current) {
            return mult * prev.state.score > mult * current.state.score
                ? prev
                : current;
        });
    };
    return ChessNode;
}());
// very simple class to contain the root node
var Tree = /** @class */ (function () {
    function Tree(board) {
        this.rootNode = new ChessNode(new State(board.fen()), undefined);
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
        this.player = board.split(" ")[1];
    }
    // returns all possible states branching off this one
    State.prototype.getAllPossibleStates = function () {
        // constructs a list of all possible states from current state
        var states = [];
        var board = new ChessReq(this.board);
        board.moves().forEach(function (element) {
            board.move(element);
            states.push(new State(board.fen()));
            board.undo();
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
        var board = new ChessReq(this.board);
        var move = board.moves()[(Math.random() * board.moves().length) >> 0];
        board.move(move);
        movesChecked++;
    };
    State.prototype.getOpponent = function () {
        return this.player === "b" ? "b" : "w";
    };
    State.prototype.evaluateBoard = function () {
        var fen = this.board;
        var score = 0;
        var board = new ChessReq(fen);
        if (board.in_checkmate()) {
            this.score = 100000 * (board.turn() === "b" ? -1 : 1);
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
        if (node.children.length == 0)
            return node;
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
        var rootNode;
        if (this.tree == undefined) {
            this.tree = new Tree(board);
            rootNode = this.tree.rootNode;
        }
        else {
            var newRoot_1;
            this.tree.rootNode.children.forEach(function (child) {
                if (child.state.board == board.fen()) {
                    newRoot_1 = child;
                }
            });
            rootNode = newRoot_1;
        }
        var end = new Date().getTime() + thinkTime;
        movesChecked = 0;
        this.opponent = player === "b" ? "b" : "w";
        while (new Date().getTime() < end) {
            var promisingNode = this.selectPromisingNode(rootNode);
            var nodeToExplore = promisingNode;
            if (promisingNode.children.length == 0) {
                this.expandNode(promisingNode);
            }
            nodeToExplore = promisingNode;
            if (promisingNode.children.length > 0 &&
                promisingNode.state.visitCount == 0) {
                nodeToExplore = promisingNode.getRandomChildNode();
            }
            while (nodeToExplore.state.visitCount != 0) {
                nodeToExplore = this.selectPromisingNode(nodeToExplore);
            }
            this.backPropagation(this.simulateRandomPlayout(nodeToExplore));
        }
        console.log(this.tree.rootNode);
        var winnerNode = rootNode.getChildWithMaxScore(player);
        this.tree.rootNode = winnerNode;
        this.tree.rootNode.parent = undefined;
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
        console.log(tempNode);
        tempNode.state.evaluateBoard();
        var score = tempNode.state.score;
        while (tempNode != null) {
            tempNode.state.incrementVisit();
            tempNode.state.score = score;
            tempNode = tempNode.parent;
        }
    };
    MonteCarloTreeSearch.prototype.simulateRandomPlayout = function (node) {
        var tempNode = node.clone();
        var boardStatus = tempNode.state;
        tempNode.generateChildren();
        var i = 0;
        while (tempNode.children.length > 0 && i < depth) {
            tempNode = tempNode.getRandomChildNode();
            movesChecked++;
            i++;
            tempNode.generateChildren();
        }
        return tempNode;
    };
    return MonteCarloTreeSearch;
}());
export { MonteCarloTreeSearch };
