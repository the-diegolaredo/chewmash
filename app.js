(() => {
  'use strict';

  const STORAGE_KEY = 'chewmash:v1';
  const GET_HISTORY_URL = 'https://get.cbord.com/calpoly/full/history.php';
  const DEFAULTS = {
    budget: 3295,
    start: '2026-08-19',
    end: '2026-12-18',
    asOf: localDate(),
    breaks: [['2026-11-23', '2026-11-29']]
  };

  const $ = id => document.getElementById(id);
  const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));

  function localDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function parseLocalDate(value) {
    const [y,m,d] = String(value || '').split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  function addDays(value, days) {
    const d = parseLocalDate(value);
    if (!d) return null;
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function humanDate(value) {
    const d = parseLocalDate(value);
    return d ? d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';
  }

  function normalizeLocation(value) {
    return String(value || 'Unknown')
      .replace(/^Grubhub\s+/i, '')
      .replace(/\s+\d{3,4}$/i, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Unknown';
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        settings: { ...DEFAULTS, ...(parsed.settings || {}), breaks: parsed.settings?.breaks || DEFAULTS.breaks },
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : []
      };
    } catch {
      return { settings: structuredClone(DEFAULTS), transactions: [], snapshots: [] };
    }
  }

  let state = loadState();

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function isAway(date) {
    return state.settings.breaks.some(([start,end]) => start && end && date >= start && date <= end);
  }

  function planDates(start = state.settings.start, end = state.settings.end) {
    if (!start || !end || start > end) return [];
    const out = [];
    for (let d = start; d <= end; d = addDays(d, 1)) {
      if (!isAway(d)) out.push(d);
    }
    return out;
  }

  function dataThrough() {
    const txnLast = state.transactions.reduce((max,t) => t.date && t.date > max ? t.date : max, '');
    const snapshotLast = state.snapshots.reduce((max,s) => (s.snapshotDate || '') > max ? (s.snapshotDate || '') : max, '');
    return txnLast > snapshotLast ? txnLast : snapshotLast;
  }

  function effectiveAsOf() {
    const imported = dataThrough();
    if (imported) return imported;
    return clampDate(state.settings.asOf || localDate(), state.settings.start, state.settings.end);
  }

  function clampDate(value, min, max) {
    if (!value) return min;
    if (min && value < min) return min;
    if (max && value > max) return max;
    return value;
  }

  function latestSnapshot() {
    return [...state.snapshots]
      .filter(s => Number.isFinite(Number(s.endingBalance)))
      .sort((a,b) => String(a.snapshotDate || '').localeCompare(String(b.snapshotDate || '')))
      .at(-1) || null;
  }

  function itemizedTotal() {
    return state.transactions.reduce((sum,t) => sum + (Number(t.amount) || 0), 0);
  }

  function officialBalance() {
    const latest = latestSnapshot();
    return latest ? Number(latest.endingBalance) : Math.max(0, Number(state.settings.budget) - itemizedTotal());
  }

  function officialSpent() {
    return Math.max(0, Number(state.settings.budget) - officialBalance());
  }

  function txnsByDate() {
    const map = new Map();
    for (const t of state.transactions) {
      if (!t.date) continue;
      map.set(t.date, (map.get(t.date) || 0) + Number(t.amount || 0));
    }
    return map;
  }

  function budgetStats() {
    const allDays = planDates();
    const asOf = effectiveAsOf();
    const elapsedDays = allDays.filter(d => d <= asOf);
    const remainingDays = allDays.filter(d => d >= asOf);
    const target = allDays.length ? Number(state.settings.budget) / allDays.length : 0;
    const spent = officialSpent();
    const balance = officialBalance();
    const avg = elapsedDays.length ? spent / elapsedDays.length : 0;
    const expected = target * elapsedDays.length;
    const delta = expected - spent;
    const tolerance = Math.max(1, target * .05);
    const status = delta > tolerance ? 'under' : delta < -tolerance ? 'over' : 'on';
    const safePerDay = remainingDays.length ? balance / remainingDays.length : 0;
    return { allDays, asOf, elapsedDays, remainingDays, target, spent, balance, avg, expected, delta, status, safePerDay };
  }

  function navigate(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.toggle('active', page.id === pageId));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.page === pageId));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function syncInputs() {
    $('budgetInput').value = state.settings.budget;
    $('todayInput').value = state.settings.asOf || localDate();
    $('startInput').value = state.settings.start || '';
    $('endInput').value = state.settings.end || '';
    const breaks = [...state.settings.breaks, ['', ''], ['', '']].slice(0,3);
    breaks.forEach((pair,i) => {
      $(`break${i+1}Start`).value = pair[0] || '';
      $(`break${i+1}End`).value = pair[1] || '';
    });
  }

  function render() {
    const stats = budgetStats();
    const daily = txnsByDate();
    const spentToday = daily.get(stats.asOf) || 0;
    const latest = latestSnapshot();

    $('asOfLabel').textContent = dataThrough() ? `Updated through ${humanDate(stats.asOf)}` : 'No data imported yet';
    $('avgSpent').textContent = money(stats.avg);
    $('avgSpentNote').innerHTML = `Target: <strong>${money(stats.target)}</strong> per campus day`;
    $('todaySpent').textContent = money(spentToday);
    $('todaySpentNote').textContent = `${humanDate(stats.asOf)} · itemized purchases`;

    const statusCard = $('statusCard');
    statusCard.classList.remove('under','over','on');
    statusCard.classList.add(stats.status);
    if (stats.status === 'under') {
      $('budgetStatus').textContent = 'Under budget';
      $('budgetStatusNote').textContent = `${money(Math.abs(stats.delta))} ahead of your planned pace`;
    } else if (stats.status === 'over') {
      $('budgetStatus').textContent = 'Over budget';
      $('budgetStatusNote').textContent = `${money(Math.abs(stats.delta))} beyond your planned pace`;
    } else {
      $('budgetStatus').textContent = 'On budget';
      $('budgetStatusNote').textContent = 'Your spending is close to the planned pace';
    }

    $('remainingBalance').textContent = money(stats.balance);
    $('balanceDetail').textContent = latest ? `Latest official snapshot: ${humanDate(latest.snapshotDate)}${latest.source ? ` · ${latest.source}` : ''}` : 'Calculated from itemized purchases until an official balance is imported';
    $('dailyTarget').textContent = money(stats.target);
    $('safePerDay').textContent = money(stats.safePerDay);
    $('officialSpent').textContent = money(stats.spent);
    $('itemizedSpent').textContent = money(itemizedTotal());

    const gap = stats.spent - itemizedTotal();
    $('reconcileNote').textContent = latest
      ? Math.abs(gap) < .01
        ? 'Your official balance and itemized purchases reconcile.'
        : `${money(Math.abs(gap))} of official spending is not represented by the itemized transactions currently stored here.`
      : 'Import a statement with an ending balance or use GET sync to compare official and itemized totals.';

    renderDailyChart(stats, daily);
    renderPlaceChart();
    renderTransactions();
    renderImports();
  }

  function svgEscape(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function renderDailyChart(stats, dailyMap) {
    const host = $('dailyChart');
    const days = stats.elapsedDays;
    if (!days.length) {
      host.innerHTML = '<div class="empty">No plan days to display.</div>';
      return;
    }
    const values = days.map(d => dailyMap.get(d) || 0);
    const max = Math.max(stats.target * 1.35, ...values, 1);
    const W = 680, H = 285, left = 38, right = 16, top = 18, bottom = 34;
    const innerW = W-left-right, innerH = H-top-bottom;
    const x = i => left + (days.length === 1 ? innerW/2 : i * innerW/(days.length-1));
    const y = v => top + innerH - (v/max)*innerH;
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily spending chart">`;
    for (let i=0;i<=4;i++) {
      const val = max*i/4;
      const yy = y(val);
      svg += `<line class="gridline" x1="${left}" x2="${W-right}" y1="${yy}" y2="${yy}"/><text class="axis" x="${left-6}" y="${yy+3}" text-anchor="end">$${Math.round(val)}</text>`;
    }
    svg += `<line class="targetline" x1="${left}" x2="${W-right}" y1="${y(stats.target)}" y2="${y(stats.target)}"/>`;
    values.forEach((v,i) => {
      const radius = v > 0 ? 4.2 : 2.4;
      const opacity = v > 0 ? 1 : .25;
      svg += `<circle cx="${x(i)}" cy="${y(v)}" r="${radius}" fill="#154f3a" opacity="${opacity}"><title>${humanDate(days[i])}: ${money(v)}</title></circle>`;
    });
    const labels = [0, Math.floor((days.length-1)/2), days.length-1].filter((v,i,a) => a.indexOf(v) === i);
    labels.forEach(i => {
      const d = parseLocalDate(days[i]);
      const label = d ? d.toLocaleDateString('en-US',{month:'short',day:'numeric'}) : days[i];
      svg += `<text class="axis" x="${x(i)}" y="${H-8}" text-anchor="middle">${svgEscape(label)}</text>`;
    });
    svg += '</svg>';
    host.innerHTML = svg;
  }

  function renderPlaceChart() {
    const host = $('placeChart');
    const totals = new Map();
    for (const t of state.transactions) {
      const place = normalizeLocation(t.location || t.rawLocation);
      totals.set(place, (totals.get(place) || 0) + Number(t.amount || 0));
    }
    const rows = [...totals.entries()].sort((a,b) => b[1]-a[1]).slice(0,7);
    if (!rows.length) {
      host.innerHTML = '<div class="empty">Import transactions to see spending by location.</div>';
      return;
    }
    const total = [...totals.values()].reduce((a,b)=>a+b,0);
    const max = Math.max(...rows.map(r=>r[1]),1);
    const W=470,H=285,left=24,right=10,top=18,bottom=72;
    const innerW=W-left-right,innerH=H-top-bottom,slot=innerW/rows.length,barW=Math.min(38,slot*.58);
    let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Spending by dining location">`;
    for(let i=0;i<=3;i++){
      const yy=top+innerH-innerH*i/3;
      svg+=`<line class="gridline" x1="${left}" x2="${W-right}" y1="${yy}" y2="${yy}"/>`;
    }
    rows.forEach(([name,value],i)=>{
      const h=value/max*innerH,x=left+slot*i+(slot-barW)/2,y=top+innerH-h,pct=total?value/total*100:0;
      const short=name.length>14?name.slice(0,12)+'…':name;
      svg+=`<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="2" fill="#154f3a"><title>${svgEscape(name)}: ${money(value)} · ${pct.toFixed(1)}%</title></rect>`;
      svg+=`<text class="axis" x="${x+barW/2}" y="${top+innerH+15}" text-anchor="middle">${pct.toFixed(0)}%</text>`;
      svg+=`<text class="axis" transform="translate(${x+barW/2},${H-8}) rotate(-42)" text-anchor="end">${svgEscape(short)}</text>`;
    });
    svg+='</svg>';
    host.innerHTML=svg;
  }

  function renderTransactions() {
    $('transactionCount').textContent = `${state.transactions.length} transaction${state.transactions.length === 1 ? '' : 's'} stored locally.`;
    const tbody = $('transactionTable');
    if (!state.transactions.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">No imported transactions yet.</td></tr>';
      return;
    }
    tbody.innerHTML = [...state.transactions].sort((a,b)=>`${b.date} ${b.time||''}`.localeCompare(`${a.date} ${a.time||''}`)).map(t => `<tr><td>${escapeHtml(t.date)}</td><td>${escapeHtml(t.time||'')}</td><td>${escapeHtml(normalizeLocation(t.location||t.rawLocation))}</td><td>${escapeHtml(t.source||'Imported')}</td><td class="amount">${money(t.amount)}</td></tr>`).join('');
  }

  function renderImports() {
    const host = $('importList');
    const sources = new Map();
    state.transactions.forEach(t => {
      const source = t.source || 'Imported';
      const item = sources.get(source) || { count:0, total:0 };
      item.count += 1; item.total += Number(t.amount || 0); sources.set(source,item);
    });
    state.snapshots.forEach(s => {
      const source = s.source || 'Balance snapshot';
      if (!sources.has(source)) sources.set(source,{count:0,total:0});
    });
    if (!sources.size) {
      host.innerHTML = '<div class="import-row"><span class="import-name">Nothing imported yet</span><span class="import-meta">—</span></div>';
      return;
    }
    host.innerHTML = [...sources.entries()].map(([name,v]) => `<div class="import-row"><span class="import-name">${escapeHtml(name)}</span><span class="import-meta">${v.count} purchase${v.count===1?'':'s'}${v.count?` · ${money(v.total)}`:''}</span></div>`).join('');
  }

  function txnKey(t) {
    return `${t.date}|${String(t.time||'').toUpperCase()}|${normalizeLocation(t.rawLocation||t.location)}|${Number(t.amount).toFixed(2)}`;
  }

  function mergeTransactions(rows) {
    const existing = new Set(state.transactions.map(txnKey));
    let added=0;
    for (const row of rows) {
      const t = { ...row, location: normalizeLocation(row.location || row.rawLocation), amount: Math.abs(Number(row.amount)||0) };
      if (!t.date || !t.amount) continue;
      const key = txnKey(t);
      if (existing.has(key)) continue;
      state.transactions.push(t); existing.add(key); added++;
    }
    state.transactions.sort((a,b)=>`${a.date} ${a.time||''}`.localeCompare(`${b.date} ${b.time||''}`));
    return added;
  }

  function mergeSnapshot(snapshot) {
    if (!snapshot || !Number.isFinite(Number(snapshot.endingBalance))) return;
    const key = `${snapshot.snapshotDate||''}|${Number(snapshot.endingBalance).toFixed(2)}`;
    const index = state.snapshots.findIndex(s => `${s.snapshotDate||''}|${Number(s.endingBalance).toFixed(2)}` === key);
    if (index >= 0) state.snapshots[index] = snapshot; else state.snapshots.push(snapshot);
  }

  function setSyncMessage(text,error=false) {
    $('syncMessage').textContent=text;
    $('syncMessage').className='upload-message'+(error?' error':'');
  }

  function requestExtensionData() {
    window.postMessage({source:'chewmash-app',type:'CHEWMASH_GET_DATA_REQUEST'}, window.location.origin);
  }

  function mergeGetPayload(payload) {
    if (!payload || !Array.isArray(payload.transactions)) return 0;
    const rows = payload.transactions.map(t => ({
      date:String(t.date||''), time:String(t.time||''), rawLocation:String(t.rawLocation||t.location||'Unknown'),
      location:normalizeLocation(t.rawLocation||t.location||'Unknown'), amount:Math.abs(Number(t.amount)||0), source:'GET sync'
    })).filter(t => /^\d{4}-\d{2}-\d{2}$/.test(t.date) && t.amount>0);
    const added = mergeTransactions(rows);
    if (Number.isFinite(Number(payload.balance))) {
      const snapshotDate = String(payload.capturedDate || rows.at(-1)?.date || localDate());
      mergeSnapshot({ snapshotDate, endingBalance:Number(payload.balance), source:'GET sync' });
    }
    const through = dataThrough();
    if (through) state.settings.asOf = through;
    save(); syncInputs(); render();
    return added;
  }

  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const msg = event.data;
    if (!msg || msg.source !== 'chewmash-extension') return;
    if (msg.type === 'CHEWMASH_EXTENSION_READY') {
      setSyncMessage('ChewMash GET Sync is installed. Open GET to refresh your dining data.');
      requestExtensionData();
    }
    if (msg.type === 'CHEWMASH_GET_DATA') {
      if (!msg.payload) {
        setSyncMessage('Extension connected, but no GET data has been captured yet. Open GET, sign in, and visit Transaction History.');
        return;
      }
      const added = mergeGetPayload(msg.payload);
      setSyncMessage(`GET sync complete: ${added} new purchase${added===1?'':'s'}${Number.isFinite(Number(msg.payload.balance))?` · balance ${money(msg.payload.balance)}`:''}.`);
    }
  });

  // Conservative PDF parser for CBORD statements exported by Cal Poly GET.
  function parseMMDDYY(value) {
    const m = String(value||'').match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
    if (!m) return null;
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${String(m[1]).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}`;
  }

  function parseLongDate(value) {
    const m = String(value||'').match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/i);
    if (!m) return null;
    const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
    return `${m[3]}-${String(months.indexOf(m[1].toLowerCase())+1).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}`;
  }

  function decodePdfLiteral(s) {
    let out='';
    for(let i=0;i<s.length;i++){
      const c=s[i]; if(c!=='\\'){out+=c;continue}
      const n=s[++i]; if(n===undefined)break;
      const map={n:'\n',r:'\r',t:'\t',b:'\b',f:'\f','(':'(',')':')','\\':'\\'};
      if(n in map){out+=map[n];continue}
      if(/[0-7]/.test(n)){let oct=n;for(let k=0;k<2&&i+1<s.length&&/[0-7]/.test(s[i+1]);k++)oct+=s[++i];out+=String.fromCharCode(parseInt(oct,8));continue}
      if(n==='\r'&&s[i+1]==='\n')i++; else if(n==='\n'||n==='\r'){} else out+=n;
    }
    return out;
  }

  async function inflatePdfStreams(buffer) {
    if (!('DecompressionStream' in window)) throw new Error('This browser cannot parse the PDF locally. Try a current Chrome, Edge, Firefox, or Safari browser.');
    const bytes=new Uint8Array(buffer), binary=new TextDecoder('latin1').decode(bytes), out=[];
    let pos=0;
    while(true){
      const s=binary.indexOf('stream',pos); if(s<0)break;
      let start=s+6; if(binary[start]==='\r'&&binary[start+1]==='\n')start+=2; else if(binary[start]==='\n'||binary[start]==='\r')start++;
      const end=binary.indexOf('endstream',start); if(end<0)break;
      let chunk=bytes.slice(start,end); while(chunk.length&&(chunk.at(-1)===10||chunk.at(-1)===13))chunk=chunk.slice(0,-1);
      try{
        const ds=new DecompressionStream('deflate');
        const inflated=await new Response(new Blob([chunk]).stream().pipeThrough(ds)).arrayBuffer();
        out.push(new TextDecoder('latin1').decode(inflated));
      }catch{}
      pos=end+9;
    }
    return out;
  }

  function parseCbordContent(contents, source) {
    const chunks=[];
    const re=/BT\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+Td\s+\(((?:\\.|[^\\)])*)\)\s+Tj\s+ET/g;
    for(const content of contents){
      re.lastIndex=0; let m;
      while((m=re.exec(content))) chunks.push({x:+m[1],y:+m[2],text:decodePdfLiteral(m[3]).replace(/\s+/g,' ').trim()});
    }
    const all=chunks.map(c=>c.text).join('\n');
    const ending=(all.match(/Ending Balance:\s*\$([\d,]+\.\d{2})/i)||[])[1];
    const printed=(all.match(/Printed:\s*([^\n]+)/i)||[])[1]||'';
    const period=(all.match(/Statement Period:\s*(\d{2}\/\d{2}\/\d{2})\s+to\s+(\d{2}\/\d{2}\/\d{2})/i)||[]);
    const groups=new Map();
    for(const c of chunks){const key=(Math.round(c.y*10)/10).toFixed(1);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c)}
    const rows=[];
    for(const g of groups.values()){
      const date=g.find(c=>/^\d{2}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\s+[AP]M$/i.test(c.text));
      const amount=g.find(c=>/^-?\$\d[\d,]*\.\d{2}$/.test(c.text));
      if(!date||!amount)continue;
      const location=g.filter(c=>c!==date&&c!==amount&&!/^First Year Plus$/i.test(c.text)&&c.x>230&&c.x<450).sort((a,b)=>a.x-b.x)[0];
      if(!location)continue;
      const dm=date.text.match(/^(\d{2}\/\d{2}\/\d{2})\s+(.+)$/);
      const signed=Number(amount.text.replace(/[^0-9.-]/g,''));
      if(!dm||!Number.isFinite(signed)||signed>=0)continue;
      rows.push({date:parseMMDDYY(dm[1]),time:dm[2],rawLocation:location.text,location:normalizeLocation(location.text),amount:Math.abs(signed),source});
    }
    const snapshotDate=parseLongDate(printed)||parseMMDDYY(period[2]);
    if(!rows.length&&!ending)throw new Error('I could not recognize this as a Cal Poly CBORD GET statement.');
    return {rows,snapshot:ending?{snapshotDate,endingBalance:Number(ending.replace(/,/g,'')),source}:null};
  }

  async function parsePdf(file) {
    const streams=await inflatePdfStreams(await file.arrayBuffer());
    if(!streams.length)throw new Error('The PDF text stream could not be decompressed.');
    return parseCbordContent(streams,file.name);
  }

  async function importPdfs(files) {
    const messages=[]; let hadError=false;
    $('uploadMessage').className='upload-message'; $('uploadMessage').textContent='Reading statement…';
    for(const file of files){
      try{
        const parsed=await parsePdf(file);
        const added=mergeTransactions(parsed.rows);
        if(parsed.snapshot)mergeSnapshot(parsed.snapshot);
        messages.push(`${file.name}: ${added} new purchase${added===1?'':'s'}${parsed.snapshot?` · balance ${money(parsed.snapshot.endingBalance)}`:''}`);
      }catch(err){hadError=true;messages.push(`${file.name}: ${err.message}`)}
    }
    const through=dataThrough(); if(through)state.settings.asOf=through;
    save(); syncInputs(); render();
    $('uploadMessage').className='upload-message'+(hadError?' error':'');
    $('uploadMessage').innerHTML=messages.map(escapeHtml).join('<br>');
  }

  document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click',()=>navigate(btn.dataset.page)));
  $('accountBtn').addEventListener('click',()=>navigate('accountPage'));

  $('syncGet').addEventListener('click',()=>{
    setSyncMessage('Opening Cal Poly GET. Sign in normally, then visit Transaction History. Return here after the extension captures it.');
    window.open(GET_HISTORY_URL,'_blank','noopener,noreferrer');
    let attempts=0;
    const timer=setInterval(()=>{requestExtensionData();if(++attempts>=30)clearInterval(timer)},2000);
  });

  $('choosePdf').addEventListener('click',e=>{e.stopPropagation();$('pdfInput').click()});
  $('dropZone').addEventListener('click',()=>$('pdfInput').click());
  $('dropZone').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('pdfInput').click()}});
  $('pdfInput').addEventListener('change',e=>{const files=[...e.target.files];if(files.length)importPdfs(files);e.target.value=''});
  ['dragenter','dragover'].forEach(ev=>$('dropZone').addEventListener(ev,e=>{e.preventDefault();$('dropZone').classList.add('drag')}));
  ['dragleave','drop'].forEach(ev=>$('dropZone').addEventListener(ev,e=>{e.preventDefault();$('dropZone').classList.remove('drag')}));
  $('dropZone').addEventListener('drop',e=>{const files=[...e.dataTransfer.files].filter(f=>f.type==='application/pdf'||f.name.toLowerCase().endsWith('.pdf'));if(files.length)importPdfs(files)});

  $('saveSettings').addEventListener('click',()=>{
    state.settings={
      budget:Number($('budgetInput').value)||0,
      start:$('startInput').value,
      end:$('endInput').value,
      asOf:$('todayInput').value||localDate(),
      breaks:[[ $('break1Start').value,$('break1End').value ],[ $('break2Start').value,$('break2End').value ],[ $('break3Start').value,$('break3End').value ]].filter(([a,b])=>a&&b)
    };
    save();render();
    const button=$('saveSettings');button.textContent='Saved';setTimeout(()=>button.textContent='Save settings',900);
  });

  $('clearData').addEventListener('click',()=>{
    if(!confirm('Clear imported transactions and balance snapshots? Your plan settings will remain.'))return;
    state.transactions=[];state.snapshots=[];save();render();
  });

  $('exportData').addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='chewmash-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  });

  $('importBackupBtn').addEventListener('click',()=>$('backupInput').click());
  $('backupInput').addEventListener('change',e=>{
    const file=e.target.files[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const next=JSON.parse(reader.result);
        state={settings:{...DEFAULTS,...(next.settings||{})},transactions:Array.isArray(next.transactions)?next.transactions:[],snapshots:Array.isArray(next.snapshots)?next.snapshots:[]};
        save();syncInputs();render();
      }catch{alert('That backup could not be read.')}
    };
    reader.readAsText(file);e.target.value='';
  });

  syncInputs();
  render();
  setTimeout(requestExtensionData,500);
})();
