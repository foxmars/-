// Visual-only entrance effects. Coordinates are relative to each fighter's feet.
function drawEntranceEffect(ctx, fighter, age, role) {
  if (age < 0 || age >= 180) return;
  const id = fighter.character;
  const t = Math.min(1, age / 72);
  const fade = Math.min(1, age / 18) * Math.min(1, (180 - age) / 42);
  const pulse = Math.sin(age * .16);
  const color = role.color;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = color;
  ctx.fillStyle = role.light;
  ctx.lineCap = 'round';
  const ring = (x, y, rx, ry, rotation = 0, width = 3) => {
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
    ctx.stroke();
  };
  const line = (x1, y1, x2, y2, width = 3) => {
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  const dot = (x, y, r = 3) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  const polygon = (points, width = 3) => {
    ctx.lineWidth = width;
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    ctx.stroke();
  };
  const orbit = (count, radius, draw) => {
    for (let n = 0; n < count; n++) {
      const a = age * .07 + n * Math.PI * 2 / count;
      draw(Math.cos(a) * radius, -9 + Math.sin(a) * radius * .7, n);
    }
  };
  switch (id) {
    case 'pulse':
      for (let n = 0; n < 3; n++) ring(0, 0, 21 + n * 17 + t * 10, 8 + n * 5, 0, 3 - n * .5);
      for (let n = 0; n < 4; n++) line(0, -8, Math.cos(n * Math.PI / 2) * (32 + t * 18), -8 + Math.sin(n * Math.PI / 2) * (32 + t * 18), 2);
      break;
    case 'nova':
      orbit(5, 43, (x, y) => dot(x, y, 3));
      for (let n = 0; n < 5; n++) { const a = n * Math.PI * 2 / 5 - Math.PI / 2; line(0, -12, Math.cos(a) * 48, -12 + Math.sin(a) * 48, 2); }
      break;
    case 'titan':
      polygon([[-49, 22], [-32, 8], [-12, 15], [0, 1], [18, 15], [38, 8], [53, 22]], 5);
      line(-62, 25, 62, 25, 4);
      for (let n = -1; n <= 1; n++) dot(n * 32, 16 - Math.abs(n) * 7, 3);
      break;
    case 'ember':
      for (let n = -2; n <= 2; n++) {
        const x = n * 15, rise = (age * (1.1 + (n + 2) * .17)) % 64;
        line(x, 22 - rise, x + 7 * Math.sin(age * .08 + n), 8 - rise, 3);
        dot(x + 7 * Math.sin(age * .08 + n), 8 - rise, 3);
      }
      ring(0, 17, 35 + pulse * 3, 9);
      break;
    case 'volt':
      for (let n = -1; n <= 1; n++) polygon([[n * 28 - 8, -65], [n * 28 + 6, -38], [n * 28 - 2, -38], [n * 28 + 12, -12]], 3);
      ring(0, 17, 35, 8);
      break;
    case 'frost':
      for (let n = 0; n < 6; n++) { const a = n * Math.PI / 3 + age * .008; const x = Math.cos(a) * 45, y = -8 + Math.sin(a) * 45; line(0, -8, x, y, 2); line(x - 5, y - 5, x + 5, y + 5, 2); }
      break;
    case 'shade':
      ctx.globalAlpha *= .55;
      for (let n = 0; n < 3; n++) { const x = (n - 1) * 24; ring(x, -8, 18, 31, -.25); }
      ctx.globalAlpha = fade;
      polygon([[-45, 21], [-17, 4], [0, 20], [21, 2], [47, 21]], 2);
      break;
    case 'terra':
      for (let n = -2; n <= 2; n++) polygon([[n * 22 - 9, 23], [n * 22 - 5, 8 - Math.abs(n) * 4], [n * 22 + 6, 2 - Math.abs(n) * 4], [n * 22 + 12, 23]], 2.5);
      break;
    case 'magnet':
      ring(0, -5, 45, 36, age * .018);
      for (let n = 0; n < 2; n++) { const s = n ? 1 : -1; line(s * 52, -38, s * 32, -18, 4); dot(s * 52, -38, 5); }
      break;
    case 'gale':
      for (let n = 0; n < 3; n++) { const y = -42 + n * 24; ctx.beginPath(); ctx.lineWidth = 3; ctx.arc(0, y, 25 + n * 13, -.9 + age * .025, 1.6 + age * .025); ctx.stroke(); }
      break;
    case 'drake':
      polygon([[-9, -6], [-62, -55], [-45, 5], [-16, 15]], 3);
      polygon([[9, -6], [62, -55], [45, 5], [16, 15]], 3);
      for (let n = -1; n <= 1; n++) dot(n * 19, -45 - Math.sin(age * .1 + n) * 8, 3);
      break;
    case 'monk':
      ring(0, -9, 48, 48, 0, 2);
      ring(0, -9, 33, 33, 0, 2);
      for (let n = 0; n < 4; n++) { const a = n * Math.PI / 2 + age * .013; dot(Math.cos(a) * 40, -9 + Math.sin(a) * 40, 3); }
      break;
    case 'rivet':
      orbit(3, 43, (x, y) => polygon([[x - 5, y - 4], [x + 5, y - 4], [x + 8, y + 4], [x - 8, y + 4]], 2));
      line(-44, 24, 44, 24, 3);
      break;
    case 'bramble':
      for (let n = -1; n <= 1; n++) { const x = n * 30; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 25); ctx.quadraticCurveTo(x - 15, -10, x + 8, -38 - Math.sin(age * .12 + n) * 5); ctx.stroke(); dot(x + 8, -38 - Math.sin(age * .12 + n) * 5, 4); }
      break;
    case 'tide':
      for (let n = 0; n < 3; n++) { const y = 12 - n * 16; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-55, y); ctx.bezierCurveTo(-25, y - 23, -5, y + 22, 22, y); ctx.quadraticCurveTo(42, y - 14, 56, y); ctx.stroke(); }
      break;
    case 'echo':
      for (let n = 0; n < 4; n++) { const x = -42 + n * 27; line(x, 13, x, -27 - n % 2 * 16, 2); dot(x - 6, 14, 5); }
      ring(0, -10, 53 + pulse * 3, 42, 0, 2);
      break;
    case 'prism':
      polygon([[0, -70], [50, 10], [-50, 10]], 3);
      line(-57, -34, 56, -34, 2);
      for (let n = 0; n < 3; n++) line(0, -9, (n - 1) * 48, 27, 2);
      break;
    case 'comet':
      for (let n = 0; n < 3; n++) line(-fighter.dir * (32 + n * 14), -48 + n * 14, fighter.dir * 22, -12 + n * 14, 4 - n);
      polygon([[fighter.dir * 36, -25], [fighter.dir * 56, -9], [fighter.dir * 30, 3]], 2);
      break;
    case 'sand':
      for (let n = 0; n < 12; n++) { const a = n * .9 + age * .035, r = 24 + n * 2; dot(Math.cos(a) * r, 12 - n * 5 + Math.sin(a) * 8, 2 + n % 3); }
      ring(0, 18, 48 + pulse * 3, 10);
      break;
    default:
      ring(0, 0, 36 + pulse * 3, 13);
  }
  if (age > 28 && age < 150) {
    ctx.globalAlpha = fade * Math.min(1, (age - 28) / 15) * Math.min(1, (150 - age) / 25);
    ctx.font = 'bold 15px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = role.light;
    ctx.fillText(role.name, 0, -89);
  }
  ctx.restore();
}

// Travel from beyond the stage edge to the fighter's actual spawn point.
function entranceOffset(fighter, age) {
  const progress = Math.min(1, Math.max(0, age / 90));
  const ease = 1 - (1 - progress) ** 3;
  const remaining = 1 - ease;
  const direction = fighter.dir;
  const distance = direction > 0 ? fighter.spawnX + 110 : 1310 - fighter.spawnX;
  const x = -direction * distance * remaining;
  const arc = Math.sin(progress * Math.PI);
  const bob = Math.sin(progress * Math.PI * 7) * remaining;
  const step = Math.sin(age * .48) * Math.min(1, age / 12) * Math.min(1, (90 - age) / 22);
  switch (fighter.character) {
    case 'tide': return {x: x * (1 - .12 * arc), y: 34 * remaining - 47 * arc + 8 * bob, scale: .75 + .25 * ease, rotation: .13 * bob, stretch: 1 + .16 * arc};
    case 'pulse': return {x: -direction * distance * (1 - Math.min(1, progress * 1.48)) ** 2, y: -9 * arc + step * 3, scale: 1, rotation: -.11 * direction * remaining, stretch: 1 + .18 * Math.abs(step)};
    case 'echo': return {x: x * (1 + .08 * Math.sin(progress * Math.PI * 5)), y: -22 * Math.sin(progress * Math.PI * 5) * remaining, scale: .72 + .28 * ease, rotation: .12 * Math.sin(progress * Math.PI * 5) * remaining, stretch: 1 + .22 * Math.abs(Math.sin(age * .29)) * remaining};
    case 'prism': {const flash = Math.abs(Math.sin(progress * Math.PI * 3)); const hop = Math.min(1, progress * 1.06); return {x: -direction * distance * (1 - hop) ** 1.5, y: -35 * remaining - 56 * flash, scale: .35 + .65 * (1 - flash), rotation: Math.PI * 2 * progress, stretch: 1 + .35 * flash};}
    case 'comet': return {x: -direction * distance * remaining ** 1.6, y: -170 * arc - 35 * remaining, scale: .7 + .3 * ease, rotation: -.42 * direction * remaining, stretch: 1 + .2 * arc};
    case 'nova': return {x: direction * 135 * remaining, y: -390 * remaining ** 1.6, scale: .42 + .58 * ease, rotation: direction * Math.PI * 2 * remaining, stretch: 1 + .2 * remaining};
    case 'drake': return {x, y: -210 * remaining - 72 * arc + 8 * bob, scale: .88 + .12 * ease, rotation: -.22 * direction * remaining, stretch: 1 + .16 * arc};
    case 'gale': return {x: x + direction * 30 * arc, y: -90 * arc + 19 * bob, scale: .85 + .15 * ease, rotation: .23 * bob, stretch: 1 + .15 * arc};
    case 'volt': {const strike = Math.min(1, Math.max(0, (progress - .4) / .13)); return {x: progress < .4 ? -direction * distance : 0, y: progress < .4 ? -240 : -240 * (1 - strike), scale: progress < .4 ? .01 : .7 + .3 * strike, rotation: 0, stretch: progress < .53 ? 1.6 : 1};}
    case 'frost': return {x: x * (1 - .12 * arc), y: -95 * remaining - 38 * arc + 16 * Math.sin(progress * Math.PI * 6) * remaining, scale: .5 + .5 * ease, rotation: Math.PI * 1.5 * remaining, stretch: .8 + .2 * ease};
    case 'shade': return {x: x * (1 - .08 * arc), y: 30 * remaining - 22 * arc, scale: .48 + .52 * ease, rotation: -.22 * direction * remaining, stretch: .5 + .5 * ease};
    case 'sand': return {x: x * (1 - .25 * arc), y: -42 * arc + 14 * bob, scale: .35 + .65 * ease, rotation: Math.PI * 3 * remaining, stretch: .75 + .25 * ease};
    case 'magnet': {const pull = Math.min(1, Math.max(0, (progress - .25) / .6)); return {x: -direction * distance * (1 - pull) ** 3, y: -52 * Math.sin(pull * Math.PI), scale: .65 + .35 * pull, rotation: .22 * bob, stretch: 1 + .1 * arc};}
    case 'titan': {const tunnel = Math.min(1, progress / .57); const emerge = Math.min(1, Math.max(0, (progress - .57) / .25)); return {x: -direction * distance * (1 - tunnel), y: progress < .57 ? 78 : 78 * (1 - emerge), scale: .7 + .3 * emerge, rotation: 0, stretch: progress < .57 ? .68 : .68 + .32 * emerge};}
    case 'terra': return {x: x * (1 - .05 * arc), y: -115 * Math.sin(progress * Math.PI) - 26 * remaining, scale: .72 + .28 * ease, rotation: -direction * Math.PI * 2 * remaining, stretch: 1};
    case 'monk': return {x: x * (1 - .18 * arc), y: -140 * Math.sin(progress * Math.PI), scale: .8 + .2 * ease, rotation: direction * Math.PI * 2 * remaining, stretch: 1};
    case 'ember': return {x: x * (1 - .2 * arc), y: 25 * remaining - 70 * arc, scale: .55 + .45 * ease, rotation: .16 * bob, stretch: 1 + .28 * arc};
    case 'rivet': {
      // Vanish outside the arena and reappear at the spawn pad; never slide across it.
      const jump = Math.min(1, Math.max(0, (progress - .34) / .09));
      const arrival = Math.min(1, Math.max(0, (progress - .43) / .22));
      const warp = jump * jump * (3 - 2 * jump);
      return {x: -direction * distance * (1 - warp), y: -22 * Math.sin(arrival * Math.PI), scale: progress < .34 ? 1 : progress < .43 ? Math.max(.03, 1 - jump) : .03 + .97 * arrival, rotation: .08 * Math.sin(age * .6) * (1 - arrival), stretch: progress < .43 ? 1.4 : 1 + .6 * (1 - arrival)};
    }
    case 'bramble': return {x: x * (1 - .14 * arc), y: 40 * remaining - 62 * arc, scale: .55 + .45 * ease, rotation: .2 * Math.sin(progress * Math.PI * 3) * remaining, stretch: .7 + .3 * ease};
    default: return {x, y: -20 * arc, scale: 1, rotation: 0};
  }
}

// Draw the path at the fighter's real feet before applying the travelling pose.
function drawEntranceTravel(ctx, fighter, age, role) {
  if (age < 0 || age >= 90) return;
  const here = entranceOffset(fighter, age);
  const previous = entranceOffset(fighter, Math.max(0, age - 4));
  const p = age / 90;
  const dir = fighter.dir;
  const x = here.x, y = here.y;
  const alpha = Math.min(1, age / 12) * Math.min(1, (90 - age) / 17);
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.strokeStyle = role.color;
  ctx.fillStyle = role.light;
  ctx.shadowColor = role.color;
  ctx.shadowBlur = 10;
  if (fighter.character === 'rivet') {
    // The arrival gate is fixed at the spawn point while the fighter teleports into it.
    const gate = Math.min(1, Math.max(0, (p - .31) / .1)) * Math.min(1, Math.max(0, (1 - p) / .2));
    ctx.globalAlpha = gate * .85;
    ctx.lineWidth = 4;
    ctx.beginPath();ctx.ellipse(0, -13, 27 + 5 * Math.sin(age * .35), 49, 0, 0, Math.PI * 2);ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();ctx.ellipse(0, -13, 17, 39, 0, 0, Math.PI * 2);ctx.stroke();
    for (let n = 0; n < 6; n++) {
      const a = age * .16 + n * Math.PI / 3;
      ctx.beginPath();ctx.arc(Math.cos(a) * 35, -13 + Math.sin(a) * 51, 2 + n % 2, 0, Math.PI * 2);ctx.fill();
    }
    if (p > .57) {
      const land = (p - .57) / .43;
      ctx.globalAlpha = gate * (1 - land);
      ctx.lineWidth = 5;
      ctx.beginPath();ctx.ellipse(0, 20, 18 + land * 75, 5 + land * 17, 0, 0, Math.PI * 2);ctx.stroke();
    }
    ctx.restore();
    return;
  }
  // A lightning strike arrives vertically; its effect is anchored at the target.
  if (fighter.character === 'volt') {
    drawEntranceArrival(ctx, fighter, age, role, alpha);
    ctx.restore();
    return;
  }
  // Only the aerial entries leave a continuous trail. Other characters carry
  // their own marks so their movement does not read as the same slide.
  if (['comet', 'drake', 'tide', 'gale'].includes(fighter.character)) {
    for (let n = 0; n < 3; n++) {
      const trail = entranceOffset(fighter, Math.max(0, age - 7 - n * 7));
      ctx.globalAlpha = alpha * (.42 - n * .1);
      ctx.lineWidth = 5 - n;
      ctx.beginPath();
      ctx.moveTo(trail.x, trail.y - 11 + n * 12);
      ctx.quadraticCurveTo(previous.x, previous.y - 15 + n * 12, x - dir * 12, y - 13 + n * 12);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = alpha * .8;
  switch (fighter.character) {
    case 'tide':
      for (let n = 0; n < 4; n++) {
        const dx = -dir * (12 + n * 17), dy = Math.sin(age * .17 + n) * 9;
        ctx.beginPath();ctx.ellipse(x + dx, y + dy + 5, 10 + n * 2, 3, -.15 * dir, 0, Math.PI * 2);ctx.stroke();
      }
      ctx.lineWidth = 4;ctx.beginPath();ctx.moveTo(x - dir * 70, y + 20);ctx.bezierCurveTo(x - dir * 40, y - 32, x - dir * 15, y + 22, x + dir * 22, y + 12);ctx.stroke();
      break;
    case 'gale':
      for (let n = 0; n < 3; n++) {const tx=x-dir*(20+n*23),ty=y+8+n*9;ctx.lineWidth=3;ctx.beginPath();ctx.arc(tx,ty,15+n*4,-1.4+age*.06,1.6+age*.06);ctx.stroke();}
      break;
    case 'comet':
      ctx.lineWidth = 8;ctx.beginPath();ctx.moveTo(x - dir * 86, y - 48);ctx.quadraticCurveTo(x - dir * 42, y - 20, x - dir * 9, y - 5);ctx.stroke();
      for (let n = 0; n < 4; n++) {ctx.beginPath();ctx.arc(x - dir * (24 + n * 22), y - 31 + n * 6, 2 + n % 2, 0, Math.PI * 2);ctx.fill();}
      break;
    case 'nova':
      ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x,y-145);ctx.lineTo(x,y-32);ctx.stroke();
      for (let n=0;n<5;n++) {const a=n*Math.PI*2/5+age*.07;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y-12);ctx.lineTo(x+Math.cos(a)*(32+n*4),y-12+Math.sin(a)*(32+n*4));ctx.stroke();}
      if(p>.65){const burst=(p-.65)/.35;ctx.globalAlpha=alpha*(1-burst);ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,20,20+burst*85,6+burst*16,0,0,Math.PI*2);ctx.stroke();}
      break;
    case 'drake':
      // Two wingtip flame trails follow the airborne path and flare on landing.
      for (let wing = -1; wing <= 1; wing += 2) {
        ctx.globalAlpha = alpha * .72;
        ctx.lineWidth = 7;
        ctx.beginPath();ctx.moveTo(x - dir * 93, y - 28 + wing * 25);ctx.quadraticCurveTo(x - dir * 43, y - 15 + wing * 27, x - dir * 8, y - 12 + wing * 17);ctx.stroke();
        ctx.globalAlpha = alpha * .9;
        for (let n = 0; n < 4; n++) {ctx.beginPath();ctx.arc(x - dir * (20 + n * 18), y - 17 + wing * 20 + Math.sin(age * .19 + n) * 5, 2 + n % 3, 0, Math.PI * 2);ctx.fill();}
      }
      break;
    case 'volt':
      for (let n = 0; n < 3; n++) {const tx = x - dir * (20 + n * 22);ctx.lineWidth = 3;ctx.beginPath();ctx.moveTo(tx, y - 36);ctx.lineTo(tx + dir * 9, y - 18);ctx.lineTo(tx - dir * 4, y - 16);ctx.lineTo(tx + dir * 8, y + 3);ctx.stroke();}
      break;
    case 'titan':
      ctx.lineWidth = 4;for (let n = 0; n < 3; n++) {ctx.beginPath();ctx.moveTo(x - dir * (18 + n * 20), y + 19);ctx.lineTo(x - dir * (29 + n * 20), y + 9 - n * 3);ctx.stroke();}
      for (let n=0;n<4;n++) {ctx.beginPath();ctx.moveTo(x+(n-2)*18,y+20);ctx.lineTo(x+(n-2)*24,y+34+age%8);ctx.stroke();}
      break;
    case 'terra':
      for (let n=0;n<4;n++) {const tx=x-dir*(n*22);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(tx-9,y+24);ctx.lineTo(tx-3,y+7-n%2*9);ctx.lineTo(tx+7,y+24);ctx.stroke();}
      break;
    case 'shade':
      for (let n = 0; n < 3; n++) {ctx.globalAlpha = alpha * (.28 - n * .06);ctx.beginPath();ctx.ellipse(x - dir * (19 + n * 23), y - 9, 16 - n * 3, 25 - n * 5, age * .04, 0, Math.PI * 2);ctx.stroke();}
      break;
    case 'prism':
      for (let n=0;n<3;n++) {const tx=x-dir*(18+n*24);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(tx-11,y-25);ctx.lineTo(tx+10,y-38);ctx.lineTo(tx+16,y-8);ctx.lineTo(tx-11,y-25);ctx.stroke();}
      break;
    case 'ember':
      for (let n = 0; n < 6; n++) {const dx = x - dir * (12 + n * 13), dy = y + 13 - (age * (n % 2 + 1) % 27);ctx.beginPath();ctx.arc(dx, dy, 2 + n % 3, 0, Math.PI * 2);ctx.fill();}
      break;
    case 'sand':
      for (let n=0;n<10;n++) {const a=n*2.4+age*.17,r=11+n*4;ctx.beginPath();ctx.arc(x-dir*(18+n*8)+Math.cos(a)*r,y+Math.sin(a)*r,2+n%3,0,Math.PI*2);ctx.fill();}
      break;
    case 'frost':
      for (let n=0;n<5;n++) {const tx=x-dir*(15+n*18),ty=y-12+(n%2)*13;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tx-7,ty);ctx.lineTo(tx+7,ty);ctx.moveTo(tx,ty-7);ctx.lineTo(tx,ty+7);ctx.stroke();}
      break;
    case 'magnet':
      for (let n=0;n<3;n++) {const tx=x-dir*(23+n*25);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(tx,y-11,17+n*4,10+n*3,age*.06,0,Math.PI*2);ctx.stroke();}
      break;
    case 'monk':
      ctx.lineWidth=2;for (let n=0;n<3;n++) {ctx.beginPath();ctx.ellipse(x-dir*(22+n*25),y+10,14+n*4,4,0,0,Math.PI*2);ctx.stroke();}
      break;
    case 'bramble':
      for (let n=0;n<4;n++) {const tx=x-dir*(16+n*23);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(tx,y+24);ctx.quadraticCurveTo(tx-dir*13,y-8,tx+dir*5,y-25);ctx.stroke();}
      break;
    case 'pulse':
      for (let n=0;n<3;n++) {const tx=x-dir*(18+n*23);ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(tx,y+18,10+n*5,3+n,0,0,Math.PI*2);ctx.stroke();}
      break;
    case 'echo':
      for (let n=0;n<3;n++) {const tx=x-dir*(20+n*25);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(tx,y-10,12+n*5,22+n*4,0,0,Math.PI*2);ctx.stroke();}
      break;
    default:
      for (let n = 0; n < 4; n++) {ctx.beginPath();ctx.arc(x - dir * (16 + n * 17), y + 14 - n * 3, 2 + n % 2, 0, Math.PI * 2);ctx.fill();}
  }
  // A ground shock belongs to physical landings, not every entrance.
  if (p > .77 && ['pulse', 'comet', 'drake', 'terra', 'monk', 'titan'].includes(fighter.character)) {
    const land = (p - .77) / .23;
    ctx.globalAlpha = alpha * (1 - land) * .8;
    ctx.lineWidth = 4;
    ctx.beginPath();ctx.ellipse(0, 19, 15 + land * 66, 5 + land * 11, 0, 0, Math.PI * 2);ctx.stroke();
  }
  ctx.restore();
}

function drawEntranceArrival(ctx, fighter, age, role, alpha) {
  const p = age / 90;
  const intensity = alpha * Math.min(1, (1 - p) / .12);
  ctx.globalAlpha = intensity;
  const ring = (x, y, rx, ry, width = 3) => {
    ctx.lineWidth = width;
    ctx.beginPath();ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);ctx.stroke();
  };
  const line = (x1, y1, x2, y2, width = 3) => {
    ctx.lineWidth = width;
    ctx.beginPath();ctx.moveTo(x1, y1);ctx.lineTo(x2, y2);ctx.stroke();
  };
  const dot = (x, y, radius) => {
    ctx.beginPath();ctx.arc(x, y, radius, 0, Math.PI * 2);ctx.fill();
  };
  switch (fighter.character) {
    case 'echo':
      for (let n = 0; n < 4; n++) ring(0, -12, 12 + n * 18 + age * .35, 24 + n * 12, 3 - n * .4);
      for (let n = 0; n < 5; n++) line(-38 + n * 19, 16, -38 + n * 19, -15 - (n % 2) * 17, 2);
      break;
    case 'prism':
      for (let n = 0; n < 3; n++) {
        const r = 24 + n * 17 + Math.sin(age * .14 + n) * 4;
        line(0, -12 - r, -r, -12 + r, 3);
        line(-r, -12 + r, r, -12 + r, 3);
        line(r, -12 + r, 0, -12 - r, 3);
      }
      line(-72, -54, 65, 15, 4);
      break;
    case 'volt':
      for (let n = -1; n <= 1; n++) {
        const x = n * 30;
        line(x - 15, -160, x + 9, -96, 4);
        line(x + 9, -96, x - 5, -96, 4);
        line(x - 5, -96, x + 12, -18, 4);
      }
      ring(0, 19, 18 + Math.max(0, p - .5) * 110, 6 + Math.max(0, p - .5) * 22, 5);
      break;
    case 'frost':
      for (let n = 0; n < 8; n++) {
        const a = n * Math.PI / 4 + age * .015;
        const r = 52 - Math.max(0, p - .34) * 45;
        const x = Math.cos(a) * r, y = -12 + Math.sin(a) * r;
        line(x - 7, y, x + 7, y, 2);
        line(x, y - 7, x, y + 7, 2);
      }
      ring(0, 19, 35 + Math.sin(age * .1) * 5, 8, 3);
      break;
    case 'shade':
      for (let n = 0; n < 5; n++) {
        const x = (n - 2) * 22 + Math.sin(age * .09 + n) * 8;
        ring(x, -9, 12 + n % 2 * 4, 29 + n % 3 * 6, 2);
      }
      ring(0, 19, 42, 7, 3);
      break;
    case 'sand':
      for (let n = 0; n < 22; n++) {
        const a = n * 2.4 + age * .15;
        const r = 9 + n * 2.2 * (1 - p * .6);
        dot(Math.cos(a) * r, -8 + Math.sin(a) * r * .75, 2 + n % 3);
      }
      ring(0, 20, 41, 9, 3);
      break;
    case 'titan':
      for (let n = -2; n <= 2; n++) {
        const x = n * 17;
        line(x, 20, x + n * 9, 35 + Math.abs(n) * 6, 4);
        dot(x + n * 10, 18 - Math.max(0, p - .45) * 34, 3 + Math.abs(n));
      }
      ring(0, 22, 23 + Math.max(0, p - .45) * 130, 7 + Math.max(0, p - .45) * 22, 5);
      break;
    case 'terra':
      for (let n = -2; n <= 2; n++) {
        const x = n * 21;
        line(x - 9, 22, x - 4, 4 - Math.abs(n) * 7, 3);
        line(x - 4, 4 - Math.abs(n) * 7, x + 8, 22, 3);
      }
      ring(0, 19, 32 + Math.max(0, p - .33) * 55, 8, 3);
      break;
    case 'monk':
      ring(0, -13, 48, 48, 2);
      ring(0, -13, 32, 32, 2);
      for (let n = 0; n < 6; n++) {
        const a = n * Math.PI / 3 + age * .05;
        dot(Math.cos(a) * 41, -13 + Math.sin(a) * 41, 3);
      }
      break;
    case 'ember':
      for (let n = -2; n <= 2; n++) {
        const x = n * 18;
        line(x, 22, x + Math.sin(age * .15 + n) * 8, -30 - (n % 2) * 16, 4);
        dot(x + Math.sin(age * .15 + n) * 8, -30 - (n % 2) * 16, 4);
      }
      ring(0, 20, 36 + Math.sin(age * .18) * 6, 8, 4);
      break;
    case 'bramble':
      for (let n = -2; n <= 2; n++) {
        const x = n * 20;
        ctx.lineWidth = 3;ctx.beginPath();ctx.moveTo(x, 23);
        ctx.quadraticCurveTo(x - 17, -4, x + Math.sin(age * .1 + n) * 10, -37 - n % 2 * 11);ctx.stroke();
        dot(x + Math.sin(age * .1 + n) * 10, -37 - n % 2 * 11, 3);
      }
      break;
  }
}
