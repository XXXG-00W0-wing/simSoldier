/**
 * SIMSOLDIER UTILITIES
 * 純計算邏輯：BMI, 役別判斷, 日期計算
 */

export function bmi(h, w) {
    if (!h || !w) return 0;
    const heightM = h / 100;
    return (w / (heightM * heightM)).toFixed(1);
}

export function determineServiceType(bmiValue, role, disabilityType = 'none', birthYearStr) {
    const numBmi = parseFloat(bmiValue);
    if (!numBmi || numBmi <= 0) {
        return { type: '常備役體位', reason: '尚無體位數據', instruction: '請於個人資料設定身高體重以計算體位。' };
    }

    // 1. 免役體位
    if (numBmi < 16.5 || numBmi > 31.5) {
        return { type: '免役體位', reason: 'BMI符合免役標準', instruction: '經計算體位符合免役標準，請注意體檢複檢通知。' };
    }

    // 2. 替代役體位 (BMI 16.5~17 或 31~31.5)
    if ((numBmi >= 16.5 && numBmi < 17) || (numBmi > 31 && numBmi <= 31.5)) {
        return { type: '替代役體位', reason: 'BMI符合替代役標準', instruction: '體位判定為替代役，請注意梯次與役別通知。' };
    }

    // 3. 常備役體位 (依出生年份判斷 1年 / 4個月)
    let year = 1990;
    if (birthYearStr) {
        year = new Date(birthYearStr).getFullYear();
    }

    if (year >= 2005) {
        return { type: '常備役體位 (1年)', reason: '94年次以後出生', instruction: '一年期義務役，強化體能與部隊適應。' };
    } else {
        return { type: '常備役體位 (4個月)', reason: '93年次以前出生', instruction: '四個月軍事訓練役，按時入營受訓。' };
    }
}

export function calculateDaysRemaining(targetDate) {
    if (!targetDate) return 0;
    const now = new Date();
    const target = new Date(targetDate);
    const diff = target - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// 格式化日期 (YYYY-MM-DD)
export function formatDate(dateStr) {
    if(!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
}
