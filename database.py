import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path("monitoring.db")


def init_db():
    """初始化数据库"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            cpu REAL,
            memory REAL,
            disk REAL,
            sent_speed REAL,
            recv_speed REAL,
            load1m REAL,
            load5m REAL,
            load15m REAL
        )
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_timestamp ON metrics(timestamp)
    """)
    conn.commit()
    conn.close()


def save_metrics(data: dict):
    """保存监控数据"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    load_avg = data.get("load_avg", {}) or {}
    cursor.execute("""
        INSERT INTO metrics (cpu, memory, disk, sent_speed, recv_speed, load1m, load5m, load15m)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get("cpu"),
        data.get("memory"),
        data.get("disk"),
        data.get("sent_speed"),
        data.get("recv_speed"),
        load_avg.get("1m"),
        load_avg.get("5m"),
        load_avg.get("15m")
    ))
    conn.commit()
    conn.close()


def get_history(minutes: int = 60):
    """获取最近 N 分钟的历史数据"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    since = datetime.now() - timedelta(minutes=minutes)
    cursor.execute("""
        SELECT timestamp, cpu, memory, disk, sent_speed, recv_speed
        FROM metrics
        WHERE timestamp > ?
        ORDER BY timestamp ASC
    """, (since,))
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {
            "timestamp": row[0],
            "cpu": row[1],
            "memory": row[2],
            "disk": row[3],
            "sent_speed": row[4],
            "recv_speed": row[5]
        }
        for row in rows
    ]


def cleanup_old_data(days: int = 7):
    """清理超过 N 天的旧数据"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cutoff = datetime.now() - timedelta(days=days)
    cursor.execute("DELETE FROM metrics WHERE timestamp < ?", (cutoff,))
    conn.commit()
    conn.close()