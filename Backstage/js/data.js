/**
 * 后台数据管理模块
 * 管理教材、章节、热区、音频等数据（使用 localStorage 模拟）
 */
const BackstageData = (() => {
    // 出版社数据（按学科）
    const PUBLISHERS = {
        chinese: [
            { id: 'renjiaoban', name: '人教版' },
        ],
        english: [
            { id: 'hujiao', name: '沪教版' },
        ]
    };

    // 教材数据（按学科+出版社，课本列表）
    const TEXTBOOKS = {
        english: {
            hujiao: [
                { id: 'en_3a', name: '三年级上册', grade: 3, term: '上', pages: 9, coverDir: 'facebook', isNew: false },
                { id: 'en_3a_new', name: '三年级上册(2024秋版)', grade: 3, term: '上', pages: 9, coverDir: 'facebook', isNew: true },
                { id: 'en_3b', name: '三年级下册', grade: 3, term: '下', pages: 9, coverDir: 'facebook', isNew: false },
                { id: 'en_3b_new', name: '三年级下册(2025春版)', grade: 3, term: '下', pages: 9, coverDir: 'facebook', isNew: true },
                { id: 'en_4a', name: '四年级上册', grade: 4, term: '上', pages: 9, coverDir: 'facebook', isNew: false },
                { id: 'en_4a_new', name: '四年级上册(2025秋版)', grade: 4, term: '上', pages: 9, coverDir: 'facebook', isNew: true },
                { id: 'en_4b', name: '四年级下册', grade: 4, term: '下', pages: 9, coverDir: 'facebook', isNew: false },
                { id: 'en_5a', name: '五年级上册', grade: 5, term: '上', pages: 9, coverDir: 'facebook', isNew: false },
                { id: 'en_5b', name: '五年级下册', grade: 5, term: '下', pages: 9, coverDir: 'facebook', isNew: false },
                { id: 'en_6a', name: '六年级上册', grade: 6, term: '上', pages: 9, coverDir: 'facebook', isNew: false },
                { id: 'en_6b', name: '六年级下册', grade: 6, term: '下', pages: 9, coverDir: 'facebook', isNew: false },
            ]
        },
        chinese: {
            renjiaoban: [
                { id: 'cn_1a_new', name: '一年级上册(2024秋版)', grade: 1, term: '上', pages: 4, coverDir: 'facebookCN', isNew: true },
                { id: 'cn_1b_new', name: '一年级下册(2025春版)', grade: 1, term: '下', pages: 4, coverDir: 'facebookCN', isNew: true },
                { id: 'cn_2a_new', name: '二年级上册(2025秋版)', grade: 2, term: '上', pages: 4, coverDir: 'facebookCN', isNew: true },
                { id: 'cn_2b', name: '二年级下册', grade: 2, term: '下', pages: 4, coverDir: 'facebookCN', isNew: false },
                { id: 'cn_3a_new', name: '三年级上册(2025秋版)', grade: 3, term: '上', pages: 4, coverDir: 'facebookCN', isNew: true },
                { id: 'cn_3b', name: '三年级下册', grade: 3, term: '下', pages: 4, coverDir: 'facebookCN', isNew: false },
                { id: 'cn_4a', name: '四年级上册', grade: 4, term: '上', pages: 4, coverDir: 'facebookCN', isNew: false },
                { id: 'cn_4b', name: '四年级下册', grade: 4, term: '下', pages: 4, coverDir: 'facebookCN', isNew: false },
                { id: 'cn_5a', name: '五年级上册', grade: 5, term: '上', pages: 4, coverDir: 'facebookCN', isNew: false },
                { id: 'cn_5b', name: '五年级下册', grade: 5, term: '下', pages: 4, coverDir: 'facebookCN', isNew: false },
                { id: 'cn_6a', name: '六年级上册', grade: 6, term: '上', pages: 4, coverDir: 'facebookCN', isNew: false },
                { id: 'cn_6b', name: '六年级下册', grade: 6, term: '下', pages: 4, coverDir: 'facebookCN', isNew: false },
            ]
        }
    };

    // 章节模拟数据
    const CHAPTERS = {
        english: [
            { unit: 'Unit 1 How do we feel?', lessons: [
                { id: 'en_1_gr', name: 'Get ready', page: 1 },
                { id: 'en_1_ex', name: 'Explore', page: 2 },
                { id: 'en_1_cm', name: 'Communicate', page: 3 },
                { id: 'en_1_et', name: 'Extend', page: 4 },
            ]},
            { unit: "Unit 2 What's interesting about families?", lessons: [
                { id: 'en_2_ll', name: 'Look and learn', page: 5 },
                { id: 'en_2_ls', name: 'Look and say', page: 6 },
            ]},
            { unit: 'Unit 3 What do we look like?', lessons: [
                { id: 'en_3_ll', name: 'Look and learn', page: 7 },
                { id: 'en_3_ls', name: 'Look and say', page: 8 },
            ]},
            { unit: 'Unit 4 How do we have fun?', lessons: [
                { id: 'en_4_ll', name: 'Look and learn', page: 1 },
                { id: 'en_4_ls', name: 'Look and say', page: 2 },
            ]},
            { unit: 'Unit 5 What do we eat?', lessons: [
                { id: 'en_5_ll', name: 'Look and learn', page: 3 },
                { id: 'en_5_ls', name: 'Look and say', page: 4 },
            ]},
            { unit: 'Unit 6 What do we like about small animals?', lessons: [
                { id: 'en_6_ll', name: 'Look and learn', page: 5 },
                { id: 'en_6_ls', name: 'Look and say', page: 6 },
            ]},
        ],
        chinese: [
            { unit: '第一单元 · 阅读', lessons: [
                { id: 'cn_1_1', name: '1 小蝌蚪找妈妈', page: 1 },
                { id: 'cn_1_2', name: '2 我是什么', page: 5 },
                { id: 'cn_1_3', name: '3 植物妈妈有办法', page: 8 },
                { id: 'cn_1_yw1', name: '◎ 语文园地一', page: 11 },
                { id: 'cn_1_kldsb', name: '◎ 快乐读书吧', page: 15 },
            ]},
            { unit: '第二单元 · 识字', lessons: [
                { id: 'cn_2_1', name: '1 场景歌', page: 16 },
                { id: 'cn_2_2', name: '2 树之歌', page: 18 },
                { id: 'cn_2_3', name: '3 拍手歌', page: 20 },
                { id: 'cn_2_4', name: '4 田家四季歌', page: 23 },
                { id: 'cn_2_yw2', name: '◎ 语文园地二', page: 25 },
            ]},
            { unit: '第三单元 · 阅读', lessons: [
                { id: 'cn_3_4', name: '4 彩虹', page: 28 },
                { id: 'cn_3_5', name: '5 去外婆家', page: 30 },
                { id: 'cn_3_6', name: '6 数星星的孩子', page: 32 },
                { id: 'cn_3_yw3', name: '◎ 语文园地三', page: 35 },
            ]},
            { unit: '第四单元 · 阅读', lessons: [
                { id: 'cn_4_7', name: '7 古诗二首', page: 39 },
                { id: 'cn_4_8', name: '8 黄山奇石', page: 42 },
                { id: 'cn_4_9', name: '9 日月潭', page: 45 },
                { id: 'cn_4_10', name: '10 葡萄沟', page: 47 },
                { id: 'cn_4_yw4', name: '◎ 语文园地四', page: 50 },
            ]},
        ]
    };

    // 音色列表
    const VOICES = [
        { id: 'cn_male', name: '中文男声', enabled: true },
        { id: 'cn_female', name: '中文女声', enabled: true },
        { id: 'en_male', name: '英文男声', enabled: true },
        { id: 'en_female', name: '英文女声', enabled: true },
    ];

    // 存储键前缀
    const STORAGE_PREFIX = 'backstage_';

    function getStorageKey(textbookId, chapterId, pageNum) {
        return `${STORAGE_PREFIX}zones_${textbookId}_${chapterId}_p${pageNum}`;
    }

    function getAudioStorageKey(textbookId, chapterId, pageNum) {
        return `${STORAGE_PREFIX}audio_${textbookId}_${chapterId}_p${pageNum}`;
    }

    return {
        getPublishers(subject) {
            return PUBLISHERS[subject] || [];
        },

        getTextbooks(subject, publisherId) {
            const subjectBooks = TEXTBOOKS[subject];
            if (!subjectBooks) return [];
            return subjectBooks[publisherId] || [];
        },

        getChapters(subject) {
            return CHAPTERS[subject] || [];
        },

        getVoices() {
            return VOICES;
        },

        // 获取页面图片路径（使用 insidebook 目录的示例图片）
        getPageImagePath(subject, textbookId, pageNum) {
            if (subject === 'english') {
                return `insidebook/_${String(pageNum + 9).padStart(2, '0')}.jpg`;
            } else {
                return `insidebookCN/_${String(pageNum + 5).padStart(2, '0')}.jpg`;
            }
        },

        // 保存热区数据
        saveZones(textbookId, chapterId, pageNum, zones) {
            const key = getStorageKey(textbookId, chapterId, pageNum);
            localStorage.setItem(key, JSON.stringify(zones));
        },

        // 加载热区数据
        loadZones(textbookId, chapterId, pageNum) {
            const key = getStorageKey(textbookId, chapterId, pageNum);
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        },

        // 保存音频状态
        saveAudioStatus(textbookId, chapterId, pageNum, audioData) {
            const key = getAudioStorageKey(textbookId, chapterId, pageNum);
            localStorage.setItem(key, JSON.stringify(audioData));
        },

        // 加载音频状态
        loadAudioStatus(textbookId, chapterId, pageNum) {
            const key = getAudioStorageKey(textbookId, chapterId, pageNum);
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : {};
        },

        // 检查章节是否已有热区数据
        getChapterStatus(textbookId, chapterId, totalPages) {
            let hasData = false;
            let allDone = true;
            for (let p = 1; p <= totalPages; p++) {
                const zones = this.loadZones(textbookId, chapterId, p);
                if (zones.length > 0) hasData = true;
                else allDone = false;
            }
            if (!hasData) return 'empty';
            return allDone ? 'done' : 'partial';
        }
    };
})();
