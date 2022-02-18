import Chess from "chess";
import {ChessInstance } from "chess.js";
import { ChessBoard, ChessBoardInstance } from "chessboardjs";

const ChessReq: any = require("chess.js");
const ChessboardReq: any = require("chessboardjs");

var movesChecked = 0;
const depth = 100;
const thinkTime = 10000;

// node for monte carlo tree | contains a state, parent and children
class ChessNode {
  state: State;
  parent: ChessNode;
  children: ChessNode[] = [];

  constructor(state: State, parent: ChessNode) {
    this.parent = parent;
    this.state = new State(state.board);
    this.state.score = state.score;
    this.state.visitCount = state.visitCount;
  }

  clone() {
    let tempNode = new ChessNode(this.state, this.parent);
    this.generateChildren();
    tempNode.children = this.children;

    return tempNode;
  }

  generateChildren() {
    if (this.children.length === 0) {
      this.state.getAllPossibleStates().forEach((element) => {
        this.children.push(new ChessNode(element, this));
      });
    }
  }

  getRandomChildNode() {
    this.generateChildren();
    return this.children[(Math.random() * this.children.length) >> 0];
  }

  // returns the child with the highest board scoring
  getChildWithMaxScore(player: String) {

    let mult = (player == "b") ? -1 : 1

    this.generateChildren();
    return this.children.reduce(function (prev, current) {
      return mult*prev.state.score > mult*current.state.score ? prev : current;
    });
  }
}

// very simple class to contain the root node
class Tree {
  rootNode: ChessNode;

  constructor(board: ChessInstance) {
    this.rootNode = new ChessNode(new State(board), undefined);
  }
}

// class to store a state for the nodes
class State {
  board: ChessInstance;
  player = "";
  visitCount = 0;
  score = 0;

  constructor(board: ChessInstance) {
    this.board = board;
    this.player = board.turn();
  }

  // returns all possible states branching off this one
  getAllPossibleStates() {
    // constructs a list of all possible states from current state
    let states: State[] = [];

    this.board.moves().forEach((element) => {
      this.board.move(element);
      states.push(new State(new ChessReq(this.board.fen())));
      this.board.undo();
    });

    return states;
  }

  incrementVisit() {
    this.visitCount++;
  }

  togglePlayer() {
    this.player = this.getOpponent();
  }

  randomPlay() {
    let move =
      this.board.moves()[(Math.random() * this.board.moves().length) >> 0];
    this.board.move(move);
    movesChecked++;
  }

  getOpponent() {
    return this.player === "b" ? "b" : "w";
  }

  evaluateBoard() {
    let fen = this.board.fen();
    let score = 0;

    if (this.board.in_checkmate()) {
      this.score = 100000 * (this.board.turn() === "b" ? -1 : 1);
    }

    let i = 0;
    while (fen.charAt(i) != " ") {
      score +=
        this.getPieceValue(fen.charAt(i).toLowerCase()) *
        this.checkCase(fen.charAt(i));
      i++;
    }

    this.score = score;
  }

  getPieceValue(piece: string) {
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
  }

  checkCase(c: string) {
    var u = c.toUpperCase();
    return c.toLowerCase() === u ? 0 : c === u ? 1 : -1;
  }
}

class UCT {
  static uctValue(totalVisit: number, nodeWinScore: number, nodeVisit: number) {
    if (nodeVisit == 0) {
      return Number.MAX_VALUE;
    }
    return (
      nodeWinScore / nodeVisit +
      1.41 * Math.sqrt(Math.log(totalVisit) / nodeVisit)
    );
  }

  static findBestNodeWithUCT(node: ChessNode) {
    let parentVisit = node.state.visitCount;
    node.generateChildren();

    return node.children.reduce(function (prev, current) {
      return UCT.uctValue(
        parentVisit,
        prev.state.score,
        prev.state.visitCount
      ) >
        UCT.uctValue(parentVisit, current.state.score, current.state.visitCount)
        ? prev
        : current;
    });
  }
}

export class MonteCarloTreeSearch {
  WIN_SCORE = 10;
  level = 0;
  opponent = "";
  tree: Tree;

  findNextMove(board: ChessInstance, player: string) {
    // define an end time which will act as a terminating condition
    const end = new Date().getTime() + thinkTime;
    movesChecked = 0;

    const opponent = player === "b" ? "b" : "w";
    this.tree = new Tree(board);
    const rootNode = this.tree.rootNode;
    rootNode.state.board = board;
    rootNode.state.player = player;

    while (new Date().getTime() < end) {
      let promisingNode: ChessNode = this.selectPromisingNode(rootNode);
      let nodeToExplore: ChessNode = promisingNode;
      if (!promisingNode.state.board.game_over()) {
        this.expandNode(promisingNode);
      }
      if (promisingNode.children.length > 0) {
        nodeToExplore = promisingNode.getRandomChildNode();
      }

      this.backPropagation(this.simulateRandomPlayout(nodeToExplore));
    }

    let winnerNode: ChessNode = UCT.findBestNodeWithUCT(rootNode)
    this.tree.rootNode = winnerNode;
    console.log("Moves Checked: " + movesChecked);
    return winnerNode.state.board;
  }

  selectPromisingNode(rootNode: ChessNode) {
    return UCT.findBestNodeWithUCT(rootNode);
  }

  expandNode(node: ChessNode) {
    node.generateChildren();
  }

  backPropagation(nodeToExplore: ChessNode) {
    let tempNode: ChessNode = nodeToExplore;
    while (tempNode != null) {
      console.log(tempNode)
      tempNode.state.incrementVisit();
      tempNode.state.evaluateBoard();
      tempNode = tempNode.parent;
    }
  }

  simulateRandomPlayout(node: ChessNode) {
    let tempNode: ChessNode = node.clone();
    let boardStatus = tempNode.state;

    let i = 0;

    while (!boardStatus.board.game_over() && i < depth) {
      tempNode.generateChildren();
      tempNode = tempNode.getRandomChildNode();
      boardStatus = tempNode.state;
      movesChecked++
      i++
    }

    return tempNode;
  }
}
