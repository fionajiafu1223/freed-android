// paywall.js — 付费墙弹窗模块
// 引入方式：<script src="paywall.js"></script>
// 使用方式：requirePremium(callbackFn) — 若已付费直接执行回调，否则弹出付费墙
//           checkPremium() — 返回 Promise<boolean>
// 版本：2026-06-07

(function() {
  'use strict';

  const RC_API_KEY = 'test_PsHsCYxJnoCwiZTTVaexMsaHHoO';
  const WORKER_URL = 'https://api.freedreleasing.com';

  const PLANS = [
    { id:'monthly',   rcPackage:'$rc_monthly',     label:'月度会员', sublabel:'Monthly',   price:'…',  period:'/ 月', badge:null,        highlight:false },
    { id:'yearly',    rcPackage:'$rc_annual',       label:'年度会员', sublabel:'Annual',    price:'…', period:'/ 年', badge:'最划算 省29%', highlight:true  },
    { id:'quarterly', rcPackage:'$rc_three_month',  label:'季度会员', sublabel:'Quarterly', price:'…', period:'/ 季', badge:'省25%',      highlight:false },
  ];

  const FEATURES_FREE = ['情绪释放', '欲望释放', '目标表（最多3个）'];
  const FEATURES_PAID_LEFT = [
    { label: '释放工具', items: ['识别即释放', '情绪欲望释放', '好处坏处释放', '财富释放', '人际关系释放', '身体健康释放'] },
  ];
  const FEATURES_PAID_RIGHT = [
    { label: '释放助手', items: ['卡点释放', '限制性信念释放', '自我允许释放'] },
    { label: '目标表', items: ['无限目标'] },
    { label: '收获本', items: ['收获记录'] },
  ];

  let _premiumCache = null;
  let _cacheTime = 0;
  const CACHE_TTL = 5 * 60 * 1000;

  function getToken() {
    try {
      // 直接读已知的 key
      const direct = localStorage.getItem('sb-ryoaxziysgdkjcjiuqti-auth-token');
      if (direct) {
        const val = JSON.parse(direct);
        const token = val?.access_token || val?.session?.access_token;
        if (token) return token;
      }
      // 兼容旧格式：遍历查找
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-')) && key.includes('auth')) {
          const val = JSON.parse(localStorage.getItem(key));
          const token = val?.access_token || val?.session?.access_token;
          if (token) return token;
        }
      }
    } catch(_) {}
    return null;
  }

  async function checkPremium(forceRefresh) {
    const now = Date.now();
    if (!forceRefresh && _premiumCache !== null && (now - _cacheTime) < CACHE_TTL) return _premiumCache;
    const token = getToken();
    if (!token) { _premiumCache = false; _cacheTime = now; return false; }
    try {
      const res = await fetch(`${WORKER_URL}/subscription/status`, {
        method: 'GET', headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) { _premiumCache = false; _cacheTime = now; return false; }
      const data = await res.json();
      _premiumCache = data.is_premium === true;
      _cacheTime = now;
      return _premiumCache;
    } catch(_) { _premiumCache = false; _cacheTime = now; return false; }
  }

  // ─── 需要付费权限的入口 ───────────────────────────────
  async function requirePremium(onGranted) {
    const isPremium = await checkPremium();
    if (isPremium) {
      if (typeof onGranted === 'function') onGranted();
      return;
    }
    showPaywall(onGranted);
  }

  function injectStyles() {
    if (document.getElementById('pw-styles')) return;
    const style = document.createElement('style');
    style.id = 'pw-styles';
    style.textContent = `
      #pw-overlay {
        position: fixed; inset: 0; z-index: 9999;
        background: transparent;
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
        animation: pwFadeIn 0.22s ease;
        pointer-events: none;
      }
      #pw-sheet { pointer-events: auto; }
      @keyframes pwFadeIn { from{opacity:0} to{opacity:1} }
      #pw-sheet {
        width: 100%; max-width: 420px;
        background: rgba(30,90,160,0.92);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border-radius: 24px;
        padding: 22px 16px 20px;
        max-height: 88vh; overflow-y: auto;
        animation: pwPopIn 0.28s cubic-bezier(0.34,1.56,0.64,1);
        font-family: 'Noto Serif SC', serif;
        border: 1px solid rgba(120,180,255,0.25);
        box-shadow: 0 8px 48px rgba(0,20,60,0.45), inset 0 1px 0 rgba(255,255,255,0.12);
        position: relative;
      }
      @keyframes pwPopIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
      #pw-close {
        position: absolute; top: 14px; right: 14px;
        width: 26px; height: 26px; border-radius: 50%;
        background: rgba(255,255,255,0.10); border: none;
        color: rgba(255,255,255,0.55); font-size: 0.85rem;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background 0.15s;
      }
      #pw-close:hover { background: rgba(255,255,255,0.18); }
      #pw-sheet h2 {
        text-align: center; font-size: 1.05rem; letter-spacing: 0.14em;
        color: rgba(220,240,255,0.95); margin-bottom: 3px;
      }
      #pw-sheet .pw-sub {
        text-align: center; font-size: 0.74rem; color: rgba(160,200,240,0.60);
        font-family: 'Noto Sans SC', sans-serif; margin-bottom: 14px; letter-spacing: 0.04em;
      }

      /* ── 功能对比 ── */
      .pw-features { display: flex; gap: 8px; margin-bottom: 14px; align-items: stretch; }
      .pw-feat-col { border-radius: 14px; padding: 11px 10px; }
      .pw-feat-col.free {
        flex: 0 0 32%;
        background: #ffffff;
        border: 1px solid rgba(160,200,235,0.45);
      }
      .pw-feat-col.paid {
        flex: 1;
        background: #ffffff;
        border: 1px solid rgba(74,159,212,0.30);
      }
      .pw-feat-title {
        font-size: 0.68rem; letter-spacing: 0.06em; margin-bottom: 7px;
        text-align: center; font-family: 'Noto Sans SC', sans-serif;
      }
      .pw-feat-col.free .pw-feat-title { color: #5a7aa0; }
      .pw-feat-col.paid .pw-feat-title { color: #5a7aa0; }
      .pw-feat-item {
        font-size: 0.67rem; font-family: 'Noto Sans SC', sans-serif;
        line-height: 1.95; padding-left: 2px; color: #2a4a6a;
        white-space: nowrap;
      }

      /* 会员功能两列 */
      .pw-paid-groups { display: flex; gap: 8px; }
      .pw-paid-col { flex: 1; display: flex; flex-direction: column; gap: 6px; }
      .pw-paid-group { display: flex; flex-direction: column; }
      .pw-paid-group-label {
        font-size: 0.63rem; color: #4a9fd4; font-family: 'Noto Sans SC', sans-serif;
        letter-spacing: 0.05em; margin-bottom: 2px; white-space: nowrap;
      }
      .pw-paid-group-item {
        font-size: 0.66rem; color: #2a4a6a; font-family: 'Noto Sans SC', sans-serif;
        line-height: 1.85; white-space: nowrap;
      }

      /* ── 套餐 ── */
      .pw-plans { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
      .pw-plans { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
      .pw-plan {
        border-radius: 12px; padding: 10px 14px;
        border: 2px solid rgba(160,200,235,0.40);
        background: #ffffff;
        cursor: pointer; transition: all 0.18s;
        display: flex; align-items: center; justify-content: space-between;
        position: relative;
      }
      .pw-plan:hover { border-color: rgba(74,159,212,0.6); }
      .pw-plan.selected { border-color: #4a9fd4; background: #fff; box-shadow: 0 2px 16px rgba(74,159,212,0.35); }
      .pw-plan.selected::after {
        content: '✓';
        position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
        color: #4a9fd4; font-size: 1rem; font-weight: 700;
      }
      .pw-plan.highlight { background: #ffffff; }
      .pw-plan.highlight.selected { border-color: #4a9fd4; background: #fff; }


      .pw-plan-badge {
        position: absolute; top: -8px; right: 10px;
        background: linear-gradient(135deg, #4a9fd4, #3ab8a0);
        color: #fff; font-size: 0.60rem; padding: 2px 9px;
        border-radius: 99px; letter-spacing: 0.06em; font-family: 'Noto Sans SC', sans-serif;
        box-shadow: 0 2px 8px rgba(58,184,160,0.40);
      }
      .pw-plan-left { display: flex; flex-direction: column; gap: 2px; }
      .pw-plan-name { font-size: 0.86rem; color: #2a4a6a; letter-spacing: 0.06em; }
      .pw-plan-sub { font-size: 0.65rem; color: #5a7aa0; font-family:'Noto Sans SC',sans-serif; }
      .pw-plan-right { display: flex; align-items: baseline; gap: 2px; }
      .pw-plan-price { font-size: 1.22rem; color: #4a9fd4; }
      .pw-plan-period { font-size: 0.65rem; color: #5a7aa0; font-family:'Noto Sans SC',sans-serif; }

      /* ── 按钮 ── */
      .pw-btn {
        width: 100%; padding: 13px; border: none; border-radius: 14px;
        background: linear-gradient(135deg, #4a9fd4 0%, #3ab8a0 100%);
        color: #fff; font-family: 'Noto Serif SC', serif;
        font-size: 0.95rem; letter-spacing: 0.1em; cursor: pointer;
        transition: opacity 0.2s, transform 0.15s; margin-bottom: 10px;
        box-shadow: 0 6px 20px rgba(42,160,140,0.40), 0 2px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25);
        position: relative; overflow: hidden;
      }
      .pw-btn::after {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 50%;
        background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%);
        border-radius: 14px 14px 0 0; pointer-events: none;
      }
      .pw-btn:hover { opacity: 0.90; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(42,160,140,0.48), 0 3px 8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25); }
      .pw-btn:active { transform: translateY(1px); box-shadow: 0 3px 10px rgba(42,160,140,0.35); }
      .pw-btn:disabled { opacity: 0.40; cursor: not-allowed; transform: none; }
      .pw-restore {
        text-align: center; font-size: 0.70rem; color: rgba(160,200,240,0.50);
        cursor: pointer; font-family: 'Noto Sans SC', sans-serif;
        letter-spacing: 0.04em; background: none; border: none; width: 100%;
      }
      .pw-restore:hover { color: rgba(160,200,240,0.85); }
      .pw-msg { text-align: center; font-size: 0.74rem; margin-top: 8px; font-family: 'Noto Sans SC', sans-serif; min-height: 18px; color: rgba(140,190,240,0.60); }
      .pw-msg.error { color: rgba(255,120,120,0.85); }
      .pw-msg.success { color: rgba(100,220,180,0.90); }
    `;
    document.head.appendChild(style);
  }

  let _onGrantedCallback = null;
  let _selectedPlan = PLANS.find(p => p.highlight) || PLANS[0];

  function showPaywall(onGranted) {
    _onGrantedCallback = onGranted || null;
    injectStyles();
    if (document.getElementById('pw-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'pw-overlay';
    overlay.innerHTML = `
      <div id="pw-sheet" style="position:relative;">
        <button id="pw-close">✕</button>
        <h2>🫧 解锁完整释放体验</h2>
        <p class="pw-sub">升级会员，体验全部功能</p>
        <div class="pw-features">
          <div class="pw-feat-col free">
            <div class="pw-feat-title">免费功能</div>
            ${FEATURES_FREE.map(f => `<div class="pw-feat-item">· ${f}</div>`).join('')}
          </div>
          <div class="pw-feat-col paid">
            <div class="pw-feat-title">✦ 会员功能</div>
            <div class="pw-paid-groups">
              <div class="pw-paid-col">
                ${FEATURES_PAID_LEFT.map(g => `
                  <div class="pw-paid-group">
                    <div class="pw-paid-group-label">${g.label}</div>
                    ${g.items.map(i => `<div class="pw-paid-group-item">· ${i}</div>`).join('')}
                  </div>`).join('')}
              </div>
              <div class="pw-paid-col">
                ${FEATURES_PAID_RIGHT.map(g => `
                  <div class="pw-paid-group">
                    <div class="pw-paid-group-label">${g.label}</div>
                    ${g.items.map(i => `<div class="pw-paid-group-item">· ${i}</div>`).join('')}
                  </div>`).join('')}
              </div>
            </div>
          </div>
        </div>
        <div class="pw-plans" id="pw-plans">
          ${PLANS.map(p => `
            <div class="pw-plan ${p.highlight?'highlight':''} ${p.id===_selectedPlan.id?'selected':''}" data-plan="${p.id}">
              ${p.badge ? `<div class="pw-plan-badge">${p.badge}</div>` : ''}
              <div class="pw-plan-left">
                <div class="pw-plan-name">${p.label}</div>
                <div class="pw-plan-sub">${p.sublabel}</div>
              </div>
              <div class="pw-plan-right">
                <div class="pw-plan-price">${p.price}</div>
                <div class="pw-plan-period">${p.period}</div>
              </div>
            </div>`).join('')}
        </div>
        <button class="pw-btn" id="pw-buy-btn">立即订阅</button>
        <button class="pw-restore" id="pw-restore-btn">恢复购买记录</button>
        <div class="pw-msg" id="pw-msg"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('pw-close').addEventListener('click', closePaywall);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closePaywall(); });
    document.getElementById('pw-plans').addEventListener('click', function(e) {
      const card = e.target.closest('.pw-plan');
      if (!card) return;
      _selectedPlan = PLANS.find(p => p.id === card.dataset.plan);
      document.querySelectorAll('.pw-plan').forEach(el => el.classList.remove('selected'));
      card.classList.add('selected');
    });
    document.getElementById('pw-buy-btn').addEventListener('click', handlePurchase);
    document.getElementById('pw-restore-btn').addEventListener('click', handleRestore);
    // 动态从 RevenueCat 获取真实价格
    loadDynamicPrices();
  }

  function closePaywall() {
    const overlay = document.getElementById('pw-overlay');
    if (overlay) overlay.remove();
  }

  function setMsg(text, type) {
    const el = document.getElementById('pw-msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'pw-msg ' + (type || '');
  }

  function setBtnLoading(loading) {
    const btn = document.getElementById('pw-buy-btn');
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? '处理中...' : '立即订阅';
  }

  async function loadDynamicPrices() {
    try {
      await loadRCSDK();
      const Purchases = getRC();
      if (!Purchases) return;
      try { await Purchases.configure({ apiKey: 'appl_tPsHsCYxJnoCwiZTTVaexMsaHHoO' }); } catch(e) {}
      await new Promise(r => setTimeout(r, 300));
      const offeringsResult = await Purchases.getOfferings();
      const current = offeringsResult.offerings ? offeringsResult.offerings.current : offeringsResult.current;
      if (!current) return;
      current.availablePackages.forEach(pkg => {
        const plan = PLANS.find(p => p.rcPackage === pkg.identifier);
        if (!plan) return;
        const priceStr = pkg.product.priceString || pkg.product.price;
        if (!priceStr) return;
        // 更新价格显示
        const planEl = document.querySelector(`.pw-plan[data-plan="${plan.id}"]`);
        if (planEl) {
          const priceEl = planEl.querySelector('.pw-plan-price');
          if (priceEl) priceEl.textContent = priceStr;
        }
      });
    } catch(e) {
      // 静默失败，保留硬编码价格作为备用
    }
  }

  async function handlePurchase() {
    setBtnLoading(true); setMsg('');
    try {
      await loadRCSDK();
      const Purchases = getRC();
      if (!Purchases) throw new Error('RevenueCat SDK 未加载');
      // 从 JS 层再 configure 一次，确保初始化完成
      try { await Purchases.configure({ apiKey: 'appl_tPsHsCYxJnoCwiZTTVaexMsaHHoO' }); } catch(e) {}
      await new Promise(r => setTimeout(r, 300));
      const offeringsResult = await Purchases.getOfferings();
      const current = offeringsResult.offerings ? offeringsResult.offerings.current : offeringsResult.current;
      if (!current) throw new Error('无法获取订阅套餐');
      const pkg = current.availablePackages.find(p => p.identifier === _selectedPlan.rcPackage);
      if (!pkg) throw new Error('找不到套餐: ' + _selectedPlan.rcPackage);
      const rawPkg = JSON.parse(JSON.stringify(pkg));
      const purchaseResult = await Purchases.purchasePackage({ aPackage: rawPkg });
      const customerInfo = purchaseResult.customerInfo || purchaseResult;
      if (customerInfo) {
        _premiumCache = null;
        await checkPremium(true);
        setMsg('✓ 订阅成功，感谢支持！', 'success');
        setTimeout(() => {
          closePaywall();
          if (typeof _onGrantedCallback === 'function') _onGrantedCallback();
        }, 1200);
      }
    } catch(err) {
      if (err && err.userCancelled) { setMsg('已取消', ''); }
      else { setMsg('❌ ' + (err && err.message ? err.message : JSON.stringify(err)).slice(0, 80), 'error'); }
    } finally { setBtnLoading(false); }
  }

  async function handleRestore() {
    const btn = document.getElementById('pw-restore-btn');
    if (btn) { btn.disabled = true; btn.textContent = '恢复中...'; }
    setMsg('');
    try {
      await loadRCSDK();
      const Purchases = getRC();
      if (!Purchases) throw new Error('RevenueCat SDK 未加载');
      const { customerInfo } = await Purchases.restorePurchases();
      const entitlement = customerInfo.entitlements?.active?.['premium'];
      if (entitlement) {
        _premiumCache = null;
        await checkPremium(true);
        setMsg('✓ 购买记录已恢复', 'success');
        setTimeout(() => { closePaywall(); if (typeof _onGrantedCallback === 'function') _onGrantedCallback(); }, 1200);
      } else { setMsg('未找到有效的购买记录', ''); }
    } catch(err) {
      setMsg('❌ ' + (err && err.message ? err.message : String(err)).slice(0, 60), 'error');
    } finally { if (btn) { btn.disabled = false; btn.textContent = '恢复购买记录'; } }
  }

  let _rcLoaded = false;
  function loadRCSDK() {
    if (_rcLoaded) return Promise.resolve();
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const check = setInterval(async () => {
        attempts++;
        const P = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Purchases;
        if (P) {
          try {
            // 用 isConfigured 确认 SDK 已初始化完成
            const result = await P.isConfigured();
            if (result && result.isConfigured) {
              clearInterval(check);
              _rcLoaded = true;
              resolve();
              return;
            }
          } catch(e) {}
        }
        if (attempts > 50) {
          clearInterval(check);
          reject(new Error('RevenueCat SDK 未能初始化'));
        }
      }, 100);
    });
  }

  function getRC() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Purchases;
  }

  function getUserId() {
    try {
      const direct = localStorage.getItem('sb-ryoaxziysgdkjcjiuqti-auth-token');
      if (direct) {
        const val = JSON.parse(direct);
        const id = val?.user?.id || val?.session?.user?.id;
        if (id) return id;
      }
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-')) && key.includes('auth')) {
          const val = JSON.parse(localStorage.getItem(key));
          const id = val?.user?.id || val?.session?.user?.id;
          if (id) return id;
        }
      }
    } catch(_) {}
    return null;
  }

  // ─── 登录检查：未登录跳回主页弹登录框 ───────────────────
  async function requireLogin() {
    const token = getToken();
    if (token) return true;
    const redirect = encodeURIComponent(window.location.href);
    window.location.href = 'index.html?login=1&redirect=' + redirect;
    return false;
  }

  // ─── 登录+付费双重检查 ────────────────────────────────
  async function requireLoginAndPremium(onGranted) {
    const loggedIn = await requireLogin();
    if (!loggedIn) return;
    await requirePremium(onGranted);
  }

  window.FreedPaywall = { checkPremium, requirePremium, showPaywall, closePaywall, requireLogin, requireLoginAndPremium };
  window.checkPremium = checkPremium;
  window.requirePremium = requirePremium;
  window.requireLogin = requireLogin;
  window.requireLoginAndPremium = requireLoginAndPremium;

})();
