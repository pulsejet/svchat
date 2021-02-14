import { Component, OnDestroy, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { FwFace } from '@ndn/fw';
import { Name } from "@ndn/packet";
import { fromHex } from "@ndn/tlv";

import { Socket, VersionVector } from 'ndnts-svs';

import { DataInterface, DexieDataStore, StoreEntry } from '../dexie-store';
import { ChatRoomInfo, TrackerService } from '../tracker.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  private face: FwFace | null = null;
  private sock: Socket | null = null;
  private store?: DexieDataStore;

  public syncPrefix: string;
  public nodeId: string;

  public room: ChatRoomInfo;

  typedMessage = '';

  @ViewChild('scrollframe', {static: false}) scrollFrame: ElementRef;

  public messages: StoreEntry[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private trackerService: TrackerService,
  ) {
    this.startRoom = this.startRoom.bind(this);
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.room = this.trackerService.getRoom(params['room']);
      if (!this.room) {
        this.router.navigate(['new']);
        return;
      }

      this.syncPrefix = this.room.name;
      this.nodeId = this.room.id;

      if (!this.syncPrefix) {
        alert('Invalid sync prefix');
      } else {
        this.startRoom();
      }
    });
  }

  private async startRoom() {
    // Close any existing chat
    this.sock?.close();
    this.messages = [];
    this.typedMessage = '';

    // Get connection to NFD
    this.face = await this.trackerService.getFace();

    // Sync prefix
    const prefix = new Name(this.syncPrefix);

    // Fetch data for a node
    const fetchData = (nid: string, seq: number) => {
      this.sock?.fetchData(nid, seq).then((data) => {
        this.newMessage(DataInterface.parseData(data));
      }).catch(console.error);
    };

    // Missing data callback
    const updateCallback = (missingData) => {
      // Store the version vector
      this.storeVersionVector(this.sock.m_logic.m_vv);

      // For each node
      for (const m of missingData) {
        for (let i = m.low; i <= m.high; i++) {
          fetchData(m.session, i);
        }
      }
    };

    // Set up data store
    this.store = new DexieDataStore(this.syncPrefix);

    // Get the version vector
    let initialVV: VersionVector = undefined;
    const vvWire = await this.store.db.table('meta').get('vv');
    if (vvWire) initialVV = VersionVector.from(vvWire.blob);

    // Get last few messages
    if (initialVV) {
      const entries = await this.store?.db.table(DexieDataStore.TABLE)
        .orderBy('time').reverse()
        .limit(100).toArray();

      entries.forEach((e) => {
        this.messages.push(e);
      });

      this.messages.sort((a, b) => a.time - b.time);
      this.cdr.detectChanges();
      this.scrollToBottom();
    }

    // Start SVS socket
    this.sock = new Socket({
      face: this.face,
      prefix: prefix,
      id: this.nodeId,
      update: updateCallback,
      syncKey: new TextEncoder().encode(this.room.secret),
      dataStore: this.store,
      cacheAll: true,
      initialVersionVector: initialVV,
    });
  }

  private isUserNearBottom(scrollContainer: any): boolean {
    const threshold = 150;
    const position = scrollContainer.scrollTop + scrollContainer.offsetHeight;
    const height = scrollContainer.scrollHeight;
    return position > height - threshold;
  }

  newMessage(entry: StoreEntry) {
    const scrollContainer = this.scrollFrame.nativeElement;
    const wasAtBottom = this.isUserNearBottom(scrollContainer);

    this.insertEntry(entry);
    this.cdr.detectChanges();

    if (wasAtBottom) {
      this.scrollToBottom();
    }
  }

  insertEntry(e: StoreEntry) {
    if (this.messages.filter(m => m.name === e.name).length > 0) return;

    const location = (start = 0, end = this.messages.length) => {
      const pivot = Math.floor(start + (end - start) / 2);
      if (end - start <= 1 || this.messages[pivot].time === e.time) return pivot;
      if (this.messages[pivot].time < e.time) {
        return location(pivot, end);
      } else {
        return location(start, pivot);
      }
    }
    this.messages.splice(location() + 1, 0, e);
  }

  scrollToBottom() {
    setTimeout(() => {
      const scrollContainer = this.scrollFrame.nativeElement;
      scrollContainer.scroll({
        top: this.scrollFrame.nativeElement.scrollHeight,
        left: 0,
      });
    }, 0);
  }

  sendMessage() {
    if (!this.typedMessage) return;
    this.sock?.publishData(DataInterface.makeData({
      msg: this.typedMessage,
    }), 4000).then((data) => {
      this.newMessage(DataInterface.parseData(data));
      this.typedMessage = '';
      this.scrollToBottom();
      this.storeVersionVector(this.sock.m_logic.m_vv);
    });
  }

  leaveRoom() {
    if (!confirm('Are you sure you want to leave this room?')) return;
    this.trackerService.removeRoom(this.room);
    this.router.navigate(['new']);
  }

  storeVersionVector(vv: VersionVector) {
    this.store.db.table('meta').put({
      key: 'vv',
      blob: vv.encodeToComponent().tlv,
    }, 'vv');
  }

  ngOnDestroy(): void {
    this.sock?.close();
  }
}
