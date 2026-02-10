/**
 * VoiceSelector 单元测试
 * 测试音色选择器组件的功能
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

// 导入被测试的模块
const { VoiceSelector } = require('../../js/components/VoiceSelector');

describe('VoiceSelector', () => {
    let container;
    let voiceSelector;
    let mockDataManager;
    let mockStorageManager;
    let mockAudioPlayer;

    // 模拟音色数据
    const mockVoices = [
        {
            id: 'voice-female',
            name: '甜美女声',
            type: 'female',
            previewAudioUrl: 'assets/audio/preview-female.mp3',
            description: '温柔甜美的女性声音，适合英语和语文朗读'
        },
        {
            id: 'voice-male',
            name: '标准男声',
            type: 'male',
            previewAudioUrl: 'assets/audio/preview-male.mp3',
            description: '清晰标准的男性声音，适合各科目朗读'
        },
        {
            id: 'voice-child',
            name: '可爱童声',
            type: 'child',
            previewAudioUrl: 'assets/audio/preview-child.mp3',
            description: '活泼可爱的儿童声音，让学习更有趣'
        }
    ];

    beforeEach(() => {
        // 创建容器
        container = document.createElement('div');
        container.id = 'voice-selector-container';
        document.body.appendChild(container);

        // 创建模拟的DataManager
        mockDataManager = {
            getVoices: jest.fn().mockResolvedValue(mockVoices)
        };

        // 创建模拟的StorageManager
        mockStorageManager = {
            getSelectedVoiceId: jest.fn().mockReturnValue('voice-female'),
            saveSelectedVoiceId: jest.fn().mockReturnValue(true)
        };

        // 创建模拟的AudioPlayer
        mockAudioPlayer = {
            play: jest.fn().mockResolvedValue(undefined),
            stop: jest.fn(),
            setVoice: jest.fn(),
            getVoice: jest.fn().mockReturnValue('voice-female')
        };

        // 创建VoiceSelector实例
        voiceSelector = new VoiceSelector(container);
        voiceSelector.setDataManager(mockDataManager);
        voiceSelector.setStorageManager(mockStorageManager);
        voiceSelector.setAudioPlayer(mockAudioPlayer);
        voiceSelector.setDebug(false);
    });

    afterEach(() => {
        // 清理
        if (voiceSelector) {
            voiceSelector.destroy();
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    describe('构造函数', () => {
        it('应该正确创建实例', () => {
            expect(voiceSelector).toBeDefined();
            expect(voiceSelector.getContainer()).toBe(container);
        });

        it('应该在没有容器时抛出错误', () => {
            expect(() => new VoiceSelector(null)).toThrowError('VoiceSelector requires a valid HTMLElement container');
        });

        it('应该在容器不是HTMLElement时抛出错误', () => {
            expect(() => new VoiceSelector('not-an-element')).toThrowError('VoiceSelector requires a valid HTMLElement container');
        });
    });

    describe('loadVoices', () => {
        it('应该成功加载音色列表', async () => {
            const voices = await voiceSelector.loadVoices();
            
            expect(mockDataManager.getVoices).toHaveBeenCalled();
            expect(voices).toEqual(mockVoices);
            expect(voiceSelector.getVoices()).toEqual(mockVoices);
        });

        it('应该在没有DataManager时抛出错误', async () => {
            voiceSelector.setDataManager(null);
            
            await expect(voiceSelector.loadVoices()).rejects.toThrow('DataManager is not available');
        });

        it('应该在加载后设置已保存的音色为选中状态', async () => {
            await voiceSelector.loadVoices();
            
            const selectedVoice = voiceSelector.getSelectedVoice();
            expect(selectedVoice).toBeDefined();
            expect(selectedVoice.id).toBe('voice-female');
        });

        it('应该在没有保存偏好时默认选择第一个音色', async () => {
            mockStorageManager.getSelectedVoiceId.mockReturnValue(null);
            
            await voiceSelector.loadVoices();
            
            const selectedVoice = voiceSelector.getSelectedVoice();
            expect(selectedVoice).toBeDefined();
            expect(selectedVoice.id).toBe('voice-female'); // 第一个音色
        });
    });

    describe('render', () => {
        it('应该正确渲染音色列表', () => {
            voiceSelector.render(mockVoices);
            
            const voiceCards = container.querySelectorAll('.voice-card');
            expect(voiceCards.length).toBe(3);
        });

        it('应该显示音色名称', () => {
            voiceSelector.render(mockVoices);
            
            const voiceNames = container.querySelectorAll('.voice-name');
            expect(voiceNames[0].textContent).toBe('甜美女声');
            expect(voiceNames[1].textContent).toBe('标准男声');
            expect(voiceNames[2].textContent).toBe('可爱童声');
        });

        it('应该显示音色类型标签', () => {
            voiceSelector.render(mockVoices);
            
            const typeBadges = container.querySelectorAll('.voice-type-badge');
            expect(typeBadges[0].textContent).toBe('女声');
            expect(typeBadges[1].textContent).toBe('男声');
            expect(typeBadges[2].textContent).toBe('童声');
        });

        it('应该显示音色描述', () => {
            voiceSelector.render(mockVoices);
            
            const descriptions = container.querySelectorAll('.voice-description');
            expect(descriptions[0].textContent).toContain('温柔甜美');
            expect(descriptions[1].textContent).toContain('清晰标准');
            expect(descriptions[2].textContent).toContain('活泼可爱');
        });

        it('应该为每个音色显示试听按钮', () => {
            voiceSelector.render(mockVoices);
            
            const previewBtns = container.querySelectorAll('.btn-preview');
            expect(previewBtns.length).toBe(3);
        });

        it('应该在voices不是数组时抛出错误', () => {
            expect(() => voiceSelector.render('not-an-array')).toThrowError('voices must be an array');
        });

        it('应该渲染标题和副标题', () => {
            voiceSelector.render(mockVoices);
            
            const title = container.querySelector('.voice-selector-title');
            const subtitle = container.querySelector('.voice-selector-subtitle');
            
            expect(title).toBeDefined();
            expect(title.textContent).toContain('选择朗读音色');
            expect(subtitle).toBeDefined();
        });

        it('应该为音色卡片设置正确的data属性', () => {
            voiceSelector.render(mockVoices);
            
            const voiceCards = container.querySelectorAll('.voice-card');
            expect(voiceCards[0].getAttribute('data-voice-id')).toBe('voice-female');
            expect(voiceCards[1].getAttribute('data-voice-id')).toBe('voice-male');
            expect(voiceCards[2].getAttribute('data-voice-id')).toBe('voice-child');
        });

        it('应该为音色卡片设置正确的类型样式类', () => {
            voiceSelector.render(mockVoices);
            
            const voiceCards = container.querySelectorAll('.voice-card');
            expect(voiceCards[0].classList.contains('voice-type-female')).toBe(true);
            expect(voiceCards[1].classList.contains('voice-type-male')).toBe(true);
            expect(voiceCards[2].classList.contains('voice-type-child')).toBe(true);
        });
    });

    describe('selectVoice', () => {
        beforeEach(() => {
            voiceSelector.render(mockVoices);
        });

        it('应该正确选择音色', () => {
            voiceSelector.selectVoice('voice-male');
            
            const selectedVoice = voiceSelector.getSelectedVoice();
            expect(selectedVoice).toBeDefined();
            expect(selectedVoice.id).toBe('voice-male');
        });

        it('应该高亮显示选中的音色卡片', () => {
            voiceSelector.selectVoice('voice-male');
            
            const maleCard = container.querySelector('[data-voice-id="voice-male"]');
            expect(maleCard.classList.contains('selected')).toBe(true);
        });

        it('应该移除其他卡片的选中状态', () => {
            // 先选择女声
            voiceSelector.selectVoice('voice-female');
            // 再选择男声
            voiceSelector.selectVoice('voice-male');
            
            const femaleCard = container.querySelector('[data-voice-id="voice-female"]');
            const maleCard = container.querySelector('[data-voice-id="voice-male"]');
            
            expect(femaleCard.classList.contains('selected')).toBe(false);
            expect(maleCard.classList.contains('selected')).toBe(true);
        });

        it('应该保存用户偏好', () => {
            voiceSelector.selectVoice('voice-male');
            
            expect(mockStorageManager.saveSelectedVoiceId).toHaveBeenCalledWith('voice-male');
        });

        it('应该触发选择回调', () => {
            const callback = jest.fn();
            voiceSelector.onSelect(callback);
            
            voiceSelector.selectVoice('voice-male');
            
            expect(callback).toHaveBeenCalledWith(mockVoices[1]);
        });

        it('应该在无效ID时不执行任何操作', () => {
            const callback = jest.fn();
            voiceSelector.onSelect(callback);
            
            voiceSelector.selectVoice(null);
            voiceSelector.selectVoice('');
            voiceSelector.selectVoice('non-existent-id');
            
            expect(callback).not.toHaveBeenCalled();
        });

        it('应该设置aria-selected属性', () => {
            voiceSelector.selectVoice('voice-male');
            
            const maleCard = container.querySelector('[data-voice-id="voice-male"]');
            const femaleCard = container.querySelector('[data-voice-id="voice-female"]');
            
            expect(maleCard.getAttribute('aria-selected')).toBe('true');
            expect(femaleCard.getAttribute('aria-selected')).toBe('false');
        });
    });

    describe('getSelectedVoice', () => {
        it('应该返回当前选中的音色', () => {
            voiceSelector.render(mockVoices);
            voiceSelector.selectVoice('voice-child');
            
            const selectedVoice = voiceSelector.getSelectedVoice();
            expect(selectedVoice.id).toBe('voice-child');
            expect(selectedVoice.name).toBe('可爱童声');
        });

        it('应该在没有选中时返回null', () => {
            const newSelector = new VoiceSelector(container);
            expect(newSelector.getSelectedVoice()).toBeNull();
        });
    });

    describe('savePreference', () => {
        it('应该调用StorageManager保存偏好', () => {
            voiceSelector.savePreference('voice-child');
            
            expect(mockStorageManager.saveSelectedVoiceId).toHaveBeenCalledWith('voice-child');
        });

        it('应该在无效ID时不保存', () => {
            mockStorageManager.saveSelectedVoiceId.mockClear();
            
            voiceSelector.savePreference(null);
            voiceSelector.savePreference('');
            
            expect(mockStorageManager.saveSelectedVoiceId).not.toHaveBeenCalled();
        });
    });

    describe('clearSelection', () => {
        it('应该清除选中状态', () => {
            voiceSelector.render(mockVoices);
            voiceSelector.selectVoice('voice-male');
            voiceSelector.clearSelection();
            
            expect(voiceSelector.getSelectedVoice()).toBeNull();
            
            const selectedCards = container.querySelectorAll('.voice-card.selected');
            expect(selectedCards.length).toBe(0);
        });
    });

    describe('showLoading', () => {
        it('应该显示加载状态', () => {
            voiceSelector.showLoading();
            
            const loadingContainer = container.querySelector('.loading-container');
            const loadingDots = container.querySelector('.loading-dots');
            
            expect(loadingContainer).not.toBeNull();
            expect(loadingDots).not.toBeNull();
            expect(voiceSelector.isLoading()).toBe(true);
        });
    });

    describe('showError', () => {
        it('应该显示错误状态', () => {
            voiceSelector.showError('测试错误消息');
            
            const errorContainer = container.querySelector('.error-container');
            const errorMessage = container.querySelector('.error-message');
            
            expect(errorContainer).not.toBeNull();
            expect(errorMessage.textContent).toBe('测试错误消息');
        });

        it('应该显示重试按钮', () => {
            const retryCallback = jest.fn();
            voiceSelector.showError('错误', retryCallback);
            
            const retryBtn = container.querySelector('.retry-btn');
            expect(retryBtn).not.toBeNull();
            
            retryBtn.click();
            expect(retryCallback).toHaveBeenCalled();
        });
    });

    describe('destroy', () => {
        it('应该清空容器', () => {
            voiceSelector.render(mockVoices);
            voiceSelector.destroy();
            
            expect(container.innerHTML).toBe('');
        });

        it('应该重置所有状态', () => {
            voiceSelector.render(mockVoices);
            voiceSelector.selectVoice('voice-male');
            voiceSelector.destroy();
            
            expect(voiceSelector.getSelectedVoice()).toBeNull();
            expect(voiceSelector.getVoices()).toEqual([]);
            expect(voiceSelector.isLoading()).toBe(false);
            expect(voiceSelector.isPreviewing()).toBe(false);
        });
    });

    describe('点击交互', () => {
        beforeEach(() => {
            voiceSelector.render(mockVoices);
        });

        it('应该在点击卡片时选择音色', () => {
            const maleCard = container.querySelector('[data-voice-id="voice-male"]');
            maleCard.click();
            
            expect(voiceSelector.getSelectedVoice().id).toBe('voice-male');
        });

        it('应该支持键盘Enter键选择', () => {
            const maleCard = container.querySelector('[data-voice-id="voice-male"]');
            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            maleCard.dispatchEvent(event);
            
            expect(voiceSelector.getSelectedVoice().id).toBe('voice-male');
        });

        it('应该支持键盘空格键选择', () => {
            const childCard = container.querySelector('[data-voice-id="voice-child"]');
            const event = new KeyboardEvent('keydown', { key: ' ' });
            childCard.dispatchEvent(event);
            
            expect(voiceSelector.getSelectedVoice().id).toBe('voice-child');
        });
    });

    describe('音色类型显示 (Requirement 6.1)', () => {
        beforeEach(() => {
            voiceSelector.render(mockVoices);
        });

        it('应该显示男声类型', () => {
            const maleCard = container.querySelector('[data-voice-id="voice-male"]');
            const badge = maleCard.querySelector('.voice-type-badge');
            
            expect(badge.textContent).toBe('男声');
            expect(maleCard.classList.contains('voice-type-male')).toBe(true);
        });

        it('应该显示女声类型', () => {
            const femaleCard = container.querySelector('[data-voice-id="voice-female"]');
            const badge = femaleCard.querySelector('.voice-type-badge');
            
            expect(badge.textContent).toBe('女声');
            expect(femaleCard.classList.contains('voice-type-female')).toBe(true);
        });

        it('应该显示童声类型', () => {
            const childCard = container.querySelector('[data-voice-id="voice-child"]');
            const badge = childCard.querySelector('.voice-type-badge');
            
            expect(badge.textContent).toBe('童声');
            expect(childCard.classList.contains('voice-type-child')).toBe(true);
        });

        it('应该显示正确的类型图标', () => {
            const femaleIcon = container.querySelector('[data-voice-id="voice-female"] .voice-type-icon');
            const maleIcon = container.querySelector('[data-voice-id="voice-male"] .voice-type-icon');
            const childIcon = container.querySelector('[data-voice-id="voice-child"] .voice-type-icon');
            
            expect(femaleIcon.textContent).toBe('👩');
            expect(maleIcon.textContent).toBe('👨');
            expect(childIcon.textContent).toBe('👧');
        });
    });

    describe('选中状态样式 (Requirement 6.4)', () => {
        beforeEach(() => {
            voiceSelector.render(mockVoices);
        });

        it('应该为选中的卡片添加selected类', () => {
            voiceSelector.selectVoice('voice-female');
            
            const femaleCard = container.querySelector('[data-voice-id="voice-female"]');
            expect(femaleCard.classList.contains('selected')).toBe(true);
        });

        it('应该显示选中指示器', () => {
            voiceSelector.selectVoice('voice-male');
            
            const maleCard = container.querySelector('[data-voice-id="voice-male"]');
            const indicator = maleCard.querySelector('.voice-selected-indicator');
            
            expect(indicator).toBeDefined();
        });

        it('应该在切换选择时移除之前的选中状态', () => {
            voiceSelector.selectVoice('voice-female');
            voiceSelector.selectVoice('voice-male');
            
            const femaleCard = container.querySelector('[data-voice-id="voice-female"]');
            const maleCard = container.querySelector('[data-voice-id="voice-male"]');
            
            expect(femaleCard.classList.contains('selected')).toBe(false);
            expect(maleCard.classList.contains('selected')).toBe(true);
        });
    });

    describe('辅助方法', () => {
        it('getVoices应该返回音色列表的副本', () => {
            voiceSelector.render(mockVoices);
            
            const voices = voiceSelector.getVoices();
            expect(voices).toEqual(mockVoices);
            expect(voices).not.toBe(mockVoices); // 应该是副本
        });

        it('isLoading应该返回正确的加载状态', () => {
            expect(voiceSelector.isLoading()).toBe(false);
            
            voiceSelector.showLoading();
            expect(voiceSelector.isLoading()).toBe(true);
            
            voiceSelector.hideLoading();
            expect(voiceSelector.isLoading()).toBe(false);
        });

        it('isPreviewing应该返回正确的试听状态', () => {
            expect(voiceSelector.isPreviewing()).toBe(false);
        });

        it('getContainer应该返回容器元素', () => {
            expect(voiceSelector.getContainer()).toBe(container);
        });
    });

    describe('音色试听功能 (Requirement 6.2)', () => {
        beforeEach(() => {
            voiceSelector.render(mockVoices);
        });

        it('应该在点击试听按钮时播放预览音频', async () => {
            const previewBtn = container.querySelector('.btn-preview[data-voice-id="voice-female"]');
            previewBtn.click();
            
            // 等待异步操作
            await new Promise(resolve => setTimeout(resolve, 100));
            
            expect(mockAudioPlayer.play).toHaveBeenCalledWith('assets/audio/preview-female.mp3');
        });

        it('应该在试听时更新按钮状态', async () => {
            const previewBtn = container.querySelector('.btn-preview[data-voice-id="voice-male"]');
            
            // 模拟点击试听
            await voiceSelector.previewVoice('voice-male');
            
            // 试听完成后按钮应该恢复正常状态
            expect(previewBtn.classList.contains('previewing')).toBe(false);
        });

        it('应该在试听时禁用按钮', async () => {
            // 创建一个延迟的 play 方法
            mockAudioPlayer.play.mockImplementation(() => {
                return new Promise(resolve => setTimeout(resolve, 100));
            });
            
            const previewBtn = container.querySelector('.btn-preview[data-voice-id="voice-child"]');
            
            // 开始试听
            const previewPromise = voiceSelector.previewVoice('voice-child');
            
            // 检查按钮是否被禁用
            expect(previewBtn.disabled).toBe(true);
            
            // 等待试听完成
            await previewPromise;
        });

        it('应该在试听完成后恢复按钮状态', async () => {
            const previewBtn = container.querySelector('.btn-preview[data-voice-id="voice-female"]');
            
            await voiceSelector.previewVoice('voice-female');
            
            expect(previewBtn.disabled).toBe(false);
            expect(previewBtn.classList.contains('previewing')).toBe(false);
        });

        it('应该正确处理试听失败', async () => {
            mockAudioPlayer.play.mockRejectedValue(new Error('播放失败'));
            
            // 试听应该不会抛出错误
            await expect(voiceSelector.previewVoice('voice-male')).resolves.not.toThrow();
        });

        it('应该在无效音色ID时不执行试听', async () => {
            await voiceSelector.previewVoice(null);
            await voiceSelector.previewVoice('');
            await voiceSelector.previewVoice('non-existent');
            
            expect(mockAudioPlayer.play).not.toHaveBeenCalled();
        });
    });

    describe('音色选择和保存 (Requirement 6.3)', () => {
        beforeEach(() => {
            voiceSelector.render(mockVoices);
        });

        it('应该在选择音色时保存到StorageManager', () => {
            voiceSelector.selectVoice('voice-child');
            
            expect(mockStorageManager.saveSelectedVoiceId).toHaveBeenCalledWith('voice-child');
        });

        it('应该在选择音色时触发回调', () => {
            const callback = jest.fn();
            voiceSelector.onSelect(callback);
            
            voiceSelector.selectVoice('voice-male');
            
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                id: 'voice-male',
                name: '标准男声'
            }));
        });

        it('应该在加载时恢复已保存的音色选择', async () => {
            mockStorageManager.getSelectedVoiceId.mockReturnValue('voice-child');
            
            await voiceSelector.loadVoices();
            
            const selectedVoice = voiceSelector.getSelectedVoice();
            expect(selectedVoice.id).toBe('voice-child');
        });
    });

    describe('应用音色到音频播放 (Requirement 6.3)', () => {
        it('应该能够通过回调将音色应用到外部音频播放器', () => {
            voiceSelector.render(mockVoices);
            
            const applyVoiceCallback = jest.fn((voice) => {
                mockAudioPlayer.setVoice(voice.id);
            });
            
            voiceSelector.onSelect(applyVoiceCallback);
            voiceSelector.selectVoice('voice-child');
            
            expect(applyVoiceCallback).toHaveBeenCalledWith(expect.objectContaining({
                id: 'voice-child'
            }));
            expect(mockAudioPlayer.setVoice).toHaveBeenCalledWith('voice-child');
        });

        it('setAudioPlayer应该设置音频播放器', () => {
            const newAudioPlayer = { play: jest.fn() };
            voiceSelector.setAudioPlayer(newAudioPlayer);
            
            // 验证设置成功（通过内部状态）
            expect(voiceSelector._audioPlayer).toBe(newAudioPlayer);
        });
    });
});
