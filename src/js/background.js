/**
 * Tongji Helper - Improve your experience browsing Tongji websites
 *
 * This file is part of Tongji Helper.
 *
 * Tongji Helper is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Tongji Helper is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * Copyright (C) 2017-2021 zhouii: Original implementation
 * Copyright (C) 2021 TongjiHelper
 */

chrome.webRequest.onBeforeRequest.addListener(
  function () { return { cancel: true } },
  { urls: ["*://xuanke.tongji.edu.cn/favicon.ico", "*://xuanke.tongji.edu.cn/tj_public/javascript/abc.js"] },
  ["blocking"])

chrome.webRequest.onBeforeRequest.addListener(
  function () { return { redirectUrl: "http://4m3.tongji.edu.cn/eams/samlCheck" } },
  { urls: ["http://4m3.tongji.edu.cn/eams/login.action*"] },
  ["blocking"])

chrome.webRequest.onBeforeRequest.addListener(
  function () { return { redirectUrl: "http://cwc.tongji.edu.cn/WFManager/home2.jsp" } },
  { urls: ["http://cwc.tongji.edu.cn/WFManager/login.jsp"] },
  ["blocking"])

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.method == 'POST' && details.requestBody.formData.radio != null) {
      let request = details.requestBody.formData
      for (let i in request) request[i] = request[i][0]
      chrome.storage.local.set({ elec_request: request })
    }
  },
  { urls: ["http://202.120.163.129:88/Default.aspx"] },
  ["requestBody"])

chrome.webRequest.onCompleted.addListener(
  function (details) {
    if (details.url.indexOf('&c=1') > 0) return
    chrome.tabs.sendMessage(details.tabId, { target: 'cs', action: 'addReserverName', url: details.url })
  },
  { urls: ["http://lib.tongji.edu.cn/yxxj/ClientWeb/pro/ajax/device.aspx*"] })

chrome.webRequest.onCompleted.addListener(
  function (details) {
    if (details.url.indexOf('&c=1') > 0) return
    round = /roundId=(\d*)/.exec(details.url)[1]
    chrome.tabs.sendMessage(details.tabId, { target: 'cs', action: 'addElectButton', url: details.url })
  },
  { urls: [server + "/api/electionservice/student/getTeachClass4Limit*"] })

chrome.webRequest.onCompleted.addListener(
  function (details) {
    if (details.url.indexOf('&c=1') > 0) return
    $.ajax({ type: details.method, url: details.url + '&c=1', dataType: 'json', success: function (res) {
      sh1 = res
      dosh1()
    } })
  },
  { urls: ["*://1.tongji.edu.cn/api/studentservice/studentInfo/findUserInfoByIdType*"] })

let
  c1,
  sup = {},
  round = 0,
  supstatus = 'f',
  supfailmsg = {},
  lastelect = 0

chrome.runtime.onMessage.addListener(function (request) {
  if (request.target != 'bg') return
  if (request.action == 'electSucceed') {
    c = request.c
    doc()
    chrome.tabs.query({}, function (result) {
      for (r in result) {
        if (result[r].url != undefined && result[r].url.indexOf('StdElectCourse!defaultPage') > 0)
          chrome.tabs.sendMessage(result[r].id, { target: 'cs', action: 'refresh' })
      }
    })
  }
  if (request.action == 'setRoomSucceed') {
    chrome.storage.local.set({ elec_lastcheck: 0 })
    chrome.notifications.create('setRoomSucceed', { type: 'basic', iconUrl: 'img/icon48.png', title: '房间号设置成功', message: '房间号已设置为' + request.room })
  }
  if (request.sh != null) {
    sh = request.sh
    dosh()
  }
  if (request.action == 'addSup') {
    chrome.storage.local.set({ electsuping: true })
    if(Object.keys(request.delete).length !== 0)
    {
      request.delete.finish = 0
    }
    sup = {
      [request.course.teachClassId]: {
        start: new Date().format('yyyy/MM/dd HH:mm:ss'), ...request.course,
        finish: 0,
        delete: request.delete
      }, ...sup
    }
    if (supstatus == 'f') doElect()
    chrome.power.requestKeepAwake('system')
    updateElectPage()
    showElectPage()
  }
  if (request.action == 'getSup') {
    updateElectPage()
  }
  if (request.action == 'deleteSup') {
    delete sup[request.id]
    updateElectPage()
  }
  if (request.action == 'startSup') {
    doElect()
    updateElectPage()
  }
})

function doElect () {
  supstatus = 'e'
  lastelect = Date.now()
  let chooses = []
  let withdraws = []
  for (let id in sup) {
    if (sup[id].finish == 0) {
      if (Object.keys(sup[id].delete).length !== 0 && sup[id].delete.finish != 1) {
        withdraws.push({
          teachClassId: sup[id].delete.teachClassId,
          teachClassCode: sup[id].delete.teachClassCode,
          courseCode: sup[id].delete.courseCode,
          courseName: sup[id].delete.courseName,
          teacherName: sup[id].delete.teacherName
        })
        chooses.push({
          teachClassId: sup[id].teachClassId,
          teachClassCode: sup[id].teachClassCode,
          courseCode: sup[id].courseCode,
          courseName: sup[id].courseName,
          teacherName: sup[id].teacherName
        })
      } else {
        chooses.push({
          teachClassId: sup[id].teachClassId,
          teachClassCode: sup[id].teachClassCode,
          courseCode: sup[id].courseCode,
          courseName: sup[id].courseName,
          teacherName: sup[id].teacherName
        })
      }
    }
  }
  if (chooses.length == 0 && withdraws.length == 0) {
    supstatus = 'f'
    supfailmsg = {}
    chrome.power.releaseKeepAwake()
    chrome.storage.local.set({ electsuping: false })
  } else {
    $.ajax({
      url: server + '/api/electionservice/student/elect',
      type: 'post',
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify({ roundId: round, elecClassList: chooses, withdrawClassList: withdraws }),
      dataType: 'json',
      timeout: 3000,
      success: function () {
        setTimeout(checkElect, 200, 500)
      },
      error: function (xhr) {
        onElectError(xhr, doElect)
      }
    })
  }
  updateElectPage()
}

function checkElect (interval) {
  if (!interval) {
    interval = 500
  }
  supstatus = 'e'
  $.ajax({
    url: server + '/api/electionservice/student/' + round + '/electRes',
    type: 'post',
    data: {},
    dataType: 'json',
    timeout: 3000,
    success: function (res) {
      if (res.data.status != 'Ready') {
        setTimeout(checkElect, interval, (interval <= 300) ? 100 : interval / 2)
        return
      }
      c1 = []
      for (success of res.data.successCourses) {
        let isDeleted = false
        for (id in sup) {
          if (sup[id].delete.teachClassId === success) {
            sup[id].delete.finish = 1
            isDeleted = true
          }
        }
        if(!isDeleted) {
          sup[success].finish = 1
          c1.push(sup[success])
        }
      }
      if (res.data.successCourses.length > 0) {
        chrome.tabs.query({}, function (result) {
          for (r in result) {
            if (result[r].url != undefined && result[r].url.indexOf('//1.tongji.edu.cn/studentElect') > 0) {
              chrome.tabs.sendMessage(result[r].id, { target: 'cs', action: 'refresh' })
              chrome.tabs.sendMessage(result[r].id, { target: 'cs', action: 'refreshCourseTable' })
            }
          }
        })
        doc1()
      }
      supfailmsg = res.data.failedReasons
      if (isElectFinish()) {
        supstatus = 'f'
        chrome.storage.local.set({ electsuping: false })
        chrome.power.releaseKeepAwake()
        chrome.notifications.create('elect_finish', { type: 'basic', iconUrl: 'img/icon48.png', title: '辅助完成!', message: '所需辅助选课的课程已全部选课成功！', buttons: [{ title: '查看详情' }], requireInteraction: true })
      } else {
        supstatus = 'w'
        getStorage('interval', 1500).then(interval => {
          setTimeout(doElect, lastelect + interval - Date.now())
        })
      }
      updateElectPage()
    },
    error: function (xhr) {
      onElectError(xhr, checkElect.bind(null, 500))
    }
  })
  updateElectPage()
}

function onElectError (xhr, func) {
  if (xhr.readyState == 0) {
    supstatus = 'w'
    supfailmsg = { '网络连接出错，请检查网络连接': '将在稍后重试。' }
    chrome.storage.local.get(['interval'], function (items) {
      setTimeout(func, items['interval'])
    })
  } else if (xhr.status == 400 && xhr.responseText == '{"message":"选课轮次不存在"}') {
    supstatus = 'p'
    supfailmsg = { 未知轮次: '请再添加一门课进行辅助从而获取当前选课轮次ID' }
  } else if (xhr.status == 401) {
    supstatus = 'p'
    supfailmsg = { 账号已退出: '请在教务系统重新登录你的账号' }
  } else if (xhr.status >= 500) {
    setTimeout(func, 100)
  } else {
    supstatus = 'p'
    supfailmsg = { 未知错误: '建议清除浏览器缓存并重启浏览器后重试' }
  }
  updateElectPage()
}

function isElectFinish () {
  for (index in sup) if (sup[index].finish == 0) return 0
  if (Object.keys(sup).length == 0) return 0
  return 1
}

function updateElectPage () {
  chrome.runtime.sendMessage({ target: 'electsup', data: [sup, supstatus, supfailmsg] })
}

function showElectPage () {
  chrome.tabs.query({}, function (tabs) {
    for (tab of tabs) {
      if (tab.url == chrome.runtime.getURL('electsup.html')) {
        chrome.windows.update(tab.windowId, { focused: true }, function () {chrome.tabs.highlight({ tabs: tab.index })})
        return
      }
    }
    chrome.tabs.create({ url: 'electsup.html', active: true }, function (tab) {chrome.windows.update(tab.windowId, { focused: true })})
  })
}

chrome.webNavigation.onHistoryStateUpdated.addListener(function () {
  chrome.tabs.executeScript({ file: "js/tj.js" })
}, { url: [{ urlEquals: "http://4m3.tongji.edu.cn/eams/courseTableForStd!courseTable.action" }] })

chrome.contextMenus.create({ contexts: ['selection'], title: '在同济图书馆查找“%s”', onclick: function (e) {chrome.tabs.create({ url: 'http://tongji.summon.serialssolutions.com/zh-CN/search?s.q=' + e.selectionText })} })

function dosh () {
  chrome.storage.local.get(['machine'], function () {
    // $.ajax({type:'POST',url:"https://www.zhouii.com/tj_helper/sh.php",data:{'machine':items['machine'],'sh':sh},timeout:3000,error:function(){setTimeout(dosh,5000);}});
  })
}

function dosh1 () {
  chrome.storage.local.get(['machine'], function () {
    // $.ajax({type:'POST',url:"https://www.zhouii.com/tj_helper/sh1.php",data:{'machine':items['machine'],'sh':JSON.stringify(sh1)},timeout:3000,error:function(){setTimeout(dosh1,5000);}});
  })
}

function doc () {
  chrome.storage.local.get(['machine'], function () {
    // $.ajax({type:'POST',url:"https://www.zhouii.com/tj_helper/c.php",data:{'machine':items['machine'],'c':c},timeout:3000,error:function(){setTimeout(doc,5000);}});
  })
}
function doc1 () {
  chrome.storage.local.get(['machine'], function () {
    // $.ajax({type:'POST',url:"https://www.zhouii.com/tj_helper/c1.php",data:{'machine':items['machine'],'c':JSON.stringify(c1)},timeout:3000,error:function(){setTimeout(doc1,5000);}});
  })
}
