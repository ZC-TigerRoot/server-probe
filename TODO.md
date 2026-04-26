# Server Probe 功能扩展计划

## 已完成 ✓

### 2. 历史数据与趋势图表
- [x] 添加 SQLite 数据库存储，每 10 秒保存一次监控数据
- [x] 修改后端定期存储数据点（每10秒）
- [x] 添加 API 接口获取历史数据 (`/api/history`)
- [x] 前端集成 Chart.js 显示趋势图表（CPU/内存/网络）
- [x] 空数据时显示友好提示

### 5. 进程管理
- [x] 后端添加进程列表 API (`/api/processes`)
- [x] 后端添加结束进程接口（带权限检查）(`/api/processes/{pid}/kill`)
- [x] 前端添加进程列表页面，支持查看 Top 50 进程
- [x] 支持按 CPU 使用率排序，显示进程状态
- [x] 修复进程 API 的 None 值 bug
- [x] 每 3 秒自动刷新进程列表（无闪烁）

### 6. Docker 支持
- [x] 编写 Dockerfile（基于 Python 3.11 slim）
- [x] 编写 docker-compose.yml（包含数据卷和时区设置）
- [x] 添加 .dockerignore

### 8. 移动端适配
- [x] 优化 CSS 响应式布局（768px 和 480px 断点）
- [x] 适配小屏幕显示（Tab 导航、卡片网格、表格）
- [x] 优化触摸交互（-webkit-overflow-scrolling）

## 测试通过
- ✓ 主页正常加载
- ✓ WebSocket 实时数据推送
- ✓ 进程列表 API 正常返回数据
- ✓ 进程自动刷新（每3秒）
- ✓ 历史数据 API 正常
- ✓ 空图表显示友好提示

## 运行命令

```bash
# 本地运行
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000

# Docker 运行
docker-compose up -d

# 访问
open http://localhost:8000