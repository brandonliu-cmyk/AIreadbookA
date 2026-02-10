/**
 * PageRenderer 单元测试
 * 测试页面渲染器组件的核心功能
 * 
 * Requirements: 4.1, 4.4
 */

describe('PageRenderer', () => {
    let container;
    let renderer;
    let mockDataManager;

    // 模拟页面内容数据
    const mockPageContent = {
        lessonId: 'lesson-1',
        pageNumber: 1,
        backgroundImage: 'assets/images/pages/test-page.png',
        clickableElements: [
            {
                id: 'elem-1',
                type: 'dialogue',
                content: 'Hello! I\'m Wu Yifan.',
                audioId: 'audio-hello',
                position: { x: 50, y: 100, width: 200, height: 40 },
                style: { fontSize: '16px', color: '#333' }
            },
            {
                id: 'elem-2',
                type: 'word',
                content: 'Hello',
                audioId: 'audio-word-hello',
                position: { x: 280, y: 100, width: 80, height: 30 },
                style: { fontSize: '18px', color: '#4A90D9', fontWeight: 'bold' }
            },
            {
                id: 'elem-3',
                type: 'text',
                content: '这是一段课文内容',
                audioId: 'audio-text-1',
                position: { x: 50, y: 200, width: 250, height: 40 }
            },
            {
                id: 'elem-4',
                type: 'formula',
                content: '1 + 1 = 2',
                audioId: 'audio-formula-1',
                position: { x: 50, y: 300, width: 120, height: 35 }
            }
        ]
    };

    // 空页面内容
    const emptyPageContent = {
        lessonId: 'lesson-2',
        pageNumber: 1,
        backgroundImage: null,
        clickableElements: []
    };

    beforeEach(() => {
        // 创建容器
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);

        // 创建模拟数据管理器
        mockDataManager = {
            getPageContent: jasmine.createSpy('getPageContent').and.returnValue(Promise.resolve(mockPageContent))
        };

        // 创建渲染器实例
        renderer = new PageRenderer(container);
        renderer.setDataManager(mockDataManager);
        renderer.setDebug(false);
    });

    afterEach(() => {
        // 清理
        if (renderer) {
            renderer.destroy();
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    describe('构造函数', () => {
        it('应该正确初始化组件', () => {
            expect(renderer).toBeDefined();
            expect(renderer.getContainer()).toBe(container);
            expect(renderer.getCurrentContent()).toBeNull();
            expect(renderer.getCurrentLessonId()).toBeNull();
            expect(renderer.getCurrentPageNumber()).toBe(1);
            expect(renderer.getZoomScale()).toBe(1);
        });

        it('应该在没有容器时抛出错误', () => {
            expect(() => new PageRenderer(null)).toThrowError('PageRenderer requires a valid HTMLElement container');
        });

        it('应该在容器不是HTMLElement时抛出错误', () => {
            expect(() => new PageRenderer('not-an-element')).toThrowError('PageRenderer requires a valid HTMLElement container');
        });
    });

    describe('loadPage', () => {
        it('应该成功加载页面内容', async () => {
            const content = await renderer.loadPage('lesson-1', 1);
            
            expect(mockDataManager.getPageContent).toHaveBeenCalledWith('lesson-1', 1);
            expect(content).toEqual(mockPageContent);
            expect(renderer.getCurrentContent()).toEqual(mockPageContent);
            expect(renderer.getCurrentLessonId()).toBe('lesson-1');
            expect(renderer.getCurrentPageNumber()).toBe(1);
        });

        it('应该在没有lessonId时抛出错误', async () => {
            await expectAsync(renderer.loadPage(null, 1)).toBeRejectedWithError('lessonId is required');
        });

        it('应该在pageNumber无效时抛出错误', async () => {
            await expectAsync(renderer.loadPage('lesson-1', 0)).toBeRejectedWithError('pageNumber must be a positive number');
            await expectAsync(renderer.loadPage('lesson-1', -1)).toBeRejectedWithError('pageNumber must be a positive number');
            await expectAsync(renderer.loadPage('lesson-1', 'abc')).toBeRejectedWithError('pageNumber must be a positive number');
        });

        it('应该在没有DataManager时抛出错误', async () => {
            renderer.setDataManager(null);
            await expectAsync(renderer.loadPage('lesson-1', 1)).toBeRejectedWithError('DataManager is not available');
        });
    });

    describe('render', () => {
        it('应该正确渲染页面内容', () => {
            renderer.render(mockPageContent);
            
            // 检查书本页面容器
            const bookPage = container.querySelector('.book-page');
            expect(bookPage).not.toBeNull();
            
            // 检查页面内容区域
            const contentArea = container.querySelector('.page-content-area');
            expect(contentArea).not.toBeNull();
            
            // 检查可点读元素容器
            const elementsContainer = container.querySelector('.clickable-elements-container');
            expect(elementsContainer).not.toBeNull();
        });

        it('应该渲染所有可点读元素', () => {
            renderer.render(mockPageContent);
            
            const clickableElements = container.querySelectorAll('.clickable-element');
            expect(clickableElements.length).toBe(4);
        });

        it('应该正确设置可点读元素的属性', () => {
            renderer.render(mockPageContent);
            
            const firstElement = container.querySelector('[data-element-id="elem-1"]');
            expect(firstElement).not.toBeNull();
            expect(firstElement.getAttribute('data-element-type')).toBe('dialogue');
            expect(firstElement.getAttribute('data-audio-id')).toBe('audio-hello');
            expect(firstElement.getAttribute('role')).toBe('button');
            expect(firstElement.getAttribute('tabindex')).toBe('0');
        });

        it('应该正确设置可点读元素的位置', () => {
            renderer.render(mockPageContent);
            
            const firstElement = container.querySelector('[data-element-id="elem-1"]');
            expect(firstElement.style.left).toBe('50px');
            expect(firstElement.style.top).toBe('100px');
            expect(firstElement.style.width).toBe('200px');
            expect(firstElement.style.height).toBe('40px');
        });

        it('应该正确应用可点读元素的自定义样式', () => {
            renderer.render(mockPageContent);
            
            const wordElement = container.querySelector('[data-element-id="elem-2"]');
            expect(wordElement.style.fontSize).toBe('18px');
            expect(wordElement.style.color).toBe('rgb(74, 144, 217)');
            expect(wordElement.style.fontWeight).toBe('bold');
        });

        it('应该为不同类型的元素添加对应的CSS类', () => {
            renderer.render(mockPageContent);
            
            const dialogueElement = container.querySelector('[data-element-id="elem-1"]');
            expect(dialogueElement.classList.contains('clickable-element-dialogue')).toBe(true);
            
            const wordElement = container.querySelector('[data-element-id="elem-2"]');
            expect(wordElement.classList.contains('clickable-element-word')).toBe(true);
            
            const textElement = container.querySelector('[data-element-id="elem-3"]');
            expect(textElement.classList.contains('clickable-element-text')).toBe(true);
            
            const formulaElement = container.querySelector('[data-element-id="elem-4"]');
            expect(formulaElement.classList.contains('clickable-element-formula')).toBe(true);
        });

        it('应该在content无效时抛出错误', () => {
            expect(() => renderer.render(null)).toThrowError('content must be a valid PageContent object');
            expect(() => renderer.render('not-an-object')).toThrowError('content must be a valid PageContent object');
        });

        it('应该正确处理没有可点读元素的页面', () => {
            renderer.render(emptyPageContent);
            
            const clickableElements = container.querySelectorAll('.clickable-element');
            expect(clickableElements.length).toBe(0);
        });
    });

    describe('markClickableContent', () => {
        beforeEach(() => {
            renderer.render(emptyPageContent);
        });

        it('应该标记可点读内容', () => {
            renderer.markClickableContent(mockPageContent.clickableElements);
            
            const clickableElements = container.querySelectorAll('.clickable-element');
            expect(clickableElements.length).toBe(4);
        });

        it('应该在传入非数组时不抛出错误', () => {
            expect(() => renderer.markClickableContent('not-an-array')).not.toThrow();
        });

        it('应该清空现有元素后重新标记', () => {
            renderer.markClickableContent(mockPageContent.clickableElements);
            expect(container.querySelectorAll('.clickable-element').length).toBe(4);
            
            renderer.markClickableContent([mockPageContent.clickableElements[0]]);
            expect(container.querySelectorAll('.clickable-element').length).toBe(1);
        });
    });

    describe('highlightContent / clearHighlight', () => {
        beforeEach(() => {
            renderer.render(mockPageContent);
        });

        it('应该高亮指定元素', () => {
            renderer.highlightContent('elem-1');
            
            const element = container.querySelector('[data-element-id="elem-1"]');
            expect(element.classList.contains('highlighted')).toBe(true);
            expect(renderer.getHighlightedElementId()).toBe('elem-1');
        });

        it('应该在高亮新元素时清除旧的高亮', () => {
            renderer.highlightContent('elem-1');
            renderer.highlightContent('elem-2');
            
            const oldElement = container.querySelector('[data-element-id="elem-1"]');
            const newElement = container.querySelector('[data-element-id="elem-2"]');
            
            expect(oldElement.classList.contains('highlighted')).toBe(false);
            expect(newElement.classList.contains('highlighted')).toBe(true);
            expect(renderer.getHighlightedElementId()).toBe('elem-2');
        });

        it('应该清除高亮', () => {
            renderer.highlightContent('elem-1');
            renderer.clearHighlight();
            
            const element = container.querySelector('[data-element-id="elem-1"]');
            expect(element.classList.contains('highlighted')).toBe(false);
            expect(renderer.getHighlightedElementId()).toBeNull();
        });

        it('应该忽略无效的elementId', () => {
            renderer.highlightContent(null);
            expect(renderer.getHighlightedElementId()).toBeNull();
            
            renderer.highlightContent('non-existent');
            expect(renderer.getHighlightedElementId()).toBeNull();
        });
    });

    describe('handleZoom', () => {
        beforeEach(() => {
            renderer.render(mockPageContent);
        });

        it('应该设置缩放比例', () => {
            renderer.handleZoom(1.5);
            
            expect(renderer.getZoomScale()).toBe(1.5);
            
            const bookPage = container.querySelector('.book-page');
            expect(bookPage.style.transform).toBe('scale(1.5)');
        });

        it('应该限制最小缩放比例', () => {
            renderer.handleZoom(0.1);
            
            expect(renderer.getZoomScale()).toBe(0.5); // 默认最小值
        });

        it('应该限制最大缩放比例', () => {
            renderer.handleZoom(5);
            
            expect(renderer.getZoomScale()).toBe(3); // 默认最大值
        });

        it('应该忽略非数字参数', () => {
            const initialScale = renderer.getZoomScale();
            renderer.handleZoom('invalid');
            
            expect(renderer.getZoomScale()).toBe(initialScale);
        });

        it('应该支持自定义缩放范围', () => {
            renderer.setZoomRange(0.2, 5);
            
            renderer.handleZoom(0.1);
            expect(renderer.getZoomScale()).toBe(0.2);
            
            renderer.handleZoom(6);
            expect(renderer.getZoomScale()).toBe(5);
        });
    });

    describe('zoomIn / zoomOut / resetZoom', () => {
        beforeEach(() => {
            renderer.render(mockPageContent);
        });

        it('应该放大页面', () => {
            renderer.zoomIn();
            expect(renderer.getZoomScale()).toBe(1.25);
            
            renderer.zoomIn(0.5);
            expect(renderer.getZoomScale()).toBe(1.75);
        });

        it('应该缩小页面', () => {
            renderer.zoomOut();
            expect(renderer.getZoomScale()).toBe(0.75);
            
            renderer.zoomOut(0.1);
            expect(renderer.getZoomScale()).toBe(0.65);
        });

        it('应该重置缩放', () => {
            renderer.handleZoom(2);
            renderer.resetZoom();
            
            expect(renderer.getZoomScale()).toBe(1);
        });
    });

    describe('缩放控制按钮 - Requirements: 4.3', () => {
        beforeEach(() => {
            renderer.render(mockPageContent);
        });

        it('应该创建缩放控制按钮', () => {
            const controls = renderer.createZoomControls();
            
            expect(controls).not.toBeNull();
            expect(controls.classList.contains('zoom-controls')).toBe(true);
            
            // 检查三个按钮
            expect(controls.querySelector('.zoom-btn-out')).not.toBeNull();
            expect(controls.querySelector('.zoom-btn-reset')).not.toBeNull();
            expect(controls.querySelector('.zoom-btn-in')).not.toBeNull();
        });

        it('应该显示当前缩放百分比', () => {
            renderer.createZoomControls();
            
            const resetBtn = container.querySelector('.zoom-btn-reset .zoom-btn-text');
            expect(resetBtn.textContent).toBe('100%');
        });

        it('点击放大按钮应该放大页面', () => {
            renderer.createZoomControls();
            
            const zoomInBtn = container.querySelector('.zoom-btn-in');
            zoomInBtn.click();
            
            expect(renderer.getZoomScale()).toBe(1.25);
            
            // 检查百分比更新
            const resetBtn = container.querySelector('.zoom-btn-reset .zoom-btn-text');
            expect(resetBtn.textContent).toBe('125%');
        });

        it('点击缩小按钮应该缩小页面', () => {
            renderer.createZoomControls();
            
            const zoomOutBtn = container.querySelector('.zoom-btn-out');
            zoomOutBtn.click();
            
            expect(renderer.getZoomScale()).toBe(0.75);
            
            // 检查百分比更新
            const resetBtn = container.querySelector('.zoom-btn-reset .zoom-btn-text');
            expect(resetBtn.textContent).toBe('75%');
        });

        it('点击重置按钮应该重置缩放', () => {
            renderer.handleZoom(2);
            renderer.createZoomControls();
            
            const resetBtn = container.querySelector('.zoom-btn-reset');
            resetBtn.click();
            
            expect(renderer.getZoomScale()).toBe(1);
        });

        it('应该在达到最小缩放时禁用缩小按钮', () => {
            renderer.handleZoom(0.5); // 设置为最小值
            renderer.createZoomControls();
            
            const zoomOutBtn = container.querySelector('.zoom-btn-out');
            expect(zoomOutBtn.disabled).toBe(true);
            expect(zoomOutBtn.classList.contains('disabled')).toBe(true);
        });

        it('应该在达到最大缩放时禁用放大按钮', () => {
            renderer.handleZoom(3); // 设置为最大值
            renderer.createZoomControls();
            
            const zoomInBtn = container.querySelector('.zoom-btn-in');
            expect(zoomInBtn.disabled).toBe(true);
            expect(zoomInBtn.classList.contains('disabled')).toBe(true);
        });

        it('应该能显示和隐藏缩放控制按钮', () => {
            renderer.createZoomControls();
            
            renderer.hideZoomControls();
            const controls = container.querySelector('.zoom-controls');
            expect(controls.classList.contains('hidden')).toBe(true);
            
            renderer.showZoomControls();
            expect(controls.classList.contains('visible')).toBe(true);
        });

        it('重复创建缩放控制按钮应该移除旧的', () => {
            renderer.createZoomControls();
            renderer.createZoomControls();
            
            const controls = container.querySelectorAll('.zoom-controls');
            expect(controls.length).toBe(1);
        });
    });

    describe('双指缩放手势 - Requirements: 4.3', () => {
        beforeEach(() => {
            renderer.render(mockPageContent);
        });

        it('应该绑定双指缩放手势事件', () => {
            const bookPageContainer = container.querySelector('.book-page-container');
            expect(bookPageContainer).not.toBeNull();
            
            // 验证事件监听器已绑定（通过触发事件测试）
            // 创建模拟的双指触摸事件
            const touchStartEvent = new TouchEvent('touchstart', {
                touches: [
                    { clientX: 100, clientY: 100, identifier: 0 },
                    { clientX: 200, clientY: 200, identifier: 1 }
                ],
                cancelable: true
            });
            
            // 事件应该被处理而不抛出错误
            expect(() => bookPageContainer.dispatchEvent(touchStartEvent)).not.toThrow();
        });

        it('应该计算两点之间的距离', () => {
            // 测试私有方法 _getTouchDistance
            const touch1 = { clientX: 0, clientY: 0 };
            const touch2 = { clientX: 3, clientY: 4 };
            
            const distance = renderer._getTouchDistance(touch1, touch2);
            expect(distance).toBe(5); // 3-4-5 三角形
        });

        it('缩放后页面应保持可读性', () => {
            // 测试缩放后的样式
            renderer.handleZoom(2);
            
            const bookPage = container.querySelector('.book-page');
            expect(bookPage.style.transform).toBe('scale(2)');
            expect(bookPage.getAttribute('data-zoom-scale')).toBe('2');
            
            // 验证缩放在合理范围内
            expect(renderer.getZoomScale()).toBeGreaterThanOrEqual(0.5);
            expect(renderer.getZoomScale()).toBeLessThanOrEqual(3);
        });
    });

    describe('showSkeleton', () => {
        it('应该显示骨架屏', () => {
            renderer.showSkeleton();
            
            const skeleton = container.querySelector('.page-skeleton');
            expect(skeleton).not.toBeNull();
            
            // 检查骨架屏元素
            expect(container.querySelector('.skeleton-header')).not.toBeNull();
            expect(container.querySelector('.skeleton-content')).not.toBeNull();
            expect(container.querySelector('.skeleton-elements')).not.toBeNull();
            expect(container.querySelector('.loading-text')).not.toBeNull();
            expect(container.querySelector('.loading-dots')).not.toBeNull();
        });

        it('应该设置加载状态', () => {
            renderer.showSkeleton();
            expect(renderer.isLoading()).toBe(true);
        });
    });

    describe('showError', () => {
        it('应该显示错误状态', () => {
            renderer.showError('测试错误消息');
            
            const errorContainer = container.querySelector('.error-container');
            expect(errorContainer).not.toBeNull();
            expect(container.querySelector('.error-message').textContent).toBe('测试错误消息');
        });

        it('应该显示默认错误消息', () => {
            renderer.showError();
            
            expect(container.querySelector('.error-message').textContent).toBe('页面加载失败，请重试');
        });

        it('应该绑定重试按钮事件', () => {
            const retryCallback = jasmine.createSpy('retry');
            renderer.showError('错误', retryCallback);
            
            const retryBtn = container.querySelector('.retry-btn');
            retryBtn.click();
            
            expect(retryCallback).toHaveBeenCalled();
        });
    });

    describe('showEmptyPage', () => {
        it('应该显示空页面状态', () => {
            renderer.showEmptyPage();
            
            const emptyContainer = container.querySelector('.empty-page-container');
            expect(emptyContainer).not.toBeNull();
            expect(container.querySelector('.empty-title').textContent).toContain('暂无页面内容');
        });
    });

    describe('事件交互', () => {
        beforeEach(() => {
            renderer.render(mockPageContent);
        });

        it('应该在点击可点读元素时触发回调', () => {
            const callback = jasmine.createSpy('onClickableElementClick');
            renderer.onClickableElementClick(callback);
            
            const element = container.querySelector('[data-element-id="elem-1"]');
            element.click();
            
            expect(callback).toHaveBeenCalled();
            const callArgs = callback.calls.first().args;
            expect(callArgs[1]).toBe('elem-1');
            expect(callArgs[2]).toBe('audio-hello');
            expect(callArgs[3]).toBe('dialogue');
        });

        it('应该支持键盘导航 - Enter键', () => {
            const callback = jasmine.createSpy('onClickableElementClick');
            renderer.onClickableElementClick(callback);
            
            const element = container.querySelector('[data-element-id="elem-1"]');
            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            element.dispatchEvent(event);
            
            expect(callback).toHaveBeenCalled();
        });

        it('应该支持键盘导航 - 空格键', () => {
            const callback = jasmine.createSpy('onClickableElementClick');
            renderer.onClickableElementClick(callback);
            
            const element = container.querySelector('[data-element-id="elem-1"]');
            const event = new KeyboardEvent('keydown', { key: ' ' });
            element.dispatchEvent(event);
            
            expect(callback).toHaveBeenCalled();
        });
    });

    describe('destroy', () => {
        it('应该清理组件状态', () => {
            renderer.render(mockPageContent);
            renderer.highlightContent('elem-1');
            renderer.handleZoom(2);
            
            renderer.destroy();
            
            expect(container.innerHTML).toBe('');
            expect(renderer.getCurrentContent()).toBeNull();
            expect(renderer.getCurrentLessonId()).toBeNull();
            expect(renderer.getCurrentPageNumber()).toBe(1);
            expect(renderer.getHighlightedElementId()).toBeNull();
            expect(renderer.getZoomScale()).toBe(1);
            expect(renderer.isLoading()).toBe(false);
        });
    });

    describe('getter方法', () => {
        it('应该返回正确的容器元素', () => {
            expect(renderer.getContainer()).toBe(container);
        });

        it('应该返回正确的当前内容', () => {
            renderer.render(mockPageContent);
            expect(renderer.getCurrentContent()).toEqual(mockPageContent);
        });

        it('应该返回正确的加载状态', () => {
            expect(renderer.isLoading()).toBe(false);
            renderer.showSkeleton();
            expect(renderer.isLoading()).toBe(true);
            renderer.hideSkeleton();
            expect(renderer.isLoading()).toBe(false);
        });
    });
});
