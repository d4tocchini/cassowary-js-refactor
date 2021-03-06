/**
 * Copyright 2011 Alex Russell <slightlyoff@google.com>.
 *
 * Use of this source code is governed by the LGPL, which can be found in the
 * COPYING.LGPL file.
 *
 * This is an API compatible re-implementation of the API of jshashtable needed
 * by Cassowary. It includes nothing more than what Cassowary was using and
 * contains no code from jshashset.
 *
 * Features removed:
 *
 *     - multiple values per key
 *     - error tollerent hashing of any variety
 *     - overly careful (or lazy) size counting, etc.
 *     - Crockford's "class" pattern. We use the system from c.js.
 *     - any attempt at back-compat with broken runtimes.
 *
 * APIs removed, mostly for lack of use in Cassowary:
 *     
 *     - support for custom hashing and equality functions as keys to ctor
 *     - isEmpty() -> check for !ht.size()
 *     - putAll()
 *     - entries()
 *     - containsKey()
 *     - containsValue()
 *     - keys()
 *     - values()
 *
 * Additions:
 *
 *     - new "scope" parameter to each() and escapingEach()
 */

(function(c) {
"use strict";

var keyCode = function(key) {
  var kc = (typeof key.hashCode == "function") ? key.hashCode() : key.toString();
  // var kc = key.toString();
  // console.log("keyCode:", key, kc);
  return kc;
};

var copyOwn = function(src, dest) {
  for (var x in src) {
    if (src.hasOwnProperty(x)) { dest[x] = src[x]; }
  }
}

c.HashTable = c.inherit({

  initialize: function() {
    this._size = 0;
    this._store = {};
    this._keyStrMap = {};
    this._keyList = [];
  },

  put: function(key, value) { 
    var hash = keyCode(key);

    var old = null;
    if (this._store.hasOwnProperty(hash)) {
      old = this._store[hash];
    } else {
      this._size++;
    }
    this._store[hash] = value;
    this._keyStrMap[hash] = key;
    if (this._keyList.indexOf(hash) == -1) {
      this._keyList.push(hash);
    }
    return old;
  },

  get: function(key) {
    if(!this._size) { return null; }

    key = keyCode(key);

    if (this._store.hasOwnProperty(key)) {
      return this._store[key];
    }
    return null;
  }, 

  clear: function() {
    this._size = 0;
    this._store = {};
    this._keyStrMap = {};
    this._keyList = [];
  }, 

  remove: function(key) {
    key = keyCode(key);
    if (!this._store.hasOwnProperty(key)) {
      return null;
    }

    var old = this._store[key];
    delete this._store[key];

    if (this._size > 0) {
      this._size--;
    }
    return old;
  },

  size: function() {
    return this._size;
  },

  each: function(callback, scope) {
    if (!this._size) { return; }

    this._keyList.forEach(function(k){
      if (this._store.hasOwnProperty(k)) {
        callback.call(scope||null, this._keyStrMap[k], this._store[k]);
      }
    }, this);
  },

  _escapingEachCallback: function(callback, scope, key, value) {
    var hash = keyCode(key);
    if (this._store.hasOwnProperty(hash)) {
      return callback.call(scope||null, hash, value);
    }
  },

  escapingEach: function(callback, scope) {
    if (!this._size) { return; }

    var that = this;
    var context = {};
    var kl = this._keyList.slice();
    for (var x = 0; x < kl.length; x++) {
      (function(v) {
        if (that._store.hasOwnProperty(v)) {
          context = callback.call(scope||null, that._keyStrMap[v], that._store[v]);
        }
      })(kl[x]);

      if (context) {
        if (context.retval !== undefined) {
          return context;
        }
        if (context.brk) {
          break;
        }
      }
    }
  },

  clone: function() {
    var n = new c.HashTable();
    if (this._size) {
      n._size = this._size;
      n._keyList = this._keyList.slice();
      copyOwn(this._store, n._store);
      copyOwn(this._keyStrMap, n._keyStrMap);
    }
    return n;
  }
});

})(c);
