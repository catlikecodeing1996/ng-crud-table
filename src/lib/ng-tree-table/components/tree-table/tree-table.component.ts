import {
  Component, OnInit, OnDestroy, Input, ViewEncapsulation, HostBinding, ViewChild, TemplateRef,
  ChangeDetectionStrategy
} from '@angular/core';
import {TreeTable, Row} from '../../base';
import {Subscription} from 'rxjs';
import {TreeNode, TreeHelper} from '../../../tree';

@Component({
  selector: 'app-tree-table',
  templateUrl: './tree-table.component.html',
  styleUrls: ['../../../styles/icons.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeTableComponent implements OnInit, OnDestroy {

  @Input() treeTable: TreeTable;

  @HostBinding('class.datatable') cssClass = true;
  @ViewChild('cellTemplate') cellTemplate: TemplateRef<any>;

  private subscriptions: Subscription[] = [];

  constructor() {}

  ngOnInit() {
    this.treeTable.columns[0].cellTemplate = this.cellTemplate;
    this.initGetNodes();

    const subCheckbox = this.treeTable.events.checkboxSource$.subscribe((event) => {
      this.selectionToggle(event);
    });
    this.subscriptions.push(subCheckbox);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  initGetNodes() {
    this.treeTable.events.onLoading(true);
    this.treeTable.tree.initLoadNodes()
      .then(() => {
        this.treeTable.flatten();
      })
      .finally(() => { this.treeTable.events.onLoading(false); });
  }

  onExpand(node: TreeNode) {
    node.expanded = !node.expanded;
    if (node.expanded) {
      node.$$loading = true;
      this.treeTable.tree.loadNode(node)
        .then(() => {
          this.treeTable.flatten();
        })
        .finally(() => { node.$$loading = false; });
    } else {
      this.treeTable.flatten();
    }
  }

  getExpanderIcon(node: TreeNode) {
    return TreeHelper.getExpanderIcon(node);
  }

  getIcon(node: TreeNode) {
    if (this.treeTable.getIconFunc) {
      return this.treeTable.getIconFunc(node);
    } else {
      return node.icon;
    }
  }

  selectionToggle(row: Row): void {
    let descendants = this.treeTable.getDescendants(row);
    descendants = descendants.map(x => x.$$index);
    this.treeTable.selection.isSelected(row.$$index)
      ? this.treeTable.selection.select(...descendants)
      : this.treeTable.selection.deselect(...descendants);
  }

  paddingIndent(row: any): number {
    return row.level * this.treeTable.indent;
  }

}
