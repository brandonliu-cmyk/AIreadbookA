/**
 * StorageManager 单元测试
 * 测试本地存储管理器的所有功能
 */

describe('StorageManager', () => {
    let storageManager;

    // 在每个测试前清理 localStorage 并创建新实例
    beforeEach(() => {
        localStorage.clear();
        // 创建新实例以确保干净的状态
        storageManager = new StorageManager();
    });

    // 在每个测试后清理
    afterEach(() => {
        localStorage.clear();
    });

    describe('存储可用性检查', () => {
        it('应该正确检测 localStorage 是否可用', () => {
            expect(storageManager.isStorageAvailable()).toBe(true);
        });
    });

    describe('用户偏好设置', () => {
        describe('getUserPreferences', () => {
            it('应该返回默认偏好设置（当没有存储数据时）', () => {
                const prefs = storageManager.getUserPreferences();
                
                expect(prefs.selectedVoiceId).toBe('voice-female');
                expect(prefs.fontSize).toBe('medium');
                expect(prefs.animationsEnabled).toBe(true);
                expect(prefs.lastSubjectId).toBeUndefined();
                expect(prefs.lastTextbookId).toBeUndefined();
            });

            it('应该返回存储的偏好设置', () => {
                storageManager.saveUserPreferences({
                    selectedVoiceId: 'voice-male',
                    fontSize: 'large'
                });

                const prefs = storageManager.getUserPreferences();
                
                expect(prefs.selectedVoiceId).toBe('voice-male');
                expect(prefs.fontSize).toBe('large');
                expect(prefs.animationsEnabled).toBe(true); // 默认值
            });
        });

        describe('saveUserPreferences', () => {
            it('应该成功保存偏好设置', () => {
                const result = storageManager.saveUserPreferences({
                    selectedVoiceId: 'voice-child',
                    fontSize: 'small',
                    animationsEnabled: false
                });

                expect(result).toBe(true);
                
                const prefs = storageManager.getUserPreferences();
                expect(prefs.selectedVoiceId).toBe('voice-child');
                expect(prefs.fontSize).toBe('small');
                expect(prefs.animationsEnabled).toBe(false);
            });

            it('应该拒绝无效的偏好设置对象', () => {
                const result = storageManager.saveUserPreferences(null);
                expect(result).toBe(false);
            });

            it('应该拒绝无效的 fontSize 值', () => {
                const result = storageManager.saveUserPreferences({
                    fontSize: 'invalid'
                });
                expect(result).toBe(false);
            });

            it('应该拒绝无效的 animationsEnabled 值', () => {
                const result = storageManager.saveUserPreferences({
                    animationsEnabled: 'yes'
                });
                expect(result).toBe(false);
            });

            it('应该合并新旧偏好设置', () => {
                storageManager.saveUserPreferences({ selectedVoiceId: 'voice-male' });
                storageManager.saveUserPreferences({ fontSize: 'large' });

                const prefs = storageManager.getUserPreferences();
                expect(prefs.selectedVoiceId).toBe('voice-male');
                expect(prefs.fontSize).toBe('large');
            });
        });

        describe('音色选择', () => {
            it('应该正确获取默认音色ID', () => {
                expect(storageManager.getSelectedVoiceId()).toBe('voice-female');
            });

            it('应该正确保存和获取音色ID', () => {
                const result = storageManager.saveSelectedVoiceId('voice-child');
                expect(result).toBe(true);
                expect(storageManager.getSelectedVoiceId()).toBe('voice-child');
            });

            it('应该拒绝无效的音色ID', () => {
                const result = storageManager.saveSelectedVoiceId('');
                expect(result).toBe(false);
            });

            it('应该拒绝非字符串的音色ID', () => {
                const result = storageManager.saveSelectedVoiceId(123);
                expect(result).toBe(false);
            });
        });

        describe('最后访问记录', () => {
            it('应该正确保存和获取最后访问的学科ID', () => {
                storageManager.saveLastSubjectId('english');
                expect(storageManager.getLastSubjectId()).toBe('english');
            });

            it('应该正确保存和获取最后访问的教材ID', () => {
                storageManager.saveLastTextbookId('english-pep-3-1');
                expect(storageManager.getLastTextbookId()).toBe('english-pep-3-1');
            });
        });

        describe('字体大小设置', () => {
            it('应该正确获取默认字体大小', () => {
                expect(storageManager.getFontSize()).toBe('medium');
            });

            it('应该正确保存和获取字体大小', () => {
                storageManager.saveFontSize('large');
                expect(storageManager.getFontSize()).toBe('large');
            });

            it('应该拒绝无效的字体大小', () => {
                const result = storageManager.saveFontSize('extra-large');
                expect(result).toBe(false);
            });
        });

        describe('动画设置', () => {
            it('应该正确获取默认动画状态', () => {
                expect(storageManager.getAnimationsEnabled()).toBe(true);
            });

            it('应该正确保存和获取动画状态', () => {
                storageManager.saveAnimationsEnabled(false);
                expect(storageManager.getAnimationsEnabled()).toBe(false);
            });

            it('应该拒绝非布尔值', () => {
                const result = storageManager.saveAnimationsEnabled('false');
                expect(result).toBe(false);
            });
        });
    });

    describe('学习进度存储', () => {
        const textbookId = 'english-pep-3-1';
        const lessonId = 'english-pep-3-1-unit1-lesson1';

        describe('getLearningRecord / saveLearningRecord', () => {
            it('应该返回 null（当没有记录时）', () => {
                expect(storageManager.getLearningRecord(textbookId)).toBeNull();
            });

            it('应该正确保存和获取学习记录', () => {
                const record = {
                    textbookId,
                    progress: {},
                    totalCompletedLessons: 0,
                    lastStudyTime: Date.now()
                };

                const result = storageManager.saveLearningRecord(textbookId, record);
                expect(result).toBe(true);

                const retrieved = storageManager.getLearningRecord(textbookId);
                expect(retrieved).not.toBeNull();
                expect(retrieved.textbookId).toBe(textbookId);
            });

            it('应该拒绝无效的参数', () => {
                expect(storageManager.saveLearningRecord(null, {})).toBe(false);
                expect(storageManager.saveLearningRecord(textbookId, null)).toBe(false);
            });
        });

        describe('getAllLearningRecords', () => {
            it('应该返回空对象（当没有记录时）', () => {
                const records = storageManager.getAllLearningRecords();
                expect(records).toEqual({});
            });

            it('应该返回所有学习记录', () => {
                storageManager.saveLearningRecord('textbook-1', { progress: {} });
                storageManager.saveLearningRecord('textbook-2', { progress: {} });

                const records = storageManager.getAllLearningRecords();
                expect(Object.keys(records)).toHaveLength(2);
                expect(records['textbook-1']).toBeDefined();
                expect(records['textbook-2']).toBeDefined();
            });
        });

        describe('课程进度', () => {
            it('应该返回 null（当没有进度时）', () => {
                expect(storageManager.getLessonProgress(textbookId, lessonId)).toBeNull();
            });

            it('应该正确保存和获取课程进度', () => {
                const progressData = {
                    lessonId,
                    visitedPages: [1, 2],
                    isCompleted: false,
                    lastVisitTime: Date.now()
                };

                const result = storageManager.saveLessonProgress(textbookId, lessonId, progressData);
                expect(result).toBe(true);

                const retrieved = storageManager.getLessonProgress(textbookId, lessonId);
                expect(retrieved).not.toBeNull();
                expect(retrieved.lessonId).toBe(lessonId);
                expect(retrieved.visitedPages).toEqual([1, 2]);
            });

            it('应该拒绝无效的参数', () => {
                expect(storageManager.saveLessonProgress(null, lessonId, {})).toBe(false);
                expect(storageManager.saveLessonProgress(textbookId, null, {})).toBe(false);
                expect(storageManager.saveLessonProgress(textbookId, lessonId, null)).toBe(false);
            });
        });

        describe('recordPageVisit', () => {
            it('应该正确记录页面访问', () => {
                storageManager.recordPageVisit(textbookId, lessonId, 1);
                
                const pages = storageManager.getVisitedPages(textbookId, lessonId);
                expect(pages).toContain(1);
            });

            it('应该避免重复记录同一页面', () => {
                storageManager.recordPageVisit(textbookId, lessonId, 1);
                storageManager.recordPageVisit(textbookId, lessonId, 1);
                
                const pages = storageManager.getVisitedPages(textbookId, lessonId);
                expect(pages.filter(p => p === 1)).toHaveLength(1);
            });

            it('应该按顺序排列已访问页码', () => {
                storageManager.recordPageVisit(textbookId, lessonId, 3);
                storageManager.recordPageVisit(textbookId, lessonId, 1);
                storageManager.recordPageVisit(textbookId, lessonId, 2);
                
                const pages = storageManager.getVisitedPages(textbookId, lessonId);
                expect(pages).toEqual([1, 2, 3]);
            });

            it('应该拒绝无效的参数', () => {
                expect(storageManager.recordPageVisit(null, lessonId, 1)).toBe(false);
                expect(storageManager.recordPageVisit(textbookId, null, 1)).toBe(false);
                expect(storageManager.recordPageVisit(textbookId, lessonId, 'page1')).toBe(false);
            });
        });

        describe('课程完成状态', () => {
            it('应该正确标记课程完成', () => {
                storageManager.markLessonCompleted(textbookId, lessonId);
                
                expect(storageManager.isLessonCompleted(textbookId, lessonId)).toBe(true);
            });

            it('应该返回 false（当课程未完成时）', () => {
                expect(storageManager.isLessonCompleted(textbookId, lessonId)).toBe(false);
            });

            it('应该正确计算已完成课程数', () => {
                storageManager.markLessonCompleted(textbookId, 'lesson-1');
                storageManager.markLessonCompleted(textbookId, 'lesson-2');
                
                expect(storageManager.getCompletedLessonsCount(textbookId)).toBe(2);
            });

            it('应该拒绝无效的参数', () => {
                expect(storageManager.markLessonCompleted(null, lessonId)).toBe(false);
                expect(storageManager.markLessonCompleted(textbookId, null)).toBe(false);
            });
        });

        describe('getLastStudyTime', () => {
            it('应该返回 null（当没有记录时）', () => {
                expect(storageManager.getLastStudyTime(textbookId)).toBeNull();
            });

            it('应该返回最后学习时间', () => {
                storageManager.recordPageVisit(textbookId, lessonId, 1);
                
                const lastTime = storageManager.getLastStudyTime(textbookId);
                expect(lastTime).not.toBeNull();
                expect(typeof lastTime).toBe('number');
            });
        });
    });

    describe('数据管理', () => {
        describe('clearUserPreferences', () => {
            it('应该清除用户偏好设置', () => {
                storageManager.saveUserPreferences({ selectedVoiceId: 'voice-male' });
                storageManager.clearUserPreferences();
                
                // 应该返回默认值
                expect(storageManager.getSelectedVoiceId()).toBe('voice-female');
            });
        });

        describe('clearLearningRecords', () => {
            it('应该清除所有学习记录', () => {
                storageManager.recordPageVisit('textbook-1', 'lesson-1', 1);
                storageManager.recordPageVisit('textbook-2', 'lesson-2', 1);
                storageManager.clearLearningRecords();
                
                expect(storageManager.getAllLearningRecords()).toEqual({});
            });
        });

        describe('clearTextbookRecord', () => {
            it('应该清除指定教材的学习记录', () => {
                storageManager.recordPageVisit('textbook-1', 'lesson-1', 1);
                storageManager.recordPageVisit('textbook-2', 'lesson-2', 1);
                storageManager.clearTextbookRecord('textbook-1');
                
                expect(storageManager.getLearningRecord('textbook-1')).toBeNull();
                expect(storageManager.getLearningRecord('textbook-2')).not.toBeNull();
            });

            it('应该返回 true（当教材不存在时）', () => {
                expect(storageManager.clearTextbookRecord('non-existent')).toBe(true);
            });
        });

        describe('clearAll', () => {
            it('应该清除所有数据', () => {
                storageManager.saveUserPreferences({ selectedVoiceId: 'voice-male' });
                storageManager.recordPageVisit('textbook-1', 'lesson-1', 1);
                
                storageManager.clearAll();
                
                expect(storageManager.getSelectedVoiceId()).toBe('voice-female');
                expect(storageManager.getAllLearningRecords()).toEqual({});
            });
        });
    });

    describe('存储统计', () => {
        it('应该返回存储统计信息', () => {
            storageManager.saveUserPreferences({ selectedVoiceId: 'voice-male' });
            
            const stats = storageManager.getStorageStats();
            
            expect(stats.available).toBe(true);
            expect(typeof stats.preferencesSize).toBe('number');
            expect(typeof stats.learningRecordsSize).toBe('number');
            expect(typeof stats.totalSize).toBe('number');
        });
    });

    describe('数据导入导出', () => {
        it('应该正确导出数据', () => {
            storageManager.saveUserPreferences({ selectedVoiceId: 'voice-male' });
            storageManager.recordPageVisit('textbook-1', 'lesson-1', 1);
            
            const exported = storageManager.exportData();
            
            expect(exported.preferences).toBeDefined();
            expect(exported.preferences.selectedVoiceId).toBe('voice-male');
            expect(exported.learningRecords).toBeDefined();
            expect(exported.exportTime).toBeDefined();
        });

        it('应该正确导入数据', () => {
            const data = {
                preferences: {
                    selectedVoiceId: 'voice-child',
                    fontSize: 'large'
                },
                learningRecords: {
                    'textbook-1': {
                        textbookId: 'textbook-1',
                        progress: {},
                        totalCompletedLessons: 0,
                        lastStudyTime: Date.now()
                    }
                }
            };
            
            const result = storageManager.importData(data);
            expect(result).toBe(true);
            
            expect(storageManager.getSelectedVoiceId()).toBe('voice-child');
            expect(storageManager.getFontSize()).toBe('large');
            expect(storageManager.getLearningRecord('textbook-1')).not.toBeNull();
        });

        it('应该拒绝无效的导入数据', () => {
            expect(storageManager.importData(null)).toBe(false);
            expect(storageManager.importData('invalid')).toBe(false);
        });
    });

    describe('Property 16: 音色偏好持久化往返', () => {
        it('保存音色后获取应返回相同的音色ID', () => {
            const voiceIds = ['voice-female', 'voice-male', 'voice-child'];
            
            voiceIds.forEach(voiceId => {
                storageManager.saveSelectedVoiceId(voiceId);
                expect(storageManager.getSelectedVoiceId()).toBe(voiceId);
            });
        });
    });

    describe('Property 19: 进度记录往返', () => {
        it('记录页面访问后查询应包含该页面', () => {
            const textbookId = 'test-textbook';
            const lessonId = 'test-lesson';
            const pages = [1, 2, 3, 5, 10];
            
            pages.forEach(page => {
                storageManager.recordPageVisit(textbookId, lessonId, page);
                const visitedPages = storageManager.getVisitedPages(textbookId, lessonId);
                expect(visitedPages).toContain(page);
            });
        });
    });
});
