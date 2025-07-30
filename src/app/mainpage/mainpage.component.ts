import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-mainpage',
  templateUrl: './mainpage.component.html',
  styleUrls: ['./mainpage.component.scss'],
})
export class MainpageComponent implements AfterViewInit {
  @ViewChild('iframe1') iframe1!: ElementRef<HTMLIFrameElement>;
  @ViewChild('iframe2') iframe2!: ElementRef<HTMLIFrameElement>;

  currentTurn: 'white' | 'black' = 'white';

  ngAfterViewInit() {
    window.addEventListener('message', this.handleMessage.bind(this));
    setTimeout(() => this.restoreGame(), 500);
  }

  handleMessage(event: MessageEvent) {
    if (!event.data) return;

    // MIRRORED MOVE HANDLING: always sync via FEN
    if (event.data.type === 'move') {
      const { player } = event.data;
      this.currentTurn = player === 'white' ? 'black' : 'white';

      const sourceIframe = player === 'white' ? this.iframe1 : this.iframe2;
      const targetIframe = player === 'white' ? this.iframe2 : this.iframe1;

      sourceIframe.nativeElement.contentWindow?.postMessage({ type: 'getFEN' }, '*');

      const fenHandler = (evt: MessageEvent) => {
        if (evt.data && evt.data.type === 'fen') {
          // Mirror the full board state
          targetIframe.nativeElement.contentWindow?.postMessage(
            { type: 'setFEN', fen: evt.data.fen, disabled: false },
            '*'
          );
          // Lock source board
          sourceIframe.nativeElement.contentWindow?.postMessage(
            { type: 'lock', disabled: true },
            '*'
          );
          // Enable target board
          targetIframe.nativeElement.contentWindow?.postMessage(
            { type: 'lock', disabled: false },
            '*'
          );
          localStorage.setItem('chess_fen', evt.data.fen);
          localStorage.setItem('chess_turn', this.currentTurn);
          this.checkGameOver(evt.data.fen);
        }
      };
      window.addEventListener('message', fenHandler, { once: true });
    }

    // For restoring and resign
    if (event.data.type === 'fen') {}

    if (event.data.type === 'status') {
      if (event.data.status === 'checkmate') {
        this.announceGameOver(`Checkmate! ${this.currentTurn === 'white' ? 'Black' : 'White'} wins.`);
      } else if (event.data.status === 'stalemate') {
        this.announceGameOver('Draw by stalemate!');
      }
    }
  }

  checkGameOver(fen: string) {
    // Ask one of the iframes for game status using the latest FEN
    this.iframe1.nativeElement.contentWindow?.postMessage({ type: 'checkStatusWithFEN', fen }, '*');
  }

  announceGameOver(message: string) {
    this.iframe1.nativeElement.contentWindow?.postMessage({ type: 'gameover', message }, '*');
    this.iframe2.nativeElement.contentWindow?.postMessage({ type: 'gameover', message }, '*');
    setTimeout(() => alert(message), 200);
    this.clearGame();
  }

  resign() {
    this.iframe1.nativeElement.contentWindow?.postMessage({ type: 'resigned' }, '*');
    this.iframe2.nativeElement.contentWindow?.postMessage({ type: 'resigned' }, '*');
    this.clearGame();
  }

  restoreGame() {
    const fen = localStorage.getItem('chess_fen');
    const turn = localStorage.getItem('chess_turn') as 'white' | 'black' | null;
    if (fen && turn) {
      this.iframe1.nativeElement.contentWindow?.postMessage(
        { type: 'setFEN', fen, disabled: turn !== 'white' },
        '*'
      );
      this.iframe2.nativeElement.contentWindow?.postMessage(
        { type: 'setFEN', fen, disabled: turn !== 'black' },
        '*'
      );
      this.currentTurn = turn;
    }
  }

  clearGame() {
    localStorage.removeItem('chess_fen');
    localStorage.removeItem('chess_turn');
  }
}
