<?php
header('Access-Control-Allow-Origin:*');

/**
 * 获取字符串中指定左右边界的子字符串
 * @param string $str 原字符串
 * @param string $leftStr 左边界
 * @param string $rightStr 右边界
 * @return string 截取的子字符串
 */
function getSubstr($str, $leftStr, $rightStr) {
    $left = strpos($str, $leftStr);
    $right = strpos($str, $rightStr, $left);
    if($left < 0 || $right < $left) return '';
    return substr($str, $left + strlen($leftStr), $right - $left - strlen($leftStr));
}

/**
 * 获取并处理FSX数据
 * @param string $url 数据源URL
 * @param string $source 数据来源标识
 * @param string $specialParam 特殊参数
 * @return void
 */
function processFsdData($url, $source, $specialParam = '0001') {
    try {
        // 获取数据
        $fsd = file_get_contents($url);
        if ($fsd === false) {
            throw new Exception("无法获取数据: $url");
        }
        
        // 提取客户端数据
        $str = getSubstr($fsd, "!CLIENTS", "!SERVERS");
        $str = trim($str);
        $data = explode("\n", $str);
        
        // 处理每一行数据
        foreach ($data as $key => $value) {
            $value = trim($value);
            $arr = explode(":", $value);
            
            // 计算航向和雷达范围
            $heading = (($arr[38] & 4092) >> 2) / 1024 * 360;
            $heading = round($heading);
            $radar_radius = 1852 * $arr[19] / 2;
            
            // 输出处理后的数据（如果数组索引3存在）
            if (isset($arr[3])) {
                echo "{$arr[3]}:{$arr[1]}:{$arr[0]}:{$arr[4]}:{$arr[5]}:{$arr[6]}:{$arr[7]}:{$arr[8]}:{$heading}:{$arr[11]}:{$arr[13]}:{$arr[30]}:{$radar_radius}:{$source}:{$specialParam}:{$arr[9]}\n";
            }
        }
    } catch (Exception $e) {
        // 实际生产环境中应记录错误日志，而不是输出
        // error_log($e->getMessage());
    }
}

// 配置数据源
$sources = [
    [
        'url' => 'http://www.sparrowhe.top/whazzup.txt',
        'source' => 'XNATC',
        'specialParam' => ''
    ],
    [
        'url' => 'http://www.xiaohangair.com/vam/dataxn.php',
        'source' => 'XHAir',
        'specialParam' => '0001'
    ]
];

// 处理所有数据源
try {
    foreach ($sources as $source) {
        processFsdData($source['url'], $source['source'], $source['specialParam']);
    }
} catch (Exception $e) {
    // 实际生产环境中应记录错误日志
    // error_log($e->getMessage());
}
?>