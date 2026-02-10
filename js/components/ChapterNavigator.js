/**
 * ChapterNavigator - 章节导航器组件
 * 管理章节和课程的树形导航
 * 
 * Requirements: 3.1, 3.2
 * - 以树形或列表形式展示所有章节和课程
 * - 点击章节可展开/折叠显示该章节下的课程
 */

/**
 * ChapterNavigator类
 * 负责章节导航界面的渲染和交互
 */
class ChapterNavigator {
    /**
     * 创建ChapterNavigator实例
     * @param {HTMLElement} container - 容器元素
     */
    constructor(container) {
        if (!container || !(container instanceof HTMLElement)) {
            throw new Error('ChapterNavigator requires a valid HTMLElement container');
        }

        /**
         * 容器元素
         * @type {HTMLElement}
         * @private
         */
        this._container = container;

        /**
         * 章节列表
         * @type {Array}
         * @private
         */
        this._chapters = [];

        /**
         * 当前教材ID
         * @type {string|null}
         * @private
         */
        this._currentTextbookId = null;

        /**
         * 展开的章节ID集合
         * @type {Set<string>}
         * @private
         */
        this._expandedChapters = new Set();

        /**
         * 当前选中的课程ID
         * @type {string|null}
         * @private
         */
        this._selectedLessonId = null;

        /**
         * 数据管理器引用
         * @type {DataManager|null}
         * @private
         */
        this._dataManager = typeof dataManager !== 'undefined' ? dataManager : null;

        /**
         * 课程选择回调函数
         * @type {Function|null}
         * @private
         */
        this._onLessonSelectCallback = null;

        /**
         * 课程预览回调函数
         * @type {Function|null}
         * @private
         */
        this._onLessonPreviewCallback = null;

        /**
         * 是否正在加载
         * @type {boolean}
         * @private
         */
        this._isLoading = false;

        /**
         * 学习进度数据
         * @type {Object}
         * @private
         */
        this._progressData = {};

        /**
         * 长按定时器
         * @type {number|null}
         * @private
         */
        this._longPressTimer = null;

        /**
         * 长按阈值（毫秒）
         * @type {number}
         * @private
         */
        this._longPressThreshold = 500;

        /**
         * 调试模式
         * @type {boolean}
         * @private
         */
        this._debug = true;
    }

    /**
     * 加载章节目录
     * @param {string} textbookId - 教材ID
     * @returns {Promise<Chapter[]>} 章节列表
     */
    async loadChapters(textbookId) {
        if (!textbookId) {
            throw new Error('textbookId is required');
        }

        if (!this._dataManager) {
            throw new Error('DataManager is not available');
        }

        this._log('正在加载章节目录...', { textbookId });
        this._currentTextbookId = textbookId;
        this._isLoading = true;

        try {
            const chapters = await this._dataManager.getChapters(textbookId);
            this._chapters = chapters;
            this._log('章节目录加载完成', chapters);
            return chapters;
        } catch (error) {
            this._log('章节目录加载失败', error);
            throw error;
        } finally {
            this._isLoading = false;
        }
    }

    /**
     * 渲染章节树
     * @param {Chapter[]} chapters - 章节列表
     */
    render(chapters) {
        if (!Array.isArray(chapters)) {
            throw new Error('chapters must be an array');
        }

        this._chapters = chapters;
        this._log('渲染章节导航界面', chapters);

        // 清空容器
        this._container.innerHTML = '';

        // 创建标题
        const header = this._createHeader();
        this._container.appendChild(header);

        // 检查是否有章节
        if (chapters.length === 0) {
            const emptyState = this._createEmptyState();
            this._container.appendChild(emptyState);
            return;
        }

        // 创建章节列表容器
        const chapterList = this._createChapterList(chapters);
        this._container.appendChild(chapterList);

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
        header.className = 'chapter-navigator-header';
        header.innerHTML = `
            <h2 class="chapter-navigator-title">📑 章节目录</h2>
            <p class="chapter-navigator-subtitle">选择你想学习的课程吧！</p>
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
        empty.className = 'chapter-empty-state';
        empty.innerHTML = `
            <div class="empty-icon animate-float">📚</div>
            <p class="empty-title">暂无章节内容</p>
            <p class="empty-subtitle">小朋友，这本教材的内容正在准备中，敬请期待哦！</p>
            <div class="empty-decoration">
                <span class="decoration-star animate-twinkle">⭐</span>
                <span class="decoration-star animate-twinkle" style="animation-delay: 0.3s">⭐</span>
                <span class="decoration-star animate-twinkle" style="animation-delay: 0.6s">⭐</span>
            </div>
        `;
        return empty;
    }

    /**
     * 创建章节列表
     * @param {Chapter[]} chapters - 章节列表
     * @returns {HTMLElement} 章节列表容器
     * @private
     */
    _createChapterList(chapters) {
        const list = document.createElement('div');
        list.className = 'chapter-list';
        list.setAttribute('role', 'tree');
        list.setAttribute('aria-label', '章节目录');

        chapters.forEach((chapter, index) => {
            const chapterItem = this._createChapterItem(chapter, index);
            list.appendChild(chapterItem);
        });

        return list;
    }

    /**
     * 创建章节项
     * @param {Chapter} chapter - 章节对象
     * @param {number} index - 索引
     * @returns {HTMLElement} 章节项元素
     * @private
     */
    _createChapterItem(chapter, index) {
        const item = document.createElement('div');
        item.className = 'chapter-item animate-bounce-in';
        item.style.animationDelay = `${index * 0.1}s`;
        item.setAttribute('data-chapter-id', chapter.id);
        item.setAttribute('role', 'treeitem');
        item.setAttribute('aria-expanded', 'false');

        // 计算章节进度
        const progress = this._calculateChapterProgress(chapter);
        const isExpanded = this._expandedChapters.has(chapter.id);
        const isCompleted = progress === 100;

        // 章节头部
        const header = document.createElement('div');
        header.className = 'chapter-header';
        header.setAttribute('tabindex', '0');
        header.innerHTML = `
            <div class="chapter-header-left">
                <span class="chapter-expand-icon ${isExpanded ? 'expanded' : ''}" aria-hidden="true">
                    ${isExpanded ? '📂' : '📁'}
                </span>
                <span class="chapter-name">${chapter.name}</span>
                ${isCompleted ? '<span class="chapter-completed-icon" aria-label="已完成">🏆</span>' : ''}
            </div>
            <div class="chapter-header-right">
                <span class="chapter-lesson-count">${chapter.lessons.length}课</span>
                ${progress > 0 ? `<span class="chapter-progress-badge ${isCompleted ? 'completed' : ''}">${progress}%</span>` : ''}
            </div>
        `;

        item.appendChild(header);

        // 添加进度条（如果有进度）
        if (progress > 0) {
            const progressBar = document.createElement('div');
            progressBar.className = 'chapter-progress-bar';
            progressBar.innerHTML = `
                <div class="chapter-progress-fill" style="width: ${progress}%"></div>
            `;
            item.appendChild(progressBar);
        }

        // 课程列表（可折叠）
        const lessonList = this._createLessonList(chapter.lessons, isExpanded);
        item.appendChild(lessonList);

        return item;
    }

    /**
     * 创建课程列表
     * @param {Lesson[]} lessons - 课程列表
     * @param {boolean} isExpanded - 是否展开
     * @returns {HTMLElement} 课程列表元素
     * @private
     */
    _createLessonList(lessons, isExpanded) {
        const list = document.createElement('div');
        list.className = `lesson-list ${isExpanded ? 'expanded' : 'collapsed'}`;
        list.setAttribute('role', 'group');

        lessons.forEach((lesson, index) => {
            const lessonItem = this._createLessonItem(lesson, index);
            list.appendChild(lessonItem);
        });

        return list;
    }

    /**
     * 创建课程项
     * @param {Lesson} lesson - 课程对象
     * @param {number} index - 索引
     * @returns {HTMLElement} 课程项元素
     * @private
     */
    _createLessonItem(lesson, index) {
        const item = document.createElement('div');
        item.className = 'lesson-item';
        item.setAttribute('data-lesson-id', lesson.id);
        item.setAttribute('role', 'treeitem');
        item.setAttribute('tabindex', '0');

        // 检查课程是否已完成
        const isCompleted = this._isLessonCompleted(lesson.id);
        if (isCompleted) {
            item.classList.add('completed');
        }

        // 检查是否选中
        if (this._selectedLessonId === lesson.id) {
            item.classList.add('selected');
        }

        // 获取课程进度百分比
        const lessonProgress = this._getLessonProgress(lesson.id, lesson.totalPages);
        const hasProgress = lessonProgress > 0 && !isCompleted;

        item.innerHTML = `
            <div class="lesson-item-left">
                <span class="lesson-icon" aria-hidden="true">${isCompleted ? '✅' : (hasProgress ? '📖' : '📄')}</span>
                <span class="lesson-name">${lesson.name}</span>
                ${hasProgress ? `<span class="lesson-progress-indicator">${lessonProgress}%</span>` : ''}
            </div>
            <div class="lesson-item-right">
                <span class="lesson-pages">${lesson.totalPages}页</span>
                ${isCompleted ? '<span class="lesson-completed-badge">已完成</span>' : ''}
                <span class="lesson-arrow" aria-hidden="true">›</span>
            </div>
        `;

        return item;
    }

    /**
     * 获取课程进度百分比
     * @param {string} lessonId - 课程ID
     * @param {number} totalPages - 总页数
     * @returns {number} 进度百分比（0-100）
     * @private
     */
    _getLessonProgress(lessonId, totalPages) {
        const progress = this._progressData[lessonId];
        if (!progress || !progress.visitedPages || !totalPages) {
            return 0;
        }
        
        const visitedCount = progress.visitedPages.length;
        return Math.round((visitedCount / totalPages) * 100);
    }

    /**
     * 绑定事件监听器
     * @private
     */
    _bindEvents() {
        // 章节头部点击事件（展开/折叠）
        const chapterHeaders = this._container.querySelectorAll('.chapter-header');
        chapterHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                const chapterItem = header.closest('.chapter-item');
                const chapterId = chapterItem.getAttribute('data-chapter-id');
                this.toggleChapter(chapterId);
            });

            // 键盘事件
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const chapterItem = header.closest('.chapter-item');
                    const chapterId = chapterItem.getAttribute('data-chapter-id');
                    this.toggleChapter(chapterId);
                }
            });
        });

        // 课程项点击事件
        const lessonItems = this._container.querySelectorAll('.lesson-item');
        lessonItems.forEach(item => {
            // 点击选择课程
            item.addEventListener('click', (e) => {
                const lessonId = item.getAttribute('data-lesson-id');
                this.selectLesson(lessonId);
            });

            // 键盘事件
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const lessonId = item.getAttribute('data-lesson-id');
                    this.selectLesson(lessonId);
                }
            });

            // 长按预览（触摸设备）
            item.addEventListener('touchstart', (e) => {
                const lessonId = item.getAttribute('data-lesson-id');
                this._startLongPress(lessonId);
            });

            item.addEventListener('touchend', () => {
                this._cancelLongPress();
            });

            item.addEventListener('touchmove', () => {
                this._cancelLongPress();
            });

            // 鼠标长按预览
            item.addEventListener('mousedown', (e) => {
                const lessonId = item.getAttribute('data-lesson-id');
                this._startLongPress(lessonId);
            });

            item.addEventListener('mouseup', () => {
                this._cancelLongPress();
            });

            item.addEventListener('mouseleave', () => {
                this._cancelLongPress();
            });
        });
    }

    /**
     * 展开/折叠章节
     * @param {string} chapterId - 章节ID
     */
    toggleChapter(chapterId) {
        if (!chapterId) {
            this._log('无效的章节ID');
            return;
        }

        const chapterItem = this._container.querySelector(`[data-chapter-id="${chapterId}"]`);
        if (!chapterItem) {
            this._log('未找到章节元素', chapterId);
            return;
        }

        const lessonList = chapterItem.querySelector('.lesson-list');
        const expandIcon = chapterItem.querySelector('.chapter-expand-icon');
        const isCurrentlyExpanded = this._expandedChapters.has(chapterId);

        if (isCurrentlyExpanded) {
            // 折叠
            this._expandedChapters.delete(chapterId);
            lessonList.classList.remove('expanded');
            lessonList.classList.add('collapsed');
            expandIcon.classList.remove('expanded');
            expandIcon.textContent = '📁';
            chapterItem.setAttribute('aria-expanded', 'false');
            this._log('折叠章节', chapterId);
        } else {
            // 展开
            this._expandedChapters.add(chapterId);
            lessonList.classList.remove('collapsed');
            lessonList.classList.add('expanded');
            expandIcon.classList.add('expanded');
            expandIcon.textContent = '📂';
            chapterItem.setAttribute('aria-expanded', 'true');
            this._log('展开章节', chapterId);
        }
    }

    /**
     * 选择课程
     * @param {string} lessonId - 课程ID
     */
    selectLesson(lessonId) {
        if (!lessonId) {
            this._log('无效的课程ID');
            return;
        }

        // 查找课程对象
        const lesson = this._findLessonById(lessonId);
        if (!lesson) {
            this._log('未找到课程', lessonId);
            return;
        }

        this._log('选择课程', lesson);

        // 更新选中状态
        this._selectedLessonId = lessonId;

        // 更新UI选中状态
        this._updateLessonSelection(lessonId);

        // 触发选择回调
        if (this._onLessonSelectCallback && typeof this._onLessonSelectCallback === 'function') {
            this._onLessonSelectCallback(lesson);
        }
    }

    /**
     * 显示课程预览
     * @param {string} lessonId - 课程ID
     */
    showLessonPreview(lessonId) {
        if (!lessonId) {
            this._log('无效的课程ID');
            return;
        }

        const lesson = this._findLessonById(lessonId);
        if (!lesson) {
            this._log('未找到课程', lessonId);
            return;
        }

        this._log('显示课程预览', lesson);

        // 创建预览弹窗
        this._showPreviewModal(lesson);

        // 触发预览回调
        if (this._onLessonPreviewCallback && typeof this._onLessonPreviewCallback === 'function') {
            this._onLessonPreviewCallback(lesson);
        }
    }

    /**
     * 更新学习进度显示
     * @param {ProgressData} progressData - 进度数据
     */
    updateProgress(progressData) {
        if (!progressData) {
            return;
        }

        this._progressData = { ...this._progressData, ...progressData };
        this._log('更新进度数据', this._progressData);

        // 重新渲染以更新进度显示
        if (this._chapters.length > 0) {
            this.render(this._chapters);
        }
    }

    /**
     * 更新课程选中状态UI
     * @param {string} lessonId - 课程ID
     * @private
     */
    _updateLessonSelection(lessonId) {
        // 移除所有选中状态
        const allLessonItems = this._container.querySelectorAll('.lesson-item');
        allLessonItems.forEach(item => {
            item.classList.remove('selected');
        });

        // 添加新的选中状态
        const selectedItem = this._container.querySelector(`[data-lesson-id="${lessonId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
    }

    /**
     * 显示预览弹窗
     * @param {Lesson} lesson - 课程对象
     * @private
     */
    _showPreviewModal(lesson) {
        // 移除已存在的预览弹窗
        const existingModal = document.querySelector('.lesson-preview-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // 创建预览弹窗
        const modal = document.createElement('div');
        modal.className = 'lesson-preview-modal modal-overlay';
        modal.innerHTML = `
            <div class="modal-content lesson-preview-content animate-bounce-in">
                <div class="preview-header">
                    <span class="preview-icon">📖</span>
                    <h3 class="preview-title">${lesson.name}</h3>
                </div>
                <div class="preview-body">
                    <p class="preview-text">${lesson.previewText || '暂无预览内容'}</p>
                    <div class="preview-info">
                        <span class="preview-pages">📄 共${lesson.totalPages}页</span>
                    </div>
                </div>
                <div class="preview-footer">
                    <button class="btn btn-cartoon-secondary preview-close-btn">关闭</button>
                    <button class="btn btn-cartoon-primary preview-start-btn">开始学习</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 显示弹窗
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });

        // 绑定关闭事件
        const closeBtn = modal.querySelector('.preview-close-btn');
        closeBtn.addEventListener('click', () => {
            this._closePreviewModal(modal);
        });

        // 绑定开始学习事件
        const startBtn = modal.querySelector('.preview-start-btn');
        startBtn.addEventListener('click', () => {
            this._closePreviewModal(modal);
            this.selectLesson(lesson.id);
        });

        // 点击遮罩关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this._closePreviewModal(modal);
            }
        });
    }

    /**
     * 关闭预览弹窗
     * @param {HTMLElement} modal - 弹窗元素
     * @private
     */
    _closePreviewModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }

    /**
     * 开始长按计时
     * @param {string} lessonId - 课程ID
     * @private
     */
    _startLongPress(lessonId) {
        this._cancelLongPress();
        this._longPressTimer = setTimeout(() => {
            this.showLessonPreview(lessonId);
        }, this._longPressThreshold);
    }

    /**
     * 取消长按计时
     * @private
     */
    _cancelLongPress() {
        if (this._longPressTimer) {
            clearTimeout(this._longPressTimer);
            this._longPressTimer = null;
        }
    }

    /**
     * 根据ID查找课程
     * @param {string} lessonId - 课程ID
     * @returns {Lesson|null} 课程对象
     * @private
     */
    _findLessonById(lessonId) {
        for (const chapter of this._chapters) {
            const lesson = chapter.lessons.find(l => l.id === lessonId);
            if (lesson) {
                return lesson;
            }
        }
        return null;
    }

    /**
     * 计算章节进度
     * @param {Chapter} chapter - 章节对象
     * @returns {number} 进度百分比（0-100）
     * @private
     */
    _calculateChapterProgress(chapter) {
        if (!chapter.lessons || chapter.lessons.length === 0) {
            return 0;
        }

        const completedCount = chapter.lessons.filter(
            lesson => this._isLessonCompleted(lesson.id)
        ).length;

        return Math.round((completedCount / chapter.lessons.length) * 100);
    }

    /**
     * 检查课程是否已完成
     * @param {string} lessonId - 课程ID
     * @returns {boolean} 是否已完成
     * @private
     */
    _isLessonCompleted(lessonId) {
        const progress = this._progressData[lessonId];
        return progress && progress.isCompleted === true;
    }

    /**
     * 获取总体进度
     * @returns {object} 包含进度百分比和统计信息
     */
    getOverallProgress() {
        if (!this._chapters || this._chapters.length === 0) {
            return { percentage: 0, completed: 0, total: 0 };
        }

        let totalLessons = 0;
        let completedLessons = 0;

        for (const chapter of this._chapters) {
            if (chapter.lessons) {
                totalLessons += chapter.lessons.length;
                for (const lesson of chapter.lessons) {
                    if (this._isLessonCompleted(lesson.id)) {
                        completedLessons++;
                    }
                }
            }
        }

        const percentage = totalLessons > 0 
            ? Math.round((completedLessons / totalLessons) * 100) 
            : 0;

        return {
            percentage,
            completed: completedLessons,
            total: totalLessons
        };
    }

    /**
     * 显示加载状态
     */
    showLoading() {
        this._isLoading = true;
        this._container.innerHTML = `
            <div class="loading-container chapter-loading">
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
                <p class="loading-text">正在加载章节目录...</p>
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
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
                <p class="error-message">${message || '章节加载失败，请重试'}</p>
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
     * 设置课程选择回调函数
     * @param {Function} callback - 回调函数，接收选中的课程对象
     */
    onLessonSelect(callback) {
        if (typeof callback === 'function') {
            this._onLessonSelectCallback = callback;
        }
    }

    /**
     * 设置课程预览回调函数
     * @param {Function} callback - 回调函数，接收预览的课程对象
     */
    onLessonPreview(callback) {
        if (typeof callback === 'function') {
            this._onLessonPreviewCallback = callback;
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
     * 获取章节列表
     * @returns {Chapter[]} 章节列表
     */
    getChapters() {
        return [...this._chapters];
    }

    /**
     * 获取当前教材ID
     * @returns {string|null} 教材ID
     */
    getCurrentTextbookId() {
        return this._currentTextbookId;
    }

    /**
     * 获取展开的章节ID列表
     * @returns {string[]} 展开的章节ID数组
     */
    getExpandedChapters() {
        return Array.from(this._expandedChapters);
    }

    /**
     * 获取选中的课程ID
     * @returns {string|null} 选中的课程ID
     */
    getSelectedLessonId() {
        return this._selectedLessonId;
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
     * 设置进度数据
     * @param {Object} progressData - 进度数据对象
     */
    setProgressData(progressData) {
        this._progressData = progressData || {};
    }

    /**
     * 展开所有章节
     */
    expandAll() {
        this._chapters.forEach(chapter => {
            if (!this._expandedChapters.has(chapter.id)) {
                this.toggleChapter(chapter.id);
            }
        });
    }

    /**
     * 折叠所有章节
     */
    collapseAll() {
        this._expandedChapters.forEach(chapterId => {
            this.toggleChapter(chapterId);
        });
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
        // 取消长按计时器
        this._cancelLongPress();

        // 清空容器
        this._container.innerHTML = '';
        
        // 重置状态
        this._chapters = [];
        this._currentTextbookId = null;
        this._expandedChapters.clear();
        this._selectedLessonId = null;
        this._onLessonSelectCallback = null;
        this._onLessonPreviewCallback = null;
        this._isLoading = false;
        this._progressData = {};

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
                console.log(`[ChapterNavigator] ${message}`, data);
            } else {
                console.log(`[ChapterNavigator] ${message}`);
            }
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChapterNavigator };
}
