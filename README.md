# Oscar Map V2
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fsparrowhe%2Foscar-map-v2.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fsparrowhe%2Foscar-map-v2?ref=badge_shield)

Oscar Map V2 是一个基于 FSD 的飞行模拟器连飞地图应用，用于实时显示虚拟航空网络中的飞行员和管制员位置、飞行计划、管制区域等信息，提供直观的空中交通态势展示。

## 功能特性

### 核心功能
- 🗺️ **多地图源支持**：支持OpenStreetMap、Google Maps和天地图作为底图
- ✈️ **飞行员显示**：实时显示飞行员位置、航向、高度、速度等信息
- 👨‍✈️ **管制员显示**：显示管制员位置、频率和实际管制区域范围
- 📊 **详细数据面板**：查看飞行员和管制员的详细信息
- 🔍 **呼号搜索**：快速搜索并定位特定呼号的用户
- 🔄 **定期自动更新**：每5秒自动更新一次数据，保持信息实时性
- 🕒 **UTC时间显示**：实时显示协调世界时

### 高级特性
- 📍 **精确管制区域**：基于GeoJSON数据精确显示CTR和FSS管制区域边界
- 📝 **飞行计划查看**：显示飞行员的飞行计划路线
- 🎯 **地图事件监听**：支持地图弹窗交互和详情面板更新
- 💾 **本地设置保存**：保存用户偏好设置（地图类型、显示选项等）
- 📱 **响应式设计**：适配不同屏幕尺寸的设备

## 项目结构

```
├── LICENSE               # 开源许可证文件
├── Makefile              # 项目构建配置
├── README.md             # 项目说明文档
├── atis/                 # ATIS信息相关功能
│   ├── .gitignore
│   ├── config.example.js # ATIS配置示例
│   ├── main.js           # ATIS主要功能实现
│   ├── package.json      # ATIS依赖配置
│   └── yarn.lock         # 依赖锁定文件
├── data.php              # 数据获取和处理接口
├── index.html            # 主页面
├── static/               # 静态资源目录
│   ├── config.example.json # 应用配置示例
│   ├── css/              # 样式文件
│   │   ├── external/     # 外部CSS库
│   │   ├── fonts/        # 字体文件
│   │   ├── icons/        # 图标文件
│   │   ├── images/       # 图片资源
│   │   └── ocsar-map-v2.core.css # 核心样式文件
│   ├── data/             # 地理数据文件
│   │   ├── data.dat      # 扇区元数据
│   │   └── sectors.geojson # 管制区域地理边界数据
│   ├── image/            # 应用图片
│   │   ├── airplane.png  # 飞机图标
│   │   ├── airplane_va.png # 虚拟航司飞机图标
│   │   └── headset_mic.png # 管制图标
│   └── js/               # JavaScript文件
│       ├── external/     # 外部JS库
│       └── oscar-map-v2.core.js # 核心功能实现
├── thanks.html           # 致谢页面
└── track/                # 航迹和航路功能
    ├── README.md         # 航迹功能说明
    ├── json.php          # 航迹数据JSON接口
    ├── sql1.sql          # 航迹数据库表结构1
    ├── sql2.sql          # 航迹数据库表结构2
    ├── sql3.sql          # 导航数据数据库表结构
    └── task.php          # 航迹数据定时任务
```

## 安装与配置

### 基础安装
1. 将本项目放置到您的Web服务器目录下
2. 将 `static/config.example.json` 重命名为 `static/config.json`，并填入您的天地图API密钥
   ```json
   {
       "token": {
           "tianditu": "您的天地图API密钥"
       }
   }
   ```
3. 根据您的需求修改 `data.php` 文件中的数据源配置

### 航迹功能安装（可选）
航迹功能允许显示历史飞行轨迹和计划航路，安装步骤：
1. 导入数据库表结构：
   - `track/sql1.sql` - 地图的航路航迹模块
   - `track/sql2.sql` - 详细的航行数据记录
   - `track/sql3.sql` - 导航数据（需参照PMDG导航数据进行导入）
2. 配置数据库连接信息：
   - 在 `track/task.php` 和 `track/json.php` 中修改数据库连接参数
3. 启动定时任务：
   ```bash
   php task.php
   ```
4. 注意：如果服务器性能有限，请考虑简化 `track/json.php` 中的 `get_r` 函数

### 航向显示配置
要启用航向显示功能，需要修改FSD服务器源码：
1. 找到FSD源码中的 `fsd.cpp` 文件，大约在165行左右，fsd1110 已经修改好了，可以直接使用。
2. 将原始代码修改为：
   ```cpp
   sprintf(dataseg7, "::::::%s:%s", sprintgmt(tempclient->starttime,s), tempclient->pbh);
   ```

## 使用说明

### 基本操作
- **切换地图源**：在设置中可以选择OpenStreetMap、Google Maps或天地图
- **搜索呼号**：在搜索框中输入呼号后按回车，地图会自动定位到该用户位置
- **查看详情**：点击地图上的标记或表格中的行，可查看详细信息
- **过滤显示**：可以设置显示或隐藏飞行员、管制员、管制范围等元素

### 数据来源
应用默认配置了两个数据源：
- XNATC：`http://www.sparrowhe.top/whazzup.txt`  
- XHAir：`http://www.xiaohangair.com/vam/dataxn.php`  

您可以在 `data.php` 文件中根据需要修改或添加数据源

## 技术实现

### 核心组件
- **OscarMapApp** 类：应用的核心类，封装了所有功能和数据处理逻辑
- **地图初始化**：使用Leaflet.js实现交互式地图功能
- **数据处理**：通过AJAX从 `data.php` 获取数据并进行处理
- **管制区域显示**：通过加载 `data.dat` 和 `sectors.geojson` 文件显示精确的管制区域边界

### 数据加载流程
1. 应用初始化时调用 `loadSectorData()` 方法
2. `loadSectorData()` 内部调用 `loadFIRData()` 和 `loadGeoJSONData()` 分别加载扇区元数据和地理边界数据
3. 当显示ATC管制员时，系统根据管制员呼号调用 `getCTRRange()` 和 `getFSSRange()` 方法查找并显示实际管制范围

## 开源协议

本项目基于 Phosphorus Public License 开源。
- 允许个人用户不受限制直接使用 Oscar Map V2
- 非个人用户（包括但不限于社区、营利性组织）需要购买必要的商业许可
- 若您对源码做出修改，同样需要以 Phosphorus Public License 开源

## License

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fsparrowhe%2Foscar-map-v2.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fsparrowhe%2Foscar-map-v2?ref=badge_large)