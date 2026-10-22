'use strict';

function drawTerraUltimate(ctx,p,tick) {
  const center=p.terraUltimateCenter;
  if(!center)return;
  const x=center.x-p.x, y=center.y-p.y;
  const beats=[46,32,18], remaining=p.attack;
  const glow=Math.max(0,1-Math.min(...beats.map(frame=>Math.abs(remaining-frame)))/9);
  ctx.save();ctx.translate(x,y);ctx.lineJoin='round';
  ctx.globalAlpha=.55+glow*.38;ctx.strokeStyle='#d5ffca';ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(0,0,82,68,0,0,Math.PI*2);ctx.stroke();
  for(const side of [-1,1]) {
    const height=remaining>46?Math.max(10,(60-remaining)*5):94;
    ctx.fillStyle=side<0?'#416953':'#548064';ctx.strokeStyle='#c9f7bd';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(side*52,58);ctx.lineTo(side*80,58);
    ctx.lineTo(side*78,-height*.55);ctx.lineTo(side*64,-height);
    ctx.lineTo(side*50,-height*.65);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#a4e8aa';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(side*63,44);ctx.lineTo(side*66,-height*.53);ctx.stroke();
  }
  ctx.fillStyle='#a4c991';ctx.strokeStyle='#efffdc';ctx.lineWidth=3;
  const drop=remaining>32?-105:remaining>18?-105+(32-remaining)*7:-7;
  ctx.beginPath();ctx.moveTo(-34,drop-22);ctx.lineTo(0,drop-43);ctx.lineTo(35,drop-22);
  ctx.lineTo(27,drop+9);ctx.lineTo(-24,drop+9);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#dcffd4';
  for(let i=0;i<6;i++){
    const a=tick*.11+i*Math.PI/3;
    ctx.beginPath();ctx.arc(Math.cos(a)*71,Math.sin(a)*51,2.5,0,Math.PI*2);ctx.fill();
  }
  if(remaining<=18){
    const spread=Math.min(1,(18-remaining)/12);
    ctx.strokeStyle='#ecffd1';ctx.lineWidth=7*(1-spread)+2;
    ctx.beginPath();ctx.ellipse(0,0,25+spread*82,17+spread*62,0,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4, r=20+spread*90;
      ctx.fillStyle=i%2?'#d2f5be':'#80bb87';ctx.beginPath();
      ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);
      ctx.lineTo(Math.cos(a+.16)*(r+15),Math.sin(a+.16)*(r+15));
      ctx.lineTo(Math.cos(a-.16)*(r+12),Math.sin(a-.16)*(r+12));
      ctx.closePath();ctx.fill();
    }
  }
  ctx.restore();
}
