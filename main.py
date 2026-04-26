import asyncio
import time
from datetime import timedelta

import psutil
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

from database import init_db, save_metrics, get_history, cleanup_old_data

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# 初始化数据库
init_db()


@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.get("/api/history")
async def history(minutes: int = 60):
    """获取历史监控数据"""
    return get_history(minutes)


@app.get("/api/processes")
async def processes():
    """获取进程列表"""
    procs = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
        try:
            info = proc.info
            cpu = info['cpu_percent'] if info['cpu_percent'] is not None else 0.0
            procs.append({
                "pid": info['pid'],
                "name": info['name'],
                "cpu": cpu,
                "memory": round(info['memory_percent'], 1) if info['memory_percent'] else 0,
                "status": info['status']
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    # 按 CPU 使用率排序
    procs.sort(key=lambda x: x['cpu'], reverse=True)
    return procs[:50]  # 返回前 50 个进程


@app.post("/api/processes/{pid}/kill")
async def kill_process(pid: int):
    """结束进程"""
    try:
        proc = psutil.Process(pid)
        proc.terminate()
        return {"success": True, "message": f"进程 {pid} 已终止"}
    except psutil.NoSuchProcess:
        return {"success": False, "message": "进程不存在"}
    except psutil.AccessDenied:
        return {"success": False, "message": "权限不足，无法结束该进程"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    last_net = psutil.net_io_counters()
    last_time = time.time()
    
    # 用于控制数据保存频率
    save_counter = 0

    try:
        while True:
            await asyncio.sleep(1)

            cpu = psutil.cpu_percent(interval=None)
            mem = psutil.virtual_memory().percent
            disk = psutil.disk_usage("/").percent

            net = psutil.net_io_counters()
            now = time.time()
            elapsed = now - last_time
            sent_speed = (net.bytes_sent - last_net.bytes_sent) / elapsed
            recv_speed = (net.bytes_recv - last_net.bytes_recv) / elapsed
            last_net = net
            last_time = now

            uptime_seconds = int(time.time() - psutil.boot_time())
            uptime = str(timedelta(seconds=uptime_seconds))

            try:
                load1, load5, load15 = psutil.getloadavg()
                load_avg = {"1m": round(load1, 2), "5m": round(load5, 2), "15m": round(load15, 2)}
            except (AttributeError, OSError):
                load_avg = None

            data = {
                "cpu": round(cpu, 1),
                "memory": round(mem, 1),
                "disk": round(disk, 1),
                "sent_speed": round(sent_speed, 1),
                "recv_speed": round(recv_speed, 1),
                "uptime": uptime,
                "load_avg": load_avg,
            }
            await websocket.send_json(data)
            
            # 每 10 秒保存一次数据到数据库
            save_counter += 1
            if save_counter >= 10:
                save_metrics(data)
                save_counter = 0
                
                # 每小时清理一次旧数据
                if save_counter == 0 and int(now) % 3600 < 10:
                    cleanup_old_data()
    except WebSocketDisconnect:
        pass