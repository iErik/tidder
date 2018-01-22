import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: [ './search-bar.component.scss' ]
})

export class SearchBarComponent {
  @Input('placeholder') inputPlaceholder: string = 'Type your search here...'
  @Input() variant: string = 'primary';

  private _searchQuery: string;
  @Output() searchQueryChange = new EventEmitter<string>();

  @Input()
  get searchQuery() {
    return this._searchQuery;
  }

  set searchQuery(query: string) {
    this._searchQuery = query;
    this.searchQueryChange.emit(this._searchQuery);
  }
}
