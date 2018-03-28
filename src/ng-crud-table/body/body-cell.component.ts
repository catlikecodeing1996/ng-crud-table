import {
  Component, Input, HostBinding, ViewContainerRef, ViewChild, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import {Column} from '../base/column';
import {DataTable} from '../base/data-table';
import {Subscription} from 'rxjs/Subscription';
import {addClass} from '../base/util';

@Component({
  selector: 'app-datatable-body-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cell-data" *ngIf="!column.cellTemplate" title="{{value}}">
      {{value}}
    </div>
    <ng-template #cellTemplate
                 *ngIf="column.cellTemplate"
                 [ngTemplateOutlet]="column.cellTemplate"
                 [ngTemplateOutletContext]="cellContext">
    </ng-template>
  `
})
export class BodyCellComponent implements OnInit, OnDestroy {

  @Input() public table: DataTable;
  @Input() public colIndex: number;

  @Input()
  set column(column: Column) {
    this._column = column;
    this.cellContext.column = column;
    this.updateValue();
  }

  get column(): Column {
    return this._column;
  }

  @Input()
  set row(row: any) {
    this._row = row;
    this.cellContext.row = row;
    this.updateValue();
  }

  get row(): any {
    return this._row;
  }

  @HostBinding('class')
  get columnCssClasses(): any {
    let cls = 'datatable-body-cell';
    if (this.column.cellClass) {
      if (typeof this.column.cellClass === 'string') {
        cls += ' ' + this.column.cellClass;
      } else if (typeof this.column.cellClass === 'function') {
        const res = this.column.cellClass({
          row: this.row,
          column: this.column,
          value: this.value,
        });
        cls = addClass(cls, res);
      }
    }
    if (this.editing) {
      cls += ' cell-editing';
    }
    return cls;
  }

  @HostBinding('style.width.px')
  get width(): number {
    return this.column.width;
  }

  @ViewChild('cellTemplate', {read: ViewContainerRef}) cellTemplate: ViewContainerRef;

  public value: any;
  public oldValue: any;
  public cellContext: any = {
    row: this.row,
    value: this.value,
    column: this.column,
  };
  public editing: boolean;
  private _column: Column;
  private _row: any;
  private subscriptions: Subscription[] = [];

  constructor(private cd: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    const subRows = this.table.dataService.rowsSource$.subscribe(() => {
      this.updateValue();
    });
    this.subscriptions.push(subRows);
  }

  ngOnDestroy(): void {
    if (this.cellTemplate) {
      this.cellTemplate.clear();
    }
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  updateValue(): void {
    if (this.column) {
      this.cellContext.value = this.column.getValue(this.row);
      if (this.cellContext.value !== this.oldValue) {
        this.oldValue = this.cellContext.value;
        this.value = this.column.getValueView(this.row);
      }
    }
    this.cd.markForCheck();
  }

}
