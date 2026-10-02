import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {prepareDatabase,filterSessions,safeURL} from '../assets/core.js';
import {convertWorkbook} from '../assets/converter.js';
const data=JSON.parse(fs.readFileSync(new URL('../data/sessions.json',import.meta.url),'utf8'));
const db=prepareDatabase(data);
const ctx={console,Date,Uint8Array,ArrayBuffer};vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('../assets/vendor/xlsx.full.min.js',import.meta.url),'utf8'),ctx);const XLSX=ctx.XLSX;
const bytes=fs.readFileSync(new URL('../downloads/MTC_Session_Database.xlsx',import.meta.url));
function workbook(){return XLSX.read(bytes,{type:'buffer',cellDates:false})}
test('current catalog excludes the removed planning session and keeps every folder',()=>{assert.equal(db.rows.length,134);assert.ok(!db.rows.some(s=>s.session_id==='MTC-015'));assert.ok(db.rows.every(s=>s.resource_folder_url));assert.ok(db.offerings.every(o=>o.resource_folder_url))});
test('combined program/year filters match the same offering',()=>{const rows=prepareDatabase({sessions:[{session_id:'x',title:'Test',tags:[],focus_areas:['Algebra']}],offerings:[{session_id:'x',start:'2024-01-01',end:'2024-01-01',program:'Summer',presenter:'A; C'},{session_id:'x',start:'2025-01-01',end:'2025-01-01',program:'Winter',presenter:'B'}],resources:[]}).rows;assert.equal(filterSessions(rows,{year:'2024',program:'Winter'}).length,0);assert.equal(filterSessions(rows,{year:'2024',program:'Summer'}).length,1)});
test('search spans descriptions and topics',()=>{assert.ok(filterSessions(db.rows,{q:'fractal'}).length>0);assert.equal(filterSessions(db.rows,{q:'xyzzy-no-such-topic-4821'}).length,0)});
test('workbook round trip preserves session IDs and all offering folders',()=>{const result=convertWorkbook(XLSX,workbook(),data);assert.deepEqual(result.errors,[]);assert.equal(result.data.sessions.length,134);assert.equal(result.data.offerings.length,148);assert.equal(result.data.resources.length,586);assert.deepEqual(result.data.sessions.map(s=>s.session_id),data.sessions.map(s=>s.session_id));for(const old of data.offerings){const current=result.data.offerings.find(o=>o.offering_id===old.offering_id);assert.equal(current.start,old.start,old.offering_id);assert.equal(current.end,old.end,old.offering_id);assert.equal(current.resource_folder_url,old.resource_folder_url)}});
test('changed session and offering inputs drive the export, not cached summaries',()=>{const wb=workbook();wb.Sheets.Sessions.B5.v='Updated title';wb.Sheets.Offerings.D5={t:'n',v:46399};wb.Sheets.Offerings.E5={t:'n',v:46399};const r=convertWorkbook(XLSX,wb,data);assert.deepEqual(r.errors,[]);assert.equal(r.data.sessions[0].title,'Updated title');const s=r.data.sessions.find(s=>s.session_id===data.offerings[0].session_id);assert.ok(s.dates.includes('2027-01-12'))});
test('invalid IDs and unsafe URLs block export',()=>{const wb=workbook();wb.Sheets.Offerings.B5.v='MISSING';wb.Sheets.Offerings.O5.v='javascript:alert(1)';const r=convertWorkbook(XLSX,wb,data);assert.ok(r.errors.some(e=>e.includes('not in Sessions')));assert.ok(r.errors.some(e=>e.includes('complete https')));assert.equal(safeURL('javascript:alert(1)'),'')});
test('a bad or incomplete workbook gives clear errors',()=>{const r=convertWorkbook(XLSX,{Sheets:{}},data);assert.ok(r.errors.some(e=>e.includes('Missing “Sessions”')));assert.ok(r.errors.some(e=>e.includes('Missing “Offerings”')))});
