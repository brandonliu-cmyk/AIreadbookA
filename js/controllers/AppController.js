/**
 * AppController - 应用控制器
 * 主控制器，负责协调各模块间的交互和页面导航
 * 
 * Requirements: 1.3, 3.3
 */

// ========================================
// 页面类型枚举
// ========================================
const PageType = Object.freeze({
    HOME: 'home',
    SUBJECT: 'subject',
    TEXTBOOK: 'textbook',
    CHAPTER: 'chapter',
    READING: 'reading',
    SETTINGS: 'settings'
});

/**
 * 应用状态接口
 * @typedef {Object} AppState
 * @property {string} currentPage - 当前页面类型
 * @property {Object|null} selectedSubject - 选中的学科
 * @property {Object|null} selectedTextbook - 选中的教材
 * @property {Object|null} selectedLesson - 选中的课程
 * @property {number} currentPageNumber - 当前页码
 * @property {Object|null} selectedVoice - 选中的音色
 * @property {boolean} isPlaying - 是否正在播放
 * @property {boolean} isLoading - 是否正在加载
 */

/**
 * AppController类
 * 管理应用状态、页面导航和事件通信
 */
class AppController {
    /**
     * 创建AppController实例
     */
    constructor() {
        /**
         * 应用状态
         * @type {AppState}
         * @private
         */
        this._state = {
            currentPage: PageType.HOME,
            selectedSubject: null,
            selectedTextbook: null,
            selectedLesson: null,
            currentPageNumber: 1,
            selectedVoice: null,
            isPlaying: false,
            isLoading: false
        };

        /**
         * 事件监听器映射
         * @type {Map<string, Set<Function>>}
         * @private
         */
        this._eventListeners = new Map();

        /**
         * 是否已初始化
         * @type {boolean}
         * @private
         */
        this._initialized = false;

        /**
         * 页面返回映射
         * @type {Object}
         * @private
         */
        this._backPageMap = {
            [PageType.SUBJECT]: PageType.HOME,
            [PageType.TEXTBOOK]: PageType.HOME,
            [PageType.CHAPTER]: PageType.TEXTBOOK,
            [PageType.READING]: PageType.TEXTBOOK,
            [PageType.SETTINGS]: PageType.HOME
        };

        /**
         * 进入设置页面前的来源页面
         * @type {string|null}
         * @private
         */
        this._settingsReturnPage = null;
        this._settingsReturnState = null;

        /**
         * 调试模式
         * @type {boolean}
         * @private
         */
        this._debug = true;
    }

    /**
     * 初始化应用
     * 加载用户偏好设置，设置初始状态
     */
    init() {
        if (this._initialized) {
            this._log('AppController已经初始化');
            return;
        }

        this._log('正在初始化AppController...');

        // 从本地存储加载用户偏好
        this._loadUserPreferences();

        // 标记为已初始化
        this._initialized = true;

        // 触发初始化完成事件
        this.emit('app:initialized', { state: this.getCurrentState() });

        this._log('AppController初始化完成');
    }

    /**
     * 导航到指定页面
     * @param {string} page - 页面类型（PageType枚举值）
     * @param {Object} [params={}] - 页面参数
     * @param {Object} [params.subject] - 学科对象
     * @param {Object} [params.textbook] - 教材对象
     * @param {Object} [params.lesson] - 课程对象
     * @param {number} [params.pageNumber] - 页码
     */
    navigateTo(page, params = {}) {
        // 验证页面类型
        if (!this._isValidPageType(page)) {
            console.error(`无效的页面类型: ${page}`);
            return;
        }

        const previousPage = this._state.currentPage;
        const previousState = this.getCurrentState();

        this._log(`导航: ${previousPage} -> ${page}`, params);

        // 进入设置页面时记录来源页面和状态
        if (page === PageType.SETTINGS && previousPage !== PageType.SETTINGS) {
            this._settingsReturnPage = previousPage;
            this._settingsReturnState = previousState;
        }

        // 更新当前页面
        this._state.currentPage = page;

        // 根据参数更新相关状态
        if (params.subject !== undefined) {
            this._state.selectedSubject = params.subject;
        }
        if (params.textbook !== undefined) {
            this._state.selectedTextbook = params.textbook;
        }
        if (params.lesson !== undefined) {
            this._state.selectedLesson = params.lesson;
        }
        if (params.pageNumber !== undefined) {
            this._state.currentPageNumber = params.pageNumber;
        }

        // 触发导航事件
        this.emit('navigation:change', {
            from: previousPage,
            to: page,
            params: params,
            previousState: previousState,
            currentState: this.getCurrentState()
        });

        // 触发特定页面进入事件
        this.emit(`page:${page}:enter`, {
            params: params,
            state: this.getCurrentState()
        });
    }

    /**
     * 返回上一页
     * @returns {boolean} 是否成功返回
     */
    goBack() {
        const currentPage = this._state.currentPage;

        // 从设置页面返回时，回到进入设置前的页面
        if (currentPage === PageType.SETTINGS && this._settingsReturnPage) {
            const returnPage = this._settingsReturnPage;
            const returnState = this._settingsReturnState;
            this._settingsReturnPage = null;
            this._settingsReturnState = null;

            // 恢复之前的状态参数
            const params = {};
            if (returnState) {
                if (returnState.selectedSubject) params.subject = returnState.selectedSubject;
                if (returnState.selectedTextbook) params.textbook = returnState.selectedTextbook;
                if (returnState.selectedLesson) params.lesson = returnState.selectedLesson;
                if (returnState.currentPageNumber) params.pageNumber = returnState.currentPageNumber;
            }
            this.navigateTo(returnPage, params);
            return true;
        }

        const targetPage = this._backPageMap[currentPage];

        if (!targetPage) {
            this._log('已经在首页，无法返回');
            return false;
        }

        this.navigateTo(targetPage);
        return true;
    }

    /**
     * 获取当前页面状态
     * @returns {AppState} 当前应用状态的副本
     */
    getCurrentState() {
        // 返回状态的深拷贝，防止外部直接修改
        return {
            currentPage: this._state.currentPage,
            selectedSubject: this._state.selectedSubject ? { ...this._state.selectedSubject } : null,
            selectedTextbook: this._state.selectedTextbook ? { ...this._state.selectedTextbook } : null,
            selectedLesson: this._state.selectedLesson ? { ...this._state.selectedLesson } : null,
            currentPageNumber: this._state.currentPageNumber,
            selectedVoice: this._state.selectedVoice ? { ...this._state.selectedVoice } : null,
            isPlaying: this._state.isPlaying,
            isLoading: this._state.isLoading
        };
    }

    /**
     * 注册事件监听
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消订阅的函数
     */
    on(event, callback) {
        if (typeof event !== 'string' || !event.trim()) {
            console.error('事件名称必须是非空字符串');
            return () => {};
        }

        if (typeof callback !== 'function') {
            console.error('回调必须是函数');
            return () => {};
        }

        // 获取或创建事件的监听器集合
        if (!this._eventListeners.has(event)) {
            this._eventListeners.set(event, new Set());
        }

        const listeners = this._eventListeners.get(event);
        listeners.add(callback);

        this._log(`注册事件监听: ${event}, 当前监听器数量: ${listeners.size}`);

        // 返回取消订阅的函数
        return () => {
            this.off(event, callback);
        };
    }

    /**
     * 取消事件监听
     * @param {string} event - 事件名称
     * @param {Function} callback - 要移除的回调函数
     * @returns {boolean} 是否成功移除
     */
    off(event, callback) {
        const listeners = this._eventListeners.get(event);
        if (!listeners) {
            return false;
        }

        const removed = listeners.delete(callback);
        
        // 如果没有监听器了，删除事件键
        if (listeners.size === 0) {
            this._eventListeners.delete(event);
        }

        if (removed) {
            this._log(`移除事件监听: ${event}`);
        }

        return removed;
    }

    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {*} [data] - 事件数据
     */
    emit(event, data) {
        if (typeof event !== 'string' || !event.trim()) {
            console.error('事件名称必须是非空字符串');
            return;
        }

        const listeners = this._eventListeners.get(event);
        
        this._log(`触发事件: ${event}`, data);

        if (!listeners || listeners.size === 0) {
            return;
        }

        // 遍历并调用所有监听器
        listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`事件处理器错误 [${event}]:`, error);
            }
        });
    }

    /**
     * 一次性事件监听（触发后自动移除）
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消订阅的函数
     */
    once(event, callback) {
        const wrappedCallback = (data) => {
            this.off(event, wrappedCallback);
            callback(data);
        };

        return this.on(event, wrappedCallback);
    }

    /**
     * 设置加载状态
     * @param {boolean} isLoading - 是否正在加载
     */
    setLoading(isLoading) {
        const previousLoading = this._state.isLoading;
        this._state.isLoading = isLoading;

        if (previousLoading !== isLoading) {
            this.emit('loading:change', { isLoading });
        }
    }

    /**
     * 设置播放状态
     * @param {boolean} isPlaying - 是否正在播放
     */
    setPlaying(isPlaying) {
        const previousPlaying = this._state.isPlaying;
        this._state.isPlaying = isPlaying;

        if (previousPlaying !== isPlaying) {
            this.emit('playing:change', { isPlaying });
        }
    }

    /**
     * 设置选中的音色
     * @param {Object} voice - 音色对象
     */
    setSelectedVoice(voice) {
        this._state.selectedVoice = voice;
        this.emit('voice:change', { voice });
    }

    /**
     * 更新当前页码
     * @param {number} pageNumber - 页码
     */
    setCurrentPageNumber(pageNumber) {
        if (typeof pageNumber !== 'number' || pageNumber < 1) {
            console.error('页码必须是大于0的数字');
            return;
        }

        const previousPageNumber = this._state.currentPageNumber;
        this._state.currentPageNumber = pageNumber;

        if (previousPageNumber !== pageNumber) {
            this.emit('pageNumber:change', {
                from: previousPageNumber,
                to: pageNumber
            });
        }
    }

    /**
     * 获取所有已注册的事件名称
     * @returns {string[]} 事件名称数组
     */
    getRegisteredEvents() {
        return Array.from(this._eventListeners.keys());
    }

    /**
     * 获取指定事件的监听器数量
     * @param {string} event - 事件名称
     * @returns {number} 监听器数量
     */
    getListenerCount(event) {
        const listeners = this._eventListeners.get(event);
        return listeners ? listeners.size : 0;
    }

    /**
     * 清除所有事件监听器
     */
    clearAllListeners() {
        this._eventListeners.clear();
        this._log('已清除所有事件监听器');
    }

    /**
     * 重置应用状态
     */
    reset() {
        this._state = {
            currentPage: PageType.HOME,
            selectedSubject: null,
            selectedTextbook: null,
            selectedLesson: null,
            currentPageNumber: 1,
            selectedVoice: null,
            isPlaying: false,
            isLoading: false
        };

        this.emit('app:reset', { state: this.getCurrentState() });
        this._log('应用状态已重置');
    }

    /**
     * 设置调试模式
     * @param {boolean} enabled - 是否启用调试
     */
    setDebug(enabled) {
        this._debug = enabled;
    }

    // ========================================
    // 私有方法
    // ========================================

    /**
     * 验证页面类型是否有效
     * @param {string} page - 页面类型
     * @returns {boolean} 是否有效
     * @private
     */
    _isValidPageType(page) {
        return Object.values(PageType).includes(page);
    }

    /**
     * 从本地存储加载用户偏好
     * @private
     */
    _loadUserPreferences() {
        try {
            const preferencesStr = localStorage.getItem('ai_reading_userPreferences');
            if (preferencesStr) {
                const preferences = JSON.parse(preferencesStr);
                if (preferences.selectedVoiceId) {
                    this._state.selectedVoice = { id: preferences.selectedVoiceId };
                }
            }
        } catch (error) {
            console.warn('加载用户偏好失败:', error);
        }
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
                console.log(`[AppController] ${message}`, data);
            } else {
                console.log(`[AppController] ${message}`);
            }
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppController, PageType };
}
