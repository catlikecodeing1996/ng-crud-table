import {Component, OnInit, ViewChild, TemplateRef} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Column, Settings, DataTable, Row} from '../../lib/ng-data-table';
import {getTreeColumns} from './columns';
import {Tree, TreeNode, TreeFlattener} from '../../lib/tree';

@Component({
  selector: 'app-tree-table-custom-demo',
  template: `<p>Editable if last level. Summed column Cube_size if has children rows</p>
  <app-data-table class="fact-table" [table]="dataTable"></app-data-table>
  <ng-template #cellTemplate let-row="row" let-value="value" let-column="column">
    {{getSum(row, column, value)}}
  </ng-template>
  <ng-template #cellNodeTemplate let-row="row" let-value="value">
      <div class="datatable-tree-node"
          [style.padding-left.px]="paddingIndent(row)"
          style="cursor: pointer;">
      <i [class]="getExpanderIcon(row)"
          (click)="onExpand(row)">
      </i>
      <span class="datatable-tree-node-content"
          (dblclick)="onExpand(row)">
          {{row.name}}
      </span>
      </div>
  </ng-template>
  `
})
export class TreeTableCustomDemoComponent implements OnInit {

  dataTable: DataTable;
  settings: Settings = <Settings>{
    paginator: false,
    filter: false,
    sortable: false,
    rowClass: this.getRowClass,
    isEditableCellProp: '$$editable',
    rowHeightProp: '$$height',
  };
  columns: Column[];

  @ViewChild('cellTemplate') cellTemplate: TemplateRef<any>;
  @ViewChild('cellNodeTemplate') cellNodeTemplate: TemplateRef<any>;

  private treeFlattener: TreeFlattener;

  constructor(private http: HttpClient) {
    this.columns = getTreeColumns();
    this.dataTable = new DataTable(this.columns, this.settings, null);
    this.dataTable.pager.perPage = 1000;
    this.treeFlattener = new TreeFlattener(this.transformer);
  }

  ngOnInit() {
    this.dataTable.columns[0].cellTemplate = this.cellNodeTemplate;
    this.dataTable.columns[3].cellTemplate = this.cellTemplate;
    this.dataTable.events.onLoading(true);
    this.http.get<any[]>('assets/tree.json').subscribe(data => {
      this.dataTable.rows = this.prepareTreeData(data);
      this.dataTable.events.onLoading(false);
    });
  }

  transformer = (node: TreeNode, level: number) => {
    const data = {
      expandable: true,
      level: level,
      expanded: false,
      hasChildren: (node.children && node.children.length > 0)
    };
    return Object.assign(data, node.data);
  }

  prepareTreeData(nodes: TreeNode[]) {
    const tree = new Tree();
    tree.nodes = nodes;
    const rows = this.treeFlattener.flattenNodes(tree.nodes);
    rows.forEach(x => {
      x.$$height = (x.level > 1) ? 0 : null;
      x.expanded = !(x.level > 0);
      x.$$editable = !x.hasChildren;
      x['cube_size'] = x.hasChildren ? null : x['cube_size'];
    });
    return rows;
  }

  getRowClass(row): any {
    return {
      'row-warrior': row.$$editable,
      'row-sorcerer': (row.level === 0),
    };
  }

  getSum(row: any, column: Column, value: any) {
    if (value) {
      return value;
    }
    const descendants = this.getDescendants(row, this.dataTable.rows);
    if (descendants && descendants.length) {
      let sum = 0;
      descendants.forEach(x => sum += parseFloat(x[column.name] || 0));
      return sum;
    }
  }

  paddingIndent(row: any): number {
    return row.level * 10;
  }

  onExpand(row: any) {
    row.expanded = !row.expanded;
    if (!row.expanded) {
      const descendants = this.getDescendants(row, this.dataTable.rows);
      if (descendants && descendants.length) {
        descendants.forEach(x => { x.$$height = 0; x.expanded = true; });
      }
    } else {
      const descendants = this.getDescendantsByLevel(row, this.dataTable.rows, row.level + 1);
      descendants.forEach(x => { x.$$height = null; x.expanded = false; });
    }
  }

  getExpanderIcon(row: any) {
    if (row.hasChildren && !row.expanded) {
      return 'dt-icon-node dt-icon-collapsed';
    } else if (row.hasChildren) {
      return 'dt-icon-node';
    }
  }

  getDescendants(row: Row, rows: Row[]) {
    const results = [];
    for (let i = row.$$index + 1; i < rows.length && row.level < rows[i].level; i++) {
      results.push(rows[i]);
    }
    return results;
  }

  getDescendantsByLevel(row: Row, rows: Row[], level: number) {
    const results = [];
    for (let i = row.$$index + 1; i < rows.length && row.level < rows[i].level; i++) {
      if (rows[i].level === level) {
        results.push(rows[i]);
      }
    }
    return results;
  }

}
