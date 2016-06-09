"use strict"

let LISTENER1
let LISTENER2
let MAX_PRESSURE = 300

// ##
// ##
// BP - Measure & Display
// ##
// ##

IH.Device.BPDisplay = class extends RC.CSS {
  constructor(p) {
    super(p)
    this.state = {
      obj: Immutable.Map({
        process: null,
        output: null,
        errorMsg: null,
        isHelp: false,
        isResult: false,
        battery: null
      })
    }

    this._pressure = 0
    this._perCent = 0
    this._result = null
  }
  // @@
  // @@
  // Prep
  // @@
  // @@
  componentWillMount() {
    super.componentWillMount()
    LISTENER1 = this._onCall.bind(this)
    LISTENER2 = this._onError.bind(this)

    IH.Store.BP.dispatch({ action: "startPingInterval" })
    IH.Store.BP.addListener("call", LISTENER1)
    IH.Store.BP.addListener("call-error", LISTENER2)
  }
  componentWillUnmount() {
    super.componentWillUnmount()
    IH.Store.BP.dispatch({ action: "stopPingInterval" })
    IH.Store.BP.removeListener("call", LISTENER1)
    IH.Store.BP.removeListener("call-error", LISTENER2)
  }
  componentWillUpdate(np,ns) {
    const stage = this._measureStatus(ns)
    const output = ns.obj.get("output")

    /*
    REAL ERROR MSG
    [Log] {producttype: "BP", errorid: 13, msg: "Error", productmodel: "BP5", address: "8CDE5212386D"} (ihealth_devices-commons-plugin.js, line 168)
    */
    if (stage==2) {
      output.MDate = new Date()
      output.userId = Meteor.userId()
    }

    if (stage==1) {
      const pressure = (ns.obj.get("output") || {}).pressure
      const perCent = Math.round(pressure/MAX_PRESSURE*100)

      if (pressure!=null && !isNaN(pressure)) this._pressure = pressure
      if (perCent!=null && !isNaN(perCent)) this._perCent = perCent
    } else if (stage==2 && (!this._result || !_.isEqual(this._rawResult, output))) {
      this._result = output

      if (_.isFunction(np.finishCallback)) {
        const newDoc = np.finishCallback(output)
        if (newDoc)
          this._result = newDoc
      }
    }
  }
  // ## Listeners
  _onCall(state) {
    if (this._isMounted) {
      switch (state.process) {
        case "startMeasure":
          if (state.output) {
            if (state.output.msg=="MeasureDone")
              state.isResult = true
            this.setStateObj(state)
          }
        break
        case "stopMeasure":
          this._pressure = 0
          this._perCent = 0
          this.setStateObj(state)
        break
        case "getBattery":
          if (h.nk(state, "output.battery"))
            this.setStateObj({battery: state.output.battery})
        break
      }
    }
  }
  _onError(state) {
    if (this._isMounted) {
      switch (state.process) {
        case "startMeasure":
          let errorMsg
          // ##
          // Error Switches Start
          switch (state.output.errorid) {
            case 0:
              errorMsg = "Keep your arm stable, stay still and try again."
            break
            case 1:
              errorMsg = "Fasten the cuff over bare arm, stay still and try again."
            break
            case 2:
              errorMsg = "Fasten the cuff over bare arm, stay still and try again."
            break
            case 3:
              errorMsg = "Loosen the cuff and try again."
            break
            case 4:
              errorMsg = "Fasten the cuff over bare arm, stay still and try again."
            break
            case 5:
              errorMsg = "Rest for 5 minutes and try again. Keep your arm stable and try again."
            break
            case 6:
              errorMsg = "Fasten the cuff over bare arm, stay still and try again."
            break
            case 7:
              errorMsg = "Fasten the cuff over bare arm, stay still and try again."
            break
            case 8:
              errorMsg = "Fasten the cuff over bare arm, stay still and try again."
            break
            case 10:
              errorMsg = "Fasten the cuff over bare arm, stay still and try again."
            break
            case 12:
              errorMsg = "Bluetooth connection error. Please reconnect Bluetooth."
            break
            case 13:
              errorMsg = "Please charge your blood pressure monitor and try again."
            break
            case 15:
              errorMsg = "Reading is out of range. Rest for 5 minutes and try again with bare arm."
            break
            case 16:
              errorMsg = "Systolic below 60mmHg or diastolic below 40mmHg."
            break
            case 17:
              errorMsg = "Keep your arm stable and stay still during measurement."
            break
            case 31:
              errorMsg = "BPOverTimeError."
            break
            case 400:
              errorMsg = "No device found."
            break
            case 500:
              errorMsg = "The instruction is still in execution."
            break
            case 600:
              errorMsg = "The input parameter errors"
            break
            case 700:
              errorMsg = "You are not authorized."
            break
            default:
              errorMsg = "An unknown error occured."
          }
          // Error Switches End
          // ##

          this.setStateObj({
            errorMsg: errorMsg
          })
        break
      }
    }
  }
  // ## Secondary Actions
  _secondaryAction() {
    if (this._measureStatus()===1)
      IH.Store.BP.dispatch({ action: "stopMeasure" })
    else
      this.setStateObj({
        isHelp: true
      })
  }
  _closeSecondary() {
    let resetState = {
      isHelp: false,
      isResult: false,
      errorMsg: null
    }
    if (this.state.obj.get("errorMsg"))
      Object.assign( resetState, {
        output: null,
        process: null
      })
    this.setStateObj( resetState )
  }
  // ## Start Measurement
  _measureStatus(ns) {
    if (!ns) ns = this.state
    const state = ns.obj
    const output = state.get("output")

    if (state.get("process")!="startMeasure" || !output)
      return 0

    // Another way to check if measurement is done is by seeing if msg is equal to "MeasureDone"
    // But this is inconsistent because China team keeps changing it.
    return output.msg=="MeasureDone" && output.lowpressure && output.highpressure
      ? 2 : 1
  }
  _startMeasure() {
    if (this._measureStatus()!=1) {
      this._pressure = 0
      this._perCent = 0
      IH.Store.BP.dispatch({ action: "startMeasure" })
    }
  }
  _showLast(e) {
    if (this._measureStatus()!=1) {
      e.stopPropagation()
      this.setStateObj({
        isResult: true
      })
    }
  }
  // @@
  // @@
  // Render
  // @@
  // @@
  render() {
    const state = this.state.obj
    const styles = this.css.get("styles")
    const output = state.get("output")
    const stage = this._measureStatus()

    // ## Battery
    let batteryRange
    const battery = state.get("battery")
    if (battery!=null && !isNaN(battery))
      batteryRange = (Math.round(battery/100 * 4) / 4).toFixed(2) * 4

    // ## Help Window
    const helpPanes = [{
      img: "/packages/ihealth_bp-ui/assets/help1.jpg",
      text: <span>Place the cuff at the same<br />level as your heart.</span>
    },{
      img: "/packages/ihealth_bp-ui/assets/help2.jpg",
      text: <span>Leave one finger space<br />between the cuff and your arm.</span>
    },{
      img: "/packages/ihealth_bp-ui/assets/help3.jpg",
      text: <span>Position the cuff 1/2&rdquo; (2cm)<br />above your elbow joint.</span>
    },{
      img: "/packages/ihealth_bp-ui/assets/help4.jpg",
      text: <span style={{fontSize: ".9em"}}>Position the monitor in the middle of your<br /> arm aligned with your middle finger.</span>
    },{
      img: "/packages/ihealth_bp-ui/assets/help5.png",
      text: <span>That's it! Click here to close.</span>//' Editor Comma Stopper
    }]

    // ## Circle Title
    const title = stage && stage!=2 ? this._pressure : "Start"

    return <div style={styles.area}>
      <RC.Animate transitionName="zoom" transitionEnterTimeout={250} transitionLeaveTimeout={250}>
        {
        state.get("isHelp")
        ? <DevicePrivate.Help panes={helpPanes} closeFunc={this._closeSecondary.bind(this)} deviceType="BP" />
        : null
        }
        {
        state.get("isResult") && this._result
        ? <IH.Device.BPResult result={this._result} closeFunc={this._closeSecondary.bind(this)} />
        : null
        }
        {
        state.get("errorMsg")
        ? <DevicePrivate.Error errorMsg={state.get("errorMsg")} closeFunc={this._closeSecondary.bind(this)} />
        : null
        }
      </RC.Animate>

      <RC.Animate transitionName="zoom" transitionAppear={true} transitionAppearTimeout={250} transitionEnterTimeout={250} transitionLeaveTimeout={250}>
        <DevicePrivate.Circle perCent={stage==1 ? this._perCent : 0} deviceType="BP" onClick={this._startMeasure.bind(this)} />
        <div style={h.assignPseudos(styles.areaInner, !!this._result && stage!=1)} onClick={this._startMeasure.bind(this)}>
          <div style={h.assignPseudos(styles.title, stage==1)}>{title}</div>
          <div style={h.assignPseudos(styles.showLast, stage!=1 && !!this._result)} onClick={this._showLast.bind(this)}>Last Measurement</div>
        </div>

        <DevicePrivate.HelpButton deviceType="BP" isFocused={stage==1} onClick={this._secondaryAction.bind(this)}>{stage==1 ? "Stop" : "Help"}</DevicePrivate.HelpButton>
        {
        batteryRange
        ?
        <div style={styles.batteryArea}>
          <RC.uiIcon uiClass={`battery-${batteryRange}`} uiColor="#FFF" uiSize={RC.Theme.font.size-2} theme="inlineBlockLeft" />{`${battery}%`}
        </div>
        :
        null
        }
      </RC.Animate>
    </div>
  }
  // @@
  // @@
  // Styles
  // @@
  // @@
  baseStyles() {
    const fontSize = RC.Theme.font.size
    const fadedOpacity = .55
    const tn = "all ease .35s"

    return {
      area: {
        width: "100%", textAlign: "center"
      },

      // Circle & Title
      areaInner: {
        position: "relative", zIndex: 5,
        width: "100%", margin: "-23px 0 0",
        transition: tn,
        ":on": {
          margin: "-52px 0 0"
        }
      },
      title: Object.assign(RC.cssMixins.font("light"), {
        textTransform: "uppercase", letterSpacing: 5, textIndent: 3,
        fontSize: fontSize*2.5, color: "#FFF",
        ":on": {
          fontSize: fontSize*3.8
        }
      }),
      showLast: {
        display: "inline-block", borderRadius: (fontSize-2+13)/2,
        height: fontSize-2+13, padding: "6px 15px", margin: "5px 0 0",
        fontSize: fontSize-2, lineHeight: `${fontSize-2}px`,
        backgroundColor: IH.Device.Color.BPrgba(.75),
        transition: tn,
        opacity: 0,
        ":on": {
          opacity: 1
        }
      },

      // Battery
      batteryArea: {
        position: "absolute", bottom: 0, left: "50%",
        width: 80, height: 25, margin: "0 0 0 -40px",
        fontSize: fontSize-2,
        opacity: fadedOpacity,
      },
    }
  }
}
IH.Device.BPDisplay.displayName = "IH.Device.BPDisplay"
