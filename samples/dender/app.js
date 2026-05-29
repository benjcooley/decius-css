/* ============================================================================
   dender app.js — DENDER application runtime.
   Builds the procedural 3D viewport scene, the navigation gizmo, the timeline,
   and wires app-level chrome (accent switcher, playhead). Sits on top of the
   decius framework (stock `decius.init` handles generic widget behaviours).
   ========================================================================== */
(function () {
  "use strict";

  /* ---- tiny vec3 + axonometric projection (Z-up, ortho user view) ------- */
  var COS = Math.cos(Math.PI / 6), SIN = Math.sin(Math.PI / 6); /* 30° iso */
  var S = 72, CX = 500, CY = 312;

  function P(p) {                       /* [x,y,z] -> [px,py] in 1000x660 vb */
    var sx = (p[0] - p[1]) * COS;
    var sy = (p[0] + p[1]) * SIN - p[2];
    return [CX + sx * S, CY + sy * S];
  }
  function sub(a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
  function add(a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
  function mul(a, s) { return [a[0]*s, a[1]*s, a[2]*s]; }
  function cross(a, b){ return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
  function norm(a){ var l=Math.hypot(a[0],a[1],a[2])||1; return [a[0]/l,a[1]/l,a[2]/l]; }
  function pts(arr){ return arr.map(function(p){ var q=P(p); return q[0].toFixed(1)+","+q[1].toFixed(1); }).join(" "); }
  function line(a,b,attrs){ var A=P(a),B=P(b); return '<line x1="'+A[0].toFixed(1)+'" y1="'+A[1].toFixed(1)+'" x2="'+B[0].toFixed(1)+'" y2="'+B[1].toFixed(1)+'" '+attrs+'/>'; }

  function buildScene() {
    // viewport.js (three.js) owns the 3D viewport now. The SVG scene
    // builder used to render into #vp-scene; #vp-scene is a <canvas>
    // today, so we just no-op here and let the WebGL pipeline take
    // over. Kept around as a one-line stub in case any caller still
    // expects buildScene() to exist.
    return;
    var svg = document.getElementById("vp-scene");
    if (!svg) return;
    var s = [];

    /* defs: floor shadow + gizmo glow */
    s.push('<defs>',
      '<radialGradient id="cubeShadow" cx="50%" cy="50%" r="50%">',
      '<stop offset="0%" stop-color="#000" stop-opacity="0.45"/>',
      '<stop offset="70%" stop-color="#000" stop-opacity="0.18"/>',
      '<stop offset="100%" stop-color="#000" stop-opacity="0"/>',
      '</radialGradient>',
      '<linearGradient id="faceTop" x1="0" y1="0" x2="0" y2="1">',
      '<stop offset="0%" stop-color="#787d87"/><stop offset="100%" stop-color="#666a73"/></linearGradient>',
      '</defs>');

    /* ground grid */
    var N = 8, grid = [];
    for (var g = -N; g <= N; g++) {
      var w = (g === 0) ? "" : 'stroke="#3a3f4b" stroke-width="1" opacity="0.55"';
      if (g !== 0) {
        grid.push(line([-N, g, 0], [N, g, 0], w));
        grid.push(line([g, -N, 0], [g, N, 0], w));
      }
    }
    s.push('<g>', grid.join(""), '</g>');
    /* world axes through origin */
    s.push(line([-N,0,0],[N,0,0],'stroke="#a8434f" stroke-width="1.4" opacity="0.85"'));
    s.push(line([0,-N,0],[0,N,0],'stroke="#4f8a3d" stroke-width="1.4" opacity="0.85"'));

    /* floor contact shadow under cube */
    var o = P([0,0,0]);
    s.push('<ellipse cx="'+o[0]+'" cy="'+o[1]+'" rx="150" ry="74" fill="url(#cubeShadow)"/>');

    /* ---- default cube (centred at origin, ±1) ---- */
    var top = [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
    var fx  = [[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]];   /* +X face */
    var fy  = [[-1,1,-1],[1,1,-1],[1,1,1],[-1,1,1]];   /* +Y face */
    s.push('<polygon points="'+pts(fy)+'" fill="#474a52"/>');
    s.push('<polygon points="'+pts(fx)+'" fill="#565a63"/>');
    s.push('<polygon points="'+pts(top)+'" fill="url(#faceTop)"/>');
    /* active-object selection outline (accent), drawn over visible edges */
    var oc = 'fill="none" stroke="var(--dcs-accent)" stroke-width="2" stroke-linejoin="round"';
    s.push('<polygon points="'+pts(top)+'" '+oc+'/>');
    s.push('<polygon points="'+pts(fx)+'" '+oc+'/>');
    s.push('<polygon points="'+pts(fy)+'" '+oc+'/>');
    /* object origin dot */
    s.push('<circle cx="'+o[0]+'" cy="'+o[1]+'" r="3.2" fill="#f2b45f"/>');

    /* ---- move gizmo at origin ---- */
    var L = 2.0, AX = {x:[L,0,0], y:[0,L,0], z:[0,0,L]};
    var cols = {x:"#d8475a", y:"#6fb74a", z:"#3f7ad0"};
    /* translucent plane handles */
    var ph = 0.55;
    s.push('<polygon points="'+pts([[0,0,0],[ph,0,0],[ph,ph,0],[0,ph,0]])+'" fill="#3f7ad0" opacity="0.18"/>');
    s.push('<polygon points="'+pts([[0,0,0],[0,ph,0],[0,ph,ph],[0,0,ph]])+'" fill="#d8475a" opacity="0.18"/>');
    s.push('<polygon points="'+pts([[0,0,0],[ph,0,0],[ph,0,ph],[0,0,ph]])+'" fill="#6fb74a" opacity="0.18"/>');
    ["z","y","x"].forEach(function(ax){       /* z first = furthest back */
      var tip = P(AX[ax]);
      s.push(line([0,0,0], AX[ax], 'stroke="'+cols[ax]+'" stroke-width="2.6"'));
      s.push('<circle cx="'+tip[0].toFixed(1)+'" cy="'+tip[1].toFixed(1)+'" r="5.5" fill="'+cols[ax]+'" stroke="#15171b" stroke-width="1"/>');
    });

    /* ---- light object ---- */
    drawLamp(s, [3.4, -2.6, 3.0]);
    /* ---- camera object ---- */
    drawCamera(s, [1.7, 5.0, 1.5]);

    svg.innerHTML = s.join("");
  }

  function drawLamp(s, pos) {
    var c = P(pos), foot = P([pos[0], pos[1], 0]);
    var col = 'stroke="#e7c98a" stroke-width="1.4" fill="none"';
    s.push('<line x1="'+c[0].toFixed(1)+'" y1="'+c[1].toFixed(1)+'" x2="'+foot[0].toFixed(1)+'" y2="'+foot[1].toFixed(1)+'" stroke="#e7c98a" stroke-width="1" stroke-dasharray="3 3" opacity="0.6"/>');
    s.push('<circle cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)+'" r="11" '+col+' opacity="0.85"/>');
    s.push('<circle cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)+'" r="4" fill="#f6e3b0"/>');
    /* little rays */
    for (var i=0;i<8;i++){ var a=i/8*Math.PI*2, x1=c[0]+Math.cos(a)*13,y1=c[1]+Math.sin(a)*13,x2=c[0]+Math.cos(a)*17,y2=c[1]+Math.sin(a)*17;
      s.push('<line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'" stroke="#e7c98a" stroke-width="1.2" opacity="0.7"/>'); }
  }

  function drawCamera(s, C) {
    var O = [0,0,0];
    var fwd = norm(sub(O, C));
    var up = [0,0,1];
    var right = norm(cross(fwd, up));
    var up2 = norm(cross(right, fwd));
    var d = 1.25, h = 0.82;
    var ctr = add(C, mul(fwd, d));
    var c1 = add(add(ctr, mul(right,  h)), mul(up2,  h));
    var c2 = add(add(ctr, mul(right, -h)), mul(up2,  h));
    var c3 = add(add(ctr, mul(right, -h)), mul(up2, -h));
    var c4 = add(add(ctr, mul(right,  h)), mul(up2, -h));
    var col = 'stroke="#cfd3da" stroke-width="1.5" fill="none" stroke-linejoin="round"';
    s.push('<polygon points="'+pts([c1,c2,c3,c4])+'" '+col+'/>');
    s.push(line(C,c1,'stroke="#cfd3da" stroke-width="1.5"'));
    s.push(line(C,c2,'stroke="#cfd3da" stroke-width="1.5"'));
    s.push(line(C,c3,'stroke="#cfd3da" stroke-width="1.5"'));
    s.push(line(C,c4,'stroke="#cfd3da" stroke-width="1.5"'));
    /* up-triangle marker above top edge */
    var m = add(ctr, mul(up2, h * 1.55));
    s.push('<polygon points="'+pts([c1, c2, m])+'" '+col+'/>');
    /* camera origin */
    var pc = P(C);
    s.push('<circle cx="'+pc[0].toFixed(1)+'" cy="'+pc[1].toFixed(1)+'" r="2.6" fill="#cfd3da"/>');
  }

  /* ---- navigation gizmo (axis ball, top-right) -------------------------- */
  function buildGizmo() {
    var svg = document.getElementById("vp-gizmo");
    if (!svg) return;
    var cx = 50, cy = 50, R = 30;
    var dirs = {
      x: [COS, SIN], y: [-COS, SIN], z: [0, -1]
    };
    var cols = { x:"#d8475a", y:"#6fb74a", z:"#3f7ad0" };
    var nubs = [];
    ["x","y","z"].forEach(function(ax){
      var d = dirs[ax];
      nubs.push({ ax:ax, sign:1,  x:cx+d[0]*R, y:cy+d[1]*R, col:cols[ax], label:ax.toUpperCase() });
      nubs.push({ ax:ax, sign:-1, x:cx-d[0]*R, y:cy-d[1]*R, col:cols[ax], label:"" });
    });
    var s = ['<circle cx="50" cy="50" r="40" fill="#1f222a" opacity="0.0"/>'];
    /* axis lines for positive nubs */
    ["x","y","z"].forEach(function(ax){ var d=dirs[ax];
      s.push('<line x1="50" y1="50" x2="'+(cx+d[0]*R).toFixed(1)+'" y2="'+(cy+d[1]*R).toFixed(1)+'" stroke="'+cols[ax]+'" stroke-width="2.4" stroke-linecap="round"/>'); });
    /* draw nubs back-to-front by y */
    nubs.sort(function(a,b){ return a.y - b.y; });
    nubs.forEach(function(n){
      if (n.sign === 1) {
        s.push('<circle cx="'+n.x.toFixed(1)+'" cy="'+n.y.toFixed(1)+'" r="9" fill="'+n.col+'"/>');
        s.push('<text x="'+n.x.toFixed(1)+'" y="'+(n.y+3.2).toFixed(1)+'" text-anchor="middle" font-size="9" font-weight="700" fill="#fff" font-family="IBM Plex Sans, sans-serif">'+n.label+'</text>');
      } else {
        s.push('<circle cx="'+n.x.toFixed(1)+'" cy="'+n.y.toFixed(1)+'" r="8" fill="#22252c" stroke="'+n.col+'" stroke-width="2"/>');
      }
    });
    svg.innerHTML = s.join("");
  }

  /* ---- timeline --------------------------------------------------------- */
  var TL = { start: 1, end: 250, frame: 24, ppf: 4.2 };

  function buildTimeline() {
    var ruler = document.getElementById("tl-ruler");
    var body  = document.querySelector(".dn-timeline-body");
    if (!ruler || !body) return;
    var w = body.clientWidth || 800;
    TL.ppf = Math.max(3.4, w / 140);
    var pad = 60;                       /* left label gutter */
    function fx(f){ return pad + f * TL.ppf; }

    /* ruler ticks */
    var t = [];
    for (var f = 0; f <= Math.ceil((w - pad) / TL.ppf); f++) {
      var x = fx(f);
      if (x > w) break;
      if (f % 10 === 0) {
        t.push('<div class="dn-tl-tick dn-tl-tick--major" style="left:'+x+'px"><span>'+f+'</span></div>');
      } else if (f % 5 === 0) {
        t.push('<div class="dn-tl-tick" style="left:'+x+'px;opacity:.6"></div>');
      }
    }
    ruler.innerHTML = t.join("");

    /* playback-range tint on tracks */
    var existing = body.querySelector(".dn-tl-range");
    if (existing) existing.remove();
    var range = document.createElement("div");
    range.className = "dn-tl-range";
    range.style.left = fx(TL.start) + "px";
    range.style.top = "22px";
    range.style.width = ((TL.end - TL.start) * TL.ppf) + "px";
    body.insertBefore(range, body.querySelector(".dn-tl-tracks"));

    /* keyframes on the Cube track + Summary */
    var keys = [1, 24, 48, 72, 96, 130, 175, 220];
    var tracks = body.querySelectorAll(".dn-tl-track");
    if (tracks.length >= 2) {
      tracks[0].querySelectorAll(".dn-key").forEach(function(k){ k.remove(); });
      tracks[1].querySelectorAll(".dn-key").forEach(function(k){ k.remove(); });
      keys.forEach(function(f){
        var k1 = document.createElement("div"); k1.className = "dn-key"; k1.style.left = fx(f)+"px"; tracks[0].appendChild(k1);
        var k2 = document.createElement("div"); k2.className = "dn-key"; k2.style.left = fx(f)+"px"; tracks[1].appendChild(k2);
      });
    }

    placePlayhead();

    /* click/drag in body to scrub (chrome-level interaction) */
    if (!body.__scrub) {
      body.__scrub = true;
      function setFromX(clientX) {
        var r = body.getBoundingClientRect();
        var f = Math.round((clientX - r.left - pad) / TL.ppf);
        f = Math.max(TL.start, Math.min(TL.end, f));
        TL.frame = f; placePlayhead();
        var fld = document.getElementById("tl-frame"); if (fld) fld.value = f;
      }
      body.addEventListener("pointerdown", function (e) {
        body.setPointerCapture(e.pointerId); setFromX(e.clientX);
        function mv(ev){ setFromX(ev.clientX); }
        function up(){ body.removeEventListener("pointermove", mv); body.removeEventListener("pointerup", up); }
        body.addEventListener("pointermove", mv); body.addEventListener("pointerup", up);
      });
    }

    function placePlayhead() {
      var ph = document.getElementById("tl-playhead");
      var flag = document.getElementById("tl-playhead-flag");
      if (ph) ph.style.left = (pad + TL.frame * TL.ppf) + "px";
      if (flag) flag.textContent = TL.frame;
    }
    buildTimeline.placePlayhead = placePlayhead;
  }

  /* ---- theme controls: accent / density / flat-vs-skeu ----------------- */
  function wireAccent() {
    var body = document.body;
    var row = document.getElementById("accent-row");
    if (row) {
      var mark = function () {
        var cur = body.getAttribute("data-dcs-accent") || "orange";
        row.querySelectorAll("[data-accent-set]").forEach(function (d) {
          d.setAttribute("aria-pressed", d.getAttribute("data-accent-set") === cur ? "true" : "false");
        });
      };
      row.addEventListener("click", function (e) {
        var dot = e.target.closest("[data-accent-set]");
        if (!dot) return;
        body.setAttribute("data-dcs-accent", dot.getAttribute("data-accent-set"));
        mark();
      });
      mark();
    }
    /* density */
    var drow = document.getElementById("density-row");
    if (drow) {
      drow.addEventListener("click", function (e) {
        var b = e.target.closest("[data-density-set]"); if (!b) return;
        drow.querySelectorAll("[data-density-set]").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        body.setAttribute("data-dcs-density", b.getAttribute("data-density-set"));
        window.dispatchEvent(new Event("dn:resize"));
      });
    }
    /* flat / 3D (skeuomorphic) — button group sets data-dcs-style on body */
    var srow = document.getElementById("style-row");
    if (srow) {
      srow.addEventListener("click", function (e) {
        var b = e.target.closest("[data-style-set]"); if (!b) return;
        srow.querySelectorAll("[data-style-set]").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        var s = b.getAttribute("data-style-set");
        if (s === "flat") body.removeAttribute("data-dcs-style");
        else body.setAttribute("data-dcs-style", s);
      });
    }
  }

  /* ---- play button glyph toggle ---------------------------------------- */
  function wirePlay() {
    var btn = document.getElementById("tl-play");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var playing = btn.classList.toggle("is-playing");
      var i = btn.querySelector("i.di");
      if (i) i.className = "di di-" + (playing ? "pause" : "play");
    });
  }

  /* ---- outliner selection → inspector ----------------------------------
     Selecting a node in the outliner updates the Object tab of the
     inspector: its icon (from the node's tree icon) and its name field
     (from the node's label). Switches the Properties pane to the
     Object tab if it isn't already showing. A real DCC tool would
     route richer per-object property data here; for the demo we just
     mirror the headline. */
  function wireOutlinerSelection() {
    var tree = document.getElementById("outliner-tree");
    if (!tree) return;
    var nameEl = document.getElementById("dn-object-name");
    var iconEl = document.getElementById("dn-object-icon");
    tree.addEventListener("dcs:select", function (e) {
      var selected = e.detail && e.detail.selected && e.detail.selected[0];
      if (!selected) return;
      var labelEl = selected.querySelector(".dcs-tree__label");
      var srcIcon = selected.querySelector(".dcs-tree__icon .di");
      if (nameEl && labelEl) nameEl.value = labelEl.textContent.trim();
      if (iconEl && srcIcon) {
        // Copy the icon class (di di-<name>) so the inspector matches.
        var cls = srcIcon.className.split(/\s+/).find(function (c) { return c.indexOf("di-") === 0; });
        if (cls) {
          iconEl.className = "di " + cls;
          iconEl.id = "dn-object-icon";
        }
      }
      // Make sure the Object tab is showing.
      var objTab = document.querySelector(
        '#prop-tabs .dcs-tab[data-dcs-target="#prop-object"]'
      );
      if (objTab && objTab.getAttribute("aria-selected") !== "true") objTab.click();
      // Tell the three.js viewport which mesh to outline. Tree row
      // labels match three.js object names ("Cube", "Light", "Camera").
      if (window.DenderVP && labelEl) {
        var name = labelEl.textContent.trim();
        window.DenderVP.select(name);
      }
    });
  }

  /* ---- timeline frame editor cross-validation ---------------------------
     Start ≤ Frame ≤ End, always. When the user nudges one of the three
     value editors past a sibling, force the sibling to follow so the
     timeline can't enter an invalid state (start > end, current frame
     outside the playback range). */
  function wireFrameValidation() {
    var start = document.getElementById("tl-start");
    var end   = document.getElementById("tl-end");
    var frame = document.getElementById("tl-frame");
    if (!start || !end || !frame) return;

    function get(c) { return parseFloat(c.getAttribute("data-value")); }
    function setDisplay(c, v) {
      c.setAttribute("data-value", v);
      var disp = c.querySelector(".dcs-combo__value");
      if (disp) disp.textContent = v.toFixed(0);
    }
    function reconcile(changed) {
      var s = get(start), e = get(end), f = get(frame);
      if (s > e) {
        if (changed === start) setDisplay(end,   s);
        else                   setDisplay(start, e);
      }
      s = get(start); e = get(end);
      if (f < s) setDisplay(frame, s);
      else if (f > e) setDisplay(frame, e);
    }
    start.addEventListener("input", function () { reconcile(start); });
    end  .addEventListener("input", function () { reconcile(end); });
    frame.addEventListener("input", function () { reconcile(frame); });
  }

  /* ---- boot ------------------------------------------------------------- */
  function boot() {
    if (window.decius && window.decius.init) window.decius.init(document);
    buildScene();
    buildGizmo();
    buildTimeline();
    wireAccent();
    wirePlay();
    wireFrameValidation();
    wireOutlinerSelection();
    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt); rt = setTimeout(buildTimeline, 120);
    });
    window.addEventListener("dn:resize", function () {
      clearTimeout(rt); rt = setTimeout(buildTimeline, 60);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
