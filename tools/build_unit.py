#!/usr/bin/env python3
"""Build BMW Weather with the pinned upstream iDrive 7 app kit."""
import argparse
import io
import json
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
import urllib.request
from pathlib import Path

UPSTREAM_COMMIT = "f5e4b8daa6c930f83a93fd6d6a158ab08c00c748"
UPSTREAM_URL = "https://codeload.github.com/cauliflowermossgrape/idrive7-apps/tar.gz/" + UPSTREAM_COMMIT


def safe_extract(archive, destination):
    root = os.path.realpath(destination)
    for member in archive.getmembers():
        target = os.path.realpath(os.path.join(destination, member.name))
        if target != root and not target.startswith(root + os.sep):
            raise RuntimeError("Unsafe path in upstream source archive")
    archive.extractall(destination)


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def prepare_chinese_build(kit, app):
    locale = Path(__file__).resolve().parents[1] / "localization"
    catalog = locale / "zh-CN.json"
    labels = json.loads(catalog.read_text(encoding="utf-8"))
    shutil.copy2(catalog, kit / "runtime/locales/zh-CN.json")
    shutil.copy2(locale / "credit.zh-CN.json", kit / "localization/credit.zh-CN.json")
    for name in ("cjk.json", "OFL-NotoSansSC.txt"):
        shutil.copy2(locale / name, kit / "runtime/fonts" / name)

    # The kit localizes screen/setting labels itself, but not the package description
    # or the standalone RHMI widget name.
    manifest = app / "app.json"
    spec = json.loads(manifest.read_text(encoding="utf-8"))
    spec["description"] = labels.get(spec["description"], spec["description"])
    widget = spec["startWidget"]
    widget["name"] = labels.get(widget["name"], widget["name"])
    write_json(manifest, spec)


def prepare_package(package_dir, version):
    manifest = package_dir / "package.json"
    package = json.loads(manifest.read_text(encoding="utf-8"))
    package.update(version=version, mguInternet=True, mguHmi=["ID7"])
    write_json(manifest, package)

    # MGU Store checks the package against the version from app.json. The kit adds a
    # language suffix internally, so keep all shipped version fields aligned.
    for name in ("npm-shrinkwrap.json", "javascript/kit/app-spec.json"):
        path = package_dir / name
        data = json.loads(path.read_text(encoding="utf-8"))
        if data["version"] != version:
            data["version"] = version
            write_json(path, data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("app_id")
    parser.add_argument("version")
    parser.add_argument("app_dir")
    parser.add_argument("--language", choices=("ro", "zh-CN"), default="ro")
    args = parser.parse_args()
    app_id, version, app_dir = args.app_id, args.version, args.app_dir
    repo = os.getcwd()
    app_source = os.path.realpath(os.path.join(repo, app_dir))
    sdk_source = os.path.join(repo, "oap-sdk")
    if not os.path.isdir(app_source):
        raise RuntimeError("App source folder not found: " + app_source)
    if not os.path.isdir(sdk_source):
        raise RuntimeError("MGU Store did not provide the BMW SDK donor (oap-sdk)")

    with tempfile.TemporaryDirectory(prefix="bmw-weather-build-") as work:
        request = urllib.request.Request(UPSTREAM_URL, headers={"User-Agent": "BMW-Weather-MGU-build"})
        with urllib.request.urlopen(request, timeout=90) as response:
            payload = response.read()
        archive = tarfile.open(fileobj=io.BytesIO(payload), mode="r:gz")
        safe_extract(archive, work)
        archive.close()

        roots = [os.path.join(work, n) for n in os.listdir(work) if os.path.isdir(os.path.join(work, n))]
        if len(roots) != 1:
            raise RuntimeError("Unexpected upstream source archive layout")
        upstream = roots[0]

        target_app = os.path.join(upstream, "apps", app_id)
        if os.path.exists(target_app):
            shutil.rmtree(target_app)
        shutil.copytree(app_source, target_app)
        target_sdk = os.path.join(upstream, "oap-sdk")
        if os.path.exists(target_sdk):
            shutil.rmtree(target_sdk)
        shutil.copytree(sdk_source, target_sdk)

        kit = Path(upstream) / "kit"
        command = [sys.executable, str(kit / "tools/build.py"), app_id]
        if args.language == "zh-CN":
            prepare_chinese_build(kit, Path(target_app))
            command.extend(("--language", args.language))
        subprocess.check_call(command, cwd=upstream)
        packages = list((Path(upstream) / "dist").glob(app_id + "@*.tgz"))
        if len(packages) != 1:
            raise RuntimeError("Expected one BMW Weather package from the app kit")
        built = packages[0]

        with tempfile.TemporaryDirectory(prefix="bmw-weather-package-") as stage:
            with tarfile.open(built, "r:gz") as source:
                safe_extract(source, stage)
            prepare_package(Path(stage) / "package", version)
            repacked = os.path.join(work, "repacked.tgz")
            with tarfile.open(repacked, "w:gz") as output_tar:
                for root, dirs, names in os.walk(stage):
                    dirs.sort()
                    for name in sorted(names):
                        full = os.path.join(root, name)
                        output_tar.add(full, arcname=os.path.relpath(full, stage), recursive=False)
            shutil.copy2(repacked, built)

        output = os.path.join(repo, "dist", app_id + "@" + version + ".tgz")
        os.makedirs(os.path.dirname(output), exist_ok=True)
        shutil.copy2(built, output)


if __name__ == "__main__":
    main()
