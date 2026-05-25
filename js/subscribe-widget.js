/* Structure Me — floating subscribe widget
   Auto-injects on any article page. Drop one <script src="…/js/subscribe-widget.js" defer></script>
   into the article HTML and the widget appears 800ms after load (unless dismissed this session).
*/
(function () {
  if (window.__smSubscribeWidgetLoaded) return;
  window.__smSubscribeWidgetLoaded = true;

  var STORAGE_KEY = 'sm_subscribe_dismissed';

  // Honour previous dismiss in this session — don't even inject markup.
  try { if (sessionStorage.getItem(STORAGE_KEY) === '1') return; } catch (e) {}

  function init() {
    if (document.getElementById('subWidget')) return; // already present in HTML

    // Compute path to subscribe-details.html relative to current page.
    // Articles live under /insights/* so we go up one level. Pages at root use ./
    var path = window.location.pathname.replace(/\/$/, '');
    var segments = path.split('/').filter(Boolean);
    var depth = segments.length;
    // If the path ends with .html, it's a file at that depth-1 directory.
    if (/\.html?$/i.test(path)) depth = Math.max(0, segments.length - 1);
    var prefix = depth > 0 ? '../'.repeat(depth) : './';
    var detailsUrl = prefix + 'subscribe-details.html';

    var html = [
      '<aside class="sub-widget" id="subWidget" role="complementary" aria-label="Subscribe to Structure Me Insights" aria-hidden="true">',
      '  <button type="button" class="sub-widget-close" id="subWidgetClose" aria-label="Dismiss subscribe panel">',
      '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 5 L19 19 M19 5 L5 19"/></svg>',
      '  </button>',
      '  <div class="sub-widget-inner">',
      '    <div class="sub-widget-mark" aria-hidden="true">',
      '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6 L21 6 L21 19 L3 19 Z"/><path d="M3 6 L12 14 L21 6"/></svg>',
      '    </div>',
      '    <span class="sub-widget-eyebrow">— Structure Me Insights</span>',
      '    <h3 class="sub-widget-title">Read the next <em>essay</em> in your inbox.</h3>',
      '    <p class="sub-widget-copy">Slow, considered pieces on entities, jurisdictions and succession — roughly monthly.</p>',
      '    <form class="sub-widget-form" id="subWidgetForm" novalidate>',
      '      <input type="text" name="name" class="sub-widget-input" placeholder="Name" autocomplete="name" required>',
      '      <input type="email" name="email" class="sub-widget-input" placeholder="Email" autocomplete="email" required>',
      '      <button type="submit" class="sub-widget-submit">',
      '        <span>Subscribe</span>',
      '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
      '      </button>',
      '      <p class="sub-widget-consent">No spam. One-click unsubscribe.</p>',
      '    </form>',
      '  </div>',
      '</aside>'
    ].join('\n');

    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    var node = wrap.firstElementChild;
    document.body.appendChild(node);

    var w = document.getElementById('subWidget');
    var closeBtn = document.getElementById('subWidgetClose');
    var form = document.getElementById('subWidgetForm');
    if (!w || !form) return;

    function dismiss() {
      w.classList.remove('is-open');
      w.classList.add('is-hidden');
      w.setAttribute('aria-hidden', 'true');
      try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
    }
    function show() {
      w.classList.add('is-open');
      w.setAttribute('aria-hidden', 'false');
    }
    setTimeout(show, 800);

    closeBtn.addEventListener('click', dismiss);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var fd = new FormData(form);
      var name = (fd.get('name') || '').toString().trim();
      var email = (fd.get('email') || '').toString().trim();
      try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
      var qs = 'email=' + encodeURIComponent(email);
      if (name) qs += '&name=' + encodeURIComponent(name);
      window.location.href = detailsUrl + '?' + qs;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
