import asyncio
import time
from datetime import timedelta

import psutil
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    last_net = psutil.net_io_counters()
    last_time = time.time()

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
    except WebSocketDisconnect:
        pass
