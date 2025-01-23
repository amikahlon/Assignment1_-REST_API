import React, { useState } from "react";
import "./GameBoard.css";
import XImage from "../assets/X.png";
import OImage from "../assets/O.png";

const winningCombinations: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const GameBoard: React.FC = () => {
  const [board, setBoard] = useState<("X" | "O" | null)[]>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState<boolean>(true);
  const [winner, setWinner] = useState<"X" | "O" | "Draw" | null>(null);

  const checkWinner = (
    newBoard: ("X" | "O" | null)[]
  ): "X" | "O" | "Draw" | null => {
    for (const combo of winningCombinations) {
      const [a, b, c] = combo;
      if (
        newBoard[a] &&
        newBoard[a] === newBoard[b] &&
        newBoard[a] === newBoard[c]
      ) {
        return newBoard[a];
      }
    }
    if (!newBoard.includes(null)) {
      return "Draw";
    }
    return null;
  };

  const handleClick = (index: number): void => {
    if (board[index] || winner) return;
    const newBoard = [...board];
    newBoard[index] = isXTurn ? "X" : "O";
    setBoard(newBoard);
    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result);
    } else {
      setIsXTurn(!isXTurn);
    }
  };

  const resetGame = (): void => {
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
    setWinner(null);
  };

  return (
    <div className="game-container">
      <div className="board">
        {board.map((cell, index) => (
          <div key={index} className="cell" onClick={() => handleClick(index)}>
            {cell && <img src={cell === "X" ? XImage : OImage} alt={cell} />}
          </div>
        ))}
      </div>
      <div className="status-message">
        {winner ? (
          winner === "Draw" ? (
            <p>It's a Draw!</p>
          ) : (
            <p>Player {winner} Wins!</p>
          )
        ) : (
          <p>Player {isXTurn ? "X" : "O"}'s Turn</p>
        )}
        <div className="button-placeholder">
          {winner && <button onClick={resetGame}>Play Again</button>}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;