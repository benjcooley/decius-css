/* ===========================================================================
   tools.js — static data: tools, option-bar templates, menus, swatches.
   Global namespace: window.PS
   =========================================================================== */
window.PS = window.PS || {};

/* custom inline SVG for glyphs decius's icon font doesn't cover */
PS.SVG = {
  type: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 6V4h14v2M12 4v16M9 20h6"/></svg>',
  shape: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>',
  gradient: '<svg viewBox="0 0 24 24" width="1em" height="1em"><defs><linearGradient id="g1"><stop offset="0" stop-color="currentColor" stop-opacity="0"/><stop offset="1" stop-color="currentColor"/></linearGradient></defs><rect x="3" y="5" width="18" height="14" rx="2" fill="url(#g1)"/></svg>'
};

/* a tool can define icon (decius di-name) OR svg (raw). cursor optional. */
PS.TOOLS = [
  { id:'move',     name:'Move Tool',            key:'V', icon:'move',          cursor:'move',
    tip:'Move: drag to reposition the active layer.' },
  { id:'marquee',  name:'Rectangular Marquee',  key:'M', icon:'marquee', group:1, cursor:'crosshair',
    tip:'Marquee: drag to make a rectangular selection.' },
  { id:'lasso',    name:'Lasso Tool',           key:'L', icon:'lasso',   group:1, cursor:'crosshair',
    tip:'Lasso: drag to draw a freehand selection.' },
  { id:'wand',     name:'Object Selection',     key:'W', icon:'select',  group:1, cursor:'crosshair',
    tip:'Magic Wand: click to select a similar-color region.' },
  { sep:true },
  { id:'crop',     name:'Crop Tool',            key:'C', icon:'clip',     cursor:'crosshair',
    tip:'Crop: drag to trim the document to a region.' },
  { id:'eyedropper',name:'Eyedropper',          key:'I', icon:'eyedropper', cursor:'crosshair',
    tip:'Eyedropper: click to sample a color as the foreground.' },
  { sep:true },
  { id:'brush',    name:'Brush Tool',           key:'B', icon:'brush',   group:1, paint:true, cursor:'crosshair',
    tip:'Brush: drag on the canvas to paint with the foreground color.' },
  { id:'pencil',   name:'Pencil Tool',          key:'N', icon:'pencil',  paint:true, cursor:'crosshair',
    tip:'Pencil: hard-edged freehand strokes.' },
  { id:'clone',    name:'Clone Stamp',          key:'S', icon:'stamp',   group:1, paint:true, cursor:'crosshair',
    tip:'Clone Stamp: Alt-click to set a source, then paint to copy pixels.' },
  { id:'history',  name:'History Brush',        key:'Y', icon:'history-brush', paint:true, cursor:'crosshair',
    tip:'History Brush: paint to restore from the history source state.' },
  { id:'eraser',   name:'Eraser Tool',          key:'E', icon:'eraser',  group:1, paint:true, cursor:'crosshair',
    tip:'Eraser: drag to erase pixels on the active layer.' },
  { id:'fill',     name:'Paint Bucket',         key:'G', icon:'fill',    group:1, cursor:'crosshair',
    tip:'Paint Bucket: click to flood-fill a region with the foreground color.' },
  { id:'gradient', name:'Gradient Tool',        key:'G', svg:'gradient', cursor:'crosshair',
    tip:'Gradient: drag to draw a foreground→transparent gradient.' },
  { sep:true },
  { id:'dodge',    name:'Dodge Tool',           key:'O', icon:'dodge',   group:1, paint:true, cursor:'crosshair',
    tip:'Dodge: paint to lighten pixels.' },
  { id:'burn',     name:'Burn Tool',            key:'O', icon:'burn',    paint:true, cursor:'crosshair',
    tip:'Burn: paint to darken pixels.' },
  { id:'smudge',   name:'Smudge Tool',          key:'R', icon:'smudge',  paint:true, cursor:'crosshair',
    tip:'Smudge: drag to push pixels around.' },
  { id:'blur',     name:'Blur Tool',            key:'R', icon:'blur',    paint:true, cursor:'crosshair',
    tip:'Blur: paint to soften detail.' },
  { sep:true },
  { id:'pen',      name:'Pen Tool',             key:'P', icon:'pen',     cursor:'crosshair',
    tip:'Pen: click to add anchor points and build a path.' },
  { id:'type',     name:'Horizontal Type',      key:'T', svg:'type',     cursor:'text',
    tip:'Type: click to add a text layer.' },
  { id:'shape',    name:'Rectangle Tool',       key:'U', svg:'shape',    cursor:'crosshair',
    tip:'Shape: drag to draw a filled rectangle on a new layer.' },
  { sep:true },
  { id:'hand',     name:'Hand Tool',            key:'H', icon:'pan',     cursor:'grab',
    tip:'Hand: drag to pan the document.' },
  { id:'zoom',     name:'Zoom Tool',            key:'Z', icon:'zoom-in', cursor:'zoom-in',
    tip:'Zoom: click to zoom in, Alt-click to zoom out.' },
];

PS.toolById = id => PS.TOOLS.find(t => t.id === id);

/* ----- option-bar builders, keyed by tool id. Return HTML string. -------- */
const sld = (id,min,max,val,w=120) =>
  `<div class="dcs-slider" id="${id}" data-dcs-slider data-min="${min}" data-max="${max}" data-value="${val}" style="width:${w}px;"></div>`;
const num = (id,val,w=58) =>
  `<input class="dcs-input dcs-input--num" id="${id}" value="${val}" style="width:${w}px;">`;
const opt = (label, inner) =>
  `<div class="ps-optgroup"><label class="ps-optlabel">${label}</label>${inner}</div>`;
const vsep = '<div class="dcs-divider dcs-divider--v"></div>';

const modeSelect = `<select class="dcs-select" id="ps-opt-mode" style="width:120px;">
  <option value="source-over">Normal</option><option value="multiply">Multiply</option>
  <option value="screen">Screen</option><option value="overlay">Overlay</option>
  <option value="darken">Darken</option><option value="lighten">Lighten</option>
  <option value="color-dodge">Dodge</option><option value="color-burn">Burn</option>
  <option value="difference">Difference</option></select>`;

PS.OPTIONS = {
  brush:  () => opt('Size', sld('ps-o-size',1,400,'24')+num('ps-o-size-n',24,46)) + vsep
              + opt('Hardness', sld('ps-o-hard',0,100,'70',90)) + vsep
              + opt('Opacity', sld('ps-o-op',1,100,'100',90)) + vsep
              + opt('Flow', sld('ps-o-flow',1,100,'100',90)) + vsep
              + opt('Mode', modeSelect),
  pencil: () => opt('Size', sld('ps-o-size',1,200,'4')+num('ps-o-size-n',4,46)) + vsep
              + opt('Opacity', sld('ps-o-op',1,100,'100',90)) + vsep + opt('Mode', modeSelect),
  eraser: () => opt('Size', sld('ps-o-size',1,400,'30')+num('ps-o-size-n',30,46)) + vsep
              + opt('Hardness', sld('ps-o-hard',0,100,'50',90)) + vsep
              + opt('Opacity', sld('ps-o-op',1,100,'100',90)),
  clone:  () => opt('Size', sld('ps-o-size',1,400,'40')+num('ps-o-size-n',40,46)) + vsep
              + opt('Hardness', sld('ps-o-hard',0,100,'60',90)) + vsep
              + opt('Opacity', sld('ps-o-op',1,100,'100',90)) + vsep
              + '<span class="dcs-badge dcs-badge--soft" id="ps-clone-state">Alt-click to set source</span>',
  history:() => opt('Size', sld('ps-o-size',1,400,'40')+num('ps-o-size-n',40,46)) + vsep
              + opt('Opacity', sld('ps-o-op',1,100,'100',90)),
  dodge:  () => opt('Size', sld('ps-o-size',1,400,'60')+num('ps-o-size-n',60,46)) + vsep
              + opt('Exposure', sld('ps-o-op',1,100,'40',90)),
  burn:   () => opt('Size', sld('ps-o-size',1,400,'60')+num('ps-o-size-n',60,46)) + vsep
              + opt('Exposure', sld('ps-o-op',1,100,'40',90)),
  smudge: () => opt('Size', sld('ps-o-size',1,300,'30')+num('ps-o-size-n',30,46)) + vsep
              + opt('Strength', sld('ps-o-op',1,100,'50',90)),
  blur:   () => opt('Size', sld('ps-o-size',1,300,'40')+num('ps-o-size-n',40,46)) + vsep
              + opt('Strength', sld('ps-o-op',1,100,'50',90)),
  fill:   () => opt('Tolerance', sld('ps-o-tol',0,128,'32',120)) + vsep
              + opt('Opacity', sld('ps-o-op',1,100,'100',90)) + vsep
              + `<label class="dcs-check" id="ps-o-contig" aria-checked="true"><span class="dcs-check__box"></span> Contiguous</label>`,
  gradient:() => opt('Opacity', sld('ps-o-op',1,100,'100',90)) + vsep
              + `<span class="dcs-badge dcs-badge--soft">Foreground → Transparent</span>`,
  marquee:() => `<div class="dcs-btn-group" id="ps-marquee-mode">
                   <button class="dcs-btn dcs-btn--sm" data-v="new" aria-pressed="true"><i class="di di-marquee"></i></button>
                   <button class="dcs-btn dcs-btn--sm" data-v="add"><i class="di di-plus"></i></button>
                   <button class="dcs-btn dcs-btn--sm" data-v="sub"><i class="di di-minus"></i></button>
                 </div>` + vsep
              + opt('Feather', num('ps-o-feather','0',46) + '<span class="ps-optlabel">px</span>'),
  lasso:  () => opt('Feather', num('ps-o-feather','0',46) + '<span class="ps-optlabel">px</span>') + vsep
              + `<label class="dcs-check" id="ps-o-aa" aria-checked="true"><span class="dcs-check__box"></span> Anti-alias</label>`,
  wand:   () => opt('Tolerance', sld('ps-o-tol',0,128,'32',120)) + vsep
              + `<label class="dcs-check" id="ps-o-contig" aria-checked="true"><span class="dcs-check__box"></span> Contiguous</label>`,
  move:   () => `<label class="dcs-check" id="ps-o-autosel" aria-checked="true"><span class="dcs-check__box"></span> Auto-Select</label>`
              + vsep + `<span class="dcs-badge dcs-badge--soft">Drag to move layer pixels</span>`,
  crop:   () => opt('Ratio', `<select class="dcs-select" style="width:120px;"><option>Free</option><option>1:1</option><option>4:3</option><option>16:9</option></select>`)
              + vsep + `<button class="dcs-btn dcs-btn--primary dcs-btn--sm" id="ps-crop-apply"><i class="di di-check"></i> Apply</button>`,
  type:   () => opt('Font', `<select class="dcs-select" id="ps-type-font" style="width:140px;"><option>IBM Plex Sans</option><option>JetBrains Mono</option><option>Georgia</option></select>`)
              + opt('Size', num('ps-type-size','64',52)) + vsep
              + opt('Text', `<input class="dcs-input" id="ps-type-text" value="Decius" style="width:160px;">`),
  shape:  () => opt('Fill', `<span class="dcs-colorfield dcs-colorfield--swatch"><span class="dcs-colorfield__chip" id="ps-shape-chip"></span></span>`)
              + vsep + opt('Radius', num('ps-shape-radius','8',46)),
  pen:    () => `<span class="dcs-badge dcs-badge--soft">Click to place anchor points · demo path preview</span>`,
  zoom:   () => `<div class="dcs-btn-group"><button class="dcs-btn dcs-btn--sm" id="ps-zoom-in"><i class="di di-zoom-in"></i></button><button class="dcs-btn dcs-btn--sm" id="ps-zoom-out"><i class="di di-zoom-out"></i></button></div>`
              + vsep + `<button class="dcs-btn dcs-btn--ghost dcs-btn--sm" id="ps-zoom-100">100%</button>`
              + `<button class="dcs-btn dcs-btn--ghost dcs-btn--sm" id="ps-zoom-fit">Fit Screen</button>`,
  hand:   () => `<span class="dcs-badge dcs-badge--soft">Drag the document to pan · scroll to pan · Space + drag anytime</span>`,
};

/* ----- menubar menus ----------------------------------------------------- */
const mi = (val,label,short,icon,extra='') =>
  `<div class="dcs-menu__item${extra}" data-dcs-value="${val}">${icon?`<span class="dcs-menu__icon"><i class="di di-${icon}"></i></span>`:'<span class="dcs-menu__icon"></span>'}<span class="dcs-menu__label">${label}</span>${short?`<span class="dcs-menu__shortcut">${short}</span>`:''}</div>`;
const msep = '<div class="dcs-menu__sep"></div>';

PS.MENUS = {
  'm-file': [ mi('new','New…','⌘N','file'), mi('open','Open Sample…','⌘O','folder-open'), mi('place','Place Embedded…','','import'), msep,
    mi('save','Save','⌘S','save'), mi('export','Export As…','⇧⌘E','export'), msep, mi('close','Close','⌘W','close') ],
  'm-edit': [ mi('undo','Undo','⌘Z','undo'), mi('redo','Redo','⇧⌘Z','redo'), msep,
    mi('cut','Cut','⌘X','cut'), mi('copy','Copy','⌘C','copy'), mi('paste','Paste','⌘V','paste'), msep,
    mi('fill','Fill with Foreground','⌥⌫','fill'), mi('stroke','Stroke…','','edit'), mi('transform','Free Transform','⌘T','scale-corners') ],
  'm-image': [ mi('bc','Brightness / Contrast…','','light'), mi('hsl','Hue / Saturation…','⌘U','color-grade'),
    mi('levels','Levels…','⌘L','graph'), mi('invert','Invert','⌘I','mirror'), mi('desat','Desaturate','⇧⌘U','mono'), msep,
    mi('size','Image Size…','⌥⌘I','aspect'), mi('canvas','Canvas Size…','⌥⌘C','fit'), mi('flatten','Flatten Image','','layers') ],
  'm-layer': [ mi('lnew','New Layer','⇧⌘N','plus'), mi('ldup','Duplicate Layer','⌘J','duplicate'), mi('ldel','Delete Layer','','trash'), msep,
    mi('lgroup','Group Layers','⌘G','folder'), mi('lmask','Add Layer Mask','','layer-mask'), msep,
    mi('lup','Bring Forward','⌘]','chevron-up'), mi('ldown','Send Backward','⌘[','chevron-down'), mi('lmerge','Merge Down','⌘E','compress') ],
  'm-select': [ mi('sall','All','⌘A','marquee'), mi('sdesel','Deselect','⌘D','close'), mi('sinv','Inverse','⇧⌘I','mirror'), msep,
    mi('sfeather','Feather…','⇧F6','blur'), mi('sgrow','Grow','','plus') ],
  'm-filter': [ mi('fblur','Gaussian Blur…','','blur'), mi('fsharp','Sharpen','','sharpen'), mi('fnoise','Add Noise…','','wave-noise'),
    mi('fpix','Pixelate','','grid'), msep, mi('femboss','Emboss','','extrude'), mi('ffind','Find Edges','','cross-target') ],
  'm-view': [ mi('vin','Zoom In','⌘+','zoom-in'), mi('vout','Zoom Out','⌘-','zoom-out'), mi('vfit','Fit on Screen','⌘0','fit'),
    mi('v100','100%','⌘1','cross-target'), msep, mi('vrulers','Rulers','⌘R','aspect',' dcs-menu__item--checked'),
    mi('vgrid','Show Grid','⌘\'','grid'), mi('vsnap','Snap','','magnet',' dcs-menu__item--checked') ],
  'm-window': [ mi('wlayers','Layers','F7','layers',' dcs-menu__item--checked'), mi('wcolor','Color','F6','palette',' dcs-menu__item--checked'),
    mi('whistory','History','','history-brush'), mi('wadjust','Adjustments','','color-grade'), msep,
    mi('wreset','Reset Workspace','','grid') ],
  'm-help': [ mi('habout','About Decius PhotoEditor','','info'), mi('hframework','About decius.css','','decius'), mi('hkeys','Keyboard Shortcuts','','keys') ],
};

/* swatch palette */
PS.SWATCHES = [
  '#000000','#404040','#7f7f7f','#bcbcbc','#ffffff','#ff2d2d','#ff7a2d','#ffd02d','#7bd92d','#2dd4bf',
  '#2d8cff','#4d9fff','#6a5cff','#b48cff','#ff7ab8','#7a3b12','#c0894a','#e9cfa0','#1f3b6e','#0e2233',
  '#e7e9ee','#aab0bd','#767c8a','#3c424f','#181b22','#5b1a1a','#1a5b2e','#1a3a5b','#5b491a','#3a1a5b'
];

/* adjustment buttons in the Adjustments panel (icon, label, action key) */
PS.ADJUSTMENTS = [
  ['light','Brightness/Contrast','bc'], ['color-grade','Hue/Saturation','hsl'], ['graph','Levels','levels'],
  ['curve','Curves','curves'], ['mono','Black & White','desat'], ['palette','Color Balance','balance'],
  ['mirror','Invert','invert'], ['eq','Channel Mixer','mixer'], ['droplet','Photo Filter','photo'],
  ['wave-sine','Vibrance','vibrance'], ['filter-lp','Threshold','threshold'], ['gain','Exposure','exposure'],
];
