/**
 * NCLEX Prep Simulator - Test Session Controller
 */
(function() {
  'use strict';

  var Utils = window.NCLEX.Utils;
  var Models = window.NCLEX.Models;
  var DataStore = window.NCLEX.DataStore;

  function TestSession(config) {
    this.session = Models.createSession({
      mode: config.mode,
      questionCount: config.questions.length,
      questionIds: config.questions.map(function(q) { return q.id; }),
      timeLimitSeconds: config.timeLimitMinutes ? config.timeLimitMinutes * 60 : null,
      showRationale: config.showRationale || false,
      focusedCategories: config.focusedCategories || [],
      config: config
    });

    this.questions = config.questions;
    this._timerRef = null;
    this._startWallTime = null;
    this._pausedElapsed = 0;
    this._questionStartTime = Date.now();
    this._active = true;
    this._paused = false;
    this._onTick = null;
    this._onTimeWarning = null;
    this._onTimeUp = null;
    this._warned5 = false;
    this._warned1 = false;
  }

  TestSession.prototype.startTest = function() {
    this._startWallTime = Date.now();
    this._pausedElapsed = 0;
    this._startTimer();
    this._saveState();
    return this.session;
  };

  TestSession.prototype.resumeFromState = function(savedState) {
    this.session = savedState.session;
    this.questions = savedState.questions;
    this._pausedElapsed = this.session.elapsedSeconds;
    this._startWallTime = Date.now();
    this._active = true;
    this._paused = false;
    this._questionStartTime = Date.now();
    this._startTimer();
    return this.session;
  };

  TestSession.prototype.getCurrentQuestion = function() {
    return this.questions[this.session.currentIndex] || null;
  };

  TestSession.prototype.getCurrentIndex = function() {
    return this.session.currentIndex;
  };

  TestSession.prototype.getQuestionCount = function() {
    return this.questions.length;
  };

  TestSession.prototype.submitAnswer = function(answerData) {
    var q = this.getCurrentQuestion();
    if (!q) return null;

    var timeSpent = (Date.now() - this._questionStartTime) / 1000;
    var isCorrect = this._evaluateAnswer(q, answerData);

    var answer = Models.createAnswer({
      questionId: q.id,
      selectedOptions: answerData.selectedOptions || [],
      textAnswer: answerData.textAnswer || '',
      orderedAnswer: answerData.orderedAnswer || [],
      isCorrect: isCorrect,
      timeSpentSeconds: Math.round(timeSpent),
      flagged: this.session.flaggedQuestions.indexOf(q.id) !== -1
    });

    // Replace or add answer
    var existingIdx = -1;
    for (var i = 0; i < this.session.answers.length; i++) {
      if (this.session.answers[i].questionId === q.id) { existingIdx = i; break; }
    }
    if (existingIdx >= 0) {
      this.session.answers[existingIdx] = answer;
    } else {
      this.session.answers.push(answer);
    }

    this._saveState();
    return answer;
  };

  TestSession.prototype._evaluateAnswer = function(question, answerData) {
    switch (question.type) {
      case 'multiple-choice': {
        var selected = answerData.selectedOptions || [];
        if (selected.length !== 1) return false;
        var correctOpt = question.options.find(function(o) { return o.isCorrect; });
        return correctOpt && selected[0] === correctOpt.id;
      }
      case 'select-all-that-apply': {
        var selected = (answerData.selectedOptions || []).slice().sort();
        var correct = question.options.filter(function(o) { return o.isCorrect; }).map(function(o) { return o.id; }).sort();
        if (selected.length !== correct.length) return false;
        for (var i = 0; i < selected.length; i++) {
          if (selected[i] !== correct[i]) return false;
        }
        return true;
      }
      case 'ordered-response': {
        var ordered = answerData.orderedAnswer || [];
        var correctOrder = question.correctOrder || [];
        if (ordered.length !== correctOrder.length) return false;
        for (var j = 0; j < ordered.length; j++) {
          if (ordered[j] !== correctOrder[j]) return false;
        }
        return true;
      }
      case 'fill-in-the-blank': {
        var text = (answerData.textAnswer || '').trim().toLowerCase();
        if (!text) return false;
        var acceptable = (question.acceptableAnswers || []).map(function(a) { return a.toLowerCase().trim(); });
        if (question.correctAnswer) acceptable.push(question.correctAnswer.toLowerCase().trim());
        return acceptable.indexOf(text) !== -1;
      }
      default:
        return false;
    }
  };

  TestSession.prototype.navigateToQuestion = function(index) {
    if (index < 0 || index >= this.questions.length) return;
    this._questionStartTime = Date.now();
    this.session.currentIndex = index;
    this._saveState();
  };

  TestSession.prototype.flagQuestion = function(questionId) {
    var idx = this.session.flaggedQuestions.indexOf(questionId);
    if (idx === -1) {
      this.session.flaggedQuestions.push(questionId);
    } else {
      this.session.flaggedQuestions.splice(idx, 1);
    }
    this._saveState();
  };

  TestSession.prototype.isFlagged = function(questionId) {
    return this.session.flaggedQuestions.indexOf(questionId) !== -1;
  };

  TestSession.prototype.isAnswered = function(questionId) {
    return this.session.answers.some(function(a) { return a.questionId === questionId; });
  };

  TestSession.prototype.getAnswer = function(questionId) {
    return this.session.answers.find(function(a) { return a.questionId === questionId; }) || null;
  };

  TestSession.prototype.pauseTest = function() {
    this._paused = true;
    this.session.status = 'paused';
    this._updateElapsed();
    this._stopTimer();
    this._saveState();
  };

  TestSession.prototype.resumeTest = function() {
    this._paused = false;
    this.session.status = 'in-progress';
    this._pausedElapsed = this.session.elapsedSeconds;
    this._startWallTime = Date.now();
    this._startTimer();
    this._saveState();
  };

  TestSession.prototype.endTest = function() {
    this._active = false;
    this.session.status = 'completed';
    this.session.completedAt = Date.now();
    this._updateElapsed();
    this._stopTimer();

    // Calculate score
    var correct = 0;
    this.session.answers.forEach(function(a) { if (a.isCorrect) correct++; });
    this.session.score = this.questions.length > 0 ? (correct / this.questions.length) * 100 : 0;

    DataStore.saveSession(this.session);
    DataStore.clearActiveSession();
    return this.session;
  };

  TestSession.prototype.getProgress = function() {
    var answered = this.session.answers.length;
    var total = this.questions.length;
    var flagged = this.session.flaggedQuestions.length;
    return {
      answered: answered,
      total: total,
      flagged: flagged,
      current: this.session.currentIndex + 1,
      percentComplete: total > 0 ? Math.round((answered / total) * 100) : 0
    };
  };

  TestSession.prototype.getElapsedSeconds = function() {
    if (this._paused) return this.session.elapsedSeconds;
    if (!this._startWallTime) return this._pausedElapsed;
    return this._pausedElapsed + Math.floor((Date.now() - this._startWallTime) / 1000);
  };

  TestSession.prototype.getRemainingSeconds = function() {
    if (!this.session.timeLimitSeconds) return null;
    return Math.max(0, this.session.timeLimitSeconds - this.getElapsedSeconds());
  };

  TestSession.prototype.isActive = function() {
    return this._active && !this._paused;
  };

  TestSession.prototype.isPaused = function() {
    return this._paused;
  };

  TestSession.prototype.onTick = function(fn) { this._onTick = fn; };
  TestSession.prototype.onTimeWarning = function(fn) { this._onTimeWarning = fn; };
  TestSession.prototype.onTimeUp = function(fn) { this._onTimeUp = fn; };

  TestSession.prototype._startTimer = function() {
    var self = this;
    function tick() {
      if (!self._active || self._paused) return;
      self._updateElapsed();

      if (self._onTick) self._onTick(self.getElapsedSeconds(), self.getRemainingSeconds());

      var remaining = self.getRemainingSeconds();
      if (remaining !== null) {
        if (remaining <= 60 && !self._warned1) {
          self._warned1 = true;
          if (self._onTimeWarning) self._onTimeWarning(1);
        } else if (remaining <= 300 && !self._warned5) {
          self._warned5 = true;
          if (self._onTimeWarning) self._onTimeWarning(5);
        }
        if (remaining <= 0) {
          if (self._onTimeUp) self._onTimeUp();
          return;
        }
      }

      self._timerRef = requestAnimationFrame(tick);
    }
    self._timerRef = requestAnimationFrame(tick);
  };

  TestSession.prototype._stopTimer = function() {
    if (this._timerRef) {
      cancelAnimationFrame(this._timerRef);
      this._timerRef = null;
    }
  };

  TestSession.prototype._updateElapsed = function() {
    if (!this._startWallTime) return;
    this.session.elapsedSeconds = this._pausedElapsed + Math.floor((Date.now() - this._startWallTime) / 1000);
  };

  TestSession.prototype._saveState = function() {
    DataStore.saveActiveSession({
      session: this.session,
      questions: this.questions
    });
  };

  // Static: check for recoverable session
  TestSession.hasRecoverableSession = function() {
    return DataStore.getActiveSession() !== null;
  };

  TestSession.recover = function() {
    var saved = DataStore.getActiveSession();
    if (!saved) return null;
    var ts = new TestSession({ questions: saved.questions, mode: saved.session.mode });
    ts.resumeFromState(saved);
    return ts;
  };

  window.NCLEX.TestSession = TestSession;
})();
