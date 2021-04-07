import { Component, OnInit } from '@angular/core';
import { ChatRoomInfo, TrackerService } from '../tracker.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css']
})
export class CreateComponent implements OnInit {

  public newName: string = '';
  public newId: string = '';
  public newSecret: string = 'this is a secret message';
  public newNFD: string = `ws://${window.location.hostname}:9696`;

  constructor(
    public trackerService: TrackerService,
  ) { }

  ngOnInit(): void {
  }

  join() {
    const room: ChatRoomInfo = {
      name: this.newName,
      id: this.newId,
      secret: this.newSecret,
      nfd: this.newNFD,
    };
    this.trackerService.addRoom(room);
    this.trackerService.gotoRoom(room);
  }

}
