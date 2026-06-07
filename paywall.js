// paywall.js — 付费墙弹窗模块
// 引入方式：<script src="paywall.js"></script>
// 使用方式：requirePremium(callbackFn) — 若已付费直接执行回调，否则弹出付费墙
//           checkPremium() — 返回 Promise<boolean>
//
// 依赖：RevenueCat JS SDK（自动加载）
// 版本：2026-06-07

(function() {
  'use strict';

  // ─── 配置 ───────────────────────────────────────────
  const RC_API_KEY = 'test_PsHsCYxJnoCwiZTTVaexMsaHHoO';
  const WORKER_URL = 'https://api.freedreleasing.com';
  const SUPABASE_URL = 'https://ryoaxziysgdkjcjiuqti.supabase.co';

  const PLANS = [
    {
      id: 'monthly',
      rcPackage: '$rc_monthly',
      label: '月度会员',
      sublabel: 'Monthly',
      price: '¥8',
      period: '/ 月',
      badge: null,
      highlight: false,
    },
    {
      id: 'yearly',
      rcPackage: '$rc_annual',
      label: '年度会员',
      sublabel: 'Annual',
      price: '¥68',
      period: '/ 年',
      badge: '最划算 省29%',
      highlight: true,
    },
    {
      id: 'quarterly',
      rcPackage: '$rc_three_month',
      label: '季度会员',
      sublabel: 'Quarterly',
      price: '¥18',
      period: '/ 季',
      badge: '省25%',
      highlight: false,
    },
  ];

  const FEATURES_FREE = ['情绪释放', '欲望释放', '目标表（最多3个）'];
  const FEATURES_PAID = [
    '识别即释放', '情绪欲望释放', '好处坏处释放',
    '财富释放', '人际关系释放', '身体健康释放',
    '卡点释放 / 限制性信念释放 / 自我允许释放',
    '释放助手 AI', '目标表（无限）', '收获本',
  ];

  // ─── 状态缓存 ────────────────────────────────────────
  let _premiumCache = null;
  let _cacheTime = 0;
  const CACHE_TTL = 5 * 60 * 1000; // 5分钟

  // ─── 获取 Supabase session token ─────────────────────
  function getToken() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('supabase') && key.includes('auth')) {
          const val = JSON.parse(localStorage.getItem(key));
          return val?.access_token || val?.session?.access_token || null;
        }
      }
    } catch(_) {}
    return null;
  }

  // ─── 查询付费状态 ─────────────────────────────────────
  async function checkPremium(forceRefresh) {
    const now = Date.now();
    if (!forceRefresh && _premiumCache !== null && (now - _cacheTime) < CACHE_TTL) {
      return _premiumCache;
    }
    const token = getToken();
    if (!token) { _premiumCache = false; _cacheTime = now; return false; }
    try {
      const res = await fetch(`${WORKER_URL}/subscription/status`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) { _premiumCache = false; _cacheTime = now; return false; }
      const data = await res.json();
      _premiumCache = data.is_premium === true;
      _cacheTime = now;
      return _premiumCache;
    } catch(_) {
      _premiumCache = false;
      _cacheTime = now;
      return false;
    }
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

  // ─── 注入样式 ─────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('pw-styles')) return;
    const style = document.createElement('style');
    style.id = 'pw-styles';
    style.textContent = `
      #pw-overlay {
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(5, 20, 50, 0.72);
        backdrop-filter: blur(8px);
        display: flex; align-items: flex-end; justify-content: center;
        animation: pwFadeIn 0.25s ease;
      }
      @keyframes pwFadeIn { from { opacity:0 } to { opacity:1 } }
      #pw-sheet {
        width: 100%; max-width: 480px;
        background: linear-gradient(160deg, rgba(12,30,70,0.97) 0%, rgba(8,50,80,0.97) 100%);
        border-radius: 24px 24px 0 0;
        padding: 24px 20px 40px;
        max-height: 92vh; overflow-y: auto;
        animation: pwSlideUp 0.32s cubic-bezier(0.22,1,0.36,1);
        font-family: 'Noto Serif SC', serif;
        border-top: 1px solid rgba(100,180,255,0.18);
      }
      @keyframes pwSlideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }
      #pw-close {
        position: absolute; top: 16px; right: 20px;
        width: 30px; height: 30px; border-radius: 50%;
        background: rgba(255,255,255,0.12); border: none;
        color: rgba(255,255,255,0.7); font-size: 1.1rem;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
      }
      #pw-sheet h2 {
        text-align: center; font-size: 1.15rem; letter-spacing: 0.12em;
        color: rgba(255,255,255,0.95); margin-bottom: 4px;
      }
      #pw-sheet .pw-sub {
        text-align: center; font-size: 0.78rem; color: rgba(140,190,255,0.75);
        font-family: 'Noto Sans SC', sans-serif; margin-bottom: 20px;
        letter-spacing: 0.04em;
      }
      .pw-features {
        display: flex; gap: 12px; margin-bottom: 20px;
      }
      .pw-feat-col {
        flex: 1; border-radius: 14px; padding: 12px 10px;
      }
      .pw-feat-col.free {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
      }
      .pw-feat-col.paid {
        background: rgba(74,160,230,0.12);
        border: 1px solid rgba(74,160,230,0.25);
      }
      .pw-feat-title {
        font-size: 0.72rem; letter-spacing: 0.08em;
        margin-bottom: 8px; text-align: center;
      }
      .pw-feat-col.free .pw-feat-title { color: rgba(180,210,255,0.6); }
      .pw-feat-col.paid .pw-feat-title { color: rgba(100,210,255,0.9); }
      .pw-feat-item {
        font-size: 0.72rem; color: rgba(255,255,255,0.75);
        font-family: 'Noto Sans SC', sans-serif;
        line-height: 1.9; padding-left: 2px;
      }
      .pw-feat-col.paid .pw-feat-item { color: rgba(200,240,255,0.88); }
      .pw-plans {
        display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;
      }
      .pw-plan {
        border-radius: 16px; padding: 14px 16px;
        border: 1.5px solid rgba(80,140,220,0.25);
        background: rgba(255,255,255,0.05);
        cursor: pointer; transition: all 0.18s;
        display: flex; align-items: center; justify-content: space-between;
        position: relative;
      }
      .pw-plan:hover { background: rgba(80,140,220,0.12); }
      .pw-plan.selected {
        border-color: rgba(80,180,255,0.7);
        background: rgba(40,100,200,0.22);
      }
      .pw-plan.highlight {
        border-color: rgba(60,220,180,0.45);
        background: rgba(20,80,70,0.22);
      }
      .pw-plan.highlight.selected {
        border-color: rgba(60,220,180,0.85);
        background: rgba(20,100,80,0.35);
      }
      .pw-plan-badge {
        position: absolute; top: -9px; right: 12px;
        background: linear-gradient(90deg, #3ab89a, #4a9fd4);
        color: #fff; font-size: 0.65rem; padding: 2px 10px;
        border-radius: 99px; letter-spacing: 0.06em;
        font-family: 'Noto Sans SC', sans-serif;
      }
      .pw-plan-left { display: flex; flex-direction: column; gap: 2px; }
      .pw-plan-name { font-size: 0.9rem; color: rgba(255,255,255,0.92); letter-spacing: 0.06em; }
      .pw-plan-sub { font-size: 0.7rem; color: rgba(140,190,255,0.6); font-family:'Noto Sans SC',sans-serif; }
      .pw-plan-right { display: flex; align-items: baseline; gap: 3px; }
      .pw-plan-price { font-size: 1.3rem; color: rgba(255,255,255,0.95); letter-spacing: 0.02em; }
      .pw-plan-period { font-size: 0.72rem; color: rgba(140,190,255,0.65); font-family:'Noto Sans SC',sans-serif; }
      .pw-btn {
        width: 100%; padding: 15px; border: none; border-radius: 16px;
        background: linear-gradient(135deg, rgba(60,160,240,0.9) 0%, rgba(40,200,160,0.85) 100%);
        color: #fff; font-family: 'Noto Serif SC', serif;
        font-size: 1rem; letter-spacing: 0.1em; cursor: pointer;
        transition: opacity 0.2s, transform 0.15s;
        margin-bottom: 12px;
      }
      .pw-btn:hover { opacity: 0.88; transform: scale(1.02); }
      .pw-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
      .pw-restore {
        text-align: center; font-size: 0.75rem;
        color: rgba(140,190,255,0.6); cursor: pointer;
        font-family: 'Noto Sans SC', sans-serif; letter-spacing: 0.04em;
        background: none; border: none; width: 100%;
      }
      .pw-restore:hover { color: rgba(140,190,255,0.9); }
      .pw-msg {
        text-align: center; font-size: 0.78rem; margin-top: 10px;
        font-family: 'Noto Sans SC', sans-serif; min-height: 20px;
      }
      .pw-msg.error { color: rgba(255,120,120,0.9); }
      .pw-msg.success { color: rgba(80,220,160,0.9); }
    `;
    document.head.appendChild(style);
  }

  // ─── 显示付费墙 ───────────────────────────────────────
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
        <h2>🌊 解锁完整释放体验</h2>
        <p class="pw-sub">升级会员，体验全部功能</p>

        <div class="pw-features">
          <div class="pw-feat-col free">
            <div class="pw-feat-title">免费功能</div>
            ${FEATURES_FREE.map(f => `<div class="pw-feat-item">· ${f}</div>`).join('')}
          </div>
          <div class="pw-feat-col paid">
            <div class="pw-feat-title">✦ 会员功能</div>
            ${FEATURES_PAID.map(f => `<div class="pw-feat-item">· ${f}</div>`).join('')}
          </div>
        </div>

        <div class="pw-plans" id="pw-plans">
          ${PLANS.map(p => `
            <div class="pw-plan ${p.highlight ? 'highlight' : ''} ${p.id === _selectedPlan.id ? 'selected' : ''}"
                 data-plan="${p.id}">
              ${p.badge ? `<div class="pw-plan-badge">${p.badge}</div>` : ''}
              <div class="pw-plan-left">
                <div class="pw-plan-name">${p.label}</div>
                <div class="pw-plan-sub">${p.sublabel}</div>
              </div>
              <div class="pw-plan-right">
                <div class="pw-plan-price">${p.price}</div>
                <div class="pw-plan-period">${p.period}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <button class="pw-btn" id="pw-buy-btn">立即订阅</button>
        <button class="pw-restore" id="pw-restore-btn">恢复购买记录</button>
        <div class="pw-msg" id="pw-msg"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    // 关闭
    document.getElementById('pw-close').addEventListener('click', closePaywall);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closePaywall();
    });

    // 选择套餐
    document.getElementById('pw-plans').addEventListener('click', function(e) {
      const card = e.target.closest('.pw-plan');
      if (!card) return;
      const planId = card.dataset.plan;
      _selectedPlan = PLANS.find(p => p.id === planId);
      document.querySelectorAll('.pw-plan').forEach(el => el.classList.remove('selected'));
      card.classList.add('selected');
    });

    // 购买
    document.getElementById('pw-buy-btn').addEventListener('click', handlePurchase);

    // 恢复购买
    document.getElementById('pw-restore-btn').addEventListener('click', handleRestore);
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

  // ─── 购买处理（RevenueCat SDK）────────────────────────
  async function handlePurchase() {
    setBtnLoading(true);
    setMsg('');

    try {
      // 确保 RC SDK 已加载
      await loadRCSDK();
      const Purchases = window.Purchases;
      if (!Purchases) throw new Error('RevenueCat SDK 未加载');

      // 配置 RC
      Purchases.configure({ apiKey: RC_API_KEY });

      // 获取用户 ID
      const userId = getUserId();
      if (userId) {
        try { await Purchases.logIn(userId); } catch(_) {}
      }

      // 获取 offerings
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) throw new Error('无法获取订阅套餐');

      // 找到对应 package
      const pkg = current.availablePackages.find(
        p => p.identifier === _selectedPlan.rcPackage
      );
      if (!pkg) throw new Error('找不到对应套餐，请稍后再试');

      // 发起购买
      const result = await Purchases.purchasePackage(pkg);

      if (result.customerInfo) {
        // 刷新付费状态
        _premiumCache = null;
        await checkPremium(true);
        setMsg('✓ 订阅成功，感谢支持！', 'success');
        setTimeout(() => {
          closePaywall();
          if (typeof _onGrantedCallback === 'function') _onGrantedCallback();
        }, 1200);
      }
    } catch(err) {
      if (err && err.userCancelled) {
        setMsg('已取消', '');
      } else {
        const msg = err && err.message ? err.message : String(err);
        setMsg('❌ ' + msg.slice(0, 60), 'error');
        console.error('Purchase error:', err);
      }
    } finally {
      setBtnLoading(false);
    }
  }

  // ─── 恢复购买 ─────────────────────────────────────────
  async function handleRestore() {
    const btn = document.getElementById('pw-restore-btn');
    if (btn) { btn.disabled = true; btn.textContent = '恢复中...'; }
    setMsg('');

    try {
      await loadRCSDK();
      const Purchases = window.Purchases;
      Purchases.configure({ apiKey: RC_API_KEY });

      const userId = getUserId();
      if (userId) {
        try { await Purchases.logIn(userId); } catch(_) {}
      }

      const customerInfo = await Purchases.restorePurchases();
      const entitlement = customerInfo.entitlements?.active?.['premium'];

      if (entitlement) {
        _premiumCache = null;
        await checkPremium(true);
        setMsg('✓ 购买记录已恢复', 'success');
        setTimeout(() => {
          closePaywall();
          if (typeof _onGrantedCallback === 'function') _onGrantedCallback();
        }, 1200);
      } else {
        setMsg('未找到有效的购买记录', '');
      }
    } catch(err) {
      const msg = err && err.message ? err.message : String(err);
      setMsg('❌ ' + msg.slice(0, 60), 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '恢复购买记录'; }
    }
  }

  // ─── 加载 RevenueCat JS SDK ───────────────────────────
  let _rcLoaded = false;
  function loadRCSDK() {
    if (_rcLoaded && window.Purchases) return Promise.resolve();
    return new Promise((resolve, reject) => {
      if (window.Purchases) { _rcLoaded = true; resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@revenuecat/purchases-js@latest/dist/index.js';
      script.onload = () => { _rcLoaded = true; resolve(); };
      script.onerror = () => reject(new Error('RevenueCat SDK 加载失败'));
      document.head.appendChild(script);
    });
  }

  // ─── 获取当前用户 ID ──────────────────────────────────
  function getUserId() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('supabase') && key.includes('auth')) {
          const val = JSON.parse(localStorage.getItem(key));
          return val?.user?.id || val?.session?.user?.id || null;
        }
      }
    } catch(_) {}
    return null;
  }

  // ─── 暴露全局 API ─────────────────────────────────────
  window.FreedPaywall = {
    checkPremium,
    requirePremium,
    showPaywall,
    closePaywall,
  };

  // 向后兼容
  window.checkPremium = checkPremium;
  window.requirePremium = requirePremium;

})();
