/**
 * VoiceSelector - 音色选择器组件
 * 管理音色的选择和预览
 * 
 * Requirements: 6.1, 6.4
 * - 6.1: 提供多种音色选择（如男声、女声、童声等）
 * - 6.4: 音色切换时有平滑的过渡效果
 */

/**
 * VoiceSelector类
 * 负责音色选择界面的渲染和交互
 */
class VoiceSelector {
    /**
     * 创建VoiceSelector实例
     * @param {HTMLElement} container - 容器元素
     */
    constructor(container) {
        if (!container || !(container instanceof HTMLElement)) {
            throw new Error('VoiceSelector requires a valid HTMLElement container');
        }

        /**
         * 容器元素
         * @type {HTMLElement}
         * @private
         */
        this._container = container;

        /**
         * 当前选中的音色
         * @type {Object|null}
         * @private
         */
        this._selectedVoice = null;

        /**
         * 音色列表
         * @type {Array}
         * @private
         */
        this._voices = [];

        /**
         * 数据管理器引用
         * @type {DataManager|null}
         * @private
         */
        this._dataManager = typeof dataManager !== 'undefined' ? dataManager : null;

        /**
         * 存储管理器引用
         * @type {StorageManager|null}
         * @private
         */
        this._storageManager = typeof storageManager !== 'undefined' ? storageManager : null;

        /**
         * 音频播放器引用（用于试听）
         * @type {AudioPlayer|null}
         * @private
         */
        this._audioPlayer = null;

        /**
         * 选择回调函数
         * @type {Function|null}
         * @private
         */
        this._onSelectCallback = null;

        /**
         * 是否正在加载
         * @type {boolean}
         * @private
         */
        this._isLoading = false;

        /**
         * 是否正在试听
         * @type {boolean}
         * @private
         */
        this._isPreviewing = false;

        /**
         * 当前试听的音色ID
         * @type {string|null}
         * @private
         */
        this._previewingVoiceId = null;

        /**
         * 调试模式
         * @type {boolean}
         * @private
         */
        this._debug = true;

        // 初始化时加载已保存的音色偏好
        this._loadSavedPreference();
    }

    /**
     * 加载已保存的音色偏好
     * @private
     */
    _loadSavedPreference() {
        if (this._storageManager) {
            const savedVoiceId = this._storageManager.getSelectedVoiceId();
            if (savedVoiceId) {
                this._log('加载已保存的音色偏好', savedVoiceId);
            }
        }
    }

    /**
     * 加载可用音色列表
     * @returns {Promise<Voice[]>} 音色列表
     */
    async loadVoices() {
        if (!this._dataManager) {
            throw new Error('DataManager is not available');
        }

        this._log('正在加载音色列表...');
        this._isLoading = true;

        try {
            const voices = await this._dataManager.getVoices();
            this._voices = voices;
            this._log('音色列表加载完成', voices);

            // 如果有保存的偏好，设置选中状态
            if (this._storageManager) {
                const savedVoiceId = this._storageManager.getSelectedVoiceId();
                const savedVoice = voices.find(v => v.id === savedVoiceId);
                if (savedVoice) {
                    this._selectedVoice = savedVoice;
                }
            }

            // 如果没有选中的音色，默认选择第一个
            if (!this._selectedVoice && voices.length > 0) {
                this._selectedVoice = voices[0];
            }

            return voices;
        } catch (error) {
            this._log('音色列表加载失败', error);
            throw error;
        } finally {
            this._isLoading = false;
        }
    }

    /**
     * 渲染音色选择界面
     * @param {Voice[]} voices - 音色列表
     */
    render(voices) {
        if (!Array.isArray(voices)) {
            throw new Error('voices must be an array');
        }

        this._voices = voices;
        this._log('渲染音色选择界面', voices);

        // 清空容器
        this._container.innerHTML = '';

        // 创建音色设置面板
        const panel = this._createVoicePanel(voices);
        this._container.appendChild(panel);

        // 绑定事件
        this._bindEvents();

        // 如果有选中的音色，高亮显示
        if (this._selectedVoice) {
            this._highlightSelected(this._selectedVoice.id);
        }
    }

    /**
     * 创建音色设置面板
     * @param {Voice[]} voices - 音色列表
     * @returns {HTMLElement} 面板元素
     * @private
     */
    _createVoicePanel(voices) {
        const panel = document.createElement('div');
        panel.className = 'voice-selector-panel';
        panel.innerHTML = `
            <div class="voice-selector-header">
                <h3 class="voice-selector-title">🎤 选择朗读音色</h3>
                <p class="voice-selector-subtitle">选择你喜欢的声音来学习吧！</p>
            </div>
            <div class="voice-list" role="listbox" aria-label="音色选择">
                ${voices.map((voice, index) => this._createVoiceCardHTML(voice, index)).join('')}
            </div>
        `;
        return panel;
    }

    /**
     * 创建音色卡片HTML
     * @param {Voice} voice - 音色对象
     * @param {number} index - 索引
     * @returns {string} HTML字符串
     * @private
     */
    _createVoiceCardHTML(voice, index) {
        const isSelected = this._selectedVoice && this._selectedVoice.id === voice.id;
        const isDisabled = voice.disabled === true;
        const typeIcon = this._getVoiceTypeIcon(voice.type);
        const typeLabel = this._getVoiceTypeLabel(voice.type);
        const typeClass = this._getVoiceTypeClass(voice.type);

        return `
            <div class="voice-card ${typeClass} ${isSelected ? 'selected' : ''} ${isDisabled ? 'voice-disabled' : ''} animate-bounce-in"
                 data-voice-id="${voice.id}"
                 ${isDisabled ? 'data-disabled="true"' : ''}
                 role="option"
                 aria-selected="${isSelected}"
                 aria-disabled="${isDisabled}"
                 tabindex="${isDisabled ? -1 : 0}"
                 style="animation-delay: ${index * 0.1}s">
                <div class="voice-card-icon">
                    <span class="voice-type-icon">${typeIcon}</span>
                </div>
                <div class="voice-card-content">
                    <div class="voice-card-header">
                        <span class="voice-name">${voice.name}</span>
                        <span class="voice-type-badge ${typeClass}-badge">${typeLabel}</span>
                        ${isDisabled ? '<span class="voice-coming-soon">即将上线</span>' : ''}
                    </div>
                    <p class="voice-description">${voice.description}</p>
                </div>
                <div class="voice-card-actions">
                    <button class="btn-preview ${typeClass}-btn" 
                            data-voice-id="${voice.id}"
                            aria-label="试听${voice.name}"
                            ${isDisabled ? 'disabled' : ''}>
                        <span class="preview-icon">🔊</span>
                        <span class="preview-text">试听</span>
                    </button>
                </div>
                <div class="voice-selected-indicator">
                    <span class="checkmark">✓</span>
                </div>
            </div>
        `;
    }

    /**
     * 获取音色类型图标
     * @param {string} type - 音色类型
     * @returns {string} 图标
     * @private
     */
    _getVoiceTypeIcon(type) {
        const iconMap = {
            'male': '👨',
            'female': '👩',
            'child': '👧'
        };
        return iconMap[type] || '🎤';
    }

    /**
     * 获取音色类型标签
     * @param {string} type - 音色类型
     * @returns {string} 标签文本
     * @private
     */
    _getVoiceTypeLabel(type) {
        const labelMap = {
            'male': '男声',
            'female': '女声',
            'child': '童声'
        };
        return labelMap[type] || '其他';
    }

    /**
     * 获取音色类型CSS类名
     * @param {string} type - 音色类型
     * @returns {string} CSS类名
     * @private
     */
    _getVoiceTypeClass(type) {
        const classMap = {
            'male': 'voice-type-male',
            'female': 'voice-type-female',
            'child': 'voice-type-child'
        };
        return classMap[type] || 'voice-type-default';
    }

    /**
     * 绑定事件监听器
     * @private
     */
    _bindEvents() {
        const cards = this._container.querySelectorAll('.voice-card');
        const previewBtns = this._container.querySelectorAll('.btn-preview');

        // 卡片点击事件（选择音色）
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                // 禁用的卡片不可点击
                if (card.getAttribute('data-disabled') === 'true') return;
                // 如果点击的是试听按钮，不触发选择
                if (e.target.closest('.btn-preview')) {
                    return;
                }
                const voiceId = card.getAttribute('data-voice-id');
                this.selectVoice(voiceId);
            });

            // 键盘事件（支持无障碍访问）
            card.addEventListener('keydown', (e) => {
                if (card.getAttribute('data-disabled') === 'true') return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const voiceId = card.getAttribute('data-voice-id');
                    this.selectVoice(voiceId);
                }
            });
        });

        // 试听按钮点击事件
        previewBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (btn.disabled) return;
                const voiceId = btn.getAttribute('data-voice-id');
                await this.previewVoice(voiceId);
            });
        });
    }

    /**
     * 试听音色
     * @param {string} voiceId - 音色ID
     * @returns {Promise<void>}
     */
    async previewVoice(voiceId) {
        if (!voiceId) {
            this._log('无效的音色ID');
            return;
        }

        const voice = this._voices.find(v => v.id === voiceId);
        if (!voice) {
            this._log('未找到音色', voiceId);
            return;
        }

        this._log('试听音色', voice);

        // 更新试听状态
        this._isPreviewing = true;
        this._previewingVoiceId = voiceId;

        // 更新UI显示试听状态
        this._updatePreviewState(voiceId, true);

        try {
            // 如果有音频播放器，使用它播放
            if (this._audioPlayer) {
                await this._audioPlayer.play(voice.previewAudioUrl);
            } else {
                // 否则创建临时音频元素播放
                await this._playPreviewAudio(voice.previewAudioUrl);
            }
        } catch (error) {
            this._log('试听失败', error);
        } finally {
            this._isPreviewing = false;
            this._previewingVoiceId = null;
            this._updatePreviewState(voiceId, false);
        }
    }

    /**
     * 播放预览音频
     * @param {string} audioUrl - 音频URL
     * @returns {Promise<void>}
     * @private
     */
    _playPreviewAudio(audioUrl) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(audioUrl);
            
            audio.onended = () => {
                resolve();
            };

            audio.onerror = (error) => {
                this._log('音频加载失败', error);
                // 模拟播放完成（用于演示）
                setTimeout(resolve, 1500);
            };

            audio.play().catch(error => {
                this._log('音频播放失败', error);
                // 模拟播放完成（用于演示）
                setTimeout(resolve, 1500);
            });
        });
    }

    /**
     * 更新试听状态UI
     * @param {string} voiceId - 音色ID
     * @param {boolean} isPreviewing - 是否正在试听
     * @private
     */
    _updatePreviewState(voiceId, isPreviewing) {
        const btn = this._container.querySelector(`.btn-preview[data-voice-id="${voiceId}"]`);
        if (!btn) return;

        const icon = btn.querySelector('.preview-icon');
        const text = btn.querySelector('.preview-text');

        if (isPreviewing) {
            btn.classList.add('previewing');
            if (icon) icon.textContent = '🔉';
            if (text) text.textContent = '播放中';
            btn.disabled = true;
        } else {
            btn.classList.remove('previewing');
            if (icon) icon.textContent = '🔊';
            if (text) text.textContent = '试听';
            btn.disabled = false;
        }
    }

    /**
     * 选择音色
     * @param {string} voiceId - 音色ID
     */
    selectVoice(voiceId) {
        if (!voiceId) {
            this._log('无效的音色ID');
            return;
        }

        // 查找音色对象
        const voice = this._voices.find(v => v.id === voiceId);
        if (!voice) {
            this._log('未找到音色', voiceId);
            return;
        }

        this._log('选择音色', voice);

        // 更新选中状态
        this._selectedVoice = voice;

        // 高亮显示选中项（带过渡效果）
        this._highlightSelected(voiceId);

        // 保存用户偏好
        this.savePreference(voiceId);

        // 触发选择回调
        if (this._onSelectCallback && typeof this._onSelectCallback === 'function') {
            this._onSelectCallback(voice);
        }
    }

    /**
     * 获取当前选中的音色
     * @returns {Voice|null} 选中的音色对象
     */
    getSelectedVoice() {
        return this._selectedVoice;
    }

    /**
     * 高亮显示选中项（带平滑过渡效果）
     * Requirements: 6.4 - 音色切换时有平滑的过渡效果
     * @param {string} voiceId - 音色ID
     * @private
     */
    _highlightSelected(voiceId) {
        if (!voiceId) {
            return;
        }

        const cards = this._container.querySelectorAll('.voice-card');

        cards.forEach(card => {
            const cardVoiceId = card.getAttribute('data-voice-id');

            if (cardVoiceId === voiceId) {
                // 添加选中样式（带过渡动画）
                card.classList.add('selected');
                card.setAttribute('aria-selected', 'true');

                // 添加选中动画效果
                card.classList.add('animate-jelly');

                // 动画结束后移除动画类
                setTimeout(() => {
                    card.classList.remove('animate-jelly');
                }, 500);
            } else {
                // 移除其他卡片的选中样式（带淡出效果）
                card.classList.remove('selected');
                card.setAttribute('aria-selected', 'false');
            }
        });

        this._log('高亮显示音色', voiceId);
    }

    /**
     * 保存用户偏好
     * @param {string} voiceId - 音色ID
     */
    savePreference(voiceId) {
        if (!voiceId) {
            this._log('无效的音色ID，无法保存偏好');
            return;
        }

        if (this._storageManager) {
            const success = this._storageManager.saveSelectedVoiceId(voiceId);
            if (success) {
                this._log('音色偏好已保存', voiceId);
            } else {
                this._log('音色偏好保存失败');
            }
        } else {
            this._log('StorageManager不可用，无法保存偏好');
        }
    }

    /**
     * 清除选中状态
     */
    clearSelection() {
        this._selectedVoice = null;

        const cards = this._container.querySelectorAll('.voice-card');
        cards.forEach(card => {
            card.classList.remove('selected');
            card.setAttribute('aria-selected', 'false');
        });

        this._log('清除选中状态');
    }

    /**
     * 设置选择回调函数
     * @param {Function} callback - 回调函数，接收选中的音色对象
     */
    onSelect(callback) {
        if (typeof callback === 'function') {
            this._onSelectCallback = callback;
        }
    }

    /**
     * 显示加载状态
     */
    showLoading() {
        this._isLoading = true;
        this._container.innerHTML = `
            <div class="loading-container">
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <p class="loading-text">正在加载音色...</p>
            </div>
        `;
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        this._isLoading = false;
    }

    /**
     * 显示错误状态
     * @param {string} message - 错误消息
     * @param {Function} onRetry - 重试回调函数
     */
    showError(message, onRetry) {
        this._container.innerHTML = `
            <div class="error-container text-center">
                <div class="error-icon">😢</div>
                <p class="error-message">${message || '加载失败，请重试'}</p>
                <button class="btn btn-cartoon-primary retry-btn">
                    🔄 重试
                </button>
            </div>
        `;

        // 绑定重试按钮事件
        const retryBtn = this._container.querySelector('.retry-btn');
        if (retryBtn && typeof onRetry === 'function') {
            retryBtn.addEventListener('click', onRetry);
        }
    }

    /**
     * 获取容器元素
     * @returns {HTMLElement} 容器元素
     */
    getContainer() {
        return this._container;
    }

    /**
     * 获取音色列表
     * @returns {Voice[]} 音色列表
     */
    getVoices() {
        return [...this._voices];
    }

    /**
     * 检查是否正在加载
     * @returns {boolean} 是否正在加载
     */
    isLoading() {
        return this._isLoading;
    }

    /**
     * 检查是否正在试听
     * @returns {boolean} 是否正在试听
     */
    isPreviewing() {
        return this._isPreviewing;
    }

    /**
     * 设置数据管理器
     * @param {DataManager} dataManager - 数据管理器实例
     */
    setDataManager(dataManager) {
        this._dataManager = dataManager;
    }

    /**
     * 设置存储管理器
     * @param {StorageManager} storageManager - 存储管理器实例
     */
    setStorageManager(storageManager) {
        this._storageManager = storageManager;
    }

    /**
     * 设置音频播放器
     * @param {AudioPlayer} audioPlayer - 音频播放器实例
     */
    setAudioPlayer(audioPlayer) {
        this._audioPlayer = audioPlayer;
    }

    /**
     * 设置调试模式
     * @param {boolean} enabled - 是否启用调试
     */
    setDebug(enabled) {
        this._debug = enabled;
    }

    /**
     * 销毁组件
     */
    destroy() {
        // 清空容器
        this._container.innerHTML = '';

        // 重置状态
        this._selectedVoice = null;
        this._voices = [];
        this._onSelectCallback = null;
        this._isLoading = false;
        this._isPreviewing = false;
        this._previewingVoiceId = null;

        this._log('组件已销毁');
    }

    /**
     * 输出调试日志
     * @param {string} message - 日志消息
     * @param {*} [data] - 附加数据
     * @private
     */
    _log(message, data) {
        if (this._debug) {
            if (data !== undefined) {
                console.log(`[VoiceSelector] ${message}`, data);
            } else {
                console.log(`[VoiceSelector] ${message}`);
            }
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VoiceSelector };
}
