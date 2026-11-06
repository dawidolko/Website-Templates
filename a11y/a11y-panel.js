/*
 * Accessibility panel: reader preferences for any website, with no dependencies.
 *
 * It lets a visitor change how a page looks and remembers the choice on this device.
 * It does not repair a page and does not make one WCAG compliant: that work belongs in
 * the markup. Add it with <script src="/a11y/a11y-panel.js" defer></script>.
 * Language follows <html lang>. On the script tag, data-position="right" moves the button
 * and data-accent="#b45309" gives it the site's colour; pick one with 4.5:1 against white.
 */
(function () {
  var KEY = "a11y-panel";
  var SIZES = [100, 110, 120, 130, 140];
  var script = document.currentScript;
  var base = script ? script.src.replace(/[^/]*$/, "") : "/a11y/";
  var side = script && script.dataset.position === "right" ? "right" : "left";
  var accent = script && script.dataset.accent;

  var STRINGS = {
    en: {
      open: "Open accessibility settings",
      close: "Close accessibility settings",
      title: "Accessibility",
      note: "These settings stay on this device.",
      size: "Text size",
      smaller: "Smaller text",
      larger: "Larger text",
      display: "Display",
      reading: "Reading",
      reset: "Reset all settings",
      grayscale: "Grayscale",
      contrast: "High contrast",
      invert: "Inverted colours",
      light: "Light background",
      links: "Underline links",
      font: "Readable font",
      motion: "Stop animations",
    },
    pl: {
      open: "Otwórz ustawienia dostępności",
      close: "Zamknij ustawienia dostępności",
      title: "Dostępność",
      note: "Te ustawienia zostają na tym urządzeniu.",
      size: "Rozmiar tekstu",
      smaller: "Mniejszy tekst",
      larger: "Większy tekst",
      display: "Wyświetlanie",
      reading: "Czytanie",
      reset: "Przywróć ustawienia",
      grayscale: "Skala szarości",
      contrast: "Wysoki kontrast",
      invert: "Odwrócone kolory",
      light: "Jasne tło",
      links: "Podkreśl linki",
      font: "Czytelna czcionka",
      motion: "Zatrzymaj animacje",
    },
  };

  var GROUPS = [
    ["display", ["grayscale", "contrast", "invert", "light"]],
    ["reading", ["links", "font", "motion"]],
  ];
  /* Only one colour mode at a time, because they overwrite each other. */
  var EXCLUSIVE = ["grayscale", "contrast", "invert", "light"];
  var root = document.documentElement;
  var state = { size: 100, on: [] };

  function read() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (saved && SIZES.indexOf(saved.size) !== -1) state.size = saved.size;
      if (saved && Array.isArray(saved.on)) state.on = saved.on;
    } catch {
      /* A corrupt or blocked store only means the defaults apply. */
    }
  }

  function write() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* A blocked store only means the choice lasts for this page. */
    }
  }

  function apply() {
    var classes = root.className.split(/\s+/).filter(function (name) {
      return name.indexOf("a11yp-") !== 0;
    });
    state.on.forEach(function (id) {
      classes.push("a11yp-" + id);
    });
    if (state.size !== 100) classes.push("a11yp-size-" + state.size);
    root.className = classes.join(" ");
  }

  /* Applied at once, so a saved contrast setting does not flash the normal page first. */
  read();
  apply();

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function build() {
    var lang = (root.lang || "en").slice(0, 2).toLowerCase();
    var t = STRINGS[lang] || STRINGS.en;

    var style = element("link");
    style.rel = "stylesheet";
    style.href = base + "a11y-panel.css";
    document.head.appendChild(style);

    var wrap = element("div", "a11yp a11yp--" + side);
    if (accent) wrap.style.setProperty("--a11yp-accent", accent);
    var toggle = element("button", "a11yp__toggle");
    toggle.type = "button";
    toggle.setAttribute("aria-label", t.open);
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "a11yp-panel");
    toggle.innerHTML =
      '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false"><circle cx="12" cy="4.5" r="2.2"/><path d="M4 8.2c2.6.9 5.3 1.3 8 1.3s5.4-.4 8-1.3l.6 1.9c-1.9.7-3.9 1.1-5.9 1.3v3.2l1.7 7-1.9.5-1.9-6.3h-1.2l-1.9 6.3-1.9-.5 1.7-7v-3.2c-2-.2-4-.6-5.9-1.3z"/></svg>';

    var panel = element("section", "a11yp__panel");
    panel.id = "a11yp-panel";
    panel.setAttribute("aria-label", t.title);
    panel.hidden = true;

    var head = element("div", "a11yp__head");
    var title = element("h2", "a11yp__title", t.title);
    var close = element("button", "a11yp__close");
    close.type = "button";
    close.setAttribute("aria-label", t.close);
    close.textContent = "×";
    head.appendChild(title);
    head.appendChild(close);
    panel.appendChild(head);
    panel.appendChild(element("p", "a11yp__note", t.note));

    var sizeRow = element("div", "a11yp__size");
    var sizeLabel = element("p", "a11yp__label", t.size);
    var minus = element("button", "a11yp__step", "A−");
    var output = element("output", "a11yp__value");
    var plus = element("button", "a11yp__step", "A+");
    minus.type = "button";
    plus.type = "button";
    minus.setAttribute("aria-label", t.smaller);
    plus.setAttribute("aria-label", t.larger);
    sizeRow.appendChild(minus);
    sizeRow.appendChild(output);
    sizeRow.appendChild(plus);
    panel.appendChild(sizeLabel);
    panel.appendChild(sizeRow);

    var switches = [];
    GROUPS.forEach(function (group) {
      panel.appendChild(element("p", "a11yp__label", t[group[0]]));
      var grid = element("div", "a11yp__grid");
      group[1].forEach(function (id) {
        var button = element("button", "a11yp__option", t[id]);
        button.type = "button";
        button.dataset.option = id;
        button.addEventListener("click", function () {
          var at = state.on.indexOf(id);
          if (at !== -1) {
            state.on.splice(at, 1);
          } else {
            if (EXCLUSIVE.indexOf(id) !== -1) {
              state.on = state.on.filter(function (other) {
                return EXCLUSIVE.indexOf(other) === -1;
              });
            }
            state.on.push(id);
          }
          update();
        });
        switches.push(button);
        grid.appendChild(button);
      });
      panel.appendChild(grid);
    });

    var reset = element("button", "a11yp__reset", t.reset);
    reset.type = "button";
    panel.appendChild(reset);

    function update() {
      apply();
      write();
      output.textContent = state.size + "%";
      minus.disabled = state.size === SIZES[0];
      plus.disabled = state.size === SIZES[SIZES.length - 1];
      switches.forEach(function (button) {
        button.setAttribute("aria-pressed", String(state.on.indexOf(button.dataset.option) !== -1));
      });
    }

    function step(direction) {
      var next = SIZES[SIZES.indexOf(state.size) + direction];
      if (next) {
        state.size = next;
        update();
      }
    }

    function setOpen(open, returnFocus) {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? t.close : t.open);
      if (open) title.focus();
      else if (returnFocus) toggle.focus();
    }

    title.tabIndex = -1;
    minus.addEventListener("click", function () {
      step(-1);
    });
    plus.addEventListener("click", function () {
      step(1);
    });
    reset.addEventListener("click", function () {
      state = { size: 100, on: [] };
      update();
    });
    toggle.addEventListener("click", function () {
      setOpen(panel.hidden, false);
    });
    close.addEventListener("click", function () {
      setOpen(false, true);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !panel.hidden) setOpen(false, true);
    });
    document.addEventListener("click", function (event) {
      if (!panel.hidden && !wrap.contains(event.target)) setOpen(false, false);
    });

    wrap.appendChild(panel);
    wrap.appendChild(toggle);
    document.body.appendChild(wrap);
    update();
    /* A framework can replace the body while it starts, so the panel checks it survived. */
    window.addEventListener("load", function () {
      setTimeout(function () {
        if (!wrap.isConnected) document.body.appendChild(wrap);
      }, 1500);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
