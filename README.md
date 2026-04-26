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
python3 -m pip install -r requirements.txt
```

### 3. 启动服务

```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 常见问题：`/bin/python3: No module named uvicorn`

如果你在启动时看到这个报错，说明当前 Python 环境还没有安装项目依赖，或者安装到了别的解释器环境里。按下面顺序执行即可：

```bash
# 可选：先确认当前解释器
which python3
python3 --version

# 使用同一个解释器安装依赖
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt

# 再次启动
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 宝塔（BT）面板部署专项排查

如果你使用的是宝塔 Python 项目，出现该报错通常是以下两类问题：

1. **启动命令中的参数横线被替换成了中文长横线**（`—`），应使用英文双短横线（`--`）。
2. **宝塔所选 Python 环境和实际安装依赖的环境不一致**（尤其是“启动用户”为 `www` 时）。

建议在宝塔里这样配置：

```bash
# 推荐：使用当前 Python 环境的解释器直接启动
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

并在宝塔终端（或 SSH）里，用同一个解释器执行：

```bash
python3 -m pip install --upgrade pip
python3 -m pip install -r /www/wwwroot/Server_Probe/server-probe/requirements.txt
python3 -m pip show uvicorn
```

如果 `python3 -m pip show uvicorn` **没有任何输出**，就表示当前解释器环境里没有安装 `uvicorn`。此时请先安装：

```bash
python3 -m pip install -r /www/wwwroot/Server_Probe/server-probe/requirements.txt
python3 -m pip show uvicorn
```

若仍无输出，请到宝塔「环境管理」中确认你项目绑定的 Python 环境（例如 `pyenv`）并改为该环境的解释器绝对路径执行（示例）：

```bash
<PYTHON_ENV_PATH>/bin/python3 -m pip install -r /www/wwwroot/Server_Probe/server-probe/requirements.txt
<PYTHON_ENV_PATH>/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

如果你在宝塔里把“启动用户”设置为 `www`，请确保依赖也是在 `www` 用户可见的 Python 环境中安装；否则会出现 root 能导入、面板进程不能导入的问题。

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

### 宝塔外网映射 + HTTPS（推荐）

本项目包含 WebSocket（`/ws`），建议使用 **宝塔站点 + Nginx 反向代理 + SSL 证书** 的方式对外提供服务。

1. **先在服务器本机启动项目（内网端口）**

```bash
python3 -m uvicorn main:app --host 127.0.0.1 --port 8000
```

2. **在宝塔创建站点并绑定域名**
- 例如：`monitor.example.com`
- 域名 DNS A 记录指向你的服务器公网 IP

3. **在宝塔站点申请/部署 SSL 证书**
- 可用 Let's Encrypt
- 开启“强制 HTTPS”

4. **配置反向代理到 `127.0.0.1:8000`**
- 目标 URL：`http://127.0.0.1:8000`
- 必须开启 WebSocket 转发（或在 Nginx 配置中保留 Upgrade 头）

5. **Nginx 关键配置示例（宝塔站点配置）**

```nginx
location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

6. **放行安全组/防火墙端口**
- 对外仅开放 `80/443`
- `8000` 仅本机访问（不建议暴露公网）

7. **验证**
- 浏览器访问：`https://monitor.example.com`
- 打开开发者工具，确认 WebSocket 使用 `wss://monitor.example.com/ws`

## 注意事项

- 第一版为单服务器 MVP，暂不支持多机 Agent 模式。
- 暂未实现用户认证，建议在内网或受信任环境中使用。
- 网络速度为**瞬时速率**，基于两次采样的字节差值计算。

## 许可证

MIT
