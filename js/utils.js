/**
 * NCLEX Prep Simulator - Utility Functions
 */
(function() {
  'use strict';

  window.NCLEX = window.NCLEX || {};

  window.NCLEX.Utils = {
    generateUUID: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },

    formatDate: function(timestamp) {
      if (!timestamp) return 'N/A';
      var d = new Date(timestamp);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    },

    formatDateTime: function(timestamp) {
      if (!timestamp) return 'N/A';
      var d = new Date(timestamp);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    },

    formatTime: function(seconds) {
      if (seconds == null || seconds < 0) return '00:00';
      var h = Math.floor(seconds / 3600);
      var m = Math.floor((seconds % 3600) / 60);
      var s = Math.floor(seconds % 60);
      var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
      if (h > 0) {
        return h + ':' + pad(m) + ':' + pad(s);
      }
      return pad(m) + ':' + pad(s);
    },

    formatPercent: function(value, decimals) {
      if (value == null || isNaN(value)) return '0%';
      decimals = decimals != null ? decimals : 0;
      return (value * 100).toFixed(decimals) + '%';
    },

    formatPercentFromNumber: function(value, decimals) {
      if (value == null || isNaN(value)) return '0%';
      decimals = decimals != null ? decimals : 0;
      return value.toFixed(decimals) + '%';
    },

    debounce: function(fn, delay) {
      var timer = null;
      return function() {
        var context = this;
        var args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function() {
          fn.apply(context, args);
        }, delay);
      };
    },

    deepClone: function(obj) {
      if (obj === null || typeof obj !== 'object') return obj;
      try {
        return JSON.parse(JSON.stringify(obj));
      } catch (e) {
        return obj;
      }
    },

    shuffleArray: function(arr) {
      var shuffled = arr.slice();
      for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
      }
      return shuffled;
    },

    escapeHTML: function(str) {
      if (!str) return '';
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },

    clamp: function(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },

    average: function(arr) {
      if (!arr || arr.length === 0) return 0;
      var sum = 0;
      for (var i = 0; i < arr.length; i++) sum += arr[i];
      return sum / arr.length;
    },

    groupBy: function(arr, key) {
      var result = {};
      for (var i = 0; i < arr.length; i++) {
        var k = typeof key === 'function' ? key(arr[i]) : arr[i][key];
        if (!result[k]) result[k] = [];
        result[k].push(arr[i]);
      }
      return result;
    }
  };
})();
