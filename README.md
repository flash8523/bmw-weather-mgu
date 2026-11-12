# BMW Weather for iDrive 7 MGU

[English](README.md) · [简体中文](README.zh-CN.md)

Unofficial weather app for BMW iDrive 7 (MGU), intended to be installed as a source repository through Robert Nisipeanu's MGU Store.

## Target

- BMW G30/G31, model years 2019–2020, B48 petrol (initial target)
- iDrive 7 / MGU
- Romanian interface and an optional Simplified Chinese build
- Metric units: °C, km/h, hPa
- Full-screen weather view and home-screen widget
- Open-Meteo forecast API
- Cached forecast for temporary network loss

## MGU Store

This repository uses the MGU Store repo-tree format. The root `mgu-repo.json` discovers apps under `apps/*`. The head unit builds the app from source using the pinned upstream iDrive 7 app kit and its own BMW SDK donor. The BMW SDK is deliberately not included here.

## Build notes

The MGU Store build runs on the head unit. `tools/build_unit.py` downloads a pinned revision of the public `idrive7-apps` build kit, overlays this app's source, and invokes the kit's standard builder. The build requires the MGU Store build sandbox's network permission and the SDK donor it supplies.

The default build is Romanian. For a local Simplified Chinese build, provide your own `oap-sdk/` and run this from the repository root:

```sh
python3 tools/build_unit.py flash8523_bmw_weather 0.1.0 apps/flash8523_bmw_weather --language zh-CN
```

The language is fixed at build time. The Chinese build covers the forecast views, home-screen widget, settings and weather descriptions. For installation through MGU Store, the [Chinese fork](https://github.com/JackieZ123430/bmw-weather-mgu-cn) selects Simplified Chinese in its source build configuration. Both variants use the same app ID.

Simplified Chinese translation by 小白151 (JackieZ123430). The [Chinese guide](README.zh-CN.md) includes the full credit. The Chinese glyph atlas is derived from Noto Sans SC under the [SIL Open Font License](localization/OFL-NotoSansSC.txt).

## Location

GPS access on this MGU firmware has not yet been verified. The app therefore includes a manual-coordinate fallback and does not pretend that GPS is available. A GPS provider can be enabled after the relevant MGU interface is confirmed.

## Disclaimer

Unofficial community software; not affiliated with or endorsed by BMW AG. Use and install at your own risk. Configure and test the app while parked.
