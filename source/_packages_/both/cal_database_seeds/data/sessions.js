Meteor.startup(function () {



    //构造不同阶段的场景
    var stageData={

        1:{
            sessionNow:'testSession2',
            sessionRegister:'testSession3'

        },
        2:{
            sessionNow:'testSession2',
            sessionRegister:'testSession4'

        },
        3:{
            sessionNow:'testSession2',
            sessionRegister:'testSession5'
        },
        4:{
            sessionNow:'testSession2',
            sessionRegister:'testSession6'
        },

        //sessionNow ==sessionRegister
        5:{
            sessionNow:'testSession2',
            sessionRegister:'testSession2'
        },

        6:{
            sessionNow: "intenseSession1",
            sessionRegister: "testSession2"
        },
        7:{
            sessionNow: "intenseSession2",
            sessionRegister: "testSession2"
        },
        8:{
            sessionNow: "intenseSession3",
            sessionRegister: "testSession2"
        },
        //冻结
        '-1':{
            sessionNow:'testSession2',
            sessionRegister:'testSession100'

        },
        '-2':{
            sessionNow:'testSession2',
            sessionRegister:'testSession200'

        }

    }


    //假定从registerStartDate 到 startDate 41天（接近6周）一个session 90天
    var sessionsData=[

        //history
        {
            _id:'testSession1',
            name:'testSession1',
            registerStartDate:new Date(+new Date() - (1000 * 3600 * 24 * (150  + 1))),
            startDate:new Date(+new Date() + (1000 * 3600 * 24 * (-110 )))
        },

        //current session  61天前一开始注册 20天前开始 还有70天才结束
        {
            _id:'testSession2',
            name:'testSession2',
            registerStartDate:new Date(+new Date() - (1000 * 3600 * 24 * ( 60+1))),
            startDate:new Date(+new Date() + (1000 * 3600 * 24 * (-20 ))),
            endDate:new Date(+new Date() + (1000 * 3600 * 24 * (-20 +90)))
        },


        //第1周  1天前已开始注册
        {
            _id:'testSession3',
            name:'testSession3',
            registerStartDate:new Date(+new Date() - (1000 * 3600 * 24 * (1))),
            startDate:new Date(+new Date() + (1000 * 3600 * 24 * (40)))
        },
        //第2周
        {
            _id:'testSession4',
            name:'testSession4',
            registerStartDate:new Date(+new Date() - (1000 * 3600 * 24 * (7+1))),
            startDate:new Date(+new Date() + (1000 * 3600 * 24 * (33)))
        },
        //第3周
        {
            _id: 'testSession5',
            name: 'testSession5',
            registerStartDate: new Date(+new Date() - (1000 * 3600 * 24 * (14 + 1))),
            startDate: new Date(+new Date() + (1000 * 3600 * 24 * (26)))
        },

        //第4周
        {
            _id:'testSession6',
            name:'testSession6',
            registerStartDate:new Date(+new Date() - (1000 * 3600 * 24 * (21+1))),
            startDate:new Date(+new Date() + (1000 * 3600 * 24 * (19)))
        },

        //36天前已开始注册 5天后就开始  处于开始前的冻结期（一周）
        {
            _id:'testSession100',
            name:'testSession100',
            registerStartDate:new Date(+new Date() - (1000 * 3600 * 24 * (36))),
            startDate:new Date(+new Date() + (1000 * 3600 * 24 * (5)))
        },

        //特殊情况 5天后才开始注册
        //新的session已设置 当前session相应停止注册
        //但新session的registerStartDate还没开始
        {
            _id:'testSession200',
            name:'testSession200',
            registerStartDate:new Date(+new Date() + (1000 * 3600 * 24 * ( 5))),
            startDate:new Date(+new Date() + (1000 * 3600 * 24 * (5+41 )))
        },
        {
            name:'Intense 1',
            registerStartDate:new Date(+new Date() - (1000 * 3600 * 24 * ( 30))),
            startDate:new Date(+new Date() + (1000 * 3600 * 24 * (30*1 ))),
            endDate: new Date(+new Date() + (1000 * 3600 * 24 * (30*2 ))),
            programIds: ["intense"]
        },
        {
            name:'Intense 2',
            registerStartDate:new Date(+new Date() - (1000 * 3600 * 24 * ( 30))),
            startDate:new Date(+new Date() + (1000 * 3600 * 24 * (30*2 ))),
            endDate: new Date(+new Date() + (1000 * 3600 * 24 * (30*3 ))),
            programIds: ["intense"]
        },
        {
            name:'Intense 3',
            registerStartDate:new Date(+new Date() - (1000 * 3600 * 24 * ( 30))),
            startDate:new Date(+new Date() + (1000 * 3600 * 24 * (30*3 ))),
            endDate: new Date(+new Date() + (1000 * 3600 * 24 * (30*4 ))),
            programIds: ["intense"]
        }
    ]


    function resetData(){
        DB.Sessions.remove({});

        sessionsData.forEach(function(session,i,a){

            console.log(+session.startDate + (1000 * 3600 * 24 * 90))

            function toID(str){
                str = str.toLowerCase();
                return str.replace(/\s/g, function(){
                    return "";
                });
            }

            var sessionObj = {
                _id: session._id || toID(session.name) ,
                name: session.name,
                // 模拟4个不同的注册时间
                registerStartDate: session.registerStartDate,
                startDate:session.startDate,
                endDate:session.endDate || +session.startDate + (1000 * 3600 * 24 * 90)
            };

            if(session.programIds){
                sessionObj.programIds = session.programIds;
            }

            DB.Sessions.insert(sessionObj);
        })
    }




    if (DB.Sessions.find({}).count() === 0) {
        resetData();
    }


    calTestData.resetSessions = resetData



    //添加设置的 methods
    if (Meteor.isServer) {

        Meteor.methods({
            'test_change_stage':function(stage){
                var config = stageData[stage]
                if(!config) {
                    throw new Meteor.Error(500, stage+' stage config does not exist');
                }

                //重置数据
                resetData()


                var sessionNowInfo = DB.Sessions.findOne({_id:config.sessionNow})
                var sessionRegisterInfo = DB.Sessions.findOne({_id:config.sessionRegister})


                var appInfo = DB.App.findOne()
                var result = DB.App.update(
                    {_id: appInfo._id}, {
                        $set: {
                            sessionNow: config.sessionNow,
                            sessionRegister:config.sessionRegister,

                            //详细信息
                            sessionNowInfo:sessionNowInfo,
                            sessionRegisterInfo:sessionRegisterInfo
                        }
                    })

                //主动执行定时任务 更新状态
                calStageManager.updateSession()
                calStageManager.updateStage()

                return result

            }

        })

    }



});