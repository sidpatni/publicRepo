import { LightningElement, wire , track,api } from 'lwc';
//import getOpportunities from '@salesforce/apex/GEN_ChartController.getOpportunities';
import makeAggregateQuery from '@salesforce/apex/ObjectDetails.makeAggregateQuery';
import { subscribe, MessageContext } from 'lightning/messageService';
import Pie_Chart from '@salesforce/messageChannel/Pie_Chart__c';
import chartjs from '@salesforce/resourceUrl/ChartJs';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class Gen_opportunitychart extends LightningElement {
    chartConfiguration;
    @track field;
    @track query;
    @wire(MessageContext)
        messageContext;
    
    connectedCallback(){
        console.log('heya! new pie chart component is created');
        this.subscribeToMessageChannel();
    }
    renderedCallback(){
        console.log('rendered callback called ')
        this.subscribeToMessageChannel(); 
    }
    subscribeToMessageChannel() {
        this.subscription = subscribe(
        this.messageContext,
        Pie_Chart,
        (message) => this.handleMessage(message)
        );
    }
    
    handleMessage(message) {
        this.field = message.field;
        this.query = message.query;
        console.log('field =>'+this.field);
        console.log('query=>'+this.query);
        this.reload();
    }
    reload(){
        try { 
            if(this.chart){
                console.log('destroing ');
                this.chart.destroy();
            }
            makeAggregateQuery({query: this.query ,field : this.field })
            .then(data => {
                let chartAmtData = [];
                let chartLabel = [];
                data.forEach(opp => {
                    chartAmtData.push(opp.expr);
                    console.log(opp.expr);
                    chartLabel.push(opp.field);
                });
                this.chartConfiguration = {
                    type: 'doughnut',
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
                console.log('data => ', data);
                this.error = undefined;
            })
            .catch(error => {
                
                this.error = error;
                this.chartConfiguration = undefined;
            });
            Promise.all([loadScript(this, chartjs)])
            .then(() => {
                this.isChartJsInitialized = true;
                const ctx = this.template.querySelector('canvas.barChart').getContext('2d');
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
            console.log('error : '+error);
        }
    }
    /*
    @wire(makeAggregateQuery, { query: '$query' ,field : '$field' })
    makeAggregateQuery({ error, data }) {
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
            console.log('data => ', data);
            this.error = undefined;
         }
    }*/
}