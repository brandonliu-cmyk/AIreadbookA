/**
 * TextbookSelector - 教材选择器组件
 * 管理教材版本的展示和选择
 * 
 * Requirements: 2.1, 2.3
 * - 显示当前学科下所有可用的教材版本列表
 * - 显示可爱的加载动画
 */

/**
 * TextbookSelector类
 * 负责教材选择界面的渲染和交互
 */
class TextbookSelector {
    /**
     * 创建TextbookSelector实例
     * @param {HTMLElement} container - 容器元素
     */
    constructor(container) {
        if (!container || !(container instanceof HTMLElement)) {
            throw new Error('TextbookSelector requires a valid HTMLElement container');
        }

        /**
         * 容器元素
         * @type {HTMLElement}
         * @private
         */
        this._container = container;

        /**
         * 当前选中的教材
         * @type {Object|null}
         * @private
         */
        this._selectedTextbook = null;

        /**
         * 教材列表
         * @type {Array}
         * @private
         */
        this._textbooks = [];

        /**
         * 当前学科ID
         * @type {string|null}
         * @private
         */
        this._currentSubjectId = null;

        /**
         * 数据管理器引用
         * @type {DataManager|null}
         * @private
         */
        this._dataManager = typeof dataManager !== 'undefined' ? dataManager : null;

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
         * 调试模式
         * @type {boolean}
         * @private
         */
        this._debug = true;
    }

    /**
     * 根据学科加载教材列表
     * @param {string} subjectId - 学科ID
     * @returns {Promise<Textbook[]>} 教材列表
     */
    async loadTextbooks(subjectId) {
        if (!subjectId) {
            throw new Error('subjectId is required');
        }

        if (!this._dataManager) {
            throw new Error('DataManager is not available');
        }

        this._log('正在加载教材列表...', { subjectId });
        this._currentSubjectId = subjectId;
        this._isLoading = true;

        try {
            const textbooks = await this._dataManager.getTextbooks(subjectId);
            this._textbooks = textbooks;
            this._log('教材列表加载完成', textbooks);
            return textbooks;
        } catch (error) {
            this._log('教材列表加载失败', error);
            throw error;
        } finally {
            this._isLoading = false;
        }
    }

    /**
     * 渲染教材选择界面
     * @param {Textbook[]} textbooks - 教材列表
     */
    render(textbooks) {
        if (!Array.isArray(textbooks)) {
            throw new Error('textbooks must be an array');
        }

        this._textbooks = textbooks;
        this._log('渲染教材选择界面', textbooks);

        // 清空容器
        this._container.innerHTML = '';

        // 创建标题
        const header = this._createHeader();
        this._container.appendChild(header);

        // 检查是否有教材
        if (textbooks.length === 0) {
            const emptyState = this._createEmptyState();
            this._container.appendChild(emptyState);
            return;
        }

        // 创建教材网格容器
        const grid = this._createTextbookGrid(textbooks);
        this._container.appendChild(grid);

        // 绑定事件
        this._bindEvents();
    }

    /**
     * 创建页面标题
     * @returns {HTMLElement} 标题元素
     * @private
     */
    _createHeader() {
        const header = document.createElement('div');
        header.className = 'textbook-selector-header';

        // 根据学科生成版本选择器
        let versionOptions = '';
        if (this._currentSubjectId === 'chinese') {
            versionOptions = `
                <option value="renjiao" selected>人教版</option>
            `;
        } else {
            versionOptions = `
                <option value="hujiao" selected>沪教版</option>
            `;
        }

        header.innerHTML = `
            <h2 class="textbook-selector-title">📖 选择教材</h2>
            <p class="textbook-selector-subtitle">选择你正在使用的教材版本吧！</p>
            <div class="version-selector-wrapper">
                <select class="version-selector" id="versionSelector">
                    ${versionOptions}
                </select>
            </div>
        `;
        return header;
    }

    /**
     * 创建空状态提示
     * @returns {HTMLElement} 空状态元素
     * @private
     */
    _createEmptyState() {
        const empty = document.createElement('div');
        empty.className = 'textbook-empty-state';
        empty.innerHTML = `
            <div class="empty-icon animate-float">📚</div>
            <p class="empty-title">内容即将上线</p>
            <p class="empty-subtitle">小朋友，这个学科的教材正在准备中，敬请期待哦！</p>
            <div class="empty-decoration">
                <span class="decoration-star animate-twinkle">⭐</span>
                <span class="decoration-star animate-twinkle" style="animation-delay: 0.3s">⭐</span>
                <span class="decoration-star animate-twinkle" style="animation-delay: 0.6s">⭐</span>
            </div>
        `;
        return empty;
    }

    /**
     * 创建教材网格
     * @param {Textbook[]} textbooks - 教材列表
     * @returns {HTMLElement} 网格容器元素
     * @private
     */
    _createTextbookGrid(textbooks) {
        const grid = document.createElement('div');
        grid.className = 'textbook-grid';
        grid.setAttribute('role', 'listbox');
        grid.setAttribute('aria-label', '教材选择');

        textbooks.forEach((textbook, index) => {
            const card = this._createTextbookCard(textbook, index);
            grid.appendChild(card);
        });

        return grid;
    }

    /**
     * 创建教材卡片
     * @param {Textbook} textbook - 教材对象
     * @param {number} index - 索引
     * @returns {HTMLElement} 卡片元素
     * @private
     */
    _createTextbookCard(textbook, index) {
        const card = document.createElement('div');
        card.className = 'card-textbook animate-bounce-in';
        
        // 设置动画延迟，实现依次出现效果
        card.style.animationDelay = `${index * 0.1}s`;
        
        // 设置数据属性
        card.setAttribute('data-textbook-id', textbook.id);
        card.setAttribute('role', 'option');
        card.setAttribute('aria-selected', 'false');
        card.setAttribute('tabindex', '0');

        // 获取学科对应的图标和颜色
        const subjectInfo = this._getSubjectInfo(textbook.subjectId);

        // 获取学习进度
        const progressInfo = this._getTextbookProgress(textbook.id);
        let progressBadgeHtml = '';
        if (progressInfo.hasProgress) {
            if (progressInfo.isCompleted) {
                progressBadgeHtml = `<span class="textbook-progress-badge badge-completed">✓ 已完成</span>`;
            } else {
                progressBadgeHtml = `<span class="textbook-progress-badge badge-in-progress">进行中 ${progressInfo.progress}%</span>`;
            }
        }

        // 解析教材名称，分为版本和年级学期两行
        // 例如："沪教版英语三年级上册" -> "沪教版" + "三年级上册"
        const nameInfo = this._parseTextbookName(textbook.name);

        // 卡片内容
        let coverHtml = '';
        if (textbook.coverImage) {
            const encodedCoverImage = encodeURI(textbook.coverImage);
            coverHtml = `
                <div class="card-textbook-cover" style="background: #f0f0f0; padding: 0;">
                    <img src="${encodedCoverImage}" alt="${textbook.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-md);">
                </div>
            `;
        } else {
            coverHtml = `
                <div class="card-textbook-cover" style="background: ${subjectInfo.gradient}">
                    <span class="textbook-cover-icon">${subjectInfo.icon}</span>
                </div>
            `;
        }
        
        card.innerHTML = `
            ${progressBadgeHtml}
            ${coverHtml}
            <div class="card-textbook-info">
                <h3 class="card-textbook-title">${nameInfo.version}</h3>
                <p class="card-textbook-grade">${nameInfo.gradeInfo}</p>
            </div>
            </div>
        `;

        return card;
    }

    /**
     * 获取教材学习进度
     * @param {string} textbookId - 教材ID
     * @returns {Object} 进度信息
     * @private
     */
    _getTextbookProgress(textbookId) {
        // 为特定教材设置固定的进度信息
        if (textbookId === 'english-hj-3-1') {
            // 沪教版三年级上册 - 已完成
            return {
                hasProgress: true,
                isCompleted: true,
                progress: 100,
                completedCount: 8,
                totalCount: 8
            };
        } else if (textbookId === 'english-hj-3-1-new') {
            // 沪教版三年级上册(2024秋版) - 进行中 50%
            return {
                hasProgress: true,
                isCompleted: false,
                progress: 50,
                completedCount: 4,
                totalCount: 8
            };
        } else if (textbookId === 'english-hj-3-2') {
            // 沪教版三年级下册 - 无标签
            return {
                hasProgress: false,
                isCompleted: false,
                progress: 0
            };
        } else if (textbookId === 'chinese-rj-1-1-new') {
            // 人教版一年级上册 - 已完成
            return {
                hasProgress: true,
                isCompleted: true,
                progress: 100,
                completedCount: 8,
                totalCount: 8
            };
        } else if (textbookId === 'chinese-rj-1-2-new') {
            // 人教版一年级下册 - 已完成
            return {
                hasProgress: true,
                isCompleted: true,
                progress: 100,
                completedCount: 8,
                totalCount: 8
            };
        } else if (textbookId === 'chinese-rj-2-1-new') {
            // 人教版二年级上册 - 进行中 35%
            return {
                hasProgress: true,
                isCompleted: false,
                progress: 35,
                completedCount: 3,
                totalCount: 8
            };
        }
        
        try {
            // 尝试从 storageManager 获取学习记录
            if (typeof storageManager !== 'undefined') {
                const record = storageManager.getLearningRecord(textbookId);
                if (record && record.progress) {
                    const lessonIds = Object.keys(record.progress);
                    if (lessonIds.length > 0) {
                        const completedCount = lessonIds.filter(id => record.progress[id].isCompleted).length;
                        const totalCount = record.totalLessons || lessonIds.length;
                        const progress = Math.round((completedCount / totalCount) * 100);
                        return {
                            hasProgress: true,
                            isCompleted: progress >= 100,
                            progress: progress,
                            completedCount: completedCount,
                            totalCount: totalCount
                        };
                    }
                }
            }
        } catch (error) {
            this._log('获取进度失败', error);
        }
        return { hasProgress: false, isCompleted: false, progress: 0 };
    }

    /**
     * 解析教材名称，分为版本和年级学期
     * @param {string} name - 教材名称，如"沪教版英语三年级上册"
     * @returns {Object} 包含version和gradeInfo的对象
     * @private
     */
    _parseTextbookName(name) {
        // 匹配模式：版本 + 学科 + 年级 + 学期
        // 例如：沪教版英语三年级上册、人教版语文四年级下册
        const patterns = [
            // 匹配：沪教版英语三年级上册(2024秋版) -> 沪教版(2024秋版) + 三年级上册
            /^(.+版)(.+?)([\d一二三四五六]+年级[上下]册)(\(.+\))?$/,
            // 匹配：沪教版英语三年级上册 -> 沪教版 + 三年级上册
            /^(.+版)(.+?)([\d一二三四五六]+年级[上下]册)$/,
        ];
        
        for (const pattern of patterns) {
            const match = name.match(pattern);
            if (match) {
                const version = match[1] + (match[4] || ''); // 版本 + 可能的年份标识
                const gradeInfo = match[3]; // 年级学期
                return { version, gradeInfo };
            }
        }
        
        // 如果无法解析，返回原名称
        return { version: name, gradeInfo: '' };
    }

    /**
     * 根据学科ID获取学科信息
     * @param {string} subjectId - 学科ID
     * @returns {Object} 学科信息（图标和渐变色）
     * @private
     */
    _getSubjectInfo(subjectId) {
        const infoMap = {
            'english': {
                icon: '🔤',
                gradient: 'linear-gradient(135deg, #4ECDC4 0%, #7EDDD6 100%)'
            },
            'chinese': {
                icon: '📖',
                gradient: 'linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%)'
            },
            'math': {
                icon: '🔢',
                gradient: 'linear-gradient(135deg, #FFE66D 0%, #FFED99 100%)'
            },
            'science': {
                icon: '🔬',
                gradient: 'linear-gradient(135deg, #7ED957 0%, #A5E88A 100%)'
            },
            'art': {
                icon: '🎨',
                gradient: 'linear-gradient(135deg, #A78BFA 0%, #C4B5FD 100%)'
            },
            'music': {
                icon: '🎵',
                gradient: 'linear-gradient(135deg, #FFA94D 0%, #FFBE73 100%)'
            }
        };
        return infoMap[subjectId] || infoMap['english'];
    }

    /**
     * 绑定事件监听器
     * @private
     */
    _bindEvents() {
        const cards = this._container.querySelectorAll('.card-textbook');
        
        cards.forEach(card => {
            // 点击事件
            card.addEventListener('click', (e) => {
                const textbookId = card.getAttribute('data-textbook-id');
                this.selectTextbook(textbookId);
            });

            // 键盘事件（支持无障碍访问）
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const textbookId = card.getAttribute('data-textbook-id');
                    this.selectTextbook(textbookId);
                }
            });
        });
    }

    /**
     * 选择教材
     * @param {string} textbookId - 教材ID
     */
    selectTextbook(textbookId) {
        if (!textbookId) {
            this._log('无效的教材ID');
            return;
        }

        // 查找教材对象
        const textbook = this._textbooks.find(t => t.id === textbookId);
        if (!textbook) {
            this._log('未找到教材', textbookId);
            return;
        }

        this._log('选择教材', textbook);

        // 更新选中状态
        this._selectedTextbook = textbook;

        // 高亮显示选中项
        this._highlightSelected(textbookId);

        // 触发选择回调
        if (this._onSelectCallback && typeof this._onSelectCallback === 'function') {
            this._onSelectCallback(textbook);
        }
    }

    /**
     * 获取当前选中的教材
     * @returns {Textbook|null} 选中的教材对象
     */
    getSelectedTextbook() {
        return this._selectedTextbook;
    }

    /**
     * 高亮显示选中项
     * @param {string} textbookId - 教材ID
     * @private
     */
    _highlightSelected(textbookId) {
        if (!textbookId) {
            return;
        }

        const cards = this._container.querySelectorAll('.card-textbook');
        
        cards.forEach(card => {
            const cardTextbookId = card.getAttribute('data-textbook-id');
            
            if (cardTextbookId === textbookId) {
                // 添加选中样式
                card.classList.add('selected');
                card.setAttribute('aria-selected', 'true');
                
                // 添加选中动画
                card.classList.add('animate-jelly');
                
                // 动画结束后移除动画类
                setTimeout(() => {
                    card.classList.remove('animate-jelly');
                }, 500);
            } else {
                // 移除其他卡片的选中样式
                card.classList.remove('selected');
                card.setAttribute('aria-selected', 'false');
            }
        });

        this._log('高亮显示教材', textbookId);
    }

    /**
     * 显示加载动画
     */
    showLoading() {
        this._isLoading = true;
        this._container.innerHTML = `
            <div class="loading-container textbook-loading">
                <div class="loading-cute">
                    <div class="loading-book-animation">
                        <div class="book-spine"></div>
                        <div class="book-page book-page-1"></div>
                        <div class="book-page book-page-2"></div>
                        <div class="book-page book-page-3"></div>
                    </div>
                    <div class="loading-stars">
                        <span class="star star-1">⭐</span>
                        <span class="star star-2">✨</span>
                        <span class="star star-3">⭐</span>
                    </div>
                </div>
                <p class="loading-text">正在加载教材...</p>
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
    }

    /**
     * 隐藏加载动画
     */
    hideLoading() {
        this._isLoading = false;
    }

    /**
     * 清除选中状态
     */
    clearSelection() {
        this._selectedTextbook = null;
        
        const cards = this._container.querySelectorAll('.card-textbook');
        cards.forEach(card => {
            card.classList.remove('selected');
            card.setAttribute('aria-selected', 'false');
        });

        this._log('清除选中状态');
    }

    /**
     * 设置选择回调函数
     * @param {Function} callback - 回调函数，接收选中的教材对象
     */
    onSelect(callback) {
        if (typeof callback === 'function') {
            this._onSelectCallback = callback;
        }
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
                <p class="error-message">${message || '教材加载失败，请重试'}</p>
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
     * 获取教材列表
     * @returns {Textbook[]} 教材列表
     */
    getTextbooks() {
        return [...this._textbooks];
    }

    /**
     * 获取当前学科ID
     * @returns {string|null} 学科ID
     */
    getCurrentSubjectId() {
        return this._currentSubjectId;
    }

    /**
     * 检查是否正在加载
     * @returns {boolean} 是否正在加载
     */
    isLoading() {
        return this._isLoading;
    }

    /**
     * 设置数据管理器
     * @param {DataManager} dataManager - 数据管理器实例
     */
    setDataManager(dataManager) {
        this._dataManager = dataManager;
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
        this._selectedTextbook = null;
        this._textbooks = [];
        this._currentSubjectId = null;
        this._onSelectCallback = null;
        this._isLoading = false;

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
                console.log(`[TextbookSelector] ${message}`, data);
            } else {
                console.log(`[TextbookSelector] ${message}`);
            }
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TextbookSelector };
}
