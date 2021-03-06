// possible states: disconnected, connecting, connected, measuring, measurement error

var debugLevel = 2
var debugL = _.partial(DevTools.consoleWithLevels, debugLevel);

var processSignal = function(signal) {
  debugL(3)("processSignal call: " + signal)
  try {
   var json_signal = JSON.parse(signal);
   return json_signal;
  } catch(err) {
   console.warn('processSignal' + err);
  }
}

var cbLog = function(functionName) {
  return function(signal) {
    console.log(functionName, ' - ', signal)
  }
};

/**
* Get & Save device informations from/to Session
*/
var getDevices = function(type){
  debugL(3)("getDevices call: " + type)
  var devices = Session.get("devices") || { bluetooth: false }
  return type ? devices[type] : devices
}
var saveDevices = function(session, connected){
  debugL(3)("saveDevices call: " + session + ", " + connected)
  var devices = Session.get("devices") || { bluetooth: false }
  var cur = Session.get("devices") || { bluetooth: false }
  var compare = _.clone(cur)

  if (!_.isObject(session)) session = {}
  if (connected) session.bluetooth = true
  _.extend(cur,session)

  if (!_.isEqual(compare,cur)) {
    console.log(cur)
    Session.set("devices", cur) // Cur is Extended
  }
}
//
// var saveApp = function(newinfo) {
//   var sessionLabel = "app"
//   var appSession = Session.get(sessionLabel) || {}
//   var deepExtend = true
//   jQuery.extend(deepExtend, appSession , newinfo)
//   Session.set(sessionLabel,  appSession)
// }

/**
 * Javascript Class for Blood Pressure
 * BP5 Device
 *
 * DESCRIPTION
 * This class uses the iHealth BP API.
 *
 *  SESSIONS
 * BP {Number, Boolean}
 * devices {Object}
 */
iHealthBP5 = function(args){
  var defaults = {
		hasStarted: false,
		isTestMode: false,
    connectionAttemptDuration: 13000,
    connectAndReadyDelay: 1800,
    finishedMeasurementDelay: 1200,

    maxBP: 250 // Highest possible BP
	}
	var args = _.isObject(args) ? _.defaults(args, defaults) : defaults
	_.extend(this, args)

  if (this.isTestMode) {
    this.mode = "test"
    this.macId = "8CDE52143F1E"
    this.name = "BP5 143F1E"
  } else {
    this.mode = ""
    this.macId = null
    this.name = null
  }

  // Fixed Args
  this.timeout = null
  this.state = "disconnected"  // attempting to getBattery during measurement will not work
  this.battery = null  // if null, UI should grey out the battery icon
  this.error = null // if null, there is no error
  this.offlineNum = null // if null, there is no error

  this.isPluginLoaded = false

  this.checkPluginLoaded()
  if (!this.isPluginLoaded) {
    var self = this
    var timerCheckPlugin = Meteor.setInterval(function(){
      if (!self.isPluginLoaded) {
        self.checkPluginLoaded()
      } else {
        Meteor.clearInterval(timerCheckPlugin)
        console.log('stop timerCheckPlugin')
      }
    }, 200)
  }
}

iHealthBP5.prototype = {
  checkPluginLoaded: function() {
    debugL(2)("checkPluginLoaded BP call: - ")
    var isPluginLoaded = typeof(BpManagerCordova) !== "undefined"
    console.log('checkPluginLoaded BP: ' + isPluginLoaded)
    this.isPluginLoaded = isPluginLoaded
    // saveApp({isPluginLoaded: isPluginLoaded})
    Session.set("isPluginLoaded", isPluginLoaded)
    return isPluginLoaded
  },
  isConnected: function() {
    debugL(2)("isConnected call: - ")
    return this.state !== "disconnected"
  },
  /**
   * Connect to BP Device
   */
  connect: function(cbFail, cbSuccess) {
    debugL(1)("connect call: " + cbFail + ", " + cbSuccess)
    if (!this.isPluginLoaded) {
      debugL(1)("connect abort: " + this.isPluginLoaded)
      return
    }

    console.log("Connecting...")

    // Example of possible returns
    // {"address":"5CF938BED71E"}
    // {"address":"F4F951C259FD"}
    // {"address":"7FEE23DD7284"}
    // {"address":"8CDE52143F1E","name":"BP5 143F1E"}
    // {"address":"8CDE52143F1E","msg":"create bluetoothsocket success"}
    // {"address":"8CDE52143F1E","msg":"create iostream success"}
    // {"address":"8CDE52143F1E","msg":"authenticate device"}

    // Begin Connection Attempt
    saveDevices({ BP: "searching" })

    var self = this
    var startDiscoverySuccessCB = function(res){
        // ##
        // Success Function
        console.log("Success: "+res) // DEVELOPMENT MODE

        try {
          debugL(7)("#### Parse Attempt")
          var json = JSON.parse(res)
          if (json.address && json.name) {
            self.name = json.name
            debugL(7)("#### Parse Success")
            self.macId = json.address
            self.state = "connected"
            saveDevices({ BP: "connected" })

            // iOS plugin currently doesn't have this function
            // if (!h.getPlatform("ios"))

            if (!h.getPlatform("ios") && _.isFunction(BpManagerCordova.connectDevice)) {
              BpManagerCordova.connectDevice(self.macId, function (res) {
                console.log("Connect Failed", res)
                debugL(2)("not ios connectDevice", res)
              }, function (message) {
                console.log("Connect Success", res)

                // Remove the "disconnected" error if it was disconnected.
                var curSession = Session.get("BP")
                if (_.isObject(curSession) && curSession.errorID===99) {
                  delete curSession.errorID
                  Session.set("BP", curSession)
                }

                if (cbSuccess) cbSuccess()
                debugL(2)("is ios connectDevice", res)
                if (_.isFunction(cbSuccess)) {
                  cbSuccess()
                }
              })
            } else {
              console.log("Connect function was never executed. Perhaps this is an iOS device?")
              if (_.isFunction(cbSuccess)) {
                cbSuccess()
              }
            }

            Meteor.clearTimeout(self.timeout)
            self.timeout = Meteor.setTimeout( function(){
              // Set bp to true after 2 seconds so the "Connected" status message can be read by humans.
              // @Jason, I'd prefer to keep UI related code outside BP5
              if (self.macId!=null){
                saveDevices({
                  BP: {
                    macId: self.macId,
                    name: self.name,
                    state: self.state
                  }
                })
                self.getOfflineNum()
                self.checkOfflineMode()
                self.updateBattery()

                var batteryCheckInterval = 30 * 1000;
                Meteor.clearInterval(self.batteryTimer);
                self.batteryTimer = Meteor.setInterval(function() {
                  self.updateBattery()
                }, batteryCheckInterval);

                var cancelBatteryTimer = function() {
                  Meteor.clearInterval(self.batteryTimer);
                }
                self.detectDisconnect(cancelBatteryTimer)


                if (_.isFunction(cbSuccess)) {
                  cbSuccess()
                }
              }
            }, self.connectAndReadyDelay)

          } else
            saveDevices({ BP: "searching" })

          // Skipping "Connecting" because it causes error if user stops before the final stage.
          // switch (json.msg) {
          //   case "create bluetoothsocket success":
          //   case "create iostream success":
          //     saveDevices({ BP: "connecting" })
          //     break
          //   case "authenticate device":
          //     self.macId = json.address
          //     saveDevices({ BP: "connected" })
          //
          //     Meteor.setTimeout( function(){
          //       // Set bp to true after 2 seconds so the "Connected" status message can be read by humans.
          //       if (self.macId!=null){
          //         self.pingDevice(true)
          //         if (cbSuccess) cbSuccess()
          //       }
          //     }, 2000)
          //     break
          //   default:
          //     saveDevices({ BP: "searching" })
          // }
        } catch(err) {
          // DEVELOPMENT MODE
          console.warn(err)
          console.log(res)
        }
      };

    var startDiscoveryFailCB = function(res){
        // ##
        // Failure Function
        console.log("Fail: "+res) // DEVELOPMENT MODE

        // Commenting these two lines because I want the instance to remember the originally connected macId & name
        // self.macId = null
        // self.name = null
      }

    console.log("Start discovery")
    BpManagerCordova.startDiscovery( this.macId, startDiscoverySuccessCB, startDiscoveryFailCB)

      // Give up after X amount of time
      Meteor.clearTimeout(self.timeout)
      self.timeout = Meteor.setTimeout( function(){
        console.log("Connection attempt has been timed out.")
        self.stopConnecting()
        if (cbFail) cbFail()
      }, this.connectionAttemptDuration)
  },

  /**
   * Start monitoring the blood pressure and store it into Session "BP"
   */
  start: function(finishCallback){
    debugL(1)("start call: - ")
    var self = this
    // var reconnectAttempted = false

    if (!this.isPluginLoaded || this.hasStarted) {
      debugL(1)("start terminated early: - " + this.isPluginLoaded + ", " + this.hasStarted)
      return // Exit because BpManagerCordova is not defined
    }

    // var reconnectStart = function() {
    //   self.connect( function(){
    //     console.warn("Could not start device because device couldn't be found.")
    //   }, function(){
    //     self.start()
    //   })
    // }
    //
    // if (this.isConnected()) {
    //   reconnectStart()
    //   return
    // }

    this.hasStarted = true // Ensure that BP monitor can only run one at a time
    this.state = "measuring"

    // Start from 0
    var bp = {pressure: 0, status: 'processing'}
    Session.set("BP", bp) // Start from 0

    console.log("Starting device: "+this.macId)

    BpManagerCordova.startMeasure( this.macId, function(res){
      /**
       * Success Function()
       * Do the JSON.parse inside the try-catch block
       * "res" var is not always a JSON String.
       */
      debugL(2)("startMeasure", res);

      try {
        var json = JSON.parse(res)
        // console.log ('json: ', json)

        _.extend(bp, json) // sometimes bp doesn't update fast enough

        // console.log("keys:", _.keys(bp))
        // console.log("values:", _.values(bp))
        debugL(3)("extended BP: ", bp)

        if (json.highpressure && json.lowpressure) {
          // bp.status = 'paused'
          self.stop(null, true)

          // Meteor.setTimeout( function(){
            bp.status = 'finished'
            bp.date = new Date()

            if (_.isFunction(finishCallback))
              finishCallback(res)

            Session.set("BP", bp)
          // },self.finishedMeasurementDelay)

        } else {
          bp.status = 'processing'
          bp.perCent = json.pressure / self.maxBP

          if (!_.isNumber(bp.perCent)) {
            console.log("########")
            console.log("########")
            console.log("########")
            console.log("########")
            console.log("########")
            console.log("########")
            console.log("########")
            console.log("########")
            console.log("NaN Error Happened")
            console.log(json)
            bp.errorID = 98
          }
        }

        // if (res.msg=="No Device") {
        //   self.stop(function(){
        //     self.macId = null
        //     self.start()
        //   })
        // }

        if (_.isNumber(bp.errorID) && bp.errorID>=0) {
          self.handleError(bp)
          self.stop(null,true)
        } else
          Session.set("BP", bp)

      } catch(err) {
        // DEVELOPMENT MODE
        console.log("JSON Try/Catch Error")
        console.warn(err)
        console.log(res)

        // if (res.errorID) {
        //   // Session.set("BP", bp)
        //   self.handleError(res.errorID)
        //   self.stop()
        // }
      }
    }, function(res){
      console.log('start measure fail' + res)
      // Failure Function()
      self.stop()

      // if (!reconnectAttempted) {
      //   console.warn("Start Measure Error: "+res)
      //   reconnectAttempted = true
      //   reconnectStart()
      // } else {
      //   console.warn("Start Measure Error in Reconnect: "+res)
      // }
    })
  },
  handleError: function(bp) {

    // Exit because if BP session is *NOT* an object, measurement was not happening.
    // And if measurement was not happening, then there's not need to handle any errors.
    if (!_.isObject(bp))
      return

    debugL(2)("Error Handler Code: " + bp.errorID)

    switch (bp.errorID) {
      case 0:
        bp.msg = "Please keep your arm stable. Stay still and try again."
      break
      case 4:
        // Low Pressure Error -- Cannot inflate.
        bp.msg = "Your blood pressure was too low. Please wear the blood pressure cuff properly and try again."
      break
      case 35:
        bp.msg = "Stop button was pressed. Please close and try again."
      case 13:
        bp.msg = "Battery is too low. Please re-charge and try again."
      break

      // Following error codes are software generated -- they are not from the plugin
      case 98:
        // No error code received but measurement couldn't continue -- i.e. NaN pressure
        bp.msg = "Unknown error occured."
      break
      case 99:
        // Code created for disconnect callback
        bp.msg = "Your device was disconnected from the blood pressure monitor."
      break
    }

    // if (_.isNumber(bp.errorID) && !bp.msg)
    if (bp.msg)
      Session.set("BP", bp)

    BpManagerCordova.getErrorDetailWithID( bp.errorID, function(errObjStr){
      if (!bp.msg) {
        console.log("##########")
        console.log("##########")
        console.log("##########")
        console.log("##########")
        console.log("##########")
        console.log("##########")
      }
      var errObj = processSignal(errObjStr)
      if (errObj.ErrorMessage) {
        var bpErrorMsg = ""
        if (errObj.ErrorMessage.match(/\.$/)) {
          debugL(5)("yes for " + bp.errorID + ": " + errObj.ErrorMessage)
          bpErrorMsg = errObj.ErrorMessage
        } else {
          debugL(5)("no for " + bp.errorID + ": " + errObj.ErrorMessage)
          bpErrorMsg = errObj.ErrorMessage + "."
        }
        debugL(4)("bpErrorMsg for " + bp.errorID + ": " + bpErrorMsg)
        debugL(4)("bp.msg for " + bp.errorID + ": " + bp.msg)
      }

    }, cbLog("getErrorDetailWithID fail"))
  },
  /**
   * Stop monitoring the blood pressure
   */
  stop: function(cb,notStopMeasure) {
    debugL(2)("stop call: " + cb + ", " + notStopMeasure)
    if (!this.isPluginLoaded) return // Exit because BpManagerCordova is not defined

    this.hasStarted = false
    this.state = "connected"

    if (!_.isFunction(cb)) {
      var self = this
      var cb = function(res){
        console.log(res);
        try {
          Session.set("BP", JSON.parse(res));
        } catch(err) {
          console.warn(err);
        }
      }
    }

    if (!notStopMeasure)
      BpManagerCordova.stopMeasure(this.macId, cb, cb)
  },
  /**
   * Return uniformized BP
   */
  uniformizeBP: function(setZero){
    debugL(1)("uniformizeBP call: " + setZero )
    console.log("stopMeasure call")
    var bp = Session.get("BP") || {}
    if (setZero && !bp.pressure) {
      bp.pressure = 0
      bp.perCent = 0
    }
    bp.statusClass = bp.status || 'start'
    return bp
  },
  updateBattery: function() {
    debugL(4)("updateBattery  call: - ")
    var self = this
    var cb = function(signal) {
      var jsonSignal = processSignal(signal)
      if(jsonSignal && jsonSignal.battery) {
        self.battery = Math.abs(jsonSignal.battery - self.battery)===1
          ? Math.min(self.battery, jsonSignal.battery)
          : jsonSignal.battery

        var curBP = getDevices("BP")
        curBP.battery = self.battery
        saveDevices({ BP: curBP })
      }
    }
    if (this.state !== "measuring") {
      BpManagerCordova.getBattery(this.macId, cb, cbLog('getBattery fail'))
    } else {
      console.log("cannot updateBattery while measuring")
    }
    // currently fails silently, since updateBattery is usually on setInterval
    // should we return an error so that getBattery can be rescheduled? else { setTimeout getBattery}
  },
  detectDisconnect: function(cb) {
    debugL(2)("detectDisconnect  call: " + cb)
    console.log('start setDisconnectCallback');
    var self = this
    var disconnectCB = function(signal) {
      console.log('disconnected' + signal);
      var jsonResult = processSignal(signal);

      if (jsonResult && jsonResult.msg && jsonResult.msg === "disconnect") {
        self.state = "disconnected"

        // marker
        saveDevices({ BP: null })

        var curSession = Session.get("BP")
        if (_.isObject(curSession)) curSession.errorID = 99
        self.handleError( curSession )
      }

      if (typeof(cb) === 'function')
        cb()
    }

    BpManagerCordova.setDisconnectCallback(this.macId, disconnectCB, cbLog('disconnectCallbackCB fail'));
  },
  enableOffline: function(){
    debugL(1)("enableOffline call: - ")
    if (this.state !== "measuring") {
      BpManagerCordova.enableOffline(this.macId, cbLog("enableOffline success"), cbLog("enableOffline fail"))
      this.checkOfflineMode()
    } else {
      console.log("cannot enableOffline while measuring")
    }
  },
  disableOffline: function(){
    debugL(1)("disableOffline call: - ")
    if (this.state !== "measuring") {
      BpManagerCordova.disenableOffline(this.macId, cbLog("disableOffline success"), cbLog("disableOffline fail"))
      this.checkOfflineMode() // confirm command was successful, and update Session "devices"
    } else {
      console.log("cannot disableOffline while measuring")
    }
  },
  checkOfflineMode: function(){
    debugL(1)("checkOfflineMode call: - ")
    var self = this
    var cb = function(signal) {
      var jsonSignal = processSignal(signal)
      if (jsonSignal && jsonSignal.isEnableOffline) {
        self.isEnableOffline = jsonSignal.isEnableOffline

        var curBP = getDevices("BP")
        curBP.isEnableOffline = self.isEnableOffline
        saveDevices({ BP: curBP })
      }
    }
    if (this.state !== "measuring") {
      BpManagerCordova.isEnableOffline(this.macId, cb, cbLog("isEnableOffline fail"))
    } else {
      console.log("cannot checkOfflineMode while measuring")
    }
  },
  getOfflineNum: function(){
    debugL(1)("getOfflineNum call: - ")
    var self = this
    var cb = function(signal) {
      var jsonSignal = processSignal(signal)
      if (jsonSignal && jsonSignal.msg && jsonSignal.msg === "offlineNum") {
        self.offlineNum = jsonSignal.value;

        var curBP = getDevices("BP")
        curBP.offlineNum = self.offlineNum
        saveDevices({ BP: curBP })
      }
    }
    if (this.state !== "measuring") {
      BpManagerCordova.getOfflineNum(this.macId, cb, cbLog("getOfflineNum success"))
    } else {
      console.log("cannot getOfflineNum while measuring")
    }
  },
  getOfflineData: function(){
    debugL(1)("getOfflineData call: - ")
    var self = this
    var cb = function(signal) {
      var jsonSignal = processSignal(signal)
      if (jsonSignal && jsonSignal.msg && jsonSignal.msg === "offlineData") {
        var curBP = getDevices("BPOfflineData")
        curBP.offlineData = curBP.offlineData ? curBP.offlineData : []
        curBP.offlineData.concat(jsonSignal.value)
        saveDevices({ BPOfflineData: curBP })
      }
    }

    if (this.state !== "measuring") {
      BpManagerCordova.getOfflineData(this.macId, cbLog("getOfflineData success"), cbLog("getOfflineData success"))
    } else {
      console.log("cannot getOfflineData while measuring")
    }

  },
  /**
   * Stop connection attempt
   */
  stopConnecting: function(){
    debugL(1)("stopConnecting call: - ")

    console.log("Stopping Connect Attempt")

    var deviceCheck = getDevices()
    if (!_.isObject(deviceCheck.BP) && deviceCheck.BP!="connected") {
      saveDevices({ BP: null })

      if (this.isPluginLoaded)
        var cb = function(res){ console.log("Stop discovery: ", res) }
        BpManagerCordova.stopDiscovery(this.macId, cb, cb)
    }
  },
  /**
   * Disconnect and set all device info to null
   */
  disconnect: function(){
    debugL(1)("disconnect call: - ")
    var self = this
    saveDevices({ BP: null })

    if (this.isPluginLoaded && _.isFunction(BpManagerCordova.disConnectDevice))
      var cb = function(res){ console.log("Disconnect device: ", res) }
      BpManagerCordova.disConnectDevice(this.macId, cb, cb)

    // this.macId = null
    // this.name = null
    var self = this
    saveDevices({ BP: null })

    if (this.isPluginLoaded && _.isFunction(BpManagerCordova.disConnectDevice))
      var cb = function(res){ console.log("Disconnect device: ", res) }
      BpManagerCordova.disConnectDevice(this.macId, cb, cb)

    // this.macId = null
    // this.name = null
    // Disconnect function success/fail functions in the plugin do not work.
    // Could be a bug, or could just be incomplete features
    //
    // , function(res){
    //   console.log(res)
    //   console.log("Disconnected")
    //
    //   self.macId = null
    //   self.name = null
    // },
    // function(e){
    //   console.warn(e)
    //   console.log("Failed to disconnect with macId "+self.macId)
    // }, this.mode)
  }
}
