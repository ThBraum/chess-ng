import { Component, OnInit, ViewChild } from '@angular/core';
import { NgxChessBoardComponent } from 'ngx-chess-board';
import { Chess } from 'chess.js';

@Component({
  selector: 'app-iframepage',
  templateUrl: './iframepage.component.html',
  styleUrls: ['./iframepage.component.scss'],
})
export class IframepageComponent implements OnInit {
  @ViewChild('board') board!: NgxChessBoardComponent;

  player: 'white' | 'black' = 'white';
  disabled = false;
  skipNextMove = false;
  bgColor = '#fce5cd';
  private rotated = false;
  gameOverMessage: string | null = null;
  private chess = new Chess();

  ngOnInit() {
    this.player = window.location.search.includes('player=black')
      ? 'black'
      : 'white';
    this.disabled = this.player === 'black';
    this.bgColor = this.player === 'black' ? '#d9d2e9' : '#fce5cd';

    window.addEventListener('message', (event) => {
      if (!event.data) return;
      if (event.data.type === 'setFEN') {
        this.board.setFEN(event.data.fen);
        this.chess.load(event.data.fen);
        this.disabled = event.data.disabled;
        if (event.data.orientation !== undefined) {
          this.applyOrientation(event.data.orientation === 180);
        }
      }
      if (event.data.type === 'lock') {
        this.disabled = event.data.disabled;
      }
      if (event.data.type === 'resigned') {
        this.board.reset();
        this.chess.reset();
        this.disabled = this.player === 'black';
      }
      if (event.data.type === 'getFEN') {
        window.parent.postMessage(
          { type: 'fen', fen: this.board.getFEN() },
          '*'
        );
      }
      if (event.data.type === 'checkStatusWithFEN') {
        this.board.setFEN(event.data.fen);
        this.chess.load(event.data.fen);
        setTimeout(() => {
          if (this.chess.isCheckmate()) {
            this.onCheckmate();
          } else if (this.chess.isStalemate()) {
            this.onStalemate();
          }
        }, 50);
      }
      if (event.data.type === 'gameover') {
        this.gameOverMessage = event.data.message;
        this.disabled = true;
      }
    });
  }

  private applyOrientation(shouldRotate: boolean) {
    if (this.player === 'black') {
      this.board.reverse();
    }
  }

  onMove(event: any) {
    if (this.disabled) return;
    window.parent.postMessage(
      { type: 'move', move: event, player: this.player },
      '*'
    );
  }

  resign() {
    window.parent.postMessage({ type: 'resigned' }, '*');
  }

  reset() {
    this.gameOverMessage = null;
    window.parent.postMessage({ type: 'resigned' }, '*');
  }

  onCheckmate() {
    this.gameOverMessage = 'gameover';
    this.disabled = true;
    window.parent.postMessage({ type: 'status', status: 'checkmate' }, '*');

    const winner = this.chess.turn() === 'w' ? 'Black' : 'White';
    setTimeout(() => alert(`Checkmate! ${winner} wins.`), 100);
  }

  onStalemate() {
    this.gameOverMessage = 'gameover';
    this.disabled = true;
    window.parent.postMessage({ type: 'status', status: 'stalemate' }, '*');
    setTimeout(() => alert('Draw by stalemate!'), 100);
  }
}
