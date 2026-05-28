/* sections-components.jsx
   Buttons · Inputs · Sliders · Knobs · Combo · Checks · Switches · Toolbar
*/
const { useState: useStateC } = React;

function SectionButtons() {
  const [pressed, setPressed] = useStateC({ snap: true, sym: false, prop: false });
  const [tool, setTool] = useStateC('select');
  const [snap, setSnap] = useStateC(true);
  const TOOLS = (sz) => (
    <>
      {['select', 'move', 'rotate', 'scale-corners'].map(t => (
        <Button key={t} ghost icon iconLeft={t} pressed={tool === t} onClick={() => setTool(t)} />
      ))}
      <ToolbarSep />
      {['brush', 'eraser', 'fill'].map(t => (
        <Button key={t} ghost icon iconLeft={t} pressed={tool === t} onClick={() => setTool(t)} />
      ))}
      <ToolbarSep />
      <Button ghost icon iconLeft="magnet" pressed={snap} onClick={() => setSnap(s => !s)} />
    </>
  );
  return (
    <section className="dw-section" id="buttons">
      <div className="dw-section__eyebrow">Components · 01</div>
      <h2>Buttons</h2>
      <p className="dw-section__lead">
        Five intents — default, primary, ghost, danger, toggle — across three sizes. All share the same bevel
        recipe so they stack on a toolbar without breaking rhythm.
      </p>

      <Demo caption="Intents">
        <div className="dcs-row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <Button>Default</Button>
          <Button primary>Primary</Button>
          <Button ghost>Ghost</Button>
          <Button danger>Danger</Button>
          <Button disabled>Disabled</Button>
          <Button pressed>Pressed</Button>
        </div>
      </Demo>

      <Demo caption="With icons, three sizes">
        <div className="dcs-col">
          <div className="dcs-row" style={{ gap: 10 }}>
            <Button sm iconLeft="play">Render</Button>
            <Button sm icon iconLeft="save" />
            <Button sm ghost iconLeft="cog">Prefs</Button>
            <Button sm primary iconLeft="export">Export</Button>
          </div>
          <div className="dcs-row" style={{ gap: 10 }}>
            <Button iconLeft="play">Render</Button>
            <Button icon iconLeft="save" />
            <Button ghost iconLeft="cog">Prefs</Button>
            <Button primary iconLeft="export">Export</Button>
          </div>
          <div className="dcs-row" style={{ gap: 10 }}>
            <Button lg iconLeft="play">Render</Button>
            <Button lg icon iconLeft="save" />
            <Button lg ghost iconLeft="cog">Prefs</Button>
            <Button lg primary iconLeft="export">Export</Button>
          </div>
        </div>
      </Demo>

      <Demo caption="Segmented button group — for mutually exclusive modes">
        <div className="dcs-col">
          <ButtonGroup
            value={pressed.snap}
            onChange={v => setPressed(p => ({ ...p, snap: v }))}
            options={[
              { value: false, icon: 'cube', label: 'Vertex' },
              { value: true,  icon: 'array', label: 'Grid' },
              { value: 'edge', icon: 'spline', label: 'Edge' },
              { value: 'face', icon: 'plane', label: 'Face' },
            ]}
          />
          <ButtonGroup
            value={pressed.sym}
            onChange={v => setPressed(p => ({ ...p, sym: v }))}
            options={[
              { value: 'x', label: 'X' },
              { value: 'y', label: 'Y' },
              { value: 'z', label: 'Z' },
            ]}
          />
        </div>
      </Demo>

      <Demo caption="One uniform toolbar — sm / md / lg. Click a tool: selected = solid accent, dark icon, rounded.">
        <div className="dcs-col" style={{ gap: 12 }}>
          <Toolbar size="sm">{TOOLS('sm')}<div style={{ flex: 1 }} /><Button ghost icon iconLeft="undo" /><Button ghost icon iconLeft="redo" /></Toolbar>
          <Toolbar>{TOOLS('md')}<div style={{ flex: 1 }} /><Button ghost icon iconLeft="undo" /><Button ghost icon iconLeft="redo" /></Toolbar>
          <Toolbar size="lg">{TOOLS('lg')}<div style={{ flex: 1 }} /><Button ghost icon iconLeft="undo" /><Button ghost icon iconLeft="redo" /></Toolbar>
        </div>
      </Demo>

      <Demo caption="Vertical rail + a floating overlay variant — same toolbar, two placements">
        <div className="dcs-row" style={{ gap: 24, alignItems: 'flex-start' }}>
          <Toolbar vertical>
            {['select', 'move', 'rotate', 'scale-corners'].map(t => (
              <Button key={t} ghost icon iconLeft={t} pressed={tool === t} onClick={() => setTool(t)} />
            ))}
            <ToolbarSep />
            <Button ghost icon iconLeft="magnet" pressed={snap} onClick={() => setSnap(s => !s)} />
          </Toolbar>
          <div style={{ position: 'relative', flex: 1, minHeight: 120, borderRadius: 'var(--dcs-r-3)', background: 'radial-gradient(ellipse at 50% 40%, #3a4054, #161922 80%)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 10, left: 10 }}>
              <Toolbar floating size="sm">{TOOLS('sm')}</Toolbar>
            </div>
            <span style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 11, color: 'var(--dcs-text-mute)', fontFamily: 'var(--dcs-font-mono)' }}>floating overlay</span>
          </div>
        </div>
      </Demo>
    </section>
  );
}

function SectionInputs() {
  const [name, setName] = useStateC('untitled.dcs');
  const [freq, setFreq] = useStateC(440);
  const [pos, setPos] = useStateC({ x: 1.428, y: -0.952, z: 3.000 });
  const [color, setColor] = useStateC('#4d9fff');
  const [renderer, setRenderer] = useStateC('cyc');
  const [quality, setQuality] = useStateC('high');
  const [vol, setVol] = useStateC(0.62);
  const [bake, setBake] = useStateC(true);
  const [live, setLive] = useStateC(true);
  const [mode, setMode] = useStateC('form'); // 'form' | 'props'
  const wrapClass = mode === 'props' ? 'dcs-props' : 'dcs-form';
  return (
    <section className="dw-section" id="inputs">
      <div className="dw-section__eyebrow">Components · 02</div>
      <h2>Text &amp; number fields</h2>
      <p className="dw-section__lead">
        Sunken inputs with mono numerics by default. The well shadow signals "type here" without
        a placeholder label fight.
      </p>

      <p className="dw-section__lead" style={{ marginTop: 24 }}>
        Wrap a stack of <code>.dcs-field</code> rows in one of two layouts.
        Use <code>.dcs-form</code> for <strong>dialog boxes and modal-like panels</strong> — labels
        right-justified, controls at their natural width, bare buttons self-centered, with an optional
        <code>.dcs-form__actions</code> footer for grouped buttons. Use <code>.dcs-props</code> for
        <strong> property inspectors and channel editors</strong> — labels left-justified, controls
        (including bare buttons) stretched to fill the row so a tall stack reads as even, same-size
        channel rows. Toggle the mode to see the same content rearrange.
      </p>

      <Demo frame="app" caption={mode === 'form' ? '.dcs-form — dialog/modal, labels right, controls natural width' : '.dcs-props — inspector, labels left, channels stretch'}>
        <div className="dcs-col" style={{ gap: 16 }}>
          <div className="dcs-btn-group" role="tablist" style={{ alignSelf: 'flex-start' }}>
            <button className={`dcs-btn ${mode === 'form' ? 'dcs-btn--primary' : ''}`}
                    onClick={() => setMode('form')} role="tab" aria-selected={mode === 'form'}>
              .dcs-form
            </button>
            <button className={`dcs-btn ${mode === 'props' ? 'dcs-btn--primary' : ''}`}
                    onClick={() => setMode('props')} role="tab" aria-selected={mode === 'props'}>
              .dcs-props
            </button>
          </div>

          <div className={wrapClass} style={{ maxWidth: 460 }}>
            <div className="dcs-field">
              <label className="dcs-field__label">Project</label>
              <input className="dcs-input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="dcs-field">
              <label className="dcs-field__label">Notes</label>
              <textarea className="dcs-textarea" defaultValue="// safe to render — caches warm" />
            </div>
            <div className="dcs-field">
              <label className="dcs-field__label">Frequency</label>
              <Combo value={freq} onChange={setFreq} min={20} max={20000} step={0.1} format={v => `${v.toFixed(1)} Hz`} />
            </div>
            <div className="dcs-field">
              <label className="dcs-field__label">Position</label>
              <Combo unbounded value={pos.x} onChange={v => setPos(p => ({ ...p, x: v }))} step={0.001} label="X" format={v => v.toFixed(3)} />
              <Combo unbounded value={pos.y} onChange={v => setPos(p => ({ ...p, y: v }))} step={0.001} label="Y" format={v => v.toFixed(3)} />
              <Combo unbounded value={pos.z} onChange={v => setPos(p => ({ ...p, z: v }))} step={0.001} label="Z" format={v => v.toFixed(3)} />
            </div>
            <div className="dcs-field">
              <label className="dcs-field__label">Color</label>
              <ColorField value={color} onChange={setColor} />
            </div>
            <div className="dcs-field">
              <label className="dcs-field__label">Renderer</label>
              <Select value={renderer} onChange={setRenderer} options={[
                { value: 'cyc', label: 'Cycles · Pathtraced', icon: 'render' },
                { value: 'eev', label: 'Eevee · Realtime',    icon: 'play' },
                { value: 'wf',  label: 'Wireframe only',      icon: 'view-wire' },
              ]} />
            </div>
            <div className="dcs-field">
              <label className="dcs-field__label">Quality</label>
              <ButtonGroup value={quality} onChange={setQuality} options={[
                { value: 'low',  label: 'Low'  },
                { value: 'med',  label: 'Med'  },
                { value: 'high', label: 'High' },
                { value: 'ult',  label: 'Ult'  },
              ]} />
            </div>
            <div className="dcs-field">
              <label className="dcs-field__label">Volume</label>
              <Slider value={vol} onChange={setVol} />
            </div>
            <div className="dcs-field">
              <label className="dcs-field__label">Auto-bake</label>
              <Check checked={bake} onChange={setBake} />
            </div>
            <div className="dcs-field">
              <label className="dcs-field__label">Live preview</label>
              <Switch checked={live} onChange={setLive} />
            </div>

            {/* Lists, trees, and tables inside a field flip vertical: prompt
                ABOVE, control below at full row width in .dcs-props or 2/3
                width centered in .dcs-form. Default height 4 channel rows,
                framed in a sunken well, scrollable. */}
            <div className="dcs-field">
              <label className="dcs-field__label">Linked assets</label>
              <div className="dcs-list">
                {[['intro.scene', 'cube'], ['hero.mat', 'palette'], ['sky_4k.hdr', 'image'], ['walk.anim', 'curve'], ['notes.md', 'file']].map(([n, ic], i) => (
                  <div key={n} className="dcs-list__item" aria-selected={i === 0}>
                    <Icon name={ic} /><span style={{ flex: 1 }}>{n}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="dcs-field">
              <label className="dcs-field__label">Scene hierarchy</label>
              <Tree
                expanded={new Set(['root', 'group'])}
                selected="b"
                nodes={[{
                  id: 'root', label: 'Project', icon: 'folder-open', children: [
                    { id: 'group', label: 'Group', icon: 'group', children: [
                      { id: 'a', label: 'Node A', icon: 'cube' },
                      { id: 'b', label: 'Node B', icon: 'cube' },
                      { id: 'c', label: 'Node C', icon: 'sphere' },
                    ] },
                    { id: 'cam', label: 'Camera', icon: 'camera' },
                    { id: 'light', label: 'Light', icon: 'light' },
                  ],
                }]}
              />
            </div>

            {/* Full-width text labels — no prompt, span the row. Use .dcs-note
                for lightweight info/warning text, or drop a .dcs-alert into
                the stack for the heavier "alert panel" treatment. */}
            <div className="dcs-note">Disk is 92% full — cleanup recommended.</div>

            <div className="dcs-alert dcs-alert--warn">
              <div className="dcs-alert__icon"><Icon name="alert" /></div>
              <div className="dcs-alert__body">You have 3 uncommitted files — save or stash before switching projects.</div>
            </div>
            {/* Bare button — in .dcs-props it stretches as a channel widget;
                in .dcs-form it keeps natural size and self-centers. */}
            <button className="dcs-btn dcs-btn--primary">Apply</button>

            {/* Paired buttons — `.dcs-btn-row` centers them in .dcs-form
                and splits them evenly across the channel column in
                .dcs-props. */}
            <div className="dcs-btn-row">
              <button className="dcs-btn">Cancel</button>
              <button className="dcs-btn dcs-btn--primary">Close</button>
            </div>
          </div>

          <div className="dw-note" style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.08)' }}>
            <p>Standalone <code>&lt;Check&gt;</code> with text — outside a form/props stack — defaults to check-left, text-right:</p>
            <Check checked={bake} onChange={setBake}>Bundle textures with project</Check>
          </div>
        </div>
      </Demo>
    </section>
  );
}

function SectionSliders() {
  const [vol, setVol] = useStateC(0.62);
  const [pan, setPan] = useStateC(-0.2);
  const [time, setTime] = useStateC(0.4);
  const [fader1, setFader1] = useStateC(0.75);
  const [fader2, setFader2] = useStateC(0.5);
  const [fader3, setFader3] = useStateC(0.3);
  const [fader4, setFader4] = useStateC(0.85);

  return (
    <section className="dw-section" id="sliders">
      <div className="dw-section__eyebrow">Components · 03</div>
      <h2>Sliders &amp; faders</h2>
      <p className="dw-section__lead">
        Horizontal sliders for parameters with continuous semantics. Bipolar variant for centered
        ranges. Vertical faders for synth-style mix surfaces.
      </p>

      <Demo caption="DCC-style horizontal slider">
        <div className="dcs-col" style={{ maxWidth: 420, gap: 10 }}>
          <div className="dcs-field">
            <label className="dcs-field__label">Roughness</label>
            <Slider value={vol} onChange={setVol} />
            <span className="dcs-mono" style={{ width: 50, textAlign: 'right' }}>{vol.toFixed(3)}</span>
          </div>
          <div className="dcs-field">
            <label className="dcs-field__label">Pan</label>
            <Slider value={pan} onChange={setPan} min={-1} max={1} bipolar ticks={[-1, 0, 1]} />
            <span className="dcs-mono" style={{ width: 50, textAlign: 'right' }}>{pan >= 0 ? '+' : ''}{pan.toFixed(2)}</span>
          </div>
          <div className="dcs-field">
            <label className="dcs-field__label">Timeline</label>
            <Slider value={time} onChange={setTime} ticks={Array.from({ length: 9 }, (_, i) => i/8)} />
            <span className="dcs-mono" style={{ width: 50, textAlign: 'right' }}>{Math.round(time * 240)}f</span>
          </div>
        </div>
      </Demo>

      <Demo caption="Synth fader column — drag vertically">
        <div className="dcs-row" style={{ alignItems: 'flex-end', gap: 24, padding: '12px 0' }}>
          {[
            { v: fader1, set: setFader1, l: 'KCK' },
            { v: fader2, set: setFader2, l: 'SNR' },
            { v: fader3, set: setFader3, l: 'HAT' },
            { v: fader4, set: setFader4, l: 'BUS' },
          ].map(f => (
            <div key={f.l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 54 }}>
              <span className="dcs-mono dcs-accent-text" style={{ fontSize: 11, width: 54, textAlign: 'center' }}>
                {Math.round((f.v - 0.75) * 60)} dB
              </span>
              <Fader value={f.v} onChange={f.set} />
              <span className="dcs-mono" style={{ fontSize: 10, color: 'var(--dcs-text-dim)', letterSpacing: '.08em' }}>{f.l}</span>
            </div>
          ))}
          <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--dcs-line)', margin: '0 8px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 54 }}>
            <span className="dcs-mono dcs-accent-text" style={{ fontSize: 11, color: 'var(--dcs-ok)', width: 54, textAlign: 'center' }}>
              -3 dB
            </span>
            <Fader value={0.92} />
            <span className="dcs-mono" style={{ fontSize: 10, color: 'var(--dcs-text)', letterSpacing: '.08em' }}>MASTER</span>
          </div>
        </div>
      </Demo>
    </section>
  );
}

function SectionKnobs() {
  const [k, setK] = useStateC({ cutoff: 0.65, res: 0.3, drive: 0.2, env: 0.5, freq: 0.4, mix: 0.5, fb: 0.25 });
  const upd = (key, v) => setK(o => ({ ...o, [key]: v }));
  return (
    <section className="dw-section" id="knobs">
      <div className="dw-section__eyebrow">Components · 04</div>
      <h2>Knobs</h2>
      <p className="dw-section__lead">
        Synth-style rotary controls. Drag vertically to change; hold <code>Shift</code> for fine
        adjustment. The arc fills counter-clockwise from <code>−135°</code>, or radiates from
        center in bipolar mode.
      </p>

      <Demo caption="Three sizes · 40 / 56 / 72">
        <div className="dcs-row" style={{ gap: 36, padding: '16px 8px 12px', flexWrap: 'wrap' }}>
          <Knob value={k.cutoff} onChange={v => upd('cutoff', v)} size={40} label="CUTOFF" format={v => `${Math.round(v * 22050)}Hz`} />
          <Knob value={k.res} onChange={v => upd('res', v)} size={56} label="RESO" format={v => `${(v * 100).toFixed(0)}%`} />
          <Knob value={k.drive} onChange={v => upd('drive', v)} size={72} label="DRIVE" format={v => `${(v * 24).toFixed(1)}dB`} />
        </div>
      </Demo>

      <Demo caption="Bipolar — for ±N parameters">
        <div className="dcs-row" style={{ gap: 36, padding: '16px 8px 12px', flexWrap: 'wrap' }}>
          <Knob value={k.env}  onChange={v => upd('env', v)}  size={56} label="ENV ±" bipolar format={v => `${((v - 0.5) * 2).toFixed(2)}`} />
          <Knob value={k.freq} onChange={v => upd('freq', v)} size={56} label="DETUNE" bipolar format={v => `${((v - 0.5) * 100).toFixed(0)}ct`} />
          <Knob value={k.mix}  onChange={v => upd('mix', v)}  size={56} label="WET/DRY" bipolar format={v => v < 0.5 ? `DRY ${Math.round((0.5 - v) * 200)}` : `WET ${Math.round((v - 0.5) * 200)}`} />
          <Knob value={k.fb}   onChange={v => upd('fb', v)}   size={56} label="F/BACK" format={v => `${(v * 100).toFixed(0)}%`} />
        </div>
      </Demo>

      <Demo frame="app" caption="Knob rack — DSP signal flow legible at a glance">
        <Panel title="Filter ▸ Lowpass 24dB" icon="filter-lp">
          <div className="dcs-row" style={{ gap: 28, padding: '14px 4px 14px', flexWrap: 'wrap', justifyContent: 'space-around' }}>
            <Knob value={k.cutoff} onChange={v => upd('cutoff', v)} size={56} label="CUT" format={v => `${Math.round(v * 22050)}`} />
            <Knob value={k.res}  onChange={v => upd('res', v)}  size={56} label="RES"  format={v => `${(v*100).toFixed(0)}`} />
            <Knob value={k.drive} onChange={v => upd('drive', v)} size={56} label="DRIVE" format={v => `${(v*24).toFixed(1)}`} />
            <Knob value={k.env}  onChange={v => upd('env', v)}  size={56} label="ENV"  bipolar format={v => `${((v-0.5)*2).toFixed(2)}`} />
            <Knob value={k.mix}  onChange={v => upd('mix', v)}  size={56} label="LFO"  bipolar format={v => `${((v-0.5)*200).toFixed(0)}`} />
          </div>
        </Panel>
      </Demo>
    </section>
  );
}

function SectionCombo() {
  const [pos, setPos] = useStateC({ x: 1.428, y: -0.952, z: 3.0 });
  const [scale, setScale] = useStateC(1);
  const [rot, setRot] = useStateC(45);
  const [sub, setSub] = useStateC(3);
  return (
    <section className="dw-section" id="combo">
      <div className="dw-section__eyebrow">Components · 05</div>
      <h2>Combo number fields</h2>
      <p className="dw-section__lead">
        ZBrush-style hybrid controls. Drag horizontally to scrub the value; click without dragging
        to type a number directly; the chevrons step by a single unit. Hold <code>Shift</code>
        while dragging to coarsen, hold <code>Ctrl</code> for precision.
      </p>

      <Demo caption="A property inspector row — what 80% of a DCC inspector actually looks like">
        <div className="dcs-col" style={{ maxWidth: 480 }}>
          <div className="dcs-field">
            <label className="dcs-field__label">Position</label>
            <Combo value={pos.x} onChange={v => setPos(p => ({ ...p, x: v }))} min={-10} max={10} step={0.001} label="X" format={v => v.toFixed(3)} width={120} />
            <Combo value={pos.y} onChange={v => setPos(p => ({ ...p, y: v }))} min={-10} max={10} step={0.001} label="Y" format={v => v.toFixed(3)} width={120} />
            <Combo value={pos.z} onChange={v => setPos(p => ({ ...p, z: v }))} min={-10} max={10} step={0.001} label="Z" format={v => v.toFixed(3)} width={120} />
          </div>
          <div className="dcs-field">
            <label className="dcs-field__label">Scale</label>
            <Combo value={scale} onChange={setScale} min={0.01} max={10} step={0.01} format={v => v.toFixed(2)} width={120} />
          </div>
          <div className="dcs-field">
            <label className="dcs-field__label">Rotation</label>
            <Combo value={rot} onChange={setRot} min={-180} max={180} step={1} format={v => `${v.toFixed(0)}°`} width={120} />
          </div>
          <div className="dcs-field">
            <label className="dcs-field__label">Subdivision</label>
            <Combo value={sub} onChange={setSub} min={0} max={8} step={1} format={v => `${v.toFixed(0)}×`} width={120} />
          </div>
        </div>
      </Demo>
    </section>
  );
}

function SectionChecksSwitches() {
  const [c, setC] = useStateC({ a: true, b: false, c: true, s1: true, s2: false, s3: true, r: 'b' });
  return (
    <section className="dw-section" id="checks">
      <div className="dw-section__eyebrow">Components · 06</div>
      <h2>Checks, radios, switches</h2>
      <p className="dw-section__lead">
        Three discrete pickers for three contexts: checks for additive options, radios for exclusive
        choices, switches for live-applied bypasses.
      </p>
      <Demo>
        <div className="dcs-row" style={{ gap: 32 }}>
          <div className="dcs-col">
            <Check checked={c.a} onChange={v => setC(o => ({ ...o, a: v }))}>Cast shadows</Check>
            <Check checked={c.b} onChange={v => setC(o => ({ ...o, b: v }))}>Receive shadows</Check>
            <Check checked={c.c} onChange={v => setC(o => ({ ...o, c: v }))}>Ray-visible</Check>
          </div>
          <div className="dcs-col">
            <Check radio checked={c.r === 'a'} onChange={() => setC(o => ({ ...o, r: 'a' }))}>BVH</Check>
            <Check radio checked={c.r === 'b'} onChange={() => setC(o => ({ ...o, r: 'b' }))}>kd-Tree</Check>
            <Check radio checked={c.r === 'c'} onChange={() => setC(o => ({ ...o, r: 'c' }))}>Embree</Check>
          </div>
          <div className="dcs-col">
            <div className="dcs-row"><Switch checked={c.s1} onChange={v => setC(o => ({ ...o, s1: v }))} /><span style={{ fontSize: 12 }}>Auto-bake</span></div>
            <div className="dcs-row"><Switch checked={c.s2} onChange={v => setC(o => ({ ...o, s2: v }))} /><span style={{ fontSize: 12 }}>Cache to disk</span></div>
            <div className="dcs-row"><Switch checked={c.s3} onChange={v => setC(o => ({ ...o, s3: v }))} /><span style={{ fontSize: 12 }}>Watch live</span></div>
          </div>
        </div>
      </Demo>
    </section>
  );
}

Object.assign(window, {
  SectionButtons, SectionInputs, SectionSliders, SectionKnobs, SectionCombo, SectionChecksSwitches,
});
