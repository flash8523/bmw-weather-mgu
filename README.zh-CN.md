# BMW 天气 · iDrive 7 MGU

[English](README.md) · [简体中文](README.zh-CN.md)

BMW 天气是一款面向宝马 iDrive 7（MGU）的非官方天气应用，可通过 Robert Nisipeanu 的 MGU Store 从源码安装。

翻译者：抖音「小白科技杂物社」 · BiliBili「小白151」 · GitHub [JackieZ123430](https://github.com/JackieZ123430)。

## 功能与适用范围

- 项目最初面向 2019–2020 年款、搭载 B48 汽油发动机的 BMW G30/G31，车机为 iDrive 7 / MGU。
- 主界面显示当前天气、逐小时和逐日预报，主页小组件显示温度、天气状况、风速和湿度。
- 使用 Open-Meteo 数据，单位为 °C、km/h 和 hPa。网络暂时中断时可显示已缓存的天气。
- 简中版包含天气状态、主页小组件、应用按钮和设置选项的翻译，主界面右上角和设置页保留汉化署名。

## 通过 MGU Store 安装

1. 在车机打开 MGU Store，进入 Sources（来源），选择 Add source（添加来源）。
2. 输入 `JackieZ123430/bmw-weather-mgu-cn`，选择 `main` 分支。
3. 选择「BMW 天气」并安装。Store 需要支持从源码构建，且需要可用的 Internet Uplink 和本机 SDK donor。
4. 首次启动后，进入「设置」，选择「手动输入经纬度」，填写位置并按「刷新」。

源码仓库通过根目录的 `mgu-repo.json` 发现 `apps/*` 下的应用。Store 使用车机提供的 BMW SDK 和固定版本的 iDrive 7 构建工具在车机上打包。简中版和罗马尼亚语版共用一个应用 ID，切换来源后可能需要手动重装以切换语言。GPS 仍待验证，当前用手动经纬度获取天气。

## 本地构建

在仓库根目录准备自己的 `oap-sdk/`，再运行以下命令。Windows 下可以使用 `python`。

```sh
python3 tools/build_unit.py flash8523_bmw_weather 0.1.0 apps/flash8523_bmw_weather --language zh-CN
```

输出位于 `dist/`。语言由构建参数决定。仓库提供源码，BMW SDK 及含有该 SDK 的构建产物请保留在本地。中文字形来自 Noto Sans SC，许可见 [SIL Open Font License](localization/OFL-NotoSansSC.txt)。

## 项目来源

- [BMW Weather 原仓库](https://github.com/flash8523/bmw-weather-mgu)
- [iDrive 7 应用构建工具](https://github.com/cauliflowermossgrape/idrive7-apps)
- [MGU Store](https://github.com/robertnisipeanu/mgu-store)

本项目为社区开发，与 BMW AG 无关联。请在停车状态下配置和测试。
