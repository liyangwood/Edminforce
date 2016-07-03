KUI.Comp = {};

KUI.Comp.SelectPaymentWay = class extends RC.CSS{
	render(){

		let f = this.props.type !== 'cash';

		return (
			<RC.Div style={{}}>
				{f?
				<RB.Input onChange={function(){}} ref="s21" name="cgroup" type="radio" label="Credit Card/Debit Card" />
					:null}
				{f?<RB.Input onChange={function(){}} ref="s24" name="cgroup" type="radio" label="E-Check" />:null}

				<RB.Input onChange={function(){}} ref="s22" name="cgroup" type="radio" label="Cash" />
				<RB.Input onChange={function(){}} ref="s23" name="cgroup" type="radio" label="Check" />

				<RB.Input onChange={function(){}} ref="s26" name="cgroup" type="radio" label="Pay Later" />

			</RC.Div>
		);
	}

	getRefs(){
		return {
			cc : this.refs.s21,
			ec : this.refs.s24,
			cash : this.refs.s22,
			check : this.refs.s23,
			pl : this.refs.s26
		};
	}

	getValue(){
		let {cc, ec, cash, check, pl} = this.getRefs();

		let s21 = $(cc.getInputDOMNode()).prop('checked'),
			s24 = $(ec.getInputDOMNode()).prop('checked'),
			s22 = $(cash.getInputDOMNode()).prop('checked'),
			s23 = $(check.getInputDOMNode()).prop('checked'),
			s26 = $(pl.getInputDOMNode()).prop('checked');

		if(s21){
			return 'credit card';
		}
		if(s24){
			return 'echeck';
		}
		if(s22){
			return 'cash';
		}
		if(s23){
			return 'check';
		}
		else if(s26){
			return 'pay later';
		}

		return null;
	}
};


//for Calphin
KUI.Comp.AllSelectPaymentWay = class extends RC.CSS{
	constructor(p){
		super(p);

		this.state = {
			select : null
		};
	}

	render(){


		return (
			<RC.Div style={{}}>

				<RB.Input onChange={this.change.bind(this)} ref="s21" name="cgroup" type="radio" label="Credit Card/Debit Card" />

				<RB.Input onChange={this.change.bind(this)} ref="s24" name="cgroup" type="radio" label="E-Check" />

				<RB.Input onChange={this.change.bind(this)} ref="s22" name="cgroup" type="radio" label="Cash" />


				<RB.Row>
					<RB.Col md={1}>
						<RB.Input onChange={this.change.bind(this)} ref="s23" name="cgroup" type="radio" label="Check" />
					</RB.Col>
					<RB.Col md={4}>
						{this.state.select==='check'?<RB.Input type="text" ref="check_note" placeholder="Check No#" />:null}
					</RB.Col>
				</RB.Row>


				<RB.Row>
					<RB.Col md={1}>
						<RB.Input onChange={this.change.bind(this)} ref="s28" name="cgroup" type="radio" label="POS" />
					</RB.Col>
					<RB.Col md={4}>
						{this.state.select==='pos'?<RB.Input type="text" ref="pos_note" placeholder="Last 4 digital of card used" />:null}
					</RB.Col>
				</RB.Row>



				<RB.Input onChange={this.change.bind(this)} ref="s26" name="cgroup" type="radio" label="Pay Later" />

			</RC.Div>
		);
	}

	change(e){
		let v = this.getInputValue();
		this.setState({select : v});
	}

	getRefs(){
		return {
			cc : this.refs.s21,
			ec : this.refs.s24,
			cash : this.refs.s22,
			check : this.refs.s23,
			pl : this.refs.s26,
			pos : this.refs.s28
		};
	}

	getInputValue(){
		let {cc, ec, cash, check, pl, pos} = this.getRefs();

		let s21 = $(cc.getInputDOMNode()).prop('checked'),
			s24 = $(ec.getInputDOMNode()).prop('checked'),
			s22 = $(cash.getInputDOMNode()).prop('checked'),
			s23 = $(check.getInputDOMNode()).prop('checked'),
			s26 = $(pl.getInputDOMNode()).prop('checked'),
			s28 = $(pos.getInputDOMNode()).prop('checked');

		if(s21){
			return 'credit card';
		}
		if(s24){
			return 'echeck';
		}
		if(s22){
			return 'cash';
		}
		if(s23){
			return 'check';
		}
		if(s26){
			return 'pay later';
		}
		if(s28){
			return 'pos';
		}

		return null;
	}

	getValue(){
		let v = this.state.select;
		let note = '';
		if(v === 'check'){
			note = this.refs.check_note.getValue();

			if(!note){
				util.toast.showError('Check number is required');
				return [false, note];
			}
		}
		else if(v === 'pos'){
			note = this.refs.pos_note.getValue();

			if(!note){
				util.toast.showError('POS Last 4 digital of card used is required');
				return [false, note];
			}
		}

		return [v, note];
	}
};



KUI.Comp.CreditCardForm = class extends RC.CSS{
	renderForm(){

		let p = {
			credit : {
				labelClassName : 'col-xs-4',
				wrapperClassName : 'col-xs-8',
				ref : 'credit',
				label : 'Credit Card Number'
			},
			expiration : {
				labelClassName : 'col-xs-4',
				wrapperClassName : 'col-xs-8',
				ref : 'expiration',
				label : 'Expiration Date (MM/YY)'
			},
			ccv : {
				labelClassName : 'col-xs-4',
				wrapperClassName : 'col-xs-8',
				label : 'CCV',
				ref : 'ccv'
			},
			first : {
				labelClassName : 'col-xs-4',
				wrapperClassName : 'col-xs-8',
				ref : 'first',
				label : 'Card Holder First Name'
			},
			last : {
				labelClassName : 'col-xs-4',
				wrapperClassName : 'col-xs-8',
				ref : 'last',
				label : 'Card Holder Last Name'
			},
			street : {
				labelClassName : 'col-xs-4',
				wrapperClassName : 'col-xs-8',
				ref : 'street',
				label : 'Street Address'
			},
			city : {
				labelClassName : 'col-xs-4',
				wrapperClassName : 'col-xs-8',
				ref : 'city',
				label : 'City'
			},
			state : {
				labelClassName : 'col-xs-4',
				wrapperClassName : 'col-xs-8',
				ref : 'state',
				label : 'State'
			},
			zip : {
				labelClassName : 'col-xs-4',
				wrapperClassName : 'col-xs-8',
				ref : 'zip',
				label : 'Zip Code'
			}
		};

		return (
			<form className="form-horizontal">
				<RB.Row>
					<RB.Col md={12} mdOffset={0}>
						<RB.Input type="text" {... p.credit} />
						<RB.Input type="text" {... p.expiration} />
						<RB.Input type="text" {... p.ccv} />
						<RB.Input type="text" {... p.first} />
						<RB.Input type="text" {... p.last} />
						<RB.Input type="text" {... p.street} />
						<RB.Input type="text" {... p.city} />
						<RB.Input type="text" {... p.state} />
						<RB.Input type="text" {... p.zip} />
					</RB.Col>
				</RB.Row>
			</form>
		);

	}

	getValue(opts){
		let data = {
			creditCardNumber : this.refs.credit.getValue(),
			ccv : this.refs.ccv.getValue(),
			expirationDate : this.refs.expiration.getValue(),
			order : opts.orderID,
			id : opts.accountID,
			cardHolderFirstName : this.refs.first.getValue(),
			cardHolderLastName : this.refs.last.getValue(),
			street : this.refs.street.getValue(),
			city : this.refs.city.getValue(),
			state : this.refs.state.getValue(),
			zip : this.refs.zip.getValue(),
			amount : opts.total
		};
		return data;
	}

	render(){
		return (
			<RC.Div>
				{this.renderForm()}
			</RC.Div>
		);
	}
};

KUI.Comp.ECheckForm = class extends RC.CSS{
	renderForm(){
		let p = {
			routing : {
				labelClassName : 'col-xs-4',
				wrapperClassName : 'col-xs-8',
				label : 'Routing Number',
				ref : 'routing'
			},
			account : {
				labelClassName : 'col-xs-4',
				wrapperClassName : 'col-xs-8',
				ref : 'account',
				label : 'Account Number'
			},
			name : {
				labelClassName : 'col-xs-4',
				wrapperClassName : 'col-xs-8',
				ref : 'name',
				label : 'Name'
			}
		};

		return (
			<form className="form-horizontal">
				<RB.Row>
					<RB.Col md={12} mdOffset={0}>
						<RB.Input type="text" {... p.routing} />
						<RB.Input type="text" {... p.account} />
						<RB.Input type="text" {... p.name} />

					</RB.Col>
				</RB.Row>
			</form>
		);
	}

	getValue(opts){
		let data = {
			routingNumber : this.refs.routing.getValue(),
			accountNumber : this.refs.account.getValue(),
			nameOnAccount : this.refs.name.getValue(),
			order : opts.orderID,
			id : opts.accountID,
			amount : opts.total
		};
		return data;
	}

	render(){
		return (
			<RC.Div>
				{this.renderForm()}
			</RC.Div>
		);
	}
};