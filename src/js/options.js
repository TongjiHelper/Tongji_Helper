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

chrome.storage.local.get(['username','password','enable','interval','showReserver','elec_enable','elec_threshold','room'],function (items) {
  $('#username').val(items['username']);
  $('#password').val(items['password']);
  $('#interval').val(items['interval']);
  $('#showReserver').prop('checked',items['showReserver']==null?false:items['showReserver']);
  $('#elec_enable').prop('checked',items['elec_enable']==null?false:items['elec_enable']);
  $('#elec_threshold').val(items['elec_threshold']);
  $('#room').val(items['room']);
  // 默认是开启的
  $('#course_update_enable').prop('checked',items['course_update_enable']==null?true:items['course_update_enable']);
});

$('#save').click(save);

$('#setroom').click(function () {
  save();
  chrome.storage.local.set({setroom:1},function () {chrome.tabs.create({url:'http://202.120.163.129:88/Default.aspx'})});
});

function save () {
  chrome.storage.local.set({'username':$('#username').val(),'password':$('#password').val(),'interval':parseInt($('#interval').val()),'showReserver':$('#showReserver').prop('checked'),'elec_enable':$('#elec_enable').prop('checked'),'elec_threshold':$('#elec_threshold').val(),'course_update_enable':$('#course_update_enable').val(),'enable':true},function() {
    $('#tip').html('保存成功~').fadeIn().delay(2000).fadeOut();
  });
}
