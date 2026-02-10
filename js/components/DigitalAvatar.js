/**
 * DigitalAvatar - 数字人形象组件
 * 在点读界面右侧显示数字人，播放音频时展示说话动画
 * 包含复读、连读、评测、背诵4个功能按钮
 */
class DigitalAvatar {
    constructor(container) {
        this._container = container;
        this._isAnimating = false;
        this._avatarEl = null;
        this._debug = false;

        // 功能状态
        this._continuousMode = false; // 连读模式
        this._isRecording = false;    // 录音中

        // 回调
        this._onRepeat = null;     // 复读
        this._onContinuous = null; // 连读开关
        this._onAssess = null;     // 评测
        this._onRecite = null;     // 背诵
    }

    /**
     * 渲染数字人到容器中
     * @param {string} imageSrc - 数字人图片路径
     */
    render(imageSrc) {
        const wrapper = document.createElement('div');
        wrapper.className = 'digital-avatar-wrapper';
        wrapper.innerHTML = `
            <div class="digital-avatar" id="digitalAvatar">
                <div class="avatar-glow"></div>
                <img class="avatar-image" src="${imageSrc}" alt="AI数字人老师" />
                <div class="avatar-speech-waves" id="avatarWaves">
                    <span class="wave-bar"></span>
                    <span class="wave-bar"></span>
                    <span class="wave-bar"></span>
                    <span class="wave-bar"></span>
                    <span class="wave-bar"></span>
                </div>
                <div class="avatar-status" id="avatarStatus">
                    <span class="status-icon">😊</span>
                    <span class="status-text">点击课本内容开始学习</span>
                </div>
            </div>
            <div class="avatar-action-buttons" id="avatarActions">
                <button class="avatar-action-btn" data-action="repeat" title="复读">
                    <span class="action-icon">🔁</span>
                    <span class="action-label">复读</span>
                </button>
                <button class="avatar-action-btn" data-action="continuous" title="连读">
                    <span class="action-icon">▶️</span>
                    <span class="action-label">连读</span>
                </button>
                <button class="avatar-action-btn" data-action="assess" title="评测">
                    <span class="action-icon">🎯</span>
                    <span class="action-label">评测</span>
                </button>
                <button class="avatar-action-btn" data-action="recite" title="背诵">
                    <span class="action-icon">📝</span>
                    <span class="action-label">背诵</span>
                </button>
            </div>
        `;
        this._container.appendChild(wrapper);

        this._wrapperEl = wrapper;
        this._avatarEl = wrapper.querySelector('#digitalAvatar');
        this._wavesEl = wrapper.querySelector('#avatarWaves');
        this._statusEl = wrapper.querySelector('#avatarStatus');
        this._statusIcon = wrapper.querySelector('.status-icon');
        this._statusText = wrapper.querySelector('.status-text');
        this._actionsEl = wrapper.querySelector('#avatarActions');

        this._bindButtonEvents();
        this._addStyles();
        this._log('数字人已渲染');
    }

    // ========== 按钮事件绑定 ==========
    _bindButtonEvents() {
        this._actionsEl.querySelectorAll('.avatar-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                this._handleAction(action, btn);
            });
        });
    }

    _handleAction(action, btn) {
        switch (action) {
            case 'repeat':
                this._log('复读');
                if (this._onRepeat) this._onRepeat();
                break;
            case 'continuous':
                this._continuousMode = !this._continuousMode;
                btn.classList.toggle('active', this._continuousMode);
                this._log('连读模式:', this._continuousMode);
                if (this._onContinuous) this._onContinuous(this._continuousMode);
                break;
            case 'assess':
                this._log('评测');
                if (this._onAssess) this._onAssess();
                break;
            case 'recite':
                this._log('背诵');
                if (this._onRecite) this._onRecite();
                break;
        }
    }

    // ========== 回调注册 ==========
    onRepeat(cb) { this._onRepeat = cb; }
    onContinuous(cb) { this._onContinuous = cb; }
    onAssess(cb) { this._onAssess = cb; }
    onRecite(cb) { this._onRecite = cb; }

    // ========== 说话动画 ==========
    startSpeaking(text) {
        if (this._isAnimating) return;
        this._isAnimating = true;
        this._avatarEl.classList.add('speaking');
        this._statusIcon.textContent = '🎤';
        this._statusText.textContent = text || '正在朗读...';
        this._log('开始说话动画');
    }

    stopSpeaking() {
        if (!this._isAnimating) return;
        this._isAnimating = false;
        this._avatarEl.classList.remove('speaking');
        this._statusIcon.textContent = '😊';
        this._statusText.textContent = '点击课本内容开始学习';
        this._log('停止说话动画');
    }

    // ========== 录音状态 ==========
    setRecording(isRecording, text) {
        this._isRecording = isRecording;
        if (isRecording) {
            this._avatarEl.classList.add('recording');
            this._statusIcon.textContent = '🔴';
            this._statusText.textContent = text || '录音中...';
        } else {
            this._avatarEl.classList.remove('recording');
            this._statusIcon.textContent = '😊';
            this._statusText.textContent = '点击课本内容开始学习';
        }
    }

    /** 更新状态文字 */
    setStatus(icon, text) {
        this._statusIcon.textContent = icon;
        this._statusText.textContent = text;
    }

    /** 连读模式是否开启 */
    isContinuousMode() { return this._continuousMode; }

    isSpeaking() { return this._isAnimating; }

    setDebug(enabled) { this._debug = enabled; }

    destroy() {
        this.stopSpeaking();
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
            /* ===== 整体布局 ===== */
            .digital-avatar-wrapper {
                position: fixed;
                right: 20px;
                bottom: 80px;
                z-index: 100;
                display: flex;
                flex-direction: row;
                align-items: flex-end;
                gap: 10px;
                pointer-events: none;
            }

            /* ===== 功能按钮组 ===== */
            .avatar-action-buttons {
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: auto;
                order: -1; /* 按钮在左，数字人在右 */
            }

            .avatar-action-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 72px;
                height: 72px;
                border: none;
                border-radius: 18px;
                background: rgba(255,255,255,0.95);
                box-shadow: 0 3px 14px rgba(0,0,0,0.1);
                cursor: pointer;
                transition: all 0.25s cubic-bezier(0.175,0.885,0.32,1.275);
                padding: 6px;
                gap: 3px;
            }

            .avatar-action-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            }

            .avatar-action-btn:active {
                transform: scale(0.95);
            }

            .avatar-action-btn.active {
                background: linear-gradient(135deg, #4DD0E1, #26C6DA);
                color: white;
                box-shadow: 0 4px 16px rgba(77,208,225,0.4);
            }

            .avatar-action-btn.active .action-label {
                color: white;
            }

            .avatar-action-btn.recording {
                background: linear-gradient(135deg, #EF5350, #E53935);
                color: white;
                animation: recording-pulse 1s ease-in-out infinite;
            }

            .avatar-action-btn.recording .action-label {
                color: white;
            }

            @keyframes recording-pulse {
                0%, 100% { box-shadow: 0 2px 10px rgba(229,57,53,0.3); }
                50% { box-shadow: 0 4px 20px rgba(229,57,53,0.6); }
            }

            .action-icon {
                font-size: 28px;
                line-height: 1;
            }

            .action-label {
                font-size: 13px;
                color: #5D4037;
                font-weight: 600;
                line-height: 1;
            }

            /* ===== 数字人主体 ===== */
            .digital-avatar {
                position: relative;
                height: 600px;
                width: auto;
                pointer-events: auto;
                transition: transform 0.3s ease;
            }

            .digital-avatar:hover {
                transform: scale(1.05);
            }

            .avatar-image {
                height: 100%;
                width: auto;
                display: block;
                filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15));
                transition: filter 0.3s ease;
            }

            .digital-avatar.speaking .avatar-image {
                filter: drop-shadow(0 4px 20px rgba(77,208,225,0.4));
            }

            .digital-avatar.recording .avatar-image {
                filter: drop-shadow(0 4px 20px rgba(229,57,53,0.4));
            }

            .avatar-glow {
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
                width: 80%;
                height: 16px;
                background: radial-gradient(ellipse, rgba(77,208,225,0.25) 0%, transparent 70%);
                border-radius: 50%;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .digital-avatar.speaking .avatar-glow {
                opacity: 1;
                animation: glow-pulse 1.5s ease-in-out infinite;
            }

            .digital-avatar.recording .avatar-glow {
                opacity: 1;
                background: radial-gradient(ellipse, rgba(229,57,53,0.25) 0%, transparent 70%);
                animation: glow-pulse 1.5s ease-in-out infinite;
            }

            @keyframes glow-pulse {
                0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
                50% { opacity: 1; transform: translateX(-50%) scale(1.15); }
            }

            .digital-avatar.speaking {
                animation: avatar-bob 0.6s ease-in-out infinite;
            }

            @keyframes avatar-bob {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
            }

            /* 声波 */
            .avatar-speech-waves {
                position: absolute;
                left: -40px;
                top: 18%;
                display: flex;
                align-items: center;
                gap: 4px;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .digital-avatar.speaking .avatar-speech-waves {
                opacity: 1;
            }

            .wave-bar {
                display: block;
                width: 4px;
                height: 14px;
                background: var(--color-primary, #FFAB40);
                border-radius: 2px;
            }

            .digital-avatar.speaking .wave-bar {
                animation: wave-bounce 0.8s ease-in-out infinite;
            }

            .digital-avatar.speaking .wave-bar:nth-child(1) { animation-delay: 0s; height: 12px; }
            .digital-avatar.speaking .wave-bar:nth-child(2) { animation-delay: 0.1s; height: 20px; }
            .digital-avatar.speaking .wave-bar:nth-child(3) { animation-delay: 0.2s; height: 14px; }
            .digital-avatar.speaking .wave-bar:nth-child(4) { animation-delay: 0.3s; height: 22px; }
            .digital-avatar.speaking .wave-bar:nth-child(5) { animation-delay: 0.15s; height: 10px; }

            @keyframes wave-bounce {
                0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
                50% { transform: scaleY(1); opacity: 1; }
            }

            /* 状态文字 */
            .avatar-status {
                position: absolute;
                bottom: -38px;
                left: 50%;
                transform: translateX(-50%);
                white-space: nowrap;
                background: rgba(255,255,255,0.95);
                padding: 6px 16px;
                border-radius: 14px;
                font-size: 14px;
                color: #5D4037;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                gap: 6px;
                transition: all 0.3s ease;
            }

            .digital-avatar.speaking .avatar-status {
                background: linear-gradient(135deg, rgba(77,208,225,0.15), rgba(255,255,255,0.95));
            }

            .digital-avatar.recording .avatar-status {
                background: linear-gradient(135deg, rgba(229,57,53,0.1), rgba(255,255,255,0.95));
            }

            /* ===== 评测结果弹窗 ===== */
            .assess-result-popup {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 20px;
                padding: 24px;
                min-width: 300px;
                max-width: 400px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                z-index: 200;
                text-align: center;
                animation: popup-in 0.3s ease;
            }

            @keyframes popup-in {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }

            .assess-result-popup .result-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 12px;
                color: #5D4037;
            }

            .assess-result-popup .result-score {
                font-size: 48px;
                font-weight: 800;
                margin: 8px 0;
            }

            .assess-result-popup .result-score.perfect { color: #E91E63; }
            .assess-result-popup .result-score.excellent { color: #4CAF50; }
            .assess-result-popup .result-score.good { color: #2196F3; }
            .assess-result-popup .result-score.pass { color: #FF9800; }
            .assess-result-popup .result-score.poor { color: #F44336; }

            .assess-result-popup .result-detail {
                font-size: 14px;
                color: #8D6E63;
                margin: 8px 0 16px;
                line-height: 1.6;
            }

            .assess-result-popup .result-close-btn {
                padding: 8px 32px;
                border: none;
                border-radius: 20px;
                background: linear-gradient(135deg, #4DD0E1, #26C6DA);
                color: white;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                transition: transform 0.2s;
            }

            .assess-result-popup .result-close-btn:hover {
                transform: scale(1.05);
            }

            /* 评测结果操作按钮组 */
            .assess-action-btns {
                display: flex;
                justify-content: center;
                gap: 12px;
                margin: 16px 0 12px;
            }
            .assess-action-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                padding: 10px 14px;
                border: 1.5px solid #E0E0E0;
                border-radius: 12px;
                background: #FAFAFA;
                cursor: pointer;
                transition: all 0.2s ease;
                min-width: 72px;
            }
            .assess-action-btn:hover {
                background: #F0F7FF;
                border-color: #90CAF9;
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            }
            .assess-action-btn:active {
                transform: scale(0.96);
            }
            .assess-action-btn.playing {
                background: #E3F2FD;
                border-color: #42A5F5;
            }
            .assess-btn-icon {
                font-size: 22px;
            }
            .assess-btn-text {
                font-size: 11px;
                color: #666;
                font-weight: 500;
                white-space: nowrap;
            }
            .assess-action-btn.playing .assess-btn-text {
                color: #1976D2;
            }

            /* 逐词评分 */
            .word-scores-section {
                margin: 12px 0;
                text-align: left;
            }
            .word-scores-label {
                font-size: 13px;
                color: #999;
                margin-bottom: 8px;
            }
            .word-scores-list {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                justify-content: center;
            }
            .word-score-item {
                display: inline-flex;
                flex-direction: column;
                align-items: center;
                padding: 4px 8px;
                background: #FAFAFA;
                border-radius: 6px;
            }
            .word-text {
                font-size: 16px;
                color: #333;
                font-weight: 500;
            }
            .word-score-val {
                font-size: 12px;
                font-weight: bold;
                margin-top: 2px;
            }

            /* 三维度评分 */
            .dimension-section {
                margin: 14px 0 8px;
                padding: 10px 12px;
                background: #FAFAFA;
                border-radius: 10px;
            }
            .dimension-row {
                display: flex;
                align-items: center;
                margin: 6px 0;
            }
            .dimension-label {
                font-size: 13px;
                color: #666;
                width: 52px;
                flex-shrink: 0;
            }
            .dimension-bar-bg {
                flex: 1;
                height: 8px;
                background: #E0E0E0;
                border-radius: 4px;
                overflow: hidden;
                margin: 0 8px;
            }
            .dimension-bar-fill {
                height: 100%;
                border-radius: 4px;
                transition: width 0.6s ease;
            }
            .dimension-value {
                font-size: 13px;
                font-weight: bold;
                width: 40px;
                text-align: right;
                flex-shrink: 0;
            }

            .assess-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.4);
                z-index: 199;
            }

            /* ===== 响应式 ===== */
            @media (max-width: 768px) {
                .digital-avatar-wrapper {
                    right: 10px;
                    bottom: 10px;
                    gap: 8px;
                }
                .digital-avatar { height: 350px; width: auto; }
                .avatar-action-btn {
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                }
                .action-icon { font-size: 20px; }
                .action-label { font-size: 10px; }
                .avatar-speech-waves { left: -24px; gap: 3px; }
                .wave-bar { width: 3px; }
                .avatar-status { font-size: 11px; padding: 4px 10px; bottom: -30px; }
            }

            @media (max-width: 480px) {
                .digital-avatar { height: 220px; width: auto; }
                .avatar-action-btn {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                }
                .action-icon { font-size: 16px; }
                .action-label { display: none; }
                .avatar-status { display: none; }
            }
        `;
        document.head.appendChild(style);
    }
}
