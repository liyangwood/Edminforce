
KUI.Student_comp_add = class extends KUI.Page{
    constructor(p){
        super(p);

        this.m = KG.DataHelper.getDepModule();
    }

    getMeteorData(){

        let x = Meteor.subscribe('EF-ClassLevel');

        return {
            ready : x.ready()
        };
    }

    render(){

        var p = {
            name : {
                labelClassName : 'col-xs-3',
                wrapperClassName : 'col-xs-9',
                ref : 'name',
                label : 'Student Name'
            },
            gender : {
                labelClassName : 'col-xs-3',
                wrapperClassName : 'col-xs-4',
                ref : 'gender',
                label : 'Gender'
            },
            birthday : {
                labelClassName : 'col-xs-3',
                wrapperClassName : 'col-xs-4',
                ref : 'birthday',
                label : 'Birthday'
            },
            level : {
                labelClassName : 'col-xs-3',
                wrapperClassName : 'col-xs-4',
                ref : 'level',
                label : 'Level'
            },
            status : {
                labelClassName : 'col-xs-3',
                wrapperClassName : 'col-xs-4',
                ref : 'status',
                label : 'Status'
            },
            school : {
                labelClassName : 'col-xs-3',
                wrapperClassName : 'col-xs-9',
                ref : 'school',
                label : 'School'
            },
            note : {
                labelClassName : 'col-xs-3',
                wrapperClassName : 'col-xs-9',
                ref : 'note',
                label : 'Notes'
            },

            lastDate : {
                labelClassName : 'col-xs-3',
                wrapperClassName : 'col-xs-4',
                ref : 'lastDate',
                label : 'Last Registration Date'
            }
        };


        const sy = {
            td : {
                textAlign : 'left'
            },
            ml : {
                marginLeft : '20px'
            },
            rd : {
                textAlign : 'right'
            }
        };

        let op_status = this.m.Student.getDBSchema().schema('status').allowedValues,
            op_gender = this.m.Student.getDBSchema().schema('profile.gender').allowedValues;

        let op_level = this.m.ClassLevel.getDB().find().fetch();

        return (
            <form className="form-horizontal">
                <RB.Row>
                    <RB.Col md={12} mdOffset={0}>
                        <RB.Input type="text" {... p.name} />
                        <RB.Input type="select" {... p.gender}>
                            {
                                _.map(op_gender, (item, index)=>{
                                    return <option key={index} value={item}>{item}</option>;
                                })
                            }
                        </RB.Input>
                        <RB.Input type="text" {... p.birthday} />

                        <RB.Input type="select" {... p.level}>
                            {
                                _.map(op_level, (item, index)=>{
                                    return <option key={index} value={item._id}>{item.alias||item.name}</option>;
                                })
                            }
                        </RB.Input>

                        <RB.Input type="select" {... p.status}>
                            {
                                _.map(op_status, (item, index)=>{
                                    return <option key={index} value={item}>{item}</option>;
                                })
                            }
                        </RB.Input>
                        <RB.Input type="text" {... p.school} />

                        <RB.Input type="textarea" {... p.note} />

                        <RB.Input type="text" {... p.lastDate} />

                    </RB.Col>
                </RB.Row>
            </form>
        );
    }

    getRefs(){
        return {
            name : this.refs.name,
            gender : this.refs.gender,
            birthday : this.refs.birthday,
            status : this.refs.status,
            school : this.refs.school,
            note : this.refs.note,

            lastDate : this.refs.lastDate
        };
    }

    getValue(){
        let {name, gender, birthday, status, note, school, lastDate} = this.getRefs();

        let sd = {
            name : name.getValue(),
            status : status.getValue(),
            level : this.refs.level.getValue(),
            profile : {
                birthday : moment(birthday.getValue(), util.const.dateFormat).toDate(),
                gender : gender.getValue(),
                school : school.getValue(),
                note : note.getValue()
            },
            lastRegistrationDate : moment(lastDate.getValue(), util.const.dateFormat).toDate()
        };

        return sd;
    }

    runOnceAfterDataReady(){
        let {birthday, lastDate} = this.getRefs();
        $(birthday.getInputDOMNode()).datepicker({});
        $(lastDate.getInputDOMNode()).datepicker({});
    }

    componentDidUpdate(){
        if(this.props['init-data']){
            this.setDefaultValue(this.props['init-data']);
        }
    }

    setDefaultValue(data){
console.log(data);
        let {name, gender, birthday, status, school, note, lastDate} = this.getRefs();

        school.getInputDOMNode().value = data.profile.school || '';
        name.getInputDOMNode().value = data.name || data.nickName;
        gender.getInputDOMNode().value = data.profile.gender;
        $(birthday.getInputDOMNode()).datepicker('setDate', data.profile.birthday);
        $(lastDate.getInputDOMNode()).datepicker('setDate', data.lastRegistrationDate);
        status.getInputDOMNode().value = data.status;
        note.getInputDOMNode().value = data.profile.note || '';
        this.refs.level.getInputDOMNode().value = data.level || '';
    }
};

KUI.Student_add = class extends RC.CSS{

    getAccountID(){
        return FlowRouter.current().params.accountID;
    }

    render(){
        //check permission
        if(!util.user.checkPermission('student', 'view')){
            return util.renderNoViewPermission();
        }

        return (
            <RC.Div>
                <h3>Add Student</h3>
                <hr/>
                <KUI.Student_comp_add ref="form" />
                <RC.Div style={{textAlign:'right'}}>
                    <KUI.YesButton onClick={this.save.bind(this)} label="Add"></KUI.YesButton>
                </RC.Div>
            </RC.Div>
        );
    }

    save(){
        let data = this.refs.form.getValue();

        data.accountID = this.getAccountID();

        let rs = KG.get('EF-Student').insert(data);
        KG.result.handle(rs, {
            success : function(json){
                util.toast.alert('Insert Success');
                util.goPath('/family/profile/'+data.accountID);
            },
            error : function(e, error){
                console.log(error);
                util.message.publish('KG:show-error-message', {
                    error : error.statusText
                });
            }
        });
    }
};