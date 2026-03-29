import { AfterViewInit, Component, ElementRef, QueryList, Signal, signal, ViewChild, ViewChildren } from '@angular/core';
import { Cell } from '../cell/cell';

@Component({
  selector: 'app-sudoku',
  imports: [Cell],
  templateUrl: './sudoku.html',
  styleUrl: './sudoku.css',
})
export class Sudoku implements AfterViewInit {

  @ViewChildren('cell') cells!: QueryList<Cell>;
  @ViewChild('difficulty') difficulty !: ElementRef<HTMLSelectElement>;

  private board: number[][] = [];
  loading = signal<boolean>(false);
  retry = signal<boolean>(false);
  private difficultySelected: number = 32;
  private solution: number[][] = [];
  solutionAvail = signal<boolean>(false);

  ngAfterViewInit(): void {
    if (this.difficulty) {
      this.difficulty.nativeElement.value = this.difficultySelected.toString();
    }
  }

  generateSudoku(): void {
    this.loading.set(true);
    if (this.difficulty) {
      this.difficultySelected = Number(this.difficulty.nativeElement.value);
    }
    for (let i = 0; i < 9; i++) {
      this.board[i] = new Array(9);
      this.board[i].fill(0);
    }
    this.cells.forEach((cell) => {
      cell.isEmpty.set(false);
      if (cell.value) {
        cell.text.set('');
      }
      if (cell.inputCell) {
        cell.inputCell.nativeElement.value = '';
      }
      if (!cell.isEmpty()) {
        cell.color.set('#000000');
      }
    });
    setTimeout(() => {
      this.createSudokuSolution(0, 0);
      this.solution = this.board.map(row => [...row]);
      console.log(this.solution)
      this.retry.set(!this.deleteCells(this.board, this.difficultySelected, 100, { triesCount: 0 }, new Set<string>()));
      this.cells.forEach((cell, index) => {
        const boardValue = this.board[Math.floor(index / 9)][(index % 9)];
        if (boardValue !== 0) {
          cell.text.set(boardValue.toString());
        } else {
          cell.isEmpty.set(true);
        }
      });
      this.solutionAvail.set(true);
      this.loading.set(false);
    });
  }

  private createSudokuSolution(row: number, column: number): boolean {
    if (row === 9) {
      return true;
    }
    let values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = 0; i < 9; i++) {
      let index = Math.floor(Math.random() * values.length);
      if (this.isValid(row, column, values[index], this.board)) {
        this.board[row][column] = values[index];
        const prevRow = row;
        const prevCol = column;
        column++;
        if (column > 8) {
          column = 0;
          row++;
        }
        if (this.createSudokuSolution(row, column)) return true;
        row = prevRow;
        column = prevCol;
        this.board[row][column] = 0;
      }
      values.splice(index, 1);
    }
    return false;
  }

  private deleteCells(board: number[][], cellToRemove: number, maxRetries: number, triesCount: { triesCount: number }, cellAlreadyRemoved: Set<string>): boolean {
    if (triesCount.triesCount >= maxRetries) {
      return false;
    }
    if (cellAlreadyRemoved.size === cellToRemove) {
      return true;
    }
    let rndRow: number;
    let rndColumn: number;
    let coordinatesStr: string;
    let alreadyTried = new Set<string>();
    while (81 - cellAlreadyRemoved.size > alreadyTried.size) {
      do {
        rndRow = Math.floor(Math.random() * 9);
        rndColumn = Math.floor(Math.random() * 9);
        coordinatesStr = rndRow + ',' + rndColumn;
      } while (cellAlreadyRemoved.has(coordinatesStr) || alreadyTried.has(coordinatesStr));
      alreadyTried.add(coordinatesStr);
      const prevValue = board[rndRow][rndColumn];
      const tempBoard = board.map(row => [...row]);
      tempBoard[rndRow][rndColumn] = 0;
      if (this.checkSudokuUniqueness(tempBoard, 0, 0, { count: 0 })) {
        cellAlreadyRemoved.add(coordinatesStr);
        board[rndRow][rndColumn] = 0;
        if (this.deleteCells(board, cellToRemove, maxRetries, triesCount, cellAlreadyRemoved)) return true;
        cellAlreadyRemoved.delete(coordinatesStr);
        board[rndRow][rndColumn] = prevValue;
      }
    }
    console.log(triesCount.triesCount)
    triesCount.triesCount++;
    return false;
  }

  private checkSudokuUniqueness(board: number[][], row: number, column: number, solutionCountObj: { count: number }): boolean {
    if (solutionCountObj.count > 1) return false;
    if (row === 9) {
      solutionCountObj.count++;
      if (solutionCountObj.count > 1) {
        return false;
      }
      return true;
    }
    if (board[row][column] === 0) {
      for (let i = 1; i <= 9; i++) {
        if (this.isValid(row, column, i, board)) {
          board[row][column] = i;
          const prevRow = row;
          const prevCol = column;
          column++;
          if (column > 8) {
            column = 0;
            row++;
          }
          if (!this.checkSudokuUniqueness(board, row, column, solutionCountObj)) return false;
          row = prevRow;
          column = prevCol;
          board[row][column] = 0;
        }
      }
      return true;
    } else {
      column++;
      if (column > 8) {
        column = 0;
        row++;
      }
      return this.checkSudokuUniqueness(board, row, column, solutionCountObj);
    }
  }

  private isValid(row: number, column: number, value: number, board: number[][]): boolean {
    return (this.checkRow(row, value, board) &&
      this.checkColumn(column, value, board) &&
      this.checkSubGrid(row, column, value, board))
  }

  private checkRow(row: number, value: number, board: number[][]): boolean {
    for (let i = 0; i < 9; i++) {
      if (board[row][i] === value) {
        return false;
      }
    }
    return true;
  }

  private checkColumn(column: number, value: number, board: number[][]): boolean {
    for (let i = 0; i < 9; i++) {
      if (board[i][column] === value) {
        return false;
      }
    }
    return true;
  }

  private checkSubGrid(row: number, column: number, value: number, board: number[][]): boolean {
    let subGridrow = this.findSubGrid(row);
    let subGridColumn = this.findSubGrid(column);
    for (let i = subGridrow; i < subGridrow + 3; i++) {
      for (let y = subGridColumn; y < subGridColumn + 3; y++) {
        if (board[i][y] === value) {
          return false;
        }
      }
    }
    return true;
  }

  private findSubGrid(value: number): number {
    if (0 <= value && value < 3) {
      return 0;
    }
    else if (3 <= value && value < 6) {
      return 3;
    }
    else {
      return 6;
    }
  }

  onRetry(): void {
    this.generateSudoku();
  }

  getSolution(): void {
    for (let i = 0; i < 81; i++) {
      if (this.cells.get(i)?.isEmpty()) {
        if (this.cells.get(i)?.inputCell.nativeElement.value === '') {
          this.solutionCell(i, '#017599');
        } else if (this.cells.get(i)?.inputCell.nativeElement.value !== this.solution[Math.floor(i / 9)][(i % 9)].toString()) {
          this.solutionCell(i, '#c20000');
        } else {
          this.solutionCell(i, '#1eb600');
        }
      }
    }
  };

  private solutionCell(cellIndex: number, color: string) {
    this.cells.get(cellIndex)?.isEmpty.set(false);
    this.cells.get(cellIndex)?.text.set(this.solution[Math.floor(cellIndex / 9)][(cellIndex % 9)].toString());
    this.cells.get(cellIndex)?.color.set(color);
  }
}
