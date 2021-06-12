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

async function getStorage(key,default_value){
  return new Promise((resolve,reject)=>{
    chrome.storage.local.get([key],items=> {
      if (items[key]==undefined) resolve(default_value);
      else resolve(items[key]);
    });
  });
}

function insertBS () {
  $('head').append('<link href="'+chrome.runtime.getURL('css/bootstrap.min.css')+'" rel="stylesheet"><link href="'+chrome.runtime.getURL('css/mystyle.css')+'" rel="stylesheet"><script src="'+chrome.runtime.getURL('js/jquery-3.1.1.min.js')+'"></script>')
  setTimeout(function(){$('head').append('<script src="'+chrome.runtime.getURL('js/bootstrap.min.js')+'"></script>')},100)
}

function myeval(evalstr) {
  $('body').append('<script>'+evalstr+'</script>')
}

Date.prototype.format = function (fmt) {
  let o = {
    'M+' : this.getMonth() + 1,
    'd+' : this.getDate(),
    'H+' : this.getHours(),
    'm+' : this.getMinutes(),
    's+' : this.getSeconds(),
    'S' : this.getMilliseconds()
  }
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  for (let k in o) {
    if (new RegExp('('+ k +')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (('00'+ o[k]).substr((''+ o[k]).length)))
    }
  }
  return fmt
}
let server='https://1.tongji.edu.cn'
