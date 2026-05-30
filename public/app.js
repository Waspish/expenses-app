// Конфигурация API
const API_BASE = window.location.origin;

// Элементы DOM
const andreyBtn = document.getElementById("andreyBtn");
const nastyaBtn = document.getElementById("nastyaBtn");
const selectedPerson = document.getElementById("selectedPerson");
const addExpenseForm = document.getElementById("addExpenseForm");
const categorySelect = document.getElementById("category");
const categoryFilter = document.getElementById("categoryFilter");
const imageInput = document.getElementById("image");
const imagePreview = document.getElementById("imagePreview");
const andreyTotal = document.getElementById("andreyTotal");
const nastyaTotal = document.getElementById("nastyaTotal");
const andreyCount = document.getElementById("andreyCount");
const nastyaCount = document.getElementById("nastyaCount");
const expensesContainer = document.getElementById("expensesContainer");
const imageModal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const closeModal = document.getElementById("closeModal");
const andreyPercentage = document.getElementById("andreyPercentage");
const nastyaPercentage = document.getElementById("nastyaPercentage");
const andreyPercentageBar = document.getElementById("andreyPercentageBar");
const nastyaPercentageBar = document.getElementById("nastyaPercentageBar");
const totalAmount = document.getElementById("totalAmount");
const totalExpenses = document.getElementById("totalExpenses");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const iosHint = document.getElementById("iosHint");
const andreyBalance = document.getElementById("andreyBalance");
const nastyaBalance = document.getElementById("nastyaBalance");
const andreySavings = document.getElementById("andreySavings");
const nastyaSavings = document.getElementById("nastyaSavings");
const andreyExpenses = document.getElementById("andreyExpenses");
const nastyaExpenses = document.getElementById("nastyaExpenses");
const addSavingsForm = document.getElementById("addSavingsForm");
const savingsSelectedPerson = document.getElementById("savingsSelectedPerson");
const savingsAmount = document.getElementById("savingsAmount");
const savingsDescription = document.getElementById("savingsDescription");
const savingsContainer = document.getElementById("savingsContainer");
const loadMoreSavingsBtn = document.getElementById("loadMoreSavingsBtn");

// Новые элементы DOM для фильтра периода
const allTimeCheckbox = document.getElementById("allTimeCheckbox");
const customPeriod = document.getElementById("customPeriod");
const monthFilter = document.getElementById("monthFilter");
const yearFilter = document.getElementById("yearFilter");

// Элементы DOM для цели накоплений
const goalAmountDisplay = document.getElementById('goalAmountDisplay');
const goalAmountText = document.getElementById('goalAmountText');
const currentSavings = document.getElementById('currentSavings');
const goalPercentage = document.getElementById('goalPercentage');
const goalPercentageBar = document.getElementById('goalPercentageBar');
const editGoalButton = document.getElementById('editGoalButton');
const goalEditForm = document.getElementById('goalEditForm');
const newGoalAmount = document.getElementById('newGoalAmount');
const saveGoalButton = document.getElementById('saveGoalButton');
const cancelGoalButton = document.getElementById('cancelGoalButton');

// Переменные состояния
let allExpenses = [];
let filteredExpenses = [];
let visibleCount = 5;
let currentCategoryFilter = "";
let currentBalance = { Андрей: { savings: 0, expenses: 0, balance: 0 }, Настя: { savings: 0, expenses: 0, balance: 0 } };
let allSavings = [];
let visibleSavingsCount = 5;

// Новые переменные состояния
let currentMonthFilter = "";
let currentYearFilter = "";
let isAllTime = true;

// Переменные для хранения данных
let goalAmount = 0;
let totalSavings = 0;


// Функция обновления прогресса
function updateGoalProgress() {
    // Рассчитываем процент прогресса
    let percentage = 0;
    if (goalAmount > 0 && totalSavings > 0) {
        percentage = Math.min((totalSavings / goalAmount) * 100, 100);
    }

    // Обновляем отображение
    goalAmountDisplay.textContent = formatCurrency(goalAmount);
    goalAmountText.textContent = formatCurrency(goalAmount, false);
    currentSavings.textContent = formatCurrency(totalSavings, false);

    // Форматируем процент без лишних нулей
    goalPercentage.textContent = percentage === 0 ? '0%' : percentage.toFixed(1) + '%';
    goalPercentageBar.style.width = percentage + '%';

    // Меняем цвет прогресса
    updateProgressColor(percentage);
}

// Функция обновления цвета прогресса
function updateProgressColor(percentage) {
    if (percentage >= 100) {
        goalPercentageBar.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
        goalPercentage.style.color = '#28a745';
    } else if (percentage >= 50) {
        goalPercentageBar.style.background = 'linear-gradient(90deg, #ffc107, #fd7e14)';
        goalPercentage.style.color = '#ffc107';
    } else {
        goalPercentageBar.style.background = 'linear-gradient(90deg, #dc3545, #fd7e14)';
        goalPercentage.style.color = '#dc3545';
    }
}

// Функция форматирования валюты
function formatCurrency(amount, showCurrency = true) {
    const formatted = new Intl.NumberFormat('ru-RU').format(amount);
    return showCurrency ? formatted + ' руб' : formatted;
}

// Функция сохранения цели в localStorage
function saveGoalToStorage() {
    localStorage.setItem('savingsGoal', goalAmount.toString());
}

// Функция загрузки цели из localStorage
function loadGoalFromStorage() {
    const savedGoal = localStorage.getItem('savingsGoal');
    return savedGoal ? parseInt(savedGoal) : 100000; // По умолчанию 100,000 руб
}

// Функция для расчета общей суммы накоплений из баланса
function calculateTotalSavingsFromBalance() {
    let totalBalance = 0;

    // Суммируем БАЛАНСЫ Андрея и Насти (а не накопления)
    const andreyBalanceValue = parseFloat(andreyBalance.textContent) || 0;
    const nastyaBalanceValue = parseFloat(nastyaBalance.textContent) || 0;

    totalBalance = andreyBalanceValue + nastyaBalanceValue;

    console.log('Общая сумма балансов:', totalBalance, 'руб');
    console.log('Баланс Андрея:', andreyBalanceValue, 'руб');
    console.log('Баланс Насти:', nastyaBalanceValue, 'руб');

    return totalBalance;
}

// Обработчики событий для цели накоплений
function setupGoalEventListeners() {
    if (editGoalButton) {
        editGoalButton.addEventListener('click', function() {
            goalEditForm.style.display = 'block';
            newGoalAmount.value = goalAmount;
            newGoalAmount.focus();
        });
    }

    if (saveGoalButton) {
        saveGoalButton.addEventListener('click', function() {
            const newAmount = parseInt(newGoalAmount.value) || 0;
            if (newAmount >= 0) {
                goalAmount = newAmount;
                saveGoalToStorage();
                updateGoalProgress();
                goalEditForm.style.display = 'none';
            } else {
                alert('Пожалуйста, введите корректную сумму');
            }
        });
    }

    if (cancelGoalButton) {
        cancelGoalButton.addEventListener('click', function() {
            goalEditForm.style.display = 'none';
        });
    }

    if (newGoalAmount) {
        newGoalAmount.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                saveGoalButton.click();
            }
        });
    }
}

// Функция инициализации цели накоплений
function initGoalSystem() {
    // Загрузка цели из localStorage
    goalAmount = loadGoalFromStorage();

    // Расчет общей суммы накоплений из баланса
    totalSavings = calculateTotalSavingsFromBalance();

    updateGoalProgress();

    // Настраиваем обработчики событий
    setupGoalEventListeners();
}

// Функция для обновления общей суммы накоплений (вызывается при изменении баланса)
function updateTotalSavings(newTotal) {
    totalSavings = newTotal;
    updateGoalProgress();
}

// Функция для принудительного пересчета накоплений
function recalculateSavings() {
    totalSavings = calculateTotalSavingsFromBalance();
    updateGoalProgress();
    return totalSavings;
}

// Модифицируем функцию updateBalanceUI для обновления цели накоплений
const originalUpdateBalanceUI = updateBalanceUI;
updateBalanceUI = function() {
    originalUpdateBalanceUI();
    recalculateSavings();
};
// Инициализация приложения
async function initApp() {
  // Определение iOS устройства
  if (isIOS()) {
    iosHint.style.display = "block";
  }

  // Загрузка категорий
  await loadCategories();

  // Загрузка доступных годов
  await loadAvailableYears();

  // Загрузка баланса
  await loadBalance();

  // Загрузка накоплений
  await loadSavings();

  // Загрузка статистики и расходов
  await loadStatistics();
  await loadAllExpenses();

  // Настройка обработчиков событий
  setupEventListeners();
  setupSavingsEventListeners();
  setupPeriodFilterListeners(); // Новый обработчик
}

// Обновляем функцию initApp
const originalInitApp = initApp;
initApp = async function() {
    await originalInitApp();

    // Инициализируем систему цели накоплений после загрузки основного приложения
    setTimeout(() => {
        initGoalSystem();
    }, 100);
};

// Наблюдаем за изменениями на странице (если статистика обновляется динамически)
const observer = new MutationObserver(function() {
    setTimeout(() => {
        recalculateSavings();
    }, 100);
});

// Запускаем наблюдение после загрузки страницы
window.addEventListener('load', function() {
    const statsContainer = document.querySelector('.balance-section, .statistics');
    if (statsContainer) {
        observer.observe(statsContainer, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
});

// Делаем функции глобальными для отладки
window.recalculateSavings = recalculateSavings;
window.updateTotalSavings = updateTotalSavings;

// Добавьте функцию setupEventListeners (если её нет)
function setupEventListeners() {
  // Выбор человека
  if (andreyBtn) {
    andreyBtn.addEventListener("click", () => selectPerson("Андрей"));
  }
  if (nastyaBtn) {
    nastyaBtn.addEventListener("click", () => selectPerson("Настя"));
  }

  // Отправка формы расходов
  if (addExpenseForm) {
    addExpenseForm.addEventListener("submit", handleSubmit);
  }

  // Предпросмотр изображения
  if (imageInput) {
    imageInput.addEventListener("change", handleImagePreview);
  }

  // Фильтр по категориям
  if (categoryFilter) {
    categoryFilter.addEventListener("change", handleCategoryFilter);
  }

  // Кнопка "Показать ещё" для расходов
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", handleLoadMore);
  }

  // Модальное окно
  if (closeModal) {
    closeModal.addEventListener("click", () => {
      if (imageModal) imageModal.style.display = "none";
    });
  }

  if (imageModal) {
    imageModal.addEventListener("click", (e) => {
      if (e.target === imageModal) {
        imageModal.style.display = "none";
      }
    });
  }
}

// Настройка обработчиков фильтра периода
function setupPeriodFilterListeners() {
  // Галочка "Все время"
  if (allTimeCheckbox) {
    allTimeCheckbox.addEventListener("change", function() {
      isAllTime = this.checked;
      if (customPeriod) {
        customPeriod.style.display = isAllTime ? "none" : "block";
      }

      if (isAllTime) {
        // Сбрасываем фильтры при включении "Все время"
        currentMonthFilter = "";
        currentYearFilter = "";
        if (monthFilter) monthFilter.value = "";
        if (yearFilter) yearFilter.value = "";
      }

      // Применяем фильтры
      applyFilters();
    });
  }

  // Изменение месяца
  if (monthFilter) {
    monthFilter.addEventListener("change", function() {
      currentMonthFilter = this.value;
      applyFilters();
    });
  }

  // Изменение года
  if (yearFilter) {
    yearFilter.addEventListener("change", function() {
      currentYearFilter = this.value;
      applyFilters();
    });
  }
}

function applyFilters() {
  visibleCount = 5;
  updateActiveFiltersDisplay();
  loadStatistics();
  loadAllExpenses();
}

// Загрузка доступных годов
async function loadAvailableYears() {
  try {
    const response = await fetch(`${API_BASE}/api/available-years`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const years = await response.json();

    // Очищаем и заполняем список годов
    yearFilter.innerHTML = '<option value="">Все годы</option>';
    years.forEach(year => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearFilter.appendChild(option);
    });
  } catch (error) {
    console.error("Ошибка загрузки годов:", error);
  }
}

// Определение iOS устройства
function isIOS() {
  return (
    [
      "iPad Simulator",
      "iPhone Simulator",
      "iPod Simulator",
      "iPad",
      "iPhone",
      "iPod",
    ].includes(navigator.platform) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
}

// Загрузка баланса
async function loadBalance() {
  try {
    const response = await fetch(`${API_BASE}/api/balance`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const balance = await response.json();
    currentBalance = balance;

    // Обновляем UI баланса
    updateBalanceUI();
  } catch (error) {
    console.error("Ошибка загрузки баланса:", error);
  }
}

// Обновление UI баланса
function updateBalanceUI() {
  const andreyData = currentBalance["Андрей"] || { savings: 0, expenses: 0, balance: 0 };
  const nastyaData = currentBalance["Настя"] || { savings: 0, expenses: 0, balance: 0 };

  // Баланс
  andreyBalance.textContent = `${andreyData.balance.toFixed(2)} руб`;
  nastyaBalance.textContent = `${nastyaData.balance.toFixed(2)} руб`;

  // Детали
  andreySavings.textContent = andreyData.savings.toFixed(2);
  nastyaSavings.textContent = nastyaData.savings.toFixed(2);
  andreyExpenses.textContent = andreyData.expenses.toFixed(2);
  nastyaExpenses.textContent = nastyaData.expenses.toFixed(2);

  // Цвет баланса (красный если отрицательный)
  andreyBalance.style.color = andreyData.balance >= 0 ? "#2ecc71" : "#e74c3c";
  nastyaBalance.style.color = nastyaData.balance >= 0 ? "#2ecc71" : "#e74c3c";
}

// Загрузка накоплений
async function loadSavings() {
  try {
    const response = await fetch(`${API_BASE}/api/savings?limit=100`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    allSavings = await response.json();
    renderSavings();
  } catch (error) {
    console.error("Ошибка загрузки накоплений:", error);
  }
}

// Отображение накоплений
function renderSavings() {
  savingsContainer.innerHTML = "";

  if (allSavings.length === 0) {
    savingsContainer.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Накопления отсутствуют</p>';
    loadMoreSavingsBtn.style.display = "none";
    return;
  }

  const savingsToShow = allSavings.slice(0, visibleSavingsCount);

  savingsToShow.forEach(saving => {
    const savingElement = createSavingElement(saving);
    savingsContainer.appendChild(savingElement);
  });

  if (visibleSavingsCount < allSavings.length) {
    loadMoreSavingsBtn.style.display = "block";
  } else {
    loadMoreSavingsBtn.style.display = "none";
  }
}

// Создание элемента накопления
function createSavingElement(saving) {
  const div = document.createElement("div");
  div.className = `savings-item ${saving.person === "Настя" ? "nastya-expense" : ""}`;

  const date = new Date(saving.date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  amount_to_add = parseFloat(saving.amount).toFixed(2)
  div.innerHTML = `
    <div class="savings-info">
      <div class="savings-person ${saving.person === "Андрей" ? "andrey-person" : "nastya-person"}">
        ${saving.person} • ${date}
      </div>
      <div class="savings-amount">${amount_to_add >= 0 ? "+"+amount_to_add:amount_to_add}</div>
      ${saving.description ? `<div class="savings-description">${saving.description}</div>` : ""}
    </div>
    <div class="savings-actions">
      <button class="delete-btn" onclick="deleteSaving(${saving.id})">Удалить</button>
    </div>
  `;

  return div;
}

// Удаление накоплений
async function deleteSaving(id) {
  if (!confirm("Вы уверены, что хотите удалить эту запись о накоплении?")) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/savings/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      // Перезагружаем данные
      await loadBalance();
      await loadSavings();
    } else {
      console.error("Ошибка удаления накопления");
      alert("Ошибка при удалении накопления");
    }
  } catch (error) {
    console.error("Ошибка удаления накопления:", error);
    alert("Ошибка при удалении накопления");
  }
}

// Обработка добавления накоплений
async function handleAddSavings(e) {
  e.preventDefault();

  if (!savingsSelectedPerson.value) {
    alert("Выберите человека: Андрей или Настя");
    return;
  }

  const formData = new FormData(addSavingsForm);

  try {
    const response = await fetch(`${API_BASE}/api/savings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        person: savingsSelectedPerson.value,
        amount: parseFloat(formData.get("amount")),
        description: formData.get("description")
      })
    });

    if (response.ok) {
      addSavingsForm.reset();
      await loadBalance();
      await loadSavings();
      alert("Накопления успешно добавлены!");
    } else {
      const errorData = await response.json();
      alert(`Ошибка добавления накоплений: ${errorData.error || "Неизвестная ошибка"}`);
    }
  } catch (error) {
    console.error("Ошибка добавления накоплений:", error);
    alert("Ошибка добавления накоплений: Проверьте подключение к серверу");
  }
}

// Обработка кнопки "Показать ещё" для накоплений
function handleLoadMoreSavings() {
  visibleSavingsCount += 5;
  renderSavings();
}

// Настройка обработчиков событий
function setupSavingsEventListeners() {
  // Выбор человека для накоплений
  andreyBtn.addEventListener("click", () => {
    selectPerson("Андрей");
    savingsSelectedPerson.value = "Андрей";
  });

  nastyaBtn.addEventListener("click", () => {
    selectPerson("Настя");
    savingsSelectedPerson.value = "Настя";
  });

  // Форма добавления накоплений
  addSavingsForm.addEventListener("submit", handleAddSavings);

  // Кнопка "Показать ещё" для накоплений
  loadMoreSavingsBtn.addEventListener("click", handleLoadMoreSavings);
}

// Выбор человека
function selectPerson(person) {
  selectedPerson.value = person;

  // Обновляем UI
  andreyBtn.classList.remove("active");
  nastyaBtn.classList.remove("active");

  if (person === "Андрей") {
    andreyBtn.classList.add("active");
  } else {
    nastyaBtn.classList.add("active");
  }
}

// Загрузка категорий
async function loadCategories() {
  try {
    const response = await fetch(`${API_BASE}/api/categories`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const categories = await response.json();

    // Очищаем select
    categorySelect.innerHTML = '<option value="">Выберите категорию</option>';
    categoryFilter.innerHTML = '<option value="">Все категории</option>';

    // Добавляем категории
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.name;
      option.textContent = category.name;
      categorySelect.appendChild(option.cloneNode(true));
      categoryFilter.appendChild(option);
    });
  } catch (error) {
    console.error("Ошибка загрузки категорий:", error);
  }
}

// Загрузка всех расходов
async function loadAllExpenses() {
  try {
    // Строим URL с параметрами фильтров
    let url = `${API_BASE}/api/expenses?`;
    const params = [];

    if (currentCategoryFilter && currentCategoryFilter !== "" && currentCategoryFilter !== "Все категории") {
      params.push(`category=${encodeURIComponent(currentCategoryFilter)}`);
    }

    if (!isAllTime) {
      if (currentMonthFilter) {
        params.push(`month=${encodeURIComponent(currentMonthFilter)}`);
      }
      if (currentYearFilter) {
        params.push(`year=${encodeURIComponent(currentYearFilter)}`);
      }
    }

    url += params.join('&');

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    allExpenses = await response.json();

    // Применяем фильтр и отображаем расходы
    applyFilter();
  } catch (error) {
    console.error("Ошибка загрузки расходов:", error);
  }
}

// Загрузка статистики
async function loadStatistics() {
  try {
    // Строим URL с параметрами фильтров
    let url = `${API_BASE}/api/statistics?`;
    const params = [];

    if (currentCategoryFilter && currentCategoryFilter !== "" && currentCategoryFilter !== "Все категории") {
      params.push(`category=${encodeURIComponent(currentCategoryFilter)}`);
    }

    if (!isAllTime) {
      if (currentMonthFilter) {
        params.push(`month=${encodeURIComponent(currentMonthFilter)}`);
      }
      if (currentYearFilter) {
        params.push(`year=${encodeURIComponent(currentYearFilter)}`);
      }
    }

    url += params.join('&');

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const statisticsData = await response.json();

    // Рассчитываем общую сумму
    let total = 0;
    const statistics = {
      Андрей: { total: 0, count: 0 },
      Настя: { total: 0, count: 0 },
    };

    statisticsData.forEach((row) => {
      const amount = parseFloat(row.total);
      total += amount;

      if (statistics[row.person]) {
        statistics[row.person].total = amount;
        statistics[row.person].count = row.count;
      }
    });

    // Рассчитываем проценты
    const andreyPercent = total > 0 ? (statistics["Андрей"].total / total) * 100 : 0;
    const nastyaPercent = total > 0 ? (statistics["Настя"].total / total) * 100 : 0;

    // Обновляем статистику Андрея
    if (andreyTotal && andreyCount && andreyPercentage && andreyPercentageBar) {
      andreyTotal.textContent = `${statistics["Андрей"].total.toFixed(2)} руб`;
      andreyCount.textContent = `${statistics["Андрей"].count} расходов`;
      andreyPercentage.textContent = `${andreyPercent.toFixed(1)}%`;
      andreyPercentageBar.style.width = `${andreyPercent}%`;
    }

    // Обновляем статистику Насти
    if (nastyaTotal && nastyaCount && nastyaPercentage && nastyaPercentageBar) {
      nastyaTotal.textContent = `${statistics["Настя"].total.toFixed(2)} руб`;
      nastyaCount.textContent = `${statistics["Настя"].count} расходов`;
      nastyaPercentage.textContent = `${nastyaPercent.toFixed(1)}%`;
      nastyaPercentageBar.style.width = `${nastyaPercent}%`;
    }

    // Если нет расходов, сбрасываем проценты
    if (total === 0) {
      if (andreyPercentage) andreyPercentage.textContent = "0%";
      if (nastyaPercentage) nastyaPercentage.textContent = "0%";
      if (andreyPercentageBar) andreyPercentageBar.style.width = "0%";
      if (nastyaPercentageBar) nastyaPercentageBar.style.width = "0%";
      if (andreyTotal) andreyTotal.textContent = "0 руб";
      if (nastyaTotal) nastyaTotal.textContent = "0 руб";
      if (andreyCount) andreyCount.textContent = "0 расходов";
      if (nastyaCount) nastyaCount.textContent = "0 расходов";
    }
  } catch (error) {
    console.error("Ошибка загрузки статистики:", error);
  }
}

// Обновление заголовка общих расходов
//function updateTotalHeader(category, total) {
//  const totalLabel = document.querySelector(".total-label");
//
//  if (category) {
//    totalLabel.textContent = `Общие расходы: ${category}`;
//  } else {
//    totalLabel.textContent = "Общие расходы";
//  }
//
//  totalAmount.textContent = `${total.toFixed(2)} руб`;
//}

// Функция для отображения активных фильтров
function updateActiveFiltersDisplay() {
  const activeFilters = document.getElementById("activeFilters");
  const filterText = document.getElementById("filterText");

  if (!activeFilters || !filterText) return;

  const filters = [];

  if (currentCategoryFilter) {
    filters.push(`Категория: ${currentCategoryFilter}`);
  }

  if (!isAllTime) {
    if (currentMonthFilter) {
      const monthNames = {
        '01': 'Январь', '02': 'Февраль', '03': 'Март', '04': 'Апрель',
        '05': 'Май', '06': 'Июнь', '07': 'Июль', '08': 'Август',
        '09': 'Сентябрь', '10': 'Октябрь', '11': 'Ноябрь', '12': 'Декабрь'
      };
      filters.push(`Месяц: ${monthNames[currentMonthFilter]}`);
    }

    if (currentYearFilter) {
      filters.push(`Год: ${currentYearFilter}`);
    }
  }

  if (filters.length > 0) {
    filterText.textContent = filters.join(', ');
    activeFilters.style.display = 'block';
  } else {
    activeFilters.style.display = 'none';
  }
}

// Функция сброса всех фильтров
function clearAllFilters() {
  currentCategoryFilter = "";
  currentMonthFilter = "";
  currentYearFilter = "";
  isAllTime = true;

  if (categoryFilter) categoryFilter.value = "";
  if (allTimeCheckbox) allTimeCheckbox.checked = true;
  if (monthFilter) monthFilter.value = "";
  if (yearFilter) yearFilter.value = "";
  if (customPeriod) customPeriod.style.display = "none";

  applyFilters();
  updateActiveFiltersDisplay();
}

// Обработка фильтра по категориям
function handleCategoryFilter() {
  currentCategoryFilter = categoryFilter.value;
  applyFilters();
}

// Применение фильтра
function applyFilter() {
  if (currentCategoryFilter) {
    filteredExpenses = allExpenses.filter(
      (expense) => expense.category === currentCategoryFilter
    );
  } else {
    filteredExpenses = [...allExpenses];
  }

  // Сортируем по дате (новые сверху)
  filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Отображаем расходы
  renderExpenses();
}

// Отображение расходов
function renderExpenses() {
  // Очищаем контейнер
  expensesContainer.innerHTML = "";

  if (filteredExpenses.length === 0) {
    expensesContainer.innerHTML =
      '<p style="text-align: center; color: #7f8c8d;">Расходы отсутствуют</p>';
    loadMoreBtn.style.display = "none";
    return;
  }

  // Определяем, сколько расходов показать
  const expensesToShow = filteredExpenses.slice(0, visibleCount);

  // Добавляем расходы
  expensesToShow.forEach((expense) => {
    const expenseElement = createExpenseElement(expense);
    expensesContainer.appendChild(expenseElement);
  });

  // Показываем или скрываем кнопку "Показать ещё"
  if (visibleCount < filteredExpenses.length) {
    loadMoreBtn.style.display = "block";
  } else {
    loadMoreBtn.style.display = "none";
  }
}

// Обработка кнопки "Показать ещё"
function handleLoadMore() {
  visibleCount += 5;
  renderExpenses();
}

// Создание элемента расхода
function createExpenseElement(expense) {
  const div = document.createElement("div");
  div.className = `expense-item ${
    expense.person === "Настя" ? "nastya-expense" : ""
  }`;

  const date = new Date(expense.date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let imageHtml = "";
  if (expense.image_path) {
    imageHtml = `
            <div class="expense-image">
                <img src="${API_BASE}/uploads/${expense.image_path}" 
                     alt="Фото расхода" 
                     onclick="openModal('${API_BASE}/uploads/${expense.image_path}')">
            </div>
        `;
  }

  div.innerHTML = `
        <div class="expense-info">
            <div class="expense-person ${
              expense.person === "Андрей" ? "andrey-person" : "nastya-person"
            }">
                ${expense.person} • ${date} ${
    expense.category ? `• ${expense.category}` : ""
  }
            </div>
            <div class="expense-amount">${parseFloat(expense.amount).toFixed(
              2
            )} руб</div>
            ${
              expense.description
                ? `<div class="expense-description">${expense.description}</div>`
                : ""
            }
        </div>
        ${imageHtml}
        <div class="expense-actions">
            <button class="delete-btn" onclick="deleteExpense(${
              expense.id
            })">Удалить</button>
        </div>
    `;

  return div;
}

// Открытие модального окна с изображением
function openModal(imageUrl) {
  modalImage.src = imageUrl;
  imageModal.style.display = "flex";
}

// Удаление расхода
async function deleteExpense(id) {
  if (!confirm("Вы уверены, что хотите удалить этот расход?")) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/expenses/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      // Перезагружаем данные
      await loadBalance();
      await loadStatistics();
      await loadAllExpenses();
    } else {
      console.error("Ошибка удаления расхода");
      alert("Ошибка при удалении расхода");
    }
  } catch (error) {
    console.error("Ошибка удаления расхода:", error);
    alert("Ошибка при удалении расхода");
  }
}

// Обработка отправки формы
async function handleSubmit(e) {
  e.preventDefault();

  if (!selectedPerson.value) {
    alert("Выберите человека: Андрей или Настя");
    return;
  }

  const formData = new FormData(addExpenseForm);

  try {
    const response = await fetch(`${API_BASE}/api/expenses`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      addExpenseForm.reset();
      imagePreview.innerHTML = "";

      // Перезагружаем данные (включая баланс)
      await loadBalance();
      await loadStatistics();
      await loadAllExpenses();

      alert("Расход успешно добавлен!");
    } else {
      const errorData = await response.json();
      console.error("Ошибка добавления расхода:", errorData);
      alert(
        `Ошибка добавления расхода: ${errorData.error || "Неизвестная ошибка"}`
      );
    }
  } catch (error) {
    console.error("Ошибка добавления расхода:", error);
    alert("Ошибка добавления расхода: Проверьте подключение к серверу");
  }
}

// Предпросмотр изображения
function handleImagePreview() {
  const files = imageInput.files;
  if (!files || files.length === 0) return;

  // Берем только первый файл, даже если выбрано несколько
  const file = files[0];

  // Проверяем размер файла (максимум 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert("Файл слишком большой. Максимальный размер - 5MB.");
    imageInput.value = "";
    imagePreview.innerHTML = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    imagePreview.innerHTML = `<img src="${e.target.result}" alt="Предпросмотр">`;
  };
  reader.readAsDataURL(file);
}
window.clearAllFilters = function() {
    currentCategoryFilter = "";
    currentMonthFilter = "";
    currentYearFilter = "";
    isAllTime = true;

    if (categoryFilter) categoryFilter.value = "";
    if (allTimeCheckbox) allTimeCheckbox.checked = true;
    if (monthFilter) monthFilter.value = "";
    if (yearFilter) yearFilter.value = "";
    if (customPeriod) customPeriod.style.display = "none";

    applyFilters();
};
// Запуск приложения
initApp();
