# LZY's Diary — 完整步骤清单

你已经注册并登录 Supabase，按下面顺序做即可。

---

## 一、Supabase 项目与密钥

1. **创建项目**
   - 打开 [Supabase Dashboard](https://supabase.com/dashboard) → 点 **New project**
   - 填项目名（如 `lzy-diary`）、设数据库密码（自己记住）、选区域（如 Singapore）
   - 等项目创建完成

2. **拿到 API 信息**
   - 进入项目 → 左侧 **Project Settings** → **API**
   - 记下：**Project URL**、**anon public**（公钥）

---

## 二、本地项目配置

3. **安装 Supabase 客户端**
   ```bash
   npm install @supabase/supabase-js
   ```

4. **配置环境变量**
   - 在项目根目录新建 `.env.local`
   - 写入（把 `你的URL`、`你的anon公钥` 换成上一步的值）：
   ```
   NEXT_PUBLIC_SUPABASE_URL=你的URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon公钥
   ```

---

## 三、数据库表（在 Supabase SQL Editor 里执行）

5. **执行建表 SQL**
   - 打开 Supabase Dashboard → 你的项目 → 左侧 **SQL Editor** → 新建查询
   - 复制 `supabase-schema.sql` 里的全部内容，粘贴到编辑器，点击 **Run** 执行
   - 执行成功后会创建：diary、countdown、album、album_image、visitor 表及 RLS 策略

6. **纪念日/倒计时表 `countdown`**（已包含在上述 SQL 中）
   - 字段：id, 标题, 日期, 类型(正数/倒数), 创建时间等

7. **云相册板块表 `album`** + **相册图片表 `album_image`**
   - 板块：id, 名称(笔记/旅游/探店等), 顺序
   - 图片：id, 板块 id, 图片 url, 关联日记 id, 创建时间

8. **访客记录表 `visitor`**
   - 字段：id, ip, 设备信息, 访问路径, 访问时间

9. **行级安全 (RLS)**：为每张表写好策略，保证只能读/写自己的数据（访客表可仅写入、后台可读）

9a. **Storage 存储桶**（日记图片）：Supabase → Storage → New bucket，桶名 `diary-images`，勾选 Public。详见 `supabase-storage-setup.md`

---

## 四、前端功能实现

10. **Supabase 客户端**
    - 在 `src/lib/supabase.ts` 里用环境变量创建并导出 client（浏览器端）

11. **日记本**
    - 列表页：拉取日记、按时间排序、区分私密/公开
    - 写/编辑：表单（内容、是否私密、是否带定位、选发到哪个相册）、发帖时写入当前头像/昵称快照
    - 定位：浏览器定位 API 或选“不显示位置”
    - 搜索：按关键词搜日记内容

12. **纪念日 / 倒计时**
    - 添加：标题、日期、类型（“已经 xxx 天” / “还有 xxx 天”）
    - 列表 + 自动计算并显示天数

13. **云相册**
    - 板块列表（笔记、旅游、探店等可配置）
    - 每个板块里显示该板块的图片（来自日记或单独上传）
    - 写日记时可选“发到哪个相册板块”

14. **访客统计（后台）**
    - 访问时调用 API 记录 IP、设备、路径
    - 简单后台页（需简单鉴权）展示访客列表

---

## 五、部署与域名

15. **部署到 Vercel**
    - 用 GitHub 关联项目，在 Vercel 里导入 `c-diary` 仓库
    - 在 Vercel 的 Environment Variables 里填 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - 在 Supabase 的 **Authentication → URL Configuration** 里，把 Vercel 的域名加入 **Redirect URLs**

16. **绑定自己的域名**
    - 在 Vercel 项目里点 **Settings → Domains**，添加你的域名并按提示解析

17. **Supabase 再确认**
    - 把线上域名（如 `https://你的域名.com`）加入 **Site URL** 和 **Redirect URLs**

---

## 六、登录功能（已实现）

18. **Supabase Auth 配置**（登录失败时必看）
    - 打开 Supabase → **Authentication** → **Providers** → **Email**
    - 确认 **Enable Email provider** 已开启
    - **建议关闭「Confirm email」**：否则注册后必须点邮件链接验证才能登录，且免费版邮件可能进垃圾箱
    - **Authentication** → **URL Configuration** → 将 `http://localhost:3000` 和线上域名加入 **Redirect URLs**

19. **执行 RLS 按用户隔离**
    - 在 SQL Editor 中复制并执行 `supabase-rls-auth.sql`
    - 执行后每位用户只能看到/修改自己的日记

20. **使用方式**
    - 访问网站 → 自动跳转到登录页
    - 点击「去注册」→ 输入邮箱和密码（至少 6 位）→ 注册
    - 若开启邮件验证：查收邮件，点击链接后再登录
    - 登录后：可写日记、编辑资料等
    - 点击右上角「退出」可登出

---

## 顺序小结

| 阶段     | 步骤 |
|----------|------|
| Supabase | 1 创建项目 → 2 拿 URL 和 anon key |
| 本地     | 3 装包 → 4 配 `.env.local` |
| 数据库   | 5~9 建表 + RLS |
| 前端     | 10 建 client → 11 日记本 → 12 纪念日 → 13 云相册 → 14 访客 |
| 上线     | 15 Vercel 部署 → 16 域名 → 17 回调 URL |

下一步可以从 **步骤 3：安装 Supabase 客户端 + 步骤 4：环境变量** 开始，我可以按步骤给你写具体代码（含建表 SQL 和 RLS）。
