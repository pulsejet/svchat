import { Component, OnDestroy, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { FwFace } from '@ndn/fw';
import { Name } from "@ndn/packet";
import { fromHex } from "@ndn/tlv";
import { enableNfdPrefixReg } from "@ndn/nfdmgmt";

import { WsTransport } from "@ndn/ws-transport";
import { Socket, VersionVector } from 'ndnts-svs';

import { ForageDataStore } from '../forage-store';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  private face: FwFace | null = null;
  private sock: Socket | null = null;
  private forageStore?: ForageDataStore;

  public syncPrefix: string = '';
  public nodeId = 'dog';

  typedMessage = '';

  @ViewChild('scrollframe', {static: false}) scrollFrame: ElementRef;

  public messages: {
    nid: string,
    msg: string,
    seq: number,
  }[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {
    this.startRoom = this.startRoom.bind(this);
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.syncPrefix = decodeURIComponent(params['prefix']);

      if (!this.syncPrefix) {
        alert('Invalid sync prefix');
      } else {
        this.startRoom();
      }
    });
  }

  private async startRoom() {
    // Close any existing chat
    this.face?.close();
    this.messages = [];
    this.typedMessage = '';

    // Connect to websocket transport
    const face = await WsTransport.createFace({}, "ws://localhost:9696");
    this.face = face;
    console.warn('Connected to NFD successfully!');

    // Enable prefix registration
    enableNfdPrefixReg(face);

    // Sync prefix
    const prefix = new Name(this.syncPrefix);

    // Fetch data for a node
    const fetchData = (nid: string, seq: number) => {
      this.sock?.fetchData(nid, seq).then((data) => {
        const msg = new TextDecoder().decode(data.content);
        this.newMessage(nid, msg, seq);
      }).catch(console.error);
    };

    // Missing data callback
    const updateCallback = (missingData) => {
      // Store the version vector
      this.forageStore.store.setItem('vv', this.sock.m_logic.m_vv.encodeToComponent().tlv);

      // For each node
      for (const m of missingData) {
        // Fetch at most last five messages
        for (let i = Math.max(m.high - 5, m.low); i <= m.high; i++) {
          fetchData(m.session, i);
        }
      }
    };

    // Set up data store
    this.forageStore = new ForageDataStore(this.syncPrefix);

    // Get the version vector
    let initialVV: VersionVector = undefined;
    const vvWire: Uint8Array = await this.forageStore.store.getItem('vv');
    if (vvWire) initialVV = VersionVector.from(vvWire);

    // Start SVS socket
    this.sock = new Socket({
      face: face,
      prefix: prefix,
      id: this.nodeId,
      update: updateCallback,
      syncKey: fromHex("74686973206973206120736563726574206d657373616765"),
      dataStore: this.forageStore,
      cacheAll: true,
      initialVersionVector: initialVV,
    });

    // Get all existing data
    if (initialVV) {
      for (const n of initialVV.getNodes()) {
        for (let i = 1; i <= initialVV.get(n); i++) {
          fetchData(n, i);
        }
      }
    }
  }

  private isUserNearBottom(scrollContainer: any): boolean {
    const threshold = 150;
    const position = scrollContainer.scrollTop + scrollContainer.offsetHeight;
    const height = scrollContainer.scrollHeight;
    return position > height - threshold;
  }

  newMessage(nid: string, msg: string, seq: number) {
    const scrollContainer = this.scrollFrame.nativeElement;
    const wasAtBottom = this.isUserNearBottom(scrollContainer);

    this.messages.push({ nid, msg, seq });
    this.cdr.detectChanges();

    if (wasAtBottom) {
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
    this.newMessage(this.nodeId, this.typedMessage, (<Socket>this.sock).m_logic.getSeqNo());
    this.typedMessage = '';
  }

  ngOnDestroy(): void {
    this.face?.close();
  }
}
