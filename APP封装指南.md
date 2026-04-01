# APP封装指南（iOS / Android）

本文档用于将当前网站封装为移动端 App（WebView 容器）。

## 1. 适用方案

当前项目是 Next.js 全栈应用，包含服务端接口与数据库访问，不适合离线静态打包成纯前端包。  
因此采用 Capacitor 容器 App + 访问线上站点的方式：

- App 负责外壳（启动图标、打包上架、系统权限）
- 业务页面与 API 仍由网站后端提供

## 2. 前置条件

- 已可正常运行网站（本地或线上）
- Node.js 20+
- Android 打包：安装 Android Studio
- iOS 打包：macOS + Xcode

## 3. 关键配置

配置文件：`capacitor.config.ts`

- `appId`: App 唯一标识（示例：`com.company.attendance`）
- `appName`: 应用名称（示例：`考勤填报`）
- `server.url`: App 打开后访问的网站地址（来自 `CAP_SERVER_URL`）

建议在环境变量中设置：

```bash
CAP_SERVER_URL="https://your-domain.example.com"
```

开发调试（局域网）可用：

```bash
CAP_SERVER_URL="http://192.168.1.11:3001"
```

> 若使用 `http://`，`cleartext` 会自动打开，仅建议开发环境使用。

## 4. 首次封装步骤

在项目目录执行：

```bash
cd /Users/liyifan/Desktop/attendance-report
npm install
npm run cap:add:android
npm run cap:add:ios
npm run cap:sync
```

然后打开原生工程：

```bash
npm run cap:open:android
npm run cap:open:ios
```

## 5. 之后更新流程（代码改动后）

每次更新 `CAP_SERVER_URL` 或 Capacitor 配置后执行：

```bash
npm run cap:sync
```

如果只是网站业务代码更新且仍走线上 URL，通常不需要重新打包 App（除非你要发布新壳版本）。

## 6. 发布建议

- Android：在 Android Studio 生成 AAB（Google Play 推荐）
- iOS：在 Xcode Archive 后上传 App Store Connect
- 正式环境必须使用 HTTPS
- 生产环境建议在服务端开启稳定会话策略与监控

## 7. 常见问题

1) `CAP_SERVER_URL` 未设置  
- 现象：App 打开可能是空白或默认路径  
- 处理：设置有效 URL 后执行 `npm run cap:sync`

2) 局域网地址无法访问  
- 检查手机与电脑是否同一网络
- 检查防火墙是否拦截端口

3) App 内登录态异常  
- 检查 Cookie 的 `secure`、`sameSite` 设置与 HTTPS 是否匹配

4) 线上接口跨域  
- 如果 WebView 走的是同域名，不应有跨域问题；如拆域部署需补 CORS 配置
