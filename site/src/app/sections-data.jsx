/* sections-data.jsx
   Lists · Trees · Tables · Badges
*/
const { useState: useStateD } = React;

const LIST_ITEMS = [
  { id: 0, label: 'Lambert.001',     meta: '#4d9fff', icon: 'palette' },
  { id: 1, label: 'CarPaint_red',    meta: '#ff6b6b', icon: 'palette' },
  { id: 2, label: 'Concrete_Rough',  meta: '#7c8492', icon: 'palette' },
  { id: 3, label: 'GlassGreen_01',   meta: '#4ed18a', icon: 'palette' },
  { id: 4, label: 'StudioBack.exr',  meta: '4k · 32-bit', icon: 'image' },
  { id: 5, label: 'AnimWalk.fbx',    meta: '48 bones', icon: 'bone' },
  { id: 6, label: 'OakBark_2k.png',  meta: '2k · sRGB', icon: 'texture' },
  { id: 7, label: 'jane_rig.fbx',    meta: '64 bones', icon: 'bone' },
  { id: 8, label: 'Sparks.vdb',      meta: 'volume', icon: 'cube' },
  { id: 9, label: 'Marble_4k.exr',   meta: '4k · linear', icon: 'image' },
  { id: 10, label: 'Brass_worn.mat', meta: 'PBR', icon: 'palette' },
  { id: 11, label: 'crowd_walk.anim', meta: '240f', icon: 'curve' },
  { id: 12, label: 'Velvet_red.mat', meta: 'PBR', icon: 'palette' },
  { id: 13, label: 'city_dusk.hdr',  meta: '8k · HDR', icon: 'image' },
  { id: 14, label: 'eric_rig.fbx',   meta: '52 bones', icon: 'bone' },
  { id: 15, label: 'Smoke_sim.vdb',  meta: 'volume', icon: 'cube' },
  { id: 16, label: 'Tiles_4k.png',   meta: '4k · sRGB', icon: 'texture' },
  { id: 17, label: 'idle_loop.anim', meta: '120f', icon: 'curve' },
  { id: 18, label: 'Chrome.mat',     meta: 'PBR · metal', icon: 'palette' },
  { id: 19, label: 'Bark_disp.exr',  meta: '2k · linear', icon: 'image' },
];

// "Basic JS interactions vs React full behavior" — the line we draw everywhere.
function LayerNote() {
  return (
    <div className="dcs-alert" style={{ background: 'var(--dw-bg-soft)', borderColor: 'var(--dw-line)', borderLeftColor: 'var(--dw-accent)', color: 'var(--dw-text)', marginTop: 14 }}>
      <div className="dcs-alert__icon"><Icon name="cpu" /></div>
      <div className="dcs-alert__body">
        <div className="dcs-alert__msg" style={{ color: 'var(--dw-text-dim)' }}>
          <strong style={{ color: 'var(--dw-text)' }}>Styling</strong> is plain CSS (selection ribbon, drop line).
          {' '}<strong style={{ color: 'var(--dw-text)' }}>Basic interactions</strong> — click / Ctrl / Shift selection — ship in the
          {' '}<code>decius.js</code> runtime (<code>data-dcs-select</code>). The <strong style={{ color: 'var(--dw-text)' }}>full behavior</strong> shown
          here — multi-select plus drag-and-drop reorder / reparent with a live drop indicator — is the React reference component.
        </div>
      </div>
    </div>
  );
}

function SectionLists() {
  const [items, setItems] = useStateD(LIST_ITEMS);
  const [sel, setSel] = useStateD(() => new Set([2, 3]));
  const [q, setQ] = useStateD('');
  const [searching, setSearching] = useStateD(false);
  const ql = q.trim().toLowerCase();
  const shown = ql ? items.filter(it => it.label.toLowerCase().includes(ql)) : items;
  return (
    <section className="dw-section" id="lists">
      <div className="dw-section__eyebrow">Data · 01</div>
      <h2>Lists</h2>
      <p className="dw-section__lead">
        Flat, selectable rows — a tree without folding. <strong style={{ color: 'var(--dw-text)' }}>Click</strong> to select,
        {' '}<strong style={{ color: 'var(--dw-text)' }}>Ctrl/⌘-click</strong> to toggle, <strong style={{ color: 'var(--dw-text)' }}>Shift-click</strong> for a
        range, and <strong style={{ color: 'var(--dw-text)' }}>drag</strong> the selection to reorder — a 2px accent line shows where it lands.
        The search button filters; the list scrolls when it overflows.
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
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              <Tree flat multi reorderable={!ql}
                nodes={shown} selected={sel} onSelect={setSel}
                onMove={(ids, t, pos) => setItems(prev => treeMove(prev, ids, t, pos))} />
              {shown.length === 0 && <div style={{ padding: 14, fontSize: 12, color: 'var(--dcs-text-mute)' }}>No matches for "{q}"</div>}
            </div>
          </Panel>
        </div>
      </Demo>
      <LayerNote />
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
  const [nodes, setNodes] = useStateD(OUTLINER_NODES);
  const [expanded, setExpanded] = useStateD(new Set(['scn', 'env', 'chars', 'jane', 'rig']));
  const [sel, setSel] = useStateD(() => new Set(['mesh', 'rig']));
  const [q, setQ] = useStateD('');
  const [searching, setSearching] = useStateD(false);
  const toggle = (id) => setExpanded(prev => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const query = q.trim().toLowerCase();
  const view = query ? filterTree(nodes, query) : nodes;
  const exp = query ? allTreeIds(view) : expanded;
  return (
    <section className="dw-section" id="trees">
      <div className="dw-section__eyebrow">Data · 02</div>
      <h2>Trees</h2>
      <p className="dw-section__lead">
        The outliner. Deep hierarchies of scenes, rigs, layers, nodes. Same selection model as lists —
        <strong style={{ color: 'var(--dw-text)' }}> Ctrl/⌘</strong> toggles, <strong style={{ color: 'var(--dw-text)' }}>Shift</strong> ranges —
        and you can <strong style={{ color: 'var(--dw-text)' }}>drag rows to reorder or reparent</strong>: a line marks a sibling
        drop, a highlighted row marks dropping <em>into</em> a folder. Chevrons expand; search filters and auto-expands.
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
            <div style={{ padding: '4px 0', maxHeight: 300, overflowY: 'auto' }}>
              <Tree multi reorderable={!query}
                expanded={exp} onExpand={toggle}
                selected={sel} onSelect={setSel} nodes={view}
                onMove={(ids, t, pos) => setNodes(prev => treeMove(prev, ids, t, pos))} />
              {view.length === 0 && <div style={{ padding: 14, fontSize: 12, color: 'var(--dcs-text-mute)' }}>No matches for "{q}"</div>}
            </div>
          </Panel>
        </div>
      </Demo>
    </section>
  );
}

/* ─────────── Typed cross-view drag & drop ─────────── */
const DND_ASSETS = [
  { id: 'as-brass',  label: 'Brass_worn.mat', icon: 'palette' },
  { id: 'as-oak',    label: 'OakBark_2k.png', icon: 'texture' },
  { id: 'as-marble', label: 'Marble_4k.exr',  icon: 'image' },
  { id: 'as-normal', label: 'rock_normal.png', icon: 'texture' },
  { id: 'as-walk',   label: 'walk.anim',      icon: 'curve' },
  { id: 'as-chrome', label: 'Chrome.mat',     icon: 'palette' },
];
const DND_HIER = [{
  id: 'scene', label: 'Scene', icon: 'globe', children: [
    { id: 'env', label: 'Environment', icon: 'folder-open', children: [
      { id: 'ground', label: 'Ground', icon: 'plane' },
      { id: 'sky', label: 'Sky', icon: 'image' },
    ] },
    { id: 'hero', label: 'Hero', icon: 'folder-open', children: [
      { id: 'body', label: 'body.geo', icon: 'mesh' },
    ] },
    { id: 'cam', label: 'Camera', icon: 'camera' },
  ],
}];
let dndUid = 0;

// An inspector channel that accepts a dragged asset or hierarchy item (DnD).
function LinkField({ label, value, onLink, onClear }) {
  return (
    <div className="dcs-field">
      <span className="dcs-field__label">{label}</span>
      <DropZone accept={['asset', 'node']} onDrop={(p) => onLink(p.items[0])}
        className={`dcs-linkfield${value ? ' dcs-linkfield--set' : ''}`}>
        {value
          ? <><Icon name={value.icon || 'link'} size="sm" /><span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{value.label}</span>
              <span className="dcs-dockpane__tab-close" style={{ opacity: .6 }} onClick={onClear}><Icon name="close" size="sm" /></span></>
          : <span className="dcs-linkfield__empty">drop an asset…</span>}
      </DropZone>
    </div>
  );
}

function SectionDragDrop() {
  const [assetSel, setAssetSel] = useStateD(() => new Set());
  const [tree, setTree] = useStateD(DND_HIER);
  const [hierSel, setHierSel] = useStateD(() => new Set());
  const [exp, setExp] = useStateD(() => new Set(['scene', 'env', 'hero']));
  const [base, setBase] = useStateD(null);
  const [normal, setNormal] = useStateD(null);
  const toggle = (id) => setExp(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const dropAssets = (payload, { targetId, pos }) => {
    const added = payload.items.map(it => ({ id: `h${++dndUid}_${it.id}`, label: it.label, icon: it.icon }));
    setTree(t => treeInsert(t, added, targetId, pos));
  };
  const pane = { borderRight: '1px solid var(--dcs-line)', borderRadius: 0 };
  return (
    <section className="dw-section" id="dnd">
      <div className="dw-section__eyebrow">Data · 03</div>
      <h2>Drag &amp; drop</h2>
      <p className="dw-section__lead">
        A typed drag-and-drop system at the React layer — the backbone of a DCC tool. Every source carries a
        {' '}<strong style={{ color: 'var(--dw-text)' }}>type</strong>; every target declares which types it
        {' '}<strong style={{ color: 'var(--dw-text)' }}>accepts</strong> and verifies with a callback, lighting up
        {' '}<strong style={{ color: 'var(--dw-text)' }}>valid</strong> (accent) or <strong style={{ color: 'var(--dw-text)' }}>invalid</strong> (red).
        Multi-select assets and drag them into the hierarchy, reorder/reparent the hierarchy itself, or drop an asset
        {' '}<em>or</em> a hierarchy item onto an inspector channel to <strong style={{ color: 'var(--dw-text)' }}>link</strong> it.
      </p>
      <Demo frame="app" caption="useDrag / useDrop + Draggable / DropZone — sources & targets are typed; targets validate by type + canDrop">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1.15fr', height: 340, border: '1px solid var(--dcs-line)', borderRadius: 'var(--dcs-r-2)', overflow: 'hidden', background: 'var(--dcs-bg)' }}>
          <Panel title="Assets" icon="folder" pad={0} style={pane}
                 meta={assetSel.size ? `${assetSel.size} selected` : null}>
            <div style={{ padding: '4px 0', height: '100%', overflowY: 'auto' }}>
              <Tree flat multi source dragType="asset" nodes={DND_ASSETS} selected={assetSel} onSelect={setAssetSel} />
            </div>
          </Panel>
          <Panel title="Hierarchy" icon="layers" pad={0} style={pane}>
            <div style={{ padding: '4px 0', height: '100%', overflowY: 'auto' }}>
              <Tree multi reorderable accept={['asset']} onDropItems={dropAssets}
                expanded={exp} onExpand={toggle} selected={hierSel} onSelect={setHierSel}
                nodes={tree} onMove={(ids, t, pos) => setTree(p => treeMove(p, ids, t, pos))} />
            </div>
          </Panel>
          <Panel title="Inspector · Material" icon="edit" pad="sm" style={{ borderRadius: 0 }}>
            <div className="dcs-props">
              <div className="dcs-field"><span className="dcs-field__label">Name</span><input className="dcs-input" defaultValue="hero_skin" /></div>
              <LinkField label="Base Color" value={base} onLink={setBase} onClear={() => setBase(null)} />
              <LinkField label="Normal" value={normal} onLink={setNormal} onClear={() => setNormal(null)} />
              <div className="dcs-field"><span className="dcs-field__label">Rough</span><Combo value={0.4} min={0} max={1} step={0.01} format={v => v.toFixed(2)} /></div>
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
            <span className="dcs-badge dcs-badge--accent">v0.6.0</span>
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

Object.assign(window, { SectionLists, SectionTrees, SectionDragDrop, SectionTables, SectionBadges, SectionCards });

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
