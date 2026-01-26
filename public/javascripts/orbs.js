(function(){
  // orbs.js - set CSS variables for orb colors/positions per page load
  const root = document.documentElement;

  // small helper: random between min and max
  function rand(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }

  // palettes by page key
  const palettes = {
    home: [ 'rgba(0,212,255,0.30)', 'rgba(123,63,242,0.30)' ],
    dashboard: [ 'rgba(255, 215, 0,0.28)', 'rgba(232, 86, 45,0.28)' ],
    forms: [ 'rgba(0,212,255,0.35)', 'rgba(123,63,242,0.35)' ]
  };

  // read requested palette from body data attribute
  const paletteKey = document.body.getAttribute('data-orb-palette') || 'home';
  const palette = palettes[paletteKey] || palettes.home;

  // choose random sizes and offsets within sensible ranges
  const size1 = rand(520, 820) + 'px';
  const size2 = rand(520, 820) + 'px';

  const top1 = rand(-320, -120) + 'px';
  const left1 = rand(-300, 60) + 'px';

  const bottom2 = rand(-320, -120) + 'px';
  const right2 = rand(-300, 60) + 'px';

  // Slightly vary opacity and colors
  const col1 = palette[0];
  const col2 = palette[1];

  // apply vars
  root.style.setProperty('--orb1-size', size1);
  root.style.setProperty('--orb2-size', size2);
  root.style.setProperty('--orb1-top', top1);
  root.style.setProperty('--orb1-left', left1);
  root.style.setProperty('--orb2-bottom', bottom2);
  root.style.setProperty('--orb2-right', right2);
  root.style.setProperty('--orb1-color', col1);
  root.style.setProperty('--orb2-color', col2);

  // To ensure orbs change position also when using client-side navigation
  // (if application later adds SPA navigation), expose a function to randomize again
  window.randomizeOrbs = function(){
    const newSize1 = rand(520, 820) + 'px';
    const newSize2 = rand(520, 820) + 'px';
    const newTop1 = rand(-320, -120) + 'px';
    const newLeft1 = rand(-300, 60) + 'px';
    const newBottom2 = rand(-320, -120) + 'px';
    const newRight2 = rand(-300, 60) + 'px';
    root.style.setProperty('--orb1-size', newSize1);
    root.style.setProperty('--orb2-size', newSize2);
    root.style.setProperty('--orb1-top', newTop1);
    root.style.setProperty('--orb1-left', newLeft1);
    root.style.setProperty('--orb2-bottom', newBottom2);
    root.style.setProperty('--orb2-right', newRight2);
  };

})();
