export const normalize = value => String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'");
export const escapeHTML = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeURL(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}}
export function fileType(mime,title=''){
 const types={'application/pdf':'PDF','application/vnd.google-apps.document':'Google Doc','application/vnd.google-apps.presentation':'Google Slides','application/vnd.google-apps.spreadsheet':'Google Sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation':'PowerPoint','application/vnd.ms-powerpoint':'PowerPoint','application/vnd.openxmlformats-officedocument.wordprocessingml.document':'Word','application/msword':'Word','image/png':'Image','image/jpeg':'Image','video/mp4':'Video'};
 if(types[mime])return types[mime];
 const ext=title.split('.').pop().toLowerCase();
 return ({pdf:'PDF',ppt:'PowerPoint',pptx:'PowerPoint',doc:'Word',docx:'Word',xlsx:'Spreadsheet',xls:'Spreadsheet',png:'Image',jpg:'Image',jpeg:'Image',gif:'Image',mp4:'Video',url:'Web link'}[ext]||'Other');
}
export const presenterNames = value => String(value||'').split(';').map(x=>x.trim()).filter(Boolean);
export const programName = p => p==='MTC academic-year session'?'Academic-year sessions':p;
export function prettyDate(date){if(!date)return 'Date not recorded';if(/^\d{4}$/.test(date))return date;if(/^\d{4}-\d{2}$/.test(date))return new Date(`${date}-01T12:00:00Z`).toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});if(/^\d{4}-\d{2}-\d{2}$/.test(date))return new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});return date;}
export function offeringDate(o){if(!o.start)return o.date_label||'Date not recorded';return o.end&&o.end!==o.start?`${prettyDate(o.start)} – ${prettyDate(o.end)}`:prettyDate(o.start)}
export function offeringYears(o){const a=parseInt(o.start),b=parseInt(o.end)||a;if(!Number.isFinite(a)||a<1900||a>2200)return [];return Array.from({length:Math.min(10,Math.max(1,b-a+1))},(_,i)=>String(a+i))}
export function prepareDatabase(data){
 if(!data||!Array.isArray(data.sessions)||!Array.isArray(data.offerings)||!Array.isArray(data.resources))throw Error('The session data file is not in the expected format.');
 const bySession=new Map(data.sessions.map(s=>[s.session_id,s]));
 const rows=data.sessions.map(s=>{
  const offerings=data.offerings.filter(o=>o.session_id===s.session_id).sort((a,b)=>(b.start||'').localeCompare(a.start||''));
  const resources=data.resources.filter(r=>(r.session_ids||[]).includes(s.session_id));
  const searchText=normalize([s.title,s.description,...(s.tags||[]),...(s.focus_areas||[]),...offerings.flatMap(o=>[o.program,o.start]),...resources.map(r=>r.title)].join(' '));
  return {...s,offerings,resources,searchText,latest:offerings[0]?.start||'',earliest:offerings.at(-1)?.start||'',years:[...new Set(offerings.flatMap(offeringYears))]};
 });
 const resources=data.resources.map(r=>({...r,type:fileType(r.mime_type,r.title),year:r.archive_path?.match(/(?:19|20)\d{2}/)?.[0]||'',searchText:normalize([r.title,r.archive_path,...(r.session_ids||[]).flatMap(id=>{const s=bySession.get(id);return s?[s.title,...(s.tags||[]),...(s.focus_areas||[])]:[]})].join(' '))}));
 return {...data,rows,resourceRows:resources,bySession};
}
export function filterSessions(rows,state){
 const terms=normalize(state.q).split(/\s+/).filter(Boolean);
 return rows.filter(s=>terms.every(t=>s.searchText.includes(t))&&(!state.focus?.length||state.focus.some(f=>(s.focus_areas||[]).includes(f)))&&(!(state.year||state.program)||s.offerings.some(o=>(!state.year||offeringYears(o).includes(state.year))&&(!state.program||o.program===state.program))));
}
export function sortSessions(rows,sort='recent'){return [...rows].sort((a,b)=>sort==='title'?a.title.localeCompare(b.title):sort==='oldest'?(a.earliest||'9999').localeCompare(b.earliest||'9999')||a.title.localeCompare(b.title):b.latest.localeCompare(a.latest)||a.title.localeCompare(b.title))}
