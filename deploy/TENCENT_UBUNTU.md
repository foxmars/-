# 腾讯云 Ubuntu 部署

项目的 `server.cjs` 同时提供游戏页面和 WebSocket 房间服务。系统服务模板为 `deploy/neon-brawl.service`，适用于 Ubuntu 镜像、默认 `ubuntu` 用户，以及项目目录 `/home/ubuntu/neon-brawl`。

## 安装

1. 在腾讯云控制台确认目标实例的地域和配置，并通过控制台登录目标实例。切勿把上海和香港实例混淆。
2. 安装 Node.js 20 或更高版本及 Git；运行 `node --version` 和 `git --version` 确认。项目不依赖 npm 包。
3. 以 `ubuntu` 用户执行：

   ```sh
   git clone https://github.com/foxmars/-.git /home/ubuntu/neon-brawl
   sudo cp /home/ubuntu/neon-brawl/deploy/neon-brawl.service /etc/systemd/system/neon-brawl.service
   sudo systemctl daemon-reload
   sudo systemctl enable --now neon-brawl
   systemctl status neon-brawl --no-pager
   curl -fsS http://127.0.0.1:8787/health
   ```

4. 更新版本：

   ```sh
   cd /home/ubuntu/neon-brawl
   git pull --ff-only
   sudo systemctl restart neon-brawl
   ```

5. 查看最近日志：`journalctl -u neon-brawl -n 100 --no-pager`。

`Restart=always` 会在进程异常退出后自动重启。进程重启时，内存中的房间和正在进行的连接会丢失，玩家需要重新建房。服务器、网络和浏览器都无法保证绝对不断线。
服务默认只监听 `127.0.0.1:8787`，可先在服务器内部检查健康状态。正式上线时由同机反向代理连接这个地址。

## 正式对外访问

在允许公开提供网站服务后，再配置域名、HTTPS 反向代理和 WebSocket Upgrade，并在实例防火墙只放行需要的端口。对外页面应使用 `https://`，联机服务应使用同域名的 `wss://<域名>/ws`。当前客户端会自动使用同源 WebSocket 地址。

中国内地实例公开提供网站服务前，需先按适用要求完成备案及相关手续。临时改用 `公网 IP:8787` 不会改变公开网站的备案要求。香港实例不需要中国内地 ICP 备案，但跨境网络质量可能波动。
