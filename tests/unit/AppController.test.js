/**
 * AppController 单元测试
 * 测试应用控制器的核心功能
 * 
 * Requirements: 1.3, 3.3
 */

const { AppController, PageType } = require('../../js/controllers/AppController');

describe('AppController', () => {
    let controller;

    beforeEach(() => {
        // 模拟 localStorage
        const localStorageMock = {
            store: {},
            getItem: jest.fn((key) => localStorageMock.store[key] || null),
            setItem: jest.fn((key, value) => {
                localStorageMock.store[key] = value;
            }),
            removeItem: jest.fn((key) => {
                delete localStorageMock.store[key];
            }),
            clear: jest.fn(() => {
                localStorageMock.store = {};
            })
        };
        global.localStorage = localStorageMock;

        // 创建新的控制器实例
        controller = new AppController();
        controller.setDebug(false); // 禁用调试输出
    });

    afterEach(() => {
        controller.clearAllListeners();
    });

    describe('初始化', () => {
        test('应该正确初始化应用状态', () => {
            controller.init();
            const state = controller.getCurrentState();

            expect(state.currentPage).toBe(PageType.HOME);
            expect(state.selectedSubject).toBeNull();
            expect(state.selectedTextbook).toBeNull();
            expect(state.selectedLesson).toBeNull();
            expect(state.currentPageNumber).toBe(1);
            expect(state.isPlaying).toBe(false);
            expect(state.isLoading).toBe(false);
        });

        test('多次初始化应该只执行一次', () => {
            const emitSpy = jest.spyOn(controller, 'emit');
            
            controller.init();
            controller.init();
            controller.init();

            // app:initialized 事件应该只触发一次
            const initCalls = emitSpy.mock.calls.filter(
                call => call[0] === 'app:initialized'
            );
            expect(initCalls.length).toBe(1);
        });

        test('初始化时应该触发 app:initialized 事件', () => {
            const callback = jest.fn();
            controller.on('app:initialized', callback);
            
            controller.init();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    state: expect.any(Object)
                })
            );
        });
    });

    describe('页面导航 (navigateTo)', () => {
        beforeEach(() => {
            controller.init();
        });

        test('应该正确导航到指定页面', () => {
            controller.navigateTo(PageType.SUBJECT);
            
            const state = controller.getCurrentState();
            expect(state.currentPage).toBe(PageType.SUBJECT);
        });

        test('导航时应该更新相关状态参数', () => {
            const subject = { id: 'english', name: '英语' };
            controller.navigateTo(PageType.SUBJECT, { subject });

            const state = controller.getCurrentState();
            expect(state.currentPage).toBe(PageType.SUBJECT);
            expect(state.selectedSubject).toEqual(subject);
        });

        test('导航时应该触发 navigation:change 事件', () => {
            const callback = jest.fn();
            controller.on('navigation:change', callback);

            controller.navigateTo(PageType.TEXTBOOK);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: PageType.HOME,
                    to: PageType.TEXTBOOK
                })
            );
        });

        test('导航时应该触发页面进入事件', () => {
            const callback = jest.fn();
            controller.on('page:subject:enter', callback);

            controller.navigateTo(PageType.SUBJECT, { subject: { id: 'math' } });

            expect(callback).toHaveBeenCalledTimes(1);
        });

        test('无效的页面类型应该被拒绝', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            controller.navigateTo('invalid_page');

            expect(consoleSpy).toHaveBeenCalled();
            expect(controller.getCurrentState().currentPage).toBe(PageType.HOME);
            
            consoleSpy.mockRestore();
        });

        test('应该支持所有有效的页面类型', () => {
            const validPages = [
                PageType.HOME,
                PageType.SUBJECT,
                PageType.TEXTBOOK,
                PageType.CHAPTER,
                PageType.READING,
                PageType.SETTINGS
            ];

            validPages.forEach(page => {
                controller.navigateTo(page);
                expect(controller.getCurrentState().currentPage).toBe(page);
            });
        });

        test('导航参数应该正确传递', () => {
            const params = {
                subject: { id: 'english' },
                textbook: { id: 'pep-grade3' },
                lesson: { id: 'unit1-lesson1' },
                pageNumber: 5
            };

            controller.navigateTo(PageType.READING, params);

            const state = controller.getCurrentState();
            expect(state.selectedSubject).toEqual(params.subject);
            expect(state.selectedTextbook).toEqual(params.textbook);
            expect(state.selectedLesson).toEqual(params.lesson);
            expect(state.currentPageNumber).toBe(5);
        });
    });

    describe('返回导航 (goBack)', () => {
        beforeEach(() => {
            controller.init();
        });

        test('从学科页面返回应该到首页', () => {
            controller.navigateTo(PageType.SUBJECT);
            const result = controller.goBack();

            expect(result).toBe(true);
            expect(controller.getCurrentState().currentPage).toBe(PageType.HOME);
        });

        test('从教材页面返回应该到学科页面', () => {
            controller.navigateTo(PageType.TEXTBOOK);
            controller.goBack();

            expect(controller.getCurrentState().currentPage).toBe(PageType.SUBJECT);
        });

        test('从章节页面返回应该到教材页面', () => {
            controller.navigateTo(PageType.CHAPTER);
            controller.goBack();

            expect(controller.getCurrentState().currentPage).toBe(PageType.TEXTBOOK);
        });

        test('从阅读页面返回应该到章节页面', () => {
            controller.navigateTo(PageType.READING);
            controller.goBack();

            expect(controller.getCurrentState().currentPage).toBe(PageType.CHAPTER);
        });

        test('从首页返回应该返回 false', () => {
            const result = controller.goBack();

            expect(result).toBe(false);
            expect(controller.getCurrentState().currentPage).toBe(PageType.HOME);
        });
    });

    describe('状态管理 (getCurrentState)', () => {
        beforeEach(() => {
            controller.init();
        });

        test('应该返回状态的副本而非引用', () => {
            const state1 = controller.getCurrentState();
            const state2 = controller.getCurrentState();

            expect(state1).not.toBe(state2);
            expect(state1).toEqual(state2);
        });

        test('修改返回的状态不应影响内部状态', () => {
            const state = controller.getCurrentState();
            state.currentPage = PageType.SETTINGS;
            state.selectedSubject = { id: 'modified' };

            const internalState = controller.getCurrentState();
            expect(internalState.currentPage).toBe(PageType.HOME);
            expect(internalState.selectedSubject).toBeNull();
        });

        test('应该包含所有必要的状态字段', () => {
            const state = controller.getCurrentState();

            expect(state).toHaveProperty('currentPage');
            expect(state).toHaveProperty('selectedSubject');
            expect(state).toHaveProperty('selectedTextbook');
            expect(state).toHaveProperty('selectedLesson');
            expect(state).toHaveProperty('currentPageNumber');
            expect(state).toHaveProperty('selectedVoice');
            expect(state).toHaveProperty('isPlaying');
            expect(state).toHaveProperty('isLoading');
        });
    });

    describe('事件发布/订阅 (on, emit)', () => {
        beforeEach(() => {
            controller.init();
        });

        test('应该能够注册事件监听器', () => {
            const callback = jest.fn();
            controller.on('test:event', callback);

            controller.emit('test:event', { data: 'test' });

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith({ data: 'test' });
        });

        test('应该支持多个监听器', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            const callback3 = jest.fn();

            controller.on('multi:event', callback1);
            controller.on('multi:event', callback2);
            controller.on('multi:event', callback3);

            controller.emit('multi:event', 'data');

            expect(callback1).toHaveBeenCalledWith('data');
            expect(callback2).toHaveBeenCalledWith('data');
            expect(callback3).toHaveBeenCalledWith('data');
        });

        test('应该返回取消订阅函数', () => {
            const callback = jest.fn();
            const unsubscribe = controller.on('unsub:event', callback);

            controller.emit('unsub:event');
            expect(callback).toHaveBeenCalledTimes(1);

            unsubscribe();
            controller.emit('unsub:event');
            expect(callback).toHaveBeenCalledTimes(1); // 仍然是1次
        });

        test('off 方法应该移除监听器', () => {
            const callback = jest.fn();
            controller.on('off:event', callback);

            controller.emit('off:event');
            expect(callback).toHaveBeenCalledTimes(1);

            controller.off('off:event', callback);
            controller.emit('off:event');
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test('once 方法应该只触发一次', () => {
            const callback = jest.fn();
            controller.once('once:event', callback);

            controller.emit('once:event', 'first');
            controller.emit('once:event', 'second');
            controller.emit('once:event', 'third');

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith('first');
        });

        test('无效的事件名称应该被拒绝', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            controller.on('', jest.fn());
            controller.on(null, jest.fn());
            controller.emit('');

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('无效的回调应该被拒绝', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            controller.on('valid:event', 'not a function');
            controller.on('valid:event', null);

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('监听器错误不应影响其他监听器', () => {
            const errorCallback = jest.fn(() => {
                throw new Error('Test error');
            });
            const normalCallback = jest.fn();

            controller.on('error:event', errorCallback);
            controller.on('error:event', normalCallback);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            controller.emit('error:event');
            consoleSpy.mockRestore();

            expect(errorCallback).toHaveBeenCalled();
            expect(normalCallback).toHaveBeenCalled();
        });

        test('getListenerCount 应该返回正确的监听器数量', () => {
            expect(controller.getListenerCount('count:event')).toBe(0);

            controller.on('count:event', jest.fn());
            expect(controller.getListenerCount('count:event')).toBe(1);

            controller.on('count:event', jest.fn());
            expect(controller.getListenerCount('count:event')).toBe(2);
        });

        test('getRegisteredEvents 应该返回所有已注册的事件', () => {
            controller.on('event1', jest.fn());
            controller.on('event2', jest.fn());
            controller.on('event3', jest.fn());

            const events = controller.getRegisteredEvents();
            
            expect(events).toContain('event1');
            expect(events).toContain('event2');
            expect(events).toContain('event3');
        });

        test('clearAllListeners 应该清除所有监听器', () => {
            controller.on('clear:event1', jest.fn());
            controller.on('clear:event2', jest.fn());

            controller.clearAllListeners();

            expect(controller.getRegisteredEvents().length).toBe(0);
        });
    });

    describe('状态更新方法', () => {
        beforeEach(() => {
            controller.init();
        });

        test('setLoading 应该更新加载状态并触发事件', () => {
            const callback = jest.fn();
            controller.on('loading:change', callback);

            controller.setLoading(true);
            expect(controller.getCurrentState().isLoading).toBe(true);
            expect(callback).toHaveBeenCalledWith({ isLoading: true });

            controller.setLoading(false);
            expect(controller.getCurrentState().isLoading).toBe(false);
            expect(callback).toHaveBeenCalledWith({ isLoading: false });
        });

        test('setPlaying 应该更新播放状态并触发事件', () => {
            const callback = jest.fn();
            controller.on('playing:change', callback);

            controller.setPlaying(true);
            expect(controller.getCurrentState().isPlaying).toBe(true);
            expect(callback).toHaveBeenCalledWith({ isPlaying: true });
        });

        test('setSelectedVoice 应该更新音色并触发事件', () => {
            const callback = jest.fn();
            controller.on('voice:change', callback);

            const voice = { id: 'female', name: '女声' };
            controller.setSelectedVoice(voice);

            expect(controller.getCurrentState().selectedVoice).toEqual(voice);
            expect(callback).toHaveBeenCalledWith({ voice });
        });

        test('setCurrentPageNumber 应该更新页码并触发事件', () => {
            const callback = jest.fn();
            controller.on('pageNumber:change', callback);

            controller.setCurrentPageNumber(5);

            expect(controller.getCurrentState().currentPageNumber).toBe(5);
            expect(callback).toHaveBeenCalledWith({ from: 1, to: 5 });
        });

        test('setCurrentPageNumber 应该拒绝无效页码', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            controller.setCurrentPageNumber(0);
            controller.setCurrentPageNumber(-1);
            controller.setCurrentPageNumber('invalid');

            expect(controller.getCurrentState().currentPageNumber).toBe(1);
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('重置功能', () => {
        beforeEach(() => {
            controller.init();
        });

        test('reset 应该重置所有状态', () => {
            // 先修改一些状态
            controller.navigateTo(PageType.READING, {
                subject: { id: 'english' },
                textbook: { id: 'pep' },
                lesson: { id: 'unit1' },
                pageNumber: 10
            });
            controller.setPlaying(true);
            controller.setLoading(true);

            // 重置
            controller.reset();

            const state = controller.getCurrentState();
            expect(state.currentPage).toBe(PageType.HOME);
            expect(state.selectedSubject).toBeNull();
            expect(state.selectedTextbook).toBeNull();
            expect(state.selectedLesson).toBeNull();
            expect(state.currentPageNumber).toBe(1);
            expect(state.isPlaying).toBe(false);
            expect(state.isLoading).toBe(false);
        });

        test('reset 应该触发 app:reset 事件', () => {
            const callback = jest.fn();
            controller.on('app:reset', callback);

            controller.reset();

            expect(callback).toHaveBeenCalledTimes(1);
        });
    });
});

describe('PageType 枚举', () => {
    test('应该包含所有必要的页面类型', () => {
        expect(PageType.HOME).toBe('home');
        expect(PageType.SUBJECT).toBe('subject');
        expect(PageType.TEXTBOOK).toBe('textbook');
        expect(PageType.CHAPTER).toBe('chapter');
        expect(PageType.READING).toBe('reading');
        expect(PageType.SETTINGS).toBe('settings');
    });

    test('PageType 应该是不可变的', () => {
        expect(Object.isFrozen(PageType)).toBe(true);
    });
});
