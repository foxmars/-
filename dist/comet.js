let cometTrails=[];
let cometOrbs=[];
let cometSlashes=[];
let cometUltimates=[];

function cometUltimateHit(core,target,final=false){
  if(target.team===core.owner.team||target.lives<=0||target.inv>0&&(!final||!core.hits.has(target)||target.inv>10))return;
  if(target.blocking&&target.shield>0){target.shield=Math.max(0,target.shield-(final?25:12));target.stun=target.shield===0?40:7;}
  else{
    const damage=Math.max(1,Math.round((final?24:11)*(characters[core.owner.character]?.power||1)*(target.dummy?1:(roleStats[target.character]?.guard||1))));
    if(isSurvival()){target.hp=Math.max(0,target.hp-damage);target.dmg=target.maxHp-target.hp;}else target.dmg+=damage;
    target.vx=(Math.sign(target.x-core.x)||core.dir)*(final?Math.min(26,9+target.dmg*.055):13);
    target.vy=final?-Math.min(17,6+target.dmg*.03):-1;
    target.stun=Math.max(target.stun,final?36:15);
    target.inv=target.dummy?0:final?13:7;
    if(target.dummy&&$('#mode').value==='range'){rangeStats.lastDamage=damage;rangeStats.totalDamage+=damage;rangeStats.hits++;rangeStats.combo=tick-rangeStats.lastHitTick<=90?rangeStats.combo+1:1;rangeStats.lastHitTick=tick;}
    if(isSurvival()&&target.hp<=0){target.lives=0;if(!fighters.some(member=>member.team===target.team&&member.lives>0))finish(core.owner.team);}
  }
  target.hitFlash=10;impactBurst(target.x,target.y,'#ffe1a0',Math.sign(target.x-core.x)||core.dir,final);
}

function updateCometUltimates(){
  cometUltimates=cometUltimates.filter(core=>{
    if(core.owner.lives<=0)return false;
    core.age++;
    if(core.age<=core.delay)return true;
    core.y+=19;
    if(core.y>=core.impactY){
      core.y=core.impactY;
      burst(core.x,core.y,'#ffe0a0',core.finisher?38:25);
      shake=Math.max(shake,core.finisher?13:7);
      tone(core.finisher?210:330,.16);
      for(const target of fighters){
        if(Math.hypot(target.x-core.x,target.y-core.y)<(core.finisher?145:112))cometUltimateHit(core,target,core.finisher);
      }
      return false;
    }
    return true;
  });
}

function drawCometUltimates(){
  for(const core of cometUltimates){
    const warning=Math.min(1,core.age/(core.delay+11));
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.38+warning*.5;
    ctx.strokeStyle=core.finisher?'#fff1bd':'#ffbe7c';ctx.shadowColor='#ff9c54';ctx.shadowBlur=18;
    ctx.lineWidth=core.finisher?5:3;ctx.beginPath();ctx.ellipse(core.x,core.impactY,core.finisher?75:57,17,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.67;ctx.strokeStyle='#ffb76d';ctx.lineWidth=core.finisher?31:24;
    ctx.lineCap='round';ctx.beginPath();ctx.moveTo(core.x-30,core.y-120);ctx.lineTo(core.x-6,core.y-27);ctx.stroke();
    ctx.strokeStyle='#ffe4a7';ctx.lineWidth=7;ctx.stroke();ctx.restore();
    ctx.save();ctx.translate(core.x,core.y);ctx.rotate(core.age*.19);ctx.globalCompositeOperation='lighter';
    ctx.shadowColor='#ffb462';ctx.shadowBlur=29;ctx.fillStyle=core.finisher?'#fff0bd':'#ffd49a';ctx.strokeStyle='#fff5cc';ctx.lineWidth=4;
    ctx.beginPath();for(let n=0;n<9;n++){const a=n*Math.PI*2/9,r=n%2?25:core.finisher?43:35;if(n)ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff9e1';ctx.beginPath();ctx.arc(0,0,core.finisher?14:10,0,Math.PI*2);ctx.fill();ctx.restore();
  }
}

function activateCometCombo(owner,action){
  const dir=owner.dir,start={x:owner.x+dir*24,y:owner.y-8},target=nearestOpponent(owner);
  if(action==='cometFan'){
    for(const slope of [-3,0,3])cometOrbs.push({owner,x:start.x,y:start.y,vx:dir*10,vy:-6+slope,dir,spin:0,life:60,bounces:0,scale:.58});
  }else if(action==='cometCross'){
    const centerX=Math.max(85,Math.min(1115,target&&Math.abs(target.x-owner.x)<290?target.x:owner.x+dir*155)),centerY=target&&Math.abs(target.y-owner.y)<125?target.y-8:owner.y-8,hits=new Map();
    cometSlashes.push({owner,from:{x:centerX-95,y:centerY-69},to:{x:centerX+95,y:centerY+69},life:16,hits});
    cometSlashes.push({owner,from:{x:centerX-95,y:centerY+69},to:{x:centerX+95,y:centerY-69},life:16,hits});
    burst(centerX,centerY,'#ffe0a6',18);
  }else{
    const x=Math.max(45,Math.min(1155,target&&Math.abs(target.x-owner.x)<365?target.x:owner.x+dir*180)),y=Math.max(45,(target?.y??owner.y)-225);
    cometOrbs.push({owner,x,y,vx:0,vy:5,dir,spin:0,life:58,bounces:1,scale:1.85,blastScale:1.55,damageScale:1.4});
  }
  tone(620,.16);
}

function updateCometSlashes(){
  cometSlashes=cometSlashes.filter(slash=>{
    if(slash.owner.lives<=0||--slash.life<=0)return false;
    const a=slash.from,b=slash.to,dx=b.x-a.x,dy=b.y-a.y;
    for(const target of fighters){
      if(target.team===slash.owner.team||target.lives<=0||target.inv>0||slash.hits.has(target))continue;
      const t=Math.max(0,Math.min(1,((target.x-a.x)*dx+(target.y-a.y)*dy)/(dx*dx+dy*dy)));
      if(Math.hypot(target.x-a.x-t*dx,target.y-a.y-t*dy)>27)continue;
      slash.hits.set(target,tick);
      if(target.blocking&&target.shield>0){target.shield=Math.max(0,target.shield-19);target.stun=target.shield===0?35:6;}
      else{
        const damage=Math.max(1,Math.round(13*(characters[slash.owner.character]?.power||1)*(target.dummy?1:(roleStats[target.character]?.guard||1))));
        if(isSurvival()){target.hp=Math.max(0,target.hp-damage);target.dmg=target.maxHp-target.hp;}else target.dmg+=damage;
        target.vx=slash.owner.dir*4;target.vy=-3;target.stun=Math.max(target.stun,25);target.inv=target.dummy?0:12;
        if(target.dummy&&$('#mode').value==='range'){rangeStats.lastDamage=damage;rangeStats.totalDamage+=damage;rangeStats.hits++;rangeStats.combo=tick-rangeStats.lastHitTick<=90?rangeStats.combo+1:1;rangeStats.lastHitTick=tick;}
        if(isSurvival()&&target.hp<=0){target.lives=0;if(!fighters.some(member=>member.team===target.team&&member.lives>0))finish(slash.owner.team);}
      }
      target.hitFlash=9;impactBurst(target.x,target.y,'#ffe3af',slash.owner.dir,true);
    }
    return true;
  });
}

function drawCometSlashes(){
  for(const slash of cometSlashes){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,slash.life/7);
    ctx.shadowColor='#ffbd77';ctx.shadowBlur=20;ctx.strokeStyle='#ffc47f';ctx.lineWidth=20;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(slash.from.x,slash.from.y);ctx.lineTo(slash.to.x,slash.to.y);ctx.stroke();
    ctx.strokeStyle='#fff3c4';ctx.lineWidth=5;ctx.stroke();ctx.restore();
  }
}

function explodeCometOrb(orb){
  burst(orb.x,orb.y,'#ffd28a',22);
  shake=Math.max(shake,6);
  for(const target of fighters){
    if(target.team===orb.owner.team||target.lives<=0||target.inv>0||Math.hypot(target.x-orb.x,target.y-orb.y)>82*(orb.blastScale||orb.scale||1))continue;
    if(target.blocking&&target.shield>0){target.shield=Math.max(0,target.shield-23);target.stun=target.shield===0?38:7;}
    else{
      const damage=Math.max(1,Math.round(17*(orb.damageScale||orb.scale||1)*(characters[orb.owner.character]?.power||1)*(target.dummy?1:(roleStats[target.character]?.guard||1))));
      if(isSurvival()){target.hp=Math.max(0,target.hp-damage);target.dmg=target.maxHp-target.hp;}else target.dmg+=damage;
      target.vx=(Math.sign(target.x-orb.x)||orb.dir)*Math.min(23,7+target.dmg*.06);
      target.vy=-Math.min(15,5+target.dmg*.025);
      target.stun=Math.max(target.stun,32);target.inv=target.dummy?0:12;
      if(target.dummy&&$('#mode').value==='range'){rangeStats.lastDamage=damage;rangeStats.totalDamage+=damage;rangeStats.hits++;rangeStats.combo=tick-rangeStats.lastHitTick<=90?rangeStats.combo+1:1;rangeStats.lastHitTick=tick;}
      if(isSurvival()&&target.hp<=0){target.lives=0;if(!fighters.some(member=>member.team===target.team&&member.lives>0))finish(orb.owner.team);}
    }
    target.hitFlash=10;impactBurst(target.x,target.y,'#ffcc79',orb.dir,true);
  }
}

function updateCometOrbs(){
  cometOrbs=cometOrbs.filter(orb=>{
    if(orb.owner.lives<=0||--orb.life<=0)return false;
    const previousY=orb.y;
    orb.x+=orb.vx;orb.vy=Math.min(14,orb.vy+.42);orb.y+=orb.vy;orb.spin+=.18*orb.dir;
    for(const target of fighters){
      if(target.team!==orb.owner.team&&target.lives>0&&Math.hypot(target.x-orb.x,target.y-orb.y)<20+15*(orb.scale||1)){explodeCometOrb(orb);return false;}
    }
    if(orb.vy>0){
      const platform=activePlatforms().find(q=>orb.x>q.x-15&&orb.x<q.x+q.w+15&&previousY+17<=q.y+3&&orb.y+17>=q.y);
      if(platform){orb.y=platform.y-17;if(orb.bounces++){explodeCometOrb(orb);return false;}orb.vy=-Math.max(6,Math.abs(orb.vy)*.7);orb.vx*=.8;burst(orb.x,orb.y,'#ffc786',8);}
    }
    if(orb.x<-30||orb.x>1230||orb.y>710){explodeCometOrb(orb);return false;}
    return true;
  });
}

function drawCometOrbs(){
  for(const orb of cometOrbs){
    ctx.save();ctx.translate(orb.x,orb.y);ctx.rotate(orb.spin);ctx.globalCompositeOperation='lighter';
    ctx.shadowColor='#ff9d55';ctx.shadowBlur=20;ctx.fillStyle='#ffb46e';ctx.strokeStyle='#fff0ba';ctx.lineWidth=3;
    ctx.scale(orb.scale||1,orb.scale||1);ctx.beginPath();for(let n=0;n<7;n++){const a=n*Math.PI*2/7,r=n%2?14:20;if(n)ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff2c8';ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.save();ctx.globalAlpha=.55;ctx.strokeStyle='#ffb16a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(orb.x-orb.vx*3,orb.y-orb.vy*3);ctx.lineTo(orb.x,orb.y);ctx.stroke();ctx.restore();
  }
}

function updateCometTrails(){
  cometTrails=cometTrails.filter(trail=>{
    if(trail.owner.lives<=0||--trail.life<=0)return false;
    for(const target of fighters){
      if(target.team===trail.owner.team||target.lives<=0||target.inv>0||trail.hits.has(target))continue;
      if(Math.abs(target.x-trail.x)>26||Math.abs(target.y-trail.y)>33)continue;
      trail.hits.add(target);
      if(target.blocking&&target.shield>0){target.shield=Math.max(0,target.shield-7);target.stun=target.shield===0?28:4;}
      else{
        const damage=Math.max(1,Math.round(3*(characters[trail.owner.character]?.power||1)*(target.dummy?1:(roleStats[target.character]?.guard||1))));
        if(isSurvival()){target.hp=Math.max(0,target.hp-damage);target.dmg=target.maxHp-target.hp;}else target.dmg+=damage;
        target.vx=trail.dir*1.4;target.vy=Math.min(0,target.vy);
        target.stun=Math.max(target.stun,10);target.inv=target.dummy?0:8;
        if(target.dummy&&$('#mode').value==='range'){rangeStats.lastDamage=damage;rangeStats.totalDamage+=damage;rangeStats.hits++;rangeStats.combo=tick-rangeStats.lastHitTick<=90?rangeStats.combo+1:1;rangeStats.lastHitTick=tick;}
        if(isSurvival()&&target.hp<=0){target.lives=0;if(!fighters.some(member=>member.team===target.team&&member.lives>0))finish(trail.owner.team);}
      }
      target.hitFlash=6;impactBurst(target.x,target.y,'#ffd48a',trail.dir,false);
    }
    return true;
  });
}

function drawCometTrails(){
  for(const trail of cometTrails){
    const fade=trail.life/37;
    ctx.save();ctx.translate(trail.x,trail.y);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=fade*.78;
    ctx.shadowColor='#ffae66';ctx.shadowBlur=14;ctx.strokeStyle='#ffd697';ctx.fillStyle='#ffac64';
    ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-trail.dir*20,13);ctx.lineTo(trail.dir*15,13);ctx.stroke();
    ctx.beginPath();ctx.moveTo(trail.dir*18,13);ctx.lineTo(-trail.dir*3,2);ctx.lineTo(-trail.dir*10,13);ctx.lineTo(-trail.dir*3,24);ctx.closePath();ctx.fill();
    ctx.restore();
  }
}
