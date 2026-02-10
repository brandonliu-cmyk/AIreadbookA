/**
 * ChapterNavigator 单元测试
 * 测试章节导航器组件的核心功能
 * 
 * Requirements: 3.1, 3.2
 */

describe('ChapterNavigator', () => {
    let container;
    let navigator;
    let mockDataManager;

    // 模拟章节数据
    const mockChapters = [
        {
            id: 'chapter-1',
            textbookId: 'textbook-1',
            name: 'Unit 1 Hello!',
            order: 1,
            lessons: [
                {
                    id: 'lesson-1-1',
                    chapterId: 'chapter-1',
                    name: 'Part A Let\'s talk',
                    order: 1,
                    totalPages: 2,
                    previewText: 'Hello! I\'m Wu Yifan.'
                },
                {
                    id: 'lesson-1-2',
                    chapterId: 'chapter-1',
                    name: 'Part A Let\'s learn',
                    order: 2,
                    totalPages: 3,
                    previewText: 'ruler, pencil, eraser'
                }
            ]
        },
        {
            id: 'chapter-2',
            textbookId: 'textbook-1',
            name: 'Unit 2 Colours',
            order: 2,
            lessons: [
                {
                    id: 'lesson-2-1',
                    chapterId: 'chapter-2',
                    name: 'Part A Let\'s talk',
                    order: 1,
                    totalPages: 2,
                    previewText: 'Good morning!'
                }
            ]
        }
    ];

    beforeEach(() => {
        // 创建容器
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);

        // 创建模拟数据管理器
        mockDataManager = {
            getChapters: jasmine.createSpy('getChapters').and.returnValue(Promise.resolve(mockChapters))
        };

        // 创建导航器实例
        navigator = new ChapterNavigator(container);
        navigator.setDataManager(mockDataManager);
        navigator.setDebug(false);
    });

    afterEach(() => {
        // 清理
        if (navigator) {
            navigator.destroy();
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        // 清理可能存在的预览弹窗
        const modal = document.querySelector('.lesson-preview-modal');
        if (modal) {
            modal.remove();
        }
    });

    describe('构造函数', () => {
        it('应该正确初始化组件', () => {
            expect(navigator).toBeDefined();
            expect(navigator.getContainer()).toBe(container);
            expect(navigator.getChapters()).toEqual([]);
            expect(navigator.getCurrentTextbookId()).toBeNull();
        });

        it('应该在没有容器时抛出错误', () => {
            expect(() => new ChapterNavigator(null)).toThrowError('ChapterNavigator requires a valid HTMLElement container');
        });

        it('应该在容器不是HTMLElement时抛出错误', () => {
            expect(() => new ChapterNavigator('not-an-element')).toThrowError('ChapterNavigator requires a valid HTMLElement container');
        });
    });

    describe('loadChapters', () => {
        it('应该成功加载章节数据', async () => {
            const chapters = await navigator.loadChapters('textbook-1');
            
            expect(mockDataManager.getChapters).toHaveBeenCalledWith('textbook-1');
            expect(chapters).toEqual(mockChapters);
            expect(navigator.getChapters()).toEqual(mockChapters);
            expect(navigator.getCurrentTextbookId()).toBe('textbook-1');
        });

        it('应该在没有textbookId时抛出错误', async () => {
            await expectAsync(navigator.loadChapters(null)).toBeRejectedWithError('textbookId is required');
        });

        it('应该在没有DataManager时抛出错误', async () => {
            navigator.setDataManager(null);
            await expectAsync(navigator.loadChapters('textbook-1')).toBeRejectedWithError('DataManager is not available');
        });
    });

    describe('render', () => {
        it('应该正确渲染章节列表', () => {
            navigator.render(mockChapters);
            
            // 检查标题
            const title = container.querySelector('.chapter-navigator-title');
            expect(title).not.toBeNull();
            expect(title.textContent).toContain('章节目录');
            
            // 检查章节项
            const chapterItems = container.querySelectorAll('.chapter-item');
            expect(chapterItems.length).toBe(2);
            
            // 检查第一个章节
            const firstChapter = chapterItems[0];
            expect(firstChapter.getAttribute('data-chapter-id')).toBe('chapter-1');
            expect(firstChapter.querySelector('.chapter-name').textContent).toBe('Unit 1 Hello!');
            expect(firstChapter.querySelector('.chapter-lesson-count').textContent).toBe('2课');
        });

        it('应该在没有章节时显示空状态', () => {
            navigator.render([]);
            
            const emptyState = container.querySelector('.chapter-empty-state');
            expect(emptyState).not.toBeNull();
            expect(emptyState.querySelector('.empty-title').textContent).toContain('暂无章节内容');
        });

        it('应该在参数不是数组时抛出错误', () => {
            expect(() => navigator.render('not-an-array')).toThrowError('chapters must be an array');
        });

        it('应该正确渲染课程列表', () => {
            navigator.render(mockChapters);
            
            // 课程列表默认是折叠的
            const lessonLists = container.querySelectorAll('.lesson-list');
            expect(lessonLists.length).toBe(2);
            expect(lessonLists[0].classList.contains('collapsed')).toBe(true);
            
            // 检查课程项
            const lessonItems = container.querySelectorAll('.lesson-item');
            expect(lessonItems.length).toBe(3); // 2 + 1 = 3 lessons total
        });
    });

    describe('toggleChapter - 展开/折叠功能', () => {
        beforeEach(() => {
            navigator.render(mockChapters);
        });

        it('应该展开折叠的章节', () => {
            const chapterId = 'chapter-1';
            
            // 初始状态是折叠的
            const chapterItem = container.querySelector(`[data-chapter-id="${chapterId}"]`);
            const lessonList = chapterItem.querySelector('.lesson-list');
            expect(lessonList.classList.contains('collapsed')).toBe(true);
            
            // 展开章节
            navigator.toggleChapter(chapterId);
            
            expect(lessonList.classList.contains('expanded')).toBe(true);
            expect(lessonList.classList.contains('collapsed')).toBe(false);
            expect(navigator.getExpandedChapters()).toContain(chapterId);
        });

        it('应该折叠展开的章节', () => {
            const chapterId = 'chapter-1';
            
            // 先展开
            navigator.toggleChapter(chapterId);
            expect(navigator.getExpandedChapters()).toContain(chapterId);
            
            // 再折叠
            navigator.toggleChapter(chapterId);
            
            const chapterItem = container.querySelector(`[data-chapter-id="${chapterId}"]`);
            const lessonList = chapterItem.querySelector('.lesson-list');
            expect(lessonList.classList.contains('collapsed')).toBe(true);
            expect(navigator.getExpandedChapters()).not.toContain(chapterId);
        });

        it('应该更新展开图标', () => {
            const chapterId = 'chapter-1';
            const chapterItem = container.querySelector(`[data-chapter-id="${chapterId}"]`);
            const expandIcon = chapterItem.querySelector('.chapter-expand-icon');
            
            // 初始图标
            expect(expandIcon.textContent.trim()).toBe('📁');
            
            // 展开后图标
            navigator.toggleChapter(chapterId);
            expect(expandIcon.textContent.trim()).toBe('📂');
            
            // 折叠后图标
            navigator.toggleChapter(chapterId);
            expect(expandIcon.textContent.trim()).toBe('📁');
        });

        it('应该更新aria-expanded属性', () => {
            const chapterId = 'chapter-1';
            const chapterItem = container.querySelector(`[data-chapter-id="${chapterId}"]`);
            
            expect(chapterItem.getAttribute('aria-expanded')).toBe('false');
            
            navigator.toggleChapter(chapterId);
            expect(chapterItem.getAttribute('aria-expanded')).toBe('true');
            
            navigator.toggleChapter(chapterId);
            expect(chapterItem.getAttribute('aria-expanded')).toBe('false');
        });

        it('应该忽略无效的章节ID', () => {
            const initialExpanded = navigator.getExpandedChapters().length;
            navigator.toggleChapter(null);
            navigator.toggleChapter('non-existent-chapter');
            expect(navigator.getExpandedChapters().length).toBe(initialExpanded);
        });
    });

    describe('selectLesson', () => {
        beforeEach(() => {
            navigator.render(mockChapters);
        });

        it('应该选择课程并触发回调', () => {
            const callback = jasmine.createSpy('onLessonSelect');
            navigator.onLessonSelect(callback);
            
            navigator.selectLesson('lesson-1-1');
            
            expect(navigator.getSelectedLessonId()).toBe('lesson-1-1');
            expect(callback).toHaveBeenCalledWith(mockChapters[0].lessons[0]);
        });

        it('应该更新选中状态的UI', () => {
            navigator.selectLesson('lesson-1-1');
            
            const selectedItem = container.querySelector('[data-lesson-id="lesson-1-1"]');
            expect(selectedItem.classList.contains('selected')).toBe(true);
        });

        it('应该在选择新课程时移除旧的选中状态', () => {
            navigator.selectLesson('lesson-1-1');
            navigator.selectLesson('lesson-1-2');
            
            const oldSelected = container.querySelector('[data-lesson-id="lesson-1-1"]');
            const newSelected = container.querySelector('[data-lesson-id="lesson-1-2"]');
            
            expect(oldSelected.classList.contains('selected')).toBe(false);
            expect(newSelected.classList.contains('selected')).toBe(true);
        });

        it('应该忽略无效的课程ID', () => {
            const callback = jasmine.createSpy('onLessonSelect');
            navigator.onLessonSelect(callback);
            
            navigator.selectLesson(null);
            navigator.selectLesson('non-existent-lesson');
            
            expect(callback).not.toHaveBeenCalled();
            expect(navigator.getSelectedLessonId()).toBeNull();
        });
    });

    describe('showLessonPreview', () => {
        beforeEach(() => {
            navigator.render(mockChapters);
        });

        it('应该显示课程预览弹窗', () => {
            navigator.showLessonPreview('lesson-1-1');
            
            const modal = document.querySelector('.lesson-preview-modal');
            expect(modal).not.toBeNull();
            
            const title = modal.querySelector('.preview-title');
            expect(title.textContent).toBe("Part A Let's talk");
            
            const previewText = modal.querySelector('.preview-text');
            expect(previewText.textContent).toBe("Hello! I'm Wu Yifan.");
        });

        it('应该触发预览回调', () => {
            const callback = jasmine.createSpy('onLessonPreview');
            navigator.onLessonPreview(callback);
            
            navigator.showLessonPreview('lesson-1-1');
            
            expect(callback).toHaveBeenCalledWith(mockChapters[0].lessons[0]);
        });

        it('应该在点击关闭按钮时关闭弹窗', (done) => {
            navigator.showLessonPreview('lesson-1-1');
            
            const modal = document.querySelector('.lesson-preview-modal');
            const closeBtn = modal.querySelector('.preview-close-btn');
            closeBtn.click();
            
            // 等待动画完成
            setTimeout(() => {
                const modalAfter = document.querySelector('.lesson-preview-modal');
                expect(modalAfter).toBeNull();
                done();
            }, 400);
        });

        it('应该在点击开始学习按钮时选择课程', (done) => {
            const callback = jasmine.createSpy('onLessonSelect');
            navigator.onLessonSelect(callback);
            
            navigator.showLessonPreview('lesson-1-1');
            
            const modal = document.querySelector('.lesson-preview-modal');
            const startBtn = modal.querySelector('.preview-start-btn');
            startBtn.click();
            
            setTimeout(() => {
                expect(callback).toHaveBeenCalledWith(mockChapters[0].lessons[0]);
                done();
            }, 400);
        });
    });

    describe('updateProgress', () => {
        it('应该更新进度数据', () => {
            navigator.render(mockChapters);
            
            const progressData = {
                'lesson-1-1': { isCompleted: true, visitedPages: [1, 2] }
            };
            
            navigator.updateProgress(progressData);
            
            // 重新渲染后检查完成状态
            const lessonItem = container.querySelector('[data-lesson-id="lesson-1-1"]');
            expect(lessonItem.classList.contains('completed')).toBe(true);
        });

        it('应该显示章节进度徽章', () => {
            const progressData = {
                'lesson-1-1': { isCompleted: true },
                'lesson-1-2': { isCompleted: true }
            };
            navigator.setProgressData(progressData);
            navigator.render(mockChapters);
            
            const chapterItem = container.querySelector('[data-chapter-id="chapter-1"]');
            const progressBadge = chapterItem.querySelector('.chapter-progress-badge');
            expect(progressBadge).not.toBeNull();
            expect(progressBadge.textContent).toBe('100%');
        });

        it('应该显示课程进度指示器（部分完成）', () => {
            const progressData = {
                'lesson-1-1': { isCompleted: false, visitedPages: [1] }
            };
            navigator.setProgressData(progressData);
            navigator.render(mockChapters);
            
            const lessonItem = container.querySelector('[data-lesson-id="lesson-1-1"]');
            const progressIndicator = lessonItem.querySelector('.lesson-progress-indicator');
            expect(progressIndicator).not.toBeNull();
            expect(progressIndicator.textContent).toBe('50%'); // 1 of 2 pages
        });

        it('应该显示已完成徽章', () => {
            const progressData = {
                'lesson-1-1': { isCompleted: true, visitedPages: [1, 2] }
            };
            navigator.setProgressData(progressData);
            navigator.render(mockChapters);
            
            const lessonItem = container.querySelector('[data-lesson-id="lesson-1-1"]');
            const completedBadge = lessonItem.querySelector('.lesson-completed-badge');
            expect(completedBadge).not.toBeNull();
            expect(completedBadge.textContent).toBe('已完成');
        });

        it('应该显示章节进度条', () => {
            const progressData = {
                'lesson-1-1': { isCompleted: true }
            };
            navigator.setProgressData(progressData);
            navigator.render(mockChapters);
            
            const chapterItem = container.querySelector('[data-chapter-id="chapter-1"]');
            const progressBar = chapterItem.querySelector('.chapter-progress-bar');
            expect(progressBar).not.toBeNull();
            
            const progressFill = progressBar.querySelector('.chapter-progress-fill');
            expect(progressFill).not.toBeNull();
            expect(progressFill.style.width).toBe('50%'); // 1 of 2 lessons
        });

        it('应该显示章节完成图标', () => {
            const progressData = {
                'lesson-1-1': { isCompleted: true },
                'lesson-1-2': { isCompleted: true }
            };
            navigator.setProgressData(progressData);
            navigator.render(mockChapters);
            
            const chapterItem = container.querySelector('[data-chapter-id="chapter-1"]');
            const completedIcon = chapterItem.querySelector('.chapter-completed-icon');
            expect(completedIcon).not.toBeNull();
        });
    });

    describe('getOverallProgress - 总体进度计算', () => {
        it('应该正确计算总体进度（无进度）', () => {
            navigator.render(mockChapters);
            
            const progress = navigator.getOverallProgress();
            
            expect(progress.percentage).toBe(0);
            expect(progress.completed).toBe(0);
            expect(progress.total).toBe(3); // 2 + 1 = 3 lessons
        });

        it('应该正确计算总体进度（部分完成）', () => {
            const progressData = {
                'lesson-1-1': { isCompleted: true }
            };
            navigator.setProgressData(progressData);
            navigator.render(mockChapters);
            
            const progress = navigator.getOverallProgress();
            
            expect(progress.percentage).toBe(33); // 1/3 = 33%
            expect(progress.completed).toBe(1);
            expect(progress.total).toBe(3);
        });

        it('应该正确计算总体进度（全部完成）', () => {
            const progressData = {
                'lesson-1-1': { isCompleted: true },
                'lesson-1-2': { isCompleted: true },
                'lesson-2-1': { isCompleted: true }
            };
            navigator.setProgressData(progressData);
            navigator.render(mockChapters);
            
            const progress = navigator.getOverallProgress();
            
            expect(progress.percentage).toBe(100);
            expect(progress.completed).toBe(3);
            expect(progress.total).toBe(3);
        });

        it('应该在没有章节时返回零进度', () => {
            navigator.render([]);
            
            const progress = navigator.getOverallProgress();
            
            expect(progress.percentage).toBe(0);
            expect(progress.completed).toBe(0);
            expect(progress.total).toBe(0);
        });
    });

    describe('expandAll / collapseAll', () => {
        beforeEach(() => {
            navigator.render(mockChapters);
        });

        it('应该展开所有章节', () => {
            navigator.expandAll();
            
            const expandedChapters = navigator.getExpandedChapters();
            expect(expandedChapters.length).toBe(2);
            expect(expandedChapters).toContain('chapter-1');
            expect(expandedChapters).toContain('chapter-2');
        });

        it('应该折叠所有章节', () => {
            navigator.expandAll();
            navigator.collapseAll();
            
            const expandedChapters = navigator.getExpandedChapters();
            expect(expandedChapters.length).toBe(0);
        });
    });

    describe('进度显示功能 - Requirements 9.2, 9.3', () => {
        beforeEach(() => {
            navigator.render(mockChapters);
        });

        it('应该正确显示课程图标（未开始）', () => {
            const lessonItem = container.querySelector('[data-lesson-id="lesson-1-1"]');
            const icon = lessonItem.querySelector('.lesson-icon');
            expect(icon.textContent.trim()).toBe('📄');
        });

        it('应该正确显示课程图标（进行中）', () => {
            const progressData = {
                'lesson-1-1': { isCompleted: false, visitedPages: [1] }
            };
            navigator.setProgressData(progressData);
            navigator.render(mockChapters);
            
            const lessonItem = container.querySelector('[data-lesson-id="lesson-1-1"]');
            const icon = lessonItem.querySelector('.lesson-icon');
            expect(icon.textContent.trim()).toBe('📖');
        });

        it('应该正确显示课程图标（已完成）', () => {
            const progressData = {
                'lesson-1-1': { isCompleted: true, visitedPages: [1, 2] }
            };
            navigator.setProgressData(progressData);
            navigator.render(mockChapters);
            
            const lessonItem = container.querySelector('[data-lesson-id="lesson-1-1"]');
            const icon = lessonItem.querySelector('.lesson-icon');
            expect(icon.textContent.trim()).toBe('✅');
        });

        it('应该不显示进度指示器（未开始）', () => {
            const lessonItem = container.querySelector('[data-lesson-id="lesson-1-1"]');
            const progressIndicator = lessonItem.querySelector('.lesson-progress-indicator');
            expect(progressIndicator).toBeNull();
        });

        it('应该不显示进度指示器（已完成）', () => {
            const progressData = {
                'lesson-1-1': { isCompleted: true, visitedPages: [1, 2] }
            };
            navigator.setProgressData(progressData);
            navigator.render(mockChapters);
            
            const lessonItem = container.querySelector('[data-lesson-id="lesson-1-1"]');
            const progressIndicator = lessonItem.querySelector('.lesson-progress-indicator');
            expect(progressIndicator).toBeNull();
        });

        it('应该不显示章节进度条（无进度）', () => {
            const chapterItem = container.querySelector('[data-chapter-id="chapter-1"]');
            const progressBar = chapterItem.querySelector('.chapter-progress-bar');
            expect(progressBar).toBeNull();
        });

        it('应该不显示章节完成图标（未完成）', () => {
            const progressData = {
                'lesson-1-1': { isCompleted: true }
            };
            navigator.setProgressData(progressData);
            navigator.render(mockChapters);
            
            const chapterItem = container.querySelector('[data-chapter-id="chapter-1"]');
            const completedIcon = chapterItem.querySelector('.chapter-completed-icon');
            expect(completedIcon).toBeNull();
        });

        it('应该正确计算课程进度百分比', () => {
            // 3页的课程，访问了2页
            const progressData = {
                'lesson-1-2': { isCompleted: false, visitedPages: [1, 2] }
            };
            navigator.setProgressData(progressData);
            navigator.render(mockChapters);
            
            const lessonItem = container.querySelector('[data-lesson-id="lesson-1-2"]');
            const progressIndicator = lessonItem.querySelector('.lesson-progress-indicator');
            expect(progressIndicator).not.toBeNull();
            expect(progressIndicator.textContent).toBe('67%'); // 2/3 = 67%
        });
    });

    describe('showLoading / showError', () => {
        it('应该显示加载状态', () => {
            navigator.showLoading();
            
            const loadingContainer = container.querySelector('.loading-container');
            expect(loadingContainer).not.toBeNull();
            expect(container.querySelector('.loading-text').textContent).toContain('正在加载章节目录');
        });

        it('应该显示错误状态', () => {
            navigator.showError('测试错误消息');
            
            const errorContainer = container.querySelector('.error-container');
            expect(errorContainer).not.toBeNull();
            expect(container.querySelector('.error-message').textContent).toBe('测试错误消息');
        });

        it('应该在错误状态下绑定重试按钮', () => {
            const retryCallback = jasmine.createSpy('retry');
            navigator.showError('错误', retryCallback);
            
            const retryBtn = container.querySelector('.retry-btn');
            retryBtn.click();
            
            expect(retryCallback).toHaveBeenCalled();
        });
    });

    describe('destroy', () => {
        it('应该清理组件状态', () => {
            navigator.render(mockChapters);
            navigator.toggleChapter('chapter-1');
            navigator.selectLesson('lesson-1-1');
            
            navigator.destroy();
            
            expect(container.innerHTML).toBe('');
            expect(navigator.getChapters()).toEqual([]);
            expect(navigator.getCurrentTextbookId()).toBeNull();
            expect(navigator.getExpandedChapters()).toEqual([]);
            expect(navigator.getSelectedLessonId()).toBeNull();
        });
    });

    describe('事件交互', () => {
        beforeEach(() => {
            navigator.render(mockChapters);
        });

        it('应该在点击章节头部时展开/折叠', () => {
            const chapterHeader = container.querySelector('.chapter-header');
            chapterHeader.click();
            
            expect(navigator.getExpandedChapters()).toContain('chapter-1');
        });

        it('应该在点击课程项时选择课程', () => {
            // 先展开章节
            navigator.toggleChapter('chapter-1');
            
            const lessonItem = container.querySelector('[data-lesson-id="lesson-1-1"]');
            lessonItem.click();
            
            expect(navigator.getSelectedLessonId()).toBe('lesson-1-1');
        });

        it('应该支持键盘导航 - Enter键展开章节', () => {
            const chapterHeader = container.querySelector('.chapter-header');
            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            chapterHeader.dispatchEvent(event);
            
            expect(navigator.getExpandedChapters()).toContain('chapter-1');
        });

        it('应该支持键盘导航 - 空格键选择课程', () => {
            navigator.toggleChapter('chapter-1');
            
            const lessonItem = container.querySelector('[data-lesson-id="lesson-1-1"]');
            const event = new KeyboardEvent('keydown', { key: ' ' });
            lessonItem.dispatchEvent(event);
            
            expect(navigator.getSelectedLessonId()).toBe('lesson-1-1');
        });
    });
});
