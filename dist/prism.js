function drawPrismMirrors(ctx,fighters,tick){
  for(const owner of fighters){
    const mirror=owner.prismMirror;
    if(!mirror||mirror.expires<=tick||owner.lives<=0)continue;
    const glow=.78+.18*Math.sin(tick*.16),alpha=Math.min(1,(mirror.expires-tick)/25);
    ctx.save();ctx.translate(mirror.x,mirror.y);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha*glow;
    ctx.shadowColor='#ff9fe0';ctx.shadowBlur=20;ctx.fillStyle='#a64a9e99';ctx.strokeStyle='#ffe0f7';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(0,-35);ctx.lineTo(19,0);ctx.lineTo(0,35);ctx.lineTo(-19,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#fff4ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-35);ctx.lineTo(0,35);ctx.moveTo(-19,0);ctx.lineTo(19,0);ctx.stroke();
    for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*19,0);ctx.lineTo(side*36,-15);ctx.moveTo(side*19,0);ctx.lineTo(side*36,15);ctx.stroke();}
    ctx.restore();
  }
}
function drawPrismBeam(ctx,beam){
  const a=beam.points[0],b=beam.points[1],alpha=Math.min(1,beam.life/7);
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha;
  ctx.lineCap='round';ctx.shadowColor=beam.prismUltimate?'#fff2b8':beam.prismDeploy?'#ff69c5':'#ef73d0';ctx.shadowBlur=beam.prismDeploy?28:22;
  ctx.strokeStyle=beam.prismUltimate?'#ffe1f6':beam.prismDeploy?'#ff68c8':beam.prismSplit?'#f6a0e4':'#ed88d6';ctx.lineWidth=beam.prismUltimate?22:beam.prismDeploy?24:beam.prismSplit?15:18;
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  ctx.shadowBlur=8;ctx.strokeStyle='#fff1fc';ctx.lineWidth=beam.prismDeploy?7:beam.prismSplit?4:5;ctx.stroke();
  const angle=Math.atan2(b.y-a.y,b.x-a.x);
  for(const point of [a,b]){
    ctx.save();ctx.translate(point.x,point.y);ctx.rotate(angle);
    ctx.fillStyle='#fff5ff';ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(0,-6);ctx.lineTo(-11,0);ctx.lineTo(0,6);ctx.closePath();ctx.fill();ctx.restore();
  }
  ctx.restore();
}
function drawPrismKaleidoscope(ctx,p,phase,tick){
  const center=p.prismUltimateCenter;
  if(!center)return;
  ctx.save();ctx.translate(center.x-p.x,center.y-p.y);ctx.globalCompositeOperation='lighter';
  ctx.shadowColor='#ff9ee5';ctx.shadowBlur=23;ctx.strokeStyle='#ffe3f7';ctx.fillStyle='#fff1fb';
  ctx.lineWidth=4;const radius=26+Math.min(phase*3,1)*27;
  for(let ring=0;ring<2;ring++){
    ctx.save();ctx.rotate((ring?-.045:.06)*tick);ctx.beginPath();
    for(let n=0;n<6;n++){const angle=n*Math.PI/3,x=Math.cos(angle)*(radius+ring*18),y=Math.sin(angle)*(radius+ring*18);if(n)ctx.lineTo(x,y);else ctx.moveTo(x,y);}
    ctx.closePath();ctx.stroke();ctx.restore();
  }
  for(let n=0;n<3;n++){const angle=tick*.085+n*Math.PI*2/3;ctx.save();ctx.rotate(angle);ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(43,-10);ctx.lineTo(58,0);ctx.lineTo(43,10);ctx.closePath();ctx.fill();ctx.restore();}
  ctx.restore();
}
