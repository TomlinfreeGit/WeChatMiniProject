//app.js
App({
  onLaunch: function () {
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true,
      })
    }

    this.globalData = {
      openid:'',
      userInfo : ''
    }
  },

  //时间格式转换
  formatTime: function (time) {
    var n = time * 1;
    var date = new Date(n);
    var Y = date.getFullYear() + '年';
    var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '月';
    var D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + '日';
    var h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + '时';
    var m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + '分';
    var s = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()) + '秒';
    return (Y + M + D + h + m + s)
  },


  //多张图片上传
   uploadimg: function(data){
    wx.showLoading({
      title: '上传中',
    })
    var that = this,
    i=data.i ? data.i : 0,//当前上传的哪张图片
    success=data.success ? data.success : 0,//上传成功的个数
    fail=data.fail ? data.fail : 0;//上传失败的个数
    wx.cloud.uploadFile({
      cloudPath: Date.parse(new Date) + data.pics[i].match(/\.[^.]+?$/)[0],
      filePath: data.pics[i],
      success: (res) => {
        success++;//图片上传成功，图片上传成功的变量+1
        data.fileIDs = data.fileIDs.concat(res.fileID)
        //这里可能有BUG，失败也会执行这里,所以这里应该是后台返回过来的状态码为成功时，这里的success才+1 
      },
      fail: (res) => {
        fail++;//图片上传失败，图片上传失败的变量+1
        console.log('fail:' + i + "fail:" + fail);
      },
      complete: () => {
        i++;//这个图片执行完上传后，开始上传下一张            
        if (i == data.pics.length) {   //当图片传完时，停止调用          
          if (data.record) {
            wx.cloud.uploadFile({
              cloudPath: Date.parse(new Date) + data.record.match(/\.[^.]+?$/)[0],
              filePath: data.record,
              success: (res) => {
                wx.cloud.database().collection('notes').add({
                  data: {
                    fileIDs: data.fileIDs,
                    text: data.text,
                    createTime: data.createTime,
                    count: success,
                    userInfo: data.userInfo,
                    record: res.fileID
                  },
                  success: res => {
                  },
                  fail: err => {
                    console.error('[数据库] [新增记录] 失败：', err)
                  }
                })
              },
              fail: (res) => {
                console.log(res);
              }
            })
          } else {
            wx.cloud.database().collection('notes').add({
              data: {
                fileIDs: data.fileIDs,
                text: data.text,
                createTime: data.createTime,
                count: success,
                userInfo: data.userInfo,
                record: ''
              },
              success: res => {},
              fail: err => {
                console.error('[数据库] [新增记录] 失败：', err)
              }
            })
          }
          wx.hideLoading()
          wx.showToast({
            title: '发布成功',
            icon: 'success',
            duration: 2000,
            success:res=>{
              wx.navigateTo({
                url: '../index/index',
              })
            }
          })
          console.log('执行完毕');
          console.log('成功：' + success + " 失败：" + fail);
        } else {//若图片还没有传完，则继续调用函数                
          data.i = i;
          data.success = success;
          data.fail = fail;
          that.uploadimg(data);
        }
      }
    })
  },
  //多张图片下载
  downloadimg: function(data) {
    var that = this,
    i = data.i ? data.i : 0;
    // console.log(data.queryResult)
    wx.cloud.downloadFile({
      fileID: data.queryResult[i].fileID,
      success: res => {
        data.queryResult[i].fileID = res.tempFilePath
        i++
        if (i == data.queryResult.length) {
          console.log('执行完毕');
        } else {
          data.i = i;
          that.downloadimg(data);
        }
      },
      fail: e => {
        console.error('[读取图片] 失败：', e)
      },
    })
  }

})
