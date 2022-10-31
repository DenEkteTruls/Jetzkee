
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.52.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    function construct_svelte_component_dev(component, props) {
        const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
        try {
            const instance = new component(props);
            if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
                throw new Error(error_message);
            }
            return instance;
        }
        catch (err) {
            const { message } = err;
            if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
                throw new Error(error_message);
            }
            else {
                throw err;
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var page = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
    	module.exports = factory() ;
    }(commonjsGlobal, (function () {
    var isarray = Array.isArray || function (arr) {
      return Object.prototype.toString.call(arr) == '[object Array]';
    };

    /**
     * Expose `pathToRegexp`.
     */
    var pathToRegexp_1 = pathToRegexp;
    var parse_1 = parse;
    var compile_1 = compile;
    var tokensToFunction_1 = tokensToFunction;
    var tokensToRegExp_1 = tokensToRegExp;

    /**
     * The main path matching regexp utility.
     *
     * @type {RegExp}
     */
    var PATH_REGEXP = new RegExp([
      // Match escaped characters that would otherwise appear in future matches.
      // This allows the user to escape special characters that won't transform.
      '(\\\\.)',
      // Match Express-style parameters and un-named parameters with a prefix
      // and optional suffixes. Matches appear as:
      //
      // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
      // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
      // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
      '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))'
    ].join('|'), 'g');

    /**
     * Parse a string for the raw tokens.
     *
     * @param  {String} str
     * @return {Array}
     */
    function parse (str) {
      var tokens = [];
      var key = 0;
      var index = 0;
      var path = '';
      var res;

      while ((res = PATH_REGEXP.exec(str)) != null) {
        var m = res[0];
        var escaped = res[1];
        var offset = res.index;
        path += str.slice(index, offset);
        index = offset + m.length;

        // Ignore already escaped sequences.
        if (escaped) {
          path += escaped[1];
          continue
        }

        // Push the current path onto the tokens.
        if (path) {
          tokens.push(path);
          path = '';
        }

        var prefix = res[2];
        var name = res[3];
        var capture = res[4];
        var group = res[5];
        var suffix = res[6];
        var asterisk = res[7];

        var repeat = suffix === '+' || suffix === '*';
        var optional = suffix === '?' || suffix === '*';
        var delimiter = prefix || '/';
        var pattern = capture || group || (asterisk ? '.*' : '[^' + delimiter + ']+?');

        tokens.push({
          name: name || key++,
          prefix: prefix || '',
          delimiter: delimiter,
          optional: optional,
          repeat: repeat,
          pattern: escapeGroup(pattern)
        });
      }

      // Match any characters still remaining.
      if (index < str.length) {
        path += str.substr(index);
      }

      // If the path exists, push it onto the end.
      if (path) {
        tokens.push(path);
      }

      return tokens
    }

    /**
     * Compile a string to a template function for the path.
     *
     * @param  {String}   str
     * @return {Function}
     */
    function compile (str) {
      return tokensToFunction(parse(str))
    }

    /**
     * Expose a method for transforming tokens into the path function.
     */
    function tokensToFunction (tokens) {
      // Compile all the tokens into regexps.
      var matches = new Array(tokens.length);

      // Compile all the patterns before compilation.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] === 'object') {
          matches[i] = new RegExp('^' + tokens[i].pattern + '$');
        }
      }

      return function (obj) {
        var path = '';
        var data = obj || {};

        for (var i = 0; i < tokens.length; i++) {
          var token = tokens[i];

          if (typeof token === 'string') {
            path += token;

            continue
          }

          var value = data[token.name];
          var segment;

          if (value == null) {
            if (token.optional) {
              continue
            } else {
              throw new TypeError('Expected "' + token.name + '" to be defined')
            }
          }

          if (isarray(value)) {
            if (!token.repeat) {
              throw new TypeError('Expected "' + token.name + '" to not repeat, but received "' + value + '"')
            }

            if (value.length === 0) {
              if (token.optional) {
                continue
              } else {
                throw new TypeError('Expected "' + token.name + '" to not be empty')
              }
            }

            for (var j = 0; j < value.length; j++) {
              segment = encodeURIComponent(value[j]);

              if (!matches[i].test(segment)) {
                throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
              }

              path += (j === 0 ? token.prefix : token.delimiter) + segment;
            }

            continue
          }

          segment = encodeURIComponent(value);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
          }

          path += token.prefix + segment;
        }

        return path
      }
    }

    /**
     * Escape a regular expression string.
     *
     * @param  {String} str
     * @return {String}
     */
    function escapeString (str) {
      return str.replace(/([.+*?=^!:${}()[\]|\/])/g, '\\$1')
    }

    /**
     * Escape the capturing group by escaping special characters and meaning.
     *
     * @param  {String} group
     * @return {String}
     */
    function escapeGroup (group) {
      return group.replace(/([=!:$\/()])/g, '\\$1')
    }

    /**
     * Attach the keys as a property of the regexp.
     *
     * @param  {RegExp} re
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function attachKeys (re, keys) {
      re.keys = keys;
      return re
    }

    /**
     * Get the flags for a regexp from the options.
     *
     * @param  {Object} options
     * @return {String}
     */
    function flags (options) {
      return options.sensitive ? '' : 'i'
    }

    /**
     * Pull out keys from a regexp.
     *
     * @param  {RegExp} path
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function regexpToRegexp (path, keys) {
      // Use a negative lookahead to match only capturing groups.
      var groups = path.source.match(/\((?!\?)/g);

      if (groups) {
        for (var i = 0; i < groups.length; i++) {
          keys.push({
            name: i,
            prefix: null,
            delimiter: null,
            optional: false,
            repeat: false,
            pattern: null
          });
        }
      }

      return attachKeys(path, keys)
    }

    /**
     * Transform an array into a regexp.
     *
     * @param  {Array}  path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function arrayToRegexp (path, keys, options) {
      var parts = [];

      for (var i = 0; i < path.length; i++) {
        parts.push(pathToRegexp(path[i], keys, options).source);
      }

      var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

      return attachKeys(regexp, keys)
    }

    /**
     * Create a path regexp from string input.
     *
     * @param  {String} path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function stringToRegexp (path, keys, options) {
      var tokens = parse(path);
      var re = tokensToRegExp(tokens, options);

      // Attach keys back to the regexp.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] !== 'string') {
          keys.push(tokens[i]);
        }
      }

      return attachKeys(re, keys)
    }

    /**
     * Expose a function for taking tokens and returning a RegExp.
     *
     * @param  {Array}  tokens
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function tokensToRegExp (tokens, options) {
      options = options || {};

      var strict = options.strict;
      var end = options.end !== false;
      var route = '';
      var lastToken = tokens[tokens.length - 1];
      var endsWithSlash = typeof lastToken === 'string' && /\/$/.test(lastToken);

      // Iterate over the tokens and create our regexp string.
      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        if (typeof token === 'string') {
          route += escapeString(token);
        } else {
          var prefix = escapeString(token.prefix);
          var capture = token.pattern;

          if (token.repeat) {
            capture += '(?:' + prefix + capture + ')*';
          }

          if (token.optional) {
            if (prefix) {
              capture = '(?:' + prefix + '(' + capture + '))?';
            } else {
              capture = '(' + capture + ')?';
            }
          } else {
            capture = prefix + '(' + capture + ')';
          }

          route += capture;
        }
      }

      // In non-strict mode we allow a slash at the end of match. If the path to
      // match already ends with a slash, we remove it for consistency. The slash
      // is valid at the end of a path match, not in the middle. This is important
      // in non-ending mode, where "/test/" shouldn't match "/test//route".
      if (!strict) {
        route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?';
      }

      if (end) {
        route += '$';
      } else {
        // In non-ending mode, we need the capturing groups to match as much as
        // possible by using a positive lookahead to the end or next path segment.
        route += strict && endsWithSlash ? '' : '(?=\\/|$)';
      }

      return new RegExp('^' + route, flags(options))
    }

    /**
     * Normalize the given path string, returning a regular expression.
     *
     * An empty array can be passed in for the keys, which will hold the
     * placeholder key descriptions. For example, using `/user/:id`, `keys` will
     * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
     *
     * @param  {(String|RegExp|Array)} path
     * @param  {Array}                 [keys]
     * @param  {Object}                [options]
     * @return {RegExp}
     */
    function pathToRegexp (path, keys, options) {
      keys = keys || [];

      if (!isarray(keys)) {
        options = keys;
        keys = [];
      } else if (!options) {
        options = {};
      }

      if (path instanceof RegExp) {
        return regexpToRegexp(path, keys)
      }

      if (isarray(path)) {
        return arrayToRegexp(path, keys, options)
      }

      return stringToRegexp(path, keys, options)
    }

    pathToRegexp_1.parse = parse_1;
    pathToRegexp_1.compile = compile_1;
    pathToRegexp_1.tokensToFunction = tokensToFunction_1;
    pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

    /**
       * Module dependencies.
       */

      

      /**
       * Short-cuts for global-object checks
       */

      var hasDocument = ('undefined' !== typeof document);
      var hasWindow = ('undefined' !== typeof window);
      var hasHistory = ('undefined' !== typeof history);
      var hasProcess = typeof process !== 'undefined';

      /**
       * Detect click event
       */
      var clickEvent = hasDocument && document.ontouchstart ? 'touchstart' : 'click';

      /**
       * To work properly with the URL
       * history.location generated polyfill in https://github.com/devote/HTML5-History-API
       */

      var isLocation = hasWindow && !!(window.history.location || window.location);

      /**
       * The page instance
       * @api private
       */
      function Page() {
        // public things
        this.callbacks = [];
        this.exits = [];
        this.current = '';
        this.len = 0;

        // private things
        this._decodeURLComponents = true;
        this._base = '';
        this._strict = false;
        this._running = false;
        this._hashbang = false;

        // bound functions
        this.clickHandler = this.clickHandler.bind(this);
        this._onpopstate = this._onpopstate.bind(this);
      }

      /**
       * Configure the instance of page. This can be called multiple times.
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.configure = function(options) {
        var opts = options || {};

        this._window = opts.window || (hasWindow && window);
        this._decodeURLComponents = opts.decodeURLComponents !== false;
        this._popstate = opts.popstate !== false && hasWindow;
        this._click = opts.click !== false && hasDocument;
        this._hashbang = !!opts.hashbang;

        var _window = this._window;
        if(this._popstate) {
          _window.addEventListener('popstate', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('popstate', this._onpopstate, false);
        }

        if (this._click) {
          _window.document.addEventListener(clickEvent, this.clickHandler, false);
        } else if(hasDocument) {
          _window.document.removeEventListener(clickEvent, this.clickHandler, false);
        }

        if(this._hashbang && hasWindow && !hasHistory) {
          _window.addEventListener('hashchange', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('hashchange', this._onpopstate, false);
        }
      };

      /**
       * Get or set basepath to `path`.
       *
       * @param {string} path
       * @api public
       */

      Page.prototype.base = function(path) {
        if (0 === arguments.length) return this._base;
        this._base = path;
      };

      /**
       * Gets the `base`, which depends on whether we are using History or
       * hashbang routing.

       * @api private
       */
      Page.prototype._getBase = function() {
        var base = this._base;
        if(!!base) return base;
        var loc = hasWindow && this._window && this._window.location;

        if(hasWindow && this._hashbang && loc && loc.protocol === 'file:') {
          base = loc.pathname;
        }

        return base;
      };

      /**
       * Get or set strict path matching to `enable`
       *
       * @param {boolean} enable
       * @api public
       */

      Page.prototype.strict = function(enable) {
        if (0 === arguments.length) return this._strict;
        this._strict = enable;
      };


      /**
       * Bind with the given `options`.
       *
       * Options:
       *
       *    - `click` bind to click events [true]
       *    - `popstate` bind to popstate [true]
       *    - `dispatch` perform initial dispatch [true]
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.start = function(options) {
        var opts = options || {};
        this.configure(opts);

        if (false === opts.dispatch) return;
        this._running = true;

        var url;
        if(isLocation) {
          var window = this._window;
          var loc = window.location;

          if(this._hashbang && ~loc.hash.indexOf('#!')) {
            url = loc.hash.substr(2) + loc.search;
          } else if (this._hashbang) {
            url = loc.search + loc.hash;
          } else {
            url = loc.pathname + loc.search + loc.hash;
          }
        }

        this.replace(url, null, true, opts.dispatch);
      };

      /**
       * Unbind click and popstate event handlers.
       *
       * @api public
       */

      Page.prototype.stop = function() {
        if (!this._running) return;
        this.current = '';
        this.len = 0;
        this._running = false;

        var window = this._window;
        this._click && window.document.removeEventListener(clickEvent, this.clickHandler, false);
        hasWindow && window.removeEventListener('popstate', this._onpopstate, false);
        hasWindow && window.removeEventListener('hashchange', this._onpopstate, false);
      };

      /**
       * Show `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} dispatch
       * @param {boolean=} push
       * @return {!Context}
       * @api public
       */

      Page.prototype.show = function(path, state, dispatch, push) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        if (false !== dispatch) this.dispatch(ctx, prev);
        if (false !== ctx.handled && false !== push) ctx.pushState();
        return ctx;
      };

      /**
       * Goes back in the history
       * Back should always let the current route push state and then go back.
       *
       * @param {string} path - fallback path to go back if no more history exists, if undefined defaults to page.base
       * @param {Object=} state
       * @api public
       */

      Page.prototype.back = function(path, state) {
        var page = this;
        if (this.len > 0) {
          var window = this._window;
          // this may need more testing to see if all browsers
          // wait for the next tick to go back in history
          hasHistory && window.history.back();
          this.len--;
        } else if (path) {
          setTimeout(function() {
            page.show(path, state);
          });
        } else {
          setTimeout(function() {
            page.show(page._getBase(), state);
          });
        }
      };

      /**
       * Register route to redirect from one path to other
       * or just redirect to another route
       *
       * @param {string} from - if param 'to' is undefined redirects to 'from'
       * @param {string=} to
       * @api public
       */
      Page.prototype.redirect = function(from, to) {
        var inst = this;

        // Define route from a path to another
        if ('string' === typeof from && 'string' === typeof to) {
          page.call(this, from, function(e) {
            setTimeout(function() {
              inst.replace(/** @type {!string} */ (to));
            }, 0);
          });
        }

        // Wait for the push state and replace it with another
        if ('string' === typeof from && 'undefined' === typeof to) {
          setTimeout(function() {
            inst.replace(from);
          }, 0);
        }
      };

      /**
       * Replace `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} init
       * @param {boolean=} dispatch
       * @return {!Context}
       * @api public
       */


      Page.prototype.replace = function(path, state, init, dispatch) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        ctx.init = init;
        ctx.save(); // save before dispatching, which may redirect
        if (false !== dispatch) this.dispatch(ctx, prev);
        return ctx;
      };

      /**
       * Dispatch the given `ctx`.
       *
       * @param {Context} ctx
       * @api private
       */

      Page.prototype.dispatch = function(ctx, prev) {
        var i = 0, j = 0, page = this;

        function nextExit() {
          var fn = page.exits[j++];
          if (!fn) return nextEnter();
          fn(prev, nextExit);
        }

        function nextEnter() {
          var fn = page.callbacks[i++];

          if (ctx.path !== page.current) {
            ctx.handled = false;
            return;
          }
          if (!fn) return unhandled.call(page, ctx);
          fn(ctx, nextEnter);
        }

        if (prev) {
          nextExit();
        } else {
          nextEnter();
        }
      };

      /**
       * Register an exit route on `path` with
       * callback `fn()`, which will be called
       * on the previous context when a new
       * page is visited.
       */
      Page.prototype.exit = function(path, fn) {
        if (typeof path === 'function') {
          return this.exit('*', path);
        }

        var route = new Route(path, null, this);
        for (var i = 1; i < arguments.length; ++i) {
          this.exits.push(route.middleware(arguments[i]));
        }
      };

      /**
       * Handle "click" events.
       */

      /* jshint +W054 */
      Page.prototype.clickHandler = function(e) {
        if (1 !== this._which(e)) return;

        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        if (e.defaultPrevented) return;

        // ensure link
        // use shadow dom when available if not, fall back to composedPath()
        // for browsers that only have shady
        var el = e.target;
        var eventPath = e.path || (e.composedPath ? e.composedPath() : null);

        if(eventPath) {
          for (var i = 0; i < eventPath.length; i++) {
            if (!eventPath[i].nodeName) continue;
            if (eventPath[i].nodeName.toUpperCase() !== 'A') continue;
            if (!eventPath[i].href) continue;

            el = eventPath[i];
            break;
          }
        }

        // continue ensure link
        // el.nodeName for svg links are 'a' instead of 'A'
        while (el && 'A' !== el.nodeName.toUpperCase()) el = el.parentNode;
        if (!el || 'A' !== el.nodeName.toUpperCase()) return;

        // check if link is inside an svg
        // in this case, both href and target are always inside an object
        var svg = (typeof el.href === 'object') && el.href.constructor.name === 'SVGAnimatedString';

        // Ignore if tag has
        // 1. "download" attribute
        // 2. rel="external" attribute
        if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

        // ensure non-hash for the same path
        var link = el.getAttribute('href');
        if(!this._hashbang && this._samePath(el) && (el.hash || '#' === link)) return;

        // Check for mailto: in the href
        if (link && link.indexOf('mailto:') > -1) return;

        // check target
        // svg target is an object and its desired value is in .baseVal property
        if (svg ? el.target.baseVal : el.target) return;

        // x-origin
        // note: svg links that are not relative don't call click events (and skip page.js)
        // consequently, all svg links tested inside page.js are relative and in the same origin
        if (!svg && !this.sameOrigin(el.href)) return;

        // rebuild path
        // There aren't .pathname and .search properties in svg links, so we use href
        // Also, svg href is an object and its desired value is in .baseVal property
        var path = svg ? el.href.baseVal : (el.pathname + el.search + (el.hash || ''));

        path = path[0] !== '/' ? '/' + path : path;

        // strip leading "/[drive letter]:" on NW.js on Windows
        if (hasProcess && path.match(/^\/[a-zA-Z]:\//)) {
          path = path.replace(/^\/[a-zA-Z]:\//, '/');
        }

        // same page
        var orig = path;
        var pageBase = this._getBase();

        if (path.indexOf(pageBase) === 0) {
          path = path.substr(pageBase.length);
        }

        if (this._hashbang) path = path.replace('#!', '');

        if (pageBase && orig === path && (!isLocation || this._window.location.protocol !== 'file:')) {
          return;
        }

        e.preventDefault();
        this.show(orig);
      };

      /**
       * Handle "populate" events.
       * @api private
       */

      Page.prototype._onpopstate = (function () {
        var loaded = false;
        if ( ! hasWindow ) {
          return function () {};
        }
        if (hasDocument && document.readyState === 'complete') {
          loaded = true;
        } else {
          window.addEventListener('load', function() {
            setTimeout(function() {
              loaded = true;
            }, 0);
          });
        }
        return function onpopstate(e) {
          if (!loaded) return;
          var page = this;
          if (e.state) {
            var path = e.state.path;
            page.replace(path, e.state);
          } else if (isLocation) {
            var loc = page._window.location;
            page.show(loc.pathname + loc.search + loc.hash, undefined, undefined, false);
          }
        };
      })();

      /**
       * Event button.
       */
      Page.prototype._which = function(e) {
        e = e || (hasWindow && this._window.event);
        return null == e.which ? e.button : e.which;
      };

      /**
       * Convert to a URL object
       * @api private
       */
      Page.prototype._toURL = function(href) {
        var window = this._window;
        if(typeof URL === 'function' && isLocation) {
          return new URL(href, window.location.toString());
        } else if (hasDocument) {
          var anc = window.document.createElement('a');
          anc.href = href;
          return anc;
        }
      };

      /**
       * Check if `href` is the same origin.
       * @param {string} href
       * @api public
       */
      Page.prototype.sameOrigin = function(href) {
        if(!href || !isLocation) return false;

        var url = this._toURL(href);
        var window = this._window;

        var loc = window.location;

        /*
           When the port is the default http port 80 for http, or 443 for
           https, internet explorer 11 returns an empty string for loc.port,
           so we need to compare loc.port with an empty string if url.port
           is the default port 80 or 443.
           Also the comparition with `port` is changed from `===` to `==` because
           `port` can be a string sometimes. This only applies to ie11.
        */
        return loc.protocol === url.protocol &&
          loc.hostname === url.hostname &&
          (loc.port === url.port || loc.port === '' && (url.port == 80 || url.port == 443)); // jshint ignore:line
      };

      /**
       * @api private
       */
      Page.prototype._samePath = function(url) {
        if(!isLocation) return false;
        var window = this._window;
        var loc = window.location;
        return url.pathname === loc.pathname &&
          url.search === loc.search;
      };

      /**
       * Remove URL encoding from the given `str`.
       * Accommodates whitespace in both x-www-form-urlencoded
       * and regular percent-encoded form.
       *
       * @param {string} val - URL component to decode
       * @api private
       */
      Page.prototype._decodeURLEncodedURIComponent = function(val) {
        if (typeof val !== 'string') { return val; }
        return this._decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
      };

      /**
       * Create a new `page` instance and function
       */
      function createPage() {
        var pageInstance = new Page();

        function pageFn(/* args */) {
          return page.apply(pageInstance, arguments);
        }

        // Copy all of the things over. In 2.0 maybe we use setPrototypeOf
        pageFn.callbacks = pageInstance.callbacks;
        pageFn.exits = pageInstance.exits;
        pageFn.base = pageInstance.base.bind(pageInstance);
        pageFn.strict = pageInstance.strict.bind(pageInstance);
        pageFn.start = pageInstance.start.bind(pageInstance);
        pageFn.stop = pageInstance.stop.bind(pageInstance);
        pageFn.show = pageInstance.show.bind(pageInstance);
        pageFn.back = pageInstance.back.bind(pageInstance);
        pageFn.redirect = pageInstance.redirect.bind(pageInstance);
        pageFn.replace = pageInstance.replace.bind(pageInstance);
        pageFn.dispatch = pageInstance.dispatch.bind(pageInstance);
        pageFn.exit = pageInstance.exit.bind(pageInstance);
        pageFn.configure = pageInstance.configure.bind(pageInstance);
        pageFn.sameOrigin = pageInstance.sameOrigin.bind(pageInstance);
        pageFn.clickHandler = pageInstance.clickHandler.bind(pageInstance);

        pageFn.create = createPage;

        Object.defineProperty(pageFn, 'len', {
          get: function(){
            return pageInstance.len;
          },
          set: function(val) {
            pageInstance.len = val;
          }
        });

        Object.defineProperty(pageFn, 'current', {
          get: function(){
            return pageInstance.current;
          },
          set: function(val) {
            pageInstance.current = val;
          }
        });

        // In 2.0 these can be named exports
        pageFn.Context = Context;
        pageFn.Route = Route;

        return pageFn;
      }

      /**
       * Register `path` with callback `fn()`,
       * or route `path`, or redirection,
       * or `page.start()`.
       *
       *   page(fn);
       *   page('*', fn);
       *   page('/user/:id', load, user);
       *   page('/user/' + user.id, { some: 'thing' });
       *   page('/user/' + user.id);
       *   page('/from', '/to')
       *   page();
       *
       * @param {string|!Function|!Object} path
       * @param {Function=} fn
       * @api public
       */

      function page(path, fn) {
        // <callback>
        if ('function' === typeof path) {
          return page.call(this, '*', path);
        }

        // route <path> to <callback ...>
        if ('function' === typeof fn) {
          var route = new Route(/** @type {string} */ (path), null, this);
          for (var i = 1; i < arguments.length; ++i) {
            this.callbacks.push(route.middleware(arguments[i]));
          }
          // show <path> with [state]
        } else if ('string' === typeof path) {
          this['string' === typeof fn ? 'redirect' : 'show'](path, fn);
          // start [options]
        } else {
          this.start(path);
        }
      }

      /**
       * Unhandled `ctx`. When it's not the initial
       * popstate then redirect. If you wish to handle
       * 404s on your own use `page('*', callback)`.
       *
       * @param {Context} ctx
       * @api private
       */
      function unhandled(ctx) {
        if (ctx.handled) return;
        var current;
        var page = this;
        var window = page._window;

        if (page._hashbang) {
          current = isLocation && this._getBase() + window.location.hash.replace('#!', '');
        } else {
          current = isLocation && window.location.pathname + window.location.search;
        }

        if (current === ctx.canonicalPath) return;
        page.stop();
        ctx.handled = false;
        isLocation && (window.location.href = ctx.canonicalPath);
      }

      /**
       * Escapes RegExp characters in the given string.
       *
       * @param {string} s
       * @api private
       */
      function escapeRegExp(s) {
        return s.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
      }

      /**
       * Initialize a new "request" `Context`
       * with the given `path` and optional initial `state`.
       *
       * @constructor
       * @param {string} path
       * @param {Object=} state
       * @api public
       */

      function Context(path, state, pageInstance) {
        var _page = this.page = pageInstance || page;
        var window = _page._window;
        var hashbang = _page._hashbang;

        var pageBase = _page._getBase();
        if ('/' === path[0] && 0 !== path.indexOf(pageBase)) path = pageBase + (hashbang ? '#!' : '') + path;
        var i = path.indexOf('?');

        this.canonicalPath = path;
        var re = new RegExp('^' + escapeRegExp(pageBase));
        this.path = path.replace(re, '') || '/';
        if (hashbang) this.path = this.path.replace('#!', '') || '/';

        this.title = (hasDocument && window.document.title);
        this.state = state || {};
        this.state.path = path;
        this.querystring = ~i ? _page._decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
        this.pathname = _page._decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
        this.params = {};

        // fragment
        this.hash = '';
        if (!hashbang) {
          if (!~this.path.indexOf('#')) return;
          var parts = this.path.split('#');
          this.path = this.pathname = parts[0];
          this.hash = _page._decodeURLEncodedURIComponent(parts[1]) || '';
          this.querystring = this.querystring.split('#')[0];
        }
      }

      /**
       * Push state.
       *
       * @api private
       */

      Context.prototype.pushState = function() {
        var page = this.page;
        var window = page._window;
        var hashbang = page._hashbang;

        page.len++;
        if (hasHistory) {
            window.history.pushState(this.state, this.title,
              hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Save the context state.
       *
       * @api public
       */

      Context.prototype.save = function() {
        var page = this.page;
        if (hasHistory) {
            page._window.history.replaceState(this.state, this.title,
              page._hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Initialize `Route` with the given HTTP `path`,
       * and an array of `callbacks` and `options`.
       *
       * Options:
       *
       *   - `sensitive`    enable case-sensitive routes
       *   - `strict`       enable strict matching for trailing slashes
       *
       * @constructor
       * @param {string} path
       * @param {Object=} options
       * @api private
       */

      function Route(path, options, page) {
        var _page = this.page = page || globalPage;
        var opts = options || {};
        opts.strict = opts.strict || _page._strict;
        this.path = (path === '*') ? '(.*)' : path;
        this.method = 'GET';
        this.regexp = pathToRegexp_1(this.path, this.keys = [], opts);
      }

      /**
       * Return route middleware with
       * the given callback `fn()`.
       *
       * @param {Function} fn
       * @return {Function}
       * @api public
       */

      Route.prototype.middleware = function(fn) {
        var self = this;
        return function(ctx, next) {
          if (self.match(ctx.path, ctx.params)) {
            ctx.routePath = self.path;
            return fn(ctx, next);
          }
          next();
        };
      };

      /**
       * Check if this route matches `path`, if so
       * populate `params`.
       *
       * @param {string} path
       * @param {Object} params
       * @return {boolean}
       * @api private
       */

      Route.prototype.match = function(path, params) {
        var keys = this.keys,
          qsIndex = path.indexOf('?'),
          pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
          m = this.regexp.exec(decodeURIComponent(pathname));

        if (!m) return false;

        delete params[0];

        for (var i = 1, len = m.length; i < len; ++i) {
          var key = keys[i - 1];
          var val = this.page._decodeURLEncodedURIComponent(m[i]);
          if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
            params[key.name] = val;
          }
        }

        return true;
      };


      /**
       * Module exports.
       */

      var globalPage = createPage();
      var page_js = globalPage;
      var default_1 = globalPage;

    page_js.default = default_1;

    return page_js;

    })));
    });

    function sum$1(array) {
        let a = 0;
        for(let i = 0; i < array.length; i++) {
            a += array[i];
        }
        return a;
    }



    class Engine {
        constructor(antall) {
            this.antall = antall;
            this.num = this.antall;
            this.chosen_list = [];
            this.dizes = [];
            this.tries_left = 3;
            this.rounds = 0;

            this.points = 0;
            this.points_detail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            this.bot_points = 0;

            this.done = false;

            this.roll_dize();
        }

        roll_dize() {
            if(this.tries_left > 0) {
                this.dizes = [...Array(this.num)].map(() => {return Math.floor(Math.random()*6)+1});
                this.tries_left -= 1;
            }
        }

        reset() {
            this.tries_left = 3;
            this.num = this.antall;
            this.chosen_list = [];
        }

        new_round() {
            if(this.points_detail.indexOf(0) == -1) {
                this.done = true;
            }

            if(this.done) {
                this.dizes = [];
                this.chosen_list = [];
                if(this.points > localStorage.getItem("beste")) {
                    localStorage.setItem("beste", this.points);
                }
            }

            this.rounds++;

            this.reset();
            this.roll_dize();
        }

        new_chosen(chosen) {
            if(this.chosen_list.length >= 5) return;
            this.chosen_list = [...this.chosen_list, chosen];
            delete this.dizes[this.dizes.indexOf(chosen)];
            this.dizes = this.dizes.filter(function (a) {
                return a != null;
            });
            this.num--;
        }

        remove_chosen(chosen) {
            this.dizes = [...this.dizes, chosen];
            delete this.chosen_list[this.chosen_list.indexOf(chosen)];
            this.chosen_list = this.chosen_list.filter(function (a) {
                return a != null;
            });
            this.num++;
        }

        calculate_points(id) {
            if(typeof id == 'number') {
                let points = 0;
                for(let i = 0; i < this.dizes.length; i++) {
                    if(this.dizes[i] == id) {
                        points += id;
                    }
                }

                for(let i = 0; i < this.chosen_list.length; i++) {
                    if(this.chosen_list[i] == id) {
                        points += id;
                    }
                }
                return points;
            }

            if(typeof id == 'string') {
                let a = this.dizes.concat(this.chosen_list);
                switch (id) {
                    case 'liten': {
                        let checklist = [1, 2, 3, 4, 5];
                        for(let i = 0; i < a.length; i++) {
                            for(let x = 0; x < checklist.length; x++) {
                                if(a[i] == checklist[x]) {
                                    delete checklist[x];
                                    checklist = checklist.filter(function (a) {
                                        return a != null;
                                    });
                                }
                            }
                        }
                        if(checklist.length != 0) return 0;
                        else return 15;
                    }

                    case 'stor': {
                        let checklist = [2, 3, 4, 5, 6];
                        for(let i = 0; i < a.length; i++) {
                            for(let x = 0; x < checklist.length; x++) {
                                if(a[i] == checklist[x]) {
                                    delete checklist[x];
                                    checklist = checklist.filter(function (a) {
                                        return a != null;
                                    });
                                }
                            }
                        }
                        if(checklist.length != 0) return 0;
                        else return 20;
                    }

                    case 'hus': {
                        let counter = [0, 0, 0, 0, 0, 0];
                        for(let x = 0; x < a.length; x++) {
                            counter[a[x]-1]++;
                        }
                        if(counter.includes(2) && counter.includes(3)) {
                            return (counter.indexOf(2)+1) * 2 + (counter.indexOf(3)+1) * 3
                        } else {
                            return 0;
                        }
                    }

                    case 'sjanse': {
                        return sum$1(a);
                    }

                    case 'yatzy': {
                        return (sum$1(a) == 30) * 50;
                    }
                }
            }
        }
    }

    /* src\components\PlayerBar.svelte generated by Svelte v3.52.0 */

    const file$4 = "src\\components\\PlayerBar.svelte";

    // (16:8) {:else}
    function create_else_block_1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "media/profile1.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-1n1gggk");
    			add_location(img, file$4, 16, 12, 315);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(16:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:8) {#if bot}
    function create_if_block_2$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "media/profile2.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-1n1gggk");
    			add_location(img, file$4, 14, 12, 246);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(14:8) {#if bot}",
    		ctx
    	});

    	return block;
    }

    // (27:12) {:else}
    function create_else_block$2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "KAST";
    			attr_dev(button, "class", "not-cliackable svelte-1n1gggk");
    			add_location(button, file$4, 27, 16, 697);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(27:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (25:12) {#if engine.tries_left > 0}
    function create_if_block_1$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "KAST";
    			attr_dev(button, "id", "button");
    			attr_dev(button, "class", "svelte-1n1gggk");
    			add_location(button, file$4, 25, 16, 599);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(25:12) {#if engine.tries_left > 0}",
    		ctx
    	});

    	return block;
    }

    // (24:8) {#if bot}
    function create_if_block$2(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", "svelte-1n1gggk");
    			add_location(button, file$4, 23, 18, 523);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(24:8) {#if bot}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let p;
    	let t1;
    	let t2;
    	let div2;

    	function select_block_type(ctx, dirty) {
    		if (/*bot*/ ctx[1]) return create_if_block_2$1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*bot*/ ctx[1]) return create_if_block$2;
    		if (/*engine*/ ctx[2].tries_left > 0) return create_if_block_1$1;
    		return create_else_block$2;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			p = element("p");
    			t1 = text(/*name*/ ctx[0]);
    			t2 = space();
    			div2 = element("div");
    			if_block1.c();
    			attr_dev(div0, "class", "profile-container svelte-1n1gggk");
    			add_location(div0, file$4, 12, 4, 182);
    			attr_dev(p, "id", "username");
    			attr_dev(p, "class", "svelte-1n1gggk");
    			add_location(p, file$4, 20, 8, 428);
    			attr_dev(div1, "class", "username-container svelte-1n1gggk");
    			add_location(div1, file$4, 19, 4, 386);
    			attr_dev(div2, "class", "button-container svelte-1n1gggk");
    			add_location(div2, file$4, 22, 4, 473);
    			attr_dev(div3, "class", "container svelte-1n1gggk");
    			add_location(div3, file$4, 11, 0, 153);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			if_block0.m(div0, null);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, p);
    			append_dev(p, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			if_block1.m(div2, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			if (dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div2, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if_block0.d();
    			if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PlayerBar', slots, []);
    	let { name } = $$props;
    	let { bot } = $$props;
    	let { engine } = $$props;

    	function roll() {
    		engine.roll_dize();
    	}

    	$$self.$$.on_mount.push(function () {
    		if (name === undefined && !('name' in $$props || $$self.$$.bound[$$self.$$.props['name']])) {
    			console.warn("<PlayerBar> was created without expected prop 'name'");
    		}

    		if (bot === undefined && !('bot' in $$props || $$self.$$.bound[$$self.$$.props['bot']])) {
    			console.warn("<PlayerBar> was created without expected prop 'bot'");
    		}

    		if (engine === undefined && !('engine' in $$props || $$self.$$.bound[$$self.$$.props['engine']])) {
    			console.warn("<PlayerBar> was created without expected prop 'engine'");
    		}
    	});

    	const writable_props = ['name', 'bot', 'engine'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PlayerBar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		roll();
    	};

    	const click_handler_1 = () => {
    		roll();
    	};

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('bot' in $$props) $$invalidate(1, bot = $$props.bot);
    		if ('engine' in $$props) $$invalidate(2, engine = $$props.engine);
    	};

    	$$self.$capture_state = () => ({ name, bot, engine, roll });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('bot' in $$props) $$invalidate(1, bot = $$props.bot);
    		if ('engine' in $$props) $$invalidate(2, engine = $$props.engine);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, bot, engine, roll, click_handler, click_handler_1];
    }

    class PlayerBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { name: 0, bot: 1, engine: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlayerBar",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get name() {
    		throw new Error("<PlayerBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<PlayerBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bot() {
    		throw new Error("<PlayerBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bot(value) {
    		throw new Error("<PlayerBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get engine() {
    		throw new Error("<PlayerBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set engine(value) {
    		throw new Error("<PlayerBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Board.svelte generated by Svelte v3.52.0 */

    const file$3 = "src\\components\\Board.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (10:8) {#each engine.dizes as dice}
    function create_each_block_2(ctx) {
    	let img;
    	let img_id_value;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "dice svelte-1c6htka");
    			attr_dev(img, "id", img_id_value = /*dice*/ ctx[3]);
    			if (!src_url_equal(img.src, img_src_value = "media/" + /*dice*/ ctx[3] + ".png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$3, 10, 12, 162);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*engine*/ 1 && img_id_value !== (img_id_value = /*dice*/ ctx[3])) {
    				attr_dev(img, "id", img_id_value);
    			}

    			if (dirty & /*engine*/ 1 && !src_url_equal(img.src, img_src_value = "media/" + /*dice*/ ctx[3] + ".png")) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(10:8) {#each engine.dizes as dice}",
    		ctx
    	});

    	return block;
    }

    // (15:8) {#each engine.chosen_list as chosen}
    function create_each_block_1(ctx) {
    	let img;
    	let img_id_value;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[1](/*chosen*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "dice svelte-1c6htka");
    			attr_dev(img, "id", img_id_value = /*chosen*/ ctx[6]);
    			if (!src_url_equal(img.src, img_src_value = "media/" + /*chosen*/ ctx[6] + ".png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$3, 15, 12, 344);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*engine*/ 1 && img_id_value !== (img_id_value = /*chosen*/ ctx[6])) {
    				attr_dev(img, "id", img_id_value);
    			}

    			if (dirty & /*engine*/ 1 && !src_url_equal(img.src, img_src_value = "media/" + /*chosen*/ ctx[6] + ".png")) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(15:8) {#each engine.chosen_list as chosen}",
    		ctx
    	});

    	return block;
    }

    // (20:8) {#each engine.dizes as dice}
    function create_each_block$1(ctx) {
    	let img;
    	let img_id_value;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[2](/*dice*/ ctx[3]);
    	}

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "dice svelte-1c6htka");
    			attr_dev(img, "id", img_id_value = /*dice*/ ctx[3]);
    			if (!src_url_equal(img.src, img_src_value = "media/" + /*dice*/ ctx[3] + ".png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$3, 20, 12, 584);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*engine*/ 1 && img_id_value !== (img_id_value = /*dice*/ ctx[3])) {
    				attr_dev(img, "id", img_id_value);
    			}

    			if (dirty & /*engine*/ 1 && !src_url_equal(img.src, img_src_value = "media/" + /*dice*/ ctx[3] + ".png")) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(20:8) {#each engine.dizes as dice}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let each_value_2 = /*engine*/ ctx[0].dizes;
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*engine*/ ctx[0].chosen_list;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*engine*/ ctx[0].dizes;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t0 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "dizeholder hidden svelte-1c6htka");
    			add_location(div0, file$3, 8, 4, 79);
    			attr_dev(div1, "class", "dizeholder svelte-1c6htka");
    			add_location(div1, file$3, 13, 4, 260);
    			attr_dev(div2, "class", "dizeholder svelte-1c6htka");
    			add_location(div2, file$3, 18, 4, 508);
    			attr_dev(div3, "id", "container");
    			attr_dev(div3, "class", "svelte-1c6htka");
    			add_location(div3, file$3, 7, 0, 53);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div0, null);
    			}

    			append_dev(div3, t0);
    			append_dev(div3, div1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div1, null);
    			}

    			append_dev(div3, t1);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*engine*/ 1) {
    				each_value_2 = /*engine*/ ctx[0].dizes;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty & /*engine*/ 1) {
    				each_value_1 = /*engine*/ ctx[0].chosen_list;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*engine*/ 1) {
    				each_value = /*engine*/ ctx[0].dizes;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Board', slots, []);
    	let { engine } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (engine === undefined && !('engine' in $$props || $$self.$$.bound[$$self.$$.props['engine']])) {
    			console.warn("<Board> was created without expected prop 'engine'");
    		}
    	});

    	const writable_props = ['engine'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Board> was created with unknown prop '${key}'`);
    	});

    	const click_handler = chosen => {
    		engine.remove_chosen(chosen);
    		$$invalidate(0, engine);
    	};

    	const click_handler_1 = dice => {
    		engine.new_chosen(dice);
    		$$invalidate(0, engine);
    	};

    	$$self.$$set = $$props => {
    		if ('engine' in $$props) $$invalidate(0, engine = $$props.engine);
    	};

    	$$self.$capture_state = () => ({ engine });

    	$$self.$inject_state = $$props => {
    		if ('engine' in $$props) $$invalidate(0, engine = $$props.engine);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [engine, click_handler, click_handler_1];
    }

    class Board extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { engine: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Board",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get engine() {
    		throw new Error("<Board>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set engine(value) {
    		throw new Error("<Board>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Overlay.svelte generated by Svelte v3.52.0 */

    const file$2 = "src\\components\\Overlay.svelte";

    // (16:8) {:else}
    function create_else_block$1(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Prøv igjen!";
    			attr_dev(h1, "id", "title");
    			attr_dev(h1, "class", "svelte-18awu33");
    			add_location(h1, file$2, 16, 12, 354);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(16:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:8) {#if vinner()}
    function create_if_block$1(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = `Du vant ${sessionStorage.getItem("username")}!`;
    			attr_dev(h1, "id", "title");
    			attr_dev(h1, "class", "svelte-18awu33");
    			add_location(h1, file$2, 14, 12, 258);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(14:8) {#if vinner()}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div2;
    	let div1;
    	let t0;
    	let img;
    	let img_src_value;
    	let t1;
    	let div0;
    	let p0;
    	let t2;
    	let t3_value = /*engine*/ ctx[0].points + "";
    	let t3;
    	let t4;
    	let p1;
    	let t7;
    	let button;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*vinner*/ ctx[1]()) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			if_block.c();
    			t0 = space();
    			img = element("img");
    			t1 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t2 = text("Poeng: ");
    			t3 = text(t3_value);
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = `Beste: ${localStorage.getItem("beste")}`;
    			t7 = space();
    			button = element("button");
    			button.textContent = "RESTART";
    			if (!src_url_equal(img.src, img_src_value = "media/image2.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "id", "logo");
    			attr_dev(img, "class", "svelte-18awu33");
    			add_location(img, file$2, 18, 8, 410);
    			attr_dev(p0, "id", "points");
    			add_location(p0, file$2, 20, 12, 500);
    			add_location(p1, file$2, 21, 12, 555);
    			attr_dev(div0, "class", "bottom svelte-18awu33");
    			add_location(div0, file$2, 19, 8, 466);
    			attr_dev(button, "id", "restart");
    			attr_dev(button, "class", "svelte-18awu33");
    			add_location(button, file$2, 23, 8, 626);
    			attr_dev(div1, "class", "card svelte-18awu33");
    			add_location(div1, file$2, 12, 4, 202);
    			attr_dev(div2, "class", "container svelte-18awu33");
    			add_location(div2, file$2, 11, 0, 173);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			if_block.m(div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, img);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t2);
    			append_dev(p0, t3);
    			append_dev(div0, t4);
    			append_dev(div0, p1);
    			append_dev(div1, t7);
    			append_dev(div1, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if_block.p(ctx, dirty);
    			if (dirty & /*engine*/ 1 && t3_value !== (t3_value = /*engine*/ ctx[0].points + "")) set_data_dev(t3, t3_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Overlay', slots, []);
    	let { engine } = $$props;

    	function vinner() {
    		if (engine.points > engine.bot_points) return true; else return false;
    	}

    	$$self.$$.on_mount.push(function () {
    		if (engine === undefined && !('engine' in $$props || $$self.$$.bound[$$self.$$.props['engine']])) {
    			console.warn("<Overlay> was created without expected prop 'engine'");
    		}
    	});

    	const writable_props = ['engine'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Overlay> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		window.location.href = "/game";
    	};

    	$$self.$$set = $$props => {
    		if ('engine' in $$props) $$invalidate(0, engine = $$props.engine);
    	};

    	$$self.$capture_state = () => ({ engine, vinner });

    	$$self.$inject_state = $$props => {
    		if ('engine' in $$props) $$invalidate(0, engine = $$props.engine);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [engine, vinner, click_handler];
    }

    class Overlay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { engine: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Overlay",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get engine() {
    		throw new Error("<Overlay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set engine(value) {
    		throw new Error("<Overlay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function _extends() {
      _extends = Object.assign ? Object.assign.bind() : function (target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i];
          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              target[key] = source[key];
            }
          }
        }
        return target;
      };
      return _extends.apply(this, arguments);
    }

    var DEFAULT_CONFIG = {
      // minimum relative difference between two compared values,
      // used by all comparison functions
      epsilon: 1e-12,
      // type of default matrix output. Choose 'matrix' (default) or 'array'
      matrix: 'Matrix',
      // type of default number output. Choose 'number' (default) 'BigNumber', or 'Fraction
      number: 'number',
      // number of significant digits in BigNumbers
      precision: 64,
      // predictable output type of functions. When true, output type depends only
      // on the input types. When false (default), output type can vary depending
      // on input values. For example `math.sqrt(-4)` returns `complex('2i')` when
      // predictable is false, and returns `NaN` when true.
      predictable: false,
      // random seed for seeded pseudo random number generation
      // null = randomly seed
      randomSeed: null
    };

    // type checks for all known types
    //
    // note that:
    //
    // - check by duck-typing on a property like `isUnit`, instead of checking instanceof.
    //   instanceof cannot be used because that would not allow to pass data from
    //   one instance of math.js to another since each has it's own instance of Unit.
    // - check the `isUnit` property via the constructor, so there will be no
    //   matches for "fake" instances like plain objects with a property `isUnit`.
    //   That is important for security reasons.
    // - It must not be possible to override the type checks used internally,
    //   for security reasons, so these functions are not exposed in the expression
    //   parser.

    function isNumber(x) {
      return typeof x === 'number';
    }
    function isBigNumber(x) {
      if (!x || typeof x !== 'object' || typeof x.constructor !== 'function') {
        return false;
      }
      if (x.isBigNumber === true && typeof x.constructor.prototype === 'object' && x.constructor.prototype.isBigNumber === true) {
        return true;
      }
      if (typeof x.constructor.isDecimal === 'function' && x.constructor.isDecimal(x) === true) {
        return true;
      }
      return false;
    }
    function isComplex(x) {
      return x && typeof x === 'object' && Object.getPrototypeOf(x).isComplex === true || false;
    }
    function isFraction(x) {
      return x && typeof x === 'object' && Object.getPrototypeOf(x).isFraction === true || false;
    }
    function isUnit(x) {
      return x && x.constructor.prototype.isUnit === true || false;
    }
    function isString(x) {
      return typeof x === 'string';
    }
    var isArray = Array.isArray;
    function isMatrix(x) {
      return x && x.constructor.prototype.isMatrix === true || false;
    }

    /**
     * Test whether a value is a collection: an Array or Matrix
     * @param {*} x
     * @returns {boolean} isCollection
     */
    function isCollection(x) {
      return Array.isArray(x) || isMatrix(x);
    }
    function isDenseMatrix(x) {
      return x && x.isDenseMatrix && x.constructor.prototype.isMatrix === true || false;
    }
    function isSparseMatrix(x) {
      return x && x.isSparseMatrix && x.constructor.prototype.isMatrix === true || false;
    }
    function isRange(x) {
      return x && x.constructor.prototype.isRange === true || false;
    }
    function isIndex(x) {
      return x && x.constructor.prototype.isIndex === true || false;
    }
    function isBoolean(x) {
      return typeof x === 'boolean';
    }
    function isResultSet(x) {
      return x && x.constructor.prototype.isResultSet === true || false;
    }
    function isHelp(x) {
      return x && x.constructor.prototype.isHelp === true || false;
    }
    function isFunction(x) {
      return typeof x === 'function';
    }
    function isDate(x) {
      return x instanceof Date;
    }
    function isRegExp(x) {
      return x instanceof RegExp;
    }
    function isObject(x) {
      return !!(x && typeof x === 'object' && x.constructor === Object && !isComplex(x) && !isFraction(x));
    }
    function isNull(x) {
      return x === null;
    }
    function isUndefined(x) {
      return x === undefined;
    }
    function isAccessorNode(x) {
      return x && x.isAccessorNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isArrayNode(x) {
      return x && x.isArrayNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isAssignmentNode(x) {
      return x && x.isAssignmentNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isBlockNode(x) {
      return x && x.isBlockNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isConditionalNode(x) {
      return x && x.isConditionalNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isConstantNode(x) {
      return x && x.isConstantNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isFunctionAssignmentNode(x) {
      return x && x.isFunctionAssignmentNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isFunctionNode(x) {
      return x && x.isFunctionNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isIndexNode(x) {
      return x && x.isIndexNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isNode(x) {
      return x && x.isNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isObjectNode(x) {
      return x && x.isObjectNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isOperatorNode(x) {
      return x && x.isOperatorNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isParenthesisNode(x) {
      return x && x.isParenthesisNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isRangeNode(x) {
      return x && x.isRangeNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isRelationalNode(x) {
      return x && x.isRelationalNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isSymbolNode(x) {
      return x && x.isSymbolNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isChain(x) {
      return x && x.constructor.prototype.isChain === true || false;
    }
    function typeOf(x) {
      var t = typeof x;
      if (t === 'object') {
        if (x === null) return 'null';
        if (isBigNumber(x)) return 'BigNumber'; // Special: weird mashup with Decimal
        if (x.constructor && x.constructor.name) return x.constructor.name;
        return 'Object'; // just in case
      }

      return t; // can be 'string', 'number', 'boolean', 'function', 'bigint', ...
    }

    /**
     * Clone an object
     *
     *     clone(x)
     *
     * Can clone any primitive type, array, and object.
     * If x has a function clone, this function will be invoked to clone the object.
     *
     * @param {*} x
     * @return {*} clone
     */
    function clone$1(x) {
      var type = typeof x;

      // immutable primitive types
      if (type === 'number' || type === 'string' || type === 'boolean' || x === null || x === undefined) {
        return x;
      }

      // use clone function of the object when available
      if (typeof x.clone === 'function') {
        return x.clone();
      }

      // array
      if (Array.isArray(x)) {
        return x.map(function (value) {
          return clone$1(value);
        });
      }
      if (x instanceof Date) return new Date(x.valueOf());
      if (isBigNumber(x)) return x; // bignumbers are immutable
      if (x instanceof RegExp) throw new TypeError('Cannot clone ' + x); // TODO: clone a RegExp

      // object
      return mapObject(x, clone$1);
    }

    /**
     * Apply map to all properties of an object
     * @param {Object} object
     * @param {function} callback
     * @return {Object} Returns a copy of the object with mapped properties
     */
    function mapObject(object, callback) {
      var clone = {};
      for (var key in object) {
        if (hasOwnProperty$1(object, key)) {
          clone[key] = callback(object[key]);
        }
      }
      return clone;
    }

    /**
     * Deep test equality of all fields in two pairs of arrays or objects.
     * Compares values and functions strictly (ie. 2 is not the same as '2').
     * @param {Array | Object} a
     * @param {Array | Object} b
     * @returns {boolean}
     */
    function deepStrictEqual(a, b) {
      var prop, i, len;
      if (Array.isArray(a)) {
        if (!Array.isArray(b)) {
          return false;
        }
        if (a.length !== b.length) {
          return false;
        }
        for (i = 0, len = a.length; i < len; i++) {
          if (!deepStrictEqual(a[i], b[i])) {
            return false;
          }
        }
        return true;
      } else if (typeof a === 'function') {
        return a === b;
      } else if (a instanceof Object) {
        if (Array.isArray(b) || !(b instanceof Object)) {
          return false;
        }
        for (prop in a) {
          // noinspection JSUnfilteredForInLoop
          if (!(prop in b) || !deepStrictEqual(a[prop], b[prop])) {
            return false;
          }
        }
        for (prop in b) {
          // noinspection JSUnfilteredForInLoop
          if (!(prop in a)) {
            return false;
          }
        }
        return true;
      } else {
        return a === b;
      }
    }

    /**
     * A safe hasOwnProperty
     * @param {Object} object
     * @param {string} property
     */
    function hasOwnProperty$1(object, property) {
      return object && Object.hasOwnProperty.call(object, property);
    }

    /**
     * Shallow version of pick, creating an object composed of the picked object properties
     * but not for nested properties
     * @param {Object} object
     * @param {string[]} properties
     * @return {Object}
     */
    function pickShallow(object, properties) {
      var copy = {};
      for (var i = 0; i < properties.length; i++) {
        var key = properties[i];
        var value = object[key];
        if (value !== undefined) {
          copy[key] = value;
        }
      }
      return copy;
    }

    var MATRIX_OPTIONS = ['Matrix', 'Array']; // valid values for option matrix
    var NUMBER_OPTIONS = ['number', 'BigNumber', 'Fraction']; // valid values for option number

    // create a read-only version of config
    var config$1 = function config(options) {
      if (options) {
        throw new Error('The global config is readonly. \n' + 'Please create a mathjs instance if you want to change the default configuration. \n' + 'Example:\n' + '\n' + '  import { create, all } from \'mathjs\';\n' + '  const mathjs = create(all);\n' + '  mathjs.config({ number: \'BigNumber\' });\n');
      }
      return Object.freeze(DEFAULT_CONFIG);
    };
    _extends(config$1, DEFAULT_CONFIG, {
      MATRIX_OPTIONS,
      NUMBER_OPTIONS
    });

    var typedFunction = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
      module.exports = factory() ;
    })(commonjsGlobal, (function () {
      function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

      function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

      function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

      function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

      function ok() {
        return true;
      }

      function notOk() {
        return false;
      }

      function undef() {
        return undefined;
      }

      var NOT_TYPED_FUNCTION = 'Argument is not a typed-function.';
      /**
       * @typedef {{
       *   params: Param[],
       *   fn: function,
       *   test: function,
       *   implementation: function
       * }} Signature
       *
       * @typedef {{
       *   types: Type[],
       *   hasAny: boolean,
       *   hasConversion: boolean,
       *   restParam: boolean
       * }} Param
       *
       * @typedef {{
       *   name: string,
       *   typeIndex: number,
       *   test: function,
       *   isAny: boolean,
       *   conversion?: ConversionDef,
       *   conversionIndex: number,
       * }} Type
       *
       * @typedef {{
       *   from: string,
       *   to: string,
       *   convert: function (*) : *
       * }} ConversionDef
       *
       * @typedef {{
       *   name: string,
       *   test: function(*) : boolean,
       *   isAny?: boolean
       * }} TypeDef
       */

      /**
       * @returns {() => function}
       */

      function create() {
        // data type tests

        /**
         * Returns true if the argument is a non-null "plain" object
         */
        function isPlainObject(x) {
          return _typeof(x) === 'object' && x !== null && x.constructor === Object;
        }

        var _types = [{
          name: 'number',
          test: function test(x) {
            return typeof x === 'number';
          }
        }, {
          name: 'string',
          test: function test(x) {
            return typeof x === 'string';
          }
        }, {
          name: 'boolean',
          test: function test(x) {
            return typeof x === 'boolean';
          }
        }, {
          name: 'Function',
          test: function test(x) {
            return typeof x === 'function';
          }
        }, {
          name: 'Array',
          test: Array.isArray
        }, {
          name: 'Date',
          test: function test(x) {
            return x instanceof Date;
          }
        }, {
          name: 'RegExp',
          test: function test(x) {
            return x instanceof RegExp;
          }
        }, {
          name: 'Object',
          test: isPlainObject
        }, {
          name: 'null',
          test: function test(x) {
            return x === null;
          }
        }, {
          name: 'undefined',
          test: function test(x) {
            return x === undefined;
          }
        }];
        var anyType = {
          name: 'any',
          test: ok,
          isAny: true
        }; // Data structures to track the types. As these are local variables in
        // create(), each typed universe will get its own copy, but the variables
        // will only be accessible through the (closures of the) functions supplied
        // as properties of the typed object, not directly.
        // These will be initialized in clear() below

        var typeMap; // primary store of all types

        var typeList; // Array of just type names, for the sake of ordering
        // And similar data structures for the type conversions:

        var nConversions = 0; // the actual conversions are stored on a property of the destination types
        // This is a temporary object, will be replaced with a function at the end

        var typed = {
          createCount: 0
        };
        /**
         * Takes a type name and returns the corresponding official type object
         * for that type.
         *
         * @param {string} typeName
         * @returns {TypeDef} type
         */

        function findType(typeName) {
          var type = typeMap.get(typeName);

          if (type) {
            return type;
          } // Remainder is error handling


          var message = 'Unknown type "' + typeName + '"';
          var name = typeName.toLowerCase();
          var otherName;

          var _iterator = _createForOfIteratorHelper(typeList),
              _step;

          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              otherName = _step.value;

              if (otherName.toLowerCase() === name) {
                message += '. Did you mean "' + otherName + '" ?';
                break;
              }
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }

          throw new TypeError(message);
        }
        /**
         * Adds an array `types` of type definitions to this typed instance.
         * Each type definition should be an object with properties:
         * 'name' - a string giving the name of the type; 'test' - function
         * returning a boolean that tests membership in the type; and optionally
         * 'isAny' - true only for the 'any' type.
         *
         * The second optional argument, `before`, gives the name of a type that
         * these types should be added before. The new types are added in the
         * order specified.
         * @param {TypeDef[]} types
         * @param {string | boolean} [beforeSpec='any'] before
         */


        function addTypes(types) {
          var beforeSpec = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'any';
          var beforeIndex = beforeSpec ? findType(beforeSpec).index : typeList.length;
          var newTypes = [];

          for (var i = 0; i < types.length; ++i) {
            if (!types[i] || typeof types[i].name !== 'string' || typeof types[i].test !== 'function') {
              throw new TypeError('Object with properties {name: string, test: function} expected');
            }

            var typeName = types[i].name;

            if (typeMap.has(typeName)) {
              throw new TypeError('Duplicate type name "' + typeName + '"');
            }

            newTypes.push(typeName);
            typeMap.set(typeName, {
              name: typeName,
              test: types[i].test,
              isAny: types[i].isAny,
              index: beforeIndex + i,
              conversionsTo: [] // Newly added type can't have any conversions to it

            });
          } // update the typeList


          var affectedTypes = typeList.slice(beforeIndex);
          typeList = typeList.slice(0, beforeIndex).concat(newTypes).concat(affectedTypes); // Fix the indices

          for (var _i = beforeIndex + newTypes.length; _i < typeList.length; ++_i) {
            typeMap.get(typeList[_i]).index = _i;
          }
        }
        /**
         * Removes all types and conversions from this typed instance.
         * May cause previously constructed typed-functions to throw
         * strange errors when they are called with types that do not
         * match any of their signatures.
         */


        function clear() {
          typeMap = new Map();
          typeList = [];
          nConversions = 0;
          addTypes([anyType], false);
        } // initialize the types to the default list


        clear();
        addTypes(_types);
        /**
         * Removes all conversions, leaving the types alone.
         */

        function clearConversions() {
          var typeName;

          var _iterator2 = _createForOfIteratorHelper(typeList),
              _step2;

          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              typeName = _step2.value;
              typeMap.get(typeName).conversionsTo = [];
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }

          nConversions = 0;
        }
        /**
         * Find the type names that match a value.
         * @param {*} value
         * @return {string[]} Array of names of types for which
         *                  the type test matches the value.
         */


        function findTypeNames(value) {
          var matches = typeList.filter(function (name) {
            var type = typeMap.get(name);
            return !type.isAny && type.test(value);
          });

          if (matches.length) {
            return matches;
          }

          return ['any'];
        }
        /**
         * Check if an entity is a typed function created by any instance
         * @param {any} entity
         * @returns {boolean}
         */


        function isTypedFunction(entity) {
          return entity && typeof entity === 'function' && '_typedFunctionData' in entity;
        }
        /**
         * Find a specific signature from a (composed) typed function, for example:
         *
         *   typed.findSignature(fn, ['number', 'string'])
         *   typed.findSignature(fn, 'number, string')
         *   typed.findSignature(fn, 'number,string', {exact: true})
         *
         * This function findSignature will by default return the best match to
         * the given signature, possibly employing type conversions.
         *
         * The (optional) third argument is a plain object giving options
         * controlling the signature search. Currently the only implemented
         * option is `exact`: if specified as true (default is false), only
         * exact matches will be returned (i.e. signatures for which `fn` was
         * directly defined). Note that a (possibly different) type matching
         * `any`, or one or more instances of TYPE matching `...TYPE` are
         * considered exact matches in this regard, as no conversions are used.
         *
         * This function returns a "signature" object, as does `typed.resolve()`,
         * which is a plain object with four keys: `params` (the array of parameters
         * for this signature), `fn` (the originally supplied function for this
         * signature), `test` (a generated function that determines if an argument
         * list matches this signature, and `implementation` (the function to call
         * on a matching argument list, that performs conversions if necessary and
         * then calls the originally supplied function).
         *
         * @param {Function} fn                   A typed-function
         * @param {string | string[]} signature
         *     Signature to be found, can be an array or a comma separated string.
         * @param {object} options  Controls the signature search as documented
         * @return {{ params: Param[], fn: function, test: function, implementation: function }}
         *     Returns the matching signature, or throws an error when no signature
         *     is found.
         */


        function findSignature(fn, signature, options) {
          if (!isTypedFunction(fn)) {
            throw new TypeError(NOT_TYPED_FUNCTION);
          } // Canonicalize input


          var exact = options && options.exact;
          var stringSignature = Array.isArray(signature) ? signature.join(',') : signature;
          var params = parseSignature(stringSignature);
          var canonicalSignature = stringifyParams(params); // First hope we get lucky and exactly match a signature

          if (!exact || canonicalSignature in fn.signatures) {
            // OK, we can check the internal signatures
            var match = fn._typedFunctionData.signatureMap.get(canonicalSignature);

            if (match) {
              return match;
            }
          } // Oh well, we did not; so we have to go back and check the parameters
          // one by one, in order to catch things like `any` and rest params.
          // Note here we can assume there is at least one parameter, because
          // the empty signature would have matched successfully above.


          var nParams = params.length;
          var remainingSignatures;

          if (exact) {
            remainingSignatures = [];
            var name;

            for (name in fn.signatures) {
              remainingSignatures.push(fn._typedFunctionData.signatureMap.get(name));
            }
          } else {
            remainingSignatures = fn._typedFunctionData.signatures;
          }

          for (var i = 0; i < nParams; ++i) {
            var want = params[i];
            var filteredSignatures = [];
            var possibility = void 0;

            var _iterator3 = _createForOfIteratorHelper(remainingSignatures),
                _step3;

            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                possibility = _step3.value;
                var have = getParamAtIndex(possibility.params, i);

                if (!have || want.restParam && !have.restParam) {
                  continue;
                }

                if (!have.hasAny) {
                  var _ret = function () {
                    // have to check all of the wanted types are available
                    var haveTypes = paramTypeSet(have);

                    if (want.types.some(function (wtype) {
                      return !haveTypes.has(wtype.name);
                    })) {
                      return "continue";
                    }
                  }();

                  if (_ret === "continue") continue;
                } // OK, this looks good


                filteredSignatures.push(possibility);
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }

            remainingSignatures = filteredSignatures;
            if (remainingSignatures.length === 0) break;
          } // Return the first remaining signature that was totally matched:


          var candidate;

          var _iterator4 = _createForOfIteratorHelper(remainingSignatures),
              _step4;

          try {
            for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
              candidate = _step4.value;

              if (candidate.params.length <= nParams) {
                return candidate;
              }
            }
          } catch (err) {
            _iterator4.e(err);
          } finally {
            _iterator4.f();
          }

          throw new TypeError('Signature not found (signature: ' + (fn.name || 'unnamed') + '(' + stringifyParams(params, ', ') + '))');
        }
        /**
         * Find the proper function to call for a specific signature from
         * a (composed) typed function, for example:
         *
         *   typed.find(fn, ['number', 'string'])
         *   typed.find(fn, 'number, string')
         *   typed.find(fn, 'number,string', {exact: true})
         *
         * This function find will by default return the best match to
         * the given signature, possibly employing type conversions (and returning
         * a function that will perform those conversions as needed). The
         * (optional) third argument is a plain object giving options contolling
         * the signature search. Currently only the option `exact` is implemented,
         * which defaults to "false". If `exact` is specified as true, then only
         * exact matches will be returned (i.e. signatures for which `fn` was
         * directly defined). Uses of `any` and `...TYPE` are considered exact if
         * no conversions are necessary to apply the corresponding function.
         *
         * @param {Function} fn                   A typed-function
         * @param {string | string[]} signature
         *     Signature to be found, can be an array or a comma separated string.
         * @param {object} options  Controls the signature match as documented
         * @return {function}
         *     Returns the function to call for the given signature, or throws an
         *     error if no match is found.
         */


        function find(fn, signature, options) {
          return findSignature(fn, signature, options).implementation;
        }
        /**
         * Convert a given value to another data type, specified by type name.
         *
         * @param {*} value
         * @param {string} typeName
         */


        function convert(value, typeName) {
          // check conversion is needed
          var type = findType(typeName);

          if (type.test(value)) {
            return value;
          }

          var conversions = type.conversionsTo;

          if (conversions.length === 0) {
            throw new Error('There are no conversions to ' + typeName + ' defined.');
          }

          for (var i = 0; i < conversions.length; i++) {
            var fromType = findType(conversions[i].from);

            if (fromType.test(value)) {
              return conversions[i].convert(value);
            }
          }

          throw new Error('Cannot convert ' + value + ' to ' + typeName);
        }
        /**
         * Stringify parameters in a normalized way
         * @param {Param[]} params
         * @param {string} [','] separator
         * @return {string}
         */


        function stringifyParams(params) {
          var separator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ',';
          return params.map(function (p) {
            return p.name;
          }).join(separator);
        }
        /**
         * Parse a parameter, like "...number | boolean"
         * @param {string} param
         * @return {Param} param
         */


        function parseParam(param) {
          var restParam = param.indexOf('...') === 0;
          var types = !restParam ? param : param.length > 3 ? param.slice(3) : 'any';
          var typeDefs = types.split('|').map(function (s) {
            return findType(s.trim());
          });
          var hasAny = false;
          var paramName = restParam ? '...' : '';
          var exactTypes = typeDefs.map(function (type) {
            hasAny = type.isAny || hasAny;
            paramName += type.name + '|';
            return {
              name: type.name,
              typeIndex: type.index,
              test: type.test,
              isAny: type.isAny,
              conversion: null,
              conversionIndex: -1
            };
          });
          return {
            types: exactTypes,
            name: paramName.slice(0, -1),
            // remove trailing '|' from above
            hasAny: hasAny,
            hasConversion: false,
            restParam: restParam
          };
        }
        /**
         * Expands a parsed parameter with the types available from currently
         * defined conversions.
         * @param {Param} param
         * @return {Param} param
         */


        function expandParam(param) {
          var typeNames = param.types.map(function (t) {
            return t.name;
          });
          var matchingConversions = availableConversions(typeNames);
          var hasAny = param.hasAny;
          var newName = param.name;
          var convertibleTypes = matchingConversions.map(function (conversion) {
            var type = findType(conversion.from);
            hasAny = type.isAny || hasAny;
            newName += '|' + conversion.from;
            return {
              name: conversion.from,
              typeIndex: type.index,
              test: type.test,
              isAny: type.isAny,
              conversion: conversion,
              conversionIndex: conversion.index
            };
          });
          return {
            types: param.types.concat(convertibleTypes),
            name: newName,
            hasAny: hasAny,
            hasConversion: convertibleTypes.length > 0,
            restParam: param.restParam
          };
        }
        /**
         * Return the set of type names in a parameter.
         * Caches the result for efficiency
         *
         * @param {Param} param
         * @return {Set<string>} typenames
         */


        function paramTypeSet(param) {
          if (!param.typeSet) {
            param.typeSet = new Set();
            param.types.forEach(function (type) {
              return param.typeSet.add(type.name);
            });
          }

          return param.typeSet;
        }
        /**
         * Parse a signature with comma separated parameters,
         * like "number | boolean, ...string"
         *
         * @param {string} signature
         * @return {Param[]} params
         */


        function parseSignature(rawSignature) {
          var params = [];

          if (typeof rawSignature !== 'string') {
            throw new TypeError('Signatures must be strings');
          }

          var signature = rawSignature.trim();

          if (signature === '') {
            return params;
          }

          var rawParams = signature.split(',');

          for (var i = 0; i < rawParams.length; ++i) {
            var parsedParam = parseParam(rawParams[i].trim());

            if (parsedParam.restParam && i !== rawParams.length - 1) {
              throw new SyntaxError('Unexpected rest parameter "' + rawParams[i] + '": ' + 'only allowed for the last parameter');
            } // if invalid, short-circuit (all the types may have been filtered)


            if (parsedParam.types.length === 0) {
              return null;
            }

            params.push(parsedParam);
          }

          return params;
        }
        /**
         * Test whether a set of params contains a restParam
         * @param {Param[]} params
         * @return {boolean} Returns true when the last parameter is a restParam
         */


        function hasRestParam(params) {
          var param = last(params);
          return param ? param.restParam : false;
        }
        /**
         * Create a type test for a single parameter, which can have one or multiple
         * types.
         * @param {Param} param
         * @return {function(x: *) : boolean} Returns a test function
         */


        function compileTest(param) {
          if (!param || param.types.length === 0) {
            // nothing to do
            return ok;
          } else if (param.types.length === 1) {
            return findType(param.types[0].name).test;
          } else if (param.types.length === 2) {
            var test0 = findType(param.types[0].name).test;
            var test1 = findType(param.types[1].name).test;
            return function or(x) {
              return test0(x) || test1(x);
            };
          } else {
            // param.types.length > 2
            var tests = param.types.map(function (type) {
              return findType(type.name).test;
            });
            return function or(x) {
              for (var i = 0; i < tests.length; i++) {
                if (tests[i](x)) {
                  return true;
                }
              }

              return false;
            };
          }
        }
        /**
         * Create a test for all parameters of a signature
         * @param {Param[]} params
         * @return {function(args: Array<*>) : boolean}
         */


        function compileTests(params) {
          var tests, test0, test1;

          if (hasRestParam(params)) {
            // variable arguments like '...number'
            tests = initial(params).map(compileTest);
            var varIndex = tests.length;
            var lastTest = compileTest(last(params));

            var testRestParam = function testRestParam(args) {
              for (var i = varIndex; i < args.length; i++) {
                if (!lastTest(args[i])) {
                  return false;
                }
              }

              return true;
            };

            return function testArgs(args) {
              for (var i = 0; i < tests.length; i++) {
                if (!tests[i](args[i])) {
                  return false;
                }
              }

              return testRestParam(args) && args.length >= varIndex + 1;
            };
          } else {
            // no variable arguments
            if (params.length === 0) {
              return function testArgs(args) {
                return args.length === 0;
              };
            } else if (params.length === 1) {
              test0 = compileTest(params[0]);
              return function testArgs(args) {
                return test0(args[0]) && args.length === 1;
              };
            } else if (params.length === 2) {
              test0 = compileTest(params[0]);
              test1 = compileTest(params[1]);
              return function testArgs(args) {
                return test0(args[0]) && test1(args[1]) && args.length === 2;
              };
            } else {
              // arguments.length > 2
              tests = params.map(compileTest);
              return function testArgs(args) {
                for (var i = 0; i < tests.length; i++) {
                  if (!tests[i](args[i])) {
                    return false;
                  }
                }

                return args.length === tests.length;
              };
            }
          }
        }
        /**
         * Find the parameter at a specific index of a Params list.
         * Handles rest parameters.
         * @param {Param[]} params
         * @param {number} index
         * @return {Param | null} Returns the matching parameter when found,
         *                        null otherwise.
         */


        function getParamAtIndex(params, index) {
          return index < params.length ? params[index] : hasRestParam(params) ? last(params) : null;
        }
        /**
         * Get all type names of a parameter
         * @param {Params[]} params
         * @param {number} index
         * @return {string[]} Returns an array with type names
         */


        function getTypeSetAtIndex(params, index) {
          var param = getParamAtIndex(params, index);

          if (!param) {
            return new Set();
          }

          return paramTypeSet(param);
        }
        /**
         * Test whether a type is an exact type or conversion
         * @param {Type} type
         * @return {boolean} Returns true when
         */


        function isExactType(type) {
          return type.conversion === null || type.conversion === undefined;
        }
        /**
         * Helper function for creating error messages: create an array with
         * all available types on a specific argument index.
         * @param {Signature[]} signatures
         * @param {number} index
         * @return {string[]} Returns an array with available types
         */


        function mergeExpectedParams(signatures, index) {
          var typeSet = new Set();
          signatures.forEach(function (signature) {
            var paramSet = getTypeSetAtIndex(signature.params, index);
            var name;

            var _iterator5 = _createForOfIteratorHelper(paramSet),
                _step5;

            try {
              for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                name = _step5.value;
                typeSet.add(name);
              }
            } catch (err) {
              _iterator5.e(err);
            } finally {
              _iterator5.f();
            }
          });
          return typeSet.has('any') ? ['any'] : Array.from(typeSet);
        }
        /**
         * Create
         * @param {string} name             The name of the function
         * @param {array.<*>} args          The actual arguments passed to the function
         * @param {Signature[]} signatures  A list with available signatures
         * @return {TypeError} Returns a type error with additional data
         *                     attached to it in the property `data`
         */


        function createError(name, args, signatures) {
          var err, expected;

          var _name = name || 'unnamed'; // test for wrong type at some index


          var matchingSignatures = signatures;
          var index;

          var _loop = function _loop() {
            var nextMatchingDefs = [];
            matchingSignatures.forEach(function (signature) {
              var param = getParamAtIndex(signature.params, index);
              var test = compileTest(param);

              if ((index < signature.params.length || hasRestParam(signature.params)) && test(args[index])) {
                nextMatchingDefs.push(signature);
              }
            });

            if (nextMatchingDefs.length === 0) {
              // no matching signatures anymore, throw error "wrong type"
              expected = mergeExpectedParams(matchingSignatures, index);

              if (expected.length > 0) {
                var actualTypes = findTypeNames(args[index]);
                err = new TypeError('Unexpected type of argument in function ' + _name + ' (expected: ' + expected.join(' or ') + ', actual: ' + actualTypes.join(' | ') + ', index: ' + index + ')');
                err.data = {
                  category: 'wrongType',
                  fn: _name,
                  index: index,
                  actual: actualTypes,
                  expected: expected
                };
                return {
                  v: err
                };
              }
            } else {
              matchingSignatures = nextMatchingDefs;
            }
          };

          for (index = 0; index < args.length; index++) {
            var _ret2 = _loop();

            if (_typeof(_ret2) === "object") return _ret2.v;
          } // test for too few arguments


          var lengths = matchingSignatures.map(function (signature) {
            return hasRestParam(signature.params) ? Infinity : signature.params.length;
          });

          if (args.length < Math.min.apply(null, lengths)) {
            expected = mergeExpectedParams(matchingSignatures, index);
            err = new TypeError('Too few arguments in function ' + _name + ' (expected: ' + expected.join(' or ') + ', index: ' + args.length + ')');
            err.data = {
              category: 'tooFewArgs',
              fn: _name,
              index: args.length,
              expected: expected
            };
            return err;
          } // test for too many arguments


          var maxLength = Math.max.apply(null, lengths);

          if (args.length > maxLength) {
            err = new TypeError('Too many arguments in function ' + _name + ' (expected: ' + maxLength + ', actual: ' + args.length + ')');
            err.data = {
              category: 'tooManyArgs',
              fn: _name,
              index: args.length,
              expectedLength: maxLength
            };
            return err;
          } // Generic error


          var argTypes = [];

          for (var i = 0; i < args.length; ++i) {
            argTypes.push(findTypeNames(args[i]).join('|'));
          }

          err = new TypeError('Arguments of type "' + argTypes.join(', ') + '" do not match any of the defined signatures of function ' + _name + '.');
          err.data = {
            category: 'mismatch',
            actual: argTypes
          };
          return err;
        }
        /**
         * Find the lowest index of all exact types of a parameter (no conversions)
         * @param {Param} param
         * @return {number} Returns the index of the lowest type in typed.types
         */


        function getLowestTypeIndex(param) {
          var min = typeList.length + 1;

          for (var i = 0; i < param.types.length; i++) {
            if (isExactType(param.types[i])) {
              min = Math.min(min, param.types[i].typeIndex);
            }
          }

          return min;
        }
        /**
         * Find the lowest index of the conversion of all types of the parameter
         * having a conversion
         * @param {Param} param
         * @return {number} Returns the lowest index of the conversions of this type
         */


        function getLowestConversionIndex(param) {
          var min = nConversions + 1;

          for (var i = 0; i < param.types.length; i++) {
            if (!isExactType(param.types[i])) {
              min = Math.min(min, param.types[i].conversionIndex);
            }
          }

          return min;
        }
        /**
         * Compare two params
         * @param {Param} param1
         * @param {Param} param2
         * @return {number} returns -1 when param1 must get a lower
         *                  index than param2, 1 when the opposite,
         *                  or zero when both are equal
         */


        function compareParams(param1, param2) {
          // We compare a number of metrics on a param in turn:
          // 1) 'any' parameters are the least preferred
          if (param1.hasAny) {
            if (!param2.hasAny) {
              return 1;
            }
          } else if (param2.hasAny) {
            return -1;
          } // 2) Prefer non-rest to rest parameters


          if (param1.restParam) {
            if (!param2.restParam) {
              return 1;
            }
          } else if (param2.restParam) {
            return -1;
          } // 3) Prefer exact type match to conversions


          if (param1.hasConversion) {
            if (!param2.hasConversion) {
              return 1;
            }
          } else if (param2.hasConversion) {
            return -1;
          } // 4) Prefer lower type index:


          var typeDiff = getLowestTypeIndex(param1) - getLowestTypeIndex(param2);

          if (typeDiff < 0) {
            return -1;
          }

          if (typeDiff > 0) {
            return 1;
          } // 5) Prefer lower conversion index


          var convDiff = getLowestConversionIndex(param1) - getLowestConversionIndex(param2);

          if (convDiff < 0) {
            return -1;
          }

          if (convDiff > 0) {
            return 1;
          } // Don't have a basis for preference


          return 0;
        }
        /**
         * Compare two signatures
         * @param {Signature} signature1
         * @param {Signature} signature2
         * @return {number} returns a negative number when param1 must get a lower
         *                  index than param2, a positive number when the opposite,
         *                  or zero when both are equal
         */


        function compareSignatures(signature1, signature2) {
          var pars1 = signature1.params;
          var pars2 = signature2.params;
          var last1 = last(pars1);
          var last2 = last(pars2);
          var hasRest1 = hasRestParam(pars1);
          var hasRest2 = hasRestParam(pars2); // We compare a number of metrics on signatures in turn:
          // 1) An "any rest param" is least preferred

          if (hasRest1 && last1.hasAny) {
            if (!hasRest2 || !last2.hasAny) {
              return 1;
            }
          } else if (hasRest2 && last2.hasAny) {
            return -1;
          } // 2) Minimize the number of 'any' parameters


          var any1 = 0;
          var conv1 = 0;
          var par;

          var _iterator6 = _createForOfIteratorHelper(pars1),
              _step6;

          try {
            for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
              par = _step6.value;
              if (par.hasAny) ++any1;
              if (par.hasConversion) ++conv1;
            }
          } catch (err) {
            _iterator6.e(err);
          } finally {
            _iterator6.f();
          }

          var any2 = 0;
          var conv2 = 0;

          var _iterator7 = _createForOfIteratorHelper(pars2),
              _step7;

          try {
            for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
              par = _step7.value;
              if (par.hasAny) ++any2;
              if (par.hasConversion) ++conv2;
            }
          } catch (err) {
            _iterator7.e(err);
          } finally {
            _iterator7.f();
          }

          if (any1 !== any2) {
            return any1 - any2;
          } // 3) A conversion rest param is less preferred


          if (hasRest1 && last1.hasConversion) {
            if (!hasRest2 || !last2.hasConversion) {
              return 1;
            }
          } else if (hasRest2 && last2.hasConversion) {
            return -1;
          } // 4) Minimize the number of conversions


          if (conv1 !== conv2) {
            return conv1 - conv2;
          } // 5) Prefer no rest param


          if (hasRest1) {
            if (!hasRest2) {
              return 1;
            }
          } else if (hasRest2) {
            return -1;
          } // 6) Prefer shorter with rest param, longer without


          var lengthCriterion = (pars1.length - pars2.length) * (hasRest1 ? -1 : 1);

          if (lengthCriterion !== 0) {
            return lengthCriterion;
          } // Signatures are identical in each of the above metrics.
          // In particular, they are the same length.
          // We can therefore compare the parameters one by one.
          // First we count which signature has more preferred parameters.


          var comparisons = [];
          var tc = 0;

          for (var i = 0; i < pars1.length; ++i) {
            var thisComparison = compareParams(pars1[i], pars2[i]);
            comparisons.push(thisComparison);
            tc += thisComparison;
          }

          if (tc !== 0) {
            return tc;
          } // They have the same number of preferred parameters, so go by the
          // earliest parameter in which we have a preference.
          // In other words, dispatch is driven somewhat more by earlier
          // parameters than later ones.


          var c;

          for (var _i2 = 0, _comparisons = comparisons; _i2 < _comparisons.length; _i2++) {
            c = _comparisons[_i2];

            if (c !== 0) {
              return c;
            }
          } // It's a tossup:


          return 0;
        }
        /**
         * Produce a list of all conversions from distinct types to one of
         * the given types.
         *
         * @param {string[]} typeNames
         * @return {ConversionDef[]} Returns the conversions that are available
         *                        resulting in any given type (if any)
         */


        function availableConversions(typeNames) {
          if (typeNames.length === 0) {
            return [];
          }

          var types = typeNames.map(findType);

          if (typeNames.length > 1) {
            types.sort(function (t1, t2) {
              return t1.index - t2.index;
            });
          }

          var matches = types[0].conversionsTo;

          if (typeNames.length === 1) {
            return matches;
          }

          matches = matches.concat([]); // shallow copy the matches
          // Since the types are now in index order, we just want the first
          // occurrence of any from type:

          var knownTypes = new Set(typeNames);

          for (var i = 1; i < types.length; ++i) {
            var newMatch = void 0;

            var _iterator8 = _createForOfIteratorHelper(types[i].conversionsTo),
                _step8;

            try {
              for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
                newMatch = _step8.value;

                if (!knownTypes.has(newMatch.from)) {
                  matches.push(newMatch);
                  knownTypes.add(newMatch.from);
                }
              }
            } catch (err) {
              _iterator8.e(err);
            } finally {
              _iterator8.f();
            }
          }

          return matches;
        }
        /**
         * Preprocess arguments before calling the original function:
         * - if needed convert the parameters
         * - in case of rest parameters, move the rest parameters into an Array
         * @param {Param[]} params
         * @param {function} fn
         * @return {function} Returns a wrapped function
         */


        function compileArgsPreprocessing(params, fn) {
          var fnConvert = fn; // TODO: can we make this wrapper function smarter/simpler?

          if (params.some(function (p) {
            return p.hasConversion;
          })) {
            var restParam = hasRestParam(params);
            var compiledConversions = params.map(compileArgConversion);

            fnConvert = function convertArgs() {
              var args = [];
              var last = restParam ? arguments.length - 1 : arguments.length;

              for (var i = 0; i < last; i++) {
                args[i] = compiledConversions[i](arguments[i]);
              }

              if (restParam) {
                args[last] = arguments[last].map(compiledConversions[last]);
              }

              return fn.apply(this, args);
            };
          }

          var fnPreprocess = fnConvert;

          if (hasRestParam(params)) {
            var offset = params.length - 1;

            fnPreprocess = function preprocessRestParams() {
              return fnConvert.apply(this, slice(arguments, 0, offset).concat([slice(arguments, offset)]));
            };
          }

          return fnPreprocess;
        }
        /**
         * Compile conversion for a parameter to the right type
         * @param {Param} param
         * @return {function} Returns the wrapped function that will convert arguments
         *
         */


        function compileArgConversion(param) {
          var test0, test1, conversion0, conversion1;
          var tests = [];
          var conversions = [];
          param.types.forEach(function (type) {
            if (type.conversion) {
              tests.push(findType(type.conversion.from).test);
              conversions.push(type.conversion.convert);
            }
          }); // create optimized conversion functions depending on the number of conversions

          switch (conversions.length) {
            case 0:
              return function convertArg(arg) {
                return arg;
              };

            case 1:
              test0 = tests[0];
              conversion0 = conversions[0];
              return function convertArg(arg) {
                if (test0(arg)) {
                  return conversion0(arg);
                }

                return arg;
              };

            case 2:
              test0 = tests[0];
              test1 = tests[1];
              conversion0 = conversions[0];
              conversion1 = conversions[1];
              return function convertArg(arg) {
                if (test0(arg)) {
                  return conversion0(arg);
                }

                if (test1(arg)) {
                  return conversion1(arg);
                }

                return arg;
              };

            default:
              return function convertArg(arg) {
                for (var i = 0; i < conversions.length; i++) {
                  if (tests[i](arg)) {
                    return conversions[i](arg);
                  }
                }

                return arg;
              };
          }
        }
        /**
         * Split params with union types in to separate params.
         *
         * For example:
         *
         *     splitParams([['Array', 'Object'], ['string', 'RegExp'])
         *     // returns:
         *     // [
         *     //   ['Array', 'string'],
         *     //   ['Array', 'RegExp'],
         *     //   ['Object', 'string'],
         *     //   ['Object', 'RegExp']
         *     // ]
         *
         * @param {Param[]} params
         * @return {Param[]}
         */


        function splitParams(params) {
          function _splitParams(params, index, paramsSoFar) {
            if (index < params.length) {
              var param = params[index];
              var resultingParams = [];

              if (param.restParam) {
                // split the types of a rest parameter in two:
                // one with only exact types, and one with exact types and conversions
                var exactTypes = param.types.filter(isExactType);

                if (exactTypes.length < param.types.length) {
                  resultingParams.push({
                    types: exactTypes,
                    name: '...' + exactTypes.map(function (t) {
                      return t.name;
                    }).join('|'),
                    hasAny: exactTypes.some(function (t) {
                      return t.isAny;
                    }),
                    hasConversion: false,
                    restParam: true
                  });
                }

                resultingParams.push(param);
              } else {
                // split all the types of a regular parameter into one type per param
                resultingParams = param.types.map(function (type) {
                  return {
                    types: [type],
                    name: type.name,
                    hasAny: type.isAny,
                    hasConversion: type.conversion,
                    restParam: false
                  };
                });
              } // recurse over the groups with types


              return flatMap(resultingParams, function (nextParam) {
                return _splitParams(params, index + 1, paramsSoFar.concat([nextParam]));
              });
            } else {
              // we've reached the end of the parameters.
              return [paramsSoFar];
            }
          }

          return _splitParams(params, 0, []);
        }
        /**
         * Test whether two param lists represent conflicting signatures
         * @param {Param[]} params1
         * @param {Param[]} params2
         * @return {boolean} Returns true when the signatures conflict, false otherwise.
         */


        function conflicting(params1, params2) {
          var ii = Math.max(params1.length, params2.length);

          for (var i = 0; i < ii; i++) {
            var typeSet1 = getTypeSetAtIndex(params1, i);
            var typeSet2 = getTypeSetAtIndex(params2, i);
            var overlap = false;
            var name = void 0;

            var _iterator9 = _createForOfIteratorHelper(typeSet2),
                _step9;

            try {
              for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
                name = _step9.value;

                if (typeSet1.has(name)) {
                  overlap = true;
                  break;
                }
              }
            } catch (err) {
              _iterator9.e(err);
            } finally {
              _iterator9.f();
            }

            if (!overlap) {
              return false;
            }
          }

          var len1 = params1.length;
          var len2 = params2.length;
          var restParam1 = hasRestParam(params1);
          var restParam2 = hasRestParam(params2);
          return restParam1 ? restParam2 ? len1 === len2 : len2 >= len1 : restParam2 ? len1 >= len2 : len1 === len2;
        }
        /**
         * Helper function for `resolveReferences` that returns a copy of
         * functionList wihe any prior resolutions cleared out, in case we are
         * recycling signatures from a prior typed function construction.
         *
         * @param {Array.<function|typed-reference>} functionList
         * @return {Array.<function|typed-reference>}
         */


        function clearResolutions(functionList) {
          return functionList.map(function (fn) {
            if (isReferToSelf(fn)) {
              return referToSelf(fn.referToSelf.callback);
            }

            if (isReferTo(fn)) {
              return makeReferTo(fn.referTo.references, fn.referTo.callback);
            }

            return fn;
          });
        }
        /**
         * Take a list of references, a list of functions functionList, and a
         * signatureMap indexing signatures into functionList, and return
         * the list of resolutions, or a false-y value if they don't all
         * resolve in a valid way (yet).
         *
         * @param {string[]} references
         * @param {Array<function|typed-reference} functionList
         * @param {Object.<string, integer>} signatureMap
         * @return {function[] | false} resolutions
         */


        function collectResolutions(references, functionList, signatureMap) {
          var resolvedReferences = [];
          var reference;

          var _iterator10 = _createForOfIteratorHelper(references),
              _step10;

          try {
            for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
              reference = _step10.value;
              var resolution = signatureMap[reference];

              if (typeof resolution !== 'number') {
                throw new TypeError('No definition for referenced signature "' + reference + '"');
              }

              resolution = functionList[resolution];

              if (typeof resolution !== 'function') {
                return false;
              }

              resolvedReferences.push(resolution);
            }
          } catch (err) {
            _iterator10.e(err);
          } finally {
            _iterator10.f();
          }

          return resolvedReferences;
        }
        /**
         * Resolve any references in the functionList for the typed function
         * itself. The signatureMap tells which index in the functionList a
         * given signature should be mapped to (for use in resolving typed.referTo)
         * and self provides the destions of a typed.referToSelf.
         *
         * @param {Array<function | typed-reference-object>} functionList
         * @param {Object.<string, function>} signatureMap
         * @param {function} self  The typed-function itself
         * @return {Array<function>} The list of resolved functions
         */


        function resolveReferences(functionList, signatureMap, self) {
          var resolvedFunctions = clearResolutions(functionList);
          var isResolved = new Array(resolvedFunctions.length).fill(false);
          var leftUnresolved = true;

          while (leftUnresolved) {
            leftUnresolved = false;
            var nothingResolved = true;

            for (var i = 0; i < resolvedFunctions.length; ++i) {
              if (isResolved[i]) continue;
              var fn = resolvedFunctions[i];

              if (isReferToSelf(fn)) {
                resolvedFunctions[i] = fn.referToSelf.callback(self); // Preserve reference in case signature is reused someday:

                resolvedFunctions[i].referToSelf = fn.referToSelf;
                isResolved[i] = true;
                nothingResolved = false;
              } else if (isReferTo(fn)) {
                var resolvedReferences = collectResolutions(fn.referTo.references, resolvedFunctions, signatureMap);

                if (resolvedReferences) {
                  resolvedFunctions[i] = fn.referTo.callback.apply(this, resolvedReferences); // Preserve reference in case signature is reused someday:

                  resolvedFunctions[i].referTo = fn.referTo;
                  isResolved[i] = true;
                  nothingResolved = false;
                } else {
                  leftUnresolved = true;
                }
              }
            }

            if (nothingResolved && leftUnresolved) {
              throw new SyntaxError('Circular reference detected in resolving typed.referTo');
            }
          }

          return resolvedFunctions;
        }
        /**
         * Validate whether any of the function bodies contains a self-reference
         * usage like `this(...)` or `this.signatures`. This self-referencing is
         * deprecated since typed-function v3. It has been replaced with
         * the functions typed.referTo and typed.referToSelf.
         * @param {Object.<string, function>} signaturesMap
         */


        function validateDeprecatedThis(signaturesMap) {
          // TODO: remove this deprecation warning logic some day (it's introduced in v3)
          // match occurrences like 'this(' and 'this.signatures'
          var deprecatedThisRegex = /\bthis(\(|\.signatures\b)/;
          Object.keys(signaturesMap).forEach(function (signature) {
            var fn = signaturesMap[signature];

            if (deprecatedThisRegex.test(fn.toString())) {
              throw new SyntaxError('Using `this` to self-reference a function ' + 'is deprecated since typed-function@3. ' + 'Use typed.referTo and typed.referToSelf instead.');
            }
          });
        }
        /**
         * Create a typed function
         * @param {String} name               The name for the typed function
         * @param {Object.<string, function>} rawSignaturesMap
         *                                    An object with one or
         *                                    multiple signatures as key, and the
         *                                    function corresponding to the
         *                                    signature as value.
         * @return {function}  Returns the created typed function.
         */


        function createTypedFunction(name, rawSignaturesMap) {
          typed.createCount++;

          if (Object.keys(rawSignaturesMap).length === 0) {
            throw new SyntaxError('No signatures provided');
          }

          if (typed.warnAgainstDeprecatedThis) {
            validateDeprecatedThis(rawSignaturesMap);
          } // Main processing loop for signatures


          var parsedParams = [];
          var originalFunctions = [];
          var signaturesMap = {};
          var preliminarySignatures = []; // may have duplicates from conversions

          var signature;

          var _loop2 = function _loop2() {
            // A) Protect against polluted Object prototype:
            if (!Object.prototype.hasOwnProperty.call(rawSignaturesMap, signature)) {
              return "continue";
            } // B) Parse the signature


            var params = parseSignature(signature);
            if (!params) return "continue"; // C) Check for conflicts

            parsedParams.forEach(function (pp) {
              if (conflicting(pp, params)) {
                throw new TypeError('Conflicting signatures "' + stringifyParams(pp) + '" and "' + stringifyParams(params) + '".');
              }
            });
            parsedParams.push(params); // D) Store the provided function and add conversions

            var functionIndex = originalFunctions.length;
            originalFunctions.push(rawSignaturesMap[signature]);
            var conversionParams = params.map(expandParam); // E) Split the signatures and collect them up

            var sp = void 0;

            var _iterator11 = _createForOfIteratorHelper(splitParams(conversionParams)),
                _step11;

            try {
              for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
                sp = _step11.value;
                var spName = stringifyParams(sp);
                preliminarySignatures.push({
                  params: sp,
                  name: spName,
                  fn: functionIndex
                });

                if (sp.every(function (p) {
                  return !p.hasConversion;
                })) {
                  signaturesMap[spName] = functionIndex;
                }
              }
            } catch (err) {
              _iterator11.e(err);
            } finally {
              _iterator11.f();
            }
          };

          for (signature in rawSignaturesMap) {
            var _ret3 = _loop2();

            if (_ret3 === "continue") continue;
          }

          preliminarySignatures.sort(compareSignatures); // Note the forward reference to theTypedFn

          var resolvedFunctions = resolveReferences(originalFunctions, signaturesMap, theTypedFn); // Fill in the proper function for each signature

          var s;

          for (s in signaturesMap) {
            if (Object.prototype.hasOwnProperty.call(signaturesMap, s)) {
              signaturesMap[s] = resolvedFunctions[signaturesMap[s]];
            }
          }

          var signatures = [];
          var internalSignatureMap = new Map(); // benchmarks faster than object

          for (var _i3 = 0, _preliminarySignature = preliminarySignatures; _i3 < _preliminarySignature.length; _i3++) {
            s = _preliminarySignature[_i3];

            // Note it's only safe to eliminate duplicates like this
            // _after_ the signature sorting step above; otherwise we might
            // remove the wrong one.
            if (!internalSignatureMap.has(s.name)) {
              s.fn = resolvedFunctions[s.fn];
              signatures.push(s);
              internalSignatureMap.set(s.name, s);
            }
          } // we create a highly optimized checks for the first couple of signatures with max 2 arguments


          var ok0 = signatures[0] && signatures[0].params.length <= 2 && !hasRestParam(signatures[0].params);
          var ok1 = signatures[1] && signatures[1].params.length <= 2 && !hasRestParam(signatures[1].params);
          var ok2 = signatures[2] && signatures[2].params.length <= 2 && !hasRestParam(signatures[2].params);
          var ok3 = signatures[3] && signatures[3].params.length <= 2 && !hasRestParam(signatures[3].params);
          var ok4 = signatures[4] && signatures[4].params.length <= 2 && !hasRestParam(signatures[4].params);
          var ok5 = signatures[5] && signatures[5].params.length <= 2 && !hasRestParam(signatures[5].params);
          var allOk = ok0 && ok1 && ok2 && ok3 && ok4 && ok5; // compile the tests

          for (var i = 0; i < signatures.length; ++i) {
            signatures[i].test = compileTests(signatures[i].params);
          }

          var test00 = ok0 ? compileTest(signatures[0].params[0]) : notOk;
          var test10 = ok1 ? compileTest(signatures[1].params[0]) : notOk;
          var test20 = ok2 ? compileTest(signatures[2].params[0]) : notOk;
          var test30 = ok3 ? compileTest(signatures[3].params[0]) : notOk;
          var test40 = ok4 ? compileTest(signatures[4].params[0]) : notOk;
          var test50 = ok5 ? compileTest(signatures[5].params[0]) : notOk;
          var test01 = ok0 ? compileTest(signatures[0].params[1]) : notOk;
          var test11 = ok1 ? compileTest(signatures[1].params[1]) : notOk;
          var test21 = ok2 ? compileTest(signatures[2].params[1]) : notOk;
          var test31 = ok3 ? compileTest(signatures[3].params[1]) : notOk;
          var test41 = ok4 ? compileTest(signatures[4].params[1]) : notOk;
          var test51 = ok5 ? compileTest(signatures[5].params[1]) : notOk; // compile the functions

          for (var _i4 = 0; _i4 < signatures.length; ++_i4) {
            signatures[_i4].implementation = compileArgsPreprocessing(signatures[_i4].params, signatures[_i4].fn);
          }

          var fn0 = ok0 ? signatures[0].implementation : undef;
          var fn1 = ok1 ? signatures[1].implementation : undef;
          var fn2 = ok2 ? signatures[2].implementation : undef;
          var fn3 = ok3 ? signatures[3].implementation : undef;
          var fn4 = ok4 ? signatures[4].implementation : undef;
          var fn5 = ok5 ? signatures[5].implementation : undef;
          var len0 = ok0 ? signatures[0].params.length : -1;
          var len1 = ok1 ? signatures[1].params.length : -1;
          var len2 = ok2 ? signatures[2].params.length : -1;
          var len3 = ok3 ? signatures[3].params.length : -1;
          var len4 = ok4 ? signatures[4].params.length : -1;
          var len5 = ok5 ? signatures[5].params.length : -1; // simple and generic, but also slow

          var iStart = allOk ? 6 : 0;
          var iEnd = signatures.length; // de-reference ahead for execution speed:

          var tests = signatures.map(function (s) {
            return s.test;
          });
          var fns = signatures.map(function (s) {
            return s.implementation;
          });

          var generic = function generic() {

            for (var _i5 = iStart; _i5 < iEnd; _i5++) {
              if (tests[_i5](arguments)) {
                return fns[_i5].apply(this, arguments);
              }
            }

            return typed.onMismatch(name, arguments, signatures);
          }; // create the typed function
          // fast, specialized version. Falls back to the slower, generic one if needed


          function theTypedFn(arg0, arg1) {

            if (arguments.length === len0 && test00(arg0) && test01(arg1)) {
              return fn0.apply(this, arguments);
            }

            if (arguments.length === len1 && test10(arg0) && test11(arg1)) {
              return fn1.apply(this, arguments);
            }

            if (arguments.length === len2 && test20(arg0) && test21(arg1)) {
              return fn2.apply(this, arguments);
            }

            if (arguments.length === len3 && test30(arg0) && test31(arg1)) {
              return fn3.apply(this, arguments);
            }

            if (arguments.length === len4 && test40(arg0) && test41(arg1)) {
              return fn4.apply(this, arguments);
            }

            if (arguments.length === len5 && test50(arg0) && test51(arg1)) {
              return fn5.apply(this, arguments);
            }

            return generic.apply(this, arguments);
          } // attach name the typed function


          try {
            Object.defineProperty(theTypedFn, 'name', {
              value: name
            });
          } catch (err) {// old browsers do not support Object.defineProperty and some don't support setting the name property
            // the function name is not essential for the functioning, it's mostly useful for debugging,
            // so it's fine to have unnamed functions.
          } // attach signatures to the function.
          // This property is close to the original collection of signatures
          // used to create the typed-function, just with unions split:


          theTypedFn.signatures = signaturesMap; // Store internal data for functions like resolve, find, etc.
          // Also serves as the flag that this is a typed-function

          theTypedFn._typedFunctionData = {
            signatures: signatures,
            signatureMap: internalSignatureMap
          };
          return theTypedFn;
        }
        /**
         * Action to take on mismatch
         * @param {string} name      Name of function that was attempted to be called
         * @param {Array} args       Actual arguments to the call
         * @param {Array} signatures Known signatures of the named typed-function
         */


        function _onMismatch(name, args, signatures) {
          throw createError(name, args, signatures);
        }
        /**
         * Return all but the last items of an array or function Arguments
         * @param {Array | Arguments} arr
         * @return {Array}
         */


        function initial(arr) {
          return slice(arr, 0, arr.length - 1);
        }
        /**
         * return the last item of an array or function Arguments
         * @param {Array | Arguments} arr
         * @return {*}
         */


        function last(arr) {
          return arr[arr.length - 1];
        }
        /**
         * Slice an array or function Arguments
         * @param {Array | Arguments | IArguments} arr
         * @param {number} start
         * @param {number} [end]
         * @return {Array}
         */


        function slice(arr, start, end) {
          return Array.prototype.slice.call(arr, start, end);
        }
        /**
         * Return the first item from an array for which test(arr[i]) returns true
         * @param {Array} arr
         * @param {function} test
         * @return {* | undefined} Returns the first matching item
         *                         or undefined when there is no match
         */


        function findInArray(arr, test) {
          for (var i = 0; i < arr.length; i++) {
            if (test(arr[i])) {
              return arr[i];
            }
          }

          return undefined;
        }
        /**
         * Flat map the result invoking a callback for every item in an array.
         * https://gist.github.com/samgiles/762ee337dff48623e729
         * @param {Array} arr
         * @param {function} callback
         * @return {Array}
         */


        function flatMap(arr, callback) {
          return Array.prototype.concat.apply([], arr.map(callback));
        }
        /**
         * Create a reference callback to one or multiple signatures
         *
         * Syntax:
         *
         *     typed.referTo(signature1, signature2, ..., function callback(fn1, fn2, ...) {
         *       // ...
         *     })
         *
         * @returns {{referTo: {references: string[], callback}}}
         */


        function referTo() {
          var references = initial(arguments).map(function (s) {
            return stringifyParams(parseSignature(s));
          });
          var callback = last(arguments);

          if (typeof callback !== 'function') {
            throw new TypeError('Callback function expected as last argument');
          }

          return makeReferTo(references, callback);
        }

        function makeReferTo(references, callback) {
          return {
            referTo: {
              references: references,
              callback: callback
            }
          };
        }
        /**
         * Create a reference callback to the typed-function itself
         *
         * @param {(self: function) => function} callback
         * @returns {{referToSelf: { callback: function }}}
         */


        function referToSelf(callback) {
          if (typeof callback !== 'function') {
            throw new TypeError('Callback function expected as first argument');
          }

          return {
            referToSelf: {
              callback: callback
            }
          };
        }
        /**
         * Test whether something is a referTo object, holding a list with reference
         * signatures and a callback.
         *
         * @param {Object | function} objectOrFn
         * @returns {boolean}
         */


        function isReferTo(objectOrFn) {
          return objectOrFn && _typeof(objectOrFn.referTo) === 'object' && Array.isArray(objectOrFn.referTo.references) && typeof objectOrFn.referTo.callback === 'function';
        }
        /**
         * Test whether something is a referToSelf object, holding a callback where
         * to pass `self`.
         *
         * @param {Object | function} objectOrFn
         * @returns {boolean}
         */


        function isReferToSelf(objectOrFn) {
          return objectOrFn && _typeof(objectOrFn.referToSelf) === 'object' && typeof objectOrFn.referToSelf.callback === 'function';
        }
        /**
         * Check if name is (A) new, (B) a match, or (C) a mismatch; and throw
         * an error in case (C).
         *
         * @param { string | undefined } nameSoFar
         * @param { string | undefined } newName
         * @returns { string } updated name
         */


        function checkName(nameSoFar, newName) {
          if (!nameSoFar) {
            return newName;
          }

          if (newName && newName !== nameSoFar) {
            var err = new Error('Function names do not match (expected: ' + nameSoFar + ', actual: ' + newName + ')');
            err.data = {
              actual: newName,
              expected: nameSoFar
            };
            throw err;
          }

          return nameSoFar;
        }
        /**
         * Retrieve the implied name from an object with signature keys
         * and function values, checking whether all value names match
         *
         * @param { {string: function} } obj
         */


        function getObjectName(obj) {
          var name;

          for (var key in obj) {
            // Only pay attention to own properties, and only if their values
            // are typed functions or functions with a signature property
            if (Object.prototype.hasOwnProperty.call(obj, key) && (isTypedFunction(obj[key]) || typeof obj[key].signature === 'string')) {
              name = checkName(name, obj[key].name);
            }
          }

          return name;
        }
        /**
         * Copy all of the signatures from the second argument into the first,
         * which is modified by side effect, checking for conflicts
         *
         * @param {Object.<string, function|typed-reference>} dest
         * @param {Object.<string, function|typed-reference>} source
         */


        function mergeSignatures(dest, source) {
          var key;

          for (key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              if (key in dest) {
                if (source[key] !== dest[key]) {
                  var err = new Error('Signature "' + key + '" is defined twice');
                  err.data = {
                    signature: key,
                    sourceFunction: source[key],
                    destFunction: dest[key]
                  };
                  throw err;
                } // else: both signatures point to the same function, that's fine

              }

              dest[key] = source[key];
            }
          }
        }

        var saveTyped = typed;
        /**
         * Originally the main function was a typed function itself, but then
         * it might not be able to generate error messages if the client
         * replaced the type system with different names.
         *
         * Main entry: typed([name], functions/objects with signatures...)
         *
         * Assembles and returns a new typed-function from the given items
         * that provide signatures and implementations, each of which may be
         * * a plain object mapping (string) signatures to implementing functions,
         * * a previously constructed typed function, or
         * * any other single function with a string-valued property `signature`.
          * The name of the resulting typed-function will be given by the
         * string-valued name argument if present, or if not, by the name
         * of any of the arguments that have one, as long as any that do are
         * consistent with each other. If no name is specified, the name will be
         * an empty string.
         *
         * @param {string} maybeName [optional]
         * @param {(function|object)[]} signature providers
         * @returns {typed-function}
         */

        typed = function typed(maybeName) {
          var named = typeof maybeName === 'string';
          var start = named ? 1 : 0;
          var name = named ? maybeName : '';
          var allSignatures = {};

          for (var i = start; i < arguments.length; ++i) {
            var item = arguments[i];
            var theseSignatures = {};
            var thisName = void 0;

            if (typeof item === 'function') {
              thisName = item.name;

              if (typeof item.signature === 'string') {
                // Case 1: Ordinary function with a string 'signature' property
                theseSignatures[item.signature] = item;
              } else if (isTypedFunction(item)) {
                // Case 2: Existing typed function
                theseSignatures = item.signatures;
              }
            } else if (isPlainObject(item)) {
              // Case 3: Plain object, assume keys = signatures, values = functions
              theseSignatures = item;

              if (!named) {
                thisName = getObjectName(item);
              }
            }

            if (Object.keys(theseSignatures).length === 0) {
              var err = new TypeError('Argument to \'typed\' at index ' + i + ' is not a (typed) function, ' + 'nor an object with signatures as keys and functions as values.');
              err.data = {
                index: i,
                argument: item
              };
              throw err;
            }

            if (!named) {
              name = checkName(name, thisName);
            }

            mergeSignatures(allSignatures, theseSignatures);
          }

          return createTypedFunction(name || '', allSignatures);
        };

        typed.create = create;
        typed.createCount = saveTyped.createCount;
        typed.onMismatch = _onMismatch;
        typed.throwMismatchError = _onMismatch;
        typed.createError = createError;
        typed.clear = clear;
        typed.clearConversions = clearConversions;
        typed.addTypes = addTypes;
        typed._findType = findType; // For unit testing only

        typed.referTo = referTo;
        typed.referToSelf = referToSelf;
        typed.convert = convert;
        typed.findSignature = findSignature;
        typed.find = find;
        typed.isTypedFunction = isTypedFunction;
        typed.warnAgainstDeprecatedThis = true;
        /**
         * add a type (convenience wrapper for typed.addTypes)
         * @param {{name: string, test: function}} type
         * @param {boolean} [beforeObjectTest=true]
         *                          If true, the new test will be inserted before
         *                          the test with name 'Object' (if any), since
         *                          tests for Object match Array and classes too.
         */

        typed.addType = function (type, beforeObjectTest) {
          var before = 'any';

          if (beforeObjectTest !== false && typeMap.has('Object')) {
            before = 'Object';
          }

          typed.addTypes([type], before);
        };
        /**
         * Verify that the ConversionDef conversion has a valid format.
         *
         * @param {conversionDef} conversion
         * @return {void}
         * @throws {TypeError|SyntaxError}
         */


        function _validateConversion(conversion) {
          if (!conversion || typeof conversion.from !== 'string' || typeof conversion.to !== 'string' || typeof conversion.convert !== 'function') {
            throw new TypeError('Object with properties {from: string, to: string, convert: function} expected');
          }

          if (conversion.to === conversion.from) {
            throw new SyntaxError('Illegal to define conversion from "' + conversion.from + '" to itself.');
          }
        }
        /**
         * Add a conversion
         *
         * @param {ConversionDef} conversion
         * @returns {void}
         * @throws {TypeError}
         */


        typed.addConversion = function (conversion) {
          _validateConversion(conversion);

          var to = findType(conversion.to);

          if (to.conversionsTo.every(function (other) {
            return other.from !== conversion.from;
          })) {
            to.conversionsTo.push({
              from: conversion.from,
              convert: conversion.convert,
              index: nConversions++
            });
          } else {
            throw new Error('There is already a conversion from "' + conversion.from + '" to "' + to.name + '"');
          }
        };
        /**
         * Convenience wrapper to call addConversion on each conversion in a list.
         *
         @param {ConversionDef[]} conversions
         @returns {void}
         @throws {TypeError}
         */


        typed.addConversions = function (conversions) {
          conversions.forEach(typed.addConversion);
        };
        /**
         * Remove the specified conversion. The format is the same as for
         * addConversion, and the convert function must match or an error
         * is thrown.
         *
         * @param {{from: string, to: string, convert: function}} conversion
         * @returns {void}
         * @throws {TypeError|SyntaxError|Error}
         */


        typed.removeConversion = function (conversion) {
          _validateConversion(conversion);

          var to = findType(conversion.to);
          var existingConversion = findInArray(to.conversionsTo, function (c) {
            return c.from === conversion.from;
          });

          if (!existingConversion) {
            throw new Error('Attempt to remove nonexistent conversion from ' + conversion.from + ' to ' + conversion.to);
          }

          if (existingConversion.convert !== conversion.convert) {
            throw new Error('Conversion to remove does not match existing conversion');
          }

          var index = to.conversionsTo.indexOf(existingConversion);
          to.conversionsTo.splice(index, 1);
        };
        /**
         * Produce the specific signature that a typed function
         * will execute on the given arguments. Here, a "signature" is an
         * object with properties 'params', 'test', 'fn', and 'implementation'.
         * This last property is a function that converts params as necessary
         * and then calls 'fn'. Returns null if there is no matching signature.
         * @param {typed-function} tf
         * @param {any[]} argList
         * @returns {{params: string, test: function, fn: function, implementation: function}}
         */


        typed.resolve = function (tf, argList) {
          if (!isTypedFunction(tf)) {
            throw new TypeError(NOT_TYPED_FUNCTION);
          }

          var sigs = tf._typedFunctionData.signatures;

          for (var i = 0; i < sigs.length; ++i) {
            if (sigs[i].test(argList)) {
              return sigs[i];
            }
          }

          return null;
        };

        return typed;
      }

      var typedFunction = create();

      return typedFunction;

    }));

    });

    /**
     * @typedef {{sign: '+' | '-' | '', coefficients: number[], exponent: number}} SplitValue
     */

    /**
     * Check if a number is integer
     * @param {number | boolean} value
     * @return {boolean} isInteger
     */
    function isInteger(value) {
      if (typeof value === 'boolean') {
        return true;
      }
      return isFinite(value) ? value === Math.round(value) : false;
    }

    /**
     * Formats a number in a given base
     * @param {number} n
     * @param {number} base
     * @param {number} size
     * @returns {string}
     */
    function formatNumberToBase(n, base, size) {
      var prefixes = {
        2: '0b',
        8: '0o',
        16: '0x'
      };
      var prefix = prefixes[base];
      var suffix = '';
      if (size) {
        if (size < 1) {
          throw new Error('size must be in greater than 0');
        }
        if (!isInteger(size)) {
          throw new Error('size must be an integer');
        }
        if (n > 2 ** (size - 1) - 1 || n < -(2 ** (size - 1))) {
          throw new Error("Value must be in range [-2^".concat(size - 1, ", 2^").concat(size - 1, "-1]"));
        }
        if (!isInteger(n)) {
          throw new Error('Value must be an integer');
        }
        if (n < 0) {
          n = n + 2 ** size;
        }
        suffix = "i".concat(size);
      }
      var sign = '';
      if (n < 0) {
        n = -n;
        sign = '-';
      }
      return "".concat(sign).concat(prefix).concat(n.toString(base)).concat(suffix);
    }

    /**
     * Convert a number to a formatted string representation.
     *
     * Syntax:
     *
     *    format(value)
     *    format(value, options)
     *    format(value, precision)
     *    format(value, fn)
     *
     * Where:
     *
     *    {number} value   The value to be formatted
     *    {Object} options An object with formatting options. Available options:
     *                     {string} notation
     *                         Number notation. Choose from:
     *                         'fixed'          Always use regular number notation.
     *                                          For example '123.40' and '14000000'
     *                         'exponential'    Always use exponential notation.
     *                                          For example '1.234e+2' and '1.4e+7'
     *                         'engineering'    Always use engineering notation.
     *                                          For example '123.4e+0' and '14.0e+6'
     *                         'auto' (default) Regular number notation for numbers
     *                                          having an absolute value between
     *                                          `lowerExp` and `upperExp` bounds, and
     *                                          uses exponential notation elsewhere.
     *                                          Lower bound is included, upper bound
     *                                          is excluded.
     *                                          For example '123.4' and '1.4e7'.
     *                         'bin', 'oct, or
     *                         'hex'            Format the number using binary, octal,
     *                                          or hexadecimal notation.
     *                                          For example '0b1101' and '0x10fe'.
     *                     {number} wordSize    The word size in bits to use for formatting
     *                                          in binary, octal, or hexadecimal notation.
     *                                          To be used only with 'bin', 'oct', or 'hex'
     *                                          values for 'notation' option. When this option
     *                                          is defined the value is formatted as a signed
     *                                          twos complement integer of the given word size
     *                                          and the size suffix is appended to the output.
     *                                          For example
     *                                          format(-1, {notation: 'hex', wordSize: 8}) === '0xffi8'.
     *                                          Default value is undefined.
     *                     {number} precision   A number between 0 and 16 to round
     *                                          the digits of the number.
     *                                          In case of notations 'exponential',
     *                                          'engineering', and 'auto',
     *                                          `precision` defines the total
     *                                          number of significant digits returned.
     *                                          In case of notation 'fixed',
     *                                          `precision` defines the number of
     *                                          significant digits after the decimal
     *                                          point.
     *                                          `precision` is undefined by default,
     *                                          not rounding any digits.
     *                     {number} lowerExp    Exponent determining the lower boundary
     *                                          for formatting a value with an exponent
     *                                          when `notation='auto`.
     *                                          Default value is `-3`.
     *                     {number} upperExp    Exponent determining the upper boundary
     *                                          for formatting a value with an exponent
     *                                          when `notation='auto`.
     *                                          Default value is `5`.
     *    {Function} fn    A custom formatting function. Can be used to override the
     *                     built-in notations. Function `fn` is called with `value` as
     *                     parameter and must return a string. Is useful for example to
     *                     format all values inside a matrix in a particular way.
     *
     * Examples:
     *
     *    format(6.4)                                        // '6.4'
     *    format(1240000)                                    // '1.24e6'
     *    format(1/3)                                        // '0.3333333333333333'
     *    format(1/3, 3)                                     // '0.333'
     *    format(21385, 2)                                   // '21000'
     *    format(12.071, {notation: 'fixed'})                // '12'
     *    format(2.3,    {notation: 'fixed', precision: 2})  // '2.30'
     *    format(52.8,   {notation: 'exponential'})          // '5.28e+1'
     *    format(12345678, {notation: 'engineering'})        // '12.345678e+6'
     *
     * @param {number} value
     * @param {Object | Function | number} [options]
     * @return {string} str The formatted value
     */
    function format$2(value, options) {
      if (typeof options === 'function') {
        // handle format(value, fn)
        return options(value);
      }

      // handle special cases
      if (value === Infinity) {
        return 'Infinity';
      } else if (value === -Infinity) {
        return '-Infinity';
      } else if (isNaN(value)) {
        return 'NaN';
      }

      // default values for options
      var notation = 'auto';
      var precision;
      var wordSize;
      if (options) {
        // determine notation from options
        if (options.notation) {
          notation = options.notation;
        }

        // determine precision from options
        if (isNumber(options)) {
          precision = options;
        } else if (isNumber(options.precision)) {
          precision = options.precision;
        }
        if (options.wordSize) {
          wordSize = options.wordSize;
          if (typeof wordSize !== 'number') {
            throw new Error('Option "wordSize" must be a number');
          }
        }
      }

      // handle the various notations
      switch (notation) {
        case 'fixed':
          return toFixed$1(value, precision);
        case 'exponential':
          return toExponential$1(value, precision);
        case 'engineering':
          return toEngineering$1(value, precision);
        case 'bin':
          return formatNumberToBase(value, 2, wordSize);
        case 'oct':
          return formatNumberToBase(value, 8, wordSize);
        case 'hex':
          return formatNumberToBase(value, 16, wordSize);
        case 'auto':
          // remove trailing zeros after the decimal point
          return toPrecision(value, precision, options && options).replace(/((\.\d*?)(0+))($|e)/, function () {
            var digits = arguments[2];
            var e = arguments[4];
            return digits !== '.' ? digits + e : e;
          });
        default:
          throw new Error('Unknown notation "' + notation + '". ' + 'Choose "auto", "exponential", "fixed", "bin", "oct", or "hex.');
      }
    }

    /**
     * Split a number into sign, coefficients, and exponent
     * @param {number | string} value
     * @return {SplitValue}
     *              Returns an object containing sign, coefficients, and exponent
     */
    function splitNumber(value) {
      // parse the input value
      var match = String(value).toLowerCase().match(/^(-?)(\d+\.?\d*)(e([+-]?\d+))?$/);
      if (!match) {
        throw new SyntaxError('Invalid number ' + value);
      }
      var sign = match[1];
      var digits = match[2];
      var exponent = parseFloat(match[4] || '0');
      var dot = digits.indexOf('.');
      exponent += dot !== -1 ? dot - 1 : digits.length - 1;
      var coefficients = digits.replace('.', '') // remove the dot (must be removed before removing leading zeros)
      .replace(/^0*/, function (zeros) {
        // remove leading zeros, add their count to the exponent
        exponent -= zeros.length;
        return '';
      }).replace(/0*$/, '') // remove trailing zeros
      .split('').map(function (d) {
        return parseInt(d);
      });
      if (coefficients.length === 0) {
        coefficients.push(0);
        exponent++;
      }
      return {
        sign,
        coefficients,
        exponent
      };
    }

    /**
     * Format a number in engineering notation. Like '1.23e+6', '2.3e+0', '3.500e-3'
     * @param {number | string} value
     * @param {number} [precision]        Optional number of significant figures to return.
     */
    function toEngineering$1(value, precision) {
      if (isNaN(value) || !isFinite(value)) {
        return String(value);
      }
      var split = splitNumber(value);
      var rounded = roundDigits(split, precision);
      var e = rounded.exponent;
      var c = rounded.coefficients;

      // find nearest lower multiple of 3 for exponent
      var newExp = e % 3 === 0 ? e : e < 0 ? e - 3 - e % 3 : e - e % 3;
      if (isNumber(precision)) {
        // add zeroes to give correct sig figs
        while (precision > c.length || e - newExp + 1 > c.length) {
          c.push(0);
        }
      } else {
        // concatenate coefficients with necessary zeros
        // add zeros if necessary (for example: 1e+8 -> 100e+6)
        var missingZeros = Math.abs(e - newExp) - (c.length - 1);
        for (var i = 0; i < missingZeros; i++) {
          c.push(0);
        }
      }

      // find difference in exponents
      var expDiff = Math.abs(e - newExp);
      var decimalIdx = 1;

      // push decimal index over by expDiff times
      while (expDiff > 0) {
        decimalIdx++;
        expDiff--;
      }

      // if all coefficient values are zero after the decimal point and precision is unset, don't add a decimal value.
      // otherwise concat with the rest of the coefficients
      var decimals = c.slice(decimalIdx).join('');
      var decimalVal = isNumber(precision) && decimals.length || decimals.match(/[1-9]/) ? '.' + decimals : '';
      var str = c.slice(0, decimalIdx).join('') + decimalVal + 'e' + (e >= 0 ? '+' : '') + newExp.toString();
      return rounded.sign + str;
    }

    /**
     * Format a number with fixed notation.
     * @param {number | string} value
     * @param {number} [precision=undefined]  Optional number of decimals after the
     *                                        decimal point. null by default.
     */
    function toFixed$1(value, precision) {
      if (isNaN(value) || !isFinite(value)) {
        return String(value);
      }
      var splitValue = splitNumber(value);
      var rounded = typeof precision === 'number' ? roundDigits(splitValue, splitValue.exponent + 1 + precision) : splitValue;
      var c = rounded.coefficients;
      var p = rounded.exponent + 1; // exponent may have changed

      // append zeros if needed
      var pp = p + (precision || 0);
      if (c.length < pp) {
        c = c.concat(zeros(pp - c.length));
      }

      // prepend zeros if needed
      if (p < 0) {
        c = zeros(-p + 1).concat(c);
        p = 1;
      }

      // insert a dot if needed
      if (p < c.length) {
        c.splice(p, 0, p === 0 ? '0.' : '.');
      }
      return rounded.sign + c.join('');
    }

    /**
     * Format a number in exponential notation. Like '1.23e+5', '2.3e+0', '3.500e-3'
     * @param {number | string} value
     * @param {number} [precision]  Number of digits in formatted output.
     *                              If not provided, the maximum available digits
     *                              is used.
     */
    function toExponential$1(value, precision) {
      if (isNaN(value) || !isFinite(value)) {
        return String(value);
      }

      // round if needed, else create a clone
      var split = splitNumber(value);
      var rounded = precision ? roundDigits(split, precision) : split;
      var c = rounded.coefficients;
      var e = rounded.exponent;

      // append zeros if needed
      if (c.length < precision) {
        c = c.concat(zeros(precision - c.length));
      }

      // format as `C.CCCe+EEE` or `C.CCCe-EEE`
      var first = c.shift();
      return rounded.sign + first + (c.length > 0 ? '.' + c.join('') : '') + 'e' + (e >= 0 ? '+' : '') + e;
    }

    /**
     * Format a number with a certain precision
     * @param {number | string} value
     * @param {number} [precision=undefined] Optional number of digits.
     * @param {{lowerExp: number | undefined, upperExp: number | undefined}} [options]
     *                                       By default:
     *                                         lowerExp = -3 (incl)
     *                                         upper = +5 (excl)
     * @return {string}
     */
    function toPrecision(value, precision, options) {
      if (isNaN(value) || !isFinite(value)) {
        return String(value);
      }

      // determine lower and upper bound for exponential notation.
      var lowerExp = options && options.lowerExp !== undefined ? options.lowerExp : -3;
      var upperExp = options && options.upperExp !== undefined ? options.upperExp : 5;
      var split = splitNumber(value);
      var rounded = precision ? roundDigits(split, precision) : split;
      if (rounded.exponent < lowerExp || rounded.exponent >= upperExp) {
        // exponential notation
        return toExponential$1(value, precision);
      } else {
        var c = rounded.coefficients;
        var e = rounded.exponent;

        // append trailing zeros
        if (c.length < precision) {
          c = c.concat(zeros(precision - c.length));
        }

        // append trailing zeros
        // TODO: simplify the next statement
        c = c.concat(zeros(e - c.length + 1 + (c.length < precision ? precision - c.length : 0)));

        // prepend zeros
        c = zeros(-e).concat(c);
        var dot = e > 0 ? e : 0;
        if (dot < c.length - 1) {
          c.splice(dot + 1, 0, '.');
        }
        return rounded.sign + c.join('');
      }
    }

    /**
     * Round the number of digits of a number *
     * @param {SplitValue} split       A value split with .splitNumber(value)
     * @param {number} precision  A positive integer
     * @return {SplitValue}
     *              Returns an object containing sign, coefficients, and exponent
     *              with rounded digits
     */
    function roundDigits(split, precision) {
      // create a clone
      var rounded = {
        sign: split.sign,
        coefficients: split.coefficients,
        exponent: split.exponent
      };
      var c = rounded.coefficients;

      // prepend zeros if needed
      while (precision <= 0) {
        c.unshift(0);
        rounded.exponent++;
        precision++;
      }
      if (c.length > precision) {
        var removed = c.splice(precision, c.length - precision);
        if (removed[0] >= 5) {
          var i = precision - 1;
          c[i]++;
          while (c[i] === 10) {
            c.pop();
            if (i === 0) {
              c.unshift(0);
              rounded.exponent++;
              i++;
            }
            i--;
            c[i]++;
          }
        }
      }
      return rounded;
    }

    /**
     * Create an array filled with zeros.
     * @param {number} length
     * @return {Array}
     */
    function zeros(length) {
      var arr = [];
      for (var i = 0; i < length; i++) {
        arr.push(0);
      }
      return arr;
    }

    /**
     * Count the number of significant digits of a number.
     *
     * For example:
     *   2.34 returns 3
     *   0.0034 returns 2
     *   120.5e+30 returns 4
     *
     * @param {number} value
     * @return {number} digits   Number of significant digits
     */
    function digits(value) {
      return value.toExponential().replace(/e.*$/, '') // remove exponential notation
      .replace(/^0\.?0*|\./, '') // remove decimal point and leading zeros
      .length;
    }

    /**
     * Formats a BigNumber in a given base
     * @param {BigNumber} n
     * @param {number} base
     * @param {number} size
     * @returns {string}
     */
    function formatBigNumberToBase(n, base, size) {
      var BigNumberCtor = n.constructor;
      var big2 = new BigNumberCtor(2);
      var suffix = '';
      if (size) {
        if (size < 1) {
          throw new Error('size must be in greater than 0');
        }
        if (!isInteger(size)) {
          throw new Error('size must be an integer');
        }
        if (n.greaterThan(big2.pow(size - 1).sub(1)) || n.lessThan(big2.pow(size - 1).mul(-1))) {
          throw new Error("Value must be in range [-2^".concat(size - 1, ", 2^").concat(size - 1, "-1]"));
        }
        if (!n.isInteger()) {
          throw new Error('Value must be an integer');
        }
        if (n.lessThan(0)) {
          n = n.add(big2.pow(size));
        }
        suffix = "i".concat(size);
      }
      switch (base) {
        case 2:
          return "".concat(n.toBinary()).concat(suffix);
        case 8:
          return "".concat(n.toOctal()).concat(suffix);
        case 16:
          return "".concat(n.toHexadecimal()).concat(suffix);
        default:
          throw new Error("Base ".concat(base, " not supported "));
      }
    }

    /**
     * Convert a BigNumber to a formatted string representation.
     *
     * Syntax:
     *
     *    format(value)
     *    format(value, options)
     *    format(value, precision)
     *    format(value, fn)
     *
     * Where:
     *
     *    {number} value   The value to be formatted
     *    {Object} options An object with formatting options. Available options:
     *                     {string} notation
     *                         Number notation. Choose from:
     *                         'fixed'          Always use regular number notation.
     *                                          For example '123.40' and '14000000'
     *                         'exponential'    Always use exponential notation.
     *                                          For example '1.234e+2' and '1.4e+7'
     *                         'auto' (default) Regular number notation for numbers
     *                                          having an absolute value between
     *                                          `lower` and `upper` bounds, and uses
     *                                          exponential notation elsewhere.
     *                                          Lower bound is included, upper bound
     *                                          is excluded.
     *                                          For example '123.4' and '1.4e7'.
     *                         'bin', 'oct, or
     *                         'hex'            Format the number using binary, octal,
     *                                          or hexadecimal notation.
     *                                          For example '0b1101' and '0x10fe'.
     *                     {number} wordSize    The word size in bits to use for formatting
     *                                          in binary, octal, or hexadecimal notation.
     *                                          To be used only with 'bin', 'oct', or 'hex'
     *                                          values for 'notation' option. When this option
     *                                          is defined the value is formatted as a signed
     *                                          twos complement integer of the given word size
     *                                          and the size suffix is appended to the output.
     *                                          For example
     *                                          format(-1, {notation: 'hex', wordSize: 8}) === '0xffi8'.
     *                                          Default value is undefined.
     *                     {number} precision   A number between 0 and 16 to round
     *                                          the digits of the number.
     *                                          In case of notations 'exponential',
     *                                          'engineering', and 'auto',
     *                                          `precision` defines the total
     *                                          number of significant digits returned.
     *                                          In case of notation 'fixed',
     *                                          `precision` defines the number of
     *                                          significant digits after the decimal
     *                                          point.
     *                                          `precision` is undefined by default.
     *                     {number} lowerExp    Exponent determining the lower boundary
     *                                          for formatting a value with an exponent
     *                                          when `notation='auto`.
     *                                          Default value is `-3`.
     *                     {number} upperExp    Exponent determining the upper boundary
     *                                          for formatting a value with an exponent
     *                                          when `notation='auto`.
     *                                          Default value is `5`.
     *    {Function} fn    A custom formatting function. Can be used to override the
     *                     built-in notations. Function `fn` is called with `value` as
     *                     parameter and must return a string. Is useful for example to
     *                     format all values inside a matrix in a particular way.
     *
     * Examples:
     *
     *    format(6.4)                                        // '6.4'
     *    format(1240000)                                    // '1.24e6'
     *    format(1/3)                                        // '0.3333333333333333'
     *    format(1/3, 3)                                     // '0.333'
     *    format(21385, 2)                                   // '21000'
     *    format(12e8, {notation: 'fixed'})                  // returns '1200000000'
     *    format(2.3,    {notation: 'fixed', precision: 4})  // returns '2.3000'
     *    format(52.8,   {notation: 'exponential'})          // returns '5.28e+1'
     *    format(12400,  {notation: 'engineering'})          // returns '12.400e+3'
     *
     * @param {BigNumber} value
     * @param {Object | Function | number} [options]
     * @return {string} str The formatted value
     */
    function format$1(value, options) {
      if (typeof options === 'function') {
        // handle format(value, fn)
        return options(value);
      }

      // handle special cases
      if (!value.isFinite()) {
        return value.isNaN() ? 'NaN' : value.gt(0) ? 'Infinity' : '-Infinity';
      }

      // default values for options
      var notation = 'auto';
      var precision;
      var wordSize;
      if (options !== undefined) {
        // determine notation from options
        if (options.notation) {
          notation = options.notation;
        }

        // determine precision from options
        if (typeof options === 'number') {
          precision = options;
        } else if (options.precision) {
          precision = options.precision;
        }
        if (options.wordSize) {
          wordSize = options.wordSize;
          if (typeof wordSize !== 'number') {
            throw new Error('Option "wordSize" must be a number');
          }
        }
      }

      // handle the various notations
      switch (notation) {
        case 'fixed':
          return toFixed(value, precision);
        case 'exponential':
          return toExponential(value, precision);
        case 'engineering':
          return toEngineering(value, precision);
        case 'bin':
          return formatBigNumberToBase(value, 2, wordSize);
        case 'oct':
          return formatBigNumberToBase(value, 8, wordSize);
        case 'hex':
          return formatBigNumberToBase(value, 16, wordSize);
        case 'auto':
          {
            // determine lower and upper bound for exponential notation.
            // TODO: implement support for upper and lower to be BigNumbers themselves
            var lowerExp = options && options.lowerExp !== undefined ? options.lowerExp : -3;
            var upperExp = options && options.upperExp !== undefined ? options.upperExp : 5;

            // handle special case zero
            if (value.isZero()) return '0';

            // determine whether or not to output exponential notation
            var str;
            var rounded = value.toSignificantDigits(precision);
            var exp = rounded.e;
            if (exp >= lowerExp && exp < upperExp) {
              // normal number notation
              str = rounded.toFixed();
            } else {
              // exponential notation
              str = toExponential(value, precision);
            }

            // remove trailing zeros after the decimal point
            return str.replace(/((\.\d*?)(0+))($|e)/, function () {
              var digits = arguments[2];
              var e = arguments[4];
              return digits !== '.' ? digits + e : e;
            });
          }
        default:
          throw new Error('Unknown notation "' + notation + '". ' + 'Choose "auto", "exponential", "fixed", "bin", "oct", or "hex.');
      }
    }

    /**
     * Format a BigNumber in engineering notation. Like '1.23e+6', '2.3e+0', '3.500e-3'
     * @param {BigNumber | string} value
     * @param {number} [precision]        Optional number of significant figures to return.
     */
    function toEngineering(value, precision) {
      // find nearest lower multiple of 3 for exponent
      var e = value.e;
      var newExp = e % 3 === 0 ? e : e < 0 ? e - 3 - e % 3 : e - e % 3;

      // find difference in exponents, and calculate the value without exponent
      var valueWithoutExp = value.mul(Math.pow(10, -newExp));
      var valueStr = valueWithoutExp.toPrecision(precision);
      if (valueStr.indexOf('e') !== -1) {
        valueStr = valueWithoutExp.toString();
      }
      return valueStr + 'e' + (e >= 0 ? '+' : '') + newExp.toString();
    }

    /**
     * Format a number in exponential notation. Like '1.23e+5', '2.3e+0', '3.500e-3'
     * @param {BigNumber} value
     * @param {number} [precision]  Number of digits in formatted output.
     *                              If not provided, the maximum available digits
     *                              is used.
     * @returns {string} str
     */
    function toExponential(value, precision) {
      if (precision !== undefined) {
        return value.toExponential(precision - 1); // Note the offset of one
      } else {
        return value.toExponential();
      }
    }

    /**
     * Format a number with fixed notation.
     * @param {BigNumber} value
     * @param {number} [precision=undefined] Optional number of decimals after the
     *                                       decimal point. Undefined by default.
     */
    function toFixed(value, precision) {
      return value.toFixed(precision);
    }

    /**
     * Format a value of any type into a string.
     *
     * Usage:
     *     math.format(value)
     *     math.format(value, precision)
     *     math.format(value, options)
     *
     * When value is a function:
     *
     * - When the function has a property `syntax`, it returns this
     *   syntax description.
     * - In other cases, a string `'function'` is returned.
     *
     * When `value` is an Object:
     *
     * - When the object contains a property `format` being a function, this
     *   function is invoked as `value.format(options)` and the result is returned.
     * - When the object has its own `toString` method, this method is invoked
     *   and the result is returned.
     * - In other cases the function will loop over all object properties and
     *   return JSON object notation like '{"a": 2, "b": 3}'.
     *
     * Example usage:
     *     math.format(2/7)                // '0.2857142857142857'
     *     math.format(math.pi, 3)         // '3.14'
     *     math.format(new Complex(2, 3))  // '2 + 3i'
     *     math.format('hello')            // '"hello"'
     *
     * @param {*} value             Value to be stringified
     * @param {Object | number | Function} [options]
     *     Formatting options. See src/utils/number.js:format for a
     *     description of the available options controlling number output.
     *     This generic "format" also supports the option property `truncate: NN`
     *     giving the maximum number NN of characters to return (if there would
     *     have been more, they are deleted and replaced by an ellipsis).
     * @return {string} str
     */
    function format(value, options) {
      var result = _format(value, options);
      if (options && typeof options === 'object' && 'truncate' in options && result.length > options.truncate) {
        return result.substring(0, options.truncate - 3) + '...';
      }
      return result;
    }
    function _format(value, options) {
      if (typeof value === 'number') {
        return format$2(value, options);
      }
      if (isBigNumber(value)) {
        return format$1(value, options);
      }

      // note: we use unsafe duck-typing here to check for Fractions, this is
      // ok here since we're only invoking toString or concatenating its values
      if (looksLikeFraction(value)) {
        if (!options || options.fraction !== 'decimal') {
          // output as ratio, like '1/3'
          return value.s * value.n + '/' + value.d;
        } else {
          // output as decimal, like '0.(3)'
          return value.toString();
        }
      }
      if (Array.isArray(value)) {
        return formatArray(value, options);
      }
      if (isString(value)) {
        return '"' + value + '"';
      }
      if (typeof value === 'function') {
        return value.syntax ? String(value.syntax) : 'function';
      }
      if (value && typeof value === 'object') {
        if (typeof value.format === 'function') {
          return value.format(options);
        } else if (value && value.toString(options) !== {}.toString()) {
          // this object has a non-native toString method, use that one
          return value.toString(options);
        } else {
          var entries = Object.keys(value).map(key => {
            return '"' + key + '": ' + format(value[key], options);
          });
          return '{' + entries.join(', ') + '}';
        }
      }
      return String(value);
    }

    /**
     * Recursively format an n-dimensional matrix
     * Example output: "[[1, 2], [3, 4]]"
     * @param {Array} array
     * @param {Object | number | Function} [options]  Formatting options. See
     *                                                lib/utils/number:format for a
     *                                                description of the available
     *                                                options.
     * @returns {string} str
     */
    function formatArray(array, options) {
      if (Array.isArray(array)) {
        var str = '[';
        var len = array.length;
        for (var i = 0; i < len; i++) {
          if (i !== 0) {
            str += ', ';
          }
          str += formatArray(array[i], options);
        }
        str += ']';
        return str;
      } else {
        return format(array, options);
      }
    }

    /**
     * Check whether a value looks like a Fraction (unsafe duck-type check)
     * @param {*} value
     * @return {boolean}
     */
    function looksLikeFraction(value) {
      return value && typeof value === 'object' && typeof value.s === 'number' && typeof value.n === 'number' && typeof value.d === 'number' || false;
    }

    /**
     * Create a range error with the message:
     *     'Dimension mismatch (<actual size> != <expected size>)'
     * @param {number | number[]} actual        The actual size
     * @param {number | number[]} expected      The expected size
     * @param {string} [relation='!=']          Optional relation between actual
     *                                          and expected size: '!=', '<', etc.
     * @extends RangeError
     */
    function DimensionError(actual, expected, relation) {
      if (!(this instanceof DimensionError)) {
        throw new SyntaxError('Constructor must be called with the new operator');
      }
      this.actual = actual;
      this.expected = expected;
      this.relation = relation;
      this.message = 'Dimension mismatch (' + (Array.isArray(actual) ? '[' + actual.join(', ') + ']' : actual) + ' ' + (this.relation || '!=') + ' ' + (Array.isArray(expected) ? '[' + expected.join(', ') + ']' : expected) + ')';
      this.stack = new Error().stack;
    }
    DimensionError.prototype = new RangeError();
    DimensionError.prototype.constructor = RangeError;
    DimensionError.prototype.name = 'DimensionError';
    DimensionError.prototype.isDimensionError = true;

    /**
     * Create a range error with the message:
     *     'Index out of range (index < min)'
     *     'Index out of range (index < max)'
     *
     * @param {number} index     The actual index
     * @param {number} [min=0]   Minimum index (included)
     * @param {number} [max]     Maximum index (excluded)
     * @extends RangeError
     */
    function IndexError(index, min, max) {
      if (!(this instanceof IndexError)) {
        throw new SyntaxError('Constructor must be called with the new operator');
      }
      this.index = index;
      if (arguments.length < 3) {
        this.min = 0;
        this.max = min;
      } else {
        this.min = min;
        this.max = max;
      }
      if (this.min !== undefined && this.index < this.min) {
        this.message = 'Index out of range (' + this.index + ' < ' + this.min + ')';
      } else if (this.max !== undefined && this.index >= this.max) {
        this.message = 'Index out of range (' + this.index + ' > ' + (this.max - 1) + ')';
      } else {
        this.message = 'Index out of range (' + this.index + ')';
      }
      this.stack = new Error().stack;
    }
    IndexError.prototype = new RangeError();
    IndexError.prototype.constructor = RangeError;
    IndexError.prototype.name = 'IndexError';
    IndexError.prototype.isIndexError = true;

    /**
     * Calculate the size of a multi dimensional array.
     * This function checks the size of the first entry, it does not validate
     * whether all dimensions match. (use function `validate` for that)
     * @param {Array} x
     * @Return {Number[]} size
     */
    function arraySize(x) {
      var s = [];
      while (Array.isArray(x)) {
        s.push(x.length);
        x = x[0];
      }
      return s;
    }

    /**
     * Recursively validate whether each element in a multi dimensional array
     * has a size corresponding to the provided size array.
     * @param {Array} array    Array to be validated
     * @param {number[]} size  Array with the size of each dimension
     * @param {number} dim   Current dimension
     * @throws DimensionError
     * @private
     */
    function _validate(array, size, dim) {
      var i;
      var len = array.length;
      if (len !== size[dim]) {
        throw new DimensionError(len, size[dim]);
      }
      if (dim < size.length - 1) {
        // recursively validate each child array
        var dimNext = dim + 1;
        for (i = 0; i < len; i++) {
          var child = array[i];
          if (!Array.isArray(child)) {
            throw new DimensionError(size.length - 1, size.length, '<');
          }
          _validate(array[i], size, dimNext);
        }
      } else {
        // last dimension. none of the childs may be an array
        for (i = 0; i < len; i++) {
          if (Array.isArray(array[i])) {
            throw new DimensionError(size.length + 1, size.length, '>');
          }
        }
      }
    }

    /**
     * Validate whether each element in a multi dimensional array has
     * a size corresponding to the provided size array.
     * @param {Array} array    Array to be validated
     * @param {number[]} size  Array with the size of each dimension
     * @throws DimensionError
     */
    function validate(array, size) {
      var isScalar = size.length === 0;
      if (isScalar) {
        // scalar
        if (Array.isArray(array)) {
          throw new DimensionError(array.length, 0);
        }
      } else {
        // array
        _validate(array, size, 0);
      }
    }

    /**
     * Test whether index is an integer number with index >= 0 and index < length
     * when length is provided
     * @param {number} index    Zero-based index
     * @param {number} [length] Length of the array
     */
    function validateIndex(index, length) {
      if (!isNumber(index) || !isInteger(index)) {
        throw new TypeError('Index must be an integer (value: ' + index + ')');
      }
      if (index < 0 || typeof length === 'number' && index >= length) {
        throw new IndexError(index, length);
      }
    }

    /**
     * Resize a multi dimensional array. The resized array is returned.
     * @param {Array} array         Array to be resized
     * @param {Array.<number>} size Array with the size of each dimension
     * @param {*} [defaultValue=0]  Value to be filled in in new entries,
     *                              zero by default. Specify for example `null`,
     *                              to clearly see entries that are not explicitly
     *                              set.
     * @return {Array} array         The resized array
     */
    function resize(array, size, defaultValue) {
      // TODO: add support for scalars, having size=[] ?

      // check the type of the arguments
      if (!Array.isArray(array) || !Array.isArray(size)) {
        throw new TypeError('Array expected');
      }
      if (size.length === 0) {
        throw new Error('Resizing to scalar is not supported');
      }

      // check whether size contains positive integers
      size.forEach(function (value) {
        if (!isNumber(value) || !isInteger(value) || value < 0) {
          throw new TypeError('Invalid size, must contain positive integers ' + '(size: ' + format(size) + ')');
        }
      });

      // recursively resize the array
      var _defaultValue = defaultValue !== undefined ? defaultValue : 0;
      _resize(array, size, 0, _defaultValue);
      return array;
    }

    /**
     * Recursively resize a multi dimensional array
     * @param {Array} array         Array to be resized
     * @param {number[]} size       Array with the size of each dimension
     * @param {number} dim          Current dimension
     * @param {*} [defaultValue]    Value to be filled in in new entries,
     *                              undefined by default.
     * @private
     */
    function _resize(array, size, dim, defaultValue) {
      var i;
      var elem;
      var oldLen = array.length;
      var newLen = size[dim];
      var minLen = Math.min(oldLen, newLen);

      // apply new length
      array.length = newLen;
      if (dim < size.length - 1) {
        // non-last dimension
        var dimNext = dim + 1;

        // resize existing child arrays
        for (i = 0; i < minLen; i++) {
          // resize child array
          elem = array[i];
          if (!Array.isArray(elem)) {
            elem = [elem]; // add a dimension
            array[i] = elem;
          }
          _resize(elem, size, dimNext, defaultValue);
        }

        // create new child arrays
        for (i = minLen; i < newLen; i++) {
          // get child array
          elem = [];
          array[i] = elem;

          // resize new child array
          _resize(elem, size, dimNext, defaultValue);
        }
      } else {
        // last dimension

        // remove dimensions of existing values
        for (i = 0; i < minLen; i++) {
          while (Array.isArray(array[i])) {
            array[i] = array[i][0];
          }
        }

        // fill new elements with the default value
        for (i = minLen; i < newLen; i++) {
          array[i] = defaultValue;
        }
      }
    }

    /**
     * Re-shape a multi dimensional array to fit the specified dimensions
     * @param {Array} array           Array to be reshaped
     * @param {Array.<number>} sizes  List of sizes for each dimension
     * @returns {Array}               Array whose data has been formatted to fit the
     *                                specified dimensions
     *
     * @throws {DimensionError}       If the product of the new dimension sizes does
     *                                not equal that of the old ones
     */
    function reshape(array, sizes) {
      var flatArray = flatten(array);
      var currentLength = flatArray.length;
      if (!Array.isArray(array) || !Array.isArray(sizes)) {
        throw new TypeError('Array expected');
      }
      if (sizes.length === 0) {
        throw new DimensionError(0, currentLength, '!=');
      }
      sizes = processSizesWildcard(sizes, currentLength);
      var newLength = product(sizes);
      if (currentLength !== newLength) {
        throw new DimensionError(newLength, currentLength, '!=');
      }
      try {
        return _reshape(flatArray, sizes);
      } catch (e) {
        if (e instanceof DimensionError) {
          throw new DimensionError(newLength, currentLength, '!=');
        }
        throw e;
      }
    }

    /**
     * Replaces the wildcard -1 in the sizes array.
     * @param {Array.<number>} sizes  List of sizes for each dimension. At most on wildcard.
     * @param {number} currentLength  Number of elements in the array.
     * @throws {Error}                If more than one wildcard or unable to replace it.
     * @returns {Array.<number>}      The sizes array with wildcard replaced.
     */
    function processSizesWildcard(sizes, currentLength) {
      var newLength = product(sizes);
      var processedSizes = sizes.slice();
      var WILDCARD = -1;
      var wildCardIndex = sizes.indexOf(WILDCARD);
      var isMoreThanOneWildcard = sizes.indexOf(WILDCARD, wildCardIndex + 1) >= 0;
      if (isMoreThanOneWildcard) {
        throw new Error('More than one wildcard in sizes');
      }
      var hasWildcard = wildCardIndex >= 0;
      var canReplaceWildcard = currentLength % newLength === 0;
      if (hasWildcard) {
        if (canReplaceWildcard) {
          processedSizes[wildCardIndex] = -currentLength / newLength;
        } else {
          throw new Error('Could not replace wildcard, since ' + currentLength + ' is no multiple of ' + -newLength);
        }
      }
      return processedSizes;
    }

    /**
     * Computes the product of all array elements.
     * @param {Array<number>} array Array of factors
     * @returns {number}            Product of all elements
     */
    function product(array) {
      return array.reduce((prev, curr) => prev * curr, 1);
    }

    /**
     * Iteratively re-shape a multi dimensional array to fit the specified dimensions
     * @param {Array} array           Array to be reshaped
     * @param {Array.<number>} sizes  List of sizes for each dimension
     * @returns {Array}               Array whose data has been formatted to fit the
     *                                specified dimensions
     */

    function _reshape(array, sizes) {
      // testing if there are enough elements for the requested shape
      var tmpArray = array;
      var tmpArray2;
      // for each dimensions starting by the last one and ignoring the first one
      for (var sizeIndex = sizes.length - 1; sizeIndex > 0; sizeIndex--) {
        var size = sizes[sizeIndex];
        tmpArray2 = [];

        // aggregate the elements of the current tmpArray in elements of the requested size
        var length = tmpArray.length / size;
        for (var i = 0; i < length; i++) {
          tmpArray2.push(tmpArray.slice(i * size, (i + 1) * size));
        }
        // set it as the new tmpArray for the next loop turn or for return
        tmpArray = tmpArray2;
      }
      return tmpArray;
    }

    /**
     * Unsqueeze a multi dimensional array: add dimensions when missing
     *
     * Paramter `size` will be mutated to match the new, unqueezed matrix size.
     *
     * @param {Array} array
     * @param {number} dims       Desired number of dimensions of the array
     * @param {number} [outer]    Number of outer dimensions to be added
     * @param {Array} [size] Current size of array.
     * @returns {Array} returns the array itself
     * @private
     */
    function unsqueeze(array, dims, outer, size) {
      var s = size || arraySize(array);

      // unsqueeze outer dimensions
      if (outer) {
        for (var i = 0; i < outer; i++) {
          array = [array];
          s.unshift(1);
        }
      }

      // unsqueeze inner dimensions
      array = _unsqueeze(array, dims, 0);
      while (s.length < dims) {
        s.push(1);
      }
      return array;
    }

    /**
     * Recursively unsqueeze a multi dimensional array
     * @param {Array} array
     * @param {number} dims Required number of dimensions
     * @param {number} dim  Current dimension
     * @returns {Array | *} Returns the squeezed array
     * @private
     */
    function _unsqueeze(array, dims, dim) {
      var i, ii;
      if (Array.isArray(array)) {
        var next = dim + 1;
        for (i = 0, ii = array.length; i < ii; i++) {
          array[i] = _unsqueeze(array[i], dims, next);
        }
      } else {
        for (var d = dim; d < dims; d++) {
          array = [array];
        }
      }
      return array;
    }
    /**
     * Flatten a multi dimensional array, put all elements in a one dimensional
     * array
     * @param {Array} array   A multi dimensional array
     * @return {Array}        The flattened array (1 dimensional)
     */
    function flatten(array) {
      if (!Array.isArray(array)) {
        // if not an array, return as is
        return array;
      }
      var flat = [];
      array.forEach(function callback(value) {
        if (Array.isArray(value)) {
          value.forEach(callback); // traverse through sub-arrays recursively
        } else {
          flat.push(value);
        }
      });
      return flat;
    }

    /**
     * Check the datatype of a given object
     * This is a low level implementation that should only be used by
     * parent Matrix classes such as SparseMatrix or DenseMatrix
     * This method does not validate Array Matrix shape
     * @param {Array} array
     * @param {function} typeOf   Callback function to use to determine the type of a value
     * @return {string}
     */
    function getArrayDataType(array, typeOf) {
      var type; // to hold type info
      var length = 0; // to hold length value to ensure it has consistent sizes

      for (var i = 0; i < array.length; i++) {
        var item = array[i];
        var isArray = Array.isArray(item);

        // Saving the target matrix row size
        if (i === 0 && isArray) {
          length = item.length;
        }

        // If the current item is an array but the length does not equal the targetVectorSize
        if (isArray && item.length !== length) {
          return undefined;
        }
        var itemType = isArray ? getArrayDataType(item, typeOf) // recurse into a nested array
        : typeOf(item);
        if (type === undefined) {
          type = itemType; // first item
        } else if (type !== itemType) {
          return 'mixed';
        } else ;
      }
      return type;
    }

    /**
     * Create a factory function, which can be used to inject dependencies.
     *
     * The created functions are memoized, a consecutive call of the factory
     * with the exact same inputs will return the same function instance.
     * The memoized cache is exposed on `factory.cache` and can be cleared
     * if needed.
     *
     * Example:
     *
     *     const name = 'log'
     *     const dependencies = ['config', 'typed', 'divideScalar', 'Complex']
     *
     *     export const createLog = factory(name, dependencies, ({ typed, config, divideScalar, Complex }) => {
     *       // ... create the function log here and return it
     *     }
     *
     * @param {string} name           Name of the function to be created
     * @param {string[]} dependencies The names of all required dependencies
     * @param {function} create       Callback function called with an object with all dependencies
     * @param {Object} [meta]         Optional object with meta information that will be attached
     *                                to the created factory function as property `meta`.
     * @returns {function}
     */
    function factory(name, dependencies, create, meta) {
      function assertAndCreate(scope) {
        // we only pass the requested dependencies to the factory function
        // to prevent functions to rely on dependencies that are not explicitly
        // requested.
        var deps = pickShallow(scope, dependencies.map(stripOptionalNotation));
        assertDependencies(name, dependencies, scope);
        return create(deps);
      }
      assertAndCreate.isFactory = true;
      assertAndCreate.fn = name;
      assertAndCreate.dependencies = dependencies.slice().sort();
      if (meta) {
        assertAndCreate.meta = meta;
      }
      return assertAndCreate;
    }

    /**
     * Assert that all dependencies of a list with dependencies are available in the provided scope.
     *
     * Will throw an exception when there are dependencies missing.
     *
     * @param {string} name   Name for the function to be created. Used to generate a useful error message
     * @param {string[]} dependencies
     * @param {Object} scope
     */
    function assertDependencies(name, dependencies, scope) {
      var allDefined = dependencies.filter(dependency => !isOptionalDependency(dependency)) // filter optionals
      .every(dependency => scope[dependency] !== undefined);
      if (!allDefined) {
        var missingDependencies = dependencies.filter(dependency => scope[dependency] === undefined);

        // TODO: create a custom error class for this, a MathjsError or something like that
        throw new Error("Cannot create function \"".concat(name, "\", ") + "some dependencies are missing: ".concat(missingDependencies.map(d => "\"".concat(d, "\"")).join(', '), "."));
      }
    }
    function isOptionalDependency(dependency) {
      return dependency && dependency[0] === '?';
    }
    function stripOptionalNotation(dependency) {
      return dependency && dependency[0] === '?' ? dependency.slice(1) : dependency;
    }

    /**
     * Get a property of a plain object
     * Throws an error in case the object is not a plain object or the
     * property is not defined on the object itself
     * @param {Object} object
     * @param {string} prop
     * @return {*} Returns the property value when safe
     */
    function getSafeProperty(object, prop) {
      // only allow getting safe properties of a plain object
      if (isPlainObject(object) && isSafeProperty(object, prop)) {
        return object[prop];
      }
      if (typeof object[prop] === 'function' && isSafeMethod(object, prop)) {
        throw new Error('Cannot access method "' + prop + '" as a property');
      }
      throw new Error('No access to property "' + prop + '"');
    }

    /**
     * Set a property on a plain object.
     * Throws an error in case the object is not a plain object or the
     * property would override an inherited property like .constructor or .toString
     * @param {Object} object
     * @param {string} prop
     * @param {*} value
     * @return {*} Returns the value
     */
    // TODO: merge this function into access.js?
    function setSafeProperty(object, prop, value) {
      // only allow setting safe properties of a plain object
      if (isPlainObject(object) && isSafeProperty(object, prop)) {
        object[prop] = value;
        return value;
      }
      throw new Error('No access to property "' + prop + '"');
    }
    function hasSafeProperty(object, prop) {
      return prop in object;
    }

    /**
     * Test whether a property is safe to use for an object.
     * For example .toString and .constructor are not safe
     * @param {string} prop
     * @return {boolean} Returns true when safe
     */
    function isSafeProperty(object, prop) {
      if (!object || typeof object !== 'object') {
        return false;
      }
      // SAFE: whitelisted
      // e.g length
      if (hasOwnProperty$1(safeNativeProperties, prop)) {
        return true;
      }
      // UNSAFE: inherited from Object prototype
      // e.g constructor
      if (prop in Object.prototype) {
        // 'in' is used instead of hasOwnProperty for nodejs v0.10
        // which is inconsistent on root prototypes. It is safe
        // here because Object.prototype is a root object
        return false;
      }
      // UNSAFE: inherited from Function prototype
      // e.g call, apply
      if (prop in Function.prototype) {
        // 'in' is used instead of hasOwnProperty for nodejs v0.10
        // which is inconsistent on root prototypes. It is safe
        // here because Function.prototype is a root object
        return false;
      }
      return true;
    }

    /**
     * Check whether a method is safe.
     * Throws an error when that's not the case (for example for `constructor`).
     * @param {Object} object
     * @param {string} method
     * @return {boolean} Returns true when safe, false otherwise
     */
    function isSafeMethod(object, method) {
      if (object === null || object === undefined || typeof object[method] !== 'function') {
        return false;
      }
      // UNSAFE: ghosted
      // e.g overridden toString
      // Note that IE10 doesn't support __proto__ and we can't do this check there.
      if (hasOwnProperty$1(object, method) && Object.getPrototypeOf && method in Object.getPrototypeOf(object)) {
        return false;
      }
      // SAFE: whitelisted
      // e.g toString
      if (hasOwnProperty$1(safeNativeMethods, method)) {
        return true;
      }
      // UNSAFE: inherited from Object prototype
      // e.g constructor
      if (method in Object.prototype) {
        // 'in' is used instead of hasOwnProperty for nodejs v0.10
        // which is inconsistent on root prototypes. It is safe
        // here because Object.prototype is a root object
        return false;
      }
      // UNSAFE: inherited from Function prototype
      // e.g call, apply
      if (method in Function.prototype) {
        // 'in' is used instead of hasOwnProperty for nodejs v0.10
        // which is inconsistent on root prototypes. It is safe
        // here because Function.prototype is a root object
        return false;
      }
      return true;
    }
    function isPlainObject(object) {
      return typeof object === 'object' && object && object.constructor === Object;
    }
    var safeNativeProperties = {
      length: true,
      name: true
    };
    var safeNativeMethods = {
      toString: true,
      valueOf: true,
      toLocaleString: true
    };

    /**
     * A map facade on a bare object.
     *
     * The small number of methods needed to implement a scope,
     * forwarding on to the SafeProperty functions. Over time, the codebase
     * will stop using this method, as all objects will be Maps, rather than
     * more security prone objects.
     */
    class ObjectWrappingMap {
      constructor(object) {
        this.wrappedObject = object;
      }
      keys() {
        return Object.keys(this.wrappedObject);
      }
      get(key) {
        return getSafeProperty(this.wrappedObject, key);
      }
      set(key, value) {
        setSafeProperty(this.wrappedObject, key, value);
        return this;
      }
      has(key) {
        return hasSafeProperty(this.wrappedObject, key);
      }
    }

    /**
     * Returns `true` if the passed object appears to be a Map (i.e. duck typing).
     *
     * Methods looked for are `get`, `set`, `keys` and `has`.
     *
     * @param {Map | object} object
     * @returns
     */
    function isMap(object) {
      // We can use the fast instanceof, or a slower duck typing check.
      // The duck typing method needs to cover enough methods to not be confused with DenseMatrix.
      if (!object) {
        return false;
      }
      return object instanceof Map || object instanceof ObjectWrappingMap || typeof object.set === 'function' && typeof object.get === 'function' && typeof object.keys === 'function' && typeof object.has === 'function';
    }

    /**
     * Create a typed-function which checks the types of the arguments and
     * can match them against multiple provided signatures. The typed-function
     * automatically converts inputs in order to find a matching signature.
     * Typed functions throw informative errors in case of wrong input arguments.
     *
     * See the library [typed-function](https://github.com/josdejong/typed-function)
     * for detailed documentation.
     *
     * Syntax:
     *
     *     math.typed(name, signatures) : function
     *     math.typed(signatures) : function
     *
     * Examples:
     *
     *     // create a typed function with multiple types per argument (type union)
     *     const fn2 = typed({
     *       'number | boolean': function (b) {
     *         return 'b is a number or boolean'
     *       },
     *       'string, number | boolean': function (a, b) {
     *         return 'a is a string, b is a number or boolean'
     *       }
     *     })
     *
     *     // create a typed function with an any type argument
     *     const log = typed({
     *       'string, any': function (event, data) {
     *         console.log('event: ' + event + ', data: ' + JSON.stringify(data))
     *       }
     *     })
     *
     * @param {string} [name]                          Optional name for the typed-function
     * @param {Object<string, function>} signatures   Object with one or multiple function signatures
     * @returns {function} The created typed-function.
     */

    // returns a new instance of typed-function
    var _createTyped2 = function _createTyped() {
      // initially, return the original instance of typed-function
      // consecutively, return a new instance from typed.create.
      _createTyped2 = typedFunction.create;
      return typedFunction;
    };
    var dependencies$a = ['?BigNumber', '?Complex', '?DenseMatrix', '?Fraction'];

    /**
     * Factory function for creating a new typed instance
     * @param {Object} dependencies   Object with data types like Complex and BigNumber
     * @returns {Function}
     */
    var createTyped = /* #__PURE__ */factory('typed', dependencies$a, function createTyped(_ref) {
      var {
        BigNumber,
        Complex,
        DenseMatrix,
        Fraction
      } = _ref;
      // TODO: typed-function must be able to silently ignore signatures with unknown data types

      // get a new instance of typed-function
      var typed = _createTyped2();

      // define all types. The order of the types determines in which order function
      // arguments are type-checked (so for performance it's important to put the
      // most used types first).
      typed.clear();
      typed.addTypes([{
        name: 'number',
        test: isNumber
      }, {
        name: 'Complex',
        test: isComplex
      }, {
        name: 'BigNumber',
        test: isBigNumber
      }, {
        name: 'Fraction',
        test: isFraction
      }, {
        name: 'Unit',
        test: isUnit
      },
      // The following type matches a valid variable name, i.e., an alphanumeric
      // string starting with an alphabetic character. It is used (at least)
      // in the definition of the derivative() function, as the argument telling
      // what to differentiate over must (currently) be a variable.
      {
        name: 'identifier',
        test: s => isString && /^(?:[A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088E\u08A0-\u08C9\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C5D\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u1711\u171F-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4C\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7CA\uA7D0\uA7D1\uA7D3\uA7D5-\uA7D9\uA7F2-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF40\uDF42-\uDF49\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDD70-\uDD7A\uDD7C-\uDD8A\uDD8C-\uDD92\uDD94\uDD95\uDD97-\uDDA1\uDDA3-\uDDB1\uDDB3-\uDDB9\uDDBB\uDDBC\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67\uDF80-\uDF85\uDF87-\uDFB0\uDFB2-\uDFBA]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD23\uDE80-\uDEA9\uDEB0\uDEB1\uDF00-\uDF1C\uDF27\uDF30-\uDF45\uDF70-\uDF81\uDFB0-\uDFC4\uDFE0-\uDFF6]|\uD804[\uDC03-\uDC37\uDC71\uDC72\uDC75\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD44\uDD47\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC5F-\uDC61\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDEB8\uDF00-\uDF1A\uDF40-\uDF46]|\uD806[\uDC00-\uDC2B\uDCA0-\uDCDF\uDCFF-\uDD06\uDD09\uDD0C-\uDD13\uDD15\uDD16\uDD18-\uDD2F\uDD3F\uDD41\uDDA0-\uDDA7\uDDAA-\uDDD0\uDDE1\uDDE3\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE89\uDE9D\uDEB0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDEE0-\uDEF2\uDFB0]|\uD808[\uDC00-\uDF99]|\uD809[\uDC80-\uDD43]|\uD80B[\uDF90-\uDFF0]|[\uD80C\uD81C-\uD820\uD822\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE70-\uDEBE\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE7F\uDF00-\uDF4A\uDF50\uDF93-\uDF9F\uDFE0\uDFE1\uDFE3]|\uD821[\uDC00-\uDFF7]|\uD823[\uDC00-\uDCD5\uDD00-\uDD08]|\uD82B[\uDFF0-\uDFF3\uDFF5-\uDFFB\uDFFD\uDFFE]|\uD82C[\uDC00-\uDD22\uDD50-\uDD52\uDD64-\uDD67\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD837[\uDF00-\uDF1E]|\uD838[\uDD00-\uDD2C\uDD37-\uDD3D\uDD4E\uDE90-\uDEAD\uDEC0-\uDEEB]|\uD839[\uDFE0-\uDFE6\uDFE8-\uDFEB\uDFED\uDFEE\uDFF0-\uDFFE]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43\uDD4B]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDEDF\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF38\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A])(?:[0-9A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088E\u08A0-\u08C9\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C5D\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u1711\u171F-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4C\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7CA\uA7D0\uA7D1\uA7D3\uA7D5-\uA7D9\uA7F2-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF40\uDF42-\uDF49\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDD70-\uDD7A\uDD7C-\uDD8A\uDD8C-\uDD92\uDD94\uDD95\uDD97-\uDDA1\uDDA3-\uDDB1\uDDB3-\uDDB9\uDDBB\uDDBC\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67\uDF80-\uDF85\uDF87-\uDFB0\uDFB2-\uDFBA]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD23\uDE80-\uDEA9\uDEB0\uDEB1\uDF00-\uDF1C\uDF27\uDF30-\uDF45\uDF70-\uDF81\uDFB0-\uDFC4\uDFE0-\uDFF6]|\uD804[\uDC03-\uDC37\uDC71\uDC72\uDC75\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD44\uDD47\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC5F-\uDC61\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDEB8\uDF00-\uDF1A\uDF40-\uDF46]|\uD806[\uDC00-\uDC2B\uDCA0-\uDCDF\uDCFF-\uDD06\uDD09\uDD0C-\uDD13\uDD15\uDD16\uDD18-\uDD2F\uDD3F\uDD41\uDDA0-\uDDA7\uDDAA-\uDDD0\uDDE1\uDDE3\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE89\uDE9D\uDEB0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDEE0-\uDEF2\uDFB0]|\uD808[\uDC00-\uDF99]|\uD809[\uDC80-\uDD43]|\uD80B[\uDF90-\uDFF0]|[\uD80C\uD81C-\uD820\uD822\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE70-\uDEBE\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE7F\uDF00-\uDF4A\uDF50\uDF93-\uDF9F\uDFE0\uDFE1\uDFE3]|\uD821[\uDC00-\uDFF7]|\uD823[\uDC00-\uDCD5\uDD00-\uDD08]|\uD82B[\uDFF0-\uDFF3\uDFF5-\uDFFB\uDFFD\uDFFE]|\uD82C[\uDC00-\uDD22\uDD50-\uDD52\uDD64-\uDD67\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD837[\uDF00-\uDF1E]|\uD838[\uDD00-\uDD2C\uDD37-\uDD3D\uDD4E\uDE90-\uDEAD\uDEC0-\uDEEB]|\uD839[\uDFE0-\uDFE6\uDFE8-\uDFEB\uDFED\uDFEE\uDFF0-\uDFFE]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43\uDD4B]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDEDF\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF38\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A])*$/.test(s)
      }, {
        name: 'string',
        test: isString
      }, {
        name: 'Chain',
        test: isChain
      }, {
        name: 'Array',
        test: isArray
      }, {
        name: 'Matrix',
        test: isMatrix
      }, {
        name: 'DenseMatrix',
        test: isDenseMatrix
      }, {
        name: 'SparseMatrix',
        test: isSparseMatrix
      }, {
        name: 'Range',
        test: isRange
      }, {
        name: 'Index',
        test: isIndex
      }, {
        name: 'boolean',
        test: isBoolean
      }, {
        name: 'ResultSet',
        test: isResultSet
      }, {
        name: 'Help',
        test: isHelp
      }, {
        name: 'function',
        test: isFunction
      }, {
        name: 'Date',
        test: isDate
      }, {
        name: 'RegExp',
        test: isRegExp
      }, {
        name: 'null',
        test: isNull
      }, {
        name: 'undefined',
        test: isUndefined
      }, {
        name: 'AccessorNode',
        test: isAccessorNode
      }, {
        name: 'ArrayNode',
        test: isArrayNode
      }, {
        name: 'AssignmentNode',
        test: isAssignmentNode
      }, {
        name: 'BlockNode',
        test: isBlockNode
      }, {
        name: 'ConditionalNode',
        test: isConditionalNode
      }, {
        name: 'ConstantNode',
        test: isConstantNode
      }, {
        name: 'FunctionNode',
        test: isFunctionNode
      }, {
        name: 'FunctionAssignmentNode',
        test: isFunctionAssignmentNode
      }, {
        name: 'IndexNode',
        test: isIndexNode
      }, {
        name: 'Node',
        test: isNode
      }, {
        name: 'ObjectNode',
        test: isObjectNode
      }, {
        name: 'OperatorNode',
        test: isOperatorNode
      }, {
        name: 'ParenthesisNode',
        test: isParenthesisNode
      }, {
        name: 'RangeNode',
        test: isRangeNode
      }, {
        name: 'RelationalNode',
        test: isRelationalNode
      }, {
        name: 'SymbolNode',
        test: isSymbolNode
      }, {
        name: 'Map',
        test: isMap
      }, {
        name: 'Object',
        test: isObject
      } // order 'Object' last, it matches on other classes too
      ]);

      typed.addConversions([{
        from: 'number',
        to: 'BigNumber',
        convert: function convert(x) {
          if (!BigNumber) {
            throwNoBignumber(x);
          }

          // note: conversion from number to BigNumber can fail if x has >15 digits
          if (digits(x) > 15) {
            throw new TypeError('Cannot implicitly convert a number with >15 significant digits to BigNumber ' + '(value: ' + x + '). ' + 'Use function bignumber(x) to convert to BigNumber.');
          }
          return new BigNumber(x);
        }
      }, {
        from: 'number',
        to: 'Complex',
        convert: function convert(x) {
          if (!Complex) {
            throwNoComplex(x);
          }
          return new Complex(x, 0);
        }
      }, {
        from: 'BigNumber',
        to: 'Complex',
        convert: function convert(x) {
          if (!Complex) {
            throwNoComplex(x);
          }
          return new Complex(x.toNumber(), 0);
        }
      }, {
        from: 'Fraction',
        to: 'BigNumber',
        convert: function convert(x) {
          throw new TypeError('Cannot implicitly convert a Fraction to BigNumber or vice versa. ' + 'Use function bignumber(x) to convert to BigNumber or fraction(x) to convert to Fraction.');
        }
      }, {
        from: 'Fraction',
        to: 'Complex',
        convert: function convert(x) {
          if (!Complex) {
            throwNoComplex(x);
          }
          return new Complex(x.valueOf(), 0);
        }
      }, {
        from: 'number',
        to: 'Fraction',
        convert: function convert(x) {
          if (!Fraction) {
            throwNoFraction(x);
          }
          var f = new Fraction(x);
          if (f.valueOf() !== x) {
            throw new TypeError('Cannot implicitly convert a number to a Fraction when there will be a loss of precision ' + '(value: ' + x + '). ' + 'Use function fraction(x) to convert to Fraction.');
          }
          return f;
        }
      }, {
        // FIXME: add conversion from Fraction to number, for example for `sqrt(fraction(1,3))`
        //  from: 'Fraction',
        //  to: 'number',
        //  convert: function (x) {
        //    return x.valueOf()
        //  }
        // }, {
        from: 'string',
        to: 'number',
        convert: function convert(x) {
          var n = Number(x);
          if (isNaN(n)) {
            throw new Error('Cannot convert "' + x + '" to a number');
          }
          return n;
        }
      }, {
        from: 'string',
        to: 'BigNumber',
        convert: function convert(x) {
          if (!BigNumber) {
            throwNoBignumber(x);
          }
          try {
            return new BigNumber(x);
          } catch (err) {
            throw new Error('Cannot convert "' + x + '" to BigNumber');
          }
        }
      }, {
        from: 'string',
        to: 'Fraction',
        convert: function convert(x) {
          if (!Fraction) {
            throwNoFraction(x);
          }
          try {
            return new Fraction(x);
          } catch (err) {
            throw new Error('Cannot convert "' + x + '" to Fraction');
          }
        }
      }, {
        from: 'string',
        to: 'Complex',
        convert: function convert(x) {
          if (!Complex) {
            throwNoComplex(x);
          }
          try {
            return new Complex(x);
          } catch (err) {
            throw new Error('Cannot convert "' + x + '" to Complex');
          }
        }
      }, {
        from: 'boolean',
        to: 'number',
        convert: function convert(x) {
          return +x;
        }
      }, {
        from: 'boolean',
        to: 'BigNumber',
        convert: function convert(x) {
          if (!BigNumber) {
            throwNoBignumber(x);
          }
          return new BigNumber(+x);
        }
      }, {
        from: 'boolean',
        to: 'Fraction',
        convert: function convert(x) {
          if (!Fraction) {
            throwNoFraction(x);
          }
          return new Fraction(+x);
        }
      }, {
        from: 'boolean',
        to: 'string',
        convert: function convert(x) {
          return String(x);
        }
      }, {
        from: 'Array',
        to: 'Matrix',
        convert: function convert(array) {
          if (!DenseMatrix) {
            throwNoMatrix();
          }
          return new DenseMatrix(array);
        }
      }, {
        from: 'Matrix',
        to: 'Array',
        convert: function convert(matrix) {
          return matrix.valueOf();
        }
      }]);

      // Provide a suggestion on how to call a function elementwise
      // This was added primarily as guidance for the v10 -> v11 transition,
      // and could potentially be removed in the future if it no longer seems
      // to be helpful.
      typed.onMismatch = (name, args, signatures) => {
        var usualError = typed.createError(name, args, signatures);
        if (['wrongType', 'mismatch'].includes(usualError.data.category) && args.length === 1 && isCollection(args[0]) &&
        // check if the function can be unary:
        signatures.some(sig => !sig.params.includes(','))) {
          var err = new TypeError("Function '".concat(name, "' doesn't apply to matrices. To call it ") + "elementwise on a matrix 'M', try 'map(M, ".concat(name, ")'."));
          err.data = usualError.data;
          throw err;
        }
        throw usualError;
      };

      // Provide a suggestion on how to call a function elementwise
      // This was added primarily as guidance for the v10 -> v11 transition,
      // and could potentially be removed in the future if it no longer seems
      // to be helpful.
      typed.onMismatch = (name, args, signatures) => {
        var usualError = typed.createError(name, args, signatures);
        if (['wrongType', 'mismatch'].includes(usualError.data.category) && args.length === 1 && isCollection(args[0]) &&
        // check if the function can be unary:
        signatures.some(sig => !sig.params.includes(','))) {
          var err = new TypeError("Function '".concat(name, "' doesn't apply to matrices. To call it ") + "elementwise on a matrix 'M', try 'map(M, ".concat(name, ")'."));
          err.data = usualError.data;
          throw err;
        }
        throw usualError;
      };
      return typed;
    });
    function throwNoBignumber(x) {
      throw new Error("Cannot convert value ".concat(x, " into a BigNumber: no class 'BigNumber' provided"));
    }
    function throwNoComplex(x) {
      throw new Error("Cannot convert value ".concat(x, " into a Complex number: no class 'Complex' provided"));
    }
    function throwNoMatrix() {
      throw new Error('Cannot convert array into a Matrix: no class \'DenseMatrix\' provided');
    }
    function throwNoFraction(x) {
      throw new Error("Cannot convert value ".concat(x, " into a Fraction, no class 'Fraction' provided."));
    }

    /*!
     *  decimal.js v10.4.2
     *  An arbitrary-precision Decimal type for JavaScript.
     *  https://github.com/MikeMcl/decimal.js
     *  Copyright (c) 2022 Michael Mclaughlin <M8ch88l@gmail.com>
     *  MIT Licence
     */


    // -----------------------------------  EDITABLE DEFAULTS  ------------------------------------ //


      // The maximum exponent magnitude.
      // The limit on the value of `toExpNeg`, `toExpPos`, `minE` and `maxE`.
    var EXP_LIMIT = 9e15,                      // 0 to 9e15

      // The limit on the value of `precision`, and on the value of the first argument to
      // `toDecimalPlaces`, `toExponential`, `toFixed`, `toPrecision` and `toSignificantDigits`.
      MAX_DIGITS = 1e9,                        // 0 to 1e9

      // Base conversion alphabet.
      NUMERALS = '0123456789abcdef',

      // The natural logarithm of 10 (1025 digits).
      LN10 = '2.3025850929940456840179914546843642076011014886287729760333279009675726096773524802359972050895982983419677840422862486334095254650828067566662873690987816894829072083255546808437998948262331985283935053089653777326288461633662222876982198867465436674744042432743651550489343149393914796194044002221051017141748003688084012647080685567743216228355220114804663715659121373450747856947683463616792101806445070648000277502684916746550586856935673420670581136429224554405758925724208241314695689016758940256776311356919292033376587141660230105703089634572075440370847469940168269282808481184289314848524948644871927809676271275775397027668605952496716674183485704422507197965004714951050492214776567636938662976979522110718264549734772662425709429322582798502585509785265383207606726317164309505995087807523710333101197857547331541421808427543863591778117054309827482385045648019095610299291824318237525357709750539565187697510374970888692180205189339507238539205144634197265287286965110862571492198849978748873771345686209167058',

      // Pi (1025 digits).
      PI = '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989380952572010654858632789',


      // The initial configuration properties of the Decimal constructor.
      DEFAULTS = {

        // These values must be integers within the stated ranges (inclusive).
        // Most of these values can be changed at run-time using the `Decimal.config` method.

        // The maximum number of significant digits of the result of a calculation or base conversion.
        // E.g. `Decimal.config({ precision: 20 });`
        precision: 20,                         // 1 to MAX_DIGITS

        // The rounding mode used when rounding to `precision`.
        //
        // ROUND_UP         0 Away from zero.
        // ROUND_DOWN       1 Towards zero.
        // ROUND_CEIL       2 Towards +Infinity.
        // ROUND_FLOOR      3 Towards -Infinity.
        // ROUND_HALF_UP    4 Towards nearest neighbour. If equidistant, up.
        // ROUND_HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
        // ROUND_HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
        // ROUND_HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
        // ROUND_HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
        //
        // E.g.
        // `Decimal.rounding = 4;`
        // `Decimal.rounding = Decimal.ROUND_HALF_UP;`
        rounding: 4,                           // 0 to 8

        // The modulo mode used when calculating the modulus: a mod n.
        // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
        // The remainder (r) is calculated as: r = a - n * q.
        //
        // UP         0 The remainder is positive if the dividend is negative, else is negative.
        // DOWN       1 The remainder has the same sign as the dividend (JavaScript %).
        // FLOOR      3 The remainder has the same sign as the divisor (Python %).
        // HALF_EVEN  6 The IEEE 754 remainder function.
        // EUCLID     9 Euclidian division. q = sign(n) * floor(a / abs(n)). Always positive.
        //
        // Truncated division (1), floored division (3), the IEEE 754 remainder (6), and Euclidian
        // division (9) are commonly used for the modulus operation. The other rounding modes can also
        // be used, but they may not give useful results.
        modulo: 1,                             // 0 to 9

        // The exponent value at and beneath which `toString` returns exponential notation.
        // JavaScript numbers: -7
        toExpNeg: -7,                          // 0 to -EXP_LIMIT

        // The exponent value at and above which `toString` returns exponential notation.
        // JavaScript numbers: 21
        toExpPos:  21,                         // 0 to EXP_LIMIT

        // The minimum exponent value, beneath which underflow to zero occurs.
        // JavaScript numbers: -324  (5e-324)
        minE: -EXP_LIMIT,                      // -1 to -EXP_LIMIT

        // The maximum exponent value, above which overflow to Infinity occurs.
        // JavaScript numbers: 308  (1.7976931348623157e+308)
        maxE: EXP_LIMIT,                       // 1 to EXP_LIMIT

        // Whether to use cryptographically-secure random number generation, if available.
        crypto: false                          // true/false
      },


    // ----------------------------------- END OF EDITABLE DEFAULTS ------------------------------- //


      inexact, quadrant,
      external = true,

      decimalError = '[DecimalError] ',
      invalidArgument = decimalError + 'Invalid argument: ',
      precisionLimitExceeded = decimalError + 'Precision limit exceeded',
      cryptoUnavailable = decimalError + 'crypto unavailable',
      tag = '[object Decimal]',

      mathfloor = Math.floor,
      mathpow = Math.pow,

      isBinary = /^0b([01]+(\.[01]*)?|\.[01]+)(p[+-]?\d+)?$/i,
      isHex = /^0x([0-9a-f]+(\.[0-9a-f]*)?|\.[0-9a-f]+)(p[+-]?\d+)?$/i,
      isOctal = /^0o([0-7]+(\.[0-7]*)?|\.[0-7]+)(p[+-]?\d+)?$/i,
      isDecimal = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,

      BASE = 1e7,
      LOG_BASE = 7,
      MAX_SAFE_INTEGER = 9007199254740991,

      LN10_PRECISION = LN10.length - 1,
      PI_PRECISION = PI.length - 1,

      // Decimal.prototype object
      P = { toStringTag: tag };


    // Decimal prototype methods


    /*
     *  absoluteValue             abs
     *  ceil
     *  clampedTo                 clamp
     *  comparedTo                cmp
     *  cosine                    cos
     *  cubeRoot                  cbrt
     *  decimalPlaces             dp
     *  dividedBy                 div
     *  dividedToIntegerBy        divToInt
     *  equals                    eq
     *  floor
     *  greaterThan               gt
     *  greaterThanOrEqualTo      gte
     *  hyperbolicCosine          cosh
     *  hyperbolicSine            sinh
     *  hyperbolicTangent         tanh
     *  inverseCosine             acos
     *  inverseHyperbolicCosine   acosh
     *  inverseHyperbolicSine     asinh
     *  inverseHyperbolicTangent  atanh
     *  inverseSine               asin
     *  inverseTangent            atan
     *  isFinite
     *  isInteger                 isInt
     *  isNaN
     *  isNegative                isNeg
     *  isPositive                isPos
     *  isZero
     *  lessThan                  lt
     *  lessThanOrEqualTo         lte
     *  logarithm                 log
     *  [maximum]                 [max]
     *  [minimum]                 [min]
     *  minus                     sub
     *  modulo                    mod
     *  naturalExponential        exp
     *  naturalLogarithm          ln
     *  negated                   neg
     *  plus                      add
     *  precision                 sd
     *  round
     *  sine                      sin
     *  squareRoot                sqrt
     *  tangent                   tan
     *  times                     mul
     *  toBinary
     *  toDecimalPlaces           toDP
     *  toExponential
     *  toFixed
     *  toFraction
     *  toHexadecimal             toHex
     *  toNearest
     *  toNumber
     *  toOctal
     *  toPower                   pow
     *  toPrecision
     *  toSignificantDigits       toSD
     *  toString
     *  truncated                 trunc
     *  valueOf                   toJSON
     */


    /*
     * Return a new Decimal whose value is the absolute value of this Decimal.
     *
     */
    P.absoluteValue = P.abs = function () {
      var x = new this.constructor(this);
      if (x.s < 0) x.s = 1;
      return finalise(x);
    };


    /*
     * Return a new Decimal whose value is the value of this Decimal rounded to a whole number in the
     * direction of positive Infinity.
     *
     */
    P.ceil = function () {
      return finalise(new this.constructor(this), this.e + 1, 2);
    };


    /*
     * Return a new Decimal whose value is the value of this Decimal clamped to the range
     * delineated by `min` and `max`.
     *
     * min {number|string|Decimal}
     * max {number|string|Decimal}
     *
     */
    P.clampedTo = P.clamp = function (min, max) {
      var k,
        x = this,
        Ctor = x.constructor;
      min = new Ctor(min);
      max = new Ctor(max);
      if (!min.s || !max.s) return new Ctor(NaN);
      if (min.gt(max)) throw Error(invalidArgument + max);
      k = x.cmp(min);
      return k < 0 ? min : x.cmp(max) > 0 ? max : new Ctor(x);
    };


    /*
     * Return
     *   1    if the value of this Decimal is greater than the value of `y`,
     *  -1    if the value of this Decimal is less than the value of `y`,
     *   0    if they have the same value,
     *   NaN  if the value of either Decimal is NaN.
     *
     */
    P.comparedTo = P.cmp = function (y) {
      var i, j, xdL, ydL,
        x = this,
        xd = x.d,
        yd = (y = new x.constructor(y)).d,
        xs = x.s,
        ys = y.s;

      // Either NaN or ±Infinity?
      if (!xd || !yd) {
        return !xs || !ys ? NaN : xs !== ys ? xs : xd === yd ? 0 : !xd ^ xs < 0 ? 1 : -1;
      }

      // Either zero?
      if (!xd[0] || !yd[0]) return xd[0] ? xs : yd[0] ? -ys : 0;

      // Signs differ?
      if (xs !== ys) return xs;

      // Compare exponents.
      if (x.e !== y.e) return x.e > y.e ^ xs < 0 ? 1 : -1;

      xdL = xd.length;
      ydL = yd.length;

      // Compare digit by digit.
      for (i = 0, j = xdL < ydL ? xdL : ydL; i < j; ++i) {
        if (xd[i] !== yd[i]) return xd[i] > yd[i] ^ xs < 0 ? 1 : -1;
      }

      // Compare lengths.
      return xdL === ydL ? 0 : xdL > ydL ^ xs < 0 ? 1 : -1;
    };


    /*
     * Return a new Decimal whose value is the cosine of the value in radians of this Decimal.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [-1, 1]
     *
     * cos(0)         = 1
     * cos(-0)        = 1
     * cos(Infinity)  = NaN
     * cos(-Infinity) = NaN
     * cos(NaN)       = NaN
     *
     */
    P.cosine = P.cos = function () {
      var pr, rm,
        x = this,
        Ctor = x.constructor;

      if (!x.d) return new Ctor(NaN);

      // cos(0) = cos(-0) = 1
      if (!x.d[0]) return new Ctor(1);

      pr = Ctor.precision;
      rm = Ctor.rounding;
      Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
      Ctor.rounding = 1;

      x = cosine(Ctor, toLessThanHalfPi(Ctor, x));

      Ctor.precision = pr;
      Ctor.rounding = rm;

      return finalise(quadrant == 2 || quadrant == 3 ? x.neg() : x, pr, rm, true);
    };


    /*
     *
     * Return a new Decimal whose value is the cube root of the value of this Decimal, rounded to
     * `precision` significant digits using rounding mode `rounding`.
     *
     *  cbrt(0)  =  0
     *  cbrt(-0) = -0
     *  cbrt(1)  =  1
     *  cbrt(-1) = -1
     *  cbrt(N)  =  N
     *  cbrt(-I) = -I
     *  cbrt(I)  =  I
     *
     * Math.cbrt(x) = (x < 0 ? -Math.pow(-x, 1/3) : Math.pow(x, 1/3))
     *
     */
    P.cubeRoot = P.cbrt = function () {
      var e, m, n, r, rep, s, sd, t, t3, t3plusx,
        x = this,
        Ctor = x.constructor;

      if (!x.isFinite() || x.isZero()) return new Ctor(x);
      external = false;

      // Initial estimate.
      s = x.s * mathpow(x.s * x, 1 / 3);

       // Math.cbrt underflow/overflow?
       // Pass x to Math.pow as integer, then adjust the exponent of the result.
      if (!s || Math.abs(s) == 1 / 0) {
        n = digitsToString(x.d);
        e = x.e;

        // Adjust n exponent so it is a multiple of 3 away from x exponent.
        if (s = (e - n.length + 1) % 3) n += (s == 1 || s == -2 ? '0' : '00');
        s = mathpow(n, 1 / 3);

        // Rarely, e may be one less than the result exponent value.
        e = mathfloor((e + 1) / 3) - (e % 3 == (e < 0 ? -1 : 2));

        if (s == 1 / 0) {
          n = '5e' + e;
        } else {
          n = s.toExponential();
          n = n.slice(0, n.indexOf('e') + 1) + e;
        }

        r = new Ctor(n);
        r.s = x.s;
      } else {
        r = new Ctor(s.toString());
      }

      sd = (e = Ctor.precision) + 3;

      // Halley's method.
      // TODO? Compare Newton's method.
      for (;;) {
        t = r;
        t3 = t.times(t).times(t);
        t3plusx = t3.plus(x);
        r = divide(t3plusx.plus(x).times(t), t3plusx.plus(t3), sd + 2, 1);

        // TODO? Replace with for-loop and checkRoundingDigits.
        if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
          n = n.slice(sd - 3, sd + 1);

          // The 4th rounding digit may be in error by -1 so if the 4 rounding digits are 9999 or 4999
          // , i.e. approaching a rounding boundary, continue the iteration.
          if (n == '9999' || !rep && n == '4999') {

            // On the first iteration only, check to see if rounding up gives the exact result as the
            // nines may infinitely repeat.
            if (!rep) {
              finalise(t, e + 1, 0);

              if (t.times(t).times(t).eq(x)) {
                r = t;
                break;
              }
            }

            sd += 4;
            rep = 1;
          } else {

            // If the rounding digits are null, 0{0,4} or 50{0,3}, check for an exact result.
            // If not, then there are further digits and m will be truthy.
            if (!+n || !+n.slice(1) && n.charAt(0) == '5') {

              // Truncate to the first rounding digit.
              finalise(r, e + 1, 1);
              m = !r.times(r).times(r).eq(x);
            }

            break;
          }
        }
      }

      external = true;

      return finalise(r, e, Ctor.rounding, m);
    };


    /*
     * Return the number of decimal places of the value of this Decimal.
     *
     */
    P.decimalPlaces = P.dp = function () {
      var w,
        d = this.d,
        n = NaN;

      if (d) {
        w = d.length - 1;
        n = (w - mathfloor(this.e / LOG_BASE)) * LOG_BASE;

        // Subtract the number of trailing zeros of the last word.
        w = d[w];
        if (w) for (; w % 10 == 0; w /= 10) n--;
        if (n < 0) n = 0;
      }

      return n;
    };


    /*
     *  n / 0 = I
     *  n / N = N
     *  n / I = 0
     *  0 / n = 0
     *  0 / 0 = N
     *  0 / N = N
     *  0 / I = 0
     *  N / n = N
     *  N / 0 = N
     *  N / N = N
     *  N / I = N
     *  I / n = I
     *  I / 0 = I
     *  I / N = N
     *  I / I = N
     *
     * Return a new Decimal whose value is the value of this Decimal divided by `y`, rounded to
     * `precision` significant digits using rounding mode `rounding`.
     *
     */
    P.dividedBy = P.div = function (y) {
      return divide(this, new this.constructor(y));
    };


    /*
     * Return a new Decimal whose value is the integer part of dividing the value of this Decimal
     * by the value of `y`, rounded to `precision` significant digits using rounding mode `rounding`.
     *
     */
    P.dividedToIntegerBy = P.divToInt = function (y) {
      var x = this,
        Ctor = x.constructor;
      return finalise(divide(x, new Ctor(y), 0, 1, 1), Ctor.precision, Ctor.rounding);
    };


    /*
     * Return true if the value of this Decimal is equal to the value of `y`, otherwise return false.
     *
     */
    P.equals = P.eq = function (y) {
      return this.cmp(y) === 0;
    };


    /*
     * Return a new Decimal whose value is the value of this Decimal rounded to a whole number in the
     * direction of negative Infinity.
     *
     */
    P.floor = function () {
      return finalise(new this.constructor(this), this.e + 1, 3);
    };


    /*
     * Return true if the value of this Decimal is greater than the value of `y`, otherwise return
     * false.
     *
     */
    P.greaterThan = P.gt = function (y) {
      return this.cmp(y) > 0;
    };


    /*
     * Return true if the value of this Decimal is greater than or equal to the value of `y`,
     * otherwise return false.
     *
     */
    P.greaterThanOrEqualTo = P.gte = function (y) {
      var k = this.cmp(y);
      return k == 1 || k === 0;
    };


    /*
     * Return a new Decimal whose value is the hyperbolic cosine of the value in radians of this
     * Decimal.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [1, Infinity]
     *
     * cosh(x) = 1 + x^2/2! + x^4/4! + x^6/6! + ...
     *
     * cosh(0)         = 1
     * cosh(-0)        = 1
     * cosh(Infinity)  = Infinity
     * cosh(-Infinity) = Infinity
     * cosh(NaN)       = NaN
     *
     *  x        time taken (ms)   result
     * 1000      9                 9.8503555700852349694e+433
     * 10000     25                4.4034091128314607936e+4342
     * 100000    171               1.4033316802130615897e+43429
     * 1000000   3817              1.5166076984010437725e+434294
     * 10000000  abandoned after 2 minute wait
     *
     * TODO? Compare performance of cosh(x) = 0.5 * (exp(x) + exp(-x))
     *
     */
    P.hyperbolicCosine = P.cosh = function () {
      var k, n, pr, rm, len,
        x = this,
        Ctor = x.constructor,
        one = new Ctor(1);

      if (!x.isFinite()) return new Ctor(x.s ? 1 / 0 : NaN);
      if (x.isZero()) return one;

      pr = Ctor.precision;
      rm = Ctor.rounding;
      Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
      Ctor.rounding = 1;
      len = x.d.length;

      // Argument reduction: cos(4x) = 1 - 8cos^2(x) + 8cos^4(x) + 1
      // i.e. cos(x) = 1 - cos^2(x/4)(8 - 8cos^2(x/4))

      // Estimate the optimum number of times to use the argument reduction.
      // TODO? Estimation reused from cosine() and may not be optimal here.
      if (len < 32) {
        k = Math.ceil(len / 3);
        n = (1 / tinyPow(4, k)).toString();
      } else {
        k = 16;
        n = '2.3283064365386962890625e-10';
      }

      x = taylorSeries(Ctor, 1, x.times(n), new Ctor(1), true);

      // Reverse argument reduction
      var cosh2_x,
        i = k,
        d8 = new Ctor(8);
      for (; i--;) {
        cosh2_x = x.times(x);
        x = one.minus(cosh2_x.times(d8.minus(cosh2_x.times(d8))));
      }

      return finalise(x, Ctor.precision = pr, Ctor.rounding = rm, true);
    };


    /*
     * Return a new Decimal whose value is the hyperbolic sine of the value in radians of this
     * Decimal.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [-Infinity, Infinity]
     *
     * sinh(x) = x + x^3/3! + x^5/5! + x^7/7! + ...
     *
     * sinh(0)         = 0
     * sinh(-0)        = -0
     * sinh(Infinity)  = Infinity
     * sinh(-Infinity) = -Infinity
     * sinh(NaN)       = NaN
     *
     * x        time taken (ms)
     * 10       2 ms
     * 100      5 ms
     * 1000     14 ms
     * 10000    82 ms
     * 100000   886 ms            1.4033316802130615897e+43429
     * 200000   2613 ms
     * 300000   5407 ms
     * 400000   8824 ms
     * 500000   13026 ms          8.7080643612718084129e+217146
     * 1000000  48543 ms
     *
     * TODO? Compare performance of sinh(x) = 0.5 * (exp(x) - exp(-x))
     *
     */
    P.hyperbolicSine = P.sinh = function () {
      var k, pr, rm, len,
        x = this,
        Ctor = x.constructor;

      if (!x.isFinite() || x.isZero()) return new Ctor(x);

      pr = Ctor.precision;
      rm = Ctor.rounding;
      Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
      Ctor.rounding = 1;
      len = x.d.length;

      if (len < 3) {
        x = taylorSeries(Ctor, 2, x, x, true);
      } else {

        // Alternative argument reduction: sinh(3x) = sinh(x)(3 + 4sinh^2(x))
        // i.e. sinh(x) = sinh(x/3)(3 + 4sinh^2(x/3))
        // 3 multiplications and 1 addition

        // Argument reduction: sinh(5x) = sinh(x)(5 + sinh^2(x)(20 + 16sinh^2(x)))
        // i.e. sinh(x) = sinh(x/5)(5 + sinh^2(x/5)(20 + 16sinh^2(x/5)))
        // 4 multiplications and 2 additions

        // Estimate the optimum number of times to use the argument reduction.
        k = 1.4 * Math.sqrt(len);
        k = k > 16 ? 16 : k | 0;

        x = x.times(1 / tinyPow(5, k));
        x = taylorSeries(Ctor, 2, x, x, true);

        // Reverse argument reduction
        var sinh2_x,
          d5 = new Ctor(5),
          d16 = new Ctor(16),
          d20 = new Ctor(20);
        for (; k--;) {
          sinh2_x = x.times(x);
          x = x.times(d5.plus(sinh2_x.times(d16.times(sinh2_x).plus(d20))));
        }
      }

      Ctor.precision = pr;
      Ctor.rounding = rm;

      return finalise(x, pr, rm, true);
    };


    /*
     * Return a new Decimal whose value is the hyperbolic tangent of the value in radians of this
     * Decimal.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [-1, 1]
     *
     * tanh(x) = sinh(x) / cosh(x)
     *
     * tanh(0)         = 0
     * tanh(-0)        = -0
     * tanh(Infinity)  = 1
     * tanh(-Infinity) = -1
     * tanh(NaN)       = NaN
     *
     */
    P.hyperbolicTangent = P.tanh = function () {
      var pr, rm,
        x = this,
        Ctor = x.constructor;

      if (!x.isFinite()) return new Ctor(x.s);
      if (x.isZero()) return new Ctor(x);

      pr = Ctor.precision;
      rm = Ctor.rounding;
      Ctor.precision = pr + 7;
      Ctor.rounding = 1;

      return divide(x.sinh(), x.cosh(), Ctor.precision = pr, Ctor.rounding = rm);
    };


    /*
     * Return a new Decimal whose value is the arccosine (inverse cosine) in radians of the value of
     * this Decimal.
     *
     * Domain: [-1, 1]
     * Range: [0, pi]
     *
     * acos(x) = pi/2 - asin(x)
     *
     * acos(0)       = pi/2
     * acos(-0)      = pi/2
     * acos(1)       = 0
     * acos(-1)      = pi
     * acos(1/2)     = pi/3
     * acos(-1/2)    = 2*pi/3
     * acos(|x| > 1) = NaN
     * acos(NaN)     = NaN
     *
     */
    P.inverseCosine = P.acos = function () {
      var halfPi,
        x = this,
        Ctor = x.constructor,
        k = x.abs().cmp(1),
        pr = Ctor.precision,
        rm = Ctor.rounding;

      if (k !== -1) {
        return k === 0
          // |x| is 1
          ? x.isNeg() ? getPi(Ctor, pr, rm) : new Ctor(0)
          // |x| > 1 or x is NaN
          : new Ctor(NaN);
      }

      if (x.isZero()) return getPi(Ctor, pr + 4, rm).times(0.5);

      // TODO? Special case acos(0.5) = pi/3 and acos(-0.5) = 2*pi/3

      Ctor.precision = pr + 6;
      Ctor.rounding = 1;

      x = x.asin();
      halfPi = getPi(Ctor, pr + 4, rm).times(0.5);

      Ctor.precision = pr;
      Ctor.rounding = rm;

      return halfPi.minus(x);
    };


    /*
     * Return a new Decimal whose value is the inverse of the hyperbolic cosine in radians of the
     * value of this Decimal.
     *
     * Domain: [1, Infinity]
     * Range: [0, Infinity]
     *
     * acosh(x) = ln(x + sqrt(x^2 - 1))
     *
     * acosh(x < 1)     = NaN
     * acosh(NaN)       = NaN
     * acosh(Infinity)  = Infinity
     * acosh(-Infinity) = NaN
     * acosh(0)         = NaN
     * acosh(-0)        = NaN
     * acosh(1)         = 0
     * acosh(-1)        = NaN
     *
     */
    P.inverseHyperbolicCosine = P.acosh = function () {
      var pr, rm,
        x = this,
        Ctor = x.constructor;

      if (x.lte(1)) return new Ctor(x.eq(1) ? 0 : NaN);
      if (!x.isFinite()) return new Ctor(x);

      pr = Ctor.precision;
      rm = Ctor.rounding;
      Ctor.precision = pr + Math.max(Math.abs(x.e), x.sd()) + 4;
      Ctor.rounding = 1;
      external = false;

      x = x.times(x).minus(1).sqrt().plus(x);

      external = true;
      Ctor.precision = pr;
      Ctor.rounding = rm;

      return x.ln();
    };


    /*
     * Return a new Decimal whose value is the inverse of the hyperbolic sine in radians of the value
     * of this Decimal.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [-Infinity, Infinity]
     *
     * asinh(x) = ln(x + sqrt(x^2 + 1))
     *
     * asinh(NaN)       = NaN
     * asinh(Infinity)  = Infinity
     * asinh(-Infinity) = -Infinity
     * asinh(0)         = 0
     * asinh(-0)        = -0
     *
     */
    P.inverseHyperbolicSine = P.asinh = function () {
      var pr, rm,
        x = this,
        Ctor = x.constructor;

      if (!x.isFinite() || x.isZero()) return new Ctor(x);

      pr = Ctor.precision;
      rm = Ctor.rounding;
      Ctor.precision = pr + 2 * Math.max(Math.abs(x.e), x.sd()) + 6;
      Ctor.rounding = 1;
      external = false;

      x = x.times(x).plus(1).sqrt().plus(x);

      external = true;
      Ctor.precision = pr;
      Ctor.rounding = rm;

      return x.ln();
    };


    /*
     * Return a new Decimal whose value is the inverse of the hyperbolic tangent in radians of the
     * value of this Decimal.
     *
     * Domain: [-1, 1]
     * Range: [-Infinity, Infinity]
     *
     * atanh(x) = 0.5 * ln((1 + x) / (1 - x))
     *
     * atanh(|x| > 1)   = NaN
     * atanh(NaN)       = NaN
     * atanh(Infinity)  = NaN
     * atanh(-Infinity) = NaN
     * atanh(0)         = 0
     * atanh(-0)        = -0
     * atanh(1)         = Infinity
     * atanh(-1)        = -Infinity
     *
     */
    P.inverseHyperbolicTangent = P.atanh = function () {
      var pr, rm, wpr, xsd,
        x = this,
        Ctor = x.constructor;

      if (!x.isFinite()) return new Ctor(NaN);
      if (x.e >= 0) return new Ctor(x.abs().eq(1) ? x.s / 0 : x.isZero() ? x : NaN);

      pr = Ctor.precision;
      rm = Ctor.rounding;
      xsd = x.sd();

      if (Math.max(xsd, pr) < 2 * -x.e - 1) return finalise(new Ctor(x), pr, rm, true);

      Ctor.precision = wpr = xsd - x.e;

      x = divide(x.plus(1), new Ctor(1).minus(x), wpr + pr, 1);

      Ctor.precision = pr + 4;
      Ctor.rounding = 1;

      x = x.ln();

      Ctor.precision = pr;
      Ctor.rounding = rm;

      return x.times(0.5);
    };


    /*
     * Return a new Decimal whose value is the arcsine (inverse sine) in radians of the value of this
     * Decimal.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [-pi/2, pi/2]
     *
     * asin(x) = 2*atan(x/(1 + sqrt(1 - x^2)))
     *
     * asin(0)       = 0
     * asin(-0)      = -0
     * asin(1/2)     = pi/6
     * asin(-1/2)    = -pi/6
     * asin(1)       = pi/2
     * asin(-1)      = -pi/2
     * asin(|x| > 1) = NaN
     * asin(NaN)     = NaN
     *
     * TODO? Compare performance of Taylor series.
     *
     */
    P.inverseSine = P.asin = function () {
      var halfPi, k,
        pr, rm,
        x = this,
        Ctor = x.constructor;

      if (x.isZero()) return new Ctor(x);

      k = x.abs().cmp(1);
      pr = Ctor.precision;
      rm = Ctor.rounding;

      if (k !== -1) {

        // |x| is 1
        if (k === 0) {
          halfPi = getPi(Ctor, pr + 4, rm).times(0.5);
          halfPi.s = x.s;
          return halfPi;
        }

        // |x| > 1 or x is NaN
        return new Ctor(NaN);
      }

      // TODO? Special case asin(1/2) = pi/6 and asin(-1/2) = -pi/6

      Ctor.precision = pr + 6;
      Ctor.rounding = 1;

      x = x.div(new Ctor(1).minus(x.times(x)).sqrt().plus(1)).atan();

      Ctor.precision = pr;
      Ctor.rounding = rm;

      return x.times(2);
    };


    /*
     * Return a new Decimal whose value is the arctangent (inverse tangent) in radians of the value
     * of this Decimal.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [-pi/2, pi/2]
     *
     * atan(x) = x - x^3/3 + x^5/5 - x^7/7 + ...
     *
     * atan(0)         = 0
     * atan(-0)        = -0
     * atan(1)         = pi/4
     * atan(-1)        = -pi/4
     * atan(Infinity)  = pi/2
     * atan(-Infinity) = -pi/2
     * atan(NaN)       = NaN
     *
     */
    P.inverseTangent = P.atan = function () {
      var i, j, k, n, px, t, r, wpr, x2,
        x = this,
        Ctor = x.constructor,
        pr = Ctor.precision,
        rm = Ctor.rounding;

      if (!x.isFinite()) {
        if (!x.s) return new Ctor(NaN);
        if (pr + 4 <= PI_PRECISION) {
          r = getPi(Ctor, pr + 4, rm).times(0.5);
          r.s = x.s;
          return r;
        }
      } else if (x.isZero()) {
        return new Ctor(x);
      } else if (x.abs().eq(1) && pr + 4 <= PI_PRECISION) {
        r = getPi(Ctor, pr + 4, rm).times(0.25);
        r.s = x.s;
        return r;
      }

      Ctor.precision = wpr = pr + 10;
      Ctor.rounding = 1;

      // TODO? if (x >= 1 && pr <= PI_PRECISION) atan(x) = halfPi * x.s - atan(1 / x);

      // Argument reduction
      // Ensure |x| < 0.42
      // atan(x) = 2 * atan(x / (1 + sqrt(1 + x^2)))

      k = Math.min(28, wpr / LOG_BASE + 2 | 0);

      for (i = k; i; --i) x = x.div(x.times(x).plus(1).sqrt().plus(1));

      external = false;

      j = Math.ceil(wpr / LOG_BASE);
      n = 1;
      x2 = x.times(x);
      r = new Ctor(x);
      px = x;

      // atan(x) = x - x^3/3 + x^5/5 - x^7/7 + ...
      for (; i !== -1;) {
        px = px.times(x2);
        t = r.minus(px.div(n += 2));

        px = px.times(x2);
        r = t.plus(px.div(n += 2));

        if (r.d[j] !== void 0) for (i = j; r.d[i] === t.d[i] && i--;);
      }

      if (k) r = r.times(2 << (k - 1));

      external = true;

      return finalise(r, Ctor.precision = pr, Ctor.rounding = rm, true);
    };


    /*
     * Return true if the value of this Decimal is a finite number, otherwise return false.
     *
     */
    P.isFinite = function () {
      return !!this.d;
    };


    /*
     * Return true if the value of this Decimal is an integer, otherwise return false.
     *
     */
    P.isInteger = P.isInt = function () {
      return !!this.d && mathfloor(this.e / LOG_BASE) > this.d.length - 2;
    };


    /*
     * Return true if the value of this Decimal is NaN, otherwise return false.
     *
     */
    P.isNaN = function () {
      return !this.s;
    };


    /*
     * Return true if the value of this Decimal is negative, otherwise return false.
     *
     */
    P.isNegative = P.isNeg = function () {
      return this.s < 0;
    };


    /*
     * Return true if the value of this Decimal is positive, otherwise return false.
     *
     */
    P.isPositive = P.isPos = function () {
      return this.s > 0;
    };


    /*
     * Return true if the value of this Decimal is 0 or -0, otherwise return false.
     *
     */
    P.isZero = function () {
      return !!this.d && this.d[0] === 0;
    };


    /*
     * Return true if the value of this Decimal is less than `y`, otherwise return false.
     *
     */
    P.lessThan = P.lt = function (y) {
      return this.cmp(y) < 0;
    };


    /*
     * Return true if the value of this Decimal is less than or equal to `y`, otherwise return false.
     *
     */
    P.lessThanOrEqualTo = P.lte = function (y) {
      return this.cmp(y) < 1;
    };


    /*
     * Return the logarithm of the value of this Decimal to the specified base, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * If no base is specified, return log[10](arg).
     *
     * log[base](arg) = ln(arg) / ln(base)
     *
     * The result will always be correctly rounded if the base of the log is 10, and 'almost always'
     * otherwise:
     *
     * Depending on the rounding mode, the result may be incorrectly rounded if the first fifteen
     * rounding digits are [49]99999999999999 or [50]00000000000000. In that case, the maximum error
     * between the result and the correctly rounded result will be one ulp (unit in the last place).
     *
     * log[-b](a)       = NaN
     * log[0](a)        = NaN
     * log[1](a)        = NaN
     * log[NaN](a)      = NaN
     * log[Infinity](a) = NaN
     * log[b](0)        = -Infinity
     * log[b](-0)       = -Infinity
     * log[b](-a)       = NaN
     * log[b](1)        = 0
     * log[b](Infinity) = Infinity
     * log[b](NaN)      = NaN
     *
     * [base] {number|string|Decimal} The base of the logarithm.
     *
     */
    P.logarithm = P.log = function (base) {
      var isBase10, d, denominator, k, inf, num, sd, r,
        arg = this,
        Ctor = arg.constructor,
        pr = Ctor.precision,
        rm = Ctor.rounding,
        guard = 5;

      // Default base is 10.
      if (base == null) {
        base = new Ctor(10);
        isBase10 = true;
      } else {
        base = new Ctor(base);
        d = base.d;

        // Return NaN if base is negative, or non-finite, or is 0 or 1.
        if (base.s < 0 || !d || !d[0] || base.eq(1)) return new Ctor(NaN);

        isBase10 = base.eq(10);
      }

      d = arg.d;

      // Is arg negative, non-finite, 0 or 1?
      if (arg.s < 0 || !d || !d[0] || arg.eq(1)) {
        return new Ctor(d && !d[0] ? -1 / 0 : arg.s != 1 ? NaN : d ? 0 : 1 / 0);
      }

      // The result will have a non-terminating decimal expansion if base is 10 and arg is not an
      // integer power of 10.
      if (isBase10) {
        if (d.length > 1) {
          inf = true;
        } else {
          for (k = d[0]; k % 10 === 0;) k /= 10;
          inf = k !== 1;
        }
      }

      external = false;
      sd = pr + guard;
      num = naturalLogarithm(arg, sd);
      denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base, sd);

      // The result will have 5 rounding digits.
      r = divide(num, denominator, sd, 1);

      // If at a rounding boundary, i.e. the result's rounding digits are [49]9999 or [50]0000,
      // calculate 10 further digits.
      //
      // If the result is known to have an infinite decimal expansion, repeat this until it is clear
      // that the result is above or below the boundary. Otherwise, if after calculating the 10
      // further digits, the last 14 are nines, round up and assume the result is exact.
      // Also assume the result is exact if the last 14 are zero.
      //
      // Example of a result that will be incorrectly rounded:
      // log[1048576](4503599627370502) = 2.60000000000000009610279511444746...
      // The above result correctly rounded using ROUND_CEIL to 1 decimal place should be 2.7, but it
      // will be given as 2.6 as there are 15 zeros immediately after the requested decimal place, so
      // the exact result would be assumed to be 2.6, which rounded using ROUND_CEIL to 1 decimal
      // place is still 2.6.
      if (checkRoundingDigits(r.d, k = pr, rm)) {

        do {
          sd += 10;
          num = naturalLogarithm(arg, sd);
          denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base, sd);
          r = divide(num, denominator, sd, 1);

          if (!inf) {

            // Check for 14 nines from the 2nd rounding digit, as the first may be 4.
            if (+digitsToString(r.d).slice(k + 1, k + 15) + 1 == 1e14) {
              r = finalise(r, pr + 1, 0);
            }

            break;
          }
        } while (checkRoundingDigits(r.d, k += 10, rm));
      }

      external = true;

      return finalise(r, pr, rm);
    };


    /*
     * Return a new Decimal whose value is the maximum of the arguments and the value of this Decimal.
     *
     * arguments {number|string|Decimal}
     *
    P.max = function () {
      Array.prototype.push.call(arguments, this);
      return maxOrMin(this.constructor, arguments, 'lt');
    };
     */


    /*
     * Return a new Decimal whose value is the minimum of the arguments and the value of this Decimal.
     *
     * arguments {number|string|Decimal}
     *
    P.min = function () {
      Array.prototype.push.call(arguments, this);
      return maxOrMin(this.constructor, arguments, 'gt');
    };
     */


    /*
     *  n - 0 = n
     *  n - N = N
     *  n - I = -I
     *  0 - n = -n
     *  0 - 0 = 0
     *  0 - N = N
     *  0 - I = -I
     *  N - n = N
     *  N - 0 = N
     *  N - N = N
     *  N - I = N
     *  I - n = I
     *  I - 0 = I
     *  I - N = N
     *  I - I = N
     *
     * Return a new Decimal whose value is the value of this Decimal minus `y`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     */
    P.minus = P.sub = function (y) {
      var d, e, i, j, k, len, pr, rm, xd, xe, xLTy, yd,
        x = this,
        Ctor = x.constructor;

      y = new Ctor(y);

      // If either is not finite...
      if (!x.d || !y.d) {

        // Return NaN if either is NaN.
        if (!x.s || !y.s) y = new Ctor(NaN);

        // Return y negated if x is finite and y is ±Infinity.
        else if (x.d) y.s = -y.s;

        // Return x if y is finite and x is ±Infinity.
        // Return x if both are ±Infinity with different signs.
        // Return NaN if both are ±Infinity with the same sign.
        else y = new Ctor(y.d || x.s !== y.s ? x : NaN);

        return y;
      }

      // If signs differ...
      if (x.s != y.s) {
        y.s = -y.s;
        return x.plus(y);
      }

      xd = x.d;
      yd = y.d;
      pr = Ctor.precision;
      rm = Ctor.rounding;

      // If either is zero...
      if (!xd[0] || !yd[0]) {

        // Return y negated if x is zero and y is non-zero.
        if (yd[0]) y.s = -y.s;

        // Return x if y is zero and x is non-zero.
        else if (xd[0]) y = new Ctor(x);

        // Return zero if both are zero.
        // From IEEE 754 (2008) 6.3: 0 - 0 = -0 - -0 = -0 when rounding to -Infinity.
        else return new Ctor(rm === 3 ? -0 : 0);

        return external ? finalise(y, pr, rm) : y;
      }

      // x and y are finite, non-zero numbers with the same sign.

      // Calculate base 1e7 exponents.
      e = mathfloor(y.e / LOG_BASE);
      xe = mathfloor(x.e / LOG_BASE);

      xd = xd.slice();
      k = xe - e;

      // If base 1e7 exponents differ...
      if (k) {
        xLTy = k < 0;

        if (xLTy) {
          d = xd;
          k = -k;
          len = yd.length;
        } else {
          d = yd;
          e = xe;
          len = xd.length;
        }

        // Numbers with massively different exponents would result in a very high number of
        // zeros needing to be prepended, but this can be avoided while still ensuring correct
        // rounding by limiting the number of zeros to `Math.ceil(pr / LOG_BASE) + 2`.
        i = Math.max(Math.ceil(pr / LOG_BASE), len) + 2;

        if (k > i) {
          k = i;
          d.length = 1;
        }

        // Prepend zeros to equalise exponents.
        d.reverse();
        for (i = k; i--;) d.push(0);
        d.reverse();

      // Base 1e7 exponents equal.
      } else {

        // Check digits to determine which is the bigger number.

        i = xd.length;
        len = yd.length;
        xLTy = i < len;
        if (xLTy) len = i;

        for (i = 0; i < len; i++) {
          if (xd[i] != yd[i]) {
            xLTy = xd[i] < yd[i];
            break;
          }
        }

        k = 0;
      }

      if (xLTy) {
        d = xd;
        xd = yd;
        yd = d;
        y.s = -y.s;
      }

      len = xd.length;

      // Append zeros to `xd` if shorter.
      // Don't add zeros to `yd` if shorter as subtraction only needs to start at `yd` length.
      for (i = yd.length - len; i > 0; --i) xd[len++] = 0;

      // Subtract yd from xd.
      for (i = yd.length; i > k;) {

        if (xd[--i] < yd[i]) {
          for (j = i; j && xd[--j] === 0;) xd[j] = BASE - 1;
          --xd[j];
          xd[i] += BASE;
        }

        xd[i] -= yd[i];
      }

      // Remove trailing zeros.
      for (; xd[--len] === 0;) xd.pop();

      // Remove leading zeros and adjust exponent accordingly.
      for (; xd[0] === 0; xd.shift()) --e;

      // Zero?
      if (!xd[0]) return new Ctor(rm === 3 ? -0 : 0);

      y.d = xd;
      y.e = getBase10Exponent(xd, e);

      return external ? finalise(y, pr, rm) : y;
    };


    /*
     *   n % 0 =  N
     *   n % N =  N
     *   n % I =  n
     *   0 % n =  0
     *  -0 % n = -0
     *   0 % 0 =  N
     *   0 % N =  N
     *   0 % I =  0
     *   N % n =  N
     *   N % 0 =  N
     *   N % N =  N
     *   N % I =  N
     *   I % n =  N
     *   I % 0 =  N
     *   I % N =  N
     *   I % I =  N
     *
     * Return a new Decimal whose value is the value of this Decimal modulo `y`, rounded to
     * `precision` significant digits using rounding mode `rounding`.
     *
     * The result depends on the modulo mode.
     *
     */
    P.modulo = P.mod = function (y) {
      var q,
        x = this,
        Ctor = x.constructor;

      y = new Ctor(y);

      // Return NaN if x is ±Infinity or NaN, or y is NaN or ±0.
      if (!x.d || !y.s || y.d && !y.d[0]) return new Ctor(NaN);

      // Return x if y is ±Infinity or x is ±0.
      if (!y.d || x.d && !x.d[0]) {
        return finalise(new Ctor(x), Ctor.precision, Ctor.rounding);
      }

      // Prevent rounding of intermediate calculations.
      external = false;

      if (Ctor.modulo == 9) {

        // Euclidian division: q = sign(y) * floor(x / abs(y))
        // result = x - q * y    where  0 <= result < abs(y)
        q = divide(x, y.abs(), 0, 3, 1);
        q.s *= y.s;
      } else {
        q = divide(x, y, 0, Ctor.modulo, 1);
      }

      q = q.times(y);

      external = true;

      return x.minus(q);
    };


    /*
     * Return a new Decimal whose value is the natural exponential of the value of this Decimal,
     * i.e. the base e raised to the power the value of this Decimal, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     */
    P.naturalExponential = P.exp = function () {
      return naturalExponential(this);
    };


    /*
     * Return a new Decimal whose value is the natural logarithm of the value of this Decimal,
     * rounded to `precision` significant digits using rounding mode `rounding`.
     *
     */
    P.naturalLogarithm = P.ln = function () {
      return naturalLogarithm(this);
    };


    /*
     * Return a new Decimal whose value is the value of this Decimal negated, i.e. as if multiplied by
     * -1.
     *
     */
    P.negated = P.neg = function () {
      var x = new this.constructor(this);
      x.s = -x.s;
      return finalise(x);
    };


    /*
     *  n + 0 = n
     *  n + N = N
     *  n + I = I
     *  0 + n = n
     *  0 + 0 = 0
     *  0 + N = N
     *  0 + I = I
     *  N + n = N
     *  N + 0 = N
     *  N + N = N
     *  N + I = N
     *  I + n = I
     *  I + 0 = I
     *  I + N = N
     *  I + I = I
     *
     * Return a new Decimal whose value is the value of this Decimal plus `y`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     */
    P.plus = P.add = function (y) {
      var carry, d, e, i, k, len, pr, rm, xd, yd,
        x = this,
        Ctor = x.constructor;

      y = new Ctor(y);

      // If either is not finite...
      if (!x.d || !y.d) {

        // Return NaN if either is NaN.
        if (!x.s || !y.s) y = new Ctor(NaN);

        // Return x if y is finite and x is ±Infinity.
        // Return x if both are ±Infinity with the same sign.
        // Return NaN if both are ±Infinity with different signs.
        // Return y if x is finite and y is ±Infinity.
        else if (!x.d) y = new Ctor(y.d || x.s === y.s ? x : NaN);

        return y;
      }

       // If signs differ...
      if (x.s != y.s) {
        y.s = -y.s;
        return x.minus(y);
      }

      xd = x.d;
      yd = y.d;
      pr = Ctor.precision;
      rm = Ctor.rounding;

      // If either is zero...
      if (!xd[0] || !yd[0]) {

        // Return x if y is zero.
        // Return y if y is non-zero.
        if (!yd[0]) y = new Ctor(x);

        return external ? finalise(y, pr, rm) : y;
      }

      // x and y are finite, non-zero numbers with the same sign.

      // Calculate base 1e7 exponents.
      k = mathfloor(x.e / LOG_BASE);
      e = mathfloor(y.e / LOG_BASE);

      xd = xd.slice();
      i = k - e;

      // If base 1e7 exponents differ...
      if (i) {

        if (i < 0) {
          d = xd;
          i = -i;
          len = yd.length;
        } else {
          d = yd;
          e = k;
          len = xd.length;
        }

        // Limit number of zeros prepended to max(ceil(pr / LOG_BASE), len) + 1.
        k = Math.ceil(pr / LOG_BASE);
        len = k > len ? k + 1 : len + 1;

        if (i > len) {
          i = len;
          d.length = 1;
        }

        // Prepend zeros to equalise exponents. Note: Faster to use reverse then do unshifts.
        d.reverse();
        for (; i--;) d.push(0);
        d.reverse();
      }

      len = xd.length;
      i = yd.length;

      // If yd is longer than xd, swap xd and yd so xd points to the longer array.
      if (len - i < 0) {
        i = len;
        d = yd;
        yd = xd;
        xd = d;
      }

      // Only start adding at yd.length - 1 as the further digits of xd can be left as they are.
      for (carry = 0; i;) {
        carry = (xd[--i] = xd[i] + yd[i] + carry) / BASE | 0;
        xd[i] %= BASE;
      }

      if (carry) {
        xd.unshift(carry);
        ++e;
      }

      // Remove trailing zeros.
      // No need to check for zero, as +x + +y != 0 && -x + -y != 0
      for (len = xd.length; xd[--len] == 0;) xd.pop();

      y.d = xd;
      y.e = getBase10Exponent(xd, e);

      return external ? finalise(y, pr, rm) : y;
    };


    /*
     * Return the number of significant digits of the value of this Decimal.
     *
     * [z] {boolean|number} Whether to count integer-part trailing zeros: true, false, 1 or 0.
     *
     */
    P.precision = P.sd = function (z) {
      var k,
        x = this;

      if (z !== void 0 && z !== !!z && z !== 1 && z !== 0) throw Error(invalidArgument + z);

      if (x.d) {
        k = getPrecision(x.d);
        if (z && x.e + 1 > k) k = x.e + 1;
      } else {
        k = NaN;
      }

      return k;
    };


    /*
     * Return a new Decimal whose value is the value of this Decimal rounded to a whole number using
     * rounding mode `rounding`.
     *
     */
    P.round = function () {
      var x = this,
        Ctor = x.constructor;

      return finalise(new Ctor(x), x.e + 1, Ctor.rounding);
    };


    /*
     * Return a new Decimal whose value is the sine of the value in radians of this Decimal.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [-1, 1]
     *
     * sin(x) = x - x^3/3! + x^5/5! - ...
     *
     * sin(0)         = 0
     * sin(-0)        = -0
     * sin(Infinity)  = NaN
     * sin(-Infinity) = NaN
     * sin(NaN)       = NaN
     *
     */
    P.sine = P.sin = function () {
      var pr, rm,
        x = this,
        Ctor = x.constructor;

      if (!x.isFinite()) return new Ctor(NaN);
      if (x.isZero()) return new Ctor(x);

      pr = Ctor.precision;
      rm = Ctor.rounding;
      Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
      Ctor.rounding = 1;

      x = sine(Ctor, toLessThanHalfPi(Ctor, x));

      Ctor.precision = pr;
      Ctor.rounding = rm;

      return finalise(quadrant > 2 ? x.neg() : x, pr, rm, true);
    };


    /*
     * Return a new Decimal whose value is the square root of this Decimal, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     *  sqrt(-n) =  N
     *  sqrt(N)  =  N
     *  sqrt(-I) =  N
     *  sqrt(I)  =  I
     *  sqrt(0)  =  0
     *  sqrt(-0) = -0
     *
     */
    P.squareRoot = P.sqrt = function () {
      var m, n, sd, r, rep, t,
        x = this,
        d = x.d,
        e = x.e,
        s = x.s,
        Ctor = x.constructor;

      // Negative/NaN/Infinity/zero?
      if (s !== 1 || !d || !d[0]) {
        return new Ctor(!s || s < 0 && (!d || d[0]) ? NaN : d ? x : 1 / 0);
      }

      external = false;

      // Initial estimate.
      s = Math.sqrt(+x);

      // Math.sqrt underflow/overflow?
      // Pass x to Math.sqrt as integer, then adjust the exponent of the result.
      if (s == 0 || s == 1 / 0) {
        n = digitsToString(d);

        if ((n.length + e) % 2 == 0) n += '0';
        s = Math.sqrt(n);
        e = mathfloor((e + 1) / 2) - (e < 0 || e % 2);

        if (s == 1 / 0) {
          n = '5e' + e;
        } else {
          n = s.toExponential();
          n = n.slice(0, n.indexOf('e') + 1) + e;
        }

        r = new Ctor(n);
      } else {
        r = new Ctor(s.toString());
      }

      sd = (e = Ctor.precision) + 3;

      // Newton-Raphson iteration.
      for (;;) {
        t = r;
        r = t.plus(divide(x, t, sd + 2, 1)).times(0.5);

        // TODO? Replace with for-loop and checkRoundingDigits.
        if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
          n = n.slice(sd - 3, sd + 1);

          // The 4th rounding digit may be in error by -1 so if the 4 rounding digits are 9999 or
          // 4999, i.e. approaching a rounding boundary, continue the iteration.
          if (n == '9999' || !rep && n == '4999') {

            // On the first iteration only, check to see if rounding up gives the exact result as the
            // nines may infinitely repeat.
            if (!rep) {
              finalise(t, e + 1, 0);

              if (t.times(t).eq(x)) {
                r = t;
                break;
              }
            }

            sd += 4;
            rep = 1;
          } else {

            // If the rounding digits are null, 0{0,4} or 50{0,3}, check for an exact result.
            // If not, then there are further digits and m will be truthy.
            if (!+n || !+n.slice(1) && n.charAt(0) == '5') {

              // Truncate to the first rounding digit.
              finalise(r, e + 1, 1);
              m = !r.times(r).eq(x);
            }

            break;
          }
        }
      }

      external = true;

      return finalise(r, e, Ctor.rounding, m);
    };


    /*
     * Return a new Decimal whose value is the tangent of the value in radians of this Decimal.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [-Infinity, Infinity]
     *
     * tan(0)         = 0
     * tan(-0)        = -0
     * tan(Infinity)  = NaN
     * tan(-Infinity) = NaN
     * tan(NaN)       = NaN
     *
     */
    P.tangent = P.tan = function () {
      var pr, rm,
        x = this,
        Ctor = x.constructor;

      if (!x.isFinite()) return new Ctor(NaN);
      if (x.isZero()) return new Ctor(x);

      pr = Ctor.precision;
      rm = Ctor.rounding;
      Ctor.precision = pr + 10;
      Ctor.rounding = 1;

      x = x.sin();
      x.s = 1;
      x = divide(x, new Ctor(1).minus(x.times(x)).sqrt(), pr + 10, 0);

      Ctor.precision = pr;
      Ctor.rounding = rm;

      return finalise(quadrant == 2 || quadrant == 4 ? x.neg() : x, pr, rm, true);
    };


    /*
     *  n * 0 = 0
     *  n * N = N
     *  n * I = I
     *  0 * n = 0
     *  0 * 0 = 0
     *  0 * N = N
     *  0 * I = N
     *  N * n = N
     *  N * 0 = N
     *  N * N = N
     *  N * I = N
     *  I * n = I
     *  I * 0 = N
     *  I * N = N
     *  I * I = I
     *
     * Return a new Decimal whose value is this Decimal times `y`, rounded to `precision` significant
     * digits using rounding mode `rounding`.
     *
     */
    P.times = P.mul = function (y) {
      var carry, e, i, k, r, rL, t, xdL, ydL,
        x = this,
        Ctor = x.constructor,
        xd = x.d,
        yd = (y = new Ctor(y)).d;

      y.s *= x.s;

       // If either is NaN, ±Infinity or ±0...
      if (!xd || !xd[0] || !yd || !yd[0]) {

        return new Ctor(!y.s || xd && !xd[0] && !yd || yd && !yd[0] && !xd

          // Return NaN if either is NaN.
          // Return NaN if x is ±0 and y is ±Infinity, or y is ±0 and x is ±Infinity.
          ? NaN

          // Return ±Infinity if either is ±Infinity.
          // Return ±0 if either is ±0.
          : !xd || !yd ? y.s / 0 : y.s * 0);
      }

      e = mathfloor(x.e / LOG_BASE) + mathfloor(y.e / LOG_BASE);
      xdL = xd.length;
      ydL = yd.length;

      // Ensure xd points to the longer array.
      if (xdL < ydL) {
        r = xd;
        xd = yd;
        yd = r;
        rL = xdL;
        xdL = ydL;
        ydL = rL;
      }

      // Initialise the result array with zeros.
      r = [];
      rL = xdL + ydL;
      for (i = rL; i--;) r.push(0);

      // Multiply!
      for (i = ydL; --i >= 0;) {
        carry = 0;
        for (k = xdL + i; k > i;) {
          t = r[k] + yd[i] * xd[k - i - 1] + carry;
          r[k--] = t % BASE | 0;
          carry = t / BASE | 0;
        }

        r[k] = (r[k] + carry) % BASE | 0;
      }

      // Remove trailing zeros.
      for (; !r[--rL];) r.pop();

      if (carry) ++e;
      else r.shift();

      y.d = r;
      y.e = getBase10Exponent(r, e);

      return external ? finalise(y, Ctor.precision, Ctor.rounding) : y;
    };


    /*
     * Return a string representing the value of this Decimal in base 2, round to `sd` significant
     * digits using rounding mode `rm`.
     *
     * If the optional `sd` argument is present then return binary exponential notation.
     *
     * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     */
    P.toBinary = function (sd, rm) {
      return toStringBinary(this, 2, sd, rm);
    };


    /*
     * Return a new Decimal whose value is the value of this Decimal rounded to a maximum of `dp`
     * decimal places using rounding mode `rm` or `rounding` if `rm` is omitted.
     *
     * If `dp` is omitted, return a new Decimal whose value is the value of this Decimal.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     */
    P.toDecimalPlaces = P.toDP = function (dp, rm) {
      var x = this,
        Ctor = x.constructor;

      x = new Ctor(x);
      if (dp === void 0) return x;

      checkInt32(dp, 0, MAX_DIGITS);

      if (rm === void 0) rm = Ctor.rounding;
      else checkInt32(rm, 0, 8);

      return finalise(x, dp + x.e + 1, rm);
    };


    /*
     * Return a string representing the value of this Decimal in exponential notation rounded to
     * `dp` fixed decimal places using rounding mode `rounding`.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     */
    P.toExponential = function (dp, rm) {
      var str,
        x = this,
        Ctor = x.constructor;

      if (dp === void 0) {
        str = finiteToString(x, true);
      } else {
        checkInt32(dp, 0, MAX_DIGITS);

        if (rm === void 0) rm = Ctor.rounding;
        else checkInt32(rm, 0, 8);

        x = finalise(new Ctor(x), dp + 1, rm);
        str = finiteToString(x, true, dp + 1);
      }

      return x.isNeg() && !x.isZero() ? '-' + str : str;
    };


    /*
     * Return a string representing the value of this Decimal in normal (fixed-point) notation to
     * `dp` fixed decimal places and rounded using rounding mode `rm` or `rounding` if `rm` is
     * omitted.
     *
     * As with JavaScript numbers, (-0).toFixed(0) is '0', but e.g. (-0.00001).toFixed(0) is '-0'.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * (-0).toFixed(0) is '0', but (-0.1).toFixed(0) is '-0'.
     * (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
     * (-0).toFixed(3) is '0.000'.
     * (-0.5).toFixed(0) is '-0'.
     *
     */
    P.toFixed = function (dp, rm) {
      var str, y,
        x = this,
        Ctor = x.constructor;

      if (dp === void 0) {
        str = finiteToString(x);
      } else {
        checkInt32(dp, 0, MAX_DIGITS);

        if (rm === void 0) rm = Ctor.rounding;
        else checkInt32(rm, 0, 8);

        y = finalise(new Ctor(x), dp + x.e + 1, rm);
        str = finiteToString(y, false, dp + y.e + 1);
      }

      // To determine whether to add the minus sign look at the value before it was rounded,
      // i.e. look at `x` rather than `y`.
      return x.isNeg() && !x.isZero() ? '-' + str : str;
    };


    /*
     * Return an array representing the value of this Decimal as a simple fraction with an integer
     * numerator and an integer denominator.
     *
     * The denominator will be a positive non-zero value less than or equal to the specified maximum
     * denominator. If a maximum denominator is not specified, the denominator will be the lowest
     * value necessary to represent the number exactly.
     *
     * [maxD] {number|string|Decimal} Maximum denominator. Integer >= 1 and < Infinity.
     *
     */
    P.toFraction = function (maxD) {
      var d, d0, d1, d2, e, k, n, n0, n1, pr, q, r,
        x = this,
        xd = x.d,
        Ctor = x.constructor;

      if (!xd) return new Ctor(x);

      n1 = d0 = new Ctor(1);
      d1 = n0 = new Ctor(0);

      d = new Ctor(d1);
      e = d.e = getPrecision(xd) - x.e - 1;
      k = e % LOG_BASE;
      d.d[0] = mathpow(10, k < 0 ? LOG_BASE + k : k);

      if (maxD == null) {

        // d is 10**e, the minimum max-denominator needed.
        maxD = e > 0 ? d : n1;
      } else {
        n = new Ctor(maxD);
        if (!n.isInt() || n.lt(n1)) throw Error(invalidArgument + n);
        maxD = n.gt(d) ? (e > 0 ? d : n1) : n;
      }

      external = false;
      n = new Ctor(digitsToString(xd));
      pr = Ctor.precision;
      Ctor.precision = e = xd.length * LOG_BASE * 2;

      for (;;)  {
        q = divide(n, d, 0, 1, 1);
        d2 = d0.plus(q.times(d1));
        if (d2.cmp(maxD) == 1) break;
        d0 = d1;
        d1 = d2;
        d2 = n1;
        n1 = n0.plus(q.times(d2));
        n0 = d2;
        d2 = d;
        d = n.minus(q.times(d2));
        n = d2;
      }

      d2 = divide(maxD.minus(d0), d1, 0, 1, 1);
      n0 = n0.plus(d2.times(n1));
      d0 = d0.plus(d2.times(d1));
      n0.s = n1.s = x.s;

      // Determine which fraction is closer to x, n0/d0 or n1/d1?
      r = divide(n1, d1, e, 1).minus(x).abs().cmp(divide(n0, d0, e, 1).minus(x).abs()) < 1
          ? [n1, d1] : [n0, d0];

      Ctor.precision = pr;
      external = true;

      return r;
    };


    /*
     * Return a string representing the value of this Decimal in base 16, round to `sd` significant
     * digits using rounding mode `rm`.
     *
     * If the optional `sd` argument is present then return binary exponential notation.
     *
     * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     */
    P.toHexadecimal = P.toHex = function (sd, rm) {
      return toStringBinary(this, 16, sd, rm);
    };


    /*
     * Returns a new Decimal whose value is the nearest multiple of `y` in the direction of rounding
     * mode `rm`, or `Decimal.rounding` if `rm` is omitted, to the value of this Decimal.
     *
     * The return value will always have the same sign as this Decimal, unless either this Decimal
     * or `y` is NaN, in which case the return value will be also be NaN.
     *
     * The return value is not affected by the value of `precision`.
     *
     * y {number|string|Decimal} The magnitude to round to a multiple of.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * 'toNearest() rounding mode not an integer: {rm}'
     * 'toNearest() rounding mode out of range: {rm}'
     *
     */
    P.toNearest = function (y, rm) {
      var x = this,
        Ctor = x.constructor;

      x = new Ctor(x);

      if (y == null) {

        // If x is not finite, return x.
        if (!x.d) return x;

        y = new Ctor(1);
        rm = Ctor.rounding;
      } else {
        y = new Ctor(y);
        if (rm === void 0) {
          rm = Ctor.rounding;
        } else {
          checkInt32(rm, 0, 8);
        }

        // If x is not finite, return x if y is not NaN, else NaN.
        if (!x.d) return y.s ? x : y;

        // If y is not finite, return Infinity with the sign of x if y is Infinity, else NaN.
        if (!y.d) {
          if (y.s) y.s = x.s;
          return y;
        }
      }

      // If y is not zero, calculate the nearest multiple of y to x.
      if (y.d[0]) {
        external = false;
        x = divide(x, y, 0, rm, 1).times(y);
        external = true;
        finalise(x);

      // If y is zero, return zero with the sign of x.
      } else {
        y.s = x.s;
        x = y;
      }

      return x;
    };


    /*
     * Return the value of this Decimal converted to a number primitive.
     * Zero keeps its sign.
     *
     */
    P.toNumber = function () {
      return +this;
    };


    /*
     * Return a string representing the value of this Decimal in base 8, round to `sd` significant
     * digits using rounding mode `rm`.
     *
     * If the optional `sd` argument is present then return binary exponential notation.
     *
     * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     */
    P.toOctal = function (sd, rm) {
      return toStringBinary(this, 8, sd, rm);
    };


    /*
     * Return a new Decimal whose value is the value of this Decimal raised to the power `y`, rounded
     * to `precision` significant digits using rounding mode `rounding`.
     *
     * ECMAScript compliant.
     *
     *   pow(x, NaN)                           = NaN
     *   pow(x, ±0)                            = 1

     *   pow(NaN, non-zero)                    = NaN
     *   pow(abs(x) > 1, +Infinity)            = +Infinity
     *   pow(abs(x) > 1, -Infinity)            = +0
     *   pow(abs(x) == 1, ±Infinity)           = NaN
     *   pow(abs(x) < 1, +Infinity)            = +0
     *   pow(abs(x) < 1, -Infinity)            = +Infinity
     *   pow(+Infinity, y > 0)                 = +Infinity
     *   pow(+Infinity, y < 0)                 = +0
     *   pow(-Infinity, odd integer > 0)       = -Infinity
     *   pow(-Infinity, even integer > 0)      = +Infinity
     *   pow(-Infinity, odd integer < 0)       = -0
     *   pow(-Infinity, even integer < 0)      = +0
     *   pow(+0, y > 0)                        = +0
     *   pow(+0, y < 0)                        = +Infinity
     *   pow(-0, odd integer > 0)              = -0
     *   pow(-0, even integer > 0)             = +0
     *   pow(-0, odd integer < 0)              = -Infinity
     *   pow(-0, even integer < 0)             = +Infinity
     *   pow(finite x < 0, finite non-integer) = NaN
     *
     * For non-integer or very large exponents pow(x, y) is calculated using
     *
     *   x^y = exp(y*ln(x))
     *
     * Assuming the first 15 rounding digits are each equally likely to be any digit 0-9, the
     * probability of an incorrectly rounded result
     * P([49]9{14} | [50]0{14}) = 2 * 0.2 * 10^-14 = 4e-15 = 1/2.5e+14
     * i.e. 1 in 250,000,000,000,000
     *
     * If a result is incorrectly rounded the maximum error will be 1 ulp (unit in last place).
     *
     * y {number|string|Decimal} The power to which to raise this Decimal.
     *
     */
    P.toPower = P.pow = function (y) {
      var e, k, pr, r, rm, s,
        x = this,
        Ctor = x.constructor,
        yn = +(y = new Ctor(y));

      // Either ±Infinity, NaN or ±0?
      if (!x.d || !y.d || !x.d[0] || !y.d[0]) return new Ctor(mathpow(+x, yn));

      x = new Ctor(x);

      if (x.eq(1)) return x;

      pr = Ctor.precision;
      rm = Ctor.rounding;

      if (y.eq(1)) return finalise(x, pr, rm);

      // y exponent
      e = mathfloor(y.e / LOG_BASE);

      // If y is a small integer use the 'exponentiation by squaring' algorithm.
      if (e >= y.d.length - 1 && (k = yn < 0 ? -yn : yn) <= MAX_SAFE_INTEGER) {
        r = intPow(Ctor, x, k, pr);
        return y.s < 0 ? new Ctor(1).div(r) : finalise(r, pr, rm);
      }

      s = x.s;

      // if x is negative
      if (s < 0) {

        // if y is not an integer
        if (e < y.d.length - 1) return new Ctor(NaN);

        // Result is positive if x is negative and the last digit of integer y is even.
        if ((y.d[e] & 1) == 0) s = 1;

        // if x.eq(-1)
        if (x.e == 0 && x.d[0] == 1 && x.d.length == 1) {
          x.s = s;
          return x;
        }
      }

      // Estimate result exponent.
      // x^y = 10^e,  where e = y * log10(x)
      // log10(x) = log10(x_significand) + x_exponent
      // log10(x_significand) = ln(x_significand) / ln(10)
      k = mathpow(+x, yn);
      e = k == 0 || !isFinite(k)
        ? mathfloor(yn * (Math.log('0.' + digitsToString(x.d)) / Math.LN10 + x.e + 1))
        : new Ctor(k + '').e;

      // Exponent estimate may be incorrect e.g. x: 0.999999999999999999, y: 2.29, e: 0, r.e: -1.

      // Overflow/underflow?
      if (e > Ctor.maxE + 1 || e < Ctor.minE - 1) return new Ctor(e > 0 ? s / 0 : 0);

      external = false;
      Ctor.rounding = x.s = 1;

      // Estimate the extra guard digits needed to ensure five correct rounding digits from
      // naturalLogarithm(x). Example of failure without these extra digits (precision: 10):
      // new Decimal(2.32456).pow('2087987436534566.46411')
      // should be 1.162377823e+764914905173815, but is 1.162355823e+764914905173815
      k = Math.min(12, (e + '').length);

      // r = x^y = exp(y*ln(x))
      r = naturalExponential(y.times(naturalLogarithm(x, pr + k)), pr);

      // r may be Infinity, e.g. (0.9999999999999999).pow(-1e+40)
      if (r.d) {

        // Truncate to the required precision plus five rounding digits.
        r = finalise(r, pr + 5, 1);

        // If the rounding digits are [49]9999 or [50]0000 increase the precision by 10 and recalculate
        // the result.
        if (checkRoundingDigits(r.d, pr, rm)) {
          e = pr + 10;

          // Truncate to the increased precision plus five rounding digits.
          r = finalise(naturalExponential(y.times(naturalLogarithm(x, e + k)), e), e + 5, 1);

          // Check for 14 nines from the 2nd rounding digit (the first rounding digit may be 4 or 9).
          if (+digitsToString(r.d).slice(pr + 1, pr + 15) + 1 == 1e14) {
            r = finalise(r, pr + 1, 0);
          }
        }
      }

      r.s = s;
      external = true;
      Ctor.rounding = rm;

      return finalise(r, pr, rm);
    };


    /*
     * Return a string representing the value of this Decimal rounded to `sd` significant digits
     * using rounding mode `rounding`.
     *
     * Return exponential notation if `sd` is less than the number of digits necessary to represent
     * the integer part of the value in normal notation.
     *
     * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     */
    P.toPrecision = function (sd, rm) {
      var str,
        x = this,
        Ctor = x.constructor;

      if (sd === void 0) {
        str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
      } else {
        checkInt32(sd, 1, MAX_DIGITS);

        if (rm === void 0) rm = Ctor.rounding;
        else checkInt32(rm, 0, 8);

        x = finalise(new Ctor(x), sd, rm);
        str = finiteToString(x, sd <= x.e || x.e <= Ctor.toExpNeg, sd);
      }

      return x.isNeg() && !x.isZero() ? '-' + str : str;
    };


    /*
     * Return a new Decimal whose value is the value of this Decimal rounded to a maximum of `sd`
     * significant digits using rounding mode `rm`, or to `precision` and `rounding` respectively if
     * omitted.
     *
     * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * 'toSD() digits out of range: {sd}'
     * 'toSD() digits not an integer: {sd}'
     * 'toSD() rounding mode not an integer: {rm}'
     * 'toSD() rounding mode out of range: {rm}'
     *
     */
    P.toSignificantDigits = P.toSD = function (sd, rm) {
      var x = this,
        Ctor = x.constructor;

      if (sd === void 0) {
        sd = Ctor.precision;
        rm = Ctor.rounding;
      } else {
        checkInt32(sd, 1, MAX_DIGITS);

        if (rm === void 0) rm = Ctor.rounding;
        else checkInt32(rm, 0, 8);
      }

      return finalise(new Ctor(x), sd, rm);
    };


    /*
     * Return a string representing the value of this Decimal.
     *
     * Return exponential notation if this Decimal has a positive exponent equal to or greater than
     * `toExpPos`, or a negative exponent equal to or less than `toExpNeg`.
     *
     */
    P.toString = function () {
      var x = this,
        Ctor = x.constructor,
        str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);

      return x.isNeg() && !x.isZero() ? '-' + str : str;
    };


    /*
     * Return a new Decimal whose value is the value of this Decimal truncated to a whole number.
     *
     */
    P.truncated = P.trunc = function () {
      return finalise(new this.constructor(this), this.e + 1, 1);
    };


    /*
     * Return a string representing the value of this Decimal.
     * Unlike `toString`, negative zero will include the minus sign.
     *
     */
    P.valueOf = P.toJSON = function () {
      var x = this,
        Ctor = x.constructor,
        str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);

      return x.isNeg() ? '-' + str : str;
    };


    // Helper functions for Decimal.prototype (P) and/or Decimal methods, and their callers.


    /*
     *  digitsToString           P.cubeRoot, P.logarithm, P.squareRoot, P.toFraction, P.toPower,
     *                           finiteToString, naturalExponential, naturalLogarithm
     *  checkInt32               P.toDecimalPlaces, P.toExponential, P.toFixed, P.toNearest,
     *                           P.toPrecision, P.toSignificantDigits, toStringBinary, random
     *  checkRoundingDigits      P.logarithm, P.toPower, naturalExponential, naturalLogarithm
     *  convertBase              toStringBinary, parseOther
     *  cos                      P.cos
     *  divide                   P.atanh, P.cubeRoot, P.dividedBy, P.dividedToIntegerBy,
     *                           P.logarithm, P.modulo, P.squareRoot, P.tan, P.tanh, P.toFraction,
     *                           P.toNearest, toStringBinary, naturalExponential, naturalLogarithm,
     *                           taylorSeries, atan2, parseOther
     *  finalise                 P.absoluteValue, P.atan, P.atanh, P.ceil, P.cos, P.cosh,
     *                           P.cubeRoot, P.dividedToIntegerBy, P.floor, P.logarithm, P.minus,
     *                           P.modulo, P.negated, P.plus, P.round, P.sin, P.sinh, P.squareRoot,
     *                           P.tan, P.times, P.toDecimalPlaces, P.toExponential, P.toFixed,
     *                           P.toNearest, P.toPower, P.toPrecision, P.toSignificantDigits,
     *                           P.truncated, divide, getLn10, getPi, naturalExponential,
     *                           naturalLogarithm, ceil, floor, round, trunc
     *  finiteToString           P.toExponential, P.toFixed, P.toPrecision, P.toString, P.valueOf,
     *                           toStringBinary
     *  getBase10Exponent        P.minus, P.plus, P.times, parseOther
     *  getLn10                  P.logarithm, naturalLogarithm
     *  getPi                    P.acos, P.asin, P.atan, toLessThanHalfPi, atan2
     *  getPrecision             P.precision, P.toFraction
     *  getZeroString            digitsToString, finiteToString
     *  intPow                   P.toPower, parseOther
     *  isOdd                    toLessThanHalfPi
     *  maxOrMin                 max, min
     *  naturalExponential       P.naturalExponential, P.toPower
     *  naturalLogarithm         P.acosh, P.asinh, P.atanh, P.logarithm, P.naturalLogarithm,
     *                           P.toPower, naturalExponential
     *  nonFiniteToString        finiteToString, toStringBinary
     *  parseDecimal             Decimal
     *  parseOther               Decimal
     *  sin                      P.sin
     *  taylorSeries             P.cosh, P.sinh, cos, sin
     *  toLessThanHalfPi         P.cos, P.sin
     *  toStringBinary           P.toBinary, P.toHexadecimal, P.toOctal
     *  truncate                 intPow
     *
     *  Throws:                  P.logarithm, P.precision, P.toFraction, checkInt32, getLn10, getPi,
     *                           naturalLogarithm, config, parseOther, random, Decimal
     */


    function digitsToString(d) {
      var i, k, ws,
        indexOfLastWord = d.length - 1,
        str = '',
        w = d[0];

      if (indexOfLastWord > 0) {
        str += w;
        for (i = 1; i < indexOfLastWord; i++) {
          ws = d[i] + '';
          k = LOG_BASE - ws.length;
          if (k) str += getZeroString(k);
          str += ws;
        }

        w = d[i];
        ws = w + '';
        k = LOG_BASE - ws.length;
        if (k) str += getZeroString(k);
      } else if (w === 0) {
        return '0';
      }

      // Remove trailing zeros of last w.
      for (; w % 10 === 0;) w /= 10;

      return str + w;
    }


    function checkInt32(i, min, max) {
      if (i !== ~~i || i < min || i > max) {
        throw Error(invalidArgument + i);
      }
    }


    /*
     * Check 5 rounding digits if `repeating` is null, 4 otherwise.
     * `repeating == null` if caller is `log` or `pow`,
     * `repeating != null` if caller is `naturalLogarithm` or `naturalExponential`.
     */
    function checkRoundingDigits(d, i, rm, repeating) {
      var di, k, r, rd;

      // Get the length of the first word of the array d.
      for (k = d[0]; k >= 10; k /= 10) --i;

      // Is the rounding digit in the first word of d?
      if (--i < 0) {
        i += LOG_BASE;
        di = 0;
      } else {
        di = Math.ceil((i + 1) / LOG_BASE);
        i %= LOG_BASE;
      }

      // i is the index (0 - 6) of the rounding digit.
      // E.g. if within the word 3487563 the first rounding digit is 5,
      // then i = 4, k = 1000, rd = 3487563 % 1000 = 563
      k = mathpow(10, LOG_BASE - i);
      rd = d[di] % k | 0;

      if (repeating == null) {
        if (i < 3) {
          if (i == 0) rd = rd / 100 | 0;
          else if (i == 1) rd = rd / 10 | 0;
          r = rm < 4 && rd == 99999 || rm > 3 && rd == 49999 || rd == 50000 || rd == 0;
        } else {
          r = (rm < 4 && rd + 1 == k || rm > 3 && rd + 1 == k / 2) &&
            (d[di + 1] / k / 100 | 0) == mathpow(10, i - 2) - 1 ||
              (rd == k / 2 || rd == 0) && (d[di + 1] / k / 100 | 0) == 0;
        }
      } else {
        if (i < 4) {
          if (i == 0) rd = rd / 1000 | 0;
          else if (i == 1) rd = rd / 100 | 0;
          else if (i == 2) rd = rd / 10 | 0;
          r = (repeating || rm < 4) && rd == 9999 || !repeating && rm > 3 && rd == 4999;
        } else {
          r = ((repeating || rm < 4) && rd + 1 == k ||
          (!repeating && rm > 3) && rd + 1 == k / 2) &&
            (d[di + 1] / k / 1000 | 0) == mathpow(10, i - 3) - 1;
        }
      }

      return r;
    }


    // Convert string of `baseIn` to an array of numbers of `baseOut`.
    // Eg. convertBase('255', 10, 16) returns [15, 15].
    // Eg. convertBase('ff', 16, 10) returns [2, 5, 5].
    function convertBase(str, baseIn, baseOut) {
      var j,
        arr = [0],
        arrL,
        i = 0,
        strL = str.length;

      for (; i < strL;) {
        for (arrL = arr.length; arrL--;) arr[arrL] *= baseIn;
        arr[0] += NUMERALS.indexOf(str.charAt(i++));
        for (j = 0; j < arr.length; j++) {
          if (arr[j] > baseOut - 1) {
            if (arr[j + 1] === void 0) arr[j + 1] = 0;
            arr[j + 1] += arr[j] / baseOut | 0;
            arr[j] %= baseOut;
          }
        }
      }

      return arr.reverse();
    }


    /*
     * cos(x) = 1 - x^2/2! + x^4/4! - ...
     * |x| < pi/2
     *
     */
    function cosine(Ctor, x) {
      var k, len, y;

      if (x.isZero()) return x;

      // Argument reduction: cos(4x) = 8*(cos^4(x) - cos^2(x)) + 1
      // i.e. cos(x) = 8*(cos^4(x/4) - cos^2(x/4)) + 1

      // Estimate the optimum number of times to use the argument reduction.
      len = x.d.length;
      if (len < 32) {
        k = Math.ceil(len / 3);
        y = (1 / tinyPow(4, k)).toString();
      } else {
        k = 16;
        y = '2.3283064365386962890625e-10';
      }

      Ctor.precision += k;

      x = taylorSeries(Ctor, 1, x.times(y), new Ctor(1));

      // Reverse argument reduction
      for (var i = k; i--;) {
        var cos2x = x.times(x);
        x = cos2x.times(cos2x).minus(cos2x).times(8).plus(1);
      }

      Ctor.precision -= k;

      return x;
    }


    /*
     * Perform division in the specified base.
     */
    var divide = (function () {

      // Assumes non-zero x and k, and hence non-zero result.
      function multiplyInteger(x, k, base) {
        var temp,
          carry = 0,
          i = x.length;

        for (x = x.slice(); i--;) {
          temp = x[i] * k + carry;
          x[i] = temp % base | 0;
          carry = temp / base | 0;
        }

        if (carry) x.unshift(carry);

        return x;
      }

      function compare(a, b, aL, bL) {
        var i, r;

        if (aL != bL) {
          r = aL > bL ? 1 : -1;
        } else {
          for (i = r = 0; i < aL; i++) {
            if (a[i] != b[i]) {
              r = a[i] > b[i] ? 1 : -1;
              break;
            }
          }
        }

        return r;
      }

      function subtract(a, b, aL, base) {
        var i = 0;

        // Subtract b from a.
        for (; aL--;) {
          a[aL] -= i;
          i = a[aL] < b[aL] ? 1 : 0;
          a[aL] = i * base + a[aL] - b[aL];
        }

        // Remove leading zeros.
        for (; !a[0] && a.length > 1;) a.shift();
      }

      return function (x, y, pr, rm, dp, base) {
        var cmp, e, i, k, logBase, more, prod, prodL, q, qd, rem, remL, rem0, sd, t, xi, xL, yd0,
          yL, yz,
          Ctor = x.constructor,
          sign = x.s == y.s ? 1 : -1,
          xd = x.d,
          yd = y.d;

        // Either NaN, Infinity or 0?
        if (!xd || !xd[0] || !yd || !yd[0]) {

          return new Ctor(// Return NaN if either NaN, or both Infinity or 0.
            !x.s || !y.s || (xd ? yd && xd[0] == yd[0] : !yd) ? NaN :

            // Return ±0 if x is 0 or y is ±Infinity, or return ±Infinity as y is 0.
            xd && xd[0] == 0 || !yd ? sign * 0 : sign / 0);
        }

        if (base) {
          logBase = 1;
          e = x.e - y.e;
        } else {
          base = BASE;
          logBase = LOG_BASE;
          e = mathfloor(x.e / logBase) - mathfloor(y.e / logBase);
        }

        yL = yd.length;
        xL = xd.length;
        q = new Ctor(sign);
        qd = q.d = [];

        // Result exponent may be one less than e.
        // The digit array of a Decimal from toStringBinary may have trailing zeros.
        for (i = 0; yd[i] == (xd[i] || 0); i++);

        if (yd[i] > (xd[i] || 0)) e--;

        if (pr == null) {
          sd = pr = Ctor.precision;
          rm = Ctor.rounding;
        } else if (dp) {
          sd = pr + (x.e - y.e) + 1;
        } else {
          sd = pr;
        }

        if (sd < 0) {
          qd.push(1);
          more = true;
        } else {

          // Convert precision in number of base 10 digits to base 1e7 digits.
          sd = sd / logBase + 2 | 0;
          i = 0;

          // divisor < 1e7
          if (yL == 1) {
            k = 0;
            yd = yd[0];
            sd++;

            // k is the carry.
            for (; (i < xL || k) && sd--; i++) {
              t = k * base + (xd[i] || 0);
              qd[i] = t / yd | 0;
              k = t % yd | 0;
            }

            more = k || i < xL;

          // divisor >= 1e7
          } else {

            // Normalise xd and yd so highest order digit of yd is >= base/2
            k = base / (yd[0] + 1) | 0;

            if (k > 1) {
              yd = multiplyInteger(yd, k, base);
              xd = multiplyInteger(xd, k, base);
              yL = yd.length;
              xL = xd.length;
            }

            xi = yL;
            rem = xd.slice(0, yL);
            remL = rem.length;

            // Add zeros to make remainder as long as divisor.
            for (; remL < yL;) rem[remL++] = 0;

            yz = yd.slice();
            yz.unshift(0);
            yd0 = yd[0];

            if (yd[1] >= base / 2) ++yd0;

            do {
              k = 0;

              // Compare divisor and remainder.
              cmp = compare(yd, rem, yL, remL);

              // If divisor < remainder.
              if (cmp < 0) {

                // Calculate trial digit, k.
                rem0 = rem[0];
                if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);

                // k will be how many times the divisor goes into the current remainder.
                k = rem0 / yd0 | 0;

                //  Algorithm:
                //  1. product = divisor * trial digit (k)
                //  2. if product > remainder: product -= divisor, k--
                //  3. remainder -= product
                //  4. if product was < remainder at 2:
                //    5. compare new remainder and divisor
                //    6. If remainder > divisor: remainder -= divisor, k++

                if (k > 1) {
                  if (k >= base) k = base - 1;

                  // product = divisor * trial digit.
                  prod = multiplyInteger(yd, k, base);
                  prodL = prod.length;
                  remL = rem.length;

                  // Compare product and remainder.
                  cmp = compare(prod, rem, prodL, remL);

                  // product > remainder.
                  if (cmp == 1) {
                    k--;

                    // Subtract divisor from product.
                    subtract(prod, yL < prodL ? yz : yd, prodL, base);
                  }
                } else {

                  // cmp is -1.
                  // If k is 0, there is no need to compare yd and rem again below, so change cmp to 1
                  // to avoid it. If k is 1 there is a need to compare yd and rem again below.
                  if (k == 0) cmp = k = 1;
                  prod = yd.slice();
                }

                prodL = prod.length;
                if (prodL < remL) prod.unshift(0);

                // Subtract product from remainder.
                subtract(rem, prod, remL, base);

                // If product was < previous remainder.
                if (cmp == -1) {
                  remL = rem.length;

                  // Compare divisor and new remainder.
                  cmp = compare(yd, rem, yL, remL);

                  // If divisor < new remainder, subtract divisor from remainder.
                  if (cmp < 1) {
                    k++;

                    // Subtract divisor from remainder.
                    subtract(rem, yL < remL ? yz : yd, remL, base);
                  }
                }

                remL = rem.length;
              } else if (cmp === 0) {
                k++;
                rem = [0];
              }    // if cmp === 1, k will be 0

              // Add the next digit, k, to the result array.
              qd[i++] = k;

              // Update the remainder.
              if (cmp && rem[0]) {
                rem[remL++] = xd[xi] || 0;
              } else {
                rem = [xd[xi]];
                remL = 1;
              }

            } while ((xi++ < xL || rem[0] !== void 0) && sd--);

            more = rem[0] !== void 0;
          }

          // Leading zero?
          if (!qd[0]) qd.shift();
        }

        // logBase is 1 when divide is being used for base conversion.
        if (logBase == 1) {
          q.e = e;
          inexact = more;
        } else {

          // To calculate q.e, first get the number of digits of qd[0].
          for (i = 1, k = qd[0]; k >= 10; k /= 10) i++;
          q.e = i + e * logBase - 1;

          finalise(q, dp ? pr + q.e + 1 : pr, rm, more);
        }

        return q;
      };
    })();


    /*
     * Round `x` to `sd` significant digits using rounding mode `rm`.
     * Check for over/under-flow.
     */
     function finalise(x, sd, rm, isTruncated) {
      var digits, i, j, k, rd, roundUp, w, xd, xdi,
        Ctor = x.constructor;

      // Don't round if sd is null or undefined.
      out: if (sd != null) {
        xd = x.d;

        // Infinity/NaN.
        if (!xd) return x;

        // rd: the rounding digit, i.e. the digit after the digit that may be rounded up.
        // w: the word of xd containing rd, a base 1e7 number.
        // xdi: the index of w within xd.
        // digits: the number of digits of w.
        // i: what would be the index of rd within w if all the numbers were 7 digits long (i.e. if
        // they had leading zeros)
        // j: if > 0, the actual index of rd within w (if < 0, rd is a leading zero).

        // Get the length of the first word of the digits array xd.
        for (digits = 1, k = xd[0]; k >= 10; k /= 10) digits++;
        i = sd - digits;

        // Is the rounding digit in the first word of xd?
        if (i < 0) {
          i += LOG_BASE;
          j = sd;
          w = xd[xdi = 0];

          // Get the rounding digit at index j of w.
          rd = w / mathpow(10, digits - j - 1) % 10 | 0;
        } else {
          xdi = Math.ceil((i + 1) / LOG_BASE);
          k = xd.length;
          if (xdi >= k) {
            if (isTruncated) {

              // Needed by `naturalExponential`, `naturalLogarithm` and `squareRoot`.
              for (; k++ <= xdi;) xd.push(0);
              w = rd = 0;
              digits = 1;
              i %= LOG_BASE;
              j = i - LOG_BASE + 1;
            } else {
              break out;
            }
          } else {
            w = k = xd[xdi];

            // Get the number of digits of w.
            for (digits = 1; k >= 10; k /= 10) digits++;

            // Get the index of rd within w.
            i %= LOG_BASE;

            // Get the index of rd within w, adjusted for leading zeros.
            // The number of leading zeros of w is given by LOG_BASE - digits.
            j = i - LOG_BASE + digits;

            // Get the rounding digit at index j of w.
            rd = j < 0 ? 0 : w / mathpow(10, digits - j - 1) % 10 | 0;
          }
        }

        // Are there any non-zero digits after the rounding digit?
        isTruncated = isTruncated || sd < 0 ||
          xd[xdi + 1] !== void 0 || (j < 0 ? w : w % mathpow(10, digits - j - 1));

        // The expression `w % mathpow(10, digits - j - 1)` returns all the digits of w to the right
        // of the digit at (left-to-right) index j, e.g. if w is 908714 and j is 2, the expression
        // will give 714.

        roundUp = rm < 4
          ? (rd || isTruncated) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
          : rd > 5 || rd == 5 && (rm == 4 || isTruncated || rm == 6 &&

            // Check whether the digit to the left of the rounding digit is odd.
            ((i > 0 ? j > 0 ? w / mathpow(10, digits - j) : 0 : xd[xdi - 1]) % 10) & 1 ||
              rm == (x.s < 0 ? 8 : 7));

        if (sd < 1 || !xd[0]) {
          xd.length = 0;
          if (roundUp) {

            // Convert sd to decimal places.
            sd -= x.e + 1;

            // 1, 0.1, 0.01, 0.001, 0.0001 etc.
            xd[0] = mathpow(10, (LOG_BASE - sd % LOG_BASE) % LOG_BASE);
            x.e = -sd || 0;
          } else {

            // Zero.
            xd[0] = x.e = 0;
          }

          return x;
        }

        // Remove excess digits.
        if (i == 0) {
          xd.length = xdi;
          k = 1;
          xdi--;
        } else {
          xd.length = xdi + 1;
          k = mathpow(10, LOG_BASE - i);

          // E.g. 56700 becomes 56000 if 7 is the rounding digit.
          // j > 0 means i > number of leading zeros of w.
          xd[xdi] = j > 0 ? (w / mathpow(10, digits - j) % mathpow(10, j) | 0) * k : 0;
        }

        if (roundUp) {
          for (;;) {

            // Is the digit to be rounded up in the first word of xd?
            if (xdi == 0) {

              // i will be the length of xd[0] before k is added.
              for (i = 1, j = xd[0]; j >= 10; j /= 10) i++;
              j = xd[0] += k;
              for (k = 1; j >= 10; j /= 10) k++;

              // if i != k the length has increased.
              if (i != k) {
                x.e++;
                if (xd[0] == BASE) xd[0] = 1;
              }

              break;
            } else {
              xd[xdi] += k;
              if (xd[xdi] != BASE) break;
              xd[xdi--] = 0;
              k = 1;
            }
          }
        }

        // Remove trailing zeros.
        for (i = xd.length; xd[--i] === 0;) xd.pop();
      }

      if (external) {

        // Overflow?
        if (x.e > Ctor.maxE) {

          // Infinity.
          x.d = null;
          x.e = NaN;

        // Underflow?
        } else if (x.e < Ctor.minE) {

          // Zero.
          x.e = 0;
          x.d = [0];
          // Ctor.underflow = true;
        } // else Ctor.underflow = false;
      }

      return x;
    }


    function finiteToString(x, isExp, sd) {
      if (!x.isFinite()) return nonFiniteToString(x);
      var k,
        e = x.e,
        str = digitsToString(x.d),
        len = str.length;

      if (isExp) {
        if (sd && (k = sd - len) > 0) {
          str = str.charAt(0) + '.' + str.slice(1) + getZeroString(k);
        } else if (len > 1) {
          str = str.charAt(0) + '.' + str.slice(1);
        }

        str = str + (x.e < 0 ? 'e' : 'e+') + x.e;
      } else if (e < 0) {
        str = '0.' + getZeroString(-e - 1) + str;
        if (sd && (k = sd - len) > 0) str += getZeroString(k);
      } else if (e >= len) {
        str += getZeroString(e + 1 - len);
        if (sd && (k = sd - e - 1) > 0) str = str + '.' + getZeroString(k);
      } else {
        if ((k = e + 1) < len) str = str.slice(0, k) + '.' + str.slice(k);
        if (sd && (k = sd - len) > 0) {
          if (e + 1 === len) str += '.';
          str += getZeroString(k);
        }
      }

      return str;
    }


    // Calculate the base 10 exponent from the base 1e7 exponent.
    function getBase10Exponent(digits, e) {
      var w = digits[0];

      // Add the number of digits of the first word of the digits array.
      for ( e *= LOG_BASE; w >= 10; w /= 10) e++;
      return e;
    }


    function getLn10(Ctor, sd, pr) {
      if (sd > LN10_PRECISION) {

        // Reset global state in case the exception is caught.
        external = true;
        if (pr) Ctor.precision = pr;
        throw Error(precisionLimitExceeded);
      }
      return finalise(new Ctor(LN10), sd, 1, true);
    }


    function getPi(Ctor, sd, rm) {
      if (sd > PI_PRECISION) throw Error(precisionLimitExceeded);
      return finalise(new Ctor(PI), sd, rm, true);
    }


    function getPrecision(digits) {
      var w = digits.length - 1,
        len = w * LOG_BASE + 1;

      w = digits[w];

      // If non-zero...
      if (w) {

        // Subtract the number of trailing zeros of the last word.
        for (; w % 10 == 0; w /= 10) len--;

        // Add the number of digits of the first word.
        for (w = digits[0]; w >= 10; w /= 10) len++;
      }

      return len;
    }


    function getZeroString(k) {
      var zs = '';
      for (; k--;) zs += '0';
      return zs;
    }


    /*
     * Return a new Decimal whose value is the value of Decimal `x` to the power `n`, where `n` is an
     * integer of type number.
     *
     * Implements 'exponentiation by squaring'. Called by `pow` and `parseOther`.
     *
     */
    function intPow(Ctor, x, n, pr) {
      var isTruncated,
        r = new Ctor(1),

        // Max n of 9007199254740991 takes 53 loop iterations.
        // Maximum digits array length; leaves [28, 34] guard digits.
        k = Math.ceil(pr / LOG_BASE + 4);

      external = false;

      for (;;) {
        if (n % 2) {
          r = r.times(x);
          if (truncate(r.d, k)) isTruncated = true;
        }

        n = mathfloor(n / 2);
        if (n === 0) {

          // To ensure correct rounding when r.d is truncated, increment the last word if it is zero.
          n = r.d.length - 1;
          if (isTruncated && r.d[n] === 0) ++r.d[n];
          break;
        }

        x = x.times(x);
        truncate(x.d, k);
      }

      external = true;

      return r;
    }


    function isOdd(n) {
      return n.d[n.d.length - 1] & 1;
    }


    /*
     * Handle `max` and `min`. `ltgt` is 'lt' or 'gt'.
     */
    function maxOrMin(Ctor, args, ltgt) {
      var y,
        x = new Ctor(args[0]),
        i = 0;

      for (; ++i < args.length;) {
        y = new Ctor(args[i]);
        if (!y.s) {
          x = y;
          break;
        } else if (x[ltgt](y)) {
          x = y;
        }
      }

      return x;
    }


    /*
     * Return a new Decimal whose value is the natural exponential of `x` rounded to `sd` significant
     * digits.
     *
     * Taylor/Maclaurin series.
     *
     * exp(x) = x^0/0! + x^1/1! + x^2/2! + x^3/3! + ...
     *
     * Argument reduction:
     *   Repeat x = x / 32, k += 5, until |x| < 0.1
     *   exp(x) = exp(x / 2^k)^(2^k)
     *
     * Previously, the argument was initially reduced by
     * exp(x) = exp(r) * 10^k  where r = x - k * ln10, k = floor(x / ln10)
     * to first put r in the range [0, ln10], before dividing by 32 until |x| < 0.1, but this was
     * found to be slower than just dividing repeatedly by 32 as above.
     *
     * Max integer argument: exp('20723265836946413') = 6.3e+9000000000000000
     * Min integer argument: exp('-20723265836946411') = 1.2e-9000000000000000
     * (Math object integer min/max: Math.exp(709) = 8.2e+307, Math.exp(-745) = 5e-324)
     *
     *  exp(Infinity)  = Infinity
     *  exp(-Infinity) = 0
     *  exp(NaN)       = NaN
     *  exp(±0)        = 1
     *
     *  exp(x) is non-terminating for any finite, non-zero x.
     *
     *  The result will always be correctly rounded.
     *
     */
    function naturalExponential(x, sd) {
      var denominator, guard, j, pow, sum, t, wpr,
        rep = 0,
        i = 0,
        k = 0,
        Ctor = x.constructor,
        rm = Ctor.rounding,
        pr = Ctor.precision;

      // 0/NaN/Infinity?
      if (!x.d || !x.d[0] || x.e > 17) {

        return new Ctor(x.d
          ? !x.d[0] ? 1 : x.s < 0 ? 0 : 1 / 0
          : x.s ? x.s < 0 ? 0 : x : 0 / 0);
      }

      if (sd == null) {
        external = false;
        wpr = pr;
      } else {
        wpr = sd;
      }

      t = new Ctor(0.03125);

      // while abs(x) >= 0.1
      while (x.e > -2) {

        // x = x / 2^5
        x = x.times(t);
        k += 5;
      }

      // Use 2 * log10(2^k) + 5 (empirically derived) to estimate the increase in precision
      // necessary to ensure the first 4 rounding digits are correct.
      guard = Math.log(mathpow(2, k)) / Math.LN10 * 2 + 5 | 0;
      wpr += guard;
      denominator = pow = sum = new Ctor(1);
      Ctor.precision = wpr;

      for (;;) {
        pow = finalise(pow.times(x), wpr, 1);
        denominator = denominator.times(++i);
        t = sum.plus(divide(pow, denominator, wpr, 1));

        if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum.d).slice(0, wpr)) {
          j = k;
          while (j--) sum = finalise(sum.times(sum), wpr, 1);

          // Check to see if the first 4 rounding digits are [49]999.
          // If so, repeat the summation with a higher precision, otherwise
          // e.g. with precision: 18, rounding: 1
          // exp(18.404272462595034083567793919843761) = 98372560.1229999999 (should be 98372560.123)
          // `wpr - guard` is the index of first rounding digit.
          if (sd == null) {

            if (rep < 3 && checkRoundingDigits(sum.d, wpr - guard, rm, rep)) {
              Ctor.precision = wpr += 10;
              denominator = pow = t = new Ctor(1);
              i = 0;
              rep++;
            } else {
              return finalise(sum, Ctor.precision = pr, rm, external = true);
            }
          } else {
            Ctor.precision = pr;
            return sum;
          }
        }

        sum = t;
      }
    }


    /*
     * Return a new Decimal whose value is the natural logarithm of `x` rounded to `sd` significant
     * digits.
     *
     *  ln(-n)        = NaN
     *  ln(0)         = -Infinity
     *  ln(-0)        = -Infinity
     *  ln(1)         = 0
     *  ln(Infinity)  = Infinity
     *  ln(-Infinity) = NaN
     *  ln(NaN)       = NaN
     *
     *  ln(n) (n != 1) is non-terminating.
     *
     */
    function naturalLogarithm(y, sd) {
      var c, c0, denominator, e, numerator, rep, sum, t, wpr, x1, x2,
        n = 1,
        guard = 10,
        x = y,
        xd = x.d,
        Ctor = x.constructor,
        rm = Ctor.rounding,
        pr = Ctor.precision;

      // Is x negative or Infinity, NaN, 0 or 1?
      if (x.s < 0 || !xd || !xd[0] || !x.e && xd[0] == 1 && xd.length == 1) {
        return new Ctor(xd && !xd[0] ? -1 / 0 : x.s != 1 ? NaN : xd ? 0 : x);
      }

      if (sd == null) {
        external = false;
        wpr = pr;
      } else {
        wpr = sd;
      }

      Ctor.precision = wpr += guard;
      c = digitsToString(xd);
      c0 = c.charAt(0);

      if (Math.abs(e = x.e) < 1.5e15) {

        // Argument reduction.
        // The series converges faster the closer the argument is to 1, so using
        // ln(a^b) = b * ln(a),   ln(a) = ln(a^b) / b
        // multiply the argument by itself until the leading digits of the significand are 7, 8, 9,
        // 10, 11, 12 or 13, recording the number of multiplications so the sum of the series can
        // later be divided by this number, then separate out the power of 10 using
        // ln(a*10^b) = ln(a) + b*ln(10).

        // max n is 21 (gives 0.9, 1.0 or 1.1) (9e15 / 21 = 4.2e14).
        //while (c0 < 9 && c0 != 1 || c0 == 1 && c.charAt(1) > 1) {
        // max n is 6 (gives 0.7 - 1.3)
        while (c0 < 7 && c0 != 1 || c0 == 1 && c.charAt(1) > 3) {
          x = x.times(y);
          c = digitsToString(x.d);
          c0 = c.charAt(0);
          n++;
        }

        e = x.e;

        if (c0 > 1) {
          x = new Ctor('0.' + c);
          e++;
        } else {
          x = new Ctor(c0 + '.' + c.slice(1));
        }
      } else {

        // The argument reduction method above may result in overflow if the argument y is a massive
        // number with exponent >= 1500000000000000 (9e15 / 6 = 1.5e15), so instead recall this
        // function using ln(x*10^e) = ln(x) + e*ln(10).
        t = getLn10(Ctor, wpr + 2, pr).times(e + '');
        x = naturalLogarithm(new Ctor(c0 + '.' + c.slice(1)), wpr - guard).plus(t);
        Ctor.precision = pr;

        return sd == null ? finalise(x, pr, rm, external = true) : x;
      }

      // x1 is x reduced to a value near 1.
      x1 = x;

      // Taylor series.
      // ln(y) = ln((1 + x)/(1 - x)) = 2(x + x^3/3 + x^5/5 + x^7/7 + ...)
      // where x = (y - 1)/(y + 1)    (|x| < 1)
      sum = numerator = x = divide(x.minus(1), x.plus(1), wpr, 1);
      x2 = finalise(x.times(x), wpr, 1);
      denominator = 3;

      for (;;) {
        numerator = finalise(numerator.times(x2), wpr, 1);
        t = sum.plus(divide(numerator, new Ctor(denominator), wpr, 1));

        if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum.d).slice(0, wpr)) {
          sum = sum.times(2);

          // Reverse the argument reduction. Check that e is not 0 because, besides preventing an
          // unnecessary calculation, -0 + 0 = +0 and to ensure correct rounding -0 needs to stay -0.
          if (e !== 0) sum = sum.plus(getLn10(Ctor, wpr + 2, pr).times(e + ''));
          sum = divide(sum, new Ctor(n), wpr, 1);

          // Is rm > 3 and the first 4 rounding digits 4999, or rm < 4 (or the summation has
          // been repeated previously) and the first 4 rounding digits 9999?
          // If so, restart the summation with a higher precision, otherwise
          // e.g. with precision: 12, rounding: 1
          // ln(135520028.6126091714265381533) = 18.7246299999 when it should be 18.72463.
          // `wpr - guard` is the index of first rounding digit.
          if (sd == null) {
            if (checkRoundingDigits(sum.d, wpr - guard, rm, rep)) {
              Ctor.precision = wpr += guard;
              t = numerator = x = divide(x1.minus(1), x1.plus(1), wpr, 1);
              x2 = finalise(x.times(x), wpr, 1);
              denominator = rep = 1;
            } else {
              return finalise(sum, Ctor.precision = pr, rm, external = true);
            }
          } else {
            Ctor.precision = pr;
            return sum;
          }
        }

        sum = t;
        denominator += 2;
      }
    }


    // ±Infinity, NaN.
    function nonFiniteToString(x) {
      // Unsigned.
      return String(x.s * x.s / 0);
    }


    /*
     * Parse the value of a new Decimal `x` from string `str`.
     */
    function parseDecimal(x, str) {
      var e, i, len;

      // Decimal point?
      if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');

      // Exponential form?
      if ((i = str.search(/e/i)) > 0) {

        // Determine exponent.
        if (e < 0) e = i;
        e += +str.slice(i + 1);
        str = str.substring(0, i);
      } else if (e < 0) {

        // Integer.
        e = str.length;
      }

      // Determine leading zeros.
      for (i = 0; str.charCodeAt(i) === 48; i++);

      // Determine trailing zeros.
      for (len = str.length; str.charCodeAt(len - 1) === 48; --len);
      str = str.slice(i, len);

      if (str) {
        len -= i;
        x.e = e = e - i - 1;
        x.d = [];

        // Transform base

        // e is the base 10 exponent.
        // i is where to slice str to get the first word of the digits array.
        i = (e + 1) % LOG_BASE;
        if (e < 0) i += LOG_BASE;

        if (i < len) {
          if (i) x.d.push(+str.slice(0, i));
          for (len -= LOG_BASE; i < len;) x.d.push(+str.slice(i, i += LOG_BASE));
          str = str.slice(i);
          i = LOG_BASE - str.length;
        } else {
          i -= len;
        }

        for (; i--;) str += '0';
        x.d.push(+str);

        if (external) {

          // Overflow?
          if (x.e > x.constructor.maxE) {

            // Infinity.
            x.d = null;
            x.e = NaN;

          // Underflow?
          } else if (x.e < x.constructor.minE) {

            // Zero.
            x.e = 0;
            x.d = [0];
            // x.constructor.underflow = true;
          } // else x.constructor.underflow = false;
        }
      } else {

        // Zero.
        x.e = 0;
        x.d = [0];
      }

      return x;
    }


    /*
     * Parse the value of a new Decimal `x` from a string `str`, which is not a decimal value.
     */
    function parseOther(x, str) {
      var base, Ctor, divisor, i, isFloat, len, p, xd, xe;

      if (str.indexOf('_') > -1) {
        str = str.replace(/(\d)_(?=\d)/g, '$1');
        if (isDecimal.test(str)) return parseDecimal(x, str);
      } else if (str === 'Infinity' || str === 'NaN') {
        if (!+str) x.s = NaN;
        x.e = NaN;
        x.d = null;
        return x;
      }

      if (isHex.test(str))  {
        base = 16;
        str = str.toLowerCase();
      } else if (isBinary.test(str))  {
        base = 2;
      } else if (isOctal.test(str))  {
        base = 8;
      } else {
        throw Error(invalidArgument + str);
      }

      // Is there a binary exponent part?
      i = str.search(/p/i);

      if (i > 0) {
        p = +str.slice(i + 1);
        str = str.substring(2, i);
      } else {
        str = str.slice(2);
      }

      // Convert `str` as an integer then divide the result by `base` raised to a power such that the
      // fraction part will be restored.
      i = str.indexOf('.');
      isFloat = i >= 0;
      Ctor = x.constructor;

      if (isFloat) {
        str = str.replace('.', '');
        len = str.length;
        i = len - i;

        // log[10](16) = 1.2041... , log[10](88) = 1.9444....
        divisor = intPow(Ctor, new Ctor(base), i, i * 2);
      }

      xd = convertBase(str, base, BASE);
      xe = xd.length - 1;

      // Remove trailing zeros.
      for (i = xe; xd[i] === 0; --i) xd.pop();
      if (i < 0) return new Ctor(x.s * 0);
      x.e = getBase10Exponent(xd, xe);
      x.d = xd;
      external = false;

      // At what precision to perform the division to ensure exact conversion?
      // maxDecimalIntegerPartDigitCount = ceil(log[10](b) * otherBaseIntegerPartDigitCount)
      // log[10](2) = 0.30103, log[10](8) = 0.90309, log[10](16) = 1.20412
      // E.g. ceil(1.2 * 3) = 4, so up to 4 decimal digits are needed to represent 3 hex int digits.
      // maxDecimalFractionPartDigitCount = {Hex:4|Oct:3|Bin:1} * otherBaseFractionPartDigitCount
      // Therefore using 4 * the number of digits of str will always be enough.
      if (isFloat) x = divide(x, divisor, len * 4);

      // Multiply by the binary exponent part if present.
      if (p) x = x.times(Math.abs(p) < 54 ? mathpow(2, p) : Decimal.pow(2, p));
      external = true;

      return x;
    }


    /*
     * sin(x) = x - x^3/3! + x^5/5! - ...
     * |x| < pi/2
     *
     */
    function sine(Ctor, x) {
      var k,
        len = x.d.length;

      if (len < 3) {
        return x.isZero() ? x : taylorSeries(Ctor, 2, x, x);
      }

      // Argument reduction: sin(5x) = 16*sin^5(x) - 20*sin^3(x) + 5*sin(x)
      // i.e. sin(x) = 16*sin^5(x/5) - 20*sin^3(x/5) + 5*sin(x/5)
      // and  sin(x) = sin(x/5)(5 + sin^2(x/5)(16sin^2(x/5) - 20))

      // Estimate the optimum number of times to use the argument reduction.
      k = 1.4 * Math.sqrt(len);
      k = k > 16 ? 16 : k | 0;

      x = x.times(1 / tinyPow(5, k));
      x = taylorSeries(Ctor, 2, x, x);

      // Reverse argument reduction
      var sin2_x,
        d5 = new Ctor(5),
        d16 = new Ctor(16),
        d20 = new Ctor(20);
      for (; k--;) {
        sin2_x = x.times(x);
        x = x.times(d5.plus(sin2_x.times(d16.times(sin2_x).minus(d20))));
      }

      return x;
    }


    // Calculate Taylor series for `cos`, `cosh`, `sin` and `sinh`.
    function taylorSeries(Ctor, n, x, y, isHyperbolic) {
      var j, t, u, x2,
        pr = Ctor.precision,
        k = Math.ceil(pr / LOG_BASE);

      external = false;
      x2 = x.times(x);
      u = new Ctor(y);

      for (;;) {
        t = divide(u.times(x2), new Ctor(n++ * n++), pr, 1);
        u = isHyperbolic ? y.plus(t) : y.minus(t);
        y = divide(t.times(x2), new Ctor(n++ * n++), pr, 1);
        t = u.plus(y);

        if (t.d[k] !== void 0) {
          for (j = k; t.d[j] === u.d[j] && j--;);
          if (j == -1) break;
        }

        j = u;
        u = y;
        y = t;
        t = j;
      }

      external = true;
      t.d.length = k + 1;

      return t;
    }


    // Exponent e must be positive and non-zero.
    function tinyPow(b, e) {
      var n = b;
      while (--e) n *= b;
      return n;
    }


    // Return the absolute value of `x` reduced to less than or equal to half pi.
    function toLessThanHalfPi(Ctor, x) {
      var t,
        isNeg = x.s < 0,
        pi = getPi(Ctor, Ctor.precision, 1),
        halfPi = pi.times(0.5);

      x = x.abs();

      if (x.lte(halfPi)) {
        quadrant = isNeg ? 4 : 1;
        return x;
      }

      t = x.divToInt(pi);

      if (t.isZero()) {
        quadrant = isNeg ? 3 : 2;
      } else {
        x = x.minus(t.times(pi));

        // 0 <= x < pi
        if (x.lte(halfPi)) {
          quadrant = isOdd(t) ? (isNeg ? 2 : 3) : (isNeg ? 4 : 1);
          return x;
        }

        quadrant = isOdd(t) ? (isNeg ? 1 : 4) : (isNeg ? 3 : 2);
      }

      return x.minus(pi).abs();
    }


    /*
     * Return the value of Decimal `x` as a string in base `baseOut`.
     *
     * If the optional `sd` argument is present include a binary exponent suffix.
     */
    function toStringBinary(x, baseOut, sd, rm) {
      var base, e, i, k, len, roundUp, str, xd, y,
        Ctor = x.constructor,
        isExp = sd !== void 0;

      if (isExp) {
        checkInt32(sd, 1, MAX_DIGITS);
        if (rm === void 0) rm = Ctor.rounding;
        else checkInt32(rm, 0, 8);
      } else {
        sd = Ctor.precision;
        rm = Ctor.rounding;
      }

      if (!x.isFinite()) {
        str = nonFiniteToString(x);
      } else {
        str = finiteToString(x);
        i = str.indexOf('.');

        // Use exponential notation according to `toExpPos` and `toExpNeg`? No, but if required:
        // maxBinaryExponent = floor((decimalExponent + 1) * log[2](10))
        // minBinaryExponent = floor(decimalExponent * log[2](10))
        // log[2](10) = 3.321928094887362347870319429489390175864

        if (isExp) {
          base = 2;
          if (baseOut == 16) {
            sd = sd * 4 - 3;
          } else if (baseOut == 8) {
            sd = sd * 3 - 2;
          }
        } else {
          base = baseOut;
        }

        // Convert the number as an integer then divide the result by its base raised to a power such
        // that the fraction part will be restored.

        // Non-integer.
        if (i >= 0) {
          str = str.replace('.', '');
          y = new Ctor(1);
          y.e = str.length - i;
          y.d = convertBase(finiteToString(y), 10, base);
          y.e = y.d.length;
        }

        xd = convertBase(str, 10, base);
        e = len = xd.length;

        // Remove trailing zeros.
        for (; xd[--len] == 0;) xd.pop();

        if (!xd[0]) {
          str = isExp ? '0p+0' : '0';
        } else {
          if (i < 0) {
            e--;
          } else {
            x = new Ctor(x);
            x.d = xd;
            x.e = e;
            x = divide(x, y, sd, rm, 0, base);
            xd = x.d;
            e = x.e;
            roundUp = inexact;
          }

          // The rounding digit, i.e. the digit after the digit that may be rounded up.
          i = xd[sd];
          k = base / 2;
          roundUp = roundUp || xd[sd + 1] !== void 0;

          roundUp = rm < 4
            ? (i !== void 0 || roundUp) && (rm === 0 || rm === (x.s < 0 ? 3 : 2))
            : i > k || i === k && (rm === 4 || roundUp || rm === 6 && xd[sd - 1] & 1 ||
              rm === (x.s < 0 ? 8 : 7));

          xd.length = sd;

          if (roundUp) {

            // Rounding up may mean the previous digit has to be rounded up and so on.
            for (; ++xd[--sd] > base - 1;) {
              xd[sd] = 0;
              if (!sd) {
                ++e;
                xd.unshift(1);
              }
            }
          }

          // Determine trailing zeros.
          for (len = xd.length; !xd[len - 1]; --len);

          // E.g. [4, 11, 15] becomes 4bf.
          for (i = 0, str = ''; i < len; i++) str += NUMERALS.charAt(xd[i]);

          // Add binary exponent suffix?
          if (isExp) {
            if (len > 1) {
              if (baseOut == 16 || baseOut == 8) {
                i = baseOut == 16 ? 4 : 3;
                for (--len; len % i; len++) str += '0';
                xd = convertBase(str, base, baseOut);
                for (len = xd.length; !xd[len - 1]; --len);

                // xd[0] will always be be 1
                for (i = 1, str = '1.'; i < len; i++) str += NUMERALS.charAt(xd[i]);
              } else {
                str = str.charAt(0) + '.' + str.slice(1);
              }
            }

            str =  str + (e < 0 ? 'p' : 'p+') + e;
          } else if (e < 0) {
            for (; ++e;) str = '0' + str;
            str = '0.' + str;
          } else {
            if (++e > len) for (e -= len; e-- ;) str += '0';
            else if (e < len) str = str.slice(0, e) + '.' + str.slice(e);
          }
        }

        str = (baseOut == 16 ? '0x' : baseOut == 2 ? '0b' : baseOut == 8 ? '0o' : '') + str;
      }

      return x.s < 0 ? '-' + str : str;
    }


    // Does not strip trailing zeros.
    function truncate(arr, len) {
      if (arr.length > len) {
        arr.length = len;
        return true;
      }
    }


    // Decimal methods


    /*
     *  abs
     *  acos
     *  acosh
     *  add
     *  asin
     *  asinh
     *  atan
     *  atanh
     *  atan2
     *  cbrt
     *  ceil
     *  clamp
     *  clone
     *  config
     *  cos
     *  cosh
     *  div
     *  exp
     *  floor
     *  hypot
     *  ln
     *  log
     *  log2
     *  log10
     *  max
     *  min
     *  mod
     *  mul
     *  pow
     *  random
     *  round
     *  set
     *  sign
     *  sin
     *  sinh
     *  sqrt
     *  sub
     *  sum
     *  tan
     *  tanh
     *  trunc
     */


    /*
     * Return a new Decimal whose value is the absolute value of `x`.
     *
     * x {number|string|Decimal}
     *
     */
    function abs(x) {
      return new this(x).abs();
    }


    /*
     * Return a new Decimal whose value is the arccosine in radians of `x`.
     *
     * x {number|string|Decimal}
     *
     */
    function acos(x) {
      return new this(x).acos();
    }


    /*
     * Return a new Decimal whose value is the inverse of the hyperbolic cosine of `x`, rounded to
     * `precision` significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} A value in radians.
     *
     */
    function acosh(x) {
      return new this(x).acosh();
    }


    /*
     * Return a new Decimal whose value is the sum of `x` and `y`, rounded to `precision` significant
     * digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     * y {number|string|Decimal}
     *
     */
    function add(x, y) {
      return new this(x).plus(y);
    }


    /*
     * Return a new Decimal whose value is the arcsine in radians of `x`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     *
     */
    function asin(x) {
      return new this(x).asin();
    }


    /*
     * Return a new Decimal whose value is the inverse of the hyperbolic sine of `x`, rounded to
     * `precision` significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} A value in radians.
     *
     */
    function asinh(x) {
      return new this(x).asinh();
    }


    /*
     * Return a new Decimal whose value is the arctangent in radians of `x`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     *
     */
    function atan(x) {
      return new this(x).atan();
    }


    /*
     * Return a new Decimal whose value is the inverse of the hyperbolic tangent of `x`, rounded to
     * `precision` significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} A value in radians.
     *
     */
    function atanh(x) {
      return new this(x).atanh();
    }


    /*
     * Return a new Decimal whose value is the arctangent in radians of `y/x` in the range -pi to pi
     * (inclusive), rounded to `precision` significant digits using rounding mode `rounding`.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [-pi, pi]
     *
     * y {number|string|Decimal} The y-coordinate.
     * x {number|string|Decimal} The x-coordinate.
     *
     * atan2(±0, -0)               = ±pi
     * atan2(±0, +0)               = ±0
     * atan2(±0, -x)               = ±pi for x > 0
     * atan2(±0, x)                = ±0 for x > 0
     * atan2(-y, ±0)               = -pi/2 for y > 0
     * atan2(y, ±0)                = pi/2 for y > 0
     * atan2(±y, -Infinity)        = ±pi for finite y > 0
     * atan2(±y, +Infinity)        = ±0 for finite y > 0
     * atan2(±Infinity, x)         = ±pi/2 for finite x
     * atan2(±Infinity, -Infinity) = ±3*pi/4
     * atan2(±Infinity, +Infinity) = ±pi/4
     * atan2(NaN, x) = NaN
     * atan2(y, NaN) = NaN
     *
     */
    function atan2(y, x) {
      y = new this(y);
      x = new this(x);
      var r,
        pr = this.precision,
        rm = this.rounding,
        wpr = pr + 4;

      // Either NaN
      if (!y.s || !x.s) {
        r = new this(NaN);

      // Both ±Infinity
      } else if (!y.d && !x.d) {
        r = getPi(this, wpr, 1).times(x.s > 0 ? 0.25 : 0.75);
        r.s = y.s;

      // x is ±Infinity or y is ±0
      } else if (!x.d || y.isZero()) {
        r = x.s < 0 ? getPi(this, pr, rm) : new this(0);
        r.s = y.s;

      // y is ±Infinity or x is ±0
      } else if (!y.d || x.isZero()) {
        r = getPi(this, wpr, 1).times(0.5);
        r.s = y.s;

      // Both non-zero and finite
      } else if (x.s < 0) {
        this.precision = wpr;
        this.rounding = 1;
        r = this.atan(divide(y, x, wpr, 1));
        x = getPi(this, wpr, 1);
        this.precision = pr;
        this.rounding = rm;
        r = y.s < 0 ? r.minus(x) : r.plus(x);
      } else {
        r = this.atan(divide(y, x, wpr, 1));
      }

      return r;
    }


    /*
     * Return a new Decimal whose value is the cube root of `x`, rounded to `precision` significant
     * digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     *
     */
    function cbrt(x) {
      return new this(x).cbrt();
    }


    /*
     * Return a new Decimal whose value is `x` rounded to an integer using `ROUND_CEIL`.
     *
     * x {number|string|Decimal}
     *
     */
    function ceil(x) {
      return finalise(x = new this(x), x.e + 1, 2);
    }


    /*
     * Return a new Decimal whose value is `x` clamped to the range delineated by `min` and `max`.
     *
     * x {number|string|Decimal}
     * min {number|string|Decimal}
     * max {number|string|Decimal}
     *
     */
    function clamp(x, min, max) {
      return new this(x).clamp(min, max);
    }


    /*
     * Configure global settings for a Decimal constructor.
     *
     * `obj` is an object with one or more of the following properties,
     *
     *   precision  {number}
     *   rounding   {number}
     *   toExpNeg   {number}
     *   toExpPos   {number}
     *   maxE       {number}
     *   minE       {number}
     *   modulo     {number}
     *   crypto     {boolean|number}
     *   defaults   {true}
     *
     * E.g. Decimal.config({ precision: 20, rounding: 4 })
     *
     */
    function config(obj) {
      if (!obj || typeof obj !== 'object') throw Error(decimalError + 'Object expected');
      var i, p, v,
        useDefaults = obj.defaults === true,
        ps = [
          'precision', 1, MAX_DIGITS,
          'rounding', 0, 8,
          'toExpNeg', -EXP_LIMIT, 0,
          'toExpPos', 0, EXP_LIMIT,
          'maxE', 0, EXP_LIMIT,
          'minE', -EXP_LIMIT, 0,
          'modulo', 0, 9
        ];

      for (i = 0; i < ps.length; i += 3) {
        if (p = ps[i], useDefaults) this[p] = DEFAULTS[p];
        if ((v = obj[p]) !== void 0) {
          if (mathfloor(v) === v && v >= ps[i + 1] && v <= ps[i + 2]) this[p] = v;
          else throw Error(invalidArgument + p + ': ' + v);
        }
      }

      if (p = 'crypto', useDefaults) this[p] = DEFAULTS[p];
      if ((v = obj[p]) !== void 0) {
        if (v === true || v === false || v === 0 || v === 1) {
          if (v) {
            if (typeof crypto != 'undefined' && crypto &&
              (crypto.getRandomValues || crypto.randomBytes)) {
              this[p] = true;
            } else {
              throw Error(cryptoUnavailable);
            }
          } else {
            this[p] = false;
          }
        } else {
          throw Error(invalidArgument + p + ': ' + v);
        }
      }

      return this;
    }


    /*
     * Return a new Decimal whose value is the cosine of `x`, rounded to `precision` significant
     * digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} A value in radians.
     *
     */
    function cos(x) {
      return new this(x).cos();
    }


    /*
     * Return a new Decimal whose value is the hyperbolic cosine of `x`, rounded to precision
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} A value in radians.
     *
     */
    function cosh(x) {
      return new this(x).cosh();
    }


    /*
     * Create and return a Decimal constructor with the same configuration properties as this Decimal
     * constructor.
     *
     */
    function clone(obj) {
      var i, p, ps;

      /*
       * The Decimal constructor and exported function.
       * Return a new Decimal instance.
       *
       * v {number|string|Decimal} A numeric value.
       *
       */
      function Decimal(v) {
        var e, i, t,
          x = this;

        // Decimal called without new.
        if (!(x instanceof Decimal)) return new Decimal(v);

        // Retain a reference to this Decimal constructor, and shadow Decimal.prototype.constructor
        // which points to Object.
        x.constructor = Decimal;

        // Duplicate.
        if (isDecimalInstance(v)) {
          x.s = v.s;

          if (external) {
            if (!v.d || v.e > Decimal.maxE) {

              // Infinity.
              x.e = NaN;
              x.d = null;
            } else if (v.e < Decimal.minE) {

              // Zero.
              x.e = 0;
              x.d = [0];
            } else {
              x.e = v.e;
              x.d = v.d.slice();
            }
          } else {
            x.e = v.e;
            x.d = v.d ? v.d.slice() : v.d;
          }

          return;
        }

        t = typeof v;

        if (t === 'number') {
          if (v === 0) {
            x.s = 1 / v < 0 ? -1 : 1;
            x.e = 0;
            x.d = [0];
            return;
          }

          if (v < 0) {
            v = -v;
            x.s = -1;
          } else {
            x.s = 1;
          }

          // Fast path for small integers.
          if (v === ~~v && v < 1e7) {
            for (e = 0, i = v; i >= 10; i /= 10) e++;

            if (external) {
              if (e > Decimal.maxE) {
                x.e = NaN;
                x.d = null;
              } else if (e < Decimal.minE) {
                x.e = 0;
                x.d = [0];
              } else {
                x.e = e;
                x.d = [v];
              }
            } else {
              x.e = e;
              x.d = [v];
            }

            return;

          // Infinity, NaN.
          } else if (v * 0 !== 0) {
            if (!v) x.s = NaN;
            x.e = NaN;
            x.d = null;
            return;
          }

          return parseDecimal(x, v.toString());

        } else if (t !== 'string') {
          throw Error(invalidArgument + v);
        }

        // Minus sign?
        if ((i = v.charCodeAt(0)) === 45) {
          v = v.slice(1);
          x.s = -1;
        } else {
          // Plus sign?
          if (i === 43) v = v.slice(1);
          x.s = 1;
        }

        return isDecimal.test(v) ? parseDecimal(x, v) : parseOther(x, v);
      }

      Decimal.prototype = P;

      Decimal.ROUND_UP = 0;
      Decimal.ROUND_DOWN = 1;
      Decimal.ROUND_CEIL = 2;
      Decimal.ROUND_FLOOR = 3;
      Decimal.ROUND_HALF_UP = 4;
      Decimal.ROUND_HALF_DOWN = 5;
      Decimal.ROUND_HALF_EVEN = 6;
      Decimal.ROUND_HALF_CEIL = 7;
      Decimal.ROUND_HALF_FLOOR = 8;
      Decimal.EUCLID = 9;

      Decimal.config = Decimal.set = config;
      Decimal.clone = clone;
      Decimal.isDecimal = isDecimalInstance;

      Decimal.abs = abs;
      Decimal.acos = acos;
      Decimal.acosh = acosh;        // ES6
      Decimal.add = add;
      Decimal.asin = asin;
      Decimal.asinh = asinh;        // ES6
      Decimal.atan = atan;
      Decimal.atanh = atanh;        // ES6
      Decimal.atan2 = atan2;
      Decimal.cbrt = cbrt;          // ES6
      Decimal.ceil = ceil;
      Decimal.clamp = clamp;
      Decimal.cos = cos;
      Decimal.cosh = cosh;          // ES6
      Decimal.div = div;
      Decimal.exp = exp;
      Decimal.floor = floor;
      Decimal.hypot = hypot;        // ES6
      Decimal.ln = ln;
      Decimal.log = log;
      Decimal.log10 = log10;        // ES6
      Decimal.log2 = log2;          // ES6
      Decimal.max = max;
      Decimal.min = min;
      Decimal.mod = mod;
      Decimal.mul = mul;
      Decimal.pow = pow;
      Decimal.random = random;
      Decimal.round = round;
      Decimal.sign = sign;          // ES6
      Decimal.sin = sin;
      Decimal.sinh = sinh;          // ES6
      Decimal.sqrt = sqrt;
      Decimal.sub = sub;
      Decimal.sum = sum;
      Decimal.tan = tan;
      Decimal.tanh = tanh;          // ES6
      Decimal.trunc = trunc;        // ES6

      if (obj === void 0) obj = {};
      if (obj) {
        if (obj.defaults !== true) {
          ps = ['precision', 'rounding', 'toExpNeg', 'toExpPos', 'maxE', 'minE', 'modulo', 'crypto'];
          for (i = 0; i < ps.length;) if (!obj.hasOwnProperty(p = ps[i++])) obj[p] = this[p];
        }
      }

      Decimal.config(obj);

      return Decimal;
    }


    /*
     * Return a new Decimal whose value is `x` divided by `y`, rounded to `precision` significant
     * digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     * y {number|string|Decimal}
     *
     */
    function div(x, y) {
      return new this(x).div(y);
    }


    /*
     * Return a new Decimal whose value is the natural exponential of `x`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} The power to which to raise the base of the natural log.
     *
     */
    function exp(x) {
      return new this(x).exp();
    }


    /*
     * Return a new Decimal whose value is `x` round to an integer using `ROUND_FLOOR`.
     *
     * x {number|string|Decimal}
     *
     */
    function floor(x) {
      return finalise(x = new this(x), x.e + 1, 3);
    }


    /*
     * Return a new Decimal whose value is the square root of the sum of the squares of the arguments,
     * rounded to `precision` significant digits using rounding mode `rounding`.
     *
     * hypot(a, b, ...) = sqrt(a^2 + b^2 + ...)
     *
     * arguments {number|string|Decimal}
     *
     */
    function hypot() {
      var i, n,
        t = new this(0);

      external = false;

      for (i = 0; i < arguments.length;) {
        n = new this(arguments[i++]);
        if (!n.d) {
          if (n.s) {
            external = true;
            return new this(1 / 0);
          }
          t = n;
        } else if (t.d) {
          t = t.plus(n.times(n));
        }
      }

      external = true;

      return t.sqrt();
    }


    /*
     * Return true if object is a Decimal instance (where Decimal is any Decimal constructor),
     * otherwise return false.
     *
     */
    function isDecimalInstance(obj) {
      return obj instanceof Decimal || obj && obj.toStringTag === tag || false;
    }


    /*
     * Return a new Decimal whose value is the natural logarithm of `x`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     *
     */
    function ln(x) {
      return new this(x).ln();
    }


    /*
     * Return a new Decimal whose value is the log of `x` to the base `y`, or to base 10 if no base
     * is specified, rounded to `precision` significant digits using rounding mode `rounding`.
     *
     * log[y](x)
     *
     * x {number|string|Decimal} The argument of the logarithm.
     * y {number|string|Decimal} The base of the logarithm.
     *
     */
    function log(x, y) {
      return new this(x).log(y);
    }


    /*
     * Return a new Decimal whose value is the base 2 logarithm of `x`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     *
     */
    function log2(x) {
      return new this(x).log(2);
    }


    /*
     * Return a new Decimal whose value is the base 10 logarithm of `x`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     *
     */
    function log10(x) {
      return new this(x).log(10);
    }


    /*
     * Return a new Decimal whose value is the maximum of the arguments.
     *
     * arguments {number|string|Decimal}
     *
     */
    function max() {
      return maxOrMin(this, arguments, 'lt');
    }


    /*
     * Return a new Decimal whose value is the minimum of the arguments.
     *
     * arguments {number|string|Decimal}
     *
     */
    function min() {
      return maxOrMin(this, arguments, 'gt');
    }


    /*
     * Return a new Decimal whose value is `x` modulo `y`, rounded to `precision` significant digits
     * using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     * y {number|string|Decimal}
     *
     */
    function mod(x, y) {
      return new this(x).mod(y);
    }


    /*
     * Return a new Decimal whose value is `x` multiplied by `y`, rounded to `precision` significant
     * digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     * y {number|string|Decimal}
     *
     */
    function mul(x, y) {
      return new this(x).mul(y);
    }


    /*
     * Return a new Decimal whose value is `x` raised to the power `y`, rounded to precision
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} The base.
     * y {number|string|Decimal} The exponent.
     *
     */
    function pow(x, y) {
      return new this(x).pow(y);
    }


    /*
     * Returns a new Decimal with a random value equal to or greater than 0 and less than 1, and with
     * `sd`, or `Decimal.precision` if `sd` is omitted, significant digits (or less if trailing zeros
     * are produced).
     *
     * [sd] {number} Significant digits. Integer, 0 to MAX_DIGITS inclusive.
     *
     */
    function random(sd) {
      var d, e, k, n,
        i = 0,
        r = new this(1),
        rd = [];

      if (sd === void 0) sd = this.precision;
      else checkInt32(sd, 1, MAX_DIGITS);

      k = Math.ceil(sd / LOG_BASE);

      if (!this.crypto) {
        for (; i < k;) rd[i++] = Math.random() * 1e7 | 0;

      // Browsers supporting crypto.getRandomValues.
      } else if (crypto.getRandomValues) {
        d = crypto.getRandomValues(new Uint32Array(k));

        for (; i < k;) {
          n = d[i];

          // 0 <= n < 4294967296
          // Probability n >= 4.29e9, is 4967296 / 4294967296 = 0.00116 (1 in 865).
          if (n >= 4.29e9) {
            d[i] = crypto.getRandomValues(new Uint32Array(1))[0];
          } else {

            // 0 <= n <= 4289999999
            // 0 <= (n % 1e7) <= 9999999
            rd[i++] = n % 1e7;
          }
        }

      // Node.js supporting crypto.randomBytes.
      } else if (crypto.randomBytes) {

        // buffer
        d = crypto.randomBytes(k *= 4);

        for (; i < k;) {

          // 0 <= n < 2147483648
          n = d[i] + (d[i + 1] << 8) + (d[i + 2] << 16) + ((d[i + 3] & 0x7f) << 24);

          // Probability n >= 2.14e9, is 7483648 / 2147483648 = 0.0035 (1 in 286).
          if (n >= 2.14e9) {
            crypto.randomBytes(4).copy(d, i);
          } else {

            // 0 <= n <= 2139999999
            // 0 <= (n % 1e7) <= 9999999
            rd.push(n % 1e7);
            i += 4;
          }
        }

        i = k / 4;
      } else {
        throw Error(cryptoUnavailable);
      }

      k = rd[--i];
      sd %= LOG_BASE;

      // Convert trailing digits to zeros according to sd.
      if (k && sd) {
        n = mathpow(10, LOG_BASE - sd);
        rd[i] = (k / n | 0) * n;
      }

      // Remove trailing words which are zero.
      for (; rd[i] === 0; i--) rd.pop();

      // Zero?
      if (i < 0) {
        e = 0;
        rd = [0];
      } else {
        e = -1;

        // Remove leading words which are zero and adjust exponent accordingly.
        for (; rd[0] === 0; e -= LOG_BASE) rd.shift();

        // Count the digits of the first word of rd to determine leading zeros.
        for (k = 1, n = rd[0]; n >= 10; n /= 10) k++;

        // Adjust the exponent for leading zeros of the first word of rd.
        if (k < LOG_BASE) e -= LOG_BASE - k;
      }

      r.e = e;
      r.d = rd;

      return r;
    }


    /*
     * Return a new Decimal whose value is `x` rounded to an integer using rounding mode `rounding`.
     *
     * To emulate `Math.round`, set rounding to 7 (ROUND_HALF_CEIL).
     *
     * x {number|string|Decimal}
     *
     */
    function round(x) {
      return finalise(x = new this(x), x.e + 1, this.rounding);
    }


    /*
     * Return
     *   1    if x > 0,
     *  -1    if x < 0,
     *   0    if x is 0,
     *  -0    if x is -0,
     *   NaN  otherwise
     *
     * x {number|string|Decimal}
     *
     */
    function sign(x) {
      x = new this(x);
      return x.d ? (x.d[0] ? x.s : 0 * x.s) : x.s || NaN;
    }


    /*
     * Return a new Decimal whose value is the sine of `x`, rounded to `precision` significant digits
     * using rounding mode `rounding`.
     *
     * x {number|string|Decimal} A value in radians.
     *
     */
    function sin(x) {
      return new this(x).sin();
    }


    /*
     * Return a new Decimal whose value is the hyperbolic sine of `x`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} A value in radians.
     *
     */
    function sinh(x) {
      return new this(x).sinh();
    }


    /*
     * Return a new Decimal whose value is the square root of `x`, rounded to `precision` significant
     * digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     *
     */
    function sqrt(x) {
      return new this(x).sqrt();
    }


    /*
     * Return a new Decimal whose value is `x` minus `y`, rounded to `precision` significant digits
     * using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     * y {number|string|Decimal}
     *
     */
    function sub(x, y) {
      return new this(x).sub(y);
    }


    /*
     * Return a new Decimal whose value is the sum of the arguments, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * Only the result is rounded, not the intermediate calculations.
     *
     * arguments {number|string|Decimal}
     *
     */
    function sum() {
      var i = 0,
        args = arguments,
        x = new this(args[i]);

      external = false;
      for (; x.s && ++i < args.length;) x = x.plus(args[i]);
      external = true;

      return finalise(x, this.precision, this.rounding);
    }


    /*
     * Return a new Decimal whose value is the tangent of `x`, rounded to `precision` significant
     * digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} A value in radians.
     *
     */
    function tan(x) {
      return new this(x).tan();
    }


    /*
     * Return a new Decimal whose value is the hyperbolic tangent of `x`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} A value in radians.
     *
     */
    function tanh(x) {
      return new this(x).tanh();
    }


    /*
     * Return a new Decimal whose value is `x` truncated to an integer.
     *
     * x {number|string|Decimal}
     *
     */
    function trunc(x) {
      return finalise(x = new this(x), x.e + 1, 1);
    }


    P[Symbol.for('nodejs.util.inspect.custom')] = P.toString;
    P[Symbol.toStringTag] = 'Decimal';

    // Create and configure initial Decimal constructor.
    var Decimal = P.constructor = clone(DEFAULTS);

    // Create the internal constants from their string values.
    LN10 = new Decimal(LN10);
    PI = new Decimal(PI);

    var name$9 = 'BigNumber';
    var dependencies$9 = ['?on', 'config'];
    var createBigNumberClass = /* #__PURE__ */factory(name$9, dependencies$9, _ref => {
      var {
        on,
        config
      } = _ref;
      var BigNumber = Decimal.clone({
        precision: config.precision,
        modulo: Decimal.EUCLID
      });
      BigNumber.prototype = Object.create(BigNumber.prototype);

      /**
       * Attach type information
       */
      BigNumber.prototype.type = 'BigNumber';
      BigNumber.prototype.isBigNumber = true;

      /**
       * Get a JSON representation of a BigNumber containing
       * type information
       * @returns {Object} Returns a JSON object structured as:
       *                   `{"mathjs": "BigNumber", "value": "0.2"}`
       */
      BigNumber.prototype.toJSON = function () {
        return {
          mathjs: 'BigNumber',
          value: this.toString()
        };
      };

      /**
       * Instantiate a BigNumber from a JSON object
       * @param {Object} json  a JSON object structured as:
       *                       `{"mathjs": "BigNumber", "value": "0.2"}`
       * @return {BigNumber}
       */
      BigNumber.fromJSON = function (json) {
        return new BigNumber(json.value);
      };
      if (on) {
        // listen for changed in the configuration, automatically apply changed precision
        on('config', function (curr, prev) {
          if (curr.precision !== prev.precision) {
            BigNumber.config({
              precision: curr.precision
            });
          }
        });
      }
      return BigNumber;
    }, {
      isClass: true
    });

    /**
     * @license Complex.js v2.1.1 12/05/2020
     *
     * Copyright (c) 2020, Robert Eisele (robert@xarg.org)
     * Dual licensed under the MIT or GPL Version 2 licenses.
     **/

    var complex = createCommonjsModule(function (module, exports) {
    /**
     *
     * This class allows the manipulation of complex numbers.
     * You can pass a complex number in different formats. Either as object, double, string or two integer parameters.
     *
     * Object form
     * { re: <real>, im: <imaginary> }
     * { arg: <angle>, abs: <radius> }
     * { phi: <angle>, r: <radius> }
     *
     * Array / Vector form
     * [ real, imaginary ]
     *
     * Double form
     * 99.3 - Single double value
     *
     * String form
     * '23.1337' - Simple real number
     * '15+3i' - a simple complex number
     * '3-i' - a simple complex number
     *
     * Example:
     *
     * var c = new Complex('99.3+8i');
     * c.mul({r: 3, i: 9}).div(4.9).sub(3, 2);
     *
     */

    (function(root) {

      var cosh = Math.cosh || function(x) {
        return Math.abs(x) < 1e-9 ? 1 - x : (Math.exp(x) + Math.exp(-x)) * 0.5;
      };

      var sinh = Math.sinh || function(x) {
        return Math.abs(x) < 1e-9 ? x : (Math.exp(x) - Math.exp(-x)) * 0.5;
      };

      /**
       * Calculates cos(x) - 1 using Taylor series if x is small (-¼π ≤ x ≤ ¼π).
       *
       * @param {number} x
       * @returns {number} cos(x) - 1
       */
      var cosm1 = function(x) {

        var b = Math.PI / 4;
        if (-b > x || x > b) {
          return Math.cos(x) - 1.0;
        }

        /* Calculate horner form of polynomial of taylor series in Q
        var fac = 1, alt = 1, pol = {};
        for (var i = 0; i <= 16; i++) {
          fac*= i || 1;
          if (i % 2 == 0) {
            pol[i] = new Fraction(1, alt * fac);
            alt = -alt;
          }
        }
        console.log(new Polynomial(pol).toHorner()); // (((((((1/20922789888000x^2-1/87178291200)x^2+1/479001600)x^2-1/3628800)x^2+1/40320)x^2-1/720)x^2+1/24)x^2-1/2)x^2+1
        */

        var xx = x * x;
        return xx * (
          xx * (
            xx * (
              xx * (
                xx * (
                  xx * (
                    xx * (
                      xx / 20922789888000
                      - 1 / 87178291200)
                    + 1 / 479001600)
                  - 1 / 3628800)
                + 1 / 40320)
              - 1 / 720)
            + 1 / 24)
          - 1 / 2);
      };

      var hypot = function(x, y) {

        var a = Math.abs(x);
        var b = Math.abs(y);

        if (a < 3000 && b < 3000) {
          return Math.sqrt(a * a + b * b);
        }

        if (a < b) {
          a = b;
          b = x / y;
        } else {
          b = y / x;
        }
        return a * Math.sqrt(1 + b * b);
      };

      var parser_exit = function() {
        throw SyntaxError('Invalid Param');
      };

      /**
       * Calculates log(sqrt(a^2+b^2)) in a way to avoid overflows
       *
       * @param {number} a
       * @param {number} b
       * @returns {number}
       */
      function logHypot(a, b) {

        var _a = Math.abs(a);
        var _b = Math.abs(b);

        if (a === 0) {
          return Math.log(_b);
        }

        if (b === 0) {
          return Math.log(_a);
        }

        if (_a < 3000 && _b < 3000) {
          return Math.log(a * a + b * b) * 0.5;
        }

        /* I got 4 ideas to compute this property without overflow:
         *
         * Testing 1000000 times with random samples for a,b ∈ [1, 1000000000] against a big decimal library to get an error estimate
         *
         * 1. Only eliminate the square root: (OVERALL ERROR: 3.9122483030951116e-11)

         Math.log(a * a + b * b) / 2

         *
         *
         * 2. Try to use the non-overflowing pythagoras: (OVERALL ERROR: 8.889760039210159e-10)

         var fn = function(a, b) {
         a = Math.abs(a);
         b = Math.abs(b);
         var t = Math.min(a, b);
         a = Math.max(a, b);
         t = t / a;

         return Math.log(a) + Math.log(1 + t * t) / 2;
         };

         * 3. Abuse the identity cos(atan(y/x) = x / sqrt(x^2+y^2): (OVERALL ERROR: 3.4780178737037204e-10)

         Math.log(a / Math.cos(Math.atan2(b, a)))

         * 4. Use 3. and apply log rules: (OVERALL ERROR: 1.2014087502620896e-9)

         Math.log(a) - Math.log(Math.cos(Math.atan2(b, a)))

         */

         a = a / 2;
         b = b / 2;

        return 0.5 * Math.log(a * a + b * b) + Math.LN2;
      }

      var parse = function(a, b) {

        var z = { 're': 0, 'im': 0 };

        if (a === undefined || a === null) {
          z['re'] =
          z['im'] = 0;
        } else if (b !== undefined) {
          z['re'] = a;
          z['im'] = b;
        } else
          switch (typeof a) {

            case 'object':

              if ('im' in a && 're' in a) {
                z['re'] = a['re'];
                z['im'] = a['im'];
              } else if ('abs' in a && 'arg' in a) {
                if (!Number.isFinite(a['abs']) && Number.isFinite(a['arg'])) {
                  return Complex['INFINITY'];
                }
                z['re'] = a['abs'] * Math.cos(a['arg']);
                z['im'] = a['abs'] * Math.sin(a['arg']);
              } else if ('r' in a && 'phi' in a) {
                if (!Number.isFinite(a['r']) && Number.isFinite(a['phi'])) {
                  return Complex['INFINITY'];
                }
                z['re'] = a['r'] * Math.cos(a['phi']);
                z['im'] = a['r'] * Math.sin(a['phi']);
              } else if (a.length === 2) { // Quick array check
                z['re'] = a[0];
                z['im'] = a[1];
              } else {
                parser_exit();
              }
              break;

            case 'string':

              z['im'] = /* void */
              z['re'] = 0;

              var tokens = a.match(/\d+\.?\d*e[+-]?\d+|\d+\.?\d*|\.\d+|./g);
              var plus = 1;
              var minus = 0;

              if (tokens === null) {
                parser_exit();
              }

              for (var i = 0; i < tokens.length; i++) {

                var c = tokens[i];

                if (c === ' ' || c === '\t' || c === '\n') ; else if (c === '+') {
                  plus++;
                } else if (c === '-') {
                  minus++;
                } else if (c === 'i' || c === 'I') {

                  if (plus + minus === 0) {
                    parser_exit();
                  }

                  if (tokens[i + 1] !== ' ' && !isNaN(tokens[i + 1])) {
                    z['im'] += parseFloat((minus % 2 ? '-' : '') + tokens[i + 1]);
                    i++;
                  } else {
                    z['im'] += parseFloat((minus % 2 ? '-' : '') + '1');
                  }
                  plus = minus = 0;

                } else {

                  if (plus + minus === 0 || isNaN(c)) {
                    parser_exit();
                  }

                  if (tokens[i + 1] === 'i' || tokens[i + 1] === 'I') {
                    z['im'] += parseFloat((minus % 2 ? '-' : '') + c);
                    i++;
                  } else {
                    z['re'] += parseFloat((minus % 2 ? '-' : '') + c);
                  }
                  plus = minus = 0;
                }
              }

              // Still something on the stack
              if (plus + minus > 0) {
                parser_exit();
              }
              break;

            case 'number':
              z['im'] = 0;
              z['re'] = a;
              break;

            default:
              parser_exit();
          }

        if (isNaN(z['re']) || isNaN(z['im'])) ;

        return z;
      };

      /**
       * @constructor
       * @returns {Complex}
       */
      function Complex(a, b) {

        if (!(this instanceof Complex)) {
          return new Complex(a, b);
        }

        var z = parse(a, b);

        this['re'] = z['re'];
        this['im'] = z['im'];
      }

      Complex.prototype = {

        're': 0,
        'im': 0,

        /**
         * Calculates the sign of a complex number, which is a normalized complex
         *
         * @returns {Complex}
         */
        'sign': function() {

          var abs = this['abs']();

          return new Complex(
            this['re'] / abs,
            this['im'] / abs);
        },

        /**
         * Adds two complex numbers
         *
         * @returns {Complex}
         */
        'add': function(a, b) {

          var z = new Complex(a, b);

          // Infinity + Infinity = NaN
          if (this['isInfinite']() && z['isInfinite']()) {
            return Complex['NAN'];
          }

          // Infinity + z = Infinity { where z != Infinity }
          if (this['isInfinite']() || z['isInfinite']()) {
            return Complex['INFINITY'];
          }

          return new Complex(
            this['re'] + z['re'],
            this['im'] + z['im']);
        },

        /**
         * Subtracts two complex numbers
         *
         * @returns {Complex}
         */
        'sub': function(a, b) {

          var z = new Complex(a, b);

          // Infinity - Infinity = NaN
          if (this['isInfinite']() && z['isInfinite']()) {
            return Complex['NAN'];
          }

          // Infinity - z = Infinity { where z != Infinity }
          if (this['isInfinite']() || z['isInfinite']()) {
            return Complex['INFINITY'];
          }

          return new Complex(
            this['re'] - z['re'],
            this['im'] - z['im']);
        },

        /**
         * Multiplies two complex numbers
         *
         * @returns {Complex}
         */
        'mul': function(a, b) {

          var z = new Complex(a, b);

          // Infinity * 0 = NaN
          if ((this['isInfinite']() && z['isZero']()) || (this['isZero']() && z['isInfinite']())) {
            return Complex['NAN'];
          }

          // Infinity * z = Infinity { where z != 0 }
          if (this['isInfinite']() || z['isInfinite']()) {
            return Complex['INFINITY'];
          }

          // Short circuit for real values
          if (z['im'] === 0 && this['im'] === 0) {
            return new Complex(this['re'] * z['re'], 0);
          }

          return new Complex(
            this['re'] * z['re'] - this['im'] * z['im'],
            this['re'] * z['im'] + this['im'] * z['re']);
        },

        /**
         * Divides two complex numbers
         *
         * @returns {Complex}
         */
        'div': function(a, b) {

          var z = new Complex(a, b);

          // 0 / 0 = NaN and Infinity / Infinity = NaN
          if ((this['isZero']() && z['isZero']()) || (this['isInfinite']() && z['isInfinite']())) {
            return Complex['NAN'];
          }

          // Infinity / 0 = Infinity
          if (this['isInfinite']() || z['isZero']()) {
            return Complex['INFINITY'];
          }

          // 0 / Infinity = 0
          if (this['isZero']() || z['isInfinite']()) {
            return Complex['ZERO'];
          }

          a = this['re'];
          b = this['im'];

          var c = z['re'];
          var d = z['im'];
          var t, x;

          if (0 === d) {
            // Divisor is real
            return new Complex(a / c, b / c);
          }

          if (Math.abs(c) < Math.abs(d)) {

            x = c / d;
            t = c * x + d;

            return new Complex(
              (a * x + b) / t,
              (b * x - a) / t);

          } else {

            x = d / c;
            t = d * x + c;

            return new Complex(
              (a + b * x) / t,
              (b - a * x) / t);
          }
        },

        /**
         * Calculate the power of two complex numbers
         *
         * @returns {Complex}
         */
        'pow': function(a, b) {

          var z = new Complex(a, b);

          a = this['re'];
          b = this['im'];

          if (z['isZero']()) {
            return Complex['ONE'];
          }

          // If the exponent is real
          if (z['im'] === 0) {

            if (b === 0 && a > 0) {

              return new Complex(Math.pow(a, z['re']), 0);

            } else if (a === 0) { // If base is fully imaginary

              switch ((z['re'] % 4 + 4) % 4) {
                case 0:
                  return new Complex(Math.pow(b, z['re']), 0);
                case 1:
                  return new Complex(0, Math.pow(b, z['re']));
                case 2:
                  return new Complex(-Math.pow(b, z['re']), 0);
                case 3:
                  return new Complex(0, -Math.pow(b, z['re']));
              }
            }
          }

          /* I couldn't find a good formula, so here is a derivation and optimization
           *
           * z_1^z_2 = (a + bi)^(c + di)
           *         = exp((c + di) * log(a + bi)
           *         = pow(a^2 + b^2, (c + di) / 2) * exp(i(c + di)atan2(b, a))
           * =>...
           * Re = (pow(a^2 + b^2, c / 2) * exp(-d * atan2(b, a))) * cos(d * log(a^2 + b^2) / 2 + c * atan2(b, a))
           * Im = (pow(a^2 + b^2, c / 2) * exp(-d * atan2(b, a))) * sin(d * log(a^2 + b^2) / 2 + c * atan2(b, a))
           *
           * =>...
           * Re = exp(c * log(sqrt(a^2 + b^2)) - d * atan2(b, a)) * cos(d * log(sqrt(a^2 + b^2)) + c * atan2(b, a))
           * Im = exp(c * log(sqrt(a^2 + b^2)) - d * atan2(b, a)) * sin(d * log(sqrt(a^2 + b^2)) + c * atan2(b, a))
           *
           * =>
           * Re = exp(c * logsq2 - d * arg(z_1)) * cos(d * logsq2 + c * arg(z_1))
           * Im = exp(c * logsq2 - d * arg(z_1)) * sin(d * logsq2 + c * arg(z_1))
           *
           */

          if (a === 0 && b === 0 && z['re'] > 0 && z['im'] >= 0) {
            return Complex['ZERO'];
          }

          var arg = Math.atan2(b, a);
          var loh = logHypot(a, b);

          a = Math.exp(z['re'] * loh - z['im'] * arg);
          b = z['im'] * loh + z['re'] * arg;
          return new Complex(
            a * Math.cos(b),
            a * Math.sin(b));
        },

        /**
         * Calculate the complex square root
         *
         * @returns {Complex}
         */
        'sqrt': function() {

          var a = this['re'];
          var b = this['im'];
          var r = this['abs']();

          var re, im;

          if (a >= 0) {

            if (b === 0) {
              return new Complex(Math.sqrt(a), 0);
            }

            re = 0.5 * Math.sqrt(2.0 * (r + a));
          } else {
            re = Math.abs(b) / Math.sqrt(2 * (r - a));
          }

          if (a <= 0) {
            im = 0.5 * Math.sqrt(2.0 * (r - a));
          } else {
            im = Math.abs(b) / Math.sqrt(2 * (r + a));
          }

          return new Complex(re, b < 0 ? -im : im);
        },

        /**
         * Calculate the complex exponent
         *
         * @returns {Complex}
         */
        'exp': function() {

          var tmp = Math.exp(this['re']);

          if (this['im'] === 0) ;
          return new Complex(
            tmp * Math.cos(this['im']),
            tmp * Math.sin(this['im']));
        },

        /**
         * Calculate the complex exponent and subtracts one.
         *
         * This may be more accurate than `Complex(x).exp().sub(1)` if
         * `x` is small.
         *
         * @returns {Complex}
         */
        'expm1': function() {

          /**
           * exp(a + i*b) - 1
           = exp(a) * (cos(b) + j*sin(b)) - 1
           = expm1(a)*cos(b) + cosm1(b) + j*exp(a)*sin(b)
           */

          var a = this['re'];
          var b = this['im'];

          return new Complex(
            Math.expm1(a) * Math.cos(b) + cosm1(b),
            Math.exp(a) * Math.sin(b));
        },

        /**
         * Calculate the natural log
         *
         * @returns {Complex}
         */
        'log': function() {

          var a = this['re'];
          var b = this['im'];

          return new Complex(
            logHypot(a, b),
            Math.atan2(b, a));
        },

        /**
         * Calculate the magnitude of the complex number
         *
         * @returns {number}
         */
        'abs': function() {

          return hypot(this['re'], this['im']);
        },

        /**
         * Calculate the angle of the complex number
         *
         * @returns {number}
         */
        'arg': function() {

          return Math.atan2(this['im'], this['re']);
        },

        /**
         * Calculate the sine of the complex number
         *
         * @returns {Complex}
         */
        'sin': function() {

          // sin(z) = ( e^iz - e^-iz ) / 2i 
          //        = sin(a)cosh(b) + i cos(a)sinh(b)

          var a = this['re'];
          var b = this['im'];

          return new Complex(
            Math.sin(a) * cosh(b),
            Math.cos(a) * sinh(b));
        },

        /**
         * Calculate the cosine
         *
         * @returns {Complex}
         */
        'cos': function() {

          // cos(z) = ( e^iz + e^-iz ) / 2 
          //        = cos(a)cosh(b) - i sin(a)sinh(b)

          var a = this['re'];
          var b = this['im'];

          return new Complex(
            Math.cos(a) * cosh(b),
            -Math.sin(a) * sinh(b));
        },

        /**
         * Calculate the tangent
         *
         * @returns {Complex}
         */
        'tan': function() {

          // tan(z) = sin(z) / cos(z) 
          //        = ( e^iz - e^-iz ) / ( i( e^iz + e^-iz ) )
          //        = ( e^2iz - 1 ) / i( e^2iz + 1 )
          //        = ( sin(2a) + i sinh(2b) ) / ( cos(2a) + cosh(2b) )

          var a = 2 * this['re'];
          var b = 2 * this['im'];
          var d = Math.cos(a) + cosh(b);

          return new Complex(
            Math.sin(a) / d,
            sinh(b) / d);
        },

        /**
         * Calculate the cotangent
         *
         * @returns {Complex}
         */
        'cot': function() {

          // cot(c) = i(e^(ci) + e^(-ci)) / (e^(ci) - e^(-ci))

          var a = 2 * this['re'];
          var b = 2 * this['im'];
          var d = Math.cos(a) - cosh(b);

          return new Complex(
            -Math.sin(a) / d,
            sinh(b) / d);
        },

        /**
         * Calculate the secant
         *
         * @returns {Complex}
         */
        'sec': function() {

          // sec(c) = 2 / (e^(ci) + e^(-ci))

          var a = this['re'];
          var b = this['im'];
          var d = 0.5 * cosh(2 * b) + 0.5 * Math.cos(2 * a);

          return new Complex(
            Math.cos(a) * cosh(b) / d,
            Math.sin(a) * sinh(b) / d);
        },

        /**
         * Calculate the cosecans
         *
         * @returns {Complex}
         */
        'csc': function() {

          // csc(c) = 2i / (e^(ci) - e^(-ci))

          var a = this['re'];
          var b = this['im'];
          var d = 0.5 * cosh(2 * b) - 0.5 * Math.cos(2 * a);

          return new Complex(
            Math.sin(a) * cosh(b) / d,
            -Math.cos(a) * sinh(b) / d);
        },

        /**
         * Calculate the complex arcus sinus
         *
         * @returns {Complex}
         */
        'asin': function() {

          // asin(c) = -i * log(ci + sqrt(1 - c^2))

          var a = this['re'];
          var b = this['im'];

          var t1 = new Complex(
            b * b - a * a + 1,
            -2 * a * b)['sqrt']();

          var t2 = new Complex(
            t1['re'] - b,
            t1['im'] + a)['log']();

          return new Complex(t2['im'], -t2['re']);
        },

        /**
         * Calculate the complex arcus cosinus
         *
         * @returns {Complex}
         */
        'acos': function() {

          // acos(c) = i * log(c - i * sqrt(1 - c^2))

          var a = this['re'];
          var b = this['im'];

          var t1 = new Complex(
            b * b - a * a + 1,
            -2 * a * b)['sqrt']();

          var t2 = new Complex(
            t1['re'] - b,
            t1['im'] + a)['log']();

          return new Complex(Math.PI / 2 - t2['im'], t2['re']);
        },

        /**
         * Calculate the complex arcus tangent
         *
         * @returns {Complex}
         */
        'atan': function() {

          // atan(c) = i / 2 log((i + x) / (i - x))

          var a = this['re'];
          var b = this['im'];

          if (a === 0) {

            if (b === 1) {
              return new Complex(0, Infinity);
            }

            if (b === -1) {
              return new Complex(0, -Infinity);
            }
          }

          var d = a * a + (1.0 - b) * (1.0 - b);

          var t1 = new Complex(
            (1 - b * b - a * a) / d,
            -2 * a / d).log();

          return new Complex(-0.5 * t1['im'], 0.5 * t1['re']);
        },

        /**
         * Calculate the complex arcus cotangent
         *
         * @returns {Complex}
         */
        'acot': function() {

          // acot(c) = i / 2 log((c - i) / (c + i))

          var a = this['re'];
          var b = this['im'];

          if (b === 0) {
            return new Complex(Math.atan2(1, a), 0);
          }

          var d = a * a + b * b;
          return (d !== 0)
            ? new Complex(
              a / d,
              -b / d).atan()
            : new Complex(
              (a !== 0) ? a / 0 : 0,
              (b !== 0) ? -b / 0 : 0).atan();
        },

        /**
         * Calculate the complex arcus secant
         *
         * @returns {Complex}
         */
        'asec': function() {

          // asec(c) = -i * log(1 / c + sqrt(1 - i / c^2))

          var a = this['re'];
          var b = this['im'];

          if (a === 0 && b === 0) {
            return new Complex(0, Infinity);
          }

          var d = a * a + b * b;
          return (d !== 0)
            ? new Complex(
              a / d,
              -b / d).acos()
            : new Complex(
              (a !== 0) ? a / 0 : 0,
              (b !== 0) ? -b / 0 : 0).acos();
        },

        /**
         * Calculate the complex arcus cosecans
         *
         * @returns {Complex}
         */
        'acsc': function() {

          // acsc(c) = -i * log(i / c + sqrt(1 - 1 / c^2))

          var a = this['re'];
          var b = this['im'];

          if (a === 0 && b === 0) {
            return new Complex(Math.PI / 2, Infinity);
          }

          var d = a * a + b * b;
          return (d !== 0)
            ? new Complex(
              a / d,
              -b / d).asin()
            : new Complex(
              (a !== 0) ? a / 0 : 0,
              (b !== 0) ? -b / 0 : 0).asin();
        },

        /**
         * Calculate the complex sinh
         *
         * @returns {Complex}
         */
        'sinh': function() {

          // sinh(c) = (e^c - e^-c) / 2

          var a = this['re'];
          var b = this['im'];

          return new Complex(
            sinh(a) * Math.cos(b),
            cosh(a) * Math.sin(b));
        },

        /**
         * Calculate the complex cosh
         *
         * @returns {Complex}
         */
        'cosh': function() {

          // cosh(c) = (e^c + e^-c) / 2

          var a = this['re'];
          var b = this['im'];

          return new Complex(
            cosh(a) * Math.cos(b),
            sinh(a) * Math.sin(b));
        },

        /**
         * Calculate the complex tanh
         *
         * @returns {Complex}
         */
        'tanh': function() {

          // tanh(c) = (e^c - e^-c) / (e^c + e^-c)

          var a = 2 * this['re'];
          var b = 2 * this['im'];
          var d = cosh(a) + Math.cos(b);

          return new Complex(
            sinh(a) / d,
            Math.sin(b) / d);
        },

        /**
         * Calculate the complex coth
         *
         * @returns {Complex}
         */
        'coth': function() {

          // coth(c) = (e^c + e^-c) / (e^c - e^-c)

          var a = 2 * this['re'];
          var b = 2 * this['im'];
          var d = cosh(a) - Math.cos(b);

          return new Complex(
            sinh(a) / d,
            -Math.sin(b) / d);
        },

        /**
         * Calculate the complex coth
         *
         * @returns {Complex}
         */
        'csch': function() {

          // csch(c) = 2 / (e^c - e^-c)

          var a = this['re'];
          var b = this['im'];
          var d = Math.cos(2 * b) - cosh(2 * a);

          return new Complex(
            -2 * sinh(a) * Math.cos(b) / d,
            2 * cosh(a) * Math.sin(b) / d);
        },

        /**
         * Calculate the complex sech
         *
         * @returns {Complex}
         */
        'sech': function() {

          // sech(c) = 2 / (e^c + e^-c)

          var a = this['re'];
          var b = this['im'];
          var d = Math.cos(2 * b) + cosh(2 * a);

          return new Complex(
            2 * cosh(a) * Math.cos(b) / d,
            -2 * sinh(a) * Math.sin(b) / d);
        },

        /**
         * Calculate the complex asinh
         *
         * @returns {Complex}
         */
        'asinh': function() {

          // asinh(c) = log(c + sqrt(c^2 + 1))

          var tmp = this['im'];
          this['im'] = -this['re'];
          this['re'] = tmp;
          var res = this['asin']();

          this['re'] = -this['im'];
          this['im'] = tmp;
          tmp = res['re'];

          res['re'] = -res['im'];
          res['im'] = tmp;
          return res;
        },

        /**
         * Calculate the complex acosh
         *
         * @returns {Complex}
         */
        'acosh': function() {

          // acosh(c) = log(c + sqrt(c^2 - 1))

          var res = this['acos']();
          if (res['im'] <= 0) {
            var tmp = res['re'];
            res['re'] = -res['im'];
            res['im'] = tmp;
          } else {
            var tmp = res['im'];
            res['im'] = -res['re'];
            res['re'] = tmp;
          }
          return res;
        },

        /**
         * Calculate the complex atanh
         *
         * @returns {Complex}
         */
        'atanh': function() {

          // atanh(c) = log((1+c) / (1-c)) / 2

          var a = this['re'];
          var b = this['im'];

          var noIM = a > 1 && b === 0;
          var oneMinus = 1 - a;
          var onePlus = 1 + a;
          var d = oneMinus * oneMinus + b * b;

          var x = (d !== 0)
            ? new Complex(
              (onePlus * oneMinus - b * b) / d,
              (b * oneMinus + onePlus * b) / d)
            : new Complex(
              (a !== -1) ? (a / 0) : 0,
              (b !== 0) ? (b / 0) : 0);

          var temp = x['re'];
          x['re'] = logHypot(x['re'], x['im']) / 2;
          x['im'] = Math.atan2(x['im'], temp) / 2;
          if (noIM) {
            x['im'] = -x['im'];
          }
          return x;
        },

        /**
         * Calculate the complex acoth
         *
         * @returns {Complex}
         */
        'acoth': function() {

          // acoth(c) = log((c+1) / (c-1)) / 2

          var a = this['re'];
          var b = this['im'];

          if (a === 0 && b === 0) {
            return new Complex(0, Math.PI / 2);
          }

          var d = a * a + b * b;
          return (d !== 0)
            ? new Complex(
              a / d,
              -b / d).atanh()
            : new Complex(
              (a !== 0) ? a / 0 : 0,
              (b !== 0) ? -b / 0 : 0).atanh();
        },

        /**
         * Calculate the complex acsch
         *
         * @returns {Complex}
         */
        'acsch': function() {

          // acsch(c) = log((1+sqrt(1+c^2))/c)

          var a = this['re'];
          var b = this['im'];

          if (b === 0) {

            return new Complex(
              (a !== 0)
                ? Math.log(a + Math.sqrt(a * a + 1))
                : Infinity, 0);
          }

          var d = a * a + b * b;
          return (d !== 0)
            ? new Complex(
              a / d,
              -b / d).asinh()
            : new Complex(
              (a !== 0) ? a / 0 : 0,
              (b !== 0) ? -b / 0 : 0).asinh();
        },

        /**
         * Calculate the complex asech
         *
         * @returns {Complex}
         */
        'asech': function() {

          // asech(c) = log((1+sqrt(1-c^2))/c)

          var a = this['re'];
          var b = this['im'];

          if (this['isZero']()) {
            return Complex['INFINITY'];
          }

          var d = a * a + b * b;
          return (d !== 0)
            ? new Complex(
              a / d,
              -b / d).acosh()
            : new Complex(
              (a !== 0) ? a / 0 : 0,
              (b !== 0) ? -b / 0 : 0).acosh();
        },

        /**
         * Calculate the complex inverse 1/z
         *
         * @returns {Complex}
         */
        'inverse': function() {

          // 1 / 0 = Infinity and 1 / Infinity = 0
          if (this['isZero']()) {
            return Complex['INFINITY'];
          }

          if (this['isInfinite']()) {
            return Complex['ZERO'];
          }

          var a = this['re'];
          var b = this['im'];

          var d = a * a + b * b;

          return new Complex(a / d, -b / d);
        },

        /**
         * Returns the complex conjugate
         *
         * @returns {Complex}
         */
        'conjugate': function() {

          return new Complex(this['re'], -this['im']);
        },

        /**
         * Gets the negated complex number
         *
         * @returns {Complex}
         */
        'neg': function() {

          return new Complex(-this['re'], -this['im']);
        },

        /**
         * Ceils the actual complex number
         *
         * @returns {Complex}
         */
        'ceil': function(places) {

          places = Math.pow(10, places || 0);

          return new Complex(
            Math.ceil(this['re'] * places) / places,
            Math.ceil(this['im'] * places) / places);
        },

        /**
         * Floors the actual complex number
         *
         * @returns {Complex}
         */
        'floor': function(places) {

          places = Math.pow(10, places || 0);

          return new Complex(
            Math.floor(this['re'] * places) / places,
            Math.floor(this['im'] * places) / places);
        },

        /**
         * Ceils the actual complex number
         *
         * @returns {Complex}
         */
        'round': function(places) {

          places = Math.pow(10, places || 0);

          return new Complex(
            Math.round(this['re'] * places) / places,
            Math.round(this['im'] * places) / places);
        },

        /**
         * Compares two complex numbers
         *
         * **Note:** new Complex(Infinity).equals(Infinity) === false
         *
         * @returns {boolean}
         */
        'equals': function(a, b) {

          var z = new Complex(a, b);

          return Math.abs(z['re'] - this['re']) <= Complex['EPSILON'] &&
            Math.abs(z['im'] - this['im']) <= Complex['EPSILON'];
        },

        /**
         * Clones the actual object
         *
         * @returns {Complex}
         */
        'clone': function() {

          return new Complex(this['re'], this['im']);
        },

        /**
         * Gets a string of the actual complex number
         *
         * @returns {string}
         */
        'toString': function() {

          var a = this['re'];
          var b = this['im'];
          var ret = "";

          if (this['isNaN']()) {
            return 'NaN';
          }

          if (this['isInfinite']()) {
            return 'Infinity';
          }

          if (Math.abs(a) < Complex['EPSILON']) {
            a = 0;
          }

          if (Math.abs(b) < Complex['EPSILON']) {
            b = 0;
          }

          // If is real number
          if (b === 0) {
            return ret + a;
          }

          if (a !== 0) {
            ret += a;
            ret += " ";
            if (b < 0) {
              b = -b;
              ret += "-";
            } else {
              ret += "+";
            }
            ret += " ";
          } else if (b < 0) {
            b = -b;
            ret += "-";
          }

          if (1 !== b) { // b is the absolute imaginary part
            ret += b;
          }
          return ret + "i";
        },

        /**
         * Returns the actual number as a vector
         *
         * @returns {Array}
         */
        'toVector': function() {

          return [this['re'], this['im']];
        },

        /**
         * Returns the actual real value of the current object
         *
         * @returns {number|null}
         */
        'valueOf': function() {

          if (this['im'] === 0) {
            return this['re'];
          }
          return null;
        },

        /**
         * Determines whether a complex number is not on the Riemann sphere.
         *
         * @returns {boolean}
         */
        'isNaN': function() {
          return isNaN(this['re']) || isNaN(this['im']);
        },

        /**
         * Determines whether or not a complex number is at the zero pole of the
         * Riemann sphere.
         *
         * @returns {boolean}
         */
        'isZero': function() {
          return this['im'] === 0 && this['re'] === 0;
        },

        /**
         * Determines whether a complex number is not at the infinity pole of the
         * Riemann sphere.
         *
         * @returns {boolean}
         */
        'isFinite': function() {
          return isFinite(this['re']) && isFinite(this['im']);
        },

        /**
         * Determines whether or not a complex number is at the infinity pole of the
         * Riemann sphere.
         *
         * @returns {boolean}
         */
        'isInfinite': function() {
          return !(this['isNaN']() || this['isFinite']());
        }
      };

      Complex['ZERO'] = new Complex(0, 0);
      Complex['ONE'] = new Complex(1, 0);
      Complex['I'] = new Complex(0, 1);
      Complex['PI'] = new Complex(Math.PI, 0);
      Complex['E'] = new Complex(Math.E, 0);
      Complex['INFINITY'] = new Complex(Infinity, Infinity);
      Complex['NAN'] = new Complex(NaN, NaN);
      Complex['EPSILON'] = 1e-15;

      {
        Object.defineProperty(Complex, "__esModule", { 'value': true });
        Complex['default'] = Complex;
        Complex['Complex'] = Complex;
        module['exports'] = Complex;
      }

    })();
    });

    var Complex$1 = /*@__PURE__*/getDefaultExportFromCjs(complex);

    var name$8 = 'Complex';
    var dependencies$8 = [];
    var createComplexClass = /* #__PURE__ */factory(name$8, dependencies$8, () => {
      /**
       * Attach type information
       */
      Object.defineProperty(Complex$1, 'name', {
        value: 'Complex'
      });
      Complex$1.prototype.constructor = Complex$1;
      Complex$1.prototype.type = 'Complex';
      Complex$1.prototype.isComplex = true;

      /**
       * Get a JSON representation of the complex number
       * @returns {Object} Returns a JSON object structured as:
       *                   `{"mathjs": "Complex", "re": 2, "im": 3}`
       */
      Complex$1.prototype.toJSON = function () {
        return {
          mathjs: 'Complex',
          re: this.re,
          im: this.im
        };
      };

      /*
       * Return the value of the complex number in polar notation
       * The angle phi will be set in the interval of [-pi, pi].
       * @return {{r: number, phi: number}} Returns and object with properties r and phi.
       */
      Complex$1.prototype.toPolar = function () {
        return {
          r: this.abs(),
          phi: this.arg()
        };
      };

      /**
       * Get a string representation of the complex number,
       * with optional formatting options.
       * @param {Object | number | Function} [options]  Formatting options. See
       *                                                lib/utils/number:format for a
       *                                                description of the available
       *                                                options.
       * @return {string} str
       */
      Complex$1.prototype.format = function (options) {
        var str = '';
        var im = this.im;
        var re = this.re;
        var strRe = format$2(this.re, options);
        var strIm = format$2(this.im, options);

        // round either re or im when smaller than the configured precision
        var precision = isNumber(options) ? options : options ? options.precision : null;
        if (precision !== null) {
          var epsilon = Math.pow(10, -precision);
          if (Math.abs(re / im) < epsilon) {
            re = 0;
          }
          if (Math.abs(im / re) < epsilon) {
            im = 0;
          }
        }
        if (im === 0) {
          // real value
          str = strRe;
        } else if (re === 0) {
          // purely complex value
          if (im === 1) {
            str = 'i';
          } else if (im === -1) {
            str = '-i';
          } else {
            str = strIm + 'i';
          }
        } else {
          // complex value
          if (im < 0) {
            if (im === -1) {
              str = strRe + ' - i';
            } else {
              str = strRe + ' - ' + strIm.substring(1) + 'i';
            }
          } else {
            if (im === 1) {
              str = strRe + ' + i';
            } else {
              str = strRe + ' + ' + strIm + 'i';
            }
          }
        }
        return str;
      };

      /**
       * Create a complex number from polar coordinates
       *
       * Usage:
       *
       *     Complex.fromPolar(r: number, phi: number) : Complex
       *     Complex.fromPolar({r: number, phi: number}) : Complex
       *
       * @param {*} args...
       * @return {Complex}
       */
      Complex$1.fromPolar = function (args) {
        switch (arguments.length) {
          case 1:
            {
              var arg = arguments[0];
              if (typeof arg === 'object') {
                return Complex$1(arg);
              } else {
                throw new TypeError('Input has to be an object with r and phi keys.');
              }
            }
          case 2:
            {
              var r = arguments[0];
              var phi = arguments[1];
              if (isNumber(r)) {
                if (isUnit(phi) && phi.hasBase('ANGLE')) {
                  // convert unit to a number in radians
                  phi = phi.toNumber('rad');
                }
                if (isNumber(phi)) {
                  return new Complex$1({
                    r,
                    phi
                  });
                }
                throw new TypeError('Phi is not a number nor an angle unit.');
              } else {
                throw new TypeError('Radius r is not a number.');
              }
            }
          default:
            throw new SyntaxError('Wrong number of arguments in function fromPolar');
        }
      };
      Complex$1.prototype.valueOf = Complex$1.prototype.toString;

      /**
       * Create a Complex number from a JSON object
       * @param {Object} json  A JSON Object structured as
       *                       {"mathjs": "Complex", "re": 2, "im": 3}
       *                       All properties are optional, default values
       *                       for `re` and `im` are 0.
       * @return {Complex} Returns a new Complex number
       */
      Complex$1.fromJSON = function (json) {
        return new Complex$1(json);
      };

      /**
       * Compare two complex numbers, `a` and `b`:
       *
       * - Returns 1 when the real part of `a` is larger than the real part of `b`
       * - Returns -1 when the real part of `a` is smaller than the real part of `b`
       * - Returns 1 when the real parts are equal
       *   and the imaginary part of `a` is larger than the imaginary part of `b`
       * - Returns -1 when the real parts are equal
       *   and the imaginary part of `a` is smaller than the imaginary part of `b`
       * - Returns 0 when both real and imaginary parts are equal.
       *
       * @params {Complex} a
       * @params {Complex} b
       * @returns {number} Returns the comparison result: -1, 0, or 1
       */
      Complex$1.compare = function (a, b) {
        if (a.re > b.re) {
          return 1;
        }
        if (a.re < b.re) {
          return -1;
        }
        if (a.im > b.im) {
          return 1;
        }
        if (a.im < b.im) {
          return -1;
        }
        return 0;
      };
      return Complex$1;
    }, {
      isClass: true
    });

    /**
     * @license Fraction.js v4.2.0 05/03/2022
     * https://www.xarg.org/2014/03/rational-numbers-in-javascript/
     *
     * Copyright (c) 2021, Robert Eisele (robert@xarg.org)
     * Dual licensed under the MIT or GPL Version 2 licenses.
     **/

    var fraction = createCommonjsModule(function (module, exports) {
    /**
     *
     * This class offers the possibility to calculate fractions.
     * You can pass a fraction in different formats. Either as array, as double, as string or as an integer.
     *
     * Array/Object form
     * [ 0 => <nominator>, 1 => <denominator> ]
     * [ n => <nominator>, d => <denominator> ]
     *
     * Integer form
     * - Single integer value
     *
     * Double form
     * - Single double value
     *
     * String form
     * 123.456 - a simple double
     * 123/456 - a string fraction
     * 123.'456' - a double with repeating decimal places
     * 123.(456) - synonym
     * 123.45'6' - a double with repeating last place
     * 123.45(6) - synonym
     *
     * Example:
     *
     * var f = new Fraction("9.4'31'");
     * f.mul([-4, 3]).div(4.9);
     *
     */

    (function(root) {

      // Maximum search depth for cyclic rational numbers. 2000 should be more than enough.
      // Example: 1/7 = 0.(142857) has 6 repeating decimal places.
      // If MAX_CYCLE_LEN gets reduced, long cycles will not be detected and toString() only gets the first 10 digits
      var MAX_CYCLE_LEN = 2000;

      // Parsed data to avoid calling "new" all the time
      var P = {
        "s": 1,
        "n": 0,
        "d": 1
      };

      function assign(n, s) {

        if (isNaN(n = parseInt(n, 10))) {
          throw Fraction['InvalidParameter'];
        }
        return n * s;
      }

      // Creates a new Fraction internally without the need of the bulky constructor
      function newFraction(n, d) {

        if (d === 0) {
          throw Fraction['DivisionByZero'];
        }

        var f = Object.create(Fraction.prototype);
        f["s"] = n < 0 ? -1 : 1;

        n = n < 0 ? -n : n;

        var a = gcd(n, d);

        f["n"] = n / a;
        f["d"] = d / a;
        return f;
      }

      function factorize(num) {

        var factors = {};

        var n = num;
        var i = 2;
        var s = 4;

        while (s <= n) {

          while (n % i === 0) {
            n/= i;
            factors[i] = (factors[i] || 0) + 1;
          }
          s+= 1 + 2 * i++;
        }

        if (n !== num) {
          if (n > 1)
            factors[n] = (factors[n] || 0) + 1;
        } else {
          factors[num] = (factors[num] || 0) + 1;
        }
        return factors;
      }

      var parse = function(p1, p2) {

        var n = 0, d = 1, s = 1;
        var v = 0, w = 0, x = 0, y = 1, z = 1;

        var A = 0, B = 1;
        var C = 1, D = 1;

        var N = 10000000;
        var M;

        if (p1 === undefined || p1 === null) ; else if (p2 !== undefined) {
          n = p1;
          d = p2;
          s = n * d;

          if (n % 1 !== 0 || d % 1 !== 0) {
            throw Fraction['NonIntegerParameter'];
          }

        } else
          switch (typeof p1) {

            case "object":
              {
                if ("d" in p1 && "n" in p1) {
                  n = p1["n"];
                  d = p1["d"];
                  if ("s" in p1)
                    n*= p1["s"];
                } else if (0 in p1) {
                  n = p1[0];
                  if (1 in p1)
                    d = p1[1];
                } else {
                  throw Fraction['InvalidParameter'];
                }
                s = n * d;
                break;
              }
            case "number":
              {
                if (p1 < 0) {
                  s = p1;
                  p1 = -p1;
                }

                if (p1 % 1 === 0) {
                  n = p1;
                } else if (p1 > 0) { // check for != 0, scale would become NaN (log(0)), which converges really slow

                  if (p1 >= 1) {
                    z = Math.pow(10, Math.floor(1 + Math.log(p1) / Math.LN10));
                    p1/= z;
                  }

                  // Using Farey Sequences
                  // http://www.johndcook.com/blog/2010/10/20/best-rational-approximation/

                  while (B <= N && D <= N) {
                    M = (A + C) / (B + D);

                    if (p1 === M) {
                      if (B + D <= N) {
                        n = A + C;
                        d = B + D;
                      } else if (D > B) {
                        n = C;
                        d = D;
                      } else {
                        n = A;
                        d = B;
                      }
                      break;

                    } else {

                      if (p1 > M) {
                        A+= C;
                        B+= D;
                      } else {
                        C+= A;
                        D+= B;
                      }

                      if (B > N) {
                        n = C;
                        d = D;
                      } else {
                        n = A;
                        d = B;
                      }
                    }
                  }
                  n*= z;
                } else if (isNaN(p1) || isNaN(p2)) {
                  d = n = NaN;
                }
                break;
              }
            case "string":
              {
                B = p1.match(/\d+|./g);

                if (B === null)
                  throw Fraction['InvalidParameter'];

                if (B[A] === '-') {// Check for minus sign at the beginning
                  s = -1;
                  A++;
                } else if (B[A] === '+') {// Check for plus sign at the beginning
                  A++;
                }

                if (B.length === A + 1) { // Check if it's just a simple number "1234"
                  w = assign(B[A++], s);
                } else if (B[A + 1] === '.' || B[A] === '.') { // Check if it's a decimal number

                  if (B[A] !== '.') { // Handle 0.5 and .5
                    v = assign(B[A++], s);
                  }
                  A++;

                  // Check for decimal places
                  if (A + 1 === B.length || B[A + 1] === '(' && B[A + 3] === ')' || B[A + 1] === "'" && B[A + 3] === "'") {
                    w = assign(B[A], s);
                    y = Math.pow(10, B[A].length);
                    A++;
                  }

                  // Check for repeating places
                  if (B[A] === '(' && B[A + 2] === ')' || B[A] === "'" && B[A + 2] === "'") {
                    x = assign(B[A + 1], s);
                    z = Math.pow(10, B[A + 1].length) - 1;
                    A+= 3;
                  }

                } else if (B[A + 1] === '/' || B[A + 1] === ':') { // Check for a simple fraction "123/456" or "123:456"
                  w = assign(B[A], s);
                  y = assign(B[A + 2], 1);
                  A+= 3;
                } else if (B[A + 3] === '/' && B[A + 1] === ' ') { // Check for a complex fraction "123 1/2"
                  v = assign(B[A], s);
                  w = assign(B[A + 2], s);
                  y = assign(B[A + 4], 1);
                  A+= 5;
                }

                if (B.length <= A) { // Check for more tokens on the stack
                  d = y * z;
                  s = /* void */
                  n = x + d * v + z * w;
                  break;
                }

                /* Fall through on error */
              }
            default:
              throw Fraction['InvalidParameter'];
          }

        if (d === 0) {
          throw Fraction['DivisionByZero'];
        }

        P["s"] = s < 0 ? -1 : 1;
        P["n"] = Math.abs(n);
        P["d"] = Math.abs(d);
      };

      function modpow(b, e, m) {

        var r = 1;
        for (; e > 0; b = (b * b) % m, e >>= 1) {

          if (e & 1) {
            r = (r * b) % m;
          }
        }
        return r;
      }


      function cycleLen(n, d) {

        for (; d % 2 === 0;
          d/= 2) {
        }

        for (; d % 5 === 0;
          d/= 5) {
        }

        if (d === 1) // Catch non-cyclic numbers
          return 0;

        // If we would like to compute really large numbers quicker, we could make use of Fermat's little theorem:
        // 10^(d-1) % d == 1
        // However, we don't need such large numbers and MAX_CYCLE_LEN should be the capstone,
        // as we want to translate the numbers to strings.

        var rem = 10 % d;
        var t = 1;

        for (; rem !== 1; t++) {
          rem = rem * 10 % d;

          if (t > MAX_CYCLE_LEN)
            return 0; // Returning 0 here means that we don't print it as a cyclic number. It's likely that the answer is `d-1`
        }
        return t;
      }


      function cycleStart(n, d, len) {

        var rem1 = 1;
        var rem2 = modpow(10, len, d);

        for (var t = 0; t < 300; t++) { // s < ~log10(Number.MAX_VALUE)
          // Solve 10^s == 10^(s+t) (mod d)

          if (rem1 === rem2)
            return t;

          rem1 = rem1 * 10 % d;
          rem2 = rem2 * 10 % d;
        }
        return 0;
      }

      function gcd(a, b) {

        if (!a)
          return b;
        if (!b)
          return a;

        while (1) {
          a%= b;
          if (!a)
            return b;
          b%= a;
          if (!b)
            return a;
        }
      }
      /**
       * Module constructor
       *
       * @constructor
       * @param {number|Fraction=} a
       * @param {number=} b
       */
      function Fraction(a, b) {

        parse(a, b);

        if (this instanceof Fraction) {
          a = gcd(P["d"], P["n"]); // Abuse variable a
          this["s"] = P["s"];
          this["n"] = P["n"] / a;
          this["d"] = P["d"] / a;
        } else {
          return newFraction(P['s'] * P['n'], P['d']);
        }
      }

      Fraction['DivisionByZero'] = new Error("Division by Zero");
      Fraction['InvalidParameter'] = new Error("Invalid argument");
      Fraction['NonIntegerParameter'] = new Error("Parameters must be integer");

      Fraction.prototype = {

        "s": 1,
        "n": 0,
        "d": 1,

        /**
         * Calculates the absolute value
         *
         * Ex: new Fraction(-4).abs() => 4
         **/
        "abs": function() {

          return newFraction(this["n"], this["d"]);
        },

        /**
         * Inverts the sign of the current fraction
         *
         * Ex: new Fraction(-4).neg() => 4
         **/
        "neg": function() {

          return newFraction(-this["s"] * this["n"], this["d"]);
        },

        /**
         * Adds two rational numbers
         *
         * Ex: new Fraction({n: 2, d: 3}).add("14.9") => 467 / 30
         **/
        "add": function(a, b) {

          parse(a, b);
          return newFraction(
            this["s"] * this["n"] * P["d"] + P["s"] * this["d"] * P["n"],
            this["d"] * P["d"]
          );
        },

        /**
         * Subtracts two rational numbers
         *
         * Ex: new Fraction({n: 2, d: 3}).add("14.9") => -427 / 30
         **/
        "sub": function(a, b) {

          parse(a, b);
          return newFraction(
            this["s"] * this["n"] * P["d"] - P["s"] * this["d"] * P["n"],
            this["d"] * P["d"]
          );
        },

        /**
         * Multiplies two rational numbers
         *
         * Ex: new Fraction("-17.(345)").mul(3) => 5776 / 111
         **/
        "mul": function(a, b) {

          parse(a, b);
          return newFraction(
            this["s"] * P["s"] * this["n"] * P["n"],
            this["d"] * P["d"]
          );
        },

        /**
         * Divides two rational numbers
         *
         * Ex: new Fraction("-17.(345)").inverse().div(3)
         **/
        "div": function(a, b) {

          parse(a, b);
          return newFraction(
            this["s"] * P["s"] * this["n"] * P["d"],
            this["d"] * P["n"]
          );
        },

        /**
         * Clones the actual object
         *
         * Ex: new Fraction("-17.(345)").clone()
         **/
        "clone": function() {
          return newFraction(this['s'] * this['n'], this['d']);
        },

        /**
         * Calculates the modulo of two rational numbers - a more precise fmod
         *
         * Ex: new Fraction('4.(3)').mod([7, 8]) => (13/3) % (7/8) = (5/6)
         **/
        "mod": function(a, b) {

          if (isNaN(this['n']) || isNaN(this['d'])) {
            return new Fraction(NaN);
          }

          if (a === undefined) {
            return newFraction(this["s"] * this["n"] % this["d"], 1);
          }

          parse(a, b);
          if (0 === P["n"] && 0 === this["d"]) {
            throw Fraction['DivisionByZero'];
          }

          /*
           * First silly attempt, kinda slow
           *
           return that["sub"]({
           "n": num["n"] * Math.floor((this.n / this.d) / (num.n / num.d)),
           "d": num["d"],
           "s": this["s"]
           });*/

          /*
           * New attempt: a1 / b1 = a2 / b2 * q + r
           * => b2 * a1 = a2 * b1 * q + b1 * b2 * r
           * => (b2 * a1 % a2 * b1) / (b1 * b2)
           */
          return newFraction(
            this["s"] * (P["d"] * this["n"]) % (P["n"] * this["d"]),
            P["d"] * this["d"]
          );
        },

        /**
         * Calculates the fractional gcd of two rational numbers
         *
         * Ex: new Fraction(5,8).gcd(3,7) => 1/56
         */
        "gcd": function(a, b) {

          parse(a, b);

          // gcd(a / b, c / d) = gcd(a, c) / lcm(b, d)

          return newFraction(gcd(P["n"], this["n"]) * gcd(P["d"], this["d"]), P["d"] * this["d"]);
        },

        /**
         * Calculates the fractional lcm of two rational numbers
         *
         * Ex: new Fraction(5,8).lcm(3,7) => 15
         */
        "lcm": function(a, b) {

          parse(a, b);

          // lcm(a / b, c / d) = lcm(a, c) / gcd(b, d)

          if (P["n"] === 0 && this["n"] === 0) {
            return newFraction(0, 1);
          }
          return newFraction(P["n"] * this["n"], gcd(P["n"], this["n"]) * gcd(P["d"], this["d"]));
        },

        /**
         * Calculates the ceil of a rational number
         *
         * Ex: new Fraction('4.(3)').ceil() => (5 / 1)
         **/
        "ceil": function(places) {

          places = Math.pow(10, places || 0);

          if (isNaN(this["n"]) || isNaN(this["d"])) {
            return new Fraction(NaN);
          }
          return newFraction(Math.ceil(places * this["s"] * this["n"] / this["d"]), places);
        },

        /**
         * Calculates the floor of a rational number
         *
         * Ex: new Fraction('4.(3)').floor() => (4 / 1)
         **/
        "floor": function(places) {

          places = Math.pow(10, places || 0);

          if (isNaN(this["n"]) || isNaN(this["d"])) {
            return new Fraction(NaN);
          }
          return newFraction(Math.floor(places * this["s"] * this["n"] / this["d"]), places);
        },

        /**
         * Rounds a rational numbers
         *
         * Ex: new Fraction('4.(3)').round() => (4 / 1)
         **/
        "round": function(places) {

          places = Math.pow(10, places || 0);

          if (isNaN(this["n"]) || isNaN(this["d"])) {
            return new Fraction(NaN);
          }
          return newFraction(Math.round(places * this["s"] * this["n"] / this["d"]), places);
        },

        /**
         * Gets the inverse of the fraction, means numerator and denominator are exchanged
         *
         * Ex: new Fraction([-3, 4]).inverse() => -4 / 3
         **/
        "inverse": function() {

          return newFraction(this["s"] * this["d"], this["n"]);
        },

        /**
         * Calculates the fraction to some rational exponent, if possible
         *
         * Ex: new Fraction(-1,2).pow(-3) => -8
         */
        "pow": function(a, b) {

          parse(a, b);

          // Trivial case when exp is an integer

          if (P['d'] === 1) {

            if (P['s'] < 0) {
              return newFraction(Math.pow(this['s'] * this["d"], P['n']), Math.pow(this["n"], P['n']));
            } else {
              return newFraction(Math.pow(this['s'] * this["n"], P['n']), Math.pow(this["d"], P['n']));
            }
          }

          // Negative roots become complex
          //     (-a/b)^(c/d) = x
          // <=> (-1)^(c/d) * (a/b)^(c/d) = x
          // <=> (cos(pi) + i*sin(pi))^(c/d) * (a/b)^(c/d) = x         # rotate 1 by 180°
          // <=> (cos(c*pi/d) + i*sin(c*pi/d)) * (a/b)^(c/d) = x       # DeMoivre's formula in Q ( https://proofwiki.org/wiki/De_Moivre%27s_Formula/Rational_Index )
          // From which follows that only for c=0 the root is non-complex. c/d is a reduced fraction, so that sin(c/dpi)=0 occurs for d=1, which is handled by our trivial case.
          if (this['s'] < 0) return null;

          // Now prime factor n and d
          var N = factorize(this['n']);
          var D = factorize(this['d']);

          // Exponentiate and take root for n and d individually
          var n = 1;
          var d = 1;
          for (var k in N) {
            if (k === '1') continue;
            if (k === '0') {
              n = 0;
              break;
            }
            N[k]*= P['n'];

            if (N[k] % P['d'] === 0) {
              N[k]/= P['d'];
            } else return null;
            n*= Math.pow(k, N[k]);
          }

          for (var k in D) {
            if (k === '1') continue;
            D[k]*= P['n'];

            if (D[k] % P['d'] === 0) {
              D[k]/= P['d'];
            } else return null;
            d*= Math.pow(k, D[k]);
          }

          if (P['s'] < 0) {
            return newFraction(d, n);
          }
          return newFraction(n, d);
        },

        /**
         * Check if two rational numbers are the same
         *
         * Ex: new Fraction(19.6).equals([98, 5]);
         **/
        "equals": function(a, b) {

          parse(a, b);
          return this["s"] * this["n"] * P["d"] === P["s"] * P["n"] * this["d"]; // Same as compare() === 0
        },

        /**
         * Check if two rational numbers are the same
         *
         * Ex: new Fraction(19.6).equals([98, 5]);
         **/
        "compare": function(a, b) {

          parse(a, b);
          var t = (this["s"] * this["n"] * P["d"] - P["s"] * P["n"] * this["d"]);
          return (0 < t) - (t < 0);
        },

        "simplify": function(eps) {

          if (isNaN(this['n']) || isNaN(this['d'])) {
            return this;
          }

          eps = eps || 0.001;

          var thisABS = this['abs']();
          var cont = thisABS['toContinued']();

          for (var i = 1; i < cont.length; i++) {

            var s = newFraction(cont[i - 1], 1);
            for (var k = i - 2; k >= 0; k--) {
              s = s['inverse']()['add'](cont[k]);
            }

            if (s['sub'](thisABS)['abs']().valueOf() < eps) {
              return s['mul'](this['s']);
            }
          }
          return this;
        },

        /**
         * Check if two rational numbers are divisible
         *
         * Ex: new Fraction(19.6).divisible(1.5);
         */
        "divisible": function(a, b) {

          parse(a, b);
          return !(!(P["n"] * this["d"]) || ((this["n"] * P["d"]) % (P["n"] * this["d"])));
        },

        /**
         * Returns a decimal representation of the fraction
         *
         * Ex: new Fraction("100.'91823'").valueOf() => 100.91823918239183
         **/
        'valueOf': function() {

          return this["s"] * this["n"] / this["d"];
        },

        /**
         * Returns a string-fraction representation of a Fraction object
         *
         * Ex: new Fraction("1.'3'").toFraction(true) => "4 1/3"
         **/
        'toFraction': function(excludeWhole) {

          var whole, str = "";
          var n = this["n"];
          var d = this["d"];
          if (this["s"] < 0) {
            str+= '-';
          }

          if (d === 1) {
            str+= n;
          } else {

            if (excludeWhole && (whole = Math.floor(n / d)) > 0) {
              str+= whole;
              str+= " ";
              n%= d;
            }

            str+= n;
            str+= '/';
            str+= d;
          }
          return str;
        },

        /**
         * Returns a latex representation of a Fraction object
         *
         * Ex: new Fraction("1.'3'").toLatex() => "\frac{4}{3}"
         **/
        'toLatex': function(excludeWhole) {

          var whole, str = "";
          var n = this["n"];
          var d = this["d"];
          if (this["s"] < 0) {
            str+= '-';
          }

          if (d === 1) {
            str+= n;
          } else {

            if (excludeWhole && (whole = Math.floor(n / d)) > 0) {
              str+= whole;
              n%= d;
            }

            str+= "\\frac{";
            str+= n;
            str+= '}{';
            str+= d;
            str+= '}';
          }
          return str;
        },

        /**
         * Returns an array of continued fraction elements
         *
         * Ex: new Fraction("7/8").toContinued() => [0,1,7]
         */
        'toContinued': function() {

          var t;
          var a = this['n'];
          var b = this['d'];
          var res = [];

          if (isNaN(a) || isNaN(b)) {
            return res;
          }

          do {
            res.push(Math.floor(a / b));
            t = a % b;
            a = b;
            b = t;
          } while (a !== 1);

          return res;
        },

        /**
         * Creates a string representation of a fraction with all digits
         *
         * Ex: new Fraction("100.'91823'").toString() => "100.(91823)"
         **/
        'toString': function(dec) {

          var N = this["n"];
          var D = this["d"];

          if (isNaN(N) || isNaN(D)) {
            return "NaN";
          }

          dec = dec || 15; // 15 = decimal places when no repetation

          var cycLen = cycleLen(N, D); // Cycle length
          var cycOff = cycleStart(N, D, cycLen); // Cycle start

          var str = this['s'] < 0 ? "-" : "";

          str+= N / D | 0;

          N%= D;
          N*= 10;

          if (N)
            str+= ".";

          if (cycLen) {

            for (var i = cycOff; i--;) {
              str+= N / D | 0;
              N%= D;
              N*= 10;
            }
            str+= "(";
            for (var i = cycLen; i--;) {
              str+= N / D | 0;
              N%= D;
              N*= 10;
            }
            str+= ")";
          } else {
            for (var i = dec; N && i--;) {
              str+= N / D | 0;
              N%= D;
              N*= 10;
            }
          }
          return str;
        }
      };

      {
        Object.defineProperty(Fraction, "__esModule", { 'value': true });
        Fraction['default'] = Fraction;
        Fraction['Fraction'] = Fraction;
        module['exports'] = Fraction;
      }

    })();
    });

    var Fraction$1 = /*@__PURE__*/getDefaultExportFromCjs(fraction);

    var name$7 = 'Fraction';
    var dependencies$7 = [];
    var createFractionClass = /* #__PURE__ */factory(name$7, dependencies$7, () => {
      /**
       * Attach type information
       */
      Object.defineProperty(Fraction$1, 'name', {
        value: 'Fraction'
      });
      Fraction$1.prototype.constructor = Fraction$1;
      Fraction$1.prototype.type = 'Fraction';
      Fraction$1.prototype.isFraction = true;

      /**
       * Get a JSON representation of a Fraction containing type information
       * @returns {Object} Returns a JSON object structured as:
       *                   `{"mathjs": "Fraction", "n": 3, "d": 8}`
       */
      Fraction$1.prototype.toJSON = function () {
        return {
          mathjs: 'Fraction',
          n: this.s * this.n,
          d: this.d
        };
      };

      /**
       * Instantiate a Fraction from a JSON object
       * @param {Object} json  a JSON object structured as:
       *                       `{"mathjs": "Fraction", "n": 3, "d": 8}`
       * @return {BigNumber}
       */
      Fraction$1.fromJSON = function (json) {
        return new Fraction$1(json);
      };
      return Fraction$1;
    }, {
      isClass: true
    });

    var name$6 = 'Matrix';
    var dependencies$6 = [];
    var createMatrixClass = /* #__PURE__ */factory(name$6, dependencies$6, () => {
      /**
       * @constructor Matrix
       *
       * A Matrix is a wrapper around an Array. A matrix can hold a multi dimensional
       * array. A matrix can be constructed as:
       *
       *     let matrix = math.matrix(data)
       *
       * Matrix contains the functions to resize, get and set values, get the size,
       * clone the matrix and to convert the matrix to a vector, array, or scalar.
       * Furthermore, one can iterate over the matrix using map and forEach.
       * The internal Array of the Matrix can be accessed using the function valueOf.
       *
       * Example usage:
       *
       *     let matrix = math.matrix([[1, 2], [3, 4]])
       *     matix.size()              // [2, 2]
       *     matrix.resize([3, 2], 5)
       *     matrix.valueOf()          // [[1, 2], [3, 4], [5, 5]]
       *     matrix.subset([1,2])       // 3 (indexes are zero-based)
       *
       */
      function Matrix() {
        if (!(this instanceof Matrix)) {
          throw new SyntaxError('Constructor must be called with the new operator');
        }
      }

      /**
       * Attach type information
       */
      Matrix.prototype.type = 'Matrix';
      Matrix.prototype.isMatrix = true;

      /**
       * Get the storage format used by the matrix.
       *
       * Usage:
       *     const format = matrix.storage()   // retrieve storage format
       *
       * @return {string}           The storage format.
       */
      Matrix.prototype.storage = function () {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke storage on a Matrix interface');
      };

      /**
       * Get the datatype of the data stored in the matrix.
       *
       * Usage:
       *     const format = matrix.datatype()    // retrieve matrix datatype
       *
       * @return {string}           The datatype.
       */
      Matrix.prototype.datatype = function () {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke datatype on a Matrix interface');
      };

      /**
       * Create a new Matrix With the type of the current matrix instance
       * @param {Array | Object} data
       * @param {string} [datatype]
       */
      Matrix.prototype.create = function (data, datatype) {
        throw new Error('Cannot invoke create on a Matrix interface');
      };

      /**
       * Get a subset of the matrix, or replace a subset of the matrix.
       *
       * Usage:
       *     const subset = matrix.subset(index)               // retrieve subset
       *     const value = matrix.subset(index, replacement)   // replace subset
       *
       * @param {Index} index
       * @param {Array | Matrix | *} [replacement]
       * @param {*} [defaultValue=0]      Default value, filled in on new entries when
       *                                  the matrix is resized. If not provided,
       *                                  new matrix elements will be filled with zeros.
       */
      Matrix.prototype.subset = function (index, replacement, defaultValue) {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke subset on a Matrix interface');
      };

      /**
       * Get a single element from the matrix.
       * @param {number[]} index   Zero-based index
       * @return {*} value
       */
      Matrix.prototype.get = function (index) {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke get on a Matrix interface');
      };

      /**
       * Replace a single element in the matrix.
       * @param {number[]} index   Zero-based index
       * @param {*} value
       * @param {*} [defaultValue]        Default value, filled in on new entries when
       *                                  the matrix is resized. If not provided,
       *                                  new matrix elements will be left undefined.
       * @return {Matrix} self
       */
      Matrix.prototype.set = function (index, value, defaultValue) {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke set on a Matrix interface');
      };

      /**
       * Resize the matrix to the given size. Returns a copy of the matrix when
       * `copy=true`, otherwise return the matrix itself (resize in place).
       *
       * @param {number[]} size           The new size the matrix should have.
       * @param {*} [defaultValue=0]      Default value, filled in on new entries.
       *                                  If not provided, the matrix elements will
       *                                  be filled with zeros.
       * @param {boolean} [copy]          Return a resized copy of the matrix
       *
       * @return {Matrix}                 The resized matrix
       */
      Matrix.prototype.resize = function (size, defaultValue) {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke resize on a Matrix interface');
      };

      /**
       * Reshape the matrix to the given size. Returns a copy of the matrix when
       * `copy=true`, otherwise return the matrix itself (reshape in place).
       *
       * @param {number[]} size           The new size the matrix should have.
       * @param {boolean} [copy]          Return a reshaped copy of the matrix
       *
       * @return {Matrix}                 The reshaped matrix
       */
      Matrix.prototype.reshape = function (size, defaultValue) {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke reshape on a Matrix interface');
      };

      /**
       * Create a clone of the matrix
       * @return {Matrix} clone
       */
      Matrix.prototype.clone = function () {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke clone on a Matrix interface');
      };

      /**
       * Retrieve the size of the matrix.
       * @returns {number[]} size
       */
      Matrix.prototype.size = function () {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke size on a Matrix interface');
      };

      /**
       * Create a new matrix with the results of the callback function executed on
       * each entry of the matrix.
       * @param {Function} callback   The callback function is invoked with three
       *                              parameters: the value of the element, the index
       *                              of the element, and the Matrix being traversed.
       * @param {boolean} [skipZeros] Invoke callback function for non-zero values only.
       *
       * @return {Matrix} matrix
       */
      Matrix.prototype.map = function (callback, skipZeros) {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke map on a Matrix interface');
      };

      /**
       * Execute a callback function on each entry of the matrix.
       * @param {Function} callback   The callback function is invoked with three
       *                              parameters: the value of the element, the index
       *                              of the element, and the Matrix being traversed.
       */
      Matrix.prototype.forEach = function (callback) {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke forEach on a Matrix interface');
      };

      /**
       * Iterate over the matrix elements
       * @return {Iterable<{ value, index: number[] }>}
       */
      Matrix.prototype[Symbol.iterator] = function () {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot iterate a Matrix interface');
      };

      /**
       * Create an Array with a copy of the data of the Matrix
       * @returns {Array} array
       */
      Matrix.prototype.toArray = function () {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke toArray on a Matrix interface');
      };

      /**
       * Get the primitive value of the Matrix: a multidimensional array
       * @returns {Array} array
       */
      Matrix.prototype.valueOf = function () {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke valueOf on a Matrix interface');
      };

      /**
       * Get a string representation of the matrix, with optional formatting options.
       * @param {Object | number | Function} [options]  Formatting options. See
       *                                                lib/utils/number:format for a
       *                                                description of the available
       *                                                options.
       * @returns {string} str
       */
      Matrix.prototype.format = function (options) {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke format on a Matrix interface');
      };

      /**
       * Get a string representation of the matrix
       * @returns {string} str
       */
      Matrix.prototype.toString = function () {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke toString on a Matrix interface');
      };
      return Matrix;
    }, {
      isClass: true
    });

    // function utils

    /**
     * Find the maximum number of arguments expected by a typed function.
     * @param {function} fn   A typed function
     * @return {number} Returns the maximum number of expected arguments.
     *                  Returns -1 when no signatures where found on the function.
     */
    function maxArgumentCount(fn) {
      return Object.keys(fn.signatures || {}).reduce(function (args, signature) {
        var count = (signature.match(/,/g) || []).length + 1;
        return Math.max(args, count);
      }, -1);
    }

    var name$5 = 'DenseMatrix';
    var dependencies$5 = ['Matrix'];
    var createDenseMatrixClass = /* #__PURE__ */factory(name$5, dependencies$5, _ref => {
      var {
        Matrix
      } = _ref;
      /**
       * Dense Matrix implementation. A regular, dense matrix, supporting multi-dimensional matrices. This is the default matrix type.
       * @class DenseMatrix
       * @enum {{ value, index: number[] }}
       */
      function DenseMatrix(data, datatype) {
        if (!(this instanceof DenseMatrix)) {
          throw new SyntaxError('Constructor must be called with the new operator');
        }
        if (datatype && !isString(datatype)) {
          throw new Error('Invalid datatype: ' + datatype);
        }
        if (isMatrix(data)) {
          // check data is a DenseMatrix
          if (data.type === 'DenseMatrix') {
            // clone data & size
            this._data = clone$1(data._data);
            this._size = clone$1(data._size);
            this._datatype = datatype || data._datatype;
          } else {
            // build data from existing matrix
            this._data = data.toArray();
            this._size = data.size();
            this._datatype = datatype || data._datatype;
          }
        } else if (data && isArray(data.data) && isArray(data.size)) {
          // initialize fields from JSON representation
          this._data = data.data;
          this._size = data.size;
          // verify the dimensions of the array
          validate(this._data, this._size);
          this._datatype = datatype || data.datatype;
        } else if (isArray(data)) {
          // replace nested Matrices with Arrays
          this._data = preprocess(data);
          // get the dimensions of the array
          this._size = arraySize(this._data);
          // verify the dimensions of the array, TODO: compute size while processing array
          validate(this._data, this._size);
          // data type unknown
          this._datatype = datatype;
        } else if (data) {
          // unsupported type
          throw new TypeError('Unsupported type of data (' + typeOf(data) + ')');
        } else {
          // nothing provided
          this._data = [];
          this._size = [0];
          this._datatype = datatype;
        }
      }
      DenseMatrix.prototype = new Matrix();

      /**
       * Create a new DenseMatrix
       */
      DenseMatrix.prototype.createDenseMatrix = function (data, datatype) {
        return new DenseMatrix(data, datatype);
      };

      /**
       * Attach type information
       */
      Object.defineProperty(DenseMatrix, 'name', {
        value: 'DenseMatrix'
      });
      DenseMatrix.prototype.constructor = DenseMatrix;
      DenseMatrix.prototype.type = 'DenseMatrix';
      DenseMatrix.prototype.isDenseMatrix = true;

      /**
       * Get the matrix type
       *
       * Usage:
       *    const matrixType = matrix.getDataType()  // retrieves the matrix type
       *
       * @memberOf DenseMatrix
       * @return {string}   type information; if multiple types are found from the Matrix, it will return "mixed"
       */
      DenseMatrix.prototype.getDataType = function () {
        return getArrayDataType(this._data, typeOf);
      };

      /**
       * Get the storage format used by the matrix.
       *
       * Usage:
       *     const format = matrix.storage()  // retrieve storage format
       *
       * @memberof DenseMatrix
       * @return {string}           The storage format.
       */
      DenseMatrix.prototype.storage = function () {
        return 'dense';
      };

      /**
       * Get the datatype of the data stored in the matrix.
       *
       * Usage:
       *     const format = matrix.datatype()   // retrieve matrix datatype
       *
       * @memberof DenseMatrix
       * @return {string}           The datatype.
       */
      DenseMatrix.prototype.datatype = function () {
        return this._datatype;
      };

      /**
       * Create a new DenseMatrix
       * @memberof DenseMatrix
       * @param {Array} data
       * @param {string} [datatype]
       */
      DenseMatrix.prototype.create = function (data, datatype) {
        return new DenseMatrix(data, datatype);
      };

      /**
       * Get a subset of the matrix, or replace a subset of the matrix.
       *
       * Usage:
       *     const subset = matrix.subset(index)               // retrieve subset
       *     const value = matrix.subset(index, replacement)   // replace subset
       *
       * @memberof DenseMatrix
       * @param {Index} index
       * @param {Array | Matrix | *} [replacement]
       * @param {*} [defaultValue=0]      Default value, filled in on new entries when
       *                                  the matrix is resized. If not provided,
       *                                  new matrix elements will be filled with zeros.
       */
      DenseMatrix.prototype.subset = function (index, replacement, defaultValue) {
        switch (arguments.length) {
          case 1:
            return _get(this, index);

          // intentional fall through
          case 2:
          case 3:
            return _set(this, index, replacement, defaultValue);
          default:
            throw new SyntaxError('Wrong number of arguments');
        }
      };

      /**
       * Get a single element from the matrix.
       * @memberof DenseMatrix
       * @param {number[]} index   Zero-based index
       * @return {*} value
       */
      DenseMatrix.prototype.get = function (index) {
        if (!isArray(index)) {
          throw new TypeError('Array expected');
        }
        if (index.length !== this._size.length) {
          throw new DimensionError(index.length, this._size.length);
        }

        // check index
        for (var x = 0; x < index.length; x++) {
          validateIndex(index[x], this._size[x]);
        }
        var data = this._data;
        for (var i = 0, ii = index.length; i < ii; i++) {
          var indexI = index[i];
          validateIndex(indexI, data.length);
          data = data[indexI];
        }
        return data;
      };

      /**
       * Replace a single element in the matrix.
       * @memberof DenseMatrix
       * @param {number[]} index   Zero-based index
       * @param {*} value
       * @param {*} [defaultValue]        Default value, filled in on new entries when
       *                                  the matrix is resized. If not provided,
       *                                  new matrix elements will be left undefined.
       * @return {DenseMatrix} self
       */
      DenseMatrix.prototype.set = function (index, value, defaultValue) {
        if (!isArray(index)) {
          throw new TypeError('Array expected');
        }
        if (index.length < this._size.length) {
          throw new DimensionError(index.length, this._size.length, '<');
        }
        var i, ii, indexI;

        // enlarge matrix when needed
        var size = index.map(function (i) {
          return i + 1;
        });
        _fit(this, size, defaultValue);

        // traverse over the dimensions
        var data = this._data;
        for (i = 0, ii = index.length - 1; i < ii; i++) {
          indexI = index[i];
          validateIndex(indexI, data.length);
          data = data[indexI];
        }

        // set new value
        indexI = index[index.length - 1];
        validateIndex(indexI, data.length);
        data[indexI] = value;
        return this;
      };

      /**
       * Get a submatrix of this matrix
       * @memberof DenseMatrix
       * @param {DenseMatrix} matrix
       * @param {Index} index   Zero-based index
       * @private
       */
      function _get(matrix, index) {
        if (!isIndex(index)) {
          throw new TypeError('Invalid index');
        }
        var isScalar = index.isScalar();
        if (isScalar) {
          // return a scalar
          return matrix.get(index.min());
        } else {
          // validate dimensions
          var size = index.size();
          if (size.length !== matrix._size.length) {
            throw new DimensionError(size.length, matrix._size.length);
          }

          // validate if any of the ranges in the index is out of range
          var min = index.min();
          var max = index.max();
          for (var i = 0, ii = matrix._size.length; i < ii; i++) {
            validateIndex(min[i], matrix._size[i]);
            validateIndex(max[i], matrix._size[i]);
          }

          // retrieve submatrix
          // TODO: more efficient when creating an empty matrix and setting _data and _size manually
          return new DenseMatrix(_getSubmatrix(matrix._data, index, size.length, 0), matrix._datatype);
        }
      }

      /**
       * Recursively get a submatrix of a multi dimensional matrix.
       * Index is not checked for correct number or length of dimensions.
       * @memberof DenseMatrix
       * @param {Array} data
       * @param {Index} index
       * @param {number} dims   Total number of dimensions
       * @param {number} dim    Current dimension
       * @return {Array} submatrix
       * @private
       */
      function _getSubmatrix(data, index, dims, dim) {
        var last = dim === dims - 1;
        var range = index.dimension(dim);
        if (last) {
          return range.map(function (i) {
            validateIndex(i, data.length);
            return data[i];
          }).valueOf();
        } else {
          return range.map(function (i) {
            validateIndex(i, data.length);
            var child = data[i];
            return _getSubmatrix(child, index, dims, dim + 1);
          }).valueOf();
        }
      }

      /**
       * Replace a submatrix in this matrix
       * Indexes are zero-based.
       * @memberof DenseMatrix
       * @param {DenseMatrix} matrix
       * @param {Index} index
       * @param {DenseMatrix | Array | *} submatrix
       * @param {*} defaultValue          Default value, filled in on new entries when
       *                                  the matrix is resized.
       * @return {DenseMatrix} matrix
       * @private
       */
      function _set(matrix, index, submatrix, defaultValue) {
        if (!index || index.isIndex !== true) {
          throw new TypeError('Invalid index');
        }

        // get index size and check whether the index contains a single value
        var iSize = index.size();
        var isScalar = index.isScalar();

        // calculate the size of the submatrix, and convert it into an Array if needed
        var sSize;
        if (isMatrix(submatrix)) {
          sSize = submatrix.size();
          submatrix = submatrix.valueOf();
        } else {
          sSize = arraySize(submatrix);
        }
        if (isScalar) {
          // set a scalar

          // check whether submatrix is a scalar
          if (sSize.length !== 0) {
            throw new TypeError('Scalar expected');
          }
          matrix.set(index.min(), submatrix, defaultValue);
        } else {
          // set a submatrix

          // validate dimensions
          if (iSize.length < matrix._size.length) {
            throw new DimensionError(iSize.length, matrix._size.length, '<');
          }
          if (sSize.length < iSize.length) {
            // calculate number of missing outer dimensions
            var i = 0;
            var outer = 0;
            while (iSize[i] === 1 && sSize[i] === 1) {
              i++;
            }
            while (iSize[i] === 1) {
              outer++;
              i++;
            }

            // unsqueeze both outer and inner dimensions
            submatrix = unsqueeze(submatrix, iSize.length, outer, sSize);
          }

          // check whether the size of the submatrix matches the index size
          if (!deepStrictEqual(iSize, sSize)) {
            throw new DimensionError(iSize, sSize, '>');
          }

          // enlarge matrix when needed
          var size = index.max().map(function (i) {
            return i + 1;
          });
          _fit(matrix, size, defaultValue);

          // insert the sub matrix
          var dims = iSize.length;
          var dim = 0;
          _setSubmatrix(matrix._data, index, submatrix, dims, dim);
        }
        return matrix;
      }

      /**
       * Replace a submatrix of a multi dimensional matrix.
       * @memberof DenseMatrix
       * @param {Array} data
       * @param {Index} index
       * @param {Array} submatrix
       * @param {number} dims   Total number of dimensions
       * @param {number} dim
       * @private
       */
      function _setSubmatrix(data, index, submatrix, dims, dim) {
        var last = dim === dims - 1;
        var range = index.dimension(dim);
        if (last) {
          range.forEach(function (dataIndex, subIndex) {
            validateIndex(dataIndex);
            data[dataIndex] = submatrix[subIndex[0]];
          });
        } else {
          range.forEach(function (dataIndex, subIndex) {
            validateIndex(dataIndex);
            _setSubmatrix(data[dataIndex], index, submatrix[subIndex[0]], dims, dim + 1);
          });
        }
      }

      /**
       * Resize the matrix to the given size. Returns a copy of the matrix when
       * `copy=true`, otherwise return the matrix itself (resize in place).
       *
       * @memberof DenseMatrix
       * @param {number[] || Matrix} size The new size the matrix should have.
       * @param {*} [defaultValue=0]      Default value, filled in on new entries.
       *                                  If not provided, the matrix elements will
       *                                  be filled with zeros.
       * @param {boolean} [copy]          Return a resized copy of the matrix
       *
       * @return {Matrix}                 The resized matrix
       */
      DenseMatrix.prototype.resize = function (size, defaultValue, copy) {
        // validate arguments
        if (!isCollection(size)) {
          throw new TypeError('Array or Matrix expected');
        }

        // SparseMatrix input is always 2d, flatten this into 1d if it's indeed a vector
        var sizeArray = size.valueOf().map(value => {
          return Array.isArray(value) && value.length === 1 ? value[0] : value;
        });

        // matrix to resize
        var m = copy ? this.clone() : this;
        // resize matrix
        return _resize(m, sizeArray, defaultValue);
      };
      function _resize(matrix, size, defaultValue) {
        // check size
        if (size.length === 0) {
          // first value in matrix
          var v = matrix._data;
          // go deep
          while (isArray(v)) {
            v = v[0];
          }
          return v;
        }
        // resize matrix
        matrix._size = size.slice(0); // copy the array
        matrix._data = resize(matrix._data, matrix._size, defaultValue);
        // return matrix
        return matrix;
      }

      /**
       * Reshape the matrix to the given size. Returns a copy of the matrix when
       * `copy=true`, otherwise return the matrix itself (reshape in place).
       *
       * NOTE: This might be better suited to copy by default, instead of modifying
       *       in place. For now, it operates in place to remain consistent with
       *       resize().
       *
       * @memberof DenseMatrix
       * @param {number[]} size           The new size the matrix should have.
       * @param {boolean} [copy]          Return a reshaped copy of the matrix
       *
       * @return {Matrix}                 The reshaped matrix
       */
      DenseMatrix.prototype.reshape = function (size, copy) {
        var m = copy ? this.clone() : this;
        m._data = reshape(m._data, size);
        var currentLength = m._size.reduce((length, size) => length * size);
        m._size = processSizesWildcard(size, currentLength);
        return m;
      };

      /**
       * Enlarge the matrix when it is smaller than given size.
       * If the matrix is larger or equal sized, nothing is done.
       * @memberof DenseMatrix
       * @param {DenseMatrix} matrix           The matrix to be resized
       * @param {number[]} size
       * @param {*} defaultValue          Default value, filled in on new entries.
       * @private
       */
      function _fit(matrix, size, defaultValue) {
        var
        // copy the array
        newSize = matrix._size.slice(0);
        var changed = false;

        // add dimensions when needed
        while (newSize.length < size.length) {
          newSize.push(0);
          changed = true;
        }

        // enlarge size when needed
        for (var i = 0, ii = size.length; i < ii; i++) {
          if (size[i] > newSize[i]) {
            newSize[i] = size[i];
            changed = true;
          }
        }
        if (changed) {
          // resize only when size is changed
          _resize(matrix, newSize, defaultValue);
        }
      }

      /**
       * Create a clone of the matrix
       * @memberof DenseMatrix
       * @return {DenseMatrix} clone
       */
      DenseMatrix.prototype.clone = function () {
        var m = new DenseMatrix({
          data: clone$1(this._data),
          size: clone$1(this._size),
          datatype: this._datatype
        });
        return m;
      };

      /**
       * Retrieve the size of the matrix.
       * @memberof DenseMatrix
       * @returns {number[]} size
       */
      DenseMatrix.prototype.size = function () {
        return this._size.slice(0); // return a clone of _size
      };

      /**
       * Create a new matrix with the results of the callback function executed on
       * each entry of the matrix.
       * @memberof DenseMatrix
       * @param {Function} callback   The callback function is invoked with three
       *                              parameters: the value of the element, the index
       *                              of the element, and the Matrix being traversed.
       *
       * @return {DenseMatrix} matrix
       */
      DenseMatrix.prototype.map = function (callback) {
        // matrix instance
        var me = this;
        var args = maxArgumentCount(callback);
        var recurse = function recurse(value, index) {
          if (isArray(value)) {
            return value.map(function (child, i) {
              return recurse(child, index.concat(i));
            });
          } else {
            // invoke the callback function with the right number of arguments
            if (args === 1) {
              return callback(value);
            } else if (args === 2) {
              return callback(value, index);
            } else {
              // 3 or -1
              return callback(value, index, me);
            }
          }
        };

        // determine the new datatype when the original matrix has datatype defined
        // TODO: should be done in matrix constructor instead
        var data = recurse(this._data, []);
        var datatype = this._datatype !== undefined ? getArrayDataType(data, typeOf) : undefined;
        return new DenseMatrix(data, datatype);
      };

      /**
       * Execute a callback function on each entry of the matrix.
       * @memberof DenseMatrix
       * @param {Function} callback   The callback function is invoked with three
       *                              parameters: the value of the element, the index
       *                              of the element, and the Matrix being traversed.
       */
      DenseMatrix.prototype.forEach = function (callback) {
        // matrix instance
        var me = this;
        var recurse = function recurse(value, index) {
          if (isArray(value)) {
            value.forEach(function (child, i) {
              recurse(child, index.concat(i));
            });
          } else {
            callback(value, index, me);
          }
        };
        recurse(this._data, []);
      };

      /**
       * Iterate over the matrix elements
       * @return {Iterable<{ value, index: number[] }>}
       */
      DenseMatrix.prototype[Symbol.iterator] = function* () {
        var recurse = function* recurse(value, index) {
          if (isArray(value)) {
            for (var i = 0; i < value.length; i++) {
              yield* recurse(value[i], index.concat(i));
            }
          } else {
            yield {
              value,
              index
            };
          }
        };
        yield* recurse(this._data, []);
      };

      /**
       * Returns an array containing the rows of a 2D matrix
       * @returns {Array<Matrix>}
       */
      DenseMatrix.prototype.rows = function () {
        var result = [];
        var s = this.size();
        if (s.length !== 2) {
          throw new TypeError('Rows can only be returned for a 2D matrix.');
        }
        var data = this._data;
        for (var row of data) {
          result.push(new DenseMatrix([row], this._datatype));
        }
        return result;
      };

      /**
       * Returns an array containing the columns of a 2D matrix
       * @returns {Array<Matrix>}
       */
      DenseMatrix.prototype.columns = function () {
        var _this = this;
        var result = [];
        var s = this.size();
        if (s.length !== 2) {
          throw new TypeError('Rows can only be returned for a 2D matrix.');
        }
        var data = this._data;
        var _loop = function _loop(i) {
          var col = data.map(row => [row[i]]);
          result.push(new DenseMatrix(col, _this._datatype));
        };
        for (var i = 0; i < s[1]; i++) {
          _loop(i);
        }
        return result;
      };

      /**
       * Create an Array with a copy of the data of the DenseMatrix
       * @memberof DenseMatrix
       * @returns {Array} array
       */
      DenseMatrix.prototype.toArray = function () {
        return clone$1(this._data);
      };

      /**
       * Get the primitive value of the DenseMatrix: a multidimensional array
       * @memberof DenseMatrix
       * @returns {Array} array
       */
      DenseMatrix.prototype.valueOf = function () {
        return this._data;
      };

      /**
       * Get a string representation of the matrix, with optional formatting options.
       * @memberof DenseMatrix
       * @param {Object | number | Function} [options]  Formatting options. See
       *                                                lib/utils/number:format for a
       *                                                description of the available
       *                                                options.
       * @returns {string} str
       */
      DenseMatrix.prototype.format = function (options) {
        return format(this._data, options);
      };

      /**
       * Get a string representation of the matrix
       * @memberof DenseMatrix
       * @returns {string} str
       */
      DenseMatrix.prototype.toString = function () {
        return format(this._data);
      };

      /**
       * Get a JSON representation of the matrix
       * @memberof DenseMatrix
       * @returns {Object}
       */
      DenseMatrix.prototype.toJSON = function () {
        return {
          mathjs: 'DenseMatrix',
          data: this._data,
          size: this._size,
          datatype: this._datatype
        };
      };

      /**
       * Get the kth Matrix diagonal.
       *
       * @memberof DenseMatrix
       * @param {number | BigNumber} [k=0]     The kth diagonal where the vector will retrieved.
       *
       * @returns {Matrix}                     The matrix with the diagonal values.
       */
      DenseMatrix.prototype.diagonal = function (k) {
        // validate k if any
        if (k) {
          // convert BigNumber to a number
          if (isBigNumber(k)) {
            k = k.toNumber();
          }
          // is must be an integer
          if (!isNumber(k) || !isInteger(k)) {
            throw new TypeError('The parameter k must be an integer number');
          }
        } else {
          // default value
          k = 0;
        }
        var kSuper = k > 0 ? k : 0;
        var kSub = k < 0 ? -k : 0;

        // rows & columns
        var rows = this._size[0];
        var columns = this._size[1];

        // number diagonal values
        var n = Math.min(rows - kSub, columns - kSuper);

        // x is a matrix get diagonal from matrix
        var data = [];

        // loop rows
        for (var i = 0; i < n; i++) {
          data[i] = this._data[i + kSub][i + kSuper];
        }

        // create DenseMatrix
        return new DenseMatrix({
          data,
          size: [n],
          datatype: this._datatype
        });
      };

      /**
       * Create a diagonal matrix.
       *
       * @memberof DenseMatrix
       * @param {Array} size                     The matrix size.
       * @param {number | Matrix | Array } value The values for the diagonal.
       * @param {number | BigNumber} [k=0]       The kth diagonal where the vector will be filled in.
       * @param {number} [defaultValue]          The default value for non-diagonal
       * @param {string} [datatype]              The datatype for the diagonal
       *
       * @returns {DenseMatrix}
       */
      DenseMatrix.diagonal = function (size, value, k, defaultValue) {
        if (!isArray(size)) {
          throw new TypeError('Array expected, size parameter');
        }
        if (size.length !== 2) {
          throw new Error('Only two dimensions matrix are supported');
        }

        // map size & validate
        size = size.map(function (s) {
          // check it is a big number
          if (isBigNumber(s)) {
            // convert it
            s = s.toNumber();
          }
          // validate arguments
          if (!isNumber(s) || !isInteger(s) || s < 1) {
            throw new Error('Size values must be positive integers');
          }
          return s;
        });

        // validate k if any
        if (k) {
          // convert BigNumber to a number
          if (isBigNumber(k)) {
            k = k.toNumber();
          }
          // is must be an integer
          if (!isNumber(k) || !isInteger(k)) {
            throw new TypeError('The parameter k must be an integer number');
          }
        } else {
          // default value
          k = 0;
        }
        var kSuper = k > 0 ? k : 0;
        var kSub = k < 0 ? -k : 0;

        // rows and columns
        var rows = size[0];
        var columns = size[1];

        // number of non-zero items
        var n = Math.min(rows - kSub, columns - kSuper);

        // value extraction function
        var _value;

        // check value
        if (isArray(value)) {
          // validate array
          if (value.length !== n) {
            // number of values in array must be n
            throw new Error('Invalid value array length');
          }
          // define function
          _value = function _value(i) {
            // return value @ i
            return value[i];
          };
        } else if (isMatrix(value)) {
          // matrix size
          var ms = value.size();
          // validate matrix
          if (ms.length !== 1 || ms[0] !== n) {
            // number of values in array must be n
            throw new Error('Invalid matrix length');
          }
          // define function
          _value = function _value(i) {
            // return value @ i
            return value.get([i]);
          };
        } else {
          // define function
          _value = function _value() {
            // return value
            return value;
          };
        }

        // discover default value if needed
        if (!defaultValue) {
          // check first value in array
          defaultValue = isBigNumber(_value(0)) ? _value(0).mul(0) // trick to create a BigNumber with value zero
          : 0;
        }

        // empty array
        var data = [];

        // check we need to resize array
        if (size.length > 0) {
          // resize array
          data = resize(data, size, defaultValue);
          // fill diagonal
          for (var d = 0; d < n; d++) {
            data[d + kSub][d + kSuper] = _value(d);
          }
        }

        // create DenseMatrix
        return new DenseMatrix({
          data,
          size: [rows, columns]
        });
      };

      /**
       * Generate a matrix from a JSON object
       * @memberof DenseMatrix
       * @param {Object} json  An object structured like
       *                       `{"mathjs": "DenseMatrix", data: [], size: []}`,
       *                       where mathjs is optional
       * @returns {DenseMatrix}
       */
      DenseMatrix.fromJSON = function (json) {
        return new DenseMatrix(json);
      };

      /**
       * Swap rows i and j in Matrix.
       *
       * @memberof DenseMatrix
       * @param {number} i       Matrix row index 1
       * @param {number} j       Matrix row index 2
       *
       * @return {Matrix}        The matrix reference
       */
      DenseMatrix.prototype.swapRows = function (i, j) {
        // check index
        if (!isNumber(i) || !isInteger(i) || !isNumber(j) || !isInteger(j)) {
          throw new Error('Row index must be positive integers');
        }
        // check dimensions
        if (this._size.length !== 2) {
          throw new Error('Only two dimensional matrix is supported');
        }
        // validate index
        validateIndex(i, this._size[0]);
        validateIndex(j, this._size[0]);

        // swap rows
        DenseMatrix._swapRows(i, j, this._data);
        // return current instance
        return this;
      };

      /**
       * Swap rows i and j in Dense Matrix data structure.
       *
       * @param {number} i       Matrix row index 1
       * @param {number} j       Matrix row index 2
       * @param {Array} data     Matrix data
       */
      DenseMatrix._swapRows = function (i, j, data) {
        // swap values i <-> j
        var vi = data[i];
        data[i] = data[j];
        data[j] = vi;
      };

      /**
       * Preprocess data, which can be an Array or DenseMatrix with nested Arrays and
       * Matrices. Replaces all nested Matrices with Arrays
       * @memberof DenseMatrix
       * @param {Array} data
       * @return {Array} data
       */
      function preprocess(data) {
        for (var i = 0, ii = data.length; i < ii; i++) {
          var elem = data[i];
          if (isArray(elem)) {
            data[i] = preprocess(elem);
          } else if (elem && elem.isMatrix === true) {
            data[i] = preprocess(elem.valueOf());
          }
        }
        return data;
      }
      return DenseMatrix;
    }, {
      isClass: true
    });

    /**
     * Execute the callback function element wise for each element in array and any
     * nested array
     * Returns an array with the results
     * @param {Array | Matrix} array
     * @param {Function} callback   The callback is called with two parameters:
     *                              value1 and value2, which contain the current
     *                              element of both arrays.
     * @param {boolean} [skipZeros] Invoke callback function for non-zero values only.
     *
     * @return {Array | Matrix} res
     */
    function deepMap(array, callback, skipZeros) {
      if (array && typeof array.map === 'function') {
        // TODO: replace array.map with a for loop to improve performance
        return array.map(function (x) {
          return deepMap(x, callback);
        });
      } else {
        return callback(array);
      }
    }

    var n1 = 'number';
    function notNumber(x) {
      return !x;
    }
    notNumber.signature = n1;

    var name$4 = 'number';
    var dependencies$4 = ['typed'];

    /**
     * Separates the radix, integer part, and fractional part of a non decimal number string
     * @param {string} input string to parse
     * @returns {object} the parts of the string or null if not a valid input
     */
    function getNonDecimalNumberParts(input) {
      var nonDecimalWithRadixMatch = input.match(/(0[box])([0-9a-fA-F]*)\.([0-9a-fA-F]*)/);
      if (nonDecimalWithRadixMatch) {
        var radix = {
          '0b': 2,
          '0o': 8,
          '0x': 16
        }[nonDecimalWithRadixMatch[1]];
        var integerPart = nonDecimalWithRadixMatch[2];
        var fractionalPart = nonDecimalWithRadixMatch[3];
        return {
          input,
          radix,
          integerPart,
          fractionalPart
        };
      } else {
        return null;
      }
    }

    /**
     * Makes a number from a radix, and integer part, and a fractional part
     * @param {parts} [x] parts of the number string (from getNonDecimalNumberParts)
     * @returns {number} the number
     */
    function makeNumberFromNonDecimalParts(parts) {
      var n = parseInt(parts.integerPart, parts.radix);
      var f = 0;
      for (var i = 0; i < parts.fractionalPart.length; i++) {
        var digitValue = parseInt(parts.fractionalPart[i], parts.radix);
        f += digitValue / Math.pow(parts.radix, i + 1);
      }
      var result = n + f;
      if (isNaN(result)) {
        throw new SyntaxError('String "' + parts.input + '" is no valid number');
      }
      return result;
    }
    var createNumber = /* #__PURE__ */factory(name$4, dependencies$4, _ref => {
      var {
        typed
      } = _ref;
      /**
       * Create a number or convert a string, boolean, or unit to a number.
       * When value is a matrix, all elements will be converted to number.
       *
       * Syntax:
       *
       *    math.number(value)
       *    math.number(unit, valuelessUnit)
       *
       * Examples:
       *
       *    math.number(2)                         // returns number 2
       *    math.number('7.2')                     // returns number 7.2
       *    math.number(true)                      // returns number 1
       *    math.number([true, false, true, true]) // returns [1, 0, 1, 1]
       *    math.number(math.unit('52cm'), 'm')    // returns 0.52
       *
       * See also:
       *
       *    bignumber, boolean, complex, index, matrix, string, unit
       *
       * @param {string | number | BigNumber | Fraction | boolean | Array | Matrix | Unit | null} [value]  Value to be converted
       * @param {Unit | string} [valuelessUnit] A valueless unit, used to convert a unit to a number
       * @return {number | Array | Matrix} The created number
       */
      var number = typed('number', {
        '': function _() {
          return 0;
        },
        number: function number(x) {
          return x;
        },
        string: function string(x) {
          if (x === 'NaN') return NaN;
          var nonDecimalNumberParts = getNonDecimalNumberParts(x);
          if (nonDecimalNumberParts) {
            return makeNumberFromNonDecimalParts(nonDecimalNumberParts);
          }
          var size = 0;
          var wordSizeSuffixMatch = x.match(/(0[box][0-9a-fA-F]*)i([0-9]*)/);
          if (wordSizeSuffixMatch) {
            // x includes a size suffix like 0xffffi32, so we extract
            // the suffix and remove it from x
            size = Number(wordSizeSuffixMatch[2]);
            x = wordSizeSuffixMatch[1];
          }
          var num = Number(x);
          if (isNaN(num)) {
            throw new SyntaxError('String "' + x + '" is no valid number');
          }
          if (wordSizeSuffixMatch) {
            // x is a signed bin, oct, or hex literal
            // num is the value of string x if x is interpreted as unsigned
            if (num > 2 ** size - 1) {
              // literal is too large for size suffix
              throw new SyntaxError("String \"".concat(x, "\" is out of range"));
            }
            // check if the bit at index size - 1 is set and if so do the twos complement
            if (num >= 2 ** (size - 1)) {
              num = num - 2 ** size;
            }
          }
          return num;
        },
        BigNumber: function BigNumber(x) {
          return x.toNumber();
        },
        Fraction: function Fraction(x) {
          return x.valueOf();
        },
        Unit: function Unit(x) {
          throw new Error('Second argument with valueless unit expected');
        },
        null: function _null(x) {
          return 0;
        },
        'Unit, string | Unit': function UnitStringUnit(unit, valuelessUnit) {
          return unit.toNumber(valuelessUnit);
        },
        'Array | Matrix': typed.referToSelf(self => x => deepMap(x, self))
      });

      // reviver function to parse a JSON object like:
      //
      //     {"mathjs":"number","value":"2.3"}
      //
      // into a number 2.3
      number.fromJSON = function (json) {
        return parseFloat(json.value);
      };
      return number;
    });

    var name$3 = 'bignumber';
    var dependencies$3 = ['typed', 'BigNumber'];
    var createBignumber = /* #__PURE__ */factory(name$3, dependencies$3, _ref => {
      var {
        typed,
        BigNumber
      } = _ref;
      /**
       * Create a BigNumber, which can store numbers with arbitrary precision.
       * When a matrix is provided, all elements will be converted to BigNumber.
       *
       * Syntax:
       *
       *    math.bignumber(x)
       *
       * Examples:
       *
       *    0.1 + 0.2                                  // returns number 0.30000000000000004
       *    math.bignumber(0.1) + math.bignumber(0.2)  // returns BigNumber 0.3
       *
       *
       *    7.2e500                                    // returns number Infinity
       *    math.bignumber('7.2e500')                  // returns BigNumber 7.2e500
       *
       * See also:
       *
       *    boolean, complex, index, matrix, string, unit
       *
       * @param {number | string | Fraction | BigNumber | Array | Matrix | boolean | null} [value]  Value for the big number,
       *                                                    0 by default.
       * @returns {BigNumber} The created bignumber
       */
      return typed('bignumber', {
        '': function _() {
          return new BigNumber(0);
        },
        number: function number(x) {
          // convert to string to prevent errors in case of >15 digits
          return new BigNumber(x + '');
        },
        string: function string(x) {
          var wordSizeSuffixMatch = x.match(/(0[box][0-9a-fA-F]*)i([0-9]*)/);
          if (wordSizeSuffixMatch) {
            // x has a word size suffix
            var size = wordSizeSuffixMatch[2];
            var n = BigNumber(wordSizeSuffixMatch[1]);
            var twoPowSize = new BigNumber(2).pow(Number(size));
            if (n.gt(twoPowSize.sub(1))) {
              throw new SyntaxError("String \"".concat(x, "\" is out of range"));
            }
            var twoPowSizeSubOne = new BigNumber(2).pow(Number(size) - 1);
            if (n.gte(twoPowSizeSubOne)) {
              return n.sub(twoPowSize);
            } else {
              return n;
            }
          }
          return new BigNumber(x);
        },
        BigNumber: function BigNumber(x) {
          // we assume a BigNumber is immutable
          return x;
        },
        Fraction: function Fraction(x) {
          return new BigNumber(x.n).div(x.d).times(x.s);
        },
        null: function _null(x) {
          return new BigNumber(0);
        },
        'Array | Matrix': typed.referToSelf(self => x => deepMap(x, self))
      });
    });

    var name$2 = 'fraction';
    var dependencies$2 = ['typed', 'Fraction'];
    var createFraction = /* #__PURE__ */factory(name$2, dependencies$2, _ref => {
      var {
        typed,
        Fraction
      } = _ref;
      /**
       * Create a fraction or convert a value to a fraction.
       *
       * With one numeric argument, produces the closest rational approximation to the
       * input.
       * With two arguments, the first is the numerator and the second is the denominator,
       * and creates the corresponding fraction. Both numerator and denominator must be
       * integers.
       * With one object argument, looks for the integer numerator as the value of property
       * 'n' and the integer denominator as the value of property 'd'.
       * With a matrix argument, creates a matrix of the same shape with entries
       * converted into fractions.
       *
       * Syntax:
       *     math.fraction(value)
       *     math.fraction(numerator, denominator)
       *     math.fraction({n: numerator, d: denominator})
       *     math.fraction(matrix: Array | Matrix)
       *
       * Examples:
       *
       *     math.fraction(6.283)             // returns Fraction 6283/1000
       *     math.fraction(1, 3)              // returns Fraction 1/3
       *     math.fraction('2/3')             // returns Fraction 2/3
       *     math.fraction({n: 2, d: 3})      // returns Fraction 2/3
       *     math.fraction([0.2, 0.25, 1.25]) // returns Array [1/5, 1/4, 5/4]
       *     math.fraction(4, 5.1)            // throws Error: Parameters must be integer
       *
       * See also:
       *
       *    bignumber, number, string, unit
       *
       * @param {number | string | Fraction | BigNumber | Array | Matrix} [args]
       *            Arguments specifying the value, or numerator and denominator of
       *            the fraction
       * @return {Fraction | Array | Matrix} Returns a fraction
       */
      return typed('fraction', {
        number: function number(x) {
          if (!isFinite(x) || isNaN(x)) {
            throw new Error(x + ' cannot be represented as a fraction');
          }
          return new Fraction(x);
        },
        string: function string(x) {
          return new Fraction(x);
        },
        'number, number': function numberNumber(numerator, denominator) {
          return new Fraction(numerator, denominator);
        },
        null: function _null(x) {
          return new Fraction(0);
        },
        BigNumber: function BigNumber(x) {
          return new Fraction(x.toString());
        },
        Fraction: function Fraction(x) {
          return x; // fractions are immutable
        },

        Object: function Object(x) {
          return new Fraction(x);
        },
        'Array | Matrix': typed.referToSelf(self => x => deepMap(x, self))
      });
    });

    var name$1 = 'not';
    var dependencies$1 = ['typed'];
    var createNot = /* #__PURE__ */factory(name$1, dependencies$1, _ref => {
      var {
        typed
      } = _ref;
      /**
       * Logical `not`. Flips boolean value of a given parameter.
       * For matrices, the function is evaluated element wise.
       *
       * Syntax:
       *
       *    math.not(x)
       *
       * Examples:
       *
       *    math.not(2)      // returns false
       *    math.not(0)      // returns true
       *    math.not(true)   // returns false
       *
       *    a = [2, -7, 0]
       *    math.not(a)      // returns [false, false, true]
       *
       * See also:
       *
       *    and, or, xor
       *
       * @param  {number | BigNumber | Complex | Unit | Array | Matrix} x First value to check
       * @return {boolean | Array | Matrix}
       *            Returns true when input is a zero or empty value.
       */
      return typed(name$1, {
        'null | undefined': () => true,
        number: notNumber,
        Complex: function Complex(x) {
          return x.re === 0 && x.im === 0;
        },
        BigNumber: function BigNumber(x) {
          return x.isZero() || x.isNaN();
        },
        Unit: typed.referToSelf(self => x => typed.find(self, x.valueType())(x.value)),
        'Array | Matrix': typed.referToSelf(self => x => deepMap(x, self))
      });
    });

    function noBignumber() {
      throw new Error('No "bignumber" implementation available');
    }
    function noFraction() {
      throw new Error('No "fraction" implementation available');
    }

    var name = 'numeric';
    var dependencies = ['number', '?bignumber', '?fraction'];
    var createNumeric = /* #__PURE__ */factory(name, dependencies, _ref => {
      var {
        number: _number,
        bignumber,
        fraction
      } = _ref;
      var validInputTypes = {
        string: true,
        number: true,
        BigNumber: true,
        Fraction: true
      };

      // Load the conversion functions for each output type
      var validOutputTypes = {
        number: x => _number(x),
        BigNumber: bignumber ? x => bignumber(x) : noBignumber,
        Fraction: fraction ? x => fraction(x) : noFraction
      };

      /**
       * Convert a numeric input to a specific numeric type: number, BigNumber, or Fraction.
       *
       * Syntax:
       *
       *    math.numeric(x)
       *
       * Examples:
       *
       *    math.numeric('4')                           // returns 4
       *    math.numeric('4', 'number')                 // returns 4
       *    math.numeric('4', 'BigNumber')              // returns BigNumber 4
       *    math.numeric('4', 'Fraction')               // returns Fraction 4
       *    math.numeric(4, 'Fraction')                 // returns Fraction 4
       *    math.numeric(math.fraction(2, 5), 'number') // returns 0.4
       *
       * See also:
       *
       *    number, fraction, bignumber, string, format
       *
       * @param {string | number | BigNumber | Fraction } value
       *              A numeric value or a string containing a numeric value
       * @param {string} outputType
       *              Desired numeric output type.
       *              Available values: 'number', 'BigNumber', or 'Fraction'
       * @return {number | BigNumber | Fraction}
       *              Returns an instance of the numeric in the requested type
       */
      return function numeric(value) {
        var outputType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'number';
        var check = arguments.length > 2 ? arguments[2] : undefined;
        if (check !== undefined) {
          throw new SyntaxError('numeric() takes one or two arguments');
        }
        var inputType = typeOf(value);
        if (!(inputType in validInputTypes)) {
          throw new TypeError('Cannot convert ' + value + ' of type "' + inputType + '"; valid input types are ' + Object.keys(validInputTypes).join(', '));
        }
        if (!(outputType in validOutputTypes)) {
          throw new TypeError('Cannot convert ' + value + ' to type "' + outputType + '"; valid output types are ' + Object.keys(validOutputTypes).join(', '));
        }
        if (outputType === inputType) {
          return value;
        } else {
          return validOutputTypes[outputType](value);
        }
      };
    });

    /**
     * THIS FILE IS AUTO-GENERATED
     * DON'T MAKE CHANGES HERE
     */
    var BigNumber = /* #__PURE__ */createBigNumberClass({
      config: config$1
    });
    var Complex = /* #__PURE__ */createComplexClass({});
    var Fraction = /* #__PURE__ */createFractionClass({});
    var Matrix = /* #__PURE__ */createMatrixClass({});
    var DenseMatrix = /* #__PURE__ */createDenseMatrixClass({
      Matrix
    });
    var typed = /* #__PURE__ */createTyped({
      BigNumber,
      Complex,
      DenseMatrix,
      Fraction
    });
    var not = /* #__PURE__ */createNot({
      typed
    });

    /**
     * THIS FILE IS AUTO-GENERATED
     * DON'T MAKE CHANGES HERE
     */
    var BigNumberDependencies = {
      createBigNumberClass
    };

    /**
     * THIS FILE IS AUTO-GENERATED
     * DON'T MAKE CHANGES HERE
     */
    var ComplexDependencies = {
      createComplexClass
    };

    /**
     * THIS FILE IS AUTO-GENERATED
     * DON'T MAKE CHANGES HERE
     */
    var MatrixDependencies = {
      createMatrixClass
    };

    /**
     * THIS FILE IS AUTO-GENERATED
     * DON'T MAKE CHANGES HERE
     */
    var DenseMatrixDependencies = {
      MatrixDependencies,
      createDenseMatrixClass
    };

    /**
     * THIS FILE IS AUTO-GENERATED
     * DON'T MAKE CHANGES HERE
     */
    var FractionDependencies = {
      createFractionClass
    };

    /**
     * THIS FILE IS AUTO-GENERATED
     * DON'T MAKE CHANGES HERE
     */
    var typedDependencies = {
      BigNumberDependencies,
      ComplexDependencies,
      DenseMatrixDependencies,
      FractionDependencies,
      createTyped
    };

    /**
     * THIS FILE IS AUTO-GENERATED
     * DON'T MAKE CHANGES HERE
     */
    var bignumberDependencies = {
      BigNumberDependencies,
      typedDependencies,
      createBignumber
    };

    /**
     * THIS FILE IS AUTO-GENERATED
     * DON'T MAKE CHANGES HERE
     */
    var fractionDependencies = {
      FractionDependencies,
      typedDependencies,
      createFraction
    };

    /**
     * THIS FILE IS AUTO-GENERATED
     * DON'T MAKE CHANGES HERE
     */
    var numberDependencies = {
      typedDependencies,
      createNumber
    };

    /**
     * THIS FILE IS AUTO-GENERATED
     * DON'T MAKE CHANGES HERE
     */
    var numericDependencies = {
      bignumberDependencies,
      fractionDependencies,
      numberDependencies,
      createNumeric
    };

    /* src\Home.svelte generated by Svelte v3.52.0 */
    const file$1 = "src\\Home.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (65:0) {#if engine.done}
    function create_if_block_2(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: { engine: /*engine*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(overlay.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(overlay, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const overlay_changes = {};
    			if (dirty & /*engine*/ 1) overlay_changes.engine = /*engine*/ ctx[0];
    			overlay.$set(overlay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(overlay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(overlay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(overlay, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(65:0) {#if engine.done}",
    		ctx
    	});

    	return block;
    }

    // (88:24) {:else}
    function create_else_block(ctx) {
    	let td;
    	let t_value = /*nice*/ ctx[7].v1 + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			attr_dev(td, "class", "not-clickable svelte-1gjl6jy");
    			add_location(td, file$1, 88, 28, 3458);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*board*/ 2 && t_value !== (t_value = /*nice*/ ctx[7].v1 + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(88:24) {:else}",
    		ctx
    	});

    	return block;
    }

    // (86:24) {#if nice.v1 == 0 && nice.title != 'Totalsum'}
    function create_if_block(ctx) {
    	let td;
    	let t0_value = /*nice*/ ctx[7].v1 + "";
    	let t0;
    	let t1;
    	let td_id_value;
    	let mounted;
    	let dispose;
    	let if_block = /*nice*/ ctx[7].pot && create_if_block_1(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[5](/*nice*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			td = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(td, "class", "clickable svelte-1gjl6jy");
    			attr_dev(td, "id", td_id_value = /*nice*/ ctx[7].title);
    			add_location(td, file$1, 86, 28, 3262);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t0);
    			append_dev(td, t1);
    			if (if_block) if_block.m(td, null);

    			if (!mounted) {
    				dispose = listen_dev(td, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*board*/ 2 && t0_value !== (t0_value = /*nice*/ ctx[7].v1 + "")) set_data_dev(t0, t0_value);

    			if (/*nice*/ ctx[7].pot) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(td, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*board*/ 2 && td_id_value !== (td_id_value = /*nice*/ ctx[7].title)) {
    				attr_dev(td, "id", td_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(86:24) {#if nice.v1 == 0 && nice.title != 'Totalsum'}",
    		ctx
    	});

    	return block;
    }

    // (87:125) {#if nice.pot}
    function create_if_block_1(ctx) {
    	let t0;
    	let t1_value = /*nice*/ ctx[7].pot + "";
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("+ ");
    			t1 = text(t1_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*board*/ 2 && t1_value !== (t1_value = /*nice*/ ctx[7].pot + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(87:125) {#if nice.pot}",
    		ctx
    	});

    	return block;
    }

    // (83:16) {#each board as nice}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*nice*/ ctx[7].title + "";
    	let t0;
    	let t1;
    	let t2;
    	let td1;
    	let t3_value = /*nice*/ ctx[7].v2 + "";
    	let t3;
    	let t4;

    	function select_block_type(ctx, dirty) {
    		if (/*nice*/ ctx[7].v1 == 0 && /*nice*/ ctx[7].title != 'Totalsum') return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			if_block.c();
    			t2 = space();
    			td1 = element("td");
    			t3 = text(t3_value);
    			t4 = space();
    			attr_dev(td0, "class", "svelte-1gjl6jy");
    			add_location(td0, file$1, 84, 24, 3139);
    			attr_dev(td1, "class", "svelte-1gjl6jy");
    			add_location(td1, file$1, 90, 24, 3555);
    			add_location(tr, file$1, 83, 20, 3109);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			if_block.m(tr, null);
    			append_dev(tr, t2);
    			append_dev(tr, td1);
    			append_dev(td1, t3);
    			append_dev(tr, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*board*/ 2 && t0_value !== (t0_value = /*nice*/ ctx[7].title + "")) set_data_dev(t0, t0_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(tr, t2);
    				}
    			}

    			if (dirty & /*board*/ 2 && t3_value !== (t3_value = /*nice*/ ctx[7].v2 + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(83:16) {#each board as nice}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let t0;
    	let div3;
    	let div0;
    	let playerbar0;
    	let t1;
    	let board_1;
    	let t2;
    	let playerbar1;
    	let t3;
    	let div2;
    	let div1;
    	let table;
    	let tr;
    	let th0;
    	let t4;
    	let th1;
    	let t6;
    	let th2;
    	let t8;
    	let t9;
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*engine*/ ctx[0].done && create_if_block_2(ctx);

    	playerbar0 = new PlayerBar({
    			props: {
    				name: "Bot",
    				bot: "true",
    				engine: /*engine*/ ctx[0]
    			},
    			$$inline: true
    		});

    	board_1 = new Board({
    			props: { engine: /*engine*/ ctx[0] },
    			$$inline: true
    		});

    	playerbar1 = new PlayerBar({
    			props: {
    				name: /*username*/ ctx[2],
    				engine: /*engine*/ ctx[0]
    			},
    			$$inline: true
    		});

    	let each_value = /*board*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			div3 = element("div");
    			div0 = element("div");
    			create_component(playerbar0.$$.fragment);
    			t1 = space();
    			create_component(board_1.$$.fragment);
    			t2 = space();
    			create_component(playerbar1.$$.fragment);
    			t3 = space();
    			div2 = element("div");
    			div1 = element("div");
    			table = element("table");
    			tr = element("tr");
    			th0 = element("th");
    			t4 = space();
    			th1 = element("th");
    			th1.textContent = `${/*username*/ ctx[2]}`;
    			t6 = space();
    			th2 = element("th");
    			th2.textContent = "Bot";
    			t8 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			button = element("button");
    			button.textContent = "FERDIG";
    			attr_dev(div0, "class", "left svelte-1gjl6jy");
    			add_location(div0, file$1, 69, 4, 2659);
    			attr_dev(th0, "class", "svelte-1gjl6jy");
    			add_location(th0, file$1, 78, 20, 2940);
    			attr_dev(th1, "class", "svelte-1gjl6jy");
    			add_location(th1, file$1, 79, 20, 2972);
    			attr_dev(th2, "class", "svelte-1gjl6jy");
    			add_location(th2, file$1, 80, 20, 3013);
    			add_location(tr, file$1, 77, 16, 2914);
    			add_location(table, file$1, 76, 12, 2889);
    			attr_dev(div1, "class", "board svelte-1gjl6jy");
    			add_location(div1, file$1, 75, 8, 2856);
    			attr_dev(button, "id", "done-button");
    			attr_dev(button, "class", "svelte-1gjl6jy");
    			add_location(button, file$1, 95, 8, 3673);
    			attr_dev(div2, "class", "right svelte-1gjl6jy");
    			add_location(div2, file$1, 74, 4, 2827);
    			attr_dev(div3, "class", "container svelte-1gjl6jy");
    			add_location(div3, file$1, 68, 0, 2630);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			mount_component(playerbar0, div0, null);
    			append_dev(div0, t1);
    			mount_component(board_1, div0, null);
    			append_dev(div0, t2);
    			mount_component(playerbar1, div0, null);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, table);
    			append_dev(table, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t4);
    			append_dev(tr, th1);
    			append_dev(tr, t6);
    			append_dev(tr, th2);
    			append_dev(table, t8);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			append_dev(div2, t9);
    			append_dev(div2, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*engine*/ ctx[0].done) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*engine*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const playerbar0_changes = {};
    			if (dirty & /*engine*/ 1) playerbar0_changes.engine = /*engine*/ ctx[0];
    			playerbar0.$set(playerbar0_changes);
    			const board_1_changes = {};
    			if (dirty & /*engine*/ 1) board_1_changes.engine = /*engine*/ ctx[0];
    			board_1.$set(board_1_changes);
    			const playerbar1_changes = {};
    			if (dirty & /*engine*/ 1) playerbar1_changes.engine = /*engine*/ ctx[0];
    			playerbar1.$set(playerbar1_changes);

    			if (dirty & /*board, clicked*/ 10) {
    				each_value = /*board*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(playerbar0.$$.fragment, local);
    			transition_in(board_1.$$.fragment, local);
    			transition_in(playerbar1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(playerbar0.$$.fragment, local);
    			transition_out(board_1.$$.fragment, local);
    			transition_out(playerbar1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div3);
    			destroy_component(playerbar0);
    			destroy_component(board_1);
    			destroy_component(playerbar1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let engine;
    	let board;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);
    	var username = sessionStorage.getItem("username");

    	// Skulle gjerne funnet en bedre løsning på dette
    	setInterval(
    		() => {
    			$$invalidate(0, engine);
    		},
    		50
    	);

    	if (username == undefined || username == '') {
    		window.location.href = "/";
    	}

    	function clicked(title, pot) {
    		if (pot == 0) {
    			for (let i = 0; i < board.length; i++) {
    				if (board[i].title == title) {
    					$$invalidate(0, engine.points_detail[i] = '-', engine);
    				}
    			}
    		} else {
    			for (let i = 0; i < board.length; i++) {
    				if (board[i].title == title) {
    					$$invalidate(0, engine.points_detail[i] += pot, engine);
    					$$invalidate(0, engine.points += pot, engine);
    				}
    			}
    		}

    		engine.new_round();
    	}

    	function ferdig() {
    		localStorage.setItem("beste", engine.points);
    		$$invalidate(0, engine.done = true, engine);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	const click_handler = nice => {
    		clicked(nice.title, nice.pot);
    	};

    	const click_handler_1 = () => {
    		ferdig();
    	};

    	$$self.$capture_state = () => ({
    		Engine,
    		PlayerBar,
    		Board,
    		Overlay,
    		not,
    		numericDependencies,
    		username,
    		clicked,
    		ferdig,
    		engine,
    		board
    	});

    	$$self.$inject_state = $$props => {
    		if ('username' in $$props) $$invalidate(2, username = $$props.username);
    		if ('engine' in $$props) $$invalidate(0, engine = $$props.engine);
    		if ('board' in $$props) $$invalidate(1, board = $$props.board);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*engine*/ 1) {
    			$$invalidate(1, board = [
    				{
    					'title': 'Enere',
    					'v1': engine.points_detail[0],
    					'pot': engine.calculate_points(1),
    					'v2': 0
    				},
    				{
    					'title': 'Toere',
    					'v1': engine.points_detail[1],
    					'pot': engine.calculate_points(2),
    					'v2': 0
    				},
    				{
    					'title': 'Treere',
    					'v1': engine.points_detail[2],
    					'pot': engine.calculate_points(3),
    					'v2': 0
    				},
    				{
    					'title': 'Firere',
    					'v1': engine.points_detail[3],
    					'pot': engine.calculate_points(4),
    					'v2': 0
    				},
    				{
    					'title': 'Femere',
    					'v1': engine.points_detail[4],
    					'pot': engine.calculate_points(5),
    					'v2': 0
    				},
    				{
    					'title': 'Seksere',
    					'v1': engine.points_detail[5],
    					'pot': engine.calculate_points(6),
    					'v2': 0
    				},
    				{
    					'title': 'Liten Straight',
    					'v1': engine.points_detail[6],
    					'pot': engine.calculate_points('liten'),
    					'v2': 0
    				},
    				{
    					'title': 'Stor Straight',
    					'v1': engine.points_detail[7],
    					'pot': engine.calculate_points('stor'),
    					'v2': 0
    				},
    				{
    					'title': 'Hus',
    					'v1': engine.points_detail[8],
    					'pot': engine.calculate_points('hus'),
    					'v2': 0
    				},
    				{
    					'title': 'Sjanse',
    					'v1': engine.points_detail[9],
    					'pot': engine.calculate_points('sjanse'),
    					'v2': 0
    				},
    				{
    					'title': 'Yatzy',
    					'v1': engine.points_detail[10],
    					'pot': engine.calculate_points('yatzy'),
    					'v2': 0
    				},
    				{
    					'title': 'Totalsum',
    					'v1': engine.points,
    					'pot': 0,
    					'v2': 0
    				}
    			]);
    		}
    	};

    	$$invalidate(0, engine = new Engine(5));
    	return [engine, board, username, clicked, ferdig, click_handler, click_handler_1];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Login.svelte generated by Svelte v3.52.0 */

    const file = "src\\Login.svelte";

    function create_fragment$1(ctx) {
    	let div3;
    	let div1;
    	let div0;
    	let input;
    	let t0;
    	let button;
    	let t2;
    	let div2;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "Start";
    			t2 = space();
    			div2 = element("div");
    			img = element("img");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "maxlength", "12");
    			attr_dev(input, "id", "username");
    			attr_dev(input, "class", "field svelte-140ttas");
    			attr_dev(input, "placeholder", "Username");
    			add_location(input, file, 18, 12, 395);
    			attr_dev(button, "id", "btn");
    			attr_dev(button, "class", "svelte-140ttas");
    			add_location(button, file, 19, 12, 531);
    			attr_dev(div0, "class", "form svelte-140ttas");
    			add_location(div0, file, 17, 8, 363);
    			attr_dev(div1, "class", "left svelte-140ttas");
    			add_location(div1, file, 16, 4, 335);
    			attr_dev(img, "id", "rimg");
    			if (!src_url_equal(img.src, img_src_value = "media/login1.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-140ttas");
    			add_location(img, file, 23, 8, 650);
    			attr_dev(div2, "class", "right svelte-140ttas");
    			add_location(div2, file, 22, 4, 621);
    			attr_dev(div3, "class", "container svelte-140ttas");
    			add_location(div3, file, 15, 0, 306);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			append_dev(div0, t0);
    			append_dev(div0, button);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, img);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "keydown", /*keydown_handler*/ ctx[0], false, false, false),
    					listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function start() {
    	var username = document.getElementById("username").value;
    	sessionStorage.setItem("username", username);
    	window.location.href = "/game";
    }

    function pressed(event) {
    	if (event.key == 'Enter') start();
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Login', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	const keydown_handler = () => {
    		pressed(event);
    	};

    	const click_handler = () => start();
    	$$self.$capture_state = () => ({ start, pressed });
    	return [keydown_handler, click_handler];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.52.0 */

    function create_fragment(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*page*/ ctx[0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (switch_value !== (switch_value = /*page*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let page$1 = Login;
    	page("/", () => $$invalidate(0, page$1 = Login));
    	page("/game", () => $$invalidate(0, page$1 = Home));
    	page.start();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ router: page, Home, Login, page: page$1 });

    	$$self.$inject_state = $$props => {
    		if ('page' in $$props) $$invalidate(0, page$1 = $$props.page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page$1];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
