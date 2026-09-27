# 消耗统计与人效管理 Mock API

版本：V1.0 评审稿｜关联：[PRD](PRD.md)｜[设计规范](DESIGN.md)

以下接口路径、参数、分页和快照机制均为**建议契约**，尚未在当前纯前端原型中实现。业务口径以 PRD 待确认清单的决议为准。本文 fixture 独立用于联调，不增加生产运行页面的三个示例。

## 1. 公共约定

- 所有查询由服务端验证项目权限；不得仅信任传入的人员或项目 ID。
- 时间传输使用带时区 ISO 8601；展示使用 Asia/Shanghai。
- 快捷筛选固定查询时刻 `asOf`：当前从当天零点到 asOf，近七天从 asOf 减 168 小时到 asOf，本月从一日零点到 asOf。
- 自定义日期范围建议转换为 `[开始日零点, 结束日次日零点)`，避免遗漏最后一秒的毫秒记录。下面快捷 fixture 的终点按 `asOf` 包含。
- 汇总和下钻共享 `snapshotId`、解析后的起止时间和全部筛选。快照过期时明确提示重新查询，不静默混用不同快照。
- `null` 表示不可计算或不适用，不等于 0。结果数、比例与金额不能互相替代。
- 空筛选 ID 表示全部；`dimension` 只供人效接口使用。

建议接口：

| 方法和路径 | 用途 |
|---|---|
| POST `/api/projects/{projectId}/statistics/consumption/query` | 调用卡片、周期汇总、人员汇总 |
| POST `/api/projects/{projectId}/statistics/calls/query` | 当前筛选调用明细及人员／状态下钻 |
| POST `/api/projects/{projectId}/statistics/efficiency/query` | 任务或流水维度人员汇总 |
| POST `/api/projects/{projectId}/statistics/efficiency/details/query` | 总量、进行中、完成、完成率、作品明细 |

## 2. 消耗统计查询

示例请求。客户端可传 preset，服务端生成统一查询时刻并返回解析结果；`asOf` 在 Mock 中固定，生产环境不允许通过它绕过权限或读取未来状态。

```json
{
  "preset": "current",
  "timezone": "Asia/Shanghai",
  "asOf": "2026-09-27T15:30:00+08:00",
  "personId": null,
  "planId": null,
  "apiId": null
}
```

响应：

```json
{
  "snapshotId": "stats-demo-20260927-153000",
  "asOf": "2026-09-27T15:30:00+08:00",
  "resolvedRange": {
    "start": "2026-09-27T00:00:00+08:00",
    "end": "2026-09-27T15:30:00+08:00",
    "endInclusive": true
  },
  "summary": {"total": 6, "success": 4, "failed": 1, "running": 1},
  "periods": [
    {"date": "2026-09-27", "total": 6, "success": 4, "failed": 1, "running": 1}
  ],
  "people": [
    {"personId": "u-zhang", "name": "张三", "total": 4, "apiDistribution": [{"apiId": "lyrics", "name": "歌词生成", "count": 2}, {"apiId": "music", "name": "音频生成", "count": 2}]},
    {"personId": "u-li", "name": "李四", "total": 2, "apiDistribution": [{"apiId": "lyrics", "name": "歌词生成", "count": 1}, {"apiId": "music", "name": "音频生成", "count": 1}]}
  ]
}
```

周期示例使用当前原型的按日展示，不添加日／周／月下拉框。若 Q08 确认需要其他汇总粒度，再扩展契约和设计。

## 3. 调用明细

请求复用原筛选及 snapshotId，另可传 `result` 或点击的 `personId`。翻页使用 `cursor`，建议默认每页 20 条。接口必须返回稳定排序；编号相同时只展示一个实际请求，状态回调更新该请求。

下面六条 fixture 共用：`projectId=p-demo`、`planId=plan-a`、`workflowId=wf-music`、`workflowVersion=v3`，所有时间为北京时间 2026-09-27。`req-002` 失败后重新发出了 `req-003`，属于两次实际调用；重复发送 req-003 的成功回调不会变成第三次调用。

| 请求编号 | 人员 | 接口 | 开始／结束 | 结果 | 运行编号 | 来源节点 | 重试来源 |
|---|---|---|---|---|---|---|---|
| req-001 | 张三 | 歌词生成 | 09:00:00／09:00:10 | 成功 | FLOW2026092700001 | 歌词生成节点 | — |
| req-002 | 张三 | 音频生成 | 09:10:00／09:10:30 | 失败 | FLOW2026092700001 | 音频生成节点 | — |
| req-003 | 张三 | 音频生成 | 09:11:00／09:12:00 | 成功 | FLOW2026092700001 | 音频生成节点 | req-002 |
| req-004 | 张三 | 歌词生成 | 10:00:00／10:00:10 | 成功 | FLOW2026092700002 | 歌词生成节点 | — |
| req-005 | 李四 | 歌词生成 | 11:00:00／11:00:10 | 成功 | FLOW2026092700003 | 歌词生成节点 | — |
| req-006 | 李四 | 音频生成 | 15:29:00／— | 执行中 | FLOW2026092700003 | 音频生成节点 | — |

单条记录结构：

```json
{
  "requestId": "req-003",
  "retryOfRequestId": "req-002",
  "projectId": "p-demo",
  "planId": "plan-a",
  "apiId": "music",
  "apiName": "音频生成",
  "personId": "u-zhang",
  "personName": "张三",
  "startedAt": "2026-09-27T09:11:00+08:00",
  "endedAt": "2026-09-27T09:12:00+08:00",
  "result": "success",
  "workflowId": "wf-music",
  "workflowName": "音乐内容生产",
  "workflowVersion": "v3",
  "runId": "run-001",
  "runNumber": "FLOW2026092700001",
  "nodeId": "node-music",
  "nodeName": "音频生成节点"
}
```

请求状态合并建议：先按唯一 requestId 合并有序状态事件，再筛选和聚合；不能只保留第一个回调而丢失后续成功结果。超时／取消等如何映射到三种展示状态见 Q07，未确认时不能擅自归类。

## 4. 人效统计查询与示例

示例采用**待确认方案**：统计期内分配任务为同一批次，总量包含示例终止任务；完成量取截至期末完成，进行中取该批次在 asOf 时仍进行中。该示例仅演示当前时间查询，不能解决历史期末与当前状态的差异，需落实 Q01–Q06。

张三任务 `T01–T10`：T01–T06 完成，T07–T09 进行中，T10 终止；李四任务 `T11–T15`：T11–T14 完成，T15 进行中。所有任务分配于当天。张三当天成功组合保存 W01、W02，李四保存 W03；后续改名不增加作品记录。

请求在公共筛选中增加 `dimension: "task"`。响应中的口径 ID 用于审计建议，前端无需向普通用户显示实现编号：

```json
{
  "snapshotId": "stats-demo-20260927-153000",
  "asOf": "2026-09-27T15:30:00+08:00",
  "dimension": "task",
  "policyId": "DRAFT-assigned-cohort",
  "policyConfirmed": false,
  "people": [
    {"personId": "u-zhang", "name": "张三", "total": 10, "runningCurrent": 3, "completed": 6, "completionRate": {"numerator": 6, "denominator": 10, "value": 0.6}, "createdWorks": 2, "paidApiCalls": 4},
    {"personId": "u-li", "name": "李四", "total": 5, "runningCurrent": 1, "completed": 4, "completionRate": {"numerator": 4, "denominator": 5, "value": 0.8}, "createdWorks": 1, "paidApiCalls": 2}
  ]
}
```

前端比例展示一位小数：60.0%、80.0%；分母为 0 时 value=null，展示「—（分母为 0）」。前端不能以 total-completed 推算 runningCurrent，因为还存在终止等状态。

接口筛选示例暂只用于调用列，任务和作品不随接口筛选改变；该方案必须先确认 Q05。流水维度没有已定口径，不提供虚构流水数量。联调中选择 `dimension: "run"` 暂返回：

```json
{
  "error": {
    "code": "STAT_POLICY_NOT_READY",
    "message": "流水统计口径待确认，暂不可用",
    "dimension": "run"
  }
}
```

正式上线前需实现已确认的流水口径，或明确可用范围；不可将上述临时返回视为功能验收完成。

## 5. 人效明细契约

请求：公共筛选＋snapshotId＋dimension＋personId＋metric＋cursor。metric 建议枚举 `total`、`runningCurrent`、`completed`、`completionRate`、`createdWorks`、`paidApiCalls`。

| metric | 返回内容 |
|---|---|
| total | 入选实体 ID、名称、分配时间、归属人员、状态、所属计划、运行编号 |
| runningCurrent | 同上，加状态快照时间，必须符合已确认的当前／期末口径 |
| completed | 实体信息、实际提交人、完成时间；归属方案先确认 |
| completionRate | numerator、denominator、可追溯的分子／分母实体清单与分页 |
| createdWorks | 作品编号、名称、创建人、保存时间、来源运行、所属计划 |
| paidApiCalls | 复用调用明细契约；不能单独生成不同的调用数据源 |

关闭明细不会改变原页面筛选。点击人员后增加该人员限定，返回时恢复用户进入明细前的上下文。

## 6. 错误与空值

| HTTP／业务码建议 | 含义 | 页面行为 |
|---|---|---|
| 200，空数组与零汇总 | 有权限但无记录 | 展示空态，不显示失败 |
| 400 / INVALID_DATE_RANGE | 日期顺序或格式错误 | 控件附近提示并保留条件 |
| 403 / FORBIDDEN | 无项目或明细权限 | 清除不应显示的数据，展示无权限 |
| 409 / SNAPSHOT_EXPIRED | 快照过期 | 提示重新查询 |
| 422 / STAT_POLICY_NOT_READY | 维度口径未就绪 | 展示不可用状态，不显示假数 |
| 500 / QUERY_FAILED | 服务端失败 | 失败提示和重试入口 |

## 7. 联调校验

1. 六个唯一请求：总量 6＝成功 4＋失败 1＋执行中 1；人员总量 4＋2＝6。
2. 张三接口分布 2＋2＝4；两页张三 paidApiCalls 均为 4。
3. 多次回调 req-003 不新增请求；重试 req-003 与 req-002 分别计数。
4. 人效张三 6÷10＝60.0%，进行中为 3，终止任务不是进行中任务。
5. 三个作品成功保存后总数为 3，改名及重复回调不得再增加。
6. 近七天的解析起点为 2026-09-20 15:30:00+08:00；本月为 2026-09-01 00:00:00+08:00。
7. 自定义整日终点使用次日零点排除边界；统一快照验证汇总与分页明细一致。
8. dimension=run 未就绪时按错误契约展示，不能照抄任务数据。
