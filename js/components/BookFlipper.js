/**
 * BookFlipper - 翻页控制器组件
 * 负责管理书本翻页效果和导航
 * 
 * Requirements: 7.3, 7.6
 * - 7.3: 翻页时有流畅的翻页动画效果
 * - 7.6: 显示当前页码和总页数
 */

/**
 * BookFlipper类
 * 管理书本翻页效果和导航
 */
class BookFlipper {
    /**
     * 创建BookFlipper实例
     * @param {HTMLElement} container - 容器元素
     */
    constructor(container) {
        if (!container || !(container instanceof HTMLElement)) {
            throw new Error('BookFlipper requires a valid HTMLElement container');
        }

        /**
         * 容器元素
         * @type {HTMLElement}
         * @private
         */
        this._container = container;

        /**
         * 当前页码（从1开始）
         * @type {number}
         * @private
         */
        this._currentPage = 1;

        /**
         * 总页数
         * @type {number}
         * @private
         */
        this._totalPages = 0;

        /**
         * 是否正在播放动画
         * @type {boolean}
         * @private
         */
        this._isAnimating = false;

        /**
         * 动画持续时间（毫秒）
         * @type {number}
         * @private
         */
        this._animationDuration = 600;

        /**
         * 页面变化回调
         * @type {Function|null}
         * @private
         */
        this._onPageChange = null;

        /**
         * 边界消息显示时间（毫秒）
         * @type {number}
         * @private
         */
        this._boundaryMessageDuration = 2000;

        /**
         * 边界消息定时器
         * @type {number|null}
         * @private
         */
        this._boundaryMessageTimer = null;

        /**
         * 调试模式
         * @type {boolean}
         * @private
         */
        this._debug = true;

        /**
         * 翻页容器元素
         * @type {HTMLElement|null}
         * @private
         */
        this._flipperContainer = null;

        /**
         * 页码显示元素
         * @type {HTMLElement|null}
         * @private
         */
        this._pageIndicator = null;

        /**
         * 边界消息元素
         * @type {HTMLElement|null}
         * @private
         */
        this._boundaryMessage = null;
    }

    /**
     * 初始化翻页功能
     * @param {number} totalPages - 总页数
     */
    init(totalPages) {
        if (typeof totalPages !== 'number' || totalPages < 1) {
            throw new Error('totalPages must be a positive number');
        }

        this._totalPages = totalPages;
        this._currentPage = 1;
        this._isAnimating = false;

        this._log('初始化翻页控制器', { totalPages });

        // 创建翻页容器HTML结构
        this._createFlipperStructure();

        // 更新页码显示
        this._updatePageIndicator();
    }

    /**
     * 创建翻页容器HTML结构
     * @private
     */
    _createFlipperStructure() {
        // 清空容器
        this._container.innerHTML = '';

        // 创建翻页容器
        const flipperWrapper = document.createElement('div');
        flipperWrapper.className = 'book-flipper-wrapper';
        flipperWrapper.innerHTML = `
            <div class="book-flipper-container">
                <!-- 翻页动画层 -->
                <div class="book-flipper-animation-layer">
                    <div class="flip-page flip-page-front"></div>
                    <div class="flip-page flip-page-back"></div>
                </div>
                
                <!-- 页面内容区域 -->
                <div class="book-flipper-content">
                    <div class="book-flipper-page current-page"></div>
                </div>
                
                <!-- 书本装饰效果 -->
                <div class="book-flipper-decoration">
                    <div class="book-spine"></div>
                    <div class="book-corner book-corner-tl">📌</div>
                    <div class="book-corner book-corner-tr">⭐</div>
                    <div class="book-corner book-corner-bl">✨</div>
                    <div class="book-corner book-corner-br">🌟</div>
                </div>
            </div>
            
            <!-- 页码指示器 -->
            <div class="book-flipper-page-indicator">
                <button class="page-nav-btn page-nav-prev" aria-label="上一页" title="上一页">
                    <span class="nav-icon">📖</span><span class="nav-arrow">‹</span>
                </button>
                <div class="page-indicator-display">
                    <span class="current-page-num">1</span>
                    <span class="page-separator">/</span>
                    <span class="total-pages-num">1</span>
                </div>
                <button class="page-nav-btn page-nav-next" aria-label="下一页" title="下一页">
                    <span class="nav-arrow">›</span><span class="nav-icon">📖</span>
                </button>
            </div>
            
            <!-- 边界提示消息 -->
            <div class="book-flipper-boundary-message hidden" role="alert" aria-live="polite">
                <span class="boundary-icon">📖</span>
                <span class="boundary-text"></span>
            </div>
        `;

        this._container.appendChild(flipperWrapper);

        // 保存元素引用
        this._flipperContainer = flipperWrapper.querySelector('.book-flipper-container');
        this._pageIndicator = flipperWrapper.querySelector('.book-flipper-page-indicator');
        this._boundaryMessage = flipperWrapper.querySelector('.book-flipper-boundary-message');

        // 绑定导航按钮事件
        this._bindNavigationEvents(flipperWrapper);

        this._log('翻页容器结构已创建');
    }

    /**
     * 绑定导航按钮事件
     * @param {HTMLElement} wrapper - 包装器元素
     * @private
     */
    _bindNavigationEvents(wrapper) {
        const prevBtn = wrapper.querySelector('.page-nav-prev');
        const nextBtn = wrapper.querySelector('.page-nav-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.prevPage();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.nextPage();
            });
        }
    }

    /**
     * 翻到下一页
     * @returns {boolean} 是否成功翻页
     */
    nextPage() {
        if (this._isAnimating) {
            this._log('动画进行中，忽略翻页请求');
            return false;
        }

        if (this._currentPage >= this._totalPages) {
            this._log('已是最后一页');
            this.showBoundaryMessage('last');
            return false;
        }

        this._log('翻到下一页', { from: this._currentPage, to: this._currentPage + 1 });
        
        // 播放翻页动画
        this.playFlipAnimation('left').then(() => {
            this._currentPage++;
            this._updatePageIndicator();
            this._triggerPageChange();
        });

        return true;
    }

    /**
     * 翻到上一页
     * @returns {boolean} 是否成功翻页
     */
    prevPage() {
        if (this._isAnimating) {
            this._log('动画进行中，忽略翻页请求');
            return false;
        }

        if (this._currentPage <= 1) {
            this._log('已是第一页');
            this.showBoundaryMessage('first');
            return false;
        }

        this._log('翻到上一页', { from: this._currentPage, to: this._currentPage - 1 });
        
        // 播放翻页动画
        this.playFlipAnimation('right').then(() => {
            this._currentPage--;
            this._updatePageIndicator();
            this._triggerPageChange();
        });

        return true;
    }

    /**
     * 跳转到指定页
     * @param {number} pageNumber - 目标页码
     */
    goToPage(pageNumber) {
        if (typeof pageNumber !== 'number') {
            this._log('页码必须是数字');
            return;
        }

        // 限制页码范围
        const targetPage = Math.max(1, Math.min(pageNumber, this._totalPages));

        if (targetPage === this._currentPage) {
            this._log('已在当前页');
            return;
        }

        if (this._isAnimating) {
            this._log('动画进行中，忽略跳转请求');
            return;
        }

        this._log('跳转到页面', { from: this._currentPage, to: targetPage });

        const direction = targetPage > this._currentPage ? 'left' : 'right';
        
        this.playFlipAnimation(direction).then(() => {
            this._currentPage = targetPage;
            this._updatePageIndicator();
            this._triggerPageChange();
        });
    }

    /**
     * 获取当前页码
     * @returns {number} 当前页码
     */
    getCurrentPage() {
        return this._currentPage;
    }

    /**
     * 获取总页数
     * @returns {number} 总页数
     */
    getTotalPages() {
        return this._totalPages;
    }

    /**
     * 播放翻页动画
     * Requirements: 7.3 - 翻页时有流畅的翻页动画效果
     * @param {string} direction - 翻页方向 'left' | 'right'
     * @returns {Promise<void>}
     */
    playFlipAnimation(direction) {
        return new Promise((resolve) => {
            if (this._isAnimating) {
                resolve();
                return;
            }

            this._isAnimating = true;
            this._log('播放翻页动画', { direction });

            const animationLayer = this._container.querySelector('.book-flipper-animation-layer');
            const flipperContainer = this._flipperContainer;

            if (!animationLayer || !flipperContainer) {
                this._isAnimating = false;
                resolve();
                return;
            }

            // 添加翻页动画类
            const animationClass = direction === 'left' ? 'flipping-left' : 'flipping-right';
            flipperContainer.classList.add('is-flipping', animationClass);
            animationLayer.classList.add('active', animationClass);

            // 播放翻页音效（可选）
            this._playFlipSound();

            // 动画结束后清理
            setTimeout(() => {
                flipperContainer.classList.remove('is-flipping', animationClass);
                animationLayer.classList.remove('active', animationClass);
                this._isAnimating = false;
                this._log('翻页动画完成');
                resolve();
            }, this._animationDuration);
        });
    }

    /**
     * 播放翻页音效
     * @private
     */
    _playFlipSound() {
        // 可以在这里添加翻页音效
        // 目前仅作为占位符
    }

    /**
     * 显示边界提示消息
     * Requirements: 7.4, 7.5 - 显示边界提示
     * @param {string} type - 提示类型 'first' | 'last'
     */
    showBoundaryMessage(type) {
        if (!this._boundaryMessage) {
            return;
        }

        // 清除之前的定时器
        if (this._boundaryMessageTimer) {
            clearTimeout(this._boundaryMessageTimer);
        }

        const icon = this._boundaryMessage.querySelector('.boundary-icon');
        const text = this._boundaryMessage.querySelector('.boundary-text');

        if (type === 'first') {
            if (icon) icon.textContent = '📖';
            if (text) text.textContent = '已是第一页啦！';
        } else if (type === 'last') {
            if (icon) icon.textContent = '🎉';
            if (text) text.textContent = '已是最后一页啦！';
        }

        // 显示消息
        this._boundaryMessage.classList.remove('hidden');
        this._boundaryMessage.classList.add('visible', 'animate-bounce-in');

        // 添加抖动效果
        this._flipperContainer?.classList.add('animate-shake');
        setTimeout(() => {
            this._flipperContainer?.classList.remove('animate-shake');
        }, 500);

        // 自动隐藏
        this._boundaryMessageTimer = setTimeout(() => {
            this._hideBoundaryMessage();
        }, this._boundaryMessageDuration);

        this._log('显示边界消息', { type });
    }

    /**
     * 隐藏边界提示消息
     * @private
     */
    _hideBoundaryMessage() {
        if (!this._boundaryMessage) {
            return;
        }

        this._boundaryMessage.classList.remove('visible', 'animate-bounce-in');
        this._boundaryMessage.classList.add('animate-bounce-out');

        setTimeout(() => {
            this._boundaryMessage.classList.remove('animate-bounce-out');
            this._boundaryMessage.classList.add('hidden');
        }, 300);
    }

    /**
     * 更新页码显示
     * Requirements: 7.6 - 显示当前页码和总页数
     * @private
     */
    _updatePageIndicator() {
        if (!this._pageIndicator) {
            return;
        }

        const currentPageNum = this._pageIndicator.querySelector('.current-page-num');
        const totalPagesNum = this._pageIndicator.querySelector('.total-pages-num');
        const prevBtn = this._pageIndicator.querySelector('.page-nav-prev');
        const nextBtn = this._pageIndicator.querySelector('.page-nav-next');

        // 更新页码数字
        if (currentPageNum) {
            currentPageNum.textContent = this._currentPage;
            // 添加数字变化动画
            currentPageNum.classList.add('animate-pop');
            setTimeout(() => {
                currentPageNum.classList.remove('animate-pop');
            }, 300);
        }

        if (totalPagesNum) {
            totalPagesNum.textContent = this._totalPages;
        }

        // 更新导航按钮状态
        if (prevBtn) {
            prevBtn.disabled = this._currentPage <= 1;
            prevBtn.classList.toggle('disabled', this._currentPage <= 1);
        }

        if (nextBtn) {
            nextBtn.disabled = this._currentPage >= this._totalPages;
            nextBtn.classList.toggle('disabled', this._currentPage >= this._totalPages);
        }

        this._log('页码显示已更新', { current: this._currentPage, total: this._totalPages });
    }

    /**
     * 触发页面变化回调
     * @private
     */
    _triggerPageChange() {
        if (this._onPageChange && typeof this._onPageChange === 'function') {
            this._onPageChange(this._currentPage, this._totalPages);
        }
    }

    /**
     * 设置页面变化回调
     * @param {Function} callback - 回调函数 (currentPage, totalPages) => void
     */
    onPageChange(callback) {
        if (typeof callback === 'function') {
            this._onPageChange = callback;
        }
    }

    /**
     * 获取页面内容容器
     * @returns {HTMLElement|null} 页面内容容器
     */
    getContentContainer() {
        return this._container.querySelector('.book-flipper-content .current-page');
    }

    /**
     * 设置页面内容
     * @param {string|HTMLElement} content - 页面内容
     */
    setPageContent(content) {
        const contentContainer = this.getContentContainer();
        if (!contentContainer) {
            return;
        }

        if (typeof content === 'string') {
            contentContainer.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            contentContainer.innerHTML = '';
            contentContainer.appendChild(content);
        }
    }

    /**
     * 检查是否正在播放动画
     * @returns {boolean} 是否正在播放动画
     */
    isAnimating() {
        return this._isAnimating;
    }

    /**
     * 设置动画持续时间
     * @param {number} duration - 动画持续时间（毫秒）
     */
    setAnimationDuration(duration) {
        if (typeof duration === 'number' && duration > 0) {
            this._animationDuration = duration;
        }
    }

    /**
     * 设置总页数
     * @param {number} totalPages - 总页数
     */
    setTotalPages(totalPages) {
        if (typeof totalPages === 'number' && totalPages >= 1) {
            this._totalPages = totalPages;
            // 确保当前页不超过总页数
            if (this._currentPage > this._totalPages) {
                this._currentPage = this._totalPages;
            }
            this._updatePageIndicator();
        }
    }

    /**
     * 设置当前页码（不触发动画）
     * @param {number} pageNumber - 页码
     */
    setCurrentPage(pageNumber) {
        if (typeof pageNumber === 'number' && pageNumber >= 1 && pageNumber <= this._totalPages) {
            this._currentPage = pageNumber;
            this._updatePageIndicator();
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
        // 清除定时器
        if (this._boundaryMessageTimer) {
            clearTimeout(this._boundaryMessageTimer);
        }

        // 清空容器
        this._container.innerHTML = '';

        // 重置状态
        this._currentPage = 1;
        this._totalPages = 0;
        this._isAnimating = false;
        this._onPageChange = null;
        this._flipperContainer = null;
        this._pageIndicator = null;
        this._boundaryMessage = null;

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
                console.log(`[BookFlipper] ${message}`, data);
            } else {
                console.log(`[BookFlipper] ${message}`);
            }
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BookFlipper };
}
