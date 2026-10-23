# 临时公网 IP 测试

此配置只用于不绑定域名的短期联机测试。游戏服务直接使用 `http://<公网 IP>:8787`，WebSocket 使用同源 `ws://<公网 IP>:8787/ws`。

在腾讯云轻量服务器防火墙放行 TCP 8787 前，先将 `deploy/ip-demo.conf` 安装到 `/etc/systemd/system/neon-brawl.service.d/ip-demo.conf`，重载并重启服务：

```sh
sudo install -D -m 644 /home/ubuntu/neon-brawl/deploy/ip-demo.conf /etc/systemd/system/neon-brawl.service.d/ip-demo.conf
sudo systemctl daemon-reload
sudo systemctl restart neon-brawl
```

测试结束后，先关闭腾讯云防火墙的 TCP 8787 规则，再移除临时覆盖配置，并重启服务：

```sh
sudo rm /etc/systemd/system/neon-brawl.service.d/ip-demo.conf
sudo systemctl daemon-reload
sudo systemctl restart neon-brawl
```

服务器进程异常时 systemd 会自动重启，但重启会断开已有房间。IP 直连使用 HTTP，适合临时测试，不适合作为正式长期站点。
