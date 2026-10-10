# Thoughtline 0.0.17-preview.5

日期2026-10-10。用户批准方案先保存后执行，独立主方案为项目文档Thoughtline第二轮修复优化.md。本轮自查与自动化完成；不代表用户或下一轮独立验收通过。

## 实现状态

提示缩短/延迟并在菜单打开时隐藏；月/年网格随窗口高度自适应，左右箭头36DIP；设置增加返回，保留日/月/年、搜索/筛选、准确滚动与窗口几何；右键收起当前单张；Agent编辑描边四边完整；名称统一Thoughtline日历 / Thoughtline Calendar。Windows原生菜单在用户明确右键期间使用前台所属窗口，取消/选择后恢复非激活，支持外点/Esc/子菜单。

新增已确认“自动整理”：现有左右顺序、172DIP安全间距、完整空位集中在右侧；筛选隐藏夹子也参与；内容/ID/分组/当前页保持，180ms归位可打断。位置撤销保留后续页码，不能恢复已删项目。新建/拆分不自动重排。系统与应用减少动态效果分别尊重。主界面仍只有绳/夹子/纸张，纸张维持哑光纸感。

流畅度完成测量和旧动效/编辑/快速翻页回归；Mac导航输入加两个帧p50=67ms/p95=69ms、Windows受控p50=78ms/p95=84ms，基线Mac66ms。不据细小波动宣称显著优化，实际手感待独立测试。

## 分支和源码

- 分支main。阶段提交036bc95ff24b5dea65497f4e57e445aa29e5754e、d5a8d23dbc8638e9781d5d93bbe3800130f1c4e8、16ddc091f09c2f4392d9510d5e2a84eaf510515c。
- 构建/tag冻结60453773034347e1b49ccfd5d1cd42657e9ac60c；最后仅文档/证据提交另记main HEAD，不混称包源码。无强推或改写历史，G7及12工作树保留。
- 同源236个生产/构建/测试输入，209项仅精确CRLF差异。Mac包内33项实际输入哈希验证；双端main/preload/renderer JS及品牌资产一致；CSS换行与HTML中的派生文件名/源CRLF及Vite注入LF逐字节核对，精确SHA256通过。

## 双端安装包

本地目录：/Users/lihongwei/Documents/Codex/2026-10-10/thoughtline-round2-repair/delivery/v0.0.17-preview.5。

| 平台 | 包 | SHA256 |
|---|---|---|
| Mac arm64 | Thoughtline-0.0.17-preview.5-mac-arm64.dmg | `3250b502a9f22c88ed420d04e553cefddf2ed008a2c59cbdb45351e64dbd3d93` |
| Windows x64 | Thoughtline-0.0.17-preview.5-win-x64.exe | `69b7774cb2a69ca103e0bb03809f5f2ec44481ea045a08b8781f526bad4698f7` |

私有[Release v0.0.17-preview.5](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.17-preview.5)：23资产服务端SHA256/大小与本地完全一致，tag指向上述冻结源码。regular release（draft=false/prerelease=false），历史preview后缀用于追踪。本项目不安排商业签名/公证；Mac本地ad-hoc，Windows未签名，按正常系统信任提示安装，不关闭安全保护。旧preview.4仍17资产，双端原哈希不变，preview.6等历史版本保留。

## 测试与未测

Mac15.3.1 arm64、Node24.19.0、Electron44.7.0：类型/构建通过，233单测通过，4Windows适用跳过。Windows GitHub windows-latest x64，CI[38018943609](https://github.com/NocodeMrLi/thoughtline/actions/runs/38018943609)全步骤成功，237单测通过。

双端源9界面/3日历返回/7整理检查通过。Windows托管真实原生另进程外点3次、Agent子菜单与Esc通过；Mac原生程序取消通过，真实Mac桌面外点未测。双端原编辑/日历缩放/几何/存储故障与备份恢复/英文昼夜回归通过。实际Mac包6数据/编辑/恢复及3外观检查通过；Windows实际安装、同版重装、普通卸载保留数据和包内编译输入绑定通过；双端实际包顶部慢移向纸张复制/展开与隐藏/呼出通过。

用户Windows版本preview.4，系统/DPI未提供。物理IME、100%/125%/150%、多屏、焦点/穿透、外盘断开、真实接收框与日历手感未独立验收。微信4.1.13.65成功/QQ浏览器豆包不稳定/WorkBuddy5.7.6反复失败是用户反馈，不冒充开发者独立复现。逐项步骤和报告格式见[独立验证清单](../testing/ROUND2-INDEPENDENT-QA.md)。保留全部失败记录，不放宽产品断言换通过。

## 数据、回滚和清理

schema3及preferences.json沿用，无新增格式升级。旧schema2迁移保留副本；独立备份真实恢复重启两次、迁移故障退回原位置通过。回滚前保留最新数据，隔离验证备份；preview.6不兼容schema3，不能直接读取新数据。升级前备份不含后续修改。Windows同应用安装可能替换已有安装，先正常退出并备份；Mac隔离启动不替换/Applications应用。

自建测试正常关闭并确认PID退出，已清理测试profile、下载重复包和临时构建clone，回收约875.8MiB。必要成功/失败证据、双端交付、回滚包保留；用户运行PID67908和真实数据未动，依赖及12既有工作树保留。准确清理记录见acceptance/evidence/round2/cleanup-final.json。

README七种文档翻译同步本版下载、徽章与自动整理描述，应用仍为中文/English；展示图/GIF按用户要求继续后置。
