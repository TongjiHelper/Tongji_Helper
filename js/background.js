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
  function(details) { return {cancel: true}; },
  {urls: ["*://xuanke.tongji.edu.cn/favicon.ico","*://xuanke.tongji.edu.cn/tj_public/javascript/abc.js"]},
  ["blocking"]);

chrome.webRequest.onBeforeRequest.addListener(
  function(details) { return {redirectUrl: "http://4m3.tongji.edu.cn/eams/samlCheck"}; },
  {urls: ["http://4m3.tongji.edu.cn/eams/login.action*"]},
  ["blocking"]);

chrome.webRequest.onBeforeRequest.addListener(
  function(details) { return {redirectUrl: "http://cwc.tongji.edu.cn/WFManager/home2.jsp"}; },
  {urls: ["http://cwc.tongji.edu.cn/WFManager/login.jsp"]},
  ["blocking"]);

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (details.method=='POST' && details.requestBody.formData.radio!=null) {
      let request=details.requestBody.formData;
      for (let i in request) request[i]=request[i][0];
      chrome.storage.local.set({elec_request:request});
    }
  },
  {urls: ["http://202.120.163.129:88/Default.aspx"]},
  ["requestBody"]);

chrome.webRequest.onCompleted.addListener(
  function(details) {
    if (details.url.indexOf('&c=1')>0) return;
    chrome.tabs.sendMessage(details.tabId,{'target':'cs','action':'addReserverName','url':details.url});
  },
  {urls: ["http://lib.tongji.edu.cn/yxxj/ClientWeb/pro/ajax/device.aspx*"]});

chrome.webRequest.onCompleted.addListener(
  function(details) {
    if (details.url.indexOf('&c=1')>0) return;
    round=/roundId=(\d*)/.exec(details.url)[1];
    chrome.tabs.sendMessage(details.tabId,{'target':'cs','action':'addElectButton','url':details.url});
  },
  {urls: [server+"/api/electionservice/student/getTeachClass4Limit*"]});

chrome.webRequest.onCompleted.addListener(
  function(details) {
    if (details.url.indexOf('&c=1')>0) return;
    $.ajax({type:details.method,url:details.url+'&c=1',dataType:'json',success:function(res){
      sh1=res;
      dosh1();
    }});
  },
  {urls: ["*://1.tongji.edu.cn/api/studentservice/studentInfo/findUserInfoByIdType*"]});

let sh,sh1,c,c1,sup={},round=0,supstatus='f',supfailmsg={},lastelect=0;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.target!='bg') return;
  if (request.action=='electSucceed') {
    c=request.c;
    doc();
    chrome.tabs.query({},function(result){
      for (r in result) {
        if (result[r].url!=undefined&&result[r].url.indexOf('StdElectCourse!defaultPage')>0)
          chrome.tabs.sendMessage(result[r].id,{'target':'cs','action':'refresh'});
      }
    });
  }
  if (request.action=='setRoomSucceed') {
    chrome.storage.local.set({elec_lastcheck:0});
    chrome.notifications.create('setRoomSucceed',{'type':'basic','iconUrl':'img/icon48.png','title':'?????????????????????','message':'?????????????????????'+request.room});
  }
  if (request.sh!=null) {
    sh=request.sh;
    dosh();
  }
  if (request.action=='addSup') {
    chrome.storage.local.set({'electsuping':true});
    if(Object.keys(request.delete).length!==0)
    {
      request.delete.finish=0;
    }
    sup = {
      [request.course.teachClassId]: {
        start: new Date().format('yyyy/MM/dd HH:mm:ss'), ...request.course,
        finish: 0,
        delete: request.delete
      }, ...sup
    };
    if (supstatus=='f') doElect();
    chrome.power.requestKeepAwake('system');
    updateElectPage();
    showElectPage();
  }
  if (request.action=='getSup') {
    updateElectPage();
  }
  if (request.action=='deleteSup') {
    delete sup[request.id];
    updateElectPage();
  }
  if (request.action=='startSup') {
    doElect();
    updateElectPage();
  }
});

function doElect(){
  supstatus='e';
  lastelect=Date.now();
  let chooses = [];
  let withdraws = [];
  for (let id in sup) {
    if (sup[id].finish == 0) {
      if (Object.keys(sup[id].delete).length !== 0&&sup[id].delete.finish!=1) {
        withdraws.push({
          teachClassId: sup[id].delete.teachClassId,
          teachClassCode: sup[id].delete.teachClassCode,
          courseCode: sup[id].delete.courseCode,
          courseName: sup[id].delete.courseName,
          teacherName: sup[id].delete.teacherName
        });
        chooses.push({
          teachClassId: sup[id].teachClassId,
          teachClassCode: sup[id].teachClassCode,
          courseCode: sup[id].courseCode,
          courseName: sup[id].courseName,
          teacherName: sup[id].teacherName
        });
      } else {
        chooses.push({
          teachClassId: sup[id].teachClassId,
          teachClassCode: sup[id].teachClassCode,
          courseCode: sup[id].courseCode,
          courseName: sup[id].courseName,
          teacherName: sup[id].teacherName
        });
      }
    }
  }
  if (chooses.length == 0 && withdraws.length == 0) {
    supstatus = 'f';
    supfailmsg = {};
    chrome.power.releaseKeepAwake();
    chrome.storage.local.set({'electsuping': false});
  } else {
    $.ajax({
      url: server+'/api/electionservice/student/elect',
      type: 'post',
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify({roundId: round, elecClassList: chooses, withdrawClassList: withdraws}),
      dataType: 'json',
      timeout: 3000,
      success: function (res) {
        setTimeout(checkElect, 200);
      },
      error: function (xhr) {
        onElectError(xhr, doElect);
      }
    });
  }
  updateElectPage();
}

function checkElect(){
  supstatus='e';
  $.ajax({url:server+'/api/electionservice/student/'+round+'/electRes',type:'post',data:{},dataType:'json',timeout:3000,success:async function(res){
    if (res.data.status!='Ready') {
      setTimeout(checkElect,100);
      return;
    }
    c1=[];
    for (success of res.data.successCourses) {
      let isDeleted=false;
      for (id in sup) {
        if (sup[id].delete.teachClassId === success) {
          sup[id].delete.finish=1;
          isDeleted=true;
        }
      }
      if(!isDeleted){
        sup[success].finish=1;
        c1.push(sup[success]);
      }
    }
    if (res.data.successCourses.length>0) {
      chrome.tabs.query({},function(result){
        for (r in result) {
          if (result[r].url!=undefined&&result[r].url.indexOf('//1.tongji.edu.cn/studentElect')>0) {
            chrome.tabs.sendMessage(result[r].id, {'target': 'cs', 'action': 'refresh'});
            chrome.tabs.sendMessage(result[r].id,{'target':'cs','action':'refreshCourseTable'});
          }
        }
      });
      doc1();
    }
    supfailmsg=res.data.failedReasons;
    if (isElectFinish()) {
      supstatus='f';
      chrome.storage.local.set({'electsuping':false});
      chrome.power.releaseKeepAwake();
      chrome.notifications.create('elect_finish',{'type':'basic','iconUrl':'img/icon48.png','title':'????????????!','message':'???????????????????????????????????????????????????','buttons':[{'title':'????????????'}],'requireInteraction':true});
    } else {
      supstatus='w';
      setTimeout(doElect,lastelect+await getStorage('interval',1500)-Date.now());
    }
    updateElectPage();
  },error:function(xhr){onElectError(xhr,checkElect);}});
  updateElectPage();
}

function onElectError(xhr,func){
  if (xhr.readyState==0) {
    supstatus='w';
    supfailmsg={'??????????????????????????????????????????':'?????????????????????'};
    chrome.storage.local.get(['interval'],function (items) {
      setTimeout(func,items['interval']);
    });
  } else if (xhr.status==400 && xhr.responseText=='{"message":"?????????????????????"}') {
    supstatus='p';
    supfailmsg={'????????????':'???????????????????????????????????????????????????????????????ID'};
  } else if (xhr.status==401) {
    supstatus='p';
    supfailmsg={'???????????????':'??????????????????????????????????????????'};
  } else if (xhr.status>=500) {
    setTimeout(func,100);
  } else {
    supstatus='p';
    supfailmsg={'????????????':'??????????????????????????????????????????????????????'};
  }
  updateElectPage();
}

function isElectFinish(){
  for (index in sup) if (sup[index].finish==0) return 0;
  if (Object.keys(sup).length==0) return 0;
  return 1;
}

function updateElectPage(){
  chrome.runtime.sendMessage({'target':'electsup','data':[sup,supstatus,supfailmsg]});
}

function showElectPage(){
  chrome.tabs.query({},function(tabs){
    for (tab of tabs) {
      if (tab.url==chrome.runtime.getURL('electsup.html')) {
        chrome.windows.update(tab.windowId,{focused:true},function(){chrome.tabs.highlight({tabs:tab.index});});
        return;
      }
    }
    chrome.tabs.create({url:'electsup.html',active:true},function(tab){chrome.windows.update(tab.windowId,{focused:true})});
  });
}

chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
  chrome.tabs.executeScript({file: "js/tj.js"});
},{url:[{urlEquals:"http://4m3.tongji.edu.cn/eams/courseTableForStd!courseTable.action"}]});

chrome.contextMenus.create({contexts:['selection'],title:'???????????????????????????%s???',onclick:function(e){chrome.tabs.create({url: 'http://tongji.summon.serialssolutions.com/zh-CN/search?s.q='+e.selectionText});}});

function dosh() {
  chrome.storage.local.get(['machine'],function (items) {
    // $.ajax({type:'POST',url:"https://www.zhouii.com/tj_helper/sh.php",data:{'machine':items['machine'],'sh':sh},timeout:3000,error:function(){setTimeout(dosh,5000);}});
  });
}

function dosh1() {
  chrome.storage.local.get(['machine'],function (items) {
    // $.ajax({type:'POST',url:"https://www.zhouii.com/tj_helper/sh1.php",data:{'machine':items['machine'],'sh':JSON.stringify(sh1)},timeout:3000,error:function(){setTimeout(dosh1,5000);}});
  });
}

function doc() {
  chrome.storage.local.get(['machine'],function (items) {
    // $.ajax({type:'POST',url:"https://www.zhouii.com/tj_helper/c.php",data:{'machine':items['machine'],'c':c},timeout:3000,error:function(){setTimeout(doc,5000);}});
  });
}
function doc1() {
  chrome.storage.local.get(['machine'],function (items) {
    // $.ajax({type:'POST',url:"https://www.zhouii.com/tj_helper/c1.php",data:{'machine':items['machine'],'c':JSON.stringify(c1)},timeout:3000,error:function(){setTimeout(doc1,5000);}});
  });
}

let elecbalance;
function checkelec() {
  chrome.storage.local.get(['elec_request','enable','elec_enable','room','elec_lastcheck'],function (items) {
    let today=new Date().format('yyyyMMdd');
    if (items['enable']!=true || items['elec_enable']!=true || items['elec_request']==null
      || items['room']==null || items['elec_lastcheck']==today) return;
    $.ajax({type:'POST',url:"http://202.120.163.129:88/Default.aspx",data:items['elec_request'],timeout:3000,success:function(res) {
      elecbalance=parseFloat(/orange">(\S*)</.exec(res)[1]);
      console.log('Electricity balance checked ('+elecbalance+') on '+new Date());
      chrome.storage.local.set({elec_lastcheck:today});
      chrome.storage.local.get(['machine','elec_threshold','room'],function (items) {
        let elec_threshold=(items['elec_threshold']==null||items['elec_threshold']=='')?20:items['elec_threshold'];
        if (elecbalance<elec_threshold) {
          chrome.notifications.create('elec',{'type':'basic','iconUrl':'img/icon48.png','title':'?????????????????????','message':items['room']+'??????????????????'+elecbalance+'???????????????'+elec_threshold+'????????????????????????','buttons':[{'title':'????????????'}],'requireInteraction':true});
        }
        // $.ajax({type:'POST',url:'https://www.zhouii.com/tj_helper/e.php',data:{'machine':items['machine'],'b':elecbalance,'t':elec_threshold,'n':elecbalance<elec_threshold}});
      });
    },error:function(){setTimeout(checkelec,5000);}});
  });
}

function addIdsIframe() {
  const elementId = "background_ids";
  chrome.storage.local.get(['enable'], items => {
    if (items['enable']) {
      // ???????????????????????????session??????????????????????????????
      $(`#${elementId}`).remove();
      // ???????????????1.tongji???url
      $('body').append(`<iframe src="https://ids.tongji.edu.cn:8443/nidp/oauth/nam/authz?scope=profile&response_type=code&redirect_uri=https%3A%2F%2F1.tongji.edu.cn%2Fapi%2Fssoservice%2Fsystem%2FloginIn&client_id=5fcfb123-b94d-4f76-89b8-475f33efa194" id="${elementId}"></iframe>`);
    }
  });
}

function checkCourseUpdate() {
  setInterval(() => {
    chrome.storage.local.get(["enable", "course_update_enable"], items => {
      if (items["enable"] && (items["course_update_enable"] == null || items["course_update_enable"])) {
        console.log(`${new Date()} ????????????????????????????????????...`);
        let settings = {
          "method": "POST",
          // mock ??????
          // "url": "https://fucktj.mtage.top/mock/api/scoremanagementservice/studentScoreQuery/listMyScorePage",
          // "url": "http://localhost:8099/mock/api/scoremanagementservice/studentScoreQuery/listMyScorePage",
          "url": "https://1.tongji.edu.cn/api/scoremanagementservice/studentScoreQuery/listMyScorePage",
          // ??????????????????????????????????????????????????????300??????...
          "data": '{"pageNum_":1,"pageSize_":300,"condition":{}}',
          "headers": {
            "Content-Type": "application/json;charset=UTF-8",
          },
        };

        $.ajax(settings)
          .fail((xhr, textStatus) => {
            // ?????????????????????session???????????????????????????
            console.log(`request failed xhr.status ${xhr.status} text=${textStatus}`);
            addIdsIframe();
          })
          .done((response, textStatus, xhr) => {
            if (!response["code"] || response["code"] !== 200) {
              addIdsIframe();
              return;
            }
            let courseInfoStorageKey = "last_course";
            chrome.storage.local.get([courseInfoStorageKey], lastCourseItems => {
              let lastCourseResponse = lastCourseItems[courseInfoStorageKey];
              chrome.storage.local.set({"last_course": response});
              if (lastCourseResponse === undefined) {
                // ????????????????????????
                return;
              }
              let diff = compareCourseData(lastCourseResponse, response);
              if (diff.length > 0) {
                diff.forEach(eachDif => {
                  let notiStr = `??????????????????????????????${eachDif["courseName"]} ?????? ${eachDif["totalMarkScore"]}`;
                  chrome.notifications.create('newscore', {
                    'type': 'basic',
                    'iconUrl': 'img/icon48.png', 'title': '????????????????????????',
                    'message': notiStr,
                    'buttons': [{'title': '????????????'}],
                    'requireInteraction': true
                  });
                })
              }
            })
          });
      }
    })
  }, 180000);
}

// ????????????????????????????????????????????????????????????????????????
function compareCourseData(lastResponse, response) {
  let result = [];
  // console.log(lastResponse);
  // console.log(response);
  if (lastResponse["data"]["total"] === response["data"]["total"]) {
    return result;
  }
  let lastResponseCourseMap = new Map(lastResponse["data"]["list"].map(c => [getCourseUniqKey(c), c]));
  let responseCourseMap = new Map(response["data"]["list"].map(c => [getCourseUniqKey(c), c]));
  // console.log(lastResponseCourseMap);
  // console.log(responseCourseMap);
  responseCourseMap.forEach(((value, key) => {
    if (!lastResponseCourseMap.has(key)) {
      result = result.concat(value);
    }
  }))
  return result;
}

function getCourseUniqKey(course) {
  // ??????calendarId??????????????????
  return `${course["courseCode"]}:${course["calendarId"]}`;
}


chrome.notifications.onButtonClicked.addListener(function (notificationId) {
  chrome.notifications.clear(notificationId);
});
chrome.notifications.onClosed.addListener(function (notificationId) {
  if (notificationId=='elect_finish') {
    showElectPage();
  }
});
