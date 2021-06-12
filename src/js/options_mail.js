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

let v = new Vue({
  el: '#mail',
  data: {
    mails: null
  },
  methods: {
    deleteMail: function (index) {
      v.mails.splice(index, 1)
    }
  }
})
chrome.storage.local.get('mail', function (items) {
  v.mails = (items['mail'] == null) ? new Array() : items['mail']
})

$('#addmail').click(function () {
  v.mails.push({
    hmwk: '',
    mail: '',
    memo: '',
    name: '',
    pswd: ''
  })
})

$('#save').click(function () {
  for (let i in v.mails) {
    let ok = 1
    $.each(v.mails[i], function (k, v) {
      if (k != 'memo' && k != 'hmwk' && v == '') ok = -1
      if (k == 'mail' && !v.endsWith('@qq.com') && !v.endsWith('@foxmail.com') && !v.endsWith('@163.com') && !v.endsWith('@126.com') && !v.endsWith('@tongji.edu.cn') && !v.endsWith('@aliyun.com')) ok = -2
    })
    if (ok == -1) {
      $('#errtip').html('保存失败，请填写所有课程名称、公邮及密码！').fadeIn().delay(2000).fadeOut()
      return
    }
    if (ok == -2) {
      $('#errtip').html('保存失败，使用了不支持的邮箱！').fadeIn().delay(2000).fadeOut()
      return
    }
  }
  chrome.storage.local.set({ mail: v.mails })
  $('#tip').css({ top: '30px' }).html('保存成功(⊙v⊙)~').fadeIn().delay(2000).fadeOut()
})
