import {escapeHTML as e} from './core.js';
import {convertWorkbook} from './converter.js';
const $=s=>document.querySelector(s);let downloadURL;
const basePromise=fetch(new URL('../data/sessions.json',import.meta.url),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Current website data could not be loaded.');return r.json()});
basePromise.catch(()=>{});
$('#workbook').addEventListener('change',()=>{$('#convert').disabled=!$('#workbook').files.length;$('#validation').hidden=true;$('#update-status').textContent='';if(downloadURL){URL.revokeObjectURL(downloadURL);downloadURL=null}});
$('#convert').addEventListener('click',async()=>{
 const f=$('#workbook').files[0];if(!f)return;$('#convert').disabled=true;$('#validation').hidden=true;$('#update-status').textContent='Checking your workbook…';
 try{
  if(f.size>15*1024*1024)throw Error('Please select a workbook smaller than 15 MB.');
  if(!/\.xlsx$/i.test(f.name))throw Error('Select an .xlsx workbook. Save other spreadsheet formats as .xlsx first.');
  if(!window.XLSX)throw Error('The spreadsheet reader did not load. Reload the page and try again.');
  const [bytes,base]=await Promise.all([f.arrayBuffer(),basePromise]);
  const wb=window.XLSX.read(bytes,{type:'array',cellDates:true});
  const result=convertWorkbook(window.XLSX,wb,base);$('#validation').hidden=false;
  if(result.errors.length){$('#validation').innerHTML=`<div class="error-box" role="alert"><h3>A few things need attention</h3><p>Fix these items in the spreadsheet, save it, and select the updated file.</p><ul>${result.errors.slice(0,30).map(x=>`<li>${e(x)}</li>`).join('')}</ul>${result.errors.length>30?`<p>And ${result.errors.length-30} more issues.</p>`:''}</div>`;$('#update-status').textContent=`${result.errors.length} issue${result.errors.length===1?'':'s'} found. No data file was created.`;return}
  if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL=URL.createObjectURL(new Blob([JSON.stringify(result.data,null,2)+'\n'],{type:'application/json'}));
  $('#validation').innerHTML=`<div class="success-box"><h3>Your data file is ready.</h3><div class="export-counts"><span><strong>${result.data.sessions.length}</strong>sessions</span><span><strong>${result.data.offerings.length}</strong>offerings</span><span><strong>${result.data.resources.length}</strong>resources</span></div>${result.warnings.length?`<div class="warning-box"><strong>Export notes</strong><ul>${result.warnings.map(w=>`<li>${e(w)}</li>`).join('')}</ul></div>`:''}<div class="download-actions"><a id="download-json" class="button primary" href="${downloadURL}" download="sessions.json">Download sessions.json</a></div><p class="file-help">Replace <code>data/sessions.json</code> in your GitHub repository to publish these changes.</p><p class="file-help">Next available IDs: <strong>${e(result.nextSessionId)}</strong> and <strong>${e(result.nextOfferingId)}</strong>.</p><p class="preview-title">First five sessions in this export</p><ul class="sample-sessions">${result.data.sessions.slice(0,5).map(s=>`<li>${e(s.title)}</li>`).join('')}</ul></div>`;
  $('#update-status').textContent='Checks passed. Download the data file below.';
 }catch(err){$('#validation').hidden=false;$('#validation').innerHTML=`<div class="error-box" role="alert"><h3>We couldn’t read this workbook.</h3><p>${e(err.message)}</p></div>`;$('#update-status').textContent='No data file was created.'}finally{$('#convert').disabled=false}
});
