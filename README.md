# dsh-vibe-desk · 氛围台

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 界面加一张「氛围台」：换一套配色心情，顺手放点自己生成的氛围音乐。

左侧栏底部（设置齿轮旁）多一个小图标，点开是一个浮层面板，分 **主题** 和 **音乐** 两页。关掉面板音乐继续放。

## 功能

- **配色预设**：原生 / 海盐 / 暮光 / 森林 / 樱花 / 琥珀 / 午夜，七套现成的配色心情。
- **自定义主题色**：任意取色，界面强调色跟着变；「氛围浓度」滑杆控制底色染得多深。
- **明暗外观**：浅色 / 深色 / 跟随系统，直接写入宿主自己的外观偏好。
- **氛围音乐**：四首浏览器实时合成的曲子——夜航、雨窗、暖灯、星轨，各有和弦、速度和雨声/泛音；播放 / 暂停、上一首 / 下一首、音量、频谱可视化。
- **本地音频**：选一个本机文件播放，不上传。
- **记得住**：配色、浓度、曲目、音量存在浏览器 `localStorage`；关掉面板、刷新页面都还在。
- **中英文**：界面文案走 DSH 的语言服务，跟着宿主语言走。

## 安装

npm（发布后）：

```sh
dsh plugin --profile web add -w dsh-vibe-desk
```

插件市场：在 dsh-market 里搜「氛围台」或 `vibe-desk`。

本地目录（开发时）：

```sh
dsh plugin --profile web add -w link:/path/to/vibe-desk
```

桌面端也可以直接用插件管理器安装本目录（`plugin_manager` 的 `install_bundle`，`target` 传目录绝对路径）。

## 用法

1. 装好后打开 **插件** 页确认 **氛围台（dsh-vibe-desk）** 已启用。
2. 左侧栏底部、设置齿轮旁边会出现一个四根小竖条的图标（放歌时会跳）。
3. 点开面板：
   - **主题**：选配色预设、拖浓度、点「明暗外观」切换；
   - **音乐**：点大圆按钮播放。
4. 想回原生外观：点「恢复默认」，或直接停用插件。

浏览器要求先有一次点击才允许出声，所以音乐不会自动播放。

## 实现

- **配色**：在宿主主题之上用 `theme.overrideTokens('dsh-vibe-desk', tokens)` 叠一层 token 层，一次性覆盖品牌色、背景、浮层、侧栏填充和边框，明暗各一套；不注册新主题、不改基础主题，停用插件自动还原。文字色和按钮填充刻意不动，避免对比度翻车。
- **外观**：浅色 / 深色 / 跟随系统走 `theme.setTheme()`，与宿主「外观」设置是同一份偏好。
- **音乐**：Web Audio 实时合成，没有音频文件。每小节排一次和弦铺底、低音、琶音与延迟，雨声是程序生成的粉红噪声；`AnalyserNode` 喂频谱。
- **界面**：入口注册在 `sidebar.footer.action`，面板注册在 `shell.overlay`（固定在左下角浮层）；样式只用 `--dsw-*` 主题变量，组件内 `<style>` 随组件卸载移除。
- **状态**：浏览器 `localStorage`（`vibe-desk.settings.v1`），不写入会话日志。

## 目录结构

```
vibe-desk/
├─ package.json         dsh.bundle.patch + dsh.client（浏览器半）
├─ cordis.patch.yml     插入一条 Host 行
├─ index.js             Host 半：空的 apply()
├─ client.js            浏览器半：主题层 + 面板 + 音频引擎
├─ icon.svg             插件管理页图标
├─ locale/{zh,en}.json  插件标题与简介
├─ README.md
├─ CHANGELOG.md
└─ LICENSE
```

## 兼容性

在 **DSH 0.2.2-rc.1** 桌面端实测。依赖的公共接口：`ctx.slots`、`theme.overrideTokens` / `setTheme` / `getTheme`、`ctx.locale`、`theme/change` 事件。配色和音乐都是纯前端能力，没有 Host 服务、没有构建步骤、没有运行时依赖。

## 发布

1. 改 `package.json` 的 `version`，在 `CHANGELOG.md` 记一条。
2. 发布到 npm（需要 npm 账号，仓库里已带 `publishConfig.access: public`）：

   ```sh
   cd vibe-desk
   npm login
   npm publish
   ```

3. 上架插件市场：市场目录来自精选列表 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)，去那边提一个 PR，在列表里加一条（npm 包名 + 一句简介 + 仓库链接），站点和 dsh-market 会自动收录，通常一天内生效。
4. 可选：打一个 GitHub Release 预构建包，供 npm 不可达时安装：

   ```sh
   npm pack
   # 把 dsh-vibe-desk-1.0.0.tgz 传到 Release 附件
   ```

## 许可

MIT，见 [LICENSE](LICENSE)。
