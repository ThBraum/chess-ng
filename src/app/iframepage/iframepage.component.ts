import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { NgxChessBoardComponent } from 'ngx-chess-board';

@Component({
  selector: 'app-iframepage',
  templateUrl: './iframepage.component.html',
  styleUrls: ['./iframepage.component.scss'],
})
export class IframepageComponent implements OnInit, AfterViewInit {
  @ViewChild('board') board!: NgxChessBoardComponent;

  player: 'white' | 'black' = 'white';
  disabled = false;
  skipNextMove = false;
  bgColor = '#fce5cd';
  private rotated = false;

  ngOnInit() {
    this.player = window.location.search.includes('player=black')
      ? 'black'
      : 'white';
    this.disabled = this.player === 'black';
    this.bgColor = this.player === 'black' ? '#d9d2e9' : '#fce5cd';

    window.addEventListener('message', (event) => {
      if (!event.data) return;

      if (event.data.type === 'setFEN') {
        console.log('Setting FEN:', event.data.fen);
        this.board.setFEN(event.data.fen);
        this.disabled = event.data.disabled;
        this.ensureBoardOrientation();
      }

      if (event.data.type === 'lock') {
        this.disabled = event.data.disabled;
      }

      if (event.data.type === 'resigned') {
        this.board.reset();
        this.disabled = this.player === 'black';
        // this.ensureBoardOrientation();
      }

      if (event.data.type === 'gameover') {
        alert(event.data.message);
        this.disabled = true;
      }

      if (event.data.type === 'getFEN') {
        window.parent.postMessage(
          { type: 'fen', fen: this.board.getFEN() },
          '*'
        );
      }

      // Called by parent after move, with new FEN, to check status (checkmate/stalemate)
      if (event.data.type === 'checkStatusWithFEN') {
        this.board.setFEN(event.data.fen);
        setTimeout(() => {
          const chess: any =
            (this.board as any).chessInstance ||
            (this.board as any).chess ||
            null;
          let status = 'playing';
          if (
            chess &&
            typeof chess.in_checkmate === 'function' &&
            chess.in_checkmate()
          )
            status = 'checkmate';
          else if (
            chess &&
            typeof chess.in_stalemate === 'function' &&
            chess.in_stalemate()
          )
            status = 'stalemate';
          window.parent.postMessage({ type: 'status', status }, '*');
        }, 50);
      }
    });
  }

  onMove(event: any) {
    if (this.skipNextMove) {
      this.skipNextMove = false;
      return;
    }
    if (this.disabled) return;
    window.parent.postMessage(
      { type: 'move', move: event, player: this.player },
      '*'
    );
  }

  ngAfterViewInit() {
    if (this.player === 'black') {
      setTimeout(() => this.board.reverse(), 50);
    }
  }

  resign() {
    window.parent.postMessage({ type: 'resigned' }, '*');
  }

  reset() {
    window.parent.postMessage({ type: 'resigned' }, '*');
  }

  private ensureBoardOrientation() {
    if (this.player === 'black' && !this.rotated) {
      setTimeout(() => {
        this.board.reverse();
        this.rotated = true;
      }, 50);
    }
  }
}
