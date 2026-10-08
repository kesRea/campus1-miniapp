const fs=require('fs');
const path=require('path');

const root=process.cwd();
const src=path.join(root,'backend');
const out=path.join(root,'apps-script-build');

const required={
  '__BOT_TOKEN__':process.env.BOT_TOKEN,
  '__SS_ID__':process.env.SS_ID,
  '__OWNER_ID__':process.env.OWNER_ID
};

for(const [key,value] of Object.entries(required)){
  if(!value)throw new Error(key+' GitHub secret is missing');
}

fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});

function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const from=path.join(dir,ent.name);
    const rel=path.relative(src,from);
    const to=path.join(out,rel);
    if(ent.isDirectory()){
      fs.mkdirSync(to,{recursive:true});
      walk(from);
      continue;
    }
    let data=fs.readFileSync(from);
    if(/\.(gs|js|html|json)$/i.test(ent.name)){
      let text=data.toString('utf8');
      for(const [key,value] of Object.entries(required)){
        text=text.split(key).join(String(value));
      }
      fs.writeFileSync(to,text,'utf8');
    }else{
      fs.copyFileSync(from,to);
    }
  }
}
walk(src);

fs.writeFileSync(path.join(out,'.clasp.json'),JSON.stringify({
  scriptId:'1RcKygIdJB_ZVoaJCV5NxftfYgO2Ba3Njyi-VUEmxUM3zx_w5-rufA-CD'
},null,2));

const all=[];
(function scan(dir){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory())scan(p); else all.push(p);
  }
})(out);

for(const f of all){
  if(!/\.(gs|js|html|json)$/i.test(f))continue;
  const s=fs.readFileSync(f,'utf8');
  if(s.includes('__BOT_TOKEN__')||s.includes('__SS_ID__')||s.includes('__OWNER_ID__')){
    throw new Error('Unresolved placeholder in '+f);
  }
}
console.log('Apps Script build ready:',out);
