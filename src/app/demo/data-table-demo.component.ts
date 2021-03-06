import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Column, Settings, DataTable} from '../../lib/ng-data-table';
import {getColumnsPlayers} from './columns';

@Component({
  selector: 'app-data-table-demo',
  template: `<app-data-table [table]="table"></app-data-table>`
})

export class DataTableDemoComponent implements OnInit {

  table: DataTable;
  columns: Column[];

  settings: Settings = <Settings>{
    columnResizeMode: 'aminated',
  };

  constructor(private http: HttpClient) {
    this.columns = getColumnsPlayers();
    this.table = new DataTable(this.columns, this.settings);
  }

  ngOnInit() {
    this.table.events.onLoading(true);
    this.http.get('assets/players.json').subscribe(data => {
      this.table.rows = data;
      this.table.events.onLoading(false);
    });
  }

}
