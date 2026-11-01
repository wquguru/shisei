# furniture run01：审图子代理放行但拿不准的格子

人工复核时先看这些。改判写 `manual_furniture_r1.json`（格式同 fail 文件，status 填 pass 即放行），再跑 `series_qc.py furniture` 和 `series_build.py`，不要手改 `furniture-qc.json`。

- F026 鼓墩顶沿有模糊刻纹，不可读，没判文字。
- F004 藤编扶手的洞如果本来就是镂空，只有坐垫颜色算问题。
- F009 背面头枕和正面在同一侧，像镜像，没判背面。
- F011 吊篮椅坐垫白、深灰各占一半，按“白色”判多数为错，要人看哪个对。
- F016 侧面秋千座板像是倾斜（把握低）。F032 正面 scale 把握低。F029 侧面缺一侧栏杆，也可算 consistency。
- 所有 scale 都是按画面量的长宽比判的，要人确认。
