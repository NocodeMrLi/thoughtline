# Thoughtline 微软商店首个候选包工作报告

当前为商店候选交付，不是商店已经上架。产品版本0.0.38，MSIX商店版本1.0.38.0；此前0.0.37正式下载继续保留。

## 已完成

- 官方Microsoft Store Developer CLI v0.4.3已安装并核验发行摘要，Mac可运行。卖家配置和登录未完成；本次使用锁定的既有electron-builder与Windows SDK MakeAppx离线构建，不运行会改图标/配置的CLI初始化。
- 主仓库更新→副仓库同步→副仓库构建已实际跑通。构建源SHA `6e798d53c049da88e49ed31872992a1408873b21`，tree `ab883327a0c660d9d6ebbbbd4f91113a3c82363b`。执行前两仓库SHA/tree一致，云端再次核对。
- 新工作流只手动运行Windows Store候选，不调用历史全套、发布或自动更新。Mac无需Windows虚拟机。独立审查两处重要问题已复现修复：首次写入前检查路径，清理异常仍保存失败报告。
- 新增Store包身份、固定提醒COM激活标识和AUMID；普通EXE保留既有身份。Logo沿用批准素材。
- 中英文商店介绍草稿分别位于[中文](listing/zh-CN.md)、[English](listing/en-US.md)。尚未上传后台；最终Windows实际截图待制作/核对，Mac实拍与模拟图不冒充Windows截图。

## 实际验证

成功构建：[副仓库任务38752702392](https://github.com/NocodeLi/thoughtline/actions/runs/38752702392)。类型检查、46项新功能与相关提醒/存储/版本测试、构建通过；没有重跑历史全套。

MakeAppx对实际MSIX打包及拆包通过，独立读取并核对包身份、版本、x64入口、通知COM声明、图标尺寸，所有payload与打包前文件摘要一致；app.asar内编译输出与本次fresh out逐一匹配。

在一次性Windows云端运行器中，测试签名副本实际安装成功。注册PFN为 `NocodeMrli.Thoughtline_a1n5zxj14c524`；实际进程 `process.windowsStore=true`，版本0.0.38、x64、固定toast CLSID一致。通过默认数据路径保存合成便签与设置，正常关闭、同版本重装、重开后数据一致。卸载测试安装、删除临时证书/私钥和测试数据成功，cleanupErrors为空。上传候选始终未签名、不含测试私钥。

首次商店版没有历史商店版本可升级验证，故上述是同版本重装保留数据，不等于旧商店版本升级验收，也不承诺EXE数据自动迁入Store配置文件。

## 包与摘要

文件：`Thoughtline-0.0.38-store-x64.msix`。

SHA256：`957ad8564f1c6abf40ef77831d25fa7b39a42b2c541d9824f89feb10a1e9121c`。

云端artifact ID `11981244171`，保留7天。已下载到本地并再次独立校验：173,192,924字节，ZIP CRC、实际manifest、3种图标尺寸、72个payload摘要均通过。原上传候选未被测试签名覆盖。

本地交付目录：`/Users/lihongwei/Documents/Codex/2026-10-15/thoughtline-msstore/delivery/`。其中`.msix`用于微软后台上传，`local-download-verification.json`为最终汇总回执；`install-report.json`与`installed-write/read.json`为安装结果。`package-report.json`是安装前的拆包报告，其not-yet-run只代表当时阶段，不覆盖随后已通过的独立安装报告。

## 运行量与清理

成功运行3分16秒；第一次46秒在Windows长路径下载源码处失败，已修复顺序。两次共4分02秒任务历时，均在副仓库；这不是账单已扣金额或精确计费分钟结论。本次没有绑定支付方式、调整预算或新建主仓库Actions运行。

测试失败日志及少量审查/校验回执作为证据保存；仅清理归属明确的临时物，不删除既有验收资料或历史Release。此前037 Release413402181及10个附件仍存在，README下载链接仍指向已发布037。

## 你可以照着做

1. 用Mac浏览器打开Partner Center原来的Thoughtline产品，进入首次提交的“程序包/Packages”。
2. 上传交付的`.msix`，不要上传测试证书或文件夹；核对微软解析出的名称 `NocodeMrli.Thoughtline`、版本 `1.0.38.0`、发布者CN与原产品一致。
3. 若后台报错，保留完整错误文字或脱敏截图再处理，先不要新建另一个产品或改包身份。
4. 添加中文、英文两套介绍和对应语言的真实Windows截图；核对拟US$1.99一次性价格档位、市场、年龄分级、隐私/支持公开链接，以及本人付款和税务配置。
5. 完整资料核对后才提交认证。本次未替你提交审核或发布；银行、税务、身份认证需本人填写。

Windows真实桌面的DPI/鼠标/输入法、原生通知投递及点击、商店获取/授权、首次认证与公开发布仍待对应证据。包构建成功不替代这些验收。

## 实施取舍

按用户要求只测改动及相关范围；按现有授权继续main开发并保留回滚提交；保留小型历史证据便于追溯。漏测范围仍以上面的未验项为准。审查的一个轻微项暂缓：installed-probe中的packageAumid字段是配置推导的期望值，不是运行时读取；PFN另由Windows注册信息独立核对。
