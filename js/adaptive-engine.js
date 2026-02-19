/**
 * NCLEX Prep Simulator - Adaptive Learning Engine
 */
(function() {
  'use strict';

  var Utils = window.NCLEX.Utils;
  var DataStore = window.NCLEX.DataStore;
  var ScoringEngine = window.NCLEX.ScoringEngine;

  var AdaptiveLearningEngine = {
    /**
     * Full performance analysis
     * @param {number} windowSize - Number of recent sessions to analyze (0 = all)
     */
    analyzePerformance: function(windowSize) {
      return DataStore.getSessions().then(function(sessions) {
        var completed = sessions.filter(function(s) { return s.status === 'completed'; });
        if (completed.length === 0) return null;

        var w = windowSize || (completed.length >= 5 ? 3 : completed.length);
        var recent = completed.slice(-w);
        var categories = DataStore.getCategories();

        var profile = {
          sessionsAnalyzed: recent.length,
          totalSessions: completed.length,
          categoryAnalysis: {},
          trends: {},
          difficultyReadiness: {},
          typeAnalysis: {},
          studyRecommendations: [],
          readinessScore: 0
        };

        // Category analysis
        var catStats = {};
        if (categories && categories.categories) {
          categories.categories.forEach(function(cat) {
            catStats[cat.id] = { name: cat.name, weight: cat.weight, correct: 0, total: 0, times: [] };
          });
        }

        recent.forEach(function(session) {
          session.answers.forEach(function(a) {
            var q = DataStore.getQuestionById(a.questionId);
            if (!q) return;
            if (!catStats[q.category]) {
              catStats[q.category] = { name: q.category, weight: 0, correct: 0, total: 0, times: [] };
            }
            catStats[q.category].total++;
            if (a.isCorrect) catStats[q.category].correct++;
            catStats[q.category].times.push(a.timeSpentSeconds || 0);
          });
        });

        for (var catId in catStats) {
          var cs = catStats[catId];
          var accuracy = cs.total > 0 ? (cs.correct / cs.total) * 100 : 0;
          var priority = AdaptiveLearningEngine.calculateCategoryPriority(accuracy, cs.weight, cs.total);

          profile.categoryAnalysis[catId] = {
            name: cs.name,
            weight: cs.weight,
            accuracy: accuracy,
            total: cs.total,
            correct: cs.correct,
            avgTime: cs.times.length > 0 ? Utils.average(cs.times) : 0,
            priority: priority,
            level: accuracy === 0 && cs.total === 0 ? 'untested' :
                   accuracy >= 80 ? 'mastered' :
                   accuracy >= 70 ? 'strong' :
                   accuracy >= 60 ? 'moderate' :
                   accuracy >= 45 ? 'weak' : 'critical'
          };
        }

        // Trends (score over sessions)
        var scores = completed.map(function(s) {
          var c = 0;
          s.answers.forEach(function(a) { if (a.isCorrect) c++; });
          return s.answers.length > 0 ? (c / s.answers.length) * 100 : 0;
        });
        profile.trends = {
          scores: scores,
          direction: scores.length >= 2 ? (scores[scores.length - 1] > scores[scores.length - 2] ? 'improving' : scores[scores.length - 1] < scores[scores.length - 2] ? 'declining' : 'stable') : 'insufficient',
          recentAvg: scores.length >= 3 ? Utils.average(scores.slice(-3)) : Utils.average(scores)
        };

        // Difficulty readiness
        var diffStats = { easy: { c: 0, t: 0 }, medium: { c: 0, t: 0 }, hard: { c: 0, t: 0 } };
        recent.forEach(function(session) {
          session.answers.forEach(function(a) {
            var q = DataStore.getQuestionById(a.questionId);
            if (!q || !diffStats[q.difficulty]) return;
            diffStats[q.difficulty].t++;
            if (a.isCorrect) diffStats[q.difficulty].c++;
          });
        });
        for (var diff in diffStats) {
          profile.difficultyReadiness[diff] = {
            accuracy: diffStats[diff].t > 0 ? (diffStats[diff].c / diffStats[diff].t) * 100 : 0,
            total: diffStats[diff].t
          };
        }

        // Type analysis
        var typeStats = {};
        recent.forEach(function(session) {
          session.answers.forEach(function(a) {
            var q = DataStore.getQuestionById(a.questionId);
            if (!q) return;
            if (!typeStats[q.type]) typeStats[q.type] = { c: 0, t: 0 };
            typeStats[q.type].t++;
            if (a.isCorrect) typeStats[q.type].c++;
          });
        });
        for (var type in typeStats) {
          profile.typeAnalysis[type] = {
            accuracy: typeStats[type].t > 0 ? (typeStats[type].c / typeStats[type].t) * 100 : 0,
            total: typeStats[type].t
          };
        }

        // Study recommendations
        profile.studyRecommendations = AdaptiveLearningEngine.generateStudyPlan(profile.categoryAnalysis);

        // Readiness score
        profile.readinessScore = AdaptiveLearningEngine.getReadinessScore(profile, completed);

        return profile;
      });
    },

    /**
     * Priority = (100 - accuracy) * nclexWeight * recencyFactor, 2x for critical
     */
    calculateCategoryPriority: function(accuracy, weight, totalAnswered) {
      var base = (100 - accuracy) * (weight / 100);
      var recencyFactor = totalAnswered > 0 ? 1 : 1.5; // Untested gets a boost
      var critical = accuracy < 45 && totalAnswered > 0 ? 2 : 1;
      return base * recencyFactor * critical;
    },

    /**
     * Generate study plan: tiered recommendations
     */
    generateStudyPlan: function(categoryAnalysis) {
      var recs = [];

      var entries = Object.entries(categoryAnalysis);
      entries.sort(function(a, b) { return b[1].priority - a[1].priority; });

      entries.forEach(function(entry) {
        var id = entry[0];
        var data = entry[1];
        var tier, action, questionCount;

        if (data.level === 'critical' || data.level === 'weak') {
          tier = 'Focus';
          action = 'Intensive practice needed';
          questionCount = 20;
        } else if (data.level === 'moderate') {
          tier = 'Review';
          action = 'Regular review recommended';
          questionCount = 10;
        } else if (data.level === 'untested') {
          tier = 'Explore';
          action = 'Start practicing this area';
          questionCount = 15;
        } else {
          tier = 'Maintain';
          action = 'Periodic review to maintain';
          questionCount = 5;
        }

        recs.push({
          categoryId: id,
          categoryName: data.name,
          tier: tier,
          action: action,
          accuracy: Math.round(data.accuracy),
          suggestedQuestions: questionCount,
          priority: data.priority
        });
      });

      return recs;
    },

    /**
     * Recommend next test configuration
     */
    getNextTestRecommendation: function() {
      return this.analyzePerformance().then(function(profile) {
        if (!profile) {
          return {
            mode: 'standard',
            questionCount: 25,
            reasoning: 'Start with a standard test to establish baseline performance.'
          };
        }

        var weakCats = Object.entries(profile.categoryAnalysis).filter(function(e) {
          return e[1].level === 'weak' || e[1].level === 'critical';
        });

        var untestedCats = Object.entries(profile.categoryAnalysis).filter(function(e) {
          return e[1].level === 'untested';
        });

        if (weakCats.length >= 2) {
          return {
            mode: 'adaptive',
            questionCount: 50,
            reasoning: 'Multiple weak areas detected. Adaptive mode will target: ' +
              weakCats.map(function(e) { return e[1].name; }).join(', ') + '.'
          };
        }

        if (weakCats.length === 1) {
          return {
            mode: 'focused',
            questionCount: 25,
            categories: [weakCats[0][0]],
            reasoning: 'Focus on your weakest area: ' + weakCats[0][1].name +
              ' (' + Math.round(weakCats[0][1].accuracy) + '% accuracy).'
          };
        }

        if (untestedCats.length > 0) {
          return {
            mode: 'standard',
            questionCount: 50,
            reasoning: 'Good progress! Standard mode to cover untested areas: ' +
              untestedCats.map(function(e) { return e[1].name; }).join(', ') + '.'
          };
        }

        var avgScore = profile.trends.recentAvg;
        if (avgScore >= 75) {
          return {
            mode: 'standard',
            questionCount: 75,
            reasoning: 'Strong performance! Try a full-length practice test to build stamina.'
          };
        }

        return {
          mode: 'adaptive',
          questionCount: 50,
          reasoning: 'Adaptive mode will optimize your practice based on recent performance.'
        };
      });
    },

    /**
     * Detect patterns (returns null if < 3 sessions)
     */
    detectPatterns: function() {
      return DataStore.getSessions().then(function(sessions) {
        var completed = sessions.filter(function(s) { return s.status === 'completed'; });
        if (completed.length < 3) return null;

        var patterns = [];

        // Fatigue: accuracy drop after question 50
        var fatigueSessions = 0;
        completed.slice(-3).forEach(function(s) {
          if (s.answers.length < 50) return;
          var first50 = s.answers.slice(0, 50);
          var after50 = s.answers.slice(50);
          var firstAcc = first50.filter(function(a) { return a.isCorrect; }).length / first50.length;
          var afterAcc = after50.filter(function(a) { return a.isCorrect; }).length / after50.length;
          if (afterAcc < firstAcc - 0.1) fatigueSessions++;
        });

        if (fatigueSessions >= 2) {
          patterns.push({
            type: 'fatigue',
            message: 'Your accuracy tends to drop after question 50. Consider taking shorter tests or taking breaks.'
          });
        }

        // Speed vs accuracy
        var fastWrong = 0;
        var fastTotal = 0;
        completed.slice(-3).forEach(function(s) {
          s.answers.forEach(function(a) {
            if (a.timeSpentSeconds < 15) {
              fastTotal++;
              if (!a.isCorrect) fastWrong++;
            }
          });
        });

        if (fastTotal > 10 && fastWrong / fastTotal > 0.5) {
          patterns.push({
            type: 'speed-accuracy',
            message: 'You tend to rush answers. Questions answered in under 15 seconds have a ' +
              Math.round((fastWrong / fastTotal) * 100) + '% error rate.'
          });
        }

        // Type weakness
        var typeStats = {};
        completed.slice(-3).forEach(function(s) {
          s.answers.forEach(function(a) {
            var q = DataStore.getQuestionById(a.questionId);
            if (!q) return;
            if (!typeStats[q.type]) typeStats[q.type] = { c: 0, t: 0 };
            typeStats[q.type].t++;
            if (a.isCorrect) typeStats[q.type].c++;
          });
        });

        var typeLabels = {
          'select-all-that-apply': 'Select All That Apply (SATA)',
          'ordered-response': 'Ordered Response',
          'fill-in-the-blank': 'Fill in the Blank'
        };

        for (var type in typeStats) {
          if (typeStats[type].t >= 3 && typeStats[type].c / typeStats[type].t < 0.5) {
            patterns.push({
              type: 'type-weakness',
              message: 'Low accuracy on ' + (typeLabels[type] || type) + ' questions (' +
                Math.round((typeStats[type].c / typeStats[type].t) * 100) + '%). Practice these question formats.'
            });
          }
        }

        return patterns.length > 0 ? patterns : null;
      });
    },

    /**
     * Composite readiness score 0-100
     * 40% accuracy, 25% coverage, 20% consistency, 15% trend
     */
    getReadinessScore: function(profile, completedSessions) {
      if (!profile || !completedSessions || completedSessions.length === 0) return 0;

      // Accuracy component (40%)
      var recentAvg = profile.trends.recentAvg || 0;
      var accuracyScore = Math.min(recentAvg / 100, 1) * 40;

      // Coverage component (25%) - how many categories tested
      var totalCats = Object.keys(profile.categoryAnalysis).length;
      var testedCats = Object.values(profile.categoryAnalysis).filter(function(c) { return c.total > 0; }).length;
      var coverageScore = totalCats > 0 ? (testedCats / totalCats) * 25 : 0;

      // Consistency component (20%) - low variance in scores
      var scores = profile.trends.scores || [];
      var consistencyScore = 0;
      if (scores.length >= 2) {
        var variance = 0;
        var avg = Utils.average(scores);
        scores.forEach(function(s) { variance += (s - avg) * (s - avg); });
        variance = Math.sqrt(variance / scores.length);
        // Low variance = high consistency. Max 20 when stdev < 5, 0 when stdev > 20
        consistencyScore = Math.max(0, (1 - variance / 20)) * 20;
      } else if (scores.length === 1) {
        consistencyScore = 10;
      }

      // Trend component (15%)
      var trendScore = 0;
      if (scores.length >= 2) {
        var lastDelta = scores[scores.length - 1] - scores[scores.length - 2];
        trendScore = Utils.clamp((lastDelta + 10) / 20, 0, 1) * 15;
      } else {
        trendScore = 7.5;
      }

      var total = Math.round(accuracyScore + coverageScore + consistencyScore + trendScore);
      return Utils.clamp(total, 0, 100);
    },

    /**
     * Classify readiness
     */
    classifyReadiness: function(score) {
      if (score >= 75) return { label: 'Likely to Pass', color: 'success' };
      if (score >= 60) return { label: 'Borderline', color: 'warning' };
      return { label: 'Not Ready', color: 'error' };
    }
  };

  window.NCLEX.AdaptiveLearningEngine = AdaptiveLearningEngine;
})();
