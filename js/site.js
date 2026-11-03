// Header colour, gentle reveals, the office tabs and the tour video. The page works without any of it.
(() => {
  const header = document.getElementById('site-header');
  const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 24);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    reveals.forEach((element) => observer.observe(element));
  } else {
    reveals.forEach((element) => element.classList.add('in'));
  }

  for (const group of document.querySelectorAll('[data-tabs]')) {
    const tabs = [...group.querySelectorAll('[role="tab"]')];
    const select = (selected, focus = false) => {
      for (const tab of tabs) {
        const active = tab === selected;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
      }
      if (focus) selected.focus();
    };
    select(tabs[0]);
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (event) => {
        const moves = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
        if (!(event.key in moves)) return;
        event.preventDefault();
        select(tabs[(moves[event.key] + tabs.length) % tabs.length], true);
      });
    });
  }

  const video = document.getElementById('tour-video');
  const frame = document.getElementById('tour-frame');
  const play = () => video.play().catch(() => reveal());
  const reveal = () => {
    frame.classList.add('playing');
    video.controls = true;
  };
  video.controls = false; // the big play button comes first; the player's own controls follow it
  document.getElementById('tour-play').addEventListener('click', play);
  video.addEventListener('play', reveal);
  for (const link of document.querySelectorAll('[data-play-tour]')) {
    link.addEventListener('click', play);
  }
})();
