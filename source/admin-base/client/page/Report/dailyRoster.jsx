
KUI.Report_DailyRoster = class extends RC.CSS {
    constructor(p) {
        super(p);

        this.state = {
            loading:false,
            selectedDate: new Date()
        };
        this.data = null;

        this.onDateChange = this.onDateChange.bind(this);
        this.getDailyRoster = this.getDailyRoster.bind(this);
    }

    // set up bootstrap datepicker control
    setupDatePicker(){
        let classDateDomNode = this.refs.selectedDate ? this.refs.selectedDate.getInputDOMNode() : null;
        if (classDateDomNode) {
            $(classDateDomNode).datepicker({});
            $(classDateDomNode).bind('hide', this.onDateChange);
        }
    }

    // set up date picker
    componentDidMount() {
        super.componentDidMount && super.componentDidMount();
        this.setupDatePicker()
    }
    componentDidUpdate(prevProps, prevState) {
        super.componentDidUpdate && super.componentDidUpdate(prevProps, prevState);
        this.setupDatePicker();
    }

    onDateEdit(e) {
        // nothing, just to get rid of the react js warning about value is set, but missing onChange
    }

    onDateChange(e) {
        let  newDate = e.date;
        this.setState({selectedDate:newDate});
    }

    getDailyRoster() {
        this.setState({loading:true});
        Meteor.call('dailyRoster.getData', moment(this.state.selectedDate).format("YYYYMMDD"),(function(err,result){
            this.data = result;
            
            // sort student names alphabetically, move trial & makeup to the end
            if (this.data.programs && this.data.programs.length > 0) {
                // sort programs by order
                this.data.programs.sort((a,b) => (a.displayOrder > b.displayOrder));

                this.data.programs.forEach( (p) => {
                    p.classes.forEach( (c) => {
                        if (!c.students || c.students.length == 0) return;

                        let regulars = [], makeups = [], trials = [];
                        c.students.forEach( (s) => {
                            if (s.type == 'makeup')
                                makeups.push(s);
                            else if (s.type == 'trial')
                                trials.push(s);
                            else
                                regulars.push(s);
                        })
                        regulars.length > 0 && regulars.sort( (a,b) => (a.name > b.name));
                        makeups.length > 0 && makeups.sort( (a,b) => (a.name > b.name));
                        trials.length > 0 && trials.sort( (a,b) => (a.name > b.name));
                        c.students = [...regulars, ...trials, ...makeups];
                    })
                });
            }

            //this.data.date = moment(this.selectedDate);
            // group by programs
            this.setState({loading:false, error: err && err.reason});
        }).bind(this))
    }

    // render daily roster as a HTML table
    renderRoster() {
        if (!this.data) return null;
        if (!this.data.programs || !this.data.programs.length)
            return (<div>No data available for the selected date</div>);
        if (this.state.error)
            return (<div>{this.state.error}</div>);

        let programTitleColor = "#1AB394";
        let programPalette = ["#99CC00", "#FF99CC", "#FFFF99", "#F4B084"];

        // group classes in each program by starting hour
        let hours = [];
        this.data.programs.forEach( (p) => {
            p.classes.forEach( (c) => {
                c.classTime = moment(c.schedule.time, 'hh:mma');
                if (hours.indexOf(c.classTime.hours()) < 0)
                    hours.push(c.classTime.hours());
            })
        });
        hours.sort((a,b) => (a-b));

        // calculate column width, the first column is smaller, the rest of the columns are equally sized
        let colWidth = Math.floor(100 / this.data.programs.length);
        let timeColWidth = 100 - colWidth * this.data.programs.length;
        while (timeColWidth + this.data.programs.length < colWidth - 1) {
            colWidth--;
            timeColWidth+=this.data.programs.length;
        }

        // create table column width elements
        let colWidthElements = new Array(this.data.programs.length);
        colWidthElements.push(<col key="cw" width={timeColWidth + "%"} />);
        this.data.programs.forEach( (p,index) => {
            colWidthElements.push(<col key={"cw"+index} width={colWidth + "%"} />);
        })

        // create table rows
        let rows = [];
        // currentHour stores rows from each program for the current hour
        let currentHour = new Array(this.data.programs.length);
        hours.forEach( (hour) => {
            // max number of rows in all program columns
            let maxRowCount = 0;

            // iterate through all programs, generate table columns for all classes in each program
            this.data.programs.forEach( (p, index) => {
                // classes from each program, start in the current hour
                let currentHourClasses = _.filter(p.classes, (c) => c.classTime.hours() == hour);

                // generate rows for all classes, and teachers
                currentHour[index] = {rows:[]}
                // sort classes by start time
                if (currentHourClasses.length > 0) {
                    currentHourClasses.sort( (a,b) => (a.classTime.valueOf() - b.classTime.valueOf()));
                    currentHourClasses.forEach( (c) => {
                        currentHour[index].rows.push({"teacher": c.classTime.format("hh:mm A ") + c.teacher + " (" + c.students.length + ")"});
                        currentHour[index].rows = [...currentHour[index].rows,...c.students];
                    })
                }

                if (maxRowCount < currentHour[index].rows.length)
                    maxRowCount = currentHour[index].rows.length;
            });

            // generate table rows
            for (let iRow = 0; iRow < maxRowCount; iRow++) {
                let tdElements = [];
                iRow == 0 && (tdElements.push( <td key={"c"+hour} rowSpan={maxRowCount}>{moment().hours(hour).format("hh:00 A")}</td> ))

                currentHour.forEach( (p, index) => {
                    if (iRow < p.rows.length) {
                        // class name or student name
                        if (p.rows[iRow].teacher) {
                            // show class time and teacher in a "th" style
                            tdElements.push(<th key={"c"+hour+"_" + iRow + "_" + index} style={{textAlign:"center", background:programPalette[index % programPalette.length] + ' !important'}}>
                                <a href="/teachers">{p.rows[iRow].teacher}</a>
                            </th>);
                        }
                        else {
                            let tdContent = p.rows[iRow].name;

                            // show unpaid for pending registration
                            (p.rows[iRow].unpaid) && (tdContent += ' (Unpaid)');

                            if (p.rows[iRow].type == 'trial')
                                tdContent += ' (trial)';
                            else
                            if (p.rows[iRow].type == 'makeup')
                                tdContent += ' (make up)';
                            
                            tdElements.push(<td key={"c"+hour+"_" + iRow + "_" + index}><a href={"/student/" + p.rows[iRow].studentID}>{tdContent}</a></td>);
                        }
                    }
                    else
                    if (iRow == p.rows.length && iRow < maxRowCount) {
                        // merged cell to show empty space
                        tdElements.push(<td key={"c"+hour+"_" + iRow + "_" + index} rowSpan={maxRowCount - iRow}></td>);
                    }
                })

                rows.push(<tr key={"r" + hour + "_" + iRow}>{tdElements}</tr>);
            }
        });

        let titleStyles = [{
            textAlign:"center",
            background: programTitleColor + ' !important'
        }, {
            textAlign:"center"
        }]

        return (
            <table className="table table-bordered table-condensed2" style={{textAlign:"center", fontSize:12}}>
                <colgroup>
                    {colWidthElements}
                </colgroup>
                <thead>
                    <tr>
                        <th></th>
                        {this.data.programs.map( (p, idx) => (<th key={"h" + idx} style={titleStyles[idx % 2]}>{p.name}</th>) )}
                    </tr>
                    </thead>
                <tbody>{rows}</tbody>
            </table>
        )
    }

    render() {
        if (this.state.loading)
            return util.renderLoading();

        let p = {
            date: {
                labelClassName : 'col-xs-4',
                wrapperClassName : 'col-xs-8',
                ref : 'selectedDate',
                label : 'Date'
            },
        };

        return (
            <RC.Div>
                <h3 style={{"textAlign": "left"}} className="print-hidden" >Daily Roster</h3>
                <RB.Row className="print-hidden">
                    <div className="form-horizontal">
                        <RB.Col md={6} mdOffset={0}>
                            <RB.Input type="text" {... p.date} value={moment(this.state.selectedDate).format("MM/DD/YYYY")} onChange={this.onDateEdit}>
                            </RB.Input>
                        </RB.Col>
                        <RB.Col  md={6} mdOffset={0} >
                            <KUI.YesButton onClick={this.getDailyRoster} label="Show"></KUI.YesButton>
                        </RB.Col>
                    </div>
                </RB.Row>
                <RC.Div style={{marginTop:20}}>
                    {
                        this.data && this.data.programs && this.data.programs.length &&
                        <a className="print-hidden" href="javascript:print();" title="print this page">
                            <RB.Button bsStyle="link"><RB.Glyphicon glyph="print" /></RB.Button>
                        </a>
                    }
                    <div className="print-show" style={{textAlign:'center',fontSize:'14px',margin:5}}> Daily Roster {moment(this.state.selectedDate).format("MM/DD/YYYY")} </div>
                    {this.renderRoster()}
                </RC.Div>
            </RC.Div>
        )
    }
}