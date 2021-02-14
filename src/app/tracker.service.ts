import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export interface ChatRoomInfo {
  name: string;
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrackerService {
  /** Currently active rooms */
  private rooms: ChatRoomInfo[];

  constructor(
    private router: Router,
  ) {}

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
