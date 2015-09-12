{

    //定义store依赖 发生于初始化过程
    let CalMainStore;
    Dependency.autorun(function () {
        CalMainStore = Dependency.get('Cal.Main.Store');
    });


    let leftNavList = [
        {text: "Calphin", type: "title"},
        {
            href: "/", text: "Home"
        }, {
            href: "/",
            text: "Your Account"
        }, {
            href: "/classEditSwimmerList",
            text: "Your Swimmers"
        }, {
            href: "/",
            text: "Your BIlling & Payment"
        }, {
            href: "/",
            text: "Contact Us"
        }, {
            href: "/",
            text: "Sign Out"
        }]


    Cal.Main = React.createClass({

        mixins: [ReactMeteorData],
        getMeteorData() {

            return {
                leftNavIsOpen: CalMainStore.leftNavStatus.get()
            }
        },


        render() {
            return <div className={h.getPlatform()} id="app-root">
                <RC.LeftNav2 navList={leftNavList} ref="LeftNav" openOnInit={this.data.leftNavIsOpen}/>

                <RC.HeaderNav nav={this.props.headerNav} leftNavToggle={this.props.leftNavToggle}   title={this.props.title} theme="flat"/>
                <RC.GlobalNav isVisible={this.props.showGlobalNav} list={this.props.globalNav}
                              location={this.props.globalNavLocation} theme="flat"/>
                <Cal.Body tmpl={this.props.body}/>
            </div>
        }
    })


}

