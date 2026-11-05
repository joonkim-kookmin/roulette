/* 학부모 라운지 퀴즈 룰렛 — 동작 코드 (보통은 수정할 필요 없음) */
(function () {
  'use strict';

  var C = window.EVENT_CONFIG || {};
  var POOL = (window.QUIZ_QUESTIONS || []).filter(function (q) {
    return q && q.active !== false && q.options && q.options.length;
  });
  var PRIZES = C.prizes || [];
  var STORE_KEY = 'kmu-parent-roulette-v1';
  var SPIN_MS = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1200 : 5200;

  var $ = function (id) { return document.getElementById(id); };
  var state = { phone: '', hash: '', prev: null, questions: [], idx: 0, rotation: 0, spinning: false };

  /* ---------------- 유틸 ---------------- */
  function rand() {
    try { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; }
    catch (e) { return Math.random(); }
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function digits(v) { return String(v || '').replace(/\D/g, '').slice(0, 11); }
  function formatPhone(d) {
    if (d.length <= 3) return d;
    if (d.length <= 7) return d.slice(0, 3) + '-' + d.slice(3);
    return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
  }
  function maskPhone(d) { return d.slice(0, 3) + '-****-' + d.slice(-4); }
  function validPhone(d) { return /^01[016789]\d{7,8}$/.test(d); }
  function makeCode() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
    for (var i = 0; i < 4; i++) s += chars[Math.floor(rand() * chars.length)];
    return s;
  }
  function fmtTime(t) {
    var d = new Date(t);
    if (isNaN(d)) return String(t || '');
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  async function hashPhone(d) {
    var src = 'kmu-roulette:' + d;
    try {
      var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(src));
      return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    } catch (e) {
      var h = 2166136261;
      for (var i = 0; i < src.length; i++) { h ^= src.charCodeAt(i); h = Math.imul(h, 16777619); }
      return 'f' + (h >>> 0).toString(16);
    }
  }

  /* 이 기기 기록 (번호는 해시로만 저장) */
  function loadStore() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; } }
  function saveRecord(hash, rec) {
    try { var s = loadStore(); s[hash] = rec; localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  /* 구글 시트 연동 */
  async function api(payload) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 10000);
    try {
      var res = await fetch(C.sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: ctrl.signal
      });
      var json = await res.json();
      if (!json.ok) throw new Error(json.error || 'server');
      return json;
    } finally { clearTimeout(timer); }
  }

  /* ---------------- 화면 전환 ---------------- */
  var SCREENS = ['start', 'quiz', 'roulette', 'result', 'already'];
  function show(name) {
    SCREENS.forEach(function (n) { $('screen-' + n).hidden = n !== name; });
    var titles = {
      start: [C.quizTitle, ''],
      quiz: [C.quizTitle, ''],
      roulette: [C.rouletteTitle, '퀴즈 완료! 룰렛을 돌려 경품을 받아가세요.'],
      result: [C.rouletteTitle, ''],
      already: [C.rouletteTitle, '']
    }[name];
    $('pageTitle').textContent = titles[0];
    $('pageLead').textContent = titles[1];
    window.scrollTo(0, 0);
  }

  /* ---------------- 1. 시작 ---------------- */
  function initStart() {
    $('eyebrow').textContent = C.eyebrow || '';
    $('bannerText').innerHTML = (C.banner || '').replace('3문제', (C.questionsPerPlay || 3) + '문제');
    var cs = C.consent || {};
    $('consentTitle').textContent = cs.title || '개인정보 수집·이용 동의';
    $('consentRows').innerHTML = (cs.rows || []).map(function (r) {
      return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>';
    }).join('');

    var phone = $('phone');
    phone.addEventListener('input', function () {
      phone.value = formatPhone(digits(phone.value));
      $('startError').textContent = '';
    });

    $('startForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var d = digits(phone.value);
      if (!validPhone(d)) { $('startError').textContent = '휴대전화 번호를 정확히 입력해 주세요.'; phone.focus(); return; }
      if (!$('agree').checked) { $('startError').textContent = '개인정보 수집·이용에 동의해 주세요.'; return; }
      if (!POOL.length) { $('startError').textContent = '등록된 문제가 없어요. 담당자에게 문의해 주세요.'; return; }

      var btn = $('startBtn');
      btn.disabled = true; btn.textContent = '확인 중…';
      try {
        state.phone = d;
        state.hash = await hashPhone(d);

        var rec = loadStore()[state.hash] || null;
        if (C.sheetUrl) {
          var r = await api({ action: 'check', phone: d });
          rec = r.exists ? { prize: r.prize, code: r.code, time: r.time, count: r.count || 1, received: !!r.received } : null;
          if (rec) saveRecord(state.hash, rec);
        }
        state.prev = rec;
        if (rec) return showAlready(rec);
        startQuiz();
      } catch (err) {
        $('startError').textContent = '연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.';
      } finally {
        btn.disabled = false; btn.textContent = '퀴즈 시작하기';
      }
    });
  }

  /* ---------------- 2. 퀴즈 ---------------- */
  function startQuiz() {
    var n = Math.min(C.questionsPerPlay || 3, POOL.length);
    state.questions = shuffle(POOL).slice(0, n);
    state.idx = 0;
    renderQuestion();
    show('quiz');
  }

  function renderQuestion() {
    var q = state.questions[state.idx], total = state.questions.length;
    $('qCount').textContent = (state.idx + 1) + ' / ' + total;
    $('qCategory').textContent = q.category || '';
    $('qBar').style.width = ((state.idx + 1) / total * 100) + '%';
    $('qNo').textContent = 'Q' + (state.idx + 1) + '.';
    $('qText').textContent = q.question;
    $('qOptions').innerHTML = q.options.map(function (o, i) {
      return '<label class="opt"><input type="checkbox" value="' + i + '">' +
        '<span class="box" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>' +
        '<span>' + esc(o.text) + '</span></label>';
    }).join('');
    $('qFeedback').hidden = true;
    $('qFeedback').className = 'feedback';
    $('qSubmit').hidden = false; $('qSubmit').disabled = true;
    $('qNext').hidden = true;
  }

  function initQuiz() {
    $('qOptions').addEventListener('change', function () {
      $('qSubmit').disabled = !$('qOptions').querySelector('input:checked');
      if (!$('qFeedback').classList.contains('ok')) $('qFeedback').hidden = true;
    });

    $('quizForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = state.questions[state.idx];
      var boxes = Array.prototype.slice.call($('qOptions').querySelectorAll('input'));
      var any = false, wrong = 0;
      boxes.forEach(function (b, i) {
        if (!b.checked) return;
        any = true;
        if (q.options[i].correct === false) wrong++;
      });
      var fb = $('qFeedback');
      fb.hidden = false;

      // 정답 보기를 하나라도 고르면 통과 → 정답 보기 전체를 체크해서 보여줌
      if (any && !wrong) {
        var allCorrect = q.options.every(function (o) { return o.correct !== false; });
        var expl = q.explanation || (allCorrect ? '보기에 나온 내용이 전부 맞는 설명이에요.' : '정답 보기를 모두 표시했어요.');
        fb.className = 'feedback ok';
        fb.innerHTML = '<b>' + (allCorrect ? '모두 정답입니다!' : '정답입니다!') + '</b><p>' + esc(expl) + '</p>';
        boxes.forEach(function (b, i) {
          if (q.options[i].correct !== false) b.checked = true;
          b.disabled = true; b.parentNode.classList.add('locked');
        });
        $('qSubmit').hidden = true;
        var last = state.idx === state.questions.length - 1;
        $('qNext').textContent = last ? '룰렛 돌리러 가기' : '다음 문제';
        $('qNext').hidden = false;
        $('qNext').focus();
      } else {
        fb.className = 'feedback no';
        fb.innerHTML = '<b>아쉬워요, 다시 골라 보세요!</b><p>맞지 않는 보기가 섞여 있어요.</p>';
      }
    });

    $('qNext').addEventListener('click', function () {
      if (state.idx < state.questions.length - 1) { state.idx++; renderQuestion(); window.scrollTo(0, 0); }
      else { show('roulette'); }
    });
  }

  /* ---------------- 3. 룰렛 ---------------- */
  function buildWheel() {
    var n = PRIZES.length, seg = 360 / n, R = 150, svg = [];
    svg.push('<svg viewBox="-160 -160 320 320" role="img" aria-label="경품 룰렛: ' +
      esc(PRIZES.map(function (p) { return p.name; }).join(', ')) + '">');
    PRIZES.forEach(function (p, i) {
      var a0 = (i * seg - 90) * Math.PI / 180, a1 = ((i + 1) * seg - 90) * Math.PI / 180;
      var x0 = (R * Math.cos(a0)).toFixed(2), y0 = (R * Math.sin(a0)).toFixed(2);
      var x1 = (R * Math.cos(a1)).toFixed(2), y1 = (R * Math.sin(a1)).toFixed(2);
      svg.push('<path d="M0 0 L' + x0 + ' ' + y0 + ' A' + R + ' ' + R + ' 0 ' + (seg > 180 ? 1 : 0) + ' 1 ' + x1 + ' ' + y1 + ' Z" fill="' + p.color + '"/>');
    });
    PRIZES.forEach(function (p, i) {
      var lines = String(p.label || p.name).split('\n');
      var fs = lines.some(function (l) { return l.length > 5; }) ? 13 : 15;
      var start = -((lines.length - 1) * (fs + 3)) / 2;
      var mid = (i + 0.5) * seg, flip = mid > 90 && mid < 270 ? ' rotate(180)' : '';
      svg.push('<g transform="rotate(' + mid + ') translate(0 -96)' + flip + '" fill="' + p.text + '" font-family="KMU80 Haeong Sans, sans-serif" font-size="' + fs + '" font-weight="700" text-anchor="middle" dominant-baseline="middle">');
      lines.forEach(function (l, k) { svg.push('<text x="0" y="' + (start + k * (fs + 3)) + '">' + esc(l) + '</text>'); });
      svg.push('</g>');
    });
    svg.push('<circle r="153" fill="none" stroke="#0A2B5E" stroke-width="8"/>');
    for (var i = 0; i < n; i++) {
      var a = (i * seg - 90) * Math.PI / 180;
      svg.push('<circle cx="' + (153 * Math.cos(a)).toFixed(1) + '" cy="' + (153 * Math.sin(a)).toFixed(1) + '" r="3.5" fill="#F2B233"/>');
    }
    svg.push('<circle r="38" fill="#fff" stroke="#0A2B5E" stroke-width="4"/>');
    svg.push('<text y="-8" text-anchor="middle" dominant-baseline="middle" font-family="KMU80 Haeong Sans, sans-serif" font-size="12" font-weight="500" fill="#5A6476">모두</text>');
    svg.push('<text y="10" text-anchor="middle" dominant-baseline="middle" font-family="KMU80 Sungkok Serif, serif" font-size="18" font-weight="400" fill="#0A2B5E">당첨</text>');
    svg.push('</svg>');
    $('wheel').innerHTML = svg.join('');
  }

  function drawPrize() {
    var total = PRIZES.reduce(function (s, p) { return s + Math.max(0, Number(p.weight) || 0); }, 0);
    var r = rand() * total;
    for (var i = 0; i < PRIZES.length; i++) {
      r -= Math.max(0, Number(PRIZES[i].weight) || 0);
      if (r < 0) return i;
    }
    return PRIZES.length - 1;
  }

  function initRoulette() {
    buildWheel();
    var check = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A2B5E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    $('rouletteNotes').innerHTML = (C.rouletteNotes || []).map(function (t) { return '<li>' + check + esc(t) + '</li>'; }).join('');
    $('soldOut1').textContent = C.soldOutNotice || '';
    $('soldOut2').textContent = C.soldOutNotice || '';

    $('spinBtn').addEventListener('click', function () {
      if (state.spinning) return;
      state.spinning = true;
      var btn = $('spinBtn');
      btn.disabled = true; btn.textContent = '두근두근…';

      var idx = drawPrize(), n = PRIZES.length, seg = 360 / n;
      var mid = (idx + 0.5) * seg;
      var jitter = (rand() - 0.5) * seg * 0.6;
      var base = Math.ceil(state.rotation / 360) * 360;
      state.rotation = base + 360 * 6 + (360 - mid) + jitter;

      var wheel = $('wheel');
      wheel.style.transition = 'transform ' + SPIN_MS + 'ms cubic-bezier(.12,.7,.1,1)';
      wheel.style.transform = 'rotate(' + state.rotation + 'deg)';

      var done = false;
      var finish = function () { if (done) return; done = true; onSpinEnd(idx); };
      wheel.addEventListener('transitionend', finish, { once: true });
      setTimeout(finish, SPIN_MS + 400);
    });
  }

  async function onSpinEnd(idx) {
    var prevCount = state.prev ? (state.prev.count || 1) : 0;
    var rec = { prize: PRIZES[idx].name, code: makeCode(), time: new Date().toISOString(), count: prevCount + 1, received: false };
    var warn = '';
    if (C.sheetUrl) {
      try {
        var r = await api({ action: 'record', phone: state.phone, prize: rec.prize, code: rec.code });
        if (r.locked) {
          rec = { prize: r.prize, code: r.code, time: r.time, count: r.count || 1, received: true };
          warn = '이미 경품을 수령한 번호라 기존 결과로 안내드려요.';
        } else if (r.count) { rec.count = r.count; }
      } catch (e) {
        warn = '당첨 기록 전송에 실패했어요. 이 화면을 안내 데스크에 그대로 보여주세요.';
      }
    }
    saveRecord(state.hash, rec);
    state.prev = rec;
    showResult(rec, warn);
  }

  /* 재도전 가능 여부: 경품 수령 전 + 횟수 제한 이내 */
  function canRetry(rec) {
    if (!rec || rec.received) return !rec;
    var max = Number(C.maxPlaysPerPhone) || 0;
    return !max || (rec.count || 1) < max;
  }
  function retryNote(rec) {
    if (rec && rec.received) return '이미 경품을 받으셨어요. 경품은 번호 1개당 1개예요.';
    if (!canRetry(rec)) return '참여 가능 횟수를 모두 사용했어요. 이 화면을 안내 데스크에 보여주세요.';
    return C.retryNotice || '';
  }

  /* ---------------- 4·5. 결과 ---------------- */
  var clockTimer = null;
  function tick() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    $('rClock').textContent = p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }
  function showResult(rec, warn) {
    $('rPrize').textContent = rec.prize;
    $('rPrize').classList.remove('pop'); void $('rPrize').offsetWidth; $('rPrize').classList.add('pop');
    $('rCode').textContent = rec.code;
    $('rPhone').textContent = maskPhone(state.phone);
    $('rTime').textContent = fmtTime(rec.time);
    $('rWarn').textContent = warn || ''; $('rWarn').hidden = !warn;
    $('rRetryNote').textContent = retryNote(rec);
    $('retryBtn').hidden = !canRetry(rec);
    tick(); clearInterval(clockTimer); clockTimer = setInterval(tick, 1000);
    show('result');
  }
  function showAlready(rec) {
    $('aPrize').textContent = rec.prize;
    $('aCode').textContent = rec.code || '-';
    $('aPhone').textContent = maskPhone(state.phone);
    $('aTime').textContent = fmtTime(rec.time);
    $('aGuide').textContent = retryNote(rec);
    $('aRetryBtn').hidden = !canRetry(rec);
    show('already');
  }

  function resetWheel() {
    clearInterval(clockTimer);
    state.spinning = false;
    $('spinBtn').disabled = false; $('spinBtn').textContent = '룰렛 돌리기';
    var wheel = $('wheel');
    wheel.style.transition = 'none';
    state.rotation = state.rotation % 360;
    wheel.style.transform = 'rotate(' + state.rotation + 'deg)';
  }

  /* 같은 번호로 다시 도전: 번호·동의 없이 바로 퀴즈부터 */
  function retryQuiz() {
    resetWheel();
    startQuiz();
  }

  /* 처음으로: 다른 번호로 참여 (공용 태블릿 운영 시) */
  function resetAll() {
    resetWheel();
    state.phone = ''; state.hash = ''; state.prev = null; state.questions = []; state.idx = 0;
    $('phone').value = ''; $('agree').checked = false; $('startError').textContent = '';
    $('consentBox').open = false;
    show('start');
  }

  /* 운영자용: 주소 끝에 ?reset 을 붙여 열면 이 기기 참여 기록 초기화 */
  function adminReset() {
    if (!/[?&]reset\b/.test(location.search)) return;
    if (confirm('이 기기에 저장된 참여 기록을 모두 지울까요?')) {
      try { localStorage.removeItem(STORE_KEY); } catch (e) {}
      alert('초기화했어요.');
    }
    history.replaceState(null, '', location.pathname);
  }

  /* ---------------- 시작 ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    adminReset();
    initStart();
    initQuiz();
    initRoulette();
    $('retryBtn').addEventListener('click', retryQuiz);
    $('aRetryBtn').addEventListener('click', retryQuiz);
    $('homeBtn').addEventListener('click', resetAll);
    $('backBtn').addEventListener('click', resetAll);
    show('start');
  });
})();
