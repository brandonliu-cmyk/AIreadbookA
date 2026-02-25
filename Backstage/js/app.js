/**
 * 后台主应用控制器
 * 串联数据、热区编辑器、音频管理的完整流程
 */
(function() {
    'use strict';

    // ===== 状态 =====
    let currentSubject = '';
    let currentPublisher = null;
    let currentTextbook = null;
    let currentChapter = null;
    let currentPage = 1;
    let totalPages = 1;

    // ===== DOM 引用 =====
    const $ = id => document.getElementById(id);

    const els = {
        subjectSelect: $('subjectSelect'),
        publisherSelect: $('publisherSelect'),
        textbookSelect: $('textbookSelect'),
        chapterList: $('chapterList'),
        prevPage: $('prevPage'),
        nextPage: $('nextPage'),
        pageInfo: $('pageInfo'),
        emptyState: $('emptyState'),
        canvasContainer: $('canvasContainer'),
        canvasWrapper: $('canvasWrapper'),
        pageImage: $('pageImage'),
        hotzoneSvg: $('hotzoneSvg'),
        drawingRect: $('drawingRect'),
        // Toolbar
        btnSelect: $('btnSelect'),
        btnAddZone: $('btnAddZone'),
        btnAutoDetect: $('btnAutoDetect'),
        btnSaveAll: $('btnSaveAll'),
        btnGenerateAudio: $('btnGenerateAudio'),
        // Right panel
        panelEmpty: $('panelEmpty'),
        panelForm: $('panelForm'),
        zoneId: $('zoneId'),
        zoneContent: $('zoneContent'),
        zonePosX: $('zonePosX'),
        zonePosY: $('zonePosY'),
        zonePosW: $('zonePosW'),
        zonePosH: $('zonePosH'),
        audioList: $('audioList'),
        zoneList: $('zoneList'),
        totalZoneBadge: $('totalZoneBadge'),
        // Status
        statusText: $('statusText'),
        zoneCount: $('zoneCount'),
        // Audio modal
        audioModal: $('audioModal'),
        btnCloseAudioModal: $('btnCloseAudioModal'),
        voiceCheckboxes: $('voiceCheckboxes'),
        progressSection: $('progressSection'),
        progressText: $('progressText'),
        progressPercent: $('progressPercent'),
        progressFill: $('progressFill'),
        progressDetail: $('progressDetail'),
        btnCancelAudio: $('btnCancelAudio'),
        btnStartGenerate: $('btnStartGenerate'),
    };

    // ===== Toast =====
    function showToast(message, type = 'info') {
        const container = $('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
        toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            toast.style.transition = 'all 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ===== 学科选择 =====
    els.subjectSelect.addEventListener('change', function() {
        currentSubject = this.value;
        currentPublisher = null;
        currentTextbook = null;
        currentChapter = null;

        // 更新教材（出版社）下拉
        els.publisherSelect.disabled = !currentSubject;
        els.publisherSelect.innerHTML = '<option value="">请选择教材</option>';
        els.textbookSelect.disabled = true;
        els.textbookSelect.innerHTML = '<option value="">请先选择教材</option>';

        if (currentSubject) {
            const publishers = BackstageData.getPublishers(currentSubject);
            publishers.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.name;
                els.publisherSelect.appendChild(opt);
            });
        }

        els.chapterList.innerHTML = '<p class="placeholder-text">请先选择课本</p>';
        resetCanvas();
        setStatus('已选择学科: ' + (currentSubject === 'english' ? '英语' : currentSubject === 'chinese' ? '语文' : ''));
    });

    // ===== 教材（出版社）选择 =====
    els.publisherSelect.addEventListener('change', function() {
        const pubId = this.value;
        currentPublisher = pubId || null;
        currentTextbook = null;
        currentChapter = null;

        // 更新课本下拉
        els.textbookSelect.disabled = !pubId;
        els.textbookSelect.innerHTML = '<option value="">请选择课本</option>';

        if (pubId) {
            const books = BackstageData.getTextbooks(currentSubject, pubId);
            books.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.id;
                opt.textContent = b.name;
                els.textbookSelect.appendChild(opt);
            });
        }

        els.chapterList.innerHTML = '<p class="placeholder-text">请先选择课本</p>';
        resetCanvas();
    });

    // ===== 课本选择 =====
    els.textbookSelect.addEventListener('change', function() {
        const bookId = this.value;
        if (!bookId) {
            currentTextbook = null;
            els.chapterList.innerHTML = '<p class="placeholder-text">请先选择课本</p>';
            resetCanvas();
            return;
        }

        const books = BackstageData.getTextbooks(currentSubject, currentPublisher);
        currentTextbook = books.find(b => b.id === bookId);
        currentChapter = null;
        totalPages = currentTextbook.pages;

        // 加载章节列表
        loadChapterList();
        resetCanvas();
        showToast(`已加载课本: ${currentTextbook.name}`, 'info');
        setStatus(`课本: ${currentTextbook.name}`);
    });

    function loadChapterList() {
        const chapters = BackstageData.getChapters(currentSubject);
        els.chapterList.innerHTML = '';

        // 检查是否为分单元结构（语文）
        if (chapters.length > 0 && chapters[0].unit) {
            // 分单元层级展示
            chapters.forEach(unitData => {
                const unitHeader = document.createElement('div');
                unitHeader.className = 'unit-header';
                unitHeader.innerHTML = `<span class="unit-toggle">▾</span> ${unitData.unit}`;
                const unitBody = document.createElement('div');
                unitBody.className = 'unit-body';

                unitHeader.addEventListener('click', () => {
                    unitBody.classList.toggle('collapsed');
                    unitHeader.querySelector('.unit-toggle').textContent = unitBody.classList.contains('collapsed') ? '▸' : '▾';
                });

                unitData.lessons.forEach(ch => {
                    const status = BackstageData.getChapterStatus(currentTextbook.id, ch.id, totalPages);
                    const item = document.createElement('div');
                    item.className = 'chapter-item' + (currentChapter && currentChapter.id === ch.id ? ' active' : '');
                    item.innerHTML = `<span class="status-dot ${status}"></span><span>${ch.name}</span>`;
                    item.addEventListener('click', (e) => { e.stopPropagation(); selectChapter(ch, item); });
                    unitBody.appendChild(item);
                });

                els.chapterList.appendChild(unitHeader);
                els.chapterList.appendChild(unitBody);
            });
        } else {
            // 扁平列表（英语）
            chapters.forEach(ch => {
                const status = BackstageData.getChapterStatus(currentTextbook.id, ch.id, totalPages);
                const item = document.createElement('div');
                item.className = 'chapter-item' + (currentChapter && currentChapter.id === ch.id ? ' active' : '');
                item.innerHTML = `<span class="status-dot ${status}"></span><span>${ch.unitName} ${ch.name}</span>`;
                item.addEventListener('click', (e) => selectChapter(ch, e.currentTarget));
                els.chapterList.appendChild(item);
            });
        }
    }

    // ===== 章节选择 =====
    function selectChapter(chapter, itemEl) {
        currentChapter = chapter;
        currentPage = 1;

        // 更新章节列表高亮
        document.querySelectorAll('.chapter-item').forEach(el => el.classList.remove('active'));
        if (itemEl) itemEl.classList.add('active');

        loadPage();
        showToast(`已加载章节: ${chapter.name}`, 'info');
    }

    // ===== 页面加载 =====
    function loadPage() {
        if (!currentTextbook || !currentChapter) return;

        // 显示画布
        els.emptyState.classList.add('hidden');
        els.canvasContainer.classList.remove('hidden');

        // 加载图片
        const imgPath = BackstageData.getPageImagePath(currentSubject, currentTextbook.id, currentPage);
        els.pageImage.src = imgPath;
        els.pageImage.onerror = function() {
            // 如果图片不存在，使用占位图
            this.src = 'data:image/svg+xml,' + encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" fill="#f0f0f0">
                    <rect width="600" height="800" fill="#f8f9fa" stroke="#dee2e6"/>
                    <text x="300" y="380" text-anchor="middle" fill="#adb5bd" font-size="20">课本页面 第${currentPage}页</text>
                    <text x="300" y="420" text-anchor="middle" fill="#ced4da" font-size="14">${currentTextbook.name} - ${currentChapter.name}</text>
                </svg>`
            );
        };

        // 更新页码
        updatePageInfo();

        // 加载已有热区
        const savedZones = BackstageData.loadZones(currentTextbook.id, currentChapter.id, currentPage);
        HotzoneEditor.loadZones(savedZones);

        // 检查是否已规划过热区
        if (savedZones.length > 0) {
            showToast(`已加载 ${savedZones.length} 个热区`, 'success');
            setStatus(`第${currentPage}页 - 已有 ${savedZones.length} 个热区`);
        } else {
            setStatus(`第${currentPage}页 - 尚未规划热区`);
        }
    }

    function updatePageInfo() {
        els.pageInfo.textContent = `${currentPage} / ${totalPages}`;
        els.prevPage.disabled = currentPage <= 1;
        els.nextPage.disabled = currentPage >= totalPages;
    }

    function resetCanvas() {
        els.emptyState.classList.remove('hidden');
        els.canvasContainer.classList.add('hidden');
        HotzoneEditor.loadZones([]);
        updatePageInfo();
    }

    // ===== 翻页 =====
    els.prevPage.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; loadPage(); }
    });
    els.nextPage.addEventListener('click', () => {
        if (currentPage < totalPages) { currentPage++; loadPage(); }
    });

    // ===== 工具栏 =====
    els.btnSelect.addEventListener('click', () => {
        setActiveTool('select');
        HotzoneEditor.setTool('select');
    });

    els.btnAddZone.addEventListener('click', () => {
        if (!currentChapter) { showToast('请先选择章节', 'warning'); return; }
        setActiveTool('draw');
        HotzoneEditor.setTool('draw');
        showToast('在图片上拖拽绘制热区', 'info');
    });

    els.btnAutoDetect.addEventListener('click', () => {
        if (!currentChapter) { showToast('请先选择章节', 'warning'); return; }
        showToast('正在自动识别内容区域...', 'info');
        setStatus('自动识别中...');
        setTimeout(() => {
            HotzoneEditor.autoDetectZones();
            showToast('自动识别完成，请检查并调整热区', 'success');
            setStatus(`自动识别完成 - ${HotzoneEditor.getZones().length} 个热区`);
        }, 800);
    });

    els.btnSaveAll.addEventListener('click', () => {
        if (!currentTextbook || !currentChapter) { showToast('请先选择教材和章节', 'warning'); return; }
        saveCurrentPage();
        showToast('已保存全部热区数据', 'success');
    });

    els.btnOCRAll = $('btnOCRAll');
    els.btnOCRAll.addEventListener('click', async () => {
        const zones = HotzoneEditor.getZones();
        if (zones.length === 0) { showToast('当前页面没有热区', 'warning'); return; }
        showToast('正在识别所有热区文字...', 'info');
        setStatus('批量文字识别中...');
        let count = 0;
        for (const zone of zones) {
            await new Promise(r => setTimeout(r, 300));
            const text = HotzoneEditor.simulateOCR(zone);
            HotzoneEditor.updateZone(zone.id, { content: text });
            count++;
            setStatus(`文字识别: ${count}/${zones.length}`);
        }
        // 刷新右侧面板
        const selected = HotzoneEditor.getSelectedZone();
        if (selected) {
            els.zoneContent.value = selected.content || '';
        }
        updateZoneList();
        showToast(`已识别 ${count} 个热区的文字内容`, 'success');
        setStatus('文字识别完成');
    });

    els.btnGenerateAudio.addEventListener('click', () => {
        const zones = HotzoneEditor.getZones();
        const withContent = zones.filter(z => z.content && z.content.trim());
        if (withContent.length === 0) {
            showToast('没有可生成音频的热区（需要先填写文字内容）', 'warning');
            return;
        }
        openAudioModal();
    });

    function setActiveTool(tool) {
        els.btnSelect.classList.toggle('active', tool === 'select');
        els.btnAddZone.classList.toggle('active', tool === 'draw');
    }

    // ===== OCR 识别 =====
    function performOCR(zone) {
        showToast('正在识别文字...', 'info');
        setStatus('文字识别中...');
        setTimeout(() => {
            const text = HotzoneEditor.simulateOCR(zone);
            HotzoneEditor.updateZone(zone.id, { content: text });
            els.zoneContent.value = text;
            showToast(`识别完成: "${text}"`, 'success');
            setStatus('文字识别完成');
        }, 600);
    }

    // ===== 右侧面板 =====
    HotzoneEditor.onZoneSelect = function(zone) {
        if (zone) {
            els.panelEmpty.classList.add('hidden');
            els.panelForm.classList.remove('hidden');

            // 填充表单
            els.zoneId.value = '#' + zone.num;
            els.zoneContent.value = zone.content || '';
            setContentEditable(false);
            els.zonePosX.value = zone.position.x;
            els.zonePosY.value = zone.position.y;
            els.zonePosW.value = zone.position.width;
            els.zonePosH.value = zone.position.height;

            // 更新音频列表
            updateAudioList(zone);
        } else {
            els.panelEmpty.classList.remove('hidden');
            els.panelForm.classList.add('hidden');
        }

        // 更新热区列表高亮
        updateZoneList();
    };

    HotzoneEditor.onZonesChange = function(zones) {
        els.zoneCount.textContent = `热区: ${zones.length}`;
        els.totalZoneBadge.textContent = zones.length;
        updateZoneList();
    };

    // 热区列表
    function updateZoneList() {
        const zones = HotzoneEditor.getZones();
        const selected = HotzoneEditor.getSelectedZone();

        if (zones.length === 0) {
            els.zoneList.innerHTML = '<p class="placeholder-text">暂无热区</p>';
            return;
        }

        els.zoneList.innerHTML = '';
        zones.forEach(zone => {
            const item = document.createElement('div');
            item.className = 'zone-list-item' + (selected && selected.id === zone.id ? ' active' : '');
            const hasAudio = Object.values(zone.audioStatus || {}).some(s => s === 'ready');
            const hasContent = zone.content && zone.content.trim();
            item.innerHTML = `
                <span class="zone-num">${zone.num}</span>
                <span class="zone-audio-status">${hasAudio ? '🔊' : hasContent ? '📝' : '⬜'}</span>
            `;
            item.addEventListener('click', () => HotzoneEditor.selectZone(zone.id));
            els.zoneList.appendChild(item);
        });
    }

    // 音频列表
    function updateAudioList(zone) {
        const voices = BackstageData.getVoices();
        els.audioList.innerHTML = '';
        voices.forEach(v => {
            const status = (zone.audioStatus && zone.audioStatus[v.id]) || 'pending';
            const statusText = { ready: '已生成', pending: '待生成', error: '失败', generating: '生成中...' };
            const item = document.createElement('div');
            item.className = 'audio-item';
            item.innerHTML = `
                <span class="voice-name">${v.name}</span>
                <span class="audio-status ${status}">${statusText[status] || status}</span>
                <button class="btn-play-sm" title="试听" ${status !== 'ready' ? 'disabled' : ''}>▶</button>
            `;
            // 试听按钮
            const playBtn = item.querySelector('.btn-play-sm');
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (zone.content) {
                    AudioManager.playAudio(v.id, zone.content);
                    showToast(`正在播放: ${v.name}`, 'info');
                }
            });
            els.audioList.appendChild(item);
        });
    }

    // ===== 右侧面板表单事件 =====
    const btnEditContent = $('btnEditContent');
    const btnSaveContent = $('btnSaveContent');

    function setContentEditable(editable) {
        els.zoneContent.readOnly = !editable;
        els.zoneContent.disabled = !editable;
        els.zoneContent.style.background = editable ? 'var(--bg-white)' : 'var(--bg)';
        els.zoneContent.style.color = editable ? 'var(--text)' : 'var(--text-secondary)';
        els.zoneContent.style.cursor = editable ? 'text' : 'not-allowed';
        btnEditContent.classList.toggle('hidden', editable);
        btnSaveContent.classList.toggle('hidden', !editable);
        if (editable) els.zoneContent.focus();
    }

    btnEditContent.addEventListener('click', () => setContentEditable(true));

    btnSaveContent.addEventListener('click', async () => {
        const zone = HotzoneEditor.getSelectedZone();
        if (!zone) return;
        const newContent = els.zoneContent.value;
        HotzoneEditor.updateZone(zone.id, { content: newContent });
        setContentEditable(false);
        saveCurrentPage();
        showToast('文字内容已保存', 'success');

        // 自动重新生成该热区音频
        if (newContent && newContent.trim()) {
            showToast('正在重新生成音频...', 'info');
            setStatus('重新生成音频...');
            const voiceIds = BackstageData.getVoices().map(v => v.id);

            // 先将所有音色状态设为 generating 并刷新列表
            const genStatus = {};
            voiceIds.forEach(vid => { genStatus[vid] = 'generating'; });
            HotzoneEditor.updateZone(zone.id, { audioStatus: genStatus });
            updateAudioList(HotzoneEditor.getSelectedZone());

            const results = await AudioManager.generateForZone(zone, voiceIds, (vid, status) => {
                // 逐个更新状态
                const current = HotzoneEditor.getSelectedZone();
                if (current && current.id === zone.id) {
                    current.audioStatus[vid] = status;
                    updateAudioList(current);
                }
                setStatus(`生成音频: ${vid} - ${status}`);
            });

            const audioStatus = {};
            Object.entries(results).forEach(([vid, r]) => { audioStatus[vid] = r.status; });
            HotzoneEditor.updateZone(zone.id, { audioStatus });
            updateAudioList(HotzoneEditor.getSelectedZone());
            saveCurrentPage();
            showToast('音频重新生成完成', 'success');
            setStatus('就绪');
        }
    });

    // 位置输入
    ['zonePosX', 'zonePosY', 'zonePosW', 'zonePosH'].forEach(id => {
        els[id].addEventListener('change', function() {
            const zone = HotzoneEditor.getSelectedZone();
            if (!zone) return;
            HotzoneEditor.updateZone(zone.id, {
                position: {
                    x: parseFloat(els.zonePosX.value) || 0,
                    y: parseFloat(els.zonePosY.value) || 0,
                    width: parseFloat(els.zonePosW.value) || 0,
                    height: parseFloat(els.zonePosH.value) || 0,
                }
            });
        });
    });

    // ===== 音频生成弹窗 =====
    let audioGenComplete = false;

    function openAudioModal() {
        els.audioModal.classList.remove('hidden');
        els.progressSection.classList.add('hidden');
        els.btnStartGenerate.disabled = false;
        els.btnStartGenerate.textContent = '开始生成';
        audioGenComplete = false;
    }

    els.btnCloseAudioModal.addEventListener('click', closeAudioModal);
    els.btnCancelAudio.addEventListener('click', () => {
        if (AudioManager.isGenerating) {
            AudioManager.cancel();
            showToast('已取消生成', 'info');
        }
        closeAudioModal();
    });

    function closeAudioModal() {
        els.audioModal.classList.add('hidden');
    }

    els.btnStartGenerate.addEventListener('click', async () => {
        // 如果已完成，点"确定"关闭弹窗
        if (audioGenComplete) {
            closeAudioModal();
            return;
        }

        const checkboxes = els.voiceCheckboxes.querySelectorAll('input:checked');
        const voiceIds = Array.from(checkboxes).map(cb => cb.value);
        if (voiceIds.length === 0) {
            showToast('请至少选择一种音色', 'warning');
            return;
        }

        els.progressSection.classList.remove('hidden');
        els.btnStartGenerate.disabled = true;
        els.btnStartGenerate.textContent = '生成中...';

        const zones = HotzoneEditor.getZones();
        const success = await AudioManager.generateAll(zones, voiceIds, (progress) => {
            els.progressText.textContent = `热区 #${progress.zoneNum} - ${getVoiceName(progress.voiceId)}`;
            els.progressPercent.textContent = progress.percent + '%';
            els.progressFill.style.width = progress.percent + '%';
            els.progressDetail.textContent = `${progress.completed} / ${progress.total} 完成`;
            setStatus(`生成音频: ${progress.completed}/${progress.total}`);
        });

        if (success) {
            showToast('全部音频生成完成', 'success');
            // 保存热区和音频状态
            saveCurrentPage();
            HotzoneEditor.renderZones();
            updateZoneList();
            const selected = HotzoneEditor.getSelectedZone();
            if (selected) updateAudioList(selected);

            // 切换为"确定"按钮
            audioGenComplete = true;
            els.btnStartGenerate.disabled = false;
            els.btnStartGenerate.textContent = '确定';
            els.progressText.textContent = '全部音频生成完成 ✅';
        } else {
            els.btnStartGenerate.disabled = false;
            els.btnStartGenerate.textContent = '开始生成';
        }
        setStatus('就绪');
    });

    function getVoiceName(id) {
        const v = BackstageData.getVoices().find(v => v.id === id);
        return v ? v.name : id;
    }

    // ===== 保存 =====
    function saveCurrentPage() {
        if (!currentTextbook || !currentChapter) return;
        const zones = HotzoneEditor.getZones();
        BackstageData.saveZones(currentTextbook.id, currentChapter.id, currentPage, zones);
        loadChapterList(); // 刷新章节状态
    }

    // ===== 状态栏 =====
    function setStatus(text) {
        els.statusText.textContent = text;
    }

    // ===== 初始化 =====
    function init() {
        HotzoneEditor.init(
            els.hotzoneSvg,
            els.canvasWrapper,
            els.pageImage,
            els.drawingRect
        );
        setStatus('就绪 - 请选择教材和章节开始编辑');
    }

    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
