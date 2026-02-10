/**
 * SubjectSelector - 学科选择器组件
 * 管理学科列表的展示和选择逻辑
 * 
 * Requirements: 1.1, 1.2
 * - 显示学科选择界面，包含英语、语文、数学等学科选项
 * - 高亮显示选中的学科
 */

/**
 * SubjectSelector类
 * 负责学科选择界面的渲染和交互
 */
class SubjectSelector {
    /**
     * 创建SubjectSelector实例
     * @param {HTMLElement} container - 容器元素
     */
    constructor(container) {
        if (!container || !(container instanceof HTMLElement)) {
            throw new Error('SubjectSelector requires a valid HTMLElement container');
        }

        /**
         * 容器元素
         * @type {HTMLElement}
         * @private
         */
        this._container = container;

        /**
         * 当前选中的学科
         * @type {Object|null}
         * @private
         */
        this._selectedSubject = null;

        /**
         * 学科列表
         * @type {Array}
         * @private
         */
        this._subjects = [];

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
     * 加载学科列表
     * @returns {Promise<Subject[]>} 学科列表
     */
    async loadSubjects() {
        if (!this._dataManager) {
            throw new Error('DataManager is not available');
        }

        this._log('正在加载学科列表...');
        this._isLoading = true;

        try {
            const subjects = await this._dataManager.getSubjects();
            this._subjects = subjects;
            this._log('学科列表加载完成', subjects);
            return subjects;
        } catch (error) {
            this._log('学科列表加载失败', error);
            throw error;
        } finally {
            this._isLoading = false;
        }
    }

    /**
     * 渲染学科选择界面
     * @param {Subject[]} subjects - 学科列表
     */
    render(subjects) {
        if (!Array.isArray(subjects)) {
            throw new Error('subjects must be an array');
        }

        this._subjects = subjects;
        this._log('渲染学科选择界面', subjects);

        // 清空容器
        this._container.innerHTML = '';

        // 创建标题
        const header = this._createHeader();
        this._container.appendChild(header);

        // 创建学科网格容器
        const grid = this._createSubjectGrid(subjects);
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
        header.className = 'subject-selector-header';
        header.innerHTML = `
            <h2 class="subject-selector-title">📚 选择学科</h2>
            <p class="subject-selector-subtitle">点击选择你想学习的科目吧！</p>
        `;
        return header;
    }

    /**
     * 创建学科网格
     * @param {Subject[]} subjects - 学科列表
     * @returns {HTMLElement} 网格容器元素
     * @private
     */
    _createSubjectGrid(subjects) {
        const grid = document.createElement('div');
        grid.className = 'subject-grid grid grid-3';
        grid.setAttribute('role', 'listbox');
        grid.setAttribute('aria-label', '学科选择');

        subjects.forEach((subject, index) => {
            const card = this._createSubjectCard(subject, index);
            grid.appendChild(card);
        });

        return grid;
    }

    /**
     * 创建学科卡片
     * @param {Subject} subject - 学科对象
     * @param {number} index - 索引
     * @returns {HTMLElement} 卡片元素
     * @private
     */
    _createSubjectCard(subject, index) {
        const card = document.createElement('div');
        
        // 根据学科ID设置对应的样式类
        const subjectClass = this._getSubjectClass(subject.id);
        card.className = `card-subject ${subjectClass} animate-bounce-in`;
        
        // 设置动画延迟，实现依次出现效果
        card.style.animationDelay = `${index * 0.1}s`;
        
        // 设置数据属性
        card.setAttribute('data-subject-id', subject.id);
        card.setAttribute('role', 'option');
        card.setAttribute('aria-selected', 'false');
        card.setAttribute('tabindex', '0');

        // 卡片内容
        card.innerHTML = `
            <span class="card-subject-icon" aria-hidden="true">${subject.icon}</span>
            <span class="card-subject-name">${subject.name}</span>
        `;

        return card;
    }

    /**
     * 根据学科ID获取对应的CSS类名
     * @param {string} subjectId - 学科ID
     * @returns {string} CSS类名
     * @private
     */
    _getSubjectClass(subjectId) {
        const classMap = {
            'english': 'card-subject-english',
            'chinese': 'card-subject-chinese',
            'math': 'card-subject-math',
            'science': 'card-subject-science',
            'art': 'card-subject-art',
            'music': 'card-subject-music'
        };
        return classMap[subjectId] || 'card-subject-english';
    }

    /**
     * 绑定事件监听器
     * @private
     */
    _bindEvents() {
        const cards = this._container.querySelectorAll('.card-subject');
        
        cards.forEach(card => {
            // 点击事件
            card.addEventListener('click', (e) => {
                const subjectId = card.getAttribute('data-subject-id');
                this.selectSubject(subjectId);
            });

            // 键盘事件（支持无障碍访问）
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const subjectId = card.getAttribute('data-subject-id');
                    this.selectSubject(subjectId);
                }
            });
        });
    }

    /**
     * 选择学科
     * @param {string} subjectId - 学科ID
     */
    selectSubject(subjectId) {
        if (!subjectId) {
            this._log('无效的学科ID');
            return;
        }

        // 查找学科对象
        const subject = this._subjects.find(s => s.id === subjectId);
        if (!subject) {
            this._log('未找到学科', subjectId);
            return;
        }

        this._log('选择学科', subject);

        // 更新选中状态
        this._selectedSubject = subject;

        // 高亮显示选中项
        this.highlightSelected(subjectId);

        // 触发选择回调
        if (this._onSelectCallback && typeof this._onSelectCallback === 'function') {
            this._onSelectCallback(subject);
        }
    }

    /**
     * 获取当前选中的学科
     * @returns {Subject|null} 选中的学科对象
     */
    getSelectedSubject() {
        return this._selectedSubject;
    }

    /**
     * 高亮显示选中项
     * @param {string} subjectId - 学科ID
     */
    highlightSelected(subjectId) {
        if (!subjectId) {
            return;
        }

        const cards = this._container.querySelectorAll('.card-subject');
        
        cards.forEach(card => {
            const cardSubjectId = card.getAttribute('data-subject-id');
            
            if (cardSubjectId === subjectId) {
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

        this._log('高亮显示学科', subjectId);
    }

    /**
     * 清除选中状态
     */
    clearSelection() {
        this._selectedSubject = null;
        
        const cards = this._container.querySelectorAll('.card-subject');
        cards.forEach(card => {
            card.classList.remove('selected');
            card.setAttribute('aria-selected', 'false');
        });

        this._log('清除选中状态');
    }

    /**
     * 设置选择回调函数
     * @param {Function} callback - 回调函数，接收选中的学科对象
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
                <p class="loading-text">正在加载学科...</p>
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
     * 获取学科列表
     * @returns {Subject[]} 学科列表
     */
    getSubjects() {
        return [...this._subjects];
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
        this._selectedSubject = null;
        this._subjects = [];
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
                console.log(`[SubjectSelector] ${message}`, data);
            } else {
                console.log(`[SubjectSelector] ${message}`);
            }
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SubjectSelector };
}
