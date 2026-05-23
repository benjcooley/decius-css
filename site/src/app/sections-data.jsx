/* sections-data.jsx
   Lists · Trees · Tables · Badges
*/
const { useState: useStateD } = React;

function SectionLists() {
  const [sel, setSel] = useStateD(2);
  const [q, setQ] = useStateD('');
  const [searching, setSearching] = useStateD(false);
  const items = [
    { id: 0, name: 'Lambert.001',     val: '#4d9fff', icon: 'palette' },
    { id: 1, name: 'CarPaint_red',    val: '#ff6b6b', icon: 'palette' },
    { id: 2, name: 'Concrete_Rough',  val: '#7c8492', icon: 'palette' },
    { id: 3, name: 'GlassGreen_01',   val: '#4ed18a', icon: 'palette' },
    { id: 4, name: 'StudioBack.exr',  val: '4k · 32-bit', icon: 'image' },
    { id: 5, name: 'AnimWalk.fbx',    val: '48 bones', icon: 'bone' },
    { id: 6, name: 'OakBark_2k.png',  val: '2k · sRGB', icon: 'texture' },
    { id: 7, name: 'jane_rig.fbx',    val: '64 bones', icon: 'bone' },
    { id: 8, name: 'Sparks.vdb',      val: 'volume', icon: 'cube' },
    { id: 9, name: 'Marble_4k.exr',   val: '4k · linear', icon: 'image' },
    { id: 10, name: 'Brass_worn.mat', val: 'PBR', icon: 'palette' },
    { id: 11, name: 'crowd_walk.anim', val: '240f', icon: 'curve' },
  ];
  const shown = items.filter(it => it.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="dw-section" id="lists">
      <div className="dw-section__eyebrow">Data · 01</div>
      <h2>Lists</h2>
      <p className="dw-section__lead">
        Flat, selectable rows. Use when items don't nest. The 2px accent ribbon on selection is
        intentional — it survives reorder, drag, and quick visual scan. The search button filters;
        the list scrolls when it overflows.
      </p>
      <Demo frame="app">
        <div style={{ maxWidth: 360 }}>
          <Panel title="Assets" icon="folder" pad={0}
                 tools={<><Button ghost sm icon iconLeft="search" pressed={searching} onClick={() => setSearching(s => !s)} /><Button ghost sm icon iconLeft="plus" /></>}>
            {searching && (
              <div style={{ padding: 6, borderBottom: '1px solid var(--dcs-line)' }}>
                <input className="dcs-input" placeholder="Filter assets…" value={q} autoFocus onChange={e => setQ(e.target.value)} />
              </div>
            )}
            <div className="dcs-list" style={{ maxHeight: 200, overflowY: 'auto' }}>
              {shown.map(it => (
                <div key={it.id} className="dcs-list__item" aria-selected={sel === it.id} onClick={() => setSel(it.id)} style={{ position: 'relative' }}>
                  <Icon name={it.icon} />
                  <span style={{ flex: 1 }}>{it.name}</span>
                  <span className="dcs-mono" style={{ fontSize: 10, color: 'var(--dcs-text-mute)' }}>{it.val}</span>
                </div>
              ))}
              {shown.length === 0 && <div style={{ padding: 14, fontSize: 12, color: 'var(--dcs-text-mute)' }}>No matches for "{q}"</div>}
            </div>
          </Panel>
        </div>
      </Demo>
    </section>
  );
}

const OUTLINER_NODES = [{
  id: 'scn', label: 'Scene_Intro_v014', icon: 'globe', meta: '37',
  children: [
                    { id: 'env', label: 'Environment', icon: 'folder-open', meta: '4', children: [
                      { id: 'hdri', label: 'Sky_4k.hdr', icon: 'image' },
                      { id: 'fog', label: 'VolumeFog', icon: 'cube' },
                      { id: 'sun', label: 'Sun.001', icon: 'light' },
                      { id: 'ground', label: 'GroundPlane', icon: 'plane' },
                    ]},
                    { id: 'chars', label: 'Characters', icon: 'folder-open', meta: '2', children: [
                      { id: 'jane', label: 'Jane', icon: 'folder-open', children: [
                        { id: 'mesh', label: 'jane_body.geo', icon: 'mesh', meta: '64,201' },
                        { id: 'rig', label: 'jane_rig', icon: 'bone', children: [
                          { id: 'spine', label: 'spine', icon: 'bone' },
                          { id: 'lhand', label: 'L_hand', icon: 'bone', meta: 'IK' },
                          { id: 'rhand', label: 'R_hand', icon: 'bone' },
                        ]},
                        { id: 'mat', label: 'jane_skin.mat', icon: 'palette' },
                      ]},
                      { id: 'eric', label: 'Eric', icon: 'folder' },
                    ]},
    { id: 'cams', label: 'Cameras', icon: 'folder', meta: '3' },
    { id: 'fx', label: 'FX', icon: 'folder', meta: '7' },
  ],
}];

function filterTree(nodes, q) {
  const m = (n) => n.label.toLowerCase().includes(q);
  const walk = (list) => list.flatMap(n => {
    if (m(n)) return [n];
    const kids = n.children ? walk(n.children) : [];
    return kids.length ? [{ ...n, children: kids }] : [];
  });
  return walk(nodes);
}
function allTreeIds(nodes, acc = new Set()) {
  nodes.forEach(n => { acc.add(n.id); if (n.children) allTreeIds(n.children, acc); });
  return acc;
}

function SectionTrees() {
  const [expanded, setExpanded] = useStateD(new Set(['scn', 'env', 'chars', 'jane', 'rig']));
  const [sel, setSel] = useStateD('lhand');
  const [q, setQ] = useStateD('');
  const [searching, setSearching] = useStateD(false);
  const toggle = (id) => setExpanded(prev => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const query = q.trim().toLowerCase();
  const nodes = query ? filterTree(OUTLINER_NODES, query) : OUTLINER_NODES;
  const exp = query ? allTreeIds(nodes) : expanded;
  return (
    <section className="dw-section" id="trees">
      <div className="dw-section__eyebrow">Data · 02</div>
      <h2>Trees</h2>
      <p className="dw-section__lead">
        The outliner. Deep hierarchies of scenes, rigs, layers, nodes. Chevrons expand;
        icons signal kind; right-aligned meta gives counts without taking column width. Search
        filters and auto-expands; the body scrolls when it overflows.
      </p>
      <Demo frame="app">
        <div style={{ maxWidth: 380 }}>
          <Panel title="Outliner" icon="layers" pad={0}
                 tools={<><Button ghost sm icon iconLeft="search" pressed={searching} onClick={() => setSearching(s => !s)} /><Button ghost sm icon iconLeft="more-h" /></>}>
            {searching && (
              <div style={{ padding: 6, borderBottom: '1px solid var(--dcs-line)' }}>
                <input className="dcs-input" placeholder="Filter outliner…" value={q} autoFocus onChange={e => setQ(e.target.value)} />
              </div>
            )}
            <div style={{ padding: '4px 0', maxHeight: 280, overflowY: 'auto' }}>
              <Tree expanded={exp} onExpand={toggle} selected={sel} onSelect={setSel} nodes={nodes} />
              {nodes.length === 0 && <div style={{ padding: 14, fontSize: 12, color: 'var(--dcs-text-mute)' }}>No matches for "{q}"</div>}
            </div>
          </Panel>
        </div>
      </Demo>
    </section>
  );
}

function SectionTables() {
  const [sel, setSel] = useStateD(0);
  const rows = [
    { job: 'Scene_Intro_v014',  frames: '1–240',   engine: 'Cycles',    time: '04:12:08', icon: 'check-circle', ic: 'var(--dcs-ok)',       badge: <span className="dcs-badge dcs-badge--ok dcs-badge--dot">Done</span> },
    { job: 'Hero_Closeup_v003', frames: '48–96',   engine: 'Cycles',    time: '00:48:32', icon: 'play',         ic: 'var(--dcs-accent)',   badge: <span className="dcs-badge dcs-badge--accent dcs-badge--dot">62%</span> },
    { job: 'Title_Anim_v007',   frames: '1–120',   engine: 'Eevee',     time: '—',        icon: 'pause',        ic: 'var(--dcs-text-mute)', badge: <span className="dcs-badge">Queued</span> },
    { job: 'BgPlate_Lit_v002',  frames: '120–240', engine: 'Cycles',    time: '00:00:48', icon: 'alert',        ic: 'var(--dcs-warn)',     badge: <span className="dcs-badge dcs-badge--warn dcs-badge--dot">Missing tex</span> },
    { job: 'Test_Sim_009',      frames: '1–48',    engine: 'Mantaflow', time: '00:12:04', icon: 'error',        ic: 'var(--dcs-danger)',   badge: <span className="dcs-badge dcs-badge--danger dcs-badge--dot">Fault</span> },
    { job: 'Crowd_Wide_v001',   frames: '1–600',   engine: 'Cycles',    time: '11:02:40', icon: 'check-circle', ic: 'var(--dcs-ok)',       badge: <span className="dcs-badge dcs-badge--ok dcs-badge--dot">Done</span> },
    { job: 'Logo_Spin_v012',    frames: '1–96',    engine: 'Eevee',     time: '00:03:11', icon: 'play',         ic: 'var(--dcs-accent)',   badge: <span className="dcs-badge dcs-badge--accent dcs-badge--dot">8%</span> },
    { job: 'Smoke_Test_044',    frames: '1–48',    engine: 'Mantaflow', time: '—',        icon: 'pause',        ic: 'var(--dcs-text-mute)', badge: <span className="dcs-badge">Queued</span> },
  ];
  return (
    <section className="dw-section" id="tables">
      <div className="dw-section__eyebrow">Data · 03</div>
      <h2>Tables</h2>
      <p className="dw-section__lead">
        Render queues, file lists, channel banks. Sticky-headered, mono-numeric, with selectable
        rows — click a row to select it; the body scrolls under the pinned header.
      </p>
      <Demo frame="app" inset>
        <Panel title="Render queue" icon="render" pad={0}
               tools={<><Button ghost sm icon iconLeft="play" /><Button ghost sm icon iconLeft="pause" /><Button ghost sm icon iconLeft="trash" /></>}>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            <table className="dcs-table dcs-table--mono">
              <thead>
                <tr><th style={{ width: 28 }}></th><th>Job</th><th>Frames</th><th>Engine</th><th>Time</th><th>Status</th></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.job} aria-selected={sel === i} onClick={() => setSel(i)} style={{ cursor: 'default' }}>
                    <td><Icon name={r.icon} style={{ color: r.ic }} /></td>
                    <td style={{ fontFamily: 'var(--dcs-font)' }}>{r.job}</td>
                    <td>{r.frames}</td><td>{r.engine}</td><td>{r.time}</td><td>{r.badge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </Demo>
    </section>
  );
}

function SectionBadges() {
  return (
    <section className="dw-section" id="badges">
      <div className="dw-section__eyebrow">Data · 04</div>
      <h2>Badges &amp; keys</h2>
      <p className="dw-section__lead">
        Six semantic chips and a kbd glyph for shortcut hints. Composable on any background — pick
        the variant by signal, not by hue you happen to like.
      </p>
      <Demo>
        <div className="dcs-col" style={{ gap: 12 }}>
          <div className="dcs-row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <span className="dcs-badge">DEFAULT</span>
            <span className="dcs-badge dcs-badge--accent">ACCENT</span>
            <span className="dcs-badge dcs-badge--ok dcs-badge--dot">READY</span>
            <span className="dcs-badge dcs-badge--warn dcs-badge--dot">CLIPPING</span>
            <span className="dcs-badge dcs-badge--danger dcs-badge--dot">FAULT</span>
            <span className="dcs-badge dcs-badge--accent">v0.4.0</span>
          </div>
          <div className="dcs-row" style={{ gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--dcs-text-dim)' }}>Snap to grid</span>
            <span className="dcs-kbd">⇧</span><span className="dcs-kbd">G</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--dcs-text-dim)' }}>Frame all</span>
            <span className="dcs-kbd">F</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--dcs-text-dim)' }}>Render</span>
            <span className="dcs-kbd">⌃</span><span className="dcs-kbd">F12</span>
          </div>
        </div>
      </Demo>
    </section>
  );
}

Object.assign(window, { SectionLists, SectionTrees, SectionTables, SectionBadges, SectionCards });

function SectionCards() {
  const [sel, setSel] = useStateD('m2');
  const materials = [
    { id: 'm1', name: 'Lambert.001',   meta: 'PBR · 4K · sRGB', g: 'linear-gradient(135deg, #4d9fff, #1c4080)' },
    { id: 'm2', name: 'CarPaint_Red',  meta: 'PBR · 4K · clearcoat', g: 'linear-gradient(135deg, #ff7070, #8a1818)' },
    { id: 'm3', name: 'Concrete_R',    meta: 'PBR · 2K', g: 'linear-gradient(135deg, #aab0bd, #6b7180)' },
    { id: 'm4', name: 'GlassGreen_01', meta: 'PBR · 1K · transmissive', g: 'linear-gradient(135deg, #4ed18a, #1a6e44)' },
    { id: 'm5', name: 'Brushed_Steel', meta: 'PBR · 4K', g: 'repeating-linear-gradient(45deg, #cfd4dc, #cfd4dc 1px, #aab0bd 1px, #aab0bd 3px)' },
    { id: 'm6', name: 'Marble_Statue', meta: 'PBR · 4K', g: 'linear-gradient(45deg, #e7e9ee, #aab0bd)' },
  ];
  const recent = [
    { id: 'r1', name: 'jane_walk_v02.fbx', meta: '48 bones · 2.4 MB · 4 minutes ago', icon: 'bone' },
    { id: 'r2', name: 'crate_lod1.usd',    meta: '128 verts · 14 KB · today',          icon: 'cube' },
    { id: 'r3', name: 'sky_dawn_4k.hdr',   meta: 'HDR · 32-bit · yesterday',           icon: 'image' },
  ];
  return (
    <section className="dw-section" id="cards">
      <div className="dw-section__eyebrow">Data · 05</div>
      <h2>Cards</h2>
      <p className="dw-section__lead">
        A reusable container for browseable items: assets, presets, recent files, render queue
        thumbnails. Cards compose into <code>CardGrid</code> for visual browsers and
        <code>CardList</code> for vertical stacks. Hover reveals tools and an optional close X.
      </p>

      <Demo frame="app" caption="Card grid — material browser, with selection, hover tools, and close affordance">
        <CardGrid>
          {materials.map(m => (
            <Card
              key={m.id}
              selected={sel === m.id}
              onClick={() => setSel(m.id)}
              closeable
              media={<div style={{ aspectRatio: '1', background: m.g }} />}
              title={m.name}
              meta={m.meta}
              badges={<span className="dcs-badge dcs-badge--soft">PBR</span>}
              tools={<><Button sm icon iconLeft="eye" /><Button sm icon iconLeft="more-v" /></>}
            />
          ))}
        </CardGrid>
      </Demo>

      <Demo frame="app" caption="Card list — horizontal layout for vertical stacks">
        <CardList style={{ maxWidth: 520 }}>
          {recent.map(r => (
            <Card
              key={r.id}
              horizontal
              closeable
              media={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--dcs-accent)' }}><Icon name={r.icon} size="xl" /></div>}
              title={r.name}
              meta={r.meta}
              tools={<><Button sm icon iconLeft="export" /><Button sm icon iconLeft="copy" /></>}
            />
          ))}
        </CardList>
      </Demo>

      <Demo frame="app" caption="Inside a panel — close button removes the card from the layout">
        <Panel title="Active layers" icon="layers" pad="sm" style={{ maxWidth: 380 }}>
          <CardList>
            <Card title="Background_v3" meta="2,048 × 2,048 · 12 KB" closeable
                  media={<div style={{ aspectRatio: '4/1', background: 'linear-gradient(90deg, #1c4080, #4d9fff)' }} />}
                  badges={<span className="dcs-badge dcs-badge--ok dcs-badge--dot">VISIBLE</span>}
            />
            <Card title="Hero_Pose" meta="4 channels · 144 KB" closeable
                  media={<div style={{ aspectRatio: '4/1', background: 'radial-gradient(circle at 30% 50%, #ff7ab8, #6f4eea)' }} />}
                  badges={<span className="dcs-badge dcs-badge--accent">ALPHA</span>}
            />
            <Card title="FX_Sparks" meta="emitter · 1,200 particles" closeable
                  media={<div style={{ aspectRatio: '4/1', background: 'radial-gradient(ellipse at 70% 50%, #f2b14a, #14161c)' }} />}
                  badges={<span className="dcs-badge dcs-badge--warn dcs-badge--dot">SOLO</span>}
            />
          </CardList>
        </Panel>
      </Demo>
    </section>
  );
}
