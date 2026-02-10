/**
 * ProgressTracker - 进度追踪器
 * 管理学习进度的记录和展示
 * 
 * 功能：
 * - 记录页面访问
 * - 记录课程完成
 * - 计算章节和总体进度
 * - 显示祝贺动画
 * 
 * @class ProgressTracker
 * @requires StorageManager
 * @requires DataManager
 */
class ProgressTracker {
    /**
     * 创建进度追踪器实例
     * @param {StorageManager} storageManager - 存储管理器实例
     * @param {DataManager} dataManager - 数据管理器实例
     */
    constructor(storageManager = null, dataManager = null) {
        // 使用传入的实例或全局单例
        this._storageManager = storageManager || 
            (typeof window !== 'undefined' && window.storageManager) || 
            (typeof global !== 'undefined' && global.storageManager);
        
        this._dataManager = dataManager || 
            (typeof window !== 'undefined' && window.dataManager) || 
            (typeof global !== 'undefined' && global.dataManager);
        
        // 事件回调
        this._onCongratulationsCallback = null;
        this._onProgressUpdateCallback = null;
        
        // 当前上下文
        this._currentTextbookId = null;
        this._currentLessonId = null;
        
        // 祝贺动画容器
        this._congratulationsContainer = null;
    }

    // ==================== 依赖注入 ====================

    /**
     * 设置存储管理器
     * @param {StorageManager} storageManager - 存储管理器实例
     */
    setStorageManager(storageManager) {
        this._storageManager = storageManager;
    }

    /**
     * 设置数据管理器
     * @param {DataManager} dataManager - 数据管理器实例
     */
    setDataManager(dataManager) {
        this._dataManager = dataManager;
    }

    // ==================== 上下文管理 ====================

    /**
     * 设置当前教材上下文
     * @param {string} textbookId - 教材ID
     */
    setCurrentTextbook(textbookId) {
        this._currentTextbookId = textbookId;
    }

    /**
     * 获取当前教材ID
     * @returns {string|null} 教材ID
     */
    getCurrentTextbookId() {
        return this._currentTextbookId;
    }

    /**
     * 设置当前课程上下文
     * @param {string} lessonId - 课程ID
     */
    setCurrentLesson(lessonId) {
        this._currentLessonId = lessonId;
    }

    /**
     * 获取当前课程ID
     * @returns {string|null} 课程ID
     */
    getCurrentLessonId() {
        return this._currentLessonId;
    }

    // ==================== 页面访问记录 ====================

    /**
     * 记录页面访问
     * @param {string} lessonId - 课程ID
     * @param {number} pageNumber - 页码
     * @returns {boolean} 是否成功记录
     */
    recordPageVisit(lessonId, pageNumber) {
        if (!lessonId || typeof pageNumber !== 'number' || pageNumber < 1) {
            console.error('ProgressTracker: Invalid parameters for recordPageVisit');
            return false;
        }

        if (!this._currentTextbookId) {
            console.error('ProgressTracker: No textbook context set');
            return false;
        }

        if (!this._storageManager) {
            console.error('ProgressTracker: StorageManager not available');
            return false;
        }

        const result = this._storageManager.recordPageVisit(
            this._currentTextbookId,
            lessonId,
            pageNumber
        );

        if (result) {
            // 触发进度更新回调
            this._notifyProgressUpdate(lessonId);
        }

        return result;
    }

    /**
     * 获取课程已访问的页面列表
     * @param {string} lessonId - 课程ID
     * @returns {number[]} 已访问页码列表
     */
    getVisitedPages(lessonId) {
        if (!lessonId || !this._currentTextbookId || !this._storageManager) {
            return [];
        }

        return this._storageManager.getVisitedPages(
            this._currentTextbookId,
            lessonId
        );
    }

    // ==================== 课程完成检测 ====================

    /**
     * 记录课程完成
     * @param {string} lessonId - 课程ID
     * @returns {boolean} 是否成功记录
     */
    recordLessonComplete(lessonId) {
        if (!lessonId) {
            console.error('ProgressTracker: Invalid lessonId');
            return false;
        }

        if (!this._currentTextbookId) {
            console.error('ProgressTracker: No textbook context set');
            return false;
        }

        if (!this._storageManager) {
            console.error('ProgressTracker: StorageManager not available');
            return false;
        }

        // 检查是否已经完成（避免重复触发祝贺）
        const wasCompleted = this._storageManager.isLessonCompleted(
            this._currentTextbookId,
            lessonId
        );

        const result = this._storageManager.markLessonCompleted(
            this._currentTextbookId,
            lessonId
        );

        if (result && !wasCompleted) {
            // 首次完成，显示祝贺动画
            this.showCongratulations();
            
            // 触发进度更新回调
            this._notifyProgressUpdate(lessonId);
        }

        return result;
    }

    /**
     * 检查课程是否完成
     * @param {string} lessonId - 课程ID
     * @returns {boolean} 是否完成
     */
    isLessonCompleted(lessonId) {
        if (!lessonId || !this._currentTextbookId || !this._storageManager) {
            return false;
        }

        return this._storageManager.isLessonCompleted(
            this._currentTextbookId,
            lessonId
        );
    }

    /**
     * 检查并自动标记课程完成
     * 当所有页面都被访问时自动标记为完成
     * @param {string} lessonId - 课程ID
     * @param {number} totalPages - 课程总页数
     * @returns {boolean} 是否刚刚完成
     */
    async checkAndMarkComplete(lessonId, totalPages) {
        if (!lessonId || typeof totalPages !== 'number' || totalPages < 1) {
            return false;
        }

        // 如果已经完成，不需要再检查
        if (this.isLessonCompleted(lessonId)) {
            return false;
        }

        const visitedPages = this.getVisitedPages(lessonId);
        
        // 检查是否所有页面都已访问
        if (visitedPages.length >= totalPages) {
            // 验证是否真的访问了所有页面（1到totalPages）
            let allVisited = true;
            for (let i = 1; i <= totalPages; i++) {
                if (!visitedPages.includes(i)) {
                    allVisited = false;
                    break;
                }
            }

            if (allVisited) {
                this.recordLessonComplete(lessonId);
                return true;
            }
        }

        return false;
    }

    // ==================== 进度计算 ====================

    /**
     * 获取章节进度
     * @param {string} chapterId - 章节ID
     * @returns {number} 进度百分比 (0-100)
     */
    async getChapterProgress(chapterId) {
        if (!chapterId || !this._currentTextbookId) {
            return 0;
        }

        if (!this._dataManager) {
            console.error('ProgressTracker: DataManager not available');
            return 0;
        }

        try {
            // 获取章节数据
            const chapters = await this._dataManager.getChapters(this._currentTextbookId);
            const chapter = chapters.find(c => c.id === chapterId);

            if (!chapter || !chapter.lessons || chapter.lessons.length === 0) {
                return 0;
            }

            // 计算已完成的课程数
            let completedCount = 0;
            for (const lesson of chapter.lessons) {
                if (this.isLessonCompleted(lesson.id)) {
                    completedCount++;
                }
            }

            // 计算百分比
            const progress = Math.round((completedCount / chapter.lessons.length) * 100);
            return progress;
        } catch (error) {
            console.error('ProgressTracker: Error calculating chapter progress', error);
            return 0;
        }
    }

    /**
     * 获取总体进度
     * @param {string} textbookId - 教材ID（可选，默认使用当前教材）
     * @returns {number} 进度百分比 (0-100)
     */
    async getOverallProgress(textbookId = null) {
        const targetTextbookId = textbookId || this._currentTextbookId;
        
        if (!targetTextbookId) {
            return 0;
        }

        if (!this._dataManager) {
            console.error('ProgressTracker: DataManager not available');
            return 0;
        }

        try {
            // 获取所有章节
            const chapters = await this._dataManager.getChapters(targetTextbookId);
            
            if (!chapters || chapters.length === 0) {
                return 0;
            }

            // 计算总课程数和已完成课程数
            let totalLessons = 0;
            let completedLessons = 0;

            // 临时设置教材上下文（如果传入了不同的textbookId）
            const originalTextbookId = this._currentTextbookId;
            this._currentTextbookId = targetTextbookId;

            for (const chapter of chapters) {
                if (chapter.lessons) {
                    totalLessons += chapter.lessons.length;
                    for (const lesson of chapter.lessons) {
                        if (this.isLessonCompleted(lesson.id)) {
                            completedLessons++;
                        }
                    }
                }
            }

            // 恢复原始教材上下文
            this._currentTextbookId = originalTextbookId;

            if (totalLessons === 0) {
                return 0;
            }

            // 计算百分比
            const progress = Math.round((completedLessons / totalLessons) * 100);
            return progress;
        } catch (error) {
            console.error('ProgressTracker: Error calculating overall progress', error);
            return 0;
        }
    }

    /**
     * 获取已学习的课程列表
     * @returns {string[]} 已完成课程ID列表
     */
    getCompletedLessons() {
        if (!this._currentTextbookId || !this._storageManager) {
            return [];
        }

        const record = this._storageManager.getLearningRecord(this._currentTextbookId);
        
        if (!record || !record.progress) {
            return [];
        }

        // 筛选已完成的课程
        const completedLessons = [];
        for (const [lessonId, progressData] of Object.entries(record.progress)) {
            if (progressData.isCompleted) {
                completedLessons.push(lessonId);
            }
        }

        return completedLessons;
    }

    /**
     * 获取课程进度详情
     * @param {string} lessonId - 课程ID
     * @returns {object|null} 进度详情
     */
    getLessonProgressDetails(lessonId) {
        if (!lessonId || !this._currentTextbookId || !this._storageManager) {
            return null;
        }

        return this._storageManager.getLessonProgress(
            this._currentTextbookId,
            lessonId
        );
    }

    // ==================== 祝贺动画 ====================

    /**
     * 设置祝贺动画容器
     * @param {HTMLElement} container - 容器元素
     */
    setCongratulationsContainer(container) {
        this._congratulationsContainer = container;
    }

    /**
     * 显示祝贺动画
     */
    showCongratulations() {
        // 触发回调
        if (this._onCongratulationsCallback) {
            this._onCongratulationsCallback();
        }

        // 如果有容器，显示动画
        if (this._congratulationsContainer) {
            this._renderCongratulationsAnimation();
        }
    }

    /**
     * 渲染祝贺动画
     * Requirements: 9.4 - 显示祝贺动画和鼓励信息
     * 游戏化、可爱、色彩丰富的设计，适合小学生
     * @private
     */
    _renderCongratulationsAnimation() {
        if (!this._congratulationsContainer) {
            return;
        }

        // 随机选择鼓励信息
        const encourageMessages = [
            { title: '太棒了！', message: '你完成了这节课的学习！', emoji: '🎉' },
            { title: '真厉害！', message: '继续加油，你是最棒的！', emoji: '🌟' },
            { title: '好极了！', message: '学习小达人就是你！', emoji: '🏆' },
            { title: '超级棒！', message: '你的努力得到了回报！', emoji: '💪' },
            { title: '恭喜你！', message: '又完成了一课，继续前进！', emoji: '🚀' }
        ];
        const randomMessage = encourageMessages[Math.floor(Math.random() * encourageMessages.length)];

        // 创建祝贺动画元素
        const overlay = document.createElement('div');
        overlay.className = 'congratulations-overlay';
        overlay.innerHTML = `
            <div class="confetti-container" id="confettiContainer"></div>
            <div class="congratulations-content">
                <div class="congratulations-mascot">
                    <span class="mascot-emoji">${randomMessage.emoji}</span>
                    <div class="mascot-sparkles">
                        <span class="sparkle sparkle-1">✨</span>
                        <span class="sparkle sparkle-2">✨</span>
                        <span class="sparkle sparkle-3">✨</span>
                        <span class="sparkle sparkle-4">✨</span>
                    </div>
                </div>
                <h2 class="congratulations-title">${randomMessage.title}</h2>
                <p class="congratulations-message">${randomMessage.message}</p>
                <div class="congratulations-stars">
                    <span class="star star-1">⭐</span>
                    <span class="star star-2">⭐</span>
                    <span class="star star-3">⭐</span>
                </div>
                <div class="congratulations-badge">
                    <span class="badge-icon">🎖️</span>
                    <span class="badge-text">课程完成</span>
                </div>
                <button class="congratulations-button">
                    <span class="btn-icon">🎯</span>
                    <span class="btn-text">继续学习</span>
                </button>
            </div>
        `;

        // 添加动画样式
        const styleId = 'congratulations-animation-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                @keyframes congratsFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes congratsFadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes congratsBounceIn {
                    0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
                    50% { transform: scale(1.1) rotate(5deg); }
                    70% { transform: scale(0.9) rotate(-3deg); }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes congratsBounce {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-15px) scale(1.1); }
                }
                @keyframes congratsStarPop {
                    0% { transform: scale(0) rotate(-180deg); opacity: 0; }
                    60% { transform: scale(1.3) rotate(20deg); }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes congratsSparkle {
                    0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
                    50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
                }
                @keyframes congratsFloat {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    25% { transform: translateY(-5px) rotate(5deg); }
                    75% { transform: translateY(5px) rotate(-5deg); }
                }
                @keyframes congratsShine {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes congratsConfetti {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                @keyframes congratsPulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 107, 157, 0.4); }
                    50% { transform: scale(1.05); box-shadow: 0 0 20px 10px rgba(255, 107, 157, 0.2); }
                }
                @keyframes congratsWiggle {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(10deg); }
                    75% { transform: rotate(-10deg); }
                }
                @keyframes congratsBadgeSlide {
                    0% { transform: translateY(20px) scale(0.8); opacity: 0; }
                    100% { transform: translateY(0) scale(1); opacity: 1; }
                }
                
                .congratulations-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(255, 107, 157, 0.9) 0%, rgba(78, 205, 196, 0.9) 100%);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    animation: congratsFadeIn 0.4s ease-out;
                    overflow: hidden;
                }
                
                .congratulations-overlay.closing {
                    animation: congratsFadeOut 0.3s ease-out forwards;
                }
                
                .confetti-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    overflow: hidden;
                }
                
                .confetti {
                    position: absolute;
                    width: 12px;
                    height: 12px;
                    animation: congratsConfetti linear forwards;
                }
                
                .congratulations-content {
                    background: linear-gradient(145deg, #FFFFFF 0%, #FFF9E6 100%);
                    border-radius: 30px;
                    padding: 40px 50px;
                    text-align: center;
                    box-shadow: 
                        0 20px 60px rgba(0, 0, 0, 0.3),
                        0 0 0 5px rgba(255, 255, 255, 0.5),
                        inset 0 -5px 20px rgba(255, 215, 0, 0.2);
                    animation: congratsBounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    position: relative;
                    max-width: 90%;
                    width: 360px;
                }
                
                .congratulations-mascot {
                    position: relative;
                    display: inline-block;
                    margin-bottom: 10px;
                }
                
                .mascot-emoji {
                    font-size: 80px;
                    display: block;
                    animation: congratsBounce 1s ease-in-out infinite;
                    filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.2));
                }
                
                .mascot-sparkles {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }
                
                .sparkle {
                    position: absolute;
                    font-size: 24px;
                    animation: congratsSparkle 1.5s ease-in-out infinite;
                }
                
                .sparkle-1 { top: -10px; left: -20px; animation-delay: 0s; }
                .sparkle-2 { top: -10px; right: -20px; animation-delay: 0.3s; }
                .sparkle-3 { bottom: 10px; left: -25px; animation-delay: 0.6s; }
                .sparkle-4 { bottom: 10px; right: -25px; animation-delay: 0.9s; }
                
                .congratulations-title {
                    font-size: 36px;
                    font-weight: bold;
                    background: linear-gradient(135deg, #FF6B9D 0%, #FF8E53 50%, #FFE66D 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin: 15px 0;
                    animation: congratsShine 3s linear infinite;
                    text-shadow: none;
                }
                
                .congratulations-message {
                    font-size: 18px;
                    color: #666;
                    margin-bottom: 20px;
                    line-height: 1.5;
                }
                
                .congratulations-stars {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    margin-bottom: 20px;
                }
                
                .congratulations-stars .star {
                    font-size: 40px;
                    display: inline-block;
                    filter: drop-shadow(0 3px 6px rgba(255, 193, 7, 0.5));
                }
                
                .star-1 { animation: congratsStarPop 0.5s ease-out 0.2s both, congratsFloat 2s ease-in-out 0.7s infinite; }
                .star-2 { animation: congratsStarPop 0.5s ease-out 0.4s both, congratsFloat 2s ease-in-out 0.9s infinite; }
                .star-3 { animation: congratsStarPop 0.5s ease-out 0.6s both, congratsFloat 2s ease-in-out 1.1s infinite; }
                
                .congratulations-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 25px;
                    box-shadow: 0 4px 15px rgba(78, 205, 196, 0.4);
                    animation: congratsBadgeSlide 0.5s ease-out 0.8s both;
                }
                
                .badge-icon {
                    font-size: 20px;
                    animation: congratsWiggle 0.5s ease-in-out infinite;
                }
                
                .congratulations-button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    background: linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%);
                    color: white;
                    border: none;
                    padding: 16px 40px;
                    font-size: 18px;
                    font-weight: bold;
                    border-radius: 30px;
                    cursor: pointer;
                    box-shadow: 0 6px 20px rgba(255, 107, 157, 0.4);
                    transition: all 0.3s ease;
                    animation: congratsPulse 2s ease-in-out infinite;
                }
                
                .congratulations-button:hover {
                    transform: translateY(-3px) scale(1.05);
                    box-shadow: 0 10px 30px rgba(255, 107, 157, 0.5);
                }
                
                .congratulations-button:active {
                    transform: translateY(0) scale(0.98);
                }
                
                .congratulations-button .btn-icon {
                    font-size: 22px;
                }
            `;
            document.head.appendChild(style);
        }

        // 创建彩带/纸屑效果
        this._createConfetti(overlay.querySelector('#confettiContainer'));

        // 点击按钮关闭
        const button = overlay.querySelector('.congratulations-button');
        button.addEventListener('click', () => {
            this._closeCongratulations(overlay);
        });

        // 点击遮罩关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this._closeCongratulations(overlay);
            }
        });

        // 添加到容器
        this._congratulationsContainer.appendChild(overlay);

        // 播放庆祝音效（如果有音频播放器）
        this._playCelebrationSound();
    }

    /**
     * 创建彩带/纸屑效果
     * @param {HTMLElement} container - 彩带容器
     * @private
     */
    _createConfetti(container) {
        if (!container) return;

        const colors = ['#FF6B9D', '#FFE66D', '#4ECDC4', '#A78BFA', '#FF8E53', '#7ED957'];
        const shapes = ['●', '■', '▲', '★', '♦', '♥'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('span');
            confetti.className = 'confetti';
            confetti.textContent = shapes[Math.floor(Math.random() * shapes.length)];
            confetti.style.cssText = `
                left: ${Math.random() * 100}%;
                color: ${colors[Math.floor(Math.random() * colors.length)]};
                font-size: ${8 + Math.random() * 12}px;
                animation-duration: ${2 + Math.random() * 3}s;
                animation-delay: ${Math.random() * 2}s;
            `;
            container.appendChild(confetti);
        }
    }

    /**
     * 关闭祝贺动画
     * @param {HTMLElement} overlay - 遮罩元素
     * @private
     */
    _closeCongratulations(overlay) {
        if (!overlay) return;
        
        overlay.classList.add('closing');
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }

    /**
     * 播放庆祝音效
     * @private
     */
    _playCelebrationSound() {
        // 如果有全局音频播放器，可以播放庆祝音效
        // 这里使用 Web Audio API 创建简单的庆祝音效
        try {
            if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                const audioContext = new AudioContextClass();
                
                // 创建简单的"叮"声音效
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
                oscillator.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.1); // C#6
                oscillator.frequency.setValueAtTime(1318.51, audioContext.currentTime + 0.2); // E6
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
            }
        } catch (error) {
            // 音效播放失败不影响主功能
            console.log('ProgressTracker: 庆祝音效播放失败', error);
        }
    }

    /**
     * 获取随机鼓励信息
     * @returns {Object} 鼓励信息对象 { title, message, emoji }
     */
    getRandomEncourageMessage() {
        const messages = [
            { title: '太棒了！', message: '你完成了这节课的学习！', emoji: '🎉' },
            { title: '真厉害！', message: '继续加油，你是最棒的！', emoji: '🌟' },
            { title: '好极了！', message: '学习小达人就是你！', emoji: '🏆' },
            { title: '超级棒！', message: '你的努力得到了回报！', emoji: '💪' },
            { title: '恭喜你！', message: '又完成了一课，继续前进！', emoji: '🚀' },
            { title: '了不起！', message: '你是学习小明星！', emoji: '⭐' },
            { title: '棒棒哒！', message: '每天进步一点点！', emoji: '🎯' }
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    /**
     * 检查是否应该显示祝贺（用于测试）
     * @param {string} lessonId - 课程ID
     * @returns {boolean} 是否应该显示祝贺
     */
    shouldShowCongratulations(lessonId) {
        if (!lessonId || !this._currentTextbookId || !this._storageManager) {
            return false;
        }
        
        // 检查课程是否刚刚完成（之前未完成，现在完成）
        return this._storageManager.isLessonCompleted(this._currentTextbookId, lessonId);
    }

    // ==================== 事件回调 ====================

    /**
     * 设置祝贺动画回调
     * @param {Function} callback - 回调函数
     */
    onCongratulations(callback) {
        if (typeof callback === 'function') {
            this._onCongratulationsCallback = callback;
        }
    }

    /**
     * 设置进度更新回调
     * @param {Function} callback - 回调函数
     */
    onProgressUpdate(callback) {
        if (typeof callback === 'function') {
            this._onProgressUpdateCallback = callback;
        }
    }

    /**
     * 通知进度更新
     * @param {string} lessonId - 课程ID
     * @private
     */
    _notifyProgressUpdate(lessonId) {
        if (this._onProgressUpdateCallback) {
            this._onProgressUpdateCallback({
                textbookId: this._currentTextbookId,
                lessonId,
                completedLessons: this.getCompletedLessons()
            });
        }
    }

    // ==================== 进度数据持久化 ====================

    /**
     * 获取进度数据（用于显示）
     * @returns {object} 进度数据
     */
    getProgressData() {
        if (!this._currentTextbookId || !this._storageManager) {
            return {
                textbookId: null,
                completedLessons: [],
                totalCompletedCount: 0,
                lastStudyTime: null
            };
        }

        const record = this._storageManager.getLearningRecord(this._currentTextbookId);
        
        return {
            textbookId: this._currentTextbookId,
            completedLessons: this.getCompletedLessons(),
            totalCompletedCount: record ? record.totalCompletedLessons : 0,
            lastStudyTime: record ? record.lastStudyTime : null
        };
    }

    /**
     * 重置课程进度
     * @param {string} lessonId - 课程ID
     * @returns {boolean} 是否成功
     */
    resetLessonProgress(lessonId) {
        if (!lessonId || !this._currentTextbookId || !this._storageManager) {
            return false;
        }

        // 获取当前进度
        const progress = this._storageManager.getLessonProgress(
            this._currentTextbookId,
            lessonId
        );

        if (!progress) {
            return true; // 没有进度，视为成功
        }

        // 重置进度
        const resetProgress = {
            lessonId,
            visitedPages: [],
            isCompleted: false,
            lastVisitTime: Date.now()
        };

        return this._storageManager.saveLessonProgress(
            this._currentTextbookId,
            lessonId,
            resetProgress
        );
    }

    /**
     * 清除教材所有进度
     * @param {string} textbookId - 教材ID（可选，默认使用当前教材）
     * @returns {boolean} 是否成功
     */
    clearTextbookProgress(textbookId = null) {
        const targetTextbookId = textbookId || this._currentTextbookId;
        
        if (!targetTextbookId || !this._storageManager) {
            return false;
        }

        return this._storageManager.clearTextbookRecord(targetTextbookId);
    }
}

// 导出单例实例
const progressTracker = new ProgressTracker();

// 支持ES模块和CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProgressTracker, progressTracker };
}
