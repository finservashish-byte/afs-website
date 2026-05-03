// AFS Calculators — Vanilla JS, No Dependencies
// Calculator logic per PRD Section 6.6

/* =====================================================
   UTILITY
   ===================================================== */
const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n));
const fmtCr = (n) => {
  if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
  if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L';
  return '₹' + fmt(n);
};

function val(id) { return parseFloat(document.getElementById(id)?.value) || 0; }
function set(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

/* =====================================================
   1. SIP CALCULATOR
   FV = P × [(1+r)^n - 1] / r × (1+r)
   ===================================================== */
function calcSIP() {
  const P = val('sip-amount');
  const annualRate = val('sip-rate');
  const years = val('sip-years');
  const r = annualRate / 12 / 100;
  const n = years * 12;
  const fv = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const invested = P * n;
  const gains = fv - invested;

  set('sip-invested', '₹' + fmt(invested));
  set('sip-gains', '₹' + fmt(gains));
  set('sip-corpus', fmtCr(fv));
  set('sip-rate-display', annualRate + '%');
  set('sip-years-display', years + ' Yrs');
  set('sip-amount-display', '₹' + fmt(P) + '/mo');
}

/* =====================================================
   2. GOAL PLANNER
   Inflation-adjusted target: FV = Goal × (1+inf)^years
   Required SIP = FV × r / [(1+r)^n - 1] / (1+r)
   ===================================================== */
function calcGoal() {
  const goal = val('goal-amount');
  const years = val('goal-years');
  const returnRate = val('goal-return');
  const infRate = val('goal-inflation');
  const r = returnRate / 12 / 100;
  const n = years * 12;
  const inflatedGoal = goal * Math.pow(1 + infRate / 100, years);
  const sip = inflatedGoal * r / ((Math.pow(1 + r, n) - 1) * (1 + r));
  const invested = sip * n;

  set('goal-inflated', fmtCr(inflatedGoal));
  set('goal-sip', '₹' + fmt(sip) + '/mo');
  set('goal-total-invested', fmtCr(invested));
  set('goal-gains', fmtCr(inflatedGoal - invested));
}

/* =====================================================
   3. RISK PROFILER — Quiz
   ===================================================== */
function calcRisk() {
  let score = 0;
  const form = document.getElementById('risk-form');
  if (!form) return;
  const answers = form.querySelectorAll('input[type="radio"]:checked');
  answers.forEach(a => { score += parseInt(a.value); });
  const total = 5; // 5 questions × max 3 = 15 points
  const maxScore = 15;
  const result = document.getElementById('risk-result');
  if (!result) return;
  result.classList.remove('hidden');

  let profile, desc, color;
  if (score <= 5) {
    profile = 'Conservative'; desc = 'You prefer capital protection over high returns. Debt-heavy allocation suits your temperament.'; color = '#1A7A4A';
  } else if (score <= 10) {
    profile = 'Moderate'; desc = 'You seek a balance of growth and stability. A balanced equity-debt allocation is ideal.'; color = '#1A4F8A';
  } else {
    profile = 'Aggressive'; desc = 'You seek high growth and can tolerate short-term volatility. High equity allocation is suitable.'; color = '#C0392B';
  }
  set('risk-profile-name', profile);
  set('risk-profile-desc', desc);
  const badge = document.getElementById('risk-profile-badge');
  if (badge) badge.style.background = color;
}

/* =====================================================
   4. SIP VS LUMPSUM
   SIP FV = P × [(1+r)^n - 1] / r × (1+r)
   LS FV = P × (1+r)^n
   ===================================================== */
function calcSIPvsLS() {
  const P = val('svl-amount');
  const annualRate = val('svl-rate');
  const years = val('svl-years');
  const r = annualRate / 12 / 100;
  const rY = annualRate / 100;
  const n = years * 12;

  const sipFV = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const sipInvested = P * n;

  const lsFV = (P * n) * Math.pow(1 + rY, years);
  const lsInvested = P * n;

  set('svl-sip-invested', '₹' + fmt(sipInvested));
  set('svl-sip-fv', fmtCr(sipFV));
  set('svl-ls-invested', '₹' + fmt(lsInvested));
  set('svl-ls-fv', fmtCr(lsFV));
  set('svl-winner', sipFV >= lsFV ? 'SIP wins by ' + fmtCr(sipFV - lsFV) : 'Lumpsum wins by ' + fmtCr(lsFV - sipFV));
}

/* =====================================================
   5. SIP DELAY COST
   Delay Cost = FV(start now) - FV(start after delay)
   ===================================================== */
function calcDelay() {
  const P = val('delay-amount');
  const annualRate = val('delay-rate');
  const years = val('delay-years');
  const delayMonths = val('delay-delay');
  const r = annualRate / 12 / 100;

  const nNow = years * 12;
  const nDelayed = Math.max(0, nNow - delayMonths);

  const fvNow = P * ((Math.pow(1 + r, nNow) - 1) / r) * (1 + r);
  const fvDelayed = P * ((Math.pow(1 + r, nDelayed) - 1) / r) * (1 + r);
  const cost = fvNow - fvDelayed;

  set('delay-now-corpus', fmtCr(fvNow));
  set('delay-delayed-corpus', fmtCr(fvDelayed));
  set('delay-cost', fmtCr(cost));
}

/* =====================================================
   6. TAX CALCULATOR (FY 2025-26)
   STCG Equity: 20%
   LTCG Equity: 12.5% on gains above ₹1.25L
   Debt: As per income slab
   ===================================================== */
function calcTax() {
  const invested = val('tax-invested');
  const current = val('tax-current');
  const fundType = document.getElementById('tax-fundtype')?.value;
  const holdingMonths = val('tax-holding');
  const slab = parseFloat(document.getElementById('tax-slab')?.value) || 0.30;

  const gains = Math.max(0, current - invested);
  let tax = 0;
  let taxType = '';
  const isLT = (fundType === 'equity' && holdingMonths >= 12) ||
               (fundType === 'debt' && holdingMonths >= 24);

  if (fundType === 'equity') {
    if (isLT) {
      tax = Math.max(0, gains - 125000) * 0.125;
      taxType = 'LTCG @ 12.5% (above ₹1.25L exemption)';
    } else {
      tax = gains * 0.20;
      taxType = 'STCG @ 20%';
    }
  } else {
    tax = gains * slab;
    taxType = 'As per income slab (' + Math.round(slab * 100) + '%)';
  }

  set('tax-gains', '₹' + fmt(gains));
  set('tax-type', taxType);
  set('tax-liability', '₹' + fmt(tax));
  set('tax-post', '₹' + fmt(gains - tax));
}

/* =====================================================
   HERO MINI CALCULATOR
   ===================================================== */
function calcHero() {
  const P = val('hero-sip') || 5000;
  const r = 0.12 / 12;
  const n = (val('hero-years') || 10) * 12;
  const fv = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  set('hero-corpus', fmtCr(fv));
  set('hero-sip-display', '₹' + fmt(P) + '/mo');
  set('hero-years-display', (val('hero-years') || 10) + ' Years');
}

/* =====================================================
   initCalc — called when tab is activated
   ===================================================== */
function initCalc(tabId) {
  switch(tabId) {
    case 'tab-sip':    calcSIP(); break;
    case 'tab-goal':   calcGoal(); break;
    case 'tab-risk':   break; // quiz-based, no init calc
    case 'tab-svl':    calcSIPvsLS(); break;
    case 'tab-delay':  calcDelay(); break;
    case 'tab-tax':    calcTax(); break;
  }
}

/* =====================================================
   EVENT BINDING — run on DOM ready
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {

  /* SIP Calculator */
  ['sip-amount','sip-rate','sip-years'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcSIP);
  });

  /* Goal Planner */
  ['goal-amount','goal-years','goal-return','goal-inflation'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcGoal);
  });

  /* Risk Profiler */
  const riskForm = document.getElementById('risk-form');
  if (riskForm) {
    riskForm.addEventListener('change', calcRisk);
    document.getElementById('risk-btn')?.addEventListener('click', calcRisk);
  }

  /* SIP vs Lumpsum */
  ['svl-amount','svl-rate','svl-years'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcSIPvsLS);
  });

  /* Delay Cost */
  ['delay-amount','delay-rate','delay-years','delay-delay'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcDelay);
  });

  /* Tax Calculator */
  ['tax-invested','tax-current','tax-fundtype','tax-holding','tax-slab'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcTax);
    if (el) el.addEventListener('change', calcTax);
  });

  /* Hero mini calc */
  ['hero-sip','hero-years'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', calcHero);
    }
  });
  calcHero();

});
