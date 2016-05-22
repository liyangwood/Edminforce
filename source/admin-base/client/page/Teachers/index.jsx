KUI.Teachers_index = class extends RC.CSSMeteorData {

    constructor(p) {
        super(p);

        this.state = {
            selectedTeacherIdx:0,
            selectedClassIdx: 0,
            selectedDate: moment().format('MM/DD/YYYY')
        };

        this.onSelectClass = this.onSelectClass.bind(this);
        this.onSelectTeacher = this.onSelectTeacher.bind(this);
        this.onClassDateChange = this.onClassDateChange.bind(this);
    }

    setupDatePicker(){
        let classDateDomNode = this.refs.classDate ? this.refs.classDate.getInputDOMNode() : null;
        if (classDateDomNode) {
            $(classDateDomNode).datepicker({});
            $(classDateDomNode).bind('hide', this.onClassDateChange);
        }
    }

    componentDidMount() {
        super.componentDidMount && super.componentDidMount();
        this.setupDatePicker();
    }
    // componentDidUpdate(prevProps, prevState) {
    //     super.componentDidUpdate && super.componentDidUpdate(prevProps, prevState);
    //     this.setupDatePicker();
    // }

    getMeteorData(){
        let teacherSub = Meteor.subscribe('EF-AdminUser', {
            query : {
                role : 'teacher'
            }
        });

        let classSub = Meteor.subscribe('EF-CurrentClasses');
        let programSub = Meteor.subscribe('EF-Program');

        let ready = teacherSub.ready() && classSub.ready() && programSub.ready();

        let teachers = [];
        let classStudents = [];
        let classes = [];
        let sessions = [];
        if (ready) {
            sessions = KG.get('EF-Session').getDB().find({}).fetch();
            teachers = KG.get('EF-AdminUser').getDB().find({}).fetch();
            // classes
            classes = KG.get('EF-Class').getDB().find({}).fetch();
            let programs = KG.get('EF-Program').getDB().find({}).fetch();
            classes.forEach( (c) => {
                let p = _.find(programs, {_id: c.programID});
                p && (c.name = p.name + " " + c.schedule.day + " " + c.schedule.time);
            })

            // filter class by teacher and date
            let selectedWeekday = this.state.selectedDate ? moment(this.state.selectedDate).format('ddd') : null;
            let selectedTeacher = teachers.length > this.state.selectedTeacherIdx ? teachers[this.state.selectedTeacherIdx] : {};
            classes = _.filter(classes, (c) => (c.schedule.day == selectedWeekday && c.teacher == selectedTeacher.nickName));
        }

        if (classes.length > this.state.selectedClassIdx) {
            let selectedClassId = classes[this.state.selectedClassIdx]._id
            let studentSub = Meteor.subscribe('EF-StudentsByClassID', selectedClassId);
            ready = ready && studentSub.ready();

            if (ready) {
                // students in the selected class
                classStudents = KG.get('EF-ClassStudent').getDB().find({
                    classID: selectedClassId,
                    status: 'checkouted'
                }).fetch();
                let students = KG.get('EF-Student').getDB().find({}).fetch();
                classStudents.forEach((s) => {
                    let student = _.find(students, {_id: s.studentID});
                    student && (s.name = student.name, s.birthday = student.profile.birthday);
                })
            }
        }

        return{
            ready,
            sessions,
            teachers,
            classes,
            classStudents
        };
    }

    // renderListTable(style) {
    //     if (!this.data.ready) {
    //         return util.renderLoading();
    //     }
    //
    //     const titleArray = [
    //         {
    //             title: 'Customer Name',
    //             key: 'name'
    //         },
    //         {
    //             title: 'Email',
    //             key: 'email'
    //         },
    //         {
    //             title: 'Phone',
    //             key: 'phone'
    //         },
    //         {
    //             title: 'Status',
    //             key: 'status'
    //         },
    //         {
    //             title: 'Action',
    //             style: {
    //                 textAlign: 'center'
    //             },
    //             reactDom: function (item) {
    //                 const sy = {
    //                     cursor: 'pointer',
    //                     position: 'relative',
    //                     top: '2px'
    //                 };
    //                 const ml = {
    //                     //marginLeft : '10px',
    //                     cursor: 'pointer'
    //                 };
    //
    //                 var del = function () {
    //
    //                 };
    //
    //                 return (
    //                     <RC.Div style={{textAlign:'center'}}>
    //                         <RC.URL href={`/family/profile/${item._id}`}><KUI.Icon icon="edit" font="18px"
    //                                                                                color="#1ab394"
    //                                                                                style={sy}></KUI.Icon></RC.URL>
    //                         {/*<KUI.Icon onClick={del} icon="trash-o" font="18px" color="#cdcdcd" style={ml}></KUI.Icon>*/}
    //                     </RC.Div>
    //
    //                 );
    //             }
    //         }
    //
    //     ];
    //
    //     let list = this.data.list,
    //         total = Math.ceil(this.data.max / util.const.PageSize);
    //
    //     return <KUI.PageTable
    //         style={style.table}
    //         list={list}
    //         total={total}
    //         onSelectPage={this.selectPage.bind(this)}
    //         page={this.state.page}
    //         title={titleArray}
    //         ref="table"></KUI.PageTable>;
    // }
    //
    // selectPage(page) {
    //
    //     this.setState({
    //         page: page
    //     });
    // }
    //
    // baseStyles() {
    //
    //     return {
    //         table: {}
    //     };
    // }

    onSelectTeacher(event) {
        this.setState({
            selectedTeacherIdx:event.target.selectedIndex,
            selectedClassIdx: 0
        });
    }

    onSelectClass(e) {
        this.setState({
            selectedClassIdx: e.target.selectedIndex
        })
    }

    onClassDateChange(e) {
        let  newDate = this.refs.classDate.getValue();
        if (newDate != this.state.selectedDate) {
            this.setState({
                selectedDate: newDate,
                selectedClassIdx: 0
            });
        }
    }

    save() {

    }
    cancel() {

    }

    render() {
        if (!this.data.ready)
            return (
                <RC.Loading isReady={false} />
            )

        let style = this.css.get('styles');

        let p = {
            teacher : {
                labelClassName : 'col-xs-4',
                wrapperClassName : 'col-xs-8',
                ref : 'teacher',
                label : 'Teacher'
            },

            classDate: {
                labelClassName : 'col-xs-4',
                wrapperClassName : 'col-xs-8',
                ref : 'classDate',
                label : 'Date'
            },

            class : {
                labelClassName : 'col-xs-4',
                wrapperClassName : 'col-xs-8',
                ref : 'class',
                label : 'Class'
            }
        };

        let selectedTeacher = this.data.teachers.length > this.state.selectedTeacherIdx ? this.data.teachers[this.state.selectedTeacherIdx] : {};

        return (
            <RC.Div>
                <h3 style={{"textAlign": "left"}}>Class Attendance</h3>
                <RB.Row >
                    <div className="form-horizontal">
                        <RB.Col md={6} mdOffset={0}>
                            <RB.Input type="select" {... p.teacher} onChange={this.onSelectTeacher}>
                                {
                                    this.data.teachers.map( (t) => (<option key={'t'+t._id} value={t._id}>{t.nickName}</option>))
                                }
                            </RB.Input>
                            <RB.Input type="select" {... p.class} onChange={this.onSelectClass}>
                                {
                                    this.data.classes.map( (c) => (<option key={'c'+c._id} value={c._id}>{c.name}</option>))
                                }
                            </RB.Input>
                        </RB.Col>
                        <RB.Col md={6} mdOffset={0}>
                            <RB.Input type="text" {... p.classDate} defaultValue={this.state.selectedDate}>
                            </RB.Input>
                        </RB.Col>
                    </div>
                </RB.Row>

                <RC.Div style={{textAlign:'right'}}>
                    <KUI.YesButton style={{marginRight: 20}} onClick={this.save.bind(this)} label="Save"></KUI.YesButton>
                    <KUI.NoButton onClick={this.cancel.bind(this)} label="Cancel"></KUI.NoButton>
                </RC.Div>
            </RC.Div>
        );
    }
}