
RC.List = React.createClass({
  getInitialState(){
    return {
      selected: null
    }
  },
  getTheme(name){
    let enableClick = _.isUndefined(this.props.enableClick) ? true : this.props.enableClick
    let theme = _.contains(["regular","nav-list","nav-list dark"], name)
      ? name : "regular"
    return theme+" "+(this.props.className || "")+(enableClick ? " click-enabled" : "")
  },
  clickHandler(n, onClick){
    if (_.isUndefined(this.props.enableClick) || this.props.enableClick)
      this.setState({selected: n})

    if (_.isFunction(onClick))
      onClick()
  },
  render() {

    if (!_.isArray(this.props.list) || !this.props.list.length) return null

    let self = this
    let curState = this.state.selected
    let enableClick = this.props.enableClick || true

    return <ul className={"rc-list "+this.getTheme(this.props.theme)}>
      {
      this.props.list.map(function(item,n){

        let itemTitle = null
        let itemSubtitle = null

        let cur = null
        let avatar = null
        let sub = null

        let date = framework.getDateFromProps(item.date, item.dateFormat)

        switch(item.type){
          case "title":
            cur = "type-listTitle sub "+(item.className || "")
            itemTitle = item.label
          break
          default:
            cur = "transition listItem"+(item.avatar || item.uiClass ? " with-icon " : " ")+(n==curState ? "cur " : "")+(item.onClick || item.href || enableClick ? "cursor " : "")+(item.className || "")
            avatar = <RC.Avatar src={item.avatar} theme="regular" uiClass={item.uiClass} uiSize={item.uiSize>=0 ? item.uiSize : 1} uiColor={item.uiColor || "white"} />

            let itemTitle = item.title ? <h4 className="textTitle ellipsis">{item.title}</h4> : null
            let itemSubtitle = item.subtitle || item.label
              ? <p className="subtitle smaller ellipsis">{item.label ? <strong className="label inline-block">{item.label}</strong> : null}{item.subtitle}</p>
              : null

            sub = item.date ? <strong className="date sub">{date}</strong> : null
        }

        return <li className={cur} key={n} onClick={self.clickHandler.bind(null, n, item.onClick)}>
          {
            item.href
            ? <a href={item.href}>{sub}{avatar}{itemTitle}{itemSubtitle}</a>
            : <span>{sub}{avatar}{itemTitle}{itemSubtitle}</span>
          }
        </li>
      })
      }
    </ul>
  }
})
