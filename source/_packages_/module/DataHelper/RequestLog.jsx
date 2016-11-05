let Base = KG.getClass('Base');

KG.define('EF-Request', class extends Base{
	defineDBSchema(){
		return {
			operatorID : KG.schema.default(),
			operatorName : KG.schema.default(),
			type : KG.schema.default({
				allowedValues : ['login', 'logout', 'insert AdminUser', 'edit AdminUser', 'delete AdminUser',
					'insert Customer', 'edit Customer', 'delete Customer',
					'insert Student', 'edit Student', 'delete Student',
					'insert Class', 'edit Class', 'delete Class',
					'insert Program', 'edit Program', 'delete Program',
					'insert Session', 'edit Session', 'delete Session',
					'register class', 'change class', 'cancel class', 'trial class', 'makeup class',
					'cancel makeup class',
					'pay order',
					'change school credit',
					'cancel pending class',
					'change student level'
				]
			}),
			client : KG.schema.default({
				allowedValues:['admin', 'mobile']
			}),
			detail : {
				type : Object,
				optional : true,
				blackbox : true,
				defaultValue : {}
			},
			createTime : KG.schema.createTime(),
			updateTime : KG.schema.updateTime()
		};
	}

	addByType(type, param){
		let data = {
			operatorID : param.operatorID || Meteor.user()._id,
			operatorName : param.operatorName || Meteor.user().username
		};

		data.type = type;
		data.client = param.client || 'admin';
		switch(type){
			case 'login':
				data.detail = {};
				break;
			case 'logout':
				data.detail = {};
				break;
			case 'insert Customer':
			case 'edit Customer':
				data.detail = {
					id : param.id,
					data : param.data
				};
				break;

			case 'register class':
				data.detail = {
					id : param.id,
					data : param.data
				};
				break;
			case 'change school credit':
				data.detail = {
					id : true,

					/*
					* customer
					* credit
					* note
					* */
					data : param.data
				};
				break;

			case 'cancel class':
			case 'change class':
			case 'cancel makeup class':
			case 'cancel pending class':
			case 'makeup class':
				data.detail = {
					data : param.data
				};
				break;
			case 'change student level':
				data.detail = {
					id : param.id,
					data : param.data
				}
				break;

			default :
				throw new Meteor.Error('error', '[add log] '+type+' type is not valid');
		}

		this._db.insert(data);
	}

	defineMeteorMethod(){
		let self = this;
		return {
			getDetailById : function(id){
				let m = KG.DataHelper.getDepModule();
				let rs = self._db.findOne({_id:id});
				rs.result = {};


				if(rs.detail && rs.detail.data){
					let d = rs.detail.data;

					_.extend(rs.result, d);
					if(d.accountID){
						rs.result.customer = m.Customer.getDB().findOne({_id:d.accountID});
					}

					if(d.classID){
						rs.result.class = m.Class.getAll({_id:d.classID})[0];
					}
					if(d.toClassID){
						rs.result.toClass = m.Class.getAll({_id:d.toClassID})[0];
					}

					if(d.studentID){
						rs.result.student = m.Student.getDB().findOne({_id : d.studentID});
					}

					if(d.customer){
						rs.result.customer = d.customer;
					}

					if(d.credit){
						rs.result.credit = d.credit>=0?('+'+d.credit):'-'+Math.abs(d.credit);
					}

					if(d.level){
						rs.result.level = m.ClassLevel.getDB().findOne({_id : d.level}).name;
					}
					if(d.oldLevel){
						rs.result.oldLevel = m.ClassLevel.getDB().findOne({_id : d.oldLevel}).name;
					}

				}

				return rs;
			}
		};
	}
});

Meteor.startup(function(){
	KG.RequestLog = KG.create('EF-Request');
});
