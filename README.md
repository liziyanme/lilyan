# 我的小日记

Hello Kitty & Chiikawa 风格的个人日记 / 记事本网站，支持手机、平板、电脑三端，目标多端同步。

## 技术栈（低成本方案）

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **部署**: 可部署到 [Vercel](https://vercel.com)（免费），绑定你的域名
- **数据与同步**: 后续接入 Supabase 免费版（数据库 + 实时同步 + 存储）

## 本地运行

```bash
# 安装依赖
npm install

# 开发
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 图标 / 素材（像素风）

- **首页装饰图**：把素材放到 `public/images/` 下，命名为：
  - `hellokitty.png`（Hello Kitty 图标）
  - `chiikawa.png`（Chiikawa 图标）
- **PWA 图标**：在 `public/` 下放置 `icon-192.png` 和 `icon-512.png`（例如用你找到的 Hello Kitty 像素风 192x192 图，复制一份当 512 用即可），否则「添加到主屏幕」会用默认图标。

## 项目结构（当前）

- `/` - 首页，入口导航
- `/diary` - 日记本（待实现：写日记、定位、私密/公开、搜索）
- `/countdown` - 纪念日 / 倒计时（待实现）
- `/albums` - 云相册（待实现：笔记相册、自定义板块、写日记时选择相册）
- 后台访客 IP / 设备：后续用 API 记录到 Supabase

## 下一步

1. 接入 Supabase（注册、创建项目、拿到 API Key）
2. 实现日记本：列表、写/编辑、定位、私密/公开、搜索
3. 实现纪念日 / 倒计时
4. 实现云相册与板块
5. 后台访客统计
6. 部署到 Vercel 并绑定域名
