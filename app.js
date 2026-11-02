(()=>{
'use strict';
const DB=window.POSTER_DATA, $=id=>document.getElementById(id), W=DB.width,H=DB.height;
// Theme colors are resolved from the real PPT theme XML (including schemeClr accents).
// The visual layout is chosen ONLY by speaker count; color selection does not swap geometry.
const THEMES=[
 {id:'red',name:'学术红',panelTop:'#AC343B',panelBottom:'#A62628',accent:'#FFD863',text:'#FFFFFF',bio:'#FFE4E1'},
 {id:'blue',name:'深蓝',panelTop:'#4D5382',panelBottom:'#4D5382',accent:'#25C1FF',text:'#FFFFFF',bio:'#25C1FF',source:2},
 {id:'violet',name:'紫色',panelTop:'#6B5CA5',panelBottom:'#6B5CA5',accent:'#FFD863',text:'#FFFFFF',bio:'#C6D8FF',source:3},
 {id:'yellowwhite',name:'黄白',panelTop:'#FFC000',panelBottom:'#FFF2CC',accent:'#3E885B',text:'#212121',bio:'#212121',source:4},
 {id:'graywhite',name:'灰白',panelTop:'#44546A',panelBottom:'#E7E6E6',accent:'#EF232C',text:'#212121',bio:'#212121',source:5},
 {id:'pinkwhite',name:'粉白',panelTop:'#FF0000',panelBottom:'#FFFFFF',accent:'#EF232C',text:'#212121',bio:'#212121',source:6},
 {id:'pinkyellow',name:'粉黄',panelTop:'#FFC000',panelBottom:'#EF232C',accent:'#FFD863',text:'#FFFFFF',bio:'#FFFFFF',source:7}
];
const BASE_SLIDES={1:10,2:8,3:1,4:9};
// The PPT exporter only carried a location illustration on slide 1. Restore
// the missing location glyph as a normal positioned asset in every 2–4 speaker preset.
for(const t of DB.templates){
 if(t.count===1){const pin=t.elements.find(e=>/lucide_map_pin_gold/i.test(e.src||''));if(pin)pin.role='locationIcon';}
 const venue=t.elements.find(e=>e.role==='venue');
 if(!venue || t.count===1)continue;
 const original=t.elements.find(e=>/ppt_1_26/i.test(e.src||''));
 if(original){
   original.role='locationIcon';
   original.x=venue.x-70;original.y=venue.y-4;
   original.w=54;original.h=68;
   venue.x+=15; // clear optical gutter between a larger icon and the venue text
 }else{
   // PPT did not include a usable location icon: reserve a proper icon gutter.
   venue.x+=35;
   t.elements.push({id:`location_${t.slide}`,kind:'image',role:'locationIcon',src:'assets/lucide_map_pin.png',
     x:venue.x-70,y:venue.y-4,w:54,h:68,pptName:'Location icon'});
   venue.x+=15;
 }
}

// The one-speaker PPT uses the talk as its headline. The editor also tracks a
// separate event series title, so preserve BOTH without silently dropping the talk.
const oneTemplate=DB.templates.find(t=>t.slide===10);
if(oneTemplate&&!oneTemplate.elements.some(e=>e.role==='speaker1.title')){
 oneTemplate.elements.push({id:'solo_talk_title',kind:'text',role:'speaker1.title',
  text:'',x:65,y:286,w:540,h:55,style:{size:21,weight:500,italic:false,color:'#ffffff',lineHeight:1.1},rotation:0,pptName:'单人讲座题目'});
}

function baseTemplate(count){const t=THEMES.find(t=>t.id===themeId);const slide=Number(count)===3?(t?.source||1):BASE_SLIDES[count];return DB.templates.find(x=>x.slide===slide)||DB.templates.find(x=>x.count===Number(count))}
const KEY='research-poster-demo-v8';const V7_KEY='research-poster-demo-v7';const V6_KEY='research-poster-demo-v6';const V5_KEY='research-poster-demo-v5';const PREV_KEY='research-poster-demo-v4',OLDER_KEY='research-poster-demo-v3';
const normalizeSrc=src=>{if(!src)return src;if(/sjtu_logo_/i.test(src))return 'assets/sjtu_logo_hd.png';if(/sfl_logo_/i.test(src))return 'assets/sfl_logo_hd.png';if(src.includes('ppt_1_26'))return 'assets/lucide_map_pin.png';return src};
const asset=src=>window.POSTER_ASSETS?.[normalizeSrc(src)]||normalizeSrc(src);
const clone=v=>JSON.parse(JSON.stringify(v));
const exportFilename=()=>{const raw=(fields.eventTitle||'Research Forum').replace(/\n+/g,' ').trim()||'Research Forum';const safe=raw.replace(/[\\/:*?"<>|]/g,' ').replace(/\s+/g,' ').trim().slice(0,120);return (safe||'Research Forum')+'.jpg'};
const TOP_PANEL_SHIFT=18;
const topInfoRoles=new Set(['day','month','weekday','time','ampm','dateLong','venue']);
let template=DB.templates[0], selectedId=null, previewScale=0.55, fields={}, overrides={}, themeId='red', photoZoom=[1,1,1,1],photoY=[50,50,50,50],photoX=[50,50,50,50], backgrounds={}, photos=[], showGuides=true;
let panelOverrides={};let lastUnmatched=[];let dragState=null;let monoBackground=true,bgFocusX=50,bgFocusY=50;
const EXPORT_SCALE=4;
const bgLightGray=src=>src?.replace(/(background_\d+)\.jpg$/,'$1_lightgray.jpg');
const effectiveBackground=src=>monoBackground?(backgrounds.current?(backgrounds.processed||backgrounds.current):bgLightGray(src)):src;
const textRoleKeys=['eventTitle','host','day','month','weekday','time','ampm','dateLong','venue'];
function defaults(){
 fields={eventTitle:'Research Forum\nIntermedial Studies of Literature',host:'Hosted by Dr. Bowen Wang (English, SJTU)',day:'26',month:'November',weekday:'Thursday',time:'2:00 –\n4:45',ampm:'PM',dateLong:'November 26, Thursday',venue:'402, East Upper Hall\nShanghai Jiao Tong University, Minhang Campus',speakers:[
  {title:'Artist’s Novel:\nThe Künstlerroman in Transition',name:'Dr. Ye Li (黎晔)',bio:'Postdoc Researcher in English Literature\nSchool of Foreign Languages\nShanghai Jiao Tong University'},
  {title:'Intermedial Entanglement\nbetween Literature and Theatre',name:'Dr. Shuying Chen (陈书盈)',bio:'Lecturer in Comparative and World Literature\nSchool of Humanities\nShanghai University'},
  {title:'Jazz as Sonic Activism\nin Mongo Beti’s Crime Fiction',name:'Dr. Fei Xie (谢菲)',bio:'Lecturer in French Literature\nParis Elite Institute of Technology\nShanghai Jiao Tong University'},
  {title:'',name:'',bio:''}
 ]};
 photos=['assets/profile_1_15.jpg','assets/profile_1_19.png','assets/profile_1_23.png',null];
}
defaults();
function notify(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(notify.t);notify.t=setTimeout(()=>el.classList.remove('show'),3300)}
function persist(){try{const p={templateId:template.slide,fields,overrides,panelOverrides,themeId,photoZoom,photoY,photoX,photos,backgrounds,monoBackground,bgFocusX,bgFocusY};const str=JSON.stringify(p);if(str.length<3.5e6)localStorage.setItem(KEY,str);$('save-indicator').textContent='已在浏览器中保存';}catch(err){$('save-indicator').textContent='建议下载配置文件';}}
function loadSaved(){try{const raw=localStorage.getItem(KEY)||localStorage.getItem(V7_KEY)||localStorage.getItem(V6_KEY)||localStorage.getItem(V5_KEY)||localStorage.getItem(PREV_KEY)||localStorage.getItem(OLDER_KEY);if(!raw)return;const v=JSON.parse(raw);if(!v.fields||!v.templateId)return;template=baseTemplate((DB.templates.find(t=>t.slide===v.templateId)||template).count);fields=v.fields;fields.speakers=[...(fields.speakers||[])];while(fields.speakers.length<4)fields.speakers.push({title:'',name:'',bio:''});overrides=localStorage.getItem(KEY)?(v.overrides||{}):{};panelOverrides=v.panelOverrides||{};themeId=THEMES.some(t=>t.id===v.themeId)?v.themeId:({gold:'yellowwhite',slate:'graywhite',coral:'pinkwhite'}[v.themeId]||'red');photoZoom=v.photoZoom||[1,1,1,1];photoY=v.photoY||[50,50,50,50];photoX=v.photoX||[50,50,50,50];photos=v.photos||photos;backgrounds=v.backgrounds||{};monoBackground=v.monoBackground!==false;bgFocusX=v.bgFocusX??50;bgFocusY=v.bgFocusY??50;template=baseTemplate(template.count); }catch(e){console.warn('Cannot load saved project',e)}}
function getRole(role){if(!role)return null;const m=role.match(/^speaker(\d+)\.(title|name|bio)$/);if(m)return fields.speakers[Number(m[1])-1]?.[m[2]]??'';return fields[role]??null}
function setRole(role,val){if(!role)return;const m=role.match(/^speaker(\d+)\.(title|name|bio)$/);if(m){fields.speakers[Number(m[1])-1][m[2]]=val}else fields[role]=val;}
// Preserve the staggered pair of PPT rectangles.  Previous versions
// normalised both to the same X/right edge, destroying the original hierarchy.
// Shift the whole editable composition right by one consistent inset instead;
// left/right differences between PPT objects remain intact.
const COMPOSITION_INSET=26;
// All four participant counts have intentionally different typographic grids.
// Geometry belongs to the template, not to a one-size-fits-all resizing rule.
const LAYOUT_ONE={
 eventTitle:[64,64,550,175,39],host:[64,240,535,40,23],
 speakersLabel:[60,350,132,34,22],'speaker1.title':[64,285,539,58,21],
 'speaker1.photo':[74,420,148,148],
 'speaker1.name':[242,429,410,48,31],
 'speaker1.bio':[245,488,393,110,20],
 time:[171,917,332,50,37],ampm:[520,925,66,39,23],dateLong:[172,969,400,36,22],
 venue:[172,1058,418,112,22],
 locationIcon:[80,1048,53,64]
};
const LAYOUT_FOUR={
 eventTitle:[65,35,552,120,35],host:[65,174,535,38,22],
 time:[91,292,234,49,33],ampm:[330,298,58,35,22],dateLong:[91,338,281,34,21],
 venue:[462,284,204,98,20],locationIcon:[399,293,43,54],
 speakersLabel:[6,479,134,38,20]
};
for(let n=1;n<=4;n++){
 const y=423+(n-1)*190;
 LAYOUT_FOUR[`speaker${n}.title`]=[111,y,530,58,23];
 LAYOUT_FOUR[`speaker${n}.photo`]=[115,y+61,94,94];
 LAYOUT_FOUR[`speaker${n}.name`]=[234,y+61,414,40,23];
 LAYOUT_FOUR[`speaker${n}.bio`]=[236,y+97,412,80,16.5];
}
function defaultGeometry(e){
 const b={...e};
 if(e.kind==='background'||(e.kind==='image'&&/(?:sjtu|sfl)_logo_/i.test(e.src||'')))return b;
 b.x+=COMPOSITION_INSET;
 let grid;
 if(template.count===1)grid=LAYOUT_ONE;
 else if(template.count===4)grid=LAYOUT_FOUR;
 const a=grid?.[e.role];
 if(a){b.x=a[0];b.y=a[1];b.w=a[2];b.h=a[3];if(a[4]!=null)b.style={...e.style,size:a[4],lineHeight:1.13};}
 if(template.count===1){
  if(e.kind==='rect' && e.id===template.elements.find(t=>t.kind==='rect')?.id){Object.assign(b,{x:48,y:0,w:605,h:633});}
  if(e.kind==='rect' && e.id===template.elements.filter(t=>t.kind==='rect')[1]?.id){Object.assign(b,{x:50,y:876,w:616,h:317});}
  if(e.kind==='line'){Object.assign(b,{x:193,y:374,w:360,h:.16});}
  if(/lucide_clock_gold/i.test(e.src||'')){Object.assign(b,{x:83,y:911,w:52,h:52});}
  if(/lucide_map_pin_gold/i.test(e.src||'')){Object.assign(b,{x:81,y:1045,w:52,h:59});}
 }
 if(template.count===4){
  if(e.kind==='rect' && e.id===template.elements.find(t=>t.kind==='rect')?.id){Object.assign(b,{x:48,y:0,w:608,h:410});}
  if(e.kind==='rect' && e.id===template.elements.filter(t=>t.kind==='rect')[1]?.id){Object.assign(b,{x:63,y:263,w:653,h:930});}
  if(e.kind==='line')Object.assign(b,{x:92,y:536,w:0,h:634});
 }
 // The time range is always one typographic unit; never split at the en dash.
 if(template.count===2 && e.role==='time'){Object.assign(b,{x:377,y:410,w:235,h:52});b.style={...e.style,size:32};}
 if(template.count===2 && e.role==='ampm'){Object.assign(b,{x:590,y:415,w:52,h:37});b.style={...e.style,size:21};}
 if(template.count===3 && e.role==='time'){Object.assign(b,{x:402,y:259,w:225,h:52});b.style={...e.style,size:32};}
 if(template.count===3 && e.role==='ampm'){Object.assign(b,{x:611,y:266,w:51,h:33});b.style={...e.style,size:20};}
 return b;
}
function displayedText(e){
 const raw=val(e);
 if(e.role==='time')return String(raw).replace(/\s*[\r\n]+\s*/g,' ').replace(/\s+/g,' ').trim();
 return raw;
}

function effective(e){const base=defaultGeometry(e),patch=overrides[e.id]||{};return {...base,...patch,style:{...(base.style||{}),...(patch.style||{})}}}
function val(e){const data=getRole(e.role);return data!==null?data:e.text||''}
function chosenTheme(){return THEMES.find(t=>t.id===themeId)||THEMES[0]}
function isLight(hex){if(!hex)return false;let a=hex.replace('#','');if(a.length!==6)return false;const [r,g,b]=[0,2,4].map(i=>parseInt(a.slice(i,i+2),16));return(r*299+g*587+b*114)/1000>174}
function colorFor(e){
 // A user's explicit fine-tuning color always wins over automatic theme colors.
 const custom=overrides[e.id]?.style?.color;
 if(custom)return custom;
 const th=chosenTheme(), role=e.role||'';
 if(th.source){
  const ppt=DB.templates.find(t=>t.slide===th.source);
  const matched=ppt?.elements.find(x=>x.kind==='text' && x.role===role);
  if(matched?.style?.color)return matched.style.color;
 }
 if(['day','month','time'].includes(role))return th.accent;
 if(['ampm','weekday','host','venue','eventTitle','dateLong'].includes(role))return th.text;
 if(role.startsWith('speaker')){
  if(role.endsWith('.name'))return th.accent;
  if(role.endsWith('.bio'))return th.bio;
  return th.text;
 }
 return th.text;
}
function rectColor(e){const panels=template.elements.filter(x=>x.kind==='rect');return e.id===panels[0]?.id?(panelOverrides.top||chosenTheme().panelTop):(panelOverrides.bottom||chosenTheme().panelBottom)}
function lineColor(e){return chosenTheme().text}
// Some PowerPoint logo bounding boxes extend outside the slide (while their
// artwork has transparent padding). Keep both complete logos in a safe zone.
function imageBox(e){
 if(/(?:sjtu|sfl)_logo_/i.test(e.src||'')){
  const upper=/sjtu_logo_/i.test(e.src);
  const ratio=upper?3.81:3.48;
  const w=172, h=w/ratio;
  return {...e,x:W-23-w,y:upper?17:98,w,h};
 }
 return {...e,x:Math.max(10,Math.min(e.x,W-e.w-10)),y:Math.max(8,Math.min(e.y,H-e.h-8))};
}
function linkedPanelMembers(panel){
 const panes=template.elements.filter(e=>e.kind==='rect');
 const isUpper=panes[0]?.id===panel.id;
 const one=template.count===1;
 return template.elements.filter(e=>{
  if(e.id===panel.id||e.kind==='background'||e.kind==='rect'||(e.kind==='image'&&/(?:sjtu|sfl)_logo_/i.test(e.src||'')))return false;
  const role=e.role||'';
  if(one){
   const lowerMember=['day','month','weekday','time','ampm','dateLong','venue','locationIcon'].includes(role)||/lucide_(?:clock|map_pin)_gold/.test(e.src||'');
   return isUpper?!lowerMember:lowerMember;
  }
  const upperMember=role==='eventTitle'||role==='host';
  return isUpper?upperMember:!upperMember;
 });
}
function nudgePanelContents(panel,previous,next,originalMembers){
 const members=originalMembers||linkedPanelMembers(panel).map(e=>({id:e.id,base:effective(e)}));
 const dx=next.x-previous.x,dy=next.y-previous.y,dh=next.h-previous.h;
 for(const {id,base} of members){
  const source=template.elements.find(e=>e.id===id);if(!source)continue;
  const patch=overrides[id]||(overrides[id]={});
  patch.x=Math.round((base.x+dx)*100)/100;
  patch.y=Math.round((base.y+dy)*100)/100;
  if(source.kind==='line'&&Math.abs(dh)>.01 && template.count>1){
   patch.h=Math.max(10,Math.round((base.h+dh)*100)/100);
  }
 }
}
function setPanelProperty(src,key,value){
 const prev=effective(src);const next={...prev,[key]:value};
 nudgePanelContents(src,prev,next);
 overrides[src.id]||={};overrides[src.id][key]=value;
 renderPoster();persist();
}
function make(tag,cls,style){const el=document.createElement(tag);if(cls)el.className=cls;if(style)Object.assign(el.style,style);return el}
function dimensions(e){return {left:e.x+'px',top:e.y+'px',width:Math.max(1,e.w)+'px',height:Math.max(1,e.h)+'px'}}
function isEditableImage(e){return e.kind==='portrait'||e.role==='locationIcon'}
function imageSelectionOverlay(e){
 const outline=make('div','poster-element asset-selection '+(e.kind==='portrait'?'portrait-selection':'icon-selection'),dimensions(e));
 outline.dataset.controlFor=e.id;
 const grip=make('div','asset-grip');grip.title='拖动缩放（保持比例）';
 grip.addEventListener('pointerdown',ev=>startDrag(ev,e.id,'se'));
 outline.append(grip);return outline;
}
function updateSelectionOverlay(e){
 const node=[...$('poster').querySelectorAll('.asset-selection')].find(x=>x.dataset.controlFor===e.id);
 if(node)Object.assign(node.style,dimensions(e));
}

function positionMeridian(){
 const all=[...$('poster').querySelectorAll('.text-el')];
 const byRole=role=>all.find(el=>template.elements.some(x=>x.id===el.dataset.source && x.role===role));
 const clock=byRole('time'),ap=byRole('ampm');
 if(!clock||!ap||!clock.textContent||!ap.textContent)return;
 const source=template.elements.find(e=>e.id===ap.dataset.source);
 if(overrides[source.id]?.x!=null)return; // deliberate manual placement
 const cs=getComputedStyle(clock),measure=document.createElement('canvas').getContext('2d');
 measure.font=`${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
 const right=parseFloat(clock.style.left)+4+measure.measureText(clock.textContent).width;
 ap.style.left=Math.round(Math.min(W-55,right+14))+'px';
}
function renderPoster(){
 const p=$('poster');p.replaceChildren();p.classList.toggle('show-guides',showGuides);
 const bgOverride=backgrounds.current;
 if(bgOverride){const el=make('img','poster-element background',{left:0,top:0,width:W+'px',height:H+'px',objectFit:'cover',objectPosition:`${bgFocusX}% ${bgFocusY}%`,});el.src=effectiveBackground(bgOverride);p.append(el)}
 template.elements.forEach(original=>{
  const e=effective(original);let el;const style=dimensions(e);
  if(e.kind==='background'){
   if(bgOverride)return;
   el=make('img','poster-element background',{...style,transform:`rotate(${e.rotation||0}deg)`,objectFit:'fill',transformOrigin:'50% 50%',});el.src=asset(effectiveBackground(e.src));
  }else if(e.kind==='rect'){
   el=make('div','poster-element rect'+(showGuides?' panel-editable':''),{...style,backgroundColor:rectColor(e),opacity:e.alpha});
   if(showGuides){
    el.dataset.key=e.id;
    el.classList.toggle('panel-selected',selectedId===e.id);
    el.title='点击选中色块，拖动位置；拉动边角调整宽高';
    el.addEventListener('pointerdown',event=>startDrag(event,e.id,false));
    if(selectedId===e.id){for(const corner of ['nw','ne','sw','se']){
      const handle=make('div','panel-handle panel-'+corner);handle.dataset.handle=corner;
      // Keep the bottom grips visible when PPT rectangles intentionally bleed past the page edge.
      if(corner.startsWith('s'))handle.style.bottom=Math.max(42,e.y+e.h-H+50)+'px';
      handle.addEventListener('pointerdown',event=>startDrag(event,e.id,corner));el.append(handle);
    }}
   }
  }else if(e.kind==='line'){
   el=make('div','poster-element line',{left:e.x+'px',top:e.y+'px',width:Math.max(1,e.w)+'px',height:Math.max(1,e.h)+'px',borderLeft:e.h>=e.w?`1.5px solid ${lineColor(e)}`:'none',borderTop:e.w>e.h?`1.5px solid ${lineColor(e)}`:'none'});
  }else if(e.kind==='image'){
   const b=imageBox(e);
   el=make('img', /logo_/i.test(e.src||'')?'poster-element logo':'poster-element icon-image'+(showGuides && isEditableImage(e)?' movable-asset':''),{
      ...dimensions(b),objectFit:'contain'});
   el.src=asset(e.src);
   if(showGuides&&isEditableImage(e)){
     el.dataset.key=e.id;el.title='拖动图标改变位置；选中后拖动右下角缩放';
     el.addEventListener('pointerdown',ev=>startDrag(ev,e.id,false));
   }
  }else if(e.kind==='portrait'){
   const num=parseInt(e.role?.match(/speaker(\d+)/)?.[1]||0)-1;
   el=make('div','poster-element portrait'+(showGuides?' movable-asset':''),style);
   if(showGuides){
     el.dataset.key=e.id;el.title='拖动头像改变位置；选中后拖动右下角缩放。替换照片请在左侧操作。';
     el.addEventListener('pointerdown',ev=>startDrag(ev,e.id,false));
   }
   let src=photos[num]||e.src;
   if(src){
    const img=make('img');img.src=asset(src);
    const zoom=1.15*(photoZoom[num]||1),x=(photoX[num]??50)/100,y=(photoY[num]??50)/100;
    img.style.width=(zoom*100)+'%';img.style.height=(zoom*100)+'%';
    img.style.left=(-100*(zoom-1)*x)+'%';img.style.top=(-100*(zoom-1)*y)+'%';
    img.style.objectFit='cover';img.style.objectPosition=`${photoX[num]??50}% ${photoY[num]??50}%`;
    el.append(img);
   }
   // Upload is restricted to the left-hand image panel; canvas controls placement only.
  }else if(e.kind==='text'){
   const s=e.style||{};
   el=make('div','poster-element text-el',{...style,fontSize:(s.size||24)+'px',fontWeight:String(s.weight||400),fontStyle:s.italic?'italic':'normal',color:colorFor(e),lineHeight:String(s.lineHeight||1.13),textAlign:s.align||'left',transform:e.rotation?`rotate(${e.rotation}deg)`:'none',transformOrigin:'50% 50%'});
   // PPT's short name boxes were built for names like 'Ye Li'.  Imported
   // names may contain titles and Chinese characters; keep the name on one
   // line in the available speaker column rather than overlapping the bio.
   if(e.role?.endsWith('.name') && !overrides[e.id]?.w && !val(e).includes('\n')){
     const room=Math.max(e.w,Math.min(450,W-e.x-38));
     el.style.width=room+'px';el.style.whiteSpace='nowrap';
   }
   if(e.role==='time'||e.role==='ampm'){el.style.whiteSpace='nowrap';el.style.overflowWrap='normal';}
   const value=displayedText(e);
   if(e.role==='eventTitle'&&template.slide===1&&value.includes('\n')){
    const [top,...rest]=value.split('\n');const a=make('span','poster-title-main');a.textContent=top;const b=make('span','poster-title-sub');b.textContent=rest.join('\n');el.append(a,b);
   }else if(template.slide===1&&e.role==='speaker1.title'&&value.includes('Künstlerroman')){const [before,after]=value.split('Künstlerroman');el.append(document.createTextNode(before));const em=make('em');em.textContent='Künstlerroman';el.append(em,document.createTextNode(after||''))}else if(e.role==='venue'&&value.includes('\n')){const [lead,...rest]=value.split('\n');const a=make('span');a.style.display='block';a.style.fontWeight='700';a.textContent=lead;const b=make('span');b.style.display='block';b.style.fontWeight='400';b.style.fontSize='.78em';b.textContent=rest.join('\n');el.append(a,b)}else if(!value && template.count===4 && /^speaker4\.(title|name|bio)$/.test(e.role||'')){const hint=make('span','empty-placeholder');hint.textContent=e.role.endsWith('.title')?'Talk title · 请填写':e.role.endsWith('.name')?'Speaker 4 · 待填写':'Title / Affiliation';el.append(hint)}else el.textContent=value;
   el.dataset.source=e.id;
   if(showGuides){
    el.dataset.key=e.id;
    el.classList.toggle('selected',selectedId===e.id);
    el.title='点击选中，拖动定位；双击编辑文字';
    el.addEventListener('pointerdown',event=>startDrag(event,e.id,false));
    el.addEventListener('dblclick',event=>beginInlineEdit(event,e.id));
    if(selectedId===e.id){const h=make('div','resize-handle');h.addEventListener('pointerdown',event=>startDrag(event,e.id,true));el.append(h)}
   }
  }else return;
  p.append(el);
 });
 if(showGuides && selectedId){
   const selected=template.elements.find(e=>e.id===selectedId);
   if(selected&&isEditableImage(selected))p.append(imageSelectionOverlay(effective(selected)));
 }
 positionMeridian();
 $('template-info').textContent=`${template.count} 位主讲人 · ${chosenTheme().name}`;
 $('poster-size').textContent=`${Math.round(W)} × ${Math.round(H)}（设计坐标）`;
 updateOverflows();
}
function updateOverflows(){requestAnimationFrame(()=>{document.querySelectorAll('#poster .text-el').forEach(el=>{
 // Small layouts must adapt to real text, instead of inheriting an oversized
 // font from the PPT placeholder. A manually-set font size always wins.
 const source=template.elements.find(item=>item.id===el.dataset.source),role=source?.role||'';
 const userSize=overrides[el.dataset.source]?.style?.size;
 let minimum=null;
 if(!userSize && !el.isContentEditable){
  if(template.count===4){
   if(/^speaker\d+\.title$/.test(role))minimum=17;
   else if(/^speaker\d+\.bio$/.test(role))minimum=13;
   else if(role==='venue')minimum=16;
   else if(role==='eventTitle')minimum=29;
  }else if(template.count===1){
   if(role==='eventTitle')minimum=31;
   else if(role==='speaker1.bio')minimum=17;
  }
 }
 if(minimum!=null && el.scrollHeight>el.offsetHeight+4){
  let fs=parseFloat(el.style.fontSize);
  while(fs>minimum && el.scrollHeight>el.offsetHeight+4){fs=Math.max(minimum,fs-0.5);el.style.fontSize=fs+'px';}
 }
 const tooHigh=el.scrollHeight>el.offsetHeight+7;
 el.classList.toggle('overflowed',tooHigh && showGuides && selectedId===el.dataset.source);
 });});}
function updateScale(){const st=$('preview-stage');if(!st||!st.clientWidth)return;const pad=window.innerWidth>750?80:24;const width=Math.max(200,st.clientWidth-pad),height=window.innerWidth>750?window.innerHeight-230:650;previewScale=Math.min(width/W,height/H,.83);$('poster-holder').style.width=(W*previewScale)+'px';$('poster-holder').style.height=(H*previewScale)+'px';$('poster').style.transform=`scale(${previewScale})`;}
function setSelection(id){selectedId=id;renderPoster();renderElementEditor()}
function startDrag(event,id,resize){if(event.button!==0||!showGuides||event.target.closest('[contenteditable="true"]'))return;
 event.preventDefault();event.stopPropagation();
 if(selectedId!==id){selectedId=id;renderElementEditor()}
 const source=template.elements.find(e=>e.id===id);if(!source)return;
 const e=effective(source);dragState={id,resize,x:event.clientX,y:event.clientY,base:{x:e.x,y:e.y,w:e.w,h:e.h},el:null,members:source.kind==='rect'?linkedPanelMembers(source).map(m=>({id:m.id,base:effective(m)})):null};
 let node=$('poster').querySelector(`[data-key="${id}"]`);if(!node){renderPoster();node=$('poster').querySelector(`[data-key="${id}"]`)}
 if(!node)return;node.classList.add('selected');dragState.el=node;
 window.addEventListener('pointermove',dragMove);window.addEventListener('pointerup',stopDrag,{once:true});
}
function dragMove(event){if(!dragState)return;const d=dragState;
 const dx=(event.clientX-d.x)/previewScale,dy=(event.clientY-d.y)/previewScale;
 const patch=overrides[d.id]||(overrides[d.id]={});const source=template.elements.find(e=>e.id===d.id);
 if(d.resize){
  const corner=typeof d.resize==='string'?d.resize:'se';
  const right=d.base.x+d.base.w,bottom=d.base.y+d.base.h;
  let left=d.base.x,top=d.base.y,newRight=right,newBottom=bottom;
  if(corner.includes('w'))left=Math.min(right-45,d.base.x+dx);
  if(corner.includes('e'))newRight=Math.max(left+45,right+dx);
  if(corner.includes('n'))top=Math.min(bottom-35,d.base.y+dy);
  if(corner.includes('s'))newBottom=Math.max(top+35,bottom+dy);
  patch.x=Math.round(left);patch.y=Math.round(top);
  patch.w=Math.round(newRight-left);patch.h=Math.round(newBottom-top);
  if(isEditableImage(source)){
    // Avatars must remain circles, and map-pins must retain their aspect ratio.
    const ratio=d.base.w/d.base.h;
    const inc=Math.abs(dx)>Math.abs(dy*ratio)?dx:dy*ratio;
    patch.x=Math.round(d.base.x);patch.y=Math.round(d.base.y);
    patch.w=Math.round(Math.max(28,d.base.w+inc));
    patch.h=Math.round(patch.w/ratio);
  }
 }else{patch.x=Math.round(d.base.x+dx);patch.y=Math.round(d.base.y+dy)}
 if(d.members){
  nudgePanelContents(source,d.base,effective(source),d.members);
  renderPoster();
 }else {Object.assign(d.el.style,dimensions(effective(source)));updateSelectionOverlay(effective(source))}
 renderElementEditor(true);updateOverflows();
}
function stopDrag(){window.removeEventListener('pointermove',dragMove);if(!dragState)return;dragState=null;persist();renderPoster()}
function beginInlineEdit(event,id){event.preventDefault();event.stopPropagation();selectedId=id;renderPoster();renderElementEditor();let el=$('poster').querySelector(`[data-key="${id}"]`);if(!el)return;
 const e=template.elements.find(a=>a.id===id),role=e.role;
 // convert mixed title styling to plain text only when typing directly
 el.textContent=val(e);el.contentEditable='true';el.classList.add('editing');el.focus();
 const sel=window.getSelection(),range=document.createRange();range.selectNodeContents(el);range.collapse(false);sel.removeAllRanges();sel.addRange(range);
 const onBlur=()=>{const text=el.innerText.replace(/\r/g,'').replace(/\n$/,'');if(role?.startsWith('extra.')){overrides[id]||={};overrides[id].text=text}else if(role)setRole(role,text);el.removeEventListener('blur',onBlur);persist();renderPoster();renderFieldEditor();renderElementEditor()};
 el.addEventListener('blur',onBlur);
 el.onkeydown=ev=>{ev.stopPropagation();if(ev.key==='Escape')el.blur()};
}
function clearAllText(){
 textRoleKeys.forEach(key=>fields[key]='');fields.speakers=Array.from({length:4},()=>({title:'',name:'',bio:''}));
 $('raw-paste').value='';$('parse-report').hidden=true;$('unmatched-box').hidden=true;lastUnmatched=[];selectedId=null;
 renderFieldEditor();renderPoster();renderElementEditor();persist();notify('已清空所有文字，图片和版式保持不变');
}
function clearEdits(){template.elements.forEach(e=>delete overrides[e.id]);selectedId=null;renderPoster();renderElementEditor();persist();notify('当前版式的位置与字号已恢复为 PPT 默认值')}
function switchCount(count){
 const next=baseTemplate(Number(count));if(!next)return;
 template=next;selectedId=null;overrides={};
 renderControls();renderPoster();renderFieldEditor();renderImages();renderElementEditor();updateScale();persist();
}
function renderControls(){
 $('speaker-count').replaceChildren();[1,2,3,4].forEach(n=>{const b=make('button',n===template.count?'active':'');b.textContent=n+' 人';b.onclick=()=>switchCount(n);$('speaker-count').append(b)});
 const themes=$('theme-list');themes.replaceChildren();THEMES.forEach(t=>{
  const b=make('button','theme-swatch'+(themeId===t.id?' active':''));
  b.style.background=t.panelTop.toLowerCase()===t.panelBottom.toLowerCase()?t.panelTop:`linear-gradient(135deg, ${t.panelTop} 0%, ${t.panelTop} 49%, ${t.panelBottom} 51%, ${t.panelBottom} 100%)`;
  b.title=t.name+`（上：${t.panelTop}／下：${t.panelBottom}）`;b.type='button';b.setAttribute('aria-label',t.name);
  b.onclick=()=>{themeId=t.id;panelOverrides={};const next=baseTemplate(template.count);if(next&&next.slide!==template.slide){template=next;selectedId=null;}renderControls();renderPoster();renderElementEditor();persist()};themes.append(b)
 });

}
const section=(title)=>{const root=make('div','field-group');const h=make('div','field-group-title');h.textContent=title;root.append(h);return root};
function field(label,role,rows=1){const wrap=make('div','field');const lbl=make('label');lbl.textContent=label;const ctrl=rows>1?make('textarea'):make('input');if(rows>1)ctrl.rows=rows;else ctrl.type='text';ctrl.value=getRole(role)||'';ctrl.addEventListener('input',()=>{setRole(role,ctrl.value);renderPoster();persist()});wrap.append(lbl,ctrl);return wrap}
function renderFieldEditor(){const root=$('field-editor');root.replaceChildren();const basic=section('活动基本信息');basic.append(field('活动标题（Enter 换行）','eventTitle',3),field('主持人 / Chair','host',2));root.append(basic);
 const when=section('日期与地点');const date=make('div','form-grid');date.append(field('日期数字','day'),field('月份','month'),field('星期','weekday'),field('AM / PM','ampm'));when.append(date,field('开始与结束时间','time',2),field('日期完整写法（1人/4人版）','dateLong'),field('活动地点','venue',3));root.append(when);
 for(let n=1;n<=template.count;n++){const sp=section(`主讲人 ${n}`);sp.append(field('演讲标题',`speaker${n}.title`,2),field('姓名',`speaker${n}.name`),field('职称及机构',`speaker${n}.bio`,3));root.append(sp)}
}
function renderImages(){const root=$('image-controls');root.replaceChildren();
 const mono=make('label');mono.style.display='flex';mono.style.alignItems='center';mono.style.gap='8px';const chk=make('input');chk.type='checkbox';chk.checked=monoBackground;chk.style.width='auto';chk.onchange=()=>{monoBackground=chk.checked;renderPoster();persist()};mono.append(chk,document.createTextNode('背景黑白与淡化'));root.append(mono);
 const blbl=make('label');blbl.textContent='背景裁切水平位置';const br=make('input');br.type='range';br.min=0;br.max=100;br.value=bgFocusX;br.oninput=()=>{bgFocusX=Number(br.value);renderPoster();persist()};root.append(blbl,br);
 for(let n=0;n<template.count;n++){
 const wrap=make('div','image-item');const img=make('img','photo-thumb');img.src=asset(photos[n]||'assets/speaker_'+(n+1)+'.png');if(n===3&&!photos[n])img.style.opacity='.15';
 const ct=make('div');const label=make('b');label.textContent=`Speaker ${n+1} 头像`;
 const open=make('button');open.textContent='替换图片';open.onclick=()=>selectPortrait(n);
 const z=make('input');z.type='range';z.min=1;z.max=2.5;z.step=.05;z.value=photoZoom[n]||1;z.title='头像缩放';z.addEventListener('input',()=>{photoZoom[n]=Number(z.value);renderPoster();persist()});
 const y=make('input');y.type='range';y.min=0;y.max=100;y.step=1;y.value=photoY[n]??50;y.title='头像裁切上下位置';y.addEventListener('input',()=>{photoY[n]=Number(y.value);renderPoster();persist()});
 const x=make('input');x.type='range';x.min=0;x.max=100;x.step=1;x.value=photoX[n]??50;x.title='头像裁切水平位置';x.addEventListener('input',()=>{photoX[n]=Number(x.value);renderPoster();persist()});const zl=make('label');zl.textContent='缩放';const xl=make('label');xl.textContent='左右位置';const yl=make('label');yl.textContent='上下位置';ct.append(label,zl,z,xl,x,yl,y);wrap.append(img,ct,open);root.append(wrap);
 }}
function selectPortrait(index){const f=document.createElement('input');f.type='file';f.accept='image/*';f.onchange=()=>{const file=f.files?.[0];if(!file)return;readImage(file,src=>{photos[index]=src;photoZoom[index]=1;photoY[index]=50;photoX[index]=50;renderImages();renderPoster();persist();notify('头像已替换')})};f.click()}
function readImage(file,callback){if(!file.type.startsWith('image/'))return notify('请选择图片文件');if(file.size>10e6)notify('大图片可能导致配置无法自动保存，建议压缩后上传');const r=new FileReader();r.onload=()=>callback(r.result);r.readAsDataURL(file)}
async function preprocessPhoto(src){
 const img=await new Promise((resolve,reject)=>{const it=new Image();it.onload=()=>resolve(it);it.onerror=reject;it.src=src});
 const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
 const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0);
 const px=g.getImageData(0,0,c.width,c.height),d=px.data;
 for(let i=0;i<d.length;i+=4){const gray=Math.round(.299*d[i]+.587*d[i+1]+.114*d[i+2]);const toned=Math.round(gray*.42+245*.58);d[i]=d[i+1]=d[i+2]=toned;}
 g.putImageData(px,0,0);return c.toDataURL('image/jpeg',.93);
}
function renderPanelEditor(root,src,lite=false){
 const panelIndex=template.elements.filter(e=>e.kind==='rect').findIndex(e=>e.id===src.id);
 const e=effective(src);
 if(lite){root.querySelectorAll('input[data-prop]').forEach(inp=>{inp.value=e[inp.dataset.prop]??''});return;}
 root.replaceChildren();
 const title=make('div','field-group-title');title.textContent=panelIndex===0?'上方背景色块':'下方背景色块';root.append(title);
 const hint=make('p','hint');hint.textContent='拖动色块会带动所属区域的文字、Speaker 侧边线与图标一起移动；拉伸底边会同步调整侧边线长度。也可在这里输入精确坐标。';root.append(hint);
 const grid=make('div','two-col');
 [['x','X 位置'],['y','Y 位置'],['w','宽度'],['h','高度']].forEach(([key,label])=>{
  const cell=make('div','field-small'),name=make('label');name.textContent=label;
  const inp=make('input');inp.type='number';inp.dataset.prop=key;inp.step='1';inp.value=Math.round(e[key]);
  inp.onchange=()=>setPanelProperty(src,key,Number(inp.value));
  cell.append(name,inp);grid.append(cell);
 });root.append(grid);
 const reset=make('button','btn ghost full');reset.textContent='恢复该色块默认位置与大小';reset.onclick=()=>{const before=effective(src);const after=defaultGeometry(src);nudgePanelContents(src,before,after);delete overrides[src.id];selectedId=null;renderPoster();renderElementEditor();persist()};root.append(reset);
}
function renderElementEditor(lite=false){const root=$('element-editor');const src=template.elements.find(e=>e.id===selectedId);
 if(src?.kind==='rect'){renderPanelEditor(root,src,lite);return}
 if(src&&isEditableImage(src)){
   const e=effective(src);
   if(lite){root.querySelectorAll('input[data-prop]').forEach(inp=>{inp.value=Math.round(e[inp.dataset.prop]??0)});return}
   root.replaceChildren();
   const header=make('div','field-group-title');header.textContent=src.kind==='portrait'?'头像位置与大小':'地点图标位置与大小';root.append(header);
   const note=make('p','hint');note.textContent=src.kind==='portrait'?'直接拖动头像，或拉动右下角调整直径；更换照片与裁切在左侧操作。':'直接拖动图标，或拉动右下角缩放。';root.append(note);
   const grid=make('div','two-col');
   [['x','水平位置'],['y','垂直位置'],['w',src.kind==='portrait'?'直径':'宽度']].forEach(([key,label])=>{
     const cell=make('div','field-small'), lbl=make('label');lbl.textContent=label;
     const input=make('input');input.type='number';input.step=1;input.dataset.prop=key;input.value=Math.round(e[key]);
     input.onchange=()=>{overrides[src.id]||={};overrides[src.id][key]=Number(input.value);if(key==='w')overrides[src.id].h=Math.round(Number(input.value)*e.h/e.w);renderPoster();renderElementEditor();persist()};
     cell.append(lbl,input);grid.append(cell);
   });root.append(grid);
   const reset=make('button','btn ghost full');reset.textContent='恢复默认位置与大小';reset.onclick=()=>{delete overrides[src.id];renderPoster();renderElementEditor();persist()};root.append(reset);
   return;
 }

 if(!src||src.kind!=='text'){if(!lite){root.replaceChildren();const msg=make('div','empty');msg.textContent='点击海报上的色块或文字，拖动调整位置；拖动边角调整大小。';root.append(msg)}return;}
 const e=effective(src);if(lite){root.querySelectorAll('input[data-prop]').forEach(inp=>{inp.value=e[inp.dataset.prop]??''});return}
 root.replaceChildren();const role=make('div','fine-info');role.textContent=`对象：${src.role||src.pptName} · 源自 PPT 第 ${template.slide} 页`;root.append(role);
 const content=make('textarea');content.rows=3;content.value=val(e);content.oninput=()=>{if(src.role?.startsWith('extra.')){overrides[src.id]||={};overrides[src.id].text=content.value}else setRole(src.role,content.value);renderPoster();persist()};root.append(content);
 const grid=make('div','two-col');[['x','X 位置'],['y','Y 位置'],['w','文本框宽度'],['h','文本框高度']].forEach(([key,name])=>{
  const cell=make('div','field-small');const label=make('label');label.textContent=name;const inp=make('input');inp.type='number';inp.dataset.prop=key;inp.value=e[key];inp.step=1;inp.addEventListener('change',()=>{overrides[src.id]||={};overrides[src.id][key]=Number(inp.value);renderPoster();persist()});cell.append(label,inp);grid.append(cell)});root.append(grid);
 const sizeCell=make('div','field-small');const szlabel=make('label');szlabel.textContent='字号（设计 px）';const sz=make('input');sz.type='number';sz.min='9';sz.max='130';sz.step='1';sz.value=e.style.size||25;sz.addEventListener('change',()=>{overrides[src.id]||={};overrides[src.id].style||={};overrides[src.id].style.size=Number(sz.value);renderPoster();persist()});sizeCell.append(szlabel,sz);root.append(sizeCell);
 const colorCell=make('div','field-small');const colorLabel=make('label');colorLabel.textContent='文字颜色（选中文字框独立修改）';const ci=make('input');ci.type='color';ci.value=colorFor(src);ci.oninput=()=>{overrides[src.id]||={};overrides[src.id].style||={};overrides[src.id].style.color=ci.value;renderPoster();persist()};colorCell.append(colorLabel,ci);root.append(colorCell);
 const lineCell=make('div','field-small');const lbl=make('label');lbl.textContent='行距（倍数）';const inp=make('input');inp.type='number';inp.min=.8;inp.max=2;inp.step=.05;inp.value=e.style.lineHeight||1.13;inp.onchange=()=>{overrides[src.id]||={};overrides[src.id].style||={};overrides[src.id].style.lineHeight=Number(inp.value);renderPoster();persist()};lineCell.append(lbl,inp);root.append(lineCell);
 const reset=make('button','btn ghost full');reset.textContent='恢复此文本框默认位置与样式';reset.onclick=()=>{delete overrides[src.id];renderPoster();renderElementEditor();persist()};root.append(reset);
}
function getLines(raw){return raw.replace(/\r\n?/g,'\n').split('\n').map(x=>x.trim()).filter(Boolean)}
const MONTH_NAMES=['January','February','March','April','May','June','July','August','September','October','November','December'];
function separateDateTime(text){
 const out={};const src=String(text||'').trim();let remainder=src;
 // ISO style: 2026/11/26 Thursday 14:00-16:45 and 2026年11月26日
 const iso=src.match(/\b(20\d{2})\s*[\/.-]\s*(0?[1-9]|1[0-2])\s*[\/.-]\s*(0?[1-9]|[12]\d|3[01])\b/)||src.match(/(20\d{2})\s*年\s*(0?[1-9]|1[0-2])\s*月\s*(0?[1-9]|[12]\d|3[01])\s*日?/);
 let year=null,month=null,day=null;
 if(iso){year=Number(iso[1]);month=Number(iso[2]);day=Number(iso[3]);remainder=remainder.replace(iso[0],' ')}
 else{
  const named=src.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:,?\s*(20\d{2}))?\b/i);
  if(named){month=MONTH_NAMES.findIndex(m=>m.toLowerCase()===named[1].toLowerCase())+1;day=Number(named[2]);year=named[3]?Number(named[3]):null;remainder=remainder.replace(named[0],' ')}
 }
 if(month&&day){out.month=MONTH_NAMES[month-1];out.day=String(day).padStart(2,'0');}
 const week=src.match(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i);
 if(week){out.weekday=week[1].slice(0,1).toUpperCase()+week[1].slice(1).toLowerCase();remainder=remainder.replace(week[0],' ')}
 // Treat a clock interval separately, not as part of the date.
 const t=src.match(/\b(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[-–—~至到]\s*(\d{1,2}):(\d{2})\s*(AM|PM)?\b/i);
 if(t){let sh=Number(t[1]),sm=t[2],eh=Number(t[4]),em=t[5];const ap1=(t[3]||'').toUpperCase(),ap2=(t[6]||'').toUpperCase();
  const valid=sh<=23&&eh<=23&&Number(sm)<60&&Number(em)<60;
  if(valid){const use24=(!ap1&&!ap2)&&(sh>12||eh>12);const endMer=ap2||(eh>=12?'PM':'AM');const startMer=ap1||(ap2 && sh<=12?ap2:(sh>=12?'PM':'AM'));
   const fmt=h=>String(h%12||12);const bothSame=(startMer===endMer);
   if(use24 || ap1 || ap2){out.time=`${fmt(sh)}:${sm}${bothSame?'':` ${startMer}`} –\n${fmt(eh)}:${em}`;out.ampm=bothSame?endMer:'';}
   else{out.time=`${sh}:${sm} –\n${eh}:${em}`;out.ampm=(sh<=12&&eh<=12)?'':endMer;}
  }
  remainder=remainder.replace(t[0],' ');
 }
 if(month&&day){out.dateLong=`${out.month} ${day}, ${out.weekday||''}`.replace(/,\s*$/,'');}
 return {fields:out,remaining:remainder.replace(/^[\s,:：;|]+|[\s,:：;|]+$/g,'')};
}
// Parse free-form lecture announcements by a state machine instead of guessing
// whether each unlabelled line is the event title. A recognized speaker line
// terminates its preceding talk-title block and starts a new speaker record.
function analyze(raw){
 const lines=getLines(raw), updated={speakers:[]}, rest=[];
 const used=new Set();let found=0;
 const speakerRole=/(?:\b(?:postdoc(?:toral)?|professor|lecturer|researcher|fellow|associate|assistant|dean|director|doctoral|ph\.?d|faculty|university|institute|school|department|senior\s+scientist|visiting\s+scholar|research\s+assistant|college|academia)\b|研究员|教授|讲师|博士|副教授|大学|学院|研究所)/i;
 const personPrefix=/^(?:Dr\.?|Prof\.?|Professor|Mr\.?|Ms\.?|Mrs\.?)\s+/i;
 const bareName=/^[A-Z][\p{L}.'’-]+(?:\s+[A-Z][\p{L}.'’-]+){1,4}(?:\s*[（(][^()（）]+[)）])?$/u;
 const isPerson=(s,next='')=>{
  if(/^(?:speaker|presenter|主讲人|嘉宾)\s*(?:\d+|[一二三四])?\s*[:：]/i.test(s))return true;
  const comma=s.match(/^([^,，]{3,65})[,，]\s*(.+)$/);
  if(comma&&speakerRole.test(comma[2])&&(personPrefix.test(comma[1])||bareName.test(comma[1])))return true;
  if(personPrefix.test(s) && s.length<85 && !/^(?:dr\.?|prof\.?)\s+[^,]+\b(?:chair|host|moderator)\b/i.test(s))return true;
  if(bareName.test(s)&&speakerRole.test(next))return true;
  return false;
 };
 const firstSpeaker=lines.findIndex((s,i)=>isPerson(s,lines[i+1]||''));
 const headEnd=firstSpeaker<0?lines.length:firstSpeaker;
 const talkBoundary=firstSpeaker>=0 ? (()=>{
  // The last unlabelled line before the first person's name is their talk title;
  // metadata lines (date, host, venue) mark the end of the event header.
  let lastMeta=-1;
  for(let i=0;i<firstSpeaker;i++){
   const s=lines[i];
   if(/\b(?:chaired\s+by|hosted\s+by|moderated\s+by|moderator|主持人|date|venue|location|room|hall|auditorium|classroom|campus|地点)\b/i.test(s)||separateDateTime(s).fields.day){lastMeta=i;}
  }
  return lastMeta+1;
 })() : headEnd;
 // 1. Recognize metadata only BEFORE the first speaker and before speaker titles.
 let firstMetadata=headEnd;
 for(let i=0;i<headEnd;i++){
  const s=lines[i];const dt=separateDateTime(s);
  if(dt.fields.day||dt.fields.time){Object.assign(updated,dt.fields);used.add(i);firstMetadata=Math.min(firstMetadata,i);found++;continue}
  let m=s.match(/^(?:host(?:ed\s*by)?|chaired\s*by|moderated\s*by|moderator|chair|主持人?)\s*[:：-]?\s*(.*)$/i);
  if(m){updated.host=/^(?:chaired|hosted|moderated)\s+by\b/i.test(s)?s:m[1];used.add(i);firstMetadata=Math.min(firstMetadata,i);found++;continue}
  m=s.match(/^(?:event\s*title|forum\s*title|活动标题|活动名称|讲座名称|讲座标题)\s*[:：-]\s*(.+)$/i);
  if(m){updated.eventTitle=m[1];used.add(i);found++;continue}
  m=s.match(/^(?:venue|location|place|room|地点|地址|会场)\s*[:：-]\s*(.+)$/i);
  if(m){updated.venue=m[1];used.add(i);firstMetadata=Math.min(firstMetadata,i);found++;continue}
  // A plain venue can look like "East Upper Hall 402" (no field label).
  if(i>0&&/\b(?:hall|room|classroom|auditorium|building|campus)\b/i.test(s)&&
      !/\b(?:lecture\s+series|research\s+forum|intermedial\s+studies)\b/i.test(s)){
    updated.venue=updated.venue?updated.venue+'\n'+s:s;used.add(i);firstMetadata=Math.min(firstMetadata,i);found++;continue;
  }
  // Labeled talk title can occur just before the first speaker.
 }
 // 2. The event title is the unclaimed text BEFORE the first host/date/venue.
 if(!updated.eventTitle){
  const titleLines=[];
  for(let i=0;i<Math.min(firstMetadata,firstSpeaker>=0?firstSpeaker:lines.length);i++){
   if(!used.has(i)&&!/^speakers?\s*[:：]?$/i.test(lines[i])){titleLines.push(lines[i]);used.add(i)}
  }
  if(titleLines.length){updated.eventTitle=titleLines.join('\n');found++;}
 }
 // Remaining content BEFORE the first speaker belongs to the speaker section,
 // not to the event headline (even if there are no explicit Speaker labels).
 const contentStart=firstSpeaker>=0?Math.min(talkBoundary,firstSpeaker):headEnd;
 let pendingTitle=[];let current=null;
 const pushSpeaker=(name,bio)=>{
  current={title:pendingTitle.join('\n').trim(),name:name||'',bio:bio||''};
  pendingTitle=[];updated.speakers.push(current);found++;
 };
 for(let i=contentStart;i<lines.length;i++){
  if(used.has(i))continue;
  const s=lines[i];if(/^(?:speakers?|主讲人(?:名单)?|嘉宾(?:介绍)?)\s*[:：]?$/i.test(s)){used.add(i);continue}
  let m=s.match(/^(?:talk(?:\s*title)?|presentation(?:\s*title)?|lecture(?:\s*title)?|title|演讲(?:标题|题目)?|报告题目|发言主题)\s*[:：-]\s*(.+)$/i);
  if(m){if(current&&!current.title)current.title=m[1];else pendingTitle.push(m[1]);used.add(i);found++;continue}
  m=s.match(/^(?:name|姓名|speaker\s*name)\s*[:：-]\s*(.+)$/i);
  if(m){if(current&&!current.name)current.name=m[1];else pushSpeaker(m[1],'');used.add(i);continue}
  m=s.match(/^(?:position|affiliation|institution|bio|title\s*\/\s*affiliation|职称|单位|机构|身份|简介)\s*[:：-]\s*(.+)$/i);
  if(m){if(current){current.bio+=(current.bio?'\n':'')+m[1];used.add(i);found++}else rest.push(s);continue}
  m=s.match(/^(?:speaker|主讲人|嘉宾|presenter)\s*#?\s*(?:\d+|[一二三四])?\s*[:：-]\s*(.*)$/i);
  if(m){const value=m[1].trim();const cm=value.match(/^([^,，]+)[,，]\s*(.*)$/);
    if(cm && speakerRole.test(cm[2]))pushSpeaker(cm[1].trim(),cm[2].trim());
    else pushSpeaker(value,'');used.add(i);continue;
  }
  if(isPerson(s,lines[i+1]||'')){
    const comma=s.match(/^([^,，]+)[,，]\s*(.*)$/);
    if(comma&&speakerRole.test(comma[2]))pushSpeaker(comma[1].trim(),comma[2].trim());
    else pushSpeaker(s,'');
    used.add(i);continue;
  }
  if(current&&speakerRole.test(s)&&!pendingTitle.length){
   current.bio+=(current.bio?'\n':'')+s;used.add(i);found++;continue;
  }
  // The title of the NEXT speaker usually appears immediately after the
  // previous speaker's affiliation; don't append it to that affiliation.
  pendingTitle.push(s);used.add(i);
 }
 if(pendingTitle.length)rest.push(...pendingTitle);
 if(updated.speakers.length){
  // Prevent stale fourth speaker content when fewer were recognized.
  updated.speakers=updated.speakers.slice(0,4);
  for(const sp of updated.speakers){
   if(!sp.title)rest.push(`缺少演讲题目：${sp.name||'未命名主讲人'}`);
   if(!sp.name)rest.push(`演讲题目未匹配姓名：${sp.title}`);
  }
 }
 for(let i=0;i<lines.length;i++)if(!used.has(i))rest.push(lines[i]);
 return {updated,rest:[...new Set(rest)],found};
}
function applyParse(){const raw=$('raw-paste').value.trim();if(!raw)return notify('请先粘贴活动资料');const r=analyze(raw);const upd=r.updated;const newN=upd.speakers?.length||0;
 for(const [key,value] of Object.entries(upd)){if(key==='speakers'){fields.speakers=Array.from({length:4},(_,i)=>i<value.length?{title:value[i].title||'',name:value[i].name||'',bio:value[i].bio||''}:{title:'',name:'',bio:''})}else if(value)fields[key]=value}
 if(newN>0&&newN<=4&&newN!==template.count){const t=DB.templates.find(t=>t.count===newN);if(t)template=t}
 const n=r.found;lastUnmatched=r.rest;const report=$('parse-report');report.hidden=false;report.textContent=`已识别 ${n} 处信息${newN?'，检测到 '+newN+' 位主讲人':''}。请检查下方字段并修正；原文未被删除。`;
 $('unmatched-box').hidden=!r.rest.length;$('unmatched-text').textContent=r.rest.join('\n');
 selectedId=null;renderControls();renderFieldEditor();renderPoster();renderImages();renderElementEditor();updateScale();persist();notify('识别完成，请在“内容校对”中检查结果')
}
function example(){const demo=`Event Title: Research Forum: Intermedial Studies of Literature\nHost: Dr. Bowen Wang (English, SJTU)\nDate: November 26, Thursday\nTime: 2:00 – 4:45 PM\nVenue: 402, East Upper Hall, Shanghai Jiao Tong University, Minhang Campus\n\nSpeaker 1: Dr. Ye Li (黎晔)\nTalk Title: Artist’s Novel: The Künstlerroman in Transition\nAffiliation: Postdoc Researcher in English Literature, School of Foreign Languages, Shanghai Jiao Tong University\n\nSpeaker 2: Dr. Shuying Chen (陈书盈)\nTalk Title: Intermedial Entanglement between Literature and Theatre\nAffiliation: Lecturer in Comparative and World Literature, School of Humanities, Shanghai University\n\nSpeaker 3: Dr. Fei Xie (谢菲)\nTalk Title: Jazz as Sonic Activism in Mongo Beti’s Crime Fiction\nAffiliation: Lecturer in French Literature, Paris Elite Institute of Technology, Shanghai Jiao Tong University`;
 $('raw-paste').value=demo;applyParse();}
function downloadBlob(blob,filename){const link=document.createElement('a');const url=URL.createObjectURL(blob);link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),20000)}
async function exportJpg(){const btn=$('export-jpg');btn.disabled=true;btn.textContent='正在生成…';const poster=$('poster');const status=$('render-status');
 try{
  await document.fonts.ready;
  let canvas=null;
  if(window.html2canvas){
   const clone=poster.cloneNode(true);clone.id='export-poster';clone.style.transform='none';clone.style.position='fixed';clone.style.left='-12000px';clone.style.top='0';clone.style.width=W+'px';clone.style.height=H+'px';clone.classList.remove('show-guides');clone.querySelectorAll('.resize-handle,.asset-selection').forEach(x=>x.remove());clone.querySelectorAll('.selected,.overflowed,.editing').forEach(x=>x.classList.remove('selected','overflowed','editing'));
   document.body.append(clone);
   try{
    await Promise.all([...clone.querySelectorAll('img')].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=resolve;img.onerror=resolve;setTimeout(resolve,5000)})));
    try{canvas=await window.html2canvas(clone,{scale:EXPORT_SCALE,backgroundColor:'#fff',useCORS:true,allowTaint:false,logging:false,width:W,height:H,windowWidth:Math.max(1400,W),windowHeight:Math.max(1500,H),scrollX:0,scrollY:0});}
    catch(renderErr){console.warn('html2canvas failed; using safe fallback',renderErr);canvas=null}
   }finally{clone.remove()}
  }
  if(!canvas){status.textContent='使用兼容导出模式（可能有细微排版差异）';canvas=await drawFallback()}
  let blob;try{blob=await new Promise((resolve,reject)=>{try{canvas.toBlob(b=>b?resolve(b):reject(Error('无法导出图片')),'image/jpeg',.98)}catch(err){reject(err)}})}
  catch(err){console.warn('HTML snapshot cannot be exported; using origin-clean canvas',err);status.textContent='使用安全离线导出';canvas=await drawFallback();blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('兼容导出失败')),'image/jpeg',.98))}
  downloadBlob(blob,exportFilename());notify('JPG 海报已生成并下载');
 }catch(err){console.error(err);notify('导出失败：'+err.message)}finally{btn.disabled=false;btn.textContent='导出 JPG'}
}
function drawExactText(ctx,e,posterRect){
 const node=document.querySelector(`#poster .text-el[data-source="${e.id}"]`);
 if(!node)return false;
 const tree=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
 let textNode;
 const range=document.createRange();
 while(textNode=tree.nextNode()){
  const parent=textNode.parentElement;
  if(!parent || parent.classList.contains('resize-handle'))continue;
  const cs=getComputedStyle(parent), size=parseFloat(cs.fontSize)||24;
  ctx.save();ctx.fillStyle=cs.color;ctx.font=`${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
  // Range geometry is derived from browser layout, so forced line breaks and spans are identical.
  ctx.textBaseline='top';
  let offset=0;
  for(const character of textNode.textContent){
   const len=character.length;
   if(!/\s/u.test(character)){
    range.setStart(textNode,offset);range.setEnd(textNode,offset+len);
    const r=range.getBoundingClientRect();
    if(r.width>0 && r.height>0){
     const px=(r.left-posterRect.left)/previewScale;
     const py=(r.top-posterRect.top)/previewScale + Math.max(0,(r.height/previewScale-size)*.23);
     ctx.fillText(character,px,py);
    }
   }
   offset+=len;
  }
  ctx.restore();
 }
 return true;
}
async function drawFallback(){const canvas=document.createElement('canvas');canvas.width=Math.round(W*EXPORT_SCALE);canvas.height=Math.round(H*EXPORT_SCALE);const ctx=canvas.getContext('2d');ctx.scale(EXPORT_SCALE,EXPORT_SCALE);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
 async function getImg(src){if(!src)return null;return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=asset(src)})}
 const bg=backgrounds.current;if(bg){const img=await getImg(effectiveBackground(bg));if(img){const scale=Math.max(W/img.width,H/img.height);ctx.save();ctx.drawImage(img,(W-img.width*scale)*bgFocusX/100,(H-img.height*scale)*bgFocusY/100,img.width*scale,img.height*scale);ctx.restore()}}
 for(const original of template.elements){let e=effective(original);ctx.save();
  if(e.kind==='background'&&!bg){const img=await getImg(effectiveBackground(e.src));if(img){ctx.translate(e.x+e.w/2,e.y+e.h/2);ctx.rotate((e.rotation||0)*Math.PI/180);ctx.drawImage(img,-e.w/2,-e.h/2,e.w,e.h)}}
  if(e.kind==='rect'){ctx.globalAlpha=e.alpha;ctx.fillStyle=rectColor(e);ctx.fillRect(e.x,e.y,e.w,e.h)}
  if(e.kind==='line'){ctx.strokeStyle=lineColor(e);ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+e.w,e.y+e.h);ctx.stroke()}
  if(e.kind==='image'){const b=imageBox(e);const img=await getImg(e.src);if(img){ctx.drawImage(img,b.x,b.y,b.w,b.h)}}
  if(e.kind==='portrait'){
   const num=Number(e.role?.match(/speaker(\d+)/)?.[1]||1)-1;
   ctx.beginPath();ctx.arc(e.x+e.w/2,e.y+e.h/2,e.w/2,0,Math.PI*2);ctx.clip();
   ctx.fillStyle='#fff';ctx.fillRect(e.x,e.y,e.w,e.h);
   const img=await getImg(photos[num]||e.src);
   if(img){const zoom=1.15*(photoZoom[num]||1),x=(photoX[num]??50)/100,y=(photoY[num]??50)/100;
    const boxW=e.w*zoom,boxH=e.h*zoom;
    // Same object-fit:cover + object-position algorithm as the browser preview.
    const ratio=Math.max(boxW/img.width,boxH/img.height),sw=img.width*ratio,sh=img.height*ratio;
    const cropX=(boxW-sw)*x,cropY=(boxH-sh)*y;
    const imgX=e.x-(boxW-e.w)*x,imgY=e.y-(boxH-e.h)*y;
    ctx.drawImage(img,imgX+cropX,imgY+cropY,sw,sh);
   }
  }
  if(e.kind==='text'){
   if(!val(e)){ctx.restore();continue;}
   const posterRect=$('poster').getBoundingClientRect();
   if(!e.rotation && drawExactText(ctx,e,posterRect)){
    // CSS content layout is measured per glyph and projected into original design space.
   }else{
    const font=e.style||{},fs=font.size||24;
    ctx.fillStyle=colorFor(e);ctx.font=`${font.italic?'italic ':''}${font.weight||400} ${fs}px 'Google Sans',Arial,sans-serif`;
    ctx.textBaseline='top';
    if(e.rotation){ctx.translate(e.x+e.w/2,e.y+e.h/2);ctx.rotate(e.rotation*Math.PI/180);ctx.translate(-e.x-e.w/2,-e.y-e.h/2)}
    let y=e.y;for(const line of displayedText(e).split('\n')){ctx.fillText(line,e.x+4,y);y+=fs*(font.lineHeight||1.13)}
   }
  }
  ctx.restore();
 }
 return canvas;
}
function saveProject(){const json=JSON.stringify({version:1,templateId:template.slide,fields,overrides,panelOverrides,themeId,photoZoom,photoY,photoX,photos,backgrounds,monoBackground,bgFocusX,bgFocusY},null,2);downloadBlob(new Blob([json],{type:'application/json'}),'Research_Forum_project.json');notify('配置文件已保存')}
function importProject(file){const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);if(!data.fields?.speakers||!data.templateId)throw Error('不是有效的海报配置文件');template=DB.templates.find(t=>t.slide===data.templateId)||DB.templates[0];fields=data.fields;while(fields.speakers.length<4)fields.speakers.push({title:'',name:'',bio:''});overrides=data.overrides||{};themeId=THEMES.some(t=>t.id===data.themeId)?data.themeId:'red';photoZoom=data.photoZoom||[1,1,1,1];photoY=data.photoY||[50,50,50,50];photoX=data.photoX||[50,50,50,50];photos=data.photos||[];backgrounds=data.backgrounds||{};monoBackground=data.monoBackground!==false;bgFocusX=data.bgFocusX??50;bgFocusY=data.bgFocusY??50;selectedId=null;refresh();persist();notify('已导入配置')}catch(e){notify('无法读取配置：'+e.message)}};r.readAsText(file)}
function refresh(){renderControls();renderFieldEditor();renderImages();renderPoster();renderElementEditor();updateScale()}
function bind(){
 $('parse-btn').onclick=applyParse;$('sample-btn').onclick=example;$('reset-layout').onclick=clearEdits;
 $('export-jpg').onclick=exportJpg;$('clear-text').onclick=clearAllText;
 
 $('background-file').onchange=e=>{const file=e.target.files?.[0];if(file)readImage(file,async src=>{backgrounds.current=src;try{backgrounds.processed=await preprocessPhoto(src)}catch(err){console.warn('Background recolor failed',err);backgrounds.processed=src;}renderPoster();persist();notify('背景图已替换')})};
 $('show-guides').onchange=e=>{showGuides=e.target.checked;selectedId=null;renderPoster();renderElementEditor()};$('deselect').onclick=()=>setSelection(null);
 $('poster').addEventListener('click',e=>{if(e.target===$('poster'))setSelection(null)});
 $('preview-stage').addEventListener('pointerdown',e=>{if(e.target.matches('.preview-stage,.poster-holder,.poster,.poster-element.background,.poster-element.logo,.poster-element.line'))setSelection(null)});
 window.addEventListener('resize',updateScale);if(window.ResizeObserver){new ResizeObserver(updateScale).observe($('preview-stage'))}
}
window.__posterTest={analyze,separateDateTime,THEMES,baseTemplate,linkedPanelMembers};loadSaved();bind();refresh();
// Google Fonts 加载是异步的：在国内网络无法访问时，不阻塞本地编辑器启动。
const fontSheet=document.createElement('link');
fontSheet.rel='stylesheet';
fontSheet.href='https://fonts.googleapis.com/css2?family=Google+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap';
fontSheet.onload=()=>{renderPoster();updateOverflows()};
document.head.append(fontSheet);
})();
