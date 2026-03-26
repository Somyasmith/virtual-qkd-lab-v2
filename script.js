
function ugShow(id, el) {
  document.querySelectorAll('.ug-sec').forEach(s => s.classList.remove('ug-vis'));
  document.querySelectorAll('.ug-tab').forEach(t => t.classList.remove('ug-active'));
  document.getElementById(id).classList.add('ug-vis');
  el.classList.add('ug-active');
  document.getElementById('guide-body').scrollTop = 0;
}
// Re-render KaTeX when switching to guide tab
document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    if (t.dataset.panel === 'p-guide') {
      setTimeout(() => {
        if (window.renderMathInElement) {
          renderMathInElement(document.getElementById('guide-panel'), {
            delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
            throwOnError: false
          });
        }
      }, 200);
    }
  });
});


/* ============================================================ */


/* ════════════════════════════════════════════════
   QUANTUM PROTOCOL & ALGORITHM SIMULATOR — v6
   Original white+blue theme · Correct BB84 logic
   Per-bit encoding · Polariser animation
════════════════════════════════════════════════ */

// ── TAB SWITCHING ──────────────────────────────
document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const panelId = t.dataset.panel;
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.add('active');
      document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
    }

    // Set simulation active state based on current panel
    if (typeof soundManager !== 'undefined') {
      soundManager.setSimulationActive(panelId === 'p-exp');
    }

    if (panelId === 'p-exp') {
      setTimeout(() => { resizeCanvas(); buildLayout(); loadModule('basics'); }, 50);
    }
    if (panelId === 'p-home') {
      setTimeout(() => { initTipOfDay(); }, 50);
    }
  });
});

// ── FEEDBACK ────────────────────────────────────
let fbRating = 0;
function fbRate(n) {
  fbRating = n;
  const stars = document.querySelectorAll('.fb-star');
  const labels = ['', ' Poor', ' Fair', ' Good', ' Great', ' Excellent!'];
  stars.forEach((s, i) => { s.style.opacity = i < n ? '1' : '0.3'; s.style.transform = i < n ? 'scale(1.2)' : 'scale(1)'; });
  const rv = document.getElementById('fb-rating-val');
  if (rv) rv.textContent = labels[n] || '';
}
function submitFeedback() {
  const name = document.getElementById('fb-name').value.trim();
  const text = document.getElementById('fb-text').value.trim();
  if (!name || !text) { alert('Please fill in your name and feedback.'); return; }
  document.getElementById('fb-success').style.display = 'block';
  document.getElementById('fb-name').value = '';
  document.getElementById('fb-roll').value = '';
  document.getElementById('fb-text').value = '';
  document.getElementById('fb-module').value = '';
  fbRating = 0;
  document.querySelectorAll('.fb-star').forEach(s => { s.style.opacity = '1'; s.style.transform = 'scale(1)'; });
  const rv = document.getElementById('fb-rating-val'); if (rv) rv.textContent = '';
  setTimeout(() => { const s = document.getElementById('fb-success'); if (s) s.style.display = 'none'; }, 4000);
}

// ── EXPERIMENT SELECTION ──────────────────────
let currentExp = 1;
let simMode = 'beginner';

function selExp(el, n) {
  if (el.classList.contains('soon')) return;
  document.querySelectorAll('.expi').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
  currentExp = n;
  stopSim(true);
  // New order: 1=Superposition, 2=Teleportation, 3=BB84
  document.getElementById('view-bb84').style.display = n === 3 ? 'flex' : 'none';
  document.getElementById('view-super').style.display = n === 1 ? 'flex' : 'none';
  document.getElementById('view-tele').style.display = n === 2 ? 'flex' : 'none';
  document.getElementById('view-e91').style.display = n === 4 ? 'flex' : 'none';
  document.getElementById('bb84cfg').style.display = n === 3 ? 'block' : 'none';
  document.getElementById('progressBlock').style.display = n === 3 ? 'block' : 'none';
  document.getElementById('runBtn').style.display = n === 3 ? 'block' : 'none';
  document.getElementById('e91cfg').style.display = n === 4 ? 'block' : 'none';

  // Fix 1: Show right panel ONLY for BB84 (exp 3)
  const rightPanel = document.querySelector('.right');
  if (rightPanel) rightPanel.style.display = n === 3 ? 'flex' : 'none';

  // Fix grid columns: 3-col for BB84, 2-col for others
  const mainGrid = document.querySelector('.main');
  if (mainGrid) {
    mainGrid.style.gridTemplateColumns = n === 3 ? '214px 1fr 296px' : '214px 1fr';
  }
  // Fix 2: BB84 canvas — force resize after becoming visible
  if (n === 2) {
    setTimeout(() => { resizeTeleCanvas(); if (!teleState.animFrame) startTeleAnim(); }, 80);
  }
  if (n === 3) {
    // Poll until stage has real dimensions, then resize
    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      const stage = document.getElementById('stage');
      const h = stage ? (stage.offsetHeight || stage.clientHeight) : 0;
      if (h > 20 || attempts > 30) {
        clearInterval(poll);
        forceResizeBB84();
      }
    }, 40);
  }

  if (n === 4) {
    setTimeout(() => {
      resizeE91Canvas();
      e91InitUI();
      if (!e91State.animFrame) startE91Anim();
    }, 80);
    setTimeout(() => { resizeE91Canvas(); }, 250);
  }
  // Cleanup E91 when switching away
  if (n !== 4 && typeof e91Cleanup === 'function') e91Cleanup();
  if (n === 1) {
    setTimeout(() => {
      if (blochReady && blochRenderer) {
        const c = document.getElementById('blochCanvas');
        if (c) {
          const W = c.clientWidth || c.offsetWidth || 200;
          const H = c.clientHeight || c.offsetHeight || 200;
          if (W > 10 && H > 10) {
            blochRenderer.setSize(W, H);
            blochCamera.aspect = W / H;
            blochCamera.updateProjectionMatrix();
          }
        }
      } else if (!blochReady) {
        // Three.js not yet loaded — wait and init
        const waitBloch = setInterval(() => {
          if (window.THREE) { clearInterval(waitBloch); blochReady = true; initBlochSphere(); }
        }, 100);
      }
      drawPhaseDial(0);
      qcUpdateViz();
    }, 120);
  }
}

function setMode(m) {
  simMode = m;
  document.getElementById('mBeg').classList.toggle('active', m === 'beginner');
  document.getElementById('mAdv').classList.toggle('active', m === 'advanced');
  PHOTON_INTERVAL = m === 'beginner' ? 4.5 : 2.0;
}

/* ════════════════════════════════════════════════
   VIRTUAL LAB — MODULE SYSTEM
   Mapping: selExp(el,1)=Superposition, selExp(el,2)=Teleportation
            selExp(el,3)=BB84, selExp(el,4)=E91
════════════════════════════════════════════════ */

// Safe wrapper — builds a dummy element so selExp's classList calls don't throw
function runSim(n) {
  document.getElementById('moduleContent').style.display = 'none';
  const dummy = document.createElement('div');
  dummy.classList.add('expi');
  selExp(dummy, n);
}

// Highlight active sidebar module
function setActiveNav(id) {
  document.querySelectorAll('#moduleNav .expi').forEach(e => e.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

// Hide all simulation views and show moduleContent
function hideAllSimulations() {
  document.getElementById('view-super').style.display = 'none';
  document.getElementById('view-tele').style.display = 'none';
  document.getElementById('view-bb84').style.display = 'none';
  document.getElementById('view-e91').style.display = 'none';
  document.getElementById('bb84cfg').style.display = 'none';
  document.getElementById('progressBlock').style.display = 'none';
  document.getElementById('runBtn').style.display = 'none';
  document.getElementById('e91cfg').style.display = 'none';
  // Reset right panel and grid columns back to 2-col
  const rightPanel = document.querySelector('.right');
  if (rightPanel) rightPanel.style.display = 'none';
  const mainGrid = document.querySelector('.main');
  if (mainGrid) mainGrid.style.gridTemplateColumns = '214px 1fr';
  // Show module UI
  const mc = document.getElementById('moduleContent');
  mc.style.display = 'flex';
  mc.style.flexDirection = 'column';
}

// Fade-in helper
function vlabFadeIn() {
  const mc = document.getElementById('moduleContent');
  mc.style.opacity = '0';
  requestAnimationFrame(() => { mc.style.opacity = '1'; });
}

// ── MAIN ROUTER ───────────────────────────────────────────────
function loadModule(module) {
  hideAllSimulations();
  vlabFadeIn();
  const content = document.getElementById('moduleContent');

  if (module === 'basics') {
    setActiveNav('nav-basics');
    content.innerHTML = `
      <div class="vlab-section-title"> Basics of Quantum Computing</div>
      <div class="vlab-tab-row">
        <button id="vtab-theory" class="vlab-tab-btn vt-active" onclick="loadBasics('theory')"> THEORY</button>
        <button id="vtab-sim"    class="vlab-tab-btn"           onclick="loadBasics('sim')"> SIMULATION</button>
        <button id="vtab-mcq"    class="vlab-tab-btn"           onclick="loadBasics('mcq')"> MCQ</button>
      </div>
      <div id="subContent"></div>
    `;
    loadBasics('theory');
  }
  else if (module === 'algorithms') {
    setActiveNav('nav-algorithms');
    content.innerHTML = `
      <div class="vlab-section-title">️ Quantum Algorithms</div>
      <div class="vlab-card-grid">
        <div class="vlab-card" onclick="openAlgo('tele')" style="position:relative;transition:all 0.25s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 24px rgba(42,109,217,0.25)';" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none';">
          <div style="font-size:18px;font-weight:700;margin-bottom:8px;color:var(--sky);">Teleportation</div>
          <div style="font-size:12px;color:var(--tm);margin-bottom:12px;text-align:left;">
            • Transfer quantum state using entanglement<br>
            • Step-by-step circuit visualization
          </div>
          <button style="background:linear-gradient(135deg,var(--sky),#1a5bbd);color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:11px;font-weight:700;cursor:pointer;width:100%;margin-bottom:8px;">▶ Run Simulation</button>
          <div style="position:absolute;top:-10px;right:-10px;background:#27ae60;color:#fff;padding:5px 10px;border-radius:12px;font-size:9.5px;font-weight:700;box-shadow:0 2px 8px rgba(39,174,96,0.3);">AVAILABLE ✅</div>
        </div>
        <div class="vlab-card soon" style="opacity:0.6;pointer-events:none;cursor:not-allowed;position:relative;">
          <div style="font-size:18px;font-weight:700;margin-bottom:8px;color:var(--tl);">Shor’s Algorithm</div>
          <div style="font-size:12px;color:var(--tm);margin-bottom:12px;text-align:left;">
            • Integer factorization using quantum computing
          </div>
          <button style="background:var(--bd);color:var(--tl);border:none;border-radius:6px;padding:8px 16px;font-size:11px;font-weight:700;width:100%;margin-bottom:8px;">🚧 Coming Soon</button>
          <div style="position:absolute;top:-10px;right:-10px;background:#f39c12;color:#fff;padding:5px 10px;border-radius:12px;font-size:9.5px;font-weight:700;box-shadow:0 2px 8px rgba(243,156,18,0.3);">COMING SOON 🚧</div>
        </div>
      </div>
    `;
  }
  else if (module === 'protocols') {
    setActiveNav('nav-protocols');
    content.innerHTML = `
      <div class="vlab-section-title"> Quantum Protocols</div>
      <div class="vlab-card-grid">
        <div class="vlab-card" onclick="openProtocol('bb84')" style="position:relative;transition:all 0.25s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 24px rgba(42,109,217,0.25)';" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none';">
          <div style="font-size:18px;font-weight:700;margin-bottom:8px;color:var(--sky);">BB84</div>
          <div style="font-size:12px;color:var(--tm);margin-bottom:12px;text-align:left;">
            • Quantum key distribution using photon polarization<br>
            • Secure communication with eavesdropping detection
          </div>
          <button style="background:linear-gradient(135deg,var(--sky),#1a5bbd);color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:11px;font-weight:700;cursor:pointer;width:100%;margin-bottom:8px;">▶ Run Simulation</button>
          <div style="position:absolute;top:-10px;right:-10px;background:#27ae60;color:#fff;padding:5px 10px;border-radius:12px;font-size:9.5px;font-weight:700;box-shadow:0 2px 8px rgba(39,174,96,0.3);">AVAILABLE ✅</div>
        </div>
        <div class="vlab-card" onclick="openProtocol('e91')" style="position:relative;transition:all 0.25s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 24px rgba(42,109,217,0.25)';" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none';">
          <div style="font-size:18px;font-weight:700;margin-bottom:8px;color:var(--sky);">E91</div>
          <div style="font-size:12px;color:var(--tm);margin-bottom:12px;text-align:left;">
            • Entanglement-based quantum key distribution<br>
            • Uses Bell inequality for security
          </div>
          <button style="background:linear-gradient(135deg,var(--sky),#1a5bbd);color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:11px;font-weight:700;cursor:pointer;width:100%;margin-bottom:8px;">▶ Run Simulation</button>
          <div style="position:absolute;top:-10px;right:-10px;background:#27ae60;color:#fff;padding:5px 10px;border-radius:12px;font-size:9.5px;font-weight:700;box-shadow:0 2px 8px rgba(39,174,96,0.3);">AVAILABLE ✅</div>
        </div>
      </div>
    `;
  }
}

// ── BASICS MODULE ─────────────────────────────────────────────
function setActiveVTab(id) {
  document.querySelectorAll('.vlab-tab-btn').forEach(b => {
    b.classList.remove('vt-active');
    if (b.classList.contains('vt-sim')) { /* keep sim style */ }
  });
  const el = document.getElementById(id);
  if (el) el.classList.add('vt-active');
}

window.showThTab = function(id, el) {
  document.querySelectorAll('.th-sec').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.th-tab-btn').forEach(b => b.classList.remove('th-active'));
  document.getElementById(id).style.display = 'block';
  el.classList.add('th-active');
};

function loadBasics(type) {
  const sub = document.getElementById('subContent');
  if (!sub) return;

  if (type === 'theory') {
    setActiveVTab('vtab-theory');
    sub.innerHTML = `
    <style>
      .th-tab-btn {
        background: transparent;
        border: none;
        color: var(--tl);
        font-size: 11.5px;
        font-family: 'Poppins', sans-serif;
        font-weight: 600;
        cursor: pointer;
        padding: 8px 14px;
        border-radius: 6px;
        transition: all 0.2s;
        white-space: nowrap;
      }
      .th-tab-btn:hover { background: rgba(99,179,237,0.1); color: var(--sky); }
      .th-tab-btn.th-active { background: var(--sky); color: #fff; }
    </style>
    
    <!-- Inner Tabs -->
    <div style="display:flex;gap:8px;margin-bottom:15px;border-bottom:1px solid var(--bd);padding-bottom:12px;overflow-x:auto;">
      <button class="th-tab-btn th-active" onclick="showThTab('th-1', this)">1–2 · Bits & Qubits</button>
      <button class="th-tab-btn" onclick="showThTab('th-2', this)">3–5 · Superposition & Math</button>
      <button class="th-tab-btn" onclick="showThTab('th-3', this)">6–7 · Bloch Sphere & Gates</button>
      <button class="th-tab-btn" onclick="showThTab('th-4', this)">8–9 · Systems & Properties</button>
    </div>

    <div class="vlab-theory-box" style="display:flex;flex-direction:column;gap:0;">

      <!-- TAB 1: Bits & Qubits -->
      <div id="th-1" class="th-sec" style="display:block;">
        <!-- 1. What is a Qubit -->
        <h3> 1. What is a Qubit?</h3>
        <p>A <b>classical bit</b> can be only <b>0</b> or <b>1</b> — like a light switch  that is either OFF or ON.</p>
        <p>A <b>qubit</b> (quantum bit) can be <b>0</b>, <b>1</b>, or <b>both at the same time</b> — until you look at it!</p>
        <p> <b>Mathematical form:</b></p>
        <div style="background:#eef4ff;border-left:3px solid var(--sky);border-radius:6px;padding:10px 14px;font-family:'Courier New',monospace;font-size:12px;color:var(--sky);margin:6px 0;">|ψ⟩ = α|0⟩ + β|1⟩</div>
        <p>Where <b>α</b> and <b>β</b> are complex numbers (probability amplitudes), and <b>|α|² + |β|² = 1</b> (total probability = 1).</p>
        <p> <b>Interpretation:</b> |α|² = probability of measuring 0 · |β|² = probability of measuring 1</p>
        <button class="reveal-btn" onclick="document.getElementById('r1').style.display='block';this.style.display='none';"> What happens when we measure a qubit?</button>
        <p id="r1" style="display:none;background:rgba(42,109,217,0.1);padding:8px 12px;border-radius:6px;color:var(--sky);font-weight:600;margin-top:4px;"> The qubit collapses to exactly 0 or 1 — the superposition is destroyed!</p>

        <hr>

        <!-- 2. Classical vs Quantum -->
        <h3> 2. Classical vs Quantum Computing</h3>
        <p>Classical computers use bits; quantum computers use qubits. Here's the key difference:</p>
        <table style="width:100%;border-collapse:collapse;font-size:10.5px;margin:8px 0;">
          <thead><tr style="background:var(--sky);color:#fff;"><th style="padding:7px 10px;text-align:left;">Property</th><th style="padding:7px 10px;">Classical Bit</th><th style="padding:7px 10px;">Qubit</th></tr></thead>
          <tbody>
            <tr style="border-bottom:1px solid var(--bd);"><td style="padding:6px 10px;font-weight:600;">States</td><td style="padding:6px 10px;text-align:center;">0 or 1</td><td style="padding:6px 10px;text-align:center;">0, 1, or both</td></tr>
            <tr style="border-bottom:1px solid var(--bd);background:#f8faff;"><td style="padding:6px 10px;font-weight:600;">Measurement</td><td style="padding:6px 10px;text-align:center;">Non-destructive</td><td style="padding:6px 10px;text-align:center;">Collapses state</td></tr>
            <tr style="border-bottom:1px solid var(--bd);"><td style="padding:6px 10px;font-weight:600;">Operations</td><td style="padding:6px 10px;text-align:center;">Irreversible</td><td style="padding:6px 10px;text-align:center;">Reversible (unitary)</td></tr>
            <tr style="background:#f8faff;"><td style="padding:6px 10px;font-weight:600;">Power</td><td style="padding:6px 10px;text-align:center;">Sequential</td><td style="padding:6px 10px;text-align:center;">Exponential (2ⁿ states)</td></tr>
          </tbody>
        </table>
      </div>

      <!-- TAB 2: Superposition & Math -->
      <div id="th-2" class="th-sec" style="display:none;">
        <!-- 3. Superposition -->
        <h3> 3. Superposition</h3>
        <p> Imagine a coin. When it lies on a table → it's either HEADS or TAILS. When it's <em>spinning in the air</em> → it's <b>both at the same time!</b></p>
        <p>That spinning coin is like a qubit in <b>superposition</b>.</p>
        <p>The <b>Hadamard (H) gate</b> puts a qubit into perfect 50/50 superposition:</p>
        <div style="background:#eef4ff;border-left:3px solid var(--sky);border-radius:6px;padding:10px 14px;font-family:'Courier New',monospace;font-size:12px;color:var(--sky);margin:6px 0;">H|0⟩ = (1/√2)(|0⟩ + |1⟩) → 50% chance of 0, 50% chance of 1</div>
        <p><b>Special Cases:</b></p>
        <p>• C-1: |ψ⟩ = |0⟩ → always measures 0</p>
        <p>• C-2: |ψ⟩ = |1⟩ → always measures 1</p>
        <p>• C-3: |ψ⟩ = (1/√2)(|0⟩ + |1⟩) → 50% each</p>
        <button class="reveal-btn" onclick="document.getElementById('r3').style.display='block';this.style.display='none';"> What does the H gate do geometrically?</button>
        <p id="r3" style="display:none;background:rgba(39,174,96,0.1);padding:8px 12px;border-radius:6px;color:var(--mint);font-weight:600;margin-top:4px;"> It rotates the qubit from the north pole (|0⟩) to the equator of the Bloch sphere!</p>

        <hr>

        <!-- 4. Dirac Notation -->
        <h3> 4. Dirac Notation (Bra-Ket)</h3>
        <p>Quantum mechanics uses a special notation invented by Paul Dirac:</p>
        <p><b>Ket |ψ⟩</b> = column vector = the quantum state of the system</p>
        <div style="background:#eef4ff;border-left:3px solid var(--sky);border-radius:6px;padding:10px 14px;font-family:'Courier New',monospace;font-size:11.5px;color:var(--sky);margin:6px 0;">|0⟩ = [1, 0]ᵀ &nbsp;&nbsp;&nbsp; |1⟩ = [0, 1]ᵀ</div>
        <p><b>Bra ⟨ψ|</b> = row vector = conjugate transpose = used for measurement/comparison</p>
        <div style="background:#eef4ff;border-left:3px solid var(--sky);border-radius:6px;padding:10px 14px;font-family:'Courier New',monospace;font-size:11.5px;color:var(--sky);margin:6px 0;">⟨0| = [1, 0] &nbsp;&nbsp;&nbsp; ⟨1| = [0, 1]</div>
        <p><b>Inner Product (Braket):</b></p>
        <div style="background:#eef4ff;border-left:3px solid var(--sky);border-radius:6px;padding:10px 14px;font-family:'Courier New',monospace;font-size:11.5px;color:var(--sky);margin:6px 0;">⟨0|0⟩ = 1 (same state) &nbsp;&nbsp; ⟨0|1⟩ = 0 (orthogonal states)</div>
        <p><b>Summary:</b> |ψ⟩ = state · ⟨ψ| = conjugate transpose · ⟨ψ|ψ⟩ = total probability = 1</p>

        <hr>

        <!-- 5. Basis -->
        <h3> 5. Basis (Z-Basis & X-Basis)</h3>
        <p>A <b>basis</b> is a set of reference states used to describe or measure a qubit.</p>
        <p> <b>Z-Basis (Computational / Standard):</b> {|0⟩, |1⟩} — the most common basis.</p>
        <div style="background:#eef4ff;border-left:3px solid var(--sky);border-radius:6px;padding:10px 14px;font-family:'Courier New',monospace;font-size:11.5px;color:var(--sky);margin:6px 0;">|0⟩ = [1, 0]ᵀ &nbsp;&nbsp; |1⟩ = [0, 1]ᵀ</div>
        <p> <b>X-Basis (Diagonal):</b> {|+⟩, |−⟩} — rotated 45° from Z-basis.</p>
        <div style="background:#eef4ff;border-left:3px solid var(--sky);border-radius:6px;padding:10px 14px;font-family:'Courier New',monospace;font-size:11.5px;color:var(--sky);margin:6px 0;">|+⟩ = (1/√2)(|0⟩ + |1⟩) &nbsp;&nbsp; |−⟩ = (1/√2)(|0⟩ − |1⟩)</div>
        <p> <b>Key Points:</b></p>
        <p>• The <em>same qubit state</em> has different representations in different bases</p>
        <p>• Measurement basis determines what outcome you observe</p>
        <p>• In BB84: Alice and Bob use rectilinear (+) or diagonal (×) basis</p>
        <button class="reveal-btn" onclick="document.getElementById('r5').style.display='block';this.style.display='none';"> What are the polarisation angles for each basis?</button>
        <p id="r5" style="display:none;background:rgba(42,109,217,0.1);padding:8px 12px;border-radius:6px;color:var(--sky);font-weight:600;margin-top:4px;"> Rectilinear basis: 0° and 90° · Diagonal basis: 45° and 135°</p>
      </div>

      <!-- TAB 3: Bloch Sphere & Gates -->
      <div id="th-3" class="th-sec" style="display:none;">
        <!-- 6. Bloch Sphere -->
        <h3> 6. Bloch Sphere</h3>
        <p>The Bloch Sphere is a 3D geometric model for representing all possible states of a single qubit:</p>
        <p> <b>North Pole</b> = |0⟩ (definitely zero)</p>
        <p> <b>South Pole</b> = |1⟩ (definitely one)</p>
        <p> <b>Equator</b> = Perfect superposition (50/50)</p>
        <p> <b>Any other point</b> = A specific superposition state</p>
        <div style="background:#eef4ff;border-left:3px solid var(--sky);border-radius:6px;padding:10px 14px;font-family:'Courier New',monospace;font-size:11px;color:var(--sky);margin:6px 0;">|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ) sin(θ/2)|1⟩</div>
        <p>• <b>θ (theta)</b> = controls probability (0° = |0⟩, 180° = |1⟩)</p>
        <p>• <b>φ (phi)</b> = controls phase (0° to 360°)</p>
        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/Bloch_sphere.svg" width="150" style="display:block;margin:10px auto;opacity:0.85;filter:drop-shadow(0 4px 8px rgba(42,109,217,0.3));">
        <p style="text-align:center;font-size:9.5px;color:var(--tl);">The Bloch Sphere — every surface point represents a valid qubit state</p>

        <hr>

        <!-- 7. Quantum Gates -->
        <h3> 7. Quantum Gates</h3>
        <p>Quantum gates are <b>reversible</b> operations on qubits — like classical logic gates but for quantum states.</p>
        <p> <b>X Gate (Quantum NOT / Pauli-X):</b> Flips the qubit</p>
        <div style="background:#eef4ff;border-left:3px solid var(--sky);border-radius:6px;padding:10px 14px;font-family:'Courier New',monospace;font-size:11px;color:var(--sky);margin:6px 0;">X|0⟩ = |1⟩ &nbsp;&nbsp; X|1⟩ = |0⟩ &nbsp;&nbsp; Matrix: [[0,1],[1,0]]</div>
        <p> <b>H Gate (Hadamard):</b> Creates superposition</p>
        <div style="background:#eef4ff;border-left:3px solid var(--sky);border-radius:6px;padding:10px 14px;font-family:'Courier New',monospace;font-size:11px;color:var(--sky);margin:6px 0;">H|0⟩ = (1/√2)(|0⟩+|1⟩) &nbsp;&nbsp; Matrix: (1/√2)[[1,1],[1,-1]]</div>
        <p> <b>Z Gate (Pauli-Z):</b> Changes phase of |1⟩</p>
        <div style="background:#eef4ff;border-left:3px solid var(--sky);border-radius:6px;padding:10px 14px;font-family:'Courier New',monospace;font-size:11px;color:var(--sky);margin:6px 0;">Z|0⟩ = |0⟩ &nbsp;&nbsp; Z|1⟩ = −|1⟩ &nbsp;&nbsp; Matrix: [[1,0],[0,-1]]</div>
        <p> <b>Y Gate (Pauli-Y):</b> Combination of X and Z</p>
        <div style="background:#eef4ff;border-left:3px solid var(--sky);border-radius:6px;padding:10px 14px;font-family:'Courier New',monospace;font-size:11px;color:var(--sky);margin:6px 0;">Y|0⟩ = i|1⟩ &nbsp;&nbsp; Y|1⟩ = −i|0⟩ &nbsp;&nbsp; Matrix: [[0,-i],[i,0]]</div>
        <p> <b>S Gate:</b> Phase gate, adds π/2 phase. &nbsp; <b>T Gate:</b> Adds π/4 phase (T = √S).</p>
        <button class="reveal-btn" onclick="document.getElementById('r7').style.display='block';this.style.display='none';"> What makes quantum gates different from classical?</button>
        <p id="r7" style="display:none;background:rgba(39,174,96,0.1);padding:8px 12px;border-radius:6px;color:var(--mint);font-weight:600;margin-top:4px;"> Quantum gates are always reversible (unitary matrices, UU† = I). Classical gates like AND are NOT reversible — you can't recover inputs from output!</p>
      </div>

      <!-- TAB 4: Systems & Properties -->
      <div id="th-4" class="th-sec" style="display:none;">
        <!-- 8. 2-Qubit Systems -->
        <h3> 8. 2-Qubit Systems</h3>
        <p>Two qubits together have 4 basis states: <b>|00⟩, |01⟩, |10⟩, |11⟩</b></p>
        <p> <b>CNOT Gate (Controlled-NOT):</b> Flips target qubit if control qubit is |1⟩</p>
        <div style="background:#eef4ff;border-left:3px solid var(--sky);border-radius:6px;padding:10px 14px;font-family:'Courier New',monospace;font-size:11px;color:var(--sky);margin:6px 0;">|00⟩→|00⟩ &nbsp; |01⟩→|01⟩ &nbsp; |10⟩→|11⟩ &nbsp; |11⟩→|10⟩</div>
        <p> <b>CZ Gate (Controlled-Z):</b> Applies Z gate to target if control is |1⟩</p>
        <div style="background:#eef4ff;border-left:3px solid var(--sky);border-radius:6px;padding:10px 14px;font-family:'Courier New',monospace;font-size:11px;color:var(--sky);margin:6px 0;">|11⟩ → −|11⟩ &nbsp;&nbsp; (only |11⟩ gets a phase flip)</div>
        <p> <b>SWAP Gate:</b> Swaps the states of two qubits</p>
        <div style="background:#eef4ff;border-left:3px solid var(--sky);border-radius:6px;padding:10px 14px;font-family:'Courier New',monospace;font-size:11px;color:var(--sky);margin:6px 0;">SWAP|01⟩ = |10⟩ &nbsp;&nbsp; Qubit 1 ↔ Qubit 2</div>

        <hr>

        <!-- 9. Key Quantum Properties -->
        <h3>️ 9. Key Quantum Properties</h3>
        <p> <b>No-Cloning Theorem:</b> It is <em>mathematically impossible</em> to create a perfect copy of an unknown quantum state.</p>
        <p> Why it matters: A spy (Eve) cannot copy your quantum message silently — she <em>must</em> disturb the state, which reveals her presence.</p>
        <p> <b>Decoherence:</b> Interaction with the environment destroys superposition.</p>
        <p>• Clean state: |ψ⟩ = α|0⟩ + β|1⟩ (pure superposition)</p>
        <p>• After decoherence: |ψ⟩ becomes a mixed/disturbed state → errors increase, QBER rises</p>
        <p> Real-world quantum systems are NOT ideal — decoherence causes noise, photon loss, and information loss.</p>
        <p> <b>Measurement Effect:</b> Observing a qubit always changes its state. This is the fundamental reason quantum eavesdropping is always detectable.</p>
        <button class="reveal-btn" onclick="document.getElementById('r9').style.display='block';this.style.display='none';"> How does the No-Cloning Theorem protect BB84?</button>
        <p id="r9" style="display:none;background:rgba(39,174,96,0.1);padding:8px 12px;border-radius:6px;color:var(--mint);font-weight:600;margin-top:4px;"> Eve cannot copy Alice's photons without measuring them. Measuring disturbs them → Bob sees errors → QBER exceeds 11% → eavesdropping detected!</p>
      </div>
    `;
  }
  else if (type === 'sim') {
    setActiveVTab('vtab-sim');
    sub.innerHTML = `
      <div class="vlab-card-grid" style="margin-top:20px;">
        <div class="vlab-card" onclick="openAlgo('super'); setTimeout(() => algoSim('super'), 100);" style="position:relative;transition:all 0.25s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 24px rgba(42,109,217,0.25)';" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none';">
          <div style="font-size:18px;font-weight:700;margin-bottom:8px;color:var(--sky);">Superposition</div>
          <div style="font-size:12px;color:var(--tm);margin-bottom:12px;text-align:left;">
            • Visualize qubit states on Bloch sphere<br>
            • Adjust probability amplitudes
          </div>
          <button style="background:linear-gradient(135deg,var(--sky),#1a5bbd);color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:11px;font-weight:700;cursor:pointer;width:100%;margin-bottom:8px;">▶ Launch Simulation</button>
          <div style="position:absolute;top:-10px;right:-10px;background:#27ae60;color:#fff;padding:5px 10px;border-radius:12px;font-size:9.5px;font-weight:700;box-shadow:0 2px 8px rgba(39,174,96,0.3);">AVAILABLE ✅</div>
        </div>
        <div class="vlab-card" onclick="openAlgo('ent'); setTimeout(() => algoSim('ent'), 100);" style="position:relative;transition:all 0.25s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 24px rgba(42,109,217,0.25)';" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none';">
          <div style="font-size:18px;font-weight:700;margin-bottom:8px;color:var(--sky);">Entanglement</div>
          <div style="font-size:12px;color:var(--tm);margin-bottom:12px;text-align:left;">
            • Create Bell states<br>
            • Measure correlated qubits
          </div>
          <button style="background:linear-gradient(135deg,var(--sky),#1a5bbd);color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:11px;font-weight:700;cursor:pointer;width:100%;margin-bottom:8px;">▶ Launch Simulation</button>
          <div style="position:absolute;top:-10px;right:-10px;background:#27ae60;color:#fff;padding:5px 10px;border-radius:12px;font-size:9.5px;font-weight:700;box-shadow:0 2px 8px rgba(39,174,96,0.3);">AVAILABLE ✅</div>
        </div>
        <div class="vlab-card soon" style="opacity:0.6;pointer-events:none;cursor:not-allowed;position:relative;">
          <div style="font-size:18px;font-weight:700;margin-bottom:8px;color:var(--tl);">No-Cloning Theorem</div>
          <div style="font-size:12px;color:var(--tm);margin-bottom:12px;text-align:left;">
            • Demonstrates impossibility of cloning quantum states
          </div>
          <button style="background:var(--bd);color:var(--tl);border:none;border-radius:6px;padding:8px 16px;font-size:11px;font-weight:700;width:100%;margin-bottom:8px;">🚧 Coming Soon</button>
          <div style="position:absolute;top:-10px;right:-10px;background:#f39c12;color:#fff;padding:5px 10px;border-radius:12px;font-size:9.5px;font-weight:700;box-shadow:0 2px 8px rgba(243,156,18,0.3);">COMING SOON 🚧</div>
        </div>
      </div>
    `;
  }
  else if (type === 'mcq') {
    setActiveVTab('vtab-mcq');
    renderMCQLevel('easy', 'basics');
  }
}

// ── 3-LEVEL MCQ ENGINE ────────────────────────────────────────
const BASICS_MCQ = {
  easy: [
    { q: 'A classical bit can be…', opts: ['0 or 1', 'Both 0 and 1', 'Neither'], ans: 0 },
    { q: 'A qubit in superposition is…', opts: ['Only 0', 'Only 1', 'Both 0 and 1'], ans: 2 },
    { q: 'What does |0⟩ represent?', opts: ['State 1', 'State 0', 'Superposition'], ans: 1 },
    { q: 'What collapses a qubit?', opts: ['Entanglement', 'Measurement', 'Teleportation'], ans: 1 },
    { q: 'H gate stands for…', opts: ['Hadamard', 'Harmonic', 'Heisenberg'], ans: 0 },
    { q: 'The Bloch Sphere north pole = …', opts: ['|1⟩', 'Superposition', '|0⟩'], ans: 2 },
    { q: '|α|² + |β|² = …', opts: ['0', '2', '1'], ans: 2 },
    { q: 'X gate does what?', opts: ['Flips qubit', 'Creates superposition', 'Measures'], ans: 0 },
    { q: 'Ket notation |ψ⟩ represents…', opts: ['Row vector', 'Probability', 'Column vector'], ans: 2 },
    { q: 'Classical gates are…', opts: ['Reversible', 'Irreversible', 'Quantum'], ans: 1 }
  ],
  medium: [
    { q: 'Which basis has states |+⟩ and |−⟩?', opts: ['Z-basis', 'Y-basis', 'X-basis'], ans: 2 },
    { q: '⟨0|0⟩ = ?', opts: ['0', '1', '√2'], ans: 1 },
    { q: '⟨0|1⟩ = ?', opts: ['1', '0', 'i'], ans: 1 },
    { q: 'Decoherence is caused by…', opts: ['Measurement only', 'H gate', 'Environment interaction'], ans: 2 },
    { q: 'Z gate changes…', opts: ['Amplitude', 'Phase of |1⟩', 'Basis'], ans: 1 },
    { q: 'CNOT flips target when control is…', opts: ['|0⟩', '|+⟩', '|1⟩'], ans: 2 },
    { q: 'φ (phi) in Bloch sphere controls…', opts: ['Probability', 'Phase', 'Amplitude'], ans: 1 },
    { q: 'S gate adds a phase of…', opts: ['π', 'π/4', 'π/2'], ans: 2 },
    { q: 'No-Cloning theorem was proved in…', opts: ['1984', '1982', '1991'], ans: 1 },
    { q: 'After decoherence, QBER…', opts: ['Decreases', 'Stays same', 'Increases'], ans: 2 }
  ],
  hard: [
    { q: 'If θ=π/2, the qubit is at the…', opts: ['North pole', 'South pole', 'Equator'], ans: 2 },
    { q: 'H²= ?', opts: ['H', 'Z', 'I (Identity)'], ans: 2 },
    { q: 'For BB84 security, QBER must be below…', opts: ['25%', '5%', '11%'], ans: 2 },
    { q: 'Tsirelson bound for Bell inequality is…', opts: ['|S|≤2', '|S|≤2√2', '|S|≤3'], ans: 1 },
    { q: 'CNOT|10⟩ = ?', opts: ['|10⟩', '|01⟩', '|11⟩'], ans: 2 },
    { q: 'Eve introducing errors in BB84 causes QBER=', opts: ['11%', '5%', '25%'], ans: 2 },
    { q: 'T gate = ?', opts: ['√X', '√S', '√Z'], ans: 1 },
    { q: 'Y gate matrix diagonal is…', opts: ['[1,1]', '[0,0]', 'not diagonal'], ans: 2 },
    { q: 'SWAP|01⟩ = ?', opts: ['|00⟩', '|11⟩', '|10⟩'], ans: 2 },
    { q: 'Which gate is used in teleportation correction?', opts: ['S or T', 'X or Z', 'H or CNOT'], ans: 1 }
  ]
};

const TELEPORTATION_MCQ = {
  easy: [
    { q: 'Quantum teleportation transfers…', opts: ['Energy', 'Classical bits', 'Quantum state'], ans: 2 },
    { q: 'Teleportation requires how many qubits?', opts: ['1', '2', '3'], ans: 2 },
    { q: 'Who are the standard parties in teleportation?', opts: ['Alice & Bob', 'Eve & Charlie', 'Max & Planck'], ans: 0 },
    { q: 'An entangled pair is also called…', opts: ['Bell pair', 'GHZ state', 'Cluster state'], ans: 0 },
    { q: 'Teleportation needs classical communication of…', opts: ['1 bit', '2 bits', '3 bits'], ans: 1 },
    { q: 'The original qubit after teleportation…', opts: ['Remains same', 'Is destroyed', 'Gets copied'], ans: 1 },
    { q: 'Which gate is first applied in teleportation?', opts: ['CNOT', 'H', 'Z'], ans: 0 },
    { q: 'Bell states are…', opts: ['Separable states', 'Entangled states', 'Classical states'], ans: 1 },
    { q: 'Teleportation violates cloning theorem?', opts: ['Yes', 'No', 'Sometimes'], ans: 1 },
    { q: 'Measurement result is sent via…', opts: ['Quantum channel', 'Classical channel', 'No channel'], ans: 1 }
  ],

  medium: [
    { q: 'Initial entangled state used is…', opts: ['|00⟩', '|Φ+⟩', '|11⟩'], ans: 1 },
    { q: 'CNOT in teleportation uses control as…', opts: ['Unknown qubit', 'Bob\'s qubit', 'Classical bit'], ans: 0 },
    { q: 'Hadamard gate creates…', opts: ['Entanglement', 'Superposition', 'Measurement'], ans: 1 },
    { q: 'After measurement, Bob\'s qubit is…', opts: ['Destroyed', 'Random', 'Conditionally correctable'], ans: 2 },
    { q: 'If Alice measures 00, Bob applies…', opts: ['X', 'Z', 'Nothing'], ans: 2 },
    { q: 'If Alice measures 01, Bob applies…', opts: ['X', 'Z', 'XZ'], ans: 0 },
    { q: 'If Alice measures 10, Bob applies…', opts: ['X', 'Z', 'XZ'], ans: 1 },
    { q: 'If Alice measures 11, Bob applies…', opts: ['XZ', 'X', 'Z'], ans: 0 },
    { q: 'Teleportation uses how many classical bits?', opts: ['1', '2', '4'], ans: 1 },
    { q: 'The protocol was proposed in…', opts: ['1993', '1984', '2001'], ans: 0 }
  ],

  hard: [
    { q: 'Teleportation fidelity ideally equals…', opts: ['0.5', '1', '0'], ans: 1 },
    { q: 'Bell measurement projects onto…', opts: ['Computational basis', 'Bell basis', 'Fourier basis'], ans: 1 },
    { q: 'State |ψ⟩ = α|0⟩+β|1⟩ after teleportation becomes…', opts: ['α|1⟩+β|0⟩', 'Same state', 'Collapsed to |0⟩'], ans: 1 },
    { q: 'Entanglement is consumed during teleportation?', opts: ['Yes', 'No', 'Optional'], ans: 0 },
    { q: 'Without classical bits, teleportation…', opts: ['Still works', 'Fails', 'Becomes faster'], ans: 1 },
    { q: 'Teleportation speed is limited by…', opts: ['Light speed', 'Quantum gates', 'Entanglement'], ans: 0 },
    { q: 'Bell state |Φ+⟩ = ?', opts: ['(|00⟩+|11⟩)/√2', '(|01⟩+|10⟩)/√2', '|00⟩'], ans: 0 },
    { q: 'Global phase affects teleportation?', opts: ['Yes', 'No', 'Sometimes'], ans: 1 },
    { q: 'Teleportation circuit requires how many measurements?', opts: ['1', '2', '3'], ans: 1 },
    { q: 'Quantum teleportation is used in…', opts: ['QKD', 'Quantum networks', 'Both'], ans: 2 }
  ]
};
const SUPERPOSITION_MCQ = {
  easy: [
    { q: 'Superposition means a qubit can be…', opts: ['Only 0', 'Only 1', 'Both 0 and 1'], ans: 2 },
    { q: 'General qubit state is…', opts: ['|0⟩+|1⟩', 'α|0⟩+β|1⟩', '|ψ⟩=1'], ans: 1 },
    { q: 'Measurement of superposition gives…', opts: ['Both values', 'Random outcome', 'Always 0'], ans: 1 },
    { q: 'Superposition collapses when…', opts: ['Applying gate', 'Measurement', 'Rotation'], ans: 1 },
    { q: 'Which gate creates superposition?', opts: ['X', 'H', 'Z'], ans: 1 },
    { q: '|+⟩ state equals…', opts: ['(|0⟩−|1⟩)/√2', '(|0⟩+|1⟩)/√2', '|1⟩'], ans: 1 },
    { q: 'Probability of |0⟩ is given by…', opts: ['α', '|α|²', 'β'], ans: 1 },
    { q: 'If α=1, β=0 → state is…', opts: ['|1⟩', '|0⟩', 'Superposition'], ans: 1 },
    { q: 'Bloch sphere represents…', opts: ['Classical bits', 'Qubit states', 'Circuits'], ans: 1 },
    { q: 'Equal superposition means…', opts: ['α=β', 'α=0', 'β=0'], ans: 0 }
  ],

  medium: [
    { q: 'H|0⟩ = ?', opts: ['|0⟩', '|+⟩', '|−⟩'], ans: 1 },
    { q: 'H|1⟩ = ?', opts: ['|+⟩', '|−⟩', '|1⟩'], ans: 1 },
    { q: '|−⟩ state equals…', opts: ['(|0⟩+|1⟩)/√2', '(|0⟩−|1⟩)/√2', '|0⟩'], ans: 1 },
    { q: 'θ in Bloch sphere controls…', opts: ['Phase', 'Amplitude ratio', 'Measurement'], ans: 1 },
    { q: 'φ controls…', opts: ['Phase', 'Probability', 'Collapse'], ans: 0 },
    { q: 'Normalization condition is…', opts: ['α+β=1', '|α|²+|β|²=1', 'αβ=1'], ans: 1 },
    { q: 'Superposition exists until…', opts: ['Noise', 'Measurement', 'Rotation'], ans: 1 },
    { q: 'Global phase affects measurement?', opts: ['Yes', 'No', 'Sometimes'], ans: 1 },
    { q: 'Applying H twice gives…', opts: ['X', 'I', 'Z'], ans: 1 },
    { q: 'Probability of |1⟩ is…', opts: ['|β|²', 'β', '|α|²'], ans: 0 }
  ],

  hard: [
    { q: 'State after H on |+⟩ is…', opts: ['|0⟩', '|1⟩', '|+⟩'], ans: 0 },
    { q: 'If θ=π, state is…', opts: ['|0⟩', '|1⟩', 'Superposition'], ans: 1 },
    { q: 'Equator of Bloch sphere represents…', opts: ['Basis states', 'Equal superposition', 'Measurement'], ans: 1 },
    { q: 'Relative phase affects…', opts: ['Probability', 'Interference', 'Normalization'], ans: 1 },
    { q: 'State α|0⟩+β|1⟩ is valid if…', opts: ['Normalized', 'Measured', 'Real'], ans: 0 },
    { q: 'Superposition is key for…', opts: ['Parallelism', 'Classical logic', 'Irreversibility'], ans: 0 },
    { q: 'After measurement, state becomes…', opts: ['Same', 'Collapsed basis state', 'Mixed'], ans: 1 },
    { q: 'Complex amplitudes allow…', opts: ['Phase interference', 'Noise', 'Decoherence'], ans: 0 },
    { q: 'Bloch vector length is…', opts: ['1', '0', 'Variable'], ans: 0 },
    { q: 'Superposition differs from mixture because…', opts: ['Has phase info', 'Same concept', 'No probabilities'], ans: 0 }
  ]
};
const E91_MCQ = {
  easy: [
    { q: 'E91 protocol is based on…', opts: ['Superposition', 'Entanglement', 'Teleportation'], ans: 1 },
    { q: 'Proposed by…', opts: ['Bennett', 'Ekert', 'Shor'], ans: 1 },
    { q: 'E91 uses…', opts: ['Single qubits', 'Entangled pairs', 'Classical bits'], ans: 1 },
    { q: 'Entangled particles are shared between…', opts: ['Alice & Bob', 'Alice & Eve', 'Bob & Eve'], ans: 0 },
    { q: 'Measurement results are…', opts: ['Independent', 'Correlated', 'Random only'], ans: 1 },
    { q: 'Security is based on…', opts: ['No-cloning', 'Bell inequality', 'Superposition'], ans: 1 },
    { q: 'E91 detects eavesdropping using…', opts: ['Noise', 'Bell test', 'Measurement'], ans: 1 },
    { q: 'If Eve interferes, correlations…', opts: ['Increase', 'Break', 'Stay same'], ans: 1 },
    { q: 'E91 is a type of…', opts: ['Quantum computing', 'Quantum cryptography', 'Classical cryptography'], ans: 1 },
    { q: 'Key is generated from…', opts: ['Measurement outcomes', 'Gates', 'Entanglement only'], ans: 0 }
  ],

  medium: [
    { q: 'Bell inequality violation indicates…', opts: ['Classical system', 'Quantum entanglement', 'Noise'], ans: 1 },
    { q: 'CHSH inequality limit is…', opts: ['2', '2√2', '3'], ans: 0 },
    { q: 'Max quantum value is…', opts: ['2', '2√2', '4'], ans: 1 },
    { q: 'E91 uses how many measurement bases?', opts: ['1', '2', '3'], ans: 2 },
    { q: 'Correlation stronger than classical means…', opts: ['Secure', 'Broken', 'Noise'], ans: 0 },
    { q: 'If Bell inequality not violated →', opts: ['Secure', 'Eavesdropping possible', 'Perfect'], ans: 1 },
    { q: 'Entangled state commonly used is…', opts: ['|Φ+⟩', '|00⟩', '|01⟩'], ans: 0 },
    { q: 'Measurement settings are…', opts: ['Fixed', 'Random', 'Ignored'], ans: 1 },
    { q: 'Classical limit ensures…', opts: ['No entanglement', 'Entanglement', 'Teleportation'], ans: 0 },
    { q: 'Key extraction uses…', opts: ['Matching bases', 'All data', 'Random bits'], ans: 0 }
  ],

  hard: [
    { q: 'Tsirelson bound is…', opts: ['2', '2√2', '3'], ans: 1 },
    { q: 'Bell violation proves…', opts: ['Local realism', 'Non-locality', 'Classical behavior'], ans: 1 },
    { q: 'E91 security relies on…', opts: ['Mathematics only', 'Physics laws', 'Algorithms'], ans: 1 },
    { q: 'If S ≤ 2 → system is…', opts: ['Quantum', 'Classical', 'Secure'], ans: 1 },
    { q: 'If S > 2 → indicates…', opts: ['Noise', 'Entanglement', 'Error'], ans: 1 },
    { q: 'E91 differs from BB84 because…', opts: ['Uses entanglement', 'Uses bits', 'Uses noise'], ans: 0 },
    { q: 'Eve measuring causes…', opts: ['Bell violation increase', 'Correlation loss', 'Perfect key'], ans: 1 },
    { q: 'Quantum correlations are…', opts: ['Local', 'Non-local', 'Deterministic'], ans: 1 },
    { q: 'Measurement outcomes depend on…', opts: ['Hidden variables', 'Quantum states', 'Classical bits'], ans: 1 },
    { q: 'E91 ensures security even with…', opts: ['Untrusted devices', 'Perfect devices only', 'No entanglement'], ans: 0 }
  ]
};

let currentMCQLevel = 'easy';
let currentMCQQuestions = [];

function getMCQData(type) {
  if (type === 'teleportation') return TELEPORTATION_MCQ;
  if (type === 'basics') return BASICS_MCQ;

  if (ALGO_DATA && ALGO_DATA[type] && ALGO_DATA[type].mcq) {
    const mcq = ALGO_DATA[type].mcq;
    if (mcq.easy && mcq.medium && mcq.hard) {
      return mcq;
    }
    if (Array.isArray(mcq)) {
      return { easy: mcq, medium: mcq, hard: mcq };
    }
  }

  if (PROTO_DATA && PROTO_DATA[type] && PROTO_DATA[type].mcq) {
    const mcq = PROTO_DATA[type].mcq;
    if (mcq.easy && mcq.medium && mcq.hard) {
      return mcq;
    }
    if (Array.isArray(mcq)) {
      return { easy: mcq, medium: mcq, hard: mcq };
    }
  }

  return BASICS_MCQ;
}

function renderMCQLevel(level, type = 'basics') {
  currentMCQLevel = level;
  const mcqData = getMCQData(type);
  const pool = mcqData[level] || [];
  // Pick 5 random questions
  currentMCQQuestions = [...pool].sort(() => 0.5 - Math.random()).slice(0, 5);
  const sub = document.getElementById('subContent');
  if (!sub) return;

  const levelColors = { easy: '#27ae60', medium: '#f39c12', hard: '#e74c3c' };
  const levelIcons = { easy: '', medium: '', hard: '' };

  const qs = currentMCQQuestions.map((item, i) => {
    const id = `bmcq${i}_${Date.now()}`;
    const opts = item.opts.map((o, j) =>
      `<div class="vlab-option" onclick="vlabCheck(this,'${id}',${j === item.ans})">${o}</div>`
    ).join('');
    return `<div class="vlab-question" id="${id}"><p><b>Q${i + 1}:</b> ${item.q}</p>${opts}<div class="vlab-q-feedback"></div></div>`;
  }).join('');

  sub.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
      <span style="font-size:11px;font-weight:700;color:var(--td);">Difficulty:</span>
      <button onclick="renderMCQLevel('easy', '${type}')"   style="padding:5px 14px;border-radius:6px;border:1.5px solid ${level === 'easy' ? '#27ae60' : '"var(--bd)"'};background:${level === 'easy' ? '#27ae60' : '#fff'};color:${level === 'easy' ? '#fff' : 'var(--tm)'};font-family:'Poppins',sans-serif;font-size:10px;font-weight:700;cursor:pointer;"> Easy</button>
      <button onclick="renderMCQLevel('medium', '${type}')" style="padding:5px 14px;border-radius:6px;border:1.5px solid ${level === 'medium' ? '#f39c12' : '"var(--bd)"'};background:${level === 'medium' ? '#f39c12' : '#fff'};color:${level === 'medium' ? '#fff' : 'var(--tm)'};font-family:'Poppins',sans-serif;font-size:10px;font-weight:700;cursor:pointer;"> Medium</button>
      <button onclick="renderMCQLevel('hard', '${type}')"   style="padding:5px 14px;border-radius:6px;border:1.5px solid ${level === 'hard' ? '#e74c3c' : '"var(--bd)"'};background:${level === 'hard' ? '#e74c3c' : '#fff'};color:${level === 'hard' ? '#fff' : 'var(--tm)'};font-family:'Poppins',sans-serif;font-size:10px;font-weight:700;cursor:pointer;"> Hard</button>
      <span style="font-size:10px;color:var(--tl);margin-left:4px;">5 random questions</span>
    </div>
    <div class="vlab-mcq-box" id="mcqBox">${qs}</div>
    <div style="display:flex;gap:10px;align-items:center;margin-top:14px;flex-wrap:wrap;">
      <button onclick="submitMCQ()" style="background:linear-gradient(135deg,var(--sky),#1a5bbd);color:#fff;border:none;border-radius:7px;padding:9px 22px;font-family:'Poppins',sans-serif;font-size:11px;font-weight:700;cursor:pointer;"> Submit Test</button>
      <button onclick="renderMCQLevel(currentMCQLevel, '${type}')" style="background:#fff;border:1.5px solid var(--bd);border-radius:7px;padding:9px 22px;font-family:'Poppins',sans-serif;font-size:11px;font-weight:700;color:var(--tm);cursor:pointer;"> Next Test</button>
    </div>
    <div id="mcqScore" style="display:none;margin-top:12px;padding:12px 16px;border-radius:10px;font-size:12px;font-weight:700;text-align:center;"></div>
  `;
}

function submitMCQ() {
  let correct = 0, total = currentMCQQuestions.length;
  currentMCQQuestions.forEach((item, i) => {
    const id = document.querySelector(`[id^="bmcq${i}_"]`);
    // Count green options
    if (id) {
      const green = id.querySelector('.vlab-option.correct');
      if (green) correct++;
    }
  });
  // Force answer all unanswered questions
  document.querySelectorAll('.vlab-option').forEach(o => { o.style.pointerEvents = 'none'; });

  const pct = Math.round((correct / total) * 100);
  let badge, bg, color;
  if (pct >= 80) { badge = ' Beginner Mastery!'; bg = 'rgba(39,174,96,0.12)'; color = '#27ae60'; }
  else if (pct >= 50) { badge = ' Intermediate'; bg = 'rgba(243,156,18,0.12)'; color = '#f39c12'; }
  else { badge = ' Keep Practising'; bg = 'rgba(231,76,60,0.10)'; color = '#e74c3c'; }

  const scoreEl = document.getElementById('mcqScore');
  scoreEl.style.display = 'block';
  scoreEl.style.background = bg;
  scoreEl.style.border = `1.5px solid ${color}`;
  scoreEl.style.color = color;
  scoreEl.innerHTML = `Score: ${correct} / ${total} &nbsp;|&nbsp; ${badge} &nbsp;|&nbsp; <span style="font-size:10px;font-weight:600;">Click "Next Test" for new questions</span>`;
}

// New option-style MCQ checker
function vlabCheck(el, qId, correct) {
  const qEl = document.getElementById(qId);
  if (!qEl) return;
  qEl.querySelectorAll('.vlab-option').forEach(o => {
    o.style.pointerEvents = 'none';
    o.style.opacity = '0.65';
  });
  el.style.opacity = '1';
  el.classList.add(correct ? 'correct' : 'wrong');
  const fb = qEl.querySelector('.vlab-q-feedback');
  if (fb) {
    fb.textContent = correct ? ' Correct! Well done!' : ' Not quite — check the Theory tab for a refresher.';
    fb.style.color = correct ? '#27ae60' : '#e74c3c';
    fb.style.fontWeight = '700';
    fb.style.marginTop = '6px';
    fb.style.fontSize = '10.5px';
  }
}
// ── ALGORITHMS ───────────────────────────────────────────────
const ALGO_DATA = {
  super: {
    label: 'Superposition', sim: true, simN: 1,
    theory: 'A qubit placed through a Hadamard (H) gate enters a 50/50 superposition of |0⟩ and |1⟩. Before measurement, it is genuinely both states at once — not just unknown. Measurement randomly collapses it to 0 or 1 with equal probability. This is the core resource that makes quantum computation powerful.',
    mcq: [
      { q: 'What gate creates superposition?', opts: ['Pauli-X', 'Hadamard (H)', 'Pauli-Z'], ans: 1 },
      { q: 'Superposition means a qubit is…', opts: ['Definitely 0', 'Definitely 1', 'Both 0 and 1 simultaneously'], ans: 2 }
    ]
  },
  ent: {
    label: 'Quantum Entanglement', sim: true, simN: 'ent',
    theory: 'Quantum entanglement links two qubits so that the state of one instantly determines the state of the other — no matter how far apart. When you measure one entangled qubit, the other "knows" the result immediately. Einstein called it "spooky action at a distance." Entanglement is the resource powering quantum teleportation, E91 cryptography, and quantum computing.',
    mcq: [
      { q: 'What is quantum entanglement?', opts: ['Two particles physically touching', 'Two qubits correlated regardless of distance', 'A type of quantum gate'], ans: 1 },
      { q: 'What happens when you measure one entangled qubit?', opts: ["The other is unaffected", "The partner's state is instantly determined", "Both collapse to the same random value always"], ans: 1 }
    ]
  },
  tele: {
    label: 'Quantum Teleportation', sim: true, simN: 2,
    theory: `
      <h4 style="color:var(--sky);margin-top:0;font-size:16px;"> What is Quantum Teleportation?</h4>
      <p style="margin-bottom:12px;font-size:13px;color:var(--tm);line-height:1.6;">Imagine you have a magic way to send the exact state of something to your friend — without moving it physically.<br><br>That’s <strong>quantum teleportation!</strong></p>
      <ul style="margin-left:20px;margin-bottom:18px;color:var(--tm);font-size:13px;list-style-type:none;padding-left:0;line-height:1.8;">
        <li>• It does NOT move the particle</li>
        <li>• It sends the information of the particle</li>
      </ul>
      <h4 style="color:var(--sky);margin-top:0;font-size:14px;"> Simple Idea (Think Like This)</h4>
      <p style="margin-bottom:8px;font-size:13px;color:var(--tm);">You have:</p>
      <ul style="margin-left:20px;margin-bottom:12px;color:var(--tm);font-size:13px;list-style-type:none;padding-left:0;line-height:1.8;">
        <li> A secret (quantum state)</li>
        <li>A magic connection (entanglement)</li>
        <li>A message (classical communication)</li>
      </ul>
      <p style="margin-bottom:18px;font-size:13px;color:var(--tm);">Using these, you can recreate the same thing somewhere else!</p>
      <h4 style="color:var(--sky);margin-top:0;font-size:14px;"> How It Works (Step-by-Step)</h4>
      <ol style="margin-left:20px;margin-bottom:12px;color:var(--tm);font-size:13px;line-height:1.8;">
        <li>Two people (Alice & Bob) share an entangled pair</li>
        <li>Alice combines her qubit with the unknown state</li>
        <li>She measures it → result becomes 2 classical bits</li>
        <li>She sends those bits to Bob (normal communication)</li>
        <li>Bob applies operations → gets the SAME quantum state</li>
      </ol>
      <p style="margin-bottom:18px;font-size:13px;color:var(--mint);font-weight:700;"> Magic: The original state disappears and reappears at Bob!</p>
      <h4 style="color:var(--sky);margin-top:0;font-size:14px;"> Key Concepts</h4>
      <ul style="margin-left:20px;margin-bottom:10px;color:var(--tm);font-size:13px;line-height:1.8;">
        <li><b>Entanglement</b> → special connection between qubits</li>
        <li><b>Measurement</b> → destroys original state</li>
        <li><b>Classical bits</b> → needed to complete teleportation</li>
        <li><b>No faster-than-light communication</b></li>
      </ul>
    `,
    mcq: [
      { q: 'What resource does teleportation require?', opts: ['A wormhole', 'Shared entanglement', 'A quantum hard drive'], ans: 1 },
      { q: 'Does teleportation copy the original qubit?', opts: ['Yes', 'No — the original is destroyed (No-Cloning)', 'Only if Eve allows it'], ans: 1 }
    ]
  },
  noclone: {
    label: 'No-Cloning Theorem', sim: false, simN: null,
    theory: 'The No-Cloning Theorem (Wootters & Zurek, 1982) proves it is impossible to create a perfect, identical copy of an arbitrary unknown quantum state. This is a direct consequence of quantum mechanics\' linearity. It is not a technological limitation — it is a mathematical law. This theorem underpins quantum cryptography: an eavesdropper cannot copy qubits without disturbing them.',
    mcq: [
      { q: 'The No-Cloning Theorem is…', opts: ['A technology limit we may overcome', 'A fundamental mathematical law', 'Only relevant to entangled qubits'], ans: 1 },
      { q: 'Why does No-Cloning matter for security?', opts: ['It prevents eavesdroppers from copying qubits silently', 'It makes keys shorter', 'It speeds up encryption'], ans: 0 }
    ]
  }
};

function openAlgo(type) {
  hideAllSimulations();
  vlabFadeIn();
  const info = ALGO_DATA[type];
  const content = document.getElementById('moduleContent');
  content.innerHTML = `
    <button class="vlab-back-btn" onclick="loadModule('algorithms')">← Back</button>
    <div class="vlab-section-title">️ ${info.label}</div>
    <div class="vlab-tab-row">
      <button id="atab-basics" class="vlab-tab-btn vt-active" onclick="algoBasics('${type}')"> BASICS</button>
      <button id="atab-mcq"    class="vlab-tab-btn"           onclick="algoMCQ('${type}')"> MCQ</button>
      ${info.sim ? `<button id="atab-sim" class="vlab-tab-btn vt-sim" onclick="algoSim('${type}')">▶ SIMULATION</button>` : ''}
    </div>
    <div id="subContent"></div>
  `;
  algoBasics(type);
}

function algoBasics(type) {
  document.getElementById('atab-basics') && setActiveVTab('atab-basics');
  vlabTrackProgress('algo-' + type);
  const info = ALGO_DATA[type];
  const noSimNote = !info.sim
    ? `<p style="margin-top:12px;padding:8px 12px;background:rgba(231,76,60,.07);border:1px solid rgba(231,76,60,.25);border-radius:6px;color:var(--coral);font-size:10.5px;font-weight:600;">️ No interactive simulation for this theorem — it is a mathematical proof, not a physical experiment.</p>`
    : '';
  document.getElementById('subContent').innerHTML = `
    <div class="vlab-theory-box">${info.theory}${noSimNote}</div>
  `;
}

function algoMCQ(type) {
  document.getElementById('atab-mcq') && setActiveVTab('atab-mcq');
  vlabTrackProgress('algo-mcq-' + type);

  if (type === 'tele') {
    // Use the advanced MCQ system for teleportation
    renderMCQLevel('easy', 'teleportation');
  } else {
    // Use the 3-tier MCQ engine for algorithm MCQ as well
    renderMCQLevel('easy', type);
  }
}

function algoSim(type) {
  const n = ALGO_DATA[type].simN;
  if (n === 'ent') {
    // Switch to the Entanglement tab
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
    const entTab = document.querySelector('.tab[data-panel="p-ent"]');
    if (entTab) entTab.classList.add('active');
    document.getElementById('p-ent').classList.add('active');
    setTimeout(() => { initEntParticles(); startEntLineAnim(); }, 60);
  } else if (n) {
    runSim(n);
  }
}

// ── PROTOCOLS ─────────────────────────────────────────────────
const PROTO_DATA = {
  bb84: {
    label: 'BB84 Protocol', simN: 3,
    theory: `
      <h4 style="color:var(--sky);margin-top:0;">🔹 1. Overview</h4>
      <p style="margin-bottom:8px;">BB84 (Bennett & Brassard, 1984) is the first quantum key distribution protocol.</p>
      <ul style="margin-left:20px;margin-bottom:16px;color:var(--tm);font-size:12.5px;">
        <li>Alice sends photons in random bases (+ or ×)</li>
        <li>Bob measures in random bases</li>
        <li>They compare bases publicly</li>
        <li>Matching results form the secret key</li>
      </ul>
      <h4 style="color:var(--sky);margin-top:0;">🔑 2. Key Concepts</h4>
      <ul style="margin-left:20px;margin-bottom:16px;color:var(--tm);font-size:12.5px;">
        <li><b>Qubit Encoding</b> – photons represent bits using polarization</li>
        <li><b>Bases</b> – Rectilinear (+) and Diagonal (×)</li>
        <li><b>Measurement</b> – collapses quantum state</li>
        <li><b>Eavesdropping</b> – introduces detectable errors</li>
      </ul>
      <h4 style="color:var(--sky);margin-top:0;">⚙️ 3. How BB84 Works</h4>
      <ol style="margin-left:20px;margin-bottom:16px;color:var(--tm);font-size:12.5px;">
        <li>Alice sends random qubits in random bases</li>
        <li>Bob measures using random bases</li>
        <li>They compare bases over classical channel</li>
        <li>Discard mismatched results</li>
        <li>Remaining bits form the key</li>
        <li>Check for eavesdropping (QBER)</li>
      </ol>
      <h4 style="color:var(--sky);margin-top:0;">🔐 4. Why is BB84 Secure?</h4>
      <ul style="margin-left:20px;color:var(--tm);font-size:12.5px;">
        <li>Measurement disturbs quantum states</li>
        <li>Eve cannot copy qubits (No-Cloning Theorem)</li>
        <li>High error rate indicates eavesdropping</li>
      </ul>
    `,
    mcq: [
      { q: 'What happens when a qubit is measured?', opts: ['It collapses its quantum state', 'It creates entanglement', 'It copies itself'], ans: 0 },
      { q: 'Which bases are used in BB84?', opts: ['Rectilinear (+) and Diagonal (×)', 'Circular and Elliptical', 'Alpha and Beta'], ans: 0 },
      { q: 'What is QBER?', opts: ['Quantum Bit Error Rate', 'Quantum Base Encryption Routine', 'Qubit Entanglement Ratio'], ans: 0 },
      { q: "Why can't Eve copy qubits?", opts: ['Because of the No-Cloning Theorem', 'Because she lacks classical channels', 'Because photons are too fast'], ans: 0 },
      { q: 'What happens if bases mismatch?', opts: ['The bits are discarded', 'They form the secret key', 'The protocol resets'], ans: 0 },
      { q: 'What indicates eavesdropping in BB84?', opts: ['A high QBER (>11%)', 'A low QBER', 'Perfectly matching bases'], ans: 0 }
    ]
  },
  e91: {
    label: 'E91 Protocol', simN: 4,
    theory: `
      <h4 style="color:var(--sky);margin-top:0;">🔹 1. Overview</h4>
      <p style="margin-bottom:8px;">E91 (Ekert, 1991) is an entanglement-based quantum key distribution protocol.</p>
      <ul style="margin-left:20px;margin-bottom:16px;color:var(--tm);font-size:12.5px;">
        <li>A central source emits pairs of entangled photons</li>
        <li>Alice and Bob each receive one photon</li>
        <li>They measure in randomly chosen angles</li>
        <li>Correlations are checked using Bell's inequality</li>
      </ul>
      <h4 style="color:var(--sky);margin-top:0;">🔑 2. Key Concepts</h4>
      <ul style="margin-left:20px;margin-bottom:16px;color:var(--tm);font-size:12.5px;">
        <li><b>Quantum Entanglement</b> – particles intrinsically linked across distance</li>
        <li><b>Bell Inequality</b> – tests if correlations are classical or quantum</li>
        <li><b>CHSH Value (|S|)</b> – must be > 2 for quantum security</li>
        <li><b>Device Independence</b> – security guaranteed even with untrusted sources</li>
      </ul>
      <h4 style="color:var(--sky);margin-top:0;">⚙️ 3. How E91 Works</h4>
      <ol style="margin-left:20px;margin-bottom:16px;color:var(--tm);font-size:12.5px;">
        <li>Source generates and distributes entangled pairs</li>
        <li>Alice and Bob select random measurement angles</li>
        <li>They independently measure their photons</li>
        <li>They publicly share their measurement bases</li>
        <li>Calculate Bell value (|S|) to check for eavesdropping</li>
        <li>If safe (|S| > 2), matching bases form the secret key</li>
      </ol>
      <h4 style="color:var(--sky);margin-top:0;">🔐 4. Why is E91 Secure?</h4>
      <ul style="margin-left:20px;color:var(--tm);font-size:12.5px;">
        <li>Information does not exist until measurement</li>
        <li>Any interception breaks entanglement</li>
        <li>Security is guaranteed by the laws of physics</li>
      </ul>
    `,
    mcq: [
      { q: 'What is the core resource used in E91?', opts: ['Quantum entanglement', 'Classical polarization', 'Symmetric encryption keys'], ans: 0 },
      { q: 'Which theorem/inequality proves security in E91?', opts: ['Bell inequality', 'No-Cloning Theorem', 'Pythagorean theorem'], ans: 0 },
      { q: 'What must the CHSH value (|S|) be for a secure quantum channel?', opts: ['Greater than 2', 'Less than 1', 'Exactly 0'], ans: 0 },
      { q: 'What happens if a spy intercepts the entangled particles?', opts: ['Entanglement is broken and |S| drops', 'The particles clone themselves safely', 'The spy learns the key silently'], ans: 0 },
      { q: 'Where do Alice and Bob get their photons from in E91?', opts: ['A shared central source', 'Alice generates and sends them to Bob', 'Bob generates and sends them to Alice'], ans: 0 },
      { q: 'What kind of security does E91 offer?', opts: ['Device-independent security', 'Computational security', 'Password-based security'], ans: 0 }
    ]
  }
};

function openProtocol(type) {
  hideAllSimulations();
  vlabFadeIn();
  const info = PROTO_DATA[type];
  const content = document.getElementById('moduleContent');
  content.innerHTML = `
    <button class="vlab-back-btn" onclick="loadModule('protocols')">← Back</button>
    <div class="vlab-section-title"> ${info.label}</div>
    <div class="vlab-tab-row">
      <button id="ptab-basics" class="vlab-tab-btn vt-active" onclick="protocolBasics('${type}')"> BASICS</button>
      <button id="ptab-mcq"    class="vlab-tab-btn"           onclick="protocolMCQ('${type}')"> MCQ</button>
      <button id="ptab-sim"    class="vlab-tab-btn vt-sim"    onclick="protocolSim('${type}')">▶ SIMULATION</button>
    </div>
    <div id="subContent"></div>
  `;
  protocolBasics(type);
}

function protocolBasics(type) {
  document.getElementById('ptab-basics') && setActiveVTab('ptab-basics');
  vlabTrackProgress('proto-' + type);
  document.getElementById('subContent').innerHTML = `
    <div class="vlab-theory-box">${PROTO_DATA[type].theory}</div>
  `;
}

function protocolMCQ(type) {
  document.getElementById('ptab-mcq') && setActiveVTab('ptab-mcq');
  vlabTrackProgress('proto-mcq-' + type);
  renderMCQLevel('easy', type);
}

function protocolSim(type) {
  runSim(PROTO_DATA[type].simN);
}

// ── HOME PAGE NAVIGATION ──────────────────────────────────────
function goToExperiments() {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
  const expTab = document.querySelector('.tab[data-panel="p-exp"]');
  if (expTab) expTab.classList.add('active');
  document.getElementById('p-exp').classList.add('active');
  setTimeout(() => { loadModule('basics'); resizeCanvas(); buildLayout(); }, 50);
}

// ── DEFAULT LOAD on page ready ────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => { initTipOfDay(); }, 50);
});

// ── PROGRESS TRACKING (lightweight, no DOM element needed) ────
const vlabVisited = new Set();
function vlabTrackProgress(key) {
  vlabVisited.add(key);
}

// ── TIP OF THE DAY ───────────────────────────────────────────
const TIPS = [
  '"Measuring a qubit collapses its superposition — you can never un-measure it!"',
  '"Two entangled qubits stay connected no matter how far apart they are."',
  '"The No-Cloning Theorem means a quantum spy ALWAYS gets caught."',
  '"A Hadamard gate puts a qubit into perfect 50/50 superposition."',
  '"BB84 uses photon polarisation to share secret keys securely."',
  '"Quantum computers exploit superposition to try all solutions at once!"',
  '"The Bloch Sphere represents every possible state of a single qubit."',
  '"E91 uses Bell inequality violations to prove quantum security."',
];
function initTipOfDay() {
  const el = document.getElementById('tipOfDay');
  if (!el) return;
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
  el.textContent = tip;
}

// ── INPUT VALIDATION ──────────────────────────
function onMsgInput(inp) {
  const clean = inp.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
  inp.value = clean;
  const bad = /[^A-Z]/.test(inp.value) && inp.value.length > 0;
  inp.classList.toggle('err', bad);
  document.getElementById('msgErr').classList.toggle('show', bad);
  if (!simRunning) {
    renderEncTablePreview(clean || 'HELLO');  // preview only when not simulating
    buildCharProgress(clean || 'HELLO');
  }
}

function onNoiseChange(el) {
  noiseLevel = parseInt(el.value);
  document.getElementById('noiseVal').textContent = noiseLevel + '%';
  const q = (noiseLevel * 0.42).toFixed(1);
  const unsafe = parseFloat(q) > 11;
  document.getElementById('eveWarn').classList.toggle('show', unsafe);
  // Issue 5: update security bar and Eve status live when slider moves
  updateSecurityLevel(parseFloat(q));
  updateEveStatus(parseFloat(q));
}

// ── POLARISER ANGLE ──────────────────────────
let alicePolAngle = 0;
function setPolAngle(deg, el) {
  alicePolAngle = deg;
  document.querySelectorAll('.pol-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  if (simMode === 'beginner') {
    const basis = (deg === 0 || deg === 90) ? '+ (straight)' : '× (diagonal)';
    addLog(`Alice rotated her polariser to ${deg}° → ${basis} basis`, '#f39c12');
  }
}

// ── CANVAS ────────────────────────────────────
const canvas = document.getElementById('ac');
const ctx = canvas.getContext('2d');
const stageEl = document.getElementById('stage');

function resizeCanvas() {
  const w = stageEl.offsetWidth || stageEl.clientWidth || 600;
  const h = stageEl.offsetHeight || stageEl.clientHeight || 280;
  canvas.width = w;
  canvas.height = h > 10 ? h : 280;
}
window.addEventListener('resize', () => { resizeCanvas(); buildLayout(); stars = null; });

let W, H, ALICE, APOL, BPOL, BOB, EVE;
function buildLayout() {
  W = canvas.width; H = canvas.height;
  const cy = H / 2;
  ALICE = { x: W * 0.05, y: cy };
  APOL = { x: W * 0.22, y: cy };   // Alice's polariser disc
  BPOL = { x: W * 0.78, y: cy };   // Bob's polariser disc
  BOB = { x: W * 0.95, y: cy };
  EVE = { x: W * 0.50, y: H * 0.82 };
}

// ── GLOBAL HELPER: set innerHTML by id (used across all E91 functions) ──
function ss(id, v) { const el = document.getElementById(id); if (el) el.innerHTML = v; }

// ── SIM STATE ─────────────────────────────────
let photons = [], sparks = [], orbitDots = [];
let simRunning = false;
let photonTimer = 0;
let PHOTON_INTERVAL = 4.5;
let SIM_DURATION = 120;
let simElapsed = 0;
let totalSent = 0;
let siftData = [], qberHistory = [], keyHistory = [];
let noiseLevel = 0;
let currentStep = 0;
let lastTS = 0, rafId;
let stars = null;
let bobFlash = 0, apolFlash = 0, bpolFlash = 0;
let bsRot = 0;
let logLines = [];

// Correct BB84: per-bit photon queue
let msgBits = [];      // [{char, bitIdx, bit, aliceBasis, state, bobBasis}]
let msgBitPtr = 0;     // next bit to send
let charProgress = {}; // char -> {matched:[], needed:8}
let decodedChars = {}; // char index -> decoded char
let keyBits = [];

const BASES = ['+', '×'];
const STATES = { '+': ['|0⟩', '|1⟩'], '×': ['|+⟩', '|−⟩'] };
const POLSYM = { '|0⟩': '↑', '|1⟩': '↔', '|+⟩': '↗', '|−⟩': '↖' };
const POLANG = { '|0⟩': 90, '|1⟩': 0, '|+⟩': 45, '|−⟩': 135 };
const SEG_DUR = [1.4, 1.8, 1.4];

// ── BUILD MSG BITS ─────────────────────────────
// Instead of pre-generating a fixed pool, we generate photons
// on-demand per character. Each character keeps getting photons
// until it has 8 matched bits — then we move to next character.
// This is the correct BB84 behaviour.
function buildMsgBits(msg) {
  msgBits = []; msgBitPtr = 0;
  charProgress = {}; decodedChars = {};
  [...msg].forEach((ch, ci) => {
    const code = ch.charCodeAt(0);
    const bin = code.toString(2).padStart(8, '0');
    charProgress[ci] = { char: ch, matched: [], needed: 8, decoded: false, bits: [...bin].map(Number), photonsSent: 0 };
  });
  // Generate initial large pool — we'll regenerate more if needed
  // 6× per char gives >99.9% probability of getting 8 matches at 50% rate
  rebuildPhotonPool(msg);
}

function rebuildPhotonPool(msg) {
  msgBits = [];
  [...msg].forEach((ch, ci) => {
    const cp = charProgress[ci];
    if (cp.decoded) return; // skip already decoded chars
    const code = ch.charCodeAt(0);
    const bin = code.toString(2).padStart(8, '0');
    // Send each bit 6 times per character = 48 photons each
    // Statistically gives ~24 matches, more than enough for 8
    for (let repeat = 0; repeat < 6; repeat++) {
      [...bin].forEach((b, bi) => {
        msgBits.push({ char: ch, charIdx: ci, bitIdx: bi, bit: parseInt(b), repeat });
      });
    }
  });
  // Keep characters in order but shuffle within each char's photons
  const result = [];
  [...msg].forEach((_, ci) => {
    const pool = msgBits.filter(m => m.charIdx === ci);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    result.push(...pool);
  });
  msgBits = result;
  msgBitPtr = 0;
}

// ── ENCODE TABLE — LIVE APPEND PER PHOTON ─────
// Table starts empty. Each photon gets its own row appended live.
// photonRowCount tracks how many rows each char has
let photonRowCount = {}; // ci -> count of rows added

function renderEncTable(msg) {
  photonRowCount = {};
  [...msg].forEach((_, ci) => { photonRowCount[ci] = 0; });
  document.getElementById('encBody').innerHTML = '';
}

// Called when Alice fires a photon — appends a new row
function updateEncRowAlice(charIdx, bitIdx, bit, basis, state, pol) {
  const msg = document.getElementById('msgIn').value.toUpperCase() || 'HELLO';
  const ch = msg[charIdx] || '?';
  const rowNum = photonRowCount[charIdx] !== undefined ? photonRowCount[charIdx] : 0;
  photonRowCount[charIdx] = rowNum + 1;
  const rowId = `erow-${charIdx}-${rowNum}`;
  const isFirstRow = rowNum === 0;

  const tr = document.createElement('tr');
  tr.id = rowId;
  tr.className = isFirstRow ? 'ch-group' : '';
  tr.style.animation = 'encFade .35s ease';
  tr.onclick = () => onRowClickDyn(charIdx, rowNum);
  tr.innerHTML = `
    <td class="tc">${isFirstRow ? ch : ''}</td>
    <td style="color:var(--tl)">${rowNum + 1}</td>
    <td id="etd-bit-${charIdx}-${rowNum}" class="tc"><b>${bit}</b></td>
    <td id="etd-ab-${charIdx}-${rowNum}"  class="tbasis">${basis}</td>
    <td id="etd-st-${charIdx}-${rowNum}"  class="tstate">${state}</td>
    <td id="etd-dir-${charIdx}-${rowNum}" style="color:var(--tm)">${pol}</td>
    <td id="etd-bb-${charIdx}-${rowNum}"  style="color:var(--tl)">⏳</td>
    <td id="etd-mt-${charIdx}-${rowNum}"  style="color:var(--tl)">⏳</td>`;

  document.getElementById('encBody').appendChild(tr);
  // Auto-scroll table to latest row
  const enc = document.querySelector('.encsec');
  if (enc) enc.scrollTop = enc.scrollHeight;
}

// Called when photon arrives at Bob — fills Bob columns on existing row
function updateEncRowBob(charIdx, bobBasis, match) {
  const rowNum = (photonRowCount[charIdx] || 1) - 1;
  const setCell = (id, html, cls) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = html;
    if (cls) el.className = cls;
  };
  setCell(`etd-bb-${charIdx}-${rowNum}`, bobBasis, 'tbasis');
  setCell(`etd-mt-${charIdx}-${rowNum}`,
    match ? '<span style="color:var(--mint);font-weight:700"></span>'
      : '<span style="color:var(--coral);font-weight:700"></span>', '');
  // Dim the row if discarded
  const row = document.getElementById(`erow-${charIdx}-${rowNum}`);
  if (row && !match) row.style.opacity = '0.55';
  if (row && match) row.style.background = 'rgba(39,174,96,0.04)';
}

function onRowClickDyn(ci, rowNum) {
  const ab = document.getElementById(`etd-ab-${ci}-${rowNum}`)?.textContent?.trim();
  const bit = document.getElementById(`etd-bit-${ci}-${rowNum}`)?.textContent?.trim();
  const st = document.getElementById(`etd-st-${ci}-${rowNum}`)?.textContent?.trim();
  const pol = document.getElementById(`etd-dir-${ci}-${rowNum}`)?.textContent?.trim();
  const bb = document.getElementById(`etd-bb-${ci}-${rowNum}`)?.textContent?.trim();
  if (!ab || ab === '⏳') return;
  const match = document.getElementById(`etd-mt-${ci}-${rowNum}`)?.textContent?.includes('');
  const msg = document.getElementById('msgIn').value.toUpperCase() || 'HELLO';
  const ch = msg[ci] || '?';
  showBitExplan(ch, rowNum, bit, ab, st, pol, bb || '?', match);
}

function onRowClick(ci, bi) { onRowClickDyn(ci, bi); }

// Also used at page load (preview before sim — show static preview)
function renderEncTablePreview(msg) {
  const aliceBasis = (alicePolAngle === 0 || alicePolAngle === 90) ? '+' : '×';
  document.getElementById('encBody').innerHTML = [...msg].flatMap((ch, ci) => {
    const code = ch.charCodeAt(0);
    const bin = code.toString(2).padStart(8, '0');
    return [...bin].map((b, bi) => {
      const bit = parseInt(b);
      const state = STATES[aliceBasis][bit];
      const pol = POLSYM[state];
      const isFirstBit = bi === 0;
      return `<tr class="${isFirstBit ? 'ch-group' : ''}">
        <td class="tc">${isFirstBit ? ch : ''}</td>
        <td style="color:var(--tl)">${bi + 1}</td>
        <td style="color:var(--td);font-weight:700">${bit}</td>
        <td class="tbasis">${aliceBasis}</td>
        <td class="tstate">${state}</td>
        <td style="color:var(--tm)">${pol}</td>
        <td style="color:var(--tl)">?</td>
        <td style="color:var(--tl)">?</td>
      </tr>`;
    });
  }).join('');
}

// Step 2 & 3: Replaced by updateEncRowAlice (appends row) and updateEncRowBob (fills Bob cols)
// defined above in the ENCODE TABLE section



function showBitExplan(ch, bi, bit, aBasis, state, pol, bBasis, match) {
  const panel = document.getElementById('expCallout');
  document.getElementById('expCallTitle').textContent = ` "${ch}" — Bit ${bi + 1} = ${bit}`;
  const basisName = aBasis === '+' ? 'straight (rectilinear)' : 'diagonal';
  const explain = `Bit <strong>${bit}</strong> of "<strong>${ch}</strong>". Alice uses <strong>${basisName}</strong> measurement type → photon state <strong>${state}</strong> (direction: ${pol}).
    Bob measured with <strong>${bBasis}</strong> basis → <strong>${match ? ' MATCH — this bit becomes a key bit!' : ' DISCARD — different basis, result is random noise.'}</strong>
    ${simMode === 'beginner' ? `<br><br> Think: Alice tilted her polariser to ${aBasis === '+' ? '0°' : '45°'}. Bob tilted his to ${bBasis === '+' ? '0°' : '45°'}. ${match ? 'Same tilt = same result!' : 'Different tilt = useless result.'}` : ''}`;
  document.getElementById('expCallText').innerHTML = explain;
  panel.classList.add('show');
}

// ── CHAR PROGRESS UI ─────────────────────────
function buildCharProgress(msg) {
  document.getElementById('charProgress').innerHTML = [...msg].map((_, ci) => {
    const ch = msg[ci];
    return `<div class="char-row">
      <div class="char-lbl">${ch}</div>
      <div class="char-bar-wrap" title="Each character needs 8 matching bits to decode"><div class="char-bar-fill" id="cb${ci}" style="width:0%"></div></div>
      <div class="char-count" id="cc${ci}" title="bits received / 8 needed">0/8 bits</div>
      <div class="char-status" id="cs${ci}">⏳</div>
    </div>`;
  }).join('');
}

function updateCharProgress() {
  Object.entries(charProgress).forEach(([ci, cp]) => {
    const pct = (cp.matched.length / 8 * 100).toFixed(0);
    const bar = document.getElementById('cb' + ci);
    const cnt = document.getElementById('cc' + ci);
    const sta = document.getElementById('cs' + ci);
    if (!bar) return;
    bar.style.width = pct + '%';
    cnt.textContent = cp.matched.length + '/8 bits';
    if (cp.decoded) {
      bar.classList.add('done');
      sta.textContent = '';
      sta.title = cp.char + ' decoded!';
    } else {
      bar.classList.remove('done');
      sta.textContent = '⏳';
    }
  });
}

// ── PHOTON SPAWNING ──────────────────────────
function spawnPhoton() {
  if (msgBitPtr >= msgBits.length) return;
  const mb = msgBits[msgBitPtr];

  //  FIX: Read Alice's basis from CURRENT polariser angle at spawn time
  // This means if Alice changes angle mid-sim, new photons use new angle
  const currentAliceBasis = (alicePolAngle === 0 || alicePolAngle === 90) ? '+' : '×';
  const currentState = STATES[currentAliceBasis][mb.bit];
  const currentPol = POLSYM[currentState];
  // Bob basis is randomly assigned now (not pre-assigned)
  const currentBobBasis = BASES[Math.floor(Math.random() * 2)];

  msgBitPtr++;
  soundManager.playSound('photon', { volume: 0.3 }); // Distance effect (softer at start)
  const intercepted = Math.random() * 100 < noiseLevel;
  totalSent++;
  document.getElementById('statPh').textContent = totalSent;
  setStep(1);

  //  Fill Alice's columns in the table RIGHT NOW at spawn (new row appended)
  updateEncRowAlice(mb.charIdx, mb.bitIdx, mb.bit, currentAliceBasis, currentState, currentPol);

  photons.push({
    x: ALICE.x + 18, y: ALICE.y,
    aliceBasis: currentAliceBasis, bobBasis: currentBobBasis,
    bit: mb.bit, state: currentState, pol: currentPol,
    char: mb.char, charIdx: mb.charIdx, bitIdx: mb.bitIdx,
    intercepted, seg: 0, t: 0, alpha: 1,
    id: totalSent, ejected: false, vx: 0, vy: 0,
    rippleT: 0
  });
  updateCurrentPhoton(currentAliceBasis, currentBobBasis, mb.bit, currentState, mb.char, totalSent, null);
}

function segStart(p) {
  if (p.seg === 0) return { x: ALICE.x + 18, y: ALICE.y };
  if (p.seg === 1) return { x: APOL.x + 18, y: ALICE.y };
  if (p.seg === 2) return { x: BPOL.x + 18, y: ALICE.y };
}
function segEnd(p) {
  if (p.seg === 0) return { x: APOL.x - 18, y: ALICE.y };
  if (p.seg === 1) return { x: BPOL.x - 18, y: ALICE.y };
  if (p.seg === 2) return { x: BOB.x - 18, y: ALICE.y };
}

function updatePhotons(dt) {
  const rem = [];
  photons.forEach((p, i) => {
    p.rippleT += dt;
    if (p.ejected) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 35 * dt;
      p.alpha -= dt * 1.5;
      if (p.alpha <= 0) rem.push(i);
      return;
    }
    p.t += dt / SEG_DUR[p.seg];
    const et = Math.min(p.t, 1);
    const e = ease(et);
    const s = segStart(p), en = segEnd(p);
    p.x = s.x + (en.x - s.x) * e;
    p.y = s.y + (en.y - s.y) * e;

    if (et >= 1) {
      if (p.seg === 0) {
        // Reached Alice polariser
        apolFlash = 0.5;
        addLog(`#${p.id} "${p.char}" bit${p.bitIdx + 1}=${p.bit} → ${p.state} ${POLSYM[p.state]} [${p.aliceBasis}]`);
        setStep(2);
      }
      if (p.seg === 1) {
        // Crossed mid → approaching Bob polariser
        soundManager.playSound('photon', { volume: 0.7, distort: p.intercepted }); // Distance effect + Eve distort
        if (p.intercepted) addLog(` Eve intercepted #${p.id}!`, '#fc8181');
        setStep(2);
      }
      if (p.seg === 2) {
        // Bob polariser → Bob receives
        bpolFlash = 0.5;
        bobFlash = 0.6;
        const match = p.bobBasis === p.aliceBasis;
        if (match) soundManager.playSound('success', { volume: 1.0 }); 
        else soundManager.playSound('error', { volume: 0.8, distort: noiseLevel > 0 });
        let keyBit = null;
        const cp = charProgress[p.charIdx];
        // Only process if this character still needs more bits
        if (match && !cp.decoded && cp.matched.length < 8) {
          keyBit = p.intercepted && Math.random() < 0.5 ? 1 - p.bit : p.bit;
          keyBits.push(keyBit);
          cp.matched.push(keyBit);
          if (cp.matched.length >= 8) {
            cp.decoded = true;
            decodedChars[p.charIdx] = p.char;
            addLog(` "${p.char}" fully decoded!`, '#27ae60');
            updateBobReveal();
            
            // Final Reward Moment
            if (Object.values(charProgress).every(c => c.decoded)) {
              soundManager.playSound('success', { volume: 1.2 });
              setTimeout(() => soundManager.playSound('run', { volume: 1.0 }), 120);
              const kb = document.getElementById('keyBitsDisp');
              if (kb) { kb.style.boxShadow = '0 0 20px var(--mint)'; setTimeout(() => kb.style.boxShadow = 'none', 1200); }
            }
          }
          updateCharProgress();
        }
        // Fill Bob's table columns on the latest row for this char
        updateEncRowBob(p.charIdx, p.bobBasis, match);
        siftData.push({ ab: p.aliceBasis, bb: p.bobBasis, match, keyBit, intercepted: p.intercepted, id: p.id, char: p.char });
        updateCurrentPhoton(p.aliceBasis, p.bobBasis, p.bit, p.state, p.char, p.id, match, keyBit);
        addSiftEntry(p, match, keyBit);
        setStep(match ? 4 : 3);
        // Sparks
        for (let k = 0; k < 10; k++) {
          const a = Math.random() * Math.PI * 2, spd = 50 + Math.random() * 60;
          sparks.push({ x: BOB.x - 18, y: BOB.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 1, ml: 0.5 + Math.random() * 0.4, color: match ? '#68d391' : '#fc8181' });
        }
        p.ejected = true; p.vx = 60 + Math.random() * 40; p.vy = (Math.random() - 0.5) * 60;
        return;
      }
      p.seg++; p.t = 0;
    }
  });
  sparks = sparks.filter(s => { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 30 * dt; s.life -= dt / s.ml; return s.life > 0; });
  apolFlash = Math.max(0, apolFlash - dt);
  bpolFlash = Math.max(0, bpolFlash - dt);
  bobFlash = Math.max(0, bobFlash - dt);
  bsRot += dt;
  rem.reverse().forEach(i => photons.splice(i, 1));
}

function updateCurrentPhoton(ab, bb, bit, state, ch, id, match, keyBit) {
  document.getElementById('cpPhotonId').textContent = '#' + id;
  document.getElementById('cpChar').textContent = ch;
  document.getElementById('cpBit').textContent = bit;
  document.getElementById('cpABasis').textContent = ab + ' (' + (ab === '+' ? 'straight' : 'diagonal') + ')';
  document.getElementById('cpState').textContent = state + ' ' + POLSYM[state];
  document.getElementById('cpBBasis').textContent = bb || 'pending...';
  if (match === null || match === undefined) {
    document.getElementById('cpResult').textContent = 'In transit...';
    document.getElementById('cpResult').className = 'cp-val';
    updateWHN(ab, bb, bit, state, ch, id, null, null);
  } else {
    document.getElementById('cpResult').textContent = match ? ' KEY BIT: ' + keyBit : ' Discarded';
    document.getElementById('cpResult').className = 'cp-val ' + (match ? 'cp-match' : 'cp-drop');
    updateWHN(ab, bb, bit, state, ch, id, match, keyBit);
  }
}

// ── WHAT'S HAPPENING NOW ──────────────────────
function updateWHN(ab, bb, bit, state, ch, id, match, keyBit) {
  const abName = ab === '+' ? '+ (straight / rectilinear)' : '× (diagonal)';
  const bbName = bb ? (bb === '+' ? '+ (straight)' : '× (diagonal)') : '…';
  const rows = [
    { icon: '', lbl: 'Alice sent', val: `bit <b>${bit}</b> for letter "<b>${ch}</b>"` },
    { icon: '', lbl: 'Alice basis', val: `<b>${abName}</b>` },
    { icon: '', lbl: 'Photon state', val: `<b>${state}</b> direction ${POLSYM[state]}` },
    { icon: '', lbl: 'Bob basis', val: bb ? `<b>${bbName}</b>` : '<i>choosing...</i>' },
  ];
  if (match === null || match === undefined) {
    rows.push({ icon: '️', lbl: 'Status', val: '<i>Photon in transit...</i>' });
  } else if (match) {
    rows.push({ icon: '', lbl: 'Bases match!', val: `Key bit = <b>${keyBit}</b> → added to secret key` });
  } else {
    rows.push({ icon: '', lbl: 'Bases differ', val: 'Bit discarded — not useful' });
  }
  document.getElementById('whnRows').innerHTML = rows.map(r =>
    `<div class="whn-row"><span class="whn-icon">${r.icon}</span><span class="whn-lbl">${r.lbl}</span><span class="whn-val">${r.val}</span></div>`
  ).join('');
  const v = document.getElementById('whnVerdict');
  if (match === null || match === undefined) {
    v.className = 'whn-verdict transit'; v.textContent = ' Photon flying through the quantum channel...';
  } else if (match) {
    v.className = 'whn-verdict match'; v.textContent = ` Bases MATCHED → bit ${keyBit} added to secret key!`;
  } else {
    const why = ab === bb ? '' : 'Alice used ' + ab + ', Bob used ' + bb + ' — different!';
    v.className = 'whn-verdict drop'; v.textContent = ` Bases DIFFERENT → bit discarded. ${why}`;
  }
}

// ── KEY DISPLAY — grouped blocks of 4 ────────
function updateKeyDisplay() {
  const el = document.getElementById('keyBitsDisp');
  if (keyBits.length === 0) { el.textContent = '—'; return; }
  // Group into blocks of 4: 1011 0110 1001...
  const grouped = [];
  for (let i = 0; i < keyBits.length; i += 4) {
    grouped.push(keyBits.slice(i, i + 4).join(''));
  }
  el.textContent = grouped.join(' ');
}

function addSiftEntry(p, match, keyBit) {
  const matched = siftData.filter(r => r.match);
  const errs = siftData.filter(r => r.intercepted && r.match).length;
  const qber = matched.length > 0 ? (errs / matched.length * 100).toFixed(1) : (noiseLevel * 0.42).toFixed(1);
  qberHistory.push(parseFloat(qber));
  keyHistory.push(matched.length);
  updateMetrics(matched.length, qber);
  updateCharts();
  // Issue 4: grouped key display
  updateKeyDisplay();
  // NEW: security indicator
  updateSecurityLevel(parseFloat(qber));
  // NEW: Eve detection
  updateEveStatus(parseFloat(qber));
  // NEW: key comparison
  updateKeyComparison();
}

function updateMetrics(keyCount, qber) {
  const sec = parseFloat(qber) <= 11;
  // Right panel stats (these still exist)
  document.getElementById('statPh').textContent = totalSent;
  document.getElementById('statKey').textContent = keyCount || siftData.filter(r => r.match).length;
  document.getElementById('statQber').textContent = qber + '%';
  document.getElementById('statSec').textContent = sec ? '' : '';
  // Results tab stubs (hidden elements, safe to set)
  const safeSet2 = (id, prop, val) => { const el = document.getElementById(id); if (el) el[prop] = val; };
  safeSet2('rPh', 'textContent', totalSent);
  safeSet2('rKey', 'textContent', keyCount || siftData.filter(r => r.match).length);
  safeSet2('rQber', 'textContent', qber + '%');
  safeSet2('rSec', 'textContent', sec ? 'YES ' : 'NO ️');
}

// updateBobReveal — only updates right panel BMR card now
function updateBobReveal() {
  const msg = document.getElementById('msgIn').value.toUpperCase() || 'HELLO';
  let revealed = '';
  [...msg].forEach((_, i) => { revealed += decodedChars[i] || '?'; });
  // Update results tab decoded display (stub element)
  const rdEl = document.getElementById('resDecoded');
  if (rdEl) rdEl.textContent = revealed;
  // Update right panel BMR card live
  updateBMR(msg, revealed);
}

// ── BOB MESSAGE RECONSTRUCTION — LIVE TYPING ──
let bmrPrevRevealed = '';
function updateBMR(msg, revealed) {
  const decoded = Object.keys(decodedChars).length;
  const total = msg.length;
  document.getElementById('bmrSub').textContent = `${decoded} / ${total} characters decoded`;
  const bmrEl = document.getElementById('bmrMsg');
  if (revealed === bmrPrevRevealed) return;
  //  FIX: detect newly decoded = position changed from '?' to a real letter
  // bmrPrevRevealed must be '' at start (not '????') so first decode triggers correctly
  const newlyDecoded = [];
  [...revealed].forEach((ch, i) => {
    const prev = bmrPrevRevealed[i];
    if (ch !== '?' && (prev === '?' || prev === undefined || prev === '')) {
      newlyDecoded.push(i);
    }
  });
  bmrPrevRevealed = revealed;
  let html = '';
  [...revealed].forEach((ch, i) => {
    if (ch === '?') {
      html += `<span style="color:var(--tl);font-size:14px;letter-spacing:2px">?</span>`;
    } else {
      html += `<span class="${newlyDecoded.includes(i) ? 'bmr-char' : ''}" style="color:var(--mint);font-size:18px;font-weight:800;letter-spacing:4px">${ch}</span>`;
    }
  });
  bmrEl.innerHTML = html || '<span style="color:var(--tl);font-size:11px;font-weight:400;letter-spacing:0">Waiting for decoded letters...</span>';
}

// ── SECURITY LEVEL INDICATOR ──────────────────
function updateSecurityLevel(qber) {
  // Use max of actual QBER and noise-estimated QBER so bar moves with Eve slider too
  const effectiveQber = Math.max(qber, noiseLevel * 0.42);
  const pct = Math.min(effectiveQber / 30 * 100, 100);
  const fill = document.getElementById('secBarFill');
  const badge = document.getElementById('secBadge');
  fill.style.width = pct + '%';
  if (effectiveQber < 5) {
    fill.style.background = 'linear-gradient(90deg,#27ae60,#52d68a)';
    badge.className = 'sec-badge safe';
    badge.textContent = '️ SAFE — Channel is secure';
  } else if (effectiveQber <= 11) {
    fill.style.background = 'linear-gradient(90deg,#f39c12,#f8c471)';
    badge.className = 'sec-badge warn';
    badge.textContent = '️ WARNING — Unusual activity detected';
  } else {
    fill.style.background = 'linear-gradient(90deg,#e74c3c,#fc8181)';
    badge.className = 'sec-badge danger';
    badge.textContent = ' ATTACK DETECTED — Eve is spying!';
  }
}

// ── EVE DETECTION STATUS ──────────────────────
function updateEveStatus(qber) {
  const card = document.getElementById('eveStatusCard');
  const icon = document.getElementById('eveSIcon');
  const text = document.getElementById('eveSText');
  const sub = document.getElementById('eveSSub');
  if (noiseLevel === 0 && qber < 5) {
    card.className = 'eve-status-card';
    icon.textContent = ''; text.className = 'eve-st-text ok';
    text.textContent = 'No interference detected';
    sub.textContent = 'Channel appears clean. Communication is safe.';
  } else if (qber > 11 || noiseLevel > 20) {
    card.className = 'eve-status-card alert';
    icon.textContent = ''; text.className = 'eve-st-text bad';
    text.textContent = 'Suspicious activity detected!';
    sub.textContent = `Error rate ${qber}% exceeds 11% threshold — Eve likely intercepting!`;
  } else if (noiseLevel > 0 || qber > 5) {
    card.className = 'eve-status-card';
    icon.textContent = '️'; text.className = 'eve-st-text warn';
    text.textContent = 'Slight interference observed';
    sub.textContent = `QBER at ${qber}%. Monitoring... Stay below 11% for safe communication.`;
  } else {
    card.className = 'eve-status-card';
    icon.textContent = ''; text.className = 'eve-st-text ok';
    text.textContent = 'No interference detected';
    sub.textContent = 'Channel appears clean. Communication is safe.';
  }
}

// ── KEY COMPARISON VISUALIZATION ─────────────
function updateKeyComparison() {
  const last = keyBits.slice(-16);
  if (last.length < 2) return;
  // Alice key = last bits; Bob key = same with Eve-introduced errors
  const aliceBits = last;
  const bobBits = last.map(b => {
    // introduce errors based on Eve interference
    if (noiseLevel > 0 && Math.random() * 100 < noiseLevel * 0.42) return 1 - b;
    return b;
  });
  const makeCell = (b, isAlice, idx) => {
    const match = aliceBits[idx] === bobBits[idx];
    const cls = match ? 'kb-cell match-bit' : 'kb-cell mismatch-bit';
    return `<div class="${cls}" title="${match ? 'Match ' : 'Mismatch  (Eve interference)'}">${b}</div>`;
  };
  document.getElementById('kcAlice').innerHTML = aliceBits.map((b, i) => makeCell(b, true, i)).join('');
  document.getElementById('kcBob').innerHTML = bobBits.map((b, i) => makeCell(b, false, i)).join('');
}

// ── INIT WHN ──────────────────────────────────
function resetWHN() {
  document.getElementById('whnRows').innerHTML =
    '<div class="whn-row"><span class="whn-icon">⏳</span><span class="whn-lbl">Status</span><span class="whn-val">Waiting for simulation...</span></div>';
  document.getElementById('whnVerdict').className = 'whn-verdict transit';
  document.getElementById('whnVerdict').textContent = 'Press ▶ Run Experiment to start';
  document.getElementById('bmrMsg').innerHTML = '<span style="color:var(--tl);font-size:11px;font-weight:400;letter-spacing:0">Waiting for decoded letters...</span>';
  document.getElementById('bmrSub').textContent = '— / — characters decoded';
  document.getElementById('kcAlice').innerHTML = '';
  document.getElementById('kcBob').innerHTML = '';
  document.getElementById('secBarFill').style.width = '0%';
  document.getElementById('secBadge').className = 'sec-badge safe';
  document.getElementById('secBadge').textContent = '️ SAFE — Channel is secure';
  document.getElementById('eveStatusCard').className = 'eve-status-card';
  document.getElementById('eveSIcon').textContent = '';
  document.getElementById('eveSText').className = 'eve-st-text ok';
  document.getElementById('eveSText').textContent = 'No interference detected';
  document.getElementById('eveSSub').textContent = 'Channel appears clean. Communication is safe.';
  bmrPrevRevealed = '';  //  always reset to '' not '????' 
}
function draw(ts) {
  if (!lastTS) lastTS = ts;
  const dt = Math.min((ts - lastTS) / 1000, 0.05);
  lastTS = ts;

  ctx.clearRect(0, 0, W, H);
  drawStars();
  drawChannel();
  drawAlice();
  drawAPolDisc();
  drawBPolDisc();
  drawBob();
  drawEve();
  drawPhotons();
  drawSparks();

  if (simRunning) {
    simElapsed += dt;
    photonTimer += dt;
    // Spawn next photon only if char not already decoded (skip redundant photons)
    if (photonTimer >= PHOTON_INTERVAL && msgBitPtr < msgBits.length) {
      // Skip photons for already-decoded characters
      while (msgBitPtr < msgBits.length && charProgress[msgBits[msgBitPtr].charIdx]?.decoded) {
        msgBitPtr++;
      }
      if (msgBitPtr < msgBits.length) { photonTimer = 0; spawnPhoton(); }
    }
    updatePhotons(dt);
    document.getElementById('simStatus').textContent = `▶ ${simElapsed.toFixed(0)}s`;
    // Stop when all chars decoded OR all photons exhausted with none in flight
    const allDecoded = Object.values(charProgress).every(cp => cp.decoded);
    if ((allDecoded || msgBitPtr >= msgBits.length) && photons.length === 0) stopSim(false);
  }
  rafId = requestAnimationFrame(draw);
}

function drawStars() {
  if (!stars) {
    stars = [];
    for (let i = 0; i < 80; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3, o: .08 + Math.random() * .2 });
  }
  stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${s.o})`; ctx.fill(); });
}

function drawChannel() {
  ctx.save();
  ctx.setLineDash([4, 7]); ctx.lineWidth = 1.3;
  ctx.strokeStyle = 'rgba(99,179,237,0.35)';
  ctx.beginPath(); ctx.moveTo(ALICE.x + 20, ALICE.y); ctx.lineTo(BOB.x - 20, ALICE.y); ctx.stroke();
  // Eve line
  if (noiseLevel > 0) {
    ctx.strokeStyle = `rgba(252,129,129,${noiseLevel / 100 * 0.5})`;
    ctx.beginPath(); ctx.moveTo(W / 2, ALICE.y); ctx.lineTo(EVE.x, EVE.y); ctx.stroke();
  }
  ctx.setLineDash([]); ctx.restore();
}

// ── ALICE (cartoon woman with red top) ────────
function drawAlice() {
  const { x, y } = ALICE;
  // Glow halo
  const g = ctx.createRadialGradient(x, y, 5, x, y, 40);
  g.addColorStop(0, 'rgba(252,129,129,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 40, 0, Math.PI * 2); ctx.fill();
  // Body (simple cartoon)
  // Head
  ctx.fillStyle = '#f9c89b'; ctx.strokeStyle = '#c8845a'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(x, y - 18, 9, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Hair (brown)
  ctx.fillStyle = '#6b3d2e'; ctx.beginPath();
  ctx.ellipse(x, y - 24, 10, 7, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.ellipse(x - 9, y - 18, 4, 9, -.3, 0, Math.PI * 2); ctx.fill();
  // Red torso
  ctx.fillStyle = '#e74c3c'; ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.roundRect(x - 10, y - 8, 20, 18, 4); ctx.fill(); ctx.stroke();
  // Arms
  ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 10, y - 4); ctx.lineTo(x - 16, y + 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 10, y - 4); ctx.lineTo(x + 16, y + 4); ctx.stroke();
  // Legs
  ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x - 5, y + 10); ctx.lineTo(x - 6, y + 22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 5, y + 10); ctx.lineTo(x + 6, y + 22); ctx.stroke();
  lbl(x, y + 34, 'Alice', '#fc8181', 9);
  lbl(x, y + 43, '(Sender)', 'rgba(252,129,129,0.7)', 7.5);
}

// ── ALICE'S POLARISER (red/orange disc like Image 1) ─
function drawAPolDisc() {
  const { x, y } = APOL;
  const flash = apolFlash;
  ctx.save();
  ctx.translate(x, y);
  // Glow
  const g = ctx.createRadialGradient(0, 0, 5, 0, 0, 32);
  g.addColorStop(0, `rgba(230,126,34,${0.3 + flash * 0.4})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.fill();
  // Disc
  ctx.fillStyle = `rgba(180,80,20,${0.15 + flash * 0.1})`;
  ctx.strokeStyle = `rgba(230,126,34,${0.9 + flash * 0.1})`; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, 18, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Rotation lines (polariser pattern)
  const ang = (alicePolAngle * Math.PI / 180) + bsRot * 0.05;
  ctx.strokeStyle = `rgba(255,160,60,${0.95})`; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const a = ang + i * Math.PI / 3;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5); ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-Math.cos(a) * 5, -Math.sin(a) * 5); ctx.lineTo(-Math.cos(a) * 15, -Math.sin(a) * 15); ctx.stroke();
  }
  ctx.restore();
  lbl(x, y + 27, 'Alice Polariser', 'rgba(230,126,34,0.9)', 8);
  lbl(x, y + 35, alicePolAngle + '°', 'rgba(230,126,34,0.7)', 7.5);
}

// ── BOB'S POLARISER (blue disc like Image 1) ──
function drawBPolDisc() {
  const { x, y } = BPOL;
  const flash = bpolFlash;
  ctx.save();
  ctx.translate(x, y);
  const g = ctx.createRadialGradient(0, 0, 5, 0, 0, 32);
  g.addColorStop(0, `rgba(42,109,217,${0.3 + flash * 0.4})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(10,50,150,${0.15 + flash * 0.1})`;
  ctx.strokeStyle = `rgba(99,179,237,${0.9 + flash * 0.1})`; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, 18, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Bob's random basis shown as lines
  const bobAng = bsRot * 0.12;
  ctx.strokeStyle = `rgba(140,200,255,0.95)`; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const a = bobAng + i * Math.PI / 3;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5); ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-Math.cos(a) * 5, -Math.sin(a) * 5); ctx.lineTo(-Math.cos(a) * 15, -Math.sin(a) * 15); ctx.stroke();
  }
  ctx.restore();
  lbl(x, y + 27, 'Bob Polariser', 'rgba(99,179,237,0.9)', 8);
  lbl(x, y + 35, 'auto', 'rgba(99,179,237,0.7)', 7.5);
}

// ── BOB (cartoon man with plaid shirt) ────────
function drawBob() {
  const { x, y } = BOB;
  const bf = bobFlash;
  const g = ctx.createRadialGradient(x, y, 5, x, y, 42);
  g.addColorStop(0, `rgba(104,211,145,${0.15 + bf * 0.3})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 42, 0, Math.PI * 2); ctx.fill();
  // Head
  ctx.fillStyle = '#f9c89b'; ctx.strokeStyle = '#c8845a'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(x, y - 18, 9, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Hair (blonde)
  ctx.fillStyle = '#d4a843'; ctx.beginPath();
  ctx.ellipse(x, y - 25, 10, 6, 0, Math.PI, Math.PI * 2); ctx.fill();
  // Plaid shirt (blue-ish squares)
  ctx.fillStyle = bf > 0 ? '#45b3c8' : '#2980b9'; ctx.strokeStyle = '#1a5276'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.roundRect(x - 10, y - 8, 20, 18, 4); ctx.fill(); ctx.stroke();
  // Plaid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x - 3, y - 8); ctx.lineTo(x - 3, y + 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 3, y - 8); ctx.lineTo(x + 3, y + 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 10, y - 2); ctx.lineTo(x + 10, y - 2); ctx.stroke();
  // Arms
  ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 10, y - 4); ctx.lineTo(x - 17, y + 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 10, y - 4); ctx.lineTo(x + 17, y + 4); ctx.stroke();
  // Legs
  ctx.strokeStyle = '#34495e'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x - 5, y + 10); ctx.lineTo(x - 6, y + 22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 5, y + 10); ctx.lineTo(x + 6, y + 22); ctx.stroke();
  lbl(x, y + 34, bf > 0 ? ' Bob' : 'Bob', '#68d391', 9);
  lbl(x, y + 43, '(Receiver)', 'rgba(104,211,145,0.7)', 7.5);
}

// ── EVE (hooded figure) ───────────────────────
function drawEve() {
  if (noiseLevel === 0) return;
  const { x, y } = EVE;
  const a = Math.min(noiseLevel / 50, 1);
  const g = ctx.createRadialGradient(x, y, 4, x, y, 28);
  g.addColorStop(0, `rgba(252,129,129,${0.25 * a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 28, 0, Math.PI * 2); ctx.fill();
  // Hood body
  ctx.fillStyle = `rgba(30,30,30,${0.9 * a})`; ctx.strokeStyle = `rgba(252,129,129,${0.8 * a})`; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 14, y + 16); ctx.quadraticCurveTo(x - 18, y - 8, x, y - 20);
  ctx.quadraticCurveTo(x + 18, y - 8, x + 14, y + 16); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Eyes
  ctx.fillStyle = `rgba(252,129,129,${0.9 * a})`;
  ctx.beginPath(); ctx.arc(x - 4, y - 5, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 4, y - 5, 2, 0, Math.PI * 2); ctx.fill();
  lbl(x, y + 26, 'Eve ', `rgba(252,129,129,${a})`, 9);
}

// ── PHOTONS with wave/ripple effect ───────────
function drawPhotons() {
  photons.forEach(p => {
    if (!p.ejected) {
      // Ripple rings
      for (let r = 1; r <= 3; r++) {
        const rip = (p.rippleT * 1.8 - (r * 0.3)) % 1;
        if (rip < 0) continue;
        const rr = 8 + rip * 22;
        const ra = Math.max(0, (1 - rip) * 0.35);
        ctx.strokeStyle = p.intercepted ? `rgba(252,129,129,${ra})` : `rgba(183,148,244,${ra})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, Math.PI * 2); ctx.stroke();
      }
    }
    const al = p.ejected ? p.alpha : 1;
    if (al <= 0) return;
    const col = p.intercepted ? `rgba(252,129,129,${al})` : `rgba(183,148,244,${al})`;
    // Glow
    const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 15);
    g.addColorStop(0, p.intercepted ? `rgba(252,129,129,${al * 0.25})` : `rgba(183,148,244,${al * 0.22})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, Math.PI * 2); ctx.fill();
    // Core
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.intercepted ? `rgba(255,200,200,${al})` : `rgba(228,210,255,${al})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill();
    if (!p.ejected) {
      // Polarisation direction symbol
      ctx.fillStyle = `rgba(220,200,255,0.95)`; ctx.font = `bold 9px Poppins,sans-serif`; ctx.textAlign = 'center';
      ctx.fillText(POLSYM[p.state], p.x, p.y - 11);
      ctx.fillStyle = 'rgba(140,180,255,0.75)'; ctx.font = '7.5px Poppins,sans-serif';
      ctx.fillText(p.char + ' b' + (p.bitIdx + 1), p.x, p.y - 20);
    }
  });
}

function drawSparks() {
  sparks.forEach(s => {
    ctx.globalAlpha = Math.max(0, s.life);
    ctx.beginPath(); ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = s.color; ctx.fill();
    ctx.globalAlpha = 1;
  });
}

// ── HELPERS ────────────────────────────────────
function ease(t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function lbl(x, y, txt, col, sz) { ctx.fillStyle = col; ctx.font = `${sz}px Poppins,sans-serif`; ctx.textAlign = 'center'; ctx.fillText(txt, x, y); }
function addLog(txt, col) {
  logLines.push({ txt, col: col || null });
  if (logLines.length > 40) logLines.shift();
  const el = document.getElementById('logBox');
  el.innerHTML = logLines.map(l => `<div style="${l.col ? 'color:' + l.col : ''}">${l.txt}</div>`).join('');
  el.scrollTop = el.scrollHeight;
}
function setStep(n) {
  if (n <= currentStep) return; currentStep = n;
  const phases = ['Ready', 'Encoding bits', 'Transmitting photon', 'Bob measuring', 'Sifting key'];
  for (let i = 1; i <= 4; i++) {
    document.getElementById('sd' + i).className = 'sdot' + (i < n ? ' done' : i === n ? ' active' : '');
    document.getElementById('st' + i).className = 'stxt' + (i === n ? ' active' : '');
  }
  document.getElementById('ptag').textContent = phases[n] || phases[4];
}

// ── SIM CONTROL ────────────────────────────────
function onRunClick() {
  if (simRunning) stopSim(false); else startSim();
}

function startSim() {
  const msg = (document.getElementById('msgIn').value || 'HELLO').toUpperCase().replace(/[^A-Z]/g, '');
  if (!msg) { document.getElementById('msgErr').classList.add('show'); return; }
  simRunning = true; simElapsed = 0; photonTimer = PHOTON_INTERVAL - 0.1;
  soundManager.playSound('run', { volume: 0.8 });
  totalSent = 0; siftData = []; qberHistory = []; keyHistory = []; keyBits = [];
  photons = []; sparks = []; logLines = []; currentStep = 0;
  const safeSet = (id, prop, val) => { const el = document.getElementById(id); if (el) el[prop] = val; };
  safeSet('siftLog', 'innerHTML', '');
  safeSet('logBox', 'innerHTML', '');
  safeSet('resDecoded', 'textContent', '');
  safeSet('keyBitsDisp', 'textContent', '—');
  resetWHN();
  safeSet('runBtn', 'textContent', '⏹ Stop Simulation');
  document.getElementById('runBtn')?.classList.add('stop');
  safeSet('simStatus', 'textContent', 'Running...');
  for (let i = 1; i <= 4; i++) { safeSet('sd' + i, 'className', 'sdot'); safeSet('st' + i, 'className', 'stxt'); }
  buildMsgBits(msg);
  photonRowCount = {};
  renderEncTable(msg);
  buildCharProgress(msg);
  bmrPrevRevealed = '';
  document.getElementById('bmrMsg').innerHTML = [...msg].map(() =>
    `<span style="color:var(--tl);font-size:14px;letter-spacing:2px">?</span>`
  ).join('');
  safeSet('bmrSub', 'textContent', `0 / ${msg.length} characters decoded`);
  if (simMode === 'beginner') {
    safeSet('storyTxt', 'innerHTML', `Alice is sending "<strong>${msg}</strong>" to Bob using quantum photons! Each letter needs 8 matched bits. Sending up to ${msg.length * 24} photons to ensure enough matches.`);
  }
  addLog(`▶ BB84 started — "${msg}" | Sending up to ${msg.length * 24} photons (3× buffer for 50% match rate)`);
  addLog(`Alice's polariser: ${alicePolAngle}° → ${(alicePolAngle === 0 || alicePolAngle === 90) ? '+' : '×'} basis`);
  updateCharts(); initChartsIfNeeded();
}

function stopSim(silent) {
  simRunning = false;
  soundManager.playSound('reset', { volume: 0.6 });
  const safeSet = (id, prop, val) => { const el = document.getElementById(id); if (el) el[prop] = val; };
  safeSet('runBtn', 'textContent', '▶ Run Experiment');
  document.getElementById('runBtn')?.classList.remove('stop');
  safeSet('simStatus', 'textContent', 'Idle');
  if (!silent) {
    for (let i = 1; i <= 4; i++) safeSet('sd' + i, 'className', 'sdot done');
    addLog('⏹ Simulation complete.');
    const msg = (document.getElementById('msgIn').value || 'HELLO').toUpperCase().replace(/[^A-Z]/g, '');
    let revealed = '';[...msg].forEach((_, i) => { revealed += decodedChars[i] || '?'; });
    safeSet('resDecoded', 'textContent', revealed);
    updateBMR(msg, revealed);
    // Update global results
    const qberNow = parseFloat(document.getElementById('statQber')?.textContent) || 0;
    const keyNow = parseInt(document.getElementById('statKey')?.textContent) || 0;
    const phNow = parseInt(document.getElementById('statPh')?.textContent) || 0;
    const secNow = document.getElementById('statSec')?.textContent === '';
    const eveLvl = parseInt(document.getElementById('eveSlider')?.value || 0);
    lastExperiment = 'bb84';
    lastResults.bb84 = {
      photons: phNow, keyBits: keyNow, qber: qberNow, secure: secNow,
      message: msg, decoded: revealed, eveLevel: eveLvl,
      qberHistory: [...qberHistory]
    };
    pushHistory('bb84', `QBER ${qberNow}% — ${secNow ? 'Secure ' : 'Compromised ️'}`, secNow ? '' : '️');
  }
}

// ── CHARTS ────────────────────────────────────
let cQberChart, rQberC, rKeyC;
let chartsInited = false;
function initChartsIfNeeded() {
  if (chartsInited) return; chartsInited = true;
  const base = {
    responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
    plugins: { legend: { labels: { color: '#3a5080', font: { family: 'Poppins', size: 8 }, boxWidth: 8, padding: 5 } } },
    scales: {
      x: { ticks: { color: '#6080a0', font: { size: 7.5 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
      y: { ticks: { color: '#6080a0', font: { size: 7.5 } }, grid: { color: 'rgba(0,0,0,0.05)' } }
    }
  };
  const cQberEl = document.getElementById('cQber');
  if (cQberEl) cQberChart = new Chart(cQberEl, { type: 'line', data: { labels: [], datasets: [{ label: 'QBER %', data: [], borderColor: '#e74c3c', backgroundColor: 'rgba(231,76,60,.07)', tension: .4, pointRadius: 2, fill: true }] }, options: { ...base } });
  // rQberChart and rKeyChart are hidden stubs — skip Chart init on them
  // (Results dashboard has its own chart via initRDashCharts)
}
function updateCharts() {
  initChartsIfNeeded();
  const labs = qberHistory.map((_, i) => i + 1);
  if (cQberChart) { cQberChart.data.labels = labs; cQberChart.data.datasets[0].data = [...qberHistory]; cQberChart.update('none'); }
}

// ══════════════════════════════════════════════
// OLD SUPERPOSITION FUNCTIONS REPLACED BY CIRCUIT SIMULATOR
// applyH, measureQ, resetQ, setPB are no longer used —
// the new quantum circuit engine handles all of this.
// Keeping stub to avoid any lingering call errors:
function applyH() { }
function measureQ() { }
function resetQ() { }
function setPB() { }

// ══════════════════════════════════════════════
// TELEPORTATION EXPERIMENT
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
// QUANTUM TELEPORTATION v16 — Canvas Engine
// Full state machine, enforced step control
// ══════════════════════════════════════════════

const GATE_MAP = { '00': 'I', '01': 'X', '10': 'Z', '11': 'XZ' };
const GATE_INSTRUCTIONS = { '00': 'No operation needed', '01': 'Apply X gate', '10': 'Apply Z gate', '11': 'Apply XZ gate' };

let teleState = {
  step: 0, result: null, correctGate: null,
  animFrame: null, dashOffset: 0, particles: [],
  classicalTimeout: null,
  showEntLine: false, showClassicalArc: false,
  classicalArcProgress: 0, classicalArcRunning: false,
  showResultBadge: false, showSuccessBanner: false,
  mergeFlash: 0, mergeX: 0, mergeY: 0,
  labelChanged: false,
  eveMode: 'none', eveModifiedResult: null,
  noiseLevel: 0,
  photonDecohered: false,  // true when wrong gate applied — shows decoherence
  photons: {
    C: { x: 0, y: 0, color: '#ff6b35', alpha: 1, label: 'C', visible: true, r: 22 },
    B: { x: 0, y: 0, color: '#4da6ff', alpha: 0, label: 'B', visible: false, r: 22 },
    A: { x: 0, y: 0, color: '#4da6ff', alpha: 0, label: 'A', visible: false, r: 22 }
  },
  entangleTween: null,
  bellTween: null,
  sourcePulse: 0
};

// ── LAYOUT HELPERS ───────────────────────────
function getTeleCanvas() { return document.getElementById('teleCanvas'); }
function getTeleCtx() { const c = getTeleCanvas(); return c ? c.getContext('2d') : null; }

function getTeleDims() {
  const c = getTeleCanvas();
  if (!c) return { W: 700, H: 300, aliceX: 120, bobX: 580, cy: 110, charY: 220, srcX: 350 };
  const W = c.width, H = c.height;
  return {
    W, H,
    aliceX: Math.floor(W * 0.15),
    bobX: Math.floor(W * 0.85),
    cy: Math.floor(H * 0.32),   // photons/effects at upper 32%
    charY: Math.floor(H * 0.72),   // characters at lower 72% — no overlap
    srcX: Math.floor(W * 0.50)
  };
}

function resizeTeleCanvas() {
  const c = getTeleCanvas();
  if (!c) return;
  const parent = c.parentElement;
  if (!parent) return;
  c.width = parent.clientWidth || 700;
  c.height = parent.clientHeight || 280;
  resetPhotonPositions();
}

function resetPhotonPositions() {
  const { aliceX, bobX, cy } = getTeleDims();
  teleState.photons.C.x = aliceX - 32; teleState.photons.C.y = cy;
  teleState.photons.C.alpha = 1; teleState.photons.C.visible = true;
  teleState.photons.C.color = '#ff6b35'; teleState.photons.C.label = 'C';
  teleState.photons.B.x = aliceX + 32; teleState.photons.B.y = cy;
  teleState.photons.B.alpha = 0; teleState.photons.B.visible = false;
  teleState.photons.B.color = '#4da6ff'; teleState.photons.B.label = 'B';
  teleState.photons.A.x = bobX; teleState.photons.A.y = cy;
  teleState.photons.A.alpha = 0; teleState.photons.A.visible = false;
  teleState.photons.A.color = '#4da6ff'; teleState.photons.A.label = 'A';
}

// ── SINGLE RAF LOOP ───────────────────────────
function startTeleAnim() {
  if (teleState.animFrame) cancelAnimationFrame(teleState.animFrame);
  teleState.animFrame = requestAnimationFrame(teleAnimLoop);
}
function stopTeleAnim() {
  if (teleState.animFrame) { cancelAnimationFrame(teleState.animFrame); teleState.animFrame = null; }
}
function teleAnimLoop() {
  teleState.dashOffset = (teleState.dashOffset + 0.5) % 28;
  teleState.sourcePulse = (teleState.sourcePulse + 0.06) % (Math.PI * 2);
  // Entangle tween
  const et = teleState.entangleTween;
  if (et && et.progress < 1) {
    et.progress = Math.min(1, et.progress + 0.018);
    const e = easeOut(et.progress);
    const { srcX, cy } = getTeleDims();
    teleState.photons.B.x = et.BstartX + (et.BendX - et.BstartX) * e;
    teleState.photons.B.y = cy;
    teleState.photons.B.alpha = et.progress;
    teleState.photons.B.visible = true;
    teleState.photons.A.x = et.AstartX + (et.AendX - et.AstartX) * e;
    teleState.photons.A.y = cy;
    teleState.photons.A.alpha = et.progress;
    teleState.photons.A.visible = true;
    if (et.progress >= 1) {
      teleState.showEntLine = true;
      teleState.entangleTween = null;
      setBtnStatesTele();
    }
  }
  // Bell tween — C and B move toward each other
  const bt = teleState.bellTween;
  if (bt && bt.progress < 1) {
    bt.progress = Math.min(1, bt.progress + 0.022);
    const e = easeOut(bt.progress);
    teleState.photons.C.x = bt.CstartX + (bt.CmidX - bt.CstartX) * e;
    teleState.photons.B.x = bt.BstartX + (bt.BmidX - bt.BstartX) * e;
    if (bt.progress >= 1) {
      // MERGE FLASH
      teleState.mergeFlash = 1;
      teleState.mergeX = teleState.photons.C.x;
      teleState.mergeY = teleState.photons.C.y;
      teleState.photons.C.alpha = 0.35;
      teleState.photons.C.color = '#555555';
      teleState.photons.B.alpha = 0.1;
      // INSTANT quantum effect — A turns yellow NOW
      teleState.photons.A.color = '#ffd700';
      teleState.showEntLine = false;
      teleState.showResultBadge = true;
      teleState.bellTween = null;
      // Burst particles
      spawnBurst(teleState.mergeX, teleState.mergeY, '#ffffff', 20);
      // Schedule classical after 500ms (guarded)
      teleState.classicalTimeout = setTimeout(() => {
        if (teleState.step !== 2) return;
        teleClassical();
      }, 600);
    }
  }
  // merge flash decay
  if (teleState.mergeFlash > 0) teleState.mergeFlash = Math.max(0, teleState.mergeFlash - 0.025);
  // classical arc progress
  if (teleState.classicalArcRunning) {
    teleState.classicalArcProgress = Math.min(1, teleState.classicalArcProgress + 0.012);
    if (teleState.classicalArcProgress >= 1) {
      teleState.classicalArcRunning = false;
      // show gate panel
      const gp = document.getElementById('teleGatePanel');
      if (gp) gp.style.display = 'flex';
      hintCorrectGate();
      setBtnStatesTele();
      updateTeleMath();
    }
  }
  // particles lifecycle
  teleState.particles = teleState.particles.filter(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.028; return p.life > 0;
  });
  if (teleState.particles.length > 40) teleState.particles.splice(0, teleState.particles.length - 40);

  drawTeleScene();
  teleState.animFrame = requestAnimationFrame(teleAnimLoop);
}

function spawnBurst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, spd = 1.5 + Math.random() * 3.5;
    teleState.particles.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 1, color });
  }
}

function easeOut(t) { return 1 - (1 - t) * (1 - t); }

// ── DRAW SCENE ───────────────────────────────
function drawTeleScene() {
  const ctx = getTeleCtx(); if (!ctx) return;
  const { W, H, aliceX, bobX, cy, charY, srcX } = getTeleDims();
  const noise = (teleState.noiseLevel || 0) / 100;

  // 1. Background
  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
  bg.addColorStop(0, '#0d1a2e'); bg.addColorStop(1, '#05101f');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let i = 0; i < 40; i++) {
    const sx = (i * 137 + 23) % W, sy = (i * 97 + 11) % (H * 0.9);
    ctx.beginPath(); ctx.arc(sx, sy, 0.7, 0, Math.PI * 2); ctx.fill();
  }

  // 2. Characters at charY (well below photons)
  drawTeleAlice(ctx, aliceX, charY);
  drawTeleBob(ctx, bobX, charY);

  // 3. Entanglement line (behind photons, at cy)
  if (teleState.showEntLine) {
    const jitter = noise * 5 * Math.sin(Date.now() * 0.01);
    drawEntLine(ctx,
      teleState.photons.B.x, teleState.photons.B.y + jitter,
      teleState.photons.A.x, teleState.photons.A.y - jitter);
  }

  // 4. Classical arc + Eve
  if (teleState.showClassicalArc) {
    if (teleState.eveMode !== 'none') {
      // Eve intercepts — arc bends to Eve first
      const eveX = Math.floor(W * 0.5), eveY = Math.floor(H * 0.12);
      drawEveInterceptArc(ctx, aliceX, cy - 10, eveX, eveY, bobX, cy - 10,
        teleState.classicalArcProgress, teleState.eveMode === 'active');
      drawTeleEve(ctx, eveX, eveY);
    } else {
      drawClassicalArc(ctx, aliceX, cy - 10, bobX, cy - 10, teleState.classicalArcProgress);
    }
    drawAntennaIcon(ctx, aliceX, cy - 55);
  }

  // Source orb at srcX,cy
  if (!teleState.showEntLine && !teleState.bellTween &&
    (teleState.step === 0 || (teleState.entangleTween !== null))) {
    const pulse = 0.7 + 0.3 * Math.sin(teleState.sourcePulse);
    drawPhotonOrb(ctx, srcX, cy, 16, '#ffffff', pulse * 0.9, '⊕');
  }

  // 5. Photons at cy (upper area — separated from characters)
  const ph = teleState.photons;
  // Noise: Bob's photon flickers at high noise
  if (ph.C.visible && ph.C.alpha > 0.05) drawPhotonOrb(ctx, ph.C.x, ph.C.y, ph.C.r || 22, ph.C.color, ph.C.alpha, ph.C.label);
  if (ph.B.visible && ph.B.alpha > 0.05) drawPhotonOrb(ctx, ph.B.x, ph.B.y, ph.B.r || 22, ph.B.color, ph.B.alpha, ph.B.label);
  if (ph.A.visible && ph.A.alpha > 0.05) {
    const lbl = teleState.labelChanged ? 'C' : ph.A.label;
    let aAlpha = ph.A.alpha;
    if (noise > 0.3 && teleState.step >= 2) aAlpha *= (1 - noise * 0.4 * (0.5 + 0.5 * Math.random()));
    if (teleState.photonDecohered) {
      // Quantum decoherence — draw as broken classical state
      drawDecoherentPhoton(ctx, ph.A.x, ph.A.y, ph.A.r || 22);
    } else {
      drawPhotonOrb(ctx, ph.A.x, ph.A.y, ph.A.r || 22, ph.A.color, Math.max(0.2, aAlpha), lbl);
    }
  }

  // Connector line: C to B (when both visible in Alice's lab)
  if (ph.C.visible && ph.B.visible && ph.B.alpha > 0.3 && teleState.step <= 1) {
    ctx.strokeStyle = 'rgba(255,165,0,0.4)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]); ctx.beginPath();
    ctx.moveTo(ph.C.x + 20, ph.C.y); ctx.lineTo(ph.B.x - 20, ph.B.y); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Alice lab bracket
  if (teleState.step >= 1) {
    ctx.strokeStyle = 'rgba(99,179,237,0.4)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(aliceX - 60, cy - 35, 120, 50);
    ctx.fillStyle = 'rgba(99,179,237,0.55)'; ctx.font = '8px Poppins,sans-serif';
    ctx.textAlign = 'center'; ctx.fillText("Alice's Lab", aliceX, cy + 27);
  }

  // 6. Merge flash
  if (teleState.mergeFlash > 0) {
    const r = 60 * (1 - teleState.mergeFlash * 0.5);
    const gf = ctx.createRadialGradient(teleState.mergeX, teleState.mergeY, 0, teleState.mergeX, teleState.mergeY, r);
    gf.addColorStop(0, `rgba(255,255,255,${teleState.mergeFlash})`);
    gf.addColorStop(0.4, `rgba(255,220,100,${teleState.mergeFlash * 0.6})`);
    gf.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gf; ctx.beginPath(); ctx.arc(teleState.mergeX, teleState.mergeY, r, 0, Math.PI * 2); ctx.fill();
    for (let ring = 1; ring <= 3; ring++) {
      const rr = 20 + ring * 18 * (1 - teleState.mergeFlash * 0.4);
      ctx.strokeStyle = `rgba(255,200,80,${teleState.mergeFlash * (0.8 / ring)})`;
      ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(teleState.mergeX, teleState.mergeY, rr, 0, Math.PI * 2); ctx.stroke();
    }
    // Noisy distortion
    if (noise > 0.4 && Math.random() < noise * 0.3) spawnBurst(teleState.mergeX + (Math.random() - 0.5) * 40, teleState.mergeY + (Math.random() - 0.5) * 20, '#ff4444', 2);
  }

  // 7. Particles
  teleState.particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life * 0.9);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  // 8. UI overlays
  if (teleState.showResultBadge && teleState.result) drawResultBadge(ctx, aliceX, cy - 55, teleState.result);
  if (teleState.showSuccessBanner) drawSuccessBanner(ctx, W, H);
  // Decoherence banner
  if (teleState.photonDecohered) {
    // Continuous noise sparks around decohered photon
    if (Math.random() < 0.4) spawnBurst(
      teleState.photons.A.x + (Math.random() - 0.5) * 30,
      teleState.photons.A.y + (Math.random() - 0.5) * 30,
      '#ff4444', 2);
    // Banner
    const bx = W / 2, by = H * 0.82;
    ctx.fillStyle = 'rgba(231,76,60,0.18)'; ctx.strokeStyle = 'rgba(231,76,60,0.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(bx - 155, by - 16, 310, 32, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff4444'; ctx.font = 'bold 11px Poppins,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('️ Quantum Coherence Lost — State Corrupted!', bx, by);
  }
  // Fidelity display
  if (noise > 0 && teleState.step >= 1) {
    const fid = Math.max(0, 100 - noise * 65).toFixed(0);
    ctx.fillStyle = fid > 70 ? 'rgba(39,174,96,0.8)' : fid > 40 ? 'rgba(243,156,18,0.8)' : 'rgba(231,76,60,0.8)';
    ctx.font = 'bold 10px Poppins,sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(`Fidelity: ${fid}%`, W - 12, 20);
  }
  // Mini Bloch sphere
  if (teleState.step >= 1) drawMiniBloch(ctx, W - 68, 58, 38);
}

function drawPhotonOrb(ctx, x, y, r, color, alpha, label) {
  ctx.save(); ctx.globalAlpha = alpha;
  // Parse hex safely for gradients
  const pr = parseInt(color.slice(1, 3), 16) || 180;
  const pg = parseInt(color.slice(3, 5), 16) || 100;
  const pb = parseInt(color.slice(5, 7), 16) || 100;
  // Glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.8);
  glow.addColorStop(0, `rgba(${pr},${pg},${pb},0.33)`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, r * 2.8, 0, Math.PI * 2); ctx.fill();
  // 3D sphere
  const sph = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.05, x, y, r);
  sph.addColorStop(0, lightenColor(color, 0.65));
  sph.addColorStop(0.45, color);
  sph.addColorStop(1, darkenColor(color, 0.45));
  ctx.fillStyle = sph; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  // Specular highlight
  const hl = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 0, x - r * 0.35, y - r * 0.4, r * 0.55);
  hl.addColorStop(0, 'rgba(255,255,255,0.55)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  // Label
  ctx.fillStyle = '#fff'; ctx.font = `bold ${r > 18 ? 11 : 9}px Poppins,sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
  ctx.restore();
}

// Draw a "decohered" / classically corrupted photon
// Looks broken, pixelated, flickering — no longer quantum
function drawDecoherentPhoton(ctx, x, y, r) {
  ctx.save();
  const t = Date.now();
  // Random flicker offset
  const fx = (Math.random() - 0.5) * 6;
  const fy = (Math.random() - 0.5) * 6;
  const px = x + fx, py = y + fy;

  // Broken glow — red noise
  const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 3);
  glow.addColorStop(0, 'rgba(255,50,50,0.35)');
  glow.addColorStop(0.5, 'rgba(180,0,0,0.15)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(px, py, r * 3, 0, Math.PI * 2); ctx.fill();

  // Fragmented sphere — draw as broken pieces
  const numFrags = 6;
  for (let i = 0; i < numFrags; i++) {
    const angle = (i / numFrags) * Math.PI * 2 + t * 0.003;
    const dist = r * 0.35 + Math.sin(t * 0.01 + i) * r * 0.2;
    const fx2 = px + Math.cos(angle) * dist;
    const fy2 = py + Math.sin(angle) * dist;
    const fragR = r * 0.3 + Math.random() * r * 0.15;
    const alpha = 0.4 + Math.random() * 0.5;
    ctx.globalAlpha = alpha;
    const fc = ctx.createRadialGradient(fx2, fy2, 0, fx2, fy2, fragR);
    fc.addColorStop(0, 'rgba(255,120,120,0.9)');
    fc.addColorStop(1, 'rgba(150,0,0,0.3)');
    ctx.fillStyle = fc;
    ctx.beginPath(); ctx.arc(fx2, fy2, fragR, 0, Math.PI * 2); ctx.fill();
  }

  // Central broken core
  ctx.globalAlpha = 0.5 + Math.sin(t * 0.015) * 0.3;
  const core = ctx.createRadialGradient(px, py, 0, px, py, r * 0.6);
  core.addColorStop(0, 'rgba(255,80,80,0.8)');
  core.addColorStop(1, 'rgba(80,0,0,0.2)');
  ctx.fillStyle = core; ctx.beginPath(); ctx.arc(px, py, r * 0.6, 0, Math.PI * 2); ctx.fill();

  // "Corrupted" label — pixelated look
  ctx.globalAlpha = 0.85 + Math.sin(t * 0.02) * 0.15;
  ctx.fillStyle = '#ff4444'; ctx.font = `bold 9px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('ERR', px, py);

  //  icon above
  ctx.font = '13px sans-serif';
  ctx.fillText('', px, py - r - 8);

  // "Classical" broken label below
  ctx.fillStyle = 'rgba(255,80,80,0.7)'; ctx.font = '7px Poppins,sans-serif';
  ctx.fillText('DECOHERED', px, py + r + 10);

  ctx.globalAlpha = 1; ctx.restore();
}

function lightenColor(hex, amt) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, r + Math.floor((255 - r) * amt))},${Math.min(255, g + Math.floor((255 - g) * amt))},${Math.min(255, b + Math.floor((255 - b) * amt))})`;
}
function darkenColor(hex, amt) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.floor(r * (1 - amt))},${Math.floor(g * (1 - amt))},${Math.floor(b * (1 - amt))})`;
}

function drawEntLine(ctx, x1, y1, x2, y2) {
  ctx.save();
  ctx.setLineDash([8, 5]); ctx.lineDashOffset = -teleState.dashOffset;
  ctx.strokeStyle = '#4da6ff'; ctx.lineWidth = 2; ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.setLineDash([]); ctx.restore();
  // entanglement label
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  ctx.fillStyle = 'rgba(77,166,255,0.6)'; ctx.font = '8px Poppins,sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('⟨Φ⁺⟩ entangled', mx, my - 12);
}

function drawClassicalArc(ctx, x1, y1, x2, y2, progress) {
  const cpx = (x1 + x2) / 2, cpy = Math.min(y1, y2) - 70;
  ctx.save();
  // Compute full arc path length approx
  ctx.setLineDash([10, 7]); ctx.lineDashOffset = -teleState.dashOffset * 1.5;
  ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.85;
  // Draw arc using quadratic bezier up to progress
  ctx.beginPath();
  // Sample path points
  const pts = []; const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cpx + t * t * x2;
    const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cpy + t * t * y2;
    pts.push({ x: px, y: py });
  }
  const maxI = Math.floor(progress * steps);
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i <= maxI; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha = 1;
  // Moving signal packet
  if (progress > 0.05 && progress < 1) {
    const pi = Math.min(maxI, pts.length - 1);
    const sp = pts[pi];
    drawPhotonOrb(ctx, sp.x, sp.y, 8, '#ffd700', 0.9, '→');
  }
  // Classical channel label
  ctx.fillStyle = 'rgba(255,215,0,0.8)'; ctx.font = 'bold 9px Poppins,sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('Classical Channel', cpx, cpy - 16);
  // Instruction near Bob when arc complete
  if (progress > 0.9 && teleState.result) {
    const instr = GATE_INSTRUCTIONS[teleState.result] || '';
    ctx.fillStyle = 'rgba(255,215,0,0.95)'; ctx.font = 'bold 10px Poppins,sans-serif';
    ctx.textAlign = 'center'; ctx.fillText(instr, x2, y2 - 38);
  }
  ctx.restore();
}

function drawAntennaIcon(ctx, x, y) {
  ctx.save(); ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2; ctx.globalAlpha = 0.9;
  // Pole
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 24); ctx.stroke();
  // Crossbar
  ctx.beginPath(); ctx.moveTo(x - 12, y + 8); ctx.lineTo(x + 12, y + 8); ctx.stroke();
  // Radio waves
  for (let i = 1; i <= 3; i++) {
    ctx.globalAlpha = 0.5 / i;
    ctx.beginPath();
    ctx.arc(x, y + 4, i * 10, Math.PI + 0.3, Math.PI * 2 - 0.3);
    ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.restore();
  ctx.fillStyle = 'rgba(255,215,0,0.7)'; ctx.font = '8px Poppins,sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('', x, y - 8);
}

function drawResultBadge(ctx, x, y, result) {
  ctx.fillStyle = '#1a2a4a'; ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(x - 28, y - 13, 56, 26, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 14px Poppins,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(result, x, y);
  ctx.fillStyle = 'rgba(255,215,0,0.6)'; ctx.font = '8px Poppins,sans-serif';
  ctx.fillText('Bell result', x, y + 22);
}

function drawSuccessBanner(ctx, W, H) {
  const bx = W / 2, by = H / 2 - 20;
  ctx.fillStyle = 'rgba(39,174,96,0.15)'; ctx.strokeStyle = 'rgba(39,174,96,0.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(bx - 140, by - 20, 280, 40, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#27ae60'; ctx.font = 'bold 13px Poppins,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(' State Successfully Reconstructed!', bx, by);
}

function drawTeleAlice(ctx, cx, cy) {
  // Head
  ctx.fillStyle = '#f9c89b'; ctx.beginPath(); ctx.arc(cx, cy - 38, 13, 0, Math.PI * 2); ctx.fill();
  // Dark hair
  ctx.fillStyle = '#2c2c2c'; ctx.beginPath();
  ctx.ellipse(cx, cy - 46, 14, 8, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.ellipse(cx - 12, cy - 38, 4, 8, -0.2, 0, Math.PI); ctx.fill();
  // Red body
  ctx.fillStyle = '#e74c3c'; ctx.beginPath();
  ctx.roundRect(ctx.roundRect ? cx - 14 : cx - 14, cy - 24, 28, 26, 5);
  ctx.beginPath(); ctx.moveTo(cx - 14, cy - 24); ctx.arcTo(cx + 14, cy - 24, cx + 14, cy + 2, 5);
  ctx.arcTo(cx + 14, cy + 2, cx - 14, cy + 2, 5); ctx.arcTo(cx - 14, cy + 2, cx - 14, cy - 24, 5);
  ctx.arcTo(cx - 14, cy - 24, cx + 14, cy - 24, 5); ctx.closePath(); ctx.fill();
  // Dark pants
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(cx - 12, cy + 2, 10, 20); ctx.fillRect(cx + 2, cy + 2, 10, 20);
  // Arms
  ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 14, cy - 18); ctx.lineTo(cx - 22, cy - 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 14, cy - 18); ctx.lineTo(cx + 22, cy - 2); ctx.stroke();
  // Label
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Poppins,sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('Alice', cx, cy + 32);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '9px Poppins,sans-serif';
  ctx.fillText('(Sender)', cx, cy + 43);
}

function drawTeleBob(ctx, cx, cy) {
  // Head
  ctx.fillStyle = '#f9c89b'; ctx.beginPath(); ctx.arc(cx, cy - 38, 13, 0, Math.PI * 2); ctx.fill();
  // Blonde hair
  ctx.fillStyle = '#d4a843'; ctx.beginPath();
  ctx.ellipse(cx, cy - 46, 14, 8, 0, Math.PI, Math.PI * 2); ctx.fill();
  // Blue plaid shirt
  ctx.fillStyle = '#2980b9';
  ctx.beginPath(); ctx.moveTo(cx - 14, cy - 24); ctx.arcTo(cx + 14, cy - 24, cx + 14, cy + 2, 5);
  ctx.arcTo(cx + 14, cy + 2, cx - 14, cy + 2, 5); ctx.arcTo(cx - 14, cy + 2, cx - 14, cy - 24, 5);
  ctx.arcTo(cx - 14, cy - 24, cx + 14, cy - 24, 5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 3, cy - 24); ctx.lineTo(cx - 3, cy + 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 3, cy - 24); ctx.lineTo(cx + 3, cy + 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 14, cy - 12); ctx.lineTo(cx + 14, cy - 12); ctx.stroke();
  // Dark pants
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(cx - 12, cy + 2, 10, 20); ctx.fillRect(cx + 2, cy + 2, 10, 20);
  // Arms (one waving)
  ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 14, cy - 18); ctx.lineTo(cx - 22, cy - 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 14, cy - 18); ctx.lineTo(cx + 22, cy - 32); ctx.stroke();
  // Label
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Poppins,sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('Bob', cx, cy + 32);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '9px Poppins,sans-serif';
  ctx.fillText('(Receiver)', cx, cy + 43);
}

// ── BUTTON STATE MANAGER ────────────────────
function setBtnStatesTele() {
  const s = teleState.step;
  const btnE = document.getElementById('btnTeleEntangle');
  const btnB = document.getElementById('btnTeleBell');
  if (btnE) { btnE.disabled = (s !== 0); btnE.style.opacity = s === 0 ? '1' : '0.4'; }
  if (btnB) { btnB.disabled = (s !== 1); btnB.style.opacity = s === 1 ? '1' : '0.4'; }
  const labels = [
    'Generate entangled pair to begin',
    'Click "Perform Bell Measurement"',
    'Sending classical signal to Bob...',
    'Bob must apply the correct gate',
    ' Teleportation Complete! '
  ];
  const sl = document.getElementById('teleStepLbl');
  const ss = document.getElementById('teleStatusLbl');
  if (sl) sl.textContent = labels[s] || '';
  if (ss) ss.textContent = labels[s] || '';
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById('tsd' + i);
    if (!dot) continue;
    if (i < s) dot.className = 'tele-step-dot done';
    else if (i === s) dot.className = 'tele-step-dot active';
    else dot.className = 'tele-step-dot';
  }
}

// ── STEP FUNCTIONS ──────────────────────────
function teleEntangle() {
  if (teleState.step !== 0) return;
  teleState.step = 1;
  soundManager.playSound('photon', { volume: 0.6 });
  setBtnStatesTele();
  const { srcX, cy, aliceX, bobX } = getTeleDims();
  teleState.entangleTween = {
    progress: 0,
    BstartX: srcX, BendX: aliceX + 32,
    AstartX: srcX, AendX: bobX
  };
  teleState.sourcePulse = 0;
  startTeleAnim();
}

function teleBell() {
  if (teleState.step !== 1) return;
  if (teleState.entangleTween) return; // still animating
  teleState.step = 2;
  teleState.result = ['00', '01', '10', '11'][Math.floor(Math.random() * 4)];
  teleState.correctGate = GATE_MAP[teleState.result];
  setBtnStatesTele();
  const { aliceX, cy } = getTeleDims();
  const midX = aliceX;
  teleState.bellTween = {
    progress: 0,
    CstartX: teleState.photons.C.x, CmidX: midX,
    BstartX: teleState.photons.B.x, BmidX: midX
  };
}

function teleClassical() {
  if (teleState.step !== 2) return;
  teleState.step = 3;
  teleState.showClassicalArc = true;
  teleState.classicalArcProgress = 0;
  teleState.classicalArcRunning = true;
  setBtnStatesTele();
  // Show gate panel after arc finishes (handled in teleAnimLoop)
  // Show Eve panel now
  const ep = document.getElementById('teleEvePanel');
  if (ep) ep.style.display = 'block';
  updateTeleMath();
}

function teleApplyGate(g) {
  if (teleState.step !== 3) return;
  const all = ['tgX', 'tgZ', 'tgXZ', 'tgI'];
  all.forEach(id => { const el = document.getElementById(id); if (el) el.className = 'tele-gate-btn'; });
  const idMap = { 'X': 'tgX', 'Z': 'tgZ', 'XZ': 'tgXZ', 'I': 'tgI' };
  const msgEl = document.getElementById('teleGateMsg');
  const gatePanel = document.getElementById('teleGatePanel');
  // What Bob received (may differ if Eve active)
  const receivedResult = teleState.eveModifiedResult || teleState.result;
  const bobsExpectedGate = GATE_MAP[receivedResult];
  const trueCorrectGate = GATE_MAP[teleState.result];

  if (g === bobsExpectedGate) {
    teleState.step = 4;
    setBtnStatesTele();
    if (gatePanel) gatePanel.style.display = 'none';
    if (teleState.eveMode === 'active' && bobsExpectedGate !== trueCorrectGate) {
      // Eve corrupted — Bob applied wrong gate unknowingly
      teleState.showSuccessBanner = false;
      teleState.photonDecohered = true;
      soundManager.playSound('error', { volume: 0.9, distort: teleState.eveMode === 'active' });
      teleState.photons.A.color = '#ff4444';
      spawnBurst(teleState.photons.A.x, teleState.photons.A.y, '#ff4444', 25);
      const eveMsg = document.getElementById('eveResultMsg');
      if (eveMsg) eveMsg.innerHTML = `<strong style="color:var(--coral)"> State Corrupted by Eve!</strong><br>
        Bob applied ${g} but actually needed ${trueCorrectGate}.<br>
        Eve's interference destroyed teleportation fidelity!`;
      if (msgEl) { msgEl.textContent = ' State corrupted by Eve!'; msgEl.style.color = 'var(--coral)'; }
      const fidEve = Math.max(0, 100 - (teleState.noiseLevel || 0) * 0.65);
      lastExperiment = 'teleport';
      lastResults.teleport = { result: teleState.result, gate: g, success: false, fidelity: Math.round(fidEve), noise: teleState.noiseLevel || 0, eveMode: teleState.eveMode, eveModifiedResult: teleState.eveModifiedResult };
      pushHistory('teleport', 'Eve corrupted state ', '');
    } else {
      teleState.labelChanged = true;
      teleState.showSuccessBanner = true;
      soundManager.playSound('success', { volume: 1.0 });
      spawnBurst(teleState.photons.A.x, teleState.photons.A.y, '#27ae60', 30);
      spawnBurst(teleState.photons.A.x, teleState.photons.A.y, '#ffd700', 15);
      if (msgEl) { msgEl.textContent = ' State Successfully Reconstructed!'; msgEl.style.color = 'var(--mint)'; }
      const fidOk = Math.max(0, 100 - (teleState.noiseLevel || 0) * 0.65);
      lastExperiment = 'teleport';
      lastResults.teleport = { result: teleState.result, gate: g, success: true, fidelity: Math.round(fidOk), noise: teleState.noiseLevel || 0, eveMode: teleState.eveMode, eveModifiedResult: null };
      pushHistory('teleport', `Success  Fidelity ${Math.round(fidOk)}%`, '');
    }
    updateTeleMath();
  } else {
    const btn = document.getElementById(idMap[g]);
    if (btn) { btn.className = 'tele-gate-btn wrong'; setTimeout(() => btn.className = 'tele-gate-btn', 500); }
    if (msgEl) { msgEl.textContent = ' Wrong gate — state briefly decoheres! Try again.'; msgEl.style.color = 'var(--coral)'; }
    // Brief decoherence flash on wrong gate
    soundManager.playSound('error', { volume: 0.9 });
    const prevColor = teleState.photons.A.color;
    teleState.photons.A.color = '#ff4444';
    spawnBurst(teleState.photons.A.x, teleState.photons.A.y, '#ff4444', 15);
    spawnBurst(teleState.photons.A.x, teleState.photons.A.y, 'rgba(255,200,0,0.8)', 8);
    setTimeout(() => {
      if (teleState.step === 3) { // still in step 3, user can retry
        teleState.photons.A.color = '#ffd700'; // restore yellow
      }
    }, 800);
    hintCorrectGate();
  }
}

function hintCorrectGate() {
  const idMap = { 'X': 'tgX', 'Z': 'tgZ', 'XZ': 'tgXZ', 'I': 'tgI' };
  const correct = teleState.correctGate;
  if (!correct) return;
  ['X', 'Z', 'XZ', 'I'].forEach(g => {
    const el = document.getElementById(idMap[g]);
    if (!el) return;
    el.className = g === correct ? 'tele-gate-btn hint' : 'tele-gate-btn';
  });
}

function teleReset() {
  if (teleState.animFrame) { cancelAnimationFrame(teleState.animFrame); teleState.animFrame = null; }
  if (teleState.classicalTimeout) { clearTimeout(teleState.classicalTimeout); teleState.classicalTimeout = null; }
  teleState.step = 0; teleState.result = null; teleState.correctGate = null;
  teleState.dashOffset = 0; teleState.particles = [];
  teleState.showEntLine = false; teleState.showClassicalArc = false;
  teleState.classicalArcProgress = 0; teleState.classicalArcRunning = false;
  teleState.showResultBadge = false; teleState.showSuccessBanner = false;
  teleState.mergeFlash = 0; teleState.labelChanged = false;
  teleState.entangleTween = null; teleState.bellTween = null; teleState.sourcePulse = 0;
  teleState.eveMode = 'none'; teleState.eveModifiedResult = null; teleState.photonDecohered = false;
  resetPhotonPositions();
  setBtnStatesTele();
  // Reset UI elements
  const gp = document.getElementById('teleGatePanel');
  if (gp) gp.style.display = 'none';
  const ep = document.getElementById('teleEvePanel');
  if (ep) { ep.style.display = 'none'; }
  const eveSel = document.getElementById('eveModeSelect');
  if (eveSel) eveSel.value = 'none';
  const eveLbl = document.getElementById('eveModeLabel');
  if (eveLbl) eveLbl.textContent = '';
  const eveMsg = document.getElementById('eveResultMsg');
  if (eveMsg) eveMsg.textContent = '';
  const msgEl = document.getElementById('teleGateMsg');
  if (msgEl) msgEl.textContent = '';
  ['tgX', 'tgZ', 'tgXZ', 'tgI'].forEach(id => { const el = document.getElementById(id); if (el) el.className = 'tele-gate-btn'; });
  updateTeleMath();
  startTeleAnim();
}

// ── EVE ATTACK SIMULATION ──────────────────
function setEveMode(mode) {
  teleState.eveMode = mode;
  const lbl = document.getElementById('eveModeLabel');
  const msg = document.getElementById('eveResultMsg');
  if (!lbl || !msg) return;
  if (mode === 'passive') {
    lbl.textContent = ' Eve is watching';
    msg.innerHTML = `<strong>Eve sees classical bits: ${teleState.result}</strong><br>
      But this reveals NOTHING about quantum state!<br>
      Classical bits alone are useless without the entangled photon.<br>
      <span style="color:var(--mint)"> Teleportation still secure.</span>`;
  } else if (mode === 'active') {
    const bits = teleState.result.split('').map(b => b === '0' ? '1' : '0').join('');
    teleState.eveModifiedResult = bits;
    lbl.textContent = '️ Eve modified bits!';
    msg.innerHTML = `<strong>Alice sent: ${teleState.result}</strong><br>
      <strong style="color:var(--coral)">Eve changed to: ${bits}</strong><br>
      Bob will apply WRONG gate → state corrupted!`;
    teleState.photons.A.color = '#ff4444';
    spawnBurst(teleState.photons.A.x, teleState.photons.A.y, '#ff4444', 10);
  } else {
    lbl.textContent = ''; msg.textContent = '';
    teleState.eveModifiedResult = null;
    if (teleState.photons.A.color === '#ff4444') teleState.photons.A.color = '#ffd700';
  }
  updateTeleMath();
}

function drawTeleEve(ctx, cx, cy) {
  ctx.fillStyle = 'rgba(20,10,10,0.95)';
  ctx.strokeStyle = 'rgba(231,76,60,0.85)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 13, cy + 18); ctx.quadraticCurveTo(cx - 17, cy - 5, cx, cy - 17);
  ctx.quadraticCurveTo(cx + 17, cy - 5, cx + 13, cy + 18); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(231,76,60,0.95)';
  ctx.beginPath(); ctx.arc(cx - 4, cy - 2, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 4, cy - 2, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(231,76,60,0.8)'; ctx.font = 'bold 9px Poppins,sans-serif';
  ctx.textAlign = 'center'; ctx.fillText(' Eve', cx, cy + 30);
  if (teleState.eveMode === 'active') {
    ctx.fillStyle = 'rgba(231,76,60,0.9)'; ctx.font = '8px Poppins,sans-serif';
    ctx.fillText('️ Intercepting!', cx, cy + 42);
  }
}

function drawEveInterceptArc(ctx, x1, y1, eveX, eveY, x2, y2, progress, isActive) {
  ctx.save();
  ctx.setLineDash([8, 6]); ctx.lineDashOffset = -teleState.dashOffset * 1.5;
  ctx.lineWidth = 2.5;
  // Alice → Eve
  const p1 = Math.min(1, progress * 2);
  if (p1 > 0) {
    ctx.strokeStyle = isActive ? 'rgba(231,76,60,0.8)' : 'rgba(255,215,0,0.7)';
    ctx.beginPath(); ctx.moveTo(x1, y1);
    const cp1x = (x1 + eveX) / 2, cp1y = Math.min(y1, eveY) - 30;
    // Bezier sample
    const s1 = Math.floor(p1 * 30);
    for (let i = 0; i <= s1; i++) {
      const t = i / 30;
      const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cp1x + t * t * eveX;
      const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cp1y + t * t * eveY;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // Eve → Bob
  const p2 = Math.max(0, progress * 2 - 1);
  if (p2 > 0) {
    ctx.strokeStyle = isActive ? 'rgba(231,76,60,0.6)' : 'rgba(255,215,0,0.6)';
    ctx.beginPath();
    const cp2x = (eveX + x2) / 2, cp2y = Math.min(eveY, y2) - 30;
    const s2 = Math.floor(p2 * 30);
    for (let i = 0; i <= s2; i++) {
      const t = i / 30;
      const px = (1 - t) * (1 - t) * eveX + 2 * (1 - t) * t * cp2x + t * t * x2;
      const py = (1 - t) * (1 - t) * eveY + 2 * (1 - t) * t * cp2y + t * t * y2;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]); ctx.restore();
  ctx.fillStyle = 'rgba(255,215,0,0.7)'; ctx.font = '8px Poppins,sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('Classical Channel', (x1 + x2) / 2, eveY - 20);
  // Instruction near Bob
  if (progress > 0.9 && teleState.result) {
    const rx = teleState.eveModifiedResult || teleState.result;
    const instr = GATE_INSTRUCTIONS[rx] || '';
    ctx.fillStyle = isActive ? 'rgba(231,76,60,0.9)' : 'rgba(255,215,0,0.9)';
    ctx.font = 'bold 10px Poppins,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(instr, x2, y2 - 38);
  }
}

// ── MINI BLOCH SPHERE ───────────────────────
function drawMiniBloch(ctx, cx, cy, r) {
  ctx.save();
  // Background
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  bg.addColorStop(0, 'rgba(13,26,46,0.9)'); bg.addColorStop(1, 'rgba(5,16,31,0.7)');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  // Sphere ring
  ctx.strokeStyle = 'rgba(99,179,237,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  // Equator
  ctx.strokeStyle = 'rgba(99,179,237,0.2)';
  ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.28, 0, 0, Math.PI * 2); ctx.stroke();
  // Vertical axis
  ctx.strokeStyle = 'rgba(99,179,237,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
  // Axis labels
  ctx.fillStyle = 'rgba(99,179,237,0.7)'; ctx.font = '7px Poppins,sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('|0⟩', cx, cy - r - 4);
  ctx.fillText('|1⟩', cx, cy + r + 9);
  // State arrow direction based on step
  let arrowAngle = -Math.PI / 2; // up = |0⟩
  const s = teleState.step;
  if (s === 1) arrowAngle = -Math.PI / 3.5; // C = unknown tilted
  else if (s === 2) arrowAngle = Math.PI / 2; // collapsed downward
  else if (s === 3) arrowAngle = Math.PI / 5; // Bob's uncorrected state
  else if (s >= 4) arrowAngle = -Math.PI / 3.5; // reconstructed = matches C
  const ax = cx + Math.cos(arrowAngle) * r * 0.82;
  const ay = cy + Math.sin(arrowAngle) * r * 0.82;
  const arrowColor = s >= 4 ? '#27ae60' : s === 2 ? '#ff6b35' : teleState.photons.A.color || '#ff6b35';
  ctx.strokeStyle = arrowColor; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ax, ay); ctx.stroke();
  ctx.fillStyle = arrowColor; ctx.beginPath(); ctx.arc(ax, ay, 3, 0, Math.PI * 2); ctx.fill();
  // Title
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '7px Poppins,sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('State |ψ⟩', cx, cy + r + 20);
  ctx.restore();
}

// ── NOISE SLIDER ────────────────────────────
function onTeleNoise(el) {
  teleState.noiseLevel = parseInt(el.value);
  const noiseValEl = document.getElementById('teleNoiseVal');
  const fidEl = document.getElementById('teleFidelityLbl');
  if (noiseValEl) noiseValEl.textContent = el.value + '%';
  const fidelity = Math.max(0, 100 - el.value * 0.65).toFixed(0);
  if (fidEl) {
    fidEl.textContent = `Fidelity: ${fidelity}%`;
    fidEl.style.color = fidelity > 70 ? 'var(--mint)' : fidelity > 40 ? 'var(--amber)' : 'var(--coral)';
  }
}

// ── MATH PANEL ──────────────────────────────
let teleMathVisible = false;
function toggleTeleMath() {
  teleMathVisible = !teleMathVisible;
  const panel = document.getElementById('teleMathPanel');
  const btn = document.getElementById('teleMathToggle');
  if (panel) panel.style.display = teleMathVisible ? 'block' : 'none';
  if (btn) btn.textContent = (teleMathVisible ? '∑ Hide' : '∑ Show') + ' Math';
  updateTeleMath();
}
function updateTeleMath() {
  if (!teleMathVisible) return;
  const el = document.getElementById('teleMathPanel');
  if (!el) return;
  const s = teleState.step;
  const r = teleState.result || '??';
  const rx = teleState.eveModifiedResult || r;
  const g = GATE_MAP[rx] || '?';
  const math = [
    `<span style="color:var(--sky)">Initial:</span> |ψ⟩ = α|0⟩ + β|1⟩<br>Photon C = unknown quantum state`,
    `<span style="color:var(--purple)">Bell pair:</span> |Φ⁺⟩ = (|00⟩+|11⟩)/√2<br>Total: |ψ⟩<sub>C</sub> ⊗ |Φ⁺⟩<sub>AB</sub>`,
    `<span style="color:var(--amber)">Bell result:</span> ${r}<br>Alice's state collapsed → ${r} eigenstate<br>Bob holds rotated |ψ⟩`,
    `<span style="color:var(--amber)">Bob received:</span> ${rx}${teleState.eveModifiedResult ? ' <span style="color:var(--coral)">(Eve modified!)</span>' : ''}<br>Must apply: <strong>${g}</strong> gate to recover |ψ⟩`,
    teleState.showSuccessBanner
      ? `<span style="color:var(--mint)"> Reconstructed:</span> Bob's state = |ψ⟩<br>= α|0⟩ + β|1⟩ (matches Alice's original!)`
      : `<span style="color:var(--coral)"> Corrupted:</span> Eve's interference<br>Bob applied wrong gate → state ≠ |ψ⟩`
  ];
  el.innerHTML = math[Math.min(s, 4)] || '';
}

// Init tele canvas on load / resize
// ── BB84 CANVAS FORCE RESIZE ────────────────
// The stage div only has height when view-bb84 is flex-displayed.
// We force set canvas dimensions directly from the stage's offsetHeight.
function forceResizeBB84() {
  const stage = document.getElementById('stage');
  if (!stage) return;
  // offsetWidth/Height work even if clientHeight is 0 due to flex quirks
  const w = stage.offsetWidth || stage.clientWidth || 600;
  const h = stage.offsetHeight || stage.clientHeight || 280;
  if (w > 10 && h > 10) {
    canvas.width = w;
    canvas.height = h;
    buildLayout();
    stars = null;
  }
}

function initTeleCanvas() {
  resizeTeleCanvas();
  startTeleAnim();
  setBtnStatesTele();
}

// ── INIT ──────────────────────────────────────
window.addEventListener('load', () => {
  resizeCanvas(); buildLayout();
  renderEncTablePreview('HELLO');
  buildCharProgress('HELLO');
  // resetTele was renamed to teleReset in v16:
  if (typeof teleReset === 'function') teleReset();
  requestAnimationFrame(draw);
  // Init teleportation canvas
  setTimeout(initTeleCanvas, 200);

  // Hide right panel by default (exp 1 = Superposition)
  const rightPanel = document.querySelector('.right');
  if (rightPanel) rightPanel.style.display = 'none';
  const mainGrid = document.querySelector('.main');
  if (mainGrid) mainGrid.style.gridTemplateColumns = '214px 1fr';

  // Init quantum circuit simulator
  qcUpdateViz();
  qcJourney = [{ name: '|0⟩', lbl: 'North pole', type: 'zero', gate: null }];
  renderJourney();
  initPopupHover();

  // Init Bloch sphere after layout
  setTimeout(() => {
    if (window.THREE) { blochReady = true; initBlochSphere(); }
  }, 300);

  // ResizeObserver for BB84 canvas — observe the cenMain container
  if (window.ResizeObserver) {
    const cenMain = document.getElementById('cenMain');
    if (cenMain) {
      new ResizeObserver(() => {
        if (currentExp === 3) forceResizeBB84();
      }).observe(cenMain);
    }
  }
});

// Add reveal animation style
const style = document.createElement('style');
style.textContent = `@keyframes revealPop{from{transform:scale(.8);opacity:.5;}to{transform:scale(1);opacity:1;}}`;
document.head.appendChild(style);

// ── STUB: drawPhaseDial (referenced but never defined) ─
function drawPhaseDial(angle) {
  // No-op stub — phase dial canvas is part of the Superposition tab,
  // which initialises itself via qcUpdateViz(). Safe to leave empty here.
}

// ══════════════════════════════════════════════════════
// E91 QUANTUM KEY DISTRIBUTION — Full Engine
// ══════════════════════════════════════════════════════

const E91_ALICE_ANGLES = [0, 45, 90];
const E91_BOB_ANGLES = [45, 90, 135];

let e91State = {
  step: 0, running: false, animFrame: null, dashOffset: 0,
  eveOn: false, noiseLevel: 0, numPairs: 3, animSpeed: 0.8,
  explainOn: true, beginnerMode: true, bellS: 2.83,
  photonPairs: [], aliceKey: [], bobKey: [],
  msgBinary: '', encrypted: '', paddedKey: '',
  inputMode: 'text', fileData: null, fileType: 'image', fileName: '',
  collapseFlashes: [], transmitT: 0,
  classicalPhase: 0, classicalT: 0,
  xorStep: -1, xorPlayInterval: null,
  bitParticles: [],
  detectorTypes: { alice: ['+', '×', '+'], bob: ['×', '+', '×'] },
  // NEW pipeline flags
  xorRunning: false,
  transmitRunning: false,
  allBitsReceived: false,
  decryptRunning: false,
  bobReceivedBits: [],
  encryptedBits: [],
  msgBitsArr: [],
  keyBitsArr: [],
  bobKeyBitsArr: [],
  currentBitIdx: 0,
  xorTimeout1: null, xorTimeout2: null, xorTimeout3: null, xorTimeout4: null,
  xorTimeout5: null,
  gateInterval: null,
  arrowOffset: 0,
  phaseTransBanner: 0,
  fullscreen: false,
  currentPopup: null,   // {line1,line2,line3,isBob} — drawn on canvas each frame
  _lastDecrypted: null, // set by e91OnDecryptDone — shown on canvas step 5
  fileSizeBytes: 0,
  fileTotalBits: 0,
  fileSimBits: 0,
};

// ── Config functions ─────────────────────────
function e91OnPairs(el) {
  e91State.numPairs = Math.min(parseInt(el.value), 3);
  el.value = e91State.numPairs;
  document.getElementById('e91PairCount').textContent = e91State.numPairs;
  document.getElementById('e91PairsVal').textContent = e91State.numPairs;
  // Refresh file info panel if visible (updated pair count)
  if (e91State.inputMode === 'file' && e91State.fileTotalBits > 0) e91UpdateFileInfoPanel();
}
function e91SetEve(on) {
  e91State.eveOn = on;
  const btnOff = document.getElementById('e91EveOff'), btnOn = document.getElementById('e91EveOn');
  if (btnOff) { btnOff.style.background = on ? '#fff' : 'var(--sky)'; btnOff.style.color = on ? 'var(--tm)' : '#fff'; }
  if (btnOn) { btnOn.style.background = on ? 'var(--coral)' : '#fff'; btnOn.style.color = on ? '#fff' : 'var(--tm)'; }
  e91State.bellS = on ? (1.5 + Math.random() * 0.35) : (2.65 + Math.random() * 0.18);
  updateE91BellDisplay();
}
function e91OnNoise(el) {
  e91State.noiseLevel = parseInt(el.value);
  document.getElementById('e91NoiseVal').textContent = el.value + '%';
}
// Speed map: slider 1-4 → internal animSpeed multiplier
// Lower = slower = better for learning
const E91_SPEED_MAP = { 1: 0.4, 2: 0.8, 3: 1.4, 4: 2.5 };
const E91_SPEED_LBL = { 1: 'Slow ', 2: 'Normal', 3: 'Fast', 4: 'Turbo ' };
function e91OnSpeed(el) {
  const v = parseInt(el.value);
  e91State.animSpeed = E91_SPEED_MAP[v] || 0.8;
  document.getElementById('e91SpeedVal').textContent = E91_SPEED_LBL[v] || 'Normal';
}
function e91SetExplain(on) {
  e91State.explainOn = on;
  document.getElementById('e91ExplOn').className = 'mode-btn' + (on ? ' active' : '');
  document.getElementById('e91ExplOff').className = 'mode-btn' + (on ? '' : ' active');
  if (!on) { const b = document.getElementById('e91AiBox'); if (b) b.style.display = 'none'; }
}
function e91SetBeginner(on) {
  e91State.beginnerMode = on;
  document.getElementById('e91BegOn').className = 'mode-btn' + (on ? ' active' : '');
  document.getElementById('e91BegOn').style.background = on ? 'var(--mint)' : '#fff';
  document.getElementById('e91BegOn').style.color = on ? '#fff' : 'var(--tm)';
  document.getElementById('e91BegOff').className = 'mode-btn' + (on ? '' : ' active');
}
function e91OnMsgInput() { }

// ── Input mode switch: ALWAYS resets experiment state ─────
function setE91InputMode(mode) {
  e91State.inputMode = mode;
  document.getElementById('e91ModeText').className = 'mode-btn' + (mode === 'text' ? ' active' : '');
  document.getElementById('e91ModeFile').className = 'mode-btn' + (mode === 'file' ? ' active' : '');
  document.getElementById('e91TextSection').style.display = mode === 'text' ? 'block' : 'none';
  document.getElementById('e91FileSection').style.display = mode === 'file' ? 'block' : 'none';
  // Hide file info panel when switching to text mode
  if (mode === 'text') {
    const fip = document.getElementById('e91FileInfoPanel');
    if (fip) fip.style.display = 'none';
  }
  e91Reset();
}

// MIME type maps for validation
const E91_FILE_ACCEPT = {
  image: 'image/*',
  audio: 'audio/*',
  text: '.txt,.csv,.json,.md'
};
const E91_MIME_PATTERNS = {
  image: /^image\//,
  audio: /^audio\//,
  text: /^text\/|application\/(json|csv)/
};

function e91UpdateFileAccept(sel) {
  const fileInput = document.getElementById('e91FileInput');
  if (fileInput) fileInput.accept = E91_FILE_ACCEPT[sel.value] || '*/*';
  // Clear any previously loaded file data when type changes
  if (fileInput) fileInput.value = '';
  e91State.fileData = null; e91State.fileName = '';
  const statusEl = document.getElementById('e91FileStatus');
  if (statusEl) statusEl.textContent = 'No file selected';
  const prev = document.getElementById('e91FilePreview');
  if (prev) { prev.style.display = 'none'; prev.textContent = ''; }
}

function e91HandleFile(input) {
  const file = input.files[0];
  if (!file) return;
  const selectedType = document.getElementById('e91FileType').value;
  const statusEl = document.getElementById('e91FileStatus');
  // ── MIME Validation ──
  const pattern = E91_MIME_PATTERNS[selectedType];
  const mimeOk = pattern ? pattern.test(file.type) : true;
  if (!mimeOk) {
    const friendly = { image: 'an image (.png, .jpg, .gif)', audio: 'an audio file (.mp3, .wav)', text: 'a text file (.txt, .csv, .json)' };
    statusEl.innerHTML = `<span style="color:var(--coral)"> Wrong file type!<br>
      You selected "${selectedType}" but uploaded: <strong>${file.type || 'unknown'}</strong><br>
      Please upload ${friendly[selectedType] || selectedType}.</span>`;
    input.value = ''; // clear the bad selection
    e91State.fileData = null; e91State.fileName = '';
    return;
  }
  e91State.fileName = file.name;
  e91State.fileType = selectedType;
  const useFullFile = document.getElementById('e91FullFile').checked;
  statusEl.textContent = 'Reading file...';
  const reader = new FileReader();
  reader.onload = (ev) => {
    const bytes = new Uint8Array(ev.target.result);
    const maxBytes = useFullFile ? bytes.length : Math.min(bytes.length, 8); // 64 bits visual sim
    let simBits = 0;
    const binaryStr = Array.from(bytes.slice(0, maxBytes))
      .map(b => b.toString(2).padStart(8, '0')).join('');
    e91State.fileData = binaryStr;
    e91State.msgBinary = binaryStr;
    const totalBits = bytes.length * 8;
    // Store full file stats for File Info Panel
    e91State.fileSizeBytes = bytes.length;
    e91State.fileTotalBits = totalBits;
    e91State.fileSimBits = simBits = Math.min(totalBits, 64);
    statusEl.innerHTML = `<span style="color:var(--mint)"> Valid ${selectedType} file loaded</span><br>
      <span style="color:var(--sky)">${file.name.slice(0, 22)}</span><br>
      <span style="color:var(--tl)">${(bytes.length / 1024).toFixed(1)} KB · ${totalBits.toLocaleString()} bits</span>`;
    // Show canvas file preview
    const prev = document.getElementById('e91FilePreview');
    if (prev) { prev.style.display = 'block'; prev.textContent = ` ${file.name.slice(0, 16)} | ${(bytes.length / 1024).toFixed(1)}KB | binary ready`; }
    // Update File Info Panel
    e91UpdateFileInfoPanel();
  };
  reader.readAsArrayBuffer(file);
}

function updateE91BellDisplay() {
  const safe = e91State.bellS > 2;
  const safeSet = (id, p, v) => { const e = document.getElementById(id); if (e) e[p] = v; };
  const safeStyle = (id, p, v) => { const e = document.getElementById(id); if (e) e.style[p] = v; };
  safeSet('e91BellVal', 'textContent', e91State.bellS.toFixed(2));
  safeStyle('e91BellVal', 'color', safe ? 'var(--mint)' : 'var(--coral)');
  safeSet('e91BellStatus', 'textContent', safe ? ' Quantum Secure (|S| > 2)' : '️ Insecure — Eve Detected!');
  safeStyle('e91BellStatus', 'color', safe ? 'var(--mint)' : 'var(--coral)');
  safeSet('e91BellOverlay', 'textContent', `|S| = ${e91State.bellS.toFixed(2)} ${safe ? '' : '️'}`);
  safeStyle('e91BellOverlay', 'color', safe ? '#68d391' : '#fc8181');
}

// ── AI Professor Explanations ──────────────────
const E91_AI_STEPS = {
  1: {
    short: `<strong>Classical Channel Setup</strong><br>Alice and Bob open a regular internet connection. This channel is <em>not</em> secret — anyone can see it. But they only use it to agree on protocol rules, never to share the actual key.`,
    beginner: `<strong> What is a Classical Channel?</strong><br>Think of it like a phone call — anyone could listen in. Alice tells Bob "let's use E91 quantum protocol." No secrets here yet. The security comes later from <em>quantum physics</em>, not the channel itself.`
  },
  2: {
    short: `<strong>Entangled Photon Pairs</strong><br>A central source fires pairs of photons — one to Alice, one to Bob. These photons are <em>quantum entangled</em>: measuring one instantly determines the other, regardless of distance. Bell's inequality |S| > 2 confirms true entanglement.`,
    beginner: `<strong>️ What is Entanglement?</strong><br>Imagine two magic coins: when you flip one and get Heads, the other <em>instantly</em> becomes Tails — even if it's across the world! That's entanglement. These photon pairs behave exactly like that. Einstein called it "spooky action at a distance."`
  },
  3: {
    short: `<strong>Measurement & Key Sifting</strong><br>Alice and Bob each randomly choose a measurement angle (+/×). When they pick the <em>same</em> basis, their results are perfectly correlated — those bits form the secret key. Mismatched bases are discarded. Bell test confirms no eavesdropping.`,
    beginner: `<strong> How Measurement Creates a Key</strong><br>Alice and Bob independently choose how to measure their photon (like choosing a filter). When they accidentally choose the <em>same</em> filter, they get matching results: both see 1, or both see 0. Those matching bits become their secret key — without ever telling each other what they got!`
  },
  4: {
    short: `<strong>XOR One-Time Pad Encryption</strong><br>Alice XORs each message bit with the corresponding key bit: 0⊕0=0, 0⊕1=1, 1⊕0=1, 1⊕1=0. This is a One-Time Pad — mathematically proven unbreakable when the key is truly random and never reused.`,
    beginner: `<strong> Why XOR is Unbreakable</strong><br>XOR is like a combination lock: <br>• Message bit 1 + Key bit 1 = Encrypted 0<br>• Message bit 0 + Key bit 1 = Encrypted 1<br>Without knowing the key, the encrypted output looks completely random. And since our key came from <em>quantum randomness</em>, it truly is! (A⊕B)⊕B = A — XOR undoes itself.`
  },
  5: {
    short: `<strong>Decryption & Verification</strong><br>Bob XORs the received encrypted bits with his copy of the key. Since XOR is self-inverse: (Encrypted ⊕ Key) ⊕ Key = Original. Bell |S| > 2 confirms the channel was secure — Eve cannot intercept without disturbing the quantum states.`,
    beginner: `<strong> Bob Unlocks the Message</strong><br>Bob applies the same XOR operation with his key — and the original message pops out! This works because: if you XOR something twice with the same value, you get back what you started with. And because the key was quantum-generated, Eve never had a chance to copy it without being detected!`
  }
};

function e91ShowAI(step) {
  const box = document.getElementById('e91AiBox');
  const txt = document.getElementById('e91AiText');
  if (!box || !txt) return;
  if (!e91State.explainOn) { box.style.display = 'none'; return; }
  const content = E91_AI_STEPS[step];
  if (!content) { box.style.display = 'none'; return; }
  txt.innerHTML = e91State.beginnerMode ? content.beginner : content.short;
  box.style.display = 'block';
  // Auto-hide after 12s
  clearTimeout(e91State._aiTimer);
  e91State._aiTimer = setTimeout(() => { box.style.display = 'none'; }, 12000);
}

function e91ToggleWhyXor() {
  const el = document.getElementById('e91WhyXor');
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function e91UpdateFileInfoPanel() {
  const panel = document.getElementById('e91FileInfoPanel');
  const cont = document.getElementById('e91FileInfoContent');
  if (!panel || !cont) return;
  if (e91State.inputMode !== 'file' || !e91State.fileName || !e91State.fileTotalBits) {
    panel.style.display = 'none'; return;
  }
  const totalBits = e91State.fileTotalBits;
  const simBits = e91State.fileSimBits || 64;
  const batchBits = totalBits - simBits;
  const reqPairs = totalBits * 2;
  const numP = e91State.numPairs || 3;
  cont.innerHTML = `
    <div style="display:flex;gap:0;flex-wrap:wrap;">
      <div style="flex:1;min-width:220px;padding-right:16px;border-right:1px solid rgba(99,179,237,0.15);margin-right:16px;">
        <div style="color:#63b3ed;font-weight:700;font-size:10px;margin-bottom:6px;"> File Details</div>
        <table style="border-collapse:collapse;width:100%;font-size:9px;line-height:1.6;">
          <tr><td style="color:rgba(180,215,255,0.75);padding:2px 0;white-space:nowrap;">File name</td><td style="color:#e8f4ff;padding:2px 0 2px 10px;font-weight:700;">${e91State.fileName.slice(0, 24)}</td></tr>
          <tr><td style="color:rgba(180,215,255,0.75);padding:2px 0;white-space:nowrap;">Original size</td><td style="color:#e8f4ff;padding:2px 0 2px 10px;font-weight:700;">${(e91State.fileSizeBytes / 1024).toFixed(1)} KB</td></tr>
          <tr><td style="color:rgba(180,215,255,0.75);padding:2px 0;white-space:nowrap;">Total bits</td><td style="color:#e8f4ff;padding:2px 0 2px 10px;font-weight:700;">${totalBits.toLocaleString()}</td></tr>
          <tr><td style="color:rgba(180,215,255,0.75);padding:2px 0;white-space:nowrap;">Simulated bits</td>
              <td style="padding:2px 0 2px 10px;">
                <span style="color:#ffd700;font-weight:800;font-size:10px;">${simBits} bits</span>
                <span style="color:rgba(253,220,100,0.7);font-size:8px;margin-left:4px;font-weight:600;">(visual demo)</span>
              </td></tr>
          <tr><td style="color:rgba(160,200,255,0.55);padding:2px 0;white-space:nowrap;font-size:8px;">Batch remainder</td>
              <td style="color:rgba(180,215,255,0.6);padding:2px 0 2px 10px;font-size:8px;">${batchBits.toLocaleString()} bits <span style="color:rgba(150,180,220,0.45);font-size:7.5px;">(not visualised)</span></td></tr>
        </table>
      </div>
      <div style="flex:1;min-width:200px;">
        <div style="color:#68d391;font-weight:700;font-size:10px;margin-bottom:6px;">️ Quantum Resource Estimate</div>
        <table style="border-collapse:collapse;width:100%;font-size:9px;line-height:1.6;">
          <tr><td style="color:rgba(180,215,255,0.75);padding:2px 0;white-space:nowrap;">Required key bits</td><td style="color:#e8f4ff;padding:2px 0 2px 10px;font-weight:700;">${totalBits.toLocaleString()}</td></tr>
          <tr><td style="color:rgba(180,215,255,0.75);padding:2px 0;white-space:nowrap;">Est. entangled pairs</td><td style="color:#f6ad55;padding:2px 0 2px 10px;font-weight:700;">~${reqPairs.toLocaleString()}</td></tr>
          <tr><td style="color:rgba(160,200,255,0.55);padding:2px 0;font-size:7.5px;" colspan="2">(~2× bits, ~50% basis mismatch rate)</td></tr>
          <tr><td style="color:rgba(160,200,255,0.55);padding:2px 0;font-size:7.5px;" colspan="2">Showing <strong style="color:#f6ad55">${numP}</strong> representative pairs</td></tr>
        </table>
      </div>
    </div>`;
  panel.style.display = 'block';
}

// ── Legacy stubs (replaced by pipeline) ──────
function e91PlayXor() { }
function e91SpawnBitParticles() { }

// ── XOR Column Highlight stub (replaced by pipeline) ──
let e91XorStep = -1, e91XorPlayInt = null;
// ── Step button enable/disable ──────────────────
function e91UpdateStepBtns(nextAllowed) {
  for (let i = 1; i <= 5; i++) {
    const btn = document.getElementById('e91Btn' + i);
    if (!btn) continue;
    if (i < nextAllowed) {
      btn.disabled = true; btn.style.opacity = '0.35';
      btn.style.background = 'linear-gradient(135deg,#27ae60,#1e8449)';
    } else if (i === nextAllowed) {
      btn.disabled = false; btn.style.opacity = '1';
      btn.style.background = 'linear-gradient(135deg,#2a6dd9,#1a5bbd)';
    } else {
      btn.disabled = true; btn.style.opacity = '0.35';
      btn.style.background = 'linear-gradient(135deg,#2a6dd9,#1a5bbd)';
    }
  }
}

// UI-only init — never touches e91State.step or e91State.running
function e91InitUI() {
  for (let i = 1; i <= 5; i++) {
    const dot = document.getElementById('e91d' + i);
    const sdot = document.getElementById('e91s' + i);
    if (dot) dot.className = 'tele-step-dot' + (i === 1 ? ' active' : '');
    if (sdot) sdot.className = 'sdot' + (i === 1 ? ' active' : '');
  }
  const safeSet = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  safeSet('e91StageTag', 'Waiting — click Step 1 to begin');
  safeSet('e91StepLbl', ' Click "1. Establish Channel" to start');
  safeSet('e91Status', 'Idle');
  e91UpdateStepBtns(1);
}

function e91SetStep(n) {
  if (n > 0) e91State.step = n;
  for (let i = 1; i <= 5; i++) {
    const dot = document.getElementById('e91d' + i);
    const sdot = document.getElementById('e91s' + i);
    if (dot) dot.className = 'tele-step-dot' + (i < n ? ' done' : i === n ? ' active' : '');
    if (sdot) sdot.className = 'sdot' + (i < n ? ' done' : i === n ? ' active' : '');
  }
  const stageLabels = ['', 'Stage 1: Classical Channel', 'Stage 2: Entanglement Distribution',
    'Stage 3: Measurement & Key Sifting', 'Stage 4: XOR Encrypt & Transmit', 'Stage 5: Decrypt & Reconstruct'];
  const nextPrompts = ['', ' Done — click "2. Generate Pairs"', ' Done — click "3. Measure"',
    ' Done — click "4. Encrypt & Send"', ' Done — click "5. Decrypt"', ''];
  const safeSet = (id, p, v) => { const e = document.getElementById(id); if (e) e[p] = v; };
  safeSet('e91StageTag', 'textContent', stageLabels[n] || stageLabels[1]);
  if (n >= 5) {
    safeSet('e91StepLbl', 'textContent', ' Protocol complete!');
    safeSet('e91Status', 'textContent', e91State.bellS > 2 ? 'Complete ' : 'Eve Detected ️');
    e91State.running = false;
    e91UpdateStepBtns(6);
  } else if (n > 0) {
    safeSet('e91StepLbl', 'textContent', nextPrompts[n]);
    e91UpdateStepBtns(n + 1);
  }
}

function e91Cleanup() {
  stopE91Anim();
  ['xorTimeout1', 'xorTimeout2', 'xorTimeout3', 'xorTimeout4', 'xorTimeout5'].forEach(k => {
    if (e91State[k]) { clearTimeout(e91State[k]); e91State[k] = null; }
  });
  if (e91State.gateInterval) { clearInterval(e91State.gateInterval); e91State.gateInterval = null; }
  if (e91State.xorPlayInterval) { clearInterval(e91State.xorPlayInterval); e91State.xorPlayInterval = null; }
  if (e91State._aiTimer) { clearTimeout(e91State._aiTimer); e91State._aiTimer = null; }
}

function e91FullReset() {
  e91Cleanup();
  e91State.msgBinary = '';
  e91State.encrypted = '';
  e91State.paddedKey = '';
  e91State.aliceKey = [];
  e91State.bobKey = [];
  e91State.photonPairs = [];
  e91State.collapseFlashes = [];
  e91State.classicalPhase = 0;
  e91State.classicalT = 0;
  e91State.transmitT = 0;
  e91State.step = 0;
  e91State.running = false;
  e91State.bitParticles = [];
  e91State.xorRunning = false;
  e91State.transmitRunning = false;
  e91State.allBitsReceived = false;
  e91State.decryptRunning = false;
  e91State.bobReceivedBits = [];
  e91State.encryptedBits = [];
  e91State.msgBitsArr = [];
  e91State.keyBitsArr = [];
  e91State.bobKeyBitsArr = [];
  e91State.currentBitIdx = 0;
  e91State.arrowOffset = 0;
  e91State.phaseTransBanner = 0;
  e91State.currentPopup = null;
  e91State._lastDecrypted = null;
  // Don't clear fileSizeBytes/fileTotalBits/fileSimBits — keep for panel
  // Clear canvas overlays
  const aib = document.getElementById('e91AiBox'); if (aib) aib.style.display = 'none';
  const calc = document.getElementById('e91XorCalc'); if (calc) calc.style.display = 'none';
  const prev = document.getElementById('e91FilePreview');
  if (prev) { prev.style.display = 'none'; prev.textContent = ''; }
  const fi = document.getElementById('e91FileInput');
  if (fi) fi.value = '';
  const fs = document.getElementById('e91FileStatus');
  if (fs) fs.textContent = 'No file selected';
  if (e91State.inputMode === 'text') {
    e91State.fileData = null;
    e91State.fileName = '';
  }
}

// ── Manual step controller ──────────────────────
function e91NextStep(step) {
  if (step !== e91State.step + 1) return;   // must go in order, no skipping

  if (step === 1) {
    // Save file data BEFORE reset (reset clears it for text mode)
    const savedFileData = e91State.fileData;
    const savedFileName = e91State.fileName;
    const savedFileType = e91State.fileType;
    const savedFileSizeBytes = e91State.fileSizeBytes;
    const savedFileTotalBits = e91State.fileTotalBits;
    const savedFileSimBits = e91State.fileSimBits;
    e91FullReset();
    e91State.running = true;

    if (e91State.inputMode === 'file' && savedFileData) {
      // Restore file data and use first 64 bits (8 bytes) for visualization
      e91State.fileData = savedFileData;
      e91State.fileName = savedFileName;
      e91State.fileType = savedFileType;
      e91State.fileSizeBytes = savedFileSizeBytes;
      e91State.fileTotalBits = savedFileTotalBits;
      e91State.fileSimBits = savedFileSimBits;
      // Cap to 64 bits for visual simulation
      e91State.msgBinary = savedFileData.slice(0, 64);
    } else {
      // Text mode
      const rawMsg = document.getElementById('e91MsgIn')?.value.trim() || 'HELLO';
      const msg = rawMsg.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8) || 'HELLO';
      e91State.msgBinary = [...msg].map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('');
      e91State.fileData = null; e91State.fileName = '';
    }
    if (!e91State.msgBinary) {
      e91State.msgBinary = [...'HELLO'].map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('');
    }
    document.getElementById('e91Status').textContent = 'Running…';
    // Resize canvas before starting anim (ensures correct dimensions)
    resizeE91Canvas();
    // Kick off classical channel animation phase 1
    e91State.classicalPhase = 1;
    // Always stop old loop first then restart fresh
    stopE91Anim();
    startE91Anim();
    e91SetStep(1);
    e91ShowAI(1);
    if (e91State.explainOn) {
      const lbl = e91State.inputMode === 'file' && e91State.fileName
        ? `<strong>Step 1:</strong> Establishing classical channel. Sending file "<em>${e91State.fileName.slice(0, 14)}</em>" parameters to Bob.`
        : `<strong>Step 1:</strong> Establishing classical channel. Alice sends message parameters to Bob.`;
      ss('e91StoryTxt', lbl);
    }
    // After a beat, mark channel established
    setTimeout(() => { e91State.classicalPhase = 2; }, 1200);
  }

  else if (step === 2) {
    if (e91State.step < 1) return;
    e91GenPairs();
    e91SetStep(2);
    e91ShowAI(2);
    if (e91State.explainOn)
      ss('e91StoryTxt', '<strong>Step 2:</strong> Central source emitting ️ entangled photon pairs — one flies to Alice, its partner to Bob. Watch them travel!');
  }

  else if (step === 3) {
    if (e91State.step < 2) return;
    e91MeasureAndSift();  // sets measured=true and collapseFlash on each pair internally
    e91SetStep(3);
    e91ShowAI(3);
    if (e91State.explainOn) {
      const numP = Math.min(e91State.photonPairs.length, 3);
      const matchCount = e91State.aliceKey.length;
      const aStr = e91State.aliceKey.join(' ') || '—';
      const bStr = e91State.bobKey.join(' ') || '—';
      ss('e91StoryTxt',
        `<strong>Step 3: All ${numP} pair${numP > 1 ? 's' : ''} measured!</strong> Photons collapsed into bits.<br>` +
        `${matchCount}/${numP} pairs had matching basis → kept as key.<br>` +
        `Alice key: <strong style="color:#fc8181">${aStr}</strong> &nbsp;` +
        `Bob key: <strong style="color:#68d391">${bStr}</strong><br>` +
        `<span style="font-size:8px;color:var(--tl)">Bell |S|=${e91State.bellS.toFixed(2)} ` +
        `${e91State.bellS > 2 ? ' Quantum secure' : '️ Eve detected!'} — Bright bits = key, dim bits = discarded.</span>`);
    }
  }

  else if (step === 4) {
    if (e91State.step < 3) return;
    e91SetStep(4);
    e91ShowAI(4);
    // Prepare bit arrays with cyclic key padding
    const rawMsg = e91State.msgBinary;
    const aKey = e91State.aliceKey;
    const bKey = e91State.bobKey;
    function buildPad(key, len) {
      if (!key.length) return Array(len).fill(0);
      const out = []; while (out.length < len) out.push(...key); return out.slice(0, len);
    }
    const aPad = buildPad(aKey, rawMsg.length);
    const bPad = buildPad(bKey, rawMsg.length);
    e91State.msgBitsArr = [...rawMsg].map(Number);
    e91State.keyBitsArr = aPad;
    e91State.bobKeyBitsArr = bPad;
    e91State.encryptedBits = e91State.msgBitsArr.map((b, i) => b ^ aPad[i]);
    e91State.paddedKey = aPad.join('');
    e91State.encrypted = e91State.encryptedBits.join('');
    e91State.bobReceivedBits = [];
    e91State.allBitsReceived = false;
    e91State.currentBitIdx = 0;
    e91State.bitParticles = [];

    // Show key cycle note if repeated
    const cycleN = aKey.length > 0 ? Math.ceil(rawMsg.length / aKey.length) : 1;
    const noteEl = document.getElementById('e91KeyCycleNote');
    if (noteEl) {
      if (e91State.inputMode === 'file') {
        noteEl.textContent = `Showing ${rawMsg.length} bits (visual simulation)`;
        noteEl.style.display = 'inline';
      } else if (cycleN > 1) {
        noteEl.textContent = `️ Demo Mode: key cycled for visualization`;
        noteEl.style.display = 'inline';
      } else {
        noteEl.style.display = 'none';
      }
    }

    // Show the whole table zone (side-by-side Alice + Bob)
    const zone = document.getElementById('e91TableZone');
    if (zone) zone.style.display = 'block';
    // Show file info panel if in file mode
    e91UpdateFileInfoPanel();

    // Alice grid — empty cells, filled column by column during animation
    e91BuildEmptyGrid('e91XorGrid', e91State.msgBitsArr, e91State.keyBitsArr, e91State.encryptedBits, false);
    const progEl = document.getElementById('e91EncProgress');
    if (progEl) { progEl.style.display = 'inline'; e91UpdateProgress('e91EncProgress', 0, e91State.encryptedBits.length); }

    // Bob grid — all empty now, received row fills as bits arrive
    const decRef = e91State.encryptedBits.map((b, i) => b ^ (bPad[i] || 0));
    e91BuildEmptyGrid('e91XorDecryptGrid', e91State.encryptedBits, bPad, decRef, true);
    const decProgEl = document.getElementById('e91DecProgress');
    if (decProgEl) { decProgEl.style.display = 'inline'; e91UpdateProgress('e91DecProgress', 0, e91State.encryptedBits.length); }

    // Hide result output until decryption done
    const outEl = document.getElementById('e91ReconstructOutput');
    if (outEl) outEl.style.display = 'none';

    e91State.xorRunning = false;
    if (e91State.explainOn)
      ss('e91StoryTxt', '<strong>Step 4:</strong> XOR encrypting bit by bit — ciphertext transmitted via <em>classical channel</em>. Quantum channel was used only for key generation. ');
    setTimeout(() => e91AnimateBitPipeline(0), 400);
  }

  else if (step === 5) {
    if (e91State.step < 4) return;
    if (!e91State.allBitsReceived) {
      // Not all bits have arrived yet — wait
      const waitCheck = setInterval(() => {
        if (e91State.allBitsReceived) {
          clearInterval(waitCheck);
          e91RunDecrypt();
        }
      }, 100);
      return;
    }
    e91RunDecrypt();
  }
}

// ── e91Run kept as no-op ─
function e91Run() { }

// ── Progress bar ─────────────────────────────
function e91UpdateProgress(elId, cur, total) {
  const el = document.getElementById(elId); if (!el) return;
  const filled = '■'.repeat(cur);
  const empty = '□'.repeat(total - cur);
  el.textContent = `[${filled}${empty}] Bit ${cur}/${total}`;
}

// ── Build empty XOR grid — sticky label + horizontally scrollable bits ──
function e91BuildEmptyGrid(containerId, msgBits, keyBits, encBits, isDecrypt) {
  const grid = document.getElementById(containerId); if (!grid) return;
  const N = Math.min(msgBits.length, 64);

  const mkRow = (lbl, cls, col) => {
    let cells = '';
    for (let i = 0; i < N; i++)
      cells += `<span id="${containerId}-${cls}-${i}" class="e91-bit-cell ${cls} empty" title="Bit ${i + 1}">—</span>`;
    return `<div class="e91-grid-row">
      <span class="e91-row-lbl" style="color:${col};">${lbl}</span>
      <div class="e91-bits-scroll" data-grid="${containerId}">${cells}</div>
    </div>`;
  };

  const arrowRow = () => {
    let arrows = '';
    for (let i = 0; i < N; i++)
      arrows += `<span id="${containerId}-arr-${i}" class="e91-arr-cell">↓</span>`;
    return `<div class="e91-grid-row">
      <span class="e91-row-lbl"></span>
      <div class="e91-bits-scroll e91-arrows-row" data-grid="${containerId}">${arrows}</div>
    </div>`;
  };

  if (!isDecrypt) {
    grid.innerHTML =
      mkRow('Message:', 'msg', '#63b3ed') +
      mkRow('⊕ Key:', 'key', '#68d391') +
      arrowRow() +
      mkRow('= Encrypted:', 'enc', '#b794f4');
  } else {
    grid.innerHTML =
      mkRow('Received (cipher):', 'recv', '#b794f4') +
      mkRow('⊕ Bob Key:', 'bkey', '#68d391') +
      arrowRow() +
      mkRow('= Decrypted:', 'dec', '#63b3ed');
  }

  // Sync horizontal scroll across all rows in this grid
  const scrollDivs = grid.querySelectorAll('.e91-bits-scroll');
  scrollDivs.forEach(div => {
    div.addEventListener('scroll', () => {
      const l = div.scrollLeft;
      scrollDivs.forEach(o => { if (o !== div) o.scrollLeft = l; });
    }, { passive: true });
  });
}

// ── Reveal a single cell + scroll it into view ─
function e91RevealCell(containerId, cls, idx, val) {
  const el = document.getElementById(`${containerId}-${cls}-${idx}`);
  if (!el) return;
  el.textContent = val;
  el.classList.remove('empty');
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 300);
  // Scroll the cell into view in its scroll container
  const scrollParent = el.parentElement;
  if (scrollParent && scrollParent.classList.contains('e91-bits-scroll')) {
    const elLeft = el.offsetLeft;
    const elRight = elLeft + el.offsetWidth;
    const containerWidth = scrollParent.clientWidth;
    const currentScroll = scrollParent.scrollLeft;
    if (elRight > currentScroll + containerWidth - 10) {
      scrollParent.scrollLeft = elRight - containerWidth + 20;
    }
  }
}

// ── Show/hide XOR popup — stored in state, drawn on canvas each frame ──
function e91ShowXorPopup(idx, mBit, kBit, eBit, isBob) {
  const flipped = (mBit ^ kBit) === 1;
  e91State.currentPopup = {
    line1: `Bit #${idx + 1}`,
    line2: `${mBit} ⊕ ${kBit} = ${eBit}`,
    line3: isBob ? (flipped ? 'Key=1 → FLIPPED BACK ' : 'Key=0 → unchanged ')
      : (flipped ? 'Key=1 → FLIPPED ' : 'Key=0 → unchanged '),
    isBob
  };
}
function e91HideXorPopup() {
  e91State.currentPopup = null;
}

// ── Spawn one bit particle ────────────────────
function e91SpawnOneBitParticle(bit, isGlitched) {
  const c = getE91Canvas(); if (!c) return null;
  const W = c.width, H = c.height;
  const aliceX = Math.floor(W * 0.15), bobX = Math.floor(W * 0.85);
  const cy = Math.floor(H * 0.5);
  const p = {
    bit, progress: 0, done: false,
    glitched: isGlitched,
    glitchTimer: 0,
    startX: aliceX + 28, targetX: bobX - 28,
    x: aliceX + 28, y: cy - 30,
    onArrival: null
  };
  e91State.bitParticles.push(p);
  return p;
}

// ── XOR timing constants (educational speed) ──
// E91_T returns timings scaled by animation speed (faster slider = shorter delays)
function E91_T_get(key) {
  const base = { msgHighlight: 300, keyHighlight: 300, popupVisible: 500, resultReveal: 300, pauseBeforeSend: 200, chainGap: 200 };
  const spd = Math.max(0.2, e91State.animSpeed || 0.8);
  return Math.round(base[key] / spd);
}
// Alias so pipeline code uses E91_T.key syntax
const E91_T = new Proxy({}, { get: (_, k) => E91_T_get(k) });

// ── Main bit-by-bit pipeline (Alice encrypts) ─
function e91AnimateBitPipeline(i) {
  if (currentExp !== 4) return;
  const total = e91State.encryptedBits.length;
  if (i >= total) { e91OnAllBitsSent(); return; }

  e91UpdateProgress('e91EncProgress', i, total);
  e91State.xorRunning = true;
  const gridId = 'e91XorGrid';
  const mBit = e91State.msgBitsArr[i];
  const kBit = e91State.keyBitsArr[i];
  const eBit = e91State.encryptedBits[i];

  // t=0ms: reveal message bit
  e91RevealCell(gridId, 'msg', i, mBit);
  e91State.xorTimeout1 = setTimeout(() => {
    // t=+300ms: reveal key bit + arrow
    e91RevealCell(gridId, 'key', i, kBit);
    const arr = document.getElementById(`${gridId}-arr-${i}`);
    if (arr) arr.style.color = (mBit !== eBit) ? 'var(--purple)' : 'rgba(160,160,160,0.45)';

    e91State.xorTimeout2 = setTimeout(() => {
      // t=+600ms: show XOR popup (visible 500ms)
      e91ShowXorPopup(i, mBit, kBit, eBit, false);

      e91State.xorTimeout3 = setTimeout(() => {
        // t=+1100ms: reveal encrypted bit, hide popup
        e91RevealCell(gridId, 'enc', i, eBit);
        e91HideXorPopup();
        e91State.xorRunning = false;

        e91State.xorTimeout4 = setTimeout(() => {
          // t=+1300ms: spawn particle
          e91State.transmitRunning = true;
          const glitch = e91State.eveOn && Math.random() < 0.25;
          const particle = e91SpawnOneBitParticle(eBit, glitch);
          if (!particle) { e91AnimateBitPipeline(i + 1); return; }

          // Gate: next XOR starts after particle ≥30% + breathing gap
          // Guard: only fires ONCE even if interval ticks multiple times
          let gateTriggered = false;
          e91State.gateInterval = setInterval(() => {
            if (particle.progress >= 0.30 && !gateTriggered) {
              gateTriggered = true;
              clearInterval(e91State.gateInterval);
              e91State.gateInterval = null;
              setTimeout(() => e91AnimateBitPipeline(i + 1), E91_T.chainGap);
            }
          }, 50);

          particle.onArrival = () => {
            e91State.transmitRunning = false;
            e91State.bobReceivedBits.push(eBit); // always append in order
            const bIdx = e91State.bobReceivedBits.length - 1;
            const recvEl = document.getElementById(`e91XorDecryptGrid-recv-${bIdx}`);
            if (recvEl) {
              recvEl.textContent = eBit;
              recvEl.classList.remove('empty');
              recvEl.classList.add('e91-cell-flash');
              setTimeout(() => recvEl.classList.remove('e91-cell-flash'), 350);
            }
            // STRICT: set flag only when ALL bits have landed
            if (e91State.bobReceivedBits.length === total) {
              e91State.allBitsReceived = true;
              console.log('[E91] All bits received. AlicePad:', e91State.keyBitsArr.join(''), 'BobPad:', e91State.bobKeyBitsArr.join(''), 'Match:', e91State.keyBitsArr.join('') === e91State.bobKeyBitsArr.join(''));
            }
          };
        }, E91_T.pauseBeforeSend);
      }, E91_T.popupVisible);
    }, E91_T.keyHighlight);
  }, E91_T.msgHighlight);
}

// ── All bits sent ────────────────────────────
function e91OnAllBitsSent() {
  e91UpdateProgress('e91EncProgress', e91State.encryptedBits.length, e91State.encryptedBits.length);
  const rb = document.getElementById('e91ReplayBtn');
  if (rb) rb.style.display = 'inline-block';
  // No fading — Alice table stays fully visible
  if (e91State.explainOn)
    document.getElementById('e91StoryTxt').innerHTML =
      '<strong> Ciphertext transmitted (classical channel)!</strong> Waiting for Bob to receive all bits…';
}

// ── Replay step 4 ────────────────────────────
function e91ReplayStep4() {
  if (e91State.step !== 4) return;
  if (e91State.decryptRunning) return;
  e91Cleanup();
  e91State.bitParticles = [];
  e91State.transmitRunning = false;
  e91State.xorRunning = false;
  e91State.allBitsReceived = false;
  e91State.bobReceivedBits = [];
  e91State.currentBitIdx = 0;
  e91State.currentPopup = null;
  const rb = document.getElementById('e91ReplayBtn');
  if (rb) rb.style.display = 'none';
  // Rebuild Alice grid fully
  e91BuildEmptyGrid('e91XorGrid', e91State.msgBitsArr, e91State.keyBitsArr, e91State.encryptedBits, false);
  // Rebuild Bob grid fully (replay = start from scratch including received row)
  const decRef = e91State.encryptedBits.map((b, i) => b ^ (e91State.bobKeyBitsArr[i] || 0));
  e91BuildEmptyGrid('e91XorDecryptGrid', e91State.encryptedBits, e91State.bobKeyBitsArr, decRef, true);
  const outEl = document.getElementById('e91ReconstructOutput');
  if (outEl) { outEl.style.display = 'none'; outEl.innerHTML = ''; }
  e91UpdateProgress('e91EncProgress', 0, e91State.encryptedBits.length);
  e91UpdateProgress('e91DecProgress', 0, e91State.encryptedBits.length);
  startE91Anim();
  setTimeout(() => e91AnimateBitPipeline(0), 400);
}

// ── Run Bob decryption ────────────────────────
function e91RunDecrypt() {
  e91SetStep(5);
  e91ShowAI(5);
  const rb = document.getElementById('e91ReplayBtn');
  if (rb) rb.style.display = 'none';

  const total = e91State.encryptedBits.length;
  const N = Math.min(total, 64);
  const gridId = 'e91XorDecryptGrid';

  // The received row was filled live by particle.onArrival — DO NOT wipe it.
  // Only reset bkey and dec rows to empty so animation fills them fresh.
  for (let i = 0; i < N; i++) {
    const bkeyEl = document.getElementById(`${gridId}-bkey-${i}`);
    if (bkeyEl) { bkeyEl.textContent = '—'; bkeyEl.classList.add('empty'); bkeyEl.classList.remove('active'); }
    const decEl = document.getElementById(`${gridId}-dec-${i}`);
    if (decEl) { decEl.textContent = '—'; decEl.classList.add('empty'); decEl.classList.remove('active'); }
    const arrEl = document.getElementById(`${gridId}-arr-${i}`);
    if (arrEl) arrEl.style.color = 'rgba(150,160,180,0.28)';
  }

  // Pre-fill received row from encryptedBits (safety for turbo mode where onArrival may not fire)
  for (let i = 0; i < N; i++) {
    const recvEl = document.getElementById(`${gridId}-recv-${i}`);
    if (recvEl && (recvEl.classList.contains('empty') || recvEl.textContent === '—')) {
      const bit = e91State.encryptedBits[i];
      if (bit !== undefined) {
        recvEl.textContent = bit;
        recvEl.classList.remove('empty');
        recvEl.classList.add('active');
        e91State.bobReceivedBits[i] = bit;
      }
    }
  }

  const decProgEl = document.getElementById('e91DecProgress');
  if (decProgEl) { decProgEl.style.display = 'inline'; e91UpdateProgress('e91DecProgress', 0, total); }
  e91State.decryptRunning = true;
  if (e91State.explainOn)
    ss('e91StoryTxt', '<strong>Step 5:</strong>  Decrypting — XOR each received bit with quantum key to recover message…');
  setTimeout(() => e91AnimateDecryptPipeline(0), 500);
}

// ── Bob decrypt pipeline ──────────────────────
function e91AnimateDecryptPipeline(i) {
  if (currentExp !== 4) return;
  const total = e91State.encryptedBits.length;
  if (i >= total) { e91OnDecryptDone(); return; }

  e91UpdateProgress('e91DecProgress', i, total);
  const gridId = 'e91XorDecryptGrid';
  // CORRECT: Bob decrypts encryptedBit XOR bobPad
  const eBit = e91State.encryptedBits[i];
  const kBit = e91State.bobKeyBitsArr[i] || 0;
  const dBit = eBit ^ kBit;

  // t=0: highlight received bit (ensure it's filled — safety fallback)
  const recvEl = document.getElementById(`${gridId}-recv-${i}`);
  if (recvEl) {
    // If cell wasn't filled by onArrival (turbo mode race), fill it now
    if (recvEl.classList.contains('empty') && e91State.bobReceivedBits[i] !== undefined) {
      recvEl.textContent = e91State.bobReceivedBits[i];
      recvEl.classList.remove('empty');
    }
    recvEl.classList.add('active');
  }

  e91State.xorTimeout1 = setTimeout(() => {
    // t=+300ms: reveal Bob's key bit
    e91RevealCell(gridId, 'bkey', i, kBit);
    const arr = document.getElementById(`${gridId}-arr-${i}`);
    if (arr) arr.style.color = (eBit !== dBit) ? 'var(--sky)' : 'rgba(160,160,160,0.45)';

    e91State.xorTimeout2 = setTimeout(() => {
      // t=+600ms: show popup (500ms visible)
      e91ShowXorPopup(i, eBit, kBit, dBit, true);

      e91State.xorTimeout3 = setTimeout(() => {
        // t=+1100ms: reveal decrypted bit, hide popup
        e91RevealCell(gridId, 'dec', i, dBit);
        if (recvEl) recvEl.classList.remove('active');
        e91HideXorPopup();

        e91State.xorTimeout4 = setTimeout(() => {
          e91AnimateDecryptPipeline(i + 1);
        }, E91_T.chainGap);
      }, E91_T.popupVisible);
    }, E91_T.keyHighlight);
  }, E91_T.msgHighlight);
}

// ── Decryption complete ───────────────────────
function e91OnDecryptDone() {
  // decryptRunning cleared AFTER _lastDecrypted is set (so canvas shows result correctly)
  e91UpdateProgress('e91DecProgress', e91State.encryptedBits.length, e91State.encryptedBits.length);

  // CORRECT FORMULA: encryptedBits XOR bobKeyBitsArr
  // This is what was animated column by column. Do NOT use msgBitsArr here.
  function binaryToText(bits) {
    let text = '';
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.slice(i, i + 8);
      if (byte.length === 8) text += String.fromCharCode(parseInt(byte.join(''), 2));
    }
    return text;
  }
  const decBits = e91State.encryptedBits.map((b, i) => b ^ (e91State.bobKeyBitsArr[i] || 0));
  const reconstructed = binaryToText(decBits).replace(/[^\x20-\x7E]/g, '?');

  // Store for canvas rendering (canvas cannot read DOM input reliably in file mode)
  e91State._lastDecrypted = reconstructed;
  e91State.decryptRunning = false;  // clear AFTER _lastDecrypted set so canvas shows correct result

  const success = e91State.bellS > 2;
  const orig = (document.getElementById('e91MsgIn')?.value || 'HELLO').toUpperCase();
  const match = reconstructed.slice(0, orig.length) === orig;

  // Debug — open browser console to verify pads match
  console.log('[E91] AlicePad[0..7]:', e91State.keyBitsArr.slice(0, 8).join(''),
    '| BobPad[0..7]:', e91State.bobKeyBitsArr.slice(0, 8).join(''),
    '| Enc[0..7]:', e91State.encryptedBits.slice(0, 8).join(''),
    '| Dec[0..7]:', decBits.slice(0, 8).join(''),
    '| Result:"' + reconstructed + '" | Match:', match);

  const outEl = document.getElementById('e91ReconstructOutput');
  if (outEl) {
    outEl.style.display = 'block';
    const msgLabel = (e91State.fileData && e91State.inputMode === 'file')
      ? ` File: <strong style="color:#63b3ed;">${e91State.fileName || 'uploaded file'}</strong> — ${success ? 'reconstructed' : 'potentially corrupted'}`
      : `<strong style="font-size:14px;letter-spacing:3px;color:${success ? '#68d391' : '#fc8181'};">"${reconstructed}"</strong>`;
    const statusLine = match
      ? `<span style="color:#68d391;font-size:8.5px;"> Perfect reconstruction!</span>`
      : success
        ? `<span style="color:#f6ad55;font-size:8.5px;">️ Minor noise from channel</span>`
        : `<span style="color:#fc8181;font-size:8.5px;">️ Eve corrupted the key!</span>`;
    const howItWorks = e91State.beginnerMode
      ? `<div style="margin-top:6px;padding:5px 8px;background:rgba(42,109,217,0.1);
          border-left:2px solid rgba(42,109,217,0.4);border-radius:4px;font-size:8px;color:rgba(160,200,255,0.8);">
           <strong>How it works:</strong> Bob XORed each encrypted bit with his quantum key copy.
          Since (A⊕K)⊕K = A, the original message is restored!</div>` : '';
    outEl.innerHTML = `
      <div style="font-size:10px;font-weight:700;color:rgba(200,230,200,0.9);margin-bottom:4px;">
        ${success ? '' : '️'} Message received:
      </div>
      <div style="margin-bottom:4px;">${msgLabel}</div>
      ${statusLine}
      ${howItWorks}`;
  }
  if (e91State.explainOn)
    ss('e91StoryTxt', success
      ? ` "<strong>${reconstructed}</strong>" securely received! Bell |S|=${e91State.bellS.toFixed(2)} confirms quantum security.`
      : `️ Eve detected! Bell |S|=${e91State.bellS.toFixed(2)} < 2. Decrypted: "${reconstructed}"`);
  lastExperiment = 'e91';
  lastResults.e91 = {
    message: e91State.inputMode === 'file' ? e91State.fileName : orig,
    inputMode: e91State.inputMode, reconstructed, success,
    bellS: e91State.bellS, eveOn: e91State.eveOn, noiseLevel: e91State.noiseLevel,
    keyLength: e91State.aliceKey.length, aliceKey: e91State.aliceKey.slice(0, 8).join(''),
    pairs: e91State.numPairs
  };
  pushHistory('e91', success ? `"${reconstructed}" decrypted ` : `Eve detected ️`, success ? '' : '️');
  renderResultsDash();
}

// ── Fullscreen removed — permanent side-by-side layout
function e91ToggleFullscreen() { }

function e91GenPairs() {
  const c = getE91Canvas(); if (!c) return;
  const W = c.width, H = c.height;
  const srcX = W / 2, srcY = H * 0.28;
  const aliceX = Math.floor(W * 0.15), bobX = Math.floor(W * 0.85);
  const cy = Math.floor(H * 0.5);
  // Enforce max 3 pairs — use same spacing as drawE91Scene (pairSpacing=60)
  const numPairs = Math.min(e91State.numPairs, 3);
  const pairSpacing = 55;
  const pairStartY = cy - 30 - (numPairs - 1) * pairSpacing / 2;
  e91State.photonPairs = [];

  // Randomize detector types for all 3 slots upfront (reused in step 3)
  const types = ['+', '×'];
  e91State.detectorTypes.alice = [0, 1, 2].map(() => types[Math.round(Math.random())]);
  e91State.detectorTypes.bob = [0, 1, 2].map(() => types[Math.round(Math.random())]);

  for (let i = 0; i < numPairs; i++) {
    const targetY = pairStartY + i * pairSpacing;
    e91State.photonPairs.push({
      srcX, srcY, ax: srcX, ay: srcY, bx: srcX, by: srcY,
      targetAx: aliceX + 40, targetAy: targetY,
      targetBx: bobX - 40, targetBy: targetY,
      // Small stagger so pairs emit sequentially but all complete fast
      progress: -i * 0.08, alpha: 0, measured: false,
      // per-pair identity (used after measurement in step 3+)
      aliceBit: Math.round(Math.random()), bobBit: 0,
      aliceMeasuredBit: undefined, bobMeasuredBit: undefined,
      aliceBasisType: e91State.detectorTypes.alice[i],
      bobBasisType: e91State.detectorTypes.bob[i],
      basisMatched: undefined,
      collapseFlash: 0, idx: i, phaseSync: 0
    });
  }
}

function e91MeasureAndSift() {
  e91State.aliceKey = []; e91State.bobKey = [];
  // Unified error rate: Eve 25% | noise proportional
  const errRate = e91State.eveOn ? 0.25 : e91State.noiseLevel / 200;
  const numPairs = Math.min(e91State.numPairs, 3);

  // Assign per-pair basis and measured bits — stored ON the pair object
  for (let i = 0; i < numPairs; i++) {
    const aType = e91State.detectorTypes.alice[i] || '+';
    const bType = e91State.detectorTypes.bob[i] || '×';
    const matched = aType === bType;
    const aliceBit = Math.round(Math.random());
    const bobBit = matched ? (Math.random() < errRate ? 1 - aliceBit : aliceBit) : Math.round(Math.random());

    // Store per-pair data directly on the pair object for rendering
    const pair = e91State.photonPairs[i];
    if (pair) {
      pair.aliceMeasuredBit = aliceBit;
      pair.bobMeasuredBit = bobBit;
      pair.aliceBasisType = aType;
      pair.bobBasisType = bType;
      pair.basisMatched = matched;
      pair.measured = true;
      pair.collapseFlash = 1.0;
    }

    // Only sifted (matched-basis) bits go into the key
    if (matched) {
      e91State.aliceKey.push(aliceBit);
      e91State.bobKey.push(bobBit);
    }
  }

  // Guarantee at least some key bits so encryption works
  if (e91State.aliceKey.length === 0) {
    e91State.aliceKey = Array.from({ length: Math.max(3, numPairs) }, () => Math.round(Math.random()));
    e91State.bobKey = [...e91State.aliceKey];
    // back-fill pair objects
    for (let i = 0; i < numPairs; i++) {
      const pair = e91State.photonPairs[i];
      if (pair) {
        pair.aliceMeasuredBit = e91State.aliceKey[i] || 0;
        pair.bobMeasuredBit = e91State.bobKey[i] || 0;
        pair.basisMatched = true;
      }
    }
  }

  e91State.bellS = e91State.eveOn
    ? (1.5 + Math.random() * 0.35 - e91State.noiseLevel * 0.01)
    : (2.65 + Math.random() * 0.18 - e91State.noiseLevel * 0.015);
  e91State.bellS = Math.max(0.5, Math.min(2.95, e91State.bellS));
  updateE91BellDisplay();
  if (e91State.explainOn) {
    const safeSet = (id, p, v) => { const e = document.getElementById(id); if (e) e[p] = v; };
    const keyStr = e91State.aliceKey.join(' ');
    const matchCount = e91State.aliceKey.length;
    safeSet('e91StoryTxt', 'innerHTML',
      ` Sifted key (${matchCount}/${numPairs} pairs matched): <strong style="color:#68d391">${keyStr}</strong>` +
      ` &nbsp;|&nbsp; Bell |S|=${e91State.bellS.toFixed(2)} ${e91State.bellS > 2 ? ' Secure' : '️ Eve!'}` +
      `<br><span style="font-size:8.5px;color:var(--tl)"> = basis matched → key bit &nbsp;  = basis mismatch → discarded for Bell test.</span>`);
  }
}

// ── Legacy e91Encrypt / e91Decrypt replaced by pipeline ──────────────────
// Step 4 now uses e91AnimateBitPipeline() and Step 5 uses e91RunDecrypt()
// These stubs prevent any stale call from throwing a reference error
function e91Encrypt() { }
function e91Decrypt() { }

// ── XOR Grid Renderer ─────────────────────────
function renderE91XorGrid(msg, key, enc, containerId, isDecrypt) {
  const grid = document.getElementById(containerId); if (!grid) return;
  const N = Math.min(msg.length, 24);
  const rowLbl = (txt, color) => `<span style="min-width:78px;font-size:9.5px;font-weight:700;
    color:${color};font-family:'Poppins',sans-serif;flex-shrink:0;">${txt}</span>`;

  const mkRow = (label, bits, cls, color) => {
    let row = `<div style="display:flex;align-items:center;gap:2px;margin-bottom:1px;">
      ${rowLbl(label, color)}`;
    for (let i = 0; i < N; i++) {
      row += `<div class="e91-bit ${cls}" data-idx="${i}" 
        data-msg="${msg[i]}" data-key="${key[i]}" data-enc="${enc[i]}"
        style="display:inline-flex;width:18px;height:18px;border-radius:3px;
        align-items:center;justify-content:center;font-weight:700;font-size:9.5px;
        cursor:pointer;font-family:'Courier New',monospace;transition:all .2s;
        background:${cls === 'msg' ? 'rgba(42,109,217,.1)' : cls === 'key' ? 'rgba(39,174,96,.1)' : 'rgba(142,68,173,.12)'};
        color:${cls === 'msg' ? 'var(--sky)' : cls === 'key' ? 'var(--mint)' : 'var(--purple)'};
        ${msg[i] !== enc[i] && cls === 'enc' ? 'border:1.5px solid var(--purple);' : ''}"
        >${bits[i] || '?'}</div>`;
    }
    row += '</div>';
    return row;
  };

  const arrowRow = () => {
    let row = `<div style="display:flex;align-items:center;gap:2px;">
      ${rowLbl('', '')}`;
    for (let i = 0; i < N; i++) {
      const flipped = msg[i] !== enc[i];
      row += `<div style="width:18px;text-align:center;font-size:7px;
        color:${flipped ? 'var(--purple)' : 'rgba(160,160,160,0.4)'};">↓</div>`;
    }
    row += '</div>';
    return row;
  };

  const msgLabel = isDecrypt ? 'Encrypted:' : 'Message:';
  const keyLabel = isDecrypt ? '⊕ Bob Key:' : '⊕ Key:';
  const encLabel = isDecrypt ? '= Original:' : '= Encrypted:';

  grid.innerHTML = mkRow(msgLabel, [...msg], 'msg', isDecrypt ? 'var(--purple)' : 'var(--sky)')
    + mkRow(keyLabel, [...key], 'key', 'var(--mint)')
    + arrowRow()
    + mkRow(encLabel, [...enc], 'enc', isDecrypt ? 'var(--sky)' : 'var(--purple)');

  // Hover tooltips
  grid.querySelectorAll('.e91-bit').forEach(cell => {
    cell.addEventListener('mouseenter', () => {
      const i = cell.dataset.idx, m = cell.dataset.msg, k = cell.dataset.key, e = cell.dataset.enc;
      const flipped = m !== e;
      const tip = document.getElementById('e91XorTooltip'); if (!tip) return;
      tip.style.display = 'block';
      if (isDecrypt) {
        tip.innerHTML = `<strong style="color:var(--purple)">Bit #${parseInt(i) + 1} — Decryption:</strong><br>
          Encrypted: <strong style="color:var(--purple)">${m}</strong>
          &nbsp;⊕&nbsp; Key: <strong style="color:var(--mint)">${k}</strong>
          &nbsp;=&nbsp; Original: <strong style="color:var(--sky)">${e}</strong><br>
          ${flipped ? ` Key bit=1 → <strong>bit flipped back</strong>: ${m}→${e}`
            : ` Key bit=0 → <strong>bit unchanged</strong>: ${m}→${e}`}<br>
          <span style="font-size:8px;color:var(--tl)">XOR is self-inverse: (A⊕K)⊕K = A</span>`;
      } else {
        tip.innerHTML = `<strong style="color:var(--sky)">Bit #${parseInt(i) + 1} — Encryption:</strong><br>
          Message: <strong style="color:var(--sky)">${m}</strong>
          &nbsp;⊕&nbsp; Key: <strong style="color:var(--mint)">${k}</strong>
          &nbsp;=&nbsp; Encrypted: <strong style="color:var(--purple)">${e}</strong><br>
          ${flipped ? ` Key bit=1 → <strong>bit FLIPPED</strong>: ${m}→${e}`
            : ` Key bit=0 → <strong>bit unchanged</strong>: ${m}→${e}`}<br>
          <span style="font-size:8px;color:var(--tl)">XOR rule: same→0, different→1</span>`;
      }
      cell.style.transform = 'scale(1.35)'; cell.style.zIndex = '20';
    });
    cell.addEventListener('mouseleave', () => {
      document.getElementById('e91XorTooltip').style.display = 'none';
      cell.style.transform = ''; cell.style.zIndex = '';
    });
  });
}

// ── RAF Loop ──────────────────────────────────
function getE91Canvas() { return document.getElementById('e91Canvas'); }
function getE91Ctx() { const c = getE91Canvas(); return c ? c.getContext('2d') : null; }

function resizeE91Canvas() {
  const c = getE91Canvas(); if (!c) return;
  const p = c.parentElement;
  c.width = p.offsetWidth || 700; c.height = p.offsetHeight || 300;
}

function startE91Anim() {
  if (currentExp !== 4) return;           // ISOLATION: never run outside E91 tab
  if (e91State.animFrame) cancelAnimationFrame(e91State.animFrame);
  e91State.animFrame = requestAnimationFrame(e91AnimLoop);
}
function stopE91Anim() {
  if (e91State.animFrame) { cancelAnimationFrame(e91State.animFrame); e91State.animFrame = null; }
}

function e91AnimLoop() {
  if (currentExp !== 4) {                 // ISOLATION: stop loop if user switched tabs
    stopE91Anim(); return;
  }
  e91State.dashOffset = (e91State.dashOffset + 0.4 * e91State.animSpeed) % 26;
  e91State.transmitT = (e91State.transmitT + 0.006 * e91State.animSpeed) % 1;
  e91State.classicalT = (e91State.classicalT + 0.008 * e91State.animSpeed) % 1;
  e91State.arrowOffset = (e91State.arrowOffset + 0.5) % 40;
  // Advance photon pair tweens — ONLY for un-measured photons
  e91State.photonPairs.forEach(p => {
    if (p.measured) return;
    p.progress = Math.min(1, p.progress + 0.013 * e91State.animSpeed);
    if (p.progress > 0) {
      const t = Math.max(0, p.progress);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const noise = e91State.noiseLevel / 100;
      const eveDist = e91State.eveOn && p.progress < 0.95 && p.progress > 0.1 ? 2.5 : 0;
      const noiseX = (Math.random() - 0.5) * (noise * 6 + eveDist);
      const noiseY = (Math.random() - 0.5) * (noise * 3 + eveDist * 0.5);
      p.ax = p.srcX + (p.targetAx - p.srcX) * ease + (p.progress < 0.97 ? noiseX : 0);
      p.ay = p.srcY + (p.targetAy - p.srcY) * ease + (p.progress < 0.97 ? noiseY : 0);
      p.bx = p.srcX + (p.targetBx - p.srcX) * ease + (p.progress < 0.97 ? -noiseX : 0);
      p.by = p.srcY + (p.targetBy - p.srcY) * ease + (p.progress < 0.97 ? noiseY : 0);
      p.alpha = Math.min(1, p.progress * 4);
      p.phaseSync = Math.sin(Date.now() * 0.008 + p.idx * 0.7) * 0.6;
      if (p.collapseFlash > 0) p.collapseFlash = Math.max(0, p.collapseFlash - 0.035);
    }
  });
  // Advance bit particles (step 4)
  e91State.bitParticles.forEach(p => {
    if (p.done) return;
    p.progress = Math.min(1, p.progress + 0.012 * Math.max(0.5, e91State.animSpeed));
    if (p.glitched) p.glitchTimer += 0.15;
    const ease = p.progress < 0.5 ? 2 * p.progress * p.progress : -1 + (4 - 2 * p.progress) * p.progress;
    p.x = p.startX + (p.targetX - p.startX) * ease;
    if (p.progress >= 1 && !p.done) {
      p.done = true;
      if (p.onArrival) p.onArrival();
    }
  });
  // Clean done particles
  // Clean only fully done particles (progress>=1 AND onArrival called)
  if (e91State.bitParticles.length > 60)
    e91State.bitParticles = e91State.bitParticles.filter(p => !(p.done && p.progress >= 1));
  drawE91Scene();
  e91State.animFrame = requestAnimationFrame(e91AnimLoop);
}

function drawE91Scene() {
  if (currentExp !== 4) return;           // ISOLATION guard
  const ctx = getE91Ctx(); if (!ctx) return;
  const c = getE91Canvas();
  const W = c.width, H = c.height;
  // ALIGNMENT FIX: use 0.15 / 0.85 as specified
  const aliceX = Math.floor(W * 0.15), bobX = Math.floor(W * 0.85);
  const cy = Math.floor(H * 0.5), srcX = W / 2, srcY = H * 0.28;
  // Vertical photon landing positions (3 rows)
  const yPositions = [cy - 50, cy, cy + 50];
  const step = e91State.step;

  // ── 1. Background ──────────────────────────────
  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.65);
  bg.addColorStop(0, '#0d1a2e'); bg.addColorStop(1, '#05101f');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // Subtle stars
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.arc((i * 131 + 9) % W, (i * 97 + 17) % (H * 0.9), 0.6, 0, Math.PI * 2); ctx.fill();
  }

  // ── 2. Characters (always visible) ────────────
  drawE91Alice(ctx, aliceX, cy + 110);
  drawE91Bob(ctx, bobX, cy + 110);

  // ── STEP 1: Classical Channel ──────────────────
  // Channel line shown ONLY during step 1 (phase animation). Hidden after step 1 complete.
  if (step <= 1) {
    const phase = e91State.classicalPhase;
    const lineAlpha = phase === 0 ? 0.3 : phase === 1 ? 0.8 : 0.45;
    // Single classical channel line
    ctx.save();
    ctx.setLineDash([8, 5]); ctx.lineDashOffset = -e91State.dashOffset * 0.5;
    ctx.strokeStyle = `rgba(99,179,237,${lineAlpha})`; ctx.lineWidth = phase === 1 ? 2.5 : 1.5;
    ctx.beginPath(); ctx.moveTo(aliceX + 28, cy); ctx.lineTo(bobX - 28, cy); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
    // Channel label — only shown while channel is being established (phase 0 or 1)
    if (phase < 2) {
      ctx.fillStyle = `rgba(99,179,237,${phase >= 1 ? 0.85 : 0.5})`; ctx.font = 'bold 11px Poppins,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Classical Channel (Protocol Setup)', (aliceX + bobX) / 2, cy - 28);
    }
    // Data packets traveling (phase 1 only — Alice tells Bob what she's sending)
    if (phase === 1) {
      const ct = e91State.classicalT;
      for (let i = 0; i < 3; i++) {
        const tt = (ct + i * 0.33) % 1;
        const px = aliceX + 28 + (bobX - aliceX - 56) * tt;
        ctx.globalAlpha = Math.sin(tt * Math.PI) * 0.9;
        ctx.fillStyle = '#63b3ed';
        ctx.beginPath(); ctx.roundRect(px - 7, cy - 7, 14, 9, 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 5.5px Poppins,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(e91State.inputMode === 'file' ? 'FILE' : 'MSG', px, cy - 1);
      }
      ctx.globalAlpha = 1;
    }
    // "Channel established" — replaces channel label when phase=2, shown at centre
    if (phase >= 2) {
      ctx.fillStyle = 'rgba(39,174,96,0.95)'; ctx.font = 'bold 13px Poppins,sans-serif';
      ctx.textAlign = 'center'; ctx.fillText(' Channel Established!', (aliceX + bobX) / 2, cy - 40);
      ctx.fillStyle = 'rgba(39,174,96,0.7)'; ctx.font = '10px Poppins,sans-serif';
      ctx.fillText('Alice told Bob what to expect', (aliceX + bobX) / 2, cy - 22);
    }
    // Input label near Alice — ONLY in step 1, always reads fresh value
    const inputLbl = (e91State.inputMode === 'file' && e91State.fileName)
      ? ' ' + e91State.fileName.slice(0, 14)
      : ' "' + (document.getElementById('e91MsgIn')?.value || 'HELLO').toUpperCase().slice(0, 8) + '"';
    ctx.save();
    ctx.fillStyle = 'rgba(5,16,31,0.88)';
    ctx.beginPath();
    const lx = aliceX, ly = cy + 128;
    ctx.roundRect(lx - 55, ly - 13, 110, 20, 4); ctx.fill();
    ctx.fillStyle = '#63b3ed'; ctx.font = 'bold 9px Poppins,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(inputLbl, lx, ly);
    ctx.restore();
  }

  // ── STEP 2: Entanglement Source + photons in flight ─
  // Source ONLY visible during step 2 (hidden after)
  if (step === 2) {
    const pulse = 0.75 + 0.25 * Math.sin(Date.now() * 0.005);
    const grd = ctx.createRadialGradient(srcX, srcY, 0, srcX, srcY, 28);
    grd.addColorStop(0, `rgba(183,148,244,${0.85 * pulse})`);
    grd.addColorStop(0.5, `rgba(107,70,193,${0.55 * pulse})`);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(srcX, srcY, 28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(183,148,244,${pulse * 0.9})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(srcX, srcY, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 11px Poppins,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⊕', srcX, srcY);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(183,148,244,0.6)'; ctx.font = '7.5px Poppins,sans-serif';
    ctx.fillText('Entanglement Source', srcX, srcY - 22);
    // Representative pairs label
    ctx.fillStyle = 'rgba(183,148,244,0.38)'; ctx.font = '6.5px Poppins,sans-serif';
    ctx.fillText('Showing representative entangled pairs', srcX, srcY + 32);
    ctx.fillStyle = 'rgba(183,148,244,0.25)'; ctx.font = '6px Poppins,sans-serif';
    ctx.fillText('Actual pairs processed in batch', srcX, srcY + 43);
  }

  // ── Photon pairs — ONLY if not measured (physics: collapse = invisible) ──
  const PAIR_FLIGHT_COLORS = ['#63b3ed', '#68d391', '#f6ad55'];
  e91State.photonPairs.forEach((p, i) => {
    if (p.alpha <= 0.01) return;
    if (p.measured) return;             // PHYSICS: photons disappear after measurement

    const pColor = PAIR_FLIGHT_COLORS[i] || '#b794f4';

    // Entanglement link — ONLY while in flight (not measured)
    if (p.progress > 0.45) {
      const linkA = (0.30 + 0.12 * (p.phaseSync || 0)) * p.alpha;
      ctx.strokeStyle = pColor + Math.round(Math.max(0, linkA) * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]); ctx.lineDashOffset = -e91State.dashOffset * 0.6;
      ctx.beginPath(); ctx.moveTo(p.ax, p.ay); ctx.lineTo(p.bx, p.by); ctx.stroke();
      ctx.setLineDash([]);
      // Pair label at midpoint while in flight
      if (p.progress > 0.5 && p.progress < 0.95) {
        const mx = (p.ax + p.bx) / 2, my = (p.ay + p.by) / 2;
        ctx.save();
        ctx.globalAlpha = p.alpha * 0.75;
        ctx.fillStyle = pColor; ctx.font = 'bold 7px Poppins,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`Pair ${i + 1}`, mx, my - 10);
        ctx.restore();
      }
    }
    // Draw photons using pair color
    drawE91PhotonColored(ctx, p.ax, p.ay, p.alpha, pColor);
    drawE91PhotonColored(ctx, p.bx, p.by, p.alpha, pColor);

    // Collapse flash
    if (p.collapseFlash > 0) {
      const cf = p.collapseFlash;
      ctx.save(); ctx.globalAlpha = cf * 0.7;
      ctx.strokeStyle = pColor; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(p.ax, p.ay, 20 * (1 - cf * 0.5), 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(p.bx, p.by, 20 * (1 - cf * 0.5), 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  });

  // ── STEP 3: Measured bits and pair labels (hidden during step 4+ to keep canvas clean) ──
  if (step === 3) {
    const numP = Math.min(e91State.photonPairs.length, 3);
    // Use fixed Y spacing that fits 3 pairs without overlap
    const pairSpacing = 55;
    const pairStartY = cy - 30 - (numP - 1) * pairSpacing / 2;
    const detAliceX = aliceX + 80, detBobX = bobX - 80;

    for (let i = 0; i < numP; i++) {
      const pair = e91State.photonPairs[i];
      const py = pairStartY + i * pairSpacing;

      // Per-pair stored basis & bits
      const aType = (pair && pair.aliceBasisType) || e91State.detectorTypes.alice[i] || '+';
      const bType = (pair && pair.bobBasisType) || e91State.detectorTypes.bob[i] || '×';
      const matched = pair ? !!pair.basisMatched : (aType === bType);
      const aliceBit = (pair && pair.aliceMeasuredBit !== undefined) ? pair.aliceMeasuredBit : (i % 2);
      const bobBit = (pair && pair.bobMeasuredBit !== undefined) ? pair.bobMeasuredBit : aliceBit;

      // Color-code each pair consistently
      const PAIR_HEX = ['#63b3ed', '#68d391', '#f6ad55'];
      const pHex = PAIR_HEX[i] || '#63b3ed';
      const pAlpha = matched ? 1.0 : 0.32;

      // Detectors (step 3 only)
      if (step === 3) {
        drawE91DetectorSmall(ctx, detAliceX, py, aType, matched);
        drawE91DetectorSmall(ctx, detBobX, py, bType, matched);
        if (matched) {
          ctx.save(); ctx.strokeStyle = pHex + '99'; ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath(); ctx.moveTo(detAliceX + 18, py); ctx.lineTo(detBobX - 18, py); ctx.stroke();
          ctx.setLineDash([]); ctx.restore();
        }
        ctx.fillStyle = matched ? pHex : 'rgba(180,180,180,0.5)';
        ctx.font = 'bold 8px Courier New,monospace'; ctx.textAlign = 'center';
        ctx.fillText(`A:${aliceBit}`, detAliceX, py - 18);
        ctx.fillText(`B:${bobBit}`, detBobX, py - 18);
        ctx.fillStyle = matched ? 'rgba(104,211,145,0.85)' : 'rgba(180,180,180,0.45)';
        ctx.font = 'bold 7.5px Poppins,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(aType, detAliceX, py + 30); ctx.fillText(bType, detBobX, py + 30);
      }

      // Pair label + match/drop badge
      ctx.save();
      ctx.globalAlpha = matched ? 0.9 : 0.45;
      ctx.fillStyle = pHex; ctx.font = 'bold 7px Poppins,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`Pair ${i + 1}`, W / 2, py - 22);
      ctx.fillStyle = matched ? 'rgba(104,211,145,0.9)' : 'rgba(200,200,200,0.5)';
      ctx.font = '7px Poppins,sans-serif';
      ctx.fillText(matched ? ' Used' : ' Discarded', W / 2, py + 7);
      ctx.restore();

      // Draw measured bit circles — use pHex directly as valid hex color
      // matched = full opacity pHex, unmatched = dim grey
      const bitColor = matched ? pHex : '#606880';
      // Alice bit
      ctx.save();
      ctx.globalAlpha = pAlpha;
      const agx = ctx.createRadialGradient(aliceX + 40, py, 0, aliceX + 40, py, 14);
      agx.addColorStop(0, 'rgba(255,255,255,0.22)'); agx.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = agx; ctx.beginPath(); ctx.arc(aliceX + 40, py, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = bitColor; ctx.beginPath(); ctx.arc(aliceX + 40, py, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Courier New,monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(aliceBit ? '1' : '0', aliceX + 40, py);
      ctx.textBaseline = 'alphabetic'; ctx.restore();
      // Bob bit
      ctx.save();
      ctx.globalAlpha = pAlpha;
      const bgx = ctx.createRadialGradient(bobX - 40, py, 0, bobX - 40, py, 14);
      bgx.addColorStop(0, 'rgba(255,255,255,0.22)'); bgx.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bgx; ctx.beginPath(); ctx.arc(bobX - 40, py, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = bitColor; ctx.beginPath(); ctx.arc(bobX - 40, py, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Courier New,monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(bobBit ? '1' : '0', bobX - 40, py);
      ctx.textBaseline = 'alphabetic'; ctx.restore();
    }

    // Column headers
    ctx.fillStyle = 'rgba(252,129,129,0.85)'; ctx.font = 'bold 8px Poppins,sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('Alice', aliceX + 40, pairStartY - 38);
    ctx.fillStyle = 'rgba(104,211,145,0.85)';
    ctx.fillText('Bob', bobX - 40, pairStartY - 38);

    // Quantum channel usage label
    ctx.fillStyle = 'rgba(183,148,244,0.75)'; ctx.font = 'bold 7.5px Poppins,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`️ Quantum Channel (Key Generation): ${numP} pair${numP > 1 ? 's' : ''}`, W / 2, pairStartY - 52);
    // ~50% explanation
    ctx.fillStyle = 'rgba(183,148,244,0.5)'; ctx.font = '6.5px Poppins,sans-serif';
    ctx.fillText('Only some measurements produce usable key bits (~50%)', W / 2, pairStartY - 38);

    // Sifted key strings at bottom
    if (e91State.aliceKey.length > 0) {
      const matchCount = e91State.aliceKey.length;
      const aStr = `Alice sifted key (${matchCount}/${numP}): ` + e91State.aliceKey.join(' ');
      const bStr = `Bob   sifted key (${matchCount}/${numP}): ` + e91State.bobKey.join(' ');
      ctx.fillStyle = 'rgba(252,129,129,0.9)'; ctx.font = 'bold 9px Courier New,monospace';
      ctx.textAlign = 'center'; ctx.fillText(aStr, (aliceX + bobX) / 2, H * 0.76);
      ctx.fillStyle = 'rgba(104,211,145,0.9)';
      ctx.fillText(bStr, (aliceX + bobX) / 2, H * 0.76 + 14);
      const km = JSON.stringify(e91State.aliceKey) === JSON.stringify(e91State.bobKey);
      ctx.fillStyle = km ? 'rgba(104,211,145,0.95)' : 'rgba(231,76,60,0.95)';
      ctx.font = 'bold 8px Poppins,sans-serif';
      ctx.fillText(km ? ' Keys Match!' : '️ Mismatch — Eve!', (aliceX + bobX) / 2, H * 0.76 + 28);
    }

    // Bell bar (top-right)
    {
      const bx2 = W - 125, by2 = 48, bw = 105, bh = 9;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.roundRect(bx2, by2, bw, bh, 3); ctx.fill();
      const barV = Math.min(1, e91State.bellS / 3) * bw;
      const bColor = e91State.bellS > 2 ? '#27ae60' : '#e74c3c';
      ctx.fillStyle = bColor; ctx.beginPath(); ctx.roundRect(bx2, by2, barV, bh, 3); ctx.fill();
      const thr = (2 / 3) * bw;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(bx2 + thr, by2 - 2); ctx.lineTo(bx2 + thr, by2 + bh + 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '6.5px Poppins,sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('|S|=2', bx2 + thr, by2 + bh + 10);
      ctx.fillStyle = e91State.bellS > 2 ? '#68d391' : '#fc8181';
      ctx.font = 'bold 7px Poppins,sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`Bell |S|=${e91State.bellS.toFixed(2)}`, bx2, by2 - 3);
    }
  }

  // ── STEP 4+: Always show sifted key summary + Bell bar (even when pairs are hidden) ──
  if (step >= 4 && step < 5) {
    const numP = Math.min(e91State.photonPairs.length, 3);
    if (e91State.aliceKey.length > 0) {
      const matchCount = e91State.aliceKey.length;
      const aStr = `Alice sifted key (${matchCount}/${numP}): ` + e91State.aliceKey.join(' ');
      const bStr = `Bob   sifted key (${matchCount}/${numP}): ` + e91State.bobKey.join(' ');
      ctx.fillStyle = 'rgba(252,129,129,0.9)'; ctx.font = 'bold 9px Courier New,monospace';
      ctx.textAlign = 'center'; ctx.fillText(aStr, (aliceX + bobX) / 2, H * 0.76);
      ctx.fillStyle = 'rgba(104,211,145,0.9)';
      ctx.fillText(bStr, (aliceX + bobX) / 2, H * 0.76 + 14);
      const km = JSON.stringify(e91State.aliceKey) === JSON.stringify(e91State.bobKey);
      ctx.fillStyle = km ? 'rgba(104,211,145,0.95)' : 'rgba(231,76,60,0.95)';
      ctx.font = 'bold 8px Poppins,sans-serif';
      ctx.fillText(km ? ' Keys Match!' : '️ Mismatch — Eve!', (aliceX + bobX) / 2, H * 0.76 + 28);
    }
    // Bell bar
    {
      const bx2 = W - 125, by2 = 48, bw = 105, bh = 9;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.roundRect(bx2, by2, bw, bh, 3); ctx.fill();
      const barV = Math.min(1, e91State.bellS / 3) * bw;
      const bColor = e91State.bellS > 2 ? '#27ae60' : '#e74c3c';
      ctx.fillStyle = bColor; ctx.beginPath(); ctx.roundRect(bx2, by2, barV, bh, 3); ctx.fill();
      const thr = (2 / 3) * bw;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(bx2 + thr, by2 - 2); ctx.lineTo(bx2 + thr, by2 + bh + 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '6.5px Poppins,sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('|S|=2', bx2 + thr, by2 + bh + 10);
      ctx.fillStyle = e91State.bellS > 2 ? '#68d391' : '#fc8181';
      ctx.font = 'bold 7px Poppins,sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`Bell |S|=${e91State.bellS.toFixed(2)}`, bx2, by2 - 3);
    }
  }

  // ── STEP 4: Arrow flow + bit travel animation ──
  if (step >= 4) {
    // Arrow flow along classical channel (background)
    if (e91State.transmitRunning || e91State.bitParticles.some(p => !p.done)) {
      ctx.save();
      ctx.fillStyle = 'rgba(99,179,237,0.4)';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const ao = e91State.arrowOffset;
      for (let ax2 = aliceX + 40 + ao; ax2 < bobX - 40; ax2 += 40) {
        ctx.fillText('›', ax2, cy - 30);
      }
      ctx.textBaseline = 'alphabetic';
      ctx.restore();
    }
    // Bit particles
    e91State.bitParticles.forEach(p => {
      if (p.done && p.progress >= 0.99) return;
      ctx.save();
      if (p.glitched) {
        const flicker = Math.sin(p.glitchTimer * 18) > 0;
        ctx.globalAlpha = 0.6 + Math.random() * 0.35;
        const jitter = (Math.random() - 0.5) * 4;
        const gx = ctx.createRadialGradient(p.x + jitter, p.y, 0, p.x + jitter, p.y, 10);
        gx.addColorStop(0, 'rgba(252,129,129,0.5)'); gx.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gx; ctx.beginPath(); ctx.arc(p.x + jitter, p.y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = flicker ? '#fc8181' : '#ffd700';
        ctx.beginPath(); ctx.arc(p.x + jitter, p.y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Courier New,monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.bit, p.x + jitter, p.y); ctx.textBaseline = 'alphabetic';
        ctx.globalAlpha = 0.8; ctx.fillStyle = 'rgba(252,129,129,0.85)';
        ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('', p.x + jitter, p.y - 14);
      } else {
        const alpha = Math.min(1, Math.sin(p.progress * Math.PI) * 1.5);
        ctx.globalAlpha = Math.max(0.2, alpha);
        const gx = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10);
        gx.addColorStop(0, 'rgba(255,215,0,0.55)'); gx.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gx; ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Courier New,monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.bit, p.x, p.y); ctx.textBaseline = 'alphabetic';
      }
      ctx.restore();
    });
    ctx.globalAlpha = 1;
    // Lock icon at Alice + Mailbox at Bob — only show during step 4 (hidden at step 5 to avoid double icon)
    if (step === 4) {
      ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('', aliceX, cy - 65);
      ctx.fillText('', bobX, cy - 65);
      // "Ciphertext transmitted" label — only while transmitting, not after decryption starts
      if (e91State.allBitsReceived) {
        ctx.fillStyle = 'rgba(255,215,0,0.85)'; ctx.font = 'bold 8px Poppins,sans-serif';
        ctx.textAlign = 'center'; ctx.fillText(' Ciphertext transmitted', aliceX, cy + 58);
        ctx.fillStyle = 'rgba(99,179,237,0.5)'; ctx.font = '6.5px Poppins,sans-serif';
        ctx.fillText('(classical channel)', aliceX, cy + 68);
      }
    }
    // Channel label — only visible while encryption/transmit is in progress (step 4 only)
    if (step === 4) {
      ctx.fillStyle = 'rgba(99,179,237,0.65)'; ctx.font = 'bold 8px Poppins,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(' Classical Channel — Encrypted Ciphertext', (aliceX + bobX) / 2, cy + 8);
    }

    // ── XOR popup drawn on canvas (one at a time, with bg box) ──
    if (e91State.currentPopup) {
      const pop = e91State.currentPopup;
      const px = pop.isBob ? bobX - 50 : aliceX + 50;
      const py = cy - 80;
      const bw = 140, bh = 54, bx2 = px - bw / 2, by2 = py - bh / 2;
      ctx.save();
      ctx.fillStyle = 'rgba(10,20,40,0.95)';
      ctx.beginPath(); ctx.roundRect(bx2, by2, bw, bh, 7); ctx.fill();
      ctx.strokeStyle = '#2a6dd9'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(bx2, by2, bw, bh, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(99,179,237,0.9)'; ctx.font = 'bold 9px Poppins,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(pop.line1, px, by2 + 11);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Courier New,monospace';
      ctx.fillText(pop.line2, px, py);
      ctx.fillStyle = pop.line3.includes('FLIPPED') ? '#f6ad55' : '#68d391';
      ctx.font = 'bold 8px Poppins,sans-serif';
      ctx.fillText(pop.line3, px, by2 + bh - 10);
      ctx.textBaseline = 'alphabetic'; ctx.restore();
    }
  }

  // ── STEP 5: Success output (ONLY at step 5) ────
  if (step >= 5) {
    const success = e91State.bellS > 2;
    const gp = 0.65 + 0.35 * Math.sin(Date.now() * 0.004);

    // Bob reception glow
    ctx.save();
    ctx.shadowBlur = success ? 28 * gp : 16;
    ctx.shadowColor = success ? '#27ae60' : '#e74c3c';
    ctx.strokeStyle = success ? `rgba(39,174,96,${0.6 * gp})` : `rgba(231,76,60,${0.55 * gp})`;
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bobX, cy - 60, 28, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // Determine what to show near Bob based on input mode
    const isFile = e91State.inputMode === 'file' && e91State.fileName;
    ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(success ? '' : '', bobX, cy - 80);

    if (success) {
      if (e91State.decryptRunning) {
        // Still decrypting — show progress indicator
        ctx.fillStyle = 'rgba(255,215,0,0.8)';
        ctx.font = 'bold 9px Poppins,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(' Decrypting…', bobX, cy - 60);
        ctx.fillStyle = 'rgba(104,211,145,0.5)'; ctx.font = '7px Poppins,sans-serif';
        ctx.fillText('Ciphertext ⊕ Key = Message', bobX, cy + 75);
      } else if (e91State._lastDecrypted) {
        // Decryption done — show result
        if (isFile) {
          ctx.fillStyle = 'rgba(104,211,145,0.95)';
          ctx.font = 'bold 10px Poppins,sans-serif'; ctx.textAlign = 'center';
          const shortName = e91State.fileName.length > 18
            ? e91State.fileName.slice(0, 15) + '…' : e91State.fileName;
          ctx.fillText(' ' + shortName, bobX, cy - 60);
          ctx.fillStyle = 'rgba(104,211,145,0.65)';
          ctx.font = '8px Poppins,sans-serif';
          ctx.fillText('received ', bobX, cy - 48);
        } else {
          ctx.fillStyle = 'rgba(104,211,145,0.95)';
          ctx.font = 'bold 12px Poppins,sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(`"${e91State._lastDecrypted}"`, bobX, cy - 60);
        }
      }
    } else {
      ctx.fillStyle = 'rgba(231,76,60,0.9)';
      ctx.font = 'bold 10px Poppins,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('?????', bobX, cy - 60);
    }

    // Top banner box — fixed near top of canvas to avoid overlap with Bob-side text
    const bx = W / 2, by = 26;
    ctx.save();
    ctx.fillStyle = success ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.13)';
    ctx.strokeStyle = success ? 'rgba(39,174,96,0.65)' : 'rgba(231,76,60,0.65)';
    ctx.lineWidth = 1.2;
    const bannerW = 340;
    ctx.beginPath(); ctx.roundRect(bx - bannerW / 2, by - 15, bannerW, 42, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = success ? '#68d391' : '#fc8181';
    ctx.font = 'bold 12px Poppins,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    let bannerLine1;
    if (!success) {
      bannerLine1 = '️ Eve Detected — Key Compromised';
    } else if (e91State.decryptRunning) {
      bannerLine1 = ' Decrypting message…';
    } else if (e91State._lastDecrypted) {
      if (isFile) {
        const shortFn = e91State.fileName.length > 22 ? e91State.fileName.slice(0, 20) + '…' : e91State.fileName;
        bannerLine1 = ` File Decrypted: "${shortFn}"`;
      } else {
        bannerLine1 = ` Message Decrypted: "${e91State._lastDecrypted}"`;
      }
    } else {
      bannerLine1 = ' Message Decrypted Securely';
    }
    ctx.fillText(bannerLine1, bx, by);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '7.5px Poppins,sans-serif';
    ctx.fillText(`Bell |S|=${e91State.bellS.toFixed(2)} — ${success ? 'Quantum secure' : 'Classical limit breached'}`, bx, by + 18);
    ctx.textBaseline = 'alphabetic'; ctx.restore();
  }

  // ── Eve indicator (step 2+ only, at source position) ──
  if (e91State.eveOn && step >= 2 && step <= 3) {
    const ex = srcX, ey = srcY - 45;
    const ep = 0.6 + 0.4 * Math.sin(Date.now() * 0.006);
    ctx.save(); ctx.shadowBlur = 14 * ep; ctx.shadowColor = 'rgba(231,76,60,0.7)';
    ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('️', ex, ey + 5);
    ctx.restore();
    ctx.fillStyle = `rgba(231,76,60,${0.65 * ep})`; ctx.font = 'bold 7px Poppins,sans-serif';
    ctx.textAlign = 'center'; ctx.fillText(' Eve!', ex, ey + 20);
  }
}


// ── Draw Helpers ──────────────────────────────
function drawE91Photon(ctx, x, y, measured, bit, alpha) {
  ctx.save(); ctx.globalAlpha = alpha || 1;
  const color = measured ? (bit ? '#ffd700' : '#4da6ff') : '#b794f4';
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 18);
  glow.addColorStop(0, 'rgba(183,148,244,0.35)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
  const sph = ctx.createRadialGradient(x - 4, y - 4, 1, x, y, 10);
  sph.addColorStop(0, 'rgba(255,255,255,0.6)'); sph.addColorStop(0.5, color); sph.addColorStop(1, 'rgba(183,148,244,0.5)');
  ctx.fillStyle = sph; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
  if (measured) {
    ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Poppins,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(bit ? '1' : '0', x, y); ctx.textBaseline = 'alphabetic';
  }
  ctx.restore();
}

// Color-coded photon for in-flight pairs (each pair has its own hue)
function drawE91PhotonColored(ctx, x, y, alpha, hexColor) {
  ctx.save(); ctx.globalAlpha = alpha || 1;
  // Parse hex to rgb for glow gradient (avoids string concat on rgba)
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 18);
  glow.addColorStop(0, `rgba(${r},${g},${b},0.32)`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
  const sph = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 10);
  sph.addColorStop(0, 'rgba(255,255,255,0.65)');
  sph.addColorStop(0.5, hexColor);
  sph.addColorStop(1, `rgba(${r},${g},${b},0.5)`);
  ctx.fillStyle = sph; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Draw a measured bit as a circle (replaces photon after collapse)
function drawE91Bit(ctx, x, y, bit, matched, pairColor) {
  ctx.save();
  // Use pair color if provided (for color-coded pairs), else matched=bright, unmatched=dim
  let fillColor, glowColor;
  if (pairColor) {
    fillColor = pairColor;
    glowColor = pairColor;
  } else {
    fillColor = matched ? (bit ? '#ffd700' : '#4da6ff') : 'rgba(150,150,150,0.55)';
    glowColor = matched ? (bit ? '#ffd700' : '#4da6ff') : 'rgba(150,150,150,0.3)';
  }
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 14);
  // Always use a valid rgba string for glow stop
  glow.addColorStop(0, matched || pairColor ? 'rgba(255,255,255,0.18)' : 'rgba(150,150,150,0.12)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = fillColor; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Courier New,monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(bit ? '1' : '0', x, y);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

function drawE91Detector(ctx, x, y, type, active) {
  const grd = ctx.createRadialGradient(x, y, 0, x, y, 22);
  grd.addColorStop(0, '#2a2a2a'); grd.addColorStop(1, '#111');
  ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = active ? '#68d391' : '#3a3a3a'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = active ? 'rgba(104,211,145,0.9)' : 'rgba(150,150,150,0.45)';
  ctx.lineWidth = 3; ctx.lineCap = 'round';
  if (type === '+') {
    ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x, y + 12); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 9, y + 9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 9, y - 9); ctx.lineTo(x - 9, y + 9); ctx.stroke();
  }
}

// Smaller detector (r=14) — used when 3 detectors must fit in vertical space
function drawE91DetectorSmall(ctx, x, y, type, active) {
  const r = 14;
  const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
  grd.addColorStop(0, '#2a2a2a'); grd.addColorStop(1, '#111');
  ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = active ? '#68d391' : '#444'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = active ? 'rgba(104,211,145,0.9)' : 'rgba(150,150,150,0.5)';
  ctx.lineWidth = 2; ctx.lineCap = 'round';
  const arm = r * 0.65;
  if (type === '+') {
    ctx.beginPath(); ctx.moveTo(x - arm, y); ctx.lineTo(x + arm, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - arm); ctx.lineTo(x, y + arm); ctx.stroke();
  } else {
    const d = arm * 0.75;
    ctx.beginPath(); ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d); ctx.stroke();
  }
}

function drawE91Alice(ctx, cx, cy) {
  ctx.fillStyle = '#f9c89b'; ctx.beginPath(); ctx.arc(cx, cy - 38, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2c2c2c'; ctx.beginPath(); ctx.ellipse(cx, cy - 46, 14, 8, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath(); ctx.moveTo(cx - 14, cy - 24); ctx.arcTo(cx + 14, cy - 24, cx + 14, cy + 2, 5);
  ctx.arcTo(cx + 14, cy + 2, cx - 14, cy + 2, 5); ctx.arcTo(cx - 14, cy + 2, cx - 14, cy - 24, 5);
  ctx.arcTo(cx - 14, cy - 24, cx + 14, cy - 24, 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2c3e50'; ctx.fillRect(cx - 12, cy + 2, 10, 20); ctx.fillRect(cx + 2, cy + 2, 10, 20);
  ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 14, cy - 18); ctx.lineTo(cx - 22, cy - 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 14, cy - 18); ctx.lineTo(cx + 22, cy - 2); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Poppins,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Alice', cx, cy + 32);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '8px Poppins,sans-serif';
  ctx.fillText('(Sender)', cx, cy + 43);
}

function drawE91Bob(ctx, cx, cy) {
  ctx.fillStyle = '#f9c89b'; ctx.beginPath(); ctx.arc(cx, cy - 38, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d4a843'; ctx.beginPath(); ctx.ellipse(cx, cy - 46, 14, 8, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2980b9';
  ctx.beginPath(); ctx.moveTo(cx - 14, cy - 24); ctx.arcTo(cx + 14, cy - 24, cx + 14, cy + 2, 5);
  ctx.arcTo(cx + 14, cy + 2, cx - 14, cy + 2, 5); ctx.arcTo(cx - 14, cy + 2, cx - 14, cy - 24, 5);
  ctx.arcTo(cx - 14, cy - 24, cx + 14, cy - 24, 5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 3, cy - 24); ctx.lineTo(cx - 3, cy + 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 3, cy - 24); ctx.lineTo(cx + 3, cy + 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 14, cy - 12); ctx.lineTo(cx + 14, cy - 12); ctx.stroke();
  ctx.fillStyle = '#2c3e50'; ctx.fillRect(cx - 12, cy + 2, 10, 20); ctx.fillRect(cx + 2, cy + 2, 10, 20);
  ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 14, cy - 18); ctx.lineTo(cx - 22, cy - 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 14, cy - 18); ctx.lineTo(cx + 22, cy - 32); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Poppins,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Bob', cx, cy + 32);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '8px Poppins,sans-serif';
  ctx.fillText('(Receiver)', cx, cy + 43);
}

// ── Reset ─────────────────────────────────────
function e91Reset() {
  e91Cleanup();
  if (e91XorPlayInt) { clearInterval(e91XorPlayInt); e91XorPlayInt = null; }
  e91FullReset();
  e91State.bellS = 2.83;
  e91State.dashOffset = 0;
  updateE91BellDisplay();
  const safeHide = (id) => { const e = document.getElementById(id); if (e) e.style.display = 'none'; };
  const safeText = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  const safeHTML = (id, v) => { const e = document.getElementById(id); if (e) e.innerHTML = v; };
  // Hide both zones
  // Hide whole table zone (shown only at step 4)
  const tz = document.getElementById('e91TableZone');
  if (tz) tz.style.display = 'none';
  const fip = document.getElementById('e91FileInfoPanel');
  if (fip) fip.style.display = 'none';
  safeHTML('e91XorGrid', '');
  safeHTML('e91XorDecryptGrid', '');
  safeHTML('e91ReconstructOutput', '');
  const outEl2 = document.getElementById('e91ReconstructOutput');
  if (outEl2) outEl2.style.display = 'none';
  safeHide('e91EncProgress');
  safeHide('e91DecProgress');
  safeHide('e91ReplayBtn');
  safeHide('e91KeyCycleNote');
  safeText('e91Status', 'Idle');
  safeHTML('e91StoryTxt', 'E91 uses entangled photon pairs and Bell inequality to establish a provably secure key. <strong>Click Step 1</strong> to begin.');
  // Close fullscreen if open
  if (e91State.fullscreen) e91ToggleFullscreen();
  e91InitUI();
  setTimeout(() => { resizeE91Canvas(); startE91Anim(); }, 50);
}

// ── Init on window load ───────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('e91Canvas')) {
    setTimeout(() => { resizeE91Canvas(); updateE91BellDisplay(); e91InitUI(); }, 200);
  }
});

// ══════════════════════════════════════════════
// RESULTS DASHBOARD — Global State & Renderer
// ══════════════════════════════════════════════
let lastExperiment = null;
let lastResults = {};
let resultHistory = [];

function pushHistory(type, summary, icon) {
  resultHistory.unshift({ type, summary, icon });
  if (resultHistory.length > 8) resultHistory.pop();
}

function renderResultsDash() {
  const dash = document.getElementById('rdash');
  if (!dash) return;
  if (!lastExperiment) {
    dash.innerHTML = `<div class="rdash-empty"><div class="rdash-empty-icon"></div><div class="rdash-empty-title">No Results Yet</div><div class="rdash-empty-sub">Run any experiment to see your results here.<br>Superposition, Teleportation, BB84, Entanglement or E91.</div></div>`;
    return;
  }
  const expLabels = { bb84: ' BB84 Key Exchange', teleport: ' Quantum Teleportation', superposition: ' Quantum Superposition', entanglement: ' Entanglement', e91: '️ E91 Protocol' };
  let html = `<div class="rdash-hdr"><div class="rdash-title"> Simulation Results</div><span class="rdash-exp-badge ${lastExperiment}">${expLabels[lastExperiment] || lastExperiment}</span></div>`;
  if (lastExperiment === 'bb84') html += renderBB84Results();
  else if (lastExperiment === 'teleport') html += renderTeleportResults();
  else if (lastExperiment === 'superposition') html += renderSuperResults();
  else if (lastExperiment === 'entanglement') html += renderEntResults();
  else if (lastExperiment === 'e91') html += renderE91Results();
  if (resultHistory.length > 0) {
    html += `<div class="rdash-sec"> Recent Runs</div><div class="rdash-history">`;
    resultHistory.forEach(h => {
      html += `<div class="rdash-hist-item"><span class="rdash-hist-badge ${h.type}">${expLabels[h.type] || h.type}</span><span class="rdash-hist-summary">${h.summary}</span><span class="rdash-hist-icon">${h.icon}</span></div>`;
    });
    html += `</div>`;
  }
  dash.innerHTML = html;
  if (lastExperiment === 'bb84') initRDashCharts();
}

function renderBB84Results() {
  const r = lastResults.bb84 || {};
  const qber = r.qber || 0;
  return `<div class="rdash-metrics">
    <div class="rdash-metric info"><div class="rdash-metric-icon"></div><div class="rdash-metric-val">${r.photons || 0}</div><div class="rdash-metric-lbl">Photons Sent</div></div>
    <div class="rdash-metric success"><div class="rdash-metric-icon"></div><div class="rdash-metric-val">${r.keyBits || 0}</div><div class="rdash-metric-lbl">Key Bits</div></div>
    <div class="rdash-metric ${qber > 11 ? 'fail' : qber > 5 ? 'warn' : 'success'}"><div class="rdash-metric-icon"></div><div class="rdash-metric-val">${qber}%</div><div class="rdash-metric-lbl">QBER</div></div>
  </div>
  <div class="rdash-rows">
    <div class="rdash-row"><span class="rdash-row-lbl">Channel Security</span><span class="rdash-row-val ${r.secure ? 'ok' : 'bad'}">${r.secure ? ' SECURE' : '️ COMPROMISED'}</span></div>
    <div class="rdash-row"><span class="rdash-row-lbl">Message Sent</span><span class="rdash-row-val info">${r.message || '—'}</span></div>
    <div class="rdash-row"><span class="rdash-row-lbl">Message Decoded</span><span class="rdash-row-val ${r.decoded && r.decoded.replace(/\?/g, '') === r.message ? 'ok' : 'warn'}">${r.decoded || '—'}</span></div>
    <div class="rdash-row"><span class="rdash-row-lbl">Eve Interference</span><span class="rdash-row-val ${r.eveLevel > 0 ? 'bad' : 'ok'}">${r.eveLevel > 0 ? '️ ' + r.eveLevel + '%' : ' None'}</span></div>
  </div>
  <div class="rdash-sec"> QBER Over Time</div>
  <div style="background:#fff;border:1px solid var(--bd);border-radius:8px;padding:10px;"><div style="height:88px;position:relative;"><canvas id="rDashQberChart"></canvas></div></div>`;
}

function renderTeleportResults() {
  const r = lastResults.teleport || {};
  const ok = r.success; const ea = r.eveMode === 'active';
  const bellNames = { 'phi+': '|Φ⁺⟩', 'phi-': '|Φ⁻⟩', 'psi+': '|Ψ⁺⟩', 'psi-': '|Ψ⁻⟩' };
  return `<div class="rdash-metrics">
    <div class="rdash-metric ${ok ? 'success' : 'fail'}"><div class="rdash-metric-icon">${ok ? '' : ''}</div><div class="rdash-metric-val">${ok ? 'YES' : 'NO'}</div><div class="rdash-metric-lbl">Reconstructed</div></div>
    <div class="rdash-metric info"><div class="rdash-metric-icon"></div><div class="rdash-metric-val">${r.result || '—'}</div><div class="rdash-metric-lbl">Bell Result</div></div>
    <div class="rdash-metric ${r.fidelity >= 80 ? 'success' : r.fidelity >= 50 ? 'warn' : 'fail'}"><div class="rdash-metric-icon"></div><div class="rdash-metric-val">${r.fidelity != null ? r.fidelity + '%' : '—'}</div><div class="rdash-metric-lbl">Fidelity</div></div>
  </div>
  <div class="rdash-rows">
    <div class="rdash-row"><span class="rdash-row-lbl">Measurement Result</span><span class="rdash-row-val purple">${r.result || '—'}</span></div>
    <div class="rdash-row"><span class="rdash-row-lbl">Correction Gate</span><span class="rdash-row-val info">${r.gate || '—'}</span></div>
    <div class="rdash-row"><span class="rdash-row-lbl">State Transferred</span><span class="rdash-row-val ${ok ? 'ok' : 'bad'}">${ok ? ' |ψ⟩ transferred' : ' State corrupted'}</span></div>
    <div class="rdash-row"><span class="rdash-row-lbl">Noise Level</span><span class="rdash-row-val ${(r.noise || 0) > 50 ? 'warn' : 'ok'}">${r.noise != null ? r.noise + '%' : '0%'}</span></div>
    <div class="rdash-row"><span class="rdash-row-lbl">Eve Attack</span><span class="rdash-row-val ${ea ? 'bad' : 'ok'}">${ea ? '️ Active — bits modified' : ' None'}</span></div>
  </div>`;
}

function renderSuperResults() {
  const r = lastResults.superposition || {};
  const p0 = r.p0 != null ? r.p0 : 100, p1 = 100 - p0;
  return `<div class="rdash-metrics">
    <div class="rdash-metric info"><div class="rdash-metric-icon"></div><div class="rdash-metric-val">${r.gates || 0}</div><div class="rdash-metric-lbl">Gates Applied</div></div>
    <div class="rdash-metric purple"><div class="rdash-metric-icon"></div><div class="rdash-metric-val">${r.phase != null ? r.phase + '°' : '—'}</div><div class="rdash-metric-lbl">Phase φ</div></div>
    <div class="rdash-metric ${r.measured != null ? 'success' : 'warn'}"><div class="rdash-metric-icon"></div><div class="rdash-metric-val">${r.measured != null ? '|' + r.measured + '⟩' : '—'}</div><div class="rdash-metric-lbl">Measured</div></div>
  </div>
  <div class="rdash-sec"> Probabilities</div>
  <div style="background:#fff;border:1px solid var(--bd);border-radius:8px;padding:12px;">
    <div class="rdash-prob-row"><div class="rdash-prob-lbl">|0⟩</div><div class="rdash-prob-bar-bg"><div class="rdash-prob-bar-fg p0" style="width:${p0}%"></div></div><div class="rdash-prob-pct">${p0.toFixed(1)}%</div></div>
    <div class="rdash-prob-row"><div class="rdash-prob-lbl">|1⟩</div><div class="rdash-prob-bar-bg"><div class="rdash-prob-bar-fg p1" style="width:${p1}%"></div></div><div class="rdash-prob-pct">${p1.toFixed(1)}%</div></div>
  </div>
  <div class="rdash-rows">
    <div class="rdash-row"><span class="rdash-row-lbl">Circuit</span><span class="rdash-row-val info">${r.circuit || '—'}</span></div>
    <div class="rdash-row"><span class="rdash-row-lbl">State Vector</span><span class="rdash-row-val purple">${r.stateVec || '—'}</span></div>
    <div class="rdash-row"><span class="rdash-row-lbl">Measurements Run</span><span class="rdash-row-val">${r.measurements || 0}</span></div>
  </div>`;
}

function renderEntResults() {
  const r = lastResults.entanglement || {};
  const corr = r.resultA === r.resultB;
  const bn = { 'phi+': '|Φ⁺⟩', 'phi-': '|Φ⁻⟩', 'psi+': '|Ψ⁺⟩', 'psi-': '|Ψ⁻⟩' };
  const beq = { 'phi+': '(|00⟩+|11⟩)/√2', 'phi-': '(|00⟩−|11⟩)/√2', 'psi+': '(|01⟩+|10⟩)/√2', 'psi-': '(|01⟩−|10⟩)/√2' };
  const ct = { 'phi+': 'Same (correlated)', 'phi-': 'Same + phase flip', 'psi+': 'Opposite (anti-correlated)', 'psi-': 'Opposite (singlet)' };
  return `<div class="rdash-metrics">
    <div class="rdash-metric purple"><div class="rdash-metric-icon"></div><div class="rdash-metric-val">${bn[r.bell] || '—'}</div><div class="rdash-metric-lbl">Bell State</div></div>
    <div class="rdash-metric info"><div class="rdash-metric-icon">️</div><div class="rdash-metric-val">${r.resultA != null ? '|' + r.resultA + '⟩' : '—'}</div><div class="rdash-metric-lbl">Qubit A</div></div>
    <div class="rdash-metric ${corr ? 'success' : 'warn'}"><div class="rdash-metric-icon">️</div><div class="rdash-metric-val">${r.resultB != null ? '|' + r.resultB + '⟩' : '—'}</div><div class="rdash-metric-lbl">Qubit B</div></div>
  </div>
  <div class="rdash-rows">
    <div class="rdash-row"><span class="rdash-row-lbl">Bell State Formula</span><span class="rdash-row-val purple">${beq[r.bell] || '—'}</span></div>
    <div class="rdash-row"><span class="rdash-row-lbl">Correlation Type</span><span class="rdash-row-val ${corr ? 'ok' : 'info'}">${ct[r.bell] || '—'}</span></div>
    <div class="rdash-row"><span class="rdash-row-lbl">Outcome</span><span class="rdash-row-val">A=${r.resultA != null ? r.resultA : '?'}, B=${r.resultB != null ? r.resultB : '?'}</span></div>
    <div class="rdash-row"><span class="rdash-row-lbl">Instant Correlation</span><span class="rdash-row-val ok"> Observed — no classical signal</span></div>
  </div>`;
}

function renderE91Results() {
  const r = lastResults.e91 || {};
  const secure = r.bellS > 2;
  const bellBar = Math.min(100, Math.round((r.bellS || 0) / 2.83 * 100));
  return `<div class="rdash-metrics">
    <div class="rdash-metric ${r.success ? 'success' : 'fail'}">
      <div class="rdash-metric-icon">${r.success ? '' : '️'}</div>
      <div class="rdash-metric-val">${r.success ? 'OK' : 'FAIL'}</div>
      <div class="rdash-metric-lbl">Decryption</div>
    </div>
    <div class="rdash-metric ${secure ? 'success' : 'fail'}">
      <div class="rdash-metric-icon"></div>
      <div class="rdash-metric-val">${(r.bellS || 0).toFixed(2)}</div>
      <div class="rdash-metric-lbl">Bell |S|</div>
    </div>
    <div class="rdash-metric info">
      <div class="rdash-metric-icon"></div>
      <div class="rdash-metric-val">${r.keyLength || 0}</div>
      <div class="rdash-metric-lbl">Key Bits</div>
    </div>
  </div>
  <div class="rdash-sec"> Bell Inequality Test</div>
  <div style="background:#fff;border:1px solid var(--bd);border-radius:8px;padding:10px 12px;">
    <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--tl);margin-bottom:4px;">
      <span>Classical limit: |S| = 2</span><span style="font-weight:700;color:${secure ? 'var(--mint)' : 'var(--coral)'}">|S| = ${(r.bellS || 0).toFixed(2)}</span>
    </div>
    <div style="height:8px;background:#e8eef8;border-radius:4px;overflow:hidden;margin-bottom:5px;">
      <div style="height:100%;width:${bellBar}%;background:${secure ? 'var(--mint)' : 'var(--coral)'};border-radius:4px;transition:width .6s;"></div>
    </div>
    <div style="font-size:9px;font-weight:700;color:${secure ? 'var(--mint)' : 'var(--coral)'};">
      ${secure ? ' Quantum entanglement confirmed — channel secure' : '️ Classical limit — Eve likely intercepted'}
    </div>
  </div>
  <div class="rdash-rows" style="margin-top:8px;">
    <div class="rdash-row"><span class="rdash-row-lbl">Input Mode</span><span class="rdash-row-val info">${r.inputMode === 'file' ? ' File' : ' Text'}</span></div>
    <div class="rdash-row"><span class="rdash-row-lbl">Message / File</span><span class="rdash-row-val info">${r.message || '—'}</span></div>
    <div class="rdash-row"><span class="rdash-row-lbl">Decrypted Result</span><span class="rdash-row-val ${r.success ? 'ok' : 'bad'}">${r.reconstructed || '—'}</span></div>
    <div class="rdash-row"><span class="rdash-row-lbl">Sifted Key</span><span class="rdash-row-val purple" style="font-family:monospace;letter-spacing:2px;">${r.aliceKey || '—'}</span></div>
    <div class="rdash-row"><span class="rdash-row-lbl">Entangled Pairs</span><span class="rdash-row-val">${r.pairs || 3}</span></div>
    <div class="rdash-row"><span class="rdash-row-lbl">Eve Eavesdropper</span><span class="rdash-row-val ${r.eveOn ? 'bad' : 'ok'}">${r.eveOn ? '️ Active — key compromised' : ' None detected'}</span></div>
    <div class="rdash-row"><span class="rdash-row-lbl">Channel Noise</span><span class="rdash-row-val ${(r.noiseLevel || 0) > 20 ? 'warn' : 'ok'}">${r.noiseLevel || 0}%</span></div>
  </div>`;
}

let rDashQberChartInst = null;
function initRDashCharts() {
  setTimeout(() => {
    const el = document.getElementById('rDashQberChart');
    if (!el || !window.Chart) return;
    if (rDashQberChartInst) { rDashQberChartInst.destroy(); rDashQberChartInst = null; }
    const hist = (lastResults.bb84 || {}).qberHistory || [];
    rDashQberChartInst = new Chart(el, {
      type: 'line', data: { labels: hist.map((_, i) => i + 1), datasets: [{ label: 'QBER %', data: hist, borderColor: '#e74c3c', backgroundColor: 'rgba(231,76,60,.07)', tension: .4, pointRadius: 2, fill: true }] },
      options: { responsive: true, maintainAspectRatio: false, animation: { duration: 0 }, plugins: { legend: { labels: { color: '#3a5080', font: { family: 'Poppins', size: 8 }, boxWidth: 8 } } }, scales: { x: { ticks: { color: '#6080a0', font: { size: 7 } }, grid: { color: 'rgba(0,0,0,.05)' } }, y: { ticks: { color: '#6080a0', font: { size: 7 } }, grid: { color: 'rgba(0,0,0,.05)' } } } }
    });
  }, 80);
}

document.querySelectorAll('.tab').forEach(t => {
  if (t.dataset && t.dataset.panel === 'p-results') t.addEventListener('click', () => setTimeout(renderResultsDash, 50));
});

// ══════════════════════════════════════════════

let entBellState = 'phi+'; // current bell state
let entMeasured = false;
let entLineOffset = 0;
let entParticles = [];
let entLineAnim = null;
let entParticleAnim = null;
let entMeasureInProgress = false;

// ── Particle background ────────────────────
function initEntParticles() {
  const c = document.getElementById('entParticleCanvas');
  if (!c) return;
  const parent = c.parentElement;
  c.width = parent.offsetWidth || 800;
  c.height = parent.offsetHeight || 500;
  entParticles = [];
  for (let i = 0; i < 55; i++) {
    entParticles.push({
      x: Math.random() * c.width, y: Math.random() * c.height,
      r: 0.6 + Math.random() * 1.4, vx: (Math.random() - .5) * .25,
      vy: (Math.random() - .5) * .25, alpha: 0.1 + Math.random() * 0.25
    });
  }
  animEntParticles();
}

function animEntParticles() {
  const c = document.getElementById('entParticleCanvas');
  if (!c || !document.getElementById('p-ent').classList.contains('active')) return;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  entParticles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = c.width; if (p.x > c.width) p.x = 0;
    if (p.y < 0) p.y = c.height; if (p.y > c.height) p.y = 0;
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = '#63b3ed';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
  entParticleAnim = requestAnimationFrame(animEntParticles);
}

// ── Entanglement line animation ───────────
function startEntLineAnim() {
  if (entLineAnim) cancelAnimationFrame(entLineAnim);
  animEntLine();
}

function animEntLine() {
  const c = document.getElementById('entLineCanvas');
  if (!c || !document.getElementById('p-ent').classList.contains('active')) return;
  c.width = c.offsetWidth || c.clientWidth || 300;
  c.height = c.offsetHeight || c.clientHeight || 72;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  const cx = W / 2, cy = H / 2;
  ctx.clearRect(0, 0, W, H);

  entLineOffset = (entLineOffset + 0.55) % 26;

  if (!entMeasured) {
    // Superposition — cyan dashed marching ants with wave
    const amp = 6, freq = 0.018;
    ctx.save();
    ctx.setLineDash([10, 6]);
    ctx.lineDashOffset = -entLineOffset;
    ctx.strokeStyle = '#63b3ed';
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.75;
    ctx.shadowColor = '#63b3ed';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 3) {
      const y = cy + Math.sin((x + entLineOffset * 3) * freq * Math.PI * 2) * amp;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Energy flow dots along line
    for (let d = 0; d < 3; d++) {
      const t = ((entLineOffset / 26) + d / 3) % 1;
      const fx = t * W;
      const fy = cy + Math.sin((fx + entLineOffset * 3) * freq * Math.PI * 2) * amp;
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#63b3ed'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(fx, fy, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;

  } else {
    // Measured — solid colored line, no wave
    const col = getEntColor(entBellState);
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  entLineAnim = requestAnimationFrame(animEntLine);
}

function getEntColor(bell) {
  return {
    'phi+': '#68d391', 'phi-': '#b794f4', 'psi+': '#63b3ed', 'psi-': '#fc8181'
  }[bell] || '#63b3ed';
}

// ── Measure interaction ───────────────────
function entMeasure() {
  if (entMeasureInProgress) return;
  entMeasureInProgress = true;

  const resultA = Math.random() > 0.5 ? 1 : 0;
  // Bell state determines B's result
  let resultB;
  if (entBellState === 'phi+') resultB = resultA;         // same
  else if (entBellState === 'phi-') resultB = resultA;    // same (phase flip only)
  else if (entBellState === 'psi+') resultB = 1 - resultA;  // opposite
  else resultB = 1 - resultA;                             // psi- opposite

  const stateClass = (n) => n === 0 ? 'state-0' : 'state-1';
  const stateLabel = (n) => n === 0 ? '|0⟩' : '|1⟩';

  // Flash A immediately
  const orbA = document.getElementById('entOrbA');
  const orbB = document.getElementById('entOrbB');
  const glowA = document.getElementById('entGlowA');
  const glowB = document.getElementById('entGlowB');
  const sA = document.getElementById('entStateA');
  const sB = document.getElementById('entStateB');
  const floatLbl = document.getElementById('entResultFloat');
  const hint = document.getElementById('entHint');

  // A collapses
  orbA.className = 'ent-orb flashing ' + stateClass(resultA);
  glowA.className = 'ent-orb-glow ' + stateClass(resultA);
  sA.textContent = stateLabel(resultA);
  sA.style.color = resultA === 0 ? '#63b3ed' : '#f687b3';

  // B collapses INSTANTLY (same frame — quantum!)
  orbB.className = 'ent-orb flashing ' + stateClass(resultB);
  glowB.className = 'ent-orb-glow ' + stateClass(resultB);
  sB.textContent = stateLabel(resultB);
  sB.style.color = resultB === 0 ? '#63b3ed' : '#f687b3';

  entMeasured = true;

  // Update global results
  lastExperiment = 'entanglement';
  lastResults.entanglement = {
    bell: entBellState,
    resultA, resultB,
    correlated: resultA === resultB
  };
  const corrDesc = resultA === resultB ? 'Correlated ' : 'Anti-correlated ';
  pushHistory('entanglement', `A=${resultA}, B=${resultB} — ${corrDesc}`, resultA === resultB ? '' : '');

  // Floating label
  floatLbl.textContent = `A=${resultA} → B=${resultB} `;
  floatLbl.style.color = resultA === resultB ? '#68d391' : '#63b3ed';
  floatLbl.classList.add('show');

  // Update hint
  hint.textContent = resultA === resultB
    ? ` A=${resultA} and B=${resultB} — perfectly correlated! Click again to reset.`
    : ` A=${resultA} and B=${resultB} — anti-correlated! Click again to reset.`;

  // Remove flash classes after animation
  setTimeout(() => {
    orbA.className = orbA.className.replace(' flashing', '');
    orbB.className = orbB.className.replace(' flashing', '');
    entMeasureInProgress = false;
  }, 500);

  // Auto-reset to superposition after 3s
  setTimeout(() => {
    entResetQubits();
  }, 3000);
}

function entResetQubits() {
  const orbA = document.getElementById('entOrbA');
  const orbB = document.getElementById('entOrbB');
  const glowA = document.getElementById('entGlowA');
  const glowB = document.getElementById('entGlowB');
  if (!orbA || !orbB) return;
  orbA.className = 'ent-orb state-super';
  orbB.className = 'ent-orb state-super';
  glowA.className = 'ent-orb-glow state-super';
  glowB.className = 'ent-orb-glow state-super';
  document.getElementById('entStateA').textContent = '|ψ⟩';
  document.getElementById('entStateB').textContent = '|ψ⟩';
  document.getElementById('entStateA').style.color = '#63b3ed';
  document.getElementById('entStateB').style.color = '#63b3ed';
  document.getElementById('entResultFloat').classList.remove('show');
  document.getElementById('entHint').textContent = ' Click Qubit A to measure — watch Qubit B respond instantly!';
  entMeasured = false;
}

// ── Bell state selection from tiles ───────
function entSetBell(state) {
  entBellState = state;
  entResetQubits();
  // Update tile highlights
  document.querySelectorAll('.ent-bell-tile').forEach(t => t.style.borderColor = '');
  const colors = { 'phi+': '#68d391', 'phi-': '#b794f4', 'psi+': '#63b3ed', 'psi-': '#fc8181' };
  const stateMap = { 'phi+': 0, 'phi-': 1, 'psi+': 2, 'psi-': 3 };
  const tiles = document.querySelectorAll('.ent-bell-tile');
  if (tiles[stateMap[state]]) {
    tiles[stateMap[state]].style.borderColor = colors[state];
    tiles[stateMap[state]].style.boxShadow = `0 0 12px ${colors[state]}40`;
  }
  // Reset others
  tiles.forEach((t, i) => { if (i !== stateMap[state]) { t.style.borderColor = ''; t.style.boxShadow = ''; } });
}

// ── Init when tab becomes active ──────────
document.querySelectorAll('.tab').forEach(t => {
  if (t.dataset && t.dataset.panel === 'p-ent') {
    t.addEventListener('click', () => {
      setTimeout(() => {
        initEntParticles();
        startEntLineAnim();
      }, 60);
    });
  }
});

// ══════════════════════════════════════════════════
// QUANTUM CIRCUIT SIMULATOR — v14 Full Engine
// ══════════════════════════════════════════════════

// ── Load Three.js dynamically ──────────────────
(function loadThreeJS() {
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  s.onload = () => { blochReady = true; initBlochSphere(); };
  document.head.appendChild(s);
})();

// ── Quantum State ──────────────────────────────
let qcState = { a: { re: 1, im: 0 }, b: { re: 0, im: 0 } };
let qcGates = [];
let qcSelectedGate = null;
let qcGhostGateEl = null;
let qcGhostInsertIndex = null;
let qcHighlightedAnchorEl = null;
let qcLastPlacedIndex = null;
let qcLastMouseClientX = null;
let qcLastMouseClientY = null;
const QC_SNAP_Y_THRESHOLD = 28; // px tolerance above/below wire row
const QC_SNAP_X_THRESHOLD = 60; // forgiving horizontal feel (IBM-like)
let qcMeasurements = 0;
let blochReady = false;
let blochTarget = { x: 0, y: 1, z: 0 };
let blochCurrent = { x: 0, y: 1, z: 0 };
let blochAnimRunning = false;
let phaseArcLine = null;

// Journey state
let qcJourney = [];

// ── Complex math ───────────────────────────────
const cAdd = (a, b) => ({ re: a.re + b.re, im: a.im + b.im });
const cMul = (a, b) => {
  if (typeof a === 'number') return { re: a * b.re, im: a * b.im };
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
};
const cAbs = a => Math.sqrt(a.re * a.re + a.im * a.im);
const cArg = a => Math.atan2(a.im, a.re);
const INV_SQRT2 = 1 / Math.SQRT2;

// ── Gate matrices ──────────────────────────────
const GATE_MATRICES = {
  H: [[{ re: INV_SQRT2, im: 0 }, { re: INV_SQRT2, im: 0 }], [{ re: INV_SQRT2, im: 0 }, { re: -INV_SQRT2, im: 0 }]],
  X: [[{ re: 0, im: 0 }, { re: 1, im: 0 }], [{ re: 1, im: 0 }, { re: 0, im: 0 }]],
  Z: [[{ re: 1, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: -1, im: 0 }]]
};
const GATE_COLORS = { H: '#2a6dd9', X: '#27ae60', Z: '#8e44ad', M: '#e74c3c' };
const GATE_HINTS = {
  H: '<strong style="color:#2a6dd9;font-size:10px">H — Hadamard Gate</strong><br><span style="font-size:9.5px">Creates equal 50/50 superposition:<br>|0⟩ → (|0⟩ + |1⟩) / √2<br> Puts the coin into a spin!</span>',
  X: '<strong style="color:#27ae60;font-size:10px">X — Pauli-X (NOT gate)</strong><br><span style="font-size:9.5px">Flips the qubit: |0⟩ ↔ |1⟩<br>↕️ Turns heads into tails!</span>',
  Z: '<strong style="color:#8e44ad;font-size:10px">Z — Pauli-Z (Phase flip)</strong><br><span style="font-size:9.5px">Phase rotates 180° — probabilities unchanged!<br> Watch the arc on Bloch sphere →</span>',
  M: '<strong style="color:#e74c3c;font-size:10px">M — Measure</strong><br><span style="font-size:9.5px">Collapses to |0⟩ or |1⟩ randomly.<br> Camera flash — the coin stops spinning!</span>'
};
const GATE_MATRICES_DISPLAY = {
  H: { title: 'H — Hadamard', matrix: '1/√2 × [ 1   1 ]\n        [ 1  -1 ]', meaning: 'Mixes |0⟩ and |1⟩ equally — creates superposition' },
  X: { title: 'X — Pauli-X', matrix: '[ 0  1 ]\n[ 1  0 ]', meaning: 'Swaps |0⟩ ↔ |1⟩ — quantum NOT gate' },
  Z: { title: 'Z — Pauli-Z', matrix: '[ 1   0 ]\n[ 0  -1 ]', meaning: 'Flips phase of |1⟩ — rotates 180° on Bloch sphere' },
  M: { title: 'M — Measurement', matrix: 'Projects |ψ⟩ to |0⟩ or |1⟩', meaning: 'Collapses superposition — irreversible!' }
};
const STORY_STEPS = {
  H: (p0) => `→ <strong>H</strong>: Superposition! ${(p0 * 100).toFixed(0)}% |0⟩, ${((1 - p0) * 100).toFixed(0)}% |1⟩ — coin is spinning!`,
  X: (p0) => `→ <strong>X</strong>: Qubit flipped! Now ${(p0 * 100).toFixed(0)}% |0⟩, ${((1 - p0) * 100).toFixed(0)}% |1⟩`,
  Z: () => `→ <strong>Z</strong>: Phase flipped 180°! Same probabilities but phase arc on Bloch sphere changed.`,
  M: (p0, r) => `→ <strong>Measured!</strong> Collapsed to |${r}⟩. Quantum randomness picked ${r}!`
};

// ── REAL WORLD ANALOGIES ───────────────────────
const ANALOGIES = {
  zero: { icon: '', text: 'Coin lying flat — definitely showing HEADS (|0⟩). Certain, no mystery here!' },
  one: { icon: '', text: 'Coin lying flat — definitely showing TAILS (|1⟩). Certain result.' },
  superposition: { icon: '', text: 'Coin spinning in the air — BOTH heads and tails at the same time! Only when you measure (look) does it pick a side.' },
  phase: { icon: '', text: 'Same spinning coin but seen in a mirror — probabilities are identical, but the quantum "direction" flipped 180°. This invisible flip IS the phase!' },
  measured: { icon: '', text: 'Camera flash froze the spinning coin — it landed on one side. Quantum randomness decided which side!' }
};

function getStateType() {
  const p0 = cAbs(qcState.a) ** 2;
  const phi = Math.abs(cArg(qcState.b) - cArg(qcState.a)) * 180 / Math.PI;
  if (p0 > 0.99) return 'zero';
  if (p0 < 0.01) return 'one';
  if (phi > 90) return 'phase';
  return 'superposition';
}

function updateAnalogy() {
  const t = getStateType();
  const a = ANALOGIES[t] || ANALOGIES.zero;
  const icon = document.getElementById('qcAnalogyIcon');
  const text = document.getElementById('qcAnalogyText');
  if (icon) icon.textContent = a.icon;
  if (text) text.textContent = a.text;
}

// ── JOURNEY CHAIN ──────────────────────────────
function qcJourneyStateName() {
  const p0 = cAbs(qcState.a) ** 2;
  const p1 = 1 - p0;
  const phi = Math.round((cArg(qcState.b) - cArg(qcState.a)) * 180 / Math.PI);
  if (p0 > 0.99) return { name: '|0⟩', lbl: 'North pole', type: 'zero' };
  if (p1 > 0.99) return { name: '|1⟩', lbl: 'South pole', type: 'one' };
  if (Math.abs(p0 - 0.5) < 0.02 && Math.abs(phi) < 10) return { name: '|+⟩', lbl: 'Equator (50/50)', type: 'superposition' };
  if (Math.abs(p0 - 0.5) < 0.02 && Math.abs(Math.abs(phi) - 180) < 15) return { name: '|−⟩', lbl: 'Equator (phase)', type: 'phase' };
  return { name: `${(p0 * 100).toFixed(0)}%|0⟩`, lbl: `${(p0 * 100).toFixed(0)}% chance 0`, type: 'superposition' };
}

function renderJourney() {
  const el = document.getElementById('qcJourneyRow');
  if (!el) return;
  el.innerHTML = qcJourney.map((node, i) => {
    const isLast = i === qcJourney.length - 1;
    const arrowPart = i < qcJourney.length - 1 ? `
      <div class="journey-arrow-wrap">
        <div class="journey-gate-lbl">[${qcJourney[i + 1].gate || ''}]</div>
        <div class="journey-arrow-line">──►</div>
      </div>` : '';
    return `
      <div class="journey-node" onclick="journeyNodeClick(${i})" style="animation:journeyPop .3s ease">
        <div class="journey-dot ${node.type}${isLast ? ' active' : ''}">${getStateEmoji(node.type)}</div>
        <div class="journey-state">${node.name}</div>
        <div class="journey-lbl">${node.lbl}</div>
      </div>
      ${arrowPart}`;
  }).join('');
}

function getStateEmoji(type) {
  return { zero: '●', one: '●', superposition: '◉', phase: '◎', measured: '' }[type] || '●';
}

function journeyNodeClick(i) {
  const node = qcJourney[i];
  if (!node) return;
  const story = document.getElementById('qcStory');
  if (!story) return;
  const descs = {
    zero: `<strong style="color:var(--sky)">|0⟩ — North Pole:</strong> The qubit is definitely 0. Like a coin lying flat showing heads. 100% certain.`,
    one: `<strong style="color:var(--mint)">|1⟩ — South Pole:</strong> The qubit is definitely 1. Like a coin lying flat showing tails. 100% certain.`,
    superposition: `<strong style="color:var(--purple)">Superposition — Equator:</strong> The qubit is 50% |0⟩ AND 50% |1⟩ at the same time! Like a coin spinning in the air.`,
    phase: `<strong style="color:var(--purple)">Phase State — Equator:</strong> Same 50/50 probabilities as before, but the phase is flipped 180°! The Bloch sphere arrow is on the opposite side of the equator. This is quantum phase — invisible to measurement but real!`,
    measured: `<strong style="color:var(--coral)">Measured — Collapsed:</strong> The quantum state collapsed to a definite value. The superposition is gone until the circuit is reset.`
  };
  story.innerHTML = '<strong style="color:var(--sky)"> Node ' + (i + 1) + ':</strong> ' + (descs[node.type] || node.lbl);
}

// ── "WHAT JUST CHANGED?" POPUP ─────────────────
let popupTimer = null;
let popupHovered = false;

function showGatePopup(gate, prevP0, newP0) {
  clearTimeout(popupTimer);
  const popup = document.getElementById('qcPopup');
  if (!popup) return;
  const colors = { H: 'var(--sky)', X: 'var(--mint)', Z: 'var(--purple)', M: 'var(--coral)' };
  const titles = { H: ' Hadamard Gate!', X: ' Pauli-X Gate!', Z: ' Pauli-Z Gate!', M: ' Measured!' };
  const analogies = {
    H: ' Like spinning a coin — now both heads AND tails at once!',
    X: '↕️ Coin flipped upside down — heads became tails!',
    Z: ' Same spinning coin but mirror-flipped — probabilities same, phase different! Watch the arc on Bloch sphere →',
    M: ' Camera flash! The coin stopped spinning and picked a side randomly.'
  };
  document.getElementById('qcPopupTitle').innerHTML = `<span style="color:${colors[gate]}">${titles[gate]}</span>`;
  document.getElementById('qcPopupBefore').textContent = `BEFORE: ${(prevP0 * 100).toFixed(0)}% |0⟩ · ${((1 - prevP0) * 100).toFixed(0)}% |1⟩`;
  document.getElementById('qcPopupAfter').textContent = `AFTER:  ${(newP0 * 100).toFixed(0)}% |0⟩ · ${((1 - newP0) * 100).toFixed(0)}% |1⟩`;
  document.getElementById('qcPopupAnalogy').textContent = analogies[gate] || '';
  popup.style.display = 'block';
  popupHovered = false;
  schedulePopupHide();
}

function schedulePopupHide() {
  clearTimeout(popupTimer);
  popupTimer = setTimeout(() => {
    if (!popupHovered) {
      const popup = document.getElementById('qcPopup');
      if (popup) popup.style.display = 'none';
    } else {
      // Still hovered — check again in 1s
      schedulePopupHide();
    }
  }, 4000);
}

// Add hover listeners to popup after DOM ready
function initPopupHover() {
  const popup = document.getElementById('qcPopup');
  if (!popup) return;
  popup.addEventListener('mouseenter', () => {
    popupHovered = true;
    clearTimeout(popupTimer);
  });
  popup.addEventListener('mouseleave', () => {
    popupHovered = false;
    schedulePopupHide();
  });
}

// ── GATE MATRIX TOGGLE ─────────────────────────
let matrixVisible = false;
function toggleMatrix() {
  matrixVisible = !matrixVisible;
  const panel = document.getElementById('matrixPanel');
  const btn = document.getElementById('matrixToggleBtn');
  if (panel) panel.style.display = matrixVisible ? 'block' : 'none';
  if (btn) btn.textContent = (matrixVisible ? '▼' : '▶') + ' Gate Matrix';
  if (matrixVisible && qcSelectedGate) updateMatrixDisplay(qcSelectedGate);
}
function updateMatrixDisplay(gate) {
  if (!matrixVisible || !gate) return;
  const m = GATE_MATRICES_DISPLAY[gate];
  if (!m) return;
  const el = document.getElementById('matrixContent');
  if (!el) return;
  const colors = { H: 'var(--sky)', X: 'var(--mint)', Z: 'var(--purple)', M: 'var(--coral)' };
  el.innerHTML = `
    <div style="font-weight:700;color:${colors[gate] || 'var(--td)'};font-size:11px;margin-bottom:6px">${m.title}</div>
    <div style="font-family:'Courier New',monospace;font-size:10.5px;color:var(--sky);background:#f0f4ff;border-radius:5px;padding:6px 8px;margin-bottom:5px;line-height:1.8;white-space:pre">${m.matrix}</div>
    <div style="font-size:9.5px;color:var(--tm);line-height:1.5;">${m.meaning}</div>`;
}

// ── PHASE ARC on Bloch Sphere ──────────────────
function updatePhaseArc(phi) {
  if (!blochScene || !window.THREE) return;
  if (phaseArcLine) { blochScene.remove(phaseArcLine); phaseArcLine = null; }
  if (Math.abs(phi) < 0.08) return;
  const points = [];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * phi;
    points.push(new THREE.Vector3(Math.cos(angle), 0.01, Math.sin(angle)));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0x8e44ad, transparent: true, opacity: 0.95 });
  phaseArcLine = new THREE.Line(geo, mat);
  blochScene.add(phaseArcLine);
}

// ── APPLY GATE ─────────────────────────────────
function applyGateToState(gate) {
  const prevP0 = cAbs(qcState.a) ** 2;
  if (gate === 'M') {
    const p0 = cAbs(qcState.a) ** 2;
    const result = Math.random() < p0 ? 0 : 1;
    qcState = result === 0
      ? { a: { re: 1, im: 0 }, b: { re: 0, im: 0 } }
      : { a: { re: 0, im: 0 }, b: { re: 1, im: 0 } };
    qcMeasurements++;
    const mc = document.getElementById('qcMeasCount');
    if (mc) mc.textContent = qcMeasurements;
    const mEl = document.getElementById('qcMeasResult');
    if (mEl) { mEl.style.display = 'block'; mEl.innerHTML = ` Measured: <strong>|${result}⟩</strong> — collapsed! Run again for a different result.`; }
    showGatePopup('M', prevP0, cAbs(qcState.a) ** 2);
    return result;
  }
  const m = GATE_MATRICES[gate];
  const newA = cAdd(cMul(m[0][0], qcState.a), cMul(m[0][1], qcState.b));
  const newB = cAdd(cMul(m[1][0], qcState.a), cMul(m[1][1], qcState.b));
  qcState = { a: newA, b: newB };
  const mEl = document.getElementById('qcMeasResult');
  if (mEl) mEl.style.display = 'none';
  showGatePopup(gate, prevP0, cAbs(qcState.a) ** 2);
  return null;
}

// ── STATE → BLOCH COORDS ───────────────────────
function stateToBloch() {
  const p0 = cAbs(qcState.a) ** 2;
  const theta = 2 * Math.acos(Math.min(1, Math.sqrt(p0)));
  const phi = cArg(qcState.b) - cArg(qcState.a);
  return { x: Math.sin(theta) * Math.cos(phi), y: Math.cos(theta), z: Math.sin(theta) * Math.sin(phi) };
}

// ── UPDATE ALL VISUALISATIONS ──────────────────
function qcUpdateViz(measResult) {
  const p0 = cAbs(qcState.a) ** 2;
  const p1 = 1 - p0;
  const phi = cArg(qcState.b) - cArg(qcState.a);
  const phiDeg = Math.round(phi * 180 / Math.PI);
  const absA = cAbs(qcState.a).toFixed(3);
  const absB = cAbs(qcState.b).toFixed(3);

  const safeSet = (id, prop, val) => { const el = document.getElementById(id); if (el) el[prop] = val; };
  const safeSetStyle = (id, prop, val) => { const el = document.getElementById(id); if (el) el.style[prop] = val; };

  safeSetStyle('qcPb0', 'width', (p0 * 100).toFixed(1) + '%');
  safeSetStyle('qcPb1', 'width', (p1 * 100).toFixed(1) + '%');
  safeSet('qcPp0', 'textContent', (p0 * 100).toFixed(1) + '%');
  safeSet('qcPp1', 'textContent', (p1 * 100).toFixed(1) + '%');

  const signB = qcState.b.re < -0.001 ? '−' : '+';
  safeSet('qcStateVec', 'textContent', `|ψ⟩ = ${absA}|0⟩ ${signB} ${absB}|1⟩`);
  safeSet('qcMatrix', 'textContent', `[${qcState.a.re.toFixed(3)}, ${qcState.b.re.toFixed(3)}]`);
  safeSet('qcPhaseLabel', 'textContent', phiDeg + '°');
  safeSet('qcPhaseVal', 'textContent', phiDeg + '°');
  safeSet('qcStatus', 'textContent', p0 > 0.99 ? 'State: |0⟩' : p1 > 0.99 ? 'State: |1⟩' : 'State: superposition');
  safeSet('phaseOverlay', 'textContent', 'φ = ' + phiDeg + '°');

  // Phase arc on Bloch sphere
  updatePhaseArc(phi);
  // Bloch target
  blochTarget = stateToBloch();
  // Analogy
  updateAnalogy();
}

// ── CIRCUIT WIRE ───────────────────────────────
function qcSelectGate(gate) {
  qcSelectedGate = (qcSelectedGate === gate) ? null : gate;
  document.querySelectorAll('.gate-btn').forEach(b => b.classList.remove('selected'));
  const gh = document.getElementById('gateHint');
  if (qcSelectedGate) {
    const gb = document.getElementById('gb-' + gate);
    if (gb) gb.classList.add('selected');
    if (gh) gh.innerHTML = GATE_HINTS[gate];
    updateMatrixDisplay(gate);
  } else {
    if (gh) gh.innerHTML = '<strong style="color:var(--sky)"> Select a gate</strong><br>Click above, then click the wire to place it. Or drag onto the wire!';
    qcHideGhostGatePreview();
  }
  if (qcSelectedGate && qcLastMouseClientX != null) {
    qcUpdateGhostGatePreview(qcLastMouseClientX, qcLastMouseClientY);
  }
}

function qcPlaceGate(idx) {
  qcPlaceGateAtIndex(typeof idx === 'number' ? idx : qcGhostInsertIndex);
}

function qcPlaceGateAtIndex(insIdx) {
  if (!qcSelectedGate) return;
  if (qcGates.length >= 8) {
    const area = document.getElementById('qcCircuitArea');
    if (area) { area.classList.add('wire-shake'); setTimeout(() => area.classList.remove('wire-shake'), 400); }
    return;
  }
  const idx = Math.max(0, Math.min(typeof insIdx === 'number' ? insIdx : qcGates.length, qcGates.length));
  qcGates.splice(idx, 0, qcSelectedGate);
  qcLastPlacedIndex = idx;
  qcRenderWire();
  const gc = document.getElementById('qcGateCount');
  if (gc) gc.textContent = qcGates.length;
  // Sound on placing gates (click-to-place)
  soundManager.playSound('gate', { volume: 0.45 });
  qcHideGhostGatePreview();
}

function qcRemoveGate(idx) {
  qcGates.splice(idx, 1);
  qcRenderWire();
  const gc = document.getElementById('qcGateCount');
  if (gc) gc.textContent = qcGates.length;
  qcResetState();
  qcUpdateViz();
  qcJourney = [{ ...qcJourneyStateName(), gate: null }];
  renderJourney();
}

function qcRenderWire() {
  const container = document.getElementById('qcGatesContainer');
  if (!container) return;
  container.innerHTML = '';
  qcGates.forEach((gate, idx) => {
    const seg = document.createElement('div'); seg.className = 'wire-seg'; container.appendChild(seg);
    const box = document.createElement('div');
    box.className = `wire-gate wire-gate-${gate}`;
    box.textContent = gate;
    box.title = `Click to remove ${gate}`;
    box.onclick = () => qcRemoveGate(idx);
    if (idx === qcLastPlacedIndex) {
      box.classList.add('gate-placing');
      setTimeout(() => box.classList.remove('gate-placing'), 130);
    }
    container.appendChild(box);
  });
  const seg2 = document.createElement('div'); seg2.className = 'wire-seg'; container.appendChild(seg2);
  qcLastPlacedIndex = null;
}

// ── GHOST GATE PREVIEW ────────────────────────────
function qcEnsureGhostGatePreviewEl() {
  if (qcGhostGateEl) return;
  qcGhostGateEl = document.createElement('div');
  qcGhostGateEl.className = 'ghost-gate';
  qcGhostGateEl.style.display = 'none';
  qcGhostGateEl.textContent = '';
  document.body.appendChild(qcGhostGateEl);
}

function qcHexToRgba(hex, alpha) {
  if (!hex) return `rgba(79,195,247,${alpha})`;
  const h = hex.replace('#', '').trim();
  if (h.length !== 6) return `rgba(79,195,247,${alpha})`;
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function qcHideGhostGatePreview() {
  qcGhostInsertIndex = null;
  if (qcHighlightedAnchorEl) {
    qcHighlightedAnchorEl.classList.remove('slot-highlight');
    qcHighlightedAnchorEl = null;
  }
  if (qcGhostGateEl) qcGhostGateEl.style.display = 'none';
}

function qcGetInsertionAnchors() {
  const container = document.getElementById('qcGatesContainer');
  const segs = container ? Array.from(container.querySelectorAll('.wire-seg')) : [];
  const endWire = document.getElementById('qcEndWire');
  if (segs.length > 0) {
    const anchors = segs.map((seg, i) => ({ el: seg, idx: i }));
    // Always include the long trailing wire so right-side drops can snap.
    if (endWire) anchors.push({ el: endWire, idx: qcGates.length });
    return anchors;
  }

  // Fallback before the first wire render:
  return endWire ? [{ el: endWire, idx: qcGates.length }] : [];
}

function qcGetNearestInsertionIndex(clientX) {
  const anchors = qcGetInsertionAnchors();
  if (anchors.length === 0) return null;

  let best = anchors[0];
  let bestD = Infinity;
  for (const a of anchors) {
    const r = a.el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const d = Math.abs(cx - clientX);
    if (d < bestD) { bestD = d; best = a; }
  }
  return best.idx;
}

function qcGetNearestInsertion(clientX) {
  const anchors = qcGetInsertionAnchors();
  if (anchors.length === 0) return null;
  let best = anchors[0];
  let bestD = Infinity;
  for (const a of anchors) {
    const r = a.el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const d = Math.abs(cx - clientX);
    if (d < bestD) { bestD = d; best = a; }
  }
  return { idx: best.idx, distance: bestD };
}

function qcHighlightAnchor(anchorEl) {
  if (qcHighlightedAnchorEl && qcHighlightedAnchorEl !== anchorEl) {
    qcHighlightedAnchorEl.classList.remove('slot-highlight');
  }
  qcHighlightedAnchorEl = anchorEl || null;
  if (qcHighlightedAnchorEl) qcHighlightedAnchorEl.classList.add('slot-highlight');
}

function qcIsNearWireRow(clientY) {
  const wireRow = document.getElementById('qcWireRow');
  if (!wireRow) return false;
  const rect = wireRow.getBoundingClientRect();
  const centerY = rect.top + rect.height / 2;
  return Math.abs(clientY - centerY) <= QC_SNAP_Y_THRESHOLD;
}

function qcUpdateGhostGatePreview(clientX, clientY, gateOverride) {
  const previewGate = gateOverride || qcSelectedGate;
  if (!previewGate || qcGates.length >= 8) { qcHideGhostGatePreview(); return; }
  if (!qcIsNearWireRow(clientY)) { qcHideGhostGatePreview(); return; }
  qcEnsureGhostGatePreviewEl();

  const anchors = qcGetInsertionAnchors();
  if (anchors.length === 0) { qcHideGhostGatePreview(); return; }

  let best = anchors[0];
  let bestD = Infinity;
  for (const a of anchors) {
    const r = a.el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const d = Math.abs(cx - clientX);
    if (d < bestD) { bestD = d; best = a; }
  }

  const rect = best.el.getBoundingClientRect();
  const col = GATE_COLORS[previewGate] || '#4fc3f7';

  qcGhostInsertIndex = best.idx;
  qcHighlightAnchor(best.el);
  qcGhostGateEl.textContent = previewGate;
  qcGhostGateEl.style.borderColor = col;
  qcGhostGateEl.style.color = col;
  qcGhostGateEl.style.background = qcHexToRgba(col, 0.2);
  qcGhostGateEl.style.boxShadow = `0 0 0 3px ${qcHexToRgba(col, 0.12)}`;

  const wireRow = document.getElementById('qcWireRow');
  const wireRect = wireRow ? wireRow.getBoundingClientRect() : rect;
  qcGhostGateEl.style.left = (rect.left + rect.width / 2) + 'px';
  qcGhostGateEl.style.top = (wireRect.top + wireRect.height / 2) + 'px';
  qcGhostGateEl.style.display = 'flex';
}

// Attach preview handlers once
(function qcInitGhostGatePreview() {
  const wireRow = document.getElementById('qcWireRow');
  const circuitArea = document.getElementById('qcCircuitArea');
  if (!wireRow || !circuitArea) return;

  const moveHandler = (e) => {
    qcLastMouseClientX = e.clientX;
    qcLastMouseClientY = e.clientY;
    // If dragging, preview the dragged gate; otherwise preview the selected gate.
    qcUpdateGhostGatePreview(e.clientX, e.clientY, qcDraggedGate);
  };
  wireRow.addEventListener('mousemove', moveHandler);
  circuitArea.addEventListener('mousemove', moveHandler);

  const dragOverHandler = (e) => {
    e.preventDefault();
    if (!qcDraggedGate) return;
    qcLastMouseClientX = e.clientX;
    qcLastMouseClientY = e.clientY;
    qcUpdateGhostGatePreview(e.clientX, e.clientY, qcDraggedGate);
  };
  wireRow.addEventListener('dragover', dragOverHandler);
  circuitArea.addEventListener('dragover', dragOverHandler);

  wireRow.addEventListener('mouseleave', () => {
    qcHideGhostGatePreview();
  });

  const clickPlaceHandler = (e) => {
    if (!qcSelectedGate) return;
    const t = e.target;
    const gateClicked = (t && t.closest)
      ? t.closest('.wire-gate')
      : (t && t.parentElement && t.parentElement.closest ? t.parentElement.closest('.wire-gate') : null);
    if (gateClicked) return; // click on existing gate = remove only

    if (!qcIsNearWireRow(e.clientY)) return;
    const nearest = qcGetNearestInsertion(e.clientX);
    if (!nearest) return;
    qcPlaceGateAtIndex(nearest.idx);
  };
  // Single click binding avoids duplicate placement from event bubbling.
  circuitArea.addEventListener('click', clickPlaceHandler);
})();

// ── DRAG AND DROP ──────────────────────────────
let qcDraggedGate = null;
function qcDragStart(event, gate) {
  qcDraggedGate = gate;
  event.dataTransfer.setData('gate', gate);
  event.dataTransfer.effectAllowed = 'copy';

  // Lightweight visual feedback while dragging the gate tile.
  const dragEl = event.currentTarget || event.target;
  if (dragEl && dragEl.style) {
    dragEl.style.transform = 'scale(0.92)';
    setTimeout(() => { dragEl.style.transform = ''; }, 200);
  }

  // Show ghost preview immediately if cursor coords exist.
  if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
    qcLastMouseClientX = event.clientX;
    qcLastMouseClientY = event.clientY;
    qcUpdateGhostGatePreview(event.clientX, event.clientY, gate);
  }

  // Cleanup if user drops outside valid targets.
  const cleanup = () => {
    qcDraggedGate = null;
    qcHideGhostGatePreview();
  };
  if (dragEl && typeof dragEl.addEventListener === 'function') {
    dragEl.addEventListener('dragend', cleanup, { once: true });
  }
}
function qcDropGate(event) {
  event.preventDefault();
  const gate = event.dataTransfer.getData('gate') || qcDraggedGate;
  if (!gate) return;
  if (qcGates.length >= 8) return;
  if (!qcIsNearWireRow(event.clientY)) return;

  // Insert based on nearest wire anchor (matches the ghost preview position),
  // always snapping to nearest slot for IBM-like placement.
  const nearest = qcGetNearestInsertion(event.clientX);
  if (!nearest) return;
  qcGates.splice(nearest.idx, 0, gate);
  qcLastPlacedIndex = nearest.idx;

  qcRenderWire();
  const gc = document.getElementById('qcGateCount');
  if (gc) gc.textContent = qcGates.length;

  // Sound on placing gates (drag-to-place)
  soundManager.playSound('gate', { volume: 0.45 });

  qcHideGhostGatePreview();
  qcDraggedGate = null;
}

// ── RUN / STEP / CLEAR ─────────────────────────
function qcRunCircuit() {
  qcResetState();
  soundManager.playSound('run', { volume: 0.8 });
  qcJourney = [{ name: '|0⟩', lbl: 'North pole', type: 'zero', gate: null }];
  const mEl = document.getElementById('qcMeasResult');
  if (mEl) mEl.style.display = 'none';
  qcStepGateIdx = 0;
  let story = '<strong style="color:var(--sky)"> Circuit Story:</strong> Started at <strong>|0⟩</strong> (north pole).';
  let measResult = null;
  qcGates.forEach(gate => {
    measResult = applyGateToState(gate);
    const p0 = cAbs(qcState.a) ** 2;
    story += ' ' + (STORY_STEPS[gate] ? STORY_STEPS[gate](p0, measResult) : '');
    const js = qcJourneyStateName();
    js.gate = gate;
    qcJourney.push(js);
  });
  if (qcGates.length === 0) story += ' <em style="color:var(--tl)">Add gates to the wire first!</em>';
  const storyEl = document.getElementById('qcStory');
  if (storyEl) storyEl.innerHTML = story;
  const smEl = document.getElementById('qcStepMsg');
  if (smEl) smEl.textContent = '';
  qcUpdateViz(measResult);
  renderJourney();
  document.querySelectorAll('.wire-gate').forEach(el => {
    el.style.transition = 'background .3s';
    el.style.background = 'rgba(39,174,96,0.25)';
    setTimeout(() => el.style.background = '', 700);
  });
  // Update global results
  if (qcGates.length > 0) {
    const p0n = Math.round(cAbs(qcState.a) ** 2 * 1000) / 10;
    const phiDeg = Math.round((cArg(qcState.b) - cArg(qcState.a)) * 180 / Math.PI);
    const svA = cAbs(qcState.a).toFixed(3), svB = cAbs(qcState.b).toFixed(3);
    lastExperiment = 'superposition';
    lastResults.superposition = {
      gates: qcGates.length, circuit: qcGates.join('→'),
      p0: p0n, phase: phiDeg, measured: measResult,
      stateVec: `|ψ⟩ = ${svA}|0⟩ + ${svB}|1⟩`,
      measurements: qcMeasurements
    };
    const stateDesc = p0n > 99 ? '|0⟩ certain' : p0n < 1 ? '|1⟩ certain' : 'Superposition';
    pushHistory('superposition', `${qcGates.join('→')} → ${stateDesc}`, '');
  }
}

let qcStepGateIdx = 0;
function qcStepCircuit() {
  if (qcStepGateIdx === 0) {
    qcResetState();
    qcJourney = [{ name: '|0⟩', lbl: 'North pole', type: 'zero', gate: null }];
    const storyEl = document.getElementById('qcStory');
    if (storyEl) storyEl.innerHTML = '<strong style="color:var(--sky)"> Step Mode:</strong> Started at <strong>|0⟩</strong>';
    renderJourney();
  }
  if (qcStepGateIdx >= qcGates.length) {
    qcStepGateIdx = 0;
    const smEl = document.getElementById('qcStepMsg');
    if (smEl) smEl.textContent = ' Circuit complete — press Step to restart';
    return;
  }
  document.querySelectorAll('.wire-gate').forEach((el, i) => el.classList.toggle('active-step', i === qcStepGateIdx));
  const gate = qcGates[qcStepGateIdx];
  const measResult = applyGateToState(gate);
  const p0 = cAbs(qcState.a) ** 2;
  qcUpdateViz(measResult);
  const smEl = document.getElementById('qcStepMsg');
  if (smEl) smEl.textContent = `Step ${qcStepGateIdx + 1}: Applied ${gate} gate`;
  const storyEl = document.getElementById('qcStory');
  if (storyEl && STORY_STEPS[gate]) storyEl.innerHTML += ' ' + (STORY_STEPS[gate](p0, measResult) || '');
  const js = qcJourneyStateName(); js.gate = gate;
  qcJourney.push(js);
  renderJourney();
  qcStepGateIdx++;
  if (qcStepGateIdx >= qcGates.length) {
    setTimeout(() => document.querySelectorAll('.wire-gate').forEach(el => el.classList.remove('active-step')), 700);
  }
}

function qcClearCircuit() {
  qcGates = []; qcStepGateIdx = 0; qcMeasurements = 0;
  qcHideGhostGatePreview();
  soundManager.playSound('reset', { volume: 0.6 });
  qcRenderWire();
  qcResetState();
  qcUpdateViz();
  qcJourney = [{ name: '|0⟩', lbl: 'North pole', type: 'zero', gate: null }];
  renderJourney();
  const ids = ['qcGateCount', 'qcMeasCount'];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '0'; });
  const smEl = document.getElementById('qcStepMsg');
  if (smEl) smEl.textContent = '';
  const mEl = document.getElementById('qcMeasResult');
  if (mEl) mEl.style.display = 'none';
  const popup = document.getElementById('qcPopup');
  if (popup) popup.style.display = 'none';
  const storyEl = document.getElementById('qcStory');
  if (storyEl) storyEl.innerHTML = '<strong style="color:var(--sky)"> Circuit Story:</strong> Start at <strong>|0⟩</strong>. Select a gate and place it on the wire, then press Run!';
}

function qcResetState() {
  qcState = { a: { re: 1, im: 0 }, b: { re: 0, im: 0 } };
  qcStepGateIdx = 0;
  blochTarget = { x: 0, y: 1, z: 0 };
  blochCurrent = { x: 0, y: 1, z: 0 };
}

// ── PRESETS ────────────────────────────────────
const PRESETS = {
  superposition: { gates: ['H'] },
  flip: { gates: ['X', 'H', 'X'] },
  phaseKick: { gates: ['H', 'Z', 'H'] },
  measure: { gates: ['H', 'M'] }
};
function qcLoadPreset(name) {
  const p = PRESETS[name]; if (!p) return;
  qcHideGhostGatePreview();
  qcGates = [...p.gates];
  qcStepGateIdx = 0;
  qcRenderWire();
  const gc = document.getElementById('qcGateCount');
  if (gc) gc.textContent = qcGates.length;
  const smEl = document.getElementById('qcStepMsg');
  if (smEl) smEl.textContent = `Loaded preset: ${name}`;
  qcRunCircuit();
}

// ══════════════════════════════════════════════
// THREE.JS BLOCH SPHERE
// ══════════════════════════════════════════════
let blochScene, blochCamera, blochRenderer, blochArrow, blochArrowDir;
let blochSphere3D, blochEquator;
let blochDragging = false, blochLastX = 0, blochLastY = 0;
let blochAutoRot = true;
let blochIdleTimer = null;

function initBlochSphere() {
  const canvas = document.getElementById('blochCanvas');
  if (!canvas || !window.THREE) return;
  const W = canvas.clientWidth || canvas.offsetWidth;
  const H = canvas.clientHeight || canvas.offsetHeight;
  if (W < 10 || H < 10) { setTimeout(initBlochSphere, 150); return; }
  if (blochRenderer) { blochRenderer.dispose(); blochRenderer = null; }

  blochScene = new THREE.Scene();
  blochCamera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  blochCamera.position.set(2.2, 1.6, 2.2);
  blochCamera.lookAt(0, 0, 0);
  blochRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  blochRenderer.setPixelRatio(window.devicePixelRatio || 1);
  blochRenderer.setSize(W, H);
  blochRenderer.setClearColor(0x000000, 0);

  const sGeo = new THREE.SphereGeometry(1, 28, 28);
  blochSphere3D = new THREE.Mesh(sGeo, new THREE.MeshBasicMaterial({ color: 0x2a6dd9, wireframe: true, transparent: true, opacity: 0.13 }));
  blochScene.add(blochSphere3D);
  blochScene.add(new THREE.Mesh(new THREE.SphereGeometry(0.98, 28, 28), new THREE.MeshBasicMaterial({ color: 0x0d1e3a, transparent: true, opacity: 0.35, side: THREE.BackSide })));

  const eGeo = new THREE.TorusGeometry(1, 0.008, 8, 80);
  blochEquator = new THREE.Mesh(eGeo, new THREE.MeshBasicMaterial({ color: 0x63b3ed, transparent: true, opacity: 0.6 }));
  blochEquator.rotation.x = Math.PI / 2;
  blochScene.add(blochEquator);

  const axMat = c => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.5 });
  const mkAx = (a, b, c) => { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]); return new THREE.Line(g, axMat(c)); };
  blochScene.add(mkAx([0, -1.4, 0], [0, 1.4, 0], 0x63b3ed));
  blochScene.add(mkAx([-1.4, 0, 0], [1.4, 0, 0], 0xe74c3c));
  blochScene.add(mkAx([0, 0, -1.4], [0, 0, 1.4], 0x27ae60));

  const mkLbl = (text, pos, color) => {
    const c2 = document.createElement('canvas'); c2.width = 128; c2.height = 64;
    const cx = c2.getContext('2d'); cx.fillStyle = color; cx.font = 'bold 30px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(text, 64, 32);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c2), transparent: true }));
    sp.scale.set(0.4, 0.2, 1); sp.position.set(...pos); return sp;
  };
  blochScene.add(mkLbl('|0⟩', [0, 1.6, 0], '#63b3ed'));
  blochScene.add(mkLbl('|1⟩', [0, -1.6, 0], '#63b3ed'));
  blochScene.add(mkLbl('|+⟩', [1.6, 0, 0], '#fc8181'));
  blochScene.add(mkLbl('|−⟩', [-1.6, 0, 0], '#fc8181'));

  blochArrowDir = new THREE.Vector3(0, 1, 0);
  blochArrow = new THREE.ArrowHelper(blochArrowDir, new THREE.Vector3(0, 0, 0), 1, 0xff4444, 0.18, 0.1);
  blochScene.add(blochArrow);
  blochScene.add(new THREE.AmbientLight(0xffffff, 0.8));

  canvas.addEventListener('mousedown', e => { blochDragging = true; blochLastX = e.clientX; blochLastY = e.clientY; blochAutoRot = false; clearTimeout(blochIdleTimer); });
  window.addEventListener('mouseup', () => { blochDragging = false; blochIdleTimer = setTimeout(() => { blochAutoRot = true; }, 4000); });
  canvas.addEventListener('mousemove', e => {
    if (!blochDragging) return;
    blochScene.rotation.y += (e.clientX - blochLastX) * 0.012;
    blochScene.rotation.x += (e.clientY - blochLastY) * 0.012;
    blochLastX = e.clientX; blochLastY = e.clientY;
  });

  blochTarget = { x: 0, y: 1, z: 0 };
  blochCurrent = { x: 0, y: 1, z: 0 };
  if (!blochAnimRunning) animateBloch();
}

function animateBloch() {
  if (!blochRenderer) return;
  blochAnimRunning = true;
  requestAnimationFrame(animateBloch);
  if (blochAutoRot) blochScene.rotation.y += 0.005;
  const lf = 0.08;
  blochCurrent.x += (blochTarget.x - blochCurrent.x) * lf;
  blochCurrent.y += (blochTarget.y - blochCurrent.y) * lf;
  blochCurrent.z += (blochTarget.z - blochCurrent.z) * lf;
  const len = Math.sqrt(blochCurrent.x ** 2 + blochCurrent.y ** 2 + blochCurrent.z ** 2);
  if (len > 0.001) {
    const dir = new THREE.Vector3(blochCurrent.x / len, blochCurrent.y / len, blochCurrent.z / len);
    blochArrow.setDirection(dir);
  }
  const p0 = cAbs(qcState.a) ** 2;
  const superDeg = 1 - Math.abs(p0 * 2 - 1);
  const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.004);
  blochArrow.line.material.color.setHSL(0, 0.9, 0.45 + superDeg * 0.15 * pulse);
  blochArrow.cone.material.color.setHSL(0, 0.9, 0.5 + superDeg * 0.1 * pulse);
  const cv = document.getElementById('blochCanvas');
  if (cv && blochRenderer) {
    const W = cv.clientWidth, H = cv.clientHeight;
    if (W > 10 && H > 10 && Math.abs(blochRenderer.domElement.width - W * (window.devicePixelRatio || 1)) > 2) {
      blochRenderer.setSize(W, H);
      blochCamera.aspect = W / H;
      blochCamera.updateProjectionMatrix();
    }
  }
  blochRenderer.render(blochScene, blochCamera);
}

// ── Init: phase dial and Bloch target set in window.load above ─

/* ============================================================ */
/* HARDWARE SECTION JS */

function showSection(id) {
  document.querySelectorAll('.page-section').forEach(sec => {
    sec.classList.add('hidden');
  });
  // Hide main panels so they don't overlap with the hardware sections
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

  document.getElementById(id).classList.remove('hidden');
}
