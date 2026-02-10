/**
 * BookFlipper 组件单元测试
 * 测试翻页控制器的核心功能
 * 
 * Requirements: 7.3, 7.6
 * - 7.3: 翻页时有流畅的翻页动画效果
 * - 7.6: 显示当前页码和总页数
 */

describe('BookFlipper', () => {
    let container;
    let bookFlipper;

    beforeEach(() => {
        // 创建测试容器
        container = document.createElement('div');
        container.id = 'test-book-flipper-container';
        document.body.appendChild(container);
        
        // 创建BookFlipper实例
        bookFlipper = new BookFlipper(container);
        bookFlipper.setDebug(false); // 禁用调试日志
    });

    afterEach(() => {
        // 清理
        if (bookFlipper) {
            bookFlipper.destroy();
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    describe('构造函数', () => {
        it('应该正确创建BookFlipper实例', () => {
            expect(bookFlipper).toBeDefined();
            expect(bookFlipper.getContainer()).toBe(container);
        });

        it('应该在没有容器时抛出错误', () => {
            expect(() => new BookFlipper(null)).toThrow('BookFlipper requires a valid HTMLElement container');
        });

        it('应该在容器不是HTMLElement时抛出错误', () => {
            expect(() => new BookFlipper('not-an-element')).toThrow('BookFlipper requires a valid HTMLElement container');
        });

        it('初始状态应该正确', () => {
            expect(bookFlipper.getCurrentPage()).toBe(1);
            expect(bookFlipper.getTotalPages()).toBe(0);
            expect(bookFlipper.isAnimating()).toBe(false);
        });
    });

    describe('init() 初始化', () => {
        it('应该正确初始化翻页功能', () => {
            bookFlipper.init(10);
            
            expect(bookFlipper.getTotalPages()).toBe(10);
            expect(bookFlipper.getCurrentPage()).toBe(1);
        });

        it('应该创建翻页容器HTML结构', () => {
            bookFlipper.init(5);
            
            expect(container.querySelector('.book-flipper-wrapper')).not.toBeNull();
            expect(container.querySelector('.book-flipper-container')).not.toBeNull();
            expect(container.querySelector('.book-flipper-animation-layer')).not.toBeNull();
            expect(container.querySelector('.book-flipper-content')).not.toBeNull();
        });

        it('应该创建页码指示器', () => {
            bookFlipper.init(5);
            
            const indicator = container.querySelector('.book-flipper-page-indicator');
            expect(indicator).not.toBeNull();
            expect(container.querySelector('.current-page-num')).not.toBeNull();
            expect(container.querySelector('.total-pages-num')).not.toBeNull();
        });

        it('应该创建导航按钮', () => {
            bookFlipper.init(5);
            
            expect(container.querySelector('.page-nav-prev')).not.toBeNull();
            expect(container.querySelector('.page-nav-next')).not.toBeNull();
        });

        it('应该创建边界消息元素', () => {
            bookFlipper.init(5);
            
            expect(container.querySelector('.book-flipper-boundary-message')).not.toBeNull();
        });

        it('应该在totalPages无效时抛出错误', () => {
            expect(() => bookFlipper.init(0)).toThrow('totalPages must be a positive number');
            expect(() => bookFlipper.init(-1)).toThrow('totalPages must be a positive number');
            expect(() => bookFlipper.init('abc')).toThrow('totalPages must be a positive number');
        });
    });

    describe('页码显示 - Requirements: 7.6', () => {
        beforeEach(() => {
            bookFlipper.init(10);
        });

        it('应该正确显示当前页码', () => {
            const currentPageNum = container.querySelector('.current-page-num');
            expect(currentPageNum.textContent).toBe('1');
        });

        it('应该正确显示总页数', () => {
            const totalPagesNum = container.querySelector('.total-pages-num');
            expect(totalPagesNum.textContent).toBe('10');
        });

        it('页码应该在翻页后更新', (done) => {
            bookFlipper.setAnimationDuration(50); // 加快动画速度
            bookFlipper.nextPage();
            
            setTimeout(() => {
                const currentPageNum = container.querySelector('.current-page-num');
                expect(currentPageNum.textContent).toBe('2');
                done();
            }, 100);
        });
    });

    describe('nextPage() 下一页', () => {
        beforeEach(() => {
            bookFlipper.init(5);
            bookFlipper.setAnimationDuration(50); // 加快动画速度
        });

        it('应该翻到下一页', (done) => {
            const result = bookFlipper.nextPage();
            expect(result).toBe(true);
            
            setTimeout(() => {
                expect(bookFlipper.getCurrentPage()).toBe(2);
                done();
            }, 100);
        });

        it('在最后一页时应该返回false', (done) => {
            // 先跳到最后一页
            bookFlipper.setCurrentPage(5);
            
            const result = bookFlipper.nextPage();
            expect(result).toBe(false);
            expect(bookFlipper.getCurrentPage()).toBe(5);
            done();
        });

        it('在最后一页时应该显示边界消息', (done) => {
            bookFlipper.setCurrentPage(5);
            bookFlipper.nextPage();
            
            setTimeout(() => {
                const boundaryMessage = container.querySelector('.book-flipper-boundary-message');
                expect(boundaryMessage.classList.contains('visible')).toBe(true);
                expect(container.querySelector('.boundary-text').textContent).toBe('已是最后一页啦！');
                done();
            }, 50);
        });
    });

    describe('prevPage() 上一页', () => {
        beforeEach(() => {
            bookFlipper.init(5);
            bookFlipper.setAnimationDuration(50);
        });

        it('应该翻到上一页', (done) => {
            bookFlipper.setCurrentPage(3);
            const result = bookFlipper.prevPage();
            expect(result).toBe(true);
            
            setTimeout(() => {
                expect(bookFlipper.getCurrentPage()).toBe(2);
                done();
            }, 100);
        });

        it('在第一页时应该返回false', () => {
            const result = bookFlipper.prevPage();
            expect(result).toBe(false);
            expect(bookFlipper.getCurrentPage()).toBe(1);
        });

        it('在第一页时应该显示边界消息', (done) => {
            bookFlipper.prevPage();
            
            setTimeout(() => {
                const boundaryMessage = container.querySelector('.book-flipper-boundary-message');
                expect(boundaryMessage.classList.contains('visible')).toBe(true);
                expect(container.querySelector('.boundary-text').textContent).toBe('已是第一页啦！');
                done();
            }, 50);
        });
    });

    describe('goToPage() 跳转到指定页', () => {
        beforeEach(() => {
            bookFlipper.init(10);
            bookFlipper.setAnimationDuration(50);
        });

        it('应该跳转到指定页', (done) => {
            bookFlipper.goToPage(5);
            
            setTimeout(() => {
                expect(bookFlipper.getCurrentPage()).toBe(5);
                done();
            }, 100);
        });

        it('应该限制页码在有效范围内', (done) => {
            bookFlipper.goToPage(100);
            
            setTimeout(() => {
                expect(bookFlipper.getCurrentPage()).toBe(10);
                done();
            }, 100);
        });

        it('应该限制页码不小于1', (done) => {
            bookFlipper.goToPage(-5);
            
            setTimeout(() => {
                expect(bookFlipper.getCurrentPage()).toBe(1);
                done();
            }, 100);
        });

        it('跳转到当前页时不应该触发动画', () => {
            bookFlipper.setCurrentPage(5);
            bookFlipper.goToPage(5);
            
            expect(bookFlipper.isAnimating()).toBe(false);
        });
    });

    describe('playFlipAnimation() 翻页动画 - Requirements: 7.3', () => {
        beforeEach(() => {
            bookFlipper.init(5);
            bookFlipper.setAnimationDuration(100);
        });

        it('应该播放向左翻页动画', (done) => {
            bookFlipper.playFlipAnimation('left').then(() => {
                expect(bookFlipper.isAnimating()).toBe(false);
                done();
            });
            
            expect(bookFlipper.isAnimating()).toBe(true);
        });

        it('应该播放向右翻页动画', (done) => {
            bookFlipper.playFlipAnimation('right').then(() => {
                expect(bookFlipper.isAnimating()).toBe(false);
                done();
            });
            
            expect(bookFlipper.isAnimating()).toBe(true);
        });

        it('动画期间应该添加正确的CSS类', (done) => {
            bookFlipper.playFlipAnimation('left');
            
            setTimeout(() => {
                const flipperContainer = container.querySelector('.book-flipper-container');
                const animationLayer = container.querySelector('.book-flipper-animation-layer');
                
                expect(flipperContainer.classList.contains('is-flipping')).toBe(true);
                expect(animationLayer.classList.contains('active')).toBe(true);
                expect(animationLayer.classList.contains('flipping-left')).toBe(true);
                done();
            }, 20);
        });

        it('动画结束后应该移除CSS类', (done) => {
            bookFlipper.playFlipAnimation('left').then(() => {
                const flipperContainer = container.querySelector('.book-flipper-container');
                const animationLayer = container.querySelector('.book-flipper-animation-layer');
                
                expect(flipperContainer.classList.contains('is-flipping')).toBe(false);
                expect(animationLayer.classList.contains('active')).toBe(false);
                done();
            });
        });
    });

    describe('showBoundaryMessage() 边界消息', () => {
        beforeEach(() => {
            bookFlipper.init(5);
        });

        it('应该显示第一页边界消息', () => {
            bookFlipper.showBoundaryMessage('first');
            
            const boundaryMessage = container.querySelector('.book-flipper-boundary-message');
            const boundaryText = container.querySelector('.boundary-text');
            
            expect(boundaryMessage.classList.contains('visible')).toBe(true);
            expect(boundaryText.textContent).toBe('已是第一页啦！');
        });

        it('应该显示最后一页边界消息', () => {
            bookFlipper.showBoundaryMessage('last');
            
            const boundaryMessage = container.querySelector('.book-flipper-boundary-message');
            const boundaryText = container.querySelector('.boundary-text');
            
            expect(boundaryMessage.classList.contains('visible')).toBe(true);
            expect(boundaryText.textContent).toBe('已是最后一页啦！');
        });

        it('边界消息应该自动隐藏', (done) => {
            // 设置较短的消息显示时间
            bookFlipper._boundaryMessageDuration = 100;
            bookFlipper.showBoundaryMessage('first');
            
            setTimeout(() => {
                const boundaryMessage = container.querySelector('.book-flipper-boundary-message');
                expect(boundaryMessage.classList.contains('hidden')).toBe(true);
                done();
            }, 500);
        });
    });

    describe('导航按钮状态', () => {
        beforeEach(() => {
            bookFlipper.init(5);
        });

        it('在第一页时上一页按钮应该禁用', () => {
            const prevBtn = container.querySelector('.page-nav-prev');
            expect(prevBtn.disabled).toBe(true);
            expect(prevBtn.classList.contains('disabled')).toBe(true);
        });

        it('在最后一页时下一页按钮应该禁用', () => {
            bookFlipper.setCurrentPage(5);
            
            const nextBtn = container.querySelector('.page-nav-next');
            expect(nextBtn.disabled).toBe(true);
            expect(nextBtn.classList.contains('disabled')).toBe(true);
        });

        it('在中间页时两个按钮都应该启用', () => {
            bookFlipper.setCurrentPage(3);
            
            const prevBtn = container.querySelector('.page-nav-prev');
            const nextBtn = container.querySelector('.page-nav-next');
            
            expect(prevBtn.disabled).toBe(false);
            expect(nextBtn.disabled).toBe(false);
        });
    });

    describe('onPageChange() 页面变化回调', () => {
        beforeEach(() => {
            bookFlipper.init(5);
            bookFlipper.setAnimationDuration(50);
        });

        it('应该在翻页后触发回调', (done) => {
            let callbackCalled = false;
            let callbackPage = 0;
            let callbackTotal = 0;
            
            bookFlipper.onPageChange((currentPage, totalPages) => {
                callbackCalled = true;
                callbackPage = currentPage;
                callbackTotal = totalPages;
            });
            
            bookFlipper.nextPage();
            
            setTimeout(() => {
                expect(callbackCalled).toBe(true);
                expect(callbackPage).toBe(2);
                expect(callbackTotal).toBe(5);
                done();
            }, 100);
        });
    });

    describe('setTotalPages() 设置总页数', () => {
        beforeEach(() => {
            bookFlipper.init(10);
        });

        it('应该正确更新总页数', () => {
            bookFlipper.setTotalPages(20);
            expect(bookFlipper.getTotalPages()).toBe(20);
        });

        it('应该更新页码显示', () => {
            bookFlipper.setTotalPages(15);
            
            const totalPagesNum = container.querySelector('.total-pages-num');
            expect(totalPagesNum.textContent).toBe('15');
        });

        it('当前页超过新总页数时应该调整', () => {
            bookFlipper.setCurrentPage(10);
            bookFlipper.setTotalPages(5);
            
            expect(bookFlipper.getCurrentPage()).toBe(5);
        });
    });

    describe('setCurrentPage() 设置当前页', () => {
        beforeEach(() => {
            bookFlipper.init(10);
        });

        it('应该正确设置当前页', () => {
            bookFlipper.setCurrentPage(5);
            expect(bookFlipper.getCurrentPage()).toBe(5);
        });

        it('应该更新页码显示', () => {
            bookFlipper.setCurrentPage(7);
            
            const currentPageNum = container.querySelector('.current-page-num');
            expect(currentPageNum.textContent).toBe('7');
        });

        it('不应该设置超出范围的页码', () => {
            bookFlipper.setCurrentPage(100);
            expect(bookFlipper.getCurrentPage()).toBe(1); // 保持原值
            
            bookFlipper.setCurrentPage(0);
            expect(bookFlipper.getCurrentPage()).toBe(1); // 保持原值
        });
    });

    describe('getContentContainer() 获取内容容器', () => {
        beforeEach(() => {
            bookFlipper.init(5);
        });

        it('应该返回页面内容容器', () => {
            const contentContainer = bookFlipper.getContentContainer();
            expect(contentContainer).not.toBeNull();
            expect(contentContainer.classList.contains('current-page')).toBe(true);
        });
    });

    describe('setPageContent() 设置页面内容', () => {
        beforeEach(() => {
            bookFlipper.init(5);
        });

        it('应该设置字符串内容', () => {
            bookFlipper.setPageContent('<p>测试内容</p>');
            
            const contentContainer = bookFlipper.getContentContainer();
            expect(contentContainer.innerHTML).toBe('<p>测试内容</p>');
        });

        it('应该设置HTMLElement内容', () => {
            const element = document.createElement('div');
            element.textContent = '测试元素';
            
            bookFlipper.setPageContent(element);
            
            const contentContainer = bookFlipper.getContentContainer();
            expect(contentContainer.contains(element)).toBe(true);
        });
    });

    describe('destroy() 销毁组件', () => {
        beforeEach(() => {
            bookFlipper.init(5);
        });

        it('应该清空容器', () => {
            bookFlipper.destroy();
            expect(container.innerHTML).toBe('');
        });

        it('应该重置状态', () => {
            bookFlipper.setCurrentPage(3);
            bookFlipper.destroy();
            
            expect(bookFlipper.getCurrentPage()).toBe(1);
            expect(bookFlipper.getTotalPages()).toBe(0);
        });
    });

    describe('导航按钮点击事件', () => {
        beforeEach(() => {
            bookFlipper.init(5);
            bookFlipper.setAnimationDuration(50);
        });

        it('点击下一页按钮应该翻页', (done) => {
            bookFlipper.setCurrentPage(2);
            
            const nextBtn = container.querySelector('.page-nav-next');
            nextBtn.click();
            
            setTimeout(() => {
                expect(bookFlipper.getCurrentPage()).toBe(3);
                done();
            }, 100);
        });

        it('点击上一页按钮应该翻页', (done) => {
            bookFlipper.setCurrentPage(3);
            
            const prevBtn = container.querySelector('.page-nav-prev');
            prevBtn.click();
            
            setTimeout(() => {
                expect(bookFlipper.getCurrentPage()).toBe(2);
                done();
            }, 100);
        });
    });
});
