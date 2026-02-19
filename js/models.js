/**
 * NCLEX Prep Simulator - Data Models & Validation
 */
(function() {
  'use strict';

  var Utils = window.NCLEX.Utils;

  var QUESTION_TYPES = ['multiple-choice', 'select-all-that-apply', 'ordered-response', 'fill-in-the-blank'];
  var DIFFICULTIES = ['easy', 'medium', 'hard'];
  var SESSION_STATUSES = ['in-progress', 'completed', 'paused', 'abandoned'];

  function validateQuestion(q) {
    var errors = [];
    if (!q.id) errors.push('Missing id');
    if (!q.stem || q.stem.trim().length === 0) errors.push('Missing question stem');
    if (QUESTION_TYPES.indexOf(q.type) === -1) errors.push('Invalid type: ' + q.type);
    if (DIFFICULTIES.indexOf(q.difficulty) === -1) errors.push('Invalid difficulty: ' + q.difficulty);
    if (!q.category) errors.push('Missing category');
    if (!q.subcategory) errors.push('Missing subcategory');
    if (!q.rationale) errors.push('Missing rationale');

    if (q.type === 'fill-in-the-blank') {
      if (!q.correctAnswer && (!q.acceptableAnswers || q.acceptableAnswers.length === 0)) {
        errors.push('Fill-in-the-blank requires correctAnswer or acceptableAnswers');
      }
    } else if (q.type === 'ordered-response') {
      if (!q.options || q.options.length < 2) errors.push('Ordered-response needs at least 2 options');
      if (!q.correctOrder || q.correctOrder.length !== (q.options ? q.options.length : 0)) {
        errors.push('correctOrder must match options length');
      }
    } else {
      if (!q.options || q.options.length < 2) errors.push('Need at least 2 options');
      var hasCorrect = false;
      if (q.options) {
        for (var i = 0; i < q.options.length; i++) {
          if (q.options[i].isCorrect) hasCorrect = true;
        }
      }
      if (!hasCorrect) errors.push('At least one option must be correct');
    }

    return { valid: errors.length === 0, errors: errors };
  }

  function createQuestion(data) {
    var q = {
      id: data.id || Utils.generateUUID(),
      type: data.type || 'multiple-choice',
      difficulty: data.difficulty || 'medium',
      category: data.category || '',
      subcategory: data.subcategory || '',
      stem: data.stem || '',
      options: data.options || [],
      rationale: data.rationale || '',
      tags: data.tags || [],
      sources: data.sources || [],
      verified: data.verified || false,
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now()
    };
    if (data.type === 'ordered-response') {
      q.correctOrder = data.correctOrder || [];
    }
    if (data.type === 'fill-in-the-blank') {
      q.correctAnswer = data.correctAnswer || '';
      q.acceptableAnswers = data.acceptableAnswers || [];
      q.unit = data.unit || '';
    }
    return q;
  }

  function createSession(data) {
    return {
      id: data.id || Utils.generateUUID(),
      mode: data.mode || 'standard',
      status: data.status || 'in-progress',
      questionCount: data.questionCount || 0,
      questionIds: data.questionIds || [],
      answers: data.answers || [],
      score: data.score || null,
      categoryScores: data.categoryScores || {},
      startedAt: data.startedAt || Date.now(),
      completedAt: data.completedAt || null,
      timeLimitSeconds: data.timeLimitSeconds || null,
      elapsedSeconds: data.elapsedSeconds || 0,
      currentIndex: data.currentIndex || 0,
      flaggedQuestions: data.flaggedQuestions || [],
      showRationale: data.showRationale != null ? data.showRationale : false,
      focusedCategories: data.focusedCategories || [],
      config: data.config || {}
    };
  }

  function createAnswer(data) {
    return {
      questionId: data.questionId || '',
      selectedOptions: data.selectedOptions || [],
      textAnswer: data.textAnswer || '',
      orderedAnswer: data.orderedAnswer || [],
      isCorrect: data.isCorrect != null ? data.isCorrect : false,
      timeSpentSeconds: data.timeSpentSeconds || 0,
      answeredAt: data.answeredAt || Date.now(),
      flagged: data.flagged || false
    };
  }

  function createUserProfile(data) {
    data = data || {};
    return {
      id: data.id || 'default-user',
      name: data.name || '',
      createdAt: data.createdAt || Date.now(),
      settings: data.settings || {
        defaultQuestionCount: 75,
        defaultTimeLimit: 300,
        showRationaleImmediately: false,
        theme: 'light',
        fontSize: 'medium'
      },
      stats: data.stats || {
        totalTests: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastTestDate: null
      }
    };
  }

  window.NCLEX.Models = {
    QUESTION_TYPES: QUESTION_TYPES,
    DIFFICULTIES: DIFFICULTIES,
    SESSION_STATUSES: SESSION_STATUSES,
    validateQuestion: validateQuestion,
    createQuestion: createQuestion,
    createSession: createSession,
    createAnswer: createAnswer,
    createUserProfile: createUserProfile
  };
})();
