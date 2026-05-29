/* tweaks.jsx — isolated React overlay that re-themes the whole app through
   decius.css runtime attributes (data-dcs-*). Showcases that every surface
   re-skins live from a handful of tokens. */
const { useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#4d9fff",
  "density": "comfortable",
  "corners": "default",
  "depth": "flat",
  "rulers": true
}/*EDITMODE-END*/;

const ACCENT_NAME = { '#4d9fff': 'blue', '#4ad5d5': 'cyan', '#f2b14a': 'orange', '#b48cff': 'violet', '#4ed18a': 'green' };

function TweaksApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const b = document.body;
    b.setAttribute('data-dcs-density', t.density);
    b.setAttribute('data-dcs-accent', ACCENT_NAME[t.accent] || 'blue');
    if (t.corners === 'default') b.removeAttribute('data-dcs-radius'); else b.setAttribute('data-dcs-radius', t.corners);
    if (t.depth === 'flat') b.removeAttribute('data-dcs-style'); else b.setAttribute('data-dcs-style', t.depth);
    document.querySelectorAll('.ps-ruler, .ps-ruler-corner').forEach(el => el.style.display = t.rulers ? '' : 'none');
    // rerun layout-dependent draws
    if (window.PS && PS.drawRulers) { PS.drawRulers(); PS.updateMarquee && PS.updateMarquee(); }
  }, [t.density, t.accent, t.corners, t.depth, t.rulers]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme — live decius tokens" />
      <TweakColor label="Accent" value={t.accent}
        options={['#4d9fff', '#4ad5d5', '#f2b14a', '#b48cff', '#4ed18a']}
        onChange={(v) => setTweak('accent', v)} />
      <TweakRadio label="Density" value={t.density}
        options={[{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfy' }, { value: 'spacious', label: 'Roomy' }]}
        onChange={(v) => setTweak('density', v)} />
      <TweakRadio label="Corners" value={t.corners}
        options={['sharp', 'default', 'round']}
        onChange={(v) => setTweak('corners', v)} />
      <TweakRadio label="Surface" value={t.depth}
        options={['flat', '3d']}
        onChange={(v) => setTweak('depth', v)} />
      <TweakSection label="Workspace" />
      <TweakToggle label="Show rulers" value={t.rulers}
        onChange={(v) => setTweak('rulers', v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('ps-tweaks-root')).render(<TweaksApp />);
