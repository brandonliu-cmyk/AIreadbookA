/**
 * 音频管理模块
 * 负责文字转音频（TTS模拟）、音频状态管理、音频播放
 */
const AudioManager = (() => {
    let isGenerating = false;
    let cancelRequested = false;

    // 模拟 TTS 生成（返回 Promise）
    function simulateTTS(text, voiceId) {
        return new Promise((resolve, reject) => {
            const duration = 500 + Math.random() * 1500; // 0.5-2秒
            setTimeout(() => {
                if (cancelRequested) {
                    reject(new Error('cancelled'));
                    return;
                }
                // 5% 概率失败模拟
                if (Math.random() < 0.05) {
                    reject(new Error('TTS generation failed'));
                    return;
                }
                resolve({
                    voiceId,
                    text,
                    audioUrl: `audio://${voiceId}/${encodeURIComponent(text)}`,
                    duration: (1 + Math.random() * 4).toFixed(1) + 's',
                    generatedAt: new Date().toISOString()
                });
            }, duration);
        });
    }

    // 为单个热区生成所有音色的音频
    async function generateForZone(zone, voiceIds, onProgress) {
        const results = {};
        for (let i = 0; i < voiceIds.length; i++) {
            if (cancelRequested) break;
            const vid = voiceIds[i];
            try {
                if (onProgress) onProgress(vid, 'generating');
                const result = await simulateTTS(zone.content, vid);
                results[vid] = { status: 'ready', ...result };
                if (onProgress) onProgress(vid, 'ready');
            } catch (err) {
                if (err.message === 'cancelled') break;
                results[vid] = { status: 'error', error: err.message };
                if (onProgress) onProgress(vid, 'error');
            }
        }
        return results;
    }

    // 批量生成所有热区的音频
    async function generateAll(zones, voiceIds, onProgress) {
        isGenerating = true;
        cancelRequested = false;
        const total = zones.filter(z => z.content && z.content.trim()).length * voiceIds.length;
        let completed = 0;

        for (const zone of zones) {
            if (cancelRequested) break;
            if (!zone.content || !zone.content.trim()) continue;

            for (const vid of voiceIds) {
                if (cancelRequested) break;
                try {
                    const result = await simulateTTS(zone.content, vid);
                    zone.audioStatus = zone.audioStatus || {};
                    zone.audioStatus[vid] = 'ready';
                    completed++;
                    if (onProgress) {
                        onProgress({
                            zoneId: zone.id,
                            zoneNum: zone.num,
                            voiceId: vid,
                            status: 'ready',
                            completed,
                            total,
                            percent: Math.round((completed / total) * 100)
                        });
                    }
                } catch (err) {
                    if (err.message === 'cancelled') break;
                    zone.audioStatus = zone.audioStatus || {};
                    zone.audioStatus[vid] = 'error';
                    completed++;
                    if (onProgress) {
                        onProgress({
                            zoneId: zone.id,
                            zoneNum: zone.num,
                            voiceId: vid,
                            status: 'error',
                            completed,
                            total,
                            percent: Math.round((completed / total) * 100)
                        });
                    }
                }
            }
        }

        isGenerating = false;
        return !cancelRequested;
    }

    function cancel() {
        cancelRequested = true;
    }

    // 模拟播放音频
    function playAudio(voiceId, text) {
        // 使用 Web Speech API 模拟播放
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = /[\u4e00-\u9fa5]/.test(text) ? 'zh-CN' : 'en-US';
            utterance.rate = 0.9;
            switch (voiceId) {
                case 'male': utterance.pitch = 0.8; break;
                case 'female': utterance.pitch = 1.3; break;
                case 'child': utterance.pitch = 1.6; utterance.rate = 1.0; break;
            }
            window.speechSynthesis.speak(utterance);
            return utterance;
        }
        return null;
    }

    function stopAudio() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    return {
        generateForZone,
        generateAll,
        cancel,
        playAudio,
        stopAudio,
        get isGenerating() { return isGenerating; }
    };
})();
