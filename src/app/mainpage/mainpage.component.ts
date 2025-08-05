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

    if (event.data.type === 'move') {
      const { player } = event.data;
      this.currentTurn = player === 'white' ? 'black' : 'white';

      const sourceIframe = player === 'white' ? this.iframe1 : this.iframe2;
      const targetIframe = player === 'white' ? this.iframe2 : this.iframe1;

      sourceIframe.nativeElement.contentWindow?.postMessage(
        { type: 'getFEN' },
        '*'
      );

      const fenHandler = (evt: MessageEvent) => {
        if (evt.data && evt.data.type === 'fen') {
          this.iframe1.nativeElement.contentWindow?.postMessage(
            {
              type: 'setFEN',
              fen: evt.data.fen,
              disabled: this.currentTurn !== 'white',
              orientation: 0,
            },
            '*'
          );
          this.iframe2.nativeElement.contentWindow?.postMessage(
            {
              type: 'setFEN',
              fen: evt.data.fen,
              disabled: this.currentTurn !== 'black',
              orientation: 180,
            },
            '*'
          );
          sourceIframe.nativeElement.contentWindow?.postMessage(
            { type: 'lock', disabled: true },
            '*'
          );
          targetIframe.nativeElement.contentWindow?.postMessage(
            { type: 'lock', disabled: false },
            '*'
          );
          localStorage.setItem('chess_fen', evt.data.fen);
          localStorage.setItem('chess_turn', this.currentTurn);

          setTimeout(() => this.checkGameOver(evt.data.fen), 30);
        }
      };
      window.addEventListener('message', fenHandler, { once: true });
    }

    if (event.data.type === 'status') {
      console.log('[parent] Received status:', event.data.status);
      if (event.data.status === 'checkmate') {
        this.announceGameOver(
          `Checkmate! ${this.currentTurn === 'white' ? 'Black' : 'White'} wins.`
        );
      } else if (event.data.status === 'stalemate') {
        this.announceGameOver('Draw by stalemate!');
      }
    }

    if (event.data.type === "newgame") {
      this.iframe1.nativeElement.contentWindow?.postMessage(
        { type: 'hideNewGameButton' },
        '*'
      );
      this.iframe2.nativeElement.contentWindow?.postMessage(
        { type: 'hideNewGameButton' },
        '*'
      );
      this.resign();
    }
  }

  checkGameOver(fen: string) {
    this.iframe1.nativeElement.contentWindow?.postMessage(
      { type: 'checkStatusWithFEN', fen },
      '*'
    );
  }

  announceGameOver(message: string) {
    this.iframe1.nativeElement.contentWindow?.postMessage(
      { type: 'gameover', message },
      '*'
    );
    this.iframe2.nativeElement.contentWindow?.postMessage(
      { type: 'gameover', message },
      '*'
    );
    this.clearGame();
  }

  resign() {
    this.iframe1.nativeElement.contentWindow?.postMessage(
      { type: 'resigned' },
      '*'
    );
    this.iframe2.nativeElement.contentWindow?.postMessage(
      { type: 'resigned' },
      '*'
    );
    this.clearGame();
    setTimeout(() => {
      const initialFEN =
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      this.iframe1.nativeElement.contentWindow?.postMessage(
        { type: 'setFEN', fen: initialFEN, disabled: false, orientation: 0 },
        '*'
      );
      this.iframe2.nativeElement.contentWindow?.postMessage(
        { type: 'setFEN', fen: initialFEN, disabled: true, orientation: 180 },
        '*'
      );
      localStorage.setItem('chess_fen', initialFEN);
      localStorage.setItem('chess_turn', 'white');
      this.currentTurn = 'white';
    }, 150);
  }

  restoreGame() {
    const fen = localStorage.getItem('chess_fen');
    const turn = localStorage.getItem('chess_turn') as 'white' | 'black' | null;
    if (fen && turn) {
      this.iframe1.nativeElement.contentWindow?.postMessage(
        { type: 'setFEN', fen, disabled: turn !== 'white', orientation: 0 },
        '*'
      );
      this.iframe2.nativeElement.contentWindow?.postMessage(
        { type: 'setFEN', fen, disabled: turn !== 'black', orientation: 180 },
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
