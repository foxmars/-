'use strict';

function drawEchoUltimate(ctx,p,profile,tick) {
  const d=p.dir||1, length=profile.range, beatFrames=[48,36,24,12];
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  // Five moving staff lines make the attack's forward-only area readable.
  for(let row=-2;row<=2;row++) {
    const y=row*20, sway=Math.sin(tick*.18+row)*5;
    ctx.strokeStyle=row===0?'#ffe9ff':'#b779f5';
    ctx.globalAlpha=row===0?.8:.44;
    ctx.lineWidth=row===0?3.5:2;
    ctx.beginPath();ctx.moveTo(d*17,y);
    ctx.bezierCurveTo(d*length*.32,y+sway,d*length*.67,y-sway,d*length,y);
    ctx.stroke();
  }
  ctx.fillStyle='#fff0ff';ctx.font='bold 25px system-ui';ctx.textAlign='center';
  for(let n=0;n<5;n++) {
    const x=d*(45+n*52), y=(n%3-1)*19+Math.sin(tick*.13+n)*5;
    ctx.globalAlpha=.45+.2*Math.sin(tick*.17+n);
    ctx.fillText(n%2?'♫':'♪',x,y+8);
  }
  for(let n=0;n<beatFrames.length;n++) {
    const elapsed=beatFrames[n]-p.attack;
    if(elapsed<0||elapsed>9)continue;
    const progress=elapsed/9, x=d*(25+progress*(length-25)), final=n===3;
    ctx.globalAlpha=(1-progress)*(final?.95:.72);
    ctx.strokeStyle=final?'#fff1a4':'#f1c4ff';
    ctx.lineWidth=final?10:6;
    ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=23;
    ctx.beginPath();ctx.moveTo(x,-73);ctx.bezierCurveTo(x-d*24,-38,x+d*22,38,x,73);ctx.stroke();
    ctx.shadowBlur=0;
    ctx.lineWidth=2.5;
    for(const side of [-1,1]) {
      ctx.beginPath();ctx.arc(x,side*44,9+progress*15,0,Math.PI*2);ctx.stroke();
    }
  }
  ctx.restore();
}
