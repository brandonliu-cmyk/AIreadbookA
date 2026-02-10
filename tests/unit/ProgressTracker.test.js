/**
 * ProgressTracker 单元测试
 * 测试进度追踪器的所有功能
 * 
 * Validates: Requirements 9.1
 */

const { ProgressTracker } = require('../../js/components/ProgressTracker');

describe('ProgressTracker', () => {
    let progressTracker;
    let mockStorageManager;
    let mockDataManager;

    // 模拟数据
    const mockChapters = [
        {
            id: 'chapter-1',
            textbookId: 'textbook-1',
            name: 'Chapter 1',
            order: 1,
            lessons: [
                { id: 'lesson-1', chapterId: 'chapter-1', name: 'Lesson 1', order: 1, totalPages: 3 },
                { id: 'lesson-2', chapterId: 'chapter-1', name: 'Lesson 2', order: 2, totalPages: 2 }
            ]
        },
        {
            id: 'chapter-2',
            textbookId: 'textbook-1',
            name: 'Chapter 2',
            order: 2,
            lessons: [
                { id: 'lesson-3', chapterId: 'chapter-2', name: 'Lesson 3', order: 1, totalPages: 4 }
            ]
        }
    ];

    // 创建模拟的 StorageManager
    function createMockStorageManager() {
        const storage = {
            learningRecords: {}
        };

        return {
            recordPageVisit: jest.fn((textbookId, lessonId, pageNumber) => {
                if (!textbookId || !lessonId || typeof pageNumber !== 'number') {
                    return false;
                }
                
                if (!storage.learningRecords[textbookId]) {
                    storage.learningRecords[textbookId] = { progress: {} };
                }
                if (!storage.learningRecords[textbookId].progress[lessonId]) {
                    storage.learningRecords[textbookId].progress[lessonId] = {
                        lessonId,
                        visitedPages: [],
                        isCompleted: false,
                        lastVisitTime: Date.now()
                    };
                }
                
                const progress = storage.learningRecords[textbookId].progress[lessonId];
                if (!progress.visitedPages.includes(pageNumber)) {
                    progress.visitedPages.push(pageNumber);
                    progress.visitedPages.sort((a, b) => a - b);
                }
                return true;
            }),

            getVisitedPages: jest.fn((textbookId, lessonId) => {
                const record = storage.learningRecords[textbookId];
                if (!record || !record.progress || !record.progress[lessonId]) {
                    return [];
                }
                return record.progress[lessonId].visitedPages || [];
            }),

            markLessonCompleted: jest.fn((textbookId, lessonId) => {
                if (!textbookId || !lessonId) {
                    return false;
                }
                
                if (!storage.learningRecords[textbookId]) {
                    storage.learningRecords[textbookId] = { progress: {}, totalCompletedLessons: 0 };
                }
                if (!storage.learningRecords[textbookId].progress[lessonId]) {
                    storage.learningRecords[textbookId].progress[lessonId] = {
                        lessonId,
                        visitedPages: [],
                        isCompleted: false,
                        lastVisitTime: Date.now()
                    };
                }
                
                storage.learningRecords[textbookId].progress[lessonId].isCompleted = true;
                
                // 更新完成计数
                storage.learningRecords[textbookId].totalCompletedLessons = 
                    Object.values(storage.learningRecords[textbookId].progress)
                        .filter(p => p.isCompleted).length;
                
                return true;
            }),

            isLessonCompleted: jest.fn((textbookId, lessonId) => {
                const record = storage.learningRecords[textbookId];
                if (!record || !record.progress || !record.progress[lessonId]) {
                    return false;
                }
                return record.progress[lessonId].isCompleted || false;
            }),

            getLearningRecord: jest.fn((textbookId) => {
                return storage.learningRecords[textbookId] || null;
            }),

            getLessonProgress: jest.fn((textbookId, lessonId) => {
                const record = storage.learningRecords[textbookId];
                if (!record || !record.progress) {
                    return null;
                }
                return record.progress[lessonId] || null;
            }),

            saveLessonProgress: jest.fn((textbookId, lessonId, progressData) => {
                if (!textbookId || !lessonId || !progressData) {
                    return false;
                }
                
                if (!storage.learningRecords[textbookId]) {
                    storage.learningRecords[textbookId] = { progress: {}, totalCompletedLessons: 0 };
                }
                
                storage.learningRecords[textbookId].progress[lessonId] = progressData;
                return true;
            }),

            clearTextbookRecord: jest.fn((textbookId) => {
                if (storage.learningRecords[textbookId]) {
                    delete storage.learningRecords[textbookId];
                }
                return true;
            }),

            // 用于测试的辅助方法
            _getStorage: () => storage,
            _clearStorage: () => { storage.learningRecords = {}; }
        };
    }

    // 创建模拟的 DataManager
    function createMockDataManager() {
        return {
            getChapters: jest.fn(async (textbookId) => {
                if (textbookId === 'textbook-1') {
                    return mockChapters;
                }
                return [];
            })
        };
    }

    beforeEach(() => {
        mockStorageManager = createMockStorageManager();
        mockDataManager = createMockDataManager();
        progressTracker = new ProgressTracker(mockStorageManager, mockDataManager);
    });

    afterEach(() => {
        mockStorageManager._clearStorage();
    });

    describe('构造函数', () => {
        it('应该正确创建实例', () => {
            expect(progressTracker).toBeDefined();
        });

        it('应该接受自定义的 StorageManager 和 DataManager', () => {
            const customStorage = createMockStorageManager();
            const customData = createMockDataManager();
            const tracker = new ProgressTracker(customStorage, customData);
            
            expect(tracker).toBeDefined();
        });
    });

    describe('上下文管理', () => {
        describe('setCurrentTextbook / getCurrentTextbookId', () => {
            it('应该正确设置和获取当前教材ID', () => {
                progressTracker.setCurrentTextbook('textbook-1');
                expect(progressTracker.getCurrentTextbookId()).toBe('textbook-1');
            });

            it('初始状态应该返回 null', () => {
                expect(progressTracker.getCurrentTextbookId()).toBeNull();
            });
        });

        describe('setCurrentLesson / getCurrentLessonId', () => {
            it('应该正确设置和获取当前课程ID', () => {
                progressTracker.setCurrentLesson('lesson-1');
                expect(progressTracker.getCurrentLessonId()).toBe('lesson-1');
            });

            it('初始状态应该返回 null', () => {
                expect(progressTracker.getCurrentLessonId()).toBeNull();
            });
        });
    });

    describe('页面访问记录', () => {
        beforeEach(() => {
            progressTracker.setCurrentTextbook('textbook-1');
        });

        describe('recordPageVisit', () => {
            it('应该成功记录页面访问', () => {
                const result = progressTracker.recordPageVisit('lesson-1', 1);
                
                expect(result).toBe(true);
                expect(mockStorageManager.recordPageVisit).toHaveBeenCalledWith('textbook-1', 'lesson-1', 1);
            });

            it('应该拒绝无效的课程ID', () => {
                const result = progressTracker.recordPageVisit(null, 1);
                expect(result).toBe(false);
            });

            it('应该拒绝无效的页码', () => {
                expect(progressTracker.recordPageVisit('lesson-1', 0)).toBe(false);
                expect(progressTracker.recordPageVisit('lesson-1', -1)).toBe(false);
                expect(progressTracker.recordPageVisit('lesson-1', 'page1')).toBe(false);
            });

            it('没有设置教材上下文时应该失败', () => {
                const tracker = new ProgressTracker(mockStorageManager, mockDataManager);
                const result = tracker.recordPageVisit('lesson-1', 1);
                expect(result).toBe(false);
            });

            it('应该记录多个页面访问', () => {
                progressTracker.recordPageVisit('lesson-1', 1);
                progressTracker.recordPageVisit('lesson-1', 2);
                progressTracker.recordPageVisit('lesson-1', 3);
                
                expect(mockStorageManager.recordPageVisit).toHaveBeenCalledTimes(3);
            });
        });

        describe('getVisitedPages', () => {
            it('应该返回已访问的页面列表', () => {
                progressTracker.recordPageVisit('lesson-1', 1);
                progressTracker.recordPageVisit('lesson-1', 3);
                
                const pages = progressTracker.getVisitedPages('lesson-1');
                
                expect(pages).toContain(1);
                expect(pages).toContain(3);
            });

            it('没有访问记录时应该返回空数组', () => {
                const pages = progressTracker.getVisitedPages('lesson-1');
                expect(pages).toEqual([]);
            });

            it('无效参数时应该返回空数组', () => {
                expect(progressTracker.getVisitedPages(null)).toEqual([]);
                expect(progressTracker.getVisitedPages('')).toEqual([]);
            });
        });
    });

    describe('课程完成检测', () => {
        beforeEach(() => {
            progressTracker.setCurrentTextbook('textbook-1');
        });

        describe('recordLessonComplete', () => {
            it('应该成功标记课程完成', () => {
                const result = progressTracker.recordLessonComplete('lesson-1');
                
                expect(result).toBe(true);
                expect(mockStorageManager.markLessonCompleted).toHaveBeenCalledWith('textbook-1', 'lesson-1');
            });

            it('应该拒绝无效的课程ID', () => {
                expect(progressTracker.recordLessonComplete(null)).toBe(false);
                expect(progressTracker.recordLessonComplete('')).toBe(false);
            });

            it('没有设置教材上下文时应该失败', () => {
                const tracker = new ProgressTracker(mockStorageManager, mockDataManager);
                const result = tracker.recordLessonComplete('lesson-1');
                expect(result).toBe(false);
            });

            it('首次完成时应该触发祝贺', () => {
                let congratulationsCalled = false;
                progressTracker.onCongratulations(() => {
                    congratulationsCalled = true;
                });
                
                progressTracker.recordLessonComplete('lesson-1');
                
                expect(congratulationsCalled).toBe(true);
            });

            it('重复完成时不应该再次触发祝贺', () => {
                let congratulationsCount = 0;
                progressTracker.onCongratulations(() => {
                    congratulationsCount++;
                });
                
                progressTracker.recordLessonComplete('lesson-1');
                progressTracker.recordLessonComplete('lesson-1');
                
                expect(congratulationsCount).toBe(1);
            });
        });

        describe('isLessonCompleted', () => {
            it('应该正确检测课程完成状态', () => {
                expect(progressTracker.isLessonCompleted('lesson-1')).toBe(false);
                
                progressTracker.recordLessonComplete('lesson-1');
                
                expect(progressTracker.isLessonCompleted('lesson-1')).toBe(true);
            });

            it('无效参数时应该返回 false', () => {
                expect(progressTracker.isLessonCompleted(null)).toBe(false);
                expect(progressTracker.isLessonCompleted('')).toBe(false);
            });
        });

        describe('checkAndMarkComplete', () => {
            it('当所有页面都访问后应该自动标记完成', async () => {
                progressTracker.recordPageVisit('lesson-1', 1);
                progressTracker.recordPageVisit('lesson-1', 2);
                progressTracker.recordPageVisit('lesson-1', 3);
                
                const result = await progressTracker.checkAndMarkComplete('lesson-1', 3);
                
                expect(result).toBe(true);
                expect(progressTracker.isLessonCompleted('lesson-1')).toBe(true);
            });

            it('页面未全部访问时不应该标记完成', async () => {
                progressTracker.recordPageVisit('lesson-1', 1);
                progressTracker.recordPageVisit('lesson-1', 2);
                
                const result = await progressTracker.checkAndMarkComplete('lesson-1', 3);
                
                expect(result).toBe(false);
                expect(progressTracker.isLessonCompleted('lesson-1')).toBe(false);
            });

            it('已完成的课程应该返回 false', async () => {
                progressTracker.recordLessonComplete('lesson-1');
                
                const result = await progressTracker.checkAndMarkComplete('lesson-1', 3);
                
                expect(result).toBe(false);
            });

            it('无效参数时应该返回 false', async () => {
                expect(await progressTracker.checkAndMarkComplete(null, 3)).toBe(false);
                expect(await progressTracker.checkAndMarkComplete('lesson-1', 0)).toBe(false);
                expect(await progressTracker.checkAndMarkComplete('lesson-1', -1)).toBe(false);
            });
        });
    });

    describe('进度计算', () => {
        beforeEach(() => {
            progressTracker.setCurrentTextbook('textbook-1');
        });

        describe('getChapterProgress', () => {
            it('应该正确计算章节进度', async () => {
                // 完成章节1的一个课程
                progressTracker.recordLessonComplete('lesson-1');
                
                const progress = await progressTracker.getChapterProgress('chapter-1');
                
                // 章节1有2个课程，完成1个，进度应该是50%
                expect(progress).toBe(50);
            });

            it('全部完成时应该返回100%', async () => {
                progressTracker.recordLessonComplete('lesson-1');
                progressTracker.recordLessonComplete('lesson-2');
                
                const progress = await progressTracker.getChapterProgress('chapter-1');
                
                expect(progress).toBe(100);
            });

            it('没有完成任何课程时应该返回0%', async () => {
                const progress = await progressTracker.getChapterProgress('chapter-1');
                expect(progress).toBe(0);
            });

            it('无效章节ID时应该返回0', async () => {
                const progress = await progressTracker.getChapterProgress('invalid-chapter');
                expect(progress).toBe(0);
            });

            it('没有设置教材上下文时应该返回0', async () => {
                const tracker = new ProgressTracker(mockStorageManager, mockDataManager);
                const progress = await tracker.getChapterProgress('chapter-1');
                expect(progress).toBe(0);
            });
        });

        describe('getOverallProgress', () => {
            it('应该正确计算总体进度', async () => {
                // 完成1个课程（共3个课程）
                progressTracker.recordLessonComplete('lesson-1');
                
                const progress = await progressTracker.getOverallProgress();
                
                // 3个课程完成1个，进度应该是33%
                expect(progress).toBe(33);
            });

            it('全部完成时应该返回100%', async () => {
                progressTracker.recordLessonComplete('lesson-1');
                progressTracker.recordLessonComplete('lesson-2');
                progressTracker.recordLessonComplete('lesson-3');
                
                const progress = await progressTracker.getOverallProgress();
                
                expect(progress).toBe(100);
            });

            it('没有完成任何课程时应该返回0%', async () => {
                const progress = await progressTracker.getOverallProgress();
                expect(progress).toBe(0);
            });

            it('应该支持指定教材ID', async () => {
                progressTracker.recordLessonComplete('lesson-1');
                
                const progress = await progressTracker.getOverallProgress('textbook-1');
                
                expect(progress).toBe(33);
            });

            it('没有设置教材上下文且未指定教材ID时应该返回0', async () => {
                const tracker = new ProgressTracker(mockStorageManager, mockDataManager);
                const progress = await tracker.getOverallProgress();
                expect(progress).toBe(0);
            });
        });

        describe('getCompletedLessons', () => {
            it('应该返回已完成的课程列表', () => {
                progressTracker.recordLessonComplete('lesson-1');
                progressTracker.recordLessonComplete('lesson-2');
                
                const completed = progressTracker.getCompletedLessons();
                
                expect(completed).toContain('lesson-1');
                expect(completed).toContain('lesson-2');
                expect(completed.length).toBe(2);
            });

            it('没有完成任何课程时应该返回空数组', () => {
                const completed = progressTracker.getCompletedLessons();
                expect(completed).toEqual([]);
            });

            it('没有设置教材上下文时应该返回空数组', () => {
                const tracker = new ProgressTracker(mockStorageManager, mockDataManager);
                const completed = tracker.getCompletedLessons();
                expect(completed).toEqual([]);
            });
        });

        describe('getLessonProgressDetails', () => {
            it('应该返回课程进度详情', () => {
                progressTracker.recordPageVisit('lesson-1', 1);
                progressTracker.recordPageVisit('lesson-1', 2);
                
                const details = progressTracker.getLessonProgressDetails('lesson-1');
                
                expect(details).not.toBeNull();
                expect(details.visitedPages).toContain(1);
                expect(details.visitedPages).toContain(2);
            });

            it('没有进度时应该返回 null', () => {
                const details = progressTracker.getLessonProgressDetails('lesson-1');
                expect(details).toBeNull();
            });

            it('无效参数时应该返回 null', () => {
                expect(progressTracker.getLessonProgressDetails(null)).toBeNull();
                expect(progressTracker.getLessonProgressDetails('')).toBeNull();
            });
        });
    });

    describe('祝贺动画', () => {
        beforeEach(() => {
            progressTracker.setCurrentTextbook('textbook-1');
        });

        describe('showCongratulations', () => {
            it('应该触发祝贺回调', () => {
                let called = false;
                progressTracker.onCongratulations(() => {
                    called = true;
                });
                
                progressTracker.showCongratulations();
                
                expect(called).toBe(true);
            });

            it('没有设置回调时不应该报错', () => {
                expect(() => {
                    progressTracker.showCongratulations();
                }).not.toThrow();
            });
        });

        describe('onCongratulations', () => {
            it('应该正确设置回调', () => {
                const callback = jest.fn();
                progressTracker.onCongratulations(callback);
                
                progressTracker.showCongratulations();
                
                expect(callback).toHaveBeenCalled();
            });

            it('应该忽略非函数参数', () => {
                progressTracker.onCongratulations('not a function');
                
                expect(() => {
                    progressTracker.showCongratulations();
                }).not.toThrow();
            });
        });

        describe('setCongratulationsContainer', () => {
            it('应该正确设置容器', () => {
                const container = document.createElement('div');
                progressTracker.setCongratulationsContainer(container);
                
                // 验证设置成功（通过内部状态）
                expect(progressTracker._congratulationsContainer).toBe(container);
            });
        });
    });

    describe('事件回调', () => {
        beforeEach(() => {
            progressTracker.setCurrentTextbook('textbook-1');
        });

        describe('onProgressUpdate', () => {
            it('应该在记录页面访问时触发', () => {
                const callback = jest.fn();
                progressTracker.onProgressUpdate(callback);
                
                progressTracker.recordPageVisit('lesson-1', 1);
                
                expect(callback).toHaveBeenCalled();
                expect(callback.mock.calls[0][0].lessonId).toBe('lesson-1');
            });

            it('应该在标记课程完成时触发', () => {
                const callback = jest.fn();
                progressTracker.onProgressUpdate(callback);
                
                progressTracker.recordLessonComplete('lesson-1');
                
                expect(callback).toHaveBeenCalled();
            });

            it('应该忽略非函数参数', () => {
                progressTracker.onProgressUpdate('not a function');
                
                expect(() => {
                    progressTracker.recordPageVisit('lesson-1', 1);
                }).not.toThrow();
            });
        });
    });

    describe('进度数据持久化', () => {
        beforeEach(() => {
            progressTracker.setCurrentTextbook('textbook-1');
        });

        describe('getProgressData', () => {
            it('应该返回进度数据', () => {
                progressTracker.recordLessonComplete('lesson-1');
                
                const data = progressTracker.getProgressData();
                
                expect(data.textbookId).toBe('textbook-1');
                expect(data.completedLessons).toContain('lesson-1');
            });

            it('没有设置教材上下文时应该返回空数据', () => {
                const tracker = new ProgressTracker(mockStorageManager, mockDataManager);
                const data = tracker.getProgressData();
                
                expect(data.textbookId).toBeNull();
                expect(data.completedLessons).toEqual([]);
            });
        });

        describe('resetLessonProgress', () => {
            it('应该重置课程进度', () => {
                progressTracker.recordPageVisit('lesson-1', 1);
                progressTracker.recordLessonComplete('lesson-1');
                
                const result = progressTracker.resetLessonProgress('lesson-1');
                
                expect(result).toBe(true);
                expect(mockStorageManager.saveLessonProgress).toHaveBeenCalled();
            });

            it('无效参数时应该返回 false', () => {
                expect(progressTracker.resetLessonProgress(null)).toBe(false);
                expect(progressTracker.resetLessonProgress('')).toBe(false);
            });

            it('没有设置教材上下文时应该返回 false', () => {
                const tracker = new ProgressTracker(mockStorageManager, mockDataManager);
                const result = tracker.resetLessonProgress('lesson-1');
                expect(result).toBe(false);
            });
        });

        describe('clearTextbookProgress', () => {
            it('应该清除教材所有进度', () => {
                progressTracker.recordLessonComplete('lesson-1');
                
                const result = progressTracker.clearTextbookProgress();
                
                expect(result).toBe(true);
                expect(mockStorageManager.clearTextbookRecord).toHaveBeenCalledWith('textbook-1');
            });

            it('应该支持指定教材ID', () => {
                const result = progressTracker.clearTextbookProgress('other-textbook');
                
                expect(result).toBe(true);
                expect(mockStorageManager.clearTextbookRecord).toHaveBeenCalledWith('other-textbook');
            });

            it('没有设置教材上下文且未指定教材ID时应该返回 false', () => {
                const tracker = new ProgressTracker(mockStorageManager, mockDataManager);
                const result = tracker.clearTextbookProgress();
                expect(result).toBe(false);
            });
        });
    });

    describe('Property 19: 进度记录往返', () => {
        beforeEach(() => {
            progressTracker.setCurrentTextbook('textbook-1');
        });

        it('记录页面访问后查询应包含该页面', () => {
            const pages = [1, 2, 3, 5, 10];
            
            pages.forEach(page => {
                progressTracker.recordPageVisit('lesson-1', page);
                const visitedPages = progressTracker.getVisitedPages('lesson-1');
                expect(visitedPages).toContain(page);
            });
        });

        it('记录课程完成后查询应返回已完成', () => {
            progressTracker.recordLessonComplete('lesson-1');
            expect(progressTracker.isLessonCompleted('lesson-1')).toBe(true);
        });

        it('完成的课程应出现在已完成列表中', () => {
            progressTracker.recordLessonComplete('lesson-1');
            progressTracker.recordLessonComplete('lesson-2');
            
            const completed = progressTracker.getCompletedLessons();
            expect(completed).toContain('lesson-1');
            expect(completed).toContain('lesson-2');
        });
    });

    describe('边界情况', () => {
        beforeEach(() => {
            progressTracker.setCurrentTextbook('textbook-1');
        });

        it('应该处理没有 StorageManager 的情况', () => {
            const tracker = new ProgressTracker(null, mockDataManager);
            tracker.setCurrentTextbook('textbook-1');
            
            expect(tracker.recordPageVisit('lesson-1', 1)).toBe(false);
            expect(tracker.getVisitedPages('lesson-1')).toEqual([]);
            expect(tracker.recordLessonComplete('lesson-1')).toBe(false);
        });

        it('应该处理没有 DataManager 的情况', async () => {
            const tracker = new ProgressTracker(mockStorageManager, null);
            tracker.setCurrentTextbook('textbook-1');
            
            const chapterProgress = await tracker.getChapterProgress('chapter-1');
            expect(chapterProgress).toBe(0);
            
            const overallProgress = await tracker.getOverallProgress();
            expect(overallProgress).toBe(0);
        });

        it('应该处理空章节列表', async () => {
            mockDataManager.getChapters.mockResolvedValue([]);
            
            const progress = await progressTracker.getOverallProgress();
            expect(progress).toBe(0);
        });

        it('应该处理章节没有课程的情况', async () => {
            mockDataManager.getChapters.mockResolvedValue([
                { id: 'empty-chapter', textbookId: 'textbook-1', name: 'Empty', lessons: [] }
            ]);
            
            const progress = await progressTracker.getChapterProgress('empty-chapter');
            expect(progress).toBe(0);
        });
    });

    /**
     * 课程完成祝贺功能测试
     * Validates: Requirements 9.4 - 显示祝贺动画和鼓励信息
     */
    describe('课程完成祝贺功能 (Requirements 9.4)', () => {
        beforeEach(() => {
            progressTracker.setCurrentTextbook('textbook-1');
        });

        describe('祝贺动画触发', () => {
            it('课程首次完成时应该触发祝贺动画', () => {
                let congratulationsCalled = false;
                progressTracker.onCongratulations(() => {
                    congratulationsCalled = true;
                });
                
                progressTracker.recordLessonComplete('lesson-1');
                
                expect(congratulationsCalled).toBe(true);
            });

            it('课程重复完成时不应该再次触发祝贺动画', () => {
                let congratulationsCount = 0;
                progressTracker.onCongratulations(() => {
                    congratulationsCount++;
                });
                
                progressTracker.recordLessonComplete('lesson-1');
                progressTracker.recordLessonComplete('lesson-1');
                progressTracker.recordLessonComplete('lesson-1');
                
                expect(congratulationsCount).toBe(1);
            });

            it('不同课程完成时应该分别触发祝贺动画', () => {
                let congratulationsCount = 0;
                progressTracker.onCongratulations(() => {
                    congratulationsCount++;
                });
                
                progressTracker.recordLessonComplete('lesson-1');
                progressTracker.recordLessonComplete('lesson-2');
                progressTracker.recordLessonComplete('lesson-3');
                
                expect(congratulationsCount).toBe(3);
            });
        });

        describe('checkAndMarkComplete 自动完成检测', () => {
            it('访问所有页面后应该自动触发祝贺', async () => {
                let congratulationsCalled = false;
                progressTracker.onCongratulations(() => {
                    congratulationsCalled = true;
                });
                
                // 访问所有3页
                progressTracker.recordPageVisit('lesson-1', 1);
                progressTracker.recordPageVisit('lesson-1', 2);
                progressTracker.recordPageVisit('lesson-1', 3);
                
                // 检查并标记完成
                const result = await progressTracker.checkAndMarkComplete('lesson-1', 3);
                
                expect(result).toBe(true);
                expect(congratulationsCalled).toBe(true);
            });

            it('未访问所有页面时不应该触发祝贺', async () => {
                let congratulationsCalled = false;
                progressTracker.onCongratulations(() => {
                    congratulationsCalled = true;
                });
                
                // 只访问2页（共3页）
                progressTracker.recordPageVisit('lesson-1', 1);
                progressTracker.recordPageVisit('lesson-1', 2);
                
                const result = await progressTracker.checkAndMarkComplete('lesson-1', 3);
                
                expect(result).toBe(false);
                expect(congratulationsCalled).toBe(false);
            });
        });

        describe('getRandomEncourageMessage', () => {
            it('应该返回有效的鼓励信息对象', () => {
                const message = progressTracker.getRandomEncourageMessage();
                
                expect(message).toBeDefined();
                expect(message.title).toBeDefined();
                expect(typeof message.title).toBe('string');
                expect(message.message).toBeDefined();
                expect(typeof message.message).toBe('string');
                expect(message.emoji).toBeDefined();
                expect(typeof message.emoji).toBe('string');
            });

            it('多次调用应该返回不同的消息（随机性测试）', () => {
                const messages = new Set();
                
                // 调用多次收集不同的消息
                for (let i = 0; i < 50; i++) {
                    const message = progressTracker.getRandomEncourageMessage();
                    messages.add(message.title);
                }
                
                // 应该至少有2种不同的消息（验证随机性）
                expect(messages.size).toBeGreaterThan(1);
            });
        });

        describe('shouldShowCongratulations', () => {
            it('课程完成后应该返回 true', () => {
                progressTracker.recordLessonComplete('lesson-1');
                
                const shouldShow = progressTracker.shouldShowCongratulations('lesson-1');
                
                expect(shouldShow).toBe(true);
            });

            it('课程未完成时应该返回 false', () => {
                const shouldShow = progressTracker.shouldShowCongratulations('lesson-1');
                
                expect(shouldShow).toBe(false);
            });

            it('无效参数时应该返回 false', () => {
                expect(progressTracker.shouldShowCongratulations(null)).toBe(false);
                expect(progressTracker.shouldShowCongratulations('')).toBe(false);
            });

            it('没有设置教材上下文时应该返回 false', () => {
                const tracker = new ProgressTracker(mockStorageManager, mockDataManager);
                const shouldShow = tracker.shouldShowCongratulations('lesson-1');
                
                expect(shouldShow).toBe(false);
            });
        });

        describe('祝贺动画容器渲染', () => {
            it('设置容器后调用 showCongratulations 应该渲染动画', () => {
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                progressTracker.setCongratulationsContainer(container);
                progressTracker.showCongratulations();
                
                // 检查是否创建了祝贺动画元素
                const overlay = container.querySelector('.congratulations-overlay');
                expect(overlay).not.toBeNull();
                
                // 检查是否包含必要的元素
                const title = container.querySelector('.congratulations-title');
                expect(title).not.toBeNull();
                
                const message = container.querySelector('.congratulations-message');
                expect(message).not.toBeNull();
                
                const stars = container.querySelector('.congratulations-stars');
                expect(stars).not.toBeNull();
                
                const button = container.querySelector('.congratulations-button');
                expect(button).not.toBeNull();
                
                // 清理
                document.body.removeChild(container);
            });

            it('没有设置容器时调用 showCongratulations 不应该报错', () => {
                expect(() => {
                    progressTracker.showCongratulations();
                }).not.toThrow();
            });

            it('祝贺动画应该包含彩带效果', () => {
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                progressTracker.setCongratulationsContainer(container);
                progressTracker.showCongratulations();
                
                // 检查是否创建了彩带容器
                const confettiContainer = container.querySelector('.confetti-container');
                expect(confettiContainer).not.toBeNull();
                
                // 检查是否有彩带元素
                const confetti = container.querySelectorAll('.confetti');
                expect(confetti.length).toBeGreaterThan(0);
                
                // 清理
                document.body.removeChild(container);
            });

            it('祝贺动画应该包含徽章', () => {
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                progressTracker.setCongratulationsContainer(container);
                progressTracker.showCongratulations();
                
                // 检查是否有徽章元素
                const badge = container.querySelector('.congratulations-badge');
                expect(badge).not.toBeNull();
                
                // 清理
                document.body.removeChild(container);
            });

            it('点击按钮应该关闭祝贺动画', (done) => {
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                progressTracker.setCongratulationsContainer(container);
                progressTracker.showCongratulations();
                
                const button = container.querySelector('.congratulations-button');
                expect(button).not.toBeNull();
                
                // 点击按钮
                button.click();
                
                // 等待动画完成后检查
                setTimeout(() => {
                    const overlay = container.querySelector('.congratulations-overlay');
                    expect(overlay).toBeNull();
                    
                    // 清理
                    document.body.removeChild(container);
                    done();
                }, 400);
            });

            it('点击遮罩层应该关闭祝贺动画', (done) => {
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                progressTracker.setCongratulationsContainer(container);
                progressTracker.showCongratulations();
                
                const overlay = container.querySelector('.congratulations-overlay');
                expect(overlay).not.toBeNull();
                
                // 点击遮罩层（而不是内容区域）
                overlay.click();
                
                // 等待动画完成后检查
                setTimeout(() => {
                    const overlayAfter = container.querySelector('.congratulations-overlay');
                    expect(overlayAfter).toBeNull();
                    
                    // 清理
                    document.body.removeChild(container);
                    done();
                }, 400);
            });
        });

        describe('Property 21: 课程完成祝贺触发', () => {
            it('当课程所有页面都被访问后标记为完成时，应该触发祝贺动画', async () => {
                let congratulationsCalled = false;
                progressTracker.onCongratulations(() => {
                    congratulationsCalled = true;
                });
                
                // 模拟访问所有页面
                progressTracker.recordPageVisit('lesson-1', 1);
                progressTracker.recordPageVisit('lesson-1', 2);
                progressTracker.recordPageVisit('lesson-1', 3);
                
                // 检查并标记完成
                await progressTracker.checkAndMarkComplete('lesson-1', 3);
                
                // 验证祝贺被触发
                expect(congratulationsCalled).toBe(true);
                expect(progressTracker.isLessonCompleted('lesson-1')).toBe(true);
            });

            it('直接调用 recordLessonComplete 也应该触发祝贺', () => {
                let congratulationsCalled = false;
                progressTracker.onCongratulations(() => {
                    congratulationsCalled = true;
                });
                
                progressTracker.recordLessonComplete('lesson-1');
                
                expect(congratulationsCalled).toBe(true);
            });
        });
    });
});
