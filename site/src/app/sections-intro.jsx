/* sections-intro.jsx
   Hero · Why · Install
*/
const { useState: useStateH, useEffect: useEffectH } = React;

function HeroDeck() {
  // Animated little knob array that fills out the hero — alive but not noisy
  const [t, setT] = useStateH(0);
  const [sweepX, setSweepX] = useStateH(null);   // sweep position, or null between notes
  useEffectH(() => {
    // 60fps tick: knobs/wave drift continuously; the sweep only fires when a
    // "note" plays. A little sequencer fires notes in musical bursts — a few
    // pulses, a rest, a run of 3–4, a rest — like a real pattern.
    const STEP = 460, SWEEP = 400;   // ms per sequencer step / per sweep pass
    const genPhrase = () => {
      const out = [];
      const bursts = 2 + Math.floor(Math.random() * 3);          // 2–4 bursts
      for (let b = 0; b < bursts; b++) {
        const on = Math.random() < 0.62 ? 1 : 2 + Math.floor(Math.random() * 2);  // mostly 1, sometimes 2–3
        for (let i = on; i > 0; i--) out.push(true);
        for (let i = 4 + Math.floor(Math.random() * 9); i > 0; i--) out.push(false);  // 4–12 rests
      }
      return out;
    };
    let phrase = genPhrase(), pi = 0, nextStep = performance.now(), noteStart = null;
    const id = setInterval(() => {
      const now = performance.now();
      setT(v => v + 0.0064);
      if (now >= nextStep) {
        if (pi >= phrase.length) { phrase = genPhrase(); pi = 0; }
        if (phrase[pi++]) noteStart = now;     // a note hits → trigger one pass
        nextStep = now + STEP;
      }
      if (noteStart !== null) {
        const prog = (now - noteStart) / SWEEP;
        if (prog >= 1) { noteStart = null; setSweepX(null); }
        else setSweepX(prog * 610 - 70);       // -70 (off-left) → 540 (off-right)
      }
    }, 16);
    return () => clearInterval(id);
  }, []);

  const ring = (i, base) => 0.5 + 0.45 * Math.sin(t * 0.7 + i * 0.9 + base);

  return (
    <div className="dw-stage" style={{ overflow: 'hidden' }}>
      <div className="dw-stage__chrome">
        <div className="dw-stage__lights">
          <div className="dw-stage__light" />
          <div className="dw-stage__light" />
          <div className="dw-stage__light" />
        </div>
        <div className="dw-stage__title">decius · live preview · 1920×1080</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="fullscreen" size="sm" style={{ color: 'var(--dcs-text-mute)' }} />
        </div>
      </div>

      <div className="dcs" style={{ padding: 20, background: 'var(--dcs-bg-app)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
          {/* Left: viewport-y card with knob rack */}
          <Panel title="Filter Bank ▸ Lowpass" icon="filter-lp" headerActive
                 tools={<><Button ghost sm icon iconLeft="bolt" /><Button ghost sm icon iconLeft="more-h" /></>}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '6px 6px 16px', gap: 8, flexShrink: 0 }}>
              <Knob value={ring(0, 0)}     size={56} label="CUT"   format={v => `${Math.round(v * 22050)}`} />
              <Knob value={ring(1, 1.2)}   size={56} label="RES"   format={v => `${(v*100).toFixed(0)}%`} />
              <Knob value={ring(2, 0.4)}   size={56} label="DRIVE" format={v => `${(v*24).toFixed(1)}`} />
              <Knob value={ring(3, 2.1)}   size={56} label="ENV"   bipolar format={v => `${((v-0.5)*2).toFixed(2)}`} />
              <Knob value={ring(4, 1.7)}   size={56} label="LFO"   bipolar format={v => `${((v-0.5)*100).toFixed(0)}`} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexShrink: 0 }}>
              <ButtonGroup value="lp" options={[{ value: 'lp', label: 'LP' }, { value: 'hp', label: 'HP' }, { value: 'bp', label: 'BP' }, { value: 'nt', label: 'Nt' }]} />
              <ButtonGroup value="24" options={[{ value: '12', label: '12' }, { value: '24', label: '24' }]} />
              <span style={{ flex: 1 }} />
              <Switch checked />
              <span style={{ fontSize: 10, color: 'var(--dcs-text-mute)', letterSpacing: '.06em' }}>KEY&nbsp;TRK</span>
            </div>

            <div style={{ flex: 2, minHeight: 78, position: 'relative' }}>
              <svg viewBox="0 0 400 80" preserveAspectRatio="none" style={{ width: '100%', height: '100%', background: 'var(--dcs-well)', border: '1px solid var(--dcs-line)', borderRadius: 3 }}>
                <defs>
                  <linearGradient id="hero-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--dcs-accent)" stopOpacity=".4" />
                    <stop offset="100%" stopColor="var(--dcs-accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map(y => <line key={y} x1="0" y1={y * 80} x2="400" y2={y * 80} stroke="rgba(255,255,255,.05)" strokeWidth=".5" />)}
                {(() => {
                  const cutoff = ring(0, 0);
                  const reso = ring(1, 1.2);
                  let d = `M 0 ${75 - 5 * reso} `;
                  for (let x = 0; x <= 400; x += 4) {
                    const f = x / 400;
                    const resonance = Math.exp(-Math.pow((f - cutoff) * 24, 2)) * reso * 35;
                    const drop = f < cutoff ? 0 : Math.min(60, (f - cutoff) * 180);
                    const y = 75 - resonance + drop;
                    d += `L ${x} ${Math.min(78, y)} `;
                  }
                  return <>
                    <path d={d + ' L 400 80 L 0 80 Z'} fill="url(#hero-fill)" />
                    <path d={d} fill="none" stroke="var(--dcs-accent)" strokeWidth="1.5" />
                  </>;
                })()}
              </svg>
              <div style={{ position: 'absolute', top: 6, left: 8, fontFamily: 'var(--dcs-font-mono)', fontSize: 9, color: 'var(--dcs-text-mute)' }}>FREQ RESP</div>
            </div>

            {/* Oscilloscope — flexes to fill whatever height the panel has left,
                so the column never shows dead space against the taller side. */}
            <div style={{ flex: 3, minHeight: 56, marginTop: 8, position: 'relative' }}>
              <svg viewBox="0 0 400 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', background: 'var(--dcs-well)', border: '1px solid var(--dcs-line)', borderRadius: 3 }}>
                {(() => {
                  const amp = 16 + 22 * ring(2, 0.4);   // driven by DRIVE
                  let wave = 'M 0 50 ';
                  for (let x = 0; x <= 400; x += 3) {
                    const ph = (x / 400) * Math.PI * 6;
                    const y = 50 + Math.sin(ph + t) * amp + Math.sin(ph * 2.4 + t * 1.6) * (amp * 0.32);
                    wave += `L ${x} ${y.toFixed(1)} `;
                  }
                  let grid = '';
                  for (let x = 0; x <= 400; x += 50) grid += `M ${x} 0 L ${x} 100 `;
                  [25, 50, 75].forEach(y => { grid += `M 0 ${y} L 400 ${y} `; });
                  // Vital-style playback sweep: a soft-edged head with a long
                  // logarithmic tail rides L→R; a blurred copy makes the trace
                  // and the grid glow as it passes.
                  // Vital/radar playback sweep: the bar is the leading edge; the
                  // whole effect (bg wash + glowing trace/grid) trails BEHIND it
                  // and is clipped at the bar, so ahead is just the faded base
                  // wave. Additive (screen) so it only brightens.
                  // The sweep only renders while a note is playing (sweepX set
                  // by the sequencer); otherwise just the faded base trace + grid.
                  return <>
                    {sweepX !== null && (
                      <>
                        <defs>
                          <clipPath id="scope-clip"><rect x="0" y="0" width={Math.max(0, sweepX)} height="100" /></clipPath>
                          {/* background wash — logarithmic white→blue→fade behind the bar */}
                          <linearGradient id="scope-bg" gradientUnits="userSpaceOnUse" x1={sweepX - 230} y1="0" x2={sweepX} y2="0">
                            <stop offset="0" stopColor="var(--dcs-accent)" stopOpacity="0" />
                            <stop offset="0.45" stopColor="var(--dcs-accent)" stopOpacity=".12" />
                            <stop offset="0.78" stopColor="var(--dcs-accent)" stopOpacity=".36" />
                            <stop offset="0.93" stopColor="#4d9fff" stopOpacity=".62" />
                            <stop offset="0.99" stopColor="#bfe0ff" stopOpacity=".85" />
                            <stop offset="1" stopColor="#f2f8ff" stopOpacity=".95" />
                          </linearGradient>
                          {/* foreground highlight — grid + wave bloom over the wash */}
                          <linearGradient id="scope-sweep" gradientUnits="userSpaceOnUse" x1={sweepX - 175} y1="0" x2={sweepX} y2="0">
                            <stop offset="0" stopColor="var(--dcs-accent)" stopOpacity="0" />
                            <stop offset="0.5" stopColor="var(--dcs-accent)" stopOpacity=".5" />
                            <stop offset="0.82" stopColor="#bfe0ff" stopOpacity=".95" />
                            <stop offset="0.96" stopColor="#eaf4ff" stopOpacity="1" />
                            <stop offset="1" stopColor="#ffffff" stopOpacity="1" />
                          </linearGradient>
                          <filter id="scope-glow" x="-5%" y="-80%" width="110%" height="260%">
                            <feGaussianBlur stdDeviation="4" />
                          </filter>
                        </defs>
                        <rect x="0" y="0" width="400" height="100" fill="url(#scope-bg)" clipPath="url(#scope-clip)" style={{ mixBlendMode: 'screen' }} />
                      </>
                    )}
                    {/* normal-brightness grid + wave — the faded outline, everywhere */}
                    <path d={grid} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth=".5" />
                    <path d={wave} fill="none" stroke="var(--dcs-accent)" strokeWidth="1.4" strokeOpacity=".75" />
                    {sweepX !== null && (
                      <>
                        {/* additive bloom on grid + wave, clipped to behind the bar */}
                        <g clipPath="url(#scope-clip)" style={{ mixBlendMode: 'screen' }}>
                          <g filter="url(#scope-glow)">
                            <path d={grid} fill="none" stroke="url(#scope-sweep)" strokeWidth="1.8" />
                            <path d={wave} fill="none" stroke="url(#scope-sweep)" strokeWidth="4.5" />
                          </g>
                          <path d={grid} fill="none" stroke="url(#scope-sweep)" strokeWidth=".7" />
                          <path d={wave} fill="none" stroke="url(#scope-sweep)" strokeWidth="1.8" />
                        </g>
                        {/* leading-edge sweep bar */}
                        <line x1={sweepX} y1="0" x2={sweepX} y2="100" stroke="#eaf4ff" strokeWidth="1" strokeOpacity=".9" style={{ mixBlendMode: 'screen' }} />
                      </>
                    )}
                  </>;
                })()}
              </svg>
              <div style={{ position: 'absolute', top: 6, left: 8, fontFamily: 'var(--dcs-font-mono)', fontSize: 9, color: 'var(--dcs-text-mute)' }}>SCOPE</div>
              {/* lights golden whenever the sequencer fires a note */}
              <div style={{
                position: 'absolute', top: 6, right: 6,
                padding: '3px 9px', display: 'flex', alignItems: 'center',
                borderRadius: 999, fontFamily: 'var(--dcs-font-mono)', fontSize: 9,
                fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase',
                background: sweepX !== null ? '#f4c84e' : 'rgba(255,255,255,.05)',
                color: sweepX !== null ? '#1c1606' : 'var(--dcs-text-mute)',
                border: `1px solid ${sweepX !== null ? 'transparent' : 'var(--dcs-line)'}`,
                transition: 'background .08s, color .08s',
              }}>play</div>
            </div>
            </div>
          </Panel>

          {/* Right: outliner + inspector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Panel title="Outliner" icon="layers" pad={0}>
              <div style={{ padding: '4px 0', minHeight: 0 }}>
                <Tree
                  expanded={new Set(['scn', 'rig'])}
                 
                  selected="hand"
                 
                  nodes={[{
                    id: 'scn', label: 'Scene', icon: 'globe',
                    children: [
                      { id: 'jane', label: 'Jane', icon: 'cube', meta: '64k' },
                      { id: 'rig', label: 'jane_rig', icon: 'bone', children: [
                        { id: 'spine', label: 'spine', icon: 'bone' },
                        { id: 'hand', label: 'L_hand', icon: 'bone', meta: 'IK' },
                      ]},
                      { id: 'sun', label: 'Sun.001', icon: 'light' },
                    ]
                  }]}
                />
              </div>
            </Panel>
            <Panel title="Inspector" icon="cog">
              <div className="dcs-col" style={{ gap: 6 }}>
                <div className="dcs-field"><label className="dcs-field__label" style={{ minWidth: 20 }}>X</label><Combo value={1.428}  min={-10} max={10} step={0.001} format={v => v.toFixed(3)} width="100%" /></div>
                <div className="dcs-field"><label className="dcs-field__label" style={{ minWidth: 20 }}>Y</label><Combo value={-0.952} min={-10} max={10} step={0.001} format={v => v.toFixed(3)} width="100%" /></div>
                <div className="dcs-field"><label className="dcs-field__label" style={{ minWidth: 20 }}>Z</label><Combo value={3.000}  min={-10} max={10} step={0.001} format={v => v.toFixed(3)} width="100%" /></div>
              </div>
            </Panel>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
          {[
            { l: 'attack', v: ring(5, 0) },
            { l: 'decay', v: ring(6, 0.5) },
            { l: 'sustain', v: ring(7, 1.1) },
            { l: 'release', v: ring(8, 1.6) },
          ].map(s => (
            <div key={s.l} style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--dcs-well)', border: '1px solid var(--dcs-line)', borderRadius: 3, padding: '5px 7px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--dcs-text-mute)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.l}</span>
                <span className="dcs-mono" style={{ fontSize: 10, color: 'var(--dcs-accent)' }}>{Math.round(s.v * 100)}</span>
              </div>
              <Slider value={s.v} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHero() {
  return (
    <section className="dw-section" id="top" style={{ marginBottom: 60 }}>
      <a href="https://github.com/benjcooley/affineui" target="_blank" rel="noreferrer" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px',
        background: 'var(--dw-accent-dim)',
        border: '1px solid rgba(77,159,255,.35)',
        borderRadius: 999,
        fontSize: 12,
        color: 'var(--dw-accent-lo)',
        marginBottom: 28,
        textDecoration: 'none',
        width: 'fit-content',
        fontFamily: 'var(--dw-font-mono)',
        letterSpacing: '.02em',
      }}>
        <Icon name="bolt" size="sm" />
        <span style={{ color: 'var(--dw-text)', fontWeight: 600 }}>Built for AffineUI</span>
        <span>·</span>
        <span>the single-file, zero-dependency, GPU-accelerated UI engine</span>
        <Icon name="chevron-right" size="sm" />
      </a>
      <div className="dw-hero">
        <div>
          <div className="dw-hero__eyebrow">decius.css · v0.5.3 "Mus"</div>
          <h1>The CSS framework for things that aren't websites.</h1>
          <p className="lede">
            A complete component system for digital content creation tools, synths, video editors, and
            pro desktop interfaces — built around the conventions of Blender, DaVinci Resolve, and Vital,
            distributed as plain CSS, a vanilla-JS runtime, an icon font, and self-hosted type.
            <strong style={{ color: 'var(--dw-text)' }}> One download. Zero dependencies.</strong>
          </p>
          <div className="dw-hero__actions">
            <a className="dw-cta dw-cta--primary dw-cta--lg" href={`${import.meta.env.BASE_URL}dl/decius-css.zip`} download>
              <Icon name="import" size="sm" /> Download decius <span className="dw-cta__sub" style={{ opacity: .7, fontWeight: 400 }}>· .zip · css + js + fonts</span>
            </a>
            <a className="dw-cta dw-cta--ghost" href="#install">
              <Icon name="rocket" size="sm" /> Get started
            </a>
            <a className="dw-cta dw-cta--ghost" href="#buttons">
              <Icon name="graph" size="sm" /> View components
            </a>
            <span className="dw-pill dw-pill--accent dw-pill--dot">MIT license</span>
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 14, fontSize: 13, color: 'var(--dw-text-mute)', flexWrap: 'wrap' }}>
            <span>or grab just what you need:</span>
            <a href={`${import.meta.env.BASE_URL}dl/css/decius.bundle.min.css`} download>decius.bundle.min.css</a>
            <a href={`${import.meta.env.BASE_URL}dl/js/decius.min.js`} download>decius.min.js</a>
            <a href="#install">CDN &amp; npm</a>
          </div>
        </div>
        <HeroDeck />
      </div>

      <div className="dw-install">
        <span className="dw-install__prompt">$</span>
        <span className="dw-install__cmd">npm install decius-css</span>
        <button className="dw-install__copy"><Icon name="copy" size="sm" /> Copy</button>
      </div>
    </section>
  );
}

function SectionWhy() {
  const features = [
    { icon: 'cpu',    title: 'Zero runtime',     desc: 'One stylesheet with the fonts and icon font baked in. No tokens compile step, no design-system tax. Drop the link tag in and ship.' },
    { icon: 'palette', title: 'Tokenized to the wall',  desc: 'Every color, size, radius, shadow and motion value lives in a CSS custom property. Re-theme by overriding seven variables.' },
    { icon: 'magnet', title: 'Pixel-snapped',    desc: 'Lines, bevels, and 1.25px icon strokes line up at 100% zoom. Built for Sundays-on-a-23-inch-screen.' },
    { icon: 'rocket', title: 'Built for pros',   desc: 'Combo number fields, knobs, bipolar sliders, dockable panels. The vocabulary your power users already speak.' },
    { icon: 'globe',  title: 'Framework-agnostic', desc: 'Plain CSS classes. Use it with React, Vue, Svelte, htmx, vanilla JS, Electron, Tauri. Same markup, same shadows.' },
    { icon: 'eye',    title: 'Designed in pairs', desc: 'A light docs-web stylesheet ships alongside, so your marketing site and your app stay siblings, not strangers.' },
  ];
  return (
    <section className="dw-section" id="why">
      <div className="dw-section__eyebrow">Why decius</div>
      <h2>Built for the interfaces nobody else dresses up.</h2>
      <p className="dw-section__lead">
        Bootstrap is for websites. Material is for apps. Decius is for the dense, instrument-panel
        UIs that sit between you and a render — modelers, sequencers, samplers, mixers, editors,
        DAWs, color-graders, terminals.
      </p>
      <div className="dw-feature-grid">
        {features.map(f => (
          <div key={f.title} className="dw-feature">
            <div className="dw-feature__icon"><Icon name={f.icon} /></div>
            <h4>{f.title}</h4>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionInstall() {
  return (
    <section className="dw-section" id="install">
      <div className="dw-section__eyebrow">Getting started</div>
      <h2>Install</h2>
      <p className="dw-section__lead">
        One stylesheet — fonts, icon font, and the whole framework, self-hosted. Add the
        <code>.dcs</code> class to the root of anything you want styled; the framework is fully
        scoped, so it won't leak into the rest of your page. Built for
        {' '}<a href="https://github.com/benjcooley/affineui">affineui</a>, runs in any browser.
      </p>

      <div className="dw-subhead"><h3>From a CDN</h3><div className="dw-subhead__meta">Zero build</div></div>
      <CodeBlock lang="html" code={`<!-- everything: self-hosted fonts + icon font + framework -->
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/decius-css@0.5/dist/css/decius.bundle.min.css">`} />

      <div className="dw-subhead"><h3>Or from npm</h3><div className="dw-subhead__meta">Bundler / Sass</div></div>
      <CodeBlock lang="bash" code={`npm install decius-css`} />
      <CodeBlock lang="js" code={`// plain CSS artifacts
import 'decius-css/css/decius.bundle.min.css';

// …or compile from Sass source and theme it yourself
@use 'decius-css/scss/decius';`} />

      <div className="dw-subhead"><h3>Wrap your app</h3><div className="dw-subhead__meta">.dcs scopes the system</div></div>
      <CodeBlock lang="html" code={`<div class="dcs" data-dcs-density="comfortable">
  <button class="dcs-btn dcs-btn--primary">
    <i class="di di-render"></i>
    Render
  </button>
</div>`} />

      <div style={{ marginTop: 28 }}>
        <div className="dcs-alert" style={{ background: 'var(--dw-bg-soft)', borderColor: 'var(--dw-line)', borderLeftColor: 'var(--dw-accent)', color: 'var(--dw-text)' }}>
          <div className="dcs-alert__icon"><Icon name="info" /></div>
          <div className="dcs-alert__body">
            <div className="dcs-alert__title" style={{ color: 'var(--dw-text)' }}>This page is decius.web</div>
            <div className="dcs-alert__msg" style={{ color: 'var(--dw-text-dim)' }}>
              The white chrome around the embedded panels is <code>decius-web.css</code>, a companion stylesheet
              meant for your marketing site, docs, and changelogs. The dark panels embedded throughout are
              <code>decius.css</code> proper — siblings, sharing the same accent, type, and icon family.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { SectionHero, SectionWhy, SectionInstall, HeroDeck });
