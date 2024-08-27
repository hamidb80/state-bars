// -------- Other Utils -----------------

function uuid() {
  return self.crypto.randomUUID()
}

// -------- DataBase Utils ---------------

// ------ Low Level APIs
function clearDB() {
  return window.localStorage.clear()
}

function missingItemDB(key) {
  return window.localStorage.getItem(key) === null
}
function existsItemDB(key) {
  return !missingItemDB(key)
}

function getItemDB(key) {
  return JSON.parse(window.localStorage.getItem(key))
}
function setItemDB(key, val) {
  return window.localStorage.setItem(key, JSON.stringify(val))
}

// ------ Keys 

const
  TasksK = 'tasks',
  HistoryK = 'history'

// ------ Models

function newAction(name, emoji, boost, desc) {
  return { name, emoji, boost, desc }
}

function newTask(name, actions, max, decRate) {
  return { name, actions, max, decRate }
}

function newRecord(taskID, time, boost, desc) {
  return { taskID, time, boost, title, desc }
}

// ------  Actions 

function add(taskID, boost) {
}

// ------- UI Setup -----------------------------

// ------ DOM Utils
function q(sel) {
  return document.querySelector(sel)
}

function qa(sel) {
  return document.querySelectorAll(sel)
}

// ------ macros 
up.macro('[smooth-link]', link => {
  setAttrs(link, {
    'up-transition': 'cross-fade',
    'up-duration': '250',
    'up-follow': '',
  })
})

// ------ compilers
up.compiler('#app-page', el => {
  let tasks = getItemDB(TasksK) ?? [1, 2]
  rivets.bind(q`[tasks]`, { tasks })
})
