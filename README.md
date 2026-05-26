# Freed 释放 — iOS App

把现有 web app（freedreleasing.com）打包成 iOS 应用，上架美区 App Store。

---

## 这是什么

- 基于 **Capacitor 6** 的混合开发项目
- 把 `www/` 目录下的所有 HTML/JS 文件打包进 iOS App，**离线也能用**
- 通过 **Codemagic CI** 云端打包，**不需要 Mac**

---

## 项目结构

```
freed-ios/
├── www/                      # 你现有的 web 文件，全部放在这里
│   ├── index.html            # 首页
│   │
│   ├── 【8 个释放工具】
│   ├── desire.html           # 1. 欲望释放
│   ├── Emotions.html         # 2. 情绪释放
│   ├── Relationship.html     # 3. 人际关系释放
│   ├── financial-freedom.html # 4. 财富自由释放
│   ├── body_release.html     # 5. 身体健康释放
│   ├── Doublesides.html      # 6. 双面觉察
│   ├── Sedona2.html          # 7. 内心疗愈
│   ├── Whole_process.html    # 8. 全程释放
│   │
│   ├── 【辅助功能】
│   ├── assistant.html        # 释放助手（AI）
│   ├── gains.html            # 收获本
│   ├── goals.html            # 目标表
│   │
│   ├── nav-orb.js            # 导航
│   └── music-btn.js          # 音乐按钮
├── capacitor.config.json     # Capacitor 配置（应用名、Bundle ID 等）
├── codemagic.yaml            # Codemagic CI 配置（云端打包脚本）
├── package.json              # npm 依赖
├── .gitignore
└── README.md
```

`ios/` 目录在第一次运行 `npx cap add ios` 后自动生成，由 Codemagic 在云端处理。

---

## 完整上架流程（一次性配置）

### 第一步：注册苹果开发者账号

1. 打开 https://developer.apple.com/programs/
2. 用 Apple ID 注册个人开发者账号（个人 / 公司任选，**个人**够用）
3. 支付 $99 USD/年
4. 等待审核通过（一般 24-48 小时）

⚠️ 注意：注册时填写的姓名和地址会出现在 App Store 应用页面，介意隐私的话可以注册公司账号（需要邓白氏码 D-U-N-S Number）。

### 第二步：在 App Store Connect 创建应用

1. 登录 https://appstoreconnect.apple.com
2. 「我的 App」→ 点 + 号 → 「新建 App」
3. 填写：
   - 平台：iOS
   - 名称：**Freed 释放**
   - 主要语言：简体中文
   - Bundle ID：**com.freedreleasing.app**（先去 https://developer.apple.com/account/resources/identifiers/list 创建这个 Bundle ID）
   - SKU：`freed-releasing-ios`（自定义）
4. 创建后，记下「App Store Connect Apple ID」（一串数字，比如 1234567890）

### 第三步：上传代码到 GitHub

1. 在 GitHub 创建新仓库，比如 `freed-ios`（私有）
2. 把这个项目目录的所有文件推上去
3. iPad 上可以用 **Working Copy** App 操作 Git

```bash
# 如果在 Mac/Linux 上：
cd freed-ios
git init
git add .
git commit -m "Initial Capacitor project"
git remote add origin https://github.com/你的用户名/freed-ios.git
git push -u origin main
```

### 第四步：配置 Codemagic

1. 注册 https://codemagic.io（用 GitHub 登录最方便）
2. 「Add application」→ 选你的 `freed-ios` 仓库
3. Codemagic 会自动检测到 `codemagic.yaml`
4. 在 Codemagic 后台配置：
   - **App Store Connect API Key**（按 Codemagic 文档生成 .p8 文件并上传）
   - **iOS 代码签名**：选择「Automatic」，让 Codemagic 自动管理证书
5. 把 `codemagic.yaml` 里的 `APP_STORE_APPLE_ID: 1234567890` 改成你的真实数字

### 第五步：第一次构建

1. Codemagic 后台点「Start new build」
2. 等待 15-25 分钟（首次构建较慢，要安装 CocoaPods 等）
3. 构建成功后，自动上传到 **TestFlight**
4. 打开 iPad 上的 TestFlight App，登录开发者账号，下载测试版

### 第六步：提交 App Store 审核

1. 在 App Store Connect 准备元数据：
   - **应用截图**（iPad Pro 12.9" + iPhone 6.7" 各几张，可以用 iPad 的截屏录屏）
   - **应用描述、关键词、分类**（建议分类：「健康健美」或「生活」）
   - **隐私政策 URL**（用 freedreleasing.com/privacy.html，需要新建一个页面）
   - **App 隐私问卷**（说明收集了哪些数据，比如 Supabase 收集邮箱）
2. 选择刚刚 TestFlight 上传的构建
3. 提交审核
4. 审核通过后，选择「自动发布」或「手动发布」

⚠️ 美区审核重点：
- 心理疗愈类应用要在描述里说明 **「不是医疗建议，不能替代专业心理治疗」**
- 如果用了 Supabase 收集用户邮箱，必须在「App 隐私」里如实声明

---

## 后续每次更新版本

1. 修改 `www/` 里的文件
2. 在 `capacitor.config.json` 之外的位置不需要改
3. `git push` 到 GitHub
4. Codemagic 自动触发构建（也可以配置只在 tag 时构建）
5. 自动上传到 TestFlight
6. 在 App Store Connect 选新构建提交审核

---

## 离线运行说明

打包后**完全离线可用的功能**：
- ✅ 全部 8 个释放工具（欲望、情绪、关系、财富、身体、双面觉察、内心疗愈、全程释放）
- ✅ 目标表（localStorage）
- ✅ 引导内容、音频引擎合成音轨
- ✅ 导航、动画

**需要联网才能用的功能**（断网时会有友好提示）：
- ⚠️ 释放助手（DeepSeek API via api.freedreleasing.com）
- ⚠️ 收获本读取/发布（Supabase）

后续可以加 `@capacitor/network` 检测网络状态，断网时显示「需要联网才能使用此功能」。

---

## 已知待办（首版后再做）

- [x] App 图标（1024x1024 PNG，主题色调）
- [ ] 启动图（Splash Screen）
- [ ] 隐私政策页面（必需，审核会查）
- [ ] 用户协议页面
- [x] iOS 安全区域适配（顶部 notch、底部 home indicator）
- [ ] 网络状态检测（联网/离线提示）
- [ ] 内购订阅（首版全免费，跑通主流程后再加）
- [ ] 推送通知（可选）

---

## 技术栈

- **Capacitor 6**：混合开发框架
- **iOS 13+**：最低支持版本
- **Codemagic**：CI/CD 云端打包
- **现有 web 技术**：HTML/CSS/JS + Supabase + DeepSeek API

---

## 联系与支持

- Capacitor 文档：https://capacitorjs.com/docs/ios
- Codemagic iOS 文档：https://docs.codemagic.io/yaml-quick-start/building-a-native-ios-app/
- App Store Connect：https://appstoreconnect.apple.com
