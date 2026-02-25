/**
 * 热区编辑器模块
 * 支持：绘制、选择、移动、拉伸调整大小、删除按钮、自动识别
 */
const HotzoneEditor = (() => {
    let zones = [];
    let selectedZoneId = null;
    let currentTool = 'select'; // select | draw
    let isDrawing = false;
    let drawStart = { x: 0, y: 0 };
    let nextZoneNum = 1;

    // 拖拽/缩放状态
    let isDragging = false;
    let isResizing = false;
    let resizeHandle = ''; // nw|ne|sw|se|n|s|e|w
    let dragStart = { x: 0, y: 0 };
    let dragZoneStart = { x: 0, y: 0, width: 0, height: 0 };

    // DOM
    let svgEl, wrapperEl, imageEl, drawingRectEl;
    let overlayContainer = null; // HTML overlay for handles

    // 回调
    let onZoneSelect = null;
    let onZonesChange = null;

    function init(svg, wrapper, image, drawingRect) {
        svgEl = svg;
        wrapperEl = wrapper;
        imageEl = image;
        drawingRectEl = drawingRect;

        // 创建 overlay 容器（用于删除按钮和拉伸手柄）
        overlayContainer = document.createElement('div');
        overlayContainer.className = 'hotzone-overlay';
        overlayContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';
        wrapperEl.appendChild(overlayContainer);

        wrapperEl.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    function setTool(tool) {
        currentTool = tool;
        wrapperEl.style.cursor = tool === 'draw' ? 'crosshair' : 'default';
    }

    function getRelativePos(e) {
        const rect = wrapperEl.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100
        };
    }

    // ===== Mouse Handlers =====
    function handleMouseDown(e) {
        // 忽略来自 overlay 控件的事件（它们自己处理）
        if (e.target.closest('.hz-handle') || e.target.closest('.hz-delete')) return;

        if (currentTool === 'draw') {
            isDrawing = true;
            drawStart = getRelativePos(e);
            drawingRectEl.classList.remove('hidden');
            updateDrawingRect(drawStart.x, drawStart.y, 0, 0);
            e.preventDefault();
        } else {
            const target = e.target;
            if (target.tagName === 'rect' && target.dataset.zoneId) {
                const zoneId = target.dataset.zoneId;
                selectZone(zoneId);
                // 开始拖拽移动
                startDrag(zoneId, e);
                e.preventDefault();
            } else if (target === wrapperEl || target === imageEl || target === svgEl) {
                deselectZone();
            }
        }
    }

    function handleGlobalMouseMove(e) {
        if (isDrawing) {
            const pos = getRelativePos(e);
            const x = Math.min(drawStart.x, pos.x);
            const y = Math.min(drawStart.y, pos.y);
            const w = Math.abs(pos.x - drawStart.x);
            const h = Math.abs(pos.y - drawStart.y);
            updateDrawingRect(x, y, w, h);
        } else if (isDragging) {
            handleDragMove(e);
        } else if (isResizing) {
            handleResizeMove(e);
        }
    }

    function handleGlobalMouseUp(e) {
        if (isDrawing) {
            isDrawing = false;
            drawingRectEl.classList.add('hidden');
            const pos = getRelativePos(e);
            const x = Math.min(drawStart.x, pos.x);
            const y = Math.min(drawStart.y, pos.y);
            const w = Math.abs(pos.x - drawStart.x);
            const h = Math.abs(pos.y - drawStart.y);
            if (w > 1 && h > 1) addZone({ x, y, width: w, height: h });
        }
        if (isDragging || isResizing) {
            isDragging = false;
            isResizing = false;
            document.body.style.cursor = '';
            // 通知变更
            if (onZonesChange) onZonesChange(zones);
            const zone = getSelectedZone();
            if (zone && onZoneSelect) onZoneSelect(zone);
        }
    }

    // ===== Drag (Move) =====
    function startDrag(zoneId, e) {
        const zone = zones.find(z => z.id === zoneId);
        if (!zone) return;
        isDragging = true;
        dragStart = getRelativePos(e);
        dragZoneStart = { ...zone.position };
        document.body.style.cursor = 'move';
    }

    function handleDragMove(e) {
        const zone = getSelectedZone();
        if (!zone) return;
        const pos = getRelativePos(e);
        const dx = pos.x - dragStart.x;
        const dy = pos.y - dragStart.y;
        zone.position.x = clamp(dragZoneStart.x + dx, 0, 100 - zone.position.width);
        zone.position.y = clamp(dragZoneStart.y + dy, 0, 100 - zone.position.height);
        zone.position.x = round1(zone.position.x);
        zone.position.y = round1(zone.position.y);
        renderZones();
    }

    // ===== Resize =====
    function startResize(handle, e) {
        const zone = getSelectedZone();
        if (!zone) return;
        isResizing = true;
        resizeHandle = handle;
        dragStart = getRelativePos(e);
        dragZoneStart = { ...zone.position };
        document.body.style.cursor = getResizeCursor(handle);
        e.preventDefault();
        e.stopPropagation();
    }

    function handleResizeMove(e) {
        const zone = getSelectedZone();
        if (!zone) return;
        const pos = getRelativePos(e);
        const dx = pos.x - dragStart.x;
        const dy = pos.y - dragStart.y;
        const s = dragZoneStart;
        const MIN = 2; // 最小尺寸 2%

        let nx = s.x, ny = s.y, nw = s.width, nh = s.height;

        if (resizeHandle.includes('w')) { nx = s.x + dx; nw = s.width - dx; }
        if (resizeHandle.includes('e')) { nw = s.width + dx; }
        if (resizeHandle.includes('n')) { ny = s.y + dy; nh = s.height - dy; }
        if (resizeHandle.includes('s')) { nh = s.height + dy; }

        // 最小尺寸约束
        if (nw < MIN) { if (resizeHandle.includes('w')) nx = s.x + s.width - MIN; nw = MIN; }
        if (nh < MIN) { if (resizeHandle.includes('n')) ny = s.y + s.height - MIN; nh = MIN; }

        zone.position.x = round1(clamp(nx, 0, 98));
        zone.position.y = round1(clamp(ny, 0, 98));
        zone.position.width = round1(clamp(nw, MIN, 100 - zone.position.x));
        zone.position.height = round1(clamp(nh, MIN, 100 - zone.position.y));
        renderZones();
    }

    function getResizeCursor(handle) {
        const map = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize' };
        return map[handle] || 'default';
    }

    // ===== Helpers =====
    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
    function round1(v) { return Math.round(v * 10) / 10; }

    function updateDrawingRect(x, y, w, h) {
        drawingRectEl.style.left = x + '%';
        drawingRectEl.style.top = y + '%';
        drawingRectEl.style.width = w + '%';
        drawingRectEl.style.height = h + '%';
    }

    // ===== Zone CRUD =====
    function addZone(position, content = '', type = 'text') {
        const zone = {
            id: 'zone_' + Date.now() + '_' + nextZoneNum,
            num: nextZoneNum,
            type: type,
            content: content,
            position: { x: round1(position.x), y: round1(position.y), width: round1(position.width), height: round1(position.height) },
            audioStatus: {}
        };
        nextZoneNum++;
        zones.push(zone);
        renderZones();
        selectZone(zone.id);
        if (onZonesChange) onZonesChange(zones);
        return zone;
    }

    function removeZone(zoneId) {
        zones = zones.filter(z => z.id !== zoneId);
        if (selectedZoneId === zoneId) { selectedZoneId = null; if (onZoneSelect) onZoneSelect(null); }
        renderZones();
        if (onZonesChange) onZonesChange(zones);
    }

    function updateZone(zoneId, updates) {
        const zone = zones.find(z => z.id === zoneId);
        if (!zone) return;
        if (updates.position) Object.assign(zone.position, updates.position);
        Object.keys(updates).forEach(k => { if (k !== 'position') zone[k] = updates[k]; });
        renderZones();
        if (onZonesChange) onZonesChange(zones);
    }

    function selectZone(zoneId) {
        selectedZoneId = zoneId;
        renderZones();
        const zone = zones.find(z => z.id === zoneId);
        if (onZoneSelect) onZoneSelect(zone);
    }

    function deselectZone() {
        selectedZoneId = null;
        renderZones();
        if (onZoneSelect) onZoneSelect(null);
    }

    // ===== Render =====
    function renderZones() {
        // SVG 热区矩形
        svgEl.innerHTML = '';
        zones.forEach(zone => {
            const isSelected = zone.id === selectedZoneId;
            const hasContent = zone.content && zone.content.trim().length > 0;
            const hasAudio = Object.values(zone.audioStatus || {}).some(s => s === 'ready');

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', zone.position.x + '%');
            rect.setAttribute('y', zone.position.y + '%');
            rect.setAttribute('width', zone.position.width + '%');
            rect.setAttribute('height', zone.position.height + '%');
            rect.setAttribute('fill', isSelected ? 'rgba(79,110,247,0.2)' : hasContent ? 'rgba(34,197,94,0.12)' : 'rgba(79,110,247,0.08)');
            rect.setAttribute('stroke', isSelected ? '#4F6EF7' : hasContent ? '#22C55E' : '#94A3B8');
            rect.setAttribute('stroke-width', isSelected ? '2.5' : '1.5');
            rect.setAttribute('stroke-dasharray', hasContent ? 'none' : '4,3');
            rect.setAttribute('rx', '2');
            rect.dataset.zoneId = zone.id;
            rect.style.cursor = isSelected ? 'move' : 'pointer';
            svgEl.appendChild(rect);

            // 编号标签
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', (zone.position.x + 0.5) + '%');
            text.setAttribute('y', (zone.position.y + 3) + '%');
            text.setAttribute('fill', isSelected ? '#4F6EF7' : '#64748B');
            text.setAttribute('font-size', '11');
            text.setAttribute('font-weight', '600');
            text.textContent = '#' + zone.num;
            svgEl.appendChild(text);

            if (hasAudio) {
                const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                icon.setAttribute('x', (zone.position.x + zone.position.width - 3) + '%');
                icon.setAttribute('y', (zone.position.y + 3) + '%');
                icon.setAttribute('font-size', '12');
                icon.textContent = '🔊';
                svgEl.appendChild(icon);
            }
        });

        // HTML overlay: 删除按钮 + 拉伸手柄（仅选中热区）
        renderOverlay();
    }

    function renderOverlay() {
        overlayContainer.innerHTML = '';
        const zone = getSelectedZone();
        if (!zone) return;

        const p = zone.position;

        // 删除按钮 ×
        const delBtn = document.createElement('div');
        delBtn.className = 'hz-delete';
        delBtn.textContent = '×';
        delBtn.style.cssText = `
            position:absolute;
            left:calc(${p.x + p.width}% - 8px);
            top:calc(${p.y}% - 8px);
            width:20px; height:20px;
            background:#EF4444; color:#fff;
            border-radius:50%;
            display:flex; align-items:center; justify-content:center;
            font-size:14px; font-weight:bold; line-height:1;
            cursor:pointer; pointer-events:all;
            box-shadow:0 1px 4px rgba(0,0,0,0.2);
            z-index:20;
        `;
        delBtn.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            removeZone(zone.id);
        });
        overlayContainer.appendChild(delBtn);

        // 8个拉伸手柄: nw, n, ne, w, e, sw, s, se
        const handles = [
            { id: 'nw', left: p.x, top: p.y },
            { id: 'n',  left: p.x + p.width / 2, top: p.y },
            { id: 'ne', left: p.x + p.width, top: p.y },
            { id: 'w',  left: p.x, top: p.y + p.height / 2 },
            { id: 'e',  left: p.x + p.width, top: p.y + p.height / 2 },
            { id: 'sw', left: p.x, top: p.y + p.height },
            { id: 's',  left: p.x + p.width / 2, top: p.y + p.height },
            { id: 'se', left: p.x + p.width, top: p.y + p.height },
        ];

        handles.forEach(h => {
            const el = document.createElement('div');
            el.className = 'hz-handle';
            el.style.cssText = `
                position:absolute;
                left:calc(${h.left}% - 5px);
                top:calc(${h.top}% - 5px);
                width:10px; height:10px;
                background:#fff;
                border:2px solid #4F6EF7;
                border-radius:2px;
                cursor:${getResizeCursor(h.id)};
                pointer-events:all;
                z-index:15;
            `;
            el.addEventListener('mousedown', (e) => startResize(h.id, e));
            overlayContainer.appendChild(el);
        });
    }

    function loadZones(zoneData) {
        zones = zoneData || [];
        nextZoneNum = zones.length > 0 ? Math.max(...zones.map(z => z.num)) + 1 : 1;
        selectedZoneId = null;
        renderZones();
        if (onZonesChange) onZonesChange(zones);
    }

    function getZones() { return zones; }
    function getSelectedZone() { return zones.find(z => z.id === selectedZoneId) || null; }

    // ===== 自动识别 =====
    function autoDetectZones() {
        const templates = [
            { x: 5, y: 8, width: 42, height: 6, type: 'sentence' },
            { x: 5, y: 18, width: 38, height: 5, type: 'text' },
            { x: 5, y: 27, width: 45, height: 6, type: 'sentence' },
            { x: 52, y: 8, width: 40, height: 5, type: 'word' },
            { x: 52, y: 18, width: 43, height: 6, type: 'sentence' },
            { x: 52, y: 27, width: 35, height: 5, type: 'text' },
            { x: 8, y: 40, width: 84, height: 7, type: 'paragraph' },
            { x: 8, y: 52, width: 84, height: 7, type: 'paragraph' },
            { x: 8, y: 64, width: 60, height: 5, type: 'sentence' },
        ];
        templates.forEach(t => {
            const offset = () => (Math.random() - 0.5) * 2;
            addZone({ x: t.x + offset(), y: t.y + offset(), width: t.width + offset(), height: t.height + offset() }, '', t.type);
        });
    }

    // ===== 模拟 OCR =====
    function simulateOCR(zone) {
        const sampleTexts = {
            english: {
                word: ['Hello', 'Good morning', 'Thank you', 'Apple', 'Book', 'Teacher', 'Student', 'School'],
                sentence: ['How are you today?', 'I like to read books.', 'She is my best friend.', 'We go to school every day.'],
                paragraph: ['Look at the picture. What can you see? I can see a big tree and a small house.', 'My name is Tom. I am eight years old. I like playing football with my friends.'],
                text: ['Module 1', 'Unit 2 - My Family', 'Listen and say', 'Read and write']
            },
            chinese: {
                word: ['春天', '夏天', '秋天', '冬天', '小鸟', '花朵'],
                sentence: ['春风吹，花儿开。', '小鸟在树上唱歌。', '我爱我的祖国。'],
                paragraph: ['春天来了，小草从地下探出头来。花儿开了，红的、黄的、白的，真好看。', '秋天到了，树叶变黄了，一片一片地飘落下来。'],
                text: ['第一课', '识字表', '课文朗读', '生字词语']
            }
        };
        const subject = document.getElementById('subjectSelect').value || 'english';
        const texts = sampleTexts[subject] || sampleTexts.english;
        const typeTexts = texts[zone.type] || texts.text;
        return typeTexts[Math.floor(Math.random() * typeTexts.length)];
    }

    return {
        init, setTool, addZone, removeZone, updateZone,
        selectZone, deselectZone, loadZones, getZones, getSelectedZone,
        autoDetectZones, simulateOCR, renderZones,
        set onZoneSelect(fn) { onZoneSelect = fn; },
        set onZonesChange(fn) { onZonesChange = fn; },
    };
})();
