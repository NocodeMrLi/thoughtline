# Mac安装签名修复（0.0.4）

本次问题下载SHA一致，失效原因是Electron打包后遗留无资源封装的linker签名。main源码回滚点2f5c3bf；[修复版双端私有测试包](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.4-alpha.1)已发布。

打包改为完整ad-hoc资源签名，构建App和DMG内App均运行codesign --verify --deep --strict；任一失败命令终止。41项单测、类型、构建、实际Mac包分组循环和Windows CI37797245224通过。浏览器下载隔离体验、Developer ID/公证及双端物理操作仍单列验收，不能把本机启动等同所有用户免拦截。可信私有包首次下载可按[Apple说明](https://support.apple.com/zh-cn/102445)在系统设置→隐私与安全性→仍要打开。

本机已安装App核对来源、备份后修复完整签名，仅去除此App的隔离属性并启动；全局Gatekeeper未变化。临时测试目录与重复构建已清理，正式安装包、真实念头数据及回滚记录保留。后续源代码继续推进设置、退出草稿、恢复错误、正文拖入及系统适配，统一进度在用户笔记目录10-剩余落地与安装修复计划.md。
