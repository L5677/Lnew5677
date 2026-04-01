# 考勤填报系统（Phase 1）

基于 Next.js 15 + Prisma + SQLite 的内部 Web 应用，覆盖需求文档 Phase 1：日次填报、历史、月度提交、管理端、CSV/Excel/PDF 导出。

## 环境要求

- Node.js 20 及以上

## 本地启动

```bash
cd attendance-report
cp .env.example .env   # 首次：配置 DATABASE_URL 与 SESSION_SECRET
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)，从 `/login` 登录。

## 演示账号（执行 seed 后）

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@company.local | demo123 |
| 员工 | yamada@company.local | demo123 |
| 员工 | sato@company.local | demo123 |

## 主要路径

- 员工：`/employee`（每日 `/employee/attendance`、历史、月度 `/employee/summary/YYYY-MM`）
- 管理：`/admin`（员工列表、提交情况、按日编辑、批量导出）

## 生产环境注意

- 将 `SESSION_SECRET` 改为足够长的随机字符串
- SQLite 并发写入较弱，生产建议改用 PostgreSQL 等（修改 `DATABASE_URL` 与 `schema.prisma` 中的 `provider`）
- 祝日数据见 `prisma/seed.ts` 演示列表，正式环境请按业务维护
- **PDF / 中文**：依赖 `fonts/NotoSansSC-Regular.otf`（约 8MB）。为正确显示中文，PDF 会**完整嵌入**该字体，单份导出文件体积通常为 **数 MB**，属正常现象。字体获取方式：`npm install` / **`npm run pdf-font`** / 手动放 `fonts/` / **`CJK_FONT_PATH`**。导出接口为 **Node.js 运行时**

## 构建

```bash
npm run build
npm start
```

## 封装为 App（Capacitor）

> 推荐：先把网站部署成 HTTPS 地址，再封装。移动端 App 通过 WebView 访问该地址。

1) 配置 App 访问地址（例如生产域名）：

```bash
CAP_SERVER_URL="https://your-domain.example.com"
```

2) 首次添加平台：

```bash
npm run cap:add:android
npm run cap:add:ios
```

3) 同步配置：

```bash
npm run cap:sync
```

4) 打开原生工程并打包：

```bash
npm run cap:open:android
npm run cap:open:ios
```

更多说明见：`APP封装指南.md`
