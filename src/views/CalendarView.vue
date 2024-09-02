<template>
    <div class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 text-white p-4">
        <div v-if="!showCountdown" class="w-full max-w-sm ">
            <h2 class="text-2xl font-bold mb-2 text-center">{{ title }}</h2>
            <div class="flex justify-between mb-4 h-48">
                <div ref="dayPicker" class="flex-1 overflow-y-scroll scroll-snap-y-mandatory">
                    <div v-for="day in days" :key="day" class="h-12 flex items-center justify-center scroll-snap-align-center">
                        {{ day }}
                    </div>
                </div>
                <div ref="monthPicker" class="flex-1 overflow-y-scroll scroll-snap-y-mandatory">
                    <div v-for="month in months" :key="month" class="h-12 flex items-center justify-center scroll-snap-align-center">
                        {{ month }}
                    </div>
                </div>
                <div ref="yearPicker" class="flex-1 overflow-y-scroll scroll-snap-y-mandatory">
                    <div v-for="year in years" :key="year" class="h-12 flex items-center justify-center scroll-snap-align-center">
                        {{ year }}
                    </div>
                </div>
            </div>
            <button @click="handleContinue" class="w-full bg-white text-purple-600 py-2 rounded-md font-semibold">
                {{ continueButtonText }}
            </button>
        </div>
        <div v-else class="text-center">
            <h2 class="text-2xl font-bold mb-4">{{ name }} {{ lastname }} (@{{ username }})</h2>
            <p class="text-xl mb-2">{{ nextBirthday }}</p>
            <div class="text-4xl font-bold">
                {{ countdown.days }}:{{ countdown.hours }}:{{ countdown.minutes }}
            </div>

            <ShareWidget 
              :url=shareUrl
              :comment=shareComment
            />

        </div>
    </div>
</template>
  
<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue';
  import { ShareWidget } from 'vue-tg'
  
  const title = "Введи свою дату рождения";
  const continueButtonText = "Продолжить";
  const nextBirthday = "Следующий рождение начнется через!";

  const name = ref('');
  const lastname = ref('');
  const username = ref('');
  
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  
  const dayPicker = ref<HTMLElement | null>(null);
  const monthPicker = ref<HTMLElement | null>(null);
  const yearPicker = ref<HTMLElement | null>(null);
  
  const showCountdown = ref(false);
  const selectedDate = ref<Date | null>(null);
  
  const countdown = computed(() => {
    if (!selectedDate.value) return { days: 0, hours: 0, minutes: 0 };
  
    const now = new Date();
    const nextBirthday = new Date(now.getFullYear(), selectedDate.value.getMonth(), selectedDate.value.getDate());
    
    if (nextBirthday < now) {
      nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
    }
  
    const diff = nextBirthday.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
    return {
      days: days.toString().padStart(2, '0'),
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0')
    };
  });

  function parseUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('showCountdown') === 'true') {
      showCountdown.value = true;
      name.value = urlParams.get('name') || '';
      lastname.value = urlParams.get('lastname') || '';
      username.value = urlParams.get('username') || '';
      
      const days = parseInt(urlParams.get('days') || '0');
      const hours = parseInt(urlParams.get('hours') || '0');
      const minutes = parseInt(urlParams.get('minutes') || '0');
      
      const now = new Date();
      const targetDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000) + (minutes * 60 * 1000));
      selectedDate.value = targetDate;
    }
  }
  
  onMounted(() => {

    parseUrlParams();

    setupPicker(dayPicker.value);
    setupPicker(monthPicker.value);
    setupPicker(yearPicker.value);

    const tgApp = (window as any).Telegram.WebApp;
    if (tgApp) {
      name.value = tgApp.initDataUnsafe.user?.first_name || '';
      lastname.value = tgApp.initDataUnsafe.user?.last_name || '';
      username.value = tgApp.initDataUnsafe.user?.username || '';
    }
    console.log(name.value, username.value);
  });

  
  function setupPicker(element: HTMLElement | null) {
    if (!element) return;
  
    let isScrolling = false;
    let startY: number;
    let startScrollTop: number;
    const itemHeight = 48; // 3rem (h-12) in pixels
  
    element.addEventListener('touchstart', (e: TouchEvent) => {
      isScrolling = true;
      startY = e.touches[0].pageY;
      startScrollTop = element.scrollTop;
      e.preventDefault();
    });
  
    element.addEventListener('touchmove', (e: TouchEvent) => {
      if (!isScrolling) return;
      const y = e.touches[0].pageY;
      const walk = (y - startY) * 2;
      element.scrollTop = startScrollTop - walk;
      e.preventDefault();
    });
  
    element.addEventListener('touchend', () => {
      isScrolling = false;
      const scrollTop = element.scrollTop;
      const index = Math.round(scrollTop / itemHeight);
      element.scrollTop = index * itemHeight;
    });
  }
  
  function handleContinue() {
    const selectedDay = Math.round((dayPicker.value?.scrollTop ?? 0) / 48) + 1;
    const selectedMonth = Math.round((monthPicker.value?.scrollTop ?? 0) / 48);
    const selectedYear = years[Math.round((yearPicker.value?.scrollTop ?? 0) / 48)];
    
    selectedDate.value = new Date(selectedYear, selectedMonth, selectedDay);
    showCountdown.value = true;
  }

  function generateShareableUrl() {
    const currentUrl = new URL(window.location.href);
    const params = new URLSearchParams();

    params.append('name', name.value);
    params.append('lastname', lastname.value);
    params.append('username', username.value);
    params.append('days', countdown.value.days.toString());
    params.append('hours', countdown.value.hours.toString());
    params.append('minutes', countdown.value.minutes.toString());
    params.append('showCountdown', true.toString());

    currentUrl.search = params.toString();
    return currentUrl.toString();
  }

  const shareUrl = computed(() => {
    return generateShareableUrl();
  });

  const shareComment = computed(() => {
    return `${name.value}  ${lastname.value} (@${username.value}) день рождения через ${countdown.value.days} дней, ${countdown.value.hours} часов и ${countdown.value.minutes} минут!`;
  });
  
  </script>