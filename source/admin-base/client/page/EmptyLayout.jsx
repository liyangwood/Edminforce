/*KUI.EmptyLayout = class extends RC.CSS{
    render(){
        return <div></div>
    }
};*/

KUI.EmptyLayout = class extends RC.CSS{

    constructor(p){
        super(p);

        this.state = {
            errorMessage : false,
            alertMessage : false,

            showLeftNav : false
        };

        this._tm = null;
        this._tm1 = null;


        let self = this;
        util.message.register('KG:show-error-message', function(param){

            self.setState({
                errorMessage : param.error
            });
        });

        util.message.register('KG:show-toast-message', function(param){
            try{
                self.hideErrorMsg();
            }catch(e){}
            self.setState({
                alertMessage : param.toast
            });
        });
    }

    baseStyles(){
        return {
            left : {

            },
            right : {

            },
            con : {
                position : 'relative'
            }
        };
    }

    hideErrorMsg(){
        this.setState({
            errorMessage : false
        });
    }

    hideToastMsg(){
        this.setState({
            alertMessage : false
        });
    }

    renderErrorMsg(){
        if(this._tm1){
            window.clearTimeout(this._tm1);
            this._tm1 = null;
        }
        //let error = Session.get('KG:show-error-message');
        let error = this.state.errorMessage;
        if(!error){
            return '';
        }

        const trans = {
            transitionName: "zoom",
            transitionAppear: true,
            transitionAppearTimeout: 300,
            transitionEnterTimeout: 300,
            transitionLeaveTimeout: 300
        };

        this._tm1 = window.setTimeout(this.hideErrorMsg.bind(this), 3000);

        return (
            <RC.Animate {... trans}>
                <div className="kg-toast-msg alert alert-danger alert-dismissable">
                    <button aria-hidden="true" data-dismiss="alert" onClick={this.hideErrorMsg.bind(this)} className="close" type="button">×</button>
                    {error}
                </div>
            </RC.Animate>

        );
    }

    renderToastMsg(){
        if(this._tm){
            window.clearTimeout(this._tm);
            this._tm = null;
        }

        let msg = this.state.alertMessage;
        if(!msg){
            return '';
        }

        const trans = {
            transitionName: "zoom",
            transitionAppear: true,
            transitionAppearTimeout: 300,
            transitionEnterTimeout: 300,
            transitionLeaveTimeout: 300
        };

        this._tm = window.setTimeout(this.hideToastMsg.bind(this), 2000);

        return (
            <RC.Animate {... trans}>
                <div className="kg-toast-msg alert alert-success alert-dismissable">
                    <button aria-hidden="true" data-dismiss="alert" onClick={this.hideToastMsg.bind(this)} className="close" type="button">×</button>
                    {msg}
                </div>
            </RC.Animate>

        );
    }

    toggleLeftNav(){
        this.setState({
            showLeftNav: false
        })
    }


    render(){
        let style = this.css.get('styles');

        let pageWraperStyle ={
            paddingRight:0,
            marginLeft:this.state.showLeftNav?220:0
        }
        //<KUI.Header toggleLeftNav={this.toggleLeftNav.bind(this)}/>

        /*
            <div className="container" style={style.con}>
                {this.renderErrorMsg()}
                {this.renderToastMsg()}

                <KUI.LeftNav showLeftNav = false />
                <div id="page-wrapper" style={pageWraperStyle}>

                    <div style={
                        {
                            paddingTop : 0

                        }
                    } className="wrapper wrapper-content animated fadeInRight">
                        <div className="ibox">
                            <div className="ibox-content">
                                <KUI.Body tmpl={this.props.body} />
                            </div>
                        </div>

                    </div>

                    <div className="footer"></div>
                </div>
            </div>
            */

        return <div id="ui-layout">

            <KUI.Body tmpl={this.props.body} />
        </div>
    }
};