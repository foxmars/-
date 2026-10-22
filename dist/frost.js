let frostStorms=[];

function updateFrostStorms(){
  frostStorms=frostStorms.filter(storm=>{
    if(storm.owner.lives<=0)return false;
    storm.age++;
    for(const shard of storm.shards){
      if(shard.hit||shard.spent||storm.age<shard.delay)continue;
      if(shard.wave===2&&!shard.locked){
        const target=nearestOpponent(storm.owner);
        if(target&&Math.abs(target.x-storm.center.x)<320&&Math.abs(target.y-storm.center.y)<240){
          shard.target=target;
          shard.x=target.x+shard.lane*48;
          shard.y=target.y-215;
        }
        shard.locked=true;
      }
      if(shard.wave===2&&shard.target?.lives>0&&storm.age-shard.delay<15){
        shard.x+=(shard.target.x+shard.lane*48-shard.x)*.22;
      }
      const endY=shard.wave===2&&shard.target?.lives>0?shard.target.y+105:storm.center.y+105;
      if(shard.y>endY||storm.age-shard.delay>24){shard.spent=true;continue;}
      shard.y+=16;
      if(shard.y>endY){shard.spent=true;continue;}
      for(const target of fighters){
        if(target.team===storm.owner.team||target.lives<=0||target.inv>0||tick-(storm.hits.get(target)??-100)<10)continue;
        if(Math.abs(target.x-shard.x)>(shard.wave===2?31:23)||Math.abs(target.y-shard.y)>(shard.wave===2?48:39))continue;
        storm.hits.set(target,tick);
        const final=shard.wave===2,blocked=target.blocking&&target.shield>0;
        if(blocked){target.shield=Math.max(0,target.shield-(final?22:13));target.stun=target.shield===0?35:6;}
        else{
          const damage=Math.max(1,Math.round((final?11:6)*(characters[storm.owner.character]?.power||1)*(target.dummy?1:(roleStats[target.character]?.guard||1))));
          if(isSurvival()){target.hp=Math.max(0,target.hp-damage);target.dmg=target.maxHp-target.hp;}else target.dmg+=damage;
          target.vx=storm.owner.dir*(final?Math.min(24,7+target.dmg*.045):1.5);
          target.vy=final?-Math.min(17,6+target.dmg*.025):-2;
          target.stun=Math.max(target.stun,final?34:19);
          target.chill=Math.max(target.chill||0,105);
          target.inv=target.dummy?0:7;
          if(target.dummy&&$('#mode').value==='range'){rangeStats.lastDamage=damage;rangeStats.totalDamage+=damage;rangeStats.hits++;rangeStats.combo=tick-rangeStats.lastHitTick<=90?rangeStats.combo+1:1;rangeStats.lastHitTick=tick;}
          if(isSurvival()&&target.hp<=0){target.lives=0;if(!fighters.some(member=>member.team===target.team&&member.lives>0))finish(storm.owner.team);}
        }
        target.hitFlash=9;impactBurst(target.x,target.y,'#c9f8ff',storm.owner.dir,final);
        shard.hit=true;
        break;
      }
    }
    return storm.age<86;
  });
}

function drawFrostStorms(){
  for(const storm of frostStorms){
    ctx.save();ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle='#a8edff';ctx.shadowColor='#82dfff';ctx.shadowBlur=13;ctx.lineWidth=2;
    for(const shard of storm.shards){
      if(storm.age<shard.delay||shard.hit||shard.spent)continue;
      const size=shard.wave===2?27:19;
      ctx.globalAlpha=Math.min(1,(storm.age-shard.delay+1)/5);
      ctx.fillStyle=shard.wave===2?'#d7faff':'#8eddf4';
      ctx.beginPath();ctx.moveTo(shard.x,shard.y+size);ctx.lineTo(shard.x-size*.55,shard.y-size*.55);ctx.lineTo(shard.x,shard.y-size);ctx.lineTo(shard.x+size*.55,shard.y-size*.55);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(shard.x,shard.y-size-8);ctx.lineTo(shard.x,shard.y-size-32);ctx.stroke();
    }
    ctx.restore();
  }
}
