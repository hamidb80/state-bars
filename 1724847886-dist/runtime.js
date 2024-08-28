// -------- Other Utils -----------------

function p2(smth) {
  return String(smth).padStart(2, '0')
}

function unixToFormattedDate(unixTimestamp) {
  let oo = new Date(unixTimestamp * 1000) // Convert to milliseconds
  let yyyy = oo.getFullYear()
  let mm = p2(oo.getMonth() + 1)
  let dd = p2(oo.getDate())
  return `${yyyy}-${mm}-${dd}`
}

function unixToFormattedTime(unixTimestamp) {
  let oo = new Date(unixTimestamp * 1000) // Convert to milliseconds
  let hh = p2(oo.getHours())
  let tt = p2(oo.getMinutes())
  let ss = p2(oo.getSeconds())
  return `${hh}:${tt}:${ss}`
}

function unixNow() {
  return Math.floor(Date.now() / 1000)
}

function sec2hour(secs) {
  return secs / (60 * 60)
}

function copyArrInto(dest, src) {
  dest.length = 0
  for (const n of src)
    dest.push(n)
}

function toArray(arrayLike) {
  return Array.from(arrayLike)
}

function obj2array(obj) {
  return Object.values(obj)
}

function uuid() {
  return self.crypto.randomUUID()
}

function purify(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function shallowCopy(smth) {
  if (Array.isArray(smth)) return smth.slice()
  if (typeof smth === "object") return { ...smth }
  else return smth
}

function filterchop(arr, pred) {
  var does = []
  var donts = []

  for (let item of arr) {
    if (pred(item)) does.push(item)
    else donts.push(item)
  }
  return [does, donts]
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

function getAllItemsDB() {
  let result = {}
  for (let i = 0; i < window.localStorage.length; i++) {
    let key = window.localStorage.key(i)
    let valueStr = window.localStorage.getItem(key)
    result[key] = JSON.parse(valueStr)
  }
  return result
}


// ------ Keys 

const TasksK = 'tasks'
const OrderK = 'order-of-tasks'
const RecordsK = 'history'

// ------ Models

function newAction(name, emoji, boost, desc) {
  return { name, emoji, boost, desc }
}

function newTask(id, name, actions, max, decrate, created) {
  return { id, name, actions, max, decrate, created, archived: false }
}

function newRecord(time, boost) {
  return [time, boost]
}

// ------ Domain Logic

function computeState(task, records) {
  records.push(newRecord(unixNow(), 0))

  var timecurr = task.created
  var boostlevel = 0

  for (let [rtime, boost] of records) {
    let decay = task.decrate * sec2hour(rtime - timecurr)
    boostlevel = Math.min(task.max, Math.max(0, boostlevel - decay) + boost)
    timecurr = rtime
  }

  return boostlevel
}

// ------ DOM Utils

function q(sel) {
  return document.querySelector(sel)
}

function qa(sel) {
  return document.querySelectorAll(sel)
}

function setAttrs(el, attrsObj) {
  for (let key in attrsObj)
    el.setAttribute(key, attrsObj[key])
}

function newElement(tag, attrs = {}) {
  let el = document.createElement(tag)
  setAttrs(el, attrs)
  return el
}

function downloadFile(name, mime, content) {
  let a = newElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type: mime }))
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}


// ------- Setup ------------------------------

// ------ Globals 

var tasks = undefined
var selectedTask = undefined
var records = undefined
var selectedRecords = undefined
var task_ids_in_order = undefined
var archived_tasks = undefined
var active_tasks = undefined

var show_notif = (msg, kind, delay) => console.log(msg, kind, delay)

function saveAllTasks(tasksMap) {
  return setItemDB(TasksK, tasksMap)
}
function saveTask(task) {
  tasks[task.id] = task
  if (task_ids_in_order.indexOf(task.id) === -1) {
    task_ids_in_order.push(task.id)
    setItemDB(OrderK, task_ids_in_order)
  }
  return saveAllTasks(tasks)
}
function getRecordsFor(taskid) {
  return records[taskid] ?? []
}
function saveAllRecords(recordsByTaskid) {
  return setItemDB(RecordsK, recordsByTaskid)
}
function saveRecordsFor(taskid, recs) {
  records[taskid] = recs
  return saveAllRecords(records)
}
function addSaveRecordFor(taskid, time, boost) {
  let recs = getRecordsFor(taskid)
  recs.push(newRecord(time, boost))
  records[taskid] = recs
  return saveAllRecords(records)
}

function initGlobalsIfNot() {
  tasks = getItemDB(TasksK) ?? {}
  records = getItemDB(RecordsK) ?? {}
  task_ids_in_order = getItemDB(OrderK) ?? []
  archived_tasks = []
  active_tasks = []
}

// ------ Helpers ?

function taskidFromUrl() {
  return new URLSearchParams(window.location.search).get('task-id')
}

function taskElemId(task) {
  return "task-" + task.id
}

// ------ UI 

function setProgressBar(taskid) {
  let task = tasks[taskid]
  let pbar = q(`#${taskElemId(task)} .progress-bar`)
  let ptxt = q(`#${taskElemId(task)} .progress-text`)
  let status = computeState(task, shallowCopy(getRecordsFor(task.id)))
  let percent = 100 * status / task.max
  pbar.style.width = percent + '%'
  ptxt.innerHTML = status.toFixed(2)
}

rivets.formatters['not'] = b => !b
rivets.formatters['task_element_id'] = taskElemId
rivets.formatters['task_settings_url'] = task => {
  let suburl = q`#new-task-link`.getAttribute('href')
  return suburl + '?task-id=' + task.id
}
rivets.formatters['task_by_id'] = taskid => tasks[taskid]
rivets.formatters['task_stats_url'] = task => {
  let suburl = q`#test-stats-base`.getAttribute('href')
  return suburl + '?task-id=' + task.id
}
rivets.formatters['reversed'] = arr => arr.slice().reverse()

rivets.formatters['unixtime_to_formatted_date'] = ut => unixToFormattedDate(parseInt(ut))
rivets.formatters['unixtime_to_formatted_time'] = ut => unixToFormattedTime(parseInt(ut))

rivets.binders['task-settings-remove-action-click'] = (el, index) => {
  el.onclick = () => {
    selectedTask.actions.splice(index, 1)
  }
}

rivets.binders['task-stats-remove-record-click'] = (el, index) => {
  el.onclick = () => {
    let reverseIndex = selectedRecords.length - 1 - index // because sorted DESC in HTML and sorted ASC in `selectedRecords`
    selectedRecords.splice(reverseIndex, 1)
  }
}

rivets.binders['click-action-btn'] = (el, boost) => {
  el.onclick = () => {
    let taskid = el.getAttribute('task-id')
    addSaveRecordFor(taskid, unixNow(), parseInt(boost))
    setProgressBar(taskid)
  }
}

rivets.binders['init-task-item'] = (el, taskid) => {
  setTimeout(() => setProgressBar(taskid), 0)
}

rivets.binders['task-item-go-up-btn'] = (el, taskid) => {
  el.onclick = () => {
    let i = task_ids_in_order.indexOf(taskid)
    if (i !== 0) {
      task_ids_in_order.splice(i, 1)
      task_ids_in_order.splice(i - 1, 0, taskid)
      setItemDB(OrderK, task_ids_in_order)
      computeTasksList()
    }
  }
}

rivets.binders['task-item-go-down-btn'] = (el, taskid) => {
  el.onclick = () => {
    let i = task_ids_in_order.indexOf(taskid)

    if (i !== task_ids_in_order.length - 1) {
      task_ids_in_order.splice(i, 1)
      task_ids_in_order.splice(i + 1, 0, taskid)
      setItemDB(OrderK, task_ids_in_order)
      computeTasksList()
    }
  }
}

up.macro('main', initGlobalsIfNot)

up.macro('[smooth-link]', link => {
  setAttrs(link, {
    'up-transition': 'cross-fade',
    'up-duration': '230',
    'up-follow': '',
  })
})

function computeTasksList() {
  let sortedTasks = task_ids_in_order.map(id => tasks[id])
  let t = filterchop(sortedTasks, t => !t.archived)
  copyArrInto(active_tasks, t[0])
  copyArrInto(archived_tasks, t[1])
}

up.compiler('#task-list-page', el => {
  computeTasksList()
  let data = { active_tasks, archived_tasks }
  rivets.bind(el, data)
})

up.compiler('#task-stats-page', el => {
  let task = tasks[taskidFromUrl()]
  selectedRecords = getRecordsFor(task.id)
  rivets.bind(el, { records: selectedRecords, task })
})

up.compiler('#task-settings-page', el => {
  let taskid = taskidFromUrl()
  selectedTask = taskid ? purify(tasks[taskid]) : newTask(uuid(), '', [], '', '', unixNow())
  rivets.bind(el, { task: selectedTask })
})

up.compiler('#task-settings-archive', el => {
  el.onclick = () => {
    selectedTask.archived = true
  }
})

up.compiler('#task-settings-apply', el => {
  el.onclick = () => {
    saveTask(selectedTask)
    show_notif("Applied!", 'success')
  }
})

up.compiler('#task-settings-delete', el => {
  el.onclick = () => {
    delete tasks[selectedTask.id]
    task_ids_in_order = task_ids_in_order.filter(id => id !== selectedTask.id)
    saveAllTasks(tasks)
    setItemDB(OrderK, task_ids_in_order)
    show_notif("Deleted!", 'success')
  }
})

up.compiler('#task-settings-add-action', el => {
  el.onclick = () => {
    selectedTask.actions.push(newAction('', '', '', ''))
  }
})

up.compiler('#task-stats-apply-btn', el => {
  el.onclick = () => {
    saveRecordsFor(taskidFromUrl(), selectedRecords)
    show_notif("Applied!", 'success')
  }
})

up.compiler('#export-db-btn', el => {
  el.onclick = () => {
    downloadFile(
      'life-is-like-a-game.json',
      'application/json',
      JSON.stringify(getAllItemsDB()))
  }
})

up.compiler('#import-db-btn', el => {
  el.onclick = () => {
    let target = newElement('input', { type: "file", accept: ".json" })
    target.onchange = e => {
      let file = e.target.files[0]
      let reader = new FileReader()
      reader.onload = evt => {
        let json = JSON.parse(evt.target.result)
        for (let key in json) {
          setItemDB(key, json[key])
        }
        show_notif("DB imported!", 'success')
      }
      reader.readAsText(file)
    }
    target.click()
  }
})

up.compiler('#clear-db-btn', el => {
  el.onclick = () => {
    if (confirm("Are you sure?")) {
      clearDB()
      show_notif("DB cleared!", 'success')
    }
  }
})

up.compiler('#notif', el => {
  el.style.transform = 'translateY(+100%)'
  el.setAttribute('class', `fixed-bottom p-2`)

  show_notif = (msg, kind, delay = 3000) => {
    el.innerHTML = msg
    el.setAttribute('class', `fixed-bottom mx-2 p-2 alert alert-${kind}`)
    el.style.transform = 'translateY(0)'
    setTimeout(() => {
      el.style.transform = 'translateY(+150%)'
    }, delay)
  }
})
