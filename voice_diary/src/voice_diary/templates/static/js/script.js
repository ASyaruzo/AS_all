document.addEventListener('DOMContentLoaded', function() {
    // 頁面切換功能
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // 隱藏所有頁面
            pages.forEach(page => {
                page.style.display = 'none';
            });
            
            // 顯示選中的頁面
            const pageId = item.getAttribute('data-page');
            document.getElementById(`${pageId}-page`).style.display = 'block';
            
            // 更新導航項目的激活狀態
            navItems.forEach(navItem => {
                navItem.classList.remove('active');
            });
            item.classList.add('active');
        });
    });

    // 初始化日曆
    class Calendar {
        constructor() {
            this.date = new Date();
            this.months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
            this.currentMonthElement = document.getElementById('currentMonth');
            this.calendarDaysElement = document.getElementById('calendarDays');
            this.diaryListElement = document.getElementById('diaryList');
            
            this.updateCalendar();
            this.setupEventListeners();
        }

        updateCalendar() {
            const year = this.date.getFullYear();
            const month = this.date.getMonth();
            
            // 更新月份標題
            this.currentMonthElement.textContent = `${year}年 ${this.months[month]}`;
            
            // 清空日曆
            this.calendarDaysElement.innerHTML = '';
            
            // 獲取當月第一天和最後一天
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            
            // 填充上個月的日期
            const firstDayWeekday = firstDay.getDay();
            const prevMonthLastDay = new Date(year, month, 0).getDate();
            
            for (let i = firstDayWeekday - 1; i >= 0; i--) {
                const dayElement = this.createDayElement(prevMonthLastDay - i, 'other-month');
                this.calendarDaysElement.appendChild(dayElement);
            }
            
            // 填充當月日期
            for (let day = 1; day <= lastDay.getDate(); day++) {
                const dayElement = this.createDayElement(day, '');
                
                // 檢查是否為今天
                const currentDate = new Date();
                if (currentDate.getDate() === day && 
                    currentDate.getMonth() === month && 
                    currentDate.getFullYear() === year) {
                    dayElement.classList.add('today');
                }
                
                // 檢查是否有日記
                if (this.hasDiary(year, month + 1, day)) {
                    dayElement.classList.add('has-diary');
                }
                
                this.calendarDaysElement.appendChild(dayElement);
            }
            
            // 填充下個月的日期
            const remainingDays = 42 - this.calendarDaysElement.children.length;
            for (let day = 1; day <= remainingDays; day++) {
                const dayElement = this.createDayElement(day, 'other-month');
                this.calendarDaysElement.appendChild(dayElement);
            }
        }

        createDayElement(day, className) {
            const dayElement = document.createElement('div');
            dayElement.className = `calendar-day ${className}`;
            dayElement.textContent = day;
            return dayElement;
        }

        hasDiary(year, month, day) {
            const diaries = JSON.parse(localStorage.getItem('diaries') || '[]');
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            return diaries.some(diary => diary.date === dateStr);
        }

        showDiaries(year, month, day) {
            const diaries = JSON.parse(localStorage.getItem('diaries') || '[]');
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayDiaries = diaries.filter(diary => diary.date === dateStr);
            
            this.diaryListElement.innerHTML = '';
            
            if (dayDiaries.length === 0) {
                this.diaryListElement.innerHTML = '<div class="no-diary">この日の日記はありません</div>';
                return;
            }
            
            dayDiaries.forEach(diary => {
                const diaryElement = document.createElement('div');
                diaryElement.className = 'diary-item';
                diaryElement.innerHTML = `
                    <h4>${diary.title}</h4>
                    <p>${diary.content}</p>
                    <div class="diary-time">${diary.time}</div>
                `;
                this.diaryListElement.appendChild(diaryElement);
            });
        }

        setupEventListeners() {
            document.getElementById('prevMonth').addEventListener('click', () => {
                this.date.setMonth(this.date.getMonth() - 1);
                this.updateCalendar();
            });
            
            document.getElementById('nextMonth').addEventListener('click', () => {
                this.date.setMonth(this.date.getMonth() + 1);
                this.updateCalendar();
            });
            
            this.calendarDaysElement.addEventListener('click', (e) => {
                if (e.target.classList.contains('calendar-day')) {
                    // 移除之前選中的日期
                    const selectedDay = this.calendarDaysElement.querySelector('.selected');
                    if (selectedDay) {
                        selectedDay.classList.remove('selected');
                    }
                    
                    // 選中點擊的日期
                    e.target.classList.add('selected');
                    
                    // 顯示該日期的日記
                    const day = parseInt(e.target.textContent);
                    const month = this.date.getMonth() + 1;
                    const year = this.date.getFullYear();
                    
                    this.showDiaries(year, month, day);
                }
            });
        }
    }

    // 初始化日曆
    new Calendar();

    // 語音輸入功能
    const startVoiceBtn = document.getElementById('startVoice');
    let recognition = null;

    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.lang = 'ja-JP';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            const content = document.getElementById('diaryContent');
            content.value = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
        };
    }

    let isRecording = false;
    startVoiceBtn.addEventListener('click', () => {
        if (!recognition) {
            alert('お使いのブラウザは音声入力に対応していません。');
            return;
        }

        if (!isRecording) {
            recognition.start();
            startVoiceBtn.style.backgroundColor = '#dc3545';
            isRecording = true;
        } else {
            recognition.stop();
            startVoiceBtn.style.backgroundColor = '';
            isRecording = false;
        }
    });

    // 保存日記
    document.getElementById('saveDiary').addEventListener('click', () => {
        const date = document.getElementById('diaryDate').value;
        const content = document.getElementById('diaryContent').value;
        
        if (!date || !content) {
            alert('日付と内容を入力してください。');
            return;
        }
        
        const diary = {
            date: date,
            time: new Date().toLocaleTimeString('ja-JP'),
            content: content
        };
        
        const diaries = JSON.parse(localStorage.getItem('diaries') || '[]');
        diaries.push(diary);
        localStorage.setItem('diaries', JSON.stringify(diaries));
        
        // 清空表單
        document.getElementById('diaryDate').value = '';
        document.getElementById('diaryContent').value = '';
        
        alert('日記を保存しました！');

        // 更新日曆顯示（如果在日曆頁面）
        const calendar = document.querySelector('.calendar-page');
        if (calendar && window.getComputedStyle(calendar).display !== 'none') {
            new Calendar();
        }
    });

    // 深色模式切換
    const darkModeToggle = document.getElementById('darkModeToggle');
    darkModeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'enabled');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'disabled');
        }
    });

    // 檢查深色模式設定
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    // 數據備份
    document.getElementById('backupData').addEventListener('click', () => {
        const data = localStorage.getItem('diaries');
        const blob = new Blob([data || '[]'], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diary_backup.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    // 數據恢復
    document.getElementById('restoreData').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = readerEvent => {
                try {
                    const content = readerEvent.target.result;
                    JSON.parse(content); // 驗證 JSON 格式
                    localStorage.setItem('diaries', content);
                    alert('データを復元しました！');
                    location.reload();
                } catch (err) {
                    alert('無効なバックアップファイルです。');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    });

    // 顯示初始頁面（日曆）
    document.getElementById('calendar-page').style.display = 'block';
    document.querySelector('[data-page="calendar"]').classList.add('active');

    // 日期選擇器點擊事件
    const dateFormGroup = document.querySelector('#create-page .form-group');
    if (dateFormGroup) {
        dateFormGroup.addEventListener('click', function() {
            const dateInput = this.querySelector('.diary-date');
            if (dateInput) {
                dateInput.click();
            }
        });
    }
});