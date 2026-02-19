/**
 * NCLEX Prep Simulator - Question Bank Manager
 */
(function() {
  'use strict';

  var Utils = window.NCLEX.Utils;
  var Models = window.NCLEX.Models;
  var DataStore = window.NCLEX.DataStore;

  var QuestionBankManager = {
    loadQuestions: function(filters) {
      return DataStore.getQuestions(filters);
    },

    getByCategory: function(category) {
      return DataStore.getQuestions({ category: category });
    },

    getByDifficulty: function(difficulty) {
      return DataStore.getQuestions({ difficulty: difficulty });
    },

    getByType: function(type) {
      return DataStore.getQuestions({ type: type });
    },

    searchQuestions: function(term) {
      return DataStore.getQuestions({ search: term });
    },

    getQuestionStats: function() {
      return DataStore.getQuestions().then(function(questions) {
        var stats = {
          total: questions.length,
          byCategory: {},
          byDifficulty: { easy: 0, medium: 0, hard: 0 },
          byType: {}
        };

        var categories = DataStore.getCategories();
        if (categories && categories.categories) {
          categories.categories.forEach(function(cat) {
            stats.byCategory[cat.id] = { name: cat.name, count: 0, weight: cat.weight };
          });
        }

        Models.QUESTION_TYPES.forEach(function(t) { stats.byType[t] = 0; });

        questions.forEach(function(q) {
          if (stats.byCategory[q.category]) {
            stats.byCategory[q.category].count++;
          } else {
            stats.byCategory[q.category] = { name: q.category, count: 1, weight: 0 };
          }
          if (stats.byDifficulty.hasOwnProperty(q.difficulty)) {
            stats.byDifficulty[q.difficulty]++;
          }
          stats.byType[q.type] = (stats.byType[q.type] || 0) + 1;
        });

        return stats;
      });
    },

    addQuestion: function(data) {
      var q = Models.createQuestion(data);
      var validation = Models.validateQuestion(q);
      if (!validation.valid) {
        return Promise.reject({ errors: validation.errors });
      }
      return DataStore.saveQuestion(q);
    },

    updateQuestion: function(id, data) {
      var existing = DataStore.getQuestionById(id);
      if (!existing) return Promise.reject({ errors: ['Question not found'] });
      var updated = Object.assign({}, existing, data, { id: id, updatedAt: Date.now() });
      var validation = Models.validateQuestion(updated);
      if (!validation.valid) {
        return Promise.reject({ errors: validation.errors });
      }
      return DataStore.saveQuestion(updated);
    },

    addBulkQuestions: function(questionsArray) {
      return DataStore.importQuestions(questionsArray);
    },

    removeQuestion: function(id) {
      return DataStore.removeQuestion(id);
    },

    exportQuestions: function() {
      return DataStore.getQuestions().then(function(questions) {
        return questions.map(function(q) {
          var exported = Utils.deepClone(q);
          delete exported.createdAt;
          delete exported.updatedAt;
          return exported;
        });
      });
    }
  };

  window.NCLEX.QuestionBankManager = QuestionBankManager;
})();
