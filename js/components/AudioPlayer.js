/**
 * AudioPlayer - 音频播放器组件
 * 管理音频的加载和播放
 * 
 * @class AudioPlayer
 * Requirements: 5.1 - 点击可点读内容后播放对应的语音朗读
 */
class AudioPlayer {
    /**
     * 创建AudioPlayer实例
     */
    constructor() {
        // HTML5 Audio 元素
        this._audio = null;
        
        // 播放状态
        this._status = {
            isPlaying: false,
            currentAudioId: null,
            progress: 0
        };
        
        // 当前音色ID
        this._voiceId = 'voice-female';
        
        // 回调函数
        this._onCompleteCallback = null;
        this._onErrorCallback = null;
        this._onProgressCallback = null;
        
        // 调试模式
        this._debug = false;
        
        // 初始化Audio元素
        this._initAudio();
    }

    /**
     * 初始化HTML5 Audio元素
     * @private
     */
    _initAudio() {
        this._audio = new Audio();
        
        // 设置音频属性
        this._audio.preload = 'auto';
        
        // 绑定事件监听器
        this._bindAudioEvents();
    }

    /**
     * 绑定Audio事件监听器
     * @private
     */
    _bindAudioEvents() {
        // 播放结束事件
        this._audio.addEventListener('ended', () => {
            this._log('音频播放结束');
            this._status.isPlaying = false;
            this._status.progress = 100;
            
            if (this._onCompleteCallback) {
                this._onCompleteCallback(this._status.currentAudioId);
            }
        });

        // 播放错误事件
        this._audio.addEventListener('error', (event) => {
            const errorMessage = this._getErrorMessage(this._audio.error);
            this._log('音频播放错误:', errorMessage);
            
            this._status.isPlaying = false;
            
            if (this._onErrorCallback) {
                this._onErrorCallback({
                    audioId: this._status.currentAudioId,
                    message: errorMessage,
                    error: this._audio.error
                });
            }
        });

        // 播放进度更新事件
        this._audio.addEventListener('timeupdate', () => {
            if (this._audio.duration > 0) {
                this._status.progress = Math.round(
                    (this._audio.currentTime / this._audio.duration) * 100
                );
                
                if (this._onProgressCallback) {
                    this._onProgressCallback(this._status.progress, this._status.currentAudioId);
                }
            }
        });

        // 开始播放事件
        this._audio.addEventListener('play', () => {
            this._log('音频开始播放');
            this._status.isPlaying = true;
        });

        // 暂停事件
        this._audio.addEventListener('pause', () => {
            this._log('音频已暂停');
            this._status.isPlaying = false;
        });

        // 可以播放事件
        this._audio.addEventListener('canplay', () => {
            this._log('音频已加载，可以播放');
        });

        // 加载中事件
        this._audio.addEventListener('loadstart', () => {
            this._log('开始加载音频');
        });
    }

    /**
     * 获取错误消息
     * @param {MediaError} error - 媒体错误对象
     * @returns {string} 错误消息
     * @private
     */
    _getErrorMessage(error) {
        if (!error) {
            return '未知错误';
        }
        
        switch (error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
                return '音频加载被中断';
            case MediaError.MEDIA_ERR_NETWORK:
                return '网络错误，无法加载音频';
            case MediaError.MEDIA_ERR_DECODE:
                return '音频解码错误';
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                return '不支持的音频格式或音频不存在';
            default:
                return '音频播放出错';
        }
    }

    /**
     * 播放音频
     * @param {string} audioUrl - 音频URL
     * @returns {Promise<void>}
     */
    async play(audioUrl) {
        if (!audioUrl) {
            throw new Error('audioUrl is required');
        }

        this._log('播放音频:', audioUrl);

        // 如果正在播放其他音频，先停止
        if (this._status.isPlaying) {
            this.stop();
        }

        // 设置新的音频源
        this._audio.src = audioUrl;
        
        // 从URL中提取audioId（简化处理）
        this._status.currentAudioId = this._extractAudioId(audioUrl);
        this._status.progress = 0;

        try {
            // 加载并播放音频
            await this._audio.play();
            this._status.isPlaying = true;
        } catch (error) {
            this._log('播放失败:', error.message);
            this._status.isPlaying = false;
            
            if (this._onErrorCallback) {
                this._onErrorCallback({
                    audioId: this._status.currentAudioId,
                    message: error.message,
                    error: error
                });
            }
            
            throw error;
        }
    }

    /**
     * 从URL中提取音频ID
     * @param {string} url - 音频URL
     * @returns {string} 音频ID
     * @private
     */
    _extractAudioId(url) {
        if (!url) return null;
        
        // 从URL路径中提取文件名（不含扩展名）作为ID
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        return filename.replace(/\.[^/.]+$/, '');
    }

    /**
     * 停止播放
     */
    stop() {
        this._log('停止播放');
        
        if (this._audio) {
            this._audio.pause();
            this._audio.currentTime = 0;
        }
        
        this._status.isPlaying = false;
        this._status.progress = 0;
    }

    /**
     * 暂停播放
     */
    pause() {
        this._log('暂停播放');
        
        if (this._audio && this._status.isPlaying) {
            this._audio.pause();
            this._status.isPlaying = false;
        }
    }

    /**
     * 继续播放
     * @returns {Promise<void>}
     */
    async resume() {
        this._log('继续播放');
        
        if (this._audio && !this._status.isPlaying && this._audio.src) {
            try {
                await this._audio.play();
                this._status.isPlaying = true;
            } catch (error) {
                this._log('继续播放失败:', error.message);
                throw error;
            }
        }
    }

    /**
     * 设置音色
     * @param {string} voiceId - 音色ID
     */
    setVoice(voiceId) {
        if (!voiceId) {
            throw new Error('voiceId is required');
        }
        
        this._log('设置音色:', voiceId);
        this._voiceId = voiceId;
    }

    /**
     * 获取当前音色ID
     * @returns {string} 音色ID
     */
    getVoice() {
        return this._voiceId;
    }

    /**
     * 获取播放状态
     * @returns {PlaybackStatus} 播放状态对象
     */
    getStatus() {
        // 返回状态的副本
        return {
            isPlaying: this._status.isPlaying,
            currentAudioId: this._status.currentAudioId,
            progress: this._status.progress
        };
    }

    /**
     * 监听播放完成事件
     * @param {Function} callback - 回调函数，参数为audioId
     */
    onComplete(callback) {
        if (typeof callback !== 'function') {
            throw new Error('callback must be a function');
        }
        this._onCompleteCallback = callback;
    }

    /**
     * 监听播放错误事件
     * @param {Function} callback - 回调函数，参数为错误对象 {audioId, message, error}
     */
    onError(callback) {
        if (typeof callback !== 'function') {
            throw new Error('callback must be a function');
        }
        this._onErrorCallback = callback;
    }

    /**
     * 监听播放进度事件
     * @param {Function} callback - 回调函数，参数为 (progress, audioId)
     */
    onProgress(callback) {
        if (typeof callback !== 'function') {
            throw new Error('callback must be a function');
        }
        this._onProgressCallback = callback;
    }

    /**
     * 设置音量
     * @param {number} volume - 音量值 (0-1)
     */
    setVolume(volume) {
        if (typeof volume !== 'number' || volume < 0 || volume > 1) {
            throw new Error('volume must be a number between 0 and 1');
        }
        
        this._log('设置音量:', volume);
        this._audio.volume = volume;
    }

    /**
     * 获取音量
     * @returns {number} 音量值 (0-1)
     */
    getVolume() {
        return this._audio.volume;
    }

    /**
     * 设置播放速度
     * @param {number} rate - 播放速度 (0.5-2)
     */
    setPlaybackRate(rate) {
        if (typeof rate !== 'number' || rate < 0.5 || rate > 2) {
            throw new Error('playback rate must be a number between 0.5 and 2');
        }
        
        this._log('设置播放速度:', rate);
        this._audio.playbackRate = rate;
    }

    /**
     * 获取播放速度
     * @returns {number} 播放速度
     */
    getPlaybackRate() {
        return this._audio.playbackRate;
    }

    /**
     * 获取当前播放时间
     * @returns {number} 当前时间（秒）
     */
    getCurrentTime() {
        return this._audio.currentTime;
    }

    /**
     * 获取音频总时长
     * @returns {number} 总时长（秒），如果未加载则返回0
     */
    getDuration() {
        return this._audio.duration || 0;
    }

    /**
     * 跳转到指定时间
     * @param {number} time - 目标时间（秒）
     */
    seekTo(time) {
        if (typeof time !== 'number' || time < 0) {
            throw new Error('time must be a non-negative number');
        }
        
        const duration = this.getDuration();
        if (duration > 0 && time > duration) {
            time = duration;
        }
        
        this._log('跳转到:', time, '秒');
        this._audio.currentTime = time;
    }

    /**
     * 检查是否正在播放
     * @returns {boolean}
     */
    isPlaying() {
        return this._status.isPlaying;
    }

    /**
     * 检查是否已暂停
     * @returns {boolean}
     */
    isPaused() {
        return this._audio.paused && this._audio.currentTime > 0;
    }

    /**
     * 移除所有回调
     */
    removeAllCallbacks() {
        this._onCompleteCallback = null;
        this._onErrorCallback = null;
        this._onProgressCallback = null;
    }

    /**
     * 销毁播放器
     */
    destroy() {
        this._log('销毁播放器');
        
        // 停止播放
        this.stop();
        
        // 移除回调
        this.removeAllCallbacks();
        
        // 清理Audio元素
        if (this._audio) {
            this._audio.src = '';
            this._audio = null;
        }
        
        // 重置状态
        this._status = {
            isPlaying: false,
            currentAudioId: null,
            progress: 0
        };
    }

    /**
     * 设置调试模式
     * @param {boolean} enabled - 是否启用调试
     */
    setDebug(enabled) {
        this._debug = enabled;
    }

    /**
     * 调试日志
     * @param {...any} args - 日志参数
     * @private
     */
    _log(...args) {
        if (this._debug) {
            console.log('[AudioPlayer]', ...args);
        }
    }
}

// 导出单例实例
const audioPlayer = new AudioPlayer();

// 支持ES模块和CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioPlayer, audioPlayer };
}
