/**
 * NCLEX Prep Simulator - Main Application (Router, Events, Screen Renderers)
 */
(function() {
  'use strict';

  var Utils = window.NCLEX.Utils;
  var Models = window.NCLEX.Models;
  var DataStore = window.NCLEX.DataStore;

  // ─── Event Bus ───
  var Events = {
    _listeners: {},
    on: function(event, fn) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(fn);
    },
    off: function(event, fn) {
      if (!this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter(function(f) { return f !== fn; });
    },
    emit: function(event, data) {
      var fns = this._listeners[event] || [];
      for (var i = 0; i < fns.length; i++) {
        try { fns[i](data); } catch (e) { console.error('Event handler error [' + event + ']:', e); }
      }
    }
  };
  window.NCLEX.Events = Events;

  // ─── Toast System ───
  var Toast = {
    show: function(message, type, duration) {
      type = type || 'info';
      duration = duration || 3000;
      var container = document.getElementById('toast-container');
      if (!container) return;
      var toast = document.createElement('div');
      toast.className = 'toast toast--' + type;
      toast.textContent = message;
      toast.setAttribute('role', 'alert');
      container.appendChild(toast);
      requestAnimationFrame(function() { toast.classList.add('toast--visible'); });
      setTimeout(function() {
        toast.classList.remove('toast--visible');
        setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
      }, duration);
    },
    success: function(msg) { this.show(msg, 'success'); },
    error: function(msg) { this.show(msg, 'error', 5000); },
    warning: function(msg) { this.show(msg, 'warning', 4000); },
    info: function(msg) { this.show(msg, 'info'); }
  };
  window.NCLEX.Toast = Toast;

  // ─── Modal System ───
  var Modal = {
    show: function(options) {
      var overlay = document.getElementById('modal-overlay');
      var content = document.getElementById('modal-content');
      if (!overlay || !content) return;

      var html = '<div class="modal__header">';
      html += '<h2 class="modal__title">' + Utils.escapeHTML(options.title || '') + '</h2>';
      html += '<button class="modal__close" aria-label="Close modal">&times;</button>';
      html += '</div>';
      html += '<div class="modal__body">' + (options.body || '') + '</div>';
      html += '<div class="modal__footer">';
      if (options.cancelText) {
        html += '<button class="btn btn--secondary modal__cancel">' + Utils.escapeHTML(options.cancelText) + '</button>';
      }
      if (options.confirmText) {
        html += '<button class="btn btn--' + (options.confirmType || 'primary') + ' modal__confirm">' + Utils.escapeHTML(options.confirmText) + '</button>';
      }
      html += '</div>';

      content.innerHTML = html;
      overlay.classList.add('modal--visible');
      document.body.classList.add('modal-open');

      content.querySelector('.modal__close').addEventListener('click', function() { Modal.hide(); });
      var cancelBtn = content.querySelector('.modal__cancel');
      if (cancelBtn) cancelBtn.addEventListener('click', function() { Modal.hide(); if (options.onCancel) options.onCancel(); });
      var confirmBtn = content.querySelector('.modal__confirm');
      if (confirmBtn) confirmBtn.addEventListener('click', function() { Modal.hide(); if (options.onConfirm) options.onConfirm(); });

      overlay.addEventListener('click', function handler(e) {
        if (e.target === overlay) { Modal.hide(); overlay.removeEventListener('click', handler); }
      });
    },
    hide: function() {
      var overlay = document.getElementById('modal-overlay');
      if (overlay) overlay.classList.remove('modal--visible');
      document.body.classList.remove('modal-open');
    }
  };
  window.NCLEX.Modal = Modal;

  // ─── Router ───
  var SCREENS = ['dashboard', 'test-config', 'test', 'results', 'review', 'questions', 'analytics', 'settings'];
  var currentScreen = null;

  function navigate(screen, params) {
    if (SCREENS.indexOf(screen) === -1) screen = 'dashboard';

    // Guard: test screen requires active session
    if (screen === 'test' && !activeTestSession) {
      var hasRecoverable = window.NCLEX.TestSession && window.NCLEX.TestSession.hasRecoverableSession && window.NCLEX.TestSession.hasRecoverableSession();
      if (!hasRecoverable && !(params && params.resume)) {
        screen = 'test-config';
      }
    }

    var hash = '#' + screen;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
      return; // hashchange will call navigate again
    }

    // Hide all screens
    var sections = document.querySelectorAll('.screen');
    for (var i = 0; i < sections.length; i++) {
      sections[i].classList.remove('screen--active');
    }

    // Show target
    var target = document.getElementById('screen-' + screen);
    if (target) {
      target.classList.add('screen--active');
    }

    // Update nav
    var navLinks = document.querySelectorAll('.nav__link');
    for (var j = 0; j < navLinks.length; j++) {
      navLinks[j].classList.toggle('nav__link--active', navLinks[j].getAttribute('data-screen') === screen);
    }

    currentScreen = screen;
    Events.emit('screen-change', { screen: screen, params: params });
    renderScreen(screen, params);
  }

  function renderScreen(screen, params) {
    var renderers = {
      'dashboard': renderDashboard,
      'test-config': renderTestConfig,
      'test': renderTest,
      'results': renderResults,
      'review': renderReview,
      'questions': renderQuestions,
      'analytics': renderAnalytics,
      'settings': renderSettings
    };
    if (renderers[screen]) {
      try {
        renderers[screen](params);
      } catch (e) {
        console.error('Error rendering screen ' + screen + ':', e);
        Toast.error('Error loading screen');
      }
    }
  }

  // ─── Screen Renderers (stubs for Phase 1, filled in later phases) ───

  function renderDashboard() {
    var el = document.getElementById('screen-dashboard');
    var ALE = window.NCLEX.AdaptiveLearningEngine;

    el.innerHTML = '<div class="screen__content">' +
      '<div class="dashboard">' +
      '<div class="dashboard__welcome" id="dash-welcome">' +
      '<h1>Welcome to NCLEX-RN Prep</h1>' +
      '<p>Your adaptive exam simulator for NCLEX-RN preparation.</p>' +
      '</div>' +
      '<div class="dashboard__actions">' +
      '<button class="btn btn--primary btn--lg" onclick="window.location.hash=\'#test-config\'">Start Practice Test</button>' +
      '<button class="btn btn--secondary btn--lg" onclick="window.location.hash=\'#questions\'">Question Bank</button>' +
      '</div>' +
      '<div id="dash-readiness" style="display:flex;justify-content:center;margin:var(--space-lg) 0"></div>' +
      '<div class="dashboard__stats" id="dashboard-stats"></div>' +
      '<div id="dash-recommendation" style="margin-top:var(--space-lg)"></div>' +
      '<div id="dash-weak-alerts" style="margin-top:var(--space-lg)"></div>' +
      '<div id="dash-recent" style="margin-top:var(--space-lg)"></div>' +
      '</div></div>';

    updateDashboardStats();

    // Readiness gauge + recommendation + weak alerts
    ALE.analyzePerformance().then(function(profile) {
      if (!profile) return;

      // Readiness ring
      var readiness = profile.readinessScore;
      var classification = ALE.classifyReadiness(readiness);
      var colorMap = { success: 'var(--color-success)', warning: 'var(--color-warning)', error: 'var(--color-error)' };
      var ringColor = colorMap[classification.color] || 'var(--color-primary)';
      var deg = (readiness / 100) * 360;

      var readinessEl = document.getElementById('dash-readiness');
      if (readinessEl) {
        readinessEl.innerHTML = '<div class="progress-ring" style="background:conic-gradient(' + ringColor + ' ' + deg + 'deg, var(--color-border) ' + deg + 'deg)">' +
          '<div class="progress-ring__inner"><div class="progress-ring__value">' + readiness + '</div><div class="progress-ring__label">' + classification.label + '</div></div></div>';
      }

      // Weak area alerts
      var weakAlerts = document.getElementById('dash-weak-alerts');
      if (weakAlerts) {
        var weakCats = Object.entries(profile.categoryAnalysis).filter(function(e) {
          return e[1].level === 'weak' || e[1].level === 'critical';
        });
        if (weakCats.length > 0) {
          var alertHtml = '<div class="card card--warning"><h4>Areas Needing Attention</h4><ul>';
          weakCats.forEach(function(e) {
            alertHtml += '<li><strong>' + Utils.escapeHTML(e[1].name) + '</strong> - ' + Math.round(e[1].accuracy) + '% accuracy (' + e[1].level + ')</li>';
          });
          alertHtml += '</ul></div>';
          weakAlerts.innerHTML = alertHtml;
        }
      }
    });

    // Recommendation
    ALE.getNextTestRecommendation().then(function(rec) {
      var recEl = document.getElementById('dash-recommendation');
      if (!recEl || !rec) return;
      recEl.innerHTML = '<div class="card card--info"><h4>Recommended Next Test</h4><p>' +
        Utils.escapeHTML(rec.reasoning) + '</p>' +
        '<button class="btn btn--primary btn--sm" style="margin-top:var(--space-sm)" onclick="window.location.hash=\'#test-config\'">Configure Test</button></div>';
    });

    // Recent tests
    DataStore.getSessions().then(function(sessions) {
      var completed = sessions.filter(function(s) { return s.status === 'completed'; });
      var recent = completed.slice(-3).reverse();
      var recentEl = document.getElementById('dash-recent');
      if (!recentEl || recent.length === 0) return;

      var html = '<h3>Recent Tests</h3><div class="stats-grid">';
      recent.forEach(function(s) {
        var score = s.score != null ? Math.round(s.score) : 0;
        var passed = score >= 65;
        html += '<div class="card card--clickable" onclick="window.location.hash=\'#results?sid=' + s.id + '\'">';
        html += '<div style="font-size:var(--font-size-2xl);font-weight:700;color:var(--color-' + (passed ? 'success' : 'error') + ')">' + score + '%</div>';
        html += '<div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">' + s.mode + ' | ' + s.answers.length + ' questions</div>';
        html += '<div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">' + Utils.formatDateTime(s.completedAt) + '</div>';
        html += '</div>';
      });
      html += '</div>';
      recentEl.innerHTML = html;
    });

    // Personalized welcome
    DataStore.getUserProfile().then(function(profile) {
      var welcomeEl = document.getElementById('dash-welcome');
      if (welcomeEl && profile && profile.name) {
        welcomeEl.querySelector('h1').textContent = 'Welcome back, ' + profile.name + '!';
      }
    });
  }

  function updateDashboardStats() {
    var statsEl = document.getElementById('dashboard-stats');
    if (!statsEl) return;
    DataStore.getSessions().then(function(sessions) {
      var completed = sessions.filter(function(s) { return s.status === 'completed'; });
      if (completed.length === 0) {
        statsEl.innerHTML = '<div class="card card--info">' +
          '<p>No tests completed yet. Start your first practice test to see your progress!</p>' +
          '</div>';
        return;
      }
      var totalTests = completed.length;
      var totalQ = 0; var totalCorrect = 0;
      for (var i = 0; i < completed.length; i++) {
        totalQ += completed[i].answers.length;
        for (var j = 0; j < completed[i].answers.length; j++) {
          if (completed[i].answers[j].isCorrect) totalCorrect++;
        }
      }
      var avgScore = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
      var lastTest = completed[completed.length - 1];
      var lastScore = lastTest.score != null ? lastTest.score : 0;

      statsEl.innerHTML =
        '<div class="stats-grid">' +
        '<div class="stat-card"><div class="stat-card__value">' + totalTests + '</div><div class="stat-card__label">Tests Taken</div></div>' +
        '<div class="stat-card"><div class="stat-card__value">' + avgScore + '%</div><div class="stat-card__label">Average Score</div></div>' +
        '<div class="stat-card"><div class="stat-card__value">' + totalQ + '</div><div class="stat-card__label">Questions Answered</div></div>' +
        '<div class="stat-card"><div class="stat-card__value">' + Math.round(lastScore) + '%</div><div class="stat-card__label">Last Score</div></div>' +
        '</div>';
    });
  }

  // ─── Test Config State ───
  var testConfigState = {
    mode: 'standard',
    questionCount: 10,
    timeLimitMinutes: null,
    categories: [],
    showRationale: false
  };

  function renderTestConfig() {
    var el = document.getElementById('screen-test-config');
    var categories = DataStore.getCategories();

    el.innerHTML = '<div class="screen__content">' +
      '<h1>Configure Test</h1>' +

      // Mode selection
      '<h3>Test Mode</h3>' +
      '<div class="mode-grid">' +
      '<div class="mode-card mode-card--selected" data-mode="standard"><div class="mode-card__icon">&#128203;</div><div class="mode-card__name">Standard</div><div class="mode-card__desc">NCLEX-weighted distribution with balanced difficulty</div></div>' +
      '<div class="mode-card" data-mode="adaptive"><div class="mode-card__icon">&#129504;</div><div class="mode-card__name">Adaptive</div><div class="mode-card__desc">Targets your weak areas from past tests</div></div>' +
      '<div class="mode-card" data-mode="focused"><div class="mode-card__icon">&#127919;</div><div class="mode-card__name">Focused</div><div class="mode-card__desc">Practice specific categories you choose</div></div>' +
      '<div class="mode-card" data-mode="random"><div class="mode-card__icon">&#127922;</div><div class="mode-card__name">Random</div><div class="mode-card__desc">Random question selection from all categories</div></div>' +
      '</div>' +

      // Question count
      '<h3>Number of Questions</h3>' +
      '<div class="count-selector" id="tc-count-selector">' +
      '<button class="count-btn count-btn--selected" data-count="10">10</button>' +
      '<button class="count-btn" data-count="25">25</button>' +
      '<button class="count-btn" data-count="50">50</button>' +
      '<button class="count-btn" data-count="75">75</button>' +
      '<button class="count-btn" data-count="100">100</button>' +
      '<button class="count-btn" data-count="145">145</button>' +
      '</div>' +

      // Time limit
      '<div class="form-group" style="margin-top:var(--space-lg)">' +
      '<label class="form-label">Time Limit</label>' +
      '<select class="form-select" id="tc-time-limit" style="max-width:200px">' +
      '<option value="">No time limit</option>' +
      '<option value="30">30 minutes</option>' +
      '<option value="60">1 hour</option>' +
      '<option value="120">2 hours</option>' +
      '<option value="180">3 hours</option>' +
      '<option value="300">5 hours (NCLEX standard)</option>' +
      '</select></div>' +

      // Focused categories
      '<div id="tc-focused-cats" style="display:none;margin-top:var(--space-lg)">' +
      '<h3>Select Categories</h3>' +
      '<div id="tc-cat-checkboxes"></div>' +
      '</div>' +

      // Options
      '<div style="margin-top:var(--space-lg)">' +
      '<label class="form-checkbox"><input type="checkbox" id="tc-show-rationale"><span>Show rationale after each answer</span></label>' +
      '</div>' +

      // Preview
      '<div id="tc-preview" class="card card--info" style="margin-top:var(--space-lg);display:none"></div>' +

      // Start button
      '<div style="margin-top:var(--space-xl);text-align:center">' +
      '<button class="btn btn--primary btn--lg" id="tc-start-btn">Begin Test</button>' +
      '</div>' +
      '</div>';

    // Category checkboxes
    if (categories && categories.categories) {
      var catHtml = '';
      categories.categories.forEach(function(cat) {
        catHtml += '<label class="form-checkbox"><input type="checkbox" data-cat-id="' + cat.id + '"><span>' + Utils.escapeHTML(cat.name) + '</span></label>';
      });
      document.getElementById('tc-cat-checkboxes').innerHTML = catHtml;
    }

    // Event delegation
    el.addEventListener('click', function(e) {
      // Mode cards
      var modeCard = e.target.closest('.mode-card');
      if (modeCard) {
        el.querySelectorAll('.mode-card').forEach(function(c) { c.classList.remove('mode-card--selected'); });
        modeCard.classList.add('mode-card--selected');
        testConfigState.mode = modeCard.getAttribute('data-mode');
        document.getElementById('tc-focused-cats').style.display = testConfigState.mode === 'focused' ? '' : 'none';
        updateTestPreview();
      }

      // Count buttons
      var countBtn = e.target.closest('.count-btn');
      if (countBtn) {
        el.querySelectorAll('.count-btn').forEach(function(b) { b.classList.remove('count-btn--selected'); });
        countBtn.classList.add('count-btn--selected');
        testConfigState.questionCount = parseInt(countBtn.getAttribute('data-count'));
        updateTestPreview();
      }

      // Start button
      if (e.target.id === 'tc-start-btn' || e.target.closest('#tc-start-btn')) {
        startTest();
      }
    });

    // Time limit change
    document.getElementById('tc-time-limit').addEventListener('change', function(e) {
      testConfigState.timeLimitMinutes = e.target.value ? parseInt(e.target.value) : null;
    });

    document.getElementById('tc-show-rationale').addEventListener('change', function(e) {
      testConfigState.showRationale = e.target.checked;
    });

    updateTestPreview();
  }

  function updateTestPreview() {
    var preview = document.getElementById('tc-preview');
    if (!preview) return;

    window.NCLEX.TestGenerator.getTestSummary({
      mode: testConfigState.mode,
      questionCount: testConfigState.questionCount
    }).then(function(summary) {
      if (summary.willCap) {
        preview.style.display = '';
        preview.innerHTML = '<p><strong>Note:</strong> Only <strong>' + summary.availableCount +
          '</strong> questions available. Test will include ' + summary.actualCount + ' questions instead of ' + summary.requestedCount + '.</p>';
      } else {
        preview.style.display = 'none';
      }
    });
  }

  function startTest() {
    // Gather focused categories
    testConfigState.categories = [];
    document.querySelectorAll('#tc-cat-checkboxes input:checked').forEach(function(cb) {
      testConfigState.categories.push(cb.getAttribute('data-cat-id'));
    });

    var TG = window.NCLEX.TestGenerator;
    TG.generate({
      mode: testConfigState.mode,
      questionCount: testConfigState.questionCount,
      categories: testConfigState.categories,
      timeLimitMinutes: testConfigState.timeLimitMinutes
    }).then(function(result) {
      if (result.questions.length === 0) {
        Toast.error('No questions available for this configuration');
        return;
      }

      var ts = new window.NCLEX.TestSession({
        mode: testConfigState.mode,
        questions: result.questions,
        timeLimitMinutes: testConfigState.timeLimitMinutes,
        showRationale: testConfigState.showRationale,
        focusedCategories: testConfigState.categories
      });

      activeTestSession = ts;
      ts.startTest();

      ts.onTick(function(elapsed, remaining) {
        updateTimerDisplay(elapsed, remaining);
      });

      ts.onTimeWarning(function(minutes) {
        Toast.warning(minutes + ' minute' + (minutes > 1 ? 's' : '') + ' remaining!');
      });

      ts.onTimeUp(function() {
        Toast.error('Time is up!');
        endCurrentTest();
      });

      navigate('test');
    }).catch(function(err) {
      Toast.error(err.error || 'Failed to generate test');
    });
  }

  // ─── Active Test Session Ref ───
  var activeTestSession = null;

  function renderTest(params) {
    var el = document.getElementById('screen-test');

    // Resume from crash recovery
    if (params && params.resume) {
      activeTestSession = window.NCLEX.TestSession.recover();
      if (!activeTestSession) {
        Toast.error('Could not recover session');
        navigate('dashboard');
        return;
      }
      activeTestSession.onTick(function(elapsed, remaining) { updateTimerDisplay(elapsed, remaining); });
      activeTestSession.onTimeWarning(function(m) { Toast.warning(m + ' minute' + (m > 1 ? 's' : '') + ' remaining!'); });
      activeTestSession.onTimeUp(function() { Toast.error('Time is up!'); endCurrentTest(); });
    }

    if (!activeTestSession) {
      navigate('test-config');
      return;
    }

    var ts = activeTestSession;

    el.innerHTML = '<div class="screen__content">' +
      // Test header
      '<div class="test-header">' +
      '<div class="test-header__progress" id="test-progress">Q 1/' + ts.getQuestionCount() + '</div>' +
      '<div class="test-header__timer" id="test-timer">00:00</div>' +
      '<div class="btn-group">' +
      '<button class="btn btn--ghost btn--sm" id="test-flag-btn">Flag</button>' +
      '<button class="btn btn--ghost btn--sm" id="test-pause-btn">Pause</button>' +
      '<button class="btn btn--danger btn--sm" id="test-end-btn">End Test</button>' +
      '</div></div>' +

      // Layout
      '<div class="test-layout">' +
      '<div class="test-layout__main">' +
      '<div id="test-question-area"></div>' +
      '<div id="test-rationale-area"></div>' +
      '<div class="btn-group" style="margin-top:var(--space-md)">' +
      '<button class="btn btn--secondary" id="test-prev-btn">Previous</button>' +
      '<button class="btn btn--primary" id="test-next-btn">Next</button>' +
      '<button class="btn btn--primary" id="test-submit-answer-btn" style="display:none">Submit Answer</button>' +
      '</div></div>' +

      '<div class="test-layout__sidebar">' +
      '<div class="question-nav">' +
      '<div class="question-nav__title">Questions</div>' +
      '<div class="question-nav__grid" id="test-nav-grid"></div>' +
      '</div></div>' +
      '</div></div>';

    // Build nav grid
    buildQuestionNavGrid(ts);

    // Event listeners
    el.addEventListener('click', function(e) {
      if (e.target.id === 'test-flag-btn' || e.target.closest('#test-flag-btn')) {
        var q = ts.getCurrentQuestion();
        if (q) { ts.flagQuestion(q.id); renderCurrentQuestion(); buildQuestionNavGrid(ts); }
      }
      if (e.target.id === 'test-pause-btn' || e.target.closest('#test-pause-btn')) {
        if (ts.isPaused()) { ts.resumeTest(); e.target.textContent = 'Pause'; Toast.info('Test resumed'); }
        else { ts.pauseTest(); e.target.textContent = 'Resume'; Toast.info('Test paused'); }
      }
      if (e.target.id === 'test-end-btn' || e.target.closest('#test-end-btn')) {
        Modal.show({
          title: 'End Test?',
          body: '<p>Are you sure you want to end this test? ' + (ts.getQuestionCount() - ts.session.answers.length) + ' questions are unanswered.</p>',
          confirmText: 'End Test',
          confirmType: 'danger',
          cancelText: 'Continue',
          onConfirm: function() { endCurrentTest(); }
        });
      }
      if (e.target.id === 'test-prev-btn' || e.target.closest('#test-prev-btn')) {
        navigateQuestion(ts.getCurrentIndex() - 1);
      }
      if (e.target.id === 'test-next-btn' || e.target.closest('#test-next-btn')) {
        navigateQuestion(ts.getCurrentIndex() + 1);
      }
      if (e.target.id === 'test-submit-answer-btn' || e.target.closest('#test-submit-answer-btn')) {
        submitCurrentAnswer();
      }

      // Nav grid click
      var navItem = e.target.closest('.question-nav__item');
      if (navItem) {
        var idx = parseInt(navItem.getAttribute('data-index'));
        if (!isNaN(idx)) navigateQuestion(idx);
      }
    });

    renderCurrentQuestion();
  }

  function navigateQuestion(index) {
    var ts = activeTestSession;
    if (!ts) return;
    if (index < 0 || index >= ts.getQuestionCount()) return;
    ts.navigateToQuestion(index);
    renderCurrentQuestion();
    buildQuestionNavGrid(ts);
  }

  function renderCurrentQuestion() {
    var ts = activeTestSession;
    if (!ts) return;
    var q = ts.getCurrentQuestion();
    if (!q) return;

    var progress = ts.getProgress();
    var progressEl = document.getElementById('test-progress');
    if (progressEl) progressEl.textContent = 'Q ' + progress.current + '/' + progress.total;

    var area = document.getElementById('test-question-area');
    var rationaleArea = document.getElementById('test-rationale-area');
    var submitBtn = document.getElementById('test-submit-answer-btn');
    var nextBtn = document.getElementById('test-next-btn');

    var existingAnswer = ts.getAnswer(q.id);
    var showingRationale = ts.session.showRationale && existingAnswer;

    var typeLabelMap = { 'multiple-choice': 'Multiple Choice', 'select-all-that-apply': 'Select All That Apply', 'ordered-response': 'Ordered Response', 'fill-in-the-blank': 'Fill in the Blank' };

    var html = '<div class="test-question">';
    html += '<span class="test-question__type-badge">' + (typeLabelMap[q.type] || q.type) + '</span>';
    if (ts.isFlagged(q.id)) html += ' <span class="badge badge--medium">Flagged</span>';
    html += '<div class="test-question__stem">' + Utils.escapeHTML(q.stem) + '</div>';

    // Render by type
    if (q.type === 'multiple-choice') {
      html += renderMCOptions(q, existingAnswer, showingRationale);
    } else if (q.type === 'select-all-that-apply') {
      html += renderSATAOptions(q, existingAnswer, showingRationale);
    } else if (q.type === 'ordered-response') {
      html += renderOrderedOptions(q, existingAnswer, showingRationale);
    } else if (q.type === 'fill-in-the-blank') {
      html += renderFillBlank(q, existingAnswer, showingRationale);
    }

    html += '</div>';
    area.innerHTML = html;

    // Rationale
    if (showingRationale) {
      rationaleArea.innerHTML = '<div class="rationale-box"><div class="rationale-box__title">' +
        (existingAnswer.isCorrect ? 'Correct!' : 'Incorrect') + ' - Rationale</div>' +
        '<p>' + Utils.escapeHTML(q.rationale) + '</p></div>';
      if (submitBtn) submitBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = '';
    } else {
      rationaleArea.innerHTML = '';
      if (!existingAnswer) {
        if (submitBtn) submitBtn.style.display = '';
        if (nextBtn) nextBtn.style.display = 'none';
      } else {
        if (submitBtn) submitBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = '';
      }
    }

    // Flag button text
    var flagBtn = document.getElementById('test-flag-btn');
    if (flagBtn) flagBtn.textContent = ts.isFlagged(q.id) ? 'Unflag' : 'Flag';
  }

  function renderMCOptions(q, existingAnswer, showRationale) {
    var selected = existingAnswer ? existingAnswer.selectedOptions : [];
    var html = '<div class="option-list" id="test-options">';
    q.options.forEach(function(opt) {
      var isSelected = selected.indexOf(opt.id) !== -1;
      var cls = 'option-card';
      if (isSelected) cls += ' option-card--selected';
      if (showRationale && opt.isCorrect) cls += ' option-card--correct';
      if (showRationale && isSelected && !opt.isCorrect) cls += ' option-card--incorrect';
      html += '<div class="' + cls + '" data-option-id="' + opt.id + '" role="radio" aria-checked="' + isSelected + '">';
      html += '<div class="option-card__marker">' + opt.id + '</div>';
      html += '<div class="option-card__text">' + Utils.escapeHTML(opt.text) + '</div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderSATAOptions(q, existingAnswer, showRationale) {
    var selected = existingAnswer ? existingAnswer.selectedOptions : [];
    var html = '<div class="option-list" id="test-options">';
    q.options.forEach(function(opt) {
      var isSelected = selected.indexOf(opt.id) !== -1;
      var cls = 'option-card';
      if (isSelected) cls += ' option-card--selected';
      if (showRationale && opt.isCorrect) cls += ' option-card--correct';
      if (showRationale && isSelected && !opt.isCorrect) cls += ' option-card--incorrect';
      html += '<div class="' + cls + '" data-option-id="' + opt.id + '" data-sata="true" role="checkbox" aria-checked="' + isSelected + '">';
      html += '<div class="option-card__marker">' + opt.id + '</div>';
      html += '<div class="option-card__text">' + Utils.escapeHTML(opt.text) + '</div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderOrderedOptions(q, existingAnswer, showRationale) {
    var order = existingAnswer ? existingAnswer.orderedAnswer : q.options.map(function(o) { return o.id; });
    var optMap = {};
    q.options.forEach(function(o) { optMap[o.id] = o; });

    var html = '<div id="test-options" class="test-ordered-list">';
    order.forEach(function(id, idx) {
      var opt = optMap[id];
      if (!opt) return;
      var cls = 'ordered-option';
      if (showRationale) {
        cls += q.correctOrder[idx] === id ? ' option-card--correct' : ' option-card--incorrect';
      }
      html += '<div class="' + cls + '" data-option-id="' + id + '">';
      html += '<div class="ordered-option__number">' + (idx + 1) + '</div>';
      html += '<div class="ordered-option__text">' + Utils.escapeHTML(opt.text) + '</div>';
      if (!existingAnswer || !showRationale) {
        html += '<div class="ordered-option__controls">';
        html += '<button class="ordered-option__btn" data-action="test-move-up">&uarr;</button>';
        html += '<button class="ordered-option__btn" data-action="test-move-down">&darr;</button>';
        html += '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderFillBlank(q, existingAnswer, showRationale) {
    var val = existingAnswer ? existingAnswer.textAnswer : '';
    var html = '<div id="test-options" style="display:flex;align-items:center;gap:var(--space-sm)">';
    html += '<input type="text" class="form-input fill-blank-input" id="test-fill-input" value="' + Utils.escapeHTML(val) + '"' + (showRationale ? ' disabled' : '') + ' placeholder="Enter answer">';
    if (q.unit) html += '<span class="fill-blank-unit">' + Utils.escapeHTML(q.unit) + '</span>';
    html += '</div>';
    if (showRationale) {
      html += '<p style="margin-top:var(--space-sm);color:var(--color-success)">Correct answer: ' + Utils.escapeHTML(q.correctAnswer || '') + (q.unit ? ' ' + q.unit : '') + '</p>';
    }
    return html;
  }

  // Option clicking delegation in test area
  document.addEventListener('click', function(e) {
    if (!activeTestSession || !activeTestSession.isActive()) return;
    var ts = activeTestSession;
    var q = ts.getCurrentQuestion();
    if (!q) return;
    var existingAnswer = ts.getAnswer(q.id);
    if (existingAnswer && ts.session.showRationale) return; // Already submitted with rationale

    // MC option click
    var optCard = e.target.closest('.option-card');
    if (optCard && optCard.closest('#test-options')) {
      var optId = optCard.getAttribute('data-option-id');
      if (!optId) return;

      if (q.type === 'multiple-choice') {
        // Single select
        optCard.parentNode.querySelectorAll('.option-card').forEach(function(c) { c.classList.remove('option-card--selected'); });
        optCard.classList.add('option-card--selected');
      } else if (q.type === 'select-all-that-apply') {
        optCard.classList.toggle('option-card--selected');
      }
    }

    // Ordered response move
    if (e.target.getAttribute('data-action') === 'test-move-up' || e.target.getAttribute('data-action') === 'test-move-down') {
      var row = e.target.closest('.ordered-option');
      var list = row.parentNode;
      var items = Array.from(list.children);
      var idx = items.indexOf(row);
      if (e.target.getAttribute('data-action') === 'test-move-up' && idx > 0) {
        list.insertBefore(row, items[idx - 1]);
      } else if (e.target.getAttribute('data-action') === 'test-move-down' && idx < items.length - 1) {
        list.insertBefore(items[idx + 1], row);
      }
      // Re-number
      Array.from(list.children).forEach(function(item, i) {
        var num = item.querySelector('.ordered-option__number');
        if (num) num.textContent = (i + 1);
      });
    }
  });

  function submitCurrentAnswer() {
    var ts = activeTestSession;
    if (!ts) return;
    var q = ts.getCurrentQuestion();
    if (!q) return;

    var answerData = {};

    if (q.type === 'multiple-choice') {
      var selected = document.querySelector('#test-options .option-card--selected');
      answerData.selectedOptions = selected ? [selected.getAttribute('data-option-id')] : [];
      if (answerData.selectedOptions.length === 0) { Toast.warning('Please select an answer'); return; }
    } else if (q.type === 'select-all-that-apply') {
      var selectedCards = document.querySelectorAll('#test-options .option-card--selected');
      answerData.selectedOptions = Array.from(selectedCards).map(function(c) { return c.getAttribute('data-option-id'); });
      if (answerData.selectedOptions.length === 0) { Toast.warning('Please select at least one answer'); return; }
    } else if (q.type === 'ordered-response') {
      var orderedItems = document.querySelectorAll('#test-options .ordered-option');
      answerData.orderedAnswer = Array.from(orderedItems).map(function(item) { return item.getAttribute('data-option-id'); });
    } else if (q.type === 'fill-in-the-blank') {
      answerData.textAnswer = (document.getElementById('test-fill-input') || {}).value || '';
      if (!answerData.textAnswer.trim()) { Toast.warning('Please enter an answer'); return; }
    }

    var result = ts.submitAnswer(answerData);
    buildQuestionNavGrid(ts);

    if (ts.session.showRationale) {
      renderCurrentQuestion(); // Shows rationale
    } else {
      // Auto-advance
      if (ts.getCurrentIndex() < ts.getQuestionCount() - 1) {
        navigateQuestion(ts.getCurrentIndex() + 1);
      } else {
        renderCurrentQuestion();
        Toast.info('You have reached the last question. Click "End Test" when ready.');
      }
    }
  }

  function buildQuestionNavGrid(ts) {
    var grid = document.getElementById('test-nav-grid');
    if (!grid) return;
    var html = '';
    for (var i = 0; i < ts.getQuestionCount(); i++) {
      var qId = ts.questions[i].id;
      var cls = 'question-nav__item';
      if (i === ts.getCurrentIndex()) cls += ' question-nav__item--current';
      else if (ts.isFlagged(qId)) cls += ' question-nav__item--flagged';
      else if (ts.isAnswered(qId)) cls += ' question-nav__item--answered';
      html += '<div class="' + cls + '" data-index="' + i + '" role="button" aria-label="Question ' + (i + 1) + '">' + (i + 1) + '</div>';
    }
    grid.innerHTML = html;
  }

  function updateTimerDisplay(elapsed, remaining) {
    var timerEl = document.getElementById('test-timer');
    if (!timerEl) return;
    if (remaining !== null) {
      timerEl.textContent = Utils.formatTime(remaining);
      timerEl.className = 'test-header__timer';
      if (remaining <= 60) timerEl.className += ' test-header__timer--critical';
      else if (remaining <= 300) timerEl.className += ' test-header__timer--warning';
    } else {
      timerEl.textContent = Utils.formatTime(elapsed);
    }
  }

  function endCurrentTest() {
    if (!activeTestSession) return;
    var session = activeTestSession.endTest();
    activeTestSession = null;
    // Update user profile stats
    DataStore.getUserProfile().then(function(profile) {
      var correct = 0;
      session.answers.forEach(function(a) { if (a.isCorrect) correct++; });
      profile.stats.totalTests++;
      profile.stats.totalQuestions += session.answers.length;
      profile.stats.totalCorrect += correct;
      profile.stats.lastTestDate = Date.now();
      DataStore.updateUserProfile({ stats: profile.stats });
    });
    navigate('results', { sessionId: session.id });
  }

  function renderResults(params) {
    var el = document.getElementById('screen-results');
    var sessionId = params && params.sessionId;

    // Also check hash for ?sid= parameter
    if (!sessionId) {
      var hashMatch = window.location.hash.match(/sid=([^&]+)/);
      if (hashMatch) sessionId = hashMatch[1];
    }

    DataStore.getSessions().then(function(sessions) {
      var session;
      if (sessionId) {
        session = sessions.find(function(s) { return s.id === sessionId; });
      }
      if (!session) {
        session = sessions.filter(function(s) { return s.status === 'completed'; }).pop();
      }
      if (!session) {
        el.innerHTML = '<div class="screen__content"><div class="empty-state"><div class="empty-state__title">No Results</div><p>Complete a test to see results.</p></div></div>';
        return;
      }
      renderResultsForSession(el, session);
    });
  }

  function renderResultsForSession(el, session) {
    var score = session.score != null ? Math.round(session.score) : 0;
    var threshold = 65;
    var categories = DataStore.getCategories();
    var passed = score >= threshold;
    var correct = 0;
    session.answers.forEach(function(a) { if (a.isCorrect) correct++; });

    var html = '<div class="screen__content">';

    // Hero
    html += '<div class="results-hero">';
    html += '<div class="results-hero__score results-hero__score--' + (passed ? 'pass' : 'fail') + '">' + score + '%</div>';
    html += '<div class="results-hero__badge results-hero__badge--' + (passed ? 'pass' : 'fail') + '">' + (passed ? 'PASS' : 'BELOW PASSING') + '</div>';
    html += '<p style="margin-top:var(--space-md);color:var(--color-text-secondary)">' +
      correct + ' of ' + session.answers.length + ' correct | Time: ' + Utils.formatTime(session.elapsedSeconds) +
      ' | Mode: ' + session.mode + '</p>';
    html += '<div class="btn-group" style="margin-top:var(--space-lg);justify-content:center">';
    html += '<button class="btn btn--primary" onclick="window.location.hash=\'#review?sid=' + session.id + '\'">Review Answers</button>';
    html += '<button class="btn btn--secondary" onclick="window.location.hash=\'#dashboard\'">Dashboard</button>';
    html += '<button class="btn btn--secondary" onclick="window.location.hash=\'#test-config\'">New Test</button>';
    html += '</div></div>';

    // Category breakdown
    if (categories && categories.categories) {
      html += '<div class="card" style="margin-top:var(--space-lg)"><h3>Category Breakdown</h3><div class="bar-chart">';
      categories.categories.forEach(function(cat) {
        var catAnswers = session.answers.filter(function(a) {
          var q = DataStore.getQuestionById(a.questionId);
          return q && q.category === cat.id;
        });
        var catCorrect = catAnswers.filter(function(a) { return a.isCorrect; }).length;
        var catPct = catAnswers.length > 0 ? Math.round((catCorrect / catAnswers.length) * 100) : 0;
        var color = catPct >= 80 ? 'green' : (catPct >= 65 ? 'yellow' : (catPct >= 50 ? 'orange' : 'red'));

        html += '<div class="bar-chart__item">';
        html += '<div class="bar-chart__label">' + Utils.escapeHTML(cat.name) + '</div>';
        html += '<div class="bar-chart__track"><div class="bar-chart__fill bar-chart__fill--' + color + '" style="width:' + catPct + '%"></div></div>';
        html += '<div class="bar-chart__value">' + catPct + '% (' + catCorrect + '/' + catAnswers.length + ')</div>';
        html += '</div>';
      });
      html += '</div></div>';
    }

    // Difficulty breakdown
    html += '<div class="card" style="margin-top:var(--space-lg)"><h3>Difficulty Breakdown</h3><div class="bar-chart">';
    ['easy', 'medium', 'hard'].forEach(function(diff) {
      var diffAnswers = session.answers.filter(function(a) {
        var q = DataStore.getQuestionById(a.questionId);
        return q && q.difficulty === diff;
      });
      var diffCorrect = diffAnswers.filter(function(a) { return a.isCorrect; }).length;
      var diffPct = diffAnswers.length > 0 ? Math.round((diffCorrect / diffAnswers.length) * 100) : 0;
      var color = diffPct >= 80 ? 'green' : (diffPct >= 65 ? 'yellow' : 'red');
      html += '<div class="bar-chart__item">';
      html += '<div class="bar-chart__label">' + diff.charAt(0).toUpperCase() + diff.slice(1) + '</div>';
      html += '<div class="bar-chart__track"><div class="bar-chart__fill bar-chart__fill--' + color + '" style="width:' + diffPct + '%"></div></div>';
      html += '<div class="bar-chart__value">' + diffPct + '% (' + diffCorrect + '/' + diffAnswers.length + ')</div>';
      html += '</div>';
    });
    html += '</div></div>';

    html += '</div>';
    el.innerHTML = html;
  }

  function renderReview(params) {
    var el = document.getElementById('screen-review');
    // Parse session ID from hash params
    var hash = window.location.hash;
    var sidMatch = hash.match(/sid=([^&]+)/);
    var sessionId = sidMatch ? sidMatch[1] : null;

    DataStore.getSessions().then(function(sessions) {
      var session;
      if (sessionId) {
        session = sessions.find(function(s) { return s.id === sessionId; });
      }
      if (!session) {
        session = sessions.filter(function(s) { return s.status === 'completed'; }).pop();
      }
      if (!session) {
        el.innerHTML = '<div class="screen__content"><div class="empty-state"><div class="empty-state__title">No Review Available</div></div></div>';
        return;
      }
      renderReviewForSession(el, session);
    });
  }

  function renderReviewForSession(el, session) {
    var reviewState = { filter: 'all', currentIdx: 0 };
    var allAnswers = session.answers;

    function getFilteredAnswers() {
      if (reviewState.filter === 'incorrect') return allAnswers.filter(function(a) { return !a.isCorrect; });
      if (reviewState.filter === 'flagged') return allAnswers.filter(function(a) { return a.flagged; });
      return allAnswers;
    }

    function renderReviewQuestion() {
      var filtered = getFilteredAnswers();
      if (filtered.length === 0) {
        el.innerHTML = '<div class="screen__content"><div class="empty-state"><div class="empty-state__title">No questions match this filter</div></div></div>';
        return;
      }
      if (reviewState.currentIdx >= filtered.length) reviewState.currentIdx = filtered.length - 1;
      var answer = filtered[reviewState.currentIdx];
      var q = DataStore.getQuestionById(answer.questionId);
      if (!q) return;

      var html = '<div class="screen__content">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--space-sm);margin-bottom:var(--space-md)">';
      html += '<h2>Review: Q ' + (reviewState.currentIdx + 1) + ' of ' + filtered.length + '</h2>';
      html += '<div class="btn-group">';
      html += '<button class="btn btn--sm ' + (reviewState.filter === 'all' ? 'btn--primary' : 'btn--ghost') + '" data-review-filter="all">All</button>';
      html += '<button class="btn btn--sm ' + (reviewState.filter === 'incorrect' ? 'btn--primary' : 'btn--ghost') + '" data-review-filter="incorrect">Incorrect</button>';
      html += '<button class="btn btn--sm ' + (reviewState.filter === 'flagged' ? 'btn--primary' : 'btn--ghost') + '" data-review-filter="flagged">Flagged</button>';
      html += '<button class="btn btn--secondary btn--sm" onclick="window.location.hash=\'#results\'">Back to Results</button>';
      html += '</div></div>';

      html += '<div class="test-question">';
      html += '<span class="badge badge--' + (answer.isCorrect ? 'easy' : 'hard') + '" style="margin-bottom:var(--space-sm)">' + (answer.isCorrect ? 'Correct' : 'Incorrect') + '</span>';
      html += '<div class="test-question__stem">' + Utils.escapeHTML(q.stem) + '</div>';

      // Options with color coding
      if (q.type === 'fill-in-the-blank') {
        html += '<p>Your answer: <strong>' + Utils.escapeHTML(answer.textAnswer) + '</strong></p>';
        html += '<p style="color:var(--color-success)">Correct answer: <strong>' + Utils.escapeHTML(q.correctAnswer) + (q.unit ? ' ' + q.unit : '') + '</strong></p>';
      } else if (q.type === 'ordered-response') {
        html += '<div class="option-list">';
        var orderedAns = answer.orderedAnswer || [];
        var optMap = {};
        q.options.forEach(function(o) { optMap[o.id] = o; });
        orderedAns.forEach(function(id, idx) {
          var opt = optMap[id];
          var isCorrectPos = q.correctOrder[idx] === id;
          html += '<div class="ordered-option ' + (isCorrectPos ? 'option-card--correct' : 'option-card--incorrect') + '">';
          html += '<div class="ordered-option__number">' + (idx + 1) + '</div>';
          html += '<div class="ordered-option__text">' + Utils.escapeHTML(opt ? opt.text : id) + '</div>';
          html += '</div>';
        });
        html += '</div>';
        html += '<p style="margin-top:var(--space-sm);color:var(--color-text-secondary)">Correct order: ' + q.correctOrder.join(', ') + '</p>';
      } else {
        html += '<div class="option-list">';
        q.options.forEach(function(opt) {
          var wasSelected = answer.selectedOptions.indexOf(opt.id) !== -1;
          var cls = 'option-card';
          if (opt.isCorrect) cls += ' option-card--correct';
          if (wasSelected && !opt.isCorrect) cls += ' option-card--incorrect';
          if (wasSelected) cls += ' option-card--selected';
          html += '<div class="' + cls + '">';
          html += '<div class="option-card__marker">' + opt.id + '</div>';
          html += '<div class="option-card__text">' + Utils.escapeHTML(opt.text) + '</div>';
          html += '</div>';
        });
        html += '</div>';
      }
      html += '</div>';

      // Rationale
      html += '<div class="rationale-box"><div class="rationale-box__title">Rationale</div>';
      html += '<p>' + Utils.escapeHTML(q.rationale) + '</p></div>';

      // Navigation
      html += '<div class="btn-group" style="margin-top:var(--space-lg)">';
      html += '<button class="btn btn--secondary" id="review-prev" ' + (reviewState.currentIdx === 0 ? 'disabled' : '') + '>Previous</button>';
      html += '<button class="btn btn--primary" id="review-next" ' + (reviewState.currentIdx >= filtered.length - 1 ? 'disabled' : '') + '>Next</button>';
      html += '</div>';

      html += '</div>';
      el.innerHTML = html;

      // Listeners
      el.querySelectorAll('[data-review-filter]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          reviewState.filter = btn.getAttribute('data-review-filter');
          reviewState.currentIdx = 0;
          renderReviewQuestion();
        });
      });
      var prevBtn = document.getElementById('review-prev');
      var nextBtn = document.getElementById('review-next');
      if (prevBtn) prevBtn.addEventListener('click', function() { reviewState.currentIdx--; renderReviewQuestion(); });
      if (nextBtn) nextBtn.addEventListener('click', function() { reviewState.currentIdx++; renderReviewQuestion(); });
    }

    renderReviewQuestion();
  }

  // ─── Question Bank State ───
  var qbState = {
    filters: { category: '', difficulty: '', type: '', search: '' },
    sortField: 'id',
    sortAsc: true,
    editingId: null,
    view: 'list' // 'list' | 'add' | 'edit' | 'import'
  };

  function renderQuestions() {
    var el = document.getElementById('screen-questions');
    var QBM = window.NCLEX.QuestionBankManager;
    var categories = DataStore.getCategories();

    // Build shell once
    el.innerHTML = '<div class="screen__content">' +
      '<div class="card__header" style="margin-bottom:var(--space-lg)">' +
      '<h1>Question Bank</h1>' +
      '<div class="btn-group">' +
      '<button class="btn btn--primary btn--sm" id="qb-add-btn">Add Question</button>' +
      '<button class="btn btn--secondary btn--sm" id="qb-import-btn">Import JSON</button>' +
      '<button class="btn btn--ghost btn--sm" id="qb-export-btn">Export</button>' +
      '</div>' +
      '</div>' +
      '<div id="qb-stats"></div>' +
      '<div id="qb-form-area"></div>' +
      '<div class="search-bar">' +
      '<span class="search-bar__icon">&#128269;</span>' +
      '<input type="text" class="search-bar__input" id="qb-search" placeholder="Search questions..." aria-label="Search questions">' +
      '</div>' +
      '<div class="filter-bar">' +
      '<select class="form-select" id="qb-filter-cat" aria-label="Filter by category"><option value="">All Categories</option></select>' +
      '<select class="form-select" id="qb-filter-diff" aria-label="Filter by difficulty">' +
      '<option value="">All Difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>' +
      '<select class="form-select" id="qb-filter-type" aria-label="Filter by type">' +
      '<option value="">All Types</option><option value="multiple-choice">Multiple Choice</option><option value="select-all-that-apply">SATA</option><option value="ordered-response">Ordered Response</option><option value="fill-in-the-blank">Fill in Blank</option></select>' +
      '</div>' +
      '<div id="qb-table"></div>' +
      '</div>';

    // Populate category filter
    var catSelect = document.getElementById('qb-filter-cat');
    if (categories && categories.categories) {
      categories.categories.forEach(function(cat) {
        catSelect.innerHTML += '<option value="' + cat.id + '">' + Utils.escapeHTML(cat.name) + '</option>';
      });
    }

    // Event delegation
    el.addEventListener('click', function(e) {
      var btn = e.target.closest('button') || e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-action') || btn.id;

      if (action === 'qb-add-btn') { showQuestionForm(null); }
      else if (action === 'qb-import-btn') { showImportForm(); }
      else if (action === 'qb-export-btn') { exportQuestions(); }
      else if (action === 'qb-edit') { showQuestionForm(btn.getAttribute('data-id')); }
      else if (action === 'qb-delete') { deleteQuestion(btn.getAttribute('data-id')); }
      else if (action === 'qb-form-cancel') { hideQuestionForm(); }
      else if (action === 'qb-form-save') { saveQuestionForm(); }
      else if (action === 'qb-import-execute') { executeImport(); }
      else if (action === 'qb-import-cancel') { hideQuestionForm(); }
      else if (action === 'qb-move-up') { moveOption(btn, -1); }
      else if (action === 'qb-move-down') { moveOption(btn, 1); }
      else if (action === 'qb-add-option') { addOptionRow(); }
      else if (action === 'qb-remove-option') { removeOptionRow(btn); }
    });

    // Filters
    var searchInput = document.getElementById('qb-search');
    searchInput.addEventListener('input', Utils.debounce(function() {
      qbState.filters.search = searchInput.value;
      refreshQuestionTable();
    }, 300));

    catSelect.addEventListener('change', function() { qbState.filters.category = catSelect.value; refreshQuestionTable(); });
    document.getElementById('qb-filter-diff').addEventListener('change', function(e) { qbState.filters.difficulty = e.target.value; refreshQuestionTable(); });
    document.getElementById('qb-filter-type').addEventListener('change', function(e) { qbState.filters.type = e.target.value; refreshQuestionTable(); });

    refreshQuestionStats();
    refreshQuestionTable();
  }

  function refreshQuestionStats() {
    var QBM = window.NCLEX.QuestionBankManager;
    QBM.getQuestionStats().then(function(stats) {
      var el = document.getElementById('qb-stats');
      if (!el) return;

      // Count verified/unverified/no-source
      DataStore.getQuestions().then(function(allQs) {
        var verified = 0, singleSource = 0, noSource = 0;
        allQs.forEach(function(q) {
          if (q.verified) verified++;
          else if (q.sources && q.sources.length > 0) singleSource++;
          else noSource++;
        });

        var html = '<div class="stats-grid" style="margin-bottom:var(--space-lg)">';
        html += '<div class="stat-card"><div class="stat-card__value">' + stats.total + '</div><div class="stat-card__label">Total Questions</div></div>';
        html += '<div class="stat-card"><div class="stat-card__value" style="color:var(--color-success)">' + verified + '</div><div class="stat-card__label">Verified</div></div>';
        html += '<div class="stat-card"><div class="stat-card__value" style="color:#a16207">' + singleSource + '</div><div class="stat-card__label">Single Source</div></div>';
        html += '<div class="stat-card"><div class="stat-card__value">' + noSource + '</div><div class="stat-card__label">Sample</div></div>';
        html += '</div>';
        html += '<div class="stats-grid" style="margin-bottom:var(--space-lg)">';
        html += '<div class="stat-card"><div class="stat-card__value">' + (stats.byDifficulty.easy || 0) + '</div><div class="stat-card__label">Easy</div></div>';
        html += '<div class="stat-card"><div class="stat-card__value">' + (stats.byDifficulty.medium || 0) + '</div><div class="stat-card__label">Medium</div></div>';
        html += '<div class="stat-card"><div class="stat-card__value">' + (stats.byDifficulty.hard || 0) + '</div><div class="stat-card__label">Hard</div></div>';
        html += '</div>';

      // Category bar chart
      html += '<div class="card" style="margin-bottom:var(--space-lg)">';
      html += '<h3>Questions by Category</h3>';
      html += '<div class="bar-chart">';
      for (var catId in stats.byCategory) {
        var cat = stats.byCategory[catId];
        var pct = stats.total > 0 ? Math.round((cat.count / stats.total) * 100) : 0;
        var color = pct >= 20 ? 'green' : (pct >= 10 ? 'yellow' : 'red');
        html += '<div class="bar-chart__item">';
        html += '<div class="bar-chart__label" title="' + Utils.escapeHTML(cat.name) + '">' + Utils.escapeHTML(cat.name) + '</div>';
        html += '<div class="bar-chart__track"><div class="bar-chart__fill bar-chart__fill--' + color + '" style="width:' + pct + '%"></div></div>';
        html += '<div class="bar-chart__value">' + cat.count + '</div>';
        html += '</div>';
      }
      html += '</div>';
      if (stats.total < 20) {
        html += '<div class="card card--warning" style="margin-top:var(--space-md);padding:var(--space-sm) var(--space-md)">' +
          '<small>Low question count. Consider importing more questions for better test generation.</small></div>';
      }
        html += '</div>';
        el.innerHTML = html;
      });
    });
  }

  function refreshQuestionTable() {
    var QBM = window.NCLEX.QuestionBankManager;
    var filters = {};
    if (qbState.filters.category) filters.category = qbState.filters.category;
    if (qbState.filters.difficulty) filters.difficulty = qbState.filters.difficulty;
    if (qbState.filters.type) filters.type = qbState.filters.type;
    if (qbState.filters.search) filters.search = qbState.filters.search;

    QBM.loadQuestions(filters).then(function(questions) {
      // Sort
      questions.sort(function(a, b) {
        var va = a[qbState.sortField] || '';
        var vb = b[qbState.sortField] || '';
        if (va < vb) return qbState.sortAsc ? -1 : 1;
        if (va > vb) return qbState.sortAsc ? 1 : -1;
        return 0;
      });

      var el = document.getElementById('qb-table');
      if (!el) return;

      if (questions.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="empty-state__title">No questions found</div>' +
          '<p class="empty-state__text">Try adjusting your filters or add new questions.</p></div>';
        return;
      }

      var categories = DataStore.getCategories();
      var catMap = {};
      if (categories && categories.categories) {
        categories.categories.forEach(function(c) { catMap[c.id] = c.name; });
      }

      var typeLabels = { 'multiple-choice': 'MC', 'select-all-that-apply': 'SATA', 'ordered-response': 'Ordered', 'fill-in-the-blank': 'Fill-in' };
      var typeBadge = { 'multiple-choice': 'mc', 'select-all-that-apply': 'sata', 'ordered-response': 'ordered', 'fill-in-the-blank': 'fill' };

      var html = '<div class="table-wrapper"><table class="table">';
      html += '<thead><tr>';
      html += '<th data-sort="id">ID</th>';
      html += '<th data-sort="stem">Question</th>';
      html += '<th data-sort="category">Category</th>';
      html += '<th data-sort="difficulty">Difficulty</th>';
      html += '<th data-sort="type">Type</th>';
      html += '<th>Source</th>';
      html += '<th>Actions</th>';
      html += '</tr></thead><tbody>';

      questions.forEach(function(q) {
        var shortStem = q.stem.length > 80 ? q.stem.substring(0, 80) + '...' : q.stem;
        var sourceCount = (q.sources && q.sources.length) || 0;
        var verifiedBadge = '';
        if (q.verified) {
          verifiedBadge = '<span class="badge badge--verified" title="Verified in ' + sourceCount + ' sources">Verified</span>';
        } else if (sourceCount > 0) {
          verifiedBadge = '<span class="badge badge--unverified" title="Single source - needs cross-verification">1 Source</span>';
        } else {
          verifiedBadge = '<span class="badge badge--no-source" title="No external source">Sample</span>';
        }
        html += '<tr>';
        html += '<td><small>' + Utils.escapeHTML(q.id.substring(0, 8)) + '</small></td>';
        html += '<td>' + Utils.escapeHTML(shortStem) + '</td>';
        html += '<td><small>' + Utils.escapeHTML(catMap[q.category] || q.category) + '</small></td>';
        html += '<td><span class="badge badge--' + q.difficulty + '">' + q.difficulty + '</span></td>';
        html += '<td><span class="badge badge--' + typeBadge[q.type] + '">' + typeLabels[q.type] + '</span></td>';
        html += '<td>' + verifiedBadge + '</td>';
        html += '<td><div class="btn-group">';
        html += '<button class="btn btn--ghost btn--sm" data-action="qb-edit" data-id="' + q.id + '">Edit</button>';
        html += '<button class="btn btn--ghost btn--sm" data-action="qb-delete" data-id="' + q.id + '" style="color:var(--color-error)">Delete</button>';
        html += '</div></td>';
        html += '</tr>';
      });

      html += '</tbody></table></div>';
      el.innerHTML = html;

      // Sort headers
      el.querySelectorAll('th[data-sort]').forEach(function(th) {
        th.addEventListener('click', function() {
          var field = th.getAttribute('data-sort');
          if (qbState.sortField === field) { qbState.sortAsc = !qbState.sortAsc; }
          else { qbState.sortField = field; qbState.sortAsc = true; }
          refreshQuestionTable();
        });
      });
    });
  }

  function showQuestionForm(editId) {
    var formArea = document.getElementById('qb-form-area');
    if (!formArea) return;
    var categories = DataStore.getCategories();
    var q = editId ? DataStore.getQuestionById(editId) : null;
    qbState.editingId = editId;

    var html = '<div class="card" style="margin-bottom:var(--space-lg)">';
    html += '<h3>' + (q ? 'Edit Question' : 'Add New Question') + '</h3>';

    // Type selector
    html += '<div class="form-group"><label class="form-label">Question Type</label>';
    html += '<select class="form-select" id="qf-type">';
    Models.QUESTION_TYPES.forEach(function(t) {
      var labels = { 'multiple-choice': 'Multiple Choice', 'select-all-that-apply': 'Select All That Apply', 'ordered-response': 'Ordered Response', 'fill-in-the-blank': 'Fill in the Blank' };
      html += '<option value="' + t + '"' + (q && q.type === t ? ' selected' : '') + '>' + labels[t] + '</option>';
    });
    html += '</select></div>';

    // Category
    html += '<div class="form-group"><label class="form-label">Category</label>';
    html += '<select class="form-select" id="qf-category">';
    html += '<option value="">Select category...</option>';
    if (categories && categories.categories) {
      categories.categories.forEach(function(cat) {
        html += '<option value="' + cat.id + '"' + (q && q.category === cat.id ? ' selected' : '') + '>' + Utils.escapeHTML(cat.name) + '</option>';
      });
    }
    html += '</select></div>';

    // Subcategory
    html += '<div class="form-group"><label class="form-label">Subcategory</label>';
    html += '<select class="form-select" id="qf-subcategory">';
    html += '<option value="">Select subcategory...</option>';
    if (categories && categories.categories) {
      categories.categories.forEach(function(cat) {
        if (cat.subcategories) {
          cat.subcategories.forEach(function(sub) {
            html += '<option value="' + sub.id + '" data-parent="' + cat.id + '"' + (q && q.subcategory === sub.id ? ' selected' : '') + '>' + Utils.escapeHTML(sub.name) + '</option>';
          });
        }
      });
    }
    html += '</select></div>';

    // Difficulty
    html += '<div class="form-group"><label class="form-label">Difficulty</label>';
    html += '<select class="form-select" id="qf-difficulty">';
    Models.DIFFICULTIES.forEach(function(d) {
      html += '<option value="' + d + '"' + (q && q.difficulty === d ? ' selected' : '') + '>' + d.charAt(0).toUpperCase() + d.slice(1) + '</option>';
    });
    html += '</select></div>';

    // Stem
    html += '<div class="form-group"><label class="form-label">Question Stem</label>';
    html += '<textarea class="form-textarea" id="qf-stem" rows="3" placeholder="Enter the question...">' + (q ? Utils.escapeHTML(q.stem) : '') + '</textarea></div>';

    // Options area (dynamic based on type)
    html += '<div id="qf-options-area"></div>';

    // Rationale
    html += '<div class="form-group"><label class="form-label">Rationale</label>';
    html += '<textarea class="form-textarea" id="qf-rationale" rows="3" placeholder="Explain the correct answer...">' + (q ? Utils.escapeHTML(q.rationale) : '') + '</textarea></div>';

    // Tags
    html += '<div class="form-group"><label class="form-label">Tags (comma separated)</label>';
    html += '<input type="text" class="form-input" id="qf-tags" value="' + (q && q.tags ? q.tags.join(', ') : '') + '" placeholder="e.g. pharmacology, cardiac"></div>';

    // Buttons
    html += '<div class="btn-group" style="margin-top:var(--space-md)">';
    html += '<button class="btn btn--primary" data-action="qb-form-save">' + (q ? 'Update' : 'Add') + ' Question</button>';
    html += '<button class="btn btn--secondary" data-action="qb-form-cancel">Cancel</button>';
    html += '</div></div>';

    formArea.innerHTML = html;

    // Dynamic options based on type
    var typeSelect = document.getElementById('qf-type');
    function renderOptionsForType() {
      var type = typeSelect.value;
      renderQuestionOptions(type, q && q.type === type ? q : null);
    }
    typeSelect.addEventListener('change', renderOptionsForType);
    renderOptionsForType();

    // Filter subcategories based on category
    var catSelect = document.getElementById('qf-category');
    catSelect.addEventListener('change', function() {
      var subSelect = document.getElementById('qf-subcategory');
      var opts = subSelect.querySelectorAll('option[data-parent]');
      opts.forEach(function(opt) {
        opt.style.display = (!catSelect.value || opt.getAttribute('data-parent') === catSelect.value) ? '' : 'none';
      });
    });
    catSelect.dispatchEvent(new Event('change'));

    formArea.scrollIntoView({ behavior: 'smooth' });
  }

  function renderQuestionOptions(type, existingQuestion) {
    var area = document.getElementById('qf-options-area');
    if (!area) return;
    var html = '';

    if (type === 'fill-in-the-blank') {
      html += '<div class="form-group"><label class="form-label">Correct Answer</label>';
      html += '<input type="text" class="form-input" id="qf-correct-answer" value="' + (existingQuestion ? Utils.escapeHTML(existingQuestion.correctAnswer || '') : '') + '"></div>';
      html += '<div class="form-group"><label class="form-label">Acceptable Answers (comma separated)</label>';
      html += '<input type="text" class="form-input" id="qf-acceptable-answers" value="' + (existingQuestion && existingQuestion.acceptableAnswers ? existingQuestion.acceptableAnswers.join(', ') : '') + '"></div>';
      html += '<div class="form-group"><label class="form-label">Unit</label>';
      html += '<input type="text" class="form-input" id="qf-unit" value="' + (existingQuestion ? Utils.escapeHTML(existingQuestion.unit || '') : '') + '" placeholder="e.g. mL, mg"></div>';
    } else {
      var options = existingQuestion && existingQuestion.options ? existingQuestion.options : [
        { id: 'A', text: '', isCorrect: false },
        { id: 'B', text: '', isCorrect: false },
        { id: 'C', text: '', isCorrect: false },
        { id: 'D', text: '', isCorrect: false }
      ];

      html += '<div class="form-group"><label class="form-label">Options</label>';
      html += '<div id="qf-options-list">';

      options.forEach(function(opt, idx) {
        html += buildOptionRow(opt, idx, type, existingQuestion);
      });

      html += '</div>';
      html += '<button class="btn btn--ghost btn--sm" data-action="qb-add-option" style="margin-top:var(--space-sm)">+ Add Option</button>';
      html += '</div>';

      if (type === 'ordered-response') {
        html += '<div class="form-group"><label class="form-label">Correct Order (use arrows to reorder options above, top-to-bottom = correct order)</label>';
        html += '<p class="form-hint">The order shown above represents the correct order. Use the arrows to arrange.</p></div>';
      }
    }

    area.innerHTML = html;
  }

  function buildOptionRow(opt, idx, type, existingQuestion) {
    var letter = String.fromCharCode(65 + idx);
    var html = '<div class="ordered-option" data-option-index="' + idx + '">';
    html += '<div class="ordered-option__number">' + letter + '</div>';
    html += '<input type="text" class="form-input" style="flex:1" value="' + Utils.escapeHTML(opt.text) + '" data-option-text placeholder="Option ' + letter + ' text">';

    if (type === 'ordered-response') {
      html += '<div class="ordered-option__controls">';
      html += '<button class="ordered-option__btn" data-action="qb-move-up" title="Move up" aria-label="Move up">&uarr;</button>';
      html += '<button class="ordered-option__btn" data-action="qb-move-down" title="Move down" aria-label="Move down">&darr;</button>';
      html += '</div>';
    } else if (type === 'multiple-choice') {
      html += '<label class="form-checkbox" style="margin-left:var(--space-sm)">';
      html += '<input type="radio" name="qf-correct" value="' + idx + '"' + (opt.isCorrect ? ' checked' : '') + '>';
      html += '<span>Correct</span></label>';
    } else {
      html += '<label class="form-checkbox" style="margin-left:var(--space-sm)">';
      html += '<input type="checkbox" data-correct-check value="' + idx + '"' + (opt.isCorrect ? ' checked' : '') + '>';
      html += '<span>Correct</span></label>';
    }

    html += '<button class="btn btn--ghost btn--sm" data-action="qb-remove-option" style="color:var(--color-error)" aria-label="Remove option">&times;</button>';
    html += '</div>';
    return html;
  }

  function addOptionRow() {
    var list = document.getElementById('qf-options-list');
    if (!list) return;
    var idx = list.children.length;
    var type = document.getElementById('qf-type').value;
    var temp = document.createElement('div');
    temp.innerHTML = buildOptionRow({ id: String.fromCharCode(65 + idx), text: '', isCorrect: false }, idx, type, null);
    list.appendChild(temp.firstElementChild);
  }

  function removeOptionRow(btn) {
    var row = btn.closest('.ordered-option');
    if (row) row.remove();
  }

  function moveOption(btn, direction) {
    var row = btn.closest('.ordered-option');
    var list = row.parentNode;
    var items = Array.from(list.children);
    var idx = items.indexOf(row);
    if (direction === -1 && idx > 0) {
      list.insertBefore(row, items[idx - 1]);
    } else if (direction === 1 && idx < items.length - 1) {
      list.insertBefore(items[idx + 1], row);
    }
    // Re-number
    Array.from(list.children).forEach(function(item, i) {
      var num = item.querySelector('.ordered-option__number');
      if (num) num.textContent = String.fromCharCode(65 + i);
    });
  }

  function saveQuestionForm() {
    var type = document.getElementById('qf-type').value;
    var data = {
      type: type,
      category: document.getElementById('qf-category').value,
      subcategory: document.getElementById('qf-subcategory').value,
      difficulty: document.getElementById('qf-difficulty').value,
      stem: document.getElementById('qf-stem').value.trim(),
      rationale: document.getElementById('qf-rationale').value.trim(),
      tags: document.getElementById('qf-tags').value.split(',').map(function(t) { return t.trim(); }).filter(Boolean)
    };

    if (type === 'fill-in-the-blank') {
      data.correctAnswer = document.getElementById('qf-correct-answer').value.trim();
      data.acceptableAnswers = document.getElementById('qf-acceptable-answers').value.split(',').map(function(a) { return a.trim(); }).filter(Boolean);
      data.unit = document.getElementById('qf-unit').value.trim();
      data.options = [];
    } else {
      var optRows = document.querySelectorAll('#qf-options-list .ordered-option');
      data.options = [];

      optRows.forEach(function(row, i) {
        var text = row.querySelector('[data-option-text]').value.trim();
        var letter = String.fromCharCode(65 + i);
        var isCorrect = false;

        if (type === 'multiple-choice') {
          var radio = row.querySelector('input[type="radio"]');
          isCorrect = radio ? radio.checked : false;
        } else if (type === 'select-all-that-apply') {
          var check = row.querySelector('[data-correct-check]');
          isCorrect = check ? check.checked : false;
        }

        data.options.push({ id: letter, text: text, isCorrect: isCorrect });
      });

      if (type === 'ordered-response') {
        data.correctOrder = data.options.map(function(o) { return o.id; });
      }
    }

    var QBM = window.NCLEX.QuestionBankManager;
    var promise;
    if (qbState.editingId) {
      promise = QBM.updateQuestion(qbState.editingId, data);
    } else {
      promise = QBM.addQuestion(data);
    }

    promise.then(function() {
      Toast.success(qbState.editingId ? 'Question updated' : 'Question added');
      hideQuestionForm();
      refreshQuestionStats();
      refreshQuestionTable();
    }).catch(function(err) {
      Toast.error('Validation failed: ' + (err.errors ? err.errors.join(', ') : 'Unknown error'));
    });
  }

  function hideQuestionForm() {
    var formArea = document.getElementById('qb-form-area');
    if (formArea) formArea.innerHTML = '';
    qbState.editingId = null;
  }

  function deleteQuestion(id) {
    Modal.show({
      title: 'Delete Question',
      body: '<p>Are you sure you want to delete this question? This cannot be undone.</p>',
      confirmText: 'Delete',
      confirmType: 'danger',
      cancelText: 'Cancel',
      onConfirm: function() {
        window.NCLEX.QuestionBankManager.removeQuestion(id).then(function() {
          Toast.success('Question deleted');
          refreshQuestionStats();
          refreshQuestionTable();
        });
      }
    });
  }

  function showImportForm() {
    var formArea = document.getElementById('qb-form-area');
    if (!formArea) return;

    var html = '<div class="card" style="margin-bottom:var(--space-lg)">';
    html += '<h3>Import Questions</h3>';
    html += '<div class="drop-zone" id="qb-drop-zone">';
    html += '<p>Drag & drop a JSON file here, or click to browse</p>';
    html += '<input type="file" id="qb-file-input" accept=".json" style="display:none">';
    html += '</div>';
    html += '<div class="form-group" style="margin-top:var(--space-md)">';
    html += '<label class="form-label">Or paste JSON directly</label>';
    html += '<textarea class="form-textarea" id="qb-import-json" rows="6" placeholder=\'[{"id":"q100","type":"multiple-choice",...}]\'></textarea>';
    html += '</div>';
    html += '<div id="qb-import-preview"></div>';
    html += '<div class="btn-group" style="margin-top:var(--space-md)">';
    html += '<button class="btn btn--primary" data-action="qb-import-execute">Import</button>';
    html += '<button class="btn btn--secondary" data-action="qb-import-cancel">Cancel</button>';
    html += '</div></div>';

    formArea.innerHTML = html;

    // Drop zone
    var dropZone = document.getElementById('qb-drop-zone');
    var fileInput = document.getElementById('qb-file-input');

    dropZone.addEventListener('click', function() { fileInput.click(); });
    dropZone.addEventListener('dragover', function(e) { e.preventDefault(); dropZone.classList.add('drop-zone--active'); });
    dropZone.addEventListener('dragleave', function() { dropZone.classList.remove('drop-zone--active'); });
    dropZone.addEventListener('drop', function(e) {
      e.preventDefault();
      dropZone.classList.remove('drop-zone--active');
      var file = e.dataTransfer.files[0];
      if (file) readImportFile(file);
    });

    fileInput.addEventListener('change', function() {
      if (fileInput.files[0]) readImportFile(fileInput.files[0]);
    });

    formArea.scrollIntoView({ behavior: 'smooth' });
  }

  function readImportFile(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('qb-import-json').value = e.target.result;
      previewImport(e.target.result);
    };
    reader.readAsText(file);
  }

  function previewImport(jsonStr) {
    var preview = document.getElementById('qb-import-preview');
    if (!preview) return;
    try {
      var data = JSON.parse(jsonStr);
      if (!Array.isArray(data)) { preview.innerHTML = '<div class="card card--error"><p>JSON must be an array of questions.</p></div>'; return; }

      var valid = 0; var invalid = 0;
      data.forEach(function(q) {
        var v = Models.validateQuestion(Models.createQuestion(q));
        if (v.valid) valid++; else invalid++;
      });

      preview.innerHTML = '<div class="card card--info" style="margin-top:var(--space-md)">' +
        '<p>Found <strong>' + data.length + '</strong> questions: <strong>' + valid + '</strong> valid, <strong>' + invalid + '</strong> with errors.</p></div>';
    } catch (e) {
      preview.innerHTML = '<div class="card card--error" style="margin-top:var(--space-md)"><p>Invalid JSON: ' + Utils.escapeHTML(e.message) + '</p></div>';
    }
  }

  function executeImport() {
    var jsonStr = document.getElementById('qb-import-json').value.trim();
    if (!jsonStr) { Toast.warning('No JSON provided'); return; }
    try {
      var data = JSON.parse(jsonStr);
      if (!Array.isArray(data)) { Toast.error('JSON must be an array'); return; }

      window.NCLEX.QuestionBankManager.addBulkQuestions(data).then(function(result) {
        Toast.success('Imported ' + result.added + ' questions (' + result.skipped + ' skipped, ' + result.errors.length + ' errors)');
        hideQuestionForm();
        refreshQuestionStats();
        refreshQuestionTable();
      });
    } catch (e) {
      Toast.error('Invalid JSON: ' + e.message);
    }
  }

  function exportQuestions() {
    window.NCLEX.QuestionBankManager.exportQuestions().then(function(questions) {
      var blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'nclex-questions-' + new Date().toISOString().split('T')[0] + '.json';
      a.click();
      URL.revokeObjectURL(url);
      Toast.success('Questions exported');
    });
  }

  function renderAnalytics() {
    var el = document.getElementById('screen-analytics');
    var ALE = window.NCLEX.AdaptiveLearningEngine;
    var SE = window.NCLEX.ScoringEngine;

    el.innerHTML = '<div class="screen__content"><h1>Analytics</h1><div id="analytics-content"><div class="screen__loading">Loading analytics...</div></div></div>';

    ALE.analyzePerformance().then(function(profile) {
      var content = document.getElementById('analytics-content');
      if (!profile) {
        content.innerHTML = '<div class="empty-state"><div class="empty-state__title">No Data Yet</div><p class="empty-state__text">Complete at least one test to see analytics.</p>' +
          '<button class="btn btn--primary" onclick="window.location.hash=\'#test-config\'">Take a Test</button></div>';
        return;
      }

      var html = '';

      // Score trend chart
      html += '<div class="chart-container"><div class="chart-container__title">Score Trend</div>';
      html += '<canvas id="score-trend-canvas" class="trend-canvas" width="800" height="200"></canvas>';
      html += '<div style="text-align:center;margin-top:var(--space-sm);font-size:var(--font-size-sm);color:var(--color-text-secondary)">';
      html += 'Trend: <strong style="color:var(--color-' + (profile.trends.direction === 'improving' ? 'success' : profile.trends.direction === 'declining' ? 'error' : 'warning') + ')">' +
        profile.trends.direction + '</strong> | Recent avg: ' + Math.round(profile.trends.recentAvg) + '%';
      html += '</div></div>';

      // Category mastery
      html += '<div class="chart-container"><div class="chart-container__title">Category Mastery</div>';
      html += '<div class="bar-chart">';
      var catEntries = Object.entries(profile.categoryAnalysis);
      catEntries.sort(function(a, b) { return b[1].priority - a[1].priority; });
      catEntries.forEach(function(entry) {
        var data = entry[1];
        var pct = Math.round(data.accuracy);
        var color = pct >= 80 ? 'green' : (pct >= 65 ? 'yellow' : (pct >= 50 ? 'orange' : 'red'));
        if (data.level === 'untested') color = 'blue';
        html += '<div class="bar-chart__item">';
        html += '<div class="bar-chart__label" title="' + Utils.escapeHTML(data.name) + '">' + Utils.escapeHTML(data.name) + '</div>';
        html += '<div class="bar-chart__track"><div class="bar-chart__fill bar-chart__fill--' + color + '" style="width:' + Math.max(pct, 2) + '%"></div></div>';
        html += '<div class="bar-chart__value">' + (data.level === 'untested' ? 'N/A' : pct + '%') + '</div>';
        html += '</div>';
      });
      html += '</div></div>';

      // Difficulty breakdown
      html += '<div class="chart-container"><div class="chart-container__title">Difficulty Performance</div>';
      html += '<div class="bar-chart">';
      ['easy', 'medium', 'hard'].forEach(function(diff) {
        var data = profile.difficultyReadiness[diff] || { accuracy: 0, total: 0 };
        var pct = Math.round(data.accuracy);
        var color = pct >= 80 ? 'green' : (pct >= 65 ? 'yellow' : 'red');
        html += '<div class="bar-chart__item">';
        html += '<div class="bar-chart__label">' + diff.charAt(0).toUpperCase() + diff.slice(1) + '</div>';
        html += '<div class="bar-chart__track"><div class="bar-chart__fill bar-chart__fill--' + color + '" style="width:' + Math.max(pct, 2) + '%"></div></div>';
        html += '<div class="bar-chart__value">' + pct + '% (' + data.total + ')</div>';
        html += '</div>';
      });
      html += '</div></div>';

      // Question type breakdown
      html += '<div class="chart-container"><div class="chart-container__title">Performance by Question Type</div>';
      html += '<div class="bar-chart">';
      var typeLabels = { 'multiple-choice': 'Multiple Choice', 'select-all-that-apply': 'SATA', 'ordered-response': 'Ordered Response', 'fill-in-the-blank': 'Fill in Blank' };
      for (var type in profile.typeAnalysis) {
        var tData = profile.typeAnalysis[type];
        var tPct = Math.round(tData.accuracy);
        var tColor = tPct >= 80 ? 'green' : (tPct >= 65 ? 'yellow' : 'red');
        html += '<div class="bar-chart__item">';
        html += '<div class="bar-chart__label">' + (typeLabels[type] || type) + '</div>';
        html += '<div class="bar-chart__track"><div class="bar-chart__fill bar-chart__fill--' + tColor + '" style="width:' + Math.max(tPct, 2) + '%"></div></div>';
        html += '<div class="bar-chart__value">' + tPct + '% (' + tData.total + ')</div>';
        html += '</div>';
      }
      html += '</div></div>';

      // Study plan
      if (profile.studyRecommendations.length > 0) {
        html += '<div class="chart-container"><div class="chart-container__title">Study Plan</div>';
        html += '<div style="display:flex;flex-direction:column;gap:var(--space-sm)">';
        profile.studyRecommendations.forEach(function(rec) {
          var tierColors = { Focus: 'error', Review: 'warning', Maintain: 'success', Explore: 'info' };
          html += '<div class="card" style="padding:var(--space-md)">';
          html += '<div style="display:flex;justify-content:space-between;align-items:center">';
          html += '<div><span class="badge badge--' + (rec.tier === 'Focus' ? 'hard' : rec.tier === 'Review' ? 'medium' : 'easy') + '">' + rec.tier + '</span> ';
          html += '<strong>' + Utils.escapeHTML(rec.categoryName) + '</strong></div>';
          html += '<div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">' + rec.accuracy + '% accuracy</div>';
          html += '</div>';
          html += '<div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-top:var(--space-xs)">' + rec.action + ' (~' + rec.suggestedQuestions + ' questions)</div>';
          html += '</div>';
        });
        html += '</div></div>';
      }

      content.innerHTML = html;

      // Pattern insights (appended async after main content is set)
      ALE.detectPatterns().then(function(patterns) {
        if (!patterns || patterns.length === 0) return;
        var pHtml = '<div class="chart-container"><div class="chart-container__title">Pattern Insights</div>';
        patterns.forEach(function(p) {
          pHtml += '<div class="card card--warning" style="margin-bottom:var(--space-sm);padding:var(--space-md)"><p>' + Utils.escapeHTML(p.message) + '</p></div>';
        });
        pHtml += '</div>';
        content.insertAdjacentHTML('beforeend', pHtml);
      });

      // Test history table (appended async)
      DataStore.getSessions().then(function(sessions) {
        var completed = sessions.filter(function(s) { return s.status === 'completed'; }).reverse();
        if (completed.length === 0) return;

        var tHtml = '<div class="chart-container"><div class="chart-container__title">Test History</div>';
        tHtml += '<div class="table-wrapper"><table class="table"><thead><tr>';
        tHtml += '<th>Date</th><th>Mode</th><th>Questions</th><th>Score</th><th>Time</th><th>Result</th>';
        tHtml += '</tr></thead><tbody>';
        completed.forEach(function(s) {
          var score = s.score != null ? Math.round(s.score) : 0;
          tHtml += '<tr style="cursor:pointer" onclick="window.location.hash=\'#results?sid=' + s.id + '\'">';
          tHtml += '<td>' + Utils.formatDateTime(s.completedAt) + '</td>';
          tHtml += '<td>' + s.mode + '</td>';
          tHtml += '<td>' + s.answers.length + '</td>';
          tHtml += '<td><strong>' + score + '%</strong></td>';
          tHtml += '<td>' + Utils.formatTime(s.elapsedSeconds) + '</td>';
          tHtml += '<td><span class="badge badge--' + (score >= 65 ? 'easy' : 'hard') + '">' + (score >= 65 ? 'Pass' : 'Fail') + '</span></td>';
          tHtml += '</tr>';
        });
        tHtml += '</tbody></table></div></div>';
        content.insertAdjacentHTML('beforeend', tHtml);
      });

      // Draw score trend chart
      setTimeout(function() {
        drawScoreTrendChart(profile.trends.scores);
      }, 100);
    });
  }

  function drawScoreTrendChart(scores) {
    var canvas = document.getElementById('score-trend-canvas');
    if (!canvas || !scores || scores.length === 0) return;

    var ctx = canvas.getContext('2d');
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * (window.devicePixelRatio || 1);
    canvas.height = rect.height * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    var w = rect.width;
    var h = rect.height;
    var padding = { top: 20, right: 20, bottom: 30, left: 40 };
    var chartW = w - padding.left - padding.right;
    var chartH = h - padding.top - padding.bottom;

    // Background
    var computedStyle = getComputedStyle(document.documentElement);
    var textColor = computedStyle.getPropertyValue('--color-text-secondary').trim() || '#64748b';
    var borderColor = computedStyle.getPropertyValue('--color-border').trim() || '#e2e8f0';
    var primaryColor = computedStyle.getPropertyValue('--color-primary').trim() || '#1a73e8';
    var successColor = computedStyle.getPropertyValue('--color-success').trim() || '#0d9488';

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 0.5;
    for (var y = 0; y <= 100; y += 25) {
      var yPos = padding.top + chartH - (y / 100) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(w - padding.right, yPos);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(y + '%', padding.left - 5, yPos + 4);
    }

    // Passing threshold line
    var thresholdY = padding.top + chartH - (65 / 100) * chartH;
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding.left, thresholdY);
    ctx.lineTo(w - padding.right, thresholdY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#dc2626';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('65% Pass', w - padding.right + 3, thresholdY + 3);

    if (scores.length < 2) {
      // Single point
      var px = padding.left + chartW / 2;
      var py = padding.top + chartH - (scores[0] / 100) * chartH;
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(scores[0]) + '%', px, py - 10);
      return;
    }

    // Line chart
    var stepX = chartW / (scores.length - 1);

    // Area fill
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartH - (scores[0] / 100) * chartH);
    for (var i = 1; i < scores.length; i++) {
      ctx.lineTo(padding.left + i * stepX, padding.top + chartH - (scores[i] / 100) * chartH);
    }
    ctx.lineTo(padding.left + (scores.length - 1) * stepX, padding.top + chartH);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = primaryColor + '20';
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartH - (scores[0] / 100) * chartH);
    for (var j = 1; j < scores.length; j++) {
      ctx.lineTo(padding.left + j * stepX, padding.top + chartH - (scores[j] / 100) * chartH);
    }
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Points
    for (var k = 0; k < scores.length; k++) {
      var x = padding.left + k * stepX;
      var y = padding.top + chartH - (scores[k] / 100) * chartH;
      ctx.fillStyle = scores[k] >= 65 ? successColor : '#dc2626';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = textColor;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(scores[k]) + '%', x, y - 8);

      // X label
      ctx.fillText('Test ' + (k + 1), x, h - 5);
    }
  }

  function renderSettings() {
    var el = document.getElementById('screen-settings');

    DataStore.getUserProfile().then(function(profile) {
      var settings = profile.settings || {};

      var html = '<div class="screen__content">';
      html += '<h1>Settings</h1>';

      // Profile
      html += '<div class="settings-section">';
      html += '<div class="settings-section__title">Profile</div>';
      html += '<div class="form-group"><label class="form-label">Name</label>';
      html += '<input type="text" class="form-input" id="settings-name" value="' + Utils.escapeHTML(profile.name || '') + '" placeholder="Enter your name" style="max-width:300px"></div>';
      html += '</div>';

      // Defaults
      html += '<div class="settings-section">';
      html += '<div class="settings-section__title">Defaults</div>';
      html += '<div class="settings-row"><div><div class="settings-row__label">Default Question Count</div></div>';
      html += '<select class="form-select" id="settings-default-count" style="width:auto">';
      [25, 50, 75, 100, 145].forEach(function(n) {
        html += '<option value="' + n + '"' + (settings.defaultQuestionCount === n ? ' selected' : '') + '>' + n + '</option>';
      });
      html += '</select></div>';
      html += '<div class="settings-row"><div><div class="settings-row__label">Show Rationale Immediately</div><div class="settings-row__desc">Display explanations after each answer</div></div>';
      html += '<button class="toggle' + (settings.showRationaleImmediately ? ' toggle--active' : '') + '" id="settings-rationale-toggle" aria-label="Toggle rationale mode"></button></div>';
      html += '</div>';

      // Appearance
      html += '<div class="settings-section">';
      html += '<div class="settings-section__title">Appearance</div>';
      html += '<div class="settings-row"><div><div class="settings-row__label">Dark Mode</div></div>';
      html += '<button class="toggle' + (settings.theme === 'dark' ? ' toggle--active' : '') + '" id="settings-theme-toggle" aria-label="Toggle dark mode"></button></div>';
      html += '<div class="settings-row"><div><div class="settings-row__label">Font Size</div></div>';
      html += '<select class="form-select" id="settings-font-size" style="width:auto">';
      ['small', 'medium', 'large'].forEach(function(s) {
        html += '<option value="' + s + '"' + (settings.fontSize === s ? ' selected' : '') + '>' + s.charAt(0).toUpperCase() + s.slice(1) + '</option>';
      });
      html += '</select></div>';
      html += '</div>';

      // Data management
      html += '<div class="settings-section">';
      html += '<div class="settings-section__title">Data Management</div>';
      html += '<div class="settings-row"><div><div class="settings-row__label">Export All Data</div><div class="settings-row__desc">Download questions, sessions, and settings</div></div>';
      html += '<button class="btn btn--secondary btn--sm" id="settings-export">Export</button></div>';
      html += '<div class="settings-row"><div><div class="settings-row__label">Import Data</div><div class="settings-row__desc">Restore from a previous export</div></div>';
      html += '<button class="btn btn--secondary btn--sm" id="settings-import">Import</button>';
      html += '<input type="file" id="settings-import-file" accept=".json" style="display:none"></div>';
      html += '<div class="settings-row"><div><div class="settings-row__label">Reset All Data</div><div class="settings-row__desc">Delete all sessions, scores, and return to default state</div></div>';
      html += '<button class="btn btn--danger btn--sm" id="settings-reset">Reset</button></div>';
      html += '</div>';

      html += '</div>';
      el.innerHTML = html;

      // ─── Settings Event Listeners ───

      // Name
      document.getElementById('settings-name').addEventListener('change', function(e) {
        DataStore.updateUserProfile({ name: e.target.value.trim() });
        Toast.success('Name updated');
      });

      // Default count
      document.getElementById('settings-default-count').addEventListener('change', function(e) {
        DataStore.updateUserProfile({ settings: { defaultQuestionCount: parseInt(e.target.value) } });
        Toast.success('Default updated');
      });

      // Rationale toggle
      document.getElementById('settings-rationale-toggle').addEventListener('click', function() {
        this.classList.toggle('toggle--active');
        DataStore.updateUserProfile({ settings: { showRationaleImmediately: this.classList.contains('toggle--active') } });
      });

      // Theme toggle
      document.getElementById('settings-theme-toggle').addEventListener('click', function() {
        this.classList.toggle('toggle--active');
        var newTheme = this.classList.contains('toggle--active') ? 'dark' : 'light';
        applyTheme(newTheme);
        DataStore.updateUserProfile({ settings: { theme: newTheme } });
      });

      // Font size
      document.getElementById('settings-font-size').addEventListener('change', function(e) {
        document.documentElement.setAttribute('data-font-size', e.target.value);
        DataStore.updateUserProfile({ settings: { fontSize: e.target.value } });
      });

      // Export
      document.getElementById('settings-export').addEventListener('click', function() {
        DataStore.exportData().then(function(data) {
          var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'nclex-data-' + new Date().toISOString().split('T')[0] + '.json';
          a.click();
          URL.revokeObjectURL(url);
          Toast.success('Data exported');
        });
      });

      // Import
      document.getElementById('settings-import').addEventListener('click', function() {
        document.getElementById('settings-import-file').click();
      });
      document.getElementById('settings-import-file').addEventListener('change', function() {
        var file = this.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
          try {
            var data = JSON.parse(e.target.result);
            Modal.show({
              title: 'Import Data',
              body: '<p>This will merge imported data with existing data. Continue?</p>',
              confirmText: 'Import',
              cancelText: 'Cancel',
              onConfirm: function() {
                DataStore.importData(data).then(function() {
                  Toast.success('Data imported successfully');
                  renderSettings();
                });
              }
            });
          } catch (err) {
            Toast.error('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      });

      // Reset
      document.getElementById('settings-reset').addEventListener('click', function() {
        Modal.show({
          title: 'Reset All Data',
          body: '<p><strong>Warning:</strong> This will permanently delete all your test history, scores, and custom questions. This action cannot be undone.</p><p>Type "RESET" below to confirm:</p>' +
            '<input type="text" class="form-input" id="reset-confirm-input" placeholder="Type RESET">',
          confirmText: 'Reset Everything',
          confirmType: 'danger',
          cancelText: 'Cancel',
          onConfirm: function() {
            var input = document.getElementById('reset-confirm-input');
            if (!input || input.value !== 'RESET') {
              Toast.error('Type RESET to confirm');
              return;
            }
            DataStore.resetData().then(function() {
              Toast.success('All data has been reset');
              renderSettings();
            });
          }
        });
      });
    });
  }

  // ─── Theme ───
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme || 'light');
  }

  // ─── Init ───
  function init() {
    console.log('NCLEX Prep Simulator initializing...');

    DataStore.initDB().then(function() {
      console.log('DataStore ready');

      // Apply user theme
      DataStore.getUserProfile().then(function(profile) {
        if (profile && profile.settings && profile.settings.theme) {
          applyTheme(profile.settings.theme);
        }
      });

      // Check for crash recovery
      var activeSession = DataStore.getActiveSession();
      if (activeSession) {
        Modal.show({
          title: 'Resume Test?',
          body: '<p>An unfinished test was found. Would you like to resume or discard it?</p>',
          confirmText: 'Resume',
          cancelText: 'Discard',
          onConfirm: function() {
            navigate('test', { resume: true });
          },
          onCancel: function() {
            DataStore.clearActiveSession();
            navigate('dashboard');
          }
        });
        return;
      }

      // Route to current hash or dashboard
      var hash = window.location.hash.replace('#', '') || 'dashboard';
      navigate(hash);
    }).catch(function(err) {
      console.error('Init error:', err);
      Toast.error('Failed to initialize application');
    });

    // Hash change listener
    window.addEventListener('hashchange', function() {
      var hash = window.location.hash.replace('#', '') || 'dashboard';
      navigate(hash);
    });

    // Nav click delegation
    var nav = document.querySelector('.nav');
    if (nav) {
      nav.addEventListener('click', function(e) {
        var link = e.target.closest('.nav__link');
        if (link) {
          e.preventDefault();
          var screen = link.getAttribute('data-screen');
          if (screen) navigate(screen);
        }
      });
    }

    // Storage error handler
    Events.on('storage-error', function(data) {
      Toast.warning(data.message);
    });
  }

  // ─── Public API ───
  window.NCLEX.App = {
    init: init,
    navigate: navigate,
    applyTheme: applyTheme,
    getCurrentScreen: function() { return currentScreen; },
    renderScreen: renderScreen,
    updateDashboardStats: updateDashboardStats
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
