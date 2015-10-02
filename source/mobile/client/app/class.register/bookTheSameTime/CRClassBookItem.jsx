/**
 * Created on 10/1/15.
 */

Cal.CRClassBookItem = React.createClass({
    propTypes: {
        classId: React.PropTypes.string //.isRequired
    },
    mixins: [ReactMeteorData],
    getMeteorData() {

        var classId = this.props.classId

        //todo same class判断逻辑 根据开始时间
        var similarClass = DB.Classes.findOne({
            _id: classId
        })

        return {
            similarClass: similarClass
        }
    },
    //actions
    book(){

        alert('onBook')

        Dispatcher.dispatch({
            actionType: "BookTheSameTime_CLASS_SELECT_FOR_CURRENT",
            selectedClass: this.data.similarClass,
            currentStep:1
        });
    },

    render() {

        return <RC.Item uiColor="brand1">
            {
                this.data.similarClass ?

                    <div className="row">
                        <div className="col">
                            {this.data.similarClass && this.data.similarClass.level}

                            <br/>
                            {this.data.similarClass && this.data.similarClass.day}

                            <br/>
                            {this.data.similarClass && this.data.similarClass.startTime}

                        </div>

                        <div className="col">
                            <span onClick={this.book} className="button button-clear button-small">
                            BOOK
                            </span>
                        </div>
                    </div>
                    : ''
            }


        </RC.Item>

    }
})