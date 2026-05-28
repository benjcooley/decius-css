/*! decius-css v0.5.2 | MIT License | https://github.com/benjcooley/decius-css */

// js/src/decius.js
var $ = (sel, root = document) => root.querySelector(sel);
var $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
var clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
var num = (el2, attr, dflt) => el2.hasAttribute(attr) ? parseFloat(el2.getAttribute(attr)) : dflt;
var WIRED = "__dcsWired";
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
function icon(name) {
  return `<i class="di di-${name}"></i>`;
}
function emit(node, type, detail) {
  node.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
}
function targetOf(trigger) {
  const sel = trigger.getAttribute("data-dcs-target");
  return sel ? $(sel) : null;
}
function drag(e, onMove, onEnd) {
  e.preventDefault();
  const move = (ev) => onMove(ev);
  const up = (ev) => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    if (onEnd) onEnd(ev);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}
function place(node, anchor, placement = "bottom") {
  node.style.visibility = "hidden";
  node.hidden = false;
  const a = anchor.getBoundingClientRect();
  const r = node.getBoundingClientRect();
  const gap = 6;
  let top, left, pos = placement;
  if (placement === "top") {
    top = a.top - r.height - gap;
    left = a.left;
  } else if (placement === "left") {
    top = a.top;
    left = a.left - r.width - gap;
  } else if (placement === "right") {
    top = a.top;
    left = a.right + gap;
  } else {
    top = a.bottom + gap;
    left = a.left;
    pos = "bottom";
  }
  left = clamp(left, 8, window.innerWidth - r.width - 8);
  top = clamp(top, 8, window.innerHeight - r.height - 8);
  node.style.top = `${Math.round(top)}px`;
  node.style.left = `${Math.round(left)}px`;
  node.setAttribute("data-dcs-pos", pos);
  node.style.visibility = "";
}
function placeAt(node, x, y) {
  node.style.visibility = "hidden";
  node.hidden = false;
  const r = node.getBoundingClientRect();
  node.style.left = `${Math.round(clamp(x, 8, window.innerWidth - r.width - 8))}px`;
  node.style.top = `${Math.round(clamp(y, 8, window.innerHeight - r.height - 8))}px`;
  node.style.visibility = "";
}
var openLayers = /* @__PURE__ */ new Set();
function registerLayer(node, close) {
  const entry = { node, close };
  openLayers.add(entry);
  return () => openLayers.delete(entry);
}
document.addEventListener("pointerdown", (e) => {
  openLayers.forEach((l) => {
    if (!l.node.contains(e.target) && !e.target.closest("[data-dcs-toggle]")) l.close();
  });
}, true);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") openLayers.forEach((l) => l.close());
});
function initCollapse(root) {
  const wire = (headerSel, blockSel, collapsedCls, chevSel, chevOpenCls, ignoreSel) => {
    $$(headerSel, root).forEach((header) => {
      if (header[WIRED]) return;
      header[WIRED] = true;
      const block = header.closest(blockSel);
      const chev = $(chevSel, block);
      const sync = () => {
        if (chev) chev.classList.toggle(chevOpenCls, !block.classList.contains(collapsedCls));
      };
      sync();
      header.addEventListener("click", (e) => {
        if (ignoreSel && e.target.closest(ignoreSel)) return;
        block.classList.toggle(collapsedCls);
        sync();
        emit(block, "dcs:toggle", { open: !block.classList.contains(collapsedCls) });
      });
    });
  };
  wire(
    ".dcs-subpanel__header",
    ".dcs-subpanel",
    "dcs-subpanel--collapsed",
    ".dcs-subpanel__chevron",
    "dcs-subpanel__chevron--open",
    ".dcs-subpanel__close"
  );
  wire(
    ".dcs-foldout__header",
    ".dcs-foldout",
    "dcs-foldout--collapsed",
    ".dcs-foldout__chevron",
    "dcs-foldout__chevron--open",
    ".dcs-foldout__tools"
  );
}
var DISMISS = {
  alert: ".dcs-alert",
  toast: ".dcs-toast",
  card: ".dcs-card",
  panel: ".dcs-panel",
  subpanel: ".dcs-subpanel",
  modal: ".dcs-modal-backdrop",
  popover: ".dcs-popover",
  menu: ".dcs-menu"
};
function initDismiss(root) {
  const wireClose = (sel, ancestor) => $$(sel, root).forEach((btn) => {
    if (btn[WIRED]) return;
    btn[WIRED] = true;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      btn.closest(ancestor)?.remove();
    });
  });
  wireClose(".dcs-panel__close", ".dcs-panel");
  wireClose(".dcs-subpanel__close", ".dcs-subpanel");
  wireClose(".dcs-card__close", ".dcs-card");
  $$("[data-dcs-dismiss]", root).forEach((btn) => {
    if (btn[WIRED]) return;
    btn[WIRED] = true;
    btn.addEventListener("click", (e) => {
      const kind = btn.getAttribute("data-dcs-dismiss");
      const node = btn.closest(DISMISS[kind] || `.dcs-${kind}`);
      if (!node) return;
      e.stopPropagation();
      if (kind === "modal" || kind === "menu" || kind === "popover") node.hidden = true;
      else if (kind === "toast") dismissToast(node);
      else node.remove();
    });
  });
}
function openModal(idOrEl) {
  const m = typeof idOrEl === "string" ? $(idOrEl[0] === "#" ? idOrEl : `#${idOrEl}`) : idOrEl;
  if (!m) return;
  m.hidden = false;
  const close = () => closeModal(m);
  if (!m[WIRED]) {
    m[WIRED] = true;
    m.addEventListener("pointerdown", (e) => {
      if (e.target === m) close();
    });
  }
  m.__close = registerLayer(m, close);
  emit(m, "dcs:open");
}
function closeModal(m) {
  m.hidden = true;
  m.__close?.();
  emit(m, "dcs:close");
}
function initModal(root) {
  $$(".dcs-modal-backdrop", root).forEach((m) => {
    if (!m.hasAttribute("data-dcs-open")) m.hidden = true;
  });
  $$('[data-dcs-toggle="modal"]', root).forEach((t) => {
    if (t[WIRED]) return;
    t[WIRED] = true;
    t.addEventListener("click", () => openModal(targetOf(t)));
  });
}
function openMenu(menu, anchorOrPos) {
  closeAllMenus();
  if (anchorOrPos && anchorOrPos.nodeType) place(menu, anchorOrPos, "bottom");
  else if (anchorOrPos) placeAt(menu, anchorOrPos.x, anchorOrPos.y);
  else menu.hidden = false;
  menu.__close = registerLayer(menu, () => closeMenu(menu));
  emit(menu, "dcs:open");
}
function closeMenu(menu) {
  menu.hidden = true;
  menu.__close?.();
  emit(menu, "dcs:close");
}
function closeAllMenus() {
  $$(".dcs-menu").forEach((m) => {
    if (!m.hidden) closeMenu(m);
  });
}
function initMenu(root) {
  $$(".dcs-menu", root).forEach((m) => {
    if (m[WIRED]) return;
    m[WIRED] = true;
    m.hidden = true;
    m.addEventListener("click", (e) => {
      const item = e.target.closest(".dcs-menu__item");
      if (!item || item.classList.contains("dcs-menu__item--has-sub") || item.getAttribute("aria-disabled") === "true") return;
      emit(m, "dcs:select", { value: item.getAttribute("data-dcs-value"), item });
      closeMenu(m);
    });
  });
  $$('[data-dcs-toggle="menu"]', root).forEach((t) => {
    if (t[WIRED]) return;
    t[WIRED] = true;
    t.addEventListener("click", (e) => {
      e.stopPropagation();
      const m = targetOf(t);
      if (m) m.hidden ? openMenu(m, t) : closeMenu(m);
    });
  });
  $$("[data-dcs-menu]", root).forEach((host) => {
    if (host[WIRED]) return;
    host[WIRED] = true;
    host.addEventListener("contextmenu", (e) => {
      const m = $(host.getAttribute("data-dcs-menu"));
      if (!m) return;
      e.preventDefault();
      openMenu(m, { x: e.clientX, y: e.clientY });
    });
  });
}
function initPopover(root) {
  $$(".dcs-popover", root).forEach((p) => {
    p.hidden = true;
  });
  $$('[data-dcs-toggle="popover"]', root).forEach((t) => {
    if (t[WIRED]) return;
    t[WIRED] = true;
    t.addEventListener("click", (e) => {
      e.stopPropagation();
      const p = targetOf(t);
      if (!p) return;
      if (!p.hidden) {
        p.hidden = true;
        p.__close?.();
        return;
      }
      $$(".dcs-popover").forEach((o) => {
        if (!o.hidden) {
          o.hidden = true;
          o.__close?.();
        }
      });
      place(p, t, t.getAttribute("data-dcs-placement") || "bottom");
      p.__close = registerLayer(p, () => {
        p.hidden = true;
        p.__close?.();
      });
    });
  });
}
function initTabs(root) {
  $$(".dcs-tabs, .dcs-dockpane__tabs", root).forEach((bar) => {
    if (bar[WIRED]) return;
    bar[WIRED] = true;
    const tabSel = bar.classList.contains("dcs-tabs") ? ".dcs-tab" : ".dcs-dockpane__tab";
    bar.addEventListener("click", (e) => {
      const tab = e.target.closest(tabSel);
      if (!tab || e.target.closest(".dcs-dockpane__tab-close")) return;
      $$(tabSel, bar).forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      const tgtSel = tab.getAttribute("data-dcs-target");
      if (tgtSel) {
        const panel = $(tgtSel);
        if (panel && panel.parentElement) {
          $$("[data-dcs-tabpanel]", panel.parentElement).forEach((p) => {
            p.hidden = p !== panel;
          });
          panel.hidden = false;
        }
      }
      emit(bar, "dcs:tab", { value: tab.getAttribute("data-dcs-value") || tgtSel, tab });
    });
  });
}
function initToggles(root) {
  $$(".dcs-check, .dcs-radio, .dcs-switch", root).forEach((c) => {
    if (c[WIRED]) return;
    c[WIRED] = true;
    if (!c.hasAttribute("aria-checked")) c.setAttribute("aria-checked", "false");
    const isRadio = c.classList.contains("dcs-radio");
    const isCheck = c.classList.contains("dcs-check") && !isRadio;
    const render = () => {
      if (!isCheck) return;
      const box = $(".dcs-check__box", c);
      if (box) box.innerHTML = c.getAttribute("aria-checked") === "true" ? icon("check") : "";
    };
    render();
    c.addEventListener("click", () => {
      if (isRadio) {
        const name = c.getAttribute("data-dcs-name");
        if (name) $$(`.dcs-radio[data-dcs-name="${name}"]`, root).forEach((r) => r.setAttribute("aria-checked", "false"));
        c.setAttribute("aria-checked", "true");
      } else {
        c.setAttribute("aria-checked", String(c.getAttribute("aria-checked") !== "true"));
      }
      render();
      emit(c, "dcs:change", { checked: c.getAttribute("aria-checked") === "true" });
    });
  });
}
function initSlider(root) {
  $$("[data-dcs-slider]", root).forEach((s) => {
    if (s[WIRED]) return;
    s[WIRED] = true;
    s.classList.add("dcs-slider");
    const min = num(s, "data-min", 0), max = num(s, "data-max", 1);
    const step = num(s, "data-step", 0), bipolar = s.hasAttribute("data-bipolar");
    let value = num(s, "data-value", min);
    let track = $(".dcs-slider__track", s);
    if (!track) {
      track = el("div", "dcs-slider__track", '<div class="dcs-slider__fill"></div><div class="dcs-slider__thumb"></div>');
      s.appendChild(track);
    }
    const fill = $(".dcs-slider__fill", s), thumb = $(".dcs-slider__thumb", s);
    const render = () => {
      const pct = (value - min) / (max - min) * 100;
      thumb.style.left = `${pct}%`;
      if (bipolar) {
        const c = -min / (max - min) * 100;
        if (value >= 0) {
          fill.style.left = `${c}%`;
          fill.style.right = "auto";
          fill.style.width = `${pct - c}%`;
        } else {
          fill.style.right = `${100 - c}%`;
          fill.style.left = "auto";
          fill.style.width = `${c - pct}%`;
        }
      } else {
        fill.style.width = `${pct}%`;
      }
    };
    const set = (v) => {
      value = clamp(step ? Math.round(v / step) * step : v, min, max);
      s.setAttribute("data-value", value);
      render();
      emit(s, "input", { value });
    };
    render();
    s.addEventListener("pointerdown", (e) => {
      const rect = track.getBoundingClientRect();
      const upd = (cx) => set(min + clamp((cx - rect.left) / rect.width, 0, 1) * (max - min));
      upd(e.clientX);
      drag(e, (ev) => upd(ev.clientX));
    });
  });
  $$("[data-dcs-fader]", root).forEach((f) => {
    if (f[WIRED]) return;
    f[WIRED] = true;
    f.classList.add("dcs-fader");
    const min = num(f, "data-min", 0), max = num(f, "data-max", 1);
    let value = num(f, "data-value", min);
    if (!$(".dcs-fader__track", f)) {
      f.appendChild(el("div", "dcs-fader__track"));
      f.appendChild(el("div", "dcs-fader__thumb"));
    }
    const thumb = $(".dcs-fader__thumb", f);
    const render = () => {
      thumb.style.top = `${100 - (value - min) / (max - min) * 100}%`;
    };
    const set = (v) => {
      value = clamp(v, min, max);
      f.setAttribute("data-value", value);
      render();
      emit(f, "input", { value });
    };
    render();
    f.addEventListener("pointerdown", (e) => {
      const rect = f.getBoundingClientRect();
      const upd = (cy) => set(min + (1 - clamp((cy - rect.top) / rect.height, 0, 1)) * (max - min));
      upd(e.clientY);
      drag(e, (ev) => upd(ev.clientY));
    });
  });
}
function initSplitter(root) {
  $$("[data-dcs-splitter]", root).forEach((sp) => {
    if (sp[WIRED]) return;
    sp[WIRED] = true;
    const horiz = sp.classList.contains("dcs-splitter--h") || sp.getAttribute("data-dcs-splitter") === "h";
    sp.addEventListener("pointerdown", (e) => {
      const prev = sp.previousElementSibling, next = sp.nextElementSibling;
      if (!prev || !next) return;
      e.preventDefault();
      sp.classList.add("dcs-splitter--active");
      const axis = horiz ? "clientY" : "clientX";
      const dim = horiz ? "offsetHeight" : "offsetWidth";
      let last = e[axis];
      const totalPx = prev[dim] + next[dim];
      let pg = parseFloat(getComputedStyle(prev).flexGrow) || 1;
      let ng = parseFloat(getComputedStyle(next).flexGrow) || 1;
      const totalW = pg + ng, minW = totalW * 0.07;
      drag(e, (ev) => {
        const d = ev[axis] - last;
        last = ev[axis];
        pg = clamp(pg + d * (totalW / Math.max(1, totalPx)), minW, totalW - minW);
        ng = totalW - pg;
        prev.style.flexGrow = pg;
        next.style.flexGrow = ng;
      }, () => sp.classList.remove("dcs-splitter--active"));
    });
  });
}
function initKnob(root) {
  $$("[data-dcs-knob]", root).forEach((k) => {
    if (k[WIRED]) return;
    k[WIRED] = true;
    k.classList.add("dcs-knob");
    const min = num(k, "data-min", 0), max = num(k, "data-max", 1);
    const bipolar = k.hasAttribute("data-bipolar");
    const label = k.getAttribute("data-label");
    let value = num(k, "data-value", min);
    if (k.getAttribute("data-size")) k.style.setProperty("--knob-size", `${k.getAttribute("data-size")}px`);
    const r = 10.5;
    const polar = (deg) => [12 + r * Math.cos(deg * Math.PI / 180), 12 + r * Math.sin(deg * Math.PI / 180)];
    const ns = "http://www.w3.org/2000/svg";
    let ring = $(".dcs-knob__ring", k);
    if (!ring) {
      ring = document.createElementNS(ns, "svg");
      ring.setAttribute("class", "dcs-knob__ring");
      ring.setAttribute("viewBox", "0 0 24 24");
      const [tsx, tsy] = polar(-225), [tex, tey] = polar(45);
      const trk = document.createElementNS(ns, "path");
      trk.setAttribute("d", `M ${tsx} ${tsy} A ${r} ${r} 0 1 1 ${tex} ${tey}`);
      trk.setAttribute("fill", "none");
      trk.setAttribute("stroke", "rgba(255,255,255,.08)");
      trk.setAttribute("stroke-width", "1.5");
      trk.setAttribute("stroke-linecap", "round");
      const arc2 = document.createElementNS(ns, "path");
      arc2.setAttribute("class", "dcs-knob__arc");
      arc2.setAttribute("fill", "none");
      arc2.setAttribute("stroke", "var(--dcs-accent)");
      arc2.setAttribute("stroke-width", "1.75");
      arc2.setAttribute("stroke-linecap", "round");
      ring.append(trk, arc2);
      k.appendChild(ring);
      k.appendChild(el("div", "dcs-knob__cap"));
      k.appendChild(el("div", "dcs-knob__indicator"));
      if (label) {
        k.appendChild(el("div", "dcs-knob__label", label));
        k.appendChild(el("div", "dcs-knob__value"));
      }
    }
    const indicator = $(".dcs-knob__indicator", k), arc = $(".dcs-knob__arc", k), valEl = $(".dcs-knob__value", k);
    const render = () => {
      const norm = (value - min) / (max - min);
      indicator.style.setProperty("--angle", `${-135 + norm * 270}deg`);
      const sweepDeg = bipolar ? (norm - 0.5) * 270 : norm * 270;
      const aStart = bipolar ? -90 : -225;
      const aEnd = aStart + sweepDeg;
      if (Math.abs(sweepDeg) > 0.5) {
        const [sx, sy] = polar(aStart), [ex, ey] = polar(aEnd);
        arc.setAttribute("d", `M ${sx} ${sy} A ${r} ${r} 0 ${Math.abs(aEnd - aStart) > 180 ? 1 : 0} ${aEnd >= aStart ? 1 : 0} ${ex} ${ey}`);
      } else arc.removeAttribute("d");
      if (valEl) valEl.textContent = value.toFixed(2);
    };
    render();
    k.addEventListener("pointerdown", (e) => {
      const startY = e.clientY, startVal = value, range = max - min;
      drag(e, (ev) => {
        const scale = ev.shiftKey ? 400 : 150;
        value = clamp(startVal + (startY - ev.clientY) / scale * range, min, max);
        k.setAttribute("data-value", value);
        render();
        emit(k, "input", { value });
      });
    });
  });
}
function initCombo(root) {
  $$("[data-dcs-combo]", root).forEach((c) => {
    if (c[WIRED]) return;
    c[WIRED] = true;
    c.classList.add("dcs-combo");
    const min = num(c, "data-min", 0), max = num(c, "data-max", 1), step = num(c, "data-step", 0.01);
    const label = c.getAttribute("data-label");
    let value = num(c, "data-value", min);
    if (!$(".dcs-combo__value", c)) {
      c.appendChild(el("div", "dcs-combo__fill"));
      const dec = el("div", "dcs-combo__btn", icon("chevron-left"));
      const inc = el("div", "dcs-combo__btn", icon("chevron-right"));
      c.appendChild(dec);
      if (label) c.appendChild(el("div", "dcs-combo__label", label));
      c.appendChild(el("div", "dcs-combo__value"));
      c.appendChild(inc);
      dec.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        set(value - step);
      });
      inc.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        set(value + step);
      });
    }
    const fill = $(".dcs-combo__fill", c), valEl = $(".dcs-combo__value", c);
    const render = () => {
      c.style.setProperty("--fill", `${(value - min) / (max - min) * 100}%`);
      valEl.textContent = value.toFixed(2);
    };
    function set(v) {
      value = clamp(step ? Math.round(v / step) * step : v, min, max);
      c.setAttribute("data-value", value);
      render();
      emit(c, "input", { value });
    }
    render();
    c.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".dcs-combo__btn")) return;
      const rect = c.getBoundingClientRect(), startX = e.clientX, startVal = value, range = max - min;
      let dragged = false;
      drag(e, (ev) => {
        if (Math.abs(ev.clientX - startX) > 3) dragged = true;
        set(startVal + (ev.clientX - startX) / rect.width * range * (ev.shiftKey ? 4 : 1));
      }, () => {
        if (!dragged) startEdit();
      });
    });
    function startEdit() {
      c.classList.add("dcs-combo--editing");
      const input = el("input", "dcs-combo__edit");
      input.value = String(value);
      c.appendChild(input);
      input.focus();
      input.select();
      const commit = () => {
        const p = parseFloat(input.value);
        if (!Number.isNaN(p)) set(p);
        end();
      };
      const end = () => {
        c.classList.remove("dcs-combo--editing");
        input.remove();
      };
      input.addEventListener("blur", commit);
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") commit();
        else if (ev.key === "Escape") end();
      });
    }
  });
}
var TOAST_ICON = { info: "info", ok: "check-circle", warn: "alert", danger: "error" };
function toastContainer(placement) {
  const cls = `dcs-toasts${placement && placement !== "bottom-right" ? ` dcs-toasts--${placement}` : ""}`;
  let c = $(`.dcs-toasts[data-dcs-placement="${placement || "bottom-right"}"]`);
  if (!c) {
    c = el("div", cls);
    c.setAttribute("data-dcs-placement", placement || "bottom-right");
    document.body.appendChild(c);
  }
  return c;
}
function dismissToast(t) {
  t.classList.add("dcs-toast--out");
  t.addEventListener("animationend", () => t.remove(), { once: true });
  setTimeout(() => t.remove(), 400);
}
function toast(opts = {}) {
  const { title, message, variant = "info", timeout = 4e3, placement = "bottom-right" } = opts;
  const t = el("div", `dcs-toast dcs-toast--${variant}`);
  t.innerHTML = `<div class="dcs-toast__icon">${icon(opts.icon || TOAST_ICON[variant] || "info")}</div><div class="dcs-toast__body">${title ? `<div class="dcs-toast__title">${title}</div>` : ""}${message ? `<div class="dcs-toast__msg">${message}</div>` : ""}</div><div class="dcs-toast__close">${icon("close")}</div>`;
  $(".dcs-toast__close", t).addEventListener("click", () => dismissToast(t));
  toastContainer(placement).appendChild(t);
  if (timeout) setTimeout(() => {
    if (t.isConnected) dismissToast(t);
  }, timeout);
  return { el: t, dismiss: () => dismissToast(t) };
}
function initSelect(root) {
  const ROW = ".dcs-list__item, .dcs-tree__row";
  $$("[data-dcs-select]", root).forEach((box) => {
    if (box[WIRED]) return;
    box[WIRED] = true;
    const multi = box.getAttribute("data-dcs-select") === "multi";
    let anchor = null;
    box.addEventListener("click", (e) => {
      const row = e.target.closest(ROW);
      if (!row || !box.contains(row)) return;
      const rows = $$(ROW, box);
      const mark = (r, on) => r.setAttribute("aria-selected", on ? "true" : "false");
      if (multi && (e.metaKey || e.ctrlKey)) {
        mark(row, row.getAttribute("aria-selected") !== "true");
        anchor = row;
      } else if (multi && e.shiftKey && anchor && box.contains(anchor)) {
        const a = rows.indexOf(anchor), b = rows.indexOf(row), lo = Math.min(a, b), hi = Math.max(a, b);
        rows.forEach((r, i) => mark(r, i >= lo && i <= hi));
      } else {
        rows.forEach((r) => mark(r, r === row));
        anchor = row;
      }
      emit(box, "dcs:select", { selected: rows.filter((r) => r.getAttribute("aria-selected") === "true") });
    });
  });
}
var dndCurrent = null;
function initDnd(root) {
  $$("[data-dcs-drag]", root).forEach((el2) => {
    if (el2[WIRED]) return;
    el2[WIRED] = true;
    el2.setAttribute("draggable", "true");
    el2.addEventListener("dragstart", (e) => {
      dndCurrent = { type: el2.getAttribute("data-dcs-drag-type") || el2.getAttribute("data-dcs-drag") || "", id: el2.getAttribute("data-dcs-drag-id") || "", el: el2 };
      e.dataTransfer.effectAllowed = "copyMove";
      try {
        e.dataTransfer.setData("text/plain", dndCurrent.id || el2.textContent.trim());
      } catch (_) {
      }
      emit(el2, "dcs:dragstart", dndCurrent);
    });
    el2.addEventListener("dragend", () => {
      dndCurrent = null;
    });
  });
  $$("[data-dcs-drop]", root).forEach((zone) => {
    if (zone[WIRED]) return;
    zone[WIRED] = true;
    const accept = (zone.getAttribute("data-dcs-accept") || "").split(/[\s,]+/).filter(Boolean);
    const ok = () => dndCurrent && (accept.length === 0 || accept.includes(dndCurrent.type));
    const clear = () => zone.classList.remove("dcs-drop--valid", "dcs-drop--invalid");
    zone.addEventListener("dragover", (e) => {
      if (!dndCurrent) return;
      if (ok()) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        zone.classList.add("dcs-drop--valid");
      } else zone.classList.add("dcs-drop--invalid");
    });
    zone.addEventListener("dragleave", clear);
    zone.addEventListener("drop", (e) => {
      clear();
      if (!ok()) return;
      e.preventDefault();
      emit(zone, "dcs:drop", { type: dndCurrent.type, id: dndCurrent.id, source: dndCurrent.el, target: zone });
    });
  });
}
function init(root = document) {
  initCollapse(root);
  initDismiss(root);
  initModal(root);
  initMenu(root);
  initPopover(root);
  initTabs(root);
  initToggles(root);
  initSelect(root);
  initDnd(root);
  initSlider(root);
  initKnob(root);
  initCombo(root);
  initSplitter(root);
  return decius;
}
var decius = {
  version: "0.5.2",
  init,
  toast,
  modal: { open: openModal, close: (id) => {
    const m = typeof id === "string" ? $(id[0] === "#" ? id : `#${id}`) : id;
    if (m) closeModal(m);
  } },
  menu: { open: (id, at) => {
    const m = typeof id === "string" ? $(id[0] === "#" ? id : `#${id}`) : id;
    if (m) openMenu(m, at);
  }, close: closeAllMenus }
};
if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => init());
  else init();
}
var decius_default = decius;
export {
  decius_default as default,
  init,
  toast
};
/*!
 * decius.js — zero-dependency runtime for decius.css components.
 *
 * A Bootstrap-style data-attribute API plus a small programmatic API. No React,
 * no dependencies. Auto-initializes on DOMContentLoaded; call `decius.init(root)`
 * after injecting markup dynamically. Everything is idempotent.
 *
 * Data API quick reference:
 *   [data-dcs-toggle="modal"]   [data-dcs-target="#id"]
 *   [data-dcs-toggle="menu"]    [data-dcs-target="#id"]
 *   [data-dcs-toggle="popover"] [data-dcs-target="#id"] [data-dcs-placement="top"]
 *   [data-dcs-toggle="tab"]     [data-dcs-target="#panel"]
 *   [data-dcs-menu="#id"]       (right-click context menu on this element)
 *   [data-dcs-dismiss="modal|menu|popover|toast|alert|panel|subpanel|card"]
 *   [data-dcs-slider] / [data-dcs-fader] / [data-dcs-knob] / [data-dcs-combo]
 *   [data-dcs-splitter]   (resize previous/next flex siblings)
 *   [data-dcs-select] / [data-dcs-select="multi"]  (row selection on list/tree)
 *   [data-dcs-drag] [data-dcs-drag-type] / [data-dcs-drop] [data-dcs-accept]  (typed DnD)
 *   .dcs-subpanel__header / .dcs-foldout__header   (collapse, zero-config)
 *   .dcs-check / .dcs-radio / .dcs-switch          (toggle, zero-config)
 *
 * Scope note: this runtime covers per-component behavior (menus, modals,
 * popovers, tabs, toasts, collapse, the drag controls, and splitter resize).
 * A full drag-to-DOCK layout manager (rearranging panes by dragging tabs) is
 * application-level and is provided as a React reference component in the docs
 * (and natively by affineui) — it is intentionally NOT part of this script.
 */
