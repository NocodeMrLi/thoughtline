# R6-07通用叠放效果
Spec：正式Thoughtline第六轮修复优化.md末尾R6-07。Base a719841/已发布0.0.33；0.0.34候选，不覆盖33。

产品变更仅auxiliary.css中calendar-stack的一个box-shadow声明：原3px/6px两层底纸，改统一3px一层底纸及低对比边。数字、跨日期提示、布局、模型、IO/IME/CAS/撤销均不改。

真实渲染RED：多张背面有2个平面，2!=1；GREEN检查1/2/5/9张、中英/浅深/740/350八组合，单张无底纸，多张外观一致；实际数字、日历14/3、跨日tooltip、1/5详情及返回4卡、全部纸数据和叠放归属保持。14相关unit/type/build退出0。截图已查看。没有新增镜像CSS字符串单测或重跑全套。

交付输入变更：版本/lock/Windows隔离启动器与preflight034绑定；new manual17min workflow仅4相关unit、source stack visual和新NSIS安装/重装/普通卸载保数据、实际安装app stackvisual。preflight可选StackVisualOnly只替换无关UI矩阵，其版本、图标、旧数据迁移、实际启动和保数据门禁全部保留；默认老入口不变，未执行无关UI不写PASS。

审查：本次执行者检查最小diff及实际渲染，不宣称新独立review。Mac/Windows实际新包及source/input/hash/install/release读回待执行。负责人上一版基本没问题按范围保留，仍不扩大完整物理验收。

连接：本机GitHub TLS/EOF连续失败，HTTP1/直连/同已有代理SOCKS均不能访问；没有改网络设置。GitHub插件只读比对main与a719841一致。异步请求负责人检查连接，本地工作继续。

本次继续刷新：本地HEAD2600d798（文档），371项冻结输入/Git对象及Mac最终DMG/归档asar与9cb8c19构建manifest逐项一致。GitHub命令行、替代单命令HTTPS/SOCKS/SSH443及插件连接仍失败；Apple HTTPS控制200，仅支持连接存在局部故障，不猜根因或额度。负责人当前不在电脑，不能操作网络。没有改系统配置、创建tag/发行、触发Actions或重跑已过检查。新增connection-refresh.json与归档R6-07操作报告草稿，双端NSIS来源核对工具已适配034/371并待实际Windows成功run及包，不以准备代替执行。剩余push/Windows/来源核对/发行继续保持未完成。
