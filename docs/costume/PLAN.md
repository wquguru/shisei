# 服装库计划（草案，2026-10-30）

> 状态：**计划，未开工**。按 AGENTS §8，新增图片系列要人点头；本文件里的待定项（D-10）拍板之前不生成、不改 catalog、不改 verify。
> 做法：一套（一个大类）一套地做，每套走完 列清单 → 写 desc → 生成 → QC → 入库，再开下一套。

## 1. 定位

和姿势库配套的服装参考图，给 AI 换装、角色设定、试穿工作流用。差异化来自四点：

1. **三视图**：每件正面、背面、侧面三张，同一件衣服。参考站只有一张平铺图，背面是空档。
2. **覆盖面**：中国历代形制、世界民族、男装和中性服装，参考站只有女装 8 类（四季、内衣、派对、泳装、性感）。
3. **CC0**：可再分发、可批量下载、可商用二改。
4. **和姿势库同一套体系**：四语命名、同样的 QC、同一个网站，以后可和姿势、场景做组合器。

分类和清单是自己定的，没有照搬任何参考站的分类；也不下载、不参考任何外站的图（AGENTS §2）。

## 2. 画面格式（每条提示词都依赖它，先定）

| 项 | 推荐 | 理由 |
|---|---|---|
| 呈现方式 | **隐形人台（ghost mannequin）商品照**：衣服保持穿着时的立体形状，里面没有人 | 试穿工具要看清版型和结构；平铺图看不出穿上后的轮廓 |
| 色彩 | 写实彩色 | 服装参考的价值就是颜色、面料、纹样，线稿没用 |
| 视图 | 正面 `front` / 背面 `back` / 左侧面 `side` | 背面是差异点；侧面看衣长、廓形、层次 |
| 比例 | 3:4 竖版，和姿势库一致 | 同一套图层，网站和组合器好对齐 |
| 背景 | 浅灰无缝背景、柔光、居中留白 | 抠图、换装都干净 |
| 范围 | 从领口到鞋；鞋按清单决定要不要 | 隐形人台没有头 |
| 头饰 | **不进服装库**，冠、簪、帽、头巾留给以后的配饰 / 道具系列 | 没有头就挂不住，硬画会出现悬空的头饰或人头 |

## 3. 提示词

所有提示词用英文（姿势库的经验：英文模板最稳），一次只出一张图。

### 3.1 基础模板：正面（文生图）

```
Product photograph of {GARMENT}, displayed on an invisible ghost mannequin so the garment keeps a natural
three-dimensional worn shape with nobody inside, {VIEW}, the complete outfit from collar to {LOWER_END},
centered with even margins, soft even studio lighting, plain light grey seamless background,
accurate fabric colour and texture, visible construction details such as seams, closures, hems and trims,
3:4 vertical, catalogue style.
{CATEGORY_RULES}
No person, no face, no head, no hair, no skin, no hands, no visible mannequin body, no hanger, no props,
no text, no logo, no brand mark, no watermark.
{CATEGORY_NEGATIVES}
```

- `{VIEW}`：`straight front view, camera at chest height`
- `{LOWER_END}`：`the hem`，或清单写了鞋时 `the shoes, shown as worn at the bottom`
- `{GARMENT}`：每件的 `desc_en`，写法见各大类的模块
- `{CATEGORY_RULES}` / `{CATEGORY_NEGATIVES}`：各大类模块里的两行

### 3.2 转视角：背面、侧面（以正面图为参考，一次一张）

```
Image 1 is a product photograph of a garment on an invisible ghost mannequin.
Show exactly the same garment from {VIEW}. Keep every colour, pattern, fabric, trim, length and layer
identical to image 1; add nothing that image 1 does not support. Same light grey background, same lighting,
same scale and framing, 3:4 vertical.
{CATEGORY_RULES}
No person, no face, no head, no skin, no hands, no text, no logo.
```

- 背面：`a straight back view showing the full back of the garment`
- 侧面：`a left side profile view, turned 90 degrees, showing garment length and layering`

正面先过 QC 再转背面和侧面，正面不合格就不往下做（同一件衣服三张都得对）。

### 3.3 desc_en 的写法

一句话按顺序写：**品类 + 形制 / 版型 → 主色和配色 → 面料 → 纹样 → 关键结构（领、袖、门襟、腰、下摆）→ 鞋（如有）**。
例：`a Ming-dynasty women's ensemble: a standing-collar long jacket in pale blue silk with gold-thread cloud
patterns and metal button fastenings, over a pleated horse-face skirt (mamianqun) in deep red brocade with a
flat front panel and side pleats`。

## 4. 大类（一套 = 一个大类）

| 顺序 | 代号 | 大类 | 目标件数 | 分级 |
|---|---|---|---|---|
| 1 | HC | 中国历代 | 60 | general |
| 2 | WE | 世界民族 | 50 | general |
| 3 | MD | 现代日常（四季做标签） | 80 | general |
| 4 | FM | 正式与礼服 | 30 | general |
| 5 | SP | 运动与户外 | 30 | general |
| 6 | WK | 职业与制服 | 30 | general |
| 7 | WH | 西方历史年代 | 30 | general |
| 8 | FN | 原创幻想 | 40 | general |
| 9 | FS | 节日与派对 | 20 | general |
| 10 | IN | 家居、泳装、内衣 | 30 | 部分 suggestive |
| | | 合计 | 400 | |

**横向标签**（每件都打，组合器和搜索用）：性别（女 / 男 / 中性）、季节（春 / 夏 / 秋 / 冬 / 四季）、年代或朝代、地区、场合（日常 / 正式 / 礼仪 / 运动 / 舞台）、主色、面料。
四季不单独成类：季节放在标签里，每个现代风格都要求四季各至少一件，"完整"才能用数字核对。

**男女比例**：每个大类男装或中性服装不少于三分之一（IN 除外）。

---

### 4.1 HC 中国历代（第一套）

卖点是**形制准确**，所以每件都写结构要点，QC 也按形制审。

```
CATEGORY_RULES: Historically accurate Chinese hanfu of the stated dynasty. Cross-collar garments close
right-over-left (the left front panel crosses over the right, forming a y-shaped collar seen from the front).
Natural silk, ramie or brocade textures; traditional woven or embroidered patterns only.
CATEGORY_NEGATIVES: No Japanese kimono features (no wide obi belt, no obi bow, no tomoe-style sleeves),
no Korean hanbok features (no very short jeogori with long goreum ribbon), no left-over-right closing,
no modern zippers, no lace, no costume-drama glitter or fantasy armour.
```

| 朝代 | 件目 | 性别 | 形制要点 |
|---|---|---|---|
| 汉 | 曲裾深衣 | 女 | 交领右衽，衣襟绕身形成螺旋下摆，宽缘，长及地 |
| 汉 | 直裾深衣 | 男 | 交领右衽，衣襟垂直，宽袖，系腰带 |
| 魏晋 | 大袖衫 + 间色裙 | 女 | 对襟大袖长衫，高腰竖条间色长裙 |
| 魏晋 | 褒衣博带 | 男 | 宽大交领袍，大袖，宽腰带 |
| 唐 | 齐胸襦裙 | 女 | 短襦，长裙系在胸上，披帛 |
| 唐 | 交领高腰襦裙（初唐） | 女 | 窄袖短襦，高腰条纹裙，半臂 |
| 唐 | 圆领袍 | 男 / 女 | 圆领、右衽、窄袖，腰系革带，配靴 |
| 唐 | 大袖衫礼服（晚唐） | 女 | 薄纱大袖衫罩在齐胸裙外，长披帛 |
| 宋 | 褙子 + 抹胸 + 宋裤 | 女 | 对襟直领长褙子，两侧开衩，内抹胸 |
| 宋 | 交领短衫 + 百迭裙 | 女 | 短衫，细密褶长裙 |
| 宋 | 直裰 | 男 | 交领长袍，背后中缝，两侧不开衩 |
| 宋 | 襕衫 | 男 | 圆领，下摆加横襕，宽袖 |
| 明 | 竖领长袄 + 马面裙 | 女 | 立领、金属子母扣，马面裙前后平幅、两侧打褶 |
| 明 | 交领短袄 + 马面裙 | 女 | 交领右衽短袄，织金马面裙 |
| 明 | 比甲 + 袄裙 | 女 | 无袖对襟长比甲罩在袄裙外 |
| 明 | 道袍 | 男 | 交领右衽，大袖，两侧有暗摆 |
| 明 | 曳撒 | 男 | 交领，上衣下裳相连，下摆前襟分裁、打褶 |
| 明 | 圆领补服 | 男 | 圆领大袖，胸背方形补子（纹样不对应真实官阶也可） |
| 明 | 披风 | 女 / 男 | 对襟直领，两侧开衩，长及小腿 |
| 清 | 氅衣 | 女 | 圆领大襟右衽，宽袖，两侧不开衩，宽镶边 |
| 清 | 长袍 + 马褂 | 男 | 立领大襟长袍，外套对襟短马褂 |
| 清 | 汉女袄裙 | 女 | 大襟袄，宽镶边，马面裙 |
| 民国 | 倒大袖旗袍（1920s） | 女 | 宽袖喇叭口，直身，长及小腿 |
| 民国 | 改良旗袍（1930s） | 女 | 立领、斜襟、修身、高开衩、短袖或无袖 |
| 民国 | 长衫 | 男 | 立领大襟长衫，素色 |
| 民国 | 中山装 | 男 | 立翻领，四贴袋，五粒扣 |
| 婚服 | 明制婚服（霞帔） | 女 | 红色大袖衫，霞帔垂于胸前，马面裙；不含凤冠 |
| 婚服 | 唐制婚服（钗钿礼衣） | 女 | 绿或青色大袖礼衣，层叠长裙；不含头饰 |
| 婚服 | 明制男婚服 | 男 | 红色圆领袍，革带 |

29 件 × 常见配色变体（每件 2 个配色，部分 1 个）补到 60。
"文明新装"（民国学生装）**不做**：读起来像学生，按 QC 的未成年规则会被拦。

### 4.2 WE 世界民族

```
CATEGORY_RULES: Authentic everyday or festive traditional attire of the stated culture, respectful and accurate,
correct regional silhouette, fabric and pattern.
CATEGORY_NEGATIVES: No mixing elements from other cultures, no costume-party exaggeration,
no religious or ceremonial regalia.
```

| 地区 | 件目 |
|---|---|
| 东亚 | 振袖（女）、浴衣（女 / 男）、羽织袴（男）、韩服（女 / 男） |
| 东南亚 | 奥黛（女 / 男）、泰装 chut thai（女）、印尼 kebaya（女）、马来 baju melayu（男） |
| 南亚 | 纱丽（女）、salwar kameez（女）、kurta pajama（男）、sherwani（男） |
| 中国少数民族 | 苗族盛装（女，只含银项圈、不含银冠）、藏族藏袍（女 / 男）、蒙古袍（女 / 男）、维吾尔族艾德莱斯裙（女）、傣族筒裙（女）、彝族（女）、朝鲜族（女） |
| 欧洲 | 苏格兰 kilt（男）、德国 dirndl（女）、lederhosen（男）、弗拉门戈裙（女）、俄罗斯 sarafan（女）、乌克兰 vyshyvanka（女 / 男） |
| 美洲 | 墨西哥 china poblana（女）、huipil（女）、秘鲁 pollera（女） |
| 非洲与中东 | 西非 kente（男 / 女）、ankara 裙（女）、摩洛哥 kaftan（女）、djellaba（男） |

**不做**：宗教神职服装（袈裟、法衣）、羽冠等仪式礼器、丧服；以宗教身份为核心的服饰（头巾本来也不进服装库）。

### 4.3 MD 现代日常

```
CATEGORY_RULES: Contemporary ready-to-wear outfit, realistic current fashion, plausible fabrics and fit.
CATEGORY_NEGATIVES: No recognisable brand designs, monograms or signature patterns, no school uniform.
```

16 个风格，每个风格 5 件（女 2、男 2、中性 1），四季至少各 1 件：

休闲、街头、通勤、极简、新中式、日系、韩系、法式、美式复古、Y2K、甜美、森系、机能、户外 gorpcore、学院风（成人化：针织背心、牛津衬衫，不做制服、不做格子短裙 + 领结组合）、度假。

### 4.4 FM 正式与礼服

西装三件套（男 / 女）、燕尾服、无尾礼服、晚礼服（鱼尾、A 字、抹胸、一字肩）、鸡尾酒裙、正装套裙、婚纱（A 字、鱼尾、简约缎面、蓬裙）、新中式礼服（女 / 男）、秀禾服、龙凤褂、毕业学位袍。

### 4.5 SP 运动与户外

瑜伽、跑步、健身、篮球、足球、网球、高尔夫、骑行、滑雪、单板、登山冲锋衣、冲浪防寒服、拳击、击剑、马术、武术练功服、成人芭蕾练功服、赛车服。
负面词补一条：`no team crests, no sponsor logos, no national team colours copied from a real kit`。

### 4.6 WK 职业与制服

医生白大褂、手术服、护士服（朴素款）、厨师服、咖啡师围裙、空乘（通用款、无航司标识）、机长、消防员、工装 / 安全背心、宇航服、实验服、餐厅侍应、古典女仆（维多利亚长裙款）、管家、园丁、画家工作服。
**规则**：不带任何真实机构、国家、公司的徽章和标识；不做警服、军装（冒充风险）；不做"性感护士 / 性感女仆"这类变体。

### 4.7 WH 西方历史年代

古希腊 chiton、罗马 toga、中世纪 cotehardie、都铎、巴洛克、洛可可 robe à la française、摄政 Regency、维多利亚 bustle、爱德华、1920s flapper、1930s、1940s、1950s swing、1960s mod、1970s disco、1980s power suit、1990s grunge。每个年代女 1 男 1，部分年代补到 30。

### 4.8 FN 原创幻想

骑士板甲、游侠皮甲、法师袍、精灵、刺客、吟游诗人、海盗、赛博朋克、蒸汽朋克、废土、太空军、机甲驾驶服、仙侠道袍、武侠劲装、魔女、哥特吸血鬼、北地蛮族、天使与恶魔（服装本身，不带翅膀）。
负面词补一条：`original design, not any existing game, anime, film or franchise character`。

### 4.9 FS 节日与派对

圣诞、万圣（与 FN 不重复的款）、春节红装（女 / 男）、假面舞会、狂欢节、伴娘裙、演唱会舞台装、魔术师、马戏团领班、派对亮片裙。

### 4.10 IN 家居、泳装、内衣（最后做）

| 子类 | 分级 |
|---|---|
| 睡衣、家居服、浴袍 | general |
| 一件式泳衣、冲浪服、男士泳裤 | general |
| 比基尼、内衣、吊带睡裙 | suggestive |

隐形人台没有身体，不会出现露点；分级按上表的类别定，个别调整按现行规则记在 `data/rating_overrides.json`。

## 5. 全库禁区

- **品牌**：图片 CC0 发布，像某个品牌的设计、标志性纹样（老花、格纹）、标志都不行；负面词里写，QC 单独审。
- **未成年感**：学生制服（JK、水手服、民国学生装）、童装比例、"lolita"这类名称都不做。
- **IP**：不做任何现有游戏、动漫、电影角色的衣服。
- **文化**：不做宗教神职服装和仪式礼器，民族服饰按日常或节庆穿着来做，不做猎奇化、派对化版本。
- **人**：画面里不能出现人、脸、皮肤、手；出现就判不通过。

## 6. QC（开工前先补进 docs/qc/）

每张图审：

1. **名实相符**：是不是清单里这件，形制要点都在（HC、WE、WH 逐条对照第 4 节的形制要点）。
2. **三视图一致**：背面、侧面和正面是同一件，颜色、纹样、长度、层次都对得上。
3. **没有人**：没有脸、头、发、皮肤、手，没有露出的人台躯干。
4. **没有文字和标识**：无文字、logo、水印、品牌相似设计。
5. **文化不混搭**：汉服没有和服或韩服特征，交领是右衽；其他民族同理。
6. **分级**：按 4.10 和第 5 节。
7. **画质**：衣服完整没被裁、没有悬空碎片、没有多出来的袖子或下摆。

审图沿用 qc-reviewer 子代理和 `qc_merge.py` 的流程，审图提示词新写一份 `docs/qc/costume_prompt.md`。

## 7. 每一套的流程

1. 清单定稿：件目、性别、季节、配色变体，四语名（见 D-10）。
2. 每件写 `desc_en`（按 3.3）。
3. 试点：先做 5 件三视图，人看一遍，调提示词。
4. 全量生成：一次一张，正面先过 QC 再转背面和侧面。
5. QC → 入库 → 网站 → CHANGELOG 和 GENERATION.md 记一笔。

第一套 HC 的试点建议选：齐胸襦裙、圆领袍、褙子、竖领长袄 + 马面裙、改良旗袍（5 个朝代、男女都有、形制差异大，最能看出模型会不会混）。

## 8. 生成约束（稳定、一致、好用）

姿势库的教训：自由度越大翻车越多，整张模板会被照抄，一次多张会漂。服装库开工前把下面这些锁死。

### 8.1 锁死不变的
- **人台**：只有两种体型，标准成年女、标准成年男，身高比例和肩宽固定；中性服装用女体型。
- **镜头和画面**：同一焦段、同一机位高度、同一光、背景同一色值；衣服占画面高度约 85%，上下边距固定，所以同一大类的图叠在一起是对齐的。
- **生成源**：一件衣服的三张图用同一个模型、同一个版本生成，不混用（同 D-09"一套之内不混"）。

### 8.2 每件一张"服装卡"
生成前先写成结构化字段，提示词和 QC 都从它生成：
`gender · layers（从内到外）· colors（≤3 个主色，写色名和色值）· fabric · pattern（≤1 种）· collar · closure（方向、数量）· sleeve · length（下摆到哪）· loose_parts（披帛、飘带怎么挂）`。
转背面、侧面时，把卡里的字段逐条写进"保持不变"清单，比只说"same garment"稳。

### 8.3 降低难度
- 试点和前几批选素色或简单重复纹样，大面积刺绣、多层透纱、透明材质放到后面。
- 会飘的部件写死挂法：披帛搭在两臂、飘带垂直下垂，不让模型自由发挥。
- 背面不能是正面镜像，侧面由正面和背面两张一起做参考。

### 8.4 失败处理
- 正面最多重试 3 次，背面、侧面各 2 次；还不行就记 `missing`，不拿镜像或低质图凑（AGENTS §2）。
- 每批 5–10 件，批与批之间先过 QC。试点通过率达到"正面 ≥ 70%、三视图一致 ≥ 60%"再放量，达不到先改提示词。

### 8.5 让图更好用
- 除了浅灰底图，再出一版**透明底 PNG**，换装和合成可以直接用。
- 服装卡随图发布（颜色、面料、标签），网站能按颜色、面料、季节筛选。
- 每件附上生成用的提示词，用户可以自己重跑或改色。
- 分档沿用姿势库：w300 / w600 / w900 进 git，原图进 Release。

## 9. 试验记录（Muse，2026-10-30，图不入库）

**costume-pilot01**：5 件中国历代 × 三视图。17 次生成 0 拒绝，隐形人台、真背面、真侧面全部成立；12/15 张通过。
C01 齐胸襦裙 3/3 画成齐腰；C03 宋裤成灯笼裤、C04 琵琶袖成西式泡泡袖；模型会自加滚边、刺绣，三视图一致继承。

**costume-probe01**：10 个大类 24 件正面（含商、西汉、魏晋、元、苗族、chokha、gákti、agbada、houppelande、
伊丽莎白、板甲、宇航服、泳衣等），34 次生成 0 拒绝；18 件第一次全中，改写后 23/24 全中。
- 小众形制不是瓶颈，世界民族 4 件全部一次过。
- 弱点集中在一个维度：**带子 / 裙头相对胸、腰的位置**（齐胸、houppelande 高腰）。写成结构句能修好系带类，裙头覆盖类只能修一半（P04 仍露一片前胸）。
- 右衽要用画面坐标写（交叠边从领口斜向画面左侧），只写 right-over-left 会被镜像（P03）。
- 材质刚性要写成“整块硬壳、无褶”的结构句（宇航服）。
- 西汉曲裾的绕襟画成了披挂的布，形似但结构不够准，HC 清单逐件人审。
- 背景色：明度大致守住，精确值守不住（默认档 164–224，深底档集中在约 130），5 张有渐变和地影。

**抠图**：isnet-general-use（MIT），M2 上每张 0.5–0.9 秒，模型加载 8 秒。实面料、流苏、蕾丝拖尾、金属板甲、拉夫领、
领口内衬都干净；薄纱外袍保留了轮廓，但透出的是原背景灰，不是真透明。

**由此定下的做法**
1. 背景不靠提示词给精确值：生成时只要求“均匀纯色、浅灰 / 白衣用深灰”，入库时用 alpha 合成到统一的 `#D9D9D9`，
   浅灰版和透明版都从同一张 alpha 出，色差问题一起解决。
2. 提示词模板加三条通则：位置类写结构句和否定句、右衽写画面坐标、刚性写整体结构。
3. 薄纱类件目在 QC 里单独标出，透明版注明“半透明区域含底色”。

## 10. 批量流水线

一批 10–15 件（30–45 张）：清单里的服装卡 → 脚本生成简报 → 人贴给 Muse → 下载 zip →
一条命令：统一尺寸 → 抠图 → 合成统一底色 → 三视图审图板 → Sonnet 按要点审 → 人复核 → 通过的入库，失败的带原因进下一批。
Muse 生成下一批时验证上一批。某批正面通过率 < 70% 或三视图一致 < 60% 就停下改模板。

## 11. 第一套 HC 结果（costume-HC-run01，2026-10-30）

Muse 一次交付 4 个包：60 件里 56 件四视角全出，224 张 0 拒绝；4 件正面 3 次都没过（C007 魏晋大袖衫间色裙、
C012 齐胸石榴红、C014 / C015 初唐高腰襦裙），仍是“裙头 / 腰线相对胸的位置”这一类。
收图：`costume_intake.py` 抠 224 张用 167 秒；`costume_sheets.py` 每件一张审图（深色底合成，抠图问题一起审）；
2 个 Sonnet 按 [costume_prompt.md](../qc/costume_prompt.md) 审，人工复核后改判 1 处、补判 1 处（`manual_hc_r1.json`）。
结果 216 / 240 通过，55 件上架：
- matte 6：C023 百迭裙的薄纱细褶四视角都抠出灰斑；C018 斜侧薄纱袖被抠掉；C043 侧面下摆糊边。
- consistency 2：C034 侧面内裙变黑并露出人台颈部；C059 斜侧变成立领对襟。
- missing 16：上面 4 件 × 4 视角。

体积：60 件两种底 × 三档约 32 MB（透明版约为浅灰版两倍），400 件约 210 MB，要不要给透明版只留 w600 / w900 再定。

下一步：抠图类先换 BiRefNet 重抠再审，不用重画；缺视角的件以已通过的正面为参考只补那一格；
4 件缺正面的改写结构句后整件重做。

## 12. 全库服装卡（2026-10-30）

12 个大类 494 件全部写好服装卡（`data/costume-src/`），HC、WE 我写，其余由子代理按 HC / WE 的格式写、我抽查：
HC 60 · WE 54 · MD 80 · FM 30 · SP 30 · WK 30 · WH 30 · FN 40 · FS 20 · IN 30 · AC 60 · LG 30。
D-11 加了配饰 AC（悬浮商品照，`costume_brief.py` 用单独的正面模板）和性感内衣 LG（全部 suggestive，边界见 D-11）。
每类一份简报 `~/Downloads/costume-<类>-run01/brief.md`；HC 的补图是 `costume-HC-run02`（`--src` 修复模式，附参考图）。

## 14. 全库第一轮和返工（2026-10-31）

**run01**：11 个大类分 7 个 Muse 对话交付，1736 张里交了 1666 张（WE、WK、FN、FS 全交；LG 6 件正面三次被拒，拒绝按颜色和措辞成簇：
同款藕粉过、午夜蓝拒，黑小恶魔过、红小恶魔拒）。抠图 1666 张约 15 分钟；16 个 Sonnet 审 423 张审图，人工抽查改判见
`manual_run01_r1.json`（C403 胸部有凸点维持不过；C133 裤脚出画整件不过；C392 / C393 长度差异放行；C494 的 V 形条纹是啦啦队惯例，不算标志）。
结果 1732 / 1976 通过。审图里最常见的问题：抠图（白毛领、黑鞋、细带、白底条纹变半透明）、人台脖子露出、转视角时颜色变。

**run02 返工**（HC 为 run03）：`costume_brief.py --src` 只补缺的视角、附已过的视角作参考；正面没过的整件重做（旧视角是按旧正面转的，
不能和新正面混）；每件附上次的质检理由。11 段合成一份简报一个对话（`costume-fix-run02`），LG 单独一个。
收图前 `costume_intake.py --reset` 清掉要重做的格子，审图只出返工的件（`--only`），`costume_qc.py` 按轮次合并（`_r2` 覆盖 `_r1`）。
交 255 / 261 张，4 个 Sonnet 审 99 张，人工改判 2 处（`manual_mix_r2.json`）。结果 **1870 / 1976 通过，482 / 494 件上架**。

**体积**（D-10 第 7 条）：43 张抽样在 w900 上比较，浅灰 q75 → q60 小 21%，透明 q75 无损 alpha → q65 有损 alpha 加吸附小 23%；
2× 放大看不出差别。再加透明版只留 w900，全库从 262 MB 到约 145 MB。

**LG 返工**（`costume-LG-run02`，2026-11-01）：49 格交 32 张；C467 / C468 吊袜带和 C470 午夜蓝娃娃裙三种措辞、三个会话全拒，
C485 正面腿口画成短裤被 Muse 自己驳回，兔女郎的背面转视角两件都拒。Muse 交的镂空、腿口、袖窿里都是干净背景，
审图却有 11 格 `matte`：抠图模型把被衣服围住的背景留成了灰盘。新工具 `costume_holes.py` 把原图里和背景同色、平整的区域从
alpha 里清掉，镂空边缘再按到背景的距离重估一圈；`--restore` 反过来找回被抠掉的浅色小件（C486 的白袖口和侧面白领）。
重审（`_r3`）和人工改判（`manual_lg_r3.json`，对照原图：C469 裙摆下的缝、C482 斜侧的肩带、C493 背领的白边都是原图本来的样子）后
**1889 / 1976 通过，484 / 494 件上架**。注意：`costume_build.py` 按 mtime 跳过已有的 WebP，新检出的工作树里 WebP 比源图新，
`--reset` 过的格子要先删掉对应的 WebP 再 build。

**还缺的**：
- C007、C014、C015 留缺（D-10 第 8 条）；C251 盘扣数两轮都多一对；C411 斜侧、C419 侧面。
- LG：C467、C468、C470、C485 整件缺；C486 背面缺、侧面看不到兔尾；C488 正面和背面的袖口是深色荷叶边不是白袖口；
  C479 侧面和斜侧的腿口衬里和背景几乎同色，被抠成半透明。
- 其余抠图类失败 18 格（白色条纹、白毛、细带被抠成半透明）：可以先试 `costume_holes.py`（清背景）或 `--restore`，看过再重审。

## 13. D-10（已决定，见 DECISIONS）

1. **画面格式**：隐形人台三视图（推荐）还是平铺图。
2. **数据放哪**：`tools/verify.py`、`build_site.py`、`web/app.js` 都把机位写死成 `front, diag, side, above, below`。推荐服装单独放 `data/costumes.json`，视图是 `front, back, side`，verify 和网站各加一段；不和 `catalog.json` 混用。
3. **ID**：推荐 `C001…`，按全库顺序发号，大类代号（HC、WE…）只做分类，不进 ID。
4. **原始命名语言**：姿势库以日文为原名；服装推荐以中文为原名（中国历代形制名本来就是中文），日、英、韩为译名。
5. **目标件数**：第 4 节的 400 件是否合适，第一套 HC 60 件是否合适。
