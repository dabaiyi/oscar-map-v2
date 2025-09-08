class OscarMapApp {
    constructor() {
        this.map = null;
        this.player = [];
        this.openCallsign = null;
        this.FIRs = [];
        this.UIRs = [];
        this.Geos = [];
        this.inst = null;
    }

    // 初始化地图和应用
    init() {
        this.mduiInit();
        this.setupLogging();
        this.initializeMap();
        this.loadLocalStorageSettings();
        this.loadSectorData();
        
        // 开始定期更新
        this.updateMap();
        setInterval(() => this.updateMap(), 5000);
        
        // 设置UTC时间显示
        this.setUTCTime();
        setInterval(() => this.setUTCTime(), 1000);
    }

    // 初始化MDUI组件
    mduiInit() {
        mdui.mutation();
        this.inst = new mdui.Tab("#tab");
        this.inst.show(0);
    }

    // 设置日志输出
    setupLogging() {
        console.log('%cOscar Map', 'color: black; font-size: 24px; font-weight: bold;');
        console.log('%c版权所有：Sparrow He', 'color: black; font-size: 15px;');
        console.log('%c禁止一切侵权行为，购买使用授权请联系QQ：1441373096', 'color: black; font-size: 15px;');
    }

    // 初始化地图
    initializeMap() {
        this.map = L.map('map').setView([34, 110], 5);
        this.setupMapLayers();
        
        // 设置地图事件监听器
        this.setupMapEventListeners();
    }

    // 设置地图图层
    setupMapLayers() {
        // 附加图层
        const atcB = L.tileLayer("https://tiles.flightradar24.com/atc_boundaries/{z}/{x}/{y}/tile.png", {
            attribution: '<a href="https://www.flightradar24.com/">Flightradar24</a>',
        });
        const hRTE = L.tileLayer("https://tiles.flightradar24.com/navdata_ha/{z}/{x}/{y}/tile.png", {
            attribution: '<a href="https://www.flightradar24.com/">Flightradar24</a>',
        });
        const lRTE = L.tileLayer("https://tiles.flightradar24.com/navdata_la/{z}/{x}/{y}/tile.png", {
            attribution: '<a href="https://www.flightradar24.com/">Flightradar24</a>',
        });

        // 图层控制
        L.control.layers.tree({}, {
            label: '附加图层',
            children: [
                { label: '管制边界', layer: atcB },
                { label: '全球高空航路', layer: hRTE },
                { label: '全球低空航路', layer: lRTE }
            ]
        }).addTo(this.map);

        // 根据本地存储设置底图
        this.setBaseMap();
    }

    // 设置底图
    setBaseMap() {
        const mapType = localStorage.getItem("map");
        
        if (!mapType || mapType === "osm") {
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a>, <a>鲁ICP备2021029425号</a>',
                maxZoom: 18,
            }).addTo(this.map);
        } else if (mapType === "google") {
            L.tileLayer('https://www.google.cn/maps/vt?lyrs=s@189&x={x}&y={y}&z={z}', {
                attribution: 'Map data © <a href="https://map.google.cn">Google</a>, <a>鲁ICP备2021029425号</a>',
                maxZoom: 18,
            }).addTo(this.map);
        } else if (mapType === "tianditu") {
            this.map.setView([34, 110], 5);
            $.ajax({
                url: "static/config.json",
                dataType: "json",
                success: (data) => {
                    L.tileLayer(`https://t0.tianditu.gov.cn/img_w/wmts?layer=img&style=default&tilematrixset=w&Service=WMTS&Request=GetTile&Version=1.0.0&Format=tiles&TileMatrix={z}&TileCol={x}&TileRow={y}&tk=${data.token.tianditu}`, {
                        maxZoom: 18,
                        attribution: 'Map data © <a href="https://www.tianditu.gov.cn">天地图</a>, <a>鲁ICP备2021029425号</a>',
                    }).addTo(this.map);
                }
            });
        }
    }

    // 加载本地存储设置
    loadLocalStorageSettings() {
        // 显示设置
        this.checkShowPilot();
        this.checkShowATC();
        this.checkShowRange();
        this.checkShowObs();
        this.checkMapSelected();
        
        // 标签设置
        this.checkTagIcon();
        this.checkTagCallsign();
        this.checkTagLeg();
        this.checkTagAlt();
        this.checkTagType();
        this.checkPilotTrack();
        this.checkPilotPlan();
    }

    // 检查并设置飞行员显示
    checkShowPilot() {
        if (localStorage.getItem("show-pilot") === "false") {
            $("#show-pilot").prop("checked", false);
        }
    }

    // 检查并设置ATC显示
    checkShowATC() {
        if (localStorage.getItem("show-atc") === "false") {
            $("#show-atc").prop("checked", false);
        }
    }

    // 检查并设置范围显示
    checkShowRange() {
        if (localStorage.getItem("show-range") === "false") {
            $("#show-range").prop("checked", false);
        }
    }

    // 检查并设置观察员显示
    checkShowObs() {
        if (localStorage.getItem("show-obs") === "false") {
            $("#show-obs").prop("checked", false);
        }
    }

    // 检查并设置地图选择
    checkMapSelected() {
        const mapType = localStorage.getItem("map");
        if (mapType === "google") {
            $("#google").prop("checked", true);
        } else if (mapType === "tianditu") {
            $("#tianditu").prop("checked", true);
        }
    }

    // 检查并设置标签图标
    checkTagIcon() {
        if (localStorage.getItem("tag-icon") === "true") {
            $("#tag-icon").prop("checked", true);
        }
    }

    // 检查并设置呼号标签
    checkTagCallsign() {
        if (localStorage.getItem("tag-callsign") === "true") {
            $("#tag-callsign").prop("checked", true);
        }
    }

    // 检查并设置航线标签
    checkTagLeg() {
        if (localStorage.getItem("tag-leg") === "true") {
            $("#tag-leg").prop("checked", true);
        }
    }

    // 检查并设置高度标签
    checkTagAlt() {
        if (localStorage.getItem("tag-alt") === "true") {
            $("#tag-alt").prop("checked", true);
        }
    }

    // 检查并设置机型标签
    checkTagType() {
        if (localStorage.getItem("tag-type") === "true") {
            $("#tag-type").prop("checked", true);
        }
    }

    // 检查并设置飞行员航迹
    checkPilotTrack() {
        if (localStorage.getItem("pilot-track") === "false") {
            $("#pilot-track").prop("checked", false);
        }
    }

    // 检查并设置飞行员计划
    checkPilotPlan() {
        if (localStorage.getItem("pilot-plan") === "false") {
            $("#pilot-plan").prop("checked", false);
        }
    }

    // 更新地图数据
    updateMap() {
        $.ajax({
            url: "/data.php",
            success: (data) => {
                this.processMapData(data);
            }
        });
    }

    // 处理地图数据
    processMapData(data) {
        let n = data.split("\n");
        n.pop();
        
        // 数据校验
        if (n[0] === "::::::::0::::0:XNATC::" && this.player.length === 0) {
            return;
        }
        
        // 过滤非ATC和PILOT数据
        for (let i = 0; i < n.length; i++) {
            let d = n[i].split(":");
            if (d[0] !== "ATC" && d[0] !== "PILOT") {
                n.splice(i, 1);
                i--;
            }
        }
        
        // 清理不存在的玩家
        this.cleanupPlayers(n);
        
        // 清理空呼号玩家
        this.cleanupEmptyCallsigns();
        
        // 处理新数据
        this.processNewData(n);
        
        // 添加标记
        this.addMark();
    }

    // 清理不存在的玩家
    cleanupPlayers(newData) {
        for (let i = 0; i < this.player.length; i++) {
            let d = this.player[i];
            let flag = false;
            
            for (let j = 0; j < newData.length; j++) {
                let k = newData[j].split(":");
                if (k[2] === d.callsign) {
                    flag = true;
                    break;
                }
            }
            
            if (!flag && d.callsign !== "") {
                this.removePlayer(i);
                i--;
                mdui.updateTables();
            }
        }
    }

    // 清理空呼号玩家
    cleanupEmptyCallsigns() {
        for (let i = 0; i < this.player.length; i++) {
            if (this.player[i].callsign === "") {
                this.player.splice(i, 1);
                i--;
            }
        }
    }

    // 移除玩家
    removePlayer(index) {
        const player = this.player[index];
        
        // 移除地图上的图层
        if (player.marker != null) this.map.removeLayer(player.marker);
        if (player.circle != null) this.map.removeLayer(player.circle);
        if (player.realRange != null) this.map.removeLayer(player.realRange);
        if (player.polyline) this.map.removeLayer(player.polyline);
        if (player.plan) this.map.removeLayer(player.plan);
        
        // 移除表格行
        $(`#${player.type.toLowerCase()}-body tr#${player.callsign}`).remove();
        
        // 从数组中移除
        this.player.splice(index, 1);
    }

    // 处理新数据
    processNewData(data) {
        for (let i = 0; i < data.length; i++) {
            let t = data[i].split(":");
            
            // 清理数据
            for (let j = 0; j < t.length; j++) {
                t[j] = t[j].trim();
            }
            
            // 创建玩家对象
            let d = this.createPlayerObject(t);
            
            // 数据校验
            if (isNaN(d.lat) || isNaN(d.lng) || isNaN(d.callsign)) {
                continue;
            }
            
            // 检查是否已存在该呼号
            const index = this.checkDumpCallsign(d.callsign);
            if (index === -1) {
                // 新增玩家
                this.player.push(d);
            } else {
                // 更新现有玩家
                this.player[index] = d;
            }
        }
    }

    // 创建玩家对象
    createPlayerObject(data) {
        let d = {};
        d.type = data[0];
        d.id = data[1];
        d.callsign = data[2];
        d.freq = parseFloat(data[3]).toFixed(3);
        d.lat = parseFloat(data[4]);
        d.lng = parseFloat(data[5]);
        d.alt = parseFloat(data[6]);
        d.gs = parseFloat(data[7]);
        d.heading = data[8];
        d.dep = data[9];
        d.arr = data[10];
        d.route = data[11];
        d.radarRange = this.convertRange(parseFloat(data[12]));
        d.from = data[13];
        
        // 设置来源
        if (d.id.startsWith("F") || d.id.startsWith("A") || d.id.startsWith("S")) {
            d.from = "FSCenter";
        }
        
        d.squawk = data[14].padStart(4, 0);
        d.actype = data[15];
        d.circle = null;
        d.marker = null;
        d.realRange = null;
        
        // 检查并继承已有对象的属性
        const index = this.checkDumpCallsign(d.callsign);
        if (index !== -1) {
            d.marker = this.player[index].marker;
            d.circle = this.player[index].circle;
            d.realRange = this.player[index].realRange;
            d.tooltip = this.player[index].tooltip;
            d.polyline = this.player[index].polyline || L.featureGroup();
            d.plan = this.player[index].plan || L.polyline([], { color: "grey", weight: 6, opacity: 0.5 });
            d.planMarkerList = this.player[index].planMarkerList || L.featureGroup();
            d.atcinfo = this.player[index].atcinfo || "";
        } else {
            // 初始化新对象的属性
            d.polyline = L.featureGroup();
            d.plan = L.polyline([], { color: "grey", weight: 6, opacity: 0.5 });
            d.planMarkerList = L.featureGroup();
            d.atcinfo = "";
        }
        
        return d;
    }

    // 转换范围
    convertRange(range) {
        // 这里应该有具体的转换逻辑
        return range;
    }

    // 检查呼号是否已存在
    checkDumpCallsign(callsign) {
        for (let i = 0; i < this.player.length; i++) {
            if (this.player[i].callsign === callsign) {
                return i;
            }
        }
        return -1;
    }

    // 添加标记
    addMark() {
        for (let i = 0; i < this.player.length; i++) {
            const d = this.player[i];
            
            // 根据设置决定是否显示
            if (!this.shouldShowPlayer(d)) {
                continue;
            }
            
            // 创建或更新标记
            if (d.marker === null) {
                this.createNewMarker(i, d);
            } else {
                this.updateExistingMarker(i, d);
            }
        }
    }

    // 判断是否应该显示玩家
    shouldShowPlayer(player) {
        if (player.type === "PILOT" && localStorage.getItem("show-pilot") === "false") {
            return false;
        }
        
        if (player.type === "ATC") {
            if (localStorage.getItem("show-atc") === "false") {
                return false;
            }
            
            if (player.callsign.includes("OBS") && localStorage.getItem("show-obs") === "false") {
                return false;
            }
        }
        
        return true;
    }

    // 创建新标记
    createNewMarker(index, d) {
        if (d.type === "ATC" && d.lat && d.lng) {
            this.createATCMarker(index, d);
        } else if (d.type === "PILOT" && d.lat && d.lng) {
            this.createPilotMarker(index, d);
        }
    }

    // 创建ATC标记
    createATCMarker(index, d) {
        const icon = L.icon({
            iconUrl: 'static/image/headset_mic.png',
            iconSize: [25, 25],
            iconAnchor: [12.5, 12.5],
            popupAnchor: [0, -15]
        });
        
        const marker = L.marker([d.lat, d.lng], {
            icon: icon,
            alt: d.callsign
        });
        
        const circle = L.circle([d.lat, d.lng], {
            color: '#ff0000',
            fillColor: '#ff0000',
            fillOpacity: 0.3,
            radius: d.radarRange,
            alt: d.callsign
        });
        
        // 获取实际管制范围
        let realRange = null;
        if (d.callsign.indexOf("CTR") !== -1) {
            realRange = this.getCTRRange(d.callsign);
        } else if (d.callsign.indexOf("FSS") !== -1) {
            realRange = this.getFSSRange(d.callsign);
        }
        
        // 根据设置添加到地图
        this.addATCMarkerToMap(marker, circle, realRange, d);
        
        // 绑定弹出窗口
        this.bindATCPopup(marker, circle, d);
        
        // 添加到表格
        this.addATCToTable(d);
        
        // 保存引用
        this.player[index].marker = marker;
        this.player[index].circle = circle;
        this.player[index].realRange = realRange;
    }

    // 获取CTR管制范围
    getCTRRange(callsign) {
        const id = callsign.split("_")[0];
        for (let j = 0; j < this.FIRs.length; j++) {
            if (this.FIRs[j].prefix === id || (this.FIRs[j].prefix === "" && this.FIRs[j].icao === id)) {
                const range = this.Geos[this.FIRs[j].boundary].coordinates[0][0];
                
                // 交换经纬度顺序
                for (let k = 0; k < range.length; k++) {
                    const temp = range[k][0];
                    range[k][0] = range[k][1];
                    range[k][1] = temp;
                }
                
                return L.polygon(range, {color: 'blue'});
            }
        }
        return null;
    }

    // 获取FSS管制范围
    getFSSRange(callsign) {
        const id = callsign.split("_")[0];
        for (let j = 0; j < this.UIRs.length; j++) {
            if (this.UIRs[j].prefix === id) {
                const covered = this.UIRs[j].cover.split(",");
                const range = [];
                
                // 收集所有覆盖区域的坐标
                for (let k = 0; k < covered.length; k++) {
                    range.push(this.Geos[covered[k]].coordinates);
                }
                
                // 交换所有经纬度顺序
                for (let k = 0; k < range.length; k++) {
                    const temp = range[k];
                    for (let l = 0; l < temp.length; l++) {
                        const temp2 = temp[l];
                        for (let m = 0; m < temp2.length; m++) {
                            const temp3 = temp2[m];
                            for (let n = 0; n < temp3.length; n++) {
                                const temp4 = temp3[n];
                                const temp5 = temp4[0];
                                temp4[0] = temp4[1];
                                temp4[1] = temp5;
                                temp3[n] = temp4;
                            }
                            temp2[m] = temp3;
                        }
                        range[k] = temp;
                    }
                }
                
                // 创建多边形
                return L.polygon(range, {color: 'blue'});
            }
        }
        return null;
    }

    // 添加ATC标记到地图
    addATCMarkerToMap(marker, circle, realRange, d) {
        marker.addTo(this.map);
        
        if (localStorage.getItem("show-range") !== "false") {
            circle.addTo(this.map);
        }
        
        if (realRange && localStorage.getItem("show-range") !== "false") {
            realRange.addTo(this.map);
        }
    }

    // 绑定ATC弹出窗口
    bindATCPopup(marker, circle, d) {
        const popupContent = `
            <div class="popup-container">
                <h4>${d.callsign}</h4>
                <p><strong>频率:</strong> ${d.freq}</p>
                <p><strong>来源:</strong> ${d.from}</p>
                ${d.atcinfo}
            </div>
        `;
        
        marker.bindPopup(popupContent);
        if (circle) {
            circle.bindPopup(popupContent);
        }
    }

    // 更新ATC详情面板
    updateATCDetailPanel(d) {
        // 实现更新ATC详情面板的逻辑
    }

    // 添加ATC到表格
    addATCToTable(d) {
        // 检查表格中是否已存在该行
        if ($(`#atc-body tr#${d.callsign}`).length === 0) {
            const row = `
                <tr id="${d.callsign}" onclick="window.oscarMapApp.clickPlayerInList(this)">
                    <td>${d.callsign}</td>
                    <td>${d.freq}</td>
                    <td>${d.from}</td>
                </tr>
            `;
            $("#atc-body").append(row);
            mdui.updateTables();
        }
    }

    // 创建飞行员标记
    createPilotMarker(index, d) {
        // 设置飞机图标
        const icon = L.icon({
            iconUrl: 'static/image/airplane.png',
            iconSize: [25, 25],
            iconAnchor: [12.5, 12.5],
            popupAnchor: [0, -15],
            rotationAngle: d.heading
        });
        
        const marker = L.marker([d.lat, d.lng], {
            icon: icon,
            alt: d.callsign,
            rotationAngle: d.heading
        });
        
        // 添加到地图
        marker.addTo(this.map);
        
        // 创建和绑定标签
        this.createAndBindPilotTooltip(marker, d);
        
        // 绑定弹出窗口
        this.bindPilotPopup(marker, d);
        
        // 添加到表格
        this.addPilotToTable(d);
        
        // 保存引用
        this.player[index].marker = marker;
        
        // 添加飞行路径
        if (localStorage.getItem("pilot-track") !== "false") {
            this.addPath(index, d);
        }
        
        // 添加飞行计划
        if (localStorage.getItem("pilot-plan") !== "false" && d.route) {
            this.addFlightPlanFromRoute(index, d.route);
        }
    }

    // 创建和绑定飞行员标签
    createAndBindPilotTooltip(marker, d) {
        const tooltipContent = this.createPilotTooltipContent(d);
        const tooltip = marker.bindTooltip(tooltipContent, {
            permanent: localStorage.getItem("tag-callsign") === "true",
            direction: 'top'
        });
        
        // 保存引用
        for (let i = 0; i < this.player.length; i++) {
            if (this.player[i].callsign === d.callsign) {
                this.player[i].tooltip = tooltip;
                break;
            }
        }
    }

    // 创建飞行员标签内容
    createPilotTooltipContent(d) {
        let content = `<div class="pilot-tooltip">`;
        
        // 根据设置添加不同的标签内容
        if (localStorage.getItem("tag-callsign") === "true") {
            content += `<div class="callsign">${d.callsign}</div>`;
        }
        
        if (localStorage.getItem("tag-leg") === "true" && d.dep && d.arr) {
            content += `<div class="route">${d.dep}-${d.arr}</div>`;
        }
        
        if (localStorage.getItem("tag-alt") === "true" && d.alt) {
            content += `<div class="altitude">${Math.round(d.alt)}ft</div>`;
        }
        
        if (localStorage.getItem("tag-type") === "true" && d.actype) {
            content += `<div class="aircraft">${d.actype}</div>`;
        }
        
        content += `</div>`;
        return content;
    }

    // 绑定飞行员弹出窗口
    bindPilotPopup(marker, d) {
        const popupContent = `
            <div class="popup-container">
                <h4>${d.callsign}</h4>
                <p><strong>机型:</strong> ${d.actype}</p>
                <p><strong>高度:</strong> ${Math.round(d.alt)}ft</p>
                <p><strong>速度:</strong> ${d.gs}kt</p>
                <p><strong>航向:</strong> ${d.heading}°</p>
                <p><strong>航线:</strong> ${d.dep}-${d.arr}</p>
                <p><strong>应答机:</strong> ${d.squawk}</p>
            </div>
        `;
        
        marker.bindPopup(popupContent);
    }

    // 添加飞行员到表格
    addPilotToTable(d) {
        // 检查表格中是否已存在该行
        if ($(`#pilot-body tr#${d.callsign}`).length === 0) {
            const row = `
                <tr id="${d.callsign}" onclick="window.oscarMapApp.clickPlayerInList(this)">
                    <td>${d.callsign}</td>
                    <td>${d.actype}</td>
                    <td>${d.dep}</td>
                    <td>${d.arr}</td>
                    <td>${Math.round(d.alt)}ft</td>
                    <td>${d.gs}kt</td>
                </tr>
            `;
            $("#pilot-body").append(row);
            mdui.updateTables();
        }
    }

    // 更新现有标记
    updateExistingMarker(index, d) {
        if (d.type === "PILOT") {
            this.updatePilotMarker(index, d);
        } else if (d.type === "ATC") {
            this.updateATCMarker(index, d);
        }
    }

    // 更新飞行员标记
    updatePilotMarker(index, d) {
        const marker = this.player[index].marker;
        
        // 更新位置和方向
        marker.setLatLng([d.lat, d.lng]);
        marker.options.rotationAngle = d.heading;
        
        // 更新标签
        this.updatePilotTooltip(index, d);
        
        // 更新弹出窗口
        this.bindPilotPopup(marker, d);
        
        // 更新表格
        this.updatePilotTable(d);
        
        // 更新飞行路径
        if (localStorage.getItem("pilot-track") !== "false") {
            this.addPath(index, d);
        }
        
        // 更新飞行计划
        if (localStorage.getItem("pilot-plan") !== "false" && d.route) {
            this.addFlightPlanFromRoute(index, d.route);
        }
    }

    // 更新飞行员标签
    updatePilotTooltip(index, d) {
        if (this.player[index].tooltip && localStorage.getItem("tag-callsign") === "true") {
            const tooltipContent = this.createPilotTooltipContent(d);
            this.player[index].marker.setTooltipContent(tooltipContent);
        }
    }

    // 更新飞行员表格
    updatePilotTable(d) {
        const row = $(`#pilot-body tr#${d.callsign}`);
        if (row.length > 0) {
            row.find("td:eq(1)").text(d.actype);
            row.find("td:eq(2)").text(d.dep);
            row.find("td:eq(3)").text(d.arr);
            row.find("td:eq(4)").text(`${Math.round(d.alt)}ft`);
            row.find("td:eq(5)").text(`${d.gs}kt`);
        }
    }

    // 更新ATC标记
    updateATCMarker(index, d) {
        const marker = this.player[index].marker;
        const circle = this.player[index].circle;
        
        // 更新位置
        marker.setLatLng([d.lat, d.lng]);
        if (circle) {
            circle.setLatLng([d.lat, d.lng]);
        }
        
        // 更新弹出窗口
        this.bindATCPopup(marker, circle, d);
        
        // 更新表格
        this.updateATCTable(d);
    }

    // 更新ATC表格
    updateATCTable(d) {
        const row = $(`#atc-body tr#${d.callsign}`);
        if (row.length > 0) {
            row.find("td:eq(1)").text(d.freq);
            row.find("td:eq(2)").text(d.from);
        }
    }

    // 添加飞行路径
    addPath(index, d) {
        const points = [];
        
        // 检查是否有经纬度数据
        if (d.lat && d.lng) {
            // 创建带高度信息的点
            const point = L.latLng(d.lat, d.lng);
            point.alt = d.alt;
            points.push(point);
            
            try {
                // 设置彩色高度渐变
                const altThresholds = [
                    1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000,
                    11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000, 20000,
                    21000, 22000, 23000, 24000, 25000, 26000, 27000, 28000, 29000, 30000,
                    31000, 32000, 33000, 34000, 35000, 36000, 37000, 38000, 39000, 40000
                ];
                
                // 颜色映射
                const colors = [
                    {color: '#757b85'}, {color: '#757b85'}, {color: '#757b85'},
                    {color: '#757b85'}, {color: '#757b85'}, {color: '#757b85'},
                    {color: '#757b85'}, {color: '#757b85'}, {color: '#757b85'},
                    {color: '#757b85'},
                    {color: '#ffc300'}, {color: '#ffc700'}, {color: '#ffcb00'},
                    {color: '#ffd100'}, {color: '#ffd500'}, {color: '#ffd900'},
                    {color: '#ffdb01'}, {color: '#ffe000'}, {color: '#ffe300'},
                    {color: '#f9e502'},
                    {color: '#eee506'}, {color: '#dfe50a'}, {color: '#cfe50e'},
                    {color: '#bde512'}, {color: '#a9e518'}, {color: '#95e51e'},
                    {color: '#81e524'}, {color: '#6ae32a'}, {color: '#56e330'},
                    {color: '#42e138'},
                    {color: '#30df40'}, {color: '#20df46'}, {color: '#11dd4e'},
                    {color: '#06db56'}, {color: '#00db5e'}, {color: '#00db68'},
                    {color: '#01db72'}, {color: '#00db7e'}, {color: '#00db8b'},
                    {color: '#00db99'}
                ];
                
                // 创建多选项折线
                const polyline = L.multiOptionsPolyline(points, {
                    multiOptions: {
                        optionIdxFn: function (latLng) {
                            for (let k = 0; k < altThresholds.length; ++k) {
                                if (latLng.alt <= altThresholds[k]) {
                                    return k;
                                }
                            }
                            return altThresholds.length;
                        },
                        options: colors
                    },
                    weight: 5,
                    lineCap: 'round',
                    opacity: 1,
                    smoothFactor: 1
                });
                
                // 添加到地图
                polyline.addTo(this.player[index].polyline);
                
                // 限制航迹点数量
                this.limitTrackPoints(index);
            } catch (error) {
                console.error("创建飞行路径失败:", error);
            }
        }
    }

    // 限制航迹点数量
    limitTrackPoints(index) {
        const featureGroup = this.player[index].polyline;
        const layers = featureGroup.getLayers();
        while (layers.length > 5) {
            featureGroup.removeLayer(layers[0]);
        }
    }

    // 清除飞行航迹
    clearFlightTrack(index) {
        const featureGroup = this.player[index].polyline;
        featureGroup.clearLayers();
    }

    // 添加飞行计划
    addFlightPlan(index, plan) {
        const planPoints = [];
        for (let i = 0; i < plan.length; i++) {
            if (plan[i].length >= 3) {
                planPoints.push(L.latLng(plan[i][1], plan[i][2]));
            }
        }
        
        if (planPoints.length > 0) {
            this.player[index].plan.setLatLngs(planPoints);
        }
    }

    // 从航线添加飞行计划
    addFlightPlanFromRoute(index, route) {
        // 解析航线并添加飞行计划
        // 这里应该有具体的航线解析逻辑
    }

    // 清除飞行计划
    clearFlightPlan(index) {
        this.player[index].plan.setLatLngs([]);
    }

    // 加载扇区数据
    loadSectorData() {
        this.loadFIRData();
        this.loadGeoJSONData();
    }
    
    // 设置地图事件监听器
    setupMapEventListeners() {
        // 弹出窗口打开事件
        this.map.on('popupopen', (e) => {
            let marker = e.popup._source;
            let callsign = marker.options.alt;
            const index = this.checkDumpCallsign(callsign);
            
            if (index !== -1) {
                const player = this.player[index];
                
                if (player.type === "PILOT") {
                    player.polyline.addTo(this.map);
                    player.plan.addTo(this.map);
                }
                
                this.updateDetailPanel(player);
            }
        });
        
        // 弹出窗口关闭事件
        this.map.on('popupclose', (e) => {
            let marker = e.popup._source;
            let callsign = marker.options.alt;
            const index = this.checkDumpCallsign(callsign);
            
            if (index !== -1) {
                const player = this.player[index];
                
                if (player.type === "PILOT") {
                    this.map.removeLayer(player.polyline);
                    this.map.removeLayer(player.plan);
                }
            }
            
            // 重置详情面板
            const detailDOM = $("#detail-body");
            detailDOM.html("<p>请先选中一个机组或管制员</p>");
            
            if (this.inst) {
                this.inst.show(0);
            }
        });
    }
    
    // 更新详情面板
    updateDetailPanel(player) {
        const detailDOM = $("#detail-body");
        
        if (player.type === "PILOT") {
            detailDOM.html(`<div id=${player.callsign}>
                                <div class="detail-icon">
                                <img class="detail-img" onerror=src="" src="static/image/airlines/${player.callsign.substring(0,3)}.png" />
                                </div>
                                <table class="mdui-table">
                                <thead><tr><th style="width: 35%">项目</th><th>信息</th></tr></thead>
                                <tbody><tr><td>起飞/降落</td><td>${player.dep}/${player.arr}</td></tr>
                                <tr><td>高度：</td><td>${Math.round(player.alt)}ft</td></tr>
                                <tr><td>航向：</td><td>${player.heading}°</td></tr>
                                <tr><td>航路：</td><td>${player.route}</td></tr>
                                <tr><td>飞行员：</td><td>${player.id}</td></tr>
                                <tr><td>机型：</td><td>${player.actype}</td></tr>
                                <tr><td>应答机：</td><td>${player.squawk}</td></tr>
                                <tr><td>来源：</td><td>${player.from}</td></tr>
                                </tbody></table></div>`);
        } else if (player.type === "ATC") {
            detailDOM.html(`<div id=${player.callsign}><b>${player.callsign}</b><br>频率：${player.freq}<br>管制员：${player.id}</div>`);
        }
        
        if (this.inst) {
            this.inst.show(2);
        }
    }
    
    // 点击列表中的玩家
    clickPlayerInList(obj) {
        let callsign = $(obj).attr("id");
        const index = this.checkDumpCallsign(callsign);
        
        if (index !== -1) {
            const player = this.player[index];
            let latlng = [player.lat, player.lng];
            this.map.setView(latlng, 8);
            
            if (player.marker) {
                player.marker.openPopup();
            }
        }
    }
    
    // 设置UTC时间
    setUTCTime() {
        let d = new Date();
        let utc = d.toUTCString().split(" ")[4].split(":");
        $("#time").text(`${utc[0]}:${utc[1]}:${utc[2]} UTC`);
    }

    // 加载FIR数据
    loadFIRData() {
        $.ajax({
            url: "static/data/data.dat",
            type: "GET",
            dataType: "text",
            success: (data) => {
                const lines = data.split("\n");
                let temp_sector = "";
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line === "[FIRs]") {
                        temp_sector = "FIR";
                        continue;
                    } else if (line === "[UIRs]") {
                        temp_sector = "UIR";
                        continue;
                    } else if (line.startsWith(";")) {
                        continue;
                    }
                    
                    if (line !== "") {
                        if (temp_sector === "FIR") {
                            const parts = line.split("|");
                            if (parts.length >= 4) {
                                const sector = {};
                                sector.icao = parts[0];
                                sector.name = parts[1];
                                sector.prefix = parts[2];
                                sector.boundary = parts[3];
                                this.FIRs.push(sector);
                            }
                        } else if (temp_sector === "UIR") {
                            const parts = line.split("|");
                            if (parts.length >= 3) {
                                const sector = {};
                                sector.prefix = parts[0];
                                sector.name = parts[1];
                                sector.cover = parts[2];
                                this.UIRs.push(sector);
                            }
                        }
                    }
                }
            },
            error: (xhr, status, error) => {
                console.error("加载FIR数据失败:", error);
            }
        });
    }

    // 加载GeoJSON数据
    loadGeoJSONData() {
        $.ajax({
            url: "static/data/sectors.geojson",
            type: "GET",
            dataType: "json",
            success: (data) => {
                for (let i = 0; i < data.features.length; i++) {
                    const feature = data.features[i];
                    const geo = {};
                    geo.label_lon = feature.properties.label_lon;
                    geo.label_lat = feature.properties.label_lat;
                    geo.id = feature.properties.id;
                    geo.coordinates = feature.geometry.coordinates;
                    this.Geos[feature.properties.id] = geo;
                }
            },
            error: (xhr, status, error) => {
                console.error("加载GeoJSON数据失败:", error);
            }
        });
    }

    // 搜索呼号并选择
    searchCallsignInPlayerAndSelect() {
        const callsign = $("#callsign-search").val().toUpperCase();
        const index = this.checkDumpCallsign(callsign);
        
        if (index !== -1) {
            const player = this.player[index];
            
            // 居中地图到玩家位置
            this.map.setView([player.lat, player.lng], 8);
            
            // 打开弹出窗口
            if (player.marker) {
                player.marker.openPopup();
            }
            
            // 高亮表格行
            $(`#${player.type.toLowerCase()}-body tr#${player.callsign}`).addClass("highlight");
            setTimeout(() => {
                $(`#${player.type.toLowerCase()}-body tr#${player.callsign}`).removeClass("highlight");
            }, 2000);
        } else {
            mdui.snackbar({ message: "未找到该呼号" });
        }
    }

    // 保存飞行员设置
    savePilotSetting() {
        localStorage.setItem("show-pilot", $("#show-pilot").prop("checked"));
        localStorage.setItem("pilot-track", $("#pilot-track").prop("checked"));
        localStorage.setItem("pilot-plan", $("#pilot-plan").prop("checked"));
        mdui.snackbar({ message: "设置已保存" });
    }

    // 保存ATC设置
    saveATCSetting() {
        localStorage.setItem("show-atc", $("#show-atc").prop("checked"));
        localStorage.setItem("show-range", $("#show-range").prop("checked"));
        localStorage.setItem("show-obs", $("#show-obs").prop("checked"));
        mdui.snackbar({ message: "设置已保存" });
    }

    // 保存地图设置
    saveMapSetting() {
        if ($("#google").prop("checked")) {
            localStorage.setItem("map", "google");
        } else if ($("#tianditu").prop("checked")) {
            localStorage.setItem("map", "tianditu");
        } else {
            localStorage.setItem("map", "osm");
        }
        mdui.snackbar({ message: "设置已保存，请刷新页面生效" });
    }

    // 保存标签设置
    saveTagSetting() {
        localStorage.setItem("tag-icon", $("#tag-icon").prop("checked"));
        localStorage.setItem("tag-callsign", $("#tag-callsign").prop("checked"));
        localStorage.setItem("tag-leg", $("#tag-leg").prop("checked"));
        localStorage.setItem("tag-alt", $("#tag-alt").prop("checked"));
        localStorage.setItem("tag-type", $("#tag-type").prop("checked"));
        mdui.snackbar({ message: "设置已保存" });
    }

    // 点击设置保存
    clickSettingSave() {
        this.savePilotSetting();
        this.saveATCSetting();
        this.saveMapSetting();
        this.saveTagSetting();
        mdui.snackbar({ message: "所有设置已保存" });
    }
}

// 初始化应用
window.oscarMapApp = new OscarMapApp();

// 页面加载完成后初始化
function init() {
    window.oscarMapApp.init();
}

// 暴露必要的全局函数
function updMap() {
    window.oscarMapApp.updateMap();
}

function clickSettingSave() {
    window.oscarMapApp.clickSettingSave();
}

function searchCallsignInPlayerAndSelect() {
    window.oscarMapApp.searchCallsignInPlayerAndSelect();
}