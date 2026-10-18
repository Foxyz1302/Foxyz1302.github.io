/*
 * foxyz app card embed.
 *
 *   <script src="https://donations.foxyz.ru/embed.js" data-app="starsync" async></script>
 *
 * Options (attributes on the script tag):
 *   data-app    app id from data.json (required)
 *   data-lang   "en" (default) or "ru"
 *   data-theme  "dark" (default) or "light"
 *
 * It puts an <iframe> with the card right after the script tag and keeps its
 * height in step with the card.
 */
(function () {
  var s = document.currentScript;
  if (!s || !s.dataset.app) return;
  var origin = new URL(s.src).origin;
  var path = (s.dataset.lang === 'ru' ? '/ru' : '') + '/embed/' + encodeURIComponent(s.dataset.app) + '/';
  var f = document.createElement('iframe');
  f.src = origin + path + (s.dataset.theme === 'light' ? '?theme=light' : '');
  f.title = s.dataset.app;
  f.loading = 'lazy';
  f.setAttribute('allowtransparency', 'true');
  f.style.cssText = 'border:0;display:block;width:100%;max-width:424px;height:196px;background:transparent;color-scheme:normal';
  s.parentNode.insertBefore(f, s.nextSibling);
  window.addEventListener('message', function (e) {
    if (e.origin !== origin || e.source !== f.contentWindow) return;
    if (e.data && e.data.type === 'foxyz-embed:height') f.style.height = e.data.height + 'px';
  });
})();
