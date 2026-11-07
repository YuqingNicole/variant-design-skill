# 定位与可用性：决策记录

状态：已完成。README、官网定位文案、GitHub 公开元数据已对齐；价格页保留为未开放的提案；Impeccable 来源与许可证继续完整披露。

## 决策

1. **README 与仓库定位（已完成）**：README、README_CN.md 与官网定位均以本地开源技能和设计灵感目录为准，不再声称技能受 Variant 设计社区启发。2026-11-07 已将 GitHub description 更新为 `github-metadata.json` 的候选值，homepage 指向官网，并保留原有 topics、添加 agent-skills、codex、design-system。
2. **价格页保留计划，明确未开放（已决定）**：双语标题说明本地开源可用、托管仍是提案。Pro/Team 各自标明“计划中”“报价草案”和“拟提供功能”，讨论链接只指向 GitHub 编辑器。原有数字保留为可讨论草案，不代表报价已确认。FAQ、README、预渲染描述与 llms.txt 同步，不再把它称为“早期访问”。没有结账或已开放的托管额度。
3. **保留并披露 Impeccable 引用（已决定）**：七份原文、来源注释、完整 Apache-2.0 和 NOTICE 均保留。暂不改写，也不联系作者；发布时继续按现有材料披露来源与许可。

## 本轮实际核对

- 2026-11-04，公开 `/api/status` 的只读 GET 返回 `{"configured":false}`；没有发起生成请求。这只说明当次公开状态，不证明未来部署或其他环境。
- 代码中的付费按钮指向 `/issues/new`，没有结账。原文已说暂不扣款，但“早期访问”、托管额度与云端功能仍像可以开通；修正的是可用性表述，不是停止一项已经存在的收费服务。
- GitHub 公开仓库元数据已按 `github-metadata.json` 更新并核对；description 不再包含社区启发表述，homepage 指向官网。当前 topics 包含原有六项及 `agent-skills`、`codex`、`design-system`。
- `NOTICE` 列出的七个文件与源码来源注释保留；源码授权不能代替对其他服务条款的判断。

## 老 README PR #2

核对了实际 diff `7d6e70e`：框架格式的补充与当前 `skills/shared/code-output.md`、`frameworks.md` 相符，有参考价值。此分支把对应说明整理为双语表格，并补充“生成格式不等于预览、接入已经验证”的边界。没有直接套用“把文件移进源码即可”的描述；接入仍需目标基准、备份和回滚。

没有为 Vue/Astro/Svelte 或原生 Next 补跑真实适配矩阵，因此不新增运行验收承诺。PR #2 暂保留开放；此文案合并后再由维护者决定关闭为已吸收，或要求其重写，未发送评论或审查意见。

## 完成记录

- 价格方向：保留计划卡片，并明确标为未开放提案；不提供购买入口或承诺开通。
- Impeccable 材料：保留七份原文及现有 Apache-2.0、NOTICE 和来源说明；不联系作者。
