#!/usr/bin/env python3
"""Run the exact 4191 Mac DMG through a relocated launcher (RED or GREEN)."""

import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile


REPO = Path("/Users/lihongwei/Desktop/晾念头 : Thoughtline/app")
DELIVERY = Path("/Users/lihongwei/Documents/Codex/2026-10-09/thoughtline-round1-repair/delivery/v0.0.17-preview.3")
EVIDENCE = REPO / "acceptance/evidence/appearance/task2-portable-launcher"
DMG_NAME = "Thoughtline-0.0.17-preview.3-mac-arm64.dmg"
LAUNCHER_NAME = "Start-Thoughtline-Isolated-Mac.command"
EXPECTED_DMG = "9c2096b57bb0f5c47b1f3595cec7e041621163637cb5564c33b4e9b7253dd4db"
NODE = "/Users/lihongwei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"


def sha256(file: Path) -> str:
    digest = hashlib.sha256()
    with file.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def run(command, cwd: Path, timeout=90, env=None):
    result = subprocess.run(command, cwd=cwd, env=env, capture_output=True, text=True, timeout=timeout)
    return {"command": command, "cwd": str(cwd), "exitCode": result.returncode,
            "stdout": result.stdout, "stderr": result.stderr}


def main(phase: str) -> int:
    if phase not in ("red", "green"):
        raise ValueError("phase must be red or green")
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    source_dmg = DELIVERY / DMG_NAME
    source_launcher = DELIVERY / LAUNCHER_NAME
    source_before = {"dmg": sha256(source_dmg), "launcher": sha256(source_launcher)}
    assert source_before["dmg"] == EXPECTED_DMG
    root = Path(tempfile.mkdtemp(prefix=f"thoughtline-portable-{phase}-"))
    producer = root / "producer"
    relocated = root / "Downloaded 中文 O'Brien Preview"
    elsewhere = root / "different-cwd"
    for directory in (producer, relocated, elsewhere):
        directory.mkdir()
    marker = relocated / "isolated-experience/user-data/synthetic-marker.txt"
    marker.parent.mkdir(parents=True)
    marker.write_bytes(b"owned synthetic profile: retain exactly\n")
    result = {"phase": phase, "sourceBefore": source_before, "temporaryRoot": str(root),
              "producer": str(producer), "relocated": str(relocated), "elsewhere": str(elsewhere),
              "markerSha256": sha256(marker)}
    cleanup_ok = False
    try:
        shutil.copy2(source_dmg, producer / DMG_NAME)
        shutil.copy2(source_dmg, relocated / DMG_NAME)
        assert sha256(producer / DMG_NAME) == sha256(relocated / DMG_NAME) == EXPECTED_DMG
        if phase == "red":
            shutil.copy2(source_launcher, relocated / LAUNCHER_NAME)
        else:
            env = os.environ.copy()
            env["THOUGHTLINE_DELIVERY_DIR"] = str(producer)
            result["generation"] = run([NODE, "scripts/generate-mac-isolated-launcher.cjs"], REPO, env=env)
            assert result["generation"]["exitCode"] == 0, result["generation"]
            shutil.copy2(producer / LAUNCHER_NAME, relocated / LAUNCHER_NAME)
        launcher = relocated / LAUNCHER_NAME
        launcher_text = launcher.read_text()
        result["fixture"] = {"dmgSha256": sha256(relocated / DMG_NAME),
                             "launcherSha256": sha256(launcher), "launcherBytes": launcher.stat().st_size,
                             "runtimeContainsProducerPath": str(producer) in launcher_text,
                             "runtimeContainsOriginalPath": str(DELIVERY) in launcher_text}
        # zsh :A resolves macOS /var to /private/var as well as launcher symlinks.
        expected_data = relocated.resolve() / "isolated-experience/user-data"
        expected_line = f"本次隔离数据：{expected_data}"
        result["validAdjacent"] = run(["/bin/zsh", str(launcher), "--check-only"], elsewhere)
        result["validAdjacent"]["correctDataRoot"] = expected_line in result["validAdjacent"]["stdout"]
        result["validAdjacent"]["producerPathInOutput"] = str(DELIVERY) in result["validAdjacent"]["stdout"]

        good = relocated / (DMG_NAME + ".held")
        adjacent = relocated / DMG_NAME
        adjacent.rename(good)
        try:
            result["missingAdjacent"] = run(["/bin/zsh", str(launcher), "--check-only"], elsewhere)
            adjacent.write_bytes(b"intentionally corrupt adjacent candidate\n")
            result["corruptAdjacent"] = run(["/bin/zsh", str(launcher), "--check-only"], elsewhere)
            adjacent.unlink()
        finally:
            if adjacent.exists():
                adjacent.unlink()
            good.rename(adjacent)
        symlink_target = elsewhere / "untouched-synthetic-snapshot"
        symlink_target.write_bytes(b"do not overwrite synthetic snapshot\n")
        symlink_hash = sha256(symlink_target)
        symlink = expected_data / "snapshot.json"
        symlink.symlink_to(symlink_target)
        try:
            result["symlinkProfileRefused"] = run(["/bin/zsh", str(launcher), "--check-only"], elsewhere)
        finally:
            symlink.unlink()
        result["symlinkTargetPreserved"] = sha256(symlink_target) == symlink_hash
        result["markerPreserved"] = sha256(marker) == result["markerSha256"]
        result["originalFilesUnchanged"] = source_before == {"dmg": sha256(source_dmg), "launcher": sha256(source_launcher)}
        mounts = run(["/usr/bin/hdiutil", "info"], elsewhere)
        result["ownedMountsDetached"] = str(root) not in mounts["stdout"] and str(DELIVERY / "isolated-experience/mount") not in mounts["stdout"]
        processes = run(["/bin/ps", "-axo", "pid=,comm="], elsewhere)
        result["noOwnedAppRunning"] = str(root / "producer") not in processes["stdout"] and str(relocated) not in processes["stdout"]
        result["correctBehavior"] = (result["validAdjacent"]["exitCode"] == 0
                                     and result["validAdjacent"]["correctDataRoot"]
                                     and not result["validAdjacent"]["producerPathInOutput"]
                                     and not result["fixture"]["runtimeContainsProducerPath"]
                                     and not result["fixture"]["runtimeContainsOriginalPath"]
                                     and result["missingAdjacent"]["exitCode"] != 0
                                     and result["corruptAdjacent"]["exitCode"] != 0
                                     and result["symlinkProfileRefused"]["exitCode"] != 0
                                     and result["symlinkTargetPreserved"]
                                     and result["markerPreserved"] and result["originalFilesUnchanged"]
                                     and result["ownedMountsDetached"] and result["noOwnedAppRunning"])
        cleanup_ok = result["ownedMountsDetached"] and result["noOwnedAppRunning"]
    finally:
        result["temporaryCopyRemoved"] = False
        if not cleanup_ok:
            mount_output = subprocess.run(["/usr/bin/hdiutil", "info"], capture_output=True, text=True).stdout
            process_output = subprocess.run(["/bin/ps", "-axo", "pid=,comm="], capture_output=True, text=True).stdout
            cleanup_ok = str(root) not in mount_output and str(root) not in process_output
        if cleanup_ok:
            shutil.rmtree(root)
            result["temporaryCopyRemoved"] = not root.exists()
        (EVIDENCE / f"{phase}-actual-package.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"phase": phase, "correctBehavior": result["correctBehavior"],
                      "validExit": result["validAdjacent"]["exitCode"],
                      "correctDataRoot": result["validAdjacent"]["correctDataRoot"],
                      "missingExit": result["missingAdjacent"]["exitCode"],
                      "corruptExit": result["corruptAdjacent"]["exitCode"],
                      "tempRemoved": result["temporaryCopyRemoved"]}, ensure_ascii=False))
    return 0 if result["correctBehavior"] and result["temporaryCopyRemoved"] else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
