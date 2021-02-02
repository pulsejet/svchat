import { Component, OnDestroy, OnInit } from '@angular/core';
import { Endpoint } from '@ndn/endpoint';
import { FwFace } from '@ndn/fw';
import { Name } from "@ndn/packet";
import { enableNfdPrefixReg } from "@ndn/nfdmgmt";
import { WsTransport } from "@ndn/ws-transport";
import * as svs from '../../svs/socket';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {

  face: FwFace | null = null;
  sock: svs.Socket | null = null;
  endpoint: Endpoint | null = null;

  constructor() {}

  async ngOnInit() {
    this.face = await WsTransport.createFace({}, "ws://localhost:9696");
    console.warn('Connected to NFD successfully!');
    await this.produceData();
  }

  async produceData() {
    enableNfdPrefixReg(this.face as any);

    this.sock = new svs.Socket(new Name('/ndn/svs'), 'dog', this.face as any, (missingData) => {
      // For each node
      for (const m of missingData) {
        // Fetch at most last five messages
        for (let i = Math.max(m.high - 5, m.low); i <= m.high; i++) {
          this.sock?.fetchData(m.session, i).then((data) => {
            const msg = new TextDecoder().decode(data.content);
            console.log(`${m.session} => ${msg}`);
          }).catch((err) => {
            console.warn(`Could not get data nid=${m.session} => ${i}`);
          });
        }
      }
    });

    let k = 1;
    setInterval(() => {
      this.sock?.publishData(new TextEncoder().encode('Hello from the web ' + k), 1000);
      k++;
    }, 3000);
  }

  ngOnDestroy(): void {
    this.face?.close();
  }
}
