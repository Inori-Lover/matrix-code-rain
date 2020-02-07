## 一个字符密度更高的矩阵演示

### 为什么写这个
在我打算实现一个matrix rain作为个人简历网站背景时，我发现没有一个实现时比较符合我个人对matrix rain的期望。在期望中我觉得matrix rain理应：
1. 有较高的字符密度：毕竟那可是matrix啊
2. 可以允许重叠但不能随意重叠：那是操作员read code的界面啊啊啊啊啊
3. 字符变动有一定的速率封顶：同上
4. 我希望比较有电影味道的字型而不是01或者常规字符甚至是正规中文字型

### 已经实现了：
1. 满屏的rain
2. rain code密度可调
3. 有差异但稳定的rain速度
4. 个人审美而言合适的字符变动速度

### TODO
- [ ] 速度稳定算法：现在rain速度范围是经验值，在超高配或超低配的终端可能产生比较明显的差异
- [ ] 更稳定的code密度实现：现在code密度虽说受到概率控制，但由于字符插入方式等实现时无法一一照顾概率平衡，所以极端情况下还是会出现概率与期望不符的问题
- [x] 在window大小变动时动态跟随调整canvas大小
