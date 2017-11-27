import { Device } from '../services/deviceSearchConverter';
import { SearchObject } from '../services/search/searchObject';
import { SearchResult } from '../services/search/searchResult';
import { Caller, CsdmSearchService } from '../services/csdmSearch.service';
import { Notification } from '../../core/notifications/notification.service';
import { SearchElement } from '../services/search/searchElement';
import { SearchTranslator } from 'modules/csdm/services/search/searchTranslator';
import { KeyCodes } from 'collab-ui-ng/src/directives/dropdown/keyCodes';
import { ISuggestion, ISuggestionDropdown, SuggestionDropdown } from '../services/search/suggestion';
import { IBulletContainer } from './deviceSearchBullet.component';

export class DeviceSearch implements ng.IComponentController, ISearchHandler, IBulletContainer {

  private static partialSearchError: boolean;

  private lastSearchInput = '';
  public searchInput = '';
  public searchField = '';
  private lastSearchObject: SearchObject;
  private _inputActive: boolean;
  private searchDelayTimer: ng.IPromise<any> | null;
  private static readonly SEARCH_DELAY_MS = 200;
  private interactedWithSearch = false;

  get inputActive(): boolean {
    return this._inputActive;
  }

  set inputActive(value: boolean) {
    this._inputActive = value;
    this.showSuggestions = value && this.interactedWithSearch;
    this.interactedWithSearch = this.interactedWithSearch || value;
  }

  public suggestions: ISuggestionDropdown;
  public showSuggestions = false;

  //bindings
  private searchResultChanged: (e: { result?: SearchResult }) => {};
  public searchObject: SearchObject;
  private searchInteraction: SearchInteraction;
  public searchResult: Device[];
  private isSearching: boolean;

  /* @ngInject */
  constructor(private CsdmSearchService: CsdmSearchService,
              private $translate: ng.translate.ITranslateService,
              private Notification,
              private $timeout: ng.ITimeoutService,
              private DeviceSearchTranslator: SearchTranslator) {
    this.suggestions = new SuggestionDropdown(this.DeviceSearchTranslator, this.$translate);

    this.suggestions.updateSuggestionsBasedOnSearchResult(undefined, this.searchObject);
  }

  public $onInit(): void {
    this.performSearch(this.searchObject);
    this.searchInteraction.receiver = this;
  }

  private updateSearchResult(result?: SearchResult) {
    this.searchResultChanged({ result: result });

    this.suggestions.updateSuggestionsBasedOnSearchResult(result, this.searchObject);
  }

  public setSortOrder(field: string, order: string) {
    this.searchObject.setSortOrder(field, order);
    this.searchChange();
  }

  public addToSearch(searchElement: SearchElement, toggle: boolean) {
    this.searchObject.addParsedSearchElement(searchElement, toggle);
    this.searchChange();
  }

  public onInputChange() {
    if (this.lastSearchInput !== this.searchInput) {
      this.searchObject.setWorkingElementText(this.searchInput);
      this.lastSearchInput = this.searchInput;
      this.searchChange();
      if (this.searchObject.hasError) {
        this.showSuggestions = false;
      } else {
        this.showSuggestions = true;
        this.suggestions.updateBasedOnInput(this.searchObject);
      }
    }
  }

  public editBullet(bullet: SearchElement) {
    if (!this.searchObject.hasError) {
      this.searchObject.submitWorkingElement();
      this.searchInput = '';
      this.lastSearchInput = '';
    }
    this.searchObject.hasError = false;
    this.lastSearchInput = bullet.toQuery();
    this.searchInput = this.lastSearchInput;
    this.setFocusToInputField();
    bullet.setBeingEdited(true);
  }

  public clearSearchInput() {
    this.searchObject.setQuery('');
    this.searchInput = '';
    this.lastSearchInput = '';
    this.suggestions.updateBasedOnInput(this.searchObject);
    this.searchChange();
  }

  public setFocusToInputField() {
    angular.element('#searchFilterInput').focus();
  }

  public removeBullet(bullet: SearchElement) {
    this.searchObject.removeSearchElement(bullet);
    this.searchChange();
  }

  public searchChange() {
    if (this.lastSearchObject && this.lastSearchObject.equals(this.searchObject)) {
      return;
    } else if (this.searchObject.hasError && !this.lastSearchObject) {
      return;
    }
    const searchClone = this.searchObject.clone();

    if (this.searchDelayTimer) {
      this.$timeout.cancel(this.searchDelayTimer);
      this.searchDelayTimer = null;
    }

    this.searchDelayTimer = this.$timeout(() => {
      this.performSearch(searchClone); //TODO avoid at now
      this.lastSearchObject = searchClone;
      this.suggestions.onSearchChanged(this.searchObject);
    }, DeviceSearch.SEARCH_DELAY_MS);
  }

  public selectSuggestion = (suggestion: ISuggestion) => {
    if (suggestion) {
      this.searchObject.setWorkingElementText(suggestion.searchString);
      if (suggestion.isFieldSuggestion) {
        this.searchInput = suggestion.searchString;
      } else {
        this.searchObject.submitWorkingElement();
        this.searchInput = '';
        this.lastSearchInput = '';
      }
    }
    this.searchChange();
    this.suggestions.updateBasedOnInput(this.searchObject);
  }

  public onSearchInputKeyDown($keyEvent: KeyboardEvent) {
    if ($keyEvent && $keyEvent.keyCode) {
      switch ($keyEvent.keyCode) {
        case KeyCodes.BACKSPACE:
          const target = $keyEvent.target;
          if (target instanceof HTMLInputElement && target.selectionEnd === 0) {
            this.deleteLastBullet();
          }
          break;
        case KeyCodes.DOWN:
          this.suggestions.nextSuggestion();
          break;
        case KeyCodes.UP:
          this.suggestions.previousSuggestion();
          break;
        case KeyCodes.ESCAPE:
          this.showSuggestions = false;
          break;
        case KeyCodes.ENTER:
          const activeSuggestion = this.suggestions.getActiveSuggestion();
          if (activeSuggestion) {
            this.selectSuggestion(activeSuggestion);
          }
      }
    }
  }

  private performSearch(search: SearchObject) {
    this.isSearching = true;
    this.CsdmSearchService.search(search, Caller.searchOrLoadMore).then((response) => {
      if (response && response.data) {
        this.updateSearchResult(response.data);
        DeviceSearch.ShowPartialSearchErrors(response, this.Notification);
      } else {
        this.updateSearchResult();
      }
      this.isSearching = false;
    }).catch(e => {
      if (e.xhrStatus !== 'abort') {
        this.isSearching = false;
        DeviceSearch.ShowSearchError(this.Notification, e.data && e.data.trackingId);
      }
    });
  }

  public static ShowPartialSearchErrors(response, Notification: Notification) {
    if (response && response.data) {
      const trackingId = response.config && response.config.headers && response.config.headers.TrackingID;
      if (!response.data.successfullyRetrievedFromCmi && !response.data.successfullyRetrievedFromCsdm) {
        DeviceSearch.ShowSearchError(Notification, trackingId);
      } else if (!response.data.successfullyRetrievedFromCmi || !response.data.successfullyRetrievedFromCsdm) {
        if (!DeviceSearch.partialSearchError) {
          DeviceSearch.partialSearchError = true;
          DeviceSearch.ShowPartialSearchError(Notification, trackingId);
        }
      } else {
        DeviceSearch.partialSearchError = false;
      }
    }
  }

  private static ShowPartialSearchError(Notification: Notification, trackingId: string) {
    Notification.error('spacesPage.failedToLoadAllDevicesDetails',
      { trackingID: trackingId },
      'spacesPage.failedToLoadAllDevicesTitle',
      true);
  }

  public static ShowSearchError(Notification: Notification, trackingId) {
    Notification.error('spacesPage.searchFailedDetails',
        { trackingID: trackingId },
        'spacesPage.searchFailedTitle',
        true);
  }

  public getBullets(): SearchElement[] {
    return this.searchObject.getBullets();
  }

  public getTranslatedQuery(): string {
    return this.searchObject.getTranslatedQueryString(this.DeviceSearchTranslator);
  }

  private deleteLastBullet() {
    const bulletList = this.searchObject.getBullets();
    const lastBullet = _.findLast(bulletList, b => !b.isBeingEdited());
    if (lastBullet) {
      this.removeBullet(lastBullet);
    }
  }
}

export interface ISearchHandler {
  addToSearch(searchElement: SearchElement, toggle: boolean);

  setSortOrder(field?: string, order?: string);
}

export class SearchInteraction implements ISearchHandler {
  public receiver: ISearchHandler;

  public addToSearch(searchElement: SearchElement, toggle: boolean) {
    if (this.receiver) {
      this.receiver.addToSearch(searchElement, toggle);
    }
  }

  public setSortOrder(field: string, order: string) {
    if (this.receiver) {
      this.receiver.setSortOrder(field, order);
    }
  }
}

export class DeviceSearchComponent implements ng.IComponentOptions {
  public controller = DeviceSearch;
  public bindings = {
    searchInteraction: '<',
    searchResultChanged: '&',
    searchObject: '<',
    isSearching: '=',
  };
  public controllerAs = 'dctrl';
  public template = require('modules/csdm/devicesRedux/deviceSearch.html');
}
