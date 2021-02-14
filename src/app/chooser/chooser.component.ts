import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TrackerService } from '../tracker.service';

@Component({
  selector: 'app-chooser',
  templateUrl: './chooser.component.html',
  styleUrls: ['./chooser.component.css']
})
export class ChooserComponent implements OnInit {
  /** List of rooms currently active */
  public rooms: {
    name: string,
    id: string,
  }[] = [];

  constructor(
    public trackerService: TrackerService,
  ) { }

  ngOnInit(): void {

  }
}
