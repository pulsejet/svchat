import { Component, OnDestroy, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { FwFace } from '@ndn/fw';
import { Name } from "@ndn/packet";
import { enableNfdPrefixReg } from "@ndn/nfdmgmt";
import { WsTransport } from "@ndn/ws-transport";
import { Socket } from 'ndnts-svs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  face: FwFace | null = null;
  sock: Socket | null = null;

  syncPrefix = '/ndn/svs';
  public nodeId = 'dog';

  typedMessage = '';

  @ViewChild('scrollframe', {static: false}) scrollFrame: ElementRef;

  public messages: {
    nid: string,
    msg: string,
    seq: number,
  }[] = [];

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    // Connect to websocket transport
    const face = await WsTransport.createFace({}, "ws://localhost:9696");
    this.face = face;
    console.warn('Connected to NFD successfully!');

    // Enable prefix registration
    enableNfdPrefixReg(face);

    // Sync prefix
    const prefix = new Name(this.syncPrefix);

    // Start SVS socket
    this.sock = new Socket(prefix, this.nodeId, face, (missingData) => {
      // For each node
      for (const m of missingData) {
        // Fetch at most last five messages
        for (let i = Math.max(m.high - 5, m.low); i <= m.high; i++) {
          this.sock?.fetchData(m.session, i).then((data) => {
            const msg = new TextDecoder().decode(data.content);
            this.newMessage(m.session, msg, i);
          }).catch(() => {});
        }
      }
    });
  }

  private isUserNearBottom(scrollContainer: any): boolean {
    const threshold = 150;
    const position = scrollContainer.scrollTop + scrollContainer.offsetHeight;
    const height = scrollContainer.scrollHeight;
    return position > height - threshold;
  }

  newMessage(nid: string, msg: string, seq: number) {
    this.messages.push({ nid, msg, seq });
    this.cdr.detectChanges();

    const scrollContainer = this.scrollFrame.nativeElement;
    if (this.isUserNearBottom(scrollContainer)) {
      scrollContainer.scroll({
        top: this.scrollFrame.nativeElement.scrollHeight,
        left: 0,
        behavior: 'smooth',
      });
    }
  }

  sendMessage() {
    if (!this.typedMessage) return;
    this.sock?.publishData(new TextEncoder().encode(this.typedMessage), 4000);
    this.newMessage(this.nodeId, this.typedMessage, (<Socket>this.sock).getLogic().getSeqNo());
    this.typedMessage = '';
  }

  ngOnDestroy(): void {
    this.face?.close();
  }
}
