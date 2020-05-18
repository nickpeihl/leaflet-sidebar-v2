// @ts-nocheck
/**
 * @name Sidebar
 * @class L.Control.Sidebar
 * @extends L.Control
 * @param {string} id - The id of the sidebar element (without the # character)
 * @param {Object} [options] - Optional options object
 * @param {string} [options.autopan=false] - whether to move the map when opening the sidebar to make maintain the visible center point
 * @param {string} [options.position=left] - Position of the sidebar: 'left' or 'right'
 * @param {string} [options.id] - ID of a predefined sidebar container that should be used
 * @param {boolean} [data.close=true] Whether to add a close button to the pane header
 * @see L.control.sidebar
 */
L.Control.Sidebar = L.Control.extend(/** @lends L.Control.Sidebar.prototype */ {
    includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,

    options: {
        autopan: false,
        closeButton: true,
        container: null,
        position: 'left'
    },

    /**
     * Create a new sidebar on this object.
     *
     * @constructor
     * @param {Object} [options] - Optional options object
     * @param {string} [options.autopan=false] - whether to move the map when opening the sidebar to make maintain the visible center point
     * @param {string} [options.position=left] - Position of the sidebar: 'left' or 'right'
     * @param {string} [options.container] - ID of a predefined sidebar container that should be used
     * @param {bool} [data.close=true] Whether to add a close button to the pane header
     */
    initialize: function(options, deprecatedOptions) {
        if (typeof options === 'string') {
            console.warn('this syntax is deprecated. please use L.control.sidebar({ container }) now');
            options = { container: options };
        }

        if (typeof options === 'object' && options.id) {
            console.warn('this syntax is deprecated. please use L.control.sidebar({ container }) now');
            options.container = options.id;
        }

        this._tabitems = [];
        this._panes = [];
        this._closeButtons = [];

        L.setOptions(this, options);
        L.setOptions(this, deprecatedOptions);
        return this;
    },

    /**
     * Add this sidebar to the specified map.
     *
     * @param {L.Map} map
     * @returns {Sidebar}
     */
    onAdd: function(map) {
        var i, child, tabContainers, newContainer, container;

        // use container from previous onAdd()
        container = this._container

        // use the container given via options.
        if (!container) {
            container = this._container || typeof this.options.container === 'string'
            ? L.DomUtil.get(this.options.container)
            : this.options.container;
        }

        // if no container was specified or not found, create it and apply an ID
        if (!container) {
            container = L.DomUtil.create('div', 'leaflet-sidebar collapsed');
            if (typeof this.options.container === 'string')
                container.id = this.options.container;
        }

        // Find paneContainer in DOM & store reference
        this._paneContainer = container.querySelector('div.leaflet-sidebar-content');

        // If none is found, create it
        if (this._paneContainer === null)
            this._paneContainer = L.DomUtil.create('div', 'leaflet-sidebar-content', container);

        // Find tabContainerTop & tabContainerBottom in DOM & store reference
        tabContainers = container.querySelectorAll('ul.leaflet-sidebar-tabs, div.leaflet-sidebar-tabs > ul');
        this._tabContainerTop    = tabContainers[0] || null;
        this._tabContainerBottom = tabContainers[1] || null;

        // If no container was found, create it
        if (this._tabContainerTop === null) {
            newContainer = L.DomUtil.create('div', 'leaflet-sidebar-tabs', container);
            newContainer.setAttribute('role', 'tablist');
            this._tabContainerTop = L.DomUtil.create('ul', '', newContainer);
        }
        if (this._tabContainerBottom === null) {
            newContainer = this._tabContainerTop.parentNode;
            this._tabContainerBottom = L.DomUtil.create('ul', '', newContainer);
        }

        // Store Tabs in Collection for easier iteration
        for (i = 0; i < this._tabContainerTop.children.length; i++) {
            child = this._tabContainerTop.children[i];
            child._sidebar = this;
            child._id = child.querySelector('a').hash.slice(1); // FIXME: this could break for links!
            this._tabitems.push(child);
        }
        for (i = 0; i < this._tabContainerBottom.children.length; i++) {
            child = this._tabContainerBottom.children[i];
            child._sidebar = this;
            child._id = child.querySelector('a').hash.slice(1); // FIXME: this could break for links!
            this._tabitems.push(child);
        }

        // Store Panes in Collection for easier iteration
        for (i = 0; i < this._paneContainer.children.length; i++) {
            child = this._paneContainer.children[i];
            if (child.tagName === 'DIV' &&
                L.DomUtil.hasClass(child, 'leaflet-sidebar-pane')) {
                this._panes.push(child);

                // Save references to close buttons
                var closeButtons = child.querySelectorAll('.leaflet-sidebar-close');
                if (closeButtons.length) {
                    this._closeButtons.push(closeButtons[closeButtons.length - 1]);
                    this._closeClick(closeButtons[closeButtons.length - 1], 'on');
                }
            }
        }

        // set click listeners for tab & close buttons
        for (i = 0; i < this._tabitems.length; i++) {
            this._tabClick(this._tabitems[i], 'on');
        }

        // leaflet moves the returned container to the right place in the DOM
        return container;
    },

    /**
     * Remove this sidebar from the map.
     *
     * @param {L.Map} map
     * @returns {Sidebar}
     */
    onRemove: function (map) {
        // Remove click listeners for tab & close buttons
        for (var i = 0; i < this._tabitems.length; i++)
            this._tabClick(this._tabitems[i], 'off');
        for (var i = 0; i < this._closeButtons.length; i++)
            this._closeClick(this._closeButtons[i], 'off');

        this._tabitems = [];
        this._panes = [];
        this._closeButtons = [];

        return this;
    },

    /**
     * @method addTo(map: Map): this
     * Adds the control to the given map. Overrides the implementation of L.Control,
     * changing the DOM mount target from map._controlContainer.topleft to map._container
     */
    addTo: function (map) {
        this.onRemove();
        this._map = map;

        this._container = this.onAdd(map);

        L.DomUtil.addClass(this._container, 'leaflet-control');
        L.DomUtil.addClass(this._container, 'leaflet-sidebar-' + this.getPosition());
        if (L.Browser.touch)
            L.DomUtil.addClass(this._container, 'leaflet-touch');

        // when adding to the map container, we should stop event propagation
        L.DomEvent.disableScrollPropagation(this._container);
        L.DomEvent.disableClickPropagation(this._container);
        L.DomEvent.on(this._container, 'contextmenu', L.DomEvent.stopPropagation);

        // insert as first child of map container (important for css)
        map._container.insertBefore(this._container, map._container.firstChild);

        return this;
    },

    /**
     * @deprecated - Please use remove() instead of removeFrom(), as of Leaflet 0.8-dev, the removeFrom() has been replaced with remove()
     * Removes this sidebar from the map.
     * @param {L.Map} map
     * @returns {Sidebar}
     */
    removeFrom: function(map) {
        console.warn('removeFrom() has been deprecated, please use remove() instead as support for this function will be ending soon.');
        this._map._container.removeChild(this._container);
        this.onRemove(map);

        return this;
    },

   /**
     * Open sidebar (if it's closed) and show the specified tab.
     *
     * @param {string} id - The ID of the tab to show (without the # character)
     * @returns {L.Control.Sidebar}
     */
    open: function(id) {
        var i, child, tab;

        // If panel is disabled, stop right here
        tab = this._getTab(id);
        if (L.DomUtil.hasClass(tab, 'disabled'))
            return this;

        // Hide old active contents and show new content
        for (i = 0; i < this._panes.length; i++) {
            child = this._panes[i];
            if (child.id === id)
                L.DomUtil.addClass(child, 'active');
            else if (L.DomUtil.hasClass(child, 'active'))
                L.DomUtil.removeClass(child, 'active');
        }

        // Remove old active highlights and set new highlight
        for (i = 0; i < this._tabitems.length; i++) {
            child = this._tabitems[i];
            if (child.querySelector('a').hash === '#' + id)
                L.DomUtil.addClass(child, 'active');
            else if (L.DomUtil.hasClass(child, 'active'))
                L.DomUtil.removeClass(child, 'active');
        }

        this.fire('content', { id: id });

        // Open sidebar if it's closed
        if (L.DomUtil.hasClass(this._container, 'collapsed')) {
            this.fire('opening');
            L.DomUtil.removeClass(this._container, 'collapsed');
            if (this.options.autopan) this._panMap('open');
        }

        return this;
    },

    /**
     * Close the sidebar (if it's open).
     *
     * @returns {L.Control.Sidebar}
     */
    close: function() {
        var i;

        // Remove old active highlights
        for (i = 0; i < this._tabitems.length; i++) {
            var child = this._tabitems[i];
            if (L.DomUtil.hasClass(child, 'active'))
                L.DomUtil.removeClass(child, 'active');
        }

        // close sidebar, if it's opened
        if (!L.DomUtil.hasClass(this._container, 'collapsed')) {
            this.fire('closing');
            L.DomUtil.addClass(this._container, 'collapsed');
            if (this.options.autopan) this._panMap('close');
        }

        return this;
    },

    /**
     * Add a panel to the sidebar
     *
     * @example
     * sidebar.addPanel({
     *     id: 'userinfo',
     *     tab: '<i class="fa fa-gear"></i>',
     *     pane: someDomNode.innerHTML,
     *     position: 'bottom'
     * });
     *
     * @param {Object} [data] contains the data for the new Panel:
     * @param {String} [data.id] the ID for the new Panel, must be unique for the whole page
     * @param {String} [data.position='top'] where the tab will appear:
     *                                       on the top or the bottom of the sidebar. 'top' or 'bottom'
     * @param {HTMLString} {DOMnode} [data.tab]  content of the tab item, as HTMLstring or DOM node
     * @param {HTMLString} {DOMnode} [data.pane] content of the panel, as HTMLstring or DOM node
     * @param {String} [data.link] URL to an (external) link that will be opened instead of a panel
     * @param {String} [data.title] Title for the pane header
     * @param {String} {Function} [data.button] URL to an (external) link or a click listener function that will be opened instead of a panel
     * @param {bool} [data.disabled] If the tab should be disabled by default
     *
     * @returns {L.Control.Sidebar}
     */
    addPanel: function(data) {
        var pane, tab, tabHref, closeButtons, content;

        // Create tab node
        tab = L.DomUtil.create('li', data.disabled ? 'disabled' : '');
        tabHref = L.DomUtil.create('a', '', tab);
        tabHref.href = '#' + data.id;
        tabHref.setAttribute('role', 'tab');
        tabHref.innerHTML = data.tab;
        tab._sidebar = this;
        tab._id = data.id;
        tab._button = data.button; // to allow links to be disabled, the href cannot be used
        if (data.title && data.title[0] !== '<') tab.title = data.title;

        // append it to the DOM and store JS references
        if (data.position === 'bottom')
            this._tabContainerBottom.appendChild(tab);
        else
            this._tabContainerTop.appendChild(tab);

        this._tabitems.push(tab);

        // Create pane node
        if (data.pane) {
            if (typeof data.pane === 'string') {
                // pane is given as HTML string
                pane = L.DomUtil.create('DIV', 'leaflet-sidebar-pane', this._paneContainer);
                content = '';
                if (data.title)
                    content += '<h1 class="leaflet-sidebar-header">' + data.title;
                if (this.options.closeButton)
                    content += '<span class="leaflet-sidebar-close"><i class="fa fa-caret-' + this.options.position + '"></i></span>';
                if (data.title)
                    content += '</h1>';
                pane.innerHTML = content + data.pane;
            } else {
                // pane is given as DOM object
                pane = data.pane;
                this._paneContainer.appendChild(pane);
            }
            pane.id = data.id;

            this._panes.push(pane);

            // Save references to close button & register click listener
            closeButtons = pane.querySelectorAll('.leaflet-sidebar-close');
            if (closeButtons.length) {
                // select last button, because thats rendered on top
                this._closeButtons.push(closeButtons[closeButtons.length - 1]);
                this._closeClick(closeButtons[closeButtons.length - 1], 'on');
            }
        }

        // Register click listeners, if the sidebar is on the map
        this._tabClick(tab, 'on');

        return this;
    },

    /**
     * Removes a panel from the sidebar
     *
     * @example
     * sidebar.remove('userinfo');
     *
     * @param {String} [id] the ID of the panel that is to be removed
     * @returns {L.Control.Sidebar}
     */
    removePanel: function(id) {
        var i, j, tab, pane, closeButtons;

        // find the tab & panel by ID, remove them, and clean up
        for (i = 0; i < this._tabitems.length; i++) {
            if (this._tabitems[i]._id === id) {
                tab = this._tabitems[i];

                // Remove click listeners
                this._tabClick(tab, 'off');

                tab.remove();
                this._tabitems.splice(i, 1);
                break;
            }
        }

        for (i = 0; i < this._panes.length; i++) {
            if (this._panes[i].id === id) {
                pane = this._panes[i];
                closeButtons = pane.querySelectorAll('.leaflet-sidebar-close');
                for (j = 0; j < closeButtons.length; j++) {
                    this._closeClick(closeButtons[j], 'off');
                }

                pane.remove();
                this._panes.splice(i, 1);

                break;
            }
        }

        return this;
    },

    /**
     * enables a disabled tab/panel
     *
     * @param {String} [id] ID of the panel to enable
     * @returns {L.Control.Sidebar}
     */
    enablePanel: function(id) {
        var tab = this._getTab(id);
        L.DomUtil.removeClass(tab, 'disabled');

        return this;
    },

    /**
     * disables an enabled tab/panel
     *
     * @param {String} [id] ID of the panel to disable
     * @returns {L.Control.Sidebar}
     */
    disablePanel: function(id) {
        var tab = this._getTab(id);
        L.DomUtil.addClass(tab, 'disabled');

        return this;
    },

    onTabClick: function(e) {
        // `this` points to the tab DOM element!
        if (L.DomUtil.hasClass(this, 'active')) {
            this._sidebar.close();
        } else if (!L.DomUtil.hasClass(this, 'disabled')) {
            if (typeof this._button === 'string') // an url
                window.location.href = this._button;
            else if (typeof this._button === 'function') // a clickhandler
                this._button(e);
            else // a normal pane
                this._sidebar.open(this.querySelector('a').hash.slice(1));
        }
    },

    /**
     * (un)registers the onclick event for the given tab,
     * depending on the second argument.
     * @private
     *
     * @param {DOMelement} [tab]
     * @param {String} [on] 'on' or 'off'
     */
    _tabClick: function(tab, on) {
        var link = tab.querySelector('a');
        if (!link.hasAttribute('href') || link.getAttribute('href')[0] !== '#')
            return;

        if (on === 'on') {
            L.DomEvent
                .on(tab.querySelector('a'), 'click', L.DomEvent.preventDefault, tab)
                .on(tab.querySelector('a'), 'click', this.onTabClick, tab);
        } else {
            L.DomEvent.off(tab.querySelector('a'), 'click', this.onTabClick, tab);
        }
    },

    onCloseClick: function() {
        this.close();
    },

    /**
     * (un)registers the onclick event for the given close button
     * depending on the second argument
     * @private
     *
     * @param {DOMelement} [closeButton]
     * @param {String} [on] 'on' or 'off'
     */
    _closeClick: function(closeButton, on) {
        if (on === 'on') {
            L.DomEvent.on(closeButton, 'click', this.onCloseClick, this);
        } else {
            L.DomEvent.off(closeButton, 'click', this.onCloseClick);
        }
    },

    /**
     * Finds & returns the DOMelement of a tab
     *
     * @param {String} [id] the id of the tab
     * @returns {DOMelement} the tab specified by id, null if not found
     */
    _getTab: function(id) {
        for (var i = 0; i < this._tabitems.length; i++) {
            if (this._tabitems[i]._id === id)
                return this._tabitems[i];
        }

        throw Error('tab "' + id + '" not found');
    },

    /**
     * Helper for autopan: Pans the map for open/close events
     *
     * @param {String} [openClose] The behaviour to enact ('open' | 'close')
     */
   _panMap: function(openClose) {
        var panWidth = Number.parseInt(L.DomUtil.getStyle(this._container, 'max-width')) / 2;
        if (
            openClose === 'open' && this.options.position === 'left' ||
            openClose === 'close' && this.options.position === 'right'
        ) panWidth *= -1;
        this._map.panBy([panWidth, 0], { duration: 0.5 });
   }
});

/**
 * Create a new sidebar.
 *
 * @example
 * var sidebar = L.control.sidebar({ container: 'sidebar' }).addTo(map);
 *
 * @param {Object} [options] - Optional options object
 * @param {string} [options.autopan=false] - whether to move the map when opening the sidebar to make maintain the visible center point
 * @param {string} [options.position=left] - Position of the sidebar: 'left' or 'right'
 * @param {string} [options.container] - ID of a predefined sidebar container that should be used
 * @param {boolean} [data.close=true] Whether to add a close button to the pane header
 * @returns {Sidebar} A new sidebar instance
 */
L.control.sidebar = function(options, deprecated) {
    return new L.Control.Sidebar(options, deprecated);
};
