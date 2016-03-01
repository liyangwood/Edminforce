KUI.Registration_payment = class extends KUI.Page{

    constructor(p){
        super(p);

        this.state = {
            step : 'step1',

            schoolCredit : false
        };

        this.total = new ReactiveVar(0);
    }

    getMeteorData(){
        let id = FlowRouter.getParam('id');

        let s1 = Meteor.subscribe('EF-ClassStudent', {
            query : {
                _id : id
            }
        });

        let one = KG.get('EF-ClassStudent').getDB().findOne();

        if(!s1.ready()){
            return {
                ready : false
            };
        }


        let s2 = Meteor.subscribe('EF-Class', {
            query : {
                _id : one.classID
            }
        });
        let s3 = Meteor.subscribe('EF-Student', {
            query : {
                _id : one.studentID
            }
        });

        let student = {};
        let s4 = null;
        if(s3.ready()){
            student = KG.get('EF-Student').getDB().findOne();
            s4 = Meteor.subscribe('EF-Customer', {
                query : {
                    _id : student.accountID
                }
            });
        }


        return {
            id : id,
            data : one,
            'class' : KG.get('EF-Class').getAll()[0],
            student : student,
            ready : s2.ready() && s3.ready() && s4.ready()
        };
    }
//http://localhost:8000/registration/payment/cWckGjpfLAwpsiL6t
    baseStyles(){
        return {
            ml : {
                marginLeft : '20px'
            }
        };
    }

    getDepModule(){
        return {
            Customer : KG.get('EF-Customer')
        };
    }

    render(){
        if(!this.data.ready || !this.data.class){
            return util.renderLoading();
        }

        let m = this.getDepModule();

        let customer = m.Customer.getAll()[0],
            registrationFee = customer.hasRegistrationFee ? customer.hasRegistrationFee*m.Customer.getRegistrationFee():10;
        let student = this.data.student,
            cls = this.data.class,
            one = this.data.data;

        let C = {
            credit : customer.schoolCredit || 0,
            classFee : cls.tuition.type==='class'?cls.tuition.money*cls.leftOfClass : cls.tuition.money,
            registrationFee : registrationFee
        };

        let total = C.classFee;


        let list = [
            {
                item : cls.nickName,
                amount : '$'+C.classFee
            }
        ];

        //school credit
        if(this.state.schoolCredit){
            list.push({
                item : 'Credit',
                amount : C.credit>0?('-$'+C.credit):0
            });

            total = total - C.credit;
        }

        if(C.registrationFee > 0){
            list.push({
                item : 'Registration Fee',
                amount : '$'+C.registrationFee
            });

            total = total + C.registrationFee;
        }


        this.total.set(total);
        list.push({
            item : 'Total',
            amount : '$'+total
        });


        return (
            <RC.Div>
                <h3>Register Class</h3>
                <hr/>
                <p>Student : {student.nickName}</p>
                <p>Class : {cls.nickName}</p>
                {this.renderTable(list)}
                {this.renderStep1()}
                {this.renderStep2()}
            </RC.Div>
        );
    }

    renderTable(list){
        const titleArray = [
            {
                title : 'Item',
                key : 'item'
            },
            {
                title : 'Amount',
                key : 'amount'
            }
        ];


        return (
            <KUI.Table
                style={{}}
                list={list}
                title={titleArray}
                ref="table"></KUI.Table>
        );
    }

    renderStep1(){
        let dsp = {
            display : 'block'
        };
        if(this.state.step !== 'step1'){
            dsp.display = 'none';
        }
        let sy = this.css.get('styles');
        return (
            <RC.Div style={dsp}>
                <RB.Input onChange={this.checkSchoolCredit.bind(this)} ref="s11" type="checkbox" label="Apply school credit" />
                {/*<RB.Input onChange={function(){}} ref="s12" type="checkbox" label="New Customer Coupon" />*/}
                <RC.Div style={{textAlign:'right'}}>
                    {/*<KUI.NoButton onClick={} label="Cancel"></KUI.NoButton>*/}
                    <KUI.YesButton onClick={this.toStep2.bind(this)} style={sy.ml} label="Next"></KUI.YesButton>
                </RC.Div>
            </RC.Div>
        );
    }
    checkSchoolCredit(e){
        let b = $(e.target).prop('checked');
        this.setState({
            schoolCredit:b
        });
    }


    renderStep2(){
        let dsp = {
            display : 'block'
        };
        if(this.state.step !== 'step2'){
            dsp.display = 'none';
        }
        let sy = this.css.get('styles');
        return (
            <RC.Div style={dsp}>
                <RB.Input onChange={function(){}} ref="s21" name="cgroup" type="radio" label="Credit Card/Debit Card" />
                {/*<RB.Input onChange={function(){}} ref="s22" type="checkbox" label="Checking Account" />*/}
                {/*<RB.Input onChange={function(){}} ref="s23" type="checkbox" label="Cash" />*/}
                <RB.Input onChange={function(){}} ref="s24" name="cgroup" type="radio" label="Check" />
                {/*<RB.Input onChange={function(){}} ref="s25" type="checkbox" label="Gift Card" />*/}
                <RC.Div style={{textAlign:'right'}}>
                    {<KUI.NoButton onClick={this.toStep1.bind(this)} label="Cancel"></KUI.NoButton>}
                    <KUI.YesButton onClick={this.toPaymentPage.bind(this)} style={sy.ml} label="Next"></KUI.YesButton>
                </RC.Div>
            </RC.Div>
        );
    }

    toStep2(){
        this.setState({
            step : 'step2'
        });
    }
    toStep1(){
        this.setState({
            step : 'step1'
        });
    }

    toPaymentPage(){
        let s21 = $(this.refs.s21.getInputDOMNode()).prop('checked'),
            s24 = $(this.refs.s24.getInputDOMNode()).prop('checked');

        Session.set('_register_class_money_total_', this.total.get());

        if(s21){
            //to credit card page
            util.goPath('/payment/creditcard');
        }
        else if(s24){
            //to echeck page
            util.goPath('/payment/echeck');
        }
        else{
            util.toast.showError('Please select the mode of payment')
        }
    }


};