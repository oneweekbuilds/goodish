function A(s,t,a=null){const o=console[s]||console.log;a!==null?o(t,a):o(t);try{chrome.runtime.sendMessage({type:"CAPTURE_DEBUG_LOG",source:"popup",level:s,message:t,data:a}).catch(()=>{})}catch{}}console.log("[AlgorithmLens] Popup opened");{const s=new Date().toISOString();A("log",`[CaptureDebug] popup opened - Timestamp: ${s}`)}const n=document.getElementById("status"),e=document.getElementById("scanButton"),L=document.getElementById("sessionTimer"),p=document.getElementById("aiConsentToggle");document.getElementById("aiConsentSection");let i=null,V=null,S=!1,r=!1,c=null,v=null,z=null,G=null;const X=["tiktok","instagram","youtube","facebook","twitter"],C={tiktok:"TikTok",instagram:"Instagram",youtube:"YouTube",facebook:"Facebook",twitter:"Twitter/X",reddit:"Reddit"};function q(s){const t=Math.floor(s/60),a=s%60;return`${t.toString().padStart(2,"0")}:${a.toString().padStart(2,"0")}`}function Y(){v&&clearInterval(v),L.style.display="block",x(),v=setInterval(()=>{r&&c&&x()},1e3)}function x(){if(c){const s=Math.floor((Date.now()-c)/1e3);L.innerHTML=`${q(s)}<small>Session recording...</small>`}}function T(){v&&(clearInterval(v),v=null),L.style.display="none"}async function H(){try{const[s]=await chrome.tabs.query({active:!0,currentWindow:!0});if(((s==null?void 0:s.url)||"").includes("facebook.com")){console.log("[AlgorithmLens] Facebook detected but disabled for MVP"),S=!1,i=null,r=!1,n.className="status unsupported",n.innerHTML=`
        <strong>Facebook support coming soon</strong><br>
        <small>Facebook scanning is in beta and not available in this version. AlgorithmLens currently supports TikTok, Instagram, YouTube, and X/Twitter.</small>
      `,e.disabled=!0,e.textContent="Start Session Scan",e.className="scan-button",T();return}const o=await chrome.runtime.sendMessage({type:"CHECK_PLATFORM"});console.log("[AlgorithmLens] Platform check response:",o),V=o.tabId;const m=o.platform,l=m&&X.includes(m);if(!o.supported||!l){S=!1,i=null,r=!1,n.className="status unsupported",m==="reddit"?n.innerHTML=`
          <strong>Reddit support coming soon</strong><br>
          <small>Reddit scanning is temporarily disabled while we improve it.</small>
        `:n.innerHTML=`
          Navigate to TikTok, Instagram, YouTube, or Twitter/X to start a session scan.
        `,e.disabled=!0,e.textContent="Start Session Scan",e.className="scan-button",T();return}S=!0,i=o.platform;const d=await chrome.runtime.sendMessage({action:"GET_SESSION_STATE"});console.log("[AlgorithmLens] Session state response:",d),d.active&&d.startTime?(r=!0,c=d.startTime,i=d.platform||i,K()):(r=!1,c=null,j()),e.disabled=!1}catch(s){console.error("[AlgorithmLens] Error checking platform:",s),n.className="status unsupported",n.textContent="Unable to detect page. Try refreshing.",e.disabled=!0}}function j(){n.className="status supported",n.innerHTML=`
    Ready to scan <span class="platform-badge">${C[i]||i}</span>
  `,e.textContent="Start Session Scan",e.className="scan-button",e.disabled=!1,T()}function K(){n.className="status session-active",n.innerHTML=`
    <strong>📡 Recording on ${C[i]||i}</strong><br>
    <small>Scroll your feed to capture posts. Click "Stop" when ready to analyze.</small>
  `,e.textContent="Stop & Analyze Session",e.className="scan-button stop",e.disabled=!1,Y()}function W(s,t,a=!1,o=null,m=!1){var D,B,F;const{aggregates:l,scan_metadata:d,_computed:u}=s,f=(o==null?void 0:o.ai_analyzed)===!0;if(!l||l.total_feed_items===0)return m?`
        <div class="scan-result">
          <div class="result-header">⚠️ Session slowed down</div>
          <div class="result-detail">The feed was updating very quickly. Try scrolling more slowly and start a new scan.</div>
        </div>
      `:`
      <div class="scan-result">
        <div class="result-header">No posts captured</div>
        <div class="result-detail">Try scrolling more before stopping the session, then start a new scan.</div>
      </div>
    `;const U=l.total_feed_items;l.total_ads;const w=Math.round(l.ad_percentage*100),R=f&&o.political_content_summary?o.political_content_summary:l.political_content_summary||{},E=Math.round((R.political_percentage||0)*100),h=(f&&o.wellbeing_summary?o.wellbeing_summary:l.wellbeing_summary||{}).valence_distribution||{},b=(h.POSITIVE||0)+(h.NEUTRAL||0)+(h.NEGATIVE||0)+(h.MIXED||0),_=b>0?Math.round((h.POSITIVE||0)/b*100):0,N=b>0?Math.round((h.NEGATIVE||0)/b*100):0,P=f&&o.topic_distribution?o.topic_distribution.slice(0,4):(l.topic_distribution||[]).slice(0,4),$=((u==null?void 0:u.topHashtags)||[]).slice(0,6),M=(((D=l.engagement_pattern_summary)==null?void 0:D.top_hooks)||[]).slice(0,3),k=(u==null?void 0:u.wellbeingThemes)||[];let I="";m&&(I=`
      <div class="saved-banner warning">
        <div class="saved-icon">⚡</div>
        <div class="saved-text">
          <strong>Session slowed down</strong>
          <small>The feed was updating quickly. We captured ${l.total_feed_items} posts to keep your browser responsive.</small>
        </div>
      </div>
    `);let y="";a&&o?y=`
      <div class="saved-banner">
        <div class="saved-icon">✅</div>
        <div class="saved-text">
          <strong>Saved to your history</strong>
          <small>View detailed insights in the dashboard</small>
        </div>
      </div>
      <button id="viewDashboard" class="dashboard-button">
        📊 View in Dashboard
      </button>
    `:a===!1&&(o!=null&&o.error)&&(y=`
      <div class="saved-banner error">
        <div class="saved-icon">⚠️</div>
        <div class="saved-text">
          <strong>Could not save to history</strong>
          <small>${o.error}</small>
        </div>
      </div>
    `);const O=t?`${t}s session`:"";return`
    <div class="scan-result">
      ${I}
      ${y}
      
      <div class="result-header">
        ✅ Analyzed ${U} posts ${O?`(${O})`:""}
      </div>
      
      <div class="result-stats">
        <div class="stat">
          <span class="stat-value ${w>20?"high":""}">${w}%</span>
          <span class="stat-label">Ads</span>
        </div>
        <div class="stat">
          <span class="stat-value ${_>50?"positive":""}">${_}%</span>
          <span class="stat-label">Positive</span>
        </div>
        <div class="stat">
          <span class="stat-value ${N>30?"negative":""}">${N}%</span>
          <span class="stat-label">Negative</span>
        </div>
      </div>
      
      ${P.length>0?`
        <div class="result-section">
          <div class="section-title">Top Topics${f?' <small style="color:#10b981;font-weight:normal;">(AI)</small>':""}</div>
          <div class="topic-list">
            ${P.map(g=>`
              <span class="topic">${g.category} <small>${Math.round(g.percentage*100)}%</small></span>
            `).join("")}
          </div>
        </div>
      `:""}
      
      ${$.length>0?`
        <div class="result-section">
          <div class="section-title">Top Hashtags</div>
          <div class="hashtag-list">
            ${$.map(g=>`<span class="hashtag">${g.tag}</span>`).join("")}
          </div>
        </div>
      `:""}
      
      ${M.length>0?`
        <div class="result-section">
          <div class="section-title">Call-to-Actions (${(u==null?void 0:u.totalCTAs)||0})</div>
          <div class="cta-list">
            ${M.map(g=>`<span class="cta">${g.hook} <small>×${g.count}</small></span>`).join("")}
          </div>
        </div>
      `:""}
      
      ${k.length>0?`
        <div class="result-section">
          <div class="section-title">Wellbeing Themes</div>
          <div class="theme-list">
            ${k.map(g=>`<span class="theme">${g}</span>`).join("")}
          </div>
        </div>
      `:""}
      
      ${E>0?`
        <div class="result-section political">
          <div class="section-title">Political Content</div>
          <span class="political-badge">${E}% of posts</span>
        </div>
      `:""}
      
      <div class="result-footer">
        Platform: ${C[(B=d.platform)==null?void 0:B.toLowerCase()]||d.platform}<br>
        <small>Scan ID: ${(F=d.scan_id)==null?void 0:F.slice(0,20)}...</small>
      </div>
    </div>
  `}function J(){const s=document.getElementById("viewDashboard");s&&s.addEventListener("click",()=>{console.log("[AlgorithmLens] Opening dashboard..."),chrome.runtime.sendMessage({action:"OPEN_DASHBOARD"})})}async function Q(){console.log("[AlgorithmLens] Starting session scan..."),A("log","[CaptureDebug] Start Scan button clicked");try{const[s]=await chrome.tabs.query({active:!0,currentWindow:!0});if(((s==null?void 0:s.url)||"").includes("facebook.com")){console.log("[AlgorithmLens] Blocking Facebook session start (MVP restriction)"),n.className="status unsupported",n.innerHTML=`
        <strong>Facebook support coming soon</strong><br>
        <small>Facebook scanning is coming soon. For now, AlgorithmLens works on TikTok, Instagram, YouTube, and X/Twitter.</small>
      `,e.disabled=!0;return}}catch(s){console.error("[AlgorithmLens] Error checking tab URL:",s)}e.disabled=!0,e.textContent="Starting...",n.className="status loading",n.textContent="Starting session...";try{const s=ns(),t=await chrome.runtime.sendMessage({action:"START_SESSION_SCAN",geminiConsent:s});if(console.log("[AlgorithmLens] Start session response:",t,"(geminiConsent:",s,")"),!t.success){if(t.needsRefresh){n.className="status unsupported",n.innerHTML=`
          <strong>🔄 Page refresh needed</strong><br>
          <small>Please refresh the page and try again. The extension needs to reload on this page.</small>
        `,e.disabled=!1,e.textContent="Start Session Scan",e.className="scan-button";return}throw new Error(t.error||"Failed to start session")}r=!0,c=t.startTime||Date.now(),i=t.platform,console.log("[AlgorithmLens] Session started, startTime:",c),console.log("[AlgorithmLens] Auto-closing popup..."),window.close()}catch(s){console.error("[AlgorithmLens] Error starting session:",s),n.className="status unsupported";const t=s.message||"";t.includes("Could not establish connection")||t.includes("Receiving end does not exist")||t.includes("message port closed")?n.innerHTML=`
        <strong>🔄 Page refresh needed</strong><br>
        <small>Please refresh the page and try again. The extension needs to reload on this page.</small>
      `:n.innerHTML=`
        <strong>❌ Error</strong><br>
        <small>${t||"Could not start session"}</small>
      `,e.disabled=!1,e.textContent="Start Session Scan",e.className="scan-button"}}async function Z(){console.log("[AlgorithmLens] Stopping session and analyzing..."),A("log","[CaptureDebug] Stop Scan button clicked"),e.disabled=!0,e.textContent="Analyzing...",n.className="status loading",n.textContent="Stopping session and processing...",T();try{const s=await chrome.runtime.sendMessage({action:"STOP_SESSION_SCAN_AND_PROCESS"});if(console.log("[AlgorithmLens] Stop session response:",s),!s.success){if(s.alreadyProcessed){console.log("[AlgorithmLens] Ignoring duplicate stop request - already processed");return}if(s.needsRefresh){r=!1,c=null,n.className="status unsupported",n.innerHTML=`
          <strong>⚠️ Connection Lost</strong><br>
          <small>Lost connection to the page. Session data may have been lost due to page navigation. Please refresh and start a new session.</small>
        `,e.disabled=!1,e.textContent="Start Session Scan",e.className="scan-button";return}throw new Error(s.error||"Failed to process session")}r=!1,c=null,z=s.result,G=s.backendResponse,n.className="status results",n.innerHTML=W(s.result,s.durationSeconds,s.backendSaved,s.backendResponse,s.rateLimited),J(),console.log("[AlgorithmLens] ========================================"),console.log("[AlgorithmLens] SESSION SCAN COMPLETE"),console.log("[AlgorithmLens] ========================================"),console.log("[AlgorithmLens] Duration:",s.durationSeconds,"seconds"),console.log("[AlgorithmLens] Posts collected:",s.postCount),console.log("[AlgorithmLens] Platform:",s.platform),console.log("[AlgorithmLens] Backend saved:",s.backendSaved),console.log("[AlgorithmLens] ----------------------------------------"),console.log("[AlgorithmLens] FULL RESULT:"),console.log(JSON.stringify(s.result,null,2)),console.log("[AlgorithmLens] ========================================"),e.disabled=!1,e.textContent="Start Session Scan",e.className="scan-button"}catch(s){console.error("[AlgorithmLens] Error processing session:",s),r=!1,c=null,n.className="status unsupported";const t=s.message||"";t.includes("Could not establish connection")||t.includes("Receiving end does not exist")||t.includes("message port closed")?n.innerHTML=`
        <strong>⚠️ Connection Lost</strong><br>
        <small>Lost connection to the page. Session data may have been lost due to page navigation. Please refresh and start a new session.</small>
      `:n.innerHTML=`
        <strong>❌ Error Processing Session</strong><br>
        <small>${t||"Could not process session"}</small>
      `,e.disabled=!1,e.textContent="Start Session Scan",e.className="scan-button"}}async function ss(){if(!S){console.log("[AlgorithmLens] Scan attempted on unsupported platform"),n.className="status unsupported",n.innerHTML="Go to TikTok, Instagram, YouTube, or Twitter/X to start a session scan.";return}r?await Z():await Q()}e.addEventListener("click",ss);document.addEventListener("DOMContentLoaded",()=>{H()});document.readyState!=="loading"&&H();async function es(){try{const t=(await chrome.storage.local.get(["aiConsentEnabled"])).aiConsentEnabled===!0;return p&&(p.checked=t),console.log("[AlgorithmLens] AI consent preference loaded:",t),t}catch(s){return console.error("[AlgorithmLens] Error loading AI consent preference:",s),!1}}async function ts(s){try{await chrome.storage.local.set({aiConsentEnabled:s}),console.log("[AlgorithmLens] AI consent preference saved:",s)}catch(t){console.error("[AlgorithmLens] Error saving AI consent preference:",t)}}function ns(){return p?p.checked:!1}p&&p.addEventListener("change",()=>{ts(p.checked)});es();
