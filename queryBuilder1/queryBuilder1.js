/**
 * @description       : This is Stable version of of Query Builder app
 * @author            : Siddharth Patni
 * @started on        : 06-18-2021 
 * @last modified on  : 07-07-2021
 * @last modified by  : Siddharth Patni
 * Modifications Log 
 * Ver   Date         Author            Modification
 * 1.0   06-18-2021   Siddharth Patni   Initial Version
**/
import { LightningElement,wire,track } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
import Pie_Chart from '@salesforce/messageChannel/Pie_Chart__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getObjList from '@salesforce/apex/ObjectDetails.getObjList';
import getFields from '@salesforce/apex/ObjectDetails.getFields';
import makeQuery from '@salesforce/apex/ObjectDetails.makeQuery';

export default class QueryBuilder extends LightningElement {
    //general
    @track obj;                             // stores name of object
    @track objectList=[];                   // holds names of all objects returned by apex
    @track fieldList=[];                    // holds names of all fields returned by apex
    @track fieldsSelected=[];               // stores names of all fields to be queried 

    queryResult=[];                         // holds data returned from apex
    columns = [];                           // columns to display in DataTable 
    col=[];                                 // temporarily stores names of columns

    // query 
    query='';
    offSetCount=0;
    totalNumberOfRows=50000;
    loadMoreSize=20;
    firedOnButton=false;
    targetDatatable=null;
    // handle Interface
    hasObjectSelected=false;
    showFireButton=false;
    showResult=false;
    //orderby clause
    orderBy='';
    nullOrder='';
    sortOrder='';
    // Group By Clause
    groupBy='';
    // Where Clause
    @track numberOfWhere=[0];                           // used to iterate specific times 
    whereCounter=1;                                     // will count the number of rows to be shown
    //Limit
    maxRecords=0;
    // data table
    defaultSortDirection = 'asc';
    sortDirection = 'asc';
    sortedBy;
    // basic code
    // wiring message context 
    @wire(MessageContext)
    messageContext;

    // gets list of all objects in org and stores them in this.objectList
    connectedCallback(){
        try{
            let options = [];
            getObjList()
            .then(result => {
                for (let key of result) {
                    options.push({ label: key.label, value: key.apiName  });
                }
                this.objectList = options;
            })
            .catch(error => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'error while loading this component',
                    message: error,
                    variant: 'error',
                }));
            });
        } catch(exception){
            this.dispatchEvent(new ShowToastEvent({
                title: 'error while loading this component',
                message: exception,
                variant: 'error',
            }));
        }
    }
    // @description : handleing UI behaviour on selection of query type
    queryType='0';
    get queryTypeOptions(){
        console.log('options displayed');
        return [
            { label: 'Simple SOQL', value: '1' },
            { label: 'Aggregated SOQL', value: '2' }    
        ];
    }
    get getQueryType(){
        if(this.queryType==='1'){
            console.log('simple SOQL selected');
            return true;
        }else if (this.queryType==='2'){
            console.log('aggregated SOQL selected');
            return false;
        }else{
            return true;
        }
    }
    handleQueryType(event){
        this.queryType=event.detail.value;
    }
    /**
    `*  @description : calls everytime the object is selected .. fatches names of fields in object selected and stores them in fieldList
        also set the visiblily of has object selected to true
    * @param event 
    */
    handleObjectSelect(event){
        try{
            let fieldMap=[];
            this.obj =event.detail.value;
            // getting all field names from apex
            getFields({ objName: event.detail.value })
            .then(result => {
                for (var key of result) {
                    // Here key will have index of list of records starting from 0,1,2,....
                    fieldMap.push({ label: key.label, value: key.apiName });
                }
                this.fieldList = fieldMap;
                this.hasObjectSelected=true;
                this.showResult=false;
                this.showFireButton=false;
            })
            .catch(error => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'error occured while selecting object',
                    message: error,
                    variant: 'error',
                }));
            });
        } catch(exception){
            this.dispatchEvent(new ShowToastEvent({
                title: 'error occured while selecting object',
                message: exception,
                variant: 'error',
            }));
        }
    }
    /**
     * @description : it gets called everytime a field selected and pushes value to this.col 
     *                also set showFireButton to true
     * @param event 
     */
    handleFieldSelection(event){
        try {
            this.fieldsSelected =event.detail.value;
            this.col=[];
            this.fieldsSelected.forEach(element => {
                if(element!=''){
                    this.col.push({ label: element, fieldName: element , sortable: true });
                }
            });
            if(this.col.length > 0){
                this.showFireButton=true;
            }
        } catch (exception) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'error occured while selecting field',
                message: exception,
                variant: 'error',
            }));
        }
    }

    //util
    /**
     * @description : this makes query using all clauses and also call buildWhereClause to get where Clause
     * @returns : query made by user
     */
    getQuery(){
        try {
            if(this.queryType==='1'){/*simple SOQL */
                // Required Query
                this.query= 'SELECT ' + this.fieldsSelected.toString() + ' FROM ' + this.obj  ;
                // adding where
                var whereClause=this.buildWhereClause();
                if(whereClause != ''){
                    this.query=this.query +' WHERE '+ whereClause;
                }
                // adding group by
                if(this.groupBy!=''){
                    this.query = this.query +' GROUP BY '+ this.groupBy;
                }
                // adding order by 
                if(this.orderBy != ''){
                    this.query = this.query + ' ORDER BY '+this.orderBy;
                    if(this.sortOrder!=''){
                        this.query = this.query + this.sortOrder;
                    }
                    if(this.nullOrder != ''){
                        this.query = this.query + this.nullOrder;
                    }
                }
                // adding limit and offset
                if(this.totalNumberOfRows < this.loadMoreSize ){
                    this.query = this.query +' LIMIT '+this.totalNumberOfRows+ ' OFFSET '+this.offSetCount;
                } else if( this.totalNumberOfRows < this.loadMoreSize+this.offSetCount){
                    this.query = this.query +' LIMIT '+(this.totalNumberOfRows-this.offSetCount)+ ' OFFSET '+this.offSetCount;
                } else{
                    this.query = this.query +' LIMIT '+this.loadMoreSize+ ' OFFSET '+this.offSetCount;
                }
            } else if (this.queryType==='2'){/* aggregated query */
                if(this.aggrField =='' && this.aggrFunc=='' && this.groupingField==''){
                    this.dispatchEvent(new ShowToastEvent({
                        title: 'Invalid Input',
                        message: 'please select proper options to make query !',
                        variant: 'error',
                    }));
                    return;
                }
                this.query='SELECT '
                if(this.aggrFunc != ''){
                    if(this.aggrFunc!='Count' && this.aggrField =='' ){
                        this.dispatchEvent(new ShowToastEvent({
                            title: 'Invalid Input',
                            message: 'please select proper options to make query !',
                            variant: 'error',
                        }));
                        return;
                    }
                    this.query= this.query +this.aggrFunc+this.aggrField+'),';
                }
                if(this.groupingField != ''){
                    this.query= this.query +this.groupingField + ' From '+this.obj +' GROUP BY '+this.groupingField ;
                }else{
                    if(this.query.endsWith(',')){
                        this.query=this.query.substring(0,this.query.length-1);
                    }
                    this.query=this.query+'From '+this.obj;
                }
            }
            return this.query;
        } catch (exception) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Invalid Input',
                message: exception,
                variant: 'error',
            }));
        }
    }
    // query making
    /**
     * @description : this is called when fire buton is clicked , this calls fireQuery Button if the total number of rows is entered properly by user
     * @param {*} event 
     * @returns is query's limit is not valid
     */
    handleFireButton(event){
        try {
            if(!this.checkTotalNumberOfRows()){
                return;
            }
            this.queryResult=[];
            this.offSetCount=0;
            this.firedOnButton=true;
            this.fireQuery();   
        } catch (exception) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Some Problem Occured , Please Try Again Later.',
                message: exception,
                variant: 'error',
            }));
        }
    }
    /**
     * @description : calls apex method and passes it query returned by getQuery to it , sets returned data to queryResult and also check when to stop infinite loading
     * @returns without calling apex if no field is selected for query by user
     */
    fireQuery(){
        try {            
            this.columns=this.col;
            if(this.columns.length <= 0){
                this.dispatchEvent(new ShowToastEvent({
                    title: 'No field Selected',
                    message: 'Please select at least one field',
                    variant: 'error',
                }));                
                return;
            }    
            makeQuery({ query : this.getQuery() })
                .then(result => {
                    this.queryResult = [...this.queryResult, ...result ];
                    if(this.targetDatatable ){
                        if(result.length ==0){
                            this.targetDatatable.enableInfiniteLoading = false;
                        }
                        if (  this.queryResult.length >= this.totalNumberOfRows || (result.length <20 && !result.length == this.totalNumberOfRows)) {
                            //stop Infinite Loading when threshold is reached
                            this.targetDatatable.enableInfiniteLoading = false;
                        }
                        this.targetDatatable.isLoading = false;
                    }
                    this.showResult=true;
                    if(this.firedOnButton && this.targetDatatable){
                        this.targetDatatable.enableInfiniteLoading = true;
                        this.firedOnButton=false;
                    }
                })
                .catch(error => {
                    this.dispatchEvent(new ShowToastEvent({
                        title: 'Some Problem Occured , Please Try Again Later.',
                        message: error,
                        variant: 'error',
                    }));
                });
            } catch (error) {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Some Problem Occured , Please Try Again Later.',
                    message: error,
                    variant: 'error',
                }));
            }
    }
    /**
     * @description : this is called everytime the user scrolls to bottom to lazy load the data , sets offSetCount variable which is used by getQuery method to control offset behavior 
     * @param {*} event 
     */
    handleLoadMore(event) {
        try {
            event.preventDefault();
            // increase the offset count by 20 on every loadmore event
            this.offSetCount = this.offSetCount + this.loadMoreSize;
            //Display a spinner to signal that queryResult is being loaded
            event.target.isLoading = true;
            //Set the onloadmore event taraget to make it visible to imperative call response to apex.
            this.targetDatatable = event.target;
            // Getting new set of records and appending it to this.queryResult only if there is possibility to fetch  
            if(this.queryResult.length<this.totalNumberOfRows){
                this.fireQuery();
            }else{
                this.targetDatatable.enableInfiniteLoading = false;
                event.target.isLoading = false;
            }
        } catch (exception) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Some Problem Occured , Please Try Again Later.',
                message: error,
                variant: 'error',
            }));
        }
    }
    // optional clauses
    // WHERE Clause : @description : list of operators used in making where clause
    get operators(){
        return [
            { label: 'Equals', value: ' =' },
            { label: 'Not Equals', value: ' !=' },
            { label: 'less Then', value: ' <' },
            { label: 'Less Then or Equals', value: ' <=' },
            { label: 'Greater Then', value: ' >' },
            { label: 'Greater Then or Equals', value: ' >=' },
            { label: 'In', value: ' IN' },
            { label: 'Not In', value: ' NOT IN' },
            { label: 'Like', value: ' LIKE' }
        ];  
    }
    // @description : list of and / or to be used in making where clause
    get andOr(){
        return [
            { label: 'And', value: ' AND' },
            { label: 'Or', value: ' OR' },
            { label: '', value: '' }
        ];
    }
    /**
     * @description : this will add element to the list numberOfWhere which is used to iterate specific times to show number of rows to form where clause condition
     * @param {*} event 
     */
    handleAddMoreWhere(event){
        try {
            this.numberOfWhere.push(this.whereCounter++);
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Some Problem Occured , Please Try Again Later.',
                message: error,
                variant: 'error',
            }));
        }
    }
    /**
     * @description : this is to help getQuery method to make where clause query
     * @returns String having Where Clause query
     */
    buildWhereClause(){
        var whereClause='';
        const allWhere=this.template.querySelectorAll('.WhereQuery');
        if(allWhere){
            for(var i = 0;i < allWhere.length;i+=4 ){
                if(allWhere[i].value && allWhere[i+1].value && allWhere[i+2].value && allWhere[i+3].value != undefined ){
                    var open=' ';
                    var close=' ';
                    if(allWhere[i+1].value === ' IN' || allWhere[i+1].value ===' NOT IN' ){
                        open=' ( ';
                        close=' ) ';
                    }else{
                        open=' \'';
                        close='\' ';
                    }
                    whereClause = whereClause + ' ' + allWhere[i].value + ' ' + allWhere[i+1].value + open + allWhere[i+2].value + close + allWhere[i+3].value;                    
                }
            }
            if(whereClause.endsWith("AND")){
                whereClause= whereClause.substring(0,whereClause.length-3);
            } else if(whereClause.endsWith("OR")){
                whereClause= whereClause.substring(0,whereClause.length-2);
            }
        }
        return whereClause;
    }
    // order by : @description : this is called everytime a field is selected in order by Combobox and adds value to orderby
    handleOrderBy(event){
        this.orderBy=event.detail.value;
    }
    // @description : this is called everytime a value is selected in Place Null Combobox and adds value to null order
    handlePlaceNull(event){
        this.nullOrder=event.detail.value;
    }
    // @description : this is called everytime a field is selected in sort Combobox and adds value to sortOrder
    handleSortOrder(event){
        this.sortOrder=event.detail.value;
    }

    //@description : possible ways to sort
    get sortOrders(){
        return [
            { label: 'Ascending', value: ' ASC' },
            { label: 'Descending', value: ' DESC' }
        ];
    }
    
    //@description : possible ways to show null fields
    get placeNull(){
        return [
            { label: 'Null First', value: ' NULLS FIRST' },
            { label: 'Null Last', value: ' NULLS LAST' }
        ];
    }
    // Group By : @description : it is called everytime some value if selected in group by combobox
     aggrFunc='';
     aggrField='';
     groupingField='';
     aggrResult='';
     get aggregateFunctions(){
         return [
             { label: 'AVG', value: ' AVG(' },
             { label: 'COUNT', value: ' COUNT(' },
             { label: 'MIN', value: ' MIN(' },
             { label: 'MAX', value: ' MAX(' },
             { label: 'SUM', value: ' SUM(' },
             { label: 'COUNT_DISTINCT', value: ' COUNT_DISTINCT(' }
         ];
     }
    handleAggregateFunction(event){
        this.aggrFunc=event.detail.value;
    }
    handleAggregateFunctionField(event){
        this.aggrField=event.detail.value;
    }
    handleGroupingField(event){
        this.groupingField=event.detail.value;
    }
    handleAggrFire(event){
        try {
            this.query='';
            var finalQuery=this.getQuery()+'';
            if(finalQuery.length < 1 ){
                return;
            }
                const payload = { 
                    field: this.groupingField,
                    query: finalQuery
                  };
                publish(this.messageContext, Pie_Chart, payload);
            
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Some Problem Occured , Please Try Again.',
                message: error,
                variant: 'error',
            }));        
        }
    }
    handleGroupBy(event){
        this.groupBy=event.detail.value;
    }

    //LIMIT @description : this is called everytime some value is entered in Max Records Input box and stores entered value to totalNumberOfRows
    handleTotalNumberOfRows(event){
        try{
            this.totalNumberOfRows=event.detail.value;
        }catch(exception){
            this.dispatchEvent(new ShowToastEvent({
                title: 'Some Problem Occured , Please Try Again Later.',
                message: exception,
                variant: 'error',
            }));        
        }   
    }
    /**
     * @description : check validity of max number of rows provided by user
     * @returns : true is the value entered in limit is valid i.e. is number and greater then 0
     */
    checkTotalNumberOfRows(){
        try{
            var maxRows=parseInt(this.totalNumberOfRows);
            if(maxRows > 0){
                this.totalNumberOfRows=maxRows;
            }else{
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Some Problem Occured , Please Try Again.',
                    message: 'Max limit could not be less then 1, entered '+this.totalNumberOfRows,
                    variant: 'error',
                }));
                return false;
            }
            return true;
        }catch(exception){
            this.dispatchEvent(new ShowToastEvent({
                title: 'Some Problem Occured , Please Try Again.',
                message: 'Please enter a valid max limit , entered '+this.totalNumberOfRows,
                variant: 'error',
            }));
            return false;
        }
    }
    //Data Table Sorting : @description : this method will help the onHandleSort method in sorting values 
    sortBy(field, reverse, primer) {
        try {
            const key = primer
            ? function(x) {
                return primer(x[field]);
            }
            : function(x) {
                return x[field];
            };
            return function(a, b) {
                a = key(a);
                b = key(b);
                return reverse * ((a > b) - (b > a));
            };
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Some Problem Occured , Please Try Again.',
                message: error,
                variant: 'error',
            }));        
        }
    }
    //@description : this is called everytime user click on column name to sort the values 
    onHandleSort(event) {
        try {
            const { fieldName: sortedBy, sortDirection } = event.detail;
            const cloneData = [...this.queryResult];
            cloneData.sort(this.sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1));
            this.queryResult = cloneData;
            this.sortDirection = sortDirection;
            this.sortedBy = sortedBy;
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Some Problem Occured , Please Try Again.',
                message: error,
                variant: 'error',
            }));
        }
    }
}