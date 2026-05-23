/* icons.jsx
   Font-based <Icon name="…"/> for the docs, backed by the decius icon web
   font (dist/css/decius-icons.css). The framework ships icons as a font, so
   there is no sprite to fetch — a glyph is just `<i class="di di-name">`.
*/

const ICON_PX = { sm: 12, lg: 20, xl: 28 };

function Icon({ name, size, className = '', style = {}, title }) {
  const px = ICON_PX[size] || 16;
  const cls = `di di-${name}${className ? ' ' + className : ''}`;
  return (
    <i
      className={cls}
      style={{ fontSize: px, lineHeight: 1, ...style }}
      title={title}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    />
  );
}

// Master catalog used by the icon-browser section
const ICON_CATALOG = [
  { group: 'File / system', icons: ['file', 'folder', 'folder-open', 'save', 'export', 'import', 'trash', 'cog'] },
  { group: 'Edit', icons: ['undo', 'redo', 'cut', 'copy', 'paste', 'edit', 'delete', 'duplicate', 'bug'] },
  { group: 'Transform', icons: ['move', 'rotate', 'scale', 'scale-corners', 'pivot', 'pivot-rotate', 'mirror'] },
  { group: 'Snap / align / gizmo', icons: ['snap', 'snap-pos', 'snap-rot', 'snap-grid', 'magnet', 'align-l', 'align-c-h', 'align-r', 'align-t', 'align-c-v', 'align-b', 'distribute-h', 'distribute-v', 'gizmo', 'gizmo-off'] },
  { group: 'View', icons: ['eye', 'eye-off', 'zoom-in', 'zoom-out', 'fit', 'fullscreen', 'grid-show', 'grid-hide', 'grid-snap'] },
  { group: 'View modes', icons: ['view-bbox', 'view-wire', 'view-solid', 'view-lit', 'view-tex', 'view-render'] },
  { group: 'Objects', icons: ['cube', 'sphere', 'cylinder', 'plane', 'cone', 'torus', 'mesh', 'light', 'camera', 'bone'] },
  { group: 'Tools', icons: ['brush', 'eraser', 'fill', 'pen', 'select', 'lasso', 'marquee'] },
  { group: 'UI / nav', icons: ['chevron-right', 'chevron-left', 'chevron-down', 'chevron-up', 'caret-up-down', 'close', 'check', 'plus', 'minus', 'search', 'menu', 'more-h', 'more-v', 'grip', 'grip-h'] },
  { group: 'Transport', icons: ['play', 'pause', 'stop', 'record', 'rewind', 'fast-forward', 'skip-back', 'skip-fwd', 'volume', 'mic', 'loop'] },
  { group: 'Audio / DAW', icons: ['headphones', 'speaker', 'metronome', 'tempo', 'bars', 'beat', 'sample', 'piano', 'drum', 'midi', 'cable', 'gain', 'eq', 'compress', 'limiter', 'gate', 'sidechain', 'pan', 'stereo', 'mono', 'mute', 'solo', 'arm'] },
  { group: 'Waveforms / DSP', icons: ['wave-sine', 'wave-square', 'wave-saw', 'wave-tri', 'wave-noise', 'envelope', 'lfo', 'filter-lp', 'filter-hp', 'filter-bp', 'filter-notch'] },
  { group: 'Synth / mod', icons: ['oscillator', 'adsr', 'modulate', 'modwheel', 'pitchbend', 'vibrato', 'portamento', 'voice', 'poly', 'preset', 'arp', 'glide'] },
  { group: 'Video editing', icons: ['clip', 'track-v', 'track-a', 'splice', 'blade', 'ripple', 'slip', 'transition', 'fade-in', 'fade-out', 'marker', 'marker-in', 'marker-out', 'filmstrip', 'aspect', 'color-grade', 'keyframe'] },
  { group: 'Painting / drawing', icons: ['brush', 'pencil', 'marker-pen', 'airbrush', 'stamp', 'clone', 'smudge', 'blur', 'sharpen', 'dodge', 'burn', 'sponge', 'tablet-pen', 'opacity', 'flow', 'pressure', 'layer-mask', 'history-brush', 'mixer-brush'] },
  { group: 'Outliner', icons: ['layers', 'group', 'ungroup', 'link', 'link-broken', 'lock', 'unlock', 'pin', 'star', 'star-outline', 'heart', 'heart-outline', 'tag'] },
  { group: 'Render / shading', icons: ['render', 'wireframe', 'shaded', 'textured', 'normals', 'uv'] },
  { group: 'Animation', icons: ['key', 'keys', 'timeline', 'curve', 'graph', 'spline'] },
  { group: 'Color / image', icons: ['palette', 'droplet', 'eyedropper', 'image', 'texture'] },
  { group: 'Status', icons: ['info', 'alert', 'error', 'check-circle', 'help'] },
  { group: 'Misc', icons: ['grid', 'axes', 'globe', 'cpu', 'gpu', 'ai', 'bolt', 'cross-target', 'decimate', 'subdivide', 'extrude', 'array', 'rocket'] },
];

Object.assign(window, { Icon, ICON_CATALOG });
