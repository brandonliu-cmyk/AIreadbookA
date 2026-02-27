/**
 * TutorialGuide - 首次使用引导组件
 * 为小学生提供可爱、有趣的分步引导教程
 * 
 * Requirements: 8.5 - 用户首次使用应用时显示简短有趣的引导教程
 * 
 * @class TutorialGuide
 */
class TutorialGuide {
    /**
     * 存储键常量
     * @static
     */
    static STORAGE_KEY = 'ai_reading_tutorial_completed';

    /**
     * 默认教程步骤
     * @static
     */
    static DEFAULT_STEPS = [
        {
            id: 'welcome',
            title: '欢迎来到AI点读！',
            description: '让我们一起开始快乐的学习之旅吧！',
            icon: '🎉',
            mascot: '🐰',
            backgroundColor: 'var(--gradient-primary)',
            animation: 'bounce'
        },
        {
            id: 'subject',
            title: '选择你喜欢的学科',
            description: '点击学科卡片，选择你想学习的科目！',
            icon: '📚',
            mascot: '🦊',
            backgroundColor: 'var(--gradient-secondary)',
            animation: 'wiggle',
            highlightSelector: '.card-subject'
        },
        {
            id: 'textbook',
            title: '选择你的课本',
            description: '找到你正在使用的课本版本，这样学习内容就和学校一样啦！',
            icon: '📖',
            mascot: '🐻',
            backgroundColor: 'var(--gradient-accent)',
            animation: 'float'
        },
        {
            id: 'reading',
            title: '点击就能听朗读',
            description: '看到课本上的文字了吗？点一点就能听到标准佳的朗读声音，跟着一起读吧！',
            icon: '🔊',
            mascot: '🐼',
            backgroundColor: 'var(--gradient-sunset)',
            animation: 'pulse'
        },
        {
            id: 'complete',
            title: '准备好了吗？',
            description: '太棒了！你已经学会使用AI点读啦！现在开始你的学习吧！',
            icon: '🌟',
            mascot: '🦁',
            backgroundColor: 'var(--gradient-rainbow)',
            animation: 'heartbeat'
        }
    ];

    /**
     * 创建TutorialGuide实例
     * @param {Object} options - 配置选项
     * @param {HTMLElement} options.container - 容器元素（可选，默认为body）
     * @param {Array} options.steps - 自定义步骤（可选）
     * @param {Function} options.onComplete - 完成回调
     * @param {Function} options.onSkip - 跳过回调
     */
    constructor(options = {}) {
        this.container = options.container || document.body;
        this.steps = options.steps || TutorialGuide.DEFAULT_STEPS;
        this.onCompleteCallback = options.onComplete || null;
        this.onSkipCallback = options.onSkip || null;
        
        this.currentStep = 0;
        this.isVisible = false;
        this.overlayElement = null;
        this.contentElement = null;
        this._debug = false;
        
        // 绑定方法
        this._handleKeyDown = this._handleKeyDown.bind(this);
    }

    // ==================== 公共方法 ====================

    /**
     * 设置调试模式
     * @param {boolean} debug - 是否启用调试
     */
    setDebug(debug) {
        this._debug = debug;
    }

    /**
     * 检查是否首次使用（需要显示引导）
     * @returns {boolean} 是否需要显示引导
     */
    isFirstTimeUser() {
        try {
            const completed = localStorage.getItem(TutorialGuide.STORAGE_KEY);
            return completed !== 'true';
        } catch (e) {
            // localStorage不可用时，默认显示引导
            return true;
        }
    }

    /**
     * 标记引导已完成
     */
    markAsCompleted() {
        try {
            localStorage.setItem(TutorialGuide.STORAGE_KEY, 'true');
        } catch (e) {
            if (this._debug) {
                console.warn('无法保存引导完成状态:', e);
            }
        }
    }

    /**
     * 重置引导状态（用于测试或重新显示引导）
     */
    resetTutorialStatus() {
        try {
            localStorage.removeItem(TutorialGuide.STORAGE_KEY);
        } catch (e) {
            if (this._debug) {
                console.warn('无法重置引导状态:', e);
            }
        }
    }

    /**
     * 显示引导教程
     * @returns {boolean} 是否成功显示
     */
    show() {
        if (this.isVisible) {
            return false;
        }

        this.currentStep = 0;
        this._createOverlay();
        this._renderCurrentStep();
        this._addEventListeners();
        this.isVisible = true;

        if (this._debug) {
            console.log('🎓 引导教程已显示');
        }

        return true;
    }

    /**
     * 隐藏引导教程
     */
    hide() {
        if (!this.isVisible) {
            return;
        }

        this._removeEventListeners();
        
        if (this.overlayElement) {
            this.overlayElement.classList.add('tutorial-hiding');
            
            // 等待动画完成后移除元素
            setTimeout(() => {
                if (this.overlayElement && this.overlayElement.parentNode) {
                    this.overlayElement.parentNode.removeChild(this.overlayElement);
                }
                this.overlayElement = null;
                this.contentElement = null;
            }, 300);
        }

        this.isVisible = false;

        if (this._debug) {
            console.log('🎓 引导教程已隐藏');
        }
    }

    /**
     * 前进到下一步
     * @returns {boolean} 是否成功前进
     */
    nextStep() {
        if (this.currentStep >= this.steps.length - 1) {
            this.complete();
            return false;
        }

        this.currentStep++;
        this._renderCurrentStep();

        if (this._debug) {
            console.log(`🎓 前进到步骤 ${this.currentStep + 1}/${this.steps.length}`);
        }

        return true;
    }

    /**
     * 返回上一步
     * @returns {boolean} 是否成功返回
     */
    prevStep() {
        if (this.currentStep <= 0) {
            return false;
        }

        this.currentStep--;
        this._renderCurrentStep();

        if (this._debug) {
            console.log(`🎓 返回到步骤 ${this.currentStep + 1}/${this.steps.length}`);
        }

        return true;
    }

    /**
     * 跳转到指定步骤
     * @param {number} stepIndex - 步骤索引
     * @returns {boolean} 是否成功跳转
     */
    goToStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) {
            return false;
        }

        this.currentStep = stepIndex;
        this._renderCurrentStep();

        return true;
    }

    /**
     * 跳过引导
     */
    skip() {
        if (this._debug) {
            console.log('🎓 用户跳过引导');
        }

        this.markAsCompleted();
        this.hide();

        if (this.onSkipCallback) {
            this.onSkipCallback();
        }
    }

    /**
     * 完成引导
     */
    complete() {
        if (this._debug) {
            console.log('🎓 用户完成引导');
        }

        this.markAsCompleted();
        this._showCompletionAnimation();

        // 延迟隐藏以显示完成动画
        setTimeout(() => {
            this.hide();
            
            if (this.onCompleteCallback) {
                this.onCompleteCallback();
            }
        }, 1500);
    }

    /**
     * 获取当前步骤索引
     * @returns {number} 当前步骤索引
     */
    getCurrentStepIndex() {
        return this.currentStep;
    }

    /**
     * 获取当前步骤数据
     * @returns {Object} 当前步骤数据
     */
    getCurrentStep() {
        return this.steps[this.currentStep];
    }

    /**
     * 获取总步骤数
     * @returns {number} 总步骤数
     */
    getTotalSteps() {
        return this.steps.length;
    }

    /**
     * 检查是否在第一步
     * @returns {boolean}
     */
    isFirstStep() {
        return this.currentStep === 0;
    }

    /**
     * 检查是否在最后一步
     * @returns {boolean}
     */
    isLastStep() {
        return this.currentStep === this.steps.length - 1;
    }

    /**
     * 设置完成回调
     * @param {Function} callback - 回调函数
     */
    onComplete(callback) {
        this.onCompleteCallback = callback;
    }

    /**
     * 设置跳过回调
     * @param {Function} callback - 回调函数
     */
    onSkip(callback) {
        this.onSkipCallback = callback;
    }

    // ==================== 私有方法 ====================

    /**
     * 创建遮罩层
     * @private
     */
    _createOverlay() {
        // 创建遮罩层
        this.overlayElement = document.createElement('div');
        this.overlayElement.className = 'tutorial-overlay';
        this.overlayElement.innerHTML = `
            <div class="tutorial-container">
                <div class="tutorial-content" id="tutorialContent">
                    <!-- 内容将动态渲染 -->
                </div>
            </div>
        `;

        this.container.appendChild(this.overlayElement);
        this.contentElement = this.overlayElement.querySelector('#tutorialContent');

        // 触发重绘以启动动画
        this.overlayElement.offsetHeight;
        this.overlayElement.classList.add('tutorial-visible');
    }

    /**
     * 渲染当前步骤
     * @private
     */
    _renderCurrentStep() {
        if (!this.contentElement) {
            return;
        }

        const step = this.steps[this.currentStep];
        const isFirst = this.isFirstStep();
        const isLast = this.isLastStep();

        // 添加切换动画类
        this.contentElement.classList.add('tutorial-step-changing');

        setTimeout(() => {
            this.contentElement.innerHTML = `
                <div class="tutorial-step animate-bounce-in" style="background: ${step.backgroundColor};">
                    <!-- 跳过按钮 -->
                    <button class="tutorial-skip-btn" id="tutorialSkipBtn" aria-label="跳过引导">
                        跳过 ✕
                    </button>
                    
                    <!-- 吉祥物 -->
                    <div class="tutorial-mascot animate-${step.animation}">
                        ${step.mascot}
                    </div>
                    
                    <!-- 主图标 -->
                    <div class="tutorial-icon animate-float">
                        ${step.icon}
                    </div>
                    
                    <!-- 标题 -->
                    <h2 class="tutorial-title">${step.title}</h2>
                    
                    <!-- 描述 -->
                    <p class="tutorial-description">${step.description}</p>
                    
                    <!-- 进度指示器 -->
                    <div class="tutorial-progress">
                        ${this._renderProgressDots()}
                    </div>
                    
                    <!-- 导航按钮 -->
                    <div class="tutorial-nav">
                        ${!isFirst ? `
                            <button class="tutorial-btn tutorial-btn-prev" id="tutorialPrevBtn">
                                <span>👈</span> 上一步
                            </button>
                        ` : '<div class="tutorial-btn-placeholder"></div>'}
                        
                        <button class="tutorial-btn tutorial-btn-next ${isLast ? 'tutorial-btn-complete' : ''}" id="tutorialNextBtn">
                            ${isLast ? '开始学习 🚀' : '下一步 👉'}
                        </button>
                    </div>
                    
                    <!-- 装饰元素 -->
                    <div class="tutorial-decorations">
                        <span class="tutorial-star tutorial-star-1">⭐</span>
                        <span class="tutorial-star tutorial-star-2">✨</span>
                        <span class="tutorial-star tutorial-star-3">🌟</span>
                        <span class="tutorial-star tutorial-star-4">💫</span>
                    </div>
                </div>
            `;

            this.contentElement.classList.remove('tutorial-step-changing');
            this._bindStepEventListeners();
        }, 150);
    }

    /**
     * 渲染进度点
     * @returns {string} HTML字符串
     * @private
     */
    _renderProgressDots() {
        return this.steps.map((_, index) => {
            const isActive = index === this.currentStep;
            const isCompleted = index < this.currentStep;
            let className = 'tutorial-dot';
            
            if (isActive) {
                className += ' tutorial-dot-active';
            } else if (isCompleted) {
                className += ' tutorial-dot-completed';
            }
            
            return `<span class="${className}" data-step="${index}"></span>`;
        }).join('');
    }

    /**
     * 绑定步骤内的事件监听器
     * @private
     */
    _bindStepEventListeners() {
        // 跳过按钮
        const skipBtn = document.getElementById('tutorialSkipBtn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skip());
        }

        // 上一步按钮
        const prevBtn = document.getElementById('tutorialPrevBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevStep());
        }

        // 下一步/完成按钮
        const nextBtn = document.getElementById('tutorialNextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.isLastStep()) {
                    this.complete();
                } else {
                    this.nextStep();
                }
            });
        }

        // 进度点点击
        const dots = this.contentElement.querySelectorAll('.tutorial-dot');
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const stepIndex = parseInt(dot.dataset.step, 10);
                this.goToStep(stepIndex);
            });
        });
    }

    /**
     * 添加全局事件监听器
     * @private
     */
    _addEventListeners() {
        document.addEventListener('keydown', this._handleKeyDown);
    }

    /**
     * 移除全局事件监听器
     * @private
     */
    _removeEventListeners() {
        document.removeEventListener('keydown', this._handleKeyDown);
    }

    /**
     * 处理键盘事件
     * @param {KeyboardEvent} event
     * @private
     */
    _handleKeyDown(event) {
        switch (event.key) {
            case 'ArrowRight':
            case 'Enter':
                if (this.isLastStep()) {
                    this.complete();
                } else {
                    this.nextStep();
                }
                break;
            case 'ArrowLeft':
                this.prevStep();
                break;
            case 'Escape':
                this.skip();
                break;
        }
    }

    /**
     * 显示完成动画
     * @private
     */
    _showCompletionAnimation() {
        if (!this.contentElement) {
            return;
        }

        // 创建庆祝动画
        const celebrationHTML = `
            <div class="tutorial-celebration animate-bounce-in">
                <div class="celebration-fireworks">
                    <span class="firework firework-1">🎆</span>
                    <span class="firework firework-2">🎇</span>
                    <span class="firework firework-3">🎉</span>
                    <span class="firework firework-4">🎊</span>
                    <span class="firework firework-5">✨</span>
                </div>
                <div class="celebration-mascot animate-heartbeat">🦁</div>
                <h2 class="celebration-title">太棒了！</h2>
                <p class="celebration-text">你已经准备好开始学习啦！</p>
                <div class="celebration-stars">
                    <span class="star animate-twinkle" style="animation-delay: 0s;">⭐</span>
                    <span class="star animate-twinkle" style="animation-delay: 0.2s;">⭐</span>
                    <span class="star animate-twinkle" style="animation-delay: 0.4s;">⭐</span>
                    <span class="star animate-twinkle" style="animation-delay: 0.6s;">⭐</span>
                    <span class="star animate-twinkle" style="animation-delay: 0.8s;">⭐</span>
                </div>
            </div>
        `;

        this.contentElement.innerHTML = celebrationHTML;
    }
}

// 支持ES模块和CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TutorialGuide };
}
