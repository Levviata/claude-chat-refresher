const enabled=document.getElementById("enabled"),interval=document.getElementById("interval"),status=document.getElementById("status"),detail=document.getElementById("detail"),reset=document.getElementById("reset");
const names={disabled:"Disabled",waiting:"Waiting for Claude's Continuar control","found-disabled":"Continuar found — disabled by Claude",available:"Continuar is enabled",clicking:"Clicking Continuar…",checking:"Checking Claude…",cooldown:"Cooling down…"};
async function load(){const d=await chrome.storage.local.get({enabled:true,intervalMs:5000,claudeRefresherState:{state:"waiting"},claudeResetAt:null,claudeResetDisplay:null});enabled.checked=d.enabled;interval.value=String(d.intervalMs);render(d.claudeRefresherState);renderReset(d.claudeResetAt,d.claudeResetDisplay)}
function render(i){status.textContent=names[i?.state]||i?.state||"Unknown";detail.textContent=i?.detail||""}
function renderReset(ts,display){reset.textContent=ts ? `${display||new Date(ts).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})} (${new Date(ts).toLocaleDateString()})` : "Not detected yet"}
enabled.addEventListener("change",()=>chrome.storage.local.set({enabled:enabled.checked}));
interval.addEventListener("change",()=>chrome.storage.local.set({intervalMs:Number(interval.value)}));
chrome.storage.onChanged.addListener(c=>{if(c.claudeRefresherState)render(c.claudeRefresherState.newValue);if(c.claudeResetAt||c.claudeResetDisplay)renderReset(c.claudeResetAt?.newValue,c.claudeResetDisplay?.newValue)});
load();