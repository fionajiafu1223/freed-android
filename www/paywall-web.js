// paywall-web.js — Android 版付费墙弹窗模块（Stripe 版）
// 引入方式：<script src="paywall-web.js"></script>
// 使用方式：requirePremium(callbackFn) — 若已付费直接执行回调，否则弹出付费墙
//           checkPremium() — 返回 Promise<boolean>
// 说明：UI 和 checkPremium() 逻辑与 iOS 端 paywall.js 保持一致，
//      购买流程从 RevenueCat 原生插件改为 Stripe Checkout（网页跳转）
// 版本：2026-07-26（安卓适配版：登录跳转目标改为 index.html，因安卓 App 内无 web.html）

(function() {
  'use strict';

  const WORKER_URL = 'https://api.freedreleasing.com';

  const PLANS = [
    { id:'monthly',   label:'月度会员', sublabel:'Monthly',   price:'¥8',  period:'/ 月', badge:null,        highlight:false },
    { id:'yearly',    label:'年度会员', sublabel:'Annual',    price:'¥68', period:'/ 年', badge:'最划算 省29%', highlight:true  },
    { id:'quarterly', label:'季度会员', sublabel:'Quarterly', price:'¥18', period:'/ 季', badge:'省25%',      highlight:false },
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
  let _paymentIssueCache = false;
  let _cacheTime = 0;
  const CACHE_TTL = 5 * 60 * 1000;
  let _selectedPlan = PLANS[0];
  let _onGrantedCallback = null;

  // ─── 与 App 端完全一致：从 localStorage 读 Supabase token ───
  function getToken() {
    try {
      const direct = localStorage.getItem('sb-ryoaxziysgdkjcjiuqti-auth-token');
      if (direct) {
        const val = JSON.parse(direct);
        const token = val?.access_token || val?.session?.access_token;
        if (token) return token;
      }
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

  // ─── 与 App 端完全一致：查询 /subscription/status ───
  async function checkPremium(forceRefresh) {
    const now = Date.now();
    if (!forceRefresh && _premiumCache !== null && (now - _cacheTime) < CACHE_TTL) return _premiumCache;
    const token = getToken();
    if (!token) { _premiumCache = false; _paymentIssueCache = false; _cacheTime = now; return false; }
    try {
      const res = await fetch(`${WORKER_URL}/subscription/status`, {
        method: 'GET', headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) { _premiumCache = false; _paymentIssueCache = false; _cacheTime = now; return false; }
      const data = await res.json();
      _premiumCache = data.is_premium === true;
      _paymentIssueCache = data.payment_issue === true;
      _cacheTime = now;
      return _premiumCache;
    } catch(_) { _premiumCache = false; _paymentIssueCache = false; _cacheTime = now; return false; }
  }

  // 是否存在扣款问题（需先调用过 checkPremium，缓存共享）
  function hasPaymentIssue() {
    return _paymentIssueCache;
  }

  // ─── 跳转到 Stripe Customer Portal，管理/取消订阅 ───────
  async function openManageSubscription() {
    const token = getToken();
    if (!token) {
      const redirect = encodeURIComponent(window.location.href);
      window.location.href = 'index.html?login=1&redirect=' + redirect;
      return;
    }
    try {
      const res = await fetch(`${WORKER_URL}/stripe/create-portal-session`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || '无法打开订阅管理页面');
      }
      window.location.href = data.url;
    } catch (err) {
      alert('打开订阅管理失败：' + (err && err.message ? err.message : '请稍后再试'));
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

  function injectStyles() {
    if (document.getElementById('pw-styles')) return;
    const style = document.createElement('style');
    style.id = 'pw-styles';
    style.textContent = `
      #pw-overlay {
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(0,10,30,0.45);
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
        animation: pwFadeIn 0.22s ease;
      }
      @keyframes pwFadeIn { from{opacity:0} to{opacity:1} }
      #pw-sheet {
        width: 100%; max-width: 420px;
        background: rgba(8,28,70,0.92);
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
        background: rgba(255,255,255,0.30); border: none;
        color: rgba(10,50,90,0.75); font-size: 0.85rem;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background 0.15s;
      }
      #pw-close:hover { background: rgba(255,255,255,0.50); }
      #pw-sheet h2 {
        text-align: center; font-size: 1.05rem; letter-spacing: 0.14em;
        color: rgba(235,245,255,0.97); margin-bottom: 3px;
      }
      #pw-sheet .pw-sub {
        text-align: center; font-size: 0.74rem; color: rgba(220,235,250,0.75);
        font-family: 'Noto Sans SC', sans-serif; margin-bottom: 14px; letter-spacing: 0.04em;
      }

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
      .pw-plan.selected { border: 2px solid #4a9fd4 !important; background: #b8dff5 !important; }
      .pw-plan.highlight { background: #ffffff; }
      .pw-plan.highlight.selected { border: 2px solid #4a9fd4 !important; background: #b8dff5 !important; }

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

      .pw-trial-note {
        text-align: center; font-size: 0.62rem; color: rgba(220,235,250,0.65);
        font-family: 'Noto Sans SC', sans-serif; margin-bottom: 10px;
      }
      .pw-btn {
        width: 100%; padding: 12px; border: none; border-radius: 12px;
        background: linear-gradient(135deg, #4a9fd4, #3ab8a0);
        color: #fff; font-size: 0.92rem; letter-spacing: 0.08em;
        font-family: 'Noto Sans SC', sans-serif; cursor: pointer;
        box-shadow: 0 4px 16px rgba(58,140,184,0.35);
        transition: opacity 0.15s;
      }
      .pw-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .pw-msg {
        text-align: center; font-size: 0.7rem; margin-top: 8px;
        font-family: 'Noto Sans SC', sans-serif; min-height: 16px;
      }
      .pw-msg.error { color: #ff8a8a; }
      .pw-msg.success { color: #7be0c0; }
    `;
    document.head.appendChild(style);
  }

  function showPaywall(onGranted) {
    injectStyles();
    _onGrantedCallback = onGranted;
    _selectedPlan = PLANS[0];

    const overlay = document.createElement('div');
    overlay.id = 'pw-overlay';
    overlay.innerHTML = `
      <div id="pw-sheet">
        <button id="pw-close">✕</button>
        <h2>解锁全部功能</h2>
        <div class="pw-sub">订阅会员，开启完整释放之旅</div>

        <div class="pw-features">
          <div class="pw-feat-col free">
            <div class="pw-feat-title">免费</div>
            ${FEATURES_FREE.map(f => `<div class="pw-feat-item">· ${f}</div>`).join('')}
          </div>
          <div class="pw-feat-col paid">
            <div class="pw-feat-title">会员专享</div>
            <div class="pw-paid-groups">
              <div class="pw-paid-col">
                ${FEATURES_PAID_LEFT.map(g => `
                  <div class="pw-paid-group">
                    <div class="pw-paid-group-label">${g.label}</div>
                    ${g.items.map(i => `<div class="pw-paid-group-item">${i}</div>`).join('')}
                  </div>`).join('')}
              </div>
              <div class="pw-paid-col">
                ${FEATURES_PAID_RIGHT.map(g => `
                  <div class="pw-paid-group">
                    <div class="pw-paid-group-label">${g.label}</div>
                    ${g.items.map(i => `<div class="pw-paid-group-item">${i}</div>`).join('')}
                  </div>`).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="pw-plans" id="pw-plans">
          ${PLANS.map(p => `
            <div class="pw-plan ${p.highlight ? 'highlight' : ''} ${p.id === _selectedPlan.id ? 'selected' : ''}" data-plan="${p.id}">
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
        <div class="pw-trial-note">7天免费试用，到期后自动续费，<span id="pw-manage-link" style="text-decoration:underline;cursor:pointer;">可随时取消</span></div>
        <button class="pw-btn" id="pw-buy-btn">立即订阅</button>
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
    const manageLink = document.getElementById('pw-manage-link');
    if (manageLink) manageLink.addEventListener('click', openManageSubscription);

    // 处理 Stripe 跳转回来后的 URL 参数（支付成功/取消提示）
    handleStripeReturnParams();
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
    btn.textContent = loading ? '跳转中...' : '立即订阅';
  }

  // ─── 核心变化：购买改为调用 Worker 创建 Stripe Checkout Session，再跳转 ───
  async function handlePurchase() {
    setBtnLoading(true); setMsg('');
    try {
      const token = getToken();
      if (!token) {
        // 未登录，跳回网页版主页登录（与 App 端 requireLogin 逻辑一致）
        const redirect = encodeURIComponent(window.location.href);
        window.location.href = 'index.html?login=1&redirect=' + redirect;
        return;
      }

      const res = await fetch(`${WORKER_URL}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: _selectedPlan.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || '创建订单失败');
      }
      // 跳转到 Stripe 官方付款页面（离开本站，付款完成后会跳回来）
      window.location.href = data.url;
    } catch (err) {
      setMsg('❌ ' + (err && err.message ? err.message : '发生未知错误'), 'error');
      setBtnLoading(false);
    }
  }

  // ─── 处理从 Stripe 跳转回来后的状态（URL 带 ?stripe_success=1 或 ?stripe_cancel=1）───
  function handleStripeReturnParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_success') === '1') {
      setMsg('✓ 支付成功，正在确认订阅状态...', 'success');
      // Webhook 写入 Supabase 可能有几秒延迟，轮询确认
      pollPremiumStatus();
    } else if (params.get('stripe_cancel') === '1') {
      setMsg('已取消支付', '');
    }
  }

  // 支付成功后轮询确认 is_premium 状态（最多等10秒，每2秒查一次）
  async function pollPremiumStatus(attempt) {
    attempt = attempt || 0;
    const isPremium = await checkPremium(true);
    if (isPremium) {
      setMsg('✓ 订阅成功，感谢支持！', 'success');
      setTimeout(() => {
        closePaywall();
        if (typeof _onGrantedCallback === 'function') _onGrantedCallback();
        // 清除 URL 参数，避免刷新页面重复触发
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }, 1200);
      return;
    }
    if (attempt < 5) {
      setTimeout(() => pollPremiumStatus(attempt + 1), 2000);
    } else {
      setMsg('支付已收到，正在处理中，请稍后刷新页面查看', '');
    }
  }

  // ─── 登录检查：未登录跳回网页版主页弹登录框 ───────────────────
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

  // ─── 扣款失败提示横幅 ───────────────────────────────
  // 在需要的页面调用 showPaymentIssueBannerIfNeeded()，会自动查一次状态，
  // 如果存在扣款问题就在页面顶部插入一条可点击的提示条
  function injectBannerStyles() {
    if (document.getElementById('pw-banner-styles')) return;
    const style = document.createElement('style');
    style.id = 'pw-banner-styles';
    style.textContent = `
      #pw-payment-banner {
        position: fixed; top: 0; left: 0; right: 0; z-index: 9998;
        background: linear-gradient(90deg, #e0654a, #d4493a);
        color: #fff; text-align: center;
        padding: 10px 16px;
        font-family: 'Noto Sans SC', sans-serif; font-size: 0.78rem;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.18);
      }
      #pw-payment-banner span { text-decoration: underline; }
    `;
    document.head.appendChild(style);
  }

  async function showPaymentIssueBannerIfNeeded() {
    await checkPremium();
    if (!hasPaymentIssue()) return;
    if (document.getElementById('pw-payment-banner')) return;
    injectBannerStyles();
    const banner = document.createElement('div');
    banner.id = 'pw-payment-banner';
    banner.innerHTML = '⚠️ 您的扣款遇到问题，订阅可能即将失效 — <span>点击更新支付方式</span>';
    banner.addEventListener('click', openManageSubscription);
    document.body.prepend(banner);
  }

  window.FreedPaywall = {
    checkPremium, requirePremium, showPaywall, closePaywall,
    requireLogin, requireLoginAndPremium,
    hasPaymentIssue, openManageSubscription, showPaymentIssueBannerIfNeeded,
  };
  window.checkPremium = checkPremium;
  window.requirePremium = requirePremium;
  window.requireLogin = requireLogin;
  window.requireLoginAndPremium = requireLoginAndPremium;
  window.openManageSubscription = openManageSubscription;

  // 页面加载时，如果 URL 带 Stripe 回跳参数，自动弹出付费墙显示结果
  document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_success') === '1' || params.get('stripe_cancel') === '1') {
      showPaywall(null);
    }
  });

})();
