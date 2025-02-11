import { initializeVoiceRecognition } from './voiceRecognition.js'


document.addEventListener('DOMContentLoaded',() =>{

    initializeVoiceRecognition();

    const diaryDateInput = document.getElementById('diaryDate');
    if (diaryDateInput) {
        const today = new Date().toISOString().split('T')[0];
        diaryDateInput.value = today
    };

    // SiriWave 初期化
    const siriContainer = document.getElementById('siri-container');
    if (!siriContainer) {
        console.error('SiriWave container not found');
        return;
    }

    let siriWave = new SiriWave({
        container: siriContainer,
        width: 300,
        height: 200,
        style: 'ios9',
        autostart: false,
    });

    window.siriWave = siriWave;

    // ページ切り替え機能
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            pages.forEach(page => page.style.display = 'none');
            document.getElementById(`${item.getAttribute('data-page')}-page`).style.display = 'block';
            navItems.forEach(navItem => navItem.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // カレンダー
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

        async updateCalendar() {
            const year = this.date.getFullYear();
            const month = this.date.getMonth();
            this.currentMonthElement.textContent = `${year}年 ${this.months[month]}`;
            this.calendarDaysElement.innerHTML = '';

            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const firstDayWeekday = firstDay.getDay();
            const prevMonthLastDay = new Date(year, month, 0).getDate();

            for (let i = firstDayWeekday - 1; i >= 0; i--) {
                this.calendarDaysElement.appendChild(this.createDayElement(prevMonthLastDay - i, 'other-month'));
            }

            for (let day = 1; day <= lastDay.getDate(); day++) {
                const dayElement = this.createDayElement(day, '');
                if (new Date().toDateString() === new Date(year, month, day).toDateString()) {
                    dayElement.classList.add('today');
                }
                if (await this.hasDiary(year, month + 1, day)) {
                    dayElement.classList.add('has-diary');
                }
                this.calendarDaysElement.appendChild(dayElement);
            }

            const remainingDays = 42 - this.calendarDaysElement.children.length;
            for (let day = 1; day <= remainingDays; day++) {
                this.calendarDaysElement.appendChild(this.createDayElement(day, 'other-month'));
            }
        }

        createDayElement(day, className) {
            const dayElement = document.createElement('div');
            dayElement.className = `calendar-day ${className}`;
            dayElement.textContent = day;
            return dayElement;
        }

        async hasDiary(year, month, day) {
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const response = await fetch(`/get_diaries?date=${dateStr}`);
            const data = await response.json();
            return data.diaries.length > 0;
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

            this.calendarDaysElement.addEventListener('click', async (e) => {
                if (e.target.classList.contains('calendar-day')) {
                    document.querySelector('.selected')?.classList.remove('selected');
                    e.target.classList.add('selected');

                    const day = e.target.textContent.padStart(2, '0');
                    const month = (this.date.getMonth() + 1).toString().padStart(2, '0');
                    const year = this.date.getFullYear();
                    await fetchDiaries(`${year}-${month}-${day}`);
                }
            });
        }
    }

    new Calendar();

    // 日記保存
    document.getElementById('saveDiary').addEventListener('click', async () => {
        const diaryDateInput = document.getElementById('diaryDate');
        const diaryContentInput = document.getElementById('diaryContent');

        const date = diaryDateInput.value;
        const content = diaryContentInput.value;

        if (!date || !content) {
            alert('日付と内容を入力してください。');
            return;
        }

        const diary = {
            date: date,
            time: new Date().toLocaleTimeString('ja-JP'),
            content: content
        };

        try {
            const response = await fetch('/save_diary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(diary)
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);

                diaryContentInput.value = '';

                const today = new Date().toISOString().split('T')[0];
                diaryDateInput.value = today;

                new Calendar();
                // calendar.updateCalendar();

            } else {
                alert('エラーが発生しました: ' + result.message);
            }
        } catch (error) {
            console.error('日記保存エラー:', error);
            alert('日記の保存に失敗しました');
        }
    });

    // MongoDBから日記を取得
    async function fetchDiaries(date) {
        try {
            const response = await fetch(`/get_diaries?date=${date}`);
            const data = await response.json();

            const diaryList = document.getElementById('diaryList');
            diaryList.innerHTML = '';

            if (data.diaries.length === 0) {
                diaryList.innerHTML = '<div class="no-diary">この日の日記はありません</div>';
                return;
            }

            data.diaries.forEach(diary => {
                const diaryElement = document.createElement('div');
                diaryElement.className = 'diary-item';
                diaryElement.innerHTML = `
                    <p><strong>日記の内容:</strong> ${diary.content}</p>
                    <p><strong>共感:</strong> ${diary.response || 'なし'}</p>
                    <div class="diary-time">${diary.time}</div>
                `;
                diaryList.appendChild(diaryElement);
            });
        } catch (error) {
            console.error('日記取得エラー:', error);
        }
    }

    document.getElementById('calendar-page').style.display = 'block';
    document.querySelector('[data-page="calendar"]').classList.add('active');
});
