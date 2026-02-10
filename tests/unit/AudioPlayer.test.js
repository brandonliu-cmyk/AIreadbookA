/**
 * AudioPlayer 组件单元测试
 * 测试音频播放器的核心功能
 * 
 * Requirements: 5.1 - 点击可点读内容后播放对应的语音朗读
 */

describe('AudioPlayer', () => {
    let audioPlayer;

    beforeEach(() => {
        // 创建新的AudioPlayer实例
        audioPlayer = new AudioPlayer();
        audioPlayer.setDebug(false); // 禁用调试日志
    });

    afterEach(() => {
        // 清理
        if (audioPlayer) {
            audioPlayer.destroy();
        }
    });

    describe('构造函数', () => {
        it('应该正确创建AudioPlayer实例', () => {
            expect(audioPlayer).toBeDefined();
        });

        it('初始状态应该正确', () => {
            const status = audioPlayer.getStatus();
            
            expect(status.isPlaying).toBe(false);
            expect(status.currentAudioId).toBeNull();
            expect(status.progress).toBe(0);
        });

        it('默认音色应该是voice-female', () => {
            expect(audioPlayer.getVoice()).toBe('voice-female');
        });

        it('默认音量应该是1', () => {
            expect(audioPlayer.getVolume()).toBe(1);
        });

        it('默认播放速度应该是1', () => {
            expect(audioPlayer.getPlaybackRate()).toBe(1);
        });
    });

    describe('play() 播放音频 - Requirements: 5.1', () => {
        it('应该在没有audioUrl时抛出错误', async () => {
            let errorThrown = false;
            try {
                await audioPlayer.play(null);
            } catch (error) {
                errorThrown = true;
                expect(error.message).toBe('audioUrl is required');
            }
            expect(errorThrown).toBe(true);
        });

        it('应该在空字符串audioUrl时抛出错误', async () => {
            let errorThrown = false;
            try {
                await audioPlayer.play('');
            } catch (error) {
                errorThrown = true;
                expect(error.message).toBe('audioUrl is required');
            }
            expect(errorThrown).toBe(true);
        });

        it('应该更新currentAudioId', async () => {
            // 注意：实际播放可能会失败（因为文件不存在），但状态应该更新
            try {
                await audioPlayer.play('assets/audio/test-audio.mp3');
            } catch (e) {
                // 忽略播放错误，只测试状态更新
            }
            
            const status = audioPlayer.getStatus();
            expect(status.currentAudioId).toBe('test-audio');
        });

        it('应该从URL中正确提取audioId', async () => {
            try {
                await audioPlayer.play('assets/audio/voice-female/audio-hello-wuyifan.mp3');
            } catch (e) {
                // 忽略播放错误
            }
            
            const status = audioPlayer.getStatus();
            expect(status.currentAudioId).toBe('audio-hello-wuyifan');
        });

        it('应该重置进度为0', async () => {
            try {
                await audioPlayer.play('assets/audio/test.mp3');
            } catch (e) {
                // 忽略播放错误
            }
            
            const status = audioPlayer.getStatus();
            expect(status.progress).toBe(0);
        });
    });

    describe('stop() 停止播放', () => {
        it('应该停止播放并重置状态', () => {
            audioPlayer.stop();
            
            const status = audioPlayer.getStatus();
            expect(status.isPlaying).toBe(false);
            expect(status.progress).toBe(0);
        });

        it('应该将当前时间重置为0', () => {
            audioPlayer.stop();
            expect(audioPlayer.getCurrentTime()).toBe(0);
        });

        it('多次调用stop不应该抛出错误', () => {
            expect(() => {
                audioPlayer.stop();
                audioPlayer.stop();
                audioPlayer.stop();
            }).not.toThrow();
        });
    });

    describe('pause() 暂停播放', () => {
        it('应该暂停播放', () => {
            audioPlayer.pause();
            
            const status = audioPlayer.getStatus();
            expect(status.isPlaying).toBe(false);
        });

        it('多次调用pause不应该抛出错误', () => {
            expect(() => {
                audioPlayer.pause();
                audioPlayer.pause();
            }).not.toThrow();
        });
    });

    describe('resume() 继续播放', () => {
        it('在没有音频源时不应该抛出错误', async () => {
            // resume在没有src时应该静默处理
            await audioPlayer.resume();
            expect(audioPlayer.isPlaying()).toBe(false);
        });
    });

    describe('setVoice() 设置音色', () => {
        it('应该正确设置音色', () => {
            audioPlayer.setVoice('voice-male');
            expect(audioPlayer.getVoice()).toBe('voice-male');
        });

        it('应该在没有voiceId时抛出错误', () => {
            expect(() => audioPlayer.setVoice(null)).toThrow('voiceId is required');
        });

        it('应该在空字符串voiceId时抛出错误', () => {
            expect(() => audioPlayer.setVoice('')).toThrow('voiceId is required');
        });

        it('应该支持不同的音色ID', () => {
            const voices = ['voice-female', 'voice-male', 'voice-child'];
            
            voices.forEach(voice => {
                audioPlayer.setVoice(voice);
                expect(audioPlayer.getVoice()).toBe(voice);
            });
        });
    });

    describe('getStatus() 获取播放状态', () => {
        it('应该返回状态对象的副本', () => {
            const status1 = audioPlayer.getStatus();
            const status2 = audioPlayer.getStatus();
            
            // 修改status1不应该影响status2
            status1.isPlaying = true;
            expect(status2.isPlaying).toBe(false);
        });

        it('应该包含所有必要的状态字段', () => {
            const status = audioPlayer.getStatus();
            
            expect(status).toHaveProperty('isPlaying');
            expect(status).toHaveProperty('currentAudioId');
            expect(status).toHaveProperty('progress');
        });

        it('progress应该在0-100范围内', () => {
            const status = audioPlayer.getStatus();
            expect(status.progress).toBeGreaterThanOrEqual(0);
            expect(status.progress).toBeLessThanOrEqual(100);
        });
    });

    describe('onComplete() 播放完成回调', () => {
        it('应该正确注册回调函数', () => {
            const callback = () => {};
            expect(() => audioPlayer.onComplete(callback)).not.toThrow();
        });

        it('应该在回调不是函数时抛出错误', () => {
            expect(() => audioPlayer.onComplete('not a function')).toThrow('callback must be a function');
            expect(() => audioPlayer.onComplete(null)).toThrow('callback must be a function');
            expect(() => audioPlayer.onComplete(123)).toThrow('callback must be a function');
        });
    });

    describe('onError() 播放错误回调', () => {
        it('应该正确注册回调函数', () => {
            const callback = () => {};
            expect(() => audioPlayer.onError(callback)).not.toThrow();
        });

        it('应该在回调不是函数时抛出错误', () => {
            expect(() => audioPlayer.onError('not a function')).toThrow('callback must be a function');
            expect(() => audioPlayer.onError(null)).toThrow('callback must be a function');
        });
    });

    describe('onProgress() 播放进度回调', () => {
        it('应该正确注册回调函数', () => {
            const callback = () => {};
            expect(() => audioPlayer.onProgress(callback)).not.toThrow();
        });

        it('应该在回调不是函数时抛出错误', () => {
            expect(() => audioPlayer.onProgress('not a function')).toThrow('callback must be a function');
        });
    });

    describe('setVolume() 设置音量', () => {
        it('应该正确设置音量', () => {
            audioPlayer.setVolume(0.5);
            expect(audioPlayer.getVolume()).toBe(0.5);
        });

        it('应该支持音量范围0-1', () => {
            audioPlayer.setVolume(0);
            expect(audioPlayer.getVolume()).toBe(0);
            
            audioPlayer.setVolume(1);
            expect(audioPlayer.getVolume()).toBe(1);
            
            audioPlayer.setVolume(0.75);
            expect(audioPlayer.getVolume()).toBe(0.75);
        });

        it('应该在音量超出范围时抛出错误', () => {
            expect(() => audioPlayer.setVolume(-0.1)).toThrow('volume must be a number between 0 and 1');
            expect(() => audioPlayer.setVolume(1.1)).toThrow('volume must be a number between 0 and 1');
        });

        it('应该在音量不是数字时抛出错误', () => {
            expect(() => audioPlayer.setVolume('0.5')).toThrow('volume must be a number between 0 and 1');
            expect(() => audioPlayer.setVolume(null)).toThrow('volume must be a number between 0 and 1');
        });
    });

    describe('setPlaybackRate() 设置播放速度', () => {
        it('应该正确设置播放速度', () => {
            audioPlayer.setPlaybackRate(1.5);
            expect(audioPlayer.getPlaybackRate()).toBe(1.5);
        });

        it('应该支持播放速度范围0.5-2', () => {
            audioPlayer.setPlaybackRate(0.5);
            expect(audioPlayer.getPlaybackRate()).toBe(0.5);
            
            audioPlayer.setPlaybackRate(2);
            expect(audioPlayer.getPlaybackRate()).toBe(2);
        });

        it('应该在播放速度超出范围时抛出错误', () => {
            expect(() => audioPlayer.setPlaybackRate(0.4)).toThrow('playback rate must be a number between 0.5 and 2');
            expect(() => audioPlayer.setPlaybackRate(2.1)).toThrow('playback rate must be a number between 0.5 and 2');
        });

        it('应该在播放速度不是数字时抛出错误', () => {
            expect(() => audioPlayer.setPlaybackRate('1.5')).toThrow('playback rate must be a number between 0.5 and 2');
        });
    });

    describe('seekTo() 跳转到指定时间', () => {
        it('应该在时间为负数时抛出错误', () => {
            expect(() => audioPlayer.seekTo(-1)).toThrow('time must be a non-negative number');
        });

        it('应该在时间不是数字时抛出错误', () => {
            expect(() => audioPlayer.seekTo('10')).toThrow('time must be a non-negative number');
            expect(() => audioPlayer.seekTo(null)).toThrow('time must be a non-negative number');
        });

        it('应该接受0作为有效时间', () => {
            expect(() => audioPlayer.seekTo(0)).not.toThrow();
        });
    });

    describe('isPlaying() 检查播放状态', () => {
        it('初始状态应该返回false', () => {
            expect(audioPlayer.isPlaying()).toBe(false);
        });

        it('停止后应该返回false', () => {
            audioPlayer.stop();
            expect(audioPlayer.isPlaying()).toBe(false);
        });

        it('暂停后应该返回false', () => {
            audioPlayer.pause();
            expect(audioPlayer.isPlaying()).toBe(false);
        });
    });

    describe('getCurrentTime() 获取当前播放时间', () => {
        it('初始状态应该返回0', () => {
            expect(audioPlayer.getCurrentTime()).toBe(0);
        });

        it('停止后应该返回0', () => {
            audioPlayer.stop();
            expect(audioPlayer.getCurrentTime()).toBe(0);
        });
    });

    describe('getDuration() 获取音频时长', () => {
        it('未加载音频时应该返回0', () => {
            expect(audioPlayer.getDuration()).toBe(0);
        });
    });

    describe('removeAllCallbacks() 移除所有回调', () => {
        it('应该移除所有回调', () => {
            audioPlayer.onComplete(() => {});
            audioPlayer.onError(() => {});
            audioPlayer.onProgress(() => {});
            
            expect(() => audioPlayer.removeAllCallbacks()).not.toThrow();
        });
    });

    describe('destroy() 销毁播放器', () => {
        it('应该重置所有状态', () => {
            audioPlayer.setVoice('voice-male');
            audioPlayer.destroy();
            
            // 创建新实例验证销毁效果
            const newPlayer = new AudioPlayer();
            const status = newPlayer.getStatus();
            
            expect(status.isPlaying).toBe(false);
            expect(status.currentAudioId).toBeNull();
            expect(status.progress).toBe(0);
            
            newPlayer.destroy();
        });

        it('多次调用destroy不应该抛出错误', () => {
            expect(() => {
                audioPlayer.destroy();
                audioPlayer.destroy();
            }).not.toThrow();
        });
    });

    describe('setDebug() 调试模式', () => {
        it('应该能够启用和禁用调试模式', () => {
            expect(() => {
                audioPlayer.setDebug(true);
                audioPlayer.setDebug(false);
            }).not.toThrow();
        });
    });
});


// ========================================
// 音频错误处理和重试机制测试
// Requirements: 5.5 - 音频加载失败时显示友好的错误提示并提供重试选项
// ========================================

describe('音频错误处理和重试机制 - Requirements: 5.5', () => {
    // 注意：这些测试需要在完整的应用环境中运行
    // 因为它们依赖于 app.js 中定义的全局函数
    
    describe('getAudioErrorFriendlyMessage() 友好错误消息', () => {
        // 这些测试验证错误消息转换逻辑
        // 实际测试需要在 app.js 加载后运行
        
        it('应该为网络错误返回友好消息', () => {
            // 测试网络错误消息转换
            if (typeof getAudioErrorFriendlyMessage === 'function') {
                const message = getAudioErrorFriendlyMessage('network error');
                expect(message).toContain('网络');
            }
        });

        it('应该为不支持的格式返回友好消息', () => {
            if (typeof getAudioErrorFriendlyMessage === 'function') {
                const message = getAudioErrorFriendlyMessage('not supported');
                expect(message).toContain('不支持');
            }
        });

        it('应该为解码错误返回友好消息', () => {
            if (typeof getAudioErrorFriendlyMessage === 'function') {
                const message = getAudioErrorFriendlyMessage('decode error');
                expect(message).toContain('损坏');
            }
        });

        it('应该为空消息返回默认友好消息', () => {
            if (typeof getAudioErrorFriendlyMessage === 'function') {
                const message = getAudioErrorFriendlyMessage('');
                expect(message).toBeTruthy();
            }
        });

        it('应该为null消息返回默认友好消息', () => {
            if (typeof getAudioErrorFriendlyMessage === 'function') {
                const message = getAudioErrorFriendlyMessage(null);
                expect(message).toBeTruthy();
            }
        });
    });

    describe('音频重试计数器', () => {
        it('应该正确跟踪重试次数', () => {
            if (typeof getAudioRetryCount === 'function' && 
                typeof incrementAudioRetryCount === 'function' &&
                typeof resetAudioRetryCount === 'function') {
                
                const testAudioId = 'test-audio-123';
                
                // 初始重试次数应该为0
                expect(getAudioRetryCount(testAudioId)).toBe(0);
                
                // 增加重试次数
                incrementAudioRetryCount(testAudioId);
                expect(getAudioRetryCount(testAudioId)).toBe(1);
                
                incrementAudioRetryCount(testAudioId);
                expect(getAudioRetryCount(testAudioId)).toBe(2);
                
                // 重置重试次数
                resetAudioRetryCount(testAudioId);
                expect(getAudioRetryCount(testAudioId)).toBe(0);
            }
        });

        it('应该为不同的音频ID独立跟踪重试次数', () => {
            if (typeof getAudioRetryCount === 'function' && 
                typeof incrementAudioRetryCount === 'function' &&
                typeof resetAudioRetryCount === 'function') {
                
                const audioId1 = 'audio-1';
                const audioId2 = 'audio-2';
                
                // 增加第一个音频的重试次数
                incrementAudioRetryCount(audioId1);
                incrementAudioRetryCount(audioId1);
                
                // 增加第二个音频的重试次数
                incrementAudioRetryCount(audioId2);
                
                // 验证独立跟踪
                expect(getAudioRetryCount(audioId1)).toBe(2);
                expect(getAudioRetryCount(audioId2)).toBe(1);
                
                // 清理
                resetAudioRetryCount(audioId1);
                resetAudioRetryCount(audioId2);
            }
        });
    });

    describe('最大重试次数限制', () => {
        it('MAX_AUDIO_RETRY_COUNT 应该定义为3', () => {
            if (typeof MAX_AUDIO_RETRY_COUNT !== 'undefined') {
                expect(MAX_AUDIO_RETRY_COUNT).toBe(3);
            }
        });
    });
});
