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
  switch (fighter.character) {
    case 'tide': return {x, y: -32 * arc + 8 * bob, scale: 1, rotation: .07 * bob};
    case 'pulse': return {x, y: -9 * arc, scale: 1, rotation: -.04 * direction * remaining};
    case 'echo': return {x, y: -36 * Math.abs(Math.sin(progress * Math.PI * 3)) * remaining, scale: 1, rotation: .09 * bob};
    case 'prism': return {x, y: -28 * arc, scale: .4 + .6 * ease, rotation: Math.PI * 2 * remaining};
    case 'comet': return {x, y: -160 * arc - 25 * remaining, scale: .72 + .28 * ease, rotation: -.28 * direction * remaining};
    case 'nova': return {x, y: -120 * arc, scale: .7 + .3 * ease, rotation: -.18 * direction * remaining};
    case 'drake': return {x, y: -105 * arc + 12 * bob, scale: 1, rotation: -.14 * direction * remaining};
    case 'gale': return {x, y: -66 * arc + 16 * bob, scale: 1, rotation: .16 * bob};
    case 'volt': return {x, y: -25 * arc, scale: progress < .54 ? .72 : 1, rotation: .08 * bob};
    case 'frost': return {x, y: -18 * arc, scale: .65 + .35 * ease, rotation: 0};
    case 'shade': return {x, y: -12 * arc, scale: .45 + .55 * ease, rotation: 0};
    case 'sand': return {x, y: 12 * bob, scale: .75 + .25 * ease, rotation: .14 * bob};
    case 'magnet': return {x, y: -42 * arc, scale: 1, rotation: .1 * bob};
    case 'titan': return {x, y: -86 * arc, scale: 1.16 - .16 * ease, rotation: 0};
    case 'terra': return {x, y: -70 * arc, scale: 1.1 - .1 * ease, rotation: 0};
    case 'monk': return {x, y: -28 * arc, scale: 1, rotation: .08 * bob};
    case 'ember': return {x, y: -34 * arc, scale: 1, rotation: .08 * bob};
    case 'rivet': return {x, y: -15 * arc + 6 * bob, scale: 1, rotation: -.04 * direction * remaining};
    case 'bramble': return {x, y: -23 * arc, scale: 1, rotation: .04 * bob};
    default: return {x, y: -20 * arc, scale: 1, rotation: 0};
  }
}
