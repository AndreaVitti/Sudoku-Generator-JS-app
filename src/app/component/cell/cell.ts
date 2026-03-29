import { Component, ElementRef, signal, ViewChild } from '@angular/core';

@Component({
  selector: 'app-cell',
  imports: [],
  templateUrl: './cell.html',
  styleUrl: './cell.css',
})
export class Cell {
  @ViewChild('value') value!: ElementRef<HTMLSpanElement>;
  @ViewChild('inputCell') inputCell!: ElementRef<HTMLInputElement>

  isEmpty = signal<boolean>(false);
  text = signal<string>('');
  color = signal<string>('#000000');

  onInput(e: Event): void {
    const inputELe = e.target as HTMLInputElement;
    if (Number(inputELe.value) > 9) {
      inputELe.value = '';
    } else if (Number(inputELe.value) < 1) {
      inputELe.value = '';
    } else return;
  }
}
