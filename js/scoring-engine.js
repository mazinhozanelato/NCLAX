/**
 * NCLEX Prep Simulator - Scoring Engine
 */
(function() {
  'use strict';

  var Utils = window.NCLEX.Utils;
  var DataStore = window.NCLEX.DataStore;

  var ScoringEngine = {
    /**
     * Full evaluation of a completed test session
     */
    evaluateTest: function(session) {
      var categories = DataStore.getCategories();
      var answers = session.answers || [];
      var correct = 0;
      var totalTime = 0;

      var catBreakdown = {};
      var subBreakdown = {};
      var diffBreakdown = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
      var typeBreakdown = {};

      answers.forEach(function(a) {
        var q = DataStore.getQuestionById(a.questionId);
        if (!q) return;

        if (a.isCorrect) correct++;
        totalTime += a.timeSpentSeconds || 0;

        // Category
        if (!catBreakdown[q.category]) catBreakdown[q.category] = { correct: 0, total: 0, timeTotal: 0 };
        catBreakdown[q.category].total++;
        catBreakdown[q.category].timeTotal += a.timeSpentSeconds || 0;
        if (a.isCorrect) catBreakdown[q.category].correct++;

        // Subcategory
        if (!subBreakdown[q.subcategory]) subBreakdown[q.subcategory] = { correct: 0, total: 0 };
        subBreakdown[q.subcategory].total++;
        if (a.isCorrect) subBreakdown[q.subcategory].correct++;

        // Difficulty
        if (diffBreakdown[q.difficulty]) {
          diffBreakdown[q.difficulty].total++;
          if (a.isCorrect) diffBreakdown[q.difficulty].correct++;
        }

        // Type
        if (!typeBreakdown[q.type]) typeBreakdown[q.type] = { correct: 0, total: 0 };
        typeBreakdown[q.type].total++;
        if (a.isCorrect) typeBreakdown[q.type].correct++;
      });

      var overallScore = answers.length > 0 ? (correct / answers.length) * 100 : 0;
      var avgTimePerQuestion = answers.length > 0 ? totalTime / answers.length : 0;

      // Enrich category breakdown with names
      if (categories && categories.categories) {
        categories.categories.forEach(function(cat) {
          if (catBreakdown[cat.id]) {
            catBreakdown[cat.id].name = cat.name;
            catBreakdown[cat.id].weight = cat.weight;
            catBreakdown[cat.id].accuracy = catBreakdown[cat.id].total > 0
              ? (catBreakdown[cat.id].correct / catBreakdown[cat.id].total) * 100 : 0;
            catBreakdown[cat.id].avgTime = catBreakdown[cat.id].total > 0
              ? catBreakdown[cat.id].timeTotal / catBreakdown[cat.id].total : 0;
          }
          if (cat.subcategories) {
            cat.subcategories.forEach(function(sub) {
              if (subBreakdown[sub.id]) {
                subBreakdown[sub.id].name = sub.name;
                subBreakdown[sub.id].accuracy = subBreakdown[sub.id].total > 0
                  ? (subBreakdown[sub.id].correct / subBreakdown[sub.id].total) * 100 : 0;
              }
            });
          }
        });
      }

      return {
        sessionId: session.id,
        overallScore: overallScore,
        passed: overallScore >= 65,
        correct: correct,
        total: answers.length,
        elapsedSeconds: session.elapsedSeconds,
        avgTimePerQuestion: avgTimePerQuestion,
        categories: catBreakdown,
        subcategories: subBreakdown,
        difficulties: diffBreakdown,
        types: typeBreakdown
      };
    },

    /**
     * Compare with previous test
     */
    compareWithPrevious: function(currentSession) {
      return DataStore.getSessions().then(function(sessions) {
        var completed = sessions.filter(function(s) { return s.status === 'completed' && s.id !== currentSession.id; });
        if (completed.length === 0) return null;

        var prev = completed[completed.length - 1];
        var currentEval = ScoringEngine.evaluateTest(currentSession);
        var prevEval = ScoringEngine.evaluateTest(prev);

        return {
          scoreDelta: currentEval.overallScore - prevEval.overallScore,
          timeDelta: currentEval.avgTimePerQuestion - prevEval.avgTimePerQuestion,
          previousScore: prevEval.overallScore,
          currentScore: currentEval.overallScore,
          trend: currentEval.overallScore > prevEval.overallScore ? 'improving' :
                 currentEval.overallScore < prevEval.overallScore ? 'declining' : 'stable'
        };
      });
    },

    /**
     * Generate narrative report
     */
    generateReport: function(session) {
      var evaluation = this.evaluateTest(session);
      var parts = [];

      parts.push('You scored ' + Math.round(evaluation.overallScore) + '% (' + evaluation.correct + '/' + evaluation.total + ').');

      if (evaluation.passed) {
        parts.push('This is above the 65% passing threshold. Good job!');
      } else {
        parts.push('This is below the 65% passing threshold. Keep practicing!');
      }

      // Find strongest and weakest categories
      var catEntries = Object.entries(evaluation.categories);
      if (catEntries.length > 0) {
        catEntries.sort(function(a, b) { return b[1].accuracy - a[1].accuracy; });
        var strongest = catEntries[0];
        var weakest = catEntries[catEntries.length - 1];

        if (strongest[1].total > 0) {
          parts.push('Strongest area: ' + (strongest[1].name || strongest[0]) + ' at ' + Math.round(strongest[1].accuracy) + '%.');
        }
        if (weakest[1].total > 0 && catEntries.length > 1) {
          parts.push('Area for improvement: ' + (weakest[1].name || weakest[0]) + ' at ' + Math.round(weakest[1].accuracy) + '%.');
        }
      }

      parts.push('Average time per question: ' + Math.round(evaluation.avgTimePerQuestion) + ' seconds.');

      return parts.join(' ');
    },

    /**
     * Cumulative stats across all completed sessions
     */
    calculateCumulativeStats: function() {
      return DataStore.getSessions().then(function(sessions) {
        var completed = sessions.filter(function(s) { return s.status === 'completed'; });
        if (completed.length === 0) return null;

        var totalTests = completed.length;
        var totalQ = 0;
        var totalCorrect = 0;
        var scores = [];

        completed.forEach(function(s) {
          var correct = 0;
          s.answers.forEach(function(a) { if (a.isCorrect) correct++; });
          totalQ += s.answers.length;
          totalCorrect += correct;
          scores.push(s.answers.length > 0 ? (correct / s.answers.length) * 100 : 0);
        });

        return {
          totalTests: totalTests,
          totalQuestions: totalQ,
          totalCorrect: totalCorrect,
          overallAccuracy: totalQ > 0 ? (totalCorrect / totalQ) * 100 : 0,
          scores: scores,
          averageScore: Utils.average(scores),
          bestScore: Math.max.apply(null, scores),
          worstScore: Math.min.apply(null, scores),
          trend: scores.length >= 2 ? scores[scores.length - 1] - scores[scores.length - 2] : 0
        };
      });
    }
  };

  window.NCLEX.ScoringEngine = ScoringEngine;
})();
