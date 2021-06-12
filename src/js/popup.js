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
    leftClick: function (index) {
      if (v.mails[index].mail.endsWith('@qq.com') || v.mails[index].mail.endsWith('@foxmail.com')) {
        chrome.storage.local.set({ mail_index: index })
        chrome.cookies.remove({ url: 'http://mail.qq.com', name: 'p_skey' }, function () {chrome.tabs.create({ url: 'https://mail.qq.com' })})
      } else if (v.mails[index].mail.endsWith('@163.com')) {
        chrome.storage.local.set({ mail_index: index })
        chrome.cookies.remove({ url: 'http://mail.163.com', name: 'NTES_SESS' }, function () {})
        chrome.cookies.remove({ url: 'http://mail.163.com', name: 'NTES_PASSPORT' }, function () {})
        chrome.cookies.remove({ url: 'http://mail.163.com', name: 'MAIL_SESS' }, function () {chrome.tabs.create({ url: 'https://mail.163.com' })})
      } else if (v.mails[index].mail.endsWith('@126.com')) {
        chrome.storage.local.set({ mail_index: index })
        chrome.cookies.remove({ url: 'http://mail.126.com', name: 'NTES_SESS' }, function () {})
        chrome.cookies.remove({ url: 'http://mail.126.com', name: 'NTES_PASSPORT' }, function () {})
        chrome.cookies.remove({ url: 'http://mail.126.com', name: 'MAIL_SESS' }, function () {chrome.tabs.create({ url: 'https://mail.126.com' })})
      } else if (v.mails[index].mail.endsWith('@tongji.edu.cn')) {
        chrome.storage.local.set({ mail_index: index })
        chrome.tabs.create({ url: 'https://mail.tongji.edu.cn' })
      } else if (v.mails[index].mail.endsWith('@aliyun.com')) {
        chrome.storage.local.set({ mail_index: index })
        chrome.tabs.create({ url: 'https://mail.aliyun.com' })
      }
    },
    rightClick: function (e) {
      e.preventDefault()
      copy(v.mails[e.target.id].hmwk)
    }
  }
})
chrome.storage.local.get(['enable', 'msg', 'msg_content', 'mail', 'electsuping'], function (items) {
  $('#enable').prop("checked", items['enable'] == true ? true : false)
  if (items['msg'] != '0') $('#alert-' + items['msg']).html(items['msg_content']).show()
  v.mails = items['mail']
  $('[data-url]').click(function () {chrome.tabs.create({ url: $(this).data('url') })})
  if (items['electsuping']) {$('#electsuptip').show()}
})

$('#enable').change(function () {
  chrome.storage.local.set({ enable: $('#enable').prop('checked') })
})

$('#otherlnk_btn').mouseover(function () {if ($('#otherlnk_div.open').length == 0) $(this).click()})
$('#mail_btn').mouseover(function () {if ($('#mail_div.open').length == 0) $(this).click()})

function copy (txt) {
  $('body').append('<textarea id="copytxt">' + txt + '</textarea>')
  $('#copytxt')[0].select()
  document.execCommand('copy')
  $('#copytxt').remove()
}
