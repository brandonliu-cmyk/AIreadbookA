# 需求文档

## 简介

本功能为现有AI点读笔Web应用增加完整的语文（中文）教材支持。当前应用已有英语教材的完整点读功能，本次增强将确保语文教材（以人教版语文二年级上册2025秋版为首个完整支持的教材）具备与英语版本完全一致的功能和界面体验。

## 术语表

- **DataManager**: 数据管理模块，负责存储和提供学科、教材、章节、页面内容等模拟数据
- **PageRenderer**: 页面渲染组件，负责将教材页面图片和可点击热区渲染到界面上
- **ChapterNavigator**: 章节导航组件，负责展示教材的单元和课文列表
- **BookFlipper**: 翻页组件，负责页面翻页动画和页码管理
- **insidebookCN**: 存放语文教材内页图片的文件夹
- **热区（Hotspot）**: 教材页面上的可点击区域，点击后触发音频播放等交互
- **页面内容（PageContent）**: 包含背景图片路径和可点击元素列表的数据对象
- **课文目录**: 教材的章节和课文组织结构，按单元分组

## 需求

### 需求1：语文二年级上册课文目录数据校验与修正

**用户故事：** 作为开发者，我希望DataManager中的语文二年级上册(2025秋版)课文目录数据与实际教材目录完全一致，以便用户能准确浏览和选择课文。

#### 验收标准

1. THE DataManager SHALL 包含与实际教材完全一致的8个单元数据，单元名称分别为：第一单元·阅读、第二单元·识字、第三单元·阅读、第四单元·阅读、第五单元·阅读、第六单元·阅读、第七单元·阅读、第八单元·阅读
2. WHEN 加载第一单元时，THE DataManager SHALL 返回5个条目：1 小蝌蚪找妈妈、2 我是什么、3 植物妈妈有办法、语文园地一、快乐读书吧
3. WHEN 加载第二单元时，THE DataManager SHALL 返回5个条目：1 场景歌、2 树之歌、3 拍手歌、4 田家四季歌、语文园地二
4. WHEN 加载第三单元时，THE DataManager SHALL 返回4个条目：4 彩虹、5 去外婆家、6 数星星的孩子、语文园地三
5. WHEN 加载第四单元时，THE DataManager SHALL 返回5个条目：7 古诗二首（登鹳雀楼/望庐山瀑布）、8 黄山奇石、9 日月潭、10 葡萄沟、语文园地四
6. WHEN 加载第五单元时，THE DataManager SHALL 返回4个条目：11 坐井观天、12 寒号鸟、13 我要的是葫芦、语文园地五
7. WHEN 加载第六单元时，THE DataManager SHALL 返回5个条目：14 八角楼上、15 朱德的扁担、16 难忘的泼水节、17 刘胡兰、语文园地六
8. WHEN 加载第七单元时，THE DataManager SHALL 返回4个条目：18 古诗二首（江雪/敕勒歌）、19 雾在哪里、20 雪孩子、语文园地七
9. WHEN 加载第八单元时，THE DataManager SHALL 返回4个条目：21 称赞、22 纸船和风筝、23 快乐的小河、语文园地八

### 需求2：附录数据支持

**用户故事：** 作为用户，我希望能在教材目录中看到附录部分（识字表、写字表、词语表），以便完整浏览教材内容。

#### 验收标准

1. THE DataManager SHALL 在8个单元之后包含一个附录章节
2. WHEN 加载附录章节时，THE DataManager SHALL 返回3个条目：识字表、写字表、词语表
3. WHEN 附录条目被选中时，THE ChapterNavigator SHALL 以与普通课文相同的方式展示附录条目

### 需求3：语文课文页面内容数据

**用户故事：** 作为开发者，我希望所有语文课文都有对应的页面内容数据条目，以便PageRenderer能正确加载和显示页面。

#### 验收标准

1. THE DataManager SHALL 为每个语文课文提供页面内容数据条目，包含lessonId、pageNumber和backgroundImage字段
2. WHEN 加载第1课（小蝌蚪找妈妈）的页面时，THE DataManager SHALL 返回引用insidebookCN文件夹中_06.jpg至_09.jpg的4个页面
3. WHEN 加载其他课文的页面时，THE DataManager SHALL 返回包含空clickableElements数组的页面内容数据
4. IF 某课文的图片文件尚未提供，THEN THE DataManager SHALL 返回backgroundImage为null的页面内容数据

### 需求4：语文点读页面图片显示

**用户故事：** 作为用户，我希望语文点读页面能正确显示insidebookCN文件夹中的教材图片，以便我能看到教材内容。

#### 验收标准

1. WHEN 用户选择语文课文并进入点读页面时，THE PageRenderer SHALL 加载并显示对应的insidebookCN文件夹中的图片作为页面背景
2. WHEN 图片加载成功时，THE PageRenderer SHALL 以正确的比例和尺寸显示图片
3. IF 图片加载失败，THEN THE PageRenderer SHALL 显示友好的错误提示而非空白页面

### 需求5：语文教材功能一致性

**用户故事：** 作为用户，我希望语文教材的所有功能和界面与英语教材完全一致，以便获得统一的使用体验。

#### 验收标准

1. WHEN 用户浏览语文教材时，THE BookFlipper SHALL 提供与英语教材相同的翻页功能和动画效果
2. WHEN 用户在语文点读页面时，THE PageRenderer SHALL 支持与英语教材相同的缩放操作
3. WHEN 用户选择语文教材时，THE ChapterNavigator SHALL 以与英语教材相同的方式展示单元和课文列表
4. THE SubjectSelector SHALL 在学科选择界面中正确显示语文学科选项

### 需求6：语文教材热区预留

**用户故事：** 作为开发者，我希望语文教材的热区数据结构已预留好，以便后续用户提供热区坐标后能快速集成。

#### 验收标准

1. THE DataManager SHALL 为每个语文课文页面提供空的clickableElements数组
2. WHEN 热区数据为空时，THE PageRenderer SHALL 正常显示页面图片而不报错
3. WHEN 后续添加热区数据时，THE PageRenderer SHALL 无需代码修改即可渲染新增的热区元素
