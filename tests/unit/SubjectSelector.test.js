/**
 * SubjectSelector 单元测试
 * 测试学科选择器组件的核心功能
 * 
 * Requirements: 1.1, 1.2
 */

// 导入被测试的模块
const { SubjectSelector } = require('../../js/components/SubjectSelector');

describe('SubjectSelector', () => {
    let container;
    let selector;
    let mockDataManager;

    // 模拟学科数据
    const mockSubjects = [
        {
            id: 'english',
            name: '英语',
            icon: '🔤',
            color: '#4A90D9',
            order: 1
        },
        {
            id: 'chinese',
            name: '语文',
            icon: '📖',
            color: '#E74C3C',
            order: 2
        },
        {
            id: 'math',
            name: '数学',
            icon: '🔢',
            color: '#2ECC71',
            order: 3
        }
    ];

    beforeEach(() => {
        // 创建容器元素
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);

        // 创建模拟的DataManager
        mockDataManager = {
            getSubjects: jest.fn().mockResolvedValue(mockSubjects)
        };

        // 创建SubjectSelector实例
        selector = new SubjectSelector(container);
        selector.setDataManager(mockDataManager);
        selector.setDebug(false);
    });

    afterEach(() => {
        // 清理
        if (selector) {
            selector.destroy();
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    describe('构造函数', () => {
        it('应该正确初始化组件', () => {
            expect(selector).toBeDefined();
            expect(selector.getContainer()).toBe(container);
            expect(selector.getSelectedSubject()).toBeNull();
        });

        it('应该在没有容器时抛出错误', () => {
            expect(() => new SubjectSelector(null)).toThrowError('SubjectSelector requires a valid HTMLElement container');
        });

        it('应该在容器不是HTMLElement时抛出错误', () => {
            expect(() => new SubjectSelector('not-an-element')).toThrowError('SubjectSelector requires a valid HTMLElement container');
        });
    });

    describe('loadSubjects', () => {
        it('应该从DataManager加载学科列表', async () => {
            const subjects = await selector.loadSubjects();
            
            expect(mockDataManager.getSubjects).toHaveBeenCalled();
            expect(subjects).toEqual(mockSubjects);
            expect(selector.getSubjects()).toEqual(mockSubjects);
        });

        it('应该在DataManager不可用时抛出错误', async () => {
            selector.setDataManager(null);
            
            await expect(selector.loadSubjects()).rejects.toThrow('DataManager is not available');
        });

        it('应该在加载失败时抛出错误', async () => {
            const error = new Error('Network error');
            mockDataManager.getSubjects.mockRejectedValue(error);
            
            await expect(selector.loadSubjects()).rejects.toThrow('Network error');
        });
    });

    describe('render', () => {
        it('应该渲染学科选择界面', () => {
            selector.render(mockSubjects);
            
            // 检查标题
            const title = container.querySelector('.subject-selector-title');
            expect(title).not.toBeNull();
            expect(title.textContent).toContain('选择学科');
            
            // 检查副标题
            const subtitle = container.querySelector('.subject-selector-subtitle');
            expect(subtitle).not.toBeNull();
        });

        it('应该渲染所有学科卡片', () => {
            selector.render(mockSubjects);
            
            const cards = container.querySelectorAll('.card-subject');
            expect(cards.length).toBe(mockSubjects.length);
        });

        it('应该正确显示学科图标和名称', () => {
            selector.render(mockSubjects);
            
            mockSubjects.forEach(subject => {
                const card = container.querySelector(`[data-subject-id="${subject.id}"]`);
                expect(card).not.toBeNull();
                
                const icon = card.querySelector('.card-subject-icon');
                expect(icon.textContent).toBe(subject.icon);
                
                const name = card.querySelector('.card-subject-name');
                expect(name.textContent).toBe(subject.name);
            });
        });

        it('应该为每个学科应用正确的样式类', () => {
            selector.render(mockSubjects);
            
            const englishCard = container.querySelector('[data-subject-id="english"]');
            expect(englishCard.classList.contains('card-subject-english')).toBe(true);
            
            const chineseCard = container.querySelector('[data-subject-id="chinese"]');
            expect(chineseCard.classList.contains('card-subject-chinese')).toBe(true);
            
            const mathCard = container.querySelector('[data-subject-id="math"]');
            expect(mathCard.classList.contains('card-subject-math')).toBe(true);
        });

        it('应该创建网格布局', () => {
            selector.render(mockSubjects);
            
            const grid = container.querySelector('.subject-grid');
            expect(grid).not.toBeNull();
            expect(grid.classList.contains('grid')).toBe(true);
        });

        it('应该在传入非数组时抛出错误', () => {
            expect(() => selector.render('not-an-array')).toThrowError('subjects must be an array');
            expect(() => selector.render(null)).toThrowError('subjects must be an array');
        });

        it('应该正确处理空数组', () => {
            selector.render([]);
            
            const cards = container.querySelectorAll('.card-subject');
            expect(cards.length).toBe(0);
        });
    });

    describe('selectSubject', () => {
        beforeEach(() => {
            selector.render(mockSubjects);
        });

        it('应该选择指定的学科', () => {
            selector.selectSubject('english');
            
            const selected = selector.getSelectedSubject();
            expect(selected).not.toBeNull();
            expect(selected.id).toBe('english');
            expect(selected.name).toBe('英语');
        });

        it('应该高亮显示选中的学科卡片', () => {
            selector.selectSubject('chinese');
            
            const chineseCard = container.querySelector('[data-subject-id="chinese"]');
            expect(chineseCard.classList.contains('selected')).toBe(true);
            expect(chineseCard.getAttribute('aria-selected')).toBe('true');
        });

        it('应该取消其他学科的选中状态', () => {
            selector.selectSubject('english');
            selector.selectSubject('chinese');
            
            const englishCard = container.querySelector('[data-subject-id="english"]');
            const chineseCard = container.querySelector('[data-subject-id="chinese"]');
            
            expect(englishCard.classList.contains('selected')).toBe(false);
            expect(chineseCard.classList.contains('selected')).toBe(true);
        });

        it('应该触发选择回调', () => {
            const callback = jest.fn();
            selector.onSelect(callback);
            
            selector.selectSubject('math');
            
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                id: 'math',
                name: '数学'
            }));
        });

        it('应该忽略无效的学科ID', () => {
            selector.selectSubject('invalid-id');
            
            expect(selector.getSelectedSubject()).toBeNull();
        });

        it('应该忽略空的学科ID', () => {
            selector.selectSubject('');
            selector.selectSubject(null);
            selector.selectSubject(undefined);
            
            expect(selector.getSelectedSubject()).toBeNull();
        });
    });

    describe('highlightSelected', () => {
        beforeEach(() => {
            selector.render(mockSubjects);
        });

        it('应该高亮指定的学科卡片', () => {
            selector.highlightSelected('english');
            
            const englishCard = container.querySelector('[data-subject-id="english"]');
            expect(englishCard.classList.contains('selected')).toBe(true);
        });

        it('应该移除其他卡片的高亮', () => {
            selector.highlightSelected('english');
            selector.highlightSelected('chinese');
            
            const englishCard = container.querySelector('[data-subject-id="english"]');
            const chineseCard = container.querySelector('[data-subject-id="chinese"]');
            
            expect(englishCard.classList.contains('selected')).toBe(false);
            expect(chineseCard.classList.contains('selected')).toBe(true);
        });

        it('应该正确设置aria-selected属性', () => {
            selector.highlightSelected('math');
            
            const mathCard = container.querySelector('[data-subject-id="math"]');
            const otherCards = container.querySelectorAll('.card-subject:not([data-subject-id="math"])');
            
            expect(mathCard.getAttribute('aria-selected')).toBe('true');
            otherCards.forEach(card => {
                expect(card.getAttribute('aria-selected')).toBe('false');
            });
        });
    });

    describe('clearSelection', () => {
        beforeEach(() => {
            selector.render(mockSubjects);
            selector.selectSubject('english');
        });

        it('应该清除选中状态', () => {
            selector.clearSelection();
            
            expect(selector.getSelectedSubject()).toBeNull();
        });

        it('应该移除所有卡片的选中样式', () => {
            selector.clearSelection();
            
            const cards = container.querySelectorAll('.card-subject');
            cards.forEach(card => {
                expect(card.classList.contains('selected')).toBe(false);
                expect(card.getAttribute('aria-selected')).toBe('false');
            });
        });
    });

    describe('点击交互', () => {
        beforeEach(() => {
            selector.render(mockSubjects);
        });

        it('应该在点击卡片时选择学科', () => {
            const englishCard = container.querySelector('[data-subject-id="english"]');
            englishCard.click();
            
            expect(selector.getSelectedSubject().id).toBe('english');
        });

        it('应该在点击卡片时高亮显示', () => {
            const chineseCard = container.querySelector('[data-subject-id="chinese"]');
            chineseCard.click();
            
            expect(chineseCard.classList.contains('selected')).toBe(true);
        });
    });

    describe('键盘交互', () => {
        beforeEach(() => {
            selector.render(mockSubjects);
        });

        it('应该在按Enter键时选择学科', () => {
            const mathCard = container.querySelector('[data-subject-id="math"]');
            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            mathCard.dispatchEvent(event);
            
            expect(selector.getSelectedSubject().id).toBe('math');
        });

        it('应该在按空格键时选择学科', () => {
            const englishCard = container.querySelector('[data-subject-id="english"]');
            const event = new KeyboardEvent('keydown', { key: ' ' });
            englishCard.dispatchEvent(event);
            
            expect(selector.getSelectedSubject().id).toBe('english');
        });
    });

    describe('showLoading', () => {
        it('应该显示加载状态', () => {
            selector.showLoading();
            
            const loadingContainer = container.querySelector('.loading-container');
            expect(loadingContainer).not.toBeNull();
            
            const loadingDots = container.querySelector('.loading-dots');
            expect(loadingDots).not.toBeNull();
        });

        it('应该设置isLoading为true', () => {
            selector.showLoading();
            
            expect(selector.isLoading()).toBe(true);
        });
    });

    describe('showError', () => {
        it('应该显示错误状态', () => {
            selector.showError('测试错误消息');
            
            const errorContainer = container.querySelector('.error-container');
            expect(errorContainer).not.toBeNull();
            
            const errorMessage = container.querySelector('.error-message');
            expect(errorMessage.textContent).toBe('测试错误消息');
        });

        it('应该显示重试按钮', () => {
            selector.showError('错误');
            
            const retryBtn = container.querySelector('.retry-btn');
            expect(retryBtn).not.toBeNull();
        });

        it('应该在点击重试按钮时触发回调', () => {
            const retryCallback = jest.fn();
            selector.showError('错误', retryCallback);
            
            const retryBtn = container.querySelector('.retry-btn');
            retryBtn.click();
            
            expect(retryCallback).toHaveBeenCalled();
        });
    });

    describe('destroy', () => {
        it('应该清空容器', () => {
            selector.render(mockSubjects);
            selector.destroy();
            
            expect(container.innerHTML).toBe('');
        });

        it('应该重置所有状态', () => {
            selector.render(mockSubjects);
            selector.selectSubject('english');
            selector.destroy();
            
            expect(selector.getSelectedSubject()).toBeNull();
            expect(selector.getSubjects()).toEqual([]);
        });
    });

    describe('无障碍访问', () => {
        beforeEach(() => {
            selector.render(mockSubjects);
        });

        it('应该设置正确的role属性', () => {
            const grid = container.querySelector('.subject-grid');
            expect(grid.getAttribute('role')).toBe('listbox');
            
            const cards = container.querySelectorAll('.card-subject');
            cards.forEach(card => {
                expect(card.getAttribute('role')).toBe('option');
            });
        });

        it('应该设置aria-label属性', () => {
            const grid = container.querySelector('.subject-grid');
            expect(grid.getAttribute('aria-label')).toBe('学科选择');
        });

        it('应该设置tabindex属性', () => {
            const cards = container.querySelectorAll('.card-subject');
            cards.forEach(card => {
                expect(card.getAttribute('tabindex')).toBe('0');
            });
        });
    });
});
