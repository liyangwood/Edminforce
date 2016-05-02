
Schema = {};
Validate = {};

Schema.const = {
    day : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    tuitionType : ['class', 'session'],
    status : ['Active', 'Inactive'],
    level : ['', 'Beginner', 'Intermediate', 'Advanced'],
    genderRequire : ['All', 'Male', 'Female'],
    //length : ['30 min', '45 min', '1 hr', '1.5 hr', '2 hr']

    registrationStatus : ['trail', 'register', 'wait', 'makeup']
};

Schema.ClassSchedule = {
    day : KG.schema.default({
        allowedValues : Schema.const.day
    }),
    time : KG.schema.default()
};
Schema.ClassTuition = {
    type : KG.schema.default({
        allowedValues : Schema.const.tuitionType
    }),
    money : KG.schema.default({
        label : 'Tuition money'
    })
};


Validate.Class = {
    'MinStudentMoreThanMaxStudent' : 'max student is must more than minimum student!',
    'NumberOfClassLess' : 'calculate "[label]" is 0, please check!',

    '610' : 'max age is must more than minimum age'
};

Schema.Class = {
    name : KG.schema.default({
        optional : true
    }),

    programID : KG.schema.default(),
    sessionID : KG.schema.default(),
    status : KG.schema.default({
        allowedValues: Schema.const.status
    }),
    length : KG.schema.default(),
    level : KG.schema.default({
        allowedValues : Schema.const.level,
        optional : true,
        defaultValue : 'Beginner'
    }),
    teacher : KG.schema.default({}),
    schedule : {
        type : new SimpleSchema(Schema.ClassSchedule)
    },
    tuition : {
        type : new SimpleSchema(Schema.ClassTuition)
    },
    numberOfClass : KG.schema.default({
        type : Number,
        label : 'Number Of Class',
        optional : true
        //custom : function(){
        //    if(this.value < 1){
        //        return 'NumberOfClassLess';
        //    }
        //}
    }),
    maxStudent : KG.schema.default({
        type : Number,
        label : 'Maximum Student',
        custom : function(){
            let min = this.field('minStudent');
            //console.log(min, this.value);
            if(this.value < min.value){
                //throw new Error('max student is must more than minimum student');
                return 'MinStudentMoreThanMaxStudent';
            }

        }
    }),
    minStudent : KG.schema.default({
        defaultValue : 0,
        type : Number,
        label : 'Minimum Student'
    }),
    trialStudent : KG.schema.default({
        defaultValue : 0,
        optional : true,
        type : Number,
        label : 'Trial Student'
    }),
    makeupStudent : KG.schema.default({
        defaultValue : 0,
        optional : true,
        type : Number,
        label : 'Makeup Student'
    }),

    minAgeRequire : KG.schema.default({
        type : Number,
        defaultValue : 0,
        optional : true,
        label : 'Minimum Age'
    }),
    maxAgeRequire : KG.schema.default({
        type : Number,
        optional : true,
        defaultValue : 100,
        label : 'Maximum Age',
        custom : function(){
            let min = this.field('minAgeRequire');
            if(this.value < min.value){
                return '610';
            }
        }
    }),
    genderRequire : KG.schema.default({
        allowedValues : Schema.const.genderRequire,
        defaultValue : 'All'
    }),

    makeupClassFee : KG.schema.default({
        type : Number,
        optional : true,
        defaultValue : 0
    }),

    // number of registered regular students
    numberOfRegistered : KG.schema.default({
        type : Number,
        optional : true,
        defaultValue : 0
    }),

    // trial class record, each lesson date
    // has a count.
    // { 'd20160101' : 2}
    trial: {
      type: Object,
      optional: true,
      blackbox: true,
      defaultValue: {}
    },

    // makeup class record, same format as trial
    makeup: {
      type: Object,
      optional: true,
      blackbox: true,
      defaultValue: {}
    },

    createTime : KG.schema.createTime(),
    updateTime : KG.schema.updateTime()
};

Schema.ClassStudentPayment = {
    time : KG.schema.default({
        type : Date,
        optional : true,
        autoValue : function(doc){
            if(this.isInsert || this.isUpdate){
                if(doc.payment && doc.payment.status === 'success'){
                    return new Date()
                }
            }
        }
    }),
    status : KG.schema.default({
        optional : true
    }),
    money : KG.schema.default({
        optional : true
    }),
    type : KG.schema.default({
        optional : true
    })
};
Validate.ClassStudent = {

};
Schema.ClassStudent = {
    classID : KG.schema.default(),
    studentID : KG.schema.default(),
    accountID : KG.schema.default({
        optional : true
    }),
    programID : KG.schema.default({
        optional : true
    }),
    type : KG.schema.default({
        allowedValues : ['trial', 'register', 'wait', 'makeup'],
        custom : function(){

            return KG.get('EF-ClassStudent').validateSchemaStatus({
                type : this.value,
                classID : this.field('classID').value,
                studentID : this.field('studentID').value
            });

        }
    }),
    status : KG.schema.default({
        allowedValues : ['pending', 'checkouted', 'canceled', 'expired'],
        optional : true,
        defaultValue : 'pending'
    }),
    orderID : KG.schema.default({
        optional : true
    }),
    lessonDate : {
        type : Date,
        optional : true
    },
    createTime : KG.schema.createTime(),
    updateTime : KG.schema.updateTime(),
    dynamicKey : KG.schema.default({
        optional : true
    })
};
