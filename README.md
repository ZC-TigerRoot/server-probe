# Server Probe

一个轻量级服务器实时监控探针，基于 Python FastAPI + psutil + 原生 WebSocket 实现。前端采用纯 HTML/CSS/JavaScript，无需任何构建工具，部署即运行。

## 功能特性

- **实时 CPU 使用率**
- **实时内存使用率**
- **实时磁盘使用率**
- **实时网络上传/下载速度**
- **系统运行时间 (Uptime)**
- **Load Average**（Linux / macOS 支持）

数据通过 WebSocket 每 1 秒自动推送到前端页面，实现秒级刷新。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Python 3, FastAPI, uvicorn, psutil |
| 前端 | HTML5, CSS3, JavaScript (原生，无框架) |
| 通信 | WebSocket |

## 快速开始

### 1. 克隆项目

```bash
git clone <仓库地址>
cd server-probe
```

### 2. 安装依赖

```bash
pip3 install -r requirements.txt
```

### 3. 启动服务

```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 4. 访问面板

打开浏览器，访问 `http://localhost:8000`。

## 项目结构

```
server-probe/
├── main.py              # FastAPI 入口与 WebSocket 服务端
├── requirements.txt     # Python 依赖
├── static/
│   ├── css/
│   │   └── style.css    # 深色 Dashboard 样式
│   └── js/
│       └── dashboard.js # WebSocket 客户端与数据更新逻辑
└── templates/
    └── index.html       # 单页监控面板
```

## 部署说明

- 支持本机（macOS / Linux）及 Linux 服务器部署。
- 若需后台运行，建议使用 `systemd`、`supervisor` 或 `screen` / `tmux`。
- 默认监听 `0.0.0.0:8000`，如需修改端口或绑定地址，请调整 `uvicorn` 启动参数。

## 注意事项

- 第一版为单服务器 MVP，暂不支持多机 Agent 模式。
- 暂未实现用户认证，建议在内网或受信任环境中使用。
- 网络速度为**瞬时速率**，基于两次采样的字节差值计算。

## 许可证

MIT
