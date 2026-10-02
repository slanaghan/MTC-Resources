import {safeURL} from './core.js';
const text=v=>v===null||v===undefined?'':String(v).trim();
const list=v=>[...new Set(text(v).split(';').map(s=>s.trim()).filter(Boolean))];
const unique=a=>[...new Set(a.filter(Boolean))];
const yes=v=>/^(yes|true|1)$/i.test(text(v));
function objects(XLSX,wb,sheet,required,errors){
 const ws=wb.Sheets[sheet];if(!ws){errors.push(`Missing “${sheet}” worksheet.`);return []}
 const rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:''});
 const hi=rows.findIndex(r=>required.every(k=>r.map(text).includes(k)));
 if(hi<0){errors.push(`${sheet}: could not find the headers ${required.join(', ')}. Keep the original column headings.`);return []}
 const headers=rows[hi].map(text);return rows.slice(hi+1).map((r,i)=>Object.fromEntries([['_row',hi+i+2],...headers.map((h,j)=>[h,r[j]??''])])).filter(r=>headers.some(h=>text(r[h])));
}
function parseDate(v,XLSX){
 if(!v&&v!==0)return '';
 if(v instanceof Date)return Number.isNaN(v.getTime())?'INVALID':v.toISOString().slice(0,10);
 if(typeof v==='number'){const p=XLSX.SSF.parse_date_code(v);return p?`${p.y}-${String(p.m).padStart(2,'0')}-${String(p.d).padStart(2,'0')}`:'INVALID'}
 const s=text(v);if(/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(s)){const iso=s.slice(0,10),p=new Date(iso+'T12:00:00Z');return !Number.isNaN(p.getTime())&&p.toISOString().slice(0,10)===iso?iso:'INVALID'}
 if(/^\d{4}-\d{2}$/.test(s)&&Number(s.slice(5))>=1&&Number(s.slice(5))<=12)return s;
 if(/^\d{4}$/.test(s))return s;
 return 'INVALID';
}
function nextId(ids,prefix){return `${prefix}-${Math.max(0,...ids.map(id=>Number(id.match(new RegExp('^'+prefix+'-(\\d+)$'))?.[1])||0))+1}`}
const mimeMap={'PDF':'application/pdf','Google Doc':'application/vnd.google-apps.document','Google Slides':'application/vnd.google-apps.presentation','Google Sheet':'application/vnd.google-apps.spreadsheet','PowerPoint':'application/vnd.openxmlformats-officedocument.presentationml.presentation','Word':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','PNG':'image/png','JPEG':'image/jpeg','MP4':'video/mp4'};
const urlId=u=>u?.match(/\/d\/([^/?#]+)/)?.[1]||'';
export function convertWorkbook(XLSX,wb,base={}){
 const errors=[],warnings=[];
 const sr=objects(XLSX,wb,'Sessions',['Session ID','Session title','Short description','Primary focus'],errors);
 const or=objects(XLSX,wb,'Offerings',['Offering ID','Session ID','Start date','End date','Resource folder URL'],errors);
 const rr=wb.Sheets.Resources?objects(XLSX,wb,'Resources',['Resource title','Resource URL','Drive file ID'],errors):[];
 if(!wb.Sheets.Resources)warnings.push('No Resources worksheet was included. The export will contain sessions and folder links, with no individual-file inventory.');
 const oldSessions=new Map((base.sessions||[]).map(s=>[s.session_id,s])),oldOfferings=new Map((base.offerings||[]).map(o=>[o.offering_id,o])),oldResources=new Map((base.resources||[]).map(r=>[r.resource_id,r]));
 const sessions=[],offerings=[],resources=[],sessionIds=new Set(),offeringIds=new Set(),resourceIds=new Set();
 const checkURL=(v,context,required=false)=>{const s=text(v);if(!s){if(required)errors.push(`${context}: add a folder URL.`);return ''}if(!safeURL(s)){errors.push(`${context}: use a complete https:// or http:// URL.`);return ''}return s};
 const suggestedSession=nextId(sr.map(r=>text(r['Session ID'])),'MTC'),suggestedOffering=nextId(or.map(r=>text(r['Offering ID'])),'OFR');
 for(const r of sr){
  const id=text(r['Session ID']),title=text(r['Session title']),ctx=`Sessions row ${r._row}`;
  if(!id){errors.push(`${ctx}: add a unique Session ID (next available: ${suggestedSession}).`);continue}
  if(sessionIds.has(id)){errors.push(`${ctx}: duplicate Session ID ${id}.`);continue}sessionIds.add(id);
  if(!title)errors.push(`${ctx}: a session title is required.`);
  if(!text(r['Short description']))errors.push(`${ctx}: add a short description.`);
  if(!text(r['Primary focus']))errors.push(`${ctx}: choose a primary focus.`);
  const old=oldSessions.get(id)||{},source=checkURL(r['Source URL'],ctx+' source URL');
  sessions.push({...old,session_id:id,title,description:text(r['Short description']),focus_areas:unique([text(r['Primary focus']),...list(r['Additional focus areas'])]),tags:list(r['Topic tags']),programs:list(r['Program(s)']),source_links:unique([source,...(old.source_links||[]).slice(1)]),source_ids:unique([urlId(source),...(old.source_ids||[]).slice(1)]),notes:old.notes||[],resource_folder_url:checkURL(r['Session folder URL (latest offering)'],ctx+' folder')});
 }
 if(!sessions.length)errors.push('The workbook has no session records.');
 for(const r of or){
  const id=text(r['Offering ID']),sid=text(r['Session ID']),ctx=`Offerings row ${r._row}`;
  if(!id){errors.push(`${ctx}: add a unique Offering ID (next available: ${suggestedOffering}).`);continue}
  if(offeringIds.has(id)){errors.push(`${ctx}: duplicate Offering ID ${id}.`);continue}offeringIds.add(id);
  if(!sessionIds.has(sid))errors.push(`${ctx}: Session ID “${sid}” is not in Sessions. Correct the ID or remove this offering.`);
  let start=parseDate(r['Start date'],XLSX),end=parseDate(r['End date'],XLSX),status=text(r['Date status'])||'Exact date';
  const label=text(r['Date label']);
  if(!start&&!end){const partial=label.match(/^(\d{4}(?:-\d{2})?)(?!-\d)/)?.[1];if(partial){start=parseDate(partial,XLSX);end=start;}else if(status!=='Unknown'){errors.push(`${ctx}: enter dates, a YYYY-MM date label, or set Date status to Unknown.`)}}
  if(start==='INVALID'||end==='INVALID')errors.push(`${ctx}: enter dates as spreadsheet dates or YYYY-MM-DD.`);
  if(!end&&start)end=start;if(!start&&end)start=end;
  if(start&&end&&start>end)errors.push(`${ctx}: End date is before Start date.`);
  if(start.length===7&&status==='Exact date')status='Month only';
  const needs_review=yes(r['Review needed'])||['Month only','Date conflict','Unknown','Institute window'].includes(status);
  let date_label=start&&end&&start!==end?`${start} to ${end}`:start||'Date unknown';
  if(status==='Institute window')date_label+=' (institute window)';else if(status==='Date conflict')date_label+=' (review)';else if(status==='Month only')date_label+=' (day unknown)';
  const urls=unique([checkURL(r['Source URL 1'],ctx+' source 1'),checkURL(r['Source URL 2'],ctx+' source 2')]);
  const folder=checkURL(r['Resource folder URL'],ctx,true);
  offerings.push({...oldOfferings.get(id),offering_id:id,session_id:sid,title:sessions.find(s=>s.session_id===sid)?.title||text(r['Session title']),start,end,date_label,date_status:status,program:text(r.Program),context:text(r['Archive context']),presenter:text(r['Facilitator / presenter']),needs_review,notes:text(r['Source notes / review details']),source_links:urls,source_ids:urls.map(urlId).filter(Boolean),resource_folder_url:folder,folder_id:folder.match(/\/folders\/([^/?#]+)/)?.[1]||'',variant:oldOfferings.get(id)?.variant||''});
 }
 let cleaned=0;
 for(const r of rr){
  const ctx=`Resources row ${r._row}`,url=checkURL(r['Resource URL'],ctx),id=text(r['Drive file ID'])||urlId(url)||url;
  if(!id){errors.push(`${ctx}: include a resource URL or Drive file ID.`);continue}
  if(resourceIds.has(id)){errors.push(`${ctx}: duplicate resource ID ${id}.`);continue}resourceIds.add(id);
  const sids=list(r['Session IDs']),oids=list(r['Offering IDs']);cleaned+=sids.filter(x=>!sessionIds.has(x)).length+oids.filter(x=>!offeringIds.has(x)).length;
  const old=oldResources.get(id)||{};
  resources.push({...old,resource_id:id,title:text(r['Resource title']),url,archive_path:text(r['Archive path']),mime_type:mimeMap[text(r['File type'])]||old.mime_type||text(r['File type']),role:text(r['Resource role']),read_status:text(r['Review coverage'])||'Metadata inventoried',session_ids:sids.filter(x=>sessionIds.has(x)),offering_ids:oids.filter(x=>offeringIds.has(x))});
 }
 if(cleaned)warnings.push(`Removed ${cleaned} resource reference${cleaned===1?'':'s'} to session or offering IDs no longer in the workbook. The resource files remain in the inventory.`);
 for(const s of sessions){const os=offerings.filter(o=>o.session_id===s.session_id).sort((a,b)=>b.start.localeCompare(a.start));s.dates=unique([...os].reverse().map(o=>o.date_label));s.offering_count=os.length;s.needs_review=os.some(o=>o.needs_review);s.programs=os.length?unique(os.map(o=>o.program)):s.programs;
  if(os.length)s.resource_folder_url=os[0].resource_folder_url;
  if(!s.resource_folder_url)errors.push(`Session ${s.session_id}: add a folder URL in Sessions or in a matching Offering.`);
  s.resource_folder_urls=unique(os.length?os.map(o=>o.resource_folder_url):[s.resource_folder_url]);s.resource_folders=os.map(o=>({offering_id:o.offering_id,date_label:o.date_label,archive_context:o.context,url:o.resource_folder_url}));
 }
 const data={...base,title:base.title||'CSUDH Math Teachers’ Circle Session Database',as_of:new Date().toISOString().slice(0,10),method:{...(base.method||{}),maintenance:'The spreadsheet is the master. This file was generated by the browser export tool. Session summaries are recalculated from Offerings; existing IDs are preserved.',resources:`${resources.length} resource files are inventoried. Unassigned resources retain their archive paths.`},sessions,offerings,resources};
 return {data,errors,warnings,nextSessionId:nextId([...sessionIds],'MTC'),nextOfferingId:nextId([...offeringIds],'OFR')};
}
