/**
 * PageRenderer - 页面渲染器组件
 * 负责课本页面内容的渲染和交互
 * 
 * Requirements: 4.1, 4.4
 * - 以书本样式展示课本内容，包含文字、图片和可点读元素
 * - 显示骨架屏或加载占位符
 */

/**
 * PageRenderer类
 * 负责课本页面的渲染和交互
 */
class PageRenderer {
    /**
     * 创建PageRenderer实例
     * @param {HTMLElement} container - 容器元素
     */
    constructor(container) {
        if (!container || !(container instanceof HTMLElement)) {
            throw new Error('PageRenderer requires a valid HTMLElement container');
        }

        /**
         * 容器元素
         * @type {HTMLElement}
         * @private
         */
        this._container = container;

        /**
         * 当前页面内容
         * @type {PageContent|null}
         * @private
         */
        this._currentContent = null;

        /**
         * 当前课程ID
         * @type {string|null}
         * @private
         */
        this._currentLessonId = null;

        /**
         * 当前页码
         * @type {number}
         * @private
         */
        this._currentPageNumber = 1;

        /**
         * 当前高亮的元素ID
         * @type {string|null}
         * @private
         */
        this._highlightedElementId = null;

        /**
         * 当前缩放比例
         * @type {number}
         * @private
         */
        this._zoomScale = 1;

        /**
         * 最小缩放比例
         * @type {number}
         * @private
         */
        this._minZoom = 0.5;

        /**
         * 最大缩放比例
         * @type {number}
         * @private
         */
        this._maxZoom = 3;

        /**
         * 数据管理器引用
         * @type {DataManager|null}
         * @private
         */
        this._dataManager = typeof dataManager !== 'undefined' ? dataManager : null;

        /**
         * 可点读元素点击回调
         * @type {Function|null}
         * @private
         */
        this._onClickableElementClick = null;

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

        /**
         * 双指缩放相关状态
         * @type {Object}
         * @private
         */
        this._pinchState = {
            isPinching: false,
            initialDistance: 0,
            initialScale: 1,
            lastScale: 1
        };

        /**
         * 缩放控制按钮容器
         * @type {HTMLElement|null}
         * @private
         */
        this._zoomControlsContainer = null;

        /**
         * 图片原始宽度
         * @type {number}
         * @private
         */
        this._imageNaturalWidth = 0;

        /**
         * 图片原始高度
         * @type {number}
         * @private
         */
        this._imageNaturalHeight = 0;

        /**
         * ResizeObserver 实例
         * @type {ResizeObserver|null}
         * @private
         */
        this._resizeObserver = null;
    }

    /**
     * 加载页面内容
     * @param {string} lessonId - 课程ID
     * @param {number} pageNumber - 页码
     * @returns {Promise<PageContent>} 页面内容
     */
    async loadPage(lessonId, pageNumber) {
        if (!lessonId) {
            throw new Error('lessonId is required');
        }
        if (typeof pageNumber !== 'number' || pageNumber < 1) {
            throw new Error('pageNumber must be a positive number');
        }

        if (!this._dataManager) {
            throw new Error('DataManager is not available');
        }

        this._log('正在加载页面内容...', { lessonId, pageNumber });
        this._isLoading = true;
        this._currentLessonId = lessonId;
        this._currentPageNumber = pageNumber;

        try {
            const content = await this._dataManager.getPageContent(lessonId, pageNumber);
            this._currentContent = content;
            this._log('页面内容加载完成', content);
            return content;
        } catch (error) {
            this._log('页面内容加载失败', error);
            throw error;
        } finally {
            this._isLoading = false;
        }
    }

    /**
     * 渲染页面
     * @param {PageContent} content - 页面内容
     */
    render(content) {
        if (!content || typeof content !== 'object') {
            throw new Error('content must be a valid PageContent object');
        }

        this._currentContent = content;
        this._log('渲染页面内容', content);

        // 清空容器
        this._container.innerHTML = '';

        // 清理之前的 ResizeObserver
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        // 创建页面内容区域（直接放入容器，减少嵌套）
        const pageContent = this._createPageContent(content);
        this._container.appendChild(pageContent);

        // 标记可点读内容
        if (content.clickableElements && content.clickableElements.length > 0) {
            this.markClickableContent(content.clickableElements);
        }

        // 监听容器尺寸变化，重新定位热区
        this._resizeObserver = new ResizeObserver(() => {
            this._repositionHotspots();
        });
        this._resizeObserver.observe(this._container);

        // 绑定事件
        this._bindEvents();
    }

    /**
     * 创建书本页面包装器
     * @returns {HTMLElement} 页面包装器元素
     * @private
     */
    _createPageWrapper() {
        const wrapper = document.createElement('div');
        wrapper.className = 'page-renderer-wrapper';
        wrapper.innerHTML = `
            <div class="book-page-container">
                <div class="book-page" data-zoom-scale="${this._zoomScale}">
                    <div class="book-page-inner">
                        <div class="book-page-content"></div>
                    </div>
                    <div class="book-page-shadow"></div>
                </div>
            </div>
        `;
        return wrapper;
    }

    /**
     * 创建页面内容
     * @param {PageContent} content - 页面内容
     * @returns {HTMLElement} 页面内容元素
     * @private
     */
    _createPageContent(content) {
        const contentArea = document.createElement('div');
        contentArea.className = 'page-content-area';

        // 如果有背景图片，使用img标签显示
        if (content.backgroundImage) {
            const img = document.createElement('img');
            img.className = 'page-background-image';
            img.src = content.backgroundImage;
            img.alt = '课本页面';
            img.onerror = () => {
                console.error('图片加载失败:', content.backgroundImage);
                img.style.display = 'none';
            };
            img.onload = () => {
                this._log('图片加载成功:', content.backgroundImage);
                // 图片加载后计算缩放比例并重新定位热区
                this._imageNaturalWidth = img.naturalWidth;
                this._imageNaturalHeight = img.naturalHeight;
                this._repositionHotspots();
            };
            contentArea.appendChild(img);
            contentArea.classList.add('has-background');
        }

        // 创建可点读元素容器
        const elementsContainer = document.createElement('div');
        elementsContainer.className = 'clickable-elements-container';
        contentArea.appendChild(elementsContainer);

        return contentArea;
    }

    /**
     * 标记可点读内容
     * @param {ClickableElement[]} elements - 可点读元素列表
     */
    markClickableContent(elements) {
        if (!Array.isArray(elements)) {
            this._log('elements must be an array');
            return;
        }

        const container = this._container.querySelector('.clickable-elements-container');
        if (!container) {
            this._log('找不到可点读元素容器');
            return;
        }

        // 清空现有元素
        container.innerHTML = '';

        elements.forEach((element, index) => {
            const clickableEl = this._createClickableElement(element, index);
            container.appendChild(clickableEl);
        });

        this._log('已标记可点读元素', elements.length);
    }

    /**
     * 创建可点读元素
     * @param {ClickableElement} element - 可点读元素数据
     * @param {number} index - 索引
     * @returns {HTMLElement} 可点读元素
     * @private
     */
    _createClickableElement(element, index) {
        const el = document.createElement('div');
        el.className = 'clickable-element';
        
        // 存储原始坐标（基于原图尺寸）用于缩放计算
        const padding = 5; // 热区扩展像素
        el.setAttribute('data-orig-x', element.position.x - padding);
        el.setAttribute('data-orig-y', element.position.y - padding);
        el.setAttribute('data-orig-w', element.position.width + padding * 2);
        el.setAttribute('data-orig-h', element.position.height + padding * 2);

        // 设置数据属性
        el.setAttribute('data-element-id', element.id);
        el.setAttribute('data-element-type', element.type);
        el.setAttribute('data-audio-id', element.audioId);
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', `点读: ${element.content}`);

        // 如果有音频URL，直接存储
        if (element.audioUrl) {
            el.setAttribute('data-audio-url', element.audioUrl);
        }

        return el;
    }

    /**
     * 根据图片显示尺寸重新定位所有热区
     * 计算图片原始尺寸与显示尺寸的比例，按比例缩放热区坐标
     * @private
     */
    _repositionHotspots() {
        const img = this._container.querySelector('.page-background-image');
        if (!img || !this._imageNaturalWidth) return;

        const displayedWidth = img.clientWidth;
        const scale = displayedWidth / this._imageNaturalWidth;

        const hotspots = this._container.querySelectorAll('.clickable-element');
        hotspots.forEach(el => {
            const ox = parseFloat(el.getAttribute('data-orig-x'));
            const oy = parseFloat(el.getAttribute('data-orig-y'));
            const ow = parseFloat(el.getAttribute('data-orig-w'));
            const oh = parseFloat(el.getAttribute('data-orig-h'));

            el.style.left = (ox * scale) + 'px';
            el.style.top = (oy * scale) + 'px';
            el.style.width = (ow * scale) + 'px';
            el.style.height = (oh * scale) + 'px';
        });

        this._log('热区已重新定位, scale=' + scale.toFixed(3));
    }

    /**
     * 高亮当前朗读内容
     * @param {string} elementId - 元素ID
     */
    highlightContent(elementId) {
        if (!elementId) {
            return;
        }

        // 先清除之前的高亮
        this.clearHighlight();

        const element = this._container.querySelector(`[data-element-id="${elementId}"]`);
        if (element) {
            element.classList.add('highlighted', 'animate-pulse');
            this._highlightedElementId = elementId;
            this._log('高亮元素', elementId);
        }
    }

    /**
     * 取消高亮
     */
    clearHighlight() {
        if (this._highlightedElementId) {
            const element = this._container.querySelector(`[data-element-id="${this._highlightedElementId}"]`);
            if (element) {
                element.classList.remove('highlighted', 'animate-pulse');
            }
            this._highlightedElementId = null;
            this._log('清除高亮');
        }

        // 清除所有可能的高亮状态
        const highlightedElements = this._container.querySelectorAll('.clickable-element.highlighted');
        highlightedElements.forEach(el => {
            el.classList.remove('highlighted', 'animate-pulse');
        });
    }

    /**
     * 处理缩放
     * @param {number} scale - 缩放比例
     */
    handleZoom(scale) {
        if (typeof scale !== 'number') {
            return;
        }

        // 限制缩放范围
        this._zoomScale = Math.max(this._minZoom, Math.min(this._maxZoom, scale));

        const pageContent = this._container.querySelector('.page-content-area');
        if (pageContent) {
            pageContent.style.transform = `scale(${this._zoomScale})`;
            pageContent.style.transformOrigin = 'center top';
            this._log('缩放比例', this._zoomScale);
        }
    }

    /**
     * 显示骨架屏
     */
    showSkeleton() {
        this._isLoading = true;
        this._container.innerHTML = `
            <div class="page-renderer-wrapper">
                <div class="page-skeleton animate-pulse">
                    <div class="skeleton-header">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-subtitle"></div>
                    </div>
                    <div class="skeleton-content">
                        <div class="skeleton-line skeleton-line-long"></div>
                        <div class="skeleton-line skeleton-line-medium"></div>
                        <div class="skeleton-line skeleton-line-long"></div>
                        <div class="skeleton-line skeleton-line-short"></div>
                        <div class="skeleton-line skeleton-line-medium"></div>
                        <div class="skeleton-line skeleton-line-long"></div>
                    </div>
                    <div class="skeleton-elements">
                        <div class="skeleton-element"></div>
                        <div class="skeleton-element"></div>
                        <div class="skeleton-element"></div>
                    </div>
                    <div class="skeleton-decoration">
                        <span class="skeleton-star animate-twinkle">⭐</span>
                        <span class="skeleton-star animate-twinkle" style="animation-delay: 0.3s">✨</span>
                        <span class="skeleton-star animate-twinkle" style="animation-delay: 0.6s">⭐</span>
                    </div>
                </div>
                <p class="loading-text">正在加载课本页面...</p>
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        this._log('显示骨架屏');
    }

    /**
     * 隐藏骨架屏
     */
    hideSkeleton() {
        this._isLoading = false;
    }

    /**
     * 绑定事件监听器
     * @private
     */
    _bindEvents() {
        const clickableElements = this._container.querySelectorAll('.clickable-element');
        
        clickableElements.forEach(element => {
            // 点击事件
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                const elementId = element.getAttribute('data-element-id');
                const audioId = element.getAttribute('data-audio-id');
                const elementType = element.getAttribute('data-element-type');
                
                this._handleElementClick(elementId, audioId, elementType);
            });

            // 键盘事件（支持无障碍访问）
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const elementId = element.getAttribute('data-element-id');
                    const audioId = element.getAttribute('data-audio-id');
                    const elementType = element.getAttribute('data-element-type');
                    
                    this._handleElementClick(elementId, audioId, elementType);
                }
            });

            // 触摸反馈
            element.addEventListener('touchstart', () => {
                element.classList.add('touching');
            }, { passive: true });

            element.addEventListener('touchend', () => {
                element.classList.remove('touching');
            }, { passive: true });
        });

        // 绑定双指缩放手势
        this._bindPinchZoomEvents();
    }

    /**
     * 绑定双指缩放手势事件
     * Requirements: 4.3 - 支持双指缩放页面内容
     * @private
     */
    _bindPinchZoomEvents() {
        const zoomTarget = this._container.querySelector('.page-content-area') || this._container;
        if (!zoomTarget) {
            this._log('找不到页面容器，无法绑定缩放手势');
            return;
        }

        // 触摸开始
        zoomTarget.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                this._handlePinchStart(e);
            }
        }, { passive: false });

        // 触摸移动
        zoomTarget.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && this._pinchState.isPinching) {
                e.preventDefault();
                this._handlePinchMove(e);
            }
        }, { passive: false });

        // 触摸结束
        zoomTarget.addEventListener('touchend', (e) => {
            if (this._pinchState.isPinching) {
                this._handlePinchEnd(e);
            }
        });

        // 触摸取消
        zoomTarget.addEventListener('touchcancel', (e) => {
            if (this._pinchState.isPinching) {
                this._handlePinchEnd(e);
            }
        });

        this._log('双指缩放手势已绑定');
    }

    /**
     * 处理双指缩放开始
     * @param {TouchEvent} e - 触摸事件
     * @private
     */
    _handlePinchStart(e) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        // 计算两指之间的初始距离
        const distance = this._getTouchDistance(touch1, touch2);
        
        this._pinchState = {
            isPinching: true,
            initialDistance: distance,
            initialScale: this._zoomScale,
            lastScale: this._zoomScale
        };

        this._log('双指缩放开始', { distance, initialScale: this._zoomScale });
    }

    /**
     * 处理双指缩放移动
     * @param {TouchEvent} e - 触摸事件
     * @private
     */
    _handlePinchMove(e) {
        if (!this._pinchState.isPinching) return;

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        // 计算当前两指之间的距离
        const currentDistance = this._getTouchDistance(touch1, touch2);
        
        // 计算缩放比例
        const scaleRatio = currentDistance / this._pinchState.initialDistance;
        const newScale = this._pinchState.initialScale * scaleRatio;
        
        // 应用缩放（handleZoom会自动限制范围）
        this.handleZoom(newScale);
        this._pinchState.lastScale = this._zoomScale;

        // 更新缩放控制按钮显示
        this._updateZoomControlsDisplay();
    }

    /**
     * 处理双指缩放结束
     * @param {TouchEvent} e - 触摸事件
     * @private
     */
    _handlePinchEnd(e) {
        this._log('双指缩放结束', { finalScale: this._zoomScale });
        
        this._pinchState.isPinching = false;
        
        // 更新缩放控制按钮显示
        this._updateZoomControlsDisplay();
    }

    /**
     * 计算两个触摸点之间的距离
     * @param {Touch} touch1 - 第一个触摸点
     * @param {Touch} touch2 - 第二个触摸点
     * @returns {number} 距离
     * @private
     */
    _getTouchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 创建缩放控制按钮
     * Requirements: 4.3 - 支持页面内容的放大和缩小操作
     */
    createZoomControls() {
        // 如果已存在，先移除
        if (this._zoomControlsContainer) {
            this._zoomControlsContainer.remove();
        }

        const controls = document.createElement('div');
        controls.className = 'zoom-controls';
        controls.innerHTML = `
            <button class="zoom-btn zoom-btn-out" data-action="zoom-out" title="缩小" aria-label="缩小页面">
                <span class="zoom-btn-icon">−</span>
            </button>
            <button class="zoom-btn zoom-btn-reset" data-action="zoom-reset" title="重置" aria-label="重置缩放">
                <span class="zoom-btn-text">${Math.round(this._zoomScale * 100)}%</span>
            </button>
            <button class="zoom-btn zoom-btn-in" data-action="zoom-in" title="放大" aria-label="放大页面">
                <span class="zoom-btn-icon">+</span>
            </button>
        `;

        // 绑定按钮事件
        controls.querySelector('[data-action="zoom-out"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.zoomOut();
            this._updateZoomControlsDisplay();
        });

        controls.querySelector('[data-action="zoom-reset"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.resetZoom();
            this._updateZoomControlsDisplay();
        });

        controls.querySelector('[data-action="zoom-in"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.zoomIn();
            this._updateZoomControlsDisplay();
        });

        this._zoomControlsContainer = controls;
        
        // 添加到翻页指示器中，插入到功能按钮区之前，保持位置固定
        const pageIndicator = document.querySelector('.book-flipper-page-indicator');
        if (pageIndicator) {
            const toolGroup = pageIndicator.querySelector('#barToolGroup');
            if (toolGroup) {
                pageIndicator.insertBefore(controls, toolGroup);
            } else {
                pageIndicator.appendChild(controls);
            }
        } else {
            document.body.appendChild(controls);
        }

        this._log('缩放控制按钮已创建');
        return controls;
    }

    /**
     * 更新缩放控制按钮显示
     * @private
     */
    _updateZoomControlsDisplay() {
        if (!this._zoomControlsContainer) return;

        const resetBtn = this._zoomControlsContainer.querySelector('.zoom-btn-reset .zoom-btn-text');
        if (resetBtn) {
            resetBtn.textContent = `${Math.round(this._zoomScale * 100)}%`;
        }

        // 更新按钮禁用状态
        const zoomOutBtn = this._zoomControlsContainer.querySelector('.zoom-btn-out');
        const zoomInBtn = this._zoomControlsContainer.querySelector('.zoom-btn-in');

        if (zoomOutBtn) {
            zoomOutBtn.disabled = this._zoomScale <= this._minZoom;
            zoomOutBtn.classList.toggle('disabled', this._zoomScale <= this._minZoom);
        }

        if (zoomInBtn) {
            zoomInBtn.disabled = this._zoomScale >= this._maxZoom;
            zoomInBtn.classList.toggle('disabled', this._zoomScale >= this._maxZoom);
        }
    }

    /**
     * 显示缩放控制按钮
     */
    showZoomControls() {
        if (!this._zoomControlsContainer) {
            this.createZoomControls();
        }
        if (this._zoomControlsContainer) {
            this._zoomControlsContainer.classList.remove('hidden');
            this._zoomControlsContainer.classList.add('visible');
        }
    }

    /**
     * 隐藏缩放控制按钮
     */
    hideZoomControls() {
        if (this._zoomControlsContainer) {
            this._zoomControlsContainer.classList.remove('visible');
            this._zoomControlsContainer.classList.add('hidden');
        }
    }

    /**
     * 处理元素点击
     * @param {string} elementId - 元素ID
     * @param {string} audioId - 音频ID
     * @param {string} elementType - 元素类型
     * @private
     */
    _handleElementClick(elementId, audioId, elementType) {
        this._log('点击可点读元素', { elementId, audioId, elementType });

        // 获取直接音频URL（如果有）
        const element = this._container.querySelector(`[data-element-id="${elementId}"]`);
        const audioUrl = element ? element.getAttribute('data-audio-url') : null;

        // 添加点击动画
        if (element) {
            element.classList.add('animate-jelly');
            setTimeout(() => {
                element.classList.remove('animate-jelly');
            }, 500);
        }

        // 触发回调
        if (this._onClickableElementClick && typeof this._onClickableElementClick === 'function') {
            const clickableElement = this._findClickableElementById(elementId);
            this._onClickableElementClick(clickableElement, elementId, audioId, elementType, audioUrl);
        }
    }

    /**
     * 根据ID查找可点读元素数据
     * @param {string} elementId - 元素ID
     * @returns {ClickableElement|null} 可点读元素数据
     * @private
     */
    _findClickableElementById(elementId) {
        if (!this._currentContent || !this._currentContent.clickableElements) {
            return null;
        }
        return this._currentContent.clickableElements.find(el => el.id === elementId) || null;
    }

    /**
     * 显示错误状态
     * @param {string} message - 错误消息
     * @param {Function} onRetry - 重试回调函数
     */
    showError(message, onRetry) {
        this._container.innerHTML = `
            <div class="page-renderer-wrapper">
                <div class="error-container text-center">
                    <div class="error-icon animate-bounce">😢</div>
                    <p class="error-message">${message || '页面加载失败，请重试'}</p>
                    <button class="btn btn-cartoon-primary retry-btn">
                        🔄 重试
                    </button>
                </div>
            </div>
        `;

        // 绑定重试按钮事件
        const retryBtn = this._container.querySelector('.retry-btn');
        if (retryBtn && typeof onRetry === 'function') {
            retryBtn.addEventListener('click', onRetry);
        }
    }

    /**
     * 显示空页面状态
     */
    showEmptyPage() {
        this._container.innerHTML = `
            <div class="page-renderer-wrapper">
                <div class="empty-page-container text-center">
                    <div class="empty-icon animate-float">📖</div>
                    <p class="empty-title">暂无页面内容</p>
                    <p class="empty-subtitle">小朋友，这个页面的内容正在准备中哦！</p>
                    <div class="empty-decoration">
                        <span class="decoration-star animate-twinkle">⭐</span>
                        <span class="decoration-star animate-twinkle" style="animation-delay: 0.3s">⭐</span>
                        <span class="decoration-star animate-twinkle" style="animation-delay: 0.6s">⭐</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 设置可点读元素点击回调
     * @param {Function} callback - 回调函数
     */
    onClickableElementClick(callback) {
        if (typeof callback === 'function') {
            this._onClickableElementClick = callback;
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
     * 获取当前页面内容
     * @returns {PageContent|null} 当前页面内容
     */
    getCurrentContent() {
        return this._currentContent;
    }

    /**
     * 获取当前课程ID
     * @returns {string|null} 当前课程ID
     */
    getCurrentLessonId() {
        return this._currentLessonId;
    }

    /**
     * 获取当前页码
     * @returns {number} 当前页码
     */
    getCurrentPageNumber() {
        return this._currentPageNumber;
    }

    /**
     * 获取当前缩放比例
     * @returns {number} 缩放比例
     */
    getZoomScale() {
        return this._zoomScale;
    }

    /**
     * 获取高亮的元素ID
     * @returns {string|null} 高亮的元素ID
     */
    getHighlightedElementId() {
        return this._highlightedElementId;
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
     * 设置缩放范围
     * @param {number} min - 最小缩放比例
     * @param {number} max - 最大缩放比例
     */
    setZoomRange(min, max) {
        if (typeof min === 'number' && min > 0) {
            this._minZoom = min;
        }
        if (typeof max === 'number' && max > min) {
            this._maxZoom = max;
        }
    }

    /**
     * 重置缩放
     */
    resetZoom() {
        this.handleZoom(1);
    }

    /**
     * 放大
     * @param {number} step - 放大步长，默认0.25
     */
    zoomIn(step = 0.25) {
        this.handleZoom(this._zoomScale + step);
    }

    /**
     * 缩小
     * @param {number} step - 缩小步长，默认0.25
     */
    zoomOut(step = 0.25) {
        this.handleZoom(this._zoomScale - step);
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
        
        // 移除缩放控制按钮
        if (this._zoomControlsContainer) {
            this._zoomControlsContainer.remove();
            this._zoomControlsContainer = null;
        }

        // 清理 ResizeObserver
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        
        // 重置状态
        this._currentContent = null;
        this._currentLessonId = null;
        this._currentPageNumber = 1;
        this._highlightedElementId = null;
        this._zoomScale = 1;
        this._onClickableElementClick = null;
        this._isLoading = false;
        this._imageNaturalWidth = 0;
        this._imageNaturalHeight = 0;
        this._pinchState = {
            isPinching: false,
            initialDistance: 0,
            initialScale: 1,
            lastScale: 1
        };

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
                console.log(`[PageRenderer] ${message}`, data);
            } else {
                console.log(`[PageRenderer] ${message}`);
            }
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PageRenderer };
}
