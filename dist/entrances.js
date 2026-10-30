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
    case 'tide': return {x, y: -32 * arc + 8 * bob, scale: 1, rotation: .07 * bob, stretch: 1 + .08 * arc};
    case 'pulse': return {x, y: -9 * arc + step * 3, scale: 1, rotation: -.07 * direction * remaining, stretch: 1 + .1 * Math.abs(step)};
    case 'echo': return {x, y: -36 * Math.abs(Math.sin(progress * Math.PI * 3)) * remaining, scale: 1, rotation: .09 * bob, stretch: 1 + .08 * Math.sin(age * .31)};
    case 'prism': return {x, y: -28 * arc, scale: .4 + .6 * ease, rotation: Math.PI * 2 * remaining, stretch: 1};
    case 'comet': return {x, y: -160 * arc - 25 * remaining, scale: .72 + .28 * ease, rotation: -.36 * direction * remaining, stretch: 1 + .16 * arc};
    case 'nova': return {x, y: -120 * arc, scale: .7 + .3 * ease, rotation: -.2 * direction * remaining, stretch: 1 + .08 * arc};
    case 'drake': return {x, y: -105 * arc + 12 * bob, scale: 1, rotation: -.16 * direction * remaining, stretch: 1 + .12 * arc};
    case 'gale': return {x, y: -66 * arc + 16 * bob, scale: 1, rotation: .16 * bob, stretch: 1 + .1 * arc};
    case 'volt': return {x, y: -25 * arc, scale: progress < .54 ? .72 : 1, rotation: .08 * bob, stretch: progress < .54 ? 1.25 : 1};
    case 'frost': return {x, y: -18 * arc, scale: .65 + .35 * ease, rotation: 0, stretch: 1};
    case 'shade': return {x, y: -12 * arc, scale: .45 + .55 * ease, rotation: 0, stretch: 1};
    case 'sand': return {x, y: 12 * bob, scale: .75 + .25 * ease, rotation: .14 * bob, stretch: 1};
    case 'magnet': return {x, y: -42 * arc, scale: 1, rotation: .1 * bob, stretch: 1 + .06 * arc};
    case 'titan': return {x, y: -86 * arc, scale: 1.16 - .16 * ease, rotation: 0, stretch: 1 - .1 * arc};
    case 'terra': return {x, y: -70 * arc, scale: 1.1 - .1 * ease, rotation: 0, stretch: 1 - .08 * arc};
    case 'monk': return {x, y: -28 * arc, scale: 1, rotation: .08 * bob, stretch: 1};
    case 'ember': return {x, y: -34 * arc, scale: 1, rotation: .08 * bob, stretch: 1 + .08 * arc};
    case 'rivet': return {x, y: -15 * arc + 6 * bob + step * 2, scale: 1, rotation: -.04 * direction * remaining, stretch: 1 + .05 * Math.abs(step)};
    case 'bramble': return {x, y: -23 * arc + step * 2, scale: 1, rotation: .04 * bob, stretch: 1};
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
    case 'tide': case 'gale':
      for (let n = 0; n < 4; n++) {
        const dx = -dir * (12 + n * 17), dy = Math.sin(age * .17 + n) * 9;
        ctx.beginPath();ctx.ellipse(x + dx, y + dy + 5, 10 + n * 2, 3, -.15 * dir, 0, Math.PI * 2);ctx.stroke();
      }
      break;
    case 'comet': case 'nova': case 'drake':
      ctx.lineWidth = 8;ctx.beginPath();ctx.moveTo(x - dir * 86, y - 48);ctx.quadraticCurveTo(x - dir * 42, y - 20, x - dir * 9, y - 5);ctx.stroke();
      for (let n = 0; n < 4; n++) {ctx.beginPath();ctx.arc(x - dir * (24 + n * 22), y - 31 + n * 6, 2 + n % 2, 0, Math.PI * 2);ctx.fill();}
      break;
    case 'volt':
      for (let n = 0; n < 3; n++) {const tx = x - dir * (20 + n * 22);ctx.lineWidth = 3;ctx.beginPath();ctx.moveTo(tx, y - 36);ctx.lineTo(tx + dir * 9, y - 18);ctx.lineTo(tx - dir * 4, y - 16);ctx.lineTo(tx + dir * 8, y + 3);ctx.stroke();}
      break;
    case 'titan': case 'terra':
      ctx.lineWidth = 4;for (let n = 0; n < 3; n++) {ctx.beginPath();ctx.moveTo(x - dir * (18 + n * 20), y + 19);ctx.lineTo(x - dir * (29 + n * 20), y + 9 - n * 3);ctx.stroke();}
      break;
    case 'shade': case 'prism':
      for (let n = 0; n < 3; n++) {ctx.globalAlpha = alpha * (.28 - n * .06);ctx.beginPath();ctx.ellipse(x - dir * (19 + n * 23), y - 9, 16 - n * 3, 25 - n * 5, age * .04, 0, Math.PI * 2);ctx.stroke();}
      break;
    case 'ember': case 'sand':
      for (let n = 0; n < 6; n++) {const dx = x - dir * (12 + n * 13), dy = y + 13 - (age * (n % 2 + 1) % 27);ctx.beginPath();ctx.arc(dx, dy, 2 + n % 3, 0, Math.PI * 2);ctx.fill();}
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
