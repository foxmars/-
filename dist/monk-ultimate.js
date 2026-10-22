'use strict';

function drawMonkUltimate(ctx,p,profile,tick) {
  const d=p.dir||1, release=Math.max(0,Math.min(1,(36-p.attack)/15));
  ctx.save();ctx.globalCompositeOperation='lighter';
  ctx.strokeStyle='#ffe6a2';ctx.fillStyle='#f7d390';
  ctx.lineCap='round';ctx.lineJoin='round';
  const charge=p.attack>36?1-Math.min(1,(p.attack-36)/24):1;
  for(let n=0;n<3;n++){
    ctx.globalAlpha=(.2+n*.12)*charge;ctx.lineWidth=2+n;
    ctx.beginPath();ctx.arc(0,-3,23+n*12,-Math.PI*.35,Math.PI*1.35);ctx.stroke();
  }
  if(p.attack>36){
    ctx.globalAlpha=.55*charge;ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(-d*17,-24);ctx.quadraticCurveTo(d*6,-34,d*26,-7);ctx.stroke();
  }else{
    const x=d*(52+release*153), scale=.7+release*.85;
    ctx.translate(x,-7);ctx.scale(d*scale,scale);
    ctx.shadowColor='#ffe19c';ctx.shadowBlur=24;
    ctx.globalAlpha=p.attack<12?Math.max(0,p.attack/12):.88;
    ctx.fillStyle='#a97436bb';ctx.strokeStyle='#fff0bd';ctx.lineWidth=4;
    ctx.beginPath();
    ctx.moveTo(-31,35);ctx.lineTo(-27,-15);
    ctx.bezierCurveTo(-28,-31,-20,-35,-13,-18);
    ctx.lineTo(-14,-52);ctx.quadraticCurveTo(-12,-65,-3,-61);
    ctx.lineTo(1,-28);ctx.lineTo(4,-68);ctx.quadraticCurveTo(13,-74,17,-64);
    ctx.lineTo(13,-28);ctx.lineTo(24,-58);ctx.quadraticCurveTo(34,-62,35,-49);
    ctx.lineTo(24,-17);ctx.lineTo(37,-35);ctx.quadraticCurveTo(49,-38,47,-25);
    ctx.lineTo(28,29);ctx.lineTo(16,45);ctx.lineTo(-16,47);ctx.closePath();
    ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.strokeStyle='#fff8d7';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-15,8);ctx.quadraticCurveTo(4,19,25,3);ctx.stroke();
  }
  ctx.restore();
}
