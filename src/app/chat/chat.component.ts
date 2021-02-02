import { Component, OnDestroy, OnInit } from '@angular/core';
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

  constructor() {}

  async ngOnInit() {
    // Connect to websocket transport
    const face = await WsTransport.createFace({}, "ws://localhost:9696");
    this.face = face;
    console.warn('Connected to NFD successfully!');

    // Enable prefix registration
    enableNfdPrefixReg(face);

    // Sync prefix
    const prefix = new Name('/ndn/svs');

    this.sock = new Socket(prefix, 'dog', face, (missingData) => {
      // For each node
      for (const m of missingData) {
        // Fetch at most last five messages
        for (let i = Math.max(m.high - 5, m.low); i <= m.high; i++) {
          this.sock?.fetchData(m.session, i).then((data) => {
            const msg = new TextDecoder().decode(data.content);
            this.newMessage(m.session, msg);
          }).catch();
        }
      }
    });
  }

  newMessage(sender: string, message: string) {
    console.log(`${sender} => ${message}`);
  }

  ngOnDestroy(): void {
    this.face?.close();
  }
}
