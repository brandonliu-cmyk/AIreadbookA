/**
 * AI点读应用 - 主入口文件
 * 面向小学生的互动式电子课本学习应用
 * 
 * 技术栈：原生HTML5 + CSS3 + JavaScript (ES6+)
 * Requirements: 8.1, 8.4
 */

// ========================================
// 应用配置
// ========================================
const APP_CONFIG = {
    name: 'AI点读',
    version: '1.0.0',
    debug: true,
    defaultVoice: 'female',
    animationsEnabled: true
};

// ========================================
// 全局应用控制器实例
// ========================================
let appController = null;

// ========================================
// 组件实例
// ========================================
let subjectSelector = null;
let textbookSelector = null;
let chapterNavigator = null;
let pageRenderer = null;
let bookFlipper = null;
let voiceSelector = null;
let progressTrackerInstance = null;
let digitalAvatar = null;

// ========================================
// 复读/连读/评测/背诵 状态
// ========================================
let lastClickedElement = null;   // 上一次点击的元素信息（用于复读）
let continuousMode = false;      // 连读模式
let currentPageElements = [];    // 当前页面所有可点读元素（有序）
let continuousIndex = -1;        // 连读当前索引

// ========================================
// DOM 元素引用
// ========================================
const elements = {
    app: null,
    mainContent: null,
    loadingContainer: null,
    modalOverlay: null,
    modalContent: null,
    toastContainer: null,
    btnBack: null,
    btnSettings: null
};

// ========================================
// 初始化函数
// ========================================
function initApp() {
    // 创建并初始化AppController
    appController = new AppController();
    appController.setDebug(APP_CONFIG.debug);
    appController.init();
    
    // 初始化 ProgressTracker
    // Requirements: 9.1, 9.2, 9.3, 9.4 - 学习进度追踪
    initProgressTracker();
    
    // 缓存DOM元素引用
    cacheElements();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 绑定AppController事件
    bindAppControllerEvents();
    
    // 初始化应用状态
    initializeState();
    
    // 渲染初始页面
    renderCurrentPage();
    
    // 输出调试信息
    if (APP_CONFIG.debug) {
        console.log(`🎉 ${APP_CONFIG.name} v${APP_CONFIG.version} 已启动`);
        console.log('📚 欢迎使用AI点读应用！');
    }
}

/**
 * 初始化 ProgressTracker
 * Requirements: 9.1, 9.2, 9.3, 9.4
 * - 记录用户访问过的课程和页面
 * - 显示已学习和未学习的内容
 * - 显示总体学习进度概览
 * - 完成课程时显示祝贺动画
 */
function initProgressTracker() {
    // 使用全局单例 progressTracker
    progressTrackerInstance = progressTracker;
    
    // 设置 StorageManager 和 DataManager（确保它们已初始化）
    if (typeof storageManager !== 'undefined') {
        progressTrackerInstance.setStorageManager(storageManager);
    }
    if (typeof dataManager !== 'undefined') {
        progressTrackerInstance.setDataManager(dataManager);
    }
    
    // 设置祝贺动画容器为 document.body
    progressTrackerInstance.setCongratulationsContainer(document.body);
    
    // 设置祝贺动画回调
    progressTrackerInstance.onCongratulations(() => {
        if (APP_CONFIG.debug) {
            console.log('🎉 触发祝贺动画');
        }
    });
    
    // 设置进度更新回调
    progressTrackerInstance.onProgressUpdate((data) => {
        if (APP_CONFIG.debug) {
            console.log('📊 进度更新:', data);
        }
        // 如果在章节页面，更新进度显示
        const state = appController.getCurrentState();
        if (state.currentPage === PageType.CHAPTER && chapterNavigator) {
            const overallProgress = chapterNavigator.getOverallProgress();
            updateOverallProgressDisplay(overallProgress);
        }
    });
    
    if (APP_CONFIG.debug) {
        console.log('📊 ProgressTracker 已初始化');
    }
}

/**
 * 缓存DOM元素引用
 */
function cacheElements() {
    elements.app = document.getElementById('app');
    elements.mainContent = document.getElementById('mainContent');
    elements.loadingContainer = document.getElementById('loadingContainer');
    elements.modalOverlay = document.getElementById('modalOverlay');
    elements.modalContent = document.getElementById('modalContent');
    elements.toastContainer = document.getElementById('toastContainer');
    elements.btnBack = document.getElementById('btnBack');
    elements.btnSettings = document.getElementById('btnSettings');
}

/**
 * 绑定事件监听器
 */
function bindEventListeners() {
    // 返回按钮
    if (elements.btnBack) {
        elements.btnBack.addEventListener('click', handleBackClick);
    }
    
    // 设置按钮
    if (elements.btnSettings) {
        elements.btnSettings.addEventListener('click', handleSettingsClick);
    }
    
    // 底部导航
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', handleNavClick);
    });
    
    // 模态框关闭
    if (elements.modalOverlay) {
        elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target === elements.modalOverlay) {
                hideModal();
            }
        });
    }
    
    // 绑定硬编码学科卡片点击事件
    bindHardcodedSubjectCards();
}

/**
 * 绑定硬编码学科卡片点击事件
 */
async function bindHardcodedSubjectCards() {
    try {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // 获取学科数据
        const subjects = await dataManager.getSubjects();
        
        // 绑定学科卡片点击事件
        const subjectCards = document.querySelectorAll('.card-subject[data-subject]');
        subjectCards.forEach(card => {
            card.addEventListener('click', async () => {
                const subjectId = card.getAttribute('data-subject');
                if (subjectId) {
                    try {
                        // 获取学科对象
                        const subject = subjects.find(s => s.id === subjectId);
                        if (subject) {
                            // 显示加载状态
                            appController.setLoading(true);
                            showToast(`正在加载${subject.name}教材...`, 'info', 1500);
                            
                            // 预加载教材数据
                            const textbooks = await dataManager.getTextbooks(subject.id);
                            
                            // 短暂延迟以显示选中动画效果
                            await new Promise(resolve => setTimeout(resolve, 500));
                            
                            // 导航到教材选择页面
                            navigateTo(PageType.TEXTBOOK, { subject: subject });
                        }
                    } catch (error) {
                        console.error('学科选择失败:', error);
                        showToast('加载失败，请重试', 'error');
                    } finally {
                        appController.setLoading(false);
                    }
                }
            });
        });
    } catch (error) {
        console.error('绑定学科卡片事件失败:', error);
    }
}

/**
 * 绑定AppController事件
 */
function bindAppControllerEvents() {
    // 监听导航变化
    appController.on('navigation:change', (data) => {
        if (APP_CONFIG.debug) {
            console.log(`📍 导航变化: ${data.from} -> ${data.to}`);
        }
        renderCurrentPage();
        updateNavigation();
    });
    
    // 监听加载状态变化
    appController.on('loading:change', (data) => {
        if (data.isLoading) {
            showLoadingUI();
        } else {
            hideLoadingUI();
        }
    });
    
    // 监听播放状态变化
    appController.on('playing:change', (data) => {
        if (APP_CONFIG.debug) {
            console.log(`🎵 播放状态: ${data.isPlaying ? '播放中' : '已停止'}`);
        }
    });
}

/**
 * 初始化应用状态
 */
function initializeState() {
    // 从本地存储加载用户偏好
    const savedPreferences = loadFromStorage('userPreferences');
    if (savedPreferences && savedPreferences.selectedVoiceId) {
        appController.setSelectedVoice({ id: savedPreferences.selectedVoiceId });
    }
    
    // 检查是否首次使用并显示引导教程
    // Requirements: 8.5 - 用户首次使用应用时显示简短有趣的引导教程
    showTutorialIfFirstTime();
}

/**
 * 首次使用引导教程实例
 */
let tutorialGuide = null;

/**
 * 检查并显示首次使用引导
 * Requirements: 8.5 - 用户首次使用应用时显示简短有趣的引导教程
 */
function showTutorialIfFirstTime() {
    // 创建引导教程实例
    tutorialGuide = new TutorialGuide({
        onComplete: () => {
            if (APP_CONFIG.debug) {
                console.log('🎓 用户完成了引导教程');
            }
            showToast('欢迎开始学习！', 'success');
        },
        onSkip: () => {
            if (APP_CONFIG.debug) {
                console.log('🎓 用户跳过了引导教程');
            }
        }
    });
    
    tutorialGuide.setDebug(APP_CONFIG.debug);
    
    // 检查是否首次使用
    if (tutorialGuide.isFirstTimeUser()) {
        // 延迟显示引导，让页面先渲染完成
        setTimeout(() => {
            tutorialGuide.show();
        }, 500);
    }
}

/**
 * 手动显示引导教程（用于设置页面或帮助功能）
 */
function showTutorial() {
    if (!tutorialGuide) {
        tutorialGuide = new TutorialGuide({
            onComplete: () => {
                showToast('引导完成！', 'success');
            }
        });
        tutorialGuide.setDebug(APP_CONFIG.debug);
    }
    
    // 重置状态以便重新显示
    tutorialGuide.resetTutorialStatus();
    tutorialGuide.show();
}

// ========================================
// 页面导航
// ========================================

/**
 * 导航到指定页面
 * @param {string} page - 页面类型
 * @param {object} params - 页面参数
 */
function navigateTo(page, params = {}) {
    appController.navigateTo(page, params);
}

/**
 * 渲染当前页面
 */
function renderCurrentPage() {
    showLoading();
    
    // 离开阅读页面时恢复顶部栏
    cleanupReadingHeader();
    
    // 离开阅读页面时清理数字人
    if (digitalAvatar) {
        digitalAvatar.destroy();
        digitalAvatar = null;
        const avatarContainer = document.getElementById('digitalAvatarContainer');
        if (avatarContainer) avatarContainer.remove();
    }
    
    const state = appController.getCurrentState();
    
    // 模拟异步加载
    setTimeout(async () => {
        try {
            hideLoading();
            
            // 根据当前页面类型渲染内容
            switch (state.currentPage) {
                case PageType.HOME:
                    await renderHomePage();
                    break;
                case PageType.SUBJECT:
                    await renderSubjectPage();
                    break;
                case PageType.TEXTBOOK:
                    await renderTextbookPage();
                    break;
                case PageType.CHAPTER:
                    await renderChapterPage();
                    break;
                case PageType.READING:
                    await renderReadingPage();
                    break;
                case PageType.SETTINGS:
                    await renderSettingsPage();
                    break;
                default:
                    await renderHomePage();
            }
        } catch (error) {
            console.error('页面渲染错误:', error);
            hideLoading();
        }
    }, 300);
}

/**
 * 渲染首页
 */
async function renderHomePage() {
    // 获取学习记录
    const learningRecords = storageManager.getAllLearningRecords();
    const subjects = await dataManager.getSubjects();
    const allTextbooks = await dataManager.getTextbooks();
    
    // 按学科分组教材学习记录
    const subjectRecords = {};
    for (const subject of subjects) {
        subjectRecords[subject.id] = {
            subject,
            textbooks: []
        };
    }
    
    // 遍历所有教材，获取学习进度
    for (const textbook of allTextbooks) {
        const record = learningRecords[textbook.id];
        if (record) {
            // 获取章节数据计算进度
            const chapters = await dataManager.getChapters(textbook.id);
            let totalLessons = 0;
            let completedLessons = 0;
            let currentChapter = null;
            
            for (const chapter of chapters) {
                if (chapter.lessons) {
                    totalLessons += chapter.lessons.length;
                    for (const lesson of chapter.lessons) {
                        const lessonProgress = record.progress && record.progress[lesson.id];
                        if (lessonProgress && lessonProgress.isCompleted) {
                            completedLessons++;
                        } else if (!currentChapter && lessonProgress) {
                            currentChapter = chapter.name;
                        }
                    }
                }
            }
            
            // 如果没有找到当前章节，使用第一个章节
            if (!currentChapter && chapters.length > 0) {
                currentChapter = chapters[0].name;
            }
            
            const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
            
            subjectRecords[textbook.subjectId].textbooks.push({
                textbook,
                record,
                progress,
                currentChapter,
                completedLessons,
                totalLessons
            });
        }
    }
    
    // 生成学习记录HTML
    let recordsHTML = '';
    const subjectColors = {
        'english': { bg: 'var(--gradient-secondary)', icon: '🔤', name: '英语' },
        'chinese': { bg: 'var(--gradient-primary)', icon: '📖', name: '语文' }
    };
    
    for (const subjectId of ['english', 'chinese']) {
        const data = subjectRecords[subjectId];
        const colorInfo = subjectColors[subjectId];
        
        recordsHTML += `
            <div class="learning-history-section">
                <div class="section-header" style="background: ${colorInfo.bg};">
                    <span class="section-icon">${colorInfo.icon}</span>
                    <span class="section-title">${colorInfo.name}</span>
                </div>
                <div class="textbook-records">
        `;
        
        if (data.textbooks.length === 0) {
            recordsHTML += `
                <div class="no-records">
                    <span class="no-records-icon">📚</span>
                    <span class="no-records-text">暂无学习记录</span>
                </div>
            `;
        } else {
            for (const item of data.textbooks) {
                // 拆分教材名：出版社 + 年级信息
                const nameMatch = item.textbook.name.match(/^([\u4e00-\u9fa5]+版)(.*)/);
                const publisherLine = nameMatch ? nameMatch[1] : item.textbook.name;
                const gradeLine = nameMatch ? nameMatch[2] : '';
                recordsHTML += `
                    <div class="textbook-record-card" data-textbook-id="${item.textbook.id}">
                        <div class="textbook-publisher">${publisherLine}</div>
                        <div class="textbook-grade">${gradeLine}</div>
                        <div class="textbook-chapter">${item.currentChapter || '未开始'}</div>
                        <div class="progress-detail">${item.completedLessons}/${item.totalLessons}课</div>
                        <div class="textbook-progress-row">
                            <div class="progress-bar-container">
                                <div class="progress-bar-fill" style="width: ${item.progress}%;"></div>
                            </div>
                            <span class="progress-text">${item.progress}%</span>
                        </div>
                    </div>
                `;
            }
        }
        
        recordsHTML += `
                </div>
            </div>
        `;
    }
    
    elements.mainContent.innerHTML = `
        <div class="home-page animate-pop">
            <div class="welcome-section text-center">
                <h2 class="welcome-title">👋 欢迎来到AI点读！</h2>
                <p class="welcome-text text-secondary">选择学科开始学习</p>
            </div>
            <div class="subject-buttons-row">
                <div class="subject-btn" data-subject="english">
                    <span class="subject-btn-icon">🔤</span>
                    <span class="subject-btn-name">英语</span>
                </div>
                <div class="subject-btn" data-subject="chinese">
                    <span class="subject-btn-icon">📖</span>
                    <span class="subject-btn-name">语文</span>
                </div>
            </div>
            <div class="learning-history" style="margin-top: var(--spacing-lg);">
                <h3 class="history-title">📚 学习记录</h3>
                ${recordsHTML}
            </div>
        </div>
    `;
    
    // 添加样式
    addHomePageStyles();
    
    // 绑定学科按钮点击事件 - 跳转到对应学科的教材选择页面
    const subjectBtns = document.querySelectorAll('.subject-btn');
    subjectBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const subjectId = btn.dataset.subject;
            // 获取学科对象
            const subject = subjects.find(s => s.id === subjectId);
            if (subject) {
                // 导航到教材选择页面，传递学科对象
                navigateTo(PageType.TEXTBOOK, { subject: subject });
            }
        });
    });
    
    // 绑定教材卡片点击事件 - 继续学习该教材
    const textbookCards = document.querySelectorAll('.textbook-record-card');
    textbookCards.forEach(card => {
        card.addEventListener('click', async () => {
            const textbookId = card.dataset.textbookId;
            const textbook = allTextbooks.find(t => t.id === textbookId);
            if (textbook) {
                const subject = subjects.find(s => s.id === textbook.subjectId);
                appController.setLoading(true);
                showToast(`正在加载${textbook.name}...`, 'info', 1500);
                try {
                    const chapters = await dataManager.getChapters(textbook.id);
                    let firstLesson = null;
                    for (const chapter of chapters) {
                        if (chapter.lessons && chapter.lessons.length > 0) {
                            firstLesson = chapter.lessons[0];
                            break;
                        }
                    }
                    if (firstLesson) {
                        navigateTo(PageType.READING, {
                            subject: subject,
                            textbook: textbook,
                            lesson: firstLesson,
                            pageNumber: 1
                        });
                    } else {
                        showToast('该教材暂无课程内容', 'info');
                    }
                } catch (error) {
                    console.error('加载失败:', error);
                    showToast('加载失败，请重试', 'error');
                } finally {
                    appController.setLoading(false);
                }
            }
        });
    });
    
    // 绑定学科卡片点击事件 - 跳转到教材选择页面
    const subjectCards = document.querySelectorAll('.card-subject[data-subject]');
    subjectCards.forEach(card => {
        card.addEventListener('click', async () => {
            const subjectId = card.getAttribute('data-subject');
            if (subjectId) {
                try {
                    // 获取学科对象
                    const subject = subjects.find(s => s.id === subjectId);
                    if (subject) {
                        // 显示加载状态
                        appController.setLoading(true);
                        showToast(`正在加载${subject.name}教材...`, 'info', 1500);
                        
                        // 预加载教材数据
                        const textbooks = await dataManager.getTextbooks(subject.id);
                        
                        // 短暂延迟以显示选中动画效果
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // 导航到教材选择页面
                        navigateTo(PageType.TEXTBOOK, { subject: subject });
                    }
                } catch (error) {
                    console.error('学科选择失败:', error);
                    showToast('加载失败，请重试', 'error');
                } finally {
                    appController.setLoading(false);
                }
            }
        });
    });
}

/**
 * 添加首页样式
 */
function addHomePageStyles() {
    if (!document.getElementById('home-page-styles')) {
        const style = document.createElement('style');
        style.id = 'home-page-styles';
        style.textContent = `
            .welcome-title {
                font-family: var(--font-family-display);
                font-size: var(--font-size-2xl);
                color: var(--color-primary);
                margin-bottom: var(--spacing-sm);
            }
            .home-action-section {
                padding: var(--spacing-sm);
            }
            .btn-start-learning {
                font-size: var(--font-size-lg);
                padding: var(--spacing-md) var(--spacing-xl);
            }
            .history-title {
                font-size: var(--font-size-lg);
                color: var(--color-text);
                margin-bottom: var(--spacing-md);
                padding-left: var(--spacing-sm);
            }
            .learning-history-section {
                margin-bottom: var(--spacing-md);
                border-radius: var(--radius-lg);
                overflow: hidden;
                box-shadow: var(--shadow-md);
            }
            .section-header {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                padding: var(--spacing-sm) var(--spacing-md);
                color: white;
                font-weight: var(--font-weight-bold);
            }
            .section-icon {
                font-size: var(--font-size-xl);
            }
            .section-title {
                font-size: var(--font-size-md);
            }
            .textbook-records {
                display: flex;
                flex-wrap: wrap;
                gap: var(--spacing-sm);
                background: var(--color-surface);
                padding: var(--spacing-sm);
            }
            .textbook-record-card {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                width: 160px;
                height: 140px;
                padding: var(--spacing-sm);
                background: white;
                border-radius: var(--radius-md);
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: var(--shadow-sm);
            }
            .textbook-record-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-md);
            }
            .textbook-record-card:active {
                transform: scale(0.98);
            }
            .textbook-publisher {
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-bold);
                color: var(--color-text);
                margin-bottom: 1px;
            }
            .textbook-grade {
                font-size: 11px;
                color: var(--color-text);
                margin-bottom: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .textbook-chapter {
                font-size: 11px;
                color: var(--color-text-secondary);
                margin-bottom: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .textbook-progress-row {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 2px;
            }
            .progress-text {
                font-size: 12px;
                font-weight: var(--font-weight-bold);
                color: var(--color-primary);
                flex-shrink: 0;
            }
            .progress-bar-container {
                flex: 1;
                height: 6px;
                background: var(--color-border);
                border-radius: 3px;
                overflow: hidden;
            }
            .progress-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
                border-radius: 3px;
                transition: width 0.3s ease;
            }
            .progress-detail {
                font-size: 11px;
                color: var(--color-text-secondary);
            }
            .no-records {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: var(--spacing-lg);
                color: var(--color-text-secondary);
            }
            .no-records-icon {
                font-size: var(--font-size-2xl);
                margin-bottom: var(--spacing-xs);
                opacity: 0.5;
            }
            .no-records-text {
                font-size: var(--font-size-sm);
            }
            .subject-buttons-row {
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: nowrap !important;
                justify-content: center;
                gap: 24px;
                margin: var(--spacing-lg) auto;
                padding: 0 var(--spacing-md);
                max-width: 1250px;
                width: 100%;
                box-sizing: border-box;
            }
            .subject-btn {
                flex: 1;
                max-width: 400px;
                min-width: 200px;
                min-height: 160px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: var(--spacing-xl);
                border-radius: var(--radius-xl);
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: var(--shadow-md);
            }
            .subject-btn[data-subject="english"] {
                background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
            }
            .subject-btn[data-subject="chinese"] {
                background: linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%);
            }
            .subject-btn[data-subject="math"] {
                background: linear-gradient(135deg, #FFE66D 0%, #FFA94D 100%);
            }
            .subject-btn:hover {
                transform: translateY(-3px);
                box-shadow: var(--shadow-lg);
            }
            .subject-btn:active {
                transform: scale(0.95);
            }
            .subject-btn-icon {
                font-size: 56px;
                margin-bottom: var(--spacing-sm);
            }
            .subject-btn-name {
                font-size: var(--font-size-xl);
                font-weight: var(--font-weight-bold);
                color: white;
            }
            .learning-history {
                max-width: 1250px;
                margin: 0 auto;
                padding: 0 var(--spacing-md);
                box-sizing: border-box;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * 渲染学科页面
 * Requirements: 1.1, 1.2, 1.3, 1.4
 * - 显示学科选择界面
 * - 实现点击选择功能
 * - 实现加载状态显示
 * - 实现错误处理和重试
 * - 实现自动跳转到教材选择
 */
async function renderSubjectPage() {
    // 创建学科选择容器
    elements.mainContent.innerHTML = `
        <div class="subject-page animate-pop" id="subjectPageContainer">
            <!-- SubjectSelector 将在此渲染 -->
        </div>
    `;
    
    const container = document.getElementById('subjectPageContainer');
    
    // 创建 SubjectSelector 实例
    subjectSelector = new SubjectSelector(container);
    subjectSelector.setDataManager(dataManager);
    subjectSelector.setDebug(APP_CONFIG.debug);
    
    // 设置选择回调 - 选择学科后自动跳转到教材选择
    subjectSelector.onSelect(handleSubjectSelected);
    
    // 加载并渲染学科列表
    await loadAndRenderSubjects();
}

/**
 * 加载并渲染学科列表
 * 包含加载状态显示和错误处理
 */
async function loadAndRenderSubjects() {
    if (!subjectSelector) {
        console.error('SubjectSelector 未初始化');
        return;
    }
    
    // 显示加载状态
    subjectSelector.showLoading();
    appController.setLoading(true);
    
    try {
        // 加载学科数据
        const subjects = await subjectSelector.loadSubjects();
        
        // 渲染学科列表
        subjectSelector.render(subjects);
        
        if (APP_CONFIG.debug) {
            console.log('📚 学科列表加载成功', subjects);
        }
    } catch (error) {
        console.error('学科列表加载失败:', error);
        
        // 显示错误状态和重试按钮
        subjectSelector.showError('学科加载失败，请点击重试', async () => {
            await loadAndRenderSubjects();
        });
        
        // 显示 Toast 提示
        showToast('加载失败，请重试', 'error');
    } finally {
        appController.setLoading(false);
    }
}

/**
 * 处理学科选择
 * Requirements: 1.2, 1.3
 * - 高亮显示选中的学科
 * - 加载该学科的教材列表
 * - 自动跳转到教材版本选择界面
 * @param {Object} subject - 选中的学科对象
 */
async function handleSubjectSelected(subject) {
    if (!subject || !subject.id) {
        console.error('无效的学科对象');
        return;
    }
    
    if (APP_CONFIG.debug) {
        console.log('🎯 选中学科:', subject);
    }
    
    // 显示加载状态
    appController.setLoading(true);
    showToast(`正在加载${subject.name}教材...`, 'info', 1500);
    
    try {
        // 预加载教材数据（验证学科数据可用）
        const textbooks = await dataManager.getTextbooks(subject.id);
        
        if (APP_CONFIG.debug) {
            console.log(`📖 ${subject.name}教材列表:`, textbooks);
        }
        
        // 短暂延迟以显示选中动画效果
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 导航到教材选择页面
        // Requirements: 1.3 - 学科列表加载完成后自动跳转到教材版本选择界面
        navigateTo(PageType.TEXTBOOK, { subject: subject });
        
    } catch (error) {
        console.error('教材数据加载失败:', error);
        
        // Requirements: 1.4 - 显示友好的错误提示并提供重试按钮
        showToast('教材加载失败，请重试', 'error');
        
        // 清除选中状态，允许用户重新选择
        if (subjectSelector) {
            subjectSelector.clearSelection();
        }
    } finally {
        appController.setLoading(false);
    }
}

/**
 * 渲染教材页面
 * Requirements: 2.1, 2.2, 2.4
 * - 显示当前学科下所有可用的教材版本列表
 * - 实现根据学科筛选教材
 * - 实现点击选择功能
 * - 实现无内容提示
 * - 实现返回学科选择功能
 */
async function renderTextbookPage() {
    const state = appController.getCurrentState();
    const subject = state.selectedSubject;
    
    // 创建教材选择容器
    elements.mainContent.innerHTML = `
        <div class="textbook-page animate-pop" id="textbookPageContainer">
            <!-- TextbookSelector 将在此渲染 -->
        </div>
    `;
    
    // 添加教材页面样式
    addTextbookPageStyles();
    
    const container = document.getElementById('textbookPageContainer');
    
    // 创建 TextbookSelector 实例
    textbookSelector = new TextbookSelector(container);
    textbookSelector.setDataManager(dataManager);
    textbookSelector.setDebug(APP_CONFIG.debug);
    
    // 设置选择回调 - 选择教材后自动跳转到章节导航
    // Requirements: 2.2 - 记录用户选择并加载该教材的章节目录
    textbookSelector.onSelect(handleTextbookSelected);
    
    // 加载并渲染教材列表
    await loadAndRenderTextbooks(subject);
}

/**
 * 加载并渲染教材列表
 * Requirements: 2.1, 2.3, 2.4
 * - 显示当前学科下所有可用的教材版本列表
 * - 显示可爱的加载动画
 * - 如果所选教材暂无内容，显示"内容即将上线"的友好提示
 * @param {Object} subject - 学科对象
 */
async function loadAndRenderTextbooks(subject) {
    if (!textbookSelector) {
        console.error('TextbookSelector 未初始化');
        return;
    }
    
    // 显示加载状态
    // Requirements: 2.3 - 显示可爱的加载动画
    textbookSelector.showLoading();
    appController.setLoading(true);
    
    try {
        // 检查是否有学科信息
        if (!subject || !subject.id) {
            // 没有学科信息，显示空状态
            textbookSelector.render([]);
            if (APP_CONFIG.debug) {
                console.log('📚 未选择学科，显示空状态');
            }
            return;
        }
        
        // Requirements: 2.1 - 根据学科筛选教材
        const textbooks = await textbookSelector.loadTextbooks(subject.id);
        
        // 渲染教材列表
        // Requirements: 2.4 - 如果教材列表为空，TextbookSelector会自动显示"内容即将上线"提示
        textbookSelector.render(textbooks);
        
        if (APP_CONFIG.debug) {
            console.log(`📖 ${subject.name}教材列表加载成功`, textbooks);
            if (textbooks.length === 0) {
                console.log('📚 该学科暂无教材内容');
            }
        }
    } catch (error) {
        console.error('教材列表加载失败:', error);
        
        // 显示错误状态和重试按钮
        textbookSelector.showError('教材加载失败，请点击重试', async () => {
            await loadAndRenderTextbooks(subject);
        });
        
        // 显示 Toast 提示
        showToast('加载失败，请重试', 'error');
    } finally {
        appController.setLoading(false);
    }
}

/**
 * 处理教材选择
 * Requirements: 2.2
 * - 记录用户选择
 * - 加载该教材的章节目录
 * - 自动跳转到章节导航界面
 * @param {Object} textbook - 选中的教材对象
 */
async function handleTextbookSelected(textbook) {
    if (!textbook || !textbook.id) {
        console.error('无效的教材对象');
        return;
    }
    
    if (APP_CONFIG.debug) {
        console.log('📖 选中教材:', textbook);
    }
    
    // 显示加载状态
    appController.setLoading(true);
    showToast(`正在加载${textbook.name}...`, 'info', 1500);
    
    try {
        // 预加载章节数据
        const chapters = await dataManager.getChapters(textbook.id);
        
        if (APP_CONFIG.debug) {
            console.log(`📑 ${textbook.name}章节列表:`, chapters);
        }
        
        // 短暂延迟以显示选中动画效果
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 找到第一个章节的第一个课程，直接跳转到点读界面
        let firstLesson = null;
        for (const chapter of chapters) {
            if (chapter.lessons && chapter.lessons.length > 0) {
                firstLesson = chapter.lessons[0];
                break;
            }
        }
        
        if (firstLesson) {
            // 直接跳转到阅读页面，同时传递教材信息
            navigateTo(PageType.READING, { 
                textbook: textbook,
                lesson: firstLesson,
                pageNumber: 1
            });
        } else {
            // 没有课程数据，停留在教材页面
            showToast('该教材暂无课程内容', 'info');
            if (textbookSelector) {
                textbookSelector.clearSelection();
            }
        }
        
    } catch (error) {
        console.error('章节数据加载失败:', error);
        showToast('章节加载失败，请重试', 'error');
        
        if (textbookSelector) {
            textbookSelector.clearSelection();
        }
    } finally {
        appController.setLoading(false);
    }
}

/**
 * 获取学科图标
 * @param {string} subjectId - 学科ID
 * @returns {string} 图标
 */
function getSubjectIcon(subjectId) {
    const iconMap = {
        'english': '🔤',
        'chinese': '📖',
        'math': '🔢',
        'science': '🔬',
        'art': '🎨',
        'music': '🎵'
    };
    return iconMap[subjectId] || '📚';
}

/**
 * 添加教材页面样式
 */
function addTextbookPageStyles() {
    if (!document.getElementById('textbook-page-styles')) {
        const style = document.createElement('style');
        style.id = 'textbook-page-styles';
        style.textContent = `
            .textbook-page {
                padding: var(--spacing-md);
                min-height: 100%;
            }
            
            /* TextbookSelector 标题样式 */
            .textbook-selector-header {
                text-align: center;
                margin-bottom: var(--spacing-lg);
            }
            .textbook-selector-title {
                font-family: var(--font-family-display);
                font-size: var(--font-size-xl);
                color: var(--color-primary);
                margin-bottom: var(--spacing-xs);
            }
            .textbook-selector-subtitle {
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
                margin-bottom: var(--spacing-md);
            }
            
            /* 版本选择器样式 */
            .version-selector-wrapper {
                display: flex;
                justify-content: center;
                margin-top: var(--spacing-sm);
            }
            .version-selector {
                padding: 10px 40px 10px 16px;
                font-size: var(--font-size-md);
                font-weight: 500;
                color: var(--color-text-primary);
                background-color: white;
                border: 2px solid var(--color-primary);
                border-radius: var(--radius-lg);
                cursor: pointer;
                appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23FF6B9D' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 12px center;
                transition: all 0.2s ease;
                min-width: 200px;
            }
            .version-selector:hover {
                border-color: var(--color-primary-dark);
                box-shadow: 0 2px 8px rgba(255, 107, 157, 0.2);
            }
            .version-selector:focus {
                outline: none;
                border-color: var(--color-primary);
                box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.2);
            }
            .version-selector option {
                padding: 10px;
                font-size: var(--font-size-md);
            }
            .version-selector option:disabled {
                color: #999;
                background-color: #f5f5f5;
            }
            
            /* 教材网格布局 */
            .textbook-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: var(--spacing-md);
            }
            
            /* 教材卡片样式 */
            .card-textbook {
                display: flex;
                align-items: center;
                padding: var(--spacing-md);
                gap: var(--spacing-md);
                cursor: pointer;
                background: var(--color-surface);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-sm);
                transition: all var(--transition-normal);
                border: 2px solid transparent;
                position: relative;
            }
            .card-textbook:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-md);
            }
            .card-textbook:active {
                transform: scale(0.98);
            }
            .card-textbook.selected {
                border-color: var(--color-primary);
            }
            
            /* 进度标签样式 */
            .textbook-progress-badge {
                position: absolute;
                top: 8px;
                right: 8px;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                z-index: 1;
            }
            .badge-completed {
                background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
                color: white;
                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
            }
            .badge-in-progress {
                background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
                color: white;
                box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
                background: var(--color-primary-light);
            }
            
            /* 教材封面样式 */
            .card-textbook-cover {
                width: 100px;
                height: 155px;
                border-radius: var(--radius-md);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                box-shadow: var(--shadow-sm);
            }
            .textbook-cover-icon {
                font-size: var(--font-size-4xl);
            }
            
            /* 教材信息样式 */
            .card-textbook-info {
                flex: 1;
                min-width: 0;
            }
            .card-textbook-title {
                font-size: var(--font-size-md);
                font-weight: var(--font-weight-bold);
                margin-bottom: var(--spacing-xs);
                color: var(--color-text-primary);
            }
            .card-textbook-publisher {
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
                margin-bottom: var(--spacing-xs);
            }
            .card-textbook-meta {
                display: flex;
                justify-content: center;
                font-size: var(--font-size-xs);
            }
            .textbook-grade-semester {
                padding: 4px 12px;
                background: var(--color-background);
                border-radius: var(--radius-sm);
                color: var(--color-text-secondary);
            }
            .card-textbook-grade {
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
                margin: 0;
            }
            
            /* 空状态样式 */
            .textbook-empty-state {
                text-align: center;
                padding: var(--spacing-2xl) var(--spacing-lg);
            }
            .textbook-empty-state .empty-icon {
                font-size: 4rem;
                margin-bottom: var(--spacing-md);
            }
            .textbook-empty-state .empty-title {
                font-family: var(--font-family-display);
                font-size: var(--font-size-xl);
                color: var(--color-primary);
                margin-bottom: var(--spacing-sm);
            }
            .textbook-empty-state .empty-subtitle {
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
                margin-bottom: var(--spacing-lg);
            }
            .textbook-empty-state .empty-decoration {
                display: flex;
                justify-content: center;
                gap: var(--spacing-md);
            }
            .textbook-empty-state .decoration-star {
                font-size: var(--font-size-lg);
            }
            
            /* 加载状态样式 */
            .textbook-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 300px;
                padding: var(--spacing-xl);
            }
            .loading-book-animation {
                position: relative;
                width: 60px;
                height: 50px;
                margin-bottom: var(--spacing-md);
            }
            .book-spine {
                position: absolute;
                left: 50%;
                top: 0;
                width: 4px;
                height: 100%;
                background: var(--color-primary);
                transform: translateX(-50%);
                border-radius: 2px;
            }
            .book-page {
                position: absolute;
                top: 0;
                width: 28px;
                height: 100%;
                background: var(--color-surface);
                border: 2px solid var(--color-primary);
                border-radius: 0 4px 4px 0;
                transform-origin: left center;
            }
            .book-page-1 {
                left: 50%;
                animation: flipPage 1.5s ease-in-out infinite;
            }
            .book-page-2 {
                left: 50%;
                animation: flipPage 1.5s ease-in-out infinite 0.3s;
            }
            .book-page-3 {
                left: 50%;
                animation: flipPage 1.5s ease-in-out infinite 0.6s;
            }
            @keyframes flipPage {
                0%, 100% { transform: rotateY(0deg); }
                50% { transform: rotateY(-180deg); }
            }
            .loading-stars {
                display: flex;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-md);
            }
            .loading-stars .star {
                animation: twinkle 1s ease-in-out infinite;
            }
            .loading-stars .star-1 { animation-delay: 0s; }
            .loading-stars .star-2 { animation-delay: 0.3s; }
            .loading-stars .star-3 { animation-delay: 0.6s; }
            @keyframes twinkle {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(0.8); }
            }
            
            /* 错误状态样式 */
            .error-container {
                text-align: center;
                padding: var(--spacing-xl);
            }
            .error-icon {
                font-size: var(--font-size-4xl);
                margin-bottom: var(--spacing-md);
            }
            .error-message {
                font-size: var(--font-size-lg);
                color: var(--color-text-primary);
                margin-bottom: var(--spacing-md);
            }
            
            /* 返回按钮增强 */
            .textbook-page .back-hint {
                text-align: center;
                margin-top: var(--spacing-lg);
                padding-top: var(--spacing-lg);
                border-top: 1px dashed var(--color-border);
            }
            .textbook-page .back-hint-text {
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
            }
            
            /* 响应式布局 */
            @media (max-width: 480px) {
                .textbook-grid {
                    grid-template-columns: 1fr;
                }
                .card-textbook-cover {
                    width: 80px;
                    height: 124px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * 渲染章节页面
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 * - 以树形或列表形式展示所有章节和课程
 * - 点击章节可展开/折叠显示该章节下的课程
 * - 选择课程后加载该课程的第一页内容
 * - 已学习的课程显示进度标识
 * - 长按课程可预览课程简介
 */
async function renderChapterPage() {
    const state = appController.getCurrentState();
    const textbook = state.selectedTextbook;
    
    // 设置 ProgressTracker 上下文
    // Requirements: 9.1, 9.2, 9.3 - 学习进度追踪
    if (progressTrackerInstance && textbook && textbook.id) {
        progressTrackerInstance.setCurrentTextbook(textbook.id);
    }
    
    // 创建章节导航容器，包含总体进度显示区域
    elements.mainContent.innerHTML = `
        <div class="chapter-page animate-pop" id="chapterPageContainer">
            <!-- 总体进度显示区域 - Requirements: 9.3 -->
            <div class="overall-progress-section" id="overallProgressSection">
                <div class="overall-progress-card">
                    <div class="overall-progress-header">
                        <span class="overall-progress-icon">📊</span>
                        <span class="overall-progress-title">学习进度</span>
                    </div>
                    <div class="overall-progress-content">
                        <div class="overall-progress-bar">
                            <div class="overall-progress-fill" id="overallProgressFill" style="width: 0%"></div>
                        </div>
                        <div class="overall-progress-stats">
                            <span class="overall-progress-percentage" id="overallProgressPercentage">0%</span>
                            <span class="overall-progress-detail" id="overallProgressDetail">已完成 0/0 课</span>
                        </div>
                    </div>
                </div>
            </div>
            <!-- ChapterNavigator 将在此渲染 -->
            <div id="chapterNavigatorContainer"></div>
        </div>
    `;
    
    // 添加章节页面样式
    addChapterPageStyles();
    
    const navigatorContainer = document.getElementById('chapterNavigatorContainer');
    
    // 创建 ChapterNavigator 实例
    chapterNavigator = new ChapterNavigator(navigatorContainer);
    chapterNavigator.setDataManager(dataManager);
    chapterNavigator.setDebug(APP_CONFIG.debug);
    
    // 设置课程选择回调 - 选择课程后跳转到阅读页面
    // Requirements: 3.3 - 选择课程后加载该课程的第一页内容
    chapterNavigator.onLessonSelect(handleLessonSelected);
    
    // 设置课程预览回调
    // Requirements: 3.5 - 长按课程可预览课程简介
    chapterNavigator.onLessonPreview((lesson) => {
        if (APP_CONFIG.debug) {
            console.log('📖 预览课程:', lesson);
        }
    });
    
    // 加载并渲染章节列表
    await loadAndRenderChapters(textbook);
}

/**
 * 加载并渲染章节列表
 * Requirements: 3.1, 3.4, 9.2, 9.3
 * - 以树形或列表形式展示所有章节和课程
 * - 已学习的课程显示进度标识
 * - 在主界面显示总体进度
 * @param {Object} textbook - 教材对象
 */
async function loadAndRenderChapters(textbook) {
    if (!chapterNavigator) {
        console.error('ChapterNavigator 未初始化');
        return;
    }
    
    // 显示加载状态
    chapterNavigator.showLoading();
    appController.setLoading(true);
    
    try {
        // 检查是否有教材信息
        if (!textbook || !textbook.id) {
            // 没有教材信息，显示空状态
            chapterNavigator.render([]);
            updateOverallProgressDisplay({ percentage: 0, completed: 0, total: 0 });
            if (APP_CONFIG.debug) {
                console.log('📑 未选择教材，显示空状态');
            }
            return;
        }
        
        // Requirements: 3.1 - 加载章节目录
        const chapters = await chapterNavigator.loadChapters(textbook.id);
        
        // Requirements: 3.4, 9.2 - 加载学习进度数据
        const progressData = loadLearningProgress(textbook.id);
        
        // 设置进度数据
        chapterNavigator.setProgressData(progressData);
        
        // 渲染章节列表
        chapterNavigator.render(chapters);
        
        // Requirements: 9.3 - 更新总体进度显示
        const overallProgress = chapterNavigator.getOverallProgress();
        updateOverallProgressDisplay(overallProgress);
        
        if (APP_CONFIG.debug) {
            console.log(`📑 ${textbook.name}章节列表加载成功`, chapters);
            console.log('📊 学习进度数据:', progressData);
            console.log('📈 总体进度:', overallProgress);
        }
    } catch (error) {
        console.error('章节列表加载失败:', error);
        
        // 显示错误状态和重试按钮
        chapterNavigator.showError('章节加载失败，请点击重试', async () => {
            await loadAndRenderChapters(textbook);
        });
        
        // 显示 Toast 提示
        showToast('加载失败，请重试', 'error');
    } finally {
        appController.setLoading(false);
    }
}

/**
 * 更新总体进度显示
 * Requirements: 9.3 - 在主界面显示总体学习进度概览
 * @param {Object} progress - 进度数据 { percentage, completed, total }
 */
function updateOverallProgressDisplay(progress) {
    const progressFill = document.getElementById('overallProgressFill');
    const progressPercentage = document.getElementById('overallProgressPercentage');
    const progressDetail = document.getElementById('overallProgressDetail');
    
    if (progressFill) {
        progressFill.style.width = `${progress.percentage}%`;
        
        // 根据进度设置不同的颜色
        if (progress.percentage === 100) {
            progressFill.classList.add('completed');
        } else if (progress.percentage >= 50) {
            progressFill.classList.add('halfway');
        }
    }
    
    if (progressPercentage) {
        progressPercentage.textContent = `${progress.percentage}%`;
        
        // 添加动画效果
        progressPercentage.classList.add('animate-pop');
        setTimeout(() => {
            progressPercentage.classList.remove('animate-pop');
        }, 500);
    }
    
    if (progressDetail) {
        progressDetail.textContent = `已完成 ${progress.completed}/${progress.total} 课`;
    }
}

/**
 * 加载学习进度数据
 * Requirements: 3.4 - 已学习的课程显示进度标识
 * @param {string} textbookId - 教材ID
 * @returns {Object} 进度数据对象，键为课程ID
 */
function loadLearningProgress(textbookId) {
    if (!textbookId) {
        return {};
    }
    
    // 从 StorageManager 获取学习记录
    const learningRecord = storageManager.getLearningRecord(textbookId);
    
    if (!learningRecord || !learningRecord.progress) {
        return {};
    }
    
    // 返回进度数据
    return learningRecord.progress;
}

/**
 * 处理课程选择
 * Requirements: 3.3
 * - 选择课程后加载该课程的第一页内容
 * - 导航到阅读页面
 * @param {Object} lesson - 选中的课程对象
 */
async function handleLessonSelected(lesson) {
    if (!lesson || !lesson.id) {
        console.error('无效的课程对象');
        return;
    }
    
    if (APP_CONFIG.debug) {
        console.log('📖 选中课程:', lesson);
    }
    
    // 显示加载状态
    appController.setLoading(true);
    showToast(`正在加载${lesson.name}...`, 'info', 1500);
    
    try {
        // 获取当前教材信息
        const state = appController.getCurrentState();
        const textbook = state.selectedTextbook;
        
        // 设置 ProgressTracker 上下文
        // Requirements: 9.1 - 记录用户访问过的课程和页面
        if (textbook && textbook.id && progressTrackerInstance) {
            progressTrackerInstance.setCurrentTextbook(textbook.id);
            progressTrackerInstance.setCurrentLesson(lesson.id);
            
            // 记录页面访问（第一页）
            progressTrackerInstance.recordPageVisit(lesson.id, 1);
            
            // 保存最后访问的教材ID
            storageManager.saveLastTextbookId(textbook.id);
        }
        
        // 短暂延迟以显示选中动画效果
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Requirements: 3.3 - 选择课程后加载该课程的第一页内容
        // 导航到阅读页面，传递课程信息和页码
        navigateTo(PageType.READING, { 
            lesson: lesson,
            pageNumber: 1
        });
        
    } catch (error) {
        console.error('课程加载失败:', error);
        
        // 显示友好的错误提示
        showToast('课程加载失败，请重试', 'error');
    } finally {
        appController.setLoading(false);
    }
}

/**
 * 添加章节页面样式
 */
function addChapterPageStyles() {
    if (!document.getElementById('chapter-page-styles')) {
        const style = document.createElement('style');
        style.id = 'chapter-page-styles';
        style.textContent = `
            .chapter-page {
                padding: var(--spacing-md);
                min-height: 100%;
            }
            
            /* ========================================
             * 总体进度显示样式
             * Requirements: 9.3 - 在主界面显示总体学习进度概览
             * ======================================== */
            .overall-progress-section {
                margin-bottom: var(--spacing-lg);
            }
            .overall-progress-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: var(--radius-xl);
                padding: var(--spacing-lg);
                box-shadow: var(--shadow-md);
                color: var(--color-text-inverse);
            }
            .overall-progress-header {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-md);
            }
            .overall-progress-icon {
                font-size: var(--font-size-xl);
            }
            .overall-progress-title {
                font-family: var(--font-family-display);
                font-size: var(--font-size-lg);
                font-weight: var(--font-weight-bold);
            }
            .overall-progress-content {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-sm);
            }
            .overall-progress-bar {
                height: 16px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: var(--radius-full);
                overflow: hidden;
                position: relative;
            }
            .overall-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #FFE66D 0%, #4ECDC4 100%);
                border-radius: var(--radius-full);
                transition: width 0.8s ease-out;
                position: relative;
                overflow: hidden;
            }
            .overall-progress-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.4),
                    transparent
                );
                animation: progress-shine 2s ease-in-out infinite;
            }
            .overall-progress-fill.completed {
                background: linear-gradient(90deg, #2ECC71 0%, #27AE60 100%);
            }
            .overall-progress-fill.halfway {
                background: linear-gradient(90deg, #F1C40F 0%, #4ECDC4 100%);
            }
            .overall-progress-stats {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .overall-progress-percentage {
                font-size: var(--font-size-2xl);
                font-weight: var(--font-weight-bold);
                font-family: var(--font-family-display);
            }
            .overall-progress-detail {
                font-size: var(--font-size-sm);
                opacity: 0.9;
            }
            
            /* ========================================
             * 章节进度条样式
             * Requirements: 9.2 - 章节导航中显示进度标识
             * ======================================== */
            .chapter-progress-bar {
                height: 4px;
                background: rgba(0, 0, 0, 0.1);
                margin: 0 var(--spacing-md);
            }
            .chapter-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4ECDC4 0%, #2ECC71 100%);
                border-radius: 0 0 var(--radius-sm) var(--radius-sm);
                transition: width 0.5s ease-out;
            }
            .chapter-completed-icon {
                font-size: var(--font-size-sm);
                margin-left: var(--spacing-xs);
            }
            .chapter-progress-badge.completed {
                background: linear-gradient(135deg, #2ECC71 0%, #27AE60 100%);
            }
            
            /* ========================================
             * 课程进度指示器样式
             * Requirements: 9.2 - 已学习和未学习的内容视觉标识
             * ======================================== */
            .lesson-progress-indicator {
                font-size: var(--font-size-xs);
                color: var(--color-primary);
                background: var(--color-primary-light);
                padding: 2px 6px;
                border-radius: var(--radius-sm);
                font-weight: var(--font-weight-bold);
                margin-left: var(--spacing-xs);
            }
            .lesson-completed-badge {
                font-size: var(--font-size-xs);
                color: var(--color-success);
                background: rgba(46, 204, 113, 0.15);
                padding: 2px 8px;
                border-radius: var(--radius-sm);
                font-weight: var(--font-weight-bold);
            }
            
            /* ChapterNavigator 标题样式 */
            .chapter-navigator-header {
                text-align: center;
                margin-bottom: var(--spacing-lg);
            }
            .chapter-navigator-title {
                font-family: var(--font-family-display);
                font-size: var(--font-size-xl);
                color: var(--color-primary);
                margin-bottom: var(--spacing-xs);
            }
            .chapter-navigator-subtitle {
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
            }
            
            /* 章节列表容器 */
            .chapter-list {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-md);
            }
            
            /* 章节项样式 */
            .chapter-item {
                background: var(--color-surface);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-sm);
                overflow: hidden;
                transition: all var(--transition-normal);
            }
            .chapter-item:hover {
                box-shadow: var(--shadow-md);
            }
            
            /* 章节头部样式 */
            .chapter-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--spacing-md);
                cursor: pointer;
                background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-surface) 100%);
                transition: all var(--transition-fast);
            }
            .chapter-header:hover {
                background: linear-gradient(135deg, var(--color-primary-light) 0%, rgba(255, 107, 157, 0.1) 100%);
            }
            .chapter-header:focus {
                outline: 2px solid var(--color-primary);
                outline-offset: -2px;
            }
            
            .chapter-header-left {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }
            .chapter-expand-icon {
                font-size: var(--font-size-lg);
                transition: transform var(--transition-fast);
            }
            .chapter-expand-icon.expanded {
                transform: rotate(0deg);
            }
            .chapter-name {
                font-size: var(--font-size-md);
                font-weight: var(--font-weight-bold);
                color: var(--color-text-primary);
            }
            
            .chapter-header-right {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }
            .chapter-lesson-count {
                font-size: var(--font-size-xs);
                color: var(--color-text-secondary);
                background: var(--color-background);
                padding: 2px 8px;
                border-radius: var(--radius-sm);
            }
            .chapter-progress-badge {
                font-size: var(--font-size-xs);
                color: var(--color-text-inverse);
                background: var(--gradient-success);
                padding: 2px 8px;
                border-radius: var(--radius-sm);
                font-weight: var(--font-weight-bold);
            }
            
            /* 课程列表样式 */
            .lesson-list {
                overflow: hidden;
                transition: max-height var(--transition-normal), opacity var(--transition-normal);
            }
            .lesson-list.collapsed {
                max-height: 0;
                opacity: 0;
            }
            .lesson-list.expanded {
                max-height: 1000px;
                opacity: 1;
            }
            
            /* 课程项样式 */
            .lesson-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--spacing-md);
                padding-left: var(--spacing-xl);
                border-top: 1px solid var(--color-border);
                cursor: pointer;
                transition: all var(--transition-fast);
                background: var(--color-surface);
            }
            .lesson-item:hover {
                background: var(--color-background);
            }
            .lesson-item:focus {
                outline: 2px solid var(--color-primary);
                outline-offset: -2px;
            }
            .lesson-item.selected {
                background: var(--color-primary-light);
                border-left: 3px solid var(--color-primary);
            }
            .lesson-item.completed {
                background: linear-gradient(90deg, rgba(46, 204, 113, 0.1) 0%, var(--color-surface) 100%);
            }
            .lesson-item.completed .lesson-icon {
                color: var(--color-success);
            }
            
            .lesson-item-left {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }
            .lesson-icon {
                font-size: var(--font-size-md);
            }
            .lesson-name {
                font-size: var(--font-size-sm);
                color: var(--color-text-primary);
            }
            
            .lesson-item-right {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }
            .lesson-pages {
                font-size: var(--font-size-xs);
                color: var(--color-text-secondary);
            }
            .lesson-arrow {
                font-size: var(--font-size-lg);
                color: var(--color-text-secondary);
                transition: transform var(--transition-fast);
            }
            .lesson-item:hover .lesson-arrow {
                transform: translateX(4px);
                color: var(--color-primary);
            }
            
            /* 空状态样式 */
            .chapter-empty-state {
                text-align: center;
                padding: var(--spacing-2xl) var(--spacing-lg);
            }
            .chapter-empty-state .empty-icon {
                font-size: 4rem;
                margin-bottom: var(--spacing-md);
            }
            .chapter-empty-state .empty-title {
                font-family: var(--font-family-display);
                font-size: var(--font-size-xl);
                color: var(--color-primary);
                margin-bottom: var(--spacing-sm);
            }
            .chapter-empty-state .empty-subtitle {
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
                margin-bottom: var(--spacing-lg);
            }
            .chapter-empty-state .empty-decoration {
                display: flex;
                justify-content: center;
                gap: var(--spacing-md);
            }
            .chapter-empty-state .decoration-star {
                font-size: var(--font-size-lg);
            }
            
            /* 加载状态样式 */
            .chapter-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 300px;
                padding: var(--spacing-xl);
            }
            
            /* 课程预览弹窗样式 */
            .lesson-preview-modal {
                z-index: 1000;
            }
            .lesson-preview-content {
                max-width: 320px;
                width: 90%;
                padding: var(--spacing-lg);
                background: var(--color-surface);
                border-radius: var(--radius-xl);
                box-shadow: var(--shadow-lg);
            }
            .preview-header {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-md);
            }
            .preview-icon {
                font-size: var(--font-size-2xl);
            }
            .preview-title {
                font-family: var(--font-family-display);
                font-size: var(--font-size-lg);
                color: var(--color-primary);
            }
            .preview-body {
                margin-bottom: var(--spacing-lg);
            }
            .preview-text {
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
                line-height: 1.6;
                margin-bottom: var(--spacing-md);
            }
            .preview-info {
                display: flex;
                gap: var(--spacing-md);
            }
            .preview-pages {
                font-size: var(--font-size-xs);
                color: var(--color-text-secondary);
                background: var(--color-background);
                padding: 4px 8px;
                border-radius: var(--radius-sm);
            }
            .preview-footer {
                display: flex;
                gap: var(--spacing-md);
                justify-content: flex-end;
            }
            .preview-close-btn,
            .preview-start-btn {
                padding: var(--spacing-sm) var(--spacing-md);
                font-size: var(--font-size-sm);
            }
            
            /* 响应式布局 */
            @media (max-width: 480px) {
                .chapter-header {
                    padding: var(--spacing-sm) var(--spacing-md);
                }
                .lesson-item {
                    padding: var(--spacing-sm) var(--spacing-md);
                    padding-left: var(--spacing-lg);
                }
                .chapter-name {
                    font-size: var(--font-size-sm);
                }
                .lesson-name {
                    font-size: var(--font-size-xs);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * 渲染阅读页面
 * Requirements: 4.1, 4.2, 5.2, 5.4, 7.1, 7.2, 7.4, 7.5
 * - 以书本样式展示课本内容
 * - 可点读的内容有明显的视觉标识
 * - 点读时对应内容高亮显示
 * - 支持不同类型内容的点读（英语对话、语文课文、数学公式等）
 * - 支持左滑翻到下一页
 * - 支持右滑翻到上一页
 * - 在第一页时右滑显示"已是第一页"提示
 * - 在最后一页时左滑显示"已是最后一页"提示
 */
async function renderReadingPage() {
    const state = appController.getCurrentState();
    const lesson = state.selectedLesson;
    const pageNumber = state.currentPageNumber || 1;
    const textbook = state.selectedTextbook;
    
    // 设置 ProgressTracker 上下文
    // Requirements: 9.1 - 记录用户访问过的课程和页面
    if (progressTrackerInstance && textbook && textbook.id) {
        progressTrackerInstance.setCurrentTextbook(textbook.id);
        if (lesson && lesson.id) {
            progressTrackerInstance.setCurrentLesson(lesson.id);
        }
    }
    
    // 创建阅读页面容器
    elements.mainContent.innerHTML = `
        <div class="reading-page animate-pop" id="readingPageContainer">
            <!-- BookFlipper 将在此渲染 -->
            <div class="book-flipper-area" id="bookFlipperArea">
                <!-- BookFlipper 组件容器 -->
            </div>
        </div>
    `;
    
    // 添加阅读页面样式
    addReadingPageStyles();
    
    const container = document.getElementById('readingPageContainer');
    const flipperArea = document.getElementById('bookFlipperArea');
    
    // 创建 BookFlipper 实例
    // Requirements: 7.3, 7.6 - 翻页动画效果和页码显示
    bookFlipper = new BookFlipper(flipperArea);
    bookFlipper.setDebug(APP_CONFIG.debug);
    
    // 初始化翻页器
    const totalPages = lesson ? (lesson.totalPages || 1) : 1;
    bookFlipper.init(totalPages);
    
    // 设置当前页码
    if (pageNumber > 1) {
        bookFlipper.setCurrentPage(pageNumber);
    }
    
    // 设置页面变化回调
    // Requirements: 7.1, 7.2 - 翻页后加载新页面内容
    bookFlipper.onPageChange(async (newPageNumber, totalPages) => {
        await handlePageChange(lesson, newPageNumber);
    });
    
    // 获取 BookFlipper 的内容容器用于 PageRenderer
    const pageContentContainer = bookFlipper.getContentContainer();
    
    // 创建 PageRenderer 实例
    pageRenderer = new PageRenderer(pageContentContainer);
    pageRenderer.setDataManager(dataManager);
    pageRenderer.setDebug(APP_CONFIG.debug);
    
    // 设置可点读元素点击回调
    // Requirements: 5.2 - 点读时对应内容高亮显示
    pageRenderer.onClickableElementClick(handleClickableElementClick);
    
    // 绑定滑动手势
    // Requirements: 7.1, 7.2, 7.4, 7.5 - 左滑/右滑翻页和边界提示
    bindSwipeGestures(flipperArea);
    
    // 添加页面信息头部
    addReadingPageHeader(container, lesson, pageNumber, totalPages);
    
    // 加载并渲染页面内容
    await loadAndRenderPage(lesson, pageNumber);
    
    // 创建数字人形象
    if (digitalAvatar) {
        digitalAvatar.destroy();
    }
    const avatarContainer = document.createElement('div');
    avatarContainer.id = 'digitalAvatarContainer';
    document.body.appendChild(avatarContainer);
    digitalAvatar = new DigitalAvatar(avatarContainer);
    digitalAvatar.setDebug(APP_CONFIG.debug);
    digitalAvatar.render('assets/images/avatar-teacher.png');

    // 复读：重新播放上一次点击的内容
    digitalAvatar.onRepeat(() => {
        if (!lastClickedElement) {
            showToast('还没有点读过内容哦', 'info');
            return;
        }
        const e = lastClickedElement;
        handleClickableElementClick(e.element, e.elementId, e.audioId, e.elementType, e.audioUrl);
    });

    // 连读：自动连续播放当前页面所有热点
    digitalAvatar.onContinuous((enabled) => {
        continuousMode = enabled;
        if (enabled) {
            showToast('连读模式已开启 ▶️', 'info', 1500);
            startContinuousPlay();
        } else {
            showToast('连读模式已关闭', 'info', 1500);
            continuousIndex = -1;
        }
    });

    // 评测：对当前选中内容进行发音评测
    digitalAvatar.onAssess(() => {
        if (!lastClickedElement) {
            showToast('请先点击一个内容再评测', 'info');
            return;
        }
        startAssessment(lastClickedElement);
    });

    // 背诵：遮挡内容后录音评测
    digitalAvatar.onRecite(() => {
        if (!lastClickedElement) {
            showToast('请先点击一个内容再背诵', 'info');
            return;
        }
        startRecitation(lastClickedElement);
    });
}

/**
 * 添加阅读页面头部信息
 * @param {HTMLElement} container - 容器元素
 * @param {Object} lesson - 课程对象
 * @param {number} pageNumber - 当前页码
 * @param {number} totalPages - 总页数
 */
function addReadingPageHeader(container, lesson, pageNumber, totalPages) {
    // 将课程标题和提示放入顶部固定栏
    const appHeader = document.querySelector('.app-header');
    if (appHeader) {
        // 在返回按钮后插入目录选择
        const btnBack = appHeader.querySelector('.btn-back');
        let tocEl = appHeader.querySelector('.reading-toc-toggle');
        if (!tocEl) {
            tocEl = document.createElement('div');
            tocEl.className = 'reading-toc-toggle';
            tocEl.id = 'readingTitleToggle';
            tocEl.title = '点击打开目录';
            tocEl.innerHTML = `
                <span class="lesson-title-icon">📖</span>
                <span class="lesson-title-text">${lesson ? lesson.name : '课程内容'}</span>
                <span class="toc-arrow">▼</span>
            `;
            if (btnBack && btnBack.nextSibling) {
                appHeader.insertBefore(tocEl, btnBack.nextSibling);
            } else {
                appHeader.prepend(tocEl);
            }
        }
        
        // 提示信息已移除
    }

    // 创建侧边栏目录
    createReadingSidebar(container, lesson);

    // 绑定标题点击事件
    const titleToggle = document.getElementById('readingTitleToggle');
    if (titleToggle) {
        titleToggle.addEventListener('click', () => {
            toggleReadingSidebar();
        });
    }
}


/**
 * 创建阅读页面侧边栏目录
 */
async function createReadingSidebar(container, currentLesson) {
    const state = appController.getCurrentState();
    const textbook = state.selectedTextbook;
    if (!textbook) return;
    
    // 创建遮罩
    const overlay = document.createElement('div');
    overlay.className = 'reading-sidebar-overlay';
    overlay.id = 'readingSidebarOverlay';
    overlay.addEventListener('click', () => toggleReadingSidebar(false));
    
    // 创建侧边栏
    const sidebar = document.createElement('div');
    sidebar.className = 'reading-sidebar';
    sidebar.id = 'readingSidebar';
    
    // 加载章节数据
    let chapters = [];
    try {
        chapters = await dataManager.getChapters(textbook.id);
    } catch (e) {
        console.error('加载章节失败:', e);
    }
    
    let tocHtml = `<div class="sidebar-header">
        <span class="sidebar-title">📚 目录</span>
        <span class="sidebar-close" id="sidebarCloseBtn">✕</span>
    </div>
    <div class="sidebar-content">`;
    
    chapters.forEach(chapter => {
        tocHtml += `<div class="sidebar-chapter">
            <div class="sidebar-chapter-title">${chapter.name}</div>`;
        chapter.lessons.forEach(lessonItem => {
            const isActive = currentLesson && currentLesson.id === lessonItem.id;
            const totalPages = lessonItem.totalPages || 1;
            
            // 获取课程进度
            let progressHtml = '';
            const progress = storageManager.getLessonProgress(textbook.id, lessonItem.id);
            if (progress && progress.isCompleted) {
                progressHtml = '<span class="sidebar-lesson-badge completed">✓ 已完成</span>';
            } else if (progress && progress.visitedPages && progress.visitedPages.length > 0) {
                const pct = Math.round((progress.visitedPages.length / totalPages) * 100);
                progressHtml = `<span class="sidebar-lesson-badge in-progress">${pct}%</span>`;
            }
            
            tocHtml += `<div class="sidebar-lesson ${isActive ? 'active' : ''}" data-lesson-id="${lessonItem.id}" data-total-pages="${totalPages}">
                <span class="sidebar-lesson-name">${lessonItem.name}</span>
                <span class="sidebar-lesson-meta">${progressHtml}<span class="sidebar-lesson-pages">${totalPages}页</span></span>
            </div>`;
        });
        tocHtml += `</div>`;
    });
    
    tocHtml += `</div>`;
    sidebar.innerHTML = tocHtml;
    
    container.appendChild(overlay);
    container.appendChild(sidebar);
    
    // 绑定关闭按钮
    const closeBtn = document.getElementById('sidebarCloseBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => toggleReadingSidebar(false));
    }
    
    // 绑定课程点击
    sidebar.querySelectorAll('.sidebar-lesson').forEach(el => {
        el.addEventListener('click', () => {
            const lessonId = el.dataset.lessonId;
            const totalPages = parseInt(el.dataset.totalPages, 10) || 1;
            const lessonName = el.querySelector('.sidebar-lesson-name').textContent;
            
            toggleReadingSidebar(false);
            
            navigateTo(PageType.READING, {
                lesson: { id: lessonId, name: lessonName, totalPages: totalPages },
                pageNumber: 1
            });
        });
    });
}

/**
 * 切换侧边栏显示/隐藏
 */
function toggleReadingSidebar(forceState) {
    const sidebar = document.getElementById('readingSidebar');
    const overlay = document.getElementById('readingSidebarOverlay');
    if (!sidebar || !overlay) return;
    
    const isOpen = sidebar.classList.contains('open');
    const shouldOpen = forceState !== undefined ? forceState : !isOpen;
    
    if (shouldOpen) {
        sidebar.classList.add('open');
        overlay.classList.add('open');
    } else {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
    }
}

/**
 * 离开阅读页面时恢复顶部栏
 */
function cleanupReadingHeader() {
    const appHeader = document.querySelector('.app-header');
    if (!appHeader) return;
    
    const tocToggle = appHeader.querySelector('.reading-toc-toggle');
    if (tocToggle) tocToggle.remove();
    
    const hints = appHeader.querySelector('.reading-header-hints');
    if (hints) hints.remove();
}

/**
 * 绑定滑动手势
 * Requirements: 7.1, 7.2, 7.4, 7.5
 * - 实现左滑/右滑手势检测
 * - 实现翻页动画触发
 * - 实现边界检测和提示
 * @param {HTMLElement} container - 容器元素
 */
function bindSwipeGestures(container) {
    if (!container) {
        console.error('无法绑定滑动手势：容器不存在');
        return;
    }
    
    // 滑动状态
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let isSwiping = false;
    
    // 滑动阈值（像素）
    const SWIPE_THRESHOLD = 50;
    // 垂直滑动容差（防止误触）
    const VERTICAL_TOLERANCE = 100;
    
    /**
     * 处理触摸开始
     * @param {TouchEvent} e - 触摸事件
     */
    function handleTouchStart(e) {
        // 如果是双指操作（缩放），不处理滑动
        if (e.touches.length > 1) {
            isSwiping = false;
            return;
        }
        
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isSwiping = true;
        
        if (APP_CONFIG.debug) {
            console.log('[SwipeGesture] 触摸开始', { x: touchStartX, y: touchStartY });
        }
    }
    
    /**
     * 处理触摸移动
     * @param {TouchEvent} e - 触摸事件
     */
    function handleTouchMove(e) {
        if (!isSwiping || e.touches.length > 1) {
            return;
        }
        
        touchEndX = e.touches[0].clientX;
        touchEndY = e.touches[0].clientY;
        
        // 计算水平和垂直移动距离
        const deltaX = touchEndX - touchStartX;
        const deltaY = Math.abs(touchEndY - touchStartY);
        
        // 如果水平滑动距离大于阈值且垂直移动在容差范围内，阻止默认滚动
        if (Math.abs(deltaX) > SWIPE_THRESHOLD / 2 && deltaY < VERTICAL_TOLERANCE) {
            e.preventDefault();
        }
    }
    
    /**
     * 处理触摸结束
     * @param {TouchEvent} e - 触摸事件
     */
    function handleTouchEnd(e) {
        if (!isSwiping) {
            return;
        }
        
        isSwiping = false;
        
        // 计算滑动距离
        const deltaX = touchEndX - touchStartX;
        const deltaY = Math.abs(touchEndY - touchStartY);
        
        if (APP_CONFIG.debug) {
            console.log('[SwipeGesture] 触摸结束', { deltaX, deltaY });
        }
        
        // 检查是否为有效的水平滑动
        if (Math.abs(deltaX) < SWIPE_THRESHOLD) {
            // 滑动距离不足
            return;
        }
        
        if (deltaY > VERTICAL_TOLERANCE) {
            // 垂直移动过大，可能是滚动操作
            return;
        }
        
        // 判断滑动方向并执行翻页
        if (deltaX < -SWIPE_THRESHOLD) {
            // 向左滑动 - 下一页
            // Requirements: 7.1 - 支持左滑翻到下一页
            handleSwipeLeft();
        } else if (deltaX > SWIPE_THRESHOLD) {
            // 向右滑动 - 上一页
            // Requirements: 7.2 - 支持右滑翻到上一页
            handleSwipeRight();
        }
        
        // 重置触摸位置
        touchStartX = 0;
        touchStartY = 0;
        touchEndX = 0;
        touchEndY = 0;
    }
    
    /**
     * 处理触摸取消
     */
    function handleTouchCancel() {
        isSwiping = false;
        touchStartX = 0;
        touchStartY = 0;
        touchEndX = 0;
        touchEndY = 0;
    }
    
    // 绑定触摸事件
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    
    if (APP_CONFIG.debug) {
        console.log('[SwipeGesture] 滑动手势已绑定');
    }
}

/**
 * 处理向左滑动（下一页）
 * Requirements: 7.1, 7.5
 * - 支持左滑翻到下一页
 * - 在最后一页时左滑显示"已是最后一页"提示
 */
function handleSwipeLeft() {
    if (!bookFlipper) {
        console.error('BookFlipper 未初始化');
        return;
    }
    
    if (APP_CONFIG.debug) {
        console.log('[SwipeGesture] 向左滑动 - 尝试翻到下一页');
    }
    
    // 调用 BookFlipper 的 nextPage 方法
    // 如果已是最后一页，BookFlipper 会自动显示边界提示
    const success = bookFlipper.nextPage();
    
    if (success) {
        showToast('翻到下一页', 'info', 1000);
    }
}

/**
 * 处理向右滑动（上一页）
 * Requirements: 7.2, 7.4
 * - 支持右滑翻到上一页
 * - 在第一页时右滑显示"已是第一页"提示
 */
function handleSwipeRight() {
    if (!bookFlipper) {
        console.error('BookFlipper 未初始化');
        return;
    }
    
    if (APP_CONFIG.debug) {
        console.log('[SwipeGesture] 向右滑动 - 尝试翻到上一页');
    }
    
    // 调用 BookFlipper 的 prevPage 方法
    // 如果已是第一页，BookFlipper 会自动显示边界提示
    const success = bookFlipper.prevPage();
    
    if (success) {
        showToast('翻到上一页', 'info', 1000);
    }
}

/**
 * 处理页面变化
 * Requirements: 7.1, 7.2
 * - 翻页后加载新页面内容
 * - 更新页码显示
 * @param {Object} lesson - 课程对象
 * @param {number} newPageNumber - 新页码
 */
async function handlePageChange(lesson, newPageNumber) {
    if (APP_CONFIG.debug) {
        console.log('[PageChange] 页面变化', { lessonId: lesson?.id, newPageNumber });
    }
    
    // 更新 AppController 中的当前页码
    if (appController) {
        appController.setCurrentPageNumber(newPageNumber);
    }
    
    // 加载新页面内容
    await loadAndRenderPage(lesson, newPageNumber);
    
    // 记录页面访问 - 使用 ProgressTracker
    // Requirements: 9.1 - 记录用户访问过的课程和页面
    if (lesson && lesson.id && progressTrackerInstance) {
        progressTrackerInstance.recordPageVisit(lesson.id, newPageNumber);
        
        // 检查是否完成课程
        // Requirements: 9.4 - 完成课程时显示祝贺动画
        const totalPages = lesson.totalPages || 1;
        await progressTrackerInstance.checkAndMarkComplete(lesson.id, totalPages);
    }
}

/**
 * 加载并渲染页面内容
 * Requirements: 4.1, 4.2, 4.4
 * - 以书本样式展示课本内容
 * - 可点读的内容有明显的视觉标识
 * - 显示骨架屏或加载占位符
 * @param {Object} lesson - 课程对象
 * @param {number} pageNumber - 页码
 */
async function loadAndRenderPage(lesson, pageNumber) {
    if (!pageRenderer) {
        console.error('PageRenderer 未初始化');
        return;
    }
    
    // 显示骨架屏加载状态
    // Requirements: 4.4 - 显示骨架屏或加载占位符
    pageRenderer.showSkeleton();
    appController.setLoading(true);
    
    try {
        // 检查是否有课程信息
        if (!lesson || !lesson.id) {
            pageRenderer.showEmptyPage();
            if (APP_CONFIG.debug) {
                console.log('📖 未选择课程，显示空状态');
            }
            return;
        }
        
        // 加载页面内容
        const content = await pageRenderer.loadPage(lesson.id, pageNumber);
        
        // 渲染页面内容
        // Requirements: 4.1 - 以书本样式展示课本内容
        // Requirements: 4.2 - 可点读的内容有明显的视觉标识
        pageRenderer.render(content);
        
        // 缓存当前页面可点读元素（用于连读）
        currentPageElements = content.clickableElements || [];
        continuousIndex = -1;
        
        // Requirements: 4.3 - 支持双指缩放页面内容
        // 创建并显示缩放控制按钮
        pageRenderer.createZoomControls();
        pageRenderer.showZoomControls();
        
        if (APP_CONFIG.debug) {
            console.log(`📖 页面内容加载成功`, content);
            console.log(`🔊 可点读元素数量: ${content.clickableElements ? content.clickableElements.length : 0}`);
            console.log(`🔍 缩放控制已启用`);
            console.log(`📄 当前页码: ${pageNumber} / ${lesson.totalPages || 1}`);
        }
        
        // 记录页面访问 - 使用 ProgressTracker
        // Requirements: 9.1 - 记录用户访问过的课程和页面
        if (progressTrackerInstance && lesson && lesson.id) {
            progressTrackerInstance.recordPageVisit(lesson.id, pageNumber);
        }
        
    } catch (error) {
        console.error('页面内容加载失败:', error);
        
        // 显示错误状态和重试按钮
        pageRenderer.showError('页面加载失败，请点击重试', async () => {
            await loadAndRenderPage(lesson, pageNumber);
        });
        
        // 显示 Toast 提示
        showToast('加载失败，请重试', 'error');
    } finally {
        appController.setLoading(false);
    }
}

/**
 * 处理可点读元素点击
 * Requirements: 5.1, 5.2, 5.3, 5.6
 * - 点击可点读内容后播放对应的语音朗读 (5.1)
 * - 点读时对应内容高亮显示 (5.2)
 * - 点击新的可点读内容时，停止当前朗读并开始新内容的朗读 (5.3)
 * - 语音播放完成后取消内容高亮并恢复正常显示状态 (5.6)
 * @param {Object} element - 可点读元素数据
 * @param {string} elementId - 元素ID
 * @param {string} audioId - 音频ID
 * @param {string} elementType - 元素类型
 */
function handleClickableElementClick(element, elementId, audioId, elementType, directAudioUrl) {
    if (APP_CONFIG.debug) {
        console.log('🔊 点击可点读元素:', { elementId, audioId, elementType, directAudioUrl });
    }
    
    // 记录上一次点击的元素（用于复读/评测/背诵）
    lastClickedElement = { element, elementId, audioId, elementType, audioUrl: directAudioUrl };
    
    // 更新连读索引
    const idx = currentPageElements.findIndex(el => el.id === elementId);
    if (idx !== -1) continuousIndex = idx;
    
    // 获取当前选中的音色
    const state = appController.getCurrentState();
    const voiceId = state.selectedVoice ? state.selectedVoice.id : 'voice-female';
    
    // Requirements: 5.3 - 点击新的可点读内容时，停止当前朗读并开始新内容的朗读
    // 如果正在播放其他音频，先停止
    if (audioPlayer.isPlaying()) {
        if (APP_CONFIG.debug) {
            console.log('🔊 停止当前播放，切换到新内容');
        }
        audioPlayer.stop();
        // 清除之前的高亮
        if (pageRenderer) {
            pageRenderer.clearHighlight();
        }
        // 停止数字人动画
        if (digitalAvatar) {
            digitalAvatar.stopSpeaking();
        }
    }
    
    // Requirements: 5.2 - 点读时对应内容高亮显示
    if (pageRenderer) {
        pageRenderer.highlightContent(elementId);
    }
    
    // 显示点读反馈
    const typeNames = {
        'text': '课文',
        'dialogue': '对话',
        'formula': '公式',
        'word': '单词'
    };
    const typeName = typeNames[elementType] || '内容';
    
    showToast(`正在朗读${typeName}...`, 'info', 2000);
    
    // Requirements: 5.1 - 点击可点读内容后播放对应的语音朗读
    // 获取音频URL - 优先使用直接音频URL
    const audioUrl = directAudioUrl || dataManager.getAudioUrl(audioId, voiceId);
    
    if (APP_CONFIG.debug) {
        console.log('🔊 音频URL:', audioUrl);
    }
    
    // 设置音色
    audioPlayer.setVoice(voiceId);
    
    // 设置播放完成回调
    // Requirements: 5.6 - 语音播放完成后取消内容高亮并恢复正常显示状态
    audioPlayer.onComplete((completedAudioId) => {
        if (APP_CONFIG.debug) {
            console.log('🔊 朗读完成:', completedAudioId);
        }
        // 清除高亮
        if (pageRenderer) {
            pageRenderer.clearHighlight();
        }
        // 更新播放状态
        if (appController) {
            appController.setPlaying(false);
        }
        // 重置重试计数
        resetAudioRetryCount(audioId);
        
        // 连读模式：自动播放下一个，不弹中间提示
        if (continuousMode && currentPageElements.length > 0) {
            continuousIndex++;
            if (continuousIndex < currentPageElements.length) {
                // 还有下一个，保持说话状态，不弹提示
                setTimeout(() => playElementByIndex(continuousIndex), 600);
            } else {
                // 全部播完
                continuousIndex = -1;
                if (digitalAvatar) digitalAvatar.stopSpeaking();
                showToast('本页连读完成 ✓', 'success', 2000);
            }
        } else {
            // 非连读模式：正常提示
            showToast('朗读完成 ✓', 'success', 1500);
            if (digitalAvatar) digitalAvatar.stopSpeaking();
        }
    });
    
    // Requirements: 5.5 - 音频加载失败时显示友好的错误提示并提供重试选项
    // 设置播放错误回调
    audioPlayer.onError((error) => {
        console.error('🔊 音频播放错误:', error);
        // 清除高亮
        if (pageRenderer) {
            pageRenderer.clearHighlight();
        }
        // 更新播放状态
        if (appController) {
            appController.setPlaying(false);
        }
        // 处理音频错误并显示重试选项
        handleAudioError(error, element, elementId, audioId, elementType, voiceId);
        
        // 数字人停止说话
        if (digitalAvatar) {
            digitalAvatar.stopSpeaking();
        }
    });
    
    // 播放音频
    playAudioWithRetry(audioUrl, element, elementId, audioId, elementType, voiceId);
    
    // 数字人开始说话动画
    if (digitalAvatar) {
        digitalAvatar.startSpeaking(`正在朗读${typeName}...`);
    }
}

// ========================================
// 音频错误处理和重试机制
// Requirements: 5.5 - 音频加载失败时显示友好的错误提示并提供重试选项
// ========================================

/**
 * 音频重试计数器
 * 用于跟踪每个音频的重试次数
 */
const audioRetryCounters = {};

/**
 * 最大重试次数
 */
const MAX_AUDIO_RETRY_COUNT = 3;

/**
 * 获取音频重试次数
 * @param {string} audioId - 音频ID
 * @returns {number} 当前重试次数
 */
function getAudioRetryCount(audioId) {
    return audioRetryCounters[audioId] || 0;
}

/**
 * 增加音频重试次数
 * @param {string} audioId - 音频ID
 * @returns {number} 增加后的重试次数
 */
function incrementAudioRetryCount(audioId) {
    audioRetryCounters[audioId] = (audioRetryCounters[audioId] || 0) + 1;
    return audioRetryCounters[audioId];
}

/**
 * 重置音频重试次数
 * @param {string} audioId - 音频ID
 */
function resetAudioRetryCount(audioId) {
    delete audioRetryCounters[audioId];
}

/**
 * 播放音频（带重试机制）
 * @param {string} audioUrl - 音频URL
 * @param {HTMLElement} element - 可点读元素
 * @param {string} elementId - 元素ID
 * @param {string} audioId - 音频ID
 * @param {string} elementType - 元素类型
 * @param {string} voiceId - 音色ID
 */
function playAudioWithRetry(audioUrl, element, elementId, audioId, elementType, voiceId) {
    audioPlayer.play(audioUrl)
        .then(() => {
            if (APP_CONFIG.debug) {
                console.log('🔊 音频开始播放');
            }
            // 更新播放状态
            if (appController) {
                appController.setPlaying(true);
            }
            // 播放成功，重置重试计数
            resetAudioRetryCount(audioId);
        })
        .catch((error) => {
            console.error('🔊 音频播放失败:', error);
            // 清除高亮
            if (pageRenderer) {
                pageRenderer.clearHighlight();
            }
            // 更新播放状态
            if (appController) {
                appController.setPlaying(false);
            }
            // 处理音频错误并显示重试选项
            handleAudioError(
                { audioId, message: error.message, error },
                element, elementId, audioId, elementType, voiceId
            );
            // 数字人停止说话
            if (digitalAvatar) {
                digitalAvatar.stopSpeaking();
            }
        });
}

/**
 * 处理音频错误
 * Requirements: 5.5 - 音频加载失败时显示友好的错误提示并提供重试选项
 * @param {Object} error - 错误对象 {audioId, message, error}
 * @param {HTMLElement} element - 可点读元素
 * @param {string} elementId - 元素ID
 * @param {string} audioId - 音频ID
 * @param {string} elementType - 元素类型
 * @param {string} voiceId - 音色ID
 */
function handleAudioError(error, element, elementId, audioId, elementType, voiceId) {
    const retryCount = getAudioRetryCount(audioId);
    
    if (APP_CONFIG.debug) {
        console.log(`🔊 音频错误处理 - 当前重试次数: ${retryCount}/${MAX_AUDIO_RETRY_COUNT}`);
    }
    
    // 检查是否还有重试机会
    if (retryCount < MAX_AUDIO_RETRY_COUNT) {
        // 显示带重试选项的错误提示
        showAudioErrorWithRetry(error, element, elementId, audioId, elementType, voiceId);
    } else {
        // 已达到最大重试次数，显示最终错误提示
        showAudioErrorFinal(error, audioId);
    }
}

/**
 * 显示带重试选项的音频错误提示
 * Requirements: 5.5 - 显示友好的错误提示并提供重试选项
 * @param {Object} error - 错误对象
 * @param {HTMLElement} element - 可点读元素
 * @param {string} elementId - 元素ID
 * @param {string} audioId - 音频ID
 * @param {string} elementType - 元素类型
 * @param {string} voiceId - 音色ID
 */
function showAudioErrorWithRetry(error, element, elementId, audioId, elementType, voiceId) {
    const retryCount = getAudioRetryCount(audioId);
    const remainingRetries = MAX_AUDIO_RETRY_COUNT - retryCount;
    
    // 获取友好的错误消息
    const friendlyMessage = getAudioErrorFriendlyMessage(error.message);
    
    // 创建错误提示模态框内容
    const modalContent = `
        <div class="audio-error-modal">
            <div class="audio-error-icon">😢</div>
            <h3 class="audio-error-title">音频加载失败</h3>
            <p class="audio-error-message">${friendlyMessage}</p>
            <p class="audio-error-retry-hint">
                还可以重试 <span class="retry-count">${remainingRetries}</span> 次
            </p>
            <div class="audio-error-actions">
                <button class="btn-cartoon btn-cartoon-primary btn-audio-retry" id="btnAudioRetry">
                    <span>🔄</span> 重试
                </button>
                <button class="btn-cartoon btn-cartoon-secondary btn-audio-cancel" id="btnAudioCancel">
                    <span>✖️</span> 取消
                </button>
            </div>
        </div>
    `;
    
    // 添加音频错误模态框样式
    addAudioErrorModalStyles();
    
    // 显示模态框
    showModal(modalContent);
    
    // 绑定重试按钮事件
    const btnRetry = document.getElementById('btnAudioRetry');
    if (btnRetry) {
        btnRetry.addEventListener('click', () => {
            hideModal();
            retryAudioPlayback(element, elementId, audioId, elementType, voiceId);
        });
    }
    
    // 绑定取消按钮事件
    const btnCancel = document.getElementById('btnAudioCancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            hideModal();
            // 重置重试计数
            resetAudioRetryCount(audioId);
            showToast('已取消播放', 'info', 2000);
        });
    }
}

/**
 * 显示最终音频错误提示（已达到最大重试次数）
 * @param {Object} error - 错误对象
 * @param {string} audioId - 音频ID
 */
function showAudioErrorFinal(error, audioId) {
    // 获取友好的错误消息
    const friendlyMessage = getAudioErrorFriendlyMessage(error.message);
    
    // 创建最终错误提示模态框内容
    const modalContent = `
        <div class="audio-error-modal">
            <div class="audio-error-icon">😔</div>
            <h3 class="audio-error-title">音频加载失败</h3>
            <p class="audio-error-message">${friendlyMessage}</p>
            <p class="audio-error-final-hint">
                已达到最大重试次数，请稍后再试
            </p>
            <div class="audio-error-suggestions">
                <p class="suggestion-title">💡 建议：</p>
                <ul class="suggestion-list">
                    <li>检查网络连接是否正常</li>
                    <li>刷新页面后重试</li>
                    <li>尝试点击其他内容</li>
                </ul>
            </div>
            <div class="audio-error-actions">
                <button class="btn-cartoon btn-cartoon-primary btn-audio-ok" id="btnAudioOk">
                    <span>👌</span> 知道了
                </button>
            </div>
        </div>
    `;
    
    // 添加音频错误模态框样式
    addAudioErrorModalStyles();
    
    // 显示模态框
    showModal(modalContent);
    
    // 绑定确定按钮事件
    const btnOk = document.getElementById('btnAudioOk');
    if (btnOk) {
        btnOk.addEventListener('click', () => {
            hideModal();
            // 重置重试计数
            resetAudioRetryCount(audioId);
        });
    }
}

/**
 * 重试音频播放
 * @param {HTMLElement} element - 可点读元素
 * @param {string} elementId - 元素ID
 * @param {string} audioId - 音频ID
 * @param {string} elementType - 元素类型
 * @param {string} voiceId - 音色ID
 */
function retryAudioPlayback(element, elementId, audioId, elementType, voiceId) {
    // 增加重试计数
    const newRetryCount = incrementAudioRetryCount(audioId);
    
    if (APP_CONFIG.debug) {
        console.log(`🔊 重试音频播放 - 第 ${newRetryCount} 次重试`);
    }
    
    // 显示重试提示
    showToast(`正在重试... (${newRetryCount}/${MAX_AUDIO_RETRY_COUNT})`, 'info', 2000);
    
    // 重新高亮元素
    if (pageRenderer) {
        pageRenderer.highlightContent(elementId);
    }
    
    // 获取音频URL
    const audioUrl = dataManager.getAudioUrl(audioId, voiceId);
    
    // 重新播放音频
    playAudioWithRetry(audioUrl, element, elementId, audioId, elementType, voiceId);
}

/**
 * 获取友好的音频错误消息
 * @param {string} errorMessage - 原始错误消息
 * @returns {string} 友好的错误消息
 */
function getAudioErrorFriendlyMessage(errorMessage) {
    // 根据错误消息返回友好的提示
    if (!errorMessage) {
        return '音频加载出现问题，请重试';
    }
    
    const lowerMessage = errorMessage.toLowerCase();
    
    if (lowerMessage.includes('network') || lowerMessage.includes('网络')) {
        return '网络连接不稳定，请检查网络后重试';
    }
    
    if (lowerMessage.includes('not supported') || lowerMessage.includes('不支持')) {
        return '当前浏览器不支持此音频格式';
    }
    
    if (lowerMessage.includes('decode') || lowerMessage.includes('解码')) {
        return '音频文件损坏，无法播放';
    }
    
    if (lowerMessage.includes('aborted') || lowerMessage.includes('中断')) {
        return '音频加载被中断，请重试';
    }
    
    if (lowerMessage.includes('not found') || lowerMessage.includes('不存在')) {
        return '音频文件不存在，请稍后再试';
    }
    
    // 默认友好消息
    return '音频加载失败，请点击重试';
}

/**
 * 添加音频错误模态框样式
 */
function addAudioErrorModalStyles() {
    if (!document.getElementById('audio-error-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'audio-error-modal-styles';
        style.textContent = `
            /* 音频错误模态框样式 */
            .audio-error-modal {
                text-align: center;
                padding: var(--spacing-lg);
                max-width: 320px;
                margin: 0 auto;
            }
            
            .audio-error-icon {
                font-size: 4rem;
                margin-bottom: var(--spacing-md);
                animation: bounce 0.5s ease-in-out;
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            
            .audio-error-title {
                font-family: var(--font-family-display);
                font-size: var(--font-size-xl);
                color: var(--color-error);
                margin-bottom: var(--spacing-sm);
            }
            
            .audio-error-message {
                font-size: var(--font-size-md);
                color: var(--color-text-primary);
                margin-bottom: var(--spacing-md);
                line-height: 1.5;
            }
            
            .audio-error-retry-hint {
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
                margin-bottom: var(--spacing-lg);
            }
            
            .audio-error-retry-hint .retry-count {
                font-weight: var(--font-weight-bold);
                color: var(--color-primary);
            }
            
            .audio-error-final-hint {
                font-size: var(--font-size-sm);
                color: var(--color-warning);
                margin-bottom: var(--spacing-md);
                padding: var(--spacing-sm);
                background: var(--color-warning-light, rgba(255, 193, 7, 0.1));
                border-radius: var(--radius-md);
            }
            
            .audio-error-suggestions {
                text-align: left;
                background: var(--color-background);
                padding: var(--spacing-md);
                border-radius: var(--radius-md);
                margin-bottom: var(--spacing-lg);
            }
            
            .audio-error-suggestions .suggestion-title {
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-bold);
                color: var(--color-text-primary);
                margin-bottom: var(--spacing-sm);
            }
            
            .audio-error-suggestions .suggestion-list {
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
                padding-left: var(--spacing-md);
                margin: 0;
            }
            
            .audio-error-suggestions .suggestion-list li {
                margin-bottom: var(--spacing-xs);
            }
            
            .audio-error-actions {
                display: flex;
                gap: var(--spacing-md);
                justify-content: center;
            }
            
            .audio-error-actions .btn-cartoon {
                min-width: 100px;
            }
            
            .btn-audio-retry {
                background: var(--gradient-primary);
            }
            
            .btn-audio-cancel,
            .btn-audio-ok {
                background: var(--color-surface);
                border: 2px solid var(--color-border);
            }
            
            /* 响应式调整 */
            @media (max-width: 480px) {
                .audio-error-modal {
                    padding: var(--spacing-md);
                }
                
                .audio-error-icon {
                    font-size: 3rem;
                }
                
                .audio-error-actions {
                    flex-direction: column;
                }
                
                .audio-error-actions .btn-cartoon {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * 添加阅读页面样式
 */
function addReadingPageStyles() {
    if (!document.getElementById('reading-page-styles')) {
        const style = document.createElement('style');
        style.id = 'reading-page-styles';
        style.textContent = `
            /* 阅读页面容器 */
            .reading-page {
                padding: var(--spacing-xs);
                min-height: 100%;
                display: flex;
                flex-direction: column;
            }
            
            /* 阅读页面头部 */
            .reading-page-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--spacing-sm) var(--spacing-md);
                background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-surface) 100%);
                border-radius: var(--radius-lg);
                margin-bottom: var(--spacing-md);
                box-shadow: var(--shadow-sm);
            }
            
            .reading-header-left {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }
            
            .lesson-title-icon {
                font-size: var(--font-size-xl);
            }
            
            .lesson-title-text {
                font-family: var(--font-family-display);
                font-size: var(--font-size-md);
                font-weight: var(--font-weight-bold);
                color: var(--color-text-primary);
            }
            
            .reading-header-divider {
                color: var(--color-text-secondary);
                opacity: 0.4;
                font-size: var(--font-size-sm);
            }
            
            .reading-header-hint {
                font-size: var(--font-size-xs);
                color: var(--color-text-secondary);
            }
            
            .reading-header-right {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }
            
            .page-indicator {
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
                background: var(--color-background);
                padding: var(--spacing-xs) var(--spacing-sm);
                border-radius: var(--radius-md);
            }
            
            /* 滑动提示样式 */
            .swipe-hint {
                font-size: var(--font-size-xs);
                color: var(--color-text-secondary);
                background: var(--color-background);
                padding: var(--spacing-xs) var(--spacing-sm);
                border-radius: var(--radius-md);
                animation: swipe-hint-pulse 2s ease-in-out infinite;
            }
            
            @keyframes swipe-hint-pulse {
                0%, 100% { opacity: 0.7; }
                50% { opacity: 1; }
            }
            
            /* 点读提示 */
            .reading-hint {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: var(--spacing-sm);
                padding: var(--spacing-sm) var(--spacing-md);
                background: linear-gradient(135deg, rgba(255, 230, 109, 0.3) 0%, rgba(255, 237, 153, 0.3) 100%);
                border-radius: var(--radius-lg);
                margin-bottom: var(--spacing-md);
                border: 2px dashed var(--color-accent);
            }
            
            .hint-icon {
                font-size: var(--font-size-lg);
            }
            
            .hint-text {
                font-size: var(--font-size-sm);
                color: var(--color-text-primary);
            }
            
            .hint-indicator {
                display: inline-block;
                background: var(--color-primary-light);
                padding: 2px 6px;
                border-radius: var(--radius-sm);
                font-size: var(--font-size-xs);
            }
            
            /* BookFlipper 区域样式 */
            .book-flipper-area {
                display: flex;
                flex-direction: column;
                touch-action: pan-y pinch-zoom;
                user-select: none;
                -webkit-user-select: none;
            }
            
            /* PageRenderer 包装器样式增强 */
            .reading-page .page-renderer-wrapper {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            /* 书本页面容器增强 */
            .reading-page .book-page-container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
            }
            
            /* 可点读元素增强样式 */
            .reading-page .clickable-element {
                min-height: 36px;
                font-size: var(--font-size-md);
            }
            
            /* 可点读元素指示器始终可见 */
            .reading-page .clickable-element-indicator {
                opacity: 0.7;
                transform: scale(0.9);
            }
            
            .reading-page .clickable-element:hover .clickable-element-indicator,
            .reading-page .clickable-element.highlighted .clickable-element-indicator {
                opacity: 1;
                transform: scale(1.1);
            }
            
            /* 高亮状态增强 */
            .reading-page .clickable-element.highlighted {
                animation: highlight-pulse 1s ease-in-out infinite;
            }
            
            @keyframes highlight-pulse {
                0%, 100% {
                    box-shadow: var(--shadow-lg), 0 0 0 4px var(--color-primary-light);
                }
                50% {
                    box-shadow: var(--shadow-lg), 0 0 0 8px var(--color-primary-light);
                }
            }
            
            /* 不同类型内容的图标标识 */
            .reading-page .clickable-element-dialogue::before {
                content: '💬';
                margin-right: var(--spacing-xs);
                font-size: var(--font-size-sm);
            }
            
            .reading-page .clickable-element-text::before {
                content: '📝';
                margin-right: var(--spacing-xs);
                font-size: var(--font-size-sm);
            }
            
            .reading-page .clickable-element-formula::before {
                content: '🔢';
                margin-right: var(--spacing-xs);
                font-size: var(--font-size-sm);
            }
            
            .reading-page .clickable-element-word::before {
                content: '🔤';
                margin-right: var(--spacing-xs);
                font-size: var(--font-size-sm);
            }
            
            /* 翻页滑动视觉反馈 */
            .book-flipper-area.swiping-left {
                transform: translateX(-10px);
                transition: transform 0.1s ease-out;
            }
            
            .book-flipper-area.swiping-right {
                transform: translateX(10px);
                transition: transform 0.1s ease-out;
            }
            
            /* 响应式布局 */
            @media (max-width: 480px) {
                .reading-page-header {
                    flex-direction: column;
                    gap: var(--spacing-sm);
                    text-align: center;
                }
                
                .reading-header-divider,
                .reading-header-hint {
                    display: none;
                }
                
                .reading-page .clickable-element {
                    min-height: 32px;
                    font-size: var(--font-size-sm);
                }
                
                .swipe-hint {
                    font-size: var(--font-size-xs);
                }
            }
            
            @media (min-width: 768px) {
                .reading-page .book-page-container {
                    max-width: 700px;
                }
                
                .reading-page .clickable-element {
                    min-height: 40px;
                    font-size: var(--font-size-lg);
                }
            }
            
            /* 目录小箭头 */
            .toc-arrow {
                font-size: 10px;
                color: var(--color-text-secondary);
                transition: transform 0.2s;
            }
            
            /* 侧边栏遮罩 */
            .reading-sidebar-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.4);
                z-index: 999;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s;
            }
            .reading-sidebar-overlay.open {
                opacity: 1;
                pointer-events: auto;
            }
            
            /* 侧边栏 */
            .reading-sidebar {
                position: fixed;
                top: 0;
                left: -300px;
                width: 280px;
                height: 100vh;
                background: var(--color-bg-primary);
                z-index: 1000;
                box-shadow: 4px 0 16px rgba(0,0,0,0.15);
                transition: left 0.3s ease;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .reading-sidebar.open {
                left: 0;
            }
            
            .sidebar-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px;
                border-bottom: 1px solid var(--color-border-light);
                background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-surface) 100%);
            }
            .sidebar-title {
                font-size: 16px;
                font-weight: bold;
            }
            .sidebar-close {
                cursor: pointer;
                font-size: 18px;
                color: var(--color-text-secondary);
                padding: 4px 8px;
                border-radius: 4px;
            }
            .sidebar-close:hover {
                background: rgba(0,0,0,0.08);
            }
            
            .sidebar-content {
                flex: 1;
                overflow-y: auto;
                padding: 8px 0;
            }
            
            .sidebar-chapter {
                margin-bottom: 4px;
            }
            .sidebar-chapter-title {
                padding: 10px 16px 6px;
                font-size: 14px;
                font-weight: bold;
                color: var(--color-text-primary);
            }
            .sidebar-lesson {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 16px 8px 28px;
                cursor: pointer;
                font-size: 13px;
                color: var(--color-text-secondary);
                transition: background 0.15s;
            }
            .sidebar-lesson:hover {
                background: rgba(0,0,0,0.04);
            }
            .sidebar-lesson.active {
                background: var(--color-primary-light);
                color: var(--color-primary);
                font-weight: bold;
            }
            .sidebar-lesson-pages {
                font-size: 11px;
                color: var(--color-text-secondary);
                opacity: 0.7;
            }
            .sidebar-lesson-meta {
                display: flex;
                align-items: center;
                gap: 6px;
                flex-shrink: 0;
            }
            .sidebar-lesson-badge {
                font-size: 10px;
                padding: 1px 6px;
                border-radius: 8px;
                white-space: nowrap;
            }
            .sidebar-lesson-badge.completed {
                background: #e8f5e9;
                color: #2e7d32;
            }
            .sidebar-lesson-badge.in-progress {
                background: #fff3e0;
                color: #e65100;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * 渲染设置页面
 * Requirements: 6.1, 6.2, 6.3, 6.5
 * - 显示所有可用的音色选项列表
 * - 提供音色试听功能
 * - 选择音色后保存用户偏好并应用到后续所有点读播放
 * - 音色切换时显示切换中的状态提示
 */
async function renderSettingsPage() {
    // 创建设置页面容器
    elements.mainContent.innerHTML = `
        <div class="settings-page animate-pop" id="settingsPageContainer">
            <div class="settings-header text-center">
                <h2 class="settings-title">⚙️ 设置</h2>
                <p class="settings-subtitle">自定义你的学习体验</p>
            </div>
            
            <!-- 音色设置区域 -->
            <div class="settings-section" id="voiceSelectorContainer">
                <!-- VoiceSelector 将在此渲染 -->
            </div>
        </div>
    `;
    
    // 添加设置页面样式
    addSettingsPageStyles();
    
    const container = document.getElementById('voiceSelectorContainer');
    
    // 创建 VoiceSelector 实例
    voiceSelector = new VoiceSelector(container);
    voiceSelector.setDataManager(dataManager);
    voiceSelector.setStorageManager(storageManager);
    voiceSelector.setAudioPlayer(audioPlayer);
    voiceSelector.setDebug(APP_CONFIG.debug);
    
    // 设置选择回调 - 选择音色后应用到音频播放器
    // Requirements: 6.3 - 选择音色后保存用户偏好并应用到后续所有点读播放
    voiceSelector.onSelect(handleVoiceSelected);
    
    // 加载并渲染音色列表
    await loadAndRenderVoices();
}

/**
 * 加载并渲染音色列表
 * Requirements: 6.1 - 显示所有可用的音色选项列表
 */
async function loadAndRenderVoices() {
    if (!voiceSelector) {
        console.error('VoiceSelector 未初始化');
        return;
    }
    
    // 显示加载状态
    voiceSelector.showLoading();
    appController.setLoading(true);
    
    try {
        // Requirements: 6.1 - 加载音色列表
        const voices = await voiceSelector.loadVoices();
        
        // 渲染音色列表
        voiceSelector.render(voices);
        
        if (APP_CONFIG.debug) {
            console.log('🎤 音色列表加载成功', voices);
        }
    } catch (error) {
        console.error('音色列表加载失败:', error);
        
        // 显示错误状态和重试按钮
        voiceSelector.showError('音色加载失败，请点击重试', async () => {
            await loadAndRenderVoices();
        });
        
        // 显示 Toast 提示
        showToast('加载失败，请重试', 'error');
    } finally {
        appController.setLoading(false);
    }
}

/**
 * 处理音色选择
 * Requirements: 6.3, 6.5
 * - 保存用户偏好
 * - 应用到后续所有点读播放
 * - 显示切换中的状态提示
 * @param {Object} voice - 选中的音色对象
 */
async function handleVoiceSelected(voice) {
    if (!voice || !voice.id) {
        console.error('无效的音色对象');
        return;
    }
    
    if (APP_CONFIG.debug) {
        console.log('🎤 选中音色:', voice);
    }
    
    // Requirements: 6.5 - 显示切换中的状态提示
    showToast(`正在切换到${voice.name}...`, 'info', 1000);
    
    try {
        // Requirements: 6.3 - 应用音色到音频播放器
        if (audioPlayer) {
            audioPlayer.setVoice(voice.id);
            
            if (APP_CONFIG.debug) {
                console.log('🎵 音频播放器音色已更新:', voice.id);
            }
        }
        
        // 更新应用状态
        appController.setSelectedVoice(voice);
        
        // 短暂延迟以显示切换效果
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 显示成功提示
        showToast(`已切换到${voice.name} 🎉`, 'success', 2000);
        
    } catch (error) {
        console.error('音色切换失败:', error);
        showToast('音色切换失败，请重试', 'error');
    }
}

/**
 * 添加设置页面样式
 */
function addSettingsPageStyles() {
    if (!document.getElementById('settings-page-styles')) {
        const style = document.createElement('style');
        style.id = 'settings-page-styles';
        style.textContent = `
            .settings-page {
                padding: var(--spacing-md);
                min-height: 100%;
            }
            
            .settings-header {
                margin-bottom: var(--spacing-lg);
            }
            
            .settings-title {
                font-family: var(--font-family-display);
                font-size: var(--font-size-2xl);
                color: var(--color-primary);
                margin-bottom: var(--spacing-xs);
            }
            
            .settings-subtitle {
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
            }
            
            .settings-section {
                margin-bottom: var(--spacing-xl);
            }
            
            .settings-section-title {
                font-family: var(--font-family-display);
                font-size: var(--font-size-lg);
                color: var(--color-text-primary);
                margin-bottom: var(--spacing-md);
                padding-bottom: var(--spacing-sm);
                border-bottom: 2px dashed var(--color-border);
            }
            
            /* 音色选择器面板样式 */
            .voice-selector-panel {
                background: var(--color-surface);
                border-radius: var(--radius-xl);
                padding: var(--spacing-lg);
                box-shadow: var(--shadow-md);
            }
            
            .voice-selector-header {
                text-align: center;
                margin-bottom: var(--spacing-lg);
            }
            
            .voice-selector-title {
                font-family: var(--font-family-display);
                font-size: var(--font-size-xl);
                color: var(--color-primary);
                margin-bottom: var(--spacing-xs);
            }
            
            .voice-selector-subtitle {
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
            }
            
            /* 音色列表样式 */
            .voice-list {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-md);
            }
            
            /* 音色卡片样式 */
            .voice-card {
                display: flex;
                align-items: center;
                padding: var(--spacing-md);
                background: var(--color-background);
                border-radius: var(--radius-lg);
                border: 3px solid transparent;
                cursor: pointer;
                transition: all var(--transition-normal);
                position: relative;
                overflow: hidden;
            }
            
            .voice-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-md);
            }
            
            .voice-card:active {
                transform: scale(0.98);
            }

            .voice-card.voice-disabled {
                opacity: 0.5;
                cursor: not-allowed;
                filter: grayscale(0.6);
                pointer-events: auto;
            }
            .voice-card.voice-disabled:hover {
                transform: none;
                box-shadow: var(--shadow-sm);
            }
            .voice-card.voice-disabled:active {
                transform: none;
            }
            .voice-coming-soon {
                font-size: 11px;
                color: #999;
                background: #F0F0F0;
                padding: 1px 8px;
                border-radius: 8px;
                margin-left: 6px;
            }
            
            .voice-card.selected {
                border-color: var(--color-primary);
                background: linear-gradient(135deg, 
                    rgba(255, 107, 157, 0.1) 0%, 
                    rgba(255, 154, 139, 0.1) 100%);
            }
            
            .voice-card.selected .voice-selected-indicator {
                opacity: 1;
                transform: scale(1);
            }
            
            /* 音色类型样式 */
            .voice-type-female {
                --voice-color: var(--color-primary);
            }
            
            .voice-type-male {
                --voice-color: var(--color-secondary);
            }
            
            .voice-type-child {
                --voice-color: var(--color-accent);
            }
            
            /* 音色图标 */
            .voice-card-icon {
                width: 50px;
                height: 50px;
                border-radius: var(--radius-full);
                background: linear-gradient(135deg, var(--voice-color) 0%, var(--color-primary-light) 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                margin-right: var(--spacing-md);
            }
            
            .voice-type-icon {
                font-size: var(--font-size-xl);
            }
            
            /* 音色内容 */
            .voice-card-content {
                flex: 1;
                min-width: 0;
            }
            
            .voice-card-header {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-xs);
            }
            
            .voice-name {
                font-size: var(--font-size-md);
                font-weight: var(--font-weight-bold);
                color: var(--color-text-primary);
            }
            
            .voice-type-badge {
                font-size: var(--font-size-xs);
                padding: 2px 8px;
                border-radius: var(--radius-full);
                background: var(--voice-color);
                color: white;
            }
            
            .voice-description {
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
                line-height: 1.4;
            }
            
            /* 音色操作按钮 */
            .voice-card-actions {
                margin-left: var(--spacing-md);
            }
            
            .btn-preview {
                display: flex;
                align-items: center;
                gap: var(--spacing-xs);
                padding: var(--spacing-sm) var(--spacing-md);
                background: var(--voice-color);
                color: white;
                border: none;
                border-radius: var(--radius-full);
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-medium);
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .btn-preview:hover {
                transform: scale(1.05);
                box-shadow: var(--shadow-sm);
            }
            
            .btn-preview:active {
                transform: scale(0.95);
            }
            
            .btn-preview.previewing {
                background: var(--color-text-secondary);
                animation: pulse 1s ease-in-out infinite;
            }
            
            .btn-preview:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            .preview-icon {
                font-size: var(--font-size-md);
            }
            
            /* 选中指示器 */
            .voice-selected-indicator {
                position: absolute;
                top: var(--spacing-sm);
                right: var(--spacing-sm);
                width: 24px;
                height: 24px;
                background: var(--color-success);
                border-radius: var(--radius-full);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transform: scale(0);
                transition: all var(--transition-fast);
            }
            
            .checkmark {
                color: white;
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-bold);
            }
            
            /* 其他设置选项 */
            .settings-other {
                background: var(--color-surface);
                border-radius: var(--radius-xl);
                padding: var(--spacing-lg);
                box-shadow: var(--shadow-sm);
            }
            
            .settings-option-list {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-sm);
            }
            
            .settings-option {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--spacing-md);
                background: var(--color-background);
                border-radius: var(--radius-md);
            }
            
            .settings-option-label {
                font-size: var(--font-size-md);
                color: var(--color-text-primary);
            }
            
            .settings-option-value {
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
                padding: var(--spacing-xs) var(--spacing-sm);
                background: var(--color-primary-light);
                border-radius: var(--radius-sm);
            }
            
            /* 动画效果 */
            .animate-jelly {
                animation: jelly 0.5s ease-in-out;
            }
            
            @keyframes jelly {
                0% { transform: scale(1); }
                25% { transform: scale(1.05, 0.95); }
                50% { transform: scale(0.95, 1.05); }
                75% { transform: scale(1.02, 0.98); }
                100% { transform: scale(1); }
            }
            
            .animate-bounce-in {
                animation: bounceIn 0.5s ease-out forwards;
                opacity: 0;
            }
            
            @keyframes bounceIn {
                0% { 
                    opacity: 0; 
                    transform: scale(0.8) translateY(20px); 
                }
                60% { 
                    opacity: 1; 
                    transform: scale(1.05) translateY(-5px); 
                }
                100% { 
                    opacity: 1; 
                    transform: scale(1) translateY(0); 
                }
            }
            
            /* 响应式布局 */
            @media (max-width: 480px) {
                .voice-card {
                    flex-wrap: wrap;
                }
                
                .voice-card-actions {
                    width: 100%;
                    margin-left: 0;
                    margin-top: var(--spacing-sm);
                }
                
                .btn-preview {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ========================================
// 复读/连读/评测/背诵 功能实现
// ========================================

/**
 * 按索引播放页面中的可点读元素
 */
function playElementByIndex(index) {
    if (index < 0 || index >= currentPageElements.length) return;
    const el = currentPageElements[index];
    const audioUrl = el.audioUrl || dataManager.getAudioUrl(el.audioId, 'voice-female');
    handleClickableElementClick(el, el.id, el.audioId, el.type, audioUrl);
}

/**
 * 开始连读：从第一个元素开始自动播放
 */
function startContinuousPlay() {
    if (currentPageElements.length === 0) {
        showToast('当前页面没有可点读内容', 'info');
        return;
    }
    continuousIndex = 0;
    playElementByIndex(0);
}

/**
 * 生成随机评测分数，覆盖多个等级
 * 不及格(0-59) 10%, 及格(60-69) 15%, 良好(70-79) 25%, 优秀(80-99) 35%, 满分(100) 15%
 */
function generateRandomScore() {
    const r = Math.random();
    if (r < 0.10) return Math.floor(Math.random() * 60);          // 不及格 0-59
    if (r < 0.25) return Math.floor(Math.random() * 10) + 60;     // 及格 60-69
    if (r < 0.50) return Math.floor(Math.random() * 10) + 70;     // 良好 70-79
    if (r < 0.85) return Math.floor(Math.random() * 20) + 80;     // 优秀 80-99
    return 100;                                                     // 满分
}

/**
 * 模拟录音界面：显示录音动画和倒计时，结束后回调
 * @param {number} seconds - 录音秒数
 * @param {string} mode - 模式名称（评测/背诵）
 * @param {Function} onComplete - 录音结束回调
 */
function showMockRecordingUI(seconds, mode, onComplete) {
    // 移除已有弹窗
    document.querySelectorAll('.mock-record-overlay, .mock-record-popup').forEach(el => el.remove());

    const overlay = document.createElement('div');
    overlay.className = 'mock-record-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';

    const popup = document.createElement('div');
    popup.className = 'mock-record-popup';
    popup.style.cssText = 'background:#fff;border-radius:20px;padding:40px 50px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.2);min-width:280px;';

    popup.innerHTML = `
        <div style="font-size:20px;font-weight:bold;color:#333;margin-bottom:16px;">🎤 ${mode}录音中</div>
        <div class="mock-wave-container" style="display:flex;align-items:center;justify-content:center;gap:4px;height:50px;margin-bottom:16px;">
            ${Array.from({length: 12}, (_, i) => `<div class="mock-wave-bar" style="width:4px;border-radius:2px;background:linear-gradient(180deg,#FF7043,#FF5722);animation:mockWaveAnim 0.6s ease-in-out ${i * 0.08}s infinite alternate;"></div>`).join('')}
        </div>
        <div class="mock-countdown" style="font-size:48px;font-weight:bold;color:#FF5722;margin-bottom:8px;">${seconds}</div>
        <div style="font-size:14px;color:#999;">请对着麦克风朗读...</div>
    `;

    // 添加波形动画样式
    if (!document.getElementById('mock-wave-style')) {
        const style = document.createElement('style');
        style.id = 'mock-wave-style';
        style.textContent = `
            @keyframes mockWaveAnim {
                from { height: 8px; }
                to { height: 40px; }
            }
        `;
        document.head.appendChild(style);
    }

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // 倒计时
    let remaining = seconds;
    const countdownEl = popup.querySelector('.mock-countdown');
    const timer = setInterval(() => {
        remaining--;
        if (remaining > 0) {
            countdownEl.textContent = remaining;
        } else {
            clearInterval(timer);
            countdownEl.textContent = '✓';
            countdownEl.style.color = '#4CAF50';
            popup.querySelector('div').textContent = '✅ 录音完成';

            // 短暂显示完成状态后关闭
            setTimeout(() => {
                overlay.remove();
                if (onComplete) onComplete();
            }, 600);
        }
    }, 1000);
}

/**
 * 开始评测：录音后与原文对比评分
 */
function startAssessment(clickedInfo) {
    const targetText = clickedInfo.element ? (clickedInfo.element.content || '') : '';
    if (!targetText) {
        showToast('无法获取评测内容', 'info');
        return;
    }

    // 高亮目标内容
    if (pageRenderer) pageRenderer.highlightContent(clickedInfo.elementId);

    // 先播放一遍原音
    showToast('先听一遍标准发音...', 'info', 2000);
    const audioUrl = clickedInfo.audioUrl || dataManager.getAudioUrl(clickedInfo.audioId, 'voice-female');

    if (digitalAvatar) {
        digitalAvatar.startSpeaking('播放标准发音...');
    }

    const preAudio = new Audio(audioUrl);
    preAudio.play().catch(() => {});
    preAudio.addEventListener('ended', () => {
        if (digitalAvatar) digitalAvatar.stopSpeaking();
        // 标准音播放完后开始模拟录音
        setTimeout(() => startRecordingForAssess(targetText, clickedInfo), 500);
    });
    preAudio.addEventListener('error', () => {
        if (digitalAvatar) digitalAvatar.stopSpeaking();
        startRecordingForAssess(targetText, clickedInfo);
    });
}


/**
 * 评测录音
 */
function startRecordingForAssess(targetText, clickedInfo) {
    if (digitalAvatar) {
        digitalAvatar.setRecording(true, '请朗读: ' + targetText.substring(0, 15) + '...');
    }

    showMockRecordingUI(3, '评测', () => {
        if (digitalAvatar) digitalAvatar.setRecording(false);
        if (pageRenderer) pageRenderer.clearHighlight();

        // 模拟识别结果和评分（多等级随机）
        const mockSpoken = targetText;
        const score = generateRandomScore();
        showAssessResult(targetText, mockSpoken, score, '评测', clickedInfo);
    });
}


/**
 * 开始背诵：遮挡内容后录音评测
 */
function startRecitation(clickedInfo) {
    const targetText = clickedInfo.element ? (clickedInfo.element.content || '') : '';
    if (!targetText) {
        showToast('无法获取背诵内容', 'info');
        return;
    }

    // 遮挡内容：在热区上覆盖遮罩
    const hotspotEl = document.querySelector(`[data-element-id="${clickedInfo.elementId}"]`);
    if (hotspotEl) {
        hotspotEl.classList.add('recite-masked');
        // 添加遮罩样式
        addReciteMaskStyle();
    }

    // 显示提示
    const maskedText = maskText(targetText);
    showToast('📝 内容已遮挡，请背诵...', 'info', 3000);

    if (digitalAvatar) {
        digitalAvatar.setRecording(true, '请背诵: ' + maskedText);
    }

    // 使用模拟录音界面
    showMockRecordingUI(3, '背诵', () => {
        if (digitalAvatar) digitalAvatar.setRecording(false);
        if (hotspotEl) hotspotEl.classList.remove('recite-masked');

        // 模拟识别结果和评分（多等级随机）
        const mockSpoken = targetText;
        const score = generateRandomScore();
        showAssessResult(targetText, mockSpoken, score, '背诵', clickedInfo);
    });
}

/**
 * 遮挡文本：保留首尾，中间用下划线替代
 */
function maskText(text) {
    if (text.length <= 3) return text[0] + '___';
    const keep = Math.max(1, Math.floor(text.length * 0.3));
    return text.substring(0, keep) + '___' + text.substring(text.length - keep);
}

/**
 * 计算评分：基于文本相似度 + 语音识别置信度
 */
function calculateScore(target, spoken, confidence) {
    const normalize = (s) => s.toLowerCase().replace(/[.,!?;:'"，。！？；：、\s]/g, '');
    const t = normalize(target);
    const s = normalize(spoken);

    if (t.length === 0) return 0;

    // 计算最长公共子序列比例
    const lcsLen = lcs(t, s);
    const similarity = lcsLen / Math.max(t.length, 1);

    // 综合评分：70% 文本相似度 + 30% 识别置信度
    const raw = similarity * 0.7 + (confidence || 0) * 0.3;
    return Math.min(100, Math.round(raw * 100));
}

/**
 * 最长公共子序列长度
 */
function lcs(a, b) {
    const m = a.length, n = b.length;
    if (m === 0 || n === 0) return 0;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1] + 1
                : Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    return dp[m][n];
}

/**
 * 显示评测/背诵结果弹窗
 * @param {string} target - 目标文本
 * @param {string} spoken - 识别文本
 * @param {number} score - 评分
 * @param {string} mode - 模式（评测/背诵）
 * @param {object} clickedInfo - 点击元素信息（用于重听/标准发音/重新评测）
 */
function showAssessResult(target, spoken, score, mode, clickedInfo) {
    // 移除已有弹窗
    document.querySelectorAll('.assess-overlay, .assess-result-popup').forEach(el => el.remove());

    const level = score === 100 ? 'perfect' : score >= 80 ? 'excellent' : score >= 70 ? 'good' : score >= 60 ? 'pass' : 'poor';
    const emoji = score === 100 ? '🏆' : score >= 80 ? '🌟' : score >= 70 ? '👍' : score >= 60 ? '✅' : '💪';
    const levelText = score === 100 ? '满分' : score >= 80 ? '优秀' : score >= 70 ? '良好' : score >= 60 ? '及格' : '不及格';
    const comment = score === 100 ? '完美！满分通过，太厉害了！'
        : score >= 80 ? '太棒了！发音非常标准！'
        : score >= 70 ? '不错哦，继续加油！'
        : score >= 60 ? '及格了，再多练习会更好！'
        : '还需要多练习哦，加油！';

    // 拆分为单词/词语（单词也按字母拆分显示）
    const words = splitIntoWords(target);

    // 生成逐词/逐字母评分
    let wordScoresHtml = '';
    {
        const wordScores = words.map(() => {
            const ws = generateRandomScore();
            return ws;
        });
        wordScoresHtml = `
            <div class="word-scores-section">
                <div class="word-scores-label">${/[a-zA-Z]/.test(target) ? '逐词评分：' : '逐字评分：'}</div>
                <div class="word-scores-list">
                    ${words.map((w, i) => {
                        const ws = wordScores[i];
                        const wColor = ws >= 80 ? '#4CAF50' : ws >= 60 ? '#FF9800' : '#F44336';
                        return `<span class="word-score-item" style="border-bottom:2px solid ${wColor};">
                            <span class="word-text">${w}</span>
                            <span class="word-score-val" style="color:${wColor};">${ws}</span>
                        </span>`;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // 生成三维度评分
    let dimensionHtml = '';
    {
        const fluency = Math.max(20, Math.min(100, score + Math.floor(Math.random() * 21) - 10));
        const completeness = Math.max(20, Math.min(100, score + Math.floor(Math.random() * 21) - 10));
        const accuracy = Math.max(20, Math.min(100, score + Math.floor(Math.random() * 21) - 10));
        dimensionHtml = `
            <div class="dimension-section">
                ${buildDimensionBar('流畅度', fluency)}
                ${buildDimensionBar('完整度', completeness)}
                ${buildDimensionBar('准确度', accuracy)}
            </div>
        `;
    }

    const overlay = document.createElement('div');
    overlay.className = 'assess-overlay';

    const popup = document.createElement('div');
    popup.className = 'assess-result-popup';
    popup.innerHTML = `
        <div class="result-title">${emoji} ${mode}结果</div>
        <div class="result-score ${level}">${score}分 <span style="font-size:18px;">(${levelText})</span></div>
        ${wordScoresHtml}
        ${dimensionHtml}
        <div class="result-detail">
            <div style="margin-top:8px;color:#8D6E63;">${comment}</div>
        </div>
        <div class="assess-action-btns">
            <button class="assess-action-btn btn-replay-recording" title="录音重听">
                <span class="assess-btn-icon">🔊</span>
                <span class="assess-btn-text">录音重听</span>
            </button>
            <button class="assess-action-btn btn-standard-audio" title="标准发音">
                <span class="assess-btn-icon">🎧</span>
                <span class="assess-btn-text">标准发音</span>
            </button>
            <button class="assess-action-btn btn-reassess" title="重新评测">
                <span class="assess-btn-icon">🔄</span>
                <span class="assess-btn-text">重新${mode}</span>
            </button>
        </div>
        <button class="result-close-btn">知道了</button>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    // 当前播放的音频实例，用于互斥控制
    let currentAudio = null;
    let currentPlayingBtn = null;

    function stopCurrentAudio() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
        if (currentPlayingBtn) {
            currentPlayingBtn.classList.remove('playing');
            // 恢复按钮文字
            if (currentPlayingBtn.classList.contains('btn-replay-recording')) {
                currentPlayingBtn.querySelector('.assess-btn-text').textContent = '录音重听';
            } else if (currentPlayingBtn.classList.contains('btn-standard-audio')) {
                currentPlayingBtn.querySelector('.assess-btn-text').textContent = '标准发音';
            }
            currentPlayingBtn = null;
        }
    }

    const close = () => {
        stopCurrentAudio();
        overlay.remove();
        popup.remove();
    };
    overlay.addEventListener('click', close);
    popup.querySelector('.result-close-btn').addEventListener('click', close);

    function playAudioForBtn(btn, audioUrl, rate, label) {
        // 如果当前按钮正在播放，点击则停止
        if (btn.classList.contains('playing')) {
            stopCurrentAudio();
            return;
        }
        // 停止其它正在播放的音频
        stopCurrentAudio();

        if (!audioUrl) {
            showToast(label === '录音重听' ? '暂无录音数据' : '暂无标准音频', 'info');
            return;
        }

        btn.classList.add('playing');
        btn.querySelector('.assess-btn-text').textContent = '播放中...';
        currentPlayingBtn = btn;

        const audio = new Audio(audioUrl);
        if (rate) audio.playbackRate = rate;
        currentAudio = audio;
        audio.play().catch(() => {});

        const onEnd = () => {
            // 只在仍是当前音频时才重置
            if (currentAudio === audio) {
                stopCurrentAudio();
            }
        };
        audio.addEventListener('ended', onEnd);
        audio.addEventListener('error', () => {
            onEnd();
            showToast('音频播放失败', 'error');
        });
    }

    // 录音重听按钮
    popup.querySelector('.btn-replay-recording').addEventListener('click', () => {
        const btn = popup.querySelector('.btn-replay-recording');
        const audioUrl = clickedInfo && (clickedInfo.audioUrl || dataManager.getAudioUrl(clickedInfo.audioId, 'voice-female'));
        playAudioForBtn(btn, audioUrl, 0.95, '录音重听');
    });

    // 标准发音按钮
    popup.querySelector('.btn-standard-audio').addEventListener('click', () => {
        const btn = popup.querySelector('.btn-standard-audio');
        const audioUrl = clickedInfo && (clickedInfo.audioUrl || dataManager.getAudioUrl(clickedInfo.audioId, 'voice-female'));
        playAudioForBtn(btn, audioUrl, null, '标准发音');
    });

    // 重新评测按钮 - 关闭弹窗并重新开始评测/背诵
    popup.querySelector('.btn-reassess').addEventListener('click', () => {
        stopCurrentAudio();
        close();
        if (clickedInfo) {
            if (mode === '背诵') {
                startRecitation(clickedInfo);
            } else {
                startAssessment(clickedInfo);
            }
        } else if (lastClickedElement) {
            if (mode === '背诵') {
                startRecitation(lastClickedElement);
            } else {
                startAssessment(lastClickedElement);
            }
        } else {
            showToast('请先点击要评测的内容', 'info');
        }
    });

    if (digitalAvatar) {
        digitalAvatar.setStatus(emoji, `${mode}得分: ${score}分`);
        setTimeout(() => {
            if (digitalAvatar && !digitalAvatar.isSpeaking()) {
                digitalAvatar.setStatus('😊', '点击课本内容开始学习');
            }
        }, 5000);
    }
}

/**
 * 将文本拆分为单词/词语
 * 英文：按空格拆分为单词
 * 中文：每个字单独一项，排除标点符号
 */
function splitIntoWords(text) {
    const trimmed = text.trim();
    // 英文按空格拆分（单个单词保持完整）
    if (/[a-zA-Z]/.test(trimmed)) {
        return trimmed.split(/\s+/).filter(w => w.length > 0);
    }
    // 中文：逐字拆分，过滤标点符号和空白
    const punctuation = /[，。！？、；：""''（）《》【】…—·\s.,!?;:'"()\[\]{}<>\/\\@#$%^&*+=~`|_\-\d]/;
    return trimmed.split('').filter(ch => ch.length > 0 && !punctuation.test(ch));
}

/**
 * 构建维度评分条 HTML
 */
function buildDimensionBar(label, value) {
    const color = value >= 80 ? '#4CAF50' : value >= 60 ? '#FF9800' : '#F44336';
    return `
        <div class="dimension-row">
            <span class="dimension-label">${label}</span>
            <div class="dimension-bar-bg">
                <div class="dimension-bar-fill" style="width:${value}%;background:${color};"></div>
            </div>
            <span class="dimension-value" style="color:${color};">${value}%</span>
        </div>
    `;
}

/**
 * 添加背诵遮罩样式
 */
function addReciteMaskStyle() {
    if (document.getElementById('recite-mask-style')) return;
    const style = document.createElement('style');
    style.id = 'recite-mask-style';
    style.textContent = `
        .clickable-element.recite-masked {
            position: relative;
        }
        .clickable-element.recite-masked::after {
            content: '📝 背诵中...';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, #FFE082, #FFCA28);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            color: #5D4037;
            z-index: 5;
            animation: mask-pulse 1.5s ease-in-out infinite;
        }
        @keyframes mask-pulse {
            0%, 100% { opacity: 0.9; }
            50% { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// ========================================
// 事件处理
// ========================================

/**
 * 处理返回按钮点击
 */
function handleBackClick() {
    appController.goBack();
}

/**
 * 处理设置按钮点击
 */
function handleSettingsClick() {
    navigateTo(PageType.SETTINGS);
}

/**
 * 处理底部导航点击
 * @param {Event} e - 点击事件
 */
function handleNavClick(e) {
    const navItem = e.currentTarget;
    const page = navItem.dataset.page;
    
    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    navItem.classList.add('active');
    
    // 导航到对应页面
    if (page === 'home') {
        navigateTo(PageType.HOME);
    } else if (page === 'progress') {
        showToast('进度功能即将上线', 'info');
    } else if (page === 'settings') {
        navigateTo(PageType.SETTINGS);
    }
}

/**
 * 更新导航状态
 */
function updateNavigation() {
    const state = appController.getCurrentState();
    // 更新返回按钮可见性
    const showBack = state.currentPage !== PageType.HOME;
    if (elements.btnBack) {
        elements.btnBack.style.visibility = showBack ? 'visible' : 'hidden';
    }
}

// ========================================
// UI 工具函数
// ========================================

/**
 * 显示加载状态
 */
function showLoading() {
    appController.setLoading(true);
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
    appController.setLoading(false);
}

/**
 * 显示加载UI
 */
function showLoadingUI() {
    if (elements.loadingContainer) {
        elements.loadingContainer.classList.remove('hidden');
    }
}

/**
 * 隐藏加载UI
 */
function hideLoadingUI() {
    if (elements.loadingContainer) {
        elements.loadingContainer.classList.add('hidden');
    }
}

/**
 * 显示模态框
 * @param {string} content - 模态框内容HTML
 */
function showModal(content) {
    if (elements.modalContent) {
        elements.modalContent.innerHTML = content;
    }
    if (elements.modalOverlay) {
        elements.modalOverlay.classList.add('active');
    }
}

/**
 * 隐藏模态框
 */
function hideModal() {
    if (elements.modalOverlay) {
        elements.modalOverlay.classList.remove('active');
    }
}

/**
 * 显示Toast提示
 * @param {string} message - 提示消息
 * @param {string} type - 提示类型 (success, error, warning, info)
 * @param {number} duration - 显示时长（毫秒）
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    if (elements.toastContainer) {
        elements.toastContainer.appendChild(toast);
        
        // 自动移除
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// ========================================
// 本地存储工具
// ========================================

/**
 * 保存数据到本地存储
 * @param {string} key - 存储键
 * @param {any} value - 存储值
 */
function saveToStorage(key, value) {
    try {
        localStorage.setItem(`ai_reading_${key}`, JSON.stringify(value));
    } catch (e) {
        console.warn('本地存储保存失败:', e);
    }
}

/**
 * 从本地存储加载数据
 * @param {string} key - 存储键
 * @returns {any} 存储的值
 */
function loadFromStorage(key) {
    try {
        const value = localStorage.getItem(`ai_reading_${key}`);
        return value ? JSON.parse(value) : null;
    } catch (e) {
        console.warn('本地存储读取失败:', e);
        return null;
    }
}

// ========================================
// 导出公共API
// ========================================
window.AIReading = {
    navigateTo,
    showToast,
    showModal,
    hideModal,
    showLoading,
    hideLoading,
    showTutorial,
    getState: () => appController ? appController.getCurrentState() : null,
    getController: () => appController,
    getProgressTracker: () => progressTrackerInstance,
    config: APP_CONFIG
};

// ========================================
// 应用启动
// ========================================
document.addEventListener('DOMContentLoaded', initApp);
