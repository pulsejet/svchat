import { Component, OnDestroy, OnInit } from '@angular/core';
import { Endpoint } from '@ndn/endpoint';
import { Forwarder, FwFace } from '@ndn/fw';
import { Data, Interest, Name } from "@ndn/packet";
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
    console.log(Forwarder.getDefault().faces);

    this.face?.addRoute(new Name('/ndn/svs/s'));
    this.face?.addRoute(new Name('/ndn/svs/d'));

    this.endpoint = new Endpoint({
      fw: this.face?.fw,
    } as any);

    this.endpoint.produce('/ndn/alice', async (interest: Interest) => {
      console.log('GOT AN INTEREST', interest.name.toString());
      return new Data(interest.name, new Uint8Array([2, 3, 22]));
    });

    const data = await this.endpoint.consume('/ndn/alice/bleh')
    console.log('GOT MY DATA: ', data.content);

    this.sock = new svs.Socket(new Name('/ndn/svs'), 'dog', this.endpoint, (t) => {
      console.log(t);
    })
  }

  ngOnDestroy(): void {
    this.face?.close();
  }
}
