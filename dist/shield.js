function drawShieldPose(context,p,color){
  const c=context,dir=p.dir<0?-1:1,shine=.6+.36*Math.max(0,Math.min(1,p.shield/100)),time=performance.now()*.006;
  c.save();c.scale(dir,1);c.globalAlpha=shine;c.lineJoin='round';c.lineCap='round';c.strokeStyle=color;c.fillStyle=color+'99';c.shadowColor=color;c.shadowBlur=12;
  const stroke=(pts,w=3)=>{c.lineWidth=w;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
  const shape=(pts,fill=color+'99')=>{c.fillStyle=fill;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();c.stroke();};
  const dot=(x,y,r=3)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
  switch(p.character){
    case'pulse':{
      for(const y of [-17,17]){shape([[13,y-9],[30,y-13],[43,y],[30,y+13],[13,y+9]],'#56cce0aa');stroke([[23,y],[48,y]],3);}
      dot(51,0,4);break;
    }
    case'drake':{
      c.fillStyle='#9d4056e6';c.strokeStyle='#ffd0a0';
      for(const side of [-1,1]){c.beginPath();c.moveTo(side*11,-18);c.quadraticCurveTo(side*33,-36,side*48,-24);c.lineTo(side*40,9);c.lineTo(side*22,23);c.lineTo(7,15);c.closePath();c.fill();c.stroke();stroke([[side*11,-18],[side*40,9],[7,15]],2);}
      break;
    }
    case'titan':{
      shape([[5,-23],[20,-31],[33,-17],[31,24],[10,20]],'#7359a9');
      shape([[23,-25],[41,-29],[52,-13],[43,28],[26,18]],'#a587df');
      stroke([[12,-15],[42,16]],6);stroke([[40,-14],[14,15]],6);break;
    }
    case'terra':{
      for(const [x,y,w,h] of [[16,-26,21,19],[31,-19,18,25],[17,0,27,22],[33,9,17,18]]){
        shape([[x,y],[x+w-6,y-5],[x+w,y+4],[x+w-3,y+h],[x+3,y+h+2]],'#648b64');
      }break;
    }
    case'frost':{
      c.fillStyle='#d7f7ff';c.beginPath();c.arc(30,0,29,0,Math.PI*2);c.stroke();
      for(const [x,y] of [[29,-17],[18,7],[40,8]])shape([[x,y-10],[x+7,y],[x,y+10],[x-7,y]],'#bdf4ff');
      break;
    }
    case'ember':{
      for(let n=0;n<3;n++){c.fillStyle=n===1?'#ffd486a8':'#ff794b99';c.beginPath();c.moveTo(12+n*9,22);c.bezierCurveTo(5+n*12,-14,31+n*10,-11,28+n*8,-36+n*5);c.quadraticCurveTo(52+n*5,0,21+n*8,22);c.closePath();c.fill();c.stroke();}break;
    }
    case'volt':{
      c.strokeStyle='#fff69b';c.lineWidth=5;stroke([[12,-26],[34,-23],[23,-4],[48,0],[29,25]],5);
      stroke([[25,-21],[48,-26],[37,-4],[52,14]],2);for(const y of [-24,2,24])dot(48,y,2);break;
    }
    case'gale':{
      c.strokeStyle='#d7f4ff';c.lineWidth=4;
      for(let n=0;n<3;n++){const y=-20+n*19;c.beginPath();c.moveTo(12,y);c.bezierCurveTo(45,y-18,54,y+20,28,y+10);c.bezierCurveTo(13,y+5,24,y-8,39,y+2);c.stroke();}break;
    }
    case'shade':{
      c.fillStyle='#8f5abdb0';shape([[10,-26],[42,-19],[51,9],[19,27]],'#71389eaa');
      stroke([[15,-20],[43,19]],5);stroke([[43,-19],[16,18]],5);dot(43,1,3);break;
    }
    case'bramble':{
      for(let n=0;n<3;n++){const y=-21+n*21;c.beginPath();c.moveTo(10,y);c.bezierCurveTo(39,y-20,46,y+18,51,y+4);c.stroke();shape([[28,y-3],[36,y-11],[34,y+3]],'#c8ef91');shape([[42,y+10],[53,y+3],[44,y+17]],'#c8ef91');}break;
    }
    case'tide':{
      c.fillStyle='#43bae0aa';c.beginPath();c.moveTo(8,25);c.bezierCurveTo(23,-4,24,-31,48,-25);c.bezierCurveTo(57,-17,53,-2,38,-8);c.bezierCurveTo(30,-12,30,12,44,25);c.closePath();c.fill();c.stroke();dot(51,-26,3);break;
    }
    case'echo':{
      c.strokeStyle='#f5d9ff';for(let n=-2;n<=2;n++)stroke([[12,n*9],[51,n*9]],2);
      c.fillStyle='#f5d9ff';dot(32,8,6);stroke([[38,8],[38,-21],[47,-16]],4);dot(47,-1,5);break;
    }
    case'nova':{
      const points=[[13,-27],[50,-10],[33,27]];stroke([...points,points[0]],3);
      for(const [x,y] of points){c.save();c.translate(x,y);c.rotate(time*.22);shape([[0,-8],[5,0],[0,8],[-5,0]],'#ffe4aa');c.restore();}break;
    }
    case'prism':{
      shape([[15,-30],[49,-5],[20,29]],'#af579aa8');stroke([[15,-30],[29,1],[20,29]],2);stroke([[29,1],[49,-5]],2);
      c.strokeStyle='#ffe0f5';stroke([[30,-26],[50,-32]],2);stroke([[44,11],[56,17]],2);break;
    }
    case'rivet':{
      shape([[16,-18],[32,-27],[49,-19],[45,17],[29,27],[14,16]],'#477b9a');
      c.fillStyle='#d7f6ff';c.fillRect(24,-4,18,8);stroke([[32,-29],[32,-41]],2);dot(32,-42,3);break;
    }
    case'magnet':{
      c.lineWidth=7;c.strokeStyle='#80ffe2';c.beginPath();c.arc(27,0,25,-1.25,1.25);c.stroke();
      c.fillStyle='#ef817e';c.fillRect(32,-28,15,8);c.fillStyle='#7dafff';c.fillRect(32,20,15,8);stroke([[45,-24],[53,-13],[45,0],[53,11],[45,23]],2);break;
    }
    case'monk':{
      c.strokeStyle='#ffe7a5';stroke([[8,-12],[27,1],[42,-13]],7);stroke([[8,11],[27,-1],[42,13]],7);
      c.lineWidth=3;c.beginPath();c.arc(27,0,30,-.9,.9);c.stroke();dot(48,0,3);break;
    }
    case'comet':{
      shape([[11,21],[37,-27],[51,-16],[30,26]],'#ffbd71');
      c.strokeStyle='#fff0b8';for(let n=0;n<4;n++)stroke([[12-n*7,23+n*5],[32-n*4,-13+n*5]],2);break;
    }
    case'sand':{
      c.fillStyle='#c69a69aa';c.beginPath();c.moveTo(12,25);c.quadraticCurveTo(18,-22,38,-30);c.quadraticCurveTo(55,-7,48,25);c.closePath();c.fill();c.stroke();
      for(let n=0;n<7;n++)dot(24+(n*11)%33,-20+(n*9)%39,1.5);break;
    }
    default:{
      for(let n=-1;n<=1;n++){c.save();c.translate(28,n*19);c.rotate(Math.PI/6);c.strokeRect(-10,-10,20,20);c.restore();}break;
    }
  }
  c.restore();
}
