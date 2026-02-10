/**
 * TutorialGuide 单元测试
 * 测试首次使用引导组件的所有功能
 * 
 * Requirements: 8.5 - 用户首次使用应用时显示简短有趣的引导教程
 */

describe('TutorialGuide', () => {
    let tutorialGuide;
    let container;

    // 在每个测试前清理 localStorage 并创建新实例
    beforeEach(() => {
        localStorage.clear();
        
        // 创建测试容器
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);
        
        // 创建新实例
        tutorialGuide = new TutorialGuide({
            container: container
        });
    });

    // 在每个测试后清理
    afterEach(() => {
        localStorage.clear();
        
        // 隐藏并清理引导
        if (tutorialGuide && tutorialGuide.isVisible) {
            tutorialGuide.hide();
        }
        
        // 移除测试容器
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        
        // 等待动画完成
        return new Promise(resolve => setTimeout(resolve, 350));
    });

    describe('首次使用检测', () => {
        it('应该正确检测首次使用状态', () => {
            // 首次使用时应返回 true
            expect(tutorialGuide.isFirstTimeUser()).toBe(true);
        });

        it('标记完成后应该返回非首次使用', () => {
            tutorialGuide.markAsCompleted();
            expect(tutorialGuide.isFirstTimeUser()).toBe(false);
        });

        it('重置状态后应该返回首次使用', () => {
            tutorialGuide.markAsCompleted();
            expect(tutorialGuide.isFirstTimeUser()).toBe(false);
            
            tutorialGuide.resetTutorialStatus();
            expect(tutorialGuide.isFirstTimeUser()).toBe(true);
        });
    });

    describe('显示和隐藏', () => {
        it('应该成功显示引导教程', () => {
            const result = tutorialGuide.show();
            
            expect(result).toBe(true);
            expect(tutorialGuide.isVisible).toBe(true);
        });

        it('重复显示应该返回 false', () => {
            tutorialGuide.show();
            const result = tutorialGuide.show();
            
            expect(result).toBe(false);
        });

        it('应该成功隐藏引导教程', (done) => {
            tutorialGuide.show();
            tutorialGuide.hide();
            
            // 等待动画完成
            setTimeout(() => {
                expect(tutorialGuide.isVisible).toBe(false);
                done();
            }, 350);
        });

        it('显示时应该创建遮罩层元素', () => {
            tutorialGuide.show();
            
            const overlay = container.querySelector('.tutorial-overlay');
            expect(overlay).not.toBeNull();
        });

        it('显示时应该渲染第一步内容', () => {
            tutorialGuide.show();
            
            const title = container.querySelector('.tutorial-title');
            expect(title).not.toBeNull();
            expect(title.textContent).toContain('欢迎');
        });
    });

    describe('步骤导航', () => {
        beforeEach(() => {
            tutorialGuide.show();
        });

        it('应该从第一步开始', () => {
            expect(tutorialGuide.getCurrentStepIndex()).toBe(0);
            expect(tutorialGuide.isFirstStep()).toBe(true);
        });

        it('应该成功前进到下一步', (done) => {
            const result = tutorialGuide.nextStep();
            
            setTimeout(() => {
                expect(result).toBe(true);
                expect(tutorialGuide.getCurrentStepIndex()).toBe(1);
                done();
            }, 200);
        });

        it('应该成功返回上一步', (done) => {
            tutorialGuide.nextStep();
            
            setTimeout(() => {
                const result = tutorialGuide.prevStep();
                
                setTimeout(() => {
                    expect(result).toBe(true);
                    expect(tutorialGuide.getCurrentStepIndex()).toBe(0);
                    done();
                }, 200);
            }, 200);
        });

        it('在第一步时返回上一步应该返回 false', () => {
            const result = tutorialGuide.prevStep();
            
            expect(result).toBe(false);
            expect(tutorialGuide.getCurrentStepIndex()).toBe(0);
        });

        it('应该成功跳转到指定步骤', (done) => {
            const result = tutorialGuide.goToStep(2);
            
            setTimeout(() => {
                expect(result).toBe(true);
                expect(tutorialGuide.getCurrentStepIndex()).toBe(2);
                done();
            }, 200);
        });

        it('跳转到无效步骤应该返回 false', () => {
            const result = tutorialGuide.goToStep(100);
            
            expect(result).toBe(false);
        });

        it('跳转到负数步骤应该返回 false', () => {
            const result = tutorialGuide.goToStep(-1);
            
            expect(result).toBe(false);
        });
    });

    describe('步骤状态', () => {
        beforeEach(() => {
            tutorialGuide.show();
        });

        it('应该正确返回当前步骤数据', () => {
            const step = tutorialGuide.getCurrentStep();
            
            expect(step).toBeDefined();
            expect(step.id).toBe('welcome');
            expect(step.title).toBeDefined();
            expect(step.description).toBeDefined();
        });

        it('应该正确返回总步骤数', () => {
            const total = tutorialGuide.getTotalSteps();
            
            expect(total).toBe(TutorialGuide.DEFAULT_STEPS.length);
            expect(total).toBeGreaterThan(0);
        });

        it('应该正确检测第一步', () => {
            expect(tutorialGuide.isFirstStep()).toBe(true);
            expect(tutorialGuide.isLastStep()).toBe(false);
        });

        it('应该正确检测最后一步', (done) => {
            const lastIndex = tutorialGuide.getTotalSteps() - 1;
            tutorialGuide.goToStep(lastIndex);
            
            setTimeout(() => {
                expect(tutorialGuide.isFirstStep()).toBe(false);
                expect(tutorialGuide.isLastStep()).toBe(true);
                done();
            }, 200);
        });
    });

    describe('跳过功能', () => {
        it('跳过应该标记为已完成', () => {
            tutorialGuide.show();
            tutorialGuide.skip();
            
            expect(tutorialGuide.isFirstTimeUser()).toBe(false);
        });

        it('跳过应该隐藏引导', (done) => {
            tutorialGuide.show();
            tutorialGuide.skip();
            
            setTimeout(() => {
                expect(tutorialGuide.isVisible).toBe(false);
                done();
            }, 350);
        });

        it('跳过应该触发回调', (done) => {
            let callbackCalled = false;
            
            tutorialGuide.onSkip(() => {
                callbackCalled = true;
            });
            
            tutorialGuide.show();
            tutorialGuide.skip();
            
            setTimeout(() => {
                expect(callbackCalled).toBe(true);
                done();
            }, 100);
        });
    });

    describe('完成功能', () => {
        it('完成应该标记为已完成', (done) => {
            tutorialGuide.show();
            tutorialGuide.complete();
            
            setTimeout(() => {
                expect(tutorialGuide.isFirstTimeUser()).toBe(false);
                done();
            }, 100);
        });

        it('完成应该触发回调', (done) => {
            let callbackCalled = false;
            
            tutorialGuide.onComplete(() => {
                callbackCalled = true;
            });
            
            tutorialGuide.show();
            tutorialGuide.complete();
            
            // 等待完成动画和回调
            setTimeout(() => {
                expect(callbackCalled).toBe(true);
                done();
            }, 2000);
        });

        it('在最后一步点击下一步应该触发完成', (done) => {
            let completeCalled = false;
            
            tutorialGuide.onComplete(() => {
                completeCalled = true;
            });
            
            tutorialGuide.show();
            
            // 跳转到最后一步
            const lastIndex = tutorialGuide.getTotalSteps() - 1;
            tutorialGuide.goToStep(lastIndex);
            
            setTimeout(() => {
                // 在最后一步点击下一步
                const result = tutorialGuide.nextStep();
                
                expect(result).toBe(false); // 返回 false 因为触发了完成
                
                setTimeout(() => {
                    expect(completeCalled).toBe(true);
                    done();
                }, 2000);
            }, 200);
        });
    });

    describe('回调设置', () => {
        it('应该能够设置完成回调', () => {
            const callback = jasmine.createSpy('completeCallback');
            
            tutorialGuide.onComplete(callback);
            tutorialGuide.show();
            tutorialGuide.complete();
            
            // 等待完成动画
            return new Promise(resolve => {
                setTimeout(() => {
                    expect(callback).toHaveBeenCalled();
                    resolve();
                }, 2000);
            });
        });

        it('应该能够设置跳过回调', (done) => {
            const callback = jasmine.createSpy('skipCallback');
            
            tutorialGuide.onSkip(callback);
            tutorialGuide.show();
            tutorialGuide.skip();
            
            setTimeout(() => {
                expect(callback).toHaveBeenCalled();
                done();
            }, 100);
        });
    });

    describe('自定义步骤', () => {
        it('应该支持自定义步骤', () => {
            const customSteps = [
                {
                    id: 'custom1',
                    title: '自定义步骤1',
                    description: '这是自定义描述',
                    icon: '🎯',
                    mascot: '🐱',
                    backgroundColor: 'var(--gradient-primary)',
                    animation: 'bounce'
                },
                {
                    id: 'custom2',
                    title: '自定义步骤2',
                    description: '这是另一个自定义描述',
                    icon: '🎨',
                    mascot: '🐶',
                    backgroundColor: 'var(--gradient-secondary)',
                    animation: 'wiggle'
                }
            ];
            
            const customTutorial = new TutorialGuide({
                container: container,
                steps: customSteps
            });
            
            expect(customTutorial.getTotalSteps()).toBe(2);
            expect(customTutorial.getCurrentStep().id).toBe('custom1');
            
            customTutorial.show();
            
            const title = container.querySelector('.tutorial-title');
            expect(title.textContent).toContain('自定义步骤1');
        });
    });

    describe('调试模式', () => {
        it('应该能够设置调试模式', () => {
            tutorialGuide.setDebug(true);
            
            // 调试模式下应该正常工作
            tutorialGuide.show();
            expect(tutorialGuide.isVisible).toBe(true);
        });
    });

    describe('UI 元素渲染', () => {
        beforeEach(() => {
            tutorialGuide.show();
        });

        it('应该渲染跳过按钮', () => {
            const skipBtn = container.querySelector('.tutorial-skip-btn');
            expect(skipBtn).not.toBeNull();
        });

        it('应该渲染吉祥物', () => {
            const mascot = container.querySelector('.tutorial-mascot');
            expect(mascot).not.toBeNull();
        });

        it('应该渲染主图标', () => {
            const icon = container.querySelector('.tutorial-icon');
            expect(icon).not.toBeNull();
        });

        it('应该渲染进度指示器', () => {
            const progress = container.querySelector('.tutorial-progress');
            const dots = container.querySelectorAll('.tutorial-dot');
            
            expect(progress).not.toBeNull();
            expect(dots.length).toBe(tutorialGuide.getTotalSteps());
        });

        it('应该渲染导航按钮', () => {
            const nextBtn = container.querySelector('.tutorial-btn-next');
            expect(nextBtn).not.toBeNull();
        });

        it('第一步不应该显示上一步按钮', () => {
            const prevBtn = container.querySelector('.tutorial-btn-prev');
            expect(prevBtn).toBeNull();
        });

        it('非第一步应该显示上一步按钮', (done) => {
            tutorialGuide.nextStep();
            
            setTimeout(() => {
                const prevBtn = container.querySelector('.tutorial-btn-prev');
                expect(prevBtn).not.toBeNull();
                done();
            }, 200);
        });

        it('最后一步应该显示完成按钮样式', (done) => {
            const lastIndex = tutorialGuide.getTotalSteps() - 1;
            tutorialGuide.goToStep(lastIndex);
            
            setTimeout(() => {
                const completeBtn = container.querySelector('.tutorial-btn-complete');
                expect(completeBtn).not.toBeNull();
                done();
            }, 200);
        });

        it('应该渲染装饰星星', () => {
            const stars = container.querySelectorAll('.tutorial-star');
            expect(stars.length).toBeGreaterThan(0);
        });
    });

    describe('进度指示器交互', () => {
        beforeEach(() => {
            tutorialGuide.show();
        });

        it('当前步骤的点应该有激活样式', () => {
            const activeDot = container.querySelector('.tutorial-dot-active');
            expect(activeDot).not.toBeNull();
            expect(activeDot.dataset.step).toBe('0');
        });

        it('切换步骤后激活点应该更新', (done) => {
            tutorialGuide.nextStep();
            
            setTimeout(() => {
                const activeDot = container.querySelector('.tutorial-dot-active');
                expect(activeDot.dataset.step).toBe('1');
                done();
            }, 200);
        });
    });

    describe('存储键常量', () => {
        it('应该有正确的存储键', () => {
            expect(TutorialGuide.STORAGE_KEY).toBe('ai_reading_tutorial_completed');
        });
    });

    describe('默认步骤', () => {
        it('应该有默认步骤定义', () => {
            expect(TutorialGuide.DEFAULT_STEPS).toBeDefined();
            expect(Array.isArray(TutorialGuide.DEFAULT_STEPS)).toBe(true);
            expect(TutorialGuide.DEFAULT_STEPS.length).toBeGreaterThan(0);
        });

        it('每个默认步骤应该有必要的属性', () => {
            TutorialGuide.DEFAULT_STEPS.forEach(step => {
                expect(step.id).toBeDefined();
                expect(step.title).toBeDefined();
                expect(step.description).toBeDefined();
                expect(step.icon).toBeDefined();
                expect(step.mascot).toBeDefined();
                expect(step.backgroundColor).toBeDefined();
                expect(step.animation).toBeDefined();
            });
        });
    });

    describe('Requirements 8.5 验证', () => {
        it('首次使用时应该能够显示引导教程', () => {
            // 首次使用
            expect(tutorialGuide.isFirstTimeUser()).toBe(true);
            
            // 显示引导
            const result = tutorialGuide.show();
            expect(result).toBe(true);
            expect(tutorialGuide.isVisible).toBe(true);
        });

        it('引导教程应该是简短有趣的', () => {
            // 检查步骤数量合理（不超过10步）
            expect(tutorialGuide.getTotalSteps()).toBeLessThanOrEqual(10);
            
            // 检查每个步骤都有有趣的元素
            TutorialGuide.DEFAULT_STEPS.forEach(step => {
                // 有吉祥物
                expect(step.mascot).toBeDefined();
                // 有图标
                expect(step.icon).toBeDefined();
                // 有动画
                expect(step.animation).toBeDefined();
            });
        });

        it('完成引导后不应该再次显示', () => {
            tutorialGuide.markAsCompleted();
            
            // 创建新实例检查
            const newTutorial = new TutorialGuide({ container: container });
            expect(newTutorial.isFirstTimeUser()).toBe(false);
        });
    });
});
