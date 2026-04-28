const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);

// 格式化网络速度
function formatSpeed(bytesPerSecond) {
    if (bytesPerSecond > 1024 * 1024) {
        return (bytesPerSecond / (1024 * 1024)).toFixed(1) + " MB/s";
    }
    if (bytesPerSecond > 1024) {
        return (bytesPerSecond / 1024).toFixed(1) + " KB/s";
    }
    return bytesPerSecond.toFixed(1) + " B/s";
}

// WebSocket 消息处理
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    document.getElementById("cpu").textContent = data.cpu + "%";
    document.getElementById("memory").textContent = data.memory + "%";
    document.getElementById("disk").textContent = data.disk + "%";
    document.getElementById("sent").textContent = formatSpeed(data.sent_speed);
    document.getElementById("recv").textContent = formatSpeed(data.recv_speed);
    document.getElementById("uptime").textContent = data.uptime;

    const loadEl = document.getElementById("load");
    const loadCard = document.getElementById("load-card");
    if (data.load_avg) {
        loadEl.textContent = `${data.load_avg["1m"]} / ${data.load_avg["5m"]} / ${data.load_avg["15m"]}`;
        loadCard.classList.remove("hidden");
    } else {
        loadCard.classList.add("hidden");
    }
};

ws.onclose = () => {
    console.log("WebSocket closed");
};

ws.onerror = (err) => {
    console.error("WebSocket error", err);
};

// Tab 切换功能
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // 移除所有 active
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // 添加 active 到当前
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
        
        // 如果是图表 tab，加载图表数据
        if (tabId === 'charts') {
            loadCharts();
        }
        // 如果是进程 tab，加载进程列表
        if (tabId === 'processes') {
            loadProcesses();
        }
    });
});

// 图表实例
let usageChart = null;
let networkChart = null;

// 加载图表数据
async function loadCharts() {
    try {
        const response = await fetch('/api/history?minutes=60');
        const data = await response.json();
        
        const usageCanvas = document.getElementById('usageChart');
        const networkCanvas = document.getElementById('networkChart');
        if (!usageCanvas || !networkCanvas) {
            console.warn('图表 canvas 元素未找到');
            return;
        }

        // 如果没有数据，显示提示
        if (data.length === 0) {
            usageCanvas.parentElement.innerHTML = '<h2>CPU & 内存使用率趋势（1小时）</h2><p class="text-center" style="padding: 50px;">暂无数据，请等待几分钟后刷新（数据每10秒保存一次）</p>';
            networkCanvas.parentElement.innerHTML = '<h2>网络速度趋势（1小时）</h2><p class="text-center" style="padding: 50px;">暂无数据，请等待几分钟后刷新</p>';
            return;
        }
        
        const labels = data.map(d => {
            const date = new Date(d.timestamp);
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        });
        const cpuData = data.map(d => d.cpu);
        const memoryData = data.map(d => d.memory);
        const sentData = data.map(d => d.sent_speed / 1024); // KB/s
        const recvData = data.map(d => d.recv_speed / 1024); // KB/s
        
        // CPU & 内存图表
        const usageCtx = usageCanvas.getContext('2d');
        if (usageChart) usageChart.destroy();
        usageChart = new Chart(usageCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'CPU %',
                        data: cpuData,
                        borderColor: '#22d3ee',
                        backgroundColor: 'rgba(34, 211, 238, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: '内存 %',
                        data: memoryData,
                        borderColor: '#4ade80',
                        backgroundColor: 'rgba(74, 222, 128, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#e2e8f0' }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: '#334155' }
                    },
                    y: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: '#334155' },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
        
        // 网络速度图表
        const networkCtx = networkCanvas.getContext('2d');
        if (networkChart) networkChart.destroy();
        networkChart = new Chart(networkCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '上传 (KB/s)',
                        data: sentData,
                        borderColor: '#a78bfa',
                        backgroundColor: 'rgba(167, 139, 250, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: '下载 (KB/s)',
                        data: recvData,
                        borderColor: '#f472b6',
                        backgroundColor: 'rgba(244, 114, 182, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#e2e8f0' }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: '#334155' }
                    },
                    y: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: '#334155' },
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (err) {
        console.error('加载图表数据失败:', err);
    }
}

// 加载进程列表
async function loadProcesses(showLoading = false) {
    const tbody = document.getElementById('process-list');
    
    // 只有手动刷新时才显示加载中
    if (showLoading) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">加载中...</td></tr>';
    }
    
    try {
        const response = await fetch('/api/processes');
        const processes = await response.json();
        
        tbody.innerHTML = processes.map(p => `
            <tr>
                <td>${p.pid}</td>
                <td>${p.name}</td>
                <td>${p.cpu}%</td>
                <td>${p.memory}%</td>
                <td><span class="status-badge ${p.status}">${p.status}</span></td>
                <td>
                    <button class="btn btn-danger" onclick="killProcess(${p.pid})" ${p.pid < 100 ? 'disabled' : ''}>
                        结束
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        if (showLoading) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center error">加载失败: ${err.message}</td></tr>`;
        }
    }
}

// 结束进程
async function killProcess(pid) {
    if (!confirm(`确定要结束进程 ${pid} 吗？`)) return;
    
    try {
        const response = await fetch(`/api/processes/${pid}/kill`, { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            loadProcesses(); // 刷新列表
        } else {
            alert('失败: ' + result.message);
        }
    } catch (err) {
        alert('请求失败: ' + err.message);
    }
}

// 刷新进程列表按钮（手动刷新显示加载状态）
document.getElementById('refresh-processes')?.addEventListener('click', () => loadProcesses(true));

// 每分钟刷新一次图表（如果当前在图表 tab）
setInterval(() => {
    if (document.getElementById('charts').classList.contains('active')) {
        loadCharts();
    }
}, 60000);

// 每 3 秒自动刷新进程列表（如果当前在进程 tab，不显示加载状态）
setInterval(() => {
    if (document.getElementById('processes').classList.contains('active')) {
        loadProcesses(false);
    }
}, 3000);
