let currentContent = '';
let currentSha = ''; // GitHub file SHA for updates
let tasksData = [];

// Add colored tags to task text
function colorizeTaskText(text) {
  // Replace category tags with colored spans
  return text
    .replace(/\[PRACA\]/g, '<span class="tag-praca">[PRACA]</span>')
    .replace(/\[ROZWÓJ OSOBISTY\]/g, '<span class="tag-rozwoj">[ROZWÓJ OSOBISTY]</span>')
    .replace(/\[PERSONAL BRANDING\]/g, '<span class="tag-branding">[PERSONAL BRANDING]</span>')
    .replace(/\[ZDROWIE\]/g, '<span class="tag-zdrowie">[ZDROWIE]</span>')
    .replace(/\[ŻYCIE OSOBISTE\]/g, '<span class="tag-zycie">[ŻYCIE OSOBISTE]</span>')
    .replace(/\[WYSOKI\]/g, '<span class="tag-priority-high">[WYSOKI]</span>')
    .replace(/\[ŚREDNI\]/g, '<span class="tag-priority-medium">[ŚREDNI]</span>')
    .replace(/\[NISKI\]/g, '<span class="tag-priority-low">[NISKI]</span>');
}

// Parse markdown content
function parseMarkdown(content) {
  const lines = content.split('\n');
  const days = [];
  let currentDay = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Day header (## Poniedziałek, 12 stycznia 2026)
    if (line.startsWith('## ') && !line.startsWith('## 👥') && !line.startsWith('## 🏦') && !line.startsWith('## 🛡️') && !line.startsWith('## 💳') && !line.startsWith('## 📊') && !line.startsWith('## 📝') && !line.startsWith('## 🔗') && !line.startsWith('## 📧')) {
      currentDay = {
        title: line.replace('## ', ''),
        tasks: [],
        lineNumber: i
      };
      days.push(currentDay);
    }
    // Task checkbox (- [ ] lub - [x])
    else if (line.match(/^- \[(x| )\] /) && currentDay) {
      const checked = line.includes('[x]');
      const text = line.replace(/^- \[(x| )\] /, '');
      const isPriority = text.includes('[WYSOKI]');

      currentDay.tasks.push({
        text: text,
        checked: checked,
        priority: isPriority,
        lineNumber: i,
        originalLine: line
      });
    }
  }

  return days;
}

// Calculate progress for a single day
function calculateDayProgress(day) {
  let total = 0;
  let completed = 0;

  day.tasks.forEach(task => {
    total++;
    if (task.checked) completed++;
  });

  return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

// Sort days - today first
function sortDaysByDate(days) {
  // Get current date from system
  const today = new Date();
  const todayDay = today.getDate();

  // Month names in genitive case (as used in dates: "13 stycznia")
  const monthsGenitive = [
    'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'
  ];

  const todayMonth = monthsGenitive[today.getMonth()];
  const todayPattern = `${todayDay} ${todayMonth}`;

  // Debug: log what we're looking for
  console.log('Szukam daty:', todayPattern);

  return days.sort((a, b) => {
    // Check if day title matches today's date (day and month only)
    const aTitleLower = a.title.toLowerCase();
    const bTitleLower = b.title.toLowerCase();

    const aIsToday = aTitleLower.includes(todayPattern);
    const bIsToday = bTitleLower.includes(todayPattern);

    if (aIsToday) console.log('Znaleziono dzisiejszy dzień:', a.title);

    if (aIsToday) return -1;
    if (bIsToday) return 1;
    return 0;
  });
}

// Render tasks to HTML
function renderTasks(days) {
  const container = document.getElementById('tasks-container');
  container.innerHTML = '';

  // Sort days - today first
  const sortedDays = sortDaysByDate([...days]);

  sortedDays.forEach((day, index) => {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day' + (index === 0 ? ' today' : '');

    const dayTitle = document.createElement('h2');
    dayTitle.textContent = (index === 0 ? '🎯 DZISIAJ: ' : '') + day.title;
    dayDiv.appendChild(dayTitle);

    // Calculate and show progress for this day
    const progress = calculateDayProgress(day);

    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';

    const progressBarBg = document.createElement('div');
    progressBarBg.className = 'progress-bar-bg';

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.width = progress.percentage + '%';

    progressBarBg.appendChild(progressBar);
    progressContainer.appendChild(progressBarBg);

    const progressText = document.createElement('div');
    progressText.className = 'progress-text';
    progressText.textContent = `${progress.completed}/${progress.total} zadań (${progress.percentage}%)`;
    progressContainer.appendChild(progressText);

    dayDiv.appendChild(progressContainer);

    // Render tasks directly without category grouping
    const tasksList = document.createElement('div');
    tasksList.className = 'tasks-list';

    day.tasks.forEach(task => {
      const taskDiv = document.createElement('div');
      taskDiv.className = 'task' + (task.checked ? ' completed' : '');

      // Add priority class based on task text
      if (task.text.includes('[WYSOKI]')) {
        taskDiv.classList.add('priority-high');
      } else if (task.text.includes('[ŚREDNI]')) {
        taskDiv.classList.add('priority-medium');
      } else if (task.text.includes('[NISKI]')) {
        taskDiv.classList.add('priority-low');
      }

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.checked;
      checkbox.dataset.lineNumber = task.lineNumber;
      checkbox.addEventListener('change', handleCheckboxChange);

      const label = document.createElement('label');
      label.innerHTML = colorizeTaskText(task.text); // Use innerHTML with colored tags
      label.className = 'task-label';
      if (task.priority) {
        label.style.fontWeight = 'bold';
      }

      // Edit input (hidden by default)
      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.value = task.text;
      editInput.className = 'task-edit-input';
      editInput.style.display = 'none';
      editInput.dataset.lineNumber = task.lineNumber;

      // Edit button
      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.innerHTML = '✏️';
      editBtn.title = 'Edytuj zadanie';
      editBtn.addEventListener('click', () => handleEditClick(taskDiv, task.lineNumber));

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.title = 'Usuń zadanie';
      deleteBtn.addEventListener('click', () => handleDeleteClick(task.lineNumber, task.text));

      // Save button (hidden by default)
      const saveBtn = document.createElement('button');
      saveBtn.className = 'save-btn';
      saveBtn.innerHTML = '💾 Zapisz';
      saveBtn.style.display = 'none';
      saveBtn.addEventListener('click', () => handleSaveClick(taskDiv, task.lineNumber));

      taskDiv.appendChild(checkbox);
      taskDiv.appendChild(label);
      taskDiv.appendChild(editInput);
      taskDiv.appendChild(editBtn);
      taskDiv.appendChild(deleteBtn);
      taskDiv.appendChild(saveBtn);
      tasksList.appendChild(taskDiv);
    });

    dayDiv.appendChild(tasksList);

    container.appendChild(dayDiv);
  });

  updateLastSync();
}

// Handle checkbox change
async function handleCheckboxChange(event) {
  const lineNumber = parseInt(event.target.dataset.lineNumber);
  const checked = event.target.checked;

  const lines = currentContent.split('\n');
  const oldLine = lines[lineNumber];

  // Toggle checkbox in markdown
  if (checked) {
    lines[lineNumber] = oldLine.replace('- [ ]', '- [x]');
  } else {
    lines[lineNumber] = oldLine.replace('- [x]', '- [ ]');
  }

  const newContent = lines.join('\n');

  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent, sha: currentSha })
    });

    const data = await response.json();
    currentContent = newContent;
    currentSha = data.sha; // Update SHA after save
    tasksData = parseMarkdown(newContent);
  } catch (error) {
    console.error('Error saving tasks:', error);
    event.target.checked = !checked; // Revert on error
  }
}

// Handle edit button click
function handleEditClick(taskDiv, lineNumber) {
  const label = taskDiv.querySelector('.task-label');
  const editInput = taskDiv.querySelector('.task-edit-input');
  const editBtn = taskDiv.querySelector('.edit-btn');
  const saveBtn = taskDiv.querySelector('.save-btn');

  // Store original value for cancel
  const originalValue = editInput.value;

  // Hide label and edit button, show input and save button
  label.style.display = 'none';
  editBtn.style.display = 'none';
  editInput.style.display = 'block';
  saveBtn.style.display = 'inline-block';

  // Focus on input
  editInput.focus();
  editInput.select();

  // Handle keyboard events
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveClick(taskDiv, lineNumber);
      editInput.removeEventListener('keydown', handleKeyDown);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Cancel edit - restore original value
      editInput.value = originalValue;
      label.style.display = 'block';
      editBtn.style.display = 'inline-block';
      editInput.style.display = 'none';
      saveBtn.style.display = 'none';
      editInput.removeEventListener('keydown', handleKeyDown);
    }
  };

  editInput.addEventListener('keydown', handleKeyDown);
}

// Handle save button click
async function handleSaveClick(taskDiv, lineNumber) {
  const label = taskDiv.querySelector('.task-label');
  const editInput = taskDiv.querySelector('.task-edit-input');
  const editBtn = taskDiv.querySelector('.edit-btn');
  const saveBtn = taskDiv.querySelector('.save-btn');

  const newText = editInput.value.trim();

  if (!newText) {
    alert('Zadanie nie może być puste!');
    return;
  }

  const lines = currentContent.split('\n');
  const oldLine = lines[lineNumber];

  // Replace task text but keep the checkbox state
  const checkboxState = oldLine.match(/^- \[(x| )\] /)[0];
  lines[lineNumber] = checkboxState + newText;

  const newContent = lines.join('\n');

  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent, sha: currentSha })
    });

    const data = await response.json();
    currentContent = newContent;
    currentSha = data.sha; // Update SHA after save
    tasksData = parseMarkdown(newContent);

    // Update UI
    label.textContent = newText;
    label.style.display = 'block';
    editBtn.style.display = 'inline-block';
    editInput.style.display = 'none';
    saveBtn.style.display = 'none';
  } catch (error) {
    console.error('Error saving task:', error);
    alert('Błąd podczas zapisywania zadania!');
  }
}

// Handle delete button click
async function handleDeleteClick(lineNumber, taskText) {
  // Show confirmation dialog
  const confirmed = confirm(`Czy na pewno chcesz usunąć zadanie?\n\n"${taskText}"`);

  if (!confirmed) {
    return; // User clicked "No" or closed the dialog
  }

  // User confirmed, proceed with deletion
  const lines = currentContent.split('\n');

  // Remove the task line
  lines.splice(lineNumber, 1);

  const newContent = lines.join('\n');

  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent, sha: currentSha })
    });

    const data = await response.json();
    currentContent = newContent;
    currentSha = data.sha; // Update SHA after save
    tasksData = parseMarkdown(newContent);
    renderTasks(tasksData);
  } catch (error) {
    console.error('Error deleting task:', error);
    alert('Błąd podczas usuwania zadania!');
  }
}

// Load tasks from server
async function loadTasks() {
  try {
    const response = await fetch('/api/tasks');
    const data = await response.json();

    if (data.content !== currentContent) {
      currentContent = data.content;
      currentSha = data.sha; // Store SHA for updates
      tasksData = parseMarkdown(currentContent);
      renderTasks(tasksData);
    }
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
}

// Update last sync time
function updateLastSync() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('pl-PL');
  document.getElementById('last-sync').textContent = `Ostatnia synchronizacja: ${timeString}`;
}

// Check if we should auto-refresh at scheduled times
function checkScheduledRefresh() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Refresh at 6:00 and 18:00 (within first minute)
  if ((hours === 6 || hours === 18) && minutes === 0) {
    console.log('Scheduled refresh at', now.toLocaleTimeString('pl-PL'));
    location.reload();
  }
}

// Classify task into category based on keywords
function classifyTaskCategory(taskText) {
  const text = taskText.toLowerCase();

  // PRACA keywords
  const workKeywords = ['praca', 'spotkanie', 'meeting', 'kontakt', 'rozmowa', 'email', 'mail', 'telefon',
    'projekt', 'klient', 'firma', 'zespół', 'manager', 'menedżer', 'rekrutacja', 'cv', 'oferta',
    'prezentacja', 'raport', 'dokumentacja', 'przetarg', 'umowa', 'kontrakt'];

  // ROZWÓJ OSOBISTY keywords
  const developmentKeywords = ['claude', 'code', 'nauka', 'kurs', 'szkolenie', 'lekcja', 'niemiecki',
    'język', 'learning', 'book', 'książka', 'podcast', 'edukacja', 'certyfikat'];

  // PERSONAL BRANDING keywords
  const brandingKeywords = ['linkedin', 'social media', 'post', 'artykuł', 'blog', 'podcast',
    'obróbka', 'publikacja', 'twitter', 'facebook', 'youtube', 'content', 'treść'];

  // ŻYCIE OSOBISTE keywords
  const personalKeywords = ['zakupy', 'dom', 'rodzina', 'dzieci', 'lekarz', 'wizyta', 'urząd',
    'rachunki', 'kredyt', 'bank', 'ubezpieczenie', 'samochód', 'naprawa', 'sprzątanie'];

  // ZDROWIE keywords
  const healthKeywords = ['siłownia', 'trening', 'ćwiczenia', 'sport', 'bieganie', 'fitness',
    'gym', 'zdrowie', 'dieta', 'joga', 'wellness'];

  // Check each category
  if (workKeywords.some(keyword => text.includes(keyword))) {
    return 'PRACA';
  }
  if (developmentKeywords.some(keyword => text.includes(keyword))) {
    return 'ROZWÓJ OSOBISTY';
  }
  if (brandingKeywords.some(keyword => text.includes(keyword))) {
    return 'PERSONAL BRANDING';
  }
  if (healthKeywords.some(keyword => text.includes(keyword))) {
    return 'ZDROWIE';
  }
  if (personalKeywords.some(keyword => text.includes(keyword))) {
    return 'ŻYCIE OSOBISTE';
  }

  // Default to PRACA if no match
  return 'PRACA';
}

// Format date to Polish day name
function formatDateToPolish(dateString) {
  const date = new Date(dateString);
  const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
  const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} ${month} ${year}`;
}

// Add new task to markdown
async function addNewTask(taskName, taskDate) {
  const lines = currentContent.split('\n');
  const category = classifyTaskCategory(taskName);
  const dateHeader = `## ${formatDateToPolish(taskDate)}`;

  // Create task with category tag and priority
  const taskLine = `- [ ] [${category}] ${taskName} [ŚREDNI]`;

  // Find or create day section
  let dayIndex = lines.findIndex(line => line.trim() === dateHeader);

  if (dayIndex === -1) {
    // Day doesn't exist, need to add it
    // Find the right position (chronologically)
    const targetDate = new Date(taskDate);
    let insertIndex = lines.length;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('## ') && !lines[i].includes('👥') && !lines[i].includes('🏦') &&
          !lines[i].includes('🛡️') && !lines[i].includes('💳') && !lines[i].includes('📊') &&
          !lines[i].includes('📝') && !lines[i].includes('🔗') && !lines[i].includes('📧')) {
        // This is a day header, parse the date
        const dayText = lines[i].replace('## ', '');
        // Try to extract date from format "Poniedziałek, 14 stycznia 2026"
        const dateMatch = dayText.match(/(\d+)\s+(\w+)\s+(\d{4})/);
        if (dateMatch) {
          const [, day, monthName, year] = dateMatch;
          const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
            'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
          const monthIndex = months.indexOf(monthName);
          if (monthIndex !== -1) {
            const lineDate = new Date(year, monthIndex, day);
            if (targetDate < lineDate) {
              insertIndex = i;
              break;
            }
          }
        }
      }
    }

    // Insert new day section with task
    lines.splice(insertIndex, 0, '', dateHeader, '', taskLine, '');
  } else {
    // Day exists, add task after the day header (skip empty line)
    let insertIndex = dayIndex + 1;

    // Skip empty line after day header
    if (insertIndex < lines.length && lines[insertIndex].trim() === '') {
      insertIndex++;
    }

    // Find the last task line in this day
    while (insertIndex < lines.length &&
           !lines[insertIndex].startsWith('## ') &&
           !lines[insertIndex].startsWith('---')) {
      if (lines[insertIndex].match(/^- \[(x| )\] /)) {
        insertIndex++;
      } else if (lines[insertIndex].trim() === '') {
        break;
      } else {
        insertIndex++;
      }
    }

    lines.splice(insertIndex, 0, taskLine);
  }

  const newContent = lines.join('\n');

  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent, sha: currentSha })
    });

    const data = await response.json();
    currentContent = newContent;
    currentSha = data.sha; // Update SHA after save
    tasksData = parseMarkdown(newContent);
    renderTasks(tasksData);
    return true;
  } catch (error) {
    console.error('Error adding task:', error);
    return false;
  }
}

// Handle add task button click
document.addEventListener('DOMContentLoaded', () => {
  const addTaskBtn = document.getElementById('add-task-btn');
  const taskNameInput = document.getElementById('task-name');
  const taskDateInput = document.getElementById('task-date');
  const formError = document.getElementById('form-error');

  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  taskDateInput.value = today;

  addTaskBtn.addEventListener('click', async () => {
    const taskName = taskNameInput.value.trim();
    const taskDate = taskDateInput.value;

    // Validation
    if (!taskName) {
      formError.textContent = '❌ Nazwa zadania jest wymagana!';
      taskNameInput.focus();
      return;
    }

    if (!taskDate) {
      formError.textContent = '❌ Data jest wymagana!';
      taskDateInput.focus();
      return;
    }

    // Clear error
    formError.textContent = '';

    // Add task
    const success = await addNewTask(taskName, taskDate);

    if (success) {
      // Clear form
      taskNameInput.value = '';
      taskDateInput.value = today;
      formError.textContent = '✅ Zadanie dodane!';
      formError.style.color = '#10b981';

      setTimeout(() => {
        formError.textContent = '';
        formError.style.color = '#dc2626';
      }, 3000);
    } else {
      formError.textContent = '❌ Błąd podczas dodawania zadania!';
    }
  });

  // Handle Enter key in task name input
  taskNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTaskBtn.click();
    }
  });
});

// Initialize
loadTasks();
setInterval(loadTasks, 3000); // Auto-refresh every 3 seconds
setInterval(checkScheduledRefresh, 60000); // Check every minute for scheduled refresh
