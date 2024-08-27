// -------- DOM Utils --------------------

function q(sel) {
  return document.querySelector(sel)
}

function qa(sel) {
  return document.querySelectorAll(sel)
}

// -------- DATABASE Utils ---------------

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

// ------ Keys -------------------------

const
  TasksK = 'tasks',
  HistoryK = 'history',

// -------------------------------------

function newTask(){

}

// -------------------------------------

up.macro('[smooth-link]', link => {
  setAttrs(link, {
    'up-transition': 'cross-fade',
    'up-duration': '250',
    'up-follow': '',
  })
})

function init() {
  let tasks = getItemDB(TasksK) ?? []
  rivets.bind(q`[me]`, { tasks })
}

// -------------------------------------

init()