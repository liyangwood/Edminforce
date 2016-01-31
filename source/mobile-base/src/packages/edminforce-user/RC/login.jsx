
EdminForce.Components.User = React.createClass({
  mixins: [RC.Mixins.CSS],
  displayName: "Cal.User",

  propTypes: {
    fullHeight: React.PropTypes.bool,
    noHeader: React.PropTypes.bool,
    alignTop: React.PropTypes.bool,
    bgColor: React.PropTypes.string,
    registerCallback: React.PropTypes.func,

    // Common Props
    theme: React.PropTypes.string,
    id: React.PropTypes.string,
    className: React.PropTypes.string,
    style: React.PropTypes.object,
  },

  getInitialState() {
    return {
      buttonActive: false,
      waiting: false,
      action: _.contains(["login","register","reset"], this.props.action) ? this.props.action : "login",
      msg: null,
      notification: null
    }
  },
  /**
   * @ @ @ @
   * Handler
   * @ @ @ @
   */
  checkButtonState(e){
    switch (this.state.action){
      case "login":
        var form = this.refs.loginForm.getFormData()
        break
      case "register":
        var form = this.refs.registerForm.getFormData()
        break
      case "reset":
        var form = this.refs.resetForm.getFormData()
        break
    }
    let test = _.every( _.values(form), function(t){
      return t.length && t.length>0
    })
    if (this.state.action == 'register' && form.pwRepeat){
      if (!App.checkPassword(form.pw)) {
        this.setState({
          msg: "Password shoud have at least 8 characters, containing Capital Letters AND Numbers.",
          buttonActive: false
        })
        return
      } else if (this.state.msg) {
        this.setState({ msg: null })
      }
    }
    if (this.state.action == 'login' && form.password){
      if (this.state.msg) {
        this.setState({ msg: null })
      }
    }
    if (test !== this.state.buttonActive)
      this.setState({ buttonActive: test })
  },
  resetForm(){
    this.setState({
      waiting: false,
      msg: null,
      buttonActive: false,
    })
    if (this.state.action == "login") {
      this.refs.username.reset()
      this.refs.password.reset()
    } else if (this.state.action == "register") {
      this.refs.regEmail.reset()
      this.refs.regPw.reset()
      this.refs.regPwRepeat.reset()
    } else if (this.state.action == "reset") {
      this.refs.email.reset()
    }

  },
  switchAction(){
    this.resetForm()
    this.setState({ buttonActive: false })

    if (this.state.action == "reset") {
      this.setState({action: "login"})
      return
    }
    else {
      this.setState({ action: this.state.action=="register" ? "login" : "register" })
    }
  },
  startReset(){
    this.resetForm()
    this.setState({
      emailFound: true
    })
    this.setState({action: "reset"})
    return
  },

  login(e){
    e.preventDefault()
    if (this.state.msg) return null

    let form = this.refs.loginForm.getFormData()

    if (form.username.length && form.password.length) {
      // Attempt Log In
      let self = this
      this.setState({ waiting: true })
      Meteor.loginWithPassword( form.username, form.password, function(err){

        if (!err){
          if (form.keepName == 'on') {
            Cookie.set('username', form.username)
          } else  {
            Cookie.clear('username')
          }
          self.resetForm()
        }

        let passedMsg = err && err.error
          ? (ph.errorMsgs[err.error] || err.reason)
          : <p>You are now logged in!</p>

        if (_.isFunction(self.props.loginCallback))
          self.props.loginCallback()

        // message hook;for calphin listener
        if(!err){
          Dispatcher.dispatch({
            actionType: "AUTH_LOGIN_SUCCESS"
          });
          return;
        }

        self.setState({
          msg: passedMsg,
          buttonActive: false,
          waiting: false,
        })
      })
    }
  },

  register(e){
    e.preventDefault()
    if (this.state.msg) return null

    let self = this
    let form = this.refs.registerForm.getFormData()

    if (form.term != 'on') {
      this.setState({
        notification: "Please accept the following terms of use."
      })
      return null
    }

    if (form.pw==form.pwRepeat) {
      if (!App.checkPassword(form.pw)) {
        this.setState({
          msg: "Password shoud have at least 8 characters, containing Capital Letters AND Numbers."
        })
        return
      }
      // Create User
      Accounts.createUser({
        email: form.email,
        password: form.pw
      }, function(err) {
        if (!err){
          Meteor.call('SetOptIn', Meteor.userId(), form.OptIn == "on" ? true : false, function(error, res){
            console.log(error)
            err = error;
          })
          self.resetForm()
        }

        let passedMsg = err && err.error
          ? (ph.errorMsgs[err.error] || err.reason)
          : <p>Thank you for registering!</p>

        if (_.isFunction(self.props.registerCallback))
          self.props.registerCallback()

        if(!err){
          Dispatcher.dispatch({
            actionType: "AUTH_REGISTER_SUCCESS"
          });
          return;
        }
        self.setState({
          msg: passedMsg,
          buttonActive: false,
          waiting: false,
        })
      })
    } else
      this.setState({
        msg: ph.errorMsgs[1001],
        buttonActive: false,
        waiting: false,
      })
  },

  reset(e){
    e.preventDefault()
    if (this.state.msg) return null

    let form = this.refs.resetForm.getFormData()

    if (form.email.length) {
      // Attempt Log In
      let self = this
      this.setState({ waiting: true })
      Meteor.call('CheckEmail', form.email, function(err, result){

        if (!!err) {
          console.log(err)
          result = false
        }

        if (result){
          Accounts.forgotPassword({ email: form.email },function(err){
            console.log(err)
            let passedMsg = err && err.error
              ? (ph.errorMsgs[err.error] || err.reason)
              : <p>Password Reset Email Has Been Sent!</p>
            self.setState({ msg: passedMsg })
          })
        } else {
          // the email address is not found
          this.setState({
            emailFound: false,
            waiting: false,
            buttonActive:false,
            msg: "Entered E-mail is not in record.",
          })
        }
      })
    }
  },

  removeMsg(e){
    e.preventDefault()
    this.setState({
      waiting: false,
      msg: null,
    })
  },

  jumpToNextPage(e){
    e.preventDefault()
    this.setState({
      waiting: false,
      notification: null,
      msg:null
    })
  },

  printMsg(){
    console.log("printMsg is called", this.state.msg)

    let currentMessages = this.state.msg ? [this.state.msg] : []
    return <div>
      {
        currentMessages.map(function(m,n){
          return <div className="center" key={n}>
            <div className="bigger inline-block invis-70 red">
              {_.isString(m) ? <div>{m}</div> : m}
            </div>
          </div>
        })
      }
    </div>

  },

  /**
   * @ @ @ @
   * Render
   * @ @ @ @
   */
  renderMsg(){
    let self = this
    let bg = h.checkColorClass(this.props.bgColor) ? this.props.bgColor : null
    let msgs = this.state.notification ? [this.state.notification] : [] // This will always be either 1 or 0

    return <RC.Animate transitionName="scale">
      {
        msgs.map( function(m,n){
          return <div className={"abs-full table on-top"+(bg ? " bg-"+bg : "")} key={n}>
            <div className="inside center">
              {_.isString(m) ? <p>{m}</p> : m}
              <RC.Button onClick={self.jumpToNextPage} theme="circle" buttonColor={bg}>OK</RC.Button>
            </div>
          </div>
        })
      }
    </RC.Animate>
  },

  renderForm(){
    var inputTheme = "small-label"
    var buttonTheme = "full"
    if (_.contains(["overlay-light","overlay-dark"], this.props.theme)) {
      inputTheme += ","+this.props.theme
      buttonTheme += ","+this.props.theme
    }

    switch (this.state.action) {

      case "login":
        //<div>Log In To Your Calphin Account</div>
        return <RC.Form onSubmit={this.login} onKeyUp={this.checkButtonState} ref="loginForm">

          {this.printMsg()}
          <RC.Input name="username" label="E-Mail" theme={inputTheme} ref="username" value={Cookie.get('username')||''}/>
          <RC.Input name="password" label="Password" type="password" theme={inputTheme} ref="password" />
          <RC.Checkbox  style={{borderBottom:'none'}} name="keepName" ref="keepName" value={1} label="Remember My User Name"/>

          <RC.Button name="button" theme={buttonTheme} active={this.state.buttonActive} disabled={this.state.waiting}>
            {this.state.waiting ? <RC.uiIcon uiClass="circle-o-notch spin-slow" /> : "Log In"}
          </RC.Button>
        </RC.Form>
        break

      case "register":
        //<div>Create an Account</div>
        return <RC.Form onSubmit={this.register} onKeyUp={this.checkButtonState} ref="registerForm">
          {this.printMsg()}
          <RC.Input name="email" label="E-Mail" theme={inputTheme} ref="regEmail" value="" />
          <RC.Input name="pw" label="Password" type="password" theme={inputTheme} ref="regPw" />
          <RC.Input name="pwRepeat" label="Repeat Password" type="password" theme={inputTheme} ref="regPwRepeat" />
          <RC.Checkbox className="cal-checkbox" name="term" ref="term" value={1}
                       label="Yes，I accpet Privacy Policy and Terms of Use."/>

          <RC.Button name="button" theme={buttonTheme} active={this.state.buttonActive} disabled={this.state.waiting}>
            {this.state.waiting ? <RC.uiIcon uiClass="circle-o-notch spin-slow" /> : "Sign Up"}
          </RC.Button>

        </RC.Form>
        break
      case "reset":
        //<div>Reset Password via Email</div>
        return (
          <RC.Form onSubmit={this.reset} onKeyUp={this.checkButtonState} ref="resetForm">
            {this.printMsg()}
            <RC.Input name="email" label="E-Mail Address" theme={inputTheme} ref="email" />
            <RC.Button name="button" theme={buttonTheme} active={this.state.buttonActive} disabled={this.state.waiting}>
              {this.state.waiting ? <RC.uiIcon uiClass="circle-o-notch spin-slow" /> : "Send Password Reset E-mail"}
            </RC.Button>
          </RC.Form>
        )
        break
    }
  },
  render(){

    let styles = this.css.styles
    let linkColor = this.color.isDark ? "rgba(255,255,255,.7)" : "rgba(15,15,15,.7)"
    let linkColorHover = this.color.isDark ? "#fff" : RC.Theme.color.text

    return <div>
      <RC.Animate transitionName="zoom" transitionEnterTimeout={250} transitionLeaveTimeout={250}>
        {
        //!!this.state.msg
        //  ? <div style={styles.msg}>
        //    <div style={styles.msgInner}>
        //      {typeof this.state.msg==="string" ? <p>{this.state.msg}</p> : this.state.msg}
        //      <RC.Button onClick={this.removeMsg} theme="circle" bgColor={this.color.textColor} color={this.color.bgColor} style={{marginTop: 10}}>OK</RC.Button>
        //    </div>
        //  </div>
        //  : null
        }
      </RC.Animate>
      <RC.Div {... this.props} bgColor={this.props.bgColor || "white"} theme="absFull">
        <div style={styles.vo}>
          <div style={styles.vi}>
            <div style={styles.form}>

              <div style={styles.content}>
                {this.props.children}
              </div>

              {this.renderForm()}
              {this.props.disableSwitch ? null :this.renderAction()}
            </div>
          </div>
        </div>
      </RC.Div>
    </div>
  },

  renderAction(){

    let styles = this.css.styles
    let linkColor = this.color.isDark ? "rgba(255,255,255,.7)" : "rgba(15,15,15,.7)"
    let linkColorHover = this.color.isDark ? "#fff" : RC.Theme.color.text

    switch(this.state.action){
      case 'login':
        return <div>
          <RC.URL style={styles.url} color={linkColor} colorHover={linkColorHover} onClick={this.startReset}>
            Forgot Password
          </RC.URL>
          <RC.URL style={styles.urlRight} color={linkColor} colorHover={linkColorHover} onClick={this.switchAction}>
            Sign Up
          </RC.URL>
        </div>
        break
      case 'register':
        return <div style={{textAlign: "center"}}>
          <RC.URL style={styles.url} color={linkColor} colorHover={linkColorHover} onClick={this.switchAction}>
            Log-in with an existing account
          </RC.URL>
        </div>
        break

      case 'reset':
        return <p style={{textAlign: "center"}}>
          <RC.URL style={styles.url} color={linkColor} colorHover={linkColorHover} onClick={this.switchAction}>
            Log-in with an existing account
          </RC.URL>
        </p>
        break
    }
  },
    // @@@@
  // @@@@
  // Styles
  // @@@@
  // @@@@
  watchProps: ["noHeader"],
  baseStyles(np,ns) {
    let navSize = 0
    if (_.isFunction(RC.Theme.size.headerNavHeight))
      navSize = RC.Theme.size.headerNavHeight()
    else if (RC.Theme.size.topNavHeight)
      navSize = RC.Theme.size.topNavHeight

    return {
      vo: RC.cssMixins.verticalAlignOuter,
      vi: RC.cssMixins.verticalAlignInner,
      msg: Object.assign({}, RC.cssMixins.absFull, RC.cssMixins.verticalAlignOuter, {
        minHeight: "100vh",
        zIndex: 1000,
        backgroundColor: this.color.hex, color: this.color.textColor
      }),
      msgInner: Object.assign({},RC.cssMixins.verticalAlignInner, {textAlign: "center"}),
      form: {
        maxWidth: 300, margin: "0 auto", padding: 10,
      },
      content: {
        maxWidth: 230, padding: "0 0 50px", margin: "0 auto"
      },
      url: {
        fontSize: RC.Theme.font.size-2,
        display: "inline-block", padding: 5,
      },
      urlRight:{
        fontSize: RC.Theme.font.size-2,
        //display: "inline-block",
        padding: 5,
        float:"right"
      },
      input: {
        padding: "5px 0",
      }
    }
  },
})