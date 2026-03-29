import { Routes } from '@angular/router';
import { Sudoku } from './component/sudoku/sudoku';

export const routes: Routes = [
    {
        path: '',
        component: Sudoku,
        title: 'Sudoku'
    }
];
