/**
 * Created by Administrator on 2017/2/13.
 */
"use strict";
angular.module('douban',['ng','ngRoute'])
  .config(function($routeProvider){

    $routeProvider
      .when('/main/:sid', {
        templateUrl: 'tpl/main.html',
        controller:'mainCtrl'
      })
      .when('/detail/:mid', {
        templateUrl: 'tpl/detail.html',
        controller:'detailCtrl'
      })
      .when('/search/:mname',{
        templateUrl: 'tpl/search.html',
        controller:'searchCtrl'
      })
      .when('/search/:mname/:page',{
        templateUrl: 'tpl/search.html',
        controller:'searchCtrl'
      })
      .otherwise({redirectTo: '/main/0'})
  })
  .controller('parentCtrl',
    ['$scope','$location','$rootScope',
      function ($scope,$location,$rootScope) {

        //通用跳转方法
        $scope.jump = function (arg) {
          $location.path(arg);
        };

        //创建一个根电影列表，用于临时储存数据
        $rootScope.movieList=[];


      }])
  .controller('mainCtrl',
    ['$scope','$http','$interval','$rootScope','$routeParams',
      function($scope,$http,$interval,$rootScope,$routeParams){

        //当前在第几页
        $scope.start = $routeParams.sid || 0 ;

        //每页显示几条信息
        $scope.count = 20;

        //总页数
        $scope.totalNum = Math.floor( 250 / $scope.count ) ;

        //意外情况时的处理
        $scope.start = $scope.start < 0 ? 0 :
                       $scope.start > $scope.totalNum ? $scope.totalNum :
                       parseFloat($scope.start);

        //如果根电影数据里没有当前页的数据时，向Url请求数据
        if($rootScope.movieList[$scope.start]==undefined){
          //请求数据,使用的是jQuery,因为NG的jsonp获取失败
          $.ajax('https://api.douban.com/v2/movie/top250',{
            dataType:'jsonp',

            //请求参数（默认start:0,count:20）
            data:{start:$scope.start*$scope.count,count:$scope.count},

            success:function(data) {
              //将数据储存到根文件下
              $rootScope.movieList[$scope.start]=data.subjects;
            }
          });
        };

        //刷新页面，直到有数据为止(实现原理是使用内置计时器，不断刷新数据,应该有更好的办法。。。)
        //更好的方法：使用$scope.$apply(绑定的数据) 可以在数据更新后在DOM上显示
        let toDo = function(){
          if($rootScope.movieList[$scope.start]!=undefined){
            //刷新页面
            location.href = '#/main/' + $scope.start;
            //滚动到页面顶部
            $rootScope.returnTop();
            //将获取的数据从根目录取出放到当前页面上
            $scope.movieList = $rootScope.movieList[$scope.start];
            //结束刷新数据定时器
            $interval.cancel( $scope.timer );
            //加载完毕
            $scope.loading = false;
          }
        };
        //开启刷新数据定时器
        $scope.timer = $interval(toDo , 10);

        //loading页面
        $scope.loading = true;

        //翻页按钮数字为几
        if ( $scope.start + 1 < 3 ) {
          $scope.pageNum = 3;
        }else if ( $scope.start + 1 > $scope.totalNum - 2){
          $scope.pageNum = $scope.totalNum - 2;
        }else {
          $scope.pageNum = $scope.start + 1;
        }

        //返回顶部
        $rootScope.returnTop = function (){
          window.scrollBy(0,-100);
          if(document.body.scrollTop>0) {
            setTimeout($rootScope.returnTop,20);
          }
        };
    }])
  .controller('detailCtrl',
    ['$scope','$routeParams',
      function($scope,$routeParams){

        //数据加载中
        $scope.loading = true;

        //请求页面ID获取
        $scope.movieId = $routeParams.mid || 0 ;

        $.ajax({
          url:'https://api.douban.com/v2/movie/subject/'+$scope.movieId,
          dataType:'jsonp',
          success:function(data){
            $scope.$apply(
              $scope.movieDetail = data
            );
            $scope.$apply(
              $scope.movieTable ={
              '导演': data.directors,
              '主演': data.casts,
              '类型': data.genres,
              '制片国家/地区': data.countries,
              '电影别名': data.aka,
              '豆瓣评分': data.rating}
            )
          }
        })

        //返回上一页
        $scope.back = function(){
          history.go(-1);
        }
      }
    ])
  .controller('searchCtrl',
    ['$scope','$routeParams','$interval',
      function($scope,$routeParams,$interval){
        //搜索电影名称获取
        $scope.mname = $routeParams.mname;
        //页数获取
        $scope.start = $routeParams.page || 0;
        //每页多少条数据
        $scope.count = 20;

        $scope.start = $scope.start < 0 ? 0 : parseFloat($scope.start);
        $.ajax({
          url:'https://api.douban.com/v2/movie/search?q='+$scope.mname,
          dataType:'jsonp',
          data:{start:$scope.start*$scope.count},
          success:function(data){
            $scope.$apply(
              $scope.loading = data
            );
            $scope.$apply(
              $scope.isNoMore = (data.total==0)
            );
            $scope.$apply(
              $scope.movieList = data.subjects
            );
          }
        })
        //let toDo = function(){
        //  if ($scope.movieList){
        //
        //  }
        //}
        //$scope.timer=$interval(toDo , 10);
  }]);