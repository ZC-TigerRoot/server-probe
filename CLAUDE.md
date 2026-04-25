# Server Probe Project Rules

This is a learning project for building a lightweight server monitoring dashboard.

## Development rules
- Start with a simple MVP before adding advanced features.
- First version should use Python FastAPI + psutil + simple HTML/CSS/JavaScript.
- Do not use React in the first version.
- Do not implement multi-server agent mode yet.
- Do not add login/auth yet.
- Before editing files, explain the file purpose.
- After creating code, provide run commands and testing steps.
- Avoid destructive commands such as rm -rf, git reset --hard, or git push --force.

## MVP features
- Show CPU usage
- Show memory usage
- Show disk usage
- Show upload/download network speed
- Show system uptime
- Use WebSocket to update data every 1 second
