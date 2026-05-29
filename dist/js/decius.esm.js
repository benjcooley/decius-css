/*! decius-css v0.6.0 | MIT License | https://github.com/benjcooley/decius-css */

// js/src/decius.js
var $ = (sel, root = document) => root.querySelector(sel);
var $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
function $$inc(sel, root) {
  const out = [];
  if (root && root.nodeType === 1 && root.matches && root.matches(sel)) out.push(root);
  if (root && root.querySelectorAll) out.push(...root.querySelectorAll(sel));
  return out;
}
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
function place(node, anchor, placement = "bottom", gap = 6) {
  node.style.visibility = "hidden";
  node.hidden = false;
  const a = anchor.getBoundingClientRect();
  const r = node.getBoundingClientRect();
  let top, left, pos = placement;
  if (placement === "top") {
    top = a.top - r.height - gap;
    left = a.left;
  } else if (placement === "top-end") {
    top = a.top - r.height - gap;
    left = a.right - r.width;
  } else if (placement === "bottom-end") {
    top = a.bottom + gap;
    left = a.right - r.width;
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
function openMenu(menu, anchorOrPos, anchorEl) {
  closeAllMenus();
  if (anchorOrPos && anchorOrPos.nodeType) place(menu, anchorOrPos, "bottom", 0);
  else if (anchorOrPos) placeAt(menu, anchorOrPos.x, anchorOrPos.y);
  else menu.hidden = false;
  if (anchorEl) anchorEl.setAttribute("aria-expanded", "true");
  menu.__anchor = anchorEl || null;
  menu.__close = registerLayer(menu, () => closeMenu(menu));
  emit(menu, "dcs:open");
}
function closeMenu(menu) {
  menu.hidden = true;
  if (menu.__anchor) {
    menu.__anchor.setAttribute("aria-expanded", "false");
    menu.__anchor = null;
  }
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
    if (!t.hasAttribute("aria-expanded")) t.setAttribute("aria-expanded", "false");
    t.addEventListener("click", (e) => {
      e.stopPropagation();
      const m = targetOf(t);
      if (m) m.hidden ? openMenu(m, t, t) : closeMenu(m);
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
    if (!t.hasAttribute("aria-expanded")) t.setAttribute("aria-expanded", "false");
    t.addEventListener("click", (e) => {
      e.stopPropagation();
      const p = targetOf(t);
      if (!p) return;
      if (!p.hidden) {
        p.hidden = true;
        t.setAttribute("aria-expanded", "false");
        p.__close?.();
        return;
      }
      $$(".dcs-popover").forEach((o) => {
        if (!o.hidden) {
          o.hidden = true;
          o.__close?.();
        }
      });
      $$('[data-dcs-toggle="popover"][aria-expanded="true"]').forEach((other) => {
        if (other !== t) other.setAttribute("aria-expanded", "false");
      });
      place(p, t, t.getAttribute("data-dcs-placement") || "bottom");
      t.setAttribute("aria-expanded", "true");
      p.__close = registerLayer(p, () => {
        p.hidden = true;
        t.setAttribute("aria-expanded", "false");
        p.__close?.();
      });
    });
  });
}
function syncTabToolbars(dockpane, tgtSel) {
  if (!dockpane || !tgtSel) return;
  $$(".dcs-dockpane__toolbar[data-dcs-tabtoolbar]", dockpane).forEach((tb) => {
    tb.hidden = tb.getAttribute("data-dcs-tabtoolbar") !== tgtSel;
  });
}
function closeDockpaneTab(tab) {
  const dock = tab.closest(".dcs-dockpane");
  const targetSel = tab.getAttribute("data-dcs-target");
  const panel = targetSel && $(targetSel);
  emit(tab, "dcs:tab-close", { tab, panel, dock });
  tab.remove();
  if (panel) panel.remove();
  cleanupSourceDock(dock);
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
        syncTabToolbars(bar.closest(".dcs-dockpane"), tgtSel);
      }
      emit(bar, "dcs:tab", { value: tab.getAttribute("data-dcs-value") || tgtSel, tab });
    });
    const sel = $(`${tabSel}[aria-selected="true"]`, bar) || $(tabSel, bar);
    const tgt = sel && sel.getAttribute("data-dcs-target");
    if (tgt) syncTabToolbars(bar.closest(".dcs-dockpane"), tgt);
  });
}
function buildDefaultTabMenu() {
  if ($("#dcs-default-tab-menu")) return;
  const m = el("div", "dcs-menu");
  m.id = "dcs-default-tab-menu";
  m.innerHTML = '<div class="dcs-menu__item" data-dcs-value="close"><span class="dcs-menu__icon">' + icon("close") + '</span><span class="dcs-menu__label-text">Close tab</span></div>';
  document.body.appendChild(m);
  initMenu(m.parentElement);
}
function initDockpaneMenu(root) {
  $$inc(".dcs-dockpane", root).forEach((dock) => {
    if (dock[WIRED + "_dpmenu"]) return;
    dock[WIRED + "_dpmenu"] = true;
    const tabbar = $(".dcs-dockpane__tabbar", dock) || $(".dcs-dockpane__tabs", dock);
    if (!tabbar) return;
    if (dock.getAttribute("data-dcs-tab-menu") === "false") return;
    if ($(":scope > .dcs-dockpane__menu", tabbar)) return;
    const menuSel = dock.getAttribute("data-dcs-tab-menu");
    if (!menuSel) buildDefaultTabMenu();
    const targetMenu = menuSel || "#dcs-default-tab-menu";
    const btn = el("button", "dcs-dockpane__menu", icon("more-v"));
    btn.setAttribute("data-dcs-toggle", "menu");
    btn.setAttribute("data-dcs-target", targetMenu);
    btn.setAttribute("aria-label", "Tab actions");
    tabbar.appendChild(btn);
    btn.addEventListener("dcs:open", () => {
    });
    if (!menuSel) {
      const defaultMenu = $("#dcs-default-tab-menu");
      if (defaultMenu) {
        defaultMenu.addEventListener("dcs:select", (e) => {
          if (e.detail.value !== "close") return;
          if (defaultMenu.__anchor !== btn) return;
          const activeTab = $('.dcs-dockpane__tab[aria-selected="true"]', dock);
          if (activeTab) closeDockpaneTab(activeTab);
        });
      }
    }
    initMenu(tabbar);
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
      const startPos = e[axis];
      const prevPx = prev[dim], nextPx = next[dim];
      const totalPx = prevPx + nextPx;
      const minPx = 24;
      prev.style.flex = "1 1 " + prevPx + "px";
      next.style.flex = "1 1 " + nextPx + "px";
      drag(e, (ev) => {
        const delta = ev[axis] - startPos;
        const newPrev = clamp(prevPx + delta, minPx, totalPx - minPx);
        const newNext = totalPx - newPrev;
        prev.style.flexBasis = newPrev + "px";
        next.style.flexBasis = newNext + "px";
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
    const hasMin = c.hasAttribute("data-min");
    const hasMax = c.hasAttribute("data-max");
    const unbounded = !hasMin && !hasMax;
    const min = unbounded ? -Infinity : num(c, "data-min", 0);
    const max = unbounded ? Infinity : num(c, "data-max", 1);
    const step = num(c, "data-step", 0.01);
    const decN = num(c, "data-dec", 2);
    const label = c.getAttribute("data-label");
    let value = num(c, "data-value", isFinite(min) ? min : 0);
    if (!$(".dcs-combo__value", c)) {
      c.appendChild(el("div", "dcs-combo__fill"));
      const decBtn = el("div", "dcs-combo__btn", icon("chevron-left"));
      const incBtn = el("div", "dcs-combo__btn", icon("chevron-right"));
      c.appendChild(decBtn);
      if (label) c.appendChild(el("div", "dcs-combo__label", label));
      c.appendChild(el("div", "dcs-combo__value"));
      c.appendChild(incBtn);
      decBtn.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        set(value - step);
      });
      incBtn.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        set(value + step);
      });
    }
    const valEl = $(".dcs-combo__value", c);
    function formatVal(v) {
      const fixed = v.toFixed(decN);
      if (fixed.indexOf(".") < 0) return fixed;
      return fixed.replace(/0+$/, "").replace(/\.$/, "");
    }
    const render = () => {
      if (!unbounded) c.style.setProperty("--fill", `${(value - min) / (max - min) * 100}%`);
      valEl.textContent = formatVal(value);
    };
    function set(v, opts) {
      let next = step ? Math.round(v / step) * step : v;
      if (decN >= 0) next = parseFloat(next.toFixed(decN + 6));
      if (!unbounded) next = clamp(next, min, max);
      value = next;
      c.setAttribute("data-value", value);
      render();
      if (!(opts && opts.silent)) emit(c, "input", { value });
    }
    c.dcsSet = (v) => set(v, { silent: true });
    render();
    c.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".dcs-combo__btn")) return;
      const startX = e.clientX, startVal = value;
      const rect = c.getBoundingClientRect();
      let lastX = startX;
      let dragged = false;
      drag(e, (ev) => {
        if (Math.abs(ev.clientX - startX) > 3) dragged = true;
        const mult = ev.shiftKey ? 4 : 1;
        if (unbounded) {
          const dx = ev.clientX - lastX;
          const scaledStep = Math.max(step, Math.abs(value) / 100);
          set(value + dx * scaledStep * mult);
        } else {
          set(startVal + (ev.clientX - startX) / rect.width * (max - min) * mult);
        }
        lastX = ev.clientX;
      }, () => {
        if (!dragged) startEdit();
      });
    });
    function startEdit() {
      c.classList.add("dcs-combo--editing");
      const input = el("input", "dcs-combo__edit");
      input.value = formatVal(value);
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
function initVecLayout(root) {
  $$inc(".dcs-vec", root).forEach((vec) => {
    if (vec[WIRED + "_vec"]) return;
    vec[WIRED + "_vec"] = true;
    const field = vec.closest(".dcs-field");
    const update = () => {
      const cs = getComputedStyle(vec);
      const minS = parseFloat(cs.getPropertyValue("--dcs-xform-minwidth")) || 72;
      const gap = parseFloat(cs.gap) || 0;
      const n = vec.children.length || 1;
      const needed = n * minS + (n - 1) * gap;
      let avail = vec.clientWidth;
      if (field) {
        const fCs = getComputedStyle(field);
        const fGap = parseFloat(fCs.columnGap) || parseFloat(fCs.gap) || 0;
        let used = 0, extras = 0;
        Array.from(field.children).forEach((c) => {
          if (c === vec) return;
          used += c.offsetWidth;
          extras++;
        });
        avail = field.clientWidth - used - extras * fGap;
      }
      vec.classList.toggle("dcs-vec--stacked", avail + 1 < needed);
    };
    const ro = new ResizeObserver(update);
    ro.observe(vec);
    if (field) ro.observe(field);
    update();
  });
}
function initRadioGroups(root) {
  $$("[data-dcs-radio]", root).forEach((btn) => {
    if (btn[WIRED + "_radio"]) return;
    btn[WIRED + "_radio"] = true;
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-dcs-radio");
      const scope = btn.closest(".dcs-btn-group, .dcs-toolbar, .dcs-dockpane, [data-dcs-radio-scope]") || document;
      $$(`[data-dcs-radio="${name}"]`, scope).forEach((b) => {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      emit(btn, "dcs:radio", { name, value: btn.getAttribute("data-dcs-value") || btn.id || null });
    });
  });
}
function refreshTreeVisibility(tree) {
  const rows = $$(".dcs-tree__row", tree);
  const openByDepth = [];
  rows.forEach((row) => {
    const depth = parseInt(row.style.getPropertyValue("--depth") || "0", 10);
    let visible = true;
    for (let d = 0; d < depth; d++) {
      if (openByDepth[d] === false) {
        visible = false;
        break;
      }
    }
    row.hidden = !visible;
    const chev = $(".dcs-tree__chevron", row);
    openByDepth[depth] = chev ? chev.classList.contains("dcs-tree__chevron--open") : true;
    openByDepth.length = depth + 1;
  });
}
function refreshTreeLeaves(tree) {
  const rows = $$(".dcs-tree__row", tree);
  rows.forEach((row, i) => {
    const depth = depthOf(row);
    let hasChild = false;
    for (let j = i + 1; j < rows.length; j++) {
      const d = depthOf(rows[j]);
      if (d <= depth) break;
      if (d === depth + 1) {
        hasChild = true;
        break;
      }
    }
    const chev = $(".dcs-tree__chevron", row);
    if (!chev) return;
    if (hasChild) {
      chev.classList.remove("dcs-tree__chevron--leaf");
      if (!chev.children.length && !chev.textContent.trim()) {
        chev.innerHTML = icon("chevron-right");
      }
    } else {
      chev.classList.add("dcs-tree__chevron--leaf");
      chev.innerHTML = "";
    }
  });
}
function initTreeChevrons(root) {
  $$(".dcs-tree", root).forEach((tree) => {
    if (tree[WIRED + "_tree"]) return;
    tree[WIRED + "_tree"] = true;
    tree.addEventListener("click", (e) => {
      const chev = e.target.closest(".dcs-tree__chevron");
      if (!chev || !tree.contains(chev) || chev.classList.contains("dcs-tree__chevron--leaf")) return;
      e.stopPropagation();
      chev.classList.toggle("dcs-tree__chevron--open");
      refreshTreeVisibility(tree);
      emit(tree, "dcs:tree-toggle", { row: chev.closest(".dcs-tree__row") });
    });
    refreshTreeLeaves(tree);
    refreshTreeVisibility(tree);
  });
}
function depthOf(row) {
  return parseInt(row.style && row.style.getPropertyValue("--depth") || "0", 10);
}
function subtreeOf(row) {
  const out = [row];
  const d = depthOf(row);
  let n = row.nextElementSibling;
  while (n && n.classList && n.classList.contains("dcs-tree__row") && depthOf(n) > d) {
    out.push(n);
    n = n.nextElementSibling;
  }
  return out;
}
function shiftSubtreeDepth(rows, delta) {
  if (!delta) return;
  rows.forEach((r) => r.style.setProperty("--depth", String(depthOf(r) + delta)));
}
function initTreeDnd(root) {
  const ZONES = ["dcs-tree__row--drop-before", "dcs-tree__row--drop-after", "dcs-tree__row--drop-into"];
  $$(".dcs-tree", root).forEach((tree) => {
    if (tree[WIRED + "_treednd"]) return;
    tree[WIRED + "_treednd"] = true;
    let draggedRow = null;
    let lastHi = null;
    const clearHi = () => {
      if (lastHi) lastHi.classList.remove(...ZONES);
      lastHi = null;
    };
    $$(".dcs-tree__row", tree).forEach((row) => row.setAttribute("draggable", "true"));
    tree.addEventListener("dragstart", (e) => {
      const row = e.target.closest(".dcs-tree__row");
      if (!row || !tree.contains(row)) return;
      draggedRow = row;
      e.dataTransfer.effectAllowed = "move";
      try {
        e.dataTransfer.setData("text/plain", row.textContent.trim());
      } catch (_) {
      }
      row.classList.add("dcs-tree__row--draggable");
    });
    tree.addEventListener("dragover", (e) => {
      if (!draggedRow) return;
      const row = e.target.closest(".dcs-tree__row");
      if (!row || row === draggedRow) return;
      const dragSubtree = subtreeOf(draggedRow);
      if (dragSubtree.indexOf(row) >= 0) {
        clearHi();
        return;
      }
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const rect = row.getBoundingClientRect();
      const y = e.clientY - rect.top, h = rect.height;
      const zone = y < h * 0.3 ? "before" : y > h * 0.7 ? "after" : "into";
      clearHi();
      row.classList.add(`dcs-tree__row--drop-${zone}`);
      lastHi = row;
    });
    tree.addEventListener("dragleave", (e) => {
      if (e.relatedTarget && tree.contains(e.relatedTarget)) return;
      clearHi();
    });
    tree.addEventListener("drop", (e) => {
      if (!draggedRow) return;
      const row = e.target.closest(".dcs-tree__row");
      if (!row || row === draggedRow) {
        clearHi();
        draggedRow = null;
        return;
      }
      e.preventDefault();
      const rect = row.getBoundingClientRect();
      const y = e.clientY - rect.top, h = rect.height;
      const zone = y < h * 0.3 ? "before" : y > h * 0.7 ? "after" : "into";
      const targetDepth = depthOf(row);
      const newRootDepth = zone === "into" ? targetDepth + 1 : targetDepth;
      const subtree = subtreeOf(draggedRow);
      const deltaDepth = newRootDepth - depthOf(draggedRow);
      const evt = new CustomEvent("dcs:tree-reorder", {
        detail: { row: draggedRow, subtree, target: row, zone, newDepth: newRootDepth },
        bubbles: true,
        cancelable: true
      });
      tree.dispatchEvent(evt);
      if (evt.defaultPrevented) {
        clearHi();
        return;
      }
      shiftSubtreeDepth(subtree, deltaDepth);
      let anchor = zone === "before" ? row : zone === "after" ? subtreeOf(row).slice(-1)[0].nextElementSibling : row.nextElementSibling;
      const parent = row.parentElement;
      subtree.forEach((r) => parent.insertBefore(r, anchor));
      clearHi();
      refreshTreeVisibility(tree);
    });
    tree.addEventListener("dragend", () => {
      if (draggedRow) draggedRow.classList.remove("dcs-tree__row--draggable");
      draggedRow = null;
      clearHi();
    });
  });
}
var DRAG_TARGET = ".dcs-panel--floating, .dcs-toolbar--floating";
var DRAG_IGNORE = "button, a, input, select, textarea, label, .dcs-check, .dcs-radio, .dcs-switch, .dcs-slider, .dcs-fader, .dcs-knob, .dcs-combo, .dcs-dockpane__tab, .dcs-dockpane__tab-close, .dcs-tab, [data-dcs-toggle], [data-dcs-dismiss], .dcs-dockpane__body, .dcs-panel__body";
function beginPanelDrag(e, target) {
  if (target.__dcsDragPid === e.pointerId) return;
  target.__dcsDragPid = e.pointerId;
  const boundsSel = target.getAttribute("data-dcs-drag-bounds");
  const bounds = (boundsSel ? $(boundsSel) : null) || target.offsetParent || document.body;
  e.preventDefault();
  const br = bounds.getBoundingClientRect();
  const tr = target.getBoundingClientRect();
  target.style.width = tr.width + "px";
  target.style.height = tr.height + "px";
  target.style.left = tr.left - br.left + "px";
  target.style.top = tr.top - br.top + "px";
  target.style.right = "auto";
  target.style.bottom = "auto";
  target.style.transform = "none";
  const ox = e.clientX - tr.left;
  const oy = e.clientY - tr.top;
  target.classList.add("dcs--dragging");
  const margin = 4;
  const pid = e.pointerId;
  try {
    target.setPointerCapture(pid);
  } catch (_) {
  }
  let dragLive = true;
  const move = (ev) => {
    if (!dragLive || ev.pointerId !== pid) return;
    const w = target.offsetWidth, h = target.offsetHeight;
    let left = ev.clientX - br.left - ox;
    let top = ev.clientY - br.top - oy;
    left = clamp(left, margin, Math.max(margin, br.width - w - margin));
    top = clamp(top, margin, Math.max(margin, br.height - h - margin));
    target.style.left = left + "px";
    target.style.top = top + "px";
  };
  const up = (ev) => {
    if (!dragLive || ev.pointerId !== pid) return;
    dragLive = false;
    target.removeEventListener("pointermove", move);
    target.removeEventListener("pointerup", up);
    target.removeEventListener("pointercancel", up);
    window.removeEventListener("pointermove", move, true);
    window.removeEventListener("pointerup", up, true);
    window.removeEventListener("pointercancel", up, true);
    try {
      target.releasePointerCapture(pid);
    } catch (_) {
    }
    target.classList.remove("dcs--dragging");
    if (target.__dcsDragPid === pid) target.__dcsDragPid = null;
  };
  target.addEventListener("pointermove", move);
  target.addEventListener("pointerup", up);
  target.addEventListener("pointercancel", up);
  window.addEventListener("pointermove", move, true);
  window.addEventListener("pointerup", up, true);
  window.addEventListener("pointercancel", up, true);
}
function initDraggable(root) {
  $$inc("[data-dcs-drag-handle]", root).forEach((handle) => {
    if (handle[WIRED]) return;
    handle[WIRED] = true;
    handle.addEventListener("pointerdown", (e) => {
      const target = handle.closest(DRAG_TARGET);
      if (!target) return;
      const ignored = e.target.closest(DRAG_IGNORE);
      if (ignored && target.contains(ignored)) return;
      beginPanelDrag(e, target);
    });
  });
  $$inc(DRAG_TARGET, root).forEach((floater) => {
    const key = WIRED + "_floatauto";
    if (floater[key]) return;
    floater[key] = true;
    floater.addEventListener("pointerdown", (e) => {
      const ignored = e.target.closest(DRAG_IGNORE);
      if (ignored && floater.contains(ignored)) return;
      beginPanelDrag(e, floater);
    });
  });
}
function dockAt(x, y) {
  const el2 = document.elementFromPoint(x, y);
  return el2 ? el2.closest(".dcs-dockpane") : null;
}
function edgeOwnerDock(edge) {
  const horizontal = edge === "left" || edge === "right";
  const wantV = !horizontal;
  const docks = $$(".dcs-dock");
  const isMatch = (d) => d.classList && d.classList.contains("dcs-dock") && d.classList.contains("dcs-dock--v") === wantV;
  const matching = docks.filter(isMatch);
  const outermost = matching.find((d) => {
    let p = d.parentElement;
    while (p) {
      if (isMatch(p)) return false;
      p = p.parentElement;
    }
    return true;
  });
  return outermost || matching[0] || docks.find((d) => !d.parentElement || !d.parentElement.closest(".dcs-dock")) || docks[0] || null;
}
function windowEdge(x, y) {
  const BAND = 32;
  if (x < BAND) return "left";
  if (x > window.innerWidth - BAND) return "right";
  if (y < BAND) return "top";
  if (y > window.innerHeight - BAND) return "bottom";
  return null;
}
function dockKind(dock) {
  if (!dock) return null;
  return dock.getAttribute("data-dcs-dock-kind") || (dock.classList.contains("dcs-dockpane--center") ? "documents" : "panels");
}
function tearoffAllowed(dock) {
  if (!dock) return false;
  return dock.getAttribute("data-dcs-dock-tearoff") !== "false";
}
function activateTabInDock(dock, tab) {
  $$(".dcs-dockpane__tab", dock).forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
  const sel = tab.getAttribute("data-dcs-target");
  if (sel) {
    const panel = $(sel);
    if (panel && panel.parentElement) {
      $$("[data-dcs-tabpanel]", panel.parentElement).forEach((p) => {
        p.hidden = p !== panel;
      });
      panel.hidden = false;
    }
    syncTabToolbars(dock, sel);
  }
}
function unsplitFromLayout(node) {
  const parent = node.parentElement;
  const prev = node.previousElementSibling;
  const next = node.nextElementSibling;
  if (prev && prev.classList && prev.classList.contains("dcs-splitter")) prev.remove();
  else if (next && next.classList && next.classList.contains("dcs-splitter")) next.remove();
  node.remove();
  if (!parent || !parent.classList || !parent.classList.contains("dcs-dock")) return;
  const live = Array.from(parent.children).filter((c) => !c.classList.contains("dcs-splitter"));
  if (live.length === 0) {
    unsplitFromLayout(parent);
    return;
  }
  live.forEach((c) => {
    c.style.flex = "1 1 0";
  });
}
function cleanupSourceDock(dock) {
  if (!dock) return;
  const remainingTabs = $$(".dcs-dockpane__tab", dock);
  if (!remainingTabs.length) {
    const floater = dock.closest(".dcs-panel--floating");
    if (floater) {
      floater.remove();
      return;
    }
    unsplitFromLayout(dock);
    return;
  }
  if (!remainingTabs.some((t) => t.getAttribute("aria-selected") === "true")) {
    activateTabInDock(dock, remainingTabs[0]);
  }
}
function moveTabTo(tab, panel, targetDock) {
  const tabs = $(".dcs-dockpane__tabs", targetDock);
  const body = $(".dcs-dockpane__body", targetDock);
  const toolbars = $(".dcs-dockpane__toolbars", targetDock);
  if (!tabs || !body) return false;
  const tgtSel = tab.getAttribute("data-dcs-target");
  if (tgtSel && toolbars) {
    try {
      const matchingToolbar = $(`.dcs-dockpane__toolbar[data-dcs-tabtoolbar="${CSS.escape(tgtSel)}"]`);
      if (matchingToolbar) toolbars.appendChild(matchingToolbar);
    } catch (_) {
      const safe = tgtSel.replace(/"/g, '\\"');
      const matchingToolbar = $(`.dcs-dockpane__toolbar[data-dcs-tabtoolbar="${safe}"]`);
      if (matchingToolbar) toolbars.appendChild(matchingToolbar);
    }
  }
  tabs.appendChild(tab);
  body.appendChild(panel);
  activateTabInDock(targetDock, tab);
  reflowDockpane(targetDock);
  return true;
}
var DOCK_EDGE_PCT = 0.22;
function edgeZone(x, y, rect) {
  const dx = x - rect.left, dy = y - rect.top;
  const w = rect.width, h = rect.height;
  const xBand = w * DOCK_EDGE_PCT;
  const yBand = h * DOCK_EDGE_PCT;
  const nearL = dx < xBand, nearR = dx > w - xBand;
  const nearT = dy < yBand, nearB = dy > h - yBand;
  if (!(nearL || nearR || nearT || nearB)) return "center";
  const dists = [
    { e: "left", d: nearL ? dx : Infinity },
    { e: "right", d: nearR ? w - dx : Infinity },
    { e: "top", d: nearT ? dy : Infinity },
    { e: "bottom", d: nearB ? h - dy : Infinity }
  ];
  dists.sort((a, b) => a.d - b.d);
  return dists[0].e;
}
function showEdgePreview(dock, edge) {
  let ov = dock.__edgePreview;
  if (!ov) {
    ov = el("div", "dcs-dockpane__edge-preview");
    const cs = getComputedStyle(dock);
    if (cs.position === "static") dock.__restorePos = true, dock.style.position = "relative";
    dock.appendChild(ov);
    dock.__edgePreview = ov;
  }
  ov.setAttribute("data-edge", edge);
}
function clearEdgePreview(dock) {
  if (!dock || !dock.__edgePreview) return;
  dock.__edgePreview.remove();
  dock.__edgePreview = null;
  if (dock.__restorePos) {
    dock.style.position = "";
    dock.__restorePos = false;
  }
}
function showCenterPreview(dock) {
  if (dock.__centerPreview) return;
  const ov = el("div", "dcs-dockpane__center-preview");
  const cs = getComputedStyle(dock);
  if (cs.position === "static") dock.__centerRestorePos = true, dock.style.position = "relative";
  dock.appendChild(ov);
  dock.__centerPreview = ov;
}
function clearCenterPreview(dock) {
  if (!dock || !dock.__centerPreview) return;
  dock.__centerPreview.remove();
  dock.__centerPreview = null;
  if (dock.__centerRestorePos) {
    dock.style.position = "";
    dock.__centerRestorePos = false;
  }
}
var DOCK_NEW_PX_H = 320;
var DOCK_NEW_PX_V = 220;
function splitDock(target, edge, newDock, opts) {
  const horizontal = edge === "left" || edge === "right";
  const desiredCls = horizontal ? "dcs-dock" : "dcs-dock dcs-dock--v";
  const splitterCls = horizontal ? "dcs-splitter" : "dcs-splitter dcs-splitter--h";
  const parent = target.parentElement;
  const parentIsDock = parent && parent.classList.contains("dcs-dock");
  const parentDir = parentIsDock && parent.classList.contains("dcs-dock--v") ? "v" : "h";
  const needDir = horizontal ? "h" : "v";
  const dim = horizontal ? "offsetWidth" : "offsetHeight";
  const isWindowEdge = !!(opts && opts.windowEdge);
  const tSize = target[dim] || 0;
  const defaultNewPx = horizontal ? DOCK_NEW_PX_H : DOCK_NEW_PX_V;
  const cap = Math.max(120, tSize * 0.4);
  const newPx = isWindowEdge ? Math.min(defaultNewPx, cap) : Math.max(20, (tSize - 1) / 2);
  const targetPx = isWindowEdge ? Math.max(120, tSize - newPx - 1) : newPx;
  if (parentIsDock && parentDir === needDir) {
    Array.from(parent.children).forEach((c) => {
      if (c === target || c.classList.contains("dcs-splitter")) return;
      const sz = c[dim];
      if (sz > 0) c.style.flex = `1 1 ${sz}px`;
    });
    target.style.flex = `1 1 ${targetPx}px`;
    newDock.style.flex = `1 1 ${newPx}px`;
    const split = el("div", splitterCls);
    if (horizontal) split.setAttribute("data-dcs-splitter", "");
    else split.setAttribute("data-dcs-splitter", "h");
    if (edge === "left" || edge === "top") {
      parent.insertBefore(newDock, target);
      parent.insertBefore(split, target);
    } else {
      target.after(split);
      split.after(newDock);
    }
  } else {
    const wrap = el("div", desiredCls);
    wrap.style.flex = target.style.flex || "1";
    target.replaceWith(wrap);
    target.style.flex = `1 1 ${targetPx}px`;
    newDock.style.flex = `1 1 ${newPx}px`;
    const split = el("div", splitterCls);
    if (horizontal) split.setAttribute("data-dcs-splitter", "");
    else split.setAttribute("data-dcs-splitter", "h");
    if (edge === "left" || edge === "top") {
      wrap.appendChild(newDock);
      wrap.appendChild(split);
      wrap.appendChild(target);
    } else {
      wrap.appendChild(target);
      wrap.appendChild(split);
      wrap.appendChild(newDock);
    }
  }
  init(newDock.parentElement);
}
function floatHost(sourceDock) {
  const explicit = document.querySelector("[data-dcs-float-host]");
  if (explicit) return explicit;
  const center = document.querySelector(".dcs-dockpane--center");
  if (center) return $(".dcs-dockpane__body", center) || center;
  let p = sourceDock && sourceDock.offsetParent;
  while (p && p.closest && p.closest(".dcs-panel--floating")) {
    const wrap = p.closest(".dcs-panel--floating");
    p = wrap.parentElement && wrap.parentElement.offsetParent;
  }
  return p || document.body;
}
function spawnFloatingPanel(tab, panel, x, y, w, h, kind, sourceDock) {
  const host = floatHost(sourceDock);
  const hostRect = host.getBoundingClientRect();
  const fp = el("div", "dcs-panel dcs-panel--floating");
  const fw = w || 320, fh = h || 220;
  const left = clamp(x - hostRect.left - 60, 8, Math.max(8, hostRect.width - fw - 8));
  const top = clamp(y - hostRect.top - 12, 8, Math.max(8, hostRect.height - fh - 8));
  fp.style.left = left + "px";
  fp.style.top = top + "px";
  fp.style.width = fw + "px";
  fp.style.height = fh + "px";
  const kindAttr = kind ? ` data-dcs-dock-kind="${kind}"` : "";
  fp.innerHTML = '<div class="dcs-dockpane"' + kindAttr + '><div class="dcs-dockpane__tabbar" data-dcs-drag-handle><div class="dcs-dockpane__tabs"></div><div class="dcs-dockpane__toolbars"></div></div><div class="dcs-dockpane__shelf" hidden></div><div class="dcs-dockpane__body"></div></div>';
  const dock = $(".dcs-dockpane", fp);
  moveTabTo(tab, panel, dock);
  host.appendChild(fp);
  init(fp);
  return fp;
}
function initDockTearoff(root) {
  const TEAR_WIRED = "__dcsTearWired";
  $$(".dcs-dockpane__tab", root).forEach((tab) => {
    if (tab[TEAR_WIRED]) return;
    tab[TEAR_WIRED] = true;
    tab.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".dcs-dockpane__tab-close")) return;
      const sourceDock = tab.closest(".dcs-dockpane");
      if (!sourceDock) return;
      if (!tearoffAllowed(sourceDock)) return;
      if (dockKind(sourceDock) === "documents") {
        const docTabs = $$(".dcs-dockpane__tab", sourceDock);
        if (docTabs.length <= 1) return;
        const tabsContainer = $(".dcs-dockpane__tabs", sourceDock);
        if (!tabsContainer) return;
        const startX2 = e.clientX, startY2 = e.clientY;
        let started2 = false;
        drag(e, (ev) => {
          if (!started2) {
            if (Math.hypot(ev.clientX - startX2, ev.clientY - startY2) < 6) return;
            started2 = true;
          }
          const overEl = document.elementFromPoint(ev.clientX, ev.clientY);
          const overTab = overEl && overEl.closest(".dcs-dockpane__tab");
          if (!overTab || overTab === tab || !tabsContainer.contains(overTab)) return;
          const r = overTab.getBoundingClientRect();
          const insertBefore = ev.clientX < r.left + r.width / 2 ? overTab : overTab.nextSibling;
          if (insertBefore !== tab && insertBefore !== tab.nextSibling) {
            tabsContainer.insertBefore(tab, insertBefore);
          }
        }, () => {
          if (started2) emit(sourceDock, "dcs:tab-reorder", { tab });
        });
        return;
      }
      const tgtSel = tab.getAttribute("data-dcs-target");
      const panel = tgtSel && $(tgtSel);
      if (!sourceDock || !panel) return;
      const startX = e.clientX, startY = e.clientY;
      let ghost = null;
      let lastHi = null;
      let started = false;
      const sourceKind = dockKind(sourceDock);
      let lastEdgeDock = null;
      function dropDecision(x, y) {
        const we = windowEdge(x, y);
        if (we) {
          const t = edgeOwnerDock(we);
          if (t) return { kind: we, target: t, windowEdge: true };
        }
        const hovered = dockAt(x, y);
        if (!hovered) return null;
        const kindOK = hovered !== sourceDock && dockKind(hovered) === sourceKind;
        if (!kindOK) return null;
        const elPt = document.elementFromPoint(x, y);
        if (elPt && elPt.closest(".dcs-dockpane__tabbar, .dcs-dockpane__tabs, .dcs-dockpane__tab, .dcs-dockpane__toolbars, .dcs-dockpane__shelf")) {
          return { kind: "center", target: hovered };
        }
        const zone = edgeZone(x, y, hovered.getBoundingClientRect());
        return { kind: zone, target: hovered };
      }
      drag(e, (ev) => {
        if (!started) {
          if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 6) return;
          started = true;
          ghost = el("div", "dcs-dockpane__tab-ghost");
          ghost.textContent = tab.textContent.trim();
          document.body.appendChild(ghost);
        }
        ghost.style.left = ev.clientX + 10 + "px";
        ghost.style.top = ev.clientY + 8 + "px";
        const intent = dropDecision(ev.clientX, ev.clientY);
        if (lastHi && (!intent || lastHi !== intent.target || intent.kind !== "center")) {
          clearCenterPreview(lastHi);
          lastHi = null;
        }
        if (lastEdgeDock && (!intent || lastEdgeDock !== intent.target || intent.kind === "center")) {
          clearEdgePreview(lastEdgeDock);
          lastEdgeDock = null;
        }
        if (!intent) return;
        if (intent.kind === "center") {
          showCenterPreview(intent.target);
          lastHi = intent.target;
        } else {
          showEdgePreview(intent.target, intent.kind);
          lastEdgeDock = intent.target;
        }
      }, (ev) => {
        if (lastHi) clearCenterPreview(lastHi);
        if (lastEdgeDock) clearEdgePreview(lastEdgeDock);
        if (ghost) ghost.remove();
        if (!started) return;
        const intent = dropDecision(ev.clientX, ev.clientY);
        if (intent && intent.kind === "center") {
          moveTabTo(tab, panel, intent.target);
          emit(intent.target, "dcs:dock", { tab, panel, from: sourceDock });
          cleanupSourceDock(sourceDock);
        } else if (intent) {
          const fresh = el("div", "dcs-dockpane");
          if (sourceKind && sourceKind !== "panels") fresh.setAttribute("data-dcs-dock-kind", sourceKind);
          fresh.innerHTML = '<div class="dcs-dockpane__tabbar"><div class="dcs-dockpane__tabs"></div><div class="dcs-dockpane__toolbars"></div></div><div class="dcs-dockpane__shelf" hidden></div><div class="dcs-dockpane__body"></div>';
          moveTabTo(tab, panel, fresh);
          splitDock(intent.target, intent.kind, fresh, { windowEdge: intent.windowEdge });
          emit(fresh, "dcs:edge-dock", { tab, panel, edge: intent.kind, target: intent.target, from: sourceDock });
          cleanupSourceDock(sourceDock);
          init(fresh);
        } else {
          const sourceFloater = sourceDock.closest(".dcs-panel--floating");
          const onlyTab = sourceFloater && $$(".dcs-dockpane__tab", sourceDock).length === 1;
          if (onlyTab) {
            const fhost = sourceFloater.offsetParent || document.body;
            const fr = fhost.getBoundingClientRect();
            sourceFloater.style.left = Math.max(8, ev.clientX - fr.left - 60) + "px";
            sourceFloater.style.top = Math.max(8, ev.clientY - fr.top - 12) + "px";
            sourceFloater.style.right = "auto";
            sourceFloater.style.bottom = "auto";
            emit(sourceFloater, "dcs:move", { x: ev.clientX, y: ev.clientY });
          } else {
            const w = sourceDock.offsetWidth ? Math.min(420, sourceDock.offsetWidth) : 320;
            const h = sourceDock.offsetHeight ? Math.min(360, sourceDock.offsetHeight) : 240;
            const fp = spawnFloatingPanel(tab, panel, ev.clientX, ev.clientY, w, h, sourceKind, sourceDock);
            emit(fp, "dcs:tearoff", { tab, panel, kind: sourceKind, from: sourceDock });
            cleanupSourceDock(sourceDock);
          }
        }
      });
    });
  });
}
var RESIZE_DIRS = ["n", "s", "w", "e", "nw", "ne", "sw", "se"];
function initResizable(root) {
  $$inc('.dcs-panel--floating, .dcs-toolbar--floating[data-dcs-resize="true"]', root).forEach((panel) => {
    if (panel[WIRED + "_resize"]) return;
    panel[WIRED + "_resize"] = true;
    if (panel.getAttribute("data-dcs-resize") === "false") return;
    if ($(":scope > .dcs-panel__resize-zones", panel)) return;
    const zones = el("div", "dcs-panel__resize-zones");
    RESIZE_DIRS.forEach((dir) => {
      const z = el("div", "dcs-panel__resize-zone dcs-panel__resize-zone--" + dir);
      z.dataset.dir = dir;
      zones.appendChild(z);
    });
    panel.appendChild(zones);
    if (!$(":scope > .dcs-panel__resize", panel)) {
      panel.appendChild(el("div", "dcs-panel__resize"));
    }
    zones.addEventListener("pointerdown", (e) => {
      const zone = e.target.closest("[data-dir]");
      if (!zone) return;
      e.preventDefault();
      e.stopPropagation();
      const dir = zone.dataset.dir;
      const host = panel.offsetParent || document.body;
      const br = host.getBoundingClientRect();
      const tr = panel.getBoundingClientRect();
      const startW = tr.width, startH = tr.height;
      const startL = tr.left - br.left, startT = tr.top - br.top;
      const startX = e.clientX, startY = e.clientY;
      panel.style.left = startL + "px";
      panel.style.top = startT + "px";
      panel.style.width = startW + "px";
      panel.style.height = startH + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      panel.style.transform = "none";
      panel.classList.add("dcs--dragging");
      const minW = 160, minH = 80;
      drag(e, (ev) => {
        const dx = ev.clientX - startX, dy = ev.clientY - startY;
        let newW = startW, newH = startH, newL = startL, newT = startT;
        if (dir.indexOf("e") >= 0) newW = Math.max(minW, startW + dx);
        if (dir.indexOf("w") >= 0) {
          newW = Math.max(minW, startW - dx);
          newL = startL + (startW - newW);
        }
        if (dir.indexOf("s") >= 0) newH = Math.max(minH, startH + dy);
        if (dir.indexOf("n") >= 0) {
          newH = Math.max(minH, startH - dy);
          newT = startT + (startH - newH);
        }
        panel.style.width = newW + "px";
        panel.style.height = newH + "px";
        panel.style.left = newL + "px";
        panel.style.top = newT + "px";
      }, () => panel.classList.remove("dcs--dragging"));
    });
  });
}
function activeToolbar(dock) {
  return $$(".dcs-dockpane__toolbar[data-dcs-tabtoolbar]", dock).find((t) => !t.hidden) || $(".dcs-dockpane__toolbar", dock);
}
function reflowDockpane(dock) {
  const tabbar = $(".dcs-dockpane__tabbar", dock);
  const tabs = $(".dcs-dockpane__tabs", tabbar);
  const slot = $(".dcs-dockpane__toolbars", tabbar);
  const shelf = $(".dcs-dockpane__shelf", dock);
  if (!tabbar || !tabs || !slot) return;
  const tb = activeToolbar(dock);
  const tabsW = tabs.scrollWidth;
  const slotMin = tb ? Math.min(160, tb.scrollWidth) : 0;
  const isFloating = !!dock.closest(".dcs-panel--floating");
  const overflowed = isFloating || tabsW + slotMin + 8 > tabbar.clientWidth;
  if (overflowed && shelf) {
    if (tb && tb.parentElement !== shelf) shelf.appendChild(tb);
    shelf.hidden = !tb;
    dock.classList.add("dcs-dockpane--shelved");
  } else {
    if (tb && tb.parentElement !== slot) slot.appendChild(tb);
    if (shelf) shelf.hidden = true;
    dock.classList.remove("dcs-dockpane--shelved");
  }
}
function initDockpane(root) {
  $$inc(".dcs-dockpane", root).forEach((dock) => {
    if (dock[WIRED]) return;
    dock[WIRED] = true;
    if (!$(".dcs-dockpane__tabbar", dock)) return;
    const slot = $(".dcs-dockpane__toolbars", dock);
    if (slot) $$(":scope > .dcs-dockpane__toolbar", slot).forEach((tb) => slot.appendChild(tb));
    const activeTab = $('.dcs-dockpane__tab[aria-selected="true"]', dock) || $(".dcs-dockpane__tab", dock);
    const activeTgt = activeTab && activeTab.getAttribute("data-dcs-target");
    if (activeTgt) syncTabToolbars(dock, activeTgt);
    const obs = new ResizeObserver(() => reflowDockpane(dock));
    obs.observe(dock);
    reflowDockpane(dock);
    requestAnimationFrame(() => reflowDockpane(dock));
    dock.addEventListener("dcs:tab", () => reflowDockpane(dock));
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
  initDraggable(root);
  initResizable(root);
  initDockpane(root);
  initDockpaneMenu(root);
  initDockTearoff(root);
  initRadioGroups(root);
  initTreeChevrons(root);
  initTreeDnd(root);
  initVecLayout(root);
  return decius;
}
var decius = {
  version: "0.6.0",
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
 *   [data-dcs-drag-handle] [data-dcs-drag-bounds="sel"]   (move a floating panel/toolbar)
 *   [data-dcs-tabtoolbar="#tabpanel-id"]   (toolbar shown when that tab is active)
 *   [data-dcs-radio="group-name"]   (button radio group — one pressed at a time)
 *   .dcs-dockpane (auto-observed: collapses tabbar toolbar slot to shelf on overflow)
 *   .dcs-subpanel__header / .dcs-foldout__header   (collapse, zero-config)
 *   .dcs-check / .dcs-radio / .dcs-switch          (toggle, zero-config)
 *   .dcs-tree__chevron   (expand/collapse rows; uses --depth on flat siblings)
 *
 * Scope note: this runtime covers per-component behavior (menus, modals,
 * popovers, tabs, toasts, collapse, the drag controls, and splitter resize).
 * A full drag-to-DOCK layout manager (rearranging panes by dragging tabs) is
 * application-level and is provided as a React reference component in the docs
 * (and natively by affineui) — it is intentionally NOT part of this script.
 */
