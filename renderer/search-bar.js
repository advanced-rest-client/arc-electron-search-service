class SearchBarInit {
  constructor(searchFile, themeFile) {
    this.searchFile = searchFile;
    this.themeFile = themeFile;
    this._searchCoundHandler = this._searchCoundHandler.bind(this);
    this._focusHandler = this._focusHandler.bind(this);

    this.close = this.close.bind(this);
    this.query = this.query.bind(this);
    this.highlightNext = this.highlightNext.bind(this);
    this.highlightPrevious = this.highlightPrevious.bind(this);
  }
  /**
   * Returns the `<dom-bind>` template element.
   *
   * @return {HTMLElement} Instance of the `dom-bind` template.
   */
  get bar() {
    return document.getElementById('bar');
  }
  /**
   * Listens for the main script events.
   */
  listen() {
    /* global ipc */
    ipc.on('search-count', this._searchCoundHandler);
    ipc.on('focus-input', this._focusHandler);
  }
  /**
   * Removes listeners for the main script events.
   */
  unlisten() {
    ipc.removeListener('search-count', this._searchCoundHandler);
    ipc.removeListener('focus-input', this._focusHandler);
  }
  /**
   * Initializes search bar `<dom-bind>` properties and loads components.
   */
  initBar() {
    const bar = this.bar;
    bar.close = this.close;
    bar.query = this.query;
    bar.highlightNext = this.highlightNext;
    bar.highlightPrevious = this.highlightPrevious;
    bar.selected = 0;
    bar.searchCount = 0;
    bar.isAnypoint = (this.themeFile || '').indexOf('anypoint') !== -1;
  }
  /**
   * Loads bar components.
   *
   * @return {Promise}
   */
  loadBar() {
    // the content loader would think that the relative path starts with
    // ./arc-electron-search-service/renderer/.. so it has to be rewriten
    const sf = this._resolvePath(this.searchFile);
    const tf = this._resolvePath(this.themeFile);
    return this._importHref(sf)
    .then(() => this._importHref(tf))
    .then(() => {
      setTimeout(() => {
        Polymer.updateStyles({});
      });
    })
    .catch((cause) => console.error(cause));
  }

  _resolvePath(href) {
    if (!href) {
      return;
    }
    if (href[0] === '/') {
      return href;
    }
    return new URL('../../arc-electron/' + this.searchFile, location.href).toString();
    // return new URL('../../' + this.searchFile, location.href).toString();
  }

  /**
   * Imports file using HTML imports.
   * @param {String} href File location
   * @return {Promise}
   */
  _importHref(href) {
    if (!href) {
      return Promise.reject(new Error('href is undefined'));
    }
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'import';
      link.href = href;
      link.setAttribute('import-href', '');
      link.setAttribute('async', '');
      const callbacks = {
        load: function() {
          callbacks.cleanup();
          resolve();
        },
        error: function() {
          callbacks.cleanup();
          reject();
        },
        cleanup: function() {
          link.removeEventListener('load', callbacks.load);
          link.removeEventListener('error', callbacks.error);
        }
      };
      link.addEventListener('load', callbacks.load);
      link.addEventListener('error', callbacks.error);
      document.head.appendChild(link);
    });
  }
  /**
   * Closes the search bar.
   */
  close() {
    ipc.send('search-bar-close');
  }
  /**
   * Sends the `search-bar-query` event to the main script
   * so the window search handler can perform search operation.
   */
  query() {
    const bar = this.bar;
    const value = bar.value;
    bar.hasValue = !!value;
    ipc.send('search-bar-query', value);
  }
  /**
   * Sends the `search-bar-query-next` event to the main script
   * so the window search handler can mark next search result.
   */
  highlightNext() {
    ipc.send('search-bar-query-next');
  }
  /**
   * Sends the `search-bar-query-previous` event to the main script
   * so the window search handler can mark previous search result.
   */
  highlightPrevious() {
    ipc.send('search-bar-query-previous');
  }
  /**
   * Handler for the `search-count` event from the main page.
   * Sets `searchCount` and `selected` properties on the search bar
   * template instance.
   *
   * @param {Event} event Event instance.
   * @param {Number} count Search results count
   * @param {Number} selected Currently selected instance.
   */
  _searchCoundHandler(event, count, selected) {
    const bar = this.bar;
    bar.searchCount = count;
    bar.selected = selected;
  }
  /**
   * Focuses on the text input.
   */
  _focusHandler() {
    const i = document.querySelector('paper-input');
    if (!i) {
      return;
    }
    i.inputElement.focus();
  }
}
const url = new URL(location.href);
const initScript = new SearchBarInit(url.searchParams.get('sf'), url.searchParams.get('tf'));
initScript.initBar();
initScript.loadBar();
initScript.listen();
