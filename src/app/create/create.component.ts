import { Component, OnInit } from '@angular/core';
import { TrackerService } from '../tracker.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css']
})
export class CreateComponent implements OnInit {

  public newName: string = '';
  public newId: string = '';

  constructor(
    public trackerService: TrackerService,
  ) { }

  ngOnInit(): void {
  }

  join() {
    const room = {
      name: this.newName,
      id: this.newId,
    };
    this.trackerService.addRoom(room);
    this.trackerService.gotoRoom(room);
  }

}
