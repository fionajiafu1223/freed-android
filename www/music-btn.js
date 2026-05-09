// music-btn.js — clean rewrite based on sidebar.js fr-prefixed system
// All music functions exposed as window.fr* so onclick handlers in HTML work.
(function () {

  // ═════════════════════════════════════════════════════
  //  INJECT CSS
  // ═════════════════════════════════════════════════════
  var styleEl = document.createElement('style');
  styleEl.textContent = `  /* ── MUSIC BUTTON & PANEL ── */
  .fr-music-btn {
    position: fixed; top: 16px; right: 16px; z-index: 9000;
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(255,255,255,0.2); backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1.5px solid rgba(255,255,255,0.35);
    color: #fff; font-size: 1rem; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 14px rgba(0,40,100,0.18);
    transition: transform 0.2s, background 0.2s;
  }
  .fr-music-btn:hover { transform: scale(1.1); background: rgba(255,255,255,0.32); }
  .fr-music-btn.playing { background: rgba(100,190,255,0.28); border-color: rgba(160,225,255,0.55); }
  .fr-music-btn.playing .fr-music-icon { display: inline-block; animation: frMusicRotate 4s linear infinite; }
  @keyframes frMusicRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .fr-music-panel {
    position: fixed; top: 64px; right: 12px; z-index: 9250;
    width: min(390px, 90vw);
    background: rgba(22,48,100,0.93); backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.14); border-radius: 20px;
    box-shadow: 0 12px 40px rgba(0,20,70,0.55);
    padding: 16px 14px 14px;
    max-height: min(75vh, 560px); overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    opacity: 0; pointer-events: none; visibility: hidden;
    transform: translateY(-8px) scale(0.97);
    transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
  }
  .fr-music-panel.open { opacity: 1; pointer-events: auto; visibility: visible; transform: translateY(0) scale(1); }
  .fr-music-panel-title { display: block; font-family: 'Noto Serif SC', serif; font-size: 0.8rem; color: rgba(200,220,255,0.65); letter-spacing: 0.22em; text-align: center; margin-bottom: 12px; }
  .fr-music-tracks { display: flex; flex-direction: column; gap: 8px; }
  .fr-music-track { display: flex; align-items: center; gap: 14px; padding: 13px 14px; border-radius: 12px; cursor: pointer; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); transition: background 0.18s, border-color 0.18s; }
  .fr-music-track:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.18); }
  .fr-music-track.active { background: rgba(60,120,220,0.3); border-color: rgba(120,180,255,0.4); }
  .fr-music-track-icon { font-size: 1.5rem; width: 36px; text-align: center; flex-shrink: 0; }
  .fr-music-track-info { flex: 1; min-width: 0; }
  .fr-music-play-btn { flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; border: none; background: rgba(255,255,255,0.14); color: rgba(220,240,255,0.9); font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.18s, transform 0.12s; }
  .fr-music-play-btn:hover { background: rgba(255,255,255,0.26); transform: scale(1.1); }
  .fr-music-play-btn.playing { background: rgba(60,120,220,0.55); color: rgba(200,230,255,1); }
  .fr-music-track-name { font-family: 'Noto Sans SC', sans-serif; font-size: 0.9rem; font-weight: 400; color: rgba(230,245,255,0.95); letter-spacing: 0.03em; }
  .fr-music-track-desc { display: block; font-size: 0.68rem; color: rgba(170,200,255,0.55); margin-top: 2px; letter-spacing: 0.02em; }
  .fr-music-playing-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(140,220,255,0.9); animation: frDotPulse 1.4s ease-in-out infinite; flex-shrink: 0; }
  @keyframes frDotPulse { 0%,100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
  .fr-music-volume-row { display: flex; align-items: center; gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.12); }
  .fr-music-vol-icon { font-size: 1.1rem; color: rgba(180,220,255,0.6); }
  .fr-music-volume { flex: 1; -webkit-appearance: none; appearance: none; height: 3px; border-radius: 2px; outline: none; cursor: pointer; background: rgba(255,255,255,0.2); }
  .fr-music-volume::-webkit-slider-thumb { -webkit-appearance: none; width: 13px; height: 13px; border-radius: 50%; background: rgba(220,240,255,0.9); box-shadow: 0 1px 5px rgba(0,40,100,0.35); cursor: pointer; }
  .fr-music-source-tabs { display: flex; gap: 4px; background: rgba(0,0,0,0.18); border-radius: 12px; padding: 4px; margin-bottom: 14px; }
  .fr-music-source-tab { flex: 1; padding: 7px 4px; border-radius: 9px; border: none; font-family: 'Noto Sans SC', sans-serif; font-size: 0.7rem; color: rgba(170,200,255,0.65); cursor: pointer; background: none; transition: all 0.18s ease; letter-spacing: 0.02em; text-align: center; line-height: 1.3; }
  .fr-music-source-tab.active { background: rgba(60,120,220,0.42); color: rgba(220,240,255,0.95); box-shadow: 0 1px 6px rgba(0,20,80,0.3); }
  .fr-music-source-tab:hover:not(.active) { color: rgba(200,230,255,0.85); }
  .fr-music-source-panel { display: none; }
  .fr-music-source-panel.active { display: block; }
  .fr-music-import-zone { border: 1.5px dashed rgba(100,160,220,0.35); border-radius: 14px; padding: 18px 14px; text-align: center; cursor: pointer; transition: all 0.2s ease; margin-bottom: 10px; background: rgba(255,255,255,0.04); }
  .fr-music-import-zone:hover { border-color: rgba(140,200,255,0.6); background: rgba(255,255,255,0.08); }
  .fr-music-import-zone.dragover { border-color: rgba(140,200,255,0.8); background: rgba(60,120,220,0.15); }
  .fr-music-import-icon { font-size: 1.6rem; margin-bottom: 6px; }
  .fr-music-import-text { font-size: 0.76rem; color: rgba(170,200,255,0.7); line-height: 1.5; }
  .fr-music-import-sub { font-size: 0.65rem; color: rgba(120,160,210,0.5); margin-top: 3px; }
  .fr-music-imported-list { display: flex; flex-direction: column; gap: 7px; }
  .fr-music-imported-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09); cursor: pointer; transition: background 0.16s; }
  .fr-music-imported-item:hover { background: rgba(255,255,255,0.11); }
  .fr-music-imported-item.active { background: rgba(60,120,220,0.28); border-color: rgba(100,180,255,0.35); }
  .fr-music-imported-name { flex: 1; font-size: 0.8rem; color: rgba(210,235,255,0.88); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Noto Sans SC', sans-serif; }
  .fr-music-imported-del { background: none; border: none; color: rgba(180,200,230,0.4); font-size: 0.9rem; cursor: pointer; padding: 2px 4px; transition: color 0.15s; flex-shrink: 0; line-height: 1; }
  .fr-music-imported-del:hover { color: rgba(255,120,120,0.8); }
  .fr-music-import-empty { font-size: 0.74rem; color: rgba(120,160,200,0.5); text-align: center; padding: 8px 0; font-family: 'Noto Sans SC', sans-serif; }
  .fr-music-record-panel { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 8px 0 4px; }
  .fr-record-btn-wrap { position: relative; }
  .fr-record-btn { width: 68px; height: 68px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; background: radial-gradient(circle at 38% 35%, rgba(255,120,120,0.85), rgba(180,30,30,0.75)); box-shadow: 0 4px 18px rgba(180,30,30,0.4); transition: transform 0.18s, box-shadow 0.18s; }
  .fr-record-btn:hover { transform: scale(1.06); }
  .fr-record-btn.recording { background: radial-gradient(circle at 38% 35%, rgba(255,60,60,0.9), rgba(160,10,10,0.85)); animation: frRecordPulse 1.4s ease-in-out infinite; }
  @keyframes frRecordPulse { 0%,100% { box-shadow: 0 4px 18px rgba(180,30,30,0.4), 0 0 0 0 rgba(220,60,60,0.35); } 50% { box-shadow: 0 4px 24px rgba(220,30,30,0.6), 0 0 0 14px rgba(220,60,60,0); } }
  .fr-record-btn.has-recording { background: radial-gradient(circle at 38% 35%, rgba(80,180,120,0.88), rgba(20,100,60,0.78)); box-shadow: 0 4px 18px rgba(20,120,70,0.4); }
  .fr-record-status { font-size: 0.76rem; color: rgba(180,220,255,0.7); font-family: 'Noto Sans SC', sans-serif; text-align: center; letter-spacing: 0.04em; }
  .fr-record-timer { font-size: 1.5rem; font-family: 'Noto Serif SC', serif; color: rgba(220,240,255,0.9); letter-spacing: 0.1em; min-height: 2rem; display: flex; align-items: center; justify-content: center; }
  .fr-record-timer.active { color: rgba(255,140,140,0.95); }
  .fr-record-waveform { width: 100%; height: 40px; display: flex; align-items: center; justify-content: center; gap: 2px; }
  .fr-record-wave-bar { width: 3px; background: rgba(100,180,255,0.45); border-radius: 2px; transition: height 0.06s ease; min-height: 3px; }
  .fr-record-actions { display: flex; gap: 10px; width: 100%; }
  .fr-record-action-btn { flex: 1; padding: 9px; border-radius: 12px; border: none; font-family: 'Noto Serif SC', serif; font-size: 0.8rem; cursor: pointer; transition: opacity 0.18s, transform 0.12s; }
  .fr-record-action-btn:hover { opacity: 0.85; transform: scale(1.03); }
  .fr-record-play-btn { background: rgba(60,120,220,0.45); color: rgba(220,240,255,0.92); border: 1px solid rgba(100,180,255,0.25); }
  .fr-record-save-btn { background: linear-gradient(135deg, rgba(60,180,120,0.8), rgba(20,120,70,0.8)); color: rgba(220,255,235,0.95); }
  .fr-record-discard-btn { background: rgba(255,255,255,0.06); color: rgba(180,200,230,0.6); border: 1px solid rgba(255,255,255,0.1); }
  .fr-record-hint { font-size: 0.66rem; color: rgba(100,150,200,0.5); font-family: 'Noto Sans SC', sans-serif; text-align: center; line-height: 1.6; }
  .fr-record-bg-section { width: 100%; margin-bottom: 6px; }
  .fr-record-bg-label { font-size: 0.68rem; color: rgba(140,180,220,0.7); font-family: 'Noto Sans SC', sans-serif; letter-spacing: 0.06em; margin-bottom: 8px; }
  .fr-record-bg-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 8px; }
  .fr-record-bg-item { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 7px 4px; border-radius: 10px; cursor: pointer; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09); transition: all 0.16s ease; }
  .fr-record-bg-item:hover { background: rgba(255,255,255,0.11); }
  .fr-record-bg-item.active { background: rgba(60,120,220,0.35); border-color: rgba(100,180,255,0.45); }
  .fr-record-bg-icon { font-size: 1.2rem; }
  .fr-record-bg-name { font-size: 0.62rem; color: rgba(180,210,255,0.75); font-family: 'Noto Sans SC', sans-serif; text-align: center; }
  .fr-record-bg-vol-row { display: flex; align-items: center; gap: 8px; padding: 6px 2px; }

`;
  document.head.appendChild(styleEl);

  // ═════════════════════════════════════════════════════
  //  INJECT HTML
  // ═════════════════════════════════════════════════════
  var wrap = document.createElement('div');
  wrap.innerHTML = `    <button class="fr-music-btn" id="frMusicBtn" onclick="frToggleMusicPanel()" title="背景音乐">
      <svg class="fr-music-icon" viewBox="0 0 20 22" width="16" height="18" fill="rgba(255,255,255,0.78)" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 17.5c0 1.38-1.12 2.5-2.5 2.5S2 18.88 2 17.5 3.12 15 4.5 15c.56 0 1.08.19 1.5.5V6.5l9-2v8.5c-.42-.31-.94-.5-1.5-.5-1.38 0-2.5 1.12-2.5 2.5S12.12 17 13.5 17 16 15.88 16 14.5V3L7 5.2V17.5z"/>
      </svg>
    </button>

    <!-- Music Panel -->
    <div class="fr-music-panel" id="frMusicPanel">
      <div class="fr-music-panel-title">背 景 音 乐</div>
      <div class="fr-music-source-tabs">
        <button class="fr-music-source-tab active" id="frMsrc-builtin" onclick="frSwitchMusicSource('builtin')">🎵 App内置</button>
        <button class="fr-music-source-tab" id="frMsrc-import" onclick="frSwitchMusicSource('import')">📁 本地导入</button>
        <button class="fr-music-source-tab" id="frMsrc-record" onclick="frSwitchMusicSource('record')">🎙️ 录制背景音</button>
      </div>
      <div class="fr-music-source-panel active" id="frMpanel-builtin">
        <div class="fr-music-tracks">
          <div class="fr-music-track" data-track="bowl"><span class="fr-music-track-icon">🔔</span><div class="fr-music-track-info"><div class="fr-music-track-name">冥想钵</div><span class="fr-music-track-desc">396Hz · 释放恐惧</span></div><button class="fr-music-play-btn" onclick="frSelectTrack('bowl')">▶</button></div>
          <div class="fr-music-track" data-track="deepbowl"><span class="fr-music-track-icon">🎐</span><div class="fr-music-track-info"><div class="fr-music-track-name">颂钵冥想</div><span class="fr-music-track-desc">三钵共鸣 · 深度放松</span></div><button class="fr-music-play-btn" onclick="frSelectTrack('deepbowl')">▶</button></div>
          <div class="fr-music-track" data-track="hz528"><span class="fr-music-track-icon">💚</span><div class="fr-music-track-info"><div class="fr-music-track-name">528Hz 疗愈</div><span class="fr-music-track-desc">爱的频率 · DNA修复</span></div><button class="fr-music-play-btn" onclick="frSelectTrack('hz528')">▶</button></div>
          <div class="fr-music-track" data-track="awaken"><span class="fr-music-track-icon">✨</span><div class="fr-music-track-info"><div class="fr-music-track-name">963Hz 觉醒</div><span class="fr-music-track-desc">松果体 · 灵性连接</span></div><button class="fr-music-play-btn" onclick="frSelectTrack('awaken')">▶</button></div>
          <div class="fr-music-track" data-track="schumann"><span class="fr-music-track-icon">🌍</span><div class="fr-music-track-info"><div class="fr-music-track-name">舒曼共振</div><span class="fr-music-track-desc">7.83Hz · 地球脑波</span></div><button class="fr-music-play-btn" onclick="frSelectTrack('schumann')">▶</button></div>
          <div class="fr-music-track" data-track="deep"><span class="fr-music-track-icon">🌌</span><div class="fr-music-track-info"><div class="fr-music-track-name">432Hz 深空</div><span class="fr-music-track-desc">自然律 · 宇宙共鸣</span></div><button class="fr-music-play-btn" onclick="frSelectTrack('deep')">▶</button></div>
          <div class="fr-music-track" data-track="piano"><span class="fr-music-track-icon">🎹</span><div class="fr-music-track-info"><div class="fr-music-track-name">528调式钢琴</div><span class="fr-music-track-desc">五声音阶 · 宁静</span></div><button class="fr-music-play-btn" onclick="frSelectTrack('piano')">▶</button></div>
          <div class="fr-music-track" data-track="rain"><span class="fr-music-track-icon">🌧️</span><div class="fr-music-track-info"><div class="fr-music-track-name">夜雨</div><span class="fr-music-track-desc">细密雨声 · 静谧</span></div><button class="fr-music-play-btn" onclick="frSelectTrack('rain')">▶</button></div>
          <div class="fr-music-track" data-track="ocean"><span class="fr-music-track-icon">🌊</span><div class="fr-music-track-info"><div class="fr-music-track-name">海浪</div><span class="fr-music-track-desc">潮汐呼吸 · 放松</span></div><button class="fr-music-play-btn" onclick="frSelectTrack('ocean')">▶</button></div>
          <div class="fr-music-track" data-track="water"><span class="fr-music-track-icon">💧</span><div class="fr-music-track-info"><div class="fr-music-track-name">山涧流水</div><span class="fr-music-track-desc">溪流 · 清澈</span></div><button class="fr-music-play-btn" onclick="frSelectTrack('water')">▶</button></div>
        </div>
      </div>
      <div class="fr-music-source-panel" id="frMpanel-import">
        <div class="fr-music-import-zone" id="frImportDropZone"
             onclick="document.getElementById('frImportFileInput').click()"
             ondragover="frHandleImportDragOver(event)"
             ondragleave="frHandleImportDragLeave(event)"
             ondrop="frHandleImportDrop(event)">
          <div class="fr-music-import-icon">🎵</div>
          <div class="fr-music-import-text">点击选择音乐文件<br>或将文件拖拽至此</div>
          <div class="fr-music-import-sub">支持 MP3 · WAV · AAC · OGG · FLAC</div>
        </div>
        <input type="file" id="frImportFileInput" accept="audio/*" multiple style="display:none" onchange="frHandleImportFile(this.files)">
        <div class="fr-music-imported-list" id="frImportedList">
          <div class="fr-music-import-empty">还没有导入的音乐</div>
        </div>
      </div>
      <div class="fr-music-source-panel" id="frMpanel-record">
        <div class="fr-music-record-panel">
          <div class="fr-record-bg-section">
            <div class="fr-record-bg-label">① 选择混音背景（可跳过）</div>
            <div class="fr-record-bg-grid" id="frRecordBgGrid">
              <div class="fr-record-bg-item" data-track="" onclick="frSelectRecordBg(this,'')"><span class="fr-record-bg-icon">🔇</span><span class="fr-record-bg-name">纯人声</span></div>
              <div class="fr-record-bg-item" data-track="bowl" onclick="frSelectRecordBg(this,'bowl')"><span class="fr-record-bg-icon">🔔</span><span class="fr-record-bg-name">冥想钵</span></div>
              <div class="fr-record-bg-item" data-track="deepbowl" onclick="frSelectRecordBg(this,'deepbowl')"><span class="fr-record-bg-icon">🎐</span><span class="fr-record-bg-name">颂钵</span></div>
              <div class="fr-record-bg-item" data-track="hz528" onclick="frSelectRecordBg(this,'hz528')"><span class="fr-record-bg-icon">💚</span><span class="fr-record-bg-name">528Hz</span></div>
              <div class="fr-record-bg-item" data-track="awaken" onclick="frSelectRecordBg(this,'awaken')"><span class="fr-record-bg-icon">✨</span><span class="fr-record-bg-name">963Hz</span></div>
              <div class="fr-record-bg-item" data-track="schumann" onclick="frSelectRecordBg(this,'schumann')"><span class="fr-record-bg-icon">🌍</span><span class="fr-record-bg-name">舒曼</span></div>
              <div class="fr-record-bg-item" data-track="deep" onclick="frSelectRecordBg(this,'deep')"><span class="fr-record-bg-icon">🌌</span><span class="fr-record-bg-name">432Hz</span></div>
              <div class="fr-record-bg-item" data-track="piano" onclick="frSelectRecordBg(this,'piano')"><span class="fr-record-bg-icon">🎹</span><span class="fr-record-bg-name">钢琴</span></div>
              <div class="fr-record-bg-item" data-track="rain" onclick="frSelectRecordBg(this,'rain')"><span class="fr-record-bg-icon">🌧️</span><span class="fr-record-bg-name">夜雨</span></div>
              <div class="fr-record-bg-item" data-track="ocean" onclick="frSelectRecordBg(this,'ocean')"><span class="fr-record-bg-icon">🌊</span><span class="fr-record-bg-name">海浪</span></div>
              <div class="fr-record-bg-item" data-track="water" onclick="frSelectRecordBg(this,'water')"><span class="fr-record-bg-icon">💧</span><span class="fr-record-bg-name">流水</span></div>
            </div>
            <div class="fr-record-bg-vol-row" id="frRecordBgVolRow" style="display:none;">
              <span style="font-size:0.68rem;color:rgba(140,180,220,0.7);">背景音量</span>
              <input type="range" class="fr-music-volume" id="frRecordBgVol" min="0" max="100" value="40" oninput="frUpdateRecordBgVol(this.value)" style="flex:1;">
              <span style="font-size:0.68rem;color:rgba(140,180,220,0.7);" id="frRecordBgVolNum">40%</span>
            </div>
          </div>
          <div class="fr-record-bg-label">② 录制</div>
          <div class="fr-record-waveform" id="frRecordWaveform"></div>
          <div class="fr-record-timer" id="frRecordTimer">00:00</div>
          <div class="fr-record-btn-wrap">
            <button class="fr-record-btn" id="frRecordBtn" onclick="frToggleRecord()">🎙️</button>
          </div>
          <div class="fr-record-status" id="frRecordStatus">选好背景后点击开始录制</div>
          <div class="fr-record-actions" id="frRecordActions" style="display:none;">
            <button class="fr-record-action-btn fr-record-play-btn" onclick="frPlayRecording()">▶ 试听</button>
            <button class="fr-record-action-btn fr-record-save-btn" onclick="frSaveRecording()">💾 保存使用</button>
            <button class="fr-record-action-btn fr-record-discard-btn" onclick="frDiscardRecording()">✕ 丢弃</button>
          </div>
          <div class="fr-record-hint">录制时麦克风声音与背景音将混合为一个文件</div>
        </div>
      </div>
      <div class="fr-music-volume-row">
        <span class="fr-music-vol-icon">🔉</span>
        <input type="range" class="fr-music-volume" id="frMusicVolume" min="0" max="100" value="50" oninput="frSetMusicVolume(this.value)">
        <span class="fr-music-vol-icon">🔊</span>
      </div>
    </div>
`;
  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

  // Helper toast function (some music functions use frShowToast)
  function frShowToast(msg) {
    var el = document.getElementById('frMusicToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'frMusicToast';
      el.style.cssText = 'position:fixed;bottom:40px;left:50%;transform:translateX(-50%);background:rgba(10,40,80,0.85);color:#fff;padding:10px 20px;border-radius:99px;font-size:0.85rem;z-index:99999;transition:opacity 0.4s;pointer-events:none;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.style.opacity = '0'; }, 2500);
  }

  // ═════════════════════════════════════════════════════
  //  MUSIC SYSTEM (extracted from sidebar.js)
  // ═════════════════════════════════════════════════════
  var frAudioCtx = null;
  var frMasterGain = null;
  var frCurrentTrack = null;
  var frMusicStopFns = [];
  var frMusicPlaying = false;
  var frMusicPanelOpen = false;
  var frCurrentImportId = null;
  var frImportedTracks = [];
  var frImportAudioEl = null;
  var frRecordingActive = false;
  var frRecordBlob = null;
  var frRecordObjectUrl = null;
  var frRecordTimerSec = 0;
  var frRecordTimerInt = null;
  var frRecordAnalyser = null;
  var frRecordAnimFrame = null;
  var frRecordMicStream = null;
  var frRecordBgTrack = '';
  var frRecordBgGainNode = null;
  var frRecordBgStopFn = null;
  var frMediaRecorder = null;
  var frRecordChunks = [];
  var frRecordPreviewEl = null;

  function frUnlockAudio() {
    if (!frAudioCtx) return;
    var buf = frAudioCtx.createBuffer(1, 1, frAudioCtx.sampleRate);
    var src = frAudioCtx.createBufferSource();
    src.buffer = buf; src.connect(frAudioCtx.destination); src.start(0);
  }

  function frStopAllMusic() {
    frMusicStopFns.forEach(function(fn) { try { fn(); } catch(_) {} });
    frMusicStopFns = [];
    frMusicPlaying = false;
    var btn = document.getElementById('frMusicBtn');
    if (btn) btn.classList.remove('playing');
    document.querySelectorAll('.fr-music-track').forEach(function(t) {
      t.classList.remove('active');
      var pb = t.querySelector('.fr-music-play-btn');
      if (pb) { pb.textContent = '▶'; pb.classList.remove('playing'); }
    });
  }

  function frSetMusicVolume(v) {
    if (frMasterGain && frAudioCtx) frMasterGain.gain.setTargetAtTime(v / 100, frAudioCtx.currentTime, 0.05);
    var slider = document.getElementById('frMusicVolume');
    if (slider) slider.style.background = 'linear-gradient(to right,rgba(140,210,255,0.85) 0%,rgba(140,210,255,0.85) ' + v + '%,rgba(255,255,255,0.18) ' + v + '%)';
    if (frImportAudioEl) frImportAudioEl.volume = v / 100;
  }
  window.frSetMusicVolume = frSetMusicVolume;

  function frMakeMasterChain(ctx, dest, preGain) {
    var pre = ctx.createGain(); pre.gain.value = preGain || 1.0;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 10; comp.ratio.value = 6;
    comp.attack.value = 0.003; comp.release.value = 0.3;
    var g = ctx.createGain(); g.gain.value = 0.65;
    pre.connect(comp); comp.connect(g); g.connect(dest);
    return pre;
  }

  function frPlayBowl() {
    var ctx = frAudioCtx, chain = frMakeMasterChain(ctx, frMasterGain, 1.2);
    var freqs = [99,132,198,264,396,528,594], stopped = false, idx = 0, timers = [];
    function strike(freq) {
      var now = ctx.currentTime;
      [[1,0.42],[2.756,0.12],[5.04,0.04]].forEach(function(p) {
        var osc = ctx.createOscillator(), g = ctx.createGain();
        osc.type='sine'; osc.frequency.value = freq*p[0];
        g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(p[1],now+0.012);
        g.gain.exponentialRampToValueAtTime(0.0001,now+(p[0]===1?7:p[0]<3?4:2));
        osc.connect(g); g.connect(chain); osc.start(now); osc.stop(now+(p[0]===1?7.2:4.5));
      });
    }
    function schedule() { if(stopped)return; strike(freqs[idx++%freqs.length]); timers.push(setTimeout(schedule,3800+Math.random()*2200)); }
    schedule();
    frMusicStopFns.push(function(){ stopped=true; timers.forEach(clearTimeout); try{chain.disconnect();}catch(_){} });
  }

  function frPlay528() {
    var ctx = frAudioCtx, chain = frMakeMasterChain(ctx, frMasterGain, 0.55), nodes = [];
    [[528,0.28],[1056,0.08],[264,0.12],[792,0.06]].forEach(function(p) {
      var osc=ctx.createOscillator(), g=ctx.createGain(), lfo=ctx.createOscillator(), lfoG=ctx.createGain();
      osc.type='sine'; osc.frequency.value=p[0]; g.gain.value=p[1];
      lfo.type='sine'; lfo.frequency.value=0.06+Math.random()*0.04; lfoG.gain.value=p[1]*0.12;
      lfo.connect(lfoG); lfoG.connect(g.gain); lfo.start(); osc.start();
      osc.connect(g); g.connect(chain); nodes.push(osc,g,lfo,lfoG);
    });
    frMusicStopFns.push(function(){ nodes.forEach(function(n){try{if(n.stop)n.stop();}catch(_){} try{n.disconnect();}catch(_){}}); try{chain.disconnect();}catch(_){} });
  }

  function frPlayWater() {
    var ctx=frAudioCtx, chain=frMakeMasterChain(ctx,frMasterGain,1.0), sr=ctx.sampleRate;
    var buf=ctx.createBuffer(2,sr*4,sr);
    for(var ch=0;ch<2;ch++){var d=buf.getChannelData(ch),b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;for(var i=0;i<d.length;i++){var w=Math.random()*2-1;b0=0.99886*b0+w*0.0555179;b1=0.99332*b1+w*0.0750759;b2=0.96900*b2+w*0.1538520;b3=0.86650*b3+w*0.3104856;b4=0.55000*b4+w*0.5329522;b5=-0.7616*b5-w*0.0168980;d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.18;b6=w*0.115926;}}
    var src=ctx.createBufferSource(); src.buffer=buf; src.loop=true;
    var lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=2800;
    var hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=220;
    src.connect(lp); lp.connect(hp); hp.connect(chain); src.start();
    frMusicStopFns.push(function(){try{src.stop();}catch(_){} try{chain.disconnect();}catch(_){}});
  }

  function frPlayPiano() {
    var ctx=frAudioCtx, chain=frMakeMasterChain(ctx,frMasterGain,0.8);
    var scales=[[264,330,396,528,660],[220,275,330,440,550],[198,247.5,297,396,495],[176,220,264,352,440]];
    var stopped=false,ci=0,timers=[];
    function playChord(){
      if(stopped)return;
      var now=ctx.currentTime, notes=scales[ci++%scales.length], pick=notes.filter(function(_,i){return[0,2,4].includes(i);});
      pick.forEach(function(freq,i){var osc=ctx.createOscillator(),g=ctx.createGain(),t=now+i*0.4;osc.type='triangle';osc.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.3,t+0.25);g.gain.exponentialRampToValueAtTime(0.0001,t+7);osc.connect(g);g.connect(chain);osc.start(t);osc.stop(t+7.5);});
      timers.push(setTimeout(playChord,8000+Math.random()*3000));
    }
    playChord();
    frMusicStopFns.push(function(){stopped=true;timers.forEach(clearTimeout);try{chain.disconnect();}catch(_){}});
  }

  function frPlaySchumann() {
    var ctx=frAudioCtx, chain=frMakeMasterChain(ctx,frMasterGain,0.65), nodes=[], sr=ctx.sampleRate, dur=30;
    var buf=ctx.createBuffer(2,sr*dur,sr);
    for(var i=0;i<sr*dur;i++){buf.getChannelData(0)[i]=Math.sin(2*Math.PI*200*i/sr)*0.32;buf.getChannelData(1)[i]=Math.sin(2*Math.PI*207.83*i/sr)*0.32;}
    var src=ctx.createBufferSource(); src.buffer=buf; src.loop=true;
    var lfoOsc=ctx.createOscillator(),lfoG=ctx.createGain(),mainG=ctx.createGain();
    lfoOsc.type='sine'; lfoOsc.frequency.value=7.83; lfoG.gain.value=0.08; mainG.gain.value=0.55;
    lfoOsc.connect(lfoG); lfoG.connect(mainG.gain); src.connect(mainG); mainG.connect(chain);
    src.start(); lfoOsc.start(); nodes.push(lfoOsc,lfoG,mainG);
    frMusicStopFns.push(function(){try{src.stop();}catch(_){}nodes.forEach(function(n){try{if(n.stop)n.stop();}catch(_){} try{n.disconnect();}catch(_){}});try{chain.disconnect();}catch(_){}});
  }

  function frPlayDeep() {
    var ctx=frAudioCtx, chain=frMakeMasterChain(ctx,frMasterGain,0.42), nodes=[];
    [[432,0.22],[216,0.16],[108,0.12],[864,0.06],[54,0.08]].forEach(function(p,i){
      var osc=ctx.createOscillator(),g=ctx.createGain(),lfo=ctx.createOscillator(),lfoG=ctx.createGain();
      osc.type='sine'; osc.frequency.value=p[0]; g.gain.value=p[1];
      lfo.type='sine'; lfo.frequency.value=0.04+i*0.015; lfoG.gain.value=p[1]*0.15;
      lfo.connect(lfoG); lfoG.connect(g.gain); lfo.start(); osc.start(); osc.connect(g); g.connect(chain);
      nodes.push(osc,g,lfo,lfoG);
    });
    var sr=ctx.sampleRate,nbuf=ctx.createBuffer(1,sr*3,sr),nd=nbuf.getChannelData(0);
    for(var i=0;i<nd.length;i++) nd[i]=(Math.random()*2-1);
    var nsrc=ctx.createBufferSource(); nsrc.buffer=nbuf; nsrc.loop=true;
    var nf=ctx.createBiquadFilter(); nf.type='lowpass'; nf.frequency.value=180; nf.Q.value=4;
    var ng=ctx.createGain(); ng.gain.value=0.08;
    nsrc.connect(nf); nf.connect(ng); ng.connect(chain); nsrc.start(); nodes.push(nsrc,nf,ng);
    frMusicStopFns.push(function(){nodes.forEach(function(n){try{if(n.stop)n.stop();}catch(_){} try{n.disconnect();}catch(_){}});try{chain.disconnect();}catch(_){}});
  }

  function frPlayAwaken() {
    var ctx=frAudioCtx, chain=frMakeMasterChain(ctx,frMasterGain,0.58), nodes=[], timers=[], stopped=false;
    [[963,0.18],[481.5,0.14],[1926,0.05],[321,0.10]].forEach(function(p){
      var osc=ctx.createOscillator(),g=ctx.createGain(),lfo=ctx.createOscillator(),lfoG=ctx.createGain();
      osc.type='sine'; osc.frequency.value=p[0]; g.gain.value=p[1];
      lfo.type='sine'; lfo.frequency.value=0.05+Math.random()*0.05; lfoG.gain.value=p[1]*0.1;
      lfo.connect(lfoG); lfoG.connect(g.gain); lfo.start(); osc.start(); osc.connect(g); g.connect(chain);
      nodes.push(osc,g,lfo,lfoG);
    });
    function ding(){if(stopped)return;var now=ctx.currentTime,osc=ctx.createOscillator(),g=ctx.createGain();osc.type='sine';osc.frequency.value=963*(1+Math.random()*0.01);g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(0.22,now+0.01);g.gain.exponentialRampToValueAtTime(0.0001,now+5);osc.connect(g);g.connect(chain);osc.start(now);osc.stop(now+5.5);timers.push(setTimeout(ding,5000+Math.random()*4000));}
    ding();
    frMusicStopFns.push(function(){stopped=true;timers.forEach(clearTimeout);nodes.forEach(function(n){try{if(n.stop)n.stop();}catch(_){} try{n.disconnect();}catch(_){}});try{chain.disconnect();}catch(_){}});
  }

  function frPlayRain() {
    var ctx=frAudioCtx, chain=frMakeMasterChain(ctx,frMasterGain,0.95), nodes=[], timers=[], stopped=false;
    function makeRainLayer(bufDur,lpFreq,hpFreq,vol){
      var sr=ctx.sampleRate,buf=ctx.createBuffer(2,sr*bufDur,sr);
      for(var ch=0;ch<2;ch++){var d=buf.getChannelData(ch),b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;for(var i=0;i<d.length;i++){var w=Math.random()*2-1;b0=0.99886*b0+w*0.0555179;b1=0.99332*b1+w*0.0750759;b2=0.96900*b2+w*0.1538520;b3=0.86650*b3+w*0.3104856;b4=0.55000*b4+w*0.5329522;b5=-0.7616*b5-w*0.0168980;d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.22;b6=w*0.115926;}}
      var src=ctx.createBufferSource();src.buffer=buf;src.loop=true;
      var lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=lpFreq;
      var hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=hpFreq;
      var g=ctx.createGain();g.gain.value=vol;
      src.connect(lp);lp.connect(hp);hp.connect(g);g.connect(chain);src.start();nodes.push(src,lp,hp,g);
    }
    makeRainLayer(5,4000,400,0.55); makeRainLayer(7,1200,150,0.3);
    function raindrop(){if(stopped)return;var now=ctx.currentTime,osc=ctx.createOscillator(),g=ctx.createGain();osc.type='sine';osc.frequency.value=600+Math.random()*400;osc.frequency.exponentialRampToValueAtTime(200+Math.random()*100,now+0.08);g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(0.12+Math.random()*0.08,now+0.005);g.gain.exponentialRampToValueAtTime(0.0001,now+0.12);osc.connect(g);g.connect(chain);osc.start(now);osc.stop(now+0.14);timers.push(setTimeout(raindrop,200+Math.random()*800));}
    timers.push(setTimeout(raindrop,Math.random()*500));
    frMusicStopFns.push(function(){stopped=true;timers.forEach(clearTimeout);nodes.forEach(function(n){try{if(n.stop)n.stop();}catch(_){} try{n.disconnect();}catch(_){}});try{chain.disconnect();}catch(_){}});
  }

  function frPlayOcean() {
    var ctx=frAudioCtx, chain=frMakeMasterChain(ctx,frMasterGain,0.9), nodes=[], sr=ctx.sampleRate;
    var buf=ctx.createBuffer(2,sr*8,sr);
    for(var ch=0;ch<2;ch++){var d=buf.getChannelData(ch),b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;for(var i=0;i<d.length;i++){var w=Math.random()*2-1;b0=0.99886*b0+w*0.0555179;b1=0.99332*b1+w*0.0750759;b2=0.96900*b2+w*0.1538520;b3=0.86650*b3+w*0.3104856;b4=0.55000*b4+w*0.5329522;b5=-0.7616*b5-w*0.0168980;d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.28;b6=w*0.115926;}}
    var src=ctx.createBufferSource();src.buffer=buf;src.loop=true;
    var lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=800;
    var hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=60;
    var g=ctx.createGain();g.gain.value=0.5;
    var lfo=ctx.createOscillator(),lfoG=ctx.createGain();lfo.type='sine';lfo.frequency.value=0.12;lfoG.gain.value=0.38;lfo.connect(lfoG);lfoG.connect(g.gain);lfo.start();
    src.connect(lp);lp.connect(hp);hp.connect(g);g.connect(chain);src.start();nodes.push(src,lp,hp,g,lfo,lfoG);
    frMusicStopFns.push(function(){nodes.forEach(function(n){try{if(n.stop)n.stop();}catch(_){} try{n.disconnect();}catch(_){}});try{chain.disconnect();}catch(_){}});
  }

  function frPlayDeepBowl() {
    var ctx=frAudioCtx, chain=frMakeMasterChain(ctx,frMasterGain,0.78), timers=[], stopped=false;
    var sets=[[174.61,261.63,392.00],[194.18,291.00,436.00],[220.00,330.00,440.00]], setIdx=0;
    function strikeSet(){
      if(stopped)return; var freqs=sets[setIdx++%sets.length], now=ctx.currentTime;
      freqs.forEach(function(freq,fi){[[1,0.36],[2.756,0.10],[4.07,0.04],[5.04,0.02]].forEach(function(p,hi){var osc=ctx.createOscillator(),g=ctx.createGain(),t=now+fi*0.6;osc.type='sine';osc.frequency.value=freq*p[0];g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(p[1],t+0.015);g.gain.exponentialRampToValueAtTime(0.0001,t+(hi===0?10:hi===1?6:3));osc.connect(g);g.connect(chain);osc.start(t);osc.stop(t+(hi===0?10.5:6.5));});});
      timers.push(setTimeout(strikeSet,12000+Math.random()*4000));
    }
    strikeSet();
    frMusicStopFns.push(function(){stopped=true;timers.forEach(clearTimeout);try{chain.disconnect();}catch(_){}});
  }

  var FR_TRACKS = {
    bowl:frPlayBowl, hz528:frPlay528, water:frPlayWater, piano:frPlayPiano,
    schumann:frPlaySchumann, deep:frPlayDeep, awaken:frPlayAwaken,
    rain:frPlayRain, ocean:frPlayOcean, deepbowl:frPlayDeepBowl
  };

  window.frSelectTrack = function(id) {
    if (!frAudioCtx) {
      try {
        frAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        frMasterGain = frAudioCtx.createGain();
        frMasterGain.gain.value = 0.45;
        frMasterGain.connect(frAudioCtx.destination);
      } catch(e) { frShowToast('❌ 浏览器不支持Web Audio'); return; }
    }
    if (frAudioCtx.state === 'suspended') frAudioCtx.resume();
    frUnlockAudio();
    if (frCurrentTrack === id && frMusicPlaying) { frStopAllMusic(); frCurrentTrack = null; return; }
    frStopAllMusic();
    frCurrentTrack = id; frMusicPlaying = true;
    FR_TRACKS[id]();
    var vol = document.getElementById('frMusicVolume').value;
    frMasterGain.gain.value = vol / 100;
    frSetMusicVolume(vol);
    document.getElementById('frMusicBtn').classList.add('playing');
    document.querySelectorAll('.fr-music-track').forEach(function(t) {
      t.classList.remove('active');
      var pb = t.querySelector('.fr-music-play-btn');
      if (pb) { pb.textContent = '▶'; pb.classList.remove('playing'); }
      if (t.dataset.track === id) { t.classList.add('active'); if (pb) { pb.textContent = '⏹'; pb.classList.add('playing'); } }
    });
  };

  window.frToggleMusicPanel = function() {
    if (!frAudioCtx) {
      try {
        frAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        frMasterGain = frAudioCtx.createGain();
        frMasterGain.gain.value = 0.45;
        frMasterGain.connect(frAudioCtx.destination);
      } catch(e) {}
    }
    if (frAudioCtx && frAudioCtx.state === 'suspended') frAudioCtx.resume();
    if (frAudioCtx) frUnlockAudio();
    frMusicPanelOpen = !frMusicPanelOpen;
    document.getElementById('frMusicPanel').classList.toggle('open', frMusicPanelOpen);
  };

  document.addEventListener('click', function(e) {
    if (frMusicPanelOpen && !e.target.closest('#frMusicPanel') && !e.target.closest('#frMusicBtn')) {
      frMusicPanelOpen = false;
      document.getElementById('frMusicPanel').classList.remove('open');
    }
  });

  window.frSwitchMusicSource = function(src) {
    ['builtin','import','record'].forEach(function(s) {
      document.getElementById('frMsrc-' + s).classList.toggle('active', s === src);
      document.getElementById('frMpanel-' + s).classList.toggle('active', s === src);
    });
    if (src === 'record') frInitRecordWaveform();
  };

  // ── LOCAL IMPORT ──
  window.frHandleImportDragOver = function(e) { e.preventDefault(); document.getElementById('frImportDropZone').classList.add('dragover'); };
  window.frHandleImportDragLeave = function() { document.getElementById('frImportDropZone').classList.remove('dragover'); };
  window.frHandleImportDrop = function(e) { e.preventDefault(); document.getElementById('frImportDropZone').classList.remove('dragover'); frHandleImportFile(e.dataTransfer.files); };
  window.frHandleImportFile = function(files) {
    if (!files || !files.length) return;
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (!file.type.startsWith('audio/')) { frShowToast('❌ 请选择音频文件'); continue; }
      var url = URL.createObjectURL(file);
      var id = 'import-' + Date.now() + '-' + Math.random().toString(36).slice(2,6);
      frImportedTracks.push({ id:id, name:file.name.replace(/\.[^.]+$/,''), src:url, objectUrl:url });
      frRenderImportedList();
    }
    document.getElementById('frImportFileInput').value = '';
  };
  function frEnsureImportAudio() {
    if (!frImportAudioEl) { frImportAudioEl = new Audio(); frImportAudioEl.loop = true; }
    return frImportAudioEl;
  }
  function frRenderImportedList() {
    var list = document.getElementById('frImportedList');
    if (!frImportedTracks.length) { list.innerHTML = '<div class="fr-music-import-empty">还没有导入的音乐</div>'; return; }
    list.innerHTML = frImportedTracks.map(function(track) {
      return '<div class="fr-music-imported-item ' + (frCurrentImportId===track.id?'active':'') + '" onclick="frSelectImportTrack(\'' + track.id + '\')">'
        + '<span style="font-size:1.1rem;flex-shrink:0;">' + (frCurrentImportId===track.id?'▶':'🎵') + '</span>'
        + '<span class="fr-music-imported-name" title="' + frEscapeHtml(track.name) + '">' + frEscapeHtml(track.name) + '</span>'
        + '<button class="fr-music-imported-del" onclick="frDeleteImportTrack(event,\'' + track.id + '\')">✕</button>'
        + '</div>';
    }).join('');
  }
  window.frSelectImportTrack = function(id) {
    frEnsureImportAudio();
    if (frCurrentImportId === id && frMusicPlaying && frCurrentTrack === '__import__') {
      frStopAllMusic(); frCurrentImportId = null; frRenderImportedList(); return;
    }
    frStopAllMusic();
    var track = frImportedTracks.find(function(t) { return t.id === id; });
    if (!track) return;
    frCurrentImportId = id; frCurrentTrack = '__import__'; frMusicPlaying = true;
    frImportAudioEl.src = track.src;
    var vol = document.getElementById('frMusicVolume').value;
    frImportAudioEl.volume = vol / 100;
    frImportAudioEl.play().catch(function(e) { frShowToast('❌ 无法播放：' + e.message.slice(0,40)); });
    frMusicStopFns.push(function() { frImportAudioEl.pause(); frImportAudioEl.src = ''; });
    document.getElementById('frMusicBtn').classList.add('playing');
    frRenderImportedList();
  };
  window.frDeleteImportTrack = function(e, id) {
    e.stopPropagation();
    var idx = frImportedTracks.findIndex(function(t) { return t.id === id; });
    if (idx === -1) return;
    if (frCurrentImportId === id) { frStopAllMusic(); frCurrentImportId = null; }
    var track = frImportedTracks[idx];
    if (track.objectUrl) URL.revokeObjectURL(track.objectUrl);
    frImportedTracks.splice(idx, 1);
    frRenderImportedList();
  };

  // ── RECORDING ──
  window.frSelectRecordBg = function(btn, trackKey) {
    document.querySelectorAll('.fr-record-bg-item').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    frRecordBgTrack = trackKey;
    document.getElementById('frRecordBgVolRow').style.display = trackKey ? 'flex' : 'none';
  };
  window.frUpdateRecordBgVol = function(v) {
    document.getElementById('frRecordBgVolNum').textContent = v + '%';
    if (frRecordBgGainNode && frAudioCtx) frRecordBgGainNode.gain.setTargetAtTime(v/100, frAudioCtx.currentTime, 0.05);
  };
  function frInitRecordWaveform() {
    var wf = document.getElementById('frRecordWaveform');
    if (wf.children.length > 0) return;
    for (var i = 0; i < 28; i++) { var bar = document.createElement('div'); bar.className = 'fr-record-wave-bar'; bar.style.height = '4px'; wf.appendChild(bar); }
  }
  function frUpdateRecordTimer() {
    frRecordTimerSec++;
    var m = String(Math.floor(frRecordTimerSec/60)).padStart(2,'0');
    var s = String(frRecordTimerSec%60).padStart(2,'0');
    document.getElementById('frRecordTimer').textContent = m + ':' + s;
    if (frRecordTimerSec >= 300) frStopRecord();
  }
  function frAnimateWaveform() {
    if (!frRecordAnalyser) return;
    var data = new Uint8Array(frRecordAnalyser.frequencyBinCount);
    frRecordAnalyser.getByteFrequencyData(data);
    var bars = document.querySelectorAll('.fr-record-wave-bar');
    var step = Math.floor(data.length / bars.length);
    bars.forEach(function(bar, i) {
      var v = data[i*step] || 0;
      var h = 3 + (v/255)*34;
      bar.style.height = h + 'px';
      bar.style.background = v > 100 ? 'rgba(255,120,120,0.8)' : 'rgba(100,180,255,0.5)';
    });
    frRecordAnimFrame = requestAnimationFrame(frAnimateWaveform);
  }
  window.frToggleRecord = function() { if (frRecordingActive) { frStopRecord(); } else { frStartRecord(); } };
  async function frStartRecord() {
    if (!frAudioCtx) {
      try { frAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); frMasterGain = frAudioCtx.createGain(); frMasterGain.gain.value = document.getElementById('frMusicVolume').value/100; frMasterGain.connect(frAudioCtx.destination); }
      catch(e) { frShowToast('❌ 浏览器不支持Web Audio'); return; }
    }
    if (frAudioCtx.state === 'suspended') await frAudioCtx.resume();
    try { frRecordMicStream = await navigator.mediaDevices.getUserMedia({ audio:true, video:false }); }
    catch(e) { frShowToast('❌ 无法访问麦克风：' + (e.message||'权限被拒绝')); return; }
    frRecordChunks = []; frRecordBlob = null;
    if (frRecordObjectUrl) { URL.revokeObjectURL(frRecordObjectUrl); frRecordObjectUrl = null; }
    frRecordTimerSec = 0;
    document.getElementById('frRecordTimer').textContent = '00:00';
    document.getElementById('frRecordTimer').classList.add('active');
    document.getElementById('frRecordActions').style.display = 'none';
    var mixDest = frAudioCtx.createMediaStreamDestination();
    var micSource = frAudioCtx.createMediaStreamSource(frRecordMicStream);
    frRecordAnalyser = frAudioCtx.createAnalyser(); frRecordAnalyser.fftSize = 64;
    var micGain = frAudioCtx.createGain(); micGain.gain.value = 1.0;
    micSource.connect(frRecordAnalyser); micSource.connect(micGain); micGain.connect(mixDest);
    frRecordBgGainNode = null; frRecordBgStopFn = null;
    if (frRecordBgTrack && FR_TRACKS[frRecordBgTrack]) {
      frRecordBgGainNode = frAudioCtx.createGain();
      frRecordBgGainNode.gain.value = document.getElementById('frRecordBgVol').value / 100;
      frRecordBgGainNode.connect(mixDest); frRecordBgGainNode.connect(frMasterGain);
      var savedMake = frMakeMasterChain;
      var patchedChain = function(ctx, dest, preGain) {
        var pre=ctx.createGain();pre.gain.value=preGain||1.0;var comp=ctx.createDynamicsCompressor();comp.threshold.value=-20;comp.knee.value=10;comp.ratio.value=6;comp.attack.value=0.003;comp.release.value=0.3;var g=ctx.createGain();g.gain.value=0.65;pre.connect(comp);comp.connect(g);g.connect(frRecordBgGainNode);return pre;
      };
      window.frMakeMasterChain = patchedChain;
      var stopsBefore = frMusicStopFns.length;
      FR_TRACKS[frRecordBgTrack]();
      window.frMakeMasterChain = savedMake;
      var bgStops = frMusicStopFns.splice(stopsBefore);
      frRecordBgStopFn = function() { bgStops.forEach(function(fn){try{fn();}catch(_){}}); };
    }
    var mimeType = '';
    // iOS Safari prefers mp4/aac, others can use webm/opus
    ['audio/mp4','audio/mp4;codecs=mp4a.40.2','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg'].forEach(function(mt){if(!mimeType&&MediaRecorder.isTypeSupported(mt))mimeType=mt;});
    frMediaRecorder = mimeType ? new MediaRecorder(mixDest.stream,{mimeType:mimeType}) : new MediaRecorder(mixDest.stream);
    frMediaRecorder.ondataavailable = function(e){if(e.data.size>0)frRecordChunks.push(e.data);};
    frMediaRecorder.onstop = frOnRecordStop;
    frMediaRecorder.start(100);
    frRecordingActive = true;
    frRecordTimerInt = setInterval(frUpdateRecordTimer, 1000);
    frAnimateWaveform();
    var btn = document.getElementById('frRecordBtn');
    btn.classList.add('recording'); btn.textContent = '⏹';
    document.getElementById('frRecordStatus').textContent = frRecordBgTrack ? '录制中（含背景混音）… 再次点击停止' : '录制中… 再次点击停止';
  }
  function frStopRecord() {
    if (!frMediaRecorder || frMediaRecorder.state === 'inactive') return;
    frMediaRecorder.stop();
    if (frRecordMicStream) frRecordMicStream.getTracks().forEach(function(t){t.stop();});
    if (frRecordBgStopFn) { frRecordBgStopFn(); frRecordBgStopFn = null; }
    clearInterval(frRecordTimerInt); cancelAnimationFrame(frRecordAnimFrame);
    frRecordAnimFrame = null; frRecordingActive = false; frRecordBgGainNode = null;
    var btn = document.getElementById('frRecordBtn');
    btn.classList.remove('recording'); btn.textContent = '🎙️';
    document.getElementById('frRecordTimer').classList.remove('active');
    document.querySelectorAll('.fr-record-wave-bar').forEach(function(b){b.style.height='4px';b.style.background='rgba(100,180,255,0.3)';});
  }
  function frOnRecordStop() {
    var mimeType = frMediaRecorder.mimeType || 'audio/webm';
    frRecordBlob = new Blob(frRecordChunks, {type:mimeType});
    frRecordObjectUrl = URL.createObjectURL(frRecordBlob);
    document.getElementById('frRecordBtn').classList.add('has-recording');
    document.getElementById('frRecordStatus').textContent = '录制完成！可以试听或保存使用';
    document.getElementById('frRecordActions').style.display = 'flex';
  }
  window.frPlayRecording = function() {
    if (!frRecordObjectUrl) return;
    // Recreate audio element each time for cleanest playback (iOS Safari friendly)
    if (frRecordPreviewEl) {
      try { frRecordPreviewEl.pause(); } catch(_) {}
      frRecordPreviewEl.src = '';
    }
    frRecordPreviewEl = new Audio();
    frRecordPreviewEl.src = frRecordObjectUrl;
    frRecordPreviewEl.preload = 'auto';
    frRecordPreviewEl.load();
    frRecordPreviewEl.play().catch(function(err) {
      frShowToast('❌ 播放失败：' + (err.message || '该格式不支持'));
    });
  };
  window.frSaveRecording = function() {
    if (!frRecordObjectUrl) return;
    var id = 'rec-'+Date.now();
    var dur = String(Math.floor(frRecordTimerSec/60)).padStart(2,'0')+':'+String(frRecordTimerSec%60).padStart(2,'0');
    var name = '🎙️ 我的录音 ' + dur;
    frImportedTracks.push({id:id, name:name, src:frRecordObjectUrl});
    frSwitchMusicSource('import');
    frRenderImportedList();
    frSelectImportTrack(id);
    document.getElementById('frRecordBtn').classList.remove('has-recording');
    document.getElementById('frRecordActions').style.display = 'none';
    document.getElementById('frRecordStatus').textContent = '已保存，正在播放混音';
    document.getElementById('frRecordTimer').textContent = '00:00';
    frRecordTimerSec = 0;
    frShowToast('🎙️ 混音已保存并开始播放');
  };
  window.frDiscardRecording = function() {
    if (frRecordObjectUrl) { URL.revokeObjectURL(frRecordObjectUrl); frRecordObjectUrl = null; }
    frRecordBlob = null; frRecordChunks = [];
    document.getElementById('frRecordBtn').classList.remove('has-recording');
    document.getElementById('frRecordActions').style.display = 'none';
    document.getElementById('frRecordStatus').textContent = '选好背景后点击开始录制';
    document.getElementById('frRecordTimer').textContent = '00:00';
    frRecordTimerSec = 0;
  };

  // ── init volume slider ──
  setTimeout(function(){
    var s = document.getElementById('frMusicVolume');
    if (s) s.style.background = 'linear-gradient(to right,rgba(140,210,255,0.85) 0%,rgba(140,210,255,0.85) 50%,rgba(255,255,255,0.18) 50%)';
  }, 0);



})();
