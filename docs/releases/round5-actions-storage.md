# Actions存储治理

原131个有效产物，共5.768 GiB。逐份下载、GitHub SHA256匹配、ZIP CRC及可读列表核验后，清理99个旧大包/重复包及旧证据，共5.598 GiB。清理后最新API为37份、0.224 GiB（最终0.0.28包上传前）。当前0.0.27安装包/UI基线、小型失败诊断和本轮失败证据保留；未删除代码、Release附件或测试门禁。

可恢复归档：`/Users/lihongwei/Documents/Codex/2026-10-12/thoughtline-actions-storage-archive`。每个产物有原ZIP、GitHub元信息/SHA256/文件列表和独立删除回执，故这些不是测试垃圾，不清理该目录。网络超时后重新校验继续，全部99项删除后的API读回已核对。

工作流已改为：日常push仍完整构建和测试，大安装包仅手动要求或提交包含[deliver]时保留。成功只保存一份最终安装包7天；交付验证失败时只保留一份可恢复built包3天；失败JSON14天；UI证据仅收集本轮新增/变化文件7天，不重复上传历史目录。CI上传成功与失败回执仍保留。没有修改账单预算、付款方式或仓库私有性。

删除会降低后续小时累计；不会抹掉已产生的本月GB-hours，也不要求邮件的90%立即归零。最终安装包作为私有Release附件长期交付，不依赖短期Actions产物链接。

原始证据：`acceptance/evidence/round5/final-v0.0.28/actions-storage-cleanup.json`；后续最终产物体积在交付报告追加读回。[GitHub官方计费口径](https://docs.github.com/en/billing/concepts/product-billing/github-actions)。

最终发布后清理：保留新Release 410883610及最新UI、所有小诊断。第二阶段删除16份已校验归档副本，当前34份/65932941bytes（0.0614GiB）。20份历史Release不变。证据：final-v0.0.28/actions-storage-post-release.json；本期累计费用口径不因删除重置。
