//addPicture.js
const app = getApp()
const recorderManager = wx.getRecorderManager();
const innerAudioContext = wx.createInnerAudioContext();

Page({
  data: {
    openid: '',
    userInfo: '',
    content: '',
    pics: [],
    count: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    isShow: true,
    progress: 0,
    startTime: 0,
    endTime: 0,
    recordTempFile: '',
    recordImg: '/images/record.png',
    timer: ''
  },
  onPullDownRefresh: function () {
    this.onLoad()
    wx.stopPullDownRefresh()
  },
  onLoad: function (options) {
    if (app.globalData.openid) {
      this.setData({
        openid: app.globalData.openid
      })
    }
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                userInfo: res.userInfo
              })
            }
          })
        }
      }
    })
    clearInterval(this.data.timer)
    this.setData({
      pics:[],
      content:'',
      progress: 0,
      startTime: 0,
      endTime: 0,
      recordTempFile: '',
      recordImg: '/images/record.png',
      timer: ''
    })
  },

  //选择图片
  chooseImage: function () {
    var pics = this.data.pics
    wx.chooseImage({
      count: 9 - pics.length,
      sizeType: ['original','compressed'],
      sourceType: ['album','camera'],
      success: res => {
        this.setData({
          pics : pics.concat(res.tempFilePaths)
        })
        pics = pics.concat(res.tempFilePaths)
        if (pics.length >= 9) {
          this.setData({
            isShow: (!this.data.isShow)
          })
        } else {
          this.setData({
            isShow: (this.data.isShow)
          })
        }
      },
      fail: function(res) {},
      complete: function(res) {},
      })
  },

  // 图片预览
  previewImage: function (e) {
    var current = e.target.dataset.src
    wx.previewImage({
      current: current,
      urls: this.data.pics
    })
  },

  //失去焦点时获取文本内容
  bindTextAreaBlur: function (e) {
    console.log(e.detail.value)
    this.setData({
      content: e.detail.value,
    })
  },

  // 上传图片
  doUpload: function() {
    var pics = this.data.pics
    var text = this.data.content
    var createTime = Date.parse(new Date)
    var userInfo = this.data.userInfo
    var record = this.data.recordTempFile
    if(pics.length > 0) {
      if(pics.length >= 9) {
        this.setData({
          isShow: true
        })
      }
      app.uploadimg({
        userInfo: userInfo,
        fileIDs: [],
        pics: pics,
        text: text,
        createTime: createTime,
        record: record
      })
      this.onLoad()
    } else {
      wx.showToast({
        title: '请选择图片',
        icon: 'none',
        duration: 2000,
      })
    }
  },

  //录音
  touchStart: function(e) {
    var that = this;
    this.setData({
      startTime:e.timeStamp
    })
    const options = {
      duration: 60000,//指定录音的时长，单位 ms
      sampleRate: 16000,//采样率
      numberOfChannels: 1,//录音通道数
      encodeBitRate: 96000,//编码码率
      format: 'mp3',//音频格式，有效值 aac/mp3
      frameSize: 100,//指定帧大小，单位 KB
    }
    //开始录音
    recorderManager.start(options);
    recorderManager.onStart(() => {
      console.log('开始录音')
      clearInterval(this.data.timer)
      this.setData({
        progress: 0
      })
      this.data.timer = setInterval(function () {
        that.setData({
          progress: that.data.progress + 0.5
        })
      }, 500);
    });
    //错误回调
    recorderManager.onError((res) => {
      console.log(res);
    })
  },

  touchEnd: function(e) {
    this.setData({
      endTime: e.timeStamp
    })
    var endTime = e.timeStamp
    var startTime = this.data.startTime
    recorderManager.stop();
    recorderManager.onStop((res) => {
      console.log('停止录音')
      clearInterval(this.data.timer)
      this.setData({
        recordTempFile: res.tempFilePath
      })
    })
  },

  doRecord: function(e) {},

  doPlay: function(e) {
    innerAudioContext.autoplay = true
    innerAudioContext.src = this.data.recordTempFile
    if (this.data.recordTempFile) {
      innerAudioContext.play()
    }
    innerAudioContext.onPlay(() => {
      var that = this;
      that.setData({
        progress: innerAudioContext.currentTime
      })
      console.log('开始播放')
      this.setData({
        recordImg: '/images/recordon.png'
      })
      this.data.timer = setInterval(function() {
        if (innerAudioContext.currentTime >= innerAudioContext.duration){
          return false;
        }
        that.setData({
          progress: innerAudioContext.currentTime
        })
      },500);
    })
    innerAudioContext.onEnded(() => {
      console.log('停止播放')
      clearInterval(this.data.timer)
      this.setData({
        recordImg: '/images/record.png'
      })
    })
    innerAudioContext.onError((res) => {
      console.log(res.errMsg)
      console.log(res.errCode)
    })
  }


    

})
