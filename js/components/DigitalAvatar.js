/**
 * DigitalAvatar - 底部工具栏组件（重构版）
 * 将功能按钮合并到底部固定栏（page-indicator），分区布局：
 * [上一页] [页码] [下一页] | [复读][连读][评测][背诵][全文背诵][音色] | [暂停]
 */
class DigitalAvatar {
    constructor(container) {
        this._container = container;
        this._isAnimating = false;
        this._debug = false;
        this._continuousMode = false;
        this._isRecording = false;
        this._isPaused = false;

        this._onRepeat = null;
        this._onContinuous = null;
        this._onAssess = null;
        this._onRecite = null;
        this._onFullRecite = null;
        this._onPause = null;
        this._onVoiceSwitch = null;
    }

    render(imageSrc) {
        // 不再创建浮动面板，而是注入到底部页码栏
        this._injectToolbar();
        this._addStyles();
        this._log('工具栏已注入底部栏');
    }

    _injectToolbar() {
        const bar = document.querySelector('.book-flipper-page-indicator');
        if (!bar) { this._log('底部栏未找到'); return; }
        this._barEl = bar;

        // 插入分隔线 + 功能按钮区
        const toolGroup = document.createElement('div');
        toolGroup.className = 'bar-tool-group';
        toolGroup.id = 'barToolGroup';
        toolGroup.innerHTML = `
            <div class="bar-divider"></div>
            <button class="bar-tool-btn" data-action="repeat" title="复读"><span class="bar-tool-icon">↻</span><span class="bar-tool-text">复读</span></button>
            <button class="bar-tool-btn" data-action="continuous" title="连读"><span class="bar-tool-icon">⏩</span><span class="bar-tool-text">连读</span></button>
            <button class="bar-tool-btn" data-action="assess" title="评测"><span class="bar-tool-icon">✎</span><span class="bar-tool-text">评测</span></button>
            <button class="bar-tool-btn" data-action="recite" title="背诵"><span class="bar-tool-icon">¶</span><span class="bar-tool-text">背诵</span></button>
            <button class="bar-tool-btn" data-action="fullRecite" title="全文背诵"><span class="bar-tool-icon">☰</span><span class="bar-tool-text">全文背诵</span></button>
            <button class="bar-tool-btn" data-action="voiceSwitch" title="音色切换"><span class="bar-tool-icon">♪</span><span class="bar-tool-text">音色</span></button>
        `;
        bar.appendChild(toolGroup);
        this._toolGroupEl = toolGroup;

        // 暂停按钮（独立分区）
        const pauseWrap = document.createElement('div');
        pauseWrap.className = 'bar-pause-group';
        pauseWrap.innerHTML = `<div class="bar-divider"></div><button class="bar-pause-btn hidden" id="barPauseBtn" title="暂停" aria-label="暂停播放"><span class="bar-pause-icon">⏸</span></button>`;
        bar.appendChild(pauseWrap);
        this._pauseWrapEl = pauseWrap;
        this._pauseBtnEl = pauseWrap.querySelector('#barPauseBtn');

        this._bindButtonEvents();
    }

    _bindButtonEvents() {
        if (this._toolGroupEl) {
            this._toolGroupEl.querySelectorAll('.bar-tool-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._handleAction(btn.dataset.action, btn);
                });
            });
        }
        if (this._pauseBtnEl) {
            this._pauseBtnEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this._handleAction('pause', this._pauseBtnEl);
            });
        }
    }

    _handleAction(action, btn) {
        switch (action) {
            case 'repeat':   if (this._onRepeat) this._onRepeat(); break;
            case 'pause':
                this._isPaused = !this._isPaused;
                this._updatePauseButton();
                if (this._onPause) this._onPause(this._isPaused);
                break;
            case 'continuous':
                this._continuousMode = !this._continuousMode;
                btn.classList.toggle('active', this._continuousMode);
                if (this._onContinuous) this._onContinuous(this._continuousMode);
                break;
            case 'assess':    if (this._onAssess) this._onAssess(); break;
            case 'recite':    if (this._onRecite) this._onRecite(); break;
            case 'fullRecite': if (this._onFullRecite) this._onFullRecite(); break;
            case 'voiceSwitch': if (this._onVoiceSwitch) this._onVoiceSwitch(); break;
        }
    }

    // ========== 回调注册 ==========
    onRepeat(cb)     { this._onRepeat = cb; }
    onContinuous(cb) { this._onContinuous = cb; }
    onAssess(cb)     { this._onAssess = cb; }
    onRecite(cb)     { this._onRecite = cb; }
    onFullRecite(cb) { this._onFullRecite = cb; }
    onPause(cb)      { this._onPause = cb; }
    onVoiceSwitch(cb){ this._onVoiceSwitch = cb; }

    // ========== 暂停按钮 ==========
    showPauseButton() {
        this._isPaused = false;
        this._updatePauseButton();
        if (this._pauseBtnEl) this._pauseBtnEl.classList.remove('hidden');
    }
    hidePauseButton() {
        this._isPaused = false;
        this._updatePauseButton();
        if (this._pauseBtnEl) this._pauseBtnEl.classList.add('hidden');
    }
    _updatePauseButton() {
        if (!this._pauseBtnEl) return;
        const icon = this._pauseBtnEl.querySelector('.bar-pause-icon');
        if (this._isPaused) {
            icon.textContent = '▶';
            this._pauseBtnEl.title = '继续播放';
            this._pauseBtnEl.classList.add('paused');
        } else {
            icon.textContent = '⏸';
            this._pauseBtnEl.title = '暂停播放';
            this._pauseBtnEl.classList.remove('paused');
        }
    }

    // ========== 兼容旧接口 ==========
    startSpeaking(text) { this._isAnimating = true; }
    stopSpeaking()      { this._isAnimating = false; }
    setRecording(isRecording, text) { this._isRecording = isRecording; }
    setStatus(icon, text) {}
    isContinuousMode() { return this._continuousMode; }
    isSpeaking()       { return this._isAnimating; }
    setDebug(enabled)  { this._debug = enabled; }

    destroy() {
        if (this._pauseBtnEl) this._pauseBtnEl.remove();
        if (this._toolGroupEl) this._toolGroupEl.remove();
        if (this._pauseWrapEl) this._pauseWrapEl.remove();
        // 不再有 wrapper 挂在 body 上，但保留兼容
        if (this._wrapperEl) this._wrapperEl.remove();
    }

    _log(...args) {
        if (this._debug) console.log('[DigitalAvatar]', ...args);
    }

    _addStyles() {
        if (document.getElementById('digital-avatar-styles')) return;
        const style = document.createElement('style');
        style.id = 'digital-avatar-styles';
        style.textContent = `
            /* ===== 底部栏整体调整 ===== */
            .book-flipper-page-indicator {
                gap: 0 !important;
                padding: 6px 10px !important;
            }

            /* ===== 分隔线 ===== */
            .bar-divider {
                width: 1px;
                height: 28px;
                background: #E0E0E0;
                margin: 0 8px;
                flex-shrink: 0;
            }

            /* ===== 功能按钮区 ===== */
            .bar-tool-group {
                display: flex;
                align-items: center;
                gap: 2px;
            }

            .bar-tool-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 46px;
                height: 42px;
                border: none;
                border-radius: 10px;
                background: transparent;
                cursor: pointer;
                transition: all 0.18s ease;
                padding: 2px 0;
                gap: 1px;
                color: #666;
            }
            .bar-tool-btn:hover {
                background: rgba(0,0,0,0.05);
                color: #333;
            }
            .bar-tool-btn:active {
                transform: scale(0.92);
            }
            .bar-tool-btn.active {
                background: #E0F7FA;
                color: #00897B;
            }

            .bar-tool-icon {
                font-size: 18px;
                line-height: 1;
                font-style: normal;
            }
            .bar-tool-text {
                font-size: 10px;
                font-weight: 600;
                line-height: 1;
                white-space: nowrap;
            }

            /* ===== 暂停按钮区 ===== */
            .bar-pause-group {
                display: flex;
                align-items: center;
            }
            .bar-pause-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 38px;
                height: 38px;
                border: none;
                border-radius: 50%;
                background: linear-gradient(135deg, #4DD0E1, #26C6DA);
                color: white;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(77,208,225,0.3);
                font-size: 16px;
            }
            .bar-pause-btn:hover { transform: scale(1.1); }
            .bar-pause-btn:active { transform: scale(0.9); }
            .bar-pause-btn.paused {
                background: linear-gradient(135deg, #66BB6A, #43A047);
                box-shadow: 0 2px 8px rgba(76,175,80,0.3);
            }
            .bar-pause-btn.hidden { display: none; }
            .bar-pause-icon { font-style: normal; }

            /* ===== 评测结果弹窗 ===== */
            .assess-result-popup {
                position: fixed; top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                background: white; border-radius: 20px; padding: 24px;
                min-width: 300px; max-width: min(90vw, 560px);
                max-height: 85vh; overflow-y: auto;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                z-index: 200; text-align: center;
                animation: popup-in 0.3s ease;
            }
            @keyframes popup-in { from { opacity:0; transform: translate(-50%,-50%) scale(0.8); } to { opacity:1; transform: translate(-50%,-50%) scale(1); } }
            .assess-result-popup .result-title { font-size: 18px; font-weight: bold; margin-bottom: 12px; color: #5D4037; }
            .assess-result-popup .result-score { font-size: 48px; font-weight: 800; margin: 8px 0; }
            .assess-result-popup .result-score.perfect { color: #E91E63; }
            .assess-result-popup .result-score.excellent { color: #4CAF50; }
            .assess-result-popup .result-score.good { color: #2196F3; }
            .assess-result-popup .result-score.pass { color: #FF9800; }
            .assess-result-popup .result-score.poor { color: #F44336; }
            .assess-result-popup .result-detail { font-size: 14px; color: #8D6E63; margin: 8px 0 16px; line-height: 1.6; }
            .assess-result-popup .result-close-btn { padding: 8px 32px; border: none; border-radius: 20px; background: linear-gradient(135deg, #4DD0E1, #26C6DA); color: white; font-size: 14px; font-weight: bold; cursor: pointer; transition: transform 0.2s; }
            .assess-result-popup .result-close-btn:hover { transform: scale(1.05); }
            .assess-action-btns { display: flex; justify-content: center; gap: 12px; margin: 16px 0 12px; }
            .assess-action-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 14px; border: 1.5px solid #E0E0E0; border-radius: 12px; background: #FAFAFA; cursor: pointer; transition: all 0.2s ease; min-width: 72px; }
            .assess-action-btn:hover { background: #F0F7FF; border-color: #90CAF9; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
            .assess-action-btn:active { transform: scale(0.96); }
            .assess-action-btn.playing { background: #E3F2FD; border-color: #42A5F5; }
            .assess-btn-icon { font-size: 22px; }
            .assess-btn-text { font-size: 11px; color: #666; font-weight: 500; white-space: nowrap; }
            .assess-action-btn.playing .assess-btn-text { color: #1976D2; }
            .word-scores-section { margin: 12px 0; text-align: left; }
            .word-scores-label { font-size: 13px; color: #999; margin-bottom: 8px; }
            .word-scores-list { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
            .word-score-item { display: inline-flex; flex-direction: column; align-items: center; padding: 4px 8px; background: #FAFAFA; border-radius: 6px; }
            .word-text { font-size: 16px; color: #333; font-weight: 500; }
            .word-score-val { font-size: 12px; font-weight: bold; margin-top: 2px; }
            .dimension-section { margin: 14px 0 8px; padding: 10px 12px; background: #FAFAFA; border-radius: 10px; }
            .dimension-row { display: flex; align-items: center; margin: 6px 0; }
            .dimension-label { font-size: 13px; color: #666; width: 52px; flex-shrink: 0; }
            .dimension-bar-bg { flex: 1; height: 8px; background: #E0E0E0; border-radius: 4px; overflow: hidden; margin: 0 8px; }
            .dimension-bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
            .dimension-value { font-size: 13px; font-weight: bold; width: 40px; text-align: right; flex-shrink: 0; }
            .assess-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 199; }

            /* 音色切换弹窗 */
            .voice-switch-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 199; }
            .voice-switch-popup {
                position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
                background: white; border-radius: 16px; padding: 16px;
                min-width: 220px; box-shadow: 0 8px 32px rgba(0,0,0,0.18);
                z-index: 200;
            }
            .voice-switch-popup .voice-title { font-size: 15px; font-weight: bold; color: #5D4037; margin-bottom: 12px; text-align: center; }
            .voice-option { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; cursor: pointer; transition: background 0.15s; margin-bottom: 4px; border: 2px solid transparent; }
            .voice-option:hover { background: #FFF3E0; }
            .voice-option.selected { border-color: #4DD0E1; background: #E0F7FA; }
            .voice-option.disabled { opacity: 0.45; cursor: not-allowed; }
            .voice-option-icon { font-size: 24px; }
            .voice-option-info { flex: 1; }
            .voice-option-name { font-size: 14px; font-weight: 600; color: #333; }
            .voice-option-desc { font-size: 11px; color: #999; }
            .voice-option-check { font-size: 18px; color: #4DD0E1; }

            /* ===== 响应式 ===== */
            @media (max-width: 768px) {
                .bar-tool-btn { width: 40px; height: 36px; }
                .bar-tool-icon { font-size: 15px; }
                .bar-tool-text { font-size: 9px; }
                .bar-divider { height: 22px; margin: 0 5px; }
                .bar-pause-btn { width: 32px; height: 32px; font-size: 14px; }
            }
            @media (max-width: 480px) {
                .bar-tool-text { display: none; }
                .bar-tool-btn { width: 34px; height: 32px; }
                .bar-tool-icon { font-size: 14px; }
                .bar-divider { margin: 0 3px; }
            }
        `;
        document.head.appendChild(style);
    }
}
