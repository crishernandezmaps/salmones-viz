// Captura con emulacion movil real via CDP. Node 22+ (WebSocket global).
// uso: node shot.mjs <url> <out.png> <scrollFrac 0..1> <W> <H>
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const [url, out, fracArg='0', WArg='390', HArg='844'] = process.argv.slice(2);
const frac = parseFloat(fracArg), W = +WArg, H = +HArg;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9223;

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  '--user-data-dir=/tmp/cdp-prof', '--no-first-run', '--disable-gpu',
  '--hide-scrollbars', 'about:blank'
]);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getWs() {
  for (let i=0;i<40;i++){
    try {
      const r = await fetch(`http://localhost:${PORT}/json/new?about:blank`, {method:'PUT'});
      const j = await r.json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('no CDP');
}

const wsUrl = await getWs();
const ws = new WebSocket(wsUrl);
let id = 0; const pending = new Map();
const send = (method, params={}) => new Promise(res => { const i=++id; pending.set(i,res); ws.send(JSON.stringify({id:i,method,params})); });
const events = {};
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  if (m.method) (events[m.method]||[]).forEach(f=>f(m.params));
});
const once = method => new Promise(res => { (events[method]=events[method]||[]).push(res); });
await new Promise(r => ws.addEventListener('open', r));

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width:W, height:H, deviceScaleFactor:3, mobile:true });
await send('Emulation.setTouchEmulationEnabled', { enabled:true });
const loaded = once('Page.loadEventFired');
await send('Page.navigate', { url });
await Promise.race([loaded, sleep(8000)]);
await sleep(2500); // imagenes/iframes
// scroll
await send('Runtime.evaluate', { expression:
  `(function(){var i=document.getElementById('sv-intro');var t=i?(i.offsetHeight-window.innerHeight):(document.body.scrollHeight-window.innerHeight);window.scrollTo(0, ${frac}*t);return [window.innerWidth, window.innerHeight, i?i.offsetHeight:-1];})()`,
  returnByValue:true }).then(r=>console.error('viewport/intro:', JSON.stringify(r.result?.value)));
await sleep(1200);
const shot = await send('Page.captureScreenshot', { format:'png' });
writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.error('saved', out);
ws.close(); chrome.kill();
process.exit(0);
