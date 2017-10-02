//index.js
const WxService = require(`../../service/WxService`);

const AppService = require(`../../service/AppService`);

const app = getApp();

const systemInfo = require(`../../utils/util`).systemInfo;

Page({
  data: {
    array:[{
      src:"../resouces/myicon/index_a.png",
      content:"设置目的地，自动建群"
    },{
      src:"../resouces/myicon/share.png",
      content:"分享给好友"
    },{
      src:"../resouces/myicon/group.png",
      content:"好友加入群组"
    },{
      src:"../resouces/myicon/distance.png",
      content:"查看群成员剩余距离"
    },{
      src:"../resouces/myicon/time.png",
      content:"查看群成员剩余时间"
    },{
      src:"../resouces/myicon/groupchat.png",
      content:"群组语音聊天"
    }],
    userimg: "../resouces/myicon/userImg.png",

    userInfo: {},//初始化的用户昵称、头像信息
    groupList: [],//用于展示群的列表
    groupNumber: null,

    ismaxDistance: false,
    istotalDistance: false,

    windowHeight: (systemInfo.windowHeight * (750 / systemInfo.screenWidth) - 400)+'rpx',
    listHeight: (systemInfo.windowHeight * (750 / systemInfo.screenWidth) - 738) + 'rpx',
    color: "#f8f8f8",

    //modal相关
    modalHidden:true,
    confirmData:null,
    inputValue:"",
  },
  onLoad: function (options) {
    WxService.showLoading();
    //ios || android 应用调起小程序，跳转群组页面
    options.groupId && this.gotoDestinationByGroupId(options.groupId);
  },
  onShow: function (options) {
    wx.setNavigationBarTitle({ title: '图吧同行' });
    this.initData();
  },
  onUnload: function(){
    WxService.hideLoading();
  },
  onShareAppMessage: function () {
    return {
      title: '图吧同行',
      path: '/pages/index/index'
    }
  },
  initData: function(){
    let _this = this;
    AppService.getUserInfo().then(res => {
      WxService.hideLoading();
      if (res.statusCode == 200) {
        res.data.user.maxDistance = (res.data.user.maxDistance == null) ? 0 : (res.data.user.maxDistance * 1000).toFixed(0);
        res.data.user.totalDistance = (res.data.user.totalDistance == null) ? 0 : (res.data.user.totalDistance * 1000).toFixed(0);
        if (res.data.user.maxDistance > 1000) {
          res.data.user.maxDistance = (res.data.user.maxDistance / 1000).toFixed(1);
          _this.setData({
            ismaxDistance: true
          })
        }
        if (res.data.user.totalDistance > 1000) {
          res.data.user.totalDistance = (res.data.user.totalDistance / 1000).toFixed(1);
          _this.setData({
            istotalDistance: true
          })
        }
        //缓存全局userid，在适当的时候使用，可减少http请求。
        app.globalData.userInfo = res.data.user;
        _this.setData({
          userInfo: res.data.user,
          groupList: res.data.groupList,
          groupNumber: res.data.groupList.length
        })
      }
    }).catch(err => {
      console.log(err);
      WxService.hideLoading();
      WxService.showToast('信息获取异常');
    })
  },
  

  
  //页面跳转相关的函数!!!!
  tapEvent: function() {
    WxService.navigateTo(`../search/search`);
  },
  helpEvent:function(){
    WxService.navigateTo(`../help/help`);
  },
  enterGroupEvent:function(res){
    let _this = this;
    let groupIndex = res.currentTarget.dataset.id;  
    let groupId = this.data.groupList[groupIndex].groupId;
    let isGroupHost = (String(_this.data.groupList[groupIndex].userId)==String(_this.data.userInfo.userId))?true:false;
    let lat = this.data.groupList[groupIndex].lat;
    let lon = this.data.groupList[groupIndex].lon;

    if(groupId){
      WxService.navigateTo(`../destination/destination?groupId=${groupId}&isGroupHost=${isGroupHost}&lat=${lat}&lon=${lon}`);
    }
  },
  modalChange:function() {
    let groupId = Number(this.data.confirmData);
    this.gotoDestinationByGroupId(groupId,()=>{
      wx.showToast({
        title: '请检查您的输入是否是数字',
        icon: 'loading',
        duration: 2000
      })
    });
  },
  // 用于处理ios和android分享的处理函数。
  gotoDestinationByGroupId: function (groupid,next){
    let _this = this;
    let isGroupHost = this.isGroupHost(groupid);
    let groupId = groupid;
    if (groupId) {
      WxService.navigateTo(`../destination/destination?groupId=${groupId}&isGroupHost=${isGroupHost}`);
      this.setData({
        modalHidden: true
      })
    } else {
      next && next();
    }
  },
  // 功能函数
  isGroupHost: function(groupId){
    let thisGroup = this.data.groupList.find((item,index)=>{
      return item.groupId == groupId
    });
    if (thisGroup && thisGroup.userId == this.data.userInfo.userId){
      return true;
    }else{
      return false;
    }
  },
  // 底部输入框相关
  touchStartEvent: function () {
    console.log('start');

    this.setData({
      color: "#aaaaaa",
      modalHidden: false
    })
  },
  touchEndEvent: function () {
    console.log('end');
    this.setData({
      color: "#f8f8f8"
    })
  },
  // modal框相关
  modalCancel: function () {
    this.setData({
      modalHidden: true
    });
  },
  inputEvent: function (event) {
    this.setData({
      confirmData: event.detail.value,
      isShowName: event.detail.value ? true:false
    });
  },
  clearContentEvent: function () {
    this.setData({
      inputValue: ``,
      isShowName: false
    })
  }
})


/**
 * @index界面梳理
 * 1、功能梳理
 *  a、有群组的时候展示的群组界面，没有群组的时候展示引导页
 *  b、顶部点击跳转搜索功能
 *  c、帮助页面跳转功能
 *  d、接收ios和android分享的功能
 *  e、群号码搜索的功能
 *  f、群组列表有跳转群组的的功能
 * 2、接口梳理
 *  a、getUserInfo获取用户信息的接口
 * 3、逻辑梳理
 *  a、在onload中，直接判断是否有传递信息。进行相关跳转处理。（这个主要针对群组导航调起小程序，是一个单独功能，与其他逻辑完全隔离。）
 * 4、事件梳理
 * 4、catch处理：网络状态处理，数据请求处理
 * 5、可能存在的bug：已经解决
 */

