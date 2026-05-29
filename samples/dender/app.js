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

  /* ---- navigation gizmo (axis ball, top-right) --------------------------
     A live orientation gizmo wired to the three.js viewport camera. Each
     frame we rotate the six world-axis directions (±X · ±Y · ±Z) by the
     inverse camera rotation into the gizmo's 2D space, then depth-sort the
     nubs so the axes nearest the viewer paint on top (and back-facing ones
     dim). Clicking a nub snaps the viewport camera to look straight down
     that axis — Blender's navigate-by-gizmo behaviour. Until viewport.js
     publishes window.DenderVP the nubs sit in a static iso layout. */
  function buildGizmo() {
    var svg = document.getElementById("vp-gizmo");
    if (!svg) return;
    var SVGNS = "http://www.w3.org/2000/svg";
    var el = function (tag) { return document.createElementNS(SVGNS, tag); };
    var cx = 50, cy = 50, R = 32;

    /* Positive nubs are filled + labelled; negative nubs are hollow rings
       whose letter only fades in on hover. `iso` seeds a sensible Y-up
       isometric layout before the live camera takes over. */
    var AXES = [
      { key: "x", sign:  1, dir: [ 1, 0, 0], color: "#d8475a", iso: [ COS,  SIN] },
      { key: "y", sign:  1, dir: [ 0, 1, 0], color: "#6fb74a", iso: [ 0,   -1  ] },
      { key: "z", sign:  1, dir: [ 0, 0, 1], color: "#3f7ad0", iso: [-COS,  SIN] },
      { key: "x", sign: -1, dir: [-1, 0, 0], color: "#d8475a", iso: [-COS, -SIN] },
      { key: "y", sign: -1, dir: [ 0,-1, 0], color: "#6fb74a", iso: [ 0,    1  ] },
      { key: "z", sign: -1, dir: [ 0, 0,-1], color: "#3f7ad0", iso: [ COS, -SIN] }
    ];

    var VP = null;
    function snap(dir) {
      if (!VP) return;
      var cam = VP.camera, controls = VP.controls;
      var tgt = controls.target;
      var dist = cam.position.distanceTo(tgt) || 8;
      // Position the camera `dist` along the axis from the orbit target and
      // let OrbitControls.update() re-aim it (its pole clamp keeps the
      // straight up/down views from gimbal-flipping).
      cam.position.set(tgt.x + dir[0] * dist, tgt.y + dir[1] * dist, tgt.z + dir[2] * dist);
      controls.update();
    }

    svg.innerHTML = "";
    var lineLayer = el("g");
    var nubLayer = el("g");
    svg.appendChild(lineLayer);
    svg.appendChild(nubLayer);

    var nodes = AXES.map(function (a) {
      var node = { dir: a.dir, depth: 0, sx: cx + a.iso[0] * R, sy: cy + a.iso[1] * R };
      if (a.sign > 0) {
        var ln = el("line");
        ln.setAttribute("x1", cx); ln.setAttribute("y1", cy);
        ln.setAttribute("x2", node.sx); ln.setAttribute("y2", node.sy);
        ln.setAttribute("stroke", a.color);
        ln.setAttribute("stroke-width", "2.4");
        ln.setAttribute("stroke-linecap", "round");
        lineLayer.appendChild(ln);
        node.line = ln;
      }
      var g = el("g");
      g.setAttribute("class", "dn-gizmo__nub");
      var c = el("circle");
      c.setAttribute("cx", node.sx); c.setAttribute("cy", node.sy);
      if (a.sign > 0) {
        c.setAttribute("r", "9"); c.setAttribute("fill", a.color);
      } else {
        c.setAttribute("r", "8"); c.setAttribute("fill", "#22252c");
        c.setAttribute("stroke", a.color); c.setAttribute("stroke-width", "2");
      }
      g.appendChild(c);
      var t = el("text");
      t.setAttribute("x", node.sx); t.setAttribute("y", node.sy + 3.2);
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("font-size", "9");
      t.setAttribute("font-weight", "700");
      t.setAttribute("font-family", "IBM Plex Sans, sans-serif");
      t.textContent = a.key.toUpperCase();
      if (a.sign > 0) {
        t.setAttribute("fill", "#fff");
      } else {
        t.setAttribute("fill", a.color);
        t.setAttribute("class", "dn-gizmo__neglabel");
      }
      g.appendChild(t);
      g.addEventListener("click", function (e) { e.stopPropagation(); snap(a.dir); });
      nubLayer.appendChild(g);
      node.group = g; node.circle = c; node.text = t;
      return node;
    });

    /* Per-frame layout — only repaints when the camera orientation
       actually changed, so hover/click stay stable while the view is
       still and there's no needless DOM churn. */
    var tmp = null, lastKey = "";
    function layout() {
      requestAnimationFrame(layout);
      if (!VP) {
        if (!window.DenderVP) return;
        VP = window.DenderVP;
        tmp = new VP.THREE.Vector3();
      }
      var q = VP.camera.quaternion;
      var key = q.x.toFixed(4) + "," + q.y.toFixed(4) + "," + q.z.toFixed(4) + "," + q.w.toFixed(4);
      if (key === lastKey) return;
      lastKey = key;
      var inv = q.clone().invert();
      nodes.forEach(function (n) {
        tmp.set(n.dir[0], n.dir[1], n.dir[2]).applyQuaternion(inv);
        n.sx = cx + tmp.x * R;        // camera-local X → screen right
        n.sy = cy - tmp.y * R;        // camera-local Y → screen up (SVG y is down)
        n.depth = tmp.z;              // +Z is toward the viewer → paints on top
        n.circle.setAttribute("cx", n.sx.toFixed(2));
        n.circle.setAttribute("cy", n.sy.toFixed(2));
        n.text.setAttribute("x", n.sx.toFixed(2));
        n.text.setAttribute("y", (n.sy + 3.2).toFixed(2));
        n.group.style.opacity = n.depth < -0.05 ? "0.55" : "1";
        if (n.line) {
          n.line.setAttribute("x2", n.sx.toFixed(2));
          n.line.setAttribute("y2", n.sy.toFixed(2));
          n.line.setAttribute("opacity", n.depth >= 0 ? "1" : "0.4");
        }
      });
      /* Painter's algorithm: re-append nubs nearest the viewer last.
         Moving existing nodes keeps their listeners + hover state. */
      nodes.slice().sort(function (a, b) { return a.depth - b.depth; })
        .forEach(function (n) { nubLayer.appendChild(n.group); });
    }
    requestAnimationFrame(layout);
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

  /* ---- viewport ↔ outliner / inspector / add-menu bridge ----------------
     Connects the three.js scene (viewport.js → window.DenderVP) to the
     decius UI: Outliner row click → VP.select; Inspector X/Y/Z combos
     drive VP.setTransform; the Add menu's items call VP.add(type);
     selection / transform / add / remove events from VP repaint the
     Outliner leaves and the Inspector combos.

     Held loosely — if viewport.js hasn't published DenderVP yet (importmap
     module load races the rest of the boot), this waits on the
     `dender:vp-ready` event and re-runs. */
  function wireViewport() {
    if (!window.DenderVP) {
      window.addEventListener("dender:vp-ready", wireViewport, { once: true });
      return;
    }
    var VP = window.DenderVP;

    /* ICON_FOR maps registry types → an existing `di-*` icon class so
       the outliner row matches the object type at a glance. */
    var ICON_FOR = {
      'Cube': 'cube', 'UV Sphere': 'cube', 'Icosphere': 'cube',
      'Cylinder': 'cube', 'Cone': 'cube', 'Torus': 'cube', 'Plane': 'cube',
      'Point Light': 'light', 'Sun': 'light', 'Spot': 'light',
      'Camera': 'camera',
      'Empty': 'cross-target',
    };

    /* ---- Outliner ----
       Rebuild the depth-2 "Collection children" rows from VP.objects on
       every add / remove / rename. Static Scene / Collection / World rows
       in the HTML are left alone. */
    var tree = document.getElementById("outliner-tree");
    var structuralLabel = function (row) {
      var l = row && row.querySelector(".dcs-tree__label");
      return l ? l.textContent.trim() : "";
    };
    var makeRow = function (obj, depth, hasKids) {
      var row = document.createElement("div");
      row.className = "dcs-tree__row";
      row.setAttribute("style", "--depth:" + depth);
      row.setAttribute("data-vp-row", obj.id);
      row.setAttribute("draggable", "true");
      if (VP.selected && VP.selected.id === obj.id) row.setAttribute("aria-selected", "true");
      var icon = ICON_FOR[obj.type] || "cube";
      row.innerHTML =
        '<span class="dcs-tree__chevron' + (hasKids ? " dcs-tree__chevron--open" : "") + '">' +
          (hasKids ? '<i class="di di-chevron-right"></i>' : "") + '</span>' +
        '<span class="dcs-tree__icon"><i class="di di-' + icon + '"></i></span>' +
        '<span class="dcs-tree__label">' + obj.name + '</span>' +
        '<span class="dcs-tree__meta"><i class="di di-eye" data-dcs-tip="Hide"></i></span>';
      return row;
    };
    var rebuildOutliner = function () {
      if (!tree) return;
      Array.from(tree.querySelectorAll("[data-vp-row]")).forEach(function (n) { n.remove(); });
      var rows = Array.from(tree.querySelectorAll(".dcs-tree__row"));
      var collectionRow = rows.find(function (r) { return structuralLabel(r) === "Collection"; });
      var anchor = collectionRow ? collectionRow.nextElementSibling : tree.firstChild;
      var all = VP.objects;
      var hasKids = function (obj) { return all.some(function (o) { return o.parentObj === obj; }); };
      // Depth-first walk so children render directly under their parent,
      // indented one level deeper (Collection sits at depth 1, so its
      // top-level objects start at depth 2).
      var addChildren = function (parentObj, depth) {
        all.filter(function (o) { return (o.parentObj || null) === parentObj; }).forEach(function (obj) {
          tree.insertBefore(makeRow(obj, depth, hasKids(obj)), anchor);
          addChildren(obj, depth + 1);
        });
      };
      addChildren(null, 2);
    };
    if (tree) {
      tree.addEventListener("click", function (e) {
        if (e.target.closest("[data-dcs-tip='Hide']")) return;
        var row = e.target.closest("[data-vp-row]");
        if (!row) return;
        var id = row.getAttribute("data-vp-row");
        if (id) VP.select(id);
      });
      // Drag a row onto another to re-parent (drop INTO), or between rows
      // to make it a sibling; drop onto/next to Collection or Scene to
      // un-parent back to the scene root. The framework moves the DOM rows
      // + emits dcs:tree-reorder; we own the actual scene-graph change and
      // re-render the hierarchy from the resulting parent links.
      tree.addEventListener("dcs:tree-reorder", function (e) {
        var d = e.detail || {};
        var draggedId = d.row && d.row.getAttribute("data-vp-row");
        if (!draggedId) { e.preventDefault(); return; }  // structural rows aren't movable
        e.preventDefault();
        var targetId = d.target && d.target.getAttribute("data-vp-row");
        var newParentId = null;
        if (d.zone === "into") {
          newParentId = targetId || null;               // into object → child; into Collection → root
        } else if (targetId) {
          var t = VP.objects.filter(function (o) { return o.id === targetId; })[0];
          newParentId = t && t.parentObj ? t.parentObj.id : null;  // sibling: share target's parent
        }
        VP.reparent(draggedId, newParentId);
        rebuildOutliner();
      });
    }
    rebuildOutliner();

    /* ---- Inspector: object name + icon ---- */
    var nameEl = document.getElementById("dn-object-name");
    var iconEl = document.getElementById("dn-object-icon");
    var setObjectMeta = function (obj) {
      if (nameEl) nameEl.value = obj ? obj.name : "—";
      if (iconEl) {
        var icon = obj ? (ICON_FOR[obj.type] || "cube") : "cube";
        iconEl.className = "di di-" + icon;
      }
    };

    /* ---- Inspector: Location / Rotation / Scale combos ----
       Each foldout's `.dcs-vec` holds three `[data-dcs-combo]` widgets
       (X / Y / Z). We read the matching transform component off the
       selected object and write to it on `dcs:change`. Two-way binding;
       the `__suppress` flag prevents the update-→change feedback loop. */
    var props = document.querySelector("#prop-object .dcs-foldout__body .dcs-props");
    var locVec, rotVec, sclVec;
    if (props) {
      var vecs = props.querySelectorAll(".dcs-vec");
      locVec = vecs[0]; rotVec = vecs[1]; sclVec = vecs[2];
    }
    var combosOf = function (vec) {
      return vec ? Array.from(vec.querySelectorAll("[data-dcs-combo]")) : [];
    };
    var setCombo = function (combo, v) {
      if (!combo) return;
      var num = Number(v);
      combo.__suppress = true;
      // Prefer the framework's external setter (added in 0.6.0) so the
      // combo's internal closure value stays in sync; fall back to a
      // data-attribute write for older bundles.
      if (typeof combo.dcsSet === "function") combo.dcsSet(num);
      else {
        combo.setAttribute("data-value", num);
        var valEl = combo.querySelector(".dcs-combo__value");
        if (valEl) valEl.textContent = Number(num.toFixed(3)) + (combo.getAttribute("data-suffix") || "");
      }
      combo.__suppress = false;
    };
    var updateInspectorFromSelected = function () {
      var obj = VP.selected;
      setObjectMeta(obj);
      if (!obj) return;
      var loc = combosOf(locVec), rot = combosOf(rotVec), scl = combosOf(sclVec);
      ['x', 'y', 'z'].forEach(function (ax, i) {
        if (loc[i]) setCombo(loc[i], obj.root.position[ax]);
        if (rot[i]) setCombo(rot[i], obj.root.rotation[ax] * (180 / Math.PI));
        if (scl[i]) setCombo(scl[i], obj.root.scale[ax]);
      });
    };
    var bindVec = function (vec, kind) {
      if (!vec) return;
      // Combos emit 'input' with detail.value; listen on the vec
      // container so we don't have to attach per-combo.
      vec.addEventListener("input", function (e) {
        var combo = e.target.closest("[data-dcs-combo]");
        if (!combo || combo.__suppress) return;
        var arr = combosOf(vec);
        var i = arr.indexOf(combo);
        if (i < 0) return;
        var obj = VP.selected;
        if (!obj) return;
        var axis = ['x', 'y', 'z'][i];
        var val = Number(e.detail && e.detail.value);
        if (Number.isNaN(val)) return;
        if (kind === "loc") obj.root.position[axis] = val;
        else if (kind === "rot") obj.root.rotation[axis] = val * (Math.PI / 180);
        else if (kind === "scl") obj.root.scale[axis] = val;
        VP.setTransform(obj, {});  // triggers helper refresh + emits
      });
    };
    bindVec(locVec, "loc");
    bindVec(rotVec, "rot");
    bindVec(sclVec, "scl");

    /* ---- Add menu ----
       Replace the placeholder #menu-add items with primitive entries
       backed by `data-dcs-value="add:<type>"`. The framework's menu
       dispatcher fires `dcs:select` with the value on click. */
    var addMenu = document.getElementById("menu-add");
    if (addMenu) {
      addMenu.innerHTML = "";
      var section = function (label) {
        var d = document.createElement("div");
        d.className = "dcs-menu__label";
        d.textContent = label;
        addMenu.appendChild(d);
      };
      var item = function (type, iconName) {
        var d = document.createElement("div");
        d.className = "dcs-menu__item";
        d.setAttribute("data-dcs-value", "add:" + type);
        d.innerHTML =
          '<span class="dcs-menu__icon"><i class="di di-' + iconName + '"></i></span>' +
          '<span class="dcs-menu__label-text">' + type + '</span>';
        addMenu.appendChild(d);
      };
      var sep = function () {
        var d = document.createElement("div");
        d.className = "dcs-menu__sep";
        addMenu.appendChild(d);
      };
      section("Mesh");
      ['Cube', 'UV Sphere', 'Icosphere', 'Cylinder', 'Cone', 'Torus', 'Plane'].forEach(function (t) { item(t, 'cube'); });
      sep();
      section("Light");
      ['Point Light', 'Sun', 'Spot'].forEach(function (t) { item(t, 'light'); });
      sep();
      item('Camera', 'camera');
      item('Empty',  'cross-target');
      addMenu.addEventListener("dcs:select", function (e) {
        var v = e.detail && e.detail.value;
        if (!v || v.indexOf("add:") !== 0) return;
        var obj = VP.add(v.slice(4));
        if (obj) VP.select(obj.id);
      });
    }

    /* ---- Shift+A opens the Add menu anchored to the Add button ---- */
    window.addEventListener("dender:add-menu", function () {
      var btn = document.querySelector('[data-dcs-toggle="menu"][data-dcs-target="#menu-add"]');
      if (!btn || !window.decius || !window.decius.menu) return;
      window.decius.menu.open("#menu-add", btn);
    });

    /* ---- Viewport shading modes — toggle wireframe / shaded ---- */
    var shadeBtns = document.querySelectorAll(".dn-shademodes [data-dcs-radio='shade']");
    shadeBtns.forEach(function (b, i) {
      b.addEventListener("click", function () {
        // i: 0=wire, 1=solid (default), 2=texture, 3=render
        VP.scene.traverse(function (n) {
          if (n.isMesh && n.material) {
            n.material.wireframe = (i === 0);
          }
        });
      });
    });

    /* ---- Floating tool rail → transform gizmo mode ----
       Move / Rotate / Scale switch the live TransformControls gizmo;
       Transform falls back to translate. The rail buttons are a radio
       group, so we also reflect the active mode (incl. G/R/S key presses,
       which arrive via VP's 'mode' event) by toggling aria-pressed. */
    var toolRail = document.querySelector(".dn-toolrail");
    var MODE_FOR_TIP = { "Move": "translate", "Rotate": "rotate", "Scale": "scale", "Transform": "translate" };
    var TIP_FOR_MODE = { translate: "Move", rotate: "Rotate", scale: "Scale" };
    var updateToolRail = function (mode) {
      if (!toolRail) return;
      var want = TIP_FOR_MODE[mode];
      toolRail.querySelectorAll("[data-dcs-radio='tool']").forEach(function (b) {
        var tip = b.getAttribute("data-dcs-tip");
        if (MODE_FOR_TIP[tip]) b.setAttribute("aria-pressed", tip === want ? "true" : "false");
      });
    };
    if (toolRail) {
      toolRail.querySelectorAll("button").forEach(function (btn) {
        var tip = btn.getAttribute("data-dcs-tip");
        if (MODE_FOR_TIP[tip]) btn.addEventListener("click", function () { VP.setTransformMode(MODE_FOR_TIP[tip]); });
        else if (tip === "Add Cube") btn.addEventListener("click", function () { var o = VP.add("Cube"); if (o) VP.select(o.id); });
      });
    }

    /* ---- Navigation buttons (top-right cluster) ----
       Zoom dollies in (Shift = out); Move View toggles left-drag panning;
       Camera View frames the selection (or the whole scene). */
    var dolly = function (factor) {
      var cam = VP.camera, t = VP.controls.target;
      cam.position.copy(t).add(cam.position.clone().sub(t).multiplyScalar(factor));
      VP.controls.update();
    };
    var navbtns = document.querySelector(".dn-navbtns");
    if (navbtns) {
      var panOn = false;
      navbtns.querySelectorAll("button").forEach(function (btn) {
        var tip = btn.getAttribute("data-dcs-tip");
        if (tip === "Zoom") btn.addEventListener("click", function (e) { dolly(e.shiftKey ? 1.25 : 0.8); });
        else if (tip === "Move View") btn.addEventListener("click", function () {
          panOn = !panOn;
          VP.controls.mouseButtons.LEFT = panOn ? VP.THREE.MOUSE.PAN : VP.THREE.MOUSE.ROTATE;
          btn.setAttribute("aria-pressed", panOn ? "true" : "false");
        });
        else if (tip === "Camera View") btn.addEventListener("click", function () { VP.frameSelected(); });
      });
    }

    /* ---- VP → UI ---- */
    VP.on('add',       function () { rebuildOutliner(); });
    VP.on('remove',    function () { rebuildOutliner(); });
    VP.on('rename',    function () { rebuildOutliner(); });
    VP.on('reparent',  function () { rebuildOutliner(); });
    VP.on('select',    function () { rebuildOutliner(); updateInspectorFromSelected(); });
    VP.on('transform', function () { updateInspectorFromSelected(); });
    VP.on('mode',      function (mode) { updateToolRail(mode); });

    updateToolRail(VP.mode);
    updateInspectorFromSelected();
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
    wireViewport();
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
