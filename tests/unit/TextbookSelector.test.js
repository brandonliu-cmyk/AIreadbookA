/**
 * TextbookSelector 单元测试
 * 测试教材选择器组件的核心功能
 * 
 * Requirements: 2.1, 2.3
 */

// 导入TextbookSelector组件
const { TextbookSelector } = require('../../js/components/TextbookSelector');

describe('TextbookSelector', () => {
    let container;
    let selector;
    let mockDataManager;

    // 模拟教材数据
    const mockTextbooks = [
        {
            id: 'english-pep-3-1',
            subjectId: 'english',
            name: 'PEP英语三年级上册',
            publisher: '人民教育出版社',
            grade: 3,
            semester: '上',
            coverImage: 'assets/images/covers/english-pep-3-1.png',
            totalChapters: 6
        },
        {
            id: 'english-pep-3-2',
            subjectId: 'english',
            name: 'PEP英语三年级下册',
            publisher: '人民教育出版社',
            grade: 3,
            semester: '下',
            coverImage: 'assets/images/covers/english-pep-3-2.png',
            totalChapters: 6
        },
        {
            id: 'english-pep-4-1',
            subjectId: 'english',
            name: 'PEP英语四年级上册',
            publisher: '人民教育出版社',
            grade: 4,
            semester: '上',
            coverImage: 'assets/images/covers/english-pep-4-1.png',
            totalChapters: 6
        }
    ];

    beforeEach(() => {
        // 创建测试容器
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);

        // 创建模拟数据管理器
        mockDataManager = {
            getTextbooks: jest.fn((subjectId) => {
                return Promise.resolve(mockTextbooks.filter(t => t.subjectId === subjectId));
            })
        };

        // 创建选择器实例
        selector = new TextbookSelector(container);
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
        it('应该正确创建实例', () => {
            expect(selector).toBeInstanceOf(TextbookSelector);
        });

        it('应该在没有容器时抛出错误', () => {
            expect(() => {
                new TextbookSelector(null);
            }).toThrow('TextbookSelector requires a valid HTMLElement container');
        });

        it('应该在容器不是HTMLElement时抛出错误', () => {
            expect(() => {
                new TextbookSelector('not-an-element');
            }).toThrow('TextbookSelector requires a valid HTMLElement container');
        });
    });

    describe('loadTextbooks', () => {
        it('应该成功加载教材列表', async () => {
            const textbooks = await selector.loadTextbooks('english');
            expect(Array.isArray(textbooks)).toBe(true);
            expect(textbooks.length).toBe(3);
        });

        it('应该在没有subjectId时抛出错误', async () => {
            await expect(selector.loadTextbooks()).rejects.toThrow('subjectId is required');
        });

        it('应该在没有DataManager时抛出错误', async () => {
            selector.setDataManager(null);
            await expect(selector.loadTextbooks('english')).rejects.toThrow('DataManager is not available');
        });

        it('应该记录当前学科ID', async () => {
            await selector.loadTextbooks('english');
            expect(selector.getCurrentSubjectId()).toBe('english');
        });
    });

    describe('render', () => {
        it('应该正确渲染教材列表', () => {
            selector.render(mockTextbooks);
            
            const cards = container.querySelectorAll('.card-textbook');
            expect(cards.length).toBe(3);
        });

        it('应该显示教材标题', () => {
            selector.render(mockTextbooks);
            
            const titles = container.querySelectorAll('.card-textbook-title');
            expect(titles[0].textContent).toBe('PEP英语三年级上册');
        });

        it('应该显示出版社信息', () => {
            selector.render(mockTextbooks);
            
            const publishers = container.querySelectorAll('.card-textbook-publisher');
            expect(publishers[0].textContent).toBe('人民教育出版社');
        });

        it('应该显示年级和学期信息', () => {
            selector.render(mockTextbooks);
            
            const grades = container.querySelectorAll('.textbook-grade');
            const semesters = container.querySelectorAll('.textbook-semester');
            
            expect(grades[0].textContent).toContain('3年级');
            expect(semesters[0].textContent).toContain('上学期');
        });

        it('应该在教材列表为空时显示空状态', () => {
            selector.render([]);
            
            const emptyState = container.querySelector('.textbook-empty-state');
            expect(emptyState).not.toBeNull();
        });

        it('应该在空状态时显示友好提示', () => {
            selector.render([]);
            
            const emptyTitle = container.querySelector('.empty-title');
            expect(emptyTitle.textContent).toBe('内容即将上线');
        });

        it('应该在textbooks不是数组时抛出错误', () => {
            expect(() => {
                selector.render('not-an-array');
            }).toThrow('textbooks must be an array');
        });

        it('应该创建页面标题', () => {
            selector.render(mockTextbooks);
            
            const title = container.querySelector('.textbook-selector-title');
            expect(title).not.toBeNull();
            expect(title.textContent).toContain('选择教材');
        });
    });

    describe('selectTextbook', () => {
        beforeEach(() => {
            selector.render(mockTextbooks);
        });

        it('应该正确选择教材', () => {
            selector.selectTextbook('english-pep-3-1');
            
            const selected = selector.getSelectedTextbook();
            expect(selected).not.toBeNull();
            expect(selected.id).toBe('english-pep-3-1');
        });

        it('应该高亮显示选中的教材', () => {
            selector.selectTextbook('english-pep-3-1');
            
            const selectedCard = container.querySelector('[data-textbook-id="english-pep-3-1"]');
            expect(selectedCard.classList.contains('selected')).toBe(true);
        });

        it('应该设置aria-selected属性', () => {
            selector.selectTextbook('english-pep-3-1');
            
            const selectedCard = container.querySelector('[data-textbook-id="english-pep-3-1"]');
            expect(selectedCard.getAttribute('aria-selected')).toBe('true');
        });

        it('应该移除其他教材的选中状态', () => {
            selector.selectTextbook('english-pep-3-1');
            selector.selectTextbook('english-pep-3-2');
            
            const firstCard = container.querySelector('[data-textbook-id="english-pep-3-1"]');
            const secondCard = container.querySelector('[data-textbook-id="english-pep-3-2"]');
            
            expect(firstCard.classList.contains('selected')).toBe(false);
            expect(secondCard.classList.contains('selected')).toBe(true);
        });

        it('应该触发选择回调', () => {
            const mockCallback = jest.fn();
            selector.onSelect(mockCallback);
            
            selector.selectTextbook('english-pep-3-1');
            
            expect(mockCallback).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(mockTextbooks[0]);
        });

        it('应该在无效ID时不做任何操作', () => {
            selector.selectTextbook('invalid-id');
            
            const selected = selector.getSelectedTextbook();
            expect(selected).toBeNull();
        });

        it('应该在空ID时不做任何操作', () => {
            selector.selectTextbook('');
            
            const selected = selector.getSelectedTextbook();
            expect(selected).toBeNull();
        });
    });

    describe('getSelectedTextbook', () => {
        it('应该在未选择时返回null', () => {
            selector.render(mockTextbooks);
            
            const selected = selector.getSelectedTextbook();
            expect(selected).toBeNull();
        });

        it('应该返回选中的教材对象', () => {
            selector.render(mockTextbooks);
            selector.selectTextbook('english-pep-3-1');
            
            const selected = selector.getSelectedTextbook();
            expect(selected).toEqual(mockTextbooks[0]);
        });
    });

    describe('showLoading', () => {
        it('应该显示加载动画', () => {
            selector.showLoading();
            
            const loadingContainer = container.querySelector('.loading-container');
            expect(loadingContainer).not.toBeNull();
        });

        it('应该显示加载文本', () => {
            selector.showLoading();
            
            const loadingText = container.querySelector('.loading-text');
            expect(loadingText.textContent).toContain('正在加载教材');
        });

        it('应该显示可爱的书本动画', () => {
            selector.showLoading();
            
            const bookAnimation = container.querySelector('.loading-book-animation');
            expect(bookAnimation).not.toBeNull();
        });

        it('应该显示跳动的点点', () => {
            selector.showLoading();
            
            const loadingDots = container.querySelector('.loading-dots');
            expect(loadingDots).not.toBeNull();
        });

        it('应该设置isLoading为true', () => {
            selector.showLoading();
            
            expect(selector.isLoading()).toBe(true);
        });
    });

    describe('hideLoading', () => {
        it('应该设置isLoading为false', () => {
            selector.showLoading();
            selector.hideLoading();
            
            expect(selector.isLoading()).toBe(false);
        });
    });

    describe('clearSelection', () => {
        it('应该清除选中状态', () => {
            selector.render(mockTextbooks);
            selector.selectTextbook('english-pep-3-1');
            selector.clearSelection();
            
            const selected = selector.getSelectedTextbook();
            expect(selected).toBeNull();
        });

        it('应该移除所有卡片的选中样式', () => {
            selector.render(mockTextbooks);
            selector.selectTextbook('english-pep-3-1');
            selector.clearSelection();
            
            const selectedCards = container.querySelectorAll('.card-textbook.selected');
            expect(selectedCards.length).toBe(0);
        });
    });

    describe('showError', () => {
        it('应该显示错误信息', () => {
            selector.showError('测试错误');
            
            const errorMessage = container.querySelector('.error-message');
            expect(errorMessage.textContent).toBe('测试错误');
        });

        it('应该显示重试按钮', () => {
            selector.showError('测试错误');
            
            const retryBtn = container.querySelector('.retry-btn');
            expect(retryBtn).not.toBeNull();
        });

        it('应该在点击重试按钮时触发回调', () => {
            const mockRetry = jest.fn();
            selector.showError('测试错误', mockRetry);
            
            const retryBtn = container.querySelector('.retry-btn');
            retryBtn.click();
            
            expect(mockRetry).toHaveBeenCalled();
        });
    });

    describe('点击交互', () => {
        beforeEach(() => {
            selector.render(mockTextbooks);
        });

        it('应该在点击卡片时选择教材', () => {
            const card = container.querySelector('[data-textbook-id="english-pep-3-1"]');
            card.click();
            
            const selected = selector.getSelectedTextbook();
            expect(selected.id).toBe('english-pep-3-1');
        });

        it('应该支持键盘Enter键选择', () => {
            const card = container.querySelector('[data-textbook-id="english-pep-3-1"]');
            
            const event = new KeyboardEvent('keydown', {
                key: 'Enter',
                bubbles: true
            });
            card.dispatchEvent(event);
            
            const selected = selector.getSelectedTextbook();
            expect(selected.id).toBe('english-pep-3-1');
        });

        it('应该支持键盘空格键选择', () => {
            const card = container.querySelector('[data-textbook-id="english-pep-3-1"]');
            
            const event = new KeyboardEvent('keydown', {
                key: ' ',
                bubbles: true
            });
            card.dispatchEvent(event);
            
            const selected = selector.getSelectedTextbook();
            expect(selected.id).toBe('english-pep-3-1');
        });
    });

    describe('无障碍支持', () => {
        beforeEach(() => {
            selector.render(mockTextbooks);
        });

        it('应该设置role="listbox"', () => {
            const grid = container.querySelector('.textbook-grid');
            expect(grid.getAttribute('role')).toBe('listbox');
        });

        it('应该设置aria-label', () => {
            const grid = container.querySelector('.textbook-grid');
            expect(grid.getAttribute('aria-label')).toBe('教材选择');
        });

        it('应该为每个卡片设置role="option"', () => {
            const cards = container.querySelectorAll('.card-textbook');
            cards.forEach((card) => {
                expect(card.getAttribute('role')).toBe('option');
            });
        });

        it('应该为每个卡片设置tabindex', () => {
            const cards = container.querySelectorAll('.card-textbook');
            cards.forEach((card) => {
                expect(card.getAttribute('tabindex')).toBe('0');
            });
        });
    });

    describe('getTextbooks', () => {
        it('应该返回教材列表的副本', () => {
            selector.render(mockTextbooks);
            
            const textbooks = selector.getTextbooks();
            expect(textbooks).toEqual(mockTextbooks);
            
            // 确保是副本而不是原数组
            textbooks.push({ id: 'new' });
            expect(selector.getTextbooks().length).toBe(3);
        });
    });

    describe('destroy', () => {
        it('应该清空容器', () => {
            selector.render(mockTextbooks);
            selector.destroy();
            
            expect(container.innerHTML).toBe('');
        });

        it('应该重置所有状态', () => {
            selector.render(mockTextbooks);
            selector.selectTextbook('english-pep-3-1');
            selector.destroy();
            
            expect(selector.getSelectedTextbook()).toBeNull();
            expect(selector.getTextbooks().length).toBe(0);
            expect(selector.getCurrentSubjectId()).toBeNull();
        });
    });
});
