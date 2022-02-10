import { Chess, ChessInstance } from "chess.js";
import { ChessBoard, ChessBoardInstance } from "chessboardjs";

class ChessNode {
  state: State;
  parent: ChessNode;
  children: ChessNode[];

  constructor(state: State) {
    this.state = new State(state.board);
    this.state.score = state.score;
    this.state.visitCount = state.visitCount;
  }

  clone() {
    let tempNode = new ChessNode(this.state);
    tempNode.parent = this.parent;
    tempNode.children = this.children;

    return tempNode;
  }

  getRandomChildNode() {
    return this.children[(Math.random() * this.children.length) >> 0];
  }

  getChildWithMaxScore() {
    return this.children.reduce(function (prev, current) {
      return prev.state.score > current.state.score ? prev : current;
    });
  }
}

class Tree {
  rootNode: ChessNode;
}

class State {
  board: ChessInstance;
  player = "";
  visitCount = 0;
  score = 0;

  constructor(board: ChessInstance) {
    this.board = board;
    this.player = board.turn();
  }

  getAllPossibleStates() {
    // constructs a list of all possible states from current state
    let states: State[];

    this.board.moves().forEach((element) => {
      this.board.move(element);
      states.push(new State(new Chess(this.board.fen())));
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
    /* get a list of all possible positions on the board and
           play a random move */
  }

  getOpponent() {
    return this.player === "b" ? "b" : "w";
  }

  evaluateBoard() {
    var fen = this.board.fen();
    var score = 0;

    if (this.board.in_checkmate()) {
      return 100000 * (this.board.turn() === "b" ? -1 : 1);
    }

    let i = 0;
    while (fen.charAt(i) != " ") {
      score +=
        this.getPieceValue(fen.charAt(i).toLowerCase()) *
        this.checkCase(fen.charAt(i));
      i++;
    }

    return score;
  }

  getPieceValue(piece : string) {
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

  checkCase(c : string) {
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

    return node.children.reduce(function (prev, current) {
      return this.uctValue(
        parentVisit,
        prev.state.score,
        prev.state.visitCount
      ) >
        this.uctValue(
          parentVisit,
          current.state.score,
          current.state.visitCount
        )
        ? prev
        : current;
    });
  }
}

class MonteCarloTreeSearch {
  WIN_SCORE = 10;
  level = 0;
  opponent = "";

  findNextMove(board: ChessInstance, player: string) {
    // define an end time which will act as a terminating condition
    const end = new Date().getTime() + 3000;

    const opponent = player === "b" ? "b" : "w";
    const tree = new Tree();
    const rootNode = tree.rootNode;
    rootNode.state.board = board;
    rootNode.state.player = player;

    while (new Date().getTime() < end) {
      let promisingNode: ChessNode = this.selectPromisingNode(rootNode);
      if (!promisingNode.state.board.game_over()) {
        this.expandNode(promisingNode);
      }
      let nodeToExplore: ChessNode = promisingNode;
      if (promisingNode.children.length > 0) {
        nodeToExplore = promisingNode.getRandomChildNode();
      }
      let playoutResult = this.simulateRandomPlayout(nodeToExplore);
      this.backPropagation(nodeToExplore, playoutResult);
    }

    let winnerNode: ChessNode = rootNode.getChildWithMaxScore();
    tree.rootNode = winnerNode;
    return winnerNode.state.board;
  }

  selectPromisingNode(rootNode: ChessNode) {
    let node = rootNode;
    while (node.children.length != 0) {
      node = UCT.findBestNodeWithUCT(node);
    }
    return node;
  }

  expandNode(node: ChessNode) {
    let possibleStates = node.state.getAllPossibleStates();
    possibleStates.forEach((state) => {
      let newNode: ChessNode = new ChessNode(state);
      newNode.parent = node;
      newNode.state.player = node.state.getOpponent();
      node.children.push(newNode);
    });
  }

  backPropagation(nodeToExplore: ChessNode, player: string) {
    let tempNode: ChessNode = nodeToExplore;
    while (tempNode != null) {
      tempNode.state.incrementVisit();
      tempNode.state.evaluateBoard();
      tempNode = tempNode.parent;
    }
  }

  simulateRandomPlayout(node: ChessNode) {
    let tempNode: ChessNode = node.clone();
    let tempState: State = tempNode.state;
    let boardStatus = tempState.board.turn();

    if (
      tempState.board.game_over() &&
      tempState.board.turn() == node.state.getOpponent()
    ) {
      tempNode.parent.state.score = Number.MIN_VALUE;
      return boardStatus;
    }

    while (!tempState.board.game_over()) {
      tempState.togglePlayer();
      tempState.randomPlay();
      boardStatus = tempState.board.turn();
    }

    return boardStatus;
  }
}
