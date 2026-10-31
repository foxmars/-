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
    case 'echo': return {x, y: -44 * Math.abs(Math.sin(progress * Math.PI * 3)) * remaining, scale: .78 + .22 * ease, rotation: .13 * bob, stretch: 1 + .15 * Math.sin(age * .31)};
    case 'prism': return {x: -direction * distance * remaining * (progress < .48 ? 1 : .55), y: -68 * arc, scale: .25 + .75 * ease, rotation: Math.PI * 2 * remaining, stretch: 1};
    case 'comet': return {x: -direction * distance * remaining ** 1.6, y: -170 * arc - 35 * remaining, scale: .7 + .3 * ease, rotation: -.42 * direction * remaining, stretch: 1 + .2 * arc};
    case 'nova': return {x: x * (1 - .2 * arc), y: -140 * arc - 28 * remaining, scale: .5 + .5 * ease, rotation: -.28 * direction * remaining, stretch: 1 + .14 * arc};
    case 'drake': return {x, y: -210 * remaining - 72 * arc + 8 * bob, scale: .88 + .12 * ease, rotation: -.22 * direction * remaining, stretch: 1 + .16 * arc};
    case 'gale': return {x: x + direction * 30 * arc, y: -90 * arc + 19 * bob, scale: .85 + .15 * ease, rotation: .23 * bob, stretch: 1 + .15 * arc};
    case 'volt': {const flash = progress < .38 ? .3 : progress < .46 ? .82 : 1; return {x: -direction * distance * (1 - flash * ease), y: -35 * arc, scale: progress < .46 ? .62 : 1, rotation: .11 * bob, stretch: progress < .46 ? 1.5 : 1};}
    case 'frost': return {x, y: -10 * arc, scale: .4 + .6 * ease, rotation: 0, stretch: 1 + .08 * remaining};
    case 'shade': return {x: x * (progress < .5 ? 1 : .58), y: -17 * arc, scale: progress < .5 ? .38 : .45 + .55 * ease, rotation: -.08 * direction * remaining, stretch: 1};
    case 'sand': return {x: x + 18 * direction * bob, y: 18 * bob, scale: .45 + .55 * ease, rotation: .22 * bob, stretch: 1 + .12 * arc};
    case 'magnet': return {x: x * (1 - .15 * arc), y: -51 * arc, scale: .8 + .2 * ease, rotation: .18 * bob, stretch: 1 + .1 * arc};
    case 'titan': return {x, y: -115 * arc - 30 * remaining, scale: 1.23 - .23 * ease, rotation: 0, stretch: 1 - .13 * arc};
    case 'terra': return {x, y: -93 * arc, scale: 1.16 - .16 * ease, rotation: -.05 * direction * remaining, stretch: 1 - .12 * arc};
    case 'monk': return {x, y: -85 * arc + 7 * bob, scale: .8 + .2 * ease, rotation: .04 * bob, stretch: 1};
    case 'ember': return {x, y: -58 * arc, scale: .57 + .43 * ease, rotation: .12 * bob, stretch: 1 + .15 * arc};
    case 'rivet': {
      // Vanish outside the arena and reappear at the spawn pad; never slide across it.
      const jump = Math.min(1, Math.max(0, (progress - .34) / .09));
      const arrival = Math.min(1, Math.max(0, (progress - .43) / .22));
      const warp = jump * jump * (3 - 2 * jump);
      return {x: -direction * distance * (1 - warp), y: -22 * Math.sin(arrival * Math.PI), scale: progress < .34 ? 1 : progress < .43 ? Math.max(.03, 1 - jump) : .03 + .97 * arrival, rotation: .08 * Math.sin(age * .6) * (1 - arrival), stretch: progress < .43 ? 1.4 : 1 + .6 * (1 - arrival)};
    }
    case 'bramble': return {x, y: -38 * arc + step * 2, scale: .7 + .3 * ease, rotation: .07 * bob, stretch: 1 + .08 * arc};
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
  // Several short strokes follow the actual path, including vertical arcs.
  for (let n = 0; n < 3; n++) {
    const trail = entranceOffset(fighter, Math.max(0, age - 7 - n * 7));
    ctx.globalAlpha = alpha * (.42 - n * .1);
    ctx.lineWidth = 5 - n;
    ctx.beginPath();
    ctx.moveTo(trail.x, trail.y - 11 + n * 12);
    ctx.quadraticCurveTo(previous.x, previous.y - 15 + n * 12, x - dir * 12, y - 13 + n * 12);
    ctx.stroke();
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
      for (let n = 0; n < 5; n++) {const a=n*Math.PI*2/5+age*.04;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-12);ctx.lineTo(x+Math.cos(a)*(23+n*5),y-12+Math.sin(a)*(23+n*5));ctx.stroke();}
      ctx.beginPath();ctx.arc(x,y-12,23+9*Math.sin(age*.13),0,Math.PI*2);ctx.stroke();
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
  // The last few frames settle into a crisp ring instead of ending abruptly.
  if (p > .77) {
    const land = (p - .77) / .23;
    ctx.globalAlpha = alpha * (1 - land) * .8;
    ctx.lineWidth = 4;
    ctx.beginPath();ctx.ellipse(0, 19, 15 + land * 66, 5 + land * 11, 0, 0, Math.PI * 2);ctx.stroke();
  }
  ctx.restore();
}
