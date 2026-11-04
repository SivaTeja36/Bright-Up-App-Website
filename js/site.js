// All the page's motion. The page reads fine without this script, and anyone who asks their device
// for less motion gets the finished states with nothing moving.
(() => {
  const html = document.documentElement;
  html.classList.add('js');
  window.brightUpReady = true;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const realMouse = window.matchMedia('(hover: hover) and (pointer: fine)');
  const calm = () => reducedMotion.matches;

  /* ---------- Pause button ---------- */
  const STORAGE_KEY = 'brightup.motion';
  let paused = false;
  try {
    paused = localStorage.getItem(STORAGE_KEY) === 'paused';
  } catch {
    // private windows can refuse storage; the page just starts with motion on
  }
  const pauseListeners = [];
  const toggles = $$('[data-motion-toggle]');
  const toggle = $('#motion-toggle');
  const applyPaused = () => {
    const label = paused ? 'Play animations' : 'Pause animations';
    html.classList.toggle('motion-paused', paused);
    for (const button of toggles) {
      button.setAttribute('aria-pressed', String(paused));
      if (button === toggle) button.setAttribute('aria-label', label);
      else button.textContent = label;
    }
    pauseListeners.forEach((listener) => listener());
  };
  toggles.forEach((button) => button.addEventListener('click', () => {
    paused = !paused;
    try {
      localStorage.setItem(STORAGE_KEY, paused ? 'paused' : 'playing');
    } catch {
      // the choice still applies for this visit
    }
    applyPaused();
  }));

  /* ---------- Reveals: headings word by word, everything else gently ---------- */
  const splitWords = (heading) => {
    const parts = [];
    for (const node of [...heading.childNodes]) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/( +)/).forEach((piece) => {
          if (piece) parts.push(piece.trim() ? { word: piece } : { space: true });
        });
      } else if (node.classList?.contains('stop')) {
        parts.push({ attach: node });
      } else {
        parts.push({ element: node });
      }
    }
    heading.textContent = '';
    let index = 0;
    let lastInner = null;
    for (const part of parts) {
      if (part.space) {
        heading.append(' ');
      } else if (part.attach && lastInner) {
        lastInner.append(part.attach);
      } else {
        const outer = document.createElement('span');
        const inner = document.createElement('span');
        outer.className = 'w';
        inner.style.setProperty('--i', index);
        if (part.element) inner.append(part.element);
        else inner.textContent = part.word;
        outer.append(inner);
        heading.append(outer);
        lastInner = inner;
        index += 1;
      }
    }
    heading.classList.add('split-done');
  };
  $$('[data-split]').forEach(splitWords);
  $('h1').classList.add('in');

  $$('[data-stagger]').forEach((group) => {
    [...group.children].forEach((child, index) => child.style.setProperty('--d', `${(index % 6) * 0.08}s`));
  });
  $$('.mobile-menu nav a').forEach((link, index) => link.style.setProperty('--i', index));
  $$('.more-grid .icon > *').forEach((shape) => shape.setAttribute('pathLength', '1'));

  const animateCount = (element) => {
    const target = Number(element.dataset.count);
    const suffix = element.dataset.suffix ?? '';
    if (calm()) {
      element.textContent = `${target}${suffix}`;
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const progress = clamp((now - start) / 1500);
      const eased = 1 - (1 - progress) ** 4;
      element.textContent = `${Math.round(target * eased)}${progress === 1 ? suffix : ''}`;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target;
        element.classList.add('in');
        revealObserver.unobserve(element);
        $$('[data-count]', element).forEach(animateCount);
        // after the entrance, hand transforms back to hover effects
        window.setTimeout(() => element.classList.add('done'), 1700);
      }
    },
    { rootMargin: '0px 0px -7% 0px', threshold: 0.01 },
  );
  $$('[data-reveal], [data-split]').forEach((element) => {
    if (element.matches('h1')) return;
    if (!calm()) $$('[data-count]', element).forEach((count) => { count.textContent = '0'; });
    revealObserver.observe(element);
  });

  /* ---------- Header, section tracking and menu ---------- */
  const header = $('#site-header');
  const navLinks = $$('#nav-links a');
  const indicator = $('#nav-indicator');
  const moveIndicator = (link) => {
    navLinks.forEach((item) => item.classList.toggle('is-current', item === link));
    if (!link) {
      indicator.style.setProperty('--on', '0');
      return;
    }
    indicator.style.setProperty('--on', '1');
    indicator.style.setProperty('--x', `${link.offsetLeft}px`);
    indicator.style.setProperty('--w', `${link.offsetWidth}px`);
  };
  let currentLink = null;
  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const link = navLinks.find((item) => item.getAttribute('href') === `#${entry.target.id}`);
        if (entry.isIntersecting) currentLink = link;
        else if (currentLink === link) currentLink = null;
      }
      moveIndicator(currentLink);
    },
    { rootMargin: '-45% 0px -54% 0px' },
  );
  navLinks.forEach((link) => {
    const section = $(link.getAttribute('href'));
    if (section) spy.observe(section);
  });

  const menuButton = $('#menu-button');
  const menu = $('#mobile-menu');
  const pageParts = [$('#main'), $('.site-footer'), toggle];
  const setMenu = (open, { returnFocus = true } = {}) => {
    document.body.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.inert = !open;
    pageParts.forEach((part) => { part.inert = open; });
    if (open) $('a', menu).focus({ preventScroll: true });
    else if (returnFocus) menuButton.focus({ preventScroll: true });
  };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false, { returnFocus: false });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
  });
  window.matchMedia('(min-width: 1040px)').addEventListener('change', (event) => {
    if (event.matches && document.body.classList.contains('menu-open')) setMenu(false, { returnFocus: false });
    moveIndicator(currentLink);
  });

  /* ---------- Things tied to the scroll position ---------- */
  const progressBar = $('#scroll-progress');
  const docTop = (element) => {
    let top = 0;
    for (let node = element; node; node = node.offsetParent) top += node.offsetTop;
    return top;
  };
  // each value is set directly on the piece that moves: a variable on a big section makes the browser recheck all of it
  const scrubTargets = { curtain: '.curtain-bg', book: '.logo-lockup' };
  const scrubbed = $$('[data-scrub]').map((element) => ({
    element,
    layer: scrubTargets[element.dataset.scrub] ? $(scrubTargets[element.dataset.scrub], element) : element,
    type: element.dataset.scrub,
    value: null,
    top: 0,
    height: 0,
  }));
  const parallax = $$('[data-parallax]').map((element) => ({ element, speed: Number(element.dataset.parallax), top: 0, height: 0 }));
  const rail = $('#story-rail-fill');
  const stepsColumn = $('.story-steps');
  let docHeight = 0;
  let railTop = 0;
  let railHeight = 0;

  const measure = () => {
    docHeight = document.documentElement.scrollHeight;
    for (const item of [...scrubbed, ...parallax]) {
      item.top = docTop(item.element);
      item.height = item.element.offsetHeight;
    }
    railTop = docTop(stepsColumn);
    railHeight = stepsColumn.offsetHeight;
  };

  const targetFor = (item, y, vh) => {
    const fromBelow = (start, end) => clamp((y + vh * start - item.top) / (vh * (start - end)));
    switch (item.type) {
      case 'hero-visual':
        return clamp(y / (vh * 0.9));
      case 'curtain':
        return fromBelow(1, 0.45);
      case 'video':
        return fromBelow(1, 0.42);
      case 'book':
        return fromBelow(0.98, 0.42);
      default:
        return 0;
    }
  };

  const apply = (item) => {
    const { layer, type, value } = item;
    if (type === 'hero-visual') layer.style.transform = `rotateX(${(value * 9).toFixed(2)}deg) scale(${(1 - value * 0.06).toFixed(4)})`;
    if (type === 'curtain') layer.style.transform = `scaleX(${(1 - (1 - value) * 0.07).toFixed(4)})`;
    if (type === 'video') layer.style.scale = (0.86 + 0.14 * value).toFixed(4);
    if (type === 'book') {
      layer.style.setProperty('--p', value.toFixed(4));
      layer.style.setProperty('--r', clamp((value - 0.72) / 0.28).toFixed(4));
    }
  };

  let ticking = false;
  const frame = () => {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    progressBar.style.transform = `scaleX(${clamp(y / Math.max(1, docHeight - vh)).toFixed(4)})`;
    if (calm()) return;

    header.classList.toggle('scrolled', y > 24);
    let settling = false;
    for (const item of scrubbed) {
      const target = targetFor(item, y, vh);
      item.value = item.value === null ? target : item.value + (target - item.value) * 0.16;
      if (Math.abs(target - item.value) < 0.0008) item.value = target;
      else settling = true;
      apply(item);
    }
    for (const item of parallax) {
      const distance = item.top + item.height / 2 - (y + vh / 2);
      if (Math.abs(distance) < vh * 1.6) item.element.style.translate = `0 ${(distance * item.speed).toFixed(1)}px`;
    }
    if (rail && pinned) rail.style.transform = `scaleY(${clamp((y + vh * 0.5 - railTop) / railHeight).toFixed(4)})`;
    if (settling) requestTick();
  };
  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  };
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 24);
    requestTick();
  }, { passive: true });

  /* ---------- Rising sparks behind the hero and the closing panel ---------- */
  const startSparks = (canvas) => {
    if (calm()) return;
    const saveData = navigator.connection?.saveData;
    if (saveData) return;
    const context = canvas.getContext('2d');
    const small = (navigator.hardwareConcurrency ?? 4) <= 2;
    let width = 0;
    let height = 0;
    let dim = 1;
    let sparks = [];
    let running = false;
    let visible = false;
    let last = 0;

    const newSpark = (anywhere = false) => ({
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : height + 8,
      size: 0.7 + Math.random() * 1.9,
      speed: 7 + Math.random() * 20,
      sway: Math.random() * Math.PI * 2,
      twinkle: 0.6 + Math.random() * 1.8,
      gold: Math.random() < 0.34,
    });

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.round(clamp((width * height) / 26000, 10, small ? 26 : 62));
      dim = width < 700 ? 0.6 : 1; // on phones the sparks sit closer to the words, so they stay quieter
      sparks = Array.from({ length: count }, () => newSpark(true));
    };

    const drawStar = (x, y, size) => {
      context.beginPath();
      context.moveTo(x, y - size * 2.4);
      context.quadraticCurveTo(x, y, x + size * 2.4, y);
      context.quadraticCurveTo(x, y, x, y + size * 2.4);
      context.quadraticCurveTo(x, y, x - size * 2.4, y);
      context.quadraticCurveTo(x, y, x, y - size * 2.4);
      context.fill();
    };

    const loop = (now) => {
      if (!running) return;
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      context.clearRect(0, 0, width, height);
      for (let i = 0; i < sparks.length; i += 1) {
        const spark = sparks[i];
        spark.y -= spark.speed * delta;
        spark.sway += delta * 0.7;
        if (spark.y < -8) sparks[i] = newSpark();
        const light = dim * (0.25 + 0.55 * (0.5 + 0.5 * Math.sin(now / 1000 * spark.twinkle + spark.sway)));
        const x = spark.x + Math.sin(spark.sway) * 9;
        context.fillStyle = spark.gold ? `rgba(251,176,0,${light})` : `rgba(255,255,255,${light * 0.8})`;
        if (spark.size > 2.1) drawStar(x, spark.y, spark.size);
        else {
          context.beginPath();
          context.arc(x, spark.y, spark.size, 0, Math.PI * 2);
          context.fill();
        }
      }
      requestAnimationFrame(loop);
    };

    const sync = () => {
      const should = visible && !paused && !document.hidden && !calm();
      if (should && !running) {
        running = true;
        last = performance.now();
        requestAnimationFrame(loop);
      } else if (!should) {
        running = false;
      }
    };

    resize();
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }).observe(canvas);
    document.addEventListener('visibilitychange', sync);
    pauseListeners.push(sync);
  };
  $$('[data-sparks]').forEach(startSparks);

  /* ---------- Loops rest while they're off screen, which also saves battery ---------- */
  const stageWatcher = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle('offstage', !entry.isIntersecting));
  });
  $$('.hero, .ticker, .tour, .office, .students, .cta-panel').forEach((section) => stageWatcher.observe(section));

  /* ---------- Moving strip: repeated once so the loop is seamless ---------- */
  const ticker = $('#ticker-track');
  if (!calm()) {
    [...ticker.children].forEach((item) => {
      const copy = item.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      ticker.append(copy);
    });
  }

  /* ---------- Student story: pinned screens on large displays, stacked on small ones ---------- */
  const story = $('#story');
  const stage = $('#story-stage');
  const stageInner = $('#stage-inner');
  const stageGlow = $('#stage-glow');
  const steps = $$('.step', story);
  const shots = steps.map((step) => $('.shot', step));
  const pinnedQuery = window.matchMedia('(min-width: 1040px) and (min-height: 620px)');
  let pinned = false;
  let activeIndex = -1;

  const replay = (shot) => {
    shot.classList.remove('play');
    if (calm()) return;
    void shot.offsetWidth; // restarts the CSS animations from the beginning
    shot.classList.add('play');
  };

  const activate = (index) => {
    if (index === activeIndex) return;
    activeIndex = index;
    steps.forEach((step, i) => step.classList.toggle('is-active', i === index));
    shots.forEach((shot, i) => {
      shot.classList.toggle('is-active', i === index);
      shot.classList.toggle('is-past', i < index);
    });
    stageGlow.style.setProperty('--tint', steps[index].dataset.tint);
    replay(shots[index]);
  };

  const stepObserver = new IntersectionObserver(
    (entries) => {
      if (!pinned) return;
      for (const entry of entries) {
        if (entry.isIntersecting) activate(steps.indexOf(entry.target));
      }
    },
    { rootMargin: '-50% 0px -50% 0px' },
  );
  const shotObserver = new IntersectionObserver(
    (entries) => {
      if (pinned) return;
      for (const entry of entries) {
        if (entry.isIntersecting) replay(entry.target);
      }
    },
    { threshold: 0.55 },
  );

  const setStoryMode = () => {
    pinned = pinnedQuery.matches;
    story.classList.toggle('pinned', pinned);
    stage.hidden = !pinned;
    activeIndex = -1;
    steps.forEach((step, i) => {
      step.classList.remove('is-active');
      shots[i].classList.remove('is-active', 'is-past');
      if (pinned) {
        $$('img', shots[i]).forEach((image) => { image.loading = 'eager'; });
        stageInner.append(shots[i]);
        shotObserver.unobserve(shots[i]);
      } else {
        step.append(shots[i]);
        shotObserver.observe(shots[i]);
      }
    });
    if (pinned) {
      const nearest = steps.reduce((best, step, i) => {
        const distance = Math.abs(step.getBoundingClientRect().top + step.offsetHeight / 2 - window.innerHeight / 2);
        return distance < best.distance ? { i, distance } : best;
      }, { i: 0, distance: Infinity });
      activate(nearest.i);
    }
    measure();
    requestTick();
  };
  steps.forEach((step) => stepObserver.observe(step));
  pinnedQuery.addEventListener('change', setStoryMode);

  /* ---------- Attendance timeline: plays while on screen, then repeats ---------- */
  const attendance = $('#att');
  let attendanceVisible = false;
  let attendanceTimer = 0;
  const runAttendance = () => {
    window.clearTimeout(attendanceTimer);
    if (!attendanceVisible || paused || calm()) return;
    attendance.classList.remove('run');
    void attendance.offsetWidth;
    attendance.classList.add('run');
    attendanceTimer = window.setTimeout(runAttendance, 8200);
  };
  new IntersectionObserver(([entry]) => {
    attendanceVisible = entry.isIntersecting;
    runAttendance();
  }, { threshold: 0.3 }).observe(attendance);
  pauseListeners.push(runAttendance);

  /* ---------- Office tabs: a sliding highlight, and they advance by themselves until touched ---------- */
  const tabsRoot = $('[data-tabs]');
  const tabs = $$('[role="tab"]', tabsRoot);
  const tabIndicator = $('.tab-indicator', tabsRoot);
  const askText = $('#ask-text');
  const askAnswer = $('#ask-answer');
  const question = askText.textContent;
  let typingTimer = 0;
  let userChoseTab = false;

  const placeIndicator = (tab) => {
    tabIndicator.style.setProperty('--x', `${tab.offsetLeft}px`);
    tabIndicator.style.setProperty('--y', `${tab.offsetTop}px`);
    tabIndicator.style.setProperty('--w', `${tab.offsetWidth}px`);
    tabIndicator.style.setProperty('--h', `${tab.offsetHeight}px`);
  };

  const typeQuestion = () => {
    window.clearTimeout(typingTimer);
    if (calm()) return;
    askText.textContent = '';
    askAnswer.classList.add('is-waiting');
    let shown = 0;
    const next = () => {
      shown += 1;
      askText.textContent = question.slice(0, shown);
      if (shown < question.length) typingTimer = window.setTimeout(next, 28);
      else typingTimer = window.setTimeout(() => askAnswer.classList.remove('is-waiting'), 350);
    };
    typingTimer = window.setTimeout(next, 450);
  };

  const selectTab = (selected, { focus = false } = {}) => {
    for (const tab of tabs) {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      $(`#${tab.getAttribute('aria-controls')}`).hidden = !active;
    }
    placeIndicator(selected);
    if (selected.id === 'tab-assistant') typeQuestion();
    if (focus) selected.focus();
  };

  const wideTabs = window.matchMedia('(min-width: 1040px)');
  const syncAutoTabs = () => {
    // on small screens the panel changes height, so it only moves when someone asks it to
    tabsRoot.classList.toggle('auto', !userChoseTab && !calm() && !paused && wideTabs.matches);
  };
  const stopAuto = () => {
    userChoseTab = true;
    syncAutoTabs();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      stopAuto();
      selectTab(tab);
    });
    tab.addEventListener('keydown', (event) => {
      const moves = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
      if (!(event.key in moves)) return;
      event.preventDefault();
      stopAuto();
      selectTab(tabs[(moves[event.key] + tabs.length) % tabs.length], { focus: true });
    });
    $('.tab-progress', tab).addEventListener('animationend', () => {
      if (tabsRoot.classList.contains('auto')) selectTab(tabs[(index + 1) % tabs.length]);
    });
  });
  const setHolding = (value) => tabsRoot.classList.toggle('holding', value);
  tabsRoot.addEventListener('pointerenter', () => setHolding(true));
  tabsRoot.addEventListener('pointerleave', () => setHolding(false));
  tabsRoot.addEventListener('focusin', () => setHolding(true));
  tabsRoot.addEventListener('focusout', () => setHolding(false));
  new IntersectionObserver(([entry]) => {
    tabsRoot.classList.toggle('offscreen', !entry.isIntersecting);
    if (!tabsRoot.matches(':hover') && !tabsRoot.contains(document.activeElement)) setHolding(!entry.isIntersecting);
  }, { threshold: 0.35 }).observe(tabsRoot);
  setHolding(true);
  wideTabs.addEventListener('change', syncAutoTabs);
  pauseListeners.push(syncAutoTabs);
  selectTab(tabs[0]);
  syncAutoTabs();

  /* ---------- Tour video ---------- */
  const video = $('#tour-video');
  const videoFrame = $('#tour-frame');
  const showPlayer = () => {
    videoFrame.classList.add('playing');
    video.controls = true;
  };
  const playVideo = () => video.play().catch(showPlayer);
  video.controls = false; // the big play button comes first; the player's own controls follow it
  $('#tour-play').addEventListener('click', playVideo);
  video.addEventListener('play', showPlayer);
  $$('[data-play-tour]').forEach((link) => link.addEventListener('click', playVideo));

  /* ---------- Pointer effects, for a real mouse only ---------- */
  const heroTilt = $('#hero-tilt');
  const heroSection = $('.hero');
  let pointer = null;
  let pointerQueued = false;
  let tiltedElement = null;
  let magnetic = null;

  const applyPointer = () => {
    pointerQueued = false;
    if (!pointer || calm()) return;
    const { x, y, target } = pointer;
    if (!(target instanceof Element)) return;

    const light = target.closest('.spot');
    if (light) {
      const box = light.getBoundingClientRect();
      light.style.setProperty('--mx', `${x - box.left}px`);
      light.style.setProperty('--my', `${y - box.top}px`);
    }

    const tilted = target.closest('.tilt');
    if (tiltedElement && tiltedElement !== tilted) {
      tiltedElement.style.removeProperty('--rx');
      tiltedElement.style.removeProperty('--ry');
    }
    tiltedElement = tilted;
    if (tilted) {
      const box = tilted.getBoundingClientRect();
      tilted.style.setProperty('--ry', `${(((x - box.left) / box.width - 0.5) * 7).toFixed(2)}deg`);
      tilted.style.setProperty('--rx', `${((0.5 - (y - box.top) / box.height) * 7).toFixed(2)}deg`);
    }

    const button = target.closest('[data-magnetic]');
    if (magnetic && magnetic !== button) {
      magnetic.style.removeProperty('--tx');
      magnetic.style.removeProperty('--ty');
    }
    magnetic = button;
    if (button) {
      const box = button.getBoundingClientRect();
      button.style.setProperty('--tx', `${((x - box.left - box.width / 2) * 0.16).toFixed(1)}px`);
      button.style.setProperty('--ty', `${((y - box.top - box.height / 2) * 0.28).toFixed(1)}px`);
    }

    if (y < heroSection.offsetHeight - window.scrollY) {
      heroTilt.style.setProperty('--ry', `${((x / window.innerWidth - 0.5) * 7).toFixed(2)}deg`);
      heroTilt.style.setProperty('--rx', `${((0.5 - y / window.innerHeight) * 5).toFixed(2)}deg`);
    }
  };

  document.addEventListener('pointermove', (event) => {
    if (!realMouse.matches || event.pointerType !== 'mouse') return;
    pointer = { x: event.clientX, y: event.clientY, target: event.target };
    if (pointerQueued) return;
    pointerQueued = true;
    requestAnimationFrame(applyPointer);
  }, { passive: true });

  /* ---------- Start ---------- */
  applyPaused();
  setStoryMode();
  new ResizeObserver(() => {
    measure();
    moveIndicator(currentLink);
    placeIndicator(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true'));
    requestTick();
  }).observe(document.body);
  window.addEventListener('load', () => {
    measure();
    requestTick();
  });
  if (calm()) {
    header.classList.toggle('scrolled', window.scrollY > 24);
    // without the scroll scrubbing, every scrubbed piece simply shows its finished state
    scrubbed.forEach((item) => {
      item.value = item.type === 'hero-visual' ? 0 : 1;
      apply(item);
    });
    window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 24), { passive: true });
  }
})();
