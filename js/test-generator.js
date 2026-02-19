/**
 * NCLEX Prep Simulator - Test Generator (4 modes)
 */
(function() {
  'use strict';

  var Utils = window.NCLEX.Utils;
  var DataStore = window.NCLEX.DataStore;

  var TestGenerator = {
    /**
     * Generate a test with the given configuration.
     * @param {Object} config - { mode, questionCount, categories, timeLimitMinutes }
     * mode: 'standard' | 'adaptive' | 'focused' | 'random'
     */
    generate: function(config) {
      var self = this;
      config = config || {};
      var mode = config.mode || 'standard';
      var requestedCount = config.questionCount || 75;

      return DataStore.getQuestions().then(function(allQuestions) {
        if (allQuestions.length === 0) {
          return Promise.reject({ error: 'No questions available' });
        }

        return DataStore.getSessions().then(function(sessions) {
          var recentIds = self._getRecentQuestionIds(sessions, 2);
          var available = allQuestions.filter(function(q) {
            return recentIds.indexOf(q.id) === -1;
          });

          // Fallback: if filtering removes too many, relax no-repeat
          if (available.length < Math.min(requestedCount, allQuestions.length * 0.5)) {
            available = allQuestions.slice();
          }

          var count = Math.min(requestedCount, available.length);
          var selected;

          switch (mode) {
            case 'adaptive':
              selected = self._generateAdaptive(available, count, sessions);
              break;
            case 'focused':
              selected = self._generateFocused(available, count, config.categories || []);
              break;
            case 'random':
              selected = Utils.shuffleArray(available).slice(0, count);
              break;
            default:
              selected = self._generateStandard(available, count);
          }

          return {
            questions: selected,
            questionIds: selected.map(function(q) { return q.id; }),
            count: selected.length,
            mode: mode,
            config: config
          };
        });
      });
    },

    /**
     * Standard mode: NCLEX-weighted distribution, difficulty mix 30/50/20
     */
    _generateStandard: function(available, count) {
      var categories = DataStore.getCategories();
      if (!categories) return Utils.shuffleArray(available).slice(0, count);

      var selected = [];
      var usedIds = {};

      // Target distribution by category weight
      var catTargets = this._buildCategoryTargets(categories, count);

      // Difficulty mix: 30% easy, 50% medium, 20% hard
      var diffMix = { easy: 0.3, medium: 0.5, hard: 0.2 };

      catTargets.forEach(function(target) {
        var pool = available.filter(function(q) {
          return q.category === target.id && !usedIds[q.id];
        });

        var catCount = Math.min(target.count, pool.length);
        var easyCount = Math.round(catCount * diffMix.easy);
        var hardCount = Math.round(catCount * diffMix.hard);
        var medCount = catCount - easyCount - hardCount;

        var pick = function(diff, num) {
          var matching = pool.filter(function(q) { return q.difficulty === diff && !usedIds[q.id]; });
          var picked = Utils.shuffleArray(matching).slice(0, num);
          picked.forEach(function(q) { usedIds[q.id] = true; selected.push(q); });
          return picked.length;
        };

        var pickedEasy = pick('easy', easyCount);
        var pickedMed = pick('medium', medCount);
        var pickedHard = pick('hard', hardCount);

        // Fill remaining from any difficulty
        var remaining = catCount - pickedEasy - pickedMed - pickedHard;
        if (remaining > 0) {
          var leftovers = pool.filter(function(q) { return !usedIds[q.id]; });
          Utils.shuffleArray(leftovers).slice(0, remaining).forEach(function(q) {
            usedIds[q.id] = true;
            selected.push(q);
          });
        }
      });

      // Fill to count from any remaining
      if (selected.length < count) {
        var remaining = available.filter(function(q) { return !usedIds[q.id]; });
        Utils.shuffleArray(remaining).slice(0, count - selected.length).forEach(function(q) {
          selected.push(q);
        });
      }

      return Utils.shuffleArray(selected);
    },

    /**
     * Adaptive mode: target weak areas
     */
    _generateAdaptive: function(available, count, sessions) {
      var completed = sessions.filter(function(s) { return s.status === 'completed'; });
      if (completed.length < 1) {
        return this._generateStandard(available, count);
      }

      var weakAreas = this.getWeakAreas(completed);
      var selected = [];
      var usedIds = {};

      // 50% weak/critical, 30% standard, 20% untested
      var weakCount = Math.round(count * 0.5);
      var standardCount = Math.round(count * 0.3);
      var untestedCount = count - weakCount - standardCount;

      var pick = function(pool, num) {
        var shuffled = Utils.shuffleArray(pool.filter(function(q) { return !usedIds[q.id]; }));
        var picked = shuffled.slice(0, num);
        picked.forEach(function(q) { usedIds[q.id] = true; selected.push(q); });
        return picked.length;
      };

      // Weak categories (shift difficulty easier)
      var weakCats = Object.keys(weakAreas).filter(function(c) {
        return weakAreas[c].level === 'weak' || weakAreas[c].level === 'critical';
      });
      var weakPool = available.filter(function(q) { return weakCats.indexOf(q.category) !== -1; });
      // Prefer easier questions in weak areas
      weakPool.sort(function(a, b) {
        var order = { easy: 0, medium: 1, hard: 2 };
        return (order[a.difficulty] || 1) - (order[b.difficulty] || 1);
      });
      var weakPicked = 0;
      weakPool.forEach(function(q) {
        if (weakPicked >= weakCount || usedIds[q.id]) return;
        usedIds[q.id] = true; selected.push(q); weakPicked++;
      });

      // Untested categories
      var untestedCats = Object.keys(weakAreas).filter(function(c) { return weakAreas[c].level === 'untested'; });
      var untestedPool = available.filter(function(q) { return untestedCats.indexOf(q.category) !== -1; });
      pick(untestedPool, untestedCount);

      // Standard fill
      pick(available, count - selected.length);

      return Utils.shuffleArray(selected);
    },

    /**
     * Focused mode: user-selected categories only
     */
    _generateFocused: function(available, count, categories) {
      if (!categories || categories.length === 0) {
        return Utils.shuffleArray(available).slice(0, count);
      }

      var pool = available.filter(function(q) {
        return categories.indexOf(q.category) !== -1;
      });

      if (pool.length === 0) {
        return Utils.shuffleArray(available).slice(0, count);
      }

      // Apply difficulty mix
      var diffMix = { easy: 0.3, medium: 0.5, hard: 0.2 };
      var selected = [];
      var usedIds = {};
      var targetCount = Math.min(count, pool.length);

      ['easy', 'medium', 'hard'].forEach(function(diff) {
        var num = Math.round(targetCount * diffMix[diff]);
        var matching = pool.filter(function(q) { return q.difficulty === diff && !usedIds[q.id]; });
        Utils.shuffleArray(matching).slice(0, num).forEach(function(q) {
          usedIds[q.id] = true; selected.push(q);
        });
      });

      // Fill remaining
      if (selected.length < targetCount) {
        pool.filter(function(q) { return !usedIds[q.id]; }).forEach(function(q) {
          if (selected.length >= targetCount) return;
          selected.push(q);
        });
      }

      return Utils.shuffleArray(selected);
    },

    /**
     * Analyze weak areas from completed sessions
     * Rolling window: tests 1-4 = cumulative, 5+ = last 3
     */
    getWeakAreas: function(completedSessions) {
      if (!completedSessions || completedSessions.length === 0) return {};

      var windowSize = completedSessions.length >= 5 ? 3 : completedSessions.length;
      var recent = completedSessions.slice(-windowSize);

      var categories = DataStore.getCategories();
      var catIds = [];
      if (categories && categories.categories) {
        catIds = categories.categories.map(function(c) { return c.id; });
      }

      var catStats = {};
      catIds.forEach(function(id) { catStats[id] = { total: 0, correct: 0 }; });

      recent.forEach(function(session) {
        if (!session.answers) return;
        session.answers.forEach(function(answer) {
          var q = DataStore.getQuestionById(answer.questionId);
          if (!q) return;
          if (!catStats[q.category]) catStats[q.category] = { total: 0, correct: 0 };
          catStats[q.category].total++;
          if (answer.isCorrect) catStats[q.category].correct++;
        });
      });

      var result = {};
      catIds.forEach(function(id) {
        var stats = catStats[id];
        if (!stats || stats.total === 0) {
          result[id] = { level: 'untested', accuracy: 0, total: 0 };
          return;
        }
        var accuracy = (stats.correct / stats.total) * 100;
        var level;
        if (accuracy >= 80) level = 'mastered';
        else if (accuracy >= 70) level = 'strong';
        else if (accuracy >= 60) level = 'moderate';
        else if (accuracy >= 45) level = 'weak';
        else level = 'critical';

        result[id] = { level: level, accuracy: accuracy, total: stats.total, correct: stats.correct };
      });

      return result;
    },

    /**
     * Build category targets based on NCLEX weights
     */
    _buildCategoryTargets: function(categories, totalCount) {
      var targets = [];
      if (!categories || !categories.categories) return targets;

      var totalWeight = 0;
      categories.categories.forEach(function(c) { totalWeight += c.weight; });

      categories.categories.forEach(function(cat) {
        targets.push({
          id: cat.id,
          name: cat.name,
          count: Math.max(1, Math.round((cat.weight / totalWeight) * totalCount))
        });
      });

      return targets;
    },

    /**
     * Get question IDs from last N tests (no-repeat)
     */
    _getRecentQuestionIds: function(sessions, n) {
      var completed = sessions.filter(function(s) { return s.status === 'completed'; });
      var recent = completed.slice(-n);
      var ids = [];
      recent.forEach(function(s) {
        if (s.questionIds) ids = ids.concat(s.questionIds);
      });
      return ids;
    },

    /**
     * Get test preview/summary before generating
     */
    getTestSummary: function(config) {
      return DataStore.getQuestions().then(function(all) {
        var categories = DataStore.getCategories();
        var requestedCount = config.questionCount || 75;
        var availableCount = all.length;
        var willCap = requestedCount > availableCount;

        var summary = {
          requestedCount: requestedCount,
          availableCount: availableCount,
          actualCount: Math.min(requestedCount, availableCount),
          willCap: willCap,
          mode: config.mode || 'standard',
          categoryCoverage: {}
        };

        if (categories && categories.categories) {
          categories.categories.forEach(function(cat) {
            var catQuestions = all.filter(function(q) { return q.category === cat.id; });
            summary.categoryCoverage[cat.id] = {
              name: cat.name,
              available: catQuestions.length,
              weight: cat.weight
            };
          });
        }

        return summary;
      });
    }
  };

  window.NCLEX.TestGenerator = TestGenerator;
})();
