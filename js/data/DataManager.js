/**
 * DataManager - 数据管理器
 * 统一管理数据的获取和缓存
 * 
 * @class DataManager
 */
class DataManager {
    constructor() {
        // 内存缓存
        this._cache = new Map();
        
        // 初始化模拟数据
        this._initMockData();
    }

    /**
     * 初始化模拟数据
     * @private
     */
    _initMockData() {
        // 学科数据
        this._subjects = [
            {
                id: 'english',
                name: '英语',
                icon: '🔤',
                color: '#4A90D9',
                order: 1
            },
            {
                id: 'chinese',
                name: '语文',
                icon: '📖',
                color: '#E74C3C',
                order: 2
            }
        ];

        // 教材数据
        this._textbooks = [
            // 英语教材 - 沪教版
            {
                id: 'english-hj-3-1',
                subjectId: 'english',
                name: '沪教版英语三年级上册',
                publisher: '上海教育出版社',
                grade: 3,
                semester: '上',
                coverImage: 'facebook/【沪教版】三年级上册英语电子课本_01.png',
                totalChapters: 8
            },
            {
                id: 'english-hj-3-1-new',
                subjectId: 'english',
                name: '沪教版英语三年级上册(2024秋版)',
                publisher: '上海教育出版社',
                grade: 3,
                semester: '上',
                coverImage: 'facebook/【沪教版】三年级上册(2024秋版)英语电子课本_01.png',
                totalChapters: 8
            },
            {
                id: 'english-hj-3-2',
                subjectId: 'english',
                name: '沪教版英语三年级下册',
                publisher: '上海教育出版社',
                grade: 3,
                semester: '下',
                coverImage: 'facebook/【沪教版】三年级下册英语电子课本_01.png',
                totalChapters: 8
            },
            {
                id: 'english-hj-3-2-new',
                subjectId: 'english',
                name: '沪教版英语三年级下册(2025春版)',
                publisher: '上海教育出版社',
                grade: 3,
                semester: '下',
                coverImage: 'facebook/【沪教版】三年级下册(2025春版)英语电子课本_01.png',
                totalChapters: 8
            },
            {
                id: 'english-hj-4-1',
                subjectId: 'english',
                name: '沪教版英语四年级上册',
                publisher: '上海教育出版社',
                grade: 4,
                semester: '上',
                coverImage: 'facebook/【沪教版】四年级上册英语电子课本_01.png',
                totalChapters: 8
            },
            {
                id: 'english-hj-4-1-new',
                subjectId: 'english',
                name: '沪教版英语四年级上册(2025秋版)',
                publisher: '上海教育出版社',
                grade: 4,
                semester: '上',
                coverImage: 'facebook/【沪教版】四年级上册(2025秋版)英语电子课本_01.png',
                totalChapters: 8
            },
            {
                id: 'english-hj-4-2',
                subjectId: 'english',
                name: '沪教版英语四年级下册',
                publisher: '上海教育出版社',
                grade: 4,
                semester: '下',
                coverImage: 'facebook/【沪教版】四年级下册英语电子课本_01.png',
                totalChapters: 8
            },
            {
                id: 'english-hj-5-1',
                subjectId: 'english',
                name: '沪教版英语五年级上册',
                publisher: '上海教育出版社',
                grade: 5,
                semester: '上',
                coverImage: 'facebook/【沪教版】五年级上册英语电子课本_01.png',
                totalChapters: 8
            },
            {
                id: 'english-hj-5-2',
                subjectId: 'english',
                name: '沪教版英语五年级下册',
                publisher: '上海教育出版社',
                grade: 5,
                semester: '下',
                coverImage: 'facebook/【沪教版】五年级下册英语电子课本-社学整理_01.png',
                totalChapters: 8
            },
            {
                id: 'english-hj-6-1',
                subjectId: 'english',
                name: '沪教版英语六年级上册',
                publisher: '上海教育出版社',
                grade: 6,
                semester: '上',
                coverImage: 'facebook/【沪教版】六年级上册英语电子课本_01.png',
                totalChapters: 8
            },
            {
                id: 'english-hj-6-2',
                subjectId: 'english',
                name: '沪教版英语六年级下册',
                publisher: '上海教育出版社',
                grade: 6,
                semester: '下',
                coverImage: 'facebook/【沪教版】六年级下册英语电子课本_01.png',
                totalChapters: 8
            },
            // 语文教材 - 人教版
            {
                id: 'chinese-rj-1-1-new',
                subjectId: 'chinese',
                name: '人教版语文一年级上册(2024秋版)',
                publisher: '人民教育出版社',
                grade: 1,
                semester: '上',
                coverImage: 'facebookCN/【人教版】一年级上册(2024秋版).jpg',
                totalChapters: 8
            },
            {
                id: 'chinese-rj-1-2-new',
                subjectId: 'chinese',
                name: '人教版语文一年级下册(2025春版)',
                publisher: '人民教育出版社',
                grade: 1,
                semester: '下',
                coverImage: 'facebookCN/【人教版】一年级下册(2025春版).jpg',
                totalChapters: 8
            },
            {
                id: 'chinese-rj-2-1-new',
                subjectId: 'chinese',
                name: '人教版语文二年级上册(2025秋版)',
                publisher: '人民教育出版社',
                grade: 2,
                semester: '上',
                coverImage: 'facebookCN/【人教版】二年级上册(2025秋版).jpg',
                totalChapters: 9
            },
            {
                id: 'chinese-rj-2-2',
                subjectId: 'chinese',
                name: '人教版语文二年级下册',
                publisher: '人民教育出版社',
                grade: 2,
                semester: '下',
                coverImage: 'facebookCN/【人教版】二年级下册.jpg',
                totalChapters: 8
            },
            {
                id: 'chinese-rj-3-1-new',
                subjectId: 'chinese',
                name: '人教版语文三年级上册(2025秋版)',
                publisher: '人民教育出版社',
                grade: 3,
                semester: '上',
                coverImage: 'facebookCN/【人教版】三年级上册(2025秋版).jpg',
                totalChapters: 8
            },
            {
                id: 'chinese-rj-3-2',
                subjectId: 'chinese',
                name: '人教版语文三年级下册',
                publisher: '人民教育出版社',
                grade: 3,
                semester: '下',
                coverImage: 'facebookCN/【人教版】三年级下册.jpg',
                totalChapters: 8
            },
            {
                id: 'chinese-rj-4-1',
                subjectId: 'chinese',
                name: '人教版语文四年级上册',
                publisher: '人民教育出版社',
                grade: 4,
                semester: '上',
                coverImage: 'facebookCN/【人教版】四年级上册.jpg',
                totalChapters: 8
            },
            {
                id: 'chinese-rj-4-2',
                subjectId: 'chinese',
                name: '人教版语文四年级下册',
                publisher: '人民教育出版社',
                grade: 4,
                semester: '下',
                coverImage: 'facebookCN/【人教版】四年级下册.jpg',
                totalChapters: 8
            },
            {
                id: 'chinese-rj-5-1',
                subjectId: 'chinese',
                name: '人教版语文五年级上册',
                publisher: '人民教育出版社',
                grade: 5,
                semester: '上',
                coverImage: 'facebookCN/【人教版】五年级上册.jpg',
                totalChapters: 8
            },
            {
                id: 'chinese-rj-5-2',
                subjectId: 'chinese',
                name: '人教版语文五年级下册',
                publisher: '人民教育出版社',
                grade: 5,
                semester: '下',
                coverImage: 'facebookCN/【人教版】五年级下册.jpg',
                totalChapters: 8
            },
            {
                id: 'chinese-rj-6-1',
                subjectId: 'chinese',
                name: '人教版语文六年级上册',
                publisher: '人民教育出版社',
                grade: 6,
                semester: '上',
                coverImage: 'facebookCN/【人教版】六年级上册语文.jpg',
                totalChapters: 8
            },
            {
                id: 'chinese-rj-6-2',
                subjectId: 'chinese',
                name: '人教版语文六年级下册',
                publisher: '人民教育出版社',
                grade: 6,
                semester: '下',
                coverImage: 'facebookCN/【人教版】六年级下册语文.jpg',
                totalChapters: 8
            }
        ];

        // 章节数据
        this._chapters = [
            // 英语 PEP 三年级上册章节
            {
                id: 'english-pep-3-1-unit1',
                textbookId: 'english-pep-3-1',
                name: 'Unit 1 Hello!',
                order: 1,
                lessons: [
                    {
                        id: 'english-pep-3-1-unit1-lesson1',
                        chapterId: 'english-pep-3-1-unit1',
                        name: 'Part A Let\'s talk',
                        order: 1,
                        totalPages: 2,
                        previewText: 'Hello! I\'m Wu Yifan. Hi! I\'m Sarah.'
                    },
                    {
                        id: 'english-pep-3-1-unit1-lesson2',
                        chapterId: 'english-pep-3-1-unit1',
                        name: 'Part A Let\'s learn',
                        order: 2,
                        totalPages: 2,
                        previewText: 'ruler, pencil, eraser, crayon'
                    },
                    {
                        id: 'english-pep-3-1-unit1-lesson3',
                        chapterId: 'english-pep-3-1-unit1',
                        name: 'Part B Let\'s talk',
                        order: 3,
                        totalPages: 2,
                        previewText: 'What\'s your name? My name is...'
                    }
                ]
            },
            {
                id: 'english-pep-3-1-unit2',
                textbookId: 'english-pep-3-1',
                name: 'Unit 2 Colours',
                order: 2,
                lessons: [
                    {
                        id: 'english-pep-3-1-unit2-lesson1',
                        chapterId: 'english-pep-3-1-unit2',
                        name: 'Part A Let\'s talk',
                        order: 1,
                        totalPages: 2,
                        previewText: 'Good morning! This is Mr Jones.'
                    },
                    {
                        id: 'english-pep-3-1-unit2-lesson2',
                        chapterId: 'english-pep-3-1-unit2',
                        name: 'Part A Let\'s learn',
                        order: 2,
                        totalPages: 2,
                        previewText: 'red, yellow, green, blue'
                    }
                ]
            },
            {
                id: 'english-pep-3-1-unit3',
                textbookId: 'english-pep-3-1',
                name: 'Unit 3 Look at me!',
                order: 3,
                lessons: [
                    {
                        id: 'english-pep-3-1-unit3-lesson1',
                        chapterId: 'english-pep-3-1-unit3',
                        name: 'Part A Let\'s talk',
                        order: 1,
                        totalPages: 2,
                        previewText: 'How are you? I\'m fine, thank you.'
                    }
                ]
            },
            // 语文 人教版 三年级上册章节
            {
                id: 'chinese-rj-3-1-unit1',
                textbookId: 'chinese-rj-3-1',
                name: '第一单元',
                order: 1,
                lessons: [
                    {
                        id: 'chinese-rj-3-1-lesson1',
                        chapterId: 'chinese-rj-3-1-unit1',
                        name: '1. 大青树下的小学',
                        order: 1,
                        totalPages: 3,
                        previewText: '早晨，从山坡上，从坪坝里，从一条条开着绒球花和太阳花的小路上...'
                    },
                    {
                        id: 'chinese-rj-3-1-lesson2',
                        chapterId: 'chinese-rj-3-1-unit1',
                        name: '2. 花的学校',
                        order: 2,
                        totalPages: 2,
                        previewText: '当雷云在天上轰响，六月的阵雨落下的时候...'
                    },
                    {
                        id: 'chinese-rj-3-1-lesson3',
                        chapterId: 'chinese-rj-3-1-unit1',
                        name: '3. 不懂就要问',
                        order: 3,
                        totalPages: 2,
                        previewText: '孙中山小时候在私塾读书...'
                    }
                ]
            },
            {
                id: 'chinese-rj-3-1-unit2',
                textbookId: 'chinese-rj-3-1',
                name: '第二单元',
                order: 2,
                lessons: [
                    {
                        id: 'chinese-rj-3-1-lesson4',
                        chapterId: 'chinese-rj-3-1-unit2',
                        name: '4. 古诗三首',
                        order: 1,
                        totalPages: 3,
                        previewText: '山行：远上寒山石径斜，白云生处有人家...'
                    },
                    {
                        id: 'chinese-rj-3-1-lesson5',
                        chapterId: 'chinese-rj-3-1-unit2',
                        name: '5. 铺满金色巴掌的水泥道',
                        order: 2,
                        totalPages: 2,
                        previewText: '一夜秋风，一夜秋雨...'
                    }
                ]
            },
            // 沪教版英语三年级上册(2024秋版)章节
            {
                id: 'english-hj-3-1-new-unit1',
                textbookId: 'english-hj-3-1-new',
                name: 'Unit 1 How do we feel?',
                order: 1,
                lessons: [
                    {
                        id: 'english-hj-3-1-new-unit1-lesson1',
                        chapterId: 'english-hj-3-1-new-unit1',
                        name: 'Get ready',
                        order: 1,
                        totalPages: 2,
                        previewText: '准备活动，热身练习'
                    },
                    {
                        id: 'english-hj-3-1-new-unit1-lesson2',
                        chapterId: 'english-hj-3-1-new-unit1',
                        name: 'Explore',
                        order: 2,
                        totalPages: 4,
                        previewText: '探索学习，How do we feel?'
                    },
                    {
                        id: 'english-hj-3-1-new-unit1-lesson3',
                        chapterId: 'english-hj-3-1-new-unit1',
                        name: 'Communicate',
                        order: 3,
                        totalPages: 2,
                        previewText: '交流练习，对话实践'
                    },
                    {
                        id: 'english-hj-3-1-new-unit1-lesson4',
                        chapterId: 'english-hj-3-1-new-unit1',
                        name: 'Extend',
                        order: 4,
                        totalPages: 1,
                        previewText: '拓展延伸'
                    }
                ]
            },
            {
                id: 'english-hj-3-1-new-unit2',
                textbookId: 'english-hj-3-1-new',
                name: 'Unit 2 What\'s interesting about families?',
                order: 2,
                lessons: [
                    {
                        id: 'english-hj-3-1-new-unit2-lesson1',
                        chapterId: 'english-hj-3-1-new-unit2',
                        name: 'Look and learn',
                        order: 1,
                        totalPages: 2,
                        previewText: 'This is my family. father, mother, brother, sister...'
                    },
                    {
                        id: 'english-hj-3-1-new-unit2-lesson2',
                        chapterId: 'english-hj-3-1-new-unit2',
                        name: 'Look and say',
                        order: 2,
                        totalPages: 2,
                        previewText: 'Who is he/she? He/She is my...'
                    }
                ]
            },
            {
                id: 'english-hj-3-1-new-unit3',
                textbookId: 'english-hj-3-1-new',
                name: 'Unit 3 What do we look like?',
                order: 3,
                lessons: [
                    {
                        id: 'english-hj-3-1-new-unit3-lesson1',
                        chapterId: 'english-hj-3-1-new-unit3',
                        name: 'Look and learn',
                        order: 1,
                        totalPages: 2,
                        previewText: 'eyes, ears, nose, mouth, hair...'
                    },
                    {
                        id: 'english-hj-3-1-new-unit3-lesson2',
                        chapterId: 'english-hj-3-1-new-unit3',
                        name: 'Look and say',
                        order: 2,
                        totalPages: 2,
                        previewText: 'I have big eyes. She has long hair.'
                    }
                ]
            },
            {
                id: 'english-hj-3-1-new-unit4',
                textbookId: 'english-hj-3-1-new',
                name: 'Unit 4 How do we have fun?',
                order: 4,
                lessons: [
                    {
                        id: 'english-hj-3-1-new-unit4-lesson1',
                        chapterId: 'english-hj-3-1-new-unit4',
                        name: 'Look and learn',
                        order: 1,
                        totalPages: 2,
                        previewText: 'play football, play basketball, swim, run...'
                    },
                    {
                        id: 'english-hj-3-1-new-unit4-lesson2',
                        chapterId: 'english-hj-3-1-new-unit4',
                        name: 'Look and say',
                        order: 2,
                        totalPages: 2,
                        previewText: 'What do you like doing? I like playing...'
                    }
                ]
            },
            {
                id: 'english-hj-3-1-new-unit5',
                textbookId: 'english-hj-3-1-new',
                name: 'Unit 5 What do we eat?',
                order: 5,
                lessons: [
                    {
                        id: 'english-hj-3-1-new-unit5-lesson1',
                        chapterId: 'english-hj-3-1-new-unit5',
                        name: 'Look and learn',
                        order: 1,
                        totalPages: 2,
                        previewText: 'rice, noodles, bread, milk, juice...'
                    },
                    {
                        id: 'english-hj-3-1-new-unit5-lesson2',
                        chapterId: 'english-hj-3-1-new-unit5',
                        name: 'Look and say',
                        order: 2,
                        totalPages: 2,
                        previewText: 'What do you like eating? I like eating...'
                    }
                ]
            },
            {
                id: 'english-hj-3-1-new-unit6',
                textbookId: 'english-hj-3-1-new',
                name: 'Unit 6 What do we like about small animals?',
                order: 6,
                lessons: [
                    {
                        id: 'english-hj-3-1-new-unit6-lesson1',
                        chapterId: 'english-hj-3-1-new-unit6',
                        name: 'Look and learn',
                        order: 1,
                        totalPages: 2,
                        previewText: 'cat, dog, rabbit, bird, fish...'
                    },
                    {
                        id: 'english-hj-3-1-new-unit6-lesson2',
                        chapterId: 'english-hj-3-1-new-unit6',
                        name: 'Look and say',
                        order: 2,
                        totalPages: 2,
                        previewText: 'Do you like cats? Yes, I do. / No, I don\'t.'
                    }
                ]
            },
            {
                id: 'english-hj-3-1-new-unit7',
                textbookId: 'english-hj-3-1-new',
                name: 'Unit 7 What do we know about weather?',
                order: 7,
                lessons: [
                    {
                        id: 'english-hj-3-1-new-unit7-lesson1',
                        chapterId: 'english-hj-3-1-new-unit7',
                        name: 'Look and learn',
                        order: 1,
                        totalPages: 2,
                        previewText: 'sunny, cloudy, rainy, windy, snowy...'
                    },
                    {
                        id: 'english-hj-3-1-new-unit7-lesson2',
                        chapterId: 'english-hj-3-1-new-unit7',
                        name: 'Look and say',
                        order: 2,
                        totalPages: 2,
                        previewText: 'What\'s the weather like? It\'s sunny.'
                    }
                ]
            },
            {
                id: 'english-hj-3-1-new-unit8',
                textbookId: 'english-hj-3-1-new',
                name: 'Unit 8 Why do we like birthdays?',
                order: 8,
                lessons: [
                    {
                        id: 'english-hj-3-1-new-unit8-lesson1',
                        chapterId: 'english-hj-3-1-new-unit8',
                        name: 'Look and learn',
                        order: 1,
                        totalPages: 2,
                        previewText: 'birthday, cake, present, party, candle...'
                    },
                    {
                        id: 'english-hj-3-1-new-unit8-lesson2',
                        chapterId: 'english-hj-3-1-new-unit8',
                        name: 'Look and say',
                        order: 2,
                        totalPages: 2,
                        previewText: 'When is your birthday? My birthday is in...'
                    }
                ]
            },
            // 人教版语文二年级上册(2025秋版)章节 —— 按教材目录图片精确对应
            {
                id: 'chinese-rj-2-1-new-unit1',
                textbookId: 'chinese-rj-2-1-new',
                name: '第一单元·阅读',
                order: 1,
                lessons: [
                    { id: 'chinese-rj-2-1-new-lesson1', chapterId: 'chinese-rj-2-1-new-unit1', name: '1 小蝌蚪找妈妈', order: 1, totalPages: 4, previewText: '池塘里有一群小蝌蚪，大大的脑袋，黑灰色的身子，甩着长长的尾巴...' },
                    { id: 'chinese-rj-2-1-new-lesson2', chapterId: 'chinese-rj-2-1-new-unit1', name: '2 我是什么', order: 2, totalPages: 3, previewText: '我会变。太阳一晒，我就变成汽...' },
                    { id: 'chinese-rj-2-1-new-lesson3', chapterId: 'chinese-rj-2-1-new-unit1', name: '3 植物妈妈有办法', order: 3, totalPages: 3, previewText: '孩子如果已经长大，就得告别妈妈，四海为家...' },
                    { id: 'chinese-rj-2-1-new-lesson-yw1', chapterId: 'chinese-rj-2-1-new-unit1', name: '语文园地一', order: 4, totalPages: 4, previewText: '语文园地一' },
                    { id: 'chinese-rj-2-1-new-lesson-kldsb', chapterId: 'chinese-rj-2-1-new-unit1', name: '快乐读书吧', order: 5, totalPages: 1, previewText: '读读童话故事' }
                ]
            },
            {
                id: 'chinese-rj-2-1-new-unit2',
                textbookId: 'chinese-rj-2-1-new',
                name: '第二单元·识字',
                order: 2,
                lessons: [
                    { id: 'chinese-rj-2-1-new-lesson4', chapterId: 'chinese-rj-2-1-new-unit2', name: '1 场景歌', order: 1, totalPages: 2, previewText: '一只海鸥，一片沙滩...' },
                    { id: 'chinese-rj-2-1-new-lesson5', chapterId: 'chinese-rj-2-1-new-unit2', name: '2 树之歌', order: 2, totalPages: 2, previewText: '杨树高，榕树壮，梧桐树叶像手掌...' },
                    { id: 'chinese-rj-2-1-new-lesson6', chapterId: 'chinese-rj-2-1-new-unit2', name: '3 拍手歌', order: 3, totalPages: 2, previewText: '你拍一，我拍一，动物世界很新奇...' },
                    { id: 'chinese-rj-2-1-new-lesson7', chapterId: 'chinese-rj-2-1-new-unit2', name: '4 田家四季歌', order: 4, totalPages: 3, previewText: '春季里，春风吹，花开草长蝴蝶飞...' },
                    { id: 'chinese-rj-2-1-new-lesson-yw2', chapterId: 'chinese-rj-2-1-new-unit2', name: '语文园地二', order: 5, totalPages: 3, previewText: '语文园地二' }
                ]
            },
            {
                id: 'chinese-rj-2-1-new-unit3',
                textbookId: 'chinese-rj-2-1-new',
                name: '第三单元·阅读',
                order: 3,
                lessons: [
                    { id: 'chinese-rj-2-1-new-lesson8', chapterId: 'chinese-rj-2-1-new-unit3', name: '4 彩虹', order: 1, totalPages: 2, previewText: '雨停了，天上有一座美丽的桥...' },
                    { id: 'chinese-rj-2-1-new-lesson9', chapterId: 'chinese-rj-2-1-new-unit3', name: '5 去外婆家', order: 2, totalPages: 2, previewText: '去外婆家' },
                    { id: 'chinese-rj-2-1-new-lesson10', chapterId: 'chinese-rj-2-1-new-unit3', name: '6 数星星的孩子', order: 3, totalPages: 3, previewText: '晚上，满天的星星像无数珍珠撒在碧玉盘里...' },
                    { id: 'chinese-rj-2-1-new-lesson-yw3', chapterId: 'chinese-rj-2-1-new-unit3', name: '语文园地三', order: 4, totalPages: 3, previewText: '语文园地三' }
                ]
            },
            {
                id: 'chinese-rj-2-1-new-unit4',
                textbookId: 'chinese-rj-2-1-new',
                name: '第四单元·阅读',
                order: 4,
                lessons: [
                    { id: 'chinese-rj-2-1-new-lesson11', chapterId: 'chinese-rj-2-1-new-unit4', name: '7 古诗二首', order: 1, totalPages: 2, previewText: '登鹳雀楼（王之涣）、望庐山瀑布（李白）' },
                    { id: 'chinese-rj-2-1-new-lesson12', chapterId: 'chinese-rj-2-1-new-unit4', name: '8 黄山奇石', order: 2, totalPages: 3, previewText: '闻名中外的黄山风景区在我国安徽省南部...' },
                    { id: 'chinese-rj-2-1-new-lesson13', chapterId: 'chinese-rj-2-1-new-unit4', name: '9 日月潭', order: 3, totalPages: 2, previewText: '日月潭是我国台湾省最大的一个湖...' },
                    { id: 'chinese-rj-2-1-new-lesson14', chapterId: 'chinese-rj-2-1-new-unit4', name: '10 葡萄沟', order: 4, totalPages: 3, previewText: '新疆吐鲁番有个地方叫葡萄沟...' },
                    { id: 'chinese-rj-2-1-new-lesson-yw4', chapterId: 'chinese-rj-2-1-new-unit4', name: '语文园地四', order: 5, totalPages: 3, previewText: '语文园地四' }
                ]
            },
            {
                id: 'chinese-rj-2-1-new-unit5',
                textbookId: 'chinese-rj-2-1-new',
                name: '第五单元·阅读',
                order: 5,
                lessons: [
                    { id: 'chinese-rj-2-1-new-lesson15', chapterId: 'chinese-rj-2-1-new-unit5', name: '11 坐井观天', order: 1, totalPages: 3, previewText: '青蛙坐在井里。小鸟飞来，落在井沿上...' },
                    { id: 'chinese-rj-2-1-new-lesson16', chapterId: 'chinese-rj-2-1-new-unit5', name: '12 寒号鸟', order: 2, totalPages: 4, previewText: '山脚下有一堵石崖，崖上有一道缝...' },
                    { id: 'chinese-rj-2-1-new-lesson17', chapterId: 'chinese-rj-2-1-new-unit5', name: '13 我要的是葫芦', order: 3, totalPages: 3, previewText: '从前，有个人种了一棵葫芦...' },
                    { id: 'chinese-rj-2-1-new-lesson-yw5', chapterId: 'chinese-rj-2-1-new-unit5', name: '语文园地五', order: 4, totalPages: 3, previewText: '语文园地五' }
                ]
            },
            {
                id: 'chinese-rj-2-1-new-unit6',
                textbookId: 'chinese-rj-2-1-new',
                name: '第六单元·阅读',
                order: 6,
                lessons: [
                    { id: 'chinese-rj-2-1-new-lesson18', chapterId: 'chinese-rj-2-1-new-unit6', name: '14 八角楼上', order: 1, totalPages: 2, previewText: '在井冈山艰苦斗争的年代...' },
                    { id: 'chinese-rj-2-1-new-lesson19', chapterId: 'chinese-rj-2-1-new-unit6', name: '15 朱德的扁担', order: 2, totalPages: 3, previewText: '1928年，朱德同志带领队伍到井冈山...' },
                    { id: 'chinese-rj-2-1-new-lesson20', chapterId: 'chinese-rj-2-1-new-unit6', name: '16 难忘的泼水节', order: 3, totalPages: 3, previewText: '火红火红的凤凰花开了，傣族人民一年一度的泼水节又到了...' },
                    { id: 'chinese-rj-2-1-new-lesson21', chapterId: 'chinese-rj-2-1-new-unit6', name: '17 刘胡兰', order: 4, totalPages: 3, previewText: '刘胡兰是山西省文水县云周西村人...' },
                    { id: 'chinese-rj-2-1-new-lesson-yw6', chapterId: 'chinese-rj-2-1-new-unit6', name: '语文园地六', order: 5, totalPages: 3, previewText: '语文园地六' }
                ]
            },
            {
                id: 'chinese-rj-2-1-new-unit7',
                textbookId: 'chinese-rj-2-1-new',
                name: '第七单元·阅读',
                order: 7,
                lessons: [
                    { id: 'chinese-rj-2-1-new-lesson22', chapterId: 'chinese-rj-2-1-new-unit7', name: '18 古诗二首', order: 1, totalPages: 2, previewText: '江雪（柳宗元）、敕勒歌（北朝民歌）' },
                    { id: 'chinese-rj-2-1-new-lesson23', chapterId: 'chinese-rj-2-1-new-unit7', name: '19 雾在哪里', order: 2, totalPages: 3, previewText: '从前有一片雾，他是个又淘气又顽皮的孩子...' },
                    { id: 'chinese-rj-2-1-new-lesson24', chapterId: 'chinese-rj-2-1-new-unit7', name: '20 雪孩子', order: 3, totalPages: 4, previewText: '下了一天一夜的大雪。房子上、树上、地上一片白...' },
                    { id: 'chinese-rj-2-1-new-lesson-yw7', chapterId: 'chinese-rj-2-1-new-unit7', name: '语文园地七', order: 4, totalPages: 4, previewText: '语文园地七' }
                ]
            },
            {
                id: 'chinese-rj-2-1-new-unit8',
                textbookId: 'chinese-rj-2-1-new',
                name: '第八单元·阅读',
                order: 8,
                lessons: [
                    { id: 'chinese-rj-2-1-new-lesson25', chapterId: 'chinese-rj-2-1-new-unit8', name: '21 称赞', order: 1, totalPages: 3, previewText: '清晨，小刺猬去森林里采果子...' },
                    { id: 'chinese-rj-2-1-new-lesson26', chapterId: 'chinese-rj-2-1-new-unit8', name: '22 纸船和风筝', order: 2, totalPages: 3, previewText: '松鼠和小熊住在一座山上...' },
                    { id: 'chinese-rj-2-1-new-lesson27', chapterId: 'chinese-rj-2-1-new-unit8', name: '23 快乐的小河', order: 3, totalPages: 3, previewText: '快乐的小河' },
                    { id: 'chinese-rj-2-1-new-lesson-yw8', chapterId: 'chinese-rj-2-1-new-unit8', name: '语文园地八', order: 4, totalPages: 4, previewText: '语文园地八' }
                ]
            },
            // 人教版语文二年级上册(2025秋版) 附录
            {
                id: 'chinese-rj-2-1-new-appendix',
                textbookId: 'chinese-rj-2-1-new',
                name: '附录',
                order: 9,
                lessons: [
                    { id: 'chinese-rj-2-1-new-lesson-szb', chapterId: 'chinese-rj-2-1-new-appendix', name: '识字表', order: 1, totalPages: 5, previewText: '识字表' },
                    { id: 'chinese-rj-2-1-new-lesson-xzb', chapterId: 'chinese-rj-2-1-new-appendix', name: '写字表', order: 2, totalPages: 3, previewText: '写字表' },
                    { id: 'chinese-rj-2-1-new-lesson-cyb', chapterId: 'chinese-rj-2-1-new-appendix', name: '词语表', order: 3, totalPages: 3, previewText: '词语表' }
                ]
            }
        ];

        // 页面内容数据（示例）
        this._pageContents = {
            'english-pep-3-1-unit1-lesson1': {
                1: {
                    lessonId: 'english-pep-3-1-unit1-lesson1',
                    pageNumber: 1,
                    backgroundImage: 'assets/images/pages/english-pep-3-1-unit1-lesson1-p1.png',
                    clickableElements: [
                        {
                            id: 'elem-1',
                            type: 'dialogue',
                            content: 'Hello! I\'m Wu Yifan.',
                            audioId: 'audio-hello-wuyifan',
                            position: { x: 50, y: 100, width: 200, height: 40 },
                            style: { fontSize: '16px', color: '#333' }
                        },
                        {
                            id: 'elem-2',
                            type: 'dialogue',
                            content: 'Hi! I\'m Sarah.',
                            audioId: 'audio-hi-sarah',
                            position: { x: 50, y: 160, width: 150, height: 40 },
                            style: { fontSize: '16px', color: '#333' }
                        },
                        {
                            id: 'elem-3',
                            type: 'word',
                            content: 'Hello',
                            audioId: 'audio-word-hello',
                            position: { x: 280, y: 100, width: 80, height: 30 },
                            style: { fontSize: '18px', color: '#4A90D9', fontWeight: 'bold' }
                        },
                        {
                            id: 'elem-4',
                            type: 'word',
                            content: 'Hi',
                            audioId: 'audio-word-hi',
                            position: { x: 280, y: 160, width: 40, height: 30 },
                            style: { fontSize: '18px', color: '#4A90D9', fontWeight: 'bold' }
                        }
                    ]
                },
                2: {
                    lessonId: 'english-pep-3-1-unit1-lesson1',
                    pageNumber: 2,
                    backgroundImage: 'assets/images/pages/english-pep-3-1-unit1-lesson1-p2.png',
                    clickableElements: [
                        {
                            id: 'elem-5',
                            type: 'dialogue',
                            content: 'Goodbye!',
                            audioId: 'audio-goodbye',
                            position: { x: 50, y: 100, width: 120, height: 40 },
                            style: { fontSize: '16px', color: '#333' }
                        },
                        {
                            id: 'elem-6',
                            type: 'dialogue',
                            content: 'Bye, Miss White!',
                            audioId: 'audio-bye-miss-white',
                            position: { x: 50, y: 160, width: 180, height: 40 },
                            style: { fontSize: '16px', color: '#333' }
                        }
                    ]
                }
            },
            'chinese-rj-3-1-lesson1': {
                1: {
                    lessonId: 'chinese-rj-3-1-lesson1',
                    pageNumber: 1,
                    backgroundImage: 'assets/images/pages/chinese-rj-3-1-lesson1-p1.png',
                    clickableElements: [
                        {
                            id: 'elem-c1',
                            type: 'text',
                            content: '大青树下的小学',
                            audioId: 'audio-title-daqingshu',
                            position: { x: 100, y: 50, width: 200, height: 40 },
                            style: { fontSize: '24px', color: '#E74C3C', fontWeight: 'bold' }
                        },
                        {
                            id: 'elem-c2',
                            type: 'text',
                            content: '早晨，从山坡上，从坪坝里，从一条条开着绒球花和太阳花的小路上，走来了许多小学生。',
                            audioId: 'audio-para1',
                            position: { x: 50, y: 120, width: 300, height: 60 },
                            style: { fontSize: '16px', color: '#333' }
                        },
                        {
                            id: 'elem-c3',
                            type: 'word',
                            content: '坪坝',
                            audioId: 'audio-word-pingba',
                            position: { x: 50, y: 200, width: 60, height: 30 },
                            style: { fontSize: '18px', color: '#E74C3C', fontWeight: 'bold' }
                        }
                    ]
                },
                2: {
                    lessonId: 'chinese-rj-3-1-lesson1',
                    pageNumber: 2,
                    backgroundImage: 'assets/images/pages/chinese-rj-3-1-lesson1-p2.png',
                    clickableElements: [
                        {
                            id: 'elem-c4',
                            type: 'text',
                            content: '有傣族的，有景颇族的，有阿昌族和德昂族的，还有汉族的。',
                            audioId: 'audio-para2',
                            position: { x: 50, y: 50, width: 300, height: 40 },
                            style: { fontSize: '16px', color: '#333' }
                        }
                    ]
                }
            },
            'math-rj-3-1-lesson1': {
                1: {
                    lessonId: 'math-rj-3-1-lesson1',
                    pageNumber: 1,
                    backgroundImage: 'assets/images/pages/math-rj-3-1-lesson1-p1.png',
                    clickableElements: [
                        {
                            id: 'elem-m1',
                            type: 'text',
                            content: '秒的认识',
                            audioId: 'audio-title-miao',
                            position: { x: 100, y: 50, width: 150, height: 40 },
                            style: { fontSize: '24px', color: '#2ECC71', fontWeight: 'bold' }
                        },
                        {
                            id: 'elem-m2',
                            type: 'formula',
                            content: '1分 = 60秒',
                            audioId: 'audio-formula-1min60sec',
                            position: { x: 100, y: 150, width: 150, height: 40 },
                            style: { fontSize: '20px', color: '#2ECC71', fontWeight: 'bold' }
                        },
                        {
                            id: 'elem-m3',
                            type: 'text',
                            content: '秒针走1小格是1秒，走一圈是60秒，也就是1分钟。',
                            audioId: 'audio-explain-sec',
                            position: { x: 50, y: 220, width: 300, height: 40 },
                            style: { fontSize: '16px', color: '#333' }
                        }
                    ]
                }
            },
            // 沪教版(2024秋版)三年级上册 Unit 1 Get ready
            'english-hj-3-1-new-unit1-lesson1': {
                1: {
                    lessonId: 'english-hj-3-1-new-unit1-lesson1',
                    pageNumber: 1,
                    backgroundImage: 'insidebook/_11.jpg',
                    clickableElements: [
                        {
                            id: 'hotspot-1',
                            type: 'text',
                            content: '上海教育出版社',
                            audioId: 'audio-publisher-1',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208141632izoc.mp3',
                            position: { x: 383, y: 14, width: 149, height: 23 }
                        },
                        {
                            id: 'hotspot-2',
                            type: 'text',
                            content: 'Unit 1 Get ready',
                            audioId: 'audio-unit1-title',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208141633wplb.mp3',
                            position: { x: 37, y: 45, width: 316, height: 51 }
                        },
                        {
                            id: 'hotspot-3',
                            type: 'text',
                            content: 'Think What feelings do we have?',
                            audioId: 'audio-think',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208141634caiv.mp3',
                            position: { x: 493, y: 80, width: 348, height: 59 }
                        },
                        {
                            id: 'hotspot-4',
                            type: 'text',
                            content: 'A Listen.Then point and say.',
                            audioId: 'audio-instruction-a',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208141634cnwr.mp3',
                            position: { x: 76, y: 152, width: 351, height: 29 }
                        },
                        {
                            id: 'hotspot-5',
                            type: 'word',
                            content: 'happy',
                            audioId: 'audio-happy-1',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208141635wnje.mp3',
                            position: { x: 124, y: 421, width: 75, height: 27 }
                        },
                        {
                            id: 'hotspot-6',
                            type: 'word',
                            content: 'sad',
                            audioId: 'audio-sad-1',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208141636bzzp.mp3',
                            position: { x: 336, y: 425, width: 40, height: 22 }
                        },
                        {
                            id: 'hotspot-7',
                            type: 'word',
                            content: 'angry',
                            audioId: 'audio-angry-1',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208141636lyof.mp3',
                            position: { x: 516, y: 425, width: 70, height: 23 }
                        },
                        {
                            id: 'hotspot-8',
                            type: 'word',
                            content: 'tired',
                            audioId: 'audio-tired-1',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208141637ioaf.mp3',
                            position: { x: 725, y: 423, width: 57, height: 23 }
                        },
                        {
                            id: 'hotspot-9',
                            type: 'text',
                            content: 'B Trace and match.',
                            audioId: 'audio-instruction-b',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208141638qffu.mp3',
                            position: { x: 81, y: 506, width: 236, height: 23 }
                        },
                        {
                            id: 'hotspot-10',
                            type: 'word',
                            content: 'happy',
                            audioId: 'audio-happy-2',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208141638aigl.mp3',
                            position: { x: 165, y: 590, width: 93, height: 34 }
                        },
                        {
                            id: 'hotspot-11',
                            type: 'word',
                            content: 'angry',
                            audioId: 'audio-angry-2',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208141639hnts.mp3',
                            position: { x: 347, y: 590, width: 97, height: 35 }
                        },
                        {
                            id: 'hotspot-12',
                            type: 'word',
                            content: 'sad',
                            audioId: 'audio-sad-2',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208141640yvig.mp3',
                            position: { x: 548, y: 591, width: 53, height: 20 }
                        },
                        {
                            id: 'hotspot-13',
                            type: 'word',
                            content: 'tired',
                            audioId: 'audio-tired-2',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208141641rkic.mp3',
                            position: { x: 728, y: 587, width: 65, height: 23 }
                        },
                        {
                            id: 'hotspot-14',
                            type: 'text',
                            content: 'Aa',
                            audioId: 'audio-aa',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208141644xeav.mp3',
                            position: { x: 262, y: 1175, width: 55, height: 30 }
                        },
                        {
                            id: 'hotspot-15',
                            type: 'text',
                            content: '上海教育出版社',
                            audioId: 'audio-publisher-2',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208141645cabd.mp3',
                            position: { x: 383, y: 1263, width: 148, height: 22 }
                        }
                    ]
                },
                2: {
                    lessonId: 'english-hj-3-1-new-unit1-lesson1',
                    pageNumber: 2,
                    backgroundImage: 'insidebook/_12.jpg',
                    clickableElements: [
                        {
                            id: 'hotspot-p2-1',
                            type: 'text',
                            content: '上海教育出版社',
                            audioId: 'audio-p2-publisher-1',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208144849lkgl.mp3',
                            position: { x: 387, y: 13, width: 147, height: 23 }
                        },
                        {
                            id: 'hotspot-p2-2',
                            type: 'text',
                            content: 'PREVIEW',
                            audioId: 'audio-p2-preview',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208144850yaws.mp3',
                            position: { x: 729, y: 62, width: 105, height: 23 }
                        },
                        {
                            id: 'hotspot-p2-3',
                            type: 'text',
                            content: 'Look and draw.',
                            audioId: 'audio-p2-look-draw',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208144851yyrs.mp3',
                            position: { x: 112, y: 103, width: 186, height: 23 }
                        },
                        {
                            id: 'hotspot-p2-4',
                            type: 'dialogue',
                            content: 'How are you?',
                            audioId: 'audio-p2-how-are-you',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208144851ivik.mp3',
                            position: { x: 693, y: 161, width: 173, height: 96 }
                        },
                        {
                            id: 'hotspot-p2-5',
                            type: 'text',
                            content: '上海教育出版社',
                            audioId: 'audio-p2-publisher-2',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208144852fumm.mp3',
                            position: { x: 382, y: 1261, width: 150, height: 23 }
                        },
                        {
                            id: 'hotspot-p2-6',
                            type: 'text',
                            content: '7',
                            audioId: 'audio-p2-page-number',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260208144853ufbr.mp3',
                            position: { x: 823, y: 1240, width: 12, height: 16 }
                        }
                    ]
                }
            },
            // 沪教版(2024秋版)三年级上册 Unit 1 Explore
            'english-hj-3-1-new-unit1-lesson2': {
                1: {
                    lessonId: 'english-hj-3-1-new-unit1-lesson2',
                    pageNumber: 1,
                    backgroundImage: 'insidebook/_13.jpg',
                    clickableElements: []
                },
                2: {
                    lessonId: 'english-hj-3-1-new-unit1-lesson2',
                    pageNumber: 2,
                    backgroundImage: 'insidebook/_14.jpg',
                    clickableElements: []
                },
                3: {
                    lessonId: 'english-hj-3-1-new-unit1-lesson2',
                    pageNumber: 3,
                    backgroundImage: 'insidebook/_15.jpg',
                    clickableElements: []
                },
                4: {
                    lessonId: 'english-hj-3-1-new-unit1-lesson2',
                    pageNumber: 4,
                    backgroundImage: 'insidebook/_16.jpg',
                    clickableElements: []
                }
            },
            // 沪教版(2024秋版)三年级上册 Unit 1 Communicate
            'english-hj-3-1-new-unit1-lesson3': {
                1: {
                    lessonId: 'english-hj-3-1-new-unit1-lesson3',
                    pageNumber: 1,
                    backgroundImage: 'insidebook/_17.jpg',
                    clickableElements: []
                },
                2: {
                    lessonId: 'english-hj-3-1-new-unit1-lesson3',
                    pageNumber: 2,
                    backgroundImage: 'insidebook/_18.jpg',
                    clickableElements: []
                }
            },
            // ==================== 语文 人教版 二年级上册(2025秋版) ====================
            // 第一单元·阅读
            // 第1课 小蝌蚪找妈妈（4页，已有insidebookCN图片）
            'chinese-rj-2-1-new-lesson1': {
                1: {
                    lessonId: 'chinese-rj-2-1-new-lesson1',
                    pageNumber: 1,
                    backgroundImage: 'insidebookCN/_06.jpg',
                    clickableElements: [
                        {
                            id: 'cn-p1-1',
                            type: 'text',
                            content: '人民教育出版社',
                            audioId: 'audio-cn-p1-publisher',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260210164324fbot.mp3',
                            position: { x: 251, y: 3, width: 191, height: 28 }
                        },
                        {
                            id: 'cn-p1-2',
                            type: 'text',
                            content: '第一单元·阅读',
                            audioId: 'audio-cn-p1-unit-title',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260210164325yyvp.mp3',
                            position: { x: 518, y: 24, width: 150, height: 23 }
                        },
                        {
                            id: 'cn-p1-3',
                            type: 'text',
                            content: '1',
                            audioId: 'audio-cn-p1-lesson-num',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260210164325kzrt.mp3',
                            position: { x: 201, y: 131, width: 13, height: 25 }
                        },
                        {
                            id: 'cn-p1-4',
                            type: 'text',
                            content: '小蝌蚪找妈妈',
                            audioId: 'audio-cn-p1-title',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260210164327sxwe.mp3',
                            position: { x: 254, y: 125, width: 253, height: 37 }
                        },
                        {
                            id: 'cn-p1-6',
                            type: 'text',
                            content: '池塘里有一群小蝌蚪,大大的脑袋,黑灰色的身子,甩着长长的尾巴,快活地游来游去。',
                            audioId: 'audio-cn-p1-para1',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260210164329segc.mp3',
                            position: { x: 82, y: 242, width: 554, height: 135 }
                        },
                        {
                            id: 'cn-p1-8',
                            type: 'text',
                            content: '小蝌蚪游哇游,过了几天,长出了两条后腿。他们看见鲤鱼妈妈在教小鲤鱼捕食,就迎上去,问:"鲤鱼阿姨,我们的妈妈在哪里?"鲤鱼妈妈说:"你们的妈妈四条腿,宽嘴巴。你们到那边去找吧!"',
                            audioId: 'audio-cn-p1-para2',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260210164333nhkd.mp3',
                            position: { x: 82, y: 402, width: 556, height: 242 }
                        },
                        {
                            id: 'cn-p1-10',
                            type: 'text',
                            content: '本文作者方惠珍、盛璐德,选作课文时有改动。',
                            audioId: 'audio-cn-p1-author',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260210164338ufsu.mp3',
                            position: { x: 82, y: 853, width: 307, height: 16 }
                        },
                        {
                            id: 'cn-p1-11',
                            type: 'text',
                            content: '人民教育出版社',
                            audioId: 'audio-cn-p1-publisher-bottom',
                            audioUrl: 'https://ossv2.jbangai.com/ai/at/372/audio/20260210164339yind.mp3',
                            position: { x: 254, y: 947, width: 187, height: 28 }
                        }
                    ]
                },
                2: { lessonId: 'chinese-rj-2-1-new-lesson1', pageNumber: 2, backgroundImage: 'insidebookCN/_07.jpg', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson1', pageNumber: 3, backgroundImage: 'insidebookCN/_08.jpg', clickableElements: [] },
                4: { lessonId: 'chinese-rj-2-1-new-lesson1', pageNumber: 4, backgroundImage: 'insidebookCN/_09.jpg', clickableElements: [] }
            },
            // 第2课 我是什么（3页）
            'chinese-rj-2-1-new-lesson2': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson2', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson2', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson2', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 第3课 植物妈妈有办法（3页）
            'chinese-rj-2-1-new-lesson3': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson3', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson3', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson3', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 语文园地一（4页）
            'chinese-rj-2-1-new-lesson-yw1': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson-yw1', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson-yw1', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson-yw1', pageNumber: 3, backgroundImage: '', clickableElements: [] },
                4: { lessonId: 'chinese-rj-2-1-new-lesson-yw1', pageNumber: 4, backgroundImage: '', clickableElements: [] }
            },
            // 快乐读书吧（1页）
            'chinese-rj-2-1-new-lesson-kldsb': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson-kldsb', pageNumber: 1, backgroundImage: '', clickableElements: [] }
            },
            // 第二单元·识字
            // 1 场景歌（2页）
            'chinese-rj-2-1-new-lesson4': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson4', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson4', pageNumber: 2, backgroundImage: '', clickableElements: [] }
            },
            // 2 树之歌（2页）
            'chinese-rj-2-1-new-lesson5': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson5', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson5', pageNumber: 2, backgroundImage: '', clickableElements: [] }
            },
            // 3 拍手歌（2页）
            'chinese-rj-2-1-new-lesson6': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson6', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson6', pageNumber: 2, backgroundImage: '', clickableElements: [] }
            },
            // 4 田家四季歌（3页）
            'chinese-rj-2-1-new-lesson7': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson7', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson7', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson7', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 语文园地二（3页）
            'chinese-rj-2-1-new-lesson-yw2': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson-yw2', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson-yw2', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson-yw2', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 第三单元·阅读
            // 4 彩虹（2页）
            'chinese-rj-2-1-new-lesson8': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson8', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson8', pageNumber: 2, backgroundImage: '', clickableElements: [] }
            },
            // 5 去外婆家（2页）
            'chinese-rj-2-1-new-lesson9': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson9', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson9', pageNumber: 2, backgroundImage: '', clickableElements: [] }
            },
            // 6 数星星的孩子（3页）
            'chinese-rj-2-1-new-lesson10': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson10', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson10', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson10', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 语文园地三（3页）
            'chinese-rj-2-1-new-lesson-yw3': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson-yw3', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson-yw3', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson-yw3', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 第四单元·阅读
            // 7 古诗二首（2页）
            'chinese-rj-2-1-new-lesson11': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson11', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson11', pageNumber: 2, backgroundImage: '', clickableElements: [] }
            },
            // 8 黄山奇石（3页）
            'chinese-rj-2-1-new-lesson12': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson12', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson12', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson12', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 9 日月潭（2页）
            'chinese-rj-2-1-new-lesson13': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson13', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson13', pageNumber: 2, backgroundImage: '', clickableElements: [] }
            },
            // 10 葡萄沟（3页）
            'chinese-rj-2-1-new-lesson14': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson14', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson14', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson14', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 语文园地四（3页）
            'chinese-rj-2-1-new-lesson-yw4': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson-yw4', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson-yw4', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson-yw4', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 第五单元·阅读
            // 11 坐井观天（3页）
            'chinese-rj-2-1-new-lesson15': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson15', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson15', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson15', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 12 寒号鸟（4页）
            'chinese-rj-2-1-new-lesson16': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson16', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson16', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson16', pageNumber: 3, backgroundImage: '', clickableElements: [] },
                4: { lessonId: 'chinese-rj-2-1-new-lesson16', pageNumber: 4, backgroundImage: '', clickableElements: [] }
            },
            // 13 我要的是葫芦（3页）
            'chinese-rj-2-1-new-lesson17': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson17', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson17', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson17', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 语文园地五（3页）
            'chinese-rj-2-1-new-lesson-yw5': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson-yw5', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson-yw5', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson-yw5', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 第六单元·阅读
            // 14 八角楼上（2页）
            'chinese-rj-2-1-new-lesson18': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson18', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson18', pageNumber: 2, backgroundImage: '', clickableElements: [] }
            },
            // 15 朱德的扁担（3页）
            'chinese-rj-2-1-new-lesson19': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson19', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson19', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson19', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 16 难忘的泼水节（3页）
            'chinese-rj-2-1-new-lesson20': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson20', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson20', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson20', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 17 刘胡兰（3页）
            'chinese-rj-2-1-new-lesson21': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson21', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson21', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson21', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 语文园地六（3页）
            'chinese-rj-2-1-new-lesson-yw6': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson-yw6', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson-yw6', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson-yw6', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 第七单元·阅读
            // 18 古诗二首（2页）
            'chinese-rj-2-1-new-lesson22': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson22', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson22', pageNumber: 2, backgroundImage: '', clickableElements: [] }
            },
            // 19 雾在哪里（3页）
            'chinese-rj-2-1-new-lesson23': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson23', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson23', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson23', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 20 雪孩子（4页）
            'chinese-rj-2-1-new-lesson24': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson24', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson24', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson24', pageNumber: 3, backgroundImage: '', clickableElements: [] },
                4: { lessonId: 'chinese-rj-2-1-new-lesson24', pageNumber: 4, backgroundImage: '', clickableElements: [] }
            },
            // 语文园地七（4页）
            'chinese-rj-2-1-new-lesson-yw7': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson-yw7', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson-yw7', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson-yw7', pageNumber: 3, backgroundImage: '', clickableElements: [] },
                4: { lessonId: 'chinese-rj-2-1-new-lesson-yw7', pageNumber: 4, backgroundImage: '', clickableElements: [] }
            },
            // 第八单元·阅读
            // 21 称赞（3页）
            'chinese-rj-2-1-new-lesson25': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson25', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson25', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson25', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 22 纸船和风筝（3页）
            'chinese-rj-2-1-new-lesson26': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson26', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson26', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson26', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 23 快乐的小河（3页）
            'chinese-rj-2-1-new-lesson27': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson27', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson27', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson27', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 语文园地八（4页）
            'chinese-rj-2-1-new-lesson-yw8': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson-yw8', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson-yw8', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson-yw8', pageNumber: 3, backgroundImage: '', clickableElements: [] },
                4: { lessonId: 'chinese-rj-2-1-new-lesson-yw8', pageNumber: 4, backgroundImage: '', clickableElements: [] }
            },
            // 附录
            // 识字表（5页）
            'chinese-rj-2-1-new-lesson-szb': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson-szb', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson-szb', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson-szb', pageNumber: 3, backgroundImage: '', clickableElements: [] },
                4: { lessonId: 'chinese-rj-2-1-new-lesson-szb', pageNumber: 4, backgroundImage: '', clickableElements: [] },
                5: { lessonId: 'chinese-rj-2-1-new-lesson-szb', pageNumber: 5, backgroundImage: '', clickableElements: [] }
            },
            // 写字表（3页）
            'chinese-rj-2-1-new-lesson-xzb': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson-xzb', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson-xzb', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson-xzb', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            },
            // 词语表（3页）
            'chinese-rj-2-1-new-lesson-cyb': {
                1: { lessonId: 'chinese-rj-2-1-new-lesson-cyb', pageNumber: 1, backgroundImage: '', clickableElements: [] },
                2: { lessonId: 'chinese-rj-2-1-new-lesson-cyb', pageNumber: 2, backgroundImage: '', clickableElements: [] },
                3: { lessonId: 'chinese-rj-2-1-new-lesson-cyb', pageNumber: 3, backgroundImage: '', clickableElements: [] }
            }
        };

        // 音色数据
        this._voices = [
            {
                id: 'voice-male',
                name: '男声',
                type: 'male',
                previewAudioUrl: 'assets/audio/preview-male.mp3',
                description: '清晰标准的男性声音'
            },
            {
                id: 'voice-female',
                name: '女声',
                type: 'female',
                previewAudioUrl: 'assets/audio/preview-female.mp3',
                description: '温柔自然的女性声音'
            }
        ];
    }

    // ==================== 数据获取方法 ====================

    /**
     * 获取学科列表
     * @returns {Promise<Subject[]>} 学科列表
     */
    async getSubjects() {
        const cacheKey = 'subjects';
        const cached = this.getCachedData(cacheKey);
        
        if (cached) {
            return cached;
        }

        // 模拟网络延迟
        await this._simulateDelay(300);
        
        const subjects = [...this._subjects].sort((a, b) => a.order - b.order);
        this.cacheData(cacheKey, subjects);
        
        return subjects;
    }

    /**
     * 获取教材列表
     * @param {string} [subjectId] - 学科ID（可选，不提供则返回所有教材）
     * @returns {Promise<Textbook[]>} 教材列表
     */
    async getTextbooks(subjectId) {
        const cacheKey = subjectId ? `textbooks_${subjectId}` : 'textbooks_all';
        const cached = this.getCachedData(cacheKey);
        
        if (cached) {
            return cached;
        }

        // 模拟网络延迟
        await this._simulateDelay(400);
        
        let textbooks;
        if (subjectId) {
            textbooks = this._textbooks.filter(t => t.subjectId === subjectId);
        } else {
            textbooks = [...this._textbooks];
        }
        
        this.cacheData(cacheKey, textbooks);
        
        return textbooks;
    }

    /**
     * 获取章节列表
     * @param {string} textbookId - 教材ID
     * @returns {Promise<Chapter[]>} 章节列表
     */
    async getChapters(textbookId) {
        if (!textbookId) {
            throw new Error('textbookId is required');
        }

        const cacheKey = `chapters_${textbookId}`;
        const cached = this.getCachedData(cacheKey);
        
        if (cached) {
            return cached;
        }

        // 模拟网络延迟
        await this._simulateDelay(350);
        
        const chapters = this._chapters
            .filter(c => c.textbookId === textbookId)
            .sort((a, b) => a.order - b.order)
            .map(chapter => ({
                ...chapter,
                lessons: chapter.lessons.sort((a, b) => a.order - b.order)
            }));
        
        this.cacheData(cacheKey, chapters);
        
        return chapters;
    }

    /**
     * 获取页面内容
     * @param {string} lessonId - 课程ID
     * @param {number} pageNumber - 页码
     * @returns {Promise<PageContent>} 页面内容
     */
    async getPageContent(lessonId, pageNumber) {
        if (!lessonId) {
            throw new Error('lessonId is required');
        }
        if (typeof pageNumber !== 'number' || pageNumber < 1) {
            throw new Error('pageNumber must be a positive number');
        }

        const cacheKey = `page_${lessonId}_${pageNumber}`;
        const cached = this.getCachedData(cacheKey);
        
        if (cached) {
            return cached;
        }

        // 模拟网络延迟
        await this._simulateDelay(500);
        
        const lessonPages = this._pageContents[lessonId];
        
        if (!lessonPages || !lessonPages[pageNumber]) {
            // 为没有页面内容的课程生成默认背景图片路径
            let defaultBackgroundImage = null;
            
            // 检查是否是沪教版英语三年级上册(2024秋版)的课程
            if (lessonId.includes('english-hj-3-1-new')) {
                // 解析 lessonId 来获取 Unit 和 Lesson 编号
                // 格式: english-hj-3-1-new-unitX-lessonY
                const unitMatch = lessonId.match(/unit(\d+)/i);
                const lessonMatch = lessonId.match(/lesson(\d+)/i);
                
                if (unitMatch && lessonMatch) {
                    const unitNum = parseInt(unitMatch[1], 10);
                    const lessonNum = parseInt(lessonMatch[1], 10);
                    
                    // 根据课程计算正确的页码
                    // insidebook 文件夹中有 _10.jpg 到 _18.jpg，共9张图片
                    // 这些图片用于 Unit 1 的课程
                    let pageIndex = 0;
                    
                    if (unitNum === 1) {
                        // Unit 1 的图片存在于 insidebook 文件夹中
                        if (lessonNum === 1) {
                            pageIndex = 10 + pageNumber; // 11, 12
                        } else if (lessonNum === 2) {
                            pageIndex = 12 + pageNumber; // 13, 14, 15, 16
                        } else if (lessonNum === 3) {
                            pageIndex = 16 + pageNumber; // 17, 18
                        } else if (lessonNum === 4) {
                            pageIndex = 18 + pageNumber; // 19 (超出范围)
                        }
                    }
                    
                    // 确保页码在有效范围内（10-18）
                    if (pageIndex >= 10 && pageIndex <= 18) {
                        defaultBackgroundImage = `insidebook/_${pageIndex}.jpg`;
                    }
                }
            }
            
            // 返回默认页面内容
            const defaultContent = {
                lessonId,
                pageNumber,
                backgroundImage: defaultBackgroundImage,
                clickableElements: []
            };
            return defaultContent;
        }
        
        const content = lessonPages[pageNumber];
        this.cacheData(cacheKey, content);
        
        return content;
    }

    /**
     * 获取课程信息
     * @param {string} lessonId - 课程ID
     * @returns {Promise<Lesson|null>} 课程信息
     */
    async getLesson(lessonId) {
        if (!lessonId) {
            return null;
        }

        const cacheKey = `lesson_${lessonId}`;
        const cached = this.getCachedData(cacheKey);
        
        if (cached) {
            return cached;
        }

        // 在所有章节中查找课程
        for (const chapter of this._chapters) {
            const lesson = chapter.lessons.find(l => l.id === lessonId);
            if (lesson) {
                this.cacheData(cacheKey, lesson);
                return lesson;
            }
        }
        
        return null;
    }

    /**
     * 获取音频URL
     * @param {string} contentId - 内容ID
     * @param {string} voiceId - 音色ID
     * @returns {string} 音频URL
     */
    getAudioUrl(contentId, voiceId) {
        if (!contentId) {
            throw new Error('contentId is required');
        }
        
        // 默认音色
        const voice = voiceId || 'voice-female';
        
        // 构建音频URL（实际项目中会根据内容ID和音色ID从服务器获取）
        return `assets/audio/${voice}/${contentId}.mp3`;
    }

    /**
     * 获取音色列表
     * @returns {Promise<Voice[]>} 音色列表
     */
    async getVoices() {
        const cacheKey = 'voices';
        const cached = this.getCachedData(cacheKey);
        
        if (cached) {
            return cached;
        }

        await this._simulateDelay(200);
        
        const voices = [...this._voices];
        this.cacheData(cacheKey, voices);
        
        return voices;
    }

    // ==================== 缓存管理方法 ====================

    /**
     * 缓存数据
     * @param {string} key - 缓存键
     * @param {any} data - 要缓存的数据
     */
    cacheData(key, data) {
        if (!key) {
            throw new Error('Cache key is required');
        }
        
        this._cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * 获取缓存数据
     * @param {string} key - 缓存键
     * @param {number} maxAge - 最大缓存时间（毫秒），默认5分钟
     * @returns {any|null} 缓存的数据，如果不存在或已过期则返回null
     */
    getCachedData(key, maxAge = 5 * 60 * 1000) {
        if (!key) {
            return null;
        }
        
        const cached = this._cache.get(key);
        
        if (!cached) {
            return null;
        }
        
        // 检查缓存是否过期
        if (Date.now() - cached.timestamp > maxAge) {
            this._cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    /**
     * 清除指定缓存
     * @param {string} key - 缓存键
     */
    clearCache(key) {
        if (key) {
            this._cache.delete(key);
        }
    }

    /**
     * 清除所有缓存
     */
    clearAllCache() {
        this._cache.clear();
    }

    /**
     * 获取缓存统计信息
     * @returns {object} 缓存统计
     */
    getCacheStats() {
        return {
            size: this._cache.size,
            keys: Array.from(this._cache.keys())
        };
    }

    // ==================== 辅助方法 ====================

    /**
     * 模拟网络延迟
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise<void>}
     * @private
     */
    _simulateDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 检查学科是否存在
     * @param {string} subjectId - 学科ID
     * @returns {boolean}
     */
    hasSubject(subjectId) {
        return this._subjects.some(s => s.id === subjectId);
    }

    /**
     * 检查教材是否存在
     * @param {string} textbookId - 教材ID
     * @returns {boolean}
     */
    hasTextbook(textbookId) {
        return this._textbooks.some(t => t.id === textbookId);
    }
}

// 导出单例实例
const dataManager = new DataManager();

// 支持ES模块和CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataManager, dataManager };
}
