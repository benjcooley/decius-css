/* viewport.js — three.js scene + Blender-like editing for Dender.

   This module exposes `window.DenderVP` once the three.js modules from
   the importmap are loaded. It owns:

     - The WebGL canvas, scene graph, lighting, ground / grid / axes.
     - A dynamic object REGISTRY: each editable thing (Cube, Light,
       Camera, etc.) is a record `{ id, name, type, root, mesh?,
       lightObj?, helper? }`. Objects can be added, renamed, removed,
       selected, transformed via the API below.
     - A primitive LIBRARY: Cube · UV Sphere · Cylinder · Cone · Torus ·
       Plane · Point Light · Sun · Spot · Camera · Empty. Each produces
       a fully-wired record that respects shadows, the selection
       outline, raycaster picking, and the gizmo.
     - TransformControls gizmos for translate / rotate / scale modes.
       Hot keys G / R / S switch the gizmo while a selection is active.
     - World-AABB selection visualization via Box3 + Box3Helper. The
       box updates every frame so it tracks the object while a gizmo is
       being dragged or while combos in the Inspector update transforms.
     - Click-to-pick: a Raycaster against everything in the registry
       (meshes AND helper gizmos) routes Pointer events on the canvas
       into VP.select(obj). Shift+click extends the selection (the
       active object stays the gizmo target).
     - An event bus (`VP.on('add' | 'remove' | 'select' | 'transform' |
       'rename', fn)`) so app.js can mirror state into the Outliner
       tree and Inspector combo widgets without coupling.
     - Frame-selected (F), delete (X / Delete), and duplicate (Shift+D)
       keyboard shortcuts.

   Keep this file self-contained: it reads THREE / OrbitControls /
   TransformControls off `window` and ignores the rest of Dender's
   app.js. app.js subscribes via `VP.on(...)` to bridge UI ↔ scene. */
(function () {
  'use strict';

  const boot = () => {
    const THREE = window.THREE;
    const OrbitControls = window.OrbitControls;
    const TransformControls = window.TransformControls;
    if (!THREE || !OrbitControls || !TransformControls) return;
    const canvas = document.getElementById('vp-scene');
    const host = canvas && canvas.parentElement;
    if (!canvas || !host) return;

    /* ──────────────────────────────────────────────────────────
       1 · Renderer / scene / camera / lights / ground chrome
       ──────────────────────────────────────────────────────── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    camera.position.set(5.2, 3.4, 6.4);
    camera.lookAt(0, 0.6, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Lights — hemisphere wash + warm key with shadows + cool fill.
    const hemi = new THREE.HemisphereLight(0xe6efff, 0x1a1c20, 0.55);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffe2b5, 1.55);
    key.position.set(5, 7, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 30;
    key.shadow.camera.left = -10;
    key.shadow.camera.right = 10;
    key.shadow.camera.top = 10;
    key.shadow.camera.bottom = -10;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x6090b8, 0.45);
    fill.position.set(-6, 4, -3);
    scene.add(fill);

    // Grid floor + invisible shadow-catching plane.
    const grid = new THREE.GridHelper(20, 20, 0x40444c, 0x2a2d34);
    grid.material.transparent = true;
    grid.material.opacity = 0.55;
    scene.add(grid);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.ShadowMaterial({ opacity: 0.32 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // World axes — a small gnomon of R / G / B arrows at the origin. Each
    // arrow is a cylinder shaft capped with a cone head (a plain line per
    // axis reads as unfinished). Drawn unlit with depthTest off + a high
    // renderOrder so the gnomon floats over the scene like Blender's
    // origin gizmo regardless of what's in front of it.
    const AXIS_COLORS = { x: 0xd8475a, y: 0x6fb74a, z: 0x3f7ad0 };
    const makeAxisArrow = (dir, color) => {
      const grp = new THREE.Group();
      const shaftLen = 1.06, headLen = 0.34, shaftR = 0.022, headR = 0.085;
      const mat = new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false, toneMapped: false });
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(shaftR, shaftR, shaftLen, 14), mat);
      shaft.position.y = shaftLen / 2;
      const head = new THREE.Mesh(new THREE.ConeGeometry(headR, headLen, 18), mat);
      head.position.y = shaftLen + headLen / 2;
      shaft.renderOrder = head.renderOrder = 3;
      grp.add(shaft, head);
      // Cylinder/cone are built along +Y; rotate the whole arrow so +Y → dir.
      grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      return grp;
    };
    const axes = new THREE.Group();
    axes.add(
      makeAxisArrow(new THREE.Vector3(1, 0, 0), AXIS_COLORS.x),
      makeAxisArrow(new THREE.Vector3(0, 1, 0), AXIS_COLORS.y),
      makeAxisArrow(new THREE.Vector3(0, 0, 1), AXIS_COLORS.z)
    );
    scene.add(axes);

    /* ──────────────────────────────────────────────────────────
       2 · Object registry + event bus
       ──────────────────────────────────────────────────────── */
    /** @type {Array<{id:string,name:string,type:string,root:THREE.Object3D,mesh?:THREE.Mesh,helper?:THREE.Object3D,lightObj?:THREE.Light}>} */
    const objects = [];
    let selected = null;          // active object record
    const multiSel = new Set();   // additional records in the selection

    const listeners = {};
    const on = (event, fn) => {
      (listeners[event] || (listeners[event] = [])).push(fn);
      return () => {
        const arr = listeners[event] || [];
        const i = arr.indexOf(fn);
        if (i >= 0) arr.splice(i, 1);
      };
    };
    const emit = (event, data) => (listeners[event] || []).forEach((fn) => { try { fn(data); } catch (_) {} });

    const newId = (() => { let n = 0; return () => `obj_${++n}`; })();
    const uniqueName = (base) => {
      let name = base, n = 1;
      while (objects.some((o) => o.name === name)) name = `${base}.${String(++n).padStart(3, '0')}`;
      return name;
    };

    /* ──────────────────────────────────────────────────────────
       3 · Material + helper factories
       ──────────────────────────────────────────────────────── */
    const baseMat = () => new THREE.MeshStandardMaterial({
      color: 0x9aa1ad, roughness: 0.55, metalness: 0.05,
    });
    const lightWireMat = () => new THREE.LineBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0.95 });
    const camWireMat   = () => new THREE.LineBasicMaterial({ color: 0xb6bcc7, transparent: true, opacity: 0.95 });
    const emptyMat     = () => new THREE.LineBasicMaterial({ color: 0xa0a4ad, transparent: true, opacity: 0.85 });

    // Tiny helper to wire a Mesh into the registry sensibly.
    const wireMesh = (mesh) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    /* ──────────────────────────────────────────────────────────
       4 · Primitive library
       Each builder returns an `{root, mesh?, helper?, lightObj?}`
       payload that VP.add() spreads into a registry record. The
       `root` is the Object3D that TransformControls attaches to and
       that the AABB is computed from. Anything visually relevant
       lives under `root` so the gizmo moves the whole thing.
       ──────────────────────────────────────────────────────── */
    const primitives = {
      Cube() {
        const g = new THREE.BoxGeometry(1.6, 1.6, 1.6);
        const m = wireMesh(new THREE.Mesh(g, baseMat()));
        m.position.y = 0.8;
        return { root: m, mesh: m };
      },
      'UV Sphere'() {
        const g = new THREE.SphereGeometry(0.9, 32, 24);
        const m = wireMesh(new THREE.Mesh(g, baseMat()));
        m.position.y = 0.9;
        return { root: m, mesh: m };
      },
      Cylinder() {
        const g = new THREE.CylinderGeometry(0.7, 0.7, 1.6, 32);
        const m = wireMesh(new THREE.Mesh(g, baseMat()));
        m.position.y = 0.8;
        return { root: m, mesh: m };
      },
      Cone() {
        const g = new THREE.ConeGeometry(0.85, 1.6, 32);
        const m = wireMesh(new THREE.Mesh(g, baseMat()));
        m.position.y = 0.8;
        return { root: m, mesh: m };
      },
      Torus() {
        const g = new THREE.TorusGeometry(0.8, 0.25, 16, 48);
        const m = wireMesh(new THREE.Mesh(g, baseMat()));
        m.position.y = 0.9;
        m.rotation.x = Math.PI / 2;
        return { root: m, mesh: m };
      },
      Plane() {
        const g = new THREE.PlaneGeometry(2, 2);
        const m = wireMesh(new THREE.Mesh(g, baseMat()));
        m.rotation.x = -Math.PI / 2;
        m.position.y = 0.001;
        return { root: m, mesh: m };
      },
      Icosphere() {
        const g = new THREE.IcosahedronGeometry(0.9, 1);
        const m = wireMesh(new THREE.Mesh(g, baseMat()));
        m.position.y = 0.9;
        return { root: m, mesh: m };
      },
      'Point Light'() {
        const group = new THREE.Group();
        const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.18)), lightWireMat());
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(0.10, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0xfff1c4 })
        );
        const lightObj = new THREE.PointLight(0xfff1c4, 0.6, 14, 2);
        group.add(wire, halo, lightObj);
        group.position.set(2.6, 2.4, 1.2);
        return { root: group, helper: wire, lightObj };
      },
      Sun() {
        const group = new THREE.Group();
        // 8 short radial spokes around a small disk.
        const spokes = new THREE.Group();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const points = [
            new THREE.Vector3(Math.cos(a) * 0.18, Math.sin(a) * 0.18, 0),
            new THREE.Vector3(Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0),
          ];
          spokes.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lightWireMat()));
        }
        const disk = new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(
            Array.from({ length: 32 }, (_, i) => {
              const a = (i / 32) * Math.PI * 2;
              return new THREE.Vector3(Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0);
            })
          ),
          lightWireMat()
        );
        spokes.add(disk);
        const lightObj = new THREE.DirectionalLight(0xffe2b5, 0.7);
        lightObj.position.set(0, 0, 0);
        group.add(spokes, lightObj);
        group.position.set(3.0, 4.0, 2.5);
        return { root: group, helper: spokes, lightObj };
      },
      Spot() {
        const group = new THREE.Group();
        const lightObj = new THREE.SpotLight(0xfff0c0, 1.2, 10, Math.PI / 6, 0.4, 1.5);
        lightObj.target.position.set(0, -1, 0);
        group.add(lightObj, lightObj.target);
        const helper = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.ConeGeometry(0.5, 1.2, 16, 1, true)),
          lightWireMat()
        );
        helper.position.y = -0.6;
        group.add(helper);
        group.position.set(-2.4, 3.0, 1.8);
        return { root: group, helper, lightObj };
      },
      Camera() {
        const group = new THREE.Group();
        // Wireframe camera body — a small box + a wireframe frustum.
        const body = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(0.5, 0.36, 0.7)),
          camWireMat()
        );
        // Frustum: square front + square back joined by 4 lines.
        const frustumPts = (() => {
          const near = 0.0, far = 1.4;
          const w0 = 0.22, h0 = 0.16;
          const w1 = 0.62, h1 = 0.42;
          const front = [
            [-w0, -h0, -near], [ w0, -h0, -near],
            [ w0,  h0, -near], [-w0,  h0, -near],
            [-w0, -h0, -near],
          ];
          const back = [
            [-w1, -h1, -far], [ w1, -h1, -far],
            [ w1,  h1, -far], [-w1,  h1, -far],
            [-w1, -h1, -far],
          ];
          const arr = [];
          for (let i = 0; i < 4; i++) {
            arr.push(new THREE.Vector3(...front[i]), new THREE.Vector3(...front[i+1]));
            arr.push(new THREE.Vector3(...back[i]),  new THREE.Vector3(...back[i+1]));
            arr.push(new THREE.Vector3(...front[i]), new THREE.Vector3(...back[i]));
          }
          return arr;
        })();
        const frustum = new THREE.LineSegments(
          new THREE.BufferGeometry().setFromPoints(frustumPts),
          camWireMat()
        );
        body.position.z = 0.35;
        group.add(body, frustum);
        group.position.set(-3.4, 2.0, -3.2);
        group.lookAt(0, 0.6, 0);
        return { root: group, helper: frustum };
      },
      Empty() {
        // Three orthogonal lines through the origin — a Blender-style
        // "plain axes" empty.
        const len = 0.5;
        const pts = [
          new THREE.Vector3(-len, 0, 0), new THREE.Vector3(len, 0, 0),
          new THREE.Vector3(0, -len, 0), new THREE.Vector3(0, len, 0),
          new THREE.Vector3(0, 0, -len), new THREE.Vector3(0, 0, len),
        ];
        const group = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), emptyMat());
        group.position.set(0, 1, 0);
        return { root: group, helper: group };
      },
    };
    const PRIMITIVE_TYPES = Object.keys(primitives);

    /* ──────────────────────────────────────────────────────────
       5 · Selection bbox + TransformControls + raycaster
       ──────────────────────────────────────────────────────── */
    const box3 = new THREE.Box3();
    const selBoxHelper = new THREE.Box3Helper(box3, 0xe8943c);
    selBoxHelper.material.depthTest = false;
    selBoxHelper.renderOrder = 2;
    selBoxHelper.visible = false;
    scene.add(selBoxHelper);

    // OrbitControls — disabled while a gizmo drag is active.
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0.6, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.85;
    controls.zoomSpeed = 0.9;
    controls.panSpeed = 0.8;
    controls.minDistance = 1.8;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI * 0.495;
    // Bind orbit to LEFT-button drag (Blender uses MMB; we use LMB since
    // Raycaster handles object picking on left-click only when nothing
    // gizmo-y was hit).
    controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };

    const tc = new TransformControls(camera, renderer.domElement);
    tc.setSize(0.9);
    scene.add(tc);
    tc.addEventListener('dragging-changed', (e) => { controls.enabled = !e.value; });
    tc.addEventListener('objectChange', () => {
      if (selected) { updateSelectionBox(); emit('transform', selected); }
    });

    const updateSelectionBox = () => {
      if (!selected) { selBoxHelper.visible = false; return; }
      box3.setFromObject(selected.root);
      if (box3.isEmpty()) { selBoxHelper.visible = false; return; }
      // Box3Helper holds a reference to box3 and reads its min/max each
      // frame internally, but its geometry only refreshes when we tell
      // it to (the lines aren't regenerated on every render). updateMatrixWorld
      // forces the helper to recompute its line geometry from the new box.
      selBoxHelper.box = box3;
      selBoxHelper.updateMatrixWorld(true);
      selBoxHelper.visible = true;
    };

    // Raycaster click selection — runs only on pointerdown when the
    // gizmo isn't dragging. We intersect against every registry root.
    const raycaster = new THREE.Raycaster();
    const pickPoint = new THREE.Vector2();
    let downAt = null;       // { x, y, time } — to discriminate click vs orbit drag
    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (tc.dragging) return;
      downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    });
    canvas.addEventListener('pointerup', (e) => {
      if (e.button !== 0 || !downAt) return;
      const dx = e.clientX - downAt.x, dy = e.clientY - downAt.y;
      const dt = performance.now() - downAt.t;
      downAt = null;
      // Ignore clicks that were actually an orbit drag.
      if (Math.hypot(dx, dy) > 4 || dt > 600) return;
      // Convert client to NDC.
      const rect = canvas.getBoundingClientRect();
      pickPoint.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pickPoint.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pickPoint, camera);
      // Pick against every root subtree. We include the whole root so
      // a hit on a helper line still counts as a hit on the object.
      const roots = objects.map((o) => o.root);
      const hits = raycaster.intersectObjects(roots, true);
      if (!hits.length) {
        if (!e.shiftKey) VP.deselect();
        return;
      }
      // Walk up from the hit until we find a registry root.
      let node = hits[0].object;
      while (node && !objects.some((o) => o.root === node)) node = node.parent;
      const obj = objects.find((o) => o.root === node);
      if (!obj) return;
      if (e.shiftKey) {
        if (multiSel.has(obj) || selected === obj) { multiSel.delete(obj); }
        else { multiSel.add(obj); }
        // Active stays the same unless nothing else is set.
        if (!selected) VP.select(obj.id);
        else emit('select', selected);
      } else {
        multiSel.clear();
        VP.select(obj.id);
      }
    });

    /* ──────────────────────────────────────────────────────────
       6 · Public API
       ──────────────────────────────────────────────────────── */
    const VP = {
      THREE, scene, camera, renderer, controls, tc,
      on,
      PRIMITIVE_TYPES,
      get objects() { return objects.slice(); },
      get selected() { return selected; },
      get selection() { return selected ? [selected, ...multiSel] : []; },

      add(type, opts = {}) {
        const builder = primitives[type];
        if (!builder) throw new Error('Unknown primitive: ' + type);
        const built = builder();
        const obj = {
          id: newId(),
          name: uniqueName(opts.name || type),
          type,
          root: built.root,
          mesh: built.mesh || null,
          helper: built.helper || null,
          lightObj: built.lightObj || null,
        };
        // Apply optional initial transform.
        if (opts.position) obj.root.position.fromArray(opts.position);
        if (opts.rotation) obj.root.rotation.fromArray(opts.rotation);
        if (opts.scale)    obj.root.scale.fromArray(opts.scale);
        objects.push(obj);
        scene.add(obj.root);
        emit('add', obj);
        return obj;
      },

      remove(idOrObj) {
        const obj = this._resolve(idOrObj);
        if (!obj) return;
        if (selected === obj) this.deselect();
        multiSel.delete(obj);
        scene.remove(obj.root);
        // Free GPU resources.
        obj.root.traverse((n) => {
          if (n.geometry) n.geometry.dispose && n.geometry.dispose();
          if (n.material) {
            const mats = Array.isArray(n.material) ? n.material : [n.material];
            mats.forEach((m) => m.dispose && m.dispose());
          }
        });
        objects.splice(objects.indexOf(obj), 1);
        emit('remove', obj);
      },

      duplicate(idOrObj) {
        const src = this._resolve(idOrObj);
        if (!src) return null;
        const dup = this.add(src.type, {
          name: src.name,
          position: src.root.position.toArray(),
          rotation: src.root.rotation.toArray().slice(0, 3),
          scale:    src.root.scale.toArray(),
        });
        // Offset slightly so the duplicate isn't z-fighting.
        dup.root.position.x += 0.5;
        return dup;
      },

      rename(idOrObj, name) {
        const obj = this._resolve(idOrObj);
        if (!obj) return;
        const next = uniqueName(name);
        obj.name = next;
        emit('rename', obj);
      },

      select(idOrObj) {
        const obj = this._resolve(idOrObj);
        if (!obj) return;
        selected = obj;
        tc.attach(obj.root);
        updateSelectionBox();
        emit('select', obj);
      },

      deselect() {
        selected = null;
        multiSel.clear();
        tc.detach();
        selBoxHelper.visible = false;
        emit('select', null);
      },

      setTransformMode(mode) {
        if (!['translate', 'rotate', 'scale'].includes(mode)) return;
        tc.setMode(mode);
      },

      setTransform(idOrObj, t) {
        const obj = this._resolve(idOrObj);
        if (!obj) return;
        if (t.position) obj.root.position.set(t.position.x ?? obj.root.position.x, t.position.y ?? obj.root.position.y, t.position.z ?? obj.root.position.z);
        if (t.rotation) obj.root.rotation.set(t.rotation.x ?? obj.root.rotation.x, t.rotation.y ?? obj.root.rotation.y, t.rotation.z ?? obj.root.rotation.z);
        if (t.scale)    obj.root.scale.set(t.scale.x ?? obj.root.scale.x, t.scale.y ?? obj.root.scale.y, t.scale.z ?? obj.root.scale.z);
        updateSelectionBox();
        emit('transform', obj);
      },

      frameSelected() {
        const target = selected ? selected.root : null;
        const box = new THREE.Box3();
        if (target) box.setFromObject(target);
        else        objects.forEach((o) => box.expandByObject(o.root));
        if (box.isEmpty()) return;
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3()).length();
        const dist = Math.max(2, size * 1.4);
        // Move along the current view direction.
        const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
        camera.position.copy(center).addScaledVector(dir, dist);
        controls.target.copy(center);
        controls.update();
      },

      _resolve(idOrObj) {
        if (!idOrObj) return null;
        if (typeof idOrObj === 'string') return objects.find((o) => o.id === idOrObj || o.name === idOrObj) || null;
        return idOrObj;
      },
    };

    /* ──────────────────────────────────────────────────────────
       7 · Keyboard shortcuts (Blender-ish)
         G / R / S — switch gizmo mode while a selection exists
         X / Delete — delete the active object
         Shift+D — duplicate the active object (and select the dup)
         F — frame selected
         Shift+A — open the Add menu (the framework menu, anchored to
                   the viewport tabbar's Add button if present)
       ──────────────────────────────────────────────────────── */
    window.addEventListener('keydown', (e) => {
      // Ignore when typing in any input / contenteditable.
      const t = e.target;
      if (t && (t.matches && t.matches('input,textarea,select,[contenteditable=""],[contenteditable="true"]'))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'g') { VP.setTransformMode('translate'); return; }
      if (k === 'r') { VP.setTransformMode('rotate');    return; }
      if (k === 's' && !e.shiftKey) { VP.setTransformMode('scale'); return; }
      if (k === 'x' || k === 'delete') { if (selected) VP.remove(selected); return; }
      if (k === 'd' && e.shiftKey) { const d = VP.duplicate(selected); if (d) VP.select(d.id); return; }
      if (k === 'f') { VP.frameSelected(); return; }
      if (k === 'a' && e.shiftKey) {
        // Dispatch a custom event the app can wire to its add menu.
        window.dispatchEvent(new CustomEvent('dender:add-menu'));
      }
    });

    /* ──────────────────────────────────────────────────────────
       8 · Resize + render loop
       ──────────────────────────────────────────────────────── */
    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(host);
    else window.addEventListener('resize', resize);
    resize();

    const tick = () => {
      controls.update();
      updateSelectionBox();
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    };
    tick();

    /* ──────────────────────────────────────────────────────────
       9 · Default scene + publish
       ──────────────────────────────────────────────────────── */
    const initialCube = VP.add('Cube', { name: 'Cube' });
    VP.add('Point Light', { name: 'Light', position: [2.6, 2.4, 1.2] });
    VP.add('Camera', { name: 'Camera', position: [-3.4, 2.0, -3.2] });
    VP.select(initialCube.id);

    window.DenderVP = VP;
    window.dispatchEvent(new Event('dender:vp-ready'));
  };

  if (window.THREE && window.OrbitControls && window.TransformControls) boot();
  else window.addEventListener('three:ready', boot, { once: true });
})();
