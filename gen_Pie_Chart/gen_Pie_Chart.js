/**
 * @author : Siddharth Patni
 * @description : this will make pie chart for Aggregated query
 */
import { LightningElement, wire , track,api } from 'lwc';
import makeAggregateQuery from '@salesforce/apex/ObjectDetails.makeAggregateQuery';
import { subscribe, MessageContext } from 'lightning/messageService';
import Pie_Chart from '@salesforce/messageChannel/Pie_Chart__c';
import ChartJs from '@salesforce/resourceUrl/ChartJs';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class Gen_Pie_Chart extends LightningElement {
    chartConfiguration;
    @track field;
    @track query;
    @wire(MessageContext)
        messageContext;
    hasData=false;
    
    connectedCallback(){
        try {
            this.subscribeToMessageChannel();
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Some Problem Occured , Please Try Again.',
                message: error,
                variant: 'error',
            }));            
        }
    }
    renderedCallback(){
        try {
            this.subscribeToMessageChannel();
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Some Problem Occured , Please Try Again.',
                message: error,
                variant: 'error',
            }));            
        } 
    }
    //@description method under rendered callback
    subscribeToMessageChannel() {
        try {
            this.subscription = subscribe(
                this.messageContext,
                Pie_Chart,
                (message) => this.handleMessage(message)
                );
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Some Problem Occured , Please Try Again.',
                message: error,
                variant: 'error',
            }));            
        }
    }
    /**
     * @description Method under subscribeToMessageChannel
     * @param {*} message 
     */
    handleMessage(message) {
        try {
            this.hasData=true;
            this.field = message.field;
            this.query = message.query;
            if(this.chart){
                this.chart.destroy();
            }
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Some Problem Occured , Please Try Again.',
                message: error,
                variant: 'error',
            }));            
        }
        
    }
    //@description wired to apex gets result of aggregated query
    @wire(makeAggregateQuery, { query: '$query' ,field : '$field' })
    makeAggregateQuery({ error, data }) {
        try {
            if (error) {
                this.error = error;
                this.chartConfiguration = undefined;
            } else if (data) {
                let chartAmtData = [];
                let chartLabel = [];
                data.forEach(opp => {
                    chartAmtData.push(opp.expr);
                    console.log(opp.expr);
                    chartLabel.push(opp.field);
                });
                this.chartConfiguration = {
                    type: 'pie',
                    data: {
                        datasets: [
                            {
                                label: this.field,
                                backgroundColor:  [
                                    "#CDA776",
                                    "#989898",
                                    "#CB252B",
                                    "#E39371",
                                    "#1D7A46",

                                    "#D3212D",
                                    "#FFBF00",
                                    "#3DDC84",
                                    "#8DB600",
                                    "#008000",

                                    "#A1CAF1",
                                    "#F4C2C2",
                                    "#9F8170",
                                    "#FFE4C4",
                                    "#660000",
                                ],
                                data: chartAmtData,
                            },
                        ],
                        labels: chartLabel,
                    },
                    options: {},
                };
                this.error = undefined;
                this.promiseMaker();
            }
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Some Problem Occured , Please Try Again.',
                message: error,
                variant: 'error',
            }));            
        }
    }
    //@description adds chart to canvas 
    promiseMaker(){
        try {
            Promise.all([loadScript(this, ChartJs)])
            .then(() => {
                this.isChartJsInitialized = true;
                const ctx = this.template.querySelector('canvas.pieChart').getContext('2d');
                this.chart = new window.Chart(ctx, JSON.parse(JSON.stringify(this.chartConfiguration)));
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({ 
                        title: 'Error loading Chart',
                        message: error.message,
                        variant: 'error',
                    })
                );
            });
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Some Problem Occured , Please Try Again.',
                message: error,
                variant: 'error',
            }));            
        }
    }
}