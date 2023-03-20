//showPicture.js
const app = getApp()
const innerAudioContext = wx.createInnerAudioContext();

Page({
  data: {
    openid: '',
    queryResult: '',
    orgResult: '',
    pics: [],
    userInfo:'',
    skip: 5,
    onPlayCSS: 'ok'
  },
  onPullDownRefresh: function() {
    this.onLoad()
    wx.stopPullDownRefresh()
  },
  onReachBottom: function() {
    
    const db = wx.cloud.database()
    var skip = this.data.skip
    this.setData({
      skip : skip + 5
    })
    // 查询下一个5条 notes
    db.collection('notes').skip(skip).limit(5).orderBy('createTime', 'desc').get({
      success: res => {
        this.setData({
          orgResult: this.data.orgResult.concat(res.data)
        })
        var queryResult = res.data
        if(queryResult.length > 0){
          wx.showLoading({
            title: '玩命加载中',
          })
          var pics = this.data.pics
          for (var i in queryResult) {
            queryResult[i].createTime = app.formatTime(queryResult[i].createTime)
            pics = pics.concat(queryResult[i].fileIDs);
            this.setData({
              pics: pics
            })
            const j = i;
            wx.cloud.getTempFileURL({
              fileList: queryResult[j].fileIDs,
              success: res => {
                queryResult[j].fileIDs = res.fileList
                this.setData({
                  queryResult: this.data.queryResult.concat(queryResult[j])
                })
                wx.hideLoading()
              },
              fail: err => {
                // handle error
              }
              })
            }
          }
        
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '查询记录失败'
        })
        console.error('[数据库] [查询记录] 失败：', err)
      }
    })
  },
  onLoad: function (options) {
    if (app.globalData.openid) {
      this.setData({
        openid: app.globalData.openid
      })
    }
    this.setData({
      pics: [],
      skip: 5,
      onPlayCSS: 'ok'
    })
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
    const db = wx.cloud.database()
    // 查询当前用户所有的 notes
    db.collection('notes').limit(5).orderBy('createTime', 'desc').get({
      success: res => {
        if (res.data.length < 1) {
          this.setData({
            queryResult: ''
          })
          return false;
        }
        this.setData({
          orgResult: res.data
        })
        var queryResult = res.data
        var pics = this.data.pics
        for (var i in queryResult) {
          queryResult[i].createTime = app.formatTime(queryResult[i].createTime)
          pics = pics.concat(queryResult[i].fileIDs);
          this.setData({
            pics : pics
          })
          const j = i;
          wx.cloud.getTempFileURL({
            fileList: queryResult[j].fileIDs,
            success: res => {
              queryResult[j].fileIDs = res.fileList
              this.setData({
                queryResult:queryResult,
              })
            },
            fail: err => {
              // handle error
            }
          })
        }
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '查询记录失败'
        })
        console.error('[数据库] [查询记录] 失败：', err)
      }
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

  //播放语音
  doPlay: function (e) {
    var record = [].concat(e.currentTarget.dataset.record);
    var onPlayCSS = e.currentTarget.dataset.record
    var orgResult = this.data.orgResult
    for (var i in orgResult) {
      if (orgResult[i].record == onPlayCSS) {
        onPlayCSS = i
      }
    }
    wx.cloud.getTempFileURL({
      fileList: record,
      success: res => {
        innerAudioContext.src = res.fileList[0].tempFileURL
        innerAudioContext.autoplay = true
        innerAudioContext.play()
        innerAudioContext.onPlay(() => {
          console.log('开始播放')
          this.setData({
            onPlayCSS: onPlayCSS
          })
        })
        innerAudioContext.onEnded(()=>{
          console.log('播放结束')
          this.setData({
            onPlayCSS: 'ok'
          })
        })
        innerAudioContext.onError((res) => {
          console.log(res.errMsg)
          console.log(res.errCode)
        })
      },
      fail: err => {
        // handle error
      }
    })
    
  },

  //删除数据
  doDelete: function (e) {
    wx.showLoading({
      title: '删除中',
    })
    const db = wx.cloud.database()
    var id = e.currentTarget.dataset.index;
    var orgResult = this.data.orgResult
    var fileIDs = []
    var record = ''
    for (var i in orgResult) {
      if(orgResult[i]._id == id) {
        fileIDs = orgResult[i].fileIDs
        record = orgResult[i].record
      }
    }
    if(record){
      fileIDs = fileIDs.concat(record)
    }
    wx.cloud.deleteFile({
      fileList: fileIDs
    })
    db.collection('notes').doc(id).remove({
      success(res) {
        wx.hideLoading() 
      }
    })
    this.onLoad()
  }
})


