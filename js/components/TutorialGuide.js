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
            interactive: true,
            type: 'subject-selection'
        },
        {
            id: 'textbook',
            title: '选择你的课本',
            description: '选择年级和课本版本，找到你正在使用的课本！',
            icon: '📖',
            mascot: '🐻',
            backgroundColor: 'var(--gradient-accent)',
            animation: 'float',
            interactive: true,
            type: 'textbook-selection'
        }
    ];

    /**
     * 创建TutorialGuide实例
     * @param {Object} options - 配置选项
     * @param {HTMLElement} options.container - 容器元素（可选，默认为body）
     * @param {Array} options.steps - 自定义步骤（可选）
     * @param {Function} options.onComplete - 完成回调
     * @param {Function} options.onSkip - 跳过回调
     * @param {Object} options.dataManager - 数据管理器实例
     */
    constructor(options = {}) {
        this.container = options.container || document.body;
        this.steps = options.steps || TutorialGuide.DEFAULT_STEPS;
        this.onCompleteCallback = options.onComplete || null;
        this.onSkipCallback = options.onSkip || null;
        this.dataManager = options.dataManager || null;
        
        this.currentStep = 0;
        this.isVisible = false;
        this.overlayElement = null;
        this.contentElement = null;
        this._debug = false;
        
        // 用户选择的数据
        this.selectedGrade = null;
        this.selectedSubject = null;
        this.selectedTextbook = null;
        this.subjects = [];
        this.textbooks = [];
        this.grades = [1, 2, 3, 4, 5, 6]; // 小学1-6年级
        
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
     * @returns {Promise<boolean>} 是否成功显示
     */
    async show() {
        if (this.isVisible) {
            return false;
        }

        // 加载学科和课本数据
        if (this.dataManager) {
            try {
                this.subjects = await this.dataManager.getSubjects();
                // 默认选择英语
                this.selectedSubject = this.subjects.find(s => s.id === 'english') || this.subjects[0];
                if (this.selectedSubject) {
                    this.textbooks = await this.dataManager.getTextbooks(this.selectedSubject.id);
                }
            } catch (error) {
                console.error('加载数据失败:', error);
            }
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

        // 如果用户已经选择了学科和课本，也传递给回调
        if (this.onSkipCallback) {
            this.onSkipCallback({
                grade: this.selectedGrade,
                subject: this.selectedSubject,
                textbook: this.selectedTextbook
            });
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
                // 传递用户选择的数据
                this.onCompleteCallback({
                    grade: this.selectedGrade,
                    subject: this.selectedSubject,
                    textbook: this.selectedTextbook
                });
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
            let interactiveContent = '';
            
            // 根据步骤类型渲染交互式内容
            if (step.interactive && step.type === 'subject-selection') {
                interactiveContent = this._renderSubjectSelection();
            } else if (step.interactive && step.type === 'textbook-selection') {
                interactiveContent = this._renderTextbookSelection();
            }
            
            this.contentElement.innerHTML = `
                <div class="tutorial-step animate-bounce-in" style="background: ${step.backgroundColor};">
                    <!-- 跳过按钮 -->
                    <button class="tutorial-skip-btn" id="tutorialSkipBtn" aria-label="跳过引导">
                        ✕
                    </button>
                    
                    <!-- 吉祥物 -->
                    <div class="tutorial-mascot animate-${step.animation}">
                        ${step.mascot}
                    </div>
                    
                    <!-- 标题 -->
                    <h2 class="tutorial-title">${step.title}</h2>
                    
                    <!-- 描述 -->
                    <p class="tutorial-description">${step.description}</p>
                    
                    <!-- 交互式内容 -->
                    ${interactiveContent}
                    
                    <!-- 进度指示器 -->
                    <div class="tutorial-progress">
                        ${this._renderProgressDots()}
                    </div>
                    
                    <!-- 导航按钮 -->
                    <div class="tutorial-nav">
                        ${!isFirst ? `
                            <button class="tutorial-btn tutorial-btn-prev" id="tutorialPrevBtn">
                                上一步
                            </button>
                        ` : '<div class="tutorial-btn-placeholder"></div>'}
                        
                        <button class="tutorial-btn tutorial-btn-next ${isLast ? 'tutorial-btn-complete' : ''}" id="tutorialNextBtn">
                            ${isLast ? '开始学习 🚀' : '下一步'}
                        </button>
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
     * 渲染年级选择
     * @returns {string} HTML字符串
     * @private
     */
    _renderGradeSelection() {
        return `
            <div class="tutorial-grade-grid">
                ${this.grades.map(grade => `
                    <div class="tutorial-grade-card ${this.selectedGrade === grade ? 'selected' : ''}" 
                         data-grade="${grade}">
                        <div class="tutorial-grade-number">${grade}</div>
                        <div class="tutorial-grade-label">年级</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * 渲染学科选择
     * @returns {string} HTML字符串
     * @private
     */
    _renderSubjectSelection() {
        if (!this.subjects || this.subjects.length === 0) {
            return '<p class="tutorial-loading">加载中...</p>';
        }
        
        // 只显示语文和英语
        const displaySubjects = this.subjects.filter(s => s.id === 'chinese' || s.id === 'english');
        
        return `
            <div class="tutorial-subject-grid">
                ${displaySubjects.map(subject => `
                    <div class="tutorial-subject-card ${this.selectedSubject && this.selectedSubject.id === subject.id ? 'selected' : ''}" 
                         data-subject-id="${subject.id}">
                        <div class="tutorial-subject-icon" style="background: ${subject.color};">
                            ${subject.icon}
                        </div>
                        <div class="tutorial-subject-name">${subject.name}</div>
                        <div class="tutorial-subject-name-en">${subject.nameEn}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * 渲染课本选择
     * @returns {string} HTML字符串
     * @private
     */
    _renderTextbookSelection() {
        if (!this.textbooks || this.textbooks.length === 0) {
            return '<p class="tutorial-loading">请先选择学科</p>';
        }
        
        // 获取所有年级
        const grades = [...new Set(this.textbooks.map(t => t.grade))].sort((a, b) => a - b);
        const currentGrade = this.selectedGrade || grades[0];
        
        // 按年级过滤课本
        let filteredByGrade = this.textbooks.filter(t => t.grade === currentGrade);
        
        // 按出版社分组
        const publishers = [...new Set(filteredByGrade.map(t => t.publisher))];
        const currentPublisher = publishers[0];
        const filteredTextbooks = filteredByGrade.filter(t => t.publisher === currentPublisher);
        
        return `
            <div class="tutorial-textbook-section">
                <div class="tutorial-grade-selector">
                    <label for="gradeSelect">选择年级：</label>
                    <select id="gradeSelect" class="tutorial-grade-select">
                        ${grades.map(grade => `
                            <option value="${grade}" ${grade === currentGrade ? 'selected' : ''}>
                                ${grade}年级
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="tutorial-publisher-tabs">
                    ${publishers.map((pub, idx) => `
                        <button class="tutorial-publisher-tab ${idx === 0 ? 'active' : ''}" data-publisher="${pub}">
                            ${pub}
                        </button>
                    `).join('')}
                </div>
                <div class="tutorial-textbook-grid">
                    ${filteredTextbooks.map(textbook => `
                        <div class="tutorial-textbook-card ${this.selectedTextbook && this.selectedTextbook.id === textbook.id ? 'selected' : ''}" 
                             data-textbook-id="${textbook.id}">
                            <div class="tutorial-textbook-cover">
                                ${textbook.coverImage ? `
                                    <img src="${encodeURI(textbook.coverImage)}" alt="${textbook.name}">
                                ` : '<div class="tutorial-textbook-placeholder">📖</div>'}
                            </div>
                            <div class="tutorial-textbook-name">${textbook.name}</div>
                            <div class="tutorial-textbook-grade">${textbook.grade}年级${textbook.semester}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
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
        
        // 年级下拉框变化
        const gradeSelect = document.getElementById('gradeSelect');
        if (gradeSelect) {
            gradeSelect.addEventListener('change', () => {
                this.selectedGrade = parseInt(gradeSelect.value, 10);
                // 重新渲染课本选择
                this._renderCurrentStep();
            });
        }
        
        // 学科卡片点击
        const subjectCards = this.contentElement.querySelectorAll('.tutorial-subject-card');
        subjectCards.forEach(card => {
            card.addEventListener('click', async () => {
                const subjectId = card.dataset.subjectId;
                this.selectedSubject = this.subjects.find(s => s.id === subjectId);
                
                // 更新选中状态
                subjectCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                // 加载该学科的课本
                if (this.dataManager && this.selectedSubject) {
                    try {
                        this.textbooks = await this.dataManager.getTextbooks(this.selectedSubject.id);
                        this.selectedTextbook = null; // 重置课本选择
                    } catch (error) {
                        console.error('加载课本失败:', error);
                    }
                }
            });
        });
        
        // 出版社标签点击
        const publisherTabs = this.contentElement.querySelectorAll('.tutorial-publisher-tab');
        publisherTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const publisher = tab.dataset.publisher;
                publisherTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // 获取当前年级
                const currentGrade = this.selectedGrade || [...new Set(this.textbooks.map(t => t.grade))].sort((a, b) => a - b)[0];
                
                // 重新渲染课本列表
                const filteredTextbooks = this.textbooks.filter(t => t.publisher === publisher && t.grade === currentGrade);
                const textbookGrid = this.contentElement.querySelector('.tutorial-textbook-grid');
                if (textbookGrid) {
                    textbookGrid.innerHTML = filteredTextbooks.map(textbook => `
                        <div class="tutorial-textbook-card ${this.selectedTextbook && this.selectedTextbook.id === textbook.id ? 'selected' : ''}" 
                             data-textbook-id="${textbook.id}">
                            <div class="tutorial-textbook-cover">
                                ${textbook.coverImage ? `
                                    <img src="${encodeURI(textbook.coverImage)}" alt="${textbook.name}">
                                ` : '<div class="tutorial-textbook-placeholder">📖</div>'}
                            </div>
                            <div class="tutorial-textbook-name">${textbook.name}</div>
                            <div class="tutorial-textbook-grade">${textbook.grade}年级${textbook.semester}</div>
                        </div>
                    `).join('');
                    
                    // 重新绑定课本卡片事件
                    this._bindTextbookCardEvents();
                }
            });
        });
        
        // 课本卡片点击
        this._bindTextbookCardEvents();
    }
    
    /**
     * 绑定课本卡片事件
     * @private
     */
    _bindTextbookCardEvents() {
        const textbookCards = this.contentElement.querySelectorAll('.tutorial-textbook-card');
        textbookCards.forEach(card => {
            card.addEventListener('click', () => {
                const textbookId = card.dataset.textbookId;
                this.selectedTextbook = this.textbooks.find(t => t.id === textbookId);
                
                // 更新选中状态
                textbookCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                // 选择课本后立即完成引导并跳转
                setTimeout(() => {
                    this.complete();
                }, 300);
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
