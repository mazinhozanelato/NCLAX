/**
 * NCLEX Prep Simulator - DataStore (localStorage CRUD with cache)
 */
(function() {
  'use strict';

  var Utils = window.NCLEX.Utils;
  var Models = window.NCLEX.Models;

  var KEYS = {
    QUESTIONS: 'nclex_questions',
    SESSIONS: 'nclex_sessions',
    PROFILE: 'nclex_profile',
    CATEGORIES: 'nclex_categories',
    ACTIVE_SESSION: 'nclex_active_session',
    INITIALIZED: 'nclex_initialized'
  };

  var cache = {
    questions: null,
    sessions: null,
    profile: null,
    categories: null
  };

  function safeSetItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.error('localStorage quota exceeded');
        if (window.NCLEX.Events) {
          window.NCLEX.Events.emit('storage-error', { message: 'Storage is full. Consider exporting and clearing old data.' });
        }
      }
      return false;
    }
  }

  function safeGetItem(key) {
    try {
      var item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Error reading localStorage key: ' + key, e);
      return null;
    }
  }

  var DataStore = {
    initDB: function() {
      return new Promise(function(resolve, reject) {
        var isInitialized = localStorage.getItem(KEYS.INITIALIZED);

        if (isInitialized) {
          cache.questions = safeGetItem(KEYS.QUESTIONS) || [];
          cache.sessions = safeGetItem(KEYS.SESSIONS) || [];
          cache.profile = safeGetItem(KEYS.PROFILE) || Models.createUserProfile();
          cache.categories = safeGetItem(KEYS.CATEGORIES) || null;
          console.log('DataStore: Loaded from localStorage (' + cache.questions.length + ' questions, ' + cache.sessions.length + ' sessions)');
          resolve();
          return;
        }

        var questionsLoaded = false;
        var categoriesLoaded = false;
        var errors = [];

        function checkDone() {
          if (questionsLoaded && categoriesLoaded) {
            if (errors.length > 0) {
              console.warn('DataStore: Initialized with errors:', errors);
            }
            cache.sessions = [];
            cache.profile = Models.createUserProfile();
            safeSetItem(KEYS.SESSIONS, cache.sessions);
            safeSetItem(KEYS.PROFILE, cache.profile);
            localStorage.setItem(KEYS.INITIALIZED, 'true');
            console.log('DataStore: Seeded from JSON files (' + cache.questions.length + ' questions)');
            resolve();
          }
        }

        fetch('data/question-bank.json')
          .then(function(res) { return res.json(); })
          .then(function(data) {
            cache.questions = data.map(function(q) { return Models.createQuestion(q); });
            safeSetItem(KEYS.QUESTIONS, cache.questions);
            questionsLoaded = true;
            checkDone();
          })
          .catch(function(err) {
            console.error('Failed to load question-bank.json:', err);
            errors.push('questions');
            cache.questions = [];
            safeSetItem(KEYS.QUESTIONS, cache.questions);
            questionsLoaded = true;
            checkDone();
          });

        fetch('data/categories-config.json')
          .then(function(res) { return res.json(); })
          .then(function(data) {
            cache.categories = data;
            safeSetItem(KEYS.CATEGORIES, cache.categories);
            categoriesLoaded = true;
            checkDone();
          })
          .catch(function(err) {
            console.error('Failed to load categories-config.json:', err);
            errors.push('categories');
            cache.categories = null;
            categoriesLoaded = true;
            checkDone();
          });
      });
    },

    // Questions
    getQuestions: function(filters) {
      var questions = cache.questions || [];
      if (!filters) return Promise.resolve(questions.slice());

      var result = questions.filter(function(q) {
        if (filters.category && q.category !== filters.category) return false;
        if (filters.subcategory && q.subcategory !== filters.subcategory) return false;
        if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
        if (filters.type && q.type !== filters.type) return false;
        if (filters.ids && filters.ids.indexOf(q.id) === -1) return false;
        if (filters.excludeIds && filters.excludeIds.indexOf(q.id) !== -1) return false;
        if (filters.search) {
          var term = filters.search.toLowerCase();
          var inStem = q.stem.toLowerCase().indexOf(term) !== -1;
          var inTags = q.tags && q.tags.some(function(t) { return t.toLowerCase().indexOf(term) !== -1; });
          if (!inStem && !inTags) return false;
        }
        return true;
      });

      return Promise.resolve(result);
    },

    getQuestionById: function(id) {
      var questions = cache.questions || [];
      for (var i = 0; i < questions.length; i++) {
        if (questions[i].id === id) return questions[i];
      }
      return null;
    },

    saveQuestion: function(question) {
      var questions = cache.questions || [];
      var index = -1;
      for (var i = 0; i < questions.length; i++) {
        if (questions[i].id === question.id) { index = i; break; }
      }
      question.updatedAt = Date.now();
      if (index >= 0) {
        questions[index] = question;
      } else {
        questions.push(question);
      }
      cache.questions = questions;
      safeSetItem(KEYS.QUESTIONS, cache.questions);
      return Promise.resolve(question);
    },

    removeQuestion: function(id) {
      cache.questions = (cache.questions || []).filter(function(q) { return q.id !== id; });
      safeSetItem(KEYS.QUESTIONS, cache.questions);
      return Promise.resolve();
    },

    importQuestions: function(newQuestions) {
      var existing = cache.questions || [];
      var existingIds = {};
      for (var i = 0; i < existing.length; i++) existingIds[existing[i].id] = true;

      var added = 0;
      var skipped = 0;
      var errors = [];

      for (var j = 0; j < newQuestions.length; j++) {
        var q = Models.createQuestion(newQuestions[j]);
        var validation = Models.validateQuestion(q);
        if (!validation.valid) {
          errors.push({ index: j, id: q.id, errors: validation.errors });
          continue;
        }
        if (existingIds[q.id]) {
          skipped++;
          continue;
        }
        existing.push(q);
        existingIds[q.id] = true;
        added++;
      }

      cache.questions = existing;
      safeSetItem(KEYS.QUESTIONS, cache.questions);
      return Promise.resolve({ added: added, skipped: skipped, errors: errors });
    },

    // Sessions
    getSessions: function() {
      return Promise.resolve((cache.sessions || []).slice());
    },

    getSessionById: function(id) {
      var sessions = cache.sessions || [];
      for (var i = 0; i < sessions.length; i++) {
        if (sessions[i].id === id) return sessions[i];
      }
      return null;
    },

    saveSession: function(session) {
      var sessions = cache.sessions || [];
      var index = -1;
      for (var i = 0; i < sessions.length; i++) {
        if (sessions[i].id === session.id) { index = i; break; }
      }
      if (index >= 0) {
        sessions[index] = session;
      } else {
        sessions.push(session);
      }
      cache.sessions = sessions;
      safeSetItem(KEYS.SESSIONS, cache.sessions);
      return Promise.resolve(session);
    },

    // Active session (crash recovery)
    getActiveSession: function() {
      return safeGetItem(KEYS.ACTIVE_SESSION);
    },

    saveActiveSession: function(sessionState) {
      safeSetItem(KEYS.ACTIVE_SESSION, sessionState);
    },

    clearActiveSession: function() {
      localStorage.removeItem(KEYS.ACTIVE_SESSION);
    },

    // User profile
    getUserProfile: function() {
      return Promise.resolve(cache.profile || Models.createUserProfile());
    },

    updateUserProfile: function(updates) {
      var profile = cache.profile || Models.createUserProfile();
      for (var key in updates) {
        if (updates.hasOwnProperty(key)) {
          if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key])) {
            profile[key] = Object.assign({}, profile[key] || {}, updates[key]);
          } else {
            profile[key] = updates[key];
          }
        }
      }
      cache.profile = profile;
      safeSetItem(KEYS.PROFILE, cache.profile);
      return Promise.resolve(cache.profile);
    },

    // Categories config
    getCategories: function() {
      return cache.categories;
    },

    // Export / Import / Reset
    exportData: function() {
      return Promise.resolve({
        questions: cache.questions || [],
        sessions: cache.sessions || [],
        profile: cache.profile || {},
        categories: cache.categories || {},
        exportedAt: Date.now()
      });
    },

    importData: function(data) {
      if (data.questions) {
        cache.questions = data.questions;
        safeSetItem(KEYS.QUESTIONS, cache.questions);
      }
      if (data.sessions) {
        cache.sessions = data.sessions;
        safeSetItem(KEYS.SESSIONS, cache.sessions);
      }
      if (data.profile) {
        cache.profile = data.profile;
        safeSetItem(KEYS.PROFILE, cache.profile);
      }
      return Promise.resolve();
    },

    resetData: function() {
      cache.questions = [];
      cache.sessions = [];
      cache.profile = Models.createUserProfile();
      localStorage.removeItem(KEYS.QUESTIONS);
      localStorage.removeItem(KEYS.SESSIONS);
      localStorage.removeItem(KEYS.PROFILE);
      localStorage.removeItem(KEYS.ACTIVE_SESSION);
      localStorage.removeItem(KEYS.INITIALIZED);
      return this.initDB();
    }
  };

  window.NCLEX.DataStore = DataStore;
})();
