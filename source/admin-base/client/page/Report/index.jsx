KUI.Report_Index = class extends RC.CSS{
	render(){
		return (
			<RC.Div>
				<h3>Report</h3>
				<hr/>
				<RC.URL href="/report/finance"><p>View Finance Report</p></RC.URL>
				<RC.URL href="/report/student"><p>View Student Report</p></RC.URL>

				<RC.URL href="/report/classstudent/pending"><p>View Pending Registration Report</p></RC.URL>

				<RC.URL href="/report/customer/schoolcredit"><p>View School Credit Report</p></RC.URL>
				<RC.URL href="/report/coupon"><p>View Coupon Report</p></RC.URL>
				<RC.URL href="/report/dailyRoster"><p>View Daily Roster</p></RC.URL>
			</RC.Div>
		);
	}
};