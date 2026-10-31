'use strict';

// Silhouette pieces sit behind the body. The final pass adds readable costume details.
const costumePalette = {
  pulse:['#8ceeff','#19485d','circuit'], nova:['#b9d5ff','#344b91','star'],
  titan:['#d4c2ff','#55466e','plate'], ember:['#ffc890','#8c3842','flame'],
  volt:['#fff19a','#806d25','bolt'], frost:['#c9f8ff','#397b9b','crystal'],
  shade:['#ddb0ff','#4a2c68','veil'], terra:['#c9f5c8','#486d4a','stone'],
  magnet:['#a9fff0','#266c68','coil'], gale:['#d9f4ff','#5287a5','feather'],
  drake:['#ffd29a','#965345','scale'], monk:['#f6dbac','#836340','wrap'],
  rivet:['#b8eeff','#4a728b','bolt'], bramble:['#d8ffad','#5d8145','leaf'],
  tide:['#bbf3ff','#327fa9','wave'], echo:['#f5c9ff','#7b5194','note'],
  prism:['#ffe0fa','#975a99','facet'], comet:['#ffe5ac','#a66c3f','trail'],
  sand:['#f4dbb4','#977451','dune']
};

function drawCostumePolish(ctx, id, d) {
  const [light, dark, motif] = costumePalette[id] || costumePalette.pulse;
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // Shaded armor edges make the shared sprite read as a body rather than a flat block.
  ctx.fillStyle = '#07132170';
  ctx.beginPath(); ctx.roundRect(-16,-23,5,43,3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(11,-23,5,43,3); ctx.fill();
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.moveTo(-15,10); ctx.lineTo(15,10); ctx.lineTo(12,18); ctx.lineTo(-12,18); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = light; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-13,12); ctx.lineTo(13,12); ctx.stroke();
  ctx.fillStyle = light;
  ctx.fillRect(-3,12,6,5);
  // Vary shoulder mass and cuts by role, so silhouettes survive at game scale.
  if (['titan','terra','rivet','magnet'].includes(id)) {
    for (const s of [-1,1]) {
      ctx.fillStyle = dark; ctx.strokeStyle = light; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(s*14,-21); ctx.lineTo(s*23,-18); ctx.lineTo(s*21,-9); ctx.lineTo(s*15,-7); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle=light; ctx.fillRect(s<0?-20:17,-15,3,3);
    }
  } else if (['gale','shade','frost','tide','bramble'].includes(id)) {
    ctx.strokeStyle=light; ctx.lineWidth=2;
    for (const s of [-1,1]) { ctx.beginPath(); ctx.moveTo(s*14,-20); ctx.quadraticCurveTo(s*22,-11,s*14,-3); ctx.stroke(); }
  } else {
    ctx.strokeStyle=light; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(-14,-19); ctx.lineTo(-10,-16); ctx.moveTo(14,-19); ctx.lineTo(10,-16); ctx.stroke();
  }
  ctx.strokeStyle=light; ctx.lineWidth=1.7;
  ctx.beginPath(); ctx.moveTo(-11,20); ctx.lineTo(-9,25); ctx.moveTo(11,20); ctx.lineTo(9,25); ctx.stroke();
  // Distinct waist and chest details complement each character's existing insignia.
  switch(motif) {
    case 'circuit': ctx.strokeRect(-11,-4,6,6);ctx.strokeRect(5,-4,6,6);ctx.fillRect(-1,6,2,5);break;
    case 'star': case 'facet': ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(4,-4);ctx.lineTo(0,1);ctx.lineTo(-4,-4);ctx.closePath();ctx.stroke();break;
    case 'plate': ctx.strokeRect(-11,-8,22,19);ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(0,11);ctx.stroke();break;
    case 'flame': ctx.beginPath();ctx.moveTo(-9,9);ctx.quadraticCurveTo(-12,3,-6,-4);ctx.moveTo(9,9);ctx.quadraticCurveTo(12,3,6,-4);ctx.stroke();break;
    case 'bolt': ctx.beginPath();ctx.moveTo(-10,-5);ctx.lineTo(-6,-1);ctx.lineTo(-9,4);ctx.moveTo(10,-5);ctx.lineTo(6,-1);ctx.lineTo(9,4);ctx.stroke();break;
    case 'crystal': ctx.beginPath();ctx.moveTo(-11,0);ctx.lineTo(-6,-5);ctx.lineTo(-2,0);ctx.moveTo(11,0);ctx.lineTo(6,-5);ctx.lineTo(2,0);ctx.stroke();break;
    case 'veil': ctx.beginPath();ctx.moveTo(-11,6);ctx.quadraticCurveTo(0,13,11,6);ctx.stroke();break;
    case 'stone': ctx.beginPath();ctx.moveTo(-10,-6);ctx.lineTo(-6,-2);ctx.lineTo(-9,3);ctx.moveTo(10,-6);ctx.lineTo(6,-2);ctx.lineTo(9,3);ctx.stroke();break;
    case 'coil': ctx.beginPath();ctx.arc(0,3,11,.1,Math.PI-.1);ctx.stroke();break;
    case 'feather': ctx.beginPath();ctx.moveTo(-11,4);ctx.quadraticCurveTo(0,14,11,4);ctx.stroke();break;
    case 'scale': for(const x of [-8,0,8]){ctx.beginPath();ctx.arc(x,7,3,Math.PI,0);ctx.stroke();}break;
    case 'wrap': ctx.beginPath();ctx.moveTo(-13,-3);ctx.lineTo(10,8);ctx.moveTo(-10,8);ctx.lineTo(13,-3);ctx.stroke();break;
    case 'leaf': ctx.beginPath();ctx.ellipse(0,3,10,4,-.5,0,Math.PI*2);ctx.stroke();break;
    case 'wave': ctx.beginPath();ctx.moveTo(-12,5);ctx.quadraticCurveTo(-6,-2,0,5);ctx.quadraticCurveTo(6,12,12,5);ctx.stroke();break;
    case 'note': ctx.beginPath();ctx.moveTo(-10,8);ctx.lineTo(-10,-1);ctx.lineTo(0,-4);ctx.lineTo(0,5);ctx.stroke();break;
    case 'trail': ctx.beginPath();ctx.moveTo(-11,7);ctx.lineTo(4,-4);ctx.moveTo(-5,9);ctx.lineTo(10,-2);ctx.stroke();break;
    case 'dune': ctx.beginPath();ctx.moveTo(-12,7);ctx.quadraticCurveTo(0,-1,12,7);ctx.stroke();break;
  }
  ctx.restore();
}

// The fighter's main shape is drawn separately from the equipment. This keeps
// the readable hit-box size while giving each combat style a different outline.
function drawCharacterBody(ctx, p, traits) {
  const id=p.character, color=traits.color, light=traits.light;
  const builds={titan:[27,22],terra:[24,19],rivet:[22,16],magnet:[21,15],sand:[20,18],
    shade:[12,9],gale:[13,9],nova:[14,10],comet:[15,10],monk:[13,11],
    pulse:[18,12],ember:[18,13],volt:[16,11],frost:[17,12],drake:[19,13],
    bramble:[19,12],tide:[17,12],echo:[15,11],prism:[16,11]};
  const [shoulder,waist]=builds[id]||[17,13];
  const armored=['titan','terra','rivet','magnet','sand'].includes(id);
  ctx.save(); ctx.lineJoin='round'; ctx.lineCap='round';
  ctx.shadowColor=color; ctx.shadowBlur=8;
  const armor=ctx.createLinearGradient(-18,-22,19,24);
  armor.addColorStop(0,light); armor.addColorStop(.27,color); armor.addColorStop(1,costumePalette[id]?.[1]||'#17324a');
  ctx.fillStyle=armor; ctx.strokeStyle='#dcefff'; ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(-shoulder,-15); ctx.lineTo(-waist,-20); ctx.lineTo(waist,-20);
  ctx.lineTo(shoulder,-15); ctx.lineTo(armored?shoulder-3:waist+2,3);
  ctx.lineTo(waist,20); ctx.lineTo(-waist,20);
  ctx.lineTo(armored?-shoulder+3:-waist-2,3);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.shadowBlur=0;
  // The head is a different silhouette for each fighting style.
  const headShapes={pulse:[12,-34],nova:[9,-40],titan:[16,-35],ember:[11,-32],volt:[9,-38],
    frost:[11,-39],shade:[12,-35],terra:[15,-32],magnet:[13,-33],gale:[9,-32],
    drake:[12,-35],monk:[13,-30],rivet:[14,-34],bramble:[10,-36],tide:[11,-33],
    echo:[11,-32],prism:[10,-37],comet:[9,-34],sand:[15,-31]};
  const [jaw,crown]=headShapes[id]||[11,-33];
  ctx.fillStyle='#102238'; ctx.strokeStyle=light; ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(-jaw,-25);ctx.lineTo(-jaw+(id==='titan'?1:4),crown);
  ctx.lineTo(jaw-(id==='titan'?1:4),crown);ctx.lineTo(jaw,-25);
  ctx.lineTo(jaw-1,-11);ctx.lineTo(6,-6);ctx.lineTo(-6,-6);ctx.lineTo(-jaw+1,-11);
  ctx.closePath();ctx.fill();ctx.stroke();
  // Large, readable headgear replaces the tiny shared helmet decorations.
  ctx.fillStyle=costumePalette[id]?.[1]||color;
  ctx.strokeStyle=light;ctx.lineWidth=1.7;
  ctx.beginPath();
  if(['nova','prism','frost','bramble'].includes(id)){
    ctx.moveTo(-9,crown+5);ctx.lineTo(0,crown-10);ctx.lineTo(9,crown+5);
  }else if(['ember','drake','volt'].includes(id)){
    ctx.moveTo(-jaw,crown+6);ctx.lineTo(-jaw-5,crown-9);ctx.lineTo(-2,crown+1);
    ctx.lineTo(2,crown+1);ctx.lineTo(jaw+5,crown-9);ctx.lineTo(jaw,crown+6);
  }else if(['shade','monk','sand'].includes(id)){
    ctx.moveTo(-jaw-4,crown+6);ctx.quadraticCurveTo(0,crown-11,jaw+4,crown+6);
    ctx.lineTo(jaw+1,crown+12);ctx.lineTo(-jaw-1,crown+12);
  }else if(['titan','terra','rivet','magnet'].includes(id)){
    ctx.moveTo(-jaw-4,crown+2);ctx.lineTo(-jaw-4,crown+11);
    ctx.lineTo(jaw+4,crown+11);ctx.lineTo(jaw+4,crown+2);
  }else{
    ctx.moveTo(-jaw,crown+3);ctx.lineTo(0,crown-5);ctx.lineTo(jaw,crown+3);
  }
  ctx.closePath();ctx.fill();ctx.stroke();
  // A contrasting face window stays visible even when the team marker is above it.
  ctx.fillStyle='#071321';ctx.strokeStyle=light;ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(-jaw+2,-23,jaw*2-4,11,3);ctx.fill();ctx.stroke();
  ctx.fillStyle=light; ctx.shadowColor=light; ctx.shadowBlur=5;
  ctx.beginPath();
  if(id==='shade'||id==='monk'){ctx.moveTo(-8,-18);ctx.lineTo(8,-18);ctx.lineTo(4,-15);ctx.lineTo(-4,-15);}
  else if(armored){ctx.moveTo(-9,-20);ctx.lineTo(9,-20);ctx.lineTo(9,-16);ctx.lineTo(-9,-16);}
  else if(['volt','prism','frost'].includes(id)){ctx.moveTo(-8,-21);ctx.lineTo(0,-16);ctx.lineTo(8,-21);ctx.lineTo(5,-15);ctx.lineTo(-5,-15);}
  else {ctx.moveTo(p.dir>0?-8:-7,-20);ctx.lineTo(p.dir>0?9:8,-20);ctx.lineTo(p.dir>0?5:4,-15);ctx.lineTo(p.dir>0?-8:-7,-15);}
  ctx.closePath();ctx.fill(); ctx.shadowBlur=0;
  ctx.strokeStyle=light;ctx.lineWidth=1.7;
  if(armored){ctx.strokeRect(-waist+3,-12,(waist-3)*2,17);}
  else if(['shade','gale','monk','tide'].includes(id)){ctx.beginPath();ctx.moveTo(-waist,-5);ctx.quadraticCurveTo(0,7,waist,-5);ctx.stroke();}
  else {ctx.beginPath();ctx.moveTo(-waist+2,-8);ctx.lineTo(0,2);ctx.lineTo(waist-2,-8);ctx.stroke();}
  ctx.fillStyle='#08142666';
  ctx.beginPath();ctx.moveTo(-waist,20);ctx.lineTo(waist,20);ctx.lineTo(waist-2,24);ctx.lineTo(-waist+2,24);ctx.closePath();ctx.fill();
  ctx.strokeStyle=light;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-waist+2,17);ctx.lineTo(waist-2,17);ctx.stroke();
  ctx.restore();
}

function drawCharacterLegs(ctx,p,traits) {
  const heavy=['titan','terra','rivet','magnet','sand'].includes(p.character);
  const width=heavy?10:7, offset=heavy?12:10;
  ctx.save();ctx.lineJoin='round';ctx.fillStyle='#122238';ctx.strokeStyle=traits.light;ctx.lineWidth=1.5;
  for(const side of [-1,1]) {
    const x=side*offset-width/2;
    ctx.beginPath();ctx.moveTo(x,17);ctx.lineTo(x+width,17);ctx.lineTo(x+width+side*2,27);
    ctx.lineTo(x-side*2,27);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=traits.color;ctx.fillRect(x+1,21,width-2,3);ctx.fillStyle='#122238';
  }
  ctx.restore();
}
function drawCharacterCostume(ctx, p, front = false) {
  const d = p.dir || 1, id = p.character;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (!front) {
    ctx.fillStyle = '#142338';
    ctx.strokeStyle = '#e4f3ff';
    ctx.lineWidth = 2;
    const poly = points => { ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); ctx.fill(); ctx.stroke(); };
    switch (id) {
      case 'pulse':
        ctx.fillStyle = '#1e506a'; poly([[-13,-22],[-8,-34],[0,-29],[8,-34],[13,-22]]);
        ctx.fillStyle = '#258eaa'; poly([[-26,-6],[-17,-15],[-15,13],[-27,9]]); poly([[26,-6],[17,-15],[15,13],[27,9]]); break;
      case 'nova':
        ctx.fillStyle = '#253c72'; poly([[-11,-23],[-18,-35],[0,-29],[18,-35],[11,-23]]);
        ctx.fillStyle = '#94c8ff'; poly([[0,-42],[-7,-27],[0,-19],[7,-27]]);
        poly([[-17,-10],[-31,-2],[-18,2]]); poly([[17,-10],[31,-2],[18,2]]); break;
      case 'titan':
        ctx.fillStyle = '#423b65'; poly([[-17,-23],[-30,-18],[-35,-4],[-18,1]]); poly([[17,-23],[30,-18],[35,-4],[18,1]]);
        ctx.fillStyle = '#715e91'; poly([[-16,-25],[-12,-35],[12,-35],[16,-25]]); break;
      case 'ember':
        ctx.fillStyle = '#70323e'; poly([[-14,-22],[-20,-39],[-4,-27]]); poly([[14,-22],[20,-39],[4,-27]]);
        ctx.fillStyle = '#e87644'; poly([[-18,-12],[-28,-4],[-20,13],[-13,4]]);poly([[18,-12],[28,-4],[20,13],[13,4]]);break;
      case 'volt':
        ctx.fillStyle = '#6e6228'; poly([[-15,-22],[-21,-31],[-17,-37],[-4,-28]]); poly([[15,-22],[21,-31],[17,-37],[4,-28]]); break;
      case 'frost':
        ctx.fillStyle = '#45758f'; poly([[-13,-22],[-16,-34],[-5,-28],[0,-38],[5,-28],[16,-34],[13,-22]]); break;
      case 'shade':
        ctx.fillStyle = '#30213e'; poly([[-17,-20],[-21,-29],[-4,-38],[4,-38],[21,-29],[17,-20]]);
        poly([[-17,-12],[-27,11],[-13,24],[-5,13]]);poly([[17,-12],[27,11],[13,24],[5,13]]);break;
      case 'terra':
        ctx.fillStyle = '#395644'; poly([[-17,-20],[-29,-27],[-34,-8],[-18,5]]); poly([[17,-20],[29,-27],[34,-8],[18,5]]); break;
      case 'magnet':
        ctx.fillStyle = '#245b59'; poly([[-16,-21],[-25,-28],[-29,-13],[-17,-5]]); poly([[16,-21],[25,-28],[29,-13],[17,-5]]); break;
      case 'gale':
        ctx.fillStyle = '#456481'; poly([[-13,-22],[-21,-28],[-11,-33],[5,-29],[19,-35],[14,-23]]); break;
      case 'drake':
        ctx.fillStyle = '#74402f'; poly([[-13,-22],[-19,-39],[-6,-29]]); poly([[13,-22],[19,-39],[6,-29]]);
        ctx.fillStyle='#b75c36';poly([[-15,-10],[-34,-21],[-28,1],[-16,11]]);poly([[15,-10],[34,-21],[28,1],[16,11]]);break;
      case 'monk':
        ctx.fillStyle = '#81634b'; ctx.beginPath(); ctx.arc(0,-31,8,0,Math.PI*2); ctx.fill(); ctx.stroke(); break;
      case 'rivet':
        ctx.fillStyle = '#425a6b'; poly([[-15,-23],[-22,-29],[-24,-12],[-17,-10]]); poly([[15,-23],[22,-29],[24,-12],[17,-10]]); break;
      case 'bramble':
        ctx.fillStyle = '#3b6140'; poly([[-14,-22],[-26,-30],[-20,-18]]); poly([[14,-22],[26,-30],[20,-18]]); poly([[-5,-26],[0,-38],[5,-26]]); break;
      case 'tide':
        ctx.fillStyle = '#215b87'; poly([[-16,-23],[-23,-31],[-10,-30],[0,-38],[11,-28],[22,-31],[16,-23]]); break;
      case 'echo':
        ctx.fillStyle = '#60467b'; for (const x of [-23,23]) { ctx.beginPath(); ctx.arc(x,-10,11,0,Math.PI*2); ctx.fill(); ctx.stroke(); } break;
      case 'prism':
        ctx.fillStyle = '#6b456d'; poly([[-13,-22],[-8,-35],[0,-29],[8,-35],[13,-22]]); break;
      case 'comet':
        ctx.fillStyle = '#80512e'; poly([[-12,-22],[-21,-35],[-1,-29],[16,-39],[13,-22]]);
        ctx.fillStyle='#e7a356';poly([[-16,5],[-34,17],[-14,15]]);poly([[16,5],[34,17],[14,15]]);break;
      case 'sand':
        ctx.fillStyle = '#705841'; poly([[-17,-23],[-19,-34],[18,-34],[19,-23]]);
        ctx.fillStyle = '#9b7c56'; poly([[-19,10],[-28,17],[-18,28],[-11,15]]); break;
    }
    // Bold equipment shapes carry each identity at the game's normal camera scale.
    const accent=costumePalette[id]?.[0]||'#ffffff';
    ctx.strokeStyle=accent;ctx.lineWidth=2.5;ctx.fillStyle=accent+'66';
    switch(id){
      case 'pulse': poly([[-31,-17],[-40,-9],[-33,0],[-26,-4]]);poly([[31,-17],[40,-9],[33,0],[26,-4]]);break;
      case 'nova': poly([[-24,-24],[-39,-17],[-27,-8],[-20,-13]]);poly([[24,-24],[39,-17],[27,-8],[20,-13]]);break;
      case 'titan': poly([[-27,-7],[-43,-9],[-43,10],[-28,13]]);poly([[27,-7],[43,-9],[43,10],[28,13]]);break;
      case 'ember': poly([[-26,-20],[-35,-34],[-32,-8],[-24,4]]);poly([[26,-20],[35,-34],[32,-8],[24,4]]);break;
      case 'volt': poly([[-18,-32],[-30,-40],[-25,-26],[-34,-17]]);poly([[18,-32],[30,-40],[25,-26],[34,-17]]);break;
      case 'frost': poly([[-24,-20],[-33,-30],[-31,-10],[-25,0]]);poly([[24,-20],[33,-30],[31,-10],[25,0]]);break;
      case 'shade': poly([[-19,8],[-31,28],[-16,23],[-7,11]]);poly([[19,8],[31,28],[16,23],[7,11]]);break;
      case 'terra': poly([[-30,-23],[-42,-19],[-40,0],[-31,4]]);poly([[30,-23],[42,-19],[40,0],[31,4]]);break;
      case 'magnet': ctx.beginPath();ctx.arc(0,-13,39,Math.PI*1.06,Math.PI*1.94);ctx.stroke();break;
      case 'gale': poly([[-22,-16],[-39,-27],[-32,-10],[-21,4]]);poly([[22,-16],[39,-27],[32,-10],[21,4]]);break;
      case 'drake': poly([[-26,-19],[-43,-29],[-37,-8],[-25,7]]);poly([[26,-19],[43,-29],[37,-8],[25,7]]);break;
      case 'monk': ctx.beginPath();ctx.ellipse(0,-15,34,37,0,Math.PI*1.12,Math.PI*1.88);ctx.stroke();break;
      case 'rivet': poly([[-25,-20],[-40,-27],[-38,-8],[-27,-7]]);poly([[25,-20],[40,-27],[38,-8],[27,-7]]);break;
      case 'bramble': poly([[-21,-17],[-39,-22],[-30,-7],[-21,0]]);poly([[21,-17],[39,-22],[30,-7],[21,0]]);break;
      case 'tide': poly([[-23,-11],[-39,-5],[-36,13],[-22,5]]);poly([[23,-11],[39,-5],[36,13],[22,5]]);break;
      case 'echo': for(const x of [-29,29]){ctx.beginPath();ctx.arc(x,-10,15,0,Math.PI*2);ctx.stroke();}break;
      case 'prism': poly([[-23,-18],[-39,-9],[-27,3],[-18,-5]]);poly([[23,-18],[39,-9],[27,3],[18,-5]]);break;
      case 'comet': poly([[-25,2],[-44,13],[-31,14],[-19,7]]);break;
      case 'sand': poly([[-23,-5],[-41,2],[-30,24],[-19,15]]);break;
    }
  } else {
    ctx.lineWidth = 2;
    switch (id) {
      case 'pulse': ctx.fillStyle='#e8ffff'; ctx.fillRect(-4,-2,8,8); ctx.fillStyle='#133b59'; ctx.fillRect(-2,0,4,4); break;
      case 'nova': ctx.fillStyle='#e9f5ff'; ctx.beginPath(); ctx.moveTo(0,-7); ctx.lineTo(6,2); ctx.lineTo(0,11); ctx.lineTo(-6,2); ctx.fill(); break;
      case 'titan': ctx.fillStyle='#332747'; ctx.fillRect(-12,-2,24,13); ctx.strokeStyle='#ddccff'; ctx.strokeRect(-12,-2,24,13); break;
      case 'ember': ctx.fillStyle='#ffcf86'; for(const x of [-7,0,7]){ctx.beginPath();ctx.arc(x,3,3,0,Math.PI*2);ctx.fill();} break;
      case 'volt': ctx.strokeStyle='#fff39b'; ctx.beginPath(); ctx.moveTo(-4,-8);ctx.lineTo(3,-1);ctx.lineTo(-3,4);ctx.lineTo(5,10);ctx.stroke();break;
      case 'frost': ctx.strokeStyle='#e7faff'; ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(0,10);ctx.moveTo(-8,1);ctx.lineTo(8,1);ctx.stroke();break;
      case 'shade': ctx.fillStyle='#b581d2'; ctx.fillRect(-9,0,18,4); break;
      case 'terra': ctx.fillStyle='#a5dfae'; ctx.fillRect(-7,-2,14,10); ctx.fillStyle='#42634a';ctx.fillRect(-4,1,8,4);break;
      case 'magnet': ctx.strokeStyle='#9df3df';ctx.beginPath();ctx.arc(0,2,7,.35,Math.PI*1.65);ctx.stroke();break;
      case 'gale': ctx.strokeStyle='#e0f3ff';ctx.beginPath();ctx.moveTo(-8,5);ctx.quadraticCurveTo(2,-7,10,3);ctx.stroke();break;
      case 'drake': ctx.fillStyle='#ffe0a5';ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(7,5);ctx.lineTo(-7,5);ctx.fill();break;
      case 'monk':ctx.fillStyle='#efc880';ctx.fillRect(-15,8,30,5);ctx.fillStyle='#39291d';ctx.fillRect(d>0?3:-8,7,5,7);break;
      case 'rivet':ctx.fillStyle='#bcecff';ctx.fillRect(-11,-14,22,4);ctx.fillStyle='#243b53';ctx.fillRect(-8,-13,16,2);break;
      case 'bramble':ctx.strokeStyle='#ddffb9';ctx.beginPath();ctx.moveTo(-7,9);ctx.quadraticCurveTo(0,-4,7,9);ctx.stroke();break;
      case 'tide':ctx.strokeStyle='#c7eeff';ctx.beginPath();ctx.moveTo(-10,4);ctx.quadraticCurveTo(-4,-3,1,4);ctx.quadraticCurveTo(6,11,11,4);ctx.stroke();break;
      case 'echo':ctx.fillStyle='#f0d2ff';ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.fillText('♫',0,10);break;
      case 'prism':ctx.fillStyle='#ffd8f2';ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(9,2);ctx.lineTo(0,12);ctx.lineTo(-9,2);ctx.fill();break;
      case 'comet':ctx.fillStyle='#ffe2a8';ctx.beginPath();ctx.arc(-3,1,6,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffdf9b';ctx.beginPath();ctx.moveTo(3,2);ctx.lineTo(12,8);ctx.stroke();break;
      case 'sand':ctx.fillStyle='#c9a47b';ctx.fillRect(-14,-1,28,11);ctx.strokeStyle='#f5d7a8';ctx.beginPath();ctx.moveTo(-10,3);ctx.lineTo(10,3);ctx.stroke();break;
    }
  }
  ctx.restore();
}

function drawMirrorIdentifier(ctx, p, roster) {
  const home = p.team === 0;
  const accent = home ? '#8cf8ff' : '#ff9ed0';
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.fillStyle = home ? '#123f58' : '#5e2446';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 29, 25, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-15, -70, 30, 18, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(home ? 'P1' : 'P2', 0, -61);
  ctx.restore();
}
