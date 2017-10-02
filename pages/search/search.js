// pages/search/search.js
const WxService = require(`../../service/WxService`);

const AppService = require(`../../service/AppService`);

const app = getApp();

Page({
  data:{
    suggestList:[],//search页面联想数据
    inputData:"",//search页面输入框中的数据
    historyRecordList:[],//历史记录数组
    cityCode:""
  },
  onLoad:function(){
    WxService.showLoading();
    let _this=this;
    //历史记录
    this.getStorage();
    //城市code
    this.getCityCode();
  },
  onUnload:function(){
    WxService.hideLoading();
  },
  
  focusEvent:function(res){
    this.setData({
      inputData:"",
      suggestList:[]
    });
  },
  /**
   * @introduction: 以下为各种事件。
   */
  inputEvent:function (event) {
    let data = event.detail.value;
    if(data){
      this.dealInputData(data);
    }else{
      this.setData({
        inputData:data,
        suggestList:[]
      });
    }
  },
  searchEvent: function () {
    let str = this.data.inputData;
    let _this = this;
    if (str) {
      let array = this.data.historyRecordList;
      if (!array.includes(str)) {
        array.unshift(str);
      }

      if (array.length > 10) {
        array.length = 10;
        wx.setStorageSync('historyRecordList', array);
      } else {
        wx.setStorageSync('historyRecordList', array);
      }
      _this.setData({
        historyRecordList: array
      });

      WxService.navigateTo(`../searchResult/searchResult?data=${str}`);
    } else {
      WxService.showModal(`提示`, `请输入搜索内容!`, false)
    }
  },
  historyItemEvent: function (res) {
    let i = res.currentTarget.id;
    let data = this.data.historyRecordList[i];
    //data就是获取的(关键字)数据
    if (data) {
      WxService.navigateTo(`../searchResult/searchResult?data=${data}`);
    }
  },
  dealInputData(data){
    let _this = this;
    this.setData({
      inputData: data,
    });
    AppService.suggestSearch(data, _this.data.cityCode).then(res => {
      console.log(`suggestSearch`, res);
      let list = res.data.pois;
      let mylist = [];
      list.forEach((item, i) => {
        mylist[i] = new Object();
        mylist[i].district = list[i].district;
        if (list[i]["name"].match(_this.data.inputData)) {
          mylist[i].leftName = _this.data.inputData;
          mylist[i].rightName = list[i]["name"].substr(_this.data.inputData.length);
          if (list[i]["name"].indexOf(_this.data.inputData) != 0) {
            mylist[i].proName = list[i]["name"].substring(0, list[i]["name"].indexOf(_this.data.inputData));
            mylist[i].rightName = list[i]["name"].substr(list[i]["name"].indexOf(_this.data.inputData) + _this.data.inputData.length);
          }
        } else {
          mylist[i].rightName = list[i]["name"];
        }
      });
      _this.setData({
        suggestList: mylist
      });
    })
  },
  getStorage: function () {
    let value = wx.getStorageSync('historyRecordList');
    !value && (value = []);
    this.setData({
      historyRecordList: value
    });
  },
  getCityCode: function () {
    let _this = this;
    AppService.getCityCode().then(res => {
      _this.data.cityCode = res.code;
      WxService.hideLoading();
    }).catch(e => {
      _this.data.cityCode = 110000;
      WxService.hideLoading();
    });
  },
  itemEvent:function(res){
    let _this = this;
    let i=res.currentTarget.id;
    
    let data1=this.data.suggestList[i].proName;
    let data2=this.data.suggestList[i].leftName;
    let data3=this.data.suggestList[i].rightName;
    if(!data1){
      data1="";
    }
    if(!data2){
      data2="";
    }
    if(!data3){
      data3="";
    }
    let data = data1+data2+data3;
    
    if(data){
      let array = this.data.historyRecordList;
      if(!array.includes(data)){
        array.unshift(data);
      }
      
      if(array.length>10){
        array.length = 10;
        wx.setStorageSync('historyRecordList', array);
      }else{
        wx.setStorageSync('historyRecordList', array);
      }
      _this.setData({
        historyRecordList:array
      });
      WxService.navigateTo(`../searchResult/searchResult?data=${data}`);
    }
  },
  arrowEvent:function(e){
    let index=e.currentTarget.dataset.id;
    let name_proName=(typeof this.data.suggestList[index].proName=="undefined")?"":this.data.suggestList[index].proName;
    let name_leftName=(typeof this.data.suggestList[index].leftName=="undefined")?"":this.data.suggestList[index].leftName;
    let name_rightName=(typeof this.data.suggestList[index].rightName=="undefined")?"":this.data.suggestList[index].rightName;
    let name=name_proName+name_leftName+name_rightName;
    this.setData({
      inputData:name
    });
  },
  historyArrowEvent:function(e){
    let index=e.currentTarget.dataset.index;
    let name=this.data.historyRecordList[index];
    this.setData({
      inputData:name
    });
  },
  clearEvent:function(){

    let _this=this;
    WxService.showModal('提示','是否确认要清除历史记录？',true,(res) => {
      wx.setStorageSync('historyRecordList', []);
      _this.setData({
        historyRecordList:[]
      });
    });
  }
})