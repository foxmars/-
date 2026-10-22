let sandGusts=[];
let sandPits=[];
let sandCollapses=[];
let sandStorms=[];

function updateSandStorms(){
  sandStorms=sandStorms.filter(storm=>{
    if(storm.owner.lives<=0||--storm.life<=0)return false;
    storm.age++;
    if(storm.age<52){
      const focus=nearestOpponent(storm.owner);
      if(focus&&focus.lives>0){
        storm.x+=Math.max(-3.8,Math.min(3.8,(focus.x-storm.x)*.035));
        storm.y+=Math.max(-2.5,Math.min(2.5,(focus.y-storm.y)*.025));
      }
    }
    const radius=65+Math.min(1,storm.age/30)*140;
    for(const target of fighters){
      if(target.team===storm.owner.team||target.lives<=0||Math.hypot((target.x-storm.x)/radius,(target.y-storm.y)/(radius*.72))>1)continue;
      if(storm.age<76){
        target.vx+=(storm.x-target.x)*.034;
        target.vy+=(storm.y-target.y)*.018;
        target.chill=Math.max(target.chill||0,12);
        if(storm.age%10!==0||target.inv>0||tick-(storm.hits.get(target)??-100)<9)continue;
        storm.hits.set(target,tick);
        sandDamage(storm.owner,target,5,storm.x,storm.y);
        if(!(target.blocking&&target.shield>0)){target.vx=(storm.x-target.x)*.09;target.vy=(storm.y-target.y)*.05;}
      }else if(storm.age<89&&!storm.finisherHits.has(target)){
        storm.finisherHits.add(target);
        const blocked=target.blocking&&target.shield>0;
        sandDamage(storm.owner,target,21,storm.x,storm.y,true);
        if(!blocked){target.vx=(Math.sign(target.x-storm.x)||storm.owner.dir)*Math.min(22,8+target.dmg*.045);target.vy=-9;target.stun=Math.max(target.stun,36);}
      }
    }
    if(storm.age===76){burst(storm.x,storm.y,'#ffe1ae',40);shake=Math.max(shake,12);}
    return true;
  });
}

function drawSandStorms(){
  for(const storm of sandStorms){
    const radius=65+Math.min(1,storm.age/30)*140,fade=storm.age>89?Math.max(0,(108-storm.age)/19):1;
    ctx.save();ctx.translate(storm.x,storm.y);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=fade*.78;
    ctx.strokeStyle='#f6d09a';ctx.fillStyle='#d9a35d';ctx.shadowColor='#eeb875';ctx.shadowBlur=19;
    for(let ring=0;ring<4;ring++){
      ctx.save();ctx.rotate((ring%2?-.016:.022)*tick+ring*.38);ctx.lineWidth=ring?3:5;
      ctx.beginPath();ctx.ellipse(0,0,Math.max(20,radius-ring*25),Math.max(14,(radius-ring*25)*.72),0,ring*.38,Math.PI*1.73+ring*.38);ctx.stroke();ctx.restore();
    }
    for(let n=0;n<18;n++){const a=n*Math.PI/9+tick*(n%2?.045:-.04),r=radius*(.34+(n%4)*.17);ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r*.72,2+n%3,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
}

function activateSandCombo(owner,action){
  const target=nearestOpponent(owner),x=Math.max(100,Math.min(1100,target&&Math.abs(target.x-owner.x)<300?target.x:owner.x+owner.dir*145)),floor=galeTornadoFloor();
  if(action==='sandFan'){
    for(const offset of [-31,0,31])sandGusts.push({owner,x:owner.x+owner.dir*34,y:owner.y-7+offset,dir:owner.dir,width:26,life:20,hits:new Set()});
  }else if(action==='sandPincer'){
    for(const side of [-1,1])sandPits.push({owner,x:x+side*64,y:floor,radius:104,life:125,hits:new Map()});
  }else{
    sandCollapses.push({owner,x,y:Math.max(90,Math.min(550,target&&Math.abs(target.y-owner.y)<210?target.y:owner.y)),age:0,life:42,hits:new Set()});
  }
  burst(x,floor-8,'#f5d3a0',17);tone(470,.14);
}

function updateSandCollapses(){
  sandCollapses=sandCollapses.filter(collapse=>{
    if(collapse.owner.lives<=0||--collapse.life<=0)return false;
    collapse.age++;
    if(collapse.age!==22)return true;
    burst(collapse.x,collapse.y,'#f5d1a0',29);shake=Math.max(shake,8);
    for(const target of fighters){
      if(target.team===collapse.owner.team||target.lives<=0||target.inv>0||Math.hypot(target.x-collapse.x,target.y-collapse.y)>125)continue;
      collapse.hits.add(target);
      sandDamage(collapse.owner,target,19,collapse.x,collapse.y,true);
      if(target.blocking&&target.shield>0)continue;
      target.vx=(collapse.x-target.x)*.13;
      target.vy=-5;target.stun=Math.max(target.stun,32);
    }
    return true;
  });
}

function drawSandCollapses(){
  for(const collapse of sandCollapses){
    if(collapse.age>=30)continue;
    const charge=Math.min(1,collapse.age/22),fade=collapse.age>22?(30-collapse.age)/8:1;
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=fade*.8;
    ctx.strokeStyle='#f8d9a6';ctx.fillStyle='#d9a76988';ctx.shadowColor='#e5b776';ctx.shadowBlur=15;ctx.lineWidth=5;
    for(let ring=0;ring<3;ring++){
      ctx.beginPath();ctx.ellipse(collapse.x,collapse.y,145-charge*53-ring*15,74-charge*25-ring*9,ring*.18,0,Math.PI*2);ctx.stroke();
    }
    for(let n=0;n<8;n++){const a=n*Math.PI/4+tick*.09,r=110-charge*57;ctx.beginPath();ctx.arc(collapse.x+Math.cos(a)*r,collapse.y+Math.sin(a)*r*.55,4,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
}

function sandDamage(owner,target,amount,x,y,heavy=false){
  if(target.blocking&&target.shield>0){target.shield=Math.max(0,target.shield-(heavy?17:9));target.stun=target.shield===0?34:5;}
  else{
    const damage=Math.max(1,Math.round(amount*(owner.classmateStats?.power??characters[owner.character]?.power??1)*(target.dummy?1:(target.classmateStats?.guard??roleStats[target.character]?.guard??1))));
    if(isSurvival()){target.hp=Math.max(0,target.hp-damage);target.dmg=target.maxHp-target.hp;}else target.dmg+=damage;
    target.vx=(Math.sign(target.x-x)||owner.dir)*(heavy?1.1:.7);
    target.vy=target.ground?0:Math.min(0,target.vy);
    target.stun=Math.max(target.stun,heavy?18:11);
    target.chill=Math.max(target.chill||0,heavy?55:35);
    target.inv=target.dummy?0:heavy?8:7;
    if(target.dummy&&$('#mode').value==='range'){rangeStats.lastDamage=damage;rangeStats.totalDamage+=damage;rangeStats.hits++;rangeStats.combo=tick-rangeStats.lastHitTick<=90?rangeStats.combo+1:1;rangeStats.lastHitTick=tick;}
    if(isSurvival()&&target.hp<=0){target.lives=0;if(!fighters.some(member=>member.team===target.team&&member.lives>0))finish(owner.team);}
  }
  target.hitFlash=7;impactBurst(target.x,target.y,'#edca8c',owner.dir,heavy);
}

function updateSandEffects(){
  sandGusts=sandGusts.filter(gust=>{
    if(gust.owner.lives<=0||--gust.life<=0)return false;
    gust.x+=gust.dir*11;gust.width=Math.min(61,gust.width+3);
    for(const target of fighters){
      if(target.team===gust.owner.team||target.lives<=0||target.inv>0||gust.hits.has(target))continue;
      if(Math.abs(target.x-gust.x)>gust.width||Math.abs(target.y-gust.y)>42)continue;
      gust.hits.add(target);sandDamage(gust.owner,target,7,gust.x,gust.y);
    }
    return true;
  });
  sandPits=sandPits.filter(pit=>{
    if(pit.owner.lives<=0||--pit.life<=0)return false;
    for(const target of fighters){
      if(target.team===pit.owner.team||target.lives<=0||Math.abs(target.x-pit.x)>pit.radius||Math.abs(target.y+27-pit.y)>55)continue;
      target.vx+=(pit.x-target.x)*.018;
      target.vx*=.78;
      target.chill=Math.max(target.chill||0,8);
      if(target.inv>0||tick-(pit.hits.get(target)??-100)<28)continue;
      pit.hits.set(target,tick);sandDamage(pit.owner,target,3,pit.x,pit.y,true);
    }
    return true;
  });
}

function drawSandEffects(){
  for(const pit of sandPits){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(.8,pit.life/22);
    ctx.fillStyle='#bd8c4d88';ctx.strokeStyle='#f6d5a0';ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(pit.x,pit.y,pit.radius,20,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    for(let n=0;n<8;n++){const a=n*Math.PI/4+tick*.025,r=pit.radius*.68;ctx.fillStyle='#ffe2aa';ctx.beginPath();ctx.arc(pit.x+Math.cos(a)*r,pit.y+Math.sin(a)*12,2.5,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  for(const gust of sandGusts){
    ctx.save();ctx.translate(gust.x,gust.y);ctx.globalAlpha=Math.min(.9,gust.life/7);ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle='#f3d19a';ctx.fillStyle='#e6ba79';ctx.lineWidth=4;ctx.shadowColor='#e2ab65';ctx.shadowBlur=12;
    for(let n=-2;n<=2;n++){const y=n*12,x=-gust.dir*gust.width*.7;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(gust.dir*8,y-11,gust.dir*gust.width,y+n*5);ctx.stroke();ctx.beginPath();ctx.arc(gust.dir*(gust.width*.4+n*4),y+5,3,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
}
