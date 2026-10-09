# 最新源码 Windows CI 与固定测试包

现有 workflow_dispatch：run [37868192110](https://github.com/NocodeMrLi/thoughtline/actions/runs/37868192110)，准确 tested SHA `764bec916db7e9e3fb823c56499c046ebf597ba7`。其生产代码、unit/native脚本与source `796bbea`一致。Node24.19、18文件78 unit、类型/构建、NSIS打包、hash与私有artifact上传全部成功。

本机下载 `dist/windows-764bec9/Thoughtline-0.0.14-win-x64.exe`，Python重新计算SHA256与CI receipt一致，见download-verification.json。artifact ID11588419163；ZIP digest与installer SHA是不同对象。安装器未运行；此结果不等于物理Windows/IME/focus/全屏/穿透验收。保留稳定.13，未发布release或合并main。后续文档与ICC分析脚本校正不属于这次CI执行范围，生产代码不变。
