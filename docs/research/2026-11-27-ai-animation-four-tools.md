# 同一句需求，让 Claude 分别用 Python、Motion Canvas、Three.js 和 Blender 做动画

2026-11-27。起因是 Mimo（[@aura_uniiiii](https://x.com/aura_uniiiii/status/2126107363191234774)）发的四栏对比视频：同一个纸飞机、山坡、风车的场景，用 Claude 分别在四种工具里做出来，质感差别很大（素材库条目 `/inspiration/x-aura_uniiiii-234774`）。她的帖子里没有给出提示词，所以我们自己用一句同样的需求跑了一遍，看差别有多少来自工具、多少来自写法。成品用在指南 `/guides/choose-a-tool-for-ai-animation`。

## 环境

- Mac mini（M2，8 GB 内存），macOS 26.5.1。
- Claude Code 2.1.331，模型 `claude-opus-5-5`，无头运行：`claude -p "<需求>" --setting-sources project,local --dangerously-skip-permissions --output-format stream-json --verbose`。`--setting-sources project,local` 让它不读本机全局的技能和 CLAUDE.md，每个工具在一个只有依赖的空目录里跑。
- 依赖事先装好，不算进 Agent 的时间：Python 3.12 venv（numpy 2.5.5、matplotlib 3.11.2、Pillow 13.0.0）；Motion Canvas 3.17.2（core、2d、ui、vite-plugin、ffmpeg）+ vite 5.4.11；three 0.180.0；playwright-core 1.56.0，配本机的 Google Chrome；Blender 5.3.0（官方 dmg 解压到目录里，`-b` 无头可用，sha256 与 Homebrew cask 一致）；Homebrew 的 ffmpeg。
- 所有东西装在仓库外的临时目录，没有进仓库。

## 需求原文

四个工具共用一句，只换括号里那一段：

```
Make a 4-second animation, 960x540, 24 fps: a paper plane flies across the frame from left to right over rolling green hills, two or three clouds drift slowly, and a windmill on one of the hills turns its blades. Build it with TOOL and render it to out.mp4 in this directory (ffmpeg is installed). Work only inside this directory. Do not ask me questions; make reasonable choices. When you finish, list the commands that render it.
```

- Python：`Python (the .venv here has numpy, matplotlib and Pillow; draw the frames yourself)`
- Motion Canvas：`Motion Canvas (its packages are already in node_modules; Google Chrome is in /Applications and playwright-core is installed if you need to drive a browser)`
- Three.js：`Three.js (three is already in node_modules; Google Chrome is in /Applications and playwright-core is installed if you need to drive a browser)`
- Blender：`Blender, scripted with its Python API (bpy) and run headless (Blender is at ./Blender.app/Contents/MacOS/Blender)`

第二轮在 Python 和 Three.js 的需求后面加了一段风格要求：

```
Style: paper-cut collage. Every shape is a flat piece of cut paper with a slightly irregular edge, a soft drop shadow underneath and a faint paper grain; no gradients and no glossy shading. Palette: sage and moss greens, cream, warm terracotta, faded sky blue. Motion is stepped like stop-motion: hold each drawing for two frames (12 drawings per second) and let the plane wobble a little.
```

## 结果（第二轮，每次只跑一个或两个，成品保留）

| 工具 | Agent 用时 | 轮次 | 只跑渲染命令 | 渲染方式 |
|---|---|---|---|---|
| Python（Pillow） | 91 秒 | 6 | 4.7 秒 | 两倍尺寸画每帧再缩小，直接管道给 ffmpeg |
| Motion Canvas | 286 秒 | 14 | 6.9 秒，另加 ffmpeg 合成 | 启动编辑器，用 playwright 在无头 Chrome 里点 Render 按钮，再把 PNG 序列合成 |
| Three.js | 197 秒 | 21 | 5.1 秒 | 本地服务器 + 无头 Chrome（Metal），逐帧读出画布，管道给 ffmpeg |
| Blender（bpy） | 218 秒 | 12 | 59 秒 | EEVEE，32 采样，写 PNG 再合成 |
| Python + 风格段落 | 381 秒 | 9 | 约 80 秒（它自己报的） | 同上，另写 96 张 PNG |
| Three.js + 风格段落 | 237 秒 | 13 | 约 40 秒（它自己报的） | 1920×1080 渲染再缩小 |

“Agent 用时”是 CLI 结果里的 `duration_ms`；“只跑渲染命令”是全部跑完后，机器空闲时我们按它给出的命令再跑一次的耗时（`/usr/bin/time`）。CLI 报的费用在 0.30 到 0.70 美元之间。四个成品都是 960×540、24 fps、96 帧（ffprobe 核对过）。

### 看起来

- Python：扁平矢量插画，天空渐变、三层绿色山坡、白云、白色纸飞机拖一串虚线。像幻灯片里的剪贴画。
- Motion Canvas：几乎同一种扁平插画，多了描边和一个太阳；云的底边是被切平的。没有用 Motion Canvas 擅长的缓动和分段动画，整段只有一个 `linear` 的时钟。
- Three.js：有光照和投影的低多边形 3D，远处山坡带雾，自己加了几十棵树和飞机在地上的影子（需求里没写）。
- Blender：柔和的玩具感 3D，云在山坡上投下影子；山坡像压扁的圆团，纸飞机远看是一个白色三角片。不是电影感，Mimo 视频里那种厚云密草需要更多的建模和渲染时间（她说 Blender 每次迭代要等三四十分钟）。
- 加了风格段落后：Python 和 Three.js 都做成了剪纸拼贴，颜色、纸纹、软阴影、每两帧换一张画都有；Three.js 放弃了光照，做成平面纸片（用五层半透明副本叠出阴影）。两段放在一起比没加风格时的 Python 与 Three.js 更像。

### 动起来

四个版本的运动都由一个匀速时钟加正弦波驱动：飞机匀速横穿、上下起伏、按路径倾斜，风车匀速转，云匀速飘。没有起步、减速或弹性，需求里没要，它就没加，四种工具都一样。

### 过程中的坑

- Motion Canvas 没有无头渲染命令，只能在编辑器里点 Render。Agent 去读 `@motion-canvas/ui` 的打包文件找按钮，再用 playwright 自动点；第一次渐变写法不对，改用 `Gradient` 类；它输出 98 帧（0 到 97），用 `-frames:v 96` 截成 4 秒。
- Three.js 需要一个浏览器来渲染，走哪条图形路径差很多：第一轮 Agent 选了 SwiftShader 软件渲染，整次用了约 16 分钟；第二轮用 Metal，渲染 5 秒。
- Blender 渲染最慢，也最吃机器。第一轮它和别的任务同时跑，EEVEE 每帧 6.5 到 33 秒，96 帧约 19 分钟；Agent 把整段渲染放到后台、说“完成后再看”，就给出了最后的回复，没有等渲染跑完（见下）。
- Python 最快、最可预期；第一次 Agent 在最后一次放大飞机后没有再看成品帧，它自己在总结里说了。

## 第一轮（文件丢失，只有当时记下的数字）

第一轮四个工具两两并行，机器上同时还有别的会话在跑浏览器测试。外层脚本设了 30 分钟上限：

- Python 150 秒、6 轮；Three.js 946 秒、9 轮（SwiftShader）；风格与第二轮相同。
- Blender：Agent 1311 秒后把整段渲染放到后台，外层上限到了，渲染停在第 14 帧；我们按它给的命令补跑，用了 1121 秒。
- Motion Canvas：30 分钟里一直在读源码、找无头渲染的办法，没有产出 out.mp4；续跑那一次随后因为机器重启中断。
- 重启清空了临时目录，第一轮的成品、日志都没了，所以第二轮在仓库外的固定目录重跑，并改成一次只跑一个渲染任务。

## 结论

- 不写风格时，工具决定默认的样子：两种 2D 工具都给出扁平剪贴画，两种 3D 工具给出有光照的 3D。
- 写了风格时，写法压过工具：同一段剪纸要求让 Python 和 Three.js 的结果几乎一样。
- 运动感不来自工具，四种都是匀速；要缓动、停顿、弹性，得写出来。
- 工具真正决定的是成本和能做什么：Blender 渲染慢一个数量级，Three.js 和 Motion Canvas 要靠浏览器出片，Motion Canvas 无头出片最费周折。

## 没有验证的

- 每个工具每种写法只跑了一次（第一轮的数字可以看出波动不小），没有多次取平均。
- 只试了 Claude Code + Opus 5.5，没有试 Codex 或别的模型。
- 没有试 manim、Remotion，也没有试 Blender 的 Cycles。
- 没有找人盲评哪一段更好看。
