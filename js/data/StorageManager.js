/**
 * StorageManager - 本地存储管理器
 * 负责管理用户偏好设置和学习进度的本地存储
 * 
 * @class StorageManager
 */
class StorageManager {
    /**
     * 存储键常量
     * @static
     */
    static KEYS = {
        USER_PREFERENCES: 'ai_reading_pen_preferences',
        LEARNING_RECORDS: 'ai_reading_pen_learning_records'
    };

    /**
     * 默认用户偏好设置
     * @static
     */
    static DEFAULT_PREFERENCES = {
        selectedVoiceId: 'voice-female',
        lastSubjectId: undefined,
        lastTextbookId: undefined,
        fontSize: 'medium',
        animationsEnabled: true
    };

    constructor() {
        // 检查 localStorage 是否可用
        this._storageAvailable = this._checkStorageAvailable();
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 检查 localStorage 是否可用
     * @returns {boolean}
     * @private
     */
    _checkStorageAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 安全地从 localStorage 读取数据
     * @param {string} key - 存储键
     * @returns {any|null} 解析后的数据，失败返回 null
     * @private
     */
    _readFromStorage(key) {
        if (!this._storageAvailable) {
            console.warn('localStorage is not available');
            return null;
        }

        try {
            const data = localStorage.getItem(key);
            if (data === null) {
                return null;
            }
            return JSON.parse(data);
        } catch (e) {
            console.error(`Error reading from localStorage: ${e.message}`);
            return null;
        }
    }

    /**
     * 安全地写入数据到 localStorage
     * @param {string} key - 存储键
     * @param {any} data - 要存储的数据
     * @returns {boolean} 是否成功
     * @private
     */
    _writeToStorage(key, data) {
        if (!this._storageAvailable) {
            console.warn('localStorage is not available');
            return false;
        }

        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            // 处理存储已满的情况
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                console.warn('localStorage quota exceeded, attempting to clear old data');
                this._handleStorageFull();
                // 重试一次
                try {
                    localStorage.setItem(key, JSON.stringify(data));
                    return true;
                } catch (retryError) {
                    console.error('Failed to write to localStorage after cleanup');
                    return false;
                }
            }
            console.error(`Error writing to localStorage: ${e.message}`);
            return false;
        }
    }

    /**
     * 处理存储已满的情况
     * 清理旧数据，保留最近的学习记录
     * @private
     */
    _handleStorageFull() {
        const records = this._readFromStorage(StorageManager.KEYS.LEARNING_RECORDS);
        if (records && typeof records === 'object') {
            // 按最后学习时间排序，保留最近的5个教材记录
            const entries = Object.entries(records);
            if (entries.length > 5) {
                entries.sort((a, b) => (b[1].lastStudyTime || 0) - (a[1].lastStudyTime || 0));
                const recentRecords = {};
                entries.slice(0, 5).forEach(([key, value]) => {
                    recentRecords[key] = value;
                });
                this._writeToStorage(StorageManager.KEYS.LEARNING_RECORDS, recentRecords);
            }
        }
    }

    // ==================== 用户偏好设置方法 ====================

    /**
     * 获取用户偏好设置
     * @returns {UserPreferences} 用户偏好设置
     */
    getUserPreferences() {
        const stored = this._readFromStorage(StorageManager.KEYS.USER_PREFERENCES);
        
        // 合并默认值和存储的值
        return {
            ...StorageManager.DEFAULT_PREFERENCES,
            ...stored
        };
    }

    /**
     * 保存用户偏好设置
     * @param {Partial<UserPreferences>} preferences - 要保存的偏好设置
     * @returns {boolean} 是否成功
     */
    saveUserPreferences(preferences) {
        if (!preferences || typeof preferences !== 'object') {
            console.error('Invalid preferences object');
            return false;
        }

        const current = this.getUserPreferences();
        const updated = {
            ...current,
            ...preferences
        };

        // 验证数据
        if (!this._validatePreferences(updated)) {
            console.error('Invalid preferences data');
            return false;
        }

        return this._writeToStorage(StorageManager.KEYS.USER_PREFERENCES, updated);
    }

    /**
     * 验证偏好设置数据
     * @param {UserPreferences} preferences - 偏好设置
     * @returns {boolean} 是否有效
     * @private
     */
    _validatePreferences(preferences) {
        // 验证 fontSize
        const validFontSizes = ['small', 'medium', 'large'];
        if (preferences.fontSize && !validFontSizes.includes(preferences.fontSize)) {
            return false;
        }

        // 验证 animationsEnabled
        if (preferences.animationsEnabled !== undefined && 
            typeof preferences.animationsEnabled !== 'boolean') {
            return false;
        }

        return true;
    }

    /**
     * 获取选中的音色ID
     * @returns {string} 音色ID
     */
    getSelectedVoiceId() {
        const preferences = this.getUserPreferences();
        return preferences.selectedVoiceId;
    }

    /**
     * 保存选中的音色ID
     * @param {string} voiceId - 音色ID
     * @returns {boolean} 是否成功
     */
    saveSelectedVoiceId(voiceId) {
        if (!voiceId || typeof voiceId !== 'string') {
            console.error('Invalid voiceId');
            return false;
        }
        return this.saveUserPreferences({ selectedVoiceId: voiceId });
    }

    /**
     * 获取最后访问的学科ID
     * @returns {string|undefined} 学科ID
     */
    getLastSubjectId() {
        const preferences = this.getUserPreferences();
        return preferences.lastSubjectId;
    }

    /**
     * 保存最后访问的学科ID
     * @param {string} subjectId - 学科ID
     * @returns {boolean} 是否成功
     */
    saveLastSubjectId(subjectId) {
        return this.saveUserPreferences({ lastSubjectId: subjectId });
    }

    /**
     * 获取最后访问的教材ID
     * @returns {string|undefined} 教材ID
     */
    getLastTextbookId() {
        const preferences = this.getUserPreferences();
        return preferences.lastTextbookId;
    }

    /**
     * 保存最后访问的教材ID
     * @param {string} textbookId - 教材ID
     * @returns {boolean} 是否成功
     */
    saveLastTextbookId(textbookId) {
        return this.saveUserPreferences({ lastTextbookId: textbookId });
    }

    /**
     * 获取字体大小设置
     * @returns {'small' | 'medium' | 'large'} 字体大小
     */
    getFontSize() {
        const preferences = this.getUserPreferences();
        return preferences.fontSize;
    }

    /**
     * 保存字体大小设置
     * @param {'small' | 'medium' | 'large'} fontSize - 字体大小
     * @returns {boolean} 是否成功
     */
    saveFontSize(fontSize) {
        const validSizes = ['small', 'medium', 'large'];
        if (!validSizes.includes(fontSize)) {
            console.error('Invalid fontSize value');
            return false;
        }
        return this.saveUserPreferences({ fontSize });
    }

    /**
     * 获取动画启用状态
     * @returns {boolean} 是否启用动画
     */
    getAnimationsEnabled() {
        const preferences = this.getUserPreferences();
        return preferences.animationsEnabled;
    }

    /**
     * 保存动画启用状态
     * @param {boolean} enabled - 是否启用
     * @returns {boolean} 是否成功
     */
    saveAnimationsEnabled(enabled) {
        if (typeof enabled !== 'boolean') {
            console.error('Invalid enabled value');
            return false;
        }
        return this.saveUserPreferences({ animationsEnabled: enabled });
    }

    // ==================== 学习进度存储方法 ====================

    /**
     * 获取所有学习记录
     * @returns {Object.<string, LearningRecord>} 学习记录映射（按教材ID）
     */
    getAllLearningRecords() {
        const records = this._readFromStorage(StorageManager.KEYS.LEARNING_RECORDS);
        return records || {};
    }

    /**
     * 获取指定教材的学习记录
     * @param {string} textbookId - 教材ID
     * @returns {LearningRecord|null} 学习记录
     */
    getLearningRecord(textbookId) {
        if (!textbookId) {
            return null;
        }

        const records = this.getAllLearningRecords();
        return records[textbookId] || null;
    }

    /**
     * 保存学习记录
     * @param {string} textbookId - 教材ID
     * @param {LearningRecord} record - 学习记录
     * @returns {boolean} 是否成功
     */
    saveLearningRecord(textbookId, record) {
        if (!textbookId || !record) {
            console.error('Invalid textbookId or record');
            return false;
        }

        const records = this.getAllLearningRecords();
        records[textbookId] = {
            ...record,
            textbookId,
            lastStudyTime: Date.now()
        };

        return this._writeToStorage(StorageManager.KEYS.LEARNING_RECORDS, records);
    }

    /**
     * 获取课程进度
     * @param {string} textbookId - 教材ID
     * @param {string} lessonId - 课程ID
     * @returns {ProgressData|null} 进度数据
     */
    getLessonProgress(textbookId, lessonId) {
        if (!textbookId || !lessonId) {
            return null;
        }

        const record = this.getLearningRecord(textbookId);
        if (!record || !record.progress) {
            return null;
        }

        return record.progress[lessonId] || null;
    }

    /**
     * 保存课程进度
     * @param {string} textbookId - 教材ID
     * @param {string} lessonId - 课程ID
     * @param {ProgressData} progressData - 进度数据
     * @returns {boolean} 是否成功
     */
    saveLessonProgress(textbookId, lessonId, progressData) {
        if (!textbookId || !lessonId || !progressData) {
            console.error('Invalid parameters for saveLessonProgress');
            return false;
        }

        let record = this.getLearningRecord(textbookId);
        
        if (!record) {
            record = {
                textbookId,
                progress: {},
                totalCompletedLessons: 0,
                lastStudyTime: Date.now()
            };
        }

        // 更新进度数据
        record.progress[lessonId] = {
            ...progressData,
            lessonId,
            lastVisitTime: Date.now()
        };

        // 重新计算已完成课程数
        record.totalCompletedLessons = Object.values(record.progress)
            .filter(p => p.isCompleted).length;

        return this.saveLearningRecord(textbookId, record);
    }

    /**
     * 记录页面访问
     * @param {string} textbookId - 教材ID
     * @param {string} lessonId - 课程ID
     * @param {number} pageNumber - 页码
     * @returns {boolean} 是否成功
     */
    recordPageVisit(textbookId, lessonId, pageNumber) {
        if (!textbookId || !lessonId || typeof pageNumber !== 'number') {
            console.error('Invalid parameters for recordPageVisit');
            return false;
        }

        let progress = this.getLessonProgress(textbookId, lessonId);
        
        if (!progress) {
            progress = {
                lessonId,
                visitedPages: [],
                isCompleted: false,
                lastVisitTime: Date.now()
            };
        }

        // 添加页码（如果尚未访问）
        if (!progress.visitedPages.includes(pageNumber)) {
            progress.visitedPages.push(pageNumber);
            progress.visitedPages.sort((a, b) => a - b);
        }

        progress.lastVisitTime = Date.now();

        return this.saveLessonProgress(textbookId, lessonId, progress);
    }

    /**
     * 标记课程完成
     * @param {string} textbookId - 教材ID
     * @param {string} lessonId - 课程ID
     * @returns {boolean} 是否成功
     */
    markLessonCompleted(textbookId, lessonId) {
        if (!textbookId || !lessonId) {
            console.error('Invalid parameters for markLessonCompleted');
            return false;
        }

        let progress = this.getLessonProgress(textbookId, lessonId);
        
        if (!progress) {
            progress = {
                lessonId,
                visitedPages: [],
                isCompleted: false,
                lastVisitTime: Date.now()
            };
        }

        progress.isCompleted = true;
        progress.lastVisitTime = Date.now();

        return this.saveLessonProgress(textbookId, lessonId, progress);
    }

    /**
     * 检查课程是否完成
     * @param {string} textbookId - 教材ID
     * @param {string} lessonId - 课程ID
     * @returns {boolean} 是否完成
     */
    isLessonCompleted(textbookId, lessonId) {
        const progress = this.getLessonProgress(textbookId, lessonId);
        return progress ? progress.isCompleted : false;
    }

    /**
     * 获取已访问的页码列表
     * @param {string} textbookId - 教材ID
     * @param {string} lessonId - 课程ID
     * @returns {number[]} 已访问页码列表
     */
    getVisitedPages(textbookId, lessonId) {
        const progress = this.getLessonProgress(textbookId, lessonId);
        return progress ? progress.visitedPages : [];
    }

    /**
     * 获取教材的已完成课程数
     * @param {string} textbookId - 教材ID
     * @returns {number} 已完成课程数
     */
    getCompletedLessonsCount(textbookId) {
        const record = this.getLearningRecord(textbookId);
        return record ? record.totalCompletedLessons : 0;
    }

    /**
     * 获取教材的最后学习时间
     * @param {string} textbookId - 教材ID
     * @returns {number|null} 时间戳
     */
    getLastStudyTime(textbookId) {
        const record = this.getLearningRecord(textbookId);
        return record ? record.lastStudyTime : null;
    }

    // ==================== 数据管理方法 ====================

    /**
     * 清除所有用户偏好设置
     * @returns {boolean} 是否成功
     */
    clearUserPreferences() {
        if (!this._storageAvailable) {
            return false;
        }
        try {
            localStorage.removeItem(StorageManager.KEYS.USER_PREFERENCES);
            return true;
        } catch (e) {
            console.error(`Error clearing preferences: ${e.message}`);
            return false;
        }
    }

    /**
     * 清除所有学习记录
     * @returns {boolean} 是否成功
     */
    clearLearningRecords() {
        if (!this._storageAvailable) {
            return false;
        }
        try {
            localStorage.removeItem(StorageManager.KEYS.LEARNING_RECORDS);
            return true;
        } catch (e) {
            console.error(`Error clearing learning records: ${e.message}`);
            return false;
        }
    }

    /**
     * 清除指定教材的学习记录
     * @param {string} textbookId - 教材ID
     * @returns {boolean} 是否成功
     */
    clearTextbookRecord(textbookId) {
        if (!textbookId) {
            return false;
        }

        const records = this.getAllLearningRecords();
        if (records[textbookId]) {
            delete records[textbookId];
            return this._writeToStorage(StorageManager.KEYS.LEARNING_RECORDS, records);
        }
        return true;
    }

    /**
     * 清除所有本地存储数据
     * @returns {boolean} 是否成功
     */
    clearAll() {
        const prefsCleared = this.clearUserPreferences();
        const recordsCleared = this.clearLearningRecords();
        return prefsCleared && recordsCleared;
    }

    /**
     * 检查存储是否可用
     * @returns {boolean} 是否可用
     */
    isStorageAvailable() {
        return this._storageAvailable;
    }

    /**
     * 获取存储使用情况
     * @returns {object} 存储统计信息
     */
    getStorageStats() {
        if (!this._storageAvailable) {
            return { available: false };
        }

        const prefsData = localStorage.getItem(StorageManager.KEYS.USER_PREFERENCES) || '';
        const recordsData = localStorage.getItem(StorageManager.KEYS.LEARNING_RECORDS) || '';

        return {
            available: true,
            preferencesSize: prefsData.length,
            learningRecordsSize: recordsData.length,
            totalSize: prefsData.length + recordsData.length
        };
    }

    /**
     * 导出所有数据（用于备份）
     * @returns {object} 所有存储的数据
     */
    exportData() {
        return {
            preferences: this.getUserPreferences(),
            learningRecords: this.getAllLearningRecords(),
            exportTime: Date.now()
        };
    }

    /**
     * 导入数据（用于恢复）
     * @param {object} data - 要导入的数据
     * @returns {boolean} 是否成功
     */
    importData(data) {
        if (!data || typeof data !== 'object') {
            console.error('Invalid import data');
            return false;
        }

        let success = true;

        if (data.preferences) {
            success = this.saveUserPreferences(data.preferences) && success;
        }

        if (data.learningRecords) {
            success = this._writeToStorage(
                StorageManager.KEYS.LEARNING_RECORDS, 
                data.learningRecords
            ) && success;
        }

        return success;
    }
}

// 导出单例实例
const storageManager = new StorageManager();

// 支持ES模块和CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager, storageManager };
}
