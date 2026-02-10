/**
 * DataManager 单元测试
 * 测试数据管理器的核心功能
 */

// 导入DataManager
const { DataManager, dataManager } = require('../../js/data/DataManager.js');

describe('DataManager', () => {
    let dm;

    beforeEach(() => {
        // 每个测试前创建新实例
        dm = new DataManager();
    });

    describe('构造函数', () => {
        test('应该正确初始化缓存', () => {
            expect(dm._cache).toBeInstanceOf(Map);
            expect(dm._cache.size).toBe(0);
        });

        test('应该初始化模拟数据', () => {
            expect(dm._subjects).toBeDefined();
            expect(dm._subjects.length).toBeGreaterThan(0);
            expect(dm._textbooks).toBeDefined();
            expect(dm._chapters).toBeDefined();
        });
    });

    describe('getSubjects', () => {
        test('应该返回学科列表', async () => {
            const subjects = await dm.getSubjects();
            
            expect(Array.isArray(subjects)).toBe(true);
            expect(subjects.length).toBe(3);
        });

        test('应该包含英语、语文、数学三个学科', async () => {
            const subjects = await dm.getSubjects();
            const subjectIds = subjects.map(s => s.id);
            
            expect(subjectIds).toContain('english');
            expect(subjectIds).toContain('chinese');
            expect(subjectIds).toContain('math');
        });

        test('学科应该按order排序', async () => {
            const subjects = await dm.getSubjects();
            
            for (let i = 1; i < subjects.length; i++) {
                expect(subjects[i].order).toBeGreaterThanOrEqual(subjects[i-1].order);
            }
        });

        test('学科应该包含必要的属性', async () => {
            const subjects = await dm.getSubjects();
            
            subjects.forEach(subject => {
                expect(subject).toHaveProperty('id');
                expect(subject).toHaveProperty('name');
                expect(subject).toHaveProperty('icon');
                expect(subject).toHaveProperty('color');
                expect(subject).toHaveProperty('order');
            });
        });

        test('应该缓存学科数据', async () => {
            await dm.getSubjects();
            
            const cached = dm.getCachedData('subjects');
            expect(cached).toBeDefined();
            expect(cached.length).toBe(3);
        });

        test('第二次调用应该返回缓存数据', async () => {
            const first = await dm.getSubjects();
            const second = await dm.getSubjects();
            
            expect(first).toEqual(second);
        });
    });

    describe('getTextbooks', () => {
        test('应该返回指定学科的教材列表', async () => {
            const textbooks = await dm.getTextbooks('english');
            
            expect(Array.isArray(textbooks)).toBe(true);
            expect(textbooks.length).toBeGreaterThan(0);
            textbooks.forEach(t => {
                expect(t.subjectId).toBe('english');
            });
        });

        test('应该返回语文教材', async () => {
            const textbooks = await dm.getTextbooks('chinese');
            
            expect(textbooks.length).toBeGreaterThan(0);
            textbooks.forEach(t => {
                expect(t.subjectId).toBe('chinese');
            });
        });

        test('应该返回数学教材', async () => {
            const textbooks = await dm.getTextbooks('math');
            
            expect(textbooks.length).toBeGreaterThan(0);
            textbooks.forEach(t => {
                expect(t.subjectId).toBe('math');
            });
        });

        test('教材应该包含必要的属性', async () => {
            const textbooks = await dm.getTextbooks('english');
            
            textbooks.forEach(textbook => {
                expect(textbook).toHaveProperty('id');
                expect(textbook).toHaveProperty('subjectId');
                expect(textbook).toHaveProperty('name');
                expect(textbook).toHaveProperty('publisher');
                expect(textbook).toHaveProperty('grade');
                expect(textbook).toHaveProperty('semester');
                expect(textbook).toHaveProperty('coverImage');
                expect(textbook).toHaveProperty('totalChapters');
            });
        });

        test('不存在的学科应该返回空数组', async () => {
            const textbooks = await dm.getTextbooks('nonexistent');
            
            expect(Array.isArray(textbooks)).toBe(true);
            expect(textbooks.length).toBe(0);
        });

        test('缺少subjectId应该抛出错误', async () => {
            await expect(dm.getTextbooks()).rejects.toThrow('subjectId is required');
            await expect(dm.getTextbooks('')).rejects.toThrow('subjectId is required');
        });

        test('应该缓存教材数据', async () => {
            await dm.getTextbooks('english');
            
            const cached = dm.getCachedData('textbooks_english');
            expect(cached).toBeDefined();
        });
    });

    describe('getChapters', () => {
        test('应该返回指定教材的章节列表', async () => {
            const chapters = await dm.getChapters('english-pep-3-1');
            
            expect(Array.isArray(chapters)).toBe(true);
            expect(chapters.length).toBeGreaterThan(0);
            chapters.forEach(c => {
                expect(c.textbookId).toBe('english-pep-3-1');
            });
        });

        test('章节应该按order排序', async () => {
            const chapters = await dm.getChapters('english-pep-3-1');
            
            for (let i = 1; i < chapters.length; i++) {
                expect(chapters[i].order).toBeGreaterThanOrEqual(chapters[i-1].order);
            }
        });

        test('章节应该包含课程列表', async () => {
            const chapters = await dm.getChapters('english-pep-3-1');
            
            chapters.forEach(chapter => {
                expect(chapter).toHaveProperty('lessons');
                expect(Array.isArray(chapter.lessons)).toBe(true);
            });
        });

        test('课程应该包含必要的属性', async () => {
            const chapters = await dm.getChapters('english-pep-3-1');
            
            chapters.forEach(chapter => {
                chapter.lessons.forEach(lesson => {
                    expect(lesson).toHaveProperty('id');
                    expect(lesson).toHaveProperty('chapterId');
                    expect(lesson).toHaveProperty('name');
                    expect(lesson).toHaveProperty('order');
                    expect(lesson).toHaveProperty('totalPages');
                    expect(lesson).toHaveProperty('previewText');
                });
            });
        });

        test('缺少textbookId应该抛出错误', async () => {
            await expect(dm.getChapters()).rejects.toThrow('textbookId is required');
        });

        test('不存在的教材应该返回空数组', async () => {
            const chapters = await dm.getChapters('nonexistent');
            
            expect(Array.isArray(chapters)).toBe(true);
            expect(chapters.length).toBe(0);
        });
    });

    describe('getPageContent', () => {
        test('应该返回页面内容', async () => {
            const content = await dm.getPageContent('english-pep-3-1-unit1-lesson1', 1);
            
            expect(content).toBeDefined();
            expect(content.lessonId).toBe('english-pep-3-1-unit1-lesson1');
            expect(content.pageNumber).toBe(1);
        });

        test('页面内容应该包含可点读元素', async () => {
            const content = await dm.getPageContent('english-pep-3-1-unit1-lesson1', 1);
            
            expect(content).toHaveProperty('clickableElements');
            expect(Array.isArray(content.clickableElements)).toBe(true);
            expect(content.clickableElements.length).toBeGreaterThan(0);
        });

        test('可点读元素应该包含必要的属性', async () => {
            const content = await dm.getPageContent('english-pep-3-1-unit1-lesson1', 1);
            
            content.clickableElements.forEach(elem => {
                expect(elem).toHaveProperty('id');
                expect(elem).toHaveProperty('type');
                expect(elem).toHaveProperty('content');
                expect(elem).toHaveProperty('audioId');
                expect(elem).toHaveProperty('position');
                expect(elem.position).toHaveProperty('x');
                expect(elem.position).toHaveProperty('y');
                expect(elem.position).toHaveProperty('width');
                expect(elem.position).toHaveProperty('height');
            });
        });

        test('不存在的页面应该返回默认空内容', async () => {
            const content = await dm.getPageContent('nonexistent-lesson', 1);
            
            expect(content).toBeDefined();
            expect(content.lessonId).toBe('nonexistent-lesson');
            expect(content.pageNumber).toBe(1);
            expect(content.clickableElements).toEqual([]);
        });

        test('缺少lessonId应该抛出错误', async () => {
            await expect(dm.getPageContent('', 1)).rejects.toThrow('lessonId is required');
        });

        test('无效的pageNumber应该抛出错误', async () => {
            await expect(dm.getPageContent('lesson1', 0)).rejects.toThrow('pageNumber must be a positive number');
            await expect(dm.getPageContent('lesson1', -1)).rejects.toThrow('pageNumber must be a positive number');
            await expect(dm.getPageContent('lesson1', 'abc')).rejects.toThrow('pageNumber must be a positive number');
        });
    });

    describe('getAudioUrl', () => {
        test('应该返回正确的音频URL', () => {
            const url = dm.getAudioUrl('audio-hello', 'voice-female');
            
            expect(url).toBe('assets/audio/voice-female/audio-hello.mp3');
        });

        test('缺少voiceId应该使用默认音色', () => {
            const url = dm.getAudioUrl('audio-hello');
            
            expect(url).toBe('assets/audio/voice-female/audio-hello.mp3');
        });

        test('缺少contentId应该抛出错误', () => {
            expect(() => dm.getAudioUrl()).toThrow('contentId is required');
            expect(() => dm.getAudioUrl('')).toThrow('contentId is required');
        });
    });

    describe('缓存机制', () => {
        test('cacheData应该正确存储数据', () => {
            const testData = { foo: 'bar' };
            dm.cacheData('test-key', testData);
            
            const cached = dm.getCachedData('test-key');
            expect(cached).toEqual(testData);
        });

        test('cacheData缺少key应该抛出错误', () => {
            expect(() => dm.cacheData('', { data: 'test' })).toThrow('Cache key is required');
        });

        test('getCachedData对于不存在的key应该返回null', () => {
            const result = dm.getCachedData('nonexistent-key');
            expect(result).toBeNull();
        });

        test('getCachedData对于空key应该返回null', () => {
            const result = dm.getCachedData('');
            expect(result).toBeNull();
        });

        test('clearCache应该清除指定缓存', () => {
            dm.cacheData('test-key', { data: 'test' });
            expect(dm.getCachedData('test-key')).toBeDefined();
            
            dm.clearCache('test-key');
            expect(dm.getCachedData('test-key')).toBeNull();
        });

        test('clearAllCache应该清除所有缓存', () => {
            dm.cacheData('key1', { data: 'test1' });
            dm.cacheData('key2', { data: 'test2' });
            
            dm.clearAllCache();
            
            expect(dm.getCachedData('key1')).toBeNull();
            expect(dm.getCachedData('key2')).toBeNull();
        });

        test('getCacheStats应该返回缓存统计', () => {
            dm.cacheData('key1', { data: 'test1' });
            dm.cacheData('key2', { data: 'test2' });
            
            const stats = dm.getCacheStats();
            
            expect(stats.size).toBe(2);
            expect(stats.keys).toContain('key1');
            expect(stats.keys).toContain('key2');
        });

        test('过期的缓存应该返回null', async () => {
            dm.cacheData('test-key', { data: 'test' });
            
            // 使用很短的maxAge来测试过期
            const result = dm.getCachedData('test-key', 0);
            expect(result).toBeNull();
        });
    });

    describe('辅助方法', () => {
        test('hasSubject应该正确检查学科是否存在', () => {
            expect(dm.hasSubject('english')).toBe(true);
            expect(dm.hasSubject('chinese')).toBe(true);
            expect(dm.hasSubject('math')).toBe(true);
            expect(dm.hasSubject('nonexistent')).toBe(false);
        });

        test('hasTextbook应该正确检查教材是否存在', () => {
            expect(dm.hasTextbook('english-pep-3-1')).toBe(true);
            expect(dm.hasTextbook('chinese-rj-3-1')).toBe(true);
            expect(dm.hasTextbook('nonexistent')).toBe(false);
        });
    });

    describe('getLesson', () => {
        test('应该返回课程信息', async () => {
            const lesson = await dm.getLesson('english-pep-3-1-unit1-lesson1');
            
            expect(lesson).toBeDefined();
            expect(lesson.id).toBe('english-pep-3-1-unit1-lesson1');
            expect(lesson.name).toBe("Part A Let's talk");
        });

        test('不存在的课程应该返回null', async () => {
            const lesson = await dm.getLesson('nonexistent');
            expect(lesson).toBeNull();
        });

        test('空lessonId应该返回null', async () => {
            const lesson = await dm.getLesson('');
            expect(lesson).toBeNull();
        });
    });

    describe('getVoices', () => {
        test('应该返回音色列表', async () => {
            const voices = await dm.getVoices();
            
            expect(Array.isArray(voices)).toBe(true);
            expect(voices.length).toBe(3);
        });

        test('应该包含男声、女声、童声', async () => {
            const voices = await dm.getVoices();
            const types = voices.map(v => v.type);
            
            expect(types).toContain('male');
            expect(types).toContain('female');
            expect(types).toContain('child');
        });

        test('音色应该包含必要的属性', async () => {
            const voices = await dm.getVoices();
            
            voices.forEach(voice => {
                expect(voice).toHaveProperty('id');
                expect(voice).toHaveProperty('name');
                expect(voice).toHaveProperty('type');
                expect(voice).toHaveProperty('previewAudioUrl');
                expect(voice).toHaveProperty('description');
            });
        });
    });
});

describe('dataManager单例', () => {
    test('应该导出单例实例', () => {
        expect(dataManager).toBeDefined();
        expect(dataManager).toBeInstanceOf(DataManager);
    });
});
