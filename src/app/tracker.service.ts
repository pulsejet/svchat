import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { FwFace } from '@ndn/fw';
import { WsTransport } from "@ndn/ws-transport";
import { enableNfdPrefixReg } from "@ndn/nfdmgmt";

export interface ChatRoomInfo {
  name: string;
  id: string;
  secret: string;
  nfd: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrackerService {
  /** Currently active rooms */
  private rooms: ChatRoomInfo[];
  /** Connected face */
  private faces: {[key: string]: FwFace} = {};

  constructor(
    private router: Router,
  ) {
    this.getFace = this.getFace.bind(this);
  }

  async getFace(nfd: string): Promise<FwFace> {
    if (this.faces[nfd]?.running) return this.faces[nfd];

    this.faces[nfd] = await WsTransport.createFace({}, nfd);
    console.warn('Connected to NFD successfully!', nfd);

    // Enable prefix registration
    enableNfdPrefixReg(this.faces[nfd]);

    return this.faces[nfd];
  }

  closeFace(nfd: string) {
    this.faces[nfd]?.close();
  }

  getRooms(): ChatRoomInfo[] {
    if (!this.rooms) {
      this.rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
    }
    return this.rooms;
  }

  addRoom(room: ChatRoomInfo) {
    this.rooms.push(room);
    this.dumpRooms();
  }

  getRoom(index: number) {
    if (index >= this.rooms.length || index < 0) return undefined;
    return this.rooms[index];
  }

  removeRoom(room: ChatRoomInfo) {
    const i = this.rooms.indexOf(room)
    this.rooms.splice(i, 1);
    this.dumpRooms();
  }

  gotoRoom(room: ChatRoomInfo) {
    const i = this.rooms.indexOf(room)
    if (i === -1) {
      alert('Non existent room!');
      return;
    }
    this.router.navigate(['/chat', i]);
  }

  private dumpRooms() {
    localStorage.setItem('rooms', JSON.stringify(this.rooms));
  }
}
