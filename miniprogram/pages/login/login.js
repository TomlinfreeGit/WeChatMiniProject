// miniprogram/pages/login/login.js
const app = getApp();
Page({
  
  data: {

  },

  
  onLoad: function (options) {
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，直接跳转首页
          wx.switchTab({
            url: '../index/index',
          })
        }
      }
    })
  },
  auth: function() {
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，直接跳转首页
          wx.switchTab({
            url: '../index/index',
          })
        } else {
          this.onLoad()
        }
      }
    })
  }
  
})