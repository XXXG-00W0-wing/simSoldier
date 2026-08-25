const mapLocations = {
    "成功嶺 (陸軍)": { lat: 24.118949, lng: 120.605335 },
    "金六結 (陸軍)": { lat: 24.743118, lng: 121.733519 },
    "斗煥坪 (陸軍)": { lat: 24.673898, lng: 120.941916 },
    "關西營區 (陸軍)": { lat: 24.801648, lng: 121.173256 },
    "官田營區 (陸軍)": { lat: 23.195035, lng: 120.316921 },
    "中坑營區 (陸軍)": { lat: 23.593635, lng: 120.485141 },
    "凌雲崗營區 (陸軍)": { lat: 24.86451, lng: 121.21054 },
    "太平里營區 (陸軍)": { lat: 24.8966, lng: 121.1353 },
    "龍華營區 (陸軍)": { lat: 24.9048, lng: 121.2858 },
    "犁頭山營區 (陸軍)": { lat: 24.8197, lng: 121.0375 },
    "成功嶺營區 (陸軍)": { lat: 24.1141, lng: 120.6133 },
    "北埔營區 (陸軍)": { lat: 24.0242, lng: 121.6072 },
    "屏東龍泉 (海陸)": { lat: 22.656517, lng: 120.591038 },
    "左營營區 (海軍)": { lat: 22.7056, lng: 120.2882 }
};

let leafletMap = null;
let markers = {};

function triggerLocationTaskComplete() {
    if (typeof window.toggleJourneyTask === 'function') {
        window.toggleJourneyTask('t1_6', true);
    }
    window.dispatchEvent(new CustomEvent('locationSelected'));
}

function initMap() {
    // 預設中心點 (台灣中心)
    leafletMap = L.map('map').setView([23.973875, 120.982024], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMap);

    // 加入 Markers
    Object.keys(mapLocations).forEach(key => {
        const loc = mapLocations[key];
        // 擷取營區名稱 (例如 "金六結 (陸軍)" -> "金六結")
        const destName = key.split(' (')[0];
        const mapLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destName)}`;

        const popupContent = `
            <div class="text-center p-1">
                <b class="block mb-2 text-stone-800 text-lg">${key}</b>
                <a href="${mapLink}" target="_blank" class="inline-block bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow transition-colors no-underline">
                    <i class="fa-solid fa-location-arrow mr-1 text-white"> 規劃路線</i>
                </a>
            </div>
        `;

        const marker = L.marker([loc.lat, loc.lng]).addTo(leafletMap)
            .bindPopup(popupContent);
        marker.on('click', () => {
            triggerLocationTaskComplete();
        });
        markers[key] = marker;
    });

    // 綁定左側清單的點擊事件，並動態加入位置按鈕
    const locationCards = document.querySelectorAll('#view-locations .group');
    locationCards.forEach(card => {
        const titleElement = card.querySelector('h4');
        if (titleElement) {
            const title = titleElement.innerText.trim();
            const destName = title.split(' (')[0];
            const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destName)}`;

            // 建立位置按鈕並插入到標題旁邊
            const navBtn = document.createElement('a');
            navBtn.href = mapLink;
            navBtn.target = '_blank';
            navBtn.className = 'ml-3 text-blue-400 hover:text-blue-300 text-sm transition-colors relative z-10';
            navBtn.title = 'Google Maps 查詢位置';
            navBtn.innerHTML = '<i class="fa-solid fa-map-location-dot"></i> 位置';

            // 避免點擊位置按鈕時觸發卡片的展開/收合
            navBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                triggerLocationTaskComplete();
            });

            // 將按鈕加在 h4 的父元素(flex container) 內
            titleElement.parentElement.appendChild(navBtn);
        }

        card.addEventListener('click', () => {
            triggerLocationTaskComplete();
            const title = card.querySelector('h4').innerText.trim();
            if (mapLocations[title]) {
                const loc = mapLocations[title];
                leafletMap.flyTo([loc.lat, loc.lng], 14, {
                    animate: true,
                    duration: 1.5
                });
                markers[title].openPopup();
            }
        });
    });
}

// 由於地圖容器預設是 display: none，當切換到該 tab 時需要重新計算大小
document.addEventListener('DOMContentLoaded', () => {
    initMap();

    const targetNode = document.getElementById('view-locations');
    const observerOptions = {
        attributes: true,
        attributeFilter: ['class']
    };

    const observer = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (!targetNode.classList.contains('hidden')) {
                    // 當地圖顯示時，呼叫 invalidateSize 確保地圖正確渲染
                    setTimeout(() => {
                        if (leafletMap) {
                            leafletMap.invalidateSize();
                        }
                    }, 100);
                }
            }
        }
    });

    if (targetNode) {
        observer.observe(targetNode, observerOptions);
    }

    window.selectLocation = function (name) {
        triggerLocationTaskComplete();
        if (window.switchTab) {
            window.switchTab('locations');
        }

        // Find the card and click it
        const cards = document.querySelectorAll('#view-locations .group');
        for (let card of cards) {
            const titleElement = card.querySelector('h4');
            if (!titleElement) continue;
            const title = titleElement.innerText.trim();
            if (title.includes(name) || name.includes(title)) {
                const header = card.querySelector('.cursor-pointer');
                if (header) {
                    header.click();
                } else {
                    card.click();
                }
                break;
            }
        }
    };

    // 綁定軍種篩選下拉式選單事件
    const branchFilter = document.getElementById('branch-filter');
    if (branchFilter) {
        branchFilter.addEventListener('change', (e) => {
            triggerLocationTaskComplete();
            const selectedBranch = e.target.value;
            const locationCards = document.querySelectorAll('#view-locations .group');

            locationCards.forEach(card => {
                const titleElement = card.querySelector('h4');
                if (!titleElement) return;

                const title = titleElement.innerText.trim();

                // 若為 "all" 顯示全部
                if (selectedBranch === 'all') {
                    card.style.display = '';
                    return;
                }

                // 比對軍種文字，例如: 成功嶺 (陸軍) 包含 陸軍
                if (title.includes(selectedBranch)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });

            // 篩選時可選擇性地關閉地圖上已開啟的標記
            if (leafletMap) {
                leafletMap.closePopup();
            }
        });
    }
});
