

KUI.Student_index = class extends RC.CSSMeteorData{
    constructor(p){
        super(p);
    }

    baseStyles(){
        return {
            table : {
            }
        };
    }

    getMeteorData(){
        let list = this.getStudentModule().getDB().find({},{
            sort : {
                updateTime : -1
            }
        }).fetch();

        return {
            list
        };
    }

    getStudentModule(){
        return KG.get('EF-Student');
    }

    render(){

        let style = this.css.get('styles');

        const titleArray = [
            {
                title : 'Student',
                key : 'nickName',
                style : {
                }
            },
            {
                title : 'Gender',
                key : 'profile.gender',
                style : {
                }
            },
            {
                title : 'Age',
                key : 'age',
                style : {
                }
            },
            {
                title : 'Parents',
                key : 'accountName',
                style : {

                }
            }
        ];

        var list = this.data.list;

        _.map(list, (item)=> {
            item.age = '';
            if(item.profile.birthday){
                console.log(moment().year(), moment(item.profile.birthday).year());
                item.age = moment().year() - moment(item.profile.birthday).year()
            }
            return item;

        });


        return (
            <RC.Div>

                <KUI.Table
                    style={style.table}
                    list={list}
                    title={titleArray}
                    ref="table"></KUI.Table>


            </RC.Div>
        );

    }
};

