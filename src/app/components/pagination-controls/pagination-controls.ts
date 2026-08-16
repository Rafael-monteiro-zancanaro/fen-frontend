import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  PAGE_SIZE_OPTIONS,
  PageSize,
  PaginationState,
  normalizePageSize,
} from '../../domain/pagination';

@Component({
  selector: 'app-pagination-controls',
  templateUrl: './pagination-controls.html',
})
export class PaginationControls {
  @Input({ required: true }) pagination!: PaginationState;
  @Input() summaryId = 'records';
  @Input() pageSizeSelectId = 'pageSize';
  @Input() itemLabel = 'registro(s)';

  @Output() readonly previousPage = new EventEmitter<void>();
  @Output() readonly nextPage = new EventEmitter<void>();
  @Output() readonly pageSizeChange = new EventEmitter<PageSize>();

  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  protected updatePageSize(value: string): void {
    this.pageSizeChange.emit(normalizePageSize(Number(value)));
  }
}
