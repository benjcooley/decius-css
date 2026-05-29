/* viewport.js — three.js renderer for Dender's 3D viewport.
   Boots after the importmap-driven module loads three + OrbitControls
   and dispatches `three:ready`. Stays a plain global-scope script so it
   slots in next to the other sample scripts; reads THREE / OrbitControls
   off `window`.

   The viewport models exactly what Dender's UI mentions in its overlays
   and Outliner — a Cube, a Light, a Camera — so what the panels say and
   what the canvas shows track each other. Click a row in the Outliner
   and the matching mesh gets the "selected" outline. */
(function () {
  'use strict';

  const start = () => {
    const THREE = window.THREE;
    const OrbitControls = window.OrbitControls;
    if (!THREE || !OrbitControls) return;
    const canvas = document.getElementById('vp-scene');
    const host = canvas && canvas.parentElement;
    if (!canvas || !host) return;

    // ── Scene chrome — radial gradient sky already lives in the canvas
    //    parent's CSS background, so we keep the renderer transparent
    //    and let that bleed through; tones it into the rest of the app.
    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = null;

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    camera.position.set(4.2, 3.1, 5.6);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ── Lights: warm key + cool fill, plus a soft hemisphere so the
    //    shaded sides don't go flat black.
    const hemi = new THREE.HemisphereLight(0xe6efff, 0x1a1c20, 0.55);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffe2b5, 1.65);
    key.position.set(5, 7, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 30;
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -8;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x6090b8, 0.45);
    fill.position.set(-6, 4, -3);
    scene.add(fill);

    // ── Grid floor — soft, matches the dn-vp-canvas radial wash.
    const grid = new THREE.GridHelper(20, 20, 0x3a3d45, 0x2a2d34);
    grid.position.y = 0;
    grid.material.transparent = true;
    grid.material.opacity = 0.55;
    scene.add(grid);

    // Floor shadow plane — invisible save for the cube's shadow.
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.ShadowMaterial({ opacity: 0.32 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // ── World axes — short colored gnomon at the origin.
    const axes = new THREE.AxesHelper(1.4);
    axes.material.depthTest = false;
    axes.renderOrder = 1;
    scene.add(axes);

    // ── Objects: a Cube (default Blender start), a Light (point-light
    //    bulb), and a Camera (frame gizmo). The names match what the
    //    Outliner shows so a future "select-from-tree → highlight in 3D"
    //    pass can pair them by name.
    const objects = {};

    // Cube — slightly elevated so it casts a clean shadow on the floor.
    const cubeGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x9aa1ad, roughness: 0.55, metalness: 0.05,
    });
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    cube.position.set(0, 0.8, 0);
    cube.castShadow = true;
    cube.receiveShadow = true;
    cube.name = 'Cube';
    scene.add(cube);
    objects.Cube = cube;

    // Wireframe overlay — gets toggled on by the Outliner's wire mode.
    const cubeWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(cubeGeo),
      new THREE.LineBasicMaterial({ color: 0xe8943c, transparent: true, opacity: 0.0 })
    );
    cubeWire.position.copy(cube.position);
    scene.add(cubeWire);
    cube.__wire = cubeWire;

    // Light gizmo — a small orange wireframe icosahedron where the
    // hypothetical scene-light sits, plus an actual PointLight that
    // bumps the cube slightly from camera-right.
    const lightPos = new THREE.Vector3(2.6, 2.2, 1.2);
    const lightHelper = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.18)),
      new THREE.LineBasicMaterial({ color: 0xe8943c })
    );
    lightHelper.position.copy(lightPos);
    lightHelper.name = 'Light';
    scene.add(lightHelper);
    objects.Light = lightHelper;
    const ptLight = new THREE.PointLight(0xfff1c4, 0.5, 12, 2);
    ptLight.position.copy(lightPos);
    scene.add(ptLight);

    // Camera gizmo — a CameraHelper of an unused PerspectiveCamera so
    // the scene shows a representational "scene camera" frustum.
    const sceneCam = new THREE.PerspectiveCamera(35, 1.6, 1, 6);
    sceneCam.position.set(-3.4, 2.0, -3.2);
    sceneCam.lookAt(0, 0.6, 0);
    const camHelper = new THREE.CameraHelper(sceneCam);
    camHelper.material.color.set(0xb6bcc7);
    camHelper.name = 'Camera';
    scene.add(camHelper);
    objects.Camera = camHelper;

    // ── Selection outline — a slightly larger box around whichever
    //    object the Outliner reports active. Hidden until set.
    const selBox = new THREE.BoxHelper(cube, 0xe8943c);
    selBox.material.linewidth = 2;
    selBox.visible = true;
    scene.add(selBox);
    let selectedName = 'Cube';
    const setSelected = (name) => {
      const target = objects[name];
      if (!target) return;
      selectedName = name;
      selBox.setFromObject(target);
      selBox.visible = true;
    };

    // ── Controls — orbit around the cube origin. Damping for a less
    //    twitchy feel; right-button pans, scroll dollies.
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0.6, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.85;
    controls.zoomSpeed = 0.9;
    controls.panSpeed = 0.8;
    controls.minDistance = 1.8;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI * 0.495;

    // ── Resize: ResizeObserver on the host so layout-driven width/height
    //    changes (splitter drag, window resize, panel collapse) keep the
    //    canvas pixel-perfect — no CSS-scaled blur.
    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(resize).observe(host);
    } else {
      window.addEventListener('resize', resize);
    }
    resize();

    // ── Animate.
    const clock = new THREE.Clock();
    const tick = () => {
      const dt = clock.getDelta();
      // Idle scene drift — gentle Y-axis spin so the lit faces breathe.
      cube.rotation.y += dt * 0.18;
      cubeWire.rotation.copy(cube.rotation);
      if (selectedName === 'Cube') selBox.update();
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    };
    tick();

    // ── Public hooks for app.js / future integrations.
    const VP = {
      THREE, scene, camera, renderer, controls, objects,
      select(name) { setSelected(name); },
      setWireframe(on) {
        cubeWire.material.opacity = on ? 0.95 : 0.0;
      },
      setShading(mode) {
        // 'shaded' uses the standard material, 'flat' / 'wire' drop to
        // a flatshaded copy. Kept simple — Dender's shading combo only
        // shows the toggle for now.
        cubeMat.flatShading = mode === 'flat';
        cubeMat.needsUpdate = true;
      },
    };
    window.DenderVP = VP;
    window.dispatchEvent(new Event('dender:vp-ready'));
  };

  // Wait until the importmap-loaded module has set window.THREE.
  if (window.THREE && window.OrbitControls) start();
  else window.addEventListener('three:ready', start, { once: true });
})();
